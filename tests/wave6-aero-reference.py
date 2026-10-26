"""Independent mpmath reference: direct force balances / matrix solves / expm.

Static algebra uses 1000 digits, covering binary64 products below 1e-600.
Ordinary dynamic states use 90 digits. No production code is called here.
"""
import itertools, json, math, random
from pathlib import Path
import mpmath as mp

ROOT=Path(__file__).resolve().parents[1]
RNG=random.Random(63332004)
ROWS=[]
F=mp.mpf
def sgn(x): return int(mp.sign(x))
def quant(x):
 v=float(x)
 return dict(value=v if math.isfinite(v) else None,sign=sgn(x),logMagnitude=float(mp.log(abs(x))) if x else None)
def emit(name,p,quantities={},scalars={},state=None,A=None,poles=None,status=None):
 r=dict(name=name,p=p,quantities={k:quant(v) for k,v in quantities.items()},scalars={k:float(v) for k,v in scalars.items()})
 if state is not None:r['state']=[float(v) for v in state]
 if A is not None:r['A']=[[float(v) for v in row] for row in A.tolist()]
 if poles is not None:r['poles']=[[float(mp.re(v)),float(mp.im(v))] for v in poles]
 if status is not None:r['status']=status
 ROWS.append(r)
def static(p):
 h=F(p.get('cg',.35)); S=F(p.get('tailArea',.25)); inc=F(p.get('incidence',-2)); alpha=F(p.get('alpha',5)); de=F(p.get('elevator',0)); da=F(p.get('deltaAlpha',3));rad=F(math.pi/180)
 aw=F(5);b=S*4*F(.625);A=aw+b;hn=(aw/4+b*F(2.5))/A;wl=aw*alpha*rad;tl=S*4*(F(.625)*alpha+inc+F(.6)*de)*rad
 # Finite force resultants directly, with moment differentiated independently.
 moment=lambda a:F(-.05)+(h-F(.25))*aw*a*rad-(F(2.5)-h)*S*4*(F(.625)*a+inc+F(.6)*de)*rad
 cma=mp.diff(moment,alpha)/rad
 return dict(neutral=hn,margin=hn-h,slope=A,tailSlope=b,cma=cma,wing=wl,tail=tl,lift=wl+tl,wingMoment=(h-F(.25))*wl,tailMoment=-(F(2.5)-h)*tl,moment=moment(alpha),dWing=aw*da*rad,dTail=b*da*rad,dLift=A*da*rad,dMoment=cma*da*rad)
def make_static(name,p):
 with mp.workdps(1000):
  z=static(p)
  if name=='staticAircraft':emit(name,p,z,status='statically stable' if z['margin']>0 else 'statically unstable' if z['margin']<0 else 'neutral first-order pitch stiffness');return
  h=F(p.get('cg',.35));S=F(p.get('tailArea',.25));inc=F(p.get('incidence',-2));CL=F(p.get('targetLift',.6));rad=F(math.pi/180)
  # Solve the lift/moment system directly for the two surface loads.
  loads=mp.lu_solve(mp.matrix([[1,1],[h-F(.25),-(F(2.5)-h)]]),mp.matrix([CL,-F(-.05)]));wl,tl=loads
  alpha=wl/(5*rad)
  out={**z,'trim.alpha':alpha,'trim.wing':wl,'trim.tail':tl}
  if S:out['trim.elevator']=(tl/(S*4*rad)-F(.625)*alpha-inc)/F(.6)
  emit(name,p,out)
def eig2(A):
 # Exact trace symmetry fixes a generic eigensolver's tiny real-part residue
 # at binary64 halfway rounding points; no arbitrary epsilon is applied.
 tr=A[0,0]+A[1,1];det=A[0,0]*A[1,1]-A[0,1]*A[1,0];root=mp.sqrt(tr*tr-4*det+0j)
 return [tr/2+root/2,tr/2-root/2]
def make_dynamic(name,p):
 with mp.workdps(90):
  g=F(9.80665);rad=F(math.pi/180)
  if name=='phugoid':
   V=F(p.get('speed',60));ld=F(p.get('liftDrag',15));u=F(p.get('disturbance',3));t=F(p.get('time',30));omega=mp.sqrt(2)*g/V;zeta=1/(mp.sqrt(2)*ld);d=2*zeta*omega
   A=mp.matrix([[-d,-g,0],[2*g/V**2,0,0],[0,V,0]]);x=mp.expm(A*t)*mp.matrix([u,0,0])
   emit(name,p,dict(kineticFirst=V*x[0],potential=g*x[2],mechanicalFirst=V*x[0]+g*x[2],initialFirst=V*u),dict(omega=omega,zeta=zeta,period=2*mp.pi/omega,dampedPeriod=2*mp.pi/(omega*mp.sqrt(1-zeta*zeta))),state=x,A=A,poles=eig2(A[:2,:2]));return
  if name=='shortPeriod':
   k=F(p.get('stiffness',3));d=F(p.get('damping',1.2));de=F(p.get('elevator',-2));pulse=F(p.get('pulse',.5));t=F(p.get('time',2));a=F(.6)
   A=mp.matrix([[-a,1,0],[-k,-d,0],[0,1,0]]);B=mp.matrix([[0],[-F(2.5)*de*rad],[0]])
   # An augmented forcing state integrates the rectangular input exactly.
   Fm=mp.matrix(4);Fm[:3,:3]=A;Fm[:3,3]=B;x=(mp.expm(Fm*min(t,pulse))*mp.matrix([0,0,0,1]))[:3,:]
   if t>pulse:x=mp.expm(A*(t-pulse))*x
   emit(name,p,scalars=dict(frequency=mp.sqrt(k+a*d),zeta=(a+d)/(2*mp.sqrt(k+a*d))),state=x,A=A,poles=eig2(A[:2,:2]));return
  if name=='feedback':
   h=p.get('cg',.65);kt=F(p.get('attitudeGain',2));kq=F(p.get('rateGain',1));mode=p.get('mode','attitude + rate');t=F(p.get('time',3));initial=F(p.get('initial',2));z=static(dict(cg=h));k=2*z['cma'];K=kt if mode=='attitude + rate' else 0;D=F(.4)+(kq if mode!='bare airframe' else 0);A=mp.matrix([[0,1],[k-K,-D]]);x=mp.expm(A*t)*mp.matrix([initial*rad,0]);
   emit(name,p,dict(pitchStiffness=k,effectiveStiffness=K-k,effectiveDamping=D,momentCommand=-K*x[0]-(D-F(.4))*x[1]),state=x,A=A,poles=eig2(A),status='unstable' if K-k<0 else 'boundary' if K-k==0 else 'asymptotically stable');return
  if name=='flutter':
   V=F(p.get('speed',14));d=F(p.get('damping',.15));t=F(p.get('time',6));initial=F(p.get('initial',.03));mu=V**2/64;A=mp.matrix([[0,0,1,0],[0,0,0,1],[-1,mu,-2*d,0],[-mu,-9,0,-2*d]]);x=mp.expm(A*t)*mp.matrix([initial,0,0,0]);E=(x[2]**2+x[3]**2+x[0]**2+9*x[1]**2)/2;Pa=mu*(x[2]*x[1]-x[3]*x[0]);Pd=2*d*(x[2]**2+x[3]**2)
   margin=16+20*d*d-mu*mu;disc=16-mu*mu
   status=('asymptotically stable' if margin>0 else 'neutral Hopf boundary' if margin==0 else 'flutter: exponential growth') if d else ('bounded undamped oscillation' if disc>0 else 'defective coalescence: polynomial growth' if disc==0 else 'flutter: exponential growth')
   poles=[-d+sign*mp.sqrt(d*d-5+branch*mp.sqrt(disc+0j)) for sign in [-1,1] for branch in [-1,1]]
   emit(name,p,dict(mu=mu,margin=margin,coalescenceMargin=disc,energy=E,aeroPower=Pa,dampingPower=Pd,energyRate=Pa-Pd),dict(flutterSpeed=8*(16+20*d*d)**F(.25),mergeSpeed=16),state=x,A=A,poles=poles,status=status);return
def make_lateral(p):
 with mp.workdps(1000):
  D=F(p.get('dihedral',10))/5;f=F(p.get('fin',1));A=mp.matrix([[-F(1)/5,0,-1,F(1)/10],[-D,-2,F(2)/5,0],[F(4)/5*f,-F(1)/10,-F(3)/10*f,0],[0,1,0,0]])
  coeff=[F(1)]
  for size in range(1,5):
   minors=[]
   for indices in itertools.combinations(range(4),size):minors.append(mp.det(mp.matrix([[A[i,j] for j in indices] for i in indices])))
   coeff.append((-1)**size*sum(minors))
  _,a,b,c,e=coeff;D2=a*b-c;D3=D2*c-a*a*e;values=coeff[1:]+[D2,D3];status='asymptotically stable' if all(x>0 for x in values) else 'stability boundary' if all(x>=0 for x in values) else 'unstable'
  emit('lateral',p,{**{f'coefficients.{j}':c for j,c in enumerate(coeff)},'routh2':D2,'routh3':D3,'rollBeta':-D,'spiralPole':mp.findroot(lambda x:sum(c*x**(4-j) for j,c in enumerate(coeff)),(-F(1)/8,F(1)/8))},A=A,status=status)
def make_other(name,p):
 with mp.workdps(1000):
  if name=='directional':
   f=F(p.get('fin',1));beta=F(p.get('beta',6));rad=F(math.pi/180);fin=F(.16)*f;body=F(-.04);cnb=fin+body
   emit(name,p,dict(cnb=cnb,side=-F(.08)*f*beta*rad,finMoment=fin*beta*rad,bodyMoment=body*beta*rad,moment=cnb*beta*rad),status='directionally restoring' if cnb>0 else 'directionally destabilizing' if cnb<0 else 'neutral first-order yaw stiffness');return
  w=F(p.get('windError',.15));pressure=F(p.get('pressureError',.2));lift=F(p.get('liftError',.5));eta=F(p.get('interference',1));warp=F(p.get('warp',4));e=F(p.get('elevator',3));L=F(.005)*17**2*308*F(.545);a=L/(1+w)**2;b=a/(1+pressure);c=b/(1+lift)
  emit(name,p,dict(prediction=L,afterWind=a,afterPressure=b,corrected=c,final=c*eta,deltaLift=F(.06)*warp,rollMoment=F(2.5)*F(.06)*warp,frontLift=F(.04)*e,pitchMoment=F(1.8)*F(.04)*e,trueWind=17/(1+w)))

def case(name,p):
 if name in ['staticAircraft','trimAircraft']:make_static(name,p)
 elif name in ['phugoid','shortPeriod','feedback','flutter']:make_dynamic(name,p)
 elif name=='lateral':make_lateral(p)
 else:make_other(name,p)

RANGES={
 'staticAircraft':dict(cg=(.05,.9),tailArea=(0,.5),incidence=(-8,8),alpha=(-12,12),elevator=(-25,25),deltaAlpha=(-8,8)),
 'trimAircraft':dict(cg=(.05,.9),tailArea=(.001,.5),incidence=(-8,8),targetLift=(.2,1.2)),
 'phugoid':dict(speed=(25,150),liftDrag=(5,40),disturbance=(-6,6),time=(0,240)),
 'shortPeriod':dict(stiffness=(.2,8),damping=(.1,4),elevator=(-4,4),pulse=(.1,1),time=(0,10)),
 'directional':dict(fin=(0,2),beta=(-15,15)),
 'lateral':dict(dihedral=(0,16),fin=(.3,2)),
 'feedback':dict(cg=(.05,.9),attitudeGain=(0,5),rateGain=(0,4),initial=(-3,3),time=(0,12)),
 'flutter':dict(speed=(0,22),damping=(0,.6),initial=(-.05,.05),time=(0,12)),
 'wright':dict(windError=(0,.3),pressureError=(0,.4),liftError=(0,.8),interference=(.6,1),warp=(-8,8),elevator=(-10,10))}
for name,ranges in RANGES.items():
 case(name,{})
 for j in range(28):
  p={k:RNG.uniform(*r) for k,r in ranges.items()}
  if name=='feedback':p['mode']=['bare airframe','rate only','attitude + rate'][j%3]
  case(name,p)
 for endpoint in [0,1]:case(name,{k:r[endpoint] for k,r in ranges.items()})
for h in [.25,math.nextafter(.5,0),.5,math.nextafter(.5,1)]:
 for tail in [0,5e-324,1e-300,.25,.5]:
  case('staticAircraft',dict(cg=h,tailArea=tail,deltaAlpha=5e-324))
  case('trimAircraft',dict(cg=h,tailArea=tail))
for fin in [0,math.nextafter(.25,0),.25,math.nextafter(.25,1),5e-324]:case('directional',dict(fin=fin,beta=5e-324))
for angle in [math.nextafter(16/3,0),16/3,math.nextafter(16/3,math.inf),0,16]:case('lateral',dict(dihedral=angle))
for speed in [math.nextafter(16,0),16,math.nextafter(16,math.inf)]:
 for damping in [0,.15]:case('flutter',dict(speed=speed,damping=damping))
for mode in ['bare airframe','rate only','attitude + rate']:
 for cg in [math.nextafter(.5,0),.5,math.nextafter(.5,1),.65]:case('feedback',dict(cg=cg,mode=mode,attitudeGain=0))
for t in [0,.5,math.nextafter(.5,0),math.nextafter(.5,1),10]:case('shortPeriod',dict(time=t))

destination=ROOT/'tests/fixtures/wave6-aero-reference.json'
destination.write_text(json.dumps(dict(generator='mpmath; independent direct balances / principal minors / expm',precision=dict(algebra=1000,dynamics=90),rows=ROWS),indent=2,allow_nan=False)+'\n')
print(f'{len(ROWS)} independent cases written to {destination}')
