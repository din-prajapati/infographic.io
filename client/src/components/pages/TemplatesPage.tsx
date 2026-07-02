import { Search, Plus, ChevronDown } from "lucide-react";
import { useState, useEffect, CSSProperties } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { loadTemplates, DesignMetadata } from "../../lib/storage";
import { templatesApi } from "../../lib/api";
import { useQuery } from "@tanstack/react-query";
import { STARTER_CANVAS_TEMPLATES } from "../../lib/starterCanvasTemplates";
import { PREMIUM_CANVAS_TEMPLATES } from "../../lib/premiumTemplates";

interface TemplatesPageProps {
  onOpenEditor?: (templateId?: string) => void;
}

interface TemplateItem {
  id: string | number;
  title: string;
  description: string;
  uses: string;
  badge: string;
  badgeStyle: CSSProperties;
  image: string;
  isCustom?: boolean;
  isPremium?: boolean;
}

const templates: TemplateItem[] = STARTER_CANVAS_TEMPLATES.map((template) => ({
  id: template.id,
  title: template.name,
  description: template.description,
  uses: "Starter",
  badge: template.badge ?? template.category,
  badgeStyle: { backgroundColor: "var(--badge-starter-bg, #e0e7ff)", color: "var(--badge-starter-text, #312e81)" },
  image: template.image,
}));

const premiumTemplates: TemplateItem[] = PREMIUM_CANVAS_TEMPLATES.map((template) => ({
  id: template.id,
  title: template.name,
  description: template.description,
  uses: "Premium",
  badge: template.badge,
  badgeStyle: { backgroundColor: "var(--badge-premium-bg, #0ca0eb)", color: "var(--badge-premium-text, #ffffff)" },
  image: template.image,
  isPremium: true,
}));

export function TemplatesPage({ onOpenEditor }: TemplatesPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all-categories");
  const [selectedStyle, setSelectedStyle] = useState("all-styles");
  const [customTemplates, setCustomTemplates] = useState<DesignMetadata[]>([]);
  const [showCustomOnly, setShowCustomOnly] = useState(false);

  // API templates (DB layout descriptors used internally for AI generation)
  // are intentionally excluded from the gallery — they have no canvasData or
  // previewUrl and would open a blank editor. Keep the query for debugging but
  // do not render them in allTemplates.
  const { data: _apiTemplates = [] } = useQuery({
    queryKey: ['/api/v1/templates'],
    queryFn: () => templatesApi.getAll(),
  });

  // Load custom templates on mount
  useEffect(() => {
    const loadCustomTemplates = async () => {
      try {
        const templates = await loadTemplates();
        setCustomTemplates(templates);
      } catch (error) {
        console.error('Error loading custom templates:', error);
      }
    };
    loadCustomTemplates();
  }, []);

  // Gallery shows: saved custom designs, premium client-side templates, starter templates.
  // DB API templates (layout descriptors for AI generation) are excluded — they
  // have no canvasData or thumbnail and would open a blank editor if clicked.
  const allTemplates: TemplateItem[] = [
    ...customTemplates.map(t => ({
      id: t.id,
      title: t.name,
      description: t.category || "Custom template",
      uses: "Custom",
      badge: t.category || "Custom",
      badgeStyle: { backgroundColor: 'var(--badge-custom-bg)', color: 'var(--badge-custom-text)' },
      image: t.thumbnail,
      isCustom: true,
    })),
    ...(!showCustomOnly ? premiumTemplates : []),
    ...(!showCustomOnly ? templates : []),
  ];

  // Filter templates based on search and filters
  const filteredTemplates = allTemplates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all-categories" ||
      (selectedCategory === "custom" && template.isCustom) ||
      (selectedCategory === "premium" && template.isPremium) ||
      (selectedCategory === "real-estate" && !template.isCustom && !template.isPremium) ||
      (selectedCategory === "business" && template.badge?.toLowerCase() === "business") ||
      (selectedCategory === "marketing" && template.badge?.toLowerCase() === "marketing");

    const matchesStyle =
      selectedStyle === "all-styles" ||
      template.badge.toLowerCase() === selectedStyle ||
      (selectedStyle === "custom" && template.isCustom);

    return matchesSearch && matchesCategory && matchesStyle;
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="mb-2 text-foreground">Template Gallery</h1>
              <p className="text-muted-foreground">
                Choose from our curated collection of professional infographic templates
              </p>
            </div>
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => onOpenEditor?.()}>
              <Plus className="w-4 h-4" />
              Create Blank
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-muted-foreground" />
              </span>
              <Input
                placeholder="Search templates..."
                className="pl-11 h-11 bg-input-background border-border text-foreground placeholder:text-muted-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px] h-11 bg-input-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-categories">All Categories</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="custom">My Templates</SelectItem>
                <SelectItem value="real-estate">Real Estate</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStyle} onValueChange={setSelectedStyle}>
              <SelectTrigger className="w-[140px] h-11 bg-input-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-styles">All Styles</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="budget">Budget</SelectItem>
              </SelectContent>
            </Select>
            {customTemplates.length > 0 && (
              <Button
                variant={showCustomOnly ? "default" : "outline"}
                onClick={() => setShowCustomOnly(!showCustomOnly)}
                className="h-11 border-border text-foreground"
              >
                My Templates ({customTemplates.length})
              </Button>
            )}
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="glass rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
              >
                {/* Template Image — uniform 4/3 frame for every card; thumbnails
                    fit entirely (object-contain) so premium format variety
                    (Story, Header, A4…) never crops and all cards share height. */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted flex items-center justify-center">
                  {template.isCustom ? (
                    <img
                      src={template.image}
                      alt={template.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageWithFallback
                      src={template.image}
                      alt={template.title}
                      className="w-full h-full object-contain"
                    />
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge style={template.badgeStyle}>
                      {template.badge}
                    </Badge>
                  </div>
                  {template.isPremium && (
                    <div className="absolute top-3 left-3">
                      <Badge style={{ backgroundColor: "var(--badge-premium-bg, #0ca0eb)", color: "var(--badge-premium-text, #ffffff)" }}>
                        Premium
                      </Badge>
                    </div>
                  )}
                  {template.isCustom && (
                    <div className="absolute top-3 left-3">
                      <Badge style={{ backgroundColor: 'var(--badge-custom-bg)', color: 'var(--badge-custom-text)' }}>
                        Custom
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Template Info */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="mb-1 text-foreground">{template.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs text-muted-foreground">
                      {template.uses} {template.isCustom ? '' : 'uses'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80 h-8"
                      onClick={() => onOpenEditor?.(String(template.id))}
                    >
                      Use Template
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground mb-4">
                {showCustomOnly && customTemplates.length === 0
                  ? "No custom templates yet. Save a design as template!"
                  : "No templates found matching your criteria"}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  if (showCustomOnly && customTemplates.length === 0) {
                    onOpenEditor?.();
                  } else {
                    setSearchQuery("");
                    setSelectedCategory("all-categories");
                    setSelectedStyle("all-styles");
                    setShowCustomOnly(false);
                  }
                }}
              >
                {showCustomOnly && customTemplates.length === 0 ? "Create Design" : "Clear Filters"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}