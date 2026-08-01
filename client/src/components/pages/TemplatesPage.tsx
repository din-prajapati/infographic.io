import { Search, Plus } from "lucide-react";
import { useState, CSSProperties } from "react";
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
import { templatesApi, canvasTemplatesApi } from "../../lib/api";
import { useQuery } from "@tanstack/react-query";
import { STARTER_CANVAS_TEMPLATES } from "../../lib/starterCanvasTemplates";

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

const starterTemplates: TemplateItem[] = STARTER_CANVAS_TEMPLATES.map((template) => ({
  id: template.id,
  title: template.name,
  description: template.description,
  uses: "Starter",
  badge: template.badge ?? template.category,
  badgeStyle: { backgroundColor: "var(--badge-starter-bg, #e0e7ff)", color: "var(--badge-starter-text, #312e81)" },
  image: template.image,
}));

export function TemplatesPage({ onOpenEditor }: TemplatesPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all-categories");
  const [selectedStyle, setSelectedStyle] = useState("all-styles");

  // API templates (DB layout descriptors used internally for AI generation)
  // are intentionally excluded from the gallery — they have no canvasData or
  // previewUrl and would open a blank editor. Keep the query for debugging but
  // do not render them in allTemplates.
  const { data: _apiTemplates = [] } = useQuery({
    queryKey: ['/api/v1/templates'],
    queryFn: () => templatesApi.getAll(),
  });

  // My Templates — user's own saved private templates, fetched via API (AC3)
  const {
    data: myTemplatesRaw = [],
    isLoading: myTemplatesLoading,
  } = useQuery({
    queryKey: ['/api/v1/canvas-templates', 'my'],
    queryFn: () => canvasTemplatesApi.getAll(),
    // Return empty array on error so the section simply hides rather than crashing
    throwOnError: false,
  });

  const myTemplates: TemplateItem[] = myTemplatesRaw.map((t) => ({
    id: t.id,
    title: t.name,
    description: t.category || 'My template',
    uses: 'My Templates',
    badge: t.category || 'Custom',
    badgeStyle: { backgroundColor: 'var(--badge-custom-bg)', color: 'var(--badge-custom-text)' },
    image: t.thumbnail || '',
    isCustom: true,
  }));

  // Premium gallery — admin_curated templates from DB (AC9)
  const {
    data: adminCuratedRaw = [],
    isLoading: premiumLoading,
    isError: premiumError,
  } = useQuery({
    queryKey: ['/api/v1/canvas-templates', 'admin_curated'],
    queryFn: () => canvasTemplatesApi.getAdminCurated(),
    // Do NOT fall back to bundled data on error — show a clear error state (AC10)
    throwOnError: false,
    retry: 1,
  });

  const premiumTemplates: TemplateItem[] = adminCuratedRaw.map((t) => ({
    id: t.id,
    title: t.name,
    description: t.description || t.category || '',
    uses: 'Premium',
    badge: t.badge || t.category || '',
    badgeStyle: { backgroundColor: "var(--badge-premium-bg, #0ca0eb)", color: "var(--badge-premium-text, #ffffff)" },
    image: t.thumbnail || '',
    isPremium: true,
  }));

  // Gallery shows: premium (from DB) + starter templates
  const allTemplates: TemplateItem[] = [
    ...premiumTemplates,
    ...starterTemplates,
  ];

  // Filter My Templates based on search
  const filteredMyTemplates = myTemplates.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Filter gallery templates based on search and category/style filters
  const filteredTemplates = allTemplates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all-categories" ||
      (selectedCategory === "premium" && template.isPremium) ||
      (selectedCategory === "real-estate" && !template.isPremium) ||
      (selectedCategory === "business" && template.badge?.toLowerCase() === "business") ||
      (selectedCategory === "marketing" && template.badge?.toLowerCase() === "marketing");

    const matchesStyle =
      selectedStyle === "all-styles" ||
      template.badge.toLowerCase() === selectedStyle;

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
            {/*
              "New Template" mirrors "New Design" on My Designs — both open the
              same Format Picker (see US-AI-038 §4.5 / the template-and-design
              workflow doc). The two entry points stay separate for
              discoverability and diverge only at save time.
            */}
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => onOpenEditor?.()}>
              <Plus className="w-4 h-4" />
              New Template
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
                <SelectItem value="luxury">Luxury</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="budget">Budget</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* My Templates — user-saved private templates (AC3) */}
        {(myTemplatesLoading || myTemplates.length > 0) && (
          <div className="mb-10">
            <h2 className="mb-4 text-foreground">My Templates</h2>
            {myTemplatesLoading ? (
              <p className="text-sm text-muted-foreground">Loading your templates…</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMyTemplates.length > 0 ? (
                  filteredMyTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="glass rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-muted flex items-center justify-center">
                        <img
                          src={template.image}
                          alt={template.title}
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge style={{ backgroundColor: 'var(--badge-custom-bg)', color: 'var(--badge-custom-text)' }}>
                            My Template
                          </Badge>
                        </div>
                        <div className="absolute top-3 right-3">
                          <Badge style={template.badgeStyle}>{template.badge}</Badge>
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="mb-1 text-foreground">{template.title}</h3>
                        <p className="text-xs text-muted-foreground mb-3">{template.description}</p>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-xs text-muted-foreground">Saved</span>
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
                  <p className="col-span-full text-sm text-muted-foreground">
                    No saved templates match your search.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Premium gallery loading / error state (AC10) */}
        {premiumLoading && (
          <p className="text-sm text-muted-foreground mb-6">Loading premium templates…</p>
        )}
        {!premiumLoading && premiumError && (
          <div className="mb-6 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Premium templates could not be loaded. Check your connection and refresh the page.
          </div>
        )}
        {!premiumLoading && !premiumError && adminCuratedRaw.length === 0 && (
          <div className="mb-6 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            No premium templates available yet.
          </div>
        )}

        {/* Gallery Grid — Premium (from DB) + Starter templates */}
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
                  <ImageWithFallback
                    src={template.image}
                    alt={template.title}
                    className="w-full h-full object-contain"
                  />
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
                </div>

                {/* Template Info */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="mb-1 text-foreground">{template.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs text-muted-foreground">
                      {template.uses} uses
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
                No templates found matching your criteria
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all-categories");
                  setSelectedStyle("all-styles");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}