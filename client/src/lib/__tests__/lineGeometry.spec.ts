import { describe, expect, it } from 'vitest';
import { createLineElement, lineCommands, lineDecorations, linePath, normalizeLineElement, snapLineEnd, isValidLineElement } from '../lineGeometry';

describe('standalone line geometry — US-EDIT-032', () => {
  // Contract: a reversed horizontal 200px line has positive interaction bounds and unchanged endpoints in canvas space.
  it('normalizes reversed horizontal endpoints without changing their positions', () => {
    const line = createLineElement('straight', {x:300,y:80}, {x:100,y:80});
    expect(line).toMatchObject({x:100,y:80,width:200,height:1,stroke:'#153B5B',strokeWidth:2,strokeStyle:'solid',opacity:1});
    expect(line.start).toEqual({x:200,y:0}); expect(line.end).toEqual({x:0,y:0});
    expect(linePath(line)).toBe('M 200 0 L 0 0');
  });
  // Contract: vertical lines retain x=0 path geometry while their interaction box width remains one design pixel.
  it('retains vertical geometry', () => {
    const line=createLineElement('straight',{x:80,y:30},{x:80,y:230});
    expect(line.width).toBe(1); expect(line.height).toBe(200);
    expect(lineCommands(line)).toEqual([{type:'move',point:{x:0,y:0}},{type:'line',point:{x:0,y:200}}]);
  });
  // Contract: Shift straight endpoint snapping returns an exact 45-degree ray at the original gesture length.
  it('snaps straight endpoints to 45 degree increments', () => {
    const result=snapLineEnd({x:0,y:0},{x:80,y:60});
    expect(result.x).toBeCloseTo(Math.SQRT1_2*100);expect(result.y).toBeCloseTo(Math.SQRT1_2*100);
  });
  // Contract: curved SVG and native exporters consume the same quadratic endpoint and control command.
  it('exports shared quadratic commands', () => {
    const line=createLineElement('curved',{x:10,y:100},{x:210,y:100});
    expect(lineCommands(line)[1]).toEqual({type:'quadratic',control:line.control,point:line.end});
    expect(linePath(line)).toContain(`Q ${line.control.x} ${line.control.y} ${line.end.x} ${line.end.y}`);
  });
  // Contract: every elbow segment changes one axis only, including a reversed path.
  it('preserves right angles in elbow paths', () => {
    const line=createLineElement('elbow',{x:200,y:200},{x:30,y:40});
    const points=lineCommands(line).map(command=>command.point);
    for(let index=1;index<points.length;index++)expect(points[index].x===points[index-1].x||points[index].y===points[index-1].y).toBe(true);
  });
  // Contract: start/end decorations have independent positions and outward tangent angles in radians.
  it('computes independent endpoint decorations', () => {
    const line={...createLineElement('straight',{x:0,y:0},{x:200,y:0}),startDecoration:'circle' as const,endDecoration:'arrow' as const};
    const decorations=lineDecorations(line);
    expect(decorations).toHaveLength(2);expect(decorations[0]).toMatchObject({kind:'circle',tip:{x:0,y:0}});
    expect(decorations[1]).toMatchObject({kind:'arrow',tip:{x:200,y:0},angle:0});
  });
  // Contract: normalization after handle movement preserves canvas-space endpoints and style.
  it('renormalizes local handle geometry without moving the endpoint', () => {
    const line=createLineElement('straight',{x:100,y:100},{x:300,y:200});
    const edited=normalizeLineElement({...line,start:{x:-20,y:-10}});
    expect(edited.x+edited.start.x).toBe(80);expect(edited.y+edited.start.y).toBe(90);
    expect(edited.x+edited.end.x).toBe(300);expect(edited.y+edited.end.y).toBe(200);
  });
  // Contract: reboxing a rotated line after an endpoint edit leaves both world-space endpoints unchanged.
  it('preserves world coordinates when normalizing a rotated line', () => {
    const line={...createLineElement('straight',{x:100,y:100},{x:300,y:200}),rotation:65,start:{x:-30,y:-40}};
    const edited=normalizeLineElement(line);
    const world=(element:typeof line,point:{x:number;y:number})=>{
      const angle=element.rotation*Math.PI/180,dx=point.x-element.width/2,dy=point.y-element.height/2;
      return {x:element.x+element.width/2+dx*Math.cos(angle)-dy*Math.sin(angle),y:element.y+element.height/2+dx*Math.sin(angle)+dy*Math.cos(angle)};
    };
    expect(world(edited,edited.start).x).toBeCloseTo(world(line,line.start).x);
    expect(world(edited,edited.start).y).toBeCloseTo(world(line,line.start).y);
    expect(world(edited,edited.end).x).toBeCloseTo(world(line,line.end).x);
    expect(world(edited,edited.end).y).toBeCloseTo(world(line,line.end).y);
  });
  // Contract: line loading refuses NaN geometry, invalid enums and non-positive stroke width before touching the canvas.
  it('rejects invalid saved line geometry', () => {
    const line=createLineElement('straight',{x:0,y:0},{x:200,y:0});
    expect(isValidLineElement(line)).toBe(true);
    expect(isValidLineElement({...line,start:{x:NaN,y:0}})).toBe(false);
    expect(isValidLineElement({...line,strokeWidth:0})).toBe(false);
    expect(isValidLineElement({...line,lineType:'unsupported'})).toBe(false);
  });
});
