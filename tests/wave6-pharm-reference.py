import json,math,itertools,random
from pathlib import Path
# Reproducible independent references; no production JS import or network access.
import mpmath as mp
mp.mp.dps=1000
M=mp.mpf; tiny=math.ulp(0.)
def metric(x):
 assert x>=0
 value=float(x)
 return {'value':None if not math.isfinite(value) else value,'log':None if x==0 else float(mp.log(x))}
def vec(xs):return [float(x) for x in xs]
def binding(p):
 L,K,R=map(M,[p['L'],p['Kd'],p['receptors']])
 if p['mode']=='maintained free ligand':ell=L
 else:ell=(L-R-K+mp.sqrt((R+K-L)**2+4*K*L))/2
 theta=ell/(K+ell);return {k:metric(x) for k,x in {'probability':theta,'bound':R*theta,'freeReceptors':R*(1-theta),'freeLigand':ell,'totalLigand':L if p['mode']=='closed total ligand' else L+R*theta}.items()}
def effect(p):
 L,K,n,b,e=map(M,[p['L'],p['K'],p['n'],p['baseline'],p['maximum']]);u=(L/K)**n;s=u/(1+u);y=b*(1-s)+e*s;delta=(e-b)*s;slope=(e-b)*n*s*(1-s)
 return {'S':metric(s),'U':metric(1-s),'response':metric(y),'change':metric(abs(delta)),'sign':int(mp.sign(delta)),'slope':metric(abs(slope)),'slopeSign':int(mp.sign(slope))}
def constitutive(p):
 L,K,b,e=map(M,[p['L'],p['Kd'],p['basal'],p['efficacy']]);w=[1-b,b,(1-e)*L/K,e*L/K];Z=sum(w);probs=[x/Z for x in w];delta=(e-b)*(L/K)/(1+L/K)
 return {'probabilities':vec(probs),'occupancy':metric(sum(probs[2:])),'active':metric(probs[1]+probs[3]),'change':metric(abs(delta)),'sign':int(mp.sign(delta))}
def operational(p,q=1):
 L,K,R,k=map(M,[p['L'],p['Kd'],p['receptors'],p['scale']]);R*=M(q);C=R*L/(K+L);tau=R/k;maximum=R/(k+R);response=C/(k+C)
 z={name:metric(x) for name,x in {'inventory':R,'tau':tau,'bound':C,'maximum':maximum,'response':response,'halfShift':K*R/(k+R)}.items()};z['EC50']=None if R==0 else metric(K*k/(k+R));z['normalized']=None if R==0 else metric(response/maximum);return z
def gating(p):
 L,K,g=map(M,[p['L'],p['Kmic'],p['g']]);w=[M(1),L/K,g*L/K];Z=sum(w);pr=[x/Z for x in w];return {'probabilities':vec(pr),'occupancy':metric(sum(pr[1:])),'open':metric(pr[2]),'maximum':metric(g/(1+g)),'bindingHalf':metric(K/(1+g)),'EC50':None if g==0 else metric(K/(1+g))}
def competitive(p):
 A,B,KA,KB=map(M,[p['A'],p['B'],p['KA'],p['KB']]);w=[M(1),A/KA,B/KB];pr=[x/sum(w) for x in w];return {'probabilities':vec(pr),'agonist':metric(pr[1]),'antagonist':metric(pr[2]),'excess':metric(B/KB),'doseRatio':float(1+B/KB),'halfConcentration':metric(KA*(1+B/KB)),'halfShift':metric(KA*B/KB)}
root_cache={}
def root(R,L,I,K,Ki):
 key=tuple(map(str,[R,L,I,K,Ki]))
 if key in root_cache:return root_cache[key]
 if R==0:return M(0)
 lo=M(0);hi=R
 for _ in range(1300):
  r=(lo+hi)/2;F=r+r*L/(K+r)+r*I/(Ki+r)
  if F>R:hi=r
  else:lo=r
 r=(lo+hi)/2;root_cache[key]=r;return r

def tracer(p):
 L,I,K,Ki,R=map(M,[p['L'],p['I'],p['Kd'],p['Ki'],p['receptors']]);valid=L>0 and R>0
 if p['mode']=='maintained free ligands':
  r=R/(1+L/K+I/Ki);l=L;i=I;B0=R*(L/K)/(1+L/K);ic=Ki*(1+L/K)
 else:
  r=root(R,L,I,K,Ki);l=L*K/(K+r);i=I*Ki/(Ki+r);r0=root(R,L,M(0),K,Ki);B0=r0*L/(K+r0)
  if valid:
   target=B0/2;freeL50=L-target;freeR50=target*K/freeL50;boundI50=R-freeR50-target;freeI50=boundI50*Ki/freeR50;ic=boundI50+freeI50
  else:ic=None
 B=r*l/K;ib=r*i/Ki
 z={k:metric(v) for k,v in {'freeReceptor':r,'freeTracer':l,'freeInhibitor':i,'boundTracer':B,'boundInhibitor':ib,'baselineBound':B0}.items()}
 z.update({'IC50':None if not valid else metric(ic),'idealIC50':None if not valid else metric(Ki*(1+L/K)),'naiveKi':None if not valid else metric(ic/(1+L/K)),'ratio':None if not valid else metric(M(1) if I==0 else B/B0),'inhibition':None if not valid else metric(M(0) if I==0 else (B0-B)/B0)})
 return z

def allosteric(p):
 A,B,KA,KB,alpha,beta,scale=map(M,[p['A'],p['B'],p['KA'],p['KB'],p['alpha'],p['beta'],p['scale']]);a=A/KA;b=B/KB;w=[M(1),a,b,alpha*a*b];pr=[x/sum(w) for x in w];occ=pr[1]+pr[3];mod=pr[2]+pr[3];stim=pr[1]+beta*pr[3];response=stim/(scale+stim);ref=a/(1+a);ref=ref/(scale+ref);lim=beta*(alpha*a)/(1+alpha*a);lim=lim/(scale+lim)
 return {'probabilities':vec(pr),**{k:metric(v) for k,v in {'occupancy':occ,'modulator':mod,'stimulus':stim,'response':response,'reference':ref,'limitingResponse':lim,'apparentBindingKd':KA*(1+b)/(1+alpha*b)}.items()}}

def cases(fn,params):return [{'params':p,'expected':fn(p)} for p in params]
R={'method':'Independent1000-digit arithmetic, physical inventories, labelled-state enumeration, full two-state Markov matrix exponentials and broad-bracket dose equivalence; no JS import','precision':1000,'closedRootBisections':1300,'closedRootBracketWidth':'RT*2^-1300','loeweLogitBisections':260,'loeweLogitBracketWidth':'20000*2^-260','precisionScope':'Working arithmetic precision, not a claim of1000 correct decimal digits in finite-bisection roots.'}
R['binding']=cases(binding,[dict(L=L,Kd=K,receptors=r,mode=m)for L,K,r,m in itertools.product([0,tiny,1e-9,.1,1,100],[.001,1,10],[0,tiny,1,10],['maintained free ligand','closed total ligand'])])
R['effect']=cases(effect,[dict(L=L,K=K,n=n,baseline=b,maximum=e)for L,K,n,(b,e) in itertools.product([0,tiny,.1,1,100],[.001,1,10],[1,2.7,4],[(0,1),(0,0),(.2,.2),(.3,.9),(1,0)])])
R['constitutive']=cases(constitutive,[dict(L=L,Kd=K,basal=b,efficacy=e)for L,K,b,e in itertools.product([0,tiny,.1,1,100],[.001,1,10],[0,.15,.5],[0,.15,.4,1])])
R['operational']=cases(operational,[dict(L=L,Kd=K,receptors=r,scale=s)for L,K,r,s in itertools.product([0,tiny,1,100],[.001,1,10],[0,tiny,.1,1,10],[.001,.1,10])])
R['inactivation']=cases(lambda p:operational(p,p['remaining']),[dict(L=L,Kd=1,receptors=r,scale=.1,remaining=q)for L,r,q in itertools.product([0,tiny,1,100],[tiny,1,10],[0,tiny,.3,1])])
R['gating']=cases(gating,[dict(L=L,Kmic=K,g=g)for L,K,g in itertools.product([0,tiny,.1,1,100],[.001,1,10],[0,tiny,.2,4,100])])
R['competitive']=cases(competitive,[dict(A=A,B=B,KA=k[0],KB=k[1])for A,B,k in itertools.product([0,tiny,.1,100],[0,tiny,1,100],[(.001,10),(1,1),(10,.001)])])
R['tracer']=cases(tracer,[dict(L=L,I=I,Kd=k[0],Ki=k[1],receptors=r,mode=m)for L,I,k,r,m in itertools.product([0,tiny,.1,1,100],[0,tiny,.5,100],[(.001,10),(1,1),(10,.001)],[0,tiny,1,10],['maintained free ligands','closed total ligands'])])
rng=random.Random(20261025)
params=[dict(A=rng.choice([0,tiny,.01,1,100]),B=rng.choice([0,tiny,.01,1,100]),KA=rng.choice([.001,1,10]),KB=rng.choice([.001,1,10]),alpha=rng.choice([.05,1,4,20]),beta=rng.choice([0,.2,1,3]),scale=rng.choice([.01,.3,3]))for _ in range(80)]
params += [dict(A=A,B=B,KA=1,KB=1,alpha=1,beta=1,scale=.3)for A,B in itertools.product([0,tiny,1,100],repeat=2)]
R['allosteric']=cases(allosteric,params)
def kinetic(p):
 L,K,koff,tp,T=map(M,[p['L'],p['Kd'],p['koff'],p['pulse'],p['T']]);on=koff*L/K;Q=mp.matrix([[-on,koff],[on,-koff]]);off=mp.matrix([[0,koff],[0,-koff]]);initial=mp.matrix([1,0])
 def at(t):
  t=M(t)
  if t<=tp:return (mp.expm(Q*t)*initial)[1]
  return (mp.expm(off*(t-tp))*(mp.expm(Q*tp)*initial))[1]
 Tfloat=p['T'];times=sorted(set([Tfloat*i/240 for i in range(241)]+([p['pulse']]if 0<p['pulse']<Tfloat else[])));indices=sorted(set([0,min(1,len(times)-1),len(times)//4,len(times)//2,max(0,len(times)-2),len(times)-1]+([times.index(p['pulse'])]if p['pulse'] in times else[])))
 return {'selected':[{'index':i,'t':times[i],'occupancy':metric(at(times[i]))}for i in indices],'peak':metric(at(min(T,tp))),'residence':float(1/koff),'onTime':float(1/(on+koff)),'exposure':metric(L*min(T,tp))}
R['kinetic']=cases(kinetic,[dict(L=1,Kd=1,koff=.2,pulse=20,T=120),dict(L=100,Kd=.001,koff=2,pulse=.001,T=1),dict(L=.1,Kd=10,koff=.0001,pulse=200,T=1200),dict(L=0,Kd=1,koff=.2,pulse=20,T=120),dict(L=100,Kd=1,koff=.2,pulse=0,T=120),dict(L=1,Kd=1,koff=.2,pulse=20,T=0),dict(L=tiny,Kd=1,koff=.2,pulse=20,T=120),dict(L=1,Kd=1,koff=.2,pulse=tiny,T=1),dict(L=tiny,Kd=1,koff=.2,pulse=tiny,T=1)])
print('kinetic reference complete',flush=True)
def adaptation(p):
 L,K,kd,kr=map(M,[p['L'],p['Kd'],p['desensitization'],p['recovery']]);theta=L/(K+L)
 if p['mode']=='continuous exposure':segments=[(p['duration'],True)]
 else:
  segments=[]
  for i in range(p['pulses']):
   segments.append((p['pulse'],True))
   if i<p['pulses']-1:segments.append((p['gap'],False))
 segments.append((60,False));initial=mp.matrix([1,0]);clock=0;selected=[];peaks=[]
 for j,(length,on)in enumerate(segments):
  des=kd*theta if on else M(0);Q=mp.matrix([[-des,kr],[des,-kr]])
  if on:peaks.append(metric(initial[0]*theta))
  for k in [0,1,15,30,60]:
   elapsed=length*k/60;z=mp.expm(Q*M(elapsed))*initial
   selected.append({'index':j*61+k,'t':clock+elapsed,'availability':metric(z[0]),'desensitized':metric(z[1]),'response':metric(z[0]*theta if on else M(0))})
  initial=mp.expm(Q*M(length))*initial;clock+=length
 return {'selected':selected,'peaks':peaks,'finalAvailability':metric(initial[0]),'finalDesensitized':metric(initial[1])}
adap=[dict(L=1,Kd=1,desensitization=.2,recovery=.04,pulse=20,gap=20,pulses=3,duration=120,mode='repeated pulses')]
for overrides in [dict(mode='continuous exposure'),dict(L=0),dict(desensitization=0),dict(recovery=0,pulses=6,pulse=60),dict(desensitization=0,recovery=0),dict(L=tiny,desensitization=tiny,recovery=0),dict(L=tiny,desensitization=tiny,recovery=tiny),dict(mode='continuous exposure',L=100,Kd=.001,desensitization=2,recovery=0,duration=360),dict(pulse=1,gap=1,pulses=6,recovery=1,desensitization=2)]:adap.append({**adap[0],**overrides})
R['adaptation']=cases(adaptation,adap);print('adaptation reference complete',flush=True)
def loewe(p):
 A,B,KA,KB,na,nb,c,e=map(M,[p['A'],p['B'],p['KA'],p['KB'],p['nA'],p['nB'],p['interaction'],p['target']])
 def solve(c):
  if A==0 and B==0:return None
  if A==0:return nb*mp.log(B/KB)
  if B==0:return na*mp.log(A/KA)
  lo=M(-10000);hi=M(10000)
  for _ in range(260):
   t=(lo+hi)/2;u=A/KA/mp.exp(t/na);v=B/KB/mp.exp(t/nb);F=u+v+c*u*v/(u+v)
   if F>1:lo=t
   else:hi=t
  return(lo+hi)/2
 t=solve(c);rt=solve(M(0));response=M(0)if t is None else 1/(1+mp.exp(-t));reference=M(0)if rt is None else 1/(1+mp.exp(-rt));idx=None if t is None else A/KA/mp.exp(t/na)+B/KB/mp.exp(t/nb);DA=KA*(e/(1-e))**(1/na);DB=KB*(e/(1-e))**(1/nb);iso=[]
 for i in range(121):
  u=M(i)/120
  if u==0:v=M(1)
  elif u==1:v=M(0)
  else:
   b=(2+c)*u-1;const=u*(u-1);v=(-b+mp.sqrt(b*b-4*const))/2
  iso.append([float(u*DA),float(v*DB)])
 return {'response':metric(response),'reference':metric(reference),'combinationIndex':None if idx is None else metric(idx),'doseA':float(DA),'doseB':float(DB),'isobole':iso}
params=[]
for A,B,na,nb,c in [(0,0,1,2,0),(.5,.5,1,2,0),(1,2,1,1,0),(tiny,tiny,4,4,0),(tiny,tiny,4,4,2),(tiny,1,1,4,-.8),(1,tiny,4,1,2),(0,tiny,1,4,0),(1,0,4,1,-.8)]:params.append(dict(A=A,B=B,KA=1,KB=2,nA=na,nB=nb,interaction=c,target=.5))
for _ in range(24):params.append(dict(A=rng.choice([.01,.1,1,20]),B=rng.choice([.01,.1,1,20]),KA=rng.choice([.001,1,10]),KB=rng.choice([.001,1,10]),nA=rng.choice([1,2.7,4]),nB=rng.choice([1,2.7,4]),interaction=rng.choice([-.8,0,2]),target=rng.choice([.01,.5,.99])))
R['loewe']=cases(loewe,params);print('Loewe reference complete',flush=True)
def inverse(p):
 e,b,m,K,n=map(M,[p['target'],p['baseline'],p['maximum'],p['K'],p['n']])
 if b==m:return None
 if e<min(b,m)or e>max(b,m):return None
 if e==b:return metric(M(0))
 if e==m:return None
 return metric(K*(abs(e-b)/abs(m-e))**(1/n))
R['inverse']=cases(inverse,[dict(target=t,baseline=b,maximum=m,K=K,n=n)for t,(b,m),K,n in itertools.product([0,tiny,.25,.75,1],[(0,1),(0,0),(.2,.8),(1,0)],[.001,10],[1,4])])
p=Path(__file__).resolve().parent/'fixtures'/'wave6-pharm-reference.json';p.write_text(json.dumps(R,indent=2,allow_nan=False)+'\n');print({k:len(v)for k,v in R.items()if isinstance(v,list)},flush=True)
