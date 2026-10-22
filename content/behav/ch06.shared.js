// Declared games and preference models. Experimental observations live in separate source-backed data.
const integer=(x,name,min=0,max=1000000)=>{if(!Number.isSafeInteger(x)||x<min||x>max)throw Error(`${name} must be an integer from ${min} to ${max}.`);return BigInt(x);};
export function integerList(text,minLength,maxLength,min,max){
 if(typeof text!=='string'||text.length>240)throw Error('Use at most 240 characters for the integer list.');
 const parts=text.split(',').map(s=>s.trim());if(parts.length<minLength||parts.length>maxLength||parts.some(s=>!/^\d+$/.test(s)))throw Error(`Use ${minLength}–${maxLength} comma-separated nonnegative integers.`);
 const values=parts.map(Number);values.forEach(x=>integer(x,'list entry',min,max));return values;
}
export function preference(alphaNum=1,alphaDen=1,betaNum=0,betaDen=1){
 const a={n:integer(alphaNum,'alpha numerator'),d:integer(alphaDen,'alpha denominator',1)},b={n:integer(betaNum,'beta numerator'),d:integer(betaDen,'beta denominator',1)};
 if(b.n>=b.d||a.n*b.d<b.n*a.d)throw Error('Use alpha ≥ beta ≥0 and beta <1.');return{a,b};
}
export function inequityUtility(moneyNumerators,i,pref,moneyDenominator=1n){
 const x=moneyNumerators.map(BigInt),n=x.length;if(n<2||!Number.isInteger(i)||i<0||i>=n||moneyDenominator<=0n)throw Error('Use at least two players, an existing player and a positive money denominator.');
 const{a,b}=pref,m=BigInt(n-1);let behind=0n,ahead=0n;
 x.forEach((y,j)=>{if(j!==i){if(y>x[i])behind+=y-x[i];else ahead+=x[i]-y;}});
 return{num:x[i]*m*a.d*b.d-a.n*b.d*behind-b.n*a.d*ahead,den:BigInt(moneyDenominator)*m*a.d*b.d,behind,ahead};
}
export const rationalNumber=r=>Number(r.num)/Number(r.den);
export const rationalCompare=(a,b)=>a.num*b.den<b.num*a.den?-1:a.num*b.den>b.num*a.den?1:0;
export function ultimatum(total,offer,proposer=preference(),responder=preference()){
 integer(total,'stake',1,10000);integer(offer,'offer',0,total);const payoffs=[total-offer,offer],pu=inequityUtility(payoffs,0,proposer),ru=inequityUtility(payoffs,1,responder),accept=ru.num>=0n;
 return{payoffs,proposerUtility:pu,responderUtility:ru,accept,outcome:accept?payoffs:[0,0],chosenUtility:accept?pu:{num:0n,den:1n}};
}
export function proposerOffers(total,proposer,responder){
 integer(total,'stake',1,10000);let best=null,offers=[];const rows=[];
 for(let offer=0;offer<=total;offer++){const z=ultimatum(total,offer,proposer,responder);rows.push(z);const value=z.chosenUtility;if(best===null||rationalCompare(value,best)>0){best=value;offers=[offer];}else if(rationalCompare(value,best)===0)offers.push(offer);}
 return{rows,best,offers};
}
export function dictatorOffers(total,pref){
 integer(total,'stake',1,10000);let best=null,offers=[];
 const rows=Array.from({length:total+1},(_,offer)=>{const utility=inequityUtility([total-offer,offer],0,pref);if(best===null||rationalCompare(utility,best)>0){best=utility;offers=[offer];}else if(rationalCompare(utility,best)===0)offers.push(offer);return{offer,payoffs:[total-offer,offer],utility};});return{rows,best,offers};
}
export function publicGoods(contributions,endowment=20,mpcrNum=2,mpcrDen=5,punishments=null,ownCost=1,receivedLoss=3){
 const n=contributions.length;if(n<2||n>8)throw Error('Use two through eight players.');integer(endowment,'endowment',1,100);integer(mpcrNum,'return numerator',0,100);integer(mpcrDen,'return denominator',1,100);integer(ownCost,'punishment cost',0,20);integer(receivedLoss,'punishment loss',0,20);
 const g=contributions.map(x=>integer(x,'contribution',0,endowment)),P=punishments??Array.from({length:n},()=>Array(n).fill(0));if(P.length!==n||P.some(row=>row.length!==n))throw Error('Punishment matrix dimensions must match players.');
 P.forEach((row,i)=>row.forEach((x,j)=>{integer(x,'punishment points',0,10);if(i===j&&x)throw Error('No self-punishment points.');}));
 const sum=g.reduce((a,b)=>a+b,0n),den=BigInt(mpcrDen),base=g.map(x=>(BigInt(endowment)-x)*den+BigInt(mpcrNum)*sum),costs=P.map(row=>BigInt(ownCost*row.reduce((a,b)=>a+b,0))),losses=Array.from({length:n},(_,j)=>BigInt(receivedLoss*P.reduce((a,row)=>a+row[j],0))),payoffNumerators=base.map((x,i)=>x-den*(costs[i]+losses[i]));
 return{contributions:[...contributions],P,den,baseNumerators:base,costs,losses,payoffNumerators,socialReturnNum:BigInt(n*mpcrNum),socialReturnDen:den};
}
export function trustGame(send,returned,endowment=10,multiplier=3){
 integer(endowment,'endowment',1,100);integer(multiplier,'multiplier',1,10);integer(send,'sent amount',0,endowment);integer(returned,'returned amount',0,send*multiplier);
 return{send,returned,received:send*multiplier,payoffs:[endowment-send+returned,endowment+send*multiplier-returned],created:(multiplier-1)*send};
}
// Fehr–Gächter (2000), equations (1)–(2) and Table 2. P[i][j] is sent by i to j.
export function fehrGachterLedger(contributions,punishments){
 if(contributions.length!==4)throw Error('The published protocol has four players.');
 const base=publicGoods(contributions,20,2,5,punishments),schedule=[0,1,2,4,6,9,12,16,20,25,30],P=base.P;
 const costs=P.map(row=>BigInt(row.reduce((sum,points)=>sum+schedule[points],0)));
 const received=Array.from({length:4},(_,j)=>P.reduce((sum,row)=>sum+row[j],0));
 const effective=received.map(x=>Math.min(10,x)),den=base.den*10n;
 const payoffNumerators=base.baseNumerators.map((x,i)=>x*BigInt(10-effective[i])-den*costs[i]);
 return{...base,costs,received,effective,den,payoffNumerators,baseDenominator:base.den};
}
export function levelK(k,pNum=2,pDen=3,baselineNum=50,baselineDen=1){
 integer(k,'level',0,12);integer(pNum,'target numerator',0,100);integer(pDen,'target denominator',1,100);integer(baselineNum,'baseline numerator',0,10000);integer(baselineDen,'baseline denominator',1,100);if(pNum>=pDen)throw Error('Use a target fraction below1.');
 return{num:BigInt(baselineNum)*BigInt(pNum)**BigInt(k),den:BigInt(baselineDen)*BigInt(pDen)**BigInt(k)};
}
export function beautyContest(guesses,pNum=2,pDen=3){
 if(guesses.length<2||guesses.length>20)throw Error('Use two through twenty guesses.');guesses.forEach(x=>integer(x,'guess',0,100));integer(pNum,'target numerator',0,100);integer(pDen,'target denominator',1,100);if(pNum>=pDen)throw Error('Use a target fraction below1.');
 const den=BigInt(guesses.length*pDen),num=BigInt(pNum)*BigInt(guesses.reduce((a,b)=>a+b,0)),distances=guesses.map(x=>{const d=BigInt(x)*den-num;return d<0n?-d:d;}),best=distances.reduce((a,b)=>a<b?a:b),winners=distances.flatMap((d,j)=>d===best?[j]:[]);return{target:{num,den},distances,winners};
}
const logistic=x=>x>=0?1/(1+Math.exp(-x)):Math.exp(x)/(1+Math.exp(x));
// Zero-sum diagonal-payoff game A=[[a,0],[0,b]], B=-A, with a,b>0.
// Its composed logit response is decreasing, so F(p)-p has exactly one root.
export function diagonalQRE(a=2,b=1,precision=1){
 if(![a,b,precision].every(Number.isFinite)||a<=0||b<=0||a>10||b>10||precision<0||precision>100)throw Error('Use positive diagonal payoffs through10 and precision0–100.');
 const responseB=p=>logistic(precision*(b-(a+b)*p)),responseA=q=>logistic(precision*((a+b)*q-b)),f=p=>responseA(responseB(p))-p,frames=[];let lo=0,hi=1;
 for(let j=0;j<80;j++){const p=(lo+hi)/2,value=f(p);frames.push({lo,hi,p,value});if(value===0){lo=hi=p;break;}if(value>0)lo=p;else hi=p;if((lo+hi)/2===lo||(lo+hi)/2===hi)break;}
 const p=(lo+hi)/2,q=responseB(p),residual=Math.max(Math.abs(responseA(q)-p),Math.abs(responseB(p)-q)),payoffA=a*p*q+b*(1-p)*(1-q);
 return{p,q,lo,hi,residual,payoffA,nash:b/(a+b),frames};
}

export function daycareSummary(rows,perChild=false){
 if(rows.length!==10||new Set(rows.map(r=>r[0])).size!==10||rows.some(r=>r[3].length!==20||r[1]<=0||r[3].some(x=>!Number.isInteger(x)||x<0)))throw Error('Use the ten complete source centres and twenty observed weeks.');
 const mean=a=>a.reduce((x,y)=>x+y,0)/a.length,group=flag=>{const selected=rows.filter(r=>r[2]===flag);if(!selected.length)throw Error('Both groups need centres.');const den=perChild?selected.reduce((a,r)=>a+r[1],0):selected.length,weekly=Array.from({length:20},(_,j)=>selected.reduce((a,r)=>a+r[3][j],0)/den),pre=mean(weekly.slice(0,4)),early=mean(weekly.slice(4,8)),during=mean(weekly.slice(4,16)),post=mean(weekly.slice(16));return{centres:selected.length,children:selected.reduce((a,r)=>a+r[1],0),weekly,pre,early,during,post};};
 const treated=group(true),control=group(false);return{treated,control,duringDID:(treated.during-treated.pre)-(control.during-control.pre),postDID:(treated.post-treated.pre)-(control.post-control.pre),perChild};
}
