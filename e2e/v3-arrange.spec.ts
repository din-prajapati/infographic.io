import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
// Contract: Mockups/approved-v3-editor/ARRANGE_VERIFICATION.md (A1-F2). API is intercepted; no backend or paid calls.
const id='c223456789012345678901234';
const base={rotation:0,opacity:1,locked:false,visible:true};
const shape=(id:string,name:string,x:number,y:number,w:number,h:number,zIndex:number,extra={})=>({...base,id,type:'shape',name,x,y,width:w,height:h,zIndex,shapeType:'rectangle',fill:'#FF0000',stroke:'#123E62',strokeWidth:0,cornerRadius:0,...extra});
async function setup(page:Page,theme='dark'){
 await page.addInitScript(theme=>{localStorage.setItem('auth_token','arrange-test');localStorage.setItem('auth_user',JSON.stringify({id:'arrange',name:'Tester',email:'arrange@example.test',plan:'SOLO'}));localStorage.setItem('theme',theme);},theme);
 const photo={...base,id:'photo',type:'image',name:'Photo',x:500,y:350,width:160,height:100,zIndex:2,src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100"><rect width="160" height="100" fill="#00FF00"/></svg>'),objectFit:'contain',cornerRadius:0,flipHorizontal:false,flipVertical:false,colorOverlay:null,filters:{brightness:100,contrast:100,saturation:100}};
 const line={...base,id:'line',type:'line',name:'Blue line',x:100,y:520,width:240,height:2,zIndex:3,lineType:'straight',start:{x:0,y:1},end:{x:240,y:1},control:{x:120,y:1},elbowAxis:'horizontal',elbowOffset:120,stroke:'#0000FF',strokeWidth:3,strokeStyle:'solid',startDecoration:'none',endDecoration:'arrow'};
 const text={...base,id:'text',type:'text',name:'Headline',x:420,y:40,width:270,height:60,zIndex:5,content:'Arrange me',fontFamily:'Arial',fontSize:28,fontWeight:400,bold:false,italic:false,underline:false,strikethrough:false,color:'#123E62',align:'left',lineHeight:1.2,textTransform:'none',listStyle:'none'};
 const model={writes:[] as any[],document:{id,name:'Arrange review',type:'design',category:'real-estate',tags:[],canvasData:{canvasWidth:800,canvasHeight:600,backgroundColor:'#FFFFFF',elements:[shape('shape','Red shape',220,200,160,100,1),photo,line,shape('locked','Locked shape',70,60,120,80,4,{locked:true,fill:'#123E62'}),text]}} as any};
 await page.route('**/api/**',route=>{if(/\/designs(?:\/[^/]+)?$/.test(new URL(route.request().url()).pathname)){if(route.request().method()==='GET')return route.fulfill({json:model.document});const body=route.request().postDataJSON();model.writes.push(body);model.document={...model.document,...body};return route.fulfill({json:model.document});}return route.fulfill({json:[]});});
 await page.goto(`/editor?editor=v3&designId=${id}`,{waitUntil:'domcontentloaded'});await expect(art(page,'text').getByText('Arrange me',{exact:true})).toBeVisible();return model;
}
const art=(page:Page,id:string)=>page.getByTestId('design-canvas').locator(`[data-element-id="${id}"]`);
const footer=(page:Page)=>page.getByRole('button',{name:'Layers',exact:true});
const layers=(page:Page)=>page.getByRole('complementary',{name:'Layers panel',exact:true});
const arrange=(page:Page)=>page.getByRole('complementary',{name:'Arrange panel',exact:true});
async function openArrange(page:Page){await footer(page).click();await expect(layers(page)).toBeVisible();await layers(page).getByRole('tab',{name:'Arrange',exact:true}).click();await expect(arrange(page)).toBeVisible();}
async function save(page:Page,model:Awaited<ReturnType<typeof setup>>){const count=model.writes.length;await page.getByRole('button',{name:'Save',exact:true}).click();await expect.poll(()=>model.writes.length).toBeGreaterThan(count);return model.writes.at(-1).canvasData;}
const saved=(data:any,id:string)=>data.elements.find((element:any)=>element.id===id);

test('A1-A6 footer Layers stays the entry; tabs switch title, panel name and footer state; close restores the previous panel',async({page})=>{
 await setup(page);
 await expect(page.getByRole('complementary',{name:'Templates panel',exact:true})).toBeVisible();
 await footer(page).click();
 await expect(layers(page).getByRole('heading',{name:'Layers',exact:true})).toBeVisible();
 await expect(layers(page).getByRole('tab',{name:'Layers',exact:true})).toHaveAttribute('aria-selected','true');
 await expect(layers(page).getByRole('button',{name:'Align left',exact:true})).toHaveCount(0);
 await expect(footer(page)).toHaveAttribute('aria-expanded','true');
 await layers(page).getByRole('tab',{name:'Arrange',exact:true}).click();
 await expect(arrange(page).getByRole('heading',{name:'Arrange',exact:true})).toBeVisible();
 await expect(arrange(page).getByRole('status')).toHaveText('Select an element to arrange it.');
 await expect(footer(page)).toHaveAttribute('aria-expanded','false');
 await art(page,'shape').click();
 await expect(arrange(page)).toBeVisible();
 await expect(arrange(page).getByRole('textbox',{name:'X position',exact:true})).toHaveValue('220');
 const toolbar=page.getByRole('toolbar',{name:'shape formatting',exact:true});
 await expect(toolbar).toBeVisible();
 await expect(toolbar.getByRole('button',{name:/^(Arrange|Position|Layers)$/})).toHaveCount(0);
 await footer(page).click();
 await expect(layers(page)).toBeVisible();await expect(footer(page)).toHaveAttribute('aria-expanded','true');
 await footer(page).click();
 await expect(layers(page)).toHaveCount(0);await expect(page.getByRole('complementary',{name:'Templates panel',exact:true})).toBeVisible();
 await openArrange(page);
 await page.getByTestId('design-canvas').click({position:{x:780,y:20}});
 await page.keyboard.press('Escape');
 await expect(arrange(page)).toHaveCount(0);await expect(page.getByRole('complementary',{name:'Templates panel',exact:true})).toBeVisible();
 await footer(page).click();await expect(layers(page).getByRole('tab',{name:'Layers',exact:true})).toHaveAttribute('aria-selected','true');
 await layers(page).getByRole('tab',{name:'Arrange',exact:true}).click();
 await arrange(page).getByRole('button',{name:'Close Arrange sidebar',exact:true}).click();
 await expect(arrange(page)).toHaveCount(0);await expect(page.getByRole('complementary',{name:'Templates panel',exact:true})).toBeVisible();
});

test('C/D page alignment and stacking: one Undo step, multi-selection as a unit, save/reload and exported PNG',async({page},info)=>{
 const model=await setup(page);await openArrange(page);
 await art(page,'shape').click();
 await arrange(page).getByRole('button',{name:'Align left',exact:true}).click();
 await expect(page.getByLabel('Selection geometry')).toHaveText('160 × 100 px · x 0, y 200');
 await art(page,'photo').click({modifiers:['Shift']});
 await expect(arrange(page).getByRole('button',{name:'To front',exact:true})).toBeDisabled();
 await arrange(page).getByRole('button',{name:'Align bottom',exact:true}).click();
 let data=await save(page,model);
 expect([saved(data,'shape').x,saved(data,'shape').y,saved(data,'photo').x,saved(data,'photo').y]).toEqual([0,350,500,500]);
 await page.getByRole('button',{name:'Undo',exact:true}).click();
 data=await save(page,model);
 expect([saved(data,'shape').x,saved(data,'shape').y,saved(data,'photo').y]).toEqual([0,200,350]);
 await page.getByRole('button',{name:'Redo',exact:true}).click();
 await art(page,'line').click();
 await arrange(page).getByRole('button',{name:'Align right',exact:true}).click();
 await art(page,'shape').click();
 await arrange(page).getByRole('button',{name:'To front',exact:true}).click();
 await expect(arrange(page).getByRole('button',{name:'To front',exact:true})).toBeDisabled();
 data=await save(page,model);
 expect(saved(data,'line').x).toBeCloseTo(558.5,5); // 800 - 240 path - 1.5 half stroke
 expect(saved(data,'shape').zIndex).toBe(Math.max(...data.elements.map((element:any)=>element.zIndex)));
 expect([saved(data,'shape').y,saved(data,'photo').y]).toEqual([350,500]);
 await page.reload({waitUntil:'domcontentloaded'});await expect(art(page,'text').getByText('Arrange me',{exact:true})).toBeVisible();
 await openArrange(page);await art(page,'shape').click();
 await expect(arrange(page).getByRole('textbox',{name:'X position',exact:true})).toHaveValue('0');
 await expect(arrange(page).getByRole('textbox',{name:'Y position',exact:true})).toHaveValue('350');
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export',exact:true}).click();
 const path=info.outputPath('arrange-aligned.png');await(await pending).saveAs(path);
 const pixels=await page.evaluate(async encoded=>{const img=new Image();img.src='data:image/png;base64,'+encoded;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0);const scale=img.width/800;
  return [[4,400],[300,250],[580,590]].map(([x,y])=>Array.from(ctx.getImageData(x*scale,y*scale,1,1).data).slice(0,3));},(await readFile(path)).toString('base64'));
 expect(pixels).toEqual([[255,0,0],[255,255,255],[0,255,0]]);
});

test('E size and position: ratio lock, Escape revert, invalid input, rotation, locked selection',async({page})=>{
 const model=await setup(page);await openArrange(page);await art(page,'shape').click();
 const panel=arrange(page),width=panel.getByRole('textbox',{name:'Width',exact:true});
 await panel.getByRole('button',{name:'Lock aspect ratio',exact:true}).click();
 await width.fill('320');await width.press('Enter');
 await expect(page.getByLabel('Selection geometry')).toHaveText('320 × 200 px · x 220, y 200');
 await width.fill('999');await width.press('Escape');
 await expect(width).toHaveValue('320');await expect(panel).toBeVisible();
 const height=panel.getByRole('textbox',{name:'Height',exact:true});
 await height.fill('abc');await height.press('Enter');
 await expect(panel.getByRole('alert')).toHaveText('Enter a number for height.');await expect(height).toHaveValue('200');
 const x=panel.getByRole('textbox',{name:'X position',exact:true});
 await x.fill('-40');await x.press('Enter');
 const rotation=panel.getByRole('textbox',{name:'Rotation',exact:true});
 await rotation.fill('405');await rotation.press('Tab');await expect(rotation).toHaveValue('45');
 const data=await save(page,model);
 expect(saved(data,'shape')).toMatchObject({x:-40,y:200,width:320,height:200,rotation:45});
 await page.getByRole('button',{name:'Undo',exact:true}).click();await page.getByRole('button',{name:'Undo',exact:true}).click();
 await expect(page.getByLabel('Selection geometry')).toHaveText('320 × 200 px · x 220, y 200');
 await art(page,'line').click();
 await expect(panel.getByRole('textbox',{name:'Height',exact:true})).toBeDisabled();
 await expect(panel.getByRole('textbox',{name:'Width',exact:true})).toBeEnabled();
 await panel.getByRole('tab',{name:'Layers',exact:true}).click();
 await layers(page).getByRole('button',{name:'Select layer Locked shape',exact:true}).click();
 await layers(page).getByRole('tab',{name:'Arrange',exact:true}).click();
 await expect(panel.getByRole('status')).toHaveText('Unlock the selection to arrange it.');
 for(const name of ['Align left','To front','Forward'])await expect(panel.getByRole('button',{name,exact:true})).toBeDisabled();
 await expect(panel.getByRole('textbox',{name:'Width',exact:true})).toBeDisabled();
});

for(const theme of ['dark','light'])test(`${theme} Arrange sidebar fits both desktop widths`,async({page},info)=>{
 await setup(page,theme);
 for(const [width,height] of [[1242,668],[1440,900]]){
  await page.setViewportSize({width,height});
  if(!await arrange(page).count()){await openArrange(page);await art(page,'shape').click();}
  const region=arrange(page).getByRole('region',{name:'Arrange sidebar',exact:true});const panel=await region.boundingBox();
  expect(panel!.x+panel!.width).toBeLessThanOrEqual(width);
  for(const button of await region.locator('button,input').all()){const box=await button.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(panel!.x);expect(box!.x+box!.width).toBeLessThanOrEqual(panel!.x+panel!.width+0.5);}
  await page.screenshot({animations:'disabled',path:info.outputPath(`arrange-${theme}-${width}.png`)});
 }
});
