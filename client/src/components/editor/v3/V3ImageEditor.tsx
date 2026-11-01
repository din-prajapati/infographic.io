import React, { useEffect, useState } from 'react';
import { ArrowLeft, RotateCcw, Sun, Contrast, Droplet } from 'lucide-react';
import type { ImageElement } from '../../../lib/canvasTypes';
import { commitElementPatch, storedToImageAdjustment } from '../../../lib/v3ElementEditing';
import { NumericControl } from './V3ElementToolbar';

export function V3ImageEditor({ element, onBack }: { element: ImageElement; onBack: () => void }) {
  const [filters, setFilters] = useState(element.filters);
  useEffect(() => setFilters(element.filters), [element.id, element.filters]);
  useEffect(() => {
    const target = Array.from(document.querySelectorAll<HTMLElement>('[data-element-id]')).find(node => node.dataset.elementId === element.id);
    target?.style.setProperty('--element-filter-preview', `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`);
    return () => { target?.style.removeProperty('--element-filter-preview'); };
  }, [element.id, filters]);
  return <section className="v3-image-editor" aria-label="Edit image panel">
    <header><button type="button" aria-label="Back from image editing" onClick={onBack}><ArrowLeft/>Back</button><h2>Edit image</h2></header>
    <div className="v3-image-editor-preview"><img src={element.src} alt={`Preview of ${element.name}`} style={{ filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`, transform: `scaleX(${element.flipHorizontal ? -1 : 1}) scaleY(${element.flipVertical ? -1 : 1})`, opacity: element.opacity, borderRadius: element.cornerRadius }}/></div>
    <h3>Adjustments</h3><p>Changes preview here while you adjust. Release or confirm a value to apply it to the canvas.</p>
    <fieldset disabled={element.locked}>
      {(['brightness','contrast','saturation'] as const).map(filter => <NumericControl key={`${element.id}:${filter}`} label={filter[0].toUpperCase() + filter.slice(1)} min={-100} max={100} value={storedToImageAdjustment(element.filters[filter])}
        icon={filter==='brightness'?<Sun aria-hidden="true"/>:filter==='contrast'?<Contrast aria-hidden="true"/>:<Droplet aria-hidden="true"/>}
        onDraft={value => setFilters(previous => ({ ...previous, [filter]: value + 100 }))}
        onCommit={value => commitElementPatch(element.id, { filters: { ...element.filters, [filter]: value + 100 } })}/>)}
      <button type="button" onClick={() => { const neutral = { brightness: 100, contrast: 100, saturation: 100 }; setFilters(neutral); commitElementPatch(element.id, { filters: neutral }); }}><RotateCcw/>Reset adjustments</button>
    </fieldset>
  </section>;
}
