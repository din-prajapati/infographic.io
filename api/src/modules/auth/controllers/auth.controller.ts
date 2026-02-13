import { Controller, Post, Body, HttpCode, HttpStatus, Inject, Get, UseGuards, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../services/auth.service';
import { RegisterDto, LoginDto } from '../dto/auth.dto';
import { Request, Response } from 'express';

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
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const googleUser = req.user as { googleId: string; email: string; name: string; avatarUrl?: string };
    const result = await this.authService.googleLogin(googleUser);

    const frontendUrl = process.env.NODE_ENV === 'production'
      ? `https://${process.env.REPLIT_DOMAINS || 'localhost:5000'}`
      : `https://${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}`;

    res.redirect(`${frontendUrl}/auth/callback?code=${result.code}`);
  }

  @Post('google/exchange')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange OAuth one-time code for token' })
  async exchangeOAuthCode(@Body() body: { code: string }) {
    return this.authService.exchangeOAuthCode(body.code);
  }
}
