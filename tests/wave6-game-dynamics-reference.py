"""Fraction instantaneous certificates and independent SciPy DOP853 paths.
Reference integrates all supported log masses with mean-payoff subtraction.
Production integrates one fewer log ratio with RK4 and step-halving.
"""
from fractions import Fraction as F
from pathlib import Path
import json,math,os
import numpy as np
from scipy.integrate import solve_ivp
import mpmath as mp
mp.mp.dps=int(os.environ.get('GAME_LOG_DIGITS','100'))
MAX_STEP=float(os.environ.get('GAME_DYNAMICS_MAX_STEP','.05'))
def q(x):
 x=F(x);v=float(x);return dict(value=v,sign=(x>0)-(x<0),logMagnitude=float(mp.log(abs(mp.mpf(x.numerator)/x.denominator)))if x else None,belowRange=bool(x)and v==0,aboveRange=not math.isfinite(v),approximate=False)
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def run(p):
 hawk='resource'in p;two='matrix'in p or hawk
 if hawk:
  V,C=F(p['resource']),F(p['fightingCost']);A=[[(V-C)/2,V],[F(0),V/2]];initial=[F(p['hawkShare']),1-F(p['hawkShare'])]
 elif two:A=[[F(x)for x in row]for row in p['matrix']];initial=[F(p['initialShare']),1-F(p['initialShare'])]
 else:
  win,loss=F(p['win']),F(p['loss']);game=p['game'];A=[[F(x)for x in row]for row in ([[0,-loss,win],[win,0,-loss],[-loss,win,0]]if game=='cyclic'else[[-1,0,0],[0,-1,0],[0,0,-1]]if game=='stable mixing'else[[1,0,0],[0,1,0],[0,0,1]])];first=F(p['initialFirst']);second=F(p['initialSecond'])if'secondOfRemainder'not in p else(1-first)*F(p['secondOfRemainder']);initial=[first,second,1-first-second]
 n=len(A);support=[i for i,x in enumerate(initial)if x>0];active=np.array([[float(A[i][j])for j in support]for i in support]);logs=np.array([float(mp.log(mp.mpf(initial[i].numerator)/initial[i].denominator))for i in support])
 def normalized(z):
  weights=np.exp(z-np.max(z));return weights/np.sum(weights)
 def derivative(t,z):
  x=normalized(z);payoffs=active@x;return payoffs-float(x@payoffs)
 times=[p['time']*j/(p['samples']-1)for j in range(p['samples'])]
 if p['time']:solution=solve_ivp(derivative,[0,p['time']],logs,t_eval=times,method='DOP853',rtol=2e-12,atol=1e-13,max_step=MAX_STEP);assert solution.success;zs=solution.y.T
 else:zs=np.array([logs for _ in times])
 path=[]
 for j,(t,z)in enumerate(zip(times,zs)):
  shares=np.zeros(n);shares[support]=normalized(z);logShares=[None]*n;offset=float(np.max(z)+np.log(np.sum(np.exp(z-np.max(z)))))
  for i,index in enumerate(support):logShares[index]=float(z[i]-offset)
  if j==0:shares=np.array([float(x)for x in initial])
  payoff=np.array([[float(x)for x in row]for row in A])@shares;mean=float(shares@payoff)
  row=dict(time=t,shares=shares.tolist(),logShares=logShares,payoffs=payoff.tolist(),meanPayoff=mean)
  if not two:row.update(relativeEntropy=-math.log(3)-sum(logShares)/3 if len(support)==3 else None,logProduct=sum(logShares)if len(support)==3 else None)
  path.append(row)
 out=dict(initialShares=[q(x)for x in initial],support=support,path=path)
 if not two:
  payoffs=[dot(row,initial)for row in A];mean=dot(initial,payoffs);velocity=[initial[i]*(payoffs[i]-mean)for i in range(3)];center=[F(1,3)]*3;interior=all(x>0 for x in initial);kl=mean-dot(center,payoffs);lp=sum(payoffs)-3*mean;square=dot(initial,initial)
  out.update(matrix=[[q(x)for x in row]for row in A],candidate=[q(x)for x in center],field=dict(payoffs=[q(x)for x in payoffs],meanPayoff=q(mean),velocity=[q(x)for x in velocity],conservationResidual=q(sum(velocity))),interior=interior,relativeEntropyDerivative=q(kl)if interior else None,logProductDerivative=q(lp)if interior else None,cyclicIdentityResidual=q(lp-(win-loss)*(3*square-1)/2)if game=='cyclic'and interior else None,squaredShareSum=q(square),centerESS=game=='stable mixing'or game=='cyclic'and win>loss,regime='strict interior ESS'if game=='stable mixing'else'interior Nash point is unstable'if game=='coordination'else'inward cyclic selection'if win>loss else'outward cyclic selection'if win<loss else'zero-sum cycles')
 return out
rows=[]
for game in ['cyclic','stable mixing','coordination']:
 for win,loss in [(1,1),(2,1),(1,2)]:
  for first,second in [(.6,.25),(1/3,1/3),(1,0),(0,.5),(.95,.025)]:
   p=dict(game=game,win=win,loss=loss,initialFirst=first,initialSecond=second,time=16,samples=41);rows.append(dict(name='replicator',parameters=p,expected=run(p)))
for first,second,time in [(math.ulp(0),math.ulp(0),30),(.6,.25,0),(.95,.025,30)]:
 p=dict(game='cyclic',win=.25,loss=4,initialFirst=first,initialSecond=second,time=time,samples=41);rows.append(dict(name='replicator',parameters=p,expected=run(p)))
for A in [[[0,4],[2,2]],[[4,0],[0,3]],[[0,0],[0,0]],[[50,-50],[-50,50]]]:
 for initialShare in [0,.2,.5,1]:
  p=dict(matrix=A,initialShare=initialShare,time=8,samples=41);rows.append(dict(name='replicatorTwo',parameters=p,expected=run(p)))
for first in [0,.6,1,math.ulp(0)]:
 for split in [0,.5,math.ulp(0)]:
  p=dict(game='cyclic',win=1,loss=1,initialFirst=first,initialSecond=.25,secondOfRemainder=split,time=16,samples=41);rows.append(dict(name='replicator',parameters=p,expected=run(p)))
for V,C in [(0,8),(4,8),(8,8),(12,8)]:
 for share in [0,.3,1]:
  p=dict(resource=V,fightingCost=C,hawkShare=share,time=8,samples=41);rows.append(dict(name='hawkPath',parameters=p,expected=run(p)))
out=dict(scope='88independent Fraction field certificates and SciPy DOP853 log-mass paths, max step.05; repeat with.025checks integrator stability. Numerical paths use explicit tolerances, never exact classifications. Includes exact conditional initial mixtures and original-factor Hawk matrices.',cases=len(rows),rows=rows)
Path(os.environ.get('GAME_DYNAMICS_OUTPUT',str(Path(__file__).parent/'fixtures/wave6-game-dynamics-reference.json'))).write_text(json.dumps(out,indent=2)+'\n');print(len(rows),'independent dynamics cases')
