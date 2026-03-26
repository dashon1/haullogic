import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Clock, Star, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: Clock, title: 'Instant Estimate', desc: 'Get a price in under 2 minutes — no phone calls required' },
  { icon: Truck, title: 'We Do the Heavy Lifting', desc: 'Drop-off rentals, curbside, or full-service removal' },
  { icon: Shield, title: 'Price Protected', desc: 'Final price always confirmed before work begins. No surprises.' },
];

const reviews = [
  { name: 'Mike R.', text: "Uploaded 4 photos, got a quote immediately. Crew was here next day. Couldn't be easier.", stars: 5 },
  { name: 'Sarah L.', text: 'Cleaned out my entire garage. Fair price, fast service, super professional.', stars: 5 },
  { name: 'David K.', text: 'Used the trailer drop-off. Easy process start to finish.', stars: 5 },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-400 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative max-w-lg mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-orange-500/30">
            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
            Instant AI-Powered Quotes
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
            Junk Gone.<br />
            <span className="text-orange-400">Quote in Seconds.</span>
          </h1>
          <p className="text-slate-300 text-lg mb-8 leading-relaxed">
            Upload a few photos of your junk and get an instant price estimate. No phone calls. No waiting.
          </p>
          <Link to="/GetQuote">
            <Button className="bg-orange-500 hover:bg-orange-400 text-white h-16 px-10 text-lg font-bold rounded-2xl shadow-2xl shadow-orange-500/30 gap-3 group">
              Get Instant Estimate
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="text-slate-500 text-sm mt-4">Takes less than 2 minutes · No commitment required</p>
        </div>
      </div>

      {/* Services */}
      <div className="max-w-lg mx-auto px-6 py-12">
        <p className="text-center text-slate-400 text-xs font-semibold uppercase tracking-widest mb-6">Services</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '🚛', title: 'Trailer Drop-Off', desc: 'You load, we haul' },
            { icon: '🏠', title: 'Curbside Pickup', desc: 'Leave it out front' },
            { icon: '💪', title: 'Full Service', desc: 'We do everything' },
          ].map((s, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl p-4 text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <p className="font-semibold text-slate-800 text-sm">{s.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="bg-slate-50 py-12">
        <div className="max-w-lg mx-auto px-6 space-y-4">
          <p className="text-center text-slate-400 text-xs font-semibold uppercase tracking-widest mb-6">Why HaulLogic</p>
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 flex items-start gap-4 shadow-sm">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <f.icon className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">{f.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="max-w-lg mx-auto px-6 py-12">
        <p className="text-center text-slate-400 text-xs font-semibold uppercase tracking-widest mb-6">Customer Reviews</p>
        <div className="space-y-4">
          {reviews.map((r, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex gap-0.5 mb-2">
                {[...Array(r.stars)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-orange-400 text-orange-400" />
                ))}
              </div>
              <p className="text-slate-700 text-sm leading-relaxed">"{r.text}"</p>
              <p className="text-slate-400 text-xs mt-2 font-medium">— {r.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-orange-500 py-12">
        <div className="max-w-lg mx-auto px-6 text-center">
          <h2 className="text-2xl font-black text-white mb-3">Ready to clear the clutter?</h2>
          <p className="text-orange-100 text-sm mb-6">Upload your photos and get a price right now.</p>
          <Link to="/GetQuote">
            <Button className="bg-white text-orange-600 hover:bg-orange-50 h-14 px-8 text-base font-bold rounded-2xl gap-2 group">
              Start Free Quote
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="py-6 text-center text-slate-400 text-xs space-y-2">
        <p>© 2026 HaulLogic · Licensed & Insured</p>
        <p>
          <Link to="/pricing" className="hover:text-orange-500 transition-colors">
            🚛 Are you a hauling business? Use HaulLogic for your customers →
          </Link>
        </p>
      </div>
    </div>
  );
}