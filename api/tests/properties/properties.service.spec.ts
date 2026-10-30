/**
 * US-PROP-001 — PropertiesService (org-scoped Property records)
 * Covers TC-PROP-001-04 (org id from caller only) and TC-PROP-001-05 (cross-org update -> 404).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';

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
