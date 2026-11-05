import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Minus, Plus, MoreHorizontal, Underline, Strikethrough, List, ListOrdered, SlidersHorizontal, Replace, Square, Circle, CircleSlash, Triangle, Star, Sparkles, ArrowLeftRight, RotateCcw, Scan, Check, ChevronDown } from 'lucide-react';
import type { CanvasElement, ImageElement, ShapeElement, TextElement, LineElement } from '../../../lib/canvasTypes';
import { useCanvasStore } from '../../../hooks/useCanvasStore';
import { previewElementPatch, clearElementPreview } from '../../../hooks/useV3ElementPreview';
import { clampNumeric, commitElementPatch, readReplacementImage, replacementImagePatch, resetImageAppearancePatch } from '../../../lib/v3ElementEditing';
import '../../../styles/v3-element-toolbar.css';
import {openColorPanel,useV3ColorPanel,getTargetPaint} from '../../../hooks/useV3ColorPanel';
import type {PaintSlot,StrokeStyle} from '../../../lib/canvasTypes';
import {paintToCss} from '../../../lib/paint';

const Disabled = createContext(false);
const fonts = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Georgia', 'Times New Roman', 'Poppins', 'Playfair Display'];
const previousBorderWeights=new Map<string,number>();
export function clearV3StrokeMemory(){previousBorderWeights.clear();}
type ElementPatch = Parameters<typeof commitElementPatch>[1];
const Divider = () => <span className="v3-toolbar-divider" aria-hidden="true"/>;

function FlipIcon({ vertical = false }: { vertical?: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="v3-flip-icon"><g transform={vertical ? 'rotate(-90 12 12)' : undefined}><path d="M20 7C17 3 8 3 4 8C0 13 5 18 12 18H18M14 14l4 4-4 4"/></g></svg>;
}

function CornerIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 20V14A10 10 0 0 1 15 4H20"/></svg>;
}

function BorderIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round"><path d="M4 6H20" strokeWidth="2"/><path d="M4 12H20" strokeWidth="3"/><path d="M4 19H20" strokeWidth="4"/></svg>;
}

function Action({ label, description, children, onClick, pressed }: { label: string; description?:string; children: ReactNode; onClick?: () => void; pressed?: boolean }) {
  return <button type="button" aria-label={label} aria-description={description} title={description??label} aria-pressed={pressed} disabled={useContext(Disabled)} onClick={onClick}>{children}</button>;
}

function Menu({ label, text, heading = label, iconOnly = false, compact = false, strip = false, hideHeading = false, contentClassName, triggerClassName, icon, children }: { label: string; text?: string; heading?: string; iconOnly?: boolean; compact?: boolean; strip?: boolean; hideHeading?:boolean; contentClassName?:string; triggerClassName?:string; icon?: ReactNode; children: ReactNode }) {
  const anchor = useRef<HTMLButtonElement>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const disabled = useContext(Disabled);
  const [open,setOpen]=useState(false);
  const colorTarget=useV3ColorPanel(state=>state.target);
  useEffect(()=>{if(colorTarget)setOpen(false);},[colorTarget]);
  useLayoutEffect(() => setContainer(anchor.current?.closest<HTMLElement>('.v3-editor') ?? null), []);
  useEffect(()=>()=>clearElementPreview(),[]);
  return <Popover.Root open={open} onOpenChange={next=>{setOpen(next);if(!next)clearElementPreview();}}><Popover.Trigger asChild><button ref={anchor} type="button" disabled={disabled} className={`${iconOnly?'v3-toolbar-icon':''} ${triggerClassName??''}`.trim()||undefined} aria-label={label} title={label}>{icon}{!iconOnly && <span>{text ?? label}</span>}</button></Popover.Trigger>
    <Popover.Portal container={container}><Popover.Content aria-label={heading} className={`v3-element-popover${compact ? ' v3-element-popover--compact' : ''}${strip ? ' v3-element-popover--strip' : ''} ${contentClassName??''}`.trim()} sideOffset={9} collisionPadding={12} onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()} onEscapeKeyDown={event => {
      if (event.target instanceof HTMLElement && event.target.closest('[data-v3-draft-dirty="true"]')) event.preventDefault();
    }}>
      {!strip&&!hideHeading&&<h3>{heading}</h3>}<fieldset disabled={disabled}>{children}</fieldset>{!compact&&!strip && <Popover.Close className="v3-popover-close" aria-label={`Close ${label}`}>Done</Popover.Close>}
    </Popover.Content></Popover.Portal></Popover.Root>;
}

function StyleNumber({element,patch,...props}: Omit<Parameters<typeof NumericControl>[0],'onCommit'|'onDraft'|'onCancel'> & {element:CanvasElement;patch:(value:number)=>ElementPatch}) {
  return <NumericControl {...props} onCancel={()=>clearElementPreview(element.id)} onDraft={value=>{if(value===props.value)clearElementPreview(element.id);else previewElementPatch(element.id,patch(value));}} onCommit={value=>{if(value===props.value)clearElementPreview(element.id);else commitElementPatch(element.id,patch(value));}}/>;
}

export function NumericControl({ label, value, min, max, step = 1, onCommit, onDraft, onCancel, icon, compact = false, hideLabel = false, displayLabel }: { displayLabel?:string; label: string; value: number; min: number; max: number; step?: number; onCommit: (value: number) => void; onDraft?: (value: number) => void; onCancel?:()=>void; icon?: ReactNode; compact?: boolean; hideLabel?: boolean }) {
  const [draft, setDraft] = useState(String(value));
  const [committed, setCommitted] = useState(value);
  const cancelled = useRef(false);
  const disabled = useContext(Disabled);
  const rangeValue = clampNumeric(draft, min, max) ?? value;
  const rangeStyle = { '--v3-range-progress': `${max > min ? (rangeValue - min) / (max - min) * 100 : 0}%` } as React.CSSProperties;
  useEffect(() => { setDraft(String(value)); setCommitted(value); }, [value]);
  const restore = () => {if(onCancel)onCancel();else onDraft?.(committed);};
  const change = (value: string) => { setDraft(value); const numeric = clampNumeric(value, min, max); if(numeric===null)restore();else onDraft?.(numeric); };
  const commit = (raw = draft) => { if (cancelled.current) return; const numeric = clampNumeric(raw, min, max); if (numeric === null) { setDraft(String(committed)); restore(); return; } setDraft(String(numeric)); setCommitted(numeric); onCommit(numeric); };
  const cancel = () => { cancelled.current = true; setDraft(String(committed)); restore(); };
  const dirty = !draft.trim() || !Number.isFinite(Number(draft)) || Number(draft) !== committed;
  const escape = (event: React.KeyboardEvent<HTMLInputElement>) => { if (dirty) { event.preventDefault(); event.stopPropagation(); cancel(); } };
  return <label className={`v3-numeric-control${compact ? ' v3-numeric-control--compact' : ''}`} data-v3-draft-dirty={dirty}>{!hideLabel && <span style={{display:'flex',alignItems:'center',gap:8}}>{icon}{displayLabel??label}</span>}<div><input type="range" aria-label={label} style={rangeStyle} min={min} max={max} step={step} disabled={disabled} value={rangeValue}
    onChange={event => { if (!cancelled.current) change(event.target.value); }} onPointerDown={() => { cancelled.current = false; }} onPointerUp={event => commit(event.currentTarget.value)} onPointerCancel={cancel} onBlur={() => commit()}
    onKeyDown={event => { if (event.key === 'Escape') escape(event); else cancelled.current = false; }} onKeyUp={event => { if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key)) commit(event.currentTarget.value); }}/>
    <input type="number" aria-label={`${label} value`} disabled={disabled} value={draft} min={min} max={max} step={step} onChange={event => { cancelled.current = false; change(event.target.value); }} onBlur={() => commit()} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); commit(); } if (event.key === 'Escape') escape(event); }}/></div></label>;
}

export function V3ColorButton({element,slot,label,ring=false,text=false}:{element:CanvasElement;slot:PaintSlot|'shadow';label:string;ring?:boolean;text?:boolean}){
  const target=useV3ColorPanel(state=>state.target),disabled=useContext(Disabled);
  const paint=getTargetPaint({elementId:element.id,slot});
  return <button type="button" className="v3-toolbar-icon" aria-label={label} title={label} disabled={disabled||element.locked||!element.visible}
    aria-pressed={target?.elementId===element.id&&target.slot===slot} onClick={()=>openColorPanel({elementId:element.id,slot})}>
    {text?<span aria-hidden="true" className="v3-text-color-icon">A<span style={{background:paintToCss(paint)}}/></span>:
      <span aria-hidden="true" className={`v3-color-swatch${ring?' v3-paint-ring':''}${paint.type==='none'?' v3-color-swatch--transparent':''}`} style={paint.type==='none'?undefined:{background:paintToCss(paint)}}/>}
  </button>;
}
function StrokeSample({style}:{style:StrokeStyle}){
 return <svg aria-hidden="true" viewBox="0 0 28 12"><path d="M2 6H26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap={style==='dotted'?'round':'butt'} strokeDasharray={style==='dashed'?'8 5':style==='short-dashed'?'4 3':style==='dotted'?'0 4':undefined}/></svg>;
}

function Opacity({element}:{element:CanvasElement}){
  return <Menu label="Opacity" heading="Transparency" iconOnly compact icon={<span aria-hidden="true" className="v3-transparency-icon"/>}><StyleNumber element={element} label="Opacity" compact hideLabel value={Math.round(element.opacity*100)} min={0} max={100} patch={opacity=>({opacity:opacity/100})}/></Menu>;
}

function FontPicker({element}:{element:TextElement}) {
  const [query,setQuery]=useState('');
  const options=Array.from(new Set([element.fontFamily,...fonts])).filter(font=>font.toLowerCase().includes(query.toLowerCase()));
  return <Menu label="Font family" text={element.fontFamily} heading="Font" compact triggerClassName="v3-font-family" icon={<ChevronDown/>}><input type="search" aria-label="Search fonts" placeholder="Search fonts" value={query} onChange={event=>setQuery(event.target.value)}/><div className="v3-picker-list v3-font-options">{options.map(font=><button type="button" key={font} aria-label={`Font ${font}`} aria-pressed={font===element.fontFamily} onClick={()=>commitElementPatch(element.id,{fontFamily:font})}><span style={{fontFamily:font}}>{font}</span>{font===element.fontFamily&&<Check aria-hidden="true"/>}</button>)}{options.length===0&&<p role="status">No matching fonts</p>}</div></Menu>;
}

function AnchorIcon({anchor}:{anchor:'start'|'middle'|'end'}) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={anchor==='start'?'M5 5H19M12 7V19M8 15L12 19L16 15':anchor==='end'?'M5 19H19M12 17V5M8 9L12 5L16 9':'M5 12H19M12 3V9M9 6L12 3L15 6M12 15V21M9 18L12 21L15 18'}/></svg>;
}

function TextSpacing({element}:{element:TextElement}) {
  return <Menu label="Text spacing" compact hideHeading contentClassName="v3-text-spacing" iconOnly icon={<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4H17M12 4V15M4 20H20M7 17L4 20L7 23M17 17L20 20L17 23"/></svg>}>
    <StyleNumber element={element} label="Letter spacing" value={element.letterSpacing??0} min={-200} max={800} patch={letterSpacing=>({letterSpacing})}/>
    <StyleNumber element={element} label="Line spacing" value={element.lineHeight} min={0.5} max={3} step={0.01} patch={lineHeight=>({lineHeight})}/>
    <div className="v3-text-anchor"><span>Anchor text<br/>box</span><div role="group" aria-label="Anchor text box">{(['start','middle','end'] as const).map(textAnchor=><Action key={textAnchor} label={`Anchor ${textAnchor}`} pressed={(element.textAnchor??'start')===textAnchor} onClick={()=>commitElementPatch(element.id,{textAnchor})}><AnchorIcon anchor={textAnchor}/></Action>)}</div></div>
    <p className="v3-control-help">Make the text box taller to see vertical alignment.</p>
  </Menu>;
}

function TextToolbar({ element }: { element: TextElement }) {
  const update = (patch: Partial<TextElement>) => commitElementPatch(element.id, patch);
  const [size, setSize] = useState(String(element.fontSize));
  useEffect(() => setSize(String(element.fontSize)), [element.fontSize]);
  const commitSize = () => { const value = clampNumeric(size, 1, 500); if (value !== null) update({ fontSize: value }); setSize(String(value ?? element.fontSize)); };
  const caseModes={none:{icon:'aA',label:'Original case',next:'uppercase'},uppercase:{icon:'AA',label:'Uppercase',next:'lowercase'},lowercase:{icon:'aa',label:'Lowercase',next:'capitalize'},capitalize:{icon:'Aa',label:'Title case',next:'uppercase'}} as const;
  const caseMode=caseModes[element.textTransform]??caseModes.none;
  return <><FontPicker element={element}/>
    <div className="v3-font-size"><Action label="Decrease font size" onClick={() => update({ fontSize: Math.max(1, element.fontSize - 1) })}><Minus/></Action><input aria-label="Font size" type="number" min={1} max={500} step="0.1" value={size} onChange={event => {setSize(event.target.value);const fontSize=clampNumeric(event.target.value,1,500);if(fontSize!==null)previewElementPatch(element.id,{fontSize});else clearElementPreview(element.id);}} onBlur={commitSize} onKeyDown={event => { if (event.key === 'Enter') commitSize(); if (event.key === 'Escape') { event.preventDefault();event.stopPropagation();setSize(String(element.fontSize));clearElementPreview(element.id); } }}/><Action label="Increase font size" onClick={() => update({ fontSize: Math.min(500, element.fontSize + 1) })}><Plus/></Action></div>
    <V3ColorButton element={element} slot="color" label="Text color" text/>
    <Action label="Bold" pressed={element.bold} onClick={() => update({ bold: !element.bold, fontWeight: element.bold ? 400 : 700 })}><Bold/></Action>
    <Action label="Italic" pressed={element.italic} onClick={() => update({ italic: !element.italic })}><Italic/></Action>
    <Menu label="Text alignment" strip iconOnly icon={element.align==='center'?<AlignCenter/>:element.align==='right'?<AlignRight/>:<AlignLeft/>}>{([['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]] as const).map(([align, Icon]) => <Action key={align} label={`Align ${align}`} pressed={element.align === align} onClick={() => update({ align })}><Icon/></Action>)}</Menu>
    <Menu label="List style" strip iconOnly icon={element.listStyle==='numbered'?<ListOrdered/>:<List/>}><Action label="No list" pressed={element.listStyle==='none'} onClick={()=>update({listStyle:'none'})}><CircleSlash/></Action><Action label="Bullet list" pressed={element.listStyle==='bullet'} onClick={()=>update({listStyle:'bullet'})}><List/></Action><Action label="Numbered list" pressed={element.listStyle==='numbered'} onClick={()=>update({listStyle:'numbered'})}><ListOrdered/></Action></Menu>
    <TextSpacing element={element}/>
    <Opacity element={element}/><Divider/><Menu label="More text options" strip iconOnly icon={<MoreHorizontal/>}><Action label="Underline" pressed={element.underline} onClick={() => update({ underline: !element.underline })}><Underline/></Action><Action label="Strikethrough" pressed={element.strikethrough} onClick={() => update({ strikethrough: !element.strikethrough })}><Strikethrough/></Action>
      <Action label="Text case" description={`Current case: ${caseMode.label}. Click to switch to ${caseModes[caseMode.next].label}.`} pressed={element.textTransform!=='none'} onClick={()=>update({textTransform:caseMode.next})}><span className="v3-case-icon" aria-hidden="true">{caseMode.icon}</span></Action>
    </Menu></>;
}

function Border({ element }: { element: ShapeElement | ImageElement }) {
  const shape=element.type==='shape',width=shape?element.strokeWidth:element.borderWidth??0;
  const style=shape?element.strokeStyle??'solid':element.borderStyle??'solid';
  if(width>0)previousBorderWeights.set(element.id,width);
  const lastWeight=previousBorderWeights.get(element.id)??1;
  const setStyle=(next:StrokeStyle|'none')=>{
    const weight=next==='none'?0:width||lastWeight;
    const pattern=next==='none'?style:next;
    commitElementPatch(element.id,shape?{strokeStyle:pattern,strokeWidth:weight}:{borderStyle:pattern,borderWidth:weight});
  };
  return <div className="v3-border-options"><div className="v3-border-samples" role="group" aria-label="Border styles">{(['none','solid','dashed','short-dashed','dotted'] as const).map(value=><button key={value} type="button" title={value==='none'?'No stroke':value==='dashed'?'Long dashes':value==='short-dashed'?'Short dashes':value} aria-label={`Border ${value}`} aria-pressed={(width===0?'none':style)===value} onClick={()=>setStyle(value)}>{value==='none'?<CircleSlash/>:<StrokeSample style={value}/>}</button>)}</div>
    <StyleNumber element={element} label="Border width" displayLabel="Stroke weight" min={0} max={20} value={width} patch={value=>shape?{strokeWidth:value}:{borderWidth:value}}/>
  </div>;
}

function ShapeToolbar({ element,onEditEffects }: { element: ShapeElement;onEditEffects?:()=>void }) {
  return <><Menu label="Edit shape" text="Edit" icon={<Square/>}>{([['rectangle', Square], ['circle', Circle], ['triangle', Triangle], ['star', Star]] as const).map(([shapeType, Icon]) => <button key={shapeType} type="button" onClick={() => commitElementPatch(element.id, { shapeType })}><Icon/>{shapeType === 'rectangle' ? 'Rectangle / Square' : shapeType[0].toUpperCase() + shapeType.slice(1)}</button>)}</Menu>
    <V3ColorButton element={element} slot="fill" label="Fill"/>
    <V3ColorButton element={element} slot="stroke" label="Border color" ring/>
    <Menu label="Border" hideHeading contentClassName="v3-stroke-menu" iconOnly compact icon={<BorderIcon/>}><Border element={element}/></Menu>
    {element.shapeType === 'rectangle' && <Menu label="Corners" heading="Corner rounding" iconOnly compact icon={<CornerIcon/>}><StyleNumber element={element} label="Corner radius" compact hideLabel min={0} max={100} value={element.cornerRadius} patch={cornerRadius=>({cornerRadius})}/></Menu>}
    <Opacity element={element}/><button type="button" aria-label="Effects" disabled={useContext(Disabled)} onClick={onEditEffects}><Sparkles/>Effects</button></>;
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
    <span className="v3-toolbar-divider" aria-hidden="true"/>
    <Action label="Flip horizontal" pressed={element.flipHorizontal} onClick={() => commitElementPatch(element.id, { flipHorizontal: !element.flipHorizontal })}><FlipIcon/></Action><Action label="Flip vertical" pressed={element.flipVertical} onClick={() => commitElementPatch(element.id, { flipVertical: !element.flipVertical })}><FlipIcon vertical/></Action>
    <V3ColorButton element={element} slot="stroke" label="Border color" ring/><Menu label="Border" hideHeading contentClassName="v3-stroke-menu" iconOnly compact icon={<BorderIcon/>}><Border element={element}/></Menu>
    <Menu label="Corners" heading="Corner rounding" iconOnly compact icon={<CornerIcon/>}><StyleNumber element={element} label="Corner radius" compact hideLabel min={0} max={100} value={element.cornerRadius} patch={cornerRadius=>({cornerRadius})}/></Menu><Opacity element={element}/>
    <span className="v3-toolbar-divider" aria-hidden="true"/>
    <Menu label="Image fit" heading="Fit image" iconOnly compact icon={<Scan/>}><div className="v3-fit-options">{(['cover','contain','fill'] as const).map(objectFit=><button key={objectFit} type="button" aria-label={`Fit ${objectFit}`} title={objectFit==='fill'?'Stretch to fill':objectFit} aria-pressed={(element.objectFit??'contain')===objectFit} onClick={()=>commitElementPatch(element.id,{objectFit})}><svg aria-hidden="true" viewBox="0 0 32 28" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="24" height="20" rx="2"/>{objectFit==='contain'?<rect x="5" y="8" width="22" height="12" rx="1"/>:objectFit==='cover'?<path d="M10 4V24M22 4V24M4 10H28M4 18H28"/>:<path d="M8 8L24 20M24 8L8 20"/>}</svg><span>{objectFit==='fill'?'Stretch':objectFit==='cover'?'Cover':'Contain'}</span></button>)}</div><p className="v3-control-help">Fit changes are visible when the frame and image proportions differ.</p><p className="v3-control-help">Drag a side handle to reshape the frame; corners keep proportions.</p></Menu>
    <Action label="Reset image" onClick={()=>commitElementPatch(element.id,resetImageAppearancePatch())}><RotateCcw/></Action>
    {error && <div className="v3-replace-error" role="alert">{error}<button type="button" onClick={() => fileInput.current?.click()}>Retry replacement</button></div>}
  </>;
}

function DecorationIcon({kind,start=false}:{kind:LineElement['startDecoration'];start?:boolean}) {
  return <svg aria-hidden="true" viewBox="0 0 28 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><g transform={start?'rotate(180 14 12)':undefined}><path d="M4 12H23"/>{kind==='arrow'?<path d="M17 7L23 12L17 17"/>:kind==='circle'?<circle cx="22" cy="12" r="3" fill="currentColor"/>:kind==='bar'?<path d="M23 6V18"/>:null}</g></svg>;
}

function LineTypeIcon({type}:{type:LineElement['lineType']}) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={type==='straight'?'M5 19L19 5':type==='elbow'?'M5 19V12H19V5':'M5 19C5 5 19 19 19 5'}/><circle cx="5" cy="19" r="2" fill="var(--v3-surface)"/><circle cx="19" cy="5" r="2" fill="var(--v3-surface)"/></svg>;
}

function LineToolbar({ element }: { element: LineElement }) {
  const rounded=element.lineCap==='round'||(!element.lineCap&&element.strokeStyle==='dotted');
  return <><V3ColorButton element={element} slot="stroke" label="Line color" ring/>
    <Menu label="Stroke" hideHeading contentClassName="v3-stroke-menu" compact iconOnly icon={<BorderIcon/>}><div className="v3-border-samples v3-line-patterns" role="group" aria-label="Line stroke patterns">{(['solid','dashed','short-dashed','dotted'] as const).map(strokeStyle=><button key={strokeStyle} type="button" title={strokeStyle==='dashed'?'Long dashes':strokeStyle==='short-dashed'?'Short dashes':strokeStyle} aria-label={`Line stroke ${strokeStyle}`} aria-pressed={element.strokeStyle===strokeStyle} onClick={()=>commitElementPatch(element.id,{strokeStyle})}><StrokeSample style={strokeStyle}/></button>)}</div><div className="v3-switch-row"><span>Rounded end points</span><button type="button" role="switch" aria-label="Rounded end points" aria-checked={rounded} onClick={()=>commitElementPatch(element.id,{lineCap:rounded?'butt':'round'})}><span/></button></div><StyleNumber element={element} label="Line width" displayLabel="Stroke weight" min={1} max={20} value={element.strokeWidth} patch={strokeWidth=>({strokeWidth})}/></Menu>
    <Menu label="Line start" strip iconOnly icon={<DecorationIcon kind={element.startDecoration} start/>}><div className="v3-decoration-options">{(['none','arrow','circle','bar'] as const).map(startDecoration=><Action key={startDecoration} label={`Start decoration ${startDecoration}`} pressed={element.startDecoration===startDecoration} onClick={()=>commitElementPatch(element.id,{startDecoration})}>{startDecoration==='none'?<CircleSlash/>:<DecorationIcon kind={startDecoration} start/>}</Action>)}</div></Menu>
    <Action label="Swap ends" onClick={()=>commitElementPatch(element.id,{startDecoration:element.endDecoration,endDecoration:element.startDecoration})}><ArrowLeftRight/></Action>
    <Menu label="Line end" strip iconOnly icon={<DecorationIcon kind={element.endDecoration}/> }><div className="v3-decoration-options">{(['none','arrow','circle','bar'] as const).map(endDecoration=><Action key={endDecoration} label={`End decoration ${endDecoration}`} pressed={element.endDecoration===endDecoration} onClick={()=>commitElementPatch(element.id,{endDecoration})}>{endDecoration==='none'?<CircleSlash/>:<DecorationIcon kind={endDecoration}/>}</Action>)}</div></Menu>
    <Menu label="Line type" hideHeading contentClassName="v3-line-type-menu" compact iconOnly icon={<LineTypeIcon type={element.lineType}/> }><div className="v3-picker-list">{(['straight','elbow','curved'] as const).map(lineType=><Popover.Close asChild key={lineType}><button type="button" aria-label={`Type ${lineType}`} aria-pressed={element.lineType===lineType} onClick={()=>commitElementPatch(element.id,{lineType})}><LineTypeIcon type={lineType}/><span>{lineType==='elbow'?'Elbowed':lineType==='curved'?'Curved':'Straight'}</span>{element.lineType===lineType&&<Check aria-hidden="true"/>}</button></Popover.Close>)}</div></Menu><Opacity element={element}/></>;
}

export function V3ElementToolbar({ element, onEditImage,onEditEffects }: { element: CanvasElement; onEditImage: () => void;onEditEffects?:()=>void }) {
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
    <fieldset disabled={disabled}>{element.type === 'text' ? <TextToolbar key={element.id} element={element}/> : element.type === 'shape' ? <ShapeToolbar key={element.id} element={element} onEditEffects={onEditEffects}/> : element.type === 'image' ? <ImageToolbar key={element.id} element={element} onEditImage={onEditImage}/> : <LineToolbar key={element.id} element={element}/>}</fieldset>
  </div></Disabled.Provider>;
}
