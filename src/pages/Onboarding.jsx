import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Truck, ArrowRight, ArrowLeft, CheckCircle, Loader2, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FALLBACK_TIERS = [
  { tier: 'MIN', label: 'Minimum (1–2 items)', service: 'FullService', default: 125 },
  { tier: 'QTR', label: '¼ Load',              service: 'FullService', default: 225 },
  { tier: 'HALF', label: '½ Load',             service: 'FullService', default: 375 },
  { tier: '3QTR', label: '¾ Load',             service: 'FullService', default: 525 },
  { tier: 'FULL', label: 'Full Load',           service: 'FullService', default: 675 },
];

function slugify(name) {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .map(w => w.slice(0, 4))
    .join('_')
    .slice(0, 16);
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [businessId, setBusinessId] = useState('');
  const [copied, setCopied] = useState(false);

  const [info, setInfo] = useState({
    name: '',
    phone: '',
    email: '',
    region: '',
  });

  const [prices, setPrices] = useState(
    Object.fromEntries(FALLBACK_TIERS.map(t => [t.tier, String(t.default)]))
  );

  const handleInfoChange = (field, value) => {
    setInfo(prev => ({ ...prev, [field]: value }));
    if (field === 'name') {
      setBusinessId(slugify(value));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const user = await base44.auth.me();

      // Upsert Business record
      const existingBiz = await base44.entities.Business.filter({ owner_email: user.email });
      if (existingBiz.length > 0) {
        await base44.entities.Business.update(existingBiz[0].id, {
          business_id: businessId,
          name: info.name,
          phone: info.phone,
          email: info.email,
          region: info.region,
        });
      } else {
        await base44.entities.Business.create({
          owner_email: user.email,
          business_id: businessId,
          name: info.name,
          phone: info.phone,
          email: info.email,
          region: info.region,
          plan: 'starter',
          subscription_status: 'none',
        });
      }

      // Delete any existing rules for this businessId first
      const existing = await base44.entities.PricingRule.filter({ BusinessId: businessId });
      await Promise.all(existing.map(r => base44.entities.PricingRule.delete(r.id)));

      // Create base pricing rules
      const rules = FALLBACK_TIERS.map(t => ({
        BusinessId: businessId,
        Region: info.region || 'Local',
        ServiceType: t.service,
        TierCode: t.tier,
        TierLabel: t.label,
        TierOrder: FALLBACK_TIERS.indexOf(t) + 1,
        LineType: 'BASE',
        ItemOrCondition: 'Base Price',
        AmountMin: parseInt(prices[t.tier]) || t.default,
        AmountMax: parseInt(prices[t.tier]) || t.default,
        Unit: 'flat',
        Trigger: '',
        DisposalCredit: null,
        Notes: `Set up via onboarding — ${info.name}`,
      }));

      await Promise.all(rules.map(r => base44.entities.PricingRule.create(r)));

      setStep(4);
    } catch (err) {
      console.error(err);
      setError('Failed to save. Please try again.');
    }
    setSaving(false);
  };

  const quoteUrl = `${window.location.origin}/quote/${businessId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(quoteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xl font-black">HaulLogic</span>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-6">
          {/* Step indicator */}
          {step < 4 && (
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? 'bg-orange-500' : 'bg-slate-200'}`} />
              ))}
            </div>
          )}

          {/* Step 1 — Business Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-slate-900">Set up your business</h2>
                <p className="text-slate-500 text-sm mt-1">This takes about 2 minutes.</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Business Name *</label>
                  <Input placeholder="e.g. All In Tampa Bay Hauling" value={info.name} onChange={e => handleInfoChange('name', e.target.value)} />
                  {businessId && <p className="text-xs text-slate-400 mt-1">Your ID: <strong>{businessId}</strong></p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Service Area / Region</label>
                  <Input placeholder="e.g. Tampa Bay, FL" value={info.region} onChange={e => handleInfoChange('region', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Business Phone</label>
                  <Input placeholder="(727) 555-0000" value={info.phone} onChange={e => handleInfoChange('phone', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Business Email</label>
                  <Input placeholder="hello@yourbusiness.com" value={info.email} onChange={e => handleInfoChange('email', e.target.value)} />
                </div>
              </div>
              <Button onClick={() => setStep(2)} disabled={!info.name.trim()} className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-12 font-semibold">
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2 — Pricing */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-slate-900">Set your prices</h2>
                <p className="text-slate-500 text-sm mt-1">Full service junk removal base prices. You can update these anytime.</p>
              </div>
              <div className="space-y-3">
                {FALLBACK_TIERS.map(t => (
                  <div key={t.tier} className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">{t.label}</p>
                    </div>
                    <div className="flex items-center gap-1 w-28">
                      <span className="text-slate-500 text-sm">$</span>
                      <Input
                        type="number"
                        value={prices[t.tier]}
                        onChange={e => setPrices(prev => ({ ...prev, [t.tier]: e.target.value }))}
                        className="h-9 text-sm text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400">Add-ons (mattress, fridge, stairs, same-day) use built-in defaults. You can customize via the admin CSV upload later.</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-2xl">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-semibold">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-slate-900">Review & confirm</h2>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm">
                <p><span className="text-slate-500">Business:</span> <strong>{info.name}</strong></p>
                <p><span className="text-slate-500">Business ID:</span> <strong className="font-mono">{businessId}</strong></p>
                {info.region && <p><span className="text-slate-500">Region:</span> {info.region}</p>}
                {info.phone && <p><span className="text-slate-500">Phone:</span> {info.phone}</p>}
                {info.email && <p><span className="text-slate-500">Email:</span> {info.email}</p>}
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
                <p className="text-xs font-semibold text-orange-700 mb-2">Pricing summary (Full Service)</p>
                {FALLBACK_TIERS.map(t => (
                  <div key={t.tier} className="flex justify-between text-xs text-orange-800">
                    <span>{t.label}</span><span>${prices[t.tier]}</span>
                  </div>
                ))}
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 rounded-2xl">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-semibold">
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Go Live'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4 — Done */}
          {step === 4 && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">You're live!</h2>
                <p className="text-slate-500 text-sm mt-1">Share this link with customers to start getting quotes.</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-xs text-slate-500 mb-2 font-semibold">Your quote link</p>
                <p className="text-sm font-mono text-slate-700 break-all mb-3">{quoteUrl}</p>
                <Button onClick={copyLink} variant="outline" size="sm" className="gap-2">
                  {copied ? <><CheckCircle className="w-3 h-3 text-green-500" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy Link</>}
                </Button>
              </div>
              <Button onClick={() => navigate('/pricing')} className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-12 font-semibold">
                Choose Your Plan →
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}