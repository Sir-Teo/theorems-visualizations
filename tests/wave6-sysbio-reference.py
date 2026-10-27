"""Independent full-generator steady states and elastic-partition references.
Scientific reference families are extended as SYSBIO6 is authored; no browser code.
"""
import json, math
from pathlib import Path
import mpmath as mp
import numpy as np
from scipy.linalg import expm
from scipy.integrate import solve_ivp
from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import connected_components
import sympy as sp
mp.mp.dps=120
def exact(x):return mp.mpf(x)
def proofreading(p):
    n=p.get('n',1);sigma=exact(p.get('selectivity',10));m=exact(p.get('advance',.01));mu=exact(p.get('affinity',25));eps=exact(1e-5);v=exact(1e-3)
    mp.mp.dps=1000 if 0<m<1e-250 or 0<mu<1e-250 else 120
    r=m/eps*mp.exp(-mu);N=2*(n+1)+1;Q=mp.matrix(N)
    def add(i,j,rate):Q[j,i]+=rate;Q[i,i]-=rate
    for s,d in enumerate([mp.mpf(1),sigma]):
        for j in range(n+1):
            i=1+s*(n+1)+j;add(0,i,eps**j);add(i,0,d)
            if j<n:add(i,i+1,m);add(i+1,i,r)
    A=Q.copy();rhs=mp.matrix(N,1)
    for j in range(N):A[N-1,j]=1
    rhs[N-1]=1;state=mp.lu_solve(A,rhs);fuel=mp.mpf(0)
    for s in range(2):
        for j in range(n):
            i=1+s*(n+1)+j;fuel+=m*state[i]-r*state[i+1]
    if n==0 or m==0 or mu==0:fuel=mp.mpf(0)
    R=state[n+1];W=state[2*(n+1)];output=v*(R+W);diss=mu*fuel
    return {'params':p,'state':[float(x) for x in state],'error':float(W/R),'output':float(output),'fuel':float(fuel),'logFuel':float(mp.log(fuel)) if fuel>0 else None,'logDissipation':float(mp.log(diss)) if diss>0 else None,'work':float(diss/output),'logWork':float(mp.log(diss/output)) if diss>0 else None}
def elastic(p):
    mp.mp.dps=1000
    d=exact(p.get('d',2));k=exact(p.get('k',1));gap=exact(p.get('gap',1));eta=exact(p.get('background',.01));e=mp.mpf(4)
    def point(d):
        a=mp.exp(e-k*d*d/2)+eta;b=mp.exp(e-k*(d+gap)**2/2)+eta;Z=1+a+b
        return [mp.log(a/b),a/Z,b/Z]
    q=point(d);opt=None
    if k>0 and gap>0 and eta>0:
        # Direct derivative of the original log partition ratio, not the
        # production transformed stationary equation.
        delta=mp.sqrt(k)*gap
        def derivative(y):
            a=mp.exp(e-y*y/2);b=mp.exp(e-(y+delta)**2/2)
            return -y*a/(eta+a)+(y+delta)*b/(eta+b)
        lo=mp.mpf(0);hi=mp.mpf(1)
        while derivative(hi)>0:hi*=2
        for _ in range(200):
            mid=(lo+hi)/2
            if derivative(mid)>0:lo=mid
            else:hi=mid
        opt=(lo+hi)/2/mp.sqrt(k)
    yield_opt=None
    if k>0:
        if gap==0:yield_opt=mp.mpf(0)
        else:
            # Independent quotient-rule derivative of normalized probability.
            def yield_derivative(x):
                y=gap*x;a=mp.exp(e-k*y*y/2)+eta;b=mp.exp(e-k*(y+gap)**2/2)+eta
                da=-k*y*(a-eta);db=-k*(y+gap)*(b-eta)
                return (da*(1+b)-a*db)/(1+a+b)**2
            lo=mp.mpf(0);hi=mp.exp(e)+eta+1
            for _ in range(200):
                mid=(lo+hi)/2
                if yield_derivative(mid)>0:lo=mid
                else:hi=mid
            yield_opt=gap*(lo+hi)/2
    return {'yieldOptimum':float(yield_opt) if yield_opt is not None else None,'yieldMaximum':float(point(yield_opt)[1]) if yield_opt is not None else None,'params':p,'logSpecificity':float(q[0]),'logAdvantage':float(mp.log(q[0])) if q[0]>0 else None,'correct':float(q[1]),'wrong':float(q[2]),'optimum':float(opt) if opt is not None else None,'optimumLogSpecificity':float(point(opt)[0]) if opt is not None else None}
def acr_case(p):
    M=p['total'];a=p['a'];b=p['b'];times=np.linspace(0,12,241)
    # Integrate both species independently from the elementary reaction fluxes.
    def rhs(t,y):
        A,B=y;forward=a*A*B;reverse=b*B
        return [-forward+reverse,forward-reverse]
    z=solve_ivp(rhs,(0,12),[M/2,M/2],t_eval=times,method='DOP853',rtol=2.3e-14,atol=2e-15)
    ids=[0,1,17,60,120,200,240]
    return {'params':p,'selected':[[int(j),*z.y[:,j].tolist()] for j in ids]}
def bifunctional_case(p):
    At=p.get('sensor',.8);Bt=p.get('regulator',2);s=p.get('signal',.6);separate=p.get('architecture','bifunctional')!='bifunctional'
    def rhs(t,y):
        A,AP,B,BP=y;autokinase=s*A;transfer=2*AP*B;dephosphorylation=.5*BP if separate else A*BP
        return [-autokinase+transfer,autokinase-transfer,-transfer+dephosphorylation,transfer-dephosphorylation]
    times=np.linspace(0,20,241);z=solve_ivp(rhs,(0,20),[.8*At,.2*At,.9*Bt,.1*Bt],t_eval=times,method='DOP853',rtol=2.3e-14,atol=2e-15)
    ids=[0,1,17,60,120,200,240]
    return {'params':p,'selected':[[int(j),*z.y[:,j].tolist()] for j in ids]}
def bifunctional_root(p):
    mp.mp.dps=1000;At=exact(p.get('sensor',.8));Bt=exact(p.get('regulator',2));s=exact(p.get('signal',.6));separate=p.get('architecture','bifunctional')!='bifunctional'
    if s==0:AP=BP=mp.mpf(0)
    elif not separate and Bt<=s:AP=At;BP=Bt
    else:
        if separate:
            # Solve the original steady flux balance with a positive parameter
            # x=BP/(s At), which stays O(1) even for subnormal input.
            f=lambda x:2*(At-x*At/2)*(Bt-x*s*At)-x*s*At/2
            lo=mp.mpf(0);hi=min(mp.mpf(2),Bt/(s*At))
            for _ in range(250):
                mid=(lo+hi)/2
                if f(mid)>0:lo=mid
                else:hi=mid
            BP=(lo+hi)/2*s*At
        else:BP=s
        AP=mp.findroot(lambda ap:s*(At-ap)-2*ap*(Bt-BP),s*At/(1+2*Bt))
    return {'params':p,'AP':float(AP),'BP':float(BP),'logAP':float(mp.log(AP)) if AP>0 else None,'logBP':float(mp.log(BP)) if BP>0 else None}
NETWORKS={
 'binding':([[1,1,0],[0,0,1]],[(0,1,1),(1,0,.6)]),
 'cycle':([[1,0,0],[0,1,0],[0,0,1]],[(0,1,1),(1,2,2),(2,0,3)]),
 'chain':([[1,0,0],[0,1,0],[0,0,1]],[(0,1,1),(1,2,2)]),
 'schloegl':([[0],[1],[2],[3]],[(0,1,6),(1,0,11),(2,3,6),(3,2,1)])}
def network_case(name,total=2,poolB=1.5,initial=.35):
    complexes,edges=NETWORKS[name];n=len(complexes);graph=np.zeros((n,n));N=sp.Matrix([[complexes[b][i]-complexes[a][i] for a,b,k in edges] for i in range(len(complexes[0]))])
    for a,b,k in edges:graph[a,b]=1
    l,_=connected_components(csr_matrix(graph),directed=False);strong,_=connected_components(csr_matrix(graph),directed=True,connection='strong');rank=N.rank();times=np.linspace(0,12,241);ids=[0,1,17,60,120,200,240]
    if name in ['cycle','chain']:
        Q=np.array([[-1,0,3 if name=='cycle' else 0],[1,-2,0],[0,2,-3 if name=='cycle' else 0]],float);start=np.array([total*initial,total*(1-initial)/2,total*(1-initial)/2]);selected=[[j,*(expm(times[j]*Q)@start).tolist()] for j in ids]
    elif name=='binding':
        def rhs(t,y):
            A,B,C=y;flux=A*B-.6*C;return[-flux,-flux,flux]
        c=initial*min(total,poolB);z=solve_ivp(rhs,(0,12),[total-c,poolB-c,c],t_eval=times,method='DOP853',rtol=2.3e-14,atol=2e-15);selected=[[j,*z.y[:,j].tolist()] for j in ids]
    else:
        z=solve_ivp(lambda t,y:[6-11*y[0]+6*y[0]**2-y[0]**3],(0,12),[4*initial],t_eval=times,method='DOP853',rtol=2.3e-14,atol=2e-15);selected=[[j,*z.y[:,j].tolist()] for j in ids]
    return {'params':{'name':name,'total':total,'poolB':poolB,'initial':initial},'n':n,'linkage':int(l),'rank':int(rank),'deficiency':int(n-l-rank),'weaklyReversible':bool(strong==l),'selected':selected}
def cascade_case(n,alpha,beta):
    mean=1+n/beta;sd=math.sqrt(1+n/beta**2);T=mean+8*sd
    ids=[0,1,17,60,120,200,240];selected=[];mp.mp.dps=120
    for j in ids:
        # Inverse-Laplace/Erlang convolution, evaluated directly at120digits.
        # SciPy's optimized triangular expm lost accuracy at beta=1+epsilon;
        # this independent analytic reference has no close-eigenvalue subtraction.
        t=exact(j*T/240);A=exact(1e-6);x=[float(A*mp.exp(-t))]
        x += [float(A*exact(alpha)**i*t**i/mp.factorial(i)*mp.exp(-t)*mp.hyp1f1(i,i+1,(1-exact(beta))*t)) for i in range(1,n+1)]
        selected.append([j,*x])
    return {'params':{'n':n,'alpha':alpha,'beta':beta},'selected':selected}
def receptor_case(p):
    mp.mp.dps=1000;L=exact(p.get('ligand',1));Kd=exact(p.get('Kd',1));R=exact(p.get('receptors',1));K=exact(p.get('KE',.15));theta=L/(Kd+L);C=R*theta;maximum=R/(K+R);response=C/(K+C);EC50=Kd*K/(K+R) if R>0 else None
    return {'params':p,'occupancy':float(theta),'bound':float(C),'maximum':float(maximum),'response':float(response),'EC50':float(EC50) if EC50 is not None else None,'normalized':float(response/maximum) if R>0 else None,'logBound':float(mp.log(C)) if C>0 else None,'logResponse':float(mp.log(response)) if response>0 else None,'logShift':float(mp.log(Kd-EC50)) if EC50 is not None else None}
params=[]
for n in [0,1,2,4]:
    for mu in [0,.001,10,30]:
        for m,sigma in [(0,10),(.01,10),(1,100),(10,1)]:params.append({'n':n,'affinity':mu,'advance':m,'selectivity':sigma})
for p in [{'affinity':5e-324},{'advance':5e-324},{'affinity':5e-324,'advance':5e-324},{'n':4,'affinity':5e-324}]:params.append(p)
out={'method':'120-digit full-generator stationary solves and Erlang-convolution hypergeometric pulses;1000-digit tiny-drive/elastic/receptor references; independent SciPy DOP853/network expm and SymPy ranks','proofreading':[proofreading(p) for p in params],'elastic':[elastic(p) for p in [{},{'background':0},{'gap':0},{'k':0},{'k':5e-324},{'gap':5e-324},{'background':5e-324},{'d':0,'gap':5e-324},{'k':8,'gap':2,'background':1}]]}
out['acr']=[acr_case(p) for p in [{'total':M,'a':a,'b':b} for M,a,b in [(.1,1,1),(.5,.1,3),(1,1,1),(2,1,1),(4,3,.1),(4,.1,3),(1+2**-52,1,1),(4,3,3)]]]
out['bifunctional']=[bifunctional_case({'architecture':a,'sensor':At,'regulator':Bt,'signal':s}) for a in ['bifunctional','separate phosphatase'] for At,Bt,s in [(.8,2,.6),(.1,.2,.6),(4,4,2),(.1,4,0),(.8,.6,.6),(4,.1,2)]]
out['bifunctionalRoots']=[bifunctional_root(p) for p in [c['params'] for c in out['bifunctional']]+[{'architecture':a,'signal':5e-324} for a in ['bifunctional','separate phosphatase']]]
out['networks']=[network_case(name,initial=i) for name in NETWORKS for i in [.05,.35,.5,.95]]
out['cascades']=[cascade_case(n,alpha,beta) for n in [1,3,5] for alpha in [0,.7,2] for beta in [.1,.5,1,1+2**-52,3]]+[cascade_case(5,3e-64,.1)]
out['receptors']=[receptor_case(p) for p in [{},{'ligand':0},{'receptors':0},{'ligand':100,'receptors':4,'KE':.01,'Kd':.05},{'ligand':5e-324,'receptors':.1},{'receptors':5e-324},{'ligand':5e-324,'receptors':5e-324,'Kd':5,'KE':5}]]
path=Path(__file__).with_name('fixtures')/'wave6-sysbio-reference.json';path.write_text(json.dumps(out,indent=2,allow_nan=False)+'\n');print(path,{k:len(v) for k,v in out.items() if isinstance(v,list)})
