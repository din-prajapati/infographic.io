import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { useCanvasStore } from '../../../hooks/useCanvasStore';
import { useV3ListingStore } from '../../../hooks/useV3ListingWorkflow';
import { captureCanvasData } from '../../../lib/canvasState';
import { exportCanvasToImage } from '../../../lib/canvasExport';
import { exportRevision, overflowingV3TextIds, prepareReviewedPng, reviewV3Export } from '../../../lib/v3ExportReview';
import './v3-export-review.css';

export function V3ExportReview({ title, onClose }: { title: string; onClose: () => void }) {
  useCanvasStore(state => state.elements);
  useCanvasStore(state => state.canvasWidth);
  useCanvasStore(state => state.canvasHeight);
  useCanvasStore(state => state.backgroundColor);
  useCanvasStore(state => state.backgroundPaint);
  useV3ListingStore(state => state.snapshot);
  const doc = captureCanvasData();
  const revision = exportRevision(doc);
  const findings = reviewV3Export(doc, overflowingV3TextIds());
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => { setAccepted(false); setMessage(''); }, [revision]);
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
      <DialogHeader><DialogTitle>Review &amp; export</DialogTitle><DialogDescription id="v3-export-description">Check the artwork, property facts, photos and contact details before sharing.</DialogDescription></DialogHeader>
      <p>PNG · {doc.canvasWidth} × {doc.canvasHeight} px · {title}</p>
      {findings.length ? <section aria-label="Export findings"><h3>Resolve before downloading</h3><ul>{findings.map((finding, index) => <li key={`${finding.code}:${finding.elementId ?? index}`}>{finding.message}</li>)}</ul></section> : <p role="status">Automated checks passed. Review the artwork on the canvas before continuing.</p>}
      <label className="v3-review-check"><input type="checkbox" checked={accepted} disabled={busy || !!findings.length} onChange={event => setAccepted(event.target.checked)} />I reviewed this design, its facts and photos.</label>
      {message && <p role={message === 'PNG downloaded.' ? 'status' : 'alert'}>{message}</p>}
      <div className="v3-review-actions"><button type="button" onClick={onClose}>Back to design</button><button type="button" disabled={!accepted || busy || !!findings.length} onClick={() => void download()}>{busy ? 'Preparing PNG…' : 'Download PNG'}</button></div>
    </DialogContent>
  </Dialog>;
}
