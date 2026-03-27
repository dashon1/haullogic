import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const PRICE_MAP = {
  pro_monthly: Deno.env.get('STRIPE_PRO_PRICE_ID'),
  scale_monthly: Deno.env.get('STRIPE_SCALE_PRICE_ID'),
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { price_key, success_url, cancel_url } = await req.json();

    const priceId = PRICE_MAP[price_key];
    if (!priceId) {
      return Response.json({ error: `Unknown price_key: ${price_key}` }, { status: 400 });
    }

    // Look up existing business to reuse Stripe customer if available
    const businesses = await base44.asServiceRole.entities.Business.filter({ owner_email: user.email });
    const business = businesses[0];
    const existingCustomerId = business?.stripe_customer_id;

    const sessionParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: success_url || `${req.headers.get('origin')}/Onboarding`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/pricing`,
      metadata: { owner_email: user.email },
      subscription_data: {
        metadata: { owner_email: user.email },
      },
    };

    if (existingCustomerId) {
      sessionParams.customer = existingCustomerId;
    } else {
      sessionParams.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});