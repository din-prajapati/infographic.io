/**
 * Model-opacity mapping (Critical Implementation Rule #5).
 *
 * Raw AI model identifiers (`ideogram-4`, `gpt-4o`, `gemini-2.5-flash`, …) must
 * NEVER appear in any user-visible label. Users only ever see friendly tier
 * names. This is the single source of truth for translating a stored
 * `aiModel` string into what a customer is allowed to read.
 *
 * Keep in sync conceptually with the backend model set in
 * `api/src/config/ai-models.config.ts` — but the friendly labels here are
 * deliberately generation *modes*, not model names.
 */

// Friendly, customer-facing tier labels keyed by normalized model id.
const MODEL_LABELS: Record<string, string> = {
  // Fast/turbo image tiers → Quick Generate
  'ideogram-turbo': 'Quick Generate',
  'ideogram-3-turbo': 'Quick Generate',
  'ideogram-4-turbo': 'Quick Generate',
  // Default/standard image tiers → Campaign Quality
  'ideogram-2': 'Campaign Quality',
  'ideogram-3': 'Campaign Quality',
  'ideogram-4': 'Campaign Quality',
  // Max-quality image tier → Print Quality
  'ideogram-4-quality': 'Print Quality',
  // Text/analysis step (prompt orchestration) → Prompt Generation
  'gpt-4o': 'Prompt Generation',
  'gemini-2.5-flash': 'Prompt Generation',
};

// Aliases that resolve to a canonical id before lookup.
const MODEL_ALIASES: Record<string, string> = {
  'ideogram-v2': 'ideogram-2',
  'ideogram-v3': 'ideogram-3',
  'ideogram-v3-turbo': 'ideogram-3-turbo',
  'ideogram-v4': 'ideogram-4',
  'ideogram-v4-turbo': 'ideogram-4-turbo',
  'ideogram-v4-quality': 'ideogram-4-quality',
  'nano-banana-pro': 'ideogram-4',
};

/**
 * Translate a raw stored `aiModel` id into a customer-facing tier label.
 * Falls back to a generic, never-leaking label for anything unrecognized so a
 * new model id can never surface as raw text.
 */
export function modelDisplayLabel(aiModel: string | null | undefined): string {
  if (!aiModel) return 'AI Generation';
  const key = aiModel.toLowerCase().trim();
  const canonical = MODEL_ALIASES[key] ?? key;
  return MODEL_LABELS[canonical] ?? 'AI Generation';
}
