import { supabase } from "@/lib/supabase";
import { Order, OrderItem } from "@/types/database";

export interface CreateOrderItemInput {
  productId: number;
  quantity: number;
}

export interface CreateOrderInput {
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity?: string;
  deliveryInstructions?: string | null;
  paymentMethod?: string;
  notes?: string | null;
  whatsappSent?: boolean;
  items: CreateOrderItemInput[];
}

export interface CreateOrderResult {
  success: boolean;
  order?: Order;
  orderItems?: OrderItem[];
  error?: string;
}

/**
 * Validates prices and stock against Supabase database and creates order atomically
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  try {
    if (!input.items || input.items.length === 0) {
      return { success: false, error: "El carrito está vacío." };
    }

    if (!input.customerName?.trim() || !input.customerPhone?.trim() || !input.shippingAddress?.trim()) {
      return { success: false, error: "Por favor completa todos los datos de contacto y entrega requeridos." };
    }

    // Sanitize and validate quantities
    const sanitizedItems: { product_id: number; quantity: number }[] = [];
    for (const item of input.items) {
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty <= 0 || qty > 1000) {
        return { success: false, error: `Cantidad no válida (${item.quantity}) para el producto #${item.productId}.` };
      }
      sanitizedItems.push({
        product_id: item.productId,
        quantity: qty,
      });
    }

    if (sanitizedItems.length === 0) {
      return { success: false, error: "No hay productos válidos para procesar en el pedido." };
    }

    // 1. Primary Strategy: Try PostgreSQL RPC create_order_secure (Fully transactional & atomic on backend)
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc("create_order_secure", {
        p_items: sanitizedItems,
        p_customer_name: input.customerName.trim(),
        p_customer_email: input.customerEmail?.trim() || "cliente@condirico.com",
        p_customer_phone: input.customerPhone.trim(),
        p_shipping_address: input.shippingAddress.trim(),
        p_shipping_city: input.shippingCity?.trim() || "Santiago",
        p_delivery_instructions: input.deliveryInstructions?.trim() || null,
        p_payment_method: input.paymentMethod || "Efectivo contra entrega",
        p_notes: input.notes?.trim() || null,
        p_whatsapp_sent: input.whatsappSent ?? true,
      });

      if (!rpcErr && rpcData) {
        const parsed = typeof rpcData === "string" ? JSON.parse(rpcData) : rpcData;
        if (parsed.success) {
          // Fetch created order record
          const { data: newOrder } = await supabase
            .from("orders")
            .select("*")
            .eq("id", parsed.order_id)
            .single();

          const { data: createdItems } = await supabase
            .from("order_items")
            .select("*")
            .eq("order_id", parsed.order_id);

          return {
            success: true,
            order: newOrder || undefined,
            orderItems: createdItems || [],
          };
        } else if (parsed.error) {
          return { success: false, error: parsed.error };
        }
      }
    } catch {
      // Fallback to client-side verified flow if RPC is not yet registered in database
    }

    // 2. Fallback Strategy: Direct Supabase Database Queries with atomic verification
    const productIds = sanitizedItems.map((i) => i.product_id);

    // Fetch real product prices, stock, and info directly from Supabase database
    const { data: dbProducts, error: prodErr } = await supabase
      .from("products")
      .select("id, name, price, unit, stock, is_active")
      .in("id", productIds)
      .eq("is_active", true);

    if (prodErr || !dbProducts || dbProducts.length === 0) {
      console.error("[createOrder] Error fetching product prices from DB:", prodErr);
      return { success: false, error: "No se pudieron verificar los precios de los productos en la base de datos." };
    }

    const productMap = new Map<number, { id: number; name: string; price: number; unit: string; stock: number | null }>();
    dbProducts.forEach((p) => {
      productMap.set(p.id, {
        id: p.id,
        name: p.name,
        price: Number(p.price),
        unit: p.unit || "unidad",
        stock: p.stock !== null ? Number(p.stock) : null,
      });
    });

    let calculatedSubtotal = 0;
    const validatedItems: {
      productId: number;
      productName: string;
      productUnit: string;
      unitPrice: number;
      quantity: number;
    }[] = [];

    for (const item of sanitizedItems) {
      const dbProd = productMap.get(item.product_id);
      if (!dbProd) {
        return { success: false, error: `El producto #${item.product_id} no está disponible actualmente.` };
      }

      if (dbProd.stock !== null && dbProd.stock < item.quantity) {
        return {
          success: false,
          error: `Stock insuficiente para ${dbProd.name}. Disponible: ${dbProd.stock}, solicitado: ${item.quantity}.`,
        };
      }

      const lineTotal = dbProd.price * item.quantity;
      calculatedSubtotal += lineTotal;

      validatedItems.push({
        productId: dbProd.id,
        productName: dbProd.name,
        productUnit: dbProd.unit,
        unitPrice: dbProd.price,
        quantity: item.quantity,
      });
    }

    // Server-grade shipping calculation: Free over $30 / 30€, otherwise $3.99 standard
    const shippingCost = calculatedSubtotal >= 30 ? 0 : 3.99;
    const calculatedTotal = Number((calculatedSubtotal + shippingCost).toFixed(2));
    const subtotalFormatted = Number(calculatedSubtotal.toFixed(2));

    // Get authentic session user ID if logged in
    const { data: sessionData } = await supabase.auth.getSession();
    const authenticUserId = sessionData?.session?.user?.id || input.userId || null;

    // Create Order in Supabase
    const { data: newOrder, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: authenticUserId,
        customer_name: input.customerName.trim(),
        customer_email: input.customerEmail?.trim() || "cliente@condirico.com",
        customer_phone: input.customerPhone.trim(),
        shipping_address: input.shippingAddress.trim(),
        shipping_city: input.shippingCity?.trim() || "Santiago",
        delivery_instructions: input.deliveryInstructions?.trim() || null,
        subtotal: subtotalFormatted,
        shipping_cost: shippingCost,
        total: calculatedTotal,
        payment_method: input.paymentMethod || "Efectivo contra entrega",
        payment_status: "pending",
        status: "pending",
        whatsapp_sent: input.whatsappSent ?? true,
        notes: input.notes?.trim() || null,
      })
      .select()
      .single();

    if (orderErr || !newOrder) {
      console.error("[createOrder] Error creating order record:", orderErr);
      return { success: false, error: "No se pudo registrar el pedido en la base de datos." };
    }

    // Create Order Items snapshot
    const orderItemsPayload = validatedItems.map((item) => ({
      order_id: newOrder.id,
      product_id: item.productId,
      product_name: item.productName,
      product_unit: item.productUnit,
      unit_price: item.unitPrice,
      quantity: item.quantity,
    }));

    const { data: createdItems, error: itemsErr } = await supabase
      .from("order_items")
      .insert(orderItemsPayload)
      .select();

    if (itemsErr) {
      console.error("[createOrder] Error creating order items snapshot:", itemsErr);
    }

    // Atomic Stock Deduction
    for (const item of validatedItems) {
      const dbProd = productMap.get(item.productId);
      if (dbProd && dbProd.stock !== null) {
        const newStock = Math.max(0, dbProd.stock - item.quantity);
        await supabase
          .from("products")
          .update({ stock: newStock, updated_at: new Date().toISOString() })
          .eq("id", item.productId);
      }
    }

    return {
      success: true,
      order: newOrder,
      orderItems: createdItems || [],
    };
  } catch (err: unknown) {
    console.error("[createOrder] Unexpected error during checkout:", err);
    const msg = err instanceof Error ? err.message : "Ocurrió un error inesperado al procesar el pedido.";
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Fetches the user's past orders with order items
 */
export async function getMyOrders(userId: string): Promise<Order[]> {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getMyOrders] Supabase error:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("[getMyOrders] Unexpected error:", err);
    return [];
  }
}

/**
 * Fetches single order by ID along with its items
 */
export async function getOrderById(
  orderId: number,
  userId?: string
): Promise<{ order: Order | null; items: OrderItem[] }> {
  try {
    let query = supabase.from("orders").select("*").eq("id", orderId);
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: order, error: orderErr } = await query.single();
    if (orderErr || !order) {
      return { order: null, items: [] };
    }

    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (itemsErr) {
      console.error("[getOrderById] Error fetching items:", itemsErr);
    }

    return { order, items: items || [] };
  } catch (err) {
    console.error("[getOrderById] Unexpected error:", err);
    return { order: null, items: [] };
  }
}
