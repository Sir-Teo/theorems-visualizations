// Chapter-local concentration models. Defaults use μM and seconds; synthetic parameters are declared in each scope.
export const fmt=(x,d=4)=>!Number.isFinite(x)?'undefined':x!==0&&(Math.abs(x)<1e-4||Math.abs(x)>1e5)?x.toExponential(2):x.toFixed(d);
export const slider=(v,label,a,b,x,extra={})=>v.slider(label,a,b,x,{step:'any',fmt,...extra});
export const samples=(a,b,f,n=181)=>Array.from({length:n},(_,i)=>{const x=a+(b-a)*i/(n-1);return[x,f(x)];});
export const memo=f=>{let key,result;return(...args)=>{const k=JSON.stringify(args);if(k!==key){result=f(...args);key=k;}return result;};};
export const chart=(v,title,xlabel,ylabel,extra={})=>v.stage({x:[-.1,1.1],y:[-.18,1.18],height:320,axes:'box',gutter:{l:64},title,xlabel,ylabel,...extra});
export function fit(s,arrays){const p=arrays.flat().filter(a=>a.every(Number.isFinite)),xs=p.map(x=>x[0]),ys=p.map(x=>x[1]),a=Math.min(...xs),b=Math.max(...xs),c=Math.min(...ys),d=Math.max(...ys),dx=Math.max(.1,b-a),dy=Math.max(.002,d-c);s.setView([a-.1*dx,b+.1*dx],[c-.22*dy,d+.22*dy]);const digits=Math.max(0,Math.min(12,Math.ceil(-Math.log10(dy))+1)),label=x=>x===0?'0':Math.abs(x)<.001?x.toExponential(2):x.toFixed(digits);s.setTicks(undefined,dy<.02?(d-c<.15*dy?[[d,label(d)]]:[c,(c+d)/2,d].map(x=>[x,label(x)])):null);}
export const line=(s,a,color='accent',extra={})=>s.path(a,{color,width:2,...extra});
export const langmuir=(l,k)=>l/(k+l);
export function boundTotal(L,R,K){if(L===0||R===0)return 0;const b=L+R+K;return L*(2*R/(b+Math.sqrt(Math.max(0,b*b-4*L*R))));}
export const mmRate=(s,V=1,K=1)=>V*s/(K+s);
export function mmRhs(s,c,e,k1=1,km=1,k2=.2){return[-k1*(e-c)*s+(km*k1-k2)*c,k1*(e-c)*s-km*k1*c];}
export function rk4(f,y,h){const a=f(y),b=f(y.map((z,i)=>z+h*a[i]/2)),c=f(y.map((z,i)=>z+h*b[i]/2)),d=f(y.map((z,i)=>z+h*c[i]));return y.map((z,i)=>z+h*(a[i]+2*b[i]+2*c[i]+d[i])/6);}
// Output rows [physical time, free S, complex C, product P, reduced free S, reduced product].
export function mmTrace(e=.1,s0=2,T=2,N=240,stepScale=1){const end=T/e,hmax=.06*stepScale/(s0+e+1);let y=[s0,0,s0],t=0;const out=[[0,s0,0,0,s0,0]],f=([s,c,r])=>[...mmRhs(s,c,e),-mmRate(r,.2*e,1)];for(let j=1;j<=N;j++){const target=end*j/N,n=Math.max(1,Math.ceil((target-t)/hmax)),h=(target-t)/n;for(let k=0;k<n;k++)y=rk4(f,y,h);t=target;out.push([t,y[0],y[1],s0-y[0]-y[1],y[2],s0-y[2]]);}return out;}
export function qssaBound(e,s0,T,k1=1,km=1,k2=.2){const A=k1*s0+(k1*km-k2),lambda=k1*km;return e*Math.exp(k2*T/km)*A/lambda*(s0/(km+s0)+A*T/km);}
export function rng(seed){let state=seed>>>0;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return(state+.5)/4294967296;};}
export function rateData(noise=.03,seed=7){const r=rng(seed);return[.1,.2,.4,.8,1.5,3,6,10].map(s=>[s,mmRate(s)+noise*(2*r()-1)]);}
export function linearFit(a){const n=a.length,sx=a.reduce((z,p)=>z+p[0],0),sy=a.reduce((z,p)=>z+p[1],0),sxx=a.reduce((z,p)=>z+p[0]**2,0),sxy=a.reduce((z,p)=>z+p[0]*p[1],0),slope=(n*sxy-sx*sy)/(n*sxx-sx*sx);return{intercept:(sy-slope*sx)/n,slope};}
export function reciprocalFit(a){const r=linearFit(a.map(([s,v])=>[1/s,1/v]));return{...r,V:1/r.intercept,K:r.slope/r.intercept};}
export function directFit(a){const profile=logK=>{const K=Math.exp(logK),b=a.map(([s])=>s/(K+s)),V=a.reduce((z,p,i)=>z+p[1]*b[i],0)/b.reduce((z,x)=>z+x*x,0),sse=a.reduce((z,p,i)=>z+(p[1]-V*b[i])**2,0);return{K,V,sse};};const lo=Math.log(.02),hi=Math.log(40),n=200;let best=0,min=Infinity;for(let j=0;j<=n;j++){const q=profile(lo+(hi-lo)*j/n);if(q.sse<min){min=q.sse;best=j;}}let l=lo+(hi-lo)*Math.max(0,best-1)/n,r=lo+(hi-lo)*Math.min(n,best+1)/n;for(let j=0;j<65;j++){const x=l+(r-l)/3,y=r-(r-l)/3;if(profile(x).sse<profile(y).sse)r=y;else l=x;}return profile((l+r)/2);}
export function inhibition(s,I,mode='competitive'){const alpha=mode==='competitive'?1+I:1,alphaP=mode==='uncompetitive'?1+I:1;return s/(alpha+alphaP*s);}
export function hill(x,K=1,n=2){if(x===0)return 0;const z=n*Math.log(x/K);return z>=0?1/(1+Math.exp(-z)):Math.exp(z)/(1+Math.exp(z));}
export function mwc(alpha,L=100,c=.01,n=4){const r=(1+alpha)**n,t=L*(1+c*alpha)**n,Z=r+t,pr=r/Z,theta=pr*alpha/(1+alpha)+(1-pr)*c*alpha/(1+c*alpha),choose=(j)=>{let z=1;for(let k=1;k<=j;k++)z*=((n-k+1)/k);return z;},R=[],T=[];for(let j=0;j<=n;j++){R.push(choose(j)*alpha**j/Z);T.push(L*choose(j)*(c*alpha)**j/Z);}return{theta,pr,R,T};}
export const gkRhs=(z,r,K1,K2)=>r*(1-z)/(K1+1-z)-z/(K2+z);
export function gk(r,K1,K2){let a=0,b=1;for(let j=0;j<60;j++){const m=(a+b)/2;if(gkRhs(m,r,K1,K2)>0)a=m;else b=m;}return(a+b)/2;}
export const gkInput=(z,K1,K2)=>z*(1-z+K1)/((1-z)*(z+K2));
export const stoich=[[-1,1,0],[-1,1,1],[1,-1,-1],[0,0,1]];
export function cycle(r){const[a,b,c,d,e,f]=r,w=[b*e+b*d+c*e,a*d+a*e+f*d,f*c+a*c+f*b],z=w.reduce((s,x)=>s+x,0),p=w.map(x=>x/z),J=a*p[0]-b*p[1];return{p,J,affinity:Math.log(a)+Math.log(c)+Math.log(e)-Math.log(b)-Math.log(d)-Math.log(f),ratio:a*c*e/(b*d*f)};}
// Edges A↔B rates a,b; B↔C c,d; C↔A e,f.
export function brusselRhs([x,y],B){const flux=x*(x*y-B);return[1-x+flux,-flux];} // Algebraic form preserves the exact equilibrium (1,B) in binary64.
export function brussel(B,T=100,N=500,x0=1.15,y0=B){let y=[x0,y0],t=0;const out=[[0,...y]];for(let j=1;j<=N;j++){const end=T*j/N,n=Math.ceil((end-t)/.006),h=(end-t)/n;for(let k=0;k<n;k++)y=rk4(z=>brusselRhs(z,B),y,h);t=end;out.push([t,...y]);}return out;}
// Hill1910 p.vi, table I: observations reproduced by Hill from Barcroft & Camis, Na2HPO4 solution.
export const hillData=[[10,.675],[15,.81],[20,.87],[25,.905],[30,.93],[40,.95],[100,.995]];
export const hillHistorical=(p,n=1.670,K=.0453)=>hill(p,Math.exp(-Math.log(K)/n),n);
