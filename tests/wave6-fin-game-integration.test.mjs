import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {loadAll,ROOT} from '../scripts/lib.mjs';
import {projectIdeas,selectFrozenIdeas,digest} from '../scripts/static-ideas.mjs';
test('FIN7/GAME6 reading integration adds exactly21 frozen lessons and retains every earlier complete projection',async()=>{
 const old=JSON.parse(execFileSync('git',['show','b7f625b0bf2934385a4835e8c5f03b8f7370652d:static-pages/accepted.json'],{cwd:ROOT,encoding:'utf8'}));
 const current=JSON.parse(fs.readFileSync(ROOT+'/static-pages/accepted.json'));
 const bytes=fs.readFileSync(ROOT+'/docs/integration/wave6-fin-game-content.json'),evidence=JSON.parse(bytes);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'f5b0b105c6a725113f89725bc3de779befa5be1b6e1bfadc952059cc78d3e666');
 const data=await loadAll();assert.equal(digest(projectIdeas(data,old.ids,old.aliases)),old.snapshotDigest);assert.deepEqual(current.aliases,old.aliases);
 const expected=[['fin',7,9],['game',6,12]].flatMap(([col,ch,n])=>Array.from({length:n},(_,i)=>`${col}-${ch}.${i+1}`)).sort();
 assert.deepEqual(evidence.addedIds,expected);assert.deepEqual(evidence.changedRetainedItems,[]);assert.equal(evidence.retainedIdeas,8564);assert.equal(evidence.mergedIdeas,8585);
 const selected=selectFrozenIdeas(data,{schemaVersion:1,acceptedCommit:evidence.sourceCommit,ids:[...old.ids,...expected].sort(),aliases:old.aliases,snapshotDigest:evidence.snapshotDigest});assert.equal(selected.selected.length,8585);assert.ok(expected.every(id=>current.ids.includes(id)));assert.ok(old.ids.every(id=>current.ids.includes(id)));
 assert.equal(evidence.sourceCommit,'b9759f451a82f7b4b7be5d1fc3b3a911d8dce34f');assert.match(evidence.dataDigest,/^[a-f0-9]{64}$/);
 assert.deepEqual(selected.selected.filter(p=>expected.includes(p.item.id)&&p.item.verify).map(p=>p.item.id).sort(),[]);
});
