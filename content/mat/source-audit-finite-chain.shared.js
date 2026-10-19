// A separately specified finite harmonic chain; not Taylor's original model.
export function chainInitial(n=40) {
 const x=new Float64Array(n);for(let i=0;i<n;i++){const t=Math.min(1,Math.max(0,(i-n/2)/6+.5));x[i]=i-t;}x[0]=0;x[n-1]=n-2;return x;
}
export function chainEnergy(x,K,f=0) {
 let E=0;for(let i=1;i<x.length;i++)E+=.5*K*(x[i]-x[i-1]-1)**2;
 for(let i=1;i<x.length-1;i++)E+=.5*(1-Math.cos(2*Math.PI*x[i]))-f*x[i];return E;
}
export function chainGradient(x,K,f=0) {
 const g=new Float64Array(x.length);for(let i=1;i<x.length-1;i++)g[i]=K*(2*x[i]-x[i-1]-x[i+1])+Math.PI*Math.sin(2*Math.PI*x[i])-f;return g;
}
export function relaxChain(initial,K,f,{budget=2000,scale=.8,tol=1e-9}={}) {
 if(!(K>0&&Number.isFinite(f)&&budget>=0&&Number.isInteger(budget)&&scale>0&&scale<=1))throw new RangeError('finite force, positive stiffness, integer budget and safe step scale required');
 const x=Float64Array.from(initial),eta=scale/(4*K+2*Math.PI**2),stride=Math.max(1,Math.floor(budget/160)),hist=[];
 let steps=0,g=chainGradient(x,K,f),residual=Math.max(...Array.from(g,Math.abs));
 const record=()=>hist.push({steps,residual,energy:chainEnergy(x,K,f)});record();
 while(steps<budget&&residual>tol){for(let i=1;i<x.length-1;i++)x[i]-=eta*g[i];steps++;g=chainGradient(x,K,f);residual=Math.max(...Array.from(g,Math.abs));if(steps%stride===0)record();}
 if(hist.at(-1).steps!==steps)record();
 return {x,steps,eta,residual,converged:residual<=tol,energy:chainEnergy(x,K,f),hist};
}
export function chainWidth(x) {
 const u=Array.from(x,(q,i)=>q-i),at=level=>{for(let i=1;i<u.length;i++)if(u[i-1]>level&&u[i]<=level)return i-1+(u[i-1]-level)/(u[i-1]-u[i]);return null;};
 const a=at(-.1),b=at(-.9);return a===null||b===null?null:b-a;
}
