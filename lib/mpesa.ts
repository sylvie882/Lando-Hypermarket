// lib/mpesa.ts
interface MpesaPaymentRequest {
  phoneNumber: string;
  amount: number;
  orderId: string | number;
  tillNumber?: string;
}

interface MpesaResponse {
  success: boolean;
  transaction_id?: string;
  message?: string;
  response_data?: any;
}

class MpesaService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.hypermarket.co.ke/api';
  }

  async initiateSTKPush(data: MpesaPaymentRequest, token: string): Promise<MpesaResponse> {
    try {
      // Normalise phone to 254XXXXXXXXX
      const formattedPhone = this.formatPhoneNumber(data.phoneNumber);

      console.log('Initiating M-Pesa payment for order:', data.orderId);

      const response = await fetch(`${this.baseUrl}/orders/${data.orderId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          // 'mpesa' matches the updated PaymentController switch + OrderController validation
          payment_method: 'mpesa',
          payment_details: {
            phone_number: formattedPhone,
            till_number: data.tillNumber || '',
            amount: data.amount,
          },
        }),
      });

      const result = await response.json();
      console.log('M-Pesa response:', result);

      if (response.ok) {
        return {
          success: true,
          transaction_id: result.payment?.transaction_id
            ?? result.payment?.provider_reference
            ?? result.transaction_id,
          message:
            result.message ||
            'STK Push sent. Please check your phone and enter your M-Pesa PIN.',
          response_data: result,
        };
      }

      return {
        success: false,
        message: result.message || result.error || 'M-Pesa payment failed',
      };
    } catch (error) {
      console.error('M-Pesa STK Push error:', error);
      return {
        success: false,
        message: 'Failed to initiate M-Pesa payment. Please check your connection and try again.',
      };
    }
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }

    // Clamp to 12 digits (254 + 9)
    if (cleaned.length > 12) {
      cleaned = cleaned.substring(0, 12);
    }

    return cleaned;
  }
}

export const mpesaService = new MpesaService();