import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Phone, CheckCircle, AlertTriangle } from 'lucide-react';

const statusColors = {
  new: 'bg-blue-100 text-blue-700',
  reviewed: 'bg-slate-100 text-slate-600',
  approved: 'bg-emerald-100 text-emerald-700',
  booked: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

const confidenceConfig = {
  high: { label: 'High', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle },
  medium: { label: 'Medium', color: 'text-amber-600 bg-amber-50', icon: AlertTriangle },
  low: { label: 'Low — Review', color: 'text-red-600 bg-red-50', icon: AlertTriangle },
};

export default function LeadRow({ lead, quote, assessment, onView }) {
  const conf = confidenceConfig[quote?.confidence_level] || confidenceConfig.medium;
  const ConfIcon = conf.icon;
  const displayMin = quote?.admin_adjusted_min || quote?.estimate_min;
  const displayMax = quote?.admin_adjusted_max || quote?.estimate_max;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-900">{lead.name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[lead.status] || statusColors.new}`}>
              {lead.status}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5 truncate">{lead.address}</p>
          <p className="text-xs text-slate-400 mt-0.5">{new Date(lead.created_date).toLocaleDateString()}</p>
        </div>
        <div className="text-right flex-shrink-0">
          {quote ? (
            <>
              <p className="font-bold text-slate-900">${displayMin}–${displayMax}</p>
              <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${conf.color}`}>
                <ConfIcon className="w-3 h-3" />
                {conf.label}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">No quote</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <Button onClick={onView} size="sm" variant="outline" className="flex-1 h-8 text-xs rounded-xl gap-1.5">
          <Eye className="w-3.5 h-3.5" />
          View Details
        </Button>
        <a href={`tel:${lead.phone}`}>
          <Button size="sm" variant="outline" className="h-8 px-3 rounded-xl">
            <Phone className="w-3.5 h-3.5" />
          </Button>
        </a>
      </div>
    </div>
  );
}