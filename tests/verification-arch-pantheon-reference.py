"""Independent80digit piecewise integration; no atlas/JS model import."""
import json,mpmath as m
m.mp.dps=80;a=m.mpf('21.65');g=m.mpf('9.81');rad=m.pi/180
cuts=[12,15,25,30,40,50,60,70,75,80,85,90]
probes=[(12,1),(15,-1),(25,-1),(25,1),(30,-1),(30,1),(40,-1),(40,1),(55,1),(70,-1),(70,1),(75,-1),(75,1),(85,1),(90,-1)]
out=[]
for kind in ['graded','base','top']:
 for steps in [False,True]:
  for top,base,void in [('1.4','2.2','.2'),('1','2.5','0'),('2','1.8','.35')]:
   top=m.mpf(top);base=m.mpf(base);void=m.mpf(void);pieces=[];prefix=m.mpf(0)
   for lo,hi in zip(cuts,cuts[1:]):
    mid=m.mpf(lo+hi)/2
    def w(phi,mid=mid):
     thickness=m.mpf('1.2') if mid<30 else m.mpf('1.2')+m.mpf('5.2')*(m.ceil((mid-30)/10)/6 if steps else (phi-30)/60)
     rho=base if kind=='base' else top if kind=='top' or mid<15 else base if mid>85 else top+(base-top)*(phi-15)/70
     fraction=1-void if 25<mid<75 else 1
     return rho*g*fraction*((a+thickness)**3-a**3)/(3*a*a)
    def integ(x,y,w=w):return 2*m.pi*a*a*m.quad(lambda phi:w(phi)*m.sin(phi*rad)*rad,[x,y]) if x!=y else m.mpf(0)
    pieces.append((lo,hi,w,integ,prefix));prefix+=integ(lo,hi)
   points=[]
   for phi,side in probes:
    if side==1:
     piece=next(p for p in pieces if p[0]<=phi<p[1] or phi==90 and p[1]==90)
    else:
     piece=next(p for p in pieces if p[0]<phi<=p[1] or phi==12 and p[0]==12)
    lo,hi,w,integ,pref=piece
    W=pref+integ(lo,phi);weight=w(phi);Q=W/(2*m.pi*a*m.sin(phi*rad)**2)
    points.append(dict(phi=phi,side=side,W=m.nstr(W,65),w=m.nstr(weight,65),Nphi=m.nstr(-Q,65),Ntheta=m.nstr(Q-a*weight*m.cos(phi*rad),65)))
   out.append(dict(kind=kind,steps=steps,top=float(top),base=float(base),voidFraction=float(void),points=points))
print(json.dumps(out,indent=2))
