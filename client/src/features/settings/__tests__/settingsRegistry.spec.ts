import { describe, it, expect } from 'vitest';
import { SETTINGS_INDEX, SETTINGS_TABS, parseSettingsHash, searchSettings, settingsHash } from '../settingsRegistry';
import { creditsResetDate, planName } from '../panes/UsagePane';

describe('settings hash routing', () => {
  it.each([
    ['#settings', { tab: 'account', settingId: null }],
    ['#settings/', { tab: 'account', settingId: null }],
    ['#settings/billing', { tab: 'billing', settingId: null }],
    ['#settings/usage/export-usage', { tab: 'usage', settingId: 'export-usage' }],
    ['#settings/unknown', { tab: 'account', settingId: null }],
  ])('parses %s', (hash, expected) => { expect(parseSettingsHash(hash)).toEqual(expected); });

  it.each(['', '#', '#ws-main', '#settingsx', '#other/settings'])('treats %j as closed', hash => {
    expect(parseSettingsHash(hash)).toBeNull();
  });

  it('drops a setting id that belongs to another tab or does not exist', () => {
    expect(parseSettingsHash('#settings/billing/theme')).toEqual({ tab: 'billing', settingId: null });
    expect(parseSettingsHash('#settings/account/nope')).toEqual({ tab: 'account', settingId: null });
  });

  it('builds hashes that round-trip', () => {
    expect(settingsHash('privacy')).toBe('#settings/privacy');
    expect(settingsHash('account', 'full-name')).toBe('#settings/account/full-name');
    for (const entry of SETTINGS_INDEX) expect(parseSettingsHash(settingsHash(entry.tab, entry.id))).toEqual({ tab: entry.tab, settingId: entry.id });
  });

  it('every indexed setting points at a real tab and has a unique id', () => {
    const tabs = new Set(SETTINGS_TABS.map(tab => tab.id));
    const ids = SETTINGS_INDEX.map(entry => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const entry of SETTINGS_INDEX) expect(tabs.has(entry.tab)).toBe(true);
  });

  it('tabs are Account · Billing · Usage · Organization, then Appearance · Privacy', () => {
    expect(SETTINGS_TABS.map(tab => `${tab.group}:${tab.label}`)).toEqual([
      'account:Account', 'account:Billing', 'account:Usage', 'account:Organization', 'preferences:Appearance', 'preferences:Privacy',
    ]);
  });
});

describe('searchSettings', () => {
  const ids = (query: string, tabs?: Parameters<typeof searchSettings>[1]) => searchSettings(query, tabs).map(result => result.id);

  it('returns nothing for an empty query', () => { expect(ids('   ')).toEqual([]); });
  it('ranks a label prefix first', () => { expect(ids('pass')[0]).toBe('password'); });
  it('matches keywords: "dark mode" finds Theme', () => { expect(ids('dark mode')).toEqual(['theme']); });
  it('matches every term anywhere: "dark theme" finds Theme', () => { expect(ids('dark theme')).toEqual(['theme']); });
  it('is case-insensitive and matches descriptions: "CSV" finds the usage export', () => { expect(ids('CSV')).toContain('export-usage'); });
  it('matches tab names: "billing" finds the billing settings', () => { expect(ids('billing')).toEqual(['current-plan', 'payment-history', 'cancel-plan']); });
  it('"invoice" finds payment history', () => { expect(ids('invoice')).toEqual(['payment-history']); });
  it('"delete account" finds Your data', () => { expect(ids('delete account')).toEqual(['your-data']); });
  it('"team" finds the Organization settings (the tab used to be called Team)', () => {
    // Keyword hits rank first; "Full name" follows because its description says "…to your team".
    expect(ids('team')).toEqual(['organization-seats', 'organization-members', 'add-member', 'full-name']);
  });
  it('"invite" finds Add member', () => { expect(ids('invite')).toEqual(['add-member']); });
  it('only searches the tabs it is given', () => {
    expect(ids('members', ['account', 'billing', 'usage', 'appearance', 'privacy'])).toEqual([]);
  });
  it('returns the tab label with each result', () => {
    expect(searchSettings('theme')[0]).toMatchObject({ id: 'theme', tabLabel: 'Appearance', section: 'Theme' });
  });
  it('finds nothing for an unknown term', () => { expect(ids('zzzz')).toEqual([]); });
});

describe('creditsResetDate (matches the server’s calendar-month window)', () => {
  it.each([['2026-11-18T10:00:00', '1 Dec 2026'], ['2026-12-31T23:00:00', '1 Jan 2027'], ['2026-01-01T00:00:00', '1 Feb 2026']])('%s → %s', (now, expected) => {
    expect(creditsResetDate(new Date(now), 'en-GB')).toBe(expected);
  });
});

describe('planName', () => {
  it.each([['FREE', 'Free'], ['solo', 'Solo'], ['API_STARTER', 'API Starter'], ['API_ENTERPRISE', 'API Enterprise']])('%s → %s', (tier, name) => {
    expect(planName(tier)).toBe(name);
  });
});
