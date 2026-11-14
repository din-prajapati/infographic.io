import {test, expect, type Page, type Locator} from '@playwright/test';

const originalId='c'+'1'.repeat(24);
const newId='c'+'2'.repeat(24);
function deferred(){let resolve!:()=>void;const promise=new Promise<void>(yes=>{resolve=yes;});return {promise,resolve};}
function fixture(){
  const property={name:'Oak listing',headline:'Your next home',address:'10 Oak Road',description:'A bright home',type:'residential',country:'US',currency:'USD',amount:'400000',transaction:'sale',rentalPeriod:'month',beds:'3',baths:'2',area:'1400',areaUnit:'sq ft',status:'Active',features:[]};
  const listing={property,agent:{name:'Alex Agent',phone:'555-0100',email:'alex@example.test',agency:'Oak Realty',license:'',photo:''},brand:{name:'Oak Realty',logo:'',tagline:'',accent:''},photos:[]};
  const element=(id:string,content:string,y:number,slot?:string)=>({id,name:id,type:'text',x:40,y,width:500,height:70,rotation:0,opacity:1,locked:false,visible:true,zIndex:1,content,slot,fontFamily:'Arial',fontSize:24,fontWeight:400,bold:false,italic:false,underline:false,strikethrough:false,color:'#111111',align:'left',lineHeight:1.2,textTransform:'none',listStyle:'none'});
  return {id:originalId,name:'Oak design',type:'design',category:'real-estate-luxury',tags:['original'],thumbnail:'',createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z',canvasData:{elements:[element('address','10 Oak Road',40,'property.location'),element('static','CALL TODAY',150)],canvasWidth:800,canvasHeight:600,backgroundColor:'#ffffff',v3Listing:{version:1,pending:structuredClone(listing),applied:structuredClone(listing),bindings:{address:{slot:'property.location'}},appliedBindings:{address:{slot:'property.location'}},overrides:{},detached:[],skipped:[]}}};
}
async function setup(page:Page,options:{blank?:boolean;theme?:string}={}){
  await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.addInitScript(theme=>{localStorage.setItem('auth_token','save-flow-fixture');localStorage.setItem('auth_user',JSON.stringify({id:'save-user',name:'Alex',email:'alex@example.test',plan:'SOLO'}));localStorage.setItem('theme',theme);},options.theme??'light');
  const documents:Record<string,any>={[originalId]:fixture()};
  const state={documents,writes:[] as {method:string;body:any;id:string}[],templates:[] as any[],rejectCreate:false,rejectUpdate:false,rejectTemplate:false,invalidCreateId:false,createGate:null as ReturnType<typeof deferred>|null,updateGate:null as ReturnType<typeof deferred>|null};
  await page.route('**/api/**',async route=>{
    const req=route.request(),path=new URL(req.url()).pathname,method=req.method();
    if(/\/designs(?:\/[^/]+)?$/.test(path)){
      if(method==='GET')return route.fulfill({json:path.endsWith('/designs')?Object.values(documents):documents[path.split('/').at(-1)!]});
      const body=req.postDataJSON(),id=method==='POST'?newId:path.split('/').at(-1)!;
      state.writes.push({method,body:structuredClone(body),id});
      if(method==='POST'&&state.createGate)await state.createGate.promise;
      if(method==='PUT'&&state.updateGate)await state.updateGate.promise;
      if(method==='POST'&&state.rejectCreate||method==='PUT'&&state.rejectUpdate)return route.fulfill({status:503,json:{message:'Save temporarily unavailable'}});
      if(method==='POST'&&state.invalidCreateId)return route.fulfill({json:{...body,id:'invalid'}});
      documents[id]={...documents[id],...body,id};return route.fulfill({json:documents[id]});
    }
    if(path.endsWith('/canvas-templates')){
      if(method==='POST'){
        if(state.rejectTemplate)return route.fulfill({status:503,json:{message:'Template temporarily unavailable'}});
        const saved={...req.postDataJSON(),id:'c'+'3'.repeat(24)};state.templates.push(saved);return route.fulfill({json:saved});
      }
      return route.fulfill({json:state.templates});
    }
    if(path.endsWith('/listing-profiles'))return route.fulfill({json:{version:0,record:{agent:fixture().canvasData.v3Listing.pending.agent,brand:fixture().canvasData.v3Listing.pending.brand}}});
    return route.fulfill({json:[]});
  });
  await page.goto(options.blank?'/editor?editor=v3':`/editor?editor=v3&designId=${originalId}`);
  await expect(page.locator('.v3-header').getByRole('button',{name:'Save',exact:true})).toBeEnabled();
  return state;
}
async function openAction(page:Page,kind:'copy'|'template'){
  await page.getByRole('button',{name:'Save options',exact:true}).click();
  await page.getByRole('menuitem',{name:kind==='copy'?/^Save a copy/:/^Create reusable template/}).click();
  return page.getByRole('dialog',{name:kind==='copy'?'Save a copy':'Create reusable template',exact:true});
}
async function addTag(dialog:Locator,value:string,template=false){
  const summary=dialog.getByText(template?'Category and tags (optional)':'Tags (optional)',{exact:true});
  if(!await dialog.getByRole('textbox',{name:'Add a tag',exact:true}).isVisible())await summary.click();
  await dialog.getByRole('textbox',{name:'Add a tag',exact:true}).fill(value);
  await dialog.getByRole('button',{name:'Add tag',exact:true}).click();
}
async function insideScreen(dialog:Locator,page:Page){
  const box=(await dialog.boundingBox())!,viewport=page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x+box.width).toBeLessThanOrEqual(viewport.width+1);expect(box.y+box.height).toBeLessThanOrEqual(viewport.height+1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
}

// AC5/7: an existing Save writes its canonical ID and preserves category/tags, without a naming dialog.
test('Save updates the existing Design with its metadata and shortcut',async({page})=>{
  const state=await setup(page);
  await page.getByRole('textbox',{name:'Design title',exact:true}).fill('Renamed Oak');
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect.poll(()=>state.writes.length).toBe(1);
  expect(state.writes[0]).toMatchObject({method:'PUT',id:originalId,body:{name:'Renamed Oak',category:'real-estate-luxury',tags:['original']}});
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button',{name:'Save',exact:true}).focus();await page.keyboard.press('Control+s');
  await expect.poll(()=>state.writes.length).toBe(2);expect(state.writes[1].id).toBe(originalId);
});

// AC5/6: first Save names the new Design; cancel creates nothing, and chosen tags survive reload.
test('first Save supports cancellation, naming and optional Design tags',async({page})=>{
  const state=await setup(page,{blank:true});
  await page.getByRole('button',{name:'Save',exact:true}).click();
  let dialog=page.getByRole('dialog',{name:'Save design',exact:true});
  await expect(dialog).toBeVisible();await dialog.getByRole('button',{name:'Cancel',exact:true}).click();expect(state.writes).toEqual([]);
  await page.clock.runFor(50);await expect(page.getByRole('button',{name:'Save',exact:true})).toBeFocused();
  await page.keyboard.press('Control+s');dialog=page.getByRole('dialog',{name:'Save design',exact:true});
  await dialog.getByRole('textbox',{name:'Design name',exact:true}).fill('My first Design');await addTag(dialog,'listing');
  await dialog.getByRole('button',{name:'Save design',exact:true}).click();
  await expect(page).toHaveURL(new RegExp(`designId=${newId}`));expect(state.documents[newId]).toMatchObject({name:'My first Design',tags:['listing']});
  await page.reload();const copy=await openAction(page,'copy');await copy.getByText('Tags (optional)',{exact:true}).click();
  await expect(copy.getByText('listing',{exact:true})).toBeVisible();
});

// AC7: local recovery retains first-save metadata after a failed creation.
test('failed first Save restores the chosen name and tags through local recovery',async({page})=>{
  const state=await setup(page,{blank:true});state.rejectCreate=true;
  await page.getByRole('button',{name:'Save',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Save design',exact:true});
  await dialog.getByRole('textbox',{name:'Design name',exact:true}).fill('Recovered draft');await addTag(dialog,'recovery');
  await dialog.getByRole('button',{name:'Save design',exact:true}).click();await expect(dialog.getByRole('alert')).toBeVisible();
  await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.reload();await page.getByRole('button',{name:'Restore draft',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Design title',exact:true})).toHaveValue('Recovered draft');
  state.rejectCreate=false;await page.getByRole('button',{name:'Save',exact:true}).click();
  const restored=page.getByRole('dialog',{name:'Save design',exact:true});await restored.getByText('Tags (optional)',{exact:true}).click();
  await expect(restored.getByText('recovery',{exact:true})).toBeVisible();await restored.getByRole('button',{name:'Save design',exact:true}).click();
  await expect(page).toHaveURL(new RegExp(`designId=${newId}`));expect(state.documents[newId].tags).toEqual(['recovery']);
});

// AC6/7: unchecked copy preserves source; autosave waits while consent is pending; copy tags are independent.
test('Save a copy isolates the original and retains draft artwork and tags',async({page})=>{
  const state=await setup(page),original=structuredClone(state.documents[originalId]);
  await page.getByRole('textbox',{name:'Design title',exact:true}).fill('Unsaved source title');
  const dialog=await openAction(page,'copy');
  await expect(dialog.getByRole('checkbox',{name:/Also save/})).not.toBeChecked();
  await page.clock.runFor(3000);expect(state.writes).toEqual([]);
  await dialog.getByRole('textbox',{name:'Design name',exact:true}).fill('Oak copy');await addTag(dialog,'copy');
  await dialog.getByRole('button',{name:'Save a copy',exact:true}).click();
  await expect(page).toHaveURL(new RegExp(`designId=${newId}`));expect(state.documents[originalId]).toEqual(original);
  expect(state.documents[newId]).toMatchObject({name:'Oak copy',category:'real-estate-luxury',tags:['original','copy']});
  expect(state.documents[newId].canvasData.v3Listing.pending).toEqual(original.canvasData.v3Listing.pending);
  expect(state.documents[newId].canvasData.elements).toEqual(original.canvasData.elements);
});

// AC7: requesting source save writes the original first, then creates a separate copy; failure stops creation.
test('copy can save the original first and retries a source-save failure',async({page})=>{
  const state=await setup(page);state.rejectUpdate=true;
  await page.getByRole('textbox',{name:'Design title',exact:true}).fill('Updated original');
  const dialog=await openAction(page,'copy');await dialog.getByRole('textbox',{name:'Design name',exact:true}).fill('Independent copy');
  await dialog.getByRole('checkbox',{name:/Also save/}).check();await dialog.getByRole('button',{name:'Save a copy',exact:true}).click();
  await expect(dialog.getByRole('alert')).toBeVisible();expect(state.writes.map(write=>write.method)).toEqual(['PUT']);
  state.rejectUpdate=false;await dialog.getByRole('button',{name:/^Retry/}).click();
  await expect(page).toHaveURL(new RegExp(`designId=${newId}`));
  expect(state.writes.map(write=>write.method)).toEqual(['PUT','PUT','POST']);
  expect(state.documents[originalId].name).toBe('Updated original');expect(state.documents[newId].name).toBe('Independent copy');
});

// AC6: failed copy retains name/tags and canonical source; retry only reports success after acknowledgment.
test('copy failure retains dialog values and can retry',async({page})=>{
  const state=await setup(page);state.rejectCreate=true;
  const dialog=await openAction(page,'copy');await dialog.getByRole('textbox',{name:'Design name',exact:true}).fill('Retry copy');await addTag(dialog,'retry');
  await dialog.getByRole('button',{name:'Save a copy',exact:true}).click();
  await expect(dialog.getByRole('alert')).toBeVisible();await expect(dialog.getByRole('textbox',{name:'Design name',exact:true})).toHaveValue('Retry copy');
  await expect(page).toHaveURL(new RegExp(`designId=${originalId}`));expect(state.documents[newId]).toBeUndefined();
  state.rejectCreate=false;await dialog.getByRole('button',{name:/^Retry/}).click();await expect(dialog).toHaveCount(0);
  expect(state.documents[newId].tags).toEqual(['original','retry']);
});

// AC6: malformed acknowledgement cannot change source identity or report successful creation.
test('invalid created ID stays in the source Design with retry',async({page})=>{
  const state=await setup(page);state.invalidCreateId=true;
  const dialog=await openAction(page,'copy');await dialog.getByRole('button',{name:'Save a copy',exact:true}).click();
  await expect(dialog.getByRole('alert')).toBeVisible();await expect(page).toHaveURL(new RegExp(`designId=${originalId}`));
});

// AC6: Template creation strips linked listing facts, keeps independent text, and never changes the current Design.
test('Create reusable template accepts metadata and stays in the current Design',async({page})=>{
  const state=await setup(page),original=structuredClone(state.documents[originalId]);
  const dialog=await openAction(page,'template');
  await dialog.getByRole('textbox',{name:'Template name',exact:true}).fill('Reusable Oak layout');await addTag(dialog,'reusable',true);
  await expect(dialog.getByRole('combobox',{name:'Category',exact:true})).toBeVisible();
  await dialog.getByRole('button',{name:'Create template',exact:true}).click();await expect(dialog).toHaveCount(0);
  expect(state.templates).toHaveLength(1);const saved=state.templates[0];
  expect(saved).toMatchObject({name:'Reusable Oak layout',type:'template',category:'real-estate-luxury',tags:['original','reusable']});
  expect(saved.canvasData.v3Listing).toBeUndefined();expect(saved.canvasData.elements.find((el:any)=>el.id==='address').content).toBe('[Address]');
  expect(saved.canvasData.elements.find((el:any)=>el.id==='static').content).toBe('CALL TODAY');
  expect(state.documents[originalId]).toEqual(original);await expect(page).toHaveURL(new RegExp(`designId=${originalId}`));
  await expect(page.getByRole('link',{name:'View in Templates',exact:true})).toBeVisible();
});

// AC6: template failure leaves entered metadata available, and cancel still keeps the artwork.
test('failed template creation retains input for retry and cancel',async({page})=>{
  const state=await setup(page);state.rejectTemplate=true;
  const dialog=await openAction(page,'template');await dialog.getByRole('textbox',{name:'Template name',exact:true}).fill('Unsent layout');
  await dialog.getByRole('button',{name:'Create template',exact:true}).click();await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(dialog.getByRole('textbox',{name:'Template name',exact:true})).toHaveValue('Unsent layout');expect(state.templates).toEqual([]);
  await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.getByTestId('design-canvas').getByText('10 Oak Road',{exact:true})).toBeVisible();
});

// AC6: repeated submission while a create request is pending cannot create duplicates.
test('copy creation prevents duplicate submissions while pending',async({page})=>{
  const state=await setup(page);state.createGate=deferred();
  const dialog=await openAction(page,'copy');await dialog.getByRole('button',{name:'Save a copy',exact:true}).click();
  await expect.poll(()=>state.writes.length).toBe(1);await expect(dialog.getByRole('button',{name:/Saving|Creating/})).toBeDisabled();
  await page.keyboard.press('Enter');expect(state.writes).toHaveLength(1);state.createGate.resolve();await expect(dialog).toHaveCount(0);
});

// AC7: a late copy acknowledgment cannot close a newer creation dialog after same-session browser Back.
test('a late copy response preserves the next Design and its new dialog draft',async({page})=>{
  const state=await setup(page),otherId='c'+'4'.repeat(24);
  state.documents[otherId]={...fixture(),id:otherId,name:'Other Design'};
  await page.goto(`/editor?editor=v3&designId=${otherId}`);
  await expect(page.getByRole('textbox',{name:'Design title',exact:true})).toHaveValue('Other Design');
  await page.evaluate(id=>window.history.pushState(null,'',`/editor?editor=v3&designId=${id}`),originalId);
  await expect(page.getByRole('textbox',{name:'Design title',exact:true})).toHaveValue('Oak design');
  state.createGate=deferred();let dialog=await openAction(page,'copy');
  await dialog.getByRole('button',{name:'Save a copy',exact:true}).click();await expect.poll(()=>state.writes.length).toBe(1);
  await page.goBack();await expect(page.getByRole('textbox',{name:'Design title',exact:true})).toHaveValue('Other Design');
  dialog=await openAction(page,'copy');await dialog.getByRole('textbox',{name:'Design name',exact:true}).fill('Keep this newer dialog');
  state.createGate.resolve();await expect.poll(()=>state.documents[newId]?.id).toBe(newId);
  await expect(dialog).toBeVisible();await expect(dialog.getByRole('textbox',{name:'Design name',exact:true})).toHaveValue('Keep this newer dialog');
  await expect(page).toHaveURL(new RegExp(`designId=${otherId}`));
});

// AC8: one theme-matched dialog fits each viewport and restores focus on keyboard cancellation.
for(const theme of ['light','dark'])for(const width of [375,768,1440])test(`Save dialog is bounded and keyboard reachable at ${width}px in ${theme}`,async({page},info)=>{
  await page.setViewportSize({width,height:width===1440?900:812});await setup(page,{theme});
  const dialog=await openAction(page,'template');await expect(dialog).toBeVisible();await insideScreen(dialog,page);
  const surface=await dialog.evaluate(node=>getComputedStyle(node).backgroundColor);
  const expected=await page.locator('.v3-editor').evaluate(node=>getComputedStyle(node).getPropertyValue('--v3-surface').trim());
  expect(surface).toBe(await page.evaluate(color=>{const node=document.createElement('div');node.style.color=color;document.body.append(node);const resolved=getComputedStyle(node).color;node.remove();return resolved;},expected));
  await dialog.getByText('Category and tags (optional)',{exact:true}).click();await insideScreen(dialog,page);
  await dialog.getByRole('textbox',{name:'Template name',exact:true}).fill('');await expect(dialog.getByRole('button',{name:'Create template',exact:true})).toBeDisabled();
  await page.screenshot({path:info.outputPath(`save-template-${width}-${theme}.png`)});
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await page.clock.runFor(50);await expect(page.getByRole('button',{name:'Save options',exact:true})).toBeFocused();
});

// AC8: in short landscape the metadata body scrolls while the action row remains inside the viewport.
for(const theme of ['light','dark'])test(`short-screen Save dialog retains scrollable metadata and actions in ${theme}`,async({page},info)=>{
  await page.setViewportSize({width:812,height:375});await setup(page,{theme});const dialog=await openAction(page,'template');
  await dialog.getByText('Category and tags (optional)',{exact:true}).click();await insideScreen(dialog,page);
  const body=dialog.locator('.v3-save-body');expect(await body.evaluate(node=>node.scrollHeight>node.clientHeight)).toBe(true);
  const submit=dialog.getByRole('button',{name:'Create template',exact:true});await expect(submit).toBeInViewport();
  expect((await submit.boundingBox())!.y+(await submit.boundingBox())!.height).toBeLessThanOrEqual(375);
  await dialog.getByRole('textbox',{name:'Add a tag',exact:true}).scrollIntoViewIfNeeded();await expect(submit).toBeInViewport();
  await page.screenshot({path:info.outputPath(`save-template-short-${theme}.png`)});
});

// T9: one outlined Save group shares hover/focus/open highlight across both halves; disabled saving stays neutral.
for(const theme of ['light','dark'])for(const width of [375,1242])test(`Save split button has unified border hover and focus at ${width}px in ${theme}`,async({page},info)=>{
  await page.setViewportSize({width,height:812});const state=await setup(page,{theme});
  const split=page.locator('.v3-save-split'),save=split.getByRole('button',{name:'Save',exact:true}),options=split.getByRole('button',{name:'Save options',exact:true});
  const idle='rgba(0, 0, 0, 0)';
  const highlight=await page.evaluate(()=>{const reference=document.createElement('div');reference.style.backgroundColor='#ffffff1a';document.body.append(reference);const color=getComputedStyle(reference).backgroundColor;reference.remove();return color;});
  await page.mouse.move(0,0);await page.getByRole('textbox',{name:'Design title',exact:true}).focus();
  await expect(split).toHaveCSS('border-top-width','1px');await expect(split).toHaveCSS('border-top-style','solid');
  const outline=await page.locator('.v3-header [aria-label="Undo"]').evaluate(node=>getComputedStyle(node).borderTopColor);
  await expect(split).toHaveCSS('border-top-color',outline);await expect(split).toHaveCSS('background-color',idle);
  const before=(await split.boundingBox())!;
  for(const half of [save,options]){
    await half.hover();await expect(split).toHaveCSS('background-color',highlight);
    await expect(save).toHaveCSS('background-color',idle);await expect(options).toHaveCSS('background-color',idle);
    const after=(await split.boundingBox())!;expect(after.width).toBe(before.width);expect(after.height).toBe(before.height);
  }
  await page.mouse.move(0,0);await options.focus();await expect(split).toHaveCSS('background-color',highlight);
  await expect(options).toHaveCSS('outline-style','solid');await expect(options).toHaveCSS('outline-width','2px');
  await page.keyboard.press('Enter');await expect(page.getByRole('menuitem',{name:/^Save a copy/})).toBeVisible();
  // T10: Save options contains exactly two actionable, icon-led rows; no Design section label.
  const menu=page.getByRole('menu',{name:'Save options',exact:true});
  await expect(menu).toHaveText('Save a copy...Create reusable template...');
  await expect(menu.getByRole('menuitem')).toHaveText(['Save a copy...','Create reusable template...']);
  for(const [name,icon] of [['Save a copy...','copy'],['Create reusable template...','layout-template']]){
    const symbol=menu.getByRole('menuitem',{name,exact:true}).locator(`svg.lucide-${icon}`);
    await expect(symbol).toBeVisible();await expect(symbol).toHaveAttribute('aria-hidden','true');
    await expect(symbol).toHaveCSS('width','16px');await expect(symbol).toHaveCSS('height','16px');
  }
  await expect(split).toHaveCSS('background-color',highlight);
  await page.screenshot({path:info.outputPath(`save-split-${width}-${theme}.png`)});
  await page.keyboard.press('Escape');await page.clock.runFor(50);
  await page.getByRole('textbox',{name:'Design title',exact:true}).focus();await page.mouse.move(0,0);await expect(split).toHaveCSS('background-color',idle);
  state.updateGate=deferred();await save.click();await expect.poll(()=>state.writes.length).toBe(1);
  await expect(save).toBeDisabled();await expect(options).toBeDisabled();await options.hover();await expect(split).toHaveCSS('background-color',idle);
  state.updateGate.resolve();await expect(save).toBeEnabled();
});
