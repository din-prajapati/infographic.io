/* V3 listing refinement. Browser-local records only; editor.js provides shared media/model helpers. */
'use strict';
const originalEditPanel = editPanel;
const originalPhotoPanel = photoPanel;
const friendly = slot => fields[slot]?.[0] || 'Unlinked';
let listingScroll=0, lookupId='', lookupResult=null, savedQuery='', pendingPack=clone(state.packRules);
let savedTemplateId='', savedDesignId='', fitObserver=null, activeSave='';
state.savedListings ||= state.pending ? [clone(state.pending)] : [];
state.savedTemplates ||= ['Just Listed','Just Sold','For Rent','Just Rented'].map((event,index)=>({id:'aster-'+index,name:'Aster · '+event,event,bindings:{...clone(initialBindings),hero:{slot:'property.heroImage',rule:state.packRules[index===0?0:index===1?1:2]}},packRules:clone(state.packRules),staticValues:{},layout:{format:'portrait',width:1080,height:1440}}));
state.savedDesigns ||= [];
for(const record of state.savedListings)record.id ||= record.sourceId || 'local-'+crypto.randomUUID();
if(state.pending)state.pending.id ||= state.savedListings.find(r=>r.property.address===state.pending.property.address)?.id || 'local-'+crypto.randomUUID();
inspectorOpen=false;showLinks=false;
function rememberListing(next,record) {
  record.id ||= record.sourceId ? `${record.source}:${record.sourceId}` : 'local-'+crypto.randomUUID();
  const index=next.savedListings.findIndex(r=>r.id===record.id);
  if(index<0)next.savedListings.push(clone(record));else next.savedListings[index]=clone(record);
}
function stageListing(record) {
  if(mutate(next=>{next.pending=clone(record);rememberListing(next,next.pending);},'Listing selected. Review before applying to the design.')){
    panel='Property';screen='summary';draft=null;listingScroll=0;render();
  }
}
function lookupSample(id,sourceCountry) {
  const addressMatch=[['LAKE VIEW ROAD, AHMEDABAD','SAMPLE-101'],['SATELLITE ROAD, AHMEDABAD','SAMPLE-102']].find(([address])=>address===id.toUpperCase());
  if(addressMatch)id=addressMatch[1];
  if(!['SAMPLE-101','SAMPLE-102'].includes(id))return null;
  const record=sampleRecord();record.source=`Fictional ${sourceCountry==='IN'?'India property':'US MLS'} sample feed`;record.sourceId=id;record.id=sourceCountry+':'+id;
  if(id==='SAMPLE-102'){record.photos=[];Object.assign(record.property,{name:'Skyline Residence',headline:'Your next chapter starts here.',price:'₹92 Lakh',address:'Satellite Road, Ahmedabad',beds:'2',area:'1,420 sq ft'});}
  if(sourceCountry==='US'){record.property.address='100 Example Lane, Demo City';record.property.price=id==='SAMPLE-101'?'$330,000':'$285,000';}
  return record;
}
function resultCard(record,action,index='') {
  return `<button class="result-card" ${action}="${index}">${record.photos[0]?`<div class="result-cover"><img src="${esc(record.photos[0].src)}" alt="${esc(record.property.name)}"><span>${esc(record.property.status)}</span></div>`:'<div class="result-placeholder">No listing photos</div>'}<strong>${esc(record.property.address||record.property.name)}</strong><small>${esc(record.sourceId||'Saved property')} · ${esc(record.property.price||'Price not provided')}</small></button>`;
}
function savedPropertyMatches(query=savedQuery) {
  const normalized=String(query).normalize('NFKC').trim().toLocaleLowerCase();
  return state.savedListings.map((record,index)=>({record,index})).filter(({record})=>
    [record.property.address,record.property.name,record.sourceId,record.id].some(value=>String(value||'').normalize('NFKC').toLocaleLowerCase().includes(normalized)));
}
function savedPropertiesPanel() {
  const matches=savedPropertyMatches();
  return `<label class="saved-search"><span class="field-caption">Search saved properties</span><span class="search-input"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6"></circle><path d="m15 15 5 5"></path></svg><input id="saved-property-search" type="search" aria-label="Search saved properties" value="${esc(savedQuery)}" placeholder="Address, property name or listing ID"></span></label>
    ${state.savedListings.length?`<div class="search-summary"><small>${matches.length} of ${state.savedListings.length} properties</small>${savedQuery?'<button class="text-button" id="clear-saved-search">Clear search</button>':''}</div>`:''}
    ${matches.length?matches.map(({record,index})=>resultCard(record,'data-saved-listing',index)).join(''):state.savedListings.length?'<div class="empty saved-empty"><strong>No matching properties</strong><p class="hint">Try another address, property name or listing ID.</p></div>':'<div class="empty saved-empty"><strong>No saved properties yet</strong><p class="hint">Select a listing result or accept reviewed text to add one.</p></div>'}`;
}
sourcePanel = function() {
  return `${head('Load a listing',!!state.pending)}<div class="panel-body"><div class="source-welcome"><span class="eyebrow">Start with the facts</span><h2>Your listing, ready to design.</h2><p>Find a record or paste a seller’s message. Review the details before updating the canvas.</p></div><div class="tabs source-tabs"><button data-source="id" class="${sourceTab==='id'?'active':''}">Listing ID</button><button data-source="text" class="${sourceTab==='text'?'active':''}">Paste text</button><button data-source="saved" class="${sourceTab==='saved'?'active':''}">Saved properties</button></div>
    ${sourceTab==='id'?`<form id="lookup-form"><label class="field"><span>Country</span><select id="country" name="country"><option value="IN" ${country==='IN'?'selected':''}>India</option><option value="US" ${country==='US'?'selected':''}>United States</option></select></label><label class="field"><span>Listing source</span><select id="provider" name="provider"><option value="demo" ${provider==='demo'?'selected':''}>${country==='IN'?'Sample property feed':'Sample MLS feed'} · fictional</option><option value="unavailable" ${provider==='unavailable'?'selected':''}>${country==='IN'?'State RERA':'Other MLS'} · not connected</option></select></label><label class="field"><span>Search by address or listing ID</span><input name="listingId" value="${esc(lookupId)}" placeholder="Try SAMPLE-101 or SAMPLE-102" required></label><button class="primary full">Find listing</button></form>${lookupResult?resultCard(lookupResult,'data-select-result'):'<div class="info lookup-examples"><strong>Fictional lookup examples</strong><p>SAMPLE-101 · record with photos<br>SAMPLE-102 · record without photos</p><small>No live provider is connected.</small></div>'}`:
    sourceTab==='text'?`<form id="extract-form"><label class="field"><span>Listing or WhatsApp message</span><textarea id="raw-text" name="message" rows="7" placeholder="3 BHK, 80 Lakh, Address: Satellite Road, Ahmedabad" required>${esc(extractText)}</textarea></label><div class="button-pair"><button type="button" class="small" id="example-text">Use example</button><button class="primary">Extract & review</button></div></form><p class="demo-note">Local sample extraction · review every fact</p>`:
    savedPropertiesPanel()}
    ${sourceError?`<p class="warning" role="alert">${esc(sourceError)}</p>`:''}<button id="source-guide" class="text-button">Property sources & workflow →</button></div>`;
};
summaryPanel = function() {
  const r=state.pending,p=r.property;
  const specs=[['Bedrooms',p.beds],['Bathrooms',p.baths],['Floor area',p.area]];
  const extras=[p.parking&&`${p.parking} parking`,p.yearBuilt&&`Built ${p.yearBuilt}`,p.propertyType].filter(Boolean);
  const features=String(p.features||'').split(/[,;\n]+/).map(value=>value.trim()).filter(Boolean);
  return `<div class="panel-head listing-heading"><button class="text-button" id="change-listing">← Search</button><h2>${esc(p.address||p.name)}</h2><span class="muted micro">${esc(r.sourceId||'Reviewed listing')} · ${esc(p.status)}</span></div><div class="panel-body listing-summary">
    <section class="summary-section"><div class="badge-row"><h3>Media <small>(${r.photos.length})</small></h3><button class="text-button" data-edit="photos">See all</button></div>${r.photos.length?`<button class="photo-preview" data-edit="photos" aria-label="See all listing media">${r.photos.slice(0,2).map(photo=>`<img src="${esc(photo.src)}" alt="${esc(photo.name)}">`).join('')}</button>`:'<div class="empty-media"><span>No listing photos</span><button class="small" data-panel="Uploads">Open Uploads</button></div>'}</section>
    <button class="summary-card compact-card unified-property-card" data-edit="property" aria-label="Edit property information"><span class="card-label">Property information<span aria-hidden="true">✎</span></span><strong class="property-card-address">${esc(p.address||'Add address')}</strong><span class="clamp-description property-card-description">${esc(p.description||'Description not provided')}</span><span class="property-card-price"><small>Listing price</small><strong>${esc(p.price||'Add price')}</strong></span><span class="card-spec-grid">${specs.map(([label,value])=>`<span><small>${label}</small><strong>${esc(value||'—')}</strong></span>`).join('')}</span>${extras.length?`<span class="property-card-extras">${esc(extras.join(' · '))}</span>`:''}<span class="property-card-features"><span class="property-status">${esc(p.status)}</span>${features.slice(0,3).map(feature=>`<span class="feature-chip">${esc(feature)}</span>`).join('')}${features.length>3?`<span class="feature-chip">+${features.length-3} more</span>`:''}</span>${r.sourceId?`<span class="property-card-source">Listing ID · ${esc(r.sourceId)}</span>`:''}</button>
    <div class="section-label">Agent</div><button class="summary-card compact-card" data-edit="agent"><span class="mini-profile"><img class="portrait" src="${esc(r.agent.photo)}" alt="Saved sample agent"><span><strong>${esc(r.agent.name)}</strong><small>${esc(r.agent.agency)}</small><small>${esc(r.agent.phone)}</small><small>${esc(r.agent.email)}</small></span><b>›</b></span></button>
    ${r.suggestions?`<details class="suggestions"><summary>Imported agent suggestion</summary><p>${esc(r.suggestions)}</p><small>Not applied to the saved agent.</small></details>`:''}
    <div class="section-label">Brand assets</div><button class="summary-card compact-card brand-card" data-edit="brand"><img class="summary-logo" src="${esc(r.brand.logo)}" alt="Pending brand logo"><small><span class="colour-chip" style="background:${esc(r.brand.accent)}"></span>${esc(r.brand.tagline)} <b>›</b></small></button></div>`;
};
applyFooter = function() {
  if(!state.pending||screen!=='summary'||panel!=='Property')return '';
  const c=changes();
  return `<div class="apply-footer"><div class="badge-row"><small>${c.updates.length} pending changes</small><small>${Object.keys(state.overrides).length?Object.keys(state.overrides).length+' custom values':''}</small></div>${c.skips.length?`<details class="skip-details"><summary>${c.skips.length} updates need attention</summary><ul>${c.skips.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><small>Existing artwork is kept for these elements.</small></details>`:''}<button class="primary full" id="apply-design">${savedDesignId?'Apply listing updates':'Apply to design'}</button></div>`;
};
editPanel = function() {
  let html=originalEditPanel();
  if(screen==='property')html=html.replace('<div class="edit-actions">',`<div class="pair">${field('Parking spaces','parking',draft.property.parking||'','number')}${field('Year built','yearBuilt',draft.property.yearBuilt||'','number')}</div>${field('Property type','propertyType',draft.property.propertyType||'')}<div class="edit-actions">`);
  return html;
};
photoPanel = function() {
  let html=originalPhotoPanel();
  if(panel==='Property')html=html.replace(/<div class="button-pair">.*?<\/div>/s,'<button class="small" data-panel="Uploads">Add media from Uploads →</button>');
  else html=html.replace('<h2>Property photos</h2>','<h2>Uploads</h2>').replace('<div class="panel-body">',`<div class="panel-body"><div class="upload-target"><small>Add media to</small><strong>${esc(draft.property.address||draft.property.name)}</strong></div>`);
  return html;
};
bound = function(id,html,cls='') {
  const source=state.overrides[id]?'Custom value':friendly(state.applied.bindings[id]?.slot);
  return `<div class="bound ${cls} ${selected===id?'selected':''}" data-select="${id}" tabindex="0" role="button" aria-label="Select ${elements[id].name}">${html}<span class="link-label">↗ ${esc(source)}</span></div>`;
};
inspector = function() {
  const element=elements[selected],binding=state.bindings[selected],image=element.type==='image';
  return `<div class="panel-head"><h2>Template Fields</h2><button class="small" id="close-inspector" aria-label="Close Template Fields">×</button></div><div class="panel-body"><div class="selection-card"><strong>${element.name}</strong><small>${image?'Image':'Text'} · ${state.overrides[selected]?'Custom value':'Linked content'}</small></div><label class="field"><span>Get content from</span><select id="binding"><option value="">Unlinked / keep artwork</option>${Object.entries(fields).filter(([,f])=>f[1]===element.type).map(([slot,f])=>`<option value="${slot}" ${binding.slot===slot?'selected':''}>${slot.startsWith('property.')?'Property':slot.startsWith('agent.')?'Agent':'Brand'} → ${f[0]}</option>`).join('')}</select></label>${image&&binding.slot.startsWith('property.')?`<label class="field"><span>Choose photo by</span><select id="photo-rule">${ruleOptions(binding.rule)}</select></label><small>Fallback: first ranked property photo.</small>`:''}<p class="hint">Use Apply to design for pending source changes. Save as Template includes these field links.</p>
    <details class="customize" ${state.overrides[selected]?'open':''}><summary>Customize this design</summary><p class="hint">Change this asset only. The Listing and Template stay unchanged.</p>${state.overrides[selected]?'<p class="pill">Custom value active</p><button class="full" id="clear-override">Use linked value</button>':image?'<button class="full" id="override-image">Choose a custom image</button>':`<label class="field"><span>Custom text</span><input id="override-text" value="${esc(displayed(selected))}"></label><button class="full" id="override-save">Use custom text</button>`}</details><button class="text-button" data-pack>Template setup →</button></div>`;
};
templatePanel = function() {
  return `${head('Templates & designs')}<div class="panel-body"><p class="demo-note">Saved in this browser only</p><button class="text-button" data-pack>Template setup →</button><div class="section-label">Reusable templates</div>${state.savedTemplates.map((t,i)=>`<div class="template-tile"><strong>${esc(t.name)}</strong><small>${esc(t.event)} · ${Object.values(t.bindings).filter(b=>b.slot).length} linked fields</small><button class="primary small" data-use-template="${i}">Use this template</button></div>`).join('')}<button class="full" data-save-template>Save as Template</button><div class="section-label">Saved designs</div>${state.savedDesigns.length?state.savedDesigns.map((d,i)=>`<button class="template-card" data-open-design="${i}"><strong>${esc(d.name)}</strong><small>${esc(d.applied.record.property.name)} · ${esc(d.applied.values.price)}</small></button>`).join(''):'<p class="hint">Save a filled design to reopen it here.</p>'}</div>`;
};
function fitCanvas() {
  const stage=$('.stage'),frame=$('.artboard-fit'),art=frame?.querySelector('.paper');if(!stage||!frame||!art)return;
  const scale=Math.max(.25,Math.min(1.8,(stage.clientWidth-32)/348,(stage.clientHeight-28)/464));
  frame.style.width=348*scale+'px';frame.style.height=464*scale+'px';art.style.transform=`scale(${scale})`;const label=$('#fit-label');if(label)label.textContent=Math.round(scale*100)+'%';
}
render = function() {
  const oldScroll=$('.panel-scroll');if(oldScroll&&$('.listing-summary'))listingScroll=oldScroll.scrollTop;
  let content;
  if(panel==='Property')content=screen==='source'?sourcePanel():screen==='extraction'?extractionPanel():screen==='summary'?summaryPanel():editPanel();
  else if(panel==='Brand'||panel==='Agent')content=editPanel();
  else if(panel==='Uploads')content=draft?photoPanel():`${head('Uploads')}<div class="panel-body"><p>Select a Listing before adding property media.</p><button data-panel="Property">Find a property</button></div>`;
  else if(panel==='Templates')content=templatePanel();
  else content=`${head(panel)}<div class="panel-body"><p class="hint">Existing V3 ${panel.toLowerCase()} controls remain outside this concept.</p></div>`;
  $('#app').innerHTML=`<header class="header"><a class="back" href="index.html">← Listings</a><a class="wordmark" href="index.html"><b>▧</b>buildographic</a><span class="design-title">${esc(state.applied.record.property.name)}</span><div class="right"><button id="undo-apply" ${state.undo?'':'disabled'} aria-label="Undo last apply">↶ Undo</button><button id="save-template">Save as Template</button><button id="save-design">Save as Design</button><button class="white" id="review">Review</button></div></header><div class="shell ${inspectorOpen?'':'no-inspector'}"><nav class="rail" aria-label="Editor panels">${Object.keys(icons).map(n=>`<button data-panel="${n}" class="${panel===n?'active':''}" aria-pressed="${panel===n}"><svg viewBox="0 0 24 24">${icons[n]}</svg>${n==='Property'?'Listing':n}</button>`).join('')}<button class="bottom" id="help">ⓘ<span>Workflow</span></button></nav><aside class="panel listing-panel"><div class="panel-scroll">${content}</div>${applyFooter()}</aside><main class="workspace"><div class="contextbar"><span>${esc(state.applied.event)} · Portrait</span><span class="demo-note">Local mockup</span></div><div class="element-bar"><span>${elements[selected].name}${state.overrides[selected]?' · Custom value':''}</span><button class="small" id="link-field">↗ Link field</button></div><div class="stage"><div class="artboard-fit">${paper()}</div></div>${layers?`<div class="layers"><div class="badge-row"><strong>Layers</strong><button class="small" id="close-layers">×</button></div>${Object.entries(elements).map(([id,e])=>`<button data-select="${id}">${e.name}</button>`).join('')}</div>`:''}<footer class="footer"><div><button id="open-fields" class="${inspectorOpen?'active':''}">Template Fields</button><button id="toggle-links" aria-pressed="${showLinks}">${showLinks?'Hide':'Show'} links</button><button id="layers">Layers</button></div><button id="fit-canvas">Fit <span id="fit-label"></span></button></footer></main><aside class="inspector" ${inspectorOpen?'':'hidden'}>${inspector()}</aside></div>`;
  if(panel==='Property'&&screen==='summary')$('.panel-scroll').scrollTop=listingScroll;
  fitObserver?.disconnect();if(typeof ResizeObserver!=='undefined'){fitObserver=new ResizeObserver(fitCanvas);fitObserver.observe($('.stage'));}fitCanvas();
};
startEdit = function(kind) {
  if(!state.pending){toast('Choose a Listing first.');return;}
  // Retain unsaved photo choices when moving between Media and Uploads.
  if(!(kind==='photos'&&screen==='photos'&&draft))draft=clone(state.pending);
  if($('.listing-summary'))listingScroll=$('.panel-scroll').scrollTop;
  screen=kind;panel=kind==='agent'?'Agent':kind==='brand'?'Brand':'Property';uploadError='';render();
};
back = function() {panel='Property';if(screen==='extraction')screen='source';else{screen=state.pending?'summary':'source';draft=null;}render();};
saveDraft = function() {
  const next=clone(state);next.pending=clone(draft);rememberListing(next,next.pending);
  if(screen==='agent'){const i=next.savedAgents.findIndex(a=>a.id===draft.agent.id);next.savedAgents[i]=clone(draft.agent);}
  if(screen==='brand'){const i=next.savedBrands.findIndex(b=>b.id===draft.brand.id);next.savedBrands[i]=clone(draft.brand);}
  if(commit(next,'Listing changes saved. Apply when ready.')){draft=null;panel='Property';screen='summary';render();}
};
function openSave(kind) {
  activeSave=kind;const dlg=$('#save-dialog');
  dlg.innerHTML=`<div class="dialog-head"><h2>Save as ${kind==='template'?'Template':'Design'}</h2><button data-close="save-dialog" aria-label="Close save dialog">×</button></div><form id="save-record-form"><div class="dialog-content"><label class="field"><span>Name</span><input name="recordName" required maxlength="100" value="${esc(kind==='template'?state.applied.event+' · '+state.applied.record.brand.name:state.applied.record.property.name+' · '+state.applied.event)}"></label><p>${kind==='template'?'Saves this layout and its field links for future Listings. Custom design values are not copied into linked template fields.':'Saves the applied artwork, Listing association and custom values as a separate Design.'}</p>${kind==='design'&&changes().updates.length?'<p class="warning">There are unapplied Listing changes. This saves the artwork currently on the canvas.</p>':''}<p class="demo-note">Browser-local demonstration only</p></div><div class="dialog-foot"><button type="button" data-close="save-dialog">Cancel</button><button class="primary">Save ${kind==='template'?'Template':'Design'}</button></div></form>`;
  dlg.showModal();
}
function saveTemplateRecord(name) {
  const template={id:crypto.randomUUID(),name,event:state.applied.event,bindings:clone(state.bindings),packRules:clone(pendingPack),staticValues:Object.fromEntries(Object.keys(elements).filter(id=>!state.bindings[id].slot).map(id=>[id,displayed(id)])),layout:{format:'portrait',width:1080,height:1440}};
  if(template.bindings.hero.slot.startsWith('property.'))template.bindings.hero.rule=pendingPack[template.event==='Just Listed'?0:template.event==='Just Sold'?1:2];
  if(mutate(next=>{next.savedTemplates.push(template);next.templateBindings=clone(template.bindings);next.packRules=clone(pendingPack);},'Template saved locally with its field links.')){savedTemplateId=template.id;return true;}return false;
}
function saveDesignRecord(name) {
  const design={id:crypto.randomUUID(),name,templateId:savedTemplateId||null,listingId:state.applied.record.id||null,applied:clone(state.applied),overrides:clone(state.overrides),approved:state.approved};
  if(mutate(next=>{next.savedDesigns.push(design);},'Design saved locally. Existing Designs are unchanged.')){savedDesignId=design.id;return true;}return false;
}
function useTemplate(index) {
  const template=state.savedTemplates[index],record=state.pending||sampleRecord(),values={};
  for(const [id,element] of Object.entries(elements)){const value=resolve(record,template.bindings[id]);values[id]=value||template.staticValues[id]||(element.type==='image'?logo('ADD IMAGE','#8b999f'):'['+element.name+']');}
  if(mutate(next=>{next.applied={record:clone(record),values,bindings:clone(template.bindings),event:template.event};next.bindings=clone(template.bindings);next.overrides={};next.undo=null;next.approved=false;},state.pending?'New Design created from Template + Listing.':'Template opened with clearly labelled sample preview.')){
    savedTemplateId=template.id;savedDesignId='';pendingPack=clone(template.packRules);panel='Property';screen=state.pending?'summary':'source';inspectorOpen=false;render();
  }
}
function openDesign(index) {
  const design=state.savedDesigns[index];
  if(mutate(next=>{next.applied=clone(design.applied);next.pending=clone(next.savedListings.find(r=>r.id===design.listingId)||design.applied.record);next.bindings=clone(design.applied.bindings);next.overrides=clone(design.overrides);next.undo=null;next.approved=design.approved;},'Saved Design reopened. Listing updates wait for Apply.')){savedDesignId=design.id;savedTemplateId=design.templateId||'';panel='Property';screen='summary';inspectorOpen=false;listingScroll=0;render();}
}
openPack = function() {
  const dlg=$('#pack-dialog');dlg.innerHTML=`<div class="dialog-head"><div><span class="eyebrow">One-time template setup</span><h2>Template pack</h2></div><button data-close="pack-dialog" aria-label="Close template pack">×</button></div><div class="dialog-content"><p class="hint">Template + Listing → Design. Set reusable photo rules here; Save as Template saves the configuration and field links together.</p><table><thead><tr><th>Asset</th><th>Linked content</th><th>Photo rule</th></tr></thead><tbody>${['Just Listed','Just Sold','For Rent / Just Rented','Market Report'].map((name,i)=>`<tr><td>${name}</td><td>${i===3?'Reviewed market data':'Property + Agent + Brand'}</td><td><select data-pack-rule="${i}" aria-label="${name} photo rule">${ruleOptions(pendingPack[i])}</select></td></tr>`).join('')}</tbody></table><details><summary>Field links in this template</summary><ul>${Object.entries(state.bindings).map(([id,b])=>`<li>${elements[id].name} → ${friendly(b.slot)}</li>`).join('')}</ul></details><p class="warning">Market Reports need a separately reviewed source, statistic and reporting period.</p></div><div class="dialog-foot"><button data-close="pack-dialog">Back to editor</button><button class="primary" id="pack-save-template">Save as Template</button></div>`;dlg.showModal();
};
function openGuide() {
  const dlg=$('#workflow-dialog');dlg.innerHTML=`<div class="dialog-head"><h2>Property → marketing assets</h2><button data-close="workflow-dialog" aria-label="Close workflow">×</button></div><div class="dialog-content"><div class="pipeline"><span>MLS / supported registry / saved property<br>WhatsApp text / manual facts / future CRM imports</span><b>↓</b><span>Fetch or extract → human reviews facts</span><b>↓</b><span>Listing: Property + ranked media + Agent + Brand</span><b>＋</b><span>Template: layout + linked fields</span><b>↓</b><span>Listing Agent fills the layout → Design</span><b>↓</b><span>Campaign Agent prepares formats → human review</span><b>↓</b><span>Approved marketing assets</span></div><table><thead><tr><th>Property source</th><th>Availability in this mockup</th></tr></thead><tbody><tr><td>US MLS</td><td>Fictional sample feed; real access needs an authorized provider.</td></tr><tr><td>India state RERA</td><td>Not connected. Project registration is separate from agent registration; unit asking prices and marketing photos are not guaranteed.</td></tr><tr><td>Raw WhatsApp text</td><td>Local sample extraction with fact-by-fact review.</td></tr><tr><td>Saved property</td><td>Reviewed browser-local records.</td></tr><tr><td>Manual entry</td><td>Edit a selected Listing’s facts.</td></tr><tr><td>CRM / developer feeds, CSV, brochures</td><td>Future integrations; not connected.</td></tr><tr><td>Uploads / stored photos</td><td>Property media, not a source of verified facts.</td></tr></tbody></table><p class="hint">Save as Template keeps the layout and links. Save as Design keeps the filled asset. Customize this design changes only that asset.</p></div>`;dlg.showModal();
}
document.addEventListener('click',event=>{
  const b=event.target.closest('button,[data-select]');if(!b)return;
  const intercept=()=>{event.preventDefault();event.stopImmediatePropagation();};
  if(b.dataset.select){intercept();if(b.closest('dialog'))return;selected=b.dataset.select;render();return;}
  if(b.dataset.panel){intercept();const dest=b.dataset.panel;if($('.listing-summary'))listingScroll=$('.panel-scroll').scrollTop;if(dest==='Brand'||dest==='Agent'){startEdit(dest==='Brand'?'brand':'agent');return;}if(dest==='Uploads'){if(state.pending){if(!(screen==='photos'&&draft))draft=clone(state.pending);screen='photos';}panel='Uploads';render();return;}panel=dest;if(dest==='Property'){screen=state.pending?'summary':'source';draft=null;}render();return;}
  if(b.hasAttribute('data-select-result')){intercept();stageListing(lookupResult);return;}
  if(b.hasAttribute('data-save-template')){intercept();openSave('template');return;}
  if(b.dataset.savedListing!==undefined){intercept();stageListing(state.savedListings[+b.dataset.savedListing]);return;}
  if(b.dataset.useTemplate!==undefined){intercept();useTemplate(+b.dataset.useTemplate);return;}
  if(b.dataset.openDesign!==undefined){intercept();openDesign(+b.dataset.openDesign);return;}
  if(b.hasAttribute('data-photo-library')||b.hasAttribute('data-upload')){intercept();if(!draft){toast('Choose a Listing first.');return;}if(b.hasAttribute('data-photo-library'))openLibrary();else $('#photo-upload-v2').click();return;}
  const handled=['link-field','open-fields','save-template','save-design','pack-save-template','source-guide','help','fit-canvas','change-listing','clear-saved-search'];if(!handled.includes(b.id))return;intercept();
  if(b.id==='clear-saved-search'){savedQuery='';render();$('#saved-property-search')?.focus();}
  if(b.id==='link-field'||b.id==='open-fields'){inspectorOpen=!inspectorOpen;render();}
  if(b.id==='save-template')openSave('template');
  if(b.id==='save-design')openSave('design');
  if(b.id==='pack-save-template'){$('#pack-dialog').close();openSave('template');}
  if(b.id==='source-guide'||b.id==='help')openGuide();
  if(b.id==='fit-canvas')fitCanvas();
  if(b.id==='change-listing'){panel='Property';screen='source';lookupResult=null;sourceError='';render();}
},true);
document.addEventListener('submit',event=>{
  const form=event.target;if(form.id!=='lookup-form'&&form.id!=='save-record-form')return;event.preventDefault();event.stopImmediatePropagation();const data=Object.fromEntries(new FormData(form));
  if(form.id==='save-record-form'){const name=data.recordName.trim();if(!name)return;if(activeSave==='template'?saveTemplateRecord(name):saveDesignRecord(name)){$('#save-dialog').close();render();}return;}
  country=data.country;provider=data.provider;lookupId=data.listingId.trim();sourceError='';lookupResult=null;
  if(provider==='unavailable')sourceError='This provider is not connected. Try the sample feed or paste listing text.';
  else{lookupResult=lookupSample(lookupId.toUpperCase(),country);if(!lookupResult)sourceError='No sample match. Try SAMPLE-101 or SAMPLE-102.';}
  render();
},true);
document.addEventListener('change',event=>{if(event.target.dataset.packRule!==undefined)pendingPack[+event.target.dataset.packRule]=event.target.value;if(event.target.id==='photo-rule')pendingPack[state.applied.event==='Just Listed'?0:state.applied.event==='Just Sold'?1:2]=event.target.value;});
document.addEventListener('change',event=>{if(event.target.id==='country'||event.target.id==='provider'){event.stopImmediatePropagation();if(event.target.id==='country'){country=event.target.value;provider='demo';}else provider=event.target.value;lookupResult=null;sourceError='';render();}},true);
document.addEventListener('input',event=>{
  const el=event.target;if(el.name==='listingId')lookupId=el.value;if(el.id==='raw-text')extractText=el.value;
  if(el.id==='saved-property-search'){savedQuery=el.value;const caret=el.selectionStart;render();const input=$('#saved-property-search');input?.focus();if(caret!==null)input?.setSelectionRange(caret,caret);return;}
  if(draft&&el.name){const form=el.closest('form');const target=form?.id==='property-form'?draft.property:form?.id==='agent-form'?draft.agent:form?.id==='brand-form'?draft.brand:null;if(target)target[el.name]=el.value;}
});
document.addEventListener('keydown',event=>{if(!event.target.closest('dialog')&&event.target.matches('[data-select]')&&(event.key==='Enter'||event.key===' ')){event.preventDefault();event.stopImmediatePropagation();selected=event.target.dataset.select;render();}},true);
// Include reviewed text imports in Saved properties without a second store or API.
const baseCommit=commit;
commit=function(next,message){if(next.pending)rememberListing(next,next.pending);return baseCommit(next,message);};
render();
