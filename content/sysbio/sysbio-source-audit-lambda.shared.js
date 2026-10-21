// Explicit illustrative rates. Endpoint dominance is not a simulated infection/lysis event.
export const lambdaParameters={eps:.05,A:6,V:8,dc:1,kap:1.5};
export const lambdaField=(m,kap,E,uv)=>([u,v,c])=>[(.05+6*u*u/(1+u*u)+E*c)/(1+v*v)-(1+uv)*u,8/(1+4*u*u)-v,m*kap/(1+4*u*u)-c];
export function lambdaRun(m,kap,E,uv,y0,T,dt=.05,every=4){const f=lambdaField(m,kap,E,uv),n=Math.round(T/dt),step=T/n;let y=y0.slice();const rows=[[0,...y]];for(let i=0;i<n;i++){const a=f(y),b=f(y.map((v,j)=>v+step*a[j]/2)),c=f(y.map((v,j)=>v+step*b[j]/2)),d=f(y.map((v,j)=>v+step*c[j]));y=y.map((v,j)=>v+step*(a[j]+2*b[j]+2*c[j]+d[j])/6);if((i+1)%every===0||i===n-1)rows.push([(i+1)*step,...y]);}return rows;}
export function lambdaUV(rate,dt=.05){const before=lambdaRun(0,1.5,0,0,[3.5,.5,0],20,dt,4),initial=before.at(-1).slice(1),after=lambdaRun(0,1.5,0,rate,initial,80,dt,4);return{before,after,all:before.concat(after.slice(1).map(r=>[r[0]+20,...r.slice(1)])),initial,final:after.at(-1).slice(1)};}
