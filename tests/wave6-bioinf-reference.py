"""Independent references: direct ancestral sums, SciPy CTMC/optimization and quadrature.
Run with Python3 + numpy/scipy/mpmath. Does not import or execute production JS.
"""
import itertools, json, math
from pathlib import Path
import numpy as np
import mpmath as mp
from scipy.linalg import expm
from scipy.optimize import minimize_scalar
from scipy.special import logsumexp
from scipy.stats import gamma, poisson
mp.mp.dps=120
PAIRS=[((0,1),(2,3)),((0,2),(1,3)),((0,3),(1,2))]
PAT={k:list(itertools.product(range(k),repeat=4)) for k in (2,4)}
PAT={k:sorted(v,key=lambda p:sum(x*k**i for i,x in enumerate(p))) for k,v in PAT.items()}
def matrix(d,model='JC69',pA=.25,cycle=.75):
    k=2 if model=='CFN' else 4
    if k==2:return np.array([[1-d,d],[d,1-d]])
    pi=np.array([pA]+[(1-pA)/3]*3) if model=='equal-input' else np.ones(4)/4
    if model=='cycle':
        Q=-np.eye(4)
        for i in range(4):Q[i,(i+1)%4]=(1+cycle)/2;Q[i,(i-1)%4]=(1-cycle)/2
    else:Q=(np.tile(pi,(4,1))-np.eye(4))/(1-np.dot(pi,pi))
    return expm(d*Q)
def law(topology=0,pendants=(.08,.25,.08,.25),internal=.12,model='JC69'):
    k=2 if model=='CFN' else 4
    pi=np.ones(k)/k;E=[matrix(d,model) for d in pendants];M=matrix(internal,model);(a,b),(c,d)=PAIRS[topology]
    return np.array([sum(pi[i]*E[a][i,x[a]]*E[b][i,x[b]]*M[i,j]*E[c][j,x[c]]*E[d][j,x[d]] for i in range(k) for j in range(k)) for x in PAT[k]])
def mp_transition(d,model='JC69',pA=.25):
    pi=[mp.mpf(str(pA))]+[(1-mp.mpf(str(pA)))/3]*3 if model=='equal-input' else [mp.mpf(1)/4]*4
    c=1-sum(p*p for p in pi);x=mp.mpf(d)/c;lost=-mp.expm1(-x)
    return [[(mp.exp(-x) if i==j else 0)+pi[j]*lost for j in range(4)] for i in range(4)],pi
def mp_column(d,topology,root,obs,model='JC69',pA=.25):
    # mp.mpf(float) preserves the actual binary64 input, especially5e-324.
    P,pi=mp_transition(mp.mpf(d),model,pA);L,_=mp_transition(mp.mpf(d)*mp.mpf(root),model,pA);R,_=mp_transition(mp.mpf(d)*(1-mp.mpf(root)),model,pA);(a,b),(c,e)=PAIRS[topology]
    joints=[pi[r]*L[r][i]*R[r][j]*P[i][obs[a]]*P[i][obs[b]]*P[j][obs[c]]*P[j][obs[e]] for r in range(4) for i in range(4) for j in range(4)]
    p=sum(joints)
    return None if p==0 else float(mp.log(p))
class RNG:
    def __init__(self,seed):self.a=seed
    def u(self):
        self.a=(self.a+0x6D2B79F5)&0xffffffff
        t=((self.a^(self.a>>15))*(1|self.a))&0xffffffff
        t=(((t+(((t^(t>>7))*(61|t))&0xffffffff))&0xffffffff)^t)&0xffffffff
        return ((t^(t>>14))&0xffffffff)/2**32+2**-33
def alignment(N,seed,pendants=(.08,.25,.08,.25),internal=.12,model='JC69'):
    # Explicit unrooted forward generative graph; 4 connects A/B and internal node5.
    k=2 if model=='CFN' else 4;r=RNG(seed);M=[matrix(d,model) for d in pendants]+[matrix(internal,model)]
    def draw(row):return min(k-1,int(np.searchsorted(np.cumsum(row),r.u())))
    cols=[]
    for _ in range(N):
        i=draw(np.ones(k)/k);a=draw(M[0][i]);b=draw(M[1][i]);j=draw(M[4][i]);c=draw(M[2][j]);d=draw(M[3][j]);cols.append([a,b,c,d])
    counts=np.bincount([sum(x*k**i for i,x in enumerate(p)) for p in cols],minlength=k**4)
    return cols,counts
def ll(counts,prob):
    mask=np.asarray(counts)>0
    if np.any(prob[mask]<=0):return -math.inf
    return float(np.dot(np.asarray(counts)[mask],np.log(prob[mask])))
def fit(counts,topology,pendants,model):
    hi=.5 if model=='CFN' else 2
    # Optimize physical edge length directly, independently of retention bisection.
    f=lambda d:-ll(counts,law(topology,pendants,d,model))
    z=minimize_scalar(f,bounds=(0,hi),method='bounded',options={'xatol':1e-12})
    d=min([0,hi,float(z.x)],key=f)
    value=-f(d)
    return {'d':d,'logL':value if math.isfinite(value) else None,'status':'positive' if math.isfinite(value) else 'impossible'}
out={'method':'120-digit direct ancestral sums; SciPy expm, bounded physical-edge optimization, Gamma CDF and Poisson tail; independent seeded simulations','digits':mp.mp.dps,'transitions':[],'columns':[],'profiles':[],'gamma':[],'bootstrap':[],'mcmc':[],'binary':[],'genes':[]}
for model in ['JC69','equal-input','cycle']:
    for d in [0,1e-12,.03,.4,2,4]:
        for pA in ([.1,.25,.7] if model=='equal-input' else [.25]):
            for cycle in ([0,.75,.9] if model=='cycle' else [.75]):out['transitions'].append({'model':model,'d':d,'pA':pA,'cycle':cycle,'matrix':matrix(d,model,pA,cycle).tolist()})
for model,pA in [('JC69',.25),('equal-input',.1),('equal-input',.7)]:
    for d in [0,5e-324,1e-200,1e-12,.15,2]:
        for root in [0,.37,1]:
            obs=[0,1,0,2];out['columns'].append({'model':model,'pA':pA,'d':d,'root':root,'topology':1,'obs':obs,'logL':mp_column(d,1,root,obs,model,pA)})
for N,seed in [(20,1),(100,1),(240,71)]:
    cols,counts=alignment(N,seed)
    out['profiles'].append({'N':N,'seed':seed,'counts':counts.tolist(),'firstColumns':cols[:12],'fits':[fit(counts,t,[.08,.25,.08,.25],'JC69') for t in range(3)]})
for shape in [.1,.4,1,3,8]:
    for d in [0,1e-12,.8,4]:
        a=mp.mpf(str(shape));x=mp.mpf(str(d));match=mp.mpf(1)/4+mp.mpf(3)/4*mp.power(1+4*x/(3*a),-a)
        bins=[float(gamma.cdf((j+1)/6,shape,scale=1/shape)-gamma.cdf(j/6,shape,scale=1/shape)) for j in range(24)]
        out['gamma'].append({'shape':shape,'d':d,'match':float(match),'jcLength':float(3*a/4*mp.log1p(4*x/(3*a))),'tail':float(gamma.sf(4,shape,scale=1/shape)),'bins':bins})
for N,B,internal,ds,bs in [(20,20,0,1,2),(100,100,.12,1,2),(240,200,.6,17,91)]:
    cols,_=alignment(N,ds,internal=internal);r=RNG(bs);count=[0,0,0,0];first=None
    for b in range(B):
        indices=[int(r.u()*N) for _ in range(N)]
        D=np.array([[sum(cols[s][i]!=cols[s][j] for s in indices) for j in range(4)] for i in range(4)])
        scores=[int(D[a,b]+D[c,d]) for (a,b),(c,d) in PAIRS];w=[t for t,x in enumerate(scores) if x==min(scores)];count[w[0] if len(w)==1 else 3]+=1
        if first is None:first={'indices':indices,'scores':scores}
    out['bootstrap'].append({'params':{'N':N,'B':B,'internal':internal,'dataSeed':ds,'bootstrapSeed':bs},'counts':count,'first':first})
for N,ds,rate,cs in [(20,1,0,2),(100,1,1,2),(240,71,5,17)]:
    _,counts=alignment(N,ds);states=[]
    for t in range(3):
        for j in range(21):states.append(ll(counts,law(t,internal=j/10))-rate*j/10)
    mass=np.exp(np.array(states)-logsumexp(states));r=RNG(cs);current=0;chain=[0];accepted=0
    for step in range(1200):
        choice=int(r.u()*4);t,j=divmod(current,21)
        proposal=((t+choice+1)%3)*21+j if choice<2 else current+(-1 if choice==2 else 1)
        if choice>=2 and not 0<=j+(-1 if choice==2 else 1)<21:proposal=current
        if math.log(r.u())<min(0,states[proposal]-states[current]):current=proposal;accepted+=1
        chain.append(current)
    out['mcmc'].append({'params':{'N':N,'dataSeed':ds,'priorRate':rate,'chainSeed':cs},'mass':mass.tolist(),'chainFirst':chain[:60],'chainCounts':np.bincount(chain[241:],minlength=63).tolist(),'accepted':accepted})
for p,q,r in [(.4,.01,.01),(.1,.05,.15),(.49,.001,0),(0,0,.1),(.001,.1,.2)]:
    pendants=[p,q,p,q];prob=law(0,pendants,r,'CFN');costs=[]
    for t in range(3):
        (a,b),(c,d)=PAIRS[t];costs.append([min(sum([x[a]!=i,x[b]!=i,x[c]!=j,x[d]!=j,i!=j]) for i in range(2) for j in range(2)) for x in PAT[2]])
    out['binary'].append({'params':{'long':p,'short':q,'internal':r},'law':prob.tolist(),'costs':costs,'expectedMP':[float(np.dot(c,prob)) for c in costs],'fits':[fit(prob,t,pendants,'CFN') for t in range(3)]})
for tau,N,seed in [(0,1000,1),(.3,300,1),(4,1000,71)]:
    r=RNG(seed);genes=[];counts=[0,0,0]
    for _ in range(N):
        wait=-math.log(r.u())
        if wait<tau:pair=0;first=1+wait;root=1+tau-math.log(r.u());within=True
        else:pair=int(r.u()*3);first=1+tau-math.log(r.u())/3;root=first-math.log(r.u());within=False
        genes.append({'pair':pair,'first':first,'root':root,'within':within});counts[pair]+=1
    out['genes'].append({'params':{'tau':tau,'N':N,'seed':seed},'first':genes[:12],'counts':counts})
out['uniformizationTail']=float(poisson.sf(63,4))
dest=Path(__file__).with_name('fixtures')/'wave6-bioinf-reference.json'
dest.write_text(json.dumps(out,indent=2,allow_nan=False)+'\n')
print(dest, 'reference families:',{k:len(v) for k,v in out.items() if isinstance(v,list)})
