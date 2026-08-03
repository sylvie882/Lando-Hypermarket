<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'order_number', 'tracking_number', 'address_id',
        'payment_method', 'payment_status', 'subtotal', 'tax',
        'shipping_fee', 'discount', 'total', 'status', 'notes',
        'delivery_slot', 'shipped_at', 'estimated_delivery',
        'actual_delivery', 'carrier', 'carrier_tracking_url',
        'tracking_data', 'shipping_method',
        // FIX: added missing status-timestamp columns used in trackPublic timeline
        'confirmed_at', 'processing_at', 'out_for_delivery_at', 'delivered_at',
        // FIX: promo_code was being set on create but was missing from $fillable
        'promo_code',
        // NEW: guest checkout support
        'session_id', 'guest_name', 'guest_email', 'guest_phone',
        'guest_address_line_1', 'guest_address_line_2', 'guest_city',
        'guest_state', 'guest_country', 'guest_postal_code',
    ];

    protected $casts = [
        'tracking_data' => 'array',
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'shipping_fee' => 'decimal:2',
        'discount' => 'decimal:2',
        'total' => 'decimal:2',
        'shipped_at' => 'datetime',
        'estimated_delivery' => 'datetime',
        'actual_delivery' => 'datetime',
        'delivery_slot' => 'datetime',
        // FIX: cast the new timestamp columns
        'confirmed_at' => 'datetime',
        'processing_at' => 'datetime',
        'out_for_delivery_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    protected static function booted()
    {
        static::creating(function ($order) {
            if (empty($order->order_number)) {
                $order->order_number = 'ORD-' . date('Ymd') . '-' . strtoupper(Str::random(6));
            }
            if (empty($order->tracking_number)) {
                $order->tracking_number = 'TRK-' . date('Ymd') . '-' . strtoupper(Str::random(8));
            }
        });

        static::created(function ($order) {
            $order->addTrackingEvent('order_created', [
                'title' => 'Order Placed',
                'description' => 'Your order has been successfully placed.',
                'icon' => '📝',
                'location' => 'Online Store'
            ]);

            TrackingCode::create([
                'order_id' => $order->id,
                'tracking_number' => $order->tracking_number,
                'shipping_method' => 'Standard Shipping',
                'status' => 'pending'
            ]);
        });

        static::updated(function ($order) {
            if ($order->isDirty('status')) {
                $oldStatus = $order->getOriginal('status');
                $newStatus = $order->status;

                $statusConfig = $order->getStatusConfig($newStatus);

                $order->addTrackingEvent($newStatus, [
                    'title' => $statusConfig['title'],
                    'description' => "Order status changed from {$oldStatus} to {$newStatus}",
                    'icon' => $statusConfig['icon'],
                    'location' => $order->getTrackingLocation($newStatus)
                ]);

                // FIX: auto-stamp status timestamps when status changes
                $now = now();
                $stamps = [
                    'confirmed'        => 'confirmed_at',
                    'processing'       => 'processing_at',
                    'shipped'          => 'shipped_at',
                    'out_for_delivery' => 'out_for_delivery_at',
                    'delivered'        => 'delivered_at',
                ];
                if (isset($stamps[$newStatus]) && empty($order->{$stamps[$newStatus]})) {
                    $order->timestamps = false;
                    $order->updateQuietly([$stamps[$newStatus] => $now]);
                    $order->timestamps = true;
                }
            }

            if ($order->isDirty('shipped_at') && $order->shipped_at) {
                $order->addTrackingEvent('shipped', [
                    'title' => 'Order Shipped',
                    'description' => 'Your order has been shipped and is on its way.',
                    'icon' => '🚚',
                    'location' => 'Shipping Facility'
                ]);
            }

            if ($order->isDirty('actual_delivery') && $order->actual_delivery) {
                $order->addTrackingEvent('delivered', [
                    'title' => 'Order Delivered',
                    'description' => 'Your order has been delivered successfully.',
                    'icon' => '🎉',
                    'location' => $order->address->full_address ?? 'Delivery Address'
                ]);
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function address()
    {
        return $this->belongsTo(Address::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function delivery()
    {
        return $this->hasOne(Delivery::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function trackingHistory()
    {
        return $this->hasMany(OrderTrackingHistory::class)->orderBy('created_at', 'desc');
    }

    public function trackingCode()
    {
        return $this->hasOne(TrackingCode::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    /**
     * True when this order was placed without an account.
     */
    public function getIsGuestOrderAttribute(): bool
    {
        return empty($this->user_id);
    }

    /**
     * Full delivery address whether the order used a saved Address
     * record (logged-in user) or the inline guest_* fields.
     */
    public function getDeliveryAddressTextAttribute(): ?string
    {
        if ($this->address) {
            return $this->address->full_address;
        }

        if ($this->guest_address_line_1) {
            $parts = array_filter([
                $this->guest_address_line_1,
                $this->guest_address_line_2,
                $this->guest_city,
                $this->guest_state,
                $this->guest_country,
            ]);

            return implode(', ', $parts);
        }

        return null;
    }

    public function addTrackingEvent($status, $data = [])
    {
        return $this->trackingHistory()->create([
            'status' => $status,
            'title' => $data['title'] ?? 'Status Update',
            'description' => $data['description'] ?? null,
            'location' => $data['location'] ?? null,
            'icon' => $data['icon'] ?? '📦',
            'expected_date' => $data['expected_date'] ?? null,
            'actual_date' => now(),
            'metadata' => $data['metadata'] ?? [],
            'user_id' => auth()->id() ?? $data['user_id'] ?? null
        ]);
    }

    private function getStatusConfig($status)
    {
        $configs = [
            'pending' => ['title' => 'Order Placed', 'icon' => '📝'],
            'confirmed' => ['title' => 'Order Confirmed', 'icon' => '✅'],
            'processing' => ['title' => 'Processing Order', 'icon' => '⚙️'],
            'shipped' => ['title' => 'Order Shipped', 'icon' => '🚚'],
            'out_for_delivery' => ['title' => 'Out for Delivery', 'icon' => '📦'],
            'delivered' => ['title' => 'Order Delivered', 'icon' => '🎉'],
            'cancelled' => ['title' => 'Order Cancelled', 'icon' => '❌'],
            'returned' => ['title' => 'Order Returned', 'icon' => '↩️'],
            'refunded' => ['title' => 'Order Refunded', 'icon' => '💰']
        ];

        return $configs[$status] ?? ['title' => 'Status Updated', 'icon' => '📦'];
    }

    private function getTrackingLocation($status)
    {
        $locations = [
            'pending' => 'Online Store',
            'confirmed' => 'Order Processing Center',
            'processing' => 'Warehouse',
            'shipped' => 'Shipping Facility',
            'out_for_delivery' => 'In Transit',
            'delivered' => 'Delivery Address',
            'cancelled' => 'Order System',
            'returned' => 'Return Center',
            'refunded' => 'Payment System'
        ];

        return $locations[$status] ?? 'System';
    }

    public function getTrackingTimeline()
    {
        $timeline = [];
        $statuses = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

        foreach ($statuses as $status) {
            $history = $this->trackingHistory->where('status', $status)->first();
            $config = $this->getStatusConfig($status);

            $timeline[] = [
                'status' => $status,
                'title' => $config['title'],
                'description' => $this->getStatusDescription($status),
                'icon' => $config['icon'],
                'completed' => $this->isStatusCompleted($status),
                'current' => $this->status === $status,
                'date' => $history->actual_date ?? $this->getStatusDate($status),
                'location' => $history->location ?? $this->getTrackingLocation($status)
            ];
        }

        return $timeline;
    }

    private function isStatusCompleted($status)
    {
        $statusOrder = [
            'pending' => 1,
            'confirmed' => 2,
            'processing' => 3,
            'shipped' => 4,
            'out_for_delivery' => 5,
            'delivered' => 6
        ];

        $currentIndex = $statusOrder[$this->status] ?? 0;
        $checkIndex = $statusOrder[$status] ?? 0;

        return $checkIndex <= $currentIndex;
    }

    private function getStatusDate($status)
    {
        switch ($status) {
            case 'pending':
                return $this->created_at;
            case 'confirmed':
                return $this->confirmed_at;
            case 'processing':
                return $this->processing_at;
            case 'shipped':
                return $this->shipped_at;
            case 'out_for_delivery':
                return $this->out_for_delivery_at;
            case 'delivered':
                return $this->delivered_at ?? $this->actual_delivery;
            default:
                return $this->trackingHistory->where('status', $status)->first()->actual_date ?? null;
        }
    }

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
            'refunded' => 'Your order has been refunded.',
        ];

        return $descriptions[$status] ?? 'Order status information';
    }

    public function getDeliveryProgress()
    {
        $statuses = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
        $currentIndex = array_search($this->status, $statuses);

        if ($currentIndex === false) {
            return 0;
        }

        return round(($currentIndex + 1) / count($statuses) * 100);
    }

    public function getEstimatedDates()
    {
        return [
            'order_placed' => $this->created_at,
            'estimated_processing' => $this->created_at->addHours(2),
            'estimated_shipping' => $this->created_at->addHours(4),
            'estimated_delivery' => $this->estimated_delivery ?? $this->created_at->addDays(3),
            'actual_delivery' => $this->actual_delivery
        ];
    }
}
