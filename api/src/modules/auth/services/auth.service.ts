import { Injectable, UnauthorizedException, ConflictException, Inject, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { prisma } from '../../../database/prisma.client';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from '../dto/auth.dto';
import { PLAN_USER_LIMITS } from '../../users/users.service';
import { EmailService } from '../../email/email.service';

/** Identical response for every forgot-password request — prevents user enumeration (AC1). */
const GENERIC_FORGOT_MESSAGE =
  'If an account exists for that email, a password reset link has been sent.';

@Injectable()
export class AuthService {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(EmailService) private readonly emailService: EmailService,
  ) {}

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  private frontendUrl(): string {
    return (process.env.CLIENT_URL || process.env.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
  }

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
    // Option 2: Create new organization (always, even if name is omitted)
    else {
      const orgName = registerDto.organizationName?.trim()
        || `${registerDto.name?.trim() || registerDto.email.split('@')[0]}'s Organization`;
      const organization = await prisma.organization.create({
        data: {
          name: orgName,
          planTier: 'free',
          monthlyLimit: 3,
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

  /**
   * AC1/AC2/AC5 — Always returns the same generic message (no enumeration).
   * Local-password account → create a hashed, 1h token and email the raw-token link.
   * Google-only account    → email explaining they sign in with Google (no token).
   * Unknown email          → do nothing, same response.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });

    if (user) {
      const isOAuthOnly = user.provider !== 'local' || !user.password;

      if (isOAuthOnly) {
        // AC5 — no local password to reset
        await this.emailService.send({
          to: user.email,
          subject: 'Signing in to Buildographic',
          text:
            `You requested a password reset, but this account signs in with Google — ` +
            `there is no password to reset. Just use "Continue with Google" on the login page.`,
        });
      } else {
        // AC1 — throttle: drop any prior unused tokens for this user
        await prisma.passwordResetToken.deleteMany({
          where: { userId: user.id, usedAt: null },
        });

        const rawToken = crypto.randomBytes(32).toString('hex');
        await prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: this.hashToken(rawToken), // AC2 — only the hash is stored
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // +1h
          },
        });

        // AC2 — the raw token travels only in the email link, never persisted
        const link = `${this.frontendUrl()}/auth/reset?token=${rawToken}`;
        await this.emailService.send({
          to: user.email,
          subject: 'Reset your Buildographic password',
          text:
            `Reset your password using this link (valid for 1 hour):\n${link}\n\n` +
            `If you didn't request this, you can safely ignore this email.`,
          html:
            `<p>Reset your password using the link below (valid for 1 hour):</p>` +
            `<p><a href="${link}">Reset my password</a></p>` +
            `<p>If you didn't request this, you can safely ignore this email.</p>`,
        });
      }
    }

    // AC1 — same response for existing / OAuth-only / unknown
    return { message: GENERIC_FORGOT_MESSAGE };
  }

  /**
   * AC3 — Validate token (exists, unexpired, unused), update the bcrypt hash,
   * mark the token used. Expired/used/unknown all return the same safe 400.
   */
  async resetPassword(dto: ResetPasswordDto) {
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.hashToken(dto.token) },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException(
        'This reset link is invalid or has expired. Please request a new one.',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await prisma.user.update({
      where: { id: record.userId },
      data: { password: hashedPassword },
    });
    await prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    return { message: 'Your password has been updated. You can now log in.' };
  }
}
