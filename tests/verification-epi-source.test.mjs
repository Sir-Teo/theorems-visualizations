import test from 'node:test';
import assert from 'node:assert/strict';
import { caseControlCells, caseControlOdds, recoverCaseControlRisks, DEFAULT_EXAMINATION_RISK, handwashingMortality, rareBaselineLimit, confoundedRiskRatio } from '../content/epi/verification.shared.js';
import { SNOW_DEATHS, SNOW_PUMPS, SNOW_BROAD, SNOW_DATES, SEMM_YEARLY } from '../content/epi/ch04.shared.js';
const near = (a,b,e=1e-12) => assert.ok(Math.abs(a-b)<e,`${a} ≠ ${b}`);
test('case-control sampling fixes case/control columns without swapping the exposure rows',()=>{
 assert.equal(caseControlOdds(100,0),Infinity);assert.equal(caseControlOdds(0,0),null);
 assert.deepEqual(caseControlCells(80,20),[[80,20,100],[20,80,100],[100,100,200]]);
 const pi1=.3*.04/(.3*.04+.7*.01),pi0=.3*.96/(.3*.96+.7*.99);
 const rows=caseControlCells(pi1*100,pi0*100);near(rows[0][0]/100,pi1);near(rows[0][1]/100,pi0);
 const r=recoverCaseControlRisks(pi1,pi0,.019);near(r.exposed,.04);near(r.unexposed,.01);
 assert.equal(recoverCaseControlRisks(0,0,.1).exposed,null);
});
test('rare-outcome approximation is controlled by risk in both groups, not a universal 5% baseline',()=>{
 for(const rr of [1.5,4,10]){const r=rareBaselineLimit(rr);const OR=rr*(1-r)/(1-rr*r);near(OR/rr-1,.1);}
 assert.ok(4*(1-.05)/(1-4*.05)/4>1.1);
});
test('handwashing controls alter a fixed mechanism and preserve probability bounds',()=>{
 near(handwashingMortality(0,6,.4,.012),1989/20042);
 near(handwashingMortality(1,20,1,.03),.03);
 assert.ok(DEFAULT_EXAMINATION_RISK>.038&&DEFAULT_EXAMINATION_RISK<.039);
 assert.ok(handwashingMortality(0,20,.4,.012)>handwashingMortality(0,6,.4,.012));
 assert.ok(handwashingMortality(0,6,1,.012)>handwashingMortality(0,6,.4,.012));
 for(const n of [1,6,20])for(const f of [.05,.4,1])for(const b of [0,.012,.03]){
  let last=1;for(let i=0;i<=100;i++){const m=handwashingMortality(i/100,n,f,b);assert.ok(m>=b-1e-14&&m<=last+1e-14&&m<=1);last=m;}
 }
});
test('Snow original fatal-attack table and published water-company totals reconcile',()=>{
 assert.equal(SNOW_DATES.attacks.length,43);assert.equal(SNOW_DATES.attacks.reduce((a,b)=>a+b),571);assert.equal(571+45,616);
 assert.deepEqual(SNOW_DATES.attacks.slice(13,24),[143,116,54,46,36,20,28,12,11,5,5]);
 near((1263/40046)/(98/26107),8.401853429780243,1e-10);
 assert.equal(SNOW_DEATHS.length,578);assert.equal(new Set(SNOW_DEATHS.map(p=>p.join(','))).size,575);
 const nearest=SNOW_DEATHS.filter(p=>SNOW_PUMPS.reduce((k,q,j)=>Math.hypot(p[0]-q[1],p[1]-q[2])<Math.hypot(p[0]-SNOW_PUMPS[k][1],p[1]-SNOW_PUMPS[k][2])?j:k,0)===SNOW_BROAD).length;
 assert.equal(nearest,359);assert.equal(Math.round(nearest/578*100),62);
});
test('Semmelweis rates are recomputed from the original counts rather than printed arithmetic',()=>{
 const y=SEMM_YEARLY.filter(r=>r[0]>=1841&&r[0]<=1846),s=k=>y.reduce((a,r)=>a+r[k],0);
 assert.deepEqual([s(1),s(2),s(3),s(4)],[20042,1989,17791,691]);
 near(s(2)/s(1),.09924159265542361);near(45/3556,.01265466816647919);
});
test('Cornfield binary-confounder bound holds independently over valid mixtures',()=>{
 for(const p0 of [.01,.04,.2,.5])for(const p1 of [p0,.6,1].filter(p=>p>=p0))for(const r0 of [0,.001,.1]){
  const rr=confoundedRiskRatio(p1,p0,.8,r0);assert.ok(rr<=p1/p0+1e-12);assert.ok(rr<=1/p0+1e-12);
 }
});
