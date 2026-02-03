// Text element component

import { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { TextElement as TextElementType } from '../../lib/canvasTypes';
import { useCanvasStore } from '../../hooks/useCanvasStore';

interface TextElementProps {
  element: TextElementType;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
}

export function TextElement({ element, isSelected, onSelect }: TextElementProps) {
  const updateElement = useCanvasStore((state) => state.updateElement);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(element.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      updateElement(element.id, { content: editValue });
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

  if (!element.visible) return null;

  // Helper function to apply text transform and list formatting
  const formatContent = (content: string) => {
    let formatted = content;
    
    // Apply text transform
    switch (element.textTransform) {
      case 'uppercase':
        formatted = formatted.toUpperCase();
        break;
      case 'lowercase':
        formatted = formatted.toLowerCase();
        break;
      case 'capitalize':
        formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
        break;
      default:
        break;
    }
    
    // Apply list formatting
    if (element.listStyle === 'bullet') {
      formatted = `• ${formatted}`;
    } else if (element.listStyle === 'numbered') {
      formatted = `1. ${formatted}`;
    }
    
    return formatted;
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
      disableDragging={element.locked || isEditing}
      enableResizing={!element.locked && !isEditing}
      bounds="parent"
      style={{
        zIndex: element.zIndex,
        opacity: element.opacity,
        cursor: element.locked ? 'not-allowed' : 'move',
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className={`w-full h-full ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 shadow-lg' : ''}`}
        style={{
          transform: `rotate(${element.rotation}deg)`,
        }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full h-full resize-none border-2 border-blue-500 rounded px-2 py-1 outline-none"
            style={{
              fontFamily: element.fontFamily,
              fontSize: `${element.fontSize}px`,
              fontWeight: element.bold ? 700 : element.fontWeight,
              fontStyle: element.italic ? 'italic' : 'normal',
              textDecoration: getTextDecoration(),
              color: element.color,
              textAlign: element.align,
              lineHeight: element.lineHeight,
              backgroundColor: 'transparent',
              textTransform: element.textTransform,
            }}
          />
        ) : (
          <div
            className="w-full h-full px-2 py-1 whitespace-pre-wrap break-words"
            style={{
              fontFamily: element.fontFamily,
              fontSize: `${element.fontSize}px`,
              fontWeight: element.bold ? 700 : element.fontWeight,
              fontStyle: element.italic ? 'italic' : 'normal',
              textDecoration: getTextDecoration(),
              color: element.color,
              textAlign: element.align,
              lineHeight: element.lineHeight,
              textTransform: element.textTransform,
              paddingLeft: element.listStyle !== 'none' ? '1.5rem' : '0.5rem',
            }}
          >
            {formatContent(element.content) || 'Double click to edit'}
          </div>
        )}
      </div>
    </Rnd>
  );
}