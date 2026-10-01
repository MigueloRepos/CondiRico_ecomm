import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";

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
    const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID") ?? "";
    const paypalClientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET") ?? "";
    const paypalEnv = Deno.env.get("PAYPAL_ENV") ?? "sandbox";

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
    const { cartItems, customerName, customerEmail, customerPhone, shippingAddress, shippingCity, deliveryInstructions } = body;
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
      p_payment_provider: "paypal",
      p_idempotency_key: idempotencyKey || null,
    });

    if (rpcError || !rpcResult?.success) {
      return new Response(JSON.stringify({ error: rpcError?.message || rpcResult?.error || "Error al procesar orden en base de datos." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderId = rpcResult.order_id;
    const totalAmount = Number(rpcResult.total).toFixed(2);

    // 3. Obtain PayPal OAuth Access Token
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
      console.error("[paypal-create-order] PayPal auth error:", errText);
      return new Response(JSON.stringify({ error: "No se pudo autenticar con el servicio de PayPal." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { access_token } = await tokenRes.json();

    // 4. Create PayPal Order v2
    const paypalOrderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
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

    if (!paypalOrderRes.ok) {
      const errText = await paypalOrderRes.text();
      console.error("[paypal-create-order] PayPal create error:", errText);
      return new Response(JSON.stringify({ error: "Error al crear la orden en PayPal." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paypalOrderData = await paypalOrderRes.json();
    const paypalOrderId = paypalOrderData.id;

    // 5. Update payment record with PayPal Order ID
    await supabase
      .from("payments")
      .update({
        provider_payment_id: paypalOrderId,
        metadata: { paypal_order_id: paypalOrderId, status: paypalOrderData.status },
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId);

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        paypalOrderId,
        amount: Number(totalAmount),
        currency: "USD",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("[paypal-create-order] Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Error interno al iniciar pago con PayPal." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
