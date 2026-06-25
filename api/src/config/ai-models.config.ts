export interface AIModelPricing {
  name: string;
  costPerImage: number;
  description: string;
}

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
