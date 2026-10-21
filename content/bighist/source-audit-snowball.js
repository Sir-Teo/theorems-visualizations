import {tridiag} from './ch03.shared.js';

// Authored finite-volume variant of the explicitly cited NASA-TM-82047 preprint.
export const SNOWBALL=Object.freeze({n:24,D:.649,A:203.3,B:2.09,Q:340.25,C:10,s2:-.477,tolerance:1e-8,maxSteps:6000});
export const snowAlbedo=T=>.32+.15*(1-Math.tanh((T+10)/2));
export const snowSolar=age=>1/(1+.4*age/4570);
export function snowGrid(n=24){
  if(!Number.isInteger(n)||n<4||n>96)throw new RangeError('Finite-volume grid4–96 required');
  return Array.from({length:n},(_,i)=>{const a=i/n,b=(i+1)/n;return{x:(a+b)/2,latitude:Math.asin((a+b)/2)*180/Math.PI,S:1+SNOWBALL.s2*.5*((b*b*b-a*a*a)*n-1),left:i?1-a*a:0,right:1-b*b};});
}
export function snowResidual(T,age,logC){
  const n=T.length,g=snowGrid(n),p=SNOWBALL,L=snowSolar(age),F=5.35*Math.LN10*logC;
  return T.map((t,i)=>p.Q*L*g[i].S*(1-snowAlbedo(t))+F-p.A-p.B*t+p.D*n*n*(g[i].left*(i?T[i-1]-t:0)+g[i].right*(i+1<n?T[i+1]-t:0)));
}
export function snowIce(T){
  if(T[0]<-10)return 0;if(T.at(-1)>-10)return 90;
  for(let i=0;i<T.length-1;i++)if(T[i]>=-10&&T[i+1]<-10){const u=(T[i]+10)/(T[i]-T[i+1]);return Math.asin((i+.5+u)/T.length)*180/Math.PI;}
  return 90;
}
export function snowSolve(age,logC,initial='warm',n=24){
  if(!Number.isFinite(age)||age<0||age>1000||!Number.isFinite(logC)||logC<-.5||logC>4.5)throw new RangeError('Declared age/log-forcing domain required');
  const p=SNOWBALL,g=snowGrid(n),L=snowSolar(age),F=5.35*Math.LN10*logC;
  let T=Array.isArray(initial)?initial.slice():Array(n).fill(initial==='warm'?120:initial==='frozen'?-120:NaN);
  if(T.length!==n||T.some(t=>!Number.isFinite(t)||t< -120||t>120))throw new RangeError('Bounded initial climate required');
  const a=g.map(q=>-p.D*n*n*q.left),c=g.map(q=>-p.D*n*n*q.right),b=g.map((q,i)=>p.C+p.B-a[i]-c[i]);let steps=0,residual;
  do{const rhs=T.map((t,i)=>p.C*t+p.Q*L*g[i].S*(1-snowAlbedo(t))+F-p.A);T=tridiag(a,b,c,rhs);steps++;residual=Math.max(...snowResidual(T,age,logC).map(Math.abs));}while(residual>p.tolerance&&steps<p.maxSteps);
  const absorbed=T.map((t,i)=>p.Q*L*g[i].S*(1-snowAlbedo(t))),mean=T.reduce((s,t)=>s+t,0)/n;
  return{age,logC,ratio:10**logC,L,F,n,T,mean,edge:snowIce(T),steps,residual,converged:residual<=p.tolerance,absorbed,globalResidual:absorbed.reduce((s,q)=>s+q,0)/n+F-p.A-p.B*mean,temperature:[[0,T[0]],...g.map((q,i)=>[q.latitude,T[i]]),[90,T.at(-1)]]};
}
const sweeps=new Map();
export function snowSweeps(age){
  if(!Number.isFinite(age)||age<0||age>1000)throw new RangeError('Age0–1000 required');
  if(!sweeps.has(age)){
    const logs=Array.from({length:45},(_,i)=>-.5+5*i/44),cool=[],heat=[];let T='warm';
    for(const x of logs.slice().reverse()){const m=snowSolve(age,x,T);T=m.T;cool.push(m);}
    T='frozen';for(const x of logs){const m=snowSolve(age,x,T);T=m.T;heat.push(m);}
    sweeps.set(age,{cool,heat});if(sweeps.size>16)sweeps.delete(sweeps.keys().next().value);
  }return structuredClone(sweeps.get(age));
}
export function snowballModel(age=700,logC=0,branch='warm'){
  if(!['warm','frozen'].includes(branch))throw new RangeError('Declared initial branch required');
  return{...snowSolve(age,logC,branch),branch,sweeps:snowSweeps(age)};
}
