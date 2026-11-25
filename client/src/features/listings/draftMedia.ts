import { useEffect, useRef, useState } from 'react';
import type { ListingProfile, ListingRecord } from '@shared/listingWorkflow';
import { readReplacementImage } from '@/lib/v3ElementEditing';
import { V3_MEDIA_MAX_BYTES } from '@/lib/v3MediaUpload';

export type IdentityOrListing = ListingRecord | ListingProfile['record'];
export interface DraftFile { src: string; file: File }

/** Only media fields are transformed; pasted text and property facts are never rewritten. */
export function mapListingMedia<T extends IdentityOrListing>(record: T, map: (src: string) => string): T {
  const next = structuredClone(record);
  next.agent.photo = map(next.agent.photo);
  next.brand.logo = map(next.brand.logo);
  if ('photos' in next) next.photos = next.photos.map(photo => ({ ...photo, src: map(photo.src) }));
  return next;
}

/** Blob previews are local-only. The API still validates durable URLs after storing the files. */
export function validationRecord<T extends IdentityOrListing>(record: T): T {
  return mapListingMedia(record, src => src.startsWith('blob:') ? 'https://draft.invalid/image' : src);
}

export function listingSaveBody(payload: { record: IdentityOrListing; expectedVersion?: number }, files: DraftFile[] = []): BodyInit {
  const used: { id: string; file: File }[] = [];
  const record = mapListingMedia(payload.record, src => {
    if (!src.startsWith('blob:')) return src;
    const file = files.find(item => item.src === src)?.file;
    if (!file) throw new Error('This image preview is no longer available. Choose the image again.');
    const id = `media-${used.length}`;
    used.push({ id, file });
    return `draft:${id}`;
  });
  if (!used.length) return JSON.stringify({ ...payload, record });
  const form = new FormData();
  form.append('payload', JSON.stringify({ ...payload, record }));
  for (const { id, file } of used) form.append(id, file, file.name);
  return form;
}

/** Selecting/replacing/removing/cancelling an image performs no storage writes. */
export class DraftMedia {
  files: DraftFile[] = [];
  private epoch = 0;
  pending = 0;
  constructor(private changed: () => void = () => {}) {}
  async stage(file: File): Promise<{ src: string; name: string } | null> {
    if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(file.type)) throw new Error('Choose a JPEG, PNG, WebP, GIF or AVIF image.');
    if (file.size > V3_MEDIA_MAX_BYTES) throw new Error('Choose an image smaller than 10 MB.');
    const epoch = this.epoch;
    this.pending++; this.changed();
    try {
      await readReplacementImage(file);
      if (epoch !== this.epoch) return null;
      const src = URL.createObjectURL(file);
      this.files.push({ src, file });
      return { src, name: file.name };
    } finally { this.pending--; this.changed(); }
  }
  clear() {
    this.epoch++;
    for (const { src } of this.files) URL.revokeObjectURL(src);
    this.files = [];
  }
}

export function useDraftMedia() {
  const [, render] = useState(0);
  const media = useRef<DraftMedia>();
  if (!media.current) media.current = new DraftMedia(() => render(value => value + 1));
  useEffect(() => () => media.current?.clear(), []);
  return media.current;
}
