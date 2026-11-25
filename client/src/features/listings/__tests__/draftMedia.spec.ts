import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/v3ElementEditing', () => ({ readReplacementImage: vi.fn(async () => ({ src: 'data:image/png;base64,AAAA' })) }));
import { readReplacementImage } from '@/lib/v3ElementEditing';
import { createEmptyListing } from '@shared/listingWorkflow';
import { DraftMedia, listingSaveBody } from '../draftMedia';

afterEach(() => vi.unstubAllGlobals());
const file = () => new File(['image'], 'front.png', { type: 'image/png' });

describe('local draft media', () => {
  it('performs no network upload and revokes previews on Cancel/discard', async () => {
    const request = vi.fn(); vi.stubGlobal('fetch', request);
    const revoke = vi.fn(); vi.stubGlobal('URL', { createObjectURL: () => 'blob:local-preview', revokeObjectURL: revoke });
    const media = new DraftMedia();
    expect(await media.stage(file())).toEqual({ src: 'blob:local-preview', name: 'front.png' });
    media.clear();
    expect(request).not.toHaveBeenCalled(); expect(revoke).toHaveBeenCalledWith('blob:local-preview'); expect(media.files).toEqual([]);
  });
  it('does not restore a late image after the draft was cancelled', async () => {
    let finish!: () => void;
    vi.mocked(readReplacementImage).mockImplementationOnce(() => new Promise(resolve => { finish = () => resolve({ src: 'data:image/png;base64,AAAA', name: 'front.png' }); }));
    const media = new DraftMedia(); const pending = media.stage(file()); media.clear(); finish();
    expect(await pending).toBeNull(); expect(media.files).toEqual([]);
  });
  it('sends only images still referenced by the draft, and never blob URLs or base64', () => {
    const record = createEmptyListing(); record.photos = [{ id: 'a', name: 'Front', src: 'blob:keep' }]; record.property.description = 'blob:keep';
    const body = listingSaveBody({ record, expectedVersion: 3 }, [{ src: 'blob:keep', file: file() }, { src: 'blob:removed', file: file() }]) as FormData;
    const payload = JSON.parse(body.get('payload') as string);
    expect(payload.expectedVersion).toBe(3); expect(payload.record.photos[0].src).toBe('draft:media-0'); expect(payload.record.property.description).toBe('blob:keep');
    expect([...body.keys()]).toEqual(['payload', 'media-0']);
  });
  it('retains JSON for unchanged/saved media and rejects unavailable local files', () => {
    const record = createEmptyListing(); record.brand.logo = 'https://media.example.test/saved.png';
    expect(JSON.parse(listingSaveBody({ record }) as string).record.brand.logo).toBe(record.brand.logo);
    record.brand.logo = 'blob:missing';
    expect(() => listingSaveBody({ record })).toThrow('Choose the image again');
  });
});
