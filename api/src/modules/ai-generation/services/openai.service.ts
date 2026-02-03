import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

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

    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await this.openai.chat.completions.create({
      model: 'gpt-5',
      messages: [{ role: 'user', content: prompt }],
      max_completion_tokens: 100,
    });

    return response.choices[0].message.content?.trim() || 'Beautiful Property';
  }

  async generateImagePrompt(propertyData: any, headline: string): Promise<string> {
    const colors = propertyData.agent?.brandColors?.join(', ') || '#1F448B, #FFFFFF';
    const agentName = propertyData.agent?.name || 'Agent';
    const brokerage = propertyData.agent?.brokerage || '';
    
    return `Professional real estate infographic design:
- Main text: "${headline}"
- Property: ${propertyData.address}
- Price: $${propertyData.price.toLocaleString()} prominently displayed
- ${propertyData.beds} bed, ${propertyData.baths} bath, ${propertyData.sqft} sqft
- Agent: ${agentName}${brokerage ? ` - ${brokerage}` : ''}
- Brand colors: ${colors}
- Clean, modern, luxury aesthetic
- High contrast, readable typography
- Professional layout with clear hierarchy`;
  }
}
