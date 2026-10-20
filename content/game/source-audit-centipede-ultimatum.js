// Authored finite models; no fitted subject responses or experimental observations.
const integer=(x,lo,hi)=>Number.isInteger(x)&&x>=lo&&x<=hi;
export const centipedePayoff=m=>{
  if(!integer(m,1,11))throw new RangeError('Terminal index1–11 required');
  const small=2**(m-1),big=4*small;return m%2?[big,small]:[small,big];
};
const validN=n=>integer(n,2,10);
const validPlans=(n,S)=>Array.isArray(S)&&S.length===2&&[0,1].every(i=>Array.isArray(S[i])&&S[i].length===n&&Array.from({length:n},(_,j)=>typeof S[i][j]==='boolean').every(Boolean));
export function centipedeOutcome(n,S,start=1){
  if(!validN(n)||!validPlans(n,S)||!integer(start,1,n+1))throw new RangeError('Finite centipede and two complete Boolean plans required');
  for(let m=start;m<=n;m++)if(S[(m-1)%2][m-1])return m;return n+1;
}
export function centipedePlan(n,who,level,memo=new Map()){
  if(!validN(n)||!integer(who,0,1)||!integer(level,0,10))throw new RangeError('n2–10, player0/1 and level0–10 required');
  const key=`${n}/${who}/${level}`;if(memo.has(key))return memo.get(key).slice();
  const mine=Array(n).fill(false);
  if(level){const other=centipedePlan(n,1-who,level-1,memo);let continuation=centipedePayoff(n+1)[who];
    for(let m=n;m>=1;m--){const take=centipedePayoff(m)[who];if((m-1)%2!==who){if(other[m-1])continuation=take;}else{mine[m-1]=take>continuation;if(mine[m-1])continuation=take;}}
  }
  memo.set(key,mine.slice());return mine;
}
export function centipedeModel(n,a,b,inspect=1){
  if(!validN(n)||!integer(a,0,10)||!integer(b,0,10)||!integer(inspect,1,n+1))throw new RangeError('Offered controls required');
  const memo=new Map(),plans=[centipedePlan(n,0,a,memo),centipedePlan(n,1,b,memo)],stop=centipedeOutcome(n,plans),pay=centipedePayoff(stop),full=centipedePayoff(n+1);
  const continuations=Array.from({length:n},(_,j)=>{const m=j+1,who=j%2,take=centipedePayoff(m),passStop=centipedeOutcome(n,plans,m+1),pass=centipedePayoff(passStop),selected=plans[who][j];return{m,who,take,pass,passStop,selected,gain:(selected?pass[who]:take[who])-(selected?take[who]:pass[who])};});
  const grid=Array.from({length:11},(_,i)=>Array.from({length:11},(_,j)=>centipedeOutcome(n,[centipedePlan(n,0,i,memo),centipedePlan(n,1,j,memo)])));
  return{n,a,b,inspect,plans,stop,pay,full,continuations,grid,violations:continuations.filter(p=>p.gain>0).map(p=>p.m),strategyCounts:[2**Math.ceil(n/2),2**Math.floor(n/2)]};
}
export const ULTIMATUM_MODES=['money','threshold','population','inequity'];
export function ultimatumModel(mode='money',mu=3,width=2,alpha=1,zero='accept'){
  if(!ULTIMATUM_MODES.includes(mode)||!integer(mu,0,11)||!integer(width,0,5)||!Number.isFinite(alpha)||alpha<0||alpha>4||!['accept','reject'].includes(zero))throw new RangeError('Offered ultimatum controls required');
  const support=Array.from({length:Math.min(11,mu+width)-Math.max(0,mu-width)+1},(_,i)=>Math.max(0,mu-width)+i),denominator=mode==='population'?support.length:1;
  const utilities=Array.from({length:11},(_,x)=>x-alpha*Math.max(10-2*x,0)); // Fehr–Schmidt responder beta=0; proposer selfish.
  const numerators=Array.from({length:11},(_,x)=>mode==='money'?(x>0||zero==='accept'?1:0):mode==='threshold'?(x>=mu?1:0):mode==='population'?support.filter(m=>m<=x).length:(utilities[x]>=0?1:0));
  const probabilities=numerators.map(k=>k/denominator),profitNumerators=numerators.map((k,x)=>(10-x)*k),bestNumerator=Math.max(...profitNumerators),bestOffers=profitNumerators.flatMap((u,x)=>u===bestNumerator?[x]:[]),profits=profitNumerators.map(k=>k/denominator),responderMoney=numerators.map((k,x)=>x*k/denominator);
  return{mode,mu,width,alpha,zero,support,denominator,numerators,probabilities,profitNumerators,profits,bestOffers,best:bestNumerator/denominator,responderMoney,utilities,realThreshold:10*alpha/(1+2*alpha),moneyEquilibria:[{offer:0,acceptZero:true},{offer:1,acceptZero:false}]};
}
