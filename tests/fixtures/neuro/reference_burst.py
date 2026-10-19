"""Independent DOP853 solution of the explicit illustrative three-variable model.
Run from repository root; requires SciPy. Runtime JS verification reads the saved fixture.
"""
import json, math
from pathlib import Path
from scipy.integrate import solve_ivp
p={"C":20,"gL":2,"gK":8,"gCa":4,"VL":-60,"VK":-84,"VCa":120,"V1":-1.2,"V2":18,"phi":0.23,"V3":12,"V4":17.4,"gKCa":0.5,"mu":0.02,"eps":0.001,"I":50}
def f(t,y):
 V,w,z=y
 mi=.5*(1+math.tanh((V-p['V1'])/p['V2']))
 wi=.5*(1+math.tanh((V-p['V3'])/p['V4']))
 tau=1/(p['phi']*math.cosh((V-p['V3'])/(2*p['V4'])))
 ica=p['gCa']*mi*(V-p['VCa'])
 return [(p['I']-p['gL']*(V-p['VL'])-ica-p['gK']*w*(V-p['VK'])-p['gKCa']*z/(1+z)*(V-p['VK']))/p['C'],(wi-w)/tau,p['eps']*(-p['mu']*ica-z)]
def spike(t,y):return y[0]
spike.direction=1
y0=[-50,.5*(1+math.tanh((-50-p['V3'])/p['V4'])),.1]
r=solve_ivp(f,[0,20000],y0,method='DOP853',rtol=1e-10,atol=1e-11,max_step=.5,events=spike)
Path('tests/fixtures/neuro/independent-burst.json').write_text(json.dumps({'parameters':p,'spikes':r.t_events[0].tolist(),'final':r.y[:,-1].tolist()},indent=2)+'\n')
