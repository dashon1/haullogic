import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CreditCard, FileText, ExternalLink, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  paid: 'bg-emerald-100 text-emerald-700',
  open: 'bg-amber-100 text-amber-700',
  void: 'bg-slate-100 text-slate-500',
  uncollectible: 'bg-red-100 text-red-600',
};

const subStatusColors = {
  active: 'bg-emerald-100 text-emerald-700',
  trialing: 'bg-blue-100 text-blue-700',
  past_due: 'bg-red-100 text-red-600',
  canceled: 'bg-slate-100 text-slate-500',
};

function formatAmount(amount, currency = 'usd') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100);
}

export default function BillingTab({ business }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!business?.stripe_customer_id) {
      setLoading(false);
      return;
    }
    base44.functions.invoke('stripeInvoices', {})
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [business?.stripe_customer_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!business?.stripe_customer_id) {
    return (
      <div className="text-center py-16 text-slate-400">
        <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium text-slate-600">No billing info yet</p>
        <p className="text-sm mt-1">Upgrade to a paid plan to see billing history</p>
        <Button className="mt-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl" onClick={() => window.location.href = '/pricing'}>
          View Plans
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600">
        Failed to load billing data: {error}
      </div>
    );
  }

  const { subscription, invoices } = data || {};

  return (
    <div className="space-y-5">
      {/* Subscription Card */}
      {subscription && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-orange-500" />
              </div>
              <p className="font-bold text-slate-900 capitalize">{business.plan} Plan</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${subStatusColors[subscription.status] || 'bg-slate-100 text-slate-500'}`}>
              {subscription.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Monthly Cost</p>
              <p className="font-bold text-slate-900">{formatAmount(subscription.amount, subscription.currency)}/{subscription.interval}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Next Billing</p>
              <p className="font-semibold text-slate-700">
                {subscription.current_period_end
                  ? format(new Date(subscription.current_period_end * 1000), 'MMM d, yyyy')
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Period Start</p>
              <p className="font-semibold text-slate-700">
                {subscription.current_period_start
                  ? format(new Date(subscription.current_period_start * 1000), 'MMM d, yyyy')
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Auto-Renew</p>
              <p className={`font-semibold ${subscription.cancel_at_period_end ? 'text-red-500' : 'text-emerald-600'}`}>
                {subscription.cancel_at_period_end ? 'Cancels at end' : 'Active'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invoice History */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 p-5 pb-3">
          <FileText className="w-4 h-4 text-slate-500" />
          <p className="font-bold text-slate-900 text-sm">Invoice History</p>
        </div>

        {!invoices || invoices.length === 0 ? (
          <div className="px-5 pb-5 text-sm text-slate-400">No invoices found.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {inv.number || inv.id}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {inv.created ? format(new Date(inv.created * 1000), 'MMM d, yyyy') : '—'}
                    {inv.description ? ` · ${inv.description}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[inv.status] || 'bg-slate-100 text-slate-500'}`}>
                    {inv.status}
                  </span>
                  <p className="text-sm font-bold text-slate-900 tabular-nums">
                    {formatAmount(inv.amount_paid || inv.amount_due, inv.currency)}
                  </p>
                  {inv.hosted_invoice_url && (
                    <a
                      href={inv.hosted_invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-orange-500 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}