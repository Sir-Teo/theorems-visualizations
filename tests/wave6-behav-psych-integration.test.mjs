import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {loadAll,ROOT} from '../scripts/lib.mjs';
import {projectIdeas,selectFrozenIdeas,digest} from '../scripts/static-ideas.mjs';
test('BEHAV7/PSYCH6 reading integration adds exactly25 frozen lessons and retains every earlier complete projection',async()=>{
 const old=JSON.parse(execFileSync('git',['show','019944fb3335f86d3501348cbf819fcecb1e7d22:static-pages/accepted.json'],{cwd:ROOT,encoding:'utf8'}));
 const current=JSON.parse(fs.readFileSync(ROOT+'/static-pages/accepted.json'));
 const bytes=fs.readFileSync(ROOT+'/docs/integration/wave6-behav-psych-content.json'),evidence=JSON.parse(bytes);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'09c7695ca9abd36ff5e70f0b7b3f4ecc42c1b9d23d216f679373e42b6513a806');
 const data=await loadAll();assert.equal(digest(projectIdeas(data,old.ids,old.aliases)),old.snapshotDigest);assert.deepEqual(current.aliases,old.aliases);
 const expected=[['behav',7,8],['psych',6,17]].flatMap(([col,ch,n])=>Array.from({length:n},(_,i)=>`${col}-${ch}.${i+1}`)).sort();
 assert.deepEqual(evidence.addedIds,expected);assert.deepEqual(evidence.changedRetainedItems,[]);assert.equal(evidence.retainedIdeas,8585);assert.equal(evidence.mergedIdeas,8610);
 const selected=selectFrozenIdeas(data,{schemaVersion:1,acceptedCommit:evidence.sourceCommit,ids:[...old.ids,...expected].sort(),aliases:old.aliases,snapshotDigest:evidence.snapshotDigest});assert.equal(selected.selected.length,8610);assert.ok(expected.every(id=>current.ids.includes(id)));assert.ok(old.ids.every(id=>current.ids.includes(id)));
 assert.equal(evidence.sourceCommit,'74be2b102669b00b9a7035e461b6422d8c9bd3e7');assert.match(evidence.dataDigest,/^[a-f0-9]{64}$/);
 assert.deepEqual(selected.selected.filter(p=>expected.includes(p.item.id)&&p.item.verify).map(p=>p.item.id).sort(),[]);
});
