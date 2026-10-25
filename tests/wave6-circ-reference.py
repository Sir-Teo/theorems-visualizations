"""Independent CIRC6 references. Original binary64 parameters into mpmath physical
state equations, exact Fraction regime signs, independent quadratic-moment heat.
No import of the JavaScript model.90 digits ordinary;1800 for extreme stimuli.
"""
import json,math,itertools,random,pathlib,argparse
from fractions import Fraction
import mpmath as mp
parser=argparse.ArgumentParser();parser.add_argument('--output',type=pathlib.Path,default=pathlib.Path(__file__).resolve().parent/'fixtures/wave6-circ-reference.json');args=parser.parse_args();out={}
def work(values):return mp.workdps(1800 if any(x and abs(x)<1e-100 for x in values) else 90)
def f(x):
 if x==0:return 0.0
 sign,mantissa,exponent,bits=x._mpf_;q=Fraction((-1 if sign else 1)*int(mantissa));q=q*(1<<exponent) if exponent>=0 else q/Fraction(1<<(-exponent))
 try:return float(q)
 except OverflowError:return 'negative overflow' if x<0 else 'positive overflow'
def q(x):return {'value':f(x),'sign':int(mp.sign(x)),'logMagnitude':None if x==0 else f(mp.log(abs(x)))}
def row(args,expect):return {'args':args,'expect':expect}
def publish(name,rows):out[name]=rows;print(name,len(rows),flush=True)
def physical(R,L,C,t,v0,i0,source):
 R,L,C,t,v0,i0,source=map(mp.mpf,[R,L,C,t,v0,i0,source]);A=mp.matrix([[0,1/C,0],[-1/L,-R/L,1/L],[0,0,0]]);z=mp.expm(A*t)*mp.matrix([v0,i0,source]);v,i=z[0],z[1];di=(source-R*i-v)/L
 # At exact critical damping an exact polynomial coefficient can vanish.
 # Compute that coefficient before multiplying its nonzero exponential;
 # do not interpret a residual from subtracting approximate states as a sign.
 if R*R*C==4*L:
  alpha=R/(2*L);error=v0-source;B=alpha*i0+error/L;di=mp.exp(-alpha*t)*(-2*alpha*i0-error/L+alpha*B*t)
 return dict(v=q(v),i=q(i),energy=q((C*v*v+L*i*i)/2),dissipation=q(R*i*i),dv=q(i/C),di=q(di))
params=[]
for L,C in [(1.,1.),(.1,.1),(4.,4.),(.1,4.),(4.,.1),(.33,2.7)]:
 critical=2*math.sqrt(L/C)
 for R in [0.,math.nextafter(0.,1.),.2,math.nextafter(critical,0.),critical,math.nextafter(critical,math.inf),12.]:params.append(dict(R=R,L=L,C=C))
rows=[]
for a in params:
 with work(a.values()):
  R,L,C=map(mp.mpf,[a['R'],a['L'],a['C']]);D=Fraction(a['R'])**2*Fraction(a['C'])-4*Fraction(a['L']);sgn=(D>0)-(D<0);disc=R*R-4*L/C;re=-R/(2*L)
  roots=[[f(re),f(mp.sqrt(-disc)/(2*L))],[f(re),f(-mp.sqrt(-disc)/(2*L))]] if disc<0 else [[f((-R+mp.sqrt(disc))/(2*L)),0],[f((-R-mp.sqrt(disc))/(2*L)),0]]
  rows.append(row(a,dict(regime=['underdamped','critical','overdamped'][sgn+1],omega=q(1/mp.sqrt(L*C)),zeta=q(R/2*mp.sqrt(C/L)),alpha=q(R/(2*L)),roots=roots)))
publish('parameters',rows)
rows=[]
for gamma,t in itertools.product([0.,math.nextafter(0.,1.),.01,.5,1.,math.nextafter(2.,0.),2.,math.nextafter(2.,math.inf),4.,75.],[0.,math.nextafter(0.,1.),1e-7,.01,1.,10.]):
 for v0,j0,source in [(0.,0.,1.),(1.,-.25,0.)]:
  a=dict(gamma=gamma,t=t,v0=v0,j0=j0,source=source)
  with work(a.values()):
   g,T,V,J,U=map(mp.mpf,[gamma,t,v0,j0,source]);A=mp.matrix([[0,1,0],[-1,-g,1],[0,0,0]]);z=mp.expm(A*T)*mp.matrix([V,J,U]);rows.append(row(a,dict(v=q(z[0]),j=q(z[1]))))
publish('normalized',rows)
rows=[]
selected=[params[i] for i in [0,1,4,6,7,13,20,27,34,41]]
for a,t,(v0,i0,source) in itertools.product(selected,[0.,math.nextafter(0.,1.),.1,1.,10.],[(0.,0.,1.),(-1.,.5,-.7),(math.nextafter(0.,1.),0.,0.)]):
 a={**a,'t':t,'v0':v0,'i0':i0,'source':source}
 with work(a.values()):rows.append(row(a,physical(**a)))
publish('physical',rows)
rows=[]
for a,t,(v0,i0) in itertools.product(selected,[0.,math.nextafter(0.,1.),1e-7,.1,1.,10.],[(1.,0.),(.5,-.7),(0.,math.nextafter(0.,1.))]):
 a={**a,'t':t,'v0':v0,'i0':i0}
 with work(a.values()):
  R,L,C,T,V,I=map(mp.mpf,[a[k] for k in ['R','L','C','t','v0','i0']]);A=mp.matrix([[0,2/C,0,0],[-1/L,-R/L,1/C,0],[0,-2/L,-2*R/L,0],[0,0,R,0]]);z=mp.expm(A*T)*mp.matrix([V*V,V*I,I*I,0]);rows.append(row(a,dict(heat=q(z[3]))))
publish('joule',rows)
rows=[]
for R,rise,t in itertools.product([0.,20.,2*math.sqrt(10e-9/20e-12),200.],[0.,20e-12,200e-12,5e-9],[0.,math.nextafter(0.,1.),.1e-9,1e-9,10e-9]):
 a=dict(R=R,L=10e-9,C=20e-12,rise=rise,amplitude=1.,t=t)
 with work(a.values()):
  if rise==0:
   z=physical(R,a['L'],a['C'],t,0.,0.,1.);rows.append(row(a,dict(v=z['v'],i=z['i'],input=q(mp.mpf(1)))))
  else:
   R,L,C,r,T=map(mp.mpf,[R,a['L'],a['C'],rise,t]);A=mp.matrix([[0,1/C,0,0],[-1/L,-R/L,1/L,0],[0,0,-1/r,1/r],[0,0,0,0]]);z=mp.expm(A*T)*mp.matrix([0,0,0,1]);rows.append(row(a,dict(v=q(z[0]),i=q(z[1]),input=q(-mp.expm1(-T/r)))))
publish('edge',rows)
rows=[]
for real,imag,L in [(-.5,1.,1.),(-2.,.15,4.),(-math.nextafter(0.,1.),.15,.3),(-1e-12,4.,.3),(0.,3.,2.),(-math.nextafter(0.,1.),4.,.25)]:
 for t in [0.,.1,1.,10.]:
  a=dict(real=real,imaginary=imag,L=L,t=t)
  with work(a.values()):
   x,y,l,T=map(mp.mpf,[real,imag,L,t]);R=-2*l*x;C=1/(l*(x*x+y*y));z=physical(R,l,C,T,0,0,1);rows.append(row(a,dict(omega=q(mp.sqrt(x*x+y*y)),zeta=q(-x/mp.sqrt(x*x+y*y)),v=z['v'],i=z['i'])))
publish('rootGeometry',rows)
rows=[]
for R,L,C,t in itertools.product([.1,1.,20.],[1.,.1],[1.,4.],[.1,1.,10.]):
 a=dict(R=R,L=L,C=C,t=t)
 with work(a.values()):
  R,L,C,T=map(mp.mpf,[R,L,C,t]);A=mp.matrix([[-1/(R*C),-1/C,1/C],[1/L,0,0],[0,0,0]]);z=mp.expm(A*T)*mp.matrix([0,0,1]);v,i=z[0],z[1];rows.append(row(a,dict(v=q(v),iL=q(i),energy=q((C*v*v+L*i*i)/2),dissipation=q(v*v/R))))
publish('parallel',rows)
rows=[]
for R,(L,C),t in itertools.product([.1,1.,12.],[(1.,1.),(.1,4.)],[.1,1.,10.]):
 a=dict(R=R,L=L,C=C,t=t)
 with work(a.values()):
  r,l,c,T=map(mp.mpf,[R,L,C,t]);rp=l/(c*r);z=physical(r,l,c,T,0,0,1);rows.append(row(a,dict(parallelResistance=q(rp),output=z['v'])))
publish('matchedDual',rows)
rows=[]
for (mass,damping,stiffness),t in itertools.product([(.3,0.,2.7),(1.,2.,1.),(4.,8.,.25),(.25,math.nextafter(0.,1.),4.)],[0.,.1,1.,10.]):
 a=dict(mass=mass,damping=damping,stiffness=stiffness,t=t,x0=1.,velocity0=.2,force=.7)
 with work(a.values()):
  m,b,k,T,X,V,F=map(mp.mpf,[a[n] for n in ['mass','damping','stiffness','t','x0','velocity0','force']]);A=mp.matrix([[0,1,0],[-k/m,-b/m,1/m],[0,0,0]]);z=mp.expm(A*T)*mp.matrix([X,V,F]);rows.append(row(a,dict(x=q(z[0]),velocity=q(z[1]),energy=q((k*z[0]**2+m*z[1]**2)/2))))
publish('mechanical',rows)
# Extra late currents exercise decaying-error propagation without a spurious DC floor.
for R,rise,t in [(20.,200e-12,100e-9),(2*math.sqrt(10e-9/20e-12),200e-12,100e-9),(2*math.sqrt(10e-9/20e-12),20e-12,50e-9)]:
 a=dict(R=R,L=10e-9,C=20e-12,rise=rise,amplitude=1.,t=t)
 with work(a.values()):
  r,l,c,h,T=map(mp.mpf,[R,a['L'],a['C'],rise,t]);A=mp.matrix([[0,1/c,0,0],[-1/l,-r/l,1/l,0],[0,0,-1/h,1/h],[0,0,0,0]]);z=mp.expm(A*T)*mp.matrix([0,0,0,1]);out['edge'].append(row(a,dict(v=q(z[0]),i=q(z[1]),input=q(-mp.expm1(-T/h)))))
# Tiny source amplitudes must retain positive below-range voltage/current/energy status.
for R,L,C,t in [(1.,1.,1.,.1),(1.,4.,4.,.1),(1.,1.,1.,1.),(1.,4.,4.,10.)]:
 a=dict(R=R,L=L,C=C,t=t,v0=0.,i0=0.,source=math.nextafter(0.,1.))
 with work(a.values()):out['physical'].append(row(a,physical(**a)))
for v0,i0,source in [(0.,0.,1.),(1.,0.,0.),(math.nextafter(0.,1.),0.,0.)]:
 a=dict(R=2.,L=1.,C=1.,t=100.,v0=v0,i0=i0,source=source)
 with work(a.values()):out['physical'].append(row(a,physical(**a)))
args.output.write_text(json.dumps({'precision':'90 digits ordinary;1800 digits for extreme original binary64 stimuli','method':'Independent physical/normalized mpmath matrix exponentials; exact Fraction discriminant signs; independent physical quadratic-moment Joule integral; exact dyadic Fraction output rounding','families':out},sort_keys=True,indent=2,allow_nan=False)+'\n');print('TOTAL',sum(map(len,out.values())),flush=True)
