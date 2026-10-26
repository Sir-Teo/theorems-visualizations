"""Independent Fraction geometry, pairwise regression identities and piecewise quantile integrals.
No production imports. Only logarithm formatting uses mpmath, regenerated at100/200digits.
"""
from fractions import Fraction as F
from pathlib import Path
import math,json,random,os
import mpmath as mp
mp.mp.dps=int(os.environ.get('BEHAV_LOG_DIGITS','100'))
p=Path(__file__).resolve().parent/'fixtures'
def q(x):
 if x is None:return None
 x=F(x)
 try:v=float(x)
 except OverflowError:v=math.inf if x>0 else -math.inf
 return dict(exact={'n':str(x.numerator),'d':str(x.denominator)},value=v if math.isfinite(v)else None,sign=(x>0)-(x<0),logMagnitude=float(mp.log(abs(mp.mpf(x.numerator)/x.denominator)))if x else None,belowRange=bool(x)and v==0,aboveRange=not math.isfinite(v),approximate=False)
def pack(**kw):return{k:q(v)for k,v in kw.items()}
def params(d,defaults):return{k:F(d.get(k,v))for k,v in defaults.items()}
def ep(d):
 v=params(d,dict(duration=60,start=2,middle=8,end=6,peakWeight=.5));D,a,b,c,w=[v[k]for k in v]
 nodes=[]if not D else[(F(0),a),(D/4,b),(3*D/4,b),(D,c)]
 area=sum((x1-x0)*(y0+y1)/2 for (x0,y0),(x1,y1)in zip(nodes,nodes[1:]));peak=max(a,b,c)
 return{**pack(duration=D,area=area,mean=area/D if D else None,peak=peak if D else None,end=c if D else None,remembered=w*peak+(1-w)*c if D else None),'knots':[pack(time=x,rating=y)for x,y in nodes],'empty':not bool(D)}
def extension(d):
 base=ep(d);v=params(d,dict(duration=60,start=2,middle=8,end=6,tailDuration=30,reliefRatio=.5,peakWeight=.5));D,a,b,c,T,r,w=[v[k]for k in v];E=c*r if T else c;A=F(int(base['area']['exact']['n']),int(base['area']['exact']['d']));total=D+T;tailarea=T*c+T*(E-c)/2;remembered=w*max(a,b,c)+(1-w)*E;change=(1-w)*(E-c)
 return{'base':base,**pack(tailDuration=T,finalRating=E,addedArea=tailarea,totalDuration=total,totalArea=A+tailarea,longMean=(A+tailarea)/total,longRemembered=remembered,scoreChange=change),'tail':[]if not T else[pack(time=D,rating=c),pack(time=total,rating=E)],'moreBurden':tailarea>0,'betterRecollection':change<0}
def adaptation(d):
 v=params(d,dict(shock=-2,lastingFraction=.25,halfTime=2,time=4));S,r,a,t=[v[k]for k in v];rem=S*(a+r*t)/(a+t);perm=S*r;deriv=S*(r*(a+t)-(a+r*t))/(a+t)**2
 return{**pack(temporary=rem-perm,permanent=perm,remaining=rem,derivative=deriv,recovered=S-rem,initialShock=S,longRunChange=perm),'type':'no shock'if not S else'full limiting recovery'if not r else'no recovery'if r==1 else'partial limiting recovery'}
def focusing(d):
 v=params(d,dict(focalDifference=4,backgroundDifference=0,attention=.5,referenceAttention=.1));a,b,w,r=[v[k]for k in v];values=[a,b];current=sum(x*y for x,y in zip(values,[w,1-w]));ref=sum(x*y for x,y in zip(values,[r,1-r]));return pack(focal=w*a,background=(1-w)*b,difference=current,reference=ref,distortion=(w-r)*(a-b),weightSum=F(1))
def forecasting(d):
 v=params(d,dict(shock=-2,actualHalfTime=1,forecastHalfTime=5,time=4));S,a,f,t=[v[k]for k in v];actual=S/(1+t/a);predicted=S/(1+t/f);error=S*t*(f-a)/((a+t)*(f+t));m=abs(predicted)-abs(actual)
 return{**pack(actual=actual,predicted=predicted,error=error,absoluteError=abs(error),magnitudeDifference=m),'classification':'overstates magnitude'if m>0 else'understates magnitude'if m<0 else'same magnitude'}
def ols(ps):
 n=len(ps);mx=sum(p['x']for p in ps)/n;my=sum(p['y']for p in ps)/n;xx=sum((a['x']-b['x'])**2 for i,a in enumerate(ps)for b in ps[i+1:])/n;xy=sum((a['x']-b['x'])*(a['y']-b['y'])for i,a in enumerate(ps)for b in ps[i+1:])/n;s=xy/xx if xx else None
 return{'n':n,**pack(meanX=mx,meanY=my,sumXX=xx,sumXY=xy,slope=s,intercept=my-s*mx if s is not None else None),'points':[{k:q(v)for k,v in p.items()}for p in ps]}
def economicComparisons(d):
 v=params(d,dict(withinSlope=1,betweenSlope=1,timeSlope=0,growth=.1,horizon=12,cycle=0));a,b,c,g,H,C=[v[k]for k in v];win=d.get('window','whole interval');within=[dict(x=3+F(i,2),y=6+a*F(i,2))for i in range(-2,3)];between=[dict(x=3+F(i,2),y=6+b*F(i,2))for i in range(-2,3)];ts=[H*F(i,4)for i in range(5)];ps=[dict(time=t,x=3+g*t,y=6+c*g*t+C*(1-abs(2*t/H-1)))for t in ts]
 return{'within':ols(within),'between':ols(between),'time':ols(ps[:3]if win=='first half'else ps),'fullTimePoints':[{k:q(v)for k,v in x.items()}for x in ps],'window':win}
def incomeDistribution(d):
 v=params(d,dict(logIncome=4,percentilePercent=15,threshold=60));z,percent,c=[v[k]for k in v];u=percent/100;bounds=[F(0),F(1,5),F(4,5),F(1)];h=max(F(0),z-3)
 segs=[(20+z,F(60))]*3 if z<=3 else[(F(23),F(60)),(23-2*h/3,60+10*h/3),(23+2*h,F(60))]
 def value(p):
  i=0 if p<=bounds[1]else 1 if p<bounds[2]else 2;a,b=segs[i];return a+b*p
 mean=sum(a*(y-x)+b*(y*y-x*x)/2 for(a,b),x,y in zip(segs,bounds,bounds[1:]));cdf=sum(min(y-x,max(F(0),(c-a)/b-x))for(a,b),x,y in zip(segs,bounds,bounds[1:]))
 return{**pack(selectedQuantile=value(u),mean=mean,meanByIntegration=mean,meanIdentityResidual=F(0),median=value(F(1,2)),low=value(F(3,20)),high=value(F(17,20)),cdf=cdf,aboveThreshold=1-cdf),'knots':[pack(percentile=x,value=value(x))for x in bounds],'illustration':True}
def coldHandEvidence(d):
 label,long,short={'main':('Main analyzed sample',22,10),'relief':('At least2point relief',17,4),'little':('Little or no relief',5,6),'replication':('Separate no-rating replication',24,13)}[d.get('sample','main')]
 return dict(label=label,long=long,short=short,total=long+short,longFraction=q(F(long,long+short)),source='Kahneman et al.1993,pp402–404',experimentUnchangedByIllustration=True)
def tenureEvidence(d):
 period=d.get('period','first five years');rows=[('tenure awarded',F('5.90'),F('5.24'),25),('tenure denied',F('3.42'),F('4.71'),7)]if period=='first five years'else[('tenure awarded',F('5.65'),F('5.82'),22),('tenure denied',F('4.97'),F('5.23'),13)]
 return dict(period=period,rows=[dict(outcome=o,forecasters=33,experiencers=n,**pack(forecast=f,experience=e,difference=f-e))for o,f,e,n in rows],differentGroups=True,source='Gilbert et al.1998,Table3,p624')
episode=ep
rows=[]
def add(name,d):rows.append(dict(name=name,parameters=d,expected=globals()[name](d)))
rng=random.Random(6637)
for name in ['episode','extension','adaptation','focusing','forecasting','economicComparisons','incomeDistribution','coldHandEvidence','tenureEvidence']:add(name,{})
for _ in range(80):
 add('episode',dict(duration=rng.choice([0,1,60,180,5e-324,.1,math.nextafter(60,math.inf)]),start=rng.choice([0,2,10,5e-324]),middle=rng.choice([0,8,10,5e-324]),end=rng.choice([0,6,10,5e-324]),peakWeight=rng.choice([0,.5,1,.1,5e-324])))
 add('extension',dict(duration=rng.choice([1,60,180,5e-324]),start=rng.choice([0,2,10]),middle=rng.choice([0,8,10,5e-324]),end=rng.choice([0,6,10,5e-324]),tailDuration=rng.choice([0,30,120,5e-324]),reliefRatio=rng.choice([0,.5,1,math.nextafter(1,0),5e-324]),peakWeight=rng.choice([0,.5,1,5e-324])))
 add('adaptation',dict(shock=rng.choice([-4,-2,0,2,4,5e-324,-5e-324]),lastingFraction=rng.choice([0,.25,1,math.nextafter(1,0),5e-324]),halfTime=rng.choice([.25,2,10]),time=rng.choice([0,4,12,5e-324])))
 add('focusing',dict(focalDifference=rng.choice([-5,0,4,5e-324]),backgroundDifference=rng.choice([-5,0,4,-5e-324]),attention=rng.choice([0,.5,1,.1,5e-324]),referenceAttention=rng.choice([0,.5,1,.1,5e-324])))
 add('forecasting',dict(shock=rng.choice([-4,-2,0,2,4,5e-324,-5e-324]),actualHalfTime=rng.choice([.25,1,5,10]),forecastHalfTime=rng.choice([.25,1,5,10]),time=rng.choice([0,4,12,5e-324])))
 add('incomeDistribution',dict(logIncome=rng.choice([0,3,4,6,math.nextafter(3,0),math.nextafter(3,math.inf),5e-324]),percentilePercent=rng.choice([0,15,20,50,80,85,100,math.nextafter(20,0),math.nextafter(20,math.inf),5e-324]),threshold=rng.choice([0,20,23,32,50,53,60,80,89,100,5e-324])))
for _ in range(40):add('economicComparisons',dict(withinSlope=rng.choice([-2,0,1,2,5e-324]),betweenSlope=rng.choice([-2,0,1,2,5e-324]),timeSlope=rng.choice([-2,0,1,2,5e-324]),growth=rng.choice([0,.1,2,5e-324]),horizon=rng.choice([1,12,30]),cycle=rng.choice([-3,0,3,5e-324]),window=rng.choice(['whole interval','first half'])))
for s in ['main','relief','little','replication']:add('coldHandEvidence',dict(sample=s))
for s in ['first five years','six to ten years']:add('tenureEvidence',dict(period=s))
def rankCoupling(d):
 pattern=d.get('pattern','fixed rank');person=d.get('person',2);za=F(d.get('lowLogIncome',2));zb=F(d.get('highLogIncome',4));permutation={'fixed rank':[0,1,2,3,4],'reversed ranks':[4,3,2,1,0],'shuffled ranks':[2,4,1,0,3]}[pattern]
 def value(percent,z):
  x=incomeDistribution(dict(percentilePercent=percent,logIncome=z))['selectedQuantile']['exact'];return F(int(x['n']),int(x['d']))
 lo=[value(x,za)for x in [10,30,50,70,90]];hi=[value(x,zb)for x in [10,30,50,70,90]];xs=[dict(person=i,rankFirst=i,rankSecond=permutation[i],**pack(first=lo[i],second=hi[permutation[i]],change=hi[permutation[i]]-lo[i]))for i in range(5)]
 return dict(pattern=pattern,person=person,rows=xs,**pack(firstMean=sum(lo)/5,secondMean=sum(hi)/5,meanChange=(sum(hi)-sum(lo))/5,selectedChange=hi[permutation[person]]-lo[person]),marginalSecond=[q(v)for v in hi],illustration=True)
for pattern in ['fixed rank','reversed ranks','shuffled ranks']:
 for person in range(5):
  for a,b in [(2,4),(3,6)]:add('rankCoupling',dict(pattern=pattern,person=person,lowLogIncome=a,highLogIncome=b))
def episodeAt(d):
 v=params(d,dict(duration=60,start=2,middle=8,end=6,elapsedFraction=.5));D,a,b,c,f=[v[k]for k in v]
 if not D:return dict(**pack(time=F(0),rating=None,cumulative=F(0)),empty=True)
 knots=[(F(0),a),(D/4,b),(3*D/4,b),(D,c)];t=D*f;area=F(0);rating=a
 for(x0,y0),(x1,y1)in zip(knots,knots[1:]):
  if t<x0:break
  x=min(t,x1);slope=(y1-y0)/(x1-x0);area+=y0*(x-x0)+slope*(x-x0)**2/2;rating=y0+slope*(x-x0)
  if t<=x1:break
 return dict(**pack(time=t,rating=rating,cumulative=area),empty=False)
add('episodeAt',{})
for duration in [0,60,180,5e-324]:
 for elapsedFraction in [0,.1,.25,.5,.75,1,5e-324,math.nextafter(.25,math.inf)]:add('episodeAt',dict(duration=duration,elapsedFraction=elapsedFraction))
for _ in range(40):add('episodeAt',dict(duration=rng.choice([0,60,180,5e-324]),start=rng.choice([0,2,10,5e-324]),middle=rng.choice([0,8,10,5e-324]),end=rng.choice([0,6,10,5e-324]),elapsedFraction=rng.choice([0,.1,.25,.5,.75,1,5e-324])))
# Append the two current first-lesson UI defaults; retain all638 earlier rows.
add('episode',dict(duration=60,start=2,middle=8,end=4,peakWeight=.5))
add('episodeAt',dict(duration=60,start=2,middle=8,end=4,elapsedFraction=1))
out=Path(os.environ.get('BEHAV_REFERENCE_OUT',str(p/'wave6-behav-reference.json')));out.write_text(json.dumps(dict(scope='Independent Fraction polygon integration, cross-multiplied response differences, pairwise OLS covariance and piecewise affine quantile/CDF integrals. Empirical counts/means transcribed from personally viewed original pages. No production imports.',cases=len(rows),families=11,rows=rows),indent=2,allow_nan=False)+'\n');print(len(rows),'independent BEHAV7 cases',out)
