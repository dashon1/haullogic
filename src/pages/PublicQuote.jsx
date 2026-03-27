import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import StepIndicator from '@/components/quote/StepIndicator';
import PhotoUploadStep from '@/components/quote/PhotoUploadStep';
import QuestionsStep from '@/components/quote/QuestionsStep';
import ContactStep from '@/components/quote/ContactStep';
import QuoteResult from '@/components/quote/QuoteResult';
import { calculateQuote } from '@/components/quote/pricingEngine';
import { Truck, Loader2, Camera, Brain, ClipboardCheck } from 'lucide-react';

const LOADING_STEPS = [
  { icon: Camera, label: 'Uploading your photos...' },
  { icon: Brain, label: 'AI is analyzing your junk...' },
  { icon: ClipboardCheck, label: 'Calculating your estimate...' },
];

function ProcessingScreen() {
  const [stepIndex, setStepIndex] = React.useState(0);

  React.useEffect(() => {
    const timers = [
      setTimeout(() => setStepIndex(1), 2000),
      setTimeout(() => setStepIndex(2), 5000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const current = LOADING_STEPS[stepIndex];

  return (
    <div className="text-center py-8 space-y-6">
      <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
        <current.icon className="w-10 h-10 text-orange-500" />
      </div>
      <div>
        <Loader2 className="w-6 h-6 animate-spin text-orange-400 mx-auto mb-3" />
        <p className="font-semibold text-slate-800">{current.label}</p>
        <p className="text-slate-400 text-sm mt-1">This takes about 10–20 seconds</p>
      </div>
      <div className="flex justify-center gap-2">
        {LOADING_STEPS.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= stepIndex ? 'w-8 bg-orange-500' : 'w-4 bg-slate-200'}`} />
        ))}
      </div>
    </div>
  );
}

export default function PublicQuote() {
  const { businessId } = useParams();
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState({});
  const [formData, setFormData] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [businessInfo, setBusinessInfo] = useState({ name: 'HaulLogic', phone: '', phoneDisplay: '', responseTime: '1 hour' });
  const [loadingBiz, setLoadingBiz] = useState(true);

  useEffect(() => {
    if (!businessId) { setLoadingBiz(false); return; }
    base44.entities.PricingRule.filter({ BusinessId: businessId, LineType: 'BUSINESS_INFO' })
      .then(records => {
        if (records.length > 0) {
          const r = records[0];
          try {
            const info = JSON.parse(r.ItemOrCondition || '{}');
            setBusinessInfo({
              name: info.name || r.TierLabel || 'HaulLogic',
              phone: info.phone || '',
              phoneDisplay: info.phone || '',
              email: info.email || '',
              responseTime: '1 hour',
            });
          } catch {
            setBusinessInfo(prev => ({ ...prev, name: r.TierLabel || 'HaulLogic' }));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingBiz(false));
  }, [businessId]);

  const handleSubmit = async () => {
    setStep(4);
    setError(null);
    try {
      let assessment = null;
      const photoUrls = Object.values(photos).filter(Boolean);
      if (photoUrls.length > 0) {
        const res = await base44.functions.invoke('analyzePhotos', {
          photo_urls: photoUrls,
          photo_map: photos,
          service_type: formData.service_type,
          junk_location: formData.junk_location,
          heavy_materials: formData.heavy_materials,
          special_items: formData.special_items,
          estimated_size: formData.estimated_size,
        });
        assessment = res.data?.assessment;
      }

      const pricingRules = await base44.entities.PricingRule.filter({ BusinessId: businessId });
      const quote = calculateQuote(assessment, formData, pricingRules);

      const lead = await base44.entities.Lead.create({
        business_id: businessId,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        service_type: formData.service_type,
        junk_location: formData.junk_location,
        heavy_materials: formData.heavy_materials || [],
        special_items: formData.special_items || [],
        estimated_size: formData.estimated_size,
        service_timing: formData.service_timing,
        photo_urls: photoUrls,
        status: 'new',
      });

      const savedQuote = await base44.entities.Quote.create({ business_id: businessId, lead_id: lead.id, ...quote });

      if (assessment) {
        await base44.entities.AIAssessment.create({
          business_id: businessId,
          lead_id: lead.id,
          fill_percent: assessment.estimated_trailer_fill_percent,
          volume_cubic_yards: assessment.estimated_volume_cubic_yards,
          weight_class: assessment.weight_class,
          density_class: assessment.density_class,
          access_difficulty: assessment.access_difficulty,
          heavy_material_flag: assessment.heavy_material_flag,
          stairs_flag: assessment.stairs_flag,
          confidence_score: assessment.confidence_score,
          review_required: assessment.review_required,
          service_recommendation: assessment.service_recommendation,
          estimated_load_bucket: assessment.estimated_load_bucket,
          crew_recommendation: assessment.crew_recommendation,
          visible_items: assessment.visible_items,
          material_categories: assessment.material_categories,
          raw_ai_response: JSON.stringify(assessment),
        });
      }

      setResult({ lead, quote: savedQuote, assessment });
      setStep(5);
    } catch (err) {
      console.error(err);
      setError('Something went wrong generating your quote. Please try again.');
      setStep(3);
    }
  };

  const handleBookService = () => setStep(6);

  if (loadingBiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Truck className="w-12 h-12 text-orange-400 mb-4" />
        <h1 className="text-xl font-bold text-slate-800 mb-2">No business found</h1>
        <p className="text-slate-500 text-sm">This quote link is missing a business ID.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{businessInfo.name}</p>
            <p className="text-sm font-bold text-slate-900 leading-none">Instant Quote</p>
          </div>
        </div>

        {step < 4 && <StepIndicator currentStep={step} />}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          {step === 1 && (
            <PhotoUploadStep photos={photos} setPhotos={setPhotos} onNext={() => setStep(2)} />
          )}
          {step === 2 && (
            <QuestionsStep formData={formData} setFormData={setFormData} onNext={() => setStep(3)} onBack={() => setStep(1)} />
          )}
          {step === 3 && (
            <ContactStep formData={formData} setFormData={setFormData} onSubmit={handleSubmit} onBack={() => setStep(2)} loading={false} />
          )}
          {step === 4 && <ProcessingScreen />}
          {step === 5 && result && (
            <QuoteResult
              quote={result.quote}
              assessment={result.assessment}
              lead={result.lead}
              onBookService={handleBookService}
            />
          )}
          {step === 6 && result && (
            <div className="text-center py-6 space-y-5">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-4xl">✅</span>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">You're all set, {result.lead?.name?.split(' ')[0]}!</h2>
                <p className="text-slate-500 text-sm mt-2">We've received your request and a team member will call you to confirm your appointment.</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 text-left space-y-3">
                <p className="font-semibold text-orange-800 text-sm">What happens next:</p>
                <div className="space-y-2 text-sm text-orange-700">
                  <p>📞 We'll call <strong>{result.lead?.phone}</strong> within {businessInfo.responseTime}</p>
                  <p>📅 You'll confirm your preferred time slot</p>
                  <p>💳 Price locked in before work begins</p>
                </div>
              </div>
              {businessInfo.phone && (
                <div className="pt-2">
                  <p className="text-slate-500 text-xs mb-3">Want to reach us directly?</p>
                  <a href={`tel:${businessInfo.phone}`} className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-orange-600 transition-colors">
                    📞 {businessInfo.phoneDisplay || 'Call Us Now'}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}