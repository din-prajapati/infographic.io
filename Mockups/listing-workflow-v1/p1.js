/* P1 integration: explicit reviewed facts, linked editing and checked SVG/PNG downloads. */
'use strict';
const P1=globalThis.listingP1,Core=globalThis.listingCore;
const renderBeforeP1=render,editBeforeP1=editPanel,summaryBeforeP1=summaryPanel,inspectorBeforeP1=inspector;
let p1Import=null,p1ImportError='',p1EditError='',p1LinkedId='',p1LinkedRecord=null,p1ExportError='',p1ExportBusy=false;
function normalizeP1State(next){
  if(next.pending)next.pending=P1.record(next.pending);
  next.applied.record=P1.record(next.applied.record);
  next.savedListings=next.savedListings.map(P1.record);
  for(const design of next.savedDesigns)design.applied.record=P1.record(design.applied.record);
}
normalizeP1State(state);
const commitBeforeP1=commit;
commit=function(next,message){normalizeP1State(next);return commitBeforeP1(next,message);};
resolve=(record,binding)=>P1.source(record,binding);
function p1Snapshot(){return {applied:clone(state.applied),overrides:clone(state.overrides)};}
paper=function(){return `<div class="paper p1-paper">${P1.svg(p1Snapshot(),{editor:true,selected,showLinks})}</div>`;};
function pricingFields(p){
  p=P1.property(p);
  return `<div class="p1-price-fields"><div class="pair"><label class="field"><span>Listing intent</span><select name="transaction" data-p1-price="transaction"><option value="sale" ${p.transaction==='sale'?'selected':''}>For sale</option><option value="rent" ${p.transaction==='rent'?'selected':''}>For rent</option></select></label><label class="field"><span>Currency</span><select name="currency" data-p1-price="currency">${Core.currencies.map(c=>`<option ${p.currency===c?'selected':''}>${c}</option>`).join('')}</select></label></div>${field(Core.priceLabel(p),'price',p.price)}${p.transaction==='rent'?`<label class="field"><span>Rental period</span><select name="rentalPeriod" data-p1-price="rentalPeriod">${Core.rentalPeriods.map(period=>`<option value="${period}" ${p.rentalPeriod===period?'selected':''}>Per ${period}</option>`).join('')}</select></label>`:''}<p class="numeric-price">${p.amount===null?'No valid numeric amount yet':'Numeric amount: '+p.amount.toLocaleString('en-US')+' · '+esc(p.currency)}</p></div>`;
}
editPanel=function(){
  let html=editBeforeP1();
  if(screen==='property'){
    html=html.replace(/<label class="field"><span>Price<\/span><input[^>]*><\/label>/,pricingFields(draft.property));
    html=html.replace(/<label class="field"><span>Floor area<\/span><input[^>]*><\/label>/,`${field('Floor area','area',draft.property.area)}<label class="field"><span>Area unit</span><select name="areaUnit">${['sq ft','sq m','acres'].map(u=>`<option ${draft.property.areaUnit===u?'selected':''}>${u}</option>`).join('')}</select></label>`);
    html=html.replace('<div class="edit-actions">',`${p1EditError?`<p role="alert" class="warning">${esc(p1EditError)}</p>`:''}<div class="edit-actions">`);
  }
  return html;
};
summaryPanel=function(){
  const original=state.pending,display=clone(original),p=P1.property(original.property);
  display.property.price=Core.priceText(p)||original.property.price;
  display.property.area=p.area?`${p.area} ${p.areaUnit}`:'';
  state.pending=display;const html=summaryBeforeP1();state.pending=original;return html;
};
inspector=function(){
  let html=inspectorBeforeP1();
  if(elements[selected].type==='text'){
    const independent=!!state.overrides[selected]?.detached;
    html=html.replace('<details class="customize"',`<div class="linked-edit-actions"><button class="primary full" id="p1-edit-text">${independent?'Edit independent text':'Edit linked text'}</button>${!state.overrides[selected]?'<button class="text-button" id="p1-detach">Detach as independent text</button>':''}${independent?'<button class="full" id="p1-reconnect">Reconnect to selected field</button>':''}<p class="hint">${independent?'Independent text never changes the Listing.':'Linked edits change the pending Listing. Apply updates every linked instance together.'}</p></div><details class="customize"`);
  }
  return html;
};
render=function(){
  renderBeforeP1();
  const reviewButton=$('#review');if(reviewButton)reviewButton.textContent='Review & export';
  const bar=$('.element-bar');if(bar&&elements[selected].type==='text')bar.insertAdjacentHTML('beforeend',`<button class="small" id="p1-toolbar-edit">${state.overrides[selected]?.detached?'Edit independent text':'Edit text'}</button>`);
  const context=$('.contextbar');if(context){const a=state.applied.record,p=P1.property(a.property),pending=state.pending?.id&&state.pending.id!==a.id;context.innerHTML=`<span title="${esc(a.property.address)}">Canvas: ${esc(a.property.name)} · ${p.transaction==='rent'?'For rent':'For sale'}</span><span class="${pending?'pending-source':'demo-note'}">${pending?'Different Listing selected · Apply first':'Local mockup'}</span>`;}
};
function startReviewedImport(message){
  const existing=state.pending?clone(state.pending):null;
  const base=existing||{id:'import-'+crypto.randomUUID(),property:{...blankProperty(),currency:country==='US'?'$':'₹',transaction:'sale',rentalPeriod:'month'},photos:[],agent:clone(state.savedAgents[0]),brand:clone(state.savedBrands[0]),source:'Reviewed text',sourceId:'',suggestions:''};
  const result=Core.extractListing(message),legacy=P1.legacy(base);
  // An explicitly labelled Address line retains its comma-separated city instead of
  // being reduced to the locality token used by the earlier sample extractor.
  const addresses=Array.from(message.matchAll(/(?:^|\n)\s*address\s*:\s*([^\n;]+)/gi));
  if(addresses.length){const options=Array.from(new Map(addresses.map(m=>[m[1].trim(),{value:m[1].trim(),patch:{location:m[1].trim()},source:m[0].trim()}])).values());const candidate={key:'location',label:'Address',status:options.length>1?'ambiguous':'found',options,...(options.length===1?options[0]:{value:'',patch:{},source:''})};const index=result.candidates.findIndex(c=>c.key==='location');if(index<0)result.candidates.push(candidate);else result.candidates[index]=candidate;result.missing=result.missing.filter(k=>k!=='location');}
  p1Import={baseline:P1.record(base),hadPending:!!existing,result,selected:new Set(Core.defaultAccepted(legacy,result)),choices:Object.fromEntries(result.candidates.map(c=>[c.key,c.status==='ambiguous'?'':'0']))};
  p1ImportError='';extractText=message;panel='Property';screen='extraction';render();
}
function importReady(){return p1Import&&!p1Import.result.blocked&&p1Import.selected.size>0&&Array.from(p1Import.selected).every(key=>p1Import.choices[key]!=='');}
extractionPanel=function(){
  if(!p1Import)return `${head('Review source text',true)}<div class="panel-body">Paste text to begin.</div>`;
  const {result,baseline}=p1Import,current=P1.legacy(state.pending||baseline);
  return `${head('Review detected facts',true)}<div class="panel-body"><p class="hint">${p1Import.hadPending?'Review updates to '+esc(baseline.property.name)+'.':'Review a new Listing.'} Existing facts start unchecked. Canvas changes wait for Apply.</p><details class="source-evidence"><summary>Original source text</summary><pre>${esc(result.source)}</pre></details>${result.notices.map(n=>`<p class="warning">${esc(n)}</p>`).join('')}<form id="p1-import-form">${result.candidates.map(c=>`<div class="p1-candidate"><label><input type="checkbox" name="p1-fact" value="${c.key}" ${p1Import.selected.has(c.key)?'checked':''} ${result.blocked?'disabled':''}><strong>${esc(c.label)}</strong><small>${esc(c.status)}</small></label><select data-candidate-choice="${c.key}" aria-label="${esc(c.label)} detected value" ${result.blocked?'disabled':''}>${c.status==='ambiguous'?'<option value="">Choose the intended value</option>':''}${c.options.map((option,i)=>`<option value="${i}" ${p1Import.choices[c.key]===String(i)?'selected':''}>${esc(option.value)}</option>`).join('')}</select><small>Current: ${esc(Core.candidateCurrentValue(current,c.key)||'Empty')}</small><details><summary>Source evidence</summary>${c.options.map(option=>`<p>${esc(option.source)}${option.note?'<br><small>'+esc(option.note)+'</small>':''}</p>`).join('')}</details>${c.note?`<p class="hint">${esc(c.note)}</p>`:''}</div>`).join('')}<details class="source-evidence"><summary>${result.missing.length} fields not detected</summary><p>${esc(result.missing.map(key=>Core.propertyLabels[key]).join(', '))}</p></details><p class="info">Agent identity is never imported from this text. Suggestions remain separate from the saved Agent.</p>${p1ImportError?`<p class="warning" role="alert">${esc(p1ImportError)}</p>`:''}<button id="p1-accept" class="primary full" ${importReady()?'':'disabled'}>Accept selected facts</button><button type="button" class="full" id="revise-text" style="margin-top:8px">Edit source text</button></form></div>`;
};
function acceptReviewedFacts(){
  if(!importReady())throw Error('Choose at least one specific value.');
  if(p1Import.hadPending&&!state.pending)throw Error('The target Listing changed. Review the text again.');
  const selectedCandidates=Array.from(p1Import.selected).map(key=>{const c=p1Import.result.candidates.find(c=>c.key===key);return {...c,...c.options[+p1Import.choices[key]]};});
  const next=P1.acceptImport(state.pending||p1Import.baseline,p1Import.result,selectedCandidates,p1Import.baseline);
  if(next.property.name==='New listing')next.property.name=next.property.address||'Imported listing';
  next.source='Accepted source text · reviewed local extraction';next.sourceId='';next.suggestions=(extractText.match(/(?:agent|broker|contact)\s*:\s*[^\n;]+/ig)||[]).join(' · ');
  if(mutate(s=>{s.pending=next;},'Reviewed facts accepted. Apply to update the artwork.')){screen='summary';p1Import=null;listingScroll=0;render();}
}
function applyPricingForm(p,data){
  const old=P1.property(p);let next=clone(old);
  const changed=data.transaction&&data.transaction!==old.transaction;
  if(changed)next=P1.updateProperty(next,'transaction',data.transaction);
  if(data.currency)next=P1.updateProperty(next,'currency',data.currency);
  if(data.rentalPeriod&&next.transaction==='rent')next=P1.updateProperty(next,'rentalPeriod',data.rentalPeriod);
  if(data.price!==undefined)next=P1.updateProperty(next,'price',data.price.trim());
  return next;
}
function openLinkedEditor(id=selected){
  p1LinkedId=id;p1EditError='';const custom=state.overrides[id],binding=state.bindings[id],slot=binding.slot;
  const independent=!!custom,sourceRecord=state.pending||state.applied.record,p=P1.property(sourceRecord.property),dialog=$('#linked-dialog');
  p1LinkedRecord=P1.record(sourceRecord);
  let controls;
  if(independent)controls=`<label class="field"><span>Independent / custom text</span><textarea name="fieldValue" rows="4">${esc(custom.value)}</textarea></label><p class="hint">This edits the Design only. The Listing and reusable Template are unchanged.</p>`;
  else if(slot==='property.price')controls=pricingFields(p);
  else if(slot==='property.specs')controls=`<div class="pair">${field('Bedrooms','beds',p.beds,'number')}${field('Bathrooms','baths',p.baths,'number')}</div>${field('Floor area','area',p.area)}<label class="field"><span>Area unit</span><select name="areaUnit">${['sq ft','sq m','acres'].map(u=>`<option ${p.areaUnit===u?'selected':''}>${u}</option>`).join('')}</select></label><p class="hint">The combined line is derived from these fields; it is not parsed back from free text.</p>`;
  else if(binding.slot)controls=`<label class="field"><span>${esc(friendly(slot))}</span><textarea name="fieldValue" rows="4">${esc(P1.source(sourceRecord,binding))}</textarea></label>`;
  else controls='<p class="warning">Link a field or customize this Design before editing text.</p>';
  dialog.innerHTML=`<div class="dialog-head"><h2>${independent?'Edit independent text':'Edit linked '+esc(elements[id].name.toLowerCase())}</h2><button data-close="linked-dialog" aria-label="Close text editor">×</button></div><form id="p1-linked-form"><div class="dialog-content">${controls}<p id="p1-linked-error" class="warning" role="alert" hidden></p>${!independent?'<p class="info">Save stages a Listing change. Apply to design updates all elements linked to that field.</p>':''}</div><div class="dialog-foot"><button type="button" data-close="linked-dialog">Cancel</button><button class="primary">${independent?'Save custom text':'Save listing change'}</button></div></form>`;dialog.showModal();
}
function detachText(id=selected){
  mutate(s=>{s.overrides[id]={value:displayed(id),detached:true,previousBinding:clone(s.bindings[id])};s.bindings[id].slot='';s.applied.bindings[id].slot='';s.approved=false;},'Text detached. Appearance kept; Listing unchanged.');render();
}
function reconnectText(id=selected){
  const binding=state.bindings[id].slot?clone(state.bindings[id]):state.overrides[id]?.previousBinding;
  if(!binding?.slot){toast('Choose a linked field first.');return;}
  mutate(s=>{s.bindings[id]=clone(binding);s.applied.bindings[id]=clone(binding);delete s.overrides[id];const value=resolve(s.applied.record,binding);if(value)s.applied.values[id]=value;s.approved=false;},'Using the applied linked value. Apply for pending Listing updates.');render();
}
function exportToken(){return JSON.stringify({applied:state.applied,overrides:state.overrides,bindings:state.bindings,pending:state.pending});}
function exportReady(){return !p1ExportBusy&&P1.issues(state).errors.length===0&&!!$('#p1-review-confirm')?.checked;}
review=function(){
  const checks=P1.issues(state),dialog=$('#review-dialog');p1ExportError='';
  dialog.innerHTML=`<div class="dialog-head"><div><span class="eyebrow">Checked artwork · 1080 × 1440</span><h2>Review & export</h2></div><button data-close="review-dialog" aria-label="Close export review">×</button></div><div class="dialog-content p1-export-grid"><div class="export-art">${P1.svg(p1Snapshot())}</div><div><h3>${esc(state.applied.record.property.name)}</h3><p class="hint">${esc(Core.priceText(state.applied.record.property))} · ${esc(state.applied.record.agent.name)}</p>${checks.errors.length?`<div class="warning"><strong>Resolve ${checks.errors.length} checks before download</strong><ul>${checks.errors.map(e=>`<li>${esc(e)}</li>`).join('')}</ul></div>`:'<p class="export-pass">✓ Linked values are current and required facts fit the layout.</p>'}${checks.warnings.length?`<div class="info"><strong>Review custom values</strong><ul>${checks.warnings.map(w=>`<li>${esc(w)}</li>`).join('')}</ul></div>`:''}<label class="check-line"><input id="p1-review-confirm" type="checkbox"> I reviewed the facts, photos and any custom values.</label><p id="p1-export-error" class="warning" role="alert" hidden></p><p id="review-status" class="hint">${state.approved?'Approved locally.':'Awaiting review.'}</p><button id="approve" class="full" disabled>Approve design</button><div class="button-pair"><button id="p1-download-svg" class="primary" disabled>Download SVG</button><button id="p1-download-png" class="primary" disabled>Download PNG</button></div><p class="demo-note">Real local file downloads. No publishing or campaign scheduling.</p></div></div>`;dialog.showModal();
};
function refreshExportControls(){for(const id of ['approve','p1-download-svg','p1-download-png']){const button=$('#'+id);if(button)button.disabled=!exportReady();}}
async function embeddedImages(snapshot){
  const result={};
  for(const id of ['brand','hero','portrait']){
    const src=P1.display(snapshot,id);if(src.startsWith('data:')){result[id]=src;continue;}
    const response=await fetch(src);if(!response.ok)throw Error('Could not load the '+id+' image.');const blob=await response.blob();
    if(!blob.type.startsWith('image/'))throw Error('The '+id+' asset is not an image.');
    result[id]=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(Error('Cannot embed '+id));reader.onload=()=>resolve(reader.result);reader.readAsDataURL(blob);});
  }
  return result;
}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
async function downloadArtwork(format){
  if(!exportReady()){toast('Resolve the checks and confirm your review first.');return;}
  p1ExportBusy=true;refreshExportControls();const token=exportToken(),snapshot=p1Snapshot();
  const ensureCurrent=()=>{if(token!==exportToken()||P1.issues(state).errors.length)throw Error('The Design changed during export. Review it again.');};
  try{
    const images=await embeddedImages(snapshot);ensureCurrent();const vector=P1.svg(snapshot,{images}),blob=new Blob([vector],{type:'image/svg+xml;charset=utf-8'});
    const filename=(snapshot.applied.record.property.name||'listing').replace(/[^a-z0-9_-]+/gi,'-');
    if(format==='svg')downloadBlob(blob,filename+'.svg');
    else{
      const url=URL.createObjectURL(blob);try{const img=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Unable to render the SVG for PNG export.'));image.src=url;});ensureCurrent();const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1440;canvas.getContext('2d').drawImage(img,0,0);const png=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('PNG encoding failed.')),'image/png'));ensureCurrent();downloadBlob(png,filename+'.png');}finally{URL.revokeObjectURL(url);}
    }
    toast(format.toUpperCase()+' downloaded.');
  }catch(error){p1ExportError=error.message;const node=$('#p1-export-error');if(node){node.hidden=false;node.textContent=p1ExportError;}}
  finally{p1ExportBusy=false;refreshExportControls();}
}
document.addEventListener('submit',event=>{
  const form=event.target;if(!['extract-form','p1-import-form','property-form','p1-linked-form'].includes(form.id))return;event.preventDefault();event.stopImmediatePropagation();const data=Object.fromEntries(new FormData(form));
  if(form.id==='extract-form'){startReviewedImport(data.message);return;}
  if(form.id==='p1-import-form'){try{acceptReviewedFacts();}catch(error){p1ImportError=error.message;render();}return;}
  if(form.id==='property-form'){
    try{let p=applyPricingForm(draft.property,data);for(const [key,value] of Object.entries(data))if(!['price','currency','transaction','rentalPeriod'].includes(key))p=P1.updateProperty(p,key,value);if(p.transaction==='rent'&&!['For rent','Rented'].includes(p.status)||p.transaction==='sale'&&!['Active sale','Sold'].includes(p.status))throw Error('Choose a status matching the selected sale/rent intent.');draft.property=p;p1EditError='';saveDraft();}catch(error){p1EditError=error.message;render();}return;
  }
  try{
    const id=p1LinkedId,binding=state.bindings[id],custom=state.overrides[id];
    if(custom){if(!data.fieldValue.trim())throw Error('Enter text for this Design.');if(custom.previousBinding?.slot==='property.price'||binding.slot==='property.price')Core.parsePrice(data.fieldValue,P1.property(state.applied.record.property).currency);mutate(s=>{s.overrides[id].value=data.fieldValue;s.approved=false;},'Independent text saved. Listing unchanged.');}
    else{const current=state.pending||state.applied.record;let edited;if(binding.slot==='property.price'){edited=P1.record(current);edited.property=applyPricingForm(edited.property,data);}else edited=P1.editField(current,binding.slot,binding.slot==='property.specs'?data:data.fieldValue);mutate(s=>{s.pending=edited;},'Linked field staged. Apply to update every instance.');}
    $('#linked-dialog').close();render();
  }catch(error){const node=$('#p1-linked-error');node.hidden=false;node.textContent=error.message;}
},true);
document.addEventListener('change',event=>{
  const el=event.target;
  if(el.name==='p1-fact'){el.checked?p1Import.selected.add(el.value):p1Import.selected.delete(el.value);$('#p1-accept').disabled=!importReady();return;}
  if(el.dataset.candidateChoice){p1Import.choices[el.dataset.candidateChoice]=el.value;$('#p1-accept').disabled=!importReady();return;}
  if(el.id==='p1-review-confirm'){refreshExportControls();return;}
  if(el.dataset.p1Price){event.stopImmediatePropagation();try{if(el.closest('#property-form')){draft.property=P1.updateProperty(draft.property,el.dataset.p1Price,el.value);p1EditError='';render();}else{const fields=el.closest('.p1-price-fields');let current=P1.property(p1LinkedRecord.property);if(el.dataset.p1Price!=='transaction'){const raw=fields.querySelector('[name=price]').value;current=P1.updateProperty(current,'price',raw);}current=P1.updateProperty(current,el.dataset.p1Price,el.value);p1LinkedRecord.property=current;fields.outerHTML=pricingFields(current);}}catch(error){toast(error.message);}return;}
  if(el.id==='binding'&&el.value===''){event.stopImmediatePropagation();if(elements[selected].type==='text')detachText();return;}
},true);
document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  const ids=['p1-toolbar-edit','p1-edit-text','p1-detach','p1-reconnect','clear-override','override-save','approve','p1-download-svg','p1-download-png'];if(!ids.includes(button.id))return;event.preventDefault();event.stopImmediatePropagation();
  if(button.id==='p1-toolbar-edit'||button.id==='p1-edit-text'){openLinkedEditor();return;}
  if(button.id==='p1-detach'){detachText();return;}
  if(button.id==='p1-reconnect'||button.id==='clear-override'){reconnectText();return;}
  if(button.id==='override-save'){const value=$('#override-text').value;try{if(!value.trim())throw Error('Enter custom text.');if(state.bindings[selected].slot==='property.price')Core.parsePrice(value,P1.property(state.applied.record.property).currency);mutate(s=>{s.overrides[selected]={value};s.approved=false;},'Custom text saved for this Design only.');render();}catch(error){toast(error.message);}return;}
  if(button.id==='approve'){if(exportReady()){mutate(s=>{s.approved=true;});$('#review-status').textContent='Approved locally. Download the checked artwork below.';}return;}
  void downloadArtwork(button.id==='p1-download-svg'?'svg':'png');
},true);
document.addEventListener('dblclick',event=>{const target=event.target.closest('[data-select]');if(!target||target.closest('dialog')||elements[target.dataset.select]?.type!=='text')return;event.preventDefault();openLinkedEditor(target.dataset.select);});
render();
