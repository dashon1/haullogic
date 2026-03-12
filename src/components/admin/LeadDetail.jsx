import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle, Phone, Mail, MapPin, Package, Camera, AlertTriangle, Loader2 } from 'lucide-react';

const serviceLabels = {
  trailer_drop_off: 'Trailer Drop-Off', curbside_pickup: 'Curbside Pickup', full_service: 'Full Service'
};
const statusOptions = ['new', 'reviewed', 'approved', 'booked', 'completed', 'cancelled'];

export default function LeadDetail({ lead, quote, assessment, onClose, onUpdate }) {
  const [adjustedMin, setAdjustedMin] = useState(quote?.admin_adjusted_min || quote?.estimate_min || '');
  const [adjustedMax, setAdjustedMax] = useState(quote?.admin_adjusted_max || quote?.estimate_max || '');
  const [adminNotes, setAdminNotes] = useState(quote?.admin_notes || '');
  const [status, setStatus] = useState(lead?.status || 'new');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    if (quote?.id) {
      await base44.entities.Quote.update(quote.id, {
        admin_adjusted_min: Number(adjustedMin),
        admin_adjusted_max: Number(adjustedMax),
        admin_notes: adminNotes,
      });
    }
    await base44.entities.Lead.update(lead.id, { status });
    setSaving(false);
    onUpdate();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="font-bold text-slate-900">Lead Details</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Contact</p>
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-700"><Phone className="w-4 h-4 text-slate-400" /><a href={`tel:${lead.phone}`} className="font-medium text-orange-500 hover:underline">{lead.phone}</a></div>
              <div className="flex items-center gap-2 text-sm text-slate-700"><Mail className="w-4 h-4 text-slate-400" /><span>{lead.email}</span></div>
              <div className="flex items-center gap-2 text-sm text-slate-700"><MapPin className="w-4 h-4 text-slate-400" /><span>{lead.address}</span></div>
              <div className="flex items-center gap-2 text-sm text-slate-700"><Package className="w-4 h-4 text-slate-400" /><span>{serviceLabels[lead.service_type] || lead.service_type}</span></div>
            </div>
          </div>

          {/* Photos */}
          {lead.photo_urls?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Photos ({lead.photo_urls.length})</p>
              <div className="grid grid-cols-3 gap-2">
                {lead.photo_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-xl overflow-hidden block">
                    <img src={url} alt="" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* AI Assessment */}
          {assessment && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">AI Assessment</p>
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-xs text-slate-400">Trailer Fill</p><p className="font-semibold">{assessment.fill_percent}%</p></div>
                  <div><p className="text-xs text-slate-400">Weight Class</p><p className="font-semibold capitalize">{assessment.weight_class}</p></div>
                  <div><p className="text-xs text-slate-400">Access</p><p className="font-semibold capitalize">{assessment.access_difficulty}</p></div>
                  <div><p className="text-xs text-slate-400">Crew Needed</p><p className="font-semibold">{assessment.crew_recommendation} person{assessment.crew_recommendation > 1 ? 's' : ''}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${(assessment.confidence_score || 0) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium text-slate-600">{Math.round((assessment.confidence_score || 0) * 100)}% confident</span>
                </div>
                {assessment.heavy_material_flag && (
                  <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl p-2 text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    Heavy materials detected
                  </div>
                )}
                {assessment.visible_items?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Detected Items</p>
                    <div className="flex flex-wrap gap-1">
                      {assessment.visible_items.map((item, i) => (
                        <span key={i} className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                          {item.type} {item.count > 1 ? `×${item.count}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quote Adjustment */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Quote Adjustment</p>
            <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
              {quote && (
                <div className="text-sm text-slate-600">
                  AI suggested: <span className="font-semibold">${quote.estimate_min}–${quote.estimate_max}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Adjusted Min ($)</p>
                  <Input value={adjustedMin} onChange={e => setAdjustedMin(e.target.value)} className="h-10 rounded-xl" type="number" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Adjusted Max ($)</p>
                  <Input value={adjustedMax} onChange={e => setAdjustedMax(e.target.value)} className="h-10 rounded-xl" type="number" />
                </div>
              </div>
              <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Internal notes..." className="rounded-xl text-sm" rows={2} />
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium capitalize border transition-all ${status === s ? 'bg-orange-500 text-white border-orange-500' : 'border-slate-200 text-slate-600 hover:border-orange-300'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-semibold">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-2" />Save Changes</>}
          </Button>
        </div>
      </div>
    </div>
  );
}