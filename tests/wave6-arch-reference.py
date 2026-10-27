#!/usr/bin/env python3
"""Independent ARCH6 oracle: mpmath arithmetic, LU equilibrium, scalar energies.

Never imports or invokes the production JavaScript. The corpus compares complete
returned objects. Finite quadrature is reproduced as a finite mathematical sum;
its accuracy against continuum area is checked separately by the JS gate.
"""
import argparse,json,random,math
from collections import Counter
from functools import lru_cache
import mpmath as mp
parser=argparse.ArgumentParser();parser.add_argument('--dps',type=int,default=90);parser.add_argument('--output',default='tests/fixtures/wave6-arch-reference.json');args=parser.parse_args();mp.mp.dps=args.dps
# Native controls serialize IEEE754 values. Near folds the binary input, rather
# than its rounded decimal spelling, is the quantity the oracle must evaluate.
M=lambda x:mp.mpf(x)if isinstance(x,float)else mp.mpf(str(x))
def lin(n,a=-1,b=1):
 a,b=M(a),M(b);return [a+(b-a)*i/(n-1)for i in range(n)]
def add(a,b):return[x+y for x,y in zip(a,b)]
def sub(a,b):return[x-y for x,y in zip(a,b)]
def scale(a,k):return[x*k for x in a]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def norm(a):return mp.sqrt(dot(a,a))
def mesh(f,n=13):return[[f(x,y)for y in lin(n)]for x in lin(n)]
def curvedStiffness(a):
 h,t,l=map(M,[a['rise'],a['thin'],a['load']]);L=mp.sqrt(1+h*h);A=t/L;kb=t**3/2;ka=2*t*h*h/(1+h*h)**2;F=l*t
 return dict(rise=h,thin=t,length=L,area=A,volume=2*t,beamK=kb,axialK=ka,ratio=ka/kb,force=F,beamDeflection=F/kb,axialDeflection=F/ka if h else None,beamSmallDeflection=F/kb<=M('.02'),barNodes=[[-1,0,0],[0,0,h],[1,0,0]],curves=[[x,2*t*x*x/(1+x*x)**2/kb]for x in lin(71,0,'.7')])
def geometry(fx,fy,fxx,fxy,fyy):
 w=mp.sqrt(1+fx*fx+fy*fy);H=((1+fy*fy)*fxx-2*fx*fy*fxy+(1+fx*fx)*fyy)/(2*w**3);K=(fxx*fyy-fxy*fxy)/w**4;d=mp.sqrt(max(0,H*H-K))
 return dict(gradient=[fx,fy],hessian=[fxx,fxy,fyy],normal=[-fx/w,-fy/w,1/w],H=H,K=K,principal=[H+d,H-d])
def hypar(a):
 c,x,y,r=map(M,[a[k]for k in ['curvature','x','y','ruling']]);g=geometry(c*y,c*x,0,c,0)
 return dict(curvature=c,x=x,y=y,ruling=r,point=[x,y,c*x*y],**g,grid=mesh(lambda x,y:[x,y,c*x*y]),rulings=[[[r,t,c*r*t]for t in lin(25)],[[t,r,c*t*r]for t in lin(25)]],section=[[t,c*t*t]for t in lin(65)],otherSection=[[t,-c*t*t]for t in lin(65)])
def tensionPatch(a):
 k1,k2,T1,T2,p=map(M,[a[k]for k in ['k1','k2','T1','T2','pressure']]);c=[k1*T1,k2*T2];shape='flat'if k1==k2==0 else'anticlastic'if k1*k2<0 else'synclastic'if k1*k2>0 else'cylindrical'
 return dict(k1=k1,k2=k2,T1=T1,T2=T2,pressure=p,contributions=c,requiredPressure=-sum(c),residual=sum(c)+p,shape=shape,grid=mesh(lambda x,y:[x,y,(k1*x*x+k2*y*y)/2]),sections=[[[x,k1*x*x/2]for x in lin(65)],[[y,k2*y*y/2]for y in lin(65)]],originNormal=[0,0,1])
def scherk(a,x,y):return(mp.log(mp.cos(a*y))-mp.log(mp.cos(a*x)))/a if a else mp.mpf(0)
def minimalPoint(a,d,x,y):
 # Differentiate the scalar graph independently of JS's analytic derivatives.
 f=lambda u,v:scherk(a,u,v)+d*(1-u*u)*(1-v*v)
 fx=mp.diff(lambda u:f(u,y),x);fy=mp.diff(lambda v:f(x,v),y);fxx=mp.diff(lambda u:f(u,y),x,2);fyy=mp.diff(lambda v:f(x,v),y,2);fxy=mp.diff(lambda u:mp.diff(lambda v:f(u,v),y),x)
 g=geometry(fx,fy,fxx,fxy,fyy);raw=g['H'];g['H']=0 if d==0 else raw
 return dict(point=[x,y,f(x,y)],**g,floatingMeanResidual=raw)
@lru_cache(None)
def area(a,d):
 n=32;step=mp.mpf(2)/n;weights=[1 if i in(0,n)else 4 if i%2 else 2 for i in range(n+1)];total=0
 for i in range(n+1):
  x=-1+i*step
  for j in range(n+1):
   y=-1+j*step;u=mp.tan(a*x)-2*d*x*(1-y*y);v=-mp.tan(a*y)-2*d*y*(1-x*x);total+=weights[i]*weights[j]*mp.sqrt(1+u*u+v*v)
 return total*step*step/9
def minimalGraph(p):
 a,d,x,y=map(M,[p[k]for k in ['a','trial','x','y']]);return dict(a=a,trial=d,x=x,y=y,selected=minimalPoint(a,d,x,y),grid=mesh(lambda x,y:[x,y,scherk(a,x,y)+d*(1-x*x)*(1-y*y)]),area=area(a,d),baseArea=area(a,mp.mpf(0)),quadratureIntervals=32,areaCurve=[[v,area(a,v)]for v in lin(17,'-.4','.4')],boundary=[[[-1,t,scherk(a,-1,t)],[1,t,scherk(a,1,t)],[t,-1,scherk(a,t,-1)],[t,1,scherk(a,t,1)]]for t in lin(25)])
def cableNet(a):
 qx,qy,rise,load,bias=map(M,[a[k]for k in ['qX','qY','rise','load','bias']]);selected=a['selected'];flat=a['flatBoundary'];P=[];free=[];fixed=[];edges=[];q=[];loads=[]
 for i in range(5):
  for j in range(5):
   x,y=M(i)/2-1,M(j)/2-1;k=5*i+j;boundary=i in(0,4)or j in(0,4);P.append([x,y,rise*(x*x-y*y)if boundary and not flat else mp.mpf(0)]);(fixed if boundary else free).append(k);loads.append([0,0,0 if boundary else load*(1+bias*x)])
   if i<4:edges.append([k,k+5]);q.append(qx)
   if j<4:edges.append([k,k+1]);q.append(qy)
 # Incidence-matrix assembly and dense LU; production uses edge assembly/Cholesky.
 C=mp.matrix(len(edges),25)
 for e,(i,j)in enumerate(edges):C[e,i]=-1;C[e,j]=1
 Q=mp.diag(q);G=C.T*Q*C;L=mp.matrix([[G[i,j]for j in free]for i in free]);rhs=[[M(loads[i][d])-sum(G[i,j]*P[j][d]for j in fixed)for d in range(3)]for i in free]
 for d in range(3):
  answer=mp.lu_solve(L,mp.matrix([v[d]for v in rhs]))
  for k,i in enumerate(free):P[i][d]=answer[k]
 lengths=[norm(sub(P[j],P[i]))for i,j in edges];tensions=[l*w for l,w in zip(lengths,q)];internal=[scale([sum(G[i,j]*P[j][d]for j in range(25))for d in range(3)],-1)for i in range(25)];balances=[add(v,p)for v,p in zip(internal,loads)];residuals=[norm(balances[i])for i in free];node=free[selected];joint=[]
 for e,(i,j)in enumerate(edges):
  if node in(i,j):joint.append(scale(sub(P[j if i==node else i],P[node]),q[e]))
 joint.append(loads[node]);polygon=[[0,0,0]]
 for f in joint:polygon.append(add(polygon[-1],f))
 return dict(qX=qx,qY=qy,rise=rise,load=load,selected=selected,bias=bias,flatBoundary=flat,coordinates=P,free=free,fixed=fixed,edges=edges,densities=q,lengths=lengths,tensions=tensions,loads=loads,L=[list(L[i,:])for i in range(9)],rhs=rhs,balances=balances,residuals=residuals,maximumResidual=max(residuals),reactions=[scale(balances[i],-1)for i in fixed],node=node,jointForces=joint,forcePolygon=polygon,energy=sum(w*l*l for w,l in zip(q,lengths))/2-sum(dot(p,f)for p,f in zip(P,loads)))
NET=dict(qX=1,qY=1,rise=.8,load=-.3,selected=1,flatBoundary=False,bias=0)
def hangingModel(a):
 w,bias,change=map(M,[a[k]for k in ['weight','bias','loadChange']]);net=cableNet(dict(NET,load=-w,bias=bias,selected=a['selected'],flatBoundary=True));P=[[x,y,-z]for x,y,z in net['coordinates']];q=scale(net['densities'],-1);loads=[scale(f,change)for f in net['loads']];internal=[[0,0,0]for _ in P]
 for e,(i,j)in enumerate(net['edges']):f=scale(sub(P[j],P[i]),q[e]);internal[i]=add(internal[i],f);internal[j]=sub(internal[j],f)
 residuals=[norm(add(internal[i],loads[i]))for i in net['free']]
 return dict(weight=w,bias=bias,loadChange=change,selected=a['selected'],net=net,inverted=P,densities=q,loads=loads,compression=scale(net['tensions'],-1),residuals=residuals,maximumResidual=max(residuals),geometryMatchesDesignLoad=change==1 or w==0)
def dynamicRelaxation(a):
 c,dt=M(a['damping']),M(a['dt']);net=cableNet(dict(NET,**{k:a[k]for k in ['qX','qY','rise','load','selected']}));L=mp.matrix(net['L']);b=mp.matrix([v[2]for v in net['rhs']]);target=mp.matrix([net['coordinates'][i][2]for i in net['free']]);z=mp.matrix(9,1);v=-dt*b/2;den=1+c*dt/2;A=dt/den;B=(1-c*dt/2)/den;history=[]
 for n in range(a['steps']+1):
  R=b-L*z;next=(dt*R+(1-c*dt/2)*v)/den;velocity=(v+next)/2;error=z-target;history.append(dict(iteration=n,z=list(z),velocity=list(velocity),residual=list(R),kinetic=(velocity.T*velocity)[0]/2,potential=(error.T*L*error)[0]/2,residualNorm=mp.norm(R),errorNorm=mp.norm(error)))
  if n<a['steps']:z=z+dt*next;v=next
 lam=(2+mp.sqrt(2))*(M(a['qX'])+M(a['qY']));P=[list(p)for p in net['coordinates']]
 for j,i in enumerate(net['free']):P[i][2]=history[-1]['z'][j]
 return dict(damping=c,dt=dt,steps=a['steps'],selected=a['selected'],A=A,B=B,lambdaMax=lam,criticalStep=2/mp.sqrt(lam),stepFraction=dt*mp.sqrt(lam)/2,net=net,history=history,frame=history[-1],coordinates=P)
def gridshell(a):
 h,theta=M(a['rise']),M(a['shear'])*mp.pi/180;grid=mesh(lambda x,y:[x,y,h*(1-x*x)*(1-y*y)],11);edges=[]
 for i in range(11):
  for j in range(11):
   if i<10:edges.append([grid[i][j],grid[i+1][j]])
   if j<10:edges.append([grid[i][j],grid[i][j+1]])
 extensions=[norm(sub(b,a))*5-1 for a,b in edges];cell=[[0,0],[1,0],[1+mp.sin(theta),mp.cos(theta)],[mp.sin(theta),mp.cos(theta)]];diagonal=mp.sqrt(2+2*mp.sin(theta));rest=mp.sqrt(2);energy=(diagonal-rest)**2/2 if a['brace']else 0
 return dict(rise=h,shear=M(a['shear']),brace=a['brace'],grid=grid,edges=edges,extensions=extensions,maximumExtension=max(extensions),cell=cell,sideLengths=[norm(sub(cell[(i+1)%4],v))for i,v in enumerate(cell)],diagonal=diagonal,rest=rest,angle=90-M(a['shear']),energy=energy,energyCurve=[[d,(mp.sqrt(2+2*mp.sin(d*mp.pi/180))-rest)**2/2 if a['brace']else 0]for d in lin(71,-35,35)])
def tensegrity(a):
 R,h,q,twist=map(M,[a[k]for k in ['radius','height','prestress','twist']]);t0=5*mp.pi/6;theta=t0+twist*mp.pi/180;ls=mp.sqrt(h*h+4*R*R*mp.sin(t0/2)**2);lc=mp.sqrt(h*h+4*R*R*mp.sin(mp.pi/12)**2);rest=lc*(1-q/20)
 def form(d):
  t=t0+d*mp.pi/180;hh=mp.sqrt(ls*ls-2*R*R*(1-mp.cos(t)));length=mp.sqrt(ls*ls+2*R*R*(mp.cos(t)-mp.cos(t-2*mp.pi/3)));return dict(theta=t,height=hh,length=length,lengthIncrease=length-lc,energy=30*(length-rest)**2)
 current=form(twist);P=[[R*mp.cos(2*mp.pi*(i%3)/3+(theta if i>=3 else 0)),R*mp.sin(2*mp.pi*(i%3)/3+(theta if i>=3 else 0)),current['height']if i>=3 else 0]for i in range(6)];edges=[];types=[]
 for i in range(3):edges.extend([[i,(i+1)%3],[i+3,(i+1)%3+3],[i,(i+2)%3+3],[i,i+3]]);types.extend(['ring','ring','cross','strut'])
 qc=20*(current['length']-rest)/current['length'];densities=[-qc if t=='strut'else qc/mp.sqrt(3)if t=='ring'else qc for t in types];lengths=[norm(sub(P[j],P[i]))for i,j in edges];forces=[[0,0,0]for _ in P]
 for e,(i,j)in enumerate(edges):f=scale(sub(P[j],P[i]),densities[e]);forces[i]=add(forces[i],f);forces[j]=sub(forces[j],f)
 return dict(radius=R,height=h,prestress=q,twist=twist,theta=theta,strutLength=ls,crossLength=lc,stiffness=20,restLength=rest,current=current,energyChange=current['energy']-form(0)['energy'],coordinates=P,edges=edges,types=types,densities=densities,lengths=lengths,memberForces=[w*l for w,l in zip(densities,lengths)],balances=forces,maximumResidual=max(map(norm,forces)),selfEquilibriumForm=twist==0,symmetricTwistStiffness=3*mp.sqrt(3)*q*R*R,energyCurve=[[d,form(d)['energy']-form(0)['energy']]for d in lin(81,-10,10)])
def cap(a,N,alpha,h):
 R=(a*a+h*h)/(2*h)if h else None;k=2*h/(a*a+h*h);p=2*N*alpha/a;second=2*mp.pi*N-p*mp.pi*h;phi=2*mp.atan(h/a)
 def point(i,j):
  angle=phi*i/16;t=2*mp.pi*j/32
  return[a*M(i)/16*mp.cos(t),a*M(i)/16*mp.sin(t),0]if h==0 else[R*mp.sin(angle)*mp.cos(t),R*mp.sin(angle)*mp.sin(t),h-R+R*mp.cos(angle)]
 return dict(h=h,radius=R,curvature=k,phi=phi,area=mp.pi*(a*a+h*h),volume=mp.pi*h*(3*a*a+h*h)/6,pressureCheck=2*N*k,secondDerivative=second,stability='minimum'if h<a else'maximum'if h>a else'fold',grid=[[point(i,j)for j in range(33)]for i in range(17)],localEnergy=[[u,second*(a*u)**2/2-mp.pi*p*(a*u)**3/6]for u in lin(65,max(-M('.25'),-h/a),'.25')])
def pneumatic(o):
 a,N,alpha=map(M,[o[k]for k in ['a','N','alpha']]);exists=alpha<=1;small=large=None
 if exists:
  root=mp.sqrt(1-alpha*alpha);small=cap(a,N,alpha,0 if alpha==0 else a*alpha/(1+root));large=cap(a,N,alpha,a*(1+root)/alpha)if alpha else None
 return dict(a=a,N=N,alpha=alpha,branch=o['branch'],pressure=2*N*alpha/a,peakPressure=2*N/a,exists=exists,small=small,large=large,selected=small if o['branch']=='shallow'else large,pressureCurve=[[phi*180/mp.pi,2*N/a*mp.sin(phi)]for phi in lin(91,0,mp.pi)])
def shellThinness(a):
 ratio,nu,angle=map(M,[a[k]for k in ['ratio','nu','angle']]);phi=angle*mp.pi/180;t=1/ratio;classical=2*t*t/mp.sqrt(3*(1-nu*nu));lam=(12*(1-nu*nu))**M('.25')*mp.sqrt(ratio)*2*mp.sin(phi/2);domain='supported'if lam>2+M('1e-12')else'outside'if lam<2-M('1e-12')else'unresolved boundary';factor=M('.14')+M('3.2')/lam**2 if domain=='supported'else None
 return dict(ratio=ratio,nu=nu,angle=angle,phi=phi,t=t,spanThickness=2*ratio*mp.sin(phi),classical=classical,lambda_=lam,sourceDomain=domain,factor=factor,correlated=classical*factor if factor is not None else None,bendingToMembrane=t*t/(12*(1-nu*nu)),scaling=[[10**x,2/(10**(2*x)*mp.sqrt(3*(1-nu*nu)))]for x in lin(65,mp.log10(50),mp.log10(1500))],correlationCurve=[[10**u,M('.14')+M('3.2')/10**(2*u)]for u in lin(81,mp.log10(M('2.000001')),2)],section=[[mp.sin(x),mp.cos(x)-mp.cos(phi)]for x in lin(65,-phi,phi)])
DEFAULTS=dict(curvedStiffness=dict(rise=.3,thin=.04,load=.00001),hypar=dict(curvature=.7,x=.35,y=.3,ruling=.25),tensionPatch=dict(k1=.6,k2=-.4,T1=1,T2=1.5,pressure=0),minimalGraph=dict(a=.8,trial=0,x=.35,y=.2),cableNet=NET,hangingModel=dict(weight=.5,bias=.4,loadChange=1,selected=1),dynamicRelaxation=dict(qX=1,qY=1,rise=.8,load=-.3,damping=1,dt=.2,steps=60,selected=1),gridshell=dict(rise=.6,shear=20,brace=True),tensegrity=dict(radius=1,height=1.8,prestress=1,twist=0),pneumatic=dict(a=1,N=1,alpha=.6,branch='shallow'),shellThinness=dict(ratio=300,nu=.3,angle=30))
DOMAINS=dict(curvedStiffness=dict(rise=(0,.7),thin=(.02,.12),load=(0,.00005)),hypar=dict(curvature=(0,1.2),x=(-.8,.8),y=(-.8,.8),ruling=(-1,1)),tensionPatch=dict(k1=(-1,1),k2=(-1,1),T1=(.1,3),T2=(.1,3),pressure=(-3,3)),minimalGraph=dict(a=(0,1.2),trial=(-.4,.4),x=(-.8,.8),y=(-.8,.8)),cableNet=dict(qX=(.25,4),qY=(.25,4),rise=(0,1.2),load=(-2,0),selected=(0,8),bias=(-.8,.8)),hangingModel=dict(weight=(0,2),bias=(-.8,.8),loadChange=(.5,1.5),selected=(0,8)),dynamicRelaxation=dict(qX=(.25,4),qY=(.25,4),rise=(0,1.2),load=(-2,0),damping=(0,4),dt=(.02,.3),steps=(0,120),selected=(0,8)),gridshell=dict(rise=(0,1),shear=(-35,35)),tensegrity=dict(radius=(.5,1.5),height=(1,3),prestress=(0,2),twist=(-10,10)),pneumatic=dict(a=(.5,3),N=(.25,3),alpha=(.02,1.2)),shellThinness=dict(ratio=(50,1500),nu=(.15,.45),angle=(5,75)))
cases=[];seen=set();rng=random.Random(610272026)
def emit(f,**kw):
 a=dict(DEFAULTS[f],**kw);key=(f,json.dumps(a,sort_keys=True))
 if key in seen:return
 seen.add(key);out=globals()[f](a)
 if f=='shellThinness':out['lambda']=out.pop('lambda_')
 cases.append(dict(family=f,args=a,expected=out))
def convert(x):
 # Fifteen significant decimal digits remove binary half-ULP tie ambiguity in
 # exact rational mesh coordinates. Oracle budget is much wider (2e-11+3e-11|x|).
 if isinstance(x,mp.mpf):return 0.0 if abs(x)<mp.mpf('1e-70')else float(mp.nstr(x,15))
 if isinstance(x,list):return[convert(v)for v in x]
 if isinstance(x,dict):return{k:convert(v)for k,v in x.items()}
 return x
for family,domain in DOMAINS.items():
 emit(family)
 for k,(lo,hi)in domain.items():
  for v in(lo,hi):emit(family,**{k:v})
 for side in(0,1):emit(family,**{k:limits[side]for k,limits in domain.items()})
 # Irrational-looking serialized states exercise full native slider precision.
 for _ in range(10 if family=='minimalGraph'else 22):
  a={k:(rng.randint(int(lo),int(hi))if k in('selected','steps')else float(format(rng.uniform(lo,hi),'.15g')))for k,(lo,hi)in domain.items()};emit(family,**a)
 print('generated',family,len(cases),flush=True)
for c in(0,1e-15,.000099,.000101):emit('minimalGraph',a=c,trial=0);emit('hypar',curvature=c)
for k1,k2,p in[(0,0,0),(.6,-.4,0),(.5,.5,1),(0,.7,.7),(-.7,0,-.7)]:emit('tensionPatch',k1=k1,k2=k2,T1=1,T2=1,pressure=p)
for qx in(.25,4):
 for qy in(.25,4):
  for c in(0,4):emit('dynamicRelaxation',qX=qx,qY=qy,damping=c,dt=.3,steps=120)
for flat in(False,True):
 for selected in range(9):emit('cableNet',flatBoundary=flat,selected=selected)
for brace in(False,True):
 for shear in(-35,0,35):emit('gridshell',brace=brace,shear=shear)
for q in(0,1e-12,2):
 for twist in(-10,0,10):emit('tensegrity',prestress=q,twist=twist)
for branch in('shallow','tall'):
 for alpha in(0,.02,.999999999999,1,1.000000000001,1.2):emit('pneumatic',branch=branch,alpha=alpha)
nu=M('.3');ratio=M(50);angle=2*mp.asin(1/((12*(1-nu*nu))**M('.25')*mp.sqrt(ratio)))*180/mp.pi
for delta in(-1e-9,0,1e-9):emit('shellThinness',ratio=50,angle=float(angle)+delta)
output=dict(method='Independent Python/mpmath scalar formulas, numerical differentiation, incidence-matrix assembly and dense LU; no production imports',serialization='15 significant decimal digits; numerical residues below 1e-70 canonicalized to zero; native IEEE754 argument values retained',families=dict(Counter(r['family']for r in cases)),cases=cases)
with open(args.output,'w')as f:json.dump(convert(output),f,separators=(',',':'),allow_nan=False);f.write('\n')
print(json.dumps(dict(cases=len(cases),families=output['families'],dps=args.dps,output=args.output)),flush=True)
