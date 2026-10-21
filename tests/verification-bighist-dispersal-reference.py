"""Independent80-digit haversine reference; chosen marker coordinates only."""
import json
import mpmath as m
m.mp.dps=80
sites=[('irhoud','-8.9','31.9'),('omo','35.9','5.4'),('misliya','35','32.7'),('ust','71','57.7'),('madjedbebe','132.9','-12.5'),('whitesands','-106.2','32.8')]
out=[]
for ia,las,pas in sites:
 for ib,lbs,pbs in sites:
  la,pa,lb,pb=map(lambda x:m.mpf(x)*m.pi/180,[las,pas,lbs,pbs]);h=m.sin((pa-pb)/2)**2+m.cos(pa)*m.cos(pb)*m.sin((la-lb)/2)**2
  d=2*m.mpf('6371.0088')*m.asin(m.sqrt(h))
  out.append(dict(first=ia,second=ib,km=str(d)))
print(json.dumps(out,indent=2))
