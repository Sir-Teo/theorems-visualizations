// Monetary identities and explicitly parameterized teaching models. Time is years unless stated.
export const pc=(x,d=2)=>(100*x).toFixed(d)+'%';
export function tradeCycle(n,k){k=Math.max(0,Math.min(n,k));const holdings=Array.from({length:n},(_,i)=>[i]);for(let j=0;j<k;j++){const buyer=j,seller=(j+1)%n,good=(j+1)%n;holdings[seller]=holdings[seller].filter(x=>x!==good);holdings[buyer].push(good);}return{holdings,cash:k%n,satisfied:holdings.filter((a,j)=>a.includes((j+1)%n)).length};}
export function multiplier(r,k,B=100){const layers=Array.from({length:k},(_,j)=>B*(1-r)**j),D=layers.reduce((s,x)=>s+x,0);return{layers,D,loans:D-B,reserves:B,excess:B-r*D,limit:B/r};}
export function banking(L,r){const reserves=100,equity=20,deposits=80+L,assets=reserves+L;return{reserves,equity,deposits,assets,gap:Math.max(0,r*deposits-reserves),capitalRatio:L?equity/L:null};}
export function quantity(t,mu,v,g){const M=Math.exp(mu*t),V=Math.exp(v*t),Y=Math.exp(g*t),P=M*V/Y;return{M,V,Y,P,pi:mu+v-g};}
export const fisher=(i,pi)=>(1+i)/(1+pi)-1;
export function neutral(f,shock='money'){const Y0=10**.3,M0=100,V=2,w0=.7*Y0,P0=M0*V/Y0,Y=Y0*(shock==='productivity'?f:1),M=M0*(shock==='money'?f:1),P=M*V/Y,w=.7*Y;return{Y0,M0,P0,w0,Y,M,P,w,W:P*w,W0:P0*w0};}
export const balances=(pi,a=1,m0=100)=>m0*Math.exp(-a*pi);
export const seign=(pi,a=1,m0=100)=>pi*balances(pi,a,m0);
export function roots(d,a=1,m0=100){const peak=m0/(a*Math.E);if(d>peak)return[];if(Math.abs(d-peak)<1e-12)return[1/a];const bis=(l,h)=>{const sl=seign(l,a,m0)-d;for(let j=0;j<80;j++){const m=(l+h)/2;if((seign(m,a,m0)-d)*sl>0)l=m;else h=m;}return(l+h)/2;};return[bis(0,1/a),bis(1/a,30/a)];}
// Adaptive-expectations Cagan variant with constant real money-financed deficit.
export function caganDerivative(state,d,a=1,b=.4,m0=100){const e=state[0],m=balances(e,a,m0),pi=(d/m-a*b*e)/(1-a*b);return[b*(pi-e),pi,d/m];}
export function rk4(f,s,dt){const k1=f(s),k2=f(s.map((x,j)=>x+dt*k1[j]/2)),k3=f(s.map((x,j)=>x+dt*k2[j]/2)),k4=f(s.map((x,j)=>x+dt*k3[j]));return s.map((x,j)=>x+dt*(k1[j]+2*k2[j]+2*k3[j]+k4[j])/6);}
export function cagan(d,e0,dt=.002,horizon=8){let s=[e0,0,Math.log(balances(e0))],t=0,stopped=false;const path=[[t,...s]];while(t<horizon-1e-9){const rates=caganDerivative(s,d),h=Math.min(dt,horizon-t,.005/Math.max(1,...rates.map(Math.abs))),q=rk4(x=>caganDerivative(x,d),s,h);if(!q.every(Number.isFinite)||q[0]>6||Math.abs(q[1])>15){stopped=true;break;}s=q;t+=h;path.push([t,...s]);}return{path,stopped,end:s,time:t,budgetResidual:s[2]-s[1]-Math.log(balances(s[0]))};}
export const HYPER=[{name:'Germany, October 1923',monthlyPercent:29500,doublingHours:3.7*24,index:'wholesale price index'},{name:'Zimbabwe, mid-November 2008',monthlyPercent:7.96e10,doublingHours:24.7,index:'exchange-rate-implied estimate (Old Mutual parity)'}];
export const hyperPath=(row,days)=>Math.exp(Math.log1p(row.monthlyPercent/100)*days/30);
export function inventory(pi,C,Y=1200,b=.5,r=.02){const i=r+pi,opt=Math.sqrt(2*b*Y/i);return{trips:Y/C,transaction:b*Y/C,opportunity:i*C/2,total:b*Y/C+i*C/2,opt,min:Math.sqrt(2*b*Y*i)};}
export function liquidity(M,P,Y,k=.5,h=5){const m=M/P,threshold=k*Y,raw=Math.log(threshold/m)/h;return{m,threshold,i:Math.max(0,raw),raw,excess:Math.max(0,m-threshold),demand:i=>threshold*Math.exp(-h*i)};}
