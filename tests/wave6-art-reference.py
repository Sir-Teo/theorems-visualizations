"""Independent ART6 corpus. No production JS imports or generated production data.

mpmath arithmetic, exact rational input ramps, pairwise second differences,
periodic line-coverage probabilities, and independent matrix algebra.
"""
from pathlib import Path
from fractions import Fraction as F
from functools import lru_cache
import argparse,json,itertools,math,time
import mpmath as mp

parser=argparse.ArgumentParser();parser.add_argument('--digits',type=int,default=90);parser.add_argument('--out',required=True);args=parser.parse_args();mp.mp.dps=args.digits
start=time.monotonic()
def m(x):
 if isinstance(x,F):return mp.mpf(x.numerator)/x.denominator
 return mp.mpf(str(x))
def clean(x):return mp.mpf(0) if abs(x)<1000*mp.eps else x
def scalar(x):
 if isinstance(x,(mp.mpf,F)):return float(x)
 if isinstance(x,(tuple,list)):return [scalar(v)for v in x]
 if isinstance(x,dict):return {k:scalar(v)for k,v in x.items()}
 return x
def clamp(x,a=0,b=1):return max(m(a),min(m(b),m(x)))
def mix(a,b,t):return [x+(y-x)*t for x,y in zip(a,b)]
def gray(x):return [x,x,x]
def matmul(A,v):return [sum(x*y for x,y in zip(row,v))for row in A]
M=[[m(F(506752,1228815)),m(F(87881,245763)),m(F(12673,70218))],[m(F(87098,409605)),m(F(175762,245763)),m(F(12673,175545))],[m(F(7918,409605)),m(F(87881,737289)),m(F(1001167,1053270))]]
MI=[list(row)for row in (mp.matrix(M)**-1).tolist()]
BR=[[m(x)for x in row]for row in [['.8951','.2664','-.1614'],['-.7502','1.7135','.0367'],['.0389','-.0685','1.0296']]];BRI=(mp.matrix(BR)**-1).tolist()
def white(x,y):x,y=m(x),m(y);return [x/y,m(1),(1-x-y)/y]
D65=white('.3127','.3290');D50=white('.3457','.3585');W={'D65':D65,'D50':D50,'A':white('.44757','.40745'),'cool':white('.25','.25')}
@lru_cache(None)
def dec(x):x=m(x);return x/m('12.92')if x<=m('.04045')else((x+m('.055'))/m('1.055'))**m('2.4')
def enc(x):return m('12.92')*x if x<=m('.0031308')else m('1.055')*x**(m(1)/m('2.4'))-m('.055')
def rounded(x):return int(mp.floor(x+m('.5')))
def xyz(rgb):return matmul(M,[dec(m(x)/255)for x in rgb])
def linear(rgb):return matmul(M,rgb)
def preview(q):
 v=[clean(x)for x in matmul(MI,q)];return dict(rgb=[rounded(255*enc(clamp(x)))for x in v],linear=v,clipped=any(x< -m('1e-10')or x>1+m('1e-10')for x in v))
def lab(q,w=D65):
 def f(x):return mp.root(x,3)if x>m(F(216,24389))else(m(F(24389,27))*x+16)/116
 t=[f(x/y)for x,y in zip(q,w)];return [clean(116*t[1]-16),clean(500*(t[0]-t[1])),clean(200*(t[1]-t[2]))]
def distance(a,b):return clean(mp.sqrt(sum((x-y)**2 for x,y in zip(a,b))))
def stimulus(rgb):q=xyz(rgb);return dict(rgb=rgb,xyz=q,lab=lab(q),Y=q[1])
def grayY(Y):return gray(rounded(255*enc(clamp(Y))))
def hsv(h,s=1,v=1):
 h,s,v=m(h)%360,m(s),m(v);z=h/60;c=v*s;x=c*(1-abs(z%2-1));offset=v-c
 return [a+offset for a in ([c,x,0]if z<1 else[x,c,0]if z<2 else[0,c,x]if z<3 else[0,x,c]if z<4 else[x,0,c]if z<5 else[c,0,x])]
def hsv8(h,s='.55',v='.75'):return [rounded(255*x)for x in hsv(h,s,v)]
@lru_cache(None)
def kernel(sigma,radius=None):
 sigma=m(sigma);r=int(mp.ceil(3*sigma))if radius is None else radius;raw=[mp.exp(-m(i*i)/(2*sigma*sigma))for i in range(-r,r+1)];s=sum(raw);return tuple(x/s for x in raw)
def correction(input,k,periodic=False):
 r=(len(k)-1)//2;n=len(input)
 return [sum(w*m(input[(i+d)%n if periodic else max(0,min(n-1,i+d))]-input[i])for d,w in zip(range(-r,r+1),k))for i in range(n)]
@lru_cache(None)
def spatial(pattern,sigma,ratio):
 r=int(mp.ceil(3*m(sigma)*m(ratio)));kc=kernel(sigma,r);ks=kernel(m(sigma)*m(ratio),r)
 input=[F(45,100)if pattern=='uniform'else(F(int(i==64))if pattern=='impulse'else(F(8,10)if abs(i-64)<16 else F(2,10))if pattern=='bar'else F(2 if i<64 else 8,10))for i in range(129)]
 return r,kc,ks,input,correction(input,kc),correction(input,ks)
def centreSurround(a):
 sigma,ratio,w=a['sigma'],a['ratio'],m(a['strength']);r,kc,ks,input,cc,cs=spatial(a['stimulus'],sigma,ratio);c=[m(x)+q for x,q in zip(input,cc)];s=[m(x)+q for x,q in zip(input,cs)];response=[(1-w)*m(x)+x1-w*x2 for x,x1,x2 in zip(input,cc,cs)];p=a['position']
 return dict(n=129,radius=r,center=kc,surround=ks,kernel=[x-w*y for x,y in zip(kc,ks)],input=input,c=c,s=s,response=response,dc=1-w,position=p,selected=dict(input=input[p],center=c[p],surround=s[p],response=response[p]))
@lru_cache(None)
def ramp(sigma,width,profile):
 knees=[F(80)-F(width,2),F(80)+F(width,2)]
 if profile=='steps':input=[F(18,100)+F(54,100)*(max(0,min(6,math.floor(F(i-20,120)*6))))/6 for i in range(161)]
 else:input=[F(18,100)+F(54,100)*max(F(0),min(F(1),(F(i)-knees[0])/width))for i in range(161)]
 k=kernel(sigma);r=(len(k)-1)//2
 # Symmetric second differences; affine pieces cancel exactly as Fractions.
 detail=[sum(k[r+d]*m(2*input[i]-input[max(0,i-d)]-input[min(160,i+d)])for d in range(1,r+1))for i in range(161)]
 return knees,input,k,detail
def mach(a):
 knees,input,k,detail=ramp(a['sigma'],a['width'],a['profile']);enhanced=[m(x)+m(a['strength'])*y for x,y in zip(input,detail)]
 return dict(n=161,knees=knees,input=input,kernel=k,blur=[m(x)-y for x,y in zip(input,detail)],detail=detail,enhanced=enhanced,minimum=min(enhanced),maximum=max(enhanced),maximumDetail=max(map(abs,detail)),clipped=any(x<0 or x>1 for x in enhanced))
def contrast(a):
 targets=[stimulus(gray(a['target']))for _ in range(2)];bg=([gray(a['left']),gray(a['right'])]if a['grounds']=='gray'else[hsv8(a['hue'],'.6','.75'),hsv8(a['hue']+180,'.6','.75')]);b=[stimulus(q)for q in bg]
 return dict(targets=targets,backgrounds=b,bridge=a['bridge'],deltaE=0,differences=[targets[0]['Y']-q['Y']for q in b])
def albers(a):
 bg=([hsv8(a['hue'],'.7','.78'),hsv8(a['hue']+180,'.7','.78')]if a['grounds']=='chromatic'else[gray(42),gray(218)]);b=[stimulus(q)for q in bg];base=hsv8(a['hue']+85,'.25','.64');targets=[base,base]if a['exercise']=='one'else[[rounded(clamp(m(x)+m(a['separation'])*(q-128)/128,0,255))for x,q in zip(base,row)]for row in bg];t=[stimulus(q)for q in targets]
 return dict(exercise=a['exercise'],backgrounds=b,targets=t,bridge=a['bridge'],deltaE=distance(t[0]['lab'],t[1]['lab']),rgbDifference=[y-x for x,y in zip(*targets)])
def assimilation(a):
 red=[190,65,80];lines=[gray(18),gray(238)];period=a['period'];width=a['width'];phase=a['phase']%period;k=kernel(a['sigma']);r=(len(k)-1)//2
 # Independent weighted line-coverage probabilities, then RGB linearity.
 coverage=[sum(w for d,w in zip(range(-r,r+1),k)if (i+d)%period<width)for i in range(period)]
 raw=[[list(map(lambda x:dec(m(x)/255),line if i<width else red))for i in range(period)]for line in lines]
 pooled=[[[dec(m(red[c])/255)+(dec(m(line[c])/255)-dec(m(red[c])/255))*p for p in coverage]for c in range(3)]for line in lines];channels=[[c[phase]for c in row]for row in pooled];q=[linear(row)for row in channels];means=[[dec(m(red[c])/255)+(dec(m(line[c])/255)-dec(m(red[c])/255))*F(width,period)for c in range(3)]for line in lines]
 return dict(red=red,lines=lines,width=width,period=period,sigma=a['sigma'],phase=phase,k=k,input=raw,pooled=pooled,channels=channels,xyz=q,previews=[preview(v)for v in q],mean=means,meanXYZ=[linear(v)for v in means],raw=stimulus(red),sampleIsRed=phase>=width)
R=[[m(x)for x in row]for row in [['.72','.12','.06'],['.05','.3','.58'],['.18','.44','.12'],['.6','.45','.1'],['.52','.5','.43'],['.24','.1','.32']]]
def illumination(w):w=m(w);return[1-m('.28')*max(0,-w),1-m('.12')*abs(w),1-m('.4')*max(0,w)]
def constancy(a):
 E=illumination(a['warmth']);d=m(a['degree']);g=[x**(-d)for x in E];raw=[[x*y for x,y in zip(r,E)]for r in R];corrected=[[x*y**(1-d)for x,y in zip(r,E)]for r in R];rxyz=list(map(linear,R));rawxyz=list(map(linear,raw));cxyz=list(map(linear,corrected))
 return dict(E=E,gains=g,reference=R,raw=raw,corrected=corrected,referenceXYZ=rxyz,rawXYZ=rawxyz,correctedXYZ=cxyz,rawError=[distance(lab(x),lab(y))for x,y in zip(rawxyz,rxyz)],correctedError=[distance(lab(x),lab(y))for x,y in zip(cxyz,rxyz)])
def transform(q,src,dst,d):
 source=matmul(BR,src);dest=matmul(BR,dst);g=[(y/x)**d for x,y in zip(source,dest)];basis=matmul(BR,q);scaled=[x*y for x,y in zip(basis,g)];out=matmul(BRI,scaled)if d else q
 return dict(source=source,destination=dest,gains=g,basis=basis,scaled=scaled,xyz=out)
def vonKries(a):
 rgb=[a['red'],a['green'],a['blue']];q=xyz(rgb);d=m(a['degree']);src,dst=W[a['from']],W[a['to']];r=transform(q,src,dst,d);white=dst if d==1 else src if d==0 else transform(src,src,dst,d)['xyz']
 return dict(rgb=rgb,**r,originalXYZ=q,back=q,white=white,preview=preview(r['xyz']),whiteError=distance(lab(white,dst),lab(dst,dst)),roundtrip=0)
MON=[[m(x)for x in row]for row in [['.74','.1','.07'],['.07','.42','.18'],['.08','.14','.62'],['.7','.55','.08'],['.52','.1','.36'],['.08','.48','.56'],['.68','.64','.54'],['.19','.18','.16'],['.4','.25','.1'],['.25','.4','.45'],['.52','.38','.44'],['.13','.32','.12']]]
def retinex(a):
 E=illumination(a['warmth']);reflectances=[list(q)if a['context']=='varied'else[m('.3')+(x-m('.3'))*m('.35')for x in q]for q in MON];reflectances[0]=gray(m('.3'));spatial=[1-m(a['gradient'])*F(i%4,3)for i in range(12)];raw=[[x*e*spatial[i]for x,e in zip(q,E)]for i,q in enumerate(reflectances)];maxima=list(map(max,zip(*raw)));norm=[[x/y for x,y in zip(q,maxima)]for q in raw];ratios=[[y/x for x,y in zip(l,r)]for l,r in zip(raw,raw[1:])];direct=[y/x for x,y in zip(raw[0],raw[-1])];i=a['selected']
 return dict(E=E,reflectances=reflectances,spatial=spatial,raw=raw,maxima=maxima,normalized=norm,ratios=ratios,chain=direct,direct=direct,selected=i,reference=reflectances[i],sample=raw[i],estimate=norm[i])
DRESS=[[118,137,172],[112,94,65]]
def dress(a):
 raw=[stimulus(q)for q in DRESS];white=W[a['assumption']];r=[transform(q['xyz'],white,D65,m(a['degree']))for q in raw];est=[q['xyz']for q in r]
 return dict(raw=raw,assumption=a['assumption'],white=white,gains=r[0]['gains'],estimates=est,previews=[preview(q)for q in est],coordinates=[lab(q)for q in est],rawCoordinates=[q['lab']for q in raw])
def xy(q):s=sum(q);return [q[0]/s,q[1]/s]if s else None
def polar(q):
 L,a,b=lab(q);C=mp.sqrt(a*a+b*b);return dict(L=L,C=C,h=None if C<m('1e-10')else(mp.atan2(b,a)*180/mp.pi)%360)
def hueChanges(a):
 base=hsv(a['hue']);bxyz=linear(base);Y=bxyz[1];neutral=gray(Y);gain=m(a['gain']);pure=[x*gain for x in base];neutralScaled=[x*gain for x in neutral];mixed=mix(pure,neutralScaled,m(a['whiteMix']));q=linear(mixed)
 intensity=[];purity=[]
 for i in range(21):
  t=F(1,20)+F(19,20)*F(i,20);p=linear([x*m(t)for x in base]);intensity.append(dict(t=t,xyz=p,xy=xy(p),polar=polar(p)))
  t=F(i,20);p=linear(mix(pure,neutralScaled,m(t)));purity.append(dict(t=t,xyz=p,xy=xy(p),polar=polar(p)))
 return dict(base=base,baseXYZ=bxyz,neutral=neutral,gain=gain,whiteMix=a['whiteMix'],pure=pure,mixed=mixed,xyz=q,xy=xy(q),polar=polar(q),preview=preview(q),intensity=intensity,purity=purity)
def brightness(a):
 Y=m(a['Y']);match=m(a['match']);sat=hsv(a['hue']);baseY=linear(sat)[1];colour=mix(gray(Y),[x*Y/baseY for x in sat],m(a['purity']));q=linear(colour);equal=linear(gray(Y));personal=linear(gray(match));p=preview(q);e=preview(equal);u=preview(personal)
 return dict(colour=colour,xyz=q,equalXYZ=equal,matchXYZ=personal,Y=Y,match=match,ratio=match/Y,preview=p,equal=e,personal=u,encodedY=[xyz(x['rgb'])[1]for x in [p,e,u]],polar=polar(q))
def checkerValue(u,w,shadow=True):
 u,w=m(u),m(w)
 if not(0<=u<6 and 0<=w<6):return None
 dark=dec(m(110)/255);light=dec(m(210)/255);ref=light if(int(mp.floor(u))+int(mp.floor(w)))%2 else dark;d=mp.sqrt(((u-m('4.4'))/2)**2+((w-m('3.3'))/m('1.65'))**2);t=clamp((d-m('.78'))/m('.34'));mask=1-t*t*(3-2*t)if shadow else 0;Y=dark if mask==1 and ref==light else ref*(1-mask*(1-dark/light))
 return dict(reflectance=ref,mask=mask,Y=Y,rgb=grayY(Y))
def checker(a):
 at=lambda t:checkerValue(F(3,2)+3*t,F(3,2)+2*t,a['shadow']);A=at(F(0));B=at(F(1));transect=[dict(t=F(i,100),**at(F(i,100)))for i in range(101)]
 return dict(shadow=a['shadow'],bridge=a['bridge'],probe=a['probe'],A=A,B=B,deltaY=clean(B['Y']-A['Y']),deltaRGB=[y-x for x,y in zip(A['rgb'],B['rgb'])],positions=[[0,F(3,2)],[1,4]],same=A['rgb']==B['rgb'],transect=transect,sample=at(F(a['probe'],100)))
def equiluminance(a):
 colours=[stimulus([a['red'],0,0]),stimulus([0,a['green'],0])];Ys=[q['Y']for q in colours];ideal=255*enc(Ys[0]/M[1][1]);nearest=min(range(256),key=lambda i:abs(M[1][1]*dec(m(i)/255)-Ys[0]))
 return dict(colours=colours,Ys=Ys,idealGreen=ideal,nearestGreen=nearest,contrast=(Ys[1]-Ys[0])/sum(Ys),cycles=a['cycles'],phase=m(a['phase'])%1,speed=a['speed'],proxy=list(map(grayY,Ys)),reference=[gray(42),gray(220)])
def chevreul(a):
 target=stimulus([145,125,104]);surrounds=[stimulus(hsv8(a['hue'],'.65','.8')),stimulus(hsv8(a['hue']+180,'.65','.8'))];neutral=gray(m('.25'));input=[dec(m(x)/255)for x in target['rgb']];vectors=[[n-dec(m(x)/255)for n,x in zip(neutral,q['rgb'])]for q in surrounds];predicted=[[x+m(a['strength'])*y for x,y in zip(input,q)]for q in vectors];q=list(map(linear,predicted))
 return dict(target=target,surrounds=surrounds,neutral=neutral,input=input,vectors=vectors,predicted=predicted,xyz=q,previews=[preview(x)for x in q],density=a['density'],bridge=a['bridge'],deltaE=distance(lab(q[0]),lab(q[1])))
def sceneSample(a):
 x,y=m(a['x']),m(a['y']);q=[m(z)for z in (['.24','.255','.26']if y<m('2.65')else['.12','.145','.16'])];shadow=mp.exp(-(((x-m('4.8'))/m('3.3'))**2+((y-m('2.08'))/m('.36'))**2))
 if y<m('2.65'):q=[z*(1-m('.5')*shadow)for z in q]
 if m('6.3')<x<m('8.6')and m('2.3')<y<m('5.7'):q=[z*(m('.67')+m('.2')*(m('8.6')-x)/m('2.3'))for z in R[3]]
 taper=m('.87')+m('.18')*mp.cos((y-m('3.7'))*m('1.7'));vx=(x-3)/taper
 if m('2.25')<y<m('5.75')and abs(vx)<1:q=[z*(m('.48')+m('.5')*mp.sqrt(max(0,1-vx*vx)))*(1-m('.08')*(y-m('2.25'))/m('3.5'))for z in R[0]]
 sx=(x-m('6.35'))/m('1.47');sy=(y-m('3.18'))/m('1.47');r2=sx*sx+sy*sy
 if r2<=1:
  nz=mp.sqrt(1-r2);shade=m('.23')+m('.77')*max(0,-m('.45')*sx+m('.55')*sy+m('.7')*nz);q=[z*shade for z in R[1]]
 bx=(x-m('4.4'))/m('1.58');by=(y-m('1.96'))/m('.65')
 if bx*bx+by*by<1 and y<m('2.16'):q=[z*(m('.42')+m('.45')*mp.sqrt(max(0,1-bx*bx-by*by)))for z in R[2]]
 if((x-m('4.4'))/m('1.58'))**2+((y-m('2.16'))/m('.2'))**2<1:q=[z*m('.4')for z in R[2]]
 return q

DEFAULTS={
 'centreSurround':dict(sigma=4,ratio=3,strength=.75,position=64,stimulus='edge'),
 'mach':dict(sigma=4,width=48,strength=.8,profile='ramp'),
 'contrast':dict(target=128,left=40,right=215,hue=30,grounds='gray',bridge=0),
 'albers':dict(exercise='one',hue=25,separation=24,grounds='chromatic',bridge=0),
 'assimilation':dict(width=3,period=24,sigma=7,phase=12),
 'constancy':dict(warmth=.8,degree=1),
 'vonKries':dict(red=180,green=100,blue=60,**{'from':'D65','to':'D50'},degree=1),
 'retinex':dict(warmth=.7,gradient=0,selected=0,context='varied'),
 'dress':dict(assumption='cool',degree=.75),
 'hueChanges':dict(hue=230,gain=.6,whiteMix=.25),
 'brightness':dict(hue=25,purity=.85,Y=.05,match=.05),
 'checker':dict(shadow=True,bridge=0,probe=50),
 'equiluminance':dict(red=190,green=109,cycles=6,phase=0,speed=.2),
 'chevreul':dict(hue=25,strength=.25,density=8,bridge=0),
 'sceneSample':dict(x=6.35,y=3.18),
}
CASES=[];SEEN=set()
def add(f,**a):
 a={**DEFAULTS[f],**a};key=f+json.dumps(a,sort_keys=True)
 if key not in SEEN:CASES.append(dict(family=f,args=a));SEEN.add(key)
for f in DEFAULTS:add(f)
for pattern,sigma,ratio,w in itertools.product(['edge','bar','impulse','uniform'],[1,4,8],[1.5,3,4],[0,.75,1,1.5]):add('centreSurround',stimulus=pattern,sigma=sigma,ratio=ratio,strength=w,position=0 if w==0 else 128 if w==1.5 else 64)
for sigma,width,w,profile in itertools.product([1,4,12],[8,48,112],[0,.8,2],['ramp','steps']):add('mach',sigma=sigma,width=width,strength=w,profile=profile)
for target,grounds,hue in itertools.product([0,128,255],['gray','chromatic'],[0,30,180,360]):add('contrast',target=target,left=0,right=255,grounds=grounds,hue=hue,bridge=1)
for exercise,grounds,hue,separation in itertools.product(['one','two'],['chromatic','neutral'],[0,25,180,360],[0,24,48]):add('albers',exercise=exercise,grounds=grounds,hue=hue,separation=separation,bridge=1)
for width,sigma,phase in itertools.product([1,3,12],[1,7,18],[0,1,12,23]):add('assimilation',width=width,sigma=sigma,phase=phase)
for warmth,d in itertools.product([-1,0,.8,1],[0,.5,1]):add('constancy',warmth=warmth,degree=d)
for rgb,src,dst,d in itertools.product([[0,0,0],[255,255,255],[255,0,0],[0,255,0],[0,0,255],[180,100,60]],W,W,[0,.5,1]):add('vonKries',**dict(zip(['red','green','blue'],rgb)),**{'from':src,'to':dst},degree=d)
for warmth,gradient,selected,context in itertools.product([-1,0,.7],[0,.3,.7],range(12),['varied','compressed']):add('retinex',warmth=warmth,gradient=gradient,selected=selected,context=context)
for assumption,d in itertools.product(W,[0,.75,1]):add('dress',assumption=assumption,degree=d)
for hue,gain,wm in itertools.product([0,25,60,120,180,230,300,359.99,360],[.05,.6,1],[0,.25,1]):add('hueChanges',hue=hue,gain=gain,whiteMix=wm)
for hue,purity,Y,match in itertools.product(range(0,360,30),[0,.5,1],[.01,.05,.07],[.005,.05,.3]):add('brightness',hue=hue,purity=purity,Y=Y,match=match)
for shadow,bridge,probe in itertools.product([True,False],[0,.5,1],[0,1,25,50,75,99,100]):add('checker',shadow=shadow,bridge=bridge,probe=probe)
for red in range(64,256):add('equiluminance',red=red)
for green,phase,cycles,speed in itertools.product([0,108,109,255],[0,.37,1],[2,12],[.05,.6]):add('equiluminance',green=green,phase=phase,cycles=cycles,speed=speed)
for hue,w,density,bridge in itertools.product([0,25,90,180,270,360],[0,.25,.5],[4,24],[0,1]):add('chevreul',hue=hue,strength=w,density=density,bridge=bridge)
for x,y in itertools.product([.1,3,4.4,6.35,8.5,9.9],[1,2.16,3.18,5.75,7]):add('sceneSample',x=x,y=y)

families={f:0 for f in DEFAULTS}
for i,row in enumerate(CASES):
 row['expected']=scalar(globals()[row['family']](row['args']));families[row['family']]+=1
 if i%100==0:print(json.dumps(dict(completed=i,total=len(CASES),seconds=round(time.monotonic()-start,2))),flush=True)
payload={'scope':'Independent high-precision complete ART6 objects; exact rational ramps, independent line-coverage pooling, matrix inversion and exhaustive nearest-byte Y search. No JS imports. Near algebraic zeros cleaned only below1000 mpmath eps; finite signals are otherwise retained.','families':families,'cases':CASES}
Path(args.out).write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':'))+'\n');print(json.dumps(dict(cases=len(CASES),families=families,seconds=round(time.monotonic()-start,2))),flush=True)
