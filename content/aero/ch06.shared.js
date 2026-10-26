// AERO6: chosen teaching models, independent of the drawing runtime.
import * as Q from './ch06.exact.shared.js';
export {Q};
const {add,sub,mul,div,neg,sign,approximate:N}=Q;
export const RAD=Math.PI/180, G=9.80665;
export function quantity(x){x=Q.exact(x);const value=N(x),s=sign(x);return{exact:x,value,sign:s,logMagnitude:Q.logAbs(x),belowRange:s!==0&&value===0,aboveRange:!Number.isFinite(value)};}
const q=quantity, sq=x=>mul(x,x), sum=xs=>xs.reduce(add,Q.ZERO);
const bound=(x,a,b,k)=>{if(!Number.isFinite(x)||x<a||x>b)throw Error(k+' outside the declared model range');return x;};
const pick=(x,choices)=>{if(!choices.includes(x))throw Error('unknown model choice');return x;};
export const lin=(n,a,b)=>Array.from({length:n},(_,j)=>a+(b-a)*j/(n-1));
export const identity=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j)));
export const mv=(A,x)=>A.map(r=>r.reduce((s,a,j)=>s+a*x[j],0));
const mm=(A,B)=>A.map(r=>B[0].map((_,j)=>r.reduce((s,a,k)=>s+a*B[k][j],0)));
// Scaling/squaring with a convergent Taylor series; no eigendecomposition is
// used for trajectories, so repeated and defective poles remain meaningful.
export function expm(A,t=1){
 const n=A.length,norm=Math.max(...A.map(r=>r.reduce((s,x)=>s+Math.abs(x*t),0))),scale=Math.max(0,Math.ceil(Math.log2(norm/.25))),B=A.map(r=>r.map(x=>x*t/2**scale));
 let E=identity(n),term=identity(n);
 for(let k=1;k<=32;k++){term=mm(term,B).map(r=>r.map(x=>x/k));E=E.map((r,i)=>r.map((x,j)=>x+term[i][j]));if(Math.max(...term.flat().map(Math.abs))<Number.EPSILON/8)break;}
 for(let j=0;j<scale;j++)E=mm(E,E);return E;
}
export const evolve=(A,x,t)=>mv(expm(A,t),x);
export function history(A,x,horizon,count=121){const E=expm(A,horizon/(count-1));let state=x.slice();return lin(count,0,horizon).map((time,j)=>{if(j)state=mv(E,state);return{time,state:state.slice()};});}
export function poles2(a,b,c,d){
 const tr=add(a,d),det=sub(mul(a,d),mul(b,c)),disc=sub(sq(tr),mul(4,det)),s=sign(disc),trn=N(tr),root=Q.squareRoot(s<0?neg(disc):disc);
 let values;if(s<0)values=[[trn/2,root/2],[trn/2,-root/2]];else{const hi=(trn+(trn>=0?root:-root))/2,lo=hi?N(div(det,hi)):0;values=[[hi,0],[lo,0]];}
 return{values,trace:q(tr),determinant:q(det),discriminant:q(disc),status:sign(det)<0||sign(tr)>0?'unstable':sign(det)===0||sign(tr)===0?'boundary':'asymptotically stable'};
}
export function staticAircraft({cg=.35,tailArea=.25,incidence=-2,alpha=5,elevator=0,deltaAlpha=3}={}){
 bound(cg,.05,.9,'CG / chord');bound(tailArea,0,.5,'tail area ratio');bound(incidence,-8,8,'tail incidence');bound(alpha,-12,12,'angle of attack');bound(elevator,-25,25,'elevator angle');bound(deltaAlpha,-8,8,'gust angle');
 const aw=Q.exact(5),at=Q.exact(4),k=Q.exact(tailArea),b=mul(mul(k,at),.625),A=add(aw,b),hw=.25,ht=2.5,Cmac=-.05,tau=.6,neutral=div(add(mul(aw,hw),mul(b,ht)),A),margin=sub(neutral,cg),cma=neg(mul(A,margin)),wing=mul(aw,mul(alpha,RAD)),tail=mul(mul(k,at),mul(add(add(mul(.625,alpha),incidence),mul(tau,elevator)),RAD)),lift=add(wing,tail),wingMoment=mul(sub(cg,hw),wing),tailMoment=neg(mul(sub(ht,cg),tail)),moment=sum([Cmac,wingMoment,tailMoment]),da=mul(deltaAlpha,RAD),dWing=mul(aw,da),dTail=mul(b,da),dMoment=mul(cma,da);
 return{parameters:{cg,tailArea,incidence,alpha,elevator,deltaAlpha},constants:{aw:5,at:4,downwashSlope:.375,hw,ht,Cmac,tau},slope:q(A),tailSlope:q(b),neutral:q(neutral),margin:q(margin),cma:q(cma),wing:q(wing),tail:q(tail),lift:q(lift),wingMoment:q(wingMoment),tailMoment:q(tailMoment),moment:q(moment),dWing:q(dWing),dTail:q(dTail),dLift:q(mul(A,da)),dMoment:q(dMoment),status:sign(margin)>0?'statically stable':sign(margin)<0?'statically unstable':'neutral first-order pitch stiffness'};
}
export function trimAircraft({targetLift=.6,...p}={}){
 bound(targetLift,.2,1.2,'required lift coefficient');const z=staticAircraft(p),{cg,tailArea,incidence}=z.parameters,{hw,ht,Cmac,tau}=z.constants;
 const tail=div(add(Cmac,mul(sub(cg,hw),targetLift)),sub(ht,hw)),wing=sub(targetLift,tail),alpha=div(wing,mul(5,RAD)),authority=mul(mul(mul(tailArea,4),tau),RAD),compatible=sign(tail)===0;
 if(!sign(authority))return{...z,parameters:{...z.parameters,targetLift},targetLift,trim:{status:compatible?'nonunique elevator; no tail authority':'inconsistent lift / moment targets; no tail authority',alpha:q(alpha),elevator:null,wing:q(wing),tail:q(tail),valid:false}};
 const elevator=div(sub(div(tail,mul(mul(tailArea,4),RAD)),add(mul(.625,alpha),incidence)),tau),valid=Math.abs(N(alpha))<=12&&Math.abs(N(elevator))<=25,trimMoment=sum([Cmac,mul(sub(cg,hw),wing),neg(mul(sub(ht,cg),tail))]);
 return{...z,parameters:{...z.parameters,targetLift},targetLift,trim:{status:valid?'unique trim within the stated angle limits':'algebraic trim outside the stated angle limits',alpha:q(alpha),elevator:q(elevator),wing:q(wing),tail:q(tail),valid,liftResidual:q(sub(add(wing,tail),targetLift)),momentResidual:q(trimMoment)}};
}
export function phugoid({speed=60,liftDrag=15,disturbance=3,time=30}={}){
 bound(speed,25,150,'trim speed');bound(liftDrag,5,40,'lift / drag ratio');bound(disturbance,-6,6,'initial speed perturbation');bound(time,0,240,'time');
 const omega=Math.SQRT2*G/speed,zeta=1/(Math.SQRT2*liftDrag),damping=2*zeta*omega,A=[[-damping,-G,0],[2*G/speed**2,0,0],[0,speed,0]],x0=[disturbance,0,0],state=evolve(A,x0,time),poles=poles2(-damping,-G,2*G/speed**2,0),mechanical=add(mul(speed,state[0]),mul(G,state[2]));
 return{parameters:{speed,liftDrag,disturbance,time},A,x0,state,omega,zeta,period:2*Math.PI/omega,dampedPeriod:2*Math.PI/(omega*Math.sqrt(1-zeta*zeta)),poles,kineticFirst:q(mul(speed,state[0])),potential:q(mul(G,state[2])),mechanicalFirst:q(mechanical),initialFirst:q(mul(speed,disturbance)),relativeDisturbance:Math.abs(disturbance)/speed};
}
export function shortPeriod({stiffness=3,damping=1.2,elevator=-2,pulse=.5,time=2}={}){
 bound(stiffness,.2,8,'pitch stiffness coefficient');bound(damping,.1,4,'pitch damping coefficient');bound(elevator,-4,4,'elevator pulse');bound(pulse,.1,1,'pulse duration');bound(time,0,10,'time');
 // alphaDot=-a alpha+q; qDot=-k alpha-d q-b delta_e. Fixed speed.
 const a=.6,b=2.5,A=[[-a,1,0],[-stiffness,-damping,0],[0,1,0]],forced=[[-a,1,0,0],[-stiffness,-damping,0,-b*elevator*RAD],[0,1,0,0],[0,0,0,0]],at=evolve(forced,[0,0,0,1],Math.min(time,pulse)).slice(0,3),state=time<=pulse?at:evolve(A,at,time-pulse),poles=poles2(-a,1,-stiffness,-damping);
 return{parameters:{stiffness,damping,elevator,pulse,time},A,forced,state,poles,frequency:Math.sqrt(stiffness+a*damping),zeta:(a+damping)/(2*Math.sqrt(stiffness+a*damping))};
}
export function directional({fin=1,beta=6}={}){
 bound(fin,0,2,'fin size');bound(beta,-15,15,'sideslip');const finSlope=mul(.16,fin),bodySlope=-.04,cnb=add(finSlope,bodySlope),side=neg(mul(mul(.08,fin),mul(beta,RAD))),finMoment=mul(finSlope,mul(beta,RAD)),bodyMoment=mul(bodySlope,mul(beta,RAD)),moment=add(finMoment,bodyMoment);
 return{parameters:{fin,beta},cnb:q(cnb),side:q(side),finMoment:q(finMoment),bodyMoment:q(bodyMoment),moment:q(moment),status:sign(cnb)>0?'directionally restoring':sign(cnb)<0?'directionally destabilizing':'neutral first-order yaw stiffness'};
}
function charCoefficients(A){let B=identity(A.length),c=[1];for(let k=1;k<=A.length;k++){const AB=A.map(r=>B[0].map((_,j)=>sum(r.map((a,i)=>mul(a,B[i][j]))))),ck=neg(div(sum(AB.map((r,i)=>r[i])),k));c.push(ck);B=AB.map((r,i)=>r.map((x,j)=>i===j?add(x,ck):x));}return c;}
function isolateSpiral(coeff){
 // For D in[0,3.2], f in[.3,2], P(-1/8)<0<P(1/8).
 // On this interval P' >= c-b/4-1/128 > .2966 >0.
 // Thus there is exactly one real pole in the bracket. Exact rational
 // signs retain the slow mode when a generic matrix eigensolver returns0.
 const evaluate=x=>coeff.reduce((value,c)=>add(mul(value,x),c),Q.ZERO);
 let lo=-.125,hi=.125,fl=evaluate(lo),fh=evaluate(hi),steps=0;
 if(sign(fl)>=0||sign(fh)<=0)throw Error('unresolved slow-pole bracket');
 for(;steps<160;steps++){
  const mid=(lo+hi)/2;if(mid===lo||mid===hi)break;const fm=evaluate(mid),s=sign(fm);
  if(s===0)return{root:mid,bracket:[mid,mid],steps:steps+1};
  if(s<0){lo=mid;fl=fm;}else{hi=mid;fh=fm;}
 }
 const root=sign(sub(sign(fl)<0?neg(fl):fl,sign(fh)<0?neg(fh):fh))<=0?lo:hi;
 return{root,bracket:[lo,hi],steps};
}
export function lateral({dihedral=10,fin=1}={}){
 bound(dihedral,0,16,'wing dihedral');bound(fin,.3,2,'fin scale');const d=div(dihedral,5),Ar=[[Q.rational(-1,5),0,-1,Q.rational(1,10)],[neg(d),-2,Q.rational(2,5),0],[mul(Q.rational(4,5),fin),Q.rational(-1,10),mul(Q.rational(-3,10),fin),0],[0,1,0,0]],coeff=charCoefficients(Ar),[,a,b,c,e]=coeff,D2=sub(mul(a,b),c),D3=sub(mul(D2,c),mul(sq(a),e)),signs=[a,b,c,e,D2,D3].map(sign),stable=signs.every(x=>x>0),boundary=signs.some(x=>x===0)&&signs.every(x=>x>=0);
 const slow=isolateSpiral(coeff);
 return{parameters:{dihedral,fin},A:Ar.map(r=>r.map(N)),coefficients:coeff.map(q),routh2:q(D2),routh3:q(D3),status:stable?'asymptotically stable':boundary?'stability boundary':'unstable',rollBeta:q(neg(d)),spiralBoundary:16/3,spiralPole:q(slow.root),spiralBracket:slow.bracket,spiralIterations:slow.steps};
}
export function feedback({cg=.65,attitudeGain=2,rateGain=1,mode='attitude + rate',time=3,initial=2}={}){
 bound(cg,.05,.9,'CG');bound(attitudeGain,0,5,'attitude gain');bound(rateGain,0,4,'rate gain');bound(time,0,12,'time');bound(initial,-3,3,'initial pitch');pick(mode,['bare airframe','rate only','attitude + rate']);
 const airframe=staticAircraft({cg}),k=mul(2,airframe.cma.exact),d=.4,Ktheta=mode==='attitude + rate'?attitudeGain:0,Kq=mode==='bare airframe'?0:rateGain,stiffness=sub(Ktheta,k),decay=add(d,Kq),A=[[0,1],[N(neg(stiffness)),N(neg(decay))]],x0=[initial*RAD,0],state=evolve(A,x0,time),poles=poles2(0,1,neg(stiffness),neg(decay)),trim=trimAircraft({cg}),tw=trim.trim.wing.exact,tt=trim.trim.tail.exact,drag=add(mul(.04,sq(tw)),div(mul(.04,sq(tt)),.25));
 return{parameters:{cg,attitudeGain,rateGain,mode,time,initial},airframe,A,x0,state,poles,pitchStiffness:q(k),effectiveStiffness:q(stiffness),effectiveDamping:q(decay),momentCommand:q(neg(add(mul(Ktheta,state[0]),mul(Kq,state[1])))),trimDrag:q(drag),trim};
}
export function flutter({speed=14,damping=.15,time=6,initial=.03}={}){
 bound(speed,0,22,'flow-speed parameter');bound(damping,0,.6,'equal modal damping');bound(time,0,12,'time');bound(initial,-.05,.05,'initial bend');const k1=1,k2=9,bar=5,mu=div(sq(speed),64),merge=4,thresholdSquared=add(16,mul(20,sq(damping))),margin=sub(thresholdSquared,sq(mu)),d=mul(2,damping),Ar=[[0,0,1,0],[0,0,0,1],[-1,mu,neg(d),0],[neg(mu),-9,0,neg(d)]],A=Ar.map(r=>r.map(N)),x0=[initial,0,0,0],state=evolve(A,x0,time),delta=sub(16,sq(mu));
 let status;if(damping>0)status=sign(margin)>0?'asymptotically stable':sign(margin)===0?'neutral Hopf boundary':'flutter: exponential growth';else status=sign(delta)>0?'bounded undamped oscillation':sign(delta)===0?'defective coalescence: polynomial growth':'flutter: exponential growth';
 // The two stiffness eigenvalues are 5 ± sqrt(16-mu²). Solve each
 // quadratic lambda²+2 gamma lambda+kappa=0 without subtracting tiny roots.
 const csqrt=([x,y])=>{const r=Math.hypot(x,y);if(x>=0){const u=Math.sqrt((r+x)/2);return[u,u?y/(2*u):0];}const v=(y<0?-1:1)*Math.sqrt((r-x)/2);return[Math.abs(y)/(2*Math.abs(v)),v];},root=sign(delta)>=0?[Q.squareRoot(delta),0]:[0,Q.squareRoot(neg(delta))],values=[];
 for(const s of[-1,1]){const z=csqrt([damping*damping-bar-s*root[0],-s*root[1]]);values.push([-damping+z[0],z[1]],[-damping-z[0],-z[1]]);}
 const workRate=mul(N(mu),sub(mul(state[2],state[1]),mul(state[3],state[0]))),dissipation=mul(d,add(sq(state[2]),sq(state[3]))),energy=div(sum([sq(state[2]),sq(state[3]),sq(state[0]),mul(9,sq(state[1]))]),2);
 return{parameters:{speed,damping,time,initial},A,x0,state,mu:q(mu),mergeSpeed:16,flutterSpeed:8*Math.sqrt(Math.sqrt(N(thresholdSquared))),margin:q(margin),coalescenceMargin:q(delta),poles:values,status,energy:q(energy),aeroPower:q(workRate),dampingPower:q(dissipation),energyRate:q(sub(workRate,dissipation))};
}
export function wright({windError=.15,pressureError=.2,liftError=.5,interference=1,warp=4,elevator=3}={}){
 bound(windError,0,.3,'anemometer overread');bound(pressureError,0,.4,'pressure coefficient overestimate');bound(liftError,0,.8,'table lift-factor overestimate');bound(interference,.6,1,'illustrative interference factor');bound(warp,-8,8,'wing warp');bound(elevator,-10,10,'forward control angle');
 const area=308,wind=17,k=.005,liftFactor=.545,prediction=mul(mul(mul(k,sq(wind)),area),liftFactor),windFactor=div(1,sq(add(1,windError))),pressureFactor=div(1,add(1,pressureError)),liftCorrection=div(1,add(1,liftError)),afterWind=mul(prediction,windFactor),afterPressure=mul(afterWind,pressureFactor),corrected=mul(afterPressure,liftCorrection),final=mul(corrected,interference),deltaLift=mul(.06,warp),rollMoment=mul(2.5,deltaLift),frontLift=mul(.04,elevator),pitchMoment=mul(1.8,frontLift);
 return{parameters:{windError,pressureError,liftError,interference,warp,elevator},historical:{area,wind,k,liftFactor,claimedWeight:240,emptyWeightApprox:100},prediction:q(prediction),afterWind:q(afterWind),afterPressure:q(afterPressure),corrected:q(corrected),final:q(final),deltaLift:q(deltaLift),rollMoment:q(rollMoment),frontLift:q(frontLift),pitchMoment:q(pitchMoment),trueWind:q(div(wind,add(1,windError)))};
}
