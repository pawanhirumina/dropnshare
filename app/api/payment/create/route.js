import { DodoPayments } from 'dodopayments';
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('Payment session creation started');

  try {
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    const productId = process.env.DODO_PAYMENTS_PRODUCT_ID;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!apiKey || !productId) {
      return NextResponse.json({
        error: 'Payment system is not configured',
        details: `Missing: ${!apiKey ? 'API_KEY' : ''} ${!productId ? 'PRODUCT_ID' : ''}`
      }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize client with apiKey property
    const client = new DodoPayments({
      apiKey: apiKey,
    });

    const formattedSiteUrl = siteUrl
      ? (siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`).replace(/\/$/, '')
      : 'http://localhost:3000';

    const returnUrl = `${formattedSiteUrl}/payment/success`;
    console.log('User:', user.id, 'Product:', productId);

    const session = await client.checkoutSessions.create({
      product_cart: [{
        product_id: productId,
        quantity: 1
      }],
      customer: {
        email: user.email,
        name: user.email || 'Customer',
      },
      return_url: returnUrl,
      metadata: {
        userId: user.id
      }
    });

    if (!session || !session.checkout_url) {
      console.error('Invalid session response:', session);
      return NextResponse.json({
        error: 'Invalid response from payment gateway',
        details: JSON.stringify(session)
      }, { status: 500 });
    }

    return NextResponse.json({ url: session.checkout_url });

  } catch (error) {
    console.error('Payment Route Error:', error);

    // Extract error message from DodoPayments error object
    let message = error.message || 'Internal Server Error';
    let details = 'No additional details available';

    if (error.response) {
      details = JSON.stringify(error.response.data || error.response || {});
    } else if (error.data) {
      details = JSON.stringify(error.data);
    }

    return NextResponse.json({
      error: message,
      details: details
    }, { status: 500 });
  }
}
