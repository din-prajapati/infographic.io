/**
 * US-AI-031 — Real property photo as composition source
 * Unit tests for IdeogramService (new: this service had no spec before this story).
 * All tests are mock-based — the Ideogram account is out of credit.
 *
 * TC-AI-031-01 and TC-AI-031-07 are gated on credit top-up and are excluded here.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

// Mock declarations must be hoisted before any imports that load the modules.
vi.mock('axios', () => ({
  default: { post: vi.fn() },
}));

vi.mock('fs', async () => ({
  readFileSync: vi.fn(),
}));

import axios from 'axios';
import * as fs from 'fs';
import { IdeogramService } from '../../src/modules/ai-generation/services/ideogram.service';
import { AiOrchestrator } from '../../src/modules/ai-generation/services/ai-orchestrator.service';
import { GenerateFromChatDto } from '../../src/modules/infographics/dto/generate-from-chat.dto';

// ────────────────────────────────────────────────────────────────────────────
// TC-AI-031-05 + TC-AI-031-02 + TC-AI-031-06 — IdeogramService unit tests
// ────────────────────────────────────────────────────────────────────────────
describe('IdeogramService', () => {
  let service: IdeogramService;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.IDEOGRAM_API_KEY = 'test-key-031';
    service = new IdeogramService();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TC-AI-031-05: V4 generate must not send style_reference_images (AC7)
  //
  // The field is undocumented on POST /v1/ideogram-v4/generate. An unexpected
  // multipart field may 400 the whole request — identified in SPIKE-031 §3b as
  // a likely root cause of the open TC-AI-010-02 failure.
  // ──────────────────────────────────────────────────────────────────────────
  describe('generateImageV4 — AC7', () => {
    it('TC-AI-031-05: does not append style_reference_images to the V4 generate body', async () => {
      (axios.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { data: [{ url: 'https://cdn.example.com/gen.jpg' }] },
      });

      const appendSpy = vi.spyOn(FormData.prototype, 'append');
      const jsonPrompt = { compositional_deconstruction: { elements: [] } };

      await service.generateImageV4(jsonPrompt, 'ideogram-4', 'landscape', 'gen-005');

      const appendedKeys = appendSpy.mock.calls.map(([key]) => key);
      expect(appendedKeys).not.toContain('style_reference_images');
      // Documented params must still be present
      expect(appendedKeys).toContain('json_prompt');
      expect(appendedKeys).toContain('rendering_speed');
      expect(appendedKeys).toContain('resolution');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TC-AI-031-02: Photo-backed path — hard fail when file is unreadable (AC4)
  //
  // The previous behaviour was: catch → warn → continue (fabricated house).
  // New behaviour: throw HttpException(422) immediately with a user message.
  // No HTTP call to Ideogram must be made.
  // ──────────────────────────────────────────────────────────────────────────
  describe('composeWithSourceImage — AC4', () => {
    it('TC-AI-031-02: throws HttpException when the photo file cannot be read', async () => {
      (fs.readFileSync as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory, open \'/tmp/...-uploads/abc123.jpg\'');
      });

      await expect(
        service.composeWithSourceImage('Design prompt', 'abc123.jpg', 'ideogram-4', 'landscape', 'gen-002'),
      ).rejects.toThrow(HttpException);
    });

    it('TC-AI-031-02: no HTTP call is made when the photo is unreadable', async () => {
      (fs.readFileSync as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('ENOENT');
      });
      const axiosPostSpy = axios.post as ReturnType<typeof vi.fn>;

      await expect(
        service.composeWithSourceImage('Design', 'missing.jpg', 'ideogram-4', 'landscape', 'gen-003'),
      ).rejects.toThrow();

      expect(axiosPostSpy).not.toHaveBeenCalled();
    });

    it('TC-AI-031-02: the thrown error is HTTP 422 with a user-readable message', async () => {
      (fs.readFileSync as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('ENOENT');
      });

      let caught: any;
      try {
        await service.composeWithSourceImage('Design', 'abc123.jpg', 'ideogram-4', 'landscape', 'gen-004');
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(HttpException);
      expect((caught as HttpException).getStatus()).toBe(422);
      const body = (caught as HttpException).getResponse();
      expect(typeof body === 'string' ? body : '').toContain('photo could not be read');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Remix call structure (AC1, AC2)
  // ──────────────────────────────────────────────────────────────────────────
  describe('composeWithSourceImage — call structure', () => {
    const validPhotoName = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg';

    beforeEach(() => {
      (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(Buffer.from('fake-photo'));
      (axios.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { data: [{ url: 'https://cdn.example.com/remix.jpg' }] },
      });
    });

    it('sends the photo as the "image" field (not style_reference_images)', async () => {
      const appendSpy = vi.spyOn(FormData.prototype, 'append');
      await service.composeWithSourceImage('Design prompt', validPhotoName, 'ideogram-4', 'landscape', 'gen-006');

      const appendedKeys = appendSpy.mock.calls.map(([key]) => key);
      expect(appendedKeys).toContain('image');
      expect(appendedKeys).not.toContain('style_reference_images');
    });

    it('TC-AI-031-06: the text_prompt field receives the prompt passed in (including any clean-typography instruction)', async () => {
      const appendSpy = vi.spyOn(FormData.prototype, 'append');
      const promptWithTypography =
        'Real estate design prompt\n\nTypography: use clean, straight, standard sans-serif type at high contrast.';

      await service.composeWithSourceImage(promptWithTypography, validPhotoName, 'ideogram-4', 'landscape', 'gen-007');

      const textPromptCall = appendSpy.mock.calls.find(([key]) => key === 'text_prompt');
      expect(textPromptCall).toBeDefined();
      expect(textPromptCall![1]).toContain('clean');
      expect(textPromptCall![1]).toContain('straight');
    });

    it('calls the V4 Remix endpoint (not V4 generate or V3 generate)', async () => {
      await service.composeWithSourceImage('Design', validPhotoName, 'ideogram-4', 'landscape', 'gen-008');

      const calledUrl = (axios.post as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledUrl).toContain('/v1/ideogram-v4/remix');
      expect(calledUrl).not.toContain('/v1/ideogram-v4/generate');
      expect(calledUrl).not.toContain('/v1/ideogram-v3/');
    });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// TC-AI-031-04 — photoReference DTO validation (AC5)
//
// photoReference flows into path.join(PHOTO_UPLOADS_DIR, ...) → fs.readFileSync.
// A bare @IsString() allows '../../etc/passwd' to read arbitrary files.
// This validates that the @Matches() guard blocks traversal at the boundary.
// ────────────────────────────────────────────────────────────────────────────
describe('GenerateFromChatDto — photoReference path-traversal guard (AC5)', () => {
  it('TC-AI-031-04: rejects a path-traversal string (../../etc/passwd)', async () => {
    const dto = plainToInstance(GenerateFromChatDto, {
      prompt: '3BR at 123 Main St for $500K',
      photoReference: '../../etc/passwd',
    });
    const errors = await validate(dto);
    const photoErrors = errors.filter(e => e.property === 'photoReference');
    expect(photoErrors.length).toBeGreaterThan(0);
  });

  it('TC-AI-031-04: rejects a bare filename without UUID format', async () => {
    const dto = plainToInstance(GenerateFromChatDto, {
      prompt: '3BR at 123 Main St for $500K',
      photoReference: 'photo.jpg',
    });
    const errors = await validate(dto);
    const photoErrors = errors.filter(e => e.property === 'photoReference');
    expect(photoErrors.length).toBeGreaterThan(0);
  });

  it('TC-AI-031-04: rejects a UUID without extension', async () => {
    const dto = plainToInstance(GenerateFromChatDto, {
      prompt: '3BR at 123 Main St for $500K',
      photoReference: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    });
    const errors = await validate(dto);
    const photoErrors = errors.filter(e => e.property === 'photoReference');
    expect(photoErrors.length).toBeGreaterThan(0);
  });

  it('accepts a valid UUID + .jpg extension', async () => {
    const dto = plainToInstance(GenerateFromChatDto, {
      prompt: '3BR at 123 Main St for $500K',
      photoReference: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg',
    });
    const errors = await validate(dto);
    const photoErrors = errors.filter(e => e.property === 'photoReference');
    expect(photoErrors).toHaveLength(0);
  });

  it('accepts a valid UUID + .jpeg extension', async () => {
    const dto = plainToInstance(GenerateFromChatDto, {
      prompt: '3BR at 123 Main St for $500K',
      photoReference: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpeg',
    });
    const errors = await validate(dto);
    const photoErrors = errors.filter(e => e.property === 'photoReference');
    expect(photoErrors).toHaveLength(0);
  });

  it('accepts a valid UUID + .png extension', async () => {
    const dto = plainToInstance(GenerateFromChatDto, {
      prompt: '3BR at 123 Main St for $500K',
      photoReference: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890.png',
    });
    const errors = await validate(dto);
    const photoErrors = errors.filter(e => e.property === 'photoReference');
    expect(photoErrors).toHaveLength(0);
  });

  it('is optional — omitting photoReference passes validation', async () => {
    const dto = plainToInstance(GenerateFromChatDto, {
      prompt: '3BR at 123 Main St for $500K',
    });
    const errors = await validate(dto);
    const photoErrors = errors.filter(e => e.property === 'photoReference');
    expect(photoErrors).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// TC-AI-031-06 — Orchestrator appends clean-typography instruction (AC2)
//
// The orchestrator is responsible for adding the typography instruction to
// the remix prompt before calling composeWithSourceImage. This test verifies
// that routing logic, not the service itself.
// ────────────────────────────────────────────────────────────────────────────
describe('AiOrchestrator — photo-backed generation routing (AC1, AC2, AC3)', () => {
  function buildMocks() {
    const capturedRemixPrompts: string[] = [];

    const mockIdeogram = {
      composeWithSourceImage: vi.fn().mockImplementation((prompt: string) => {
        capturedRemixPrompts.push(prompt);
        return Promise.resolve('https://cdn.example.com/remix.jpg');
      }),
      convertTextPromptToV4Json: vi.fn(),
      generateImageV4: vi.fn(),
      generateImage: vi.fn(),
    };

    const mockOpenAi = {
      analyzeProperty: vi.fn().mockResolvedValue('Stunning Hilltop Retreat'),
    };

    // Prisma: first findUnique returns null (plan tier lookup → planTier = '');
    // second returns a minimal infographic for the usage record.
    const mockPrisma = {
      infographic: {
        findUnique: vi.fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: 'gen-010', userId: 'u1', organizationId: null }),
        update: vi.fn().mockResolvedValue({ id: 'gen-010' }),
      },
      organization: { findUnique: vi.fn().mockResolvedValue(null) },
      usageRecord: { create: vi.fn().mockResolvedValue({}) },
    };

    return { mockIdeogram, mockOpenAi, mockPrisma, capturedRemixPrompts };
  }

  const propertyData = {
    address: '99 Oak Lane',
    price: 750000,
    beds: 3,
    baths: 2,
    agent: { name: 'Alex Kim', brokerage: 'ERA Realty', brandColors: ['#0A1F44', '#FFFFFF'] },
  };

  it('TC-AI-031-06: remix prompt contains the clean-typography instruction (AC2)', async () => {
    const { mockIdeogram, mockOpenAi, mockPrisma, capturedRemixPrompts } = buildMocks();
    const orchestrator = new AiOrchestrator(mockOpenAi as any, mockIdeogram as any, mockPrisma as any);

    await orchestrator.generateInfographic(
      'gen-010',
      propertyData,
      { variations: 1, photoReference: 'a1b2c3d4-0000-0000-0000-000000000000.jpg' },
    );

    expect(mockIdeogram.composeWithSourceImage).toHaveBeenCalledOnce();
    expect(capturedRemixPrompts[0]).toContain('clean');
    expect(capturedRemixPrompts[0]).toContain('straight');
    expect(capturedRemixPrompts[0]).toContain('standard');
  });

  it('photo path skips magic-prompt and generateImageV4 entirely (AC3 — no-photo path untouched)', async () => {
    const { mockIdeogram, mockOpenAi, mockPrisma } = buildMocks();
    const orchestrator = new AiOrchestrator(mockOpenAi as any, mockIdeogram as any, mockPrisma as any);

    await orchestrator.generateInfographic(
      'gen-010',
      propertyData,
      { variations: 1, photoReference: 'a1b2c3d4-0000-0000-0000-000000000000.jpg' },
    );

    expect(mockIdeogram.convertTextPromptToV4Json).not.toHaveBeenCalled();
    expect(mockIdeogram.generateImageV4).not.toHaveBeenCalled();
    expect(mockIdeogram.composeWithSourceImage).toHaveBeenCalledOnce();
  });

  it('no-photo path still calls generateImageV4 (AC3 — no-photo path byte-identical)', async () => {
    const { mockIdeogram, mockOpenAi, mockPrisma } = buildMocks();
    // Reset the openAi mock since we re-use it
    mockOpenAi.analyzeProperty.mockResolvedValue('Modern Luxury Estate');
    // For no-photo V4 path: magic-prompt conversion must succeed
    mockIdeogram.convertTextPromptToV4Json.mockResolvedValue({
      compositional_deconstruction: { elements: [] },
    });
    mockIdeogram.generateImageV4.mockResolvedValue('https://cdn.example.com/gen.jpg');

    const orchestrator = new AiOrchestrator(mockOpenAi as any, mockIdeogram as any, mockPrisma as any);

    // No photoReference → existing V4 json_prompt path
    await orchestrator.generateInfographic(
      'gen-010',
      { ...propertyData, aiModel: 'ideogram-4' },
      { variations: 1 }, // no photoReference
    );

    expect(mockIdeogram.convertTextPromptToV4Json).toHaveBeenCalledOnce();
    expect(mockIdeogram.generateImageV4).toHaveBeenCalledOnce();
    expect(mockIdeogram.composeWithSourceImage).not.toHaveBeenCalled();
  });
});
