import React, { useState, useEffect } from "react";
import {
  CreditCard,
  ShieldCheck,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";
import {
  PaymentProvider,
  PaymentMethodType,
  CartItemCheckoutInput,
  CreatePaymentOrderInput,
  PaymentPublicConfig,
} from "@/types/payment";
import {
  getPaymentConfig,
  generateIdempotencyKey,
} from "@/services/paymentService";
import { PayPalPayment } from "./PayPalPayment";
import { CardPayment } from "./CardPayment";
import { GooglePayPayment } from "./GooglePayPayment";

interface PaymentMethodsProps {
  cartItems: CartItemCheckoutInput[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity?: string;
  deliveryInstructions?: string | null;
  totalEstimated: number;
  onPaymentStart: () => void;
  onPaymentSuccess: (orderId: number, provider: PaymentProvider, amount: number) => void;
  onPaymentError: (errorMsg: string) => void;
  onPaymentCancel: () => void;
}

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({
  cartItems,
  customerName,
  customerEmail,
  customerPhone,
  shippingAddress,
  shippingCity,
  deliveryInstructions,
  totalEstimated,
  onPaymentStart,
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel,
}) => {
  const [config, setConfig] = useState<PaymentPublicConfig | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>("paypal");
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isGooglePayAvailable, setIsGooglePayAvailable] = useState<boolean>(false);

  // Load public payment config from server
  useEffect(() => {
    let isMounted = true;

    getPaymentConfig()
      .then((cfg) => {
        if (!isMounted) return;
        setConfig(cfg);

        // Check if browser/device supports Google Pay
        if (typeof window !== "undefined") {
          const isChromeOrAndroid = /Chrome|Android/i.test(navigator.userAgent) && !/Edg|OPR/i.test(navigator.userAgent);
          const hasPaymentRequest = Boolean(window.PaymentRequest);
          setIsGooglePayAvailable(Boolean(cfg.paypalClientId && (hasPaymentRequest || isChromeOrAndroid)));
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingConfig(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const orderInput: CreatePaymentOrderInput = {
    cartItems,
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    shippingCity,
    deliveryInstructions,
    provider: "paypal",
    paymentMethod: selectedMethod,
    idempotencyKey: generateIdempotencyKey("ord"),
  };

  if (isLoadingConfig || !config) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center">
        <Loader2 className="size-6 text-primary animate-spin mb-2" />
        <p className="text-xs text-muted-foreground font-semibold">Cargando pasarelas de pago seguras de PayPal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Payment Provider Selection Tabs */}
      <div>
        <label className="block text-xs font-black text-brand-deep uppercase tracking-wider mb-2.5">
          Selecciona tu Método de Pago
        </label>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Option 1: PayPal */}
          <button
            type="button"
            onClick={() => setSelectedMethod("paypal")}
            className={`p-3 sm:p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer relative ${
              selectedMethod === "paypal"
                ? "border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/30 text-blue-950 font-black shadow-xs"
                : "border-white/80 bg-white/70 hover:bg-white text-muted-foreground"
            }`}
          >
            <div className="flex items-center gap-1">
              <span className="text-blue-700 font-black text-sm italic">Pay</span>
              <span className="text-sky-500 font-black text-sm italic">Pal</span>
            </div>
            <span className="text-[10px] font-bold">PayPal / Saldo</span>
          </button>

          {/* Option 2: Tarjeta Débito / Crédito */}
          <button
            type="button"
            onClick={() => setSelectedMethod("card")}
            className={`p-3 sm:p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer relative ${
              selectedMethod === "card"
                ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/30 text-emerald-950 font-black shadow-xs"
                : "border-white/80 bg-white/70 hover:bg-white text-muted-foreground"
            }`}
          >
            <CreditCard className="size-5 text-emerald-600" />
            <span className="text-[10px] font-bold">Tarjeta Débito/Crédito</span>
          </button>

          {/* Option 3: Google Pay */}
          <button
            type="button"
            onClick={() => setSelectedMethod("google_pay")}
            className={`p-3 sm:p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer relative ${
              selectedMethod === "google_pay"
                ? "border-slate-800 bg-slate-900 text-white font-black shadow-xs"
                : "border-white/80 bg-white/70 hover:bg-white text-muted-foreground"
            }`}
          >
            <div className="flex items-center gap-1 font-black text-xs">
              <span className="text-sky-400">G</span>
              <span className="text-rose-400">o</span>
              <span className="text-amber-400">o</span>
              <span className="text-emerald-400">g</span>
              <span className="text-slate-300">le</span>
              <span className="text-slate-200 ml-0.5">Pay</span>
            </div>
            <span className="text-[10px] font-bold">Billetera Digital</span>
          </button>
        </div>
      </div>

      {/* Dynamic Selected Payment Component */}
      <div className="pt-2">
        {selectedMethod === "paypal" && (
          <PayPalPayment
            config={config}
            orderInput={orderInput}
            totalEstimated={totalEstimated}
            onPaymentStart={onPaymentStart}
            onPaymentSuccess={(oid, amt) => onPaymentSuccess(oid, "paypal", amt)}
            onPaymentError={onPaymentError}
            onPaymentCancel={onPaymentCancel}
          />
        )}

        {selectedMethod === "card" && (
          <CardPayment
            config={config}
            orderInput={orderInput}
            totalEstimated={totalEstimated}
            onPaymentStart={onPaymentStart}
            onPaymentSuccess={(oid, amt) => onPaymentSuccess(oid, "paypal", amt)}
            onPaymentError={onPaymentError}
            onPaymentCancel={onPaymentCancel}
          />
        )}

        {selectedMethod === "google_pay" && (
          <GooglePayPayment
            config={config}
            orderInput={orderInput}
            totalEstimated={totalEstimated}
            onPaymentStart={onPaymentStart}
            onPaymentSuccess={(oid, amt) => onPaymentSuccess(oid, "google_pay", amt)}
            onPaymentError={onPaymentError}
            onPaymentCancel={onPaymentCancel}
          />
        )}
      </div>

      {/* Security Trust Badges Footer */}
      <div className="pt-3 border-t border-white/60 flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
        <span className="flex items-center gap-1 text-emerald-800">
          <ShieldCheck className="size-3.5 text-emerald-600" />
          Procesamiento seguro certificado por PayPal & SSL
        </span>
        <span className="text-[10px] text-slate-500 font-mono">USD</span>
      </div>
    </div>
  );
};
