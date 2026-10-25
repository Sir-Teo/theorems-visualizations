"""Independent ENERGY6 references: original binary64 arguments, exact Fraction
energy/charge balances, high-precision thermodynamics and independent work
integrals. No JavaScript model import. Exact SI constants. Geometry is numerical.
"""
from pathlib import Path
from fractions import Fraction as F
import itertools,json,math,random,argparse
import mpmath as mp
p=argparse.ArgumentParser();p.add_argument('--output',type=Path,default=Path(__file__).parent/'fixtures'/'wave6-energy-reference.json');args=p.parse_args();rng=random.Random(630126);tiny=math.nextafter(0.,1.);families={}
KB=F(1380649,10**29);E=F(1602176634,10**28);NA=F(602214076000000000000000);R=KB*NA;FAR=E*NA;G=F(980665,100000)
def m(x):
 if isinstance(x,F):return mp.mpf(x.numerator)/x.denominator
 return mp.mpf(x)
def f(x):
 if isinstance(x,F):
  try:return float(x)
  except OverflowError:return 'negative overflow'if x<0 else'positive overflow'
 if not x:return 0.
 sign,mant,exp,bits=x._mpf_;q=F((-1 if sign else 1)*int(mant));q=q*(1<<exp)if exp>=0 else q/F(1<<(-exp));return f(q)
def q(x):
 sign=(x>0)-(x<0)
 return {'value':f(x),'sign':int(sign),'logMagnitude':None if not sign else f(mp.log(abs(m(x))))}
def work(a):return mp.workdps(1800 if any(isinstance(x,(float,int))and x and abs(x)<1e-100 for x in a.values())else 90)
def publish(name,cases,fn):
 rows=[]
 for a in cases:
  with work(a):rows.append({'args':a,'expect':fn(**a)})
 families[name]=rows;print(name,len(rows),flush=True)
def grid(values):
 keys=list(values);return [dict(zip(keys,v))for v in itertools.product(*(values[k]for k in keys))]
def randoms(values,n):return [{k:rng.uniform(*v)for k,v in values.items()}for _ in range(n)]
def storage(capacity=100,chargePower=25,dischargePower=25,etaCharge=.9,etaDischarge=.9,progress=.5):
 c,pc,pd,ec,ed,u=map(F,[capacity,chargePower,dischargePower,etaCharge,etaDischarge,progress]);charging=u<1;phase='idle'if c==0 or u==2 else'charge'if charging else'discharge';stored=c*u if u<=1 else c*(2-u);input=c*min(u,1)/ec;out=c*ed*max(u-1,0);lc=input*(1-ec);ld=c*max(u-1,0)*(1-ed);tc=c/ec/pc;td=c*ed/pd;t=u*tc if u<=1 else tc+(u-1)*td
 z=dict(stored=q(stored),input=q(input),output=q(out),chargeLoss=q(lc),dischargeLoss=q(ld),time=q(t),chargeTime=q(tc),dischargeTime=q(td),totalTime=q(tc+td),roundTrip=q(ec*ed),completedCycleRatio=q(out/input)if u==2 and c else None,residual=q(F(0)),inputPower=float(pc)if c and charging and u<2 else 0.,outputPower=float(pd)if c and not charging and u<2 else 0.,phase=phase);assert input==stored+out+lc+ld;return z
cases=grid({'capacity':[0.,500.],'chargePower':[1.,200.],'dischargePower':[1.,200.],'etaCharge':[.5,1.],'etaDischarge':[.5,1.],'progress':[0.,.5,1.,1.5,2.]})
cases+=randoms({'capacity':(1,500),'chargePower':(1,200),'dischargePower':(1,200),'etaCharge':(.5,1),'etaDischarge':(.5,1),'progress':(0,2)},24)
cases += [dict(capacity=c,progress=u)for c,u in [(100.,tiny),(tiny,.5),(tiny,tiny),(100.,math.nextafter(1.,0.)),(100.,math.nextafter(1.,2.)),(100.,math.nextafter(2.,0.))]]
publish('storage',cases,storage)
def nernst(fraction=.5,temperature=298.15,electrons=1,standardVoltage=1,activityRatio=1):
 x,T,n,V0,g=map(m,[fraction,temperature,electrons,standardVoltage,activityRatio]);Q=g*(1-x)/x;l=mp.log(Q);thermal=m(KB)*T/(n*m(E));shift=-thermal*l;V=V0+shift;return dict(quotient=q(Q),logQuotient=q(l),thermal=q(thermal),shift=q(shift),voltage=q(V),reactionFreeEnergy=q(-n*m(FAR)*V),freeEnergyShift=q(-n*m(FAR)*shift),standardFreeEnergy=q(-n*m(FAR)*V0))
cases=grid({'fraction':[.01,.5,.99],'temperature':[200.,400.],'electrons':[1,2],'standardVoltage':[.5,2.],'activityRatio':[.2,1.,5.]});cases += [dict(fraction=x,electrons=n)for x,n in itertools.product([math.nextafter(.5,0.),math.nextafter(.5,1.)],[1,2])]
# Adjacent original inputs around the logarithm's small-argument and near-one branches.
for delta in [1e-6,-1e-6,1.000001e-6,-1.000001e-6,9.99999e-7,-9.99999e-7,.5,-.5]:
 center=1/(2+delta)
 cases +=[dict(fraction=x,electrons=n)for x,n in itertools.product([math.nextafter(center,0.),center,math.nextafter(center,1.)],[1,2])]
publish('nernst',cases,nernst)
def battery(voltage=3.7,resistance=.1,fraction=.25,operation='discharge'):
 V0,r,u=map(F,[voltage,resistance,fraction]);I=u*V0/r*(1 if operation=='discharge'else-1);V=V0-I*r;chemical=V0*I;terminal=V*I;heat=r*I*I;source=chemical if operation=='discharge'else-terminal;useful=terminal if operation=='discharge'else-chemical;return dict(current=q(I),drop=q(I*r),terminal=q(V),chemicalPower=q(chemical),terminalPower=q(terminal),heat=q(heat),sourcePower=q(source),usefulPower=q(useful),efficiency=q(useful/source)if source else None,lossFraction=q(heat/source)if source else None,shortCircuitCurrent=q(V0/r),maximumPower=q(V0*V0/(4*r)),residual=q(F(0)))
cases=grid({'voltage':[2.,5.],'resistance':[.02,1.],'fraction':[0.,.5,1.],'operation':['charge','discharge']});cases += [dict(fraction=u,operation=op)for u,op in itertools.product([tiny,math.nextafter(.5,0.),math.nextafter(.5,1.),math.nextafter(1.,0.)],['charge','discharge'])]
publish('battery',cases,battery)
def peukert(capacityAh=100,referenceHours=20,current=10,exponent=1.2,preset='adjustable'):
 if preset=='manual example':capacityAh,referenceHours=100,20;k=mp.log(4)/mp.log(3)
 else:k=m(exponent)
 C,H,I=map(m,[capacityAh,referenceHours,current]);ref=C/H;t=C/I if k==1 else H*(ref/I)**k;return dict(referenceCurrent=q(ref),duration=q(t),availableCharge=q(I*t),constantCapacityDuration=q(C/I),capacityRatio=q(I*t/C))
cases=grid({'capacityAh':[10.,200.],'referenceHours':[1.,20.],'current':[.5,100.],'exponent':[1.,1.2,1.5]});cases +=[dict(preset='manual example',current=I)for I in [.5,5.,15.,100.]];cases +=[dict(current=I,exponent=k)for I,k in itertools.product([math.nextafter(5.,0.),5.,math.nextafter(5.,10.)],[1.,math.nextafter(1.,2.),1.5])]
for ratio in [1+1e-6,1-1e-6]:
 center=5/ratio
 cases +=[dict(current=x,exponent=k)for x,k in itertools.product([math.nextafter(center,0.),center,math.nextafter(center,math.inf)],[1.,math.nextafter(1.,2.),1.5])]
publish('peukert',cases,peukert)
def soc(initial=.5,rate=.5,operation='discharge',hours=.5,meterGain=1.01,meterBias=.1):
 x,r,t,g,b=map(F,[initial,rate,hours,meterGain,meterBias]);r*=0 if operation=='rest'else 1 if operation=='discharge'else-1;stop=x/r if r>0 else(1-x)/(-r)if r<0 else None;active=t if stop is None else min(t,stop);I=100*r if stop is None or t<stop else F(0);true=x-r*active;withdrawn=100*r*active;measured=g*withdrawn+b*t;estimate=x-measured/100;ocv=3+F(6,5)*true;V=ocv-I/F(500);ve=(V-3)/F(6,5);phase='rest'if not r else'cutoff'if stop is not None and t>=stop else operation
 return dict(phase=phase,capacityAh=100,activeHours=q(active),stopTime=q(stop)if stop is not None else None,timePastCutoff=q(t-stop)if stop is not None else None,current=q(I),meterReading=q(g*I+b),withdrawnCharge=q(withdrawn),meterCharge=q(measured),stateOfCharge=q(true),remainingCharge=q(100*true),estimate=q(estimate),meterError=q(estimate-true),openVoltage=q(ocv),terminal=q(V),voltageEstimate=q(ve),voltageError=q(ve-true))
cases=grid({'initial':[0.,.5,1.],'rate':[0.,2.],'operation':['charge','discharge','rest'],'hours':[0.,4.],'meterGain':[.98,1.02],'meterBias':[-.5,.5]});cases += [dict(rate=r,hours=t,meterBias=b)for r,t,b in [(tiny,4.,.1),(.5,tiny,tiny),(0.,tiny,tiny),(.5,math.nextafter(1.,0.),.1),(.5,1.,.1),(.5,math.nextafter(1.,2.),.1)]]
publish('soc',cases,soc)
def life(depth=.5,exponent=1.5,referenceCycles=1000,capacity=1,progress=.5):
 d,b,N,E0,u=map(m,[depth,exponent,referenceCycles,capacity,progress]);ratio=mp.exp((1-b)*mp.log(d));Nlife=N*ratio/d;fade=u/5;energy=E0*d*Nlife*(u-u*u/10);return dict(life=q(Nlife),cycles=q(Nlife*u),fade=q(fade),capacityRetention=q(1-fade),throughput=q(energy),lifetimeEnergy=q(mp.mpf(9)/10*E0*N*ratio),baselineEnergy=q(mp.mpf(9)/10*E0*N),throughputRatio=q(ratio),throughputBenefit=q(mp.expm1((1-b)*mp.log(d))),exponentOffset=q(b-1))
cases=grid({'depth':[.05,1.],'exponent':[.5,1.,2.5],'referenceCycles':[100.,5000.],'capacity':[.1,10.],'progress':[0.,1.]});cases += [dict(depth=d,exponent=b,progress=u)for d,b,u in [(0.5,1.,tiny),(.5,math.nextafter(1.,0.),1.),(.5,math.nextafter(1.,2.),1.),(.05,2.5,tiny)]]
publish('cycleLife',cases,life)
def hydro(volume=100000,areaKm2=.1,baseHead=100,flow=20,etaPump=.9,etaTurbine=.85,progress=.5,operation='pump'):
 V,A,H,Q,ep,et,u=map(F,[volume,areaKm2,baseHead,flow,etaPump,etaTurbine,progress]);A*=1000000;moved=V*u;upper=moved if operation=='pump'else V-moved;lower=V-upper;head=H+2*upper/A;energy=lambda v:1000*G*(H*v+v*v/A);total=energy(V);stored=energy(upper);removed=total-stored;input=(stored if operation=='pump'else total)/ep;output=F(0)if operation=='pump'else et*removed;lp=input*(1-ep);lt=F(0)if operation=='pump'else removed*(1-et);P=1000*G*Q*head if V and u<1 else F(0);pp=P/ep if operation=='pump'else F(0);pt=P*et if operation=='release'else F(0)
 assert input==stored+output+lp+lt
 return dict(area=q(A),movedVolume=q(moved),upperVolume=q(upper),lowerVolume=q(lower),head=q(head),time=q(moved/Q),legDuration=q(V/Q),stored=q(stored),capacity=q(total),input=q(input),output=q(output),pumpLoss=q(lp),turbineLoss=q(lt),pumpPower=q(pp),turbinePower=q(pt),roundTrip=q(ep*et),residual=q(F(0)),storedKWh=q(stored/3600000),inputKWh=q(input/3600000),outputKWh=q(output/3600000))
cases=grid({'volume':[0.,1e6],'areaKm2':[.02,1.],'baseHead':[50.,500.],'flow':[1.,100.],'etaPump':[.5,1.],'etaTurbine':[.5,1.],'progress':[0.,1.],'operation':['pump','release']});cases +=[dict(volume=v,progress=u,operation=op)for v,u,op in [(tiny,.5,'pump'),(tiny,tiny,'pump'),(1e6,tiny,'release'),(1e6,math.nextafter(1.,0.),'release')]]
publish('hydro',cases,hydro)
def air(moles=1,temperature=300,ratio=4,gamma=1.4,progress=.5,thermal='reject heat'):
 n,T,r,g,u=map(m,[moles,temperature,ratio,gamma,progress]);L=mp.log(r);b=g-1;scale=n*m(R)*T;V0=scale/100000;s=u*L
 def integrate(z,extra=False):
  if not z:return mp.mpf(0)
  return scale*z*mp.quad((lambda w:mp.expm1(b*z*w))if extra else(lambda w:mp.exp(b*z*w)),[0,1])
 wi=scale*L;wa=integrate(L);lost=integrate(L,True);partial=integrate(s);extra=integrate(s,True);keep=thermal=='retain heat';out=wa if keep else wi;cool=mp.mpf(0)if keep else wa;ambient=mp.mpf(0)if keep else wi
 return dict(initialVolume=q(V0),compressedVolume=q(V0/r),volume=q(V0*mp.exp(-s)),volumeDrop=q(-V0*mp.expm1(-s)),pressure=q(100000*mp.exp(g*s)),pressureRise=q(100000*mp.expm1(g*s)),temperature=q(T*mp.exp(b*s)),temperatureRise=q(T*mp.expm1(b*s)),isothermalWork=q(wi),adiabaticWork=q(wa),partialWork=q(partial),partialExcessWork=q(extra),lostWork=q(mp.mpf(0)if keep else lost),recoveredWork=q(out),coolingHeat=q(cool),ambientHeat=q(ambient),workEfficiency=q(out/wa)if wa else None,residual=q(F(0)))
cases=grid({'moles':[.1,10.],'temperature':[200.,400.],'ratio':[1.,10.],'gamma':[1.,5/3],'progress':[0.,1.],'thermal':['reject heat','retain heat']});cases += [dict(ratio=r,gamma=g,progress=u)for r,g,u in [(math.nextafter(1.,2.),1.4,1.),(math.nextafter(1.,2.),math.nextafter(1.,2.),1.),(4.,1.4,tiny),(4.,1.,.5),(4.,1.0000000000000002,tiny)]]
for center in [1e-6/(1.4*math.log(4)),1e-6/(.4*math.log(4)),1e-6/math.log(4),.5/(.4*math.log(4))]:
 cases +=[dict(progress=x)for x in [math.nextafter(center,0.),center,math.nextafter(center,1.)]]
center=math.exp(.5/(1.4-1))
cases +=[dict(ratio=x)for x in [math.nextafter(center,0.),center,math.nextafter(center,math.inf)]]
publish('air',cases,air)
def fly(mass=10,radius=.5,density=7800,strengthMPa=500,safety=2,fraction=.6,time=.01):
 M,r,rho,stress,N,u,t=map(F,[mass,radius,density,strengthMPa,safety,fraction,time]);allow=stress*10**6/N;limit2=allow/(rho*r*r);w2=limit2*u*u;inertia=M*r*r;energy=inertia*w2/2;w=mp.sqrt(m(w2));limit=mp.sqrt(m(limit2));theta=limit*m(u)*m(t);pos=[q(m(r)*mp.cos(theta)),q(m(r)*mp.sin(theta))]
 return dict(allowableStress=q(allow),stress=q(allow*u*u),stressMargin=q(allow*(1-u*u)),omega=q(w),limitingOmega=q(limit),omegaSquared=q(w2),inertia=q(inertia),energy=q(energy),specificEnergy=q(energy/M),limitingSpecificEnergy=q(allow/(2*rho)),angle=q(theta),position=pos,energyWh=q(energy/3600),specificWh=q(energy/M/3600))
cases=grid({'mass':[1.,100.],'radius':[.2,2.],'density':[1000.,9000.],'strengthMPa':[100.,2000.],'safety':[1.,5.],'fraction':[0.,1.],'time':[0.,.02]});cases += [dict(fraction=u,time=t)for u,t in [(tiny,.01),(tiny,tiny),(.6,tiny),(math.nextafter(1.,0.),.02)]]
limit=math.sqrt((500e6/2)/(7800*.5*.5))
for key,center in [('fraction',1e-6/(limit*.01)),('time',1e-6/(limit*.6))]:
 cases +=[{key:x}for x in [math.nextafter(center,0.),center,math.nextafter(center,math.inf)]]
publish('flywheel',cases,fly)
def cap(capacitance=500,voltage=2.7,cutoff=.5,current=10,progress=.5):
 C,V0,k,I,u=map(F,[capacitance,voltage,cutoff,current,progress]);Vmin=k*V0;T=C*(V0-Vmin)/I;t=u*T;v=V0-I*t/C;initial=C*V0*V0/2;stored=C*v*v/2;extracted=I*(V0*t-I*t*t/(2*C));cut=C*Vmin*Vmin/2;usable=C*(V0-Vmin)*(V0+Vmin)/2
 assert initial==stored+extracted
 return dict(voltage=q(v),voltageDrop=q(V0-v),minimumVoltage=q(Vmin),initialEnergy=q(initial),stored=q(stored),extracted=q(extracted),cutoffEnergy=q(cut),usableEnergy=q(usable),duration=q(T),time=q(t),current=float(I)if u<1 else 0.,power=q(I*v if u<1 else F(0)),leftCutoffPower=q(I*Vmin),extractedWh=q(extracted/3600),usableWh=q(usable/3600),residual=q(F(0)))
cases=grid({'capacitance':[10.,2000.],'voltage':[1.,5.],'cutoff':[0.,.9],'current':[.1,20.],'progress':[0.,1.]});cases += [dict(progress=u,cutoff=k)for u,k in [(tiny,.5),(tiny,tiny),(1.,tiny),(math.nextafter(1.,0.),.9)]]
publish('capacitor',cases,cap)
def hydrogen(input=1,electrolyser=.7,compression=3,retention=.99,fuelCell=.5,batteryEfficiency=.9):
 e,el,c,r,fc,eb=map(F,[input,electrolyser,compression,retention,fuelCell,batteryEfficiency]);h=F(3333,100);mass=e*el/(h+c*el);ein=e*h/(h+c*el);comp=mass*c;chemical=mass*h;retained=chemical*r;out=retained*fc;lossEl=ein-chemical;leak=chemical*(1-r);lossFC=retained*(1-fc);potential=el*r*fc*h/(h+c*el);assert e==out+lossEl+comp+leak+lossFC
 return dict(producedMass=q(mass),retainedMass=q(mass*r),electrolysisInput=q(ein),compressionInput=q(comp),hydrogenEnergy=q(chemical),retainedChemicalEnergy=q(retained),output=q(out),electrolysisLoss=q(lossEl),compressionLoss=q(comp),leakLoss=q(leak),fuelCellLoss=q(lossFC),potentialRoundTrip=q(potential),actualRoundTrip=q(out/e)if e else None,batteryOutput=q(e*eb),residual=q(F(0)))
cases=grid({'input':[0.,10.],'electrolyser':[0.,1.],'compression':[0.,10.],'retention':[0.,1.],'fuelCell':[0.,1.],'batteryEfficiency':[0.,1.]});cases +=[dict(input=e,electrolyser=el,compression=c,retention=r,fuelCell=fc)for e,el,c,r,fc in [(tiny,.7,3.,.99,.5),(tiny,tiny,3.,1.,1.),(1.,tiny,tiny,tiny,tiny),(1.,1.,tiny,1.,1.),(1.,1.,0.,math.nextafter(1.,0.),math.nextafter(1.,0.))]]
publish('hydrogen',cases,hydrogen)
def ragone(power=100,energy=10):
 P,E0=map(F,[power,energy]);spec=[('battery example',100,500),('flywheel example',20,2000),('supercapacitor example',5,5000)];return dict(power=float(P),energy=float(E0),duration=q(3600*E0/P),devices=[dict(name=name,energy=e,power=p,qualifies=P<=p and E0<=e,powerMargin=q(F(p)-P),energyMargin=q(F(e)-E0),ratingDuration=q(F(3600*e,p)))for name,e,p in spec])
cases=grid({'power':[.1,10000.],'energy':[.01,1000.]});cases +=[dict(power=P,energy=E0)for p,e in [(500.,100.),(2000.,20.),(5000.,5.)]for P in [math.nextafter(p,0.),p,math.nextafter(p,math.inf)]for E0 in [math.nextafter(e,0.),e,math.nextafter(e,math.inf)]]
publish('ragone',cases,ragone)
args.output.write_text(json.dumps({'method':'Exact original binary64 Fraction energy/charge balances; independent high-precision work integrals, thermodynamics and rotor geometry; exact SI constants and dyadic output rounding','precision':'90 digits ordinary,1800 digits for extreme original inputs','families':families},sort_keys=True,indent=2,allow_nan=False)+'\n');print('TOTAL',sum(map(len,families.values())),flush=True)
