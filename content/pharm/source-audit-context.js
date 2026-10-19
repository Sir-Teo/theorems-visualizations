import{ANAES,mamm,cDecay,firstBelow,tTerminal}from'./ch03.shared.js';
export const illustrativeAnaesthetics=()=>Object.values(ANAES).map(p=>({...p,label:p.label+'-like',m:mamm(p)}));
export function contextProfile(m,duration,mode='hold'){
  let C;
  if(mode==='hold'){
    const initial=[1,...m.Q.map((q,i)=>-Math.expm1(-q*duration/m.V[i+1]))];C=t=>cDecay(m,initial,t)[0];
  }else{
    const weights=m.w.map((w,i)=>w*(-Math.expm1(-m.lam[i]*duration))/m.lam[i]),normalizer=weights.reduce((a,b)=>a+b,0);C=t=>weights.reduce((s,w,i)=>s+w*Math.exp(-m.lam[i]*t),0)/normalizer;
  }
  return{C,half:firstBelow(C,.5,20000),terminal:tTerminal(m)};
}
