import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync}from'node:fs';
import {lyapunovDrift,lyapunovCertificate,birthDeathP,logBirthDeathScale,birthDeathClassification,zeroSuccessUpper95}from'../content/prob/ch05-birth-death-audit.shared.js';
const refs=JSON.parse(readFileSync(new URL('../docs/verification/birth-death-references.json',import.meta.url)));
const near=(a,b,rel=1e-11,abs=1e-14)=>assert.ok(Math.abs(a-b)<=abs+rel*Math.abs(b),`${a} != ${b}`);
test('analytic Lyapunov drifts match 60 independent 80-digit differences, including critical tiny negative drift',()=>{
 for(const r of refs.drifts)near(lyapunovDrift(r.kind,r.b,r.x),Number(r.drift),4e-14,1e-30);
 assert.ok(lyapunovDrift('log',.25,1e6)<0);assert.ok(lyapunovDrift('log',.26,1e6)>0);
 for(const kind of ['x','sq','log'])for(const b of [0,.1,.25,.26,.6]){
  const c=lyapunovCertificate(kind,b);assert.equal(c.holds,kind==='log'?b<=.25:kind==='x'&&b===0);
  if(c.holds)for(const x of [1,10,400,1e6])assert.ok(lyapunovDrift(kind,b,x)<=0);
 }
});
test('logarithmic scale accumulation matches 72 independent product sums without clipping overflow',()=>{
 const cache=new Map();for(const r of refs.scales){const key=r.family+'|'+r.b;if(!cache.has(key))cache.set(key,logBirthDeathScale(r.family,r.b,10000));near(cache.get(key)[r.N],Number(r.logScale),3e-12,2e-11);}
 const huge=logBirthDeathScale('const',-.2,10000)[10000];assert.ok(huge>Math.log(Number.MAX_VALUE));assert.ok(Number.isFinite(huge));
});
test('family recurrence classification follows analytic exponents/geometric ratio, including both critical boundaries',()=>{
 for(const f of ['inv','sqrt','const'])for(const b of [-.2,0,.245,.25,.255,.45]){
  assert.equal(birthDeathClassification(f,b).recurrent,f==='inv'?b<=.25:b<=0);for(const x of [1,2,100,10000]){const p=birthDeathP(f,b,x);assert.ok(p>0&&p<1);}assert.equal(birthDeathP(f,b,0),1);
 }
 const critical=logBirthDeathScale('inv',.25,10000);for(const N of [1,2,64,100,1000,10000]){let s=0;for(let m=0;m<N;m++)s+=3/(2*m+3);near(critical[N],Math.log(s));}
 for(const b of [-.2,0,.25,.45]){const logs=logBirthDeathScale('const',b,64),p=.5+b,r=(1-p)/p;for(const N of [2,4,8,16,32,64]){const s=r===1?N:(1-r**N)/(1-r);near(Math.exp(-logs[N]),1/s);}}
});
test('finite-interval escape formula solves harmonic equations independently for all displayed families',()=>{
 for(const f of ['inv','sqrt','const'])for(const b of [-.2,0,.25,.45])for(const N of [2,4,8,16,32,64]){
  const logs=logBirthDeathScale(f,b,N),s=Array.from(logs,x=>Math.exp(x));s[0]=0;const h=s.map(x=>x/s[N]);near(h[0],0);near(h[N],1);
  for(let x=1;x<N;x++){const p=birthDeathP(f,b,x);near(p*h[x+1]+(1-p)*h[x-1],h[x]);}
 }
});
test('zero-success markers show the exact one-sided bound, never a fictitious observed frequency',()=>{
 const u=zeroSuccessUpper95(3000);near((1-u)**3000,.05,2e-12);assert.ok(u>1/3000);assert.ok(u<.001);
});
