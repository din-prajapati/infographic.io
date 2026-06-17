import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

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

@Injectable()
export class OpenAiService {
  private openai: OpenAI;

  constructor() {
    // Using OPENAI_API_KEY from Replit Secrets
    // This ensures billing goes directly to your OpenAI account, not Replit credits
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ OPENAI_API_KEY not configured. Running in demo mode. Set OPENAI_API_KEY environment variable to enable real generation.');
      this.openai = null as any; // Will be checked before use
    } else {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    }
  }

  async analyzeProperty(propertyData: any): Promise<string> {
    if (!this.openai) {
      // Fallback for demo mode
      return `Beautiful ${propertyData.beds}BR Property at ${propertyData.address}`;
    }

    const prompt = `Analyze this real estate property and create a compelling headline (max 50 chars):
    
Property: ${propertyData.address}
Type: ${propertyData.propertyType}
Price: $${propertyData.price.toLocaleString()}
Beds: ${propertyData.beds}, Baths: ${propertyData.baths}
Sqft: ${propertyData.sqft}
Features: ${propertyData.features?.join(', ') || 'None'}

Create a headline that highlights the most appealing aspect. Be concise and engaging.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_completion_tokens: 100,
    });

    return response.choices[0].message.content?.trim() || 'Beautiful Property';
  }

  async generateImagePrompt(propertyData: any, headline: string): Promise<string> {
    const agentName = propertyData.agent?.name || 'Agent';
    const brokerage = propertyData.agent?.brokerage || '';

    const rawColors: string[] = propertyData.agent?.brandColors || [];
    const colorDescription = rawColors.length > 0
      ? rawColors.map(hexToColorName).join(', ')
      : '';

    const lines = [
      `Professional real estate infographic design:`,
      `- Main text: "${headline}"`,
      `- Property: ${propertyData.address}`,
      `- Price: $${propertyData.price?.toLocaleString()} prominently displayed`,
      `- ${propertyData.beds} bed, ${propertyData.baths} bath, ${propertyData.sqft} sqft`,
      `- Agent: ${agentName}${brokerage ? ` - ${brokerage}` : ''}`,
    ];
    if (colorDescription) lines.push(`- Brand colors: ${colorDescription}`);
    lines.push(
      `- Clean, modern, luxury aesthetic`,
      `- High contrast, readable typography`,
      `- Professional layout with clear hierarchy`,
    );
    return lines.join('\n');
  }
}
