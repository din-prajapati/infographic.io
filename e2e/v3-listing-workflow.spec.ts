import { test, expect, type Page } from '@playwright/test';

const id='c'+'1'.repeat(24);
const record={property:{name:'Oak listing',headline:'Your next home',address:'10 Oak Road',description:'A bright home',type:'residential',country:'US',currency:'USD',amount:'400000',transaction:'sale',rentalPeriod:'month',beds:'3',baths:'2',area:'1400',areaUnit:'sq ft',status:'Active',features:[]},agent:{name:'Alex Agent',phone:'+1 212 555 0100',email:'alex@example.test',agency:'Oak Realty',license:'',photo:''},brand:{name:'Oak Realty',logo:'',tagline:'Find your home',accent:''},photos:[]};
const text=(key:string,content:string,slot:string,y:number)=>({id:key,type:'text',name:key,content,slot,x:60,y,width:500,height:60,rotation:0,opacity:1,locked:false,visible:true,zIndex:y,fontFamily:'Arial',fontSize:24,fontWeight:400,bold:false,italic:false,underline:false,strikethrough:false,color:'#111111',align:'left',lineHeight:1.2,textTransform:'none',listStyle:'none'});
async function setup(page:Page,theme='light'){
  await page.addInitScript(theme=>{localStorage.setItem('auth_token','listing-fixture');localStorage.setItem('auth_user',JSON.stringify({id:'listing-user',name:'Alex',email:'alex@example.test',plan:'SOLO'}));localStorage.setItem('theme',theme);},theme);
  const elements=[text('headline',record.property.headline,'property.headline',45),text('address',record.property.address,'property.location',125),text('price','US$400,000','property.price',205),text('price-copy','US$400,000','property.price',285)];
  const bindings=Object.fromEntries(elements.map(e=>[e.id,{slot:e.slot}]));
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

// Contract: backend source save changes pending state; Apply alone updates every linked instance;
// Undo last apply restores artwork while retaining the edited listing source.
test('listing edits save separately, apply together and undo without losing source',async({page})=>{
  const state=await setup(page);
  await page.getByRole('button',{name:'Listing',exact:true}).click();
  await page.getByRole('button',{name:/Property information/}).click();
  await page.getByRole('spinbutton',{name:'Asking price',exact:true}).fill('450000');
  await page.getByRole('button',{name:'Save property',exact:true}).click();
  await expect(page.getByTestId('design-canvas').getByText('US$400,000',{exact:true})).toHaveCount(2);
  await expect.poll(()=>state.properties.length).toBe(1);
  await page.getByRole('button',{name:'Apply listing updates',exact:true}).click();
  await expect(page.getByTestId('design-canvas').getByText('US$450,000',{exact:true})).toHaveCount(2);
  await page.getByRole('button',{name:'Undo last apply',exact:true}).click();
  await expect(page.getByTestId('design-canvas').getByText('US$400,000',{exact:true})).toHaveCount(2);
  await expect(page.getByRole('button',{name:/Property information/})).toContainText('US$450,000');
  await page.getByRole('button',{name:'Apply listing updates',exact:true}).click();
  await page.getByRole('button',{name:'Save as Design',exact:true}).click();
  await expect.poll(()=>state.document.canvasData.v3Listing.applied.property.amount).toBe('450000');
  await page.reload();
  await expect(page.getByTestId('design-canvas').getByText('US$450,000',{exact:true})).toHaveCount(2);
});

// Contract: Use this template saves a distinct design and leaves the original source intact.
test('using a saved Template creates a separate Design through the V3 UI',async({page})=>{
  const state=await setup(page);
  await page.getByRole('button',{name:'Save as Template',exact:true}).click();
  await expect.poll(()=>state.templates.length).toBe(1);
  await page.getByRole('button',{name:/Oak design/}).click();
  await page.getByRole('button',{name:'Replace canvas',exact:true}).click();
  await expect(page).not.toHaveURL(new RegExp(`designId=${id}$`));
  await expect(page.getByTestId('design-canvas').getByText('10 Oak Road',{exact:true})).toBeVisible();
  expect(state.document.id).not.toBe(id);
  expect(state.templates[0].canvasData.elements.find((element:any)=>element.id==='address').content).toBe('[Address]');
});

// Contract: a reusable template cannot contain linked facts or a source association.
test('Save as Template strips listing facts and export requires human review',async({page})=>{
  const state=await setup(page);
  await page.getByRole('button',{name:'Save as Template',exact:true}).click();
  await expect.poll(()=>state.templates.length).toBe(1);
  expect(state.templates[0].canvasData.v3Listing).toBeUndefined();
  expect(state.templates[0].canvasData.elements.find((e:any)=>e.id==='address').content).toBe('[Address]');
  await page.getByRole('button',{name:'Export',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Review & export',exact:true});
  await expect(dialog.getByRole('button',{name:'Download PNG',exact:true})).toBeDisabled();
  await dialog.getByRole('checkbox').check();
  const download=page.waitForEvent('download');
  await dialog.getByRole('button',{name:'Download PNG',exact:true}).click();
  expect((await download).suggestedFilename()).toBe('Oak design.png');
  await expect(dialog.getByText('PNG downloaded.',{exact:true})).toBeVisible();
});

for(const theme of ['light','dark'])test(`listing controls remain reachable on mobile in ${theme}`,async({page})=>{
  await page.setViewportSize({width:375,height:812});await setup(page,theme);
  await page.getByRole('button',{name:'Listing',exact:true}).click();
  await expect(page.getByRole('button',{name:/Property information/})).toBeVisible();
  const box=await page.getByRole('complementary',{name:'Listing panel',exact:true}).boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(376);
  await page.screenshot({path:`.e2e-artifacts/listing-${theme}-mobile.png`});
});
