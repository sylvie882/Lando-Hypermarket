export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin' | 'delivery_staff' | 'vendor';
  is_admin?: boolean; // Add this
  avatar?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  preferences?: any;
  loyalty_points: number;
  email_verified_at?: string | null; // Add this
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
// types/index.ts
// types/index.ts - Update the Product interface
export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  discounted_price?: number;
  stock_quantity: number;
  sku: string;
  thumbnail?: string; // Relative path from Laravel
  gallery?: string[]; // Relative paths from Laravel
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

  images?: string[]; // Array of image URLs
  attributes?: Record<string, any>; // For specifications tab
  is_free_shipping?: boolean;

  // Computed attributes from Laravel accessors
  is_in_stock?: boolean;
  main_image?: string; // Full URL from getMainImageAttribute()
  gallery_urls?: string[]; // Full URLs from getGalleryUrlsAttribute()
  
  // Personalized recommendation properties (added)
  relevance_score?: number; // Add this line
  recommendation_type?: string; // Add this line
  personalized_price?: { // Add this line
    original_price: number;
    final_price: number;
    discount_type?: 'percentage' | 'fixed';
    discount_value?: number;
    offer_name?: string;
    valid_until?: string;
    is_personalized_offer: boolean;
    discount_rules_applied?: any;
  };
  availability_status?: 'in_stock' | 'out_of_stock'; // Add this line
  
  // You might also want to add these common fields
  thumbnail_url?: string; // Full URL
  views?: number;
  weight?: number | null;
  unit?: string | null;
  barcode?: string | null;
  min_stock_threshold?: number;
}
// types/index.ts
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  image_url?: string; // Add this line
  parent_id?: number;
  order: number;
  is_active: boolean;
  parent?: Category;
  children?: Category[];
  // You might also want to add these common fields
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

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  address_id: number;
  status: 'pending' | 'confirmed' | 'processing' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
  payment_method: 'cod' | 'credit_card' | 'debit_card' | 'digital_wallet' | 'bank_transfer';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
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

export interface Payment {
  id: number;
  order_id: number;
  transaction_id: string;
  method: 'credit_card' | 'debit_card' | 'cod' | 'digital_wallet' | 'bank_transfer';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_details?: any;
  created_at: string;
  updated_at: string;
}

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
  products: any; // JSON array
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