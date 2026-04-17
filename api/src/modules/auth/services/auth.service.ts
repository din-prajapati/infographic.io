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
    const existingUser = await prisma.user.findUnique({
      where: { email: registerDto.email },
    });

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

    return {
      user,
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });

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
    try {
      const key = await prisma.apiKey.findUnique({
        where: { key: apiKey },
        include: { organization: true },
      });

      if (!key || !key.isActive) {
        throw new UnauthorizedException('Invalid API key');
      }

      await prisma.apiKey.update({
        where: { id: key.id },
        data: { lastUsedAt: new Date() },
      });

      return key.organization;
    } catch (error) {
      throw error;
    }
  }
}
