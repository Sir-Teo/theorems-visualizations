import assert from 'node:assert/strict';
import * as H from '../content/macro/ch06.shared.js';
const names={1:'accounting',2:'exchange',3:'burger',4:'uip',5:'carry',6:'smallOpen',7:'balassa'};
const bindings={'consumption / money per period':'consumption','government purchases / money per period':'government','investment / money per period':'investment','net primary income / money per period':'primaryIncome','net secondary income / money per period':'secondaryIncome','capital account / money per period':'capitalAccount','valuation change / money':'valuation','initial S / domestic per foreign':'spot','initial domestic basket price':'domesticPrice','initial foreign basket price':'foreignPrice','continuous nominal depreciation / year':'nominalGrowth','continuous domestic inflation / year':'domesticInflation','continuous foreign inflation / year':'foreignInflation','chosen years':'time','domestic continuous rate / year':'domesticRate','foreign continuous rate / year':'foreignRate','maturity / years':'time','expected-return log-rate wedge / year':'expectedWedge','terminal relative dispersion':'dispersion','target continuous annual rate':'targetRate','crash terminal spot / initial spot':'crashSpotRatio','annual crash probability':'crashProbability','world real rate / year':'worldRate','extra government purchases / money per period':'fiscalExpansion','net-export log-rate sensitivity':'exportSensitivity','traded output / worker':'tradedProductivity','nontraded output / worker':'nontradedProductivity','traded expenditure share alpha':'tradedShare'};
const physical=x=>Array.isArray(x)?x.map(physical):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).filter(([k])=>k!=='exact'&&k!=='interval').map(([k,v])=>[k,physical(v)])):x;
const n=x=>typeof x==='number'?x:x.value;
const scaled=(x,k)=>n(H.quantity(H.Q.mul(x.exact??H.Q.div(H.Q.add(x.interval.lo,x.interval.hi),2),k)));
const dateX=date=>{const year=Number(date.slice(0,4)),start=Date.UTC(year,0,1);return year+(Date.parse(date+'T00:00:00Z')-start)/(Date.UTC(year+1,0,1)-start);};
export function macroScience(id,q){
 let checks=0;const close=(a,b,label,tolerance=3e-12)=>{assert.ok(Number.isFinite(a)&&Number.isFinite(b),label+' finite');assert.ok(Math.abs(a-b)<=tolerance*Math.max(1,Math.abs(a),Math.abs(b)),label+': '+a+' / '+b);checks++;};
 const sliders=Object.fromEntries(q.state.parts.filter(([k])=>k.startsWith('slider:')).map(([k,v])=>[k.slice(7,k.lastIndexOf(':')),v])),selects=Object.fromEntries(q.state.parts.filter(([k])=>k.startsWith('select:')).map(([k,v])=>[k.slice(7,k.lastIndexOf(':')),v[1][v[0]]])),input={};
 for(const[label,value]of Object.entries(sliders)){assert.ok(bindings[label],'explicit intended control '+label);input[bindings[label]]=value;checks++;}
 if(id===1)input.unreportedFraction=selects['financial recording']==='complete'?0:selects['financial recording']==='omit all'?1:.2;
 if(id===3){input.country=selects['selected country'];input.date=selects['observation date'];}
 if(id===5){input.schedule=selects['authored illustration'];input.crashPeriod=Number(selects['authored crash period']);}
 function model(a,b,label){
  if(b&&typeof b==='object'&&!Array.isArray(b)&&'logMagnitude'in b){
   for(const k of ['sign','belowRange','aboveRange','approximate'])assert.equal(a[k],b[k],label+' strict '+k);
   if(b.value===0)assert.ok(Object.is(a.value,b.value),label+' signed rounded zero');else if(Math.abs(b.value)<2**-1022)assert.ok(Math.abs(a.value-b.value)<=2*Number.MIN_VALUE,label+' subnormal ulps');else assert.ok(Math.abs((a.value-b.value)/b.value)<=3e-13,label+' declared physical gate');
   if(b.logMagnitude===-Infinity)assert.equal(a.logMagnitude,-Infinity,label+' zero log');else assert.ok(Math.abs(a.logMagnitude-b.logMagnitude)<=8e-12,label+' declared log gate');checks+=6;return;
  }
  if(Array.isArray(b)){assert.equal(a.length,b.length,label+' full array');b.forEach((v,i)=>model(a[i],v,label+'.'+i));return;}
  if(b&&typeof b==='object'){assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),label+' complete fields');for(const[k,v]of Object.entries(b))model(a[k],v,label+'.'+k);return;}
  assert.equal(a,b,label);checks++;
 }
 const z=H[names[id]](input),p=z.parameters;assert.equal(q.modelName,names[id]);model(q.model,physical(z),'complete model from independently mapped intended browser state');
 function count(x){if(x&&typeof x==='object'){if('logMagnitude'in x)checks+=5;else for(const v of Object.values(x))count(v);}}count(z);
 const paths=(j,c)=>q.stages[j].paths.filter(r=>r.style.color===c),dots=(j,c)=>q.stages[j].dots.filter(r=>r.style.color===c);
 function trace(j,c,F){const found=paths(j,c);assert.ok(found.length,'actual '+c+' trace at stage '+j);for(const path of found)for(const index of [...new Set([0,Math.floor(path.points.length/4),Math.floor(path.points.length/2),Math.floor(3*path.points.length/4),path.points.length-1])]){const pt=path.points[index],expected=F(pt,index,path.points.length);close(pt[0],expected[0],'trace x');close(pt[1],expected[1],'trace y');}}
 function marker(j,c,x,y){const dot=dots(j,c).at(-1);assert.ok(dot,'actual marker '+j+'/'+c);close(dot.points[0][0],x,'selected x');close(dot.points[0][1],y,'selected y');}
 function ledger(j,rows){const s=q.stages[j],record=s.ledger;assert.ok(record,'actual ledger stage '+j);model(record.rows,physical(rows),'actual labelled ledger values');const scale=Math.max(.0001,...rows.map(r=>Math.abs(n(r[1]))));close(record.scale,scale,'ledger common scale');assert.equal(s.rects.length,rows.length);for(const[index,[label,value,color]]of rows.entries()){const x=.82*n(value)/scale,y=rows.length-index-.6,rect=s.rects[index];close(rect.points[0][0],Math.min(0,x),'signed bar left');close(rect.points[1][0],Math.max(0,x),'signed bar right');close(rect.points[0][1],y-.04,'bar lower');close(rect.points[1][1],y+.07,'bar upper');assert.equal(rect.style.fill,color,label+' actual colour');checks++;}}
 if(id===1){
  ledger(0,[['national saving S',z.saving,'teal'],['domestic investment I',H.quantity(p.investment),'blue'],['current account S − I',z.currentAccount,'purple'],['capital account KA',z.capitalAccount,'orange'],['net financial outflow CA + KA',z.financialAccount,'gold']]);
  const a=q.stages[1].arrows;assert.equal(a.length,2+(z.financialAccount.sign!==0?1:0));assert.ok(a[0].points[1][0]>a[0].points[0][0],'asset-acquisition payment goes abroad');assert.ok(a[1].points[1][0]<a[1].points[0][0],'liability-incurrence payment comes home');if(z.financialAccount.sign)assert.equal(Math.sign(a[2].points[1][0]-a[2].points[0][0]),z.financialAccount.sign);
  const stock=q.stages[2].rects;assert.equal(stock.length,4);const opening=20,after=opening+n(z.financialAccount),closing=n(z.finalNIIP);for(const[i,[a,b]]of [[0,opening],[opening,after],[after,closing],[0,closing]].entries()){close(stock[i].points[0][1],Math.min(a,b),'stock bridge lower');close(stock[i].points[1][1],Math.max(a,b),'stock bridge upper');}
  assert.equal(z.savingIdentityResidual.sign,0);assert.equal(z.bopIdentityResidual.sign,0);checks+=5;
 }
 if(id===2){
  trace(1,'orange',pt=>[pt[0],Math.exp(p.nominalGrowth*pt[0])]);trace(1,'purple',pt=>[pt[0],Math.exp((p.nominalGrowth+p.foreignInflation-p.domesticInflation)*pt[0])]);marker(1,'gold',p.time,n(z.real)/n(z.initialReal));
  ledger(2,[['nominal conversion gS × t',z.logNominalContribution,'orange'],['foreign prices π* × t',z.logForeignPriceContribution,'blue'],['domestic prices −π × t',z.logDomesticPriceContribution,'teal'],['total log(q / q0)',z.logRealChange,'purple']]);
  assert.ok(q.readout.includes(z.direction));if(z.realChange.sign&&z.realChange.value===0)assert.match(q.readout,/outside numeric range/);checks+=2;
 }
 if(id===3){
  const deviation=selects['observed comparison']==='raw price deviations',rects=q.stages[0].rects;assert.equal(rects.length,5);for(const[j,c]of H.BURGER_COUNTRIES.entries()){const r=H.burger({country:c,date:p.date}),y=deviation?scaled(r.rawPriceDeviation,100):n(r.convertedPrice);close(rects[j].points[0][1],Math.min(0,y),'actual observed bar bottom');close(rects[j].points[1][1],Math.max(0,y),'actual observed bar top');}
  const colours=['teal','purple','orange','blue','muted'];for(const[j,c]of H.BURGER_COUNTRIES.entries()){const rows=H.burgerHistory(c),path=paths(1,colours[j]);assert.equal(path.length,1);assert.equal(path[0].points.length,9,'all nine actual observations');for(const[index,r]of rows.entries()){close(path[0].points[index][0],dateX(r.parameters.date),'actual date spacing');close(path[0].points[index][1],scaled(r.rawPriceDeviation,100),'recomputed original-price deviation');}}
  marker(1,'gold',dateX(p.date),scaled(z.rawPriceDeviation,100));assert.match(q.readout,/The Economist/);assert.match(q.readout,/CC BY 4.0/);assert.ok(q.readout.includes(p.date));checks+=3;
 }
 if(id===4){
  assert.equal(q.stages[0].arrows.length,4,'both deposit routes and terminal outcomes');
  ledger(1,[['home certain payoff',z.homePayoff,'teal'],['foreign low-state payoff',z.lowForeignPayoff,'blue'],['foreign expected payoff',z.expectedForeignPayoff,'purple'],['foreign high-state payoff',z.highForeignPayoff,'blue'],['expected foreign minus home',z.expectedPayoffGap,'gold']]);
  ledger(2,[['parity log benchmark (rd − rf)T',z.logParityBenchmark,'teal'],['log of the arithmetic mean ratio',z.logOfMeanDepreciation,'purple'],['expected log spot change',z.expectedLogDepreciation,'blue'],['positive Jensen correction',z.jensenGap,'orange']]);
  assert.ok(q.readout.includes(z.status));if(p.time===0){assert.match(q.readout,/Zero maturity collapses both states/);assert.equal(z.payoffVariance.sign,0);}if(z.expectedPayoffGap.sign&&z.expectedPayoffGap.value===0)assert.match(q.readout,/outside numeric range/);checks+=3;
 }
 if(id===5){
  const fills=q.stages[0].rects.filter(r=>r.style.fillAlpha===.65);assert.equal(fills.length,p.crashProbability>0?2:1);close(fills[0].points[1][0]-fills[0].points[0][0],3.4*(1-p.crashProbability),'normal-outcome probability bar');if(p.crashProbability>0)close(fills[1].points[1][0]-fills[1].points[0][0],3.4*p.crashProbability,'crash-outcome probability bar');
  trace(1,'purple',pt=>[pt[0],(1-pt[0]*(1-p.crashSpotRatio))*Math.exp(p.targetRate)-1]);marker(1,z.expectedGain.sign>0?'green':'red',p.crashProbability,n(z.expectedGain));assert.equal(dots(1,'orange').length,n(z.fairCrashProbability)<=.3?1:0,'break-even marker restricted to offered probability interval');
  const line=paths(2,'blue')[0];assert.equal(line.points.length,21);for(const r of z.illustration){close(line.points[r.period][0],r.period,'authored period');close(line.points[r.period][1],n(r.cumulative),'actual fixed-notional payoff sum');}trace(2,'purple',pt=>[pt[0],pt[0]*n(z.expectedGain)]);marker(2,'gold',20,n(z.finalIllustrativeSum));assert.equal(dots(2,'red').length,p.schedule==='no crash'?0:1);assert.match(q.readout,/neither an observed sample nor compounded wealth/);checks+=3;
 }
 if(id===6){
  assert.equal(q.stages[1].xlog,true,'positive relative price uses explicit logarithmic axis');checks++;
  trace(0,'blue',pt=>[pt[0],40-pt[0]]);marker(0,'blue',n(z.investment),100*p.worldRate);marker(0,'teal',n(z.saving),100*p.worldRate);trace(1,'purple',pt=>[pt[0],p.exportSensitivity*Math.log(pt[0])]);marker(1,'gold',n(z.realExchange),n(z.netExports));
  trace(2,'teal',pt=>[pt[0],50-pt[0]]);trace(2,'blue',pt=>[pt[0],n(z.investment)]);trace(2,'purple',pt=>[pt[0],50-pt[0]-n(z.investment)]);assert.equal(z.investmentChange.sign,0);assert.equal(z.expenditureResidual.sign,0);if(p.fiscalExpansion>0)assert.equal(z.realExchangeChange.sign,-1);checks+=3;
 }
 if(id===7){
  const traded=selects['hypothetical locus']!=='vary nontraded productivity',nontraded=selects['hypothetical locus']!=='vary traded productivity';assert.equal(paths(2,'teal').length,traded?1:0);assert.equal(paths(2,'orange').length,nontraded?1:0);
  if(traded)trace(2,'teal',(pt,index,length)=>{const at=.25+3.75*index/(length-1),price=(at/p.nontradedProductivity)**(1-p.tradedShare);return[at/price,price];});if(nontraded)trace(2,'orange',(pt,index,length)=>{const an=.25+3.75*index/(length-1),price=(p.tradedProductivity/an)**(1-p.tradedShare);return[p.tradedProductivity/price,price];});
  marker(2,'gold',n(z.realIncome),n(z.compositePrice));const rects=q.stages[1].rects;assert.equal(rects.length,2);close(rects[0].points[1][0]-.7,8.6*n(z.wage)/4*p.tradedShare,'traded expenditure width');close(rects[1].points[1][0]-rects[1].points[0][0],8.6*n(z.wage)/4*(1-p.tradedShare),'nontraded expenditure width');assert.equal(z.budgetResidual.sign,0);assert.match(q.readout,/not observed cross-country/);checks+=2;
 }
 return checks;
}
