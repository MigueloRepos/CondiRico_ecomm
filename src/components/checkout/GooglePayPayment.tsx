import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  Loader2,
  Lock,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  CreatePaymentOrderInput,
  PaymentPublicConfig,
} from "@/types/payment";
import {
  createPayPalOrder,
  capturePayPalOrder,
} from "@/services/paymentService";

interface GooglePayPaymentProps {
  config: PaymentPublicConfig;
  orderInput: CreatePaymentOrderInput;
  totalEstimated: number;
  onPaymentStart: () => void;
  onPaymentSuccess: (orderId: number, amount: number, transactionId: string) => void;
  onPaymentError: (errorMsg: string) => void;
  onPaymentCancel: () => void;
}

export const GooglePayPayment: React.FC<GooglePayPaymentProps> = ({
  config,
  orderInput,
  totalEstimated,
  onPaymentStart,
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel,
}) => {
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);
  const [isEligible, setIsEligible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Check device / browser / wallet eligibility for Google Pay
    const checkGooglePaySupport = async () => {
      try {
        if (typeof window === "undefined") {
          if (isMounted) {
            setIsEligible(false);
            setIsCheckingEligibility(false);
          }
          return;
        }

        // 1. Check if browser supports PaymentRequest with Google Pay method
        if (window.PaymentRequest) {
          const supportedInstruments: PaymentMethodData[] = [
            {
              supportedMethods: "https://google.com/pay",
              data: {
                environment: config.isSandbox ? "TEST" : "PRODUCTION",
                apiVersion: 2,
                apiVersionMinor: 0,
                merchantInfo: {
                  merchantId: config.googlePayMerchantId || "12345678901234567890",
                  merchantName: "CondiRico Ecommerce",
                },
                allowedPaymentMethods: [
                  {
                    type: "CARD",
                    parameters: {
                      allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                      allowedCardNetworks: ["MASTERCARD", "VISA", "AMEX", "DISCOVER"],
                    },
                    tokenizationSpecification: {
                      type: "PAYMENT_GATEWAY",
                      parameters: {
                        gateway: "paypal",
                        "paypal:clientId": config.paypalClientId || "",
                      },
                    },
                  },
                ],
              },
            },
          ];

          const details: PaymentDetailsInit = {
            total: {
              label: "CondiRico Total",
              amount: {
                currency: "USD",
                value: totalEstimated.toFixed(2),
              },
            },
          };

          try {
            const request = new PaymentRequest(supportedInstruments, details);
            const canMake = await request.canMakePayment();
            if (isMounted) {
              setIsEligible(Boolean(canMake));
              setIsCheckingEligibility(false);
            }
            return;
          } catch (prErr) {
            console.debug("[GooglePayPayment] PaymentRequest check detail:", prErr);
          }
        }

        // 2. Check if google.payments.api is available
        const googleObj = (window as any).google;
        if (googleObj?.payments?.api?.PaymentsClient) {
          const paymentsClient = new googleObj.payments.api.PaymentsClient({
            environment: config.isSandbox ? "TEST" : "PRODUCTION",
          });
          const isReady = await paymentsClient.isReadyToPay({
            apiVersion: 2,
            apiVersionMinor: 0,
            allowedPaymentMethods: [
              {
                type: "CARD",
                parameters: {
                  allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                  allowedCardNetworks: ["VISA", "MASTERCARD"],
                },
              },
            ],
          });
          if (isMounted) {
            setIsEligible(Boolean(isReady?.result));
            setIsCheckingEligibility(false);
          }
          return;
        }

        // Fallback: If merchant ID or PayPal client ID configured, check browser user agent for Chrome/Android
        const isChromeOrAndroid = /Chrome|Android/i.test(navigator.userAgent) && !/Edg|OPR/i.test(navigator.userAgent);
        if (isMounted) {
          setIsEligible(Boolean(config.paypalClientId && isChromeOrAndroid));
          setIsCheckingEligibility(false);
        }
      } catch (err) {
        console.warn("[GooglePayPayment] Eligibility evaluation warning:", err);
        if (isMounted) {
          setIsEligible(false);
          setIsCheckingEligibility(false);
        }
      }
    };

    checkGooglePaySupport();

    return () => {
      isMounted = false;
    };
  }, [config, totalEstimated]);

  const handleGooglePayClick = async () => {
    setIsProcessing(true);
    onPaymentStart();

    try {
      // 1. Create secure order on server
      const createRes = await createPayPalOrder({
        ...orderInput,
        provider: "paypal",
        paymentMethod: "google_pay",
      });

      if (!createRes.success || !createRes.paypalOrderId) {
        throw new Error(createRes.error || "No se pudo iniciar la orden con Google Pay.");
      }

      // 2. Execute PaymentRequest / Google Pay transaction
      if (window.PaymentRequest) {
        const supportedInstruments: PaymentMethodData[] = [
          {
            supportedMethods: "https://google.com/pay",
            data: {
              environment: config.isSandbox ? "TEST" : "PRODUCTION",
              apiVersion: 2,
              apiVersionMinor: 0,
              merchantInfo: {
                merchantId: config.googlePayMerchantId || "12345678901234567890",
                merchantName: "CondiRico Ecommerce",
              },
              allowedPaymentMethods: [
                {
                  type: "CARD",
                  parameters: {
                    allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                    allowedCardNetworks: ["MASTERCARD", "VISA"],
                  },
                  tokenizationSpecification: {
                    type: "PAYMENT_GATEWAY",
                    parameters: {
                      gateway: "paypal",
                      "paypal:clientId": config.paypalClientId || "",
                    },
                  },
                },
              ],
            },
          },
        ];

        const details: PaymentDetailsInit = {
          total: {
            label: "CondiRico Ecommerce Total",
            amount: {
              currency: "USD",
              value: totalEstimated.toFixed(2),
            },
          },
        };

        const request = new PaymentRequest(supportedInstruments, details);
        const paymentResponse = await request.show();

        // 3. Capture payment on backend
        const captureRes = await capturePayPalOrder(createRes.paypalOrderId, createRes.orderId);
        await paymentResponse.complete("success");

        if (captureRes.success) {
          onPaymentSuccess(captureRes.orderId, captureRes.amount, captureRes.transactionId);
        } else {
          throw new Error(captureRes.error || "Error al capturar la transacción de Google Pay.");
        }
      } else {
        // Direct capture through PayPal order flow
        const captureRes = await capturePayPalOrder(createRes.paypalOrderId, createRes.orderId);
        if (captureRes.success) {
          onPaymentSuccess(captureRes.orderId, captureRes.amount, captureRes.transactionId);
        } else {
          throw new Error(captureRes.error || "Error al capturar la orden.");
        }
      }
    } catch (err: any) {
      console.error("[GooglePayPayment] Execution error:", err);
      const userMessage =
        err.name === "AbortError"
          ? "Transacción con Google Pay cancelada."
          : err.message || "No se pudo completar el pago con Google Pay.";
      if (err.name === "AbortError") {
        onPaymentCancel();
      } else {
        onPaymentError(userMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (isCheckingEligibility) {
    return (
      <div className="py-8 flex flex-col items-center justify-center text-center">
        <Loader2 className="size-5 animate-spin text-primary mb-2" />
        <p className="text-xs text-muted-foreground font-medium">
          Verificando compatibilidad de billetera digital en tu navegador...
        </p>
      </div>
    );
  }

  if (!isEligible) {
    return (
      <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 text-xs text-center space-y-2">
        <AlertCircle className="size-5 text-slate-500 mx-auto" />
        <p className="font-bold">Google Pay no está disponible en este dispositivo o navegador</p>
        <p className="text-[11px] text-slate-600">
          Para realizar tu compra, por favor selecciona <strong>PayPal</strong> o <strong>Tarjeta de crédito/débito</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="p-4 rounded-2xl bg-slate-950 text-white space-y-1 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black flex items-center gap-1.5">
            <span className="text-sky-400">G</span>
            <span className="text-rose-400">o</span>
            <span className="text-amber-400">o</span>
            <span className="text-emerald-400">g</span>
            <span className="text-slate-300">le</span>
            <span className="text-white ml-1">Pay</span>
          </span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full">
            Disponible en tu dispositivo
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          Paga al instante con tus tarjetas seguras de tu cuenta de Google mediante biometría o PIN.
        </p>
      </div>

      <button
        type="button"
        disabled={isProcessing}
        onClick={handleGooglePayClick}
        className="w-full h-13 rounded-2xl bg-black text-white hover:bg-slate-900 active:scale-98 transition-all font-bold text-sm shadow-xl flex items-center justify-center gap-2 border border-slate-800 cursor-pointer disabled:opacity-60"
      >
        {isProcessing ? (
          <>
            <Loader2 className="size-4.5 animate-spin text-white" />
            <span>Conectando con Google Pay...</span>
          </>
        ) : (
          <div className="flex items-center gap-2 font-bold text-sm">
            <span>Pagar con</span>
            <span className="font-black">
              <span className="text-sky-400">G</span>
              <span className="text-rose-400">o</span>
              <span className="text-amber-400">o</span>
              <span className="text-emerald-400">g</span>
              <span className="text-slate-300">le</span>
              <span className="text-white ml-0.5">Pay</span>
            </span>
            <span className="text-xs text-slate-400 ml-1">(${totalEstimated.toFixed(2)} USD)</span>
          </div>
        )}
      </button>

      <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
        <ShieldCheck className="size-3.5 text-emerald-600" />
        <span>Autenticación biométrica protegida por Google y PayPal.</span>
      </div>
    </div>
  );
};
