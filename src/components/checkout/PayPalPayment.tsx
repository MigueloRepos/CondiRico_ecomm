import React from "react";
import { AlertCircle, Lock, ShieldCheck } from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import {
  CreatePaymentOrderInput,
  PaymentPublicConfig,
} from "@/types/payment";
import {
  createPayPalOrder,
  capturePayPalOrder,
} from "@/services/paymentService";

interface PayPalPaymentProps {
  config: PaymentPublicConfig;
  orderInput: CreatePaymentOrderInput;
  totalEstimated: number;
  onPaymentStart: () => void;
  onPaymentSuccess: (orderId: number, amount: number, transactionId: string) => void;
  onPaymentError: (errorMsg: string) => void;
  onPaymentCancel: () => void;
}

export const PayPalPayment: React.FC<PayPalPaymentProps> = ({
  config,
  orderInput,
  onPaymentStart,
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel,
}) => {
  if (!config.paypalClientId) {
    return (
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-center space-y-2">
        <AlertCircle className="size-5 text-amber-600 mx-auto" />
        <p className="font-bold">PayPal en modo demostración / credenciales pendientes</p>
        <p className="text-[11px] text-amber-800">
          Configura <code>PAYPAL_CLIENT_ID</code> y <code>PAYPAL_CLIENT_SECRET</code> en el servidor para activar pagos directos en Sandbox o Producción.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 to-sky-50/90 border border-blue-200/80 space-y-1 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-blue-950 flex items-center gap-1.5">
            <Lock className="size-3.5 text-blue-600" /> PayPal Checkout Seguro
          </span>
          <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <ShieldCheck className="size-3" /> Protección 100%
          </span>
        </div>
        <p className="text-[11px] text-blue-800">
          Paga con tu saldo de PayPal, cuenta bancaria vinculada o financiamiento sin compartir tu información financiera.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-3 border border-slate-200 shadow-inner">
        <PayPalScriptProvider
          options={{
            clientId: config.paypalClientId,
            currency: config.paypalCurrency || "USD",
            intent: "capture",
            components: "buttons",
            enableFunding: "venmo,paylater",
          }}
        >
          <PayPalButtons
            fundingSource="paypal"
            style={{
              layout: "vertical",
              shape: "rect",
              color: "gold",
              height: 48,
              label: "checkout",
            }}
            createOrder={async () => {
              onPaymentStart();
              const res = await createPayPalOrder({
                ...orderInput,
                provider: "paypal",
                paymentMethod: "paypal",
              });

              if (!res.success || !res.paypalOrderId) {
                const errMsg = res.error || "No se pudo generar la orden de PayPal en el servidor.";
                onPaymentError(errMsg);
                throw new Error(errMsg);
              }
              return res.paypalOrderId;
            }}
            onApprove={async (data) => {
              onPaymentStart();
              try {
                const captureRes = await capturePayPalOrder(data.orderID, 0);
                if (captureRes.success) {
                  onPaymentSuccess(captureRes.orderId, captureRes.amount, captureRes.transactionId);
                } else {
                  onPaymentError(captureRes.error || "No se pudo confirmar la captura del pago con PayPal.");
                }
              } catch (err: any) {
                onPaymentError(err.message || "Error al verificar la transacción con PayPal.");
              }
            }}
            onCancel={() => {
              onPaymentCancel();
            }}
            onError={(err) => {
              console.error("[PayPalPayment] Button error:", err);
              onPaymentError("No se pudo completar la operación en la ventana de PayPal. Inténtalo nuevamente.");
            }}
          />
        </PayPalScriptProvider>
      </div>
    </div>
  );
};
