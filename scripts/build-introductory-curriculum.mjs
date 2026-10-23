// Add a scoped introductory curriculum to a fresh local delivery candidate.
import {readFile,writeFile,mkdir,lstat} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT,loadAll} from './lib.mjs';
import {digest,selectFrozenIdeas} from './static-ideas.mjs';
import {loadEditionArchive} from './build-exploration-editions.mjs';
import {editionPath} from './exploration-editions.mjs';
import {hash} from '../journeys/reader.mjs';
import {buildJourneys} from './build-journeys.mjs';
import {inventory} from './build-domain-navigation.mjs';
const insist=(ok,why)=>{if(!ok)throw new Error(why);};
const read=async p=>JSON.parse(await readFile(join(ROOT,p),'utf8'));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const text=s=>typeof s==='string'&&s.trim().length>0;
export async function curriculumContext(){
 const [accepted,data,archive,registry]=await Promise.all([read('static-pages/accepted.json'),loadAll(),loadEditionArchive(),read('docs/coverage/registry.json')]);
 const frozen=selectFrozenIdeas(data,accepted);
 return {accepted,legacy:new Map(frozen.selected.map(x=>[x.item.id,x])),archive,domains:registry.domains};
}
export function curriculumTarget(stop,c){
 if(stop.kind==='legacy-accepted'){
  const x=c.legacy.get(stop.targetId);insist(x&&!x.item.verify,'Unknown or flagged curriculum target: '+stop.targetId);
  return {title:x.item.name,href:`ideas/${x.item.id}/`,sha256:digest(x),prerequisites:x.item.deps||[],scope:x.item.scope||'Read the exact source, statement and assumptions on the retained lesson. Acceptance of a legacy artifact does not certify every wider use.'};
 }
 insist(stop.kind==='locally-accepted-exploration','Unknown curriculum target kind');
 const x=c.archive.bundles.get(stop.targetId+'@'+stop.revision);insist(x&&x.bundle.record.status==='accepted','Missing accepted curriculum edition: '+stop.targetId);
 return {title:x.bundle.record.title,href:editionPath(stop.targetId,stop.revision),sha256:x.entry.sha256,prerequisites:x.bundle.record.prerequisites,scope:x.bundle.record.scope};
}
export function validateCurriculum(data,c){
 insist(data.schemaVersion===1&&data.version==='0.1.0'&&data.publication==='local-preview'&&data.acceptance==='author-checked-local','Unsupported local curriculum contract');
 insist(data.legacySnapshot===c.accepted.snapshotDigest,'Curriculum accepted snapshot changed');
 insist(data.routes.length===c.domains.length&&new Set(data.routes.map(r=>r.domainId)).size===c.domains.length,'Curriculum must cover each domain once');
 const unique=new Set();let associations=0;
 for(const r of data.routes){
  insist(c.domains.some(d=>d.id===r.domainId),'Unknown curriculum domain');
  for(const key of ['title','scope','entrySupport','transfer','remainingBreadth'])insist(text(r[key]),'Missing curriculum '+key);
  for(const key of ['language','place','method'])insist(text(r.representationAudit?.[key]),'Missing representation audit '+key);
  insist(r.stops.length===3&&new Set(r.stops.map(s=>s.targetId)).size===3,'Each route needs three distinct actual targets');
  for(const s of r.stops){const t=curriculumTarget(s,c);insist(t.title===s.title&&t.sha256===s.targetSha256,'Curriculum target content changed: '+s.targetId);insist(JSON.stringify(t.prerequisites)===JSON.stringify(s.declaredPrerequisites),'Curriculum prerequisites changed');insist(text(s.task),'Missing curriculum task');unique.add(s.targetId);associations++;}
 }
 return {domains:data.routes.length,associations,uniqueTargets:unique.size,newLessons:0};
}
export async function prepareCurriculum(){
 const [data,context]=await Promise.all([read('curriculum/introductory.json'),curriculumContext()]);
 const counts=validateCurriculum(data,context);
 const code=await readFile(join(ROOT,'scripts/build-introductory-curriculum.mjs'),'utf8');
 return {data,context,counts,binding:digest({data,code})};
}
export function renderCurriculum(data,c){
 const counts=validateCurriculum(data,c),outputs=new Map();
 const css=`:root{color-scheme:light dark;--bg:#f8f6f0;--fg:#20201c;--muted:#55554d;--line:#cecac0;--link:#153fb6}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:18px/1.6 system-ui,sans-serif}main,header,footer{max-width:72rem;margin:auto;padding:1.25rem}h1{font:clamp(2rem,5vw,3.5rem)/1.15 Georgia,serif;max-width:24ch}h2,h3{line-height:1.3}a{color:var(--link);overflow-wrap:anywhere}:focus-visible{outline:3px solid var(--link);outline-offset:4px}.skip{position:absolute;left:-10000px}.skip:focus{left:1rem;top:1rem;background:var(--bg);padding:1rem}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr));gap:1rem}article,.support,.audit{border-top:1px solid var(--line);padding:1rem 0}article{min-width:0}p,li,dd{overflow-wrap:anywhere}.meta{font-size:.9rem;color:var(--muted)}.steps{list-style:none;padding:0}.steps>li{margin:2rem 0;padding-top:1rem;border-top:2px solid var(--line)}details{margin:1rem 0}summary{cursor:pointer}dd{margin:0 0 1rem}dt{font-weight:bold}nav{display:flex;gap:1rem;flex-wrap:wrap}footer{font-size:.9rem;color:var(--muted)}@media(prefers-color-scheme:dark){:root{--bg:#101316;--fg:#eeece5;--muted:#b9b9af;--line:#444950;--link:#abc1ff}}`;
 outputs.set('assets/curriculum/style.css',css);
 const shell=(title,body,depth)=>{const prefix='../'.repeat(depth);return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(title)} · Atlas</title><link rel="stylesheet" href="${prefix}assets/curriculum/style.css"></head><body><a class="skip" href="#main">Skip to content</a><header><nav aria-label="Atlas"><a href="${prefix}curriculum/">Starting curriculum</a><a href="${prefix}domains/">Fields</a><a href="${prefix}journeys/">Journeys</a><a href="${prefix}ideas/">Reading library</a></nav></header><main id="main" tabindex="-1">${body}</main><footer>Author-checked local routes · ${esc(data.checkedOn)} · ${counts.associations} associations, ${counts.uniqueTargets} distinct existing targets, zero new lessons. Practical mastery and observed learning are not inferred.</footer></body></html>\n`;};
 const domain=id=>c.domains.find(d=>d.id===id).title;
 const cards=data.routes.map(r=>`<article data-domain="${r.domainId}"><p class="meta">${r.domainId} · ${esc(domain(r.domainId))}</p><h2><a href="${r.domainId}/">${esc(r.title)}</a></h2><p>${esc(r.scope)}</p><p class="meta">Three exact lesson links · ${esc(r.remainingBreadth)}</p></article>`).join('');
 outputs.set('curriculum/index.html',shell('Thirty starting routes',`<p class="meta">Local introductory curriculum · version ${esc(data.version)}</p><h1>Start with a question. Follow the evidence.</h1><p>${esc(data.scope)}</p><p>Each route offers a bounded introductory task, conceptual entry support and the lesson’s declared prerequisites. The longer lessons may contain advanced material. These routes establish starting access, not a complete syllabus for every field.</p><div class="grid">${cards}</div>`,1));
 for(const r of data.routes){
  const stops=r.stops.map((s,i)=>{const t=curriculumTarget(s,c);const deps=s.declaredPrerequisites.length?`<details><summary>Declared prerequisites (${s.declaredPrerequisites.length})</summary><ul>${s.declaredPrerequisites.map(id=>`<li><a href="../../${c.legacy.has(id)?'ideas/'+id+'/':'#/t/'+encodeURIComponent(id)}">${esc(id)}</a></li>`).join('')}</ul><p>These are the retained lesson’s declarations. This route does not claim to supply their full dependency closure.</p></details>`:'<p class="meta">No formal prerequisite IDs declared by this artifact. Use the entry support above.</p>';return `<li id="step-${i+1}"><p class="meta">${i+1} · ${esc(s.kind)} · ${esc(s.targetId)}${s.revision?' · '+esc(s.revision):''}</p><h2><a href="../../${t.href}">${esc(s.title)}</a></h2><p><strong>Try:</strong> ${esc(s.task)}</p><p><strong>Scope:</strong> ${esc(t.scope)}</p>${deps}</li>`;}).join('');
  const audit=Object.entries(r.representationAudit).map(([key,value])=>`<dt>${esc(key)}</dt><dd>${esc(value)}</dd>`).join('');
  outputs.set(`curriculum/${r.domainId}/index.html`,shell(r.title,`<p class="meta">${r.domainId} · ${esc(domain(r.domainId))}</p><h1>${esc(r.title)}</h1><p>${esc(r.scope)}</p><section class="support"><h2>Before you start</h2><p>${esc(r.entrySupport)}</p></section><ol class="steps">${stops}</ol><section class="support"><h2>Connect the three</h2><p>${esc(r.transfer)}</p></section><section class="audit"><h2>What this route leaves open</h2><p>${esc(r.remainingBreadth)}</p><dl>${audit}</dl><p><a href="../../domains/${r.domainId}/">Read this field’s orientation and sources</a></p></section>`,2));
 }
 outputs.set('curriculum/catalog.json',JSON.stringify({schemaVersion:1,mode:'preview',version:data.version,...counts,routes:data.routes.map(r=>({domainId:r.domainId,title:r.title,href:`curriculum/${r.domainId}/`,targets:r.stops.map(s=>({id:s.targetId,revision:s.revision,href:curriculumTarget(s,c).href}))}))},null,2)+'\n');
 return outputs;
}
export async function buildCurriculum({out,mode='preview'}={}){
 insist(mode==='preview','Introductory curriculum currently builds local previews only');
 const p=await prepareCurriculum();const predecessor=await buildJourneys({out,mode});const output=predecessor.output,before=await inventory(output),writes=renderCurriculum(p.data,p.context),replacements=[];
 for(const [path,bytes]of writes){insist(!await lstat(join(output,path)).catch(e=>{if(e.code==='ENOENT')return null;throw e;}),'Curriculum output collision');await mkdir(dirname(join(output,path)),{recursive:true});await writeFile(join(output,path),bytes,{flag:'wx'});}
 for(const path of ['index.html','ideas/index.html','explore/index.html','domains/index.html','journeys/index.html']){
  const file=join(output,path),original=await readFile(file,'utf8'),prefix=path==='index.html'?'':'../';
  insist(!original.includes('data-curriculum-entry')&&(original.match(/<main\b[^>]*>/g)||[]).length===1,'Unknown curriculum navigation adapter');
  const next=original.replace(/<main\b[^>]*>/,m=>`<nav data-curriculum-entry aria-label="Starting curriculum"><a href="${prefix}curriculum/">Three starting lessons for every field</a></nav>`+m);
  await writeFile(file,next);replacements.push({path,beforeSha256:hash(original),afterSha256:hash(next)});
 }
 const after=await inventory(output),allowed=new Set(replacements.map(x=>x.path));
 for(const [path,sha]of Object.entries(before))insist(allowed.has(path)||after[path]===sha,'Unrelated candidate changed: '+path);
 insist((await prepareCurriculum()).binding===p.binding,'Curriculum inputs changed during assembly');
 const report={schemaVersion:1,mode,output,...p.counts,binding:p.binding,legacySnapshot:p.data.legacySnapshot,generatedFiles:[...writes.keys()],replacements,preexistingFilesPreserved:Object.keys(before).length-replacements.length,scope:'Local candidate only. Exact accepted targets reused; no new lessons, public release or observed mastery.'};
 await writeFile(join(output,'curriculum-build.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const args=process.argv.slice(2),options={};while(args.length){const key=args.shift();if(key==='--out')options.out=args.shift();else if(key==='--mode')options.mode=args.shift();else throw new Error('Use --out DIRECTORY [--mode preview]');}console.log(JSON.stringify(await buildCurriculum(options),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
