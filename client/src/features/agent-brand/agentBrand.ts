import { createEmptyListing, type ListingProfile } from '@shared/listingWorkflow';
import { fieldErrors } from '@/features/listings/listingFormat';

import { isHexColor, normalizeHex, validateListingIdentity } from '@shared/listingIdentity';
export { isHexColor, normalizeHex };

/** Field errors for the Agent & Brand draft: shared record validation plus e-mail and HEX checks. */
export function identityErrors(identity: ListingProfile['record']): Record<string, string> {
  const errors = Object.fromEntries(Object.entries(fieldErrors({ ...createEmptyListing(), agent: identity.agent, brand: identity.brand })).filter(([path]) => path.startsWith('agent.') || path.startsWith('brand.')));
  for (const message of validateListingIdentity(identity)) {
    const split = message.indexOf(': ');
    errors[message.slice(0, split)] ??= message.slice(split + 2);
  }
  return errors;
}

/** Supporting shades are derived for preview, not extra saved brand colours. */
export function brandPreviewPalette(value: string): string[] {
  if (!isHexColor(value)) return [];
  const accent = normalizeHex(value);
  const channels = [1, 3, 5].map(start => parseInt(accent.slice(start, start + 2), 16));
  const mix = (target: number, weight: number) => '#' + channels.map(channel => Math.round(channel * (1 - weight) + target * weight).toString(16).padStart(2, '0')).join('').toUpperCase();
  return [accent, mix(0, 0.55), mix(255, 0.9)];
}
