import test from 'node:test';
import assert from 'node:assert/strict';
import {rng} from '../assets/js/viz/math.js';
import {chainFactorsAudit as factors,poissonSurvivalAudit as survival,chainGenerationsAudit as tree} from '../content/energy/source-audit-chain.shared.js';
const close=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('DOE reproduction example and NIST moderator absorption close independent reaction-rate ratios',()=>{
  const e=4.83/(4.83+43.5),expected=4.83*582*2.42/(4.83*694+43.5*2.71);
  close(factors({fraction:e}).eta,expected);close(expected,1.96,.001);
  const sa={h2o:2*.3326+.00019,d2o:2*.000519+.00019,c:.0035};
  for(const moderator of Object.keys(sa))for(let mask=0;mask<16;mask++){
    const fraction=(mask&1?20:.72)/100,ratio=mask&2?1000:.3,absorber=mask&4?30:0,nonleakage=mask&8?1:.5;
    const c=factors({moderator,fraction,ratio,absorber,nonleakage});
    const produced=2.42*fraction*582,absorbed=fraction*694+(1-fraction)*2.71+ratio*sa[moderator]+absorber;
    close(c.eta*c.f,produced/absorbed);close(c.keff,c.eta*c.f*c.p*c.eps*nonleakage);
    assert.ok(c.f>0&&c.f<=1&&c.p>=0&&c.p<=1&&c.keff>=0&&Number.isFinite(c.keff));
  }
});
test('Poisson survival chooses the nontrivial root accurately near criticality',()=>{
  for(const k of [0,.5,1])assert.equal(survival(k),0);
  for(const k of [1+1e-8,1.001,1.05,1.3,2.1]){const s=survival(k);assert.ok(s>0&&s<1);close(s,-Math.expm1(-k*s),2e-14);}
  close(survival(1+1e-8)/(2e-8),1,1e-6);
  // Independent large-generation recursion from q0=0, safely away from k=1.
  for(const k of [1.3,2.1]){let q=0;for(let j=0;j<1000;j++)q=Math.exp(k*(q-1));close(1-survival(k),q,1e-13);}
});
test('full branching counts retain every child and have the independent Poisson-process mean',()=>{
  for(const k of [.5,1,1.5,2.1]){
    const N=4000,g=4,mean=4*k**g,variance=k===1?4*g:4*k**g*(k**g-1)/(k-1);let total=0;
    for(let seed=1;seed<=N;seed++){
      const layers=tree(rng(seed),k,g);assert.equal(layers[0].length,4);assert.equal(layers.length,g+1);
      for(let j=1;j<layers.length;j++)for(const node of layers[j])assert.ok(Number.isInteger(node.par)&&node.par>=0&&node.par<layers[j-1].length);
      total+=layers.at(-1).length;
    }
    assert.ok(Math.abs(total/N-mean)<6*Math.sqrt(variance/N),`${k}: sampled ${total/N}, mean ${mean}`);
  }
  const large=tree(rng(1),2.1);assert.ok(large.some(layer=>layer.length>60),'the model must not silently cap the simulated populations at the display sample size');
});
test('absorption and leakage controls reduce multiplication; enrichment increases reproduction',()=>{
  for(const moderator of ['h2o','d2o','c']){
    const base=factors({moderator});assert.ok(factors({moderator,absorber:30}).keff<base.keff);assert.ok(factors({moderator,nonleakage:.5}).keff<base.keff);
    assert.ok(factors({moderator,fraction:.2}).eta>factors({moderator,fraction:.0072}).eta);
  }
});
