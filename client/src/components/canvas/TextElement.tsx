// Text element component

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Rnd } from 'react-rnd';
import { TextElement as TextElementType } from '../../lib/canvasTypes';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import { writeCanvasToField } from '../../lib/listingBindings';
import { getElementPaint, paintDecorationColor, paintToCss } from '../../lib/paint';
import { formatTextContent, textLetterSpacingPx } from '../../lib/textLayout';

/**
 * Applies a committed text edit: updates the canvas element and, when the
 * element carries a slot tag, writes back to the matching field store (D3).
 * Exported so the commit logic is unit-testable without mounting the component.
 */
export function commitEdit(
  updateFn: (id: string, updates: Partial<TextElementType>) => void,
  element: { id: string; slot?: string; slotFormat?: string },
  value: string,
): void {
  updateFn(element.id, { content: value });
  // D3: write back to the field when the element is slot-tagged.
  // writeCanvasToField returns false (never throws) for slots with no field
  // and for the specs line (Q1) — both are the normal case.
  if (element.slot) {
    // US-EDIT-019 — the element's fixed label is stripped before the field stores it.
    writeCanvasToField(element.slot, value, element.slotFormat);
  }
}

interface TextElementProps {
  element: TextElementType;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onGeometryChange?: (id:string, geometry:Pick<TextElementType,'x'|'y'|'width'|'height'>|null)=>void;
}

export function TextElement({ element, isSelected, onSelect, onGeometryChange }: TextElementProps) {
  const updateElement = useCanvasStore((state) => state.updateElement);
  const zoom = useCanvasStore((state) => state.zoom);
  const textPaint = getElementPaint(element, 'color');
  const gradientText = textPaint.type === 'linear' || textPaint.type === 'radial';
  const textColor = paintDecorationColor(textPaint);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(element.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(()=>()=>onGeometryChange?.(element.id,null),[element.id,onGeometryChange]);
  useEffect(()=>{if(!isSelected||element.locked||!element.visible)onGeometryChange?.(element.id,null);},[isSelected,element.locked,element.visible,element.id,onGeometryChange]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!element.locked) {
      setIsEditing(true);
      setEditValue(element.content);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      onSelect(e);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== element.content) {
      commitEdit(updateElement, element, editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(element.content);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
  };

  useLayoutEffect(()=>{
    const textarea=textareaRef.current;if(!isEditing||!textarea)return;
    textarea.style.height='0px';
    textarea.style.height=`${Math.max(element.fontSize*element.lineHeight,textarea.scrollHeight)}px`;
  },[isEditing,editValue,element.width,element.fontSize,element.fontFamily,element.fontWeight,element.bold,element.italic,element.lineHeight,element.letterSpacing]);

  if (!element.visible) return null;

  // Resize handles must be sized in canvas pixels (inverse of zoom) so they
  // appear at a consistent ~8 px visual size regardless of the canvas zoom.
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

  // Build text decoration string
  const getTextDecoration = () => {
    const decorations: string[] = [];
    if (element.underline) decorations.push('underline');
    if (element.strikethrough) decorations.push('line-through');
    return decorations.length > 0 ? decorations.join(' ') : 'none';
  };

  return (
    <Rnd
      scale={zoom}
      size={{ width: element.width, height: element.height }}
      position={{ x: element.x, y: element.y }}
      onDrag={(e,d)=>onGeometryChange?.(element.id,{x:d.x,y:d.y,width:element.width,height:element.height})}
      onResize={(e,direction,ref,delta,position)=>onGeometryChange?.(element.id,{width:parseFloat(ref.style.width),height:parseFloat(ref.style.height),...position})}
      onPointerCancel={()=>onGeometryChange?.(element.id,null)}
      onDragStop={(e, d) => {
        if (d.x !== element.x || d.y !== element.y) {
          updateElement(element.id, { x: d.x, y: d.y });
        }
        onGeometryChange?.(element.id,null);
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        updateElement(element.id, {
          width: parseInt(ref.style.width),
          height: parseInt(ref.style.height),
          ...position,
        });
        onGeometryChange?.(element.id,null);
      }}
      disableDragging={element.locked || isEditing}
      enableResizing={isSelected && !element.locked && !isEditing}
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
      onDoubleClick={handleDoubleClick}
      data-element-id={element.id}
      data-element-type="text"
    >
      <div
        className="w-full h-full"
        style={{
          transform: `rotate(var(--element-rotation-preview, ${element.rotation}deg))`,
          display:'flex',flexDirection:'column',padding:'4px 0',boxSizing:'border-box',
          ...(!isEditing && gradientText ? {backgroundImage:paintToCss(textPaint, 'transparent', element),backgroundClip:'text',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'} : {}),
          justifyContent:element.textAnchor==='middle'?'safe center':element.textAnchor==='end'?'safe flex-end':'flex-start',
          ...(isSelected ? {
            outline: `${2 / zoom}px solid #3b82f6`,
            outlineOffset: `${1 / zoom}px`,
          } : {}),
        }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full resize-none rounded px-2 outline-none"
            style={{
              fontFamily: element.fontFamily,
              fontSize: `${element.fontSize}px`,
              fontWeight: element.bold ? 700 : element.fontWeight,
              fontStyle: element.italic ? 'italic' : 'normal',
              textDecoration: getTextDecoration(),
              color: textColor,
              textDecorationColor:textColor,
              textAlign: element.align,
              lineHeight: element.lineHeight,
              letterSpacing:`${textLetterSpacingPx(element.fontSize,element.letterSpacing)}px`,
              backgroundColor: 'transparent',
              flexShrink:0,maxHeight:'100%',paddingTop:0,paddingBottom:0,border:0,outline:'2px solid #3b82f6',
              textTransform: element.textTransform,
            }}
          />
        ) : (
          <div
            className="w-full px-2 whitespace-pre-wrap break-words"
            style={{
              fontFamily: element.fontFamily,
              fontSize: `${element.fontSize}px`,
              fontWeight: element.bold ? 700 : element.fontWeight,
              fontStyle: element.italic ? 'italic' : 'normal',
              textDecoration: getTextDecoration(),
              color: textColor,
              textDecorationColor:textColor,
              textAlign: element.align,
              lineHeight: element.lineHeight,
              letterSpacing:`${textLetterSpacingPx(element.fontSize,element.letterSpacing)}px`,
              flexShrink:0,
              paddingLeft: element.listStyle !== 'none' ? '1.5rem' : '0.5rem',
            }}
          >
            {formatTextContent(element) || 'Double click to edit'}
          </div>
        )}
      </div>
    </Rnd>
  );
}
