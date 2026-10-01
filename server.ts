import express, { Request, Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

const defaultSupabaseUrl = "https://wcgwttjnvyeibxdnhqfl.supabase.co";
const defaultAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjZ3d0dGpudnllaWJ4ZG5ocWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NjA5NTYsImV4cCI6MjEwNjAzNjk1Nn0.iE3Felsr8MQ7GYnMGGGMLexs8358nVTzzKJOgEq70vs";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || defaultSupabaseUrl;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || defaultAnonKey;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

const paypalClientId = process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID || "";
const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET || "";
const paypalEnv = process.env.PAYPAL_ENV || "sandbox";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

const googlePayMerchantId = process.env.GOOGLE_PAY_MERCHANT_ID || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

let stripeInstance: Stripe | null = null;
if (stripeSecretKey) {
  stripeInstance = new Stripe(stripeSecretKey);
}

// Raw body parser for Stripe Webhook before express.json()
app.post(
  "/api/payments/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    if (!stripeInstance || !stripeWebhookSecret) {
      return res.status(400).send("Stripe webhook not configured");
    }

    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      event = stripeInstance.webhooks.constructEvent(req.body, sig, stripeWebhookSecret);
    } catch (err: any) {
      console.error("[stripe-webhook] Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = Number(paymentIntent.metadata?.order_id);
        const amount = paymentIntent.amount_received / 100;
        const currency = paymentIntent.currency.toUpperCase();
        const provider = paymentIntent.metadata?.provider === "google_pay" ? "google_pay" : "stripe";

        if (orderId) {
          await supabase.rpc("confirm_payment_transaction", {
            p_order_id: orderId,
            p_provider: provider,
            p_provider_payment_id: paymentIntent.id,
            p_amount: amount,
            p_currency: currency,
            p_metadata: {
              stripe_event_id: event.id,
              payment_method_types: paymentIntent.payment_method_types,
            },
          });
        }
      } else if (event.type === "payment_intent.payment_failed") {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = Number(paymentIntent.metadata?.order_id);
        if (orderId) {
          await supabase.from("payments").update({ status: "failed" }).eq("order_id", orderId);
          await supabase.from("orders").update({ payment_status: "failed" }).eq("id", orderId);
        }
      } else if (event.type === "charge.refunded") {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
        if (paymentIntentId) {
          await supabase.from("payments").update({ status: "refunded" }).eq("provider_payment_id", paymentIntentId);
          await supabase.from("orders").update({ payment_status: "refunded", status: "cancelled" }).eq("payment_id", paymentIntentId);
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error("[stripe-webhook] Error processing:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// Standard JSON middleware for other routes
app.use(express.json());

// Public payment configuration endpoint
app.get("/api/payments/config", (_req: Request, res: Response) => {
  const supportedProviders: string[] = ["paypal"];
  if (stripePublishableKey) supportedProviders.push("stripe");
  if (googlePayMerchantId || stripePublishableKey) supportedProviders.push("google_pay");

  res.json({
    paypalClientId: paypalClientId || null,
    paypalCurrency: "USD",
    stripePublishableKey: stripePublishableKey || null,
    googlePayMerchantId: googlePayMerchantId || null,
    isSandbox: paypalEnv !== "production",
    supportedProviders,
    supportedMethods: ["paypal", "card", "google_pay"],
  });
});

// Helper to get PayPal Access Token
async function getPayPalAccessToken(): Promise<string> {
  const baseUrl = paypalEnv === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const authString = Buffer.from(`${paypalClientId}:${paypalClientSecret}`).toString("base64");

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${authString}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal Auth Error: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// POST: Create PayPal Order
app.post("/api/payments/paypal/create-order", async (req: Request, res: Response) => {
  try {
    const { cartItems, customerName, customerEmail, customerPhone, shippingAddress, shippingCity, deliveryInstructions, idempotencyKey } = req.body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: "El carrito está vacío." });
    }

    if (!paypalClientId || !paypalClientSecret) {
      return res.status(500).json({ error: "Credenciales de PayPal no configuradas en el servidor." });
    }

    // 1. Create order & calculate server-side prices atomically
    const { data: rpcResult, error: rpcError } = await supabase.rpc("create_secure_payment_order", {
      p_items: cartItems,
      p_customer_name: customerName?.trim() || "Cliente",
      p_customer_email: customerEmail?.trim() || "cliente@condirico.com",
      p_customer_phone: customerPhone?.trim() || "",
      p_shipping_address: shippingAddress?.trim() || "Dirección no especificada",
      p_shipping_city: shippingCity?.trim() || "Santiago",
      p_delivery_instructions: deliveryInstructions?.trim() || null,
      p_payment_provider: "paypal",
      p_idempotency_key: idempotencyKey || null,
    });

    if (rpcError || !rpcResult?.success) {
      return res.status(400).json({ error: rpcError?.message || rpcResult?.error || "Error al registrar orden." });
    }

    const orderId = rpcResult.order_id;
    const totalAmount = Number(rpcResult.total).toFixed(2);

    // 2. Call PayPal Checkout v2 Orders API
    const accessToken = await getPayPalAccessToken();
    const baseUrl = paypalEnv === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

    const ppOrderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: `condirico_order_${orderId}`,
            custom_id: String(orderId),
            amount: {
              currency_code: "USD",
              value: totalAmount,
              breakdown: {
                item_total: {
                  currency_code: "USD",
                  value: Number(rpcResult.subtotal).toFixed(2),
                },
                shipping: {
                  currency_code: "USD",
                  value: Number(rpcResult.shipping).toFixed(2),
                },
              },
            },
          },
        ],
      }),
    });

    if (!ppOrderRes.ok) {
      const errText = await ppOrderRes.text();
      console.error("[paypal-create-order] PayPal API error:", errText);
      return res.status(500).json({ error: "Error al generar orden en PayPal." });
    }

    const ppOrderData = await ppOrderRes.json();
    const paypalOrderId = ppOrderData.id;

    // 3. Save PayPal Order ID to payments table
    await supabase
      .from("payments")
      .update({
        provider_payment_id: paypalOrderId,
        metadata: { paypal_order_id: paypalOrderId, status: ppOrderData.status },
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId);

    res.json({
      success: true,
      orderId,
      paypalOrderId,
      amount: Number(totalAmount),
      currency: "USD",
    });
  } catch (err: any) {
    console.error("[paypal-create-order] Error:", err);
    res.status(500).json({ error: err.message || "Error al procesar pago con PayPal." });
  }
});

// POST: Capture PayPal Order
app.post("/api/payments/paypal/capture-order", async (req: Request, res: Response) => {
  try {
    const { paypalOrderId, orderId } = req.body;

    if (!paypalOrderId) {
      return res.status(400).json({ error: "Falta el ID de orden de PayPal." });
    }

    const accessToken = await getPayPalAccessToken();
    const baseUrl = paypalEnv === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

    const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const captureData = await captureRes.json();

    if (!captureRes.ok || captureData.status !== "COMPLETED") {
      console.error("[paypal-capture-order] Capture failed:", captureData);
      return res.status(400).json({ error: captureData?.message || "No se pudo capturar el pago en PayPal." });
    }

    const purchaseUnit = captureData.purchase_units?.[0];
    const captureDetails = purchaseUnit?.payments?.captures?.[0];
    const transactionId = captureDetails?.id || paypalOrderId;
    const capturedAmount = parseFloat(captureDetails?.amount?.value || purchaseUnit?.amount?.value || "0");
    const currency = captureDetails?.amount?.currency_code || "USD";
    const internalOrderId = Number(purchaseUnit?.custom_id || orderId);

    // Confirm in Supabase
    await supabase.rpc("confirm_payment_transaction", {
      p_order_id: internalOrderId,
      p_provider: "paypal",
      p_provider_payment_id: transactionId,
      p_amount: capturedAmount,
      p_currency: currency,
      p_metadata: {
        paypal_order_id: paypalOrderId,
        paypal_capture_id: transactionId,
        payer: captureData.payer,
      },
    });

    res.json({
      success: true,
      orderId: internalOrderId,
      transactionId,
      status: "paid",
      amount: capturedAmount,
      currency,
      paidAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[paypal-capture-order] Error:", err);
    res.status(500).json({ error: err.message || "Error al capturar orden de PayPal." });
  }
});

// POST: Create Stripe PaymentIntent (Stripe Card & Google Pay)
app.post("/api/payments/stripe/create-payment-intent", async (req: Request, res: Response) => {
  try {
    if (!stripeInstance) {
      return res.status(500).json({ error: "Credenciales de Stripe no configuradas en el servidor." });
    }

    const {
      cartItems,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      shippingCity,
      deliveryInstructions,
      provider = "stripe",
      idempotencyKey,
    } = req.body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: "El carrito está vacío." });
    }

    // 1. Create order & calculate exact server-side prices atomically
    const { data: rpcResult, error: rpcError } = await supabase.rpc("create_secure_payment_order", {
      p_items: cartItems,
      p_customer_name: customerName?.trim() || "Cliente",
      p_customer_email: customerEmail?.trim() || "cliente@condirico.com",
      p_customer_phone: customerPhone?.trim() || "",
      p_shipping_address: shippingAddress?.trim() || "Dirección no especificada",
      p_shipping_city: shippingCity?.trim() || "Santiago",
      p_delivery_instructions: deliveryInstructions?.trim() || null,
      p_payment_provider: provider === "google_pay" ? "google_pay" : "stripe",
      p_idempotency_key: idempotencyKey || null,
    });

    if (rpcError || !rpcResult?.success) {
      return res.status(400).json({ error: rpcError?.message || rpcResult?.error || "Error al registrar orden." });
    }

    const orderId = rpcResult.order_id;
    const totalAmount = Number(rpcResult.total);
    const amountInCents = Math.round(totalAmount * 100);

    // 2. Create PaymentIntent in Stripe
    const paymentIntent = await stripeInstance.paymentIntents.create(
      {
        amount: amountInCents,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          order_id: String(orderId),
          customer_email: customerEmail || "cliente@condirico.com",
          customer_name: customerName || "Cliente",
          provider,
        },
        description: `Pedido CondiRico #${orderId}`,
      },
      {
        idempotencyKey: idempotencyKey ? `stripe_pi_${idempotencyKey}` : undefined,
      }
    );

    // 3. Update payment record
    await supabase
      .from("payments")
      .update({
        provider_payment_id: paymentIntent.id,
        metadata: { stripe_payment_intent_id: paymentIntent.id, status: paymentIntent.status },
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId);

    res.json({
      success: true,
      orderId,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      currency: "USD",
    });
  } catch (err: any) {
    console.error("[create-payment-intent] Error:", err);
    res.status(500).json({ error: err.message || "Error al crear intención de pago en Stripe." });
  }
});

// Vite Middleware integration in Development
async function startServer() {
  try {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.resolve(__dirname, "dist");
      app.use(express.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    }

    app.listen(port, "0.0.0.0", () => {
      console.log(`[CondiRico Server] Payments engine & App running on http://0.0.0.0:${port}`);
    });
  } catch (err) {
    console.error("[CondiRico Server] Failed to start server:", err);
  }
}

startServer();
