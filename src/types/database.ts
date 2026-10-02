export type CategoryId = "alimentos" | "primera-necesidad" | "limpieza" | "utiles" | string;

export interface Category {
  id: string;
  name: string;
  short_name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  detail: string | null;
  price: number;
  old_price: number | null;
  category_id: string;
  badge: string | null;
  unit: string;
  rating: number;
  reviews: number;
  is_popular: boolean;
  is_featured: boolean;
  stock: number;
  stock_quantity?: number | null;
  is_active: boolean;
  image_url?: string | null;
  sales_count?: number;
  units_sold?: number;
  created_at?: string;
  updated_at?: string;
  categories?: {
    id: string;
    name: string;
    short_name: string;
  } | null;
}

export type UserRole = "customer" | "user" | "admin";
export type PreferredInvoiceType = "boleta" | "factura" | "ticket";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  delivery_instructions: string | null;
  offers_newsletter: boolean;
  whatsapp_updates: boolean;
  preferred_invoice_type: PreferredInvoiceType | string;
  has_biometrics: boolean;
  role: UserRole | string;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  id: number;
  user_id: string;
  product_id: number;
  quantity: number;
  created_at?: string;
  updated_at?: string;
  product?: Product;
}

export interface Favorite {
  user_id: string;
  product_id: number;
  created_at?: string;
  product?: Product;
}

export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled";
export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
export type ContactMessageStatus = "new" | "read" | "replied" | "archived";

export interface Order {
  id: number;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  delivery_instructions: string | null;
  subtotal: number;
  shipping_cost: number;
  total: number;
  payment_method: string;
  payment_status: PaymentStatus | string;
  status: OrderStatus | string;
  whatsapp_sent: boolean;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_unit: string;
  unit_price: number;
  quantity: number;
  created_at?: string;
}

export interface NewsletterSubscriber {
  id: number;
  email: string;
  is_active: boolean;
  created_at?: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  topic: string;
  message: string;
  status: ContactMessageStatus | string;
  created_at?: string;
}

export interface ProductReview {
  id: string;
  product_id: number;
  user_id: string;
  user_name: string;
  user_email?: string | null;
  rating: number;
  comment: string;
  created_at: string;
  updated_at?: string;
}

export interface ProductReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
}
