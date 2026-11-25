/* Pure adapters, validation and shared SVG artwork. No APIs, AI calls or production storage. */
(function(){
  const C=globalThis.listingCore,copy=v=>structuredClone(v);
  const xml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const imageUri=src=>{
    if(/^data:image\/svg\+xml[^,]*,/.test(src)&&!src.slice(0,src.indexOf(',')).includes(';base64')){
      const svg=decodeURIComponent(src.slice(src.indexOf(',')+1));
      return 'data:image/svg+xml;base64,'+btoa(encodeURIComponent(svg).replace(/%([0-9A-F]{2})/g,(_,hex)=>String.fromCharCode(parseInt(hex,16))));
    }
    return src;
  };
  const textSlots={'property.headline':'Headline','property.price':'Price','property.location':'Address','property.specs':'Specifications','property.description':'Description','property.features':'Features','agent.name':'Agent name','agent.phone':'Agent phone','agent.email':'Agent email','agent.rera':'Registration','brand.name':'Agency','agent.cta':'Signature'};
  function property(input){
    const p=copy(input),intent=p.transaction||(/rent/i.test(p.status||'')?'rent':'sale');
    const priced=C.normalizePricing({...p,transaction:intent,currency:p.currency||'₹'});
    Object.assign(p,{amount:priced.amount,currency:priced.currency,transaction:priced.transaction,rentalPeriod:priced.rentalPeriod});
    if(priced.amount!==null)p.price=C.priceText(priced);
    p.areaUnit ||= 'sq ft';
    const area=String(p.area||'').trim().match(/^([\d,]+(?:\.\d+)?)\s*(sq\.?\s*ft|sqft|sq\.?\s*m|sqm|m²|acres?)?$/i);
    if(area){p.area=area[1];if(area[2])p.areaUnit=/acre/i.test(area[2])?'acres':/sqm|m²|sq\.?\s*m$/i.test(area[2])?'sq m':'sq ft';}
    return p;
  }
  function record(input){const r=copy(input);r.property=property(r.property);return r;}
  function updateProperty(input,key,value){
    let p=property(input);const originalIntent=p.transaction;
    if(['price','currency','transaction','rentalPeriod'].includes(key)){
      if(key==='currency'||key==='rentalPeriod'){
        const parsed=p.price?C.parsePrice(p.price,p.currency):null;
        if(parsed)p.price=parsed.price;
      }
      Object.assign(p,C.pricingPatch(p,key,value));
      if(key==='transaction')p.status=value==='rent'?'For rent':'Active sale';
      if(p.transaction!==originalIntent)p.status=p.transaction==='rent'?'For rent':'Active sale';
      if(p.price)p.price=C.priceText(p);
      return p;
    }
    if(['beds','baths'].includes(key)&&value!==''&&!/^\d+(?:\.\d+)?$/.test(String(value)))throw Error('Enter a non-negative number for '+key+'.');
    if(key==='area'&&value!==''&&!/^[\d,]+(?:\.\d+)?$/.test(String(value)))throw Error('Enter the area as a number and choose its unit.');
    if(key==='areaUnit'&&!['sq ft','sq m','acres'].includes(value))throw Error('Choose a supported area unit.');
    if(key==='headline'&&String(value).length>105)throw Error('Keep the headline within 105 characters.');
    p[key]=value;return p;
  }
  function source(r,b){
    const p=property(r.property),a=r.agent,bk=r.brand;
    if(!b?.slot)return '';
    const photos=r.photos||[];
    const role={hero:'Hero',exterior:'Exterior',interior:'Interior',area:'Area'}[b.rule];
    const photo=b.rule==='rank2'?(photos[1]||photos[0]):b.rule==='rank3'?(photos[2]||photos[0]):photos.find(p=>p.role===role)||(b.rule==='hero'?photos.find(p=>p.role==='Exterior'):null)||photos[0];
    return ({'property.headline':p.headline,'property.price':C.priceText(p),'property.location':p.address,
      'property.specs':[p.beds!==''&&p.beds!=null?`${p.beds} BEDS`:'',p.baths!==''&&p.baths!=null?`${p.baths} BATHS`:'',p.area?`${p.area} ${p.areaUnit}`:''].filter(Boolean).join(' · '),
      'property.description':p.description,'property.features':p.features,'agent.name':a.name,'agent.phone':a.phone,'agent.email':a.email,'agent.rera':a.license,
      'brand.name':a.agency,'agent.cta':bk.tagline,'agent.photo':a.photo,'brand.logo':bk.logo,'property.heroImage':photo?.src,'property.galleryImage':photo?.src})[b.slot]||'';
  }
  function legacy(r){
    const p=property(r.property),priced=C.normalizePricing(p);
    return {id:r.id||r.sourceId||'new-import',property:{headline:p.headline||'',type:p.propertyType||'',price:priced.price||'',amount:priced.amount,currency:priced.currency,transaction:p.transaction,rentalPeriod:p.rentalPeriod,location:p.address||'',beds:p.beds??'',baths:p.baths??'',area:p.area||'',areaUnit:p.areaUnit,areaType:p.areaType||'',features:p.features||'',possession:p.possession||''},meta:copy(r.meta||{fields:{},imports:[]})};
  }
  function acceptImport(current,result,candidates,baseline){
    const accepted=C.applyReviewedImport(legacy(current),result,candidates,legacy(baseline));
    const r=record(current),previous=r.property.transaction;
    for(const key of ['headline','price','amount','currency','transaction','rentalPeriod','beds','baths','area','areaUnit','areaType','features','possession'])r.property[key]=accepted.property[key];
    r.property.address=accepted.property.location;r.property.propertyType=accepted.property.type;
    if(previous!==r.property.transaction)r.property.status=r.property.transaction==='rent'?'For rent':'Active sale';
    r.property=property(r.property);r.meta=accepted.meta;return r;
  }
  function editField(input,slot,value){
    const r=record(input),propertyKeys={'property.headline':'headline','property.price':'price','property.location':'address','property.description':'description','property.features':'features'};
    if(slot==='property.specs'){
      for(const key of ['beds','baths','area','areaUnit'])r.property=updateProperty(r.property,key,value[key]);
    }else if(propertyKeys[slot])r.property=updateProperty(r.property,propertyKeys[slot],value);
    else if(slot==='agent.cta')r.brand.tagline=String(value);
    else {
      const key={'agent.name':'name','agent.phone':'phone','agent.email':'email','agent.rera':'license','brand.name':'agency'}[slot];
      if(!key)throw Error('Choose a supported linked text field.');
      if(key==='phone'&&value&&!/^\+?[\d\s().-]{6,28}$/.test(value))throw Error('Enter a valid phone number.');
      if(key==='email'&&value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))throw Error('Enter a valid email address.');
      r.agent[key]=String(value);
    }
    r.meta ||= {fields:{},imports:[]};r.meta.fields ||= {};r.meta.fields[slot]={origin:'manual-canvas-edit',updatedAt:new Date().toISOString()};return r;
  }
  function display(snapshot,id){return snapshot.overrides[id]?.value??snapshot.applied.values[id]??'';}
  const boxes={brand:[44,40,640,72],hero:[44,145,992,610],headline:[44,833,992,156],price:[44,1029,600,95],specs:[680,1048,356,72],address:[44,1152,992,72],portrait:[44,1250,108,108],agent:[180,1250,570,47],phone:[180,1300,570,43],signature:[800,1265,236,86]};
  const textStyle={headline:[70,2,'Georgia, serif'],price:[56,1,'Arial, sans-serif'],specs:[22,2,'Arial, sans-serif'],address:[28,2,'Arial, sans-serif'],agent:[30,1,'Arial, sans-serif'],phone:[25,1,'Arial, sans-serif'],signature:[23,3,'Arial, sans-serif']};
  function lines(text,width,font){
    const output=[];let line='';
    const units=s=>Array.from(s).reduce((n,c)=>n+(/[ilI1.,:;!\s]/.test(c)?.3:/[MW@]/.test(c)?.95:.57),0)*font;
    for(const word of String(text).split(/\s+/)){if(line&&units(line+' '+word)>width){output.push(line);line=word;}else line+=(line?' ':'')+word;}
    if(line)output.push(line);return {lines:output,tooWide:output.some(s=>units(s)>width)};
  }
  function svg(snapshot,{images={},editor=false,selected='',showLinks=false}={}){
    const accent=snapshot.applied.record.brand.accent,p=property(snapshot.applied.record.property),imageKeys=['brand','hero','portrait'];
    const group=(id,body)=>{
      const [x,y,w,h]=boxes[id],binding=snapshot.applied.bindings[id];
      const label=snapshot.overrides[id]?(snapshot.overrides[id].detached?'Independent':'Custom value'):textSlots[binding?.slot]||({hero:'Property photo',brand:'Brand logo',portrait:'Agent photo'}[id]);
      return `<g ${editor?`data-select="${id}" role="button" tabindex="0" aria-label="Select ${xml(id==='hero'?'Main photograph':id==='portrait'?'Agent photograph':id==='brand'?'Brand logo':textSlots[binding?.slot]||id)}"`:''}>${body}${editor&&selected===id?`<rect x="${x-7}" y="${y-7}" width="${w+14}" height="${h+14}" fill="none" stroke="#0e9989" stroke-width="5" pointer-events="none"/>`:''}${editor&&showLinks?`<g pointer-events="none"><rect x="${x}" y="${y-23}" width="${Math.max(130,String(label).length*14)}" height="27" rx="4" fill="#08796a"/><text x="${x+8}" y="${y-4}" fill="white" font-family="Arial" font-size="20">${xml(label)}</text></g>`:''}</g>`;
    };
    let body=`<defs><clipPath id="photo-clip"><rect x="44" y="145" width="992" height="610" rx="7"/></clipPath><clipPath id="portrait-clip"><circle cx="98" cy="1304" r="54"/></clipPath></defs><rect width="1080" height="1440" fill="white"/>`;
    for(const id of imageKeys){const [x,y,w,h]=boxes[id];body+=group(id,`<image x="${x}" y="${y}" width="${w}" height="${h}" href="${xml(imageUri(images[id]||display(snapshot,id)))}" preserveAspectRatio="${id==='brand'?'xMinYMid meet':'xMidYMid slice'}" ${id==='hero'?'clip-path="url(#photo-clip)"':id==='portrait'?'clip-path="url(#portrait-clip)"':''}/>`);}
    body+=`<text x="44" y="800" font-family="Arial,sans-serif" font-size="28" font-weight="700" letter-spacing="4" fill="${xml(accent)}">${xml(snapshot.applied.event.toUpperCase())} · ${p.transaction==='rent'?'FOR RENT':'FOR SALE'}</text>`;
    for(const [id,[size,max,font]] of Object.entries(textStyle)){
      const [x,y,w]=boxes[id],layout=lines(display(snapshot,id),w,size);
      const fill=id==='price'||id==='signature'?accent:'#183e42',weight=['price','agent'].includes(id)?'700':'400';
      body+=group(id,`<text x="${x}" y="${y+size}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${xml(fill)}">${layout.lines.slice(0,max).map((line,i)=>`<tspan x="${x}" dy="${i?size*1.1:0}">${xml(line)}</tspan>`).join('')}</text>`);
    }
    body+='<path d="M44 1135H1036" stroke="#dbe5e1" stroke-width="2"/><text x="540" y="1403" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" letter-spacing="4" fill="#6f8f88">A HOME FOR YOUR NEXT CHAPTER</text>';
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1080" height="1440" viewBox="0 0 1080 1440" ${editor?'class="linked-svg" aria-label="Marketing asset artwork"':''}>${body}</svg>`;
  }
  function issues(s){
    const errors=[],warnings=[],r=record(s.applied.record),p=r.property;
    const add=message=>{if(!errors.includes(message))errors.push(message);};
    if(s.applied.mode==='flat'||s.applied.flatImage)add('This flat poster needs extraction or regeneration before a checked export.');
    for(const [value,label] of [[p.headline,'property headline'],[p.address,'address'],[r.agent.name,'agent name'],[r.agent.phone,'agent phone']])if(!String(value||'').trim())add('Add the '+label+'.');
    try{if(!p.price)throw Error();const parsed=C.parsePrice(p.price,p.currency);if(parsed.amount!==p.amount)add('Review the numeric price and currency.');}catch{add('Enter a valid asking price or rent.');}
    if(!C.currencies.includes(p.currency))add('Choose a supported currency.');
    if(!['sale','rent'].includes(p.transaction))add('Choose sale or rent.');
    if(p.transaction==='rent'&&!C.rentalPeriods.includes(p.rentalPeriod))add('Choose the rental period.');
    if(p.transaction==='sale'&&['For rent','Rented'].includes(p.status)||p.transaction==='rent'&&['Active sale','Sold'].includes(p.status))add('Listing status and sale/rent intent do not match.');
    if(Object.entries(s.applied.bindings).some(([id,b])=>b.slot==='property.specs'&&!s.overrides[id])){
      if(!/^\d+(?:\.\d+)?$/.test(String(p.beds))||!/^\d+(?:\.\d+)?$/.test(String(p.baths)))add('Add numeric bedrooms and bathrooms for the specifications.');
      if(!Number.isFinite(Number(String(p.area).replaceAll(',','')))||Number(String(p.area).replaceAll(',',''))<=0)add('Add a valid floor area.');
      if(!['sq ft','sq m','acres'].includes(p.areaUnit))add('Choose a supported area unit.');
    }
    if(p.transaction==='sale'&&/for rent|rented/i.test(s.applied.event))add('The template says rent but the Listing is for sale.');
    if(p.transaction==='rent'&&/just sold/i.test(s.applied.event))add('The template says sold but the Listing is for rent.');
    if(/just sold/i.test(s.applied.event)&&p.status!=='Sold')add('Confirm Sold status before exporting a Just Sold asset.');
    if(/just rented/i.test(s.applied.event)&&p.status!=='Rented')add('Confirm Rented status before exporting a Just Rented asset.');
    for(const [id,binding] of Object.entries(s.applied.bindings)){
      const value=display(s,id);
      if(!value||/\[[^\]]+\]/.test(value))add('Replace the missing value or placeholder in '+id+'.');
      if(/^data:image\/svg/.test(value)&&decodeURIComponent(value).includes('ADD IMAGE'))add('Add a real image for '+id+'.');
      if(binding.slot&&!s.overrides[id]&&String(source(r,binding))!==String(s.applied.values[id]))add('The '+id+' element is outdated. Apply Listing updates.');
      if(!s.overrides[id]&&s.bindings[id]&&JSON.stringify(s.bindings[id])!==JSON.stringify(binding))add('A field link changed. Apply it before export.');
      if(s.pending&&binding.slot&&!s.overrides[id]&&source(s.pending,s.bindings[id])!==s.applied.values[id])add('Pending Listing changes have not reached the artwork. Apply them first.');
    }
    if(s.pending){if((s.pending.id||'')!==(r.id||''))add('The selected Listing differs from the artwork. Apply it first.');if(s.pending.brand.accent!==r.brand.accent)add('The brand colour update is not applied.');const pp=property(s.pending.property);for(const k of ['amount','currency','transaction','rentalPeriod'])if(pp[k]!==p[k])add('Price or listing-intent changes are pending. Apply them first.');}
    for(const [id,[size,max]] of Object.entries(textStyle)){const layout=lines(display(s,id),boxes[id][2],size);if(layout.tooWide||layout.lines.length>max)add('The '+id+' text does not fit. Shorten it before export.');}
    for(const [id,custom] of Object.entries(s.overrides)){warnings.push(id+': custom value retained for this Design.');const slot=custom.previousBinding?.slot||s.applied.bindings[id]?.slot;if(slot==='property.price'){try{C.parsePrice(custom.value,p.currency);}catch{add('The custom price must be a valid amount.');}}}
    if(!r.photos.length&&!s.overrides.hero)add('Add property photos or explicitly choose a custom property image.');
    return {errors,warnings};
  }
  globalThis.listingP1={property,record,updateProperty,source,legacy,acceptImport,editField,display,svg,issues,lines,textStyle,boxes};
})();
