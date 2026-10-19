"""Independent 100-digit references; requires mpmath. Optional rational Remez seeds
are supplied with --seeds (only a starting guess; all final solves use mpmath).
"""
import json,pathlib,sys,argparse,subprocess
try: import mpmath as m
except ModuleNotFoundError:
 sys.path.insert(0,'/tmp/atlas-numerical-python');import mpmath as m
ROOT=pathlib.Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--seeds');a=p.parse_args();m.mp.dps=100
out={'precision':100,'euler':[],'newman':[],'cfExp':[],'rationalExp':[]}
out['Halphen']=str(m.findroot(lambda h:sum(k*h**k/(1-(-h)**k)for k in range(1,180))-m.mpf(1)/8,m.mpf('.10765')))
for j in range(2,81):
 z=m.mpf(j)/10;out['euler'].append({'z':str(z),'value':str(m.exp(1/z)*m.e1(1/z)/z)})
for n in [6,12,20,40]:
 alpha=m.exp(-1/m.sqrt(n))
 for sx in ['0','0.00000001','0.0001','0.01','0.1','0.5','1']:
  x=m.mpf(sx);P=m.fprod(x+alpha**k for k in range(n));Q=m.fprod(-x+alpha**k for k in range(n));out['newman'].append({'n':n,'x':sx,'value':str(x*(P-Q)/(P+Q))})
# Exp Chebyshev coefficients are known independently from modified Bessel I.
coef=[m.besseli(k,1)*(1 if k==0 else 2) for k in range(65)]
for n in [1,3,5,8]:
 K=22;H=m.matrix([[coef[n+1+i+j] for j in range(K)]for i in range(K)]);val,U=m.eigsy(H);bi=max(range(K),key=lambda i:abs(val[i]));lam=val[bi];u=[U[j,bi]for j in range(K)];N=128
 ev=[]
 for j in range(N+1):
  th=m.pi*j/N;pol=sum(u[k]*m.exp(1j*k*th)for k in range(K));ev.append(lam*m.cos((n+1)*th+2*m.arg(pol)))
 ec=[(2/m.mpf(N))*sum((m.mpf('.5')if j in [0,N]else 1)*ev[j]*m.cos(k*m.pi*j/N)for j in range(N+1))*(m.mpf('.5')if k==0 else 1)for k in range(n+1)]
 c=[coef[k]-ec[k]for k in range(n+1)];out['cfExp'].append({'n':n,'lambda':str(lam),'values':[{'x':str(x),'value':str(sum(c[k]*m.chebyt(k,x)for k in range(n+1)))}for x in map(m.mpf,['-1','-.5','0','.5','1'])]})
# Independently refine both coefficients and derivative-zero locations at high precision.
if a.seeds:
 seeds=json.loads(pathlib.Path(a.seeds).read_text())
else:
 code="import {rationalExpAudit} from './content/num/numerical-source-audit.shared.js';import{svd}from'./assets/js/viz/math.js';console.log(JSON.stringify(Array.from({length:9},(_,i)=>rationalExpAudit(i+1,svd))));"
 seeds=json.loads(subprocess.run(['node','--input-type=module','-e',code],cwd=ROOT,text=True,capture_output=True,check=True).stdout)
if seeds:
 for n in [1,2,4,8,9]:
  seed=seeds[n-1];pc=list(map(m.mpf,seed['pc']));qc=list(map(m.mpf,seed['qc']));refs=[m.mpf(z['x'])for z in seed['alt']];sign=[1 if z['y']>0 else -1 for z in seed['alt']]
  def ev(c,t):return sum(c[k]*m.chebyt(k,t)for k in range(len(c)))
  def der(c,t):return sum(k*c[k]*m.chebyu(k-1,t)for k in range(1,len(c)))
  def F(t):return m.mpf(0)if t==1 else m.exp(-9*(1+t)/(1-t))
  def de(t):
   q=ev(qc,t);return -18*F(t)/(1-t)**2-(der(pc,t)*q-ev(pc,t)*der(qc,t))/q**2
  h=m.mpf(seed['E'])
  for it in range(12):
   for nw in range(10):
    J=m.matrix(2*n+2);b=m.matrix(2*n+2,1)
    for i,t in enumerate(refs):
     T=[m.chebyt(k,t)for k in range(n+1)];q=ev(qc,t);g=F(t)-sign[i]*h;row=T+[-g*x for x in T[1:]]+[sign[i]*q]
     for j,v in enumerate(row):J[i,j]=v
     b[i]=g*q-ev(pc,t)
    d=m.lu_solve(J,b)
    pc=[x+d[k]for k,x in enumerate(pc)];qc=[qc[0]]+[x+d[n+k]for k,x in enumerate(qc[1:],1)];h+=d[2*n+1]
    if max(map(abs,d))<m.mpf('1e-85'):break
   refs=[m.mpf(-1)]+[m.findroot(de,t,solver='newton',df=lambda x:m.diff(de,x),tol=m.mpf('1e-75'),maxsteps=100)for t in refs[1:-1]]+[m.mpf(1)]
  E=max(abs(F(t)-ev(pc,t)/ev(qc,t))for t in refs)
  out['rationalExp'].append({'n':n,'E':str(E),'pc':list(map(str,pc)),'qc':list(map(str,qc)),'extrema':list(map(str,refs))})
  print('refined',n,file=sys.stderr)
(ROOT/'docs/verification/numerical-orthogonal-rational-references.json').write_text(json.dumps(out,indent=2)+'\n')
