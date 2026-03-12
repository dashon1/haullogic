import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Truck, MapPin, Phone, Navigation, Clock, Package, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATUS_COLORS = {
  booked: 'bg-blue-100 text-blue-700',
  approved: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
};

const SIZE_LABELS = {
  one_item: 'Single Item',
  small_pile: 'Small Pile',
  quarter_trailer: '1/4 Trailer',
  half_trailer: '1/2 Trailer',
  three_quarter_trailer: '3/4 Trailer',
  full_trailer: 'Full Trailer',
  not_sure: 'TBD',
};

const SERVICE_LABELS = {
  full_service: 'Full Service',
  curbside_pickup: 'Curbside',
  trailer_drop_off: 'Drop-Off',
};

export default function DriverView() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('booked');

  const loadLeads = async () => {
    setLoading(true);
    const all = await base44.entities.Lead.list('-created_date', 200);
    setLeads(all);
    setLoading(false);
  };

  useEffect(() => { loadLeads(); }, []);

  const navigate = (address) => {
    const encoded = encodeURIComponent(address);
    // Try to open native maps app, falls back to Google Maps web
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=driving`, '_blank');
  };

  const call = (phone) => {
    window.open(`tel:${phone}`);
  };

  const markComplete = async (lead) => {
    await base44.entities.Lead.update(lead.id, { status: 'completed' });
    loadLeads();
  };

  const filtered = leads.filter(l =>
    filter === 'all'
      ? ['booked', 'approved'].includes(l.status)
      : l.status === filter
  );

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Dump Haul</p>
              <p className="font-bold text-white text-lg leading-none">Driver View</p>
            </div>
          </div>
          <button onClick={loadLeads} className="text-slate-400 hover:text-white transition-colors p-2">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { key: 'booked', label: 'Booked' },
            { key: 'approved', label: 'Approved' },
            { key: 'all', label: 'All Active' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 text-sm font-semibold py-2 rounded-xl transition-all ${
                filter === tab.key
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Job count */}
        <p className="text-slate-400 text-sm mb-3">
          {loading ? 'Loading...' : `${filtered.length} job${filtered.length !== 1 ? 's' : ''}`}
        </p>

        {/* Jobs list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-800 rounded-2xl h-40 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-slate-400">No active jobs</p>
            <p className="text-sm mt-1">Booked and approved jobs appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(lead => (
              <div key={lead.id} className="bg-slate-800 rounded-2xl p-4 space-y-4">
                {/* Customer info */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-lg leading-tight">{lead.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                      <p className="text-slate-300 text-sm truncate">{lead.address}</p>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 ml-2 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[lead.status] || 'bg-slate-700 text-slate-300'}`}>
                    {lead.status}
                  </span>
                </div>

                {/* Job details */}
                <div className="flex gap-2 flex-wrap">
                  {lead.service_type && (
                    <span className="bg-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-lg">
                      {SERVICE_LABELS[lead.service_type] || lead.service_type}
                    </span>
                  )}
                  {lead.estimated_size && (
                    <span className="bg-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {SIZE_LABELS[lead.estimated_size] || lead.estimated_size}
                    </span>
                  )}
                  {lead.service_timing && (
                    <span className="bg-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {lead.service_timing.replace('_', ' ')}
                    </span>
                  )}
                </div>

                {/* Notes */}
                {lead.notes && (
                  <p className="text-slate-400 text-sm bg-slate-700/50 rounded-xl px-3 py-2">
                    📝 {lead.notes}
                  </p>
                )}

                {/* Special items */}
                {lead.special_items?.filter(i => i !== 'none').length > 0 && (
                  <p className="text-amber-400 text-xs font-medium">
                    ⚠️ Special items: {lead.special_items.filter(i => i !== 'none').join(', ')}
                  </p>
                )}
                {lead.heavy_materials?.filter(i => i !== 'none').length > 0 && (
                  <p className="text-red-400 text-xs font-medium">
                    🏗️ Heavy materials: {lead.heavy_materials.filter(i => i !== 'none').join(', ')}
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={() => navigate(lead.address)}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-11 font-semibold gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    Navigate
                  </Button>
                  <Button
                    onClick={() => call(lead.phone)}
                    variant="outline"
                    className="w-11 h-11 rounded-xl p-0 border-slate-600 text-slate-300 hover:text-white hover:border-slate-400"
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                  {lead.status !== 'completed' && (
                    <Button
                      onClick={() => markComplete(lead)}
                      variant="outline"
                      className="h-11 px-3 rounded-xl border-emerald-700 text-emerald-400 hover:bg-emerald-900 text-xs font-semibold"
                    >
                      Done ✓
                    </Button>
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