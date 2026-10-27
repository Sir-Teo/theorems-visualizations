// Exact original-factor one-period illustrations. B is the explicit price of one
// terminal money unit, so terminal financing costs divide by B without rounding.
import {Q,quantity} from './ch07.law.shared.js';
const {add,sub,mul,div,neg,sign}=Q;
const max=(a,b)=>sign(sub(a,b))>=0?Q.exact(a):Q.exact(b);
const min=(a,b)=>sign(sub(a,b))<=0?Q.exact(a):Q.exact(b);
function bound(x,a,b,label){if(typeof x!=='number'||!Number.isFinite(x)||x<a||x>b)throw Error(label+' outside declared range');return x;}
function choice(x,values,label){if(!values.includes(x))throw Error('unknown '+label);return x;}
const pack=values=>Object.fromEntries(Object.entries(values).map(([k,v])=>[k,quantity(v)]));
const intrinsic=(kind,S,K)=>max(kind==='call'?sub(S,K):sub(K,S),0);
export function payoff({kind='call',side='long',strike=100,premium=8,terminal=120,discount=.95,convention='terminal financed'}={}){
 choice(kind,['call','put'],'option kind');choice(side,['long','short'],'position side');choice(convention,['nominal premium','terminal financed'],'profit convention');bound(strike,0,200,'strike');bound(premium,0,40,'premium');bound(terminal,0,300,'terminal price');bound(discount,.25,1.5,'discount factor');
 const units=side==='long'?1:-1,gross=intrinsic(kind,terminal,strike),effective=convention==='terminal financed'?div(premium,discount):Q.exact(premium),zero=kind==='call'?add(strike,effective):sub(strike,effective);
 let zeroSet;
 if(premium===0)zeroSet=kind==='call'?{kind:'closed interval',lower:quantity(0),upper:quantity(strike)}:{kind:'closed ray',lower:quantity(strike),upper:null};
 else zeroSet=sign(zero)<0?{kind:'empty',lower:null,upper:null}:{kind:'single price',lower:quantity(zero),upper:quantity(zero)};
 return{parameters:{kind,side,strike,premium,terminal,discount,convention},...pack({intrinsic:gross,signedPayoff:mul(units,gross),signedPremiumCost:mul(units,premium),effectivePremium:effective,signedEffectivePremium:mul(units,effective),profit:mul(units,sub(gross,effective)),payoffProfitResidual:sub(sub(mul(units,gross),mul(units,effective)),mul(units,sub(gross,effective)))}),zeroProfitSet:zeroSet};
}
export function parity({spot=100,strike=100,discount=.95,timeValue=10,callOffset=0,terminal=120}={}){
 bound(spot,1,200,'stock price');bound(strike,0,200,'strike');bound(discount,.25,1.5,'discount factor');bound(timeValue,0,40,'authored time value');bound(callOffset,-40,40,'call quote offset');bound(terminal,0,300,'terminal price');
 const bond=mul(discount,strike),C=add(max(sub(spot,bond),0),timeValue),P=add(max(sub(bond,spot),0),timeValue),quote=add(C,callOffset),gap=sub(sub(add(quote,bond),P),spot),direction=sign(gap),call=intrinsic('call',terminal,strike),put=intrinsic('put',terminal,strike),left=add(call,strike),right=add(put,terminal),terminalNet=mul(direction,sub(right,left));
 return{parameters:{spot,strike,discount,timeValue,callOffset,terminal},...pack({strikeBondPrice:bond,consistentCall:C,consistentPut:P,quotedCall:quote,parityGap:gap,callBondTerminal:left,putStockTerminal:right,terminalIdentityResidual:sub(left,right),arbitrageInitialReceipt:mul(direction,gap),arbitrageTerminalPayoff:terminalNet}),trade:direction>0?'sell call and strike bond; buy put and stock':direction<0?'buy call and strike bond; sell put and stock':'no parity discrepancy',holdingUnits:{call:direction===0?0:-direction,strikeBond:direction===0?0:-direction,put:direction,stock:direction}};
}
export function bounds({kind='call',spot=100,strike=100,discount=.95,reference='lower',quoteOffset=-5,terminal=120}={}){
 choice(kind,['call','put'],'option kind');choice(reference,['lower','upper'],'quote reference');bound(spot,1,200,'stock price');bound(strike,0,200,'strike');bound(discount,.25,1.5,'discount factor');bound(quoteOffset,-40,40,'quote offset');bound(terminal,0,300,'terminal price');
 const bond=mul(discount,strike),lower=max(kind==='call'?sub(spot,bond):sub(bond,spot),0),upper=kind==='call'?Q.exact(spot):bond,quote=add(reference==='lower'?lower:upper,quoteOffset),lowGap=sub(quote,lower),highGap=sub(quote,upper),payoff=intrinsic(kind,terminal,strike);let trade='inside these price bounds',receipt=Q.ZERO,future=Q.ZERO,units={option:0,stock:0,strikeBond:0};
 if(sign(lowGap)<0){
  receipt=neg(lowGap);
  if(!sign(lower)){trade='buy the negative-price option';future=payoff;units.option=1;}
  else if(kind==='call'){trade='buy call and strike bond; sell stock';future=sub(add(payoff,strike),terminal);units={option:1,stock:-1,strikeBond:1};}
  else{trade='buy put and stock; sell strike bond';future=sub(add(payoff,terminal),strike);units={option:1,stock:1,strikeBond:-1};}
 }else if(sign(highGap)>0){
  receipt=highGap;
  if(kind==='call'){trade='buy stock; sell call';future=sub(terminal,payoff);units={option:-1,stock:1,strikeBond:0};}
  else{trade='buy strike bond; sell put';future=sub(strike,payoff);units={option:-1,stock:0,strikeBond:1};}
 }
 return{parameters:{kind,spot,strike,discount,reference,quoteOffset,terminal},...pack({strikeBondPrice:bond,lowerBound:lower,upperBound:upper,quotedPrice:quote,gapAboveLower:lowGap,gapAboveUpper:highGap,witnessInitialReceipt:receipt,witnessTerminalPayoff:future}),violation:sign(lowGap)<0?'below lower bound':sign(highGap)>0?'above upper bound':'within these bounds',trade,holdingUnits:units};
}
export function earlyCall({spot=100,strike=80,discount=.95,dividendFraction=0}={}){
 bound(spot,1,200,'stock price');bound(strike,0,200,'strike');bound(discount,.25,1.5,'discount factor');bound(dividendFraction,0,1,'imminent cash dividend fraction');
 const dividend=mul(spot,dividendFraction),bond=mul(discount,strike),exercise=max(sub(spot,strike),0),noDividendBound=max(sub(spot,bond),0),continuation=max(sub(sub(spot,dividend),bond),0),chosen=max(exercise,continuation),gap=sub(continuation,exercise),postponement=sub(noDividendBound,exercise);
 return{parameters:{spot,strike,discount,dividendFraction},...pack({dividend,strikeBondPrice:bond,exercisePayoff:exercise,noDividendLowerBound:noDividendBound,noDividendBoundAdvantage:postponement,strikeFinancingBenefit:mul(strike,sub(1,discount)),deterministicContinuation:continuation,deterministicAmericanValue:chosen,continuationAdvantage:gap}),noDividendNonnegativeRateAssumptions:dividendFraction===0&&discount<=1,deterministicChoice:sign(gap)>0?'continue':sign(gap)<0?'exercise now':'tie',scope:'Deterministic imminent-dividend counterexample is a separately declared economy, not a general stochastic exercise boundary. B is the supplied positive discount factor for one fixed remaining period; B<=1 corresponds to nonnegative rates.'};
}
