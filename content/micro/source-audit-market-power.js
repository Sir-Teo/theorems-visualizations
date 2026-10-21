// Explicit teaching models; primary-source sections and independent checks are
// recorded in docs/verification/micro-market-power-followup.md.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

export function discriminationState(a2,b2,c,m,uniform=false){
  const markets=[{a:16,b:1},{a:a2,b:b2}],cost=Q=>c*Q+m*Q*Q/2;
  let lambda=0,discQ;
  for(let mask=1;mask<4;mask++){
    const active=markets.filter((_,i)=>mask&(1<<i)),A=active.reduce((s,d)=>s+d.a/(2*d.b),0),B=active.reduce((s,d)=>s+1/(2*d.b),0),l=(c+m*A)/(1+m*B);
    if(markets.every((d,i)=>mask&(1<<i)?l<=d.a+1e-12:l>=d.a-1e-12)){lambda=l;discQ=markets.map(d=>Math.max(0,(d.a-l)/(2*d.b)));break;}
  }
  if(!discQ)throw new RangeError('no discriminatory active set');
  const breaks=[0,...new Set(markets.map(d=>d.a))].sort((x,y)=>x-y),candidates=breaks.slice();
  for(let j=0;j<breaks.length-1;j++){
    const lo=breaks[j],hi=breaks[j+1],active=markets.filter(d=>d.a>(lo+hi)/2),A=active.reduce((s,d)=>s+d.a/d.b,0),B=active.reduce((s,d)=>s+1/d.b,0);
    if(B)candidates.push(clamp((A*(1+m*B)+c*B)/(B*(2+m*B)),lo,hi));
  }
  const uniformQ=p=>markets.map(d=>Math.max(0,(d.a-p)/d.b)),uniformProfit=p=>{const Q=uniformQ(p).reduce((s,q)=>s+q,0);return p*Q-cost(Q);};
  const uniformPrice=candidates.reduce((p,x)=>uniformProfit(x)>uniformProfit(p)?x:p,0);
  const outcome=(q,p)=>{const Q=q.reduce((s,x)=>s+x,0),revenue=q.reduce((s,x,i)=>s+x*p[i],0),cs=q.reduce((s,x,i)=>s+markets[i].b*x*x/2,0);return{q,p,Q,profit:revenue-cost(Q),cs,welfare:revenue-cost(Q)+cs,mc:c+m*Q,elasticity:q.map((x,i)=>x>1e-12?p[i]/(markets[i].b*x):null),mr:q.map((x,i)=>markets[i].a-2*markets[i].b*x)};};
  const separate=outcome(discQ,discQ.map((q,i)=>markets[i].a-markets[i].b*q)),one=outcome(uniformQ(uniformPrice),[uniformPrice,uniformPrice]);
  return{a2,b2,c,m,uniform,markets,lambda,uniformPrice,separate,one,...(uniform?one:separate)};
}

export function entryState(n){
  const c=2,b=1,m=.5,F=16,A=42,a=c+(A-c)/n,q=(a-c)/(2*b+m),p=a-b*q;
  const nStar=Math.sqrt(20),qMin=Math.sqrt(2*F/m),ac=x=>F/x+c+m*x/2,mc=x=>c+m*x;
  return{n,a,q,p,profit:(p-c)*q-m*q*q/2-F,averageCost:ac(q),marginalCost:mc(q),nStar,qMin,ac,mc,b,m,F,c};
}

export const cournotPotential=q=>{const Q=q.reduce((s,x)=>s+x,0);return(Q*Q+q.reduce((s,x)=>s+x*x,0))/2-10*Q;};
export function cournotAdjustment(n,first,others,sequential=false,rounds=24){
  const equilibrium=10/(n+1),states=[[first,...Array(n-1).fill(others)]],updates=[],clipped=[];
  for(let t=0;t<rounds;t++){
    const old=states.at(-1),next=old.slice();let didClip=false;
    for(let i=0;i<n;i++){
      // Center the algebraically identical affine reply at its known fixed point.
      // This preserves an exact equilibrium start instead of amplifying sum
      // roundoff in the unstable common mode. [0,5] is the analytic reply range
      // for nonnegative rival quantities, not an additional capacity constraint.
      const data=sequential?next:old,offset=data.reduce((s,x,j)=>s+(j===i?0:x-equilibrium),0),raw=equilibrium-offset/2;
      next[i]=Math.min(5,Math.max(0,raw));didClip ||=raw<=1e-12;
      if(sequential)updates.push(next.slice());
    }
    states.push(next);clipped.push(didClip);
  }
  const totals=states.map(q=>q.reduce((s,x)=>s+x,0)),norms=states.map(q=>Math.hypot(...q.map(x=>x-equilibrium)));
  const totalEquilibrium=n*equilibrium;let ratio=null,ratioAt=null;
  if(!sequential)for(let t=0;t<rounds;t++)if(!clipped[t]&&Math.abs(totals[t]-totalEquilibrium)>1e-8){ratio=(totals[t+1]-totalEquilibrium)/(totals[t]-totalEquilibrium);ratioAt=t;break;}
  return{n,first,others,sequential,rounds,equilibrium,totalEquilibrium,states,updates,totals,norms,clipped,ratio,ratioAt,theory:-(n-1)/2};
}
