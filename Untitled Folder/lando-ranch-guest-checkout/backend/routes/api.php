<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Auth\DeliveryStaffAuthController;
use App\Http\Controllers\Api\DeliveryStaffApiController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Admin\DeliveryController;
use App\Http\Controllers\Admin\DeliveryStaffController;
use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\PromotionController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\WishlistController;
use App\Http\Controllers\Api\SupportController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\BannerController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ======================
// PUBLIC ROUTES (No Login)
// ======================

// Auth: Register, Login, Password Reset
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Social Authentication
Route::get('/social/google', [AuthController::class, 'redirectToGoogle']);
Route::get('/social/google/callback', [AuthController::class, 'handleGoogleCallback']);
Route::post('/social/google/check', [AuthController::class, 'checkGoogleUser']);

// Admin login and debug
Route::post('/admin/login', [AuthController::class, 'adminLogin']);
Route::get('/debug-login', [AuthController::class, 'debugLogin']);

// Check email/phone
Route::post('/check-email', [AuthController::class, 'checkEmail']);
Route::post('/check-phone', [AuthController::class, 'checkPhone']);

// Public order tracking
Route::post('/track-order', [OrderController::class, 'trackPublic']);
Route::get('/track/{trackingId}', function ($trackingId) {
    $delivery = \App\Models\Delivery::where('tracking_id', $trackingId)
        ->with(['order', 'deliveryStaff:id,name,phone,vehicle_type,vehicle_number,delivery_rating'])
        ->first();

    if (!$delivery) {
        return response()->json(['success' => false, 'message' => 'Tracking ID not found'], 404);
    }

    return response()->json([
        'success' => true,
        'data' => [
            'tracking_id'      => $delivery->tracking_id,
            'status'           => $delivery->status,
            'order_number'     => $delivery->order->order_number ?? null,
            'estimated_time'   => $delivery->estimated_delivery_time,
            'delivery_address' => $delivery->delivery_address,
            'driver'           => $delivery->deliveryStaff ? [
                'name'           => $delivery->deliveryStaff->name,
                'phone'          => $delivery->deliveryStaff->phone,
                'vehicle_type'   => $delivery->deliveryStaff->vehicle_type,
                'vehicle_number' => $delivery->deliveryStaff->vehicle_number,
                'rating'         => $delivery->deliveryStaff->delivery_rating,
            ] : null,
            'current_location' => $delivery->current_latitude ? [
                'latitude'  => $delivery->current_latitude,
                'longitude' => $delivery->current_longitude,
                'updated'   => $delivery->location_updated_at,
            ] : null,
        ],
    ]);
});

// Delivery Staff: Public Auth
Route::prefix('delivery-staff')->group(function () {
    Route::post('/login', [DeliveryStaffAuthController::class, 'login']);
    Route::post('/register', [DeliveryStaffAuthController::class, 'register'])->name('delivery.register');
    Route::post('/forgot-password', [DeliveryStaffAuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [DeliveryStaffAuthController::class, 'resetPassword']);
});

// Public resources
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/featured', [ProductController::class, 'featured']);
Route::get('/products/search', [ProductController::class, 'searchAutocomplete']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::get('/products/{id}/related', [ProductController::class, 'related']);
Route::get('/products/{id}/reviews', [ReviewController::class, 'productReviews']);
Route::get('/products/{id}/top-review', [ProductController::class, 'getTopReview']);
Route::get('/products/{id}/review-stats', [ProductController::class, 'reviewStats']);
Route::get('/personalized/recommendations', [ProductController::class, 'personalizedRecommendations']);
Route::post('/products/{id}/track-view', [ProductController::class, 'trackView']);



Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/tree', [CategoryController::class, 'tree']);
Route::get('/categories/{id}', [CategoryController::class, 'show']);
Route::get('/categories/slug/{slug}', [CategoryController::class, 'bySlug']);

Route::get('/reviews', [ReviewController::class, 'index']);
Route::get('/promotions', [PromotionController::class, 'index']);
Route::post('/promotions/validate', [PromotionController::class, 'validateCode']);
Route::get('/banners', [BannerController::class, 'index']);
Route::get('/banners/homepage', [BannerController::class, 'getHomepageBanners']);
Route::post('/banners/{id}/track-click', [BannerController::class, 'trackClick']);

// Add this line next to your existing banner routes
Route::post('/banners/{id}/track-impression', [BannerController::class, 'trackImpression']);

// Test routes
Route::get('/upload-limits', function () {
    return response()->json([
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size'       => ini_get('post_max_size'),
        'memory_limit'        => ini_get('memory_limit'),
        'max_execution_time'  => ini_get('max_execution_time'),
        'max_input_time'      => ini_get('max_input_time'),
        'max_file_uploads'    => ini_get('max_file_uploads'),
    ]);
});
Route::get('/test', function () {
    return response()->json([
        'status'        => 'success',
        'message'       => 'API is working!',
        'timestamp'     => now(),
        'environment'   => app()->environment(),
        'routes_loaded' => true,
    ]);
});
Route::get('/api-status', function () {
    return response()->json([
        'status'    => 'API is running',
        'timestamp' => now(),
        'version'   => '1.0.0',
    ]);
});

// ======================
// M-PESA / PAYPAL WEBHOOKS
// Must be PUBLIC — Safaricom and PayPal call these directly, no auth token.
// ======================
Route::post('/payments/mpesa/callback', [PaymentController::class, 'mpesaWebhook']);
Route::post('/payments/paypal/webhook',  [PaymentController::class, 'paypalWebhook']);

// Add route to test
Route::get('/mpesa/query/{checkoutId}', [PaymentController::class, 'queryStatus']);



// ===========================
// GUEST-FRIENDLY ROUTES (work for logged-in users AND guests)
// Identified by a Sanctum token when present, or an X-Guest-Id header.
// ===========================
Route::middleware('optional.auth')->group(function () {
    // Cart
    Route::get('/cart', [CartController::class, 'show']);
    Route::post('/cart/add', [CartController::class, 'addItem']);
    Route::put('/cart/items/{itemId}', [CartController::class, 'updateItem']);
    Route::delete('/cart/items/{itemId}', [CartController::class, 'removeItem']);
    Route::delete('/cart/clear', [CartController::class, 'clear']);
    Route::get('/cart/count', [CartController::class, 'count']);
    Route::post('/cart/apply-promo', [CartController::class, 'applyPromotion']);

    // Checkout + payment (guests can place an order and pay for it
    // without an account; they just can't list/browse past orders —
    // that stays behind auth:sanctum below, guests use /track-order)
    Route::post('/checkout', [OrderController::class, 'store']);
    Route::post('/orders/{orderId}/pay', [PaymentController::class, 'processPayment']);
});

// ===========================
// PROTECTED ROUTES (Login Required)
// ===========================
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/user/deactivate', [AuthController::class, 'deactivateAccount']);
    Route::get('/user/check-role', [AuthController::class, 'checkRole']);

    // User routes
    Route::get('/user/profile', [UserController::class, 'profile']);
    Route::put('/user/profile', [UserController::class, 'updateProfile']);
    Route::post('/user/change-password', [UserController::class, 'changePassword']);
    Route::get('/user/stats', [UserController::class, 'getStats']);
    Route::get('/user/preferences', [UserController::class, 'getPreferences']);
    Route::put('/user/preferences', [UserController::class, 'updatePreferences']);
    Route::post('/user/avatar', [UserController::class, 'uploadAvatarOnly']);
    Route::delete('/user/avatar', [UserController::class, 'removeAvatar']);
    Route::delete('/user/account', [UserController::class, 'deleteAccount']);
    
    // Route::get('/personalized/recommendations', [ProductController::class, 'getRecommendations']);

    // Addresses
    Route::apiResource('addresses', AddressController::class);
    Route::post('/addresses/{id}/default', [AddressController::class, 'setDefault']);
    Route::post('/addresses/validate', [AddressController::class, 'validateAddress']);

    // Orders
    Route::apiResource('orders', OrderController::class)->except(['update', 'destroy']);
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);
    Route::post('/orders/{id}/verify-delivery-otp', [OrderController::class, 'verifyDeliveryOTP']);
    Route::get('/orders/{id}/generate-delivery-qr', [OrderController::class, 'generateDeliveryQR']);
    Route::get('/orders/track/{identifier}', [OrderController::class, 'track']);
    Route::get('/orders/{id}/live-tracking', [OrderController::class, 'getLiveTracking']);
    Route::get('/orders/{id}/tracking', [OrderController::class, 'getOrderTracking']);

    // Payments
    Route::get('/payment/methods', [PaymentController::class, 'getPaymentMethods']);
    Route::post('/payment/intent', [PaymentController::class, 'createPaymentIntent']);
    // NOTE: paymentHistory does not exist in PaymentController yet — add the method or remove this route
    // Route::get('/payment/history', [PaymentController::class, 'paymentHistory']);

    // Reviews
    Route::apiResource('reviews', ReviewController::class)->except(['index']);
    Route::get('/my-reviews', [ReviewController::class, 'myReviews']);
    Route::post('/reviews/{id}/helpful', [ReviewController::class, 'markHelpful']);

    // Wishlist
    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist/{productId}', [WishlistController::class, 'add']);
    Route::delete('/wishlist/{productId}', [WishlistController::class, 'remove']);
    Route::get('/wishlist/check/{productId}', [WishlistController::class, 'check']);
    Route::get('/wishlist/count', [WishlistController::class, 'count']);
    Route::post('/wishlist/{productId}/move-to-cart', [WishlistController::class, 'moveToCart']);

    // Subscriptions
    Route::apiResource('subscriptions', SubscriptionController::class);
    Route::post('/subscriptions/{id}/cancel', [SubscriptionController::class, 'cancel']);
    Route::post('/subscriptions/{id}/pause', [SubscriptionController::class, 'pause']);
    Route::post('/subscriptions/{id}/resume', [SubscriptionController::class, 'resume']);
    Route::post('/subscriptions/{id}/skip', [SubscriptionController::class, 'skipDelivery']);
    Route::get('/subscriptions/upcoming', [SubscriptionController::class, 'upcomingDeliveries']);
    Route::get('/subscriptions/{id}/history', [SubscriptionController::class, 'history']);

    // Support Tickets
    Route::apiResource('support/tickets', SupportController::class);
    Route::post('/support/tickets/{ticketId}/messages', [SupportController::class, 'addMessage']);
    Route::post('/support/tickets/{ticketId}/close', [SupportController::class, 'closeTicket']);

    // Notifications
    Route::apiResource('notifications', NotificationController::class)->except(['store', 'update']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications', [NotificationController::class, 'clearAll']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::get('/notifications/settings', [NotificationController::class, 'settings']);
    Route::put('/notifications/settings', [NotificationController::class, 'updateSettings']);

    // ======================
    // DELIVERY STAFF ROUTES
    // ======================
    // Inside the delivery-staff sanctum group (protected routes)
Route::prefix('delivery-staff')->group(function () {
    Route::get('stats', [DeliveryStaffApiController::class, 'stats']);
    Route::get('deliveries', [DeliveryStaffApiController::class, 'deliveries']);
    Route::put('online-status', [DeliveryStaffApiController::class, 'onlineStatus']);
    Route::put('deliveries/{id}/status', [DeliveryStaffApiController::class, 'updateStatus']);
    Route::post('deliveries/{id}/verify', [DeliveryStaffApiController::class, 'verifyOtp']);
    Route::post('deliveries/{id}/location', [DeliveryStaffApiController::class, 'updateLocation']);
    
    // ➕ ADD THESE 4 NEW ROUTES:
    Route::get('deliveries/{id}/route', [DeliveryStaffApiController::class, 'getRoute']);
    Route::post('logout', [DeliveryStaffApiController::class, 'logout']);
    Route::get('profile', [DeliveryStaffApiController::class, 'profile']);
    Route::put('profile', [DeliveryStaffApiController::class, 'updateProfile']);
});


});

// ===========================
// ADMIN ROUTES
// ===========================
Route::prefix('admin')->middleware(['auth:sanctum'])->group(function () {

    // Dashboard & System
    Route::get('/dashboard', [AdminController::class, 'dashboardStats']);
    Route::get('/system-info', [AdminController::class, 'systemInfo']);
    Route::post('/clear-cache', [AdminController::class, 'clearCache']);
    Route::get('/analytics', [AdminController::class, 'dashboardStats']);

    // User Management
    Route::get('/users', [AdminController::class, 'getUsers']);
    Route::post('/users', [AdminController::class, 'createUser']);
    Route::put('/users/{id}', [AdminController::class, 'updateUser']);
    Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
    Route::post('/users/{id}/toggle-status', [AdminController::class, 'toggleUserStatus']);

    // Products Management
    Route::get('/products', [ProductController::class, 'adminIndex']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::post('/products/bulk-upload', [ProductController::class, 'bulkUpload']);
    Route::post('/products/bulk-stock', [ProductController::class, 'bulkUpdateStock']);
    Route::get('/products/export', [ProductController::class, 'exportProducts']);

    // Categories Management
    Route::get('/categories', [CategoryController::class, 'adminIndex']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);
    Route::get('/categories/tree', [CategoryController::class, 'adminTree']);

    // Orders Management
    Route::get('/orders', [AdminController::class, 'getOrders']);
    Route::get('/orders/{id}', [AdminController::class, 'getOrderDetails']);
    Route::put('/orders/{id}/status', [AdminController::class, 'updateOrderStatus']);
    Route::get('/orders/{id}/tracking-history', [OrderController::class, 'getTrackingHistory']);

    // Banner Management
    Route::get('/banners', [BannerController::class, 'adminIndex']);
    Route::get('/banners/stats', [BannerController::class, 'getStats']);
    Route::post('/banners', [BannerController::class, 'store']);
    Route::get('/banners/{id}', [BannerController::class, 'show']);
    Route::put('/banners/{id}', [BannerController::class, 'update']);
    Route::delete('/banners/{id}', [BannerController::class, 'destroy']);
    Route::get('/banners/{id}/stats', [BannerController::class, 'getBannerStats']);

    // Promotions Management
    Route::get('/promotions', [PromotionController::class, 'adminIndex']);
    Route::post('/promotions', [PromotionController::class, 'store']);
    Route::put('/promotions/{id}', [PromotionController::class, 'update']);
    Route::delete('/promotions/{id}', [PromotionController::class, 'destroy']);
    Route::get('/promotions/stats', [PromotionController::class, 'stats']);

    // Reviews Management
    Route::get('/reviews/pending', [ReviewController::class, 'pendingReviews']);
    Route::post('/reviews/{id}/approve', [ReviewController::class, 'approveReview']);
    Route::post('/reviews/{id}/reject', [ReviewController::class, 'rejectReview']);

    // Support Tickets Management
    Route::get('/support/tickets', [SupportController::class, 'adminIndex']);
    Route::put('/support/tickets/{id}/assign', [SupportController::class, 'assignTicket']);
    Route::put('/support/tickets/{id}/status', [SupportController::class, 'updateStatus']);
    Route::get('/support/stats', [SupportController::class, 'stats']);

    // Delivery Management
    Route::get('/deliveries', [DeliveryController::class, 'index']);
    Route::get('/deliveries/stats', [DeliveryController::class, 'stats']);
    Route::post('/deliveries/assign', [DeliveryController::class, 'assign']);
    Route::post('/deliveries/bulk-assign', [DeliveryController::class, 'bulkAssign']);
    Route::get('/deliveries/available-staff', [DeliveryController::class, 'availableStaff']);
    Route::get('/deliveries/{id}/tracking', [DeliveryController::class, 'getDeliveryTracking']);
    Route::put('/deliveries/{id}/status', [DeliveryController::class, 'updateStatus']);

    // Delivery Staff Management
    Route::get('/delivery-staff', [DeliveryStaffController::class, 'index']);
    Route::post('/delivery-staff', [DeliveryStaffController::class, 'store']);
    Route::get('/delivery-staff/{id}', [DeliveryStaffController::class, 'show']);
    Route::put('/delivery-staff/{id}', [DeliveryStaffController::class, 'update']);
    Route::delete('/delivery-staff/{id}', [DeliveryStaffController::class, 'destroy']);
    Route::put('/delivery-staff/{id}/toggle-online', [DeliveryStaffController::class, 'toggleOnline']);
    Route::get('/delivery-staff/{id}/performance', [DeliveryStaffController::class, 'performance']);

    // Payments Management
    // NOTE: adminIndex and refund do not exist in PaymentController yet.
    // Add those methods to PaymentController, or comment these out until ready.
    // Route::get('/payments', [PaymentController::class, 'adminIndex']);
    // Route::post('/payments/{paymentId}/refund', [PaymentController::class, 'refund']);
});