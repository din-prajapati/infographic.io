import { test, expect, type Page } from '@playwright/test';

const id='c'+'1'.repeat(24);
const record={property:{name:'Oak listing',headline:'Your next home',address:'10 Oak Road',description:'A bright home',type:'residential',country:'US',currency:'USD',amount:'400000',transaction:'sale',rentalPeriod:'month',beds:'3',baths:'2',area:'1400',areaUnit:'sq ft',status:'Active',features:[]},agent:{name:'Alex Agent',phone:'+1 212 555 0100',email:'alex@example.test',agency:'Oak Realty',license:'',photo:''},brand:{name:'Oak Realty',logo:'',tagline:'Find your home',accent:''},photos:[]};
const text=(key:string,content:string,slot:string,y:number)=>({id:key,type:'text',name:key,content,slot,x:60,y,width:500,height:60,rotation:0,opacity:1,locked:false,visible:true,zIndex:y,fontFamily:'Arial',fontSize:24,fontWeight:400,bold:false,italic:false,underline:false,strikethrough:false,color:'#111111',align:'left',lineHeight:1.2,textTransform:'none',listStyle:'none'});
async function setup(page:Page,theme='light'){
  await page.addInitScript(theme=>{localStorage.setItem('auth_token','listing-fixture');localStorage.setItem('auth_user',JSON.stringify({id:'listing-user',name:'Alex',email:'alex@example.test',plan:'SOLO'}));localStorage.setItem('theme',theme);},theme);
  const elements=[text('headline',record.property.headline,'property.headline',45),text('address',record.property.address,'property.location',125),text('price','US$400,000','property.price',205),text('price-copy','US$400,000','property.price',285)];
  const bindings=Object.fromEntries(elements.map(e=>[e.id,{slot:e.slot}]));
  const doc={id,name:'Oak design',type:'design',thumbnail:'',tags:[],canvasData:{elements,canvasWidth:800,canvasHeight:600,backgroundColor:'#ffffff',v3Listing:{version:1,pending:structuredClone(record),applied:structuredClone(record),bindings,appliedBindings:structuredClone(bindings),overrides:{},detached:[],skipped:[]}}};
  const state={document:doc as any,properties:[] as any[],templates:[] as any[],writes:[] as any[],failSave:false};
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
      if(state.failSave)return route.fulfill({status:503,json:{message:'Connection unavailable. Retry save.'}});
      const body=req.postDataJSON();state.writes.push(body);const target=req.method()==='POST'?'c'+String(state.writes.length).padStart(24,'4'):path.split('/').at(-1)!;
      state.document={...state.document,...body,id:target};documents[target]=state.document;return route.fulfill({json:state.document});
    }
    return route.fulfill({json:[]});
  });
  await page.goto(`/editor?editor=v3&designId=${id}`);
  await expect(page.getByTestId('design-canvas').getByText('10 Oak Road',{exact:true})).toBeVisible();
  return state;
}

// These checks exercise the public editor and saved document, without reading its store.
for (const theme of ['light','dark']) for (const width of [320,375,390,768,820,1024,1440]) {
  test(`responsive editor at ${width}px in ${theme}`,async({page})=>{
    await page.setViewportSize({width,height:812});
    const state=await setup(page,theme);
    const before=structuredClone(state.document.canvasData.elements);
    const header=page.locator('.v3-header');
    expect((await header.boundingBox())!.height).toBeLessThanOrEqual(64);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const viewport=page.locator('[data-canvas-viewport]');
    expect((await viewport.boundingBox())!.height).toBeGreaterThan(150);
    if(width<768) {
      await expect(header.getByRole('button',{name:'Undo',exact:true})).toBeHidden();
      await expect(header.getByRole('button',{name:'Redo',exact:true})).toBeHidden();
      await expect(header.getByRole('link',{name:'Projects',exact:true})).toBeVisible();
      await expect(page.getByRole('complementary',{name:'Templates panel',exact:true})).toBeHidden();
      const navigation=await page.getByRole('navigation',{name:'Editor sections'}).boundingBox();
      expect(navigation!.y).toBeGreaterThan(700);
    }
    await page.getByRole('button',{name:'Listing',exact:true}).click();
    const panel=page.getByRole('complementary',{name:'Listing panel',exact:true});
    await expect(panel.getByRole('button',{name:/Property information/})).toBeVisible();
    const bounds=await panel.boundingBox(),canvas=await viewport.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(width+1);
    expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(813);
    expect(canvas!.width).toBeGreaterThan(100);
    expect(canvas!.height).toBeGreaterThan(100);
    if(width<768) {
      expect(canvas!.y+canvas!.height).toBeLessThanOrEqual(bounds!.y+1);
      await page.screenshot({path:`.e2e-artifacts/responsive-sheet-${theme}-${width}.png`});
      await page.getByRole('button',{name:'Expand panel',exact:true}).click();
      await expect(page.getByRole('button',{name:'Collapse panel',exact:true})).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(panel).toBeHidden();
      await expect(page.getByRole('button',{name:'Listing',exact:true})).toBeFocused();
    }
    await page.getByRole('button',{name:'Save as Design',exact:true}).click();
    await expect.poll(()=>state.writes.length).toBeGreaterThan(0);
    expect(state.document.canvasData.elements).toEqual(before);
    expect(state.document.canvasData.canvasWidth).toBe(800);
    expect(state.document.canvasData.canvasHeight).toBe(600);
    await page.screenshot({path:`.e2e-artifacts/responsive-${theme}-${width}.png`});
  });
}

test('phone actions and export review remain reachable',async({page})=>{
  await page.setViewportSize({width:375,height:812});await setup(page);
  await page.getByRole('button',{name:'More actions',exact:true}).click();
  await expect(page.getByRole('menuitem',{name:'Undo',exact:true})).toBeDisabled();
  await page.getByRole('menuitem',{name:'Template Fields',exact:true}).click();
  await expect(page.getByRole('complementary',{name:'Template Fields panel',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'More actions',exact:true}).click();
  await page.getByRole('menuitem',{name:'Export',exact:true}).click();
  const review=page.getByRole('dialog',{name:'Review & export',exact:true});
  await expect(review).toBeVisible();
  await expect.poll(async()=>{const box=await review.boundingBox();return !!box&&box.x>=0&&box.x+box.width<=376;}).toBe(true);
  await expect(review.getByRole('button',{name:'Download PNG',exact:true})).toBeDisabled();
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'More actions',exact:true}).click();
  await page.getByRole('menuitem',{name:'Preview',exact:true}).click();
  await expect(page.getByRole('main',{name:'Design preview',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'More actions',exact:true})).toBeFocused();
});

test('short landscape leaves canvas beside bounded tools',async({page})=>{
  await page.setViewportSize({width:667,height:375});await setup(page);
  await page.getByRole('button',{name:'Listing',exact:true}).click();
  const panel=await page.getByRole('complementary',{name:'Listing panel',exact:true}).boundingBox();
  const canvas=await page.locator('[data-canvas-viewport]').boundingBox();
  expect(panel!.x+panel!.width).toBeLessThanOrEqual(canvas!.x+1);
  expect(canvas!.width).toBeGreaterThan(150);expect(canvas!.height).toBeGreaterThan(100);
});

test('phone save failure can retry after rotation without changing artwork',async({page})=>{
  await page.setViewportSize({width:390,height:844});const state=await setup(page);
  const before=structuredClone(state.document.canvasData.elements);
  state.failSave=true;
  await page.getByRole('button',{name:'Save as Design',exact:true}).click();
  await expect(page.getByRole('alert').filter({hasText:'Save failed'})).toBeVisible();
  await page.setViewportSize({width:844,height:390});
  state.failSave=false;
  await page.getByRole('button',{name:'Retry save',exact:true}).click();
  await expect.poll(()=>state.writes.length).toBeGreaterThan(0);
  expect(state.document.canvasData.elements).toEqual(before);
  await page.reload();
  await expect(page.getByTestId('design-canvas').getByText('10 Oak Road',{exact:true})).toBeVisible();
});

test('phone navigation keeps every existing section inside the screen',async({page})=>{
  await page.setViewportSize({width:320,height:568});await setup(page,'dark');
  for(const name of ['Templates','Elements','Text','Uploads','Brand','Listing','Agent']) {
    const trigger=page.getByRole('navigation',{name:'Editor sections'}).getByRole('button',{name,exact:true});
    await trigger.click();
    const box=await trigger.boundingBox();expect(box!.width).toBeGreaterThanOrEqual(44);expect(box!.height).toBeGreaterThanOrEqual(44);
    const panel=page.locator('.v3-panel');await expect(panel).toBeVisible();
    const bounds=await panel.boundingBox();expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(321);
    expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(569);
    expect((await page.locator('[data-canvas-viewport]').boundingBox())!.height).toBeGreaterThan(100);
    await page.keyboard.press('Escape');await expect(panel).toBeHidden();await expect(trigger).toBeFocused();
  }
});

test('phone listing apply and undo stay available through More',async({page})=>{
  await page.setViewportSize({width:375,height:812});await setup(page);
  await page.getByRole('button',{name:'Listing',exact:true}).click();
  await page.getByRole('button',{name:'Expand panel',exact:true}).click();
  await page.getByRole('button',{name:/Property information/}).click();
  await page.getByRole('spinbutton',{name:'Asking price',exact:true}).fill('450000');
  await page.getByRole('button',{name:'Save property',exact:true}).click();
  await page.getByRole('button',{name:'More actions',exact:true}).click();
  await page.getByRole('menuitem',{name:'Apply listing updates',exact:true}).click();
  await expect(page.getByTestId('design-canvas').getByText('US$450,000',{exact:true})).toHaveCount(2);
  await page.getByRole('button',{name:'More actions',exact:true}).click();
  await page.getByRole('menuitem',{name:'Undo last apply',exact:true}).click();
  await expect(page.getByTestId('design-canvas').getByText('US$400,000',{exact:true})).toHaveCount(2);
});


