import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

// ---------------------------------------------------------------------------
// Mock the prisma singleton BEFORE importing the service — PricingCampaignService
// calls `prisma.*` directly (module-level singleton), matching this repo's
// usage-limit.service.spec.ts convention.
// ---------------------------------------------------------------------------
const { mockPrisma } = vi.hoisted(() => {
  const mockPrisma = {
    pricingCampaign: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  return { mockPrisma };
});

vi.mock('../../src/database/prisma.client', () => ({
  prisma: mockPrisma,
}));

import { PricingCampaignService } from '../../src/modules/payments/services/pricing-campaign.service';

describe('PricingCampaignService (US-PAY-105)', () => {
  let service: PricingCampaignService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PricingCampaignService();
    // $transaction just runs the callback against mockPrisma itself by default —
    // individual tests override this when they need to assert transaction ordering.
    mockPrisma.$transaction.mockImplementation((cb: any) => cb(mockPrisma));
  });

  const validInput = () => ({
    code: 'FOUNDING100',
    name: 'Founding Customer 100',
    tierDiscounts: {
      SOLO: { type: 'PERCENT' as const, value: 27.3 },
      TEAM: { type: 'PERCENT' as const, value: 31.8 },
    },
    startsAt: new Date('2026-08-22'),
  });

  // ---------------------------------------------------------------------------
  // AC1 / TC-PAY-105-01 — model shape
  // ---------------------------------------------------------------------------
  describe('createCampaign — AC1 (TC-PAY-105-01)', () => {
    it('creates a campaign with the given fields, isActive defaulting to false', async () => {
      mockPrisma.pricingCampaign.create.mockResolvedValue({ id: 'camp_1', ...validInput(), isActive: false });

      await service.createCampaign(validInput());

      expect(mockPrisma.pricingCampaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ code: 'FOUNDING100', isActive: false }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // AC2 / TC-PAY-105-02 — single-active guard
  // ---------------------------------------------------------------------------
  describe('createCampaign — AC2 single-active guard (TC-PAY-105-02)', () => {
    it('rejects creating a second campaign as isActive:true while another is already active', async () => {
      mockPrisma.pricingCampaign.findFirst.mockResolvedValue({ id: 'camp_existing', code: 'DIWALI2026', isActive: true });

      await expect(
        service.createCampaign({ ...validInput(), isActive: true }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(mockPrisma.pricingCampaign.create).not.toHaveBeenCalled();
    });

    it('allows creating a campaign as isActive:false even while another is active', async () => {
      mockPrisma.pricingCampaign.findFirst.mockResolvedValue({ id: 'camp_existing', code: 'DIWALI2026', isActive: true });
      mockPrisma.pricingCampaign.create.mockResolvedValue({ id: 'camp_new', ...validInput(), isActive: false });

      await service.createCampaign(validInput());

      expect(mockPrisma.pricingCampaign.create).toHaveBeenCalled();
    });
  });

  describe('activateCampaign — AC2 single-active guard via the sanctioned path', () => {
    it('deactivates every other row and activates the target inside one transaction', async () => {
      mockPrisma.pricingCampaign.findUnique.mockResolvedValue({ id: 'camp_new', code: 'DIWALI2026' });
      mockPrisma.pricingCampaign.update.mockResolvedValue({ id: 'camp_new', isActive: true });

      await service.activateCampaign('camp_new');

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrisma.pricingCampaign.updateMany).toHaveBeenCalledWith({
        where: { isActive: true, id: { not: 'camp_new' } },
        data: { isActive: false },
      });
      expect(mockPrisma.pricingCampaign.update).toHaveBeenCalledWith({
        where: { id: 'camp_new' },
        data: { isActive: true },
      });
    });

    it('throws NotFoundException for a campaign id that does not exist', async () => {
      mockPrisma.pricingCampaign.findUnique.mockResolvedValue(null);

      await expect(service.activateCampaign('ghost')).rejects.toBeInstanceOf(NotFoundException);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // AC3 / TC-PAY-105-03 — code is immutable
  // ---------------------------------------------------------------------------
  describe('AC3 (TC-PAY-105-03): code is unique and immutable', () => {
    it('the service exposes no method that updates `code` — only create + activate/deactivate', () => {
      const methods = Object.getOwnPropertyNames(PricingCampaignService.prototype);
      const updateMethods = methods.filter((m) => m.toLowerCase().includes('update'));
      expect(updateMethods).toEqual([]); // no updateCampaign()/renameCampaign()-style method exists
    });
  });

  // ---------------------------------------------------------------------------
  // AC4 / TC-PAY-105-04 — tierDiscounts validation
  // ---------------------------------------------------------------------------
  describe('createCampaign — AC4 tierDiscounts validation (TC-PAY-105-04)', () => {
    it('rejects a PERCENT value >= 100', async () => {
      await expect(
        service.createCampaign({
          ...validInput(),
          tierDiscounts: { SOLO: { type: 'PERCENT', value: 100 } },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockPrisma.pricingCampaign.create).not.toHaveBeenCalled();
    });

    it('rejects a PERCENT value <= 0', async () => {
      await expect(
        service.createCampaign({
          ...validInput(),
          tierDiscounts: { SOLO: { type: 'PERCENT', value: 0 } },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a negative FLAT value', async () => {
      await expect(
        service.createCampaign({
          ...validInput(),
          tierDiscounts: { SOLO: { type: 'FLAT', value: -500 } },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('accepts a valid FLAT value (including zero)', async () => {
      mockPrisma.pricingCampaign.create.mockResolvedValue({ id: 'camp_1' });

      await service.createCampaign({
        ...validInput(),
        tierDiscounts: { SOLO: { type: 'FLAT', value: 0 } },
      });

      expect(mockPrisma.pricingCampaign.create).toHaveBeenCalled();
    });

    it('rejects an unrecognized discount type', async () => {
      await expect(
        service.createCampaign({
          ...validInput(),
          tierDiscounts: { SOLO: { type: 'BOGUS' as any, value: 10 } },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getActiveCampaign', () => {
    it('returns the single active campaign, or null if none', async () => {
      mockPrisma.pricingCampaign.findFirst.mockResolvedValue({ id: 'camp_1', isActive: true });

      const result = await service.getActiveCampaign();

      expect(result).toEqual({ id: 'camp_1', isActive: true });
      expect(mockPrisma.pricingCampaign.findFirst).toHaveBeenCalledWith({ where: { isActive: true } });
    });
  });
});
