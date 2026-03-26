import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const PLAN_FROM_PRICE = {
  [Deno.env.get('STRIPE_PRICE_PRO_MONTHLY')]: 'pro',
  [Deno.env.get('STRIPE_PRICE_SCALE_MONTHLY')]: 'scale',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } catch (err) {
      return Response.json({ error: `Webhook signature failed: ${err.message}` }, { status: 400 });
    }

    const session = event.data.object;

    if (event.type === 'checkout.session.completed') {
      const ownerEmail = session.metadata?.owner_email;
      if (!ownerEmail) return Response.json({ received: true });

      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      const priceId = subscription.items.data[0]?.price?.id;
      const plan = PLAN_FROM_PRICE[priceId] || 'pro';

      const businesses = await base44.asServiceRole.entities.Business.filter({ owner_email: ownerEmail });
      if (businesses.length > 0) {
        await base44.asServiceRole.entities.Business.update(businesses[0].id, {
          plan,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          subscription_status: 'active',
        });
      }
    }

    if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
      const sub = session;
      const customer = await stripe.customers.retrieve(sub.customer);
      const ownerEmail = customer.metadata?.owner_email || customer.email;

      const businesses = await base44.asServiceRole.entities.Business.filter({ owner_email: ownerEmail });
      if (businesses.length > 0) {
        const status = sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'canceled';
        const plan = status === 'canceled' ? 'starter' : businesses[0].plan;
        await base44.asServiceRole.entities.Business.update(businesses[0].id, {
          subscription_status: status,
          plan,
        });
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});