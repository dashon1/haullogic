import React from 'react';
import { Check } from 'lucide-react';

const steps = ['Photos', 'Details', 'Contact', 'Your Quote'];

export default function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, i) => {
        const stepNum = i + 1;
        const isComplete = currentStep > stepNum;
        const isActive = currentStep === stepNum;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                isComplete ? 'bg-emerald-500 text-white' :
                isActive ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' :
                'bg-slate-100 text-slate-400'
              }`}>
                {isComplete ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              <span className={`text-xs mt-1 font-medium ${isActive ? 'text-orange-500' : isComplete ? 'text-emerald-500' : 'text-slate-400'}`}>
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-8 mb-4 mx-1 transition-all duration-300 ${currentStep > stepNum ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}