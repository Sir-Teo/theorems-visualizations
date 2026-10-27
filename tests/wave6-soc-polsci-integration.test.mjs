import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {loadAll,ROOT} from '../scripts/lib.mjs';
import {projectIdeas,selectFrozenIdeas,digest} from '../scripts/static-ideas.mjs';
test('SOC6/POLSCI7 reading integration adds exactly19 frozen lessons and retains every earlier complete projection',async()=>{
 const old=JSON.parse(execFileSync('git',['show','32b07974eb5c7cb9840459250c5c6d4febbaab0a:static-pages/accepted.json'],{cwd:ROOT,encoding:'utf8'}));
 const current=JSON.parse(fs.readFileSync(ROOT+'/static-pages/accepted.json'));
 const bytes=fs.readFileSync(ROOT+'/docs/integration/wave6-soc-polsci-content.json'),evidence=JSON.parse(bytes);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'2bd3642156dfd9274f0d1d1fdb7a4c3a36e47015a94f8640c4364361a35987a8');
 const data=await loadAll();assert.equal(digest(projectIdeas(data,old.ids,old.aliases)),old.snapshotDigest);assert.deepEqual(current.aliases,old.aliases);
 const expected=[['soc',6,8],['polsci',7,11]].flatMap(([col,ch,n])=>Array.from({length:n},(_,i)=>`${col}-${ch}.${i+1}`)).sort();
 assert.deepEqual(evidence.addedIds,expected);assert.deepEqual(evidence.changedRetainedItems,[]);assert.equal(evidence.retainedIdeas,8610);assert.equal(evidence.mergedIdeas,8629);
 const selected=selectFrozenIdeas(data,{schemaVersion:1,acceptedCommit:evidence.sourceCommit,ids:[...old.ids,...expected].sort(),aliases:old.aliases,snapshotDigest:evidence.snapshotDigest});assert.equal(selected.selected.length,8629);assert.ok(expected.every(id=>current.ids.includes(id)));assert.ok(old.ids.every(id=>current.ids.includes(id)));
 assert.equal(evidence.sourceCommit,'174addab9f7c63bd9183632d27a3ee6540184478');assert.match(evidence.dataDigest,/^[a-f0-9]{64}$/);
 assert.deepEqual(selected.selected.filter(p=>expected.includes(p.item.id)&&p.item.verify).map(p=>p.item.id).sort(),[]);
});
