// Image element component

import React from 'react';
import { Rnd } from 'react-rnd';
import { ImageElement as ImageElementType } from '../../lib/canvasTypes';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import { finiteClamp, strokeDash } from '../../lib/elementStyles';
import { useTransparencyGrid } from '../../lib/transparencyGridState';

interface ImageElementProps {
  element: ImageElementType;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
}

export function ImageElement({ element, isSelected, onSelect }: ImageElementProps) {
  const updateElement = useCanvasStore((state) => state.updateElement);
  const zoom = useCanvasStore((state) => state.zoom);
  const { isEnabled: showTransparencyGrid } = useTransparencyGrid();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(e);
  };

  if (!element.visible) return null;

  // AI imports: pin to artboard bounds — avoids react-rnd size desync clipping
  if (element.isAiImport) {
    const filterStyle = `
      brightness(${element.filters.brightness}%)
      contrast(${element.filters.contrast}%)
      saturate(${element.filters.saturation}%)
    `.trim();

    return (
      <div
        className="absolute inset-0 pointer-events-none"
        role="img"
        aria-label={element.name}
        data-element-id={element.id}
        data-element-type="image"
        style={{
          zIndex: element.zIndex,
          opacity: element.opacity,
          borderRadius: element.cornerRadius,
          transform: `rotate(var(--element-rotation-preview, ${element.rotation}deg)) scaleX(${element.flipHorizontal ? -1 : 1}) scaleY(${element.flipVertical ? -1 : 1})`,
        }}
      >
        <div style={{position:'absolute',inset:0,borderRadius:element.cornerRadius,backgroundImage:`url(${JSON.stringify(element.src)})`,backgroundSize:'contain',backgroundPosition:'center',backgroundRepeat:'no-repeat',filter:`var(--element-filter-preview, ${filterStyle || 'none'})`}}/>
        {(element.borderWidth ?? 0)>0 && <svg data-artwork-svg="true" width="100%" height="100%" viewBox={`0 0 ${element.width} ${element.height}`} style={{position:'absolute',inset:0,overflow:'visible'}}>
          <rect x="0" y="0" width={element.width} height={element.height} rx={Math.min(element.cornerRadius,element.width/2,element.height/2)} fill="none" stroke={element.borderColor ?? '#123e62'} strokeWidth={finiteClamp(element.borderWidth,0,20)} strokeDasharray={strokeDash(element.borderStyle,element.borderWidth ?? 0).join(' ')} strokeLinecap={element.borderStyle==='dotted'?'round':'butt'}/>
        </svg>}
      </div>
    );
  }

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

  // Build filter style without blur
  const filterStyle = `
    brightness(${element.filters.brightness}%)
    contrast(${element.filters.contrast}%)
    saturate(${element.filters.saturation}%)
  `.trim();

  // Build transform with rotation and flip
  const transform = `scaleX(${element.flipHorizontal ? -1 : 1}) scaleY(${element.flipVertical ? -1 : 1})`;

  // Calculate crop rendering
  const hasCrop = element.crop && (
    element.crop.x !== 0 || 
    element.crop.y !== 0 || 
    element.crop.width !== element.width || 
    element.crop.height !== element.height
  );

  // For cropped images, we need to calculate the visible portion
  const getCroppedImageStyle = () => {
    if (!element.crop) return {};
    
    const crop = element.crop;
    // Scale factor: how much bigger the original image is compared to crop
    const scaleX = element.width / crop.width;
    const scaleY = element.height / crop.height;
    
    // Position offset to show the correct portion
    const offsetX = -(crop.x * scaleX);
    const offsetY = -(crop.y * scaleY);
    
    return {
      width: element.width * scaleX,
      height: element.height * scaleY,
      transform: `translate(${offsetX}px, ${offsetY}px)`,
      position: 'absolute' as const,
      top: 0,
      left: 0,
    };
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
        opacity: element.opacity,
        cursor: element.locked ? 'not-allowed' : 'move',
      }}
      onClick={handleClick}
      lockAspectRatio={element.width / element.height}
      data-element-id={element.id}
      data-element-type="image"
    >
      <div
        className="w-full h-full relative"
        style={{
          overflow: 'visible',
          transform: `rotate(var(--element-rotation-preview, ${element.rotation}deg))`,
          borderRadius: `${element.cornerRadius}px`,
          ...(isSelected ? {
            outline: `${2 / zoom}px solid #3b82f6`,
            outlineOffset: `${1 / zoom}px`,
          } : {}),
        }}
      >
        <div style={{position:'absolute',inset:0,overflow:'hidden',borderRadius:element.cornerRadius,transform}}>
        {/* Checkerboard background (when transparency grid is enabled) */}
        {showTransparencyGrid && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #e5e5e5 25%, transparent 25%),
                linear-gradient(-45deg, #e5e5e5 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #e5e5e5 75%),
                linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)
              `,
              backgroundSize: '10px 10px',
              backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
              zIndex: 0,
            }}
          />
        )}
        
        {/* Image with filters and transforms */}
        {hasCrop && element.crop ? (
          <img
            src={element.src}
            alt={element.name}
            style={{
              ...getCroppedImageStyle(),
              filter: `var(--element-filter-preview, ${filterStyle || 'none'})`,
              objectFit: 'cover',
              zIndex: 1,
            }}
            draggable={false}
          />
        ) : (
          <img
            src={element.src}
            alt={element.name}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              filter: `var(--element-filter-preview, ${filterStyle || 'none'})`,

              objectFit: element.objectFit ?? 'contain',
              objectPosition: 'center',
            }}
            draggable={false}
          />
        )}
        
        {/* Color Overlay */}
        {element.colorOverlay && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundColor: element.colorOverlay.color,
              opacity: element.colorOverlay.opacity,
              mixBlendMode: 'multiply',
              zIndex: 2,
            }}
          />
        )}
        </div>
        {(element.borderWidth ?? 0) > 0 && <svg data-artwork-svg="true" aria-hidden="true" width="100%" height="100%" viewBox={`0 0 ${element.width} ${element.height}`}
          style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'visible'}}>
          <rect x="0" y="0" width={element.width} height={element.height} rx={Math.min(element.cornerRadius,element.width/2,element.height/2)} fill="none"
            stroke={element.borderColor ?? '#123e62'} strokeWidth={finiteClamp(element.borderWidth,0,20)}
            strokeDasharray={strokeDash(element.borderStyle,element.borderWidth ?? 0).join(' ')} strokeLinecap={element.borderStyle==='dotted'?'round':'butt'}/>
        </svg>}
      </div>
    </Rnd>
  );
}