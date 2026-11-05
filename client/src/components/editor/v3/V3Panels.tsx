import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Upload, X, Plus, Pencil, Trash2 } from 'lucide-react';
import { useCanvasStore } from '../../../hooks/useCanvasStore';
import { canvasTemplatesApi } from '../../../lib/api';
import type { DesignMetadata } from '../../../lib/storage';
import { createImageElement, createTextElement } from '../../../lib/canvasUtils';
import { isValidLineElement } from '../../../lib/lineGeometry';
import { restoreCanvasData } from '../../../lib/canvasState';
import { pickCanvasBackground } from '../../../lib/brandPalette';
import { PropertyDetailsForm } from '../PropertyDetailsForm';
import { AgentInfoForm } from '../AgentInfoForm';
import { TemplateSection, PROPERTY_SLOT_FIELDS, AGENT_SLOT_FIELDS, BRAND_SLOT_FIELDS } from '../TemplateSlotSection';
import { BrandPaletteDialog, type BrandPalette } from '../BrandPaletteDialog';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel } from '../../ui/alert-dialog';

export type V3Panel = 'Templates' | 'Text' | 'Uploads' | 'Brand' | 'Property' | 'Agent';

const textStyles = [
  { name: 'Headline Large', size: 48, weight: 700, color: '#1F1F1F' },
  { name: 'Headline Medium', size: 36, weight: 600, color: '#1F1F1F' },
  { name: 'Title', size: 24, weight: 600, color: '#374151' },
  { name: 'Subtitle', size: 18, weight: 500, color: '#6B7280' },
  { name: 'Body Large', size: 16, weight: 400, color: '#1F1F1F' },
  { name: 'Body', size: 14, weight: 400, color: '#374151' },
  { name: 'Caption', size: 12, weight: 400, color: '#6B7280' },
  { name: 'Price Tag', size: 28, weight: 700, color: '#16A34A' },
];

function luminance(color: string): number {
  let hex = color.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return 1;
  const [r, g, b] = [0, 2, 4].map(index => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function TextStyles() {
  const add = (style: typeof textStyles[number]) => {
    const state = useCanvasStore.getState();
    const background = luminance(state.backgroundColor);
    const candidates = [...(state.selectedThemeColors ?? []), style.color, background < 0.35 ? '#FFFFFF' : '#1F1F1F'];
    const ink = candidates.find(color => {
      const value = luminance(color);
      return (Math.max(value, background) + 0.05) / (Math.min(value, background) + 0.05) >= 4.5;
    }) ?? (background < 0.35 ? '#FFFFFF' : '#1F1F1F');
    const element = { ...createTextElement(100, 100, style.name), name: style.name,
      fontSize: style.size, fontWeight: style.weight, bold: style.weight >= 700, color: ink,
      width: Math.max(200, style.name.length * style.size * 0.6), height: style.size * 1.5 };
    state.addElement(element);
    state.selectElement(element.id); state.setActiveTool('select');
  };
  return <section aria-label="Text styles"><button type="button" className="v3-wide-button" onClick={() => {
    const state = useCanvasStore.getState();
    const element = createTextElement();
    state.addElement(element); state.selectElement(element.id); state.setActiveTool('select');
  }}><Plus aria-hidden="true" />Add text</button><h3>Text styles</h3><div className="v3-text-styles">
    {textStyles.map(style => <button type="button" key={style.name} onClick={() => add(style)} className="v3-text-style">
      <span aria-hidden="true" style={{ fontSize: Math.min(style.size, 32), fontWeight: style.weight }}>Aa</span>
      <strong>{style.name}</strong><small>{style.size}px</small>
    </button>)}
  </div></section>;
}

function readRecent(userId: string): string[] {
  try {
    const ids: unknown = JSON.parse(localStorage.getItem(`v3-recent-templates:${userId}`) ?? '[]');
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string').slice(0, 12) : [];
  } catch { return []; }
}

function hasCanvasLayout(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const canvas = data as Record<string, unknown>;
  if (!Array.isArray(canvas.elements) || canvas.elements.length === 0) return false;
  if (['canvasWidth', 'canvasHeight'].some(key => canvas[key] !== undefined && (typeof canvas[key] !== 'number' || !Number.isFinite(canvas[key]) || Number(canvas[key]) <= 0))) return false;
  const ids = new Set<string>();
  return canvas.elements.every((value: unknown) => {
    if (!value || typeof value !== 'object') return false;
    const element = value as Record<string, unknown>;
    if (typeof element.id !== 'string' || ids.has(element.id) || !['text', 'image', 'shape', 'line'].includes(String(element.type))) return false;
    ids.add(element.id);
    if (['x', 'y', 'width', 'height'].some(key => typeof element[key] !== 'number' || !Number.isFinite(element[key]))) return false;
    if (Number(element.width) <= 0 || Number(element.height) <= 0) return false;
    if (element.type === 'text') return typeof element.content === 'string';
    if (element.type === 'image') return typeof element.src === 'string';
    if (element.type === 'line') return isValidLineElement(element);
    return ['rectangle', 'circle', 'ellipse', 'triangle', 'star', 'speechBubble', 'arrowLeft', 'arrowRight'].includes(String(element.shapeType));
  });
}

function Templates({ userId }: { userId: string }) {
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [search, setSearch] = useState('');
  const [recent, setRecent] = useState(() => readRecent(userId));
  const [replacement, setReplacement] = useState<DesignMetadata | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const own = useQuery({ queryKey: ['v3-templates', userId, 'personal'], queryFn: () => canvasTemplatesApi.getAll(), enabled: !!userId });
  const curated = useQuery({ queryKey: ['v3-templates', userId, 'curated'], queryFn: () => canvasTemplatesApi.getAdminCurated(), enabled: !!userId });
  const templates = Array.from(new Map([...(curated.data ?? []), ...(own.data ?? [])].map(template => [template.id, template])).values());
  const matching = templates.filter(template => `${template.name} ${template.category ?? ''} ${(template.tags ?? []).join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  const recentlyUsed = recent.flatMap(id => matching.filter(template => template.id === id));
  const others = matching.filter(template => !recent.includes(template.id));
  const apply = async (template: DesignMetadata) => {
    setApplying(true);
    setError(null);
    try {
      // Fetch again at the trust boundary: cached gallery membership is not authorization.
      const fresh = await canvasTemplatesApi.getOne(template.id);
      if (!mounted.current) return;
      const data: unknown = fresh.canvasData;
      if (!hasCanvasLayout(data)) throw new Error('This template has no usable canvas layout.');
      if (!restoreCanvasData(data)) throw new Error('This template could not be opened.');
      useCanvasStore.getState().setCanvasOrigin({ templateId: fresh.id });
      const next = [fresh.id, ...recent.filter(id => id !== fresh.id)].slice(0, 12);
      setRecent(next);
      try { localStorage.setItem(`v3-recent-templates:${userId}`, JSON.stringify(next)); } catch { /* Canvas use must remain possible when browser storage is unavailable. */ }
      setReplacement(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to apply template. Try again.'); }
    finally { setApplying(false); }
  };
  const choose = (template: DesignMetadata) => {
    if (useCanvasStore.getState().elements.length) setReplacement(template);
    else void apply(template);
  };
  const cards = (items: DesignMetadata[]) => <div className="v3-template-grid">{items.map(template => <button type="button" key={template.id} className="v3-template-card" disabled={applying} onClick={() => choose(template)}>
    {template.thumbnail ? <img src={template.thumbnail} alt="" loading="lazy" width={120} height={150} /> : <span className="v3-template-no-thumbnail">No preview available</span>}
    <span>{template.name}</span>
  </button>)}</div>;
  const loading = own.isLoading || curated.isLoading;
  return <div className="space-y-4">
    <label className="block">Search templates<input className="v3-input" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search templates" /></label>
    {loading && <p role="status">Loading templates…</p>}
    {(own.isError || curated.isError) && <div role="alert" className="v3-panel-status"><p>{templates.length ? 'Some templates could not be loaded.' : 'Templates could not be loaded.'}</p><button type="button" onClick={() => { void own.refetch(); void curated.refetch(); }}>Retry templates</button></div>}
    {!loading && matching.length === 0 && <p>No templates found.</p>}
    <section aria-label="Recently used"><h3>Recently used</h3>{recentlyUsed.length ? cards(recentlyUsed) : <p>No recently used templates.</p>}</section>
    <section aria-label="More templates"><h3>More templates</h3>{cards(others)}</section>
    {error && <div role="alert"><p>{error}</p>{replacement && <button type="button" disabled={applying} onClick={() => void apply(replacement)}>Retry template</button>}</div>}
    <AlertDialog open={!!replacement} onOpenChange={open => { if (!open && !applying) setReplacement(null); }}><AlertDialogContent>
      <AlertDialogTitle>Replace canvas?</AlertDialogTitle><AlertDialogDescription>Applying {replacement?.name} replaces the current canvas contents.</AlertDialogDescription>
      <AlertDialogCancel disabled={applying}>Cancel</AlertDialogCancel>
      <button type="button" disabled={applying || !replacement} onClick={() => { if (replacement) void apply(replacement); }}>{applying ? 'Applying template…' : 'Replace canvas'}</button>
    </AlertDialogContent></AlertDialog>
  </div>;
}

function Uploads() {
  const input = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const upload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Choose an image file.'); return; }
    setBusy(true);
    setError(null);
    try {
      const src = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Unable to read image.'));
        reader.onerror = () => reject(new Error('Unable to read image.'));
        reader.readAsDataURL(file);
      });
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => reject(new Error('This image could not be opened.'));
        image.src = src;
      });
      const state = useCanvasStore.getState();
      if (!mounted.current) return;
      const scale = Math.min(1, state.canvasWidth * 0.8 / dimensions.width, state.canvasHeight * 0.8 / dimensions.height);
      const element = createImageElement(src, 100, 100, dimensions.width * scale, dimensions.height * scale);
      state.addElement({ ...element, name: file.name });
      state.selectElement(element.id); state.setActiveTool('select');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to upload image.'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  };
  return <div className="space-y-4"><input ref={input} type="file" accept="image/*" aria-label="Choose image" hidden onChange={event => void upload(event.target.files?.[0])} />
    <button type="button" disabled={busy} className="v3-wide-button" onClick={() => input.current?.click()}><Upload />{busy ? 'Opening image…' : 'Upload image'}</button>
    <p>Choose an image from your device to add it to this canvas.</p>{error && <p role="alert">{error}</p>}
  </div>;
}

export const builtInPalettes: BrandPalette[] = [
  { id: 'luxury-gold', name: 'Luxury Gold', colors: ['#1F1F1F', '#D4AF37', '#FFFFFF', '#F5F5F5', '#8B7355'], description: 'Premium & sophisticated' },
  { id: 'modern-blue', name: 'Modern Blue', colors: ['#0F172A', '#3B82F6', '#60A5FA', '#DBEAFE', '#FFFFFF'], description: 'Professional & trustworthy' },
  { id: 'natural-green', name: 'Natural Green', colors: ['#14532D', '#16A34A', '#86EFAC', '#F0FDF4', '#FFFFFF'], description: 'Fresh & eco-friendly' },
  { id: 'elegant-navy', name: 'Elegant Navy', colors: ['#1E293B', '#334155', '#94A3B8', '#E2E8F0', '#FFFFFF'], description: 'Classic & timeless' },
  { id: 'sunset-orange', name: 'Sunset Orange', colors: ['#7C2D12', '#EA580C', '#FB923C', '#FED7AA', '#FFFFFF'], description: 'Warm & inviting' },
  { id: 'royal-purple', name: 'Royal Purple', colors: ['#4C1D95', '#7C3AED', '#A78BFA', '#EDE9FE', '#FFFFFF'], description: 'Bold & creative' },
];

export function loadPalettes(): BrandPalette[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem('custom-brand-palettes') ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is BrandPalette => value && typeof value.id === 'string' && typeof value.name === 'string' && Array.isArray(value.colors) && value.colors.length > 0 && value.colors.every((color: unknown) => typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)));
  } catch { return []; }
}

function Brand({ activeSlots }: { activeSlots: ReadonlySet<string> }) {
  const [custom, setCustom] = useState(loadPalettes);
  const [editing, setEditing] = useState<BrandPalette | null>(null);
  const [dialog, setDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = useCanvasStore(state => state.selectedThemeColors);
  const previousBackground = useRef<string | null>(null);
  const persist = (next: BrandPalette[]) => {
    setCustom(next);
    try { localStorage.setItem('custom-brand-palettes', JSON.stringify(next)); setError(null); }
    catch { setError('Palette is available for this session, but could not be saved on this device.'); }
  };
  const apply = (palette: BrandPalette) => {
    const state = useCanvasStore.getState();
    if (!state.selectedThemeColors) previousBackground.current = state.backgroundColor;
    state.setSelectedThemeColors(palette.colors);
    state.setBackgroundColor(pickCanvasBackground(palette.colors));
    const ink = palette.colors.slice(0, Math.max(1, palette.colors.length - 1));
    state.elements.forEach((element, index) => {
      const color = ink[index % ink.length];
      if (element.locked) return;
      if (element.type === 'text') state.updateElement(element.id, { color });
      else if (element.type === 'shape') state.updateElement(element.id, { fill: color, stroke: ink[(index + 1) % ink.length] });
    });
  };
  return <div className="space-y-4">
    <TemplateSection title="Brand elements" subtitle="Update linked brand elements" fields={BRAND_SLOT_FIELDS} activeSlots={activeSlots} />
    <h3>Brand palettes</h3><p>Apply a palette to change artwork colors.</p>
    <button type="button" className="v3-wide-button" onClick={() => { setEditing(null); setDialog(true); }}><Plus />Create palette</button>
    {selected && <button type="button" onClick={() => { const state = useCanvasStore.getState(); state.setSelectedThemeColors(null); if (previousBackground.current) state.setBackgroundColor(previousBackground.current); previousBackground.current = null; }}>Clear brand palette</button>}
    {[...builtInPalettes, ...custom].map(palette => <div key={palette.id} className="v3-palette-card">
      <button type="button" aria-label={`Apply ${palette.name}`} onClick={() => apply(palette)}><strong>{palette.name}</strong><span className="flex" aria-hidden="true">{palette.colors.map((color, index) => <span key={`${color}:${index}`} style={{ backgroundColor: color, height: 24, flex: 1 }} />)}</span></button>
      {custom.some(value => value.id === palette.id) && <div><button type="button" aria-label={`Edit ${palette.name}`} onClick={() => { setEditing(palette); setDialog(true); }}><Pencil /></button><button type="button" aria-label={`Delete ${palette.name}`} onClick={() => persist(custom.filter(value => value.id !== palette.id))}><Trash2 /></button></div>}
    </div>)}
    {error && <p role="alert">{error}</p>}
    <BrandPaletteDialog isOpen={dialog} onClose={() => setDialog(false)} initialPalette={editing} onSave={palette => persist(editing ? custom.map(value => value.id === palette.id ? palette : value) : [...custom, palette])} />
  </div>;
}

export function V3Panels({ panel, userId, onClose }: { panel: V3Panel; userId: string; onClose: () => void }) {
  const elements = useCanvasStore(state => state.elements);
  const activeSlots = new Set(elements.flatMap(element => element.slot ? [element.slot] : []));
  return <div className="v3-panel-content"><div className="v3-panel-header"><h2>{panel}</h2><button type="button" aria-label={`Close ${panel}`} onClick={onClose}><X /></button></div>
    {panel === 'Templates' && <Templates key={userId} userId={userId} />}
    {panel === 'Text' && <TextStyles />}
    {panel === 'Uploads' && <Uploads key={userId} />}
    {panel === 'Brand' && <Brand activeSlots={activeSlots} />}
    {panel === 'Property' && <div className="space-y-4"><PropertyDetailsForm /><TemplateSection title="Property elements" subtitle="Update linked listing elements" fields={PROPERTY_SLOT_FIELDS} activeSlots={activeSlots} /></div>}
    {panel === 'Agent' && <div className="space-y-4"><AgentInfoForm /><TemplateSection title="Agent elements" subtitle="Update linked contact elements" fields={AGENT_SLOT_FIELDS} activeSlots={activeSlots} /></div>}
  </div>;
}
