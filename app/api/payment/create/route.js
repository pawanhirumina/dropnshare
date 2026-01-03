import { DodoPayments } from 'dodopayments';
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('Payment session creation started');

  try {
    // Check for required environment variables first
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    const productId = process.env.DODO_PAYMENTS_PRODUCT_ID;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!apiKey || !productId) {
      console.error('Missing environment variables:', {
        hasKey: !!apiKey,
        hasProductId: !!productId
      });
      return NextResponse.json({
        error: 'Payment system is not configured',
        details: 'Missing Dodo Payments configuration'
      }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (e) {
      console.warn('Could not parse request body, using defaults');
    }

    // Initialize DodoPayments client inside the handler
    const client = new DodoPayments({
      bearerToken: apiKey,
      // Removed environment parameter to let the SDK infer from the key,
      // as it might be 'live' or 'test' instead of 'live_mode'
    });

    const formattedSiteUrl = siteUrl
      ? (siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`).replace(/\/$/, '')
      : 'http://localhost:3000'; // Fallback for local dev

    const returnUrl = `${formattedSiteUrl}/payment/success`;
    console.log('Creating checkout session for user:', user.id, 'with return_url:', returnUrl);

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
        name: body.customer?.name || user.email || 'Customer',
      },
      product_cart: [{
        product_id: productId,
        quantity: 1
      }],
      return_url: returnUrl,
      metadata: {
        userId: user.id,
        ...(typeof body.metadata === 'object' ? body.metadata : {})
      }
    });

    console.log('Checkout session created successfully:', session.checkout_url || session.payment_link);

    const checkoutUrl = session.checkout_url || session.payment_link;
    if (!checkoutUrl) {
      console.error('No checkout URL returned from DodoPayments:', session);
      throw new Error('Payment gateway failed to generate a checkout URL');
    }

    return NextResponse.json({ url: checkoutUrl });

  } catch (error) {
    console.error('CRITICAL: Error in payment/create route:', error);

    // Attempt to extract as much info as possible
    const errorDetails = error.data || error.response?.data || error.message || 'Unknown error';

    return NextResponse.json({
      error: 'Failed to create payment session',
      details: typeof errorDetails === 'object' ? JSON.stringify(errorDetails) : errorDetails
    }, { status: 500 });
  }
}
