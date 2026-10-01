import React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Package,
} from "lucide-react";
import { PaymentStatus as StatusType, PaymentProvider } from "@/types/payment";

interface PaymentStatusProps {
  status: StatusType;
  orderId?: number;
  provider?: PaymentProvider;
  amount?: number;
  errorMessage?: string | null;
  onRetry: () => void;
  onClose: () => void;
  onViewOrders?: () => void;
}

export const PaymentStatusView: React.FC<PaymentStatusProps> = ({
  status,
  orderId,
  provider,
  amount,
  errorMessage,
  onRetry,
  onClose,
  onViewOrders,
}) => {
  const getProviderName = (p?: PaymentProvider) => {
    switch (p) {
      case "paypal":
        return "PayPal Checkout";
      case "google_pay":
        return "Google Pay";
      case "stripe":
      default:
        return "Tarjeta (Stripe)";
    }
  };

  if (status === "processing") {
    return (
      <div className="py-10 px-4 text-center space-y-5 animate-in fade-in zoom-in-95">
        <div className="relative size-20 mx-auto grid place-items-center">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <Loader2 className="size-8 text-emerald-600 animate-spin" />
        </div>

        <div>
          <h3 className="text-xl font-black text-brand-deep">Procesando Pago Seguro</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Por favor no recargues ni cierres esta ventana mientras confirmamos la transacción con la pasarela bancaria.
          </p>
        </div>

        <div className="max-w-xs mx-auto p-3.5 rounded-2xl bg-white/80 border border-white/90 text-left text-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-700 font-bold">
            <CheckCircle2 className="size-3.5" />
            <span>Precios y stock validados</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-700 font-bold">
            <CheckCircle2 className="size-3.5" />
            <span>Orden generada en Supabase</span>
          </div>
          <div className="flex items-center gap-2 text-amber-600 font-bold animate-pulse">
            <Loader2 className="size-3.5 animate-spin" />
            <span>Confirmando autorización de cobro...</span>
          </div>
        </div>
      </div>
    );
  }

  if (status === "paid") {
    return (
      <div className="py-8 px-4 text-center space-y-6 animate-in fade-in zoom-in-95">
        <div className="size-20 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 grid place-items-center mx-auto shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="size-10 text-emerald-600" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-black uppercase tracking-wider mb-2">
            <ShieldCheck className="size-3.5" /> Pago Confirmado
          </span>
          <h3 className="text-2xl font-black text-brand-deep">¡Gracias por tu compra!</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Tu pedido ha sido verificado y registrado exitosamente en nuestro sistema.
          </p>
        </div>

        {/* Order Receipt Box */}
        <div className="max-w-md mx-auto p-4 rounded-3xl bg-white/90 border border-white text-left text-xs space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-muted-foreground font-semibold">Número de Pedido:</span>
            <span className="font-mono font-black text-brand-deep text-sm">#{orderId || "---"}</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-muted-foreground font-semibold">Método de Pago:</span>
            <span className="font-bold text-brand-deep">{getProviderName(provider)}</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-muted-foreground font-semibold">Importe Total:</span>
            <span className="font-mono font-black text-emerald-700 text-base">
              ${amount ? amount.toFixed(2) : "0.00"} USD
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-semibold">Estado de Envío:</span>
            <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-[11px]">
              <Package className="size-3" /> En preparación
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onViewOrders && (
            <button
              type="button"
              onClick={onViewOrders}
              className="w-full sm:w-auto px-6 h-12 rounded-2xl bg-white border border-slate-200 text-brand-deep font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
            >
              Ver en Mis Pedidos
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-8 h-12 rounded-2xl bg-primary text-white font-black text-xs shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="size-4" />
            <span>Seguir Comprando</span>
          </button>
        </div>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="py-8 px-4 text-center space-y-5 animate-in fade-in zoom-in-95">
        <div className="size-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 grid place-items-center mx-auto">
          <AlertTriangle className="size-8 text-amber-600" />
        </div>

        <div>
          <h3 className="text-xl font-black text-brand-deep">Pago Cancelado</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Cancelaste la autorización en la pasarela. No se ha realizado ningún cobro en tu cuenta.
          </p>
        </div>

        <div className="pt-2 flex justify-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="px-6 h-11 rounded-2xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary/90 transition-all cursor-pointer"
          >
            Reintentar Pago
          </button>
        </div>
      </div>
    );
  }

  // Failed state
  return (
    <div className="py-8 px-4 text-center space-y-5 animate-in fade-in zoom-in-95">
      <div className="size-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 grid place-items-center mx-auto">
        <XCircle className="size-8 text-rose-600" />
      </div>

      <div>
        <h3 className="text-xl font-black text-brand-deep">No se pudo procesar tu pago</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          {errorMessage || "Tu pedido no ha sido confirmado. Por favor revisa los datos e intenta nuevamente."}
        </p>
      </div>

      <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 text-rose-900 text-xs text-left max-w-sm mx-auto">
        <p className="font-bold">Recomendaciones:</p>
        <ul className="list-disc list-inside text-[11px] text-rose-800 mt-1 space-y-0.5">
          <li>Verifica que tu tarjeta cuente con fondos suficientes y esté habilitada para compras online.</li>
          <li>Puedes elegir otro método de pago como PayPal o Google Pay.</li>
        </ul>
      </div>

      <div className="pt-2 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="px-6 h-11 rounded-2xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="size-3.5" />
          <span>Intentar con otro método</span>
        </button>
      </div>
    </div>
  );
};
