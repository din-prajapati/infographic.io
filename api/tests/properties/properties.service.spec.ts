/**
 * US-PROP-001 — PropertiesService (org-scoped Property records)
 * Covers TC-PROP-001-04 (org id from caller only) and TC-PROP-001-05 (cross-org update -> 404).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

const { mockPrisma } = vi.hoisted(() => {
  const mockPrisma = {
    property: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  };
  return { mockPrisma };
});

vi.mock('../../src/database/prisma.client', () => ({ prisma: mockPrisma }));

import { PropertiesService } from '../../src/modules/properties/services/properties.service';
import { CreatePropertyDto } from '../../src/modules/properties/dto/create-property.dto';

describe('PropertiesService', () => {
  let service: PropertiesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PropertiesService();
  });

  // AC2/AC4 Contract:
  //   Expected: property.create data.organizationId === orgId argument; returns record with id
  //   Location: PropertiesService.create()
  //   Condition: dto carries a different organizationId
  describe('create', () => {
    it('TC-PROP-001-04: uses the orgId argument, ignoring any organizationId in the dto', async () => {
      mockPrisma.property.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'prop_1', ...data }),
      );

      const result: any = await service.create('org_A', {
        headline: '3BHK Villa',
        organizationId: 'org_EVIL',
      } as any);

      expect(mockPrisma.property.create).toHaveBeenCalledOnce();
      const arg = mockPrisma.property.create.mock.calls[0][0];
      expect(arg.data.organizationId).toBe('org_A');
      expect(arg.data.headline).toBe('3BHK Villa');
      expect(result.id).toBe('prop_1');
      expect(result.organizationId).toBe('org_A');
    });

    it('propagates database errors', async () => {
      mockPrisma.property.create.mockRejectedValue(new Error('db down'));
      await expect(service.create('org_A', { headline: 'x' } as any)).rejects.toThrow('db down');
    });
  });

  // Contract: findMany where { organizationId: orgId }, orderBy { updatedAt: 'desc' }
  describe('findAll', () => {
    it('filters by organizationId and orders by updatedAt desc', async () => {
      const rows = [{ id: 'p2' }, { id: 'p1' }];
      mockPrisma.property.findMany.mockResolvedValue(rows);

      const result = await service.findAll('org_A');

      expect(mockPrisma.property.findMany).toHaveBeenCalledOnce();
      const arg = mockPrisma.property.findMany.mock.calls[0][0];
      expect(arg.where).toEqual({ organizationId: 'org_A' });
      expect(arg.orderBy).toEqual({ updatedAt: 'desc' });
      expect(result).toEqual(rows);
    });

    it('returns an empty array when the org has no properties', async () => {
      mockPrisma.property.findMany.mockResolvedValue([]);
      expect(await service.findAll('org_A')).toEqual([]);
    });
  });

  // Contract: findFirst({ where: { id, organizationId } }); null -> NotFoundException; never findUnique
  describe('findOne', () => {
    it('queries with id AND organizationId via findFirst and returns the row', async () => {
      const row = { id: 'p1', organizationId: 'org_A' };
      mockPrisma.property.findFirst.mockResolvedValue(row);

      const result = await service.findOne('p1', 'org_A');

      expect(mockPrisma.property.findFirst).toHaveBeenCalledOnce();
      expect(mockPrisma.property.findFirst.mock.calls[0][0].where).toEqual({
        id: 'p1',
        organizationId: 'org_A',
      });
      expect(mockPrisma.property.findUnique).not.toHaveBeenCalled();
      expect(result).toBe(row);
    });

    it('throws NotFoundException when no row matches (other org or missing)', async () => {
      mockPrisma.property.findFirst.mockResolvedValue(null);
      await expect(service.findOne('p1', 'org_B')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('TC-PROP-001-05: other-org/missing property -> NotFoundException and no write', async () => {
      mockPrisma.property.findFirst.mockResolvedValue(null);

      await expect(service.update('p1', 'org_B', { headline: 'hack' } as any)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrisma.property.update).not.toHaveBeenCalled();
    });

    it('own-org: updates by id with only the dto fields and returns the updated record', async () => {
      mockPrisma.property.findFirst.mockResolvedValue({ id: 'p1', organizationId: 'org_A' });
      mockPrisma.property.update.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'p1', organizationId: 'org_A', ...data }),
      );

      const result: any = await service.update('p1', 'org_A', { headline: 'New', beds: 4 } as any);

      expect(mockPrisma.property.findFirst.mock.calls[0][0].where).toEqual({
        id: 'p1',
        organizationId: 'org_A',
      });
      expect(mockPrisma.property.update).toHaveBeenCalledOnce();
      const arg = mockPrisma.property.update.mock.calls[0][0];
      expect(arg.where).toEqual({ id: 'p1' });
      expect(arg.data).toEqual({ headline: 'New', beds: 4 });
      expect(result.headline).toBe('New');
      expect(result.beds).toBe(4);
    });
  });
});

// TC-PROP-001-11 Contract:
//   Expected: update data holds ONLY the field sent (no beds/headline defaults leak in); full record returned
//   Location: PropertiesService.update()
//   Condition: owned property, dto = { price } only
describe('PropertiesService.update — partial body (TC-PROP-001-11)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('writes only the sent field and returns the full record including updatedAt', async () => {
    const service = new PropertiesService();
    const stored = { id: 'p1', organizationId: 'org_A', headline: 'Old', beds: 3, price: '', updatedAt: new Date('2026-10-30T10:00:00Z') };
    mockPrisma.property.findFirst.mockResolvedValue(stored);
    mockPrisma.property.update.mockImplementation(({ data }: any) =>
      Promise.resolve({ ...stored, ...data, updatedAt: new Date('2026-10-30T11:00:00Z') }),
    );

    const result: any = await service.update('p1', 'org_A', { price: '5Cr' });

    expect(mockPrisma.property.update.mock.calls[0][0].data).toEqual({ price: '5Cr' });
    expect(result).toMatchObject({ price: '5Cr', headline: 'Old', beds: 3 });
    expect(result.updatedAt.getTime()).toBeGreaterThan(stored.updatedAt.getTime());
  });
});

// Trust-edge Contract (Codex review, PR #88):
//   Expected: an explicit null on any optional field is a validation error (→ 400), never a Prisma 500;
//             an omitted field is not an error
//   Location: CreatePropertyDto (UpdatePropertyDto extends it)
describe('CreatePropertyDto — null is not "omitted"', () => {
  it.each(['type', 'headline', 'price', 'beds', 'baths', 'sqft', 'address', 'description', 'features', 'locale', 'photoRefs', 'status'])(
    '%s: null is rejected',
    async (field) => {
      const errors = await validate(plainToInstance(CreatePropertyDto, { [field]: null }));
      expect(errors.map((e) => e.property)).toEqual([field]);
    },
  );

  it('an empty body is valid (every field optional)', async () => {
    expect(await validate(plainToInstance(CreatePropertyDto, {}))).toEqual([]);
  });

  it('valid values pass; beds 0 and empty features are allowed (TC-PROP-001-26)', async () => {
    const errors = await validate(plainToInstance(CreatePropertyDto, { headline: 'X', beds: 0, baths: 2, features: [] }));
    expect(errors).toEqual([]);
  });

  it.each([{ beds: 'three' }, { beds: 2.5 }, { features: 'pool' }, { features: [1] }])(
    'malformed %o is rejected (TC-PROP-001-26)',
    async (body) => {
      expect((await validate(plainToInstance(CreatePropertyDto, body))).length).toBeGreaterThan(0);
    },
  );
});
