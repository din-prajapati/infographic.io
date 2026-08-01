/**
 * Format taxonomy — platform/format/dimension table for the Format Picker.
 * Single source of truth read by FormatPickerDialog (step 1 tiles) and by
 * the Library-step filter that matches user templates to a format.
 *
 * No raw pixel numbers are ever shown to users — this file holds them so the
 * canvas can be sized correctly, but the UI renders named labels + shape
 * previews only (AC1, AC8).
 */

export type OrientationBucket = 'landscape' | 'portrait' | 'square';

export interface PlatformFormat {
  /** Stable kebab-case id used as the format tag stored on templates. */
  id: string;
  /** Display label, e.g. "Post" or "Open House Sign". */
  name: string;
  /** Native pixel width of this format's canvas. */
  width: number;
  /** Native pixel height of this format's canvas. */
  height: number;
  /** Orientation bucket — resolves to AI_ARTBOARDS bucket for generation. */
  orientation: OrientationBucket;
}

export interface PlatformGroup {
  /** Display name for the platform section header. */
  platform: string;
  formats: PlatformFormat[];
}

/** Sentinel id for the "Custom size" option — not a real format entry. */
export const CUSTOM_FORMAT_ID = 'custom';

export const FORMAT_TAXONOMY: PlatformGroup[] = [
  {
    /*
     * "For you" is curated by JOB, not by canvas size — these are the six
     * things a listing agent actually produces week to week, each mapped to
     * the shape that job is normally published at. Several share dimensions
     * with entries further down the list (Just Listed and Open House are both
     * square); that duplication is deliberate — an agent looks for "Just
     * Sold", not for "1080×1080".
     */
    platform: 'For you',
    formats: [
      { id: 'curated-just-listed',    name: 'Just Listed',    width: 1080, height: 1350, orientation: 'portrait' },
      { id: 'curated-open-house',     name: 'Open House',     width: 1080, height: 1080, orientation: 'square'   },
      { id: 'curated-just-sold',      name: 'Just Sold',      width: 1080, height: 1080, orientation: 'square'   },
      { id: 'curated-listing-story',  name: 'Listing Story',  width: 1080, height: 1920, orientation: 'portrait' },
      { id: 'curated-property-flyer', name: 'Property Flyer', width: 1240, height: 1754, orientation: 'portrait' },
      { id: 'curated-market-report',  name: 'Market Report',  width: 1080, height: 1350, orientation: 'portrait' },
    ],
  },
  {
    platform: 'Instagram',
    formats: [
      { id: 'instagram-post',        name: 'Post',        width: 1080, height: 1080, orientation: 'square'    },
      { id: 'instagram-story',       name: 'Story',       width: 1080, height: 1920, orientation: 'portrait'  },
      { id: 'instagram-reel-cover',  name: 'Reel Cover',  width: 1080, height: 1920, orientation: 'portrait'  },
    ],
  },
  {
    platform: 'Facebook',
    formats: [
      { id: 'facebook-post',   name: 'Post',   width: 1200, height: 1200, orientation: 'square'    },
      { id: 'facebook-cover',  name: 'Cover',  width: 1200, height:  628, orientation: 'landscape' },
      { id: 'facebook-story',  name: 'Story',  width: 1080, height: 1920, orientation: 'portrait'  },
    ],
  },
  {
    /*
     * India is the primary market and WhatsApp is where listings are actually
     * forwarded agent-to-buyer, so it gets first-class placement rather than
     * being folded into "Other".
     */
    platform: 'WhatsApp',
    formats: [
      { id: 'whatsapp-status', name: 'Status',        width: 1080, height: 1920, orientation: 'portrait' },
      { id: 'whatsapp-post',   name: 'Business Post', width: 1080, height: 1080, orientation: 'square'   },
    ],
  },
  {
    platform: 'Printables',
    formats: [
      { id: 'print-flyer',           name: 'Flyer',           width: 1600, height: 1200, orientation: 'landscape' },
      { id: 'print-feature-sheet',   name: 'Feature Sheet',   width: 1240, height: 1754, orientation: 'portrait'  },
      { id: 'print-postcard',        name: 'Postcard',        width: 1800, height: 1200, orientation: 'landscape' },
      { id: 'print-open-house-sign', name: 'Open House Sign', width: 1200, height: 1800, orientation: 'portrait'  },
      { id: 'print-yard-sign',       name: 'Yard Sign',       width: 1800, height: 1350, orientation: 'landscape' },
      { id: 'print-door-hanger',     name: 'Door Hanger',     width: 1275, height: 3300, orientation: 'portrait'  },
      { id: 'print-business-card',   name: 'Business Card',   width: 1050, height:  600, orientation: 'landscape' },
    ],
  },
  {
    platform: 'Email',
    formats: [
      { id: 'email-header-banner', name: 'Header Banner', width: 1200, height: 400, orientation: 'landscape' },
    ],
  },
  {
    platform: 'Other',
    formats: [
      { id: 'linkedin-post', name: 'LinkedIn Post', width: 1200, height: 1200, orientation: 'square' },
    ],
  },
];

/** Flat lookup by format id. Returns undefined for unknown ids and for CUSTOM_FORMAT_ID. */
export function getFormatById(id: string): PlatformFormat | undefined {
  for (const group of FORMAT_TAXONOMY) {
    const fmt = group.formats.find((f) => f.id === id);
    if (fmt) return fmt;
  }
  return undefined;
}
