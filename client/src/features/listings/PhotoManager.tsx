import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Link2, Plus, RotateCcw, Upload, X } from 'lucide-react';
import type { ListingRecord } from '@shared/listingWorkflow';
import { MAX_PHOTOS, movePhoto } from './listingFormat';

type Photo = ListingRecord['photos'][number];
interface Upload { key: string; name: string; status: 'uploading' | 'failed'; error?: string; file: File }
const newId = () => `photo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Property photographs (rev-2 spec §5; layout per design.md §8 "Photos & ranking"). Local previews stay in the draft. Save uploads files together with the record and stores HTTPS URLs only. Order is the gallery order only — it does not change which image a
 * design uses (V3 assigns images explicitly). Removing a saved photo removes its reference only; saved designs may still use its file. The page owns Save / Cancel.
 */
export function PhotoManager({ photos, onChange, stage, disabled }: { stage: (file: File) => Promise<{ src: string; name: string } | null>; disabled: boolean; photos: Photo[]; onChange: (update: (current: Photo[]) => Photo[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const latest = useRef(photos);
  latest.current = photos;
  const remaining = MAX_PHOTOS - photos.length - uploads.filter(upload => upload.status === 'uploading').length;

  async function upload(file: File, key = newId()) {
    setUploads(current => [...current.filter(item => item.key !== key), { key, name: file.name, status: 'uploading', file }]);
    try {
      const image = await stage(file);
      if (!image) { setUploads(current => current.filter(item => item.key !== key)); return; }
      if (latest.current.length >= MAX_PHOTOS) throw new Error(`A property can have up to ${MAX_PHOTOS} photos.`);
      onChange(current => current.length >= MAX_PHOTOS ? current : [...current, { id: key, name: image.name.slice(0, 200), src: image.src }]);
      setUploads(current => current.filter(item => item.key !== key));
    } catch (error) {
      setUploads(current => current.map(item => item.key === key ? { ...item, status: 'failed', error: error instanceof Error ? error.message : 'Upload failed. Retry the upload.' } : item));
    }
  }
  function choose(files: FileList | null) {
    if (!files || disabled) return;
    const list = Array.from(files);
    const accepted = list.slice(0, Math.max(0, remaining));
    for (const file of accepted) void upload(file);
    if (list.length > accepted.length) {
      for (const file of list.slice(accepted.length)) setUploads(current => [...current, { key: newId(), name: file.name, status: 'failed', file, error: `Not added: a property can have up to ${MAX_PHOTOS} photos.` }]);
    }
    if (input.current) input.current.value = '';
  }
  const pick = () => input.current?.click();

  return (
    <div>
      <div className="ws-section-heading">
        <div><h2>The right photograph. In the right place.</h2><p className="ws-subtitle">{photos.length} of {MAX_PHOTOS} photos · JPEG, PNG, WebP, GIF or AVIF up to 10 MB.</p></div>
        <button type="button" className="ws-btn ws-btn-primary" disabled={disabled || remaining <= 0} onClick={pick}><Upload aria-hidden="true" />Add photos</button>
      </div>
      <input ref={input} disabled={disabled} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple hidden aria-label="Add property photos" onChange={event => choose(event.target.files)} />
      <div className="ws-help-panel">
        <strong><Link2 aria-hidden="true" />How photo order works</strong>
        Order sets the gallery for this listing. In the editor you still choose which photo goes in each image frame, so reordering here never swaps images in an existing design.
      </div>
      {uploads.length > 0 && (
        <ul className="lst-upload-list" aria-live="polite">
          {uploads.map(item => (
            <li key={item.key} className={item.status === 'failed' ? 'ws-alert ws-alert-error' : 'ws-alert ws-alert-warn'}>
              <span><strong>{item.name}</strong> — {item.status === 'uploading' ? 'Uploading…' : item.error}</span>
              {item.status === 'failed' && (
                <span className="lst-row">
                  {!item.error?.startsWith('Not added') && <button type="button" className="ws-btn ws-btn-small" onClick={() => void upload(item.file, item.key)}><RotateCcw aria-hidden="true" />Retry</button>}
                  <button type="button" className="ws-btn ws-btn-small ws-btn-subtle" onClick={() => setUploads(current => current.filter(other => other.key !== item.key))}>Dismiss</button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {photos.length > 0 && (
        <ol className="lst-photo-grid" aria-label="Property photos in gallery order">
          {photos.map((photo, index) => (
            <li key={photo.id} className="ws-panel lst-photo-card">
              <img src={photo.src} alt={photo.name || `Photo ${index + 1}`} loading="lazy" />
              <div className="lst-photo-caption">
                <strong title={photo.name}>{photo.name || `Photo ${index + 1}`}</strong>
                <small>{index === 0 ? 'Cover photograph' : 'Gallery photograph'}</small>
                <div className="lst-photo-actions">
                  <span className="lst-rank-tag">#{index + 1}</span>
                  <button type="button" className="ws-icon-button" aria-label={`Move photo ${index + 1} up`} disabled={disabled || index === 0} onClick={() => onChange(current => movePhoto(current, index, -1))}><ArrowUp aria-hidden="true" /></button>
                  <button type="button" className="ws-icon-button" aria-label={`Move photo ${index + 1} down`} disabled={disabled || index === photos.length - 1} onClick={() => onChange(current => movePhoto(current, index, 1))}><ArrowDown aria-hidden="true" /></button>
                  <button type="button" className="ws-icon-button ws-btn-danger" aria-label={`Remove photo ${index + 1}`} disabled={disabled} onClick={() => onChange(current => current.filter(other => other.id !== photo.id))}><X aria-hidden="true" /></button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="lst-upload-zone">
        <ImagePlus aria-hidden="true" />
        <h3>{photos.length ? 'Add the next property photograph.' : 'No property photos yet'}</h3>
        <p>New photographs upload only when you save changes. Agent portraits and brand logos are managed separately in Agent &amp; brand.</p>
        <button type="button" className="ws-btn" disabled={disabled || remaining <= 0} onClick={pick}><Plus aria-hidden="true" />Choose photographs</button>
      </div>
    </div>
  );
}
