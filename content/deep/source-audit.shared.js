// Explicit computations for the four source-reviewed optimization/normalization illustrations.
import { rand, hashStr, toyData } from './ch04.shared.js';
export function adaptiveStep(g, state, { kind = 'adam', eta = .1, correction = true, epsilon = 1e-8 } = {}) {
  const t = (state?.t || 0) + 1, old = state || {}, m = [], s = [], rate = [], delta = [];
  g.forEach((x, i) => {
    if (kind === 'ada') { m[i] = x; s[i] = (old.s?.[i] || 0) + x*x; }
    else if (kind === 'rms') { m[i] = x; s[i] = .9*(old.s?.[i] || 0) + .1*x*x; }
    else { m[i] = .9*(old.m?.[i] || 0) + .1*x; s[i] = .999*(old.s?.[i] || 0) + .001*x*x; }
    const c1 = kind === 'adam' && correction ? 1 - .9**t : 1, c2 = kind === 'adam' && correction ? 1 - .999**t : 1;
    rate[i] = eta / (Math.sqrt(s[i]/c2) + epsilon); delta[i] = rate[i]*m[i]/c1;
  });
  return { t, m, s, rate, delta };
}
export function quadraticRun(a, eta, kind, correction = true, N = 100) {
  let w = [1,1], st = null; const pts = [w.slice()], f = [1], re = [], f0 = .5*(a+1); let first = 0;
  for(let t=1;t<=N;t++) {
    const g=[a*w[0],w[1]];
    if(kind==='gd') st={rate:[.9/a,.9/a],delta:g.map(x=>x*.9/a)};
    else st=adaptiveStep(g,st,{kind,eta,correction});
    if(t===1)first=Math.hypot(...st.delta);
    re.push(st.rate.slice()); w=w.map((x,i)=>x-st.delta[i]); pts.push(w.slice()); f.push(.5*(a*w[0]**2+w[1]**2)/f0);
  }
  return {pts,f,re,first};
}
const productExcept=(w,...skip)=>w.reduce((p,x,i)=>skip.includes(i)?p:p*x,1);
export function linearLoss(w,c) {
  const e=productExcept(w)-c, d=w.map((_,i)=>productExcept(w,i));
  return {L:.5*e*e,g:d.map(x=>e*x),H:d.map((x,i)=>d.map((y,j)=>x*y+(i===j?0:e*productExcept(w,i,j))))};
}
export function linearRun(initial,c,{eta=.05,T=1200,budget=1e12}={}) {
  let w=initial.slice(), hit=null, stopped=false; const tr=[w.slice(0,2)], loss=[];
  for(let t=0;t<=T;t++) {
    const {L,g}=linearLoss(w,c);
    if(!Number.isFinite(L)){stopped=true;break;}
    loss.push(L);if(hit===null&&L<1e-3)hit=t;
    if(t===T||L>budget){stopped=L>budget;break;}
    const next=w.map((x,i)=>x-eta*g[i]);
    if(!next.every(Number.isFinite)){stopped=true;break;}
    w=next;if(t%4===3)tr.push(w.slice(0,2));
  }
  if(tr.at(-1).some((x,i)=>x!==w[i]))tr.push(w.slice(0,2));
  const fin=loss.at(-1);return{tr,loss,hit,fin,w,stopped,status:stopped?'stopped':fin<1e-3?'below':'unfinished'};
}
export function eulerPath(field,p,L,a=1) {
  let x=p.slice();const tr=[x.slice()];for(let l=0;l<L;l++){const f=field(...x,l/L,a);x=x.map((v,i)=>v+f[i]/L);tr.push(x.slice());}return tr;
}
export function rk4Path(field,p,a=1,n=800,keep=1) {
  let x=p.slice();const h=1/n,tr=[x.slice()];for(let k=0;k<n;k++){
    const t=k*h,k1=field(...x,t,a),k2=field(...x.map((v,i)=>v+h*k1[i]/2),t+h/2,a),k3=field(...x.map((v,i)=>v+h*k2[i]/2),t+h/2,a),k4=field(...x.map((v,i)=>v+h*k3[i]),t+h,a);
    x=x.map((v,i)=>v+h*(k1[i]+2*k2[i]+2*k3[i]+k4[i])/6);if((k+1)%keep===0||k===n-1)tr.push(x.slice());
  }return tr;
}
export function residualModel() {
  const r=rand(hashStr('resode')),H=6,W1=Array.from({length:H},()=>[r.normal()*1.1,r.normal()*1.1]),bb=Array.from({length:H},()=>r.normal()*.8),wt=Array.from({length:H},()=>r.normal()*1.3),W2=Array.from({length:2},()=>Array.from({length:H},()=>r.normal()*.55));
  const field=(x,y,t,a=1)=>[0,1].map(i=>a*W1.reduce((s,w,j)=>s+W2[i][j]*Math.tanh(w[0]*x+w[1]*y+wt[j]*(t-.5)+bb[j]),0));
  const bounds=a=>({K:a*W1.reduce((s,w,j)=>s+Math.hypot(...w)*Math.hypot(W2[0][j],W2[1][j]),0),F:a*W1.reduce((s,_,j)=>s+Math.hypot(W2[0][j],W2[1][j]),0),T:a*wt.reduce((s,t,j)=>s+Math.abs(t)*Math.hypot(W2[0][j],W2[1][j]),0)});
  const D=toyData('moons',48,{noise:.07,seed:2});return{field,bounds,P0:D.X.map(p=>p.map(x=>x*1.35)),Y:D.Y,parameters:{W1,bb,wt,W2}};
}
export const ODE_DEPTHS=[1,2,3,4,6,8,12,16,24,32,48,64,96,128];
export function residualReference(model,a) {
  const tr=model.P0.map(p=>rk4Path(model.field,p,a,800,20)),ex=tr.map(t=>t.at(-1));
  const discrepancy=Math.max(...model.P0.map((p,i)=>Math.hypot(...rk4Path(model.field,p,a,400,400).at(-1).map((x,j)=>x-ex[i][j]))));
  const err=ODE_DEPTHS.map(L=>model.P0.reduce((s,p,i)=>s+Math.hypot(...eulerPath(model.field,p,L,a).at(-1).map((x,j)=>x-ex[i][j])),0)/model.P0.length);
  return{tr,ex,err,discrepancy};
}
export function centerBatch(X,Y) {
  const mean=[0,1].map(j=>X.reduce((s,p)=>s+p[j],0)/X.length),Xc=X.map(p=>p.map((x,j)=>x-mean[j])),S=[0,1].map(i=>[0,1].map(j=>Xc.reduce((s,p)=>s+p[i]*p[j],0)/X.length));return {X:Xc,Y:Y.slice(),S};
}
export function scaleData() {
  const rr=rand(hashStr('scaleinv')),X=[],Y=[];for(let i=0;i<40;i++){const c=i%2?1:-1;X.push([c*.9+rr.normal()*1.1,c*.5+rr.normal()*1.1]);Y.push(c);}return centerBatch(X,Y);
}
const softplus=z=>Math.max(0,z)+Math.log1p(Math.exp(-Math.abs(z))),sigmoid=z=>z>=0?1/(1+Math.exp(-z)):Math.exp(z)/(1+Math.exp(z));
export function scaleLoss(w,data,{bn=true,epsilon=0,gamma=3}={}) {
  const {X,Y,S}=data,Sw=S.map(row=>row[0]*w[0]+row[1]*w[1]),s2=w[0]*Sw[0]+w[1]*Sw[1]+epsilon,s=Math.sqrt(s2),g=[0,0];let L=0;
  if(bn&&!(s>0))return{L:NaN,g:[NaN,NaN]};
  X.forEach((p,i)=>{const a=p[0]*w[0]+p[1]*w[1],z=bn?gamma*a/s:a,d=-Y[i]*sigmoid(-Y[i]*z)/X.length;L+=softplus(-Y[i]*z)/X.length;for(let j=0;j<2;j++)g[j]+=d*(bn?gamma*(p[j]/s-a*Sw[j]/(s2*s)):p[j]);});return {L,g};
}
export function scaleRun(w0,data,{eta=.05,lambda=0,bn=true,T=400}={}) {
  let w=w0.slice(),pred=w.reduce((s,x)=>s+x*x,0),residual=0;const path=[],nrm=[],loss=[],eff=[],prediction=[];
  for(let t=0;t<=T;t++){
    const {L,g}=scaleLoss(w,data,{bn}),n2=w.reduce((s,x)=>s+x*x,0),dot=w[0]*g[0]+w[1]*g[1];
    if(![L,n2,...g,...w].every(Number.isFinite)||!(n2>0))throw new Error('Numerical range exceeded');
    path.push(w.slice());nrm.push(n2);loss.push(L);eff.push(eta/n2);prediction.push(pred);residual=Math.max(residual,Math.abs(dot)/(1+Math.sqrt(n2)*Math.hypot(...g)));
    if(t===T)break;pred=(1-eta*lambda)**2*pred+eta*eta*(g[0]*g[0]+g[1]*g[1]);w=w.map((x,i)=>(1-eta*lambda)*x-eta*g[i]);
  }return{path,nrm,loss,eff,prediction,residual};
}
export const logRange=(values,floor=1e-16)=>{const logs=values.map(x=>Math.log10(Math.max(floor,x))),lo=Math.min(...logs),hi=Math.max(...logs);return[lo-.3,Math.max(lo+.5,hi+.3)];};
export const positiveRange=values=>{const[lo,hi]=logRange(values);return[10**lo,10**hi];};
export function pathView(paths,pad=.1) {
  const p=paths.flat(),x=p.map(q=>q[0]),y=p.map(q=>q[1]),lo=[Math.min(...x),Math.min(...y)],hi=[Math.max(...x),Math.max(...y)];return[0,1].map(j=>{const d=Math.max(.1,hi[j]-lo[j]);return[lo[j]-pad*d,hi[j]+pad*d];});
}
