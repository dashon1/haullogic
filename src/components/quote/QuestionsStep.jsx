import React from 'react';
import { Button } from '@/components/ui/button';

const serviceTypes = [
  { value: 'trailer_drop_off', label: 'Trailer Drop Off', desc: 'You Load', icon: '🚛' },
  { value: 'curbside_pickup', label: 'Curbside Pickup', desc: 'We Pick Up', icon: '🏠' },
  { value: 'full_service', label: 'Full Service', desc: 'We Load', icon: '💪' },
];

const locations = [
  { value: 'curb', label: 'Curb', icon: '🛣️' },
  { value: 'driveway', label: 'Driveway', icon: '🏡' },
  { value: 'garage', label: 'Garage', icon: '🚗' },
  { value: 'inside_home', label: 'Inside Home', icon: '🏠' },
  { value: 'backyard', label: 'Backyard', icon: '🌿' },
  { value: 'upstairs', label: 'Upstairs', icon: '🪜' },
];

const heavyMaterials = [
  { value: 'none', label: 'None', icon: '✅' },
  { value: 'dirt', label: 'Dirt', icon: '🟫' },
  { value: 'concrete', label: 'Concrete', icon: '🧱' },
  { value: 'roofing_shingles', label: 'Shingles', icon: '🏚️' },
  { value: 'bricks', label: 'Bricks', icon: '🧱' },
  { value: 'tile', label: 'Tile', icon: '⬛' },
];

const specialItems = [
  { value: 'none', label: 'None', icon: '✅' },
  { value: 'mattress', label: 'Mattress', icon: '🛏️' },
  { value: 'refrigerator', label: 'Refrigerator', icon: '🧊' },
  { value: 'tv', label: 'TV', icon: '📺' },
  { value: 'tires', label: 'Tires', icon: '⚫' },
  { value: 'paint', label: 'Paint', icon: '🪣' },
  { value: 'hot_tub', label: 'Hot Tub', icon: '🛁' },
  { value: 'piano', label: 'Piano', icon: '🎹' },
];

const sizes = [
  { value: 'one_item', label: 'One Item', icon: '📦' },
  { value: 'small_pile', label: 'Small Pile', icon: '🗑️' },
  { value: 'quarter_trailer', label: '¼ Trailer', icon: '🔲' },
  { value: 'half_trailer', label: '½ Trailer', icon: '🔳' },
  { value: 'three_quarter_trailer', label: '¾ Trailer', icon: '⬜' },
  { value: 'full_trailer', label: 'Full Trailer', icon: '🟦' },
  { value: 'not_sure', label: 'Not Sure', icon: '🤔' },
];

const timings = [
  { value: 'today', label: 'Today', icon: '⚡' },
  { value: 'tomorrow', label: 'Tomorrow', icon: '📅' },
  { value: 'this_week', label: 'This Week', icon: '🗓️' },
  { value: 'flexible', label: 'Flexible', icon: '😊' },
];

function OptionButton({ option, selected, onToggle, multi }) {
  const isSelected = multi ? selected?.includes(option.value) : selected === option.value;
  return (
    <button
      onClick={() => onToggle(option.value)}
      className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 text-center transition-all duration-150 ${
        isSelected
          ? 'border-orange-500 bg-orange-50 text-orange-700'
          : 'border-slate-200 bg-white text-slate-600 hover:border-orange-300'
      }`}
    >
      <span className="text-xl">{option.icon}</span>
      <span className="text-xs font-medium leading-tight">{option.label}</span>
      {option.desc && <span className="text-xs text-slate-400">{option.desc}</span>}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

export default function QuestionsStep({ formData, setFormData, onNext, onBack }) {
  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const toggleMulti = (key, val) => {
    setFormData(prev => {
      const arr = prev[key] || [];
      const hasNone = val === 'none';
      if (hasNone) return { ...prev, [key]: ['none'] };
      const withoutNone = arr.filter(v => v !== 'none');
      return {
        ...prev,
        [key]: withoutNone.includes(val) ? withoutNone.filter(v => v !== val) : [...withoutNone, val]
      };
    });
  };

  const canProceed = formData.service_type && formData.junk_location && formData.estimated_size && formData.service_timing;

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Tell Us About the Job</h2>
        <p className="text-slate-500 text-sm">A few quick questions improve your estimate accuracy</p>
      </div>

      <Section title="What service do you need?">
        <div className="grid grid-cols-3 gap-2">
          {serviceTypes.map(o => (
            <OptionButton key={o.value} option={o} selected={formData.service_type} onToggle={v => set('service_type', v)} />
          ))}
        </div>
      </Section>

      <Section title="Where is the junk located?">
        <div className="grid grid-cols-3 gap-2">
          {locations.map(o => (
            <OptionButton key={o.value} option={o} selected={formData.junk_location} onToggle={v => set('junk_location', v)} />
          ))}
        </div>
      </Section>

      <Section title="Any heavy materials?">
        <div className="grid grid-cols-3 gap-2">
          {heavyMaterials.map(o => (
            <OptionButton key={o.value} option={o} selected={formData.heavy_materials} onToggle={v => toggleMulti('heavy_materials', v)} multi />
          ))}
        </div>
      </Section>

      <Section title="Special items? (select all that apply)">
        <div className="grid grid-cols-4 gap-2">
          {specialItems.map(o => (
            <OptionButton key={o.value} option={o} selected={formData.special_items} onToggle={v => toggleMulti('special_items', v)} multi />
          ))}
        </div>
      </Section>

      <Section title="How much junk?">
        <div className="grid grid-cols-4 gap-2">
          {sizes.map(o => (
            <OptionButton key={o.value} option={o} selected={formData.estimated_size} onToggle={v => set('estimated_size', v)} />
          ))}
        </div>
      </Section>

      <Section title="When do you need service?">
        <div className="grid grid-cols-4 gap-2">
          {timings.map(o => (
            <OptionButton key={o.value} option={o} selected={formData.service_timing} onToggle={v => set('service_timing', v)} />
          ))}
        </div>
      </Section>

      <div className="flex gap-3 pt-2">
        <Button onClick={onBack} variant="outline" className="flex-1 h-14 rounded-2xl text-base font-semibold">
          ← Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="flex-[2] h-14 text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-2xl disabled:opacity-40"
        >
          Next →
        </Button>
      </div>
    </div>
  );
}