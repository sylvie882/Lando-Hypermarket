import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Use environment variable directly or fallback - ensure it includes /api
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.hypermarket.co.ke/api';

// Helper to get base URL without /api for storage URLs
export const getBaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'https://api.hypermarket.co.ke/api';
  
  // Remove trailing /api if present
  let baseUrl = url.trim();
  
  // Remove trailing slash if present
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
  
  // Remove /api suffix if present
  if (baseUrl.endsWith('/api')) {
    baseUrl = baseUrl.slice(0, -4); // Remove '/api'
  }
  
  // Ensure it doesn't end with slash
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
  
  console.log('Base URL for storage:', baseUrl);
  return baseUrl;
};

class ApiService {
  private api: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = getBaseUrl();
    console.log('API Service initialized with:', {
      apiUrl: API_URL,
      baseUrl: this.baseUrl,
      envVar: process.env.NEXT_PUBLIC_API_URL
    });
    
    this.api = axios.create({
      baseURL: API_URL, // This includes /api for API calls
      headers: {
        'Accept': 'application/json',
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  // Add a method to get storage URLs
  getStorageUrl(path: string): string {
    if (!path) {
      return '/images/placeholder.jpg';
    }
    
    // If it's already a full URL, return it as-is
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    
    // Remove leading slash if present
    const cleanPath = path.replace(/^\//, '');
    
    // Construct URL
    const storageUrl = `${this.baseUrl}/storage/${cleanPath}`;
    console.log('Storage URL constructed:', { original: path, cleaned: cleanPath, final: storageUrl });
    
    return storageUrl;
  }

  // Helper method to get image URL with fallback
  getImageUrl(imagePath: string | null | undefined, fallback?: string): string {
    if (!imagePath) {
      return fallback || '/images/placeholder.jpg';
    }
    
    // If it's already a full URL, return it as-is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
      return imagePath;
    }
    
    // Otherwise, construct the storage URL
    return this.getStorageUrl(imagePath);
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Handle FormData vs JSON content types
        if (config.data instanceof FormData) {
          // For FormData, let browser set Content-Type with boundary
          // Remove Content-Type header to let browser set it automatically
          delete config.headers['Content-Type'];
        } else if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
          // For JSON data, set Content-Type
          config.headers['Content-Type'] = 'application/json';
        } else if (!config.data && config.method?.toLowerCase() !== 'get') {
          // For non-GET requests with no data, set JSON content type
          config.headers['Content-Type'] = 'application/json';
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        const isAuthRequest = error.config?.url?.includes('/login') || 
                             error.config?.url?.includes('/register') ||
                             error.config?.url?.includes('/forgot-password') ||
                             error.config?.url?.includes('/reset-password') ||
                             error.config?.url?.includes('/admin/login');
        
        const isAdminLoginPage = typeof window !== 'undefined' && 
          window.location.pathname.includes('/admin/login');
        
        if (error.response?.status === 401 && !isAuthRequest && !isAdminLoginPage) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Check if we're in an admin route
            if (window.location.pathname.includes('/admin')) {
              window.location.href = '/admin/login';
            } else {
              window.location.href = '/auth/login';
            }
          }
        }
        
        // Handle 403 Forbidden (admin access denied)
        if (error.config?.url?.includes('/admin/') && error.response?.status === 403) {
          if (typeof window !== 'undefined' && !isAdminLoginPage) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/admin/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Auth APIs
  auth = {
    login: (credentials: { email: string; password: string }) => 
      this.api.post('/login', credentials),
    
    register: (data: { 
      name: string; 
      email: string; 
      phone: string; 
      password: string; 
      password_confirmation: string;
      role?: string;
    }) => this.api.post('/register', data),
    
    adminLogin: (credentials: { email: string; password: string }) =>
      this.api.post('/admin/login', credentials),
    
    logout: () => this.api.post('/logout'),
    
    getUser: () => this.api.get('/user'),
    
    updateProfile: (data: any) => {
      if (data instanceof FormData) {
        return this.api.post('/profile', data);
      } else {
        return this.api.put('/profile', data);
      }
    },
    
    changePassword: (data: { 
      current_password: string; 
      new_password: string; 
      new_password_confirmation: string 
    }) => this.api.post('/change-password', data),
    
    forgotPassword: (email: string) => 
      this.api.post('/forgot-password', { email }),

    resetPassword: (data: { 
      token: string; 
      password: string; 
      password_confirmation: string 
    }) => this.api.post('/reset-password', data),

    verifyEmail: (token: string) =>
      this.api.post('/email/verify', { token }),

    resendVerificationEmail: (email: string) =>
      this.api.post('/email/resend', { email }),

    checkRole: () => this.api.get('/user/check-role'),

    getAdminStatus: async (): Promise<boolean> => {
      try {
        const response = await this.api.get('/user');
        return response.data?.role === 'admin' || response.data?.isAdmin || false;
      } catch (error) {
        return false;
      }
    },

    checkAdminAccess: async (): Promise<boolean> => {
      try {
        const response = await this.api.get('/user');
        return response.data?.role === 'admin' || response.data?.isAdmin || false;
      } catch (error: any) {
        if (error.response?.status === 403 || error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/admin/login';
          }
        }
        return false;
      }
    },

    isAuthenticated: (): boolean => {
      if (typeof window === 'undefined') return false;
      return !!localStorage.getItem('token');
    },

    getCurrentUser: () => {
      if (typeof window === 'undefined') return null;
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    },

    isCurrentUserAdmin: (): boolean => {
      if (typeof window === 'undefined') return false;
      const user = this.auth.getCurrentUser();
      return user?.role === 'admin' || user?.isAdmin || false;
    },
  };

  // Promotion APIs (Public)
  promotions = {
    getAll: (params?: { type?: string }) => 
      this.api.get('/promotions', { params }),
    
    validate: (data: { code: string; order_amount: number }) => 
      this.api.post('/promotions/validate', data),
  };

  // Cart APIs (including promo apply)
  cart = {
    get: () => this.api.get('/cart'),
    addItem: (data: { product_id: number; quantity: number }) => 
      this.api.post('/cart/add', data),
    updateItem: (itemId: number, data: { quantity: number }) => 
      this.api.put(`/cart/items/${itemId}`, data),
    removeItem: (itemId: number) => this.api.delete(`/cart/items/${itemId}`),
    clear: () => this.api.delete('/cart/clear'),
    getCount: () => this.api.get('/cart/count'),
    applyPromo: (promoCode: string) => 
      this.api.post('/cart/apply-promo', { promo_code: promoCode }),
  };

  // Admin APIs
  admin = {
    // Dashboard
    getDashboardStats: () => this.api.get('/admin/dashboard'),
    getSystemInfo: () => this.api.get('/admin/system-info'),
    clearCache: () => this.api.post('/admin/clear-cache'),
    
    // Reports
    getSalesReport: (params?: any) => this.api.get('/admin/sales-report', { params }),
    
    // User Management
    getUsers: (params?: any) => this.api.get('/admin/users', { params }),
    createUser: (data: any) => this.api.post('/admin/users', data),
    updateUser: (id: number, data: any) => this.api.put(`/admin/users/${id}`, data),
    deleteUser: (id: number) => this.api.delete(`/admin/users/${id}`),
    toggleUserStatus: (id: number) => this.api.post(`/admin/users/${id}/toggle-status`),
    
    // Product Management
    getProducts: (params?: any) => this.api.get('/admin/products', { params }),
    createProduct: (data: any) => {
      if (data instanceof FormData) {
        return this.api.post('/admin/products', data);
      } else {
        return this.api.post('/admin/products', data, {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    },
    updateProduct: (id: number, data: any) => {
      if (data instanceof FormData) {
        return this.api.put(`/admin/products/${id}`, data);
      } else {
        return this.api.put(`/admin/products/${id}`, data, {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    },
    deleteProduct: (id: number) => this.api.delete(`/admin/products/${id}`),
    uploadProductsBulk: (data: FormData) => 
      this.api.post('/admin/products/bulk-upload', data),
    bulkUpdateStock: (data: any) => this.api.post('/admin/products/bulk-stock', data),
    exportProducts: () => this.api.get('/admin/products/export'),
    
    // Category Management
    getCategories: (params?: any) => this.api.get('/admin/categories', { params }),
    createCategory: (data: any) => {
      if (data instanceof FormData) {
        return this.api.post('/admin/categories', data);
      } else {
        return this.api.post('/admin/categories', data, {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    },
    updateCategory: (id: number, data: any) => {
      if (data instanceof FormData) {
        return this.api.put(`/admin/categories/${id}`, data);
      } else {
        return this.api.put(`/admin/categories/${id}`, data, {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    },
    deleteCategory: (id: number) => this.api.delete(`/admin/categories/${id}`),
    getCategoryTree: () => this.api.get('/admin/categories/tree'),
    
    // Order Management
    getOrders: (params?: any) => this.api.get('/admin/orders', { params }),
    getOrderDetails: (id: number) => this.api.get(`/admin/orders/${id}`),
    updateOrderStatus: (id: number, data: any) => 
      this.api.put(`/admin/orders/${id}/status`, data),
    getOrderTrackingHistory: (id: number) => 
      this.api.get(`/admin/orders/${id}/tracking-history`),
    
    // Banner Management
    getBanners: (params?: any) => this.api.get('/admin/banners', { params }),
    getBanner: (id: number) => this.api.get(`/admin/banners/${id}`),
    getBannerStats: () => this.api.get('/admin/banners/stats'),
    createBanner: (data: FormData) => this.api.post('/admin/banners', data),
    updateBanner: (id: number, data: FormData) => this.api.put(`/admin/banners/${id}`, data),
    deleteBanner: (id: number) => this.api.delete(`/admin/banners/${id}`),
    getBannerAnalytics: (bannerId: number, params?: any) => 
      this.api.get(`/admin/banners/${bannerId}/stats`, { params }),
    
    // Promotion Management
    getAllPromotions: (params?: { 
      search?: string; 
      status?: string; 
      type?: string;
      page?: number;
      per_page?: number;
    }) => this.api.get('/admin/promotions', { params }),
    
    createPromotion: (data: {
      code: string;
      name: string;
      description?: string;
      type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'buy_one_get_one';
      discount_value: number;
      minimum_order_amount?: number;
      max_discount_amount?: number;
      usage_limit?: number;
      valid_from: string;
      valid_until: string;
      is_active?: boolean;
    }) => this.api.post('/admin/promotions', data),
    
    updatePromotion: (id: number, data: {
      code?: string;
      name?: string;
      description?: string;
      type?: 'percentage' | 'fixed_amount' | 'free_shipping' | 'buy_one_get_one';
      discount_value?: number;
      minimum_order_amount?: number;
      max_discount_amount?: number;
      usage_limit?: number;
      valid_from?: string;
      valid_until?: string;
      is_active?: boolean;
    }) => this.api.put(`/admin/promotions/${id}`, data),
    
    deletePromotion: (id: number) => this.api.delete(`/admin/promotions/${id}`),
    
    getPromotionStats: () => this.api.get('/admin/promotions/stats'),

    // Review Management
    getPendingReviews: () => this.api.get('/admin/reviews/pending'),
    approveReview: (id: number) => this.api.post(`/admin/reviews/${id}/approve`),
    rejectReview: (id: number, data: any) => this.api.post(`/admin/reviews/${id}/reject`, data),
    
    // Support Management
    getAllSupportTickets: (params?: any) => this.api.get('/admin/support/tickets', { params }),
    assignTicket: (id: number, data: any) => 
      this.api.put(`/admin/support/tickets/${id}/assign`, data),
    updateTicketStatus: (id: number, data: any) => 
      this.api.put(`/admin/support/tickets/${id}/status`, data),
    getSupportStats: () => this.api.get('/admin/support/stats'),
    
    // Delivery Management
    assignDelivery: (orderId: number, data: any) => 
      this.api.post(`/admin/orders/${orderId}/assign-delivery`, data),
    bulkAssignDelivery: (data: any) => this.api.post('/admin/delivery/bulk-assign', data),
    getDeliveries: (params?: any) => this.api.get('/admin/deliveries', { params }),
    getDeliveryTracking: (id: number) => this.api.get(`/admin/deliveries/${id}/tracking`),
    
    // Payment Management
    getPayments: (params?: any) => this.api.get('/admin/payments', { params }),
    refundPayment: (paymentId: number, data: any) => 
      this.api.post(`/admin/payments/${paymentId}/refund`, data),

    // Analytics
    getAnalytics: () => this.api.get('/admin/analytics'),
  };

  // Vendor APIs
  vendor = {
    getDashboard: () => this.api.get('/vendor/dashboard'),
    getOrders: () => this.api.get('/vendor/orders'),
    getProducts: () => this.api.get('/vendor/products'),
  };

  // Delivery Staff APIs
  delivery = {
    getMyDeliveries: () => this.api.get('/delivery/my-deliveries'),
    updateLocation: (id: number, data: any) => this.api.post(`/delivery/${id}/update-location`, data),
    startDelivery: (id: number) => this.api.post(`/delivery/${id}/start`),
    completeDelivery: (id: number) => this.api.post(`/delivery/${id}/complete`),
    updateStatus: (id: number, data: any) => this.api.put(`/delivery/${id}/status`, data),
    verifyDelivery: (id: number, data: any) => this.api.post(`/delivery/${id}/verify`, data),
    getRoute: (id: number) => this.api.get(`/delivery/${id}/route`),
  };

  // Public API sections
  banners = {
    getHomepage: () => this.api.get('/banners/homepage'),
    getAll: (params?: any) => this.api.get('/banners', { params }),
    trackClick: (id: number) => this.api.post(`/banners/${id}/track-click`),
    getStats: (bannerId: string | number | undefined | null) => {
      if (!bannerId && bannerId !== 0) {
        return Promise.resolve({ 
          data: { 
            clicks: 0, 
            impressions: 0, 
            conversion_rate: 0,
            ctr: 0,
            total_clicks: 0,
            total_impressions: 0,
            unique_clicks: 0,
            unique_impressions: 0,
            start_date: null,
            end_date: null,
            daily_stats: []
          } 
        });
      }
      return this.api.get(`/banners/${bannerId}/stats`);
    },
    getById: (id: string | number) => this.api.get(`/banners/${id}`),
    trackImpression: (id: number) => this.api.post(`/banners/${id}/track-impression`),
  };

  products = {
    getAll: (params?: any) => this.api.get('/products', { params }),
    getById: (id: string | number) => this.api.get(`/products/${id}`),
    getFeatured: () => this.api.get('/products/featured'),
    search: (query: string) => this.api.get('/products/search', { params: { query } }),
    getRelated: (id: string | number) => this.api.get(`/products/${id}/related`),
    getReviews: (id: string | number) => this.api.get(`/products/${id}/reviews`),
    getTopReview: (id: string | number) => this.api.get(`/products/${id}/top-review`),
    getReviewStats: (id: string | number) => this.api.get(`/products/${id}/review-stats`),

    // Personalized recommendations
    getPersonalizedRecommendations: (params?: { limit?: number }) =>
      this.api.get('/personalized/recommendations', { params }),

    // Personalized offers
    getPersonalizedOffers: (params?: { per_page?: number }) =>
      this.api.get('/personalized/offers', { params }),

    // User preferences
    getUserPreferences: () =>
      this.api.get('/preferences'),

    // Update preferences
    updatePreferences: (data: any) =>
      this.api.put('/preferences', data),

    // Shopping analytics
    getShoppingAnalytics: () =>
      this.api.get('/shopping-analytics'),

    // Track product view
    trackView: (productId: number) =>
      this.api.post(`/products/${productId}/track-view`),

    // Track offer interaction
    trackOfferInteraction: (data: any) =>
      this.api.post('/track-offer-interaction', data),

    // Get real-time offers
    getRealTimeOffers: (params?: any) =>
      this.api.get('/real-time-offers', { params }),

    // Add these too for testing
    getPersonalizedPricing: (productId: number) =>
      this.api.get(`/products/${productId}/personalized-pricing`),
  };

  categories = {
    getAll: () => this.api.get('/categories'),
    getTree: () => this.api.get('/categories/tree'),
    getById: (id: string | number) => this.api.get(`/categories/${id}`),
    getBySlug: (slug: string) => this.api.get(`/categories/slug/${slug}`),
  };

  orders = {
    getAll: (params?: any) => this.api.get('/orders', { params }),
    getById: (id: string | number) => this.api.get(`/orders/${id}`),
    create: (data: any) => this.api.post('/checkout', data),
    cancel: (id: string | number) => this.api.post(`/orders/${id}/cancel`),
    track: (orderNumber: string) => this.api.get(`/orders/track/${orderNumber}`),
    trackPublic: (data: any) => this.api.post('/track-order', data),
    getLiveTracking: (id: string | number) => this.api.get(`/orders/${id}/live-tracking`),
    getTracking: (id: string | number) => this.api.get(`/orders/${id}/tracking`),
    verifyDeliveryOTP: (id: string | number, data: any) => 
      this.api.post(`/orders/${id}/verify-delivery-otp`, data),
    generateDeliveryQR: (id: string | number) => 
      this.api.get(`/orders/${id}/generate-delivery-qr`),
  };

  addresses = {
    getAll: () => this.api.get('/addresses'),
    create: (data: any) => this.api.post('/addresses', data),
    update: (id: number, data: any) => this.api.put(`/addresses/${id}`, data),
    delete: (id: number) => this.api.delete(`/addresses/${id}`),
    setDefault: (id: number) => this.api.post(`/addresses/${id}/default`),
    validate: (data: any) => this.api.post('/addresses/validate', data),
  };

  reviews = {
    getAll: (params?: any) => this.api.get('/reviews', { params }),
    create: (data: any) => this.api.post('/reviews', data),
    update: (id: number, data: any) => this.api.put(`/reviews/${id}`, data),
    delete: (id: number) => this.api.delete(`/reviews/${id}`),
    getMyReviews: () => this.api.get('/my-reviews'),
    markHelpful: (id: number) => this.api.post(`/reviews/${id}/helpful`),
  };

  wishlist = {
    getAll: () => this.api.get('/wishlist'),
    add: (productId: number) => this.api.post(`/wishlist/${productId}`),
    remove: (productId: number) => this.api.delete(`/wishlist/${productId}`),
    check: (productId: number) => this.api.get(`/wishlist/check/${productId}`),
    getCount: () => this.api.get('/wishlist/count'),
    moveToCart: (productId: number) => this.api.post(`/wishlist/${productId}/move-to-cart`),
  };

  subscriptions = {
    getAll: () => this.api.get('/subscriptions'),
    create: (data: any) => this.api.post('/subscriptions', data),
    update: (id: number, data: any) => this.api.put(`/subscriptions/${id}`, data),
    delete: (id: number) => this.api.delete(`/subscriptions/${id}`),
    cancel: (id: number) => this.api.post(`/subscriptions/${id}/cancel`),
    pause: (id: number) => this.api.post(`/subscriptions/${id}/pause`),
    resume: (id: number) => this.api.post(`/subscriptions/${id}/resume`),
    skipDelivery: (id: number) => this.api.post(`/subscriptions/${id}/skip`),
    getUpcoming: () => this.api.get('/subscriptions/upcoming'),
    getHistory: (id: number) => this.api.get(`/subscriptions/${id}/history`),
  };

  support = {
    getAll: () => this.api.get('/support/tickets'),
    create: (data: any) => this.api.post('/support/tickets', data),
    createPublic: (data: any) => this.api.post('/support/public', data),
    getById: (id: number) => this.api.get(`/support/tickets/${id}`),
    addMessage: (ticketId: number, data: any) => 
      this.api.post(`/support/tickets/${ticketId}/messages`, data),
    close: (ticketId: number) => this.api.post(`/support/tickets/${ticketId}/close`),
  };

  notifications = {
    getAll: (params?: any) => this.api.get('/notifications', { params }),
    markAsRead: (id: number) => this.api.post(`/notifications/${id}/read`),
    markAllAsRead: () => this.api.post('/notifications/read-all'),
    clearAll: () => this.api.delete('/notifications'),
    getUnreadCount: () => this.api.get('/notifications/unread-count'),
    getSettings: () => this.api.get('/notifications/settings'),
    updateSettings: (data: any) => this.api.put('/notifications/settings', data),
  };

  payments = {
    getMethods: () => this.api.get('/payment/methods'),
    createIntent: (data: any) => this.api.post('/payment/intent', data),
    process: (orderId: number, data: any) => 
      this.api.post(`/orders/${orderId}/pay`, data),
    getHistory: () => this.api.get('/payment/history'),
  };

  // Generic methods
  get = <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => 
    this.api.get<T>(url, config);
  
  post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => 
    this.api.post<T>(url, data, config);
  
  put = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => 
    this.api.put<T>(url, data, config);
  
  delete = <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => 
    this.api.delete<T>(url, config);
  
  patch = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => 
    this.api.patch<T>(url, data, config);
}

// Export a singleton instance
export const api = new ApiService();