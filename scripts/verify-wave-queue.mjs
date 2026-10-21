// Reconcile the Wave 3–4 source ledger against actual content flags.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { loadAll, ROOT } from './lib.mjs';
const q=JSON.parse(readFileSync(new URL('../docs/verification/waves-3-4-open.json',import.meta.url)));
const {items}=await loadAll(),byId=new Map(items.map(i=>[i.id,i]));
const files=new Set(execFileSync('git',['diff','--name-only',q.scope.from,q.scope.through,'--','content'],{cwd:ROOT,encoding:'utf8'}).trim().split('\n'));
const inventory=items.filter(i=>files.has(i.file)),actual=new Set(inventory.filter(i=>i.verify).map(i=>i.id)),pending=new Set(q.queue.map(i=>i.id));
assert.equal(inventory.length,q.scope.items,'inventory changed; review scope before updating it');
assert.equal(pending.size,q.queue.length,'duplicate pending IDs');
assert.deepEqual([...actual].sort(),[...pending].sort(),'pending rows and source flags disagree');
const {addedFlags:added,resolvedFlags:resolved}=q.changesFromBaseline;
for(const [name,ids]of[['added',added],['resolved',resolved]])assert.equal(new Set(ids).size,ids.length,`duplicate ${name} IDs`);
for(const id of added)assert.ok(pending.has(id),`added uncertainty absent from queue: ${id}`);
for(const id of resolved){assert.ok(byId.has(id),`resolved item missing: ${id}`);assert.ok(!byId.get(id).verify,`resolved flag still set: ${id}`);assert.ok(!pending.has(id),`resolved item still pending: ${id}`);}
assert.equal(q.remainingFlags,pending.size);
assert.equal(q.remainingFlags,q.scope.initialFlags+added.length-resolved.length,'baseline reconciliation failed');
const counts={};for(const id of pending){const col=id.split('-')[0];counts[col]=(counts[col]||0)+1;}
assert.deepEqual(counts,q.byCollection,'collection totals disagree');
console.log(`PASS Wave 3–4 ledger: ${inventory.length} items, ${pending.size} pending, ${resolved.length} original resolved, ${added.length} added; all actual flags reconcile`);
