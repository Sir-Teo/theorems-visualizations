import test from 'node:test';import assert from 'node:assert/strict';
import{LAB_DIVIDENDS,LAB_PRESETS,labFundamental,labSession,labDeviation,labMean}from'../content/fin/source-audit-laboratory.js';
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('Original design4 expectation, finite cash-flow benchmark and terminal timing agree with exhaustive dividend histories',()=>{
 assert.deepEqual(LAB_DIVIDENDS,[0,.08,.28,.60]);near(LAB_DIVIDENDS.reduce((a,b)=>a+b,0)/4,.24);near(labFundamental(1),3.6);near(labFundamental(15),.24);assert.equal(labFundamental(16),0);
 for(let n=1;n<=6;n++){let sum=0,sum2=0;for(let code=0;code<4**n;code++){let c=code,value=0;for(let j=0;j<n;j++){value+=LAB_DIVIDENDS[c%4];c=Math.floor(c/4);}sum+=value;sum2+=value*value;}near(sum/4**n,n*.24);near(sum2/4**n-(sum/4**n)**2,n*.0536);near(labFundamental(16-n),sum/4**n);}
 near(labDeviation(Array.from({length:15},(_,j)=>labFundamental(j+1))).meanFundamental,1.92);
});
test('All335421offered trend/pull/noise settings match an independent chronological recurrence, including floor activation',()=>{
 const z=[-5,3,-2,4,-1,0,1,-4,2,-3,5,0,1,-1,2];let floors=0;
 for(let bi=0;bi<=100;bi++)for(let ki=0;ki<=80;ki++)for(let ni=0;ni<=40;ni++){
  const b=bi/100,k=ki/100;let j=0;const actual=labSession(b,k,ni,()=>z[j++]);const independent=[1.6,1.9];
  for(let t=1;t<=15;t++){const w=k+(1-k)/2*(t/15)**6,prior=independent.at(-1),before=independent.at(-2),price=Math.max(.02,(1-w+b)*prior-b*before+w*.24*(16-t)+ni*z[t-1]/100);independent.push(price);near(actual[t-1],price);if(price===.02)floors++;}
  assert.equal(j,15);assert.ok(actual.every(p=>Number.isFinite(p)&&p>=.02));
 }assert.ok(floors>0);
});
test('Normalized RD/RAD and peak timing are direct descriptive identities, not fitted or experience-ordered results',()=>{
 const F=Array.from({length:15},(_,j)=>.24*(15-j)),zero=labDeviation(F);near(zero.rd,0);near(zero.rad,0);near(zero.meanFundamental,1.92);
 for(const p of[F.map(x=>2*x),F.map(x=>x/2),Array(15).fill(.02)]){const m=labDeviation(p);near(m.rd,p.reduce((s,x,i)=>s+x-F[i],0)/28.8);near(m.rad,p.reduce((s,x,i)=>s+Math.abs(x-F[i]),0)/28.8);assert.ok(m.rad+1e-12>=Math.abs(m.rd));assert.equal(p[m.peakPeriod-1],Math.max(...p));near(m.peak,Math.max(...p));}
 assert.deepEqual(LAB_PRESETS,[[.7,.07],[.4,.2],[.15,.45]]);
});
test('All40paths enter each finite mean and sample standard error; deterministic presets have zero sampling variation',()=>{
 const paths=Array.from({length:40},(_,j)=>Array.from({length:15},(_,t)=>.02+(j-20)**2/13+Math.sin(t+j))),m=labMean(paths);
 for(let t=0;t<15;t++){const values=paths.map(p=>p[t]),mean=values.reduce((a,b)=>a+b,0)/40,variance=values.reduce((s,x)=>s+(x-mean)**2,0)/39;near(m.mean[t],mean);near(m.se[t],Math.sqrt(variance/40));}
 for(const[b,k]of LAB_PRESETS){const p=labSession(b,k,0,()=>999),det=labMean(Array.from({length:40},()=>p));det.mean.forEach((x,i)=>near(x,p[i]));assert.ok(det.se.every(x=>x===0));}
});
