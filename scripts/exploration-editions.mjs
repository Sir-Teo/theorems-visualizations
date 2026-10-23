// Delivery is separate from source acceptance. Frozen local reviews never grant publication.
import { createHash } from 'node:crypto';
import { contentDigest, reviewArtifactDigest, validateExploration, EXP_ID } from '../explorations/contract.mjs';
import { esc } from '../explorations/render.mjs';
import { canonicalBase } from './static-ideas.mjs';
import { notebookPage } from './notebook-pages.mjs';

export const REVIEW_CODE = ['explorations/contract.mjs', 'explorations/route-state.mjs', 'explorations/render.mjs', 'explorations/ui.mjs', 'explorations/style.css', 'explorations/method-models.mjs', 'explorations/method-views.mjs', 'explorations/method-ui.mjs', 'explorations/practice-model.mjs', 'explorations/performance-model.mjs', 'explorations/studio-views.mjs', 'explorations/studio-ui.mjs', 'scripts/build-explorations.mjs'];
export const BROWSER_CODE = REVIEW_CODE.filter(p => !['explorations/contract.mjs', 'explorations/render.mjs', 'scripts/build-explorations.mjs'].includes(p));
export const DELIVERY_CODE = [...new Set(['scripts/exploration-editions.mjs', 'scripts/notebook-pages.mjs', 'assets/js/notebook-model.js', 'assets/js/notebook-view.js', 'assets/css/notebooks.css', 'scripts/freeze-exploration-editions.mjs', 'scripts/build-exploration-editions.mjs', 'scripts/static-ideas.mjs', 'scripts/build-static-ideas.mjs', 'scripts/lib.mjs', 'static-pages/accepted.json', 'assets/css/exploration-delivery.css', ...REVIEW_CODE])];
export const SUPPLEMENTS = ['docs/pilots/research/soil-subset.py'];
export const sha = data => createHash('sha256').update(data).digest('hex');
export const jsonBytes = value => JSON.stringify(value, null, 2) + '\n';
export const versionOK = value => typeof value === 'string' && /^(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})$/.test(value);
const digestOK = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const insist = (condition, message) => { if (!condition) throw new Error(message); };
export const bundleKey = (id, revision) => id + '@' + revision;
export const editionPath = (id, revision) => `explore/${id}/versions/${revision}/`;
export const compareVersions = (a,b) => { const x=a.split('.').map(Number),y=b.split('.').map(Number); return x[0]-y[0] || x[1]-y[1] || x[2]-y[2]; };

export function validateRuntime(runtime) {
  insist(runtime?.schemaVersion === 1 && runtime.files && Object.keys(runtime.files).sort().join() === [...REVIEW_CODE].sort().join(), 'Unsupported frozen runtime inventory');
  insist(REVIEW_CODE.every(p => text(runtime.files[p])), 'Frozen runtime source missing');
  return Object.fromEntries(REVIEW_CODE.map(p => [p, sha(runtime.files[p])]));
}
export function validateBundle(bundle, runtime, entry) {
  insist(bundle?.schemaVersion === 1 && EXP_ID.test(bundle.id) && versionOK(bundle.revision), 'Invalid edition identity');
  insist(entry.id === bundle.id && entry.revision === bundle.revision && entry.path === `editions/bundles/${bundle.id}/${bundle.revision}.json`, 'Edition manifest identity/path mismatch');
  insist(sha(jsonBytes(bundle)) === entry.sha256, 'Frozen edition bytes changed');
  insist(bundle.runtimeDigest === sha(jsonBytes(runtime)) && digestOK(bundle.runtimeDigest), 'Frozen runtime binding changed');
  const codeHashes = validateRuntime(runtime), record = bundle.record;
  insist(record?.id === bundle.id && record.revision === bundle.revision && record.status === 'accepted' && record.publication === 'local-preview', 'Only reviewed local source records may be frozen');
  insist(contentDigest(record) === bundle.contentDigest && reviewArtifactDigest(record, codeHashes, bundle.collectionTitles) === bundle.artifactDigest, 'Frozen content/artifact binding changed');
  const problems = validateExploration(record, {...bundle.context, artifactDigest:bundle.artifactDigest});
  insist(problems.length === 0, problems.join('\n'));
  insist(text(bundle.previewHTML) && sha(bundle.previewHTML) === bundle.previewDigest, 'Frozen preview changed');
  insist(bundle.previewHTML.includes(`<script id="exploration-data" type="application/json">${JSON.stringify(record).replace(/</g, '\\u003c')}</script>`), 'Frozen reader payload differs from reviewed record');
  insist(bundle.receipts && typeof bundle.receipts === 'object', 'Frozen review evidence missing');
  for (const review of record.reviews) {
    const receipt=bundle.receipts[review.evidencePath];
    insist(text(receipt?.text) && sha(receipt.text) === receipt.sha256, 'Frozen review receipt missing or changed');
  }
  insist(bundle.supplements && typeof bundle.supplements === 'object', 'Supplement inventory missing');
  for(const [path,file]of Object.entries(bundle.supplements))insist(SUPPLEMENTS.includes(path) && text(file.text) && sha(file.text)===file.sha256, 'Unsupported or changed supplement');
  for(const [,path]of bundle.previewHTML.matchAll(/href="\.\.\/\.\.\/\.\.\/(docs\/[^"#?]+)"/g))if(path!=='docs/master-plan-handoff.md')insist(bundle.supplements[path], 'Unretained reader supplement: '+path);
  return bundle;
}

function evidence(ref, readEvidence) {
  insist(/^docs\/(?:verification|releases)\/[a-z0-9/.-]+\.(?:md|json)$/.test(ref?.path || '') && !ref.path.includes('..') && digestOK(ref.sha256), 'Unsafe or unbound release evidence');
  insist(sha(readEvidence(ref.path)) === ref.sha256, 'Release evidence changed: ' + ref.path);
}
function reviewer(value, author) {
  insist(text(value?.id) && text(value.role) && value.independent === true && value.id !== author, 'Independent release reviewer missing');
}
function approval(value, bundle, entry, deliveryDigest, base, readEvidence) {
  insist(value?.schemaVersion === 1 && value.decision === 'approve-public-distribution', 'Publication requires an explicit distribution decision');
  insist(digestOK(deliveryDigest) && base && value.id === bundle.id && value.revision === bundle.revision && value.bundleSha256 === entry.sha256 && value.deliveryDigest === deliveryDigest && value.canonicalBase === base, 'Distribution decision does not bind this edition, delivery code and destination');
  insist(text(value.authorizedBy) && /^\d{4}-\d{2}-\d{2}$/.test(value.authorizedOn || '') && text(value.scope), 'Publication authorization/scope missing');
  const expected=[...bundle.record.sources.map(s=>s.id),'original-editorial-material','software-runtime',...Object.keys(bundle.supplements).map(p=>'supplement:'+p)].sort();
  insist(Array.isArray(value.materials) && value.materials.map(m=>m?.id).sort().join() === expected.join(), 'Distribution decision must cover every source, editorial material and runtime');
  for(const material of value.materials) {
    insist(text(material.basis) && text(material.territories) && text(material.scope), 'Asset distribution scope missing');
    reviewer(material.reviewer,bundle.record.author); evidence(material.evidence,readEvidence);
  }
  reviewer(value.engineering?.reviewer,bundle.record.author); evidence(value.engineering?.evidence,readEvidence);
}

// The ordered ledger retains withdrawn identities. No fallback silently replaces a withdrawn latest edition.
export function resolveReleases(ledger, bundles, {deliveryDigest, base, readEvidence}) {
  insist(ledger?.schemaVersion === 1 && Array.isArray(ledger.events), 'Invalid release ledger');
  base=canonicalBase(base); insist(base, 'Release assembly requires an explicit canonical base');
  const states=new Map();
  for(const event of ledger.events) {
    insist(event && EXP_ID.test(event.id) && versionOK(event.revision), 'Invalid release event identity');
    const key=bundleKey(event.id,event.revision), source=bundles.get(key), prior=states.get(key);
    insist(source && event.bundleSha256 === source.entry.sha256, 'Release event lacks its exact retained edition');
    insist(['publish','withdraw'].includes(event.type), 'Unknown release event');
    evidence(event.evidence,readEvidence);
    const decision=JSON.parse(readEvidence(event.evidence.path));
    if(event.type === 'publish') {
      insist(prior?.state !== 'withdrawn', 'A withdrawn edition cannot be republished; prepare a new revision');
      approval(decision,source.bundle,source.entry,decision.deliveryDigest,canonicalBase(decision.canonicalBase),readEvidence);
      // Reapproval can update delivery evidence without changing immutable content.
      states.set(key,{...source,state:'published',decision});
    } else {
      insist(prior?.state === 'published', 'Withdrawal requires a previously published edition');
      insist(decision?.decision === 'withdraw-public-edition' && decision.id === event.id && decision.revision === event.revision && decision.bundleSha256 === source.entry.sha256 && text(decision.authorizedBy) && text(decision.reason) && /^\d{4}-\d{2}-\d{2}$/.test(decision.authorizedOn || ''), 'Withdrawal decision missing');
      states.set(key,{...source,state:'withdrawn',reason:decision.reason});
    }
  }
  // Check only final live approvals: historical code bindings remain historical after reapproval/withdrawal.
  for(const value of states.values()) if(value.state === 'published') approval(value.decision,value.bundle,value.entry,deliveryDigest,base,readEvidence);
  return [...states.values()];
}

function replaceOnce(html, before, after) {
  insist(html.split(before).length === 2, 'Unknown frozen page structure; review the delivery adapter: ' + before.slice(0,70));
  return html.replace(before,after);
}
const canonical = (base,path) => base ? `<link rel="canonical" href="${esc(base+path)}">` : '';
function shell(title,body,depth,{base,path,indexable=false}={}) {
  const prefix='../'.repeat(depth);
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="${indexable?'index,follow':'noindex,nofollow'}">${canonical(base,path)}<title>${esc(title)} · Ideas, Visualized</title><link rel="stylesheet" href="${prefix}assets/css/exploration-delivery.css"></head><body><a class="skip" href="#main">Skip to content</a><header class="delivery-header"><a href="${prefix}">Ideas, Visualized</a><a href="${prefix}explore/">Explorations</a></header><main id="main" tabindex="-1">${body}</main><footer class="delivery-footer">Source review, public distribution and human observations have separate scopes.</footer></body></html>\n`;
}
export function relocateEdition(bundle,{mode,base=null}) {
  const {record:r}=bundle, prefix='../../../../', path=editionPath(r.id,r.revision), publicEdition=mode==='release';
  let html=bundle.previewHTML;
  html=replaceOnce(html,'href="../../../explorations/style.css"',`href="${prefix}assets/editions/${bundle.runtimeDigest}/style.css"`);
  html=replaceOnce(html,'src="../../../explorations/ui.mjs"',`src="${prefix}assets/editions/${bundle.runtimeDigest}/ui.mjs"`);
  html=html.replaceAll('href="../../../#/','href="'+prefix+'#/');
  html=replaceOnce(html,'<nav aria-label="Workshop"><a href="../">← All pilot explorations</a></nav>',`<nav aria-label="Explorations"><a href="../../">← Editions of this exploration</a></nav>`);
  html=replaceOnce(html,'<span>Exploration workshop</span>',`<span>${publicEdition?'Explorations':'Local delivery preview'}</span>`);
  const notice=publicEdition?'This edition has a separate public-distribution decision. Source-review limitations below still apply.':'Local delivery preview. This edition has not been cleared for public distribution.';
  html=replaceOnce(html,'<main id="main" tabindex="-1">',`<main id="main" tabindex="-1"><aside class="edition-notice"><strong>Edition ${esc(r.revision)}</strong> · ${publicEdition?'Released edition':'Local preview'}<details><summary>About this edition</summary><p>${notice}</p><p>Shared links keep this edition. Notes from other editions are kept separately.</p></details></aside>`);
  html=replaceOnce(html,'<footer><p>Local previews. Review scope and public release are separate.</p><a href="../../../docs/master-plan-handoff.md">Editorial status and next work</a></footer>',`<footer><a href="../../">Edition history and review scope</a><a href="${prefix}explore/notebooks/">Recover or copy my notes</a><p>Earlier notes remain in their original revision stores. No automatic migration or server synchronization.</p></footer>`);
  for(const path of Object.keys(bundle.supplements))html=html.replaceAll(`href="../../../${path}"`,'href="reproduction/"');
  insist(!/href="\.\.\/\.\.\/\.\.\/docs\//.test(html),'Reader documentation link lacks a retained delivery target');
  html=replaceOnce(html,'<meta name="description" content="Draft source-based explorations for Ideas, Visualized.">',`<meta name="description" content="${esc(r.summary)}">`);
  html=replaceOnce(html,'</head>',`${canonical(publicEdition?base:null,path)}<link rel="stylesheet" href="${prefix}assets/css/exploration-delivery.css"></head>`);
  if(publicEdition) html=replaceOnce(html,'<meta name="robots" content="noindex,nofollow">','<meta name="robots" content="index,follow">');
  return html;
}

export function renderEditions(entries,runtimes,{mode='preview',base=null}={}) {
  insist(['preview','release'].includes(mode),'Unknown edition assembly mode');
  if(mode==='preview') insist(!base,'Preview editions must not acquire public canonical metadata');
  else { base=canonicalBase(base); insist(base,'Release editions need an explicit canonical base'); }
  const outputs=new Map(),paths=[],groups=new Map(),usedRuntimes=new Set();
  for(const entry of entries) {
    const {bundle,state}=entry;
    insist(['preview','published','withdrawn'].includes(state) && (mode==='release' ? state!=='preview' : state==='preview'),'Incompatible edition state');
    const group=groups.get(bundle.id)||[];group.push(entry);groups.set(bundle.id,group);
    const path=editionPath(bundle.id,bundle.revision);
    if(state==='withdrawn') outputs.set(path+'index.html',shell('Withdrawn edition',`<h1>This edition has been withdrawn</h1><p>${esc(bundle.id)} · ${esc(bundle.revision)}</p><p>${esc(entry.reason)}</p><p>The identity remains reserved. Former text, data and activity payloads are excluded from this output.</p><a href="../../">Edition history</a>`,4,{path}));
    else {
      outputs.set(path+'index.html',relocateEdition(bundle,{mode,base}));usedRuntimes.add(bundle.runtimeDigest);if(mode==='release')paths.push(path);
      if(Object.keys(bundle.supplements).length) {
        for(const [source,file]of Object.entries(bundle.supplements))outputs.set(path+'reproduction/'+source,file.text);
        const recordPath='explorations/agriculture.json';outputs.set(path+'reproduction/'+recordPath,jsonBytes(bundle.record));
        outputs.set(path+'reproduction/index.html',shell('Reproduce this edition’s data selection',`<h1>Reproduce this edition’s data selection</h1><p>These files are frozen with edition ${esc(bundle.revision)}. Download both files and preserve the shown directory layout under one folder. Supply the original CSV directory yourself; the script checks its exact SHA-256 and performs no network requests or writes.</p><ul>${Object.keys(bundle.supplements).map(p=>`<li><a href="${esc(p)}">${esc(p)}</a></li>`).join('')}<li><a href="${recordPath}">${recordPath}</a></li></ul><pre>python3 docs/pilots/research/soil-subset.py /path/to/original/csv/directory</pre><p>The upstream dataset and attribution are linked in the lesson. This output does not redistribute the original CSV.</p><a href="../">Return to this edition</a>`,5));
      }
    }
  }
  const catalog=[];
  for(const [id,versions] of groups) {
    versions.sort((a,b)=>compareVersions(b.bundle.revision,a.bundle.revision));
    const current=versions[0],active=current.state!=='withdrawn',r=current.bundle.record,path=`explore/${id}/`;
    const title=active?r.title:'Withdrawn exploration';
    const rows=versions.map(v=>`<li><a href="versions/${v.bundle.revision}/">Edition ${v.bundle.revision}${v.state==='withdrawn'?' · withdrawn':''}</a></li>`).join('');
    const body=`<p class="eyebrow">${mode==='preview'?'Local delivery preview':'Edition history'}</p><h1>${esc(title)}</h1>${active?`<p>${esc(r.summary)}</p><p><a class="delivery-start" href="versions/${r.revision}/">Open edition ${r.revision}</a></p>`:'<p>The latest edition is withdrawn. Earlier editions are listed with their own status; no automatic fallback is performed.</p>'}<h2>Retained editions</h2><ol>${rows}</ol><p>This identity page does not apply saved selections to a different revision. Use the original versioned link. Notes are private to this browser and revision.</p>${active?`<h2>Review scope</h2><ul>${(r.reviewLimitations||[]).map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:''}`;
    outputs.set(path+'index.html',shell(title,body,2,{base:active?base:null,path,indexable:mode==='release'&&active}));
    if(mode==='release'&&active)paths.push(path);
    catalog.push({id,currentRevision:r.revision,state:current.state,...(active?{title:r.title,summary:r.summary,domainIds:r.domainIds}:{}),href:path,versions:versions.map(v=>({revision:v.bundle.revision,state:v.state,href:editionPath(id,v.bundle.revision)}))});
  }
  catalog.sort((a,b)=>a.id.localeCompare(b.id));
  const live=catalog.filter(x=>x.state!=='withdrawn');
  const intro=mode==='preview'?'These frozen editions are reviewed local previews. They have no public-distribution approval.':'Only editions with explicit, exact distribution and delivery decisions appear here.';
  const cards=live.map(r=>`<article><h2><a href="${r.id}/">${esc(r.title)}</a></h2><p>${esc(r.summary)}</p><p>Edition ${esc(r.currentRevision)}</p></article>`).join('');
  outputs.set('explore/index.html',shell('Ways to explore knowledge',`<p class="eyebrow">${mode==='preview'?'Local delivery preview':'Explorations'}</p><h1>Ways to explore knowledge</h1><p>${intro}</p><p>${live.length} current explorations. Edition history does not add to the lesson count.</p>${cards||'<p>No exploration is currently released in this catalog.</p>'}`,1,{base:live.length?base:null,path:'explore/',indexable:mode==='release'&&live.length>0}));
  if(mode==='release'&&live.length)paths.push('explore/');
  outputs.set('explore/catalog.json',jsonBytes({schemaVersion:1,mode,explorations:catalog,currentCount:live.length,retainedEditionCount:entries.length}));
  if(entries.length) {
    outputs.set('explore/notebooks/index.html',notebookPage(entries));
    // Add links to catalog, identity and withdrawal pages without changing frozen activity payloads.
    for(const [path,html]of outputs)if(path.endsWith('/index.html')&&html.includes('<header class="delivery-header">')) {
      const depth=path.split('/').length-1,prefix='../'.repeat(depth);
      outputs.set(path,replaceOnce(html,'</header>',`<a href="${prefix}explore/notebooks/">My notes</a></header>`));
    }
  }
  for(const digest of usedRuntimes) {
    const runtime=runtimes.get(digest);insist(runtime,'Missing edition runtime');validateRuntime(runtime);
    for(const file of BROWSER_CODE)outputs.set(`assets/editions/${digest}/${file.slice('explorations/'.length)}`,runtime.files[file]);
  }
  return {outputs,canonicalPaths:paths,currentCount:live.length,retainedEditionCount:entries.length,runtimes:usedRuntimes.size};
}
