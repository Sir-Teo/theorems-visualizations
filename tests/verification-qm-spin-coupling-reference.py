"""Independent exact SymPy CG and Gaunt fixtures; python -m pip install sympy."""
import json
import sympy as s
from sympy.physics.wigner import clebsch_gordan,gaunt
from pathlib import Path
R=s.Rational
pairs=[(R(1,2),R(1,2)),(1,R(1,2)),(1,1),(R(3,2),R(1,2)),(R(3,2),1)]
cgs=[]
for a,b in pairs:
 for J in [abs(a-b)+i for i in range(int(a+b-abs(a-b))+1)]:
  for M in [-J+i for i in range(int(2*J)+1)]:
   for m in [-a+i for i in range(int(2*a)+1)]:
    for q in [-b+i for i in range(int(2*b)+1)]:
     c=clebsch_gordan(a,b,J,m,q,M)
     cgs.append({'args':list(map(float,[a,m,b,q,J,M])),'exact':str(c),'value':float(c)})
rows=[]
for l,lp in [(1,2),(1,0),(2,3),(1,1),(2,2)]:
 for op in ['1','2','mix']:
  k=2 if op=='2' else 1
  for q in range(-3 if op=='mix' else -k,(3 if op=='mix' else k)+1):
   for m in range(-l,l+1):
    mp=m+q
    if abs(mp)>lp:continue
    def me(K):return s.sqrt(4*s.pi/(2*K+1))*(-1)**mp*gaunt(lp,K,l,-mp,q,m) if abs(q)<=K else s.S.Zero
    e=me(k)+(R(9,10)*me(3) if op=='mix' else 0)
    c=clebsch_gordan(l,k,lp,m,q,mp) if abs(q)<=k else s.S.Zero
    rows.append({'l':l,'lp':lp,'op':op,'m':m,'q':q,'mp':mp,'me':float(e),'c':float(c),'exact':str(s.simplify(e))})
Path('docs/verification/qm-spin-coupling-reference.json').write_text(json.dumps({'generator':'SymPy exact Clebsch–Gordan and Gaunt integrations; see tests/verification-qm-spin-coupling-reference.py','cg':cgs,'tensor':rows},indent=2)+'\n')
