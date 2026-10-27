// Bounded current transition plus byte-exact historical data and guard reconstruction.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import{createHash}from'node:crypto';import{fileURLToPath}from'node:url';
import{ROOT,loadAll as liveLoadAll}from'../scripts/lib.mjs';import{projectIdeas,digest}from'../scripts/static-ideas.mjs';
import{validateCurrentBindingTransition as validateArchLing,restoreCurrentPinAdapter as restoreArchLingAdapter}from'./wave6-arch-ling-pins.shared.mjs';import{validateBindingTransition as validateDemoMusicArt}from'./wave6-author-pins.shared.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>fs.readFileSync(ROOT+'/'+p),parse=p=>JSON.parse(read(p)),bindingBytes=read('tests/fixtures/wave6-phil-tech-bindings-before.json'),dataBytes=read('tests/fixtures/wave6-phil-tech-data-reconstruction.json');
assert.equal(sha(bindingBytes),'89bc28e82bb3aa8b0b124c09fa8eef9d2c3e1c9365bca847fff0df39f5832bad');assert.equal(sha(dataBytes),'2d59d27921438716696075f597d71fbae16f465c5b4f063e74f7777e25a888f2');
export const integrationBefore=JSON.parse(bindingBytes),dataReconstruction=JSON.parse(dataBytes),addedIds=integrationBefore.addedIds;
const archBefore=parse('tests/fixtures/wave6-arch-ling-bindings-before.json'),legacyBefore=parse('tests/fixtures/wave6-demo-music-art-bindings-before.json'),previousAccepted=JSON.parse(integrationBefore.files['static-pages/accepted.json'].text),omit=(x,keys)=>Object.fromEntries(Object.entries(x).filter(([k])=>!keys.includes(k)));
export function validateCurrentBindingTransition(p,before,after){
 assert.ok(Object.hasOwn(integrationBefore.files,p));assert.deepEqual(before,JSON.parse(integrationBefore.files[p].text),'exact before metadata object');
 const allowed={'static-pages/accepted.json':['acceptedCommit','snapshotDigest','dataDigest','ids','sourceReconciliation'],'docs/journeys/targets.json':['acceptedCommit','snapshotDigest'],'docs/journeys/plans.json':['authorVerification'],'curriculum/introductory.json':['legacySnapshot'],'program/deeper-routes.json':['legacySnapshot','introductorySha256']}[p];assert.deepEqual(omit(after,allowed),omit(before,allowed),'all nonmetadata fields exact '+p);
 if(p==='static-pages/accepted.json'){
  assert.equal(before.ids.length,8695);assert.equal(before.aliases.length,76);assert.deepEqual(after.ids,[...before.ids,...addedIds].sort());assert.equal(new Set(after.ids).size,8720);assert.equal(after.acceptedCommit,integrationBefore.sourceCommit);assert.equal(after.snapshotDigest,integrationBefore.afterSnapshotDigest);assert.equal(after.dataDigest,dataReconstruction.currentDigest);
  assert.deepEqual(after.sourceReconciliation,{checkedOn:'2026-10-27',basis:'Source-backed author verification of PHIL6 and TECH7 under the continuous content goal; no additional independent review claimed',evidencePath:integrationBefore.evidencePath,evidenceSha256:integrationBefore.evidenceSHA256,verificationPath:integrationBefore.verificationPath});
 }else if(p==='docs/journeys/targets.json'){assert.equal(after.acceptedCommit,integrationBefore.sourceCommit);assert.equal(after.snapshotDigest,integrationBefore.afterSnapshotDigest);}
 else if(p==='docs/journeys/plans.json'){assert.deepEqual(omit(after.authorVerification,['checkedOn','contentDigest','evidencePath']),omit(before.authorVerification,['checkedOn','contentDigest','evidencePath']));assert.deepEqual(after.authorVerification,integrationBefore.expectedAuthorVerification);}
 else{assert.equal(after.legacySnapshot,integrationBefore.afterSnapshotDigest);if(p==='program/deeper-routes.json')assert.equal(after.introductorySha256,integrationBefore.expectedIntroductorySHA256);}
}
export function readGeneratedBytes(directory){
 const files={};function visit(prefix=''){for(const e of fs.readdirSync(path.join(directory,prefix),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const p=prefix?prefix+'/'+e.name:e.name;if(e.isDirectory())visit(p);else{assert.ok(e.isFile(),'regular generated file');let b=fs.readFileSync(path.join(directory,p));if(['index.json','home.json'].includes(p)){const x=JSON.parse(b);delete x.generated;b=Buffer.from(JSON.stringify(x));}files[p]=b;}}}visit();return files;
}
function reverse(value,operations){
 const holder={root:structuredClone(value)};for(const op of operations.toReversed()){
  const full=['root',...op.path],parent=full.slice(0,-1).reduce((o,k)=>o[k],holder),k=full.at(-1),current=parent[k];
  if(op.op==='value'){assert.equal(sha(JSON.stringify(current)),op.afterSHA256);parent[k]=structuredClone(op.before);}
  else if(op.op==='arraySplice'){assert.ok(Array.isArray(current));assert.deepEqual(current.slice(op.start,op.start+op.afterCount).map(x=>sha(JSON.stringify(x))),op.afterSHA256);current.splice(op.start,op.afterCount,...structuredClone(op.beforeSlice));}
  else{assert.equal(op.op,'objectKeys');assert.deepEqual(Object.keys(current),op.afterKeys);for(const[key,h]of Object.entries(op.addedSHA256))assert.equal(sha(JSON.stringify(current[key])),h);parent[k]=Object.fromEntries(op.beforeKeys.map(key=>[key,Object.hasOwn(op.removed,key)?structuredClone(op.removed[key]):current[key]]));}
 }return holder.root;
}
export function reconstructGeneratedData(files){
 assert.deepEqual(Object.keys(files),Object.keys(dataReconstruction.afterFileHashes),'complete current generated file path/order inventory');const beforeMap={},afterMap={};let reconstructedFiles=0;
 for(const[p,raw]of Object.entries(files)){
  const bytes=Buffer.from(raw);afterMap[p]=sha(bytes);assert.equal(afterMap[p],dataReconstruction.afterFileHashes[p],'complete current generated file '+p);const row=dataReconstruction.files[p];let old=bytes;
  if(row){const value=reverse(JSON.parse(bytes),row.operations);old=Buffer.from(row.format?JSON.stringify(value,null,row.format.space??undefined)+row.format.lf:JSON.stringify(value));assert.equal(sha(old),row.beforeSHA256,'whole original generated bytes '+p);reconstructedFiles++;}
  beforeMap[p]=sha(old);assert.equal(beforeMap[p],dataReconstruction.beforeFileHashes[p],'exact full historical generated file '+p);
 }
 const beforeDigest=sha(JSON.stringify(beforeMap)),currentDigest=sha(JSON.stringify(afterMap));assert.equal(beforeDigest,dataReconstruction.beforeDigest);assert.equal(currentDigest,dataReconstruction.currentDigest);assert.equal(reconstructedFiles,5);return{beforeMap,afterMap,beforeDigest,currentDigest,reconstructedFiles};
}
export function validateAllCurrent(){
 for(const[p,row]of Object.entries(integrationBefore.files)){assert.equal(sha(Buffer.from(row.text)),row.sha256);const bytes=read(p);assert.equal(sha(bytes),integrationBefore.afterFiles[p].sha256,'complete bounded metadata after '+p);validateCurrentBindingTransition(p,JSON.parse(row.text),JSON.parse(bytes));}
 const evidenceBytes=read(integrationBefore.evidencePath),e=JSON.parse(evidenceBytes);assert.equal(sha(evidenceBytes),integrationBefore.evidenceSHA256);assert.equal(e.sourceCommit,integrationBefore.sourceCommit);assert.equal(e.baseManifestSha256,integrationBefore.files['static-pages/accepted.json'].sha256);assert.equal(e.retainedIdeas,8695);assert.equal(e.addedIdeas,25);assert.equal(e.mergedIdeas,8720);assert.deepEqual(e.addedIds,addedIds);assert.deepEqual(e.changedRetainedItems,[]);assert.equal(e.snapshotDigest,integrationBefore.afterSnapshotDigest);assert.equal(e.dataDigest,dataReconstruction.currentDigest);assert.equal(sha(read('docs/integration/wave6-phil-tech-bindings.json')),integrationBefore.bindingsReceiptSHA256);return reconstructGeneratedData(readGeneratedBytes(ROOT+'/data'));
}
export function restoreIntegrationAdapter(p,bytes){
 const row=integrationBefore.adapterFiles[p];assert.ok(row,'only four explicitly listed source adapters');assert.equal(sha(bytes),row.afterSHA256,'no extra edit to adapted source '+p);let text=bytes.toString();for(const r of row.replacements.toReversed()){if(r.prefixOnly){assert.ok(text.startsWith(r.after));text=text.slice(r.after.length);}else{assert.equal(text.split(r.after).length,2,'one exact reverse source hook');text=text.replace(r.after,r.before);}}assert.equal(text,row.text,'complete original source');const original=Buffer.from(text);assert.equal(sha(original),row.sha256);return original;
}
export function resolveLaterPin(url,expected){
 const bytes=fs.readFileSync(url);if(sha(bytes)===expected)return null;const p=path.relative(ROOT,fileURLToPath(url));
 if(Object.hasOwn(integrationBefore.files,p)){
  validateAllCurrent();validateArchLing(p,JSON.parse(archBefore.files[p].text),JSON.parse(integrationBefore.files[p].text));validateDemoMusicArt(p,JSON.parse(legacyBefore.files[p].text),JSON.parse(archBefore.files[p].text));const row=[integrationBefore,archBefore,legacyBefore].map(x=>x.files[p]).find(x=>x.sha256===expected);assert.ok(row,'only exact known historical snapshot hash '+p);const original=Buffer.from(row.text);assert.equal(sha(original),expected);return original;
 }
 if(Object.hasOwn(integrationBefore.adapterFiles,p)){validateAllCurrent();assert.equal(expected,integrationBefore.adapterFiles[p].sha256);return restoreIntegrationAdapter(p,bytes);}
 if(Object.hasOwn(archBefore.adapterFiles,p)){validateAllCurrent();assert.equal(expected,archBefore.adapterFiles[p].sha256,'exact predecessor source hash');return restoreArchLingAdapter(p,bytes);}return null;
}
export function historicalPinBytes(url,expected){const previous=resolveLaterPin(url,expected);if(previous!==null)return previous;const bytes=fs.readFileSync(url);assert.equal(sha(bytes),expected,'unconditionally protected raw bytes');return bytes;}
export function historicalSnapshotBytes(p){if(Object.hasOwn(integrationBefore.files,p)){validateAllCurrent();return Buffer.from(integrationBefore.files[p].text);}return read(p);}
export async function historicalLoadAll(){
 validateAllCurrent();const data=await liveLoadAll();assert.deepEqual(data.items.map(x=>x.id).sort(),[...previousAccepted.ids,...addedIds].sort());assert.equal(digest(projectIdeas(data,previousAccepted.ids,previousAccepted.aliases)),previousAccepted.snapshotDigest,'every complete prior projection');assert.equal(digest(projectIdeas(data,[...previousAccepted.ids,...addedIds].sort(),previousAccepted.aliases)),integrationBefore.afterSnapshotDigest,'complete current source projection');const added=new Set(addedIds);return{...data,items:data.items.filter(x=>!added.has(x.id))};
}
export async function historicalGeneratedDataDigest(directory){return reconstructGeneratedData(readGeneratedBytes(directory)).beforeDigest;}
