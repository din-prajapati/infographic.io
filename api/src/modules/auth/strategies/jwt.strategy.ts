import { Injectable, UnauthorizedException, ServiceUnavailableException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { prisma } from '../../../database/prisma.client';

function isDbConnectionError(err: unknown): boolean {
  const msg = (err as Error)?.message ?? '';
  const code = (err as { code?: string })?.code;
  return code === 'P1001' || msg.includes("Can't reach database server");
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    });
  }

  async validate(payload: { sub: string }) {
    const findUser = () =>
      prisma.user.findUnique({
        where: { id: payload.sub },
        include: { organization: true },
      });

    try {
      const user = await findUser();
      if (!user) {
        throw new UnauthorizedException();
      }
      return user;
    } catch (error) {
      if (isDbConnectionError(error)) {
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const user = await findUser();
          if (!user) throw new UnauthorizedException();
          return user;
        } catch (retryErr) {
          throw new ServiceUnavailableException(
            'Database temporarily unavailable. Please try again in a moment.',
          );
        }
      }
      if (error instanceof UnauthorizedException) throw error;
      throw error;
    }
  }
}
