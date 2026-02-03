import React from "react";
import { 
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Plus,
  List,
  ListOrdered,
} from "lucide-react";
import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../ui/tooltip";
import { TextAlign, TextTransform, ListStyle } from "../../../lib/canvasTypes";

export interface TextStyles {
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  textTransform: TextTransform;
  align: TextAlign;
  listStyle: ListStyle;
}

interface TextControlsProps {
  values: TextStyles;
  onChange: (updates: Partial<TextStyles>) => void;
}

const FONT_FAMILIES = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Georgia", label: "Georgia" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Poppins", label: "Poppins" },
  { value: "Playfair Display", label: "Playfair Display" },
];

function ToolBtn({ 
  onClick, 
  isActive = false, 
  tooltip,
  children 
}: { 
  onClick?: () => void;
  isActive?: boolean;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors ${
            isActive
              ? "bg-violet-100 text-violet-700"
              : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-gray-200 mx-1.5" />;
}

export function TextControls({ values, onChange }: TextControlsProps) {
  const handleFontSizeChange = (value: string) => {
    let size = parseInt(value);
    if (isNaN(size)) return;
    size = Math.max(1, Math.min(500, size));
    onChange({ fontSize: size });
  };

  const increaseFontSize = () => {
    onChange({ fontSize: values.fontSize + 1 });
  };

  const decreaseFontSize = () => {
    if (values.fontSize > 1) {
      onChange({ fontSize: values.fontSize - 1 });
    }
  };

  const toggleCase = () => {
    const transforms: TextTransform[] = ['none', 'uppercase', 'lowercase', 'capitalize'];
    const currentIndex = transforms.indexOf(values.textTransform || 'none');
    const nextTransform = transforms[(currentIndex + 1) % transforms.length];
    onChange({ textTransform: nextTransform });
  };

  const toggleBulletList = () => {
    const newListStyle = values.listStyle === 'bullet' ? 'none' : 'bullet';
    onChange({ listStyle: newListStyle });
  };

  const toggleNumberedList = () => {
    const newListStyle = values.listStyle === 'numbered' ? 'none' : 'numbered';
    onChange({ listStyle: newListStyle });
  };

  return (
    <div className="flex items-center gap-0.5">
      {/* Font Family Dropdown */}
      <Select value={values.fontFamily} onValueChange={(val) => onChange({ fontFamily: val })}>
        <SelectTrigger className="h-8 w-[120px] text-sm border-0 bg-transparent hover:bg-gray-100 rounded-md px-2 font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-lg shadow-lg z-[100]">
          {FONT_FAMILIES.map((font) => (
            <SelectItem key={font.value} value={font.value} className="cursor-pointer">
              <span style={{ fontFamily: font.value }}>{font.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Divider />

      {/* Font Size */}
      <div className="flex items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={decreaseFontSize} className="h-8 w-7 flex items-center justify-center hover:bg-gray-100 rounded-md">
              <Minus className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>
            Decrease size
          </TooltipContent>
        </Tooltip>
        <Input
          type="number"
          value={values.fontSize}
          onChange={(e) => handleFontSizeChange(e.target.value)}
          className="h-8 w-12 text-center text-sm border-0 bg-transparent focus-visible:ring-0 px-0 font-medium"
          min={1}
          max={500}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={increaseFontSize} className="h-8 w-7 flex items-center justify-center hover:bg-gray-100 rounded-md">
              <Plus className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>
            Increase size
          </TooltipContent>
        </Tooltip>
      </div>

      <Divider />

      {/* Color with A indicator */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <input
              type="color"
              value={values.color}
              onChange={(e) => onChange({ color: e.target.value })}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="h-8 w-8 flex flex-col items-center justify-center hover:bg-gray-100 rounded-md cursor-pointer">
              <span className="text-sm font-bold text-gray-700">A</span>
              <div className="w-5 h-1 rounded-sm" style={{ backgroundColor: values.color }} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          Text color
        </TooltipContent>
      </Tooltip>

      <Divider />

      {/* Text Styles */}
      <ToolBtn onClick={() => onChange({ bold: !values.bold })} isActive={values.bold} tooltip="Bold (Ctrl+B)">
        <Bold className="w-4 h-4" strokeWidth={2.5} />
      </ToolBtn>
      <ToolBtn onClick={() => onChange({ italic: !values.italic })} isActive={values.italic} tooltip="Italic (Ctrl+I)">
        <Italic className="w-4 h-4" strokeWidth={2} />
      </ToolBtn>
      <ToolBtn onClick={() => onChange({ underline: !values.underline })} isActive={values.underline} tooltip="Underline (Ctrl+U)">
        <Underline className="w-4 h-4" strokeWidth={2} />
      </ToolBtn>
      <ToolBtn onClick={() => onChange({ strikethrough: !values.strikethrough })} isActive={values.strikethrough} tooltip="Strikethrough">
        <Strikethrough className="w-4 h-4" strokeWidth={2} />
      </ToolBtn>

      <Divider />

      {/* Case Toggle */}
      <ToolBtn onClick={toggleCase} tooltip={`Case: ${values.textTransform}`}>
        <span className="text-xs font-bold">
          {values.textTransform === 'uppercase' ? 'AA' : 
           values.textTransform === 'lowercase' ? 'aa' : 
           'Aa'}
        </span>
      </ToolBtn>

      <Divider />

      {/* Alignment */}
      <ToolBtn onClick={() => onChange({ align: "left" })} isActive={values.align === "left"} tooltip="Align left">
        <AlignLeft className="w-4 h-4" strokeWidth={2} />
      </ToolBtn>
      <ToolBtn onClick={() => onChange({ align: "center" })} isActive={values.align === "center"} tooltip="Align center">
        <AlignCenter className="w-4 h-4" strokeWidth={2} />
      </ToolBtn>
      <ToolBtn onClick={() => onChange({ align: "right" })} isActive={values.align === "right"} tooltip="Align right">
        <AlignRight className="w-4 h-4" strokeWidth={2} />
      </ToolBtn>

      <Divider />

      {/* Lists */}
      <ToolBtn onClick={toggleBulletList} isActive={values.listStyle === 'bullet'} tooltip="Bullet list">
        <List className="w-4 h-4" strokeWidth={2} />
      </ToolBtn>
      <ToolBtn onClick={toggleNumberedList} isActive={values.listStyle === 'numbered'} tooltip="Numbered list">
        <ListOrdered className="w-4 h-4" strokeWidth={2} />
      </ToolBtn>
    </div>
  );
}