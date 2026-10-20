"""Independent exact rational polygon clipping / centroid oracle, no production imports."""
import json
from fractions import Fraction as F
from itertools import combinations_with_replacement, product

def calc(a,e):
 a0,a1=map(lambda x:F(float(x)),a);e0,e1=map(lambda x:F(float(x)),e);wa=a1-a0;we=e1-e0;tie=F(0)
 if wa and we:
  rect=[(a0,e0),(a1,e0),(a1,e1),(a0,e1)];poly=[]
  for u,v in zip(rect,rect[1:]+rect[:1]):
   fu=u[0]-u[1];fv=v[0]-v[1]
   if fu>=0:poly.append(u)
   if (fu<0<fv) or (fv<0<fu):
    t=fu/(fu-fv);poly.append((u[0]+t*(v[0]-u[0]),u[1]+t*(v[1]-u[1])))
  cross=F(0);mx=F(0);my=F(0)
  for u,v in zip(poly,poly[1:]+poly[:1]):
   c=u[0]*v[1]-v[0]*u[1];cross+=c;mx+=(u[0]+v[0])*c;my+=(u[1]+v[1])*c
  after=cross/(2*wa*we);lag=(mx-my)/(6*wa*we)
 elif not wa and not we:after=F(a0>e0);tie=F(a0==e0);lag=max(a0-e0,F(0))
 else:
  lo,hi=(e0,e1) if not wa else (a0,a1);cut=a0 if not wa else e0
  l,h=(lo,min(hi,max(lo,cut))) if not wa else (min(hi,max(lo,cut)),hi)
  after=(h-l)/(hi-lo);lag=abs((h-l)*(cut-(h+l)/2))/(hi-lo)
 inside=F(e0>=a0 and e0<=a1) if not we else max(F(0),min(a1,e1)-max(a0,e0))/we
 d={'after':after,'before':1-after-tie,'tie':tie,'positiveLag':lag,'conditionalLag':lag/after if after else None,'inside':inside}
 return {k:float(v) if v is not None else None for k,v in d.items()}

xs=['.3','1','2','3','5','10','120'];wins=list(combinations_with_replacement(xs,2));pairs=list(product(wins,wins))
pairs += [([59.3,70.7],[39.8,51.2]),([21,23],[11.4,13.8]),([.620,.656],[.470,.554]),([1,1.00000000001],[1.00000000001,1.00000000002]),([119.999999998,120],[119.999999999,120]),([.312345678901,.812345678901],[.512345678901,1.5123456789]),([7.12345678901,7.12345678902],[7.12345678901,7.12345678903])]
print(json.dumps([{'a':list(map(float,a)),'e':list(map(float,e)),'stats':calc(a,e)} for a,e in pairs],separators=(',',':')))
