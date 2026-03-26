import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Truck, Check, ArrowRight, Loader2, Zap, Building2, Rocket } from 'lucide-react';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    icon: Zap,
    price: 0,
    priceLabel: 'Free',
    period: 'forever',
    description: 'Try HaulLogic with your first customers.',
    features: [
      'Up to 10 quotes / month',
      'Photo-based AI estimation',
      'Shareable quote link',
      'Lead management dashboard',
      'Email support',
    ],
    cta: 'Get Started Free',
    ctaVariant: 'outline',
    highlight: false,
    priceKey: null,
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Building2,
    price: 49,
    priceLabel: '$49',
    period: 'per month',
    description: 'For growing hauling businesses.',
    features: [
      'Unlimited quotes',
      'AI photo analysis (priority)',
      'Custom pricing tiers',
      'Booking & scheduling',
      'Driver / crew view',
      'CSV pricing upload',
      'Chat & email support',
    ],
    cta: 'Start Pro — $49/mo',
    ctaVariant: 'default',
    highlight: true,
    priceKey: 'pro_monthly',
  },
  {
    id: 'scale',
    name: 'Scale',
    icon: Rocket,
    price: 99,
    priceLabel: '$99',
    period: 'per month',
    description: 'For multi-location operations.',
    features: [
      'Everything in Pro',
      'Multiple locations / BusinessIds',
      'White-label quote page',
      'Priority AI queue',
      'Dedicated onboarding call',
      'Priority phone support',
    ],
    cta: 'Start Scale — $99/mo',
    ctaVariant: 'default',
    highlight: false,
    priceKey: 'scale_monthly',
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState(null);

  const handlePlanSelect = async (plan) => {
    if (!plan.priceKey) {
      // Free plan — go straight to onboarding
      navigate('/Onboarding');
      return;
    }

    setLoadingPlan(plan.id);
    setError(null);
    try {
      const res = await base44.functions.invoke('createCheckoutSession', {
        price_key: plan.priceKey,
        success_url: `${window.location.origin}/Onboarding`,
        cancel_url: `${window.location.origin}/pricing`,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error(err);
      // Stripe not configured yet — go to onboarding and they can upgrade later
      navigate('/Onboarding');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Nav */}
      <div className="max-w-4xl mx-auto px-6 pt-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
            <Truck className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-black text-lg">HaulLogic</span>
        </Link>
        <Link to="/Onboarding" className="text-slate-400 hover:text-white text-sm transition-colors">
          Already signed up? →
        </Link>
      </div>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-orange-500/30">
          <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
          Simple, transparent pricing
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
          The quote tool your<br />
          <span className="text-orange-400">customers will love</span>
        </h1>
        <p className="text-slate-300 text-lg max-w-xl mx-auto">
          Give every customer an instant AI-powered estimate from a photo. Close more jobs. Fewer wasted calls.
        </p>
      </div>

      {/* Plans */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid sm:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isLoading = loadingPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 flex flex-col ${
                  plan.highlight
                    ? 'bg-orange-500 text-white shadow-2xl shadow-orange-500/30 scale-105'
                    : 'bg-white'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-orange-500 text-xs font-black px-4 py-1 rounded-full shadow">
                    MOST POPULAR
                  </div>
                )}

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${plan.highlight ? 'bg-white/20' : 'bg-orange-100'}`}>
                  <Icon className={`w-5 h-5 ${plan.highlight ? 'text-white' : 'text-orange-500'}`} />
                </div>

                <p className={`font-black text-lg mb-1 ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>{plan.name}</p>
                <p className={`text-sm mb-4 ${plan.highlight ? 'text-orange-100' : 'text-slate-500'}`}>{plan.description}</p>

                <div className="mb-6">
                  <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>{plan.priceLabel}</span>
                  <span className={`text-sm ml-1 ${plan.highlight ? 'text-orange-100' : 'text-slate-400'}`}>/{plan.period}</span>
                </div>

                <ul className="space-y-2 mb-8 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className={`flex items-start gap-2 text-sm ${plan.highlight ? 'text-orange-50' : 'text-slate-600'}`}>
                      <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-white' : 'text-orange-500'}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePlanSelect(plan)}
                  disabled={isLoading}
                  className={`w-full h-12 rounded-2xl font-semibold gap-2 ${
                    plan.highlight
                      ? 'bg-white text-orange-600 hover:bg-orange-50'
                      : plan.ctaVariant === 'outline'
                      ? 'bg-white border-2 border-slate-200 text-slate-700 hover:border-orange-300 hover:text-orange-600'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>{plan.cta} <ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center mt-6">{error}</p>
        )}

        {/* FAQ */}
        <div className="mt-16 grid sm:grid-cols-2 gap-6">
          {[
            { q: 'Do I need a credit card for Starter?', a: 'No. The free plan requires no payment info. Upgrade anytime from your dashboard.' },
            { q: 'Can I cancel anytime?', a: 'Yes. Cancel from your dashboard before the next billing cycle. No cancellation fees.' },
            { q: 'What happens when I hit the quote limit?', a: 'We\'ll notify you. Quotes stop until the next month or you upgrade to Pro.' },
            { q: 'Is my customers\' data secure?', a: 'Yes. Photos and lead data are encrypted at rest and in transit. We never share customer data.' },
          ].map((item, i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-5">
              <p className="font-semibold text-white text-sm mb-2">{item.q}</p>
              <p className="text-slate-400 text-sm">{item.a}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-slate-500 text-xs mt-10">
          Questions? Email <span className="text-slate-400">hello@haullogic.app</span>
        </p>
      </div>
    </div>
  );
}
