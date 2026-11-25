/** Real API/Prisma/browser round-trip audit. No HTTP mocks or canvas-store injection.
 * Creates only uniquely marked disposable account/design fixtures, then removes them.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { chromium, expect } = require('@playwright/test');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, '.e2e-artifacts/v3-listing-persistence-live-2026-11-13');
fs.mkdirSync(out, { recursive: true });
const origin = process.env.V3_SMOKE_ORIGIN || 'http://127.0.0.1:5000';
const prisma = new PrismaClient({ log: [] });
const marker = `v3-listing-${randomUUID()}`;
const email = `${marker}@example.test`, password = randomUUID();
const result = { outcome: 'RUNNING', origin, checks: [], trace: [], comparisons: [], browserErrors: [] };
let organization, browser, login;
const contexts = [];
async function api(route, method = 'GET', body) {
  const response = await fetch(`${origin}/api/v1${route}`, {
    method, headers: { 'Content-Type': 'application/json', ...(login ? { Authorization: `Bearer ${login.token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(60000),
  });
  result.trace.push({ source: 'independent-http', method, path: route, status: response.status });
  if(!response.ok) {const failure=await response.json().catch(()=>({}));throw new Error(`${method} ${route}: ${response.status} ${JSON.stringify(failure.message??'')}`);}
  return response.json();
}
async function pageFor(theme = 'light') {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  contexts.push(context);
  await context.addInitScript(({ token, user, theme }) => {
    localStorage.setItem('auth_token', token); localStorage.setItem('auth_user', JSON.stringify(user));
    localStorage.setItem('theme', theme);
  }, { token: login.token, user: login.user, theme });
  const page = await context.newPage();
  page.on('pageerror', error => result.browserErrors.push(error.message));
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.pathname.startsWith('/api/v1/designs')) result.trace.push({ source: 'real-browser', method: response.request().method(), path: url.pathname, status: response.status() });
  });
  return page;
}
async function ready(page) {
  await expect(page.getByRole('textbox', { name: 'Design title', exact: true })).toBeEnabled({ timeout: 60000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
  });
}
async function capture(page) {
  // Read-only audit of the exact serializer used by the real save path.
  return page.evaluate(async () => JSON.parse(JSON.stringify((await import('/src/lib/canvasState.ts')).captureCanvasData())));
}
function artwork(data) {
  const { timestamp, zoom, ...document } = data; return document;
}
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
async function dbDocument(id) {
  const record = await prisma.infographic.findUnique({ where: { id } });
  assert.ok(record && record.userId === organization.users[0].id && record.organizationId === organization.id);
  assert.equal(record.aiModel, 'canvas-editor');
  return record.propertyData.canvasDesign;
}
async function save(page, method, suffix) {
  const response = page.waitForResponse(r => new URL(r.url()).pathname === `/api/v1/designs${suffix || ''}` && r.request().method() === method, { timeout: 60000 });
  await page.getByRole('button', { name: /^(Save|Save as Design)$/ }).click();
  const acknowledged = await response; assert.ok(acknowledged.ok(), `browser ${method} save acknowledged`);
  const data = await acknowledged.json();
  await expect(page.getByRole('status').filter({ hasText: /^Saved$/ })).toBeVisible({ timeout: 60000 });
  return data;
}
async function pixels(page, before, after, label) {
  const comparison = await page.evaluate(async ({ a, b }) => {
    async function decode(src) {
      const image = new Image(); image.src = `data:image/png;base64,${src}`; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
      return { width: image.width, height: image.height, data: context.getImageData(0, 0, image.width, image.height).data };
    }
    const [first, second] = await Promise.all([decode(a), decode(b)]);
    if (first.width !== second.width || first.height !== second.height) return { sameDimensions: false, before: [first.width, first.height], after: [second.width, second.height] };
    let differentPixels = 0;
    for (let i = 0; i < first.data.length; i += 4) {
      if (first.data[i] !== second.data[i] || first.data[i + 1] !== second.data[i + 1] || first.data[i + 2] !== second.data[i + 2] || first.data[i + 3] !== second.data[i + 3]) differentPixels++;
    }
    return { sameDimensions: true, width: first.width, height: first.height, differentPixels, totalPixels: first.width * first.height };
  }, { a: before.toString('base64'), b: after.toString('base64') });
  result.comparisons.push({ label, ...comparison });
  assert.equal(comparison.sameDimensions, true, `${label}: dimensions`);
  assert.equal(comparison.differentPixels, 0, `${label}: exact RGBA equality`);
}
async function snapshots(page, label) {
  await ready(page);
  const downloadEvent = page.waitForEvent('download', { timeout: 60000 });
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const review = page.getByRole('dialog');
  if (await review.isVisible()) { await page.getByRole('checkbox', {name:'I reviewed this design, its facts and photos.'}).check(); await page.getByRole('button', {name:'Download PNG',exact:true}).click(); await page.getByRole('button', {name:'Back to design',exact:true}).click(); }
  const download = await downloadEvent, exportPath = path.join(out, `${label}-export.png`);
  await download.saveAs(exportPath);
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByTestId('design-canvas')).toHaveAttribute('data-preview', 'true');
  await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
  // Auto-fit is scheduled on preview transition. Wait for the artboard bounds to settle.
  let previous = '', stable = 0;
  for (let i = 0; i < 30 && stable < 3; i++) {
    const current = JSON.stringify(await page.getByTestId('design-canvas').boundingBox());
    stable = current === previous ? stable + 1 : 0; previous = current; await page.waitForTimeout(100);
  }
  const screenshot = await page.getByTestId('design-canvas').screenshot({ path: path.join(out, `${label}-editor.png`), animations: 'disabled', caret: 'hide' });
  await page.getByRole('button', { name: 'Exit preview', exact: true }).click();
  return { screenshot, exported: fs.readFileSync(exportPath) };
}
async function verifyRoundTrip(page, id, label) {
  const before = artwork(await capture(page));
  const fetched = await api(`/designs/${id}`), stored = await dbDocument(id);
  assert.deepEqual(artwork(fetched.canvasData), before, `${label}: independent HTTP document`);
  assert.deepEqual(artwork(stored.canvasData), before, `${label}: Prisma DB document`);
  assert.equal(stored.name, await page.getByRole('textbox', { name: 'Design title', exact: true }).inputValue());
  const first = await snapshots(page, `${label}-before`);
  const fresh = await pageFor();
  const response = fresh.waitForResponse(r => new URL(r.url()).pathname === `/api/v1/designs/${id}` && r.request().method() === 'GET');
  await fresh.goto(`${origin}/editor?editor=v3&designId=${id}`, { waitUntil: 'domcontentloaded' });
  assert.equal((await response).status(), 200); await ready(fresh);
  assert.deepEqual(artwork(await capture(fresh)), before, `${label}: fresh-context restored document`);
  const second = await snapshots(fresh, `${label}-reopened`);
  await pixels(fresh, first.screenshot, second.screenshot, `${label}: editor artboard before/reopened`);
  await pixels(fresh, first.exported, second.exported, `${label}: PNG export before/reopened`);
  result.checks.push({ label, id, artworkSha256: digest(before), exactDatabaseAndApiDocument: true, freshContextNoDraftOrQueryCache: true });
  return fresh;
}

const fixtureOrganizations = [];
function listing(name, address, amount, country = 'IN', currency = 'INR') {
  return { property: { name, headline: `${name} home`, address, description: 'Live persistence audit', type: 'residential', country, currency, amount, transaction: 'sale', rentalPeriod: 'month', beds: '3', baths: '2', area: '1200', areaUnit: 'sq ft', status: 'For sale', features: ['Balcony'] }, agent: { name: 'Audit Agent', phone: '+91 9000000000', email: 'audit@example.test', agency: 'Test Realty', license: 'AUDIT', photo: '' }, brand: { name: 'Audit Realty', logo: '', tagline: 'Call us', accent: '#123E62' }, photos: [] };
}
function documentFor(record, savedProperty, image) {
  const common = { rotation: 0, opacity: 1, locked: false, visible: true };
  const text = (id, slot, content, y) => ({ ...common, id, name: id, type: 'text', slot, binding: { kind: 'field', slot }, x: 40, y, width: 700, height: 55, zIndex: y, content, fontFamily: 'Arial', fontSize: 24, fontWeight: 400, bold: false, italic: false, underline: false, strikethrough: false, color: '#123E62', align: 'left', lineHeight: 1.2, letterSpacing: 0, textAnchor: 'middle', textTransform: 'none', listStyle: 'none' });
  const elements = [text('headline','property.headline','CUSTOM HEADLINE PROTECTED',30), text('address','property.location',record.property.address,90), text('price','property.price', record.property.currency === 'INR' ? '₹12.5 Lakh' : 'US$650,000',150), text('agent','agent.name',record.agent.name,210), text('contact','agent.phone',record.agent.phone,270), { ...common, id:'manual-photo', name:'Manual photo', type:'image', slot:'property.heroImage', binding:{kind:'image',slot:'property.heroImage'}, x:40,y:340,width:300,height:180,zIndex:1,src:image,objectFit:'cover',crop:{x:20,y:10,width:250,height:140},cornerRadius:12,flipHorizontal:false,flipVertical:false,colorOverlay:null,filters:{brightness:100,contrast:100,saturation:100} }];
  const bindings = Object.fromEntries(elements.map(element => [element.id,{slot:element.slot}]));
  return { version:'1.0',canvasWidth:800,canvasHeight:600,backgroundColor:'#F2F6FA',backgroundPaint:{type:'solid',color:'#F2F6FA',opacity:1},zoom:1,elements,
    v3Listing:{version:1,pending:structuredClone(record),applied:structuredClone(record),bindings,appliedBindings:structuredClone(bindings),overrides:{headline:'CUSTOM HEADLINE PROTECTED','manual-photo':image},detached:[],skipped:[],selectedListingId:savedProperty.id,selectedListingVersion:savedProperty.version,appliedListingId:savedProperty.id} };
}
async function statusApi(route, method, body, token) {
  const response = await fetch(`${origin}/api/v1${route}`, {method,headers:{'Content-Type':'application/json',...(token ? {Authorization:`Bearer ${token}`} : {})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000)});
  return response.status;
}
try {
  await api('/health');
  organization = await prisma.organization.create({data:{name:marker,users:{create:{email,password:await bcrypt.hash(password,10),name:'Disposable listing audit',emailVerified:true}}},include:{users:true}});
  fixtureOrganizations.push(organization);
  login = await api('/auth/login','POST',{email,password});
  const otherEmail = `${marker}-other@example.test`;
  const other = await prisma.organization.create({data:{name:`${marker}-other`,users:{create:{email:otherEmail,password:await bcrypt.hash(password,10),name:'Disposable other org',emailVerified:true}}},include:{users:true}});
  fixtureOrganizations.push(other);
  const otherLogin = await api('/auth/login','POST',{email:otherEmail,password});
  const a = listing('Listing A','14 Verification Lane','1250000');
  const b = listing('Listing B','28 Independent Road','650000','US','USD');
  const propertyA = await api('/properties','POST',{record:a});
  const propertyB = await api('/properties','POST',{record:b});
  assert.equal(await statusApi(`/properties/${propertyA.id}`,'GET',null,otherLogin.token),404);
  assert.equal(await statusApi(`/properties/${propertyA.id}`,'PUT',{record:b,expectedVersion:1},otherLogin.token),404);
  assert.equal(await statusApi('/properties','GET',null,null),401);
  const savedA = await api(`/properties/${propertyA.id}`,'PUT',{record:a,expectedVersion:1});
  assert.equal(savedA.version,2);
  assert.equal(await statusApi(`/properties/${propertyA.id}`,'PUT',{record:b,expectedVersion:1},login.token),409);
  const profile = await api('/listing-profiles','PUT',{record:{agent:a.agent,brand:a.brand},expectedVersion:0});
  assert.equal(profile.version,1);
  assert.equal(await statusApi('/listing-profiles','PUT',{record:{agent:b.agent,brand:b.brand},expectedVersion:0},login.token),409);
  const isolated = await fetch(`${origin}/api/v1/listing-profiles`,{headers:{Authorization:`Bearer ${otherLogin.token}`}}).then(response=>response.json());
  assert.equal(isolated.version,0); assert.equal(isolated.record.agent.name,'');
  result.checks.push('Real JWT property/profile persistence; cross-organization GET/PUT404; unauth401; property/profile optimistic409; personal profile isolation');
  browser = await chromium.launch({channel:'chrome',headless:true});
  const page = await pageFor();
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  const image = await page.evaluate(() => {const canvas=document.createElement('canvas');canvas.width=300;canvas.height=180;const context=canvas.getContext('2d');context.fillStyle='#14B8A6';context.fillRect(0,0,300,180);context.fillStyle='#123E62';context.fillRect(40,30,180,100);return canvas.toDataURL('image/png');});
  a.photos=[{id:'manual',name:'Manually chosen property photo',src:image}];
  const docA=documentFor(a,savedA,image),docB=documentFor(b,propertyB,image);
  // Keep one pending fact deliberately different from both artwork and the Property catalogue.
  docA.v3Listing.pending.property.description='Pending unrendered fact survives independently';
  const template={...structuredClone(docA),elements:docA.elements.map(element=>element.type==='text'?{...element,content:`[${element.name}]`}:{...element,src:''}),v3Template:{version:1,bindings:docA.v3Listing.bindings}};
  delete template.v3Listing;
  const templateSaved=await api('/canvas-templates','POST',{name:`${marker}-reusable`,type:'template',canvasData:template,tags:['listing-audit'],thumbnail:''});
  const designA=await api('/designs','POST',{name:`${marker}-design-a`,type:'design',canvasData:docA,thumbnail:''});
  const designB=await api('/designs','POST',{name:`${marker}-design-b`,type:'design',canvasData:docB,thumbnail:''});
  assert.notEqual(designA.id,designB.id); assert.notEqual(templateSaved.id,designA.id);
  await page.goto(`${origin}/editor?editor=v3&designId=${designA.id}`,{waitUntil:'domcontentloaded'}); await ready(page);
  const first=await capture(page);
  assert.equal(first.v3Listing.pending.property.description,'Pending unrendered fact survives independently');
  assert.equal(first.v3Listing.applied.property.description,'Live persistence audit');
  assert.equal(first.elements.find(element=>element.id==='headline').content,'CUSTOM HEADLINE PROTECTED');
  assert.deepEqual(first.elements.find(element=>element.id==='manual-photo').crop,docA.elements.at(-1).crop);
  await page.getByRole('textbox',{name:'Design title',exact:true}).fill(`${marker}-browser-saved-a`);
  await save(page,'PUT',`/${designA.id}`);
  const pendingSaved=await api(`/designs/${designA.id}`);
  assert.deepEqual(pendingSaved.canvasData.v3Listing,first.v3Listing);
  const pendingPage=await pageFor(); await pendingPage.goto(`${origin}/editor?editor=v3&designId=${designA.id}`,{waitUntil:'domcontentloaded'});await ready(pendingPage);
  assert.deepEqual((await capture(pendingPage)).v3Listing,first.v3Listing);
  result.checks.push('Pending/applied snapshots, manual photo crop and headline customization survive real browser save and fresh session');
  await pendingPage.getByRole('button',{name:'Apply listing updates',exact:true}).click();
  const afterApply=await capture(pendingPage);
  assert.equal(afterApply.v3Listing.applied.property.description,'Pending unrendered fact survives independently');
  assert.equal(afterApply.elements.find(element=>element.id==='headline').content,'CUSTOM HEADLINE PROTECTED');
  assert.equal(afterApply.elements.find(element=>element.id==='manual-photo').src,image);
  await save(pendingPage,'PUT',`/${designA.id}`);
  await verifyRoundTrip(pendingPage,designA.id,'listing-design-a');
  const secondPage=await pageFor();await secondPage.goto(`${origin}/editor?editor=v3&designId=${designB.id}`,{waitUntil:'domcontentloaded'});await ready(secondPage);
  await secondPage.getByRole('textbox',{name:'Design title',exact:true}).fill(`${marker}-browser-saved-b`);await save(secondPage,'PUT',`/${designB.id}`);
  await verifyRoundTrip(secondPage,designB.id,'listing-design-b');
  assert.equal((await api(`/designs/${designA.id}`)).canvasData.v3Listing.pending.property.address,a.property.address);
  assert.equal((await api(`/designs/${designB.id}`)).canvasData.v3Listing.pending.property.address,b.property.address);
  assert.deepEqual((await api(`/canvas-templates/${templateSaved.id}`)).canvasData,template);
  result.checks.push('Two independent listing designs retain respective structured prices, mappings, manual photo/layers; reusable template remains unchanged');
  assert.deepEqual(result.browserErrors,[]);
  result.outcome='PASS';
} catch(error) {result.outcome='FAIL';result.error=error.message;console.error(error.stack);process.exitCode=1;}
finally {
  for(const context of contexts) await context.close().catch(()=>{});
  if(browser) await browser.close();
  for(const fixture of fixtureOrganizations) {
    const owned=await prisma.organization.findUnique({where:{id:fixture.id},include:{users:true}});
    assert.ok(owned?.name.startsWith(marker)&&owned.users.length===1&&owned.users[0].email.startsWith(marker),'cleanup only owned disposable fixtures');
    await prisma.user.delete({where:{id:owned.users[0].id}});
    await prisma.organization.delete({where:{id:owned.id}});
  }
  result.cleanup='Only uniquely marked disposable organizations/users and their cascading designs/properties/profiles removed';
  await prisma.$disconnect();result.finishedAt=new Date().toISOString();
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}

