// Original exact finite voting models. A-priori examples, not election forecasts.
import * as Q from './ch07.exact.shared.js';
import {electoralAllocation,gamsonSummary}from'./ch07.data.shared.js';
export {electoralAllocation,gamsonSummary};
export {Q};
const {add,sub,mul,div,sign}=Q;
export const quantity=x=>{const exact={...Q.exact(x)};return{exact,value:Q.approximate(exact),sign:sign(exact)};};
const rat=(n,d=1)=>Q.rational(n,d),sum=xs=>xs.reduce((a,b)=>a+b,0),qsum=xs=>xs.reduce(add,Q.ZERO);
const int=(x,a,b,label)=>{if(typeof x!=='number'||!Number.isInteger(x)||x<a||x>b)throw RangeError(label+' outside its declared integer range');return x;};
const option=(x,values,label)=>{if(!values.includes(x))throw RangeError('Unknown '+label);return x;};
const bool=(x,label)=>{if(typeof x!=='boolean')throw TypeError(label+' must be boolean');return x;};
const copied=x=>structuredClone(x);
const memo=fn=>{let key,old;return p=>{const next=JSON.stringify(p);if(next!==key){old=fn(p);key=next;}return copied(old);};};
export const popcount=x=>{let n=0;while(x){x&=x-1;n++;}return n;};
const factorials=n=>{const out=[1n];for(let k=1;k<=n;k++)out.push(out[k-1]*BigInt(k));return out;};
export function binomial(n,k){int(n,0,3000,'binomial population');if(k<0||k>n)return 0n;k=Math.min(k,n-k);let x=1n;for(let i=1;i<=k;i++)x=x*BigInt(n-k+i)/BigInt(i);return x;}
const binomialRow=n=>Array.from({length:n+1},(_,k)=>binomial(n,k));
const dense=a=>Array.isArray(a)&&Array.from({length:a.length},(_,i)=>Object.hasOwn(a,i)).every(Boolean);
const weightsCheck=(weights,maxN=6,maxWeight=1000000)=>{if(!dense(weights)||weights.length<2||weights.length>maxN)throw RangeError('Declared finite weight vector required');weights.forEach(w=>int(w,0,maxWeight,'weight'));return weights.slice();};
export function analyzeRule(n,winning,{weights=Array(n).fill(1),includeTable=n<=6}={}){
 int(n,2,15,'players');const size=1<<n,counts=Array(size).fill(0),totals=Array(size).fill(0),wins=Array(size).fill(false),F=factorials(n),swings=Array(n).fill(0n),bySize=Array.from({length:n},()=>Array(n).fill(0)),winningBySize=Array(n+1).fill(0),minimal=[],table=[];
 for(let mask=1;mask<size;mask++){const bit=mask&-mask,i=31-Math.clz32(bit),rest=mask^bit;counts[mask]=counts[rest]+1;totals[mask]=totals[rest]+weights[i];}
 for(let mask=0;mask<size;mask++){wins[mask]=!!winning(mask,totals[mask],counts[mask]);if(wins[mask])winningBySize[counts[mask]]++;}
 for(let mask=0;mask<size;mask++){
  const critical=[];if(wins[mask])for(let i=0;i<n;i++)if(mask&(1<<i)&&!wins[mask^(1<<i)]){critical.push(i);swings[i]++;bySize[i][counts[mask]-1]++;}
  const isMinimal=wins[mask]&&critical.length===counts[mask];if(isMinimal)minimal.push(mask);
  if(includeTable)table.push({mask,members:Array.from({length:n},(_,i)=>i).filter(i=>mask&(1<<i)),weight:totals[mask],win:wins[mask],minimal:isMinimal,critical});
 }
 const pivotCounts=bySize.map(row=>row.map((x,k)=>BigInt(x)*F[k]*F[n-k-1])),ssiCounts=pivotCounts.map(row=>row.reduce((a,b)=>a+b,0n)),totalSwings=swings.reduce((a,b)=>a+b,0n),valid=!wins[0]&&wins.at(-1),proper=Array.from({length:size},(_,mask)=>!wins[mask]||!wins[(size-1)^mask]).every(Boolean);
 return{n,weights:weights.slice(),valid,proper,winningBySize,minimalWinning:minimal,table,swings,pivotCounts,ssiCounts,orderings:F[n],ssi:ssiCounts.map(x=>quantity(rat(x,F[n]))),absolute:swings.map(x=>quantity(rat(x,1n<<BigInt(n-1)))),normalized:totalSwings?swings.map(x=>quantity(rat(x,totalSwings))):Array(n).fill(null),totalSwings,winningCoalitions:sum(winningBySize)};
}
const analyzeWeighted=memo(({weights,quota,minMembers})=>analyzeRule(weights.length,(_,weight,count)=>weight>=quota&&count>=minMembers,{weights}));
export function council({weights=[4,3,2,1],quota=6,minMembers=0,mask=3}={}){
 weights=weightsCheck(weights);int(quota,1,1000000,'quota');int(minMembers,0,weights.length,'country minimum');int(mask,0,(1<<weights.length)-1,'selected coalition');const game=analyzeWeighted({weights,quota,minMembers});return{...game,quota,minMembers,selected:copied(game.table[mask]),weightShares:sum(weights)?weights.map(w=>quantity(rat(w,sum(weights)))):weights.map(()=>null)};
}
// Reproducible illustrative order, separate from ideal uniform-order theory.
function shuffled(n,seed){int(seed,0,999,'ordering seed');const out=Array.from({length:n},(_,i)=>i);let state=seed+1;for(let i=n-1;i>0;i--){state=(Math.imul(state,1664525)+1013904223)>>>0;const j=Math.floor((state/4294967296)*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
export function ordering({weights=[4,3,2,1],quota=6,index=0,reveal=4}={}){
 weights=weightsCheck(weights);int(quota,1,1000000,'quota');const n=weights.length,F=factorials(n);int(index,0,Number(F[n])-1,'ordering index');int(reveal,0,n,'revealed prefix');let rank=index,remaining=Array.from({length:n},(_,i)=>i),order=[];
 for(let k=n;k>0;k--){const stride=Number(F[k-1]),choice=Math.floor(rank/stride);rank%=stride;order.push(remaining.splice(choice,1)[0]);}
 const game=council({weights,quota,mask:0});let mask=0,total=0,pivot=null;const steps=order.map((player,i)=>{const before=total;mask|=1<<player;total+=weights[player];const crossing=before<quota&&total>=quota;if(crossing)pivot=player;return{position:i+1,player,mask,weight:total,win:total>=quota,pivot:crossing};});
 return{...game,index,reveal,order,steps,pivot,visible:steps.slice(0,reveal)};
}
export function eec({quota=12,fourCountries=false,mask=39}={}){
 int(quota,1,17,'historical or counterfactual quota');bool(fourCountries,'four-country rule');return{...council({weights:[4,4,4,2,2,1],quota,minMembers:fourCountries?4:0,mask}),fourCountries,names:['Germany','France','Italy','Belgium','Netherlands','Luxembourg']};
}
export function entrant({weights=[2,2,1],quota=4,newWeight=1,mask=5}={}){
 weights=weightsCheck(weights,5,12);int(newWeight,0,12,'entrant weight');int(quota,1,72,'quota');int(mask,0,(1<<weights.length)-1,'old coalition');const before=council({weights,quota,mask}),after=council({weights:[...weights,newWeight],quota,mask:mask|(1<<weights.length)}),deltas=weights.map((_,i)=>({rawChange:after.swings[i]-before.swings[i],excessBeyondDuplicatedContexts:after.swings[i]-2n*before.swings[i],absolute:quantity(sub(after.absolute[i].exact,before.absolute[i].exact)),normalized:before.normalized[i]&&after.normalized[i]?quantity(sub(after.normalized[i].exact,before.normalized[i].exact)):null,ssi:quantity(sub(after.ssi[i].exact,before.ssi[i].exact))}));
 const changes=weights.map((_,i)=>{const gained=[],lost=[];for(const row of before.table){if(row.mask&(1<<i))continue;const oldSwing=!row.win&&before.table[row.mask|(1<<i)].win,newMask=row.mask|(1<<weights.length),newSwing=!after.table[newMask].win&&after.table[newMask|(1<<i)].win;if(newSwing&&!oldSwing)gained.push(row.mask);if(oldSwing&&!newSwing)lost.push(row.mask);}return{gained,lost};});
 return{weights,quota,newWeight,mask,before,after,deltas,changes};
}
const tieProbability=N=>{int(N,1,2161,'odd electorate');if(N%2!==1)throw RangeError('Odd electorate required');return rat(binomial(N-1,(N-1)/2),1n<<BigInt(N-1));};
export function penrose({roots=[1,2,3,4,5],scheme='square root',quotaPercent=51}={}){
 if(!dense(roots)||roots.length!==5)throw RangeError('Five electorate sizes required');roots.forEach(x=>int(x,1,10,'population root control'));option(scheme,['equal','population','square root'],'weight scheme');int(quotaPercent,1,100,'quota percent');const rootValues=roots.map(x=>2*x+1),populations=rootValues.map(x=>x*x),weights=populations.map((N,i)=>scheme==='equal'?1:scheme==='population'?N:rootValues[i]),quota=Math.ceil(sum(weights)*quotaPercent/100),game=council({weights,quota,mask:0}),within=populations.map(tieProbability),citizen=within.map((p,i)=>mul(p,game.absolute[i].exact)),target=within.map(p=>div(1,p)),targetSum=qsum(target),rootSum=sum(rootValues);
 return{roots:roots.slice(),scheme,quotaPercent,rootValues,populations,weights,quota,game,within:within.map(quantity),citizen:citizen.map(quantity),idealDelegateShares:target.map(x=>quantity(div(x,targetSum))),asymptoticDelegateShares:rootValues.map(x=>quantity(rat(x,rootSum))),asymptoticWithin:populations.map(N=>Math.sqrt(2/(Math.PI*N))),citizenRange:{min:quantity(citizen.reduce((a,b)=>sign(sub(a,b))<=0?a:b)),max:quantity(citizen.reduce((a,b)=>sign(sub(a,b))>=0?a:b))}};
}
function legislatureWin(h,s,p,v,H,S,vicePresident,override){return (h>=Math.floor(H/2)+1&&(s>=Math.floor(S/2)+1||(vicePresident&&S%2===0&&s===S/2&&v))&&p)||(override&&h>=Math.ceil(2*H/3)&&s>=Math.ceil(2*S/3));}
const legislatureSummary=memo(({H,S,vicePresident,override})=>{
 const counts=[H,S,1,vicePresident?1:0],N=sum(counts),F=factorials(N),ssiCounts=[],swings=[],bySize=[];
 for(let type=0;type<4;type++){
  if(!counts[type]){ssiCounts.push(0n);swings.push(0n);bySize.push(Array(N).fill(0n));continue;}
  const available=counts.map((x,i)=>x-(i===type?1:0)),C=available.map(binomialRow),rows=Array(N).fill(0n);let pivots=0n,raw=0n;
  for(let h=0;h<=available[0];h++)for(let s=0;s<=available[1];s++)for(let p=0;p<=available[2];p++)for(let v=0;v<=available[3];v++){
   const before=legislatureWin(h,s,p,v,H,S,vicePresident,override),after=legislatureWin(h+(type===0),s+(type===1),p+(type===2),v+(type===3),H,S,vicePresident,override);
   if(!before&&after){const k=h+s+p+v,ways=C[0][h]*C[1][s]*C[2][p]*C[3][v];raw+=ways;rows[k]+=ways;pivots+=ways*F[k]*F[N-k-1];}
  }
  ssiCounts.push(pivots);swings.push(raw);bySize.push(rows);
 }
 return{H,S,vicePresident,override,counts,N,orderings:F[N],ssiCounts,swings,swingBySize:bySize,ssi:ssiCounts.map((x,i)=>counts[i]?quantity(rat(x,F[N])):null),absolute:swings.map((x,i)=>counts[i]?quantity(rat(x,1n<<BigInt(N-1))):null),bodySSI:ssiCounts.map((x,i)=>quantity(rat(x*BigInt(counts[i]),F[N])))};
});
export function legislature({H=435,S=100,vicePresident=true,override=true,houseYes=218,senateYes=51,presidentYes=true,viceYes=true}={}){
 int(H,3,435,'House size');int(S,3,100,'Senate size');bool(vicePresident,'include vice president');bool(override,'include override route');int(houseYes,0,H,'House yes votes');int(senateYes,0,S,'Senate yes votes');bool(presidentYes,'president decision');bool(viceYes,'vice president decision');const game=legislatureSummary({H,S,vicePresident,override}),majorityHouse=houseYes>=Math.floor(H/2)+1,majoritySenate=senateYes>=Math.floor(S/2)+1,tieBreak=vicePresident&&S%2===0&&senateYes===S/2&&viceYes,signature=majorityHouse&&(majoritySenate||tieBreak)&&presidentYes,overrideRoute=override&&houseYes>=Math.ceil(2*H/3)&&senateYes>=Math.ceil(2*S/3);
 return{...game,houseYes,senateYes,presidentYes,viceYes,thresholds:{houseMajority:Math.floor(H/2)+1,senateMajority:Math.floor(S/2)+1,houseOverride:Math.ceil(2*H/3),senateOverride:Math.ceil(2*S/3)},routes:{majorityHouse,majoritySenate,tieBreak,signature,override:overrideRoute,passes:signature||overrideRoute}};
}
const vetoSummary=memo(({permanent,ordinary,quota})=>{const n=permanent+ordinary,allVeto=(1<<permanent)-1;return analyzeRule(n,(mask,weight,count)=>(mask&allVeto)===allVeto&&count>=quota,{includeTable:false});});
export function vetoCouncil({permanent=5,ordinary=10,quota=9,seed=37,reveal=15}={}){
 int(permanent,1,5,'veto holders');int(ordinary,1,10,'ordinary members');const n=permanent+ordinary;int(quota,permanent,n,'required yes members');int(reveal,0,n,'revealed members');const game=vetoSummary({permanent,ordinary,quota}),order=shuffled(n,seed),vetoMask=(1<<permanent)-1;let mask=0,pivot=null;const steps=order.map((player,i)=>{const before=(mask&vetoMask)===vetoMask&&popcount(mask)>=quota;mask|=1<<player;const win=(mask&vetoMask)===vetoMask&&popcount(mask)>=quota,crossing=!before&&win;if(crossing)pivot=player;return{position:i+1,player,mask,count:popcount(mask),vetoYes:popcount(mask&vetoMask),win,pivot:crossing};});return{...game,permanent,ordinary,quota,seed,reveal,order,steps,pivot,visible:steps.slice(0,reveal)};
}
function multisetSearch(masks,k,n,visit){const tuple=[];function walk(start,left,counts){if(!left)return visit(tuple.slice(),counts);for(let i=start;i<masks.length;i++){const next=counts.map((x,j)=>x+Number(!!(masks[i]&(1<<j))));tuple.push(masks[i]);const stop=walk(i,left-1,next);tuple.pop();if(stop)return stop;}return null;}return walk(0,k,Array(n).fill(0));}
const tradeCalculate=memo(({mode,generators})=>{
 const n=6,winning=mode==='bicameral'?(mask=>popcount(mask&7)>=2&&popcount((mask>>3)&7)>=2):mode==='weighted'?((mask,weight)=>weight>=7):(mask=>generators.some(g=>(mask&g)===g)),weights=mode==='weighted'?[4,3,2,1,1,1]:Array(6).fill(1),game=analyzeRule(n,winning,{weights}),W=game.table.filter(r=>r.win).map(r=>r.mask),L=game.table.filter(r=>!r.win).map(r=>r.mask);let trade=null,certificate=null;
 for(let k=2;k<=3&&!trade;k++){
  const losing=new Map();multisetSearch(L,k,n,(tuple,counts)=>{const key=counts.join(',');if(!losing.has(key))losing.set(key,tuple);return null;});
  trade=multisetSearch(W,k,n,(tuple,counts)=>{const loss=losing.get(counts.join(','));return loss?{k,winning:tuple,losing:loss,appearances:counts}:null;});
 }
 // A finite search may certify a representation, never disprove one by exhaustion.
 if(!trade){const radix=5;for(let code=1;code<radix**n&&!certificate;code++){
  let value=code;const candidate=Array(n);for(let i=n-1;i>=0;i--){candidate[i]=value%radix;value=Math.floor(value/radix);}
  const total=Array(1<<n).fill(0);let lower=-1,upper=Infinity;
  for(let mask=1;mask<1<<n;mask++){const bit=mask&-mask;total[mask]=total[mask^bit]+candidate[31-Math.clz32(bit)];}
  for(let mask=0;mask<1<<n;mask++)if(game.table[mask].win)upper=Math.min(upper,total[mask]);else lower=Math.max(lower,total[mask]);
  if(lower<upper)certificate={weights:candidate,quota:lower+1,maxLosingWeight:lower,minWinningWeight:upper};
 }}
 return{mode,generators:generators.slice(),game,trade,certificate,status:trade?'nonweighted certificate':certificate?'weighted certificate':'inconclusive bounded search',tradeLengthsSearched:[2,3],weightSearchBound:4};
});
export function trade({mode='bicameral',generators=[3,12,48]}={}){
 option(mode,['bicameral','weighted','custom'],'voting system');if(!dense(generators)||generators.length!==3)throw RangeError('Three nonempty coalition generators required');generators.forEach(x=>int(x,1,63,'coalition generator'));return tradeCalculate({mode,generators});
}
const electoralPolynomial=(()=>{const out=Array(539).fill(0n);out[0]=1n;let top=0;for(const[,,weight]of electoralAllocation){for(let s=top;s>=0;s--)out[s+weight]+=out[s];top+=weight;}return out;})();
const electoralCounts=memo(({quota})=>{
 const rows=electoralAllocation.map(([code,name,weight])=>{const other=Array(539-weight).fill(0n);for(let s=0;s<other.length;s++)other[s]=electoralPolynomial[s]-(s>=weight?other[s-weight]:0n);let swings=0n;for(let s=Math.max(0,quota-weight);s<=Math.min(quota-1,538-weight);s++)swings+=other[s];return{code,name,weight,swings};}),totalSwings=rows.reduce((a,r)=>a+r.swings,0n);
 return{rows:rows.map(r=>({...r,absolute:quantity(rat(r.swings,1n<<50n)),normalized:quantity(rat(r.swings,totalSwings))})),totalSwings};
});
const lowerCache=new Map();const cachedTie=N=>{if(!lowerCache.has(N))lowerCache.set(N,tieProbability(N));return lowerCache.get(N);};
export function electoral({quota=270,scale=2,belief='fair independent',selected=4}={}){
 int(quota,1,538,'quota');int(scale,1,20,'hypothetical electorate multiplier');option(belief,['fair independent','common uniform lean'],'citizen model');int(selected,0,50,'jurisdiction index');const base=electoralCounts({quota}),rows=base.rows.map(r=>{const hypotheticalPopulation=2*scale*r.weight+1,within=belief==='fair independent'?cachedTie(hypotheticalPopulation):rat(1,hypotheticalPopulation),citizen=mul(within,r.absolute.exact);return{...r,hypotheticalPopulation,within:quantity(within),citizen:quantity(citizen),voteShare:quantity(rat(r.weight,538))};}),groups=[];
 for(const weight of[...new Set(rows.map(r=>r.weight))].sort((a,b)=>a-b)){const members=rows.filter(r=>r.weight===weight);groups.push({weight,codes:members.map(r=>r.code),count:members.length,absolute:copied(members[0].absolute),normalized:copied(members[0].normalized),hypotheticalPopulation:members[0].hypotheticalPopulation,within:copied(members[0].within),citizen:copied(members[0].citizen)});}
 return{quota,scale,belief,selected,totalWeight:538,totalJurisdictions:51,totalSwings:base.totalSwings,rows,groups,inspected:copied(rows[selected]),allocationPeriod:'2024 and 2028; 2020 Census',allocationReadDate:'2026-10-27',wholeJurisdictionBlocAssumption:true,hypotheticalPopulationIsObserved:false};
}
export function portfolios({seats=[42,30,18,10],quota=51,mask=3,cabinetSize=10,reserved=0}={}){
 seats=weightsCheck(seats,4,60);if(seats.length!==4)throw RangeError('Four authored parties required');int(quota,1,240,'seat quota');int(mask,0,15,'candidate coalition');int(cabinetSize,1,30,'cabinet size');int(reserved,0,10,'reserved portfolios');const game=council({weights:seats,quota,mask}),members=game.selected.members,coalitionSeats=game.selected.weight,counts=Array(4).fill(0);let formateur=null,usedReserve=0;
 if(members.length&&coalitionSeats){formateur=members.reduce((a,b)=>seats[b]>seats[a]?b:a);usedReserve=Math.min(reserved,cabinetSize);const remaining=cabinetSize-usedReserve,remainders=members.map(i=>({i,remainder:remaining*seats[i]%coalitionSeats}));for(const i of members)counts[i]=Math.floor(remaining*seats[i]/coalitionSeats);const spare=remaining-sum(counts);remainders.sort((a,b)=>b.remainder-a.remainder||a.i-b.i);for(let k=0;k<spare;k++)counts[remainders[k].i]++;counts[formateur]+=usedReserve;}
 const seatShares=seats.map((s,i)=>coalitionSeats&&members.includes(i)?quantity(rat(s,coalitionSeats)):null),portfolioShares=counts.map((x,i)=>coalitionSeats&&members.includes(i)?quantity(rat(x,cabinetSize)):null),residuals=seatShares.map((x,i)=>x?quantity(sub(portfolioShares[i].exact,x.exact)):null);
 return{seats,quota,mask,cabinetSize,reserved,game,coalitionSeats,formateur,usedReserve,counts,seatShares,portfolioShares,residuals,sourceSummary:gamsonSummary.map(r=>({...r,correlation:quantity(rat(r.correlationThousandths,1000))})),observedCabinetMicrodata:false};
}
