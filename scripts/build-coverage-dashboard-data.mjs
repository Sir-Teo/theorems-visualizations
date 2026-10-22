import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { ROOT } from './lib.mjs';
import { buildCoverageModel } from './coverage-dashboard-model.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
export async function dashboardSnapshot(root=ROOT){
 const d=JSON.parse(await readFile(resolve(root,'docs/coverage/dashboard/inputs.json'),'utf8'));
 for(const f of d.localFiles){if(!/^(docs\/(coverage|pilots)\/|explorations\/)[a-zA-Z0-9/.-]+\.(json|md)$/.test(f.path)||f.path.includes('..'))throw new Error('Unsafe local dashboard input');if(hash(await readFile(resolve(root,f.path)))!==f.sha256)throw new Error('Dashboard local input is stale: '+f.path);}
 for(const script of ['build-explorations.mjs','build-domain-overviews.mjs']) execFileSync(process.execPath,[resolve(root,'scripts',script),'--check'],{cwd:root,stdio:'pipe'});
 const m=buildCoverageModel(d),files=d.sources.map(s=>({name:s.path+' @ '+s.commit.slice(0,12),description:s.label+'; commit '+s.commit+'; sha256 '+s.sha256+(s.derivation?'; '+s.derivation:'')}));
 const localFiles=d.localFiles.map(f=>({name:f.path,description:'Local reviewed snapshot; sha256 '+f.sha256}));
 const source={type:'repository-snapshot',files:[...files,...localFiles],description:'Pinned Git ledgers and isolated accepted-source build; local universal previews validated before capture.',lastUpdated:d.asOf,evidenceFlow:[{title:'Accepted production',detail:'git archive '+d.accepted.commit+'; node scripts/build.mjs --strict; reconcile unique IDs in data/index.json and data/planned.json.'},{title:'Independent work streams',detail:'Expansion ledger '+d.wave.expansionCommit+' and visual ledger '+d.redesign.commit+' read with git show; neither checkout modified.'},{title:'Derivation',detail:'scripts/capture-coverage-dashboard.mjs captures bounded evidence; scripts/coverage-dashboard-model.mjs partitions canonical IDs by primary collection home, keeps review scopes distinct and preserves unknown values.'}],caveats:['Snapshot, not a live monitor. Later commits are not included.','Local pilot AI acceptance is separate from production publication and human/professional evidence.','No atlas-wide screen-reader or learner evaluation ledger exists in these inputs; null means not established, not zero.']};
 source.evidenceFlow.push({title:'Exact source receipts',detail:[...files,...localFiles].map(f=>f.name+' — '+f.description).join('\n')});
 const query=(rows,definition,extra=[])=>({rows,source:{...source,metricDefinitions:[{label:'Scope',definition},...extra]},methods:[{language:'javascript',code:'buildCoverageModel(inputs) from scripts/coverage-dashboard-model.mjs; input identity and scope checks must pass before deriving these rows.'}]});
 const queries={
  domains:query(m.domainRows,'One row per domain. Production counts use each collection’s single primary home. Local pilots may appear in multiple domain rows; never sum those columns as unique global totals. Visual counts cover only the separate redesign ledger.'),
  collections:query(m.collectionRows,'One row per collection, counted once under its primary domain. Written and planned sets are disjoint canonical IDs in the accepted production snapshot.'),
  wave:query(m.waveRows,'One row per frozen Wave 6 chapter. Accepted IDs occur in the accepted source build. Awaiting review is the owning ledger’s report of whole frozen chapters; remaining items are outside those checkpoints and may include other drafts.'),
  pilots:query(m.pilotRows,'One row per pilot brief. Four local acceptances, two in-review implementations and two unimplemented briefs remain distinct. Review age is the age of the latest passed current exact-revision AI receipt, not the oldest required review or proof of comprehensive freshness; it is not an observation of learning or accessibility.'),
  classifications:query(m.classificationRows,'One row per external classification entry retaining a review action. Domain references overlap; filter without multiplying entries.'),
  summary:query([m.summary],'Global totals count each canonical item/pilot once. Production syllabus, eight-pilot programme, 24-lesson sequence target, frozen Wave 6 and visual redesign have different denominators.'),
  reconciliation:query(m.discrepancies,'Explicit differences between older saved progress fields and the controlling canonical accepted inventory; no source ledger has been overwritten.')
 };
 const snapshot={title:'Atlas coverage and review',surface:'dashboard',status:'observed',buildStatus:'creating',generatedAt:d.asOf,filters:[{id:'domain',label:'Domain',field:'domainId',defaultValue:'all',queryIds:['domains','collections','wave'],choiceLabels:Object.fromEntries(m.domainRows.map(r=>[r.domainId,r.domainId+' · '+r.domain]))}],queries,coverageEvidence:{acceptedCommit:d.accepted.commit,expansionCommit:d.wave.expansionCommit,redesignCommit:d.redesign.commit,inputSha256:hash(JSON.stringify(d))}};
 return {snapshot,model:m};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const {snapshot,model}=await dashboardSnapshot();const target=process.argv[2]||'coverage-dashboard/src/data.json';let prior;try{prior=JSON.parse(await readFile(resolve(ROOT,target),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}if(prior?.id)snapshot.id=prior.id;if(prior?.buildStatus)snapshot.buildStatus=prior.buildStatus;await writeFile(resolve(ROOT,target),JSON.stringify(snapshot,null,2)+'\n');await writeFile(resolve(ROOT,'docs/coverage/dashboard/model.json'),JSON.stringify(model,null,2)+'\n');console.log(JSON.stringify({target,queries:Object.keys(snapshot.queries),summary:model.summary},null,2));}
 catch(e){console.error(e.message);process.exitCode=1;}
}
