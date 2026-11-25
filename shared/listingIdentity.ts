import type { ListingProfile } from './listingWorkflow';

export const isHexColor = (value: string) => /^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());

export function normalizeHex(value: string): string {
  const raw = value.trim();
  if (!raw || !isHexColor(raw)) return raw;
  const hex = raw.replace('#', '');
  return `#${(hex.length === 3 ? hex.split('').map(char => char + char).join('') : hex).toUpperCase()}`;
}

/** Optional identity fields have the same format rules on the client and API. */
export function validateListingIdentity(identity: ListingProfile['record']): string[] {
  const errors: string[] = [];
  if (identity.agent.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.agent.email.trim())) errors.push('agent.email: Enter an e-mail address like name@agency.com.');
  if (identity.brand.accent.trim() && !isHexColor(identity.brand.accent)) errors.push('brand.accent: Enter a HEX colour like #087E78.');
  return errors;
}
