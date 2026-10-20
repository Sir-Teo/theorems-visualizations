import test from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';
import{EXTINCTIONS,DEFAULT_LOSSES,extinctionModel,logisticAdvance,recoveryTime}from'../content/bighist/source-audit-extinction.js';
const refs=JSON.parse(await readFile(new URL('../docs/verification/bighist-extinction-reference.json',import.meta.url)));
const near=(a,b,t=4e-12)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('all five source genus/species pairs, rounded2011ends and durations are literal and distinct',()=>{
 assert.deepEqual(EXTINCTIONS.map(e=>[e.age,e.genera,e.species]),[[443,57,86],[359,35,75],[251,56,96],[200,47,80],[65,40,76]]);
 assert.deepEqual(EXTINCTIONS.map(e=>e.duration),['1.9–3.3 Myr','2–29 Myr','0.16–2.8 Myr','0.6–8.3 Myr','less than a year to 2.5 Myr']);
 assert.deepEqual(DEFAULT_LOSSES,[.86,.75,.96,.8,.76]);
});
test('all64 corners and continuous case match80digit independent log-odds reference',()=>{
 assert.equal(refs.length,66);
 for(const ref of refs){const a=ref.input.map(Number),m=extinctionModel(a[0],a.slice(1));m.events.forEach((e,i)=>[e.pre,e.post,e.recovery].forEach((x,j)=>near(x,+ref.events[i][j])));}
});
test('full curve obeys logistic flow, every pulse and inverse recovery witness with zero at small losses',()=>{
 for(const ref of refs){const a=ref.input.map(Number),m=extinctionModel(a[0],a.slice(1));assert.equal(m.curve.length,294);near(m.curve[0][1],.04);
  let index=1,start=[-550,.04];
  for(const e of m.events){for(let j=1;j<=48;j++){
    const[t,n]=m.curve[index++],dt=t-start[0],expected=start[1]/(start[1]+(1-start[1])*Math.exp(-m.r*dt));near(n,expected);assert.ok(n>=start[1]&&n<=1);
   }assert.deepEqual(m.curve[index++],[-e.age,e.post]);near(e.post,e.pre*(1-e.loss));assert.ok(e.recovery>=0);
   if(e.loss<=.1){assert.equal(e.recovery,0);assert.ok(e.post>=e.target);}else{near(logisticAdvance(e.post,m.r,e.recovery),e.target);assert.ok(logisticAdvance(e.post,m.r,e.recovery*.999)<e.target);}
   start=[-e.age,e.post];
  }
  for(let j=1;j<=48;j++){const[t,n]=m.curve[index++];near(n,start[1]/(start[1]+(1-start[1])*Math.exp(-m.r*(t-start[0]))));}assert.equal(index,m.curve.length);
 }
 near(recoveryTime(.7,.1,.5),0);assert.equal(recoveryTime(.7,.05,.5),0);
 // A finite-difference derivative independently checks the stated differential equation.
 for(const n of[.0002,.1,.5,.999])for(const r of[.1,.7,2]){const dt=1e-6;near((logisticAdvance(n,r,dt)-n)/dt,r*n*(1-n),3e-7);}
});
test('invalid finite controls and off-domain pulse data are rejected before clamping',()=>{
 for(const x of[NaN,Infinity,-1,0,.099999,2.000001,'1',null])assert.throws(()=>extinctionModel(x),RangeError);
 for(const x of[NaN,Infinity,.049999,.995001,'0.1',null])for(let i=0;i<5;i++){const a=DEFAULT_LOSSES.slice();a[i]=x;assert.throws(()=>extinctionModel(.5,a),RangeError);}
 for(const a of[[],[.5],null,{},Array(6).fill(.5)])assert.throws(()=>extinctionModel(.5,a),RangeError);
});
