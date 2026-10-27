"""Independent Fraction payoff evaluation; no production imports.
For a non-strict symmetric equilibrium every mutant ties against the incumbent.
Its secondary advantage is a quadratic with a double root at the incumbent;
recovering its coefficient exactly supplies an all-mixture certificate.
"""
from fractions import Fraction as F
from itertools import product
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
def wardrop(flows,costs):
 least=min(costs);gaps=[c-least for c in costs];residual=sum(f*g for f,g in zip(flows,gaps))
 return gaps,residual,all(not f or not g for f,g in zip(flows,gaps))
def kkt(x,limit,derivative):return limit==0 or(derivative>=0 if x==0 else derivative<=0 if x==limit else derivative==0)
def braess_case(p):
 r,k,t=[F(p[s])for s in ['demand','shortcutCost','selectedShortcutShare']]
 def flows(z):return[(r-z)/2,(r-z)/2,z]
 def costs(z):
  upper,lower,bridge=flows(z);first=upper+bridge;last=lower+bridge
  return[first+1,last+1,first+last+k]
 def cost(z):
  f=flows(z);c=costs(z);return sum(a*b for a,b in zip(f,c))
 candidates=[F(0),r];cross=2*(1-k)-r
 if 0<=cross<=r:candidates.append(cross)
 zEq=next(z for z in candidates if wardrop(flows(z),costs(z))[2]);optCandidates=[F(0),r];stationary=1-k-r
 if 0<=stationary<=r:optCandidates.append(stationary)
 zOpt=min(optCandidates,key=cost);chosen=r*t;eqGaps,eqResidual,verified=wardrop(flows(zEq),costs(zEq));_,chosenResidual,_=wardrop(flows(chosen),costs(chosen));without=cost(0);eqCost=cost(zEq);optCost=cost(zOpt)
 # Recover the derivative from independent total resource-cost evaluations.
 c0,c1,c2=[cost(F(z))for z in [0,1,2]];quadratic=(c2-2*c1+c0)/2;linear=c1-c0-quadratic;derivative=2*quadratic*zOpt+linear
 v=dict(withoutEachFlow=r/2,withoutRouteLatency=r/2+1,withoutTotalCost=without,equilibriumShortcutFlow=zEq,equilibriumOuterEach=(r-zEq)/2,optimalShortcutFlow=zOpt,optimalOuterEach=(r-zOpt)/2,selectedShortcutFlow=chosen,selectedOuterEach=(r-chosen)/2,equilibriumTotalCost=eqCost,optimalTotalCost=optCost,selectedTotalCost=cost(chosen),totalCostChange=eqCost-without,flowConservationResidual=sum(flows(zEq))-r,wardropResidual=eqResidual,selectedWardropResidual=chosenResidual,optimalDerivative=derivative,optimalityGap=eqCost-optCost)
 return dict(parameters=p,**{k:q(v)for k,v in v.items()},equilibriumFlows=[q(x)for x in flows(zEq)],equilibriumRouteLatencies=[q(x)for x in costs(zEq)],equilibriumRouteGaps=[q(x)for x in eqGaps],selectedFlows=[q(x)for x in flows(chosen)],selectedRouteLatencies=[q(x)for x in costs(chosen)],withoutMeanLatency=q(without/r)if r else None,equilibriumMeanLatency=q(eqCost/r)if r else None,optimalMeanLatency=q(optCost/r)if r else None,priceOfAnarchy=q(eqCost/optCost)if optCost else None,wardropVerified=verified,optimumVerified=kkt(zOpt,r,derivative),shortcutComparison='no traffic; mean latency and ratio undefined'if not r else'shortcut worsens equilibrium travel time'if eqCost>without else'shortcut improves equilibrium travel time'if eqCost<without else'shortcut leaves equilibrium travel time unchanged')
def pigou_case(p):
 a,b,c,t=[F(p[k])for k in ['slope','intercept','constantCost','selectedFlow']]
 def latency(x):return[a*x+b,c]
 def cost(x):return x*latency(x)[0]+(1-x)*c
 candidates=[F(0),F(1)];tie=not a and b==c
 if a and 0<(c-b)/a<1:candidates.append((c-b)/a)
 eq=F(1,2)if tie else next(x for x in candidates if wardrop([x,1-x],latency(x))[2]);optCandidates=[F(0),F(1)]
 if a and 0<(c-b)/(2*a)<1:optCandidates.append((c-b)/(2*a))
 opt=F(1,2)if tie else min(optCandidates,key=cost);eqGaps,eqResidual,verified=wardrop([eq,1-eq],latency(eq));_,chosenResidual,_=wardrop([t,1-t],latency(t));eqCost=cost(eq);optCost=cost(opt);derivative=2*a*opt+b-c
 v=dict(equilibriumVariableFlow=eq,equilibriumConstantFlow=1-eq,optimalVariableFlow=opt,optimalConstantFlow=1-opt,equilibriumTotalCost=eqCost,optimalTotalCost=optCost,selectedTotalCost=cost(t),optimalDerivative=derivative,wardropResidual=eqResidual,selectedWardropResidual=chosenResidual,optimalityGap=eqCost-optCost,affineBoundSlack=4*optCost-3*eqCost)
 assert v['affineBoundSlack']>=0
 def point(x):return dict(kind='whole unit interval',low=q(0),high=q(1))if tie else dict(kind='single point',point=q(x))
 return dict(parameters=p,**{k:q(x)for k,x in v.items()},equilibriumRouteLatencies=[q(x)for x in latency(eq)],equilibriumRouteGaps=[q(x)for x in eqGaps],selectedRouteLatencies=[q(x)for x in latency(t)],equilibriumSet=point(eq),optimalSet=point(opt),priceOfAnarchy=q(eqCost/optCost)if optCost else None,wardropVerified=verified,optimumVerified=kkt(opt,1,derivative),ratioStatus='defined for positive optimal cost'if optCost else'zero optimal cost; ratio undefined')
POTENTIAL_BASES={'staircase base':[[0,-2,-3],[1,2,0],[-1,3,4]],'matching base':[[0,-1,-4],[-1,0,-1],[-4,-1,0]],'two peaks base':[[4,0,1],[0,3,0],[1,0,4]],'flat base':[[0,0,0],[0,0,0],[0,0,0]]}
def potential_case(p):
 coupling,rb,cb,offset=[F(p[k])for k in ['coupling','rowBias','columnBias','opponentOffset']];base=POTENTIAL_BASES[p['landscape']]
 def phi(r,c):return F(base[r][c])+coupling*r*c+rb*r+cb*c
 def utilities(r,c):return[phi(r,c)+offset*c,phi(r,c)-offset*r]
 inventory=[];rawMoves={}
 for r in range(3):
  for c in range(3):
   moves=[];raw=[]
   for player in ['row','column']:
    for target in range(3):
     if target==(r if player=='row'else c):continue
     nr,nc=(target,c)if player=='row'else(r,target);i=0 if player=='row'else 1;gain=utilities(nr,nc)[i]-utilities(r,c)[i];delta=phi(nr,nc)-phi(r,c);assert gain==delta
     move=dict(player=player,targetRow=nr,targetColumn=nc,payoffChange=q(gain),potentialChange=q(delta),identityResidual=q(gain-delta),improves=gain>0);moves.append(move);raw.append((gain,player,nr,nc,move))
   rawMoves[r,c]=raw;inventory.append(dict(row=r,column=c,potential=q(phi(r,c)),payoffs=[q(v)for v in utilities(r,c)],nash=all(gain<=0 for gain,*_ in raw),deviations=moves))
 def entry(r,c,move=None):return dict(row=r,column=c,potential=q(phi(r,c)),payoffs=[q(v)for v in utilities(r,c)],playerMoved=move['player']if move else None,payoffGain=move['payoffChange']if move else q(0),potentialGain=move['potentialChange']if move else q(0),identityResidual=move['identityResidual']if move else q(0))
 position=(p['startRow'],p['startColumn']);path=[entry(*position)];seen={position}
 while True:
  available=[move for move in rawMoves[position]if move[0]>0]
  if not available:break
  if p['priority']!='largest gain':
   desired='row'if p['priority']=='row first'else'column';preferred=[m for m in available if m[1]==desired]
   if preferred:available=preferred
  gain,player,nr,nc,move=min(available,key=lambda m:(-m[0],0 if m[1]=='row'else 1,m[2],m[3]));position=(nr,nc);assert position not in seen;seen.add(position);path.append(entry(nr,nc,move))
 displayed=min(p['step'],len(path)-1);current=path[displayed];terminal=inventory[3*position[0]+position[1]];maximum=max(phi(r,c)for r in range(3)for c in range(3));points=lambda rows:[dict(row=row['row'],column=row['column'])for row in rows]
 return dict(parameters=p,inventory=inventory,path=path,displayedStep=displayed,current=current,haltedAtDisplayedState=inventory[3*current['row']+current['column']]['nash'],terminal=terminal,equilibria=points([row for row in inventory if row['nash']]),potentialMaximum=q(maximum),globalMaxima=[dict(row=r,column=c)for r in range(3)for c in range(3)if phi(r,c)==maximum],allDeviationIdentitiesVerified=True,pathStrictlyIncreases=all(row['potentialGain']['sign']>0 for row in path[1:]))
def congestion_case(p):
 N=p['players'];a,c,k=[F(p[s])for s in ['slope','constantLatency','shortcutLatency']];routes=[[0,1],[2,3],[0,4,3]]
 def values(counts):
  loads=[sum(counts[i]for i,route in enumerate(routes)if edge in route)for edge in range(5)]
  def latency(edge,n):return a*n if edge in [0,3]else k if edge==4 else c
  latencies=[latency(j,n)for j,n in enumerate(loads)];routeCosts=[sum(latencies[j]for j in route)for route in routes]
  potential=sum(sum(latency(j,n)for n in range(1,load+1))for j,load in enumerate(loads));total=sum(n*cost for n,cost in zip(counts,routeCosts))
  return loads,latencies,routeCosts,potential,total
 inventory=[];rawMoves={}
 for counts in product(range(N+1),repeat=3):
  if sum(counts)!=N:continue
  loads,latencies,costs,potential,total=values(counts);moves=[];raw=[]
  for origin in range(3):
   if not counts[origin]:continue
   for target in range(3):
    if origin==target:continue
    nextCounts=list(counts);nextCounts[origin]-=1;nextCounts[target]+=1;_,_,afterCosts,afterPotential,_=values(nextCounts);delta=afterCosts[target]-costs[origin];deltaPhi=afterPotential-potential;assert delta==deltaPhi
    move=dict(from_=origin,to=target,targetCounts=nextCounts,costBefore=q(costs[origin]),costAfter=q(afterCosts[target]),ownCostChange=q(delta),potentialChange=q(deltaPhi),identityResidual=q(delta-deltaPhi),improves=delta<0);move['from']=move.pop('from_');moves.append(move);raw.append((delta,origin,target,move))
  rawMoves[counts]=raw;inventory.append(dict(counts=list(counts),resourceLoads=loads,resourceLatencies=[q(x)for x in latencies],routeCosts=[q(x)for x in costs],potential=q(potential),totalCost=q(total),meanCost=q(total/N),nash=all(m[0]>=0 for m in raw),deviations=moves))
 lookup={tuple(row['counts']):row for row in inventory}
 def entry(counts,move=None,before=None):
  row=lookup[tuple(counts)];ownChange=values(counts)[2][move['to']]-values(before)[2][move['from']]if move else F(0);potentialChange=values(counts)[3]-values(before)[3]if move else F(0)
  v=dict(counts=list(counts),potential=row['potential'],totalCost=row['totalCost'],meanCost=row['meanCost'],to=move['to']if move else None,ownCostDecrease=q(-ownChange),potentialDecrease=q(-potentialChange),identityResidual=move['identityResidual']if move else q(0));v['from']=move['from']if move else None
  return v
 upper=min(N,p['initialUpperRequests']);lower=min(N-upper,p['initialLowerRequests']);initial=[upper,lower,N-upper-lower];position=tuple(initial);path=[entry(position)];seen={position}
 while True:
  available=[m for m in rawMoves[position]if m[0]<0]
  if not available:break
  delta,origin,target,move=available[0]if p['priority']=='first available'else min(available,key=lambda m:(m[0],m[1],m[2]));before=position;position=tuple(move['targetCounts']);assert position not in seen;seen.add(position);path.append(entry(position,move,before))
 displayed=min(p['step'],len(path)-1);current=path[displayed];minimumCost=min(values(row['counts'])[4]for row in inventory);minimumPotential=min(values(row['counts'])[3]for row in inventory)
 return dict(parameters=p,initialCounts=initial,inventory=inventory,path=path,displayedStep=displayed,current=current,currentState=lookup[tuple(current['counts'])],terminal=lookup[position],equilibria=[row['counts']for row in inventory if row['nash']],minimumCost=q(minimumCost),costMinimizers=[row['counts']for row in inventory if values(row['counts'])[4]==minimumCost],minimumPotential=q(minimumPotential),potentialMinimizers=[row['counts']for row in inventory if values(row['counts'])[3]==minimumPotential],currentExcessCost=q(values(current['counts'])[4]-minimumCost),allDeviationIdentitiesVerified=True,pathStrictlyDecreases=all(row['potentialDecrease']['sign']>0 for row in path[1:]))
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
for demand in [0,tiny,.25,.5,math.nextafter(1,0),1,math.nextafter(1,2),1.5,2,3]:
 for shortcutCost in [0,tiny,.25,.5,1,2]:
  for selectedShortcutShare in [0,tiny,.5,1]:
   p=dict(demand=demand,shortcutCost=shortcutCost,selectedShortcutShare=selectedShortcutShare);rows.append(dict(name='braess',parameters=p,expected=braess_case(p)))
for slope in [0,tiny,.25,1,4]:
 for intercept in [0,tiny,.5,2]:
  for constantCost in [.25,1,3]:
   for selectedFlow in [0,tiny,.5,1]:
    p=dict(slope=slope,intercept=intercept,constantCost=constantCost,selectedFlow=selectedFlow);rows.append(dict(name='pigou',parameters=p,expected=pigou_case(p)))
p=dict(slope=1,intercept=0,constantCost=1,selectedFlow=.75);rows.append(dict(name='pigou',parameters=p,expected=pigou_case(p)))
p=dict(slope=0,intercept=1,constantCost=1,selectedFlow=.75);rows.append(dict(name='pigou',parameters=p,expected=pigou_case(p)))
for landscape in POTENTIAL_BASES:
 for coupling in [0,tiny,-1]:
  for priority in ['row first','column first','largest gain']:
   for startRow,startColumn in [(0,0),(2,0),(0,2)]:
    for step in [0,8]:
     p=dict(landscape=landscape,coupling=coupling,rowBias=0,columnBias=0,opponentOffset=1,startRow=startRow,startColumn=startColumn,step=step,priority=priority);rows.append(dict(name='potentialGame',parameters=p,expected=potential_case(p)))
for step in [0,8]:
 p=dict(landscape='flat base',coupling=-tiny,rowBias=tiny,columnBias=-tiny,opponentOffset=-2,startRow=1,startColumn=1,step=step,priority='largest gain');rows.append(dict(name='potentialGame',parameters=p,expected=potential_case(p)))
profiles=[(0,0,0),(tiny,0,0),(1,3,0),(1,3.25,0),(2,1,3)]
for players in [1,4]:
 for slope,constantLatency,shortcutLatency in profiles:
  for initialUpperRequests,initialLowerRequests in [(0,0),(8,0),(2,2)]:
   for priority in ['largest decrease','first available']:
    for step in [0,44]:
     p=dict(players=players,slope=slope,constantLatency=constantLatency,shortcutLatency=shortcutLatency,initialUpperRequests=initialUpperRequests,initialLowerRequests=initialLowerRequests,step=step,priority=priority);rows.append(dict(name='atomicCongestion',parameters=p,expected=congestion_case(p)))
for players in [2,8]:
 for slope,constantLatency,shortcutLatency in [(0,0,0),(1,3.25,0)]:
  for priority in ['largest decrease','first available']:
   for step in [0,44]:
    p=dict(players=players,slope=slope,constantLatency=constantLatency,shortcutLatency=shortcutLatency,initialUpperRequests=2,initialLowerRequests=2,step=step,priority=priority);rows.append(dict(name='atomicCongestion',parameters=p,expected=congestion_case(p)))
out=dict(scope='Initial GAME6 selection/invasion/Hawk, exact nonatomic routing, finite potential and atomic congestion families; complete chapter/native/visual gates remain open. Independent Fraction expected-payoff sums, quadratic-coefficient ESS certificates, resource-cost/used-route equilibrium evaluation, exact candidate optimization and exhaustive finite deviations; Rosenthal potential independently summed resource-by-resource and user-by-user, no production imports. Log magnitude formatting only uses100digits, rechecked200.',cases=len(rows),families=7,rows=rows)
path=Path(os.environ.get('GAME_REFERENCE_OUTPUT',str(Path(__file__).parent/'fixtures/wave6-game-reference.json')));path.write_text(json.dumps(out,indent=2)+'\n');print(len(rows),'independent GAME6 initial selection cases')
