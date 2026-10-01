import React, { useState } from "react";
import {
  CreditCard,
  Lock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import {
  CreatePaymentOrderInput,
  PaymentPublicConfig,
} from "@/types/payment";
import {
  createPayPalOrder,
  capturePayPalOrder,
} from "@/services/paymentService";

interface CardPaymentProps {
  config: PaymentPublicConfig;
  orderInput: CreatePaymentOrderInput;
  totalEstimated: number;
  onPaymentStart: () => void;
  onPaymentSuccess: (orderId: number, amount: number, transactionId: string) => void;
  onPaymentError: (errorMsg: string) => void;
  onPaymentCancel: () => void;
}

export const CardPayment: React.FC<CardPaymentProps> = ({
  config,
  orderInput,
  onPaymentStart,
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel,
}) => {
  const [activeTab, setActiveTab] = useState<"paypal_card" | "details">("paypal_card");

  if (!config.paypalClientId) {
    return (
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-center space-y-2">
        <AlertCircle className="size-5 text-amber-600 mx-auto" />
        <p className="font-bold">Pasarela de Tarjetas en Configuración</p>
        <p className="text-[11px] text-amber-800">
          Procesamiento de tarjetas bancarias gestionado directamente por PayPal. Requiere <code>PAYPAL_CLIENT_ID</code> en el servidor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 to-teal-50/90 border border-emerald-200/80 space-y-1 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
            <CreditCard className="size-3.5 text-emerald-600" /> Tarjeta Débito / Crédito
          </span>
          <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <ShieldCheck className="size-3" /> Cifrado 256-Bit
          </span>
        </div>
        <p className="text-[11px] text-emerald-800">
          Aceptamos Visa, Mastercard, American Express y tarjetas bancarias sin almacenar números en nuestra base de datos.
        </p>
      </div>

      {/* Card Form & PayPal Card Funding Button */}
      <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-inner space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">
          <span>Procesamiento Seguro con PayPal Card Checkout</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-slate-100 text-slate-700 font-extrabold px-1.5 py-0.5 rounded">VISA</span>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-extrabold px-1.5 py-0.5 rounded">Mastercard</span>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-extrabold px-1.5 py-0.5 rounded">AMEX</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          Al hacer clic en el botón de abajo, se abrirá el formulario seguro de tarjeta proporcionado por PayPal para completar tu pago de forma instantánea.
        </p>

        <PayPalScriptProvider
          options={{
            clientId: config.paypalClientId,
            currency: config.paypalCurrency || "USD",
            intent: "capture",
            components: "buttons",
          }}
        >
          <PayPalButtons
            fundingSource="card"
            style={{
              layout: "vertical",
              shape: "rect",
              color: "black",
              height: 48,
              label: "pay",
            }}
            createOrder={async () => {
              onPaymentStart();
              const res = await createPayPalOrder({
                ...orderInput,
                provider: "paypal",
                paymentMethod: "card",
              });

              if (!res.success || !res.paypalOrderId) {
                const errMsg = res.error || "No se pudo generar la orden para tarjeta en el servidor.";
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
                  onPaymentError(captureRes.error || "No se pudo confirmar el pago de la tarjeta.");
                }
              } catch (err: any) {
                onPaymentError(err.message || "Error al verificar la transacción de tarjeta.");
              }
            }}
            onCancel={() => {
              onPaymentCancel();
            }}
            onError={(err) => {
              console.error("[CardPayment] Error:", err);
              onPaymentError("No se pudo procesar la tarjeta. Verifica los datos e intenta nuevamente.");
            }}
          />
        </PayPalScriptProvider>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <Lock className="size-3 text-emerald-600" />
        <span>Tus datos viajan directamente cifrados hacia la pasarela de PayPal.</span>
      </div>
    </div>
  );
};
