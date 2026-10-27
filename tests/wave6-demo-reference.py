"""Independent high-precision/Fraction reference; no production JavaScript imports."""
from pathlib import Path
from fractions import Fraction as F
from functools import lru_cache
import json,math,sys,time,hashlib
import mpmath as mp
P=Path(__file__).resolve().parent
mp.mp.dps=int(sys.argv[1])if len(sys.argv)>1 else 90
NODES=int(sys.argv[2])if len(sys.argv)>2 else 64
_nodes,_weights=mp.gauss_quadrature(NODES,'legendre')
QUADRATURE=list(zip(_nodes,_weights))
facts=json.loads((P/'fixtures/wave6-demo-source-facts.json').read_text());rows=facts['schedules'];ages=facts['lifeAges'];source={(x['country'],x['year']):x for x in rows}
defaults={'country':'JPN','year':2023,'fertility':100,'hazard':100,'child':100,'late':100,'extra':0}
def fl(x):
 if isinstance(x,dict):return{k:fl(v)for k,v in x.items()}
 if isinstance(x,(list,tuple)):return[fl(v)for v in x]
 if isinstance(x,mp.mpf):return float(x)
 return x
# Integrals below use arbitrary-precision numerical quadrature. The JavaScript
# implementation uses closed segment moments and bisection; roots here use secants.
class Law:
 def __init__(self,args,fertility_source=None):
  self.args={**defaults,**args};p=self.args;self.data=source[p['country'],p['year']];fdata=fertility_source or self.data
  self.parts=[];alive=mp.mpf(1);L=self.data['survivorsFemale'];daughter=100/(100+mp.mpf(fdata['boysPer100Girls']))
  for i,(a,b)in enumerate(zip(ages,ages[1:])):
   hazard=-mp.log(mp.mpf(L[i+1])/mp.mpf(L[i]))/(b-a)*p['hazard']/100*(mp.mpf(p['child'])/100 if a<5 else mp.mpf(p['late'])/100 if a>=60 else 1)+mp.mpf(p['extra'])/1000
   maternal=mp.mpf(fdata['fertilityPer1000WomanYears'][(a-10)//5])/1000*daughter*p['fertility']/100 if 10<=a<55 else mp.mpf(0)
   self.parts.append((a,b,alive,hazard,maternal));alive*=mp.exp(-hazard*(b-a))
  self.quadrature=[];self.partQuadrature=[]
  for A,B,S,mu,m in self.parts:
   points=[(A+(x+1)*(B-A)/2,w*(B-A)/2*S*mp.exp(-mu*(x+1)*(B-A)/2),mu,m)for x,w in QUADRATURE];self.partQuadrature.append(points);self.quadrature.extend(points)
  self.tailS=alive;self.tailMu=mp.mpf(L[-1])/mp.mpf(self.data['personYearsFemale'][-1])*p['hazard']/100*p['late']/100+mp.mpf(p['extra'])/1000
 @lru_cache(None)
 def area(self,r=0,moment=0,kernel=False):
  r=mp.mpf(r)
  if not kernel and r+self.tailMu<=0:return None
  value=mp.fsum(weight*(m if kernel else 1)*a**moment*(mp.exp(-r*a)if r else 1)for a,weight,mu,m in self.quadrature if not kernel or m)
  if not kernel:
   k=r+self.tailMu
   value+=self.tailS*mp.exp(-100*r)*mp.fsum(mp.binomial(moment,j)*100**(moment-j)*mp.factorial(j)/k**(j+1)for j in range(moment+1))
  return value
 def survive(self,a):
  for A,B,S,mu,_ in self.parts:
   if a<B:return S*mp.exp(-mu*(a-A))
  return self.tailS*mp.exp(-self.tailMu*(a-100))
 def maternity(self,a):return next((m for A,B,S,mu,m in self.parts if A<=a<B),mp.mpf(0))
 @lru_cache(None)
 def root(self):
  if not any(s[4]for s in self.parts):return None
  R=self.area(0,0,True);T=self.area(0,1,True)/R;guess=mp.log(R)/T
  return mp.findroot(lambda r:self.area(r,0,True)-1,(guess-mp.mpf('.002'),guess+mp.mpf('.002')),tol=mp.mpf(10)**(-mp.mp.dps+15),maxsteps=80)
 @lru_cache(None)
 def describe(self,r):
  R=self.area(0,0,True);T=self.area(0,1,True)/R if R else None;variance=self.area(0,2,True)/R-T*T if R else None
  area=None if r is None else self.area(r);normalizable=area is not None;b=1/area if normalizable else None;death=None
  if normalizable:
   death=mp.fsum(mu*weight*mp.exp(-r*a)for a,weight,mu,m in self.quadrature)
   death+=self.tailMu*self.tailS*mp.exp(-100*r)/(r+self.tailMu);death*=b
  return {'NRR':R,'T':T,'variance':variance,'r':r,'normalizable':normalizable,'b':b,'d':death,'meanAge':self.area(r,1)/area if normalizable else None,'tailShare':self.tailS*mp.exp(-100*r)/(r+self.tailMu)/area if normalizable else None,'profile':[[a,mp.exp(-r*a)*self.survive(a)/area]for a in range(101)]if normalizable else None,'rootExists':r is not None,'model':'continuous piecewise-hazard law with explicit exponential100+tail'}
@lru_cache(None)
def getlaw(key):return Law(dict(key))
def law(p):return getlaw(tuple(sorted({**defaults,**p}.items())))
@lru_cache(None)
def stable_cached(key):
 p=dict(key);l=law(p);z=l.describe(l.root());d=l.data
 return {'args':l.args,'countryName':d['countryName'],**z,'survival':[[a,l.survive(a)]for a in range(101)],'maternity':[[mp.mpf(i)/4,l.maternity(mp.mpf(i)/4)]for i in range(221)],'netMaternity':[[mp.mpf(i)/4,l.survive(mp.mpf(i)/4)*l.maternity(mp.mpf(i)/4)]for i in range(221)],'sourceNRR':mp.mpf(d['publishedNRR']),'sourceTFR':mp.mpf(d['publishedTFR']),'sourceKnots':[[a,mp.mpf(d['survivorsFemale'][i])/mp.mpf(d['survivorsFemale'][0])]for i,a in enumerate(ages)],'tailHazard':l.tailMu}
def stable(p):return stable_cached(tuple(sorted({**defaults,**p}.items())))
def lotka(p):
 p=p.copy();trial=p.pop('trial',0);rate=mp.mpf(trial)/1000;l=law(p);z=stable(p);r=z['r'];lo,lo_exact=min([(mp.mpf('-.06'),F(-3,50)),((r or 0)-mp.mpf('.025'),None),(rate,F(trial,1000))],key=lambda x:x[0]);hi,hi_exact=max([(mp.mpf('.06'),F(3,50)),((r or 0)+mp.mpf('.025'),None),(rate,F(trial,1000))],key=lambda x:x[0])
 curve=[]
 for i in range(161):
  if lo_exact is not None and hi_exact is not None:
   coordinate=lo_exact+(hi_exact-lo_exact)*F(i,160);rho=mp.mpf(coordinate.numerator)/coordinate.denominator
  else:rho=lo+(hi-lo)*i/160
  v=l.area(rho,0,True);curve.append({'r':rho,'F':v,'logF':mp.log(v)if v else None})
 contributions=[]
 for index,(a,b,S,mu,m)in enumerate(l.parts):
  if m:
   integ=lambda rho:mp.fsum(m*weight*mp.exp(-rho*x)for x,weight,_,_ in l.partQuadrature[index])
   contributions.append({'age':a,'years':b-a,'trial':integ(rate),'atRoot':None if r is None else integ(r)})
 return {**z,'trial':trial,'trialRate':rate,'trialIntegral':l.area(rate,0,True),'rootIntegral':None if r is None else l.area(r,0,True),'curve':curve,'contributions':contributions}
def approximation(p):
 country=p.get('country','JPN');year=p.get('year',2023);fertility=p.get('fertility',100);points=[]
 for d in rows:
  z=stable({'country':d['country'],'year':d['year'],'fertility':fertility});first=mp.log(z['NRR'])/z['T']if z['NRR']else None
  points.append({'country':d['country'],'name':d['countryName'],'year':d['year'],**{k:z[k]for k in ['NRR','T','variance','r']},'first':first,'second':None if first is None else first+z['variance']*first*first/(2*z['T']),'error':None if first is None else z['r']-first})
 return {'country':country,'year':year,'fertility':fertility,'points':points,'selected':next(x for x in points if(x['country'],x['year'])==(country,year)),'selectedSchedule':stable({'country':country,'year':year,'fertility':fertility})}
def tilt(p):
 p=p.copy();growth=p.pop('growth',0);age=p.pop('age',30);l=law({**p,'fertility':100});r=mp.mpf(growth)/1000;z=l.describe(r);S=l.survive(age);weight=mp.exp(-r*age);F0=l.area(r,0,True)
 return {'args':l.args,'growth':growth,'age':age,**z,'originalNRR':z['NRR'],'NRR':z['NRR']/F0,'maternityRescale':1/F0,'survival':[[a,l.survive(a)]for a in range(101)],'tilt':[[a,mp.exp(-r*a)]for a in range(101)],'selected':{'age':age,'survival':S,'weight':weight,'b':z['b'],'density':None if z['b']is None else z['b']*S*weight}}
def stationary(p):
 l=law(p);z=l.describe(mp.mpf(0));K=l.area(0,0,True);e0=l.area(0);tail=l.tailS/l.tailMu
 return {'args':l.args,**z,'stationaryByConstruction':True,'originalNRR':z['NRR'],'NRR':1,'maternityRescale':1/K,'e0':e0,'secondLifeMoment':2*l.area(0,1),'meanAgeAtDeath':e0,'survival':[[a,l.survive(a)]for a in range(101)],'survivalAreaThrough100':e0-tail,'tailLifeYears':tail}
def coale(p):
 country=p.get('country','JPN');year=p.get('year',2023);fert=p.get('fertility',100);child=p.get('child',100);late=p.get('late',100);extra=p.get('extra',10);base={'country':country,'year':year};baseline=stable(base);delta=mp.mpf(extra)/1000;l=law({**base,'extra':extra})
 return {'country':country,'year':year,'fertility':fert,'child':child,'late':late,'extra':extra,'baseline':baseline,'changed':stable({**base,'fertility':fert,'child':child,'late':late}),'fertilityOnly':stable({**base,'fertility':fert}),'earlyOnly':stable({**base,'child':child}),'lateOnly':stable({**base,'late':late}),'uniform':{**l.describe(baseline['r']-delta),'delta':delta,'analyticSameProfile':True},'uniformHazard':[[a,l.survive(a)]for a in range(101)]}
def gl(fn,a,b):return mp.fsum(w*fn((a+b)/2+(b-a)*x/2)for x,w in QUADRATURE)*(b-a)/2
@lru_cache(None)
def discrete_law(key):
 l=law(dict(key));K=[]
 for a in range(55):
  part=next(s for s in l.parts if s[0]<=a<s[1]);A,B,S,mu,m=part
  K.append(gl(lambda x:m*l.survive(x),a,a+1)if m else mp.mpf(0))
 survives=[l.survive(a)for a in range(101)];s=[survives[i+1]/survives[i]for i in range(100)]+[mp.exp(-l.tailMu)];f=[K[i]/survives[i]for i in range(55)]
 if any(K):
  R=mp.fsum(K);T=mp.fsum((i+1)*x for i,x in enumerate(K))/R;guess=mp.log(R)/T;r=mp.findroot(lambda r:mp.fsum(x*mp.exp(-r*(i+1))for i,x in enumerate(K))-1,(guess-mp.mpf('.002'),guess+mp.mpf('.002')),tol=mp.mpf(10)**(-mp.mp.dps+15));lam=mp.exp(r)
  if lam>s[100]:v=[survives[a]*mp.exp(-r*a)for a in range(100)]+[survives[100]*mp.exp(-100*r)/(1-s[100]/lam)];total=mp.fsum(v);v=[x/total for x in v]
  else:v=None
  target={'r':r,'lambda':lam,'vector':v}
 else:target={'r':None,'lambda':None,'vector':None}
 return l,K,s,f,target
def projection(p):
 p=p.copy();steps=p.pop('steps',100);initial=p.pop('initial','young');l,K,s,f,target=discrete_law(tuple(sorted({**defaults,**p}.items())))
 n=[mp.mpf(0)if initial=='empty'else mp.mpf(a>=65)if initial=='older-only'else mp.mpf(1)if initial=='uniform'else mp.exp(-mp.mpf('.5')*((mp.mpf(a)-(15 if initial=='young'else 55))/15)**2)for a in range(101)];total=mp.fsum(n)
 if total:n=[100*x/total for x in n]
 history=[];selected=None;previous=None
 for t in range(301):
  total=mp.fsum(n);shares=[x/total for x in n]if total else None;distance=mp.fsum(abs(x-y)for x,y in zip(shares,target['vector']))/2 if shares and target['vector']else None;growth=mp.log(total/previous)if previous and total else None
  if t%5==0 or t==steps:history.append({'step':t,'total':total,'growth':growth,'distance':distance})
  if t==steps:selected={'total':total,'shares':shares,'vector':list(n),'distance':distance,'growth':growth}
  if t==300:break
  previous=total;n=[mp.fsum(a*b for a,b in zip(f,n)),*[s[i]*n[i]for i in range(99)],s[99]*n[99]+s[100]*n[100]]
 group=lambda v:None if v is None else[mp.fsum(v[5*i:5*i+5])if i<20 else v[100]for i in range(21)]
 return {'args':l.args,'steps':steps,'initial':initial,'discrete':target,'continuousRoot':l.root(),'history':history,'selected':selected,'selectedGroups':group(selected['shares']),'targetGroups':group(target['vector']),'netMaternityBins':K,'survivalSteps':s,'futureReproductionPossible':initial not in ['empty','older-only']and any(K)}
def renewal(p):
 shape=p.get('shape',6);mean=p.get('mean',30);reproduction=p.get('reproduction',150);timepoint=p.get('time',100);R=mp.mpf(reproduction)/100;theta=mp.mpf(mean)/shape;c=mp.root(R,shape);r=(c-1)/theta
 unit_roots=[mp.exp(2j*mp.pi*j/shape)for j in range(shape)]
 roots=[{'real':(c*mp.cos(2*mp.pi*j/shape)-1)/theta,'imag':mp.mpf(0)if j==0 or 2*j==shape else c*mp.sin(2*mp.pi*j/shape)/theta,'dominant':j==0}for j in range(shape)];history=[]
 # Root-of-unity filtering is independent of the production Poisson recurrence.
 for t in range(301):
  z=c*t/theta;corrected=mp.re(mp.fsum(mp.exp((unit_roots[j]-1)*z)for j in range(shape))/shape);forcing=mp.exp(-z)
  history.append({'time':t,'corrected':corrected,'forcing':forcing,'renewed':corrected-forcing,'births':mp.exp(r*t)*corrected})
 return {'shape':shape,'mean':mean,'reproduction':reproduction,'time':timepoint,'R':R,'theta':theta,'r':r,'roots':roots,'history':history,'selected':history[timepoint],'correctedLimit':mp.mpf(1)/shape}
def variable(p):
 growth=p.get('growth',10);amp=p.get('amplitude',60);period=p.get('period',40);timepoint=p.get('time',20);census=p.get('census',10);r0=mp.mpf(growth)/1000;A=mp.mpf(amp)/100;omega=2*mp.pi/period;mu=mp.mpf(1)/40;k=mu+r0
 logB=lambda t:r0*t+A*mp.sin(omega*t)
 instant=lambda a:r0+A*omega*mp.cos(omega*(timepoint-a))
 finite=lambda a:r0+A*(mp.sin(omega*(timepoint+census-a))-mp.sin(omega*(timepoint-a)))/census
 cumulative=lru_cache(None)(lambda a:gl(instant,0,a))
 # Integrate the finite-census rate numerically, independent of the cosine formula.
 finite_cumulative=lru_cache(None)(lambda a:gl(finite,0,a))
 density=lambda a:mp.exp(logB(timepoint-a)-logB(timepoint)-mu*a)
 # A direct time-integral of birth-log differences gives the same finite-rate antiderivative.
 finite_sum=lambda a:r0*a+A/(omega*census)*(mp.cos(omega*(timepoint+census-a))-mp.cos(omega*(timepoint+census))-mp.cos(omega*(timepoint-a))+mp.cos(omega*timepoint))
 fdensity=lambda a:mp.exp(-finite_sum(a)-mu*a)
 decay=mp.exp(-k*period);area=gl(density,0,period)/(1-decay);farea=gl(fdensity,0,period)/(1-decay);b=1/area
 profile=[{'age':a,'survival':mp.exp(-mu*a),'instant':instant(a),'finite':finite(a),'accumulatedInstant':cumulative(a),'accumulatedFinite':finite_cumulative(a),'actual':density(a)/area,'reconstructed':mp.exp(-cumulative(a)-mu*a)/area,'censusRaw':fdensity(a)/area,'censusReconstructed':fdensity(a)/farea}for a in range(121)]
 # Find absolute-difference sign changes by a fine partition and bisection, rather
 # than using the production analytic trigonometric intersection calculation.
 difference=lambda a:density(a)/area-fdensity(a)/farea;cuts=[mp.mpf(0),mp.mpf(period)]
 if amp:
  for i in range(128):
   left=mp.mpf(period)*i/128;right=mp.mpf(period)*(i+1)/128
   if difference(left)*difference(right)<0:
    for _ in range(125):
     mid=(left+right)/2
     if difference(left)*difference(mid)<=0:right=mid
     else:left=mid
    cuts.append((left+right)/2)
 cuts=sorted(cuts);error=mp.fsum(gl(lambda a:abs(difference(a)),a,b)for a,b in zip(cuts,cuts[1:]))/(2*(1-decay))if amp else mp.mpf(0)
 return {'growth':growth,'amplitude':amp,'period':period,'time':timepoint,'census':census,'r0':r0,'A':A,'omega':omega,'mu':mu,'b':b,'finiteB':1/farea,'finiteUnnormalizedMass':farea/area,'profile':profile,'births':[[mp.mpf(i)/2-120,mp.exp(logB(timepoint+mp.mpf(i)/2-120)-logB(timepoint))]for i in range(241)],'tailShareBeyond120':gl(density,120,120+period)/(1-decay)/area,'finiteReconstructionTV':error,'exactInstantaneousIdentity':True}
def quantity(x):return {'exact':{'n':str(x.numerator),'d':str(x.denominator)},'value':float(x)}
def matvec(A,x):return[sum(a*b for a,b in zip(row,x))for row in A]
def path_power(A,n):
 @lru_cache(None)
 def walk(i,j,k):return F(i==j)if k==0 else sum(A[i][v]*walk(v,j,k-1)for v in range(4))
 return[[walk(i,j,n)for j in range(4)]for i in range(4)]
LOW=[[F(x,100)for x in row]for row in [[0,0,60,80],[95,0,0,0],[0,90,0,0],[0,0,70,0]]];HIGH=[[F(x,100)for x in row]for row in [[0,0,120,150],[98,0,0,0],[0,95,0,0],[0,0,85,0]]]
LOWBLOCK=path_power(LOW,10);HIGHBLOCK=path_power(HIGH,10);BLOCKMIN=min(x for row in LOWBLOCK for x in row);BLOCKMAX=max(x for row in HIGHBLOCK for x in row);EPSILON=BLOCKMIN/BLOCKMAX
assert BLOCKMIN>0
@lru_cache(None)
def changing_history(sequence,initial):
 x=list(map(F,[26,25,25,24]if initial=='near'else[40,30,20,10]));y=list(map(F,[40,30,20,10]if initial=='same'else[24,25,25,26]if initial=='near'else[10,20,30,40]));history=[];vectors=[];first=None;lower=None
 for t in range(81):
  px=[a/sum(x)for a in x];py=[a/sum(y)for a in y];ratios=[a/b for a,b in zip(x,y)];lo=min(ratios);spread=max(ratios)-lo;distance=sum(abs(a-b)for a,b in zip(px,py))/2
  if t==10:first=spread;lower=lo
  block=t//10;relative=spread/first if block>=1 and first else F(0)if block>=1 else None;bound=(1-EPSILON)**(block-1)if block>=1 else None
  history.append({'step':t,'distance':quantity(distance),'ratioSpread':quantity(spread),'relativeSpread':None if relative is None else quantity(relative),'blockBound':None if bound is None else quantity(bound)});vectors.append(([quantity(a)for a in px],[quantity(a)for a in py]))
  use_high=t//2%2==1 if sequence=='periodic'else t.bit_count()%2==1;A=HIGH if use_high else LOW;x=matvec(A,x);y=matvec(A,y)
 return history,vectors,lower
def changing(p):
 steps=p.get('steps',40);sequence=p.get('sequence','periodic');initial=p.get('initial','opposed');history,vectors,lower=changing_history(sequence,initial)
 return {'steps':steps,'sequence':sequence,'initial':initial,'history':history,'selected':{**history[steps],'first':vectors[steps][0],'second':vectors[steps][1]},'blockLength':10,'blockMin':quantity(BLOCKMIN),'blockMax':quantity(BLOCKMAX),'epsilon':quantity(EPSILON),'firstPositiveLowerRatio':quantity(lower),'terminalAge':40,'yearsPerStep':10,'ageLabels':['0–9','10–19','20–29','30–39'],'lowerMatrix':[[quantity(x)for x in row]for row in LOW],'upperMatrix':[[quantity(x)for x in row]for row in HIGH]}
def linear_intrinsic(f,s):
 K=[x*mp.fprod(s[:i])for i,x in enumerate(f)]
 if not any(K):return None
 R=mp.fsum(K);T=mp.fsum((i+1)*x for i,x in enumerate(K))/R;guess=mp.log(R)/T
 return mp.findroot(lambda r:mp.fsum(x*mp.exp(-r*(i+1))for i,x in enumerate(K))-1,(guess-mp.mpf('.002'),guess+mp.mpf('.002')),tol=mp.mpf(10)**(-mp.mp.dps+15))/10
def twoSex(p):
 steps=p.get('steps',20);females=p.get('females',50);daughterShare=p.get('daughterShare',50);utilization=p.get('utilization',50);maleFertility=p.get('maleFertility',100);q=mp.mpf(daughterShare)/100;eta=mp.mpf(utilization)/100
 sf=list(map(mp.mpf,['.95','.9','.7']));sm=list(map(mp.mpf,['.9','.85','.65']));ff=list(map(mp.mpf,['0','0','1.2','.8']));fm=[mp.mpf(x)*maleFertility/100 for x in ['0','0','.8','1.2']];shape=list(map(mp.mpf,['.4','.3','.2','.1']));tracks={}
 for mode in ['female-only','male-only','two-sex']:
  female=[x*females for x in shape];male=[x*(100-females)for x in shape];previous=None;history=[]
  for t in range(41):
   total=mp.fsum(female)+mp.fsum(male);fc=mp.fsum(x*f for x,f in zip(female,ff));mc=mp.fsum(x*f for x,f in zip(male,fm));births=eta*fc if mode=='female-only'else eta*mc if mode=='male-only'else 2*eta*fc*mc/(fc+mc)if fc and mc else mp.mpf(0)
   history.append({'step':t,'total':total,'femaleShare':mp.fsum(female)/total if total else None,'femaleCapacity':fc,'maleCapacity':mc,'births':births,'annualGrowth':mp.log(total/previous)/10 if total and previous else None,'female':list(female),'male':list(male)})
   previous=total;female=[q*births,*[s*x for s,x in zip(sf,female)]];male=[(1-q)*births,*[s*x for s,x in zip(sm,male)]]
  tracks[mode]={'history':history,'selected':history[steps]}
 return {'steps':steps,'females':females,'daughterShare':daughterShare,'utilization':utilization,'maleFertility':maleFertility,'tracks':tracks,'femaleIntrinsic':linear_intrinsic([q*eta*x for x in ff],sf),'maleIntrinsic':linear_intrinsic([(1-q)*eta*x for x in fm],sm),'yearsPerStep':10,'ageLabels':['0–9','10–19','20–29','30–39'],'terminalAge':40,'closure':'B=2 eta F G/(F+G); eta<=1/2; chosen capacity closure, not literal pair counts'}
def historical(p):
 country=p.get('country','JPN');year=p.get('year',2023);age=p.get('age',30);growth=p.get('growth',14);l=law({'country':country,'year':year});r=mp.mpf(growth)/1000;S=l.survive(age);ratio=mp.exp(-r*age);raw=json.loads((P/'fixtures/wave6-demo-historical-table.json').read_text());table={k:raw[k]for k in ['ageLabels','calculated','observed']}
 return {'country':country,'year':year,'age':age,'growth':growth,'r':r,'survival':S,'birthCohortRelativeToCurrent':ratio,'relativeAgeDensity':S*ratio,'table':table,'reportedCalculatedSum':sum(table['calculated']),'reportedObservedSum':sum(table['observed']),'historicalYears':'England and Wales1871–1880','sourceReprintPage':100}
def periodSwap(p):
 country=p.get('country','SWE');first=p.get('first',1950);second=p.get('second',2023);out=[]
 for mortality,fertility in [(first,first),(first,second),(second,first),(second,second)]:
  l=Law({'country':country,'year':mortality},source[country,fertility]);out.append({'mortalityYear':mortality,'fertilityYear':fertility,**l.describe(l.root()),'e0':l.area(0)})
 return {'country':country,'name':source[country,first]['countryName'],'first':first,'second':second,'rows':out,'historicalContext':{'country':'Sweden','oldLifeExpectancy':mp.mpf('45.4'),'newLifeExpectancy':mp.mpf('71.6'),'oldYears':'1860','newYears':'1946–1950','scope':'Reported in Coale1957reprint; no historical curves digitized. Widget profiles use distinct UNWPP2024period inputs.'}}
FAMILIES=['stable','lotka','approximation','tilt','stationary','coale','projection','renewal','variable','changing','twoSex','historical','periodSwap']
if __name__=='__main__':
 if len(sys.argv)<4:raise SystemExit('Use: python3 tests/wave6-demo-reference.py PRECISION NODES OUTPUT [all|family|smoke]')
 from collections import Counter
 cases=json.loads((P/'fixtures/wave6-demo-cases.json').read_text());selection=sys.argv[4]if len(sys.argv)>4 else'all'
 if selection=='smoke':cases=[{'family':name,'args':{}}for name in FAMILIES]
 elif selection!='all':cases=[row for row in cases if row['family']==selection]
 output=Path(sys.argv[3])if len(sys.argv)>3 else P/'fixtures/wave6-demo-reference-regenerated.json';partial=output.with_suffix('.ndjson');result=[];start=time.time();counts=Counter(row['family']for row in cases)
 print(json.dumps({'precision':mp.mp.dps,'quadratureNodes':NODES,'cases':len(cases),'families':dict(counts),'sourceFactsSHA256':hashlib.sha256((P/'fixtures/wave6-demo-source-facts.json').read_bytes()).hexdigest(),'method':'Independent literal input parsing; high-precision Gaussian quadrature/secant roots, root-of-unity renewal solution, numerical instantaneous-growth antiderivatives and sign-change integration, exact Fraction graph walks and population products.'}),flush=True)
 with partial.open('w')as stream:
  for i,row in enumerate(cases):
   expected=fl(globals()[row['family']](row['args']));record={**row,'expected':expected};line=json.dumps(record,ensure_ascii=False,separators=(',',':'),allow_nan=False);stream.write(line+'\n');stream.flush();result.append(record)
   if i%10==0 or selection=='smoke':print('case',i+1,'of',len(cases),row['family'],round(time.time()-start,3),'seconds',flush=True)
 fixture={'schemaVersion':1,'families':dict(counts),'cases':result};output.write_text(json.dumps(fixture,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n');print(json.dumps({'status':'PASS','cases':len(cases),'seconds':time.time()-start,'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest()}),flush=True)
