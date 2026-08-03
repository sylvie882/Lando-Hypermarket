<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\Promotion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CartController extends Controller
{
    /**
     * Find (or create) the cart for whoever is making the request —
     * a logged-in user, or a guest identified by the X-Guest-Id header.
     */
    private function resolveCart(Request $request, bool $createIfMissing = true): ?Cart
    {
        $user = $request->user();

        if ($user) {
            $cart = Cart::where('user_id', $user->id)->first();

            if (!$cart && $createIfMissing) {
                $cart = Cart::create(['user_id' => $user->id]);
            }

            return $cart;
        }

        $guestId = $request->header('X-Guest-Id') ?: $request->input('guest_id');

        if (!$guestId) {
            return null;
        }

        $cart = Cart::where('session_id', $guestId)->whereNull('user_id')->first();

        if (!$cart && $createIfMissing) {
            $cart = Cart::create(['session_id' => $guestId]);
        }

        return $cart;
    }

    private function guestRequiredResponse()
    {
        return response()->json([
            'message' => 'Missing guest session. Send an X-Guest-Id header or log in.'
        ], 400);
    }

    public function show(Request $request)
    {
        $cart = $this->resolveCart($request);

        if (!$cart) {
            return $this->guestRequiredResponse();
        }

        $cart->load('items.product');

        return response()->json([
            'cart' => $cart,
            'total' => $cart->total,
            'item_count' => $cart->item_count
        ]);
    }

    public function addItem(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $product = Product::findOrFail($request->product_id);

        // Check stock
        if ($product->stock_quantity < $request->quantity) {
            return response()->json([
                'message' => 'Insufficient stock. Only ' . $product->stock_quantity . ' items available.'
            ], 400);
        }

        $cart = $this->resolveCart($request);

        if (!$cart) {
            return $this->guestRequiredResponse();
        }

        try {
            $cart->addItem($request->product_id, $request->quantity);

            return response()->json([
                'message' => 'Item added to cart',
                'cart' => $cart->fresh()->load('items.product')
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function updateItem(Request $request, $itemId)
    {
        $validator = Validator::make($request->all(), [
            'quantity' => 'required|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $cart = $this->resolveCart($request, false);

        if (!$cart) {
            return $this->guestRequiredResponse();
        }

        $cartItem = $cart->items()->where('id', $itemId)->firstOrFail();

        if ($request->quantity == 0) {
            $cartItem->delete();
            return response()->json(['message' => 'Item removed from cart']);
        }

        // Check stock
        if ($cartItem->product->stock_quantity < $request->quantity) {
            return response()->json([
                'message' => 'Insufficient stock. Only ' . $cartItem->product->stock_quantity . ' items available.'
            ], 400);
        }

        $cartItem->quantity = $request->quantity;
        $cartItem->save();

        return response()->json([
            'message' => 'Cart updated',
            'cart' => $cart->fresh()->load('items.product')
        ]);
    }

    public function removeItem(Request $request, $itemId)
    {
        $cart = $this->resolveCart($request, false);

        if (!$cart) {
            return $this->guestRequiredResponse();
        }

        $cartItem = $cart->items()->where('id', $itemId)->firstOrFail();
        $cartItem->delete();

        return response()->json([
            'message' => 'Item removed from cart',
            'cart' => $cart->fresh()->load('items.product')
        ]);
    }

    public function clear(Request $request)
    {
        $cart = $this->resolveCart($request, false);

        if ($cart) {
            $cart->items()->delete();
        }

        return response()->json(['message' => 'Cart cleared']);
    }

    public function count(Request $request)
    {
        $cart = $this->resolveCart($request, false);

        if (!$cart) {
            return response()->json(['count' => 0]);
        }

        return response()->json(['count' => $cart->item_count]);
    }

    public function applyPromotion(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'promo_code' => 'required|exists:promotions,code'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $cart = $this->resolveCart($request, false);

        if (!$cart) {
            return $this->guestRequiredResponse();
        }

        $promotion = Promotion::where('code', $request->promo_code)->first();

        if (!$promotion->isApplicable($cart->total)) {
            return response()->json(['message' => 'Promotion not applicable'], 400);
        }

        return response()->json([
            'message' => 'Promotion applied',
            'promotion' => $promotion,
            'discount' => $promotion->calculateDiscount($cart->total)
        ]);
    }
}
