/**
 * BL-43 — the listing photo is cropped to the requested orientation before the
 * Ideogram remix call, because the remix output takes the uploaded photo's
 * aspect ratio (BL-42 removed `resolution`). Real sharp, images built in memory.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios', () => ({
  default: { post: vi.fn() },
}));

vi.mock('fs', async () => ({
  readFileSync: vi.fn(),
}));

import axios from 'axios';
import * as fs from 'fs';
import sharp from 'sharp';
import {
  computeCenterCrop,
  cropToOrientation,
} from '../../src/modules/ai-generation/utils/crop-to-orientation';
import { IdeogramService } from '../../src/modules/ai-generation/services/ideogram.service';

async function makeImage(width: number, height: number, format: 'jpeg' | 'png' = 'jpeg'): Promise<Buffer> {
  const img = sharp({ create: { width, height, channels: 3, background: { r: 120, g: 140, b: 160 } } });
  return format === 'png' ? img.png().toBuffer() : img.jpeg().toBuffer();
}

describe('BL-43 — computeCenterCrop', () => {
  it('trims the sides of a landscape photo to a centred 9:16 box', () => {
    expect(computeCenterCrop(3000, 2000, 9 / 16)).toEqual({ left: 937, top: 0, width: 1125, height: 2000 });
  });

  it('trims top and bottom of a portrait photo to a centred 16:9 box', () => {
    expect(computeCenterCrop(1080, 1920, 16 / 9)).toEqual({ left: 0, top: 656, width: 1080, height: 608 });
  });

  it('crops a landscape photo to a centred square', () => {
    expect(computeCenterCrop(1600, 1000, 1)).toEqual({ left: 300, top: 0, width: 1000, height: 1000 });
  });

  it('never leaves the source bounds and never upscales, across shapes', () => {
    for (const [w, h] of [[1, 1], [7, 3], [3, 7], [4032, 3024], [3024, 4032], [2560, 1440], [1000, 1000]]) {
      for (const aspect of [16 / 9, 9 / 16, 1]) {
        const box = computeCenterCrop(w, h, aspect);
        expect(box.left).toBeGreaterThanOrEqual(0);
        expect(box.top).toBeGreaterThanOrEqual(0);
        expect(box.left + box.width).toBeLessThanOrEqual(w);
        expect(box.top + box.height).toBeLessThanOrEqual(h);
        expect(box.width).toBeGreaterThanOrEqual(1);
        expect(box.height).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('rejects a zero-sized source', () => {
    expect(() => computeCenterCrop(0, 100, 1)).toThrow();
  });
});

describe('BL-43 — cropToOrientation', () => {
  it('crops a landscape JPEG to portrait, keeping full height', async () => {
    const result = await cropToOrientation(await makeImage(1600, 1000), 'portrait');
    const meta = await sharp(result.buffer).metadata();

    expect(result.cropped).toBe(true);
    expect(meta.format).toBe('jpeg');
    expect(meta.height).toBe(1000);
    expect(meta.width).toBe(563); // round(1000 * 9 / 16)
    expect({ width: result.width, height: result.height }).toEqual({ width: 563, height: 1000 });
  });

  it('leaves a photo already at the target aspect unchanged', async () => {
    const result = await cropToOrientation(await makeImage(1920, 1080), 'landscape');
    expect(result.cropped).toBe(false);
    expect({ width: result.width, height: result.height }).toEqual({ width: 1920, height: 1080 });
  });

  it('keeps a PNG as PNG', async () => {
    const result = await cropToOrientation(await makeImage(1000, 600, 'png'), 'square');
    const meta = await sharp(result.buffer).metadata();
    expect(meta.format).toBe('png');
    expect({ w: meta.width, h: meta.height }).toEqual({ w: 600, h: 600 });
  });

  it('applies EXIF rotation before deciding the crop', async () => {
    // Stored 1600x900 but tagged "rotate 90°": a phone photo held upright.
    // Displayed it is 900x1600 — already 9:16, so it must not be cropped.
    const stored = await sharp(await makeImage(1600, 900)).withMetadata({ orientation: 6 }).jpeg().toBuffer();
    const result = await cropToOrientation(stored, 'portrait');
    expect(result.cropped).toBe(false);
    expect({ width: result.width, height: result.height }).toEqual({ width: 900, height: 1600 });
  });

  it('throws on bytes that are not an image', async () => {
    await expect(cropToOrientation(Buffer.from('fake-photo'), 'portrait')).rejects.toThrow();
  });

  it('throws on an unknown orientation', async () => {
    await expect(cropToOrientation(await makeImage(100, 100), 'diagonal')).rejects.toThrow(/Unknown orientation/);
  });
});

describe('BL-43 — composeWithSourceImage uploads the cropped photo', () => {
  const validPhotoName = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg';
  let service: IdeogramService;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.IDEOGRAM_API_KEY = 'test-key-bl43';
    service = new IdeogramService();
    (axios.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { data: [{ url: 'https://cdn.example.com/remix.jpg' }] },
    });
  });

  async function uploadedImage(appendSpy: ReturnType<typeof vi.spyOn>): Promise<Buffer> {
    const call = appendSpy.mock.calls.find(([key]: unknown[]) => key === 'image');
    expect(call).toBeDefined();
    return Buffer.from(await (call![1] as Blob).arrayBuffer());
  }

  it('sends a portrait-shaped photo when portrait is requested from a landscape source', async () => {
    (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(await makeImage(2560, 1440));
    const appendSpy = vi.spyOn(FormData.prototype, 'append');

    await service.composeWithSourceImage('Design', validPhotoName, 'ideogram-4', 'portrait', 'gen-bl43-a');

    const meta = await sharp(await uploadedImage(appendSpy)).metadata();
    expect(meta.height).toBe(1440);
    expect(meta.width).toBe(810); // 1440 * 9 / 16
    // BL-42 still holds: image_weight, never resolution.
    const keys = appendSpy.mock.calls.map(([key]: unknown[]) => key);
    expect(keys).toContain('image_weight');
    expect(keys).not.toContain('resolution');
  });

  it('falls back to the original photo when it cannot be cropped, and still generates', async () => {
    const original = Buffer.from('fake-photo');
    (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(original);
    const appendSpy = vi.spyOn(FormData.prototype, 'append');

    const url = await service.composeWithSourceImage('Design', validPhotoName, 'ideogram-4', 'portrait', 'gen-bl43-b');

    expect(url).toBe('https://cdn.example.com/remix.jpg');
    expect((await uploadedImage(appendSpy)).equals(original)).toBe(true);
  });

  it('treats a missing orientation as landscape', async () => {
    (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(await makeImage(1000, 1000));
    const appendSpy = vi.spyOn(FormData.prototype, 'append');

    await service.composeWithSourceImage('Design', validPhotoName, 'ideogram-4', undefined, 'gen-bl43-c');

    const meta = await sharp(await uploadedImage(appendSpy)).metadata();
    expect({ w: meta.width, h: meta.height }).toEqual({ w: 1000, h: 563 });
  });
});
