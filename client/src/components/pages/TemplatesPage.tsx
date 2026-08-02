import { Search, Plus, X } from "lucide-react";
import { useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { templatesApi, canvasTemplatesApi } from "../../lib/api";
import { useQuery } from "@tanstack/react-query";
import { STARTER_CANVAS_TEMPLATES } from "../../lib/starterCanvasTemplates";
import { cn } from "../ui/utils";

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
  /** Real tags from DesignMetadata / seed data (US-AI-040). */
  tags?: string[];
}

function formatTagLabel(tag: string): string {
  return tag
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function shareAnyTag(a: TemplateItem, b: TemplateItem): boolean {
  const aTags = a.tags ?? [];
  const bTags = b.tags ?? [];
  if (aTags.length === 0 || bTags.length === 0) return false;
  return aTags.some((tag) => bTags.includes(tag));
}

const starterTemplates: TemplateItem[] = STARTER_CANVAS_TEMPLATES.map((template) => ({
  id: template.id,
  title: template.name,
  description: template.description,
  uses: "Starter",
  badge: template.badge ?? template.category,
  badgeStyle: { backgroundColor: "var(--badge-starter-bg, #e0e7ff)", color: "var(--badge-starter-text, #312e81)" },
  image: template.image,
  tags: [
    ...(template.badge ? [template.badge.toLowerCase()] : []),
    template.category,
    ...(template.platformTag ? [template.platformTag] : []),
  ],
}));

export function TemplatesPage({ onOpenEditor }: TemplatesPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null);

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
    tags: Array.isArray(t.tags) ? t.tags : [],
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
    tags: Array.isArray(t.tags) ? t.tags : [],
  }));

  // Gallery shows: premium (from DB) + starter templates
  const allTemplates: TemplateItem[] = [
    ...premiumTemplates,
    ...starterTemplates,
  ];

  const availableChips = useMemo(() => {
    const set = new Set<string>();
    for (const template of allTemplates) {
      for (const tag of template.tags ?? []) {
        if (tag) set.add(tag);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allTemplates]);

  // Filter My Templates based on search
  const filteredMyTemplates = myTemplates.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Filter gallery templates — search + AND across active tag chips (AC5/AC8)
  const filteredTemplates = allTemplates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesChips =
      activeChips.length === 0 ||
      activeChips.every((chip) => template.tags?.includes(chip));

    return matchesSearch && matchesChips;
  });

  const moreLikeThis = useMemo(() => {
    if (!previewTemplate) return [];
    return allTemplates
      .filter((t) => String(t.id) !== String(previewTemplate.id) && shareAnyTag(t, previewTemplate))
      .slice(0, 4);
  }, [allTemplates, previewTemplate]);

  const toggleChip = (tag: string) => {
    setActiveChips((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setActiveChips([]);
  };

  const openPreview = (template: TemplateItem) => {
    setPreviewTemplate(template);
  };

  const onThumbnailKeyDown = (event: KeyboardEvent, template: TemplateItem) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPreview(template);
    }
  };

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

          {/* Search and tag chip filters (US-AI-040 AC5/AC6) */}
          <div className="flex flex-col gap-3">
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
            {availableChips.length > 0 && (
              <div
                className="flex flex-wrap items-center gap-2"
                role="group"
                aria-label="Template tag filters"
                data-testid="template-filter-chips"
              >
                {availableChips.map((tag) => {
                  const isActive = activeChips.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      data-testid="template-filter-chip"
                      data-tag={tag}
                      data-active={isActive ? "true" : "false"}
                      aria-pressed={isActive}
                      aria-label={
                        isActive
                          ? `${formatTagLabel(tag)} filter active, click to clear`
                          : `Filter by ${formatTagLabel(tag)}`
                      }
                      onClick={() => toggleChip(tag)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <span>{formatTagLabel(tag)}</span>
                      {isActive && <X className="w-3 h-3 opacity-90" aria-hidden />}
                    </button>
                  );
                })}
              </div>
            )}
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
                      <div
                        className="relative aspect-[4/3] overflow-hidden bg-muted flex items-center justify-center cursor-pointer"
                        data-testid="template-card-thumbnail"
                        role="button"
                        tabIndex={0}
                        aria-label={`Preview ${template.title}`}
                        onClick={() => openPreview(template)}
                        onKeyDown={(e) => onThumbnailKeyDown(e, template)}
                      >
                        <img
                          src={template.image}
                          alt={template.title}
                          className="w-full h-full object-contain pointer-events-none"
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
                    (Story, Header, A4…) never crops and all cards share height.
                    Thumbnail click opens preview (US-AI-040 AC1); Use Template
                    below still navigates directly (AC2). */}
                <div
                  className="relative aspect-[4/3] overflow-hidden bg-muted flex items-center justify-center cursor-pointer"
                  data-testid="template-card-thumbnail"
                  role="button"
                  tabIndex={0}
                  aria-label={`Preview ${template.title}`}
                  onClick={() => openPreview(template)}
                  onKeyDown={(e) => onThumbnailKeyDown(e, template)}
                >
                  <ImageWithFallback
                    src={template.image}
                    alt={template.title}
                    className="w-full h-full object-contain pointer-events-none"
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
            <div className="col-span-full flex flex-col items-center justify-center py-16" data-testid="templates-empty-state">
              <p className="text-muted-foreground mb-4">
                No templates found matching your criteria
              </p>
              <Button
                variant="outline"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/*
        Preview modal — US-AI-040 AC1/AC3/AC10.

        Two-pane layout: the render sits on the left, everything the user needs
        to decide (title, description, tags, primary action) on the right, with
        "More like this" as a horizontal rail underneath both.

        The image is NOT wrapped in a fixed `aspect-[]` box. An aspect-ratio box
        inside DialogContent's grid overflows its track when the dialog is
        height-capped and paints over whatever follows it — that is what buried
        the CTA and made it unclickable (elementFromPoint at the button's centre
        returned the <img>). Here the pane is a plain flex centre and the image
        is bounded by max-height instead, so it can never overlap the column
        beside or below it. It also means each template renders at its true
        aspect rather than being letterboxed into 4:3.
      */}
      <Dialog
        open={previewTemplate !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewTemplate(null);
        }}
      >
        <DialogContent
          className="w-[94vw] sm:max-w-[1060px] max-h-[88vh] p-0 gap-0 overflow-hidden flex flex-col"
          data-testid="template-preview-dialog"
        >
          {previewTemplate && (
            <div className="overflow-y-auto p-6 sm:p-7">
              <div className="grid gap-6 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
                {/* ── Render ── */}
                <div className="rounded-xl bg-muted flex items-center justify-center p-4 min-h-[240px]">
                  <ImageWithFallback
                    src={previewTemplate.image}
                    alt={previewTemplate.title}
                    className="max-h-[52vh] w-auto max-w-full object-contain rounded-md shadow-sm"
                  />
                </div>

                {/* ── Details + action ── */}
                <div className="flex flex-col min-w-0">
                  <DialogHeader className="space-y-2">
                    <DialogTitle className="text-2xl font-semibold leading-tight text-left">
                      {previewTemplate.title}
                    </DialogTitle>
                    <DialogDescription className="text-left">
                      {previewTemplate.description ||
                        "Preview this template before opening it in the editor."}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {previewTemplate.isPremium && (
                      <Badge
                        style={{
                          backgroundColor: "var(--badge-premium-bg, #0ca0eb)",
                          color: "var(--badge-premium-text, #ffffff)",
                        }}
                      >
                        Premium
                      </Badge>
                    )}
                    {previewTemplate.badge && (
                      <Badge style={previewTemplate.badgeStyle}>
                        {previewTemplate.badge}
                      </Badge>
                    )}
                    {(previewTemplate.tags ?? []).map((tag) => (
                      <Badge key={tag} variant="outline">
                        {formatTagLabel(tag)}
                      </Badge>
                    ))}
                  </div>

                  {/* Primary action sits with the details, not below the fold. */}
                  <div className="mt-6">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
                      data-testid="customise-template-cta"
                      onClick={() => {
                        const id = String(previewTemplate.id);
                        setPreviewTemplate(null);
                        onOpenEditor?.(id);
                      }}
                    >
                      Customise this template
                    </Button>
                  </div>
                </div>
              </div>

              {moreLikeThis.length > 0 && (
                <div data-testid="more-like-this" className="mt-8 space-y-3">
                  <h3 className="text-base font-semibold text-foreground">
                    More like this
                  </h3>
                  {/* Horizontal rail — scrolls rather than reflowing the modal. */}
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {moreLikeThis.map((related) => (
                      <button
                        key={related.id}
                        type="button"
                        className="group shrink-0 w-40 text-left rounded-lg border border-border overflow-hidden bg-background hover:border-primary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        onClick={() => setPreviewTemplate(related)}
                        data-testid="more-like-this-item"
                      >
                        <div className="h-24 bg-muted flex items-center justify-center overflow-hidden">
                          <ImageWithFallback
                            src={related.image}
                            alt={related.title}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <p className="px-2 py-1.5 text-xs text-foreground line-clamp-2 group-hover:text-primary">
                          {related.title}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
