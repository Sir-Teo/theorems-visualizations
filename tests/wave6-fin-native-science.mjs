// Render consistency against the separately independently verified rational models.
// These comparisons are not counted as new independent arithmetic reference cases.
import assert from 'node:assert/strict';
import * as H from '../content/fin/ch07.shared.js';
const Q=H.Q, names=['','payoff','parity','bounds','earlyCall','strikeConvexity','strategies','densityRecovery','protectivePut','claims'];
const pack=x=>Array.isArray(x)?x.map(pack):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).filter(([k])=>k!=='exact').map(([k,v])=>[k,pack(v)])):x;
const positive=x=>Q.sign(x)>0?x:Q.ZERO, option=(kind,x,k)=>positive(kind==='call'?Q.sub(x,k):Q.sub(k,x)), n=x=>typeof x==='number'?x:x.value;
export function finScience(id,q){
 let checks=0;
 const sliders=Object.fromEntries(q.state.parts.filter(([k])=>k.startsWith('slider:')).map(([k,v])=>[k.slice(7,k.lastIndexOf(':')),v]));
 const selects=Object.fromEntries(q.state.parts.filter(([k])=>k.startsWith('select:')).map(([k,v])=>[k.slice(7,k.lastIndexOf(':')),v[1][v[0]]]));
 const get=label=>{assert.ok(label in sliders,'registered actual slider '+label);checks++;return sliders[label];};
 const choose=label=>{assert.ok(label in selects,'registered actual selector '+label);checks++;return selects[label];};
 const B=get('bond price B / terminal money unit'),p={discount:B};
 if(id===1)Object.assign(p,{kind:choose('option right'),side:choose('position'),convention:choose('profit convention'),strike:get('strike / money per share'),premium:get('premium paid today / money'),terminal:get('terminal stock price / money')});
 if(id===2)Object.assign(p,{spot:get('stock price today / money'),strike:get('common strike / money'),timeValue:get('authored time-value component / money'),callOffset:get('call quote offset / money'),terminal:get('terminal stock price / money')});
 if(id===3)Object.assign(p,{kind:choose('option being quoted'),reference:choose('quote reference bound'),spot:get('stock price today / money'),strike:get('strike / money'),quoteOffset:get('quote offset from reference / money'),terminal:get('terminal stock price / money')});
 if(id===4)Object.assign(p,{spot:get('stock price before dividend / money'),strike:get('call strike / money'),dividendFraction:get('imminent cash dividend / fraction of stock price')});
 if(id===5)Object.assign(p,{mode:get('constructed Q-law mode / terminal money'),strike:get('middle strike / money'),leftWidth:get('left strike spacing / money'),rightWidth:get('right strike spacing / money'),reference:choose('middle quote reference'),quoteOffset:get('middle quote offset / money'),terminal:get('terminal stock price / money')});
 if(id===6)Object.assign(p,{stockUnits:get('stock units'),spot:get('stock price paid today / money'),terminal:get('terminal stock price / money'),legs:[1,2,3].map(i=>({kind:choose('leg '+i+' option right'),strike:get('leg '+i+' strike / money'),units:get('leg '+i+' signed units'),premium:get('leg '+i+' premium paid today / money')}))});
 if(id===7)Object.assign(p,{mode:get('constructed Q-law mode / terminal money'),strike:get('selected strike / money'),bandwidth:get('symmetric strike bandwidth h / money')});
 if(id===8)Object.assign(p,{mode:get('pricing Q-law mode / terminal money'),physicalMode:get('physical-law mode / terminal money'),strike:get('insurance floor K / money'),terminal:get('terminal stock price / money')});
 if(id===9)Object.assign(p,{mode:get('asset pricing Q-law mode / terminal money'),physicalMode:get('physical asset-law mode / terminal money'),face:get('promised maturity debt F / money'),terminalAssets:get('selected terminal assets V / money')});
 function model(a,b,label){
  if(b&&typeof b==='object'&&!Array.isArray(b)&&'logMagnitude'in b){
   for(const key of ['value','sign','belowRange','aboveRange','approximate'])assert.ok(Object.is(a[key],b[key]),label+' strict '+key);
   if(b.logMagnitude===-Infinity)assert.equal(a.logMagnitude,-Infinity,label+' zero log');else assert.ok(Math.abs(a.logMagnitude-b.logMagnitude)<=8e-12,label+' log magnitude');checks+=6;return;
  }
  if(b&&typeof b==='object'){assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),label+' complete fields');for(const[k,v]of Object.entries(b))model(a[k],v,label+'.'+k);return;}
  assert.ok(Object.is(a,b),label+' exact value');checks++;
 }
 const z=H[names[id]](p);assert.equal(q.modelName,names[id]);model(q.model,pack(z),'browser model from separately mapped actual saved controls');
 assert.equal(q.stages.length,id===1?2:3,'complete purpose-built panels');checks++;
 const close=(a,b,label)=>{assert.ok(Number.isFinite(a)&&Number.isFinite(b),label+' finite');assert.ok(Math.abs(a-b)<=2e-12*Math.max(1,Math.abs(a),Math.abs(b)),label+': '+a+' / '+b);checks++;};
 const paths=(j,color)=>q.stages[j].paths.filter(t=>t.style.color===color),dots=(j,color)=>q.stages[j].dots.filter(t=>t.style.color===color);
 function trace(j,color,F,anchors=[]){const curves=paths(j,color);assert.equal(curves.length,1,'one actual '+color+' curve at '+j);const curve=curves[0];for(const[x,y]of curve.points){close(y,n(F(x)),'all actual curve ordinates');}for(const x of anchors){assert.ok(curve.points.some(pt=>Object.is(pt[0],x)),color+' curve retains corner/selected anchor '+x);checks++;}return curve;}
 function marker(j,color,x,y){const dot=dots(j,color).at(-1);assert.ok(dot,'actual '+color+' marker');close(dot.points[0][0],x,'selected x');close(dot.points[0][1],n(y),'selected y');}
 function ledger(j,rows){const s=q.stages[j],record=s.ledger;assert.ok(record,'actual exact quantity ledger');model(record.rows,pack(rows),'actual ledger labels/quantities/colours');let extent=Q.ZERO;for(const[,v]of rows){const mag=v.sign<0?Q.neg(v.exact):v.exact;if(Q.sign(Q.sub(mag,extent))>0)extent=mag;}if(!Q.sign(extent))extent=Q.ONE;model(record.extent,pack(H.quantity(extent)),'exact ledger scale');assert.equal(s.rects.length,rows.length);for(const[i,[label,v,color]]of rows.entries()){const x=Q.approximate(Q.mul(.8,Q.div(v.exact,extent))),y=rows.length-i-.6,r=s.rects[i];close(r.points[0][0],Math.min(0,x),'bar left '+label);close(r.points[1][0],Math.max(0,x),'bar right '+label);close(r.points[0][1],y-.04,'bar bottom');close(r.points[1][1],y+.07,'bar top');assert.equal(r.style.fill,color);checks++;}}
 if(id===1){
  ledger(0,[['option payoff',z.signedPayoff,'blue'],['premium cost today',z.signedPremiumCost,'orange'],['premium in profit convention',z.signedEffectivePremium,'muted'],['profit at chosen stock price',z.profit,'purple']]);
  const direction=p.side==='long'?1:-1,anchors=[p.strike,p.terminal];trace(1,'blue',x=>Q.approximate(Q.mul(direction,option(p.kind,x,p.strike))),anchors);trace(1,'purple',x=>Q.approximate(Q.sub(Q.mul(direction,option(p.kind,x,p.strike)),z.signedEffectivePremium.exact)),anchors);marker(1,'gold',p.terminal,z.profit);
  assert.equal(dots(1,'green').length,z.zeroProfitSet.kind==='single price'&&n(z.zeroProfitSet.lower)<=300?1:0);checks++;
 }
 if(id===2){
  for(const color of ['purple','teal'])trace(1,color,x=>Math.max(x,p.strike),[p.strike,p.terminal]);marker(1,'gold',p.terminal,z.callBondTerminal);
  const total=Math.max(p.terminal,p.strike),rects=q.stages[0].rects;assert.equal(rects.length,4);for(const[i,first]of [p.strike,p.terminal].entries()){close(rects[2*i].points[1][1],.8+3.8*(first/(total||1)),'portfolio component fraction');close(rects[2*i+1].points[1][1],.8+(total?3.8:0),'equal portfolio stack');}
  ledger(2,[['quoted call C',z.quotedCall,'blue'],['strike bond BK',z.strikeBondPrice,'muted'],['put P',z.consistentPut,'orange'],['stock S0',H.quantity(p.spot),'teal'],['C + BK − P − S0',z.parityGap,z.parityGap.sign?'red':'green']]);
 }
 if(id===3){
  const u=z.holdingUnits;trace(1,'purple',x=>Q.approximate(Q.add(Q.add(Q.mul(u.option,option(p.kind,x,p.strike)),Q.mul(u.stock,x)),Q.mul(u.strikeBond,p.strike))),[p.strike,p.terminal]);marker(1,'gold',p.terminal,z.witnessTerminalPayoff);assert.ok(q.readout.includes(z.violation));
  const band=q.stages[0].rects[0],lo=n(z.lowerBound),hi=n(z.upperBound),quote=n(z.quotedPrice),min=Math.min(0,lo,quote),max=Math.max(1,hi,quote),project=x=>.8+8.4*(x-min)/(max-min);close(band.points[0][0],project(lo),'lower price bound');close(band.points[1][0],project(hi),'upper price bound');marker(0,z.violation.startsWith('within')?'gold':'red',project(quote),4.5);
 }
 if(id===4){
  trace(1,'orange',x=>Q.approximate(positive(Q.sub(x,p.strike))),[p.spot]);trace(1,'purple',x=>Q.approximate(positive(Q.sub(Q.sub(x,z.dividend.exact),z.strikeBondPrice.exact))),[p.spot]);marker(1,'gold',p.spot,z.deterministicAmericanValue);
  assert.equal(q.stages[0].arrows.length,2);assert.ok(q.readout.includes(z.deterministicChoice));checks+=2;
  ledger(2,[['exercise value now',z.exercisePayoff,'orange'],['deterministic continuation',z.deterministicContinuation,'purple'],['K − BK: financing benefit',z.strikeFinancingBenefit,'teal'],['imminent cash dividend',z.dividend,'red'],['continuation minus exercise',z.continuationAdvantage,z.continuationAdvantage.sign>=0?'green':'red']]);
 }
 if(id===5){
  const L=H.law(p.mode);trace(0,'blue',x=>Q.approximate(Q.mul(B,L.call(x))),[40,p.mode,160,n(z.lowStrike),p.strike,n(z.highStrike)]);
  const chord=q.stages[0].lines.find(l=>l.style.color==='orange');assert.ok(chord);close(chord.points[0][0],n(z.lowStrike),'chord left strike');close(chord.points[0][1],n(z.leftPrice),'chord left price');close(chord.points[1][0],n(z.highStrike),'chord right strike');close(chord.points[1][1],n(z.rightPrice),'chord right price');
  trace(1,'purple',x=>Q.approximate(Q.sub(Q.add(Q.mul(z.leftWeight.exact,option('call',x,z.lowStrike.exact)),Q.mul(z.rightWeight.exact,option('call',x,z.highStrike.exact))),option('call',x,p.strike))),[n(z.lowStrike),p.strike,n(z.highStrike),p.terminal]);marker(1,'gold',p.terminal,z.butterflyPayoff);
  ledger(2,[['weighted low-strike call',H.quantity(Q.mul(z.leftWeight.exact,z.leftPrice.exact)),'blue'],['weighted high-strike call',H.quantity(Q.mul(z.rightWeight.exact,z.rightPrice.exact)),'teal'],['middle call sold',H.quantity(Q.neg(z.quotedMiddlePrice.exact)),'orange'],['total butterfly cost',z.butterflyCost,'purple'],['strict negative-cost receipt',z.strictNegativeCostReceipt,'green']]);
 }
 if(id===6){
  const anchors=[...p.legs.map(l=>l.strike),p.terminal];for(const[i,l]of p.legs.entries())trace(0,['blue','orange','green'][i],x=>Q.approximate(Q.mul(l.units,option(l.kind,x,l.strike))),anchors);trace(0,'teal',x=>Q.approximate(Q.mul(p.stockUnits,x)),anchors);
  const total=x=>p.legs.reduce((sum,l)=>Q.add(sum,Q.mul(l.units,option(l.kind,x,l.strike))),Q.mul(p.stockUnits,x));trace(1,'purple',x=>Q.approximate(total(x)),anchors);trace(1,'pink',x=>Q.approximate(Q.sub(total(x),z.terminalFinancedCost.exact)),anchors);marker(1,'gold',p.terminal,z.terminalFinancedProfit);
  ledger(2,[['total position cost today',z.totalInitialCost,'orange'],['terminal-financed cost',z.terminalFinancedCost,'muted'],['portfolio payoff',z.totalPayoff,'purple'],['terminal-financed profit',z.terminalFinancedProfit,'pink'],['component-sum residual',z.sumResidual,'green']]);
 }
 if(id===7){
  const L=H.law(p.mode),anchors=[40,p.mode,160,p.strike];trace(0,'blue',x=>Q.approximate(Q.mul(B,L.call(x))),anchors);trace(1,'purple',x=>Q.approximate(L.density(x)),anchors);marker(0,'gold',p.strike,z.callPrice);marker(1,'purple',p.strike,z.density);assert.equal(dots(1,'orange').length,p.bandwidth>0?1:0);if(p.bandwidth>0){marker(1,'orange',p.strike,z.recoveredDensity);const r=q.stages[1].rects[0];close(r.points[0][0],p.strike-p.bandwidth,'actual finite window left');close(r.points[1][0],p.strike+p.bandwidth,'actual finite window right');}
  model(q.stages[2].facts,pack([['implied stock price / money',z.stockPrice,'teal'],['butterfly cost / money',z.butterflyCost,'blue'],['B h² / money²',z.discountedBandwidthSquare,'muted'],['analytic density / money⁻¹',z.density,'purple'],['window recovery / money⁻¹',z.recoveredDensity||'undefined at h=0','orange'],['recovery − density / money⁻¹',z.recoveryError||'undefined at h=0','pink']]),'unit-labelled diagnostic facts');
 }
 if(id===8){
  const anchors=[p.strike,p.terminal];trace(0,'purple',x=>Math.max(x,p.strike),anchors);trace(0,'orange',x=>Q.approximate(option('put',x,p.strike)),anchors);trace(0,'teal',x=>x,anchors);marker(0,'gold',p.terminal,z.protectedPayoff);marker(1,'purple',p.strike,z.physicalFloorAtom);
  const rects=q.stages[1].rects;assert.equal(rects.length,24);for(const[i,bin]of z.bins.entries()){const lo=n(bin.low),hi=n(bin.high),w=hi-lo;for(const[j,a,b,m]of [[0,lo+.06*w,lo+.46*w,bin.plainMass],[1,lo+.54*w,hi-.06*w,bin.insuredContinuousMass]]){const r=rects[2*i+j];close(r.points[0][0],a,'probability bin left');close(r.points[1][0],b,'probability bin right');close(r.points[1][1],n(m),'integrated bin probability');}}
  ledger(2,[['stock cost today',z.stockPrice,'teal'],['put premium today',z.putPremium,'orange'],['total cost today',z.totalInitialCost,'muted'],['terminal-financed cost',z.terminalFinancedCost,'muted'],['guaranteed profit floor',z.floorProfit,'pink']]);assert.equal(z.insuredTotalProbability.value,1);checks++;
 }
 if(id===9){
  const L=H.law(p.mode),P=H.law(p.physicalMode),anchors=[40,p.mode,p.physicalMode,160,p.face];trace(1,'orange',x=>Q.approximate(Q.mul(B,Q.sub(x,L.put(x)))),anchors);trace(1,'blue',x=>Q.approximate(Q.mul(B,L.call(x))),anchors);trace(2,'purple',x=>Q.approximate(L.cdf(x)),anchors);trace(2,'teal',x=>Q.approximate(P.cdf(x)),anchors);marker(1,'orange',p.face,z.debtValue);marker(1,'blue',p.face,z.equityValue);marker(2,'purple',p.face,z.riskNeutralDefault);marker(2,'teal',p.face,z.physicalDefault);
  const r=q.stages[0].rects,u=3.6/Math.max(1,p.terminalAssets,p.face);assert.equal(r.length,z.defaultLoss.sign>0?4:3);close(r[0].points[1][1],.8+p.terminalAssets*u,'total assets height');close(r[1].points[1][1],.8+n(z.debtPayoff)*u,'debt height');close(r[2].points[0][1],.8+n(z.debtPayoff)*u,'equity starts above debt');close(r[2].points[1][1],.8+p.terminalAssets*u,'claims add to assets');if(z.defaultLoss.sign>0)close(r[3].points[1][1],.8+p.face*u,'unpaid promise');assert.equal(z.valueResidual.sign,0);checks++;
 }
 return checks;
}
