// Text element toolbar

import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Minus, Plus } from "lucide-react";
import { TextElement } from "../../../lib/canvasTypes";
import { useCanvasStore } from "../../../hooks/useCanvasStore";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Separator } from "../../ui/separator";

interface TextToolbarProps {
  element: TextElement;
}

const FONT_FAMILIES = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Georgia", label: "Georgia" },
  { value: "Times New Roman", label: "Times New Roman" },
];

export function TextToolbar({ element }: TextToolbarProps) {
  const updateElement = useCanvasStore((state) => state.updateElement);

  const handleFontFamilyChange = (value: string) => {
    updateElement(element.id, { fontFamily: value });
  };

  const handleFontSizeChange = (value: string) => {
    const size = parseInt(value);
    if (!isNaN(size) && size > 0 && size <= 500) {
      updateElement(element.id, { fontSize: size });
    }
  };

  const increaseFontSize = () => {
    updateElement(element.id, { fontSize: element.fontSize + 1 });
  };

  const decreaseFontSize = () => {
    if (element.fontSize > 1) {
      updateElement(element.id, { fontSize: element.fontSize - 1 });
    }
  };

  const toggleBold = () => {
    updateElement(element.id, { bold: !element.bold });
  };

  const toggleItalic = () => {
    updateElement(element.id, { italic: !element.italic });
  };

  const toggleUnderline = () => {
    updateElement(element.id, { underline: !element.underline });
  };

  const setAlignment = (align: typeof element.align) => {
    updateElement(element.id, { align });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateElement(element.id, { color: e.target.value });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Font Family */}
      <Select value={element.fontFamily} onValueChange={handleFontFamilyChange}>
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONT_FAMILIES.map((font) => (
            <SelectItem key={font.value} value={font.value} className="text-xs">
              {font.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6" />

      {/* Font Size */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={decreaseFontSize}
        >
          <Minus className="w-3 h-3" />
        </Button>
        <Input
          type="number"
          value={element.fontSize}
          onChange={(e) => handleFontSizeChange(e.target.value)}
          className="w-14 h-8 text-xs text-center"
          min={1}
          max={500}
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={increaseFontSize}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Text Style */}
      <div className="flex gap-1">
        <Button
          variant={element.bold ? "default" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={toggleBold}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant={element.italic ? "default" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={toggleItalic}
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          variant={element.underline ? "default" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={toggleUnderline}
        >
          <Underline className="w-4 h-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Text Alignment */}
      <div className="flex gap-1">
        <Button
          variant={element.align === "left" ? "default" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setAlignment("left")}
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button
          variant={element.align === "center" ? "default" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setAlignment("center")}
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button
          variant={element.align === "right" ? "default" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setAlignment("right")}
        >
          <AlignRight className="w-4 h-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Text Color */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Color:</span>
        <div className="relative">
          <input
            type="color"
            value={element.color}
            onChange={handleColorChange}
            className="w-8 h-8 rounded border cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
