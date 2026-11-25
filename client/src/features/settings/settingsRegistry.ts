import { Building2, CreditCard, Gauge, Palette, Shield, User, type LucideIcon } from 'lucide-react';

/**
 * Settings dialog registry (docs/research/2026-11-18-ACCOUNT-MENU-SETTINGS-STRUCTURE-SPEC.md §4, §9).
 *
 * The dialog is routed by the URL hash so it opens over whatever page is showing:
 *   #settings/<tab>            — open on a tab
 *   #settings/<tab>/<settingId> — open on a tab and scroll to one setting (used by search and deep links)
 * Pure data + pure functions only, so routing and search are unit-tested without a DOM.
 */
export type SettingsTabId = 'account' | 'billing' | 'usage' | 'organization' | 'appearance' | 'privacy';
export type SettingsGroupId = 'account' | 'preferences';

export interface SettingsTab { id: SettingsTabId; label: string; icon: LucideIcon; group: SettingsGroupId; description: string }

export const SETTINGS_TABS: readonly SettingsTab[] = [
  { id: 'account', label: 'Account', icon: User, group: 'account', description: 'Your name, photo and sign-in.' },
  { id: 'billing', label: 'Billing', icon: CreditCard, group: 'account', description: 'Your plan and payment history.' },
  { id: 'usage', label: 'Usage', icon: Gauge, group: 'account', description: 'Credits used this month and recent activity.' },
  { id: 'organization', label: 'Organization', icon: Building2, group: 'account', description: 'Your organization, seats and members.' },
  { id: 'appearance', label: 'Appearance', icon: Palette, group: 'preferences', description: 'Light, dark or system theme.' },
  { id: 'privacy', label: 'Privacy', icon: Shield, group: 'preferences', description: 'Policies and your data.' },
];
export const SETTINGS_GROUPS: readonly SettingsGroupId[] = ['account', 'preferences'];
export const DEFAULT_SETTINGS_TAB: SettingsTabId = 'account';

/** One searchable setting. `id` matches the `data-setting-id` on the row the pane renders. */
export interface SettingEntry { id: string; tab: SettingsTabId; section: string; label: string; description: string; keywords?: string[] }

export const SETTINGS_INDEX: readonly SettingEntry[] = [
  { id: 'profile-photo', tab: 'account', section: 'Profile', label: 'Profile photo', description: 'JPEG, PNG, WebP, GIF or AVIF, up to 10 MB.', keywords: ['avatar', 'picture', 'image', 'portrait'] },
  { id: 'full-name', tab: 'account', section: 'Profile', label: 'Full name', description: 'Shown in your account menu and to your team.', keywords: ['name', 'display name', 'profile'] },
  { id: 'email', tab: 'account', section: 'Profile', label: 'Email address', description: 'The address you sign in with.', keywords: ['mail', 'login', 'verified', 'verification'] },
  { id: 'password', tab: 'account', section: 'Sign-in', label: 'Password', description: 'Get an email link to set a new password.', keywords: ['reset', 'change password', 'security', 'forgot'] },
  { id: 'sign-in-method', tab: 'account', section: 'Sign-in', label: 'Sign-in method', description: 'Email and password, or Google.', keywords: ['google', 'login', 'security', 'oauth'] },
  { id: 'current-plan', tab: 'billing', section: 'Current plan', label: 'Current plan', description: 'Your plan, price and next billing date.', keywords: ['subscription', 'upgrade', 'downgrade', 'renew', 'tier', 'pricing', 'change plan'] },
  { id: 'payment-history', tab: 'billing', section: 'Payment history', label: 'Payment history', description: 'Past payments, methods and transaction IDs.', keywords: ['invoices', 'receipts', 'payments', 'transactions', 'upi'] },
  { id: 'cancel-plan', tab: 'billing', section: 'Cancellation', label: 'Cancel subscription', description: 'Stop renewing at the end of this billing period.', keywords: ['cancel', 'unsubscribe', 'stop'] },
  { id: 'design-credits', tab: 'usage', section: 'This month', label: 'Design credits', description: 'Spent each time you generate a new design.', keywords: ['quota', 'limit', 'allowance', 'generations', 'remaining'] },
  { id: 'editable-credits', tab: 'usage', section: 'This month', label: 'Editable credits', description: 'Spent the first time you open a design in the editor.', keywords: ['quota', 'limit', 'allowance', 'editor'] },
  { id: 'monthly-usage', tab: 'usage', section: 'Last 6 months', label: 'Designs per month', description: 'How many designs you generated each month.', keywords: ['chart', 'history', 'trend', 'activity'] },
  { id: 'export-usage', tab: 'usage', section: 'Last 6 months', label: 'Download usage report', description: 'CSV or JSON.', keywords: ['export', 'csv', 'json', 'download', 'report', 'data'] },
  { id: 'organization-seats', tab: 'organization', section: 'Organization', label: 'Seats', description: 'How many people your plan allows.', keywords: ['team', 'org', 'company', 'brokerage', 'workspace', 'seats', 'users'] },
  { id: 'organization-members', tab: 'organization', section: 'Members', label: 'Members', description: 'People who share your organization.', keywords: ['team', 'colleague', 'remove', 'users'] },
  { id: 'add-member', tab: 'organization', section: 'Members', label: 'Add member', description: 'Add someone who already has an account.', keywords: ['invite', 'team', 'colleague', 'add user'] },
  { id: 'theme', tab: 'appearance', section: 'Theme', label: 'Theme', description: 'Light, dark, or follow your system.', keywords: ['dark mode', 'light mode', 'colour', 'color', 'system'] },
  { id: 'policies', tab: 'privacy', section: 'Policies', label: 'Privacy policy and terms', description: 'Privacy, terms, refunds and cookies.', keywords: ['legal', 'terms of service', 'refund', 'cookies', 'gdpr'] },
  { id: 'your-data', tab: 'privacy', section: 'Your data', label: 'Your data', description: 'Download your usage history or ask us to delete your account.', keywords: ['export', 'delete account', 'delete data', 'gdpr', 'download'] },
];

const TAB_IDS = new Set<string>(SETTINGS_TABS.map(tab => tab.id));
const SETTING_IDS = new Set(SETTINGS_INDEX.map(entry => entry.id));

export interface SettingsRoute { tab: SettingsTabId; settingId: string | null }

/** `#settings/billing` → { tab: 'billing' }. Unknown tabs fall back to Account; anything else is "closed" (null). */
export function parseSettingsHash(hash: string): SettingsRoute | null {
  const match = /^#settings(?:\/([a-z-]*))?(?:\/([a-z0-9-]+))?\/?$/.exec(hash);
  if (!match) return null;
  const tab = (match[1] && TAB_IDS.has(match[1]) ? match[1] : DEFAULT_SETTINGS_TAB) as SettingsTabId;
  const settingId = match[2] && SETTING_IDS.has(match[2]) && SETTINGS_INDEX.some(entry => entry.id === match[2] && entry.tab === tab) ? match[2] : null;
  return { tab, settingId };
}

export function settingsHash(tab: SettingsTabId, settingId?: string | null): string {
  return `#settings/${tab}${settingId ? `/${settingId}` : ''}`;
}

export function tabLabel(tab: SettingsTabId): string {
  return SETTINGS_TABS.find(entry => entry.id === tab)?.label ?? 'Settings';
}

export interface SettingsSearchResult extends SettingEntry { tabLabel: string }

/**
 * Case-insensitive search across setting labels, descriptions, keywords, section and tab names.
 * Ranking: label starts with the query > label contains > keyword > section/tab > description; ties keep registry order.
 * Every whitespace-separated term must match somewhere, so "dark theme" finds Theme.
 */
export function searchSettings(query: string, visibleTabs: readonly SettingsTabId[] = SETTINGS_TABS.map(tab => tab.id)): SettingsSearchResult[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const phrase = terms.join(' ');
  const scored: { entry: SettingEntry; score: number; order: number }[] = [];
  SETTINGS_INDEX.forEach((entry, order) => {
    if (!visibleTabs.includes(entry.tab)) return;
    const label = entry.label.toLowerCase();
    const keywords = (entry.keywords ?? []).map(keyword => keyword.toLowerCase());
    const context = `${entry.section} ${tabLabel(entry.tab)}`.toLowerCase();
    const description = entry.description.toLowerCase();
    const haystack = [label, ...keywords, context, description].join(' ');
    if (!terms.every(term => haystack.includes(term))) return;
    const score = label.startsWith(phrase) ? 0
      : label.includes(phrase) ? 1
        : keywords.some(keyword => keyword.includes(phrase)) ? 2
          : context.includes(phrase) ? 3
            : 4;
    scored.push({ entry, score, order });
  });
  return scored
    .sort((a, b) => a.score - b.score || a.order - b.order)
    .map(({ entry }) => ({ ...entry, tabLabel: tabLabel(entry.tab) }));
}
