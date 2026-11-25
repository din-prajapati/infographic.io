import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

const prismaMock = vi.hoisted(() => ({ user: { findUnique: vi.fn(), update: vi.fn() } }));
vi.mock('../../src/database/prisma.client', () => ({ prisma: prismaMock }));

import { UsersService } from '../../src/modules/users/users.service';
import { UpdateProfileDto } from '../../src/modules/users/dto/update-profile.dto';

const row = (patch: Record<string, unknown> = {}) => ({
  id: 'user_1', email: 'priya@example.com', password: '$2b$10$hash', name: 'Priya Shah', avatarUrl: null,
  provider: 'local', googleId: null, emailVerified: true, organizationId: 'org_1',
  createdAt: new Date('2026-11-01T10:00:00.000Z'), ...patch,
});

describe('UsersService profile (Settings → Account)', () => {
  const service = new UsersService();
  beforeEach(() => { prismaMock.user.findUnique.mockReset(); prismaMock.user.update.mockReset(); });

  it('getProfile returns the profile without the password hash', async () => {
    prismaMock.user.findUnique.mockResolvedValue(row());
    const profile = await service.getProfile('user_1');
    expect(profile).toEqual({
      id: 'user_1', email: 'priya@example.com', name: 'Priya Shah', avatarUrl: null, hasPassword: true, hasGoogle: false,
      emailVerified: true, organizationId: 'org_1', createdAt: '2026-11-01T10:00:00.000Z',
    });
    expect(JSON.stringify(profile)).not.toContain('$2b$');
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'user_1' } }));
  });

  it('getProfile reports hasPassword=false for a Google-only account (same rule as forgot-password)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(row({ provider: 'google', password: '', googleId: 'g-1' }));
    const profile = await service.getProfile('user_1');
    expect(profile.hasPassword).toBe(false);
    expect(profile.hasGoogle).toBe(true);
  });

  it('getProfile throws NotFound for a deleted user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(service.getProfile('gone')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updateProfile trims the name and writes only the caller\'s row', async () => {
    prismaMock.user.update.mockResolvedValue(row({ name: 'Priya S.' }));
    const profile = await service.updateProfile('user_1', { name: '  Priya S.  ' });
    expect(prismaMock.user.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'user_1' }, data: { name: 'Priya S.' } }));
    expect(profile.name).toBe('Priya S.');
  });

  it('updateProfile rejects a blank name', async () => {
    await expect(service.updateProfile('user_1', { name: '   ' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('updateProfile accepts an https photo and null to remove it', async () => {
    prismaMock.user.update.mockResolvedValue(row({ avatarUrl: 'https://cdn.example.test/a.png' }));
    await service.updateProfile('user_1', { avatarUrl: 'https://cdn.example.test/a.png' });
    expect(prismaMock.user.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: { avatarUrl: 'https://cdn.example.test/a.png' } }));
    prismaMock.user.update.mockResolvedValue(row());
    await service.updateProfile('user_1', { avatarUrl: null });
    expect(prismaMock.user.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: { avatarUrl: null } }));
  });

  it.each(['data:image/png;base64,AAAA', 'http://cdn.example.test/a.png', 'javascript:alert(1)', 'https://has space.png'])(
    'updateProfile rejects a non-https photo address: %s', async (avatarUrl) => {
      await expect(service.updateProfile('user_1', { avatarUrl })).rejects.toBeInstanceOf(BadRequestException);
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

  it('updateProfile with no fields reads instead of writing', async () => {
    prismaMock.user.findUnique.mockResolvedValue(row());
    await service.updateProfile('user_1', {});
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});

describe('UpdateProfileDto (validated with the same options as ValidatedBody)', () => {
  const errors = (body: object) => validateSync(plainToInstance(UpdateProfileDto, body), { whitelist: true, forbidNonWhitelisted: true, forbidUnknownValues: false });

  it('accepts name and avatarUrl', () => { expect(errors({ name: 'Priya', avatarUrl: 'https://x.test/a.png' })).toHaveLength(0); });
  it('accepts avatarUrl: null', () => { expect(errors({ avatarUrl: null })).toHaveLength(0); });
  it('rejects a name over 100 characters', () => { expect(errors({ name: 'a'.repeat(101) })).not.toHaveLength(0); });
  it('rejects fields the user may not change (email, organizationId)', () => {
    expect(errors({ email: 'new@example.com' })).not.toHaveLength(0);
    expect(errors({ organizationId: 'org_2' })).not.toHaveLength(0);
  });
});
