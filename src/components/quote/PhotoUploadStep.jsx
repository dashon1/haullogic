import React, { useState, useRef } from 'react';
import { Upload, X, Camera, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

const tips = [
  { icon: '📸', text: 'Stand back so we can see the whole pile' },
  { icon: '🔍', text: 'Take one close photo of largest items' },
  { icon: '🌐', text: 'Take one wide shot showing all the junk' },
  { icon: '🚪', text: 'Include surrounding area & access path' },
];

export default function PhotoUploadStep({ photos, setPhotos, onNext }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const handleFiles = async (files) => {
    const fileArr = Array.from(files).slice(0, 8 - photos.length);
    if (!fileArr.length) return;
    setUploading(true);
    const uploaded = [];
    for (const file of fileArr) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploaded.push(file_url);
    }
    setPhotos(prev => [...prev, ...uploaded]);
    setUploading(false);
  };

  const removePhoto = (idx) => setPhotos(prev => prev.filter((_, i) => i !== idx));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Upload Your Photos</h2>
        <p className="text-slate-500 text-sm">3–8 photos give us the most accurate estimate</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {tips.map((t, i) => (
          <div key={i} className="flex items-start gap-2 bg-orange-50 rounded-xl p-3">
            <span className="text-lg">{t.icon}</span>
            <p className="text-xs text-slate-700 leading-snug">{t.text}</p>
          </div>
        ))}
      </div>

      <div
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${dragOver ? 'border-orange-400 bg-orange-50' : 'border-slate-200 hover:border-orange-300 hover:bg-orange-50/50'}`}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center">
            <Camera className="w-7 h-7 text-orange-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-700">Tap to add photos</p>
            <p className="text-sm text-slate-400 mt-0.5">or drag & drop here</p>
          </div>
          {uploading && <div className="text-sm text-orange-500 font-medium animate-pulse">Uploading...</div>}
        </div>
        <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
      </div>

      {photos.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-slate-700">{photos.length} photo{photos.length > 1 ? 's' : ''} added</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={onNext}
        disabled={photos.length < 1}
        className="w-full h-14 text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-2xl disabled:opacity-40"
      >
        Next →
      </Button>
      {photos.length < 3 && photos.length > 0 && (
        <p className="text-center text-xs text-slate-400">More photos = more accurate estimate (min. 3 recommended)</p>
      )}
    </div>
  );
}