import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  CheckCircle2,
  Truck,
  PackageCheck,
  Clock,
  AlertCircle,
  Info,
  X,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export type ToastType = "cart" | "order_confirmed" | "delivery_status" | "success" | "info" | "warning" | "error";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  product?: {
    name: string;
    image?: string;
    price: number;
    quantity?: number;
  };
  order?: {
    id: number | string;
    total?: number;
    status?: string;
    statusLabel?: string;
  };
  actionLabel?: string;
  onAction?: () => void;
  duration?: number; // ms
  createdAt: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id" | "createdAt">) => void;
  removeToast: (id: string) => void;
  showCartToast: (product: { name: string; image?: string; price: number }, quantity?: number, onViewCart?: () => void) => void;
  showOrderConfirmedToast: (orderId: number | string, total: number, onViewOrders?: () => void) => void;
  showDeliveryStatusToast: (orderId: number | string, newStatus: string, statusLabel?: string, onViewOrders?: () => void) => void;
  showSuccessToast: (title: string, description?: string) => void;
  showInfoToast: (title: string, description?: string) => void;
  showErrorToast: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastMessage, "id" | "createdAt">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const duration = toast.duration ?? (toast.type === "order_confirmed" || toast.type === "delivery_status" ? 6000 : 4000);
      
      const newToast: ToastMessage = {
        ...toast,
        id,
        duration,
        createdAt: Date.now(),
      };

      setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const showCartToast = useCallback(
    (product: { name: string; image?: string; price: number }, quantity: number = 1, onViewCart?: () => void) => {
      addToast({
        type: "cart",
        title: "¡Añadido al carrito!",
        description: `${quantity}x ${product.name}`,
        product: { ...product, quantity },
        actionLabel: "Ver Carrito",
        onAction: onViewCart,
        duration: 3800,
      });
    },
    [addToast]
  );

  const showOrderConfirmedToast = useCallback(
    (orderId: number | string, total: number, onViewOrders?: () => void) => {
      addToast({
        type: "order_confirmed",
        title: `¡Pedido #${orderId} Confirmado!`,
        description: `Tu orden por $${total.toFixed(2)} se ha registrado correctamente y está en proceso.`,
        order: { id: orderId, total, status: "confirmed", statusLabel: "Confirmado" },
        actionLabel: "Ver Pedidos",
        onAction: onViewOrders,
        duration: 7000,
      });
    },
    [addToast]
  );

  const showDeliveryStatusToast = useCallback(
    (orderId: number | string, newStatus: string, statusLabel?: string, onViewOrders?: () => void) => {
      const statusLabels: Record<string, string> = {
        pending: "Pendiente de Confirmación",
        confirmed: "Pedido Confirmado",
        preparing: "En Preparación en Almacén",
        shipped: "¡En Camino con Repartidor!",
        delivered: "¡Entregado con Éxito!",
        cancelled: "Pedido Cancelado",
      };

      const displayLabel = statusLabel || statusLabels[newStatus] || newStatus;

      addToast({
        type: "delivery_status",
        title: `Pedido #${orderId}: ${displayLabel}`,
        description: `El estado de entrega de tu pedido ha cambiado a: ${displayLabel}`,
        order: { id: orderId, status: newStatus, statusLabel: displayLabel },
        actionLabel: "Seguimiento",
        onAction: onViewOrders,
        duration: 6500,
      });
    },
    [addToast]
  );

  const showSuccessToast = useCallback(
    (title: string, description?: string) => {
      addToast({ type: "success", title, description, duration: 4000 });
    },
    [addToast]
  );

  const showInfoToast = useCallback(
    (title: string, description?: string) => {
      addToast({ type: "info", title, description, duration: 4000 });
    },
    [addToast]
  );

  const showErrorToast = useCallback(
    (title: string, description?: string) => {
      addToast({ type: "error", title, description, duration: 5000 });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        showCartToast,
        showOrderConfirmedToast,
        showDeliveryStatusToast,
        showSuccessToast,
        showInfoToast,
        showErrorToast,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC<{ toasts: ToastMessage[]; onRemove: (id: string) => void }> = ({
  toasts,
  onRemove,
}) => {
  return (
    <aside aria-label="Notificaciones del sistema" className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </aside>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({
  toast,
  onRemove,
}) => {
  const getIcon = () => {
    switch (toast.type) {
      case "cart":
        return <ShoppingBag className="size-5 text-emerald-400 shrink-0" />;
      case "order_confirmed":
        return <CheckCircle2 className="size-5 text-amber-400 shrink-0" />;
      case "delivery_status":
        if (toast.order?.status === "shipped") return <Truck className="size-5 text-sky-400 shrink-0 animate-bounce" />;
        if (toast.order?.status === "delivered") return <PackageCheck className="size-5 text-emerald-400 shrink-0" />;
        return <Clock className="size-5 text-amber-400 shrink-0" />;
      case "success":
        return <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />;
      case "error":
        return <AlertCircle className="size-5 text-rose-400 shrink-0" />;
      case "warning":
        return <AlertCircle className="size-5 text-amber-400 shrink-0" />;
      case "info":
      default:
        return <Info className="size-5 text-cyan-400 shrink-0" />;
    }
  };

  const getBorderBg = () => {
    switch (toast.type) {
      case "cart":
        return "bg-slate-900/95 border-emerald-500/30 text-white shadow-emerald-950/40 shadow-xl backdrop-blur-xl";
      case "order_confirmed":
        return "bg-slate-900/95 border-amber-500/40 text-white shadow-amber-950/40 shadow-xl backdrop-blur-xl";
      case "delivery_status":
        return "bg-slate-900/95 border-sky-500/40 text-white shadow-sky-950/40 shadow-xl backdrop-blur-xl";
      case "error":
        return "bg-slate-900/95 border-rose-500/40 text-white shadow-rose-950/40 shadow-xl backdrop-blur-xl";
      default:
        return "bg-slate-900/95 border-slate-700/60 text-white shadow-slate-950/40 shadow-xl backdrop-blur-xl";
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, x: 50 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border p-3.5 sm:p-4 shadow-2xl ${getBorderBg()}`}
    >
      {/* Top Subtle Gradient Glow */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-teal-400 opacity-80" />

      <div className="flex items-start gap-3">
        {/* Toast Custom Image or Icon */}
        {toast.product?.image ? (
          <div className="relative size-11 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-white/10 grid place-items-center">
            <img
              src={toast.product.image}
              alt={toast.product.name}
              className="size-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-0.5 rounded-md shadow-xs">
              <ShoppingBag className="size-3 font-bold" />
            </div>
          </div>
        ) : (
          <div className="size-10 rounded-xl bg-slate-800/80 border border-white/10 grid place-items-center shrink-0">
            {getIcon()}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs sm:text-sm font-bold tracking-tight text-white truncate">
              {toast.title}
            </h4>
            {toast.type === "order_confirmed" && (
              <Sparkles className="size-3 text-amber-400 shrink-0 animate-pulse" />
            )}
          </div>

          {toast.description && (
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
              {toast.description}
            </p>
          )}

          {/* Action button if provided */}
          {toast.onAction && toast.actionLabel && (
            <button
              onClick={() => {
                toast.onAction?.();
                onRemove(toast.id);
              }}
              className="mt-2 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors group cursor-pointer"
            >
              <span>{toast.actionLabel}</span>
              <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => onRemove(toast.id)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          aria-label="Cerrar notificación"
        >
          <X className="size-4" />
        </button>
      </div>
    </motion.div>
  );
};
