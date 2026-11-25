import { getApiUrl } from './api';
import { readReplacementImage } from './v3ElementEditing';

export const V3_MEDIA_MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = /^image\/(jpeg|png|webp|gif|avif)$/;

export interface UploadedV3Image { src: string; name: string; width: number; height: number }

/**
 * Stores an image placed in a V3 design/template/listing in the Cloudflare R2 bucket (POST /api/v1/media) and
 * returns its public https URL, so records never embed base64 image data. The file is decoded locally first, so a
 * corrupt or non-image file is rejected before any network request. Never falls back to an inline data URL.
 */
export async function uploadV3Image(file: File, request: typeof fetch = fetch): Promise<UploadedV3Image> {
  if (!ACCEPTED.test(file.type)) throw new Error('Choose a JPEG, PNG, WebP, GIF or AVIF image.');
  if (file.size > V3_MEDIA_MAX_BYTES) throw new Error('Choose an image smaller than 10 MB.');
  const local = await readReplacementImage(file);
  const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error('This image could not be opened. Choose another image to retry.'));
    image.src = local.src;
  });
  const form = new FormData();
  form.append('file', file, file.name);
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
  let response: Response;
  try {
    response = await request(getApiUrl('/media'), { method: 'POST', body: form, headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(60_000) : undefined });
  } catch {
    throw new Error('Image upload failed or timed out. Check your connection and retry.');
  }
  const body = await response.json().catch(() => ({}));
  if (response.status === 401) throw new Error('Your session expired. Sign in again to upload images.');
  if (!response.ok) throw new Error(typeof body?.message === 'string' ? body.message : 'Image upload failed. Retry the upload.');
  if (typeof body?.url !== 'string' || !/^https:\/\//.test(body.url)) throw new Error('Image storage returned an invalid address. Retry the upload.');
  return { src: body.url, name: file.name, width, height };
}
