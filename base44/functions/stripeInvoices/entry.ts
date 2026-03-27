import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get business record for this user
    const businesses = await base44.asServiceRole.entities.Business.filter({ owner_email: user.email });
    const business = businesses[0];

    if (!business?.stripe_customer_id) {
      return Response.json({ invoices: [], subscription: null, customer: null });
    }

    const customerId = business.stripe_customer_id;

    // Fetch invoices, subscription, and customer in parallel
    const [invoiceList, subscriptionData, customer] = await Promise.all([
      stripe.invoices.list({ customer: customerId, limit: 24 }),
      business.stripe_subscription_id
        ? stripe.subscriptions.retrieve(business.stripe_subscription_id)
        : Promise.resolve(null),
      stripe.customers.retrieve(customerId),
    ]);

    const invoices = invoiceList.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amount_paid: inv.amount_paid,
      amount_due: inv.amount_due,
      currency: inv.currency,
      created: inv.created,
      period_start: inv.period_start,
      period_end: inv.period_end,
      hosted_invoice_url: inv.hosted_invoice_url,
      invoice_pdf: inv.invoice_pdf,
      description: inv.description || inv.lines?.data?.[0]?.description || '',
    }));

    const subscription = subscriptionData
      ? {
          id: subscriptionData.id,
          status: subscriptionData.status,
          current_period_start: subscriptionData.current_period_start,
          current_period_end: subscriptionData.current_period_end,
          cancel_at_period_end: subscriptionData.cancel_at_period_end,
          plan_name: subscriptionData.items.data[0]?.price?.nickname || business.plan,
          amount: subscriptionData.items.data[0]?.price?.unit_amount,
          currency: subscriptionData.items.data[0]?.price?.currency,
          interval: subscriptionData.items.data[0]?.price?.recurring?.interval,
        }
      : null;

    return Response.json({
      invoices,
      subscription,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});