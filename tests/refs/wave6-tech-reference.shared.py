"""Independent TECH7 truth: Fraction mass/fit identities, high-precision geometry,
quadrature for indicated work, and augmented-matrix exponential for the governor.
No JS model or generated JS values are imported.
"""
from fractions import Fraction as F
import math
import mpmath as mp

def Q(x):return F(x)
def M(x):
    f=F(x);return mp.mpf(f.numerator)/f.denominator
def defaults(given,**kwargs):
    kwargs.update(given or {});return kwargs
def output_params(p):return {k:M(v) for k,v in p.items()}
def encode(x):
    if isinstance(x,bool) or x is None or isinstance(x,str):return x
    if isinstance(x,int):return x
    if isinstance(x,F):x=M(x)
    if isinstance(x,mp.mpf):return mp.nstr(x,50)
    if isinstance(x,float):return mp.nstr(M(x),50)
    if isinstance(x,list) or isinstance(x,tuple):return [encode(v) for v in x]
    if isinstance(x,dict):return {k:encode(v) for k,v in x.items()}
    raise TypeError(type(x))

def steamDevice(given=None):
    p=defaults(given,ambient=101.325,condensed=10,steam=200,area=.2,stroke=1);a,c,s,A,L=map(Q,p.values());d=a-c
    return dict(**output_params(p),pressureHead=d/Q(9.81),dischargeHead=(s-a)/Q(9.81),suctionPossible=d>0,dischargePossible=s>a,force=d*A,work=d*A*L,displacedVolume=A*L)
def heat_budget(volume,mass,deltaT,reheat):return dict(latent=volume*Q(.6)*2257,reheat=mass*Q(.46)*deltaT*reheat)
def newcomen(given=None):
    p=defaults(given,area=.4,stroke=1.5,condensed=12,armRatio=1.5,pumpArea=.01,head=40,cylinderMass=300,deltaT=60);A,L,c,r,a,h,m,d=map(Q,p.values());force=(Q(101.325)-c)*A;load=Q(9.81)*h*a;stroke=r*L;heat=heat_budget(A*L,m,d,1);total=sum(heat.values());work=force*L
    return dict(**output_params(p),force=force,pumpForce=force/r,pumpLoad=load,pumpStroke=stroke,pumpVolume=a*stroke,work=work,pumpWork=load*stroke,forceMargin=force/r-load,loadFeasible=force/r>=load,heat=heat,input=total,indicatedFraction=work/total)
def coke(given=None):
    p=defaults(given,iron=1000,carbonBudget=500,cokeCarbon=.85,charcoalCarbon=.75,cokePrice=.2,charcoalPrice=.5,charcoalYield=.25,woodYield=10000);iron,budget,cc,hc,cp,hp,y,w=map(Q,p.values());Fe,O,C=map(Q,[55.845,15.999,12.011]);moles=iron/(2*Fe);ore=moles*(2*Fe+3*O);co=moles*3*(C+O);co2=moles*3*(C+2*O);carbon=moles*3*C;cm=budget/cc;hm=budget/hc;wood=hm/y
    return dict(**output_params(p),ore=ore,co=co,co2=co2,oxygenRemoved=ore-iron,carbonInCO=carbon,cokeMass=cm,charcoalMass=hm,cokeCost=cm*cp,charcoalCost=hm*hp,woodMass=wood,hypotheticalArea=wood/w,carbonBudgetMeetsSinglePassCO=budget>=carbon,massResidual=ore+co-iron-co2)
def boring(given=None):
    p=defaults(given,length=1.5,diameter=.12,load=1000,modulus=180);L,d,P,E=map(M,p.values());J=mp.pi*d**4/64;EI=E*10**9*J
    def a(x):return P*x*x*(3*L-x)/(6*EI)*1000
    def b(x):
        z=min(x,L-x);return P*z*(3*L*L-4*z*z)/(48*EI)*1000
    return dict(**output_params(p),inertia=J,cantilever=a(L),supported=b(L/2),curves=[dict(x=L*i/40,cantilever=a(L*i/40),supported=b(L*i/40)) for i in range(41)])
def condenser(given=None):
    p=defaults(given,volume=.6,cylinderMass=300,deltaT=60,reheatFraction=.08,condensed=12);v,m,d,f,c=map(Q,p.values());inside=heat_budget(v,m,d,1);outside=heat_budget(v,m,d,f);a=sum(inside.values());b=sum(outside.values());work=(Q(101.325)-c)*v;saving=(a-b)/a
    return dict(**output_params(p),inside=inside,separate=outside,work=work,insideInput=a,separateInput=b,chosenSaving=saving,savingPositive=saving>0,savingUnderflow=saving>0 and float(saving)==0,insideFraction=work/a,separateFraction=work/b)
def sunPlanet(carrier=1.2,oscillation=.18):
    a,b=map(M,[carrier,oscillation]);planet=b*mp.sin(a);sun=2*a-planet
    return dict(carrier=a,oscillation=b,planet=planet,sun=sun,centre=[2*mp.cos(a),2*mp.sin(a)],sunTurns=sun/(2*mp.pi),carrierTurns=a/(2*mp.pi),constraintResidual=mp.mpf(0))
def governor(given=None):
    p=defaults(given,gain=1.5,lag=.8,load=.3,time=4);g,l,d,t=map(M,p.values());A=mp.matrix([[-1,1,-d],[-g/l,-1/l,0],[0,0,0]]);initial=mp.matrix([0,0,1]);step=mp.expm(A/4);state=initial.copy();trace=[]
    for i in range(81):
        trace.append(dict(time=mp.mpf(i)/4,speed=state[0],throttle=state[1]));state=step*state
    # A second-order throttle response at a subnormal time is far smaller than
    # the identity entries of exp(A*t); fixed working precision loses it.
    digits=max(mp.mp.dps,100+int(3*abs(mp.log10(t)))) if 0<t<mp.mpf('1e-20') else mp.mp.dps
    with mp.workdps(digits):current=mp.expm(A*t)*initial
    return dict(**output_params(p),current=dict(time=t,speed=current[0],throttle=current[1]),trace=trace,steadySpeed=-d/(1+g),steadyThrottle=g*d/(1+g),discriminant=(1-1/l)**2/4-g/l)
def governorCone(speed=1):
    w=Q(speed);gravity=Q(.2)
    if w*w<gravity:return dict(speed=M(w),length=1,gravity=M(gravity),status='no-conical-equilibrium',cosine=None,radius=None,height=None,angle=None)
    cosine=gravity/(w*w);radius=mp.sqrt(M(1-cosine*cosine));return dict(speed=M(w),length=1,gravity=M(gravity),status='conical-branch',cosine=cosine,radius=radius,height=cosine,angle=mp.acos(M(cosine)))
def parallelLink(theta=.4):
    # Independent direct equal-radius circle intersection. Extra precision resolves
    # fifth-order cancellation even for the smallest positive binary64 angle.
    digits=max(mp.mp.dps,90+int(5*abs(math.log10(abs(theta))))) if theta else mp.mp.dps
    with mp.workdps(digits):
        t=M(theta);P=mp.matrix([-2+2*mp.cos(t),1+2*mp.sin(t)]);O=mp.matrix([2,-1]);D=O-P;d=mp.sqrt(sum(x*x for x in D));mid=(P+O)/2;normal=mp.matrix([-D[1],D[0]])/d;Q0=mid-mp.sqrt(4-d*d/4)*normal;midpoint=(P+Q0)/2;x=midpoint[0];norm=lambda v:mp.sqrt(sum(z*z for z in v))
        return dict(theta=t,fixed=[[-2,1],[2,-1]],P=list(P),Q=list(Q0),M=list(midpoint),deviation=x,deviationSign=0 if theta==0 else 1 if theta>0 else -1,deviationUnderflow=theta!=0 and float(x)==0,beamOnlyDeviation=P[0],arms=[norm(P-mp.matrix([-2,1])),norm(Q0-O)],coupler=norm(Q0-P))
def indicator(given=None):
    p=defaults(given,supply=200,back=20,swept=1,clearance=.1,cutoff=.3,exponent=1.1);P,b,S,c,k,n=map(M,p.values());v0=c*S;v1=(c+k)*S;v2=(c+1)*S;admission=Q(p['supply'])*Q(p['cutoff'])*Q(p['swept'])
    # Independent numerical integration, not the JS exprel closed form.
    expansion=mp.quad(lambda v:P*(v1/v)**n,[v1,v2]);exhaust=Q(p['back'])*Q(p['swept']);work=M(admission)+expansion-M(exhaust)
    outward=[[v0+(v1-v0)*i/20,P] for i in range(21)]+[[v1*(v2/v1)**(mp.mpf(i)/60),P*(v2/v1)**(-n*mp.mpf(i)/60)] for i in range(1,61)]
    return dict(**output_params(p),vmin=v0,vcut=v1,vmax=v2,admission=admission,expansion=expansion,exhaust=exhaust,work=work,meanPressure=work/S,endPressure=P*(v1/v2)**n,positiveWork=work>0,outward=outward,loop=outward+[[v2,b],[v0,b],[v0,P]])
def highPressure(given=None):
    p=defaults(given,difference=200,power=10,frequency=1,radius=.4,thickness=.015);d,P,f,r,t=map(Q,p.values());outer=r+t
    return dict(**output_params(p),volume=P/(d*f),work=P/f,thinHoop=d/1000*r/t,lameHoop=d/1000*(outer**2+r*r)/(outer**2-r*r),thicknessRatio=t/r,thinRegime=t/r<=Q(.05))
def carnot(given=None):
    p=defaults(given,hot=600,cold=300,heat=100,utilization=.6);h,c,q,u=map(Q,p.values())
    if h<c:return dict(**output_params(p),status='reversed-reservoirs',bound=None,efficiency=None,work=None,rejected=None,entropy=None,workPositive=False,entropyPositive=False)
    bound=1-c/h;efficiency=u*bound;work=q*efficiency;rejected=q-work;entropy=rejected/c-q/h
    return dict(**output_params(p),status='equal-reservoirs' if h==c else 'heat-engine',bound=bound,efficiency=efficiency,work=work,rejected=rejected,entropy=entropy,workPositive=work>0,entropyPositive=entropy>0)
def puddling(given=None):
    p=defaults(given,carbonFraction=.035,carbonRate=.6,ironRate=.03,time=4);f,c,k,t=map(M,p.values())
    def at(t):
        carbon=1000*f*mp.exp(-c*t);iron=1000*(1-f)*mp.exp(-k*t);return dict(time=t,carbon=carbon,iron=iron,total=carbon+iron,fraction=carbon/(carbon+iron))
    return dict(**output_params(p),current=at(t),trace=[at(mp.mpf(i)/6) for i in range(61)],concentrationTrend='constant' if f==0 or c==k else 'rising' if k>c else 'falling')
def rolling(given=None):
    p=defaults(given,thickness=20,reduction=.5,width=100,length=1000);t,r,w,L=map(Q,p.values());h=t*(1-r);length=L/(1-r)
    return dict(**output_params(p),finalThickness=h,finalLength=length,initialVolume=t*w*L,finalVolume=h*w*length,logStrain=-mp.log(M(1-r)))
def bessemer(given=None):
    p=defaults(given,carbonFraction=.035,removed=.8,phosphorusFraction=.005,chosenHeat=10,chosenLoss=40);c,r,p0,h,l=map(Q,p.values());initial=1000*c;phosphorus=1000*p0;iron=1000-initial-phosphorus;burn=initial*r;carbon=initial-burn;total=1000-burn;heat=burn*h
    return dict(**output_params(p),initialCarbon=initial,initialPhosphorus=phosphorus,iron=iron,carbonRemoved=burn,carbon=carbon,total=total,finalCarbonFraction=carbon/total,finalPhosphorusFraction=phosphorus/total,heat=heat,netHeat=heat-l)
def threads(given=None):
    p=defaults(given,lead=4,driver=20,driven=40,starts=1,turns=3,amplitude=.02,wavelength=50,slope=.001);l,a,b,n,t,A,L,s=map(Q,p.values());ratio=a/b;advance=l*ratio;pitch=advance/n;ideal=t*advance;error=M(A)*mp.sin(2*mp.pi*M(ideal)/M(L))+M(s*ideal)
    return dict(**output_params(p),ratio=ratio,advance=advance,pitch=pitch,leadScrewTurns=t*ratio,ideal=ideal,error=error,actual=M(ideal)+error)
def uniform_cdf(x,h,s):
    a,b=max(h,s),min(h,s)
    if a==0:return F(x>=0)
    if b==0:return min(F(1),max(F(0),(x+a)/(2*a)))
    if x<=-a-b:return F(0)
    if x>=a+b:return F(1)
    if x<-a+b:return (x+a+b)**2/(8*a*b)
    if x>a-b:return 1-(a+b-x)**2/(8*a*b)
    return (x+a)/(2*a)
def interchangeability(given=None):
    p=defaults(given,clearance=.04,holeWidth=.015,shaftWidth=.015,bias=0,minimum=.02,maximum=.06,count=64);c,h,s,b,lo,hi,n=map(Q,p.values());centre=c+b;atom=h==0 and s==0;probability=F(lo<=centre<=hi) if atom else uniform_cdf(hi-centre,h,s)-uniform_cdf(lo-centre,h,s);state=0x71c03a9d;rows=[]
    for i in range(int(n)):
        state=(1664525*state+1013904223)%2**32;u=F(2*state+1,2**33);state=(1664525*state+1013904223)%2**32;v=F(2*state+1,2**33);hole=(2*u-1)*h;shaft=(2*v-1)*s;gap=centre+hole-shaft;rows.append(dict(hole=hole,shaft=shaft,gap=gap,fit=lo<=gap<=hi))
    passed=sum(x['fit'] for x in rows)
    return dict(**output_params(p),centre=centre,support=[centre-h-s,centre+h+s],atom=atom,probability=probability,probabilityPositive=probability>0,probabilityBelowOne=probability<1,rows=rows,passed=passed,batchFraction=F(passed,int(n)) if n else None)
