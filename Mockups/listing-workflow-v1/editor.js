/* Standalone UX reference: sample providers, local extraction and browser storage only. */
'use strict';
const $ = s => document.querySelector(s);
const clone = value => structuredClone(value);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY = 'v3-listing-sidebar-v2'; // Preserve the earlier mockup's independent storage.
const icons = {Templates:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/>',Tools:'<path d="m5 3 14 10-7 1-3 7Z"/>',Elements:'<rect x="3" y="3" width="8" height="8"/><circle cx="17" cy="17" r="4"/>',Text:'<path d="M4 5h16M12 5v15M8 20h8"/>',Uploads:'<path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6"/>',Brand:'<path d="m12 3 9 7-9 11L3 10Z"/>',Property:'<path d="m3 11 9-8 9 8M5 9v12h14V9M9 21v-8h6v8"/>',Agent:'<circle cx="12" cy="7" r="4"/><path d="M4 22v-4a8 8 0 0 1 16 0v4"/>'};
const library = [
  {id:'exterior',src:'assets/ai-villa-sunset.png',name:'Villa exterior',role:'Exterior'},
  {id:'living',src:'assets/modern-interior.jpg',name:'Living room',role:'Interior'},
  {id:'kitchen',src:'assets/warm-interior.jpg',name:'Kitchen & dining',role:'Interior'},
  {id:'area',src:'assets/urban-tower.jpg',name:'Neighbourhood',role:'Area'},
];
function logo(name, color) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="80" viewBox="0 0 480 80"><path d="M12 43 40 16 68 43M22 35v30h36V35M35 65V45h10v20" fill="none" stroke="${color}" stroke-width="4"/><text x="85" y="51" font-family="Arial,sans-serif" font-size="26" font-weight="bold" letter-spacing="3" fill="${color}">${esc(name)}</text></svg>`);
}
const agents = [
  {id:'arjun',name:'Arjun Shah',agency:'Aster Realty',phone:'+91 98765 43210',email:'arjun@example.com',license:'DEMO-AGENT-01',photo:'assets/agent.jpg'},
  {id:'vikram',name:'Vikram Patel',agency:'North & Co.',phone:'+91 90000 11223',email:'vikram@example.com',license:'DEMO-AGENT-02',photo:'assets/agent.jpg'},
];
const brands = [
  {id:'aster',name:'ASTER REALTY',tagline:'A better place to belong',accent:'#146b64',logo:logo('ASTER REALTY','#146b64')},
  {id:'north',name:'NORTH & CO.',tagline:'Find your next chapter',accent:'#123e62',logo:logo('NORTH & CO.','#123e62')},
];
const blankProperty = () => ({name:'New listing',headline:'',address:'',description:'',price:'',beds:'',baths:'',area:'',features:'',status:'Active sale'});
const sampleProperty = {name:'Lake View Villa',headline:'A little closer to your dream.',address:'Lake View Road, Ahmedabad',description:'A bright family home with space to grow.',price:'₹1.25 Cr',beds:'3',baths:'2',area:'1,850 sq ft',features:'Garden, covered parking',status:'Active sale'};
const fields = {
  'property.headline':['Marketing headline','text'], 'property.price':['Price','text'],
  'property.location':['Address','text'], 'property.specs':['Specifications','text'],
  'property.description':['Description','text'], 'property.features':['Features','text'],
  'agent.name':['Agent name','text'], 'agent.phone':['Agent phone','text'],
  'agent.email':['Agent email','text'], 'agent.rera':['Agent registration','text'],
  'brand.name':['Agency / brand name','text'], 'agent.cta':['Brand signature','text'],
  'property.heroImage':['Property hero photo','image'], 'property.galleryImage':['Property gallery photo','image'],
  'agent.photo':['Agent portrait','image'], 'brand.logo':['Brand logo','image'],
};
const elements = {
  brand:{name:'Brand logo',type:'image',slot:'brand.logo'},
  hero:{name:'Main photograph',type:'image',slot:'property.heroImage'},
  headline:{name:'Headline',type:'text',slot:'property.headline'},
  price:{name:'Price',type:'text',slot:'property.price'},
  specs:{name:'Specifications',type:'text',slot:'property.specs'},
  address:{name:'Address',type:'text',slot:'property.location'},
  portrait:{name:'Agent photograph',type:'image',slot:'agent.photo'},
  agent:{name:'Agent name',type:'text',slot:'agent.name'},
  phone:{name:'Agent phone',type:'text',slot:'agent.phone'},
  signature:{name:'Brand signature',type:'text',slot:'agent.cta'},
};
const initialBindings = Object.fromEntries(Object.entries(elements).map(([id,e]) => [id,{slot:e.slot,rule:'hero'}]));
const sampleRecord = () => ({property:clone(sampleProperty),photos:clone(library.slice(0,3)),agent:clone(agents[0]),brand:clone(brands[0]),source:'Sample template content',sourceId:'',suggestions:''});
function photoFor(record, rule) {
  const photos = record.photos;
  if (!photos.length) return null;
  const role = {hero:'Hero',exterior:'Exterior',interior:'Interior',area:'Area'}[rule];
  if (rule === 'rank2') return photos[1] || photos[0];
  if (rule === 'rank3') return photos[2] || photos[0];
  // Hero prefers an explicitly assigned Hero, then Exterior, then ranked photo #1.
  return photos.find(p => p.role === role) || (rule === 'hero' ? photos.find(p => p.role === 'Exterior') : null) || photos[0];
}
function resolve(record, binding) {
  if (!binding?.slot) return '';
  const p = record.property, a = record.agent, b = record.brand;
  const values = {'property.headline':p.headline,'property.price':p.price,'property.location':p.address,
    'property.specs':[p.beds && `${p.beds} BEDS`,p.baths && `${p.baths} BATHS`,p.area].filter(Boolean).join(' · '),
    'property.description':p.description,'property.features':p.features,'agent.name':a.name,'agent.phone':a.phone,
    'agent.email':a.email,'agent.rera':a.license,'brand.name':a.agency,'agent.cta':b.tagline,
    'agent.photo':a.photo,'brand.logo':b.logo,
    'property.heroImage':photoFor(record,binding.rule)?.src,'property.galleryImage':photoFor(record,binding.rule)?.src};
  return values[binding.slot] || '';
}
const sample = sampleRecord();
const defaults = {pending:null,applied:{record:sample,values:Object.fromEntries(Object.entries(initialBindings).map(([id,b])=>[id,resolve(sample,b)])),bindings:clone(initialBindings),event:'Just Listed'},bindings:clone(initialBindings),templateBindings:clone(initialBindings),packRules:['hero','hero','interior','area'],overrides:{},undo:null,approved:false,savedAgents:clone(agents),savedBrands:clone(brands)};
let state;
try { state = JSON.parse(localStorage.getItem(KEY)) || clone(defaults); } catch { state = clone(defaults); }
let panel='Property',screen=state.pending?'summary':'source',sourceTab='id',country='IN',provider='demo',selected='hero',showLinks=true,layers=false,inspectorOpen=true;
let draft=null,extractReview=null,sourceError='',extractText='',uploadError='';
function commit(next, message) {
  try { localStorage.setItem(KEY,JSON.stringify(next)); state=next; if(message)toast(message); return true; }
  catch { toast('Browser storage is full. Changes were not saved. Remove photos or use smaller images.'); return false; }
}
function mutate(fn,message) { const next=clone(state);fn(next);return commit(next,message); }
function toast(message) { $('#notice').textContent=message;$('#notice').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#notice').classList.remove('visible'),4200); }
function changes() {
  if (!state.pending) return {updates:[],skips:[],values:{}};
  const values={},updates=[],skips=[];
  for (const [id,e] of Object.entries(elements)) {
    if (state.overrides[id]) continue;
    const value=resolve(state.pending,state.bindings[id]);
    if (!value) { skips.push(`${e.name}: ${state.bindings[id]?.slot?'source value missing':'no field linked'}`); continue; }
    values[id]=value;
    if(value!==state.applied.values[id] || JSON.stringify(state.bindings[id])!==JSON.stringify(state.applied.bindings[id])) updates.push(id);
  }
  if(state.pending.brand.accent!==state.applied.record.brand.accent)updates.push('accent');
  return {updates,skips,values};
}
function displayed(id) { return state.overrides[id]?.value ?? state.applied.values[id] ?? ''; }
function bound(id,html,cls='') {
  const source=state.overrides[id]?'This design only':state.applied.bindings[id]?.slot || 'Unlinked';
  return `<div class="bound ${cls} ${selected===id?'selected':''}" data-select="${id}" tabindex="0" role="button" aria-label="Select ${elements[id].name}">${html}<span class="link-label">↗ ${esc(source)}</span></div>`;
}
function paper() {
  return `<div class="paper ${showLinks?'show-links':''}" style="--accent:${esc(state.applied.record.brand.accent)}">
    ${bound('brand',`<img class="art-logo" src="${esc(displayed('brand'))}" alt="Applied brand logo">`)}
    ${bound('hero',`<img class="hero" src="${esc(displayed('hero'))}" alt="Applied property photograph">`,'photo-wrap')}
    <div class="event">${esc(state.applied.event.toUpperCase())}</div>
    ${bound('headline',`<div class="headline">${esc(displayed('headline'))}</div>`)}
    <div class="facts">${bound('price',`<div class="price">${esc(displayed('price'))}</div>`)}${bound('specs',`<span class="art-specs">${esc(displayed('specs'))}</span>`)}</div>
    ${bound('address',`<div class="address">${esc(displayed('address'))}</div>`)}
    <div class="agent-line">${bound('portrait',`<img src="${esc(displayed('portrait'))}" alt="Applied agent portrait">`)}<div>${bound('agent',`<strong>${esc(displayed('agent'))}</strong>`)}${bound('phone',`<span>${esc(displayed('phone'))}</span>`)}</div>${bound('signature',`<div class="agent-brand">${esc(displayed('signature'))}</div>`)}</div>
    <div class="unlinked-note">A HOME FOR YOUR NEXT CHAPTER</div></div>`;
}
function field(label,name,value,type='text',required=false) {
  return `<label class="field"><span>${label}</span><input type="${type}" name="${name}" value="${esc(value)}" ${required?'required':''} ${type==='number'?'min="0" step="1"':''}></label>`;
}
function head(title,back=false) { return `<div class="panel-head"><h2>${title}</h2>${back?'<button class="small" data-back>← Back</button>':'<span class="pill">Demo records</span>'}</div>`; }
function sourcePanel() {
  return `${head('Load a listing',!!state.pending)}<div class="panel-body"><span class="eyebrow">Start with the facts</span><h2 style="margin-top:8px">Your listing, ready to design.</h2><p class="hint">Find a record or paste a seller’s message. Review the details before updating the canvas.</p>
    <div class="tabs"><button data-source="id" class="${sourceTab==='id'?'active':''}">Listing ID</button><button data-source="text" class="${sourceTab==='text'?'active':''}">Paste text</button></div>
    ${sourceTab==='id'?`<form id="lookup-form"><label class="field"><span>Country</span><select id="country" name="country"><option value="IN" ${country==='IN'?'selected':''}>India</option><option value="US" ${country==='US'?'selected':''}>United States</option></select></label><label class="field"><span>Listing source</span><select id="provider" name="provider"><option value="demo" ${provider==='demo'?'selected':''}>${country==='IN'?'Sample property feed':'Sample MLS feed'} · fictional</option><option value="unavailable" ${provider==='unavailable'?'selected':''}>${country==='IN'?'RERA / registration source':'Other MLS provider'} · not connected</option></select></label>${field('Listing / registration ID','listingId','', 'text',true)}<button class="primary full">Find listing</button></form><div class="info"><strong>Fictional lookup examples</strong><p>SAMPLE-101 · record with photos<br>SAMPLE-102 · record without photos</p><p class="hint">Other IDs show “No match”. An ID does not guarantee a record or photos. No live provider is connected.</p></div>`:
    `<form id="extract-form"><label class="field"><span>Listing or WhatsApp message</span><textarea name="message" id="raw-text" rows="7" placeholder="3 BHK, 80 Lakh, Address: Satellite Road, Ahmedabad" required>${esc(extractText)}</textarea></label><button type="button" class="small" id="example-text">Use example message</button><button class="primary full" style="margin-top:12px">Extract & review</button></form><p class="hint">Local sample parser. Unrecognised facts stay missing; agent details remain suggestions.</p>`}
    ${sourceError?`<p class="warning" role="alert">${esc(sourceError)}</p>`:''}${state.pending?'<button class="full" data-back>Return to pending listing</button>':''}</div>`;
}
function extractionPanel() {
  const r=extractReview;
  return `${head('Review detected facts',true)}<div class="panel-body"><p class="hint">Select facts to accept. Existing values are unchecked by default. The canvas will stay unchanged.</p><form id="accept-extraction">${r.rows.map((row,i)=>`<label class="fact-row"><input type="checkbox" name="fact" value="${i}" ${row.checked?'checked':''}><span><strong>${esc(row.label)}</strong><b>${esc(row.value)}</b><small>Current: ${esc(row.current||'Empty')}</small></span></label>`).join('')}
    ${!r.rows.length?'<p class="warning">No supported facts detected. Edit the message and try again.</p>':''}<div class="info"><strong>Missing / not detected</strong><p>${esc(r.missing.join(', ')||'Core facts detected')}</p></div>${r.suggestions?`<div class="warning"><strong>Agent suggestions only</strong><p>${esc(r.suggestions)}</p><p>Your saved agent will not be replaced.</p></div>`:''}<button class="primary full" id="accept-facts" ${!r.rows.some(r=>r.checked)?'disabled':''}>Accept selected facts</button><button type="button" class="full" id="revise-text" style="margin-top:8px">Edit message</button></form></div>`;
}
function summaryPanel() {
  const r=state.pending,p=r.property;
  return `${head('Listing overview')}<div class="panel-body"><div class="badge-row"><span class="eyebrow">Pending listing</span><button class="small" id="change-listing">Change listing</button></div><h2>${esc(p.name)}</h2><p class="hint">${esc(r.source)} ${esc(r.sourceId)}</p>
    <section class="summary-section"><div class="badge-row"><h3>Photos <small>(${r.photos.length})</small></h3><button class="small" data-edit="photos">View all / edit</button></div>${r.photos.length?`<button class="photo-preview" data-edit="photos" aria-label="Edit listing photos">${r.photos.slice(0,2).map(photo=>`<img src="${esc(photo.src)}" alt="${esc(photo.name)}">`).join('')}</button>`:'<p class="warning">No property photos available. Add photos before updating image links.</p>'}<div class="button-pair"><button class="small" data-photo-library>Choose stored photos</button><button class="small" data-upload>Upload photos</button></div></section>
    <button class="summary-card" data-edit="property"><span class="card-label">Property information <span>✎</span></span><strong>${esc(p.address||'Address missing')}</strong><p>${esc(p.description||'Description not provided')}</p><div class="property-stats"><b>${esc(p.price||'Price missing')}</b><span>${esc(p.beds||'—')} beds · ${esc(p.baths||'—')} baths</span><span>${esc(p.area||'Area missing')}</span></div><small>${esc(p.status)} · ${esc(p.features||'Features not provided')}</small></button>
    <button class="summary-card" data-edit="agent"><span class="card-label">Agent information <span>✎</span></span><span class="profile"><img class="portrait" src="${esc(r.agent.photo)}" alt="Saved sample agent"><span><strong>${esc(r.agent.name)}</strong><small>${esc(r.agent.agency)}</small></span></span><p>${esc(r.agent.phone)}<br>${esc(r.agent.email)}</p></button>
    ${r.suggestions?`<p class="warning"><strong>Imported agent suggestion</strong><br>${esc(r.suggestions)}<br>Not applied to the saved agent.</p>`:''}
    <button class="summary-card" data-edit="brand"><span class="card-label">Brand assets <span>✎</span></span><img class="summary-logo" src="${esc(r.brand.logo)}" alt="Pending brand logo"><p>${esc(r.brand.tagline)}</p><span class="colour-chip" style="background:${esc(r.brand.accent)}"></span><small>Logo · accent · signature</small></button></div>`;
}
function editPanel() {
  if(!draft)return summaryPanel();
  if(screen==='photos') return photoPanel();
  if(screen==='property')return `${head('Edit property',true)}<form id="property-form" class="panel-body">${field('Listing name','name',draft.property.name,'text',true)}${field('Marketing headline','headline',draft.property.headline)}${field('Address','address',draft.property.address)}<label class="field"><span>Description</span><textarea name="description">${esc(draft.property.description)}</textarea></label>${field('Price','price',draft.property.price)}<div class="pair">${field('Bedrooms','beds',draft.property.beds,'number')}${field('Bathrooms','baths',draft.property.baths,'number')}</div>${field('Floor area','area',draft.property.area)}${field('Features','features',draft.property.features)}<label class="field"><span>Listing status</span><select name="status">${['Active sale','Sold','For rent','Rented'].map(s=>`<option ${draft.property.status===s?'selected':''}>${s}</option>`).join('')}</select></label>${editActions()}</form>`;
  if(screen==='agent')return `${head('Edit agent',true)}<div class="panel-body"><label class="field"><span>Select saved demo agent</span><select id="saved-agent">${state.savedAgents.map(a=>`<option value="${a.id}" ${draft.agent.id===a.id?'selected':''}>${esc(a.name)} · ${esc(a.agency)}</option>`).join('')}</select></label><form id="agent-form"><div class="profile"><img class="portrait" src="${esc(draft.agent.photo)}" alt="Sample portrait"><small>Sample portrait asset</small></div>${field('Full name','name',draft.agent.name,'text',true)}${field('Agency','agency',draft.agent.agency)}${field('Phone','phone',draft.agent.phone)}${field('Email','email',draft.agent.email,'email')}${field('Registration / licence','license',draft.agent.license)}<p class="hint">Saves this browser’s demo profile and assigns it to the pending listing. It does not update the canvas yet.</p>${editActions()}</form></div>`;
  return `${head('Edit brand assets',true)}<div class="panel-body"><label class="field"><span>Saved demo brand kit</span><select id="saved-brand">${state.savedBrands.map(b=>`<option value="${b.id}" ${draft.brand.id===b.id?'selected':''}>${esc(b.name)}</option>`).join('')}</select></label><img class="summary-logo" src="${esc(draft.brand.logo)}" alt="Selected brand logo"><form id="brand-form">${field('Brand name','name',draft.brand.name,'text',true)}${field('Brand signature','tagline',draft.brand.tagline)}<label class="field"><span>Accent colour</span><input type="color" name="accent" value="${esc(draft.brand.accent)}"></label><p class="hint">The sample logo wordmark is rebuilt from the name and colour. Production logo uploads are outside this mockup.</p>${editActions()}</form></div>`;
}
function editActions() { return '<div class="edit-actions"><button class="primary full">Save changes</button><button type="button" class="full" data-cancel>Cancel</button></div>'; }
function photoPanel() {
  return `${head('Property photos',true)}<div class="panel-body"><p class="hint">Assign roles, then rank photos. Templates use the first matching role, with photo #1 as fallback.</p><div class="button-pair"><button class="small" data-photo-library>Choose stored photos</button><button class="small" data-upload>Upload photos</button></div><input id="photo-upload-v2" type="file" accept="image/*" multiple hidden>
    ${!draft.photos.length?'<p class="warning">No photos added. No replacement imagery will be invented.</p>':''}<div class="photos editor-photos">${draft.photos.map((p,i)=>`<div class="photo-card"><img src="${esc(p.src)}" alt="${esc(p.name)}"><div class="caption"><strong>${i+1}. ${esc(p.name)}</strong><select aria-label="Photo ${i+1} role" data-role-index="${i}">${['Hero','Exterior','Interior','Area'].map(r=>`<option ${p.role===r?'selected':''}>${r}</option>`).join('')}</select></div><div class="photo-actions"><button class="small" data-rank="${i}" ${i===0?'disabled':''} aria-label="Move photo ${i+1} up">↑</button><button class="small" data-remove="${i}">Remove</button></div></div>`).join('')}</div>${uploadError?`<p role="alert" class="warning">${esc(uploadError)}</p>`:''}<p class="hint">Up to 8 photos. Upload JPEG, PNG or WebP, up to 10 MB each. Images are resized for browser-local storage.</p><button class="primary full" id="save-photos">Save changes</button><button class="full" data-cancel style="margin-top:8px">Cancel</button></div>`;
}
function applyFooter() {
  if(!state.pending || screen!=='summary')return '';
  const c=changes();
  return `<div class="apply-footer"><div class="badge-row"><strong>${c.updates.length} pending canvas changes</strong><small>${Object.keys(state.overrides).length} overrides</small></div>${c.skips.length?`<details class="skip-details"><summary>${c.skips.length} linked updates will be skipped</summary><ul>${c.skips.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><small>Existing artwork is kept for these elements.</small></details>`:''}<button class="primary full" id="apply-design">Apply to design</button><p class="micro muted">Only linked content and the brand accent are updated.</p></div>`;
}
function inspector() {
  const element=elements[selected],binding=state.bindings[selected],image=element.type==='image';
  return `<div class="panel-head"><h2>Element links</h2><button class="small" id="close-inspector" aria-label="Close element links">×</button></div><div class="panel-body"><span class="eyebrow">Selected canvas element</span><div class="selection-card"><strong>${element.name}</strong><small>${image?'Image frame':'Text element'} · appearance preserved</small></div><label class="field"><span>Pending content source</span><select id="binding"><option value="">Unlinked / keep artwork</option>${Object.entries(fields).filter(([,f])=>f[1]===element.type).map(([slot,f])=>`<option value="${slot}" ${binding.slot===slot?'selected':''}>${f[0]} · ${slot}</option>`).join('')}</select></label>${image&&binding.slot.startsWith('property.')?`<label class="field"><span>Photo selection rule</span><select id="photo-rule">${ruleOptions(binding.rule)}</select></label><p class="hint">Fallback: ranked property photo #1. No photos means no image update.</p>`:''}<div class="info"><strong>Applied source</strong><p class="source-code">${esc(state.applied.bindings[selected]?.slot||'Unlinked')}</p><small>Source changes wait for Apply to design.</small></div>
    <div class="section"><h3>This design only</h3>${state.overrides[selected]?'<p class="warning">Override active. Applying a listing will keep this element’s override.</p><button class="full" id="clear-override">Return to linked source</button>':image?'<button class="full" id="override-image">Choose design-only image</button>':`<label class="field"><span>Override text</span><input id="override-text" value="${esc(displayed(selected))}"></label><button class="full" id="override-save">Set design-only text</button>`}</div>
    <div class="section"><h3>Reusable template link</h3><p class="hint">Save this mapping as a future default. Current artwork stays as applied.</p><button class="primary full" id="save-link">Save reusable template link</button><button class="full" data-pack style="margin-top:8px">Manage template pack</button></div></div>`;
}
function ruleOptions(value) { return [['hero','Hero → exterior → photo #1'],['exterior','Highest-ranked exterior'],['interior','Highest-ranked interior'],['rank2','Photo rank #2'],['rank3','Photo rank #3'],['area','Area / neighbourhood']].map(([v,l])=>`<option value="${v}" ${value===v?'selected':''}>${l}</option>`).join(''); }
function templatePanel() {
  return `${head('Templates')}<div class="panel-body"><span class="eyebrow">Aster Realty collection</span><p class="hint">Choose a sample lifecycle layout. This action changes its event heading; it does not change the property record status.</p>${['Just Listed','Just Sold','For Rent','Just Rented'].map(e=>`<button class="template-card ${state.applied.event===e?'active':''}" data-event="${e}"><strong>▧ ${e}</strong><small>Portrait flyer · linked template</small></button>`).join('')}<button class="primary full" data-pack>Configure template pack</button></div>`;
}
function render() {
  let content;
  if(panel==='Property')content=screen==='source'?sourcePanel():screen==='extraction'?extractionPanel():screen==='summary'?summaryPanel():editPanel();
  else if(panel==='Templates')content=templatePanel();
  else content=`${head(panel)}<div class="panel-body"><p class="hint">Existing V3 ${panel.toLowerCase()} controls are outside this concept.</p><button data-panel="Property">Open listing</button></div>`;
  $('#app').innerHTML=`<header class="header"><a class="back" href="index.html">← Listings</a><a class="wordmark" href="index.html"><b>▧</b>buildographic</a><span class="design-title">${esc(state.applied.record.property.name)} / ${esc(state.applied.event)}</span><div class="right"><span class="demo">LOCAL CONCEPT</span><button id="undo-apply" ${state.undo?'':'disabled'}>Undo last apply</button><button data-pack>Template pack</button><button class="white" id="review">Review design</button></div></header><div class="shell ${inspectorOpen?'':'no-inspector'}"><nav class="rail" aria-label="Editor panels">${Object.keys(icons).map(n=>`<button data-panel="${n}" class="${panel===n?'active':''}"><svg viewBox="0 0 24 24">${icons[n]}</svg>${n==='Property'?'Listing':n}</button>`).join('')}<button class="bottom" id="help">ⓘ<span>Guide</span></button></nav><aside class="panel listing-panel"><div class="panel-scroll">${content}</div>${applyFooter()}</aside><main class="workspace"><div class="contextbar"><span>Portrait flyer / 1080 × 1440</span><span>${state.pending?'Applied artwork · edits wait for Apply':'Sample template preview'}</span></div><div class="stage">${paper()}</div>${layers?`<div class="layers"><div class="badge-row"><strong>Layers & links</strong><button class="small" id="close-layers">×</button></div>${Object.entries(elements).map(([id,e])=>`<button data-select="${id}">↗ ${e.name}</button>`).join('')}<p class="hint">Footer signature is unlinked.</p></div>`:''}<footer class="footer"><div><button id="toggle-links" class="${showLinks?'active':''}" aria-pressed="${showLinks}">↗ Show links: ${showLinks?'On':'Off'}</button> <button id="layers">▱ Layers</button></div><span>Fit · 75%</span></footer></main><aside class="inspector" ${inspectorOpen?'':'hidden'}>${inspector()}</aside></div>`;
}
function startEdit(kind) { if(!state.pending){toast('Load a listing first.');return;}draft=clone(state.pending);screen=kind;panel='Property';uploadError='';render(); }
function back() { if(screen==='extraction'){screen='source';}else{screen=state.pending?'summary':'source';draft=null;}render(); }
function saveDraft() {
  const next=clone(state);next.pending=clone(draft);
  if(screen==='agent'){const i=next.savedAgents.findIndex(a=>a.id===draft.agent.id);next.savedAgents[i]=clone(draft.agent);}
  if(screen==='brand'){const i=next.savedBrands.findIndex(b=>b.id===draft.brand.id);next.savedBrands[i]=clone(draft.brand);}
  if(commit(next,'Pending listing saved. Canvas unchanged.')){draft=null;screen='summary';render();}
}
function openLibrary(mode='photos') {
  const dlg=$('#asset-dialog');
  const items=mode==='override'?[...library,{id:'agent-image',src:agents[0].photo,name:'Sample agent portrait',role:'Agent'},{id:'logo-image',src:brands[0].logo,name:'Aster logo',role:'Brand'},...(state.pending?.photos||[]).filter(p=>p.id.startsWith('upload-'))]:library;
  dlg.innerHTML=`<div class="dialog-head"><div><span class="eyebrow">${mode==='override'?'This design only':'Stored photo library · sample assets'}</span><h2>${mode==='override'?'Choose an image override':'Choose property photos'}</h2></div><button data-close="asset-dialog" aria-label="Close image library">×</button></div><div class="dialog-content"><p class="hint">These are labelled demonstration assets, not photos fetched from a real database.</p><div class="library-grid">${items.map((p,i)=>`<button class="library-item" ${mode==='override'?`data-override-index="${i}"`:`data-library-id="${p.id}"`}><img src="${esc(p.src)}" alt="${esc(p.name)}"><strong>${esc(p.name)}</strong><small>${mode==='override'?'Use for this element':'Add to pending photos'}</small></button>`).join('')}</div></div><div class="dialog-foot"><small>${mode==='override'?'Template mapping stays unchanged.':'Add photos, then save the photo card.'}</small><button data-close="asset-dialog">Done</button></div>`;
  dlg.dataset.mode=mode;dlg._items=items;dlg.showModal();
}
function openPack() {
  const dlg=$('#pack-dialog');
  dlg.innerHTML=`<div class="dialog-head"><div><span class="eyebrow">Configure once · Reuse for future listings</span><h2>Reusable template pack</h2></div><button data-close="pack-dialog" aria-label="Close template pack">×</button></div><form id="pack-form"><div class="dialog-content"><p class="hint">Saving changes future template defaults only. The current canvas and pending links are not replaced.</p><table><thead><tr><th>Asset</th><th>Linked content</th><th>Photo rule</th></tr></thead><tbody>${['Just Listed','Just Sold','For Rent / Just Rented','Market Report'].map((name,i)=>`<tr><td>${name}</td><td>${i===3?'Reviewed period + market statistic':'Property facts · assigned agent · brand kit'}</td><td><select name="rule${i}" aria-label="${name} photo rule">${ruleOptions(state.packRules[i])}</select></td></tr>`).join('')}</tbody></table><div class="pack-grid"><div class="record"><h3>Shared records</h3><p>Property → linked text and ranked photos<br>Assigned agent → portrait and contact<br>Brand kit → logo, signature and accent</p><p class="source-code">${esc(state.templateBindings.hero.slot)}</p></div><div class="warning">Market Report is configuration only. A separately reviewed market source, reporting period and statistic are required; property facts alone are insufficient.</div></div><p id="pack-sample" class="info" hidden></p></div><div class="dialog-foot"><small>Saved in this browser only</small><div><button type="button" id="sample-pack">Check with sample property</button><button class="primary">Save template pack</button></div></div></form>`;
  dlg.showModal();
}
function review() {
  const dlg=$('#review-dialog'),r=state.applied.record;
  dlg.innerHTML=`<div class="dialog-head"><div><span class="eyebrow">Applied design snapshot</span><h2>Review ${esc(r.property.name)}</h2></div><button data-close="review-dialog" aria-label="Close review">×</button></div><div class="dialog-content review-grid">${paper()}<div><span class="pill">Human review</span><h2 style="margin-top:15px">Review the applied artwork.</h2><div class="review-list"><p>Price on canvas: ${esc(displayed('price'))}</p><p>Agent on canvas: ${esc(displayed('agent'))}</p><p>Source: ${esc(r.source)}</p><p>Design-only overrides: ${Object.keys(state.overrides).length}</p></div>${changes().updates.length?'<p class="warning">Pending edits have not been applied. This review shows the previous applied design.</p>':''}<div id="review-status" class="info">${state.approved?'Approved locally.':'Awaiting approval.'}</div><button class="primary full" id="approve">Approve design</button><p class="hint">Local concept only. Approval does not export, publish or schedule a campaign.</p></div></div>`;dlg.showModal();
}
function extract(text) {
  const detections={};let m;
  if((m=text.match(/(\d+)\s*(?:BHK|bedrooms?|beds?)/i)))detections.beds=m[1];
  if((m=text.match(/(\d+)\s*(?:bathrooms?|baths?)/i)))detections.baths=m[1];
  if((m=text.match(/(?:₹|INR\s*)?(\d+(?:\.\d+)?)\s*(lakh|lac|crore|cr)\b/i)))detections.price=`₹${m[1]} ${/^(cr|crore)$/i.test(m[2])?'Cr':'Lakh'}`;
  else if((m=text.match(/(?:₹|INR\s*|\$)\s*[\d,]+(?:\.\d+)?/i)))detections.price=m[0];
  if((m=text.match(/([\d,]+(?:\.\d+)?)\s*(sq\.?\s*ft|sqft|sq\.?\s*m|sqm)\b/i)))detections.area=m[0];
  if((m=text.match(/(?:address|location)\s*:\s*([^\n;]+)/i)))detections.address=m[1].trim();
  if((m=text.match(/headline\s*:\s*([^\n;]+)/i)))detections.headline=m[1].trim();
  if((m=text.match(/description\s*:\s*([^\n;]+)/i)))detections.description=m[1].trim();
  if((m=text.match(/features\s*:\s*([^\n;]+)/i)))detections.features=m[1].trim();
  if(/\b(for rent|rental)\b/i.test(text))detections.status='For rent';
  else if(/\b(for sale)\b/i.test(text))detections.status='Active sale';
  const base=state.pending?clone(state.pending):{property:blankProperty(),photos:[],agent:clone(state.savedAgents[0]),brand:clone(state.savedBrands[0]),source:'Accepted source text · local sample parser',sourceId:'',suggestions:''};
  const labels={beds:'Bedrooms',baths:'Bathrooms',price:'Price',area:'Floor area',address:'Address',headline:'Headline',description:'Description',features:'Features',status:'Listing intent'};
  const suggestions=(text.match(/(?:agent|broker|contact)\s*:\s*[^\n;]+/ig)||[]).join(' · ')+(/\bsold\b/i.test(text)?' · Sold status mentioned; review manually.':'');
  return {base,rows:Object.entries(detections).map(([key,value])=>({key,value,label:labels[key],current:base.property[key],checked:!base.property[key]})),missing:['beds','baths','price','area','address'].filter(k=>!detections[k]).map(k=>labels[k]),suggestions};
}
async function uploadFiles(files) {
  uploadError='';const errors=[];
  for(const file of files) {
    if(draft.photos.length>=8){errors.push('Maximum 8 photos.');break;}
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)){errors.push(`${file.name}: choose JPEG, PNG or WebP.`);continue;}
    if(file.size>10*1024*1024){errors.push(`${file.name}: larger than 10 MB.`);continue;}
    try {
      const src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=reject;reader.onload=()=>{const img=new Image();img.onerror=reject;img.onload=()=>{const scale=Math.min(1,1000/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',.72));};img.src=reader.result;};reader.readAsDataURL(file);});
      draft.photos.push({id:'upload-'+crypto.randomUUID(),src,name:file.name,role:draft.photos.length?'Interior':'Hero'});
    } catch { errors.push(`${file.name}: could not read this image.`); }
  }
  uploadError=errors.join(' ');render();
}
document.addEventListener('click',event=>{
  const b=event.target.closest('button,[data-select]');if(!b)return;
  if(b.dataset.close){$('#'+b.dataset.close).close();return;}
  if(b.hasAttribute('data-back')||b.hasAttribute('data-cancel')){back();return;}
  if(b.dataset.panel){const nextPanel=b.dataset.panel;if(nextPanel==='Agent'||nextPanel==='Brand'){startEdit(nextPanel==='Agent'?'agent':'brand');return;}panel=nextPanel;render();return;}
  if(b.dataset.select){if(b.closest('dialog'))return;selected=b.dataset.select;inspectorOpen=true;render();return;}
  if(b.dataset.source){sourceTab=b.dataset.source;sourceError='';render();return;}
  if(b.dataset.edit){startEdit(b.dataset.edit);return;}
  if(b.hasAttribute('data-pack')){openPack();return;}
  if(b.hasAttribute('data-photo-library')){if(screen!=='photos')startEdit('photos');openLibrary();return;}
  if(b.hasAttribute('data-upload')){if(screen!=='photos')startEdit('photos');$('#photo-upload-v2').click();return;}
  if(b.dataset.libraryId){if(draft.photos.length>=8){toast('Maximum 8 photos.');return;}const p=library.find(p=>p.id===b.dataset.libraryId);if(draft.photos.some(p=>p.id===b.dataset.libraryId)){toast('This photo is already in the pending gallery.');return;}draft.photos.push(clone(p));b.disabled=true;b.querySelector('small').textContent='Added';toast('Added to photo edit. Save changes to keep it.');return;}
  if(b.dataset.overrideIndex!==undefined){const item=$('#asset-dialog')._items[+b.dataset.overrideIndex];if(mutate(s=>{s.overrides[selected]={value:item.src};s.approved=false;},'Design-only image set. Template rule unchanged.')){$('#asset-dialog').close();render();}return;}
  if(b.dataset.rank!==undefined){const i=+b.dataset.rank;if(i>0)[draft.photos[i-1],draft.photos[i]]=[draft.photos[i],draft.photos[i-1]];render();return;}
  if(b.dataset.remove!==undefined){draft.photos.splice(+b.dataset.remove,1);render();return;}
  if(b.dataset.event){mutate(s=>{s.applied.event=b.dataset.event;s.approved=false;});render();return;}
  switch(b.id){
    case'change-listing':screen='source';sourceError='';render();break;
    case'example-text':$('#raw-text').value='3 BHK, 2 bathrooms, 80 Lakh, 1500 sq ft\nAddress: Satellite Road, Ahmedabad\nHeadline: A brighter place to call home\nFeatures: Balcony, parking\nAgent: Seller suggested contact, +91 90000 00000';break;
    case'revise-text':screen='source';sourceTab='text';render();break;
    case'save-photos':saveDraft();break;
    case'apply-design':{const c=changes();const next=clone(state);next.undo={applied:clone(state.applied),overrides:clone(state.overrides)};next.applied={record:clone(state.pending),values:{...state.applied.values,...c.values},bindings:clone(state.applied.bindings),event:state.applied.event};for(const id of Object.keys(c.values))next.applied.bindings[id]=clone(state.bindings[id]);next.approved=false;if(commit(next,`Applied ${c.updates.length} changes. ${c.skips.length} missing or unlinked updates skipped.`))render();break;}
    case'undo-apply':if(state.undo){const next=clone(state);next.applied=next.undo.applied;next.overrides=next.undo.overrides;next.undo=null;next.approved=false;commit(next,'Last apply undone. Pending listing kept.');render();}break;
    case'toggle-links':showLinks=!showLinks;render();break;
    case'layers':layers=!layers;render();break;
    case'close-layers':layers=false;render();break;
    case'close-inspector':inspectorOpen=false;render();break;
    case'override-image':openLibrary('override');break;
    case'override-save':{const value=$('#override-text').value;if(!value.trim()){toast('Enter override text.');break;}mutate(s=>{s.overrides[selected]={value};s.approved=false;},'Text set for this design only.');render();break;}
    case'clear-override':mutate(s=>{delete s.overrides[selected];s.approved=false;},'Returned to applied linked content. Apply to use pending source values.');render();break;
    case'save-link':mutate(s=>{s.templateBindings[selected]=clone(s.bindings[selected]);},'Future template default saved. Current artwork unchanged.');break;
    case'sample-pack':{const form=new FormData($('#pack-form'));const record=state.pending||sampleRecord();$('#pack-sample').hidden=false;$('#pack-sample').textContent=`Sample check: ${record.property.name}. Just Listed photo: ${photoFor(record,form.get('rule0'))?.name||'Missing — add photos'}. Market Report still needs a reviewed market source.`;break;}
    case'review':review();break;
    case'approve':mutate(s=>{s.approved=true;});$('#review-status').textContent='✓ Approved locally. No publishing action taken.';b.disabled=true;break;
    case'help':toast('Load a listing → review cards → save edits → Apply to design. Click canvas elements to inspect links.');break;
  }
});
document.addEventListener('change',event=>{
  const el=event.target;
  if(el.id==='country'){country=el.value;provider='demo';render();}
  if(el.id==='provider')provider=el.value;
  if(el.id==='saved-agent'){draft.agent=clone(state.savedAgents.find(a=>a.id===el.value));render();}
  if(el.id==='saved-brand'){draft.brand=clone(state.savedBrands.find(b=>b.id===el.value));render();}
  if(el.dataset.roleIndex!==undefined)draft.photos[+el.dataset.roleIndex].role=el.value;
  if(el.id==='binding'||el.id==='photo-rule'){const value=el.value;mutate(s=>{if(el.id==='binding')s.bindings[selected].slot=value;else s.bindings[selected].rule=value;});render();toast('Pending mapping changed. Use Apply to design.');}
  if(el.id==='photo-upload-v2')void uploadFiles(Array.from(el.files));
  if(el.name==='fact')$('#accept-facts').disabled=!$('#accept-extraction input:checked');
});
document.addEventListener('keydown',event=>{if(!event.target.closest('dialog')&&(event.key==='Enter'||event.key===' ')&&event.target.matches('[data-select]')){event.preventDefault();selected=event.target.dataset.select;inspectorOpen=true;render();}});
// Refresh the photo edit after either Done, the close button or native Escape.
$('#asset-dialog').addEventListener('close',()=>{render();const target=$('#asset-dialog').dataset.mode==='override'?$('#override-image')||$('#clear-override'):$('#save-photos');target?.focus();});
document.addEventListener('submit',event=>{
  event.preventDefault();const form=event.target,data=Object.fromEntries(new FormData(form));
  if(form.id==='lookup-form'){
    country=data.country;provider=data.provider;
    if(provider==='unavailable'){sourceError='This source is not connected. Try the fictional sample feed or paste listing text.';render();return;}
    const id=data.listingId.trim().toUpperCase();
    if(!['SAMPLE-101','SAMPLE-102'].includes(id)){sourceError='No matching sample listing. Try SAMPLE-101, SAMPLE-102 or paste listing text.';render();return;}
    const record=sampleRecord();record.source=`Fictional ${country==='IN'?'India property':'US MLS'} sample feed`;record.sourceId=id;
    if(id==='SAMPLE-102'){record.photos=[];record.property={...sampleProperty,name:'Skyline Residence',headline:'Your next chapter starts here.',price:'₹92 Lakh',address:'Satellite Road, Ahmedabad',beds:'2',area:'1,420 sq ft'};}
    if(country==='US'){record.property.address='100 Example Lane, Demo City';record.property.price=id==='SAMPLE-101'?'$330,000':'$285,000';}
    if(mutate(s=>{s.pending=record;},'Sample listing loaded for review. Canvas unchanged.')){screen='summary';render();}return;
  }
  if(form.id==='extract-form'){extractText=data.message;extractReview=extract(extractText);sourceError='';screen='extraction';render();return;}
  if(form.id==='accept-extraction'){
    const selectedRows=new FormData(form).getAll('fact');if(!selectedRows.length)return;
    const record=clone(extractReview.base);for(const i of selectedRows){const row=extractReview.rows[+i];record.property[row.key]=row.value;}
    if(record.property.name==='New listing')record.property.name=record.property.address||'Imported listing';
    record.source='Accepted source text · local sample parser';record.sourceId='';record.suggestions=extractReview.suggestions;
    if(mutate(s=>{s.pending=record;},'Selected facts accepted into pending listing. Canvas unchanged.')){screen='summary';render();}return;
  }
  if(form.id==='property-form'){Object.assign(draft.property,data);saveDraft();return;}
  if(form.id==='agent-form'){Object.assign(draft.agent,data);saveDraft();return;}
  if(form.id==='brand-form'){Object.assign(draft.brand,data);draft.brand.logo=logo(draft.brand.name,draft.brand.accent);saveDraft();return;}
  if(form.id==='pack-form'){if(mutate(s=>{s.packRules=Array.from({length:4},(_,i)=>data['rule'+i]);s.templateBindings.hero.rule=s.packRules[0];},'Future template pack saved. Current design unchanged.'))$('#pack-dialog').close();}
});
render();
