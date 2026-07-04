/**
 * Infographic Prompt Builder — pure functions, NO AI calls, NO cost.
 *
 * Single source of truth for the text that appears on every generated
 * infographic, regardless of which image model family renders it:
 *
 *   V2/V3  →  buildImagePrompt() output sent directly as the text prompt
 *   V4     →  buildImagePrompt() output sent to Ideogram magic-prompt-v4
 *             for structural conversion, then verified against
 *             buildExpectedTexts() before generation
 *
 * Experiment evidence (docs/testing/reports/ideogram-v4-experiment-2026-07-03):
 * hand-built sparse json_prompts cause V4 to invent filler panels with
 * garbled pseudo-text; the text-prompt → magic-prompt conversion produces
 * flawless output. Hence: we author text prompts, Ideogram authors JSON.
 */

const COLOR_NAMES: Record<string, string> = {
  '#1F1F1F': 'charcoal black', '#D4AF37': 'gold', '#FFFFFF': 'white', '#ffffff': 'white',
  '#F5F5F5': 'off-white', '#8B7355': 'warm brown', '#0F172A': 'midnight navy',
  '#3B82F6': 'bright blue', '#60A5FA': 'sky blue', '#DBEAFE': 'pale blue',
  '#14532D': 'forest green', '#16A34A': 'emerald green', '#86EFAC': 'light green',
  '#F0FDF4': 'mint white', '#1E293B': 'dark slate', '#334155': 'slate grey',
  '#94A3B8': 'cool grey', '#E2E8F0': 'light grey', '#7C2D12': 'deep burgundy',
  '#EA580C': 'burnt orange', '#FB923C': 'warm orange', '#FED7AA': 'peach',
  '#4C1D95': 'deep purple', '#7C3AED': 'violet', '#A78BFA': 'lavender',
  '#EDE9FE': 'pale lavender', '#1F448B': 'deep navy blue', '#000000': 'black',
};

/** Abbreviated price — "$500K" renders more reliably than "$500,000" in image models. */
export function formatPriceShort(price?: number | string): string {
  if (!price) return '';
  const num = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : price;
  if (!num || isNaN(num)) return '';
  if (num >= 1_000_000) return `$${(num % 1_000_000 === 0 ? num / 1_000_000 : (num / 1_000_000).toFixed(1))}M`;
  if (num >= 1_000) return `$${Math.round(num / 1_000)}K`;
  return `$${num.toLocaleString()}`;
}

/** Formatted sqft with comma separator. */
export function formatSqft(sqft?: number | string): string {
  if (!sqft) return '';
  const num = typeof sqft === 'string' ? parseInt(sqft.replace(/[^0-9]/g, '')) : sqft;
  if (!num || isNaN(num)) return '';
  return `${num.toLocaleString()} SQ FT`;
}

/** Map a hex color to a natural-language name image models understand. */
export function hexToColorName(hex: string): string {
  if (COLOR_NAMES[hex]) return COLOR_NAMES[hex];
  if (COLOR_NAMES[hex.toUpperCase()]) return COLOR_NAMES[hex.toUpperCase()];
  const c = hex.replace('#', '');
  if (c.length !== 6) return hex;
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) {
    if (l > 0.95) return 'white';
    if (l > 0.55) return 'grey';
    return 'black';
  }
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  if (s < 0.1) {
    if (l > 0.85) return 'light grey';
    if (l > 0.25) return 'dark grey';
    return 'black';
  }
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  if (h >= 345 || h < 16) return 'warm red';
  if (h < 46) return 'orange';
  if (h < 66) return 'yellow';
  if (h < 151) return 'green';
  if (h < 201) return 'teal';
  if (h < 261) return 'blue';
  if (h < 301) return 'purple';
  return 'pink';
}

/**
 * Extraction sometimes defaults the agent name to the literal string "Agent".
 * Rendering that placeholder onto the image is a bug — treat it as absent.
 */
function realAgentName(name?: string): string {
  const n = (name || '').trim();
  return n && n.toLowerCase() !== 'agent' ? n : '';
}

/** The exact strings that must appear on the finished infographic. */
export interface ExpectedText {
  /** Field identity, used in repair logs. */
  key: 'headline' | 'address' | 'price' | 'stats' | 'agentName' | 'brokerage';
  value: string;
}

/** Everything derived from property data that both prompt paths need. */
interface PromptParts {
  headline: string;
  address: string;
  price: string;
  stats: string;
  agentName: string;
  brokerage: string;
  colors: string;
}

function derivePromptParts(propertyData: any, headline: string): PromptParts {
  const rawColors: string[] = propertyData.agent?.brandColors || [];
  const statParts: string[] = [];
  if (propertyData.beds) statParts.push(`${propertyData.beds} BED`);
  if (propertyData.baths) statParts.push(`${propertyData.baths} BATH`);
  if (propertyData.sqft) statParts.push(formatSqft(propertyData.sqft));
  return {
    // Truncate — short headlines render more reliably in image models
    headline: headline.length > 32 ? headline.slice(0, 32).trimEnd() + '…' : headline,
    address: propertyData.address || '',
    price: formatPriceShort(propertyData.price),
    stats: statParts.join(' | '),
    agentName: realAgentName(propertyData.agent?.name),
    brokerage: (propertyData.agent?.brokerage || '').trim(),
    colors: rawColors.length > 0 ? rawColors.map(hexToColorName).join(', ') : '',
  };
}

/**
 * Build the canonical infographic text prompt.
 *
 * This exact format is production-proven: pasted into the Ideogram web UI it
 * produces clean, garble-free output on every model family. Do not restructure
 * it without re-running the experiment in docs/testing/reports/.
 */
export function buildImagePrompt(propertyData: any, headline: string): string {
  const p = derivePromptParts(propertyData, headline);
  const agentLine = [p.agentName, p.brokerage].filter(Boolean).join(', ');

  const lines = [`Professional real estate listing infographic:`];
  lines.push(`- Headline: "${p.headline}"`);
  if (p.address) lines.push(`- Address: ${p.address}`);
  if (p.price) lines.push(`- Price: ${p.price}`);
  if (p.stats) lines.push(`- Details: ${p.stats}`);
  if (agentLine) lines.push(`- Agent: ${agentLine}`);
  if (p.colors) lines.push(`- Color scheme: use ${p.colors} as the primary colors throughout the design`);
  lines.push(
    `- Style: modern luxury real estate marketing, photo-overlay layout, editorial typography`,
    `- Layout: property photo as full background, text elements overlaid with strong hierarchy`,
    `- Render every text element accurately and legibly`,
  );
  return lines.join('\n');
}

/** The exact strings the finished image must contain — used to verify V4 conversions. */
export function buildExpectedTexts(propertyData: any, headline: string): ExpectedText[] {
  const p = derivePromptParts(propertyData, headline);
  const expected: ExpectedText[] = [{ key: 'headline', value: p.headline }];
  if (p.address) expected.push({ key: 'address', value: p.address });
  if (p.price) expected.push({ key: 'price', value: p.price });
  if (p.stats) expected.push({ key: 'stats', value: p.stats });
  if (p.agentName) expected.push({ key: 'agentName', value: p.agentName });
  if (p.brokerage) expected.push({ key: 'brokerage', value: p.brokerage });
  return expected;
}

/** Case/whitespace/linebreak-insensitive comparison form. */
function normalize(s: string): string {
  return s.toUpperCase().replace(/[\n\s]+/g, ' ').replace(/\s*\|\s*/g, ' | ').trim();
}

/** Field-specific patterns used to locate a conversion element that *should* hold a value. */
const REPAIR_LOCATORS: Record<ExpectedText['key'], RegExp> = {
  price: /\$/,
  stats: /\b(BED|BATH|SQ ?FT)\b/i,
  address: /\d+\s+\S+/,
  headline: /.{12,}/, // longest free-text element is almost always the headline
  agentName: /^[A-Za-z .'-]+$/,
  brokerage: /^[A-Za-z0-9 .,'\/&-]+$/,
};

export interface V4RepairResult {
  jsonPrompt: Record<string, any>;
  /** Human-readable log of what was fixed; empty when the conversion was faithful. */
  repairs: string[];
}

/**
 * Verify a magic-prompt-v4 conversion kept our exact strings; repair only on mismatch.
 *
 * CONSERVATIVE by design — experiment E4 showed blanket text replacement
 * corrupts conversions that split fields (e.g. agent name and brokerage as
 * separate styled elements). The conversion is normally faithful (E3), so:
 *   1. If an expected value already appears across the text elements → untouched.
 *   2. Missing value + a locatable corrupted element → overwrite that element only.
 *   3. Missing value + no candidate → append a minimal text element.
 */
export function verifyAndRepairV4JsonPrompt(
  jsonPrompt: Record<string, any>,
  expected: ExpectedText[],
): V4RepairResult {
  const jp = JSON.parse(JSON.stringify(jsonPrompt));
  const elements: Record<string, any>[] = jp?.compositional_deconstruction?.elements ?? [];
  const textElements = elements.filter(e => e?.type === 'text' && typeof e.text === 'string');
  const repairs: string[] = [];

  // One combined haystack — values split across elements (or wrapped with \n) still match
  const haystack = normalize(textElements.map(e => e.text).join(' '));

  const touched = new Set<Record<string, any>>();
  for (const exp of expected) {
    if (haystack.includes(normalize(exp.value))) continue; // faithful — leave alone

    // Locate the element that was *meant* to carry this value and overwrite just it
    const candidate = textElements.find(
      e => !touched.has(e) && REPAIR_LOCATORS[exp.key].test(e.text),
    );
    if (candidate) {
      repairs.push(`${exp.key}: replaced "${candidate.text}" → "${exp.value}"`);
      candidate.text = exp.value;
      touched.add(candidate);
    } else {
      repairs.push(`${exp.key}: missing from conversion — appended "${exp.value}"`);
      elements.push({
        type: 'text',
        text: exp.value,
        desc: 'Small supporting text in the existing typographic style, placed in available space near related content',
      });
    }
  }

  return { jsonPrompt: jp, repairs };
}

/** Style preset applied to the text prompt (V2/V3 path and V4 pre-conversion). */
export function applyStylePreset(prompt: string, style?: string): string {
  if (!style) return prompt;
  const styleModifiers: Record<string, string> = {
    modern: 'Modern, minimalist design with clean lines and contemporary typography',
    classic: 'Classic, traditional design with elegant serif fonts and timeless aesthetics',
    luxury: 'Luxury, high-end design with premium materials and sophisticated color palette',
    minimal: 'Minimalist design with lots of white space and simple, clean elements',
    vibrant: 'Vibrant, colorful design with bold typography and energetic color scheme',
    professional: 'Professional, corporate design with formal typography and conservative colors',
  };
  const modifier = styleModifiers[style] || '';
  return modifier ? `${prompt}. Style: ${modifier}` : prompt;
}

/** Per-variation prompt suffix so V2/V3 variations differ visually. */
export function getVariationModifier(index: number): string {
  const modifiers = [
    'slightly different color scheme',
    'alternative layout arrangement',
    'different typography emphasis',
    'varied visual hierarchy',
    'alternative composition',
  ];
  return modifiers[index % modifiers.length];
}
