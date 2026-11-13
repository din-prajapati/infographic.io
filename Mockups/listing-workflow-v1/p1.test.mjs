import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {JSDOM,VirtualConsole} from 'jsdom';
import sharp from 'sharp';
const root=new URL('./',import.meta.url);
const scripts=await Promise.all(['editor.js','refinement.js','p1-core.js','p1-model.js','p1.js'].map(f=>fs.readFile(new URL(f,root),'utf8')));
const html=(await fs.readFile(new URL('editor.html',root),'utf8')).replace(/<script[^>]*><\/script>/g,'');
function setup(t,stored){
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(html,{url:'http://127.0.0.1:5194/editor.html',runScripts:'outside-only',virtualConsole:vc});
  dom.window.structuredClone=structuredClone;
  if(stored)dom.window.localStorage.setItem('v3-listing-sidebar-v2',stored);
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  dom.window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new dom.window.Event('close'));};
  dom.window.fetch=async src=>{const file=await fs.readFile(new URL(src,root));return {ok:true,blob:async()=>new dom.window.Blob([file],{type:String(src).endsWith('.png')?'image/png':'image/jpeg'})};};
  const context=dom.getInternalVMContext();vm.runInContext(scripts.join('\n'),context);
  t.after(()=>{dom.window.close();assert.deepEqual(errors,[],'No script runtime errors');});
  const run=code=>vm.runInContext(code,context),read=code=>JSON.parse(run('JSON.stringify('+code+')'));
  const q=s=>dom.window.document.querySelector(s);
  const click=s=>{const node=q(s);assert.ok(node,'Missing '+s);node.click();};
  const change=(s,value)=>{q(s).value=value;q(s).dispatchEvent(new dom.window.Event('change',{bubbles:true}));};
  const submit=s=>q(s).dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  const ready=()=>run("stageListing(lookupSample('SAMPLE-101','IN'));useTemplate(0)");
  return {dom,run,read,q,click,change,submit,ready};
}
test('pricing and linked SVG render without initial script errors',t=>{
  const e=setup(t);assert.equal(e.q('.paper svg').getAttribute('viewBox'),'0 0 1080 1440');assert.equal(e.dom.window.document.querySelectorAll('.paper svg [data-select]').length,10);assert.equal(e.run('state.applied.record.property.amount'),12500000);assert.equal(e.q('#review').textContent,'Review & export');
});
test('sale/rent intent clears the previous price, period edits preserve the rent amount',t=>{
  const e=setup(t);e.ready();e.run("startEdit('property')");e.change('#property-form [name=transaction]','rent');assert.equal(e.run('draft.property.amount'),null);assert.equal(e.q('#property-form [name=price]').value,'');
  e.q('#property-form [name=price]').value='₹50,000';e.q('#property-form [name=price]').dispatchEvent(new e.dom.window.Event('input',{bubbles:true}));e.change('#property-form [name=rentalPeriod]','week');assert.equal(e.run('draft.property.amount'),50000);assert.equal(e.q('#property-form [name=price]').value,'₹ 50,000 / week');
  e.submit('#property-form');assert.equal(e.run('state.pending.property.transaction'),'rent');assert.equal(e.run('state.applied.record.property.transaction'),'sale');e.click('#apply-design');assert.equal(e.run('state.applied.record.property.amount'),50000);assert.match(e.q('.paper svg').textContent,/FOR RENT/);
});
test('invalid price is rejected without changing pending or applied records',t=>{
  const e=setup(t);e.ready();e.run("startEdit('property')");const before=e.read('state.pending.property');e.q('#property-form [name=price]').value='12,,400 apples';e.submit('#property-form');assert.deepEqual(e.read('state.pending.property'),before);assert.match(e.q('.panel-scroll [role=alert]').textContent,/valid price/);
});
test('ambiguous prices require an explicit candidate, preserving source evidence',t=>{
  const e=setup(t);e.ready();e.run("startReviewedImport('Previous asking ₹4.5 Cr; new asking ₹4.2 Cr. Address: Bandra West')");assert.equal(e.run('p1Import.result.candidates.find(c=>c.key==="price").status'),'ambiguous');assert.equal(e.run('p1Import.selected.has("price")'),false);
  e.q('[name=p1-fact][value=price]').checked=true;e.q('[name=p1-fact][value=price]').dispatchEvent(new e.dom.window.Event('change',{bubbles:true}));assert.equal(e.q('#p1-accept').disabled,true);e.change('[data-candidate-choice=price]','1');assert.equal(e.q('#p1-accept').disabled,false);e.submit('#p1-import-form');assert.equal(e.run('state.pending.property.amount'),42000000);assert.equal(e.run('state.applied.record.property.amount'),12500000);assert.match(e.run('state.pending.meta.imports.at(-1).source'),/Previous asking/);
});
test('multiple properties are blocked; currency-less imports retain the existing currency',t=>{
  const e=setup(t);e.ready();e.run("startReviewedImport('Listing 1: 2 BHK, ₹80 Lakh. Listing 2: 3 BHK, ₹1 Cr')");assert.equal(e.q('#p1-accept').disabled,true);assert.equal(e.run('p1Import.result.blocked'),true);
  e.run("state.pending.property=P1.updateProperty(state.pending.property,'currency','$');startReviewedImport('Asking price: 950000')");e.run("p1Import.selected=new Set(['price']);p1Import.choices.price='0';acceptReviewedFacts()");assert.equal(e.run('state.pending.property.currency'),'$');assert.equal(e.run('state.pending.property.amount'),950000);
});
test('reviewed Address preserves the supplied city; imported agent text never replaces identity',t=>{
  const e=setup(t);e.run('startReviewedImport('+JSON.stringify('3 BHK, 80 Lakh\nAddress: Satellite Road, Ahmedabad\nAgent: Unverified Caller 9000012345')+')');e.run("p1Import.selected=new Set(['location','price']);acceptReviewedFacts()");assert.equal(e.run('state.pending.property.address'),'Satellite Road, Ahmedabad');assert.equal(e.run('state.pending.agent.name'),'Arjun Shah');assert.match(e.run('state.pending.suggestions'),/Unverified Caller/);
});
test('source review rejects affected fields changed after extraction',t=>{
  const e=setup(t);e.ready();e.run("startReviewedImport('Price: ₹80 Lakh');p1Import.selected=new Set(['price']);state.pending.property=P1.updateProperty(state.pending.property,'price','₹90 Lakh')");assert.throws(()=>e.run('acceptReviewedFacts()'),/changed after extraction/);assert.equal(e.run('state.pending.property.amount'),9000000);
});
test('linked text editing stages a canonical field and Apply updates every linked instance',t=>{
  const e=setup(t);e.ready();e.run("state.bindings.headline.slot='property.price';selected='price';render();openLinkedEditor()");e.q('#p1-linked-form [name=price]').value='₹85 Lakh';e.submit('#p1-linked-form');assert.equal(e.run('state.pending.property.amount'),8500000);assert.equal(e.run('state.applied.record.property.amount'),12500000);e.click('#apply-design');assert.equal(e.run('displayed("price")'),'₹ 85 Lakh');assert.equal(e.run('displayed("headline")'),'₹ 85 Lakh');
});
test('combined specifications are edited as components rather than parsed text',t=>{
  const e=setup(t);e.ready();e.run("selected='specs';openLinkedEditor()");assert.equal(e.q('#p1-linked-form [name=fieldValue]'),null);e.q('#p1-linked-form [name=beds]').value='4';e.q('#p1-linked-form [name=area]').value='220';e.q('#p1-linked-form [name=areaUnit]').value='sq m';e.submit('#p1-linked-form');e.click('#apply-design');assert.match(e.run('displayed("specs")'),/4 BEDS.*220 sq m/);
});

test('linked price editor clears an old sale amount when switched to rent',t=>{
  const e=setup(t);e.ready();e.run("selected='price';openLinkedEditor()");e.change('#p1-linked-form [name=transaction]','rent');assert.equal(e.q('#p1-linked-form [name=price]').value,'');e.q('#p1-linked-form [name=price]').value='₹25,000';e.submit('#p1-linked-form');assert.equal(e.run('state.pending.property.amount'),25000);assert.equal(e.run('state.pending.property.transaction'),'rent');assert.equal(e.run('state.applied.record.property.transaction'),'sale');
});

test('save/reload/reopen retains structured rent and independent design text',t=>{
  const e=setup(t);e.ready();e.run("state.pending.property=P1.updateProperty(state.pending.property,'transaction','rent');state.pending.property=P1.updateProperty(state.pending.property,'price','₹50,000');state.pending.property=P1.updateProperty(state.pending.property,'rentalPeriod','week');render()");e.click('#apply-design');e.run("selected='headline';detachText();state.overrides.headline.value='Private viewing';saveDesignRecord('Weekly rental')");
  const stored=e.dom.window.localStorage.getItem('v3-listing-sidebar-v2');const reopened=setup(t,stored);reopened.run('openDesign(0)');assert.equal(reopened.run('state.applied.record.property.amount'),50000);assert.equal(reopened.run('state.applied.record.property.rentalPeriod'),'week');assert.equal(reopened.run('state.applied.record.property.currency'),'₹');assert.equal(reopened.run('displayed("headline")'),'Private viewing');assert.equal(reopened.run('state.overrides.headline.detached'),true);assert.match(reopened.run('displayed("price")'),/week/);
});
test('detach, independent editing and reconnect preserve canonical facts',t=>{
  const e=setup(t);e.ready();e.run("selected='headline';detachText();openLinkedEditor()");e.q('#p1-linked-form [name=fieldValue]').value='Open House This Sunday';e.submit('#p1-linked-form');assert.equal(e.run('displayed("headline")'),'Open House This Sunday');assert.equal(e.run('state.pending.property.headline'),'A little closer to your dream.');e.run("state.pending.property.headline='A changed Listing headline';render()");e.click('#apply-design');assert.equal(e.run('displayed("headline")'),'Open House This Sunday');e.run('reconnectText()');assert.equal(e.run('displayed("headline")'),'A changed Listing headline');
});
test('export blocks stale values, placeholders, missing facts and invalid custom prices',t=>{
  const e=setup(t);e.ready();assert.deepEqual(e.read('P1.issues(state).errors'),[]);e.run("state.pending.property=P1.updateProperty(state.pending.property,'price','₹95 Lakh')");assert.match(e.run('P1.issues(state).errors.join(" ")'),/pending|Pending/);e.click('#apply-design');assert.deepEqual(e.read('P1.issues(state).errors'),[]);
  e.run("state.overrides.headline={value:'[Headline]'};state.overrides.price={value:'SPECIAL PRICE'}");assert.match(e.run('P1.issues(state).errors.join(" ")'),/placeholder/);assert.match(e.run('P1.issues(state).errors.join(" ")'),/custom price/);
});
test('export requires human review and validates again before approval',t=>{
  const e=setup(t);e.ready();e.run('review()');assert.equal(e.q('#p1-download-svg').disabled,true);e.q('#p1-review-confirm').checked=true;e.q('#p1-review-confirm').dispatchEvent(new e.dom.window.Event('change',{bubbles:true}));assert.equal(e.q('#p1-download-svg').disabled,false);e.click('#approve');assert.equal(e.run('state.approved'),true);
});
test('SVG download embeds images and uses the same artwork as the canvas',async t=>{
  const e=setup(t);e.ready();e.run('review()');e.q('#p1-review-confirm').checked=true;e.run('globalThis.captured=[];downloadBlob=(blob,name)=>captured.push({blob,name})');await e.run('downloadArtwork("svg")');assert.equal(e.run('captured.length'),1);assert.match(e.run('captured[0].name'),/\.svg$/);
  const text=await new Promise((resolve,reject)=>{const reader=new e.dom.window.FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsText(e.run('captured[0].blob'));});
  const parsed=new JSDOM(text,{contentType:'image/svg+xml'});t.after(()=>parsed.window.close());assert.equal(parsed.window.document.querySelector('svg').getAttribute('width'),'1080');assert.equal(parsed.window.document.querySelectorAll('image').length,3);for(const image of parsed.window.document.querySelectorAll('image'))assert.match(image.getAttribute('href'),/^data:image/);assert.match(parsed.window.document.documentElement.textContent,/1\.25 Cr/);assert.equal(parsed.window.document.querySelector('[data-select]'),null);
});
test('a change during image embedding prevents a stale download',async t=>{
  const e=setup(t);e.ready();e.run('review()');e.q('#p1-review-confirm').checked=true;e.run("globalThis.captured=[];downloadBlob=()=>captured.push('download');embeddedImages=async()=>{state.pending.property=P1.updateProperty(state.pending.property,'price','₹70 Lakh');return {}};");await e.run('downloadArtwork("svg")');assert.equal(e.run('captured.length'),0);assert.match(e.q('#p1-export-error').textContent,/changed during export/);
});
test('shared vector is a real 1080×1440 PNG input; write sample verification artifacts',async t=>{
  const e=setup(t);e.ready();const images={};for(const id of ['hero','portrait']){const relative=e.run(`displayed('${id}')`),bytes=await fs.readFile(new URL(relative,root));images[id]=`data:image/${relative.endsWith('.png')?'png':'jpeg'};base64,${bytes.toString('base64')}`;}images.brand=e.run('displayed("brand")');
  const svg=e.run('P1.svg(p1Snapshot(),{images:'+JSON.stringify(images)+'})');const png=await sharp(Buffer.from(svg)).png().toBuffer();const meta=await sharp(png).metadata();assert.equal(meta.width,1080);assert.equal(meta.height,1440);assert.equal(meta.format,'png');await fs.mkdir(new URL('verification/',root),{recursive:true});await fs.writeFile(new URL('verification/p1-sample.svg',root),svg);await fs.writeFile(new URL('verification/p1-sample.png',root),png);
});
