<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Address;
use App\Models\Promotion;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\OrderTrackingHistory;
use App\Models\TrackingCode;
use App\Models\Delivery;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    /**
     * Generate a truly unique tracking number with retry logic
     */
    private function generateUniqueTrackingNumber($maxAttempts = 10)
    {
        $attempt = 0;
        
        do {
            $attempt++;
            
            // Generate with microtime for better uniqueness
            $timestamp = microtime(true) * 10000;
            $random = strtoupper(Str::random(6));
            
            // Format: TRK-YYYYMMDD-RANDOM-MICROTIME
            $trackingNumber = 'TRK-' . date('Ymd') . '-' . $random . '-' . substr($timestamp, -4);
            
            // Check if it exists in both tables
            $existsInTrackingCodes = TrackingCode::where('tracking_number', $trackingNumber)->exists();
            $existsInOrders = Order::where('tracking_number', $trackingNumber)->exists();
            
            Log::info("Tracking number generation attempt {$attempt}: {$trackingNumber}, existsInTrackingCodes: " . ($existsInTrackingCodes ? 'true' : 'false') . ", existsInOrders: " . ($existsInOrders ? 'true' : 'false'));
            
            if (!$existsInTrackingCodes && !$existsInOrders) {
                return $trackingNumber;
            }
            
            if ($attempt >= $maxAttempts) {
                // Fallback: Use UUID if we can't generate a unique one
                $trackingNumber = 'TRK-' . date('YmdHis') . '-' . strtoupper(Str::uuid());
                Log::warning("Using UUID fallback for tracking number: {$trackingNumber}");
                return $trackingNumber;
            }
            
            // Small delay to ensure different microtime
            usleep(1000);
            
        } while (true);
    }

    /**
     * Generate a unique order number
     */
    private function generateUniqueOrderNumber($maxAttempts = 10)
    {
        $attempt = 0;
        
        do {
            $attempt++;
            
            // Include timestamp with seconds for better uniqueness
            $orderNumber = 'ORD-' . date('YmdHis') . '-' . strtoupper(Str::random(4));
            $exists = Order::where('order_number', $orderNumber)->exists();
            
            if (!$exists) {
                return $orderNumber;
            }
            
            if ($attempt >= $maxAttempts) {
                $orderNumber = 'ORD-' . date('YmdHis') . '-' . strtoupper(Str::uuid());
                return $orderNumber;
            }
            
            usleep(1000);
            
        } while (true);
    }

    /**
     * Get user's orders
     */
    public function index(Request $request)
    {
        $query = $request->user()->orders()
            ->with(['address', 'items.product', 'payment', 'delivery'])
            ->orderBy('created_at', 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $perPage = $request->get('per_page', 15);
        $orders = $query->paginate($perPage);

        return response()->json($orders);
    }

    /**
     * Get specific order details
     */
    public function show(Request $request, $id)
    {
        $order = $request->user()->orders()
            ->with(['address', 'items.product', 'payment', 'delivery', 'reviews', 'trackingHistory'])
            ->findOrFail($id);

        return response()->json([
            'order' => $order,
            'tracking_info' => $this->getTrackingInfo($order),
            'timeline' => $order->getTrackingTimeline(),
            'delivery_progress' => $order->getDeliveryProgress()
        ]);
    }

    /**
     * Create new order - FIXED VERSION
     */
    /**
     * Find the cart for whoever is checking out — a logged-in user,
     * or a guest identified by the X-Guest-Id header.
     */
    private function resolveCartForCheckout(Request $request): ?Cart
    {
        if ($request->user()) {
            return $request->user()->cart;
        }

        $guestId = $request->header('X-Guest-Id') ?: $request->input('guest_id');

        if (!$guestId) {
            return null;
        }

        return Cart::where('session_id', $guestId)->whereNull('user_id')->first();
    }

    public function store(Request $request)
    {
        $isGuest = !$request->user();

        $rules = [
            'payment_method' => 'required|in:cod,credit_card,debit_card,digital_wallet,bank_transfer,mpesa,mpesa_till',
            'notes' => 'nullable|string',
            'delivery_slot' => 'nullable|date',
            'promo_code' => 'nullable|exists:promotions,code',
            'shipping_method' => 'required|in:standard,express,overnight',
            'carrier' => 'nullable|string|max:100',
        ];

        if ($isGuest) {
            $rules += [
                'guest_name' => 'required|string|max:150',
                'guest_email' => 'required|email|max:150',
                'guest_phone' => 'required|string|max:30',
                'guest_address_line_1' => 'required|string|max:255',
                'guest_address_line_2' => 'nullable|string|max:255',
                'guest_city' => 'required|string|max:100',
                'guest_state' => 'nullable|string|max:100',
                'guest_country' => 'nullable|string|max:100',
                'guest_postal_code' => 'nullable|string|max:20',
            ];
        } else {
            $rules['address_id'] = 'required|exists:addresses,id';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $cart = $this->resolveCartForCheckout($request);

        if (!$cart || $cart->items()->count() == 0) {
            return response()->json(['message' => 'Cart is empty'], 400);
        }

        // Check stock for all items
        foreach ($cart->items as $item) {
            if ($item->product->stock_quantity < $item->quantity) {
                return response()->json([
                    'message' => "Insufficient stock for {$item->product->name}. Only {$item->product->stock_quantity} available."
                ], 400);
            }
        }

        DB::beginTransaction();

        try {
            // Calculate totals
            $subtotal = $cart->total;
            $shippingFee = $isGuest
                ? $this->calculateShippingFeeForGuest($cart, $request->shipping_method)
                : $this->calculateShippingFee($request->address_id, $request->shipping_method);
            //$tax = $subtotal * 0.1; 10% tax
            $tax = 0;
            
            
            // Apply promotion
            $discount = 0;
            $promoCode = null;
            if ($request->promo_code) {
                $promotion = Promotion::where('code', $request->promo_code)->first();
                if ($promotion && $promotion->isApplicable($subtotal)) {
                    $discount = $promotion->calculateDiscount($subtotal);
                    $promotion->incrementUsage();
                    $promoCode = $request->promo_code;
                }
            }

            $total = $subtotal + $shippingFee + $tax - $discount;

            // Generate unique order and tracking numbers
            $orderNumber = $this->generateUniqueOrderNumber();
            $trackingNumber = $this->generateUniqueTrackingNumber();
            
            Log::info("Generated order number: {$orderNumber}, tracking number: {$trackingNumber}");

            // Create order
            $order = Order::create(array_merge([
                'user_id' => $request->user()->id ?? null,
                'address_id' => $isGuest ? null : $request->address_id,
                'order_number' => $orderNumber,
                'tracking_number' => $trackingNumber,
                'payment_method' => $request->payment_method,
                'payment_status' => in_array($request->payment_method, ['cod', 'mpesa', 'mpesa_till']) ? 'pending' : 'paid',
                'subtotal' => $subtotal,
                'tax' => $tax,
                'shipping_fee' => $shippingFee,
                'discount' => $discount,
                'total' => $total,
                'notes' => $request->notes,
                'delivery_slot' => $request->delivery_slot,
                'shipping_method' => $request->shipping_method,
                'carrier' => $request->carrier,
                'promo_code' => $promoCode
            ], $isGuest ? [
                'session_id' => $request->header('X-Guest-Id') ?: $request->input('guest_id'),
                'guest_name' => $request->guest_name,
                'guest_email' => $request->guest_email,
                'guest_phone' => $request->guest_phone,
                'guest_address_line_1' => $request->guest_address_line_1,
                'guest_address_line_2' => $request->guest_address_line_2,
                'guest_city' => $request->guest_city,
                'guest_state' => $request->guest_state,
                'guest_country' => $request->guest_country ?: 'Kenya',
                'guest_postal_code' => $request->guest_postal_code,
            ] : []));

            // Create order items and update stock
            foreach ($cart->items as $cartItem) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $cartItem->product_id,
                    'quantity' => $cartItem->quantity,
                    'price' => $cartItem->price,
                    'discount' => 0,
                    'total' => $cartItem->quantity * $cartItem->price
                ]);

                // Update product stock
                $cartItem->product->decrement('stock_quantity', $cartItem->quantity);
                
                // Log inventory change
                $cartItem->product->inventoryLogs()->create([
                    'type' => 'sale',
                    'quantity_change' => -$cartItem->quantity,
                    'new_quantity' => $cartItem->product->stock_quantity,
                    'reason' => "Order #{$order->order_number}",
                    'user_id' => $request->user()->id ?? null
                ]);
            }

            // Create delivery record
            if ($isGuest) {
                $deliveryAddressText = implode(', ', array_filter([
                    $request->guest_address_line_1,
                    $request->guest_address_line_2,
                    $request->guest_city,
                    $request->guest_state,
                    $request->guest_country ?: 'Kenya',
                ]));
                $delivery = $order->delivery()->create([
                    'delivery_address' => $deliveryAddressText,
                    'latitude' => null,
                    'longitude' => null,
                    'status' => 'pending',
                    'estimated_delivery_time' => $this->calculateEstimatedDelivery($request->shipping_method)
                ]);
            } else {
                $address = Address::find($request->address_id);
                $delivery = $order->delivery()->create([
                    'delivery_address' => $address->full_address,
                    'latitude' => $address->latitude,
                    'longitude' => $address->longitude,
                    'status' => 'pending',
                    'estimated_delivery_time' => $this->calculateEstimatedDelivery($request->shipping_method)
                ]);
            }

            // Create tracking code with additional safety check
            try {
                // Double-check uniqueness before inserting
                $exists = TrackingCode::where('tracking_number', $trackingNumber)->exists();
                
                if ($exists) {
                    // Generate a new tracking number
                    $trackingNumber = $this->generateUniqueTrackingNumber();
                    
                    // Update the order with new tracking number
                    $order->update(['tracking_number' => $trackingNumber]);
                    
                    Log::warning("Had to regenerate tracking number. New: {$trackingNumber}");
                }
                
                TrackingCode::create([
                    'order_id' => $order->id,
                    'tracking_number' => $trackingNumber,
                    'carrier' => $request->carrier ?? 'Standard Carrier',
                    'shipping_method' => $request->shipping_method,
                    'status' => 'pending',
                    'estimated_delivery' => $delivery->estimated_delivery_time
                ]);
                
                Log::info("Successfully created tracking code for order #{$order->id}");
                
            } catch (\Exception $e) {
                // If still duplicate, use a completely different approach
                Log::error("Failed to create tracking code: " . $e->getMessage());
                
                // Generate emergency tracking number using UUID
                $emergencyTrackingNumber = 'TRK-EMG-' . date('YmdHis') . '-' . strtoupper(Str::uuid());
                
                // Update the order
                $order->update(['tracking_number' => $emergencyTrackingNumber]);
                
                // Create tracking code
                TrackingCode::create([
                    'order_id' => $order->id,
                    'tracking_number' => $emergencyTrackingNumber,
                    'carrier' => $request->carrier ?? 'Standard Carrier',
                    'shipping_method' => $request->shipping_method,
                    'status' => 'pending',
                    'estimated_delivery' => $delivery->estimated_delivery_time
                ]);
                
                $trackingNumber = $emergencyTrackingNumber;
                Log::warning("Used emergency tracking number: {$emergencyTrackingNumber}");
            }

            // Clear cart
            $cart->items()->delete();
            $cart->update(['total' => 0]);

            // Add loyalty points (1 point per $10 spent) — accounts only
            if ($request->user()) {
                $loyaltyPoints = floor($total / 10);
                $request->user()->increment('loyalty_points', $loyaltyPoints);
            }

            // Add tracking event
            $order->addTrackingEvent('order_created', [
                'title' => 'Order Placed',
                'description' => 'Your order has been successfully placed.',
                'icon' => '📝',
                'location' => 'Online Store'
            ]);

            // Send notification (logged-in users only — guests get their
            // order/tracking number back in the response instead)
            if ($request->user()) {
                $request->user()->notifications()->create([
                    'type' => 'order_placed',
                    'title' => 'Order Placed Successfully',
                    'message' => "Your order #{$order->order_number} has been placed successfully. Tracking #: {$trackingNumber}",
                    'data' => [
                        'order_id' => $order->id,
                        'order_number' => $order->order_number,
                        'tracking_number' => $trackingNumber
                    ]
                ]);
            }

            DB::commit();

            Log::info("Order #{$order->id} created successfully with tracking #{$trackingNumber}");

            return response()->json([
                'message' => 'Order placed successfully',
                'order' => $order->load(['address', 'items.product', 'delivery', 'trackingCode']),
                'tracking_number' => $trackingNumber
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Order creation failed: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'Order failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel order
     */
    public function cancel(Request $request, $id)
    {
        $order = $request->user()->orders()->findOrFail($id);

        if (!in_array($order->status, ['pending', 'confirmed'])) {
            return response()->json([
                'message' => 'Order cannot be cancelled at this stage'
            ], 400);
        }

        DB::beginTransaction();

        try {
            $order->update(['status' => 'cancelled']);

            // Add tracking event
            $order->addTrackingEvent('cancelled', [
                'title' => 'Order Cancelled',
                'description' => 'Your order has been cancelled.',
                'icon' => '❌',
                'location' => 'Order System'
            ]);

            // Restock items
            foreach ($order->items as $item) {
                $item->product->increment('stock_quantity', $item->quantity);
                
                $item->product->inventoryLogs()->create([
                    'type' => 'return',
                    'quantity_change' => $item->quantity,
                    'new_quantity' => $item->product->stock_quantity,
                    'reason' => "Order #{$order->order_number} cancelled",
                    'user_id' => $request->user()->id
                ]);
            }

            // Update delivery status
            if ($order->delivery) {
                $order->delivery->update(['status' => 'cancelled']);
            }

            // Update tracking code
            if ($order->trackingCode) {
                $order->trackingCode->update(['status' => 'cancelled']);
            }

            // Send notification
            $request->user()->notifications()->create([
                'type' => 'order_cancelled',
                'title' => 'Order Cancelled',
                'message' => "Your order #{$order->order_number} has been cancelled.",
                'data' => ['order_id' => $order->id]
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Order cancelled successfully',
                'order' => $order->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Order cancellation failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to cancel order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Track order by order number or tracking number
     */
    public function track(Request $request, $identifier)
    {
        $validator = Validator::make(['identifier' => $identifier], [
            'identifier' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $order = $request->user()->orders()
                ->where('order_number', $identifier)
                ->orWhere('tracking_number', $identifier)
                ->with([
                    'address',
                    'items.product',
                    'delivery.deliveryStaff',
                    'trackingHistory',
                    'trackingCode'
                ])
                ->firstOrFail();

            $trackingInfo = $this->getTrackingInfo($order);
            $timeline = $order->getTrackingTimeline();
            $deliveryProgress = $order->getDeliveryProgress();

            // Check if live tracking is available
            $liveTracking = null;
            if ($order->delivery && in_array($order->delivery->status, ['out_for_delivery', 'in_transit'])) {
                $liveTracking = $this->getLiveTrackingData($order->delivery);
            }

            return response()->json([
                'success' => true,
                'order' => $order,
                'tracking' => array_merge($trackingInfo, [
                    'timeline' => $timeline,
                    'delivery_progress' => $deliveryProgress,
                    'live_tracking' => $liveTracking
                ]),
                'delivery_contact' => $this->getDeliveryContactInfo($order),
                'estimated_dates' => $this->getEstimatedDates($order)
            ]);

        } catch (\Exception $e) {
            \Log::error('Order tracking failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Order not found. Please check your order or tracking number.'
            ], 404);
        }
    }

    /**
     * Public order tracking (for guests)
     */
    public function trackPublic(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tracking_number' => 'required_without:order_number|string',
            'order_number' => 'required_without:tracking_number|string',
            'email' => 'required|email'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $query = Order::query();

            if ($request->tracking_number) {
                $query->where('tracking_number', $request->tracking_number);
            } elseif ($request->order_number) {
                $query->where('order_number', $request->order_number);
            }

            $order = $query->with([
                'address',
                'items.product',
                'delivery',
                'trackingHistory',
                'trackingCode'
            ])->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }

            // Verify email matches order (check user email)
            if ($order->user->email !== $request->email) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email does not match order records'
                ], 403);
            }

            // Get tracking info
            $trackingInfo = $this->getTrackingInfo($order);
            $timeline = $this->getTrackingTimelineForPublic($order);
            
            // Format address for delivery details
            $deliveryAddress = null;
            if ($order->address) {
                $deliveryAddress = $this->formatAddress($order->address);
            }

            return response()->json([
                'success' => true,
                'message' => 'Order found successfully',
                'data' => [
                    'order_summary' => [
                        'order_number' => $order->order_number,
                        'tracking_number' => $order->tracking_number,
                        'status' => $order->status,
                        'status_formatted' => $this->formatStatus($order->status),
                        'created_at' => $order->created_at->toDateTimeString(),
                        'total' => number_format($order->total, 2),
                        'currency' => 'USD'
                    ],
                    'tracking_info' => [
                        'current_status' => $order->status,
                        'status_description' => $this->getStatusDescriptionForPublic($order->status),
                        'timeline' => $timeline,
                        'last_updated' => $order->updated_at->format('M d, Y H:i'),
                        'estimated_delivery' => $order->estimated_delivery ? 
                            $order->estimated_delivery->format('M d, Y') : null,
                        'carrier' => $order->carrier,
                        'shipping_method' => $order->shipping_method ?? 'Standard Shipping'
                    ],
                    'items' => $order->items->map(function($item) {
                        return [
                            'name' => $item->product->name,
                            'quantity' => $item->quantity,
                            'price' => '$' . number_format($item->price * $item->quantity, 2)
                        ];
                    }),
                    'delivery_details' => $deliveryAddress ? [
                        'delivery_address' => $deliveryAddress,
                        'estimated_delivery_time' => $order->estimated_delivery ? 
                            $order->estimated_delivery->toDateTimeString() : null,
                        'driver' => $order->delivery && $order->delivery->deliveryStaff ? [
                            'name' => $order->delivery->deliveryStaff->name,
                            'phone' => $order->delivery->deliveryStaff->phone
                        ] : null
                    ] : null
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Public order tracking failed: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to track order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get tracking timeline for public display
     */
    private function getTrackingTimelineForPublic($order)
    {
        $timeline = [];
        
        // Define all possible statuses in order
        $statuses = [
            'pending' => [
                'title' => 'Order Placed',
                'description' => 'Your order has been received',
                'icon' => 'pending'
            ],
            'confirmed' => [
                'title' => 'Order Confirmed',
                'description' => 'We\'ve confirmed your order',
                'icon' => 'confirmed'
            ],
            'processing' => [
                'title' => 'Processing',
                'description' => 'We\'re preparing your order',
                'icon' => 'processing'
            ],
            'shipped' => [
                'title' => 'Shipped',
                'description' => 'Your order is on its way',
                'icon' => 'shipped'
            ],
            'out_for_delivery' => [
                'title' => 'Out for Delivery',
                'description' => 'Your order is out for delivery',
                'icon' => 'out_for_delivery'
            ],
            'delivered' => [
                'title' => 'Delivered',
                'description' => 'Your order has been delivered',
                'icon' => 'delivered'
            ]
        ];

        // Get actual timestamps from order
        $timestamps = [
            'pending' => $order->created_at,
            'confirmed' => $order->confirmed_at,
            'processing' => $order->processing_at,
            'shipped' => $order->shipped_at,
            'out_for_delivery' => $order->out_for_delivery_at,
            'delivered' => $order->delivered_at
        ];

        foreach ($statuses as $status => $details) {
            $completed = false;
            $current = false;
            
            // Determine if this step is completed
            if ($timestamps[$status]) {
                $completed = true;
            }
            
            // Determine if this is the current step
            if ($order->status === $status) {
                $current = true;
            } elseif ($status === 'delivered' && $order->status === 'delivered') {
                $current = true;
            }
            
            // For shipped items that are delivered, mark all previous as completed
            if ($status === 'delivered' && $order->status === 'delivered') {
                $completed = true;
            }

            $timeline[] = [
                'status' => $status,
                'title' => $details['title'],
                'description' => $details['description'],
                'icon' => $details['icon'],
                'completed' => $completed,
                'current' => $current,
                'date' => $timestamps[$status] ? $timestamps[$status]->format('M d, Y H:i') : null
            ];
        }

        return $timeline;
    }

    /**
     * Format address for display
     */
    private function formatAddress($address)
    {
        $parts = [];
        
        if ($address->contact_name) {
            $parts[] = $address->contact_name;
        }
        
        if ($address->address_line_1) {
            $parts[] = $address->address_line_1;
        }
        
        if ($address->address_line_2) {
            $parts[] = $address->address_line_2;
        }
        
        if ($address->city) {
            $parts[] = $address->city;
        }
        
        if ($address->state) {
            $parts[] = $address->state;
        }
        
        if ($address->postal_code) {
            $parts[] = $address->postal_code;
        }
        
        if ($address->country) {
            $parts[] = $address->country;
        }

        return implode(', ', $parts);
    }

    /**
     * Format status for display
     */
    private function formatStatus($status)
    {
        $statusMap = [
            'pending' => 'Pending',
            'confirmed' => 'Confirmed',
            'processing' => 'Processing',
            'shipped' => 'Shipped',
            'out_for_delivery' => 'Out for Delivery',
            'delivered' => 'Delivered',
            'cancelled' => 'Cancelled',
            'returned' => 'Returned',
            'refunded' => 'Refunded'
        ];

        return $statusMap[$status] ?? ucfirst($status);
    }

    /**
     * Get status description for public display
     */
    private function getStatusDescriptionForPublic($status)
    {
        $descriptions = [
            'pending' => 'Your order has been placed and is awaiting confirmation.',
            'confirmed' => 'Your order has been confirmed and will be processed soon.',
            'processing' => 'Your order is being prepared for shipment.',
            'shipped' => 'Your order has been shipped and is on its way to you.',
            'out_for_delivery' => 'Your order is out for delivery today.',
            'delivered' => 'Your order has been delivered successfully.',
            'cancelled' => 'Your order has been cancelled.',
            'returned' => 'Your order has been returned.',
            'refunded' => 'Your order has been refunded.'
        ];

        return $descriptions[$status] ?? 'Your order status is being updated.';
    }

    /**
     * Get live tracking data
     */
    public function getLiveTracking(Request $request, $orderId)
    {
        try {
            $order = $request->user()->orders()
                ->with(['delivery.tracking', 'delivery.deliveryStaff'])
                ->findOrFail($orderId);

            if (!$order->delivery) {
                return response()->json([
                    'success' => false,
                    'message' => 'Delivery information not available'
                ], 404);
            }

            $delivery = $order->delivery;

            if (!in_array($delivery->status, ['out_for_delivery', 'in_transit'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Live tracking is only available when order is out for delivery'
                ], 400);
            }

            $trackingPoints = $delivery->tracking()
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get();

            $eta = $this->calculateETA($delivery);
            $mapData = $this->generateMapData($delivery, $trackingPoints);

            // FIXED: Replace ?-> with traditional null checks for PHP < 8.0
            $updatedAtFormatted = $delivery->location_updated_at ? 
                $delivery->location_updated_at->format('h:i A') : null;
            
            $timeAgo = $delivery->location_updated_at ? 
                $delivery->location_updated_at->diffForHumans() : null;
            
            $expiresAtFormatted = $delivery->otp_generated_at ? 
                $delivery->otp_generated_at->addMinutes(15)->format('h:i A') : null;

            return response()->json([
                'success' => true,
                'data' => [
                    'is_active' => true,
                    'current_location' => [
                        'latitude' => $delivery->current_latitude,
                        'longitude' => $delivery->current_longitude,
                        'address' => $this->reverseGeocode($delivery->current_latitude, $delivery->current_longitude),
                        'updated_at' => $updatedAtFormatted,  // FIXED
                        'time_ago' => $timeAgo  // FIXED
                    ],
                    'driver_info' => $delivery->deliveryStaff ? [
                        'name' => $delivery->deliveryStaff->name,
                        'phone' => $delivery->deliveryStaff->phone,
                        'photo' => $delivery->deliveryStaff->profile_photo ? 
                            url('storage/' . $delivery->deliveryStaff->profile_photo) : null,
                        'vehicle' => [
                            'type' => $delivery->vehicle_type,
                            'number' => $delivery->vehicle_number
                        ],
                        'rating' => $delivery->deliveryStaff->delivery_rating ?? 4.5
                    ] : null,
                    'delivery_progress' => $order->getDeliveryProgress(),
                    'eta' => $eta,
                    'tracking_points' => $trackingPoints->map(function($point) {
                        return [
                            'latitude' => $point->latitude,
                            'longitude' => $point->longitude,
                            'timestamp' => $point->created_at->format('h:i A'),
                            'speed' => $point->speed,
                            'heading' => $point->heading
                        ];
                    }),
                    'map_data' => $mapData,
                    'delivery_attempt' => $delivery->delivery_attempt,
                    'delivery_otp' => $delivery->delivery_otp ? [
                        'code' => substr($delivery->delivery_otp, 0, 2) . '****',
                        'expires_at' => $expiresAtFormatted  // FIXED
                    ] : null
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Live tracking failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve live tracking data'
            ], 500);
        }
    }

    /**
     * Verify delivery OTP
     */
    public function verifyDeliveryOTP(Request $request, $orderId)
    {
        $validator = Validator::make($request->all(), [
            'otp' => 'required|string|size:6',
            'recipient_name' => 'required|string|max:255',
            'signature' => 'nullable|string',
            'delivery_proof' => 'nullable|image|max:2048'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            $order = $request->user()->orders()
                ->with(['delivery'])
                ->findOrFail($orderId);

            if (!$order->delivery) {
                return response()->json([
                    'success' => false,
                    'message' => 'Delivery not found'
                ], 404);
            }

            $delivery = $order->delivery;

            // Verify OTP
            if ($delivery->delivery_otp !== $request->otp) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid OTP'
                ], 400);
            }

            if ($delivery->otp_generated_at && $delivery->otp_generated_at->addMinutes(15)->isPast()) {
                return response()->json([
                    'success' => false,
                    'message' => 'OTP has expired'
                ], 400);
            }

            // Handle delivery proof upload
            $deliveryProofPath = null;
            if ($request->hasFile('delivery_proof')) {
                $file = $request->file('delivery_proof');
                $filename = 'delivery-proof-' . $order->id . '-' . time() . '.' . $file->getClientOriginalExtension();
                $deliveryProofPath = $file->storeAs('delivery-proofs', $filename, 'public');
            }

            // Update delivery
            $delivery->status = 'delivered';
            $delivery->actual_delivery_time = now();
            $delivery->recipient_name = $request->recipient_name;
            
            if ($request->signature) {
                $delivery->recipient_signature = $request->signature;
            }
            
            if ($deliveryProofPath) {
                $delivery->delivery_proof_image = $deliveryProofPath;
            }
            
            $delivery->save();

            // Update order
            $order->status = 'delivered';
            $order->actual_delivery = now();
            $order->save();

            // Update tracking code
            if ($order->trackingCode) {
                $order->trackingCode->update([
                    'status' => 'delivered',
                    'estimated_delivery' => now()
                ]);
            }

            // Add tracking event
            $order->addTrackingEvent('delivered', [
                'title' => 'Order Delivered',
                'description' => 'Order delivered successfully and verified with OTP',
                'icon' => '🎉',
                'location' => $order->address->full_address ?? 'Delivery Address',
                'metadata' => [
                    'recipient_name' => $request->recipient_name,
                    'verified_by_otp' => true,
                    'delivery_proof' => $deliveryProofPath,
                    'signature_provided' => !empty($request->signature)
                ]
            ]);

            // Award loyalty points
            $loyaltyPoints = floor($order->total / 10);
            $order->user->increment('loyalty_points', $loyaltyPoints);

            // Send notification
            $order->user->notifications()->create([
                'type' => 'order_delivered',
                'title' => 'Order Delivered Successfully',
                'message' => "Your order #{$order->order_number} has been delivered and verified.",
                'data' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'delivery_time' => now()->toISOString(),
                    'loyalty_points_earned' => $loyaltyPoints
                ]
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Delivery verified successfully',
                'data' => [
                    'order' => $order->fresh(['delivery']),
                    'loyalty_points_earned' => $loyaltyPoints
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('OTP verification failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to verify delivery'
            ], 500);
        }
    }

    /**
     * Generate delivery QR code
     */
    public function generateDeliveryQR(Request $request, $orderId)
    {
        try {
            $order = $request->user()->orders()
                ->with(['delivery'])
                ->findOrFail($orderId);

            if (!$order->delivery) {
                return response()->json([
                    'success' => false,
                    'message' => 'Delivery not found'
                ], 404);
            }

            // Generate OTP
            $otp = $order->delivery->generateOTP();

            // QR code data
            $qrData = [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'tracking_number' => $order->tracking_number,
                'delivery_otp' => $otp,
                'timestamp' => now()->toISOString(),
                'customer_name' => $order->user->name
            ];

            // Generate QR code (in production, use a QR code library)
            $qrCode = $this->generateQRCodeImage($qrData);

            return response()->json([
                'success' => true,
                'data' => [
                    'qr_code' => $qrCode,
                    'qr_data' => $qrData,
                    'otp' => $otp,
                    'expires_at' => $order->delivery->otp_generated_at ? $order->delivery->otp_generated_at->addMinutes(15)->toISOString() : null,
                    'expires_in_minutes' => 15
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('QR code generation failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate QR code'
            ], 500);
        }
    }

    /**
     * Calculate shipping fee
     */
    /**
     * Shipping fee for a guest checkout — no saved Address record to
     * look up, so no distance-based fee, just the flat rate by method.
     * (All methods are currently free — see calculateShippingFee below.)
     */
    private function calculateShippingFeeForGuest(Cart $cart, $shippingMethod)
    {
        $baseFee = 0; // standard/express/overnight are all free right now

        if ($cart->total > 50 && $shippingMethod === 'standard') {
            return 0;
        }

        return $baseFee;
    }

    private function calculateShippingFee($addressId, $shippingMethod)
    {
        $address = Address::find($addressId);
        
        // Base shipping fee
        $baseFee = 0;
        
        switch ($shippingMethod) {
            case 'standard':
                $baseFee = 0;
                break;
            case 'express':
                $baseFee = 0;
                break;
            case 'overnight':
                $baseFee = 0;
                break;
            // case 'standard':
            //     $baseFee = 5.99;
            //     break;
            // case 'express':
            //     $baseFee = 12.99;
            //     break;
            // case 'overnight':
            //     $baseFee = 24.99;
            //     break;
        }

        // Add distance-based fee (example logic)
        $warehouseLat = config('app.warehouse_latitude', 40.7128);
        $warehouseLng = config('app.warehouse_longitude', -74.0060);
        
        if ($address->latitude && $address->longitude) {
            $distance = $this->calculateHaversineDistance(
                $warehouseLat,
                $warehouseLng,
                $address->latitude,
                $address->longitude
            );
            
            // Add $0.50 per 10km
            $distanceFee = ceil($distance / 10) * 0.50;
            $baseFee += $distanceFee;
        }

        // Free shipping for orders over $50
        $cartTotal = auth()->user()->cart->total;
        if ($cartTotal > 50 && $shippingMethod === 'standard') {
            return 0;
        }

        return $baseFee;
    }

    /**
     * Calculate estimated delivery date
     */
    private function calculateEstimatedDelivery($shippingMethod)
    {
        $days = 3; // Standard shipping
        
        switch ($shippingMethod) {
            case 'express':
                $days = 2;
                break;
            case 'overnight':
                $days = 1;
                break;
        }

        return now()->addDays($days);
    }

    /**
     * Get tracking information
     */
    private function getTrackingInfo($order)
    {
        // FIXED: Replace ?-> with traditional null checks
        $estimatedDeliveryFormatted = $order->estimated_delivery ? 
            $order->estimated_delivery->format('M d, Y') : null;
        
        $actualDeliveryFormatted = $order->actual_delivery ? 
            $order->actual_delivery->format('M d, Y h:i A') : null;

        return [
            'tracking_number' => $order->tracking_number,
            'order_number' => $order->order_number,
            'current_status' => $order->status,
            'status_description' => $this->getStatusDescription($order->status),
            'last_updated' => $order->updated_at->format('M d, Y h:i A'),
            'estimated_delivery' => $estimatedDeliveryFormatted,
            'actual_delivery' => $actualDeliveryFormatted,
            'carrier' => $order->carrier,
            'carrier_tracking_url' => $order->carrier_tracking_url,
            'shipping_method' => $order->shipping_method,
            'history' => $order->trackingHistory->map(function($event) {
                // FIXED: Replace ?-> with traditional null checks
                $dateFormatted = $event->actual_date ? 
                    $event->actual_date->format('M d, Y') : null;
                
                $timeFormatted = $event->actual_date ? 
                    $event->actual_date->format('h:i A') : null;

                return [
                    'status' => $event->status,
                    'title' => $event->title,
                    'description' => $event->description,
                    'location' => $event->location,
                    'icon' => $event->icon,
                    'date' => $dateFormatted,
                    'time' => $timeFormatted,
                    'user' => $event->user ? $event->user->name : 'System'
                ];
            })
        ];
    }

    /**
     * Get live tracking data for delivery
     */
    private function getLiveTrackingData($delivery)
    {
        $trackingPoints = $delivery->tracking()
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        // FIXED: Replace ?-> with traditional null checks
        $lastUpdatedFormatted = $delivery->location_updated_at ? 
            $delivery->location_updated_at->toISOString() : null;

        return [
            'is_active' => in_array($delivery->status, ['out_for_delivery', 'in_transit']),
            'current_location' => [
                'latitude' => $delivery->current_latitude,
                'longitude' => $delivery->current_longitude,
                'accuracy' => $trackingPoints->first() ? ($trackingPoints->first()->accuracy ?? null) : null,
                'speed' => $trackingPoints->first() ? ($trackingPoints->first()->speed ?? null) : null,
                'heading' => $trackingPoints->first() ? ($trackingPoints->first()->heading ?? null) : null
            ],
            'tracking_history' => $trackingPoints->map(function($point) {
                return [
                    'latitude' => $point->latitude,
                    'longitude' => $point->longitude,
                    'timestamp' => $point->created_at->toISOString(),
                    'speed' => $point->speed,
                    'heading' => $point->heading,
                    'battery_level' => $point->battery_level
                ];
            }),
            'last_updated' => $lastUpdatedFormatted
        ];
    }

    /**
     * Generate map data
     */
    private function generateMapData($delivery, $trackingPoints)
    {
        $points = $trackingPoints->map(function($point) {
            return [
                'lat' => $point->latitude,
                'lng' => $point->longitude,
                'timestamp' => $point->created_at->format('H:i'),
                'speed' => $point->speed
            ];
        })->toArray();

        // Add current location if not in points
        if ($delivery->current_latitude && $delivery->current_longitude) {
            $points[] = [
                'lat' => $delivery->current_latitude,
                'lng' => $delivery->current_longitude,
                'timestamp' => 'Current',
                'speed' => $trackingPoints->last() ? ($trackingPoints->last()->speed ?? null) : null
            ];
        }

        return [
            'points' => $points,
            'origin' => [
                'lat' => config('app.warehouse_latitude', 40.7128),
                'lng' => config('app.warehouse_longitude', -74.0060),
                'name' => 'Warehouse'
            ],
            'destination' => [
                'lat' => $delivery->latitude,
                'lng' => $delivery->longitude,
                'name' => 'Delivery Address',
                'address' => $delivery->delivery_address
            ],
            'center' => $this->calculateCenter($points)
        ];
    }

    /**
     * Calculate center point
     */
    private function calculateCenter($points)
    {
        if (empty($points)) {
            return null;
        }

        $lats = array_column($points, 'lat');
        $lngs = array_column($points, 'lng');

        return [
            'lat' => (max($lats) + min($lats)) / 2,
            'lng' => (max($lngs) + min($lngs)) / 2
        ];
    }

    /**
     * Calculate ETA
     */
    private function calculateETA($delivery)
    {
        if (!$delivery->current_latitude || !$delivery->current_longitude) {
            return null;
        }

        // Calculate distance between current location and destination
        $distance = $this->calculateHaversineDistance(
            $delivery->current_latitude,
            $delivery->current_longitude,
            $delivery->latitude,
            $delivery->longitude
        );

        // Average speed in km/h
        $averageSpeed = $delivery->vehicle_type === 'bike' ? 20 : 40;
        
        // Calculate time in hours
        $timeHours = $distance / $averageSpeed;
        $timeMinutes = $timeHours * 60;

        $eta = now()->addMinutes($timeMinutes);

        return [
            'time' => $eta->format('h:i A'),
            'minutes' => round($timeMinutes),
            'distance' => round($distance, 1) . ' km',
            'arrival_window' => [
                'from' => $eta->copy()->subMinutes(15)->format('h:i A'),
                'to' => $eta->copy()->addMinutes(15)->format('h:i A')
            ]
        ];
    }

    /**
     * Calculate haversine distance
     */
    private function calculateHaversineDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371; // Earth's radius in kilometers

        $lat1 = deg2rad($lat1);
        $lon1 = deg2rad($lon1);
        $lat2 = deg2rad($lat2);
        $lon2 = deg2rad($lon2);

        $latDelta = $lat2 - $lat1;
        $lonDelta = $lon2 - $lon1;

        $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
            cos($lat1) * cos($lat2) * pow(sin($lonDelta / 2), 2)));

        return $angle * $earthRadius;
    }

    /**
     * Reverse geocode coordinates
     */
    private function reverseGeocode($latitude, $longitude)
    {
        try {
            $apiKey = env('GOOGLE_MAPS_API_KEY');
            
            if (!$apiKey) {
                return "Location: {$latitude}, {$longitude}";
            }

            $response = Http::get('https://maps.googleapis.com/maps/api/geocode/json', [
                'latlng' => "{$latitude},{$longitude}",
                'key' => $apiKey,
                'language' => 'en'
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                if ($data['status'] === 'OK' && !empty($data['results'])) {
                    return $data['results'][0]['formatted_address'];
                }
            }

            return "Location: {$latitude}, {$longitude}";

        } catch (\Exception $e) {
            \Log::error('Reverse geocoding failed: ' . $e->getMessage());
            return "Location: {$latitude}, {$longitude}";
        }
    }

    /**
     * Generate QR code image
     */
    private function generateQRCodeImage($data)
    {
        // In production, use a QR code library
        // For this example, return null
        return null;
    }

    /**
     * Get delivery contact info
     */
    private function getDeliveryContactInfo($order)
    {
        $delivery = $order->delivery;
        
        if (!$delivery) {
            return null;
        }

        return [
            'driver' => $delivery->deliveryStaff ? [
                'name' => $delivery->deliveryStaff->name,
                'phone' => $delivery->deliveryStaff->phone,
                'photo' => $delivery->deliveryStaff->profile_photo ? 
                    url('storage/' . $delivery->deliveryStaff->profile_photo) : null
            ] : null,
            'vehicle' => [
                'type' => $delivery->vehicle_type,
                'number' => $delivery->vehicle_number
            ],
            'customer_service' => [
                'phone' => config('app.customer_support_phone', '+1-800-123-4567'),
                'email' => config('app.customer_support_email', 'support@example.com'),
                'hours' => 'Mon-Fri 9AM-6PM EST'
            ]
        ];
    }

    /**
     * Get estimated dates
     */
    private function getEstimatedDates($order)
    {
        // FIXED: Replace ?-> with traditional null checks
        $estimatedDeliveryFormatted = $order->estimated_delivery ? 
            $order->estimated_delivery->format('M d, Y h:i A') : 
            $order->created_at->addDays(3)->format('M d, Y h:i A');

        return [
            'order_placed' => $order->created_at->format('M d, Y h:i A'),
            'estimated_processing' => $order->created_at->addHours(2)->format('M d, Y h:i A'),
            'estimated_shipping' => $order->created_at->addHours(4)->format('M d, Y h:i A'),
            'estimated_delivery' => $estimatedDeliveryFormatted
        ];
    }

    /**
     * Get status description
     */
    private function getStatusDescription($status)
    {
        $descriptions = [
            'pending' => 'Your order has been placed and is awaiting confirmation.',
            'confirmed' => 'Your order has been confirmed and is being processed.',
            'processing' => 'We are preparing your order for shipment.',
            'shipped' => 'Your order has been shipped and is on its way.',
            'out_for_delivery' => 'Your order is out for delivery today.',
            'delivered' => 'Your order has been delivered successfully.',
            'cancelled' => 'Your order has been cancelled.',
            'returned' => 'Your order has been returned.',
            'refunded' => 'Your order has been refunded.'
        ];

        return $descriptions[$status] ?? 'Order status information';
    }

    /**
     * Admin: List all orders
     */
    public function adminIndex(Request $request)
    {
        $this->authorize('viewAny', Order::class);

        $query = Order::with(['user', 'address', 'items.product', 'payment', 'delivery'])
            ->orderBy('created_at', 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('tracking_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $perPage = $request->get('per_page', 20);
        $orders = $query->paginate($perPage);

        return response()->json($orders);
    }

    /**
     * Admin: Update order
     */
    public function adminUpdate(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $this->authorize('update', $order);

        $validator = Validator::make($request->all(), [
            'status' => 'sometimes|in:pending,confirmed,processing,shipped,out_for_delivery,delivered,cancelled,returned,refunded',
            'payment_status' => 'sometimes|in:pending,paid,failed,refunded',
            'shipped_at' => 'nullable|date',
            'estimated_delivery' => 'nullable|date',
            'actual_delivery' => 'nullable|date',
            'carrier' => 'nullable|string|max:100',
            'carrier_tracking_url' => 'nullable|url|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();

        try {
            $oldStatus = $order->status;
            
            // Update order
            $order->fill($request->only([
                'status', 'payment_status', 'shipped_at', 
                'estimated_delivery', 'actual_delivery',
                'carrier', 'carrier_tracking_url'
            ]));
            $order->save();

            // Add tracking event if status changed
            if ($request->has('status') && $oldStatus !== $request->status) {
                $order->addTrackingEvent($request->status, [
                    'title' => 'Status Updated by Admin',
                    'description' => "Order status changed from {$oldStatus} to {$request->status}",
                    'icon' => '⚙️',
                    'location' => 'Admin Panel',
                    'metadata' => [
                        'updated_by' => $request->user()->name,
                        'reason' => $request->reason ?? 'Manual update'
                    ]
                ]);
            }

            // Update delivery if order is shipped
            if ($request->has('shipped_at') && $order->delivery) {
                $order->delivery->update([
                    'status' => 'shipped',
                    'estimated_delivery_time' => $request->estimated_delivery ?? $order->delivery->estimated_delivery_time
                ]);
            }

            // Update tracking code
            if ($order->trackingCode) {
                $trackingCodeData = [];
                
                if ($request->has('carrier')) {
                    $trackingCodeData['carrier'] = $request->carrier;
                }
                
                if ($request->has('shipped_at')) {
                    $trackingCodeData['shipped_at'] = $request->shipped_at;
                    $trackingCodeData['status'] = 'shipped';
                }
                
                if ($request->has('status') && $request->status === 'delivered') {
                    $trackingCodeData['status'] = 'delivered';
                }
                
                if (!empty($trackingCodeData)) {
                    $order->trackingCode->update($trackingCodeData);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Order updated successfully',
                'order' => $order->fresh()->load(['user', 'address', 'items.product', 'payment', 'delivery', 'trackingCode'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Admin order update failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update order: ' . $e->getMessage()
            ], 500);
        }
    }
}