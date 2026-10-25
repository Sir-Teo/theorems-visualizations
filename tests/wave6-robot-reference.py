"""Independent ROBOT6 references, using actual uniform-rod mass integration.

No JavaScript model is imported/executed. Two-point Gauss integration is exact
for the rod's quadratic position/velocity moments. Contact uses a saddle solve;
the free elbow uses Jacobi elliptic functions instead of the JS RK4 solver.
"""
from pathlib import Path
import json, math, random, sys
import mpmath as mp

DEFAULT=dict(m1=2,m2=1.5,l1=1,l2=.8,q1=25,q2=70,dq1=.8,dq2=-.5,ddq1=.4,ddq2=-.7,gravity=9.81)
def number(x): return mp.mpf(x)
def get(p,k,d): return number(p.get(k,d))
def qty(x,absolute=None):
 x=number(x)
 # Gaussian integration / numerical differentiation / saddle elimination leave
 # roundoff at identities that are analytically zero. In this fixed inventory,
 # every true nonzero ordinary reference is far above1e-87 and every true
 # extreme reference is far above1e-2597 (smallest retained scale ~1e-1943).
 # Remove only that working-precision residue; no JS result sets this choice.
 if abs(x)<1000*mp.eps:x=mp.mpf(0)
 s=int(mp.sign(x))
 try: value=float(x)
 except OverflowError: value=math.copysign(math.inf,s)
 out=dict(value=value if math.isfinite(value) else ('negative overflow' if s<0 else 'positive overflow'),sign=s,logMagnitude=float(mp.log(abs(x))) if s else None,belowRange=bool(s and value==0),aboveRange=not math.isfinite(value))
 if absolute is not None:out['absoluteTolerance']=float(absolute)
 return out
def fields(**kwargs):return {k:qty(v) for k,v in kwargs.items()}
def qv(v):return [qty(x) for x in v]
def qm(M):return [qv([M[i,j] for j in range(M.cols)]) for i in range(M.rows)]
def vector(x,y):return mp.matrix([x,y])
def cross(a,b):return a[0]*b[1]-a[1]*b[0]
def dot(a,b):return (a.T*b)[0]
def trig(a):
 # Exact quarter turns are recognized only at working-precision roundoff.
 # Extreme cases use2600 digits so tiny original angles are never snapped.
 k=mp.nint(a/(mp.pi/2))
 if abs(a-k*mp.pi/2)<8*mp.eps and (a==0 or k!=0):
  j=int(k)%4;return [(0,1),(1,0),(0,-1),(-1,0)][j]
 return mp.sin(a),mp.cos(a)

def rod_model(p,overrides=None):
 z={k:get(p,k,v) for k,v in DEFAULT.items()};o=overrides or {}
 q=mp.matrix([z['q1']*mp.pi/180,z['q2']*mp.pi/180]);w=mp.matrix([z['dq1'],z['dq2']]);a=mp.matrix([z['ddq1'],z['ddq2']]);q=o.get('q',q);w=o.get('w',w);a=o.get('a',a)
 s1,c1=trig(q[0]);s2,c2=trig(q[1]);s12,c12=trig(q[0]+q[1]);l1,l2=z['l1'],z['l2'];r1=vector(l1*c1,l1*s1);r2=vector(l2*c12,l2*s12);tool=r1+r2
 M=mp.zeros(2);tau=mp.zeros(2,1);coupling=mp.zeros(2,1);gvec=mp.zeros(2,1);U=mp.mpf(0)
 # Directly integrate mass points along both rods, not COM+I closed formulas.
 for link in [0,1]:
  for u in [mp.mpf('.5')-1/mp.sqrt(12),mp.mpf('.5')+1/mp.sqrt(12)]:
   mass=z['m1' if link==0 else 'm2']/2
   if link==0:
    point=u*r1;local=point;J=mp.matrix([[-point[1],0],[point[0],0]])
    accbias=-w[0]**2*point
   else:
    local=u*r2;point=r1+local;J=mp.matrix([[-point[1],-local[1]],[point[0],local[0]]])
    accbias=-w[0]**2*r1-(w[0]+w[1])**2*local
   M+=mass*(J.T*J)
   total=mass*(J*a+accbias+vector(0,z['gravity']));centripetal=mass*accbias;gravity=vector(0,mass*z['gravity'])
   tau[0]+=cross(point,total);coupling[0]+=cross(point,centripetal);gvec[0]+=cross(point,gravity)
   if link:
    tau[1]+=cross(local,total);coupling[1]+=cross(local,centripetal);gvec[1]+=cross(local,gravity)
   U+=mass*z['gravity']*point[1]
 J=mp.matrix([[-tool[1],-r2[1]],[tool[0],r2[0]]]);bias=-w[0]**2*r1-(w[0]+w[1])**2*r2;T=dot(w,M*w)/2
 return dict(p=z,q=q,w=w,a=a,M=M,tau=tau,c=coupling,g=gvec,U=U,T=T,J=J,bias=bias,tool=tool,r1=r1,r2=r2)

def base_expected(s):
 # Inverse and determinant use independent arbitrary-precision matrix algebra.
 M=s['M'];w=s['w'];a=s['a'];J=s['J'];tau=s['tau']
 return dict(mass=qm(M),inverseMass=qm(M**-1),coriolis=qv(s['c']),gravityTorque=qv(s['g']),inertialTorque=qv(M*a),torque=qv(tau),toolVelocity=qv(J*w),toolAcceleration=qv(J*a+s['bias']),**fields(massDeterminant=mp.det(M),kinetic=s['T'],potential=s['U'],energy=s['T']+s['U'],power=dot(tau,w)))
def ref_chain(p):return base_expected(rod_model(p))

def ref_motion(p):
 z={k:get(p,k,v) for k,v in DEFAULT.items()};amp=mp.matrix([get(p,'amplitude1',25)*mp.pi/180,get(p,'amplitude2',35)*mp.pi/180]);frequency=2*mp.pi/get(p,'duration',3);phase=2*mp.pi*get(p,'progress',.2);sp,cp=trig(phase)
 q=mp.matrix([z['q1']*mp.pi/180,z['q2']*mp.pi/180])+amp*sp;w=amp*frequency*cp;a=-amp*frequency**2*sp;s=rod_model(p,dict(q=q,w=w,a=a));out=base_expected(s)
 def mass_at_q2(x):return rod_model(p,dict(q=mp.matrix([q[0],x]),w=w,a=a))['M']
 dM=mp.matrix([[mp.diff(lambda x:mass_at_q2(x)[i,j],q[1]) for j in range(2)]for i in range(2)])
 # Construct Christoffel C from derivatives, independently of supplied formulas.
 def deriv(i,j,k):return dM[i,j] if k==1 else mp.mpf(0)
 C=mp.matrix([[sum((deriv(i,j,k)+deriv(i,k,j)-deriv(j,k,i))*w[k]/2 for k in range(2))for j in range(2)]for i in range(2)]);Mdot=dM*w[1]
 out.update(coriolisMatrix=qm(C),massRate=qm(Mdot),skewMatrix=qm(Mdot-2*C),**fields(kineticRate=dot(w,s['M']*a)+dot(w,Mdot*w)/2,potentialRate=dot(s['g'],w),energyRate=dot(s['tau'],w),powerResidual=0,skewPower=0,couplingPower=dot(s['c'],w),massRatePower=dot(w,Mdot*w)/2))
 initial=rod_model(p,dict(q=mp.matrix([z['q1']*mp.pi/180,z['q2']*mp.pi/180]),w=amp*frequency,a=vector(0,0)))
 out.update(**fields(potentialChange=s['U']-initial['U'],kineticChange=s['T']-initial['T'],energyChange=s['U']+s['T']-initial['U']-initial['T']))
 return out

def ref_ellipse(p):
 s=rod_model(p);out=base_expected(s);E=get(p,'energy',2);d=get(p,'direction',35)*mp.pi/180;ss,cc=trig(d);u=vector(cc,ss);evals,_=mp.eigsy(s['M']);selected=u*mp.sqrt(2*E/dot(u,s['M']*u));out.update(selectedVelocity=qv(selected),**fields(requestedEnergy=E,selectedEnergy=E,lambdaMax=evals[1],lambdaMin=evals[0]));out['ellipse']={'axes':[float(mp.sqrt(2*E/evals[1])),float(mp.sqrt(2*E/evals[0]))]};out['collapsed']=E==0;return out

def ref_recursive(p):
 s=rod_model(p);out=base_expected(s);z=s['p'];w=s['w'];a=s['a'];ac1=mp.matrix([[-s['r1'][1]/2],[s['r1'][0]/2]])*a[0]-s['r1']*w[0]**2/2;ae=vector(-s['r1'][1],s['r1'][0])*a[0]-s['r1']*w[0]**2;ac2=ae+vector(-s['r2'][1],s['r2'][0])*(a[0]+a[1])/2-s['r2']*(w[0]+w[1])**2/2;F2=z['m2']*(ac2+vector(0,z['gravity']));F1=z['m1']*(ac1+vector(0,z['gravity']))+F2
 out.update(linkAngularVelocity=qv([w[0],w[0]+w[1]]),linkAngularAcceleration=qv([a[0],a[0]+a[1]]),centreAcceleration=[qv(ac1),qv(ac2)],jointForce=[qv(F1),qv(F2)],recursiveTorque=qv(s['tau']),torqueResidual=qv([0,0]));return out

def ref_task(p):
 z={**p};z.setdefault('dq1',0);z.setdefault('dq2',0);z.setdefault('gravity',0);s=rod_model(z);out=base_expected(s);J=s['J'];M=s['M'];A=J*(M**-1)*J.T;force=get(p,'force',2);ss,cc=trig(get(p,'direction',20)*mp.pi/180);u=vector(cc,ss);F=force*u
 deg=get(p,'q2',70)%180;rank=1 if deg==0 else 2
 # Rank is a mathematical property, not a numerical conditioning threshold.
 Lambda=(J.T**-1)*M*(J**-1) if rank==2 else None
 gain=dot(u,A*u);eigen,_=mp.eigsy(A);bias=s['bias']-J*(M**-1)*(s['c']+s['g']);det=mp.det(J)**2/mp.det(M)
 if rank==1:det=mp.mpf(0);eigen[0]=mp.mpf(0)
 out.update(taskRank=rank,response=qm(A),taskMass=qm(Lambda) if Lambda is not None else None,force=qv(F),responseAcceleration=qv(A*F),uncompensatedAcceleration=qv(A*F+bias),accelerationBias=qv(bias),directionalMass=qty(1/gain) if gain else None,responseEllipse={'axes':[float(force*eigen[1]),float(force*eigen[0])]},**fields(taskDeterminant=det,directionalGain=gain,responseEigenMax=eigen[1],responseEigenMin=eigen[0]),singular=rank==1)
 return out

def ref_geared(p):
 s=rod_model(p);out=base_expected(s);N1=get(p,'ratio1',30);N2=get(p,'ratio2',30);R1=get(p,'rotor1',.002);R2=get(p,'rotor2',.002);sense=get(p,'sense',1);link=p.get('mount','link-mounted')=='link-mounted'
 # Hessian of actual absolute rotor kinetic energy, not diagonal N² assumption.
 def kinetic(a,b):return (R1*(N1*a)**2+R2*((a if link else 0)+sense*N2*b)**2)/2
 R=mp.matrix([[mp.diff(lambda x:mp.diff(lambda y:kinetic(x,y),0),0) if i!=j else mp.diff(lambda x:kinetic(x,0) if i==0 else kinetic(0,x),0,2)for j in range(2)]for i in range(2)])
 M=s['M']+R;tau=M*s['a']+s['c']+s['g'];relative=vector(N1*s['w'][0],sense*N2*s['w'][1]);absolute=vector(relative[0],relative[1]+(s['w'][0] if link else 0));mt=vector(tau[0]/N1,tau[1]/(sense*N2));coupling=abs(M[0,1])/mp.sqrt(M[0,0]*M[1,1]);before=abs(s['M'][0,1])/mp.sqrt(s['M'][0,0]*s['M'][1,1]);out.update(gearedMass=qm(M),addedMass=qm(R),requiredTorque=qv(tau),motorTorque=qv(mt),relativeMotorSpeed=qv(relative),absoluteMotorSpeed=qv(absolute),**fields(gearedDeterminant=mp.det(M),reflected1=R1*N1*N1,reflected2=R2*N2*N2,rotorEnergy=kinetic(*s['w']),motorPower=dot(mt,relative),jointPower=dot(tau,s['w']),powerResidual=0,relativeCoupling=coupling,ungearedCoupling=before),ideal=True);return out

def qmul(a,b):
 w,x,y,z=a;v,p,q,r=b
 return [w*v-x*p-y*q-z*r,w*p+x*v+y*r-z*q,w*q-x*r+y*v+z*p,w*r+x*q-y*p+z*v]
def quaternion_rotation(q):
 w,x,y,z=q
 return [[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]]
def ref_rigid(p):
 m=get(p,'mass',2);a=get(p,'radius',.6);c=get(p,'axialRadius',1);t=get(p,'time',.8);w0=get(p,'axialSpin',2);wp=get(p,'transverseSpin',1.5);Ip=m*(a*a+c*c)/5;Iz=2*m*a*a/5;mode=p.get('mode','free');out={'inertia':qv([Ip,Ip,Iz])}
 if mode=='free':
  O=(Iz-Ip)*w0/Ip;wb=mp.matrix([wp*mp.cos(O*t),wp*mp.sin(O*t),w0]);wd=mp.matrix([-O*wb[1],O*wb[0],0]);Lb=mp.matrix([Ip*wb[0],Ip*wb[1],Iz*w0]);L=mp.sqrt((Ip*wp)**2+(Iz*w0)**2);phi=L*t/Ip;tilt=mp.atan2(Ip*wp,Iz*w0)
  orient=qmul(qmul([mp.cos(phi/2),0,0,mp.sin(phi/2)],[mp.cos(-tilt/2),0,mp.sin(-tilt/2),0]),[mp.cos(-O*t/2),0,0,mp.sin(-O*t/2)]);R=mp.matrix(quaternion_rotation(orient));rot=(Ip*wp*wp+Iz*w0*w0)/2;translation=0;work=0;power=0;initial=rot;vb=mp.zeros(3,1);vd=mp.zeros(3,1);Fb=mp.zeros(3,1);mb=mp.zeros(3,1);displacement=[0,0,0];worldV=[0,0,0];phase=O
  Lworld=[qty(0,abs(L)*mp.mpf('5e-13')),qty(0,abs(L)*mp.mpf('5e-13')),qty(L)];reference=Lworld
 else:
  tau=get(p,'torque',.6);F=get(p,'force',1);alpha=tau/Iz;theta=w0*t+alpha*t*t/2;ss,cc=mp.sin(theta),mp.cos(theta);R=mp.matrix([[cc,-ss,0],[ss,cc,0],[0,0,1]]);wb=mp.matrix([0,0,w0+alpha*t]);wd=mp.matrix([0,0,alpha]);worldV=[F*t/m,0,0];vb=R.T*mp.matrix(worldV);Fb=R.T*mp.matrix([F,0,0]);vd=R.T*mp.matrix([F/m,0,0])-mp.matrix([-wb[2]*vb[1],wb[2]*vb[0],0]);mb=mp.matrix([0,0,tau]);rot=Iz*wb[2]**2/2;translation=F*F*t*t/(2*m);work=F*F*t*t/(2*m)+tau*theta;power=tau*wb[2]+F*F*t/m;initial=Iz*w0*w0/2;displacement=[F*t*t/(2*m),0,0];Lworld=qv([0,0,Iz*wb[2]]);reference=qv([0,0,Iz*w0]);phase=alpha;L=abs(Iz*wb[2])
 out.update(rotation=[[float(R[i,j])for j in range(3)]for i in range(3)],displacement=qv(displacement),bodyAngularVelocity=qv(wb),bodyAngularAcceleration=qv(wd),bodyLinearVelocity=qv(vb),bodyLinearAcceleration=qv(vd),bodyForce=qv(Fb),bodyMoment=qv(mb),worldAngularMomentum=Lworld,referenceAngularMomentum=reference,worldVelocity=qv(worldV),angularResidual=qv([0,0,0]),linearResidual=qv([0,0,0]),**fields(rotationalEnergy=rot,translationalEnergy=translation,energy=rot+translation,initialEnergy=initial,work=work,workResidual=0,power=power,precessionOrAcceleration=phase,momentumMagnitude=L))
 return out

def ref_release(p):
 Omega=get(p,'shoulderSpeed',3);time=get(p,'time',.6);bend=get(p,'initialBend',100)*get(p,'bendSense',1)*mp.pi/180;k=mp.sin(bend/2);z=rod_model({**p,'gravity':0});B=z['p']['m2']*z['p']['l2']**2/3;D=z['p']['m2']*z['p']['l1']*z['p']['l2']/2;wn=abs(Omega)*mp.sqrt(D/B);u=wn*time
 if u==0:q=bend;rate=mp.mpf(0)
 else:
  sn=mp.ellipfun('sn',u,k*k);cn=mp.ellipfun('cn',u,k*k);dn=mp.ellipfun('dn',u,k*k);q=2*mp.asin(k*cn/dn);rate=-2*k*wn*mp.sqrt(1-k*k)*sn/dn
 q1=get(p,'q1',25)*mp.pi/180+Omega*time;acc=-D/B*Omega**2*mp.sin(q);s=rod_model({**p,'gravity':0},dict(q=mp.matrix([q1,q]),w=vector(Omega,rate),a=vector(0,acc)));out=base_expected(s);h=D*mp.sin(q)
 out.update(elbowRate=qty(rate),elbowRadians=qty(q),**fields(elbowAngularAcceleration=acc,shoulderTorque=s['tau'][0],elbowTorque=0,shoulderPower=s['tau'][0]*Omega,relativeInvariant=-D*Omega**2*mp.cos(bend),relativeInvariantResidual=0,shoulderCoriolis=-2*h*Omega*rate,shoulderCentripetal=-h*rate*rate,elbowCentripetal=h*Omega*Omega,dimensionlessTime=u,elbowAngleChange=q-bend))
 # Bounded RK4 is approximate; cancellation residual uses the invariant's scale.
 out['relativeInvariantResidual']['absoluteTolerance']=float(max(abs(D*Omega**2),mp.mpf('1e-1500'))*mp.mpf('8e-10'))
 out['torque'][1]=qty(0,mp.mpf('1e-70'))
 return out

def ref_contact(p):
 z=rod_model(p);ss,cc=trig(get(p,'normalAngle',0)*mp.pi/180);n=vector(cc,ss);G=n.T*z['J'];norm=mp.sqrt(G[0]**2+G[1]**2);speed=get(p,'speed',.6);w=vector(-G[1],G[0])*speed/norm if norm else vector(speed,0);s=rod_model(p,dict(w=w,a=vector(0,0)));M=s['M'];applied=vector(get(p,'torque1',0),get(p,'torque2',0));free=mp.lu_solve(M,applied-s['c']-s['g']);bias=dot(n,s['bias']);b=(G*free)[0]+bias;mobility=(G*(M**-1)*G.T)[0];mode=p.get('contact','wall');required=None;reaction=mp.mpf(0);status='free';a=free
 if norm:
  # Solve joint accelerations and wall-on-robot force in one saddle system.
  K=mp.matrix([[M[0,0],M[0,1],-G[0]],[M[1,0],M[1,1],-G[1]],[G[0],G[1],0]]);rhs=mp.matrix([applied[0]-s['c'][0]-s['g'][0],applied[1]-s['c'][1]-s['g'][1],-bias]);answer=mp.lu_solve(K,rhs);required=answer[2]
  if mode!='free':
   if mode=='wall' and required<0:status='detached'
   else:reaction=required;a=vector(answer[0],answer[1]);status='active-wall' if mode=='wall' else 'bilateral-guide'
 elif mode!='free':status='degenerate-incompatible' if b else 'degenerate-indeterminate'
 out=base_expected(s);active=status in ['active-wall','bilateral-guide'];normalAcceleration=0 if active else b
 out.update(status=status,normal=[float(x)for x in n],constraintGradient=qv([G[0],G[1]]),selectedVelocity=qv(w),solvedAcceleration=qv(a),freeAcceleration=qv(free),constrainedToolAcceleration=qv(s['J']*a+s['bias']),freeToolAcceleration=qv(s['J']*free+s['bias']),contactForce=qv(n*reaction),requiredReaction=qty(required) if required is not None else None,reaction=None if required is None and mode!='free' else qty(reaction),appliedTorque=qv(applied),**fields(normalMobility=mobility,normalVelocity=0,normalAcceleration=normalAcceleration,freeNormalAcceleration=b,normalAccelerationBias=bias,reactionPower=0),instantaneous=True)
 return out

def inputs():
 r=random.Random(6092026);families={k:[{}] for k in ['rigid','chain','motion','ellipse','recursive','task','geared','release','contact']}
 def arm():return dict(m1=r.uniform(.5,5),m2=r.uniform(.5,5),l1=r.uniform(.5,2),l2=r.uniform(.5,2),q1=r.uniform(-179,179),q2=r.uniform(-179,179),dq1=r.uniform(-8,8),dq2=r.uniform(-8,8),ddq1=r.uniform(-12,12),ddq2=r.uniform(-12,12),gravity=r.choice([0,9.81,r.uniform(0,9.81)]))
 for j in range(96):
  a=arm();families['chain'].append(a);families['recursive'].append({**arm(),'step':j%5});families['motion'].append({**arm(),'amplitude1':r.uniform(0,45),'amplitude2':r.uniform(0,45),'duration':r.uniform(.5,4),'progress':r.random()});families['ellipse'].append({**arm(),'energy':r.uniform(0,20),'direction':r.uniform(-180,180)});families['task'].append({**arm(),'force':r.uniform(0,10),'direction':r.uniform(-180,180)});families['geared'].append({**arm(),'ratio1':r.uniform(1,200),'ratio2':r.uniform(1,200),'rotor1':r.uniform(0,.02),'rotor2':r.uniform(0,.02),'mount':r.choice(['link-mounted','ground-mounted']),'sense':r.choice([-1,1])});families['release'].append({**arm(),'shoulderSpeed':r.uniform(-8,8),'initialBend':r.uniform(5,150),'bendSense':r.choice([-1,1]),'time':r.uniform(0,2)});families['contact'].append({**arm(),'normalAngle':r.uniform(-180,180),'speed':r.uniform(-2,2),'torque1':r.uniform(-40,40),'torque2':r.uniform(-40,40),'contact':r.choice(['wall','guide','free'])});families['rigid'].append(dict(mode=r.choice(['free','wrench']),mass=r.uniform(1,5),radius=r.uniform(.2,1),axialRadius=r.uniform(.2,1.5),transverseSpin=r.uniform(0,4),axialSpin=r.uniform(-4,4),torque=r.uniform(-2,2),force=r.uniform(-5,5),time=r.uniform(0,2)))
 tiny=float.fromhex('0x0.0000000000001p-1022')
 for q in [0,90,-90,180,-180,1e-12,-1e-12,1e-30,tiny,-tiny]:
  families['chain'].append(dict(q1=0,q2=q,dq1=0,dq2=0,ddq1=0,ddq2=0,gravity=0));families['ellipse'].append(dict(q1=0,q2=q,energy=2));families['task'].append(dict(q1=0,q2=q,direction=0));families['recursive'].append(dict(q1=0,q2=q,dq1=-8,dq2=8,ddq1=0,ddq2=0,gravity=0));families['contact'].append(dict(q1=0,q2=q,gravity=0,speed=.5,normalAngle=0))
 families['ellipse'] += [dict(energy=x,direction=d)for x in [0,tiny,1e-300,20]for d in [0,90,180]]
 families['task'] += [dict(q1=0,q2=q,force=f,direction=d)for q in [0,90,180]for f in [0,tiny,10]for d in [0,90]]
 families['motion'] += [dict(amplitude1=a,amplitude2=a,progress=t,gravity=g)for a in [0,tiny,45]for t in [0,.25,.5,.75,1]for g in [0,9.81]]
 families['motion'] += [dict(amplitude1=a,amplitude2=0,progress=t)for a in [tiny,1e-100]for t in [0,.25,.5,.75,1]]
 families['rigid'] += [dict(mode=mode,axialSpin=w,transverseSpin=v,radius=.6,axialRadius=.6,time=t,torque=0,force=0)for mode in ['free','wrench']for w in [0,-4,4]for v in [0,4]for t in [0,2]]
 families['rigid'] += [dict(mode='wrench',force=f,torque=f,time=t)for f in [tiny,1e-200,-tiny]for t in [tiny,1e-100,2]]
 families['rigid'] += [
  dict(mode='free',transverseSpin=tiny,axialSpin=tiny,time=0),
  dict(mode='free',transverseSpin=tiny,axialSpin=tiny,time=2),
  dict(mode='free',transverseSpin=tiny,axialSpin=-tiny,time=2),
  dict(mode='free',transverseSpin=tiny,axialSpin=0,time=2),
  dict(mode='free',transverseSpin=0,axialSpin=tiny,time=2),
  dict(mode='free',transverseSpin=0,axialSpin=-tiny,time=2),
  dict(mode='wrench',axialSpin=0,torque=tiny,force=tiny,time=tiny),
  dict(mode='wrench',axialSpin=0,torque=tiny,force=0,time=2),
  dict(mode='wrench',axialSpin=0,torque=-tiny,force=0,time=2),
  dict(mode='wrench',mass=5,radius=.5,axialRadius=1,axialSpin=2,torque=-1,force=0,time=1),
  dict(mode='free',mass=1,radius=.5,axialRadius=.5,transverseSpin=3*tiny,axialSpin=4*tiny,time=0),
  dict(mode='free',mass=1,radius=.5,axialRadius=.5,transverseSpin=3*tiny,axialSpin=4*tiny,time=2),
 ]
 families['release'] += [dict(shoulderSpeed=w,time=t,initialBend=b,bendSense=sgn)for w in [0,tiny,1e-100,-8,8]for t in [0,tiny,2]for b,sgn in [(5,1),(150,-1)]]
 families['geared'] += [dict(ratio1=N,ratio2=N,rotor1=R,rotor2=R,mount=mount,sense=s)for N in [1,200]for R in [0,.02]for mount in ['ground-mounted','link-mounted']for s in [-1,1]]
 families['contact'] += [dict(q1=q1,q2=q2,normalAngle=0,speed=s,gravity=0,torque1=tau,torque2=-tau,contact=mode)for q1,q2 in [(0,0),(0,180),(90,0),(-60,120)]for s in [0,1]for tau in [0,40]for mode in ['wall','guide','free']]
 return families

REFERENCES=dict(rigid=ref_rigid,chain=ref_chain,motion=ref_motion,ellipse=ref_ellipse,recursive=ref_recursive,task=ref_task,geared=ref_geared,release=ref_release,contact=ref_contact)
def build():
 result={}
 for name,rows in inputs().items():
  result[name]=[]
  for p in rows:
   extreme=any(isinstance(x,(int,float)) and x and abs(x)<1e-20 for x in p.values());digits=2600 if extreme else 90
   with mp.workdps(digits):expected=REFERENCES[name](p)
   result[name].append(dict(args=p,digits=digits,expect=expected))
  print(name,len(rows),file=sys.stderr,flush=True)
 return dict(generator='Independent uniform-rod quadrature / quaternion / elliptic / saddle-solve references',mpmath=mp.__version__,precisionDigits=[90,2600],caseCount=sum(map(len,result.values())),families=result)
if __name__=='__main__':
 destination=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).with_name('fixtures')/'wave6-robot-reference.json'
 destination.write_text(json.dumps(build(),separators=(',',':'),allow_nan=False)+'\n')
