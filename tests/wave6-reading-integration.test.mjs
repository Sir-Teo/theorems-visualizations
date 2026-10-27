import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {authorPinBytes,integrationBefore,validateBindingTransition,restorePinTestBytes} from './wave6-author-pins.shared.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
test('39-entry reading integration reconstructs all five exact historical binding preimages',()=>{
 for(const[path,before]of Object.entries(integrationBefore.files))assert.equal(sha(authorPinBytes(new URL('../'+path,import.meta.url),before.sha256)),before.sha256);
});
test('snapshot transition rejects edited route bodies, aliases and extra roster entries',()=>{
 for(const path of ['docs/journeys/targets.json','docs/journeys/plans.json','curriculum/introductory.json','program/deeper-routes.json']){
  const before=JSON.parse(integrationBefore.files[path].text),after=JSON.parse(fs.readFileSync(new URL('../'+path,import.meta.url))),key=path.endsWith('targets.json')?'targets':'routes';
  after[key][0].title='An unauthorized route/body edit';assert.throws(()=>validateBindingTransition(path,before,after));
 }
 const path='static-pages/accepted.json',before=JSON.parse(integrationBefore.files[path].text),after=JSON.parse(fs.readFileSync(new URL('../'+path,import.meta.url)));
 const extra=structuredClone(after);extra.ids.push('art-6.999');assert.throws(()=>validateBindingTransition(path,before,extra));
 const alias=structuredClone(after);alias.aliases[0].to='art-6.1';assert.throws(()=>validateBindingTransition(path,before,alias));
});
test('three historical chapter tests reconstruct byte-exact after only the explicit pin adapter',()=>{
 const proof=JSON.parse(fs.readFileSync(new URL('../docs/integration/wave6-demo-music-art-test-transition.json',import.meta.url)));
 for(const row of proof.files){const bytes=fs.readFileSync(new URL('../'+row.path,import.meta.url));assert.equal(sha(bytes),row.afterSHA256);assert.equal(sha(restorePinTestBytes(row.path,bytes)),row.beforeSHA256);const changed=Buffer.from(bytes.toString().replace("import test",'import alteredTest'));assert.throws(()=>authorPinBytes(new URL('../'+row.path,import.meta.url),'0'.repeat(64)));assert.notEqual(sha(restorePinTestBytes(row.path,changed)),row.beforeSHA256);}
});
