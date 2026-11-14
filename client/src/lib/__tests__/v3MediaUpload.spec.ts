import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../v3ElementEditing', () => ({ readReplacementImage: vi.fn(async (file: File) => ({ src: 'data:image/png;base64,AAAA', name: file.name })) }));
import { uploadV3Image } from '../v3MediaUpload';

class LoadedImage { naturalWidth = 640; naturalHeight = 480; onload?: () => void; onerror?: () => void; set src(_value: string) { queueMicrotask(() => this.onload?.()); } }
const png = (size = 10) => new File([new Uint8Array(size)], 'hero.png', { type: 'image/png' });
const reply = (status: number, body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
beforeEach(() => { vi.stubGlobal('Image', LoadedImage); localStorage.setItem('auth_token', 'token-a'); });
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });

describe('uploadV3Image (R2 media storage)', () => {
  // Contract: a valid image is posted as multipart with the bearer token and only the returned https URL is used.
  it('uploads to /media and returns the public R2 URL', async () => {
    const request = reply(201, { url: 'https://media.example.test/design-media/org-a/1.png' });
    const result = await uploadV3Image(png(), request as unknown as typeof fetch);
    expect(result).toEqual({ src: 'https://media.example.test/design-media/org-a/1.png', name: 'hero.png', width: 640, height: 480 });
    const [url, init] = request.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/api\/v1\/media$/);
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token-a');
    expect((init.body as FormData).get('file')).toBeInstanceOf(File);
  });
  // Contract: unsupported types and files above 10 MB never make a request.
  it('rejects unsupported and oversized files locally', async () => {
    const request = reply(201, {});
    await expect(uploadV3Image(new File(['x'], 'a.svg', { type: 'image/svg+xml' }), request as unknown as typeof fetch)).rejects.toThrow('JPEG, PNG');
    await expect(uploadV3Image(png(10 * 1024 * 1024 + 1), request as unknown as typeof fetch)).rejects.toThrow('10 MB');
    expect(request).not.toHaveBeenCalled();
  });
  // Contract: server failures surface a retryable message and never fall back to an inline data URL.
  it('surfaces storage failures without a data-URL fallback', async () => {
    await expect(uploadV3Image(png(), reply(503, { message: 'Image storage is unavailable. Your design is unchanged; retry the upload.' }) as unknown as typeof fetch)).rejects.toThrow('retry the upload');
    await expect(uploadV3Image(png(), reply(401, {}) as unknown as typeof fetch)).rejects.toThrow('Sign in again');
    await expect(uploadV3Image(png(), reply(201, { url: 'data:image/png;base64,AAAA' }) as unknown as typeof fetch)).rejects.toThrow('invalid address');
  });
});
