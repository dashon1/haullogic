import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import LeadRow from '@/components/admin/LeadRow';
import LeadDetail from '@/components/admin/LeadDetail';
import { Truck, Users, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const filterTabs = ['All', 'New', 'Reviewed', 'Approved', 'Booked', 'Completed'];

export default function AdminDashboard() {
  const [leads, setLeads] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedLead, setSelectedLead] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const [l, q, a] = await Promise.all([
      base44.entities.Lead.list('-created_date', 100),
      base44.entities.Quote.list('-created_date', 100),
      base44.entities.AIAssessment.list('-created_date', 100),
    ]);
    setLeads(l);
    setQuotes(q);
    setAssessments(a);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const getQuote = (leadId) => quotes.find(q => q.lead_id === leadId);
  const getAssessment = (leadId) => assessments.find(a => a.lead_id === leadId);

  const filteredLeads = leads.filter(l =>
    selectedFilter === 'All' || l.status === selectedFilter.toLowerCase()
  );

  const newCount = leads.filter(l => l.status === 'new').length;
  const reviewCount = leads.filter(l => {
    const a = getAssessment(l.id);
    return a?.review_required || a?.confidence_score < 0.6;
  }).length;
  const avgQuote = quotes.length
    ? Math.round(quotes.reduce((s, q) => s + (q.estimate_min + q.estimate_max) / 2, 0) / quotes.length)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Dump Haul</p>
              <p className="font-bold text-slate-900 text-lg leading-none">Admin Dashboard</p>
            </div>
          </div>
          <Button onClick={loadData} variant="outline" size="sm" className="gap-1.5 rounded-xl">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-slate-900">{newCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">New Leads</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center mb-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-slate-900">{reviewCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Need Review</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center mb-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-slate-900">${avgQuote}</p>
            <p className="text-xs text-slate-500 mt-0.5">Avg Quote</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
          {filterTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedFilter(tab)}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                selectedFilter === tab
                  ? 'bg-orange-500 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-300'
              }`}
            >
              {tab}
              {tab === 'New' && newCount > 0 && (
                <span className="ml-1.5 bg-white/30 text-white text-xs px-1.5 py-0 rounded-full">
                  {newCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Leads */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 h-24 animate-pulse" />
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No leads yet</p>
            <p className="text-sm mt-1">Leads from the quote form will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map(lead => (
              <LeadRow
                key={lead.id}
                lead={lead}
                quote={getQuote(lead.id)}
                assessment={getAssessment(lead.id)}
                onView={() => setSelectedLead(lead)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedLead && (
        <LeadDetail
          lead={selectedLead}
          quote={getQuote(selectedLead.id)}
          assessment={getAssessment(selectedLead.id)}
          onClose={() => setSelectedLead(null)}
          onUpdate={() => { setSelectedLead(null); loadData(); }}
        />
      )}
    </div>
  );
}