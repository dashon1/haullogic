import React, { useState, useRef } from 'react';
import { X, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

const PHOTO_SLOTS = [
  {
    id: 'wide',
    label: 'Wide Shot',
    icon: '🌐',
    instruction: 'Stand back and capture ALL the junk in one frame',
    tip: 'We need to see everything — back up as far as possible',
    required: true,
  },
  {
    id: 'left',
    label: 'Left Angle',
    icon: '↙️',
    instruction: 'Move to the left side and shoot at an angle',
    tip: 'Helps us judge depth and hidden items on the left',
    required: true,
  },
  {
    id: 'right',
    label: 'Right Angle',
    icon: '↘️',
    instruction: 'Move to the right side and shoot at an angle',
    tip: 'Helps us judge depth and hidden items on the right',
    required: true,
  },
  {
    id: 'closeup',
    label: 'Close-Up',
    icon: '🔍',
    instruction: 'Get close to your largest or heaviest items',
    tip: 'We need to identify material types and special items',
    required: true,
  },
  {
    id: 'access',
    label: 'Access Path',
    icon: '🚪',
    instruction: 'Show the path our crew will take to reach the junk',
    tip: 'Include doorways, hallways, or driveway entrance',
    required: false,
  },
  {
    id: 'stairs',
    label: 'Stairs / Obstacles',
    icon: '🪜',
    instruction: 'If there are stairs or tight spaces, photograph them',
    tip: 'Skip this if everything is at ground level',
    required: false,
  },
];

export default function PhotoUploadStep({ photos, setPhotos, onNext }) {
  // photos is now an object: { wide: url, left: url, ... }
  const [activeSlot, setActiveSlot] = useState(0);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const slot = PHOTO_SLOTS[activeSlot];
  const uploadedCount = PHOTO_SLOTS.filter(s => photos[s.id]).length;
  const requiredDone = PHOTO_SLOTS.filter(s => s.required).every(s => photos[s.id]);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPhotos(prev => ({ ...prev, [slot.id]: file_url }));
    setUploading(false);
    // Auto-advance to next empty slot
    const nextEmpty = PHOTO_SLOTS.findIndex((s, i) => i > activeSlot && !photos[s.id]);
    if (nextEmpty !== -1) setActiveSlot(nextEmpty);
  };

  const removePhoto = (slotId) => {
    setPhotos(prev => {
      const updated = { ...prev };
      delete updated[slotId];
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Guided Photo Capture</h2>
        <p className="text-slate-500 text-sm">6 specific shots give our AI the best accuracy</p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {PHOTO_SLOTS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActiveSlot(i)}
            className={`transition-all duration-200 rounded-full ${
              i === activeSlot
                ? 'w-8 h-3 bg-orange-500'
                : photos[s.id]
                ? 'w-3 h-3 bg-emerald-400'
                : 'w-3 h-3 bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Active slot card */}
      <div className="rounded-2xl border-2 border-orange-200 bg-orange-50/40 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{slot.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-slate-900 text-lg">{slot.label}</p>
              {!slot.required && (
                <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">Optional</span>
              )}
            </div>
            <p className="text-sm text-slate-600">{slot.instruction}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl px-3 py-2 border border-orange-100">
          <p className="text-xs text-orange-700">💡 {slot.tip}</p>
        </div>

        {photos[slot.id] ? (
          <div className="relative rounded-xl overflow-hidden aspect-video group">
            <img src={photos[slot.id]} alt={slot.label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
              <button
                onClick={() => removePhoto(slot.id)}
                className="opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-2 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute top-2 left-2 bg-emerald-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Captured
            </div>
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-orange-300 rounded-xl p-8 text-center cursor-pointer hover:bg-orange-50 transition-colors"
            onClick={() => inputRef.current.click()}
          >
            <p className="text-4xl mb-2">{slot.icon}</p>
            <p className="font-semibold text-slate-700">Tap to take or upload photo</p>
            <p className="text-xs text-slate-400 mt-1">JPG, PNG supported</p>
            {uploading && <p className="text-sm text-orange-500 font-medium animate-pulse mt-2">Uploading...</p>}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => handleFile(e.target.files[0])}
        />
      </div>

      {/* All slots overview */}
      <div className="grid grid-cols-3 gap-2">
        {PHOTO_SLOTS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActiveSlot(i)}
            className={`rounded-xl border-2 p-2 text-center transition-all duration-150 ${
              i === activeSlot
                ? 'border-orange-500 bg-orange-50'
                : photos[s.id]
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-slate-200 bg-white hover:border-orange-200'
            }`}
          >
            {photos[s.id] ? (
              <img src={photos[s.id]} alt={s.label} className="w-full aspect-square object-cover rounded-lg mb-1" />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center text-2xl rounded-lg bg-slate-50 mb-1">
                {s.icon}
              </div>
            )}
            <p className="text-xs font-medium text-slate-600 leading-tight">{s.label}</p>
            {s.required && !photos[s.id] && (
              <p className="text-xs text-orange-400">Required</p>
            )}
          </button>
        ))}
      </div>

      {/* Nav + Next */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setActiveSlot(Math.max(0, activeSlot - 1))}
          disabled={activeSlot === 0}
          className="h-12 w-12 rounded-xl p-0 flex-shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Button
          variant="outline"
          onClick={() => setActiveSlot(Math.min(PHOTO_SLOTS.length - 1, activeSlot + 1))}
          disabled={activeSlot === PHOTO_SLOTS.length - 1}
          className="h-12 w-12 rounded-xl p-0 flex-shrink-0"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
        <Button
          onClick={onNext}
          disabled={!requiredDone}
          className="flex-1 h-12 text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-xl disabled:opacity-40"
        >
          {requiredDone ? `Continue (${uploadedCount} photos) →` : `${PHOTO_SLOTS.filter(s => s.required && !photos[s.id]).length} required shots left`}
        </Button>
      </div>
    </div>
  );
}