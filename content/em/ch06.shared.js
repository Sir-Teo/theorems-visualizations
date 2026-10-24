// Electric current: pure models, SI units unless a function explicitly uses normalized units.
export const EPS=8.8541878128e-12, QE=1.602176634e-19, ME=9.1093837139e-31, C0=299792458;
export const dense=a=>Array.isArray(a)&&Array.from({length:a.length},(_,i)=>Object.hasOwn(a,i)).every(Boolean);
const finite=(...xs)=>xs.every(Number.isFinite);
function require(ok,message){if(!ok)throw Error(message);}
export function rng(seed){let z=seed>>>0;return()=>{z=(Math.imul(z,1664525)+1013904223)>>>0;return(z+.5)/4294967296;};}
export function pipe(a,I,x,y=0){
  require(finite(a,I,x,y)&&a>=0&&a<=.8,'Use a narrowing between 0 and 0.8.');
  const k=Math.PI/2,w=1-a*Math.cos(k*(x-2)),dw=a*k*Math.sin(k*(x-2));
  return {w,dw,J:[I/(2*w),I*y*dw/(2*w*w)],psi:I*y/(2*w),area:2*w,cutCurrent:I};
}
export function continuity(u,w,t,box=[.5,2.5,.5,2.5]){
  require(dense(box)&&box.length===4&&finite(u,w,t,...box)&&box[0]<box[1]&&box[2]<box[3],'Use a positive-area finite box.');
  const k=Math.PI/2,a=.6,b=.4,[x0,x1,y0,y1]=box;
  const f=x=>1+a*Math.cos(k*(x-u*t)),g=y=>1+b*Math.cos(k*(y-w*t));
  const fx=x=>-a*k*Math.sin(k*(x-u*t)),gy=y=>-b*k*Math.sin(k*(y-w*t));
  const X=x1-x0+a/k*(Math.sin(k*(x1-u*t))-Math.sin(k*(x0-u*t)));
  const Y=y1-y0+b/k*(Math.sin(k*(y1-w*t))-Math.sin(k*(y0-w*t)));
  const sides=[-u*f(x0)*Y,u*f(x1)*Y,-w*g(y0)*X,w*g(y1)*X];
  const derivative=-u*(f(x1)-f(x0))*Y-w*(g(y1)-g(y0))*X;
  return {rho:(x,y)=>f(x)*g(y),J:(x,y)=>[u*f(x)*g(y),w*f(x)*g(y)],rhoT:(x,y)=>-u*fx(x)*g(y)-w*f(x)*gy(y),divJ:(x,y)=>u*fx(x)*g(y)+w*f(x)*gy(y),charge:X*Y,sides,flux:sides.reduce((s,x)=>s+x,0),derivative};
}
export function ohmic(E,sigma,beta=0){require(finite(E,sigma,beta)&&sigma>0&&beta>=0,'Use positive conductivity and nonnegative curvature.');return{J:sigma*E*(1+beta*E*E),slope:sigma*(1+3*beta*E*E),power:sigma*E*E*(1+beta*E*E)};}
// Memoryless collisions reset velocity to a uniformly random direction of unit speed.
// Time is t/tau, acceleration is q E tau/(m v_thermal), and position is in v_thermal*tau.
export function drude(accel,time,seed=7,count=256){
  require(finite(accel,time)&&Math.abs(accel)<=3&&time>=0&&time<=8&&Number.isInteger(seed)&&seed>=0&&seed<=10000&&Number.isInteger(count)&&count>=1&&count<=2048,'Drude sample lies outside its bounded domain.');
  const particles=[];let collisions=0;
  for(let i=0;i<count;i++){
    let key=(seed^Math.imul(i+1,0x9e3779b9))>>>0;key=Math.imul(key^(key>>>16),0x21f0aaad);key=Math.imul(key^(key>>>15),0x735a2d97);
    const random=rng((key^(key>>>15))>>>0);
    let angle=2*Math.PI*random(),vx=Math.cos(angle),vy=Math.sin(angle),x=0,y=0,t=0,next=-Math.log(random()),hits=0;
    while(next<time){const dt=next-t;x+=vx*dt+.5*accel*dt*dt;y+=vy*dt;vx+=accel*dt;t=next;angle=2*Math.PI*random();vx=Math.cos(angle);vy=Math.sin(angle);hits++;next+=-Math.log(random());}
    const dt=time-t;x+=vx*dt+.5*accel*dt*dt;y+=vy*dt;vx+=accel*dt;collisions+=hits;particles.push({x,y,vx,vy,hits});
  }
  const mean=particles.reduce((s,p)=>s+p.vx,0)/count,variance=count>1?particles.reduce((s,p)=>s+(p.vx-mean)**2,0)/(count-1):0;
  return{particles,mean,expected:accel*(-Math.expm1(-time)),standardError:count>1?Math.sqrt(variance/count):null,collisions,steady:accel};
}
export function wire(rho,L,A){require(finite(rho,L,A)&&rho>0&&L>0&&A>0,'Wire parameters must be positive.');return{R:rho*L/A,volume:L*A,rho,L,A};}
export function heating(R,drive,mode,t,capacity=10,loss=.5){
  require(finite(R,drive,t,capacity,loss)&&R>0&&t>=0&&capacity>0&&loss>=0&&['voltage','current'].includes(mode),'Invalid thermal model parameters.');
  const I=mode==='voltage'?drive/R:drive,V=I*R,P=I*V,u=loss*t/capacity;
  const rise=loss===0?P*t/capacity:P/loss*(-Math.expm1(-u)),stored=capacity*rise,input=P*t;
  // Avoid subtracting nearly equal input and stored energies at tiny times.
  const h=u<.01?u*u*(.5+u*(-1/6+u*(1/24+u*(-1/120+u/720)))):u+Math.expm1(-u);
  const released=loss===0?0:P*capacity/loss*h;
  return{I,V,P,rise,stored,input,released,tau:loss===0?Infinity:capacity/loss};
}
export function battery(emf,R,r){require(finite(emf,R,r)&&R>0&&r>=0,'Use positive load and nonnegative internal resistance.');const I=emf/(R+r);return{I,terminal:I*R,internalDrop:I*r,loadPower:I*I*R,internalPower:I*I*r,sourcePower:emf*I,potential:[0,emf,emf-I*r,0]};}

export const BRIDGE=[[0,1,1],[1,3,2],[0,2,2],[2,3,1],[1,2,1]];
export function checkedEdges(edges){
  require(dense(edges)&&edges.length>=1&&edges.length<=64,'Use 1–64 resistor triples [node, node, ohms].');
  for(const e of edges)require(dense(e)&&e.length===3&&finite(...e)&&e.slice(0,2).every(x=>Number.isInteger(x)&&x>=0&&x<16)&&e[0]!==e[1]&&e[2]>=.1&&e[2]<=20,'Nodes must be distinct integers 0–15; each resistance must be 0.1–20 Ω.');
  const n=1+Math.max(...edges.flatMap(e=>e.slice(0,2))),seen=new Set([0]);let last=-1;
  while(last!==seen.size){last=seen.size;for(const [a,b] of edges){if(seen.has(a))seen.add(b);if(seen.has(b))seen.add(a);}}
  require(seen.size===n,'Use a connected network with consecutive node IDs starting at 0.');
  return edges.map(e=>e.slice());
}
// Ground b and solve L v = e_a - e_b using diagonal-preconditioned conjugate gradients.
// The residual is explicitly recomputed before accepting a solution; no budget implies success.
export function solveNetwork(edges,a=0,b=3,injection=1){
  require(dense(edges)&&edges.length>0&&edges.every(e=>dense(e)&&e.length===3&&e.slice(0,2).every(x=>Number.isInteger(x)&&x>=0)&&e[0]!==e[1]&&Number.isFinite(e[2])&&e[2]>0),'Invalid resistor network.');
  const n=1+Math.max(...edges.flatMap(e=>e.slice(0,2)));
  require(n<=625&&Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0&&a<n&&b<n&&a!==b&&finite(injection),'Choose two distinct existing terminals.');
  const adjacency=Array.from({length:n},()=>[]),diagonal=Array(n).fill(0);
  for(const [u,v,R] of edges){adjacency[u].push([v,1/R]);adjacency[v].push([u,1/R]);diagonal[u]+=1/R;diagonal[v]+=1/R;}
  const seen=new Set([b]),queue=[b];for(let k=0;k<queue.length;k++)for(const [j] of adjacency[queue[k]])if(!seen.has(j)){seen.add(j);queue.push(j);}
  require(seen.size===n,'The resistor network must be connected.');
  const dot=(x,y)=>x.reduce((s,z,i)=>s+z*y[i],0),apply=x=>adjacency.map((es,i)=>i===b?x[b]:es.reduce((s,[j,c])=>s+c*(x[i]-(j===b?0:x[j])),0));
  const volts=Array(n).fill(0),rhs=Array(n).fill(0);rhs[a]=1;
  let residual=rhs.slice(),z=residual.map((r,i)=>i===b?0:r/diagonal[i]),p=z.slice(),rz=dot(residual,z),iterations=0;
  for(;iterations<4*n&&Math.sqrt(dot(residual,residual))>2e-13;iterations++){
    const Ap=apply(p),denom=dot(p,Ap);require(denom>0&&Number.isFinite(denom),'Network solver lost positive definiteness.');const alpha=rz/denom;
    for(let i=0;i<n;i++){volts[i]+=alpha*p[i];residual[i]-=alpha*Ap[i];}
    z=residual.map((r,i)=>i===b?0:r/diagonal[i]);const next=dot(residual,z),beta=next/rz;for(let i=0;i<n;i++)p[i]=z[i]+beta*p[i];rz=next;
  }
  const actualResidual=apply(volts).map((x,i)=>rhs[i]-x),residualL2=Math.hypot(...actualResidual);
  require(residualL2<1e-9,'Network solve did not converge; no result is displayed.');
  const resistance=volts[a],potentials=volts.map(x=>x*injection),currents=edges.map(([u,v,R])=>(potentials[u]-potentials[v])/R),divergence=Array(n).fill(0);
  edges.forEach(([u,v],i)=>{divergence[u]+=currents[i];divergence[v]-=currents[i];});
  const power=currents.reduce((s,I,i)=>s+I*I*edges[i][2],0),sourcePower=injection*(potentials[a]-potentials[b]);
  return{n,edges,adjacency,potentials,currents,divergence,resistance,power,sourcePower,iterations,residualL2,a,b,injection};
}
export function thomson(bridgeR,circulation,injection=1){
  require(finite(bridgeR,circulation,injection)&&bridgeR>0,'Invalid flow parameters.');
  const edges=BRIDGE.map(e=>e.slice());edges[4][2]=bridgeR;const solution=solveNetwork(edges,0,3,injection),h=[circulation,circulation,-circulation,-circulation,0],trial=solution.currents.map((x,i)=>x+h[i]);
  const power=trial.reduce((s,x,i)=>s+x*x*edges[i][2],0),excess=h.reduce((s,x,i)=>s+x*x*edges[i][2],0),cross=2*h.reduce((s,x,i)=>s+x*edges[i][2]*solution.currents[i],0);
  return{...solution,h,trial,trialPower:power,excess,cross};
}
export function interfaceCurrent(s1,s2,Et,En1,e1=1,e2=1){
  require(finite(s1,s2,Et,En1,e1,e2)&&s1>0&&s2>0&&e1>0&&e2>0,'Conductivities and permittivities must be positive.');
  const En2=s1/s2*En1;return{E1:[Et,En1],E2:[Et,En2],J1:[s1*Et,s1*En1],J2:[s2*Et,s2*En2],sheet:EPS*(e2*En2-e1*En1),potential:(x,y)=>-Et*x-(y<0?En1:En2)*y};
}
export function relaxation(Q0,sigma,epsilon,time,radius=1){
  require(finite(Q0,sigma,epsilon,time,radius)&&sigma>=0&&epsilon>0&&time>=0&&radius>0,'Invalid relaxation parameters.');
  const u=sigma*time/epsilon,bulk=Q0*Math.exp(-u),surface=Q0*(-Math.expm1(-u)),rho=bulk/(4*Math.PI*radius**3/3);
  return{bulk,surface,rho,tau:sigma===0?Infinity:epsilon/sigma,current:sigma*bulk/epsilon,field:r=>r<radius?rho*r/(3*epsilon):Q0/(4*Math.PI*EPS*r*r)};
}
export function rc(R,C,Vs,V0,time){
  require(finite(R,C,Vs,V0,time)&&R>0&&C>0&&time>=0,'Use positive R, C and nonnegative time.');
  const u=time/(R*C),delta=Vs-V0,g=-Math.expm1(-u),V=V0+delta*g,I=delta/R*Math.exp(-u),heat=.5*C*delta*delta*(-Math.expm1(-2*u)),work=Vs*C*delta*g,storedChange=C*V0*delta*g+.5*C*delta*delta*g*g;
  return{V,I,Q:C*V,tau:R*C,heat,work,storedChange,energy:.5*C*V*V};
}
export function signal(er,length,V,Z,area,time,n=8.5e28){
  require(finite(er,length,V,Z,area,time,n)&&er>=1&&length>0&&Z>0&&area>0&&time>=0&&n>0,'Invalid matched-line parameters.');
  const speed=C0/Math.sqrt(er),I=V/Z,drift=-I/(n*QE*area),delay=x=>x*Math.sqrt(er)/C0,flight=delay(length);
  return{speed,I,drift,flight,front:length*Math.min(1,time/flight),arrival:time>=flight,displacement:x=>time<=delay(x)?0:drift*(time-delay(x)),voltage:x=>time>=delay(x)?V:0,L:Z/speed,C:1/(Z*speed)};
}
export function squareGrid(size,dx=1,dy=0){
  require(Number.isInteger(size)&&size>=3&&size<=21&&size%2===1&&Number.isInteger(dx)&&Number.isInteger(dy)&&dx>=0&&dy>=0&&(dx||dy)&&dx<=Math.floor(size/2)&&dy<=Math.floor(size/2),'Use an odd grid 3–21 with distinct in-grid terminals.');
  const edges=[];for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=y*size+x;if(x+1<size)edges.push([i,i+1,1]);if(y+1<size)edges.push([i,i+size,1]);}
  const mid=Math.floor(size/2),a=mid*size+mid,b=(mid+dy)*size+mid+dx;return{...solveNetwork(edges,a,b),size,dx,dy};
}
// Composite Simpson evaluation of Cserti Eq.27. The y=0 value is the analytic limit |dx|.
export function infiniteGrid(dx,dy,steps=1024){
  require(Number.isInteger(dx)&&Number.isInteger(dy)&&Math.abs(dx)<=100&&Math.abs(dy)<=100&&Number.isInteger(steps)&&steps>=16&&steps%2===0,'Invalid lattice integral parameters.');
  const m=Math.abs(dx),n=Math.abs(dy),f=y=>{if(y===0)return m;const z=Math.sin(y/2),s=2*Math.asinh(z),den=2*z*Math.sqrt(1+z*z);return(-Math.expm1(-m*s)+Math.exp(-m*s)*2*Math.sin(n*y/2)**2)/den;};
  const h=Math.PI/steps;let sum=f(0)+f(Math.PI);for(let j=1;j<steps;j++)sum+=(j%2?4:2)*f(j*h);return sum*h/(3*Math.PI);
}
export function walks(network,seed=11,count=1000,budget=200){
  require(Number.isInteger(seed)&&seed>=0&&seed<=10000&&Number.isInteger(count)&&count>=1&&count<=5000&&Number.isInteger(budget)&&budget>=1&&budget<=2000,'Invalid walk sampling limits.');
  const {a,b,adjacency}=network,random=rng(seed),ca=adjacency[a].reduce((s,e)=>s+e[1],0);let success=0,returned=0,censored=0;const paths=[];
  for(let k=0;k<count;k++){let x=a,outcome='censored';const path=[x];for(let j=0;j<budget;j++){const es=adjacency[x],total=es.reduce((s,e)=>s+e[1],0);let u=random()*total;let next=es.at(-1)[0];for(const [y,c] of es){u-=c;if(u<0){next=y;break;}}x=next;if(k<24)path.push(x);if(x===b){success++;outcome='success';break;}if(x===a){returned++;outcome='return';break;}}
    if(outcome==='censored')censored++;if(k<24)paths.push({path,outcome});
  }
  return{success,returned,censored,count,budget,paths,ca,exact:1/(ca*network.resistance),lower:success/count,upper:(success+censored)/count};
}
