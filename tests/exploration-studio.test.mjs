import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {plainWeave,normalizeWeave,weaveCrossing,weaveDiagnosis,changeWeave,validatePractice} from '../explorations/practice-model.mjs';
import {performanceEvents,performanceProvenance,renderSignal,encodeWav,normalizePerformance,validatePerformance} from '../explorations/performance-model.mjs';
import {normalizeState,serializeState,parseState} from '../explorations/route-state.mjs';
import {renderExploration} from '../explorations/render.mjs';
const read=n=>readFile(new URL('../explorations/'+n+'.json',import.meta.url),'utf8').then(JSON.parse);const [w,p]=await Promise.all([read('craft'),read('performance')]);
test('front/back projection preserves strip identity and reverses both column positions and visible strip',()=>{
 assert.equal(plainWeave(),'101010010101101010010101101010010101');
 for(let row=1;row<=6;row++)for(let column=1;column<=6;column++){
  const front=weaveCrossing({cells:plainWeave(),view:'front'},row,column),back=weaveCrossing({cells:plainWeave(),view:'back'},row,column);
  assert.equal(front.frontWeftOnTop,(row+column)%2===0);assert.equal(back.visibleWeft,!front.visibleWeft);assert.equal(back.displayColumn,7-column);assert.equal(back.frontWeftOnTop,front.frontWeftOnTop);
 }
 assert.equal(weaveDiagnosis({cells:plainWeave()}).repeats.length,0);
 const inverse=plainWeave().split('').map(x=>x==='1'?'0':'1').join('');assert.equal(weaveDiagnosis({cells:inverse}).repeats.length,0);assert.equal(weaveDiagnosis({cells:inverse}).mismatches.length,36);
});
test('each symbolic error and whole-row repair has the stated scope',()=>{
 for(let row=1;row<=6;row++)for(let column=1;column<=6;column++){
  const bad=changeWeave({row,column},'error');assert.equal(weaveDiagnosis(bad).mismatches.length,1);assert.ok(weaveDiagnosis(bad).repeats.length>0);
  const repaired=changeWeave(bad,'repair');assert.equal(repaired.cells,plainWeave());assert.equal(repaired.repairs,String(row));
 }
 let state=changeWeave({row:2,column:2},'error');state=changeWeave({...state,row:4,column:4},'error');const after=changeWeave(state,'repair');assert.deepEqual(weaveDiagnosis(after).mismatches,[{row:2,column:2}]);
 for(let i=0;i<15;i++)state=changeWeave(state,'repair');assert.equal(state.repairs.split(',').length,12);
});
test('craft state is bounded and full physical evidence cannot be fabricated through this schema',()=>{
 const s=normalizeWeave({view:'bad',row:99,column:'<script>',cells:'bad',repairs:'PRIVATE',step:100});assert.equal(s.view,'front');assert.equal(s.cells,plainWeave());assert.equal(s.repairs,'');
 assert.deepEqual(validatePractice(w.activity),[]);const a=structuredClone(w.activity);a.physicalEvidence.status='observed';assert.match(validatePractice(a).join(' '),/separately implemented/);
});
test('phrase timing uses beat alignment and explicit duration/gap semantics',()=>{
 assert.deepEqual(p.activity.events.map(e=>e.beat),[0,1,1.5,2.5,3,4,5.5,6,7]);
 for(const bpm of [60,90,120])for(const [version,gate] of [['short',.12],['sustained',.42]]){
  const rows=performanceEvents(p.activity,version,bpm);for(const r of rows){assert.ok(Math.abs(r.seconds-r.beat*60/bpm)<1e-14);assert.ok(Math.abs(r.duration-gate*60/bpm)<1e-15);assert.ok(r.gap>0);}
  assert.ok(Math.abs(rows.at(-1).seconds+rows.at(-1).duration+rows.at(-1).gap-8*60/bpm)<1e-14);
 }
 assert.ok(Math.abs(performanceEvents(p.activity,'short',90)[0].duration-.08)<1e-15);assert.ok(Math.abs(performanceEvents(p.activity,'sustained',90)[0].duration-.28)<1e-15);
});
test('rendered PCM has exact region length, bounded gain and silent gaps without event-clock drift',()=>{
 const a=p.activity;
 for(const bpm of [60,90,120])for(const version of ['short','sustained']){
  const pcm=renderSignal(a,version,bpm),rows=performanceEvents(a,version,bpm);assert.equal(pcm.length,Math.round(8*60/bpm*48000));
  let max=0;for(const x of pcm){assert.ok(Number.isFinite(x));max=Math.max(max,Math.abs(x));}assert.ok(max<=.18000001&&max>.179);
  for(const e of rows){const onset=Math.round(e.seconds*48000),end=onset+Math.round(e.duration*48000);assert.equal(pcm[onset],0);assert.equal(pcm[end],0);const i=onset+Math.round(.01*48000), t=(i-onset)/48000;assert.ok(Math.abs(pcm[i]-.18*Math.sin(2*Math.PI*440*t))<1e-8);}
  const first=renderSignal(a,version,bpm,48000,'first'),second=renderSignal(a,version,bpm,48000,'second');assert.deepEqual(pcm.slice(0,first.length),first);assert.deepEqual(pcm.slice(first.length),second);
 }
});
test('WAV export represents the generated signal as mono 16-bit PCM and rejects clipping',()=>{
 const pcm=renderSignal(p.activity,'short',90), bytes=encodeWav(pcm),v=new DataView(bytes.buffer);assert.equal(new TextDecoder().decode(bytes.slice(0,4)),'RIFF');assert.equal(v.getUint32(24,true),48000);assert.equal(v.getUint16(22,true),1);assert.equal(v.getUint16(34,true),16);assert.equal(v.getUint32(40,true),pcm.length*2);
 for(let i=0;i<pcm.length;i+=137)assert.ok(Math.abs(v.getInt16(44+i*2,true)/32767-pcm[i])<=1/32767);
 assert.throws(()=>encodeWav(new Float32Array([1.1])),/clipped/);assert.throws(()=>renderSignal(p.activity,'bad',90));
});
test('malformed phrase metadata and unbounded saved state are rejected or normalized',()=>{
 assert.deepEqual(validatePerformance(p.activity),[]);for(const f of [a=>a.events=[null],a=>a.versions=[],a=>a.synthesis.frequencyHz=Infinity,a=>a.tempos=[1],a=>a.events[1].beat=0]){const a=structuredClone(p.activity);f(a);assert.ok(validatePerformance(a).length);}
 const s=normalizePerformance(p.activity,{bpm:999,region:'second',cursor:1,version:'bad',volume:Infinity});assert.equal(s.bpm,'90');assert.equal(s.cursor,'4');assert.equal(s.version,'short');assert.equal(s.volume,'0.35');
});
test('studio public state excludes notes and retains stable evidence coordinates',()=>{
 for(const r of [w,p]){const s=normalizeState(r,{view:'back',row:'4',column:'2',version:'sustained',bpm:'120',event:'e7',region:'second',cursor:'5.5',notes:'PRIVATE'});const hash=serializeState(r,s);assert.ok(!hash.includes('PRIVATE'));assert.deepEqual(parseState(r,hash).state,s);}
});
test('static studio alternatives expose all steps and both event tables without claiming observed practice',()=>{
 const wh=renderExploration(w),ph=renderExploration(p);assert.match(wh,/not sample photographs/);assert.equal((wh.match(/<h3>[0-6] ·/g)||[]).length,7);assert.match(ph,/without audio/);assert.match(ph,/5⅓/);assert.ok(!ph.includes('autoplay'));
});
test('each WAV export retains exact stimulus provenance and pending terms without private state',()=>{
 const raw={version:'sustained',bpm:'120',region:'second',notes:'PRIVATE',cursor:'5.5',volume:'0.1'},meta=performanceProvenance(p,raw);
 const pcm=renderSignal(p.activity,'sustained',120,48000,'second'),bytes=encodeWav(pcm,48000,meta),v=new DataView(bytes.buffer),offset=44+pcm.length*2;
 assert.equal(v.getUint32(4,true)+8,bytes.length);assert.equal(new TextDecoder().decode(bytes.slice(offset,offset+4)),'LIST');assert.equal(new TextDecoder().decode(bytes.slice(offset+8,offset+16)),'INFOICMT');
 const length=v.getUint32(offset+16,true),comment=bytes.slice(offset+20,offset+20+length);assert.equal(comment.at(-1),0);assert.ok(comment.every(x=>x<128));
 const recovered=JSON.parse(new TextDecoder().decode(comment.slice(0,-1)));assert.deepEqual(recovered,meta);assert.equal(recovered.revision,p.revision);assert.equal(recovered.renderer.version,1);assert.equal(recovered.events.length,9);assert.deepEqual(recovered.region,{startBeat:4,endBeat:8,startFrame:96000,endFrame:192000});assert.equal(recovered.assetRights.status,'local-draft');assert.ok(!JSON.stringify(recovered).includes('PRIVATE'));
 assert.deepEqual(bytes.slice(44,44+pcm.length*2),encodeWav(pcm).slice(44));
});
