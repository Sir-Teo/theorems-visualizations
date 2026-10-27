import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {ROOT} from '../scripts/lib.mjs';
import {historicalLoadAll as loadAll,historicalSnapshotBytes} from './wave6-phil-tech-pins.shared.mjs';
import {projectIdeas,selectFrozenIdeas,digest} from '../scripts/static-ideas.mjs';
import {historicalGeneratedDataDigest as generatedDataDigest} from './wave6-phil-tech-pins.shared.mjs';
import {journeyAuthorDigest} from '../scripts/check-journey-plans.mjs';
import {addedIds,integrationBefore,authorPinBytes,restoreCurrentPinAdapter,validateCurrentBindingTransition} from './wave6-arch-ling-pins.shared.mjs';
import {integrationBefore as legacyBefore,authorPinBytes as legacyPinBytes} from './wave6-author-pins.shared.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(historicalSnapshotBytes(p));
test('ARCH/LING integration retains all8668complete projections and adds exactly27frozen lessons',async()=>{
 const before=JSON.parse(integrationBefore.files['static-pages/accepted.json'].text),now=read('static-pages/accepted.json'),data=await loadAll(),evidence=read('docs/integration/wave6-arch-ling-content.json');
 assert.equal(digest(projectIdeas(data,before.ids,before.aliases)),before.snapshotDigest);assert.deepEqual(now.ids,[...before.ids,...addedIds].sort());assert.deepEqual(data.items.map(i=>i.id).sort(),now.ids);assert.deepEqual(now.aliases,before.aliases);assert.equal(now.aliases.length,76);assert.equal(selectFrozenIdeas(data,now).selected.length,8695);assert.equal(await generatedDataDigest(ROOT+'/data'),now.dataDigest);assert.equal(evidence.sourceCommit,'fcf3033f56195834800f6e492cb82e929a58c679');assert.equal(evidence.retainedIdeas,8668);assert.equal(evidence.addedIdeas,27);assert.deepEqual(evidence.changedRetainedItems,[]);assert.deepEqual(data.items.filter(i=>addedIds.includes(i.id)&&i.verify).map(i=>i.id),[]);
});
test('ARCH/LING allfour ordered route arrays and their nonmetadata fields stay exact',()=>{
 for(const path of['docs/journeys/targets.json','docs/journeys/plans.json','curriculum/introductory.json','program/deeper-routes.json']){const before=JSON.parse(integrationBefore.files[path].text),now=read(path),key=path.endsWith('targets.json')?'targets':'routes';assert.deepEqual(now[key],before[key]);validateCurrentBindingTransition(path,before,now);}
 const plans=read('docs/journeys/plans.json'),targets=read('docs/journeys/targets.json');assert.equal(plans.authorVerification.contentDigest,journeyAuthorDigest(plans,read('docs/journeys/sources.json'),targets));
});
test('ARCH/LING all7234other tracked files stay raw-byte-exact; three original sources reconstruct entirely',()=>{
 const p=read('docs/integration/wave6-arch-ling-preservation.json');assert.equal(p.pinnedFiles,7234);assert.equal(Object.keys(p.pins).length,7234);for(const[path,h]of Object.entries(p.pins))assert.equal(sha(fs.readFileSync(ROOT+'/'+path)),h,path);
 for(const[path,before]of Object.entries(integrationBefore.adapterFiles)){const bytes=fs.readFileSync(ROOT+'/'+path);assert.equal(sha(restoreCurrentPinAdapter(path,bytes)),before.sha256);assert.equal(sha(execFileSync('git',['show',integrationBefore.sourceCommit+':'+path],{cwd:ROOT})),before.sha256);}
});
test('ARCH/LING the current and original39-entry guards return only their exact proved preimages',()=>{
 for(const[path,before]of Object.entries(integrationBefore.files))assert.equal(sha(authorPinBytes(new URL('../'+path,import.meta.url),before.sha256)),before.sha256);
 for(const[path,before]of Object.entries(legacyBefore.files))assert.equal(sha(legacyPinBytes(new URL('../'+path,import.meta.url),before.sha256)),before.sha256);
});
test('ARCH/LING metadata transition rejects changed route bodies, aliases, missing or additional ids and flags',()=>{
 for(const[path,row]of Object.entries(integrationBefore.files)){const before=JSON.parse(row.text),now=read(path),changed=structuredClone(now);if(path==='static-pages/accepted.json')changed.ids.push('ling-6.999');else changed[path.endsWith('targets.json')?'targets':'routes'][0].title+=' altered';assert.throws(()=>validateCurrentBindingTransition(path,before,changed));const flag=structuredClone(now);flag.accepted=true;assert.throws(()=>validateCurrentBindingTransition(path,before,flag));}
 const path='static-pages/accepted.json',before=JSON.parse(integrationBefore.files[path].text),now=read(path);for(const change of[x=>x.ids.pop(),x=>x.ids.push(x.ids[0]),x=>x.aliases[0].to='ling-6.1',x=>x.acceptedCommit='0'.repeat(40)]){const x=structuredClone(now);change(x);assert.throws(()=>validateCurrentBindingTransition(path,before,x));}
});
test('ARCH/LING an extra edit to any original guard cannot be hidden by its adapter',()=>{
 for(const path of Object.keys(integrationBefore.adapterFiles)){const bytes=fs.readFileSync(ROOT+'/'+path),changed=Buffer.concat([bytes,Buffer.from('\n// extra edit\n')]);assert.throws(()=>restoreCurrentPinAdapter(path,changed));}
 assert.throws(()=>authorPinBytes(new URL('../scripts/lib.mjs',import.meta.url),'0'.repeat(64)));
});
