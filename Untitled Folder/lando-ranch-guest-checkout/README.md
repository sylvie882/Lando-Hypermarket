# Guest Checkout — Deployment Guide

## What this does
Lets someone shop and complete an order on Lando Ranch **without creating an
account**. Logged-in users are unaffected — they still see saved addresses,
loyalty points, order history, etc.

Guests are identified by an anonymous ID (`X-Guest-Id` header) generated once
in the browser and stored in `localStorage`. It's used to find/create their
cart and, after checkout, to verify they own the order they're paying for.

## Backend — copy into your Laravel project

| File in this zip | Goes to (relative to Laravel root) |
|---|---|
| `backend/database/migrations/2026_08_01_000001_add_guest_checkout_support.php` | `database/migrations/` |
| `backend/app/Http/Middleware/OptionalSanctumAuth.php` | `app/Http/Middleware/` |
| `backend/app/Http/Kernel.php` | `app/Http/Kernel.php` (replaces existing — only addition is the `optional.auth` alias) |
| `backend/app/Http/Controllers/Api/CartController.php` | `app/Http/Controllers/Api/CartController.php` |
| `backend/app/Http/Controllers/Api/OrderController.php` | `app/Http/Controllers/Api/OrderController.php` |
| `backend/app/Http/Controllers/Api/PaymentController.php` | `app/Http/Controllers/Api/PaymentController.php` |
| `backend/app/Models/Order.php` | `app/Models/Order.php` |
| `backend/routes/api.php` | `routes/api.php` |

Then run:
```bash
php artisan migrate
php artisan config:clear
php artisan route:clear
```

### What changed, and why
- **`carts.session_id`** already existed as a column but was never used — a
  guest cart is now `carts` row with `session_id` set and `user_id` null.
- **`orders`** gained `session_id` + `guest_name/email/phone/address_*`
  columns, and `user_id`/`address_id` are now nullable — a guest order has no
  `user_id`/`address_id`, just the guest_* fields.
- **`OptionalSanctumAuth`** middleware: unlike `auth:sanctum`, it never
  rejects a request with no token — it just resolves `$request->user()` if a
  valid token *is* present, and lets guests through either way.
- **`/cart/*`, `/checkout`, `/orders/{id}/pay`** moved from the
  `auth:sanctum` group to a new `optional.auth` group. Order history,
  addresses, and account settings are still fully protected.
- **`CartController`** now resolves the cart by user OR by the `X-Guest-Id`
  header instead of assuming `$request->user()` exists.
- **`OrderController::store()`** validates a different field set for guests
  vs. accounts, stores guest contact + address info directly on the order,
  and skips loyalty points / account notifications for guests (they get
  their order number back in the response instead).
- **`PaymentController::processPayment()`** lets a guest pay for their own
  order, verified by matching `X-Guest-Id` to the order's stored
  `session_id` — not by ownership through a user account.
- Two small pre-existing bugs fixed along the way: `promo_code` was being
  set on order creation but was missing from `Order::$fillable` (silently
  dropped); the guest-checkout shipping calculation was extracted out of the
  address-only code path so it doesn't crash when there's no `Address`
  record.

## Frontend — copy into your Next.js project

| File in this zip | Goes to |
|---|---|
| `frontend/lib/api.ts` | `lib/api.ts` |
| `frontend/app/cart/page.tsx` | `app/cart/page.tsx` |
| `frontend/app/checkout/page.tsx` | `app/checkout/page.tsx` |

### What changed
- **`lib/api.ts`** — generates a guest UUID on first use, persists it in
  `localStorage['guest_cart_id']`, and sends it as `X-Guest-Id` on every
  request that isn't already carrying a login token.
- **`app/cart/page.tsx`** — dropped the "please log in" wall; cart now loads
  for guests too. Added a small "shopping as guest" banner with a sign-in
  nudge, an item-count subtitle, and an arrow icon on the checkout CTA.
- **`app/checkout/page.tsx`** — this is the main piece:
  - No more hard redirect to `/auth/login`.
  - Step 1 shows saved addresses for logged-in users, or an inline guest
    form (name, email, phone, address) for guests.
  - Order creation sends the right payload depending on auth state.
  - New **Step 4 confirmation screen** — shows the order number and lets
    the guest track the order or keep shopping, instead of redirecting to
    the account-only order detail page they can't access.
  - Stepper redesigned: shows a green check on completed steps, labels
    collapse on mobile, active step gets a subtle glow.

## Test checklist before you call it done
1. **Guest path**: open in a private/incognito window → add product to cart
   → cart page loads without login → checkout → fill guest details → M-Pesa
   STK push → confirmation screen shows an order number → `/track-order`
   finds it.
2. **Logged-in path**: still works exactly as before (saved addresses,
   loyalty points, order history, no functional change).
3. **Cross-check**: a guest's cart/order isn't visible to a different guest
   or to a logged-in user (each `X-Guest-Id` is isolated).

## Not included in this pass
Guests currently can't **cancel** an order or see order history the way an
account can (`/orders` index/show stay behind login) — they track via
`/track-order` with their order number instead, which was already public.
If you want self-serve guest cancellation, that's a small follow-up to
`OrderController::cancel()`.

Visual redesign of the homepage / product listing pages hasn't been touched
yet — this pass focused on getting the cart → checkout → payment flow
correct and guest-friendly, with some polish on those two pages along the
way. Happy to do a dedicated pass on the homepage/product pages next.
