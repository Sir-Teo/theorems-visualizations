import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { textDigest } from '../explorations/contract.mjs';
import { validateReasoning, normalizeReasoning, reasoningResult } from '../explorations/reasoning-lab.mjs';
import { waterDay, waterSequence, validateWater } from '../explorations/water-ledger.mjs';
const json=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
test('all selected follow-up quotations retain exact prepared text and witness identity',async()=>{
 for(const [file,packet] of [['history-perspectives','history-primary-20261022'],['literature-editions','literature-selections-20261022'],['literature-narrative','literature-selections-20261022'],['philosophy-disclosure','cicero-selections-20261022']]){
  const [r,p]=await Promise.all([json('explorations/'+file+'.json'),json('docs/pilots/sequences/preparation/'+packet+'.json')]);
  for(const selection of r.passages){const original=p.selections.find(s=>s.id===selection.id);assert.ok(original);assert.equal(selection.text,original.text);assert.equal(selection.sha256,original.textSha256);assert.equal(selection.sourceId,'followup-'+original.sourceId);}
 }
});
test('every premise combination preserves the two distinct inference questions and never asserts an exact eruption date',async()=>{
 const [r,p]=await Promise.all([json('explorations/history-material-evidence.json'),json('docs/pilots/sequences/preparation/archaeology-methods-20261022.json')]);
 assert.deepEqual(validateReasoning(r.activity),[]);
 for(const c of p.premiseExercise.cases){const inputs=c.inputs,s=normalizeReasoning(r,{year:String(inputs.year79IndependentlyEstablished),analogy:String(inputs.analogyJustified),report:String(inputs.modernReportAccepted)}),result=reasoningResult(r.activity,s);
  assert.equal(result.conclusions[0],p.premiseExercise.outputs[c.calendarInference]);assert.equal(result.conclusions[1],p.premiseExercise.outputs[c.preservationInference]);assert.equal(result.conclusions[2],'No exact eruption day is established.');
 }
 const broken=structuredClone(r.activity);broken.cases[0]=broken.cases[1];assert.match(validateReasoning(broken).join(),/Duplicate/);
 const malformed=structuredClone(r.activity);malformed.cases[0]=null;assert.ok(validateReasoning(malformed).length);
 assert.match(p.premiseExercise.outputs['conditional-lower-bound-only'],/later that day/);
});
test('water budgets preserve path differences, delivery constraints and dimensional conservation',async()=>{
 const [r,p]=await Promise.all([json('explorations/agriculture-ledger.json'),json('docs/pilots/sequences/preparation/irrigation-ledger-20261022.json')]);
 assert.deepEqual(validateWater(r.activity),[]);const model=r.activity.model;
 for(const s of p.sequences){const rows=waterSequence(model,s);for(const [i,result] of rows.entries()){assert.ok(!result.error);assert.ok(Math.abs(result.deficit-Number(s.days[i].expectedEndDeficit))<1e-12);}assert.ok(Math.abs(Math.max(...rows.map(x=>x.deficit))-Number(s.expectedMaxDailyEndDeficit))<1e-12);}
 for(const c of p.deliveryCases){const result=waterDay(model,{deficit:1,rain:0,cropUse:.25,grossIrrigation:c.requestedGross});assert.ok(Math.abs(result.hours-Number(c.expectedRequiredHours))<1e-12);if(c.expectedStatus==='infeasible-in-one-day'){assert.equal(result.error,c.expectedStatus);assert.equal(result.deficit,undefined);}else assert.ok(Math.abs(result.incoming-Number(c.expectedIncoming))<1e-12);}
 const supplied=c=>({deficit:c.initialDeficit,...c});
 const net=waterDay(model,{deficit:1,cropUse:.25,rain:.1,incomingIrrigation:.4});assert.ok(Math.abs(net.deficit-.75)<1e-12);assert.equal(net.loss,null);
 const surplus=waterDay(model,supplied(p.surplusCase));assert.ok(Math.abs(surplus.surplus-1.1)<1e-12);assert.equal(surplus.storage,3.24);
 assert.equal(waterDay(model,supplied(p.missingCase)).error,'unknown-input');assert.equal(waterDay(model,supplied(p.rangeCase)).error,'outside-assumed-range');
 for(const deficit of [0,.2,1,3])for(const rain of [0,.1,1])for(const grossIrrigation of [0,.1,.5]){const result=waterDay(model,{deficit,rain,grossIrrigation,cropUse:.25});if(!result.error)assert.ok(Math.abs(result.storage-(3.24-deficit+rain+grossIrrigation-result.loss-.25-result.surplus))<1e-12);}
 const corrected=waterDay(model,{deficit:p.correctionCase.revisedEstimate,...p.correctionCase.nextDay});assert.ok(Math.abs(corrected.deficit-.95)<1e-12);
});
test('new domain routes use the actual registry identities and source summaries retain their hashes',async()=>{
 const expected={'history-perspectives':'D20','history-material-evidence':'D20','literature-editions':'D24','literature-narrative':'D24','philosophy-disclosure':'D21','agriculture-ledger':'D10'};
 for(const [name,id]of Object.entries(expected)){const r=await json('explorations/'+name+'.json');assert.equal(r.domainIds[0],id);for(const p of r.passages)assert.equal(textDigest(p.text),p.sha256);}
});
