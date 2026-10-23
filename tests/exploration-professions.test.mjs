import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { civilDay, legalCalendar, refundCalendar, countCycles, validateProfession } from '../explorations/profession-models.mjs';
import { normalizeState, serializeState, parseState } from '../explorations/route-state.mjs';
import { renderExploration } from '../explorations/render.mjs';
const json=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const [law,health,lawPacket,healthPacket]=await Promise.all(['explorations/law.json','explorations/health.json','docs/pilots/professional-review/law-cases.json','docs/pilots/professional-review/health-traces.json'].map(json));
test('legal day boundaries reproduce the previously researched fixtures across leap years and year ends',()=>{
 for(const f of lawPacket.calendarFixtures){
  if(f.kind==='refund-calendar'){assert.equal(refundCalendar(f.agreement),f.expectedLastDay);continue;}
  const result=legalCalendar(f.conditionsComplete,f.observation);
  assert.equal(result.first,f.expectedDay1);assert.equal(result.last,f.expectedLastDay);
  assert.equal(result.position,f.expectedPosition.replace('-not-a-rejection-bar',''));
 }
 for(const date of ['2026-02-29','2026-04-31','2026-1-01','bad','',null,'1899-12-31'])assert.equal(civilDay(date),null);
 assert.ok(legalCalendar(null,'2026-10-01').error);
 assert.match(legalCalendar('2026-10-01','2026-10-31',{repair:true}).error,/No deadline/);
});
test('synthetic window rules reproduce all prepared complete, partial and onset fixtures',()=>{
 for(const f of healthPacket.fixtures){
  const trace=health.activity.traces[healthPacket.traces.findIndex(t=>t.id===f.trace)],result=countCycles(trace,...f.windowMs.map(x=>x/1000));
  if(f.expectedError){assert.ok(result.error);continue;}
  assert.deepEqual(result.complete,f.completeIds);assert.deepEqual(result.partial,f.partialIds);assert.deepEqual(result.onsets,f.onsetIds);
  const ratio=s=>s.split('/').map(Number).reduce((a,b)=>a/b);
  assert.equal(result.completeRate,ratio(f.expectedCompleteRate));assert.equal(result.onsetRate,ratio(f.expectedOnsetRate));
 }
 const t=health.activity.traces[0];
 for(const [a,b] of [['',20],[null,20],[NaN,20],[0,Infinity],[-1,20],[0,21]])assert.ok(countCycles(t,a,b).error);
});
test('case scope and synthetic provenance cannot be erased by malformed author payloads',()=>{
 for(const r of [law,health])assert.deepEqual(validateProfession(r.activity,r.passages.map(p=>p.id)),[]);
 for(const mutation of [a=>a.legalSnapshotCertified=true,a=>a.cases[0].repair=true,a=>a.cases[0].conditionsComplete='2026-02-30',a=>a.cases[0].passageIds=['missing']]){
  const a=structuredClone(law.activity);mutation(a);assert.ok(validateProfession(a,law.passages.map(p=>p.id)).length);
 }
 for(const mutation of [a=>a.synthetic=false,a=>a.patientData=true,a=>a.traces[0].cycles[1][0]=1,a=>a.traces[0].cycles[0]=null,a=>a.traces[0].cycles[0]=[0,0,4000]]){
  const a=structuredClone(health.activity);mutation(a);assert.ok(validateProfession(a,health.passages.map(p=>p.id)).length);
 }
});
test('new state is bounded, shareable and excludes notes or personal records',()=>{
 for(const r of [law,health]){
  const s=normalizeState(r,{case:'case-10',trace:'varied',start:'2',end:'18',phase:'out',notes:'PRIVATE',patient:'PRIVATE'});
  const hash=serializeState(r,s);assert.ok(!hash.includes('PRIVATE'));assert.deepEqual(parseState(r,hash).state,s);
 }
 assert.equal(normalizeState(health,{start:'<script>',end:Infinity}).start,'');
 assert.equal(normalizeState(health,{start:'<script>',end:Infinity}).end,'');
});
test('all ten case guides and both complete timing tables exist without JavaScript',()=>{
 const legal=renderExploration(law),clinical=renderExploration(health);
 assert.equal((legal.match(/<section><h3>/g)||[]).length,10);
 assert.equal((clinical.match(/<caption>/g)||[]).length,2);
 assert.match(legal,/No deadline is calculated/);assert.match(clinical,/unknown, not zero/);
 assert.match(clinical,/11.25 per minute/);assert.match(clinical,/15 per minute/);
 assert.ok(!clinical.includes('autoplay'));
});
