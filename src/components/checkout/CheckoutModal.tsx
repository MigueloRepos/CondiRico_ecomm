import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  ShoppingBag,
  ShieldCheck,
  MapPin,
  User,
  Phone,
  Mail,
  Building,
  Navigation,
  ChevronRight,
  ArrowLeft,
  Truck,
  Lock,
} from "lucide-react";
import { ProductItem } from "@/data/products";
import { UserProfile } from "@/lib/auth";
import { PaymentMethods } from "@/components/checkout/PaymentMethods";
import { PaymentStatusView } from "@/components/checkout/PaymentStatus";
import { PaymentProvider, PaymentStatus } from "@/types/payment";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Record<number, number>;
  productsList: ProductItem[];
  currentUser?: UserProfile | null;
  onClearCart?: () => void;
  onViewOrders?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  productsList,
  currentUser,
  onClearCart,
  onViewOrders,
}) => {
  // Steps: 'shipping' | 'payment' | 'status'
  const [step, setStep] = useState<"shipping" | "payment" | "status">("shipping");

  // Shipping & Contact form
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [address, setAddress] = useState(currentUser?.address || "");
  const [city, setCity] = useState(currentUser?.preferences?.city || "Santiago");
  const [deliveryInstructions, setDeliveryInstructions] = useState(
    currentUser?.preferences?.deliveryInstructions || ""
  );
  const [formError, setFormError] = useState<string | null>(null);

  // Payment status state
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [confirmedOrderId, setConfirmedOrderId] = useState<number | undefined>(undefined);
  const [activeProvider, setActiveProvider] = useState<PaymentProvider | undefined>(undefined);
  const [confirmedAmount, setConfirmedAmount] = useState<number | undefined>(undefined);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Sync with currentUser
  useEffect(() => {
    if (currentUser) {
      if (!name && currentUser.name) setName(currentUser.name);
      if (!email && currentUser.email) setEmail(currentUser.email);
      if (!phone && currentUser.phone) setPhone(currentUser.phone);
      if (!address && currentUser.address) setAddress(currentUser.address);
      if (currentUser.preferences?.city) setCity(currentUser.preferences.city);
      if (currentUser.preferences?.deliveryInstructions) {
        setDeliveryInstructions(currentUser.preferences.deliveryInstructions);
      }
    }
  }, [currentUser]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setStep("shipping");
      setPaymentStatus("pending");
      setPaymentError(null);
    }
  }, [isOpen]);

  // Filter items in cart
  const cartItems = useMemo(() => {
    return productsList
      .filter((p) => cart[p.id] && cart[p.id] > 0)
      .map((p) => ({
        product: p,
        quantity: cart[p.id],
        subtotal: p.price * cart[p.id],
      }));
  }, [cart, productsList]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  }, [cartItems]);

  const shipping = subtotal >= 30 ? 0 : 3.5;
  const total = subtotal + shipping;

  const cartCheckoutInput = useMemo(() => {
    return cartItems.map((i) => ({
      productId: i.product.id,
      quantity: i.quantity,
    }));
  }, [cartItems]);

  if (!isOpen) return null;

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Por favor ingresa tu nombre completo.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setFormError("Por favor ingresa un correo electrónico válido para tu recibo.");
      return;
    }
    if (!phone.trim()) {
      setFormError("Por favor indica un teléfono de contacto.");
      return;
    }
    if (!address.trim()) {
      setFormError("Por favor especifica la dirección de entrega.");
      return;
    }

    setStep("payment");
  };

  const handlePaymentStart = () => {
    setPaymentStatus("processing");
    setStep("status");
  };

  const handlePaymentSuccess = (orderId: number, provider: PaymentProvider, amount: number) => {
    setConfirmedOrderId(orderId);
    setActiveProvider(provider);
    setConfirmedAmount(amount);
    setPaymentStatus("paid");
    setStep("status");

    // Clear cart after successful transaction
    if (onClearCart) {
      onClearCart();
    }
  };

  const handlePaymentError = (errorMsg: string) => {
    setPaymentError(errorMsg);
    setPaymentStatus("failed");
    setStep("status");
  };

  const handlePaymentCancel = () => {
    setPaymentStatus("cancelled");
    setStep("status");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-[32px] border border-white/80 bg-white/95 shadow-2xl overflow-hidden text-brand-deep">
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white/60">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary/10 text-primary grid place-items-center">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-brand-deep">
                  {step === "status"
                    ? "Estado del Pedido"
                    : step === "payment"
                    ? "Método de Pago"
                    : "Finalizar Compra"}
                </h2>
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  USD
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {step === "status"
                  ? "Verificación en tiempo real"
                  : `Paso ${step === "shipping" ? "1 de 2: Entrega" : "2 de 2: Pago Seguro"}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-brand-deep grid place-items-center transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {cartItems.length === 0 && step !== "status" ? (
            <div className="py-12 text-center space-y-4">
              <div className="size-16 rounded-3xl bg-slate-100 grid place-items-center mx-auto text-slate-400">
                <ShoppingBag className="size-8" />
              </div>
              <div>
                <h3 className="text-base font-black text-brand-deep">Tu carrito está vacío</h3>
                <p className="text-xs text-muted-foreground mt-1">Agrega productos frescos y de despensa antes de finalizar tu compra.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-6 h-11 rounded-2xl bg-primary text-white text-xs font-black shadow-md hover:bg-primary/90 cursor-pointer"
              >
                Explorar Productos
              </button>
            </div>
          ) : (
            <>
              {/* Order Brief Summary Bar (visible in shipping & payment steps) */}
              {step !== "status" && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-brand-deep">
                      <ShoppingBag className="size-4 text-primary" />
                      <span>Resumen del Carrito ({cartItems.length} {cartItems.length === 1 ? "artículo" : "artículos"})</span>
                    </span>
                    <span className="font-mono text-sm text-primary font-black">
                      ${total.toFixed(2)} USD
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-slate-200/60">
                    <span>Subtotal: ${subtotal.toFixed(2)}</span>
                    <span>
                      Envío: {shipping === 0 ? <strong className="text-emerald-700">¡GRATIS!</strong> : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              )}

              {/* STEP 1: SHIPPING & CONTACT DETAILS */}
              {step === "shipping" && (
            <form onSubmit={handleProceedToPayment} className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <span className="grid size-5 place-items-center rounded-full bg-primary text-white text-[10px] font-black">
                  1
                </span>
                <h3 className="text-xs font-black text-brand-deep uppercase tracking-wider">
                  Datos de Contacto y Entrega
                </h3>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-brand-deep mb-1">Nombre Completo *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:ring-2 focus:ring-primary/20 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-deep mb-1">Correo Electrónico (Recibo) *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="juan@ejemplo.com"
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:ring-2 focus:ring-primary/20 font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-brand-deep mb-1">Teléfono Móvil / WhatsApp *</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+56 9 1234 5678 / +53 5 1234567"
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:ring-2 focus:ring-primary/20 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-deep mb-1">Ciudad / Comuna *</label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Santiago, Las Condes..."
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:ring-2 focus:ring-primary/20 font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-deep mb-1">Dirección de Entrega (Calle, Nº, Depto) *</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ej. Av. Providencia 1234, Depto 402"
                    className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:ring-2 focus:ring-primary/20 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-deep mb-1">Instrucciones de Reparto (Opcional)</label>
                <textarea
                  rows={2}
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="Ej: Dejar en conserjería o timbre 402..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:ring-2 focus:ring-primary/20 resize-none font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 h-12 rounded-2xl bg-primary text-white font-black text-xs shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continuar al Pago Seguro</span>
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: PAYMENT METHOD SELECTION (PAYPAL, STRIPE, GOOGLE PAY) */}
          {step === "payment" && (
            <div className="space-y-4 animate-in fade-in">
              <button
                type="button"
                onClick={() => setStep("shipping")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer mb-1"
              >
                <ArrowLeft className="size-3.5" />
                <span>Modificar datos de entrega</span>
              </button>

              <PaymentMethods
                cartItems={cartCheckoutInput}
                customerName={name}
                customerEmail={email}
                customerPhone={phone}
                shippingAddress={address}
                shippingCity={city}
                deliveryInstructions={deliveryInstructions}
                totalEstimated={total}
                onPaymentStart={handlePaymentStart}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                onPaymentCancel={handlePaymentCancel}
              />
            </div>
          )}

              {/* STEP 3: PAYMENT STATUS / CONFIRMATION */}
              {step === "status" && (
                <PaymentStatusView
                  status={paymentStatus}
                  orderId={confirmedOrderId}
                  provider={activeProvider}
                  amount={confirmedAmount || total}
                  errorMessage={paymentError}
                  onRetry={() => {
                    setStep("payment");
                    setPaymentStatus("pending");
                    setPaymentError(null);
                  }}
                  onClose={onClose}
                  onViewOrders={() => {
                    onClose();
                    if (onViewOrders) {
                      onViewOrders();
                    }
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
