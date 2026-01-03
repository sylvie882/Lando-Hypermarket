'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Building, AlertCircle } from 'lucide-react';

interface PaymentMethodDetailsProps {
  methodId: string;
  paymentDetails: any;
  onPaymentDetailsChange: (details: any) => void;
  totalAmount: number;
  currency: string;
  paymentIntent?: any;
  userCountry?: string;
  onSubmit?: () => void;
}

const PaymentMethodDetails: React.FC<PaymentMethodDetailsProps> = ({
  methodId,
  paymentDetails,
  onPaymentDetailsChange,
  totalAmount,
  currency,
  paymentIntent,
  userCountry,
  onSubmit
}) => {
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    onPaymentDetailsChange({
      ...paymentDetails,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const renderCreditCardForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Cardholder Name</label>
        <input
          type="text"
          name="card_name"
          value={paymentDetails.card_name}
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
          value={paymentDetails.card_number}
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
            value={paymentDetails.card_expiry}
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
            value={paymentDetails.card_cvc}
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
          checked={paymentDetails.save_card}
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
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center mb-2">
          <AlertCircle size={20} className="text-green-600 mr-2" />
          <span className="text-sm font-medium text-green-800">How M-Pesa Till works</span>
        </div>
        <p className="text-sm text-green-700">
          1. Enter your M-Pesa registered phone number<br />
          2. Enter the Till number provided<br />
          3. You'll receive an M-Pesa prompt on your phone<br />
          4. Enter your M-Pesa PIN to complete payment
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">M-Pesa Phone Number</label>
        <input
          type="tel"
          name="mpesa_phone"
          value={paymentDetails.mpesa_phone}
          onChange={handleInputChange}
          placeholder="2547XXXXXXXX"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Format: 2547XXXXXXXX (Kenya)</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Till Number</label>
        <input
          type="text"
          name="mpesa_till"
          value={paymentDetails.mpesa_till}
          onChange={handleInputChange}
          placeholder="XXXXXX"
          maxLength={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          required
        />
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
          value={paymentDetails.bank_name}
          onChange={handleInputChange}
          placeholder="e.g., Chase, Bank of America"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Account Number</label>
        <input
          type="text"
          name="account_number"
          value={paymentDetails.account_number}
          onChange={handleInputChange}
          placeholder="Your account number"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Routing Number (Optional)</label>
        <input
          type="text"
          name="routing_number"
          value={paymentDetails.routing_number}
          onChange={handleInputChange}
          placeholder="Bank routing number"
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
        return renderCreditCardForm();
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
      case 'stripe':
        return renderCreditCardForm(); // Stripe uses same card form
      case 'cod':
        return renderCODDetails();
      default:
        return null;
    }
  };

  return (
    <div className="p-6 border-2 border-gray-200 rounded-xl bg-gray-50">
      <h3 className="font-bold text-lg mb-4">Payment Details</h3>
      <div className="space-y-4">
        {renderMethodDetails()}
        
        {methodId !== 'cod' && (
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-gray-700">Amount to pay:</span>
            <span className="text-xl font-bold">
              {currency} {totalAmount.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodDetails;