import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";

interface EditableTitleProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  iconClassName?: string;
}

export function EditableTitle({
  value,
  onChange,
  placeholder = "Untitled Design",
  className = "",
  iconClassName = "",
}: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== value) {
      onChange(trimmedValue);
    } else if (!trimmedValue) {
      // Reset to original value if empty
      setEditValue(value || placeholder);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const displayValue = value || placeholder;

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="bg-gray-800 text-white text-sm px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-purple-500 min-w-[200px]"
          maxLength={50}
        />
      ) : (
        <>
          <span
            onClick={handleClick}
            className={`text-white text-sm cursor-pointer hover:text-gray-200 ${
              !value ? "text-gray-400 italic" : ""
            }`}
          >
            {displayValue}
          </span>
          {isHovered && (
            <Pencil
              className={`w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-white transition-colors ${iconClassName}`}
              onClick={handleClick}
            />
          )}
        </>
      )}
    </div>
  );
}
