import { Injectable, UnauthorizedException, ConflictException, Inject, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { prisma } from '../../../database/prisma.client';
import { RegisterDto, LoginDto } from '../dto/auth.dto';
import { PLAN_USER_LIMITS } from '../../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}

  private getUserLimit(planTier: string): number {
    const config = PLAN_USER_LIMITS[planTier.toLowerCase()];
    return config?.userLimit ?? 1;
  }

  private async canAddUserToOrganization(organizationId: string): Promise<boolean> {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!organization) return false;

    const userLimit = this.getUserLimit(organization.planTier);
    if (userLimit === -1) return true; // unlimited

    const currentCount = await prisma.user.count({
      where: { organizationId },
    });
    return currentCount < userLimit;
  }

  async register(registerDto: RegisterDto) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.service.ts:13',message:'Register service called',data:{email:registerDto?.email,hasPassword:!!registerDto?.password},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const existingUser = await prisma.user.findUnique({
      where: { email: registerDto.email },
    });
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.service.ts:17',message:'User lookup completed',data:{existingUserFound:!!existingUser},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    let organizationId: string | null = null;

    // Option 1: Join existing organization (invite flow) - CHECK USER LIMITS
    if (registerDto.organizationId) {
      const canJoin = await this.canAddUserToOrganization(registerDto.organizationId);
      if (!canJoin) {
        const org = await prisma.organization.findUnique({
          where: { id: registerDto.organizationId },
        });
        const limit = this.getUserLimit(org?.planTier || 'free');
        throw new BadRequestException(
          `User limit of ${limit} reached for ${org?.planTier || 'free'} plan. The organization needs to upgrade to add more users.`
        );
      }
      organizationId = registerDto.organizationId;
    }
    // Option 2: Create new organization
    else if (registerDto.organizationName) {
      const organization = await prisma.organization.create({
        data: {
          name: registerDto.organizationName,
          planTier: 'free', // Free tier activation
          monthlyLimit: 3, // Free tier limit
        },
      });
      organizationId = organization.id;
    }

    const user = await prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        name: registerDto.name,
        organizationId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        organizationId: true,
      },
    });

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.service.ts:50',message:'Register service success',data:{hasUser:!!user,hasToken:!!token,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    return {
      user,
      token,
    };
  }

  async login(loginDto: LoginDto) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.service.ts:58',message:'Login service called',data:{email:loginDto?.email,hasPassword:!!loginDto?.password},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const user = await prisma.user.findUnique({
      where: { email: loginDto.email },
    });
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.service.ts:62',message:'User lookup completed',data:{userFound:!!user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.service.ts:67',message:'Password validation completed',data:{isPasswordValid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.service.ts:91',message:'JWT token created',data:{userId:user.id,userEmail:user.email,tokenLength:token?.length,tokenPrefix:token?.substring(0,20)+'...'},timestamp:Date.now(),sessionId:'debug-session',runId:'debug2',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.service.ts:73',message:'Login service success',data:{hasUser:true,hasToken:!!token,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organizationId: user.organizationId,
      },
      token,
    };
  }

  private oauthCodes = new Map<string, { token: string; user: any; expiresAt: number }>();

  async googleLogin(googleUser: { googleId: string; email: string; name: string; avatarUrl?: string }) {
    if (!googleUser.email) {
      throw new BadRequestException('Google account must have a verified email address');
    }

    let user = await prisma.user.findUnique({
      where: { googleId: googleUser.googleId },
    });

    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.googleId,
            avatarUrl: googleUser.avatarUrl || user.avatarUrl,
            provider: 'google',
          },
        });
      } else {
        const organization = await prisma.organization.create({
          data: {
            name: `${googleUser.name}'s Organization`,
            planTier: 'free',
            monthlyLimit: 3,
          },
        });

        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            password: '',
            name: googleUser.name,
            googleId: googleUser.googleId,
            avatarUrl: googleUser.avatarUrl,
            provider: 'google',
            organizationId: organization.id,
          },
        });
      }
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
    };

    const code = require('crypto').randomBytes(32).toString('hex');
    this.oauthCodes.set(code, {
      token,
      user: userData,
      expiresAt: Date.now() + 60000,
    });

    setTimeout(() => this.oauthCodes.delete(code), 60000);

    return { code };
  }

  exchangeOAuthCode(code: string) {
    const data = this.oauthCodes.get(code);
    if (!data || data.expiresAt < Date.now()) {
      this.oauthCodes.delete(code);
      throw new UnauthorizedException('Invalid or expired OAuth code');
    }
    this.oauthCodes.delete(code);
    return { user: data.user, token: data.token };
  }

  async validateApiKey(apiKey: string) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.service.ts:107',message:'validateApiKey called',data:{apiKeyLength:apiKey?.length,apiKeyPrefix:apiKey?.substring(0,8)+'...'},timestamp:Date.now(),sessionId:'debug-session',runId:'debug1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    try {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.service.ts:110',message:'Executing prisma.apiKey.findUnique',data:{queryType:'findUnique'},timestamp:Date.now(),sessionId:'debug-session',runId:'debug1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      const key = await prisma.apiKey.findUnique({
        where: { key: apiKey },
        include: { organization: true },
      });

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.service.ts:116',message:'prisma.apiKey.findUnique result',data:{hasKey:!!key,isActive:key?.isActive,hasOrganization:!!key?.organization},timestamp:Date.now(),sessionId:'debug-session',runId:'debug1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      if (!key || !key.isActive) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.service.ts:119',message:'Invalid API key - throwing UnauthorizedException',data:{hasKey:!!key,isActive:key?.isActive},timestamp:Date.now(),sessionId:'debug-session',runId:'debug1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        throw new UnauthorizedException('Invalid API key');
      }

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.service.ts:122',message:'Updating lastUsedAt',data:{keyId:key.id},timestamp:Date.now(),sessionId:'debug-session',runId:'debug1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      await prisma.apiKey.update({
        where: { id: key.id },
        data: { lastUsedAt: new Date() },
      });

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.service.ts:127',message:'validateApiKey success - returning organization',data:{organizationId:key.organization?.id,organizationName:key.organization?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'debug1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      return key.organization;
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.service.ts:130',message:'validateApiKey database error',data:{errorMessage:error?.message,errorName:error?.constructor?.name,errorCode:error?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'debug1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      throw error;
    }
  }
}
