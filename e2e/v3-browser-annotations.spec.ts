import { test, expect, type Page } from '@playwright/test';

const id='c'+'1'.repeat(24);
const record={property:{name:'Oak listing',headline:'Your next home',address:'10 Oak Road',description:'A bright home',type:'residential',country:'US',currency:'USD',amount:'400000',transaction:'sale',rentalPeriod:'month',beds:'3',baths:'2',area:'1400',areaUnit:'sq ft',status:'Active',features:[]},agent:{name:'Alex Agent',phone:'+1 212 555 0100',email:'alex@example.test',agency:'Oak Realty',license:'',photo:''},brand:{name:'Oak Realty',logo:'',tagline:'Find your home',accent:''},photos:[]};
const text=(key:string,content:string,slot:string,y:number)=>({id:key,type:'text',name:key,content,slot,x:60,y,width:500,height:60,rotation:0,opacity:1,locked:false,visible:true,zIndex:y,fontFamily:'Arial',fontSize:24,fontWeight:400,bold:false,italic:false,underline:false,strikethrough:false,color:'#111111',align:'left',lineHeight:1.2,textTransform:'none',listStyle:'none'});
async function setup(page:Page,theme='light'){
  await page.addInitScript(theme=>{localStorage.setItem('auth_token','listing-fixture');localStorage.setItem('auth_user',JSON.stringify({id:'listing-user',name:'Alex',email:'alex@example.test',plan:'SOLO'}));localStorage.setItem('theme',theme);},theme);
  const elements=[text('headline',record.property.headline,'property.headline',45),text('address',record.property.address,'property.location',125),text('price','US$400,000','property.price',205),text('price-copy','US$400,000','property.price',285)];
  (elements as any[]).push({id:'photo',name:'Property photo',type:'image',x:400,y:360,width:260,height:180,rotation:0,opacity:1,locked:false,visible:true,zIndex:500,src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="260" height="180"><rect width="260" height="180" fill="#2563eb"/></svg>'),objectFit:'cover',cornerRadius:0,flipHorizontal:false,flipVertical:false,colorOverlay:null,filters:{brightness:100,contrast:100,saturation:100}});
  const bindings=Object.fromEntries(elements.filter(e=>e.slot).map(e=>[e.id,{slot:e.slot}]));
  const doc={id,name:'Oak design',type:'design',thumbnail:'',tags:[],canvasData:{elements,canvasWidth:800,canvasHeight:600,backgroundColor:'#ffffff',v3Listing:{version:1,pending:structuredClone(record),applied:structuredClone(record),bindings,appliedBindings:structuredClone(bindings),overrides:{},detached:[],skipped:[]}}};
  const state={document:doc as any,properties:[] as any[],templates:[] as any[],writes:[] as any[]};
  const documents:Record<string,any>={[id]:doc};
  await page.route('**/api/**',async route=>{
    const req=route.request(),path=new URL(req.url()).pathname;
    if(path.endsWith('/canvas-templates')){
      if(req.method()==='POST'){const value={...req.postDataJSON(),id:'c'+'2'.repeat(24)};state.templates.push(value);return route.fulfill({json:value});}
      return route.fulfill({json:state.templates});
    }
    if(path.includes('/canvas-templates/'))return route.fulfill({json:state.templates.find(template=>template.id===path.split('/').at(-1))});
    if(path.endsWith('/properties')){
      if(req.method()==='POST'){const value={id:'c3234567890123456789012345',version:1,record:req.postDataJSON().record,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};state.properties.push(value);return route.fulfill({status:201,json:value});}
      return route.fulfill({json:state.properties});
    }
    if(path.includes('/properties/')){const value={...state.properties[0],record:req.postDataJSON().record,version:2};state.properties[0]=value;return route.fulfill({json:value});}
    if(path.endsWith('/listing-profiles'))return route.fulfill({json:{version:0,record:{agent:record.agent,brand:record.brand}}});
    if(/\/designs(?:\/[^/]+)?$/.test(path)){
      if(req.method()==='GET')return route.fulfill({json:documents[path.split('/').at(-1)!]??state.document});
      const body=req.postDataJSON();state.writes.push(body);const target=req.method()==='POST'?'c'+String(state.writes.length).padStart(24,'4'):path.split('/').at(-1)!;
      state.document={...state.document,...body,id:target};documents[target]=state.document;return route.fulfill({json:state.document});
    }
    return route.fulfill({json:[]});
  });
  await page.goto(`/editor?editor=v3&designId=${id}`);
  await expect(page.getByTestId('design-canvas').getByText('10 Oak Road',{exact:true})).toBeVisible();
  return state;
}

const artboard=(page:Page)=>page.getByTestId('design-canvas');
async function noOverflow(page:Page,width:number) {
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
}
async function boundsInside(locator:import('@playwright/test').Locator,width:number,height:number) {
  const box=await locator.boundingBox();expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width+1);
  expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.y+box!.height).toBeLessThanOrEqual(height+1);
}

// Contract: both inspectors constrain the contextual toolbar without horizontal scrolling;
// every formatting operation remains accessible through keyboard-triggered overflow.
for(const theme of ['light','dark'])for(const selected of ['text','image'])test(`annotation toolbar ${selected} fits between inspectors in ${theme}`,async({page},info)=>{
  await page.setViewportSize({width:1242,height:668});const state=await setup(page,theme);
  const before=structuredClone(state.document.canvasData.elements);
  await page.getByRole('button',{name:'Details',exact:true}).click();
  const element=artboard(page).locator(`[data-element-id="${selected==='text'?'address':'photo'}"]`);
  await element.click();
  await page.locator('[aria-label="Canvas information"]').getByRole('button',{name:'Template Fields',exact:true}).click();
  await expect(page.getByRole('complementary',{name:'Template Fields panel',exact:true})).toBeVisible();
  await expect(page.getByRole('tablist',{name:'Listing details',exact:true})).toBeVisible();
  const toolbar=page.getByRole('toolbar',{name:`${selected} formatting`,exact:true});
  await expect(toolbar).toBeVisible();await noOverflow(page,1242);await boundsInside(toolbar,1242,668);
  await expect.poll(()=>toolbar.evaluate(node=>node.scrollWidth<=node.clientWidth+1)).toBe(true);
  expect(await toolbar.evaluate(node=>getComputedStyle(node).overflowX)).not.toBe('scroll');
  const more=toolbar.getByRole('button',{name:'More formatting options',exact:true});
  await expect(page.locator('[role="dialog"][aria-label="More formatting options"]')).toHaveCount(0);
  await expect(more).toBeVisible();await more.focus();await page.keyboard.press('Enter');
  const overflow=page.getByRole('dialog',{name:'More formatting options',exact:true});
  await expect(overflow).toBeVisible();await boundsInside(overflow,1242,668);
  await page.screenshot({path:info.outputPath(`toolbar-${selected}-${theme}.png`)});
  if(selected==='text') {
    const action=overflow.getByRole('button',{name:'Opacity',exact:true});
    await expect(action).toBeVisible();await action.click();
    await expect(page.getByRole('dialog',{name:'Transparency',exact:true})).toBeVisible();
  } else {
    await expect(toolbar.getByRole('button',{name:'Opacity',exact:true})).toBeVisible();
    await overflow.getByRole('button',{name:'More image options',exact:true}).click();
    const actions=page.getByRole('menu',{name:'Element actions',exact:true});
    await expect(actions.getByRole('menuitem',{name:'Copy',exact:true})).toBeEnabled();
    await expect(actions.getByRole('menuitem',{name:'Paste',exact:true})).toBeDisabled();
    await boundsInside(actions,1242,668);
  }
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Save as Design',exact:true}).click();
  await expect.poll(()=>state.writes.length).toBeGreaterThan(0);
  expect(state.writes.at(-1).canvasData.elements).toEqual(before);
});

// Contract: Details starts on Property; switching tabs retains unsaved field drafts.
for(const theme of ['light','dark'])test(`annotation Details tabs preserve drafts in ${theme}`,async({page})=>{
  await page.setViewportSize({width:1242,height:668});await setup(page,theme);
  await page.getByRole('button',{name:'Details',exact:true}).click();
  const tabs=page.getByRole('tablist',{name:'Listing details',exact:true});
  await expect(tabs.getByRole('tab',{name:'Property',exact:true})).toHaveAttribute('aria-selected','true');
  await page.getByRole('textbox',{name:'Address',exact:true}).fill('Unsaved property draft');
  await tabs.getByRole('tab',{name:'Agent',exact:true}).click();
  await page.getByRole('textbox',{name:'Full name',exact:true}).fill('Unsaved agent draft');
  await tabs.getByRole('tab',{name:'Property',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Address',exact:true})).toHaveValue('Unsaved property draft');
  await tabs.getByRole('tab',{name:'Agent',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Full name',exact:true})).toHaveValue('Unsaved agent draft');
  await expect(artboard(page).getByText('10 Oak Road',{exact:true})).toBeVisible();
});

// Contract: link controls belong to the information strip; Preview is a named icon
// after Export, and Undo last apply appears below Apply in the Listing footer only.
test('annotation information strip, Preview and listing undo have one clear location',async({page})=>{
  await page.setViewportSize({width:1242,height:668});await setup(page);
  const strip=page.locator('[aria-label="Canvas information"]');
  await expect(strip.getByRole('button',{name:'Template Fields',exact:true})).toBeVisible();
  await expect(strip.getByRole('button',{name:'Show links',exact:true})).toBeVisible();
  const footer=page.locator('.v3-footer');
  await expect(footer.getByRole('button',{name:'Template Fields',exact:true})).toHaveCount(0);
  await expect(footer.getByRole('button',{name:'Show links',exact:true})).toHaveCount(0);
  const header=page.locator('.v3-header'),preview=header.getByRole('button',{name:'Preview',exact:true});
  await expect(preview).toBeVisible();expect((await preview.innerText()).trim()).toBe('');
  const exportButton=header.getByRole('button',{name:'Review & export',exact:true});
  expect((await preview.boundingBox())!.x).toBeGreaterThan((await exportButton.boundingBox())!.x);
  await preview.focus();await page.keyboard.press('Enter');
  await expect(artboard(page)).toHaveAttribute('data-preview','true');await page.keyboard.press('Escape');
  await expect(preview).toBeFocused();
  await expect(header.getByRole('button',{name:'Undo last apply',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Listing',exact:true}).click();
  const panel=page.getByRole('complementary',{name:'Listing panel',exact:true});
  const apply=panel.getByRole('button',{name:'Apply to design',exact:true}),undo=panel.getByRole('button',{name:'Undo last apply',exact:true});
  await expect(undo).toBeDisabled();
  await panel.getByRole('button',{name:/Property information/}).click();
  await page.getByRole('spinbutton',{name:'Asking price',exact:true}).fill('450000');
  await page.getByRole('button',{name:'Save property',exact:true}).click();
  await page.getByRole('button',{name:'Listing',exact:true}).click();
  await apply.click();await expect(artboard(page).getByText('US$450,000',{exact:true})).toHaveCount(2);
  expect((await undo.boundingBox())!.y).toBeGreaterThan((await apply.boundingBox())!.y);
  await undo.click();await expect(artboard(page).getByText('US$400,000',{exact:true})).toHaveCount(2);
  await expect(panel.getByRole('button',{name:/Property information/})).toContainText('US$450,000');
});

for(const theme of ['light','dark'])for(const width of [375,768])test(`annotation relocated controls remain reachable at ${width}px in ${theme}`,async({page},info)=>{
  await page.setViewportSize({width,height:812});await setup(page,theme);await noOverflow(page,width);
  const strip=page.locator('[aria-label="Canvas information"]');
  await strip.getByRole('button',{name:'Show links',exact:true}).click();
  await expect(page.getByTestId('link-overlay')).toBeVisible();
  await strip.getByRole('button',{name:'Template Fields',exact:true}).click();
  const fields=page.getByRole('complementary',{name:'Template Fields panel',exact:true});
  await expect(fields).toBeVisible();await boundsInside(fields,width,812);
  await page.getByRole('button',{name:'Details',exact:true}).click();
  if(width<768) await expect(fields).toHaveCount(0);
  else await expect(fields).toBeVisible();
  const tabs=page.getByRole('tablist',{name:'Listing details',exact:true});
  await tabs.getByRole('tab',{name:'Agent',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Full name',exact:true})).toBeVisible();await noOverflow(page,width);
  await page.screenshot({path:info.outputPath(`details-${width}-${theme}.png`)});
  await page.getByRole('button',{name:'More actions',exact:true}).click();
  await expect(page.getByRole('menuitem',{name:'Undo last apply',exact:true})).toHaveCount(0);
  await page.getByRole('menuitem',{name:'Preview',exact:true}).click();
  await expect(artboard(page)).toHaveAttribute('data-preview','true');await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'More actions',exact:true})).toBeFocused();
});
