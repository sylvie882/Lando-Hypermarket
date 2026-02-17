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
      // Format phone number to international format (254XXXXXXXXX)
      const formattedPhone = this.formatPhoneNumber(data.phoneNumber);
      
      console.log('Initiating M-Pesa payment for order:', data.orderId);
      
      const response = await fetch(`${this.baseUrl}/orders/${data.orderId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          payment_method: 'mpesa_till',
          payment_details: {
            phone_number: formattedPhone,
            till_number: data.tillNumber || '174379',
            amount: data.amount
          }
        })
      });

      const result = await response.json();
      console.log('M-Pesa response:', result);
      
      if (response.ok) {
        return {
          success: true,
          transaction_id: result.payment?.transaction_id || result.transaction_id,
          message: result.message || 'STK Push sent. Please check your phone to complete payment.',
          response_data: result
        };
      } else {
        return {
          success: false,
          message: result.message || 'M-Pesa payment failed'
        };
      }
    } catch (error) {
      console.error('M-Pesa STK Push error:', error);
      return {
        success: false,
        message: 'Failed to initiate M-Pesa payment'
      };
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove any non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 0, replace with 254
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    }
    
    // If doesn't start with 254, add it
    if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }
    
    return cleaned;
  }
}

export const mpesaService = new MpesaService();