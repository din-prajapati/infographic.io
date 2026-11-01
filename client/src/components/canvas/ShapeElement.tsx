// Shape element component

import React from 'react';
import { Rnd } from 'react-rnd';
import { ShapeElement as ShapeElementType } from '../../lib/canvasTypes';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import { finiteClamp, shadowFilter, strokeDash } from '../../lib/elementStyles';
import {
  getTrianglePath,
  getStarPath,
  getSpeechBubblePath,
  getArrowLeftPath,
  getArrowRightPath,
} from '../../lib/shapeRenderers';

interface ShapeElementProps {
  element: ShapeElementType;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
}

export function ShapeElement({ element, isSelected, onSelect }: ShapeElementProps) {
  const updateElement = useCanvasStore((state) => state.updateElement);
  const zoom = useCanvasStore((state) => state.zoom);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(e);
  };

  if (!element.visible) return null;

  const handlePx = Math.max(6, Math.round(8 / zoom));
  const handleStyle = {
    width: handlePx,
    height: handlePx,
    background: '#ffffff',
    border: `${Math.max(1, Math.round(2 / zoom))}px solid #3b82f6`,
    borderRadius: Math.max(2, Math.round(3 / zoom)),
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    zIndex: 10,
  };

  const renderShape = () => {
    const w = element.width, h = element.height;
    const strokeWidth = finiteClamp(element.strokeWidth, 0, 20);
    const r = Math.min(finiteClamp(element.cornerRadius, 0, 100), w / 2, h / 2);
    const radiusPath = `M ${r} 0 H ${w-r} Q ${w} 0 ${w} ${r} V ${h-r} Q ${w} ${h} ${w-r} ${h} H ${r} Q 0 ${h} 0 ${h-r} V ${r} Q 0 0 ${r} 0 Z`;
    const shapePath = element.shapeType === 'triangle' ? getTrianglePath(w,h)
      : element.shapeType === 'star' ? getStarPath(w,h)
      : element.shapeType === 'speechBubble' ? getSpeechBubblePath(w,h,element.cornerRadius)
      : element.shapeType === 'arrowLeft' ? getArrowLeftPath(w,h)
      : element.shapeType === 'arrowRight' ? getArrowRightPath(w,h) : radiusPath;
    const textStyle = element.textStyle ?? { fontFamily:'Inter', fontSize:16, fontWeight:400, color:'#000000', align:'center' as const };
    return <div style={{ width:'100%', height:'100%', position:'relative', opacity:element.opacity,
      transform:`rotate(var(--element-rotation-preview, ${element.rotation}deg))`, filter:shadowFilter(element.shadow) }}>
      <svg data-artwork-svg="true" width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} style={{display:'block',overflow:'visible'}}>
        <g fill={element.fill} stroke={element.stroke} strokeWidth={strokeWidth}
          strokeDasharray={strokeDash(element.strokeStyle,strokeWidth).join(' ')} strokeLinecap={element.strokeStyle === 'dotted'?'round':'butt'}>
          {element.shapeType === 'circle' || element.shapeType === 'ellipse'
            ? <ellipse cx={w/2} cy={h/2} rx={w/2} ry={h/2}/>
            : <path d={shapePath}/>}
        </g>
        {element.textContent && <text x={textStyle.align === 'left'?8:textStyle.align === 'right'?w-8:w/2} y={h/2}
          dominantBaseline="middle" textAnchor={textStyle.align === 'left'?'start':textStyle.align === 'right'?'end':'middle'}
          fontFamily={textStyle.fontFamily} fontSize={textStyle.fontSize} fontWeight={textStyle.fontWeight} fill={textStyle.color}>{element.textContent}</text>}
      </svg>
    </div>;
  };

  return (
    <Rnd
      scale={zoom}
      size={{ width: element.width, height: element.height }}
      position={{ x: element.x, y: element.y }}
      onDragStop={(e, d) => {
        if (d.x !== element.x || d.y !== element.y) {
          updateElement(element.id, { x: d.x, y: d.y });
        }
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        updateElement(element.id, {
          width: parseInt(ref.style.width),
          height: parseInt(ref.style.height),
          ...position,
        });
      }}
      disableDragging={element.locked}
      enableResizing={isSelected && !element.locked}
      bounds="parent"
      resizeHandleStyles={{
        topLeft: handleStyle,
        topRight: handleStyle,
        bottomLeft: handleStyle,
        bottomRight: handleStyle,
        top: handleStyle,
        right: handleStyle,
        bottom: handleStyle,
        left: handleStyle,
      }}
      style={{
        zIndex: element.zIndex,
        cursor: element.locked ? 'not-allowed' : 'move',
      }}
      onClick={handleClick}
      lockAspectRatio={element.shapeType === 'circle' || element.shapeType === 'triangle' || element.shapeType === 'star'}
      data-element-id={element.id}
      data-element-type="shape"
    >
      <div
        className="w-full h-full"
        style={isSelected ? {
          outline: `${2 / zoom}px solid #3b82f6`,
          outlineOffset: `${1 / zoom}px`,
        } : undefined}
      >
        {renderShape()}
      </div>
    </Rnd>
  );
}