import {authorPinBytes} from './wave6-author-pins.shared.mjs';
import test,{after}from'node:test';import fs from'node:fs';import assert from'node:assert/strict';import{createHash}from'node:crypto';
import*as H from'../content/demo/ch06.shared.js';import chapter from'../content/demo/ch06.js';import syllabus from'../content/demo/syllabus.js';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-demo-reference.json',import.meta.url))),statistics={cases:0,comparisons:0,numericalValues:0,exactValues:0,maxNormalizedError:0,worst:null};
const inputIntegerFields=new Set(['fertility','hazard','child','late','extra','trial','growth','shape','mean','reproduction','amplitude','period','census','females','daughterShare','utilization','maleFertility']);
const integerFields=new Set(['year','age','steps','step','time','yearsPerStep','terminalAge','blockLength','sourceReprintPage','reportedCalculatedSum','reportedObservedSum','mortalityYear','fertilityYear']);
function exactNumericField(path,family,depth){const key=path.slice(path.lastIndexOf('.')+1);return integerFields.has(key)||(depth===1&&inputIntegerFields.has(key))||(family==='periodSwap'&&(key==='first'||key==='second'));}
function compare(a,b,path,family,depth=0){
 if(b===null||typeof b!=='object'){
  statistics.comparisons++;if(typeof a==='bigint'){assert.equal(String(a),b,path);statistics.exactValues++;return;}
  if(typeof b==='number'&&family!=='changing'&&!path.includes('.table.')&&!path.includes('.args.')&&!exactNumericField(path,family,depth)){
   assert.equal(typeof a,'number',path);assert.ok(Number.isFinite(a),path+' finite');
   const cancellation=/(?:\.r|\.first|\.second|\.error|\.growth|\.distance|\.instant|\.finite|\.logF|accumulatedInstant|accumulatedFinite|finiteReconstructionTV|Growth|Intrinsic|Rate)$/.test(path),budget=cancellation?2e-14+2e-12*Math.abs(b):Math.max(4*Number.MIN_VALUE,2e-12*Math.abs(b)),error=Math.abs(a-b)/budget;statistics.numericalValues++;
   if(error>statistics.maxNormalizedError){statistics.maxNormalizedError=error;statistics.worst={path,actual:a,expected:b,absoluteError:Math.abs(a-b),budget};}
   assert.ok(error<=1,path+': '+a+' expected '+b+' error '+Math.abs(a-b)+' budget '+budget);return;
  }
  assert.ok(Object.is(a,b),path+': '+String(a)+' expected '+String(b));statistics.exactValues++;return;
 }
 assert.ok(a&&typeof a==='object',path+' object');assert.equal(Array.isArray(a),Array.isArray(b),path+' array');assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),path+' complete keys');for(const[k,v]of Object.entries(b))compare(a[k],v,path+'.'+k,family,depth+1);
}
for(const family of Object.keys(fixture.families))test('DEMO6 complete independent '+family+' objects',()=>{for(const row of fixture.cases.filter(r=>r.family===family)){compare(H[family](row.args),row.expected,family+' '+JSON.stringify(row.args),family);statistics.cases++;}});
after(()=>console.log('DEMO6_REFERENCE_STATS '+JSON.stringify(statistics)));
const Q=H.Q,near=(a,b,t=2e-12)=>assert.ok(Math.abs(a-b)<=t*(1+Math.abs(b)),`${a} expected ${b}`),sourceFacts=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-demo-source-facts.json',import.meta.url)));
test('DEMO6 fixture is complete and fixed at the independently generated525cases',()=>{
 const bytes=fs.readFileSync(new URL('./fixtures/wave6-demo-reference.json',import.meta.url));assert.equal(bytes.length,13364822);assert.equal(createHash('sha256').update(bytes).digest('hex'),'2353eee1539a9942ef25546e53774be8c812d2403488f746ef18666bc3e12b6e');assert.equal(fixture.cases.length,525);assert.equal(Object.keys(fixture.families).length,13);
 for(const[name,n]of Object.entries(fixture.families))assert.equal(fixture.cases.filter(r=>r.family===name).length,n,name);
});
test('DEMO6 preserves the complete old syllabus except its researched6refs/captions and mirrors every frozen field',()=>{
 const old=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-demo-syllabus-before.json',import.meta.url))),restored=structuredClone(syllabus),before=old.chapters.find(c=>c.n===6),now=restored.chapters.find(c=>c.n===6);
 assert.equal(chapter.items.length,12);assert.deepEqual(chapter.items.map(i=>i.num),before.items.map(i=>i.num));
 for(const item of now.items){const prior=before.items.find(i=>i.num===item.num),body=chapter.items.find(i=>i.num===item.num);for(const key of['num','kind','name','deps','paper','introduces','verify','see']){assert.equal(Object.hasOwn(body,key),Object.hasOwn(prior,key),item.num+' '+key+' property presence');assert.deepEqual(body[key],prior[key],item.num+' '+key);}assert.deepEqual(item.refs,body.refs);assert.equal(item.pic,body.caption);item.refs=structuredClone(prior.refs);item.pic=prior.pic;}
 assert.deepEqual(restored,old);for(const n of['6.11','6.12'])assert.equal(Object.hasOwn(chapter.items.find(i=>i.num===n),'verify'),false);assert.equal(syllabus.chapters.find(c=>c.n===5).items.find(i=>i.num==='5.8').verify,true);
});
test('DEMO6 reuses all50literal female source schedules without mutating the earlier data',()=>{
 for(const[path,hash]of Object.entries(sourceFacts.sourceHashes))assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../'+path,import.meta.url))).digest('hex'),hash,path);
 assert.equal(H.schedules.length,50);assert.ok(Object.isFrozen(H.schedules));
 for(const row of sourceFacts.schedules){const actual=H.schedules.find(s=>s.country===row.country&&s.year===row.year);assert.deepEqual(actual.survivors,row.survivorsFemale.map(Number));assert.deepEqual(actual.personYears,row.personYearsFemale.map(Number));assert.deepEqual(actual.fertility,row.fertilityPer1000WomanYears.map(x=>Number(x)/1000));assert.equal(actual.boysPer100Girls,Number(row.boysPer100Girls));assert.equal(actual.publishedNRR,Number(row.publishedNRR));assert.equal(actual.publishedTFR,Number(row.publishedTFR));assert.ok(Object.isFrozen(actual)&&Object.isFrozen(actual.survivors));}
 assert.throws(()=>H.schedules.push({}));assert.throws(()=>H.schedules[0].survivors[0]=0);
});
test('DEMO6 rejects out-of-domain scientific control values',()=>{
 for(const[fn,args]of[['stable',{year:'2023'}],['stable',{country:'invented'}],['stable',{fertility:.5}],['stable',{hazard:0}],['lotka',{trial:101}],['projection',{steps:-1}],['projection',{initial:'invented'}],['tilt',{growth:Infinity}],['tilt',{age:100.5}],['stationary',{hazard:NaN}],['coale',{child:24}],['coale',{extra:21}],['renewal',{shape:2}],['renewal',{mean:40.5}],['variable',{census:0}],['variable',{period:61}],['changing',{sequence:'invented'}],['changing',{steps:81}],['twoSex',{utilization:51}],['twoSex',{females:-1}],['historical',{growth:51}],['periodSwap',{second:2024}]])assert.throws(()=>H[fn](args),fn+' '+JSON.stringify(args));
});
test('DEMO6 sterile maternity and a non-normalizable age profile remain distinct',()=>{
 const sterile=H.stable({fertility:0});assert.equal(sterile.NRR,0);assert.equal(sterile.r,null);assert.equal(sterile.rootExists,false);assert.equal(sterile.profile,null);
 const divergent=H.tilt({country:'JPN',year:2023,growth:-50,hazard:25,late:25,age:100});assert.equal(divergent.rootExists,true);assert.equal(divergent.normalizable,false);assert.equal(divergent.b,null);assert.equal(divergent.selected.density,null);
 const empty=H.projection({initial:'empty',steps:300});assert.equal(empty.selected.total,0);assert.equal(empty.selected.shares,null);assert.equal(empty.selected.growth,null);assert.equal(empty.futureReproductionPossible,false);
 const old=H.projection({initial:'older-only',steps:300});assert.equal(old.futureReproductionPossible,false);assert.ok(old.selected.shares&&old.selected.shares[100]>0);
});
test('DEMO6 finite pulse-census target satisfies its own complete101-component eigen-equation',()=>{
 for(const country of['JPN','SWE','NGA','MEX']){const z=H.projection({country,steps:0}),v=z.discrete.vector,lambda=z.discrete.lambda,l=[1];for(let i=0;i<100;i++)l.push(l[i]*z.survivalSteps[i]);const next=Array(101).fill(0);next[0]=z.netMaternityBins.reduce((s,k,i)=>s+k/l[i]*v[i],0);for(let i=1;i<100;i++)next[i]=z.survivalSteps[i-1]*v[i-1];next[100]=z.survivalSteps[99]*v[99]+z.survivalSteps[100]*v[100];for(let i=0;i<101;i++)near(next[i],lambda*v[i],2e-13);near(v.reduce((a,b)=>a+b,0),1);assert.ok(lambda>z.survivalSteps[100]);}
 const z=H.projection();assert.ok(Math.abs(z.discrete.r-z.continuousRoot)>1e-5,'annual pulse and continuous roots are separate models');
});
test('DEMO6 stationary replacement and lifetime weighting obey the stated identities',()=>{
 for(const country of['JPN','SWE','NGA','MEX'])for(const hazard of[25,100,250]){const z=H.stationary({country,hazard});assert.equal(z.r,0);assert.equal(z.NRR,1);near(z.b,1/z.e0,2e-14);near(z.d,z.b,2e-14);near(z.meanAge,z.secondLifeMoment/(2*z.e0));near(z.meanAgeAtDeath,z.e0);near(z.survivalAreaThrough100+z.tailLifeYears,z.e0);}
});
test('DEMO6 uniform extra hazard preserves the full profile while changing growth and deaths',()=>{
 for(const country of['JPN','SWE','NGA','MEX']){const z=H.coale({country,extra:20});near(z.uniform.r,z.baseline.r-.02,2e-14);near(z.uniform.b,z.baseline.b,2e-14);near(z.uniform.d,z.baseline.d+.02,2e-14);for(let i=0;i<101;i++)near(z.uniform.profile[i][1],z.baseline.profile[i][1],2e-14);}
});
test('DEMO6 proportional fertility changes tilt toward younger finite stable profiles',()=>{
 for(const country of['JPN','SWE','NGA','MEX']){const a=H.stable({country,fertility:100}),b=H.stable({country,fertility:200});assert.ok(b.r>a.r);assert.ok(b.meanAge<a.meanAge);near(b.b-b.d,b.r,2e-14);}
 const z=H.approximation();for(const p of z.points)assert.ok(p.r+2e-14>=p.first);
});
test('DEMO6 Erlang phase roots satisfy the polynomial and corrected births split positively',()=>{
 for(const shape of[3,6,8])for(const reproduction of[25,100,400]){const z=H.renewal({shape,reproduction});for(const root of z.roots){let real=1,imag=0;const a=1+z.theta*root.real,b=z.theta*root.imag;for(let j=0;j<shape;j++){const nr=real*a-imag*b;imag=real*b+imag*a;real=nr;}near(real,z.R,2e-12);near(imag,0,2e-12);if(!root.dominant)assert.ok(root.real<z.r);}
  for(const row of z.history){assert.ok(row.forcing>=0&&row.renewed>=0);near(row.forcing+row.renewed,row.corrected,2e-14);near(row.births,Math.exp(z.r*row.time)*row.corrected,2e-14);}}
});
test('DEMO6 instantaneous and finite-census growth coincide only in the appropriate special case',()=>{
 const steady=H.variable({amplitude:0});near(steady.finiteUnnormalizedMass,1,2e-14);assert.equal(steady.finiteReconstructionTV,0);for(const p of steady.profile){near(p.instant,p.finite,2e-14);near(p.actual,p.censusRaw,2e-14);}
 const dynamic=H.variable({amplitude:100,period:20,census:30,time:17});assert.ok(dynamic.finiteReconstructionTV>1e-3);assert.ok(Math.abs(dynamic.finiteUnnormalizedMass-1)>1e-3);for(const p of dynamic.profile)near(p.actual,p.reconstructed,2e-14);
});
test('DEMO6 exact changing-law ratio ranges satisfy every certified block bound',()=>{
 for(const sequence of['periodic','Thue–Morse'])for(const initial of['opposed','near','same']){const z=H.changing({sequence,initial});assert.equal(Q.sign(z.blockMin.exact),1);assert.equal(Q.sign(z.epsilon.exact),1);for(let i=1;i<z.history.length;i++)assert.ok(Q.sign(Q.sub(z.history[i].ratioSpread.exact,z.history[i-1].ratioSpread.exact))<=0);for(const row of z.history.filter(r=>r.relativeSpread!==null))assert.ok(Q.sign(Q.sub(row.relativeSpread.exact,row.blockBound.exact))<=0);if(initial==='same')assert.ok(z.history.every(r=>Q.sign(r.distance.exact)===0));}
});
test('DEMO6 chosen two-sex capacity closure respects its bounds and missing-sex branches',()=>{
 for(const females of[0,50,100])for(const utilization of[0,50]){const z=H.twoSex({females,utilization,steps:40}),track=z.tracks['two-sex'];for(const row of track.history){assert.ok(row.births>=0);assert.ok(row.births<=Math.min(row.femaleCapacity,row.maleCapacity)*(1+2e-14));}if(females===0||females===100||utilization===0){assert.ok(track.history.every(r=>r.births===0));assert.equal(track.selected.total,0);assert.equal(track.selected.femaleShare,null);assert.equal(track.selected.annualGrowth,null);}}
});
test('DEMO6 counterfactual rate swaps preserve identity when years coincide and reverse consistently',()=>{
 const same=H.periodSwap({country:'SWE',first:2023,second:2023});for(const row of same.rows)assert.deepEqual(row,same.rows[0]);
 const forward=H.periodSwap({country:'SWE',first:1950,second:2023}),reverse=H.periodSwap({country:'SWE',first:2023,second:1950});for(let i=0;i<4;i++)assert.deepEqual(forward.rows[i],reverse.rows[3-i]);
});
test('DEMO6 cached numerical objects cannot be changed by a caller',()=>{
 const args={country:'JPN',year:2023},one=H.stable(args),expected=one.profile[0][1];one.profile[0][1]=999;one.sourceKnots[0][1]=999;assert.equal(H.stable(args).profile[0][1],expected);assert.equal(H.stable(args).sourceKnots[0][1],1);
 const a=H.approximation(args),r=a.points[0].r;a.points[0].r=999;assert.equal(H.approximation(args).points[0].r,r);
});
test('DEMO6 preserves all653 prior raw files and the original historical test behind its narrow adapter',()=>{
 const before=JSON.parse(fs.readFileSync(new URL('../docs/verification/wave6-demo-preimages.json',import.meta.url)));assert.equal(Object.keys(before.rawPins).length,654);let count=0;
 for(const[path,hash]of Object.entries(before.rawPins))if(path!=='content/demo/syllabus.js'){assert.equal(createHash('sha256').update(authorPinBytes(new URL('../'+path,import.meta.url),hash)).digest('hex'),hash,path);count++;}assert.equal(count,653);
 const file=fs.readFileSync(new URL('../tests/wave5-demo.test.mjs',import.meta.url),'utf8'),adapter="const without5=x=>{const copy=structuredClone(x);const baseline6=BASELINE.chapters.find(c=>c.n===6);for(const item of copy.chapters.find(c=>c.n===6).items){const old=baseline6.items.find(i=>i.num===item.num);item.refs=structuredClone(old.refs);item.pic=old.pic;}return{...copy,chapters:copy.chapters.filter(c=>c.n!==5)};};",original="const without5=x=>({...x,chapters:x.chapters.filter(c=>c.n!==5)});";assert.equal(file.split(adapter).length,2,'one exact historical adapter');assert.equal(createHash('sha256').update(file.replace(adapter,original)).digest('hex'),before.historicalGuardPreimage.sha256,'entire original test is byte exact after removing only the refs/pic adapter');
});
