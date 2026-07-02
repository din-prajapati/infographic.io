/**
 * Premium Sample Templates — 5 format-correct, pixel-perfect infographic
 * designs aligned with the landing-page offering (Story, Square, A4 Print
 * Flyer, Email Header, MLS Listing Sheet).
 *
 * Each template:
 *  - is authored at the exact pixel dimensions for its channel
 *  - ships an inline SVG thumbnail that is a pixel-accurate mini-render
 *  - tags elements with `slot` so the sidebar CustomizePanel can swap
 *    branding (logo, accent color), property content (hero, headline,
 *    price), and agent info live
 *  - uses no AI model names anywhere (rule 5 — Model Opacity)
 *
 * Templates are client-side only (same pattern as starterCanvasTemplates);
 * they do not require rows in the backend `Template` table.
 */

import type { StarterCanvasTemplate } from "./starterCanvasTemplates";

/* ------------------------------------------------------------------ */
/* Element helpers                                                     */
/* ------------------------------------------------------------------ */

function svgThumbnail(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function placeholderImage(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const HERO_PLACEHOLDER = placeholderImage(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <defs>
    <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1e3a8a"/>
      <stop offset="1" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#hg)"/>
  <g fill="#ffffff" opacity="0.18">
    <rect x="120" y="520" width="220" height="300" rx="8"/>
    <rect x="380" y="430" width="260" height="390" rx="8"/>
    <rect x="680" y="360" width="300" height="460" rx="8"/>
  </g>
  <circle cx="980" cy="180" r="70" fill="#fde68a" opacity="0.8"/>
  <text x="600" y="860" text-anchor="middle" font-family="Inter, sans-serif" font-size="34" fill="#ffffff" opacity="0.5">Replace hero image</text>
</svg>
`);

const LOGO_PLACEHOLDER = placeholderImage(`
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80" viewBox="0 0 240 80">
  <rect width="240" height="80" rx="12" fill="#ffffff" opacity="0.14"/>
  <text x="120" y="48" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="26" fill="#ffffff">LOGO</text>
</svg>
`);

const PHOTO_PLACEHOLDER = placeholderImage(`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" rx="100" fill="#e2e8f0"/>
  <circle cx="100" cy="78" r="34" fill="#94a3b8"/>
  <rect x="56" y="120" width="88" height="80" rx="44" fill="#94a3b8"/>
</svg>
`);

interface BoxOpts {
  slot?: string;
  zIndex?: number;
  cornerRadius?: number;
  opacity?: number;
  fill?: string;
}
function box(
  id: string,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fillOrOpts: string | BoxOpts,
  opts: BoxOpts = {},
): Record<string, unknown> {
  // Accept either `box(..., "#fff", { ... })` or `box(..., { fill: "#fff", ... })`
  const fill = typeof fillOrOpts === "string" ? fillOrOpts : fillOrOpts.fill ?? "#000000";
  const o = typeof fillOrOpts === "string" ? opts : fillOrOpts;
  return {
    id,
    type: "shape",
    name,
    shapeType: "rectangle",
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: o.opacity ?? 1,
    locked: false,
    visible: true,
    zIndex: o.zIndex ?? 1,
    fill,
    stroke: "transparent",
    strokeWidth: 0,
    cornerRadius: o.cornerRadius ?? 8,
    slot: o.slot,
  };
}

interface TextOpts {
  slot?: string;
  weight?: number;
  align?: "left" | "center" | "right";
  zIndex?: number;
  lineHeight?: number;
}
function text(
  id: string,
  name: string,
  content: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number,
  color: string,
  opts: TextOpts = {},
): Record<string, unknown> {
  const weight = opts.weight ?? 600;
  return {
    id,
    type: "text",
    name,
    content,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    zIndex: opts.zIndex ?? 2,
    fontFamily: "Inter",
    fontSize,
    fontWeight: weight,
    bold: weight >= 700,
    italic: false,
    underline: false,
    strikethrough: false,
    color,
    align: opts.align ?? "left",
    lineHeight: opts.lineHeight ?? 1.2,
    textTransform: "none",
    listStyle: "none",
    slot: opts.slot,
  };
}

interface ImgOpts {
  slot?: string;
  objectFit?: "contain" | "cover" | "fill";
  cornerRadius?: number;
  zIndex?: number;
}
function img(
  id: string,
  name: string,
  src: string,
  x: number,
  y: number,
  width: number,
  height: number,
  opts: ImgOpts = {},
): Record<string, unknown> {
  return {
    id,
    type: "image",
    name,
    src,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    zIndex: opts.zIndex ?? 1,
    objectFit: opts.objectFit ?? "cover",
    cornerRadius: opts.cornerRadius ?? 0,
    flipHorizontal: false,
    flipVertical: false,
    colorOverlay: null,
    filters: { brightness: 100, contrast: 100, saturation: 100 },
    slot: opts.slot,
  };
}

/* ------------------------------------------------------------------ */
/* 1. Premium Listing — Instagram / WhatsApp Story (1080 × 1920)       */
/* ------------------------------------------------------------------ */

const THUMB_STORY = svgThumbnail(`
<svg xmlns="http://www.w3.org/2000/svg" width="270" height="480" viewBox="0 0 270 480">
  <rect width="270" height="480" fill="#0f172a"/>
  <rect x="0" y="0" width="270" height="300" fill="#1e3a8a"/>
  <rect x="0" y="220" width="270" height="120" fill="url(#sg)" opacity="0.6"/>
  <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f172a" stop-opacity="0"/><stop offset="1" stop-color="#0f172a"/></linearGradient></defs>
  <rect x="14" y="18" width="60" height="20" rx="6" fill="#ffffff" opacity="0.18"/>
  <rect x="20" y="250" width="200" height="22" rx="4" fill="#ffffff"/>
  <rect x="20" y="280" width="120" height="14" rx="4" fill="#fde68a"/>
  <rect x="20" y="320" width="70" height="22" rx="11" fill="#ffffff" opacity="0.22"/>
  <rect x="100" y="320" width="70" height="22" rx="11" fill="#ffffff" opacity="0.22"/>
  <rect x="180" y="320" width="70" height="22" rx="11" fill="#ffffff" opacity="0.22"/>
  <rect x="0" y="430" width="270" height="50" fill="#0ca0eb"/>
</svg>
`);

/* ------------------------------------------------------------------ */
/* 2. Luxury Home Showcase — Square Post (1080 × 1080)                 */
/* ------------------------------------------------------------------ */

const THUMB_SQUARE = svgThumbnail(`
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#ffffff"/>
  <rect x="0" y="0" width="165" height="300" fill="#1e3a8a"/>
  <rect x="180" y="24" width="100" height="14" rx="6" fill="#0f172a"/>
  <rect x="180" y="50" width="105" height="20" rx="4" fill="#0f172a"/>
  <rect x="180" y="82" width="80" height="16" rx="4" fill="#fde68a"/>
  <rect x="180" y="116" width="105" height="10" rx="3" fill="#475569"/>
  <rect x="180" y="134" width="95" height="10" rx="3" fill="#475569"/>
  <rect x="180" y="152" width="100" height="10" rx="3" fill="#475569"/>
  <rect x="180" y="170" width="80" height="10" rx="3" fill="#475569"/>
  <rect x="180" y="220" width="105" height="64" rx="8" fill="#f1f5f9"/>
  <circle cx="200" cy="252" r="14" fill="#cbd5e1"/>
</svg>
`);

/* ------------------------------------------------------------------ */
/* 3. Open House Flyer — A4 Print (2480 × 3508, 300 DPI)               */
/* ------------------------------------------------------------------ */

const THUMB_FLYER = svgThumbnail(`
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="339" viewBox="0 0 240 339">
  <rect width="240" height="339" fill="#ffffff"/>
  <rect x="0" y="0" width="240" height="46" fill="#14532d"/>
  <rect x="16" y="14" width="120" height="14" rx="3" fill="#ffffff"/>
  <rect x="180" y="12" width="44" height="18" rx="9" fill="#fde68a"/>
  <rect x="16" y="62" width="208" height="120" rx="6" fill="#1e3a8a"/>
  <rect x="16" y="194" width="150" height="20" rx="3" fill="#0f172a"/>
  <rect x="16" y="222" width="90" height="16" rx="3" fill="#0ca0eb"/>
  <rect x="16" y="252" width="98" height="30" rx="4" fill="#f1f5f9"/>
  <rect x="122" y="252" width="98" height="30" rx="4" fill="#f1f5f9"/>
  <rect x="16" y="290" width="98" height="30" rx="4" fill="#f1f5f9"/>
  <rect x="122" y="290" width="98" height="30" rx="4" fill="#f1f5f9"/>
  <rect x="0" y="326" width="240" height="13" fill="#0f172a"/>
</svg>
`);

/* ------------------------------------------------------------------ */
/* 4. Market Report — Email / LinkedIn Header (1200 × 400)             */
/* ------------------------------------------------------------------ */

const THUMB_HEADER = svgThumbnail(`
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="107" viewBox="0 0 320 107">
  <rect width="320" height="107" fill="#0f172a"/>
  <rect x="0" y="0" width="200" height="107" fill="#1e3a8a"/>
  <rect x="20" y="20" width="60" height="14" rx="6" fill="#ffffff" opacity="0.2"/>
  <rect x="20" y="42" width="160" height="18" rx="3" fill="#ffffff"/>
  <rect x="20" y="74" width="40" height="20" rx="3" fill="#fde68a"/>
  <rect x="68" y="74" width="40" height="20" rx="3" fill="#ffffff" opacity="0.6"/>
  <rect x="116" y="74" width="40" height="20" rx="3" fill="#ffffff" opacity="0.6"/>
  <rect x="250" y="30" width="60" height="48" rx="6" fill="#0ca0eb"/>
</svg>
`);

/* ------------------------------------------------------------------ */
/* 5. MLS Listing Sheet — Landscape (1280 × 960)                       */
/* ------------------------------------------------------------------ */

const THUMB_MLS = svgThumbnail(`
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
  <rect width="320" height="240" fill="#ffffff"/>
  <rect x="0" y="0" width="320" height="34" fill="#0f172a"/>
  <rect x="14" y="10" width="60" height="14" rx="6" fill="#ffffff" opacity="0.25"/>
  <rect x="14" y="48" width="180" height="120" rx="6" fill="#1e3a8a"/>
  <rect x="202" y="48" width="104" height="58" rx="6" fill="#3b82f6"/>
  <rect x="202" y="110" width="104" height="58" rx="6" fill="#93c5fd"/>
  <rect x="14" y="178" width="120" height="12" rx="3" fill="#0f172a"/>
  <rect x="14" y="198" width="292" height="10" rx="3" fill="#94a3b8"/>
  <rect x="14" y="214" width="240" height="10" rx="3" fill="#94a3b8"/>
  <rect x="14" y="230" width="120" height="6" rx="3" fill="#0ca0eb"/>
</svg>
`);

/* ------------------------------------------------------------------ */
/* Template definitions                                                 */
/* ------------------------------------------------------------------ */

export const PREMIUM_CANVAS_TEMPLATES: StarterCanvasTemplate[] = [
  /* 1 — Story --------------------------------------------------------- */
  {
    id: "premium-ig-story-listing",
    name: "Premium Listing — Story",
    description: "Vertical 9:16 social story with hero, price chip, key facts, and CTA",
    category: "project-launch",
    image: THUMB_STORY,
    badge: "9:16",
    premium: true,
    canvasData: {
      version: "1.0",
      canvasWidth: 1080,
      canvasHeight: 1920,
      backgroundColor: "#0f172a",
      zoom: 1,
      elements: [
        img("ps-hero", "Hero Image", HERO_PLACEHOLDER, 0, 0, 1080, 1152, { slot: "property.heroImage", zIndex: 0 }),
        box("ps-scrim", "Hero Scrim", 0, 720, 1080, 432, { fill: "#0f172a", zIndex: 1, opacity: 0.55 }),
        box("ps-brandbar", "Brand Bar", 0, 0, 1080, 96, { fill: "#0f172a", zIndex: 2, opacity: 0.55 }),
        img("ps-logo", "Brand Logo", LOGO_PLACEHOLDER, 40, 24, 200, 56, { slot: "brand.logo", objectFit: "contain", zIndex: 3 }),
        box("ps-accent", "Accent Strip", 0, 1536, 1080, 8, { fill: "#0ca0eb", slot: "brand.accentColor", zIndex: 2 }),
        text("ps-headline", "Headline", "Skyline Signature Residences", 56, 880, 968, 220, 64, "#ffffff", { slot: "property.headline", weight: 800, lineHeight: 1.1, zIndex: 3 }),
        text("ps-sub", "Subtitle", "Ultra-spacious 3 & 4 BHK skyline homes", 56, 1100, 968, 60, 30, "#dbeafe", { slot: "property.location", weight: 500, zIndex: 3 }),
        box("ps-pricechip", "Price Chip", 56, 1184, 420, 72, { fill: "#fde68a", cornerRadius: 36, zIndex: 3 }),
        text("ps-price", "Price", "From ₹1.18 Cr", 80, 1200, 380, 44, 32, "#1f2937", { slot: "property.price", weight: 800, align: "center", zIndex: 4 }),
        text("ps-facts", "Key Facts", "42 curated amenities\n2 mins to ORR\nPossession Dec 2027", 56, 1296, 968, 180, 28, "#e2e8f0", { slot: "property.facts", weight: 600, lineHeight: 1.5, zIndex: 3 }),
        box("ps-cta", "CTA Bar", 0, 1752, 1080, 168, { fill: "#0ca0eb", zIndex: 2 }),
        text("ps-cta-text", "CTA Text", "Schedule a Site Visit  ·  +91 90000 00000", 56, 1776, 968, 60, 30, "#ffffff", { slot: "agent.cta", weight: 700, align: "center", zIndex: 3 }),
        text("ps-agent", "Agent", "Aisha Sharma  ·  RERA PRM/KA/RERA/1254", 56, 1856, 968, 40, 22, "#e0f2fe", { slot: "agent.name", weight: 600, align: "center", zIndex: 3 }),
      ],
    },
  },

  /* 2 — Square -------------------------------------------------------- */
  {
    id: "premium-square-listing",
    name: "Luxury Home Showcase",
    description: "1:1 social post — hero left, brand + price + features right",
    category: "project-launch",
    image: THUMB_SQUARE,
    badge: "1:1",
    premium: true,
    canvasData: {
      version: "1.0",
      canvasWidth: 1080,
      canvasHeight: 1080,
      backgroundColor: "#ffffff",
      zoom: 1,
      elements: [
        img("sq-hero", "Hero Image", HERO_PLACEHOLDER, 0, 0, 594, 1080, { slot: "property.heroImage", zIndex: 0 }),
        box("sq-panel", "Info Panel", 594, 0, 486, 1080, { fill: "#ffffff", zIndex: 1 }),
        img("sq-logo", "Brand Logo", LOGO_PLACEHOLDER, 624, 48, 240, 64, { slot: "brand.logo", objectFit: "contain", zIndex: 2 }),
        text("sq-brand", "Brand Name", "SKYLINE REALTY", 624, 120, 432, 28, 20, "#0ca0eb", { slot: "brand.name", weight: 700, zIndex: 2 }),
        box("sq-accent", "Accent", 624, 168, 80, 6, { fill: "#0ca0eb", slot: "brand.accentColor", zIndex: 2 }),
        text("sq-headline", "Headline", "Skyline\nSignature\nResidences", 624, 200, 432, 200, 44, "#0f172a", { slot: "property.headline", weight: 800, lineHeight: 1.05, zIndex: 2 }),
        box("sq-pricechip", "Price Chip", 624, 420, 360, 56, { fill: "#fde68a", cornerRadius: 28, zIndex: 2 }),
        text("sq-price", "Price", "From ₹1.18 Cr", 644, 432, 320, 32, 24, "#1f2937", { slot: "property.price", weight: 800, align: "center", zIndex: 3 }),
        text("sq-features", "Features", "• 3 & 4 BHK skyline homes\n• 42 curated amenities\n• 2 mins to ORR tech park\n• Clubhouse 45,000 sq.ft", 624, 512, 432, 220, 24, "#475569", { slot: "property.features", weight: 500, lineHeight: 1.6, zIndex: 2 }),
        box("sq-agentcard", "Agent Card", 624, 824, 432, 200, { fill: "#f1f5f9", cornerRadius: 16, zIndex: 2 }),
        img("sq-photo", "Agent Photo", PHOTO_PLACEHOLDER, 656, 856, 136, 136, { slot: "agent.photo", objectFit: "cover", cornerRadius: 68, zIndex: 3 }),
        text("sq-agentname", "Agent Name", "Aisha Sharma", 816, 872, 220, 32, 24, "#0f172a", { slot: "agent.name", weight: 700, zIndex: 3 }),
        text("sq-agentphone", "Agent Phone", "+91 90000 00000", 816, 908, 220, 26, 18, "#475569", { slot: "agent.phone", weight: 500, zIndex: 3 }),
        text("sq-agentrera", "Agent RERA", "RERA PRM/KA/RERA/1254", 816, 940, 220, 24, 16, "#0ca0eb", { slot: "agent.rera", weight: 600, zIndex: 3 }),
      ],
    },
  },

  /* 3 — A4 Print Flyer ------------------------------------------------ */
  {
    id: "premium-open-house-flyer",
    name: "Open House Flyer — Print Ready",
    description: "A4 portrait at 300 DPI — print-ready, with bleed-safe layout",
    category: "project-launch",
    image: THUMB_FLYER,
    badge: "A4 · 300dpi",
    premium: true,
    canvasData: {
      version: "1.0",
      canvasWidth: 2480,
      canvasHeight: 3508,
      backgroundColor: "#ffffff",
      zoom: 1,
      elements: [
        box("oh-header", "Header Band", 0, 0, 2480, 360, { fill: "#14532d", zIndex: 1 }),
        text("oh-title", "Open House Title", "OPEN HOUSE", 120, 96, 1400, 120, 88, "#ffffff", { weight: 800, zIndex: 2 }),
        box("oh-datechip", "Date Chip", 1960, 88, 400, 184, { fill: "#fde68a", cornerRadius: 24, zIndex: 2 }),
        text("oh-date", "Date", "SAT 12 JUL\n11 AM – 2 PM", 1992, 112, 336, 140, 34, "#1f2937", { slot: "openHouse.date", weight: 800, align: "center", lineHeight: 1.3, zIndex: 3 }),
        img("oh-hero", "Hero Image", HERO_PLACEHOLDER, 120, 440, 2240, 1280, { slot: "property.heroImage", zIndex: 1, cornerRadius: 16 }),
        img("oh-logo", "Brand Logo", LOGO_PLACEHOLDER, 120, 1800, 360, 120, { slot: "brand.logo", objectFit: "contain", zIndex: 2 }),
        text("oh-headline", "Headline", "Skyline Signature Residences", 540, 1812, 1820, 120, 72, "#0f172a", { slot: "property.headline", weight: 800, zIndex: 2 }),
        box("oh-accent", "Accent", 540, 1948, 120, 8, { fill: "#0ca0eb", slot: "brand.accentColor", zIndex: 2 }),
        text("oh-price", "Price", "Starting from ₹1.18 Cr", 540, 1980, 1820, 64, 44, "#0ca0eb", { slot: "property.price", weight: 800, zIndex: 2 }),
        // Feature grid 2×3
        ...[
          ["oh-f1", 120, 2080, "3 & 4 BHK Skyline Homes"],
          ["oh-f2", 1280, 2080, "42 Curated Amenities"],
          ["oh-f3", 120, 2280, "2 Mins to ORR Tech Park"],
          ["oh-f4", 1280, 2280, "Clubhouse 45,000 sq.ft"],
          ["oh-f5", 120, 2480, "RERA Registered Project"],
          ["oh-f6", 1280, 2480, "Possession Dec 2027"],
        ].flatMap(([id, x, y, label]) => [
          box(`${id}-bg`, `${id} bg`, x as number, y as number, 1080, 160, { fill: "#f1f5f9", cornerRadius: 16, zIndex: 2 }),
          text(`${id}-txt`, `${id} text`, label as string, (x as number) + 40, (y as number) + 48, 1000, 64, 36, "#0f172a", { weight: 700, zIndex: 3 }),
        ]),
        box("oh-locstrip", "Location Strip", 120, 2700, 2240, 120, { fill: "#ecfeff", cornerRadius: 16, zIndex: 2 }),
        text("oh-location", "Location", "Sarjapur Road, Bengaluru  —  Premium micro-market with upcoming metro extension", 160, 2732, 2160, 56, 32, "#0f766e", { slot: "property.location", weight: 600, zIndex: 3 }),
        // Agent footer
        img("oh-photo", "Agent Photo", PHOTO_PLACEHOLDER, 120, 2880, 200, 200, { slot: "agent.photo", objectFit: "cover", cornerRadius: 100, zIndex: 2 }),
        text("oh-agentname", "Agent Name", "Aisha Sharma", 360, 2900, 1200, 56, 44, "#0f172a", { slot: "agent.name", weight: 800, zIndex: 2 }),
        text("oh-agentphone", "Agent Phone", "+91 90000 00000  ·  aisha@skylinerealty.in", 360, 2960, 1800, 44, 30, "#475569", { slot: "agent.phone", weight: 500, zIndex: 2 }),
        text("oh-agentrera", "Agent RERA", "RERA: PRM/KA/RERA/1254  ·  Skyline Realty", 360, 3012, 1800, 40, 26, "#0ca0eb", { slot: "agent.rera", weight: 600, zIndex: 2 }),
        box("oh-footbar", "Footer Bar", 0, 3380, 2480, 128, { fill: "#0f172a", zIndex: 1 }),
        text("oh-disclaim", "Disclaimer", "Prices are indicative and exclusive of taxes & registration. Images are artistic impressions. T&C apply.", 120, 3416, 2240, 48, 24, "#94a3b8", { weight: 500, zIndex: 2 }),
      ],
    },
  },

  /* 4 — Market Report Header ----------------------------------------- */
  {
    id: "premium-market-report",
    name: "Market Report — Email Header",
    description: "3:1 email / LinkedIn header with KPI row and CTA",
    category: "progress-trust",
    image: THUMB_HEADER,
    badge: "3:1",
    premium: true,
    canvasData: {
      version: "1.0",
      canvasWidth: 1200,
      canvasHeight: 400,
      backgroundColor: "#0f172a",
      zoom: 1,
      elements: [
        box("mr-left", "Left Panel", 0, 0, 720, 400, { fill: "#1e3a8a", zIndex: 0 }),
        img("mr-logo", "Brand Logo", LOGO_PLACEHOLDER, 48, 40, 180, 56, { slot: "brand.logo", objectFit: "contain", zIndex: 2 }),
        text("mr-period", "Period", "Q2 2026 MARKET REPORT", 48, 108, 620, 28, 20, "#fde68a", { slot: "report.period", weight: 700, zIndex: 2 }),
        text("mr-headline", "Headline", "Bengaluru Residential Sales Up 18% QoQ", 48, 146, 640, 96, 40, "#ffffff", { slot: "report.headline", weight: 800, lineHeight: 1.1, zIndex: 2 }),
        text("mr-kpis", "KPIs", "Sales +18%\nNew Launches 24\nAvg Price ₹6,800/sq.ft", 48, 244, 620, 120, 26, "#dbeafe", { slot: "report.kpis", weight: 700, lineHeight: 1.5, zIndex: 2 }),
        box("mr-accent", "Accent Strip", 0, 392, 1200, 8, { fill: "#0ca0eb", slot: "brand.accentColor", zIndex: 2 }),
        box("mr-cta", "CTA Button", 880, 144, 280, 112, { fill: "#0ca0eb", cornerRadius: 16, zIndex: 2 }),
        text("mr-ctatext", "CTA Text", "Read Full\nReport", 904, 168, 232, 64, 30, "#ffffff", { slot: "agent.cta", weight: 800, align: "center", lineHeight: 1.15, zIndex: 3 }),
        text("mr-agent", "Agent", "By Aisha Sharma · Skyline Realty", 824, 288, 360, 28, 18, "#cbd5e1", { slot: "agent.name", weight: 600, align: "center", zIndex: 2 }),
      ],
    },
  },

  /* 5 — MLS Listing Sheet -------------------------------------------- */
  {
    id: "premium-mls-listing-sheet",
    name: "MLS Listing Sheet",
    description: "Landscape MLS-ready sheet — 2-up images, specs table, agent footer",
    category: "project-launch",
    image: THUMB_MLS,
    badge: "MLS",
    premium: true,
    canvasData: {
      version: "1.0",
      canvasWidth: 1280,
      canvasHeight: 960,
      backgroundColor: "#ffffff",
      zoom: 1,
      elements: [
        box("ml-header", "Header", 0, 0, 1280, 96, { fill: "#0f172a", zIndex: 1 }),
        img("ml-logo", "Brand Logo", LOGO_PLACEHOLDER, 32, 24, 200, 48, { slot: "brand.logo", objectFit: "contain", zIndex: 2 }),
        text("ml-brand", "Brand Name", "SKYLINE REALTY", 248, 32, 600, 32, 24, "#ffffff", { slot: "brand.name", weight: 700, zIndex: 2 }),
        text("ml-listing", "Listing Label", "LISTING SHEET", 1010, 32, 240, 32, 22, "#fde68a", { slot: "report.period", weight: 700, align: "right", zIndex: 2 }),
        img("ml-hero", "Hero Image", HERO_PLACEHOLDER, 32, 128, 720, 480, { slot: "property.heroImage", zIndex: 1, cornerRadius: 12 }),
        img("ml-gallery", "Secondary Image", HERO_PLACEHOLDER, 784, 128, 464, 232, { slot: "property.galleryImage", zIndex: 1, cornerRadius: 12 }),
        box("ml-specbg2", "Spec Card 2 bg", 784, 376, 464, 232, { fill: "#f1f5f9", cornerRadius: 12, zIndex: 1 }),
        text("ml-specs", "Specs", "Beds: 4\nBaths: 4\nArea: 2,480 sq.ft\nPrice: ₹1.18 Cr", 816, 408, 400, 180, 28, "#0f172a", { slot: "property.specs", weight: 700, lineHeight: 1.5, zIndex: 2 }),
        text("ml-headline", "Headline", "Skyline Signature Residences — 4 BHK Skyline Home", 32, 632, 1216, 48, 34, "#0f172a", { slot: "property.headline", weight: 800, zIndex: 2 }),
        box("ml-accent", "Accent", 32, 688, 96, 6, { fill: "#0ca0eb", slot: "brand.accentColor", zIndex: 2 }),
        text("ml-desc", "Description", "Ultra-spacious 4 BHK skyline-facing home with private deck, premium finishes, and access to 42 curated amenities. Located 2 mins from ORR tech corridor with top social infrastructure.", 32, 712, 1216, 112, 24, "#475569", { slot: "property.description", weight: 500, lineHeight: 1.5, zIndex: 2 }),
        box("ml-footbar", "Footer Bar", 0, 832, 1280, 128, { fill: "#0f172a", zIndex: 1 }),
        img("ml-photo", "Agent Photo", PHOTO_PLACEHOLDER, 32, 852, 96, 96, { slot: "agent.photo", objectFit: "cover", cornerRadius: 48, zIndex: 2 }),
        text("ml-agentname", "Agent Name", "Aisha Sharma", 156, 858, 700, 36, 28, "#ffffff", { slot: "agent.name", weight: 800, zIndex: 2 }),
        text("ml-agentphone", "Agent Phone", "+91 90000 00000  ·  aisha@skylinerealty.in", 156, 896, 800, 28, 20, "#cbd5e1", { slot: "agent.phone", weight: 500, zIndex: 2 }),
        text("ml-agentrera", "Agent RERA", "RERA: PRM/KA/RERA/1254", 940, 888, 308, 28, 20, "#fde68a", { slot: "agent.rera", weight: 700, align: "right", zIndex: 2 }),
      ],
    },
  },
];

const PREMIUM_BY_ID: Record<string, StarterCanvasTemplate> = Object.fromEntries(
  PREMIUM_CANVAS_TEMPLATES.map((t) => [t.id, t]),
);

export function getPremiumCanvasTemplateById(
  id: string,
): StarterCanvasTemplate | undefined {
  return PREMIUM_BY_ID[id];
}
