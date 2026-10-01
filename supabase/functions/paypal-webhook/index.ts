import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID") ?? "";
    const paypalClientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET") ?? "";
    const paypalWebhookId = Deno.env.get("PAYPAL_WEBHOOK_ID") ?? "";
    const paypalEnv = Deno.env.get("PAYPAL_ENV") ?? "sandbox";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();

    const eventType = body.event_type;
    const resource = body.resource;
    console.log(`[paypal-webhook] Received event: ${eventType} (ID: ${body.id})`);

    // Optional verification if PAYPAL_WEBHOOK_ID is configured
    if (paypalWebhookId && paypalClientId && paypalClientSecret) {
      try {
        const baseUrl = paypalEnv === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
        const authString = btoa(`${paypalClientId}:${paypalClientSecret}`);

        const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${authString}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: "grant_type=client_credentials",
        });

        if (tokenRes.ok) {
          const { access_token } = await tokenRes.json();
          const verifyRes = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              auth_algo: req.headers.get("PAYPAL-AUTH-ALGO"),
              cert_url: req.headers.get("PAYPAL-CERT-URL"),
              transmission_id: req.headers.get("PAYPAL-TRANSMISSION-ID"),
              transmission_sig: req.headers.get("PAYPAL-TRANSMISSION-SIG"),
              transmission_time: req.headers.get("PAYPAL-TRANSMISSION-TIME"),
              webhook_id: paypalWebhookId,
              webhook_event: body,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.verification_status !== "SUCCESS") {
            console.warn("[paypal-webhook] Webhook signature verification status:", verifyData.verification_status);
          }
        }
      } catch (verErr) {
        console.warn("[paypal-webhook] Verification warning:", verErr);
      }
    }

    switch (eventType) {
      case "PAYMENT.CAPTURE.COMPLETED": {
        const transactionId = resource.id;
        const amount = parseFloat(resource.amount?.value || "0");
        const currency = resource.amount?.currency_code || "USD";
        const customId = resource.custom_id;
        const orderId = customId ? Number(customId) : null;

        if (orderId) {
          await supabase.rpc("confirm_payment_transaction", {
            p_order_id: orderId,
            p_provider: "paypal",
            p_provider_payment_id: transactionId,
            p_amount: amount,
            p_currency: currency,
            p_metadata: {
              paypal_event_id: body.id,
              capture_id: transactionId,
              seller_receivable_breakdown: resource.seller_receivable_breakdown,
            },
          });
        }
        break;
      }

      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.DECLINED": {
        const customId = resource.custom_id;
        const orderId = customId ? Number(customId) : null;

        if (orderId) {
          await supabase
            .from("payments")
            .update({
              status: "failed",
              metadata: { paypal_event_id: body.id, reason: resource.status_details?.reason },
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

      case "PAYMENT.CAPTURE.REFUNDED": {
        const customId = resource.custom_id;
        const orderId = customId ? Number(customId) : null;

        if (orderId) {
          await supabase
            .from("payments")
            .update({
              status: "refunded",
              metadata: { paypal_event_id: body.id, refund: resource },
              updated_at: new Date().toISOString(),
            })
            .eq("order_id", orderId);

          await supabase
            .from("orders")
            .update({
              payment_status: "refunded",
              status: "cancelled",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("[paypal-webhook] Server error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
