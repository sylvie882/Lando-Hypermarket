'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Address, Cart } from '@/types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  Check, Truck, Lock, Plus, Tag,
  Smartphone, ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PaymentMethodDetails from '@/components/payments/PaymentMethodDetails';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatKSH = (amount: number): string => {
  if (isNaN(amount) || amount <= 0) return 'KSh 0';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// ─── Component ───────────────────────────────────────────────────────────────

const CheckoutPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [step, setStep] = useState(1);
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Order fields
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('standard');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);

  // Payment — M-Pesa only
  const [paymentDetails, setPaymentDetails] = useState<any>({
    mpesa_phone: '',
    mpesa_till: '174379',
  });
  const [processingPayment, setProcessingPayment] = useState(false);

  // New address form
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    contact_name: '',
    contact_phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    country: 'Kenya',
    postal_code: '',
    is_default: false,
  });

  // ─── Data loading ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchData();
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [cartRes, addressesRes] = await Promise.all([
        api.cart.get(),
        api.addresses.getAll(),
      ]);

      setCart(cartRes.data.cart);
      setAddresses(addressesRes.data);

      const defaultAddress = addressesRes.data.find((a: Address) => a.is_default);
      if (defaultAddress) setSelectedAddressId(defaultAddress.id);
    } catch {
      toast.error('Failed to load checkout data');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Address ───────────────────────────────────────────────────────────────

  const handleAddAddress = async () => {
    if (!newAddress.contact_name.trim()) { toast.error('Please enter contact name'); return; }
    if (!newAddress.contact_phone.trim()) { toast.error('Please enter contact phone'); return; }
    if (!newAddress.address_line_1.trim()) { toast.error('Please enter address'); return; }
    if (!newAddress.city.trim()) { toast.error('Please enter city'); return; }

    try {
      const response = await api.addresses.create(newAddress);
      const created = response.data.address;
      setAddresses([...addresses, created]);
      setSelectedAddressId(created.id);
      setShowNewAddressForm(false);
      setNewAddress({
        label: 'Home', contact_name: '', contact_phone: '',
        address_line_1: '', address_line_2: '', city: '', state: '',
        country: 'Kenya', postal_code: '', is_default: false,
      });
      toast.success('Address added successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add address');
    }
  };

  // ─── Promo ────────────────────────────────────────────────────────────────

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) { toast.error('Please enter a promo code'); return; }
    try {
      const subtotal = calculateTotals().subtotal;
      const response = await api.promotions.validate({ code: promoCode, order_amount: subtotal });
      if (response.data.valid) {
        const promo = response.data.promotion;
        setAppliedPromo(promo);
        let discount =
          promo.type === 'percentage'
            ? Math.min(subtotal * (promo.discount_value / 100), promo.max_discount_amount ?? Infinity)
            : promo.discount_value;
        setAppliedDiscount(discount);
        toast.success(`Promo applied! Discount: ${formatKSH(discount)}`);
      } else {
        toast.error(response.data.message || 'Invalid promo code');
        setAppliedPromo(null);
        setAppliedDiscount(0);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to apply promo code');
      setAppliedPromo(null);
      setAppliedDiscount(0);
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setAppliedDiscount(0);
    setPromoCode('');
    toast.success('Promo code removed');
  };

  // ─── Place order ──────────────────────────────────────────────────────────

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) { toast.error('Please select a delivery address'); return; }

    setIsSubmitting(true);
    setProcessingPayment(true);

    try {
      const orderData = {
        address_id:      selectedAddressId,
        payment_method:  'mpesa',
        shipping_method: selectedShippingMethod,
        notes:           deliveryNotes,
        carrier:         'Lando Delivery',
        ...(deliverySlot && { delivery_slot: deliverySlot }),
        ...(appliedPromo?.code && { promo_code: appliedPromo.code }),
      };

      const orderResponse = await api.orders.create(orderData);
      const orderId = orderResponse.data.order.id;
      setCurrentOrderId(orderId);

      toast.success('Order created! Please complete M-Pesa payment.');
      // PaymentMethodDetails will handle the STK Push from here.
      // Move to review step so the payment component is rendered with the real orderId.
      setStep(3);
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const msgs = Object.values(error.response.data.errors).flat().join(', ');
        toast.error(`Validation error: ${msgs}`);
      } else {
        toast.error(
          error.response?.data?.message ||
          error.response?.data?.error ||
          'Failed to place order. Please try again.',
        );
      }
    } finally {
      setIsSubmitting(false);
      setProcessingPayment(false);
    }
  };

  // ─── Totals ───────────────────────────────────────────────────────────────

  const calculateTotals = () => {
    if (!cart) return { subtotal: 0, shipping: 0, tax: 0, total: 0 };
    const subtotal = cart.items.reduce((sum, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price);
      return sum + price * Number(item.quantity);
    }, 0);
    const total = subtotal - appliedDiscount;
    return { subtotal, shipping: 0, tax: 0, total };
  };

  const getShippingMethodDetails = () => {
    const map: Record<string, { name: string; days: string; description: string }> = {
      standard:  { name: 'Standard Delivery',  days: '3-5 business days', description: 'Free delivery' },
      express:   { name: 'Express Delivery',   days: '1-2 business days', description: 'Priority delivery' },
      overnight: { name: 'Overnight Delivery', days: 'Next business day',  description: 'Guaranteed next day' },
    };
    return map[selectedShippingMethod] ?? map.standard;
  };

  // ─── Guards ───────────────────────────────────────────────────────────────

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-4">Add some items to checkout</p>
          <button
            onClick={() => router.push('/products')}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 font-medium"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const { subtotal, total } = calculateTotals();
  const shippingDetails = getShippingMethodDetails();

  const steps = [
    { number: 1, title: 'Address', icon: <Truck size={20} /> },
    { number: 2, title: 'Payment', icon: <Smartphone size={20} /> },
    { number: 3, title: 'Review',  icon: <Check size={20} /> },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-12 w-full">

        {/* Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center max-w-2xl mx-auto">
            {steps.map((stepItem, index) => (
              <React.Fragment key={stepItem.number}>
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                    step >= stepItem.number ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {stepItem.icon}
                  </div>
                  <div className={`ml-3 ${step >= stepItem.number ? 'text-orange-500' : 'text-gray-500'}`}>
                    <div className="text-sm font-medium">Step {stepItem.number}</div>
                    <div className="text-sm font-semibold">{stepItem.title}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-16 mx-4 ${step > stepItem.number ? 'bg-orange-500' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left column ── */}
          <div className="lg:col-span-2">

            {/* STEP 1 — Address */}
            {step === 1 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6">Delivery Address</h2>

                <div className="space-y-4 mb-6">
                  {addresses.length > 0 ? addresses.map((address) => (
                    <div
                      key={address.id}
                      onClick={() => setSelectedAddressId(address.id)}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedAddressId === address.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="font-bold text-lg">{address.label}</h3>
                            {address.is_default && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Default</span>
                            )}
                          </div>
                          <div className="space-y-1 text-gray-700">
                            <p className="font-medium">{address.contact_name} • {address.contact_phone}</p>
                            <p>{address.address_line_1}</p>
                            {address.address_line_2 && <p>{address.address_line_2}</p>}
                            <p>{address.city}, {address.state} {address.postal_code}</p>
                            <p>{address.country}</p>
                          </div>
                        </div>
                        {selectedAddressId === address.id && <Check className="text-orange-500" size={24} />}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                      <p className="text-gray-500 mb-4">No addresses saved yet</p>
                    </div>
                  )}
                </div>

                {!showNewAddressForm && (
                  <button
                    onClick={() => setShowNewAddressForm(true)}
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center transition-all"
                  >
                    <Plus size={20} className="mr-2" />
                    <span className="font-medium">Add New Address</span>
                  </button>
                )}

                {showNewAddressForm && (
                  <div className="mt-6 p-6 border-2 rounded-xl bg-gray-50">
                    <h3 className="font-bold text-lg mb-4">Add New Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Label</label>
                        <select
                          value={newAddress.label}
                          onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        >
                          <option>Home</option>
                          <option>Office</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Contact Name *</label>
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={newAddress.contact_name}
                          onChange={(e) => setNewAddress({ ...newAddress, contact_name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          placeholder="07XX XXX XXX"
                          value={newAddress.contact_phone}
                          onChange={(e) => setNewAddress({ ...newAddress, contact_phone: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Address Line 1 *</label>
                        <input
                          type="text"
                          placeholder="Street address"
                          value={newAddress.address_line_1}
                          onChange={(e) => setNewAddress({ ...newAddress, address_line_1: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Address Line 2 (Optional)</label>
                        <input
                          type="text"
                          placeholder="Apartment, suite, unit, etc."
                          value={newAddress.address_line_2}
                          onChange={(e) => setNewAddress({ ...newAddress, address_line_2: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">City *</label>
                        <input
                          type="text"
                          placeholder="e.g., Nairobi"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">State/County</label>
                        <input
                          type="text"
                          placeholder="e.g., Nairobi County"
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Country</label>
                        <input
                          type="text"
                          value={newAddress.country}
                          readOnly
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Postal Code</label>
                        <input
                          type="text"
                          placeholder="Postal Code"
                          value={newAddress.postal_code}
                          onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center mt-6">
                      <input
                        type="checkbox"
                        id="default"
                        checked={newAddress.is_default}
                        onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                        className="h-5 w-5 text-orange-500 border-gray-300 rounded"
                      />
                      <label htmlFor="default" className="ml-2 text-sm text-gray-700">Set as default address</label>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={handleAddAddress} className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium flex-1">
                        Save Address
                      </button>
                      <button onClick={() => setShowNewAddressForm(false)} className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Shipping method */}
                <div className="mt-8">
                  <h3 className="font-bold text-lg mb-4">Shipping Method</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: 'standard',  name: 'Standard',  days: '3-5 business days', description: 'Free delivery' },
                      { id: 'express',   name: 'Express',   days: '1-2 business days', description: 'Priority delivery' },
                      { id: 'overnight', name: 'Overnight', days: 'Next business day',  description: 'Guaranteed next day' },
                    ].map((method) => (
                      <div
                        key={method.id}
                        onClick={() => setSelectedShippingMethod(method.id)}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedShippingMethod === method.id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold">{method.name}</h4>
                          <span className="font-bold text-lg text-green-600">FREE</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{method.days}</p>
                        <p className="text-xs text-gray-500">{method.description}</p>
                        <p className="text-xs text-green-600 mt-2 font-medium">🎉 Free shipping on all orders!</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery details */}
                <div className="mt-8 space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Delivery Instructions (Optional)</label>
                    <textarea
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="Any special instructions for delivery?"
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Preferred Delivery Time (Optional)</label>
                    <input
                      type="datetime-local"
                      value={deliverySlot}
                      onChange={(e) => setDeliverySlot(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedAddressId}
                    className="px-8 py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-all shadow-lg hover:shadow-xl"
                  >
                    Continue to Payment →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 — Payment (M-Pesa) */}
            {step === 2 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-2">Payment Method</h2>
                <p className="text-gray-500 mb-6">We accept M-Pesa for all orders.</p>

                {/* Single M-Pesa tile */}
                <div className="p-6 border-2 border-green-500 bg-green-50 rounded-xl mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                      <Smartphone size={24} className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">M-Pesa</h3>
                      <p className="text-gray-600">Pay via M-Pesa STK Push (Safaricom)</p>
                    </div>
                    <Check className="text-green-600 ml-auto" size={24} />
                  </div>
                </div>

                {/* M-Pesa details form */}
                <PaymentMethodDetails
                  methodId="mpesa"
                  paymentDetails={paymentDetails}
                  onPaymentDetailsChange={setPaymentDetails}
                  totalAmount={total}
                  currency="KES"
                  userCountry={user?.country}
                  onSubmit={() => setStep(3)}
                  orderId={currentOrderId ?? undefined}
                />

                <div className="mt-8 flex justify-between">
                  <button onClick={() => setStep(1)} className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!paymentDetails.mpesa_phone}
                    className="px-8 py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-all shadow-lg hover:shadow-xl"
                  >
                    Review Order →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 — Review */}
            {step === 3 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6">Review Your Order</h2>

                <div className="space-y-6">
                  {/* Address */}
                  <div>
                    <h3 className="font-bold text-lg mb-4">Delivery Address</h3>
                    {addresses.find(a => a.id === selectedAddressId) && (() => {
                      const addr = addresses.find(a => a.id === selectedAddressId)!;
                      return (
                        <div className="p-6 border-2 border-gray-200 rounded-xl">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <p className="font-bold text-lg">{addr.label}</p>
                              <p className="font-medium text-gray-700">{addr.contact_name}</p>
                              <p className="text-gray-600">{addr.address_line_1}</p>
                              {addr.address_line_2 && <p className="text-gray-600">{addr.address_line_2}</p>}
                              <p className="text-gray-600">{addr.city}, {addr.state} {addr.postal_code}</p>
                              <p className="text-gray-600">{addr.country}</p>
                              <p className="text-gray-700 font-medium">📱 {addr.contact_phone}</p>
                            </div>
                            <button onClick={() => setStep(1)} className="text-orange-500 hover:text-orange-600 font-medium">Change</button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Payment */}
                  <div>
                    <h3 className="font-bold text-lg mb-4">Payment Method</h3>
                    <div className="p-6 border-2 border-gray-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Smartphone size={24} className="text-green-600" />
                          <div className="ml-3">
                            <p className="font-bold text-lg">M-Pesa</p>
                            <p className="text-gray-600">Pay via M-Pesa mobile money</p>
                          </div>
                        </div>
                        <button onClick={() => setStep(2)} className="text-orange-500 hover:text-orange-600 font-medium">Change</button>
                      </div>
                      {paymentDetails.mpesa_phone && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm text-green-800">
                            <span className="font-semibold">M-Pesa Phone:</span> {paymentDetails.mpesa_phone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shipping */}
                  <div>
                    <h3 className="font-bold text-lg mb-4">Shipping Method</h3>
                    <div className="p-6 border-2 border-gray-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-lg">{shippingDetails.name}</p>
                          <p className="text-gray-600">{shippingDetails.days}</p>
                          <p className="text-sm text-green-600 font-medium">🎉 Free shipping on all orders!</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-green-600">FREE</p>
                          <button onClick={() => setStep(1)} className="text-sm text-orange-500 hover:text-orange-600 font-medium">Change</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <h3 className="font-bold text-lg mb-4">Order Items</h3>
                    <div className="border-2 border-gray-200 rounded-xl divide-y">
                      {cart.items.map((item) => {
                        const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price);
                        return (
                          <div key={item.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex-1">
                              <p className="font-bold text-lg">{item.product?.name || 'Product'}</p>
                              <p className="text-gray-600">{item.quantity} × {formatKSH(itemPrice)}</p>
                            </div>
                            <p className="font-bold text-lg">{formatKSH(item.quantity * itemPrice)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {deliveryNotes && (
                    <div>
                      <h3 className="font-bold text-lg mb-2">Delivery Instructions</h3>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <p className="text-gray-700">{deliveryNotes}</p>
                      </div>
                    </div>
                  )}

                  {/* Promo code */}
                  <div className="mt-8">
                    <h3 className="font-bold text-lg mb-4">Promo Code</h3>
                    {!appliedPromo ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          placeholder="Enter promo code"
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                        <button onClick={handleApplyPromo} className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-medium">
                          Apply
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Tag size={20} className="mr-2 text-green-600" />
                            <div>
                              <p className="font-bold text-green-800">{appliedPromo.code} applied!</p>
                              {appliedPromo.name && <p className="text-sm text-green-600">{appliedPromo.name}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-lg text-green-800">-{formatKSH(appliedDiscount)}</span>
                            <button onClick={removePromoCode} className="text-sm text-red-600 hover:text-red-700 font-medium">Remove</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* M-Pesa STK push (shown after order created) */}
                  {currentOrderId && (
                    <div className="mt-4">
                      <h3 className="font-bold text-lg mb-4">Complete M-Pesa Payment</h3>
                      <PaymentMethodDetails
                        methodId="mpesa"
                        paymentDetails={paymentDetails}
                        onPaymentDetailsChange={setPaymentDetails}
                        totalAmount={total}
                        currency="KES"
                        userCountry={user?.country}
                        orderId={currentOrderId}
                        onSubmit={() => router.push(`/orders/${currentOrderId}`)}
                      />
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="mt-8 flex justify-between">
                  <button onClick={() => setStep(2)} className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                    ← Back
                  </button>
                  {!currentOrderId && (
                    <button
                      onClick={handlePlaceOrder}
                      disabled={isSubmitting || !selectedAddressId || processingPayment}
                      className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-all shadow-lg hover:shadow-xl flex items-center"
                    >
                      <Lock size={20} className="mr-2" />
                      {isSubmitting || processingPayment
                        ? <span className="flex items-center"><LoadingSpinner size="sm" />&nbsp;Placing Order…</span>
                        : 'Place Order & Pay with M-Pesa'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Right column — Order Summary ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-8">Order Summary</h3>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatKSH(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-bold text-green-600">FREE</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="font-medium">Discount</span>
                    <span className="font-bold">-{formatKSH(appliedDiscount)}</span>
                  </div>
                )}
                <hr className="my-4 border-gray-300" />
                <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatKSH(total)}</span>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200 mt-4">
                  <p className="text-sm text-green-700 font-medium">🎉 Free shipping on all orders!</p>
                  <p className="text-xs text-green-600 mt-1">No hidden charges • No VAT</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <ShieldCheck size={16} className="text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Secure SSL Encryption</span>
                </div>
                <p className="text-xs text-gray-500">
                  Your payment information is encrypted and secure.
                </p>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 mb-2">
                  <span className="font-medium">Need help?</span> Call our support team
                </p>
                <p className="text-lg font-bold text-blue-800">+254 716 354 589</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;