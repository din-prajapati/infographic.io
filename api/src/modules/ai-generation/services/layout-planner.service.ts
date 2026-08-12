/**
 * LayoutPlannerService — US-AI-044
 *
 * Analyses a listing photo via GPT-4o Vision and returns a PlannerIntent
 * (templateId + scrimSide + palette) that feeds directly into layoutDesign()
 * (US-AI-043).
 *
 * ══════════════════════════════════════════════════════════════════════════
 * Failure contract (AC3, AC4, AC8)
 * ══════════════════════════════════════════════════════════════════════════
 * planLayout() NEVER throws. On any failure it logs and returns DEFAULT_INTENT:
 *   - OPENAI_API_KEY missing → immediate DEFAULT_INTENT (AC8)
 *   - photoUrl blank          → immediate DEFAULT_INTENT
 *   - OpenAI network/quota    → caught, logged, DEFAULT_INTENT (AC4)
 *   - Malformed JSON          → caught, logged, DEFAULT_INTENT (AC3)
 *   - Invalid templateId      → rejected, logged, DEFAULT_INTENT (AC5)
 *   - Invalid palette colour  → rejected, logged, DEFAULT_INTENT (AC6)
 *
 * The agent always gets a design — the AI-personalised one when planning
 * succeeds, or the generic default when it does not.
 */

import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import {
  DEFAULT_INTENT,
  isValidPlannerIntent,
  type PlannerIntent,
} from '../types/planner-intent.types';

// ---------------------------------------------------------------------------
// Prompt sent to GPT-4o Vision
// ---------------------------------------------------------------------------

const PLANNER_PROMPT = `You are a layout planner for real estate listing infographics.

Analyse the attached listing photo and select the best layout from the options below.

TEMPLATES (pick exactly one):
• left-scrim-hero  — vertical scrim covers the left 38 % of the image. Best when sky or an
  uncluttered wall occupies one side and the main subject (building, room) is on the other.
• bottom-band      — solid band occupies the lower 35 % full-width. Best for exterior shots
  where the sky or empty space is in the upper portion.
• corner-card      — small card panel anchors the lower-left corner. Best when the property
  fills most of the frame and minimal text obstruction is preferred.

SCRIM SIDES: left | right | bottom | none  (only 'left' and 'right' are used by left-scrim-hero;
the other templates ignore this field but you must still supply a valid value.)

PALETTE: choose colours that contrast well with the photo.
  scrim  — semi-transparent overlay: rgba(r,g,b,0.55) to rgba(r,g,b,0.70) or a #RRGGBB hex.
  accent — highlight colour for price text: a vibrant 6-digit hex that stands out on the scrim.
  text   — primary text colour on the scrim: usually #FFFFFF or near-white.
  muted  — secondary text colour: a lighter grey such as #CCCCCC or #E0E0E0.

Return ONLY valid JSON — no prose, no markdown fences, no trailing text:
{
  "templateId": "left-scrim-hero",
  "scrimSide": "left",
  "palette": {
    "scrim":  "rgba(0,0,0,0.60)",
    "accent": "#F5A623",
    "text":   "#FFFFFF",
    "muted":  "#CCCCCC"
  },
  "reasoning": "one short sentence explaining the template choice"
}`;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class LayoutPlannerService {
  private readonly openai: OpenAI | null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn(
        '[LayoutPlannerService] OPENAI_API_KEY not set — planLayout() will always return DEFAULT_INTENT.',
      );
      this.openai = null;
    } else {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * 💰 AI CALL — analyses a listing photo and returns a PlannerIntent.
   *
   * Always returns a valid PlannerIntent — never throws. — AC3, AC4
   *
   * @param photoUrl  Publicly reachable URL of the listing photo.
   * @returns         Validated PlannerIntent, or DEFAULT_INTENT on any failure.
   */
  async planLayout(photoUrl: string): Promise<PlannerIntent> {
    // AC8: return immediately when no API key is configured.
    if (!this.openai) {
      return DEFAULT_INTENT;
    }

    // Defensive: blank URL produces an unusable Vision call.
    if (!photoUrl || photoUrl.trim() === '') {
      console.warn('[LayoutPlannerService] planLayout called with empty photoUrl — returning DEFAULT_INTENT.');
      return DEFAULT_INTENT;
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        max_completion_tokens: 300,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                // detail:'low' keeps cost to ~$0.001/call while preserving composition legibility.
                image_url: { url: photoUrl, detail: 'low' },
              },
              {
                type: 'text',
                text: PLANNER_PROMPT,
              },
            ],
          },
        ],
      });

      const raw = response.choices[0]?.message?.content ?? '';

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        console.warn(
          `[LayoutPlannerService] GPT-4o returned non-JSON — returning DEFAULT_INTENT. Raw: ${raw.slice(0, 120)}`,
        );
        return DEFAULT_INTENT;
      }

      if (!isValidPlannerIntent(parsed)) {
        console.warn(
          '[LayoutPlannerService] GPT-4o response failed validation — returning DEFAULT_INTENT.',
          JSON.stringify(parsed).slice(0, 200),
        );
        return DEFAULT_INTENT;
      }

      return parsed;
    } catch (err) {
      // AC4: network error, timeout, quota exceeded, etc.
      console.error('[LayoutPlannerService] OpenAI call failed — returning DEFAULT_INTENT.', err);
      return DEFAULT_INTENT;
    }
  }
}
