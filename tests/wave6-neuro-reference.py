"""Independent NEURO6 oracle: SciPy laws/quadrature/optimization and 120-digit math.
The compatible uint32 generator checks repeatable synthetic inputs; it is not the
numerical oracle for Gamma survival, spectra, fitting, CDFs or information.
"""
import json,math,sys
from pathlib import Path
import numpy as np
import mpmath as mp
from scipy import stats,integrate,optimize,signal,special
mp.mp.dps=120
class Random:
 def __init__(self,seed=1):self.a=seed&0xffffffff or 1
 def raw(self):
  self.a=(self.a+0x6D2B79F5)&0xffffffff;t=((self.a^(self.a>>15))*(1|self.a))&0xffffffff;t^=(t+(((t^(t>>7))*(61|t))&0xffffffff))&0xffffffff
  return (t^(t>>14))&0xffffffff
 def u(self):return (self.raw()+.5)/4294967296
 def normal(self):return math.sqrt(-2*math.log(1-self.raw()/4294967296))*math.cos(2*math.pi*self.raw()/4294967296)
 def exp(self):return-math.log(self.u())
 def count(self,mu):
  t=self.exp();n=0
  while t<mu:n+=1;t+=self.exp()
  return n

def number(v):return float(v)
def lnp_data(rho=0,base=15,gain=1,exposure=.2,seed=1,N=512):
 r,c=Random(seed),Random(seed+700001);stim=[r.normal()]
 for i in range(1,N+7):stim.append(rho*stim[-1]+math.sqrt(1-rho*rho)*r.normal())
 X=np.array([stim[i:i+8][::-1] for i in range(N)]);w=np.array([.2,.7,1,.45,-.35,-.65,-.35,-.1]);w*=gain/np.linalg.norm(w);rates=base*np.exp(X@w);counts=np.array([c.count(exposure*v) for v in rates]);return X,w,rates,counts
R={'provenance':{'python':sys.version.split()[0],'scipy':__import__('scipy').__version__,'numpy':np.__version__,'mpmath':mp.__version__,'precision':120,'role':'independent numerical oracle; compatible RNG only for inputs'}}
R['integrals']=[]
for rate,m,f,a,b in [(20,.7,2,0,.04),(0,.8,2,0,2),(60,.9,10,.195,2),(1e-20,.9,0,0,.1),(13.25,.321,3.125,.123,.129),(20,.7,2,1.999999,2),(20,.7,2,.2,.200000000001)]:
 q=[mp.mpf(x) for x in [rate,m,f,a,b]];r,mm,ff,aa,bb=q;M=mp.quad(lambda t:r*(1+mm*mp.cos(2*mp.pi*ff*t)),[aa,bb]);R['integrals'].append({'params':[rate,m,f,a,b],'value':float(M)})
R['pmf']=[{'n':n,'mean':mean,'p':float(stats.poisson.pmf(n,mean))} for mean in [0,.001,.5,1,20,60] for n in [0,1,2,10,40,100]]
R['hazard']=[]
for ref,k,gamma in [(0,1,10),(8,1,50),(8,3,50),(30,5,100),(.000012345,4,72.5)]:
 for age in [0,ref/1000,max(0,ref/1000-1e-12),ref/1000+1e-12,.04,.1,.25]:
  x=age-ref/1000;s=1 if x<0 else stats.gamma.sf(x,k,scale=1/gamma);d=0 if x<0 else stats.gamma.pdf(x,k,scale=1/gamma)
  R['hazard'].append({'params':[age,ref,k,gamma],'values':[s,d,d/s]})
R['renewal']=[]
for mode,rate,ref in [('Poisson',20,8),('regular',5,0),('regular',20,8),('regular',40,15),('bursty',5,0),('bursty',40,15)]:
 lam=mp.mpf(rate);tau=mp.mpf(ref)/1000 if mode=='regular' else mp.mpf(0);k=4;gamma=k*lam/(1-lam*tau)
 def interval_transform(w):
  if mode=='Poisson':return lam/(lam+1j*w)
  if mode=='regular':return mp.exp(-1j*w*tau)*(gamma/(gamma+1j*w))**k
  return mp.mpf('.8')*5*lam/(5*lam+1j*w)+mp.mpf('.2')*(mp.mpf('.2')/mp.mpf('.84'))*lam/((mp.mpf('.2')/mp.mpf('.84'))*lam+1j*w)
 psd=[]
 for f in [0,1e-8,.25,1,5,10,30,100]:
  cv2=1 if mode=='Poisson' else mp.mpf('6.12') if mode=='bursty' else (1-lam*tau)**2/k
  z=interval_transform(2*mp.pi*mp.mpf(f)) if f else None;value=lam*cv2 if not f else lam*(1-abs(z)**2)/abs(1-z)**2;psd.append([f,float(value)])
 # Independent inverse-Laplace renewal density, not the JS finite Erlang sum.
 def laplace(s):
  if mode=='Poisson':P=lam/(lam+s)
  elif mode=='regular':P=mp.exp(-s*tau)*(gamma/(gamma+s))**k
  else:P=mp.mpf('.8')*5*lam/(5*lam+s)+mp.mpf('.2')*(mp.mpf('.2')/mp.mpf('.84'))*lam/((mp.mpf('.2')/mp.mpf('.84'))*lam+s)
  return lam*P/(1-P)
 pairs=[]
 for t in [.001,.005,.0123,.04,.1,.2]:
  if mode=='regular':
   # Delays make generic Talbot inversion ill-conditioned near a support boundary.
   value=sum(lam*mp.exp(-gamma*(mp.mpf(t)-j*tau))*gamma**(j*k)*(mp.mpf(t)-j*tau)**(j*k-1)/mp.factorial(j*k-1) for j in range(1,201) if mp.mpf(t)>=j*tau)
  else:value=mp.invertlaplace(laplace,mp.mpf(t),method='dehoog')
  pairs.append([t,float(value)])
 R['renewal'].append({'params':[mode,rate,ref],'psd':psd,'pairs':pairs})
R['oscillator']=[]
for rate,T,binIndex in [(20,4,0),(20,4,3),(40,2,19),(5,6,39)]:
 a,b=binIndex*.005,(binIndex+1)*.005;m=.8;w=2*math.pi*10
 def inner(u):return integrate.quad(lambda t:rate**2*(1+m*math.cos(w*t))*(1+m*math.cos(w*(t+u))),0,T-u,epsabs=1e-8,epsrel=2e-11,limit=250)[0]
 value=integrate.quad(inner,a,b,epsabs=1e-8,epsrel=2e-11)[0]/(T*(b-a)-(b*b-a*a)/2);R['oscillator'].append({'rate':rate,'T':T,'bin':binIndex,'value':value})
R['lnp']=[]
for params in [dict(rho=0,base=15,gain=1,trials=10,seed=1,ridge=.02),dict(rho=.9,base=1,gain=1.2,trials=1,seed=17,ridge=.001),dict(rho=.3,base=40,gain=1.2,trials=40,seed=99999,ridge=2),dict(rho=.6,base=15,gain=0,trials=8,seed=42,ridge=.4)]:
 rho,base,gain,trials,seed,ridge=[params[k] for k in ['rho','base','gain','trials','seed','ridge']];E=.02*trials;X,w,rates,y=lnp_data(rho,base,gain,E,seed);D=np.column_stack((np.ones(512),X))
 def fun(b):eta=D@b;mu=E*np.exp(eta);return np.sum(mu-y*eta)+ridge*(b@b)/2
 def jac(b):return D.T@(E*np.exp(D@b)-y)+ridge*b
 def hess(b):return D.T@((E*np.exp(D@b))[:,None]*D)+ridge*np.eye(9)
 initial=np.r_[math.log((sum(y)+.5)/(512*E)),np.zeros(8)];fit=optimize.minimize(fun,initial,jac=jac,hess=hess,method='trust-exact',options={'gtol':1e-8,'maxiter':200});beta=fit.x
 # Refine with SciPy's root solver using the independently formed score equations.
 fit2=optimize.root(jac,beta,jac=hess,tol=1e-11);beta=fit2.x
 Xt,wt,rt,yt=lnp_data(rho,base,gain,E,seed+1000003,256);pred=np.exp(np.column_stack((np.ones(256),Xt))@beta);mean=X.mean(axis=0);cov=np.cov(X,rowvar=False,bias=True);sta=(y@(X-mean))/sum(y) if sum(y)>0 else None;corrected=np.linalg.solve(cov+.01*np.eye(8),sta) if sta is not None else None
 R['lnp'].append({'params':params,'firstStimulus':X[0].tolist(),'firstRates':rates[:12].tolist(),'firstCounts':y[:40].tolist(),'trainTotal':int(sum(y)),'testTotal':int(sum(yt)),'trueFilter':w.tolist(),'sta':None if sta is None else sta.tolist(),'corrected':None if corrected is None else corrected.tolist(),'beta':beta.tolist(),'objective':float(fun(beta)),'scoreNorm':float(np.linalg.norm(jac(beta),np.inf)),'predictions':pred[:32].tolist(),'rmse':float(np.sqrt(np.mean((pred-rt)**2)))})
R['receptive']=[]
for mode,theta,phase,frequency,sigma,balance in [('Gabor',45,0,1,.55,True),('Gabor',90,31,.8,.8,False),('DoG',0,0,0,.25,True),('DoG',67,183,1.2,.8,False),('DoG',180,360,2,.55,True)]:
 xy=np.linspace(-2,2,41);xx,yy=np.meshgrid(xy,xy);g=np.exp(-(xx*xx+yy*yy)/(2*sigma*sigma));g2=np.exp(-(xx*xx+yy*yy)/(8*sigma*sigma));K=g*np.cos(2*np.pi*.8*xx) if mode=='Gabor' else g/g.sum()-.8*g2/g2.sum()
 if balance:K-=K.mean()
 K/=np.abs(K).sum();big=np.linspace(-4,4,81);bx,by=np.meshgrid(big,big);angle=theta*np.pi/180;image=np.cos(2*np.pi*frequency*(bx*np.cos(angle)+by*np.sin(angle))+phase*np.pi/180);corr=signal.correlate2d(image,K,mode='valid')
 R['receptive'].append({'params':dict(mode=mode,theta=theta,phase=phase,frequency=frequency,sigma=sigma,balance=balance),'sum':float(K.sum()),'kernel':K[::10,::10].flatten().tolist(),'values':[[float(xy[i]),float(xy[j]),float(corr[j,i])] for j,i in [(20,20),(0,0),(10,30),(40,40)]]})
R['fisher']=[]
for N,s,width,gain,T in [(1,0,.4,30,.25),(1,1e-20,.4,30,.25),(1,1e-200,.4,30,.25),(1,float.fromhex('0x0.0000000000001p-1022'),.4,30,.25),(1,.2,.4,30,.25),(8,.2,.4,30,.25),(16,-1,.15,50,1),(4,1,1,0,.01),(9,.1234567,.387654,17.7,.1234)]:
 prefs=[mp.mpf(0)] if N==1 else [-1+mp.mpf(2)*i/(N-1) for i in range(N)];ss,ww,gg,tt=map(mp.mpf,[s,width,gain,T]);ex=[gg*mp.exp(-((ss-p)/ww)**2/2) for p in prefs];rates=[2+x for x in ex];der=[x*(p-ss)/(ww*ww) for p,x in zip(prefs,ex)];info=tt*sum(d*d/r for d,r in zip(der,rates));R['fisher'].append({'params':dict(N=N,s=s,width=width,gain=gain,duration=T),'rates':list(map(float,rates)),'derivatives':list(map(float,der)),'information':float(info),'bound':float(1/info) if info and mp.log(1/info)<mp.log(sys.float_info.max) else None,'logInformation':float(mp.log(info)) if info else None})
R['posterior']=[]
for params in [dict(N=10,truth=90,skew=.5,modulation=.7,prior=1,priorDirection=90,duration=.25,seed=1),dict(N=4,truth=0,skew=1,modulation=0,prior=0,priorDirection=180,duration=.01,seed=17),dict(N=24,truth=315,skew=.8,modulation=.9,prior=6,priorDirection=45,duration=1,seed=99999)]:
 N,truth,skew,m,prior,mu,T,seed=[params[k] for k in ['N','truth','skew','modulation','prior','priorDirection','duration','seed']];prefs=np.array([360*i/N+skew*180/math.pi*math.sin(2*math.pi*i/N) for i in range(N)]);baseline=np.array([15*(1+.3*math.cos(2*math.pi*i/N)) for i in range(N)]);rates=baseline*(1+m*np.cos((truth-prefs)*np.pi/180));r=Random(seed);counts=[r.count(T*rate) for rate in rates];scores=[sum(stats.poisson.logpmf(counts,T*baseline*(1+m*np.cos((h-prefs)*np.pi/180))))+prior*math.cos((h-mu)*math.pi/180) for h in range(0,360,45)];post=np.exp(scores-special.logsumexp(scores));R['posterior'].append({'params':params,'counts':counts,'posterior':post.tolist()})
R['beta']=[{'a':a,'b':b,'x':x,'cdf':float(special.betainc(a,b,x)),'density':float(stats.beta.pdf(x,a,b))} for a in range(1,7) for b in range(1,7) for x in [0,.000123456789,.2,.5,.9,1]]
R['rescale']=[]
for ref,gamma,N,seed,wrong in [(0,10,40,1,False),(10,40,300,1,False),(10,40,300,1,True),(30,100,800,17,False),(30,100,800,17,True)]:
 r=Random(seed);intervals=np.array([ref/1000+r.exp()/gamma for i in range(N)]);z=gamma*intervals/(1+gamma*ref/1000) if wrong else gamma*(intervals-ref/1000);u=-np.expm1(-z);R['rescale'].append({'params':dict(refMs=ref,gamma=gamma,N=N,seed=seed,wrong=wrong),'firstIntervals':intervals[:20].tolist(),'firstZ':z[:20].tolist(),'firstU':u[:20].tolist(),'ks':float(stats.kstest(u,'uniform').statistic),'mean':float(z.mean())})
R['ou']=[{'params':[u,I,sigma,h,z],'value':float(I+(u-I)*mp.exp(-mp.mpf(h)/mp.mpf(.02))+sigma*mp.sqrt(1-mp.exp(-2*mp.mpf(h)/mp.mpf(.02)))*z)} for u,I,sigma,h,z in [(0,.8,.25,.00005,1.2),(-.4,1.2,.5,.001,-3),(1,.2,0,.00001,8),(0,1.2,0,.00005,0),(.4,.9,.01,.00005,-.000012345)]]
R['deterministic']=[]
for drive in [1+2**-52,1+1e-10,1.001,1.2]:
 I=mp.mpf(drive);first=-mp.mpf(.02)*mp.log(1-1/I);R['deterministic'].append({'drive':drive,'first':float(first),'period':float(first+mp.mpf(.002))})
R['resonance']=[]
for a in [0,.1,.6,.9,1e-8,1e-20]:
 for sigma in [0,.001,.02,.1,.5,1,3,10]:
  aa,ss=mp.mpf(a),mp.mpf(sigma)
  if sigma==0:p=m=info=mp.mpf(0)
  else:
   p=mp.erfc((1-aa)/(ss*mp.sqrt(2)))/2;m=mp.erfc((1+aa)/(ss*mp.sqrt(2)))/2;avg=(p+m)/2
   def kl(q):return q*mp.log(q/avg)+(1-q)*(mp.log1p(-q)-mp.log1p(-avg)) if q else -mp.log1p(-avg)
   info=(kl(p)+kl(m))/(2*mp.log(2)) if a else mp.mpf(0)
  R['resonance'].append({'a':a,'sigma':sigma,'p':float(p),'m':float(m),'information':float(info),'logInformation':float(mp.log(info)) if info>0 else None})
R['quadrature']=[]
for theta,phase,contrast,width,frequency in [(0,0,1,.55,.8),(30,67,1,.55,.8),(90,90,.8,.25,.8),(180,270,.4,.8,2),(45,0,0,.55,1),(0,90,1,.25,0),(17.1234,183.5678,.789,.3876,1.234)]:
 angle=theta*np.pi/180;phi=phase*np.pi/180;kx=2*np.pi*frequency*np.cos(angle);ky=2*np.pi*frequency*np.sin(angle);k0=2*np.pi*.8
 Y=integrate.quad(lambda y:math.exp(-y*y/(2*width*width))*math.cos(ky*y),-np.inf,np.inf,epsabs=1e-12)[0]
 even=integrate.quad(lambda x:math.exp(-x*x/(2*width*width))*math.cos(k0*x)*math.cos(kx*x+phi),-np.inf,np.inf,epsabs=1e-12)[0];odd=integrate.quad(lambda x:math.exp(-x*x/(2*width*width))*math.sin(k0*x)*math.cos(kx*x+phi),-np.inf,np.inf,epsabs=1e-12)[0];Rc=contrast*even*Y/(2*np.pi*width*width);Rs=contrast*odd*Y/(2*np.pi*width*width)
 R['quadrature'].append({'params':dict(theta=theta,phase=phase,contrast=contrast,width=width,frequency=frequency),'Rc':Rc,'Rs':Rs,'energy':math.hypot(Rc,Rs)})
out=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).parent/'fixtures/wave6-neuro-reference.json';out.write_text(json.dumps(R,indent=2,allow_nan=False)+'\n');print(json.dumps({'output':str(out),'cases':sum(len(v) for v in R.values() if isinstance(v,list)),'families':{k:len(v) for k,v in R.items() if isinstance(v,list)}}))
