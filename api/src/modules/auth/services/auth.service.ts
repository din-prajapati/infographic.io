import { Injectable, UnauthorizedException, ConflictException, Inject, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { prisma } from '../../../database/prisma.client';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto } from '../dto/auth.dto';
import { PLAN_USER_LIMITS } from '../../users/users.service';
import { EmailService } from '../../email/email.service';
import { googleSigninNoticeTemplate } from '../../email/templates/google-signin-notice.template';
import { passwordResetTemplate } from '../../email/templates/password-reset.template';
import { isDisposableEmail, isInternalTestEmail, normalizeEmail } from '../utils/email-policy';

/** Identical response for every forgot-password request — prevents user enumeration (AC1). */
const GENERIC_FORGOT_MESSAGE =
  'If an account exists for that email, a password reset link has been sent.';

/** US-LAUNCH-014 AC5 — verification links live for 24h. */
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** US-LAUNCH-014 AC6 — same message for unknown, expired and already-used tokens. */
const INVALID_VERIFICATION_MESSAGE =
  'This verification link is invalid or has expired. Please sign in and request a new one.';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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

  /**
   * US-LAUNCH-014 AC5 — mint a 24h verification token and email the raw-token link.
   * Only the sha256 hash is persisted; the raw token exists solely inside the link.
   * Callers decide whether a failure here is fatal (it is not, for register()).
   */
  private async sendVerificationEmail(user: { id: string; email: string }): Promise<void> {
    const rawToken = crypto.randomBytes(32).toString('hex');

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(rawToken),
        expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
      },
    });

    const link = `${this.frontendUrl()}/auth/verify-email?token=${rawToken}`;

    await this.emailService.send({
      to: user.email,
      subject: 'Verify your email address',
      text:
        `Welcome to Buildographic.\n\n` +
        `Confirm this is your address so you can start generating designs:\n${link}\n\n` +
        `This link expires in 24 hours. If you did not create an account, you can ignore this email.`,
      html:
        `<p>Welcome to Buildographic.</p>` +
        `<p>Confirm this is your address so you can start generating designs:</p>` +
        `<p><a href="${link}">Verify my email address</a></p>` +
        `<p>This link expires in 24 hours. If you did not create an account, you can ignore this email.</p>`,
    });
  }

  async register(registerDto: RegisterDto) {
    // AC14/AC15 — internal test accounts (opt-in per environment, unset in production).
    // Changes exactly three things below: the disposable check is skipped, the user is
    // created pre-verified, and no verification token/email is produced. It grants no
    // authentication, no credits and no exemption from the guard, the plan limit or the
    // global throttle. Logged at warn so any use in a real environment is visible.
    const isInternalTest = isInternalTestEmail(registerDto.email);
    if (isInternalTest) {
      this.logger.warn(
        `Internal-test bypass applied for ${registerDto.email}: domain matches ` +
          `INTERNAL_TEST_EMAIL_DOMAINS, so the disposable check is skipped and the ` +
          `account is created pre-verified with no verification email. ` +
          `This variable must NOT be set in production.`,
      );
    }

    // AC2 — refuse throwaway inboxes BEFORE any write, so a blocked sign-up leaves
    // no Organization, User or token behind.
    if (!isInternalTest && isDisposableEmail(registerDto.email)) {
      throw new BadRequestException({
        code: 'DISPOSABLE_EMAIL_NOT_ALLOWED',
        message: "Please use a permanent email address — temporary inboxes aren't supported.",
      });
    }

    // AC4 — one account per real inbox: the address as typed OR its alias-normalized form.
    const emailNormalized = normalizeEmail(registerDto.email);
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: registerDto.email }, { emailNormalized }],
      },
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
        // AC4 — `email` is always the address as typed; `emailNormalized` is the
        // duplicate-detection key only and is never used to log in or to send to.
        email: registerDto.email,
        emailNormalized,
        password: hashedPassword,
        name: registerDto.name,
        organizationId,
        // AC5 — the only place that writes `false`. The schema default is `true`
        // so every pre-existing account stays grandfathered.
        // AC15 — an allowlisted internal test address is created already verified,
        // because automated suites cannot open a link in an inbox.
        emailVerified: isInternalTest,
        emailVerifiedAt: isInternalTest ? new Date() : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        organizationId: true,
        emailVerified: true,
      },
    });

    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    // AC5 — a failure to mint or deliver the verification email must not fail the
    // sign-up; the user can always ask for a new link from the banner (AC7).
    // AC15 — nothing to verify for an internal test account: no token, no send.
    if (!isInternalTest) {
      try {
        await this.sendVerificationEmail(user);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Verification email failed for userId=${user.id}: ${message}`);
      }
    }

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
        // AC5 — the client needs this to decide whether to show the verification banner.
        emailVerified: user.emailVerified,
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

    const googleEmailNormalized = normalizeEmail(googleUser.email);

    if (!user) {
      // AC4 — match the address as typed OR its normalized form, so signing in with
      // Google as johndoe@gmail.com LINKS to an existing local john.doe@gmail.com
      // account instead of creating a second user (and hitting the unique index).
      user = await prisma.user.findFirst({
        where: {
          OR: [{ email: googleUser.email }, { emailNormalized: googleEmailNormalized }],
        },
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
            emailNormalized: googleEmailNormalized,
            password: '',
            name: googleUser.name,
            googleId: googleUser.googleId,
            avatarUrl: googleUser.avatarUrl,
            provider: 'google',
            organizationId: organization.id,
            // Google has already proven the inbox — inherit the schema default (true)
            // rather than sending our own verification email.
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
        const { subject, text } = googleSigninNoticeTemplate();
        await this.emailService.send({ to: user.email, subject, text });
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
        const { subject, text, html } = passwordResetTemplate({ link });
        await this.emailService.send({ to: user.email, subject, text, html });
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

  /**
   * AC6 — Consume a verification token: must exist, be unused and be unexpired.
   * Unknown / expired / used all produce the same 400 and mutate nothing.
   */
  async verifyEmail(dto: VerifyEmailDto) {
    const record = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash: this.hashToken(dto.token) },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException(INVALID_VERIFICATION_MESSAGE);
    }

    const now = new Date();
    await prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true, emailVerifiedAt: now },
    });
    await prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: now },
    });

    return { verified: true, userId: record.userId };
  }

  /**
   * AC7 — Re-send the verification link for the *authenticated* user (the id comes from
   * the JWT, never from the request body). Already-verified is a no-op, not an error.
   */
  async resendVerification(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.emailVerified) {
      return { alreadyVerified: true };
    }

    // Invalidate any link already in flight, so only the newest one works.
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    // EmailService.send() resolves { sent: false } rather than throwing, so the
    // response is { sent: true } regardless of delivery outcome (AC7).
    await this.sendVerificationEmail(user);

    return { sent: true };
  }
}
