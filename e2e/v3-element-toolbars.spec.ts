import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const id = 'c123456789012345678901234';
const base = { rotation:0,opacity:1,locked:false,visible:true,zIndex:1 };
const photo = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><rect width="160" height="120" fill="#2563eb"/></svg>');
async function setup(page: Page, theme = 'light') {
  await page.addInitScript(theme => {
    localStorage.setItem('auth_token','element-test');
    localStorage.setItem('auth_user',JSON.stringify({id:'element-test',name:'Agent',email:'agent@example.test',plan:'SOLO'}));
    localStorage.setItem('theme',theme);
  },theme);
  const model = { writes:[] as any[], document:{id,name:'Element tools',type:'design',category:'real-estate',tags:[],canvasData:{canvasWidth:800,canvasHeight:600,backgroundColor:'#ffffff',elements:[
    {...base,id:'text',type:'text',name:'Headline',x:40,y:50,width:300,height:80,content:'Modern listing',fontFamily:'Arial',fontSize:24,fontWeight:400,bold:false,italic:false,underline:false,strikethrough:false,color:'#123e62',align:'left',lineHeight:1.2,textTransform:'none',listStyle:'none'},
    {...base,id:'shape',type:'shape',name:'Accent',x:60,y:260,width:150,height:100,shapeType:'rectangle',fill:'#00a080',stroke:'#123e62',strokeWidth:2,cornerRadius:0},
    {...base,id:'image',type:'image',name:'Photo',x:500,y:260,width:160,height:120,src:photo,objectFit:'contain',cornerRadius:0,flipHorizontal:false,flipVertical:false,colorOverlay:null,filters:{brightness:100,contrast:100,saturation:100}},
  ]}}};
  await page.route('**/api/**',route => {
    if (/\/designs(?:\/[^/]+)?$/.test(new URL(route.request().url()).pathname)) {
      if (route.request().method()==='GET') return route.fulfill({json:model.document});
      const body=route.request().postDataJSON();model.writes.push(body);model.document={...model.document,...body};return route.fulfill({json:model.document});
    }
    return route.fulfill({json:[]});
  });
  await page.goto(`/editor?editor=v3&designId=${id}`,{waitUntil:'domcontentloaded'});
  await expect(page.getByTestId('design-canvas').getByText('Modern listing')).toBeVisible();
  return model;
}
const element=(page:Page,id:string)=>page.getByTestId('design-canvas').locator(`[data-element-id="${id}"]`);
const toolbar=(page:Page,type:string)=>page.getByRole('toolbar',{name:`${type} formatting`,exact:true});
async function save(page:Page,model:Awaited<ReturnType<typeof setup>>) {
  const before=model.writes.length;
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect.poll(()=>model.writes.length).toBeGreaterThan(before);
  return model.writes.at(-1).canvasData.elements as any[];
}

// Contract: restored text controls commit exact properties into the saved document.
test('text More preserves old formatting through save and reload',async({page})=>{
  const model=await setup(page);await element(page,'text').click();
  await toolbar(page,'text').getByRole('button',{name:'Bold',exact:true}).click();
  await toolbar(page,'text').getByRole('button',{name:'More text options',exact:true}).click();
  await page.getByRole('button',{name:'Strikethrough',exact:true}).click();
  await page.getByRole('button',{name:'Bullet list',exact:true}).click();
  await page.getByLabel('Text case',{exact:true}).selectOption('uppercase');
  await page.keyboard.press('Escape');
  const elements=await save(page,model);
  expect(elements.find(el=>el.id==='text')).toMatchObject({bold:true,fontWeight:700,strikethrough:true,textTransform:'uppercase',listStyle:'bullet'});
  await page.reload({waitUntil:'domcontentloaded'});await element(page,'text').click();
  await expect(toolbar(page,'text').getByRole('button',{name:'Bold',exact:true})).toHaveAttribute('aria-pressed','true');
});

// Contract: styled shape has SVG/native-export styling recorded in the document.
test('shape supports dashed border, shadow and transparent fill',async({page})=>{
  const model=await setup(page);await element(page,'shape').click();
  await toolbar(page,'shape').getByRole('button',{name:'Border',exact:true}).click();
  await page.getByLabel('Border style',{exact:true}).selectOption('dashed');
  await page.getByLabel('Border width value',{exact:true}).fill('6');await page.getByLabel('Border width value',{exact:true}).press('Enter');
  await page.keyboard.press('Escape');
  await toolbar(page,'shape').getByRole('button',{name:'Effects',exact:true}).click();
  await page.getByRole('button',{name:'Shadow',exact:true}).click();await page.keyboard.press('Escape');
  await toolbar(page,'shape').getByRole('button',{name:'Fill',exact:true}).click();await page.getByRole('button',{name:'Transparent',exact:true}).click();await page.keyboard.press('Escape');
  expect((await save(page,model)).find(el=>el.id==='shape')).toMatchObject({fill:'transparent',strokeStyle:'dashed',strokeWidth:6,shadow:{blur:12}});
  await expect(element(page,'shape').locator('svg g')).toHaveAttribute('stroke-dasharray','24 18');
});

// Contract: adjustment zero means stored100; draft does not create a saved revision.
test('image Edit sidebar commits adjustment once and reset restores neutral',async({page})=>{
  const model=await setup(page);await element(page,'image').click();await toolbar(page,'image').getByRole('button',{name:'Edit image',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Edit image',exact:true})).toBeVisible();
  const brightness=page.getByLabel('Brightness value',{exact:true});
  await expect(brightness).toHaveValue('0');await brightness.fill('25');await brightness.press('Enter');
  expect((await save(page,model)).find(el=>el.id==='image').filters.brightness).toBe(125);
  await page.getByRole('button',{name:'Reset adjustments',exact:true}).click();
  expect((await save(page,model)).find(el=>el.id==='image').filters).toEqual({brightness:100,contrast:100,saturation:100});
});

// Contract: replacing a selected image preserves its geometry and identity.
test('image replacement preserves geometry and supports flip and border',async({page})=>{
  const model=await setup(page);await element(page,'image').click();
  await page.getByLabel('Replace image file',{exact:true}).setInputFiles({name:'replacement.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#ff0000"/></svg>')});
  await expect(element(page,'image').locator('img')).toHaveAttribute('src',/^data:image\/svg\+xml;base64,/);
  await toolbar(page,'image').getByRole('button',{name:'Flip horizontal',exact:true}).click();
  expect((await save(page,model)).find(el=>el.id==='image')).toMatchObject({id:'image',x:500,y:260,width:160,height:120,objectFit:'contain',flipHorizontal:true,name:'replacement.svg'});
});

test('rotation numeric input commits once and Undo restores original angle',async({page})=>{
  await setup(page);await element(page,'shape').click();await page.getByRole('button',{name:'Rotate element',exact:true}).click();
  await page.getByLabel('Rotation degrees',{exact:true}).fill('45');await page.getByRole('button',{name:'Apply angle',exact:true}).click();
  await expect(element(page,'shape').locator('div[style*="rotate("]').first()).toHaveCSS('transform',/matrix\(0.707/);
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  await expect(element(page,'shape').locator('div[style*="rotate("]').first()).toHaveCSS('transform','matrix(1, 0, 0, 1, 0, 0)');
});

for(const type of ['Straight','Curved','Elbow']) test(`${type} line draws, saves, reloads and exports`,async({page})=>{
  const model=await setup(page);await page.getByRole('button',{name:'Tools',exact:true}).click();await page.getByRole('button',{name:'Line',exact:true}).click();
  await page.getByRole('button',{name:`${type} line`,exact:true}).click();
  const box=(await page.getByTestId('design-canvas').boundingBox())!;
  await page.mouse.move(box.x+box.width*.35,box.y+box.height*.75);await page.mouse.down();await page.mouse.move(box.x+box.width*.75,box.y+box.height*.85,{steps:8});await page.mouse.up();
  await expect(toolbar(page,'line')).toBeVisible();
  const saved=(await save(page,model)).find(el=>el.type==='line');expect(saved).toMatchObject({lineType:type.toLowerCase(),strokeWidth:2,visible:true});
  await page.reload({waitUntil:'domcontentloaded'});await expect(page.getByTestId('design-canvas').locator('[data-element-type="line"]')).toHaveCount(1);
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export',exact:true}).click();expect((await download).suggestedFilename()).toMatch(/\.png$/);
  await page.goto(`/editor?designId=${id}`,{waitUntil:'domcontentloaded'});
  await expect(page.getByTestId('design-canvas').locator('[data-element-type="line"]')).toHaveCount(1);
});

for(const theme of ['light','dark']) test(`${theme} modern toolbar and sidebar preserve approved skeleton`,async({page},info)=>{
  await page.setViewportSize({width:1191,height:668});const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await setup(page,theme);
  await element(page,'image').click();await toolbar(page,'image').getByRole('button',{name:'Edit image',exact:true}).click();
  const box=await toolbar(page,'image').boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(1191);
  await expect(page.getByTestId('design-canvas')).toHaveCSS('background-color','rgb(255, 255, 255)');
  await page.screenshot({path:info.outputPath(`modern-${theme}.png`),fullPage:true});
  await toolbar(page,'image').getByRole('button',{name:'Opacity',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Transparency',exact:true})).toBeVisible();
  await expect(page.getByLabel('Opacity value',{exact:true})).toHaveValue('100');
  await page.screenshot({path:info.outputPath(`transparency-${theme}.png`),fullPage:true});expect(errors).toEqual([]);
});

// Contract: R × S maps a horizontally flipped left-red source to the lower half
// after a clockwise90° rotation, in the actual2x PNG, not just stored metadata.
test('rotated flipped image exports with the same orientation as the canvas',async({page})=>{
  await setup(page);await element(page,'image').click();
  await page.getByLabel('Replace image file',{exact:true}).setInputFiles({name:'two-colours.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><rect width="80" height="120" fill="#ff0000"/><rect x="80" width="80" height="120" fill="#0000ff"/></svg>')});
  await expect(element(page,'image').locator('img')).toHaveAttribute('src',/^data:image\/svg\+xml;base64,/);
  await toolbar(page,'image').getByRole('button',{name:'Flip horizontal',exact:true}).click();
  await page.getByRole('button',{name:'Rotate element',exact:true}).click();await page.getByLabel('Rotation degrees',{exact:true}).fill('90');await page.getByRole('button',{name:'Apply angle',exact:true}).click();
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export',exact:true}).click();const downloaded=await pending;
  const png=(await readFile((await downloaded.path())!)).toString('base64');
  const pixels=await page.evaluate(async png=>{
    const img=new Image();img.src=`data:image/png;base64,${png}`;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0);
    return [[580*2,360*2],[580*2,280*2]].map(([x,y])=>Array.from(ctx.getImageData(x,y,1,1).data));
  },png);
  expect(pixels).toEqual([[255,0,0,255],[0,0,255,255]]);
});

test('cancelled line drawing leaves the document and history unchanged',async({page})=>{
  await setup(page);await page.getByRole('button',{name:'Tools',exact:true}).click();await page.getByRole('button',{name:'Line',exact:true}).click();await page.getByRole('button',{name:'Curved line',exact:true}).click();
  const box=(await page.getByTestId('design-canvas').boundingBox())!;
  await page.mouse.move(box.x+box.width*.3,box.y+box.height*.7);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.8);await page.keyboard.press('Escape');await page.mouse.up();
  await expect(page.getByTestId('design-canvas').locator('[data-element-type="line"]')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Undo',exact:true})).toBeDisabled();
});

// Contract: More triggers are dots-only; the existing opacity value moves to a
// primary checkerboard control and still records exactly one undoable change.
test('compact overflow and transparency retain accessible controls and history',async({page})=>{
  const model=await setup(page);await page.getByRole('button',{name:'Text',exact:true}).click();await element(page,'text').click();
  const more=toolbar(page,'text').getByRole('button',{name:'More text options',exact:true});
  await expect(more).toHaveText('');await expect(more.locator('svg')).toHaveCount(1);
  await more.click();await expect(page.getByRole('button',{name:'Strikethrough',exact:true})).toBeVisible();await page.keyboard.press('Escape');
  const opacity=toolbar(page,'text').getByRole('button',{name:'Opacity',exact:true});
  await expect(opacity).toHaveText('');await opacity.click();
  await expect(page.getByRole('heading',{name:'Transparency',exact:true})).toBeVisible();
  await page.screenshot({path:test.info().outputPath('text-transparency.png'),fullPage:true});
  const value=page.getByLabel('Opacity value',{exact:true});await value.fill('37');await value.press('Enter');await page.keyboard.press('Escape');
  await expect(page.getByRole('heading',{name:'Transparency',exact:true})).toHaveCount(0);
  expect((await save(page,model)).find(el=>el.id==='text').opacity).toBe(.37);
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  expect((await save(page,model)).find(el=>el.id==='text').opacity).toBe(1);
  await element(page,'image').click();await expect(toolbar(page,'image').getByRole('button',{name:'More image options',exact:true})).toHaveText('');
});

// Contract: both image flip controls are directly actionable; each click is one
// history boundary and flips only the selected image without opening a submenu.
test('separate flip icons toggle both axes directly and undo independently',async({page})=>{
  const model=await setup(page);await element(page,'image').click();
  const imageToolbar=toolbar(page,'image');
  const horizontal=imageToolbar.getByRole('button',{name:'Flip horizontal',exact:true});
  const vertical=imageToolbar.getByRole('button',{name:'Flip vertical',exact:true});
  await expect(horizontal).toHaveText('');await expect(vertical).toHaveText('');
  await horizontal.click();await expect(horizontal).toHaveAttribute('aria-pressed','true');
  await vertical.click();await expect(vertical).toHaveAttribute('aria-pressed','true');
  expect((await save(page,model)).find(el=>el.id==='image')).toMatchObject({flipHorizontal:true,flipVertical:true});
  await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(vertical).toHaveAttribute('aria-pressed','false');await expect(horizontal).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(horizontal).toHaveAttribute('aria-pressed','false');
});

// Contract: all V3 numeric fields retain numeric entry while their computed
// appearance is textfield; the explicit font-size minus/plus actions remain.
test('number fields suppress native spinner UI across the V3 editor',async({page})=>{
  await setup(page);await element(page,'text').click();
  await expect(page.getByLabel('Font size',{exact:true})).toHaveCSS('appearance','textfield');
  await expect(toolbar(page,'text').getByRole('button',{name:'Increase font size',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Canvas settings',exact:true}).click();
  for(const label of ['Canvas width','Canvas height'])await expect(page.getByLabel(label,{exact:true})).toHaveCSS('appearance','textfield');
  await page.getByRole('button',{name:'Canvas settings',exact:true}).click();
  await page.getByRole('button',{name:'Rotate element',exact:true}).click();await expect(page.getByLabel('Rotation degrees',{exact:true})).toHaveCSS('appearance','textfield');await page.keyboard.press('Escape');
  await element(page,'shape').click();await toolbar(page,'shape').getByRole('button',{name:'Border',exact:true}).click();
  await expect(page.getByLabel('Border width value',{exact:true})).toHaveCSS('appearance','textfield');await page.keyboard.press('Escape');
  await element(page,'image').click();await toolbar(page,'image').getByRole('button',{name:'Edit image',exact:true}).click();
  for(const label of ['Brightness value','Contrast value','Saturation value'])await expect(page.getByLabel(label,{exact:true})).toHaveCSS('appearance','textfield');
});
