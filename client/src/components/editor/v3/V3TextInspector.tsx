import React, { useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '../../../hooks/useCanvasStore';
import type { TextElement } from '../../../lib/canvasTypes';
import { commitEdit } from '../../canvas/TextElement';

function TextDraft({element,suspended,isSuspended}: {element:TextElement;suspended:boolean;isSuspended?:()=>boolean}) {
  const [draft,setDraft]=useState(element.content);
  const pending=useRef(draft); pending.current=draft;
  const commit=()=>{
    const current=useCanvasStore.getState().elements.find(el=>el.id===element.id);
    if(current?.type==='text' && !current.locked && pending.current!==current.content) commitEdit(useCanvasStore.getState().updateElement,current,pending.current);
  };
  useEffect(()=>{setDraft(element.content);},[element.content]);
  return <label className="v3-text-draft">Text content<textarea aria-label="Text content" rows={5} value={draft} disabled={element.locked}
    onChange={event=>setDraft(event.target.value)} onBlur={event=>{
      if(suspended || isSuspended?.() || event.relatedTarget instanceof HTMLElement && event.relatedTarget.closest('[data-v3-preview-trigger]'))return;commit();
    }} onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();pending.current=element.content;setDraft(element.content);}}} />
    <small>Changes apply when you leave this field. Escape cancels the draft.</small></label>;
}
export function V3TextInspector({suspended=false,isSuspended}:{suspended?:boolean;isSuspended?:()=>boolean}) {
  const {elements,selectedElementIds,selectElement}=useCanvasStore();
  const texts=elements.filter((el):el is TextElement=>el.type==='text');
  const selected=texts.find(el=>selectedElementIds.length===1 && selectedElementIds[0]===el.id);
  return <section aria-label="Text inspector" className="v3-text-inspector">
    {selected ? <TextDraft key={selected.id} element={selected} suspended={suspended} isSuspended={isSuspended}/> : <p>Select a text element to edit its content.</p>}
    <section aria-label="Text elements"><h3>Text elements</h3>{texts.map(el=><button key={el.id} disabled={el.locked||!el.visible} aria-pressed={selected?.id===el.id} onClick={()=>selectElement(el.id)}>{el.content||el.name||'Empty text'}</button>)}</section>
  </section>;
}
