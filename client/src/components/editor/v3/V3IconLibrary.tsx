import React, { useState } from 'react';
import { Search, Check } from 'lucide-react';
import type { CanvasElement, ImageElement, TextElement } from '../../../lib/canvasTypes';
import { createTextElement } from '../../../lib/canvasUtils';
import { PROPERTY_ICON_CATEGORIES, createPropertyIcon, findPropertyIcons, propertyIconPatch, type PropertyIconCategory, type PropertyIconDefinition } from '../../../lib/propertyIcons';
import { usePropertyStore } from '../../../hooks/usePropertyStore';
import { useAgentStore } from '../../../hooks/useAgentStore';
import './v3-icon-library.css';

export interface V3IconLibraryProps {
  mode: 'icons' | 'emoji';
  onInsert: (elements: CanvasElement[]) => void;
  replaceElement?: ImageElement;
  onReplace?: (patch: Partial<ImageElement>) => void;
}

const EMOJI = [
  { label: 'House', de: 'Haus', value: '🏠' }, { label: 'Key', de: 'Schlüssel', value: '🔑' },
  { label: 'Bed', de: 'Bett', value: '🛏️' }, { label: 'Shower', de: 'Dusche', value: '🚿' },
  { label: 'Bath', de: 'Bad', value: '🛁' }, { label: 'Sun', de: 'Sonne', value: '☀️' },
  { label: 'Garden', de: 'Garten', value: '🌳' }, { label: 'Car', de: 'Auto', value: '🚗' },
  { label: 'Phone', de: 'Telefon', value: '☎️' }, { label: 'Email', de: 'E-Mail', value: '✉️' },
  { label: 'Calendar', de: 'Kalender', value: '📅' }, { label: 'Location', de: 'Lage', value: '📍' },
];

function createLabel(icon: PropertyIconDefinition, image: ImageElement, language: 'en' | 'de'): TextElement {
  const property = usePropertyStore.getState().property, agent = useAgentStore.getState().agent;
  const label = language === 'de' ? icon.labelDe : icon.label;
  const binding = icon.id === 'location' ? { value: property.address, slot: 'property.location' }
    : icon.id === 'phone' ? { value: agent.phone, slot: 'agent.phone' }
      : icon.id === 'email' ? { value: agent.email, slot: 'agent.email' } : undefined;
  return { ...createTextElement(image.x + image.width + 16, image.y + 4, binding?.value.trim() || label),
    name: `${label} label`, width: 260, height: 40, fontSize: 24, color: image.icon?.color === 'none' ? '#1F1F1F' : image.icon?.color ?? '#1F1F1F',
    ...(binding ? { slot: binding.slot } : {}) };
}

export function V3IconLibrary({ mode, onInsert, replaceElement, onReplace }: V3IconLibraryProps) {
  const [query, setQuery] = useState(''), [category, setCategory] = useState<PropertyIconCategory | ''>('');
  const [withLabel, setWithLabel] = useState(false), [language, setLanguage] = useState<'en' | 'de'>('en');
  const replacing = Boolean(replaceElement && onReplace);
  const disabled = replacing && Boolean(replaceElement?.locked || !replaceElement?.visible);
  const icons = findPropertyIcons(query, category || undefined);
  const insert = (icon: PropertyIconDefinition) => {
    if (replacing && replaceElement && onReplace) {
      const patch = propertyIconPatch(replaceElement, { id: icon.id });
      if (patch) onReplace(patch);
      return;
    }
    const image = createPropertyIcon(icon.id);
    onInsert(withLabel ? [image, createLabel(icon, image, language)] : [image]);
  };
  return <section className="v3-icon-library" aria-label={mode === 'icons' ? 'Property icons' : 'Emoji library'}>
    <label className="v3-library-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label={mode === 'icons' ? 'Search property icons' : 'Search emoji'} placeholder={mode === 'icons' ? 'Search heater / Heizung' : 'Search emoji'} value={query} onChange={event => setQuery(event.target.value)} /></label>
    {mode === 'emoji' ? <><p className="v3-library-note">Editable text emoji; appearance varies by device and font.</p><div className="v3-property-icon-grid v3-emoji-grid">
      {EMOJI.filter(emoji => `${emoji.label} ${emoji.de}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).map(emoji => <button type="button" key={emoji.label} aria-label={`Insert ${emoji.label} emoji`} onClick={() => {
        const element = { ...createTextElement(100, 100, emoji.value), name: `${emoji.label} emoji`, fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", Arial, sans-serif', fontSize: 48, width: 80, height: 80 };
        onInsert([element]);
      }}><span aria-hidden="true" className="v3-emoji-preview">{emoji.value}</span><span>{emoji.label}</span></button>)}
    </div>{!EMOJI.some(emoji => `${emoji.label} ${emoji.de}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) && <p role="status">No emoji found. Try another search.</p>}</> : <>
      <div className="v3-library-settings"><label>Category<select aria-label="Icon category" value={category} onChange={event => setCategory(event.target.value as PropertyIconCategory | '')}><option value="">All categories</option>{PROPERTY_ICON_CATEGORIES.map(value => <option key={value}>{value}</option>)}</select></label><label>Labels<select aria-label="Icon label language" value={language} onChange={event => setLanguage(event.target.value as 'en' | 'de')}><option value="en">English</option><option value="de">Deutsch</option></select></label></div>
      {!replacing && <div className="v3-icon-insertion-mode" role="group" aria-label="Icon insertion style"><button type="button" aria-label="Icon only" aria-pressed={!withLabel} onClick={() => setWithLabel(false)}>Icon only</button><button type="button" aria-label="Icon + label" aria-pressed={withLabel} onClick={() => setWithLabel(true)}>Icon + label</button></div>}
      {replacing && <p className="v3-library-note">Replace the icon while keeping its frame and styles.</p>}
      {!icons.length && <p role="status">No icons found. Try another search.</p>}
      {PROPERTY_ICON_CATEGORIES.filter(group => icons.some(icon => icon.category === group)).map(group => <section key={group} aria-label={group}><h3>{group}</h3><div className="v3-property-icon-grid">{icons.filter(icon => icon.category === group).map(icon => {
        const Icon = icon.component, selected = replacing && replaceElement?.icon?.id === icon.id;
        return <button key={icon.id} type="button" disabled={disabled} aria-label={`${replacing ? 'Replace with' : 'Insert'} ${icon.label}`} aria-pressed={selected} title={`${icon.label} · ${icon.labelDe}`} onClick={() => insert(icon)}><Icon size={30} strokeWidth={1.6} aria-hidden="true" /><span>{language === 'de' ? icon.labelDe : icon.label}</span>{selected && <Check className="v3-icon-current" size={13} aria-hidden="true" />}</button>;
      })}</div></section>)}
      <p className="v3-library-note">Rooms and Bedrooms are separate. Amenity labels are editable; confirm property details before publishing.</p>
    </>}
  </section>;
}
