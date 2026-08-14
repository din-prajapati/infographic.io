import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * LLM text services — every method in this class makes a 💰 paid AI call.
 * Prompt-building helpers with no API cost live in infographic-prompt.builder.ts.
 */

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
   * 💰 AI CALL — generate a short real estate headline for the property.
   *
   * Routes to Gemini 2.5 Flash for FREE/SOLO/TEAM tiers and GPT-4o for BROKERAGE.
   * Falls back to GPT-4o when Gemini is not configured, and to a static string when
   * neither model is available (demo mode). Skipped entirely when the user typed
   * their own headline (see orchestrator STEP 1).
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
      console.log(`🤖 [LLM] Gemini 2.5 Flash selected for tier="${tier}" — calling Google AI`);
      const model = this.gemini!.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const headline = result.response.text().trim() || 'Beautiful Property';
      console.log(`✅ [LLM] Gemini 2.5 Flash headline: "${headline}"`);
      return headline;
    }

    // BROKERAGE (or Gemini fallback): use GPT-4o
    if (!this.openai) {
      // Demo mode — neither model configured
      console.log(`🎭 [LLM] Demo mode — no API keys configured, returning static headline`);
      return `Beautiful ${propertyData.beds}BR Property at ${propertyData.address}`;
    }

    console.log(`🤖 [LLM] GPT-4o selected for tier="${tier || 'brokerage/default'}" — calling OpenAI`);
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_completion_tokens: 100,
    });

    return response.choices[0].message.content?.trim() || 'Beautiful Property';
  }

  /**
   * 💰 AI CALL — general-purpose structured (JSON) extraction, tier-routed
   * identically to {@link analyzeProperty}: Gemini 2.5 Flash for FREE/SOLO/TEAM,
   * GPT-4o for BROKERAGE, GPT-4o as the fallback when Gemini is unconfigured.
   *
   * BL-06: extraction previously reached past this class entirely (a private
   * `openai` client field accessed via `as any` from prompt-extractor.service.ts)
   * and called `gpt-4o` unconditionally, regardless of tier. Extraction runs on
   * every generation, before the headline call — so an OpenAI outage or credit
   * exhaustion failed generation for every tier, including ones already routed
   * off OpenAI for the headline step. This method is the shared routing point
   * both calls now go through, so that inconsistency can't recur.
   *
   * Returns the raw JSON string from whichever provider handled it — callers
   * parse it themselves, same contract the direct OpenAI call had before.
   */
  async extractStructuredData(systemPrompt: string, userPrompt: string, planTier?: string): Promise<string> {
    const tier = (planTier || '').toLowerCase();
    const useGemini = GEMINI_TIERS.has(tier) && !!this.gemini;

    if (useGemini) {
      console.log(`🤖 [LLM] Gemini 2.5 Flash selected for tier="${tier}" — calling Google AI (extraction)`);
      const model = this.gemini!.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });
      const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
      return result.response.text();
    }

    if (!this.openai) {
      throw new Error('Neither OpenAI nor Gemini is configured — extraction cannot run.');
    }

    console.log(`🤖 [LLM] GPT-4o selected for tier="${tier || 'brokerage/default'}" — calling OpenAI (extraction)`);
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    return response.choices[0].message.content || '{}';
  }

}
