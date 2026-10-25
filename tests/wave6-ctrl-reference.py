"""Independent CTRL6 prototype references: exact SymPy rectangle root counts and
Hurwitz minors; 90-digit matrix exponentials and complex polynomial evaluation.
No import of the JavaScript implementation. Original binary64 stimuli retained.
"""
import json,math,random,itertools,argparse,pathlib
import sympy as sp
import mpmath as mp
mp.mp.dps=90
parser=argparse.ArgumentParser();parser.add_argument('--output',type=pathlib.Path,default=pathlib.Path(__file__).resolve().parent/'fixtures/wave6-ctrl-reference.json');args=parser.parse_args()
x=sp.Symbol('s');out={}
def S(a):return sp.Rational(a)
def M(a):return mp.mpf(int(a.p))/int(a.q) if isinstance(a,sp.Rational) else mp.mpf(a)
def serial(a):
 if isinstance(a,dict):return{k:serial(v) for k,v in a.items()}
 if isinstance(a,(list,tuple)):return[serial(v) for v in a]
 if isinstance(a,mp.mpc):return[float(a.real),float(a.imag)]
 if isinstance(a,sp.Rational):return str(a)
 if isinstance(a,mp.mpf):return float(a)
 return a
def publish(name,rows):out[name]=serial(rows);print(name,len(rows),flush=True)
def coef(expr):return sp.Poly(expr,x).all_coeffs()[::-1]
def counts(c):
 p=sp.Poly.from_list(list(reversed(c)),x);origins=0
 while p.degree()>0 and p.nth(0)==0:p=p.exquo(sp.Poly(x,x));origins+=1
 n=p.degree()
 if n==0:return {'right':0,'left':0,'axis':origins}
 B=2+sp.ceiling(max([abs(a/p.LC()) for a in p.all_coeffs()[1:]] or [0]));ri=p.count_roots(-sp.I*B,B+sp.I*B);le=p.count_roots(-B-sp.I*B,sp.I*B)
 return {'right':int(n-le),'left':int(n-ri),'axis':int(ri+le-n+origins)}
def minors(c):
 b=list(reversed(c));n=len(b)-1;h=sp.Matrix(n,n,lambda i,j:b[2*j-i+1] if 0<=2*j-i+1<=n else 0);d=[sp.Integer(1)]+[h[:k,:k].det() for k in range(1,n+1)]
 if any(z==0 for z in d[:-1]):return None
 return [c[-1]]+[d[k]/d[k-1] for k in range(1,n+1)]
def countrow(c,args):return{'args':args,'coefficients':c,'expect':{**counts(c),'firstColumnFromHurwitzMinors':minors(c)}}
polys=[[1,3,3,1],[1,4,6,4,1],[1,2,1,2,1],[-1,0,0,0,1],[1,1,1,1],[0,2,2,1],[0,0,0,1],[1,0,2,0,1],[1,0,-2,0,1],[0,0,0,0,1],[4,0,5,0,1],[-4,0,-3,0,1],[1,0,0,0,0,0,1],[0,-1,0,1]]
for b in [1,3,6]:
 for delta in [0,math.ulp(float(b)), -math.ulp(float(b))]:polys.append([float(b)+delta,1,float(b),1])
rng=random.Random(613)
for degree in [1,2,3,4,5,6]:
 for i in range(10):polys.append([rng.randint(-5,8) for _ in range(degree)]+[rng.choice([1,2,3])])
publish('routh',[countrow(list(map(S,c)),{'coefficients':c}) for c in polys])
rows=[]
for a,b in [(1.,3.),(.2,.7),(2.,2.),(6.,1.)]:
 for gain in [0.,math.nextafter(0.,1.),.1,1.,6.,12.,80.]:
  c=coef(x*(x+S(a))*(x+S(b))+S(gain));rows.append(countrow(c,{'a':a,'b':b,'gain':gain}))
publish('gainRange',rows)
rows=[]
for gain in [0.,.1,.25,.3,.5,1.,5.,5.75,5.8,6.,8.]:
 c=coef(x**4+x**3+3*x*x+x+1+S(gain)*(10*x**3+x*x+x));margin=1+12*S(gain)-60*S(gain)**2+10*S(gain)**3;rows.append({**countrow(c,{'gain':gain}),'margin':margin})
thresholds=sp.Poly(1+12*x-60*x*x+10*x**3,x).intervals(eps=sp.Rational(1,10**35));publish('conditional',rows);publish('conditionalBoundaries',[{'interval':[str(a),str(b)],'midpoint':float((a+b)/2),'multiplicity':m} for (a,b),m in thresholds])
rows=[]
for radius in [0.,math.nextafter(0.,1.),.1,.2,.3,.4,.6,.8]:
 lows=[S(a)*(1-S(radius)) for a in [1,4,6,4]]+[sp.Integer(1)];highs=[S(a)*(1+S(radius)) for a in [1,4,6,4]]+[sp.Integer(1)]
 # Enumerate all coefficient-box vertices independently of the JS four-corner function.
 vertices=[]
 for bits in itertools.product([0,1],repeat=4):
  c=[(highs if bits[j] else lows)[j] for j in range(4)]+[sp.Integer(1)];vertices.append({'bits':bits,'counts':counts(c)})
 rows.append({'args':{'radius':radius},'lows':lows,'highs':highs,'vertices':vertices,'allVerticesStable':all(v['counts']['right']==0 and v['counts']['axis']==0 for v in vertices)})
publish('interval',rows)
rows=[]
for family in ['lead','lag']:
 states=[{'gain':k,'zero':z,'ratio':r} for k,z,r in [(30.,2.,4.),(.1,.2,2.),(80.,.5,10.)]] if family=='lead' else [{'gain':k,'pole':p,'ratio':r} for k,p,r in [(4.,.05,10.),(20.,.5,30.),(.1,.01,1.),(20.,.01,30.)]]
 for state in states:
  k=S(state['gain'])
  if family=='lead':z=S(state['zero']);p=z*S(state['ratio']);d=x*(x+2)*(x+p)
  else:p=S(state['pole']);z=p*S(state['ratio']);d=(x+1)*(x+2)*(x+p)
  c=coef(d+k*(x+z));rows.append({**countrow(c,{'family':family,**state}),'dcLoop':k*z/(2*p) if family=='lag' else None})
publish('compensators',rows)
rows=[]
# Independent held-unit-input state model; each point is exp(A*t) from zero,
# rather than repeated propagation using one precomputed transition.
for row in out['compensators']:
 state=row['args'];family=state['family'];k=M(state['gain'])
 if family=='lead':z=M(state['zero']);p=z*M(state['ratio']);den=[mp.mpf(0),2*p,p+2,mp.mpf(1)]
 else:p=M(state['pole']);z=p*M(state['ratio']);den=[2*p,2+3*p,3+p,mp.mpf(1)]
 den[0]+=k*z;den[1]+=k
 a=mp.matrix([[0,1,0,0],[0,0,1,0],[-den[0],-den[1],-den[2],1],[0,0,0,0]])
 for t in [0.,1e-5,.01,.1,1.,4.,12.,40.]:
  v=mp.expm(a*M(t))*mp.matrix([0,0,0,1]);y=k*z*v[0]+k*v[1];rows.append({'args':{**state,'time':t},'expect':y})
publish('step',rows)
rows=[]
for profile,d,n in [('three real poles',[0,3,4,1],[1]),('one finite zero',[0,3,4,1],[2,1]),('complex pole pair',[5,7,3,1],[1])]:
 for re,im in [(-.5,0.),(-2.,0.),(-4.,0.),(0.,0.),(-2.,1.),(-1.,2.),(-1.,-2.),(math.nextafter(-1.,0.),math.nextafter(0.,1.))]:
  z=mp.mpc(M(re),M(im));D=mp.polyval(list(reversed(d)),z);N=mp.polyval(list(reversed(n)),z);defined=bool(D and N)
  # Exact rational complex evaluation decides membership, independently of trigonometric tolerance.
  sq=S(re)+sp.I*S(im);dq=sum(S(a)*sq**j for j,a in enumerate(d));nq=sum(S(a)*sq**j for j,a in enumerate(n));q=sp.cancel(-dq/nq) if nq else None
  rows.append({'args':{'profile':profile,'point':[re,im]},'expect':{'defined':defined,'onLocus':bool(defined and sp.im(q)==0 and sp.re(q)>0),'requiredGain':abs(D/N) if defined else None,'ratio':-D/N if defined else None}})
publish('angle',rows)
rows=[]
for c in polys[:14]+[[1,1,3,1,1],[1,1.5,3.5,6,1],[1,7,9,61,1],[.1,.5,1,1]]:
 p=sp.Poly.from_list(list(reversed(list(map(S,c)))),x);real,complex_=p.intervals(all=True,eps=sp.Rational(1,10**28));roots=[]
 for (lo,hi),m in real:roots.extend([[float((lo+hi)/2),0.]]*m)
 for (lo,hi),m in complex_:roots.extend([[float(sp.re(lo+hi)/2),float(sp.im(lo+hi)/2)]]*m)
 rows.append({'args':{'coefficients':c},'expect':roots})
publish('roots',rows)
# Python Fraction-to-float supplies independent correctly rounded binary64 results.
from fractions import Fraction
rounding=[]
for exponent in [-1074,-1022,-52,0,1,52,1023]:
 base=Fraction(2)**exponent;ulp=Fraction(2)**max(-1074,exponent-52)
 for offset in [Fraction(-3,4),Fraction(-1,2),Fraction(-1,4),Fraction(0),Fraction(1,4),Fraction(1,2),Fraction(3,4),Fraction(3,2)]:
  a=base+offset*ulp
  for sign_ in [-1,1]:
   q=sign_*a
   try:expected=float(q)
   except OverflowError:expected='negative overflow' if q<0 else 'positive overflow'
   rounding.append({'args':{'numerator':str(q.numerator),'denominator':str(q.denominator)},'expect':expected})
for sign_ in [-1,1]:
 q=Fraction(2)+sign_*Fraction(math.nextafter(0.,1.));rounding.append({'args':{'numerator':str(q.numerator),'denominator':str(q.denominator)},'expect':float(q)})
publish('rationalRounding',rounding)
args.output.write_text(json.dumps({'precisionDigits':90,'exactRootCountMethod':'SymPy exact closed right/left rectangle counts with strict Cauchy bound; Origin factors removed exactly first to avoid the repeated-origin boundary counting defect; other shared-axis counts recovered by inclusion-exclusion. No Routh algorithm in oracle.','families':out},indent=2,sort_keys=True)+'\n');print('TOTAL',sum(map(len,out.values())),flush=True)
