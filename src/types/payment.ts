export type PaymentProvider = 'paypal' | 'stripe' | 'google_pay';

export type PaymentMethodType = 'paypal' | 'card' | 'google_pay';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export interface PaymentRecord {
  id: string;
  order_id: number;
  user_id: string | null;
  provider: PaymentProvider;
  payment_method?: PaymentMethodType;
  provider_payment_id: string | null;
  provider_order_id?: string | null;
  provider_transaction_id?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  idempotency_key?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  paid_at?: string | null;
}

export interface CartItemCheckoutInput {
  productId: number;
  quantity: number;
}

export interface CreatePaymentOrderInput {
  cartItems: CartItemCheckoutInput[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity?: string;
  deliveryInstructions?: string | null;
  provider: PaymentProvider;
  paymentMethod?: PaymentMethodType;
  idempotencyKey?: string;
}

export interface ServerOrderSummary {
  orderId: number;
  paymentId?: string;
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
}

export interface PayPalCreateOrderResult {
  success: boolean;
  orderId: number;
  paypalOrderId: string;
  amount: number;
  currency: string;
  error?: string;
}

export interface PayPalCaptureResult {
  success: boolean;
  orderId: number;
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paidAt: string;
  error?: string;
}

export interface StripePaymentIntentResult {
  success: boolean;
  orderId: number;
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  error?: string;
}

export interface PaymentPublicConfig {
  paypalClientId: string | null;
  paypalCurrency: string;
  stripePublishableKey: string | null;
  googlePayMerchantId: string | null;
  isSandbox: boolean;
  isGooglePayEligible?: boolean;
  supportedProviders: PaymentProvider[];
  supportedMethods: PaymentMethodType[];
}

export interface WebhookEventRecord {
  id: string;
  event_id: string;
  provider: PaymentProvider;
  event_type: string;
  processed: boolean;
  created_at: string;
}
