import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require=createRequire(import.meta.url);
const __dirname=fileURLToPath(new URL('.',import.meta.url));
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const {PrismaClient} = require('@prisma/client');
const bcrypt = require('bcrypt');
const {chromium} = require('@playwright/test');
const root = path.resolve(__dirname,'..');
const out = path.join(root,'.e2e-artifacts/v3-toolbar-live');
fs.mkdirSync(out,{recursive:true});
const prisma = new PrismaClient({log:[]});
const marker = 'v3-toolbar-'+randomUUID();
const email = marker+'@example.test';
const password = randomUUID();
let organization, browser, token, created;
const checks=[];
const trace=[];
const browserErrors=[];
async function request(url,method='GET',body) {
 const r=await fetch('http://127.0.0.1:3001/api/v1'+url,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
 const data=await r.json();trace.push({method,path:url,status:r.status,...(url.startsWith('/designs')&&data.id?{recordId:data.id}:{})});assert.ok(r.ok,`${method} ${url}: ${r.status}`);return data;
}
(async()=>{try {
 await request('/health');
 organization=await prisma.organization.create({data:{name:marker,users:{create:{email,password:await bcrypt.hash(password,10),name:'V3 slice test agent',emailVerified:true}}},include:{users:true}});
 const login=await request('/auth/login','POST',{email,password});token=login.token;assert.ok(token,'real login token');
 const base={x:48,y:56,width:520,height:90,rotation:0,opacity:1,locked:false,visible:true,zIndex:1};
 const canvasData={version:'1.0',canvasWidth:800,canvasHeight:600,backgroundColor:'#ffffff',zoom:1,elements:[
 {...base,id:'v3-live-text',name:'Headline',type:'text',content:'A HOME TO MAKE YOUR OWN',fontFamily:'Arial',fontSize:30,fontWeight:700,bold:true,italic:false,underline:false,strikethrough:false,color:'#18293b',align:'left',lineHeight:1.2,textTransform:'none',listStyle:'none'},
 {...base,id:'v3-live-shape',name:'Accent',type:'shape',y:220,width:260,height:160,shapeType:'rectangle',fill:'#dce6de',stroke:'#dce6de',strokeWidth:0,cornerRadius:12},
 ],listing:{property:{headline:'Listing facts stay with the design',price:'250000',address:'Live test address'},agent:{name:'Test agent',phone:'0000000000'}}};
 created=await request('/designs','POST',{name:marker,type:'design',category:'real-estate',tags:['v3-live'],canvasData});
 assert.match(created.id,/^c[a-z0-9]{24}$/);
 browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.on('pageerror',error=>browserErrors.push(error.message));
 page.on('response',response=>{const url=new URL(response.url());if(url.pathname.startsWith('/api/v1/designs/'))trace.push({source:'browser',method:response.request().method(),path:url.pathname,status:response.status()});});
 await page.addInitScript(({token,user})=>{localStorage.setItem('auth_token',token);localStorage.setItem('auth_user',JSON.stringify(user));localStorage.setItem('theme','light');},{token,user:login.user});
 await page.goto('http://127.0.0.1:5182/editor?editor=v3&designId='+created.id,{waitUntil:'domcontentloaded'});
 await page.getByRole('heading',{name:'V3 Editor',exact:true}).waitFor();
 await page.getByTestId('design-canvas').getByText('A HOME TO MAKE YOUR OWN',{exact:true}).waitFor();
 checks.push('real authenticated GET loads existing design');
 await page.getByRole('button',{name:'Text',exact:true}).click();
 await page.locator('[data-element-id="v3-live-text"]').click();
 await page.getByRole('textbox',{name:'Text content',exact:true}).fill('A FRESH START, BEAUTIFULLY CONNECTED');
 await page.getByRole('textbox',{name:'Text content',exact:true}).press('Tab');
 await page.getByRole('button',{name:'Undo',exact:true}).click();
 await page.getByTestId('design-canvas').getByText('A HOME TO MAKE YOUR OWN',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Redo',exact:true}).click();
 await page.getByTestId('design-canvas').getByText('A FRESH START, BEAUTIFULLY CONNECTED',{exact:true}).waitFor();
 checks.push('Text panel blur commit, Undo and Redo use existing canvas history');
 await page.getByRole('button',{name:'Tools',exact:true}).click();
 await page.getByRole('button',{name:'Line',exact:true}).click();
 await page.getByRole('button',{name:'Curved line',exact:true}).click();
 const bounds=await page.getByTestId('design-canvas').boundingBox();
 await page.mouse.move(bounds.x+bounds.width*.3,bounds.y+bounds.height*.78);await page.mouse.down();
 await page.mouse.move(bounds.x+bounds.width*.8,bounds.y+bounds.height*.9,{steps:8});await page.mouse.up();
 await page.getByRole('toolbar',{name:'line formatting',exact:true}).waitFor();
 await page.locator('[data-element-id="v3-live-shape"]').click();
 await page.getByRole('toolbar',{name:'shape formatting',exact:true}).getByRole('button',{name:'Border',exact:true}).click();
 await page.getByLabel('Border style',{exact:true}).selectOption('dashed');
 await page.getByLabel('Border width value',{exact:true}).fill('4');await page.getByLabel('Border width value',{exact:true}).press('Enter');await page.keyboard.press('Escape');
 await page.getByRole('toolbar',{name:'shape formatting',exact:true}).getByRole('button',{name:'Effects',exact:true}).click();
 await page.getByRole('button',{name:'Shadow',exact:true}).click();await page.keyboard.press('Escape');
 checks.push('real UI creates curved line and applies dashed border plus local shadow');

 await page.getByRole('textbox',{name:'Design title',exact:true}).fill('V3 verified design');
 const savedResponse=page.waitForResponse(r=>r.url().endsWith('/designs/'+created.id)&&r.request().method()==='PUT');
 await page.getByRole('button',{name:'Save',exact:true}).click();assert.ok((await savedResponse).ok());
 await page.getByRole('status').filter({hasText:/^Saved$/}).waitFor();
 const server=await request('/designs/'+created.id);
 assert.equal(server.name,'V3 verified design');assert.equal(server.canvasData.elements[0].content,'A FRESH START, BEAUTIFULLY CONNECTED');
 assert.equal(server.category,'real-estate');assert.deepEqual(server.tags,['v3-live']);assert.equal(server.canvasData.elements[1].id,'v3-live-shape');
 assert.equal(server.canvasData.listing.property.address,'Live test address');
 const stored=await prisma.infographic.findUnique({where:{id:created.id}});assert.ok(stored,'database row retained');
 assert.equal(stored.propertyData.canvasDesign.canvasData.elements[0].content,'A FRESH START, BEAUTIFULLY CONNECTED');
 assert.equal(server.canvasData.elements.find(el=>el.type==='line').lineType,'curved');
 assert.equal(stored.propertyData.canvasDesign.canvasData.elements.find(el=>el.type==='line').lineType,'curved');
 assert.equal(server.canvasData.elements[1].strokeStyle,'dashed');assert.equal(server.canvasData.elements[1].strokeWidth,4);assert.equal(server.canvasData.elements[1].shadow.blur,12);
 checks.push('real PUT, independent GET and DB assertion persist line geometry and styled shape under same ID');
 await page.reload({waitUntil:'domcontentloaded'});await page.getByTestId('design-canvas').getByText('A FRESH START, BEAUTIFULLY CONNECTED',{exact:true}).waitFor();
 assert.equal(await page.getByRole('textbox',{name:'Design title',exact:true}).inputValue(),'V3 verified design');
 assert.ok(page.url().includes('editor=v3'));await page.locator('[data-element-type="line"]').waitFor();
 checks.push('full reload restores acknowledged text, line and styled-shape server design');
 await page.screenshot({path:path.join(out,'v3-live-light.png'),fullPage:true});
 const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'Export',exact:true}).click();const download=await downloading;
 const png=path.join(out,'v3-live-export.png');await download.saveAs(png);
 const buffer=fs.readFileSync(png);assert.equal(buffer.readUInt32BE(16),1600);assert.equal(buffer.readUInt32BE(20),1200);
 checks.push('existing exporter downloads a valid 1600x1200 PNG from 800x600 design');
 await page.getByRole('button',{name:'Canvas settings',exact:true}).click();
 await page.getByRole('button',{name:'Toggle theme',exact:true}).click();
 await page.getByRole('button',{name:'Canvas settings',exact:true}).click();
 await page.evaluate(async()=>{await Promise.all(document.getAnimations().map(animation=>animation.finished.catch(()=>{})));});
 await page.screenshot({path:path.join(out,'v3-live-dark.png'),fullPage:true});
 checks.push('light/dark screenshots captured for visual review');
 assert.deepEqual(browserErrors,[],'no uncaught browser exceptions');
 const proof={outcome:'PASS',command:'node --env-file=../../.env scripts/v3-toolbar-smoke.mjs',recordId:created.id,checks,trace,browserErrors};
 console.log(JSON.stringify({...proof,artifacts:out}));
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(proof,null,2));
} catch(error){console.error(error.stack);process.exitCode=1;fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({outcome:'FAIL',checks,error:error.message},null,2));}
finally {
 if(browser)await browser.close();
 if(organization){
  const owned=await prisma.organization.findUnique({where:{id:organization.id},include:{users:true}});
  assert.ok(owned&&owned.name===marker&&owned.users.length===1&&owned.users[0].email===email,'cleanup owns exactly the disposable organization');
  await prisma.user.delete({where:{id:owned.users[0].id}});
  await prisma.organization.delete({where:{id:organization.id}});
  assert.equal(await prisma.organization.count({where:{id:organization.id}}),0);
  console.log('Disposable account, organization and test design cleanup PASS');
 }
 await prisma.$disconnect();
}})();
