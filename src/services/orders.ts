import { supabase } from "@/lib/supabase";
import { Order, OrderItem, Product } from "@/types/database";

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
  shippingCity: string;
  deliveryInstructions?: string | null;
  paymentMethod: string;
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
 * Validates prices against Supabase database and creates order and order items
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  try {
    if (!input.items || input.items.length === 0) {
      return { success: false, error: "El carrito está vacío." };
    }

    if (!input.customerName.trim() || !input.customerPhone.trim() || !input.shippingAddress.trim()) {
      return { success: false, error: "Por favor completa todos los datos de contacto y entrega requeridos." };
    }

    const productIds = input.items.map((i) => i.productId);

    // 1. Fetch real product prices and info from Supabase database
    const { data: dbProducts, error: prodErr } = await supabase
      .from("products")
      .select("id, name, price, unit, stock, is_active")
      .in("id", productIds)
      .eq("is_active", true);

    if (prodErr || !dbProducts || dbProducts.length === 0) {
      console.error("[createOrder] Error fetching product prices from DB:", prodErr);
      return { success: false, error: "No se pudieron verificar los precios de los productos en la base de datos." };
    }

    const productMap = new Map<number, { id: number; name: string; price: number; unit: string }>();
    dbProducts.forEach((p) => {
      productMap.set(p.id, {
        id: p.id,
        name: p.name,
        price: Number(p.price),
        unit: p.unit || "unidad",
      });
    });

    // 2. Validate quantities & calculate accurate subtotal
    let calculatedSubtotal = 0;
    const validatedItems: {
      productId: number;
      productName: string;
      productUnit: string;
      unitPrice: number;
      quantity: number;
    }[] = [];

    for (const item of input.items) {
      const dbProd = productMap.get(item.productId);
      if (!dbProd) {
        return { success: false, error: `El producto ID #${item.productId} no está disponible actualmente.` };
      }
      if (item.quantity <= 0) continue;

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

    if (validatedItems.length === 0) {
      return { success: false, error: "No hay productos válidos para procesar en el pedido." };
    }

    // 3. Calculate shipping: Envío Gratis a partir de 30€ (o 3.99€ tarifa estándar)
    const shippingCost = calculatedSubtotal >= 30 ? 0 : 3.99;
    const calculatedTotal = Number((calculatedSubtotal + shippingCost).toFixed(2));
    const subtotalFormatted = Number(calculatedSubtotal.toFixed(2));

    // 4. Create Order in Supabase
    const { data: newOrder, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: input.userId || null,
        customer_name: input.customerName.trim(),
        customer_email: input.customerEmail.trim(),
        customer_phone: input.customerPhone.trim(),
        shipping_address: input.shippingAddress.trim(),
        shipping_city: input.shippingCity.trim() || "Santiago",
        delivery_instructions: input.deliveryInstructions?.trim() || null,
        subtotal: subtotalFormatted,
        shipping_cost: shippingCost,
        total: calculatedTotal,
        payment_method: input.paymentMethod || "Efectivo / Transferencia contra entrega",
        payment_status: "pending",
        status: "pending",
        whatsapp_sent: Boolean(input.whatsappSent),
        notes: input.notes?.trim() || null,
      })
      .select()
      .single();

    if (orderErr || !newOrder) {
      console.error("[createOrder] Error creating order record:", orderErr);
      return { success: false, error: "No se pudo registrar el pedido en la base de datos." };
    }

    // 5. Create Order Items (snapshotting product name, unit, and exact price)
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

    return {
      success: true,
      order: newOrder,
      orderItems: createdItems || [],
    };
  } catch (err: any) {
    console.error("[createOrder] Unexpected error during checkout:", err);
    return {
      success: false,
      error: "Ocurrió un error inesperado al procesar el pedido. Por favor inténtalo nuevamente.",
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
