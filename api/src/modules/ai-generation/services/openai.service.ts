import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

// City/state only — full street addresses with house numbers garble in image models
function extractCityRegion(address: string): string {
  if (!address) return '';
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 3) {
    const city = parts[parts.length - 2];
    const stateZip = parts[parts.length - 1].replace(/\s*\d{5}(-\d{4})?\s*$/, '').trim();
    return `${city}, ${stateZip}`;
  }
  return parts.length === 2 ? address : parts.slice(-2).join(', ');
}

// Abbreviated price — "$500K" renders more reliably than "$500,000" in image models
function formatPriceShort(price?: number | string): string {
  if (!price) return '';
  const num = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : price;
  if (!num || isNaN(num)) return '';
  if (num >= 1_000_000) return `$${(num % 1_000_000 === 0 ? num / 1_000_000 : (num / 1_000_000).toFixed(1))}M`;
  if (num >= 1_000) return `$${Math.round(num / 1_000)}K`;
  return `$${num.toLocaleString()}`;
}

// Formatted sqft with comma separator
function formatSqft(sqft?: number | string): string {
  if (!sqft) return '';
  const num = typeof sqft === 'string' ? parseInt(sqft.replace(/[^0-9]/g, '')) : sqft;
  if (!num || isNaN(num)) return '';
  return `${num.toLocaleString()} SQ FT`;
}

function hexToColorName(hex: string): string {
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

/** Plan tiers that use Gemini 2.5 Flash for the LLM step. BROKERAGE uses GPT-4o. */
const GEMINI_TIERS = new Set(['free', 'solo', 'team']);

@Injectable()
export class OpenAiService {
  private openai: OpenAI | null;
  private gemini: GoogleGenerativeAI | null;

  constructor() {
    // OpenAI — used for BROKERAGE tier LLM step
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ OPENAI_API_KEY not configured. Running in demo mode. Set OPENAI_API_KEY environment variable to enable real generation.');
      this.openai = null;
    } else {
      this.openai = new OpenAI({ apiKey });
    }

    // Gemini — used for FREE, SOLO, and TEAM tier LLM step (lower cost)
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.warn('⚠️ GEMINI_API_KEY not configured. FREE/SOLO tier will fall back to GPT-4o. Set GEMINI_API_KEY to enable cost-efficient generation.');
      this.gemini = null;
    } else {
      this.gemini = new GoogleGenerativeAI(geminiApiKey);
    }
  }

  /**
   * Generate a short real estate headline for the property.
   *
   * Routes to Gemini 2.5 Flash for FREE/SOLO/TEAM tiers and GPT-4o for BROKERAGE.
   * Falls back to GPT-4o when Gemini is not configured, and to a static string when
   * neither model is available (demo mode).
   */
  async analyzeProperty(propertyData: any, planTier?: string): Promise<string> {
    const tier = (planTier || '').toLowerCase();
    const useGemini = GEMINI_TIERS.has(tier) && !!this.gemini;

    const prompt = `Create a short real estate listing headline. Max 30 characters. No address, no price, no numbers.

Property type: ${propertyData.propertyType}
Location: ${propertyData.address}
Beds: ${propertyData.beds}, Baths: ${propertyData.baths}
Sqft: ${propertyData.sqft}
Features: ${propertyData.features?.join(', ') || 'None'}

Return ONLY the headline text. Examples: "Stunning Hilltop Retreat", "Modern Urban Sanctuary", "Sun-Drenched Family Home". No quotes in your response.`;

    // FREE/SOLO/TEAM: route to Gemini 2.5 Flash
    if (useGemini) {
      const model = this.gemini!.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      return result.response.text().trim() || 'Beautiful Property';
    }

    // BROKERAGE (or Gemini fallback): use GPT-4o
    if (!this.openai) {
      // Demo mode — neither model configured
      return `Beautiful ${propertyData.beds}BR Property at ${propertyData.address}`;
    }

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_completion_tokens: 100,
    });

    return response.choices[0].message.content?.trim() || 'Beautiful Property';
  }

  async generateImagePrompt(propertyData: any, headline: string): Promise<string> {
    const rawColors: string[] = propertyData.agent?.brandColors || [];
    const colorDescription = rawColors.length > 0
      ? rawColors.map(hexToColorName).join(', ')
      : '';

    // Truncate headline — shorter strings render more reliably in image models
    const shortHeadline = headline.length > 32
      ? headline.slice(0, 32).trimEnd() + '…'
      : headline;

    // City/region only — street numbers and full addresses garble consistently
    const location = extractCityRegion(propertyData.address);

    // Abbreviated price — "$500K" is far more reliable than "$500,000"
    const priceTag = formatPriceShort(propertyData.price);

    // Pipe-separated stat line — this exact pattern appears millions of times in real estate ads,
    // making it the format image models render most accurately
    const statParts: string[] = [];
    if (propertyData.beds) statParts.push(`${propertyData.beds} BED`);
    if (propertyData.baths) statParts.push(`${propertyData.baths} BATH`);
    if (propertyData.sqft) statParts.push(formatSqft(propertyData.sqft));
    const statsLine = statParts.join(' | ');

    const agentName = propertyData.agent?.name || '';
    const brokerage = propertyData.agent?.brokerage || '';
    const agentLine = [agentName, brokerage].filter(Boolean).join(', ');

    const lines = [`Professional real estate listing infographic:`];
    lines.push(`- Headline: "${shortHeadline}"`);
    if (propertyData.address) lines.push(`- Address: ${propertyData.address}`);
    if (priceTag) lines.push(`- Price: ${priceTag}`);
    if (statsLine) lines.push(`- Details: ${statsLine}`);
    if (agentLine) lines.push(`- Agent: ${agentLine}`);
    if (colorDescription) lines.push(`- Brand palette: ${colorDescription}`);
    lines.push(
      `- Style: modern luxury real estate marketing, editorial typography`,
      `- Layout: strong visual hierarchy, each text element in its own clearly defined zone`,
      `- Render every text element accurately and legibly`,
    );
    return lines.join('\n');
  }
}
