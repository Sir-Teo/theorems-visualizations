// Chapter 5 numerical models. Fundamental solution convention: -Delta Phi = delta.
export const TAU=2*Math.PI;
export const lapURL='https://web.stanford.edu/class/math220b/handouts/laplace.pdf';
export const greenURL='https://web.stanford.edu/class/math220b/handouts/greensfcns.pdf';
export const ivrii=s=>`https://www.math.toronto.edu/ivrii/PDE-textbook/Chapter${s[0]}/S${s}.html`;
export function mean(f,n=1024){let a=0;for(let i=0;i<n;i++)a+=f(TAU*(i+.5)/n);return a/n;}
export function simpson(f,a=0,b=1,n=200){if(n%2)n++;let s=f(a)+f(b),h=(b-a)/n;for(let i=1;i<n;i++)s+=(i%2?4:2)*f(a+i*h);return s*h/3;}
export const lap=(f,x,y,h=.001)=>(f(x+h,y)+f(x-h,y)+f(x,y+h)+f(x,y-h)-4*f(x,y))/(h*h);
export function diskAverage(f,x,y,R,nr=100,nt=256){let total=0;for(let i=0;i<nr;i++){const r=R*Math.sqrt((i+.5)/nr);total+=mean(t=>f(x+r*Math.cos(t),y+r*Math.sin(t)),nt);}return total/nr;}
export function clampPoint(x,y,R=.85){const r=Math.hypot(x,y);return r>R?[x*R/r,y*R/r]:[x,y];}
export const harmonic=(x,y)=>Math.exp(.7*x)*Math.cos(.7*y);
export function field(s,f,range=2,box=[-1,1,-1,1],key=''){s.heat((x,y)=>f(x,y),{range:[-range,range],cmap:'theme-diverging',res:5,rect:[box[0],box[2],box[1],box[3]],key});}
export function disc(s,f,range=2,key=''){field(s,(x,y)=>x*x+y*y<=1?f(x,y):NaN,range,[-1,1,-1,1],key);s.circle(0,0,1,{color:'muted'});}
export function relax(N,k,bump=1,constant=false){const size=N+1,u=Array.from({length:size},(_,j)=>Float64Array.from({length:size},(_,i)=>(constant?1:(i+j)/N)+bump*Math.sin(Math.PI*i/N)*Math.sin(Math.PI*j/N)));for(let it=0;it<k;it++){const prev=u.map(r=>r.slice());for(let j=1;j<N;j++)for(let i=1;i<N;i++)u[j][i]=(prev[j-1][i]+prev[j+1][i]+prev[j][i-1]+prev[j][i+1])/4;}return u;}
export function gridStats(u){const N=u.length-1;let res=0,min=Infinity,max=-Infinity,interiorMax=-Infinity;for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){min=Math.min(min,u[j][i]);max=Math.max(max,u[j][i]);if(i&&j&&i<N&&j<N){interiorMax=Math.max(interiorMax,u[j][i]);res=Math.max(res,Math.abs(u[j-1][i]+u[j+1][i]+u[j][i-1]+u[j][i+1]-4*u[j][i])*N*N);}}return {res,min,max,interiorMax};}
export const gridAt=(u,x,y)=>{const N=u.length-1;return u[Math.max(0,Math.min(N,Math.round(y*N)))][Math.max(0,Math.min(N,Math.round(x*N)))];};
export function rectSeries(N,x,y){let u=0;for(let n=1;n<=N;n++)u+=Math.sin(n*Math.PI*x)*Math.sinh(n*Math.PI*y)/Math.sinh(n*Math.PI)/(n*n);return u;}
export function cubeSeries(N,x,y,z){let u=0;for(let n=1;n<=N;n++){const k=Math.PI*Math.hypot(n,1);u+=Math.sin(n*Math.PI*x)*Math.sin(Math.PI*y)*Math.sinh(k*z)/Math.sinh(k)/(n*n);}return u;}
export const poisson=(x,y,t)=>(1-x*x-y*y)/(1-2*(x*Math.cos(t)+y*Math.sin(t))+x*x+y*y);
export const discData=(t,m)=>1+.7*Math.cos(m*t)+.3*Math.sin(2*t);
export const discSolution=(x,y,m)=>{const r=Math.hypot(x,y),t=Math.atan2(y,x);return 1+.7*r**m*Math.cos(m*t)+.3*r*r*Math.sin(2*t);};
export function smoothAverage(f,x,y,R){const w=r=>r>=1?0:Math.exp(-1/(1-r*r));const norm=simpson(r=>w(r)*r);return simpson(r=>w(r)*r*mean(t=>f(x+R*r*Math.cos(t),y+R*r*Math.sin(t)),128))/norm;}
export function diskDifferenceRatio(R,d=1){if(d>=2*R)return 2;const q=d/(2*R),overlap=2*R*R*Math.acos(q)-.5*d*Math.sqrt(4*R*R-d*d);return 2-2*overlap/(Math.PI*R*R);}
export const phi=(n,r)=>n===2?-Math.log(r)/TAU:1/(4*Math.PI*r);
export function representation(x,y){const u=(a,b)=>a*a-b*b+.4*a;const a=TAU*mean(t=>{const c=Math.cos(t),s=Math.sin(t),r=Math.hypot(c-x,s-y);return phi(2,r)*(2*Math.cos(2*t)+.4*c);});const b=TAU*mean(t=>{const c=Math.cos(t),s=Math.sin(t),d=(c-x)**2+(s-y)**2;return u(c,s)*(1-x*c-y*s)/(TAU*d);});return {a,b,u:u(x,y)};}
// Exact spectral inverse of the finite-difference matrix, not a continuum Green function.
export function gridGreen(N,k,l){const u=Array.from({length:N+1},()=>new Float64Array(N+1));for(let m=1;m<N;m++)for(let n=1;n<N;n++){const w=4/(N*N)*Math.sin(Math.PI*m*k/N)*Math.sin(Math.PI*n*l/N)/(4-2*Math.cos(Math.PI*m/N)-2*Math.cos(Math.PI*n/N));for(let j=1;j<N;j++)for(let i=1;i<N;i++)u[j][i]+=w*Math.sin(Math.PI*m*i/N)*Math.sin(Math.PI*n*j/N);}return u;}
export function greenResidual(u,k,l){const N=u.length-1;let res=0;for(let j=1;j<N;j++)for(let i=1;i<N;i++)res=Math.max(res,Math.abs(4*u[j][i]-u[j-1][i]-u[j+1][i]-u[j][i-1]-u[j][i+1]-(i===k&&j===l?1:0))*N*N);return res;}
export function imagePotential(mode,a,x,y,z=0){const image=mode==='ball'?1/a:-a,w=mode==='ball'?1/a:1;return (1/Math.hypot(x,y-a,z)-w/Math.hypot(x,y-image,z))/(4*Math.PI);}
export const dirichletEnergy=a=>1+a*a*Math.PI*Math.PI/4;
