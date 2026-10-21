from scipy.integrate import solve_ivp
import math,json
from pathlib import Path

def encounter(D,Y,tol=2e-12):
 def f(t,s):
  x,y,u,w=s;r=math.hypot(x,y);return[u,w,2*w+3*x-3*x/r**3,-2*u-3*y/r**3]
 def stop(t,s):return s[1]+Y
 stop.terminal=True;stop.direction=-1
 s=[D,Y,0,-1.5*D]
 sol=solve_ivp(f,[0,4000],s,rtol=tol,atol=tol/100,method='DOP853',events=stop,max_step=.8)
 if not len(sol.t_events[0]):raise RuntimeError(('no passage',D,Y))
 x,y,u,w=sol.y[:,-1];energy=lambda x,y,u,w:(u*u+w*w)/2-1.5*x*x-3/math.hypot(x,y)
 return dict(kick=2*(w+2*x)-D,jacobi_error=energy(x,y,u,w)-energy(*s),steps=len(sol.t))
rows=[]
for D in[2.6,2.8,3,3.25,3.5,3.8,4.2,4.7,5.3,6,7,8.5,10,12,16,24,32]:
 a=encounter(D,500);b=encounter(D,1000);q=dict(D=D,Y500=a,Y1000=b,kick=2*b['kick']-a['kick']);rows.append(q);print(D,q['kick'],a['kick'],b['kick'],flush=True)
Path('docs/verification/astro-source-audit-rings-reference.json').write_text(json.dumps(dict(method='SciPy DOP853 independent rotating Hill ODE; finite-Y circular states, terminal y=-Y, 1/Y extrapolation500/1000; residual finite-boundary error not a rigorous bound',rows=rows),indent=2)+'\n')
