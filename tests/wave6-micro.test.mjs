import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as H from '../content/micro/ch12.shared.js';
const reference=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-micro-reference.json',import.meta.url)));
const at=(o,path)=>path.split('.').reduce((v,k)=>v?.[k],o);
const families=[...new Set(reference.rows.map(r=>r.name))];
const stats={cases:0,comparisons:0,worstPhysicalRelative:0,worstTrajectoryRelative:0,worstAlgebraLogAbsolute:0,worstTrajectoryLogAbsolute:0};
for(const family of families)test('MICRO12 independent reference: '+family,()=>{
 for(const row of reference.rows.filter(r=>r.name===family)){
  const actual=H[family](row.p);stats.cases++;
  for(const[path,e]of Object.entries(row.quantities)){
   const a=at(actual,path);assert.ok(a&&typeof a.value==='number',family+' quantity '+path);assert.equal(a.sign,e.sign,family+' '+path+' retained sign '+JSON.stringify(row.p));assert.equal(a.belowRange,e.belowRange,family+' '+path+' subnormal-range status');assert.equal(a.aboveRange,e.aboveRange,family+' '+path+' overflow status');stats.comparisons+=3;
   const trajectory=family==='network'&&path==='state',relative=trajectory?2e-10:3e-13;
   if(e.value===0)assert.equal(a.value,e.value,family+' '+path+' correctly rounded signed zero');
   else if(Math.abs(e.value)<2**-1022)assert.ok(Math.abs(a.value-e.value)<=2*Number.MIN_VALUE,family+' '+path+' subnormal ulps');
   else{const error=Math.abs(a.value-e.value)/Math.abs(e.value);if(trajectory)stats.worstTrajectoryRelative=Math.max(stats.worstTrajectoryRelative,error);else stats.worstPhysicalRelative=Math.max(stats.worstPhysicalRelative,error);assert.ok(error<=relative,family+' '+path+' relative '+error+' '+JSON.stringify(row.p));}stats.comparisons++;
   if(e.sign){const error=Math.abs(a.logMagnitude-e.logMagnitude);if(trajectory)stats.worstTrajectoryLogAbsolute=Math.max(stats.worstTrajectoryLogAbsolute,error);else stats.worstAlgebraLogAbsolute=Math.max(stats.worstAlgebraLogAbsolute,error);assert.ok(error<=(trajectory?2e-9:8e-12),family+' '+path+' log magnitude '+error);}else assert.equal(a.logMagnitude,-Infinity,family+' exact-zero log');stats.comparisons++;
  }
  for(const[path,e]of Object.entries(row.meta||{})){assert.deepEqual(at(actual,path),e,family+' '+path+' classification '+JSON.stringify(row.p));stats.comparisons++;}
  for(const[path,e]of Object.entries(row.scalars||{})){assert.ok(Math.abs(at(actual,path)-e)<=3e-13*Math.max(1,Math.abs(e)),family+' '+path+' scalar');stats.comparisons++;}
 }
});
test('MICRO12 reference inventory and reported physical error bounds',()=>{assert.equal(families.length,13);assert.equal(stats.cases,reference.rows.length);console.log('MICRO12 reference result',JSON.stringify(stats));});
test('MICRO12 models reject invalid finite domains and categorical assumptions',()=>{
 for(const[family,p]of[['externality',{quantity:-1}],['externality',{tax:Infinity}],['positiveSpillover',{spillover:-1}],['bargaining',{rights:'unassigned'}],['bargaining',{tie:'silent snap'}],['abatement',{reduction:1.01}],['goodsClass',{rival:1}],['goodsClass',{users:2.5}],['publicProvision',{cost:0}],['voluntary',{players:2.5}],['grazing',{effortFraction:NaN}],['network',{initial:-Number.MIN_VALUE}],['network',{price:-Number.MIN_VALUE}],['pricesQuantities',{costSlope:0}],['lindahl',{report:.5}],['cattle',{transactionCost:-1}],['samuelson',{weight:0}],['samuelson',{mode:'unknown'}]])assert.throws(()=>H[family](p),family);
});
test('MICRO12 bargaining retains exact indifference and both adjacent real-cost outcomes',()=>{
 for(const rights of['produce','quiet'])for(const tie of['agreement','fallback']){const z=H.bargaining({rights,tie,damageSlope:0,transactionCost:rights==='produce'?2:32});assert.equal(z.status,'indifferent agreement');assert.equal(z.accepted,tie==='agreement');assert.equal(z.producerGain.sign,0);assert.equal(z.harmedGain.sign,0);}
 const blocked=H.bargaining({transactionCost:120});assert.equal(blocked.accepted,false);assert.equal(blocked.transactionCostPaid.sign,0);assert.equal(blocked.payment.sign,0);
});
test('MICRO12 complete cattle maximizing sets and explicit smallest-herd tie selection',()=>{
 const all=H.cattle({margin:0,decline:0,damage:0});assert.deepEqual(all.privateMaximizers,[0,1,2,3,4]);assert.deepEqual(all.jointMaximizers,[0,1,2,3,4]);assert.equal(all.quantity.value,0);
 const z=H.cattle();assert.deepEqual(z.jointMaximizers,[2,3]);assert.equal(z.target.value,2);assert.match(z.sourceScope,/not verified/);
});
test('MICRO12 abatement price supports each constrained firm and transfers cancel',()=>{
 const Q=H.Q,eq=(a,b)=>assert.equal(Q.sign(Q.sub(a,b)),0);
 for(const row of reference.rows.filter(r=>r.name==='abatement')){const z=H.abatement(row.p),p=z.parameters;for(const[name,k,E]of[['A',p.slopeA,p.emissionsA],['B',p.slopeB,p.emissionsB]]){const desired=Q.div(z.price.exact,k),capped=Q.sign(Q.sub(desired,E))>0?Q.exact(E):desired;eq(z['abatement'+name].exact,capped);}eq(Q.add(z.paymentA.exact,z.paymentB.exact),0);assert.ok(z.savings.sign>=0);}
 const full=H.abatement({reduction:1});assert.equal(full.priceSupport.unboundedAbove,true);assert.equal(full.priceSupport.maximum,null);assert.equal(H.abatement({reduction:0}).price.value,0);
});
test('MICRO12 public-good accounting does not multiply the physical shared resource',()=>{
 const shared=H.goodsClass({rival:false,excludable:false,users:12,stock:6});assert.equal(shared.physicalUsed.value,6);assert.equal(shared.sumExperiences.value,72);
 const gated=H.goodsClass({rival:false,excludable:true,passes:0});assert.equal(gated.admitted,0);assert.equal(gated.physicalUsed.value,0);assert.equal(gated.unused.value,6);
 assert.equal(H.grazing({effortFraction:0}).averageProduct,null);
});
test('MICRO12 actual network history agrees with the independently solved selected state',()=>{
 const expected=reference.rows.find(r=>r.name==='network'&&!Object.keys(r.p).length).quantities.state.value,trace=H.networkHistory({},201);assert.equal(trace.length,201);assert.equal(trace[0].state.value,.35);assert.ok(Math.abs(trace[80].state.value-expected)<2e-10);for(const r of trace)assert.ok(r.state.sign>0&&r.state.value<=1);
 assert.ok(H.networkHistory({initial:0}).every(r=>r.state.sign===0));assert.equal(H.network({strength:4,price:1,initial:.5,time:20}).stationary,true);assert.match(H.network({strength:4,price:1}).status,/attracts from above and repels from below/);
});
test('MICRO12 uncertainty comparison includes perfect flat-benefit pricing and exact ties',()=>{
 assert.equal(H.pricesQuantities({benefitSlope:0,shock:1,uncertainty:1}).priceLoss.sign,0);assert.equal(H.pricesQuantities({benefitSlope:0}).expectedPriceLoss.sign,0);assert.equal(H.pricesQuantities({benefitSlope:1,costSlope:1}).expectedDifference.sign,0);assert.equal(H.pricesQuantities({uncertainty:0}).expectedDifference.sign,0);
});
test('MICRO12 underreporting records actual utility and changes the correct marginal balance',()=>{
 assert.ok(H.lindahl({report:.9}).reportGainA.sign>0);assert.ok(H.lindahl({benefitA:6,benefitB:6,cost:11.8,report:.85}).reportGainA.sign<0);
 const hold=H.samuelson({report:.5,mode:'hold allocation'}),plan=H.samuelson({report:.5,mode:'plan from reports'});assert.equal(hold.trueMarginalResidual.sign,0);assert.ok(hold.reportedMarginalResidual.sign<0);assert.equal(plan.reportedMarginalResidual.sign,0);assert.ok(plan.trueMarginalResidual.sign>0);assert.ok(plan.provision.value<hold.provision.value);
});
