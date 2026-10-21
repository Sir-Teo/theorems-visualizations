# Independent continuous-hybrid reference; run from the repository root with Python+SciPy.
import scipy, json
from scipy.integrate import solve_ivp
from pathlib import Path
D={'RS':[.02,.2,-65,8],'IB':[.02,.2,-55,4],'CH':[.02,.2,-50,2],'FS':[.1,.2,-65,2],'LTS':[.02,.25,-65,2]}
out={'provenance':{'solver':'SciPy '+scipy.__version__+' DOP853, rtol1e-11 atol1e-12, terminal upward event at30, splitinputat20','initial':[-65,'b*v0'],'T':400,'I':10,'primary':'https://www.izhikevich.org/publications/spikes.pdf','sourceSha256':'896710f3a25d3f5307a57d4cf13992514c87cd646b2e509ede6285f8724eb21d'},'presets':{}}
for name,(a,b,c,d) in D.items():
 y=[-65,-65*b];sp=[];reset=[]
 for start,end,I in [(0,20,0),(20,400,10)]:
  t=start
  while t<end-1e-10:
   def F(t,y):v,u=y;return [.04*v*v+5*v+140-u+I,a*(b*v-u)]
   def event(t,y):return y[0]-30
   event.terminal=True;event.direction=1
   R=solve_ivp(F,[t,end],y,method='DOP853',rtol=1e-11,atol=1e-12,max_step=.5,events=event)
   if len(R.t_events[0]):
    t=float(R.t_events[0][0]);u=float(R.y_events[0][0][1]);sp.append(t);reset.append([c,u+d]);y=[c,u+d]
   else:y=R.y[:,-1];t=end
 out['presets'][name]={'parameters':[a,b,c,d],'spikes':sp,'reset':reset,'final':[float(x) for x in y]}
Path('tests/fixtures/neuro-izhikevich-reference.json').write_text(json.dumps(out,indent=2)+'\n')
print({k:len(v['spikes']) for k,v in out['presets'].items()})
