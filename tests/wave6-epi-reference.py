"""Independent high-precision enumeration; imports no production JavaScript or network."""
import json, math, sys
from pathlib import Path
import mpmath as m
from fractions import Fraction
m.mp.dps=1600
TINY=float.fromhex('0x0.0000000000001p-1022')
def mp(x): return Fraction(x)
def real(x):return m.mpf(x.numerator)/x.denominator if isinstance(x,Fraction) else m.mpf(x)
def metric(x):
    if x==0:return {'value':0,'log':None,'status':'zero'}
    try:v=float(x)
    except OverflowError:v=math.inf
    return {'value':None if math.isinf(v) else v,'log':float(m.log(real(x))),'status':'positive above binary64 range' if math.isinf(v) else 'positive below normal binary64 range' if real(x)<m.mpf(2)**-1022 else 'positive'}
def ratio(a,b):return None if a==b==0 else {'value':None,'log':None,'status':'unbounded'} if b==0 else metric(a/b)
def diff(a,b):return {'sign':(1 if a>b else -1 if a<b else 0),**metric(abs(a-b))}
def conditional(a,b):return None if a+b==0 else {'yes':metric(a/(a+b)),'no':metric(b/(a+b))}
def summary(c):
    a,b,z,d=c;t=sum(c)
    e=conditional(a,b);u=conditional(z,d)
    return {'mass':list(map(metric,c)),'normalized':None if t==0 else [metric(x/t) for x in c],'total':metric(t),'exposed':e,'unexposed':u,'cases':conditional(a,z),'controls':conditional(b,d),'RR':None if a+b==0 or z+d==0 else ratio(a/(a+b),z/(z+d)),'OR':ratio(a*d,b*z)}
def pop(p):
    a,b,c=map(mp,[p.get('prevalence',.4),p.get('risk0',.1),p.get('risk1',.25)])
    return [a*c,a*(1-c),(1-a)*b,(1-a)*(1-b)]
def selection(p):
    c=pop(p);r=[mp(p.get(k,d)) for k,d in zip(['s11','s10','s01','s00'],[.8,.3,.6,.9])]
    return {'full':summary(c),'selected':summary([a*b for a,b in zip(c,r)]),'factor':ratio(r[0]*r[3],r[1]*r[2])}
def classify(p):
    c=pop(p);s,t,u,v=[mp(p.get(k,d)) for k,d in zip(['se','sp','se0','sp0'],[.8,.9,p.get('se',.8),p.get('sp',.9)])]
    # Enumerate true exposure x outcome x recorded exposure as eight physical categories.
    recorded=[Fraction(0)]*4
    for E in [0,1]:
      for Y in [0,1]:
       mass=c[(0 if E else 2)+(0 if Y else 1)]
       se,sp=(s,t) if Y else (u,v)
       for R in [0,1]:
        probability=(se if R else 1-se) if E else (1-sp if R else sp)
        recorded[(0 if R else 2)+(0 if Y else 1)]+=mass*probability
    P=mp(p.get('prevalence',.4))
    return {'full':summary(c),'recorded':summary(recorded),'trueAmongPositive':conditional(P*s,(1-P)*(1-t)),'trueAmongNegative':conditional(P*(1-s),(1-P)*t)}
def healthy(p):
    v,eh,ev,rh,rv,h=[mp(p.get(k,d)) for k,d in zip(['vulnerable','workHealthy','workVulnerable','riskHealthy','riskVulnerable','harm'],[.35,.9,.2,.02,.3,.1])]
    cells={}
    for V in [0,1]:
      H=v if V else 1-v;e=ev if V else eh;r=rv if V else rh
      for E in [0,1]:
       probE=e if E else 1-e;risk=r+h*(1-r) if E else r
       for Y in [0,1]:cells[V,E,Y]=H*probE*(risk if Y else 1-risk)
    worker=sum(x for (V,E,Y),x in cells.items() if E);off=1-worker
    wcases=sum(x for (V,E,Y),x in cells.items() if E and Y);ocases=sum(x for (V,E,Y),x in cells.items() if not E and Y)
    wr=None if worker==0 else wcases/worker;nr=None if off==0 else ocases/off;g=wcases+ocases
    std0=(1-v)*rh+v*rv;std1=(1-v)*(rh+h*(1-rh))+v*(rv+h*(1-rv))
    return {'workerMass':metric(worker),'offMass':metric(off),'workerVulnerable':None if worker==0 else metric(sum(x for (V,E,Y),x in cells.items() if V and E)/worker),'offVulnerable':None if off==0 else metric(sum(x for (V,E,Y),x in cells.items() if V and not E)/off),'workerRisk':None if wr is None else metric(wr),'offRisk':None if nr is None else metric(nr),'general':metric(g),'standardizedOn':metric(std1),'standardizedOff':metric(std0),'crudeDifference':None if wr is None else diff(wr,g),'standardizedDifference':diff(std1,std0),'crudeRR':None if wr is None else ratio(wr,g),'nonworkerRR':None if wr is None or nr is None else ratio(wr,nr),'standardizedRR':ratio(std1,std0)}
def error(p):
    truth,b,c=[mp(p.get(k,d)) for k,d in zip(['truth','contamination','reference'],[.2,.25,.6])];n=p.get('n',100)
    qExact=(1-b)*truth+b*c;biasExact=qExact-truth
    q=real(qExact);truth=real(truth)
    # Distinct labelled binary-count enumeration, then raw moments about the target.
    probs=[m.binomial(n,k)*q**k*(1-q)**(n-k) for k in range(n+1)]
    mean=sum(P*m.mpf(k)/n for k,P in enumerate(probs));var=sum(P*(m.mpf(k)/n-mean)**2 for k,P in enumerate(probs));mse=sum(P*(m.mpf(k)/n-truth)**2 for k,P in enumerate(probs));bias=real(biasExact)
    inds=sorted(set([0,1,n//4,n//2,n-1,n]));bins=[m.mpf(0)]*100
    for k,P in enumerate(probs):bins[min(99,(100*k)//n)]+=P
    return {'q':{'yes':metric(q),'no':metric(1-q)},'bias':{'sign':int(m.sign(bias)),**metric(abs(bias))},'variance':metric(var),'biasSquared':metric(bias*bias),'MSE':metric(mse),'selectedPMF':[{'index':k,'metric':metric(probs[k])} for k in inds],'bins':list(map(metric,bins))}
def sortie(p):
    incoming=real(p.get('incoming',1.6));source=list(map(real,[p.get('wing',.05),p.get('body',.8),p.get('tail',.1)]));same=[incoming*(1-q) for q in source]
    alt=p.get('architecture','common incoming rates')!='common incoming rates';loss=[real(.05)]*3 if alt else source;rates=[x/(1-real(.05)) for x in same] if alt else [incoming]*3
    # Sum Poisson hit counts times the probability all n hits are nonfatal, independently by region.
    returned=[];conditional=[]
    for rate,q in zip(rates,loss):
      terms=[m.exp(-rate)*(rate*(1-q))**n/m.factorial(n) for n in range(301)]
      fatal=sum(m.exp(-rate)*rate**n/m.factorial(n)*(1-(1-q)**n) for n in range(301));z=1-fatal;returned.append(z);conditional.append(sum(n*t for n,t in enumerate(terms))/z)
    return {'rates':list(map(metric,rates)),'sameMeans':list(map(metric,same)),'returnProbability':metric(m.fprod(returned)),'lossProbability':metric(1-m.fprod(returned)),'conditionalMeans':list(map(metric,conditional))}
R={'method':'Exact-rational physical-category enumeration and1600-digit binomial/Poisson sums; no production imports or network. Exported binary64 log magnitudes distinguish exact zero from positive underflow. Poisson fatal and nonfatal count sums truncated after300 hits per region (rates<=6/.95); exact no-fatal states retain zero loss, far below comparison tolerance.','selection':[],'misclassification':[],'healthyWorker':[],'binomialError':[],'survivorship':[]}
risks=[(.1,.25),(.4,.05),(0,0),(1,1),(0,1),(.2,.2),(TINY,TINY),(.5,TINY)]
rates=[[.8,.3,.6,.9],[0,0,0,0],[1,1,1,1],[.2,.4,.1,.2],[1,0,0,1],[0,1,1,0],[TINY,TINY,.5,1],[TINY]*4]
for prevalence in [0,.01,.4,1]:
 for r0,r1 in risks:
  for rate in rates:
   p=dict(prevalence=prevalence,risk0=r0,risk1=r1,**dict(zip(['s11','s10','s01','s00'],rate)));R['selection'].append({'params':p,'expected':selection(p)})
classification=[[.8,.9,.8,.9],[1,1,1,1],[0,0,0,0],[.5,.5,.5,.5],[.9,.1,.9,.1],[1,0,1,0],[0,1,0,1],[.95,.9,.6,.95],[.4,.99,.95,.7],[TINY,TINY,TINY,TINY]]
for prevalence in [0,.4,1]:
 for r0,r1 in risks:
  for se,sp,se0,sp0 in classification:
   p=dict(prevalence=prevalence,risk0=r0,risk1=r1,se=se,sp=sp,se0=se0,sp0=sp0);R['misclassification'].append({'params':p,'expected':classify(p)})
for v in [0,.35,1]:
 for eh,ev in [(.9,.2),(0,0),(1,1),(.2,.9),(TINY,1),(1,TINY)]:
  for rh,rv in [(.02,.3),(0,0),(1,1),(TINY,TINY)]:
   for harm in [0,.1,1,TINY]:
    p=dict(vulnerable=v,workHealthy=eh,workVulnerable=ev,riskHealthy=rh,riskVulnerable=rv,harm=harm);R['healthyWorker'].append({'params':p,'expected':healthy(p)})
for truth,b,c in [(.2,.25,.6),(.2,0,.6),(.2,1,.6),(0,0,0),(1,1,1),(0,1,1),(1,.5,0),(TINY,TINY,TINY),(0,TINY,TINY),(.2,.5,.2)]:
 for n in [10,101]:
  p=dict(truth=truth,contamination=b,reference=c,n=n,seed=31);R['binomialError'].append({'params':p,'expected':error(p)})
p=dict(truth=.2,contamination=.25,reference=.6,n=2000,seed=31);R['binomialError'].append({'params':p,'expected':error(p)})
for incoming in [0,1.6,6,TINY]:
 for wing,body,tail in [(.05,.8,.1),(0,0,0),(1,1,1),(0,1,.5),(TINY,TINY,TINY)]:
  for architecture in ['common incoming rates','same survivor means, alternate exposure']:
   p=dict(incoming=incoming,wing=wing,body=body,tail=tail,seed=51,architecture=architecture);R['survivorship'].append({'params':p,'expected':sortie(p)})
output=Path(sys.argv[1] if len(sys.argv)>1 else Path(__file__).resolve().parent/'fixtures/wave6-epi-reference.json');output.write_text(json.dumps(R,ensure_ascii=False,indent=2,allow_nan=False)+'\n');print({k:len(v) for k,v in R.items() if isinstance(v,list)})
