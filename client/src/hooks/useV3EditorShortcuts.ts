import {useEffect} from 'react';
import {useCanvasStore} from './useCanvasStore';
import type {CanvasState} from '../lib/canvasTypes';
import {copyV3Selection,deleteV3Selection,duplicateV3Selection,nudgeV3Selection,pasteV3Clipboard,selectedV3Elements} from '../lib/v3EditorActions';
import {fitCanvasZoomToViewport} from '../lib/canvasState';

function blockedTarget(target:EventTarget|null):boolean {
  return target instanceof Element&&!!target.closest('input,textarea,select,button,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="menu"],[role="menuitem"],[role="dialog"],[role="alertdialog"],[role="combobox"],[role="slider"],[role="spinbutton"],[role="tab"],[data-radix-popper-content-wrapper]');
}

export function useV3EditorShortcuts({enabled}:{enabled:boolean}):void {
  useEffect(()=>{
    if(!enabled)return;
    let previousTool:CanvasState['activeTool']|null=null;
    const releaseHand=()=>{
      if(previousTool===null)return;
      if(useCanvasStore.getState().activeTool==='hand')useCanvasStore.getState().setActiveTool(previousTool);
      previousTool=null;
    };
    const onKeyDown=(event:KeyboardEvent)=>{
      if(event.defaultPrevented||event.isComposing||event.keyCode===229||event.altKey||blockedTarget(event.target)||
        document.querySelector('[role="dialog"]:not([aria-hidden="true"]),[role="alertdialog"]:not([aria-hidden="true"]),[role="menu"]:not([aria-hidden="true"])'))return;
      const state=useCanvasStore.getState(),key=event.key.toLowerCase(),modifier=event.ctrlKey||event.metaKey;
      if(modifier){
        if(event.shiftKey&&key!=='+'&&key!=='=')return;
        const command=key==='d'?duplicateV3Selection:key==='c'?copyV3Selection:key==='v'?pasteV3Clipboard:null;
        if(command){
          if(event.repeat){if(key==='d'&&selectedV3Elements(false).length)event.preventDefault();return;}
          if(command())event.preventDefault();return;
        }
        if(['+','=','-','_'].includes(key)){event.preventDefault();state.setZoom(state.zoom+(['-','_'].includes(key)?-.1:.1));}
        return;
      }
      if(key==='delete'||key==='backspace'){
        if(event.repeat){if(selectedV3Elements(false).length)event.preventDefault();return;}
        if(deleteV3Selection())event.preventDefault();return;
      }
      if(!event.shiftKey&&key==='h'){event.preventDefault();releaseHand();state.setActiveTool('hand');return;}
      if(!event.shiftKey&&(key===' '||event.code==='Space')){
        event.preventDefault();if(previousTool===null){previousTool=state.activeTool;state.setActiveTool('hand');}return;
      }
      if(event.shiftKey&&(key==='1'||key==='!'||event.code==='Digit1')){event.preventDefault();fitCanvasZoomToViewport();return;}
      const delta=event.shiftKey?10:1;
      const movement:Record<string,[number,number]>={arrowleft:[-delta,0],arrowright:[delta,0],arrowup:[0,-delta],arrowdown:[0,delta]};
      const offset=movement[key];
      if(offset){
        // The SVG line handles already own their local keyboard movement.
        if(event.target instanceof Element&&event.target.closest('[data-element-type="line"]'))return;
        if(nudgeV3Selection(...offset))event.preventDefault();
      }
    };
    const onKeyUp=(event:KeyboardEvent)=>{if(event.key===' '||event.code==='Space')releaseHand();};
    window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);window.addEventListener('blur',releaseHand);
    return()=>{window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);window.removeEventListener('blur',releaseHand);releaseHand();};
  },[enabled]);
}
