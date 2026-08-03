<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Services\MpesaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    protected $mpesaService;

    public function __construct(MpesaService $mpesaService)
    {
        $this->mpesaService = $mpesaService;
    }

    /**
     * Process payment — M-Pesa STK Push only.
     * Works for a logged-in user's own order, or a guest order —
     * guests are verified by matching X-Guest-Id to the order's
     * stored session_id (set at checkout time) instead of a login.
     */
    public function processPayment(Request $request, $orderId)
    {
        try {
            if ($request->user()) {
                $order = $request->user()->orders()->findOrFail($orderId);
            } else {
                $guestId = $request->header('X-Guest-Id') ?: $request->input('guest_id');

                if (!$guestId) {
                    return response()->json(['message' => 'Missing guest session.'], 400);
                }

                $order = Order::whereNull('user_id')
                    ->where('session_id', $guestId)
                    ->findOrFail($orderId);
            }

            if ($order->payment_status === 'paid') {
                return response()->json(['message' => 'Order already paid'], 400);
            }

            $validator = Validator::make($request->all(), [
                'payment_method' => 'required|in:mpesa',
                'payment_details' => 'required|array',
                'payment_details.phone_number' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            // Format phone number
            $phone = $this->mpesaService->formatPhoneNumber($request->payment_details['phone_number']);
            
            // Initiate STK Push
            $result = $this->mpesaService->stkPush(
                $phone,
                (int) ceil($order->total),
                $order->order_number,
                "Payment for order #{$order->order_number}"
            );

            if ($result['success']) {
                // Create payment record
                $payment = Payment::create([
                    'order_id' => $order->id,
                    'transaction_id' => 'MPESA-' . time() . '-' . $order->id,
                    'method' => 'mpesa',
                    'amount' => $order->total,
                    'currency' => 'KES',
                    'status' => 'pending',
                    'payment_details' => ['phone_number' => $phone],
                    'provider_reference' => $result['checkout_request_id'] ?? null,
                    'payment_response' => $result
                ]);

                return response()->json([
                    'message' => 'STK Push sent. Please enter your M-Pesa PIN on your phone.',
                    'payment' => $payment,
                    'checkout_request_id' => $result['checkout_request_id'] ?? null,
                    'order' => $order->fresh(),
                ]);
            }

            // Payment initiation failed
            Payment::create([
                'order_id' => $order->id,
                'transaction_id' => 'FAILED-' . uniqid(),
                'method' => 'mpesa',
                'amount' => $order->total,
                'currency' => 'KES',
                'status' => 'failed',
                'payment_details' => ['phone_number' => $phone],
                'error_message' => $result['error'] ?? 'STK Push failed'
            ]);

            return response()->json([
                'message' => $result['error'] ?? 'M-Pesa payment initiation failed'
            ], 400);

        } catch (\Exception $e) {
            Log::error('Payment processing error: ' . $e->getMessage(), [
                'order_id' => $orderId ?? null,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Server Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Return available payment methods (M-Pesa only).
     */
    public function getPaymentMethods(Request $request)
    {
        $methods = [
            [
                'id' => 'mpesa',
                'name' => 'M-Pesa',
                'description' => 'Pay via M-Pesa mobile money (STK Push)',
                'icon' => 'smartphone',
                'available' => true,
                'supported_countries' => ['KE'],
                'instructions' => 'Enter your Safaricom number. You will receive an STK Push — enter your PIN to pay.',
                'currency' => 'KES',
            ],
        ];

        return response()->json($methods);
    }

    /**
     * M-Pesa STK Push callback (called by Safaricom — public route).
     */
    public function mpesaWebhook(Request $request)
    {
        $data = $request->all();

        Log::info('M-Pesa Webhook Received', $data);

        if (isset($data['Body']['stkCallback'])) {
            $callback = $data['Body']['stkCallback'];
            $resultCode = $callback['ResultCode'] ?? null;
            $checkoutRequestId = $callback['CheckoutRequestID'] ?? null;

            if ($resultCode == 0) {
                // Payment successful
                $metadata = $callback['CallbackMetadata']['Item'] ?? [];
                $mpesaReceipt = null;
                $amount = null;
                $phone = null;

                foreach ($metadata as $item) {
                    if ($item['Name'] === 'MpesaReceiptNumber') {
                        $mpesaReceipt = $item['Value'];
                    }
                    if ($item['Name'] === 'Amount') {
                        $amount = $item['Value'];
                    }
                    if ($item['Name'] === 'PhoneNumber') {
                        $phone = $item['Value'];
                    }
                }

                // Update payment record
                $payment = Payment::where('provider_reference', $checkoutRequestId)->first();
                
                if ($payment) {
                    $payment->status = 'completed';
                    $payment->transaction_id = $mpesaReceipt;
                    $payment->save();

                    // Update order
                    $order = $payment->order;
                    if ($order && $order->payment_status !== 'paid') {
                        $order->payment_status = 'paid';
                        $order->status = 'confirmed';
                        $order->confirmed_at = now();
                        $order->save();
                        
                        // Add tracking event
                        $order->addTrackingEvent('confirmed', [
                            'title' => 'Payment Confirmed',
                            'description' => "Payment of KES {$amount} received via M-Pesa. Receipt: {$mpesaReceipt}",
                            'icon' => '💰'
                        ]);
                    }
                }
            } else {
                // Payment failed or cancelled
                $checkoutId = $callback['CheckoutRequestID'] ?? null;
                if ($checkoutId) {
                    $payment = Payment::where('provider_reference', $checkoutId)->first();
                    if ($payment) {
                        $payment->status = 'failed';
                        $payment->error_message = $callback['ResultDesc'] ?? 'User cancelled or timed out';
                        $payment->save();
                    }
                }
            }
        }

        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
    }

    /**
     * PayPal webhook stub (disabled)
     */
    public function paypalWebhook(Request $request)
    {
        Log::info('PayPal webhook received but PayPal is disabled.');
        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Ignored — PayPal disabled']);
    }

    /**
     * Create payment intent stub (Stripe disabled)
     */
    public function createPaymentIntent(Request $request)
    {
        return response()->json([
            'message' => 'Card payments are not enabled. Please use M-Pesa.',
        ], 501);
    }
}