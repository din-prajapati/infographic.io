import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { useCanvasStore } from '../../../hooks/useCanvasStore';
import { useV3ListingStore } from '../../../hooks/useV3ListingWorkflow';
import { captureCanvasData } from '../../../lib/canvasState';
import { exportCanvasToImage } from '../../../lib/canvasExport';
import { exportRevision, overflowingV3TextIds, prepareReviewedPng, reviewV3Export } from '../../../lib/v3ExportReview';
import { formatListingPrice } from '@shared/listingWorkflow';
import './v3-export-review.css';

export function V3ExportReview({ title, onClose }: { title: string; onClose: () => void }) {
  useCanvasStore(state => state.elements);
  useCanvasStore(state => state.canvasWidth);
  useCanvasStore(state => state.canvasHeight);
  useCanvasStore(state => state.backgroundColor);
  useCanvasStore(state => state.backgroundPaint);
  const listing = useV3ListingStore(state => state.snapshot);
  const doc = captureCanvasData();
  const revision = exportRevision(doc);
  const findings = reviewV3Export(doc, overflowingV3TextIds());
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => { setAccepted(false); setMessage(''); }, [revision]);
  // Preview uses the same renderer as the download, so editor chrome never appears in it.
  const [preview, setPreview] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let current = true;
    setPreview(undefined);
    const timer = window.setTimeout(() => {
      exportCanvasToImage('png', 1, 0.5).then(url => { if (current) setPreview(url); }, () => { if (current) setPreview(null); });
    }, 120);
    return () => { current = false; window.clearTimeout(timer); };
  }, [revision]);
  const applied = listing?.applied;
  const summary = applied ? [formatListingPrice(applied.property), applied.agent.name].filter(Boolean).join(' · ') : '';
  const listingName = applied ? applied.property.name || applied.property.address : '';
  async function download() {
    if (!accepted || busy || findings.length) return;
    setBusy(true); setMessage('');
    try {
      await document.fonts.ready;
      if (exportRevision(captureCanvasData()) !== revision) throw new Error('The design changed. Review it again before exporting.');
      const fresh = reviewV3Export(captureCanvasData(), overflowingV3TextIds());
      if (fresh.length) throw new Error(fresh.map(f => f.message).join(' '));
      const png = await prepareReviewedPng(revision, captureCanvasData, () => exportCanvasToImage('png', 1, 1));
      if (!alive.current) return;
      const link = document.createElement('a');
      link.href = png; link.download = `${title.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') || 'design'}.png`;
      document.body.append(link); link.click(); link.remove();
      setMessage('PNG downloaded.');
    } catch (error) {
      if (alive.current) { setAccepted(false); setMessage(error instanceof Error ? error.message : 'Export failed. Review the design and retry.'); }
    } finally { if (alive.current) setBusy(false); }
  }
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="v3-export-review" aria-describedby="v3-export-description">
      <DialogHeader className="v3-review-head"><span className="v3-review-eyebrow">Checked artwork · {doc.canvasWidth} × {doc.canvasHeight}</span><DialogTitle>Review &amp; export</DialogTitle><DialogDescription id="v3-export-description" className="sr-only">Check the artwork, property facts, photos and contact details before sharing.</DialogDescription></DialogHeader>
      <div className="v3-review-grid">
        <figure className="v3-review-art" aria-label="Artwork preview">{preview ? <img src={preview} alt={`Preview of ${title || 'design'}`} width={doc.canvasWidth} height={doc.canvasHeight} /> : <span role="status">{preview === null ? 'Preview unavailable. The canvas remains the source of truth.' : 'Preparing preview…'}</span>}</figure>
        <div className="v3-review-side">
          <h3>{listingName || title || 'Untitled design'}</h3>
          {summary && <p className="v3-review-meta">{summary}</p>}
          <p className="v3-review-meta">PNG · {doc.canvasWidth} × {doc.canvasHeight} px · {title}</p>
          {findings.length ? <section aria-label="Export findings" className="v3-review-findings"><h4>Resolve {findings.length} {findings.length === 1 ? 'check' : 'checks'} before download</h4><ul>{findings.map((finding, index) => <li key={`${finding.code}:${finding.elementId ?? index}`}>{finding.message}</li>)}</ul></section> : <p role="status" className="v3-review-pass">Automated checks passed. Review the artwork on the canvas before continuing.</p>}
          <label className="v3-review-check"><input type="checkbox" checked={accepted} disabled={busy || !!findings.length} onChange={event => setAccepted(event.target.checked)} />I reviewed the facts, photos and any custom values.</label>
          <p className="v3-review-meta">{accepted ? 'Reviewed. Ready to download.' : 'Awaiting review.'}</p>
          {message && <p role={message === 'PNG downloaded.' ? 'status' : 'alert'} className={message === 'PNG downloaded.' ? 'v3-review-pass' : 'v3-review-error'}>{message}</p>}
          <div className="v3-review-actions"><button type="button" disabled={!accepted || busy || !!findings.length} onClick={() => void download()}>{busy ? 'Preparing PNG…' : 'Download PNG'}</button><button type="button" onClick={onClose}>Back to design</button></div>
          <p className="v3-review-note">Downloads a local PNG file. Nothing is published or scheduled.</p>
        </div>
      </div>
    </DialogContent>
  </Dialog>;
}
