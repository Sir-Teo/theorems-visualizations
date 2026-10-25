// CIRC6 pure physical models. No DOM or renderer dependency.
import * as Q from './ch06.exact.shared.js';
export {Q};
const positive=(x,name)=>{const n=Q.approximate(x);if(!Number.isFinite(n)||Q.sign(x)<=0)throw Error(name+' must be finite and positive');return x;};
const nonnegative=(x,name)=>{const n=Q.approximate(x);if(!Number.isFinite(n)||Q.sign(x)<0)throw Error(name+' must be finite and nonnegative');return x;};
export const lin=(n,a,b)=>Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1));
export function quantity(q){q=Q.exact(q);const value=Q.approximate(q),sign=Q.sign(q);return{exact:q,value,sign,logMagnitude:Q.logAbs(q),belowRange:sign!==0&&value===0,aboveRange:!Number.isFinite(value)};}
export function seriesParameters({R=1,L=1,C=1}={}){
 nonnegative(R,'R');positive(L,'L');positive(C,'C');
 const lc=Q.mul(L,C),omega=Q.squareRoot(Q.div(1,lc)),Z=Q.squareRoot(Q.div(L,C)),gammaQ=Q.mul(R,Q.exact(Q.squareRoot(Q.div(C,L)))),gamma=Q.approximate(gammaQ),delta=Q.sub(Q.mul(Q.mul(R,R),C),Q.mul(4,L)),sign=Q.sign(delta),alphaQ=Q.div(R,Q.mul(2,L));
 let roots;
 if(sign<0){const imaginary=Q.squareRoot(Q.div(Q.neg(delta),Q.mul(4,Q.mul(Q.mul(L,L),C)))),real=-Q.approximate(alphaQ);roots=[[real,imaginary],[real,-imaginary]];}
 else if(sign===0){const real=-Q.approximate(alphaQ);roots=[[real,0],[real,0]];}
 else{const gap=Q.squareRoot(Q.div(delta,C)),sum=Q.add(R,gap);roots=[[-Q.approximate(Q.div(2,Q.mul(C,sum))),0],[-Q.approximate(Q.div(sum,Q.mul(2,L))),0]];}
 return{R,L,C,omega,Z,gamma,gammaQ,alpha:quantity(alphaQ),zeta:quantity(Q.div(gammaQ,2)),discriminant:delta,regime:sign<0?'underdamped':sign===0?'critical':'overdamped',roots,strictlyStable:Q.sign(R)>0,coordinateHalfPlaneResolved:Q.sign(R)===0||roots.every(p=>p[0]<0)};
}
const sinc=x=>Math.abs(x)<1e-4?1-x*x/6+x**4/120-x**6/5040:Math.sin(x)/x;
const exprel=x=>x===0?1:Math.expm1(x)/x;
export function fundamental(gamma,t){
 nonnegative(gamma,'damping');nonnegative(t,'normalized time');const beta=gamma/2;let C,S;
 if(gamma<2){const w=Math.sqrt((1-beta)*(1+beta)),e=Math.exp(-beta*t);S=e*t*sinc(w*t);C=e*Math.cos(w*t);}
 else if(gamma===2){C=Math.exp(-t);S=t*C;}
 else{const d=Math.sqrt((beta-1)*(beta+1)),slow=-1/(beta+d),e=Math.exp(slow*t);S=e*t*exprel(-2*d*t);C=e*(1+Math.exp(-2*d*t))/2;}
 return{C,S,m00:C+beta*S,m01:S,m10:-S,m11:C-beta*S};
}
function smallKernel(gamma,time){
 gamma=Q.exact(gamma);time=Q.exact(time);if(!Q.sign(time))return{B:Q.ZERO,S:Q.ZERO,m11:Q.ONE};
 const a=[Q.ZERO,Q.ZERO],powers=[Q.ONE,time];for(let n=2;n<=10;n++){powers.push(Q.mul(powers.at(-1),time));a.push(n===2?Q.div(1,2):Q.div(Q.neg(Q.add(Q.mul(gamma,Q.mul(n-1,a[n-1])),a[n-2])),n*(n-1)));}
 let B=Q.ZERO,S=Q.ZERO,m11=Q.ZERO;for(let n=2;n<a.length;n++){B=Q.add(B,Q.mul(a[n],powers[n]));S=Q.add(S,Q.mul(n,Q.mul(a[n],powers[n-1])));m11=Q.add(m11,Q.mul(n*(n-1),Q.mul(a[n],powers[n-2])));}return{B,S,m11};
}
export function stepCoefficient(gamma,t){
 const G=Q.exact(gamma),T=Q.exact(t),g=Q.approximate(G),time=Q.approximate(T);if(Q.sign(G)<0||Q.sign(T)<0)throw Error('nonnegative damping and time required');if(!Q.sign(T))return Q.ZERO;
 if(time*(1+g)<1e-6)return smallKernel(G,T).B;
 if(g===0){const sine=Q.exact(Math.sin(time/2));return Q.mul(2,Q.mul(sine,sine));}
 if(time*(1+g)<.5){let a=0,b=0,power=1,sum=0;for(let n=0;n<26;n++){const c=n===0?.5:-(g*(n+1)*b+a)/((n+2)*(n+1));if(n===0){a=0;b=c;power=time*time;sum=c*power;continue;}a=b;b=c;power*=time;sum+=c*power;}return Q.exact(sum);}
 return Q.exact(1-fundamental(g,time).m00);
}
export function normalizedState(gamma,t,{v0=0,j0=0,source=0}={}){
 const G=Q.exact(gamma),T=Q.exact(t),g=Q.approximate(G),time=Q.approximate(T),F=fundamental(g,time),small=time*(1+g)<1e-6?smallKernel(G,T):null,B=small?.B??stepCoefficient(G,T),S=small?.S??Q.exact(F.S),m11=small?.m11??Q.exact(F.m11),difference=Q.sub(source,v0),m00=small?Q.sub(1,B):Q.exact(F.m00),error=Q.add(Q.mul(Q.neg(difference),m00),Q.mul(j0,S)),v=Q.approximate(B)<=.5?Q.add(v0,Q.add(Q.mul(difference,B),Q.mul(j0,S))):Q.add(source,error),j=Q.add(Q.mul(difference,S),Q.mul(j0,m11)),slope=Q.add(Q.mul(difference,m11),Q.mul(j0,Q.neg(Q.add(S,Q.mul(G,m11)))));
 return{v:quantity(v),j:quantity(j),error:quantity(error),currentSlope:quantity(slope),F,step:B};
}
export function seriesState(parameters,t,{v0=0,i0=0,source=1}={}){
 nonnegative(t,'time');const p=parameters.omega?parameters:seriesParameters(parameters),tauQ=Q.mul(t,p.omega),tau=Q.approximate(tauQ),j0=Q.mul(i0,p.Z),z=normalizedState(p.gammaQ,tauQ,{v0,j0,source}),i=Q.div(z.j.exact,p.Z),energy=Q.div(Q.add(Q.mul(p.C,Q.mul(z.v.exact,z.v.exact)),Q.mul(p.L,Q.mul(i,i))),2),loss=Q.mul(p.R,Q.mul(i,i));
 const dv=quantity(Q.div(i,p.C)),di=quantity(Q.div(Q.mul(p.omega,z.currentSlope.exact),p.Z));return{parameters:p,time:t,tau,v:z.v,i:quantity(i),error:z.error,energy:quantity(energy),dissipation:quantity(loss),derivative:{v:dv.value,i:di.value},derivativeQuantity:{v:dv,i:di}};
}
const identity=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>Number(i===j)));
const product=(a,b)=>a.map(row=>b[0].map((_,j)=>row.reduce((sum,x,k)=>sum+x*b[k][j],0)));
export function matrixExponential(A,t=1){
 const n=A.length,norm=Math.max(...A.map(row=>row.reduce((s,x)=>s+Math.abs(x*t),0))),scale=Math.max(0,Math.ceil(Math.log2(Math.max(1,norm)))),B=A.map(row=>row.map(x=>x*t/2**scale));let E=identity(n),term=identity(n);
 for(let k=1;k<=70;k++){term=product(term,B).map(row=>row.map(x=>x/k));E=E.map((row,i)=>row.map((x,j)=>x+term[i][j]));if(Math.max(...term.flat().map(Math.abs))<2e-17)break;}
 for(let k=0;k<scale;k++)E=product(E,E);return E;
}
export function jouleIntegral(parameters,t,{v0=1,i0=0}={}){
 nonnegative(t,'time');const p=parameters.omega?parameters:seriesParameters(parameters);if(!Q.sign(p.R)||!t||(!Q.sign(v0)&&!Q.sign(i0)))return quantity(0);const tauQ=Q.mul(t,p.omega),tau=Q.approximate(tauQ),j0=Q.mul(i0,p.Z),initial=[Q.mul(v0,v0),Q.mul(v0,j0),Q.mul(j0,j0),Q.ZERO],A=[[0,2,0,0],[-1,Q.neg(p.gammaQ),1,0],[0,-2,Q.mul(-2,p.gammaQ),0],[0,0,1,0]];let integral;
 if(tau*(1+p.gamma)<1e-5){let term=initial.slice(),sum=initial.slice();for(let k=1;k<=10;k++){term=A.map(row=>Q.div(Q.mul(tauQ,row.reduce((a,x,j)=>Q.add(a,Q.mul(x,term[j])),Q.ZERO)),k));sum=sum.map((x,j)=>Q.add(x,term[j]));}integral=sum[3];}
 else{const E=matrixExponential(A.map(row=>row.map(Q.approximate)),tau);integral=E[3].reduce((sum,x,j)=>Q.add(sum,Q.mul(x,initial[j])),Q.ZERO);}
 if(Q.sign(integral)<0)throw Error('unresolved negative numerical Joule integral');return quantity(Q.div(Q.mul(p.R,integral),Q.mul(p.omega,Q.mul(p.Z,p.Z))));
}
export function fromRoot(real,imaginary,L=1){
 if(!Number.isFinite(real)||real>0||!Number.isFinite(imaginary)||imaginary<=0)throw Error('upper-left nonreal root required');positive(L,'L');const radiusSquared=Q.add(Q.mul(real,real),Q.mul(imaginary,imaginary)),RExact=Q.mul(-2,Q.mul(L,real)),CExact=Q.div(1,Q.mul(L,radiusSquared)),omega=Q.squareRoot(radiusSquared),R=Q.approximate(RExact),C=Q.approximate(CExact);return{real,imaginary,omega,zeta:-real/omega,R,L,C,RExact,CExact,parameters:seriesParameters({R:RExact,L,C:CExact}),roots:[[real,imaginary],[real,-imaginary]]};
}
export function parallelParameters({R=1,L=1,C=1}={}){positive(R,'parallel R');const z=seriesParameters({R:Q.div(L,Q.mul(R,C)),L,C});return{...z,parallelResistance:R,equivalentSeriesResistance:z.R};}
export function parallelState(parameters,t,{v0=0,i0=0,source=1}={}){
 const p=parameters.parallelResistance?parameters:parallelParameters(parameters),initialEquivalentCurrent=Q.div(Q.mul(p.C,v0),p.L),equivalent=seriesState(p,t,{v0:i0,i0:initialEquivalentCurrent,source}),inductor=equivalent.v.exact,voltage=Q.div(Q.mul(p.L,equivalent.i.exact),p.C),energy=Q.div(Q.add(Q.mul(p.C,Q.mul(voltage,voltage)),Q.mul(p.L,Q.mul(inductor,inductor))),2),loss=Q.div(Q.mul(voltage,voltage),p.parallelResistance);
 return{parameters:p,time:t,iL:quantity(inductor),v:quantity(voltage),energy:quantity(energy),dissipation:quantity(loss),derivative:{v:Q.approximate(Q.div(Q.sub(Q.sub(source,Q.div(voltage,p.parallelResistance)),inductor),p.C)),i:Q.approximate(Q.div(voltage,p.L))},equivalent};
}
export function matchedParallelResistance({R,L,C}){positive(R,'matched series R');return quantity(Q.div(L,Q.mul(C,R)));}
export function mechanicalParameters({mass=1,damping=1,stiffness=1}={}){return seriesParameters({R:nonnegative(damping,'damping'),L:positive(mass,'mass'),C:Q.div(1,positive(stiffness,'stiffness'))});}
export function mechanicalState({mass=1,damping=1,stiffness=1,t=0,x0=1,velocity0=0,force=0}={}){
 const parameters=mechanicalParameters({mass,damping,stiffness}),state=seriesState(parameters,t,{v0:Q.mul(stiffness,x0),i0:velocity0,source:force});return{parameters,state,x:quantity(Q.div(state.v.exact,stiffness)),velocity:state.i,energy:state.energy};
}
export function edgeState({R=20,L=10e-9,C=20e-12,rise=200e-12,amplitude=1}={},t=1e-9){
 nonnegative(rise,'rise time');nonnegative(t,'time');if(!Number.isFinite(amplitude))throw Error('finite amplitude required');const p=seriesParameters({R,L,C}),tauQ=Q.mul(t,p.omega),tau=Q.approximate(tauQ),rhoQ=Q.mul(rise,p.omega),rho=Q.approximate(rhoQ);
 if(rise===0){const z=seriesState(p,t,{source:amplitude});return{...z,input:quantity(amplitude),rise,amplitude};}
 const inverse=Q.div(1,rhoQ),A=[[0,1,0,0],[-1,Q.neg(p.gammaQ),1,0],[0,0,Q.neg(inverse),inverse],[0,0,0,0]],numeric=A.map(row=>row.map(Q.approximate)),norm=Math.max(...numeric.map(row=>row.reduce((s,x)=>s+Math.abs(x),0)));let voltage,current;
 if(tau*norm<1e-5){let term=[Q.ZERO,Q.ZERO,Q.ZERO,Q.exact(amplitude)],sum=term.slice();for(let k=1;k<=10;k++){term=A.map(row=>Q.div(Q.mul(tauQ,row.reduce((a,x,j)=>Q.add(a,Q.mul(x,term[j])),Q.ZERO)),k));sum=sum.map((x,j)=>Q.add(x,term[j]));}voltage=sum[0];current=Q.div(sum[1],p.Z);}
 else{const E=matrixExponential(numeric,tau);voltage=Q.mul(amplitude,E[0][3]);if(tau>=1){const error=matrixExponential([[0,1,0],[-1,-p.gamma,1],[0,0,-1/rho]],tau);current=Q.div(Q.mul(amplitude,Q.neg(Q.add(error[1][0],error[1][2]))),p.Z);}else current=Q.div(Q.mul(amplitude,E[1][3]),p.Z);}
 const x=Q.div(t,rise),small=Q.approximate(x),input=Q.mul(amplitude,small===0?x:-Math.expm1(-small));return{parameters:p,time:t,tau,rise,amplitude,input:quantity(input),v:quantity(voltage),i:quantity(current)};
}
export function sampleTimes(p,{horizon,points=301}={}){
 const T=horizon??Math.max(20,8*p.gamma),fast=Math.min(T,12/Math.max(1,p.gamma)),knots=[...lin(points,0,T),...lin(81,0,fast)];return[...new Set(knots)].sort((a,b)=>a-b).map(tau=>tau/p.omega);
}
