'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, AlertCircle, Loader, CheckCircle } from 'lucide-react';
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
  onSubmit,
  orderId,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Pre-fill phone from user profile
  useEffect(() => {
    if (user?.phone && !paymentDetails.mpesa_phone) {
      onPaymentDetailsChange({ ...paymentDetails, mpesa_phone: user.phone });
    }
  }, [user]);

  // ─── Phone helpers ────────────────────────────────────────────────────────

  const sanitizePhone = (value: string): string => {
    let numeric = value.replace(/\D/g, '');
    if (numeric.length > 12) numeric = numeric.slice(0, 12);
    return numeric;
  };

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return (
      /^(2547|2541)\d{8}$/.test(cleaned) ||
      /^(07|01)\d{8}$/.test(cleaned) ||
      (/^[71]\d{8}$/.test(cleaned) && cleaned.length === 9)
    );
  };

  const toE164 = (phone: string): string => {
    let n = phone.replace(/\D/g, '');
    if (n.startsWith('0'))  n = '254' + n.slice(1);
    if (n.startsWith('7') || n.startsWith('1')) n = '254' + n;
    if (n.length > 12) n = n.slice(0, 12);
    return n;
  };

  const formatDisplay = (phone: string): string => {
    const c = phone.replace(/\D/g, '');
    if (c.startsWith('254') && c.length === 12)
      return `${c.slice(0, 3)} ${c.slice(3, 6)} ${c.slice(6)}`;
    if (c.startsWith('0') && c.length === 10)
      return `${c.slice(0, 4)} ${c.slice(4, 7)} ${c.slice(7)}`;
    return phone;
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPaymentDetailsChange({
      ...paymentDetails,
      mpesa_phone: sanitizePhone(e.target.value),
    });
  };

  const handleMpesaPayment = async () => {
    setErrorMessage('');

    if (!paymentDetails.mpesa_phone) {
      setErrorMessage('Please enter your M-Pesa phone number');
      toast.error('Please enter your M-Pesa phone number');
      return;
    }
    if (!validatePhone(paymentDetails.mpesa_phone)) {
      setErrorMessage('Enter a valid Safaricom number (e.g. 0712 345 678)');
      toast.error('Invalid phone number');
      return;
    }
    if (!orderId) {
      setErrorMessage('Order ID is missing. Please try again.');
      toast.error('Order ID is missing');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      toast.error('Please login to continue');
      return;
    }

    setLoading(true);
    setPaymentStatus('processing');

    try {
      const phoneNumber = toE164(paymentDetails.mpesa_phone);

      const result = await mpesaService.initiateSTKPush(
        {
          phoneNumber,
          amount: totalAmount,
          orderId,
          tillNumber: '174379',
        },
        token,
      );

      if (result.success) {
        setPaymentStatus('success');
        onPaymentDetailsChange({
          ...paymentDetails,
          transaction_id:  result.transaction_id,
          mpesa_response:  result.response_data,
          phone_number:    phoneNumber,
        });

        toast.success(
          <div>
            <p className="font-bold">✓ STK Push Sent!</p>
            <p className="text-sm">Check {formatDisplay(paymentDetails.mpesa_phone)} and enter your PIN</p>
          </div>,
          { duration: 10000 },
        );

        if (onSubmit) setTimeout(() => onSubmit(), 3000);
      } else {
        setPaymentStatus('error');
        setErrorMessage(result.message || 'M-Pesa payment failed');
        toast.error(result.message || 'M-Pesa payment failed');
      }
    } catch (error: any) {
      setPaymentStatus('error');
      const msg = error.message || 'Failed to process M-Pesa payment';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 border-2 border-gray-200 rounded-xl bg-white shadow-sm">
      <h3 className="font-bold text-lg mb-4 flex items-center">
        <Smartphone className="mr-2 text-green-600" size={20} />
        M-Pesa Payment
      </h3>

      <div className="space-y-4">
        {/* Info banner */}
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-700">
            You'll receive an STK Push on your phone. Enter your M-Pesa PIN to complete payment.
          </p>
        </div>

        {/* Phone number */}
        <div>
          <label className="block text-sm font-medium mb-2">
            M-Pesa Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="tel"
              name="mpesa_phone"
              value={paymentDetails.mpesa_phone || ''}
              onChange={handlePhoneChange}
              placeholder="0712 345 678"
              disabled={loading || paymentStatus === 'processing'}
              className={`w-full px-4 py-3 pl-12 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errorMessage ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            <Smartphone className="absolute left-3 top-3.5 text-gray-400" size={20} />
          </div>
          <p className="text-xs text-gray-500 mt-1">Safaricom number — e.g. 0712 345 678</p>
        </div>

        {/* Till number (read-only) */}
        <div>
          <label className="block text-sm font-medium mb-2">Till Number</label>
          <input
            type="text"
            value="174379"
            disabled
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
          />
          <p className="text-xs text-gray-500 mt-1">Lando Hypermarket till number</p>
        </div>

        {/* Amount */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Amount to pay:</span>
            <span className="text-2xl font-bold text-green-600">
              KSh {totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 flex items-center">
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
              {errorMessage}
            </p>
          </div>
        )}

        {/* Pay button */}
        <button
          type="button"
          onClick={handleMpesaPayment}
          disabled={loading || paymentStatus === 'processing' || !paymentDetails.mpesa_phone}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-all shadow-lg"
        >
          {loading || paymentStatus === 'processing' ? (
            <>
              <Loader className="animate-spin" size={20} />
              <span>Sending STK Push…</span>
            </>
          ) : paymentStatus === 'success' ? (
            <>
              <CheckCircle size={20} />
              <span>Payment Initiated ✓</span>
            </>
          ) : (
            <>
              <Smartphone size={20} />
              <span>Pay KSh {totalAmount.toLocaleString()} with M-Pesa</span>
            </>
          )}
        </button>

        {/* Success state */}
        {paymentStatus === 'success' && (
          <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
            <div className="flex items-center mb-2">
              <CheckCircle size={20} className="text-green-600 mr-2" />
              <p className="font-medium text-green-800">STK Push Sent!</p>
            </div>
            <p className="text-sm text-green-700">
              Check your phone{' '}
              <span className="font-bold">{formatDisplay(paymentDetails.mpesa_phone)}</span>{' '}
              and enter your M-Pesa PIN.
            </p>
            <p className="text-xs text-green-600 mt-2">Waiting for confirmation…</p>
          </div>
        )}

        {/* Processing state */}
        {paymentStatus === 'processing' && !errorMessage && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <Loader className="animate-spin text-blue-600 mr-2" size={18} />
              <p className="text-sm text-blue-700">Sending payment request to your phone…</p>
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="text-xs text-gray-500 space-y-1 border-t pt-4">
          {[
            'Enter your M-Pesa registered phone number',
            'Click "Pay with M-Pesa"',
            'Check your phone for the STK Push notification',
            'Enter your M-Pesa PIN to complete payment',
          ].map((step, i) => (
            <p key={i} className="flex items-center">
              <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full inline-flex items-center justify-center mr-2 text-xs flex-shrink-0">
                {i + 1}
              </span>
              {step}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodDetails;