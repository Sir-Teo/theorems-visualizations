/** Ideal zero-epsilon batch normalization; zero weights have undefined variance. */
export function makeScaleInvariantLogistic(X,Y,gamma=3){
 const n=X.length,mx=X.reduce((s,p)=>s+p[0],0)/n,my=X.reduce((s,p)=>s+p[1],0)/n;
 const centered=X.map(p=>[p[0]-mx,p[1]-my]),S=[[0,0],[0,0]];
 for(const p of centered){S[0][0]+=p[0]**2/n;S[0][1]+=p[0]*p[1]/n;S[1][1]+=p[1]**2/n;}S[1][0]=S[0][1];
 const softplus=z=>z>30?z:z< -30?Math.exp(z):Math.log1p(Math.exp(z));
 return function lossGrad(w,normalized=true){let L=0;const g=[0,0];
  const Sw=[S[0][0]*w[0]+S[0][1]*w[1],S[1][0]*w[0]+S[1][1]*w[1]];
  const s2=w[0]*Sw[0]+w[1]*Sw[1];if(normalized&&!(s2>0))return{L:NaN,g};
  const s=normalized?Math.sqrt(s2):1;
  for(let i=0;i<n;i++){
   const p=centered[i],a=p[0]*w[0]+p[1]*w[1],z=normalized?gamma*a/s:a;
   L+=softplus(-Y[i]*z)/n;const d=-Y[i]/(1+Math.exp(Y[i]*z))/n;
   for(let j=0;j<2;j++)g[j]+=d*(normalized?gamma*(p[j]/s-a*Sw[j]/(s2*s)):p[j]);
  }
  return{L,g};
 };
}
