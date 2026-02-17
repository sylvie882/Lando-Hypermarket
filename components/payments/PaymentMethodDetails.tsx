'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Building, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { mpesaService } from '@/lib/mpesa';
import toast from 'react-hot-toast';

interface PaymentMethodDetailsProps {
  methodId: string;
  paymentDetails: any;
  onPaymentDetailsChange: (details: any) => void;
  totalAmount: number;
  currency: string;
  paymentIntent?: any;
  userCountry?: string;
  onSubmit?: () => void;
  orderId?: number;
}

const PaymentMethodDetails: React.FC<PaymentMethodDetailsProps> = ({
  methodId,
  paymentDetails,
  onPaymentDetailsChange,
  totalAmount,
  currency,
  paymentIntent,
  userCountry,
  onSubmit,
  orderId
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-detect user's phone if available
  useEffect(() => {
    if (methodId === 'mpesa' || methodId === 'mpesa_till') {
      // If user has a phone number in their profile, pre-fill it
      if (user?.phone && !paymentDetails.mpesa_phone) {
        onPaymentDetailsChange({
          ...paymentDetails,
          mpesa_phone: user.phone
        });
      }
    }
  }, [methodId, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    // Format phone number for M-Pesa
    if (name === 'mpesa_phone') {
      const formatted = formatPhoneNumber(value);
      onPaymentDetailsChange({
        ...paymentDetails,
        [name]: formatted
      });
    } else {
      onPaymentDetailsChange({
        ...paymentDetails,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-numeric characters
    let numeric = value.replace(/\D/g, '');
    
    // Limit to 12 characters (254 + 9 digits)
    if (numeric.length > 12) {
      numeric = numeric.slice(0, 12);
    }
    
    return numeric;
  };

  const validateMpesaPhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    
    // Check for valid Kenyan number formats
    if (/^(2547|2541)\d{8}$/.test(cleaned)) {
      return true; // 254712345678 format
    }
    
    if (/^(07|01)\d{8}$/.test(cleaned)) {
      return true; // 0712345678 format
    }
    
    if (/^7\d{8}$/.test(cleaned) && cleaned.length === 9) {
      return true; // 712345678 format (will be converted)
    }
    
    return false;
  };

  const formatDisplayPhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('254') && cleaned.length === 12) {
      // Format: 254 712 345678
      return `254 ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      // Format: 07XX XXX XXX
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    
    return phone;
  };

  const handleMpesaPayment = async () => {
    // Clear previous error
    setErrorMessage('');

    // Validate phone number
    if (!paymentDetails.mpesa_phone) {
      setErrorMessage('Please enter your M-Pesa phone number');
      toast.error('Please enter your M-Pesa phone number');
      return;
    }

    if (!validateMpesaPhone(paymentDetails.mpesa_phone)) {
      setErrorMessage('Please enter a valid Kenyan phone number (e.g., 0712345678)');
      toast.error('Please enter a valid Kenyan phone number');
      return;
    }

    if (!orderId) {
      setErrorMessage('Order ID is missing. Please try again.');
      toast.error('Order ID is missing');
      return;
    }

    setLoading(true);
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Please login to continue');
        setPaymentStatus('error');
        setLoading(false);
        return;
      }

      // Format phone to international format (254XXXXXXXXX)
      let phoneNumber = paymentDetails.mpesa_phone.replace(/\D/g, '');
      
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '254' + phoneNumber.substring(1);
      } else if (phoneNumber.startsWith('7') || phoneNumber.startsWith('1')) {
        phoneNumber = '254' + phoneNumber;
      }

      // Ensure it's exactly 12 digits
      if (phoneNumber.length > 12) {
        phoneNumber = phoneNumber.substring(0, 12);
      }

      console.log('Initiating M-Pesa payment:', {
        phone: phoneNumber,
        amount: totalAmount,
        orderId: orderId
      });

      const result = await mpesaService.initiateSTKPush({
        phoneNumber: phoneNumber,
        amount: totalAmount,
        orderId: orderId,
        tillNumber: paymentDetails.mpesa_till || '174379'
      }, token);

      console.log('M-Pesa result:', result);

      if (result.success) {
        setPaymentStatus('success');
        
        // Show success message with phone format
        const displayPhone = formatDisplayPhone(paymentDetails.mpesa_phone);
        toast.success(
          <div>
            <p className="font-bold">✓ STK Push Sent!</p>
            <p className="text-sm">Check {displayPhone} and enter your PIN</p>
          </div>,
          { duration: 10000 }
        );
        
        // Store transaction ID in payment details
        onPaymentDetailsChange({
          ...paymentDetails,
          transaction_id: result.transaction_id,
          mpesa_response: result.response_data
        });
        
        if (onSubmit) {
          // Wait a moment before proceeding to next step
          setTimeout(() => {
            onSubmit();
          }, 3000);
        }
      } else {
        setPaymentStatus('error');
        setErrorMessage(result.message || 'M-Pesa payment failed');
        toast.error(result.message || 'M-Pesa payment failed');
      }
    } catch (error: any) {
      console.error('M-Pesa payment error:', error);
      setPaymentStatus('error');
      const errorMsg = error.message || 'Failed to process M-Pesa payment';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderCreditCardForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Cardholder Name</label>
        <input
          type="text"
          name="card_name"
          value={paymentDetails.card_name || ''}
          onChange={handleInputChange}
          placeholder="John Doe"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Card Number</label>
        <input
          type="text"
          name="card_number"
          value={paymentDetails.card_number || ''}
          onChange={handleInputChange}
          placeholder="1234 5678 9012 3456"
          maxLength={19}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Expiry Date</label>
          <input
            type="text"
            name="card_expiry"
            value={paymentDetails.card_expiry || ''}
            onChange={handleInputChange}
            placeholder="MM/YY"
            maxLength={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">CVV</label>
          <input
            type="text"
            name="card_cvc"
            value={paymentDetails.card_cvc || ''}
            onChange={handleInputChange}
            placeholder="123"
            maxLength={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            required
          />
        </div>
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          id="save_card"
          name="save_card"
          checked={paymentDetails.save_card || false}
          onChange={handleInputChange}
          className="h-5 w-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
        />
        <label htmlFor="save_card" className="ml-2 text-sm text-gray-700">
          Save card for future purchases
        </label>
      </div>
    </div>
  );

  const renderMpesaTillForm = () => (
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
        <div className="flex items-center mb-2">
          <Smartphone size={20} className="text-green-600 mr-2" />
          <span className="text-sm font-medium text-green-800">M-Pesa Payment</span>
        </div>
        <p className="text-sm text-green-700">
          You'll receive an STK push on your phone. Enter your M-Pesa PIN to complete payment.
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          M-Pesa Phone Number <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="tel"
            name="mpesa_phone"
            value={paymentDetails.mpesa_phone || ''}
            onChange={handleInputChange}
            placeholder="0712345678"
            className={`w-full px-4 py-3 pl-12 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
              errorMessage ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            required
            disabled={loading || paymentStatus === 'processing'}
          />
          <Smartphone className="absolute left-3 top-3.5 text-gray-400" size={20} />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Enter your Safaricom phone number (e.g., 0712345678)
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Till Number</label>
        <input
          type="text"
          name="mpesa_till"
          value={paymentDetails.mpesa_till || '174379'}
          onChange={handleInputChange}
          placeholder="174379"
          maxLength={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
          disabled={true}
        />
        <p className="text-xs text-gray-500 mt-1">Using Lando Hypermarket till number</p>
      </div>

      {/* Amount Display */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Amount to pay:</span>
          <span className="text-2xl font-bold text-green-600">
            KSh {totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 flex items-center">
            <AlertCircle size={16} className="mr-2 flex-shrink-0" />
            {errorMessage}
          </p>
        </div>
      )}

      {/* Payment Button */}
      <button
        type="button"
        onClick={handleMpesaPayment}
        disabled={loading || paymentStatus === 'processing' || !paymentDetails.mpesa_phone}
        className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-all shadow-lg"
      >
        {loading || paymentStatus === 'processing' ? (
          <>
            <Loader className="animate-spin" size={20} />
            <span>Sending STK Push...</span>
          </>
        ) : paymentStatus === 'success' ? (
          <>
            <CheckCircle size={20} />
            <span>Payment Initiated ✓</span>
          </>
        ) : (
          <>
            <Smartphone size={20} />
            <span>Pay with M-Pesa</span>
          </>
        )}
      </button>

      {/* Success Message */}
      {paymentStatus === 'success' && (
        <div className="p-4 bg-green-100 border border-green-300 rounded-lg animate-pulse">
          <div className="flex items-center mb-2">
            <CheckCircle size={20} className="text-green-600 mr-2" />
            <p className="font-medium text-green-800">STK Push Sent!</p>
          </div>
          <p className="text-sm text-green-700">
            Please check your phone <span className="font-bold">{formatDisplayPhone(paymentDetails.mpesa_phone)}</span> and enter your M-Pesa PIN to complete the payment.
          </p>
          <p className="text-xs text-green-600 mt-2">
            Waiting for confirmation...
          </p>
        </div>
      )}

      {/* Processing State */}
      {paymentStatus === 'processing' && !errorMessage && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <Loader className="animate-spin text-blue-600 mr-2" size={18} />
            <p className="text-sm text-blue-700">
              Sending payment request to your phone...
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500 space-y-1 border-t pt-4">
        <p className="flex items-center">
          <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full inline-flex items-center justify-center mr-2 text-xs">1</span>
          Enter your M-Pesa registered phone number
        </p>
        <p className="flex items-center">
          <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full inline-flex items-center justify-center mr-2 text-xs">2</span>
          Click "Pay with M-Pesa" button
        </p>
        <p className="flex items-center">
          <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full inline-flex items-center justify-center mr-2 text-xs">3</span>
          Check your phone for STK push notification
        </p>
        <p className="flex items-center">
          <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full inline-flex items-center justify-center mr-2 text-xs">4</span>
          Enter your M-Pesa PIN to complete payment
        </p>
      </div>
    </div>
  );

  const renderPayPalForm = () => (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          You will be redirected to PayPal to complete your payment securely.
        </p>
      </div>
      <button
        type="button"
        onClick={onSubmit}
        className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium flex items-center justify-center"
      >
        <span>Continue with PayPal</span>
      </button>
    </div>
  );

  const renderGooglePayForm = () => (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg border">
        <p className="text-sm text-gray-700">
          Google Pay will open to complete your payment securely.
        </p>
      </div>
      <button
        type="button"
        onClick={onSubmit}
        className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium flex items-center justify-center"
      >
        <span>Pay with Google Pay</span>
      </button>
    </div>
  );

  const renderApplePayForm = () => (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg border">
        <p className="text-sm text-gray-700">
          Apple Pay will open to complete your payment securely.
        </p>
      </div>
      <button
        type="button"
        onClick={onSubmit}
        className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium flex items-center justify-center"
      >
        <span>Pay with Apple Pay</span>
      </button>
    </div>
  );

  const renderBankTransferForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Bank Name</label>
        <input
          type="text"
          name="bank_name"
          value={paymentDetails.bank_name || ''}
          onChange={handleInputChange}
          placeholder="e.g., Equity Bank, KCB"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Account Number</label>
        <input
          type="text"
          name="account_number"
          value={paymentDetails.account_number || ''}
          onChange={handleInputChange}
          placeholder="Your account number"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      </div>
      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Bank transfers take 1-3 business days to process. 
          Your order will be processed once payment is confirmed.
        </p>
      </div>
    </div>
  );

  const renderCODDetails = () => (
    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
      <p className="text-green-800">
        Pay with cash when your order is delivered. Please have exact change ready.
      </p>
    </div>
  );

  const renderMethodDetails = () => {
    switch (methodId) {
      case 'credit_card':
      case 'debit_card':
      case 'stripe':
        return renderCreditCardForm();
      case 'mpesa':
      case 'mpesa_till':
        return renderMpesaTillForm();
      case 'paypal':
        return renderPayPalForm();
      case 'google_pay':
        return renderGooglePayForm();
      case 'apple_pay':
        return renderApplePayForm();
      case 'bank_transfer':
        return renderBankTransferForm();
      case 'cod':
        return renderCODDetails();
      default:
        return null;
    }
  };

  return (
    <div className="p-6 border-2 border-gray-200 rounded-xl bg-white shadow-sm">
      <h3 className="font-bold text-lg mb-4 flex items-center">
        {methodId === 'mpesa' && <Smartphone className="mr-2 text-green-600" size={20} />}
        {methodId === 'credit_card' && <CreditCard className="mr-2 text-orange-600" size={20} />}
        {methodId === 'bank_transfer' && <Building className="mr-2 text-indigo-600" size={20} />}
        Payment Details
      </h3>
      
      <div className="space-y-4">
        {renderMethodDetails()}
        
        {methodId !== 'cod' && methodId !== 'mpesa' && methodId !== 'mpesa_till' && (
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <span className="text-gray-700 font-medium">Total Amount:</span>
            <span className="text-2xl font-bold text-gray-900">
              {currency} {totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodDetails;