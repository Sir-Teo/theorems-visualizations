// ROBOT6 own models: uniform rods, ideal joints, SI units.
// Algebra retains original binary64 factors. Trigonometry and motion geometry
// are approximate; unit-circle parametrization preserves algebraic identities.
import * as Rational from './ch06.exact.shared.js';
export const Q=Rational;
const {exact,add,sub,mul,div,neg,sign,approximate,squareRoot,ZERO}=Q;
const sq=x=>mul(x,x),sum=xs=>xs.reduce(add,ZERO),abs=x=>sign(x)<0?neg(x):exact(x);
const cmp=(a,b)=>sign(sub(a,b)),max=(a,b)=>cmp(a,b)>=0?exact(a):exact(b);
const object=p=>{if(p===undefined)return{};if(!p||typeof p!=='object'||Array.isArray(p))throw Error('parameter object required');return p;};
const range=(p,k,d,lo,hi)=>{const x=p[k]===undefined?d:p[k];if(typeof x!=='number'||!Number.isFinite(x)||x<lo||x>hi)throw Error(k+' outside declared domain');return x;};
const choice=(p,k,d,values)=>{const x=p[k]===undefined?d:p[k];if(!values.includes(x))throw Error(k+' outside declared choices');return x;};
export function quantity(x){const e=exact(x),s=sign(e),value=approximate(e);return{value,sign:s,logMagnitude:Q.logAbs(e),belowRange:s!==0&&value===0,aboveRange:!Number.isFinite(value),exact:e};}
const fields=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,quantity(v)]));
const qv=v=>v.map(quantity),qm=M=>M.map(qv),nv=v=>v.map(approximate),nm=M=>M.map(nv);
const vadd=(a,b)=>a.map((x,i)=>add(x,b[i])),vsub=(a,b)=>a.map((x,i)=>sub(x,b[i]));
const scale=(a,k)=>a.map(x=>mul(x,k)),dot=(a,b)=>sum(a.map((x,i)=>mul(x,b[i])));
const mv=(A,v)=>A.map(r=>dot(r,v)),transpose=A=>A[0].map((_,j)=>A.map(r=>r[j]));
const mm=(A,B)=>A.map(r=>transpose(B).map(c=>dot(r,c)));
const cross2=(a,b)=>sub(mul(a[0],b[1]),mul(a[1],b[0]));
const cross3=(a,b)=>[sub(mul(a[1],b[2]),mul(a[2],b[1])),sub(mul(a[2],b[0]),mul(a[0],b[2])),sub(mul(a[0],b[1]),mul(a[1],b[0]))];
const perp=v=>[neg(v[1]),exact(v[0])];
const det2=M=>sub(mul(M[0][0],M[1][1]),mul(M[0][1],M[1][0]));
const inv2=(M,d=det2(M))=>[[div(M[1][1],d),neg(div(M[0][1],d))],[neg(div(M[1][0],d)),div(M[0][0],d)]];
const quadratic=(M,v)=>dot(v,mv(M,v));
const unitFromHalf=u=>{const d=add(1,sq(u));return{s:div(mul(2,u),d),c:div(sub(1,sq(u)),d)};};
function halfTangent(a){const n=approximate(a);if(Math.abs(n)<1e-8)return exact(a);if(Math.abs(n)<1e-4)return add(a,div(mul(sq(a),a),3));return exact(Math.tan(n));}
export function trigDegrees(degrees){
 let a=exact(degrees),turns=a.n/(360n*a.d);a=sub(a,mul(Q.rational(turns),360));if(cmp(a,180)>0)a=sub(a,360);if(cmp(a,-180)<0)a=add(a,360);
 const sgn=sign(a),u=abs(a),obtuse=cmp(u,90)>0,x=obtuse?sub(180,u):u;
 if(sign(x)===0)return{s:ZERO,c:exact(obtuse?-1:1)};
 if(cmp(x,90)===0)return{s:exact(sgn),c:ZERO};
 const t=unitFromHalf(halfTangent(mul(x,Math.PI/360)));
 return{s:sgn<0?neg(t.s):t.s,c:obtuse?neg(t.c):t.c};
}
function trigRadians(a){a=exact(a);if(sign(a)===0)return{s:ZERO,c:exact(1)};return unitFromHalf(halfTangent(div(a,2)));}
const combined=(a,b)=>({s:add(mul(a.s,b.c),mul(a.c,b.s)),c:sub(mul(a.c,b.c),mul(a.s,b.s))});
const rotateZ=t=>[[t.c,neg(t.s),ZERO],[t.s,t.c,ZERO],[ZERO,ZERO,exact(1)]];
const rotateY=t=>[[t.c,ZERO,t.s],[ZERO,exact(1),ZERO],[neg(t.s),ZERO,t.c]];

function armParameters(input){
 const p=object(input);return{m1:range(p,'m1',2,.5,5),m2:range(p,'m2',1.5,.5,5),l1:range(p,'l1',1,.5,2),l2:range(p,'l2',.8,.5,2),q1:range(p,'q1',25,-180,180),q2:range(p,'q2',70,-180,180),dq1:range(p,'dq1',.8,-8,8),dq2:range(p,'dq2',-.5,-8,8),ddq1:range(p,'ddq1',.4,-12,12),ddq2:range(p,'ddq2',-.7,-12,12),gravity:range(p,'gravity',9.81,0,9.81)};
}
function core(parameters,overrides={}){
 const p=parameters,m1=exact(p.m1),m2=exact(p.m2),l1=exact(p.l1),l2=exact(p.l2),q1=overrides.q1??exact(p.q1),q2=overrides.q2??exact(p.q2),dq=overrides.dq??[exact(p.dq1),exact(p.dq2)],ddq=overrides.ddq??[exact(p.ddq1),exact(p.ddq2)],t1=trigDegrees(q1),t2=trigDegrees(q2),t12=combined(t1,t2);
 const r1=scale([t1.c,t1.s],l1),r2=scale([t12.c,t12.s],l2),c1=scale(r1,.5),c2=scale(r2,.5),elbow=r1,tool=vadd(r1,r2),com1=c1,com2=vadd(r1,c2),I1=div(mul(m1,sq(l1)),12),I2=div(mul(m2,sq(l2)),12);
 const A=add(div(mul(m1,sq(l1)),3),mul(m2,add(sq(l1),div(sq(l2),3)))),B=div(mul(m2,sq(l2)),3),D=div(mul(mul(m2,l1),l2),2),h=mul(D,t2.s),M=[[add(A,mul(mul(2,D),t2.c)),add(B,mul(D,t2.c))],[add(B,mul(D,t2.c)),B]];
 const determinant=mul(mul(sq(l1),sq(l2)),add(div(mul(m1,m2),9),mul(sq(m2),add(div(1,12),div(sq(t2.s),4))))),inverse=inv2(M,determinant);
 const c=[neg(mul(h,add(mul(mul(2,dq[0]),dq[1]),sq(dq[1])))),mul(h,sq(dq[0]))],C=[[neg(mul(h,dq[1])),neg(mul(h,add(dq[0],dq[1])))],[mul(h,dq[0]),ZERO]],Mdot=[[neg(mul(mul(2,h),dq[1])),neg(mul(h,dq[1]))],[neg(mul(h,dq[1])),ZERO]],skew=Mdot.map((r,i)=>r.map((x,j)=>sub(x,mul(2,C[i][j]))));
 const g1=add(mul(m1,div(l1,2)),mul(m2,l1)),g2=mul(m2,div(l2,2)),g=scale([add(mul(g1,t1.c),mul(g2,t12.c)),mul(g2,t12.c)],p.gravity),U=mul(p.gravity,add(mul(g1,t1.s),mul(g2,t12.s))),T=div(quadratic(M,dq),2),inertial=mv(M,ddq),tau=vadd(vadd(inertial,c),g);
 const J=[[neg(tool[1]),neg(r2[1])],[tool[0],r2[0]]],detJ=mul(mul(l1,l2),t2.s),w2=add(dq[0],dq[1]),a2=add(ddq[0],ddq[1]),velocity=mv(J,dq),bias=vadd(scale(r1,neg(sq(dq[0]))),scale(r2,neg(sq(w2)))),acceleration=vadd(mv(J,ddq),bias);
 return{p,m1,m2,l1,l2,q1,q2,dq,ddq,t1,t2,t12,r1,r2,c1,c2,elbow,tool,com1,com2,I1,I2,A,B,D,h,M,determinant,inverse,c,C,Mdot,skew,g,U,T,inertial,tau,J,detJ,w2,a2,velocity,bias,acceleration};
}
function publicArm(s){return{parameters:s.p,geometry:{joints:[[0,0],nv(s.elbow),nv(s.tool)],centres:[nv(s.com1),nv(s.com2)],lengths:[s.p.l1,s.p.l2],approximate:true},q:qv([s.q1,s.q2]),velocity:qv(s.dq),acceleration:qv(s.ddq),mass:qm(s.M),inverseMass:qm(s.inverse),coriolis:qv(s.c),gravityTorque:qv(s.g),inertialTorque:qv(s.inertial),torque:qv(s.tau),toolVelocity:qv(s.velocity),toolAcceleration:qv(s.acceleration),jacobian:qm(s.J),...fields({massDeterminant:s.determinant,kinetic:s.T,potential:s.U,energy:add(s.T,s.U),power:dot(s.tau,s.dq),jacobianDeterminant:s.detJ,massDeterminantResidual:sub(det2(s.M),s.determinant)})};}
export function chainState(input={}){return publicArm(core(armParameters(input)));}

export function prescribedMotion(input={}){
 const p=object(input),base=armParameters(p),parameters={...base,amplitude1:range(p,'amplitude1',25,0,45),amplitude2:range(p,'amplitude2',35,0,45),duration:range(p,'duration',3,.5,4),progress:range(p,'progress',.2,0,1)};
 const phase=trigDegrees(mul(parameters.progress,360)),frequency=div(mul(2,Math.PI),parameters.duration),amps=[parameters.amplitude1,parameters.amplitude2],q=[base.q1,base.q2].map((x,i)=>add(x,mul(amps[i],phase.s))),dq=amps.map(a=>mul(mul(mul(a,Math.PI/180),frequency),phase.c)),ddq=amps.map(a=>neg(mul(mul(mul(a,Math.PI/180),sq(frequency)),phase.s))),s=core(parameters,{q1:q[0],q2:q[1],dq,ddq});
 const kineticRate=add(dot(dq,mv(s.M,ddq)),div(quadratic(s.Mdot,dq),2)),potentialRate=dot(s.g,dq),power=dot(s.tau,dq),skewPower=quadratic(s.skew,dq);
 return{...publicArm(s),parameters,mode:'prescribed inverse dynamics',coriolisMatrix:qm(s.C),massRate:qm(s.Mdot),skewMatrix:qm(s.skew),...fields({kineticRate,potentialRate,energyRate:add(kineticRate,potentialRate),powerResidual:sub(add(kineticRate,potentialRate),power),skewPower,couplingPower:dot(s.c,dq),massRatePower:div(quadratic(s.Mdot,dq),2)})};
}

function eigen2(M,determinant){const a=approximate(M[0][0]),b=approximate(M[0][1]),d=approximate(M[1][1]),hi=(a+d+Math.hypot(a-d,2*b))/2,lo=sign(determinant)?div(determinant,hi):ZERO,angle=.5*Math.atan2(2*b,a-d);return{hi:exact(hi),lo,angle};}
export function massEllipse(input={}){
 const p=object(input),s=core(armParameters(p)),energy=range(p,'energy',2,0,20),direction=range(p,'direction',35,-180,180),e=eigen2(s.M,s.determinant),d=trigDegrees(direction),v=[d.c,d.s],k=squareRoot(div(mul(2,energy),quadratic(s.M,v))),selected=scale(v,k),actual=div(quadratic(s.M,selected),2);
 return{...publicArm(s),parameters:{...s.p,energy,direction},ellipse:{axes:[squareRoot(div(mul(2,energy),e.hi)),squareRoot(div(mul(2,energy),e.lo))],angle:e.angle,units:'rad/s',approximate:true},selectedVelocity:qv(selected),...fields({requestedEnergy:energy,selectedEnergy:actual,energyResidual:sub(actual,energy),lambdaMax:e.hi,lambdaMin:e.lo}),collapsed:energy===0};
}

export function recursiveDynamics(input={}){
 const p=object(input),s=core(armParameters(p)),step=range(p,'step',4,0,4);if(!Number.isInteger(step))throw Error('integer computational step required');
 const ac1=vsub(scale(perp(s.c1),s.ddq[0]),scale(s.c1,sq(s.dq[0]))),ae=vsub(scale(perp(s.r1),s.ddq[0]),scale(s.r1,sq(s.dq[0]))),ac2=vadd(ae,vsub(scale(perp(s.c2),s.a2),scale(s.c2,sq(s.w2)))),fOwn1=scale(vadd(ac1,[ZERO,exact(s.p.gravity)]),s.m1),F2=scale(vadd(ac2,[ZERO,exact(s.p.gravity)]),s.m2),F1=vadd(fOwn1,F2),tau2=add(mul(s.I2,s.a2),cross2(s.c2,F2)),tau1=sum([mul(s.I1,s.ddq[0]),cross2(s.c1,fOwn1),cross2(s.r1,F2),tau2]);
 return{...publicArm(s),parameters:{...s.p,step},phase:['base initialization','outward: link1','outward: link2','inward: link2','inward: link1'][step],linkAngularVelocity:qv([s.dq[0],s.w2]),linkAngularAcceleration:qv([s.ddq[0],s.a2]),centreAcceleration:[qv(ac1),qv(ac2)],jointForce:[qv(F1),qv(F2)],recursiveTorque:qv([tau1,tau2]),torqueResidual:qv(vsub([tau1,tau2],s.tau))};
}

export function taskDynamics(input={}){
 const p=object(input),parameters=armParameters({...p,dq1:p.dq1??0,dq2:p.dq2??0,gravity:p.gravity??0}),s=core(parameters),force=range(p,'force',2,0,10),direction=range(p,'direction',20,-180,180),d=trigDegrees(direction),unit=[d.c,d.s],F=scale(unit,force),A=mm(mm(s.J,s.inverse),transpose(s.J)),detA=div(sq(s.detJ),s.determinant),rank=sign(s.detJ)?2:1,Lambda=rank===2?inv2(A,detA):null,accel=mv(A,F),bias=vsub(s.bias,mv(mm(s.J,s.inverse),vadd(s.c,s.g))),actual=vadd(accel,bias),directionGain=quadratic(A,unit),e=eigen2(A,detA);
 return{...publicArm(s),parameters:{...parameters,force,direction},taskRank:rank,response:qm(A),taskMass:Lambda?qm(Lambda):null,force:qv(F),responseAcceleration:qv(accel),uncompensatedAcceleration:qv(actual),accelerationBias:qv(bias),directionalMass:sign(directionGain)?quantity(div(1,directionGain)):null,responseEllipse:{axes:[approximate(mul(force,e.hi)),approximate(mul(force,e.lo))],angle:e.angle,units:'m/s²',approximate:true},...fields({taskDeterminant:detA,responseDeterminantResidual:sub(det2(A),detA),directionalGain:directionGain,responseEigenMax:e.hi,responseEigenMin:e.lo}),singular:rank!==2};
}

export function gearedDynamics(input={}){
 const p=object(input),s=core(armParameters(p)),parameters={...s.p,ratio1:range(p,'ratio1',30,1,200),ratio2:range(p,'ratio2',30,1,200),rotor1:range(p,'rotor1',.002,0,.02),rotor2:range(p,'rotor2',.002,0,.02),mount:choice(p,'mount','link-mounted',['link-mounted','ground-mounted']),sense:choice(p,'sense',1,[1,-1])},N1=parameters.ratio1,N2=parameters.ratio2,J1=parameters.rotor1,J2=parameters.rotor2,link=parameters.mount==='link-mounted',rotor=[[add(mul(J1,sq(N1)),link?J2:0),link?mul(mul(parameters.sense,J2),N2):ZERO],[link?mul(mul(parameters.sense,J2),N2):ZERO,mul(J2,sq(N2))]],M=s.M.map((r,i)=>r.map((x,j)=>add(x,rotor[i][j]))),det=det2(M),tau=vadd(vadd(mv(M,s.ddq),s.c),s.g),relativeSpeed=[mul(N1,s.dq[0]),mul(mul(parameters.sense,N2),s.dq[1])],absoluteSpeed=[relativeSpeed[0],add(link?s.dq[0]:ZERO,relativeSpeed[1])],motorTorque=[div(tau[0],N1),div(tau[1],mul(parameters.sense,N2))],motorPower=dot(motorTorque,relativeSpeed),jointPower=dot(tau,s.dq),coupling=squareRoot(div(sq(M[0][1]),mul(M[0][0],M[1][1])));
 return{...publicArm(s),parameters,gearedMass:qm(M),addedMass:qm(rotor),requiredTorque:qv(tau),motorTorque:qv(motorTorque),relativeMotorSpeed:qv(relativeSpeed),absoluteMotorSpeed:qv(absoluteSpeed),...fields({gearedDeterminant:det,reflected1:mul(J1,sq(N1)),reflected2:mul(J2,sq(N2)),rotorEnergy:div(quadratic(rotor,s.dq),2),motorPower,jointPower,powerResidual:sub(motorPower,jointPower),relativeCoupling:coupling,ungearedCoupling:squareRoot(div(sq(s.M[0][1]),mul(s.M[0][0],s.M[1][1])))}),ideal:true};
}

function rigidParameters(input){const p=object(input);return{mode:choice(p,'mode','free',['free','wrench']),mass:range(p,'mass',2,1,5),radius:range(p,'radius',.6,.2,1),axialRadius:range(p,'axialRadius',1,.2,1.5),transverseSpin:range(p,'transverseSpin',1.5,0,4),axialSpin:range(p,'axialSpin',2,-4,4),torque:range(p,'torque',.6,-2,2),force:range(p,'force',1,-5,5),time:range(p,'time',.8,0,2)};}
export function rigidBody(input={}){
 const p=rigidParameters(input),Ip=div(mul(p.mass,add(sq(p.radius),sq(p.axialRadius))),5),Iz=div(mul(mul(2,p.mass),sq(p.radius)),5),I=[Ip,Ip,Iz],t=exact(p.time);let R,wb,wd,vb,vd,Fb,mb,position,positionExact,worldVelocity,reference,work,initialEnergy,phase;
 if(p.mode==='free'){
  const Omega=div(mul(sub(Iz,Ip),p.axialSpin),Ip),spin=trigRadians(mul(Omega,t)),L0=[mul(Ip,p.transverseSpin),ZERO,mul(Iz,p.axialSpin)],L=squareRoot(dot(L0,L0)),tilt=Math.atan2(approximate(L0[0]),approximate(L0[2])),R0=rotateY(trigRadians(-tilt));
  R=mm(mm(rotateZ(trigRadians(div(mul(L,t),Ip))),R0),rotateZ(trigRadians(neg(mul(Omega,t)))));wb=[mul(p.transverseSpin,spin.c),mul(p.transverseSpin,spin.s),exact(p.axialSpin)];wd=[neg(mul(Omega,wb[1])),mul(Omega,wb[0]),ZERO];vb=[ZERO,ZERO,ZERO];vd=[ZERO,ZERO,ZERO];Fb=[ZERO,ZERO,ZERO];mb=[ZERO,ZERO,ZERO];position=[0,0,0];positionExact=[ZERO,ZERO,ZERO];worldVelocity=[ZERO,ZERO,ZERO];reference=mv(R0,L0);work=ZERO;initialEnergy=div(add(mul(Ip,sq(p.transverseSpin)),mul(Iz,sq(p.axialSpin))),2);phase=Omega;
 }else{
  const alpha=div(p.torque,Iz),theta=add(mul(p.axialSpin,t),div(mul(alpha,sq(t)),2)),tr=trigRadians(theta);R=rotateZ(tr);wb=[ZERO,ZERO,add(p.axialSpin,mul(alpha,t))];wd=[ZERO,ZERO,alpha];worldVelocity=[div(mul(p.force,t),p.mass),ZERO,ZERO];vb=mv(transpose(R),worldVelocity);Fb=mv(transpose(R),[exact(p.force),ZERO,ZERO]);vd=vsub(mv(transpose(R),[div(p.force,p.mass),ZERO,ZERO]),cross3(wb,vb));mb=[ZERO,ZERO,exact(p.torque)];positionExact=[div(mul(p.force,sq(t)),mul(2,p.mass)),ZERO,ZERO];position=nv(positionExact);reference=[ZERO,ZERO,mul(Iz,p.axialSpin)];work=add(mul(p.force,div(mul(p.force,sq(t)),mul(2,p.mass))),mul(p.torque,theta));initialEnergy=div(mul(Iz,sq(p.axialSpin)),2);phase=alpha;
 }
 const Lb=wb.map((x,i)=>mul(I[i],x)),Lw=mv(R,Lb),rotEnergy=div(dot(wb,Lb),2),translation=div(mul(p.mass,dot(vb,vb)),2),energy=add(rotEnergy,translation),angularResidual=vsub(vadd(wd.map((x,i)=>mul(I[i],x)),cross3(wb,Lb)),mb),linearResidual=vsub(scale(vadd(vd,cross3(wb,vb)),p.mass),Fb),power=add(dot(mb,wb),dot(Fb,vb));
 return{parameters:p,rotation:nm(R),position,displacement:qv(positionExact),bodyAngularVelocity:qv(wb),bodyAngularAcceleration:qv(wd),bodyLinearVelocity:qv(vb),bodyLinearAcceleration:qv(vd),bodyForce:qv(Fb),bodyMoment:qv(mb),worldAngularVelocity:qv(mv(R,wb)),worldAngularMomentum:qv(Lw),referenceAngularMomentum:qv(reference),worldVelocity:qv(worldVelocity),angularResidual:qv(angularResidual),linearResidual:qv(linearResidual),inertia:qv(I),...fields({rotationalEnergy:rotEnergy,translationalEnergy:translation,energy,initialEnergy,work,workResidual:sub(sub(energy,initialEnergy),work),power,precessionOrAcceleration:phase,momentumMagnitude:squareRoot(dot(Lb,Lb))}),geometryApproximate:true};
}

function pendulumIntegrate(q0,wn,time){
 const n=Math.max(1,Math.ceil(wn*time/.001)),h=time/n,f=q=>-wn*wn*Math.sin(q);let q=q0,v=0;const trace=[{time:0,q:q0,dq:0}],stride=Math.max(1,Math.ceil(n/128));
 for(let i=0;i<n;i++){const k1=v,j1=f(q),k2=v+h*j1/2,j2=f(q+h*k1/2),k3=v+h*j2/2,j3=f(q+h*k2/2),k4=v+h*j3,j4=f(q+h*k3);q+=h*(k1+2*k2+2*k3+k4)/6;v+=h*(j1+2*j2+2*j3+j4)/6;if((i+1)%stride===0||i===n-1)trace.push({time:(i+1)*h,q,dq:v});}
 return{q,dq:v,trace,steps:n};
}
export function freeElbow(input={}){
 const p=object(input),base=armParameters({...p,gravity:0}),parameters={...base,shoulderSpeed:range(p,'shoulderSpeed',3,-8,8),initialBend:range(p,'initialBend',100,5,150),bendSense:choice(p,'bendSense',1,[1,-1]),time:range(p,'time',.6,0,2)},Omega=exact(parameters.shoulderSpeed),time=exact(parameters.time),initialDegrees=mul(parameters.initialBend,parameters.bendSense),q0=mul(initialDegrees,Math.PI/180),baseCore=core(base),K=mul(div(baseCore.D,baseCore.B),sq(Omega)),uExact=mul(mul(abs(Omega),time),Math.sqrt(approximate(div(baseCore.D,baseCore.B)))),u=approximate(uExact);let q,dq,qDegrees,trace,steps,solver;
 if(u<1e-5){const z=trigDegrees(initialDegrees),delta=add(neg(div(mul(mul(z.s,K),sq(time)),2)),div(mul(mul(mul(z.s,z.c),sq(K)),sq(sq(time))),24));q=add(q0,delta);qDegrees=add(initialDegrees,div(delta,Math.PI/180));dq=add(neg(mul(mul(z.s,K),time)),div(mul(mul(mul(z.s,z.c),sq(K)),mul(sq(time),time)),6));steps=0;solver='retained-factor short-time Taylor';trace=[{time:0,q:approximate(q0),dq:0},{time:parameters.time,q:approximate(q),dq:approximate(dq)}];}
 else{const z=pendulumIntegrate(approximate(q0),squareRoot(K),parameters.time);q=exact(z.q);qDegrees=div(q,Math.PI/180);dq=exact(z.dq);trace=z.trace;steps=z.steps;solver='RK4 dimensionless step ≤0.001';}
 const q1=add(base.q1,div(mul(Omega,time),Math.PI/180)),q2=qDegrees,s0=core(parameters,{q1,q2,dq:[Omega,dq],ddq:[ZERO,ZERO]}),ddq2=neg(mul(K,s0.t2.s)),s=core(parameters,{q1,q2,dq:[Omega,dq],ddq:[ZERO,ddq2]}),invariant=sub(div(mul(s.B,sq(dq)),2),mul(mul(s.D,sq(Omega)),s.t2.c)),initialInvariant=neg(mul(mul(s.D,sq(Omega)),trigDegrees(initialDegrees).c));
 return{...publicArm(s),parameters,solver,steps,trace,elbowRate:quantity(dq),elbowRadians:quantity(q),...fields({elbowAngularAcceleration:ddq2,shoulderTorque:s.tau[0],elbowTorque:s.tau[1],shoulderPower:mul(s.tau[0],Omega),relativeInvariant:invariant,relativeInvariantResidual:sub(invariant,initialInvariant),shoulderCoriolis:neg(mul(mul(mul(2,s.h),Omega),dq)),shoulderCentripetal:neg(mul(s.h,sq(dq))),elbowCentripetal:mul(s.h,sq(Omega)),dimensionlessTime:uExact,elbowAngleChange:sub(q,q0)}),geometryApproximate:true};
}

export function constrainedDynamics(input={}){
 const p=object(input),base=armParameters(p),parameters={...base,normalAngle:range(p,'normalAngle',0,-180,180),speed:range(p,'speed',.6,-2,2),torque1:range(p,'torque1',0,-40,40),torque2:range(p,'torque2',0,-40,40),contact:choice(p,'contact','wall',['wall','guide','free'])},c0=core(parameters),n=trigDegrees(parameters.normalAngle),normal=[n.c,n.s],G=transpose(c0.J).map(col=>dot(normal,col)),gscale=max(abs(G[0]),abs(G[1]));let dq;
 if(sign(gscale)){const z=G.map(x=>div(x,gscale)),norm=squareRoot(dot(z,z)),k=div(parameters.speed,norm);dq=scale([neg(z[1]),z[0]],k);}else dq=[exact(parameters.speed),ZERO];
 const s=core(parameters,{dq,ddq:[ZERO,ZERO]}),tau=[exact(parameters.torque1),exact(parameters.torque2)],free=mv(s.inverse,vsub(tau,vadd(s.c,s.g))),mobility=quadratic(s.inverse,G),bias=dot(normal,s.bias),b=add(dot(G,free),bias),required=sign(mobility)?neg(div(b,mobility)):null;let lambda=ZERO,status;
 if(parameters.contact==='free')status='free';else if(required===null)status=sign(b)?'degenerate-incompatible':'degenerate-indeterminate';else if(parameters.contact==='wall'&&sign(required)<0)status='detached';else{lambda=required;status=parameters.contact==='wall'?'active-wall':'bilateral-guide';}
 const ddq=vadd(free,scale(mv(s.inverse,G),lambda)),toolA=vadd(mv(s.J,ddq),s.bias),freeTool=vadd(mv(s.J,free),s.bias),contactForce=scale(normal,lambda),normalVelocity=dot(G,dq),normalAcceleration=add(dot(G,ddq),bias),reactionPower=mul(lambda,normalVelocity);
 return{...publicArm(s),parameters,status,normal:nv(normal),wallPoint:nv(s.tool),constraintGradient:qv(G),selectedVelocity:qv(dq),solvedAcceleration:qv(ddq),freeAcceleration:qv(free),constrainedToolAcceleration:qv(toolA),freeToolAcceleration:qv(freeTool),contactForce:qv(contactForce),requiredReaction:required===null?null:quantity(required),reaction:required===null&&parameters.contact!=='free'?null:quantity(lambda),appliedTorque:qv(tau),...fields({normalMobility:mobility,normalVelocity,normalAcceleration,freeNormalAcceleration:b,normalAccelerationBias:bias,reactionPower}),instantaneous:true};
}
