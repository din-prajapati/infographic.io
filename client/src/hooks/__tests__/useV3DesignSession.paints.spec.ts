import { describe, expect, it, vi } from 'vitest';
import { createV3DesignSession } from '../../lib/v3DesignSession';
import type { Paint } from '../../lib/canvasTypes';

describe('US-EDIT-035 session background revisions',()=>{
  it('detects a gradient change with the same legacy fallback and saves its stops',async()=>{
    let backgroundPaint: Paint = {type:'linear',angle:0,stops:[{color:'#ff0000',opacity:1},{color:'#0000ff',opacity:1}]};
    const capture=()=>({elements:[],canvasWidth:100,canvasHeight:100,backgroundColor:'#ff0000',backgroundPaint});
    const save=vi.fn(async()=>({id:'c123456789012345678901234'}));
    const session=createV3DesignSession({capture,reset:()=>{},restore:()=>true,
      load:async()=>({id:'c123456789012345678901234',title:'Paint design',canvasData:capture()}),save});
    await session.open('c123456789012345678901234');
    backgroundPaint={...backgroundPaint,angle:90};session.markDirty();
    expect(session.getState().hasUnsavedChanges).toBe(true);
    await session.save();
    expect(save).toHaveBeenCalledWith(expect.objectContaining({canvasData:expect.objectContaining({backgroundPaint})}));
    expect(session.getState().hasUnsavedChanges).toBe(false);
    session.dispose();
  });
});
