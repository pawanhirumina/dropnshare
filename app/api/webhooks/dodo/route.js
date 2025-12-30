
import { DodoPayments } from 'dodopayments';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const client = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
});

// Create a Supabase client with the Service Role Key to bypass RLS and update user profiles
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const payload = await request.text();

  const signature = request.headers.get('webhook-signature'); 
  const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;

  try {
    const event = JSON.parse(payload);

    if (event.type === 'payment.succeeded' || event.type === 'subscription.created') {
       const userId = event.data.metadata?.userId;

       if (userId) {
           const { error } = await supabase
            .from('profiles')
            .update({ plan: 'pro' }) 
            .eq('id', userId);
            
           if (error) {
             console.error('Error updating profile:', error);
             return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
           }
       } else {
         console.warn('No userId found in webhook metadata');
       }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 });
  }
}
