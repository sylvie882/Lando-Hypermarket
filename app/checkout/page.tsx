'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Address, Cart } from '@/types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Check, CreditCard, Truck, Lock, Plus, Edit, Trash2, Tag, Phone, Smartphone, Globe } from 'lucide-react';
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('mpesa');
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('same_day');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  
  // M-Pesa specific fields
  const [mpesaPhoneNumber, setMpesaPhoneNumber] = useState('');
  
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
      const [cartRes, addressesRes] = await Promise.all([
        api.cart.get(),
        api.addresses.getAll()
      ]);

      setCart(cartRes.data.cart);
      setAddresses(addressesRes.data);

      // Set default address if available
      const defaultAddress = addressesRes.data.find((addr: Address) => addr.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      }

      // Set default phone number from user profile
      if (user?.phone) {
        setMpesaPhoneNumber(user.phone);
      }

      // Hardcoded payment methods for Kenya
      const kenyanPaymentMethods = [
        {
          id: 'mpesa',
          name: 'M-Pesa',
          description: 'Pay instantly via M-Pesa',
          icon: 'phone'
        },
        {
          id: 'card',
          name: 'Credit/Debit Card',
          description: 'Pay with Visa, Mastercard, or Amex',
          icon: 'credit-card'
        },
        {
          id: 'stripe',
          name: 'Stripe',
          description: 'Secure online payment',
          icon: 'globe'
        },
        {
          id: 'cod',
          name: 'Cash on Delivery',
          description: 'Pay when you receive your order',
          icon: 'cash'
        }
      ];

      setPaymentMethods(kenyanPaymentMethods);

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
        country: 'Kenya',
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
        toast.success(`Promo code applied! Discount: KSh ${discount.toFixed(0)}`);
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

    // Validate M-Pesa phone number if selected
    if (selectedPaymentMethod === 'mpesa' && !mpesaPhoneNumber) {
      toast.error('Please enter your M-Pesa phone number');
      return;
    }

    if (selectedPaymentMethod === 'mpesa' && !/^(07\d{8}|011\d{7}|\+2547\d{8})$/.test(mpesaPhoneNumber)) {
      toast.error('Please enter a valid Kenyan phone number (e.g., 07XXXXXXXX)');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        address_id: selectedAddressId,
        payment_method: selectedPaymentMethod,
        shipping_method: selectedShippingMethod,
        notes: deliveryNotes,
        carrier: selectedShippingMethod === 'same_day' ? 'Same Day Delivery' : 'Standard Carrier',
        ...(deliverySlot && { delivery_slot: deliverySlot }),
        ...(appliedPromo?.code && { promo_code: appliedPromo.code }),
        ...(selectedPaymentMethod === 'mpesa' && { mpesa_phone: mpesaPhoneNumber })
      };

      console.log('Placing order with data:', orderData);
      
      const response = await api.orders.create(orderData);
      console.log('Order response:', response.data);
      
      // Handle M-Pesa STK Push if selected
      if (selectedPaymentMethod === 'mpesa') {
        const { total } = calculateTotals();
        const mpesaResponse = await api.payments.mpesaStkPush({
          phone: mpesaPhoneNumber,
          amount: total,
          order_id: response.data.order.id
        });
        
        if (mpesaResponse.data.success) {
          toast.success('M-Pesa payment request sent! Check your phone to complete payment.');
        } else {
          toast.error('M-Pesa request failed. Please try again or choose another payment method.');
        }
      }
      
      toast.success('Order placed successfully!');
      
      // Redirect to order confirmation
      router.push(`/orders/${response.data.order.id}`);
    } catch (error: any) {
      console.error('Place order error:', error);
      
      if (error.response?.data?.errors) {
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

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
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
      case 'same_day':
        shipping = subtotal > 2000 ? 0 : 200; // Free delivery on orders above KSh 2000
        break;
      case 'standard':
        shipping = subtotal > 1500 ? 0 : 150; // Free delivery on orders above KSh 1500
        break;
      case 'express':
        shipping = 300;
        break;
      default:
        shipping = subtotal > 1500 ? 0 : 150;
    }
    
    const tax = subtotal * 0.16; // 16% VAT for Kenya
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
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
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
                            <p className="text-sm text-gray-600">{address.country}</p>
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
                          placeholder="07XXXXXXXX"
                          value={newAddress.contact_phone}
                          onChange={(e) => setNewAddress({...newAddress, contact_phone: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Address Line 1 *</label>
                        <input
                          type="text"
                          placeholder="Street address, building, estate"
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
                        <label className="block text-sm font-medium mb-1">City/Town *</label>
                        <input
                          type="text"
                          placeholder="Nairobi, Mombasa, Kisumu, etc."
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Area/County</label>
                        <input
                          type="text"
                          placeholder="Westlands, Kilimani, etc."
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Country</label>
                        <input
                          type="text"
                          value={newAddress.country}
                          disabled
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Postal Code</label>
                        <input
                          type="text"
                          placeholder="00100"
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
                      { 
                        id: 'same_day', 
                        name: 'Same Day Delivery', 
                        price: 200, 
                        timeframe: 'Today (Order before 2PM)', 
                        description: 'Free on orders over KSh 2,000',
                        freeThreshold: 2000
                      },
                      { 
                        id: 'standard', 
                        name: 'Standard', 
                        price: 150, 
                        timeframe: '2-4 business days', 
                        description: 'Free on orders over KSh 1,500',
                        freeThreshold: 1500
                      },
                      { 
                        id: 'express', 
                        name: 'Express', 
                        price: 300, 
                        timeframe: 'Next business day', 
                        description: 'Priority shipping',
                        freeThreshold: null
                      }
                    ].map((method) => {
                      const isFreeShipping = method.freeThreshold && subtotal >= method.freeThreshold;
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
                                formatCurrency(shippingPrice)
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{method.timeframe}</p>
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
                  {paymentMethods.map((method) => (
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
                            {method.icon === 'phone' ? (
                              <Phone size={24} className="text-green-600" />
                            ) : method.icon === 'credit-card' ? (
                              <CreditCard size={24} className="text-blue-600" />
                            ) : method.icon === 'globe' ? (
                              <Globe size={24} className="text-purple-600" />
                            ) : (
                              <CreditCard size={24} className="text-gray-600" />
                            )}
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
                      
                      {/* M-Pesa Phone Number Input */}
                      {selectedPaymentMethod === 'mpesa' && method.id === 'mpesa' && (
                        <div className="mt-4 pl-16">
                          <label className="block text-sm font-medium mb-2 text-gray-700">
                            M-Pesa Phone Number
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <input
                                type="text"
                                value={mpesaPhoneNumber}
                                onChange={(e) => setMpesaPhoneNumber(e.target.value)}
                                placeholder="07XXXXXXXX"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              />
                            </div>
                            <button
                              onClick={() => {
                                if (user?.phone) {
                                  setMpesaPhoneNumber(user.phone);
                                  toast.success('Phone number populated from profile');
                                }
                              }}
                              type="button"
                              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium whitespace-nowrap"
                            >
                              Use Profile Phone
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            You'll receive an M-Pesa STK Push to complete payment
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Payment Security Note */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                  <div className="flex items-start">
                    <Lock size={20} className="text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 mb-1">Secure Payment</p>
                      <p className="text-xs text-blue-600">
                        All payments are processed securely. We support M-Pesa, cards, and other secure payment methods. 
                        Your financial information is never stored on our servers.
                      </p>
                    </div>
                  </div>
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
                    disabled={!selectedPaymentMethod || (selectedPaymentMethod === 'mpesa' && !mpesaPhoneNumber)}
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
                          {selectedPaymentMethod === 'mpesa' ? (
                            <Phone size={24} className="mr-3 text-green-600" />
                          ) : selectedPaymentMethod === 'card' ? (
                            <CreditCard size={24} className="mr-3 text-blue-600" />
                          ) : (
                            <CreditCard size={24} className="mr-3 text-gray-600" />
                          )}
                          <div>
                            <p className="font-bold text-lg">
                              {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name || 'Cash on Delivery'}
                            </p>
                            <p className="text-gray-600">
                              {paymentMethods.find(m => m.id === selectedPaymentMethod)?.description || 'Pay when you receive your order'}
                            </p>
                            {selectedPaymentMethod === 'mpesa' && mpesaPhoneNumber && (
                              <p className="text-sm text-gray-700 mt-1">
                                Phone: {mpesaPhoneNumber}
                              </p>
                            )}
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
                            {selectedShippingMethod === 'same_day' ? 'Same Day Delivery' :
                             selectedShippingMethod === 'standard' ? 'Standard Shipping' : 'Express Shipping'}
                          </p>
                          <p className="text-gray-600">
                            {selectedShippingMethod === 'same_day' ? 'Today (Order before 2PM)' :
                             selectedShippingMethod === 'standard' ? '2-4 business days' : 'Next business day'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {shipping === 0 ? (
                              <span className="text-green-600">FREE</span>
                            ) : (
                              formatCurrency(shipping)
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
                              {item.quantity} × {formatCurrency(typeof item.price === 'number' ? item.price : parseFloat(item.price))}
                            </p>
                          </div>
                          <p className="font-bold text-lg">
                            {formatCurrency(item.quantity * (typeof item.price === 'number' ? item.price : parseFloat(item.price)))}
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
                              -{formatCurrency(appliedDiscount)}
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
                    disabled={isSubmitting || !selectedAddressId || !selectedPaymentMethod || (selectedPaymentMethod === 'mpesa' && !mpesaPhoneNumber)}
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
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? (
                      <span className="text-green-600 font-bold">FREE</span>
                    ) : (
                      formatCurrency(shipping)
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">VAT (16%)</span>
                  <span className="font-medium">{formatCurrency(tax)}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="font-medium">Discount</span>
                    <span className="font-bold">-{formatCurrency(appliedDiscount)}</span>
                  </div>
                )}
                <hr className="my-4" />
                <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                {selectedShippingMethod === 'same_day' && shipping === 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    🎉 You qualify for free same-day delivery!
                  </p>
                )}
                {selectedShippingMethod === 'same_day' && shipping > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Add {formatCurrency(2000 - subtotal)} more for free same-day delivery
                  </p>
                )}
                {selectedShippingMethod === 'standard' && shipping > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Add {formatCurrency(1500 - subtotal)} more for free standard delivery
                  </p>
                )}
              </div>

              {/* Security Note */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center mb-2">
                  <Lock size={16} className="text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Secure SSL Encryption</span>
                </div>
                <p className="text-xs text-gray-500">
                  Your payment information is encrypted and secure. We never store your payment details.
                </p>
              </div>

              {/* M-Pesa Note */}
              {selectedPaymentMethod === 'mpesa' && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 mt-4">
                  <div className="flex items-center mb-2">
                    <Phone size={16} className="text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">M-Pesa Payment</span>
                  </div>
                  <p className="text-xs text-green-700">
                    You'll receive an STK Push on {mpesaPhoneNumber}. Enter your M-Pesa PIN to complete payment.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;