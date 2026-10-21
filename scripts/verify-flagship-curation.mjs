// Check evidence links and content freshness; this does not perform source or
// proof review, nor turn a working step control into a curated proof.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,access} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve,join} from 'node:path';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
export function curatedDigest(item){
  const fields=Object.fromEntries(['num','kind','name','statement','idea','caption','scope','deps','refs','credit','tags','links'].map(k=>[k,item[k]??null]));
  return createHash('sha256').update(JSON.stringify({...fields,viz:String(item.viz)})).digest('hex');
}
export async function verifyCurated(registry){
  assert.equal(registry.version,1);assert.equal(registry.target,100);
  const ids=new Set();
  for(const record of registry.accepted){
    assert.ok(!ids.has(record.id),`duplicate curated ID ${record.id}`);ids.add(record.id);
    const chapter=(await import(pathToFileURL(join(ROOT,record.file)))).default;
    const item=chapter.items.find(i=>`${chapter.collection}-${i.num}`===record.id);assert.ok(item,record.id);
    assert.equal(curatedDigest(item),record.contentSHA256,`${record.id}: item changed since proof curation`);
    const module=await readFile(join(ROOT,record.file),'utf8');
    assert.equal(createHash('sha256').update(module.split('export default')[0]).digest('hex'),record.moduleSupportSHA256,`${record.id}: module helper code changed`);
    for(const[file,hash]of Object.entries(record.supportFiles))assert.equal(createHash('sha256').update(await readFile(join(ROOT,file))).digest('hex'),hash,`${record.id}: support file changed: ${file}`);
    assert.ok(!item.verify,`${record.id}: retained source flag`);
    assert.ok(/\.steps\(/.test(String(item.viz)),`${record.id}: no direct proof player`);
    assert.ok(record.selectionReason&&record.source.url&&record.source.sha256&&record.source.pages.length);
    assert.ok(record.checks.mathGroups>0&&record.checks.nativeGroups>0&&record.checks.allFrames);
    await access(join(ROOT,record.report));
    for(const file of record.tests)await access(join(ROOT,file));
  }
  return {accepted:ids.size,target:registry.target,remaining:Math.max(0,registry.target-ids.size)};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const registry=JSON.parse(await readFile(join(ROOT,'docs/verification/flagship-proof-curation.json'),'utf8'));
  const r=await verifyCurated(registry);console.log(`PASS curated-proof records: ${r.accepted}/${r.target}; ${r.remaining} still needed. Evidence/freshness check only; no new proof audit performed.`);
}
