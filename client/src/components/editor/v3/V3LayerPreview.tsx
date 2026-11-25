import React, { memo, useId, useState, type ReactNode } from 'react';
import type { CanvasElement, ImageElement, LineElement, ShapeElement, TextElement } from '../../../lib/canvasTypes';
import { finiteClamp, strokeDash } from '../../../lib/elementStyles';
import { getElementPaint, paintDecorationColor, paintToCss } from '../../../lib/paint';
import { lineDecorations, linePath } from '../../../lib/lineGeometry';
import { getArrowLeftPath, getArrowRightPath, getSpeechBubblePath, getStarPath, getTrianglePath } from '../../../lib/shapeRenderers';
import { shapeEffectFilter, shapeEffectPadding, shapeEffectShadows } from '../../../lib/shapeEffects';
import { formatTextContent, textLetterSpacingPx } from '../../../lib/textLayout';
import { PaintSvg, svgPaint } from '../../canvas/PaintSvg';

function PreviewFrame({ element, children, fallback }: { element: CanvasElement; children?: ReactNode; fallback?: string }) {
  const w = Math.max(1, element.width), h = Math.max(1, element.height);
  const radians = element.rotation * Math.PI / 180;
  const padding = element.type === 'shape' ? shapeEffectPadding(element)
    : element.type === 'line' ? Math.max(element.strokeWidth * 3, 8) : element.type === 'image' ? element.borderWidth ?? 0 : 0;
  const extraTail = element.type === 'shape' && element.shapeType === 'speechBubble' ? 15 : 0;
  const rotatedW = Math.abs(Math.cos(radians)) * w + Math.abs(Math.sin(radians)) * (h + extraTail) + padding * 2;
  const rotatedH = Math.abs(Math.sin(radians)) * w + Math.abs(Math.cos(radians)) * (h + extraTail) + padding * 2;
  const scale = Math.min(90 / rotatedW, 34 / rotatedH);
  return <span className="v3-layer-preview" role="img" aria-label={`${element.name || element.type} preview${fallback ? `: ${fallback}` : ''}`}>
    <span className="v3-layer-preview-art" aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '50%', width: w, height: h,
      transform: `translate(-50%, -50%) scale(${scale}) rotate(${element.rotation}deg)`, transformOrigin: 'center', opacity: element.opacity,
      pointerEvents: 'none' }}>{children}</span>
    {fallback && <span className="v3-layer-preview-fallback" aria-hidden="true">{fallback}</span>}
  </span>;
}

function TextArtwork({ element }: { element: TextElement }) {
  const paint = getElementPaint(element, 'color');
  const gradient = paint.type === 'linear' || paint.type === 'radial';
  return <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', padding: '4px 0', display: 'flex', flexDirection: 'column',
    justifyContent: element.textAnchor === 'middle' ? 'safe center' : element.textAnchor === 'end' ? 'safe flex-end' : 'flex-start',
    ...(gradient ? { backgroundImage: paintToCss(paint, 'transparent', element), backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : {}) }}>
    <div data-preview-text="true" style={{ fontFamily: element.fontFamily, fontSize: element.fontSize, fontWeight: element.bold ? 700 : element.fontWeight,
      fontStyle: element.italic ? 'italic' : 'normal', textDecoration: [element.underline && 'underline', element.strikethrough && 'line-through'].filter(Boolean).join(' ') || 'none',
      color: paintDecorationColor(paint), textDecorationColor: paintDecorationColor(paint), textAlign: element.align, lineHeight: element.lineHeight,
      letterSpacing: `${textLetterSpacingPx(element.fontSize, element.letterSpacing)}px`, whiteSpace: 'pre-wrap', overflowWrap: 'break-word',
      paddingRight: 8, paddingLeft: element.listStyle !== 'none' ? 24 : 8, flexShrink: 0 }}>{formatTextContent(element) || 'Double click to edit'}</div>
  </div>;
}

function ShapeArtwork({ element, id }: { element: ShapeElement; id: string }) {
  const { width: w, height: h } = element;
  const fill = getElementPaint(element, 'fill'), stroke = getElementPaint(element, 'stroke');
  const radius = Math.min(finiteClamp(element.cornerRadius, 0, 100), w / 2, h / 2);
  const rectangle = `M ${radius} 0 H ${w-radius} Q ${w} 0 ${w} ${radius} V ${h-radius} Q ${w} ${h} ${w-radius} ${h} H ${radius} Q 0 ${h} 0 ${h-radius} V ${radius} Q 0 0 ${radius} 0 Z`;
  const path = element.shapeType === 'triangle' ? getTrianglePath(w, h) : element.shapeType === 'star' ? getStarPath(w, h)
    : element.shapeType === 'speechBubble' ? getSpeechBubblePath(w, h, element.cornerRadius)
    : element.shapeType === 'arrowLeft' ? getArrowLeftPath(w, h) : element.shapeType === 'arrowRight' ? getArrowRightPath(w, h) : rectangle;
  const layered = !!element.shadowLayers?.length, shadows = shapeEffectShadows(element), pad = shapeEffectPadding(element);
  const style = element.textStyle ?? { fontFamily: 'Inter', fontSize: 16, fontWeight: 400, color: '#000000', align: 'center' };
  const shapeProps = { fill: svgPaint(fill, `${id}-fill`), stroke: svgPaint(stroke, `${id}-stroke`), strokeWidth: finiteClamp(element.strokeWidth, 0, 20),
    strokeDasharray: strokeDash(element.strokeStyle, element.strokeWidth).join(' '), strokeLinecap: element.strokeStyle === 'dotted' ? 'round' as const : 'butt' as const };
  return <svg data-artwork-svg="true" width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible', filter: shapeEffectFilter(element) }}>
    <PaintSvg paint={fill} id={`${id}-fill`} width={w} height={h}/><PaintSvg paint={stroke} id={`${id}-stroke`} width={w} height={h}/>
    {layered && <defs><filter id={`${id}-effect`} filterUnits="userSpaceOnUse" x={-pad} y={-pad} width={w+2*pad} height={h+2*pad} colorInterpolationFilters="sRGB">
      {shadows.map((shadow, index) => <React.Fragment key={index}>
        <feGaussianBlur in="SourceAlpha" stdDeviation={shadow.blur/2} result={`blur-${index}`}/><feOffset in={`blur-${index}`} dx={shadow.offsetX} dy={shadow.offsetY} result={`offset-${index}`}/>
        <feFlood floodColor={shadow.color} floodOpacity={shadow.opacity} result={`color-${index}`}/><feComposite in={`color-${index}`} in2={`offset-${index}`} operator="in" result={`shadow-${index}`}/>
      </React.Fragment>)}<feMerge>{shadows.map((_, index) => <feMergeNode key={index} in={`shadow-${index}`}/>)}<feMergeNode in="SourceGraphic"/></feMerge>
    </filter></defs>}
    <g filter={layered ? `url(#${id}-effect)` : undefined}>
      {element.shapeType === 'circle' || element.shapeType === 'ellipse'
        ? <ellipse data-preview-shape="true" cx={w/2} cy={h/2} rx={w/2} ry={h/2} {...shapeProps}/>
        : <path data-preview-shape="true" d={path} {...shapeProps}/>}
      {element.textContent && <text x={style.align === 'left' ? 8 : style.align === 'right' ? w-8 : w/2} y={h/2} dominantBaseline="middle"
        textAnchor={style.align === 'left' ? 'start' : style.align === 'right' ? 'end' : 'middle'} fontFamily={style.fontFamily} fontSize={style.fontSize} fontWeight={style.fontWeight} fill={style.color}>{element.textContent}</text>}
    </g>
  </svg>;
}

function LineArtwork({ element, id }: { element: LineElement; id: string }) {
  const paint = getElementPaint(element, 'stroke'), stroke = svgPaint(paint, id);
  const width = Math.max(1, element.width), height = Math.max(1, element.height);
  return <svg data-artwork-svg="true" width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
    <PaintSvg paint={paint} id={id} width={width} height={height}/>
    <path data-preview-line="true" d={linePath(element)} fill="none" stroke={stroke} strokeWidth={element.strokeWidth}
      strokeDasharray={strokeDash(element.strokeStyle, element.strokeWidth).join(' ')} strokeLinecap={element.lineCap ?? (element.strokeStyle === 'dotted' ? 'round' : 'butt')} strokeLinejoin="round"/>
    {lineDecorations(element).map((decoration, index) => {
      const point = (x: number, y: number) => `${decoration.tip.x+x*Math.cos(decoration.angle)-y*Math.sin(decoration.angle)} ${decoration.tip.y+x*Math.sin(decoration.angle)+y*Math.cos(decoration.angle)}`;
      const size = decoration.size;
      return decoration.kind === 'circle' ? <circle data-preview-decoration="true" key={index} cx={decoration.tip.x} cy={decoration.tip.y} r={size/2} fill={stroke}/>
        : <path data-preview-decoration="true" key={index} d={decoration.kind === 'bar' ? `M ${point(0,-size/2)} L ${point(0,size/2)}` : `M ${point(0,0)} L ${point(-size,-size/2)} L ${point(-size,size/2)} Z`}
          fill={decoration.kind === 'bar' ? 'none' : stroke} stroke={decoration.kind === 'bar' ? stroke : 'none'} strokeWidth={element.strokeWidth}/>;
    })}
  </svg>;
}

function ImagePreview({ element, id }: { element: ImageElement; id: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');
  const overlay = getElementPaint(element, 'overlay'), stroke = getElementPaint(element, 'stroke');
  const borderWidth = finiteClamp(element.borderWidth, 0, 20);
  const crop = !element.isAiImport ? element.crop : undefined;
  const hasCrop = crop && (crop.x !== 0 || crop.y !== 0 || crop.width !== element.width || crop.height !== element.height);
  return <PreviewFrame element={element} fallback={status === 'failed' ? 'Preview unavailable' : status === 'loading' ? 'Loading preview' : undefined}>
    {status !== 'failed' && <div data-preview-image-orientation="true" style={{ position: 'absolute', inset: 0, borderRadius: element.cornerRadius,
      transform: `scaleX(${element.flipHorizontal ? -1 : 1}) scaleY(${element.flipVertical ? -1 : 1})` }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: element.cornerRadius, overflow: 'hidden' }}>
        <img alt="" src={element.src} draggable={false} onLoad={() => setStatus('loaded')} onError={() => setStatus('failed')}
          style={{ width: hasCrop && crop ? element.width*element.width/crop.width : '100%', height: hasCrop && crop ? element.height*element.height/crop.height : '100%',
            position: 'absolute', inset: 0, objectFit: hasCrop ? 'cover' : element.objectFit ?? 'contain', objectPosition: 'center',
            ...(hasCrop && crop ? { transform: `translate(${-crop.x*element.width/crop.width}px, ${-crop.y*element.height/crop.height}px)` } : {}),
            filter: `brightness(${element.filters.brightness}%) contrast(${element.filters.contrast}%) saturate(${element.filters.saturation}%)` }}/>
        {overlay.type !== 'none' && <span data-preview-overlay="true" style={{ position: 'absolute', inset: 0, borderRadius: element.cornerRadius,
          background: paintToCss(overlay, 'transparent', element), mixBlendMode: 'multiply' }}/>}
      </div>
      {borderWidth > 0 && <svg data-artwork-svg="true" width="100%" height="100%" viewBox={`0 0 ${element.width} ${element.height}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <PaintSvg paint={stroke} id={id} width={element.width} height={element.height}/><rect width={element.width} height={element.height}
          rx={Math.min(element.cornerRadius, element.width/2, element.height/2)} fill="none" stroke={svgPaint(stroke, id)} strokeWidth={borderWidth}
          strokeDasharray={strokeDash(element.borderStyle, borderWidth).join(' ')} strokeLinecap={element.borderStyle === 'dotted' ? 'round' : 'butt'}/>
      </svg>}
    </div>}
  </PreviewFrame>;
}

export const V3LayerPreview = memo(function V3LayerPreview({ element }: { element: CanvasElement }) {
  const id = `layer-preview-${useId().replace(/:/g, '')}`;
  if (element.type === 'image') return <ImagePreview key={element.src} element={element} id={id}/>;
  return <PreviewFrame element={element}>
    {element.type === 'text' ? <TextArtwork element={element}/> : element.type === 'shape' ? <ShapeArtwork element={element} id={id}/> : <LineArtwork element={element} id={id}/>}
  </PreviewFrame>;
}, (previous, next) => {
  if (previous.element === next.element) return true;
  const ignored = new Set(['x', 'y', 'zIndex', 'locked', 'visible', 'slot', 'frameOf', 'slotFormat']);
  const before = previous.element as unknown as Record<string, unknown>;
  const after = next.element as unknown as Record<string, unknown>;
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].every(key => ignored.has(key) || before[key] === after[key]);
});
