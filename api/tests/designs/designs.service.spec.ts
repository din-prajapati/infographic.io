/**
 * US-AI-037 — Save as Template (personal library)
 * Backend unit tests covering:
 *   TC-AI-037-01: default visibility 'private' when omitted from DTO
 *   TC-AI-037-06: DTO rejects visibility values outside the allowed enum
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

// ---------------------------------------------------------------------------
// Mock Prisma client — must be hoisted before module imports
// ---------------------------------------------------------------------------
const { mockPrisma } = vi.hoisted(() => {
  const mockPrisma = {
    template: {
      findFirst: vi.fn(),
    },
    property: {
      findFirst: vi.fn(),
    },
    infographic: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  };
  return { mockPrisma };
});

vi.mock('../../src/database/prisma.client', () => ({
  prisma: mockPrisma,
}));

import { DesignsService } from '../../src/modules/designs/services/designs.service';
import { CreateDesignDto } from '../../src/modules/designs/dto/create-design.dto';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const DEFAULT_TEMPLATE = { id: 'tpl_default', category: 'listing', isActive: true };
const BASE_INFOGRAPHIC = {
  id: 'inf_001',
  createdAt: new Date('2026-07-01T00:00:00Z'),
  updatedAt: new Date('2026-07-01T00:00:00Z'),
};

// ---------------------------------------------------------------------------
// DesignsService.save() — visibility defaulting (TC-AI-037-01)
// ---------------------------------------------------------------------------
describe('DesignsService — save()', () => {
  let service: DesignsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DesignsService();
    mockPrisma.template.findFirst.mockResolvedValue(DEFAULT_TEMPLATE);
  });

  it('TC-AI-037-01: persists visibility "private" by default when omitted in DTO', async () => {
    mockPrisma.infographic.create.mockImplementation(({ data }: any) =>
      Promise.resolve({
        ...BASE_INFOGRAPHIC,
        propertyData: data.propertyData,
      }),
    );

    const dto: CreateDesignDto = {
      name: 'My Template',
      type: 'template',
      canvasData: { version: '1.0', elements: [] },
      // visibility omitted — must default to 'private'
    };

    await service.save('user_1', 'org_1', dto);

    expect(mockPrisma.infographic.create).toHaveBeenCalledOnce();
    const callArg = mockPrisma.infographic.create.mock.calls[0][0];
    expect(callArg.data.propertyData.canvasDesign.visibility).toBe('private');
  });

  it('TC-AI-037-01b: persists explicit visibility when provided', async () => {
    mockPrisma.infographic.create.mockImplementation(({ data }: any) =>
      Promise.resolve({
        ...BASE_INFOGRAPHIC,
        propertyData: data.propertyData,
      }),
    );

    const dto: CreateDesignDto = {
      name: 'Curated Template',
      type: 'template',
      canvasData: { version: '1.0', elements: [] },
      visibility: 'admin_curated',
    };

    await service.save('user_1', 'org_1', dto);

    const callArg = mockPrisma.infographic.create.mock.calls[0][0];
    expect(callArg.data.propertyData.canvasDesign.visibility).toBe('admin_curated');
  });

  it('throws BadRequestException when no default template exists', async () => {
    mockPrisma.template.findFirst.mockResolvedValue(null);

    const dto: CreateDesignDto = {
      name: 'Test',
      type: 'template',
      canvasData: {},
    };

    await expect(service.save('user_1', 'org_1', dto)).rejects.toThrow(BadRequestException);
  });
});

// ---------------------------------------------------------------------------
// CreateDesignDto — visibility enum validation (TC-AI-037-06)
// ---------------------------------------------------------------------------
describe('CreateDesignDto — visibility validation (TC-AI-037-06)', () => {
  it('TC-AI-037-06: rejects a visibility value outside the allowed enum', async () => {
    const dto = plainToInstance(CreateDesignDto, {
      name: 'Test',
      type: 'template',
      canvasData: {},
      visibility: 'published', // invalid
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'visibility')).toBe(true);
  });

  it('TC-AI-037-06b: accepts all three valid visibility values', async () => {
    for (const visibility of ['private', 'admin_curated', 'for_sale'] as const) {
      const dto = plainToInstance(CreateDesignDto, {
        name: 'Test',
        type: 'template',
        canvasData: {},
        visibility,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'visibility')).toBe(false);
    }
  });

  it('TC-AI-037-06c: accepts missing visibility (field is optional)', async () => {
    const dto = plainToInstance(CreateDesignDto, {
      name: 'Test',
      type: 'template',
      canvasData: {},
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'visibility')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// US-PROP-001 — propertyId guard + exposure (TC-PROP-001-07, AC6, AC7)
// ---------------------------------------------------------------------------
describe('DesignsService — propertyId (US-PROP-001)', () => {
  let service: DesignsService;
  const baseDto: CreateDesignDto = {
    name: 'D',
    type: 'design',
    canvasData: { version: '1.0', elements: [] },
  };
  const existingRow = (propertyId: string | null) => ({
    ...BASE_INFOGRAPHIC,
    userId: 'user_1',
    propertyId,
    propertyData: { canvasDesign: { name: 'Old', type: 'design', canvasData: {}, visibility: 'private' } },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DesignsService();
    mockPrisma.template.findFirst.mockResolvedValue(DEFAULT_TEMPLATE);
    mockPrisma.infographic.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ ...BASE_INFOGRAPHIC, ...data }),
    );
    // Simulates the DB: row keeps its existing propertyId unless data sets one.
    mockPrisma.infographic.update.mockImplementation(({ data }: any) =>
      Promise.resolve({ ...existingRow('prop_existing'), ...data }),
    );
  });

  it('TC-PROP-001-07: create with other-org propertyId -> NotFoundException, nothing written', async () => {
    mockPrisma.property.findFirst.mockResolvedValue(null);

    await expect(
      service.save('user_1', 'org_1', { ...baseDto, propertyId: 'prop_other' } as any),
    ).rejects.toThrow(NotFoundException);

    expect(mockPrisma.property.findFirst.mock.calls[0][0].where).toEqual({
      id: 'prop_other',
      organizationId: 'org_1',
    });
    expect(mockPrisma.infographic.create).not.toHaveBeenCalled();
  });

  it('TC-PROP-001-07: update with other-org propertyId -> NotFoundException, nothing written', async () => {
    mockPrisma.infographic.findFirst.mockResolvedValue(existingRow(null));
    mockPrisma.property.findFirst.mockResolvedValue(null);

    await expect(
      service.save('user_1', 'org_1', { ...baseDto, propertyId: 'prop_other' } as any, 'inf_001'),
    ).rejects.toThrow(NotFoundException);

    expect(mockPrisma.infographic.update).not.toHaveBeenCalled();
  });

  it('create with own-org propertyId saves it and returns it', async () => {
    mockPrisma.property.findFirst.mockResolvedValue({ id: 'prop_own', organizationId: 'org_1' });

    const result: any = await service.save('user_1', 'org_1', { ...baseDto, propertyId: 'prop_own' } as any);

    expect(mockPrisma.infographic.create.mock.calls[0][0].data.propertyId).toBe('prop_own');
    expect(result.propertyId).toBe('prop_own');
  });

  it('update with own-org propertyId writes it', async () => {
    mockPrisma.infographic.findFirst.mockResolvedValue(existingRow(null));
    mockPrisma.property.findFirst.mockResolvedValue({ id: 'prop_own', organizationId: 'org_1' });

    const result: any = await service.save('user_1', 'org_1', { ...baseDto, propertyId: 'prop_own' } as any, 'inf_001');

    expect(mockPrisma.infographic.update.mock.calls[0][0].data.propertyId).toBe('prop_own');
    expect(result.propertyId).toBe('prop_own');
  });

  it('update with propertyId omitted carries the existing value and skips the property lookup', async () => {
    mockPrisma.infographic.findFirst.mockResolvedValue(existingRow('prop_existing'));

    const result: any = await service.save('user_1', 'org_1', baseDto, 'inf_001');

    expect(mockPrisma.property.findFirst).not.toHaveBeenCalled();
    expect(result.propertyId).toBe('prop_existing');
  });

  it('AC7: findAll includes propertyId (string and null)', async () => {
    mockPrisma.infographic.findMany.mockResolvedValue([
      existingRow('prop_a'),
      { ...existingRow(null), id: 'inf_002' },
    ]);

    const result: any[] = await service.findAll('user_1');

    expect(result[0].propertyId).toBe('prop_a');
    expect(result[1].propertyId).toBeNull();
  });

  it('AC7: findOne includes propertyId (string and null)', async () => {
    mockPrisma.infographic.findFirst.mockResolvedValueOnce(existingRow('prop_a'));
    expect(((await service.findOne('inf_001', 'user_1')) as any).propertyId).toBe('prop_a');

    mockPrisma.infographic.findFirst.mockResolvedValueOnce(existingRow(null));
    expect(((await service.findOne('inf_001', 'user_1')) as any).propertyId).toBeNull();
  });
});

// TC-PROP-001-17 Contract:
//   Expected: the canvas-templates path (type 'template') gets the same org guard — NotFoundException, no write
//   Location: DesignsService.save() — the single entry point both /designs and /canvas-templates use
describe('DesignsService — propertyId guard on the template path (TC-PROP-001-17)', () => {
  const templateDto = { name: 'T', type: 'template', canvasData: { version: '1.0', elements: [] }, propertyId: 'prop_other' } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.template.findFirst.mockResolvedValue(DEFAULT_TEMPLATE);
    mockPrisma.property.findFirst.mockResolvedValue(null);
  });

  it('create: other-org propertyId -> NotFoundException, nothing created', async () => {
    await expect(new DesignsService().save('user_1', 'org_1', templateDto)).rejects.toThrow(NotFoundException);
    expect(mockPrisma.infographic.create).not.toHaveBeenCalled();
  });

  it('update: other-org propertyId -> NotFoundException, nothing updated', async () => {
    mockPrisma.infographic.findFirst.mockResolvedValue({ ...BASE_INFOGRAPHIC, propertyData: { canvasDesign: { type: 'template' } } });
    await expect(new DesignsService().save('user_1', 'org_1', templateDto, 'inf_001')).rejects.toThrow(NotFoundException);
    expect(mockPrisma.infographic.update).not.toHaveBeenCalled();
  });
});

// Trust-edge Contract (Codex review, PR #88):
//   Expected: propertyId null and "" are validation errors; omitted is fine
//   Location: CreateDesignDto.propertyId
describe('CreateDesignDto — propertyId validation', () => {
  const base = { name: 'D', type: 'design', canvasData: {} };

  it.each([null, ''])('propertyId %o is rejected', async (propertyId) => {
    const errors = await validate(plainToInstance(CreateDesignDto, { ...base, propertyId }));
    expect(errors.map((e) => e.property)).toEqual(['propertyId']);
  });

  it('omitted propertyId is valid', async () => {
    expect(await validate(plainToInstance(CreateDesignDto, base))).toEqual([]);
  });
});
