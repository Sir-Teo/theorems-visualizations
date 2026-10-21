"""Independent80-digit Bosch–Hale TableVII formula + explicit SI power balance.
No production import. Values transcribed from actual original1992p625/1993p1919.
"""
import json,sys
from pathlib import Path
import mpmath as mp
mp.mp.dps=80
M=mp.mpf
c=[M(x) for x in ['1.17302e-9','.0151361','.0751886','.00460643','.0135','-.00010675','.00001366']]
J=M('1.602176634e-16');B=M('5.34e-37')
def sv(t):
 theta=t/(1-t*(c[1]+t*c[3]+t*t*c[5])/(1+t*c[2]+t*t*c[4]+t*t*t*c[6]))
 xi=mp.root(M('34.3827')**2/(4*theta),3)
 return M('1e-6')*c[0]*theta*mp.sqrt(xi/(M(1124656)*t**3))*mp.exp(-3*xi)
def threshold(t,q=None):
 alpha=sv(t)*M(3500)*J/4;fusion=sv(t)*M(17600)*J/4;d=alpha+(fusion/q if q else 0)-B*mp.sqrt(t)
 return 3*J*t*t/d if d>0 else None
temps=['.2','.3','.4','.5','.6','.7','.8','1','1.25','1.3','1.5','1.75','1.8','2','2.5','3','4','5','6','8','10','12','15','20','30','40','50','80','100']
# The complete corrected D–T column (cm³/s), not the separate D–D columns.
printed=['1.254e-26','7.292e-25','9.344e-24','5.697e-23','2.253e-22','6.740e-22','1.662e-21','6.857e-21','2.546e-20','3.174e-20','6.923e-20','1.539e-19','1.773e-19','2.977e-19','8.425e-19','1.867e-18','5.974e-18','1.366e-17','2.554e-17','6.222e-17','1.136e-16','1.747e-16','2.740e-16','4.330e-16','6.681e-16','7.998e-16','8.649e-16']
rows=[dict(T=t,reactivity=str(sv(M(t))),printedCm3=printed[i] if i<len(printed) else None,thresholds=[str(v) if (v:=threshold(M(t),q)) is not None else None for q in [M(1),M(5),M(20),None]]) for i,t in enumerate(temps)]
tmin=mp.findroot(lambda t:mp.diff(lambda x:threshold(x),t),(M(13),M(16)))
powers=[]
for ns in ['1e19','1e20','3e21']:
 for ts in ['2','15','80']:
  for taus in ['.01','1','20']:
   n,t,tau=map(M,[ns,ts,taus]);fusion=n*n*sv(t)*M(17600)*J/4;alpha=n*n*sv(t)*M(3500)*J/4;transport=3*n*t*J/tau;brems=B*n*n*mp.sqrt(t);net=transport+brems-alpha
   powers.append(dict(n=ns,T=ts,tau=taus,fusion=str(fusion),alpha=str(alpha),transport=str(transport),brems=str(brems),external=str(max(M(0),net)),net=str(net),triple=str(n*t*tau)))
out=dict(reactivities=rows,minimum=dict(T=str(tmin),triple=str(threshold(tmin))),powers=powers)
path=Path(sys.argv[1]) if len(sys.argv)>1 else Path('docs/verification/energy-erratum-reference.json')
path.write_text(json.dumps(out,indent=2)+'\n')
