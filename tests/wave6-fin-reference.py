from fractions import Fraction as F
from pathlib import Path
import json,math,os,mpmath as mp
mp.mp.dps=int(os.environ.get('FIN_LOG_DIGITS','100'))
def q(x):
 x=F(x);v=float(x);s=(x>0)-(x<0)
 return {'value':v,'sign':s,'logMagnitude':float(mp.log(mp.mpf(abs(x.numerator))/x.denominator))if s else None,'belowRange':bool(s and v==0),'aboveRange':not math.isfinite(v),'approximate':False}
def law(mode):
 a,b,c=F(40),F(160),F(mode)
 m=F(2)/((b-a)*(c-a));n=F(-2)/((b-a)*(b-c));segments=[(a,c,m,-a*m),(c,b,n,-b*n)]
 def integrate(low,high,strike=None,moment=False):
  total=F(0)
  for lo,hi,m,v in segments:
   lo=max(lo,F(low));hi=min(hi,F(high))
   if lo>=hi:continue
   if strike is not None:
    K=F(strike);primitive=lambda x:m*x**3/3+(v-K*m)*x**2/2-K*v*x
   elif moment:primitive=lambda x:m*x**3/3+v*x**2/2
   else:primitive=lambda x:m*x*x/2+v*x
   total+=primitive(hi)-primitive(lo)
  return total
 mean=integrate(a,b,moment=True)
 cdf=lambda x:integrate(a,min(b,F(x)))
 call=lambda k:integrate(max(a,F(k)),b,strike=k)
 put=lambda k:integrate(a,min(b,F(k)),strike=k)*-1
 def density(x):
  x=F(x)
  if x<=a or x>=b:return F(0)
  return next(m*x+v for lo,hi,m,v in segments if lo<=x<=hi)
 return mean,cdf,call,put,density
def density_case(p):
 mode,K,B,h=[F(p[k])for k in ['mode','strike','discount','bandwidth']];mean,cdf,call,put,density=law(mode);C=call(K);cost=call(K-h)+call(K+h)-2*C;recovered=cost/h**2 if h else None
 out={'mean':mean,'stockPrice':B*mean,'callPrice':B*C,'putPrice':B*put(K),'callSlope':-B*(1-cdf(K)),'callCurvature':B*density(K),'cdf':cdf(K),'survival':1-cdf(K),'density':density(K),'probabilityMass':1,'butterflyCost':B*cost,'discountedBandwidthSquare':B*h*h,'parityResidual':C-put(K)-(mean-K)}
 return {**{k:q(v)for k,v in out.items()},'recoveredDensity':None if recovered is None else q(recovered),'recoveryError':None if recovered is None else q(recovered-density(K))}
def claims_case(p):
 mean,cdf,call,put,density=law(p['mode']);P=law(p['physicalMode'])[1];F0,V,B=[F(p[k])for k in ['face','terminalAssets','discount']];eq=max(V-F0,0);debt=min(V,F0);loss=max(F0-V,0);E=B*call(F0);D=B*(F0-put(F0));A=B*mean
 return {k:q(v)for k,v in {'equityPayoff':eq,'debtPayoff':debt,'defaultLoss':loss,'payoffResidual':eq+debt-V,'promiseDecompositionResidual':debt+loss-F0,'equityValue':E,'debtValue':D,'assetValue':A,'valueResidual':E+D-A,'riskNeutralDefault':cdf(F0),'physicalDefault':P(F0),'putValue':B*put(F0)}.items()}

def payoff_case(p):
 K,C,S,B=[F(p[k])for k in ['strike','premium','terminal','discount']];units=1 if p['side']=='long'else-1
 gross=max((S-K)if p['kind']=='call'else(K-S),0);effective=C/B if p['convention']=='terminal financed'else C
 values={'intrinsic':gross,'signedPayoff':units*gross,'signedPremiumCost':units*C,'effectivePremium':effective,'signedEffectivePremium':units*effective,'profit':units*(gross-effective),'payoffProfitResidual':F(0)}
 zero=K+effective if p['kind']=='call'else K-effective
 if C==0:
  zeroSet={'kind':'closed interval','lower':q(0),'upper':q(K)}if p['kind']=='call'else{'kind':'closed ray','lower':q(K),'upper':None}
 elif zero<0:zeroSet={'kind':'empty','lower':None,'upper':None}
 else:zeroSet={'kind':'single price','lower':q(zero),'upper':q(zero)}
 return {**{k:q(v)for k,v in values.items()},'zeroProfitSet':zeroSet}
def parity_case(p):
 S,K,B,tv,w,X=[F(p[k])for k in ['spot','strike','discount','timeValue','callOffset','terminal']];bond=B*K;C=max(S-bond,0)+tv;P=max(bond-S,0)+tv;sg=(w>0)-(w<0);ct=max(X-K,0)+K;ps=max(K-X,0)+X
 values={'strikeBondPrice':bond,'consistentCall':C,'consistentPut':P,'quotedCall':C+w,'parityGap':w,'callBondTerminal':ct,'putStockTerminal':ps,'terminalIdentityResidual':0,'arbitrageInitialReceipt':abs(w),'arbitrageTerminalPayoff':0}
 return{**{k:q(v)for k,v in values.items()},'holdingUnits':{'call':-sg,'strikeBond':-sg,'put':sg,'stock':sg}}
def bounds_case(p):
 S,K,B,w,X=[F(p[k])for k in ['spot','strike','discount','quoteOffset','terminal']];bond=B*K;call=p['kind']=='call';lower=max(S-bond if call else bond-S,0);upper=S if call else bond;quote=(lower if p['reference']=='lower'else upper)+w;receipt=F(0);units={'option':0,'stock':0,'strikeBond':0}
 if quote<lower:
  receipt=lower-quote
  if lower==0:units['option']=1
  elif call:units={'option':1,'stock':-1,'strikeBond':1}
  else:units={'option':1,'stock':1,'strikeBond':-1}
 elif quote>upper:
  receipt=quote-upper
  units={'option':-1,'stock':1,'strikeBond':0}if call else{'option':-1,'stock':0,'strikeBond':1}
 payoff=max(X-K if call else K-X,0);future=units['option']*payoff+units['stock']*X+units['strikeBond']*K
 assert future>=0
 values={'strikeBondPrice':bond,'lowerBound':lower,'upperBound':upper,'quotedPrice':quote,'gapAboveLower':quote-lower,'gapAboveUpper':quote-upper,'witnessInitialReceipt':receipt,'witnessTerminalPayoff':future}
 return{**{k:q(v)for k,v in values.items()},'holdingUnits':units}
def early_case(p):
 S,K,B,f=[F(p[k])for k in ['spot','strike','discount','dividendFraction']];D=S*f;exercise=max(S-K,0);postSpot=(S-D)/B;continuation=B*max(postSpot-K,0);american=max(exercise,continuation);lower=max(S-B*K,0)
 values={'dividend':D,'strikeBondPrice':B*K,'exercisePayoff':exercise,'noDividendLowerBound':lower,'noDividendBoundAdvantage':lower-exercise,'strikeFinancingBenefit':K-B*K,'deterministicContinuation':continuation,'deterministicAmericanValue':american,'continuationAdvantage':continuation-exercise}
 return{**{k:q(v)for k,v in values.items()},'noDividendNonnegativeRateAssumptions':f==0 and B<=1,'deterministicChoice':'continue'if continuation>exercise else'exercise now'if continuation<exercise else'tie'}

def convexity_case(p):
 K,L,R,B,w,X=[F(p[k])for k in ['strike','leftWidth','rightWidth','discount','quoteOffset','terminal']];mean,cdf,C,P,density=law(p['mode']);lo=K-L;hi=K+R;wl=R/(L+R);wr=L/(L+R);Cl=B*C(lo);Ch=B*C(hi);Cm=B*C(K);chord=wl*Cl+wr*Ch;quote=(Cm if p['reference']=='fair'else chord)+w;cost=wl*Cl+wr*Ch-quote;lp=wl*max(X-lo,0);rp=wr*max(X-hi,0);mp=max(X-K,0);future=lp+rp-mp;assert future>=0
 v={'lowStrike':lo,'highStrike':hi,'leftWeight':wl,'rightWeight':wr,'leftPrice':Cl,'rightPrice':Ch,'fairMiddlePrice':Cm,'chordPrice':chord,'quotedMiddlePrice':quote,'fairConvexityGap':chord-Cm,'butterflyCost':cost,'leftWingPayoff':lp,'rightWingPayoff':rp,'middleCallPayoff':mp,'butterflyPayoff':future,'strictNegativeCostReceipt':max(-cost,0)}
 return{**{k:q(x)for k,x in v.items()},'verdict':'negative-cost nonnegative-payoff butterfly'if cost<0 else'no negative-cost butterfly at this triplet'}
def strategies_case(p):
 stock,S,X,B=[F(p[k])for k in ['stockUnits','spot','terminal','discount']];pieces=[];total=stock*X;cost=stock*S;left=stock;right=stock
 for j,leg in enumerate(p['legs']):
  K,u,premium=[F(leg[k])for k in ['strike','units','premium']];cp=leg['kind']=='call';pay=u*max(X-K if cp else K-X,0);expense=u*premium;total+=pay;cost+=expense
  if cp:right+=u
  else:left-=u
  pieces.append({'slot':j+1,'payoff':q(pay),'initialCost':q(expense)})
 values={'stockPayoff':stock*X,'stockInitialCost':stock*S,'totalPayoff':total,'totalInitialCost':cost,'terminalFinancedCost':cost/B,'terminalFinancedProfit':total-cost/B,'nominalProfit':total-cost,'leftTailSlope':left,'rightTailSlope':right,'sumResidual':0}
 return{**{k:q(v)for k,v in values.items()},'components':pieces}
def protective_case(p):
 mean,Qcdf,C,P,density=law(p['mode']);meanPhysical,Fp,_,_,_=law(p['physicalMode']);K,B,X=[F(p[k])for k in ['strike','discount','terminal']];put=B*P(K);stock=B*mean;initial=stock+put;financed=mean+P(K);pay=max(X,K);atom=Fp(K);limit=max(F(160),K);bins=[];plainTotal=F(0);insuredTotal=F(0)
 for j in range(12):
  lo=limit*F(j,12);hi=limit*F(j+1,12);plain=Fp(hi)-Fp(lo)
  # Integrate the unchanged continuous law only over payoff values strictly
  # above the floor; the entire lower tail belongs to the separate atom.
  insured=Fp(hi)-Fp(max(lo,K))if hi>K else F(0)
  plainTotal+=plain;insuredTotal+=insured;bins.append({'index':j,'low':q(lo),'high':q(hi),'plainMass':q(plain),'insuredContinuousMass':q(insured)})
 assert plainTotal==1 and insuredTotal+atom==1
 v={'stockPrice':stock,'putPremium':put,'totalInitialCost':initial,'terminalFinancedCost':financed,'putPayoff':max(K-X,0),'protectedPayoff':pay,'protectedProfit':pay-financed,'uninsuredFinancedProfit':X-mean,'terminalFloor':K,'floorProfit':K-financed,'physicalFloorAtom':atom,'plainProbabilityMass':plainTotal,'insuredContinuousMass':insuredTotal,'insuredTotalProbability':insuredTotal+atom,'payoffIdentityResidual':0}
 return{**{k:q(x)for k,x in v.items()},'bins':bins}
def triangular_rows():
 rows=[]
 
 for mode in [45,100,155]:
  for strike in [0,40,math.nextafter(40,math.inf),45,100,155,160,math.nextafter(160,math.inf),240]:
   for bandwidth in [0,math.ulp(0),1,5,30]:
    p={'mode':mode,'strike':strike,'discount':.95,'bandwidth':bandwidth};rows.append({'name':'densityRecovery','parameters':p,'expected':density_case(p)})
 for mode in [45,100,155]:
  for physicalMode in [45,100,155]:
   for face in [0,math.ulp(0),40,math.nextafter(40,math.inf),100,155,160,math.nextafter(160,math.inf),240]:
    for terminalAssets in [0,100,240]:
     p={'mode':mode,'physicalMode':physicalMode,'face':face,'discount':.95,'terminalAssets':terminalAssets};rows.append({'name':'claims','parameters':p,'expected':claims_case(p)})
 return rows

def cashflow_rows():
 rows=[]
 
 for kind in ['call','put']:
  for side in ['long','short']:
   for convention in ['nominal premium','terminal financed']:
    for K,C,X,B in [(100,8,120,.95),(100,0,100,1),(0,0,0,1),(0,math.ulp(0),0,.25),(10,40,0,1.5),(100,8,math.nextafter(100,0),1),(100,8,math.nextafter(100,math.inf),1)]:
     p={'kind':kind,'side':side,'convention':convention,'strike':K,'premium':C,'terminal':X,'discount':B};rows.append({'name':'payoff','parameters':p,'expected':payoff_case(p)})
 for B in [.25,.95,1,1.5]:
  for w in [-40,-math.ulp(0),0,math.ulp(0),40]:
   for K,X in [(0,0),(100,0),(100,100),(100,240)]:
    p={'spot':100,'strike':K,'discount':B,'timeValue':10,'callOffset':w,'terminal':X};rows.append({'name':'parity','parameters':p,'expected':parity_case(p)})
 for kind in ['call','put']:
  for ref in ['lower','upper']:
   for B,K in [(.25,0),(.95,100),(1,100),(1.5,100),(1.5,200)]:
    for offset in [-40,-math.ulp(0),0,math.ulp(0),40]:
     for X in [0,100,240]:
      p={'kind':kind,'spot':100,'strike':K,'discount':B,'reference':ref,'quoteOffset':offset,'terminal':X};rows.append({'name':'bounds','parameters':p,'expected':bounds_case(p)})
 for B in [.25,math.nextafter(1,0),1,math.nextafter(1,math.inf),1.5]:
  for S,K in [(100,0),(100,80),(100,100),(100,120)]:
   for f in [0,math.ulp(0),.2,1]:
    p={'spot':S,'strike':K,'discount':B,'dividendFraction':f};rows.append({'name':'earlyCall','parameters':p,'expected':early_case(p)})
 return rows

def positions_rows():
 rows=[]
 
 for mode in [45,100,155]:
  for K in [40,100,160]:
   for L,R in [(1,30),(15,25),(30,1)]:
    for reference in ['fair','chord']:
     for offset in [0,-math.ulp(0),math.ulp(0),1]:
      for X in [0,K,240]:
       p={'mode':mode,'strike':K,'leftWidth':L,'rightWidth':R,'discount':.95,'reference':reference,'quoteOffset':offset,'terminal':X};rows.append({'name':'strikeConvexity','parameters':p,'expected':convexity_case(p)})
 examples=[(0,[('call',80,1,24),('call',120,-1,5),('put',100,0,8)]),(0,[('put',120,1,23),('put',80,-1,4),('call',100,0,8)]),(0,[('call',100,1,8),('put',100,1,7),('call',120,0,3)]),(0,[('call',80,1,24),('call',100,-2,10),('call',120,1,5)]),(1,[('put',90,1,5),('call',100,0,8),('put',120,0,22)]),(0,[('call',100,1,8),('call',100,-1,8),('put',100,0,0)]),(math.ulp(0),[('put',0,-math.ulp(0),math.ulp(0)),('call',100,math.ulp(0),40),('call',100,0,0)])]
 for stock,legs in examples:
  for B in [.25,.95,1.5]:
   for X in [0,80,math.nextafter(100,0),100,math.nextafter(100,math.inf),120,300]:
    p={'stockUnits':stock,'spot':100,'terminal':X,'discount':B,'legs':[dict(zip(['kind','strike','units','premium'],leg))for leg in legs]};rows.append({'name':'strategies','parameters':p,'expected':strategies_case(p)})
 for mode in [45,100,155]:
  for physicalMode in [45,155]:
   for K in [0,math.ulp(0),40,math.nextafter(40,math.inf),90,160,240]:
    for B in [.25,1.5]:
     for X in [0,100,240]:
      p={'mode':mode,'physicalMode':physicalMode,'strike':K,'discount':B,'terminal':X};rows.append({'name':'protectivePut','parameters':p,'expected':protective_case(p)})
 return rows

rows=triangular_rows()+cashflow_rows()+positions_rows()
out={'scope':'Independent exact Fraction integration and cash-flow/holding arithmetic; no production imports. All physical rounding is exact Fraction-to-binary64. Mpmath100digits (recheck200) formats only final logarithmic magnitudes. Chosen risk-neutral/physical laws are not market observations.','cases':len(rows),'families':9,'rows':rows}
path=Path(os.environ.get('FIN_REFERENCE_OUTPUT',str(Path(__file__).parent/'fixtures/wave6-fin-reference.json')))
path.write_text(json.dumps(out,indent=2)+'\n')
print(len(rows),'independent FIN7 cases, nine families')
