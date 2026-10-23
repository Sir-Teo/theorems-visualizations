import {createHash} from 'node:crypto';
import {escape as esc,renderOverview} from '../orientation/render.mjs';
import {overviewDigest} from '../orientation/contract.mjs';
import {canonicalBase} from './static-ideas.mjs';
const insist=(ok,message)=>{if(!ok)throw new Error(message);};
const text=v=>typeof v==='string'&&v.trim().length>0;
export const hash=v=>createHash('sha256').update(v).digest('hex');
export const json=v=>JSON.stringify(v,null,2)+'\n';
export const NAV_CODE=['scripts/domain-navigation.mjs','scripts/build-domain-navigation.mjs','navigation/filter.mjs','navigation/ui.mjs','navigation/style.css'];
export function replaceOnce(html,before,after){insist(html.split(before).length===2,'Unknown navigation adapter structure: '+before.slice(0,90));return html.replace(before,after);}
const link=(href,label)=>`<a href="${esc(href)}">${esc(label)}</a>`;
const idsOf=data=>data.catalog.overviews.map(r=>r.domainId);
function domains(decision,data){
  insist(Array.isArray(decision?.domains)&&decision.domains.length>0&&new Set(decision.domains.map(x=>x?.id)).size===decision.domains.length,'Missing or duplicate distribution domains');
  for(const d of decision.domains)insist(data.catalog.overviews.some(r=>r.domainId===d?.id&&r.revision===d.revision),'Unknown orientation revision in decision');
  return decision.domains.map(x=>x.id);
}
function evidence(ref,readEvidence){insist(/^docs\/(?:releases|verification)\/[a-z0-9/.-]+\.(?:md|json)$/.test(ref?.path||'')&&!ref.path.includes('..')&&/^[a-f0-9]{64}$/.test(ref.sha256||''),'Unsafe or unbound navigation evidence');const body=readEvidence(ref.path);insist(hash(body)===ref.sha256,'Navigation evidence changed');return body;}
function independent(reviewer,author){insist(text(reviewer?.id)&&text(reviewer.role)&&reviewer.id!==author&&reviewer.independent===true,'Independent navigation reviewer missing');}
function authorize(d,data,{navigationDigest,sourceArtifactDigest,base,readEvidence},historical=false){
  const ids=domains(d,data);
  insist(d.schemaVersion===1&&d.decision==='approve-domain-navigation'&&d.catalogVersion===data.catalog.catalogVersion,'Unknown domain distribution decision');
  insist(d.sourceDigest===overviewDigest(data,ids)&&d.sourceArtifactDigest===sourceArtifactDigest,'Domain source review binding changed');
  insist(/^[a-f0-9]{64}$/.test(d.navigationDigest||'')&&canonicalBase(d.canonicalBase)&&(!historical?d.navigationDigest===navigationDigest&&d.canonicalBase===base:true),'Domain delivery or destination binding changed');
  insist(text(d.authorizedBy)&&/^\d{4}-\d{2}-\d{2}$/.test(d.authorizedOn||'')&&text(d.scope),'Domain distribution authorization missing');
  const sourceIds=[...new Set(data.catalog.overviews.filter(r=>ids.includes(r.domainId)).flatMap(r=>r.sourceIds))];
  const expected=[...sourceIds,'original-editorial-material','navigation-software'].sort();
  insist(Array.isArray(d.materials)&&d.materials.map(m=>m?.id).sort().join()===expected.join(),'Distribution decision must cover the selected sources, editorial material and navigation software');
  for(const m of d.materials){insist(text(m.basis)&&text(m.territories)&&text(m.scope),'Domain material distribution scope missing');independent(m.reviewer,data.catalog.review.author);evidence(m.evidence,readEvidence);}
  independent(d.engineering?.reviewer,data.catalog.review.author);evidence(d.engineering?.evidence,readEvidence);return ids;
}
export function resolveDomainReleases(ledger,data,context){
  insist(ledger?.schemaVersion===1&&Array.isArray(ledger.events),'Invalid navigation release ledger');
  const base=canonicalBase(context.base);insist(base,'Domain release requires a canonical base');context={...context,base};const states=new Map();
  for(const event of ledger.events){
    insist(['publish','withdraw'].includes(event?.type),'Unknown domain release event');const d=JSON.parse(evidence(event.evidence,context.readEvidence)),ids=domains(d,data);
    if(event.type==='publish'){
      authorize(d,data,context,true);
      for(const id of ids){insist(states.get(id)?.state!=='withdrawn','Withdrawn orientation needs a new reviewed revision and explicit ledger migration');states.set(id,{id,revision:data.catalog.overviews.find(r=>r.domainId===id).revision,state:'published',decision:d});}
    }else{
      insist(d.schemaVersion===1&&d.decision==='withdraw-domain-orientations'&&text(d.authorizedBy)&&/^\d{4}-\d{2}-\d{2}$/.test(d.authorizedOn||'')&&text(d.reason),'Domain withdrawal decision missing');
      for(const id of ids){insist(states.get(id)?.state==='published','Domain withdrawal requires a previous release');states.set(id,{id,revision:data.catalog.overviews.find(r=>r.domainId===id).revision,state:'withdrawn',reason:d.reason});}
    }
  }
  for(const s of states.values())if(s.state==='published')authorize(s.decision,data,context);
  return [...states.values()];
}
function liveEditions(catalog,data){
  insist(catalog?.schemaVersion===1&&Array.isArray(catalog.explorations),'Missing delivered exploration catalog');
  insist(catalog.explorations.every(x=>catalog.mode==='preview'?x.state==='preview':['published','withdrawn'].includes(x.state)),'Unsupported exploration delivery status');
  const live=catalog.explorations.filter(x=>x.state==='preview'||x.state==='published');
  for(const x of live){
    const expected=`explore/${x.id}/`;insist(x.href===expected&&Array.isArray(x.domainIds)&&x.domainIds.every(id=>idsOf(data).includes(id)),'Malformed delivered exploration link');
    const p=data.pilotLinks.filter(p=>p.id===x.id);insist(p.length&&p.every(p=>p.status==='accepted'&&p.revision===x.currentRevision&&p.title===x.title)&&p.map(p=>p.domainId).sort().join()===x.domainIds.slice().sort().join(),'Exploration context differs from reviewed orientation');
  }
  insist(new Set(live.map(x=>x.id)).size===live.length,'Duplicate delivered exploration');return live;
}
function shell(title,body,{depth=1,path='domains/',mode,base,indexable=false,script=false}={}){
  const prefix='../'.repeat(depth);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="${indexable?'index,follow':'noindex,nofollow'}">${indexable?`<link rel="canonical" href="${esc(base+path)}">`:''}<title>${esc(title)} · Knowledge atlas</title><link rel="stylesheet" href="${prefix}assets/domain-navigation/orientation.css"><link rel="stylesheet" href="${prefix}assets/domain-navigation/delivery.css"></head><body><a class="skip" href="#main">Skip to content</a><header><a class="brand" href="${prefix}">Ideas, Visualized</a><span>${mode==='preview'?'Local navigation preview':'Knowledge atlas'}</span></header><main id="main" tabindex="-1"><nav class="domain-nav" aria-label="Atlas sections">${link(prefix+'ideas/','Reading library')}${link(prefix+'explore/','Exploration editions')}${link(prefix+'domains/','Fields of knowledge')}</nav>${body}</main><footer><p>Orientations are starting points with visible limits, not lessons or complete domain coverage.</p>${link(prefix+'domains/about/','Source review and delivery scope')}</footer>${script?`<script type="module" src="${prefix}assets/domain-navigation/ui.mjs"></script>`:''}</body></html>\n`;
}
function originalPilotBlock(data,r){
  const pilots=data.pilotLinks.filter(p=>p.domainId===r.domainId&&p.status!=='withdrawn');
  return pilots.length?'<h3>Local pilots</h3><ul class="link-list">'+pilots.map(p=>'<li>'+link('../../'+p.id+'/',p.title)+' <span class="meta">'+(p.status==='accepted'?'locally accepted under scoped AI review':'prototype in review')+'</span></li>').join('')+'</ul>':'';
}
export function adaptOverview(data,r,{mode,base,states,editions}){
  let html=renderOverview(data,r);const root='../../',id=r.domainId;
  html=replaceOnce(html,link('../','All 30 domains'),link('../','Available fields'));
  html=replaceOnce(html,'href="../../../../orientation/style.css"',`href="${root}assets/domain-navigation/orientation.css"`);
  html=replaceOnce(html,'href="../../../../"',`href="${root}"`);
  html=replaceOnce(html,link('../../../../docs/coverage/overviews.md','Research, review and maintenance record'),link('../about/','Source review and delivery scope'));
  html=replaceOnce(html,'<span>Knowledge atlas · local preview</span>',`<span>${mode==='preview'?'Knowledge atlas · local navigation preview':'Knowledge atlas · orientation'}</span>`);
  for(const m of data.collectionLinks.filter(m=>m.domainId===id))html=replaceOnce(html,`href="../../../../#/c/${m.collectionId}"`,`href="${root}ideas/collections/${m.collectionId}/"`);
  const pilots=originalPilotBlock(data,r),available=editions.filter(x=>x.domainIds.includes(id));
  const replacement='<h3>Exploration editions</h3>'+(available.length?'<ul class="link-list">'+available.map(x=>'<li>'+link(root+x.href,x.title)+` <span class="meta">Edition ${esc(x.currentRevision)} · ${mode==='preview'?'reviewed local preview':'separately released exploration'}</span></li>`).join('')+'</ul>':'<p>No exploration edition is available here. The external reading step remains a starting point.</p>');
  if(pilots)html=replaceOnce(html,pilots,replacement);else html=replaceOnce(html,'</section><section><h2>Neighboring fields</h2>',replacement+'</section><section><h2>Neighboring fields</h2>');
  for(const neighbor of r.relatedDomainIds){
    const d=data.registry.domains.find(d=>d.id===neighbor),s=states.get(neighbor);
    if(!s||s.state==='withdrawn')html=replaceOnce(html,link('../'+neighbor+'/',d.title),s?link('../'+neighbor+'/',neighbor+' · withdrawn orientation'):`<span>${neighbor} · orientation not included in this release</span>`);
  }
  const notice=mode==='preview'?'Local navigation preview. These orientations have no public-distribution decision.':'Public delivery has a separate exact distribution decision. The original source-review limits still apply.';
  html=replaceOnce(html,'<main id="main">',`<main id="main" tabindex="-1"><nav class="domain-nav" aria-label="Atlas sections">${link(root+'ideas/','Reading library')}${link(root+'explore/','Exploration editions')}${link('../','Fields of knowledge')}</nav><p class="domain-delivery-note">${notice}</p>`);
  html=replaceOnce(html,'</head>',`<link rel="stylesheet" href="${root}assets/domain-navigation/delivery.css">${mode==='release'?`<link rel="canonical" href="${esc(base+'domains/'+id+'/')}">`:''}</head>`);
  if(mode==='release')html=replaceOnce(html,'<meta name="robots" content="noindex,nofollow">','<meta name="robots" content="index,follow">');
  insist(!html.includes('../../../../')&&!html.includes('Local pilots')&&!/href="[^" ]*(?:labs\/|docs\/)/.test(html),'Unadapted orientation target');return html;
}
export function renderDomainNavigation(data,entries,catalog,{mode='preview',base=null}={}){
  insist(['preview','release'].includes(mode),'Unknown domain delivery mode');base=canonicalBase(base);
  insist(mode==='preview'?!base:!!base,'Preview has no canonical base; release needs one');
  insist(catalog?.mode===mode,'Domain and exploration delivery modes differ');
  const states=new Map(entries.map(s=>[s.id,s]));insist(states.size===entries.length&&entries.every(s=>idsOf(data).includes(s.id)&&s.revision===data.catalog.overviews.find(r=>r.domainId===s.id).revision&&(mode==='preview'?s.state==='preview':['published','withdrawn'].includes(s.state))&&(s.state!=='withdrawn'||text(s.reason))),'Invalid domain delivery states');
  const editions=liveEditions(catalog,data),outputs=new Map(),canonicalPaths=[],rows=[];
  if(!entries.length)return{outputs,canonicalPaths,domains:[],liveCount:0,retainedCount:0,editionIds:[]};
  for(const state of entries){
    const r=data.catalog.overviews.find(r=>r.domainId===state.id),d=data.registry.domains.find(d=>d.id===state.id),path=`domains/${state.id}/`;
    if(state.state==='withdrawn'){
      outputs.set(path+'index.html',shell('Withdrawn orientation',`<h1>This orientation has been withdrawn</h1><p>${state.id} · ${esc(state.revision)}</p><p>${esc(state.reason)}</p><p>The identity remains reserved. Former orientation text and sources are excluded.</p>`,{depth:2,path,mode}));rows.push({id:state.id,revision:state.revision,state:'withdrawn',href:path});
    }else{
      outputs.set(path+'index.html',adaptOverview(data,r,{mode,base,states,editions}));if(mode==='release')canonicalPaths.push(path);
      const collections=data.collectionLinks.filter(m=>m.domainId===state.id),primary=collections.filter(m=>m.relationship==='primary'),cross=collections.filter(m=>m.relationship==='cross-listed'),xs=editions.filter(x=>x.domainIds.includes(state.id));
      rows.push({id:state.id,revision:state.revision,state:state.state,title:d.title,summary:r.summary,question:r.questions[0],methods:d.methods,href:path,collections:collections.map(m=>({id:m.collectionId,title:m.title,relationship:m.relationship,href:`ideas/collections/${m.collectionId}/`})),primaryCount:primary.length,crossCount:cross.length,editions:xs.map(x=>({id:x.id,revision:x.currentRevision,title:x.title,href:x.href})),search:[d.title,r.summary,...r.questions,...r.territory,...r.waysToExplore,...collections.map(m=>m.title)].join(' ')});
    }
  }
  rows.sort((a,b)=>a.id.localeCompare(b.id));const live=rows.filter(r=>r.state!=='withdrawn'),withdrawn=rows.filter(r=>r.state==='withdrawn'),collectionIds=new Set(live.flatMap(r=>r.collections.map(c=>c.id))),editionIds=[...new Set(live.flatMap(r=>r.editions.map(x=>x.id)))].sort(),methods=[...new Set(live.flatMap(r=>r.methods))].sort();
  const cards=live.map(r=>`<article class="domain-card" data-domain="${r.id}" data-search="${esc(r.search)}" data-methods="${esc(r.methods.join(' '))}" data-collections="${r.collections.length}" data-editions="${r.editions.length}"><p class="kicker">${r.id}</p><h2>${link(r.id+'/',r.title)}</h2><p>${esc(r.summary)}</p><p class="card-question">${esc(r.question)}</p><p class="meta">${r.primaryCount} primary collections · ${r.crossCount} cross-listed · ${r.editions.length} ${mode==='preview'?'reviewed local':'released'} exploration editions</p><p class="meta">${esc(r.methods.map(m=>m.replaceAll('-',' ')).join(' / '))}</p></article>`).join('');
  const filters=`<form id="filters" class="filters domain-filters" hidden><div><label for="query">Find a field, question or collection</label><input id="query" type="search" maxlength="200" autocomplete="off" placeholder="Try language, evidence or making"></div><div><label for="method">Way to explore</label><select id="method"><option value="">All methods</option>${methods.map(m=>`<option value="${esc(m)}">${esc(m.replaceAll('-',' '))}</option>`).join('')}</select></div><div><label for="route">Available starting points</label><select id="route"><option value="">All starting points</option><option value="collections">With collection links</option><option value="editions">With exploration editions</option><option value="reading">External reading step only</option></select></div><button type="reset">Clear filters</button></form>`;
  const body=`<section class="hero"><p class="kicker">Fields overlap · questions connect them</p><h1>Choose a question.<br>Find a field.</h1><p class="lead">Explore what a field asks, how it works, what remains missing, and where to begin.</p><p>Original catalog scope: ${esc(data.catalog.purpose)}</p><p class="note">${esc(data.catalog.framing)}</p><ul class="domain-counts"><li>${live.length} available orientations</li><li>${collectionIds.size} distinct collection entrances</li><li>${editionIds.length} distinct ${mode==='preview'?'reviewed local':'released'} explorations</li></ul><p class="note">Cross-listings point to the same content. These counts describe available routes, not introductory coverage.</p>${mode==='preview'?'<p class="domain-delivery-note">Local navigation preview. No orientation has a public-distribution decision.</p>':''}</section>${live.length?filters:''}<p id="results" role="status" aria-live="polite">${live.length} of ${live.length} available orientations</p><p id="empty" hidden>No orientations match. Try a broader word or clear the filters.</p><div class="domain-grid">${cards}</div>${withdrawn.length?'<section class="domain-withdrawn"><h2>Withdrawn orientations</h2><ul>'+withdrawn.map(r=>'<li>'+link(r.id+'/',r.id+' · withdrawn')+'</li>').join('')+'</ul></section>':''}`;
  outputs.set('domains/index.html',shell('Explore human knowledge',body,{mode,base,indexable:mode==='release'&&live.length>0,script:live.length>0}));if(mode==='release'&&live.length)canonicalPaths.push('domains/');
  outputs.set('domains/about/index.html',shell('Source review and delivery scope',`<h1>Source review and delivery scope</h1><p>Orientation catalog ${esc(data.catalog.catalogVersion)}. These pages contain original summaries, editorial questions, explicit gaps and navigation citations. They do not reproduce external images, recordings, scores or source passages. Each linked source retains its own terms.</p><p>The original orientation has independent AI source-content and engineering receipts. The delivery adapter is a separate engineering surface. Neither establishes professional competence, community representation, observed accessibility or learning effectiveness.</p><p>Source pages record the exact passage, date, language, reuse limits and scope previously inspected. Delivery does not perform a fresh remote-source check. Unavailable sources are not supporting evidence.</p><p>${mode==='preview'?'This is a local preview without public-distribution decisions.':'Each live orientation has an explicit distribution decision bound to its source, navigation code and destination.'} Collection entrances, exploration editions and external readings have different review scopes. A domain mapping does not mean every collection item teaches every part of that domain.</p><p>Private lesson notes remain in their original revision stores. Domain browsing stores no notes or filter history. The notebook manager requires an explicit reader action to copy notes.</p><p>Withdrawn orientation identities remain reserved; their former text is omitted from a fresh build. Host replacement and cache handling are separate deployment responsibilities.</p>`,{depth:2,path:'domains/about/',mode}));
  outputs.set('domains/catalog.json',json({schemaVersion:1,catalogVersion:data.catalog.catalogVersion,mode,domains:rows.map(({search,...r})=>r),liveCount:live.length,retainedCount:rows.length,distinctCollections:collectionIds.size,distinctExplorations:editionIds.length}));
  return{outputs,canonicalPaths,domains:rows,liveCount:live.length,retainedCount:rows.length,editionIds};
}
export function attachDomainNavigation(path,html,rows){
  const live=rows.filter(r=>r.state!=='withdrawn'),prefix='../'.repeat(path.split('/').length-1);
  if(path==='index.html')return replaceOnce(html,'<a href="explore/">Explore</a>','<a href="explore/">Explore</a>\n      <a href="domains/">Fields</a>');
  if(path==='ideas/index.html')return replaceOnce(html,'<h1>Reading library</h1>',`<nav aria-label="Fields of knowledge">${link('../domains/','Browse fields, questions and methods')}</nav><h1>Reading library</h1>`);
  const collection=path.match(/^ideas\/collections\/([a-z0-9-]+)\/index\.html$/);
  if(collection){const related=live.filter(r=>r.collections.some(c=>c.id===collection[1]));if(!related.length)return html;return replaceOnce(html,'</main>',`<nav class="reading-notice" aria-label="Related fields"><h2>Explore these fields</h2><ul>${related.map(r=>'<li>'+link(prefix+r.href,r.title)+` · ${esc(r.collections.find(c=>c.id===collection[1]).relationship)}</li>`).join('')}</ul><p>These are collection-level navigation links, not item-level coverage claims.</p></nav></main>`);}
  if(path.startsWith('explore/')&&path.endsWith('/index.html'))return replaceOnce(html,'</main>',`<nav aria-label="Fields of knowledge">${link(prefix+'domains/','Browse fields, questions and methods')}</nav></main>`);
  return html;
}
