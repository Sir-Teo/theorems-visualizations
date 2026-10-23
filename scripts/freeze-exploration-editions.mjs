import { readFile, writeFile, mkdir, lstat } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, loadRegistry } from './lib.mjs';
import { loadExplorations, buildExplorations } from './build-explorations.mjs';
import { REVIEW_CODE, SUPPLEMENTS, sha, jsonBytes, validateBundle } from './exploration-editions.mjs';

// Freeze exact reviewed artifacts. Existing edition bytes are never replaced, including review history.
export async function freezeEditions({checkOnly=false}={}) {
  const built=await buildExplorations({checkOnly:true});
  const [{records},registry]=await Promise.all([loadExplorations(),loadRegistry()]);
  const manifest=JSON.parse(await readFile(join(ROOT,'editions/manifest.json'),'utf8'));
  if(manifest.schemaVersion!==1 || !Array.isArray(manifest.bundles))throw new Error('Invalid edition manifest');
  const runtime={schemaVersion:1,files:Object.fromEntries(await Promise.all(REVIEW_CODE.map(async p=>[p,await readFile(join(ROOT,p),'utf8')])))},runtimeDigest=sha(jsonBytes(runtime));
  const coverage=JSON.parse(await readFile(join(ROOT,'docs/coverage/registry.json'),'utf8')),sources=JSON.parse(await readFile(join(ROOT,'docs/coverage/sources.json'),'utf8'));
  const context={domainIds:coverage.domains.map(x=>x.id),collectionIds:registry.collections.map(x=>x.id),sourceIds:sources.sources.filter(x=>['body-read','table-read','file-read'].includes(x.access.status)).map(x=>x.id),knownItemIds:[]};
  const outputs=new Map([[`editions/runtimes/${runtimeDigest}.json`,jsonBytes(runtime)]]);
  for(const record of records.filter(r=>r.status==='accepted')) {
    const proof=built.records.find(r=>r.id===record.id),path=`editions/bundles/${record.id}/${record.revision}.json`;
    const previewHTML=await readFile(join(ROOT,'labs/atlas',record.id,'index.html'),'utf8');
    const receipts=Object.fromEntries(await Promise.all([...new Set(record.reviews.map(r=>r.evidencePath))].map(async p=>{const text=await readFile(join(ROOT,p),'utf8');return [p,{text,sha256:sha(text)}];})));
    const supplements=Object.fromEntries(await Promise.all(SUPPLEMENTS.filter(p=>previewHTML.includes(`href="../../../${p}"`)).map(async p=>{const text=await readFile(join(ROOT,p),'utf8');return[p,{text,sha256:sha(text)}];})));
    const bundle={schemaVersion:1,id:record.id,revision:record.revision,record,context,collectionTitles:Object.fromEntries(record.relatedCollectionIds.map(id=>[id,registry.collections.find(c=>c.id===id)?.title||id])),runtimeDigest,contentDigest:proof.digest,artifactDigest:proof.artifactDigest,previewHTML,previewDigest:sha(previewHTML),receipts,supplements};
    const entry={id:record.id,revision:record.revision,path,sha256:sha(jsonBytes(bundle))};
    validateBundle(bundle,runtime,entry);
    const prior=manifest.bundles.find(e=>e.id===entry.id&&e.revision===entry.revision);
    if(prior && JSON.stringify(prior)!==JSON.stringify(entry))throw new Error('Retained edition changed; prepare a new reviewed content revision: '+record.id);
    if(!prior)manifest.bundles.push(entry);
    outputs.set(path,jsonBytes(bundle));
  }
  // Validate every existing immutable path before the first write.
  for(const [path,bytes]of outputs) {
    const status=await lstat(join(ROOT,path)).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
    if(status && (!status.isFile() || await readFile(join(ROOT,path),'utf8')!==bytes))throw new Error('Refusing to replace immutable edition artifact: '+path);
    if(checkOnly&&!status)throw new Error('Missing frozen edition: '+path);
  }
  const next=jsonBytes(manifest),old=await readFile(join(ROOT,'editions/manifest.json'),'utf8');
  if(checkOnly && next!==old)throw new Error('Edition manifest needs an explicit freeze');
  if(!checkOnly) {
    for(const [path,bytes]of outputs)if(!await lstat(join(ROOT,path)).catch(()=>null)){await mkdir(dirname(join(ROOT,path)),{recursive:true});await writeFile(join(ROOT,path),bytes,{flag:'wx'});}
    if(next!==old)await writeFile(join(ROOT,'editions/manifest.json'),next);
  }
  return {frozenCurrent:records.filter(r=>r.status==='accepted').length,retained:manifest.bundles.length,runtimeDigest,checkOnly};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {if(process.argv.slice(2).some(a=>a!=='--check'))throw new Error('Use --check or no arguments');console.log(jsonBytes(await freezeEditions({checkOnly:process.argv.includes('--check')})));}
  catch(e){console.error(e.message);process.exitCode=1;}
}
