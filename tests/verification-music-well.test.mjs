import test from 'node:test';import assert from 'node:assert/strict';
import * as W from '../content/music/source-audit-well.js';
const near=(a,b,t=2e-10)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`),recipes=Object.keys(W.WELL_RECIPES),semi=[3,10,5,0,7,2,9,4,11,6,1,8];
// Active-set projection oracle, independent of production's shift bisection.
function project(d,i,value){const x=[...d],free=new Set(Array.from({length:12},(_,j)=>j).filter(j=>j!==i));x[i]=value;for(let step=0;step<12;step++){const fixed=x.reduce((s,q,j)=>s+(free.has(j)?0:q),0),offset=(W.WELL_P-fixed-[...free].reduce((s,j)=>s+d[j],0))/free.size,violations=[...free].filter(j=>d[j]+offset < -40||d[j]+offset>25);if(!violations.length){for(const j of free)x[j]=d[j]+offset;return x;}for(const j of violations){x[j]=Math.max(-40,Math.min(25,d[j]+offset));free.delete(j);}}throw Error('reference projection failed');}
test('source recipe edges, closure, all 12 cyclic thirds and both C4-anchored cadences',()=>{
 const ids={werckmeister:[3,4,5,8],kirnberger:[3,4,5,6,9],vallotti:[2,3,4,5,6,7]};
 for(const[name,positions]of Object.entries(ids))assert.deepEqual(W.wellRecipe(name).flatMap((x,j)=>x?[j]:[]),positions);
 near(W.WELL_P,23.460010384649013,2e-13);near(W.WELL_S,21.506289596714854,2e-13);
 for(const recipe of recipes)for(const key of[0,6]){const d=W.wellRecipe(recipe),m=W.wellModel(d,key);assert.equal(W.wellValid(d),true);near(m.closureResidual,0,3e-12);near(m.narrowingResidual,0,1e-13);assert.equal(m.pcs[0],0);
  for(let j=0;j<12;j++){const p=semi[j],next=semi[(j+1)%12],third=semi[(j+4)%12];near((m.pcs[next]-m.pcs[p]+1200)%1200,m.rows[j].fifth,3e-12);near((m.pcs[third]-m.pcs[p]+1200)%1200, m.rows[j].major,3e-12);const errors=W.WELL_S-[0,1,2,3].reduce((s,k)=>s+d[(j+k)%12],0);near(m.rows[j].error,errors,2e-12);}
  const roots=[key,(key+5)%12,(key+7)%12,key];for(let i=0;i<4;i++){const fs=m.cadence[i],r=roots[i];near(fs[0],261.6256*Math.exp(m.pcs[r]*Math.LN2/1200));assert.ok(fs[0]>=261.6256&&fs[0]<523.2512);for(let v=1;v<3;v++)assert.ok(fs[v]>fs[0]);for(let v=0;v<3;v++){const p=(r+[0,4,7][v])%12;near(((1200*Math.log2(fs[v]/261.6256))%1200+1200)%1200,m.pcs[p],2e-12);assert.ok(8*fs[v]<22050);}}
 }
 const p=W.wellModel(W.wellRecipe('pyth'));assert.ok(p.minFifth<680);assert.ok(p.maxFifth>701); // closure alone is not uniformly near-pure
});
test('all handles and bounds against independent active-set projection, including long saturation histories',()=>{
 for(const recipe of recipes)for(let i=0;i<12;i++)for(const val of[-40,-39.999,0,24.999,25]){const d=W.wellRecipe(recipe),out=W.wellRebalance(d,i,val),expected=project(d,i,val);assert.equal(out[i],val);assert.ok(W.wellValid(out));out.forEach((x,j)=>near(x,expected[j],2e-12));}
 let d=W.wellRecipe('werckmeister');for(let k=0;k<1000;k++){const i=(k*7)%12,val=k%3===0?-40:k%3===1?25:-40+65*((k*37)%997)/996,expected=project(d,i,val);d=W.wellRebalance(d,i,val);assert.equal(d[i],val);assert.ok(W.wellValid(d));d.forEach((x,j)=>near(x,expected[j],3e-12));}
});
test('all recipe/key cadence audio has actual H8 frequencies, samples, ramps, silent gaps and peak bound',()=>{
 for(const name of recipes)for(const key of[0,6]){const d=W.wellRecipe(name),m=W.wellModel(d,key),a=W.wellAudio(d,key);assert.deepEqual(a.frequencies,m.cadence);assert.equal(a.sampleRate,44100);assert.equal(a.harmonics,8);assert.equal(a.frames,35280);assert.equal(a.silence,4410);assert.equal(a.samples.length,154350);for(let e=0;e<4;e++){for(const j of[0,1,100,440,441,999,12345,35000,35279]){let x=0;for(let h=8;h>0;h--)for(const f of a.frequencies[e])x+=Math.sin(j*2*Math.PI*f*h/44100)/h;const env=j<441?j/441:j>=a.frames-441?(a.frames-1-j)/441:1;x*=.12*env/(3*(761/280));near(a.samples[e*(a.frames+a.silence)+j],x,7e-9);}if(e<3)for(let j=0;j<a.silence;j++)assert.equal(a.samples[e*(a.frames+a.silence)+a.frames+j],0);}for(const x of a.samples)assert.ok(Number.isFinite(x)&&Math.abs(x)<=.12000001);}
});
test('reject malformed/custom state and unsupported key/index/range domains',()=>{
 const inherited=Array(12);Object.setPrototypeOf(inherited,Object.assign(Object.create(Array.prototype),W.wellRecipe('equal')));
 for(const d of[null,{},[],Array(12),inherited,Array(12).fill(NaN),Array(12).fill(0),[...W.wellRecipe('equal'),0],W.wellRecipe('equal').map((x,i)=>i?'1':x)]){assert.equal(W.wellValid(d),false);assert.throws(()=>W.wellModel(d));assert.throws(()=>W.wellRebalance(d,0,0));}
 for(const x of['',null,'toString','__proto__'])assert.throws(()=>W.wellRecipe(x));for(const x of[1,-1,12,'0',NaN,Infinity])assert.throws(()=>W.wellModel(W.wellRecipe('equal'),x));for(const i of[-1,12,.5,'0',NaN])assert.throws(()=>W.wellRebalance(W.wellRecipe('equal'),i,0));for(const v of[-40.1,25.1,NaN,Infinity,'1'])assert.throws(()=>W.wellRebalance(W.wellRecipe('equal'),0,v));
});
