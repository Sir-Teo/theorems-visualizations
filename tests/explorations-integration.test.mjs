import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { planOverlay } from '../scripts/check-exploration-integration.mjs';
async function fixture(fn){const dir=await mkdtemp(join(tmpdir(),'pilot-overlay-test-'));const source=join(dir,'source'),target=join(dir,'target');await mkdir(join(source,'explorations'),{recursive:true});await mkdir(join(target,'explorations'),{recursive:true});try{await fn(source,target);}finally{await rm(dir,{recursive:true,force:true});}}
test('integration preflight refuses production paths and traversal before copying',()=>fixture(async(source,target)=>{
  for(const path of ['content/history/ch01.js','assets/js/app.js','MASTER_PLAN.md','explorations/../README.md','/explorations/test.json'])await assert.rejects(planOverlay(source,target,[path]),/Outside additive/);
}));
test('integration preflight reports differing files without overwriting either checkout',()=>fixture(async(source,target)=>{
  await writeFile(join(source,'explorations/history.json'),'new source');await writeFile(join(target,'explorations/history.json'),'destination work');
  await assert.rejects(planOverlay(source,target,['explorations/history.json']),/reconcile explicitly/);
  assert.equal(await readFile(join(target,'explorations/history.json'),'utf8'),'destination work');
  assert.equal(await readFile(join(source,'explorations/history.json'),'utf8'),'new source');
}));
test('identical files and additive files yield a read-only reviewable plan',()=>fixture(async(source,target)=>{
  await writeFile(join(source,'explorations/history.json'),'same');await writeFile(join(target,'explorations/history.json'),'same');await writeFile(join(source,'explorations/literature.json'),'new');
  const plan=await planOverlay(source,target,['explorations/history.json','explorations/literature.json']);assert.deepEqual(plan.map(x=>x.action),['identical','add']);
  await assert.rejects(readFile(join(target,'explorations/literature.json')),/ENOENT/);
}));
