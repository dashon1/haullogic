/**
 * Dynamic Pricing Engine
 * Uses uploaded PricingRule records to calculate quotes.
 * Falls back to hardcoded defaults if no rules are found for a business.
 */

const FALLBACK_PRICING = {
  FullService: {
    MIN:    { min: 125, max: 125, label: 'Minimum (1–2 items)' },
    QTR:    { min: 225, max: 225, label: '¼ Load' },
    HALF:   { min: 375, max: 375, label: '½ Load' },
    '3QTR': { min: 525, max: 525, label: '¾ Load' },
    FULL:   { min: 675, max: 675, label: 'Full Load' },
  },
  Curbside: {
    MIN:    { min: 100, max: 100, label: 'Minimum (1–2 items)' },
    QTR:    { min: 200, max: 200, label: '¼ Load' },
    HALF:   { min: 350, max: 350, label: '½ Load' },
    '3QTR': { min: 500, max: 500, label: '¾ Load' },
    FULL:   { min: 650, max: 650, label: 'Full Load' },
  },
  DropOff: {
    HALF_DAY: { min: 175, max: 175, label: 'Half Day' },
    FULL_DAY: { min: 225, max: 225, label: 'Full Day' },
    WEEKEND:  { min: 325, max: 325, label: 'Weekend' },
    WEEKLY:   { min: 675, max: 675, label: 'Weekly' },
  },
};

const FALLBACK_ADDONS = {
  mattress:     { label: 'Mattress', amount: 25 },
  refrigerator: { label: 'Refrigerator', amount: 50 },
  tires:        { label: 'Tires (each)', amount: 15 },
  paint:        { label: 'Paint / Hazmat', amount: 35 },
  hot_tub:      { label: 'Hot Tub', amount: 150 },
  piano:        { label: 'Piano', amount: 200 },
  tv:           { label: 'TV / Electronics', amount: 20 },
};

const BUCKET_TO_TIER = {
  minimum:       'MIN',
  eighth:        'QTR',
  quarter:       'QTR',
  half:          'HALF',
  three_quarter: '3QTR',
  full:          'FULL',
};

function getTierFromFill(fill) {
  if (fill <= 10) return 'MIN';
  if (fill <= 30) return 'QTR';
  if (fill <= 55) return 'HALF';
  if (fill <= 80) return '3QTR';
  return 'FULL';
}

export function mapServiceType(service_type) {
  if (service_type === 'full_service') return 'FullService';
  if (service_type === 'curbside_pickup') return 'Curbside';
  if (service_type === 'trailer_drop_off') return 'DropOff';
  return 'FullService';
}

export function resolveTierCode(assessment, formData) {
  const serviceType = mapServiceType(formData.service_type);

  // DropOff uses time-based tiers only — never map volume/fill to DropOff tiers
  if (serviceType === 'DropOff') {
    return formData.drop_off_duration || 'FULL_DAY';
  }

  if (assessment?.estimated_load_bucket) {
    return BUCKET_TO_TIER[assessment.estimated_load_bucket] || 'HALF';
  }
  if (assessment?.estimated_trailer_fill_percent) {
    return getTierFromFill(assessment.estimated_trailer_fill_percent);
  }
  const sizeMap = {
    one_item:              'MIN',
    small_pile:            'QTR',
    quarter_trailer:       'QTR',
    half_trailer:          'HALF',
    three_quarter_trailer: '3QTR',
    full_trailer:          'FULL',
    not_sure:              'HALF',
  };
  return sizeMap[formData.estimated_size] || 'HALF';
}

export function buildTriggers(formData, assessment) {
  return {
    curbside_ready: formData.service_type === 'curbside_pickup',
    stairs:         formData.junk_location === 'upstairs' || !!assessment?.stairs_flag,
    heavy_material: (formData.heavy_materials || []).some(m => m !== 'none') || !!assessment?.heavy_material_flag,
    same_day:       formData.service_timing === 'today',
  };
}

/**
 * Main quote calculator
 * @param {Object} assessment - AI assessment result (can be null)
 * @param {Object} formData - Customer form input
 * @param {Array} pricingRules - PricingRule records for this business (empty = fallback)
 */
export function calculateQuote(assessment, formData, pricingRules = []) {
  const serviceType = mapServiceType(formData.service_type);
  const tierCode = resolveTierCode(assessment, formData);
  const triggers = buildTriggers(formData, assessment);
  const score = assessment?.confidence_score || 0;
  const confidence = score >= 0.75 ? 'high' : score >= 0.55 ? 'medium' : 'low';

  if (pricingRules.length > 0) {
    return calculateFromRules(pricingRules, serviceType, tierCode, triggers, formData, confidence);
  }
  return calculateFallback(serviceType, tierCode, triggers, formData, confidence);
}

function calculateFromRules(rules, serviceType, tierCode, triggers, formData, confidence) {
  const baseRow = rules.find(r =>
    r.LineType === 'BASE' &&
    r.ServiceType === serviceType &&
    (r.TierCode === tierCode || r.TierCode === 'ANY')
  );

  if (!baseRow) {
    console.warn(`MISSING_BASE_RULE(${serviceType}, ${tierCode})`);
  }

  const baseMin = baseRow?.AmountMin || 0;
  const baseMax = baseRow?.AmountMax || baseMin;
  const tierLabel = baseRow?.TierLabel || tierCode;
  const disposalCredit = baseRow?.DisposalCredit || null;

  const surcharges = [];

  // ADDON rows triggered by conditions
  rules
    .filter(r => r.LineType === 'ADDON' && (r.ServiceType === serviceType || r.TierCode === 'ANY'))
    .forEach(addon => {
      if (addon.Trigger && triggers[addon.Trigger]) {
        surcharges.push({ label: addon.ItemOrCondition, amount: addon.AmountMin });
      }
    });

  // ADDON rows for selected special items
  (formData.special_items || []).forEach(item => {
    if (item === 'none') return;
    const normalized = item.replace(/_/g, ' ').toLowerCase();
    const match = rules.find(r =>
      r.LineType === 'ADDON' &&
      !r.Trigger &&
      r.ItemOrCondition.toLowerCase().includes(normalized)
    );
    if (match) surcharges.push({ label: match.ItemOrCondition, amount: match.AmountMin });
  });

  // DISCOUNT rows
  rules
    .filter(r => r.LineType === 'DISCOUNT' && (r.ServiceType === serviceType || r.TierCode === 'ANY'))
    .forEach(discount => {
      if (!discount.Trigger || triggers[discount.Trigger]) {
        surcharges.push({ label: discount.ItemOrCondition, amount: discount.AmountMin });
      }
    });

  const surchargeTotal = surcharges.reduce((s, c) => s + c.amount, 0);
  let totalMin = Math.max(0, baseMin + surchargeTotal);
  let totalMax = Math.max(0, baseMax + surchargeTotal);

  // MINIMUM FLOOR: enforce RULE rows with Trigger=min_total
  const minFloorRow = rules.find(r =>
    r.LineType === 'RULE' &&
    r.ItemOrCondition === 'Minimum Charge' &&
    r.ServiceType === serviceType &&
    r.TierCode === 'ANY' &&
    r.Trigger === 'min_total'
  );

  if (minFloorRow) {
    const floor = minFloorRow.AmountMin;
    if (totalMin < floor) totalMin = floor;
    if (totalMax < floor) totalMax = floor;
  }

  const marginMax = Math.round(totalMax * 0.1 / 5) * 5;

  return {
    base_price: baseMin,
    surcharges,
    estimate_min: totalMin,
    estimate_max: totalMax + marginMax,
    load_size_label: tierLabel || tierCode,
    service_type_label: serviceType,
    confidence_level: confidence,
    disposal_credit: disposalCredit,
    pricing_source: 'custom',
    minimum_applied: minFloorRow ? minFloorRow.AmountMin : null,
  };
}

function calculateFallback(serviceType, tierCode, triggers, formData, confidence) {
  const tierData = FALLBACK_PRICING[serviceType]?.[tierCode] || FALLBACK_PRICING['FullService']['HALF'];
  const base = tierData.min;
  const surcharges = [];

  (formData.special_items || []).forEach(item => {
    if (item !== 'none' && FALLBACK_ADDONS[item]) {
      surcharges.push(FALLBACK_ADDONS[item]);
    }
  });

  if (triggers.heavy_material) surcharges.push({ label: 'Heavy Materials', amount: 50 });
  if (triggers.stairs)         surcharges.push({ label: 'Upstairs / Stairs', amount: 25 });
  if (triggers.same_day)       surcharges.push({ label: 'Same-Day Service', amount: 40 });
  if (triggers.curbside_ready) surcharges.push({ label: 'Curbside Discount', amount: -25 });

  const total = Math.max(0, base + surcharges.reduce((s, c) => s + c.amount, 0));
  const margin = Math.round(total * 0.2 / 5) * 5;

  return {
    base_price: base,
    surcharges,
    estimate_min: total,
    estimate_max: total + margin,
    load_size_label: tierCode,
    service_type_label: serviceType,
    confidence_level: confidence,
    pricing_source: 'fallback',
  };
}