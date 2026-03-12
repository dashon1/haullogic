import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import StepIndicator from '@/components/quote/StepIndicator';
import PhotoUploadStep from '@/components/quote/PhotoUploadStep';
import QuestionsStep from '@/components/quote/QuestionsStep';
import ContactStep from '@/components/quote/ContactStep';
import QuoteResult from '@/components/quote/QuoteResult';
import { calculateQuote } from '@/components/quote/pricingEngine';
import { Truck } from 'lucide-react';

const BUSINESS_ID = 'ALLIN_TB'; // Default business — can be made dynamic later

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

      // Load dynamic pricing rules for this business
      const pricingRules = await base44.entities.PricingRule.filter({ BusinessId: BUSINESS_ID });
      const quote = calculateQuote(assessment, formData, pricingRules);

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
        photo_urls: photoUrls,
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