'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Address, Cart } from '@/types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { 
  Check, CreditCard, Truck, Lock, Plus, Edit, Trash2, Tag, 
  Smartphone, Building, Wallet, DollarSign, SmartphoneIcon,
  ShieldCheck, Banknote, Globe, Smartphone as MobilePhone,
  Phone, Copy, CheckCircle, AlertCircle, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import PaymentMethodDetails from '@/components/payments/PaymentMethodDetails';

// Format currency to KSH
const formatKSH = (amount: number): string => {
  if (isNaN(amount) || amount <= 0) {
    return 'KSh 0';
  }
  
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// M-Pesa Till Details
const MPESA_TILL_NUMBER = '3080789';
const MPESA_TILL_NAME = 'HYPERMARKET LTD';

const CheckoutPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [showMpesaConfirmation, setShowMpesaConfirmation] = useState(false);
  const [mpesaConfirmed, setMpesaConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Form data
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('mpesa_till');
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('standard');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  
  // Payment method details
  const [paymentDetails, setPaymentDetails] = useState<any>({
    card_number: '',
    card_expiry: '',
    card_cvc: '',
    card_name: '',
    save_card: false,
    mpesa_phone: '',
    mpesa_till: MPESA_TILL_NUMBER,
    mpesa_transaction_ref: '',
    mpesa_amount_paid: '',
    stripe_token: '',
    paypal_order_id: '',
    google_pay_token: '',
    apple_pay_token: '',
    bank_name: '',
    account_number: '',
    routing_number: ''
  });

  // M-Pesa confirmation
  const [mpesaConfirmation, setMpesaConfirmation] = useState({
    transaction_reference: '',
    phone_number: '',
    amount_paid: '',
    confirming: false
  });

  // Payment processing
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
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

      // Load payment methods
      await loadPaymentMethods();
    } catch (error) {
      console.error('Failed to fetch checkout data:', error);
      toast.error('Failed to load checkout data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      setLoadingPaymentMethods(true);
      
      // For Kenya, use M-Pesa Till as primary method
      const kenyaPaymentMethods = [
        {
          id: 'mpesa_till',
          name: 'M-Pesa Till Number',
          description: 'Pay via M-Pesa Till No. 3080789',
          instructions: 'Go to M-Pesa, select Lipa Na M-Pesa, then Pay Bill, enter Till Number 3080789, and complete payment. Then click "I Have Paid" button.',
          available: true,
          supported_countries: ['KE'],
          icon: 'smartphone',
          till_number: MPESA_TILL_NUMBER,
          till_name: MPESA_TILL_NAME
        },
        {
          id: 'mpesa_stk',
          name: 'M-Pesa STK Push',
          description: 'Get payment request on your phone',
          instructions: 'Enter your M-Pesa registered phone number and you will receive a payment request',
          available: true,
          supported_countries: ['KE'],
          icon: 'mobile'
        },
        {
          id: 'cod',
          name: 'Cash on Delivery',
          description: 'Pay when you receive your order',
          instructions: 'Pay with cash to the delivery agent',
          available: true,
          supported_countries: ['KE'],
          icon: 'cash'
        },
        {
          id: 'credit_card',
          name: 'Credit/Debit Card',
          description: 'Pay with Visa or MasterCard',
          instructions: 'Secure card payment',
          available: true,
          supported_countries: ['KE'],
          icon: 'card'
        },
        {
          id: 'bank_transfer',
          name: 'Bank Transfer',
          description: 'Direct bank transfer',
          instructions: 'Transfer to our bank account (details provided after order)',
          available: true,
          supported_countries: ['KE'],
          icon: 'bank'
        }
      ];

      setPaymentMethods(kenyaPaymentMethods);
      setSelectedPaymentMethod('mpesa_till'); // Default to M-Pesa Till for Kenya
    } catch (error) {
      console.error('Failed to load payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setLoadingPaymentMethods(false);
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
      const subtotal = calculateTotals().subtotal;
      
      const response = await api.promotions.validate({
        code: promoCode,
        order_amount: subtotal
      });
      
      if (response.data.valid) {
        setAppliedPromo(response.data.promotion);
        
        let discount = 0;
        const promo = response.data.promotion;
        if (promo.type === 'percentage') {
          discount = subtotal * (promo.discount_value / 100);
          if (promo.max_discount_amount && discount > promo.max_discount_amount) {
            discount = promo.max_discount_amount;
          }
        } else if (promo.type === 'fixed_amount') {
          discount = promo.discount_value;
        }
        
        setAppliedDiscount(discount);
        toast.success(`Promo code applied! Discount: ${formatKSH(discount)}`);
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  const initializeStripePayment = async () => {
    try {
      if (!cart) return;
      
      const { total } = calculateTotals();
      
      const response = await api.payments.createPaymentIntent({
        order_id: cart.id,
        amount: total,
        currency: 'KES',
        payment_method_types: ['card']
      });
      
      setPaymentIntent(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
      toast.error('Failed to initialize payment');
      throw error;
    }
  };

  const processPayment = async (orderId: number) => {
    if (!selectedPaymentMethod) {
      throw new Error('Please select a payment method');
    }

    const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
    if (!selectedMethod) {
      throw new Error('Invalid payment method');
    }

    // Validate payment details based on method
    switch (selectedPaymentMethod) {
      case 'mpesa_till':
        // No validation needed for till - user pays manually
        break;
      case 'mpesa_stk':
        if (!paymentDetails.mpesa_phone) {
          throw new Error('Please enter your M-Pesa phone number');
        }
        break;
      case 'credit_card':
      case 'debit_card':
        if (!paymentDetails.card_number || !paymentDetails.card_expiry || !paymentDetails.card_cvc || !paymentDetails.card_name) {
          throw new Error('Please enter all card details');
        }
        break;
      case 'bank_transfer':
        if (!paymentDetails.bank_name || !paymentDetails.account_number) {
          throw new Error('Please enter bank details');
        }
        break;
    }

    // Prepare payment details
    const paymentDetailsPayload: any = { ...paymentDetails };
    
    // Add method-specific details
    if (selectedPaymentMethod === 'mpesa_stk') {
      paymentDetailsPayload.phone_number = paymentDetails.mpesa_phone;
    }

    if (selectedPaymentMethod === 'mpesa_till') {
      paymentDetailsPayload.till_number = MPESA_TILL_NUMBER;
    }

    if (selectedPaymentMethod === 'credit_card' || selectedPaymentMethod === 'debit_card') {
      paymentDetailsPayload.payment_method_id = paymentIntent?.payment_intent_id;
    }

    try {
      const response = await api.payments.processPayment(orderId, {
        payment_method: selectedPaymentMethod,
        payment_details: paymentDetailsPayload,
        currency: 'KES'
      });

      return response.data;
    } catch (error: any) {
      console.error('Payment processing error:', error);
      throw new Error(error.response?.data?.message || 'Payment processing failed');
    }
  };

  // Confirm M-Pesa payment manually
  const confirmMpesaPayment = async () => {
    if (!mpesaConfirmation.transaction_reference.trim()) {
      toast.error('Please enter the M-Pesa transaction reference');
      return;
    }

    if (!mpesaConfirmation.phone_number.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    if (!mpesaConfirmation.amount_paid || parseFloat(mpesaConfirmation.amount_paid) <= 0) {
      toast.error('Please enter the amount paid');
      return;
    }

    if (!currentOrderId) {
      toast.error('Order not found');
      return;
    }

    setMpesaConfirmation(prev => ({ ...prev, confirming: true }));

    try {
      const response = await api.payments.confirmMpesaPayment(currentOrderId, {
        transaction_reference: mpesaConfirmation.transaction_reference,
        phone_number: mpesaConfirmation.phone_number,
        amount_paid: parseFloat(mpesaConfirmation.amount_paid)
      });

      setMpesaConfirmed(true);
      toast.success('Payment confirmed successfully! Redirecting to order...');
      
      // Redirect to order page after 2 seconds
      setTimeout(() => {
        router.push(`/orders/${currentOrderId}`);
      }, 2000);

    } catch (error: any) {
      console.error('M-Pesa confirmation error:', error);
      toast.error(error.response?.data?.message || 'Failed to confirm payment. Please try again.');
    } finally {
      setMpesaConfirmation(prev => ({ ...prev, confirming: false }));
    }
  };

  // Update these functions in your CheckoutPage.tsx

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
  setProcessingPayment(true);

  try {
    // First, create the order
    const orderData = {
      address_id: selectedAddressId,
      payment_method: selectedPaymentMethod,
      shipping_method: selectedShippingMethod,
      notes: deliveryNotes,
      carrier: 'Lando Delivery',
      ...(deliverySlot && { delivery_slot: deliverySlot }),
      ...(appliedPromo?.code && { promo_code: appliedPromo.code })
    };

    console.log('Placing order with data:', orderData);
    
    const orderResponse = await api.orders.create(orderData);
    
    // IMPORTANT: Make sure we're getting the order ID correctly
    // Check different possible response structures
    let orderId: number | null = null;
    let order: any = null;
    
    if (orderResponse.data?.order?.id) {
      orderId = orderResponse.data.order.id;
      order = orderResponse.data.order;
    } else if (orderResponse.data?.id) {
      orderId = orderResponse.data.id;
      order = orderResponse.data;
    } else if (orderResponse.data?.data?.id) {
      orderId = orderResponse.data.data.id;
      order = orderResponse.data.data;
    }
    
    if (!orderId) {
      throw new Error('Could not get order ID from response');
    }
    
    console.log('Order created with ID:', orderId);
    
    // Set the order ID in state immediately
    setCurrentOrderId(orderId);
    setOrderData(order);

    // For M-Pesa Till (manual payment)
    if (selectedPaymentMethod === 'mpesa_till') {
      try {
        // Process payment to create pending record
        const paymentResult = await processPayment(orderId);
        console.log('Payment processing result:', paymentResult);
        
        toast.success('Order created! Please complete M-Pesa payment and confirm.');
        
        // Show M-Pesa confirmation form
        setShowMpesaConfirmation(true);
        setStep(3); // Go to review step but show confirmation
        
        // Don't redirect - stay on page to show confirmation form
        return;
      } catch (paymentError: any) {
        console.error('Payment processing failed:', paymentError);
        toast.error(`Payment processing failed: ${paymentError.message}`);
        // Still show confirmation form? Or redirect?
        setShowMpesaConfirmation(true);
        setStep(3);
        return;
      }
    }

    // For M-Pesa STK Push
    if (selectedPaymentMethod === 'mpesa_stk') {
      try {
        const paymentResult = await processPayment(orderId);
        console.log('Payment result:', paymentResult);
        
        if (paymentResult?.mpesa_details) {
          toast.success('STK push sent! Please check your phone and enter PIN to complete payment.');
          router.push(`/orders/${orderId}`);
        } else {
          toast.success('Order placed successfully! Payment initiated.');
          router.push(`/orders/${orderId}`);
        }
      } catch (paymentError: any) {
        console.error('Payment failed:', paymentError);
        toast.error(`Payment failed: ${paymentError.message}`);
        router.push(`/orders/${orderId}`);
      }
    }
    // Cash on Delivery
    else if (selectedPaymentMethod === 'cod') {
      toast.success('Order placed successfully! Pay on delivery.');
      router.push(`/orders/${orderId}`);
    }
    // Other payment methods
    else {
      try {
        const paymentResult = await processPayment(orderId);
        console.log('Payment result:', paymentResult);
        
        toast.success('Order placed successfully! Payment completed.');
        router.push(`/orders/${orderId}`);
      } catch (paymentError: any) {
        console.error('Payment failed:', paymentError);
        toast.error(`Order placed but payment failed: ${paymentError.message}`);
        router.push(`/orders/${orderId}`);
      }
    }
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
    setProcessingPayment(false);
  }
};

// Also add this useEffect to log when currentOrderId changes
useEffect(() => {
  console.log('currentOrderId changed:', currentOrderId);
}, [currentOrderId]);



  const handlePaymentMethodChange = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    setShowPaymentForm(true);
    
    // Initialize payment if needed
    const method = paymentMethods.find(m => m.id === methodId);
    if (method && (method.id === 'credit_card' || method.id === 'debit_card')) {
      initializeStripePayment();
    }
  };

  const getPaymentMethodIcon = (methodId: string) => {
    switch (methodId) {
      case 'credit_card':
      case 'debit_card':
        return <CreditCard size={24} className="text-blue-600" />;
      case 'paypal':
        return <Globe size={24} className="text-blue-500" />;
      case 'google_pay':
        return <SmartphoneIcon size={24} className="text-blue-400" />;
      case 'apple_pay':
        return <MobilePhone size={24} className="text-gray-800" />;
      case 'mpesa_till':
        return <Smartphone size={24} className="text-green-600" />;
      case 'mpesa_stk':
        return <Phone size={24} className="text-green-500" />;
      case 'stripe':
        return <ShieldCheck size={24} className="text-purple-600" />;
      case 'bank_transfer':
        return <Building size={24} className="text-indigo-600" />;
      case 'cod':
        return <Banknote size={24} className="text-orange-600" />;
      default:
        return <CreditCard size={24} className="text-gray-600" />;
    }
  };

  const getPaymentMethodDescription = (methodId: string) => {
    switch (methodId) {
      case 'credit_card':
        return 'Pay with Visa, MasterCard, American Express';
      case 'debit_card':
        return 'Pay directly from your bank account';
      case 'paypal':
        return 'Secure payment with PayPal';
      case 'google_pay':
        return 'Fast checkout with Google Pay';
      case 'apple_pay':
        return 'Secure payment with Apple Pay';
      case 'mpesa_till':
        return `Pay via M-Pesa Till No. ${MPESA_TILL_NUMBER}`;
      case 'mpesa_stk':
        return 'Get payment request on your phone';
      case 'stripe':
        return 'Secure payment via Stripe';
      case 'bank_transfer':
        return 'Direct bank transfer (1-3 business days)';
      case 'cod':
        return 'Pay with cash when you receive your order';
      default:
        return 'Select to view payment details';
    }
  };

  const calculateTotals = () => {
    if (!cart) return { subtotal: 0, shipping: 0, tax: 0, total: 0 };
    
    const subtotal = cart.items.reduce((sum, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price);
      const quantity = Number(item.quantity);
      return sum + (price * quantity);
    }, 0);
    
    // FREE SHIPPING on all orders - NO SHIPPING COST
    const shipping = 0;
    
    // NO TAX
    const tax = 0;
    
    const total = subtotal - appliedDiscount;
    
    return { subtotal, shipping, tax, total };
  };

  const getShippingMethodDetails = () => {
    switch (selectedShippingMethod) {
      case 'standard':
        return { name: 'Standard Delivery', days: '3-5 business days', description: 'Free delivery' };
      case 'express':
        return { name: 'Express Delivery', days: '1-2 business days', description: 'Priority delivery' };
      case 'overnight':
        return { name: 'Overnight Delivery', days: 'Next business day', description: 'Guaranteed next day' };
      default:
        return { name: 'Standard Delivery', days: '3-5 business days', description: 'Free delivery' };
    }
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
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 font-medium"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const { subtotal, shipping, tax, total } = calculateTotals();
  const shippingDetails = getShippingMethodDetails();

  const steps = [
    { number: 1, title: 'Address', icon: <Truck size={20} /> },
    { number: 2, title: 'Payment', icon: <CreditCard size={20} /> },
    { number: 3, title: 'Review', icon: <Check size={20} /> }
  ];

  // M-Pesa Confirmation UI
  const renderMpesaConfirmation = () => (
    <div className="mt-8 p-6 border-2 border-green-200 rounded-xl bg-green-50">
      <div className="flex items-center mb-4">
        <Smartphone size={28} className="text-green-600 mr-3" />
        <h3 className="text-xl font-bold text-green-800">Confirm M-Pesa Payment</h3>
      </div>
      
      <div className="mb-6 p-4 bg-white rounded-lg border border-green-200">
        <p className="text-sm text-gray-600 mb-2">M-Pesa Till Details:</p>
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Till Number:</span>
          <div className="flex items-center">
            <span className="font-bold text-lg text-green-700 mr-2">{MPESA_TILL_NUMBER}</span>
            <button
              onClick={() => copyToClipboard(MPESA_TILL_NUMBER)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Copy size={18} className="text-gray-500" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Business Name:</span>
          <span className="font-bold">{MPESA_TILL_NAME}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Amount to Pay:</span>
          <span className="font-bold text-lg text-orange-600">{formatKSH(total)}</span>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
          <AlertCircle size={18} className="mr-2" />
          How to Pay:
        </h4>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
          <li>Go to M-Pesa on your phone</li>
          <li>Select <span className="font-bold">Lipa Na M-Pesa</span></li>
          <li>Select <span className="font-bold">Pay Bill</span></li>
          <li>Enter Till Number: <span className="font-bold">{MPESA_TILL_NUMBER}</span></li>
          <li>Enter Amount: <span className="font-bold">{formatKSH(total)}</span></li>
          <li>Enter your M-Pesa PIN and complete payment</li>
          <li>Enter the transaction reference below to confirm</li>
        </ol>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            M-Pesa Transaction Reference *
          </label>
          <input
            type="text"
            placeholder="e.g., PPI8T3KQ7L"
            value={mpesaConfirmation.transaction_reference}
            onChange={(e) => setMpesaConfirmation({...mpesaConfirmation, transaction_reference: e.target.value.toUpperCase()})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            This is the reference number you received from M-Pesa after payment
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            M-Pesa Phone Number *
          </label>
          <input
            type="tel"
            placeholder="0712345678"
            value={mpesaConfirmation.phone_number}
            onChange={(e) => setMpesaConfirmation({...mpesaConfirmation, phone_number: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Amount Paid *
          </label>
          <input
            type="number"
            placeholder="Enter amount paid"
            value={mpesaConfirmation.amount_paid}
            onChange={(e) => setMpesaConfirmation({...mpesaConfirmation, amount_paid: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {!mpesaConfirmed ? (
          <button
            onClick={confirmMpesaPayment}
            disabled={mpesaConfirmation.confirming}
            className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-bold text-lg flex items-center justify-center"
          >
            {mpesaConfirmation.confirming ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle size={20} className="mr-2" />
                I Have Paid - Confirm Payment
              </>
            )}
          </button>
        ) : (
          <div className="p-4 bg-green-100 border border-green-300 rounded-lg flex items-center">
            <CheckCircle size={24} className="text-green-600 mr-2" />
            <div>
              <p className="font-bold text-green-800">Payment Confirmed!</p>
              <p className="text-sm text-green-700">Redirecting to your order...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

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
                          type="tel"
                          placeholder="07XX XXX XXX"
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
                          placeholder="e.g., Nairobi"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">State/County</label>
                        <input
                          type="text"
                          placeholder="e.g., Nairobi County"
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
                      { id: 'standard', name: 'Standard', days: '3-5 business days', description: 'Free delivery' },
                      { id: 'express', name: 'Express', days: '1-2 business days', description: 'Priority delivery' },
                      { id: 'overnight', name: 'Overnight', days: 'Next business day', description: 'Guaranteed next day' }
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
                
                {loadingPaymentMethods ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner size="md" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-8">
                      {paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          onClick={() => handlePaymentMethodChange(method.id)}
                          className={`p-6 border-2 rounded-xl cursor-pointer transition-all group ${
                            selectedPaymentMethod === method.id
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-gray-200 transition-colors">
                                {getPaymentMethodIcon(method.id)}
                              </div>
                              <div>
                                <h3 className="font-bold text-lg">{method.name}</h3>
                                <p className="text-gray-600">{method.description}</p>
                                {method.instructions && (
                                  <p className="text-sm text-gray-500 mt-1">{method.instructions}</p>
                                )}
                                {method.id === 'mpesa_till' && (
                                  <div className="mt-2 flex items-center">
                                    <span className="text-sm font-medium text-green-700 mr-2">
                                      Till: {MPESA_TILL_NUMBER}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(MPESA_TILL_NUMBER);
                                      }}
                                      className="p-1 hover:bg-gray-100 rounded"
                                    >
                                      <Copy size={16} className="text-gray-500" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {selectedPaymentMethod === method.id && (
                                <Check className="text-orange-500" size={24} />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Payment Details Form */}
                    {/* Payment Details Form */}
                    {showPaymentForm && selectedPaymentMethod && (
                      <div className="mb-8">
                        <PaymentMethodDetails
                          methodId={selectedPaymentMethod}
                          paymentDetails={paymentDetails}
                          onPaymentDetailsChange={setPaymentDetails}
                          totalAmount={total}
                          currency="KES"
                          paymentIntent={paymentIntent}
                          userCountry={user?.country}
                          onSubmit={() => setStep(3)}
                          // REMOVE these lines:
                          // mpesaTillNumber={MPESA_TILL_NUMBER}
                          // mpesaTillName={MPESA_TILL_NAME}
                        />
                      </div>
                    )}

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
                  </>
                )}
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
                          {getPaymentMethodIcon(selectedPaymentMethod)}
                          <div className="ml-3">
                            <p className="font-bold text-lg">
                              {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}
                            </p>
                            <p className="text-gray-600">
                              {getPaymentMethodDescription(selectedPaymentMethod)}
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
                      
                      {/* Show payment details summary */}
                      {selectedPaymentMethod === 'mpesa_till' && (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm font-medium text-green-800 mb-2">
                            M-Pesa Till Payment:
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span>Till Number:</span>
                            <div className="flex items-center">
                              <span className="font-bold">{MPESA_TILL_NUMBER}</span>
                              <button
                                onClick={() => copyToClipboard(MPESA_TILL_NUMBER)}
                                className="ml-2 p-1 hover:bg-green-100 rounded"
                              >
                                <Copy size={14} className="text-green-700" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm mt-1">
                            <span>Amount:</span>
                            <span className="font-bold">{formatKSH(total)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shipping Method */}
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
                      {cart.items.map((item) => {
                        const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price);
                        const itemTotal = item.quantity * itemPrice;
                        return (
                          <div key={item.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex-1">
                              <p className="font-bold text-lg">{item.product?.name || 'Product'}</p>
                              <p className="text-gray-600">
                                {item.quantity} × {formatKSH(itemPrice)}
                              </p>
                            </div>
                            <p className="font-bold text-lg">
                              {formatKSH(itemTotal)}
                            </p>
                          </div>
                        );
                      })}
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
                              -{formatKSH(appliedDiscount)}
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

                  {/* M-Pesa Confirmation Form */}
                  {showMpesaConfirmation && selectedPaymentMethod === 'mpesa_till' && renderMpesaConfirmation()}
                </div>

                {/* Navigation - Only show if not showing M-Pesa confirmation */}
                {!showMpesaConfirmation && (
                  <div className="mt-8 flex justify-between">
                    <button
                      onClick={() => setStep(2)}
                      className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={isSubmitting || !selectedAddressId || !selectedPaymentMethod || processingPayment}
                      className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
                    >
                      <Lock size={20} className="mr-2" />
                      {processingPayment ? (
                        <span className="flex items-center">
                          <LoadingSpinner size="sm" className="mr-2" />
                          Processing...
                        </span>
                      ) : isSubmitting ? 'Placing Order...' : 'Place Order'}
                    </button>
                  </div>
                )}
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
                  <p className="text-sm text-green-700 font-medium">
                    🎉 Free shipping on all orders!
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    No hidden charges • No VAT
                  </p>
                </div>
              </div>

              {/* Security Note */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <ShieldCheck size={16} className="text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Secure SSL Encryption</span>
                </div>
                <p className="text-xs text-gray-500">
                  Your payment information is encrypted and secure. We never store your payment details.
                </p>
              </div>
              
              {/* Need Help */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 mb-2">
                  <span className="font-medium">Need help?</span> Call our support team
                </p>
                <p className="text-lg font-bold text-blue-800">+254 716 354 589</p>
              </div>

              {/* M-Pesa Till Reminder */}
              {selectedPaymentMethod === 'mpesa_till' && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center mb-2">
                    <Smartphone size={18} className="text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-700">M-Pesa Till:</span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2 rounded border border-green-200">
                    <span className="font-bold text-lg">{MPESA_TILL_NUMBER}</span>
                    <button
                      onClick={() => copyToClipboard(MPESA_TILL_NUMBER)}
                      className="p-1 hover:bg-green-100 rounded"
                    >
                      <Copy size={18} className="text-green-600" />
                    </button>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    After payment, click "I Have Paid" button to confirm
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