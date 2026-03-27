import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const PLAN_FROM_PRICE = {
  [Deno.env.get('STRIPE_PRO_PRICE_ID')]: 'pro',
  [Deno.env.get('STRIPE_SCALE_PRICE_ID')]: 'scale',
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

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const sub = session;
      const customer = await stripe.customers.retrieve(sub.customer);
      const ownerEmail = customer.metadata?.owner_email || customer.email;

      const businesses = await base44.asServiceRole.entities.Business.filter({ owner_email: ownerEmail });
      if (businesses.length > 0) {
        const statusMap = { active: 'active', trialing: 'trialing', past_due: 'past_due', canceled: 'canceled' };
        const subStatus = statusMap[sub.status] || 'canceled';

        // Resolve plan from current price ID on the subscription
        const priceId = sub.items?.data?.[0]?.price?.id;
        let plan = PLAN_FROM_PRICE[priceId] || businesses[0].plan;
        if (subStatus === 'canceled' || event.type === 'customer.subscription.deleted') {
          plan = 'starter';
        }

        await base44.asServiceRole.entities.Business.update(businesses[0].id, {
          subscription_status: subStatus,
          plan,
          stripe_subscription_id: sub.id,
          stripe_customer_id: sub.customer,
        });
      }
    }

    // Handle invoice payment failures
    if (event.type === 'invoice.payment_failed') {
      const invoice = session;
      const customer = await stripe.customers.retrieve(invoice.customer);
      const ownerEmail = customer.metadata?.owner_email || customer.email;
      const businesses = await base44.asServiceRole.entities.Business.filter({ owner_email: ownerEmail });
      if (businesses.length > 0) {
        await base44.asServiceRole.entities.Business.update(businesses[0].id, {
          subscription_status: 'past_due',
        });
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});