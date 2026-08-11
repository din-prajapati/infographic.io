export interface AIModelPricing {
  name: string;
  costPerImage: number;
  description: string;
}

export interface LLMModelConfig {
  name: string;
  costPerRequest: number;
  description: string;
}

/** LLM models used for property analysis and prompt generation (text step, not image). */
export const LLM_MODELS: Record<string, LLMModelConfig> = {
  'gpt-4o': {
    name: 'GPT-4o',
    costPerRequest: 0.0075,
    description: 'OpenAI GPT-4o — TEAM and BROKERAGE tiers',
  },
  'gemini-2.5-flash': {
    name: 'Gemini 2.5 Flash',
    costPerRequest: 0.0006,
    description: 'Google Gemini 2.5 Flash — FREE and SOLO tiers',
  },
};

export const AI_MODELS: Record<string, AIModelPricing> = {
  // V2 (current production default)
  'ideogram-turbo': {
    name: 'Ideogram 2.0 Turbo',
    costPerImage: 0.05,
    description: 'V2 Turbo — fast generation (V_2_TURBO)',
  },
  'ideogram-2': {
    name: 'Ideogram 2.0 Default',
    costPerImage: 0.08,
    description: 'V2 Default — standard quality (V_2)',
  },
  // V3
  'ideogram-3-turbo': {
    name: 'Ideogram 3.0 Turbo',
    costPerImage: 0.03,
    description: 'V3 Turbo — 40% cheaper than V2 Turbo (V_3_TURBO)',
  },
  'ideogram-3': {
    name: 'Ideogram 3.0 Default',
    costPerImage: 0.06,
    description: 'V3 Default — better quality at V2 Turbo price (V_3)',
  },
  // V4 (recommended default — cheapest + newest + best quality)
  'ideogram-4-turbo': {
    name: 'Ideogram 4.0 Turbo',
    costPerImage: 0.03,
    description: 'V4 Turbo — newest model, fastest, $0.03/image (V_4_TURBO)',
  },
  'ideogram-4': {
    name: 'Ideogram 4.0 Default',
    costPerImage: 0.06,
    description: 'V4 Default — highest quality at mid price (V_4)',
  },
  'ideogram-4-quality': {
    name: 'Ideogram 4.0 Quality',
    costPerImage: 0.10,
    description: 'V4 Quality — maximum quality, premium tier (V_4_QUALITY)',
  },
};

export const OPENAI_COSTS = {
  gpt4oPerRequest: 0.004,
};

/**
 * Ideogram magic-prompt-v4 conversion — one call per V4 generation
 * (shared across variations). FREE — verified empirically 2026-07-07:
 * 10 prompt-only calls produced zero credit-balance delta on the API
 * dashboard (resolution ≤$0.005/call); endpoint absent from
 * https://ideogram.ai/api-pricing/. Re-verify if Ideogram adds it there.
 */
export const V4_MAGIC_PROMPT_COST = 0;

/**
 * Ideogram Layerize Text — text geometry extraction for the edit path (US-AI-031b).
 * Source: https://ideogram.ai/api-pricing/ — "$0.09 per input".
 * Endpoint: POST /v1/ideogram-v3/layerize-text
 *
 * This endpoint is BETA: "works best with clear, straight text in standard typography.
 * Curved, highly stylized, decorative, or graphic-embedded text may not be detected."
 * US-AI-031 AC2 asks the composition step for clean typography to maximise the hit rate.
 *
 * ⚠️ Lazy-billing wrinkle (STORY.md §Metering, CLAUDE.md):
 * This cost attaches to an already-persisted UsageRecord from the generate step.
 * The record's creditsUsed stays at 1 (it was set at generate time and counts
 * generations, not edit actions). Only costUsd is incremented when extraction runs.
 * This happens inside AiOrchestrator.composeDesignForEdit() on the edit action.
 *
 * Per CLAUDE.md metering policy: costUsd is true provider spend and must never
 * be zeroed or averaged. If extraction fails, no increment is written (the provider
 * did nothing billable — the cost only applies when base_image_url is returned).
 *
 * Cost comparison (from SPIKE-031 §Cost — lazy extraction is required, not optional):
 *   Extract every variation at generate time:  3 × ($0.06 + $0.09) = $0.45/generation
 *   Extract only the variation the user edits:  $0.18 + $0.09 = $0.27 — pinned to this
 *   Only a fraction of generations are ever edited, so real spend is lower still.
 */
export const LAYERIZE_COST_PER_IMAGE = 0.09;

/**
 * Ideogram V4 Remix — source-image composition for photo-backed listing designs.
 * Source: https://ideogram.ai/api-pricing/ — "Remix is priced per output image,
 * same rates as Generate."
 *
 * Key finding from SPIKE-031 §5: the recommended Remix path is COST-NEUTRAL —
 * switching a photo-backed generation from V4 generate to V4 Remix moves
 * provider spend by $0.00. Photo-backed generation does not raise our COGS.
 *
 * Rejected alternative — Instructional Edit (POST /v1/edit, $0.20 flat):
 * At the default 3 variations/generation that is $0.60/generation, which
 * reaches 150% of TEAM plan monthly revenue for a single seat at cap.
 * Gross-margin negative on SOLO, TEAM and BROKERAGE at any variation count.
 * Source: SPIKE-031 §5, https://ideogram.ai/api-pricing/.
 *
 * Per CLAUDE.md metering policy: creditsUsed stays 1 per generation regardless
 * of path; costUsd records true provider spend and must never be zeroed.
 */
export const REMIX_COST_PER_IMAGE = AI_MODELS['ideogram-4'].costPerImage; // $0.06 at default tier — same as generate

export function getModelCost(modelName: string): number {
  const normalized =
    modelName === 'ideogram-v2' ? 'ideogram-2' : modelName;
  const model = AI_MODELS[normalized];
  if (!model) {
    console.warn(`Unknown AI model: ${modelName}, falling back to ideogram-turbo pricing`);
    return AI_MODELS['ideogram-turbo'].costPerImage;
  }
  return model.costPerImage;
}

export function getTotalCost(modelName: string, variations: number = 1): number {
  return getModelCost(modelName) * variations + OPENAI_COSTS.gpt4oPerRequest;
}

export const SUPPORTED_AI_MODELS = Object.keys(AI_MODELS);
