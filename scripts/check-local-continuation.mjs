// User-authorized local checks. This records author verification, never an independent review.
import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, loadRegistry } from './lib.mjs';
import { loadExplorations, loadExplorationSourceIds, explorationCodeHashes, buildExplorations } from './build-explorations.mjs';
import { contentDigest, reviewArtifactDigest, validateExploration } from '../explorations/contract.mjs';
import { readOrientation, orientationHashes, buildDomainOverviews } from './build-domain-overviews.mjs';
import { overviewDigest, overviewArtifactDigest, validateOverviews } from '../orientation/contract.mjs';
const defaultEvidencePath='docs/verification/universal-author-continuation.md';
const tests=['tests/exploration-methods.test.mjs','tests/exploration-studio.test.mjs','tests/exploration-professions.test.mjs','tests/exploration-followups.test.mjs','tests/exploration-sequences.test.mjs'];
export async function checkLocalContinuation({record=false,checkedOn,evidencePath=defaultEvidencePath}={}) {
  if(record&&!/^\d{4}-\d{2}-\d{2}$/.test(checkedOn||''))throw new Error('Recording needs --date YYYY-MM-DD; use the actual check date');
  if(!/^docs\/verification\/[a-z0-9-]+\.md$/.test(evidencePath))throw new Error('Unsafe author evidence path');
  await readFile(join(ROOT,evidencePath),'utf8');
  const [{manifest,records},runtime,sourceIds]=await Promise.all([loadExplorations(),loadRegistry(),loadExplorationSourceIds()]);
  const coverage=JSON.parse(await readFile(join(ROOT,'docs/coverage/registry.json'),'utf8'));
  const context={domainIds:coverage.domains.map(d=>d.id),collectionIds:runtime.collections.map(c=>c.id),sourceIds};
  const errors=records.flatMap(r=>validateExploration({...r,status:r.status==='withdrawn'?'withdrawn':'draft'},context));
  const data=await readOrientation(),candidate=structuredClone(data);delete candidate.catalog.authorVerification;candidate.catalog.review.status='in-review';
  errors.push(...validateOverviews(candidate));
  if(errors.length)throw new Error(errors.join('\n'));
  const result=spawnSync(process.execPath,['--test',...tests],{cwd:ROOT,encoding:'utf8',maxBuffer:8*1024*1024});
  if(result.error||result.status!==0)throw new Error('Author model/source checks failed:\n'+(result.error||result.stdout+result.stderr));
  if(!record)return {mode:'read-only',records:records.length,modelChecks:'passed',testFiles:tests,scope:'Does not grant acceptance, independent review or publication.'};
  const hashes=await explorationCodeHashes(),titles=Object.fromEntries(runtime.collections.map(c=>[c.id,c.title]));
  for(const [i,r]of records.entries()){
    if(r.status==='withdrawn')continue;
    if(r.status==='accepted'&&r.authorVerification?.contentDigest===contentDigest(r)&&r.authorVerification?.artifactDigest===reviewArtifactDigest(r,hashes,titles))continue;
    r.authorVerification={kind:'author-check',scope:'local-preview',author:r.author,checkedOn,revision:r.revision,contentDigest:contentDigest(r),artifactDigest:reviewArtifactDigest(r,hashes,titles),evidencePath,checks:['Schema, source-reference and preparation-packet hash validation',...tests.map(p=>'Passed '+p)]};
    r.status='accepted';
    const errors=validateExploration(r,{...context,artifactDigest:r.authorVerification.artifactDigest});if(errors.length)throw new Error(errors.join('\n'));
    await writeFile(join(ROOT,'explorations',manifest.entries[i].file),JSON.stringify(r,null,2)+'\n');
  }
  await buildExplorations();
  // Reload because lifecycle changes affect the links bound to orientation rendering.
  const current=await readOrientation(),orientationCode=await orientationHashes();
  current.catalog.authorVerification={kind:'author-check',author:current.catalog.review.author,checkedOn,contentDigest:overviewDigest(current,current.catalog.overviews.map(r=>r.domainId)),artifactDigest:overviewArtifactDigest(current,orientationCode),evidencePath};
  const problems=validateOverviews(current,current.catalog.authorVerification.artifactDigest);if(problems.length)throw new Error(problems.join('\n'));
  await writeFile(join(ROOT,'docs/coverage/overviews.json'),JSON.stringify(current.catalog,null,2)+'\n');
  await buildDomainOverviews();
  return {mode:'record-author-checks',records:records.filter(r=>r.status==='accepted').length,orientations:current.catalog.overviews.length,testFiles:tests,scope:'Local only; historical reviews retained; unperformed observations remain unperformed.'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const args=process.argv.slice(2),options={};while(args.length){const arg=args.shift();if(arg==='--record')options.record=true;else if(arg==='--date')options.checkedOn=args.shift();else if(arg==='--evidence')options.evidencePath=args.shift();else throw new Error('Use --record --date YYYY-MM-DD, or no arguments for read-only checks');}console.log(JSON.stringify(await checkLocalContinuation(options),null,2));}catch(error){console.error(error.message);process.exitCode=1;}
}
