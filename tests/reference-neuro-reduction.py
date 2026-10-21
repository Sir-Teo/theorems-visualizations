# Independent HH and explicit n-only closure reference. Run from repo root with Python + SciPy.
import json, math, scipy
import numpy as np
from scipy.integrate import solve_ivp
from pathlib import Path
def rates(V):
 def trap(x,d):return d if abs(x)<1e-10 else x/math.expm1(x/d)
 return [.1*trap(-(V+40),10),4*math.exp(-(V+65)/18),.07*math.exp(-(V+65)/20),1/(1+math.exp(-(V+35)/10)),.01*trap(-(V+55),10),.125*math.exp(-(V+65)/80)]
a,b,c,d,e,f=rates(-65); initial=[-65,a/(a+b),c/(c+d),e/(e+f)]
def solve(I,closure=None):
 def F(current):
  def field(t,y):
   V=y[0];am,bm,ah,bh,an,bn=rates(V)
   if closure is None:m,h,n=y[1:]
   else:n=y[1];m=am/(am+bm);h=closure[0]-closure[1]*n
   v=current-120*m**3*h*(V-50)-36*n**4*(V+77)-.3*(V+54.387)
   return [v,am*(1-m)-bm*m,ah*(1-h)-bh*h,an*(1-n)-bn*n] if closure is None else [v,an*(1-n)-bn*n]
  return field
 def event(t,y):return y[0]
 event.direction=1
 y=initial if closure is None else [initial[0],initial[3]];sp=[];ts=[];ys=[]
 for start,end,current in [(0,1,0),(1,60,I)]:
  q=solve_ivp(F(current),[start,end],y,method='DOP853',rtol=1e-11,atol=1e-12,max_step=.05,events=event,dense_output=True)
  grid=np.arange(round(start*10),round(end*10)+1)/10
  if start: grid=grid[1:]
  ts.extend(grid.tolist());ys.extend(q.sol(grid).T.tolist());sp.extend(q.t_events[0].tolist());y=q.y[:,-1]
 return {'t':ts,'y':ys,'spikes':sp,'final':y.tolist()}
out={'provenance':{'solver':'SciPy '+scipy.__version__+' DOP853, rtol1e-11 atol1e-12 max_step.05, step split exactly at1ms','sampleStep':.1,'T':60,'source':'https://neuronaldynamics.epfl.ch/online/Ch4.S2.html','scope':'Independently implemented HH rates and n-only closure, not the author rest-preserving projection.'},'cases':[]}
for I in [0,8,15,40]:
 q=solve(I);t0=max(0,(q['spikes'][0] if len(q['spikes']) else 5)-2);cloud=np.array([y for t,y in zip(q['t'],q['y']) if t>=t0]);n=cloud[:,3];h=cloud[:,2]
 fit=None
 if np.ptp(n)>=.002 and np.ptp(h)>=.002:
  slope,offset=np.polyfit(n,h,1);fit={'h0':float(offset),'k':float(-slope),'r2':float(np.corrcoef(n,h)[0,1]**2),'N':len(n)}
 modes={'fixed':[.89,1.1]}
 if fit:modes['fit']=[fit['h0'],fit['k']]
 out['cases'].append({'I':I,'fit':fit,'full':{'spikes':q['spikes'],'final':q['final']},'reduced':{name:{'closure':c,'spikes':(r:=solve(I,c))['spikes'],'final':r['final']} for name,c in modes.items()}})
Path('tests/fixtures/neuro-reduction-reference.json').write_text(json.dumps(out,indent=2)+'\n')
print({c['I']:{m:len(r['spikes']) for m,r in c['reduced'].items()} for c in out['cases']})
