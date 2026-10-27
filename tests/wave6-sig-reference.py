"""Independent SIG6 references: 90-digit matrix exponentials, spectral/time quadrature,
complex Gaussian inversion, and direct principal-value gain/phase integration.
Own synthetic stimuli. No reference to JS implementation or original-book figures.
"""
import json,math,pathlib,itertools,argparse,mpmath as mp
mp.mp.dps=90
parser=argparse.ArgumentParser();parser.add_argument('--output',type=pathlib.Path,default=pathlib.Path(__file__).resolve().parent/'fixtures/wave6-sig-reference.json');args=parser.parse_args();out={}
def M(x):return mp.mpf(x)  # Import the exact original binary64 stimulus, including near-equal pole/zero values.
def v(x):
 if isinstance(x,dict):return {k:v(a) for k,a in x.items()}
 if isinstance(x,(tuple,list)):return [v(a) for a in x]
 if isinstance(x,mp.mpc):return [float(x.real),float(x.imag)]
 if isinstance(x,mp.mpf):return float(x) if mp.isfinite(x) else 'infinite'
 return x
def row(args,expect):return {'args':args,'expect':v(expect)}
def publish(name,rows):out[name]=rows;print(name,len(rows),flush=True)
def step2(t,zeta,omega):
 t,z,w=map(M,[t,zeta,omega])
 if t<0:return mp.mpf(0)
 A=mp.matrix([[0,1,0],[-w*w,-2*z*w,w*w],[0,0,0]])
 return (mp.expm(t*A)*mp.matrix([0,0,1]))[0]
def impulse2(t,zeta,omega):
 t,z,w=map(M,[t,zeta,omega]);A=mp.matrix([[0,1],[-w*w,-2*z*w]])
 return (mp.expm(t*A)*mp.matrix([0,w*w]))[0]
publish('si',[row({'x':x},mp.quad(lambda t:mp.sin(t)/t if t else 1,[0,*[k*math.pi/2 for k in range(1,int(abs(x)/(math.pi/2))+1)],x]) if x>0 else mp.si(x)) for x in [-80,-30,-math.pi,-.0000001,0,1e-20,.01,.5,1,math.pi,10,30,50,80]])
publish('first',[row({'tau':tau,'t':t},-mp.expm1(-M(t)/M(tau))) for tau,t in itertools.product([.05,.2,1,2,5],[0,1e-20,.01,.1,1,3,10,30])])
publish('firstFrequency',[row({'tau':tau,'w':w},{'h':1/(1+mp.j*M(w)*M(tau)),'delay':M(tau)/(1+(M(w)*M(tau))**2)}) for tau,w in itertools.product([.05,.2,1,2,5],[0,.001,.1,1,3,10,100])])
rows=[]
for W,D,w in itertools.product([.5,1,2,5],[.5,2,8],[0,.1,.5,1,2,5,10]):
 Wm,Dm,wm=map(M,[W,D,w]);f=lambda u:Wm/mp.pi*mp.sinc(Wm*u)*mp.cos(wm*u)
 integral=2*mp.quad(f,[0,*[Dm*k/8 for k in range(1,8)],Dm]);rows.append(row({'W':W,'delay':D,'w':w},{'signedGain':integral,'h':integral*mp.exp(-mp.j*wm*Dm)}))
publish('truncation',rows)
rows=[]
for alpha,R in itertools.product([.6,1,2,3],[.1,1,3,10,50]):
 a,r=map(M,[alpha,R]);q=2*mp.quad(lambda w:a/2*mp.log(1+w*w)/(1+w*w),[0,r]);rows.append(row({'family':'power law','alpha':alpha,'R':R},{'value':q,'limit':a*mp.pi*mp.log(2)}))
for a,R in itertools.product([.05,.5,2],[.1,1,10,50]):
 am,r=map(M,[a,R]);q=2*mp.quad(lambda w:am*w*w/(1+w*w),[0,r]);rows.append(row({'family':'Gaussian','a':a,'R':R},{'value':q}))
publish('paley',rows)
rows=[]
for sigma,beta,delay,carrier,t in itertools.product([.3,1,3],[-6,0,2,6],[0,2],[1,5],[-3,0,2,5]):
 s,b,d,c,tm=map(M,[sigma,beta,delay,carrier,t]);A=(s*s+mp.j*b)/2;B=mp.j*(tm-d)
 # Complete-square inversion of the raw spectral Gaussian; independent complex arithmetic.
 z=s/mp.sqrt(2*mp.pi)*mp.sqrt(mp.pi/A)*mp.exp(B*B/(4*A))*mp.exp(mp.j*c*(tm-d))
 rows.append(row({'sigma':sigma,'beta':beta,'delay':delay,'carrier':carrier,'t':t},{'z':z,'width':mp.sqrt(s*s+b*b/(s*s))}))
publish('packet',rows)
rows=[]
for zeta,omega,t in itertools.product([.05,.4,math.sqrt(.5),.9,.9999999999999999,1,1.0000000000000002,1.2,2],[.5,2,5],[0,1e-20,.01,.1,1,3,10]):
 rows.append(row({'zeta':zeta,'omega':omega,'t':t},{'step':step2(t,zeta,omega),'impulse':impulse2(t,zeta,omega)}))
publish('second',rows)
rows=[]
for zeta,omega,w in itertools.product([.05,.4,math.sqrt(.5),.9,1,1.2,2],[.5,2,5],[0,.01,.5,1,2,5,20]):
 z,wn,wm=map(M,[zeta,omega,w]);A=mp.matrix([[mp.j*wm,-1],[wn*wn,mp.j*wm+2*z*wn]]);x=mp.lu_solve(A,mp.matrix([0,wn*wn]))
 rows.append(row({'zeta':zeta,'omega':omega,'w':w},{'h':x[0]}))
publish('secondFrequency',rows)
rows=[]
for pole,zero,w in itertools.product([.2,1,5],[.2,1,1.0000000000000002,5],[.1,.5,1,3,10]):
 p,z,wm=map(M,[pole,zero,w]);L=lambda x:mp.log(abs((1+mp.j*x/z)/(1+mp.j*x/p)))
 derivative=wm/(z*z+wm*wm)-wm/(p*p+wm*wm)
 def f(x):
  if x==wm:return derivative/(2*wm)
  return (L(x)-L(wm))/(x*x-wm*wm)
 q=2*wm/mp.pi*mp.quad(f,[0,wm/2,wm,2*wm,mp.inf]);exact=mp.arg((1+mp.j*wm/z)/(1+mp.j*wm/p))
 assert abs(q-exact)<mp.mpf('1e-75'),(pole,zero,w,q,exact)
 rows.append(row({'pole':pole,'zero':zero,'w':w},{'phase':q,'exact':exact}))
publish('gainPhase',rows)
rows=[]
for pole,zero,reflected,t in itertools.product([.2,1,5],[.2,2,5],[False,True],[0,.01,.5,2,10]):
 p,z,tm=map(M,[pole,zero,t]);D=(-1 if reflected else 1)*p/z;C=p*(1-D)
 # Realization y = D*u + C*x, x' = -p*x + u.
 E=mp.expm(tm*mp.matrix([[-p,1],[0,0]]));answer=D+C*(E*mp.matrix([0,1]))[0]
 rows.append(row({'pole':pole,'zero':zero,'reflected':reflected,'t':t},answer))
publish('minimumStep',rows)
rows=[]
for W,r,t in itertools.product([.5,2,5],[0,.01,.3,.7,1],[-5,-1,-.01,0,.01,1,5]):
 wm,rm,tm=map(M,[W,r,t]);lo=wm*(1-rm);hi=wm*(1+rm)
 def f(w):
  gain=1 if w<=lo else (hi-w)/(hi-lo)
  return gain*(mp.sin(w*tm)/w if w else tm)
 integral=mp.quad(f,[0,lo,hi]) if rm else mp.si(wm*tm)
 rows.append(row({'W':W,'taper':r,'t':t},mp.mpf('.5')+integral/mp.pi))
publish('taperStep',rows)
rows=[]
for family,ratio in itertools.product(['one pole','two poles','one pole plus all-pass'],[.05,.2,1,2,5]):
 r=M(ratio);c=mp.sqrt(mp.sqrt(2)-1)
 def f(u):
  if family=='one pole':return 1-mp.exp(-u)
  if family=='two poles':return 1-mp.exp(-u/c)*(1+u/c)
  if r==1:return 1-mp.exp(-u)*(1+2*u)
  return 1+2/(r-1)*mp.exp(-r*u)-(r+1)/(r-1)*mp.exp(-u)
 def root(target):
  lo=mp.mpf(0);hi=mp.mpf(1)
  while f(hi)<target:hi*=2
  for _ in range(320):
   mid=(lo+hi)/2
   if f(mid)<target:lo=mid
   else:hi=mid
  return (lo+hi)/2
 t10,t90=root(mp.mpf('.1')),root(mp.mpf('.9'));rows.append(row({'family':family,'ratio':ratio},{'t10':t10,'t90':t90,'product':(t90-t10)/(2*mp.pi)}))
publish('rise',rows)
rows=[]
for pole,zero,withZero,w in itertools.product([.2,1,5],[.2,1,1.0000000000000002,5],[False,True],[.001,.1,1,10,1000]):
 p,z,wm=map(M,[pole,zero,w]);h=(1+mp.j*wm/z if withZero else 1)/(1+mp.j*wm/p)
 rows.append(row({'pole':pole,'zero':zero,'withZero':withZero,'w':w},{'dB':20*mp.log10(abs(h)),'phase':mp.arg(h)}))
publish('bode',rows)
rows=[]
for pole,zero,reflected,delay,w in itertools.product([.2,1,5],[.2,2,5],[False,True],[0,2],[0,.01,.1,1,3,10,100]):
 p,z,dm,wm=map(M,[pole,zero,delay,w]);h=lambda x:(1+(-1 if reflected else 1)*mp.j*x/z)/(1+mp.j*x/p)*mp.exp(-mp.j*x*dm)
 phase=mp.arg((1+(-1 if reflected else 1)*mp.j*wm/z)/(1+mp.j*wm/p))-wm*dm
 delayValue=-mp.im(mp.diff(h,wm)/h(wm))
 rows.append(row({'pole':pole,'zero':zero,'reflected':reflected,'delay':delay,'w':w},{'h':h(wm),'phase':phase,'groupDelay':delayValue}))
publish('minimumFrequency',rows)
rows=[]
for W,r,t in itertools.product([.5,2,5],[0,.01,.3,.7,1],[-5,-1,-.01,0,.01,1,5]):
 wm,rm,tm=map(M,[W,r,t]);lo=wm*(1-rm);hi=wm*(1+rm)
 def f(w):return (1 if w<=lo else (hi-w)/(hi-lo))*mp.cos(w*tm)
 integral=mp.quad(f,[0,lo,hi]) if rm else mp.quad(f,[0,wm])
 rows.append(row({'W':W,'taper':r,'t':t},integral/mp.pi))
publish('taperImpulse',rows)
args.output.write_text(json.dumps({'method':'90-digit independent references; exact mathematical family definitions, matrix exponential ODE realizations, spectral/time quadrature, direct PV integral, 320-step high-precision crossing brackets','cases':sum(map(len,out.values())),'families':out},indent=2,allow_nan=False)+'\n');print('total',sum(map(len,out.values())))
