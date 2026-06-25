import { Injectable, HttpException } from '@nestjs/common';
import axios from 'axios';
import { getModelCost } from '../../../config/ai-models.config';
import {
  normalizeImageModel,
  orientationToIdeogramAspect,
} from '../../../config/image-generation.config';
import { logGen, elapsed } from '../../../common/utils/ai-gen-logger';

@Injectable()
export class IdeogramService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.ideogram.ai';

  constructor() {
    this.apiKey = process.env.IDEOGRAM_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ IDEOGRAM_API_KEY not configured. Image generation will fail with 401. Set IDEOGRAM_API_KEY environment variable to enable real generation.');
    }
  }

  async generateImage(
    prompt: string,
    model: string = 'ideogram-turbo',
    orientation?: string,
    generationId?: string,
  ): Promise<string> {
    const t0 = Date.now();
    const resolvedModel = normalizeImageModel(model);
    const aspectRatio = orientationToIdeogramAspect(orientation);
    const modelMap: Record<string, string> = {
      'ideogram-turbo':    'V_2_TURBO',
      'ideogram-2':        'V_2',
      'ideogram-3-turbo':  'V_3_TURBO',
      'ideogram-3':        'V_3',
      'ideogram-4-turbo':  'V_4_TURBO',
      'ideogram-4':        'V_4',
      'ideogram-4-quality':'V_4_QUALITY',
    };
    const apiModel = modelMap[resolvedModel] || 'V_2_TURBO';

    logGen({ generationId: generationId ?? 'unknown', event: 'image:api:start', imageModel: resolvedModel, aspectRatio });

    try {
      const response = await axios.post(
        `${this.baseUrl}/generate`,
        {
          image_request: {
            model: apiModel,
            prompt,
            aspect_ratio: aspectRatio,
            magic_prompt_option: 'AUTO',
          },
        },
        { headers: { 'Api-Key': this.apiKey, 'Content-Type': 'application/json' } },
      );

      if (response.data?.data?.[0]?.url) {
        logGen({ generationId: generationId ?? 'unknown', event: 'image:api:ok', imageModel: resolvedModel, durationMs: elapsed(t0) });
        return response.data.data[0].url;
      }

      throw new Error('No image URL in response');
    } catch (error: any) {
      logGen({
        generationId: generationId ?? 'unknown',
        event: 'image:api:error',
        imageModel: resolvedModel,
        durationMs: elapsed(t0),
        error: error.response?.data?.message || error.message,
        httpStatus: error.response?.status,
      }, 'error');
      throw new HttpException(
        error.response?.data?.message || 'Failed to generate image',
        error.response?.status || 500,
      );
    }
  }

  getCostPerImage(model: string): number {
    return getModelCost(normalizeImageModel(model));
  }
}
