import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { prisma } from '../../database/prisma.client';

/**
 * US-LAUNCH-014 AC8 — blocks AI-spend routes until the address is verified.
 *
 * Must be listed AFTER `AuthGuard('jwt')` in `@UseGuards(...)` so `req.user` is populated.
 *
 * `emailVerified` is read **fresh from the database on every request**. It is deliberately
 * NOT taken from the JWT or from `req.user`: a token minted at sign-up would say `false`
 * forever, so a user who verified would stay locked out until the token rotated — and a
 * client-supplied claim is not a permission source in the first place.
 *
 * Scope: only the five cost-bearing routes. Login, browsing, the editor, onboarding and
 * every GET stay open — this guard protects spend, not access.
 */
@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request?.user?.id;

    // Unreachable behind AuthGuard('jwt'); treated as unauthenticated rather than
    // unverified so the client does not show a "verify your email" prompt to a
    // caller who has no session at all.
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (user.emailVerified === false) {
      throw new ForbiddenException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address to generate designs.',
      });
    }

    return true;
  }
}
