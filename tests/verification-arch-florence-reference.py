"""Independent80digit direct meridian quadrature and bisection. JSON to stdout."""
import json
import mpmath as m
m.mp.dps=80
out=[]
for ks in ['.5','.500000000001','.65','.8','1']:
 k=m.mpf(ks);R=k*m.mpf('45.5');c=m.mpf('22.75')-R;top=m.acos(-c/R);rise=R*m.sin(top)
 def point(f):
  u=top*f;r=c+R*m.cos(u);z=R*m.sin(u)
  if f==1:return dict(fraction=str(f),z=str(rise),Nphi=str(-R/2 if k==m.mpf('.5')else 0),Ntheta=str(-R/2 if k==m.mpf('.5')else 0),weight='0')
  W=2*m.pi*R*m.quad(lambda t:c+R*m.cos(t),[u,top])
  mer=-W/(2*m.pi*r*m.cos(u));hoop=r/m.cos(u)*(-mer/R-m.sin(u))
  return dict(fraction=str(f),z=str(z),Nphi=str(mer),Ntheta=str(hoop),weight=str(W))
 lo=m.mpf(0);hi=top*m.mpf('.9')
 # A source-free analytical root bracket is used here only after direct numerical quadrature signs agree.
 assert m.mpf(point(0)['Ntheta'])>0 and m.mpf(point(m.mpf('.9'))['Ntheta'])<0
 for j in range(270):
  mid=(lo+hi)/2
  if m.mpf(point(mid/top)['Ntheta'])>0:lo=mid
  else:hi=mid
 root=(lo+hi)/2
 positive=R*m.quad(lambda u:m.mpf(point(u/top)['Ntheta']),[0,root])
 out.append(dict(k=float(k),rise=str(rise),root=str(root),positive=str(positive),points=[point(m.mpf(f))for f in ['0','.01','.1','.25','.5','.75','.99','1']]))
print(json.dumps(out,indent=2))
