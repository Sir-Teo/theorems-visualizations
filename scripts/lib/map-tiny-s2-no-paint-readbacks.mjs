// One-factor source composition only. No browser/server imports or execution.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {composeS2 as baseCompose,S2_ORIGINAL,s2Hash,replaceS2Once,reverseS2} from './map-tiny-s2-connected-proposal.mjs';
export {S2_ORIGINAL,s2Hash,reverseS2};
export const S2_ID='tiny-old-S2-no-paint-readbacks-light-v1';
export const S2_ROOT_FLAG='--root-authorized-s2-no-paint-readbacks-light';
export const ABSENT_READBACKS=Array.from({length:5},(_,i)=>['diagnostic-before-paint-'+(i+1),'diagnostic-after-paint-'+(i+1)]).flat();
export const RETAINED_BUFFERS=['control-gpu-0','control-reference','fault-before-fallback-1','fault-canvas-2','fault-canvas-3','reference','actual-final-canvas','diagnostic-connected-reference','diagnostic-actual-after-connected'];
export function composeS2(originalRunner,originalFixture,root,output){
 assert.equal(s2Hash(fs.readFileSync(new URL('./map-tiny-s2-connected-proposal.mjs',import.meta.url))), 'a8f8e78b1ca98e8b9b07518e5d1b9738f1806537998bcb53ce6169bf4a1c84ff','63608647 composition helper unchanged');
 const base=baseCompose(originalRunner,originalFixture,root,output),fixtureDelta=[],runnerDelta=[];let fixture=base.fixture,runner=base.runner;
 const f=(from,to)=>{fixture=replaceS2Once(fixture,from,to);fixtureDelta.push({from,to})},r=(from,to)=>{runner=replaceS2Once(runner,from,to);runnerDelta.push({from,to})};
 f("observeRead('diagnostic-before-paint-'+ordinal,c.canvas);",'/* Intentionally absent: before-paint readback. */');
 f("observeRead('diagnostic-after-paint-'+ordinal,c.canvas);",'/* Intentionally absent: after-paint readback. */');
 f("identity:'tiny-old-S2-connected-control-light-v1'",`identity:'${S2_ID}'`);
 r(JSON.stringify(base.fixture),JSON.stringify(fixture));
 r("scope:'NEW old S2 light connected-control diagnostic; synthetic2node640x360DPR1; no repair/S1/S3/fullmap/lifecycle acceptance'",`scope:'${S2_ID}; exactly ten paint readbacks absent; nine raw buffers; synthetic component only'`);
 r(JSON.stringify(root+'/tests/verification-map-tiny-s2-connected-pixels.py'),JSON.stringify(root+'/tests/verification-map-tiny-s2-no-paint-readbacks-pixels.py'));
 r('assert.equal(row.fixtureFailure,null);',`(${assertS2ReadbackInventory.toString()})(row);assert.equal(row.fixtureFailure,null);`);
 assert.equal(reverseS2(fixture,fixtureDelta),base.fixture);assert.equal(reverseS2(runner,runnerDelta),base.runner);
 return {fixture,runner,fixtureChanges:[...base.fixtureChanges,...fixtureDelta],runnerChanges:[...base.runnerChanges,...runnerDelta],factorDelta:{fixture:fixtureDelta,runner:runnerDelta},baselineGenerated:{fixture:s2Hash(base.fixture),runner:s2Hash(base.runner)},absentReadbacks:ABSENT_READBACKS,retainedBuffers:RETAINED_BUFFERS};
}

export function assertS2ReadbackInventory(row){
 const labels=['control-gpu-0','control-reference','fault-before-fallback-1','fault-canvas-2','fault-canvas-3','reference','actual-final-canvas','diagnostic-connected-reference','diagnostic-actual-after-connected'];
 assert.deepEqual(row.images.map(x=>x.label),labels,'exact nine retained buffers');
 const before=row.events.filter(x=>x.type==='diagnostic-paint-before'),after=row.events.filter(x=>x.type==='diagnostic-paint-after'),reads=row.events.filter(x=>x.type==='diagnostic-read');
 assert.deepEqual(before.map(x=>x.ordinal),[1,2,3,4,5]);assert.deepEqual(after.map(x=>x.ordinal),[1,2,3,4,5]);
 assert.deepEqual(reads.map(x=>({label:x.label,ordinal:x.ordinal})),[{label:'diagnostic-connected-reference',ordinal:1}]);
 assert.equal(row.events.some(x=>/^diagnostic-(before|after)-paint-/.test(x.label??'')),false,'omitted readbacks never fabricated');return true;
}
