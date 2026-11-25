import { describe, expect, it } from 'vitest';
import { PROPERTY_ICONS, createPropertyIcon, findPropertyIcons, isValidPropertyIcon, propertyIconPatch, propertyIconSource } from '../propertyIcons';

describe('US-EDIT-041 curated property icons', () => {
  // Contract: exactly 26 distinct bilingual entries; German search finds the corresponding amenity.
  it('offers the complete catalog without confusing rooms and bedrooms', () => {
    expect(PROPERTY_ICONS).toHaveLength(26);
    expect(new Set(PROPERTY_ICONS.map(icon => icon.id)).size).toBe(26);
    expect(findPropertyIcons('HEIZUNG').map(icon => icon.id)).toEqual(['heating']);
    expect(findPropertyIcons('Dusche').map(icon => icon.id)).toEqual(['shower']);
    expect(findPropertyIcons('Küche').map(icon => icon.id)).toContain('cooker');
    expect(PROPERTY_ICONS.find(icon => icon.id === 'rooms')?.label).toBe('Rooms');
    expect(PROPERTY_ICONS.find(icon => icon.id === 'bedrooms')?.label).toBe('Bedrooms');
    expect(findPropertyIcons('not-a-property-icon')).toEqual([]);
    expect(findPropertyIcons('', 'Contact').map(icon => icon.id)).toEqual(['phone', 'email']);
    for (const definition of PROPERTY_ICONS) {
      expect(createPropertyIcon(definition.id).src.startsWith('data:image/svg+xml;charset=utf-8,%3Csvg')).toBe(true);
    }
  });

  // Contract: embedded SVG and bounded metadata survive serialization; replacement changes artwork only.
  it('creates self-contained images and preserves styles when replacing', () => {
    const element = { ...createPropertyIcon('heating', { color: '#123456', strokeWidth: 3, opacity: .4 }), rotation: 37, borderWidth: 4, width: 120, height: 85 };
    const svg = decodeURIComponent(element.src.split(',')[1]);
    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(svg).toContain('stroke="#123456"');
    expect(svg).toContain('stroke-width="3"');
    expect(svg).toContain('opacity="0.4"');
    expect(JSON.parse(JSON.stringify(element)).icon).toEqual({ id: 'heating', color: '#123456', strokeWidth: 3, opacity: .4, version: 1 });
    const patch = propertyIconPatch(element, { id: 'shower' });
    expect(patch?.icon?.id).toBe('shower');
    expect({ ...element, ...patch }).toMatchObject({ id: element.id, rotation: 37, width: 120, height: 85, borderWidth: 4 });
    expect(propertyIconPatch({ ...element, locked: true }, { id: 'shower' })).toBeNull();
    expect(propertyIconPatch({ ...element, visible: false }, { id: 'shower' })).toBeNull();
    expect(propertyIconPatch(element, { color: 'none' })?.src).toContain('stroke%3D%22none%22');
  });

  // Contract: unsupported identity/color/weight/alpha never generates SVG markup.
  it('rejects malformed assets and accepts only supported metadata', () => {
    const valid = { id: 'shower', color: '#000000', strokeWidth: 2, version: 1 };
    expect(isValidPropertyIcon(valid)).toBe(true);
    for (const patch of [{ id: '<script>' }, { color: 'url(javascript:bad)' }, { strokeWidth: 0 }, { strokeWidth: 4.1 }, { opacity: NaN }, { opacity: 2 }, { version: 2 }]) {
      expect(isValidPropertyIcon({ ...valid, ...patch })).toBe(false);
      expect(() => propertyIconSource({ ...valid, ...patch })).toThrow();
    }
    expect(() => createPropertyIcon('unknown')).toThrow();
    expect(() => createPropertyIcon('shower', { size: -1 })).toThrow();
  });
});
