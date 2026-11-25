import React,{useEffect,useRef,useState} from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {ArrowDown,ArrowDownToLine,ArrowUp,ArrowUpToLine,Clipboard,Copy,Eye,EyeOff,Lock,MoreHorizontal,Trash2,Unlock} from 'lucide-react';
import {useCanvasStore} from '../../../hooks/useCanvasStore';
import {clearElementPreview} from '../../../hooks/useV3ElementPreview';
import {copyV3Selection,deleteV3Selection,duplicateV3Selection,pasteV3Clipboard,toggleV3SelectionLock} from '../../../lib/v3EditorActions';
import {canMoveV3Layer,moveV3Layer,setV3LayerLocked,setV3LayerVisibility} from '../../../lib/v3LayerActions';
import './v3-layers-panel.css';

type Direction='forward'|'backward'|'front'|'back';
const stackCommands=[['Bring forward','forward',ArrowUp],['Send backward','backward',ArrowDown],['Bring to front','front',ArrowUpToLine],['Send to back','back',ArrowDownToLine]] as const;
interface Props{label:string;targetId?:string;menuLabel?:string;triggerClassName?:string;onMoved?:(message:string)=>void;inline?:boolean;onClose?:()=>void}

function ElementActionItem({inline,disabled,onSelect,children}:{inline:boolean;disabled?:boolean;onSelect:()=>void;children:React.ReactNode}){
  return inline?<button type="button" role="menuitem" disabled={disabled} aria-disabled={disabled||undefined} onClick={onSelect}>{children}</button>:<DropdownMenu.Item disabled={disabled} onSelect={onSelect}>{children}</DropdownMenu.Item>;
}
export function V3ElementActionsMenu({label,targetId,menuLabel='Element actions',triggerClassName='v3-toolbar-icon',onMoved,inline=false,onClose}:Props){
  const state=useCanvasStore(),trigger=useRef<HTMLButtonElement>(null);
  const [portal,setPortal]=useState<HTMLElement|null>(null),[open,setOpen]=useState(inline);
  const snapshot=useRef<string[]>(inline?[...state.selectedElementIds]:[]);
  const targets=state.elements.filter(element=>state.selectedElementIds.includes(element.id));
  const single=targets.length===1&&state.selectedElementIds.length===1?targets[0]:undefined;
  const visible=targets.filter(element=>element.visible),editable=visible.filter(element=>!element.locked);
  const allLocked=!!visible.length&&visible.every(element=>element.locked);
  const lockLabel=single?(single.locked?'Unlock':'Lock'):(allLocked?'Unlock':'Lock');
  const validSnapshot=()=>{
    const current=useCanvasStore.getState();
    return snapshot.current.length>0&&snapshot.current.length===current.selectedElementIds.length&&snapshot.current.every((id,index)=>id===current.selectedElementIds[index]&&current.elements.some(element=>element.id===id));
  };
  useEffect(()=>{setPortal(trigger.current?.closest<HTMLElement>('.v3-editor')??null);},[]);
  useEffect(()=>{if(open&&!validSnapshot())setOpen(false);},[state.elements,state.selectedElementIds,open]);
  function changeOpen(next:boolean){
    clearElementPreview();
    if(next){
      const current=useCanvasStore.getState();
      if(targetId){if(!current.elements.some(element=>element.id===targetId))return;current.selectElements([targetId]);}
      snapshot.current=[...useCanvasStore.getState().selectedElementIds];
    }
    setOpen(next);
  }
  function run(command:()=>boolean){if(validSnapshot()){command();if(inline)onClose?.();}}
  function move(direction:Direction){
    run(()=>{
      if(snapshot.current.length!==1)return false;
      const element=useCanvasStore.getState().elements.find(item=>item.id===snapshot.current[0]);
      if(!element||!moveV3Layer(element.id,direction))return false;
      onMoved?.(`Moved ${element.name} ${direction==='front'?'to front':direction==='back'?'to back':direction}.`);return true;
    });
  }
  const items=<>      {([['Copy',Copy,copyV3Selection,!!visible.length],['Paste',Clipboard,pasteV3Clipboard,!!targets.length&&editable.length===targets.length&&!!state.clipboard.length],['Duplicate',Copy,duplicateV3Selection,!!editable.length],['Delete',Trash2,deleteV3Selection,!!editable.length]] as const).map(([name,Icon,command,enabled])=><ElementActionItem inline={inline} key={name} disabled={!enabled} onSelect={()=>run(command)}><Icon/><span>{name}</span></ElementActionItem>)}
      {inline?<div role="separator"/>:<DropdownMenu.Separator/>}
      {stackCommands.map(([name,direction,Icon])=><ElementActionItem inline={inline} key={direction} disabled={!single||!canMoveV3Layer(single.id,direction)} onSelect={()=>move(direction)}><Icon/><span>{name}</span></ElementActionItem>)}
      {inline?<div role="separator"/>:<DropdownMenu.Separator/>}
      <ElementActionItem inline={inline} disabled={!single||single.locked} onSelect={()=>run(()=>{
        const current=useCanvasStore.getState();if(current.selectedElementIds.length!==1)return false;
        const element=current.elements.find(item=>item.id===current.selectedElementIds[0]);return !!element&&setV3LayerVisibility(element.id,!element.visible);
      })}>{single?.visible===false?<Eye/>:<EyeOff/>}<span>{single?.visible===false?'Show':'Hide'}</span></ElementActionItem>
      <ElementActionItem inline={inline} disabled={!single&&!visible.length} onSelect={()=>run(()=>{
        const current=useCanvasStore.getState();
        if(current.selectedElementIds.length===1){const element=current.elements.find(item=>item.id===current.selectedElementIds[0]);return !!element&&setV3LayerLocked(element.id,!element.locked);}
        return toggleV3SelectionLock();
      })}>{lockLabel==='Unlock'?<Unlock/>:<Lock/>}<span>{lockLabel}</span></ElementActionItem>
</>;
  if(inline)return open?<div className="v3-layer-menu v3-inline-element-actions" role="menu" aria-label={menuLabel} onKeyDown={event=>{
    if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
    const enabled=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]:not(:disabled)'));
    if(!enabled.length)return;event.preventDefault();const index=enabled.indexOf(document.activeElement as HTMLButtonElement);
    enabled[event.key==='Home'?0:event.key==='End'?enabled.length-1:(index+(event.key==='ArrowUp'?-1:1)+enabled.length)%enabled.length].focus();
  }}>{items}</div>:null;
  return <DropdownMenu.Root modal={false} open={open} onOpenChange={changeOpen}>
    <DropdownMenu.Trigger asChild><button ref={trigger} type="button" className={triggerClassName} aria-label={label} title={label}><MoreHorizontal/></button></DropdownMenu.Trigger>
    <DropdownMenu.Portal container={portal}><DropdownMenu.Content className="v3-layer-menu" aria-label={menuLabel} aria-labelledby={undefined} side={targetId?'right':'bottom'} align={targetId?'start':'end'} sideOffset={8} collisionPadding={12}>{items}
    </DropdownMenu.Content></DropdownMenu.Portal>
  </DropdownMenu.Root>;
}
