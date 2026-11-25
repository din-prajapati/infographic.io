import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ImageElement } from '../ImageElement';
import { LineElement } from '../LineElement';
import { createImageElement } from '../../../lib/canvasUtils';
import { createLineElement } from '../../../lib/lineGeometry';
import type { ImageElement as ImageModel } from '../../../lib/canvasTypes';

const boundary=vi.hoisted(()=>({props:null as Record<string,unknown>|null}));
vi.mock('react-rnd',()=>({Rnd:(props:Record<string,unknown>)=>{boundary.props=props;return <div>{props.children as React.ReactNode}</div>;}}));

function imageMarkup(element: ImageModel) {
  const wrapper=document.createElement('div');
  wrapper.innerHTML=renderToStaticMarkup(<ImageElement element={element} isSelected={false} onSelect={()=>{}}/>);
  return wrapper;
}
describe('US-EDIT-034 image fit rendering',()=>{
  it('places the four V3 side resize handles at frame edge midpoints',()=>{
    renderToStaticMarkup(<ImageElement element={createImageElement('/test.png')} isSelected onSelect={()=>{}} allowFrameResize/>);
    const handles=boundary.props!.resizeHandleStyles as Record<string,React.CSSProperties>;
    for(const side of ['left','right'])expect(handles[side]).toMatchObject({top:'50%',marginTop:-Number(handles[side].height)/2});
    for(const side of ['top','bottom'])expect(handles[side]).toMatchObject({left:'50%',marginLeft:-Number(handles[side].width)/2});
    const half=Number(handles.topLeft.width)/2;
    expect(handles.topLeft).toMatchObject({top:-half,left:-half});
    expect(handles.topRight).toMatchObject({top:-half,right:-half});
    expect(handles.bottomLeft).toMatchObject({bottom:-half,left:-half});
    expect(handles.bottomRight).toMatchObject({bottom:-half,right:-half});
    expect(handles.left.left).toBe(-half);expect(handles.right.right).toBe(-half);
    expect(handles.top.top).toBe(-half);expect(handles.bottom.bottom).toBe(-half);
    renderToStaticMarkup(<ImageElement element={createImageElement('/test.png')} isSelected onSelect={()=>{}}/>);
    expect((boundary.props!.resizeHandleStyles as Record<string,React.CSSProperties>).right.top).toBeUndefined();
  });
  it('permits V3 side frame resizing while preserving corner and legacy aspect locks',()=>{
    const host=document.createElement('div'),root=createRoot(host),image={...createImageElement('/test.png'),width:400,height:200};
    const render=(allowFrameResize:boolean)=>act(()=>root.render(<ImageElement element={image} isSelected onSelect={()=>{}} allowFrameResize={allowFrameResize}/>));
    const start=(direction:string)=>act(()=>(boundary.props!.onResizeStart as (event:unknown,direction:string)=>void)({},direction));
    Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
    render(true);expect(boundary.props!.lockAspectRatio).toBe(2);start('right');expect(boundary.props!.lockAspectRatio).toBe(false);start('bottomRight');expect(boundary.props!.lockAspectRatio).toBe(2);
    render(false);start('right');expect(boundary.props!.lockAspectRatio).toBe(2);act(()=>root.unmount());
  });
  it('flips an ordinary gradient border with the image while AI border inherits its outer flip',()=>{
    const image={...createImageElement('/test.png'),borderWidth:3,flipHorizontal:true};
    expect((imageMarkup(image).querySelector('svg') as SVGElement).style.transform).toBe('scaleX(-1) scaleY(1)');
    const ai=imageMarkup({...image,isAiImport:true});
    expect((ai.querySelector('[role="img"]') as HTMLElement).style.transform).toContain('scaleX(-1)');
    expect((ai.querySelector('svg') as SVGElement).style.transform).toBe('');
  });
  it.each([false,true])('renders gradient borders and overlays for AI import %s',isAiImport=>{
    const paint={type:'linear' as const,angle:90 as const,stops:[{color:'#ff0000',opacity:.5},{color:'#0000ff',opacity:1}]};
    const node=imageMarkup({...createImageElement('/test.png'),isAiImport,borderWidth:3,paints:{stroke:paint,overlay:paint}});
    expect(node.querySelector('linearGradient')!.getAttribute('gradientUnits')).toBe('userSpaceOnUse');
    expect(node.querySelectorAll('stop')).toHaveLength(2);
    expect(node.querySelector('stop')!.getAttribute('stop-opacity')).toBe('0.5');
    expect((node.querySelector('[data-paint-overlay]') as HTMLElement).style.background).toContain('linear-gradient(to bottom');
    expect((node.querySelector('[data-paint-overlay]') as HTMLElement).style.mixBlendMode).toBe('multiply');
  });
  it.each(['contain','cover','fill'] as const)('honors explicit %s for AI imports',fit=>{
    const image={...createImageElement('/test.png'),isAiImport:true,objectFit:fit};
    const artwork=imageMarkup(image).querySelector('[role="img"] > div') as HTMLElement;
    expect(artwork.style.backgroundSize).toBe(fit==='fill'?'100% 100%':fit);
  });
  it('preserves contain for AI imports without saved fit',()=>{
    expect((imageMarkup({...createImageElement('/test.png'),isAiImport:true}).querySelector('[role="img"] > div') as HTMLElement).style.backgroundSize).toBe('contain');
  });
  it.each(['contain','cover','fill'] as const)('preserves ordinary image %s rendering',fit=>{
    expect(imageMarkup({...createImageElement('/test.png'),objectFit:fit}).querySelector('img')!.style.objectFit).toBe(fit);
  });
  it('keeps existing ordinary crop rendering ahead of fit',()=>{
    const artwork=imageMarkup({...createImageElement('/test.png'),objectFit:'contain',crop:{x:10,y:20,width:150,height:100}}).querySelector('img')!;
    expect(artwork.style.objectFit).toBe('cover');
    expect(artwork.style.transform).toBe('translate(-20px, -40px)');
  });
});
describe('US-EDIT-034 SVG line cap rendering',()=>{
  it('keeps gradient decoration coordinates in the line paint space',()=>{
    const element={...createLineElement('straight',{x:0,y:0},{x:200,y:100}),endDecoration:'circle' as const,
      paints:{stroke:{type:'linear' as const,angle:0 as const,stops:[{color:'#ff0000',opacity:1},{color:'#0000ff',opacity:1}]}}};
    const node=document.createElement('div');
    node.innerHTML=renderToStaticMarkup(<LineElement element={element} isSelected={false} onSelect={()=>{}}/>);
    const circle=node.querySelector('circle')!;
    expect(circle.getAttribute('cx')).toBe(String(element.end.x));
    expect(circle.getAttribute('cy')).toBe(String(element.end.y));
    expect(circle.parentElement!.getAttribute('transform')).toBeNull();
    expect(circle.getAttribute('style')).toContain(`fill:url(#paint-${element.id}-stroke)`);
  });
  it.each([
    ['solid',undefined,'butt'],['dashed',undefined,'butt'],['dotted',undefined,'round'],
    ['solid','round','round'],['dotted','butt','butt'],
  ] as const)('renders %s with cap %s as %s',(strokeStyle,lineCap,expected)=>{
    const element={...createLineElement('straight',{x:0,y:0},{x:200,y:0}),strokeStyle,lineCap};
    const node=document.createElement('div');
    node.innerHTML=renderToStaticMarkup(<LineElement element={element} isSelected={false} onSelect={()=>{}}/>);
    expect((node.querySelector('g > path') as SVGElement).style.strokeLinecap).toBe(expected);
  });
});
