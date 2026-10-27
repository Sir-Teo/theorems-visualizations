import importlib.util,sys,json,hashlib,itertools,math
from pathlib import Path
import mpmath as mp
p=Path(__file__).parent;spec=importlib.util.spec_from_file_location('independent_phil_reference',p/'wave6-phil-reference.shared.py');ref=importlib.util.module_from_spec(spec);spec.loader.exec_module(ref)
mp.mp.dps=int(sys.argv[1]);out=Path(sys.argv[2]);cases=[];seen=set()

def add(family,*args):
    key=json.dumps([family,args],separators=(',',':'))
    if key in seen:return
    seen.add(key);fn=getattr(ref,{'staticBook':'static_book','finiteAgents':'finite_agents','oldEvidence':'old_evidence'}.get(family,family));expected=fn(*args)
    cases.append(dict(family=family,args=args,expected=ref.encode(expected)))

small=math.ulp(0.0);below1=math.nextafter(1.,0.)
for chance,cred,n in itertools.product([0,small,.2,.5,.8,1],[0,.3,.5,1],[0,1,17,64]):add('interpretations',chance,cred,n)
for p0,s,f in itertools.product([0,small,1e-300,1e-12,.001,.1,.5,.9,below1,1],[0,small,1e-300,.01,.5,below1,1],[0,small,1e-300,.01,.5,below1,1]):add('bayes',p0,s,f)
for p0,s,f,n in itertools.product([0,.001,.5,1],[0,.99,1],[0,.01,1],[1,10000]):add('population',p0,s,f,n)
for a,b in itertools.product([-1,-small,0,small,.3,.5,.7,1,math.nextafter(1.,2.),2],repeat=2):add('staticBook',a,b)
weights=[[small,small,1,1],[0,0,0,0],[2,1,1,2],[1,1,1,1],[1,0,0,0],[0,1,0,0],[0,0,1,1],[small,small,0,0],[small,1,1,small],[1e6,small,0,0],[small,1e6,1e6,small],[.3,.7,.1,.9],[0,0,0,1]]
for w,q in itertools.product(weights,[0,small,.2,.5,.9,1,'conditional']):add('conditional',w,q)
for p0,s,f in itertools.product([0,small,.01,.3,.5,.99,below1,1],[0,small,.5,1],[0,small,.5,1]):add('confirmation',p0,s,f)
records=[[],[1],[0],[1,1],[1,0],[0,1],[1,1,0],[0,1]*8]
for p0,(s,f),record,copied in itertools.product([0,.2,1],[(0,0),(1,0),(.8,.1),(small,small)],records,[False,True]):add('sequence',p0,s,f,record,copied)
models=[([.2,.5,.8],[8,1,1],[1,1,8]),([.2,.5,.8],[8,0,1],[1,1,8]),([.5,.5,.8],[8,1,1],[1,8,1]),([0,1],[1,1],[1,2]),([0,0],[1,1],[1,2]),([small,.5,below1],[small,1,small],[1,small,1]),([.2,.8],[0,0],[1,1])]
for theta,a,b in models:
 for record in [[],[0],[1],[0,1],[0,1]*8,[0,1]*32]:add('finiteAgents',theta,a,b,record)
for theta,a,b in models[:3]:add('finiteAgents',theta,a,b,[0,1]*128)
for w,certain in itertools.product(weights,[False,True]):add('oldEvidence',w,certain)
for n in [1,2,3,10,100,1000]:
 for k,t in itertools.product(sorted(set([0,n//2,n-1,n])),[0,.5,.99,(n-1)/n,1]):add('lottery',n,k,t)
for n,q,mode in itertools.product([1,2,10,100,300,500],[0,1e-12,.5,.99,below1,1],['independent','shared','dispersed']):add('preface',n,q,mode)
for n,q,mode in itertools.product([1,2,10,500],[small],['independent','shared','dispersed']):add('preface',n,q,mode)
counts={f:sum(c['family']==f for c in cases) for f in sorted(set(c['family'] for c in cases))}
payload=dict(schemaVersion=1,scope='Complete independent expected objects from exact binary64-input Fraction truth-world enumeration and high-precision closed-form extreme binomial probabilities and logarithms. No JS provider is imported.',families=counts,cases=cases)
b=(json.dumps(payload,indent=2,ensure_ascii=False)+'\n').encode();out.write_bytes(b)
print(json.dumps(dict(status='GENERATED',digits=mp.mp.dps,cases=len(cases),families=counts,bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),output=str(out))))
