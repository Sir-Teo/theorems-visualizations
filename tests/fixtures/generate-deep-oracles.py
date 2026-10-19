"""Optional source-verification oracle generator; requires NumPy/SciPy. Not used by npm test."""
import json,math,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
import numpy as np
from decimal import Decimal,localcontext
from scipy.integrate import solve_ivp
p=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import{makeResidualField}from'./content/deep/residual-ode-source.shared.js';console.log(JSON.stringify(makeResidualField().parameters))"],cwd=ROOT));A=np.array(p['W1']);b=np.array(p['bb']);wt=np.array(p['wt']);B=np.array(p['W2'])
cases=[]
for point in [[-1.3,.6],[0.,0.],[1.8,-.8],[.2,1.4],[-2.,-1.]]:
 for amp in [.5,1.1,3.]:
  def field(t,x):return amp*B@np.tanh(A@x+wt*(t-.5)+b)
  sol=solve_ivp(field,[0,1],point,method='DOP853',rtol=2e-13,atol=2e-14)
  assert sol.success
  cases.append({'point':point,'amplitude':amp,'endpoint':sol.y[:,-1].tolist()})
optim=[]
with localcontext() as c:
 c.prec=60
 for aa,ee in [(1,'.01'),(50,'.1'),(400,'.5')]:
  a=Decimal(aa);eta=Decimal(ee);eps=Decimal('1e-8')
  for kind in ['gd','ada','rms','adam','adamUncorrected']:
   x=y=Decimal(1);m=[Decimal(0)]*2;s=[Decimal(0)]*2;acc=[Decimal(0)]*2
   records=[]
   for k in range(1,101):
    g=[a*x,y];delta=[]
    for j in range(2):
     if kind=='gd':d=Decimal('.9')/a*g[j]
     elif kind=='ada':
      acc[j]+=g[j]**2;d=eta*g[j]/(acc[j].sqrt()+eps)
     elif kind=='rms':
      s[j]=Decimal('.9')*s[j]+Decimal('.1')*g[j]**2;d=eta*g[j]/(s[j].sqrt()+eps)
     else:
      m[j]=Decimal('.9')*m[j]+Decimal('.1')*g[j];s[j]=Decimal('.999')*s[j]+Decimal('.001')*g[j]**2
      c1=1-Decimal('.9')**k if kind=='adam' else Decimal(1);c2=1-Decimal('.999')**k if kind=='adam' else Decimal(1)
      d=eta*(m[j]/c1)/((s[j]/c2).sqrt()+eps)
     delta.append(d)
    x-=delta[0];y-=delta[1]
    if k in [1,2,10,100]:records.append({'step':k,'point':[float(x),float(y)]})
   optim.append({'curvature':aa,'eta':float(eta),'kind':kind,'records':records})
json.dump({'provenance':{'ode':'SciPy 1.17.0 solve_ivp DOP853 rtol=2e-13 atol=2e-14; independent NumPy field evaluation from deterministic production weights','optimizer':'Python Decimal precision60, independent vector recurrence; epsilon outside square root'},'residualODE':cases,'adaptiveQuadratic':optim},open(ROOT/'tests/fixtures/deep-source-oracles.json','w'),indent=2)
