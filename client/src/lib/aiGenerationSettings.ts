/** Infographic layout — matches API orientation field and canvas artboard presets. */
export type InfographicOrientation = 'landscape' | 'portrait' | 'square';

export type ImageQualityModel = 'ideogram-turbo' | 'ideogram-v2';

export const ORIENTATION_OPTIONS: Array<{
  id: InfographicOrientation;
  label: string;
  description: string;
}> = [
  { id: 'landscape', label: 'Landscape', description: '16:9 — listings, presentations' },
  { id: 'portrait', label: 'Portrait', description: '9:16 — stories, mobile feeds' },
  { id: 'square', label: 'Square', description: '1:1 — social posts' },
];

export const QUALITY_OPTIONS: Array<{
  id: ImageQualityModel;
  label: string;
  description: string;
}> = [
  { id: 'ideogram-turbo', label: 'Standard', description: 'Fast generation' },
  { id: 'ideogram-v2', label: 'Premium', description: 'Higher detail & clarity' },
];

export function previewAspectClass(orientation: InfographicOrientation): string {
  switch (orientation) {
    case 'portrait':
      return 'aspect-[9/16]';
    case 'square':
      return 'aspect-square';
    default:
      return 'aspect-video';
  }
}
