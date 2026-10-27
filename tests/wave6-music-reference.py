"""Independent bounded MUSIC10 reference: no production JS imports.
Fraction/integer combinatorics, NumPy polynomial correlation, mpmath Fourier sums.
"""
from pathlib import Path
from fractions import Fraction as F
import argparse,json,math,time
import mpmath as mp
import numpy as np
parser=argparse.ArgumentParser();parser.add_argument('--digits',type=int,default=90);parser.add_argument('--out',required=True);args=parser.parse_args();mp.mp.dps=args.digits
p=Path(__file__).resolve().parent/'fixtures';corpus=json.loads((p/'wave6-music-cases.json').read_text());start=time.monotonic()
def scalar(x):
 if isinstance(x,(F,mp.mpf)):return float(x)
 if isinstance(x,np.integer):return int(x)
 if isinstance(x,list):return[scalar(v)for v in x]
 if isinstance(x,dict):return{k:scalar(v)for k,v in x.items()}
 return x
def onset_set(mask):return{i for i,ch in enumerate(mask)if ch=='1'}
def word(n,onsets):return['1'if i in onsets else'0'for i in range(n)]
def rotate(mask,r):
 n=len(mask);return ''.join(word(n,{(i+r)%n for i in onset_set(mask)}))
def canonical(mask):return min(rotate(mask,r)for r in range(len(mask)))
def cyclic(mask):
 n=len(mask);points=sorted(onset_set(mask));extended=points+[i+n for i in points]
 gaps=[extended[i+1]-extended[i]for i in range(len(points))]if points else[]
 period=next(d for d in range(1,n+1)if n%d==0 and all(mask[i]==mask[i%d]for i in range(n)))
 axes=[r for r in range(n)if{(r-i)%n for i in points}==set(points)]
 return dict(onsets=points,gaps=gaps,period=period,distinctRotations=period,stabilizer=n//period,canonical=canonical(mask),reflectionAxes=axes)
def evenness(mask):
 n=len(mask);points=sorted(onset_set(mask));k=len(points);extended=points+[i+n for i in points];spans=[]
 for q in range(1,k):
  values=[extended[i+q]-extended[i]for i in range(k)];spans.append(dict(q=q,min=min(values),max=max(values),values=values))
 return dict(maximallyEven=all(z['max']-z['min']<=1 for z in spans),spans=spans)
def grouping(n,k):
 # Recursively distribute strings. Independent representation of the specified grouping trace.
 def weave(a,b):
  frame=dict(left=[[int(x)for x in v]for v in a],right=[[int(x)for x in v]for v in b])
  if not a or len(b)<2:return[frame],''.join(a+b)
  m=min(len(a),len(b));c=[a[i]+b[i]for i in range(m)];d=a[m:]if len(a)>len(b)else b[m:]
  future,result=weave(c,d);return[frame]+future,result
 return weave(['1']*k,['0']*(n-k))
def pulse(a):
 bpm=a['bpm'];taps=a['taps'];period=F(60000,bpm);intervals=[y-x for x,y in zip(taps,taps[1:])];mean=F(sum(intervals),len(intervals))if intervals else None;values=sorted(intervals);median=F(values[len(values)//2]+values[(len(values)-1)//2],2)if values else None
 variance=sum((F(v)-mean)**2 for v in intervals)/len(intervals)if intervals else None;sd=mp.sqrt(mp.mpf(variance.numerator)/variance.denominator)if variance is not None else None
 return dict(args=a,period=period,intervals=intervals,mean=mean,median=median,sd=sd,cv=sd/(mp.mpf(mean.numerator)/mean.denominator)if mean is not None else None,estimatedBpm=F(60000)/median if median is not None else None,intervalTempos=[F(60000,v)for v in intervals],phaseErrors=[F(v)-i*period for i,v in enumerate(taps)],grid=[i*period for i in range(9)])
def meter(a):
 signature=a['signature'];n,beat,strides,names={'3/4':(6,2,[1,2,6],['eighths','quarter beats','bar']),'4/4':(8,2,[1,2,4,8],['eighths','quarter beats','half bar','bar']),'6/8':(6,3,[1,3,6],['eighths','dotted-quarter beats','bar']),'12/8':(12,3,[1,3,6,12],['eighths','dotted-quarter beats','half bar','bar'])}[signature]
 return dict(args=a,n=n,beat=beat,levels=[dict(stride=s,name=name,positions=list(range(0,n,s)))for s,name in zip(strides,names)],weights=[sum(i%s==0 for s in strides)for i in range(n)],groups=[dict(start=i,end=i+beat)for i in range(0,n,beat)])
def necklace(a):
 mask=rotate(a['mask'],a['rotation']);original=onset_set(a['mask']);rotations=[dict(rotation=r,mask=rotate(a['mask'],r),hamming=len(original^onset_set(rotate(a['mask'],r))))for r in range(a['n'])]
 return dict(args=a,bits=list(map(int,mask)),**cyclic(mask),rotations=rotations)
def euclidean(a):
 n,k=a['n'],a['k'];frames,initial=grouping(n,k);mask=rotate(initial,a.get('rotation',0));divisions=[];x,y=sorted([k,n-k],reverse=True)
 while y:q,r=divmod(x,y);divisions.append(dict(x=x,y=y,q=q,r=r));x,y=y,r
 floorpoints={math.ceil(F(j*n,k))-1 for j in range(1,k+1)}if k else set();floor=''.join(word(n,floorpoints))
 return dict(args=a,bits=list(map(int,mask)),**cyclic(mask),**evenness(mask),frames=frames,selectedFrame=a.get('progress',100)*(len(frames)-1)//100,divisions=divisions,gcd=x,floorMask=floor,sameFloorNecklace=canonical(mask)==canonical(floor))
def oddity(a):
 n=a['n'];mask=rotate(a['mask'],a['rotation']);points=onset_set(mask);pairs=[dict(a=i,b=i+n//2,first=int(i in points),second=int(i+n//2 in points),conflict=i in points and i+n//2 in points)for i in range(n//2)];conflicts=[[z['a'],z['b']]for z in pairs if z['conflict']]
 return dict(args=a,bits=list(map(int,mask)),**cyclic(mask),pairs=pairs,conflicts=conflicts,holds=not conflicts,maximumOnsets=n//2)
WEIGHTS=[5]+[1+next(k for k in range(5)if i%(2**(k+1)))for i in range(1,16)]
def metrical_score(mask):
 onsets=sorted(onset_set(mask));contributions=[]
 for i,onset in enumerate(onsets):
  stop=onsets[(i+1)%len(onsets)];distance=(stop-onset)%16 or 16;rests=[(onset+j)%16 for j in range(1,distance)];strongest=max((WEIGHTS[j]for j in rests),default=0)
  contributions.append(dict(onset=onset,onsetWeight=WEIGHTS[onset],rests=rests,strongest=strongest,targets=[j for j in rests if WEIGHTS[j]==strongest],contribution=max(0,strongest-WEIGHTS[onset])))
 metricity=sum(WEIGHTS[i]for i in onsets);maximum=sum(sorted(WEIGHTS,reverse=True)[:len(onsets)])
 return dict(metricity=metricity,maximum=maximum,metricComplexity=maximum-metricity,restContrast=sum(z['contribution']for z in contributions),contributions=contributions)
def syncopation(a):
 mask=rotate(a['mask'],a['rotation']);return dict(args=a,bits=list(map(int,mask)),weights=WEIGHTS,**metrical_score(mask),rotations=[dict(rotation=r,**metrical_score(rotate(a['mask'],r)))for r in range(16)])
def swing(a):
 period=F(60000,a['bpm']);ratio=F(a['ratio'],100);events=[]
 for i in range(8):
  straight=i*period/2;nominal=(i//2+(ratio/(1+ratio)if i%2 else 0))*period;offset=F(((i*37+a['seed']*17)%101)-50,50)*a['jitter']if i else F(0)
  events.append(dict(i=i,straight=straight,nominal=nominal,offset=offset,actual=nominal+offset,deviation=nominal+offset-straight))
 intervals=[(events[i+1]['actual']if i<7 else 4*period)-e['actual']for i,e in enumerate(events)]
 return dict(args=a,period=period,nominalRatio=ratio,events=events,intervals=intervals,measuredRatios=[intervals[2*i]/intervals[2*i+1]for i in range(4)],duration=4*period)
def autocorrelation(a):
 # Independent integer polynomial product via NumPy correlation, not production's lag loops.
 subdivisions=2 if'eighths'in a['pattern']else 1;signal=np.zeros(600,dtype=np.int64);events=[];k=0
 while True:
  at=math.floor(F(k*6000,a['bpm']*subdivisions)+F(1,2));k+=1
  if at>=600:break
  if a['pattern']=='missing beats'and(k-1)%3==1:continue
  strength=7 if a['pattern']=='alternating eighths'and(k-1)%2 else 20;events.append(dict(sample=at,strength=strength))
  start=max(0,at-2);stop=min(600,at+3);signal[start:stop]+=strength*np.array([1,2,3,2,1][start-at+2:stop-at+2])
 polynomial=np.correlate(signal,signal,mode='full')[599:750];energy=int(polynomial[0]);lags=[dict(lag=i,seconds=F(i,100),numerator=int(x),correlation=F(int(x),energy))for i,x in enumerate(polynomial)]
 peaks=[dict(**z,bpm=F(6000,i))for i,z in enumerate(lags)if i>=25 and z['numerator']>0 and z['numerator']>=(lags[i-1]['numerator']if i else-1)and z['numerator']>(lags[i+1]['numerator']if i<150 else-1)];peaks.sort(key=lambda z:(-z['numerator'],-z['lag']));candidates=peaks[:3];lag=candidates[0]['lag']if candidates else None
 return dict(args=a,sampleRate=100,n=600,subdivisions=subdivisions,events=events,signal=signal.tolist(),energy=energy,lags=lags,candidates=candidates,estimate=candidates[0]['bpm']if candidates else None,selectedLag=lag,predictedSamples=list(range(0,600,lag))if lag else[],searchBpm=[40,240])
def additive(a):
 cells=[int(x)for x in a['grouping'].split('+')];n=sum(cells);starts=[sum(cells[:i])for i in range(len(cells))];mask=''.join(word(n,set(starts)));_,e=grouping(n,len(cells))
 return dict(args=a,cells=cells,n=n,starts=starts,bits=list(map(int,mask)),**cyclic(mask),euclideanBits=list(map(int,e)),matchingRotations=[i for i in range(n)if rotate(e,i)==mask],**evenness(mask))
PATTERNS={'E(5,12)':'100101001010','E(4,12)':'100100100100','Son16':'1001001000101000'}
def phasing(a):
 mask=PATTERNS[a['pattern']];n=len(mask);c=cyclic(mask);t=F(1000*a['time']+a['millisecond'],1000);delta=a['delta'];drift=delta*t/60;phaseA=(a['bpm']*t/60)%n;phaseB=((a['bpm']+delta)*t/60)%n;points=onset_set(mask)
 return dict(args=a,bits=list(map(int,mask)),n=n,**c,phaseA=phaseA,phaseB=phaseB,drift=drift,relativePhase=drift%n,shifted=[(F(i)-drift)%n for i in c['onsets']],aligned=drift%c['period']==0,coincidences=len(points&{(F(i)-drift)%n for i in points}),realignmentSeconds=F(60*c['period'],abs(delta))if delta else None,fullCycleDriftSeconds=F(60*n,abs(delta))if delta else None,bpmB=a['bpm']+delta)
def hypermeter(a):
 source=list(range(16));at=a['at'];edit=a['edit'];hyper=a['hyper']
 if edit=='insert':source.insert(at,None)
 if edit=='delete':del source[at]
 strides=[s for s in[1,2,4,8]if s<=hyper];rows=[]
 for i,s in enumerate(source):rows.append(dict(position=i,source=s,expectedWeight=sum(i%d==0 for d in strides),sourceWeight=None if s is None else sum(s%d==0 for d in strides),expectedStrong=i%hyper==0,sourceStrong=None if s is None else s%hyper==0,displacement=None if s is None else s-i,phase=None if s is None else(s-i)%hyper))
 return dict(args=a,strides=strides,rows=rows,bars=len(rows),mismatches=[r['position']for r in rows if r['sourceStrong']is not None and r['sourceStrong']!=r['expectedStrong']])
def hemiola(a):
 quarter=F(60,a['bpm']);return dict(args=a,quarter=quarter,duration=6*quarter,quarters=[i*quarter for i in range(6)],first=[dict(unit=i,time=i*quarter)for i in[0,3]],second=[dict(unit=i,time=i*quarter)for i in[0,2,4]],firstGroupsPerSecond=F(2)/(6*quarter),secondGroupsPerSecond=F(3)/(6*quarter),commonBoundaryUnits=[0,6],groupRatio=[2,3])
def ratio(a):
 p,q=map(int,a['pair'].split(':'));base=mp.power(2,mp.mpf(a['rate'])/10)/2;frequencies=[p*base,q*base];H=[min(4096,max(1,int(mp.floor(6000/f))))for f in frequencies];lines={}
 for voice,unit in enumerate([p,q]):
  L=H[voice]+1
  for h in range(1,L):
   coefficient=F(16,25)*F(L-h,L*L);z=lines.setdefault(h*unit,[F(0),F(0)]);z[voice]=coefficient
 selected=sorted(lines,key=lambda j:(-sum(lines[j]),j))[:18];energy=sum((sum(z)**2/F(2)for z in lines.values()),F(0));strongest=[dict(unit=j,frequency=j*base,first=lines[j][0],second=lines[j][1],amplitude=sum(lines[j]))for j in sorted(selected)]
 return dict(args=a,p=p,q=q,base=base,frequencies=frequencies,harmonics=H,commonCycleSeconds=1/base,firstOnsets=[F(i,p)for i in range(p)],secondOnsets=[F(i,q)for i in range(q)],lineCount=len(lines),energy=energy,strongest=strongest,cutoffHz=6000,sampleRate=44100)
def exact_cos(turns):
 quarter=4*turns
 if quarter.denominator==1:return[mp.mpf(1),mp.mpf(0),mp.mpf(-1),mp.mpf(0)][quarter.numerator%4]
 return mp.cos(2*mp.pi*mp.mpf(turns.numerator)/turns.denominator)
def fejerSample(a):
 phase=F(a['numerator'],a['denominator']);H=a['harmonics'];L=H+1
 # Independent full Fourier sum, rather than production's sine quotient.
 value=mp.fsum([mp.mpf(2*(L-h))/(L*L)*exact_cos(h*phase)for h in range(1,L)])
 return dict(args=a,phase=phase,value=value)
functions={f:globals()[f]for f in corpus['families']};out={'caseCount':len(corpus['cases']),'families':corpus['families'],'cases':[]}
for row in corpus['cases']:out['cases'].append({**row,'expected':scalar(functions[row['family']](row['args']))})
Path(args.out).write_text(json.dumps(out,separators=(',',':'),ensure_ascii=False,allow_nan=False)+'\n');print(json.dumps({'status':'PASS','cases':len(out['cases']),'digits':args.digits,'seconds':time.monotonic()-start,'bytes':Path(args.out).stat().st_size}))
