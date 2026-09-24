import React, { useState, useMemo } from "react";
import {
  X,
  Check,
  Copy,
  MapPin,
  User,
  CreditCard,
  FileText,
  Truck,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { ALL_PRODUCTS } from "@/data/products";

interface WhatsAppOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Record<number, number>;
  onClearCart?: () => void;
  phoneNumber?: string; // e.g. "34600123456" or "18002663474"
}

export const WhatsAppOrderModal: React.FC<WhatsAppOrderModalProps> = ({
  isOpen,
  onClose,
  cart,
  onClearCart,
  phoneNumber = "34600123456",
}) => {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Efectivo contra entrega");
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [sentOrder, setSentOrder] = useState(false);

  // Filter items in cart
  const cartItems = useMemo(() => {
    return ALL_PRODUCTS.filter((p) => cart[p.id] && cart[p.id] > 0).map((p) => ({
      product: p,
      quantity: cart[p.id],
      subtotal: p.price * cart[p.id],
    }));
  }, [cart]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  }, [cartItems]);

  const shipping = subtotal >= 35 ? 0 : 3.5;
  const total = subtotal + shipping;

  // Build the formatted WhatsApp message text
  const messageText = useMemo(() => {
    let msg = `🛒 *NUEVO PEDIDO CONDIRICO* 🛒\n\n`;
    msg += `👋 ¡Hola CondiRico! Deseo confirmar el siguiente pedido:\n\n`;
    msg += `📋 *PRODUCTOS SOLICITADOS:*\n`;

    cartItems.forEach((item, index) => {
      msg += `${index + 1}. *${item.quantity}x* ${item.product.name} (${item.product.detail}) — $${item.subtotal.toFixed(2)}\n`;
    });

    msg += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📦 *Subtotal:* $${subtotal.toFixed(2)}\n`;
    msg += `🚚 *Envío:* ${shipping === 0 ? "¡GRATIS!" : `$${shipping.toFixed(2)}`}\n`;
    msg += `💰 *TOTAL A PAGAR:* $${total.toFixed(2)}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    msg += `📍 *DATOS PARA LA ENTREGA:*\n`;
    msg += `• *Cliente:* ${name.trim() || "(Por indicar)"}\n`;
    msg += `• *Dirección:* ${address.trim() || "(Por indicar)"}\n`;
    if (phone.trim()) {
      msg += `• *Teléfono contacto:* ${phone.trim()}\n`;
    }
    msg += `• *Método de pago:* ${paymentMethod}\n`;
    if (notes.trim()) {
      msg += `• *Notas / Indicaciones:* ${notes.trim()}\n`;
    }

    msg += `\n¿Me confirman la disponibilidad y tiempo estimado de entrega? ¡Muchas gracias!`;
    return msg;
  }, [cartItems, subtotal, shipping, total, name, address, phone, paymentMethod, notes]);

  const whatsappUrl = useMemo(() => {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
  }, [phoneNumber, messageText]);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendToWhatsApp = () => {
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setSentOrder(true);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md transition-opacity duration-300 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-[32px] liquid-glass-dock p-5 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.25)] animate-in fade-in zoom-in-95 duration-300 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 grid size-9 place-items-center rounded-full bg-white/80 border border-white text-muted-foreground shadow-xs active:scale-90 hover:bg-white"
          aria-label="Cerrar ventana de pedido"
        >
          <X className="size-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 border-b border-white/60 pb-5">
          <div className="grid size-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30 shrink-0">
            <WhatsAppIcon className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest">
                Pedidos por WhatsApp
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                Rápido y directo
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-black text-brand-deep tracking-tight">
              Completa tu Pedido
            </h2>
          </div>
        </div>

        {sentOrder ? (
          /* Confirmation State after clicking Send */
          <div className="py-8 text-center animate-in fade-in">
            <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
              <Check className="size-8" />
            </div>
            <h3 className="mt-4 text-2xl font-black text-brand-deep">
              ¡Tu pedido fue enviado a WhatsApp!
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Hemos abierto tu chat con <strong>CondiRico</strong> con el resumen de tu compra listo. Nuestro equipo te responderá enseguida para confirmar el despacho.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (onClearCart) onClearCart();
                  onClose();
                }}
                className="h-11 rounded-full bg-primary px-6 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 liquid-glass-button"
              >
                Vaciar carrito y volver a la tienda
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-11 rounded-full border border-white/80 bg-white/80 px-6 text-xs font-bold text-foreground shadow-xs hover:bg-white"
              >
                Mantener productos y cerrar
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            {/* 1. Resumen de compra */}
            <div className="rounded-2xl liquid-glass-card p-4">
              <div className="flex items-center justify-between border-b border-white/60 pb-2.5 text-xs font-bold text-muted-foreground">
                <span>Resumen de artículos ({cartItems.length})</span>
                <span className="text-primary font-black text-sm">
                  Total: ${total.toFixed(2)}
                </span>
              </div>

              <div className="mt-3 max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between py-1 border-b border-white/40 last:border-0"
                  >
                    <div className="truncate pr-2">
                      <strong className="text-foreground font-bold">
                        {item.quantity}x
                      </strong>{" "}
                      <span className="text-muted-foreground">
                        {item.product.name}
                      </span>
                    </div>
                    <span className="font-bold text-foreground shrink-0">
                      ${item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/60 flex items-center justify-between text-xs text-muted-foreground">
                <span>Costo de envío:</span>
                <span className="font-bold text-emerald-600">
                  {shipping === 0 ? "¡Gratis!" : `$${shipping.toFixed(2)}`}
                </span>
              </div>
            </div>

            {/* 2. Formulario de Datos para Entrega */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin className="size-3.5 text-offer" />
                <span>Datos para la Entrega a Domicilio</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Tu Nombre y Apellido *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      required
                      type="text"
                      placeholder="Ej. Carolina Pérez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 w-full rounded-xl border border-white/80 bg-white/80 pl-10 pr-3 text-xs outline-none backdrop-blur-md shadow-inner focus:bg-white focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Teléfono de Contacto (Opcional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+34 600 000 000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11 w-full rounded-xl border border-white/80 bg-white/80 px-3.5 text-xs outline-none backdrop-blur-md shadow-inner focus:bg-white focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Dirección Completa de Entrega *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Calle, número, portal, piso, puerta o referencia..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/80 bg-white/80 px-3.5 text-xs outline-none backdrop-blur-md shadow-inner focus:bg-white focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Método de Pago Preferido
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-11 w-full rounded-xl border border-white/80 bg-white/80 pl-10 pr-3 text-xs outline-none backdrop-blur-md shadow-inner focus:bg-white focus:ring-2 focus:ring-emerald-500/30"
                    >
                      <option value="Efectivo contra entrega">Efectivo contra entrega</option>
                      <option value="Bizum / Pago móvil previo">Bizum / Pago móvil previo</option>
                      <option value="Tarjeta al repartidor (TPV móvil)">Tarjeta al repartidor (TPV)</option>
                      <option value="Transferencia bancaria directa">Transferencia bancaria</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Notas o Instrucciones (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Llamar al timbre 4B, dejar con portero..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-11 w-full rounded-xl border border-white/80 bg-white/80 px-3.5 text-xs outline-none backdrop-blur-md shadow-inner focus:bg-white focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>
            </div>

            {/* 3. Previsualización del mensaje generado */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="size-3.5 text-emerald-600" />
                  <span>Mensaje que se enviará por WhatsApp</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="size-3 text-emerald-600" />
                      <span className="text-emerald-600">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      <span>Copiar texto</span>
                    </>
                  )}
                </button>
              </div>

              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3 text-[11px] font-mono leading-relaxed text-emerald-950 max-h-32 overflow-y-auto whitespace-pre-wrap select-all shadow-inner">
                {messageText}
              </div>
            </div>

            {/* 4. Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleSendToWhatsApp}
                className="flex-1 h-13 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-600/30 active:scale-98 transition-all"
              >
                <WhatsAppIcon className="size-5" />
                <span>Enviar Pedido a WhatsApp (${total.toFixed(2)})</span>
                <ExternalLink className="size-4 opacity-75" />
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="h-13 rounded-2xl border border-white/80 bg-white/80 px-5 text-xs font-bold text-foreground flex items-center justify-center gap-2 shadow-xs hover:bg-white active:scale-95"
              >
                {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                <span>{copied ? "Texto copiado" : "Copiar pedido"}</span>
              </button>
            </div>

            <p className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
              <span>🔒 Atención personalizada y confirmación en tiempo real por el equipo de CondiRico.</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
