"""Independent 90-digit iteration of the original Watson binomial example."""
from decimal import Decimal, localcontext
from pathlib import Path
import json
with localcontext() as ctx:
    ctx.prec = 90
    x=Decimal(0); orbit=[str(x)]
    for n in range(1000):
        x=((Decimal(3)+x)/4)**5
        if n<25: orbit.append(str(x))
    rho=str(x)
    thresholds={}
    for N in range(4,61):
        n=Decimal(N)
        time=Decimal(0) if N==4 else ((Decimal(2)/n.sqrt()).ln()/(Decimal(1)-2/n).ln())
        thresholds[str(N)]={'crossing':str(time),'firstInteger':int(time.to_integral_value(rounding='ROUND_CEILING'))}
Path('docs/verification/stoch-sources-references.json').write_text(json.dumps({'precision':90,'watson':{'law':'Binomial(5, 1/4)','pgf':'((3+s)/4)^5','orbit':orbit,'leastRoot':rho},'ehrenfestMeanBand':thresholds},indent=2)+'\n')
print('90-digit Watson fixed-point/26-iterate and 57 mean-band references written')
