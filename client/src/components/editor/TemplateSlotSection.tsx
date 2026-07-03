/**
 * TemplateSlotSection — compact slot-control widgets embedded inside the
 * Design / Property / Agent sidebar tabs.
 *
 * Usage: render <TemplateSection> inside a tab.  It renders nothing when no
 * matching slots exist on the canvas, so non-template designs are unaffected.
 *
 * The parent component must subscribe to `useCanvasStore((s) => s.elements)`
 * so slot values stay live as the user edits them.
 */

import { useRef } from "react";
import { Upload, ImageIcon, Sparkles } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import {
  getSlotValue,
  updateColorSlot,
  updateImageSlot,
  updateTextSlot,
} from "../../lib/templateSlots";

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

export interface SlotFieldDef {
  slot: string;
  label: string;
  control: "text" | "color" | "image";
  placeholder?: string;
  multiline?: boolean;
}

/* ------------------------------------------------------------------ */
/* Slot field catalogs used by each sidebar tab                        */
/* ------------------------------------------------------------------ */

export const BRAND_SLOT_FIELDS: SlotFieldDef[] = [
  { slot: "brand.logo",        label: "Brand Logo",           control: "image" },
  { slot: "brand.accentColor", label: "Accent Color",         control: "color" },
  { slot: "brand.name",        label: "Brand / Agency Name",  control: "text", placeholder: "Skyline Realty" },
];

export const PROPERTY_SLOT_FIELDS: SlotFieldDef[] = [
  { slot: "property.heroImage",    label: "Hero Image",        control: "image" },
  { slot: "property.galleryImage", label: "Secondary Image",   control: "image" },
  { slot: "property.headline",     label: "Headline",          control: "text", placeholder: "Skyline Signature Residences" },
  { slot: "property.price",        label: "Price",             control: "text", placeholder: "From ₹1.18 Cr" },
  { slot: "property.location",     label: "Location",          control: "text", placeholder: "Sarjapur Road, Bengaluru" },
  { slot: "property.facts",        label: "Key Facts",         control: "text", multiline: true },
  { slot: "property.features",     label: "Features",          control: "text", multiline: true },
  { slot: "property.description",  label: "Description",       control: "text", multiline: true },
  { slot: "property.specs",        label: "Specs",             control: "text", placeholder: "3 BHK · 2,480 sq.ft" },
  { slot: "openHouse.date",        label: "Open House Date",   control: "text", placeholder: "Sat 12 Jul, 11 AM – 2 PM" },
  { slot: "openHouse.time",        label: "Open House Time",   control: "text" },
  { slot: "report.headline",       label: "Report Headline",   control: "text" },
  { slot: "report.kpis",           label: "KPIs",              control: "text", multiline: true },
  { slot: "report.period",         label: "Report Period",     control: "text", placeholder: "Q2 2026" },
];

export const AGENT_SLOT_FIELDS: SlotFieldDef[] = [
  { slot: "agent.photo", label: "Agent Photo",        control: "image" },
  { slot: "agent.name",  label: "Agent Name",         control: "text", placeholder: "Aisha Sharma" },
  { slot: "agent.phone", label: "Phone",              control: "text", placeholder: "+91 90000 00000" },
  { slot: "agent.email", label: "Email",              control: "text", placeholder: "agent@agency.in" },
  { slot: "agent.rera",  label: "RERA ID",            control: "text", placeholder: "PRM/KA/RERA/1254/..." },
  { slot: "agent.cta",   label: "Call-to-Action Text",control: "text", placeholder: "Schedule a Site Visit" },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------------ */
/* SlotControl — renders one field based on its control type           */
/* ------------------------------------------------------------------ */

export function SlotControl({
  field,
  activeSlots,
}: {
  field: SlotFieldDef;
  activeSlots: ReadonlySet<string>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  if (!activeSlots.has(field.slot)) return null;

  const value = getSlotValue(field.slot) ?? "";

  /* Image upload */
  if (field.control === "image") {
    const hasUserImage = value && !value.startsWith("data:image/svg");
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">{field.label}</Label>
        <div className="flex items-center gap-3">
          <div className="h-14 w-20 shrink-0 rounded-md border border-dashed border-border bg-muted flex items-center justify-center overflow-hidden">
            {hasUserImage ? (
              <img src={value} alt={field.label} className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) updateImageSlot(field.slot, await readFileAsDataUrl(file));
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Upload className="w-3 h-3" />
            Upload
          </button>
        </div>
      </div>
    );
  }

  /* Color picker */
  if (field.control === "color") {
    const safeHex = /^#[0-9a-f]{6}$/i.test(value) ? value : "#0ca0eb";
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">{field.label}</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={safeHex}
            onChange={(e) => updateColorSlot(field.slot, e.target.value)}
            className="h-8 w-10 shrink-0 rounded border border-border bg-background cursor-pointer p-0.5"
            aria-label={field.label}
          />
          <Input
            value={value}
            placeholder="#0ca0eb"
            onChange={(e) => updateColorSlot(field.slot, e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>
    );
  }

  /* Text — single-line or multiline */
  if (field.multiline) {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">{field.label}</Label>
        <textarea
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => updateTextSlot(field.slot, e.target.value)}
          rows={2}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{field.label}</Label>
      <Input
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => updateTextSlot(field.slot, e.target.value)}
        className="h-8 text-xs"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TemplateSection — section wrapper; renders null when no slots match */
/* ------------------------------------------------------------------ */

interface TemplateSectionProps {
  title: string;
  subtitle: string;
  fields: SlotFieldDef[];
  activeSlots: ReadonlySet<string>;
}

export function TemplateSection({
  title,
  subtitle,
  fields,
  activeSlots,
}: TemplateSectionProps) {
  const visibleFields = fields.filter((f) => activeSlots.has(f.slot));
  if (visibleFields.length === 0) return null;

  return (
    <>
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
          <div>
            <p className="text-xs font-semibold text-foreground leading-none">{title}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="space-y-3">
          {visibleFields.map((f) => (
            <SlotControl key={f.slot} field={f} activeSlots={activeSlots} />
          ))}
        </div>
      </div>
      <Separator />
    </>
  );
}
