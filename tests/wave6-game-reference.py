"""Independent Fraction payoff evaluation; no production imports.
For a non-strict symmetric equilibrium every mutant ties against the incumbent.
Its secondary advantage is a quadratic with a double root at the incumbent;
recovering its coefficient exactly supplies an all-mixture certificate.
"""
from fractions import Fraction as F
from pathlib import Path
import math,json,os
import mpmath as mp
mp.mp.dps=int(os.environ.get('GAME_LOG_DIGITS','100'))
def q(x):
 x=F(x);v=float(x);return dict(value=v,sign=(x>0)-(x<0),logMagnitude=float(mp.log(abs(mp.mpf(x.numerator)/x.denominator)))if x else None,belowRange=bool(x)and v==0,aboveRange=not math.isfinite(v),approximate=False)
def u(A,p,r):
 return sum(F(weight)*F(opponent)*F(A[i][j])for i,weight in enumerate([p,1-p])for j,opponent in enumerate([r,1-r]))
def classification(A,p):
 own=u(A,p,p);nash=own>=u(A,F(0),p)and own>=u(A,F(1),p)
 strict=p==0 and own>u(A,F(1),p)or p==1 and own>u(A,F(0),p)
 ess=False
 if nash:
  if strict:ess=True
  else:
   other=F(0)if p!=0 else F(1)
   coefficient=(u(A,p,other)-u(A,other,other))/(p-other)**2
   ess=coefficient>0
 return dict(nash=nash,strictNash=strict,ess=ess)
def selection(A,p):
 A=[[F(v)for v in row]for row in A];p=F(p);first=u(A,F(1),p);second=u(A,F(0),p);mean=u(A,p,p);gap=first-second;velocity=p*(1-p)*gap
 g0=u(A,F(1),F(0))-u(A,F(0),F(0));g1=u(A,F(1),F(1))-u(A,F(0),F(1));slope=g1-g0
 if g0==g1==0:equilibria=dict(kind='whole unit interval',points=[],interval=dict(low=q(0),high=q(1)),essExists=False)
 else:
  candidates=[F(0),F(1)]
  if g0!=g1:
   root=-g0/(g1-g0)
   if 0<root<1:candidates.append(root)
  points=[dict(share=q(x),**classification(A,x))for x in sorted(candidates)if classification(A,x)['nash']]
  equilibria=dict(kind='finite points',points=points,interval=None,essExists=any(x['ess']for x in points))
 v=dict(firstPayoff=first,secondPayoff=second,meanPayoff=mean,payoffDifference=gap,shareVelocity=velocity,gradientAtZero=g0,gradientAtOne=g1,gradientSlope=slope)
 return{**{k:q(x)for k,x in v.items()},'selected':dict(**classification(A,p),rest=velocity==0),'equilibria':equilibria,'direction':'first strategy increases'if velocity>0 else'first strategy decreases'if velocity<0 else'rest point'}
def selection_case(p):return dict(parameters=p,**selection(p['matrix'],p['share']))
def invasion_case(p):
 A=p['matrix'];resident,mutant,fraction=[F(p[k])for k in ['resident','mutant','fraction']];mix=(1-fraction)*resident+fraction*mutant
 incumbent=u(A,resident,mix);invader=u(A,mutant,mix);gap=incumbent-invader;at0=u(A,resident,resident)-u(A,mutant,resident);at1=u(A,resident,mutant)-u(A,mutant,mutant)
 same=resident==mutant;rare=None if same else at0>0 or at0==0 and at1>0
 barrier=q(at0/(at0-at1)if at0>0 and at1<0 else 1)if rare else None
 v=dict(populationMix=mix,incumbentPayoff=incumbent,mutantPayoff=invader,incumbentAdvantage=gap,firstAdvantage=at0,secondAdvantage=at1,linearIdentityResidual=gap-((1-fraction)*at0+fraction*at1))
 assert v['linearIdentityResidual']==0
 return dict(parameters=p,**{k:q(x)for k,x in v.items()},residentClassification=classification(A,resident),distinctMutant=not same,rareInvasionResisted=rare,invasionBarrier=barrier,selectedOutcome='same strategy, no distinct mutant'if same else'incumbent earns more'if gap>0 else'mutant earns more'if gap<0 else'equal payoffs')
def hawk_case(p):
 V,C,x=[F(p[k])for k in ['resource','fightingCost','hawkShare']];A=[[(V-C)/2,V],[F(0),V/2]]
 return dict(parameters=p,matrix=[[q(v)for v in row]for row in A],**selection(A,x),unconstrainedHawkRatio=q(V/C),stableHawkShare=q(min(V/C,1)),regime='mixed equilibrium (boundary if resource is zero)'if V<C else'pure hawk with a nonhyperbolic boundary'if V==C else'strict pure hawk')
tiny=math.ulp(0);matrices=[[[0,0],[0,0]],[[2,0],[3,1]],[[4,0],[3,3]],[[0,4],[2,2]],[[2,0],[0,0]],[[0,0],[0,2]],[[tiny,0],[0,0]],[[-tiny,tiny],[tiny,-tiny]],[[50,-50],[-50,50]]]
rows=[]
for A in matrices:
 for share in [0,tiny,.25,math.nextafter(.5,0),.5,math.nextafter(.5,1),.75,math.nextafter(1,0),1]:
  p=dict(matrix=A,share=share);rows.append(dict(name='selection2',parameters=p,expected=selection_case(p)))
 for resident in [0,tiny,.5,math.nextafter(.5,1),1]:
  for mutant in [0,tiny,.5,math.nextafter(.5,1),1]:
   for fraction in [0,tiny,.125,1]:
    p=dict(matrix=A,resident=resident,mutant=mutant,fraction=fraction);rows.append(dict(name='invasion',parameters=p,expected=invasion_case(p)))
for resource in [0,tiny,1,4,8,20]:
 for fightingCost in [1,4,8,30]:
  for hawkShare in [0,tiny,.3,.5,1]:
   p=dict(resource=resource,fightingCost=fightingCost,hawkShare=hawkShare);rows.append(dict(name='hawkDove',parameters=p,expected=hawk_case(p)))
out=dict(scope='Initial GAME6 exact selection/invasion/Hawk families only; complete chapter/native/visual gates remain open. Independent Fraction expected-payoff sums and quadratic-coefficient ESS certificates, no production imports. Log magnitude formatting only uses100digits, rechecked200.',cases=len(rows),families=3,rows=rows)
path=Path(os.environ.get('GAME_REFERENCE_OUTPUT',str(Path(__file__).parent/'fixtures/wave6-game-reference.json')));path.write_text(json.dumps(out,indent=2)+'\n');print(len(rows),'independent GAME6 initial selection cases')
