import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const signature = req.headers.get("stripe-signature");
    if (!signature || !webhookSecret) {
      return new Response("Missing signature or webhook secret", { status: 400 });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("[stripe-webhook] Signature verification failed:", err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[stripe-webhook] Processing event: ${event.type} (ID: ${event.id})`);

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = Number(paymentIntent.metadata?.order_id);
        const amount = paymentIntent.amount_received / 100;
        const currency = paymentIntent.currency.toUpperCase();
        const provider = paymentIntent.metadata?.provider === "google_pay" ? "google_pay" : "stripe";

        if (orderId) {
          // Confirm payment atomically in Supabase
          const { error } = await supabase.rpc("confirm_payment_transaction", {
            p_order_id: orderId,
            p_provider: provider,
            p_provider_payment_id: paymentIntent.id,
            p_amount: amount,
            p_currency: currency,
            p_metadata: {
              stripe_event_id: event.id,
              payment_method_types: paymentIntent.payment_method_types,
              latest_charge: paymentIntent.latest_charge,
            },
          });

          if (error) {
            console.error("[stripe-webhook] RPC confirm error:", error);
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = Number(paymentIntent.metadata?.order_id);

        if (orderId) {
          await supabase
            .from("payments")
            .update({
              status: "failed",
              metadata: {
                stripe_event_id: event.id,
                last_payment_error: paymentIntent.last_payment_error,
              },
              updated_at: new Date().toISOString(),
            })
            .eq("order_id", orderId);

          await supabase
            .from("orders")
            .update({
              payment_status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;

        if (paymentIntentId) {
          await supabase
            .from("payments")
            .update({
              status: "refunded",
              metadata: { stripe_event_id: event.id, refund_details: charge.refunds?.data },
              updated_at: new Date().toISOString(),
            })
            .eq("provider_payment_id", paymentIntentId);

          await supabase
            .from("orders")
            .update({
              payment_status: "refunded",
              status: "cancelled",
              updated_at: new Date().toISOString(),
            })
            .eq("payment_id", paymentIntentId);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("[stripe-webhook] Server error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
