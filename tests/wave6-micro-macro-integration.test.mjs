import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {loadAll,ROOT} from '../scripts/lib.mjs';
import {projectIdeas,selectFrozenIdeas,digest} from '../scripts/static-ideas.mjs';
test('MICRO12/MACRO6 reading integration adds exactly23 frozen lessons and retains every earlier complete projection',async()=>{
 const old=JSON.parse(execFileSync('git',['show','ff692f721d8d6930c7ee1cd4938b85ea06249067:static-pages/accepted.json'],{cwd:ROOT,encoding:'utf8'}));
 const current=JSON.parse(fs.readFileSync(ROOT+'/static-pages/accepted.json'));
 const bytes=fs.readFileSync(ROOT+'/docs/integration/wave6-micro-macro-content.json'),evidence=JSON.parse(bytes);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'603ed2ca3695d6fa489e8faaef2561e9f4d320b20691c6275f82b97917cdca15');
 const data=await loadAll();assert.equal(digest(projectIdeas(data,old.ids,old.aliases)),old.snapshotDigest);assert.ok(old.aliases.every(a=>current.aliases.some(b=>a.id===b.id&&a.to===b.to)));
 const expected=[['micro',12,16],['macro',6,7]].flatMap(([col,ch,n])=>Array.from({length:n},(_,i)=>`${col}-${ch}.${i+1}`)).sort();
 assert.deepEqual(evidence.addedIds,expected);assert.deepEqual(evidence.changedRetainedItems,[]);assert.equal(evidence.retainedIdeas,8541);assert.equal(evidence.mergedIdeas,8564);
 const selected=selectFrozenIdeas(data,{schemaVersion:1,acceptedCommit:evidence.sourceCommit,ids:[...old.ids,...expected].sort(),aliases:old.aliases,snapshotDigest:evidence.snapshotDigest});assert.equal(selected.selected.length,8564);assert.ok(expected.every(id=>current.ids.includes(id)));assert.ok(old.ids.every(id=>current.ids.includes(id)));
 assert.equal(evidence.sourceCommit,'cdca5ccd5644602d9d14bc00b88a0644b62fce94');assert.match(evidence.dataDigest,/^[a-f0-9]{64}$/);
 assert.deepEqual(selected.selected.filter(p=>expected.includes(p.item.id)&&p.item.verify).map(p=>p.item.id).sort(),[]);
});
