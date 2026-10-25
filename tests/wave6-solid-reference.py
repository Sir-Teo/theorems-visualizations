"""Independent SOLID6 references: Fraction area/force integrals and mpmath geometry.
No JavaScript model is imported or executed. Original input doubles are exact Fractions.
"""
from fractions import Fraction as F
from pathlib import Path
import json,math,random,sys
import mpmath as mp

def f(x):return x if isinstance(x,F)else F(x)
def par(p,k,d):return f(p.get(k,d))
def m(x):x=f(x);return mp.mpf(x.numerator)/x.denominator
def qty(x):
 x=f(x);s=(x>0)-(x<0)
 try:v=float(x)
 except OverflowError:v=math.copysign(math.inf,s)
 return {'value':v if math.isfinite(v)else('negative overflow'if s<0 else'positive overflow'),'sign':s,'logMagnitude':float(mp.log(abs(m(x))))if s else None,'belowRange':bool(s and v==0),'aboveRange':not math.isfinite(v)}
def qfields(**x):return {k:qty(v)for k,v in x.items()}
def integral(power,a,b):return (f(b)**(power+1)-f(a)**(power+1))/(power+1)
def positive(x):return max(F(0),x)
def addpoly(a,b):return [(a[i]if i<len(a)else 0)+(b[i]if i<len(b)else 0)for i in range(max(len(a),len(b))) ]
def mulpoly(a,b):
 out=[F(0)]*(len(a)+len(b)-1)
 for i,x in enumerate(a):
  for j,y in enumerate(b):out[i+j]+=x*y
 return out
def pint(a,lo,hi):return sum((v*integral(i,lo,hi)for i,v in enumerate(a)),F(0))
def beam(p):
 L=par(p,'span',6);P=par(p,'pointLoad',30);w=par(p,'uniformLoad',5);a=L*par(p,'loadFraction',.4)
 rb=(P*a+w*L*(L/2))/L;ra=P+w*L-rb
 def at(x,side='right'):
  active=lambda z:x>z or(x==z and side=='right')
  return ra*active(0)+rb*active(L)-w*x-P*active(a),ra*x-w*x*x/2-P*positive(x-a)
 return L,P,w,a,ra,rb,at

def ref_beam(p):
 L,P,w,a,ra,rb,at=beam(p);x=L*par(p,'cutFraction',.5);V,M=at(x,p.get('side','right'));vl=at(x,'left')[0];vr=at(x)[0]
 intervals=[(F(0),a),(a,L)];positions=[F(0),a,L]
 for lo,hi in intervals:
  if w and hi>lo:
   middle=(lo+hi)/2;v=at(middle)[0];root=middle+v/w
   if lo<root<hi:positions.append(root)
 peak=min(positions,key=lambda x:(-at(x)[1],x));return qfields(leftReaction=ra,rightReaction=rb,loadPosition=a,position=x,shear=V,moment=M,leftShear=vl,rightShear=vr,peakPosition=peak,peakMoment=at(peak)[1],forceResidual=ra+rb-P-w*L,momentResidual=rb*L-P*a-w*L*L/2,endMoment=at(L)[1])
def ref_interval(p):
 L,P,w,z,ra,rb,at=beam(p);a=L*par(p,'startFraction',.2);b=L*par(p,'endFraction',.8);lo,hi=sorted([a,b]);sgn=1 if b>=a else-1
 # Integrate each actual shear polynomial over its own smooth interval.
 breaks=sorted(set([lo,hi]+([z]if lo<z<hi else[])));area=F(0)
 for x,y in zip(breaks,breaks[1:]):area+=((ra-(P if (x+y)/2>=z else 0))*(y-x)-w*integral(1,x,y))*sgn
 atom=int(b>=z)-int(a>=z);va,ma=at(a);vb,mb=at(b)
 out=qfields(start=a,end=b,uniformLoadArea=w*(b-a),pointLoadArea=P*atom,totalLoadArea=w*(b-a)+P*atom,startShear=va,endShear=vb,shearChange=vb-va,startMoment=ma,endMoment=mb,momentChange=mb-ma,shearArea=area,shearResidual=vb-va+w*(b-a)+P*atom,momentResidual=mb-ma-area);out['atomMultiplicity']=atom;return out

def ref_plane(p):
 k=par(p,'curvature',.6);L=par(p,'length',1);h=par(p,'height',.12);s=L*par(p,'positionFraction',.7);y=h*par(p,'eta',.5)/2;t=k*s;strain=-k*y
 if k:cx=mp.sin(m(t))/m(k);cy=(1-mp.cos(m(t)))/m(k)
 else:cx=m(s);cy=mp.mpf(0)
 nx=-mp.sin(m(t));ny=mp.cos(m(t))
 out=qfields(position=s,fibreOffset=y,angle=t,endAngle=k*L,strain=strain,stretch=1+strain,lengthChange=L*strain,fibreLength=L*(1+strain),outerStrainMagnitude=abs(k)*h/2)
 out.update(radius=qty(1/abs(k))if k else None,center=[float(cx),float(cy)],point=[float(cx+m(y)*nx),float(cy+m(y)*ny)],normal=[float(nx),float(ny)],geometryApproximate=True);return out

def rectangle_raw(x,y,b,h):
 # Raw moments from direct rectangle integrals, independent of parallel-axis summation.
 x,y,b,h=map(f,[x,y,b,h]);A=b*h
 return {'A':A,'X':A*x,'Y':A*y,'XX':h*integral(2,x-b/2,x+b/2),'YY':b*integral(2,y-h/2,y+h/2),'XY':integral(1,x-b/2,x+b/2)*integral(1,y-h/2,y+h/2)}
def raw_sum(rects):return {k:sum((r[k]for r in rects),F(0))for k in ['A','X','Y','XX','YY','XY']}
def centered(r):
 A=r['A'];cx=r['X']/A;cy=r['Y']/A
 return A,cx,cy,r['YY']-r['Y']**2/A,r['XX']-r['X']**2/A,r['XY']-r['X']*r['Y']/A

def ref_flexure(p):
 b=par(p,'width',100);h=par(p,'height',200);E=par(p,'modulus',210)*1000;M=par(p,'moment',50)*1000000;y=par(p,'eta',.5)*h/2;I=b*integral(2,-h/2,h/2);stress=-M*y/I
 return qfields(inertia=I,sectionModulus=I/(h/2),height=y,stress=stress,strain=stress/E,curvature=M/(E*I),topStress=-M*h/(2*I),bottomStress=M*h/(2*I),axialResultant=0,momentResultant=M,momentResidual=0)
def ref_area(p):
 rows=p.get('rects',[{'x':-30,'y':-100,'width':80,'height':20},{'x':20,'y':0,'width':120,'height':30},{'x':0,'y':100,'width':60,'height':20}]);raw=[rectangle_raw(r['x'],r['y'],r['width'],r['height'])for r in rows];A,cx,cy,Ix,Iy,Ixy=centered(raw_sum(raw));axis=par(p,'axisHeight',0);Iaxis=sum((r['YY']-2*axis*r['Y']+axis*axis*r['A']for r in raw),F(0));out=qfields(area=A,centroidX=cx,centroidY=cy,inertiaX=Ix,inertiaY=Iy,productInertia=Ixy,axisInertia=Iaxis,axisShiftTerm=A*(axis-cy)**2,decompositionResidual=Iaxis-Ix-A*(axis-cy)**2)
 out['parts']=[]
 for row,r in zip(rows,raw):
  own=r['YY']-r['Y']**2/r['A'];shift=r['A']*(f(row['y'])-axis)**2;out['parts'].append(qfields(area=r['A'],ownTerm=own,parallelTerm=shift,axisContribution=own+shift))
 return out

def section(B,h,tw,tf):
 B,h,tw,tf=map(f,[B,h,tw,tf]);H=h/2;c=H-tf;intervals=[(-H,-c,B),(-c,c,tw),(c,H,B)]if B!=tw else[(-H,H,B)]
 A=sum((w*(b-a)for a,b,w in intervals),F(0));I=sum((w*integral(2,a,b)for a,b,w in intervals),F(0));Z=sum((w*((abs(a)**2+abs(b)**2)/2 if a<0<b else abs(integral(1,a,b)))for a,b,w in intervals),F(0))
 return {'B':B,'h':h,'tw':tw,'tf':tf,'H':H,'c':c,'A':A,'I':I,'S':I/H,'Z':Z,'intervals':intervals}
def section_fields(g):return qfields(width=g['B'],height=g['h'],webWidth=g['tw'],flangeThickness=g['tf'],halfHeight=g['H'],webHalfHeight=g['c'],area=g['A'],inertia=g['I'],sectionModulus=g['S'],plasticModulus=g['Z'])
def chosen(p):
 B=par(p,'width',150);h=par(p,'height',300);kind=p.get('section','rectangle');tw=B if kind=='rectangle'else B*par(p,'webFraction',.1);tf=F(0)if kind=='rectangle'else h*par(p,'flangeFraction',.1);return section(B,h,tw,tf)
def ref_efficiency(p):
 a=par(p,'side',70);h=a*par(p,'heightRatio',3);A=a*a;phi=F(1,4)+F(3,4)*par(p,'redistribution',.5);B=phi*A/(h/4);tw=(1-phi)*A/(3*h/4);g=section(B,h,tw,h/8);square=section(a,a,a,0);tall=section(A/h,h,A/h,0);M=abs(par(p,'moment',20)*1000000)
 out=qfields(areaResidual=g['A']-A,sectionModulusRatio=g['S']/square['S'],tallRatio=tall['S']/square['S'],chosenExtremeStress=M/g['S'],squareExtremeStress=M/square['S'],tallExtremeStress=M/tall['S']);out.update(chosen=section_fields(g),square=section_fields(square),tall=section_fields(tall));return out

def first_above(g,y):
 return sum((w*integral(1,max(y,a),b)for a,b,w in g['intervals']if b>y),F(0))
def ref_shear(p):
 g=chosen(p);V=par(p,'shear',40)*1000;eta=par(p,'eta',.3);y=eta*g['H'];at=g['tw']!=g['B']and abs(y)==g['c'];web=abs(y)<g['c']or(at and p.get('interfaceSide','web')=='web');width=g['B']if g['B']==g['tw']else g['tw']if web else g['B'];Q=first_above(g,y);Q0=first_above(g,0);Qi=first_above(g,g['c']);out=qfields(height=y,firstMoment=Q,widthAtCut=width,shearFlow=V*Q/g['I'],stress=V*Q/g['I']/width,meanStress=V/g['A'],centroidStress=V*Q0/(g['I']*g['tw']),geometricPeakFactor=Q0*g['A']/(g['I']*g['tw']),interfaceEta=g['c']/g['H'],webInterfaceStress=V*Qi/(g['I']*g['tw']),flangeInterfaceStress=V*Qi/(g['I']*g['B']),shearResultant=V,resultantResidual=0)
 out.update(geometry=section_fields(g),atInterface=at,region='rectangle'if g['B']==g['tw']else'web'if web else'flange');return out

def ref_joint(p):
 g=section(150,300,10,20);L=par(p,'span',6);w=par(p,'uniformLoad',5)*1000;x=L*par(p,'stationFraction',.15);pitch=par(p,'pitch',100);R=par(p,'capacity',5)*1000;n=par(p,'rows',1);V=w*(L/2-x);Q=150*20*(150-10);flow=V*Q/g['I'];peak=w*L/2*Q/g['I'];local=abs(flow)*pitch/n;bound=peak*pitch/n
 out=qfields(position=x,shear=V,jointFirstMoment=Q,shearFlow=flow,peakFlow=peak,localConnectorProxy=local,peakConnectorBound=bound,capacity=R,localMargin=R-local,peakMargin=R-bound);out.update(geometry=section_fields(g),localAllowedPitch=qty(n*R/abs(flow))if flow else None,globalAllowedPitch=qty(n*R/peak)if peak else None,withinPeakBound=bound<=R);return out

# Three oriented midline segments, integrated as polynomial tractions.
def channel(p):
 b=par(p,'flangeWidth',100);h=par(p,'webHeight',200);t=par(p,'thickness',3);H=h/2;V=par(p,'shear',30)*1000;I=t*(integral(2,-H,H)+2*b*H*H);A=t*(h+2*b);centroid=2*t*integral(1,0,b)/A
 qtop=[F(0),t*H/I];qweb=[t*H*b/I,t*H/I,-t/(2*I)];qbottom=[t*H*b/I,-t*H/I]
 # Unit downward shear: force arrows top-left, web-down, bottom-right.
 FxTop=-pint(qtop,0,b);FyWeb=-pint(qweb,0,h);FxBottom=pint(qbottom,0,b)
 torque=-H*FxTop+H*FxBottom;xs=-torque
 mode=p.get('loadPosition','free');e=centroid if mode=='centroid'else xs if mode=='shear centre'else b*par(p,'loadOffsetFraction',.25)
 return b,h,t,V,I,centroid,xs,e,FxTop*V,FxBottom*V,-FyWeb*V,torque*V

def ref_channel(p):
 b,h,t,V,I,c,xs,e,Ftop,Fbot,vertical,T=channel(p);out=qfields(inertia=I,centroid=c,shearCentre=xs,loadCoordinate=e,flangeResultantTop=Ftop,flangeResultantBottom=Fbot,verticalResultant=vertical,flowTorqueCCW=T,shearCentreLoadTorqueCCW=-xs*V,forceResidual=vertical-V,torqueResidual=T+xs*V,twistingMomentCCW=-V*(e-xs),thinness=t/min(b,h));out['zeroLoad']=V==0;return out

def ref_channel_probe(p,segment,fraction):
 b,h,t,V,I,*_=channel(p);u=f(fraction)
 if segment=='web':x=F(0);y=h/2-h*(1-u);Q=t*(h*b/2+integral(1,y,h/2));direction=[0,-1]
 else:x=b*u;y=h/2*(1 if segment=='top'else-1);Q=t*(h/2)*(b-x);direction=[-1,0]if segment=='top'else[1,0]
 out=qfields(horizontal=x,vertical=y,flow=V*Q/I,stress=V*Q/(I*t));out['direction']=direction;return out

def composite(p):
 b=par(p,'width',100);h1=par(p,'lowerHeight',150);h2=par(p,'upperHeight',10);E1=par(p,'modulus',10)*1000;E2=E1*par(p,'modulusRatio',20);M=par(p,'moment',20)*1000000;records=[(E1,F(0),h1),(E2,h1,h1+h2)];ea=sum((E*b*(hi-lo)for E,lo,hi in records),F(0));ey=sum((E*b*integral(1,lo,hi)for E,lo,hi in records),F(0));eyy=sum((E*b*integral(2,lo,hi)for E,lo,hi in records),F(0));yN=ey/ea;D=eyy-ey*ey/ea;k=M/D
 return b,h1,h2,E1,E2,M,yN,D,k,records

def ref_composite(p):
 b,h1,h2,E1,E2,M,yn,D,k,records=composite(p);height=h1+h2;y=height*par(p,'sampleFraction',.5);at=y==h1;layer='lower'if y<h1 or(at and p.get('interfaceSide','lower')=='lower')else'upper';strain=k*(yn-y);eps_i=k*(yn-h1);forces=[E*b*k*(yn*(hi-lo)-integral(1,lo,hi))for E,lo,hi in records];resultant=-sum((E*b*k*(yn*integral(1,lo,hi)-integral(2,lo,hi))for E,lo,hi in records),F(0))
 out=qfields(neutralHeight=yn,geometricCentroid=height/2,neutralShift=yn-height/2,bendingStiffness=D,transformedInertia=D/E1,transformedUpperWidth=b*par(p,'modulusRatio',20),curvature=k,height=y,strain=strain,stress=(E1 if layer=='lower'else E2)*strain,interfaceStrain=eps_i,lowerInterfaceStress=E1*eps_i,upperInterfaceStress=E2*eps_i,lowerAxialForce=forces[0],upperAxialForce=forces[1],axialResultant=sum(forces),momentResultant=resultant,momentResidual=resultant-M);out.update(layer=layer,atInterface=at);return out

def ref_composite_probe(p,layer,fraction):
 b,h1,h2,E1,E2,M,yn,D,k,_=composite(p);y=f(fraction)*h1 if layer=='lower'else h1+f(fraction)*h2;eps=k*(yn-y);return qfields(height=y,strain=eps,stress=(E1 if layer=='lower'else E2)*eps)

def solve(A,b):
 a=[list(map(f,row))+[f(v)]for row,v in zip(A,b)];n=len(a)
 for k in range(n):
  pivot=next(j for j in range(k,n)if a[j][k]);a[k],a[pivot]=a[pivot],a[k];u=a[k][k];a[k]=[x/u for x in a[k]]
  for j in range(n):
   if j!=k:
    u=a[j][k];a[j]=[x-u*y for x,y in zip(a[j],a[k])]
 return [row[-1]for row in a]

def ref_unsymmetric(p):
 B=par(p,'width',100);h=par(p,'height',150);t=par(p,'thickness',10);r=raw_sum([rectangle_raw(t/2,h/2,t,h),rectangle_raw((B+t)/2,t/2,B-t,t)]);A,cx,cy,Ix,Iy,Ixy=centered(r);D=Ix*Iy-Ixy*Ixy;My=par(p,'momentY',0)*1000000;Mz=par(p,'momentZ',2)*1000000;E=par(p,'modulus',210)*1000;L=par(p,'span',1)*1000
 # Solve three raw-coordinate force/moment constraints, independent of source closed form.
 c,a,b=solve([[r['A'],r['X'],r['Y']],[r['X'],r['XX'],r['XY']],[r['Y'],r['XY'],r['YY']]],[0,My,-Mz]);ky=-b/E;kz=-a/E;vertices=[]
 for x,y in [(F(0),F(0)),(B,F(0)),(B,t),(t,t),(t,h),(F(0),h)]:vertices.append(qfields(horizontal=x,vertical=y,stress=c+a*x+b*y))
 rawverts=[(F(0),F(0)),(B,F(0)),(B,t),(t,t),(t,h),(F(0),h)];peak=max(range(6),key=lambda j:abs(c+a*rawverts[j][0]+b*rawverts[j][1]));px,py=rawverts[peak];peakStress=abs(c+a*px+b*py);N=c*r['A']+a*r['X']+b*r['Y'];actualY=c*r['X']+a*r['XX']+b*r['XY'];actualZ=-(c*r['Y']+a*r['XY']+b*r['YY']);norm=mp.sqrt(m(a*a+b*b));unit=[float(m(a)/norm),float(m(b)/norm)]if norm else None
 out=qfields(area=A,centroidHorizontal=cx,centroidVertical=cy,inertiaHorizontal=Ix,inertiaVertical=Iy,productInertia=Ixy,determinant=D,stressCoefficientHorizontal=a,stressCoefficientVertical=b,curvatureVertical=ky,curvatureHorizontal=kz,tipVertical=L*L*ky/2,tipHorizontal=L*L*kz/2,uncoupledTipVertical=L*L*Mz/(2*E*Ix),uncoupledTipHorizontal=-L*L*My/(2*E*Iy),peakStressMagnitude=peakStress,peakHorizontal=px,peakVertical=py,axialResultant=N,momentYResultant=actualY,momentZResultant=actualZ,momentYResidual=actualY-My,momentZResidual=actualZ-Mz);out.update(vertices=vertices,neutralNormal=unit,neutralDirection=[-unit[1],unit[0]]if unit else None,principalAngle=float(mp.atan2(2*m(Ixy),m(Iy-Ix))/2),geometryApproximate=True);return out

def plastic(p):
 g=chosen(p);Y=par(p,'yieldStress',250);E=par(p,'modulus',210)*1000;chi=par(p,'curvatureRatio',2);sgn=1 if p.get('direction','positive')=='positive'else-1;limit=p.get('state','finite')=='plastic limit';core=F(0)if limit else min(g['H'],g['H']/chi)if chi else g['H'];M=F(0);N=F(0);coreArea=F(0)
 # Integrate actual piecewise-linear/constant stresses over the complete section.
 for lo,hi,w in g['intervals']:
  points=sorted(set([lo,hi]+[x for x in [-core,F(0),core]if lo<x<hi]))
  for a,b in zip(points,points[1:]):
   mid=(a+b)/2
   if not limit and abs(mid)<core:poly=[F(0),-sgn*Y*chi/g['H']];coreArea+=w*(b-a)
   else:poly=[-sgn*Y*((mid>0)-(mid<0))]
   N+=w*pint(poly,a,b);M-=w*pint(mulpoly([0,1],poly),a,b)
 My=Y*g['S'];Mp=Y*g['Z'];return g,Y,E,chi,sgn,limit,core,M,N,My,Mp,coreArea

def ref_plastic(p):
 g,Y,E,chi,sgn,limit,core,M,N,My,Mp,coreArea=plastic(p);phase='plastic limit'if limit else'unloaded'if not chi else'elastic'if chi<1 else'first yield'if chi==1 else'partly yielded';top=-sgn*Y*(1 if limit else min(chi,1));out=qfields(yieldMoment=My,plasticMoment=Mp,moment=M,signedPlasticMoment=sgn*Mp,shapeFactor=Mp/My,momentToYield=abs(M)/My,momentToPlastic=abs(M)/Mp,plasticDeficit=Mp-abs(M),coreHalfHeight=core,elasticAreaFraction=coreArea/g['A'],yieldedAreaFraction=1-coreArea/g['A'],topStress=top,bottomStress=-top,axialResultant=N);out.update(phase=phase,geometry=section_fields(g),curvature=None if limit else qty(sgn*chi*Y/(E*g['H'])));return out

def ref_plastic_probe(p,eta):
 g,Y,E,chi,sgn,limit,*_=plastic(p);u=f(eta);stress=-sgn*Y*((u>0)-(u<0))*(1 if limit else min(chi*abs(u),1));return qfields(height=u*g['H'],stress=stress)

REFS={'beam':ref_beam,'interval':ref_interval,'plane':ref_plane,'flexure':ref_flexure,'area':ref_area,'efficiency':ref_efficiency,'shear':ref_shear,'joint':ref_joint,'channel':ref_channel,'composite':ref_composite,'unsymmetric':ref_unsymmetric,'plastic':ref_plastic}
TINY=math.nextafter(0.0,1.0);rng=random.Random(60261025);arguments={k:[]for k in REFS};seen={k:set()for k in REFS}
def add(k,p):
 key=json.dumps(p,sort_keys=True,separators=(',',':'))
 if key not in seen[k]:seen[k].add(key);arguments[k].append(p)
def tiny_inside(x):
 if isinstance(x,float):return 0<abs(x)<1e-250
 if isinstance(x,list):return any(map(tiny_inside,x))
 if isinstance(x,dict):return any(map(tiny_inside,x.values()))
 return False
for k in REFS:add(k,{})
for L in [1,6,12]:
 for P,w in [(0,0),(30,0),(0,5),(30,5),(TINY,0),(0,TINY),(TINY,TINY)]:
  for f0 in [0,.4,1]:
   for side in ['left','right']:add('beam',dict(span=L,pointLoad=P,uniformLoad=w,loadFraction=f0,cutFraction=f0,side=side))
for x in [0,TINY,.4,math.nextafter(.4,0),math.nextafter(.4,1),1]:add('beam',{'cutFraction':x})
for f0 in [.05,.4,.5,.95]:
 for a,b in [(f0,f0),(.05,.95),(.95,.05),(f0,.95),(.05,f0),(math.nextafter(f0,0)if f0>.05 else.05,f0),(f0,math.nextafter(f0,1)if f0<.95 else.95)]:
  for P,w in [(30,5),(0,5),(30,0),(TINY,TINY)]:add('interval',dict(loadFraction=f0,startFraction=a,endFraction=b,pointLoad=P,uniformLoad=w))
for k in [0,TINY,-TINY,-1,.6,1,math.nextafter(.001,0),.001,math.nextafter(.001,1)]:
 for s,u in [(0,0),(.5,.5),(1,1),(TINY,TINY),(1,-1)]:add('plane',dict(curvature=k,positionFraction=s,eta=u))
for M in [-100,-TINY,0,TINY,50,100]:
 for eta in [-1,-TINY,0,TINY,.5,1]:add('flexure',dict(moment=M,eta=eta))
baseRects=[{'x':-30,'y':-100,'width':80,'height':20},{'x':20,'y':0,'width':120,'height':30},{'x':0,'y':100,'width':60,'height':20}]
for axis in [-220,-100,-6.25,0,TINY,100,220]:add('area',{'axisHeight':axis})
for j in range(3):
 for val in [-120,0,120]:
  rr=[dict(r)for r in baseRects];rr[j]['x']=val;add('area',{'rects':rr,'axisHeight':-6.25})
for ratio in [1,math.nextafter(1,2),3,5]:
 for u in [0,TINY,.5,.9]:
  for M in [0,-20,20]:add('efficiency',dict(heightRatio=ratio,redistribution=u,moment=M))
for kind in ['rectangle','I-section']:
 for V in [-100,-TINY,0,TINY,40]:
  for eta in [-1,-.75,-TINY,0,TINY,.75,1]:
   for side in ['web','flange']:add('shear',dict(section=kind,shear=V,flangeFraction=.125,eta=eta,interfaceSide=side))
for w in [0,TINY,5,10]:
 for x in [0,math.nextafter(.5,0),.5,math.nextafter(.5,1),1]:
  for rows in [1,2]:add('joint',dict(uniformLoad=w,stationFraction=x,rows=rows))
for V in [-100,-TINY,0,TINY,30,100]:
 for mode in ['free','centroid','shear centre']:
  for e in [-1,0,.25,2]:add('channel',dict(shear=V,loadPosition=mode,loadOffsetFraction=e))
for n in [1,math.nextafter(1,2),4,math.nextafter(4,0),math.nextafter(4,5),20]:
 for M in [-100,-TINY,0,TINY,20]:
  add('composite',dict(modulusRatio=n,moment=M,lowerHeight=100,upperHeight=50,sampleFraction=2/3))
for side in ['lower','upper']:add('composite',dict(lowerHeight=50,upperHeight=50,sampleFraction=.5,interfaceSide=side))
for My in [-5,-TINY,0,TINY,5]:
 for Mz in [-5,-TINY,0,TINY,5]:
  for dims in [dict(width=100,height=150,thickness=10),dict(width=100,height=100,thickness=10)]:add('unsymmetric',dict(**dims,momentY=My,momentZ=Mz))
for kind in ['rectangle','I-section']:
 for state in ['finite','plastic limit']:
  for direction in ['positive','negative']:
   for chi in [0,TINY,math.nextafter(1,0),1,math.nextafter(1,2),2,8]:add('plastic',dict(section=kind,state=state,direction=direction,curvatureRatio=chi,flangeFraction=.125))
for _ in range(40):
 add('beam',dict(span=rng.uniform(1,12),pointLoad=rng.uniform(0,100),uniformLoad=rng.uniform(0,20),loadFraction=rng.random(),cutFraction=rng.random()))
 add('interval',dict(span=rng.uniform(1,12),pointLoad=rng.uniform(0,100),uniformLoad=rng.uniform(0,20),loadFraction=rng.random(),startFraction=rng.uniform(.05,.95),endFraction=rng.uniform(.05,.95)))
 add('plane',dict(curvature=rng.uniform(-1,1),length=rng.uniform(.2,2),height=rng.uniform(.02,.2),positionFraction=rng.random(),eta=rng.uniform(-1,1)))
 add('flexure',dict(width=rng.uniform(20,300),height=rng.uniform(20,400),modulus=rng.uniform(1,250),moment=rng.uniform(-100,100),eta=rng.uniform(-1,1)))
 rr=[dict(x=rng.uniform(-120,120),y=rng.uniform(a,b),width=rng.uniform(20,160),height=rng.uniform(10,40))for a,b in [(-160,-80),(-20,20),(80,160)]];add('area',dict(rects=rr,axisHeight=rng.uniform(-220,220)))
 add('efficiency',dict(side=rng.uniform(20,100),heightRatio=rng.uniform(1,5),redistribution=rng.uniform(0,.9),moment=rng.uniform(-100,100)))
 geom=dict(section=rng.choice(['rectangle','I-section']),width=rng.uniform(40,200),height=rng.uniform(80,400),webFraction=rng.uniform(.05,.8),flangeFraction=rng.uniform(.05,.3))
 add('shear',dict(**geom,shear=rng.uniform(-100,100),eta=rng.uniform(-1,1),interfaceSide=rng.choice(['web','flange'])))
 add('joint',dict(span=rng.uniform(1,10),uniformLoad=rng.uniform(0,10),stationFraction=rng.random(),pitch=rng.uniform(10,300),capacity=rng.uniform(.1,50),rows=rng.choice([1,2])))
 add('channel',dict(flangeWidth=rng.uniform(60,200),webHeight=rng.uniform(100,400),thickness=rng.uniform(1,5),shear=rng.uniform(-100,100),loadOffsetFraction=rng.uniform(-1,2),loadPosition=rng.choice(['free','centroid','shear centre'])))
 add('composite',dict(width=rng.uniform(50,200),lowerHeight=rng.uniform(50,300),upperHeight=rng.uniform(5,50),modulus=rng.uniform(5,50),modulusRatio=rng.uniform(1,20),moment=rng.uniform(-100,100),sampleFraction=rng.random()))
 add('unsymmetric',dict(width=rng.uniform(60,200),height=rng.uniform(60,250),thickness=rng.uniform(5,20),momentY=rng.uniform(-5,5),momentZ=rng.uniform(-5,5),modulus=rng.uniform(20,250),span=rng.uniform(.2,2)))
 add('plastic',dict(**geom,modulus=rng.uniform(20,250),yieldStress=rng.uniform(50,500),curvatureRatio=rng.uniform(0,8),direction=rng.choice(['positive','negative']),state=rng.choice(['finite','plastic limit'])))

families={}
for family,rows in arguments.items():
 output=[]
 for p in rows:
  digits=1800 if tiny_inside(p)else 90
  with mp.workdps(digits):
   row={'args':p,'digits':digits,'expect':REFS[family](p)}
   if family=='channel':row['probes']=[{'method':'channelFlowAt','extra':[segment,u],'expect':ref_channel_probe(p,segment,u)}for segment in ['top','web','bottom']for u in [0,.5,1,TINY]]
   if family=='composite':row['probes']=[{'method':'compositeStressAt','extra':[layer,u],'expect':ref_composite_probe(p,layer,u)}for layer in ['lower','upper']for u in [0,.5,1]]
   if family=='plastic':row['probes']=[{'method':'plasticStressAt','extra':[u],'expect':ref_plastic_probe(p,u)}for u in [-1,-.75,-.5,0,TINY,.5,.75,1]]
   output.append(row)
 families[family]=output;print(family,len(output),flush=True)
result={'schema':1,'method':'Independent exact Fraction area/force/stress polynomial integrals; raw-coordinate Gaussian elimination;90/1800-digit mpmath geometry. No JS import.','families':families}
target=Path(sys.argv[1])if len(sys.argv)>1 else Path(__file__).parent/'fixtures/wave6-solid-reference.json';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(result,separators=(',',':'),allow_nan=False)+'\n');print('TOTAL',sum(map(len,families.values())),'bytes',target.stat().st_size,flush=True)
