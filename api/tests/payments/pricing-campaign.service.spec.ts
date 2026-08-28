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
      // Prisma field references — tryConsumeRedemption compares one column against
      // another (redemptionsUsed < maxRedemptions) inside the WHERE clause.
      fields: { maxRedemptions: 'maxRedemptions' },
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

  // A campaign carries no prices — it records WHICH promo is live. The prices live in
  // PLAN_CONFIG.promoPrices, keyed by this `code`.
  const validInput = () => ({
    code: 'FOUNDING100',
    name: 'Founding Customer 100',
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
  // A campaign carries no discount numbers to validate
  // ---------------------------------------------------------------------------
  describe('campaigns hold no prices (authored-price model)', () => {
    it('writes an empty tierDiscounts — the column is vestigial, never read', async () => {
      mockPrisma.pricingCampaign.create.mockResolvedValue({ id: 'camp_1' });

      await service.createCampaign(validInput());

      expect(mockPrisma.pricingCampaign.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ tierDiscounts: {} }) }),
      );
    });

    it('accepts no discount input at all — there is no percentage to get wrong', () => {
      // The old model took tierDiscounts: { TIER: { type, value } } and needed range
      // validation (0 < PERCENT < 100, FLAT >= 0) plus a FLAT-vs-PERCENT discriminator.
      // Authored promo prices removed the entire input, and with it the whole class of
      // "a percentage produced a price nobody reviewed".
      const input = validInput() as Record<string, unknown>;
      expect(input.tierDiscounts).toBeUndefined();
      expect(Object.getOwnPropertyNames(PricingCampaignService.prototype)).not.toContain(
        'validateTierDiscounts',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // The redemption cap's WRITE side — this had no implementation at all
  // ---------------------------------------------------------------------------
  describe('tryConsumeRedemption — the cap actually closes', () => {
    it('increments redemptionsUsed and returns true when under the cap', async () => {
      mockPrisma.pricingCampaign.updateMany.mockResolvedValue({ count: 1 });

      const consumed = await service.tryConsumeRedemption('FOUNDING100');

      expect(consumed).toBe(true);
      expect(mockPrisma.pricingCampaign.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { redemptionsUsed: { increment: 1 } } }),
      );
    });

    it('enforces the cap in the WHERE clause, not in application code', async () => {
      mockPrisma.pricingCampaign.updateMany.mockResolvedValue({ count: 1 });

      await service.tryConsumeRedemption('FOUNDING100');

      const { where } = mockPrisma.pricingCampaign.updateMany.mock.calls[0][0];
      // Conditional update = Postgres serialises it. Two concurrent checkouts at the
      // boundary cannot both win; the loser matches zero rows.
      expect(where.code).toBe('FOUNDING100');
      expect(where.isActive).toBe(true);
      expect(where.OR).toEqual([
        { maxRedemptions: null },
        { redemptionsUsed: { lt: 'maxRedemptions' } },
      ]);
    });

    it('returns false when the campaign is already at its cap (zero rows matched)', async () => {
      mockPrisma.pricingCampaign.updateMany.mockResolvedValue({ count: 0 });

      const consumed = await service.tryConsumeRedemption('FOUNDING100');

      expect(consumed).toBe(false);
    });

    it('returns false for an inactive campaign', async () => {
      mockPrisma.pricingCampaign.updateMany.mockResolvedValue({ count: 0 });

      expect(await service.tryConsumeRedemption('RETIRED2025')).toBe(false);
    });
  });

  describe('getActiveCampaign', () => {
    it('returns the single active campaign, or null if none', async () => {
      mockPrisma.pricingCampaign.findFirst.mockResolvedValue({ id: 'camp_1', isActive: true });

      const result = await service.getActiveCampaign();

      expect(result).toEqual({ id: 'camp_1', isActive: true });
      expect(mockPrisma.pricingCampaign.findFirst).toHaveBeenCalledWith({ where: { isActive: true } });
    });

    // Regression: a missing-table / DB error here (e.g. a migration that hasn't been pushed yet)
    // previously threw all the way up through getEffectivePrice() and 500'd the entire pricing
    // page for every tier. It must degrade to "no active campaign" instead.
    it('falls back to null instead of throwing when the lookup fails', async () => {
      mockPrisma.pricingCampaign.findFirst.mockRejectedValue(
        new Error('The table `public.PricingCampaign` does not exist in the current database.'),
      );

      const result = await service.getActiveCampaign();

      expect(result).toBeNull();
    });
  });
});
