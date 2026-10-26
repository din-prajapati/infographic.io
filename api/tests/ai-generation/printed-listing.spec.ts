/**
 * US-EDIT-018 AC4 — a poster's printed listing is stored with the generation
 * and returned on each variation, so the editor can show what the image shows.
 */
import { describe, it, expect } from 'vitest';
import { buildPrintedListing } from '../../src/modules/ai-generation/services/infographic-prompt.builder';
import { GenerationsService } from '../../src/modules/infographics/services/generations.service';

const listing = {
  address: 'Bandra West, Mumbai',
  price: 42000000,
  beds: 3,
  baths: 2,
  sqft: 1850,
  locale: 'en-IN',
  agent: { name: 'Priya Shah', brokerage: 'Skyline Realty' },
};

describe('buildPrintedListing', () => {
  it('holds exactly the strings the poster was asked to print, plus the raw stats numbers', () => {
    const printed = buildPrintedListing(listing, 'Sea-View Living');
    expect(printed.headline).toBe('Sea-View Living');
    expect(printed.address).toBe('Bandra West, Mumbai');
    expect(printed.price).toMatch(/4\.2 Cr/);
    expect(printed.agentName).toBe('Priya Shah');
    expect(printed.brokerage).toBe('Skyline Realty');
    expect(printed.stats).toMatch(/3 BHK/);
    expect(printed).toMatchObject({ beds: 3, baths: 2, sqft: 1850 });
  });

  it('leaves out what the poster does not print', () => {
    const printed = buildPrintedListing({ price: 500000 }, 'Home');
    expect(Object.keys(printed).sort()).toEqual(['headline', 'price']);
  });
});

// TC-EDIT-018-04 — through the real service, with a stub database row.
function serviceWith(propertyData: unknown) {
  const prisma = {
    infographic: {
      findUnique: async () => ({ id: 'g1', status: 'completed', imageUrl: 'https://cdn.test/a.png', propertyData }),
    },
  };
  const none = undefined as never;
  return new GenerationsService(none, none, none, none, none, none, none, prisma as never);
}

describe('GET /generations/:id/variations carries the printed listing', () => {
  const variations = [{ id: 'v1', imageUrl: 'https://cdn.test/1.png', title: 'Variation 1', description: 'd' }];

  it('returns it on every variation when the generation stored one', async () => {
    const printedListing = { headline: 'Sea-View Living', price: '₹4.2 Cr' };
    const result = await serviceWith({ composition: 'poster', variations, printedListing }).getVariations('g1');
    expect(result[0]).toMatchObject({ composition: 'poster', listing: printedListing });
  });

  it('leaves the key absent for a background or a generation made before US-EDIT-018 (AC6)', async () => {
    const result = await serviceWith({ composition: 'background', variations }).getVariations('g1');
    expect('listing' in result[0]).toBe(false);
    const legacy = await serviceWith({ variations }).getVariations('g1');
    expect('listing' in legacy[0]).toBe(false);
  });

  it('carries it on the single-variation fallback too', async () => {
    const result = await serviceWith({ composition: 'poster', printedListing: { price: '₹1 Cr' } }).getVariations('g1');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ listing: { price: '₹1 Cr' } });
  });
});
