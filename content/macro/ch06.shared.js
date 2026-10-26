// MACRO6: original-factor accounting and explicitly declared teaching economies.
// Transcendentals use rational enclosures; they remain numerical, not exact real values.
import * as Q from './ch06.exact.shared.js';
import {BIG_MAC} from './ch06.data.shared.js';
export {Q,BIG_MAC};
const {add,sub,mul,div,neg,sign,approximate:N}=Q;
const sq=x=>mul(x,x),min=(a,b)=>sign(sub(a,b))<=0?Q.exact(a):Q.exact(b),max=(a,b)=>sign(sub(a,b))>=0?Q.exact(a):Q.exact(b);
const constant=x=>({lo:Q.exact(x),hi:Q.exact(x)});
const iadd=(a,b)=>({lo:add(a.lo,b.lo),hi:add(a.hi,b.hi)}),ineg=a=>({lo:neg(a.hi),hi:neg(a.lo)}),isub=(a,b)=>iadd(a,ineg(b));
const imul=(a,b)=>{const xs=[mul(a.lo,b.lo),mul(a.lo,b.hi),mul(a.hi,b.lo),mul(a.hi,b.hi)];return{lo:xs.reduce(min),hi:xs.reduce(max)};};
const idiv=(a,b)=>{if(sign(b.lo)<=0&&sign(b.hi)>=0)throw Error('interval denominator contains zero');return imul(a,{lo:div(1,b.hi),hi:div(1,b.lo)});};
const scale=(a,b)=>imul(a,constant(b));
// Outward dyadic rounding limits intermediate integer size while preserving enclosures.
// Relative precision retains a subnormal argument instead of rounding1+x back to1.
function dyadic(x,up,bits){x=Q.exact(x);const s=sign(x);if(!s)return x;if(s<0)return neg(dyadic(neg(x),!up,bits));let e=x.n.toString(2).length-x.d.toString(2).length;if(e>=0?x.n<(x.d<<BigInt(e)):(x.n<<BigInt(-e))<x.d)e--;const shift=bits-1-e,n=shift>=0?x.n<<BigInt(shift):x.n,d=shift>=0?x.d:x.d<<BigInt(-shift);let k=n/d;if(up&&n%d)k++;return shift>=0?Q.rational(k,1n<<BigInt(shift)):Q.rational(k<<BigInt(-shift));}
const roundI=(a,bits=192)=>({lo:dyadic(a.lo,false,bits),hi:dyadic(a.hi,true,bits)});
function bound(x,a,b,label){if(typeof x!=='number'||!Number.isFinite(x)||x<a||x>b)throw Error(label+' outside declared range');return x;}
const cache=new Map();
function cached(key,make){if(cache.has(key))return cache.get(key);const result=make();if(cache.size>=256)cache.delete(cache.keys().next().value);cache.set(key,result);return result;}
// Positive-term series plus a geometric upper tail, then reciprocal for x<0.
function expQ(x,bits=160){x=Q.exact(x);return cached('e/'+bits+'/'+Q.exactText(x),()=>{
 if(!sign(x))return constant(1);if(sign(x)<0){const z=expQ(neg(x),bits);return{lo:div(1,z.hi),hi:div(1,z.lo)};}
 if(sign(sub(x,20))>0)throw Error('chapter exponential argument exceeds20');
 const tolerance=Q.rational(1n,1n<<BigInt(bits));let total=constant(1),term=constant(1);
 for(let n=1;n<=1000;n++){
  term=roundI(scale(term,div(x,n)),bits+32);total=iadd(total,term);const ratio=div(x,n+2);
  if(sign(sub(ratio,1))>=0)continue;
  const next=div(mul(term.hi,x),n+1),tail=div(next,sub(1,ratio));
  if(sign(sub(tail,mul(tolerance,total.lo)))<=0)return{lo:total.lo,hi:add(total.hi,tail)};
 }
 throw Error('exponential enclosure did not converge');
});}
const expI=x=>{x=roundI(x);return{lo:expQ(x.lo).lo,hi:expQ(x.hi).hi};};
const expm1Q=(x,bits=160)=>isub(expQ(x,bits),constant(1));
function logUnit(x,bits=160){const z=div(sub(x,1),add(x,1));if(!sign(z))return constant(0);const z2=sq(z),tolerance=Q.rational(1n,1n<<BigInt(bits));let power=roundI(constant(z),bits+32),total=power;
 for(let k=0;k<1000;k++){
  const nextPower=roundI(scale(power,z2),bits+32),next=scale(nextPower,div(1,2*k+3)),tail=div(next.hi,sub(1,z2));
  if(sign(sub(tail,mul(tolerance,total.lo)))<=0)return{lo:mul(2,total.lo),hi:mul(2,add(total.hi,tail))};
  power=nextPower;total=iadd(total,next);
 }
 throw Error('logarithm enclosure did not converge');
}
function logQ(x){x=Q.exact(x);if(sign(x)<=0)throw Error('positive logarithm argument required');return cached('l/'+Q.exactText(x),()=>{
 const position=sign(sub(x,1));if(!position)return constant(0);if(position<0)return ineg(logQ(div(1,x)));
 let exponent=x.n.toString(2).length-x.d.toString(2).length;
 if(sign(sub(x,Q.rational(1n<<BigInt(exponent))))<0)exponent--;
 const mantissa=div(x,Q.rational(1n<<BigInt(exponent)));
 return iadd(logUnit(mantissa),scale(logUnit(2),exponent));
});}
export function quantity(x){x=Q.exact(x);const value=N(x),s=sign(x);return{exact:x,value,sign:s,logMagnitude:Q.logAbs(x),belowRange:s!==0&&value===0,aboveRange:!Number.isFinite(value),approximate:false};}
function numerical(interval){if(!sign(sub(interval.hi,interval.lo)))return quantity(interval.lo);const middle=div(add(interval.lo,interval.hi),2),value=N(middle),lo=sign(interval.lo),hi=sign(interval.hi),s=lo>0?1:hi<0?-1:null;return{exact:null,interval,value,sign:s,logMagnitude:Q.logAbs(middle),belowRange:s!==null&&s!==0&&value===0,aboveRange:!Number.isFinite(value),approximate:true};}
const q=quantity,num=numerical;
export function decimal(text){const match=String(text).match(/^([+-]?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/);if(!match)throw Error('invalid finite decimal');const digits=BigInt(match[2]+(match[3]||''))*(match[1]==='-'?-1n:1n),power=Number(match[4]||0)-(match[3]||'').length;return power>=0?Q.rational(digits*10n**BigInt(power)):Q.rational(digits,10n**BigInt(-power));}

export function accounting({output=200,consumption=110,government=35,investment=40,primaryIncome=-10,secondaryIncome=5,capitalAccount=0,unreportedFraction=0,valuation=0}={}){
 bound(output,150,300,'GDP');bound(consumption,50,140,'consumption');bound(government,10,60,'government purchases');bound(investment,10,70,'investment');bound(primaryIncome,-30,30,'net primary income');bound(secondaryIncome,-20,20,'net secondary income');bound(capitalAccount,-10,10,'capital account');bound(unreportedFraction,0,1,'omitted financial fraction');bound(valuation,-30,30,'valuation change');
 const nx=sub(sub(sub(output,consumption),government),investment),gndi=add(add(output,primaryIncome),secondaryIncome),saving=sub(sub(gndi,consumption),government),ca=add(add(nx,primaryIncome),secondaryIncome),fa=add(ca,capitalAccount),assets=add(40,max(fa,0)),liabilities=add(40,max(neg(fa),0)),reported=mul(sub(1,unreportedFraction),fa),residual=sub(add(ca,capitalAccount),reported),niip=add(add(20,fa),valuation);
 return{parameters:{output,consumption,government,investment,primaryIncome,secondaryIncome,capitalAccount,unreportedFraction,valuation},netExports:q(nx),grossNationalDisposableIncome:q(gndi),saving:q(saving),currentAccount:q(ca),capitalAccount:q(capitalAccount),financialAccount:q(fa),assetsAcquired:q(assets),liabilitiesIncurred:q(liabilities),reportedFinancialAccount:q(reported),recordingResidual:q(residual),reconcilingEntry:q(neg(residual)),savingIdentityResidual:q(sub(sub(saving,investment),ca)),bopIdentityResidual:q(sub(add(ca,capitalAccount),fa)),initialNIIP:q(20),valuation:q(valuation),finalNIIP:q(niip),niipChange:q(sub(niip,20)),direction:sign(fa)>0?'net financial outflow':sign(fa)<0?'net financial inflow':'zero net financial flow'};
}

export function exchange({spot=1.2,domesticPrice=120,foreignPrice=100,nominalGrowth=0,domesticInflation=.03,foreignInflation=.01,time=10}={}){
 bound(spot,.1,10,'domestic currency per foreign unit');bound(domesticPrice,1,1000,'domestic basket price');bound(foreignPrice,1,1000,'foreign basket price');for(const[label,x]of Object.entries({nominalGrowth,domesticInflation,foreignInflation}))bound(x,-.1,.1,label);bound(time,0,20,'chosen years');
 const initialReal=div(mul(spot,foreignPrice),domesticPrice),logChange=mul(add(nominalGrowth,sub(foreignInflation,domesticInflation)),time),nominal=scale(expQ(mul(nominalGrowth,time)),spot),domestic=scale(expQ(mul(domesticInflation,time)),domesticPrice),foreign=scale(expQ(mul(foreignInflation,time)),foreignPrice),real=scale(expQ(logChange),initialReal),change=scale(expm1Q(logChange),initialReal),converted=scale(expQ(mul(add(nominalGrowth,foreignInflation),time)),mul(spot,foreignPrice));
 return{parameters:{spot,domesticPrice,foreignPrice,nominalGrowth,domesticInflation,foreignInflation,time},initialNominal:q(spot),initialReal:q(initialReal),initialConvertedForeign:q(mul(spot,foreignPrice)),nominal:num(nominal),domesticPrice:num(domestic),foreignPrice:num(foreign),convertedForeign:num(converted),real:num(real),realChange:num(change),logRealChange:q(logChange),logNominalContribution:q(mul(nominalGrowth,time)),logForeignPriceContribution:q(mul(foreignInflation,time)),logDomesticPriceContribution:q(neg(mul(domesticInflation,time))),direction:sign(logChange)<0?'domestic real appreciation':sign(logChange)>0?'domestic real depreciation':'unchanged real exchange rate'};
}

export const BURGER_COUNTRIES=['AUS','CHE','GBR','JPN','USA'];
export const BURGER_DATES=[...new Set(BIG_MAC.map(r=>r.date))];
export function burger({country='JPN',date=BURGER_DATES.at(-1)}={}){
 const r=BIG_MAC.find(r=>r.iso_a3===country&&r.date===date),us=BIG_MAC.find(r=>r.iso_a3==='USA'&&r.date===date);if(!r||!us)throw Error('country/date outside the fixed complete price cohort');
 const local=decimal(r.local_price),spot=decimal(r.dollar_ex),usPrice=decimal(us.local_price),dollars=div(local,spot),ratio=div(dollars,usPrice),deviation=sub(ratio,1),real=div(mul(spot,usPrice),local),parity=div(local,usPrice),published=decimal(r.USD_raw);
 return{parameters:{country,date},source:r,usSource:us,localPrice:q(local),marketSpot:q(spot),usPrice:q(usPrice),convertedPrice:q(dollars),sourceConvertedPrice:q(decimal(r.dollar_price)),priceRatio:q(ratio),rawPriceDeviation:q(deviation),publishedRawIndex:q(published),publishedRoundingDifference:q(sub(deviation,published)),burgerRealExchange:q(real),paritySpot:q(parity),direction:sign(deviation)>0?'higher dollar burger price':sign(deviation)<0?'lower dollar burger price':'same dollar burger price'};
}
export const burgerHistory=country=>BURGER_DATES.map(date=>burger({country,date}));

export function uip({spot=1.2,domesticRate=.04,foreignRate=.02,time=1,expectedWedge=0,dispersion=.2}={}){
 bound(spot,.1,10,'spot');bound(domesticRate,-.1,.1,'domestic continuous rate');bound(foreignRate,-.1,.1,'foreign continuous rate');bound(time,0,20,'maturity');bound(expectedWedge,-.05,.05,'expected-return log-rate wedge');bound(dispersion,0,.8,'two-state relative dispersion');
 const terminalDispersion=time===0?0:dispersion;
 const home=expQ(mul(domesticRate,time)),requiredLog=mul(sub(domesticRate,foreignRate),time),wedgeLog=mul(expectedWedge,time),required=scale(expQ(requiredLog),spot),mean=scale(expQ(add(requiredLog,wedgeLog)),spot),gap=imul(home,expm1Q(wedgeLog)),expected=iadd(home,gap),risk=scale(expected,terminalDispersion),variance=scale(imul(expected,expected),sq(terminalDispersion)),jensen=scale(ineg(logQ(sub(1,sq(terminalDispersion)))),.5),expectedLog=isub(constant(add(requiredLog,wedgeLog)),jensen);
 return{parameters:{spot,domesticRate,foreignRate,time,expectedWedge,dispersion},homePayoff:num(home),requiredMeanSpot:num(required),meanSpot:num(mean),meanSpotDiscrepancy:num(imul(required,expm1Q(wedgeLog))),expectedForeignPayoff:num(expected),expectedPayoffGap:num(gap),lowForeignPayoff:num(isub(expected,risk)),highForeignPayoff:num(iadd(expected,risk)),lowExcessPayoff:num(isub(gap,risk)),highExcessPayoff:num(iadd(gap,risk)),payoffStandardDeviation:num(risk),payoffVariance:num(variance),jensenGap:num(jensen),expectedLogDepreciation:num(expectedLog),logOfMeanDepreciation:q(add(requiredLog,wedgeLog)),logParityBenchmark:q(requiredLog),parity:sign(wedgeLog)===0,status:sign(wedgeLog)===0?'equal expected domestic payoffs':sign(wedgeLog)>0?'foreign expected payoff exceeds home':'foreign expected payoff below home'};
}

export function carry({targetRate=.025,crashSpotRatio=.65,crashProbability=.05,crashPeriod=12,schedule='one authored crash'}={}){
 bound(targetRate,.005,.04,'target continuous annual rate');bound(crashSpotRatio,.1,.9,'crash spot ratio');bound(crashProbability,0,.3,'annual crash probability');bound(crashPeriod,1,20,'crash period');if(!Number.isInteger(crashPeriod))throw Error('integer crash period required');if(!['one authored crash','no crash'].includes(schedule))throw Error('unknown illustrative schedule');
 const coefficient=sub(1,mul(crashProbability,sub(1,crashSpotRatio))),growth=expQ(targetRate),success=expm1Q(targetRate),crash=isub(scale(growth,crashSpotRatio),constant(1));let mean;
 for(const bits of[160,320,640,1280]){mean=isub(scale(expQ(targetRate,bits),coefficient),constant(1));if(sign(mean.lo)>0||sign(mean.hi)<0)break;}
 const expected=num(mean);if(expected.sign===null)throw Error('expected-gain sign unresolved after refinement');
 const fair=idiv(ineg(expm1Q(neg(targetRate))),constant(sub(1,crashSpotRatio))),variance=scale(expQ(mul(2,targetRate)),mul(mul(crashProbability,sub(1,crashProbability)),sq(sub(1,crashSpotRatio))));
 let cumulative=constant(0);const illustration=Array.from({length:20},(_,j)=>{const isCrash=schedule==='one authored crash'&&j+1===crashPeriod,payoff=isCrash?crash:success;cumulative=iadd(cumulative,payoff);return{period:j+1,isCrash,payoff:num(payoff),cumulative:num(cumulative)};});
 return{parameters:{targetRate,crashSpotRatio,crashProbability,crashPeriod,schedule},normalGain:num(success),crashGain:num(crash),expectedGain:expected,fairCrashProbability:num(fair),variance:num(variance),twentyPeriodExpectedSum:num(scale(mean,20)),illustration,finalIllustrativeSum:illustration.at(-1).cumulative,status:expected.sign>0?'positive expected payoff in this model':'negative expected payoff in this model'};
}

export function smallOpen({worldRate=.04,fiscalExpansion=10,exportSensitivity=20}={}){
 bound(worldRate,0,.1,'world real rate');bound(fiscalExpansion,0,40,'additional government purchases');bound(exportSensitivity,10,50,'net-export sensitivity');
 const investment=sub(40,mul(100,worldRate)),baselineSaving=Q.exact(50),saving=sub(50,fiscalExpansion),baselineNX=sub(baselineSaving,investment),nx=sub(saving,investment),baselineLog=div(baselineNX,exportSensitivity),logReal=div(nx,exportSensitivity),changeLog=neg(div(fiscalExpansion,exportSensitivity)),baselineReal=expQ(baselineLog),real=expQ(logReal),change=imul(baselineReal,expm1Q(changeLog));
 return{parameters:{worldRate,fiscalExpansion,exportSensitivity},investment:q(investment),baselineSaving:q(baselineSaving),saving:q(saving),baselineNetExports:q(baselineNX),netExports:q(nx),netExportChange:q(neg(fiscalExpansion)),investmentChange:q(0),baselineRealExchange:num(baselineReal),realExchange:num(real),realExchangeChange:num(change),logRealExchange:q(logReal),logRealExchangeChange:q(changeLog),investmentSavingResidual:q(sub(sub(saving,investment),nx)),output:q(200),consumption:q(120),government:q(add(30,fiscalExpansion)),expenditureResidual:q(sub(200,add(add(120,add(30,fiscalExpansion)),add(investment,nx)))),direction:sign(changeLog)<0?'domestic real appreciation':'unchanged real exchange rate'};
}

export function balassa({tradedProductivity=2,nontradedProductivity=1,tradedShare=.5}={}){
 bound(tradedProductivity,.25,4,'traded labour productivity');bound(nontradedProductivity,.25,4,'nontraded labour productivity');bound(tradedShare,.1,.9,'traded expenditure share');
 const nontradedPrice=div(tradedProductivity,nontradedProductivity),otherShare=sub(1,tradedShare),logPrice=scale(logQ(nontradedPrice),otherShare),price=expI(logPrice),real=idiv(constant(1),price),income=idiv(constant(tradedProductivity),price),tradedOutput=mul(tradedShare,tradedProductivity),nontradedOutput=mul(otherShare,nontradedProductivity),nontradedValue=mul(nontradedPrice,nontradedOutput);
 return{parameters:{tradedProductivity,nontradedProductivity,tradedShare},tradedPrice:q(1),wage:q(tradedProductivity),nontradedPrice:q(nontradedPrice),compositePrice:num(price),realExchange:num(real),realIncome:num(income),logCompositePrice:num(logPrice),tradedLabour:q(tradedShare),nontradedLabour:q(otherShare),tradedOutput:q(tradedOutput),nontradedOutput:q(nontradedOutput),tradedOutputValue:q(tradedOutput),nontradedOutputValue:q(nontradedValue),budgetResidual:q(sub(tradedProductivity,add(tradedOutput,nontradedValue))),priceElasticityToTraded:q(otherShare),incomeElasticityToTraded:q(tradedShare),priceElasticityToNontraded:q(neg(otherShare)),incomeElasticityToNontraded:q(otherShare),realExchangeElasticityToTraded:q(neg(otherShare)),direction:sign(sub(nontradedPrice,1))>0?'higher domestic composite price than foreign':sign(sub(nontradedPrice,1))<0?'lower domestic composite price than foreign':'same composite price as foreign'};
}
