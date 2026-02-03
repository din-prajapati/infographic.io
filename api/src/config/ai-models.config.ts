export interface AIModelPricing {
  name: string;
  costPerImage: number;
  description: string;
}

export const AI_MODELS: Record<string, AIModelPricing> = {
  'ideogram-turbo': {
    name: 'Ideogram Turbo',
    costPerImage: 0.025,
    description: 'Budget-friendly, fast generation',
  },
  'ideogram-2': {
    name: 'Ideogram V2',
    costPerImage: 0.080,
    description: 'Premium quality',
  },
};

export const OPENAI_COSTS = {
  gpt5PerRequest: 0.004,
};

export function getModelCost(modelName: string): number {
  const model = AI_MODELS[modelName];
  if (!model) {
    console.warn(`Unknown AI model: ${modelName}, falling back to ideogram-turbo pricing`);
    return AI_MODELS['ideogram-turbo'].costPerImage;
  }
  return model.costPerImage;
}

export function getTotalCost(modelName: string): number {
  return getModelCost(modelName) + OPENAI_COSTS.gpt5PerRequest;
}

export const SUPPORTED_AI_MODELS = Object.keys(AI_MODELS);
