/**
 * CustomizePanel — sidebar tab that lets users quickly customize a premium
 * template's branding + content via the slot system. Each field is bound to
 * a `slot` tag on a canvas element (see templateSlots.ts), so editing a
 * field updates the matching element live with a single undo step.
 *
 * Adaptive: only fields whose slot exists on the current canvas are shown,
 * so the same panel works across all 5 premium templates without per-
 * template branching. Legacy designs without slots get a graceful hint.
 */

import { useRef } from "react";
import { Upload, Sparkles, Palette, Building2, User, ImageIcon } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { useCanvasStore } from "../../hooks/useCanvasStore";
import {
  canvasHasSlots,
  getSlotValue,
  updateColorSlot,
  updateImageSlot,
  updateTextSlot,
} from "../../lib/templateSlots";

type ControlKind = "text" | "color" | "image";
type Group = "brand" | "property" | "agent";

interface SlotField {
  slot: string;
  label: string;
  group: Group;
  control: ControlKind;
  placeholder?: string;
}

/** Canonical slot vocabulary — keep in sync with premiumTemplates.ts. */
const SLOT_MANIFEST: SlotField[] = [
  // Brand
  { slot: "brand.logo", label: "Brand Logo", group: "brand", control: "image" },
  { slot: "brand.accentColor", label: "Accent Color", group: "brand", control: "color" },
  { slot: "brand.name", label: "Brand / Agency Name", group: "brand", control: "text", placeholder: "Skyline Realty" },
  // Property
  { slot: "property.heroImage", label: "Hero Image", group: "property", control: "image" },
  { slot: "property.galleryImage", label: "Secondary Image", group: "property", control: "image" },
  { slot: "property.headline", label: "Headline", group: "property", control: "text", placeholder: "Skyline Signature Residences" },
  { slot: "property.price", label: "Price", group: "property", control: "text", placeholder: "Starting from ₹1.18 Cr" },
  { slot: "property.facts", label: "Key Facts (one per line)", group: "property", control: "text" },
  { slot: "property.features", label: "Features (one per line)", group: "property", control: "text" },
  { slot: "property.location", label: "Location", group: "property", control: "text", placeholder: "Sarjapur Road, Bengaluru" },
  { slot: "property.description", label: "Description", group: "property", control: "text" },
  { slot: "property.specs", label: "Specs (beds / baths / area)", group: "property", control: "text" },
  { slot: "openHouse.date", label: "Open House Date", group: "property", control: "text", placeholder: "Sat 12 Jul, 11:00 AM – 2:00 PM" },
  { slot: "openHouse.time", label: "Open House Time", group: "property", control: "text" },
  { slot: "report.headline", label: "Report Headline", group: "property", control: "text" },
  { slot: "report.kpis", label: "KPIs (one per line)", group: "property", control: "text" },
  { slot: "report.period", label: "Report Period", group: "property", control: "text", placeholder: "Q2 2026" },
  // Agent
  { slot: "agent.name", label: "Agent Name", group: "agent", control: "text", placeholder: "Aisha Sharma" },
  { slot: "agent.phone", label: "Phone", group: "agent", control: "text", placeholder: "+91 90000 00000" },
  { slot: "agent.email", label: "Email", group: "agent", control: "text", placeholder: "aisha@skylinerealty.in" },
  { slot: "agent.photo", label: "Agent Photo", group: "agent", control: "image" },
  { slot: "agent.rera", label: "RERA ID", group: "agent", control: "text", placeholder: "PRM/KA/RERA/1254/..." },
  { slot: "agent.cta", label: "Call-to-Action Text", group: "agent", control: "text", placeholder: "Schedule a Site Visit" },
];

const GROUP_META: Record<Group, { title: string; icon: typeof Palette; hint: string }> = {
  brand: { title: "Brand", icon: Palette, hint: "Logo, accent color, and agency name" },
  property: { title: "Property", icon: Building2, hint: "Hero image, headline, price, and key details" },
  agent: { title: "Agent", icon: User, hint: "Contact details, photo, and RERA id" },
};

const GROUP_ORDER: Group[] = ["brand", "property", "agent"];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function CustomizePanel() {
  // Subscribe to elements so slot values stay live as the canvas changes.
  const elements = useCanvasStore((s) => s.elements);
  const hasSlots = canvasHasSlots();

  // Active slots deduped — drives which fields render.
  const activeSlots = new Set(
    elements.map((el) => el.slot).filter((s): s is string => Boolean(s)),
  );

  if (!hasSlots) {
    return (
      <ScrollArea className="h-full">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-medium">Customize</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Quick brand customization is available for premium templates. Open one
            from the Templates gallery to swap your logo, hero image, colors, and
            agent details from here.
          </p>
          <Separator />
          <p className="text-xs text-muted-foreground">
            For this design, edit elements directly on the canvas or use the
            Design tab for styles.
          </p>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-medium">Customize</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Swap your branding and content — changes apply live to the design.
          </p>
        </div>

        {GROUP_ORDER.map((group) => {
          const fields = SLOT_MANIFEST.filter(
            (f) => f.group === group && activeSlots.has(f.slot),
          );
          if (fields.length === 0) return null;
          const meta = GROUP_META[group];
          const Icon = meta.icon;
          return (
            <div key={group} className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">{meta.title}</h4>
              </div>
              <p className="text-xs text-muted-foreground -mt-1">{meta.hint}</p>
              <div className="space-y-3">
                {fields.map((field) => (
                  <SlotControl key={field.slot} field={field} />
                ))}
              </div>
              <Separator />
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

function SlotControl({ field }: { field: SlotField }) {
  const value = getSlotValue(field.slot) ?? "";

  if (field.control === "image") {
    return <ImageSlotControl field={field} currentValue={value} />;
  }

  if (field.control === "color") {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">{field.label}</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value && /^#[0-9a-f]{6}$/i.test(value) ? value : "#0ca0eb"}
            onChange={(e) => updateColorSlot(field.slot, e.target.value)}
            className="h-9 w-12 rounded-md border border-border bg-background cursor-pointer p-0.5"
            aria-label={field.label}
          />
          <Input
            value={value}
            placeholder="#0ca0eb"
            onChange={(e) => updateColorSlot(field.slot, e.target.value)}
            className="h-9 text-xs"
          />
        </div>
      </div>
    );
  }

  // text — multiline for list-style slots (facts/features/kpis/description/specs)
  const isMultiline = /facts|features|kpis|description|specs/.test(field.slot);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{field.label}</Label>
      {isMultiline ? (
        <textarea
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => updateTextSlot(field.slot, e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border bg-input-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      ) : (
        <Input
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => updateTextSlot(field.slot, e.target.value)}
          className="h-9 text-xs"
        />
      )}
    </div>
  );
}

function ImageSlotControl({
  field,
  currentValue,
}: {
  field: SlotField;
  currentValue: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    updateImageSlot(field.slot, dataUrl);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{field.label}</Label>
      <div className="flex items-center gap-3">
        <div className="h-16 w-24 shrink-0 rounded-md border border-dashed border-border bg-muted flex items-center justify-center overflow-hidden">
          {currentValue ? (
            <img src={currentValue} alt={field.label} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
            id={`slot-${field.slot}`}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}
