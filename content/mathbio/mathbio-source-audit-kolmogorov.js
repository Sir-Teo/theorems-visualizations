// Ecological diagnostics only: a finite sampled box is not a theorem certificate.
export const PREDATOR_MODELS={
 I:{F:(N,P)=>1-N/6-P,G:(N,P,m)=>N-m,Fn:()=>-1/6,Fp:()=>-1,Gn:()=>1,Gp:()=>0,K:1,B:m=>m},
 II:{F:(N,P)=>1-N/6-P/(1+N),G:(N,P,m)=>N/(1+N)-m,Fn:(N,P)=>-1/6+P/(1+N)**2,Fp:N=>-1/(1+N),Gn:N=>1/(1+N)**2,Gp:()=>0,K:1,B:m=>m/(1-m)},
 III:{F:(N,P)=>1-N/6-P*N/(1+N*N),G:(N,P,m)=>N*N/(1+N*N)-m,Fn:(N,P)=>-1/6-P*(1-N*N)/(1+N*N)**2,Fp:N=>-N/(1+N*N),Gn:N=>2*N/(1+N*N)**2,Gp:()=>0,K:null,B:m=>Math.sqrt(m/(1-m))},
 coop:{F:(N,P)=>1-N/6-P/(1+N),G:(N,P,m)=>N/(1+N)-m+.2*P,Fn:(N,P)=>-1/6+P/(1+N)**2,Fp:N=>-1/(1+N),Gn:N=>1/(1+N)**2,Gp:()=>.2,K:1,B:m=>m/(1-m)},
 allee:{F:(N,P)=>(N/.6-1)*(1-N/6)-P/(1+N),G:(N,P,m)=>N/(1+N)-m,Fn:(N,P)=>(1-N/6)/.6-(N/.6-1)/6+P/(1+N)**2,Fp:N=>-1/(1+N),Gn:N=>1/(1+N)**2,Gp:()=>0,K:null,B:m=>m/(1-m)},
};
export function predatorDiagnostics(type,m){const M=PREDATOR_MODELS[type],Pmax=type==='III'?1.3:1,L=6;let a1=-Infinity,a2=-Infinity,b1=-Infinity,b2=Infinity;for(let i=1;i<=30;i++)for(let j=1;j<=30;j++){const N=L*i/30,P=Pmax*j/30;a1=Math.max(a1,M.Fp(N,P));a2=Math.max(a2,N*M.Fn(N,P)+P*M.Fp(N,P));b1=Math.max(b1,M.Gp(N,P));b2=Math.min(b2,N*M.Gn(N,P)+P*M.Gp(N,P));}return{a1,a2,b1,b2,F00:M.F(0,0),K:M.K,L,B:M.B(m),Pmax};}
