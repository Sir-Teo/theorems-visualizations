"""Independent exact-rational and 100-digit references for ML review companions."""
import json,pathlib,random,math,sys
from fractions import Fraction as F
try:import mpmath as m
except ModuleNotFoundError:sys.path.insert(0,'/tmp/atlas-numerical-python');import mpmath as m
m.mp.dps=100;ROOT=pathlib.Path(__file__).resolve().parents[1];out={'precision':100,'quantization':[],'sampleBounds':[],'bayes':[]}
for bits in range(1,65):
 for x in [0.,1.,.37,.62,math.nextafter(1.,0.),math.nextafter(0.,1.)]:
  a=F.from_float(x);N=2**bits;j=min(N-1,int(a*N));q=F(2*j+1,2*N);out['quantization'].append({'b':bits,'x':x,'index':str(j),'value':float(q),'error':float(abs(a-q))})
for b in [1,6,32,53,64]:
 for d in [1,10,100,1000000]:
  for ep in ['.02','.1','.3']:
   for de in ['.01','.05','.5']:
    B=2*(b*d*m.log(2)+m.log(2/m.mpf(de)))/m.mpf(ep)**2;out['sampleBounds'].append({'b':b,'d':d,'eps':ep,'delta':de,'value':str(m.ceil(B))})
r=random.Random(120)
for ys,n in [([0,100],3),([50,50],7),([28,20,55,80,60,30,90],60)]+[([r.randrange(101)for _ in range(7)],6)for _ in range(12)]:
 ys=list(map(lambda x:F(x,100),ys));pred=[r.randrange(2)for _ in range(n)]
 def eta(x):
  t=x*(len(ys)-1);i=min(len(ys)-2,t.numerator//t.denominator);u=t-i;return ys[i]*(1-u)+ys[i+1]*u
 cuts=sorted(set([F(i,len(ys)-1)for i in range(len(ys))]+[F(i,n)for i in range(n+1)]));extra=[]
 for a,b in zip(cuts,cuts[1:]):
  ea,eb=eta(a),eta(b)
  if (ea-F(1,2))*(eb-F(1,2))<0:extra.append(a+(F(1,2)-ea)*(b-a)/(eb-ea))
 cuts=sorted(set(cuts+extra));L=F(0);B=F(0);E=F(0)
 for a,b in zip(cuts,cuts[1:]):
  mid=(a+b)/2;p=pred[min(n-1,int(mid*n))];mu=(eta(a)+eta(b))/2;bay=int(mu>=F(1,2));L+=(b-a)*(1-mu if p else mu);B+=(b-a)*(1-mu if bay else mu)
  if p!=bay:E+=(b-a)*abs(2*mu-1)
 out['bayes'].append({'ys':list(map(float,ys)),'pred':pred,'L':str(L),'bayes':str(B),'excess':str(E)})
z=[-5+m.mpf(i)/6 for i in range(61)];w=[m.exp(-t*t/2)for t in z];w=[t/sum(w)for t in w];xx=xy=yy=m.mpf(0)
for i in range(200):
 x=(m.mpf(i)+m.mpf('.5'))/200;xx+=x*x/200
 for t,p in zip(z,w):
  y=max(0,min(1,m.mpf('.15')+m.mpf('.7')*x+m.mpf('.2')*t));xy+=x*y*p/200;yy+=y*y*p/200
out['squaredMoments']={k:str(v)for k,v in [('mxx',xx),('mxy',xy),('myy',yy),('wOpt',xy/xx),('minimum',yy-xy*xy/xx)]}
(ROOT/'docs/verification/ml-foundations-references.json').write_text(json.dumps(out,indent=2)+'\n')
