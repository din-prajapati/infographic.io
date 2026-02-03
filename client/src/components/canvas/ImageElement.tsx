// Image element component

import React from 'react';
import { Rnd } from 'react-rnd';
import { ImageElement as ImageElementType } from '../../lib/canvasTypes';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import { useTransparencyGrid } from '../../lib/transparencyGridState';

interface ImageElementProps {
  element: ImageElementType;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
}

export function ImageElement({ element, isSelected, onSelect }: ImageElementProps) {
  const updateElement = useCanvasStore((state) => state.updateElement);
  const { isEnabled: showTransparencyGrid } = useTransparencyGrid();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(e);
  };

  if (!element.visible) return null;

  // Build filter style without blur
  const filterStyle = `
    brightness(${element.filters.brightness}%)
    contrast(${element.filters.contrast}%)
    saturate(${element.filters.saturation}%)
  `.trim();

  // Build transform with rotation and flip
  const transform = `rotate(${element.rotation}deg) scaleX(${element.flipHorizontal ? -1 : 1}) scaleY(${element.flipVertical ? -1 : 1})`;

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
      size={{ width: element.width, height: element.height }}
      position={{ x: element.x, y: element.y }}
      onDragStop={(e, d) => {
        updateElement(element.id, { x: d.x, y: d.y });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        updateElement(element.id, {
          width: parseInt(ref.style.width),
          height: parseInt(ref.style.height),
          ...position,
        });
      }}
      disableDragging={element.locked}
      enableResizing={!element.locked}
      bounds="parent"
      style={{
        zIndex: element.zIndex,
        opacity: element.opacity,
        cursor: element.locked ? 'not-allowed' : 'move',
      }}
      onClick={handleClick}
      lockAspectRatio
    >
      <div 
        className={`w-full h-full relative ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 shadow-lg' : ''}`} 
        style={{ 
          overflow: 'hidden',
          borderRadius: `${element.cornerRadius}px`,
        }}
      >
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
              filter: filterStyle || 'none',
              objectFit: 'cover',
              zIndex: 1,
            }}
            draggable={false}
          />
        ) : (
          <img
            src={element.src}
            alt={element.name}
            className="w-full h-full"
            style={{
              filter: filterStyle || 'none',
              transform,
              objectFit: 'cover',
              zIndex: 1,
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
    </Rnd>
  );
}