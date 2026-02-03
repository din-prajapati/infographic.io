import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { X } from "lucide-react";
import { generateThumbnail } from "../../lib/canvasState";

interface SaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SaveDialogData) => void;
  initialName?: string;
  initialType?: "design" | "template";
}

export interface SaveDialogData {
  name: string;
  type: "design" | "template";
  category?: string;
  tags: string[];
}

const categories = [
  { value: "real-estate", label: "Real Estate" },
  { value: "business", label: "Business" },
  { value: "marketing", label: "Marketing" },
  { value: "education", label: "Education" },
  { value: "healthcare", label: "Healthcare" },
  { value: "technology", label: "Technology" },
];

export function SaveDialog({
  isOpen,
  onClose,
  onSave,
  initialName = "",
  initialType = "design",
}: SaveDialogProps) {
  const [name, setName] = useState(initialName);
  const [saveType, setSaveType] = useState<"design" | "template">(initialType);
  const [category, setCategory] = useState("real-estate");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState<string>("");

  // Generate thumbnail when dialog opens
  useEffect(() => {
    if (isOpen) {
      const thumb = generateThumbnail();
      setThumbnail(thumb);
    }
  }, [isOpen]);

  // Update name when initialName changes
  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      type: saveType,
      category: saveType === "template" ? category : undefined,
      tags,
    });

    // Reset form
    setName("");
    setTags([]);
    setTagInput("");
  };

  const handleCancel = () => {
    // Reset form
    setName(initialName);
    setTags([]);
    setTagInput("");
    setSaveType(initialType);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save Your Work</DialogTitle>
          <DialogDescription>
            Choose how to save your infographic design
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Thumbnail Preview */}
          {thumbnail && (
            <div className="flex justify-center">
              <div className="relative w-48 h-27 rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={thumbnail}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="design-name">Name *</Label>
            <Input
              id="design-name"
              placeholder="e.g., Modern Real Estate Infographic"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              autoFocus
            />
          </div>

          {/* Save Type Toggle */}
          <div className="space-y-2">
            <Label>Save as</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={saveType === "design" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setSaveType("design")}
              >
                Design
              </Button>
              <Button
                type="button"
                variant={saveType === "template" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setSaveType("template")}
              >
                Template
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {saveType === "design"
                ? "Save to My Designs for personal use"
                : "Save as reusable template"}
            </p>
          </div>

          {/* Category (only for templates) */}
          {saveType === "template" && (
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                maxLength={20}
                disabled={tags.length >= 5}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || tags.length >= 5}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 pr-1 cursor-pointer"
                  >
                    {tag}
                    <X
                      className="w-3 h-3 hover:text-destructive"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {tags.length}/5 tags
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Save {saveType === "template" ? "Template" : "Design"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
