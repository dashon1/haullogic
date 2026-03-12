import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, CheckCircle, AlertCircle, Download, Trash2 } from 'lucide-react';

export default function PricingUpload({ onUploaded }) {
  const [businessId, setBusinessId] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !businessId.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const text = await file.text();
    const res = await base44.functions.invoke('processPricingUpload', {
      csv_text: text,
      business_id: businessId.trim(),
    });

    if (res.data?.success) {
      setResult(res.data);
      setFile(null);
      fileRef.current.value = '';
      onUploaded?.();
    } else {
      setError(res.data?.error || 'Upload failed');
    }
    setLoading(false);
  };

  const downloadTemplate = () => {
    const headers = 'BusinessId,Region,ServiceType,TierCode,TierLabel,TierOrder,LineType,ItemOrCondition,AmountMin,AmountMax,Unit,Trigger,DisposalCredit,Notes';
    const sample = [
      'MYBIZ_01,Tampa Bay FL,FullService,MIN,Minimum (1-2 items),1,BASE,Base Price,125,125,flat,,,Includes standard disposal',
      'MYBIZ_01,Tampa Bay FL,FullService,QTR,1/4 Load,2,BASE,Base Price,225,225,flat,,,',
      'MYBIZ_01,Tampa Bay FL,FullService,HALF,1/2 Load,3,BASE,Base Price,375,375,flat,,,',
      'MYBIZ_01,Tampa Bay FL,FullService,3QTR,3/4 Load,4,BASE,Base Price,525,525,flat,,,',
      'MYBIZ_01,Tampa Bay FL,FullService,FULL,Full Load,5,BASE,Base Price,675,675,flat,,,',
      'MYBIZ_01,Tampa Bay FL,Curbside,ANY,Any Load,1,DISCOUNT,Curbside Discount,-25,-25,flat,curbside_ready,,Save $25 when items are outside',
      'MYBIZ_01,Tampa Bay FL,FullService,ANY,Any Load,1,ADDON,Refrigerator,125,175,per_item,,,',
      'MYBIZ_01,Tampa Bay FL,FullService,ANY,Any Load,1,ADDON,Mattress,25,25,per_item,,,',
      'MYBIZ_01,Tampa Bay FL,FullService,ANY,Any Load,1,ADDON,Hot Tub,150,150,per_item,,,',
      'MYBIZ_01,Tampa Bay FL,FullService,ANY,Any Load,1,ADDON,Heavy Overage,40,40,per_250lb,heavy_material,,Concrete/dirt/shingles',
      'MYBIZ_01,Tampa Bay FL,FullService,ANY,Any Load,1,ADDON,Upstairs,25,25,per_flight,stairs,,Per flight of stairs',
      'MYBIZ_01,Tampa Bay FL,FullService,ANY,Any Load,1,ADDON,Same-Day,40,40,flat,same_day,,',
      'MYBIZ_01,Tampa Bay FL,DropOff,HALF_DAY,Half Day,1,BASE,Base Price,175,175,flat,,150,Disposal credit included',
      'MYBIZ_01,Tampa Bay FL,DropOff,FULL_DAY,Full Day,2,BASE,Base Price,225,225,flat,,150,',
      'MYBIZ_01,Tampa Bay FL,DropOff,WEEKEND,Weekend,3,BASE,Base Price,325,325,flat,,150,',
      'MYBIZ_01,Tampa Bay FL,DropOff,WEEKLY,Weekly,4,BASE,Base Price,675,675,flat,,150,Heavy debris = scale ticket',
    ].join('\n');
    const blob = new Blob([headers + '\n' + sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pricing_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800">Upload Pricing Sheet</h3>
          <p className="text-xs text-slate-500 mt-0.5">CSV file with your custom pricing rules. Replaces any existing pricing for this business.</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2 text-xs">
          <Download className="w-3 h-3" /> Template
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Business ID</label>
          <Input
            placeholder="e.g. ALLIN_TB"
            value={businessId}
            onChange={e => setBusinessId(e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Pricing CSV File</label>
          <div
            className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-colors"
            onClick={() => fileRef.current.click()}
          >
            {file ? (
              <div className="flex items-center justify-center gap-2 text-sm text-slate-700">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="font-medium">{file.name}</span>
                <span className="text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            ) : (
              <div>
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <p className="text-sm text-slate-500">Click to select CSV file</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
        </div>
      </div>

      {result && (
        <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-emerald-800">Upload successful!</p>
            <p className="text-emerald-700">{result.imported} rules imported, {result.skipped} skipped out of {result.total_rows} rows.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!file || !businessId.trim() || loading}
        className="w-full h-10 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl disabled:opacity-40"
      >
        {loading ? 'Processing...' : 'Upload & Replace Pricing'}
      </Button>
    </div>
  );
}