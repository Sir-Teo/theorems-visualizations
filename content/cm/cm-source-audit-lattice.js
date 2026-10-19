// Audited model identities, no empirical material fits.
export function crystalSummary(S,r){
 const r0=(2*S.s12/S.s6)**(1/6),u0=-S.s6*S.s6/(2*S.s12),V0=S.vol*r0**3;
 const u=2*(S.s12/r**12-S.s6/r**6),shown=S.shells.slice(0,8).reduce((sum,q)=>sum+2*(q.n/q.r2**6/r**12-q.n/q.r2**3/r**6),0);
 return{r0,u0,V0,B:-8*u0/V0,u,shown,remainder:u-shown};
}
export function soundModel(m,a,K,q){
 const phase=q===0?1:2*Math.sin(q/2)/q,group=Math.cos(q/2);
 return{vs:a*Math.sqrt(K/m),edgeOmega:2*Math.sqrt(K/m),omega:2*Math.sqrt(K/m)*Math.sin(q/2),phase,group,deviation:1-phase};
}
