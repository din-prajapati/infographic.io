import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const id='c123456789012345678901234';
const base={rotation:0,opacity:1,locked:false,visible:true,zIndex:1};
async function setup(page:Page,theme='light'){
  await page.addInitScript(theme=>{localStorage.setItem('auth_token','paint-test');localStorage.setItem('auth_user',JSON.stringify({id:'paint',name:'Paint Tester',email:'paint@example.test',plan:'SOLO'}));localStorage.setItem('theme',theme);},theme);
  const model={writes:[] as any[],document:{id,name:'Paint test',type:'design',category:'real-estate',tags:[],canvasData:{canvasWidth:800,canvasHeight:600,backgroundColor:'#FFFFFF',elements:[
    {...base,id:'text',type:'text',name:'Headline',x:40,y:50,width:300,height:80,content:'Paint preview',fontFamily:'Arial',fontSize:28,fontWeight:400,bold:false,italic:false,underline:false,strikethrough:false,color:'#123E62',align:'left',lineHeight:1.2,textTransform:'none',listStyle:'none'},
    {...base,id:'shape',type:'shape',name:'Shape',x:60,y:230,width:180,height:120,shapeType:'rectangle',fill:'#00A080',stroke:'#123E62',strokeWidth:2,cornerRadius:0},
    {...base,id:'image',type:'image',name:'Photo',x:500,y:260,width:160,height:120,src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><rect width="160" height="120" fill="#7799aa"/></svg>'),objectFit:'contain',cornerRadius:0,flipHorizontal:false,flipVertical:false,colorOverlay:{color:'#FF0000',opacity:.2},filters:{brightness:100,contrast:100,saturation:100}},
    {...base,id:'line',type:'line',name:'Line',x:100,y:450,width:200,height:2,lineType:'straight',start:{x:0,y:1},end:{x:200,y:1},control:{x:100,y:1},elbowAxis:'horizontal',elbowOffset:100,stroke:'#123E62',strokeWidth:2,strokeStyle:'solid',startDecoration:'none',endDecoration:'none'},
  ]}}};
  await page.route('**/api/**',route=>{if(/\/designs(?:\/[^/]+)?$/.test(new URL(route.request().url()).pathname)){if(route.request().method()==='GET')return route.fulfill({json:model.document});const body=route.request().postDataJSON();model.writes.push(body);model.document={...model.document,...body};return route.fulfill({json:model.document});}return route.fulfill({json:[]});});
  await page.goto(`/editor?editor=v3&designId=${id}`,{waitUntil:'domcontentloaded'});await expect(page.getByTestId('design-canvas').getByText('Paint preview')).toBeVisible();return model;
}
const artwork=(page:Page,id:string)=>page.getByTestId('design-canvas').locator(`[data-element-id="${id}"]`);
const bar=(page:Page,type:string)=>page.getByRole('toolbar',{name:`${type} formatting`,exact:true});
async function select(page:Page,elementId:string){if(elementId==='line'){await page.getByRole('button',{name:'Layers',exact:true}).click();await page.getByText('Line',{exact:true}).click();await page.getByRole('button',{name:'Layers',exact:true}).click();}else await artwork(page,elementId).click();}
async function save(page:Page,model:Awaited<ReturnType<typeof setup>>){const before=model.writes.length;await page.getByRole('button',{name:'Save',exact:true}).click();await expect.poll(()=>model.writes.length).toBeGreaterThan(before);return model.writes.at(-1).canvasData;}

// Contract: each approved target writes only its channel, persists No color, and remains undoable.
for(const target of ['text','fill','shape-stroke','image-stroke','line','overlay','shadow','background'])test(`${target} uses the shared color sidebar and persists No color`,async({page})=>{
  const model=await setup(page);const kind=target==='text'?'text':target==='line'?'line':target==='overlay'||target==='image-stroke'?'image':'shape';
  if(target==='background'){await page.getByRole('button',{name:'Canvas settings',exact:true}).click();await page.getByRole('button',{name:'Canvas background',exact:true}).click();}
  else {await select(page,kind);
    if(target==='overlay'){await bar(page,'image').getByRole('button',{name:'Edit image',exact:true}).click();await page.getByRole('button',{name:'Overlay color',exact:true}).click();}
    else if(target==='shadow'){await bar(page,'shape').getByRole('button',{name:'Effects',exact:true}).click();await page.getByRole('button',{name:'Effect Drop',exact:true}).click();await page.getByRole('button',{name:'Shadow color',exact:true}).click();}
    else await bar(page,kind).getByRole('button',{name:target==='text'?'Text color':target==='fill'?'Fill':target==='line'?'Line color':'Border color',exact:true}).click();
  }
  await expect(page.getByRole('button',{name:'Add color',exact:true})).toBeVisible();await page.getByRole('button',{name:'No color',exact:true}).click();
  const data=await save(page,model),element=data.elements.find((el:any)=>el.id===kind);
  if(target==='background')expect(data.backgroundPaint).toEqual({type:'none'});
  else if(target==='shadow')expect(element.shadow).toBeUndefined();
  else expect(element.paints[target==='text'?'color':target==='fill'?'fill':target==='overlay'?'overlay':'stroke']).toEqual({type:'none'});
  await page.getByRole('button',{name:'Close color panel',exact:true}).click();
  if(target==='shadow'){await expect(page.getByRole('heading',{name:'Effects',exact:true})).toBeVisible();await page.getByRole('button',{name:'Close Effects',exact:true}).click();}
  if(target!=='overlay')await expect(page.getByRole('heading',{name:'Templates',exact:true})).toBeVisible();
  else await expect(page.getByRole('heading',{name:'Edit image',exact:true})).toBeVisible();
});

// Contract: alpha drafts do not enter saved history, Escape restores, Enter commits the exact paint once.
for(const theme of ['light','dark'])test(`${theme} reference picker previews alpha and saves gradient`,async({page},info)=>{
  await page.setViewportSize({width:1242,height:668});const model=await setup(page,theme);await select(page,'shape');await bar(page,'shape').getByRole('button',{name:'Fill',exact:true}).click();
  await page.getByRole('button',{name:'Add color',exact:true}).click();const hex=page.getByRole('textbox',{name:'Hex color',exact:true});await hex.fill('#FF0000');await hex.press('Enter');
  const alpha=page.getByRole('spinbutton',{name:'Color opacity percent',exact:true});await alpha.fill('50');
  await expect(artwork(page,'shape').locator('svg[data-artwork-svg] > g')).toHaveCSS('fill','rgba(255, 0, 0, 0.5)');
  await alpha.press('Escape');await expect(artwork(page,'shape').locator('svg[data-artwork-svg] > g')).toHaveCSS('fill','rgb(255, 0, 0)');
  await alpha.fill('50');await alpha.press('Enter');
  await page.mouse.move(1150,580);await page.screenshot({path:info.outputPath(`color-solid-${theme}.png`)});
  await page.getByRole('tab',{name:'Gradient',exact:true}).click();await page.getByRole('button',{name:'Diagonal',exact:true}).click();
  await expect(artwork(page,'shape').locator('linearGradient')).toHaveCount(1);await page.screenshot({path:info.outputPath(`color-gradient-${theme}.png`)});
  const data=await save(page,model);expect(data.elements.find((el:any)=>el.id==='shape').paints.fill).toMatchObject({type:'linear',angle:135,stops:[{color:'#FF0000',opacity:.5},{color:'#FFFFFF',opacity:1}]});
  await page.reload({waitUntil:'domcontentloaded'});await expect(artwork(page,'shape').locator('linearGradient')).toHaveCount(1);
});

test('background draft cancels and transparent PNG retains alpha with undo',async({page},info)=>{
  const model=await setup(page);await page.getByRole('button',{name:'Canvas settings',exact:true}).click();await page.getByRole('button',{name:'Canvas background',exact:true}).click();await page.getByRole('button',{name:'Add color',exact:true}).click();
  await page.getByRole('tab',{name:'Gradient',exact:true}).click();await expect(page.getByTestId('design-canvas')).toHaveCSS('background-image',/linear-gradient/);
  await page.keyboard.press('Escape');await expect(page.getByTestId('design-canvas')).toHaveCSS('background-image','none');await expect(page.getByRole('button',{name:'Undo',exact:true})).toBeDisabled();
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'No color',exact:true}).click();expect((await save(page,model)).backgroundPaint).toEqual({type:'none'});
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export',exact:true}).click();const download=await pending,filename=info.outputPath('transparent.png');await download.saveAs(filename);
  const bytes=await readFile(filename);const alpha=await page.evaluate(async encoded=>{const img=new Image();img.src='data:image/png;base64,'+encoded;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0);return ctx.getImageData(0,0,1,1).data[3];},bytes.toString('base64'));expect(alpha).toBe(0);
  await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.getByTestId('design-canvas')).toHaveCSS('background-color','rgb(255, 255, 255)');
});

test('compact stroke patterns and line type match reference and restore weight',async({page},info)=>{
  await page.setViewportSize({width:1242,height:668});const model=await setup(page,'dark');await select(page,'shape');await bar(page,'shape').getByRole('button',{name:'Border',exact:true}).click();
  const popover=page.locator('.v3-stroke-menu');await expect(popover.getByRole('heading')).toHaveCount(0);await expect(popover.getByRole('group',{name:'Border styles'}).getByRole('button')).toHaveCount(5);
  const weight=page.getByLabel('Border width value',{exact:true});await weight.fill('7');await weight.press('Enter');await page.getByRole('button',{name:'Border none',exact:true}).click();await page.keyboard.press('Escape');await bar(page,'shape').getByRole('button',{name:'Border',exact:true}).click();await page.getByRole('button',{name:'Border short-dashed',exact:true}).click();
  await expect(weight).toHaveValue('7');await page.screenshot({path:info.outputPath('color-stroke-dark.png')});await page.keyboard.press('Escape');
  expect((await save(page,model)).elements.find((el:any)=>el.id==='shape')).toMatchObject({strokeStyle:'short-dashed',strokeWidth:7});
  await select(page,'line');await bar(page,'line').getByRole('button',{name:'Line type',exact:true}).click();const menu=page.locator('.v3-line-type-menu');expect((await menu.boundingBox())!.width).toBeLessThanOrEqual(160);await page.screenshot({path:info.outputPath('color-line-type-dark.png')});await page.getByRole('button',{name:'Type elbow',exact:true}).click();await expect(menu).toHaveCount(0);
  expect((await save(page,model)).elements.find((el:any)=>el.id==='line').lineType).toBe('elbow');
});

test('Brand color editing returns to color panel and original sidebar',async({page})=>{
  await setup(page);await page.getByRole('button',{name:'Text',exact:true}).click();await select(page,'text');await bar(page,'text').getByRole('button',{name:'Text color',exact:true}).click();await page.getByRole('button',{name:'Edit brand colors',exact:true}).click();await page.getByRole('button',{name:'Close Brand',exact:true}).click();await expect(page.getByRole('button',{name:'Add color',exact:true})).toBeVisible();await page.getByRole('button',{name:'Close color panel',exact:true}).click();await expect(page.getByRole('heading',{name:'Text',exact:true})).toBeVisible();
});

// Contract: gradients are real saved paints for every non-shadow target, including radial strokes and image overlays.
for(const target of ['text','shape-stroke','image-stroke','line','overlay','background'])test(`${target} radial gradient survives save reload and PNG export`,async({page},info)=>{
  const model=await setup(page);const kind=target==='text'?'text':target==='line'?'line':target==='overlay'||target==='image-stroke'?'image':'shape';
  if(target==='background'){await page.getByRole('button',{name:'Canvas settings',exact:true}).click();await page.getByRole('button',{name:'Canvas background',exact:true}).click();}
  else {await select(page,kind);if(target==='overlay'){await bar(page,'image').getByRole('button',{name:'Edit image',exact:true}).click();await page.getByRole('button',{name:'Overlay color',exact:true}).click();}else await bar(page,kind).getByRole('button',{name:target==='text'?'Text color':target==='line'?'Line color':'Border color',exact:true}).click();}
  await page.getByRole('button',{name:'Add color',exact:true}).click();await page.getByRole('tab',{name:'Gradient',exact:true}).click();await page.getByRole('button',{name:'Center out',exact:true}).click();
  const data=await save(page,model),slot=target==='text'?'color':target==='overlay'?'overlay':'stroke';const paint=target==='background'?data.backgroundPaint:data.elements.find((el:any)=>el.id===kind).paints[slot];
  expect(paint).toMatchObject({type:'radial',center:'center'});expect(paint.stops).toHaveLength(2);
  await page.reload({waitUntil:'domcontentloaded'});await expect(artwork(page,'text').getByText('Paint preview')).toBeVisible();
  if(target==='background')await expect(page.getByTestId('design-canvas')).toHaveCSS('background-image',/radial-gradient/);
  else if(target==='text')await expect(artwork(page,'text').locator('div[style*="background-clip"]').first()).toHaveCSS('background-image',/radial-gradient/);
  else if(target==='overlay')await expect(artwork(page,'image').locator('div[style*="mix-blend-mode"]').first()).toHaveCSS('background-image',/radial-gradient/);
  else await expect(artwork(page,kind).locator('radialGradient')).toHaveCount(1);
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export',exact:true}).click();const download=await pending;await download.saveAs(info.outputPath(`${target}-radial.png`));expect((await readFile(info.outputPath(`${target}-radial.png`))).byteLength).toBeGreaterThan(1000);
  if(target==='background'){await page.goto(`/editor?designId=${id}`,{waitUntil:'domcontentloaded'});await expect(page.locator('[data-canvas-container]')).toHaveCSS('background-image',/radial-gradient/);}
});

test('non-square diagonal background has matching DOM direction and exported corner colors',async({page},info)=>{
  await setup(page);await page.getByRole('button',{name:'Canvas settings',exact:true}).click();await page.getByRole('button',{name:'Canvas background',exact:true}).click();await page.getByRole('button',{name:'Add color',exact:true}).click();
  const hex=page.getByRole('textbox',{name:'Hex color',exact:true});await hex.fill('#FF0000');await hex.press('Enter');await page.getByRole('tab',{name:'Gradient',exact:true}).click();await page.getByRole('button',{name:'Diagonal',exact:true}).click();
  await expect(page.getByTestId('design-canvas')).toHaveCSS('background-image',/126\.87deg/);
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export',exact:true}).click();const download=await pending,path=info.outputPath('diagonal-background.png');await download.saveAs(path);
  const pixels=await page.evaluate(async encoded=>{const img=new Image();img.src='data:image/png;base64,'+encoded;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0);return {top:Array.from(ctx.getImageData(4,4,1,1).data),bottom:Array.from(ctx.getImageData(img.width-5,img.height-5,1,1).data)};},(await readFile(path)).toString('base64'));
  expect(pixels.top[0]).toBe(255);expect(pixels.top[1]).toBeLessThan(10);expect(pixels.bottom[0]).toBe(255);expect(pixels.bottom[1]).toBeGreaterThan(245);
});
