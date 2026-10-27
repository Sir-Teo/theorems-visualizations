// MATHBIO6: dimensionless teaching models and explicitly measured finite runs.
export const TAU=2*Math.PI,O={step:'any',sig:5,fmt:x=>fmt(x)},I={step:1,int:true};
export const fmt=x=>x===null?'not defined':x===0?'0':Math.abs(x)<1e-4||Math.abs(x)>=1e5?x.toExponential(4):Number(x.toPrecision(5)).toString();
export const sum=a=>a.reduce((s,x)=>s+x,0);
export const lin=(n,a=0,b=1)=>Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1));
export const axes=(title,x,y,extra={})=>({title,x,y,axes:'box',gutter:true,height:320,...extra});
export function finite(x,a,b,name='parameter'){if(typeof x!=='number'||!Number.isFinite(x)||x<a||x>b)throw RangeError(name+' outside its finite domain');return x;}
export function integer(x,a,b,name='integer'){finite(x,a,b,name);if(!Number.isInteger(x))throw RangeError(name+' must be integral');return x;}
export function rk4(fn,x,t,h){const a=fn(t,x),b=fn(t+h/2,x.map((v,i)=>v+h*a[i]/2)),c=fn(t+h/2,x.map((v,i)=>v+h*b[i]/2)),d=fn(t+h,x.map((v,i)=>v+h*c[i]));return x.map((v,i)=>v+h*(a[i]+2*b[i]+2*c[i]+d[i])/6);}
export function integrate(fn,initial,T,dt=.01,save=.1){
 finite(T,0,400,'time');finite(dt,1e-5,.02,'step');finite(save,dt,1,'save interval');if(!Array.isArray(initial)||!initial.length||initial.some(x=>typeof x!=='number'||!Number.isFinite(x)))throw RangeError('finite initial vector required');let x=initial.slice(),t=0;const rows=[[0,...x]],count=Math.ceil(T/save);
 for(let j=1;j<=count;j++){const target=Math.min(T,j*save);while(t<target){const h=Math.min(dt,target-t);if(h<1e-13){t=target;break;}x=rk4(fn,x,t,h);t+=h;if(x.some(v=>!Number.isFinite(v)))throw Error('Nonfinite integration state');}rows.push([target,...x]);}return rows;
}
export function interpolate(rows,t){const end=rows.at(-1)[0];finite(t,0,end,'sample time');if(rows.length===1||t===end)return rows.at(-1).slice(1);let lo=0,hi=rows.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(rows[mid][0]<=t)lo=mid;else hi=mid;}const a=rows[lo],b=rows[hi],u=(t-a[0])/(b[0]-a[0]);return a.slice(1).map((x,i)=>x+u*(b[i+1]-x));}
export function crossings(rows,index=1,level=0,after=0){const out=[];for(let j=1;j<rows.length;j++){const a=rows[j-1],b=rows[j];if(a[0]>=after&&a[index]<level&&b[index]>=level)out.push(a[0]+(b[0]-a[0])*(level-a[index])/(b[index]-a[index]));}return out;}
export function period(rows,index=1,level=0){const ts=crossings(rows,index,level,rows.at(-1)[0]/2),intervals=ts.slice(1).map((t,i)=>t-ts[i]);return{crossings:ts,period:intervals.length?sum(intervals)/intervals.length:null,intervals};}
export function dulacField(x,y,mode='predator–prey',damping=.2){return mode==='rotation'?[-damping*x-y,x-damping*y]:[x*(1-damping*x-y),y*(x-1)];}
export function dulacDiv(x,y,mode='predator–prey',weighted=true,damping=.2){if(mode==='rotation')return-2*damping;return weighted?-damping/y:(1-2*damping)*x-y;}
export function dulacFlux({mode='predator–prey',weighted=true,damping=.2,radius=.6,n=720}={}){
 if(!['rotation','predator–prey'].includes(mode)||typeof weighted!=='boolean')throw RangeError('Dulac mode');finite(damping,0,.8,'damping');finite(radius,.05,.8,'radius');integer(n,64,4096,'quadrature');const center=mode==='rotation'?0:1;let flux=0;
 for(let j=0;j<n;j++){const t=TAU*(j+.5)/n,x=center+radius*Math.cos(t),y=center+radius*Math.sin(t),F=dulacField(x,y,mode,damping),B=mode==='predator–prey'&&weighted?1/(x*y):1;flux+=B*radius*(F[0]*Math.cos(t)+F[1]*Math.sin(t))*TAU/n;}
 const exact=mode==='predator–prey'&&weighted?-TAU*damping*radius*radius/(1+Math.sqrt(1-radius*radius)):-TAU*damping*radius*radius;
 return{flux,exact,criterion:mode==='rotation'||weighted?damping>0?'strictly negative':'zero: inconclusive':damping>=.5?'strictly negative':'changes sign on the positive quadrant'};
}
export function dulacTrajectory(mode,damping,dt=.01){if(!['rotation','predator–prey'].includes(mode))throw RangeError('Dulac mode');finite(damping,0,.8,'damping');if(mode==='rotation')return lin(401,0,20).map(t=>[t,1.5*Math.exp(-damping*t)*Math.cos(t),1.5*Math.exp(-damping*t)*Math.sin(t)]);return integrate((t,[x,y])=>dulacField(x,y,mode,damping),[.6,1.5],40,dt);}
export function vdp(mu=3,dt=.005){finite(mu,.2,8,'μ');const rows=integrate((t,[x,y])=>[mu*(x-x**3/3-y),x/mu],[2,0],80,dt,.02);return{rows,...period(rows),asymptote:mu*(3-2*Math.log(2))};}
export function selkovFacts(a=.1,b=.6){
 finite(a,.02,.12,'a');finite(b,.2,1,'b');const w=a+b*b,d=Math.sqrt(1-8*a),upper=(1+d)/2,lower=4*a/(1+d),trace=-(w-upper)*(w-lower)/w,det=w,Y=b/a+1,X=Y+b+1,yR=X/(2*(a+X*X)),L=X+yR;
 return{equilibrium:[b,b/w],trace,det,low:Math.sqrt(lower-a),high:Math.sqrt(upper-a),polygon:[[0,0],[X,0],[X,yR],[L-Y,Y],[0,Y]],Y,X,yR,L};
}
export const selkovField=(a,b,x,y)=>[-x+(a+x*x)*y,b-(a+x*x)*y];
export function selkov(b=.6,dt=.005){selkovFacts(.1,b);return integrate((t,[x,y])=>selkovField(.1,b,x,y),[1,.25],240,dt);}
export function goodwinFacts(h=20){finite(h,4,24,'Hill exponent');const gain=h/2,r=Math.cbrt(gain),sigma=(gain-8)/(2*(r*r+2*r+4));return{gain,sigma,omega:Math.sqrt(3)*r/2,threshold:16};}
export const goodwinField=(h,[x,y,z])=>[2/(1+z**h)-x,x-y,y-z];
export function goodwin(h=20,dt=.01){goodwinFacts(h);const rows=integrate((t,x)=>goodwinField(h,x),[1.1,.9,1],240,dt);return{rows,...goodwinFacts(h)};}
export function secant(n=3,gain=8){
 integer(n,3,10,'stages');finite(gain,0,20,'loop gain');const critical=n===3?8:n===4?4:Math.cos(Math.PI/n)**(-n),r=gain**(1/n),sigma=gain===0?-1:gain<critical/2?r*Math.cos(Math.PI/n)-1:Math.expm1(Math.log1p((gain-critical)/critical)/n),omega=r*Math.sin(Math.PI/n),uncertain=n>4&&Math.abs(gain-critical)<=128*Number.EPSILON*Math.max(1,gain,critical),status=uncertain?'numerically unresolved':gain===critical?'marginal':gain<critical?'stable':'unstable';
 const eigen=Array.from({length:n},(_,k)=>k===0?[sigma,omega]:k===n-1?[sigma,-omega]:n%2&&k===(n-1)/2?[-1-r,0]:[-1+r*Math.cos((2*k+1)*Math.PI/n),r*Math.sin((2*k+1)*Math.PI/n)]);return{critical,sigma,omega,status,eigen};
}
export function secantMode(n,gain,t){const q=secant(n,gain);finite(t,0,20,'time');return Array.from({length:n},(_,j)=>Math.exp(q.sigma*t)*Math.cos(q.omega*t-Math.PI*j/n));}
export function switchFacts(A=2.5){finite(A,1,3,'feedback gain');if(A<2)return{roots:[0],unstable:null,high:null};const d=Math.sqrt((A-2)*(A+2)),high=(A+d)/2,low=2/(A+d);return{roots:A===2?[0,1]:[0,low,high],unstable:A===2?null:low,high:A===2?null:high};}
export const switchField=(A,input,x)=>input+A*x*x/(1+x*x)-x;
export function feedbackSwitch({A=2.5,input=.4,duration=8,dt=.01}={}){switchFacts(A);finite(input,0,1,'pulse height');finite(duration,0,20,'pulse duration');finite(dt,1e-5,.02,'step');let state=[.05],t=0;const rows=[[0,.05]];for(const [end,u]of [[5,0],[5+duration,input],[60,0]]){if(end===t)continue;const targets=[...lin(601,0,60).filter(x=>x>t&&x<end),end],fn=(t,[x])=>[switchField(A,u,x)];for(const target of targets){while(t<target){const h=Math.min(dt,target-t);if(h<1e-13){t=target;break;}state=rk4(fn,state,t,h);t+=h;}rows.push([target,...state]);}}return{rows,...switchFacts(A)};}

export function excitableRest(){let lo=-3,hi=0;for(let j=0;j<90;j++){const x=(lo+hi)/2;if(.8*x**3/3+.2*x+.7>0)hi=x;else lo=x;}const x=(lo+hi)/2;return[x,(x+.7)/.8];}
export const excitableField=(eps,[x,y])=>[x-x**3/3-y,eps*(x+.7-.8*y)];
export function excitable(kick=1.2,eps=.08,dt=.01){finite(kick,0,3,'kick');finite(eps,.03,.15,'recovery rate');const rest=excitableRest(),rows=integrate((t,x)=>excitableField(eps,x),[rest[0]+kick,rest[1]],200,dt);return{rows,rest,peak:Math.max(...rows.map(r=>r[1])),residual:Math.hypot(rows.at(-1)[1]-rest[0],rows.at(-1)[2]-rest[1])};}
// Exact positive subflows of the chemostatted three-variable Oregonator.
export function oregonX(x,y,h,eps=.08,q=.0008){const b=1-y,D=Math.hypot(b,2*Math.sqrt(q*y)),plus=b>=0?(b+D)/2:2*q*y/(D-b),minus=b-plus,e=Math.exp(-D*h/eps),d=-Math.expm1(-D*h/eps),den=x*d-minus+plus*e;return(x*(plus-minus*e)-plus*minus*d)/den;}
export function oregonSplit(state,h,{eps=.08,delta=.01,q=.0008,f=1}={}){let[x,y,z]=state;x=oregonX(x,y,h/2,eps,q);let target=f*z/(q+x);y=target+(y-target)*Math.exp(-(q+x)*h/(2*delta));z=x+(z-x)*Math.exp(-h);target=f*z/(q+x);y=target+(y-target)*Math.exp(-(q+x)*h/(2*delta));x=oregonX(x,y,h/2,eps,q);return[x,y,z];}
export const oregonField=({eps=.08,delta=.01,q=.0008,f=1},[x,y,z])=>[(q*y-x*y+x*(1-x))/eps,(-q*y-x*y+f*z)/delta,x-z];
export function oregonator({eps=.08,delta=.01,f=1,T=40,tol=2e-9}={}){
 finite(eps,.04,.2,'ε');finite(delta,.002,.02,'δ');finite(f,.7,1.4,'f');finite(T,0,80,'time');finite(tol,1e-10,1e-3,'tolerance');const params={eps,delta,f,q:.0008},rows=[[0,.2,.1,.1]];let state=rows[0].slice(1),t=0,h=.01,accepted=0,rejected=0,maxError=0;const count=Math.ceil(T/.05);
 for(let j=1;j<=count;j++){const target=Math.min(T,j*.05);while(t<target){if(target-t<1e-13){t=target;break;}h=Math.min(h,target-t);const whole=oregonSplit(state,h,params),half=oregonSplit(oregonSplit(state,h/2,params),h/2,params),error=Math.max(...half.map((x,i)=>Math.abs(x-whole[i])/(3*(1e-13+tol*Math.max(x,state[i])))));
 if(!Number.isFinite(error)||half.some(x=>!Number.isFinite(x)||x<0))throw Error('Oregonator integration failed positivity/finiteness');if(error<=1){state=half;t+=h;accepted++;maxError=Math.max(maxError,error);}else rejected++;h*=Math.min(2,Math.max(.2,.85*(error===0?2:error**(-1/3))));h=Math.min(.1,h);if(h<1e-9||accepted+rejected>2000000)throw Error('Oregonator step budget exceeded');}rows.push([target,...state]);}
 return{rows,accepted,rejected,maxError};
}
export function unit(phase){finite(phase,0,1,'phase');const quadrant=Math.round(4*phase),d=phase-quadrant/4,c=Math.cos(TAU*d),s=Math.sin(TAU*d),p=[[c,s],[-s,c],[-c,-s],[s,-c]][quadrant%4];return p.map(x=>x===0?0:x);}

export function phaseReset(phase=.25,amplitude=.3,shear=.5){
 finite(amplitude,0,2,'pulse amplitude');finite(shear,-1,1,'isochron shear');const[c,s]=unit(phase),px=phase>=.375&&phase<=.625?(amplitude-1)+2*Math.sin(Math.PI*(phase-.5))**2:c+amplitude,point=[px,s],radius=Math.hypot(...point);if(radius===0)return{point,radius,newPhase:null,shift:null,infinitesimal:-s-shear*c,recovery:null,degree:null};
 let angle=Math.atan2(point[1],point[0])/TAU;if(amplitude<1&&(angle<0||phase===1))angle+=1;const u=2*amplitude*c+amplitude*amplitude,logRadius=u>-.9?Math.log1p(u)/2:Math.log(radius),geometric=amplitude<1?Math.atan2(-amplitude*s,1+amplitude*c):TAU*(angle-phase),shift=amplitude===0?0:geometric-shear*logRadius;
 let recovery=0;if(radius<.9)recovery=(Math.log1p(-radius*radius)-2*Math.log(radius)-Math.log(1/(.9*.9)-1))/2;else if(radius>1.1)recovery=(Math.log1p(-1/(radius*radius))-Math.log(1-1/(1.1*1.1)))/2;
 return{point,radius,newPhase:amplitude===0?phase:angle-shear*logRadius/TAU,shift,infinitesimal:-s-shear*c,recovery,degree:amplitude===1?null:amplitude<1?1:0};
}
export function radial(radius,t){finite(radius,0,3,'radius');finite(t,0,40,'time');if(radius===0)return 0;const e=Math.exp(-2*t);return radius/Math.sqrt(e+radius*radius*(-Math.expm1(-2*t)));}
export function phaseState(phase,amplitude,shear,t){const z=phaseReset(phase,amplitude,shear);finite(t,0,40,'time');if(t===0)return z.point.slice();if(z.radius===0)return[0,0];const r=radial(z.radius,t),angle=Math.atan2(z.point[1],z.point[0])+t+shear*(Math.log(r)-Math.log(z.radius));return[r*Math.cos(angle),r*Math.sin(angle)];}
export const circleStep=(phase,omega,K)=>phase+omega-K/TAU*Math.sin(TAU*(phase-Math.floor(phase)));
export function circleRun(omega=.5,K=.6,steps=2048,initial=.13){finite(omega,0,1.2,'frequency ratio');finite(K,0,1,'forcing');integer(steps,64,4096,'iterations');finite(initial,0,1,'initial phase');const phases=[initial];for(let j=0;j<steps;j++)phases.push(circleStep(phases.at(-1),omega,K));const estimate=(phases.at(-1)-initial)/steps;return{phases,estimate,low:estimate-1/steps,high:estimate+1/steps};}
export function circleReturn(x,omega,K,p=1,q=2){let at=x,derivative=1;for(let j=0;j<q;j++){derivative*=1-K*Math.cos(TAU*(at-Math.floor(at)));at=circleStep(at,omega,K);}return{residual:at-x-p,multiplier:derivative};}
export function lockedOrbit(omega,K,p=1,q=2){finite(omega,0,1.2,'frequency ratio');finite(K,0,1,'forcing');integer(p,1,2,'numerator');integer(q,1,3,'denominator');if(K===0)return null;const n=360;for(let j=0;j<n;j++){let a=j/n,b=(j+1)/n,fa=circleReturn(a,omega,K,p,q).residual,fb=circleReturn(b,omega,K,p,q).residual;if(fa===0){const z=circleReturn(a,omega,K,p,q);if(z.multiplier<1-1e-9)return{phase:a,...z};}if(fb===0){const z=circleReturn(b,omega,K,p,q);if(z.multiplier<1-1e-9)return{phase:b,...z};}if(fa*fb>0)continue;for(let k=0;k<60;k++){const m=(a+b)/2,fm=circleReturn(m,omega,K,p,q).residual;if((fa<=0)===(fm<=0)){a=m;fa=fm;}else b=m;}const x=(a+b)/2,z=circleReturn(x,omega,K,p,q);if(Math.abs(z.residual)<1e-11&&z.multiplier<1-1e-9)return{phase:x,...z};}return null;}
