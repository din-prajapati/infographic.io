export interface ListingRecord {
  property: {
    name: string; headline: string; address: string; description: string; type: string;
    country: string; currency: string; amount: string | null; transaction: 'sale' | 'rent';
    rentalPeriod: 'month' | 'week' | 'year' | 'day'; beds: string; baths: string;
    area: string; areaUnit: string; status: string; features: string[];
  };
  agent: { name: string; phone: string; email: string; agency: string; license: string; photo: string };
  brand: { name: string; logo: string; tagline: string; accent: string };
  photos: { id: string; name: string; src: string }[];
}
export interface SavedProperty { id: string; version: number; record: ListingRecord; createdAt: string; updatedAt: string; organizationId?: string }
export interface ListingProfile { version: number; record: Pick<ListingRecord, 'agent' | 'brand'>; updatedAt?: string }
export const LISTING_COUNTRIES = ['IN', 'US', 'GB', 'CA'] as const;
export const LISTING_CURRENCIES = ['INR', 'USD', 'GBP', 'CAD'] as const;
export const LISTING_AREA_UNITS = ['sq ft', 'sq m', 'acres'] as const;
export const LISTING_MAX_BYTES = 10 * 1024 * 1024;
export const LISTING_MAX_MEDIA_BYTES = 2 * 1024 * 1024;

export function createEmptyListing(): ListingRecord {
  return {
    property: { name: '', headline: '', address: '', description: '', type: '', country: 'IN', currency: 'INR', amount: null, transaction: 'sale', rentalPeriod: 'month', beds: '', baths: '', area: '', areaUnit: 'sq ft', status: '', features: [] },
    agent: { name: '', phone: '', email: '', agency: '', license: '', photo: '' },
    brand: { name: '', logo: '', tagline: '', accent: '' }, photos: [],
  };
}
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const decimal = /^(?:0|[1-9]\d{0,14})(?:\.\d{1,2})?$/;
export function isListingMedia(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > LISTING_MAX_MEDIA_BYTES) return false;
  if (!value) return true;
  if (/^data:image\/(?:png|jpeg|webp|gif|avif);base64,[A-Za-z0-9+/]+=*$/.test(value)) return true;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}
export function validateListingRecord(value: unknown): string[] {
  const errors: string[] = [];
  const error = (path: string, message: string) => { errors.push(`${path}: ${message}`); };
  if (!object(value)) return ['listing: expected object'];
  const template = createEmptyListing();
  const checkKeys = (candidate: Record<string, unknown>, keys: string[], path: string) => {
    for (const key of Object.keys(candidate)) if (!keys.includes(key)) error(`${path}.${key}`, 'unexpected field');
    for (const key of keys) if (!(key in candidate)) error(`${path}.${key}`, 'required field');
  };
  checkKeys(value, Object.keys(template), 'listing');
  for (const section of ['property', 'agent', 'brand'] as const) {
    const candidate = value[section];
    if (!object(candidate)) { error(section, 'expected object'); continue; }
    checkKeys(candidate, Object.keys(template[section]), section);
    for (const [key, field] of Object.entries(candidate)) {
      const path = `${section}.${key}`;
      if (section === 'property' && key === 'features') {
        if (!Array.isArray(field) || field.length > 50 || field.some(f => typeof f !== 'string' || f.length > 500)) error(path, 'expected up to 50 text features');
      } else if (section === 'property' && key === 'amount') {
        if (field !== null && (typeof field !== 'string' || !decimal.test(field))) error(path, 'enter a non-negative decimal amount, up to 15 digits and 2 decimal places');
      } else if (key === 'photo' || key === 'logo') {
        if (!isListingMedia(field)) error(path, 'use HTTPS or a raster image upload up to 2 MB');
      } else if (typeof field !== 'string' || field.length > (key === 'description' ? 20000 : 2000)) error(path, 'expected bounded text');
    }
  }
  const p = value.property;
  if (object(p)) {
    for (const [key, allowed] of Object.entries({ country: LISTING_COUNTRIES, currency: LISTING_CURRENCIES, transaction: ['sale', 'rent'], rentalPeriod: ['month', 'week', 'year', 'day'], areaUnit: LISTING_AREA_UNITS })) {
      if (!allowed.includes(p[key] as never)) error(`property.${key}`, `choose ${allowed.join(', ')}`);
    }
    for (const key of ['beds', 'baths', 'area']) if (p[key] !== '' && (typeof p[key] !== 'string' || !decimal.test(p[key] as string))) error(`property.${key}`, 'enter a non-negative number');
  }
  if (!Array.isArray(value.photos) || value.photos.length > 8) error('photos', 'expected up to 8 photos');
  else {
    const ids = new Set<string>();
    value.photos.forEach((photo, i) => {
      if (!object(photo)) { error(`photos.${i}`, 'expected photo'); return; }
      checkKeys(photo, ['id', 'name', 'src'], `photos.${i}`);
      if (typeof photo.id !== 'string' || !photo.id || photo.id.length > 100 || ids.has(photo.id)) error(`photos.${i}.id`, 'unique id required');
      else ids.add(photo.id);
      if (typeof photo.name !== 'string' || photo.name.length > 200) error(`photos.${i}.name`, 'bounded name required');
      if (!isListingMedia(photo.src) || !photo.src) error(`photos.${i}.src`, 'valid image required');
    });
  }
  try { if (new TextEncoder().encode(JSON.stringify(value)).length > LISTING_MAX_BYTES) error('listing', 'total record exceeds 10 MB'); } catch { error('listing', 'expected serializable record'); }
  return errors;
}
export function assertListingRecord(value: unknown): asserts value is ListingRecord {
  const errors = validateListingRecord(value);
  if (errors.length) throw new Error(errors.join('; '));
}
export interface ParsedListingPrice { amount: string; currency: string; transaction?: 'rent'; rentalPeriod?: ListingRecord['property']['rentalPeriod'] }
export function parseListingPrice(raw: string, country?: string): ParsedListingPrice | null {
  const match = raw.trim().match(/^(₹|£|CA\$|C\$|US\$|INR|USD|GBP|CAD|Rs\.?|\$)?\s*(\d[\d,]*(?:\.\d+)?)\s*(crores?|cr|lakhs?|lacs?|million|m|k)?\s*(?:(?:\/|per\s+)\s*(months?|weeks?|years?|days?))?$/i);
  if (!match) return null;
  const [, token, rawAmount, scale, period] = match;
  if (rawAmount.includes(',') && !/^(?:\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3})(?:\.\d+)?$/.test(rawAmount)) return null;
  const defaultCurrency: Record<string, string> = { IN: 'INR', US: 'USD', GB: 'GBP', CA: 'CAD' };
  const currencies: Record<string, string> = { '₹': 'INR', INR: 'INR', RS: 'INR', 'RS.': 'INR', '£': 'GBP', GBP: 'GBP', 'US$': 'USD', USD: 'USD', 'CA$': 'CAD', 'C$': 'CAD', CAD: 'CAD' };
  const currency = token === '$' ? (country === 'US' ? 'USD' : country === 'CA' ? 'CAD' : undefined) : token ? currencies[token.toUpperCase()] : defaultCurrency[country ?? ''];
  if (!currency) return null;
  const power = scale ? /^cr/i.test(scale) ? 7 : /^(lakh|lac)/i.test(scale) ? 5 : /^(m|million)$/i.test(scale) ? 6 : 3 : 0;
  const [integer, fraction = ''] = rawAmount.replace(/,/g, '').split('.');
  const digits = integer + fraction;
  const point = integer.length + power;
  const expanded = point >= digits.length ? digits + '0'.repeat(point - digits.length) : `${digits.slice(0, point)}.${digits.slice(point)}`;
  const amount = expanded.replace(/^0+(?=\d)/, '').replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  if (!decimal.test(amount)) return null;
  return { amount, currency, ...(period ? { transaction: 'rent' as const, rentalPeriod: period.toLowerCase().replace(/s$/, '') as ListingRecord['property']['rentalPeriod'] } : {}) };
}
export function pricingPatch(property: ListingRecord['property'], key: 'amount' | 'price' | 'currency' | 'transaction' | 'rentalPeriod', value: string): Partial<ListingRecord['property']> {
  if (key === 'transaction') {
    if (!['sale', 'rent'].includes(value)) throw new Error('property.transaction: choose sale or rent');
    return value !== property.transaction ? { transaction: value as 'sale' | 'rent', amount: null } : { transaction: property.transaction };
  }
  if (key === 'price') {
    if (!value.trim()) return { amount: null };
    const parsed = parseListingPrice(/^(?:₹|£|CA\$|C\$|US\$|INR|USD|GBP|CAD|Rs\.?|\$)/i.test(value.trim()) ? value : `${property.currency} ${value}`, property.country);
    if (!parsed) throw new Error('property.amount: enter a valid price with currency');
    return parsed;
  }
  if (key === 'amount') {
    if (value === '') return { amount: null };
    if (!decimal.test(value)) throw new Error('property.amount: enter a non-negative decimal amount');
    return { amount: value };
  }
  if (key === 'currency') {
    if (!(LISTING_CURRENCIES as readonly string[]).includes(value)) throw new Error('property.currency: unsupported currency');
    return { currency: value };
  }
  if (!['month', 'week', 'year', 'day'].includes(value)) throw new Error('property.rentalPeriod: choose a rental period');
  return { rentalPeriod: value as ListingRecord['property']['rentalPeriod'] };
}
export function formatListingPrice(property: ListingRecord['property']): string {
  if (property.amount === null || !decimal.test(property.amount)) return '';
  const [integer, fraction = ''] = property.amount.split('.');
  let text: string;
  if (property.currency === 'INR' && BigInt(integer) >= 100000n) {
    const divisor = BigInt(integer) >= 10000000n ? 10000000n : 100000n;
    const cents = BigInt(integer) * 100n + BigInt(fraction.padEnd(2, '0'));
    const roundedHundredths = (cents + divisor / 2n) / divisor;
    const compactFraction = String(roundedHundredths % 100n).padStart(2, '0').replace(/0+$/, '');
    text = `${roundedHundredths / 100n}${compactFraction ? '.' + compactFraction : ''} ${divisor === 10000000n ? 'Cr' : 'Lakh'}`;
  } else {
    const grouped = property.country === 'IN' && integer.length > 3 ? integer.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + integer.slice(-3) : integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const trimmed = fraction.replace(/0+$/, '');
    text = grouped + (trimmed ? '.' + trimmed : '');
  }
  const symbol: Record<string, string> = { INR: '₹', USD: 'US$', CAD: 'CA$', GBP: '£' };
  return `${symbol[property.currency] ?? property.currency + ' '}${text}${property.transaction === 'rent' ? ` / ${property.rentalPeriod}` : ''}`;
}
export function formatSpecifications(property: ListingRecord['property']): string {
  return [property.beds !== '' ? `${property.beds} BEDS` : '', property.baths !== '' ? `${property.baths} BATHS` : '', property.area !== '' ? `${property.area} ${property.areaUnit}` : ''].filter(Boolean).join(' · ');
}

export type ReviewedFactPath = `property.${keyof ListingRecord['property']}` | `agent.${keyof ListingRecord['agent']}`;
export interface ReviewedFact { id: string; path: ReviewedFactPath; label: string; value: string | string[] | null; evidence: string; selected: boolean; ambiguous: boolean; candidates?: string[] }
export interface ListingTextReview { id: string; source: string; baseline: ListingRecord; facts: ReviewedFact[]; rejected: boolean; error?: string }
export function reviewListingText(source: string, baseline: ListingRecord): ListingTextReview {
  const review: ListingTextReview = { id: 'review', source, baseline: structuredClone(baseline), facts: [], rejected: false };
  if (!source.trim() || source.length > 50000) return { ...review, rejected: true, error: 'Paste one property description, up to 50,000 characters.' };
  const add = (path: ReviewedFactPath, value: string | string[] | null, evidence: string) => {
    if (!review.facts.some(fact => fact.path === path && JSON.stringify(fact.value) === JSON.stringify(value) && fact.evidence === evidence)) review.facts.push({ id: `fact-${review.facts.length}`, path, label: path.split('.')[1], value, evidence, selected: !path.startsWith('agent.'), ambiguous: false });
  };
  const labels: Record<string, ReviewedFactPath> = { name: 'property.name', headline: 'property.headline', address: 'property.address', location: 'property.address', description: 'property.description', type: 'property.type', beds: 'property.beds', bedrooms: 'property.beds', baths: 'property.baths', bathrooms: 'property.baths', area: 'property.area', status: 'property.status', features: 'property.features', agent: 'agent.name', phone: 'agent.phone', email: 'agent.email', agency: 'agent.agency', license: 'agent.license' };
  let identities = 0;
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (/^(?:property|listing)\s*(?:#|id\s*:|\d+\s*:|[A-Z]\s*:)/i.test(line)) identities++;
    const match = line.match(/^([\w ]{2,25}):\s*(.+)$/);
    if (match && (labels[match[1].trim().toLowerCase()] || /^(?:price|rent|asking price|sale price)$/i.test(match[1].trim()))) {
      const key = match[1].trim().toLowerCase();
      const value = match[2].trim();
      if (/^(?:price|rent|asking price|sale price)$/.test(key)) {
        const prices = value.split(/\s+(?:or|to)\s+|\s*[–—]\s*/i);
        for (const candidate of prices) {
          const parsed = parseListingPrice(candidate, baseline.property.country);
          if (!parsed) continue;
          add('property.amount', parsed.amount, line);
          add('property.currency', parsed.currency, line);
          if (parsed.transaction || key === 'rent') add('property.transaction', 'rent', line);
          if (parsed.rentalPeriod) add('property.rentalPeriod', parsed.rentalPeriod, line);
        }
      } else if (labels[key]) {
        const path = labels[key];
        if (['property.beds', 'property.baths'].includes(path) && !decimal.test(value)) continue;
        if (path === 'property.area') {
          const area = value.match(/^(\d[\d,]*(?:\.\d{1,2})?)\s*(sq\s*ft|sq\s*m|acres)?$/i);
          if (area && decimal.test(area[1].replace(/,/g, ''))) { add(path, area[1].replace(/,/g, ''), line); if (area[2]) add('property.areaUnit', area[2].toLowerCase().replace(/\s+/g, ' '), line); }
        } else add(path, path === 'property.features' ? value.split(/[,;•]/).map(v => v.trim()).filter(Boolean) : value, line);
      }
    } else {
      const matches = (pattern: RegExp, accept: (match: RegExpMatchArray) => void) => {
        for (const found of line.matchAll(pattern)) if (!/\b(?:no|not|without)\s+(?:a\s+)?$/i.test(line.slice(Math.max(0, found.index! - 20), found.index))) accept(found);
      };
      matches(/\b(\d+(?:\.\d{1,2})?)\s*[- ]?\s*(?:bhk|bedrooms?|beds?)\b/gi, m => add('property.beds', m[1], m[0]));
      matches(/\b(\d+(?:\.\d{1,2})?)\s*[- ]?\s*(?:bathrooms?|baths?)\b/gi, m => add('property.baths', m[1], m[0]));
      matches(/\b(\d[\d,]*(?:\.\d{1,2})?)\s*(sq\.?\s*ft\.?|sqft|square\s+feet|sq\.?\s*m\.?|sqm|m²|acres?)\b/gi, m => {
        const amount = m[1].replace(/,/g, '');
        if (!decimal.test(amount)) return;
        add('property.area', amount, m[0]);
        add('property.areaUnit', /acre/i.test(m[2]) ? 'acres' : /sqm|m²|sq\.?\s*m/i.test(m[2]) ? 'sq m' : 'sq ft', m[0]);
      });
      matches(/(?:₹|£|CA\$|C\$|US\$|INR\s*|USD\s*|GBP\s*|CAD\s*|Rs\.?\s*|\$)\s*\d[\d,]*(?:\.\d+)?\s*(?:crores?|cr|lakhs?|lacs?|million|m|k)?(?:\s*(?:\/|per\s+)\s*(?:months?|weeks?|years?|days?))?/gi, m => {
        const parsed = parseListingPrice(m[0], baseline.property.country);
        if (!parsed) return;
        add('property.amount', parsed.amount, m[0]); add('property.currency', parsed.currency, m[0]);
        if (parsed.transaction) add('property.transaction', parsed.transaction, m[0]);
        if (parsed.rentalPeriod) add('property.rentalPeriod', parsed.rentalPeriod, m[0]);
      });
      matches(/\bfor\s+(sale|rent)\b/gi, m => add('property.transaction', m[1].toLowerCase(), m[0]));
      matches(/\b(apartment|flat|villa|commercial property|plot|land)\b/gi, m => add('property.type', m[1], m[0]));
    }
  }
  const distinct = (path: ReviewedFactPath) => new Set(review.facts.filter(f => f.path === path).map(f => JSON.stringify(f.value))).size;
  if (identities > 1 || distinct('property.address') > 1 || distinct('property.name') > 1 || distinct('property.beds') > 1 || /\b\d+\s*(?:&|\/|or|and|-)\s*\d+\s*bhk\b/i.test(source)) return { ...review, rejected: true, error: 'Multiple properties detected. Paste one property at a time.' };
  for (const fact of review.facts) if (distinct(fact.path) > 1) { fact.ambiguous = true; fact.selected = false; }
  if (/\bdeposit\b|\d[\d,.]*\s*(?:-|–|to)\s*(?:₹|\$|£)?\s*\d[\d,.]*\s*(?:cr|crore|lakh|million|k)\b/i.test(source)) for (const fact of review.facts) if (fact.path === 'property.amount') { fact.ambiguous = true; fact.selected = false; }
  if (!review.facts.length) review.error = 'No supported facts recognized. Use labels such as Address:, Price:, Beds: or Agent:.';
  return review;
}
export function applyReviewedFacts(current: ListingRecord, review: ListingTextReview, selectedIds: string[]): { ok: true; record: ListingRecord } | { ok: false; error: string } {
  if (review.rejected) return { ok: false, error: review.error ?? 'Import rejected' };
  const selected = review.facts.filter(f => selectedIds.includes(f.id));
  if (selectedIds.some(id => !review.facts.some(f => f.id === id))) return { ok: false, error: 'Unknown review selection' };
  const proposed = new Map<ReviewedFactPath, ReviewedFact>();
  for (const fact of selected) {
    const [section, key] = fact.path.split('.') as ['property' | 'agent', string];
    const read = (r: ListingRecord) => (r[section] as unknown as Record<string, unknown>)[key];
    if (JSON.stringify(read(current)) !== JSON.stringify(read(review.baseline))) return { ok: false, error: `${fact.path} changed during review. Extract again.` };
    if (fact.path === 'property.amount' && ['country', 'currency', 'transaction', 'rentalPeriod'].some(key => (current.property as unknown as Record<string, unknown>)[key] !== (review.baseline.property as unknown as Record<string, unknown>)[key])) return { ok: false, error: 'Price context changed during review. Extract again.' };
    const previous = proposed.get(fact.path);
    if (previous && JSON.stringify(previous.value) !== JSON.stringify(fact.value)) return { ok: false, error: `Choose one ${fact.label} candidate.` };
    proposed.set(fact.path, fact);
  }
  const record = structuredClone(current);
  const intent = proposed.get('property.transaction');
  if (intent && intent.value !== current.property.transaction && !proposed.has('property.amount')) {
    if (current.property.amount !== review.baseline.property.amount) return { ok: false, error: 'property.amount changed during review. Extract again.' };
    record.property.amount = null;
  }
  for (const fact of proposed.values()) {
    const [section, key] = fact.path.split('.') as ['property' | 'agent', string];
    (record[section] as unknown as Record<string, unknown>)[key] = structuredClone(fact.value);
  }
  const errors = validateListingRecord(record);
  return errors.length ? { ok: false, error: errors.join('; ') } : { ok: true, record };
}
