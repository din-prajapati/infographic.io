/* Pricing and reviewed-extraction logic ported from the 4180 mockup; no provider or server calls. */
(function(){
const clone = value => structuredClone(value);
// Preserved source logic: pricing.mjs
/** Structured values plus a compatible display string for existing V3 designs. */
const currencies = ['₹', '$', '£', '€', 'AED'];
const rentalPeriods = ['month', 'week', 'year', 'day'];
const symbols = { INR: '₹', RS: '₹', 'RS.': '₹', USD: '$', GBP: '£', EUR: '€', AED: 'AED' };
const currencySymbol = value => symbols[String(value).toUpperCase()] || value;

function parsePrice(input, currency = '₹') {
  const value = String(input ?? '').trim();
  const match = value.match(/^(₹|\$|£|€|INR|USD|GBP|EUR|AED|Rs\.?)?\s*(\d[\d,]*(?:\.\d+)?)\s*(crores?|cr|lakhs?|lacs?|million|m|k)?(?:\s*(?:\/|per\s+)\s*(months?|weeks?|years?|days?))?$/i);
  if (!match) throw new Error('Enter a valid price, such as ₹4.20 Cr or ₹50,000 / month.');
  const number = match[2], rawScale = match[3] || '';
  if (number.includes(',') && !/^(?:\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3})(?:\.\d+)?$/.test(number)) throw new Error('Use valid price separators, such as 50,000.');
  const scale = /^cr/i.test(rawScale) ? ['Cr', 1e7] : /^(lac|lakh)/i.test(rawScale) ? ['Lakh', 1e5] : /^(m|million)$/i.test(rawScale) ? ['M', 1e6] : rawScale ? ['K', 1e3] : ['', 1];
  const amount = Number(number.replaceAll(',', '')) * scale[1];
  currency = currencySymbol(match[1] || currency);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1e13) throw new Error('Enter a valid price greater than zero and no more than 10 trillion.');
  if (!currencies.includes(currency)) throw new Error('Choose a supported currency.');
  return { amount, currency, price: number + (scale[0] ? ' ' + scale[0] : ''), ...(match[4] ? { transaction: 'rent', rentalPeriod: match[4].toLowerCase().replace(/s$/, '') } : {}) };
}

function pricingPatch(property, key, value) {
  if (key === 'price') return String(value).trim() ? parsePrice(value, property.currency) : { price: '', amount: null };
  if (key === 'currency') {
    const currency = currencySymbol(value);
    if (!currencies.includes(currency)) throw new Error('Choose a supported currency.');
    return { currency };
  }
  if (key === 'transaction' && !['sale', 'rent'].includes(value)) throw new Error('Choose sale or rent.');
  if (key === 'transaction' && value !== property.transaction) return { transaction: value, price: '', amount: null };
  if (key === 'rentalPeriod' && !rentalPeriods.includes(value)) throw new Error('Choose a rental period.');
  return { [key]: value };
}

function normalizePricing(property) {
  const p = { ...property, currency: currencySymbol(property.currency || '₹'), transaction: property.transaction || 'sale', rentalPeriod: property.rentalPeriod ?? 'month' };
  // Older V3 records have only price text. Invalid drafts remain editable, not guessed.
  try {
    const parsed = p.price ? parsePrice(p.price, p.currency) : null;
    if (parsed && (property.amount == null || !Number.isFinite(property.amount) || property.amount === parsed.amount)) Object.assign(p, parsed);
    else if (Number.isFinite(property.amount) && property.amount > 0) p.price = String(property.amount);
    p.amount = Number.isFinite(property.amount) ? property.amount : parsed?.amount ?? null;
  } catch { p.amount = null; }
  return p;
}

function priceText(property) {
  const p = normalizePricing(property);
  return p.price ? `${p.currency} ${p.price}${p.transaction === 'rent' ? ` / ${p.rentalPeriod || 'choose period'}` : ''}` : '';
}
function listingLabel(property) {
  return [property.type, property.transaction === 'rent' ? 'FOR RENT' : 'FOR SALE'].filter(Boolean).join(' · ');
}
const priceLabel = p => p.transaction === 'rent' ? `Rent per ${rentalPeriods.includes(p.rentalPeriod) ? p.rentalPeriod : 'period'}` : 'Sale price';

// Preserved source logic: extraction.mjs
const propertyLabels = { headline: 'Headline', type: 'Property type', price: 'Price', transaction: 'Sale or rent', rentalPeriod: 'Rental period', location: 'Location', beds: 'Bedrooms', baths: 'Bathrooms', area: 'Area', features: 'Highlights', possession: 'Possession' };
const samples = [
  { label: 'Sale listing', text: '3bhk Bandra West, asking ₹4.2 Cr, 1450 sqft, sea facing, ready to move' },
  { label: 'Another property', text: 'Location: Whitefield\n2 bedroom apartment, 2 bathrooms\nAsking price: ₹95 Lakh\nBuilt-up area: 1180 sq ft\nBalcony, covered parking' },
  { label: 'Ambiguous prices', text: '3 BHK in Bandra West. Previous asking ₹4.5 Cr; new asking ₹4.2 Cr. Area: 1450 sq ft.' },
];

const text = value => String(value ?? '').trim();
const distinct = values => [...new Map(values.map(value => [JSON.stringify(value.patch), value])).values()];
const scaleName = raw => /^(cr|crore)/i.test(raw) ? 'Cr' : /^(lac|lakh)/i.test(raw) ? 'Lakh' : /^(million|mn|m)$/i.test(raw) ? 'M' : /^k$/i.test(raw) ? 'K' : '';
const currencyName = raw => /^₹|^rs|^inr/i.test(raw) ? '₹' : /^\$|^usd/i.test(raw) ? '$' : /^£|^gbp/i.test(raw) ? '£' : /^€|^eur/i.test(raw) ? '€' : /^aed/i.test(raw) ? 'AED' : '';
const negated = (source, index) => /\b(?:no|not|without)\s+(?:a\s+)?$/i.test(source.slice(Math.max(0, index - 18), index));
function matches(source, pattern, make) { return [...source.matchAll(pattern)].filter(match => !negated(source, match.index)).map(match => ({ ...make(match), source: match[0].trim() })); }
function candidate(key, options, status = 'found') {
  const unique = distinct(options); if (!unique.length) return null;
  return { key, label: propertyLabels[key], status: unique.length > 1 ? 'ambiguous' : status, options: unique, ...(unique.length === 1 ? unique[0] : { value: '', patch: {}, source: '' }) };
}

/** Deterministic, local extraction of explicit listing patterns. It never writes to a design. */
function extractListing(sourceText) {
  const source = String(sourceText || '').trim().slice(0, 12000), candidates = [], notices = [];
  if (!source) return { source, candidates, notices: ['Paste listing text before extracting.'], missing: Object.keys(propertyLabels), blocked: false };
  const push = (key, options, status) => { const item = candidate(key, options, status); if (item) candidates.push(item); };
  const bedOptions = matches(source, /\b(\d+(?:\.\d+)?)\s*[- ]?\s*(?:bhk|bedrooms?|beds?)\b/gi, m => ({ value: m[1], patch: { beds: m[1] } }));
  push('beds', bedOptions);
  push('baths', matches(source, /\b(\d+(?:\.\d+)?)\s*[- ]?\s*(?:bathrooms?|baths?)\b/gi, m => ({ value: m[1], patch: { baths: m[1] } })));
  const multiListing = [...source.matchAll(/\b(?:listing|property|option)\s*\d+\s*[:.)-]/gi)].length > 1;
  const configurationRange = /\b\d+\s*(?:&|\/|or|and|-)\s*\d+\s*bhk\b/i.test(source);
  const blocked = multiListing || distinct(bedOptions).length > 1 || configurationRange;
  if (blocked) notices.push('This text appears to contain multiple properties or bedroom configurations. Paste one listing at a time before applying.');

  const pricePattern = /((?:₹|rs\.?|inr|\$|usd|£|gbp|€|eur|aed))\s*(\d[\d,]*(?:\.\d+)?)\s*(crores?|cr|lakhs?|lacs?|million|mn|m|k)?\b|(\d[\d,]*(?:\.\d+)?)\s*(crores?|cr|lakhs?|lacs?|million|mn)\b/gi;
  let priceOptions = matches(source, pricePattern, m => {
    const currency = currencyName(m[1] || ''), value = `${m[2] || m[4]}${m[3] || m[5] ? ' ' + scaleName(m[3] || m[5]) : ''}`;
    return { value: `${currency ? currency + ' ' : ''}${value}`, patch: { price: value, ...(currency ? { currency } : {}) }, note: currency ? '' : 'No currency in source. The current listing currency will be retained.' };
  });
  if (!priceOptions.length) priceOptions = matches(source, /\b(?:asking(?:\s+price)?|price)\s*[:=]\s*(\d[\d,]*(?:\.\d+)?)\b/gi, m => ({ value: m[1], patch: { price: m[1] }, note: 'No currency in source. The current listing currency will be retained.' }));
  if (/\d[\d,.]*\s*(?:-|–|to)\s*(?:₹|\$|£|€)?\s*\d[\d,.]*\s*(?:cr|crore|lakh|lac|million|mn|k)\b/i.test(source)) {
    notices.push('A price range was found. Set the intended asking price manually; neither endpoint will be applied automatically.'); priceOptions = [];
  }
  push('price', priceOptions);
  push('transaction', matches(source, /\b(?:for\s+sale|for\s+rent|rental|rent)\b/gi, m => ({ value: /sale/i.test(m[0]) ? 'For sale' : 'For rent', patch: { transaction: /sale/i.test(m[0]) ? 'sale' : 'rent' } })));
  push('rentalPeriod', matches(source, /(?:\bper\s+|\/\s*)(month|week|year|day)s?\b|\b(monthly|weekly|yearly|daily)\b/gi, m => { const period = m[1]?.toLowerCase() || { monthly: 'month', weekly: 'week', yearly: 'year', daily: 'day' }[m[2].toLowerCase()]; return { value: `Per ${period}`, patch: { transaction: 'rent', rentalPeriod: period } }; }));
  if (/\b(?:rent|rental|per\s*month|monthly|deposit)\b/i.test(source) && priceOptions.length) {
    const price = candidates.find(c => c.key === 'price'); price.status = 'ambiguous'; price.note = 'Rental/deposit context detected. Explicitly choose the intended amount, or edit the price manually.';
    notices.push('Review the rental amount separately from any deposit, then select the listing intent and rental period. No terms change until Apply.');
  }

  const areaOptions = matches(source, /\b(?:(carpet|built[ -]?up|super[ -]?built[ -]?up)\s*(?:area)?\s*[:=-]?\s*)?(\d[\d,]*(?:\.\d+)?)\s*(sq\.?\s*ft\.?|sqft|square\s+feet|sq\.?\s*m\.?|sqm|m²|acres?)(?![a-z0-9])/gi, m => {
    const areaUnit = /acre/i.test(m[3]) ? 'acres' : /sqm|m²|sq\.?\s*m\.?$/i.test(m[3]) ? 'sq m' : 'sq ft';
    const areaType = m[1] ? m[1].replace(/-/g, ' ').replace(/\s+/g, ' ').toLowerCase() : '';
    return { value: `${m[2]} ${areaUnit}${areaType ? ' · ' + areaType : ''}`, patch: { area: m[2], areaUnit, ...(areaType ? { areaType } : {}) }, note: areaType ? '' : 'Area type is not specified; carpet/built-up will not be inferred.' };
  });
  push('area', areaOptions);

  let locationOptions = matches(source, /(?:^|[\n,;])\s*(?:location|address|locality)\s*[:=-]\s*([^\n,;]+)/gi, m => ({ value: m[1].trim(), patch: { location: m[1].trim() } }));
  if (!locationOptions.length) {
    for (const segment of source.split(/[\n,;]/)) {
      const match = segment.trim().match(/^\d+(?:\.\d+)?\s*bhk\s+(?:(?:apartment|flat|villa)\s+)?(?:(?:in|at)\s+)?(.+?)\.?$/i);
      const value = match?.[1].split(/\.\s/)[0].trim();
      if (value && !/\b(?:asking|price|bath|sqft|sq\s*ft|sea[ -]?facing|ready|furnished|parking)\b|[₹$£€]/i.test(value)) {
        locationOptions.push({ value, patch: { location: value }, source: match[0].split(/\.\s/)[0] });
      }
    }
  }
  push('location', locationOptions);
  push('type', matches(source, /\b(independent villa|villa|apartment|flat|commercial property|plot|land)\b/gi, m => {
    const value = /villa/i.test(m[1]) ? 'Independent villa' : /apartment|flat/i.test(m[1]) ? 'Apartment' : /commercial/i.test(m[1]) ? 'Commercial' : 'Land';
    return { value, patch: { type: value } };
  }));

  const features = [];
  for (const pattern of [/\bsea[ -]?facing\b/gi, /\bsea\s+view\b/gi, /\b(?:private\s+)?garden\b/gi, /\b(?:swimming\s+)?pool\b/gi, /\bbalcony\b/gi, /\b(?:covered\s+)?parking\b/gi, /\bclubhouse\b/gi, /\b24\s*[x×/]\s*7\s+security\b/gi, /\b(?:semi[ -])?furnished\b/gi]) {
    features.push(...matches(source, pattern, m => ({ value: m[0], patch: {} })));
  }
  if (features.length) {
    const values = [...new Map(features.map(f => [f.value.toLowerCase().replace(/-/g, ' '), f.value])).values()];
    push('features', [{ value: values.join(', '), patch: { features: values.join(', ') }, source: features.map(f => f.source).join(' · '), note: 'Adds source-supported highlights without deleting existing ones.' }]);
  }
  const possession = matches(source, /\b(?:ready\s*to\s*move|immediate\s+possession)\b/gi, m => ({ value: m[0], patch: { possession: m[0] } }));
  possession.push(...matches(source, /\bpossession\s*[:=-]\s*([^,;\n]+)/gi, m => ({ value: m[1].trim(), patch: { possession: m[1].trim() } })));
  push('possession', possession);
  const headline = matches(source, /(?:^|\n)\s*(?:headline|title)\s*[:=-]\s*([^\n]+)/gi, m => ({ value: m[1].trim(), patch: { headline: m[1].trim() } }));
  if (headline.length) push('headline', headline);
  else {
    const beds = candidates.find(c => c.key === 'beds' && c.status === 'found'), location = candidates.find(c => c.key === 'location' && c.status === 'found');
    if (beds && location) push('headline', [{ value: `${beds.value} BHK in ${location.value}`, patch: { headline: `${beds.value} BHK in ${location.value}` }, source: `${beds.source} · ${location.source}`, note: 'Suggested marketing copy assembled only from these facts. Optional and not preselected.' }], 'suggested');
  }
  const missing = Object.keys(propertyLabels).filter(key => !candidates.some(c => c.key === key));
  if (!candidates.length) notices.push('No supported listing facts were found. Keep your text and enter the fields manually, or add clear labels such as Location: or Price:.');
  return { source, candidates, notices, missing, blocked };
}

function candidatePatch(design, candidate) {
  const patch = clone(candidate.patch);
  if (patch.features) {
    const items = `${design.property.features || ''},${patch.features}`.split(',').map(text).filter(Boolean);
    patch.features = [...new Map(items.map(item => [item.toLowerCase().replace(/-/g, ' '), item])).values()].join(', ');
  }
  return patch;
}
function candidateCurrentValue(design, key) {
  const p = design.property;
  if (key === 'price') return priceText(p);
  if (key === 'transaction') return p.transaction === 'rent' ? 'For rent' : 'For sale';
  if (key === 'rentalPeriod') return p.transaction === 'rent' ? `Per ${p.rentalPeriod}` : '';
  if (key === 'area') return p.area ? `${p.area} ${p.areaUnit || 'sq ft'}${p.areaType ? ' · ' + p.areaType : ''}` : '';
  return text(p[key]);
}
function defaultAccepted(design, result) {
  if (result.blocked) return [];
  return result.candidates.filter(c => c.status === 'found' && !text(design.property[c.key])).map(c => c.key);
}
/** Acceptance is explicit, source-scoped, and rejects stale changes to affected fields. */
function applyReviewedImport(design, result, candidates, baseline = design) {
  if (result.blocked) throw new Error('Paste one listing at a time.');
  if (design.id !== baseline.id) throw new Error('The target listing changed. Review this import again.');
  if (!candidates.length) throw new Error('Select at least one change to apply.');
  const next = clone(design), applied = [];
  const intents = new Set(candidates.map(c => c.patch?.transaction).filter(Boolean));
  if (intents.size > 1) throw new Error('Selected sale/rental terms conflict. Review the listing intent and period.');
  for (const item of candidates) {
    if (!propertyLabels[item.key] || !item.patch || !Object.keys(item.patch).length) throw new Error('Choose a specific candidate first.');
    const patch = candidatePatch(next, item);
    if (patch.price !== undefined) Object.assign(patch, parsePrice(patch.price, patch.currency || next.property.currency));
    for (const key of ['transaction', 'rentalPeriod']) if (patch[key] !== undefined) pricingPatch(next.property, key, patch[key]);
    for (const [key, value] of Object.entries(patch)) {
      if (!(key in design.property) || !['headline', 'type', 'price', 'amount', 'currency', 'transaction', 'rentalPeriod', 'location', 'beds', 'baths', 'area', 'areaUnit', 'areaType', 'features', 'possession'].includes(key)) throw new Error('Import contains an unsupported property field.');
      if (String(design.property[key] ?? '') !== String(baseline.property[key] ?? '')) throw new Error('A listing field changed after extraction. Review the text again.');
      next.property[key] = value;
    }
    applied.push({ key: item.key, source: item.source, value: item.value, patch });
  }
  // An explicitly accepted amount belongs to the accepted intent. Never carry an old
  // sale amount into rent (or vice versa) when the review changed intent alone.
  if (next.property.transaction !== design.property.transaction && !applied.some(item => item.patch.price !== undefined)) {
    next.property.price = ''; next.property.amount = null;
    const intent = applied.find(item => item.patch.transaction !== undefined);
    if (intent) Object.assign(intent.patch, { price: '', amount: null });
  }
  const id = `import-${globalThis.crypto?.randomUUID?.() || Date.now()}`, timestamp = new Date().toISOString();
  next.meta ||= { fields: {}, imports: [] }; next.meta.fields ||= {}; next.meta.imports ||= [];
  for (const item of applied) for (const key of Object.keys(item.patch)) next.meta.fields[`property.${key}`] = { origin: item.status === 'suggested' ? 'accepted-suggestion' : 'accepted-source-text', source: item.source, importId: id, updatedAt: timestamp };
  next.meta.imports.push({ id, source: result.source, applied, createdAt: timestamp }); next.meta.imports = next.meta.imports.slice(-20);
  return next;
}

globalThis.listingCore = { currencies, rentalPeriods, parsePrice, pricingPatch, normalizePricing, priceText, priceLabel, extractListing, applyReviewedImport, candidateCurrentValue, defaultAccepted, propertyLabels };
})();
