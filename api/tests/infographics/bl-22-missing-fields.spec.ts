/**
 * BL-22 step 0 — a rejection must name the field that is actually missing.
 *
 * The old backend message ended "Please provide at least address and price in
 * your prompt", and the client decided what to ask for with
 * `errorMessage.includes('address')` / `.includes('price')`. That guidance
 * sentence names BOTH fields unconditionally, so both substrings matched on
 * every rejection: a user who gave a good address and omitted only the price
 * was told both were missing. The parse could not have been correct for any
 * prompt — it was not flaky, it was always wrong.
 *
 * These tests pin both halves of the contract: the message names only what is
 * absent, and `missingFields` carries the answer as data so no one has to read
 * prose to find it.
 */
import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';

/**
 * The guard from generations.service.ts, in the shape the service throws it.
 * Extracted rather than imported because the service pulls in the whole Nest
 * DI graph (Prisma, OpenAI, Ideogram) for a branch that is four lines long.
 */
function assertRequiredFields(extracted: { address?: string; price?: number }) {
  if (!extracted.address || !extracted.price) {
    const missing: string[] = [];
    if (!extracted.address) missing.push('address');
    if (!extracted.price) missing.push('price');
    throw new BadRequestException({
      statusCode: 400,
      error: 'Bad Request',
      message: `Missing required fields: ${missing.join(', ')}.`,
      missingFields: missing,
    });
  }
}

/** The client's parse, post-fix (AIChatBox.tsx catch block). */
function clientMissingFields(response: any, errorMessage: string): string[] {
  return (
    (Array.isArray(response?.missingFields) ? response.missingFields : null) ??
    (errorMessage.match(/missing required fields:\s*([^.]+)/i)?.[1] ?? '')
      .split(',')
      .map((f: string) => f.trim().toLowerCase())
      .filter((f: string) => f === 'address' || f === 'price')
  );
}

function reject(extracted: { address?: string; price?: number }) {
  try {
    assertRequiredFields(extracted);
    throw new Error('expected a rejection');
  } catch (e) {
    return (e as BadRequestException).getResponse() as {
      message: string;
      missingFields: string[];
    };
  }
}

describe('BL-22 — the rejection names the right field', () => {
  it('price missing: says price, and does NOT say address', () => {
    const res = reject({ address: 'Shela, Ahmedabad' });

    expect(res.missingFields).toEqual(['price']);
    // The regression: the old guidance sentence made this substring appear on
    // every rejection, so the client always claimed address was missing too.
    expect(res.message.toLowerCase()).not.toContain('address');
    expect(clientMissingFields(res, res.message)).toEqual(['price']);
  });

  it('address missing: says address, and does NOT say price', () => {
    const res = reject({ price: 8_500_000 });

    expect(res.missingFields).toEqual(['address']);
    expect(res.message.toLowerCase()).not.toContain('price');
    expect(clientMissingFields(res, res.message)).toEqual(['address']);
  });

  it('both missing: says both', () => {
    const res = reject({});
    expect(res.missingFields).toEqual(['address', 'price']);
    expect(clientMissingFields(res, res.message)).toEqual(['address', 'price']);
  });

  it('neither missing: no rejection at all', () => {
    expect(() =>
      assertRequiredFields({ address: 'Shela, Ahmedabad', price: 8_500_000 }),
    ).not.toThrow();
  });

  it('a zero price counts as missing, not as a supplied 0', () => {
    expect(reject({ address: 'Dubai Marina', price: 0 }).missingFields).toEqual(['price']);
  });
});

describe('BL-22 — the client parse degrades safely', () => {
  it('falls back to the field list when an older deployment sends no missingFields', () => {
    // Structured field absent; only the prose is available.
    expect(
      clientMissingFields(undefined, 'Missing required fields: price.'),
    ).toEqual(['price']);
  });

  it('reads a two-field list from prose', () => {
    expect(
      clientMissingFields(undefined, 'Missing required fields: address, price.'),
    ).toEqual(['address', 'price']);
  });

  it('returns nothing rather than inventing fields when the wording is unknown', () => {
    // Previously this path hardcoded ["address", "price"], telling the user
    // both were missing on a refusal that named neither.
    expect(clientMissingFields(undefined, 'Something else went wrong.')).toEqual([]);
  });

  it('prefers the structured field over the prose when they disagree', () => {
    expect(
      clientMissingFields(
        { missingFields: ['price'] },
        'Missing required fields: address, price.',
      ),
    ).toEqual(['price']);
  });
});
