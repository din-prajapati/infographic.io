// Shape element component

import React from 'react';
import { Rnd } from 'react-rnd';
import { ShapeElement as ShapeElementType } from '../../lib/canvasTypes';
import { useCanvasStore } from '../../hooks/useCanvasStore';
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
    // For SVG shapes, we need to render them differently
    const svgShapes = ['triangle', 'star', 'speechBubble', 'arrowLeft', 'arrowRight'];
    const isSvgShape = svgShapes.includes(element.shapeType);

    if (isSvgShape) {
      let path = '';
      switch (element.shapeType) {
        case 'triangle':
          path = getTrianglePath(element.width, element.height);
          break;
        case 'star':
          path = getStarPath(element.width, element.height);
          break;
        case 'speechBubble':
          path = getSpeechBubblePath(element.width, element.height, element.cornerRadius);
          break;
        case 'arrowLeft':
          path = getArrowLeftPath(element.width, element.height);
          break;
        case 'arrowRight':
          path = getArrowRightPath(element.width, element.height);
          break;
      }

      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            opacity: element.opacity,
            transform: `rotate(${element.rotation}deg)`,
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${element.width} ${element.height}`}
            style={{ display: 'block' }}
          >
            <path
              d={path}
              fill={element.fill}
              stroke={element.stroke}
              strokeWidth={element.strokeWidth}
            />
          </svg>
        </div>
      );
    }

    // For regular shapes (rectangle, circle, ellipse)
    const commonStyle = {
      width: '100%',
      height: '100%',
      backgroundColor: element.fill,
      border: `${element.strokeWidth}px solid ${element.stroke}`,
      opacity: element.opacity,
      transform: `rotate(${element.rotation}deg)`,
      position: 'relative' as const,
    };

    switch (element.shapeType) {
      case 'rectangle':
        return (
          <div
            style={{
              ...commonStyle,
              borderRadius: `${element.cornerRadius}px`,
            }}
          />
        );
      case 'circle':
        return (
          <div
            style={{
              ...commonStyle,
              borderRadius: '50%',
            }}
          />
        );
      case 'ellipse':
        return (
          <div
            style={{
              ...commonStyle,
              borderRadius: '50%',
            }}
          />
        );
      default:
        return <div style={commonStyle} />;
    }
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