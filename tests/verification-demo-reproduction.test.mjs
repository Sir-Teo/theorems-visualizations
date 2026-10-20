import test from'node:test';import assert from'node:assert/strict';
import{CTRY,SEXY,AGE22,FAGES,asfr,indAt,lxSex,LxSex}from'../content/demo/ch04.shared.js';
import{reproductionExposure,reproductionSurvival,reproductionRates}from'../content/demo/source-audit-reproduction.js';
const near=(a,b,t=3e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
function quad(fn,a,b,n=128){let s=fn(a)+fn(b);for(let i=1;i<n;i++)s+=(i%2?4:2)*fn(a+(b-a)*i/n);return s*(b-a)/(3*n);}
const options=(c,y,k)=>({ages:AGE22,survivors:lxSex(c,'f',y),personYears:LxSex(c,'f',y),fertilityAges:FAGES,fertility:asfr(c,y),boysPer100Girls:indAt(c,'srb',y),multiplier:k});

test('Exact powered exposure agrees with independent numerical integration at zero/flat/near-flat/steep hazards and each offered exponent',()=>{
 for(const start of[1,.9,.4,.001])for(const hazard of[0,1e-10,.01,.2,2])for(let j=0;j<=60;j++){
  const k=j/20,end=start*Math.exp(-5*hazard),actual=reproductionExposure(start,end,5,k),reference=quad(t=>Math.exp(k*(Math.log(start)-hazard*t)),0,5,4096);near(actual,reference,5e-10);assert.ok(actual>=5*end**k-1e-12&&actual<=5*start**k+1e-12);
 }
 assert.throws(()=>reproductionExposure(.5,.6,5,1));assert.throws(()=>reproductionExposure(1,.5,5,-1));
});

test('All50 official schedules at all61 hazard settings have coherent exact bar areas and one shared survival curve, monotonic NRR and no-mortality equality',()=>{
 let comparisons=0;
 for(const c of CTRY)for(const y of SEXY){let previous=Infinity;const base=options(c,y,1),l=base.survivors,radix=l[0];assert.equal(radix,100000);l.forEach((x,i)=>{assert.ok(x>0&&x<=radix);if(i)assert.ok(x<=l[i-1]);});
  for(let j=0;j<=60;j++){const k=j/20,o=options(c,y,k),m=reproductionRates(o),share=100/(100+o.boysPer100Girls);let gross=0,net=0,grouped=0;
   FAGES.forEach((a,i)=>{const z=AGE22.indexOf(a),u=l[z]/radix,v=l[z+1]/radix,integral=quad(x=>Math.exp(k*((1-x/5)*Math.log(u)+x/5*Math.log(v))),0,5);gross+=5*o.fertility[i]*share;net+=o.fertility[i]*share*integral;grouped+=o.fertility[i]*share*o.personYears[z]/radix;near(m.exposure[i],integral);near(m.net[i],share*o.fertility[i]*integral/5);assert.ok(o.personYears[z]>=5*l[z+1]-.51&&o.personYears[z]<=5*l[z]+.51);comparisons++;});
   near(m.GRR,gross);near(m.NRR,net);near(m.grouped,grouped);near(m.loss,gross-net);assert.ok(m.NRR<=previous+1e-12);assert.ok(m.NRR>=0&&m.NRR<=m.GRR+1e-12);previous=m.NRR;if(k===0)assert.equal(m.NRR,m.GRR);
   let last=1;for(const[age,s]of m.adjustedCurve){let i=0;while(i+1<AGE22.length&&age>AGE22[i+1])i++;const u=i===AGE22.length-1?0:(age-AGE22[i])/(AGE22[i+1]-AGE22[i]),value=i===AGE22.length-1?(l[i]/radix)**k:((l[i]/radix)**(1-u)*(l[i+1]/radix)**u)**k;near(s,value);assert.ok(s>=0&&s<=1+1e-12&&s<=last+1e-12);last=s;}
   near(m.survival30,(l[AGE22.indexOf(30)]/radix)**k);if(k===1)m.knots.forEach(([a,s],i)=>near(reproductionSurvival(AGE22,l,a,1),s));
  }
 }assert.equal(comparisons,50*61*9);
});

test('Birth-sex units, radix invariance and fertility scaling distinguish live daughters from a second application of daughter survival',()=>{
 for(const c of CTRY)for(const y of SEXY){const o=options(c,y,1),m=reproductionRates(o),scale=reproductionRates({...o,survivors:o.survivors.map(x=>x*10),personYears:o.personYears.map(x=>x*10)}),twice=reproductionRates({...o,fertility:o.fertility.map(x=>2*x)});near(scale.NRR,m.NRR);near(scale.grouped,m.grouped);near(twice.NRR,2*m.NRR);near(twice.GRR,2*m.GRR);near(m.GRR,5*o.fertility.reduce((a,b)=>a+b)/(1+o.boysPer100Girls/100));}
 const m=reproductionRates({ages:[0,15,20,30,100],survivors:[1000,400,400,400,1],personYears:[0,2000,0,0,0],fertilityAges:[15],fertility:[.4],boysPer100Girls:100,multiplier:1});
 // Of1,000newborn prospective mothers,400 reach the entire fertile interval; each has2births, half girls.
 const liveDaughters=400*2*.5/1000;near(m.GRR,1);near(m.NRR,liveDaughters);near(m.grouped,liveDaughters);assert.notEqual(m.NRR,liveDaughters*.4,'daughters’ later survival is not applied a second time');
});

test('The integral of powered survival differs from powering mean survival, and grouped official references remain distinct from the interpolation',()=>{
 const u=1,v=.2,mean=reproductionExposure(u,v,5,1)/5,poweredMean=5*mean**3,exact=reproductionExposure(u,v,5,3);assert.ok(exact>poweredMean+.1,'Jensen gap exposes the former inconsistent hazard transformation');
 let differs=0;for(const c of CTRY)for(const y of SEXY){const m=reproductionRates(options(c,y,1));near(m.NRR,m.reconstructedBaseline);if(Math.abs(m.NRR-m.grouped)>1e-7)differs++;assert.ok(m.grouped<=m.GRR+1e-12);}assert.ok(differs>0,'a declared interpolation is not silently equated to official Lx');
});
