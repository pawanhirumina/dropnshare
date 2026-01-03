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

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.DODO_PAYMENTS_API_KEY || !process.env.DODO_PAYMENTS_PRODUCT_ID) {
      console.error('Payment configuration missing:', {
        hasKey: !!process.env.DODO_PAYMENTS_API_KEY,
        hasProduct: !!process.env.DODO_PAYMENTS_PRODUCT_ID
      });
      return NextResponse.json({ error: 'Payment system configuration missing' }, { status: 500 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      console.log('No request body provided, using defaults');
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    const formattedSiteUrl = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;

    const session = await client.checkoutSessions.create({
      billing: body.billing || {
        city: 'New York',
        country: 'US',
        state: 'NY',
        street: '123 Main St',
        zipcode: '10001'
      },
      customer: {
        email: user.email,
        name: body.customer?.name || user.email,
      },
      product_cart: [{
        product_id: process.env.DODO_PAYMENTS_PRODUCT_ID,
        quantity: 1
      }],
      return_url: `${formattedSiteUrl}/payment/success`,
      metadata: {
        userId: user.id,
        ...(body.metadata || {})
      }
    });

    return NextResponse.json({ url: session.checkout_url });
  } catch (error) {
    console.error('Error creating payment session:', error);

    return NextResponse.json({
      error: error.message || 'Internal Server Error',
      details: error.data || error.response || 'No details'
    }, { status: 500 });
  }
}
