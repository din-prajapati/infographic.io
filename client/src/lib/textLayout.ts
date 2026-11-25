import type { TextElement, TextTransform } from './canvasTypes';

/** Presentation only: the original editable content is never rewritten. */
export function transformTextContent(content:string, transform:TextTransform):string {
  if(transform==='uppercase')return content.toUpperCase();
  if(transform==='lowercase')return content.toLowerCase();
  if(transform==='capitalize')return content.toLowerCase().replace(/\p{L}[\p{L}\p{M}\p{N}'\u2019]*/gu,word=>word.charAt(0).toUpperCase()+word.slice(1));
  return content;
}
export function formatTextContent(element:Pick<TextElement,'content'|'textTransform'|'listStyle'>):string {
  const text=transformTextContent(element.content,element.textTransform);
  return element.listStyle==='bullet'?`\u2022 ${text}`:element.listStyle==='numbered'?`1. ${text}`:text;
}
/** Tracking is expressed in thousandths of an em, matching the toolbar contract. */
export function textLetterSpacingPx(fontSize:number,tracking=0):number {
  return fontSize*(Number.isFinite(tracking)?Math.max(-200,Math.min(800,tracking)):0)/1000;
}
export function textAnchorOffset(height:number,contentHeight:number,anchor:TextElement['textAnchor']='start',padding=4):number {
  const room=Math.max(0,height-padding*2-contentHeight);
  return padding+(anchor==='middle'?room/2:anchor==='end'?room:0);
}
