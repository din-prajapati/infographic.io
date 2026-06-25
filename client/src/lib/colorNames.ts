const COLOR_MAP: Record<string, string> = {
  '#1F1F1F': 'charcoal black',
  '#D4AF37': 'gold',
  '#FFFFFF': 'white',
  '#ffffff': 'white',
  '#F5F5F5': 'off-white',
  '#8B7355': 'warm brown',
  '#0F172A': 'midnight navy',
  '#3B82F6': 'bright blue',
  '#60A5FA': 'sky blue',
  '#DBEAFE': 'pale blue',
  '#14532D': 'forest green',
  '#16A34A': 'emerald green',
  '#86EFAC': 'light green',
  '#F0FDF4': 'mint white',
  '#1E293B': 'dark slate',
  '#334155': 'slate grey',
  '#94A3B8': 'cool grey',
  '#E2E8F0': 'light grey',
  '#7C2D12': 'deep burgundy',
  '#EA580C': 'burnt orange',
  '#FB923C': 'warm orange',
  '#FED7AA': 'peach',
  '#4C1D95': 'deep purple',
  '#7C3AED': 'violet',
  '#A78BFA': 'lavender',
  '#EDE9FE': 'pale lavender',
  '#1F448B': 'deep navy blue',
  '#000000': 'black',
  '#000': 'black',
  '#FFF': 'white',
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }
  return null;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function hueBasedName(h: number, s: number, l: number): string {
  if (s < 0.1) {
    if (l > 0.95) return 'white';
    if (l > 0.85) return 'light grey';
    if (l > 0.55) return 'grey';
    if (l > 0.25) return 'dark grey';
    return 'black';
  }
  if (h >= 345 || h < 16) return 'warm red';
  if (h < 46) return 'orange';
  if (h < 66) return 'yellow';
  if (h < 151) return 'green';
  if (h < 201) return 'teal';
  if (h < 261) return 'blue';
  if (h < 301) return 'purple';
  return 'pink';
}

export function hexToColorName(hex: string): string {
  const upper = hex.toUpperCase();
  if (COLOR_MAP[hex]) return COLOR_MAP[hex];
  if (COLOR_MAP[upper]) return COLOR_MAP[upper];
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return hueBasedName(h, s, l);
}

export function brandColorsToDescription(colors: string[]): string {
  if (colors.length === 0) return '';
  const names = colors.map(hexToColorName);
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}
