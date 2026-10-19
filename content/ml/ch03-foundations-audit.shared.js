// Source-review companions: explicit finite probability worlds and exact integrals.
import { riskTable, clamp, bins } from './ch03.shared.js';
export function categorical(weights,u){let s=0;for(let i=0;i<weights.length-1;i++){s+=weights[i];if(u<s)return i;}return weights.length-1;}
export function finiteRiskWorld(d,eta,G=60){
 const R=riskTable(d,eta,G),mass=R.W.reduce((s,x)=>s+x,0),W=Array.from(R.W,x=>x/mass),cdf=[];let sum=0;for(const w of W)cdf.push(sum+=w);cdf[cdf.length-1]=1;
 const centers=Array.from({length:G},(_,i)=>(i+.5)/G),q=G+1,SAT=new Float64Array(q*q);
 for(let i=0;i<G;i++)for(let j=0;j<G;j++)SAT[(i+1)*q+j+1]=SAT[i*q+j+1]+SAT[(i+1)*q+j]-SAT[i*q+j]+W[i*G+j]*(1-2*R.E[i*G+j]);
 const bound=(v,upper)=>{let lo=0,hi=G;while(lo<hi){const k=(lo+hi)>>1;if(upper?centers[k]<=v:centers[k]<v)lo=k+1;else hi=k;}return lo;};
 const T={...R,W,base:R.base/mass,bayes:R.bayes/mass,risk(h){if(h.t!=='rect')return clamp(R.risk(h)/mass,0,1);const a=bound(h.x0,false),b=bound(h.x1,true),c=bound(h.y0,false),d=bound(h.y1,true);return clamp(this.base+SAT[b*q+d]-SAT[a*q+d]-SAT[b*q+c]+SAT[a*q+c],0,1);},riskCells:f=>clamp(R.riskCells(f)/mass,0,1)};
 T.drawOne=r=>{const u=r();let lo=0,hi=cdf.length-1;while(lo<hi){const k=(lo+hi)>>1;if(u<cdf[k])hi=k;else lo=k+1;}const i=Math.floor(lo/G),j=lo%G;return{x:(i+.5)/G,y:(j+.5)/G,label:r()<R.E[lo]?1:0,index:lo};};
 T.draw=(r,m)=>{const X=new Float64Array(m),Y=new Float64Array(m),L=new Uint8Array(m);for(let i=0;i<m;i++){const p=T.drawOne(r);X[i]=p.x;Y[i]=p.y;L[i]=p.label;}return{X,Y,L,m};};return T;
}
export function splitRiskBins(values,eps,lo,hi,n){const all=bins(values,lo,hi,n);return{all,good:bins(values.filter(x=>x<=eps),lo,hi,n),bad:bins(values.filter(x=>x>eps),lo,hi,n)};}
export const etaLinear=(ys,x)=>{const t=clamp(x,0,1)*(ys.length-1),i=Math.min(ys.length-2,Math.floor(t));return ys[i]*(1-(t-i))+ys[i+1]*(t-i);};
export function exactBayesRisk(ys,pred){
 const cuts=[...new Set([0,1,...ys.map((_,i)=>i/(ys.length-1)),...Array.from({length:pred.length+1},(_,i)=>i/pred.length)])].sort((a,b)=>a-b),parts=[];let L=0,Lb=0,ex=0;
 for(let i=0;i<cuts.length-1;i++){const a=cuts[i],b=cuts[i+1],ea=etaLinear(ys,a),eb=etaLinear(ys,b),p=pred[Math.min(pred.length-1,Math.floor((a+b)/2*pred.length))],cross=(ea-.5)*(eb-.5)<0?a+(.5-ea)*(b-a)/(eb-ea):null,sub=cross===null?[a,b]:[a,cross,b];
  for(let j=0;j<sub.length-1;j++){const x0=sub[j],x1=sub[j+1],e0=etaLinear(ys,x0),e1=etaLinear(ys,x1),e=(e0+e1)/2,bay=e>=.5?1:0,ce=p?1-e:e,cb=bay?1-e:e,w=x1-x0;L+=w*ce;Lb+=w*cb;if(p!==bay)ex+=w*Math.abs(2*e-1);parts.push({x0,x1,bay,p,e0,e1,ce,cb});}
 }return{L,Lb,ex,parts};
}
export function bestCellRule(ys,n){const p=new Uint8Array(n);for(let i=0;i<n;i++){const a=i/n,b=(i+1)/n,cuts=[a,...ys.map((_,j)=>j/(ys.length-1)).filter(x=>x>a&&x<b),b];let E=0;for(let j=0;j<cuts.length-1;j++)E+=(cuts[j+1]-cuts[j])*(etaLinear(ys,cuts[j])+etaLinear(ys,cuts[j+1]))/2;p[i]=E/(b-a)>=.5?1:0;}return p;}
export const loss01=(prediction,truth)=>prediction===truth?0:1;
function dyadic(x){if(x===0)return[0n,0];const b=new ArrayBuffer(8),v=new DataView(b);v.setFloat64(0,x);const z=v.getBigUint64(0),e=Number((z>>52n)&2047n),f=z&((1n<<52n)-1n);return e===0?[f,1074]:[(1n<<52n)+f,1075-e];}
function dyadicNumber(n,q){if(n===0n)return 0;const bits=n.toString(2).length,shift=Math.max(0,bits-53);return Number(n>>BigInt(shift))*2**(shift-q);}
// Exactly 2^b midpoint codes in [0,1]. BigInt retains endpoint errors past display precision.
export function midpointQuantize(x,b){const y=clamp(x,0,1),[num,q]=dyadic(y),N=1n<<BigInt(b);let j=(num<<BigInt(b))/(1n<<BigInt(q));if(j>=N)j=N-1n;const z=2n*j+1n,Q=Math.max(q,b+1),diff=(num<<BigInt(Q-q))-(z<<BigInt(Q-b-1)),abs=diff<0n?-diff:diff;return{value:Number(z)/2**(b+1),error:dyadicNumber(abs,Q),half:2**(-b-1),index:j};}
export const finiteDescriptionBound=(b,d,eps,delta)=>Math.ceil(2*(b*d*Math.LN2+Math.log(2/delta))/(eps*eps));

export function generalLossWorlds(){
 const NU=.15,TH=.43,GK=20,Q=61,zq=Array.from({length:Q},(_,i)=>-5+10*i/(Q-1)),raw=zq.map(z=>Math.exp(-z*z/2)),zs=raw.reduce((a,b)=>a+b,0),zw=raw.map(x=>x/zs);
 const clipMom=mu=>zq.reduce(([a,b],z,i)=>{const y=clamp(mu+.2*z,0,1);return[a+zw[i]*y,b+zw[i]*y*y];},[0,0]);
 const mom={mxx:0,mxy:0,myy:0};for(let i=0;i<200;i++){const x=(i+.5)/200,[a,b]=clipMom(.15+.7*x);mom.mxx+=x*x/200;mom.mxy+=x*a/200;mom.myy+=b/200;}
 const sqRisk=w=>mom.mxx*w*w-2*mom.mxy*w+mom.myy,wOpt=clamp(mom.mxy/mom.mxx,-1,1),gauss=(x,m,s)=>Math.exp(-.5*((x-m)/s)**2)/s;
 const un=Array.from({length:400},(_,i)=>{const x=(i+.5)/400;return .5*gauss(x,.25,.08)+.5*gauss(x,.7,.1);}),sum=un.reduce((a,b)=>a+b,0),dens=un.map(x=>x/sum),pairs=[];
 for(let i=0;i<=GK;i++)for(let j=i;j<=GK;j++)pairs.push([i/GK,j/GK]);
 const kmLoss=(x,c)=>Math.min((x-c[0])**2,(x-c[1])**2),kmRisk=pairs.map(c=>dens.reduce((s,q,i)=>s+q*kmLoss((i+.5)/400,c),0)),kmBest=kmRisk.indexOf(Math.min(...kmRisk)),zoRisk=t=>NU+(1-2*NU)*Math.abs(t-TH);
 const draw=(task,r,m)=>{const X=[],Y=[];for(let i=0;i<m;i++){if(task==='zo'){const x=r();X.push(x);Y.push((r()<NU?1:0)^(x>=TH?1:0));}else if(task==='sq'){const x=(Math.min(199,Math.floor(r()*200))+.5)/200,z=zq[categorical(zw,r())];X.push(x);Y.push(clamp(.15+.7*x+.2*z,0,1));}else{X.push((categorical(dens,r())+.5)/400);Y.push(0);}}return{X,Y};};
 const erm=(task,S)=>{const n=S.X.length;if(task==='zo'){let best=Infinity,bt=0;for(let k=0;k<=GK;k++){const t=k/GK;let e=0;for(let i=0;i<n;i++)e+=Number(Number(S.X[i]>=t)!==S.Y[i]);if(e<best){best=e;bt=t;}}return bt;}if(task==='sq'){let xx=0,xy=0;for(let i=0;i<n;i++){xx+=S.X[i]**2;xy+=S.X[i]*S.Y[i];}return clamp(xy/xx,-1,1);}let best=Infinity,bi=0;for(let k=0;k<pairs.length;k++){let e=0;for(const x of S.X)e+=kmLoss(x,pairs[k]);if(e<best){best=e;bi=k;}}return bi;};
 const risk=(task,h)=>task==='zo'?zoRisk(h):task==='sq'?sqRisk(h):kmRisk[h],bestH=task=>task==='zo'?Math.round(TH*GK)/GK:task==='sq'?wOpt:kmBest,bench=task=>risk(task,bestH(task));
 return{NU,TH,GK,zq,zw,mom,wOpt,sqRisk,dens,pairs,kmBest,kmLoss,kmRisk,zoRisk,draw,erm,risk,bestH,bench};
}
