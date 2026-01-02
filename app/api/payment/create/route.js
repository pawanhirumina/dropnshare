import { DodoPayments } from 'dodopayments';
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

const client = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: process.env.DODO_PAYMENTS_ENVIRONMENT,
});

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!process.env.DODO_PAYMENTS_API_KEY) console.error('Missing: DODO_PAYMENTS_API_KEY');
    if (!process.env.DODO_PAYMENTS_PRODUCT_ID) console.error('Missing: DODO_PAYMENTS_PRODUCT_ID');
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) console.error('Missing: NEXT_PUBLIC_SUPABASE_URL');

    if (!process.env.DODO_PAYMENTS_API_KEY || !process.env.DODO_PAYMENTS_PRODUCT_ID) {
      return NextResponse.json({ error: 'Payment system configuration missing' }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      console.log('No request body provided, using defaults');
    }

    const session = await client.payments.create({
      billing: {
        city: 'New York',
        country: 'US',
        state: 'NY',
        street: '123 Main St',
        zipcode: '10001'
      },
      customer: {
        email: user.email,
        name: user.email,
      },
      product_cart: [{
        product_id: process.env.DODO_PAYMENTS_PRODUCT_ID,
        quantity: 1
      }],
      payment_link: true,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success`,
      metadata: {
        userId: user.id
      }
    });

    return NextResponse.json({ url: session.payment_link });
  } catch (error) {
    console.error('Error creating payment session:', error);
    // Check for missing env vars
    if (!process.env.DODO_PAYMENTS_API_KEY) console.error('Missing DODO_PAYMENTS_API_KEY');
    if (!process.env.DODO_PAYMENTS_PRODUCT_ID) console.error('Missing DODO_PAYMENTS_PRODUCT_ID');

    return NextResponse.json({
      error: error.message,
      details: error.response ? JSON.stringify(error.response) : 'No response details'
    }, { status: 500 });
  }
}
