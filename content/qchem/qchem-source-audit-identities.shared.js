export const gaussianEnergy=(sys,p,s)=>sys==='w'?s/4+p*p/(4*s):s/4+1/(4*s)+3*p/(4*s*s);
export const gaussianPartial=(sys,p,s)=>sys==='w'?p/(2*s):3/(4*s*s);
export function gaussianOptimum(sys,p){if(sys==='w')return p;let lo=1,hi=5;for(let i=0;i<70;i++){const s=(lo+hi)/2;if(s*s*s-s-6*p>0)hi=s;else lo=s;}return(lo+hi)/2;}
export const virialPotential=s=>s===0?Math.log:s>0?r=>r**s:r=>-(r**s);
export function virialState(M,s,k,{N=3500,rmax=s<=-.5?40+30*(k+1):s<=1?50:22}={}){
 const h=rmax/(N+1),V=virialPotential(s),d=Float64Array.from({length:N},(_,i)=>1/(h*h)+V((i+1)*h)),off=new Float64Array(N-1).fill(-.5/(h*h)),a=M.tridiagEig(d,off,k+1),u=Float64Array.from(a.vectors[k],x=>x/Math.sqrt(h));
 let T=0,W=0,prev=0,tail=0;for(let i=0;i<N;i++){T+=(u[i]-prev)**2/(2*h);prev=u[i];W+=h*V((i+1)*h)*u[i]**2;if(i>.9*N)tail+=h*u[i]**2;}T+=prev**2/(2*h);
 return{h,rmax,u,E:a.values[k],T,V:W,rVp:s===0?1:s*W,tail};
}
export function crossingState(R,V){const d=.9*R,gap=2*Math.hypot(d,V);return{lower:-gap/2,upper:gap/2,upperWeight:gap===0?null:(1+2*d/gap)/2,lowerWeight:gap===0?null:(1-2*d/gap)/2};}
