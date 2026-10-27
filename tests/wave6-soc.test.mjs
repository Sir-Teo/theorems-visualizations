import test,{after}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{createHash}from'node:crypto';
import * as H from'../content/soc/ch06.shared.js';import chapter from'../content/soc/ch06.js';import syllabus from'../content/soc/syllabus.js';
const Q=H.Q,fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-soc-reference.json',import.meta.url))),stats={cases:0,comparisons:0,worstNumericalAbsolute:0};
function compare(a,b,path,numerical=false){
 if(b===null||typeof b!=='object'){
  stats.comparisons++;
  if(typeof a==='bigint'){assert.equal(a.toString(),b,path);return;}
  if(numerical&&typeof b==='number'){
   assert.ok(Number.isFinite(a)&&Number.isFinite(b),path);const error=Math.abs(a-b);stats.worstNumericalAbsolute=Math.max(stats.worstNumericalAbsolute,error);assert.ok(error<=2e-8,path+' numerical error '+error);return;
  }
  assert.equal(a,b,path);return;
 }
 assert.ok(a&&typeof a==='object',path);assert.equal(Array.isArray(a),Array.isArray(b),path+' shape');assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),path+' complete keys');for(const[k,v]of Object.entries(b))compare(a[k],v,path+'.'+k,numerical);
}
for(const family of Object.keys(fixture.families))test('SOC6 independent complete '+family+' reference objects',()=>{
 for(const row of fixture.cases.filter(r=>r.family===family)){compare(H[family](row.args),row.expected,family+' '+JSON.stringify(row.args),family==='synchrony');stats.cases++;}
});
test('SOC6 rejects parameters outside its declared finite models',()=>{
 for(const[name,p]of[['voter',{kind:'directed'}],['voter',{initial:'unrecorded'}],['voter',{seed:-1}],['voter',{attempts:.5}],['voter',{attempts:401}],['confidence',{epsilon:NaN}],['confidence',{epsilon:1+Number.EPSILON}],['confidence',{steps:25}],['confidence',{selected:12}],['confidence',{profile:'unrecorded'}],['culture',{features:0}],['culture',{traits:9}],['culture',{size:1}],['culture',{attempts:1601}],['echo',{unfollowThreshold:-Number.MIN_VALUE}],['echo',{prune:1}],['echo',{steps:25}],['disclosure',{threshold:13}],['disclosure',{seedCount:-1}],['disclosure',{round:1.5}],['disclosure',{heterogeneous:'yes'}],['synchrony',{coupling:Infinity}],['synchrony',{spread:.6}],['synchrony',{time:13}],['synchrony',{step:.01}],['lineBoard',{answer:3}],['lineBoard',{correct:-1}],['lineBoard',{scale:0}],['lineBoard',{reveal:1}],['aschEvidence',{condition:'unrecorded'}]])assert.throws(()=>H[name](p),name+' '+JSON.stringify(p));
 assert.throws(()=>H.voterKernel({state:Array(16).fill(2)}));assert.throws(()=>H.confidenceStep([],0));assert.throws(()=>H.echoStep([0,1],[[0,1],[0,1]]));
});
test('SOC6 node-update star has degree-weighted exit probability, not plain share',()=>{
 const hub=H.voter({kind:'star',initial:'hub only',attempts:0});assert.equal(Q.exactText(hub.plain.exact),'1/16');assert.equal(Q.exactText(hub.weighted.exact),'1/2');assert.equal(hub.expectedWeightedDrift.sign,0);assert.equal(Q.exactText(hub.expectedPlainDrift.exact),'7/128');
 for(const kind of['cycle','torus']){const z=H.voter({kind,initial:'hub only',attempts:0});assert.equal(Q.sign(Q.sub(z.plain.exact,z.weighted.exact)),0);}
});
test('SOC6 exact confidence includes equality and separates its adjacent binary64 boundary',()=>{
 const below=.5-Number.EPSILON/4,at=.5,above=.5+Number.EPSILON/2;
 assert.deepEqual(H.confidenceStep([0,.5],below).neighbors,[[0],[1]]);
 for(const e of[at,above]){const z=H.confidenceStep([0,.5],e);assert.deepEqual(z.neighbors,[[0,1],[0,1]]);assert.deepEqual(z.after.map(Q.exactText),['1/4','1/4']);}
 const tiny=H.confidenceStep([0,Number.MIN_VALUE],Number.MIN_VALUE);assert.deepEqual(tiny.neighbors,[[0,1],[0,1]]);assert.equal(Q.sign(tiny.after[0]),1);assert.equal(Q.approximate(tiny.after[0]),0,'positive exact half-subnormal is retained even when its coordinate rounds to zero');
});
test('SOC6 HK mean can move; nonadjacent distant agents need not remain separated',()=>{
 const uneven=H.confidenceStep([0,.125,.375],.25);assert.equal(Q.exactText(uneven.meanChange.exact),'-1/144');
 const bridge=H.confidenceStep([0,.4,.8],.5);assert.ok(Q.sign(bridge.after[0])>0);assert.ok(Q.sign(Q.sub(bridge.after[2],.8))<0);assert.ok(Q.sign(Q.sub(.8,.5))>0);
});
test('SOC6 a legal local culture copy can reduce global similarity and split regions',()=>{
 const g={n:4,neighbors:[[1,2,3],[0],[0],[0]],edges:[[0,1],[0,2],[0,3]]},before=H.cultureSummary([[0,0],[0,1],[0,0],[0,0]],g),after=H.cultureSummary([[0,1],[0,1],[0,0],[0,0]],g);
 assert.equal(before.regions,2);assert.equal(after.regions,3);assert.equal(Q.exactText(before.meanSimilarity.exact),'5/6');assert.equal(Q.exactText(after.meanSimilarity.exact),'2/3');assert.ok(Q.sign(Q.sub(after.meanSimilarity.exact,before.meanSimilarity.exact))<0);
 for(const p of[{features:1,traits:8},{features:5,traits:1}]){const z=H.culture({...p,attempts:240});assert.equal(z.firstFrozen,0);assert.equal(z.changes,0);assert.equal(z.activeEdges,0);}
});
test('SOC6 directed echo rule averages before pruning and retains threshold equality',()=>{
 const xs=[0,.6,1],es=[[0,1],[1,2]],z=H.echoStep(xs,es,{epsilon:1,unfollowThreshold:.4,prune:true});
 assert.equal(Q.sign(Q.sub(z.opinions[0],Q.div(.6,2))),0);assert.deepEqual(z.edges,[[1,2]]);assert.deepEqual(z.removed,[[0,1]]);
 const equality=H.echoStep([0,1],[[0,1]],{epsilon:1,unfollowThreshold:.5,prune:true});assert.deepEqual(equality.edges,[[0,1]]);
 const isolated=H.echoStep([.2,.8],[],{epsilon:1,unfollowThreshold:0,prune:true});assert.deepEqual(isolated.opinions.map(Q.exactText),[Q.exactText(Q.exact(.2)),Q.exactText(Q.exact(.8))]);
});
test('SOC6 irreversible disclosure preserves every private attitude while visible dissent grows',()=>{
 for(const seedCount of[0,1,5,12]){const z=H.disclosure({seedCount,round:12});assert.equal(z.privateCount,12);assert.ok(z.privateOpposition.every(Boolean));assert.ok(z.history.every((r,i)=>!i||r.count>=z.history[i-1].count));assert.equal(z.fixed,true);assert.ok(z.firstFixed<=12);}
});
test('SOC6 cached finite traces replay earlier time and protect private state from returned mutations',()=>{
 for(const[name,late,early]of[['voter',{attempts:400},{attempts:1}],['culture',{attempts:1600},{attempts:1}],['synchrony',{time:12},{time:.0625}]]){
  const before=H[name](early),large=H[name](late);if(large.state)large.state.fill(1);if(large.cultures)large.cultures[0].fill(99);if(large.phases)large.phases.fill(99);if(large.initial?.phases)large.initial.phases.fill(99);if(large.history[0].state)large.history[0].state.fill(1);if(large.history[0].meanSimilarity)large.history[0].meanSimilarity.exact.n=999n;
  assert.deepEqual(H[name](early),before,name+' earlier replay survives later requests/output mutation');
 }
});
test('SOC6 RK4 step halving and exact free motion respect the numerical budget',()=>{
 for(const p of[{seed:0,spread:.5,coupling:6,time:12},{seed:37,spread:.25,coupling:2,time:12},{seed:999,spread:.1,coupling:.7,time:7.123}]){
  const a=H.synchrony(p),b=H.synchrony({...p,step:1/512});assert.ok(Math.max(...a.phases.map((x,i)=>Math.abs(x-b.phases[i])))<2e-8);assert.ok(Math.abs(a.meanResidual)<3e-12);assert.ok(a.resultant.R>=0&&a.resultant.R<=1+Number.EPSILON);
 }
 const z=H.synchrony({coupling:0,time:12});for(let i=0;i<16;i++)assert.ok(Math.abs(z.phases[i]-(z.initial.phases[i]+2*Math.PI*z.frequencies[i]*12))<3e-12);
});
test('SOC6 source summaries preserve rates, bounds, qualitative relative wording and unread original status',()=>{
 const a=H.aschEvidence(),alone=H.aschEvidence({condition:'judging alone'}),partner=H.aschEvidence({condition:'truthful partner'});assert.equal(a.trialCount,18);assert.equal(a.criticalTrials,12);assert.equal(a.rate,36.8);assert.equal(alone.upperBound,1);assert.equal(alone.strictUpper,true);assert.equal(partner.rate,undefined);assert.equal(partner.relative,'one fourth as often');assert.equal(a.original1956Verified,false);assert.equal(a.independentBernoulliTrialsClaimed,false);
});
test('SOC6 eight complete lessons preserve frozen identities, ordered dependencies and source-flag property presence',()=>{
 const frozen=JSON.parse(fs.readFileSync(new URL('../docs/wave-6-plan.json',import.meta.url))).chapters.find(c=>c.collection==='soc').items,outline=syllabus.chapters.find(c=>c.n===6).items;assert.equal(chapter.items.length,8);
 for(const[i,item]of chapter.items.entries()){
  for(const k of['num','kind','name','deps','paper','introduces','verify','see']){assert.deepEqual(item[k],frozen[i][k],item.num+' '+k);assert.equal(Object.hasOwn(item,k),Object.hasOwn(frozen[i],k),item.num+' '+k+' presence');}
  for(const k of['num','kind','name','deps','refs'])assert.deepEqual(item[k],outline[i][k]);assert.equal(item.caption,outline[i].pic);for(const k of['statement','idea','scope','caption'])assert.ok(item[k].length>120,item.num+' complete '+k);assert.equal(typeof item.viz,'function');
 }
});
test('SOC6 syllabus changes only researched chapter6 references and picture descriptions',()=>{
 const before=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-soc-syllabus-before.json',import.meta.url))),strip=c=>c.n!==6?c:{...c,items:c.items.map(({refs,pic,...rest})=>rest)};
 assert.deepEqual({...syllabus,chapters:syllabus.chapters.map(strip)},{...before,chapters:before.chapters.map(strip)});
});
test('SOC6 preserves all521 recorded preimages, with the sole semantic syllabus exception',()=>{
 const preimages=JSON.parse(fs.readFileSync(new URL('../docs/verification/wave6-soc-preimages.json',import.meta.url)));assert.equal(Object.keys(preimages.rawPins).length,521);let count=0;
 for(const[path,sha]of Object.entries(preimages.rawPins))if(path!=='content/soc/syllabus.js'){assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../'+path,import.meta.url))).digest('hex'),sha,path);count++;}assert.equal(count,520);
});
test('SOC6 all eight real drawing consumers execute defaults, endpoints, modes and clock movement',()=>{
 for(const item of chapter.items){const controls=[],choices=[],toggles=[],draws=[],reads=[];let marks=0;
  const finite=xs=>{for(const x of xs)if(typeof x==='number')assert.ok(Number.isFinite(x),item.num+' finite geometry');};
  const api={stage:o=>({o,end(){},begin(){},setView(a,b){finite([...a,...b]);},path(ps){ps.forEach(finite);marks++;},rect(...xs){finite(xs.slice(0,4));marks++;},line(...xs){finite(xs.slice(0,4));marks++;},arrow(...xs){finite(xs.slice(0,4));marks++;},circle(...xs){finite(xs.slice(0,3));marks++;},hline(y){finite([y]);marks++;},dot(...xs){finite(xs.slice(0,2));marks++;},text(t,x,y){finite([x,y]);marks++;}}),slider(label,min,max,value){const c={label,min,max,value};controls.push(c);return c;},select(label,options,value){const c={label,options,value};choices.push(c);return c;},toggle(label,value){const c={label,value};toggles.push(c);return c;},render(fn){draws.push(fn);},animate(fn){draws.push(fn);},readout(fn){reads.push(fn);},legend(){},mix(){return'blue';}};
  item.viz(api);const run=t=>{draws.forEach(fn=>fn(t));reads.forEach(fn=>assert.doesNotMatch(fn(),/NaN|Infinity|\[object Object\]/,item.num+' finite readout'));};run(0);
  for(const c of controls){const saved=c.value;for(const value of[c.min,c.max]){c.value=value;run(0);}c.value=saved;}
  for(const c of choices){const saved=c.value;for(const value of c.options){c.value=value;run(0);}c.value=saved;}
  for(const c of toggles){const saved=c.value;c.value=!saved;run(0);c.value=saved;}
  run(.125);run(.25);assert.ok(marks>0,item.num+' actual drawn geometry');
 }
});
after(()=>{assert.equal(stats.cases,756);console.log('SOC6 complete independent reference statistics '+JSON.stringify(stats));});
