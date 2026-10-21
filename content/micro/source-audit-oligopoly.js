// Explicit linear teaching games. Sources and independent derivations are recorded
// in docs/verification/micro-oligopoly-followup.md. No empirical calibration.
const bound=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));

export function stackelbergState(c1,c2,q=2,a=12,b=1){
  const follower=x=>Math.max(0,(a-c2-b*x)/(2*b));
  const price=(x,y)=>Math.max(0,a-b*(x+y));
  const profit=x=>x*(price(x,follower(x))-c1);
  const exit=bound((a-c2)/b,0,a/b),interior=(a-2*c1+c2)/(2*b);
  const candidates=[0,exit,a/b,bound(interior,0,exit),bound((a-c1)/(2*b),exit,a/b)];
  const leader=candidates.reduce((best,x)=>profit(x)>profit(best)?x:best,0);
  const q2=follower(leader),cournot1=(a-2*c1+c2)/(3*b),cournot2=(a-2*c2+c1)/(3*b);
  return{c1,c2,a,b,exit,interior,leader,follower:q2,price:price(leader,q2),
    leaderProfit:profit(leader),followerProfit:q2*(price(leader,q2)-c2),
    cournot1,cournot2,cournotPrice:price(cournot1,cournot2),
    cournotProfit1:cournot1*(price(cournot1,cournot2)-c1),cournotProfit2:cournot2*(price(cournot1,cournot2)-c2),
    q,reply:follower(q),chosenProfit:profit(q),profit,response:follower,
    corner:Math.abs(q2)<1e-12};
}

export function bertrandProfit(p,r,c,a=10){
  const demand=Math.max(0,a-p);
  return(p-c)*demand*(p<r?1:p===r?.5:0);
}
export function bertrandPath(c,delta,a=10){
  const pm=(a+c)/2,path=[[pm,pm]];
  for(let i=0;i<10000;i++){
    const old=path.at(-1);if(old[0]===c&&old[1]===c)return path;
    const next=old.slice(),j=i%2,value=old[1-j]-delta;
    next[j]=value<=c+1e-12?c:value;path.push(next);
  }
  throw new RangeError('undercut path did not terminate');
}
export function bertrandState(c,delta,progress,a=10){
  const path=bertrandPath(c,delta,a),last=path.length-1,k=Math.min(last,Math.floor(bound(progress,0,1)*last+1e-9));
  const cur=path[k],mover=k%2,rival=cur[1-mover],candidate=Math.max(c,rival-delta);
  return{c,delta,progress,path,last,k,cur,mover,rival,candidate,pm:(a+c)/2,
    profit1:bertrandProfit(cur[0],cur[1],c,a),profit2:bertrandProfit(cur[1],cur[0],c,a),
    tieProfit:bertrandProfit(rival,rival,c,a),supremum:(rival-c)*(a-rival),
    candidateProfit:bertrandProfit(candidate,rival,c,a),done:k===last};
}

export function differentiatedState(s,a=10,c=2){
  const pB=a-(a-c)/(2-s),qB=(a-c)/((2-s)*(1+s)),qC=(a-c)/(2+s),pC=a-(1+s)*qC;
  return{s,a,c,pB,qB,pC,qC,profitB:(pB-c)*qB,profitC:(pC-c)*qC,homogeneousLimit:s===1};
}
export function capacityProfit(p,k,rival,a=10,c=2){
  const demand=Math.max(0,a-p),sales=p<rival?Math.min(k,demand):p===rival?Math.min(k,demand/2):Math.min(k,Math.max(0,demand-k));
  return(p-c)*sales;
}
export function capacityState(k,a=10,c=2){
  const candidate=Math.max(c,a-2*k),own=capacityProfit(candidate,k,candidate,a,c);
  const upwardPrice=bound((a+c-k)/2,candidate,a),upward=capacityProfit(upwardPrice,k,candidate,a,c);
  const smallBoundary=(a-c)/3,largeBoundary=a-c;
  return{k,a,c,candidate,own,upwardPrice,upward,gain:Math.max(0,upward-own),
    smallBoundary,largeBoundary,equilibrium:k<=smallBoundary||k>=largeBoundary};
}
