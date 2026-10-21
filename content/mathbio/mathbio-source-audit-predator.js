// Scoped audit calculations; no claim that finite integration establishes a bifurcation.
export function perturbation(kind,e){return{eq:kind==='crowd'?[1,1-e]:[1/(1-e),1/(1-e)],trace:kind==='crowd'?-e:e,det:1-e,discriminant:e*e-4*(1-e)};}
export function response(type,N,a,h){return type==='I'?Math.min(a*N,1/h):a*N**(type==='III'?2:1)/(1+a*h*N**(type==='III'?2:1));}
export function risk(type,N,a,h){return N===0?(type==='III'?0:a):response(type,N,a,h)/N;}
// I: capped Poisson count, deliberately a different toy from the II/III renewal process.
// II/III: count only completed handling intervals in a fixed prechosen observation window.
export function feed(type,N,a,h,T,rng){if(N===0)return 0;const rate=a*N**(type==='III'?2:1);let clock=0,n=0;for(;;){clock+=-Math.log1p(-rng())/rate;if(type!=='I')clock+=h;if(clock>T)break;n++;if(type==='I'&&n>=Math.floor(T/h))break;}return n/T;}
export const brusselator=(b,x,y)=>[1-(b+1)*x+x*x*y,b*x-x*x*y];
export function brusselatorEigen(b){const re=(b-2)/2;return{re,im:Math.sqrt(1-re*re),det:1,trace:b-2};}
export function brusselatorAmplitude(b,dt=.025,transient=800,window=80){
 if(b<=2)return null;let s=[1.05,b],lo=Infinity,hi=-Infinity;const n=Math.round((transient+window)/dt);
 const add=(a,k,c)=>a.map((v,i)=>v+c*k[i]);
 for(let i=0;i<n;i++){const a=brusselator(b,...s),bb=brusselator(b,...add(s,a,dt/2)),c=brusselator(b,...add(s,bb,dt/2)),d=brusselator(b,...add(s,c,dt));s=s.map((v,j)=>v+dt*(a[j]+2*bb[j]+2*c[j]+d[j])/6);if(i*dt>=transient){lo=Math.min(lo,s[0]);hi=Math.max(hi,s[0]);}}
 return{amplitude:(hi-lo)/2,lo,hi,end:s};
}
export function brusselatorTrajectories(b,dt=.01,T=300){const paths=[],bounds=[3,3];for(const seed of[[1.3,1.2],[3,3]]){let s=seed.slice(),path=[s.slice()];const add=(a,k,c)=>a.map((v,i)=>v+c*k[i]);for(let i=0;i<Math.round(T/dt);i++){const a=brusselator(b,...s),bb=brusselator(b,...add(s,a,dt/2)),c=brusselator(b,...add(s,bb,dt/2)),d=brusselator(b,...add(s,c,dt));s=s.map((v,j)=>v+dt*(a[j]+2*bb[j]+2*c[j]+d[j])/6);if(i%5===0)path.push(s.slice());bounds[0]=Math.max(bounds[0],s[0]);bounds[1]=Math.max(bounds[1],s[1]);}paths.push(path);}return{paths,bounds};}
