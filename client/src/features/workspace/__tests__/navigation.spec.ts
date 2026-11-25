import { describe, expect, it } from 'vitest';
import { WORKSPACE_NAV, accountInitials, activeNavItem } from '../navigation';

describe('workspace navigation contract (rev-2 spec §3)', () => {
  // Contract: the exact menu order agreed on 2026-11-17.
  it('lists Home, Listings, Templates, Designs, Agent & brand, How it works in that order', () => {
    expect(WORKSPACE_NAV.map(item => [item.label, item.href])).toEqual([
      ['Home', '/workspace'], ['Listings', '/listings'], ['Templates', '/templates'], ['Designs', '/my-designs'], ['Agent & brand', '/agent-brand'], ['How it works', '/workspace/how-it-works'],
    ]);
  });
  // Contract: Listings stays active on its detail and new routes; How it works never also lights up Home.
  it.each([
    ['/listings', 'listings'], ['/listings/new', 'listings'], ['/listings/c123', 'listings'], ['/listings/', 'listings'],
    ['/workspace/how-it-works', 'how-it-works'], ['/workspace', 'home'], ['/my-designs', 'designs'], ['/agent-brand', 'agent-brand'],
    ['/account', null], ['/usage', null], ['/listingsx', null],
  ])('%s -> %s', (path, expected) => { expect(activeNavItem(path)).toBe(expected); });
});

describe('accountInitials — account identity, never the marketing agent', () => {
  it.each([
    ['Dinesh Kumar', 'd@x.test', 'DK'], ['Priya', 'p@x.test', 'PR'], ['', 'alex.agent@x.test', 'AA'], [undefined, undefined, '?'],
  ])('%s / %s -> %s', (name, email, expected) => { expect(accountInitials(name, email)).toBe(expected); });
});
