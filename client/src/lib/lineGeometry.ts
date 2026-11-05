import type { LineElement, LineType } from './canvasTypes';
import { generateId } from './canvasUtils';

export interface LinePoint { x: number; y: number }
export type LineCommand = { type: 'move' | 'line'; point: LinePoint } | { type: 'quadratic'; control: LinePoint; point: LinePoint };
export interface LineDecoration { kind: 'arrow' | 'circle' | 'bar'; tip: LinePoint; angle: number; size: number }

export function snapLineEnd(start: LinePoint, end: LinePoint): LinePoint {
  const dx = end.x - start.x, dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * Math.PI / 4;
  return { x: start.x + Math.cos(angle) * length, y: start.y + Math.sin(angle) * length };
}

export function lineCommands(element: LineElement): LineCommand[] {
  const { start, end, control, elbowAxis, elbowOffset } = element;
  if (element.lineType === 'curved') return [{type:'move',point:start},{type:'quadratic',control,point:end}];
  if (element.lineType === 'elbow') return [{type:'move',point:start},
    {type:'line',point:elbowAxis === 'horizontal' ? {x:elbowOffset,y:start.y} : {x:start.x,y:elbowOffset}},
    {type:'line',point:elbowAxis === 'horizontal' ? {x:elbowOffset,y:end.y} : {x:end.x,y:elbowOffset}},
    {type:'line',point:end}];
  return [{type:'move',point:start},{type:'line',point:end}];
}

export function linePath(element: LineElement): string {
  return lineCommands(element).map(command => command.type === 'quadratic'
    ? `Q ${command.control.x} ${command.control.y} ${command.point.x} ${command.point.y}`
    : `${command.type === 'move' ? 'M' : 'L'} ${command.point.x} ${command.point.y}`).join(' ');
}

export function lineDecorations(element: LineElement): LineDecoration[] {
  const commands = lineCommands(element);
  const points = commands.map(command => command.point);
  let afterStart = element.lineType === 'curved' ? element.control : points.find(point => point.x !== element.start.x || point.y !== element.start.y) ?? element.end;
  let beforeEnd = element.lineType === 'curved' ? element.control : [...points].reverse().find(point => point.x !== element.end.x || point.y !== element.end.y) ?? element.start;
  if (afterStart.x === element.start.x && afterStart.y === element.start.y) afterStart = element.end;
  if (beforeEnd.x === element.end.x && beforeEnd.y === element.end.y) beforeEnd = element.start;
  const size = Math.max(8, element.strokeWidth * 3);
  const result: LineDecoration[] = [];
  if (element.startDecoration !== 'none') result.push({kind:element.startDecoration,tip:element.start,angle:Math.atan2(element.start.y-afterStart.y,element.start.x-afterStart.x),size});
  if (element.endDecoration !== 'none') result.push({kind:element.endDecoration,tip:element.end,angle:Math.atan2(element.end.y-beforeEnd.y,element.end.x-beforeEnd.x),size});
  return result;
}

export function normalizeLineElement(element: LineElement): LineElement {
  const points = [element.start, element.end];
  if (element.lineType === 'curved') points.push(element.control);
  if (element.lineType === 'elbow') points.push(...lineCommands(element).map(command=>command.point));
  const minX = Math.min(...points.map(point=>point.x)), minY = Math.min(...points.map(point=>point.y));
  const width = Math.max(1,Math.max(...points.map(point=>point.x))-minX);
  const height = Math.max(1,Math.max(...points.map(point=>point.y))-minY);
  const centerDelta = {x:minX+width/2-element.width/2,y:minY+height/2-element.height/2};
  const angle = element.rotation*Math.PI/180;
  // A moved local origin also moves the rotation pivot. Keep the world path fixed.
  const center = {x:element.x+element.width/2+centerDelta.x*Math.cos(angle)-centerDelta.y*Math.sin(angle),
    y:element.y+element.height/2+centerDelta.x*Math.sin(angle)+centerDelta.y*Math.cos(angle)};
  const offset=(point:LinePoint)=>({x:point.x-minX,y:point.y-minY});
  return {...element,x:center.x-width/2,y:center.y-height/2,width,height,start:offset(element.start),end:offset(element.end),control:offset(element.control),
    elbowOffset:element.elbowOffset-(element.elbowAxis==='horizontal'?minX:minY)};
}

export function createLineElement(lineType: LineType, start: LinePoint, end: LinePoint): LineElement {
  const dx=end.x-start.x,dy=end.y-start.y;
  const control={x:(start.x+end.x)/2+dy/4,y:(start.y+end.y)/2-dx/4};
  return normalizeLineElement({id:generateId(),type:'line',lineType,x:0,y:0,width:1,height:1,start:{...start},end:{...end},control,
    elbowAxis:'horizontal',elbowOffset:(start.x+end.x)/2,stroke:'#153B5B',strokeWidth:2,strokeStyle:'solid',
    startDecoration:'none',endDecoration:'none',rotation:0,opacity:1,locked:false,visible:true,zIndex:0,
    name:lineType==='straight'?'Straight line':lineType==='curved'?'Curved line':'Elbow line'});
}

export function isValidLineElement(value: unknown): value is LineElement {
  if (!value || typeof value !== 'object') return false;
  const element=value as Record<string,unknown>;
  const point=(entry:unknown)=>!!entry&&typeof entry==='object'&&['x','y'].every(key=>typeof (entry as Record<string,unknown>)[key]==='number'&&Number.isFinite((entry as Record<string,unknown>)[key]));
  return element.type==='line' && ['straight','curved','elbow'].includes(String(element.lineType)) &&
    ['x','y','width','height','rotation','opacity','strokeWidth','elbowOffset'].every(key=>typeof element[key]==='number'&&Number.isFinite(element[key])) &&
    Number(element.width)>0&&Number(element.height)>0&&Number(element.strokeWidth)>0&&Number(element.opacity)>=0&&Number(element.opacity)<=1 &&
    point(element.start)&&point(element.end)&&point(element.control)&&['horizontal','vertical'].includes(String(element.elbowAxis)) &&
    ['solid','dashed','short-dashed','dotted'].includes(String(element.strokeStyle)) && typeof element.stroke==='string' &&
    (element.lineCap===undefined||element.lineCap==='butt'||element.lineCap==='round') &&
    ['none','arrow','circle','bar'].includes(String(element.startDecoration))&&['none','arrow','circle','bar'].includes(String(element.endDecoration));
}
