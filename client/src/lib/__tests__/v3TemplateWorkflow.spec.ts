import { describe, expect, it } from 'vitest';
import { createEmptyListing } from '@shared/listingWorkflow';
import { createTextElement, createImageElement } from '../canvasUtils';
import { createReusableTemplate, createDesignFromTemplate } from '../v3TemplateWorkflow';

describe('listing Template and Design separation', () => {
  // Contract: saving linked elements into a reusable Template removes current facts,
  // retaining exactly the layout, mapping and explicit static text.
  it('strips linked facts and photos while retaining static text and crop', () => {
    const text = { ...createTextElement(0, 0, 'Old address'), slot: 'property.location', x: 81 };
    const photo = { ...createImageElement('data:image/png;base64,AA==', 5, 6, 100, 100), slot: 'property.heroImage', crop: { x: 1, y: 2, width: 80, height: 60 } };
    const staticText = createTextElement(0, 0, 'Our service promise');
    const template = createReusableTemplate({ elements: [text, photo, staticText], canvasWidth: 800, canvasHeight: 600, listing: { property: { address: 'Old address' } } });
    expect(template.elements[0]).toMatchObject({ content: '[Address]', x: 81, slot: 'property.location' });
    expect(template.elements[1]).toMatchObject({ src: '', crop: photo.crop });
    expect(template.elements[2]).toMatchObject({ content: 'Our service promise' });
    expect(template.listing).toBeUndefined();
    expect(template.v3Listing).toBeUndefined();
  });
  // Contract: two listings filled into one Template produce isolated source and artwork.
  it('creates two independently editable Designs without mutating the Template', () => {
    const text = { ...createTextElement(0, 0, '[Address]'), slot: 'property.location' };
    const template = createReusableTemplate({ elements: [text], canvasWidth: 800, canvasHeight: 600 });
    const first = createEmptyListing(); first.property.address = '10 Oak Road';
    const second = createEmptyListing(); second.property.address = '20 Birch Road';
    const a = createDesignFromTemplate(template, first, 'property-a');
    const b = createDesignFromTemplate(template, second, 'property-b');
    expect(a.elements[0]).toMatchObject({ content: '10 Oak Road' });
    expect(b.elements[0]).toMatchObject({ content: '20 Birch Road' });
    expect(a.v3Listing?.selectedListingId).toBe('property-a');
    expect(b.v3Listing?.selectedListingId).toBe('property-b');
    (a.elements[0] as typeof text).content = 'Customized';
    expect(b.elements[0]).toMatchObject({ content: '20 Birch Road' });
    expect(template.elements[0]).toMatchObject({ content: '[Address]' });
  });
  // Contract: missing photo input cannot import another property's linked photograph.
  it('leaves a new Design missing photo frame explicitly empty', () => {
    const image = { ...createImageElement('old-photo', 5, 6, 100, 100), slot: 'property.heroImage' };
    const doc = createDesignFromTemplate({ elements: [image], canvasWidth: 800, canvasHeight: 600 }, createEmptyListing());
    expect(doc.elements[0]).toMatchObject({ src: '' });
  });
});
