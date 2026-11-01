import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Minus, Plus, Palette, MoreHorizontal, Underline, Strikethrough, List, ListOrdered, SlidersHorizontal, Replace, FlipHorizontal, FlipVertical, Square, Circle, Triangle, Star, Droplets, ScanLine, Sparkles, ArrowLeftRight } from 'lucide-react';
import type { CanvasElement, ImageElement, ShapeElement, TextElement, LineElement } from '../../../lib/canvasTypes';
import { useCanvasStore } from '../../../hooks/useCanvasStore';
import { clampNumeric, commitElementPatch, readReplacementImage, replacementImagePatch, resetImageAppearancePatch } from '../../../lib/v3ElementEditing';
import '../../../styles/v3-element-toolbar.css';

const Disabled = createContext(false);
const fonts = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Georgia', 'Times New Roman', 'Poppins', 'Playfair Display'];

function Action({ label, children, onClick, pressed }: { label: string; children: ReactNode; onClick?: () => void; pressed?: boolean }) {
  return <button type="button" aria-label={label} title={label} aria-pressed={pressed} disabled={useContext(Disabled)} onClick={onClick}>{children}</button>;
}

function Menu({ label, text, icon, children }: { label: string; text?: string; icon?: ReactNode; children: ReactNode }) {
  const anchor = useRef<HTMLButtonElement>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const disabled = useContext(Disabled);
  useLayoutEffect(() => setContainer(anchor.current?.closest<HTMLElement>('.v3-editor') ?? null), []);
  return <Popover.Root><Popover.Trigger asChild><button ref={anchor} type="button" disabled={disabled} aria-label={label} title={label}>{icon}<span>{text ?? label}</span></button></Popover.Trigger>
    <Popover.Portal container={container}><Popover.Content className="v3-element-popover" sideOffset={9} collisionPadding={12} onClick={event => event.stopPropagation()}>
      <h3>{label}</h3><fieldset disabled={disabled}>{children}</fieldset><Popover.Close className="v3-popover-close" aria-label={`Close ${label}`}>Done</Popover.Close>
    </Popover.Content></Popover.Portal></Popover.Root>;
}

export function NumericControl({ label, value, min, max, step = 1, onCommit, onDraft, icon }: { label: string; value: number; min: number; max: number; step?: number; onCommit: (value: number) => void; onDraft?: (value: number) => void; icon?: ReactNode }) {
  const [draft, setDraft] = useState(String(value));
  const cancelled = useRef(false);
  const disabled = useContext(Disabled);
  useEffect(() => setDraft(String(value)), [value]);
  const change = (value: string) => { setDraft(value); const numeric = clampNumeric(value, min, max); if (numeric !== null) onDraft?.(numeric); };
  const commit = (raw = draft) => { if (cancelled.current) return; const numeric = clampNumeric(raw, min, max); if (numeric === null) { setDraft(String(value)); onDraft?.(value); return; } setDraft(String(numeric)); onCommit(numeric); };
  const cancel = () => { cancelled.current = true; setDraft(String(value)); onDraft?.(value); };
  return <label className="v3-numeric-control"><span style={{display:'flex',alignItems:'center',gap:8}}>{icon}{label}</span><div><input type="range" aria-label={label} min={min} max={max} step={step} disabled={disabled} value={clampNumeric(draft, min, max) ?? value}
    onChange={event => { if (!cancelled.current) change(event.target.value); }} onPointerDown={() => { cancelled.current = false; }} onPointerUp={event => commit(event.currentTarget.value)} onPointerCancel={cancel} onBlur={() => commit()}
    onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancel(); } else cancelled.current = false; }} onKeyUp={event => { if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key)) commit(event.currentTarget.value); }}/>
    <input type="number" aria-label={`${label} value`} disabled={disabled} value={draft} min={min} max={max} step={step} onChange={event => { cancelled.current = false; change(event.target.value); }} onBlur={() => commit()} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); commit(); } if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancel(); } }}/></div></label>;
}

function ColorControl({ label, value, onCommit, transparent = false }: { label: string; value: string; onCommit: (value: string) => void; transparent?: boolean }) {
  const colors = useCanvasStore(state => state.selectedThemeColors);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => { if (/^#[0-9a-f]{6}$/i.test(draft)) onCommit(draft); else setDraft(value); };
  return <div className="v3-color-control"><div className="v3-color-swatches">{(colors ?? []).map((color, index) => <button type="button" key={`${color}:${index}`} aria-label={`${label} brand color ${index + 1}`} style={{ backgroundColor: color }} onClick={() => onCommit(color)} />)}</div>
    <label>{label}<input aria-label={`${label} color`} type="color" value={/^#[0-9a-f]{6}$/i.test(draft) ? draft : '#000000'} onChange={event => setDraft(event.target.value)} onBlur={commit}/></label>
    <label>Hex<input aria-label={`${label} hex`} value={draft} onChange={event => setDraft(event.target.value)} onBlur={commit} onKeyDown={event => { if (event.key === 'Enter') commit(); if (event.key === 'Escape') { event.stopPropagation(); setDraft(value); } }}/></label>
    {transparent && <button type="button" onClick={() => onCommit('transparent')}>Transparent</button>}
  </div>;
}

function Opacity({ element }: { element: CanvasElement }) {
  return <Menu label="Opacity" icon={<Droplets/>}><NumericControl label="Opacity" value={Math.round(element.opacity * 100)} min={0} max={100} onCommit={opacity => commitElementPatch(element.id, { opacity: opacity / 100 })}/></Menu>;
}

function TextToolbar({ element }: { element: TextElement }) {
  const update = (patch: Partial<TextElement>) => commitElementPatch(element.id, patch);
  const [size, setSize] = useState(String(element.fontSize));
  useEffect(() => setSize(String(element.fontSize)), [element.fontSize]);
  const commitSize = () => { const value = clampNumeric(size, 1, 500); if (value !== null) update({ fontSize: value }); setSize(String(value ?? element.fontSize)); };
  return <><select aria-label="Font family" value={element.fontFamily} onChange={event => update({ fontFamily: event.target.value })}>{Array.from(new Set([element.fontFamily, ...fonts])).map(font => <option key={font}>{font}</option>)}</select>
    <div className="v3-font-size"><Action label="Decrease font size" onClick={() => update({ fontSize: Math.max(1, element.fontSize - 1) })}><Minus/></Action><input aria-label="Font size" type="number" min={1} max={500} value={size} onChange={event => setSize(event.target.value)} onBlur={commitSize} onKeyDown={event => { if (event.key === 'Enter') commitSize(); if (event.key === 'Escape') { event.stopPropagation(); setSize(String(element.fontSize)); } }}/><Action label="Increase font size" onClick={() => update({ fontSize: Math.min(500, element.fontSize + 1) })}><Plus/></Action></div>
    <Menu label="Text color" icon={<Palette/>}><ColorControl label="Text" value={element.color} onCommit={color => update({ color })}/></Menu>
    <Action label="Bold" pressed={element.bold} onClick={() => update({ bold: !element.bold, fontWeight: element.bold ? 400 : 700 })}><Bold/></Action>
    <Action label="Italic" pressed={element.italic} onClick={() => update({ italic: !element.italic })}><Italic/></Action>
    <div className="v3-alignment">{([['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]] as const).map(([align, Icon]) => <Action key={align} label={`Align ${align}`} pressed={element.align === align} onClick={() => update({ align })}><Icon/></Action>)}</div>
    <Menu label="More text options" text="More" icon={<MoreHorizontal/>}><div className="v3-option-row"><Action label="Underline" pressed={element.underline} onClick={() => update({ underline: !element.underline })}><Underline/></Action><Action label="Strikethrough" pressed={element.strikethrough} onClick={() => update({ strikethrough: !element.strikethrough })}><Strikethrough/></Action><Action label="Bullet list" pressed={element.listStyle === 'bullet'} onClick={() => update({ listStyle: element.listStyle === 'bullet' ? 'none' : 'bullet' })}><List/></Action><Action label="Numbered list" pressed={element.listStyle === 'numbered'} onClick={() => update({ listStyle: element.listStyle === 'numbered' ? 'none' : 'numbered' })}><ListOrdered/></Action></div>
      <label>Case<select aria-label="Text case" value={element.textTransform} onChange={event => update({ textTransform: event.target.value as TextElement['textTransform'] })}>{['none','uppercase','lowercase','capitalize'].map(value => <option key={value}>{value}</option>)}</select></label>
      <NumericControl label="Opacity" min={0} max={100} value={Math.round(element.opacity * 100)} onCommit={opacity => update({ opacity: opacity / 100 })}/>
    </Menu></>;
}

function Border({ element }: { element: ShapeElement | ImageElement }) {
  const shape = element.type === 'shape';
  const width = shape ? element.strokeWidth : element.borderWidth ?? 0;
  const style = shape ? element.strokeStyle ?? 'solid' : element.borderStyle ?? 'solid';
  const color = shape ? element.stroke : element.borderColor ?? '#000000';
  const setStyle = (next: string) => {
    if (shape) commitElementPatch(element.id, { strokeStyle: next === 'none' ? 'solid' : next as ShapeElement['strokeStyle'], strokeWidth: next === 'none' ? 0 : width || 1 });
    else commitElementPatch(element.id, { borderStyle: next === 'none' ? 'solid' : next as ImageElement['borderStyle'], borderWidth: next === 'none' ? 0 : width || 1 });
  };
  return <div className="v3-border-options"><div className="v3-border-samples" role="group" aria-label="Border styles">{(['none','solid','dashed','dotted'] as const).map(value => <button key={value} type="button" aria-label={`Border ${value}`} aria-pressed={(width === 0 ? 'none' : style) === value} onClick={() => setStyle(value)}><span aria-hidden="true" style={{ borderBottom: value === 'none' ? 'none' : `2px ${value} currentColor` }}>{value === 'none' ? '∅' : ''}</span><small>{value}</small></button>)}</div><label>Style<select aria-label="Border style" value={width === 0 ? 'none' : style} onChange={event => setStyle(event.target.value)}>{['none','solid','dashed','dotted'].map(value => <option key={value}>{value}</option>)}</select></label>
    <ColorControl label="Border" value={color} onCommit={color => commitElementPatch(element.id, shape ? { stroke: color } : { borderColor: color })}/>
    <NumericControl label="Border width" min={0} max={20} value={width} onCommit={value => commitElementPatch(element.id, shape ? { strokeWidth: value } : { borderWidth: value })}/>
  </div>;
}

function ShapeToolbar({ element }: { element: ShapeElement }) {
  const shadow = element.shadow ?? { color: '#000000', opacity: 0.25, blur: 12, offsetX: 4, offsetY: 4 };
  return <><Menu label="Edit shape" text="Edit" icon={<Square/>}>{([['rectangle', Square], ['circle', Circle], ['triangle', Triangle], ['star', Star]] as const).map(([shapeType, Icon]) => <button key={shapeType} type="button" onClick={() => commitElementPatch(element.id, { shapeType })}><Icon/>{shapeType === 'rectangle' ? 'Rectangle / Square' : shapeType[0].toUpperCase() + shapeType.slice(1)}</button>)}</Menu>
    <Menu label="Fill" icon={<Palette/>}><ColorControl label="Fill" value={element.fill} transparent onCommit={fill => commitElementPatch(element.id, { fill })}/></Menu>
    <Menu label="Border" icon={<ScanLine/>}><Border element={element}/></Menu>
    {element.shapeType === 'rectangle' && <Menu label="Corners" icon={<Square/>}><NumericControl label="Corner radius" min={0} max={100} value={element.cornerRadius} onCommit={cornerRadius => commitElementPatch(element.id, { cornerRadius })}/></Menu>}
    <Opacity element={element}/><Menu label="Effects" icon={<Sparkles/>}><button type="button" aria-pressed={!element.shadow} onClick={() => commitElementPatch(element.id, { shadow: undefined })}>None</button><button type="button" aria-pressed={!!element.shadow} onClick={() => commitElementPatch(element.id, { shadow })}>Shadow</button>
      {element.shadow && <><ColorControl label="Shadow" value={shadow.color} onCommit={color => commitElementPatch(element.id, { shadow: { ...shadow, color } })}/>
        <NumericControl label="Shadow opacity" min={0} max={100} value={Math.round(shadow.opacity * 100)} onCommit={opacity => commitElementPatch(element.id, { shadow: { ...shadow, opacity: opacity / 100 } })}/>
        {([['blur', 'Shadow blur', 0, 100], ['offsetX', 'Shadow horizontal offset', -100, 100], ['offsetY', 'Shadow vertical offset', -100, 100]] as const).map(([key, label, min, max]) => <NumericControl key={key} label={label} min={min} max={max} value={shadow[key]} onCommit={value => commitElementPatch(element.id, { shadow: { ...shadow, [key]: value } })}/>)}</>}
    </Menu></>;
}

function ImageToolbar({ element, onEditImage }: { element: ImageElement; onEditImage: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const alive = useRef(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const replace = async (file?: File) => {
    if (!file) return;
    setBusy(true); setError(null);
    try { const replacement = await readReplacementImage(file); if (alive.current) commitElementPatch(element.id, replacementImagePatch(replacement.src, replacement.name)); }
    catch (cause) { if (alive.current) setError(cause instanceof Error ? cause.message : 'Unable to replace image. Choose another image to retry.'); }
    finally { if (alive.current) setBusy(false); if (fileInput.current) fileInput.current.value = ''; }
  };
  return <><Action label="Edit image" onClick={onEditImage}><SlidersHorizontal/><span>Edit</span></Action>
    <input ref={fileInput} hidden type="file" accept="image/*" aria-label="Replace image file" onChange={event => void replace(event.target.files?.[0])}/>
    <button type="button" disabled={busy || useContext(Disabled)} aria-label="Replace image" onClick={() => fileInput.current?.click()}><Replace/>{busy ? 'Replacing…' : 'Replace'}</button>
    <Menu label="Flip" icon={<FlipHorizontal/>}><Action label="Flip horizontal" pressed={element.flipHorizontal} onClick={() => commitElementPatch(element.id, { flipHorizontal: !element.flipHorizontal })}><FlipHorizontal/>Horizontal</Action><Action label="Flip vertical" pressed={element.flipVertical} onClick={() => commitElementPatch(element.id, { flipVertical: !element.flipVertical })}><FlipVertical/>Vertical</Action></Menu>
    <Menu label="Corners" icon={<Square/>}><NumericControl label="Corner radius" min={0} max={100} value={element.cornerRadius} onCommit={cornerRadius => commitElementPatch(element.id, { cornerRadius })}/></Menu><Opacity element={element}/>
    <Menu label="More image options" text="More" icon={<MoreHorizontal/>}><label>Fit<select aria-label="Image fit" value={element.objectFit ?? 'cover'} onChange={event => commitElementPatch(element.id, { objectFit: event.target.value as ImageElement['objectFit'] })}>{['cover','contain','fill'].map(value => <option key={value}>{value}</option>)}</select></label><h4>Border</h4><Border element={element}/><button type="button" onClick={() => commitElementPatch(element.id, resetImageAppearancePatch())}>Reset image</button></Menu>
    {error && <div className="v3-replace-error" role="alert">{error}<button type="button" onClick={() => fileInput.current?.click()}>Retry replacement</button></div>}
  </>;
}

function LineToolbar({ element }: { element: LineElement }) {
  return <><label>Type<select aria-label="Line type" value={element.lineType} onChange={event => commitElementPatch(element.id, { lineType: event.target.value as LineElement['lineType'] })}>{['straight','curved','elbow'].map(value => <option key={value}>{value}</option>)}</select></label>
    <Menu label="Line color" icon={<Palette/>}><ColorControl label="Line" value={element.stroke} onCommit={stroke => commitElementPatch(element.id, { stroke })}/></Menu>
    <Menu label="Stroke" icon={<ScanLine/>}><NumericControl label="Line width" min={1} max={20} value={element.strokeWidth} onCommit={strokeWidth => commitElementPatch(element.id, { strokeWidth })}/><label>Pattern<select aria-label="Line stroke style" value={element.strokeStyle} onChange={event => commitElementPatch(element.id, { strokeStyle: event.target.value as LineElement['strokeStyle'] })}>{['solid','dashed','dotted'].map(value => <option key={value}>{value}</option>)}</select></label></Menu>
    <Menu label="Line endings" icon={<ArrowLeftRight/>}>{(['startDecoration','endDecoration'] as const).map((key, index) => <label key={key}>{index ? 'End' : 'Start'}<select aria-label={index ? 'End decoration' : 'Start decoration'} value={element[key]} onChange={event => commitElementPatch(element.id, { [key]: event.target.value })}>{['none','arrow','circle','bar'].map(value => <option key={value}>{value}</option>)}</select></label>)}<button type="button" onClick={() => commitElementPatch(element.id, { startDecoration: element.endDecoration, endDecoration: element.startDecoration })}>Swap ends</button></Menu><Opacity element={element}/></>;
}

export function V3ElementToolbar({ element, onEditImage }: { element: CanvasElement; onEditImage: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 650 });
  const selectedIds = useCanvasStore(state => state.selectedElementIds);
  const zoom = useCanvasStore(state => state.zoom);
  const disabled = element.locked || !element.visible || selectedIds.length !== 1 || selectedIds[0] !== element.id;
  useLayoutEffect(() => {
    const toolbar = ref.current;
    const viewport = toolbar?.closest('.v3-workspace')?.querySelector<HTMLElement>('[data-canvas-viewport]') ?? document.querySelector<HTMLElement>('[data-canvas-viewport]');
    if (!toolbar || !viewport) return;
    const measure = () => {
      const selection = Array.from(viewport.querySelectorAll<HTMLElement>('[data-element-id]')).find(node => node.dataset.elementId === element.id);
      const bounds = viewport.getBoundingClientRect();
      const target = selection?.getBoundingClientRect() ?? bounds;
      const width = Math.min(toolbar.scrollWidth, bounds.width - 24);
      const height = toolbar.getBoundingClientRect().height;
      const above = target.top - height - 14;
      const next = { width: Math.max(200, bounds.width - 24), left: Math.max(bounds.left + 12, Math.min(target.left + target.width / 2 - width / 2, bounds.right - width - 12)), top: Math.max(bounds.top + 12, Math.min(above >= bounds.top + 12 ? above : target.bottom + 14, bounds.bottom - height - 12)) };
      setPosition(previous => previous.left === next.left && previous.top === next.top && previous.width === next.width ? previous : next);
    };
    measure(); const observer = new ResizeObserver(measure); observer.observe(toolbar); observer.observe(viewport);
    window.addEventListener('resize', measure); window.addEventListener('scroll', measure, true);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
  }, [element, zoom]);
  return <Disabled.Provider value={disabled}><div ref={ref} role="toolbar" aria-label={`${element.type} formatting`} className="v3-element-toolbar" style={{ left: position.left, top: position.top, maxWidth: position.width }} onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}>
    <fieldset disabled={disabled}>{element.type === 'text' ? <TextToolbar key={element.id} element={element}/> : element.type === 'shape' ? <ShapeToolbar key={element.id} element={element}/> : element.type === 'image' ? <ImageToolbar key={element.id} element={element} onEditImage={onEditImage}/> : <LineToolbar key={element.id} element={element}/>}</fieldset>
  </div></Disabled.Provider>;
}
