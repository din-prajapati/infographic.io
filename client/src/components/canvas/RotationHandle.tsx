import React, { useEffect, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import type { CanvasElement } from '../../lib/canvasTypes';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import { normalizedAngle, pointerRotation } from '../../lib/elementStyles';

/** Mounted in the unscaled artboard wrapper so the handle stays 32 screen px. */
export function RotationHandle({ element,onPreview }: { element: CanvasElement;onPreview?:(id:string,rotation:number|null)=>void }) {
  const zoom = useCanvasStore(state => state.zoom);
  const [draft, setDraft] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(Math.round(element.rotation)));
  const drag = useRef<{ id: number; x: number; y: number; start: number; pointer: number; node: HTMLElement | null; angle: number; moved: boolean } | null>(null);
  const angle = draft ?? element.rotation;
  const radians = angle * Math.PI / 180;
  const distance = element.width * zoom / 2 + 26;
  const left = (element.x + element.width / 2) * zoom + Math.cos(radians) * distance;
  const top = (element.y + element.height / 2) * zoom + Math.sin(radians) * distance;

  const clear = () => {
    drag.current?.node?.style.removeProperty('--element-rotation-preview');
    drag.current = null;
    setDraft(null);onPreview?.(element.id,null);
  };
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { clear(); setOpen(false); const live = useCanvasStore.getState().elements.find(item => item.id === element.id); setValue(String(Math.round(live?.rotation ?? element.rotation))); } };
    window.addEventListener('keydown', escape);
    return () => { window.removeEventListener('keydown', escape); drag.current?.node?.style.removeProperty('--element-rotation-preview'); drag.current = null;onPreview?.(element.id,null); };
  }, [element.id,onPreview]);
  useEffect(() => { setValue(String(Math.round(element.rotation))); }, [element.rotation, element.id]);

  function commit(rotation: number) {
    const state = useCanvasStore.getState();
    const live = state.elements.find(el => el.id === element.id);
    if (!live || live.locked || !live.visible || state.selectedElementIds.length !== 1 || state.selectedElementIds[0] !== live.id) return;
    const next = normalizedAngle(rotation);
    if (next !== live.rotation) state.updateElement(live.id, { rotation: next });
  }
  if (element.type === 'line' || element.locked || !element.visible) return null;
  return <div className="v3-rotation-anchor" style={{ position: 'absolute', left, top, zIndex: 11 }} onClick={event => event.stopPropagation()}>
    <button type="button" aria-label="Rotate element" title="Drag to rotate · click for angle" className="v3-rotation-handle"
      style={{ width: 32, height: 32, padding: 6, borderRadius: '50%', transform: 'translate(-50%, -50%)', background: 'var(--v3-surface, #fff)', color: 'var(--v3-accent, #076b6c)', border: '1px solid var(--v3-border, #d9e0e6)', boxShadow: 'var(--v3-shadow)', touchAction: 'none' }}
      onPointerDown={event => {
        if (event.button !== 0) return;
        event.stopPropagation(); event.preventDefault();
        const wrap = event.currentTarget.closest('.v3-artboard-wrap')?.getBoundingClientRect();
        if (!wrap) return;
        const x = wrap.left + (element.x + element.width / 2) * zoom;
        const y = wrap.top + (element.y + element.height / 2) * zoom;
        const node = Array.from(document.querySelectorAll<HTMLElement>('[data-element-id]')).find(el => el.dataset.elementId === element.id) ?? null;
        drag.current = { id: event.pointerId, x, y, start: element.rotation, pointer: Math.atan2(event.clientY - y, event.clientX - x), node, angle: element.rotation, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        const gesture = drag.current;
        if (!gesture || gesture.id !== event.pointerId) return;
        const delta = Math.atan2(event.clientY - gesture.y, event.clientX - gesture.x) - gesture.pointer;
        if (Math.abs(delta) > 0.01) gesture.moved = true;
        gesture.angle = pointerRotation(gesture.start, delta, event.shiftKey);
        gesture.node?.style.setProperty('--element-rotation-preview', `${gesture.angle}deg`);
        setDraft(gesture.angle);onPreview?.(element.id,gesture.angle);
      }}
      onPointerUp={event => {
        const gesture = drag.current;
        if (!gesture || gesture.id !== event.pointerId) return;
        if (gesture.moved) commit(gesture.angle); else { setValue(String(Math.round(element.rotation))); setOpen(value => !value); }
        clear();
      }} onPointerCancel={clear} onLostPointerCapture={clear}
      onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setValue(String(Math.round(element.rotation))); setOpen(value => !value); } }}><RotateCw size={18}/></button>
    {draft !== null && <output className="v3-rotation-angle" style={{ position: 'absolute', top: 20, left: -20, background: 'var(--v3-surface)', padding: 4, borderRadius: 6 }}>{Math.round(draft)}°</output>}
    {open && <form className="v3-popover" aria-label="Rotation angle" style={{ top: 22, right: -16, width: 170 }} onSubmit={event => { event.preventDefault(); const next = Number(value); if (value.trim() && Number.isFinite(next)) { commit(next); setOpen(false); } }}>
      <label>Angle<input aria-label="Rotation degrees" type="number" value={value} onChange={event => setValue(event.target.value)}/></label><button type="submit">Apply angle</button>
    </form>}
  </div>;
}
