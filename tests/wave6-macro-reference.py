"""Independent exact accounting and high-precision open-economy reference.

No production helper import. Run with --digits2800 for a precision cross-check.
"""
from fractions import Fraction as F
from pathlib import Path
import argparse,json,math,random
import mpmath as mp

parser=argparse.ArgumentParser();parser.add_argument('--digits',type=int,default=1400);parser.add_argument('--out',default='tests/fixtures/wave6-macro-reference.json');args=parser.parse_args();mp.mp.dps=args.digits
def frac(x):return x if isinstance(x,F)else F.from_float(x)if isinstance(x,float)else F(x)
def real(x):
 if isinstance(x,F):return mp.mpf(x.numerator)/x.denominator
 if isinstance(x,(int,float)):return real(frac(x))
 return x
def quant(x):
 value=float(x);sgn=(x>0)-(x<0)
 return {'value':value,'sign':sgn,'logMagnitude':float(mp.log(abs(real(x))))if sgn else None,'belowRange':bool(sgn and value==0),'aboveRange':not math.isfinite(value)}
def pack(raw):return{k:quant(v)if isinstance(v,(F,mp.mpf))else v for k,v in raw.items()}
MIN=math.ulp(0.0);rng=random.Random(6212026)
data=json.loads((Path(__file__).parent/'fixtures/wave6-macro-price-source.json').read_text());dates=sorted({r['date']for r in data})
defaults={
 'accounting':dict(output=200,consumption=110,government=35,investment=40,primaryIncome=-10,secondaryIncome=5,capitalAccount=0,unreportedFraction=0,valuation=0),
 'exchange':dict(spot=1.2,domesticPrice=120,foreignPrice=100,nominalGrowth=0,domesticInflation=.03,foreignInflation=.01,time=10),
 'burger':dict(country='JPN',date=dates[-1]),
 'uip':dict(spot=1.2,domesticRate=.04,foreignRate=.02,time=1,expectedWedge=0,dispersion=.2),
 'carry':dict(targetRate=.025,crashSpotRatio=.65,crashProbability=.05,crashPeriod=12,schedule='one authored crash'),
 'smallOpen':dict(worldRate=.04,fiscalExpansion=10,exportSensitivity=20),
 'balassa':dict(tradedProductivity=2,nontradedProductivity=1,tradedShare=.5)}
def evaluate(name,overrides):
 p=defaults[name]|overrides;z={k:frac(v)for k,v in p.items()if isinstance(v,(int,float))};m={k:real(v)for k,v in z.items()};out={'parameters':p}
 if name=='accounting':
  y,c,g,i,pi,si,ka,u,v=[z[k]for k in ['output','consumption','government','investment','primaryIncome','secondaryIncome','capitalAccount','unreportedFraction','valuation']]
  nx=y-c-g-i;gndi=y+pi+si;saving=gndi-c-g;ca=nx+pi+si;fa=ca+ka;reported=(1-u)*fa;residual=ca+ka-reported
  out|=pack(dict(netExports=nx,grossNationalDisposableIncome=gndi,saving=saving,currentAccount=ca,capitalAccount=ka,financialAccount=fa,assetsAcquired=40+max(fa,F(0)),liabilitiesIncurred=40+max(-fa,F(0)),reportedFinancialAccount=reported,recordingResidual=residual,reconcilingEntry=-residual,savingIdentityResidual=saving-i-ca,bopIdentityResidual=ca+ka-fa,initialNIIP=F(20),valuation=v,finalNIIP=20+fa+v,niipChange=fa+v))
  out['direction']='net financial outflow'if fa>0 else'net financial inflow'if fa<0 else'zero net financial flow'
 elif name=='exchange':
  s,pd,pf,gn,id,iff,t=[z[k]for k in ['spot','domesticPrice','foreignPrice','nominalGrowth','domesticInflation','foreignInflation','time']];q0=s*pf/pd;l=(gn+iff-id)*t
  out|=pack(dict(initialNominal=s,initialReal=q0,initialConvertedForeign=s*pf,nominal=real(s)*mp.exp(real(gn*t)),domesticPrice=real(pd)*mp.exp(real(id*t)),foreignPrice=real(pf)*mp.exp(real(iff*t)),convertedForeign=real(s*pf)*mp.exp(real((gn+iff)*t)),real=real(q0)*mp.exp(real(l)),realChange=real(q0)*mp.expm1(real(l)),logRealChange=l,logNominalContribution=gn*t,logForeignPriceContribution=iff*t,logDomesticPriceContribution=-id*t))
  out['direction']='domestic real appreciation'if l<0 else'domestic real depreciation'if l>0 else'unchanged real exchange rate'
 elif name=='burger':
  r=next(r for r in data if r['iso_a3']==p['country']and r['date']==p['date']);us=next(r for r in data if r['iso_a3']=='USA'and r['date']==p['date']);local,spot,usprice=F(r['local_price']),F(r['dollar_ex']),F(us['local_price']);dollars=local/spot;ratio=dollars/usprice;deviation=ratio-1;published=F(r['USD_raw'])
  out|={'source':r,'usSource':us};out|=pack(dict(localPrice=local,marketSpot=spot,usPrice=usprice,convertedPrice=dollars,sourceConvertedPrice=F(r['dollar_price']),priceRatio=ratio,rawPriceDeviation=deviation,publishedRawIndex=published,publishedRoundingDifference=deviation-published,burgerRealExchange=spot*usprice/local,paritySpot=local/usprice));out['direction']='higher dollar burger price'if deviation>0 else'lower dollar burger price'if deviation<0 else'same dollar burger price'
 elif name=='uip':
  s,rd,rf,t,w,sigma=[z[k]for k in ['spot','domesticRate','foreignRate','time','expectedWedge','dispersion']];l=(rd-rf)*t;wl=w*t;home=mp.exp(real(rd*t));required=real(s)*mp.exp(real(l));expected=mp.exp(real((rd+w)*t));gap=home*mp.expm1(real(wl));risk=expected*real(sigma);jensen=-mp.log1p(-real(sigma*sigma))/2
  out|=pack(dict(homePayoff=home,requiredMeanSpot=required,meanSpot=real(s)*mp.exp(real(l+wl)),meanSpotDiscrepancy=required*mp.expm1(real(wl)),expectedForeignPayoff=expected,expectedPayoffGap=gap,lowForeignPayoff=expected-risk,highForeignPayoff=expected+risk,lowExcessPayoff=gap-risk,highExcessPayoff=gap+risk,payoffStandardDeviation=risk,payoffVariance=expected**2*real(sigma*sigma),jensenGap=jensen,expectedLogDepreciation=real(l+wl)-jensen,logOfMeanDepreciation=l+wl,logParityBenchmark=l));out['parity']=wl==0;out['status']='equal expected domestic payoffs'if wl==0 else'foreign expected payoff exceeds home'if wl>0 else'foreign expected payoff below home'
 elif name=='carry':
  r,h,prob=[z[k]for k in ['targetRate','crashSpotRatio','crashProbability']];growth=mp.exp(real(r));success=mp.expm1(real(r));crash=real(h)*growth-1;mean=real(1-prob*(1-h))*growth-1;fair=-mp.expm1(-real(r))/real(1-h);variance=real(prob*(1-prob)*(1-h)**2)*mp.exp(real(2*r));total=mp.mpf(0);illustration=[]
  for j in range(1,21):
   isCrash=p['schedule']=='one authored crash'and j==p['crashPeriod'];payoff=crash if isCrash else success;total+=payoff;illustration.append({'period':j,'isCrash':isCrash,'payoff':quant(payoff),'cumulative':quant(total)})
  out|=pack(dict(normalGain=success,crashGain=crash,expectedGain=mean,fairCrashProbability=fair,variance=variance,twentyPeriodExpectedSum=20*mean));out|={'illustration':illustration,'finalIllustrativeSum':quant(total),'status':'positive expected payoff in this model'if mean>0 else'negative expected payoff in this model'}
 elif name=='smallOpen':
  r,dg,eta=[z[k]for k in ['worldRate','fiscalExpansion','exportSensitivity']];i=40-100*r;s=50-dg;n0=50-i;nx=s-i;l0=n0/eta;l=nx/eta;dl=-dg/eta
  out|=pack(dict(investment=i,baselineSaving=F(50),saving=s,baselineNetExports=n0,netExports=nx,netExportChange=-dg,investmentChange=F(0),baselineRealExchange=mp.exp(real(l0)),realExchange=mp.exp(real(l)),realExchangeChange=mp.exp(real(l0))*mp.expm1(real(dl)),logRealExchange=l,logRealExchangeChange=dl,investmentSavingResidual=s-i-nx,output=F(200),consumption=F(120),government=30+dg,expenditureResidual=200-(120+30+dg+i+nx)));out['direction']='domestic real appreciation'if dg>0 else'unchanged real exchange rate'
 elif name=='balassa':
  at,an,alpha=[z[k]for k in ['tradedProductivity','nontradedProductivity','tradedShare']];other=1-alpha;pn=at/an;lp=real(other)*mp.log(real(pn));price=mp.exp(lp);xt=alpha*at;xn=other*an
  out|=pack(dict(tradedPrice=F(1),wage=at,nontradedPrice=pn,compositePrice=price,realExchange=1/price,realIncome=real(at)/price,logCompositePrice=lp,tradedLabour=alpha,nontradedLabour=other,tradedOutput=xt,nontradedOutput=xn,tradedOutputValue=xt,nontradedOutputValue=pn*xn,budgetResidual=at-(xt+pn*xn),priceElasticityToTraded=other,incomeElasticityToTraded=alpha,priceElasticityToNontraded=-other,incomeElasticityToNontraded=other,realExchangeElasticityToTraded=-other));out['direction']='higher domestic composite price than foreign'if pn>1 else'lower domestic composite price than foreign'if pn<1 else'same composite price as foreign'
 return out

cases=[]
def add(name,p,label):cases.append({'name':name,'parameters':p,'label':label})
for name in defaults:add(name,{},'default')
for j in range(42):add('accounting',dict(output=rng.uniform(150,300),consumption=rng.uniform(50,140),government=rng.uniform(10,60),investment=rng.uniform(10,70),primaryIncome=rng.uniform(-30,30),secondaryIncome=rng.uniform(-20,20),capitalAccount=rng.uniform(-10,10),unreportedFraction=rng.choice([0,1,MIN,.2,.5]),valuation=rng.uniform(-30,30)),f'accounting{j}')
for p in [dict(consumption=125,government=35,investment=40,primaryIncome=0,secondaryIncome=0),dict(consumption=125,government=35,investment=40,primaryIncome=MIN,secondaryIncome=0),dict(primaryIncome=0,secondaryIncome=0,capitalAccount=MIN),dict(valuation=MIN,unreportedFraction=1)]:add('accounting',p,'retained accounting identity/boundary')
for j in range(44):add('exchange',dict(spot=rng.uniform(.1,10),domesticPrice=rng.uniform(1,1000),foreignPrice=rng.uniform(1,1000),nominalGrowth=rng.uniform(-.1,.1),domesticInflation=rng.uniform(-.1,.1),foreignInflation=rng.uniform(-.1,.1),time=rng.uniform(0,20)),f'exchange{j}')
for p in [dict(time=0),dict(time=MIN,domesticInflation=MIN,foreignInflation=0),dict(time=20,nominalGrowth=.1,domesticInflation=-.1,foreignInflation=.1),dict(domesticInflation=.03,foreignInflation=.03),dict(domesticInflation=math.nextafter(.03,math.inf),foreignInflation=.03),dict(domesticInflation=math.nextafter(.03,0),foreignInflation=.03)]:add('exchange',p,'zero/tiny/adjacent real change')
for r in data:add('burger',dict(country=r['iso_a3'],date=r['date']),'complete fixed price cohort')
for j in range(52):add('uip',dict(spot=rng.uniform(.1,10),domesticRate=rng.uniform(-.1,.1),foreignRate=rng.uniform(-.1,.1),time=rng.uniform(0,20),expectedWedge=rng.choice([0,rng.uniform(-.05,.05)]),dispersion=rng.uniform(0,.8)),f'uip{j}')
for p in [dict(time=0),dict(dispersion=0),dict(dispersion=MIN),dict(time=MIN,expectedWedge=MIN),dict(time=MIN,expectedWedge=-MIN),dict(domesticRate=.04,foreignRate=math.nextafter(.04,math.inf),dispersion=0),dict(domesticRate=.04,foreignRate=math.nextafter(.04,0),dispersion=0),dict(domesticRate=.1,foreignRate=-.1,expectedWedge=.05,time=20,dispersion=.8),dict(domesticRate=0,foreignRate=0,expectedWedge=0,dispersion=MIN)]:add('uip',p,'exact conditional parity and Jensen/tiny boundaries')
for j in range(37):add('carry',dict(targetRate=rng.uniform(.005,.04),crashSpotRatio=rng.uniform(.1,.9),crashProbability=rng.uniform(0,.3),crashPeriod=rng.randint(1,20),schedule=rng.choice(['one authored crash','no crash'])),f'carry{j}')
for r,h in [(.005,.1),(.025,.65),(.04,.8)]:
 fair=float(-mp.expm1(-real(r))/real(1-frac(h)))
 for p in [math.nextafter(fair,0),fair,math.nextafter(fair,math.inf)]:add('carry',dict(targetRate=r,crashSpotRatio=h,crashProbability=p),'adjacent binary64 inputs around independently calculated fair crash probability')
for p in [dict(crashProbability=0),dict(crashProbability=MIN),dict(crashProbability=.3),dict(crashPeriod=1),dict(crashPeriod=20)]:add('carry',p,'probability/schedule endpoints')
for j in range(37):add('smallOpen',dict(worldRate=rng.uniform(0,.1),fiscalExpansion=rng.uniform(0,40),exportSensitivity=rng.uniform(10,50)),f'open{j}')
for p in [dict(fiscalExpansion=0),dict(fiscalExpansion=MIN),dict(worldRate=0,fiscalExpansion=10),dict(worldRate=.1,fiscalExpansion=40,exportSensitivity=10),dict(worldRate=0,fiscalExpansion=math.nextafter(10,0)),dict(worldRate=0,fiscalExpansion=math.nextafter(10,math.inf))]:add('smallOpen',p,'net-export zero/adjacent and tiny fiscal shift')
for j in range(43):add('balassa',dict(tradedProductivity=rng.uniform(.25,4),nontradedProductivity=rng.uniform(.25,4),tradedShare=rng.uniform(.1,.9)),f'balassa{j}')
for at,an,alpha in [(1,1,.5),(4,4,.1),(.25,.25,.9),(4,.25,.5),(.25,4,.5),(math.nextafter(1,2),1,.5),(math.nextafter(1,0),1,.5),(1,math.nextafter(1,2),.9),(1,math.nextafter(1,0),.1)]:add('balassa',dict(tradedProductivity=at,nontradedProductivity=an,tradedShare=alpha),'matched/adjacent/sector productivity endpoints')
rows=[]
for j,c in enumerate(cases):rows.append(c|{'expected':evaluate(c['name'],c['parameters'])})
output={'oracle':{'digits':args.digits,'method':'Independent Fraction accounting/decimal prices and mpmath exponential/logarithm expectations. No production import; no empirical fit.'},'rows':rows}
Path(args.out).write_text(json.dumps(output,indent=2,ensure_ascii=False,allow_nan=False)+'\n');print(json.dumps({'cases':len(rows),'families':{n:sum(c['name']==n for c in cases)for n in defaults},'digits':args.digits,'out':args.out}))
