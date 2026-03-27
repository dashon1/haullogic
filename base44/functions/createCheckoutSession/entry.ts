import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

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

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    // Look up or create Stripe customer
    let customerId;
    const businesses = await base44.asServiceRole.entities.Business.filter({ owner_email: user.email });
    if (businesses.length > 0 && businesses[0].stripe_customer_id) {
      customerId = businesses[0].stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: { owner_email: user.email },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: success_url + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: cancel_url,
      metadata: { owner_email: user.email },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});