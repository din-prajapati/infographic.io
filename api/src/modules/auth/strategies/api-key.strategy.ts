import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(req: Request): Promise<any> {
    const apiKey = req.headers['x-api-key'] as string;
    const apiKeyCapital = req.headers['X-API-Key'] as string;

    const finalApiKey = apiKey || apiKeyCapital;
    if (!finalApiKey) {
      return false;
    }

    try {
      const result = await this.authService.validateApiKey(finalApiKey);
      return result;
    } catch (error) {
      throw error;
    }
  }
}
