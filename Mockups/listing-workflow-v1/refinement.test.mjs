import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const source=fs.readFileSync(new URL('./editor.js',import.meta.url),'utf8')+'\n'+fs.readFileSync(new URL('./refinement.js',import.meta.url),'utf8');
function environment(){
  const handlers=[],storage=new Map(),nodes=new Map();
  for(const id of ['#app','#notice','#asset-dialog','#pack-dialog','#review-dialog','#workflow-dialog','#save-dialog'])nodes.set(id,{innerHTML:'',textContent:'',dataset:{},classList:{add(){},remove(){}},addEventListener(){},showModal(){},close(){},focus(){}});
  nodes.set('.panel-scroll',{scrollTop:0});
  const document={querySelector:s=>nodes.get(s)||null,addEventListener:(type,fn,capture)=>handlers.push({type,fn,capture})};
  const context=vm.createContext({document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},structuredClone,crypto,setTimeout:()=>0,clearTimeout(){},console});
  vm.runInContext(source,context);
  return {run:code=>vm.runInContext(code,context),read:code=>JSON.parse(vm.runInContext('JSON.stringify('+code+')',context)),nodes,storage,
    click(id){const b={id,dataset:{},hasAttribute:()=>false,closest:()=>null};handlers.find(h=>h.type==='click'&&!h.capture).fn({target:{closest:()=>b}});}};
}
test('search creates a result without replacing the pending Listing or artwork',()=>{
  const e=environment();assert.equal(e.run('state.pending'),null);
  e.run("lookupResult=lookupSample('SAMPLE-102','IN')");
  assert.equal(e.run('lookupResult.property.price'),'₹92 Lakh');assert.equal(e.run('state.pending'),null);assert.equal(e.run('displayed("price")'),'₹1.25 Cr');
  e.run('stageListing(lookupResult)');assert.equal(e.run('state.pending.property.price'),'₹92 Lakh');assert.equal(e.run('displayed("price")'),'₹1.25 Cr');
});
test('Apply updates linked price, skips missing photos, and Undo restores prior artwork',()=>{
  const e=environment();e.run("stageListing(lookupSample('SAMPLE-102','IN'))");
  assert.match(e.run('changes().skips.join(" ")'),/Main photograph/);e.click('apply-design');
  assert.equal(e.run('displayed("price")'),'₹92 Lakh');assert.equal(e.run('displayed("hero")'),'assets/ai-villa-sunset.png');
  e.click('undo-apply');assert.equal(e.run('displayed("price")'),'₹1.25 Cr');assert.equal(e.run('state.pending.property.price'),'₹92 Lakh');
});
test('one saved Template produces two separate Designs from different Listings',()=>{
  const e=environment();e.run("state.bindings.headline.slot='property.location';saveTemplateRecord('Reusable listing flyer')");
  const template=e.read('state.savedTemplates.at(-1)');assert.equal(template.bindings.headline.slot,'property.location');assert.equal('applied' in template,false);assert.equal('record' in template,false);assert.deepEqual(template.staticValues,{});
  e.run("stageListing(lookupSample('SAMPLE-101','IN'));useTemplate(state.savedTemplates.length-1);saveDesignRecord('Villa design')");
  e.run("stageListing(lookupSample('SAMPLE-102','IN'));useTemplate(state.savedTemplates.length-1);saveDesignRecord('Residence design')");
  const designs=e.read('state.savedDesigns');assert.equal(designs.length,2);assert.notEqual(designs[0].id,designs[1].id);assert.notEqual(designs[0].listingId,designs[1].listingId);assert.equal(designs[0].applied.values.price,'₹1.25 Cr');assert.equal(designs[1].applied.values.price,'₹92 Lakh');assert.equal(designs[1].applied.values.headline,'Satellite Road, Ahmedabad');
  e.run('openDesign(0)');assert.equal(e.run('displayed("price")'),'₹1.25 Cr');assert.equal(e.run('state.savedDesigns[1].applied.values.price'),'₹92 Lakh');
});
test('a missing image on a new Design uses an explicit placeholder, not another Listing photo',()=>{
  const e=environment();e.run("stageListing(lookupSample('SAMPLE-102','IN'));useTemplate(0)");assert.match(e.run('displayed("hero")'),/^data:image\/svg/);assert.match(decodeURIComponent(e.run('displayed("hero")')),/ADD IMAGE/);
});
test('custom values stay out of the Listing and linked Template, survive Apply and save/reopen',()=>{
  const e=environment();e.run("stageListing(lookupSample('SAMPLE-101','IN'));useTemplate(0);state.overrides.headline={value:'Open House This Sunday'};saveTemplateRecord('Reusable');saveDesignRecord('Custom flyer')");
  assert.equal(e.run('state.pending.property.headline'),'A little closer to your dream.');assert.equal(e.run('state.savedTemplates.at(-1).staticValues.headline'),undefined);
  e.run("state.pending.property.headline='Changed listing headline'");e.click('apply-design');assert.equal(e.run('displayed("headline")'),'Open House This Sunday');
  e.run('openDesign(0)');assert.equal(e.run('displayed("headline")'),'Open House This Sunday');assert.equal(e.run('state.savedDesigns[0].overrides.headline.value'),'Open House This Sunday');
});
test('photo rule is included in Save as Template without modifying current artwork',()=>{
  const e=environment();e.run("pendingPack[0]='rank2';saveTemplateRecord('Interior first')");assert.equal(e.run('state.savedTemplates.at(-1).bindings.hero.rule'),'rank2');assert.equal(e.run('displayed("hero")'),'assets/ai-villa-sunset.png');
  e.run("stageListing(lookupSample('SAMPLE-101','IN'));useTemplate(state.savedTemplates.length-1)");assert.equal(e.run('displayed("hero")'),'assets/modern-interior.jpg');
});
test('Brand and Agent editors activate the matching rail and save only pending records',()=>{
  const e=environment();e.run("stageListing(lookupSample('SAMPLE-101','IN'));startEdit('brand')");assert.equal(e.run('panel'),'Brand');e.run("draft.brand.tagline='A new signature';saveDraft()");assert.equal(e.run('state.pending.brand.tagline'),'A new signature');assert.equal(e.run('displayed("signature")'),'A better place to belong');
  e.run("startEdit('agent')");assert.equal(e.run('panel'),'Agent');e.run("draft.agent.name='Cancelled edit';back()");assert.equal(e.run('state.pending.agent.name'),'Arjun Shah');
});
test('summary has Canva-style Media and paired specs, no duplicate upload actions or mapping-save button',()=>{
  const e=environment();e.run("stageListing(lookupSample('SAMPLE-101','IN'))");const html=e.run('summaryPanel()');assert.match(html,/Media/);assert.match(html,/See all/);assert.match(html,/spec-grid/);assert.doesNotMatch(html,/Upload photos|Choose stored photos/);
  const inspector=e.run('inspector()');assert.equal(e.run('inspectorOpen'),false);assert.match(inspector,/<h2>Template Fields<\/h2>/);assert.match(inspector,/<option value="property.heroImage" selected>Property → Property hero photo<\/option>/);assert.doesNotMatch(inspector,/id="save-link"/);
  assert.match(e.nodes.get('#app').innerHTML,/Save as Template/);assert.match(e.nodes.get('#app').innerHTML,/Save as Design/);
});
test('local storage contains independently reopenable Template and Design records',()=>{
  const e=environment();e.run("stageListing(lookupSample('SAMPLE-101','IN'));useTemplate(0);saveTemplateRecord('Saved template');saveDesignRecord('Saved design')");
  const stored=JSON.parse(e.storage.get('v3-listing-sidebar-v2'));assert.equal(stored.savedTemplates.at(-1).name,'Saved template');assert.equal(stored.savedDesigns[0].name,'Saved design');assert.equal(stored.savedDesigns[0].applied.values.price,'₹1.25 Cr');assert.equal(stored.savedListings[0].id,'IN:SAMPLE-101');
});
test('intake restores the welcome layout while retaining all three source tabs',()=>{
  const e=environment(),html=e.run('sourcePanel()');assert.match(html,/<h2>Load a listing<\/h2>/);assert.match(html,/Start with the facts/);assert.match(html,/Your listing, ready to design\./);assert.match(html,/data-source="id"/);assert.match(html,/data-source="text"/);assert.match(html,/data-source="saved"/);assert.match(html,/Fictional lookup examples/);
});
test('one complete Property card contains the price, specifications and features',()=>{
  const e=environment();e.run("stageListing(lookupSample('SAMPLE-101','IN'))");const html=e.run('summaryPanel()');assert.equal((html.match(/data-edit="property"/g)||[]).length,1);assert.match(html,/aria-label="Edit property information"/);assert.match(html,/property-card-price[\s\S]*₹1\.25 Cr/);assert.match(html,/card-spec-grid[\s\S]*Bedrooms[\s\S]*Bathrooms[\s\S]*Floor area/);assert.match(html,/feature-chip">Garden/);assert.match(html,/property-status">Active sale/);
});
test('saved-property search matches address, name and listing ID without changing records',()=>{
  const e=environment();e.run("stageListing(lookupSample('SAMPLE-101','IN'));stageListing(lookupSample('SAMPLE-102','IN'))");const before=e.read('state');assert.equal(e.run("savedPropertyMatches('lake view road')[0].record.id"),'IN:SAMPLE-101');assert.equal(e.run("savedPropertyMatches('  SKYLINE residence  ')[0].record.id"),'IN:SAMPLE-102');assert.equal(e.run("savedPropertyMatches('sample-102')[0].record.id"),'IN:SAMPLE-102');assert.equal(e.run("savedPropertyMatches('no-match').length"),0);assert.equal(e.run("savedPropertyMatches('').length"),2);assert.deepEqual(e.read('state'),before);
});
test('filtered results retain the original saved-record index and show a clear empty state',()=>{
  const e=environment();e.run("stageListing(lookupSample('SAMPLE-101','IN'));stageListing(lookupSample('SAMPLE-102','IN'));savedQuery='SAMPLE-102'");const html=e.run('savedPropertiesPanel()');assert.match(html,/data-saved-listing="1"/);assert.match(html,/1 of 2 properties/);assert.match(html,/aria-label="Search saved properties"/);e.run("savedQuery='no-match'");assert.match(e.run('savedPropertiesPanel()'),/No matching properties/);assert.equal(e.run('state.savedListings.length'),2);
});
