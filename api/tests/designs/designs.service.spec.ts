/**
 * US-AI-037 — Save as Template (personal library)
 * Backend unit tests covering:
 *   TC-AI-037-01: default visibility 'private' when omitted from DTO
 *   TC-AI-037-06: DTO rejects visibility values outside the allowed enum
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
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
