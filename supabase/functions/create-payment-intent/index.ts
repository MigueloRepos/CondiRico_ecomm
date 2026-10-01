import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, idempotency-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

    if (!stripeSecretKey) {
      return new Response(JSON.stringify({ error: "Configuración de Stripe pendiente en el servidor." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Authenticate user if token provided
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id ?? null;
    }

    const body = await req.json();
    const {
      cartItems,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      shippingCity,
      deliveryInstructions,
      provider = "stripe",
    } = body;
    const idempotencyKey = req.headers.get("idempotency-key") || body.idempotencyKey;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return new Response(JSON.stringify({ error: "El carrito está vacío." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Call secure PostgreSQL RPC to create atomic order and calculate exact server prices & verify stock
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
      return new Response(JSON.stringify({ error: rpcError?.message || rpcResult?.error || "Error al procesar orden en base de datos." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderId = rpcResult.order_id;
    const totalAmount = Number(rpcResult.total);
    const amountInCents = Math.round(totalAmount * 100);

    // 3. Create Stripe PaymentIntent with automatic payment methods (supports Cards, Google Pay, Apple Pay)
    const paymentIntent = await stripe.paymentIntents.create({
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
        user_id: userId || "",
      },
      description: `Pedido CondiRico #${orderId}`,
    }, {
      idempotencyKey: idempotencyKey ? `stripe_pi_${idempotencyKey}` : undefined,
    });

    // 4. Update payment record with Stripe PaymentIntent ID
    await supabase
      .from("payments")
      .update({
        provider_payment_id: paymentIntent.id,
        metadata: {
          stripe_payment_intent_id: paymentIntent.id,
          status: paymentIntent.status,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId);

    // 5. Return strictly the client_secret
    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: totalAmount,
        currency: "USD",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("[create-payment-intent] Unexpected error:", err);
    return new Response(JSON.stringify({ error: err.message || "Error interno al crear sesión de pago en Stripe." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
