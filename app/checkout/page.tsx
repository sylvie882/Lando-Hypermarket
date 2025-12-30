'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Address, Cart } from '@/types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Check, CreditCard, Truck, Lock, Plus, Edit, Trash2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const CheckoutPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('cod');
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('standard');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  
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
    country: '',
    postal_code: '',
    is_default: false
  });

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
      const [cartRes, addressesRes, paymentMethodsRes] = await Promise.all([
        api.cart.get(),
        api.addresses.getAll(),
        api.payments.getMethods()
      ]);

      setCart(cartRes.data.cart);
      setAddresses(addressesRes.data);
      setPaymentMethods(paymentMethodsRes.data || []);

      // Set default address if available
      const defaultAddress = addressesRes.data.find((addr: Address) => addr.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      }

      // Default to COD if available
      if (paymentMethodsRes.data?.length > 0) {
        const codMethod = paymentMethodsRes.data.find((method: any) => 
          method.id === 'cod' || method.name.toLowerCase().includes('cash')
        );
        if (codMethod) {
          setSelectedPaymentMethod(codMethod.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch checkout data:', error);
      toast.error('Failed to load checkout data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAddress = async () => {
    // Validation
    if (!newAddress.contact_name.trim()) {
      toast.error('Please enter contact name');
      return;
    }
    if (!newAddress.contact_phone.trim()) {
      toast.error('Please enter contact phone');
      return;
    }
    if (!newAddress.address_line_1.trim()) {
      toast.error('Please enter address');
      return;
    }
    if (!newAddress.city.trim()) {
      toast.error('Please enter city');
      return;
    }
    if (!newAddress.country.trim()) {
      toast.error('Please enter country');
      return;
    }

    try {
      const response = await api.addresses.create(newAddress);
      const newAddressData = response.data.address;
      
      setAddresses([...addresses, newAddressData]);
      setSelectedAddressId(newAddressData.id);
      setShowNewAddressForm(false);
      setNewAddress({
        label: 'Home',
        contact_name: '',
        contact_phone: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        country: '',
        postal_code: '',
        is_default: false
      });
      
      toast.success('Address added successfully');
    } catch (error: any) {
      console.error('Add address error:', error);
      toast.error(error.response?.data?.message || 'Failed to add address');
    }
  };

  const handleApplyPromo = async () => {
  if (!promoCode.trim()) {
    toast.error('Please enter a promo code');
    return;
  }
  
  try {
    console.log('Applying promo code:', promoCode);
    
    // Calculate subtotal
    const subtotal = cart ? cart.items.reduce((sum, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price);
      const quantity = Number(item.quantity);
      return sum + (price * quantity);
    }, 0) : 0;
    
    // CORRECTED: Pass as a single object with code and order_amount
    const response = await api.promotions.validate({
      code: promoCode,
      order_amount: subtotal
    });
    
    console.log('Promotion validation response:', response.data);
    
    if (response.data.valid) {
      setAppliedPromo(response.data.promotion);
      
      // Calculate actual discount amount
      let discount = 0;
      const promo = response.data.promotion;
      if (promo.type === 'percentage') {
        discount = subtotal * (promo.discount_value / 100);
        // Apply max discount if set
        if (promo.max_discount_amount && discount > promo.max_discount_amount) {
          discount = promo.max_discount_amount;
        }
      } else if (promo.type === 'fixed_amount') {
        discount = promo.discount_value;
      }
      
      setAppliedDiscount(discount);
      toast.success(`Promo code applied! Discount: $${discount.toFixed(2)}`);
    } else {
      toast.error(response.data.message || 'Invalid promo code');
      setAppliedPromo(null);
      setAppliedDiscount(0);
    }
  } catch (error: any) {
    console.error('Promo code error:', error);
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

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        address_id: selectedAddressId,
        payment_method: selectedPaymentMethod,
        shipping_method: selectedShippingMethod,
        notes: deliveryNotes,
        carrier: 'Standard Carrier',
        ...(deliverySlot && { delivery_slot: deliverySlot }),
        ...(appliedPromo?.code && { promo_code: appliedPromo.code })
      };

      console.log('Placing order with data:', orderData);
      
      const response = await api.orders.create(orderData);
      console.log('Order response:', response.data);
      
      toast.success('Order placed successfully!');
      
      // Redirect to order confirmation
      router.push(`/orders/${response.data.order.id}`);
    } catch (error: any) {
      console.error('Place order error:', error);
      
      // Better error handling to see what the backend is complaining about
      if (error.response?.data?.errors) {
        // Laravel validation errors
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat().join(', ');
        toast.error(`Validation error: ${errorMessages}`);
      } else {
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            'Failed to place order. Please try again.';
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotals = () => {
    if (!cart) return { subtotal: 0, shipping: 0, tax: 0, total: 0 };
    
    const subtotal = cart.items.reduce((sum, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price);
      const quantity = Number(item.quantity);
      return sum + (price * quantity);
    }, 0);
    
    // Calculate shipping based on selected method
    let shipping = 0;
    switch (selectedShippingMethod) {
      case 'standard':
        shipping = subtotal > 50 ? 0 : 5.99;
        break;
      case 'express':
        shipping = 12.99;
        break;
      case 'overnight':
        shipping = 24.99;
        break;
      default:
        shipping = subtotal > 50 ? 0 : 5.99;
    }
    
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax - appliedDiscount;
    
    return { subtotal, shipping, tax, total };
  };

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
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const { subtotal, shipping, tax, total } = calculateTotals();

  const steps = [
    { number: 1, title: 'Address', icon: <Truck size={20} /> },
    { number: 2, title: 'Payment', icon: <CreditCard size={20} /> },
    { number: 3, title: 'Review', icon: <Check size={20} /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Checkout Steps */}
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
                  <div className={`h-0.5 w-16 mx-4 ${
                    step > stepItem.number ? 'bg-orange-500' : 'bg-gray-200'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6">Delivery Address</h2>
                
                {/* Address Selection */}
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
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                Default
                              </span>
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
                        {selectedAddressId === address.id && (
                          <div className="flex items-center">
                            <Check className="text-orange-500" size={24} />
                          </div>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                      <p className="text-gray-500 mb-4">No addresses saved yet</p>
                    </div>
                  )}
                </div>

                {/* Add New Address Button */}
                {!showNewAddressForm && (
                  <button
                    onClick={() => setShowNewAddressForm(true)}
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center transition-all"
                  >
                    <Plus size={20} className="mr-2" />
                    <span className="font-medium">Add New Address</span>
                  </button>
                )}

                {/* New Address Form */}
                {showNewAddressForm && (
                  <div className="mt-6 p-6 border-2 rounded-xl bg-gray-50">
                    <h3 className="font-bold text-lg mb-4">Add New Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Label</label>
                        <select
                          value={newAddress.label}
                          onChange={(e) => setNewAddress({...newAddress, label: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                          <option value="Home">Home</option>
                          <option value="Office">Office</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Contact Name *</label>
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={newAddress.contact_name}
                          onChange={(e) => setNewAddress({...newAddress, contact_name: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone Number *</label>
                        <input
                          type="text"
                          placeholder="Phone Number"
                          value={newAddress.contact_phone}
                          onChange={(e) => setNewAddress({...newAddress, contact_phone: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Address Line 1 *</label>
                        <input
                          type="text"
                          placeholder="Street address"
                          value={newAddress.address_line_1}
                          onChange={(e) => setNewAddress({...newAddress, address_line_1: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Address Line 2 (Optional)</label>
                        <input
                          type="text"
                          placeholder="Apartment, suite, unit, etc."
                          value={newAddress.address_line_2}
                          onChange={(e) => setNewAddress({...newAddress, address_line_2: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">City *</label>
                        <input
                          type="text"
                          placeholder="City"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">State</label>
                        <input
                          type="text"
                          placeholder="State/Province"
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Country *</label>
                        <input
                          type="text"
                          placeholder="Country"
                          value={newAddress.country}
                          onChange={(e) => setNewAddress({...newAddress, country: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Postal Code</label>
                        <input
                          type="text"
                          placeholder="Postal Code"
                          value={newAddress.postal_code}
                          onChange={(e) => setNewAddress({...newAddress, postal_code: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center mt-6">
                      <input
                        type="checkbox"
                        id="default"
                        checked={newAddress.is_default}
                        onChange={(e) => setNewAddress({...newAddress, is_default: e.target.checked})}
                        className="h-5 w-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor="default" className="ml-2 text-sm text-gray-700">
                        Set as default address
                      </label>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={handleAddAddress}
                        className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium flex-1"
                      >
                        Save Address
                      </button>
                      <button
                        onClick={() => setShowNewAddressForm(false)}
                        className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Shipping Method Selection */}
                <div className="mt-8">
                  <h3 className="font-bold text-lg mb-4">Shipping Method</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: 'standard', name: 'Standard', price: 5.99, days: '3-5 days', description: 'Free on orders over $50' },
                      { id: 'express', name: 'Express', price: 12.99, days: '1-2 days', description: 'Priority shipping' },
                      { id: 'overnight', name: 'Overnight', price: 24.99, days: 'Next day', description: 'Guaranteed next day' }
                    ].map((method) => {
                      const isFreeShipping = method.id === 'standard' && subtotal > 50;
                      const shippingPrice = isFreeShipping ? 0 : method.price;
                      
                      return (
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
                            <span className="font-bold text-lg">
                              {isFreeShipping ? (
                                <span className="text-green-600">FREE</span>
                              ) : (
                                `$${shippingPrice.toFixed(2)}`
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{method.days}</p>
                          <p className="text-xs text-gray-500">{method.description}</p>
                          {isFreeShipping && (
                            <p className="text-xs text-green-600 mt-2 font-medium">🎉 You qualify for free shipping!</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Delivery Details */}
                <div className="mt-8 space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Delivery Instructions (Optional)
                    </label>
                    <textarea
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="Any special instructions for delivery?"
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Preferred Delivery Time (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={deliverySlot}
                      onChange={(e) => setDeliverySlot(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Navigation */}
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedAddressId}
                    className="px-8 py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Continue to Payment →
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6">Payment Method</h2>
                
                <div className="space-y-4 mb-8">
                  {paymentMethods.length > 0 ? paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedPaymentMethod === method.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                            <CreditCard size={24} className="text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{method.name}</h3>
                            <p className="text-gray-600">{method.description}</p>
                          </div>
                        </div>
                        {selectedPaymentMethod === method.id && (
                          <Check className="text-orange-500" size={24} />
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="p-6 border-2 border-gray-200 rounded-xl">
                      <p className="text-gray-500">No payment methods available</p>
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="mt-8 flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!selectedPaymentMethod}
                    className="px-8 py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Review Order →
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6">Review Your Order</h2>
                
                <div className="space-y-6">
                  {/* Selected Address */}
                  <div>
                    <h3 className="font-bold text-lg mb-4">Delivery Address</h3>
                    {addresses.find(a => a.id === selectedAddressId) && (
                      <div className="p-6 border-2 border-gray-200 rounded-xl">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <p className="font-bold text-lg">
                              {addresses.find(a => a.id === selectedAddressId)!.label}
                            </p>
                            <p className="font-medium text-gray-700">
                              {addresses.find(a => a.id === selectedAddressId)!.contact_name}
                            </p>
                            <p className="text-gray-600">
                              {addresses.find(a => a.id === selectedAddressId)!.address_line_1}
                            </p>
                            {addresses.find(a => a.id === selectedAddressId)!.address_line_2 && (
                              <p className="text-gray-600">
                                {addresses.find(a => a.id === selectedAddressId)!.address_line_2}
                              </p>
                            )}
                            <p className="text-gray-600">
                              {addresses.find(a => a.id === selectedAddressId)!.city}, 
                              {addresses.find(a => a.id === selectedAddressId)!.state} {addresses.find(a => a.id === selectedAddressId)!.postal_code}
                            </p>
                            <p className="text-gray-600">
                              {addresses.find(a => a.id === selectedAddressId)!.country}
                            </p>
                            <p className="text-gray-700 font-medium">
                              📱 {addresses.find(a => a.id === selectedAddressId)!.contact_phone}
                            </p>
                          </div>
                          <button
                            onClick={() => setStep(1)}
                            className="text-orange-500 hover:text-orange-600 font-medium"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div>
                    <h3 className="font-bold text-lg mb-4">Payment Method</h3>
                    <div className="p-6 border-2 border-gray-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CreditCard size={24} className="mr-3 text-gray-600" />
                          <div>
                            <p className="font-bold text-lg">
                              {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name || 'Cash on Delivery'}
                            </p>
                            <p className="text-gray-600">
                              {paymentMethods.find(m => m.id === selectedPaymentMethod)?.description || 'Pay when you receive your order'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setStep(2)}
                          className="text-orange-500 hover:text-orange-600 font-medium"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Method */}
                  <div>
                    <h3 className="font-bold text-lg mb-4">Shipping Method</h3>
                    <div className="p-6 border-2 border-gray-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-lg">
                            {selectedShippingMethod === 'standard' ? 'Standard Shipping' :
                             selectedShippingMethod === 'express' ? 'Express Shipping' : 'Overnight Shipping'}
                          </p>
                          <p className="text-gray-600">
                            {selectedShippingMethod === 'standard' ? '3-5 business days' :
                             selectedShippingMethod === 'express' ? '1-2 business days' : 'Next business day'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {shipping === 0 ? (
                              <span className="text-green-600">FREE</span>
                            ) : (
                              `$${shipping.toFixed(2)}`
                            )}
                          </p>
                          <button
                            onClick={() => setStep(1)}
                            className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-bold text-lg mb-4">Order Items</h3>
                    <div className="border-2 border-gray-200 rounded-xl divide-y">
                      {cart.items.map((item) => (
                        <div key={item.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                          <div className="flex-1">
                            <p className="font-bold text-lg">{item.product.name}</p>
                            <p className="text-gray-600">
                              {item.quantity} × ${typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price).toFixed(2)}
                            </p>
                          </div>
                          <p className="font-bold text-lg">
                            ${(item.quantity * (typeof item.price === 'number' ? item.price : parseFloat(item.price))).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Notes */}
                  {deliveryNotes && (
                    <div>
                      <h3 className="font-bold text-lg mb-2">Delivery Instructions</h3>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <p className="text-gray-700">{deliveryNotes}</p>
                      </div>
                    </div>
                  )}

                  {/* Promo Code */}
                  <div className="mt-8">
                    <h3 className="font-bold text-lg mb-4">Promo Code</h3>
                    {!appliedPromo ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          placeholder="Enter promo code"
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                        <button
                          onClick={handleApplyPromo}
                          className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-medium"
                        >
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
                              {appliedPromo.name && (
                                <p className="text-sm text-green-600">{appliedPromo.name}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-lg text-green-800">
                              -${appliedDiscount.toFixed(2)}
                            </span>
                            <button
                              onClick={removePromoCode}
                              className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation */}
                <div className="mt-8 flex justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting || !selectedAddressId || !selectedPaymentMethod}
                    className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
                  >
                    <Lock size={20} className="mr-2" />
                    {isSubmitting ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-8">Order Summary</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? (
                      <span className="text-green-600 font-bold">FREE</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tax (10%)</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="font-medium">Discount</span>
                    <span className="font-bold">-${appliedDiscount.toFixed(2)}</span>
                  </div>
                )}
                <hr className="my-4" />
                <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {shipping === 0 ? 
                    '🎉 Free shipping on orders over $50!' : 
                    `Add $${(50 - subtotal).toFixed(2)} more for free shipping`
                  }
                </p>
              </div>

              {/* Security Note */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center mb-2">
                  <Lock size={16} className="text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Secure SSL Encryption</span>
                </div>
                <p className="text-xs text-gray-500">
                  Your payment information is encrypted and secure. We never store your credit card details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;