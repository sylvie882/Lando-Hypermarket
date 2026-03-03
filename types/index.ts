// types/index.ts

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin' | 'delivery_staff' | 'vendor';
  is_admin?: boolean;
  avatar?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  preferences?: any;
  country?: string;
  loyalty_points: number;
  email_verified_at?: string | null;
  info?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile_picture_url?: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  discounted_price?: number;
  stock_quantity: number;
  sku: string;
  thumbnail?: string;
  gallery?: string[];
  rating: number;
  review_count: number;
  sold_count: number;
  is_featured: boolean;
  is_active: boolean;
  category_id: number;
  vendor_id?: number;
  category?: Category;
  vendor?: User;
  created_at: string;
  updated_at: string;  
  final_price?: number | string;
  images?: string[];
  attributes?: Record<string, any>;
  is_free_shipping?: boolean;
  is_in_stock?: boolean;
  main_image?: string;
  gallery_urls?: string[];
  relevance_score?: number;
  recommendation_type?: string;
  personalized_price?: {
    original_price: number;
    final_price: number;
    discount_type?: 'percentage' | 'fixed';
    discount_value?: number;
    offer_name?: string;
    valid_until?: string;
    is_personalized_offer: boolean;
    discount_rules_applied?: any;
  };
  availability_status?: 'in_stock' | 'out_of_stock';
  thumbnail_url?: string;
  views?: number;
  weight?: number | null;
  unit?: string | null;
  barcode?: string | null;
  min_stock_threshold?: number;
  metadata?: {
    relevance_score?: number;
    recommendation_type?: string;
  };
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  image_url?: string;
  parent_id?: number;
  order: number;
  is_active: boolean;
  parent?: Category;
  children?: Category[];
  products_count?: number;
  active_products_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
  total: number;
  item_count: number;
}

export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  price: number;
  product: Product;
  subtotal: number;
}

// ============================================
// UPDATED PAYMENT TYPES WITH M-PESA SUPPORT
// ============================================

export type PaymentMethod = 
  | 'cod' 
  | 'credit_card' 
  | 'debit_card' 
  | 'digital_wallet' 
  | 'bank_transfer'
  | 'mpesa_till'
  | 'mpesa_stk'
  | 'paypal'
  | 'google_pay'
  | 'apple_pay'
  | 'stripe';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'pending_confirmation';

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  address_id: number;
  status: 'pending' | 'confirmed' | 'processing' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned' | 'pending_payment';
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal: number;
  tax: number;
  shipping_fee: number;
  discount: number;
  total: number;
  notes?: string;
  delivery_slot?: string;
  is_urgent: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
  address?: Address;
  items?: OrderItem[];
  payment?: Payment;
  delivery?: Delivery;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  discount: number;
  total: number;
  product?: Product;
}

export interface Address {
  id: number;
  user_id: number;
  label: string;
  contact_name: string;
  contact_phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// UPDATED PAYMENT INTERFACE WITH M-PESA FIELDS
// ============================================

export interface Payment {
  id: number;
  order_id: number;
  transaction_id: string;
  method: PaymentMethod;
  amount: number;
  currency?: string;
  status: PaymentStatus;
  payment_details?: PaymentDetails;
  provider_reference?: string;
  payment_response?: any;
  error_message?: string;
  created_at: string;
  updated_at: string;
  order?: Order;
}

// Payment details types for different methods
export interface MpesaTillPaymentDetails {
  till_number: string;
  till_name: string;
  phone_number?: string;
  transaction_reference?: string;
  amount_paid?: number;
  confirmed_at?: string;
  payment_confirmed?: boolean;
}

export interface MpesaStkPaymentDetails {
  phone_number: string;
  checkout_request_id?: string;
  merchant_request_id?: string;
  response_code?: string;
  response_description?: string;
  customer_message?: string;
}

export interface CardPaymentDetails {
  card_number?: string;
  card_last4?: string;
  card_brand?: string;
  payment_intent_id?: string;
  client_secret?: string;
  save_card?: boolean;
}

export interface BankTransferDetails {
  bank_name: string;
  account_number: string;
  routing_number?: string;
  reference: string;
  instructions?: string;
}

export interface PayPalPaymentDetails {
  payment_id?: string;
  order_id?: string;
  payer_id?: string;
  payer_email?: string;
}

export interface GooglePayPaymentDetails {
  payment_method_id?: string;
  token?: string;
}

export interface ApplePayPaymentDetails {
  token?: string;
}

export type PaymentDetails = 
  | (MpesaTillPaymentDetails & { method: 'mpesa_till' })
  | (MpesaStkPaymentDetails & { method: 'mpesa_stk' })
  | (CardPaymentDetails & { method: 'credit_card' | 'debit_card' | 'stripe' })
  | (BankTransferDetails & { method: 'bank_transfer' })
  | (PayPalPaymentDetails & { method: 'paypal' })
  | (GooglePayPaymentDetails & { method: 'google_pay' })
  | (ApplePayPaymentDetails & { method: 'apple_pay' })
  | { method: 'cod' };

// M-Pesa specific types
export interface MpesaTillInfo {
  till_number: string;
  till_name: string;
  amount: number;
  order_number?: string;
  instructions: string[];
  business_name: string;
}

export interface MpesaPaymentRequest {
  phone_number: string;
  amount: number;
  order_id: number;
  payment_method: 'mpesa_till' | 'mpesa_stk';
}

export interface MpesaPaymentConfirmation {
  order_id: number;
  transaction_reference: string;
  phone_number: string;
  amount_paid: number;
  payment_method: 'mpesa_till';
}

export interface MpesaStkResponse {
  checkout_request_id: string;
  response_code: string;
  response_description: string;
  customer_message: string;
  merchant_request_id: string;
}

export interface MpesaCallbackData {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

// Payment method configuration
export interface PaymentMethodConfig {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: string;
  available: boolean;
  supported_countries?: string[];
  min_amount?: number;
  max_amount?: number;
  instructions?: string;
  processing_time?: string;
  till_number?: string; // For M-Pesa Till
  till_name?: string; // For M-Pesa Till
  supported_cards?: string[];
}

// Payment intent response
export interface PaymentIntent {
  client_secret: string;
  payment_intent_id: string;
  publishable_key: string;
}

// Payment processing result
export interface PaymentResult {
  success: boolean;
  transaction_id?: string;
  provider_reference?: string;
  message?: string;
  response_data?: any;
  mpesa_details?: MpesaTillInfo;
}

// ============================================
// END OF UPDATED PAYMENT TYPES
// ============================================

export interface Delivery {
  id: number;
  order_id: number;
  delivery_staff_id?: number;
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'returned';
  delivery_address: string;
  latitude?: number;
  longitude?: number;
  estimated_delivery_time?: string;
  actual_delivery_time?: string;
  delivery_notes?: string;
  route_data?: any;
  otp?: string;
  signature_image?: string;
  created_at: string;
  updated_at: string;
  order?: Order;
  delivery_staff?: User;
}

export interface Review {
  id: number;
  user_id: number;
  product_id: number;
  order_id: number;
  rating: number;
  comment?: string;
  images?: string[];
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
  product?: Product;
  order?: Order;
  title?: string;
}

export interface Promotion {
  id: number;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'buy_one_get_one';
  discount_value?: number;
  minimum_order_amount?: number;
  usage_limit?: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  applicable_categories?: number[];
  applicable_products?: number[];
  created_at: string;
  updated_at: string;
}

export interface Wishlist {
  id: number;
  user_id: number;
  product_id: number;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface Subscription {
  id: number;
  user_id: number;
  name: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  products: any;
  start_date: string;
  next_delivery_date: string;
  status: 'active' | 'paused' | 'cancelled' | 'completed';
  deliveries_count: number;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface SupportTicket {
  id: number;
  ticket_number: string;
  user_id: number;
  assigned_to?: number;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: 'order' | 'delivery' | 'product' | 'payment' | 'account' | 'other';
  created_at: string;
  updated_at: string;
  user?: User;
  assigned_to_user?: User;
  messages?: TicketMessage[];
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  user_id: number;
  message: string;
  attachments?: any;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

// ============================================
// ADDED: Payment method specific types for frontend
// ============================================

// M-Pesa Till display data
export interface MpesaTillDisplayData {
  tillNumber: string;
  tillName: string;
  amount: number;
  steps: string[];
  businessName: string;
}

// M-Pesa confirmation form data
export interface MpesaConfirmationFormData {
  transaction_reference: string;
  phone_number: string;
  amount_paid: string;
}

// Payment method option for checkout
export interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: string;
  instructions?: string;
  available: boolean;
  supported_countries?: string[];
  till_number?: string;
  till_name?: string;
  min_amount?: number;
  max_amount?: number;
}

// Payment processing state
export interface PaymentProcessingState {
  isProcessing: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage?: string;
  transactionId?: string;
  providerReference?: string;
  mpesaDetails?: MpesaTillDisplayData;
}

// Order with payment details
export interface OrderWithPayment extends Order {
  payment?: Payment & {
    mpesa_details?: MpesaTillPaymentDetails;
  };
}

// M-Pesa payment response from API
export interface MpesaPaymentResponse {
  success: boolean;
  transaction_id: string;
  provider_reference: string;
  message: string;
  response_data?: any;
  mpesa_details?: {
    till_number: string;
    till_name: string;
    amount: number;
    order_number: string;
    instructions: string;
  };
}