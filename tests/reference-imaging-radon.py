"""Independent SciPy quadrature/Bessel transforms and NumPy matrix reconstruction references."""
import numpy as np,json
from scipy.special import j1
from scipy.integrate import quad
BASE=[[1,.69,.92,0,0,0],[-.8,.6624,.874,0,-.0184,0],[-.2,.11,.31,.22,0,-18],[-.2,.16,.41,-.22,0,18],[.1,.21,.25,0,.35,0],[.1,.046,.046,0,.1,0],[.1,.046,.046,0,-.1,0],[.1,.046,.023,-.08,-.605,0],[.1,.023,.023,0,-.606,0],[.1,.023,.046,.06,-.605,0]]
PH=[[A,a*.9,b*.9,x*.9,y*.9,ph]for A,a,b,x,y,ph in BASE];OD=[[1,.35,.22,.25,-.2,30]]
def proj(E,theta,s):
 z=np.zeros_like(np.asarray(s,dtype=float))
 for A,a,b,x,y,ph in E:
  al=theta-np.deg2rad(ph);R2=(a*np.cos(al))**2+(b*np.sin(al))**2;t=s-x*np.cos(theta)-y*np.sin(theta);z+=2*A*a*b*np.sqrt(np.maximum(0,R2-t*t))/R2
 return z

def ft(E,kx,ky):
 f=0j
 for A,a,b,x,y,ph in E:
  al=np.deg2rad(ph);rho=np.hypot(a*(kx*np.cos(al)+ky*np.sin(al)),b*(-kx*np.sin(al)+ky*np.cos(al)));area=np.pi*a*b if rho<1e-12 else a*b*j1(2*np.pi*rho)/rho;f+=A*area*np.exp(-2j*np.pi*(kx*x+ky*y))
 return f
slices=[]
for label,E in [('phantom',PH),('ellipse',OD)]:
 for nd in [12,160]:
  for deg in [0,35,90,180]:
   th=np.deg2rad(deg);tau=3/nd;s=-1.5+(np.arange(nd)+.5)*tau;p=proj(E,th,s);rows=[]
   for w in [0,2,7,14]:
    sampled=tau*np.sum(p*np.exp(-2j*np.pi*w*s));analytic=ft(E,w*np.cos(th),w*np.sin(th));integral=0j
    for A,a,b,x,y,ph in E:
     al=th-np.deg2rad(ph);R=np.hypot(a*np.cos(al),b*np.sin(al));center=x*np.cos(th)+y*np.sin(th)
     # s=center+R*cos(u) cancels the chord endpoint singularity.
     re=quad(lambda u:2*A*a*b*np.sin(u)**2*np.cos(2*np.pi*w*(center+R*np.cos(u))),0,np.pi,epsabs=2e-13,epsrel=2e-13)[0]
     im=quad(lambda u:-2*A*a*b*np.sin(u)**2*np.sin(2*np.pi*w*(center+R*np.cos(u))),0,np.pi,epsabs=2e-13,epsrel=2e-13)[0];integral+=re+1j*im
    rows.append(dict(w=w,sampled=[sampled.real,sampled.imag],exact=[analytic.real,analytic.imag],quadrature=[integral.real,integral.imag]))
   slices.append(dict(label=label,E=E,nd=nd,deg=deg,mass=ft(E,0,0).real,rows=rows))
grids=[]
for n,span in [(1,20),(1,180),(5,70),(12,180)]:
 N=16;nR=64;dw=.25;nd=64;tau=2/nd;s=-1+(np.arange(nd)+.5)*tau;angles=np.arange(n)*np.deg2rad(span)/n;w=np.arange(nR)*dw;sp=np.array([tau*(np.exp(-2j*np.pi*w[:,None]*s)*proj(OD,t,s)).sum(axis=1)for t in angles]);ks=(np.arange(N)-N/2)*.5;G=np.zeros((N,N),complex);mask=np.zeros((N,N),bool)
 for j,ky in enumerate(ks):
  for i,kx in enumerate(ks):
   rho=np.hypot(kx,ky)
   if rho>=w[-1]:continue
   neg=ky<0 or (ky==0 and kx<0);phi=np.arctan2(-ky if neg else ky,-kx if neg else kx)
   if phi<0:phi+=np.pi
   if span<180 and phi>angles[-1]+1e-12:continue
   radial=np.array([np.interp(rho,w,z.real)+1j*np.interp(rho,w,z.imag)for z in sp]);aa=angles
   if span==180:aa=np.append(angles,np.pi);radial=np.append(radial,np.conj(radial[0]))
   v=np.interp(phi,aa,radial.real)+1j*np.interp(phi,aa,radial.imag);G[j,i]=np.conj(v)if neg else v;mask[j,i]=True
 # Direct inverse Fourier summation at physical pixel centres, no FFT/phase shortcuts.
 xy=-1+(np.arange(N)+.5)*2/N;ex=np.exp(2j*np.pi*xy[:,None]*ks);image=.25*ex@G@ex.T
 grids.append(dict(n=n,span=span,N=N,E=OD,spRe=sp.real.tolist(),spIm=sp.imag.tolist(),gridRe=G.real.tolist(),gridIm=G.imag.tolist(),mask=mask.tolist(),out=np.flipud(image.real).tolist(),imagMax=float(np.abs(image.imag).max())))
nd=20;nA=9;half=1.45;tau=2*half/nd;s=-half+(np.arange(nd)+.5)*tau;angles=np.arange(nA)*np.pi/nA;p=np.array([proj(OD,t,s)for t in angles]);delta=np.arange(nd)[:,None]-np.arange(nd)[None,:];h=np.zeros((nd,nd));h[delta==0]=1/(4*tau*tau);odd=delta%2!=0;h[odd]=-1/(np.pi**2*delta[odd]**2*tau*tau);q=tau*p@h.T;N=32;xx=-1+(np.arange(N)+.5)*2/N;X,Y=np.meshgrid(xx,xx[::-1]);bp=[]
for k in [1,9]:
 image=np.zeros_like(X)
 for j in range(k):image+=np.interp((X*np.cos(angles[j])+Y*np.sin(angles[j])).ravel(),np.r_[s[0]-tau,s,s[-1]+tau],np.r_[0,q[j],0]).reshape(N,N)*np.pi/nA
 bp.append(dict(k=k,out=image.tolist()))
ramp=[dict(n=n,tau=.02,value=2*quad(lambda w:w*np.cos(2*np.pi*w*n*.02),0,25,epsabs=1e-10)[0])for n in range(-8,9)]
with open('tests/fixtures/imaging-radon-reference.json','w')as f:json.dump(dict(slices=slices,grids=grids,fbp=dict(nd=nd,nA=nA,half=half,N=N,E=OD,filtered=q.tolist(),backproject=bp),ramp=ramp),f,indent=2)
