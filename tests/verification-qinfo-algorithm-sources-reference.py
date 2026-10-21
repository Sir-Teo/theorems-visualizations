"""Independent 55-digit full-matrix exponential reference (mpmath)."""
import mpmath as m,json
from pathlib import Path
m.mp.dps=55;n=5;N=2**n;out=[]
for g0 in ['0','.2','1','2']:
 g=m.mpf(g0);H=m.matrix(N);C=m.matrix(N)
 zz=[]
 for s in range(N):
  z=[1-2*((s>>(n-1-q))&1) for q in range(n)];zz.append(sum(z[q]*z[q+1] for q in range(n-1)))
 for s in range(N):
  H[s,s]=zz[s]
  for q in range(n):
   j=s^(1<<(n-1-q));H[s,j]+=g;C[s,j]=(zz[s]-zz[j])*g
 comm=m.sqrt(max(m.eigsy(C.T*C,eigvals_only=True)))
 for t0 in ['0','.5','3','6']:
  U=m.expm(-1j*H*m.mpf(t0));p=[U[i,0] for i in range(N)]
  out.append({'g':g0,'t':t0,'comm':str(comm),'state':[[str(z.real),str(z.imag)] for z in p],'Z':str(sum(abs(z)**2*(1-2*((i>>2)&1)) for i,z in enumerate(p)))})
Path('docs/verification/qinfo-algorithm-sources-reference.json').write_text(json.dumps({'precision':55,'method':'independent full dense mpmath matrix exponential; no production helpers','ising':out},indent=2)+'\n')
