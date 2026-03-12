import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import StepIndicator from '@/components/quote/StepIndicator';
import PhotoUploadStep from '@/components/quote/PhotoUploadStep';
import QuestionsStep from '@/components/quote/QuestionsStep';
import ContactStep from '@/components/quote/ContactStep';
import QuoteResult from '@/components/quote/QuoteResult';
import { Truck } from 'lucide-react';

const PRICING = {
  base: {
    minimum: 125, eighth: 150, quarter: 225,
    half: 375, three_quarter: 575, full: 750
  },
  surcharges: {
    mattress: { label: 'Mattress', amount: 25 },
    refrigerator: { label: 'Refrigerator', amount: 50 },
    tires: { label: 'Tires (each)', amount: 15 },
    paint: { label: 'Paint / Hazmat', amount: 35 },
    hot_tub: { label: 'Hot Tub', amount: 150 },
    piano: { label: 'Piano', amount: 200 },
    tv: { label: 'TV / Electronics', amount: 20 },
  }
};

function getBucket(fill) {
  if (fill <= 10) return 'minimum';
  if (fill <= 20) return 'eighth';
  if (fill <= 40) return 'quarter';
  if (fill <= 60) return 'half';
  if (fill <= 85) return 'three_quarter';
  return 'full';
}

function calculateQuote(assessment, formData) {
  const bucket = assessment?.estimated_load_bucket || getBucket(assessment?.estimated_trailer_fill_percent || 25);
  const base = PRICING.base[bucket] || 225;
  const surcharges = [];

  const items = formData.special_items || [];
  items.forEach(item => {
    if (item !== 'none' && PRICING.surcharges[item]) {
      surcharges.push(PRICING.surcharges[item]);
    }
  });

  const heavyMats = formData.heavy_materials || [];
  if (heavyMats.some(m => m !== 'none')) {
    surcharges.push({ label: 'Heavy Materials', amount: 50 });
  }
  if (formData.junk_location === 'upstairs') {
    surcharges.push({ label: 'Upstairs / Stairs', amount: 25 });
  }
  if (formData.service_timing === 'today') {
    surcharges.push({ label: 'Same-Day Service', amount: 40 });
  }

  const total = base + surcharges.reduce((s, c) => s + c.amount, 0);
  const margin = Math.round(total * 0.2 / 5) * 5;

  const score = assessment?.confidence_score || 0;
  const confidence = score >= 0.75 ? 'high' : score >= 0.55 ? 'medium' : 'low';

  return {
    base_price: base,
    surcharges,
    estimate_min: total,
    estimate_max: total + margin,
    load_size_label: bucket,
    confidence_level: confidence
  };
}

export default function GetQuote() {
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState({});
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let assessment = null;
      if (photos.length > 0) {
        const res = await base44.functions.invoke('analyzePhotos', {
          photo_urls: photos,
          service_type: formData.service_type,
          junk_location: formData.junk_location,
          heavy_materials: formData.heavy_materials,
          special_items: formData.special_items,
          estimated_size: formData.estimated_size,
        });
        assessment = res.data?.assessment;
      }

      const quote = calculateQuote(assessment, formData);

      const lead = await base44.entities.Lead.create({
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
        photo_urls: photos,
        status: 'new',
      });

      const savedQuote = await base44.entities.Quote.create({
        lead_id: lead.id,
        ...quote,
      });

      if (assessment) {
        await base44.entities.AIAssessment.create({
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
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Dump Haul</p>
            <p className="text-sm font-bold text-slate-900 leading-none">Instant Quote</p>
          </div>
        </div>

        {step < 5 && <StepIndicator currentStep={step} />}

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          {step === 1 && (
            <PhotoUploadStep
              photos={photos}
              setPhotos={setPhotos}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <QuestionsStep
              formData={formData}
              setFormData={setFormData}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <ContactStep
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              onBack={() => setStep(2)}
              loading={loading}
            />
          )}
          {step === 5 && result && (
            <QuoteResult
              quote={result.quote}
              assessment={result.assessment}
              lead={result.lead}
              onBookService={() => alert('Booking confirmed! We\'ll call you shortly to schedule.')}
            />
          )}
        </div>
      </div>
    </div>
  );
}