import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Palette } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export interface BrandPalette {
  id: string;
  name: string;
  colors: string[];
  description: string;
}

interface BrandPaletteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (palette: BrandPalette) => void;
  initialPalette?: BrandPalette | null;
}

export function BrandPaletteDialog({
  isOpen,
  onClose,
  onSave,
  initialPalette,
}: BrandPaletteDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [colors, setColors] = useState<string[]>(["#000000", "#FFFFFF"]);

  useEffect(() => {
    if (initialPalette) {
      setName(initialPalette.name);
      setDescription(initialPalette.description);
      setColors([...initialPalette.colors]);
    } else {
      setName("");
      setDescription("");
      setColors(["#000000", "#FFFFFF"]);
    }
  }, [initialPalette, isOpen]);

  const handleAddColor = () => {
    setColors([...colors, "#000000"]);
  };

  const handleRemoveColor = (index: number) => {
    if (colors.length > 1) {
      setColors(colors.filter((_, i) => i !== index));
    }
  };

  const handleColorChange = (index: number, value: string) => {
    const newColors = [...colors];
    newColors[index] = value;
    setColors(newColors);
  };

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }

    const palette: BrandPalette = {
      id: initialPalette?.id || `palette-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      colors: colors.filter(c => c.trim() !== ""),
    };

    onSave(palette);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-600" />
            {initialPalette ? "Edit Brand Palette" : "Create Brand Palette"}
          </DialogTitle>
          <DialogDescription>
            Create a custom color palette for your brand. You can add up to 8 colors.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="palette-name">Palette Name</Label>
            <Input
              id="palette-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Brand Colors"
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="palette-description">Description (Optional)</Label>
            <Input
              id="palette-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Professional & modern"
              maxLength={100}
            />
          </div>

          {/* Colors */}
          <div className="space-y-2">
            <Label>Colors</Label>
            <div className="space-y-2">
              {colors.map((color, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => handleColorChange(index, e.target.value)}
                    className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={color}
                    onChange={(e) => handleColorChange(index, e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                    maxLength={7}
                  />
                  {colors.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveColor(index)}
                      className="h-10 w-10 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {colors.length < 8 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddColor}
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Color
              </Button>
            )}
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="flex gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50">
              {colors.map((color, index) => (
                <div
                  key={index}
                  className="w-8 h-8 rounded border border-gray-300"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || colors.length === 0}>
            {initialPalette ? "Update" : "Create"} Palette
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

