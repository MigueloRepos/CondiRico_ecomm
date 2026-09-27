import { Category, Product, Profile, Order, OrderItem, ContactMessage, NewsletterSubscriber } from "./database";

export interface AdminSettings {
  id: string | number;
  business_name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  currency: string;
  min_order_amount: number;
  maintenance_mode: boolean;
  logo_url?: string | null;
  whatsapp_orders_enabled?: boolean;
  newsletter_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Promotion {
  id: string | number;
  code: string;
  name: string;
  description: string | null;
  discount_type: "percentage" | "fixed" | string;
  discount_value: number;
  usage_limit: number | null;
  expires_at: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface Banner {
  id: string | number;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string;
  mobile_image_url?: string | null;
  button_text: string | null;
  button_url: string | null;
  position: string | null;
  sort_order: number;
  expires_at: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface OrderStatusHistory {
  id: string | number;
  order_id: number;
  previous_status?: string | null;
  new_status: string;
  note?: string | null;
  changed_by: string | null;
  created_at: string;
}

export interface AdminActivityLog {
  id: string | number;
  action: string;
  entity_type?: string | null;
  entity_id?: string | number | null;
  description: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminNotification {
  id: string | number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  link?: string | null;
  created_at: string;
}

export interface StockMovement {
  id: string | number;
  product_id: number;
  movement_type: "entrada" | "salida" | "ajuste" | "devolucion" | "danado" | string;
  quantity: number;
  previous_stock?: number;
  new_stock?: number;
  reason: string | null;
  created_by?: string | null;
  created_at: string;
  product?: {
    name: string;
    unit: string;
  };
}

export interface CustomerNote {
  id: string | number;
  customer_id: string;
  note: string;
  created_at: string;
}

export interface DashboardSummary {
  active_products: number;
  total_customers: number;
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  low_stock_products: number;
  unread_messages: number;
  active_subscribers: number;
}

export interface AdminTopProduct {
  product_id: number;
  product_name: string;
  units_sold: number;
  revenue: number;
}

export interface AdminDailySale {
  sale_date: string;
  orders_count: number;
  revenue: number;
}

export interface CustomerWithStats extends Profile {
  orders_count: number;
  total_spent: number;
  last_order_date?: string | null;
}
