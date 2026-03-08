import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    Razorpay: any;
  }
}

let scriptLoaded = false;

export function loadRazorpayScript(): Promise<void> {
  if (scriptLoaded && window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      scriptLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => { scriptLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.head.appendChild(script);
  });
}

interface CreateOrderParams {
  amount: number;
  bookingIds: string[];
  receipt?: string;
}

interface PaymentResult {
  verified: boolean;
  paymentId: string;
}

export async function createRazorpayOrder(params: CreateOrderParams) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke('razorpay', {
    body: {
      action: 'create_order',
      amount: params.amount,
      booking_ids: params.bookingIds,
      receipt: params.receipt,
    },
  });

  if (error) throw new Error(error.message || 'Failed to create order');
  if (data?.error) throw new Error(data.error);
  return data as { order_id: string; amount: number; currency: string; key_id: string };
}

export async function verifyRazorpayPayment(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  booking_ids: string[];
}): Promise<PaymentResult> {
  const { data, error } = await supabase.functions.invoke('razorpay', {
    body: {
      action: 'verify_payment',
      ...params,
    },
  });

  if (error) throw new Error(error.message || 'Payment verification failed');
  if (data?.error) throw new Error(data.error);
  return { verified: data.verified, paymentId: data.payment_id };
}

export function openRazorpayCheckout(options: {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  description?: string;
  onSuccess: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  onFailure: (error: any) => void;
}) {
  const rzp = new window.Razorpay({
    key: options.keyId,
    amount: options.amount,
    currency: options.currency,
    name: 'ServisGo',
    description: options.description || 'Service Booking Payment',
    order_id: options.orderId,
    prefill: {
      name: options.userName || '',
      email: options.userEmail || '',
      contact: options.userPhone || '',
    },
    theme: { color: '#0d9488' },
    handler: options.onSuccess,
    modal: {
      ondismiss: () => options.onFailure({ description: 'Payment cancelled by user' }),
    },
  });
  rzp.on('payment.failed', options.onFailure);
  rzp.open();
}
