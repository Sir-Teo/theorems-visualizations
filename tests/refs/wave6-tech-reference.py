import importlib.util,sys,json,itertools,math,hashlib
from pathlib import Path
import mpmath as mp
p=Path(__file__).parent;spec=importlib.util.spec_from_file_location('independent_tech_reference',p/'wave6-tech-reference.shared.py');ref=importlib.util.module_from_spec(spec);spec.loader.exec_module(ref)
mp.mp.dps=int(sys.argv[1]);out=Path(sys.argv[2]);cases=[];seen=set()
def add(family,*args):
    key=json.dumps([family,args],sort_keys=True)
    if key in seen:return
    seen.add(key);cases.append(dict(family=family,args=args,expected=ref.encode(getattr(ref,family)(*args))))
families=['steamDevice','newcomen','coke','boring','condenser','sunPlanet','governor','parallelLink','indicator','highPressure','carnot','puddling','rolling','bessemer','threads','interchangeability']
for family in families:add(family)
for a,c,s in itertools.product([50,101.325,120],[0,10,101.325,150],[50,101.325,1000]):add('steamDevice',dict(ambient=a,condensed=c,steam=s))
for area,ratio,head in itertools.product([.05,.4,1],[.5,1.5,3],[0,40,150]):add('newcomen',dict(area=area,armRatio=ratio,head=head))
for budget,cp,hp in itertools.product([0,100,500,2000],[0,.2,2],[0,.5,2]):add('coke',dict(carbonBudget=budget,cokePrice=cp,charcoalPrice=hp))
for length,diameter,load in itertools.product([.5,1.5,3],[.05,.12,.3],[0,1000,3000]):add('boring',dict(length=length,diameter=diameter,load=load))
for delta,fraction,mass in itertools.product([0,60,80],[0,.08,1],[20,300,1000]):add('condenser',dict(deltaT=delta,reheatFraction=fraction,cylinderMass=mass))
for carrier,amplitude in itertools.product([0,.1,1.2,math.pi,2*math.pi,4*math.pi],[0,.18,.3]):add('sunPlanet',carrier,amplitude)
for gain,lag,load in itertools.product([0,.125,1.5,5],[.1,.8,1,2,4],[0,.3,.5]):add('governor',dict(gain=gain,lag=lag,load=load))
for gain in [math.nextafter(.125,0),.125,math.nextafter(.125,1)]:
    for time in [0,1e-12,1e-6,4,20]:add('governor',dict(gain=gain,lag=2,time=time))
for theta in [-.55,-.4,-.1,-.01,-1e-4,-1e-12,-1e-60,-math.ulp(0),0,math.ulp(0),1e-60,1e-12,1e-4,.01,.1,.4,.55]:add('parallelLink',theta)
for cutoff,exponent,back in itertools.product([0,.3,1],[.7,1,math.nextafter(1,0),math.nextafter(1,2),1.5],[0,20,200,900]):add('indicator',dict(cutoff=cutoff,exponent=exponent,back=back))
for pressure,radius,thickness in itertools.product([20,200,1000],[.1,.4,1],[.001,.015,.1]):add('highPressure',dict(difference=pressure,radius=radius,thickness=thickness))
for hot,cold,u in itertools.product([200,300,600,1500],[100,300,600,1200],[0,.6,1]):add('carnot',dict(hot=hot,cold=cold,utilization=u))
for hot,cold,heat,u in [(600,300,0,1),(600,300,100,math.ulp(0)),(600,300,math.ulp(0),.6)]:add('carnot',dict(hot=hot,cold=cold,heat=heat,utilization=u))
for carbon,kc,kfe in itertools.product([0,.035,.06],[0,.03,.6,1],[0,.03,1]):add('puddling',dict(carbonFraction=carbon,carbonRate=kc,ironRate=kfe))
for reduction,thickness,length in itertools.product([0,.5,.9],[5,20,50],[100,1000,2000]):add('rolling',dict(reduction=reduction,thickness=thickness,length=length))
for c,r,p0 in itertools.product([0,.035,.06],[0,.8,1],[0,.005,.02]):add('bessemer',dict(carbonFraction=c,removed=r,phosphorusFraction=p0))
for driver,driven,starts in itertools.product([12,20,37,80],[12,40,73,80],[1,2,4]):add('threads',dict(driver=driver,driven=driven,starts=starts))
for h,s,bias in itertools.product([0,.015,.03,.1],[0,.015,.03,.1],[-.1,0,.02,.1]):add('interchangeability',dict(holeWidth=h,shaftWidth=s,bias=bias,count=17))
for c,lo,hi in [(0,0,0),(.04,.04,.04),(.04,math.nextafter(.04,0),.04),(.04,math.nextafter(.04,1),.06),(.04,.02,math.nextafter(.04,0)),(.04,.04,.06)]:
    for h,s in [(0,0),(0,math.ulp(0)),(math.ulp(0),0),(math.ulp(0),math.ulp(0)),(.015,0),(0,.015)]:add('interchangeability',dict(clearance=c,minimum=lo,maximum=hi,holeWidth=h,shaftWidth=s,count=3))
for count in [0,1,144]:add('interchangeability',dict(count=count))
families.append('governorCone')
add('governorCone')
for speed in [0,.1,.4,math.nextafter(math.sqrt(.2),0),math.sqrt(.2),math.nextafter(math.sqrt(.2),1),.5,.75,1,1.5,2]:add('governorCone',speed)
tiny=math.ulp(0)
for family,args in [
 ('boring',[dict(load=tiny)]),('newcomen',[dict(head=tiny)]),('coke',[dict(carbonBudget=tiny,cokePrice=tiny,charcoalPrice=tiny)]),('condenser',[dict(deltaT=tiny)]),('sunPlanet',[tiny,.18]),('governor',[dict(load=tiny,time=4)]),('governor',[dict(time=tiny)]),('puddling',[dict(carbonFraction=tiny,carbonRate=1,time=10)]),('bessemer',[dict(carbonFraction=tiny,removed=tiny)]),('threads',[dict(turns=tiny)]),('threads',[dict(amplitude=tiny,slope=tiny)]),('rolling',[dict(reduction=tiny)]),('indicator',[dict(cutoff=tiny)]),('indicator',[dict(back=tiny)])]:add(family,*args)
counts={f:sum(c['family']==f for c in cases) for f in families};payload=dict(schemaVersion=1,scope='Complete independent expected objects; exact binary64-input Fraction identities and fit/atoms, high-precision direct-circle linkage, numerical work quadrature and augmented-matrix governor exponential. Constants are declared rounded teaching constants, not measured historical data.',families=counts,cases=cases)
b=(json.dumps(payload,indent=2,ensure_ascii=False)+'\n').encode();out.write_bytes(b)
print(json.dumps(dict(status='GENERATED',digits=mp.mp.dps,cases=len(cases),families=counts,bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),output=str(out))))
