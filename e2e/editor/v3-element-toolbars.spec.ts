import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const id = 'c123456789012345678901234';
const base = { rotation:0,opacity:1,locked:false,visible:true,zIndex:1 };
const photo = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><rect width="160" height="120" fill="#2563eb"/></svg>');
async function setup(page: Page, theme = 'light', imagePatch:Record<string,unknown> = {}) {
  await page.addInitScript(theme => {
    localStorage.setItem('auth_token','element-test');
    localStorage.setItem('auth_user',JSON.stringify({id:'element-test',name:'Agent',email:'agent@example.test',plan:'SOLO'}));
    localStorage.setItem('theme',theme);
  },theme);
  const model = { writes:[] as any[], document:{id,name:'Element tools',type:'design',category:'real-estate',tags:[],canvasData:{canvasWidth:800,canvasHeight:600,backgroundColor:'#ffffff',elements:[
    {...base,id:'text',type:'text',name:'Headline',x:40,y:50,width:300,height:80,content:'Modern listing',fontFamily:'Arial',fontSize:24,fontWeight:400,bold:false,italic:false,underline:false,strikethrough:false,color:'#123e62',align:'left',lineHeight:1.2,textTransform:'none',listStyle:'none'},
    {...base,id:'shape',type:'shape',name:'Accent',x:60,y:260,width:150,height:100,shapeType:'rectangle',fill:'#00a080',stroke:'#123e62',strokeWidth:2,cornerRadius:0},
    {...base,id:'image',type:'image',name:'Photo',x:500,y:260,width:160,height:120,src:photo,objectFit:'contain',cornerRadius:0,flipHorizontal:false,flipVertical:false,colorOverlay:null,filters:{brightness:100,contrast:100,saturation:100},...imagePatch},
  ]}}};
  // Replace image uploads to R2 via POST /api/v1/media; the stub returns an https URL and serves the uploaded bytes
  // back from the stand-in bucket host and the export proxy, mirroring the real storage path.
  const media = new Map<string, Buffer>();
  // Chromium interception does not expose file-input bytes in multipart bodies, so the stub serves the fixture named
  // in Content-Disposition (the real browser does send the bytes; the real-backend journey verifies R2 storage).
  const pngFrom = (raw: Buffer) => readFileSync(`e2e/fixtures/${/filename="([^"]+)"/.exec(raw.toString('latin1'))![1]}`);
  await page.route('https://media.example.test/**', route => route.fulfill({ body: media.get(route.request().url()) ?? Buffer.alloc(0), contentType: 'image/png', headers: { 'Access-Control-Allow-Origin': '*' } }));
  await page.route('**/api/**',route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith('/media') && route.request().method() === 'POST') { const url = `https://media.example.test/upload-${media.size + 1}.png`; media.set(url, pngFrom(route.request().postDataBuffer()!)); return route.fulfill({ status: 201, json: { url, key: url, contentType: 'image/png', size: 1 } }); }
    if (pathname.endsWith('/proxy-image')) { const target = new URL(route.request().url()).searchParams.get('url')!; return route.fulfill({ body: media.get(target) ?? Buffer.alloc(0), contentType: 'image/png', headers: { 'Access-Control-Allow-Origin': '*' } }); }
    if (/\/designs(?:\/[^/]+)?$/.test(pathname)) {
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

for(const theme of ['light','dark']) test(`text reference controls match layout and persist in ${theme}`,async({page},info)=>{
  await page.setViewportSize({width:1242,height:668});
  const model=await setup(page,theme);await element(page,'text').click();
  const bar=toolbar(page,'text'),size=bar.getByLabel('Font size',{exact:true});
  const capsule=bar.locator('.v3-font-size');
  await expect(capsule).toHaveCSS('border-radius','10px');
  await expect(size).toHaveCSS('border-top-width','0px');
  await expect(capsule.locator('button').first()).toHaveCSS('border-top-width','0px');
  await size.fill('24.5');await size.press('Enter');
  await bar.getByRole('button',{name:'Text spacing',exact:true}).click();
  const popup=page.locator('.v3-text-spacing');
  await expect(popup.locator('h3')).toHaveCount(0);
  await expect(popup.getByText('Letter spacing',{exact:true})).toBeVisible();
  await expect(popup.getByRole('button',{name:'More settings',exact:true})).toHaveCount(0);
  const tracking=popup.getByLabel('Letter spacing value',{exact:true});
  await tracking.fill('100');
  await expect(element(page,'text').getByText('Modern listing')).toHaveCSS('letter-spacing','2.45px');
  await tracking.press('Enter');
  const spacing=popup.getByLabel('Line spacing value',{exact:true});await spacing.fill('1.4');await spacing.press('Enter');
  await popup.getByRole('button',{name:'Anchor middle',exact:true}).click();
  await expect(popup.getByRole('button',{name:'Anchor middle',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(element(page,'text').locator('div[style*="justify-content"]').first()).toHaveCSS('justify-content','safe center');
  await page.screenshot({path:info.outputPath(`text-ref-${theme}.png`)});
  await page.keyboard.press('Escape');
  const toggle=bar.getByRole('button',{name:'Text case',exact:true});
  for(const [icon,text] of [['AA','MODERN LISTING'],['aa','modern listing'],['Aa','Modern Listing']]){
    await toggle.click();await expect(toggle).toHaveText(icon);
    await expect(element(page,'text').getByText(text,{exact:true})).toBeVisible();
    await expect(page.locator('[data-radix-popper-content-wrapper]')).toHaveCount(0);
  }
  await page.keyboard.press('Escape');
  expect((await save(page,model)).find(el=>el.id==='text')).toMatchObject({content:'Modern listing',fontSize:24.5,letterSpacing:100,lineHeight:1.4,textAnchor:'middle',textTransform:'capitalize'});
  await page.reload({waitUntil:'domcontentloaded'});await expect(element(page,'text').getByText('Modern Listing',{exact:true})).toBeVisible();
});

// Contract: each visual style draft is visible before confirmation and creates no Undo entry; Escape restores, Enter commits once.
for(const kind of ['text','image','shape']) test(`${kind} previews style live and cancels without creating history`,async({page})=>{
  const model=await setup(page);await element(page,kind).click();
  const artwork=kind==='shape'?element(page,kind).locator('div[style*="opacity"]').first():element(page,kind);
  await toolbar(page,kind).getByRole('button',{name:'Opacity',exact:true}).click();
  const input=page.getByLabel('Opacity value',{exact:true});await input.fill('42');
  await expect(artwork).toHaveCSS('opacity','0.42');
  await expect(page.getByRole('button',{name:'Undo',exact:true})).toBeDisabled();expect(model.writes).toHaveLength(0);
  await input.press('Escape');await expect(artwork).toHaveCSS('opacity','1');
  await input.fill('63');await input.press('Enter');await page.keyboard.press('Escape');
  await expect(artwork).toHaveCSS('opacity','0.63');
  await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(artwork).toHaveCSS('opacity','1');
  await expect(page.getByRole('button',{name:'Undo',exact:true})).toBeDisabled();
});

// Contract: border and corner numeric drafts redraw both image and shape immediately, while Escape leaves committed artwork/history unchanged.
test('fractional image opacity cancels and blurs without rounding the saved value',async({page})=>{
  const model=await setup(page,'light',{opacity:0.555});await element(page,'image').click();
  await toolbar(page,'image').getByRole('button',{name:'Opacity',exact:true}).click();
  const input=page.getByLabel('Opacity value',{exact:true});await input.focus();await input.press('Tab');
  await expect(element(page,'image')).toHaveCSS('opacity','0.555');
  await input.fill('42');await expect(element(page,'image')).toHaveCSS('opacity','0.42');await input.press('Escape');
  await expect(element(page,'image')).toHaveCSS('opacity','0.555');
  await expect(page.getByRole('button',{name:'Undo',exact:true})).toBeDisabled();expect(model.writes).toHaveLength(0);
});

for(const kind of ['image','shape']) test(`${kind} previews border weight and corner rounding before commit`,async({page})=>{
  await setup(page);await element(page,kind).click();const bar=toolbar(page,kind);
  await bar.getByRole('button',{name:'Border',exact:true}).click();const border=page.getByLabel('Border width value',{exact:true});await border.fill('8');
  const stroke=kind==='image'?element(page,kind).locator('svg[data-artwork-svg] rect'):element(page,kind).locator('svg[data-artwork-svg] g');
  await expect(stroke).toHaveAttribute('stroke-width','8');await expect(page.getByRole('button',{name:'Undo',exact:true})).toBeDisabled();
  await border.press('Escape');await page.keyboard.press('Escape');
  await bar.getByRole('button',{name:'Corners',exact:true}).click();const radius=page.getByLabel('Corner radius value',{exact:true});await radius.fill('30');
  if(kind==='image')await expect(element(page,kind).locator('div[style*="border-radius"]').first()).toHaveCSS('border-radius','30px');
  else await expect(element(page,kind).locator('svg path')).toHaveAttribute('d',/^M 30 0/);
  await radius.press('Escape');await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Undo',exact:true})).toBeDisabled();
});

// Contract: AI-imported images selected through existing Layers honor explicit Fit without losing source metadata.
test('AI image Fit is effective through the same direct toolbar',async({page})=>{
  const model=await setup(page,'light',{isAiImport:true,x:0,y:0,width:800,height:600});
  await page.getByRole('button',{name:'Layers',exact:true}).click();await page.getByText('Photo',{exact:true}).click();
  await page.getByRole('button',{name:'Layers',exact:true}).click();
  const bar=toolbar(page,'image');await expect(bar).toBeVisible();await bar.getByRole('button',{name:'Image fit',exact:true}).click();
  await page.getByRole('button',{name:'Fit fill',exact:true}).click();await page.keyboard.press('Escape');
  await expect(element(page,'image').locator('div[style*="background-image"]')).toHaveCSS('background-size','100% 100%');
  expect((await save(page,model)).find(el=>el.id==='image')).toMatchObject({objectFit:'fill',isAiImport:true,src:photo});
});

// Contract: font search retains the established font choices; font size drafts affect canvas before confirmation and cancel cleanly.
test('font picker search and live size preserve one completed history step',async({page})=>{
  await setup(page);await element(page,'text').click();const bar=toolbar(page,'text');
  await bar.getByRole('button',{name:'Font family',exact:true}).click();await page.getByRole('searchbox',{name:'Search fonts',exact:true}).fill('Georgia');
  await page.getByRole('button',{name:'Font Georgia',exact:true}).click();await page.keyboard.press('Escape');
  await expect(element(page,'text').getByText('Modern listing')).toHaveCSS('font-family','Georgia');
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  const input=page.getByLabel('Font size',{exact:true});await input.fill('40');
  await expect(element(page,'text').getByText('Modern listing')).toHaveCSS('font-size','40px');
  await expect(page.getByRole('button',{name:'Undo',exact:true})).toBeDisabled();await input.press('Escape');
  await expect(element(page,'text').getByText('Modern listing')).toHaveCSS('font-size','24px');
});

// Contract: a selected image changes fit through primary controls; Reset restores appearance while keeping geometry/source/fit.
test('direct image Fit and Reset work and survive save and reload',async({page})=>{
  const model=await setup(page,'dark',{width:240});await element(page,'image').click();
  const bar=toolbar(page,'image');await bar.getByRole('button',{name:'Image fit',exact:true}).click();
  await page.getByRole('button',{name:'Fit fill',exact:true}).click();await page.keyboard.press('Escape');
  await expect(element(page,'image').getByRole('img')).toHaveCSS('object-fit','fill');
  await bar.getByRole('button',{name:'Flip horizontal',exact:true}).click();
  await bar.getByRole('button',{name:'Corners',exact:true}).click();await page.getByLabel('Corner radius value',{exact:true}).fill('30');
  await page.getByLabel('Corner radius value',{exact:true}).press('Enter');await page.keyboard.press('Escape');
  await bar.getByRole('button',{name:'Reset image',exact:true}).click();
  expect((await save(page,model)).find(el=>el.id==='image')).toMatchObject({objectFit:'fill',flipHorizontal:false,cornerRadius:0,src:photo,width:240,height:120});
  await page.reload({waitUntil:'domcontentloaded'});await expect(element(page,'image').getByRole('img')).toHaveCSS('object-fit','fill');
});

// Contract: line stroke weight previews during pointer input; caps, independent endings and type commit through visual pickers.
test('line stroke preview, rounded ends and visual pickers preserve one gesture history',async({page},info)=>{
  const model=await setup(page);await page.getByRole('button',{name:'Tools',exact:true}).click();await page.getByRole('button',{name:'Line',exact:true}).click();
  await page.getByRole('button',{name:'Straight line',exact:true}).click();
  const canvas=(await page.getByTestId('design-canvas').boundingBox())!;
  await page.mouse.move(canvas.x+canvas.width*.35,canvas.y+canvas.height*.76);await page.mouse.down();await page.mouse.move(canvas.x+canvas.width*.65,canvas.y+canvas.height*.76);await page.mouse.up();
  const line=page.getByTestId('design-canvas').locator('[data-element-type="line"]'),art=line.locator('g').first().locator('path').first();
  const bar=toolbar(page,'line');await bar.getByRole('button',{name:'Stroke',exact:true}).click();
  const range=page.getByRole('slider',{name:'Line width',exact:true}),box=(await range.boundingBox())!;
  await page.mouse.move(box.x+box.width*.65,box.y+box.height/2);await page.mouse.down();
  const draft=Number(await page.getByLabel('Line width value',{exact:true}).inputValue());
  expect(draft).toBeGreaterThan(2);await expect(art).toHaveCSS('stroke-width',`${draft}px`);
  await page.screenshot({path:info.outputPath('details-line-live-stroke.png')});await page.mouse.up();
  await page.getByRole('switch',{name:'Rounded end points',exact:true}).click();await expect(art).toHaveCSS('stroke-linecap','round');
  await page.keyboard.press('Escape');await bar.getByRole('button',{name:'Line start',exact:true}).click();
  await page.getByRole('button',{name:'Start decoration circle',exact:true}).click();await page.keyboard.press('Escape');
  await bar.getByRole('button',{name:'Line end',exact:true}).click();await page.getByRole('button',{name:'End decoration arrow',exact:true}).click();await page.keyboard.press('Escape');
  await bar.getByRole('button',{name:'Line type',exact:true}).click();await page.getByRole('button',{name:'Type curved',exact:true}).click();await page.keyboard.press('Escape');
  expect((await save(page,model)).find(el=>el.type==='line')).toMatchObject({strokeWidth:draft,lineCap:'round',lineType:'curved',startDecoration:'circle',endDecoration:'arrow'});
});

// Contract: typed line spacing previews before confirmation, Escape cancels and a completed spacing edit undoes once.
test('text spacing and compact overflow retain keyboard behavior',async({page},info)=>{
  await page.setViewportSize({width:1242,height:668});await setup(page,'dark');await element(page,'text').click();
  const bar=toolbar(page,'text');await bar.getByRole('button',{name:'Text spacing',exact:true}).click();
  const input=page.getByLabel('Line spacing value',{exact:true});await input.fill('2');
  await expect(element(page,'text').getByText('Modern listing')).toHaveCSS('line-height','48px');
  await input.press('Escape');await expect(element(page,'text').getByText('Modern listing')).toHaveCSS('line-height','28.8px');
  await input.fill('1.5');await input.press('Enter');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.getByRole('button',{name:'Undo',exact:true})).toBeDisabled();
  await expect(bar.getByRole('button',{name:'Underline',exact:true})).toBeVisible();
  await page.screenshot({path:info.outputPath('details-text-overflow-dark.png')});
});
async function save(page:Page,model:Awaited<ReturnType<typeof setup>>) {
  const before=model.writes.length;
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect.poll(()=>model.writes.length).toBeGreaterThan(before);
  return model.writes.at(-1).canvasData.elements as any[];
}

// Contract: restored text controls commit exact properties into the saved document.
test('direct text formatting survives save and reload',async({page})=>{
  const model=await setup(page);await element(page,'text').click();
  await toolbar(page,'text').getByRole('button',{name:'Bold',exact:true}).click();
  await toolbar(page,'text').getByRole('button',{name:'Strikethrough',exact:true}).click();
  await toolbar(page,'text').getByRole('button',{name:'Text case',exact:true}).click();
  await expect(toolbar(page,'text').getByRole('button',{name:'Text case',exact:true})).toHaveText('AA');
  await page.keyboard.press('Escape');
  await toolbar(page,'text').getByRole('button',{name:'List style',exact:true}).click();
  await page.getByRole('button',{name:'Bullet list',exact:true}).click();await page.keyboard.press('Escape');
  const elements=await save(page,model);
  expect(elements.find(el=>el.id==='text')).toMatchObject({bold:true,fontWeight:700,strikethrough:true,textTransform:'uppercase',listStyle:'bullet'});
  await page.reload({waitUntil:'domcontentloaded'});await element(page,'text').click();
  await expect(toolbar(page,'text').getByRole('button',{name:'Bold',exact:true})).toHaveAttribute('aria-pressed','true');
});

// Contract: styled shape has SVG/native-export styling recorded in the document.
test('shape supports dashed border, shadow and transparent fill',async({page})=>{
  const model=await setup(page);await element(page,'shape').click();
  await toolbar(page,'shape').getByRole('button',{name:'Border',exact:true}).click();
  await page.getByRole('button',{name:'Border dashed',exact:true}).click();
  await page.getByLabel('Border width value',{exact:true}).fill('6');await page.getByLabel('Border width value',{exact:true}).press('Enter');
  await page.keyboard.press('Escape');
  await toolbar(page,'shape').getByRole('button',{name:'Effects',exact:true}).click();
  await page.getByRole('button',{name:'Effect Drop',exact:true}).click();await page.keyboard.press('Escape');
  await toolbar(page,'shape').getByRole('button',{name:'Fill',exact:true}).click();await page.getByRole('button',{name:'No color',exact:true}).click();await page.keyboard.press('Escape');
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
  await page.getByLabel('Replace image file',{exact:true}).setInputFiles('e2e/fixtures/replacement-red.png');
  // Stored image is the R2 URL returned by /media — never an inline data URL.
  await expect(element(page,'image').locator('img')).toHaveAttribute('src',/media\.example\.test%2Fupload-1\.png|^https:\/\/media\.example\.test\/upload-1\.png$/);
  await toolbar(page,'image').getByRole('button',{name:'Flip horizontal',exact:true}).click();
  expect((await save(page,model)).find(el=>el.id==='image')).toMatchObject({id:'image',x:500,y:260,width:160,height:120,objectFit:'contain',flipHorizontal:true,name:'replacement-red.png',src:'https://media.example.test/upload-1.png'});
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
  // Contract: reselecting a saved line through its stroke keeps selection/toolbar after release, including repeated clicks.
  const line=page.getByTestId('design-canvas').locator('[data-element-type="line"]');
  const stroke=line.getByRole('button',{name:`${type} line`,exact:true});
  const midpoint=await stroke.evaluate(node=>{const path=node as SVGPathElement;const point=path.getPointAtLength(path.getTotalLength()/2);const screen=new DOMPoint(point.x,point.y).matrixTransform(path.getScreenCTM()!);return {x:screen.x,y:screen.y};});
  await page.mouse.click(midpoint.x,midpoint.y);await expect(toolbar(page,'line')).toBeVisible();
  await page.mouse.click(midpoint.x,midpoint.y);await expect(toolbar(page,'line')).toBeVisible();
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export',exact:true}).click();expect((await download).suggestedFilename()).toMatch(/\.png$/);
  await page.goto(`/editor?editor=legacy&designId=${id}`,{waitUntil:'domcontentloaded'});
  await expect(page.getByTestId('design-canvas').locator('[data-element-type="line"]')).toHaveCount(1);
});

// Contract: before mouse release, geometry reports the current design-space drag while the saved document stays at its original bounds.
for(const kind of ['text','image','shape']) test(`${kind} shows live design coordinates during drag with one final undo`,async({page})=>{
  await setup(page);await element(page,kind).click();
  const selected=element(page,kind), bounds=(await selected.boundingBox())!;
  const canvas=(await page.getByTestId('design-canvas').boundingBox())!;
  const zoom=canvas.width/800;
  const original={text:{x:40,y:50,width:300,height:80},image:{x:500,y:260,width:160,height:120},shape:{x:60,y:260,width:150,height:100}}[kind]!;
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.down();
  await page.mouse.move(bounds.x+bounds.width/2+40*zoom,bounds.y+bounds.height/2+30*zoom,{steps:8});
  await expect(page.getByLabel('Selection geometry')).toHaveText(`${original.width} × ${original.height} px · x ${original.x+40}, y ${original.y+30}`);
  await page.mouse.up();await page.getByRole('button',{name:'Undo',exact:true}).click();
  await expect(page.getByLabel('Selection geometry')).toHaveText(`${original.width} × ${original.height} px · x ${original.x}, y ${original.y}`);
  // Contract: bottom-right resizing updates width/height before release and Undo restores the entire original size in one step.
  const handle=(await selected.locator('[style*="cursor: se-resize"]').boundingBox())!;
  const start={x:handle.x+handle.width/2,y:handle.y+handle.height/2};
  await page.mouse.move(start.x,start.y);await page.mouse.down();
  await page.mouse.move(start.x+40*zoom,start.y+30*zoom,{steps:8});
  await expect(page.getByLabel('Selection geometry')).toHaveText(`${original.width+40} × ${original.height+30} px · x ${original.x}, y ${original.y}`);
  await page.mouse.up();await page.getByRole('button',{name:'Undo',exact:true}).click();
  await expect(page.getByLabel('Selection geometry')).toHaveText(`${original.width} × ${original.height} px · x ${original.x}, y ${original.y}`);
});

for(const theme of ['light','dark']) test(`${theme} focused image menus fit a 1242 by 668 viewport`,async({page},info)=>{
  await page.setViewportSize({width:1242,height:668});const model=await setup(page,theme);await element(page,'image').click();
  const imageToolbar=toolbar(page,'image');
  await imageToolbar.getByRole('button',{name:'Corners',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Corner rounding',exact:true})).toBeVisible();
  await page.getByLabel('Corner radius value',{exact:true}).fill('24');await page.getByLabel('Corner radius value',{exact:true}).press('Enter');
  const corners=page.locator('.v3-element-popover');const cornerBox=(await corners.boundingBox())!;
  expect(cornerBox.y).toBeGreaterThanOrEqual(0);expect(cornerBox.y+cornerBox.height).toBeLessThanOrEqual(668);
  await page.screenshot({path:info.outputPath(`nov4-${theme}-corners.png`)});await page.keyboard.press('Escape');
  await imageToolbar.getByRole('button',{name:'Border',exact:true}).click();
  await page.getByRole('button',{name:'Border dashed',exact:true}).click();
  await page.getByLabel('Border width value',{exact:true}).fill('6');await page.getByLabel('Border width value',{exact:true}).press('Enter');
  const borderBox=(await page.locator('.v3-element-popover').boundingBox())!;
  expect(borderBox.y).toBeGreaterThanOrEqual(0);expect(borderBox.y+borderBox.height).toBeLessThanOrEqual(668);
  await page.screenshot({path:info.outputPath(`nov4-${theme}-border.png`)});await page.keyboard.press('Escape');
  await imageToolbar.getByRole('button',{name:'Flip horizontal',exact:true}).click();
  await expect(imageToolbar.getByRole('button',{name:'Flip horizontal',exact:true})).toHaveAttribute('aria-pressed','true');
  await imageToolbar.getByRole('button',{name:'Image fit',exact:true}).click();
  await expect(page.getByRole('button',{name:'Fit contain',exact:true})).toBeVisible();await page.keyboard.press('Escape');
  expect((await save(page,model)).find(el=>el.id==='image')).toMatchObject({cornerRadius:24,borderStyle:'dashed',borderWidth:6,flipHorizontal:true});
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
  await page.getByLabel('Replace image file',{exact:true}).setInputFiles('e2e/fixtures/two-colours.png');
  await expect(element(page,'image').locator('img')).toHaveAttribute('src',/media\.example\.test%2Fupload-1\.png|^https:\/\/media\.example\.test\/upload-1\.png$/);
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
  await expect(toolbar(page,'text').getByRole('button',{name:'Strikethrough',exact:true})).toBeVisible();await more.click();await expect(page.getByRole('menu',{name:'Element actions'}).getByRole('menuitem',{name:'Copy',exact:true})).toBeVisible();await page.keyboard.press('Escape');
  const opacity=toolbar(page,'text').getByRole('button',{name:'Opacity',exact:true});
  await expect(opacity).toHaveText('');await opacity.click();
  await expect(page.getByRole('heading',{name:'Transparency',exact:true})).toBeVisible();
  await page.screenshot({path:test.info().outputPath('text-transparency.png'),fullPage:true});
  const value=page.getByLabel('Opacity value',{exact:true});await value.fill('37');await value.press('Enter');await page.keyboard.press('Escape');
  await expect(page.getByRole('heading',{name:'Transparency',exact:true})).toHaveCount(0);
  expect((await save(page,model)).find(el=>el.id==='text').opacity).toBe(.37);
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  expect((await save(page,model)).find(el=>el.id==='text').opacity).toBe(1);
  await element(page,'image').click();await expect(toolbar(page,'image').getByRole('button',{name:'Image fit',exact:true})).toHaveText('');
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
