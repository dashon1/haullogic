import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function ContactStep({ formData, setFormData, onSubmit, onBack, loading }) {
  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));
  const canSubmit = formData.name && formData.phone && formData.email && formData.address;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Almost There!</h2>
        <p className="text-slate-500 text-sm">We need a few details to send your instant estimate</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-slate-700 font-medium">Full Name</Label>
          <Input
            placeholder="John Smith"
            value={formData.name || ''}
            onChange={e => set('name', e.target.value)}
            className="h-12 rounded-xl border-slate-200 focus:border-orange-400 focus:ring-orange-100"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-700 font-medium">Phone Number</Label>
          <Input
            placeholder="(555) 123-4567"
            type="tel"
            value={formData.phone || ''}
            onChange={e => set('phone', e.target.value)}
            className="h-12 rounded-xl border-slate-200 focus:border-orange-400 focus:ring-orange-100"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-700 font-medium">Email Address</Label>
          <Input
            placeholder="john@example.com"
            type="email"
            value={formData.email || ''}
            onChange={e => set('email', e.target.value)}
            className="h-12 rounded-xl border-slate-200 focus:border-orange-400 focus:ring-orange-100"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-700 font-medium">Pickup Address</Label>
          <Input
            placeholder="123 Main St, City, State"
            value={formData.address || ''}
            onChange={e => set('address', e.target.value)}
            className="h-12 rounded-xl border-slate-200 focus:border-orange-400 focus:ring-orange-100"
          />
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-500 leading-relaxed">
        <span className="font-semibold text-slate-600">🔒 Your info is safe.</span> We only use this to send your estimate and follow up on your job — no spam, ever.
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1 h-14 rounded-2xl text-base font-semibold">
          ← Back
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!canSubmit || loading}
          className="flex-[2] h-14 text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-2xl disabled:opacity-40"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </span>
          ) : 'Get My Estimate →'}
        </Button>
      </div>
    </div>
  );
}