import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {Simulate} from 'react-dom/test-utils';
import {describe,it,expect} from 'vitest';
import {TextElement} from '../TextElement';
import {createTextElement} from '../../../lib/canvasUtils';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
describe('US-EDIT-034 tracking and text anchors',()=>{
  it('renders gradient content with matching solid decoration fallback and editable source',()=>{
    const element={...createTextElement(),content:'Gradient title',underline:true,paints:{color:{type:'linear' as const,angle:0 as const,stops:[{color:'#ff0000',opacity:.5},{color:'#0000ff',opacity:1}]}}};
    const node=document.createElement('div');document.body.append(node);const root=createRoot(node);
    try{
      act(()=>root.render(<TextElement element={element} isSelected onSelect={()=>{}}/>));
      const text=Array.from(node.querySelectorAll('div')).find(n=>n.style.backgroundClip==='text')!;
      expect(text.style.backgroundImage).toContain('linear-gradient(to right');
      expect((text.querySelector('div') as HTMLDivElement).style.textDecorationColor).toBe('rgba(255, 0, 0, 0.5)');
      act(()=>Simulate.doubleClick(node.querySelector('[data-element-id]')!));
      expect(node.querySelector('textarea')!.value).toBe('Gradient title');
      expect(node.querySelector('textarea')!.style.color).toBe('rgba(255, 0, 0, 0.5)');
    }finally{act(()=>root.unmount());node.remove();}
  });
  it.each([['start','flex-start'],['middle','safe center'],['end','safe flex-end']] as const)('renders %s anchor inside fixed dimensions',(textAnchor,justify)=>{
    const element={...createTextElement(),content:'hello WORLD',fontSize:20,letterSpacing:100,textAnchor,textTransform:'capitalize' as const};
    const node=document.createElement('div');document.body.append(node);const root=createRoot(node);
    try{
      act(()=>root.render(<TextElement element={element} isSelected={false} onSelect={()=>{}}/>));
      const text=Array.from(node.querySelectorAll('div')).find(n=>n.textContent==='Hello World'&&n.style.letterSpacing)!;
      expect(text.style.letterSpacing).toBe('2px');
      expect(text.parentElement!.style.justifyContent).toBe(justify);
      expect(element.content).toBe('hello WORLD');
      expect(node.querySelector('[data-element-id]')!.getAttribute('style')).toContain('height:');
    }finally{act(()=>root.unmount());node.remove();}
  });
  it('retains raw editable content while applying tracking and anchor',()=>{
    const element={...createTextElement(),content:'hello WORLD',fontSize:20,letterSpacing:100,textAnchor:'end' as const,textTransform:'capitalize' as const};
    const node=document.createElement('div');document.body.append(node);const root=createRoot(node);
    try{
      act(()=>root.render(<TextElement element={element} isSelected onSelect={()=>{}}/>));
      act(()=>Simulate.doubleClick(node.querySelector('[data-element-id]')!));
      expect(node.querySelector('textarea')!.value).toBe('hello WORLD');
      expect(node.querySelector('textarea')!.style.letterSpacing).toBe('2px');
      expect(node.querySelector('textarea')!.parentElement!.style.justifyContent).toBe('safe flex-end');
    }finally{act(()=>root.unmount());node.remove();}
  });
});
