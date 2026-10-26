import test from 'node:test';
import {after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as H from '../content/macro/ch06.shared.js';
const reference=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-macro-reference.json',import.meta.url))),priceSource=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-macro-price-source.json',import.meta.url)));
const statistics={cases:0,comparisons:0,worstPhysicalRelative:0,worstLogAbsolute:0};
function compare(actual,expected,label){
 if(expected&&typeof expected==='object'&&!Array.isArray(expected)&&'logMagnitude'in expected&&'belowRange'in expected){
  assert.equal(actual.sign,expected.sign,label+' physical sign');assert.equal(actual.belowRange,expected.belowRange,label+' below range');assert.equal(actual.aboveRange,expected.aboveRange,label+' above range');assert.ok(Number.isFinite(actual.value),label+' finite displayed value');
  if(expected.value===0)assert.ok(Object.is(actual.value,expected.value),label+' signed rounded zero');
  else if(Math.abs(expected.value)<2**-1022)assert.ok(Math.abs(actual.value-expected.value)<=2*Number.MIN_VALUE,label+' two-subnormal-ulp bound');
  else{const error=Math.abs((actual.value-expected.value)/expected.value);statistics.worstPhysicalRelative=Math.max(statistics.worstPhysicalRelative,error);assert.ok(error<=3e-13,label+' independent physical relative error '+error);}
  if(expected.logMagnitude===null)assert.equal(actual.logMagnitude,-Infinity,label+' exact zero log');else{const error=Math.abs(actual.logMagnitude-expected.logMagnitude);statistics.worstLogAbsolute=Math.max(statistics.worstLogAbsolute,error);assert.ok(error<=8e-12,label+' log absolute error '+error);}
  if(actual.interval)assert.ok(H.Q.sign(H.Q.sub(actual.interval.hi,actual.interval.lo))>=0,label+' ordered retained enclosure');statistics.comparisons+=5;return;
 }
 if(Array.isArray(expected)){assert.equal(actual.length,expected.length,label+' complete array');expected.forEach((x,i)=>compare(actual[i],x,label+'.'+i));return;}
 if(expected&&typeof expected==='object'){assert.ok(actual&&typeof actual==='object',label+' complete object');assert.deepEqual(Object.keys(actual).sort(),Object.keys(expected).sort(),label+' complete physical fields');for(const[k,v]of Object.entries(expected))compare(actual[k],v,label+'.'+k);return;}
 assert.equal(actual,expected,label);statistics.comparisons++;
}
for(const family of ['accounting','exchange','burger','uip','carry','smallOpen','balassa'])test('MACRO6 independent complete '+family+' cases',()=>{for(const row of reference.rows.filter(r=>r.name===family)){compare(H[family](row.parameters),row.expected,family+' '+row.label);statistics.cases++;}});
test('MACRO6 fixed attributed price sample retains all45 original records and same-date dollar benchmark',()=>{
 assert.deepEqual(H.BIG_MAC,priceSource);assert.equal(priceSource.length,45);assert.equal(H.BURGER_DATES.length,9);assert.equal(H.BURGER_COUNTRIES.length,5);
 const keys=priceSource.map(r=>r.date+'/'+r.iso_a3);assert.equal(new Set(keys).size,45);
 for(const r of priceSource){assert.ok(!('GDP_bigmac'in r));const z=H.burger({country:r.iso_a3,date:r.date});assert.equal(H.Q.sign(H.Q.sub(H.Q.mul(z.priceRatio.exact,z.burgerRealExchange.exact),1)),0);assert.ok(Math.abs(z.publishedRoundingDifference.value)<=.000005);assert.ok(z.localPrice.sign>0&&z.marketSpot.sign>0&&z.usPrice.sign>0);}
});
test('MACRO6 original-factor accounts separate the identity, omitted recording and valuation',()=>{
 for(const input of [{},{primaryIncome:Number.MIN_VALUE,secondaryIncome:0,consumption:125,government:35,investment:40},{capitalAccount:10,unreportedFraction:.4,valuation:20},{unreportedFraction:1,valuation:-30}]){
  const z=H.accounting(input);assert.equal(z.savingIdentityResidual.sign,0);assert.equal(z.bopIdentityResidual.sign,0);assert.equal(H.Q.sign(H.Q.sub(H.Q.sub(z.assetsAcquired.exact,z.liabilitiesIncurred.exact),z.financialAccount.exact)),0);assert.equal(H.Q.sign(H.Q.sub(H.Q.sub(z.niipChange.exact,z.financialAccount.exact),z.valuation.exact)),0);
 }
 const z=H.accounting({primaryIncome:Number.MIN_VALUE,secondaryIncome:0,consumption:125,government:35,investment:40,unreportedFraction:.5});assert.equal(z.currentAccount.sign,1);assert.equal(z.recordingResidual.sign,1);assert.equal(z.recordingResidual.belowRange,true);
});
test('MACRO6 real appreciation and tiny changes use the full quote and original growth factors',()=>{
 const tiny=H.exchange({time:Number.MIN_VALUE,domesticInflation:Number.MIN_VALUE,foreignInflation:0});assert.equal(tiny.realChange.sign,-1);assert.equal(tiny.realChange.belowRange,true);assert.ok(Object.is(tiny.realChange.value,-0));assert.equal(tiny.real.value,tiny.initialReal.value);
 assert.equal(H.exchange({domesticInflation:.03,foreignInflation:.03}).logRealChange.sign,0);assert.equal(H.exchange({time:0}).realChange.sign,0);
});
test('MACRO6 equal expected uncovered returns retain actual two-state currency risk and Jensen correction',()=>{
 const z=H.uip();assert.equal(z.parity,true);assert.equal(z.expectedPayoffGap.sign,0);assert.ok(z.lowExcessPayoff.sign<0&&z.highExcessPayoff.sign>0&&z.payoffVariance.sign>0&&z.jensenGap.sign>0);
 const tiny=H.uip({time:Number.MIN_VALUE,expectedWedge:Number.MIN_VALUE});assert.equal(tiny.expectedPayoffGap.sign,1);assert.equal(tiny.expectedPayoffGap.belowRange,true);assert.equal(tiny.parity,false);
 const j=H.uip({domesticRate:0,foreignRate:0,dispersion:Number.MIN_VALUE});assert.equal(j.jensenGap.sign,1);assert.equal(j.expectedLogDepreciation.sign,-1);assert.equal(j.jensenGap.belowRange,true);
 const deterministic=H.uip({dispersion:0});assert.equal(deterministic.jensenGap.sign,0);assert.equal(deterministic.payoffVariance.sign,0);
});
test('MACRO6 a chosen profitable carry path does not establish positive expected payoff',()=>{
 const z=H.carry({crashProbability:.1});assert.ok(z.finalIllustrativeSum.sign>0&&z.expectedGain.sign<0);assert.equal(z.illustration.filter(r=>r.isCrash).length,1);assert.equal(H.carry({schedule:'no crash'}).illustration.filter(r=>r.isCrash).length,0);
 assert.ok(H.carry({crashProbability:0}).expectedGain.sign>0);assert.equal(H.carry({crashProbability:0}).variance.sign,0);
});
test('MACRO6 fiscal crowding of net exports is conditional on fixed world rate and chosen closure',()=>{
 for(const fiscalExpansion of [0,10,14,40,Number.MIN_VALUE]){const z=H.smallOpen({fiscalExpansion});assert.equal(z.investmentChange.sign,0);assert.equal(z.investmentSavingResidual.sign,0);assert.equal(z.expenditureResidual.sign,0);assert.equal(H.Q.sign(H.Q.add(z.netExportChange.exact,fiscalExpansion)),0);if(fiscalExpansion>0)assert.equal(z.realExchangeChange.sign,-1);}
 assert.equal(H.smallOpen({fiscalExpansion:Number.MIN_VALUE}).realExchangeChange.belowRange,true);
});
test('MACRO6 sector productivity channels distinguish conditional price-income directions',()=>{
 const baseline=H.balassa({tradedProductivity:1,nontradedProductivity:1}),traded=H.balassa({tradedProductivity:2,nontradedProductivity:1}),nontraded=H.balassa({tradedProductivity:1,nontradedProductivity:2});
 assert.ok(traded.compositePrice.value>baseline.compositePrice.value&&traded.realIncome.value>baseline.realIncome.value&&traded.realExchange.value<baseline.realExchange.value);
 assert.ok(nontraded.compositePrice.value<baseline.compositePrice.value&&nontraded.realIncome.value>baseline.realIncome.value&&nontraded.realExchange.value>baseline.realExchange.value);
 for(const z of [baseline,traded,nontraded])assert.equal(z.budgetResidual.sign,0);
});
test('MACRO6 declared domains reject invalid economic states and undeclared source cohorts',()=>{
 for(const run of [()=>H.accounting({consumption:NaN}),()=>H.accounting({unreportedFraction:1.1}),()=>H.exchange({spot:0}),()=>H.exchange({time:-1}),()=>H.exchange({domesticPrice:0}),()=>H.burger({country:'ZZZ'}),()=>H.burger({date:'2020-01-01'}),()=>H.uip({dispersion:1}),()=>H.uip({foreignRate:Infinity}),()=>H.carry({crashPeriod:1.5}),()=>H.carry({crashProbability:.4}),()=>H.carry({schedule:'random sample'}),()=>H.smallOpen({exportSensitivity:0}),()=>H.balassa({tradedProductivity:0}),()=>H.balassa({tradedShare:1})])assert.throws(run);
});
after(()=>console.log('MACRO6 reference statistics '+JSON.stringify(statistics)));
