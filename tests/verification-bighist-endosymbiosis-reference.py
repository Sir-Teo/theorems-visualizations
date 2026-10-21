"""Independent75digit source-count ratio/log oracle, no production imports."""
import json
from decimal import Decimal as D,getcontext
getcontext().prec=75
rows=[('caulobacter',3767,4016942),('rickettsia',834,1111523),('reclinomonas',67,69034),('human',13,16569)]
out=[dict(source=s,quantity=q,value=n,ratio=str(D(n)/h),x=str(D(n).log10()),logRatio=str((D(n)/h).log10())) for s,c,b in rows for q,n,h in [('coding',c,D(13)),('bp',b,D(16569))]]
print(json.dumps(out,indent=2))
