import React, { useState } from 'react';
import { Check, Search } from 'lucide-react';
import type { CanvasElement, ShapeElement } from '../../../lib/canvasTypes';
import { createCatalogShape, findShapes, getCatalogShapeId, replacementShapePatch, type CatalogShape } from '../../../lib/shapeCatalog';
import { getArrowLeftPath, getArrowRightPath, getSpeechBubblePath, getStarPath, getTrianglePath } from '../../../lib/shapeRenderers';
import './v3-shape-library.css';

interface V3ShapeLibraryProps {
  onInsert: (elements: CanvasElement[]) => void;
  replaceElement?: ShapeElement;
  onReplace?: (patch: Partial<ShapeElement>) => void;
}

function ShapeThumbnail({ entry }: { entry: CatalogShape }) {
  const width = 64, height = entry.shapeType === 'ellipse' || entry.id === 'capsule' ? 40 : 56;
  const path = entry.shapeType === 'triangle' ? getTrianglePath(width, height)
    : entry.shapeType === 'star' ? getStarPath(width, height)
    : entry.shapeType === 'speechBubble' ? getSpeechBubblePath(width, height, 8)
    : entry.shapeType === 'arrowLeft' ? getArrowLeftPath(width, height)
    : entry.shapeType === 'arrowRight' ? getArrowRightPath(width, height) : undefined;
  return <svg data-artwork-svg="true" aria-hidden="true" viewBox="-5 -5 74 82" fill="currentColor">
    {path ? <path d={path} /> : entry.shapeType === 'circle' || entry.shapeType === 'ellipse'
      ? <ellipse cx={width / 2} cy={height / 2} rx={entry.shapeType === 'circle' ? 28 : width / 2} ry={height / 2} />
      : <rect width={width} height={height} rx={entry.id === 'capsule' ? height / 2 : entry.cornerRadius ? 8 : 0} />}
  </svg>;
}

export function V3ShapeLibrary({ onInsert, replaceElement, onReplace }: V3ShapeLibraryProps) {
  const [query, setQuery] = useState('');
  const matches = findShapes(query);
  const current = replaceElement ? getCatalogShapeId(replaceElement) : null;
  const eligible = !replaceElement || (replaceElement.visible && !replaceElement.locked && !!onReplace);
  function choose(id: string) {
    if (replaceElement) {
      const patch = replacementShapePatch(id, replaceElement);
      if (patch) onReplace?.(patch);
    } else {
      const element = createCatalogShape(id);
      if (element) onInsert([element]);
    }
  }
  return <div className="v3-shape-library">
    <p className="v3-shape-mode">{replaceElement ? 'Replace shape' : 'Insert shape'}</p>
    <label className="v3-shape-search"><Search aria-hidden="true" /><input type="search" aria-label="Search shapes" placeholder="Search shapes" value={query} onChange={event => setQuery(event.target.value)} /></label>
    {(['Basic shapes', 'Arrows', 'Stars & callouts'] as const).map(category => {
      const entries = matches.filter(entry => entry.category === category);
      return entries.length ? <section key={category} aria-label={category}><h3>{category}</h3><div className="v3-shape-grid">
        {entries.map(entry => <button type="button" key={entry.id} aria-label={`${replaceElement ? 'Replace with' : 'Insert'} ${entry.label}`}
          aria-pressed={current === entry.id} disabled={!eligible} onClick={() => choose(entry.id)}>
          <span className="v3-shape-art"><ShapeThumbnail entry={entry} />{current === entry.id && <Check className="v3-shape-check" aria-hidden="true" />}</span>
          <span>{entry.label}</span>
        </button>)}
      </div></section> : null;
    })}
    {!matches.length && <p role="status">No shapes found.</p>}
  </div>;
}
