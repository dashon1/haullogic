import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Phone, Calendar, Shield } from 'lucide-react';

const serviceLabels = {
  trailer_drop_off: 'Trailer Drop-Off Rental',
  curbside_pickup: 'Curbside Pickup',
  full_service: 'Full Service Junk Removal',
};

const loadLabels = {
  minimum: 'Minimum Load',
  eighth: '⅛ Trailer Load',
  quarter: '¼ Trailer Load',
  half: '½ Trailer Load',
  three_quarter: '¾ Trailer Load',
  full: 'Full Trailer Load',
};

export default function QuoteResult({ quote, assessment, lead, onBookService }) {
  const isLowConfidence = assessment?.confidence_score < 0.6 || quote?.confidence_level === 'low';
  const hasHeavyMaterial = assessment?.heavy_material_flag;
  const needsReview = isLowConfidence || hasHeavyMaterial;

  const displayMin = quote?.admin_adjusted_min || quote?.estimate_min;
  const displayMax = quote?.admin_adjusted_max || quote?.estimate_max;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{lead?.name?.split(' ')[0]}, here's your estimate!</h2>
        <p className="text-slate-500 text-sm mt-1">Based on your photos and answers</p>
      </div>

      {needsReview ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Estimate Requires Quick Review</p>
            <p className="text-amber-700 text-xs mt-0.5">
              {hasHeavyMaterial ? 'Heavy materials detected — a team member will confirm your final price.' : 'Our team will review your photos and confirm within the hour.'}
            </p>
          </div>
        </div>
      ) : null}

      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 text-white text-center shadow-lg shadow-orange-200">
        <p className="text-orange-100 text-sm font-medium mb-1">Estimated Price Range</p>
        <p className="text-5xl font-black tracking-tight">
          ${displayMin} – ${displayMax}
        </p>
        <p className="text-orange-100 text-xs mt-2">Final price confirmed before work begins</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Est. Load Size</p>
          <p className="font-bold text-slate-800 text-sm">{loadLabels[assessment?.estimated_load_bucket] || `${assessment?.fill_percent || '–'}% Trailer`}</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Service Type</p>
          <p className="font-bold text-slate-800 text-sm">{serviceLabels[lead?.service_type] || '–'}</p>
        </div>
      </div>

      {quote?.surcharges && quote.surcharges.length > 0 && (
        <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Price Breakdown</p>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Base price</span>
            <span className="font-medium">${quote.base_price}</span>
          </div>
          {quote.surcharges.map((s, i) => (
            <div key={i} className="flex justify-between text-sm text-slate-600">
              <span>{s.label}</span>
              <span className="font-medium text-orange-600">+${s.amount}</span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Possible Additional Charges</p>
        {[
          assessment?.heavy_material_flag && '⚠️ Heavy materials may add cost',
          assessment?.stairs_flag && '🪜 Stairs / difficult access',
          lead?.junk_location === 'upstairs' && '🏠 Interior carry',
        ].filter(Boolean).map((item, i) => (
          <div key={i} className="text-xs text-slate-500 flex items-center gap-2">
            <span>{item}</span>
          </div>
        ))}
        {!assessment?.heavy_material_flag && !assessment?.stairs_flag && (
          <p className="text-xs text-slate-500">No additional charges expected based on your info</p>
        )}
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex gap-3">
        <Shield className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-emerald-700"><span className="font-semibold">Our Price Guarantee:</span> Your final price will always be confirmed before we begin any work. No surprises.</p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={onBookService}
          className="w-full h-14 text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-2xl"
        >
          <Calendar className="w-5 h-5 mr-2" />
          Book Service Now
        </Button>
        <Button
          variant="outline"
          className="w-full h-14 text-base font-semibold rounded-2xl border-2"
          onClick={() => window.location.href = `tel:`}
        >
          <Phone className="w-5 h-5 mr-2" />
          Request Callback
        </Button>
      </div>
    </div>
  );
}