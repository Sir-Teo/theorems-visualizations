// Exact, chained historical preimages for the explicitly bounded 27-entry integration.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {relative} from 'node:path';
import {authorPinBytes as legacyAuthorPinBytes,integrationBefore as legacyBefore,validateBindingTransition as validateLegacy} from './wave6-author-pins.shared.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
const fixture=fs.readFileSync(new URL('./fixtures/wave6-arch-ling-bindings-before.json',import.meta.url));
assert.equal(sha(fixture),'78801f8e610e5155c6676a2e7fc6b332103d03e334cd049ac89d435292395048');
export const integrationBefore=JSON.parse(fixture);
export const addedIds=[['arch',6,11],['ling',6,16]].flatMap(([col,ch,n])=>Array.from({length:n},(_,i)=>`${col}-${ch}.${i+1}`)).sort();
const evidencePath='docs/integration/wave6-arch-ling-content.json',verificationPath='docs/verification/wave6-arch-ling-integration.md';
const omit=(x,keys)=>Object.fromEntries(Object.entries(x).filter(([k])=>!keys.includes(k))),hex=x=>assert.match(x,/^[a-f0-9]{64}$/);
const read=p=>JSON.parse(fs.readFileSync(root+p));
export function validateCurrentBindingTransition(path,before,after){
 const allowed={
  'static-pages/accepted.json':['acceptedCommit','snapshotDigest','dataDigest','ids','sourceReconciliation'],
  'docs/journeys/targets.json':['acceptedCommit','snapshotDigest'],
  'docs/journeys/plans.json':['authorVerification'],
  'curriculum/introductory.json':['legacySnapshot'],
  'program/deeper-routes.json':['legacySnapshot','introductorySha256'],
 }[path];assert.ok(allowed,'unlisted snapshot transition');
 assert.deepEqual(omit(after,allowed),omit(before,allowed),'every non-metadata field remains exact: '+path);
 if(path==='static-pages/accepted.json'){
  assert.equal(before.ids.length,8668);assert.equal(before.aliases.length,76);assert.deepEqual(after.ids,[...before.ids,...addedIds].sort());assert.equal(new Set(after.ids).size,8695);assert.equal(after.acceptedCommit,integrationBefore.sourceCommit);hex(after.snapshotDigest);hex(after.dataDigest);
  assert.deepEqual(after.sourceReconciliation,{checkedOn:'2026-10-27',basis:'Source-backed author verification of ARCH6 and LING6 under the continuous content goal; no additional independent review claimed',evidencePath,evidenceSha256:after.sourceReconciliation.evidenceSha256,verificationPath});hex(after.sourceReconciliation.evidenceSha256);
 }else if(path==='docs/journeys/targets.json'){assert.equal(after.acceptedCommit,integrationBefore.sourceCommit);hex(after.snapshotDigest);}
 else if(path==='docs/journeys/plans.json'){assert.deepEqual(omit(after.authorVerification,['checkedOn','contentDigest','evidencePath']),omit(before.authorVerification,['checkedOn','contentDigest','evidencePath']));assert.equal(after.authorVerification.checkedOn,'2026-10-27');assert.equal(after.authorVerification.evidencePath,verificationPath);hex(after.authorVerification.contentDigest);}
 else{hex(after.legacySnapshot);if(path==='program/deeper-routes.json')hex(after.introductorySha256);}
}
function validateAllCurrent(){
 const accepted=read('static-pages/accepted.json'),evidenceBytes=fs.readFileSync(root+evidencePath),evidence=JSON.parse(evidenceBytes),bindings=read('docs/integration/wave6-arch-ling-bindings.json');
 assert.equal(sha(evidenceBytes),accepted.sourceReconciliation.evidenceSha256);assert.equal(evidence.baseManifestSha256,integrationBefore.files['static-pages/accepted.json'].sha256);assert.equal(evidence.sourceCommit,integrationBefore.sourceCommit);assert.equal(evidence.baseIntegrationCommit,integrationBefore.baseIntegrationCommit);assert.equal(evidence.retainedIdeas,8668);assert.equal(evidence.addedIdeas,27);assert.equal(evidence.mergedIdeas,8695);assert.deepEqual(evidence.addedIds,addedIds);assert.deepEqual(evidence.changedRetainedItems,[]);assert.equal(evidence.snapshotDigest,accepted.snapshotDigest);assert.equal(evidence.dataDigest,accepted.dataDigest);
 for(const[path,row]of Object.entries(integrationBefore.files)){
  assert.equal(sha(Buffer.from(row.text)),row.sha256);const bytes=fs.readFileSync(root+path),after=JSON.parse(bytes);validateCurrentBindingTransition(path,JSON.parse(row.text),after);
  if(path==='docs/journeys/targets.json')assert.equal(after.snapshotDigest,accepted.snapshotDigest);
  if(['curriculum/introductory.json','program/deeper-routes.json'].includes(path))assert.equal(after.legacySnapshot,accepted.snapshotDigest);
  if(path==='program/deeper-routes.json')assert.equal(after.introductorySha256,sha(fs.readFileSync(root+'curriculum/introductory.json')));
  if(path!=='static-pages/accepted.json'){const proof=bindings.files.find(x=>x.path===path);assert.ok(proof);assert.equal(proof.beforeFileSha256,row.sha256);assert.equal(proof.afterFileSha256,sha(bytes));}
 }
}
function validatePredecessor(path){
 // Use the original validator on the exact 39-entry transition, not on the moving roster.
 const old=legacyBefore.files[path],next=integrationBefore.files[path];assert.ok(old&&next);assert.equal(sha(Buffer.from(old.text)),old.sha256);validateLegacy(path,JSON.parse(old.text),JSON.parse(next.text));
 const accepted=JSON.parse(integrationBefore.files['static-pages/accepted.json'].text),bytes=fs.readFileSync(root+accepted.sourceReconciliation.evidencePath),evidence=JSON.parse(bytes);assert.equal(sha(bytes),accepted.sourceReconciliation.evidenceSha256);assert.equal(evidence.baseManifestSha256,legacyBefore.files['static-pages/accepted.json'].sha256);assert.equal(evidence.snapshotDigest,accepted.snapshotDigest);assert.equal(evidence.dataDigest,accepted.dataDigest);assert.equal(evidence.retainedIdeas,8629);assert.equal(evidence.addedIdeas,39);assert.equal(evidence.mergedIdeas,8668);
 if(path!=='static-pages/accepted.json'){const bindings=read('docs/integration/wave6-demo-music-art-bindings.json'),proof=bindings.files.find(x=>x.path===path);assert.ok(proof);assert.equal(proof.beforeFileSha256,old.sha256);assert.equal(proof.afterFileSha256,next.sha256);}
}
export function restoreCurrentPinAdapter(path,bytes){
 const before=integrationBefore.adapterFiles[path];assert.ok(before,'unlisted source adapter');let text=bytes.toString();
 if(path==='tests/wave6-author-pins.shared.mjs'){
  const prefix="import {resolveLaterAuthorPin} from './wave6-arch-ling-pins.shared.mjs';\n",hook=' const later=resolveLaterAuthorPin(url,expected);if(later!==null)return later;\n';assert.ok(text.startsWith(prefix));assert.equal(text.split(hook).length,2);text=text.slice(prefix.length).replace(hook,'');
 }else{
  const prefix="import {authorPinBytes} from './wave6-arch-ling-pins.shared.mjs';\n",adapted="authorPinBytes(new URL('../'+path,import.meta.url),hash)",original="fs.readFileSync(new URL('../'+path,import.meta.url))";assert.ok(text.startsWith(prefix));assert.equal(text.split(adapted).length,2);text=text.slice(prefix.length).replace(adapted,original);
 }
 const restored=Buffer.from(text);assert.equal(sha(restored),before.sha256,'whole original source bytes: '+path);assert.equal(text,before.text);return restored;
}
export function resolveLaterAuthorPin(url,expected){
 const bytes=fs.readFileSync(url);if(sha(bytes)===expected)return null;const path=relative(root,fileURLToPath(url));
 if(Object.hasOwn(integrationBefore.files,path)){
  validateAllCurrent();const current=integrationBefore.files[path];if(current.sha256===expected)return Buffer.from(current.text);
  const old=legacyBefore.files[path];assert.ok(old);assert.equal(old.sha256,expected,'exact known historical preimage');validatePredecessor(path);return Buffer.from(old.text);
 }
 if(Object.hasOwn(integrationBefore.adapterFiles,path)){validateAllCurrent();assert.equal(integrationBefore.adapterFiles[path].sha256,expected);return restoreCurrentPinAdapter(path,bytes);}
 return null;
}
export function authorPinBytes(url,expected){const later=resolveLaterAuthorPin(url,expected);return later===null?legacyAuthorPinBytes(url,expected):later;}
