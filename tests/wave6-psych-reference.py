# Reproducible PSYCH6 reference: Fraction and independently formulated geometry.
# PSYCH_DIGITS defaults800; repeat at1600. PSYCH_REFERENCE_OUT selects output.
from pathlib import Path
from fractions import Fraction as F
import math,json,os,random
import mpmath as mp
mp.mp.dps=int(os.environ.get('PSYCH_DIGITS','800'));root=Path(__file__).parent

def m(q):q=F(q);return mp.mpf(q.numerator)/q.denominator
def q(x):
 x=F(x);v=float(x)
 return dict(exact=dict(n=str(x.numerator),d=str(x.denominator)),value=v,sign=(x>0)-(x<0),logMagnitude=float(mp.log(abs(m(x))))if x else None,belowRange=bool(x)and v==0,aboveRange=not math.isfinite(v),approximate=False)
def pack(**values):return{k:q(v)for k,v in values.items()}
def ang(value,C,K):
 s=(C>0)-(C<0)
 if not C and K>=0:value=mp.mpf(0)
 return dict(radians=float(value),degrees=float(value*180/mp.pi),arcminutes=float(value*10800/mp.pi),sign=s or(1 if K<0 else 0),logMagnitude=float(mp.log(abs(value)))if value else None,belowRange=bool(C)and float(value)==0,approximate=True,arguments=pack(cross=C,dot=K))
def stereoGeometry(p):
 b=F(p.get('halfEyeSeparation',.3));d=F(p.get('fixationDistance',6));x=F(p.get('pointX',.5));z=F(p.get('pointDepth',4));center=(d*d-b*b)/(2*d);radius=(d*d+b*b)/(2*d);deficit=radius*radius-x*x-(z-center)**2
 l=mp.atan2(m(x+b),m(z))-mp.atan2(m(b),m(d));r=mp.atan2(m(x-b),m(z))-mp.atan2(m(-b),m(d));C=2*b*d*deficit;K=(x*x+z*z-b*b)*(d*d-b*b)+4*b*b*z*d;delta=l-r if C else mp.mpf(0)
 return dict(left=ang(l,x*d+b*(d-z),z*d+b*x+b*b),right=ang(r,x*d+b*(z-d),z*d-b*x+b*b),disparity=ang(delta,C,K),**pack(pointX=x,pointDepth=z,fixationDistance=d,halfEyeSeparation=b,horopterCenterDepth=center,horopterRadius=radius,horopterDeficit=deficit),classification='crossed'if C>0 else'uncrossed'if C<0 else'zero disparity',angleCoordinatesApproximate=True)
def pinhole(p):
 x=F(p.get('worldX',1));S=F(p.get('worldHeight',1));z=F(p.get('depth',4));c=F(p.get('cameraX',0));f=F(p.get('focalLength',1));scale=f/z
 return pack(imageX=(x-c)*scale,imageHeight=S*scale,cameraDerivative=-scale,worldX=x,worldHeight=S,depth=z)
def sizeDistance(p):
 S=F(p.get('worldSize',1));d=F(p.get('distance',4));r=F(p.get('retinalRatio',.2))
 return dict(**pack(worldSize=S,scalingDistance=d,realObjectImageRatio=S/d,fixedImageRatio=r,fixedAngleScaledSize=d*r,compensatedRealObjectSize=S),realObjectAngularDiameter=ang(2*mp.atan(m(S)/(2*m(d))),4*S*d,4*d*d-S*S),fixedAngularDiameter=ang(2*mp.atan(m(r)/2),4*r,4-r*r),illustration=True)
def cueCombination(p):
 v=F(p.get('visual',52));h=F(p.get('haptic',58));sv=F(p.get('visualSD',1));sh=F(p.get('hapticSD',2));rho=F(p.get('correlation',0));chosen=F(p.get('chosenVisualWeight',.5));rule=p.get('rule','independent MLE');V=sv*sv;H=sh*sh;cov=rho*sv*sh;a=V+H-2*cov;b=2*(cov-H);optimal=-b/(2*a);independent=(1/V)/(1/V+1/H);w=independent if rule=='independent MLE'else optimal if rule=='correlated minimum variance'else chosen;variance=a*w*w+b*w+H;minimum=H-b*b/(4*a)
 return dict(**pack(visual=v,haptic=h,visualVariance=V,hapticVariance=H,covariance=cov,visualWeight=w,hapticWeight=1-w,independentVisualWeight=independent,optimalVisualWeight=optimal,combinedMean=h+w*(v-h),actualVariance=variance,independenceVariance=1/(1/V+1/H),optimalVariance=minimum,variancePenalty=a*(w-optimal)**2,weightSum=1),rule=rule,independentAssumption=not bool(rho),weightOutsideUnitInterval=not 0<=w<=1,betterThanVisual=variance<V,betterThanHaptic=variance<H,illustration=True)
def bit(seed,i):
 mask=(1<<32)-1;z=(seed+i*0x9e3779b9)&mask;z=((z^(z>>16))*0x85ebca6b)&mask;z=((z^(z>>13))*0xc2b2ae35)&mask;return((z^(z>>16))>>31)&1
def stereogram(p):
 seed=p.get('seed',37);d=p.get('disparity',3);shape=p.get('shape','square');N=p.get('size',36);c=F(N-1,2);r=F(N//3,2)
 def inside(x,y):
  x=F(x)-c;y=F(y)-c
  if shape=='square':return abs(x)<=r and abs(y)<=r
  if shape=='circle':return x*x+y*y<=r*r
  vertices=[(-r,-r),(r,-r),(F(0),r)];crosses=[(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0])for a,b in zip(vertices,vertices[1:]+vertices[:1])];return all(a>=0 for a in crosses)
 mask=[inside(x,y)for y in range(N)for x in range(N)];L=[bit(seed,i)for i in range(N*N)];owners=[None]*(N*N)
 # Forward-map each source: background can be occluded, foreground shifts.
 for i,foreground in enumerate(mask):
  x=i%N;y=i//N
  if not foreground:owners[i]=i
 for i,foreground in enumerate(mask):
  if foreground:
   dest=(i//N)*N+i%N-d
   if 0<=i%N-d<N:owners[dest]=i
 # Disoccluded positions in the original mask cannot retain their former bit.
 for i,foreground in enumerate(mask):
  if foreground and owners[i]==i and d!=0:owners[i]=None
 # Previous initialization never assigned foreground; a shift may legitimately
 # assign the very same source only when d=0.
 R=[L[a]if a is not None else bit(seed,1000000+i)for i,a in enumerate(owners)];fresh=[i for i,a in enumerate(owners)if a is None];used=[a for a in owners if a is not None];assert len(set(used))==len(used)
 return dict(size=N,seed=seed,disparity=d,shape=shape,left=L,right=R,mask=mask,sourceIndices=owners,freshIndices=fresh,foregroundCount=sum(mask),leftOnes=sum(L),rightOnes=sum(R),sourceOwnershipUnique=True,illustration=True)
rows=[]
def add(name,p):rows.append(dict(name=name,parameters=p,expected=globals()[name](p)))
rng=random.Random(6178)
for name in ['stereoGeometry','pinhole','sizeDistance','cueCombination','stereogram']:add(name,{})
for _ in range(70):
 add('stereoGeometry',dict(halfEyeSeparation=rng.choice([.2,.3,.5,.6]),fixationDistance=rng.choice([4,6,10]),pointX=rng.choice([-1.5,-.5,0,.5,1.5,5e-324,-5e-324]),pointDepth=rng.choice([.5,4,6,10,15,math.nextafter(6,math.inf),math.nextafter(6,0)])))
for p in [dict(pointX=0,pointDepth=6),dict(pointX=5e-324,pointDepth=6),dict(pointX=-5e-324,pointDepth=6),dict(halfEyeSeparation=.5,fixationDistance=4,pointX=.5,pointDepth=3.9375),dict(halfEyeSeparation=.5,fixationDistance=4,pointX=.5,pointDepth=math.nextafter(3.9375,math.inf))]:add('stereoGeometry',p)
for _ in range(40):
 add('pinhole',dict(worldX=rng.choice([-4,0,1,4,5e-324]),worldHeight=rng.choice([.1,1,4]),depth=rng.choice([.5,4,15]),cameraX=rng.choice([-1,0,1,5e-324]),focalLength=rng.choice([.5,1,2])))
 add('sizeDistance',dict(worldSize=rng.choice([.5,1,2]),distance=rng.choice([1,4,10]),retinalRatio=rng.choice([.05,.2,.5])))
for _ in range(100):add('cueCombination',dict(visual=rng.choice([40,52,70]),haptic=rng.choice([40,58,70]),visualSD=rng.choice([.25,1,2,10]),hapticSD=rng.choice([.25,1,2,10]),correlation=rng.choice([-.8,0,.5,.8,5e-324,-5e-324]),chosenVisualWeight=rng.choice([0,.5,1,5e-324]),rule=rng.choice(['independent MLE','correlated minimum variance','chosen weight'])))
for rule in ['independent MLE','correlated minimum variance','chosen weight']:add('cueCombination',dict(visualSD=1,hapticSD=2,correlation=.5,rule=rule))
for shape in ['square','circle','triangle']:
 for d in [-5,0,5]:add('stereogram',dict(seed=37,disparity=d,shape=shape,size=24))

foundation_rows=rows

def xy(x,y):return[q(x),q(y)]
def figureGround(p):
 w=F(p.get('width',.8));a=F(p.get('asymmetry',0));ys=list(map(F,[-1,-.8,-.6,-.4,-.3,-.2,-.1,0,.08,.16,.24,.32,.45,.6,.75,.9,1]));profile=list(map(F,[.85,.8,.65,.5,.47,.4,.46,.42,.44,.4,.24,.42,.52,.6,.61,.66,.7]));h=[b-a for a,b in zip(ys,ys[1:])];d=[(b-a)/span for a,b,span in zip(profile,profile[1:],h)];slopes=[F(0)]
 for i in range(1,len(ys)-1):
  w1=2*h[i]+h[i-1];w2=h[i]+2*h[i-1];slopes.append((w1+w2)/(w1/d[i-1]+w2/d[i])if d[i-1]*d[i]>0 else F(0))
 slopes.append(F(0));samples=[]
 for i in range(len(h)):
  controls=[profile[i],profile[i]+h[i]*slopes[i]/3,profile[i+1]-h[i]*slopes[i+1]/3,profile[i+1]]
  for j in range(8):
   t=F(j,8);u=1-t;v=u**3*controls[0]+3*u*u*t*controls[1]+3*u*t*t*controls[2]+t**3*controls[3];samples.append((ys[i]+t*h[i],v))
 samples.append((ys[-1],profile[-1]));left=[(a*y-w*r,y)for y,r in samples];right=[(a*y+w*r,y)for y,r in samples];area=sum(w*(samples[i][1]+samples[i+1][1])*(samples[i+1][0]-samples[i][0])for i in range(len(samples)-1))
 return dict(polygon=[xy(*v)for v in left+right[::-1]],leftBorder=[xy(*v)for v in left],rightBorder=[xy(*v)for v in right],**pack(centralArea=area,outerArea=6-area,totalArea=6,centralFraction=area/6,outerFraction=1-area/6),illustration=True)
def proximity(p):
 x=F(p.get('horizontalGap',1));y=F(p.get('verticalGap',1.7))
 return dict(points=[xy((F(i)-F(5,2))*x,(F(j)-F(5,2))*y)for j in range(6)for i in range(6)],**pack(horizontalGap=x,verticalGap=y,gapRatio=x/y,gapDifference=x-y),nearestDirection='horizontal'if x<y else'vertical'if x>y else'tie',illustration=True)
def similarity(p):
 c=F(p.get('contrast',.8));pattern=p.get('pattern','rows');lo=F(.5)-F(.3)*c;hi=F(.5)+F(.3)*c
 return dict(**proximity(dict(horizontalGap=p.get('horizontalGap',1),verticalGap=p.get('verticalGap',1))),pattern=pattern,codes=[q(hi if(j if pattern=='rows'else i if pattern=='columns'else i+j)%2 else lo)for j in range(6)for i in range(6)],**pack(lowCode=lo,highCode=hi,codeDifference=hi-lo),marksIdentical=not c)
def unit(seed,index):
 mask=(1<<32)-1;z=(seed+index*0x9e3779b9)&mask;z=((z^(z>>16))*0x85ebca6b)&mask;z=((z^(z>>13))*0xc2b2ae35)&mask;return((z^(z>>16))&mask)/(1<<32)
def continuation(p):
 seed=p.get('seed',17);jitter=p.get('jitter',12);clutter=p.get('clutter',36);contour=[]
 for i in range(12):
  x=F(-2)+F(4*i,11);y=F(.3)*(x*x-2);slope=F(.6)*x;tangent=float(mp.atan(m(slope)));offset=(2*unit(seed,i)-1)*jitter*math.pi/180
  contour.append(dict(position=xy(x,y),tangent=tangent,orientation=tangent+offset,offset=offset,contour=True))
 background=[dict(position=xy(-2.4+4.8*unit(seed,100+3*i),-1.6+3.2*unit(seed,101+3*i)),tangent=None,orientation=math.pi*unit(seed,102+3*i),offset=None,contour=False)for i in range(clutter)]
 return dict(seed=seed,jitter=jitter,patches=contour+background,contourCount=12,clutterCount=clutter,meanAbsoluteJitter=sum(abs(v['offset'])for v in contour)/12,approximateAngles=True,illustration=True)
def gaborSample(p):
 x=m(p.get('x',0));y=m(p.get('y',0));o=m(p.get('orientation',0));freq=m(p.get('frequency',3));s=m(p.get('sigma',.12));return float(mp.exp(-(x*x+y*y)/(2*s*s))*mp.cos(2*mp.pi*freq*(x*mp.cos(o)+y*mp.sin(o))))
def closure(p):
 rotation=p.get('rotation',0);r=p.get('radius',.36);vertices=[[0,1.3],[-1.3*math.sqrt(3)/2,-.65],[1.3*math.sqrt(3)/2,-.65]]
 return dict(vertices=vertices,inducers=[dict(x=x,y=y,radius=r,mouthAngle=float(mp.atan2(-m(y),-m(x)))+rotation*math.pi/180,mouthWidth=math.pi/3)for x,y in vertices],centerCode=242,backgroundCode=242,drawsCentralTriangle=False,approximateGeometry=True,illustration=True)
def commonFate(p):
 seed=p.get('seed',23);coherence=F(p.get('coherence',.8));speed=p.get('speed',.35);direction=p.get('direction',25);phase=p.get('phase',1.5);initial=[]
 for i in range(192):
  x=(i%16+unit(seed,3*i))/16*4-2;y=(i//16+unit(seed,3*i+1))/12*3-1.5;initial.append(dict(index=i,x=x,y=y,eligible=x*x+y*y<.85*.85,key=unit(seed,3*i+2)))
 eligible=sorted([v for v in initial if v['eligible']],key=lambda v:(v['key'],v['index']));count=int(coherence*len(eligible));selected={v['index']for v in eligible[:count]};dots=[]
 for p in initial:
  coherent=p['index']in selected;theta=direction*math.pi/180 if coherent else 2*math.pi*unit(seed,1000+p['index']);vx=speed*float(mp.cos(m(theta)));vy=speed*float(mp.sin(m(theta)));x=-2+((p['x']+phase*vx+2)%4+4)%4;y=-1.5+((p['y']+phase*vy+1.5)%3+3)%3
  dots.append(dict(index=p['index'],startX=p['x'],startY=p['y'],x=x,y=y,vx=vx,vy=vy,coherent=coherent,eligible=p['eligible']))
 return dict(seed=seed,phase=phase,dots=dots,eligibleCount=len(eligible),coherentCount=count,**pack(requestedCoherence=coherence,actualMaskCoherence=F(count,len(eligible))if eligible else 0),approximateMotion=True,illustration=True)
def necker(p):
 front=p.get('front','lower left');first=[(-1,-1),(.65,-1),(.65,.65),(-1,.65)];vertices=first+[(F(x)+F(.65),F(y)+F(.5))for x,y in first]
 return dict(vertices=[xy(*v)for v in vertices],edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],frontFace=[]if front=='flat'else[0,1,2,3]if front=='lower left'else[4,5,6,7],front=front,illustration=True)
def mullerLyer(p):
 L=F(p.get('comparison',6));flen=p.get('finLength',.9);angle=p.get('finAngle',40)*math.pi/180;dx=flen*float(mp.cos(m(angle)));dy=flen*float(mp.sin(m(angle)));context=p.get('context',True);fins=[]
 for y,length,hand in[(1,6,-1),(-1,float(L),1)]:
  for end,direction in[(-length/2,1),(length/2,-1)]:
   for s in[-1,1]:fins.append([[end,y],[end+direction*hand*dx,y+s*dy]])
 return dict(target=[xy(-3,1),xy(3,1)],comparison=[xy(-L/2,-1),xy(L/2,-1)],fins=fins if context else[],**pack(targetLength=6,comparisonLength=L,matchError=L-6,relativeError=(L-6)/6),context=context,approximateFins=True,illustration=True)
def ponzo(p):
 L=F(p.get('comparison',2));c=F(p.get('convergence',.55));near=F(3.6);far=near*(1-c)
 return dict(**pack(nearRailGap=near,farRailGap=far,nearBar=2,farBar=L,inferredFarToNearDepth=1/(1-c),conditionalWorldSizeRatio=L/(2*(1-c)),matchError=L-2,relativeError=(L-2)/2),nearY=-.65,farY=.65,context=p.get('context','rails'),parallelLimit=not c,illustration=True)
def ebbinghaus(p):
 r=F(p.get('radius',.35));ratio=F(p.get('comparisonRatio',1));s=F(p.get('smallSurround',.16));l=F(p.get('largeSurround',.45));d=F(p.get('ringDistance',1.2));rr=r*ratio
 return dict(**pack(targetRadius=r,comparisonRadius=rr,radiusRatio=ratio,areaRatio=ratio*ratio,matchError=rr-r,relativeError=ratio-1,smallSurround=s,largeSurround=l,ringDistance=d,minimumCenterGap=d-max(r,rr)-l,minimumSurroundGap=d-2*l),surroundCenters=[[float(d)*math.cos(i*math.pi/3),float(d)*math.sin(i*math.pi/3)]for i in range(6)],context=p.get('context','small left'),approximateSurroundPositions=True,illustration=True)
def amesRoom(p):
 L=F(p.get('leftDepth',4));R=F(p.get('rightDepth',8));C=F(p.get('cameraX',0));CY=F(p.get('cameraY',0));S=F(p.get('figureHeight',2.4));corners=[]
 for u,z in[(F(-1.1),L),(F(1.1),R)]:
  for v in map(F,[-.6,.9]):
   X=u*z;Y=v*z;corners.append(pack(worldX=X,worldY=Y,depth=z,imageX=(X-C)/z,imageY=(Y-CY)/z))
 figures=[pack(worldX=F(u)*z,depth=z,worldHeight=S,imageX=(F(u)*z-C)/z,imageBase=F(-.6)-CY/z,imageHeight=S/z)for u,z in[(-.75,L),(.75,R)]]
 return dict(corners=corners,figures=figures,**pack(leftDepth=L,rightDepth=R,cameraX=C,cameraY=CY,figureHeight=S,imageHeightLeftToRight=R/L,backWallTopWidth=F(2.2)+C*(1/L-1/R)),rectangularBackProjection=not CY or L==R,surfaceConstruction='Authored back-wall corners; connecting surfaces are explicit triangles, not a historical room reconstruction.',illustration=True)
def moonIllusion(p):
 e=p.get('elevation',10);d=F(p.get('angularDiameter',.5));theta=e*math.pi/180
 return dict(**pack(angularDiameter=d,currentRadius=30*d,referenceRadius=30*d,diameterRatio=1),currentPosition=[.82*float(mp.cos(m(theta))),.15+.72*float(mp.sin(m(theta)))],referencePosition=[-.7,.87],elevation=e,context=p.get('context',True),schematicSky=True,illustration=True)

def monocularScene(p):
 n=F(p.get('nearDepth',3));f=F(p.get('farDepth',8));c=F(p.get('cameraX',0));rule=p.get('sizeRule','equal world height');sizes=[F(2),2*f/n if rule=='equal image height'else F(2)];objects=[]
 for i,(x,z)in enumerate([(F(-.8),n),(F(.8),f)]):
  scale=1/z;objects.append(pack(worldX=x,worldHeight=sizes[i],depth=z,imageX=(x-c)*scale,imageBase=-scale,imageHeight=sizes[i]*scale,referenceImageX=x*scale,parallaxShift=(x-c)*scale-x*scale,cameraDerivative=-scale))
 return dict(objects=objects,occluder=pack(worldX=0,depth=F(1.5),worldHeight=F(1.2),worldHalfWidth=F(.18),imageX=-c/F(1.5),imageBase=-1/F(1.5),imageHeight=F(1.2)/F(1.5),imageHalfWidth=F(.18)/F(1.5)),**pack(nearDepth=n,farDepth=f,cameraX=c,imageHeightRatio=(sizes[0]/n)/(sizes[1]/f),worldHeightRatio=sizes[0]/sizes[1]),sizeRule=rule,illustration=True)

rows=[]
def add(name,p):rows.append(dict(name=name,parameters=p,expected=globals()[name](p)))
rng=random.Random(6189)
names=['figureGround','proximity','similarity','continuation','gaborSample','closure','commonFate','necker','mullerLyer','ponzo','ebbinghaus','amesRoom','moonIllusion']
for name in names:add(name,{})
for i in range(20):
 add('figureGround',dict(width=rng.uniform(.4,1.5),asymmetry=rng.uniform(-.25,.25)))
 add('proximity',dict(horizontalGap=rng.uniform(.6,1.8),verticalGap=rng.uniform(.6,1.8)))
 add('similarity',dict(horizontalGap=rng.uniform(.6,1.8),verticalGap=rng.uniform(.6,1.8),contrast=rng.random(),pattern=['rows','columns','checkerboard'][i%3]))
 add('continuation',dict(seed=rng.randrange(1000),jitter=rng.uniform(0,70),clutter=i%5*15))
 add('gaborSample',dict(x=rng.uniform(-.5,.5),y=rng.uniform(-.5,.5),orientation=rng.uniform(-math.pi,math.pi),frequency=rng.uniform(.5,8),sigma=rng.uniform(.05,.5)))
 add('closure',dict(rotation=rng.uniform(-180,180),radius=rng.uniform(.15,.5)))
 add('commonFate',dict(seed=rng.randrange(1000),coherence=rng.random(),speed=rng.uniform(.1,.6),direction=rng.uniform(-180,180),phase=rng.uniform(0,8)))
 add('mullerLyer',dict(comparison=rng.uniform(3,9),finLength=rng.uniform(.3,1.5),finAngle=rng.uniform(20,75),context=bool(i%2)))
 add('ponzo',dict(comparison=rng.uniform(1,3),convergence=rng.uniform(0,.7),context=['none','rails','rails and texture'][i%3]))
 add('ebbinghaus',dict(radius=rng.uniform(.25,.45),comparisonRatio=rng.uniform(.7,1.3),smallSurround=rng.uniform(.12,.2),largeSurround=rng.uniform(.35,.5),ringDistance=rng.uniform(1.15,1.5),context=['small left','large left','none'][i%3]))
 add('amesRoom',dict(leftDepth=rng.uniform(3,9),rightDepth=rng.uniform(3,9),cameraX=rng.uniform(-1,1),cameraY=rng.uniform(-.6,.6),figureHeight=rng.uniform(1.2,3)))
 add('moonIllusion',dict(elevation=rng.uniform(0,90),angularDiameter=rng.uniform(.4,.6),context=bool(i%2)))
for name,p in [('proximity',dict(horizontalGap=1,verticalGap=1)),('proximity',dict(horizontalGap=1,verticalGap=math.nextafter(1,2))),('proximity',dict(horizontalGap=1,verticalGap=math.nextafter(1,0))),('similarity',dict(contrast=0)),('continuation',dict(jitter=0,clutter=0)),('closure',dict(rotation=180)),('commonFate',dict(coherence=0,phase=0)),('commonFate',dict(coherence=1,phase=8)),('mullerLyer',dict(comparison=math.nextafter(6,7))),('ponzo',dict(convergence=0)),('ebbinghaus',dict(radius=.45,comparisonRatio=1.3,largeSurround=.5,ringDistance=1.15)),('amesRoom',dict(leftDepth=9,rightDepth=9,cameraX=1)),('moonIllusion',dict(elevation=90)),('gaborSample',dict(x=0,y=0)),('gaborSample',dict(x=1e-160,y=0))]:add(name,p)
for pp in [dict(cameraX=1),dict(cameraY=.6),dict(cameraY=-.6),dict(leftDepth=9,rightDepth=9,cameraY=.6)]:add('amesRoom',pp)
for front in ['lower left','upper right','flat']:add('necker',dict(front=front))
add('monocularScene',{})
for i in range(20):add('monocularScene',dict(nearDepth=rng.uniform(2,6),farDepth=rng.uniform(6,12),cameraX=rng.uniform(-1,1),sizeRule=['equal world height','equal image height'][i%2]))
for p in [dict(nearDepth=6,farDepth=6),dict(nearDepth=2,farDepth=12,sizeRule='equal image height'),dict(cameraX=math.ulp(0.0))]:add('monocularScene',p)


rows=foundation_rows+rows
payload=dict(cases=len(rows),families=len({v['name']for v in rows}),scope='Independent Fraction geometry, trapezoidal/Bezier area, forward stereo ownership, quadratic-variance minimization and high-precision transcendental references. Finite quantities exact; numerical angle values four-ULP budget, other numerical stimulus coordinates2e-14*max(1,abs(value)), Gabor amplitude4e-13, natural logarithms8e-12.',rows=rows)
file=Path(os.environ.get('PSYCH_REFERENCE_OUT',str(root/'fixtures'/'wave6-psych-reference.json')))
file.write_text(json.dumps(payload,separators=(',',':'),allow_nan=False)+'\n')
print(len(rows),'cases',payload['families'],'families',file)
