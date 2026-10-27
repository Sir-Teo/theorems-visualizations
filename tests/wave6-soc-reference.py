"""Independent finite-model references using Fraction, union-find and DOP853.
No empirical study data or source figure reconstruction.
"""
from fractions import Fraction as F
from pathlib import Path
import json,math,itertools,hashlib,os
import numpy as np
from scipy.integrate import solve_ivp

HERE=Path(__file__).parent
OUT=Path(os.environ.get('SOC_REFERENCE_OUTPUT',str(HERE/'fixtures'/'wave6-soc-reference.json')))
def q(x):
 x=F(x);return {'exact':{'n':str(x.numerator),'d':str(x.denominator)},'value':float(x),'sign':(x>0)-(x<0)}
def qs(xs):return [q(x) for x in xs]
def rng(seed):
 state=seed+1
 while True:
  state=(1664525*state+1013904223)%2**32
  yield state/2**32
def edges_for(kind):
 if kind=='star':es={(0,j)for j in range(1,16)}
 elif kind=='cycle':es={tuple(sorted((i,(i+1)%16)))for i in range(16)}
 else:
  es=set()
  for y,x in itertools.product(range(4),repeat=2):
   es.add(tuple(sorted((4*y+x,4*y+(x+1)%4))))
   es.add(tuple(sorted((4*y+x,4*((y+1)%4)+x))))
 return sorted(es)
def voter_reference(kind='star',initial='hub only',seed=37,attempts=80):
 random=rng(seed);es=edges_for(kind);adj=[[j for j in range(16)if tuple(sorted((i,j)))in es and i!=j]for i in range(16)];degree=list(map(len,adj));total=sum(degree)
 xs=[int(i==0)if initial=='hub only'else int(i<8)if initial=='half'else i%2 if initial=='alternating'else int(next(random)<.5)for i in range(16)]
 def moments():return F(sum(xs),16),F(sum(d*x for d,x in zip(degree,xs)),total)
 history=[];first=None;changes=0;last=None
 for k in range(attempts+1):
  if k:
   site=int(next(random)*16);neighbor=adj[site][int(next(random)*degree[site])];previous=xs[site];xs[site]=xs[neighbor];changed=xs[site]!=previous;changes+=int(changed);last={'site':site,'neighbor':neighbor,'previous':previous,'copied':xs[site],'changed':changed,'attempt':k}
  plain,weighted=moments();history.append({'attempt':k,'state':xs[:],'plain':q(plain),'weighted':q(weighted)})
  if len(set(xs))==1 and first is None:first=k
 drift=sum((F(sum(xs[j]-xs[i]for j in adj[i]),16*degree[i]*16)for i in range(16)),F())
 # Independent edge-pair cancellation: each undirected edge contributes +d and -d.
 weighted_drift=sum((F(xs[j]-xs[i],16*total)+F(xs[i]-xs[j],16*total)for i,j in es),F())
 assert weighted_drift==0
 events=[]
 for i in range(16):
  for j in adj[i]:events.append({'site':i,'neighbor':j,'changed':xs[j]!=xs[i], 'probability':q(F(1,16*degree[i])),'deltaPlain':q(F(xs[j]-xs[i],16)),'deltaWeighted':q(F((xs[j]-xs[i])*degree[i],total))})
 assert sum(F(e['probability']['exact']['n'])/F(e['probability']['exact']['d'])for e in events)==1
 return {'state':xs,'history':history,'lastEvent':last,'firstAbsorbed':first,'changes':changes,'plain':q(plain),'weighted':q(weighted),'expectedPlainDrift':q(drift),'expectedWeightedDrift':q(weighted_drift),'absorbed':len(set(xs))==1,'events':events}
PROFILES={'three groups':[.04,.10,.16,.22,.36,.43,.51,.58,.74,.81,.87,.94], 'asymmetric bridge':[0,.125,.375,.625,1], 'even spacing':[i/11 for i in range(12)],'two blocs':[.05,.08,.11,.14,.17,.20,.80,.83,.86,.89,.92,.95]}
def hk(xs,epsilon):
 xs=list(map(F,xs));e=F(epsilon);mask=[[abs(x-y)<=e for y in xs]for x in xs];nxt=[sum((y for y,ok in zip(xs,row)if ok),F())/sum(row)for row in mask]
 assert all(min(xs)<=x<=max(xs)for x in nxt)
 return nxt,[[j for j,ok in enumerate(row)if ok]for row in mask]
def confidence_reference(profile='three groups',epsilon=.2,steps=12,selected=4):
 xs=list(map(F,PROFILES[profile]));history=[qs(xs)];first=None;initial=sum(xs)/len(xs)
 for k in range(steps):
  nxt,_=hk(xs,epsilon)
  if nxt==xs and first is None:first=k
  xs=nxt;history.append(qs(xs))
 nxt,neighbors=hk(xs,epsilon);fixed=nxt==xs
 if fixed and first is None:first=steps
 ordered=sorted(xs);barriers=[{'left':q(a),'right':q(b),'gap':q(b-a)}for a,b in zip(ordered,ordered[1:])if b-a>F(epsilon)]
 return {'opinions':qs(xs),'history':history,'neighbors':neighbors,'selectedNeighbors':neighbors[selected],'next':qs(nxt),'firstFixed':first,'fixed':fixed,'barriers':barriers,'meanInitial':q(initial),'meanCurrent':q(sum(xs)/len(xs)),'meanNext':q(sum(nxt)/len(nxt))}
def grid_edges(size):
 return [(i,j)for i in range(size*size)for j in range(i+1,size*size)if(i//size==j//size and j-i==1)or j-i==size]
def culture_stats(xs,es):
 features=len(xs[0]);overlaps=[sum(a==b for a,b in zip(xs[i],xs[j]))for i,j in es];links=[{'i':i,'j':j,'overlap':o,'active':0<o<features}for(i,j),o in zip(es,overlaps)]
 # Union-find counts spatial equal-culture regions independently of DFS.
 parent=list(range(len(xs)))
 def root(i):
  while parent[i]!=i:i=parent[i]
  return i
 for(i,j),o in zip(es,overlaps):
  if o==features:parent[root(j)]=root(i)
 active=sum(0<o<features for o in overlaps)
 return {'links':links,'activeEdges':active,'distinctCultures':len(set(map(tuple,xs))),'regions':len({root(i)for i in range(len(xs))}),'frozen':active==0,'meanSimilarity':q(F(sum(overlaps),features*len(es)))}
def culture_reference(features=4,traits=5,seed=37,attempts=300,size=6):
 random=rng(seed);n=size*size;es=grid_edges(size)
 # Original site neighbor order is north, west, east, south.
 adj=[[j for j in [i-size if i>=size else -1,i-1 if i%size else -1,i+1 if i%size<size-1 else -1,i+size if i<n-size else -1]if j>=0]for i in range(n)]
 xs=[[int(next(random)*traits)for _ in range(features)]for _ in range(n)];history=[];first=None;changes=0;last=None
 for k in range(attempts+1):
  if k:
   site=int(next(random)*n);neighbor=adj[site][int(next(random)*len(adj[site]))];different=[i for i,(a,b)in enumerate(zip(xs[site],xs[neighbor]))if a!=b];overlap=features-len(different);gate=next(random);interacted=gate<overlap/features and len(different)>0;feature=previous=copied=None
   if interacted:
    feature=different[int(next(random)*len(different))];previous=xs[site][feature];copied=xs[neighbor][feature];xs[site][feature]=copied;changes+=1
   last={'attempt':k,'site':site,'neighbor':neighbor,'overlap':overlap,'features':features,'differences':different,'gate':gate,'interacted':interacted,'feature':feature,'previous':previous,'copied':copied}
  z=culture_stats(xs,es)
  if z['frozen']and first is None:first=k
  history.append({'attempt':k,**{name:z[name]for name in ['activeEdges','distinctCultures','regions','meanSimilarity']}})
 return {'cultures':xs,'history':history,'lastEvent':last,'firstFrozen':first,'changes':changes,**z}
def echo_reference(epsilon=.7,unfollowThreshold=.45,prune=True,steps=8,seed=37):
 random=rng(seed);xs=[F((.12 if i<6 else .72)+.16*next(random))for i in range(12)];es=[(i,j)for i in range(12)for j in [(i+1)%12,(i+11)%12,(i+6)%12]]
 def run(do_prune):
  current=xs[:];links=es[:];history=[{'round':0,'opinions':qs(current),'edges':[list(e)for e in links],'removed':[]}]
  for k in range(1,steps+1):
   matrix=[[int(i==j or((i,j)in links and abs(current[i]-current[j])<=F(epsilon)))for j in range(12)]for i in range(12)]
   nxt=[sum((F(a)*x for a,x in zip(row,current)),F())/sum(row)for row in matrix]
   removed=[e for e in links if do_prune and abs(nxt[e[0]]-nxt[e[1]])>F(unfollowThreshold)]
   links=[e for e in links if e not in removed];current=nxt;history.append({'round':k,'opinions':qs(current),'edges':[list(e)for e in links],'removed':[list(e)for e in removed]})
  return {'opinions':qs(current),'edges':[list(e)for e in links],'history':history}
 return {'initial':{'opinions':qs(xs),'edges':[list(e)for e in es]},'fixedEdges':run(False),'selected':run(prune)}
def disclosure_reference(threshold=4,seedCount=2,round=6,heterogeneous=True):
 thresholds=[max(0,min(12,threshold+i%5-2))if heterogeneous else threshold for i in range(12)];public=set(range(seedCount));history=[];first=None
 for k in range(round+1):
  flags=[i in public for i in range(12)];history.append({'round':k,'count':len(public),'publicDissent':flags});nxt=public|{i for i,t in enumerate(thresholds)if len(public)>=t}
  if nxt==public and first is None:first=k
  if k<round:public=nxt
 eligible=[i not in public and len(public)>=thresholds[i]for i in range(12)];count=len(public)
 return {'thresholds':thresholds,'privateOpposition':[True]*12,'publicDissent':[i in public for i in range(12)],'eligible':eligible,'privateCount':12,'publicCount':count,'hiddenOpposition':12-count,'history':history,'firstFixed':first,'fixed':not any(eligible)}
def synchrony_reference(seed=37,spread=.25,coupling=2,time=4,step=1/256):
 random=rng(seed);initial=np.array([2*math.pi*next(random)for _ in range(16)]);freq=np.array([x for i in range(8)for x in [1-spread*(i+1)/8,1+spread*(i+1)/8]])
 times=np.array(sorted({0.,time,*[k*step for k in range(16,math.floor(time/step)+1,16)]}))
 # Pairwise sin(theta_j-theta_i), independent of production mean-field form.
 def derivative(t,phase):return 2*math.pi*freq+coupling*np.sin(phase[None,:]-phase[:,None]).mean(axis=1)
 if time==0:phases=initial;states=initial[:,None];difference=0.
 elif coupling==0:
  states=initial[:,None]+2*math.pi*freq[:,None]*times;phases=states[:,-1];difference=0.
 else:
  options=dict(method='DOP853',rtol=2.3e-14,atol=3e-14,t_eval=times)
  a=solve_ivp(derivative,(0,time),initial,max_step=1/32,**options);b=solve_ivp(derivative,(0,time),initial,max_step=1/64,**options)
  assert a.success and b.success
  difference=float(np.max(np.abs(a.y-b.y)));assert difference<2e-11,difference
  states=b.y;phases=states[:,-1]
 def resultant(xs):
  z=np.exp(1j*xs).mean();return {'cosine':float(z.real),'sine':float(z.imag),'R':float(abs(z)),'angle':float(np.angle(z))}
 result={'phases':phases.tolist(),'frequencies':freq.tolist(),'resultant':resultant(phases),'velocities':derivative(time,phases).tolist(),'initialMean':float(initial.mean()),'currentMean':float(phases.mean()),'expectedMean':float(initial.mean()+2*math.pi*time),'history':[{'time':float(t),**resultant(xs)}for t,xs in zip(times,states.T)]}
 return result,difference
rows=[]
def add(fn,args,expected):rows.append({'family':fn,'args':args,'expected':expected})
for kind,initial,seed,attempts in itertools.product(['cycle','torus','star'],['hub only','half','alternating','seeded'],[0,37,999],[0,1,23,120]):
 a=dict(kind=kind,initial=initial,seed=seed,attempts=attempts);add('voter',a,voter_reference(**a))
for profile,epsilon,steps in itertools.product(PROFILES,[0,math.nextafter(.125,0),.125,math.nextafter(.125,1),.2,.5,1],[0,1,5,24]):
 a=dict(profile=profile,epsilon=epsilon,steps=steps,selected=0);add('confidence',a,confidence_reference(**a))
for features,traits,seed,attempts in itertools.product([1,2,4,5],[1,3,8],[0,37],[0,1,31,240]):
 a=dict(features=features,traits=traits,seed=seed,attempts=attempts,size=4);add('culture',a,culture_reference(**a))
for epsilon,unfollowThreshold,prune,steps in itertools.product([0,.25,.6,1],[0,.3,1],[False,True],[0,1,8]):
 a=dict(epsilon=epsilon,unfollowThreshold=unfollowThreshold,prune=prune,steps=steps,seed=37);add('echo',a,echo_reference(**a))
for threshold,seedCount,round,heterogeneous in itertools.product([0,2,6,12],[0,1,5,12],[0,1,3,12],[False,True]):
 a=dict(threshold=threshold,seedCount=seedCount,round=round,heterogeneous=heterogeneous);add('disclosure',a,disclosure_reference(**a))
max_ref=0.
for seed,spread,coupling,time in itertools.product([0,37],[0,.25,.5],[0,.25,2,6],[0,.0625,4,12]):
 a=dict(seed=seed,spread=spread,coupling=coupling,time=time);out,diff=synchrony_reference(**a);max_ref=max(max_ref,diff);add('synchrony',a,out)
for scale,correct,answer,majority in itertools.product([.6,1,1.4],[0,1,2],[None,0,1,2],['unanimous wrong','truthful dissenter','no group']):
 ratios=[F(.72),F(1),F(1.28)];lengths=[F(scale)*ratios[(i-correct+4)%3]for i in range(3)];script=[]if majority=='no group'else [correct if majority=='truthful dissenter'and i==5 else(correct+1)%3 for i in range(6)]
 a=dict(scale=scale,correct=correct,answer=answer,majority=majority,reveal=False);add('lineBoard',a,{'standard':q(scale),'lengths':qs(lengths),'script':script,'answered':answer is not None,'matches':None if answer is None else answer==correct,'diagnosis':False})
output={'scope':'Original finite-model independent references; no empirical data/availability promotion.','families':{name:sum(r['family']==name for r in rows)for name in sorted({r['family']for r in rows})},'DOP853MaximumHalvedStepDifference':max_ref,'cases':rows}
for row in rows:
 family=row['family'];a=row['args'];z=row['expected']
 if family=='voter':
  es=edges_for(a['kind']);adj=[[j for j in range(16)if i!=j and tuple(sorted((i,j)))in es]for i in range(16)]
  z.update(graph={'kind':a['kind'],'n':16,'neighbors':adj,'degree':list(map(len,adj)),'edges':[list(e)for e in es]},initial=a['initial'],seed=a['seed'],attempts=a['attempts'])
 elif family=='confidence':z.update(a)
 elif family=='culture':
  side=a['size'];n=side*side;adj=[[j for j in [i-side if i>=side else -1,i-1 if i%side else -1,i+1 if i%side<side-1 else -1,i+side if i<n-side else -1]if j>=0]for i in range(n)]
  z.update(graph={'size':side,'n':n,'neighbors':adj,'edges':[list(e)for e in grid_edges(side)]},**{k:a[k]for k in ['features','traits','seed','attempts']})
 elif family=='echo' or family=='disclosure':z.update(a)
 elif family=='synchrony':
  random=rng(a['seed']);initial=[2*math.pi*next(random)for _ in range(16)]
  z.update(a);z.update(step=1/256,initial={'phases':initial,'frequencies':z['frequencies']},meanResidual=z['currentMean']-z['expectedMean'],approximate=True)
 elif family=='lineBoard':z.update(a)
 z['illustration']=True
output['completeScientificObjects']=True
raw=(json.dumps(output,separators=(',',':'),allow_nan=False)+'\n').encode();OUT.write_bytes(raw)
print(json.dumps({'cases':len(rows),'families':output['families'],'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'DOP853MaximumHalvedStepDifference':max_ref},indent=2))
