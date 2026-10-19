import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as M from '../assets/js/viz/math.js';
import { ellProj,ellFT,makeScan,sinoEll,fbp,artSweep,sirtStep,sartSweep,buildSystem,forward } from '../content/imaging/ch03.shared.js';
import { twoTissue,plasma } from '../content/imaging/ch04.shared.js';
import camera from '../content/imaging/ch04.js';
import pet from '../content/imaging/ch04-c.js';

const close=(x,y,t=1e-10)=>assert.ok(Math.abs(x-y)<t,`${x} versus ${y}`);
test('Fourier slice agrees with independent numerical integration of translated rotated ellipse projections',()=>{
  const E=[[1.3,.7,.36,.2,-.15,37],[-.2,.2,.1,-.3,.25,10]],N=60000,ds=3/N;
  for(const th of [0,.41,1.83])for(const w of [0,.7,2.3]){
    let re=0,im=0;for(let j=0;j<N;j++){const s=-1.5+(j+.5)*ds,p=ellProj(E,th,s)*ds;re+=p*Math.cos(2*Math.PI*w*s);im-=p*Math.sin(2*Math.PI*w*s)}
    const F=ellFT(E,w*Math.cos(th),w*Math.sin(th));close(re,F[0],6e-7);close(im,F[1],6e-7);
  }
});
test('Ram-Lak reconstruction recovers the unit density of a uniform disc without arbitrary image renormalization',()=>{
  const sc=makeScan(150,256),W=64,im=fbp(sinoEll([[1,.7,.7,0,0,0]],sc),sc,W,W);
  for(let j=0;j<W;j++)for(let i=0;i<W;i++)if(Math.hypot(-1+(i+.5)*2/W,1-(j+.5)*2/W)<.5)close(im[j*W+i],1,.012);
});
test('Relaxed ART satisfies the exact distance reduction identity for a consistent hyperplane',()=>{
  const sys={rows:[{idx:[0,1],val:[2,-1],ss:5,sum:1}]},z=[.4,-.7],b=[1.5];
  for(const lam of [.1,1,1.9]){const x=[-2,.3],d0=x.reduce((s,t,i)=>s+(t-z[i])**2,0),r=b[0]-(2*x[0]-x[1]);artSweep(sys,b,x,lam);close(x.reduce((s,t,i)=>s+(t-z[i])**2,0),d0-lam*(2-lam)*r*r/5)}
});
test('Normalized SIRT converges to the independently solved row-weighted least-squares solution',()=>{
  const A=[[1,2],[3,1],[1,1]],b=[1,4,3],R=A.map(a=>1/(a[0]+a[1]));
  const H=[[0,0],[0,0]],g=[0,0];A.forEach((a,k)=>{for(let i=0;i<2;i++){g[i]+=a[i]*R[k]*b[k];for(let j=0;j<2;j++)H[i][j]+=a[i]*R[k]*a[j]}});
  const D=H[0][0]*H[1][1]-H[0][1]*H[1][0],want=[(g[0]*H[1][1]-g[1]*H[0][1])/D,(H[0][0]*g[1]-H[1][0]*g[0])/D];
  const sys={N:3,rows:A.map(a=>({idx:[0,1],val:a,sum:a[0]+a[1]}))};
  for(const lam of [.5,1.9]){const x=[0,0,7],cache={};for(let k=0;k<1200;k++)sirtStep(sys,b,x,lam,cache);close(x[0],want[0]);close(x[1],want[1]);assert.equal(x[2],7)}
});
test('SART row and column normalization reconstructs a constant from one complete view',()=>{
  const sys=buildSystem(12,1,18),b=forward(sys,new Float64Array(sys.N).fill(2.7)),x=new Float64Array(sys.N);sartSweep(sys,b,x);
  const covered=new Set(sys.rows.flatMap(r=>Array.from(r.idx)));for(const j of covered)close(x[j],2.7);
});
function integrateTissue(K1,k2,k3,k4,tEnd,dt=.001){
  let c=[0,0,0];const f=(t,z)=>[K1*plasma(t)-(k2+k3)*z[0]+k4*z[1],k3*z[0]-k4*z[1],plasma(t)];
  for(let n=0;n<Math.round(tEnd/dt);n++){const t=n*dt,a=f(t,c),b=f(t+dt/2,c.map((x,i)=>x+dt*a[i]/2)),d=f(t+dt/2,c.map((x,i)=>x+dt*b[i]/2)),e=f(t+dt,c.map((x,i)=>x+dt*d[i]));c=c.map((x,i)=>x+dt*(a[i]+2*b[i]+2*d[i]+e[i])/6)}return c;
}
test('Two-tissue convolution agrees with independent RK4 compartment dynamics, including reversible and repeated-root cases',()=>{
  for(const p of [[.1,.13,.06,0],[.3,.04,.2,.08],[.1,.1,0,.1]]){
    const ref=integrateTissue(...p,15),m=twoTissue(...p,.04,15,.005);close(m.ct.at(-1),ref[0]+ref[1]+.04*plasma(15),.0002);
  }
});
test('Exact irreversible Patlak identity retains its transient compartment contribution',()=>{
  const K1=.1,k2=.13,k3=.06,a=k2+k3,Ki=K1*k3/a;
  for(const t of [.5,3,20]){const [C1,C2,I]=integrateTissue(K1,k2,k3,0,t);close(C1+C2,Ki*I+k2/a*C1,1e-11);assert.ok(C1>0)}
});
function run(item,values={}){
  const stages=[],controls=[];let draw,read;
  const control=(label,min,max,value)=>{const q={value:values[label]??value,set(x){this.value=x}};controls.push(q);return q};
  const v={M,legend(){},button(){},select(label,options,value){return control(label,0,0,value)},slider:control,render(f){draw=f},readout(f){read=f},stage(options){const calls=[];const s=new Proxy({calls,options,handle(x,y){return{x,y,set(a,b){this.x=a;this.y=b}}}},{get(t,k){return k in t?t[k]:(...args)=>{calls.push([k,...args]);return s}}});stages.push(s);return s}};
  item.viz(v);draw();return{stages,text:read()};
}
test('Actual collimator plot has sensitivity slopes strictly between two and four at fixed septal thickness',()=>{
  const {stages,text}=run(camera.items.find(i=>i.num==='4.4'));const p=stages[2].calls.find(q=>q[0]==='path')[1];
  for(let i=1;i<p.length;i++){const slope=Math.log(p[i][1]/p[i-1][1])/Math.log(p[i][0]/p[i-1][0]);assert.ok(slope>2&&slope<4)}assert.match(text,/doubling/);
});
test('Actual Patlak plasma/tissue panel sets its scale before drawing and contains high-rate noisy frames',()=>{
  const {stages}=run(pet.items.find(i=>i.num==='4.10'),{'$K_1$ (mL/g/min)':.3,'$k_2$ (1/min)':.04,'$k_3$ (1/min)':.2,'noise (%)':25});
  const c=stages[0].calls;assert.equal(c[0][0],'setView');const ymax=c[0][2][1];assert.ok(ymax>50);
  for(const q of c)if(q[0]==='path')for(const p of q[1])assert.ok(p[1]<ymax);else if(q[0]==='dot')assert.ok(q[2]<ymax);
});
