import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * PATCH /users/me — the signed-in user's own profile (Settings → Account).
 * Both fields are optional; omitting a field leaves it unchanged. `avatarUrl: null` removes the photo.
 * Shape rules beyond type and length (non-blank name, https-only photo) live in UsersService.updateProfile.
 */
export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Priya Shah', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'https://cdn.buildographic.com/u/portrait.png', nullable: true, maxLength: 2048 })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatarUrl?: string | null;
}
