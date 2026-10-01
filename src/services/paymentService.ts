import { supabase } from "@/lib/supabase";
import {
  CreatePaymentOrderInput,
  PayPalCreateOrderResult,
  PayPalCaptureResult,
  StripePaymentIntentResult,
  PaymentPublicConfig,
  PaymentRecord,
  PaymentStatus,
} from "@/types/payment";

/**
 * Returns the public payment configuration from the server or client environment
 */
export async function getPaymentConfig(): Promise<PaymentPublicConfig> {
  try {
    const res = await fetch("/api/payments/config");
    if (res.ok) {
      const data = await res.json();
      return {
        paypalClientId: data.paypalClientId || import.meta.env.VITE_PAYPAL_CLIENT_ID || null,
        paypalCurrency: data.paypalCurrency || "USD",
        stripePublishableKey: data.stripePublishableKey || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || null,
        googlePayMerchantId: data.googlePayMerchantId || import.meta.env.VITE_GOOGLE_PAY_MERCHANT_ID || null,
        isSandbox: Boolean(data.isSandbox),
        supportedProviders: data.supportedProviders || ["paypal", "stripe", "google_pay"],
        supportedMethods: data.supportedMethods || ["paypal", "card", "google_pay"],
      };
    }
  } catch (err) {
    console.warn("[paymentService] Config fetch fallback:", err);
  }

  // Fallback to client env vars if present
  const paypalId = import.meta.env.VITE_PAYPAL_CLIENT_ID || null;
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || null;
  const gpayId = import.meta.env.VITE_GOOGLE_PAY_MERCHANT_ID || null;

  return {
    paypalClientId: paypalId,
    paypalCurrency: "USD",
    stripePublishableKey: stripeKey,
    googlePayMerchantId: gpayId,
    isSandbox: true,
    supportedProviders: ["paypal", "stripe", "google_pay"],
    supportedMethods: ["paypal", "card", "google_pay"],
  };
}

/**
 * Generates an idempotency key based on timestamp and random token
 */
export function generateIdempotencyKey(prefix = "pay"): string {
  const rand = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}_${time}_${rand}`;
}

/**
 * Creates PayPal Order on the server (calculating exact database prices & reserving stock)
 */
export async function createPayPalOrder(
  input: CreatePaymentOrderInput
): Promise<PayPalCreateOrderResult> {
  const idempotencyKey = input.idempotencyKey || generateIdempotencyKey("pp");

  // Try Express API route first, then Supabase Edge Function fallback
  try {
    const res = await fetch("/api/payments/paypal/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "idempotency-key": idempotencyKey,
      },
      body: JSON.stringify({
        ...input,
        idempotencyKey,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "No se pudo iniciar la transacción con PayPal.");
    }

    return data;
  } catch (err: any) {
    console.warn("[paymentService] Primary PayPal create endpoint fallback to Edge Function:", err);

    // Fallback: Supabase Edge Function
    const { data: edgeData, error: edgeErr } = await supabase.functions.invoke("paypal-create-order", {
      body: { ...input, idempotencyKey },
    });

    if (edgeErr || !edgeData?.success) {
      return {
        success: false,
        orderId: 0,
        paypalOrderId: "",
        amount: 0,
        currency: "USD",
        error: edgeErr?.message || edgeData?.error || "Error al comunicarse con el servidor de pagos PayPal.",
      };
    }

    return edgeData;
  }
}

/**
 * Captures PayPal Order on the server and confirms payment in Supabase
 */
export async function capturePayPalOrder(
  paypalOrderId: string,
  orderId: number
): Promise<PayPalCaptureResult> {
  try {
    const res = await fetch("/api/payments/paypal/capture-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paypalOrderId,
        orderId,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "No se pudo confirmar la captura del pago en PayPal.");
    }

    return data;
  } catch (err: any) {
    console.warn("[paymentService] Primary capture endpoint fallback to Edge Function:", err);

    const { data: edgeData, error: edgeErr } = await supabase.functions.invoke("paypal-capture-order", {
      body: { paypalOrderId, orderId },
    });

    if (edgeErr || !edgeData?.success) {
      return {
        success: false,
        orderId,
        transactionId: "",
        status: "failed",
        amount: 0,
        currency: "USD",
        paidAt: "",
        error: edgeErr?.message || edgeData?.error || "No se pudo validar el pago en PayPal.",
      };
    }

    return edgeData;
  }
}

/**
 * Creates Stripe PaymentIntent for Card / Google Pay payments on the server
 */
export async function createStripePaymentIntent(
  input: CreatePaymentOrderInput
): Promise<StripePaymentIntentResult> {
  const idempotencyKey = input.idempotencyKey || generateIdempotencyKey("st");

  try {
    const res = await fetch("/api/payments/stripe/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "idempotency-key": idempotencyKey,
      },
      body: JSON.stringify({
        ...input,
        idempotencyKey,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "No se pudo crear la sesión de pago en Stripe.");
    }

    return data;
  } catch (err: any) {
    console.warn("[paymentService] Primary Stripe create endpoint fallback to Edge Function:", err);

    const { data: edgeData, error: edgeErr } = await supabase.functions.invoke("create-payment-intent", {
      body: { ...input, idempotencyKey },
    });

    if (edgeErr || !edgeData?.success) {
      return {
        success: false,
        orderId: 0,
        clientSecret: "",
        paymentIntentId: "",
        amount: 0,
        currency: "USD",
        error: edgeErr?.message || edgeData?.error || "Error al conectar con la pasarela de pagos con tarjeta.",
      };
    }

    return edgeData;
  }
}

/**
 * Checks if Google Pay digital wallet is available on this browser/device
 */
export async function checkGooglePayWalletAvailable(
  stripeInstance: any,
  amountInDollars = 10
): Promise<boolean> {
  if (!stripeInstance) return false;

  try {
    const pr = stripeInstance.paymentRequest({
      country: "US",
      currency: "usd",
      total: {
        label: "CondiRico Ecommerce",
        amount: Math.round(amountInDollars * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    const result = await pr.canMakePayment();
    if (result && (result.googlePay || result.applePay || Boolean(result))) {
      return true;
    }
    return false;
  } catch (err) {
    console.warn("[paymentService] Google Pay capability check:", err);
    return false;
  }
}

/**
 * Admin: Queries the payments audit logs from Supabase
 */
export async function getPaymentsAuditList(options?: {
  provider?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ payments: (PaymentRecord & { customer_name?: string; customer_email?: string })[]; totalCount: number }> {
  try {
    let query = supabase
      .from("payments")
      .select(`
        *,
        orders (
          id,
          customer_name,
          customer_email,
          total,
          status
        )
      `, { count: "exact" });

    if (options?.provider && options.provider !== "all") {
      query = query.eq("provider", options.provider);
    }
    if (options?.status && options.status !== "all") {
      query = query.eq("status", options.status);
    }

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 15;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) {
      console.error("[getPaymentsAuditList] Supabase error:", error);
      return { payments: [], totalCount: 0 };
    }

    const mapped = (data || []).map((p: any) => ({
      id: p.id,
      order_id: p.order_id,
      user_id: p.user_id,
      provider: p.provider,
      provider_payment_id: p.provider_payment_id,
      amount: Number(p.amount),
      currency: p.currency,
      status: p.status,
      idempotency_key: p.idempotency_key,
      metadata: p.metadata,
      created_at: p.created_at,
      updated_at: p.updated_at,
      paid_at: p.paid_at,
      customer_name: p.orders?.customer_name || "Cliente",
      customer_email: p.orders?.customer_email || "",
    }));

    return { payments: mapped, totalCount: count || 0 };
  } catch (err) {
    console.error("[getPaymentsAuditList] Error:", err);
    return { payments: [], totalCount: 0 };
  }
}

export interface PaymentsSummaryMetrics {
  totalProcessed: number;
  paypalRevenue: number;
  paypalCount: number;
  stripeRevenue: number;
  stripeCount: number;
  googlePayRevenue: number;
  googlePayCount: number;
  pendingCount: number;
  failedCount: number;
  refundedCount: number;
  totalTransactions: number;
}

/**
 * Admin: Computes payment summary KPI metrics
 */
export async function getPaymentsSummaryMetrics(): Promise<PaymentsSummaryMetrics> {
  try {
    const { data: payments, error } = await supabase
      .from("payments")
      .select("provider, amount, status");

    if (error || !payments) {
      return {
        totalProcessed: 0,
        paypalRevenue: 0,
        paypalCount: 0,
        stripeRevenue: 0,
        stripeCount: 0,
        googlePayRevenue: 0,
        googlePayCount: 0,
        pendingCount: 0,
        failedCount: 0,
        refundedCount: 0,
        totalTransactions: 0,
      };
    }

    let totalProcessed = 0;
    let paypalRevenue = 0;
    let paypalCount = 0;
    let stripeRevenue = 0;
    let stripeCount = 0;
    let googlePayRevenue = 0;
    let googlePayCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    let refundedCount = 0;

    payments.forEach((p) => {
      const amt = Number(p.amount || 0);
      if (p.status === "paid") {
        totalProcessed += amt;
        if (p.provider === "paypal") {
          paypalRevenue += amt;
          paypalCount += 1;
        } else if (p.provider === "stripe") {
          stripeRevenue += amt;
          stripeCount += 1;
        } else if (p.provider === "google_pay") {
          googlePayRevenue += amt;
          googlePayCount += 1;
        }
      } else if (p.status === "pending" || p.status === "processing") {
        pendingCount += 1;
      } else if (p.status === "failed") {
        failedCount += 1;
      } else if (p.status === "refunded") {
        refundedCount += 1;
      }
    });

    return {
      totalProcessed: Number(totalProcessed.toFixed(2)),
      paypalRevenue: Number(paypalRevenue.toFixed(2)),
      paypalCount,
      stripeRevenue: Number(stripeRevenue.toFixed(2)),
      stripeCount,
      googlePayRevenue: Number(googlePayRevenue.toFixed(2)),
      googlePayCount,
      pendingCount,
      failedCount,
      refundedCount,
      totalTransactions: payments.length,
    };
  } catch (err) {
    console.error("[getPaymentsSummaryMetrics] Error:", err);
    return {
      totalProcessed: 0,
      paypalRevenue: 0,
      paypalCount: 0,
      stripeRevenue: 0,
      stripeCount: 0,
      googlePayRevenue: 0,
      googlePayCount: 0,
      pendingCount: 0,
      failedCount: 0,
      refundedCount: 0,
      totalTransactions: 0,
    };
  }
}
