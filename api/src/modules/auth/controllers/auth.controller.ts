import { Controller, Post, Body, HttpCode, HttpStatus, Inject, Get, UseGuards, Req, Res, Injectable } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../services/auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from '../dto/auth.dto';
import { Request, Response } from 'express';

/**
 * Extends the standard Google AuthGuard to return a user-readable error
 * when GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are absent or not yet
 * configured (GO-07 in the Phase-0 QA checklist).  Without this guard the
 * user would land on an opaque Google "invalid_client" error page.
 */
@Injectable()
class GoogleAuthGuard extends AuthGuard('google') {
  canActivate(context: ExecutionContext) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'not-configured') {
      const res = context.switchToHttp().getResponse<Response>();
      res.redirect('/auth?error=google_not_configured');
      return false;
    }
    return super.canActivate(context);
  }
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const googleUser = req.user as { googleId: string; email: string; name: string; avatarUrl?: string };
    const result = await this.authService.googleLogin(googleUser);

    // CLIENT_URL is the canonical frontend origin (set in all .env* files).
    // Falls back to BASE_URL (same origin, prod) then bare localhost for local dev.
    const frontendUrl = (process.env.CLIENT_URL || process.env.BASE_URL || 'http://localhost:5000')
      .replace(/\/$/, '');

    res.redirect(`${frontendUrl}/auth/callback?code=${result.code}`);
  }

  @Post('google/exchange')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange OAuth one-time code for token' })
  async exchangeOAuthCode(@Body() body: { code: string }) {
    return this.authService.exchangeOAuthCode(body.code);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset link' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using an emailed token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
