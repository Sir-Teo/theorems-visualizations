"""Independent80digit SI source equations; Decimal trig and monotone bisection."""
from decimal import Decimal as D,getcontext
from pathlib import Path
import json
getcontext().prec=80
pi=D('3.14159265358979323846264338327950288419716939937510582097494459230781640628620899')
def sine(x):
 term=x;out=x
 for i in range(1,90):term*=-x*x/D((2*i)*(2*i+1));out+=term
 return out
def response(L,v,a,rho):
 L,v,a,rho=map(lambda x:D(str(x)),(L,v,a,rho));radius=L*500
 mass=D(4)/3*pi*radius**3*rho;energy=mass*(v*1000)**2/2
 transient=D('1.161')*(rho/2500)**(D(1)/3)*(1000*L)**D('.78')*(1000*v)**D('.44')*D('9.81')**D('-.22')*sine(a*pi/180)**(D(1)/3)/1000
 final=transient*D('1.25')if transient<=D('2.56')else D('1.17')*transient**D('1.13')/D('3.2')**D('.13')
 return dict(mass=mass,energy=energy,transient=transient,final=final)
rows=[]
for L in[1,50]:
 for v in[12,35]:
  for a in[15,90]:
   for rho in[1500,3500]:
    rows.append([L,v,a,rho])
rows += [[11,20,45,2700],[12.123456789,22.123456789,37.123456789,2432.123456789]]
out=[]
for args in rows:
 p=response(*args);lo=D(1);hi=D(90)
 for i in range(240):
  mid=(lo+hi)/2
  if response(mid,*args[1:])['final']<180:lo=mid
  else:hi=mid
 p['needed']=(lo+hi)/2
 out.append(dict(input=args,expected={k:str(v)for k,v in p.items()}))
dust=[]
for L,rho,f in[(2,1000,0),(20,1000,1),(20,2700,.22),(10,2000,.22),(12.123456789,1876.123456789,.123456789)]:
 L,rho,f=map(lambda x:D(str(x)),(L,rho,f));m=D(4)/3*pi*(L*500)**3*2200;exc=m*60;ret=exc*f;thickness=ret/(rho*D('5.1e14'))*1000
 dust.append(dict(input=list(map(str,(L,rho,f))),expected={k:str(v)for k,v in dict(mass=m,excavated=exc,retained=ret,thickness=thickness).items()}))
Path('docs/verification/bighist-impact-reference.json').write_text(json.dumps(dict(source='Collins2005Eqs1/21/22/27; independent80digitSItrig and bisection; Alvarez1980massbalance',impact=out,dust=dust),indent=2)+'\n')
print('Wrote18independent80digit impact/inverse and5dust references')
