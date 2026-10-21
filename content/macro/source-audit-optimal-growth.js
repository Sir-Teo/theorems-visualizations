// Authored source: Acemoglu, MIT14.452, Neoclassical Growth (2020),
// slides25–54,60–62; OLG (2018), slides9–45. No population/technology
// growth in the RCK picture. The OLG picture assumes full depreciation.

const rk4=(F,p,h)=>{
 const a=F(p),b=F(p.map((x,i)=>x+h*a[i]/2)),c=F(p.map((x,i)=>x+h*b[i]/2)),d=F(p.map((x,i)=>x+h*c[i]));
 return p.map((x,i)=>x+h*(a[i]+2*b[i]+2*c[i]+d[i])/6);
};
function step(F,p,h){
 const coarse=rk4(F,p,h),fine=rk4(F,rk4(F,p,h/2),h/2);
 if(!fine.every(x=>Number.isFinite(x)&&x>0)||!coarse.every(x=>Number.isFinite(x)&&x>0))return{ok:false,error:Infinity};
 const error=Math.max(...fine.map((x,i)=>Math.abs(x-coarse[i])/(1e-13+1e-11*Math.max(Math.abs(x),Math.abs(p[i])))))/15;
 return{ok:error<=1,error,p:fine};
}
const nextStep=(h,error,max=1)=>Math.min(max,h*Math.min(2,Math.max(.2,.9*Math.max(error,1e-12)**(-.2))));
function hermite(p,q,s,F){
 const dt=q[0]-p[0],u=(s-p[0])/dt,a=F(p.slice(1)),b=F(q.slice(1));
 return p.slice(1).map((x,i)=>(2*u**3-3*u*u+1)*x+(u**3-2*u*u+u)*dt*a[i]+(-2*u**3+3*u*u)*q[i+1]+(u**3-u*u)*dt*b[i]);
}

export function ramseyGrowthAudit({A=1,alpha=.33,delta=.05,rho=.03,theta=2}={}){
 if(!(A>0&&alpha>0&&alpha<1&&delta>0&&rho>0&&theta>0))throw new RangeError('Positive concave RCK model required');
 const ks=(alpha*A/(delta+rho))**(1/(1-alpha)),kg=(alpha*A/delta)**(1/(1-alpha)),f=k=>A*k**alpha,fp=k=>alpha*A*k**(alpha-1),cs=f(ks)-delta*ks;
 const b=cs/ks,p=delta+rho,Q=(1-alpha)*p*b/theta,lambda=(rho-Math.sqrt(rho*rho+4*Q))/2,slope=(rho-lambda)/b;
 const normalized=([x,y])=>[(p/alpha)*x**alpha-delta*x-b*y,(p/theta)*y*(x**(alpha-1)-1)];
 const backward=z=>normalized(z).map(x=>-x),F=(k,c)=>{const r=normalized([k/ks,c/cs]);return[r[0]*ks,r[1]*cs];};
 const eps=1e-7,xmin=.025,xmax=2*kg/ks;
 // In reverse time the stable direction expands and unstable error contracts.
 // The two seeds use the stable eigenvector; their O(eps²) local error is
 // below the displayed precision. Keep the exact steady state separately.
 function branch(sign){
  let z=[1+sign*eps,1+sign*slope*eps],t=0,h=.25;const out=[[t,...z]];
  for(let iter=0;iter<20000;iter++){
   if(sign<0?z[0]<=xmin:z[0]>=xmax)break;
   const r=step(backward,z,h);
   if(r.ok){t+=h;z=r.p;out.push([t,...z]);}
   h=nextStep(h,r.error,.5);if(h<1e-9)throw new Error('Stable-arm integration stalled');
  }
  if(sign<0?z[0]>xmin:z[0]<xmax)throw new Error('Stable-arm integration did not reach its domain');
  return out;
 }
 const lower=branch(-1),upper=branch(1);
 function atTime(table,t){
  if(t<=0){const sign=table===lower?-1:1,e=sign*eps*Math.exp(-lambda*t);return[1+e,1+slope*e];}
  let lo=0,hi=table.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(table[m][0]<t)lo=m;else hi=m;}
  return hermite(table[lo],table[hi],t,backward);
 }
 function coordinate(k){
  const x=k/ks;if(Math.abs(x-1)<eps){const sign=x<1?-1:1;return{table:sign<0?lower:upper,time:Math.log(Math.abs(x-1)/eps)/(-lambda)};}
  const table=x<1?lower:upper;let lo=0,hi=table.at(-1)[0];
  for(let i=0;i<50;i++){const m=(lo+hi)/2,v=atTime(table,m)[0];if(x<1?v>x:v<x)lo=m;else hi=m;}
  return{table,time:(lo+hi)/2};
 }
 const saddle=k=>{if(Math.abs(k/ks-1)<1e-14)return cs;const{table,time}=coordinate(k);return atTime(table,time)[1]*cs;};
 function stablePath(k0,T=120,dt=.5){
  if(Math.abs(k0/ks-1)<1e-14)return Array.from({length:Math.round(T/dt)+1},(_,i)=>[i*dt,ks,cs]);
  const{table,time}=coordinate(k0),out=[];
  for(let i=0;i<=Math.round(T/dt);i++){const t=i*dt,[x,y]=atTime(table,time-t);out.push([t,x*ks,y*cs]);}
  return out;
 }
 function trajectory(k0,c0,T=120,dt=.5,{kmax=2*kg,cmax=Infinity}={}){
  let z=[k0/ks,c0/cs],t=0,h=.1,status='horizon';const out=[[0,k0,c0]],max=[kmax/ks,cmax/cs],min=1e-8;
  const within=p=>p[0]>min&&p[1]>min&&p[0]<=max[0]&&p[1]<=max[1];
  for(let target=dt;target<=T+1e-9;target+=dt){
   while(t<target-1e-10){
    h=Math.min(h,target-t);const r=step(normalized,z,h);
    if(r.ok){
     if(!within(r.p)){
      let lo=0,hi=h;for(let i=0;i<45;i++){const m=(lo+hi)/2,q=rk4(normalized,z,m);if(q.every(Number.isFinite)&&within(q))lo=m;else hi=m;}
      const q=rk4(normalized,z,lo);t+=lo;out.push([t,q[0]*ks,q[1]*cs]);
      status=q[0]<=min*1.01||q[1]<=min*1.01?'positive-state cutoff':'phase-window boundary';return{pts:out,status};
     }
     t+=h;z=r.p;
    }
    h=nextStep(h,r.error,.5);if(h<1e-9)return{pts:out,status:'integration cutoff'};
   }
   out.push([target,z[0]*ks,z[1]*cs]);
  }
  return{pts:out,status};
 }
 const phase=lower.slice().reverse().filter(q=>q[1]>=xmin).map(q=>[q[1]*ks,q[2]*cs]).concat([[ks,cs]],upper.filter(q=>q[1]<=xmax).map(q=>[q[1]*ks,q[2]*cs]));
 phase.unshift([xmin*ks,saddle(xmin*ks)]);phase.push([xmax*ks,saddle(xmax*ks)]);
 return{A,alpha,delta,rho,theta,f,fp,F,ks,kg,cs,lambda,slope:slope*cs/ks,saddle,stablePath,trajectory,phase,domain:[xmin*ks,xmax*ks]};
}

export function diamondGrowthAudit(alpha,beta,n){
 if(!(alpha>0&&alpha<1&&beta>0&&n>-1))throw new RangeError('Positive OLG parameters required');
 const savingShare=beta/(1+beta),B=savingShare*(1-alpha)/(1+n),ks=B**(1/(1-alpha)),kg=(alpha/(1+n))**(1/(1-alpha));
 const map=k=>B*k**alpha,consumption=k=>k**alpha-(1+n)*k,R=alpha*ks**(alpha-1),c=consumption(ks),cg=consumption(kg);
 // Exact feasible resource gain from reducing capital halfway toward the
 // golden rule. It is a resource allocation witness, not an arbitrary debt policy.
 const cut=ks>kg?(ks-kg)/2:0,reduced=ks-cut,initialGain=(1+n)*cut,laterGain=consumption(reduced)-c;
 const iterate=(k,t)=>ks*Math.exp(alpha**t*Math.log(k/ks));
 return{alpha,beta,n,savingShare,B,ks,kg,map,consumption,R,c,cg,cut,reduced,initialGain,laterGain,iterate};
}
