import { LISTING_AREA_UNITS, LISTING_COUNTRIES, LISTING_CURRENCIES, pricingPatch, type ListingRecord } from '@shared/listingWorkflow';
import { RECOMMENDED_LENGTH, STORAGE_LIMIT } from './listingFormat';
import { SelectField, TextField } from './FormControls';

type Property = ListingRecord['property'];
const COUNTRY_LABEL: Record<string, string> = { IN: 'India', US: 'United States', GB: 'United Kingdom', CA: 'Canada' };
const DEFAULT_CURRENCY: Record<string, string> = { IN: 'INR', US: 'USD', GB: 'GBP', CA: 'CAD' };

/** Structured property fields (rev-2 spec §5). Edits a draft; the page owns Save / Cancel. */
export function PropertyForm({ value, onChange, errors }: { value: Property; onChange: (next: Property) => void; errors: Record<string, string> }) {
  const set = (patch: Partial<Property>) => onChange({ ...value, ...patch });
  const err = (key: keyof Property) => errors[`property.${key}`];
  const priceChange = (key: 'transaction' | 'currency' | 'rentalPeriod', next: string) => { try { set(pricingPatch(value, key, next)); } catch { /* option lists only offer valid values */ } };
  return (
    <div>
      <section className="ws-form-section" aria-labelledby="pf-identity">
        <h3 id="pf-identity">Listing identity</h3>
        <div className="ws-form-grid">
          <TextField label="Listing name" value={value.name} onChange={name => set({ name })} max={STORAGE_LIMIT.text} error={err('name')} hint="Shown in your library. Not printed on artwork unless a template uses it." />
          <TextField label="Marketing headline" value={value.headline} onChange={headline => set({ headline })} recommended={RECOMMENDED_LENGTH.headline} max={STORAGE_LIMIT.text} error={err('headline')} />
          <TextField label="Address" value={value.address} onChange={address => set({ address })} recommended={RECOMMENDED_LENGTH.address} max={STORAGE_LIMIT.text} error={err('address')} full />
          <TextField label="Description" value={value.description} onChange={description => set({ description })} max={STORAGE_LIMIT.description} error={err('description')} multiline full />
          <TextField label="Property type" value={value.type} onChange={type => set({ type })} max={STORAGE_LIMIT.text} error={err('type')} list="pf-types" placeholder="Apartment, villa, plot…" />
          <datalist id="pf-types">{['Apartment', 'Villa', 'Independent house', 'Townhouse', 'Plot', 'Commercial'].map(option => <option key={option} value={option} />)}</datalist>
          <SelectField label="Country" value={value.country} error={err('country')} options={LISTING_COUNTRIES.map(code => ({ value: code, label: COUNTRY_LABEL[code] ?? code }))}
            onChange={country => set({ country, ...(value.amount === null ? { currency: DEFAULT_CURRENCY[country] ?? value.currency } : {}) })} />
        </div>
      </section>
      <section className="ws-form-section" aria-labelledby="pf-price">
        <h3 id="pf-price">Price and intent</h3>
        <div className="ws-form-grid">
          <SelectField label="Listing intent" value={value.transaction} error={err('transaction')} options={[{ value: 'sale', label: 'For sale' }, { value: 'rent', label: 'For rent' }]} onChange={next => priceChange('transaction', next)} />
          <SelectField label="Currency" value={value.currency} error={err('currency')} options={LISTING_CURRENCIES.map(code => ({ value: code, label: code }))} onChange={next => priceChange('currency', next)} />
          <TextField label="Amount" value={value.amount ?? ''} onChange={amount => set({ amount: amount.trim() === '' ? null : amount.replace(/[,\s]/g, '') })} max={18} inputMode="decimal" error={err('amount')}
            hint="Digits only, e.g. 12000000 for ₹1.2 Cr. Shown formatted on cards and artwork." />
          {value.transaction === 'rent' && (
            <SelectField label="Rental period" value={value.rentalPeriod} error={err('rentalPeriod')} options={[{ value: 'month', label: 'Per month' }, { value: 'week', label: 'Per week' }, { value: 'year', label: 'Per year' }, { value: 'day', label: 'Per day' }]} onChange={next => priceChange('rentalPeriod', next)} />
          )}
        </div>
      </section>
      <section className="ws-form-section" aria-labelledby="pf-specs">
        <h3 id="pf-specs">Specifications</h3>
        <div className="ws-form-grid">
          <TextField label="Bedrooms" value={value.beds} onChange={beds => set({ beds: beds.trim() })} max={18} inputMode="decimal" error={err('beds')} />
          <TextField label="Bathrooms" value={value.baths} onChange={baths => set({ baths: baths.trim() })} max={18} inputMode="decimal" error={err('baths')} />
          <TextField label="Area" value={value.area} onChange={area => set({ area: area.replace(/[,\s]/g, '') })} max={18} inputMode="decimal" error={err('area')} />
          <SelectField label="Area unit" value={value.areaUnit} error={err('areaUnit')} options={LISTING_AREA_UNITS.map(unit => ({ value: unit, label: unit }))} onChange={areaUnit => set({ areaUnit })} />
        </div>
      </section>
      <section className="ws-form-section" aria-labelledby="pf-marketing">
        <h3 id="pf-marketing">Marketing details</h3>
        <div className="ws-form-grid">
          <TextField label="Status" value={value.status} onChange={status => set({ status })} max={STORAGE_LIMIT.text} error={err('status')} list="pf-status" placeholder="For sale, Under offer, Sold…" />
          <datalist id="pf-status">{['Active', 'For sale', 'For rent', 'New launch', 'Under offer', 'Sold', 'Rented'].map(option => <option key={option} value={option} />)}</datalist>
          <TextField label="Features (one per line)" value={value.features.join('\n')} onChange={text => set({ features: text.split('\n').map(line => line.replace(/^\s*[-•*]\s*/, '')).filter((line, index, all) => line.trim() || index === all.length - 1).slice(0, 50) })}
            max={50 * 500} error={err('features')} multiline full hint="Up to 50 features, 500 characters each." />
        </div>
      </section>
    </div>
  );
}
