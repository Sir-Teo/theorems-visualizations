import test from 'node:test';
import assert from 'node:assert/strict';
import {captureMinimumAudit as minimum,capturePenaltyAudit as penalty} from '../content/energy/source-audit-capture.shared.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('minimum mixing work agrees with independent reversible incremental extraction',()=>{
  const R=8.31446261815324,T=313.15;
  for(const y of [.0004,.02,.13,.2])for(const r of [.5,.9,.99]){
    const N=10000,dn=r*y/N;let work=0;
    for(let i=0;i<=N;i++){const n=i*dn,z=(y-n)/(1-n),weight=i===0||i===N?1:i%2?4:2;work+=weight*R*T*Math.log(1/z);}
    near(minimum(y,r),work*dn/3/(r*y)/44.0095/1000,2e-9);
  }
});
test('dilution and capture increase minimum work while temperature scales it',()=>{
  assert.ok(minimum(.02,.9)>minimum(.13,.9));assert.ok(minimum(.13,.99)>minimum(.13,.5));
  near(minimum(.13,.9,626.3),2*minimum(.13,.9));
  near(minimum(.13,1e-5),8.31446261815324*313.15*Math.log(1/.13)/(44.0095*1000),2e-6);
});
test('plant energy, carbon and efficiency accounts close at all sixty-four physical input corners',()=>{
  for(const y of [.02,.2])for(const r of [.5,.99])for(const q of [2.5,4.5])for(const kap of [.12,.35])for(const eta of [.3,.5])for(const ec of [.6,.9]){
    const p=penalty({y,r,q,kap,eta,ec});
    near(p.net+p.eS+p.eC,3.6);near(p.t,94.6*p.F/1000);near(p.cap,r*p.t);near(p.etaNew,p.net/p.F);
    near(p.pen,eta-p.etaNew);near(1+p.fuelUp,eta/p.etaNew);
    assert.ok(p.net>0&&p.etaNew<eta&&p.eS>=p.eMin&&p.idealWorkFraction>0&&p.idealWorkFraction<=1);
  }
});
test('ideal compression belongs in both the minimum-work numerator and actual-loss denominator',()=>{
  const p=penalty(),expected=8.31446261815324*313.15*Math.log(110)/(44.0095*1000);
  near(p.compMin,expected);near(p.comp,p.compMin/.75);
  near(p.idealWorkFraction,(p.wmGJ+expected)/(.22*3.6+expected/.75));
  assert.ok(p.idealWorkFraction>p.wmGJ/(.22*3.6+p.comp));
});
