import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeState, parseState, serializeState} from '../explorations/route-state.mjs';
import {validateMethod, argumentAssessment, storageResult} from '../explorations/method-models.mjs';
import {renderExploration} from '../explorations/render.mjs';
const read=name=>readFile(new URL('../explorations/'+name+'.json',import.meta.url),'utf8').then(JSON.parse);
const [p,a]=await Promise.all([read('philosophy'),read('agriculture')]);
test('argument state keeps ordered unique premises and excludes unshared writing',()=>{
  const state=normalizeState(p,{guide:'attention',actor:'quiet',action:'negotiate',premises:'schedule-feasible,ask-fair-terms,schedule-feasible,unknown',notes:'PRIVATE'});
  assert.equal(state.premises,'schedule-feasible,ask-fair-terms');
  assert.deepEqual(parseState(p,serializeState(p,state)).state,state);
  assert.ok(!serializeState(p,state).includes('PRIVATE'));
  const result=argumentAssessment(p,state);assert.deepEqual(result.missing,['responsive-attention']);
  assert.match(result.message,/editor/);
  assert.match(argumentAssessment(p,{...state,premises:p.activity.guides[1].premiseIds.join(',')}).message,/does not establish/);
});
test('measured state preserves actual row identity and rejects cross-sample rows',()=>{
  const one=normalizeState(a,{point:'902'}),two=normalizeState(a,{point:'904'});
  assert.notEqual(one.point,two.point);
  const d=a.activity.dataset, r=id=>d.rows.find(r=>r.sourceRow===id);
  assert.equal(r(902).MPa_Abs,r(904).MPa_Abs);assert.notEqual(r(902).Vol_Water,r(904).Vol_Water);
  const other=normalizeState(a,{sample:'US-DFC_1_050',point:'902',compare:'US-DFC_1_050'});
  assert.notEqual(other.point,'902');assert.equal(other.compare,'none');
  assert.deepEqual(parseState(a,serializeState(a,other)).state,other);
});
test('observed data retains all selected rows and excludes unsafe derived variables',()=>{
  const d=a.activity.dataset;assert.equal(d.rows.length,278);
  assert.equal(new Set(d.rows.map(r=>r.sourceRow)).size,278);
  assert.deepEqual(d.selection.Sample_ID.map(s=>d.rows.filter(r=>r.Sample_ID===s).length),[102,93,83]);
  assert.deepEqual(validateMethod(a.activity,a.passages.map(x=>x.id),a.sources.map(x=>x.id)),[]);
  for(const row of d.rows)assert.ok(typeof row.MPa_Abs==='string' && typeof row.Vol_Water==='string');
});
test('synthetic storage conversion and invalid-input boundaries do not use measured points',()=>{
  assert.equal(storageResult({upper:'0.30',lower:'0.15',depth:'0.40'}).mm,60);
  assert.equal(storageResult({upper:'0.3',lower:'0.3',depth:'0.4'}).mm,0);
  for(const raw of [{upper:'0.1',lower:'0.2',depth:'0.4'},{upper:'1.1',lower:'0.1',depth:'0.4'},{upper:'0.3',lower:'0.1',depth:'0'},{upper:'',lower:'0.1',depth:'0.4'},{upper:'NaN',lower:'0.1',depth:'0.4'}])assert.ok(storageResult(raw).error);
  const normalized=normalizeState(a,{upper:'Infinity',lower:'-1',depth:'nope'});assert.equal(normalized.upper,'');assert.ok(storageResult(normalized).error);
});
test('malformed new method payloads fail validation without reaching renderer',()=>{
  const check=r=>validateMethod(r.activity,r.passages.map(x=>x.id),r.sources.map(x=>x.id));
  for(const mutate of [r=>r.activity.dataset.rows=[null],r=>r.activity.dataset.selection=null,r=>r.activity.dataset.rows[0].MPa_Abs='NaN',r=>r.activity.dataset.rows[0].sourceRow=1,r=>r.activity.dataset.omittedColumns=null,r=>r.activity.dataset.projection='bad',r=>r.activity.dataset.rows[0].Bulk_Den='1.0']){const copy=structuredClone(a);mutate(copy);assert.ok(check(copy).length);}
  for(const mutate of [r=>r.activity.guides=[null],r=>r.activity.guides[0].premiseIds=['unknown'],r=>r.activity.premises[0].kind='source-quotation']){const copy=structuredClone(p);mutate(copy);assert.ok(check(copy).length);}
});
test('both new methods have complete static alternatives and measured values stay raw',()=>{
  const ph=renderExploration(p), ag=renderExploration(a);
  assert.match(ph,/Read both complete editorial reconstructions/);assert.match(ph,/Normative addition/);
  assert.equal((ag.match(/<th scope="row">/g)||[]).length,278);
  assert.match(ag,/>1\.0471285</);assert.match(ag,/log10 spacing/);assert.match(ag,/<strong>60 mm<\/strong>/);
  assert.ok(!ag.includes('<polyline'));
});
