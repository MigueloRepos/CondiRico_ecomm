import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID") ?? "";
    const paypalClientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET") ?? "";
    const paypalEnv = Deno.env.get("PAYPAL_ENV") ?? "sandbox";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { paypalOrderId, orderId } = await req.json();

    if (!paypalOrderId) {
      return new Response(JSON.stringify({ error: "Falta el identificador de orden de PayPal." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Verify corresponding internal order in Supabase
    let query = supabase.from("payments").select("*, orders(*)");
    if (orderId) {
      query = query.eq("order_id", orderId);
    } else {
      query = query.eq("provider_payment_id", paypalOrderId);
    }

    const { data: paymentRecord, error: payErr } = await query.maybeSingle();

    if (payErr || !paymentRecord) {
      console.warn("[paypal-capture-order] Payment record lookup failed:", payErr);
    }

    // 2. Obtain PayPal Access Token
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

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[paypal-capture-order] PayPal auth failed:", errText);
      return new Response(JSON.stringify({ error: "Error de autenticación con PayPal al capturar pago." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { access_token } = await tokenRes.json();

    // 3. Capture payment on PayPal
    const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
    });

    const captureData = await captureRes.json();

    if (!captureRes.ok) {
      console.error("[paypal-capture-order] Capture failed:", captureData);
      return new Response(JSON.stringify({ error: captureData?.message || "No se pudo capturar el pago en PayPal." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Verify COMPLETED status and extract capture details
    if (captureData.status !== "COMPLETED") {
      return new Response(JSON.stringify({ error: `El estado del pago es ${captureData.status}, no completado.` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const purchaseUnit = captureData.purchase_units?.[0];
    const captureDetails = purchaseUnit?.payments?.captures?.[0];
    const transactionId = captureDetails?.id || paypalOrderId;
    const capturedAmount = parseFloat(captureDetails?.amount?.value || purchaseUnit?.amount?.value || "0");
    const currency = captureDetails?.amount?.currency_code || "USD";
    const internalOrderId = Number(purchaseUnit?.custom_id || paymentRecord?.order_id || orderId);

    // 5. Update database via atomic confirm_payment_transaction RPC
    const { data: confirmRes, error: confirmErr } = await supabase.rpc("confirm_payment_transaction", {
      p_order_id: internalOrderId,
      p_provider: "paypal",
      p_provider_payment_id: transactionId,
      p_amount: capturedAmount,
      p_currency: currency,
      p_metadata: {
        paypal_order_id: paypalOrderId,
        paypal_capture_id: transactionId,
        payer: captureData.payer,
        status: captureData.status,
      },
    });

    if (confirmErr || !confirmRes?.success) {
      console.error("[paypal-capture-order] RPC confirmation error:", confirmErr || confirmRes?.error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: internalOrderId,
        transactionId,
        status: "paid",
        amount: capturedAmount,
        currency,
        paidAt: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("[paypal-capture-order] Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Error interno al verificar y capturar pago con PayPal." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
