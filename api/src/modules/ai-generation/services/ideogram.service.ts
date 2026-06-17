import { Injectable, HttpException } from '@nestjs/common';
import axios from 'axios';
import { getModelCost } from '../../../config/ai-models.config';
import {
  normalizeImageModel,
  orientationToIdeogramAspect,
} from '../../../config/image-generation.config';

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
  ): Promise<string> {
    try {
      const resolvedModel = normalizeImageModel(model);
      const modelMap: Record<string, string> = {
        'ideogram-turbo': 'V_2_TURBO',
        'ideogram-2': 'V_2',
      };

      const response = await axios.post(
        `${this.baseUrl}/generate`,
        {
          image_request: {
            model: modelMap[resolvedModel] || 'V_2_TURBO',
            prompt: prompt,
            aspect_ratio: orientationToIdeogramAspect(orientation),
            magic_prompt_option: 'AUTO',
          },
        },
        {
          headers: {
            'Api-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data?.data?.[0]?.url) {
        return response.data.data[0].url;
      }

      throw new Error('No image URL in response');
    } catch (error: any) {
      console.error('Ideogram API error:', error.response?.data || error.message);
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
