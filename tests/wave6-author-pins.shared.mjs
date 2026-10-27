// Historical chapter guards retain exact source bytes across a specifically proved reading-metadata integration.
// Every unlisted file remains an unconditional raw-byte pin.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {relative} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const hash=b=>createHash('sha256').update(b).digest('hex');
const fixtureBytes=fs.readFileSync(new URL('./fixtures/wave6-demo-music-art-bindings-before.json',import.meta.url));
assert.equal(hash(fixtureBytes),'00f0a9a41984a0ea10c3c1012d599ac3d32d7382558f52a3d4081a4210ac76f6');
export const integrationBefore=JSON.parse(fixtureBytes);
const prefix="import {authorPinBytes} from './wave6-author-pins.shared.mjs';\n";
const evidencePath='docs/integration/wave6-demo-music-art-content.json';
const verificationPath='docs/verification/wave6-demo-music-art-integration.md';
const added=[['demo',6,12],['music',10,13],['art',6,14]].flatMap(([col,ch,n])=>Array.from({length:n},(_,i)=>`${col}-${ch}.${i+1}`)).sort();
const omit=(obj,keys)=>Object.fromEntries(Object.entries(obj).filter(([key])=>!keys.includes(key)));
const hex=x=>assert.match(x,/^[a-f0-9]{64}$/);
export function validateBindingTransition(path,before,after){
 const allowed={
  'static-pages/accepted.json':['acceptedCommit','snapshotDigest','dataDigest','ids','sourceReconciliation'],
  'docs/journeys/targets.json':['acceptedCommit','snapshotDigest'],
  'docs/journeys/plans.json':['authorVerification'],
  'curriculum/introductory.json':['legacySnapshot'],
  'program/deeper-routes.json':['legacySnapshot','introductorySha256']
 }[path];
 assert.ok(allowed,'unlisted binding transition');
 assert.deepEqual(omit(after,allowed),omit(before,allowed),'every non-metadata field remains exact: '+path);
 if(path==='static-pages/accepted.json'){
  assert.equal(before.ids.length,8629);assert.equal(before.aliases.length,76);
  assert.deepEqual(after.ids,[...before.ids,...added].sort());assert.equal(new Set(after.ids).size,8668);
  assert.equal(after.acceptedCommit,integrationBefore.sourceCommit);hex(after.snapshotDigest);hex(after.dataDigest);
  assert.deepEqual(after.sourceReconciliation,{checkedOn:'2026-10-27',basis:'Source-backed author verification of DEMO6, MUSIC10 and ART6 under the continuous content goal; no additional independent review claimed',evidencePath,evidenceSha256:after.sourceReconciliation.evidenceSha256,verificationPath});hex(after.sourceReconciliation.evidenceSha256);
 }else if(path==='docs/journeys/targets.json'){
  assert.equal(after.acceptedCommit,integrationBefore.sourceCommit);hex(after.snapshotDigest);
 }else if(path==='docs/journeys/plans.json'){
  assert.deepEqual(omit(after.authorVerification,['checkedOn','contentDigest','evidencePath']),omit(before.authorVerification,['checkedOn','contentDigest','evidencePath']));
  assert.equal(after.authorVerification.checkedOn,'2026-10-27');assert.equal(after.authorVerification.evidencePath,verificationPath);hex(after.authorVerification.contentDigest);
 }else{hex(after.legacySnapshot);if(path==='program/deeper-routes.json')hex(after.introductorySha256);}
}
export function restorePinTestBytes(path,bytes){
 assert.ok(['tests/wave6-demo.test.mjs','tests/wave6-music.test.mjs','tests/wave6-art.test.mjs'].includes(path));
 let text=bytes.toString('utf8');assert.ok(text.startsWith(prefix));text=text.slice(prefix.length);
 const variable='hash';
 const adapted=`authorPinBytes(new URL('../'+path,import.meta.url),${variable})`;
 assert.equal(text.split(adapted).length,2,'one and only one narrow pin-read adapter');
 return Buffer.from(text.replace(adapted,"fs.readFileSync(new URL('../'+path,import.meta.url))"));
}
export function authorPinBytes(url,expected){
 const bytes=fs.readFileSync(url);if(hash(bytes)===expected)return bytes;
 const path=relative(root,fileURLToPath(url));
 if(Object.hasOwn(integrationBefore.files,path)){
  const previous=integrationBefore.files[path],beforeBytes=Buffer.from(previous.text);
  assert.equal(previous.sha256,expected,path+' historical preimage');assert.equal(hash(beforeBytes),expected);
  const after=JSON.parse(bytes);validateBindingTransition(path,JSON.parse(beforeBytes),after);
  const accepted=JSON.parse(fs.readFileSync(new URL('../static-pages/accepted.json',import.meta.url)));
  const evidenceBytes=fs.readFileSync(new URL('../'+evidencePath,import.meta.url)),evidence=JSON.parse(evidenceBytes);
  assert.equal(hash(evidenceBytes),accepted.sourceReconciliation.evidenceSha256);
  assert.equal(evidence.baseManifestSha256,integrationBefore.files['static-pages/accepted.json'].sha256);
  assert.equal(evidence.snapshotDigest,accepted.snapshotDigest);assert.equal(evidence.dataDigest,accepted.dataDigest);
  assert.equal(evidence.retainedIdeas,8629);assert.equal(evidence.addedIdeas,39);assert.equal(evidence.mergedIdeas,8668);
  if(path==='docs/journeys/targets.json')assert.equal(after.snapshotDigest,accepted.snapshotDigest);
  if(['curriculum/introductory.json','program/deeper-routes.json'].includes(path))assert.equal(after.legacySnapshot,accepted.snapshotDigest);
  if(path==='program/deeper-routes.json')assert.equal(after.introductorySha256,hash(fs.readFileSync(new URL('../curriculum/introductory.json',import.meta.url))));
  if(path!=='static-pages/accepted.json'){
   const bindings=JSON.parse(fs.readFileSync(new URL('../docs/integration/wave6-demo-music-art-bindings.json',import.meta.url)));
   const row=bindings.files.find(row=>row.path===path);assert.ok(row);assert.equal(hash(bytes),row.afterFileSha256);assert.equal(expected,row.beforeFileSha256);
  }
  return beforeBytes;
 }
 if(['tests/wave6-demo.test.mjs','tests/wave6-music.test.mjs','tests/wave6-art.test.mjs'].includes(path)){
  const restored=restorePinTestBytes(path,bytes);assert.equal(hash(restored),expected,path+' exact original guard reconstruction');return restored;
 }
 assert.equal(hash(bytes),expected,path+' protected raw bytes');return bytes;
}
