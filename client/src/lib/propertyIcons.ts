import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapPin, DoorOpen, BedDouble, Ruler, CalendarDays, KeyRound, CookingPot, Refrigerator, ShowerHead, Bath, WashingMachine, Heater, Snowflake, Sun, Sofa, Wifi, CircleParking, ArrowUpDown, Accessibility, Trees, Fence, Phone, Mail, PawPrint, Archive, ShieldCheck, type LucideIcon } from 'lucide-react';
import type { ImageElement } from './canvasTypes';
import { createImageElement } from './canvasUtils';

export const PROPERTY_ICON_CATEGORIES = ['Property details', 'Kitchen & bathroom', 'Comfort', 'Building & outdoors', 'Contact'] as const;
export type PropertyIconCategory = typeof PROPERTY_ICON_CATEGORIES[number];
export interface PropertyIconMetadata { id: string; color: string; strokeWidth: number; version: 1; opacity?: number }
export interface PropertyIconDefinition { id: string; label: string; labelDe: string; category: PropertyIconCategory; keywords: string; component: LucideIcon }

export const PROPERTY_ICONS: readonly PropertyIconDefinition[] = [
  { id: 'location', label: 'Location', labelDe: 'Lage', category: 'Property details', keywords: 'address adresse ort standort', component: MapPin },
  { id: 'rooms', label: 'Rooms', labelDe: 'Zimmer', category: 'Property details', keywords: 'raum räume room', component: DoorOpen },
  { id: 'bedrooms', label: 'Bedrooms', labelDe: 'Schlafzimmer', category: 'Property details', keywords: 'bed bett bedroom', component: BedDouble },
  { id: 'floor-area', label: 'Floor area', labelDe: 'Wohnfläche', category: 'Property details', keywords: 'size area fläche quadratmeter sqm', component: Ruler },
  { id: 'availability', label: 'Availability', labelDe: 'Verfügbarkeit', category: 'Property details', keywords: 'calendar date datum verfügbar', component: CalendarDays },
  { id: 'keys', label: 'Keys', labelDe: 'Schlüssel', category: 'Property details', keywords: 'key access zugang', component: KeyRound },
  { id: 'cooker', label: 'Cooker', labelDe: 'Herd', category: 'Kitchen & bathroom', keywords: 'kitchen küche kochen oven ofen', component: CookingPot },
  { id: 'refrigerator', label: 'Refrigerator', labelDe: 'Kühlschrank', category: 'Kitchen & bathroom', keywords: 'fridge kitchen küche', component: Refrigerator },
  { id: 'shower', label: 'Shower', labelDe: 'Dusche', category: 'Kitchen & bathroom', keywords: 'bathroom bad duschen', component: ShowerHead },
  { id: 'bath', label: 'Bath', labelDe: 'Badewanne', category: 'Kitchen & bathroom', keywords: 'bathtub bathroom bad', component: Bath },
  { id: 'washing-machine', label: 'Washing machine', labelDe: 'Waschmaschine', category: 'Kitchen & bathroom', keywords: 'laundry waschen', component: WashingMachine },
  { id: 'heating', label: 'Heating', labelDe: 'Heizung', category: 'Comfort', keywords: 'heater radiator warm wärme', component: Heater },
  { id: 'air-conditioning', label: 'Air conditioning', labelDe: 'Klimaanlage', category: 'Comfort', keywords: 'ac cooling kühlung', component: Snowflake },
  { id: 'daylight', label: 'Daylight', labelDe: 'Tageslicht', category: 'Comfort', keywords: 'sunlight sun sonne hell', component: Sun },
  { id: 'furnished', label: 'Furnished', labelDe: 'Möbliert', category: 'Comfort', keywords: 'furniture sofa möbel', component: Sofa },
  { id: 'wifi', label: 'Wi-Fi', labelDe: 'WLAN', category: 'Comfort', keywords: 'wifi internet wireless', component: Wifi },
  { id: 'parking', label: 'Parking', labelDe: 'Parkplatz', category: 'Building & outdoors', keywords: 'garage car auto parken', component: CircleParking },
  { id: 'lift', label: 'Lift', labelDe: 'Aufzug', category: 'Building & outdoors', keywords: 'elevator fahrstuhl', component: ArrowUpDown },
  { id: 'accessibility', label: 'Accessibility', labelDe: 'Barrierefreiheit', category: 'Building & outdoors', keywords: 'accessible wheelchair rollstuhl barrierefrei', component: Accessibility },
  { id: 'garden', label: 'Garden', labelDe: 'Garten', category: 'Building & outdoors', keywords: 'outdoor grün trees bäume', component: Trees },
  { id: 'balcony', label: 'Balcony', labelDe: 'Balkon', category: 'Building & outdoors', keywords: 'terrace terrasse', component: Fence },
  { id: 'phone', label: 'Phone', labelDe: 'Telefon', category: 'Contact', keywords: 'call anrufen mobil', component: Phone },
  { id: 'email', label: 'Email', labelDe: 'E-Mail', category: 'Contact', keywords: 'mail contact kontakt', component: Mail },
  { id: 'pet-friendly', label: 'Pet friendly', labelDe: 'Haustiere erlaubt', category: 'Comfort', keywords: 'pets dog cat hund katze', component: PawPrint },
  { id: 'storage', label: 'Storage', labelDe: 'Abstellraum', category: 'Property details', keywords: 'store keller lager stauraum', component: Archive },
  { id: 'security', label: 'Security', labelDe: 'Sicherheit', category: 'Building & outdoors', keywords: 'secure alarm sicher', component: ShieldCheck },
];

export function findPropertyIcons(query: string, category?: PropertyIconCategory): PropertyIconDefinition[] {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return PROPERTY_ICONS.filter(icon => (!category || icon.category === category) && words.every(word => `${icon.label} ${icon.labelDe} ${icon.keywords}`.toLocaleLowerCase().includes(word)));
}

export function isValidPropertyIcon(value: unknown): value is PropertyIconMetadata {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const icon = value as Record<string, unknown>;
  return icon.version === 1 && PROPERTY_ICONS.some(item => item.id === icon.id)
    && typeof icon.color === 'string' && (icon.color === 'none' || /^#[\da-f]{6}$/i.test(icon.color))
    && typeof icon.strokeWidth === 'number' && Number.isFinite(icon.strokeWidth) && icon.strokeWidth >= .5 && icon.strokeWidth <= 4
    && (icon.opacity === undefined || typeof icon.opacity === 'number' && Number.isFinite(icon.opacity) && icon.opacity >= 0 && icon.opacity <= 1);
}

export function propertyIconSource(metadata: unknown): string {
  if (!isValidPropertyIcon(metadata)) throw new Error('Invalid property icon');
  const definition = PROPERTY_ICONS.find(icon => icon.id === metadata.id)!;
  const markup = renderToStaticMarkup(createElement(definition.component, { width: 24, height: 24, color: metadata.color, strokeWidth: metadata.strokeWidth, opacity: metadata.opacity ?? 1, absoluteStrokeWidth: false }));
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

export function createPropertyIcon(id: string, options: { color?: string; strokeWidth?: number; opacity?: number; x?: number; y?: number; size?: number } = {}): ImageElement {
  const metadata: PropertyIconMetadata = { id, color: options.color ?? '#1F1F1F', strokeWidth: options.strokeWidth ?? 2, opacity: options.opacity ?? 1, version: 1 };
  const size = options.size ?? 48, x = options.x ?? 100, y = options.y ?? 100;
  if (![size, x, y].every(Number.isFinite) || size <= 0) throw new Error('Invalid property icon frame');
  const element = createImageElement(propertyIconSource(metadata), x, y, size, size);
  return { ...element, icon: metadata, objectFit: 'contain', name: PROPERTY_ICONS.find(icon => icon.id === id)!.label };
}

export function propertyIconPatch(element: ImageElement, options: { id?: string; color?: string; strokeWidth?: number; opacity?: number }): Partial<ImageElement> | null {
  if (element.locked || !element.visible || !isValidPropertyIcon(element.icon)) return null;
  const metadata = { ...element.icon, ...options };
  if (!isValidPropertyIcon(metadata)) return null;
  return { icon: metadata, src: propertyIconSource(metadata), name: PROPERTY_ICONS.find(icon => icon.id === metadata.id)!.label };
}
