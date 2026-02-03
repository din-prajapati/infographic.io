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
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-key.strategy.ts:12',message:'ApiKeyStrategy.validate called',data:{hasHeaders:!!req.headers,headerKeys:Object.keys(req.headers || {}),url:req.url,method:req.method},timestamp:Date.now(),sessionId:'debug-session',runId:'debug1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const apiKey = req.headers['x-api-key'] as string;
    const apiKeyCapital = req.headers['X-API-Key'] as string;
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-key.strategy.ts:15',message:'API key extraction',data:{hasApiKeyLower:!!apiKey,hasApiKeyCapital:!!apiKeyCapital,apiKeyLowerLength:apiKey?.length,apiKeyCapitalLength:apiKeyCapital?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'debug1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    const finalApiKey = apiKey || apiKeyCapital;
    if (!finalApiKey) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-key.strategy.ts:18',message:'No API key found - returning false',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'debug1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return false;
    }

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-key.strategy.ts:21',message:'Calling validateApiKey',data:{apiKeyLength:finalApiKey.length,apiKeyPrefix:finalApiKey.substring(0,8)+'...'},timestamp:Date.now(),sessionId:'debug-session',runId:'debug1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    try {
      const result = await this.authService.validateApiKey(finalApiKey);
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-key.strategy.ts:24',message:'validateApiKey success',data:{hasResult:!!result,resultType:typeof result},timestamp:Date.now(),sessionId:'debug-session',runId:'debug1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return result;
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-key.strategy.ts:27',message:'validateApiKey error',data:{errorMessage:error?.message,errorName:error?.constructor?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'debug1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      throw error;
    }
  }
}
