"""Independent 80-digit quadrature, held-target recurrence and direct DFT reference."""
import json
import mpmath as mp
mp.mp.dps=80
D=mp.mpf
rad=mp.pi/180
def elements(t,on):
    e=D('.028')+D('.011')*mp.cos(2*mp.pi*t/405)+D('.0083')*mp.cos(2*mp.pi*t/124+1)+D('.0077')*mp.cos(2*mp.pi*t/95+D('2.3')) if on[0] else D(0)
    tilt=D('23.3')+D('1.2')*mp.cos(2*mp.pi*t/41+D('1.49')) if on[1] else D('23.3')
    angle=283*rad+(2*mp.pi*t/21 if on[2] else 0)
    return e,tilt,angle
def daily(lat,e,tilt,w):
    phi=lat*rad;delta=tilt*rad;a=mp.sin(phi)*mp.sin(delta);b=mp.cos(phi)*mp.cos(delta)
    c=-a/b;H=mp.pi if c<=-1 else D(0) if c>=1 else mp.acos(c)
    r=(1-e*e)/(1+e*mp.cos(mp.pi/2-w))
    # Independent numerical integral of instantaneous positive solar elevation.
    q=mp.quad(lambda h:1361*max(D(0),a+b*mp.cos(h))/(r*r),[-H,0,H])/(2*mp.pi) if H else D(0)
    return q,H,r
def qfast(lat,e,tilt,w):
    phi=lat*rad;delta=tilt*rad;c=-mp.tan(phi)*mp.tan(delta);H=mp.pi if c<=-1 else D(0) if c>=1 else mp.acos(c)
    r=(1-e*e)/(1+e*mp.cos(mp.pi/2-w))
    return 1361/(mp.pi*r*r)*(H*mp.sin(phi)*mp.sin(delta)+mp.cos(phi)*mp.cos(delta)*mp.sin(H))
geometry=[]
for lat in map(D,('-80','0','30','65','80')):
    for e in map(D,('0','.055')):
        for tilt in map(D,('0','23.3')):
            for angle in (mp.pi/2,3*mp.pi/2):
                q,H,r=daily(lat,e,tilt,angle)
                annual=mp.quad(lambda E:1361/(4*(1-e*mp.cos(E))),[0,mp.pi,2*mp.pi])/(2*mp.pi)
                geometry.append(dict(lat=str(lat),e=str(e),tilt=str(tilt),angle=str(angle),Q=str(q),H=str(H),inverseRadius=str(1/r),annualGlobal=str(annual)))
profiles=[]
for lat,growth,melt,on in [(65,30,10,[True,True,True]),(80,10,40,[True,True,True]),(30,150,2,[True,False,False]),(65,30,10,[False,False,False])]:
    Q=[qfast(D(lat),*elements(t,on)) for t in range(-3071,1)]
    retained=Q[1024:];mean=sum(retained)/2048;sd=mp.sqrt(sum((x-mean)**2 for x in retained)/2048) if max(retained)!=min(retained) else D(0)
    target=[-(x-mean)/sd if sd else D(0) for x in Q];ice=[D(0)]
    for target_prev in target[:-1]:
        tau=growth if target_prev>ice[-1] else melt
        ice.append(target_prev+(ice[-1]-target_prev)*mp.exp(-D(1)/tau))
    response=ice[1024:];center=sum(response)/2048;power=[]
    for k in (17,50,98):
        z=sum((x-center)*mp.exp(-2j*mp.pi*k*j/2048) for j,x in enumerate(response));power.append(str(2*abs(z)**2/2048**2))
    profiles.append(dict(lat=lat,growth=growth,melt=melt,on=on,mean=str(mean),sd=str(sd),indices=[0,512,1247,2047],Q=[str(retained[i]) for i in (0,512,1247,2047)],ice=[str(response[i]) for i in (0,512,1247,2047)],bins=[17,50,98],power=power))
print(json.dumps(dict(digits=80,geometry=geometry,profiles=profiles),indent=2))
