// Read-only evidence capture. Does not refresh any production or Wave ledger.
import { readFile, writeFile, mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT } from './lib.mjs';
import { readCoverage } from './validate-coverage.mjs';
import { loadExplorations, buildExplorations } from './build-explorations.mjs';
import { readOrientation, buildDomainOverviews } from './build-domain-overviews.mjs';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (repo,...args) => execFileSync('git',['-C',repo,...args],{encoding:'utf8',maxBuffer:16*1024*1024});
export async function captureDashboard({expansionRepo,redesignRepo,acceptedBase,asOf,expansionRef='HEAD',redesignRef='HEAD'}) {
 if(!expansionRepo||!redesignRepo||!/^[a-f0-9]{40}$/.test(acceptedBase||'')||!/^\d{4}-\d{2}-\d{2}T/.test(asOf||''))throw new Error('Explicit repositories, accepted commit and UTC as-of required');
 const expansionCommit=git(expansionRepo,'rev-parse','--verify',expansionRef+'^{commit}').trim(),redesignCommit=git(redesignRepo,'rev-parse','--verify',redesignRef+'^{commit}').trim(),localCommit=git(ROOT,'rev-parse','HEAD').trim();
 const sources=[];
 const readGit=(repo,commit,path,label)=>{const body=git(repo,'show',commit+':'+path);sources.push({label,commit,path,sha256:sha(body)});return body;};
 const continuation=readGit(expansionRepo,expansionCommit,'docs/wave-continuation.md','Expansion acceptance authority');
 if(!continuation.includes('Current accepted-export source '+acceptedBase))throw new Error('Accepted base does not match owning continuation handoff');
 // Production JSON is ignored by Git. Generate it from an isolated pinned archive,
 // never trust whatever generated data happens to be in an active worktree.
 const temp=await mkdtemp(resolve(tmpdir(),'coverage-accepted-')), target=resolve(temp,'snapshot');
 let index,planned;
 try {
  await mkdir(target);git(ROOT,'archive','--format=tar','--output='+resolve(temp,'base.tar'),acceptedBase);
  execFileSync('tar',['-xf',resolve(temp,'base.tar'),'-C',target]);
  execFileSync(process.execPath,['scripts/build.mjs','--strict'],{cwd:target,encoding:'utf8',maxBuffer:8*1024*1024});
  for(const [path,label] of [['data/index.json','Accepted production catalog'],['data/planned.json','Accepted planned-item inventory']]) {
   let body=await readFile(resolve(target,path),'utf8');if(path==='data/index.json'){const parsed=JSON.parse(body);parsed.generated=asOf;body=JSON.stringify(parsed);}sources.push({label,commit:acceptedBase,path,sha256:sha(body),derivation:'node scripts/build.mjs --strict in an isolated git archive of this commit'+(path==='data/index.json'?'; generated timestamp normalized to explicit asOf before JSON serialization and hashing':'')});
   if(path==='data/index.json')index=JSON.parse(body);else planned=JSON.parse(body);
  }
 } finally {await rm(temp,{recursive:true,force:true});}
 const frozen=JSON.parse(readGit(ROOT,acceptedBase,'docs/wave-6-plan.json','Frozen Wave 6 identities'));
 const currentPlan=JSON.parse(readGit(expansionRepo,expansionCommit,'docs/wave-6-plan.json','Expansion Wave 6 ledger'));
 if(JSON.stringify(frozen.chapters)!==JSON.stringify(currentPlan.chapters))throw new Error('Frozen Wave 6 chapter identities changed');
 const waveText=readGit(expansionRepo,expansionCommit,'docs/wave-6.md','Expansion author-verification ledger');
 const visual=JSON.parse(readGit(redesignRepo,redesignCommit,'docs/verification/wave5-visual-redesign.json','Visual redesign ledger'));
 const authority=waveText.split('Run `node scripts/plan-content-wave.mjs')[0];
 const declaredPending=Number(authority.match(/branch additionally contains (\d+) author-verified ideas/)?.[1]);
 const reportedChapters=[...authority.matchAll(/\[([A-Z]+) (\d+), (\d+) ideas\]\((verification\/wave6-[a-z]+\.md)\)/g)].map(m=>({key:m[1].toLowerCase()+'/'+m[2],count:Number(m[3]),reportPath:'docs/'+m[4]}));
 if(!Number.isInteger(declaredPending)||!reportedChapters.length||reportedChapters.reduce((n,c)=>n+c.count,0)!==declaredPending)throw new Error('Expansion declared count does not reconcile to named chapters');
 for(const c of reportedChapters){const ch=frozen.chapters.find(x=>x.collection+'/'+x.chapter===c.key);if(!ch||ch.items.length!==c.count)throw new Error('Expansion report does not match frozen chapter '+c.key);readGit(expansionRepo,expansionCommit,c.reportPath,'Author report '+c.key);}
 const [coverage,{records},orientation,pilotCheck,overviewCheck]=await Promise.all([readCoverage(),loadExplorations(),readOrientation(),buildExplorations({checkOnly:true}),buildDomainOverviews({checkOnly:true})]);
 const localPaths=['docs/coverage/registry.json','docs/coverage/overviews.json','docs/coverage/overview-sources.json','docs/pilots/pilots.json','explorations/manifest.json',...JSON.parse(await readFile(resolve(ROOT,'explorations/manifest.json'),'utf8')).entries.map(x=>'explorations/'+x.file)];
 const localFiles=await Promise.all(localPaths.map(async path=>({path,sha256:sha(await readFile(resolve(ROOT,path)))})));
 const inputs={schemaVersion:1,asOf,sources,localCommit,localFiles,
  accepted:{commit:acceptedBase,generated:index.generated,items:index.items.map(x=>({id:x.id,collectionId:x.col})),plannedItems:Object.entries(planned.cols).flatMap(([col,rows])=>rows.map(r=>({id:col+'-'+r[0],collectionId:col}))),plannedCount:index.plannedCount,collections:index.collections.map(c=>({id:c.id,title:c.title,written:c.count,planned:c.planned,visualizations:c.viz,sourceFlags:c.verify}))},
  wave:{number:6,total:frozen.newItemCount,chapters:frozen.chapters.map(c=>({key:c.collection+'/'+c.chapter,collectionId:c.collection,ids:c.items.map(i=>i.id)})),acceptedProgressAtBase:frozen.progress.written,currentLedgerProgress:currentPlan.progress.written,reportedChapters,declaredPending,expansionCommit},
  redesign:{commit:redesignCommit,scope:visual.scope,statusDefinitions:visual.acceptanceStatuses,items:visual.chapters.flatMap(c=>c.items.map(i=>({id:i.id,collectionId:c.collection,wave:c.wave,status:i.status,evidence:i.verification||null})))},
  domains:coverage.registry.domains.map(d=>({id:d.id,title:d.title,gaps:d.gaps,methods:d.methods,coverage:d.coverage,maintainerRole:d.stewardship.maintainerRole})),collectionMappings:coverage.registry.collectionMappings,
  classifications:coverage.registry.crosswalks.map(c=>({id:c.schemeId+':'+c.code,schemeId:c.schemeId,code:c.code,disposition:c.disposition,domainIds:c.domainIds,nextAction:c.reviewBasis?.nextAction||null})),
  briefs:coverage.pilots.pilots.map(p=>({id:p.id,title:p.title,domainIds:p.domainIds,briefPath:p.briefPath,openGates:p.openGates,nextAction:p.nextAction})),
  pilots:records.map(r=>({id:r.id,pilotId:r.pilotId,title:r.title,revision:r.revision,status:r.status,publication:r.publication,domainIds:r.domainIds,requirements:r.reviewRequirements,limitations:r.reviewLimitations,reviews:r.reviews.filter(v=>v.revision===r.revision&&v.contentDigest===pilotCheck.records.find(p=>p.id===r.id).digest&&v.artifactDigest===pilotCheck.records.find(p=>p.id===r.id).artifactDigest)})),
  orientations:orientation.catalog.overviews.map(r=>({domainId:r.domainId,revision:r.revision,status:overviewCheck.reviewStatus,reviewedOn:orientation.catalog.review.receipts.filter(x=>x.domainIds.includes(r.domainId)).map(x=>x.reviewedOn).sort().at(-1)}))};
 return inputs;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const a=process.argv.slice(2),o={};while(a.length){const f=a.shift(),names={'--expansion-repo':'expansionRepo','--redesign-repo':'redesignRepo','--accepted-base':'acceptedBase','--as-of':'asOf','--expansion-ref':'expansionRef','--redesign-ref':'redesignRef'};if(!names[f])throw new Error('Unknown option '+f);o[names[f]]=a.shift();}const d=await captureDashboard(o);await writeFile(resolve(ROOT,'docs/coverage/dashboard/inputs.json'),JSON.stringify(d,null,2)+'\n');console.log(JSON.stringify({accepted:d.accepted.items.length,planned:d.accepted.plannedItems.length,pending:d.wave.declaredPending,redesign:d.redesign.items.length,sources:d.sources.length},null,2));}
 catch(e){console.error(e.message);process.exitCode=1;}
}
