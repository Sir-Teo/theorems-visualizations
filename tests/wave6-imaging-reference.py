"""Independent MRI references. Requires NumPy, SciPy and mpmath; no production JS imports.

Physical weights: 1100-digit canonical microstates.
Bloch: adaptive cross-product ODE; constant matrices: SciPy expm.
Slice: adaptive RF quadrature/SciPy sine integral.
Reconstruction: dense Fourier/Haar bases and independent small linear solves.
Blood budget: piecewise adaptive ODE; diffusion: integrated gradient history.
Linear-solver stimuli are recorded JS measurements, not independent RNG/acquisition validation.
Run: python tests/wave6-imaging-reference.py --out /tmp/regenerated.json
"""
import argparse,itertools,json,math
from pathlib import Path
import numpy as np
import mpmath as mp
from scipy.integrate import solve_ivp,quad
from scipy.linalg import expm
from scipy.special import sici,ndtri
STIMULI=Path(__file__).resolve().parent/'fixtures/wave6-imaging-linear-stimuli.json'

def foundation():
    mp.mp.dps=1100
    result={'polarization':[],'bloch':[],'spinEcho':[],'matrix':[]}
    # Microstate weights; high precision preserves asymmetries far below binary64.
    for field,temp in itertools.product([0,5e-324,1e-200,1e-20,.01,1.5,7],[.001,1,100,310,400]):
     B,T=mp.mpf(field),mp.mpf(temp); d=mp.mpf('6.62607015e-34')*mp.mpf('42577000')*B
     weights=[mp.exp(d/(2*mp.mpf('1.380649e-23')*T)),mp.exp(-d/(2*mp.mpf('1.380649e-23')*T))]
     lower,upper=[w/sum(weights) for w in weights]; p=lower-upper
     def metric(x): return {'value':float(x),'log':float(mp.log(x)) if x else None}
     result['polarization'].append({'args':{'field':field,'temperature':temp},'expect':{'lower':metric(lower),'upper':metric(upper),'polarization':metric(p),'ppm':metric(p*10**6),'energySplit':metric(d),'frequencyMHz':metric(mp.mpf('42.577')*B)}})
    # Actual cross product ODE, integrated adaptively. Distinct algorithm from matrix Pade.
    for flip,duration,phase,df,T1,ratio,relax in itertools.product([0,30,90,180],[.1,20],[0,90,37],[-500,0,177],[100,4000],[.01,2],[False,True]):
     # Keep a broad deterministic subset plus all cardinal zero-detuning rotations.
     key=(flip*3+duration*10+phase*7+df+T1+ratio*100+int(relax))
     if int(round(key))%13 and not(df==0 and phase in (0,90) and flip in (90,180) and duration==.1 and T1==100 and ratio==.01): continue
     om=np.array([flip*math.pi/180/duration*math.cos(phase*math.pi/180),flip*math.pi/180/duration*math.sin(phase*math.pi/180),2*math.pi*df/1000])
     def rhs(t,m):
      d=np.cross(m,om)
      if relax:d+=np.array([-m[0]/(T1*ratio),-m[1]/(T1*ratio),(1-m[2])/T1])
      return d
     sol=solve_ivp(rhs,[0,duration],[0,0,1],method='DOP853',rtol=2.3e-14,atol=1e-14,dense_output=True)
     for time in [0,duration*.37,duration,duration+33,3000]:
      if time<=duration:m=sol.sol(time)
      else:
       m=sol.y[:,-1].copy(); t=time-duration; q=(m[0]+1j*m[1])*np.exp(-1j*om[2]*t)*math.exp(-t/(T1*ratio) if relax else 0)
       m=np.array([q.real,q.imag,1+(m[2]-1)*math.exp(-t/T1) if relax else m[2]])
      args=dict(time=time,flip=flip,duration=duration,phase=phase,detuning=df,T1=T1,ratio=ratio,relaxation=relax)
      result['bloch'].append({'args':args,'expect':[float(x) for x in m]})
    # Exact affine longitudinal recurrence independent of simplified factored expression.
    for tr,te,t1,t2,density in itertools.product([1,50,500,5000],[0,1e-200,25,500],[10,1000,10000],[1,100,10000],[0,.9,1]):
     if te>tr:continue
     TR,TE,T1,T2,R=map(mp.mpf,[tr,te,t1,t2,density]); tau=TE/2
     # Ideal90 resets Mz to0; first recovery; pi reverses; full remaining recovery.
     mz=mp.mpf(0); mz=1+(mz-1)*mp.exp(-tau/T1); mz=-mz; mz=1+(mz-1)*mp.exp(-(TR-tau)/T1)
     signal=R*mz*mp.exp(-TE/T2)
     result['spinEcho'].append({'args':dict(TR=tr,TE=te,T1=t1,T2=t2,density=density),'expect':{'factor':metric(mz),'signal':metric(signal)}})
    rng=np.random.default_rng(612)
    for scale in [0,1e-8,.1,1,10,40]:
     for _ in range(12):
      a=rng.uniform(-1,1,(4,4))*scale
      result['matrix'].append({'args':a.tolist(),'expect':expm(a).tolist()})
    return result

def slice_references():
    x=[0,5e-324,1e-300,1e-10,1.9,2,2.000001,3,10,100,10000]+np.random.default_rng(608).uniform(-1500,1500,180).tolist()
    si=[{'x':t,'expect':float(sici(t)[0])} for t in x]
    rows=[]
    for g,bw,t,window,z in itertools.product([-20,0,20],[250,4000],[1,8],['Rectangular','Hann'],[-15,-1,0,3,15]):
     T=t/1000; f=42.577*g*z
     def rf(u):return np.sinc(bw*u)*(.5+.5*math.cos(2*math.pi*u/T) if window=='Hann' else 1)
     norm=quad(rf,-T/2,T/2,epsabs=1e-14,limit=800)[0]
     profile=quad(lambda u:rf(u)*math.cos(2*math.pi*f*u),-T/2,T/2,epsabs=1e-14,limit=800)[0]/norm
     rows.append({'args':dict(gradient=g,bandwidth=bw,duration=t,window=window),'z':z,'expect':profile,'I0':norm})
    return {'sineIntegral':si,'sliceProfiles':rows}

def reconstruction():
    N=32
    F=np.exp(-2j*np.pi*np.outer(np.arange(N),np.arange(N))/N)
    # Separate dense 1D Haar basis from piecewise basis functions, rather than butterfly code.
    H=np.zeros((N,N));H[0]=1/math.sqrt(N)
    for level in range(5):
     count=2**level;width=N//count
     for j in range(count):
      row=count+j;start=j*width;H[row,start:start+width//2]=1/math.sqrt(width);H[row,start+width//2:start+width]=-1/math.sqrt(width)

    def phantom(kind='tissue',phase=0):
     a=np.zeros((N,N),complex)
     for y,x in itertools.product(range(N),repeat=2):
      u,v=(x-16)/14,(y-16)/15
      c=-1 if u*u+v*v>1 else 2 if ((x-15)/3)**2+((y-16)/6)**2<1 else 1 if ((x-16)/10)**2+((y-16)/12)**2<1 else 0
      value=([.7,.9,1][c] if c>=0 else 0) if kind=='tissue' else (.6 if 8<=x<24 and 8<=y<24 else 0)+(.4 if 16<=x<24 and 12<=y<16 else 0)+(.8 if 4<=x<8 and 20<=y<24 else 0)
      if kind=='textured' and value:value=np.clip(value+.18*math.sin(2*math.pi*(7*x+3*y)/N),0,1)
      q=phase*(math.sin(2*math.pi*x/N)+.5*math.cos(2*math.pi*y/N));a[y,x]=value*np.exp(1j*q)
     return a

    def packed(a):return {'re':a.real.ravel().tolist(),'im':a.imag.ravel().tolist(),'nx':a.shape[1],'ny':a.shape[0]}
    result={'transforms':[],'aliasing':[],'partialFourier':[]}
    for kind,phase in itertools.product(['tissue','sparse','textured'],[0,.7,math.pi]):
     a=phantom(kind,phase);k=F@a@F.T;w=H@a@H.T
     result['transforms'].append({'args':dict(type=kind,phase=phase),'truth':packed(a),'k':packed(k),'haar':packed(w)})
    a=phantom();k=F@a@F.T
    for R in [1,2,4,8]:
     m=N//R;Fm=np.exp(2j*np.pi*np.outer(np.arange(m),np.arange(m))/m)
     folded=(Fm@k[::R]@F.conj().T)/(m*N)
     predicted=sum(a[j*m:(j+1)*m] for j in range(R))
     result['aliasing'].append({'args':dict(R=R),'folded':packed(folded),'predicted':packed(predicted)})
    for extra,phase in itertools.product([0,1,7,15],[0,.7,math.pi]):
     a=phantom(phase=phase);k=F@a@F.T;acquired=set(range(N//2+1))|set(range(N-extra,N));b=k.copy();zero=np.zeros((N,N),complex)
     for y in range(N):
      if y in acquired:zero[y]=k[y]
      else:
       for x in range(N):b[y,x]=np.conj(k[-y%N,-x%N])
     reconstructed=(F.conj().T@b@F.conj())/(N*N)
     result['partialFourier'].append({'args':dict(extra=extra,phase=phase),'completed':packed(b),'reconstruction':packed(reconstructed)})
    return result

def linear_solvers():
    S=json.loads(STIMULI.read_text());N=32
    F=np.exp(-2j*np.pi*np.outer(np.arange(N),np.arange(N))/N)/math.sqrt(N)
    H=np.zeros((N,N));H[0]=1/math.sqrt(N)
    for level in range(5):
     count=2**level;width=N//count
     for j in range(count):
      start=j*width;H[count+j,start:start+width//2]=1/math.sqrt(width);H[count+j,start+width//2:start+width]=-1/math.sqrt(width)
    def unpack(a):return np.array(a['re']).reshape(a['ny'],a['nx'])+1j*np.array(a['im']).reshape(a['ny'],a['nx'])
    def pack(a):return {'re':a.real.ravel().tolist(),'im':a.imag.ravel().tolist(),'nx':a.shape[1],'ny':a.shape[0]}
    result={'sense':[],'cs':[]}
    for row in S['sense']:
     if not row['resolved']:continue
     coils=[unpack(a) for a in row['coils']];data=[unpack(a) for a in row['aliased']];out=np.zeros((N,N),complex)
     for y in range(N//2):
      for x in range(N):
       c=np.array([[q[y,x],q[y+N//2,x]] for q in coils]);z=np.linalg.solve(c,np.array([q[y,x] for q in data]));out[y,x],out[y+N//2,x]=z
     result['sense'].append({'args':row['args'],'reconstruction':pack(out)})
    for row in S['cs']:
     args=row['args'];data=unpack(row['data']);mask=np.array(row['mask']).reshape(N,N);x=np.zeros((N,N),complex);history=[]
     def measure():
      residual=np.linalg.norm(mask*(F@x@F.T-data));coeff=H@x@H.T
      return [float(residual),float(.5*residual**2+args['lambda']*np.abs(coeff).sum())]
     history.append(measure())
     for it in range(args['iterations']):
      gradient=F.conj().T@(mask*(F@x@F.T-data))@F.conj();w=H@(x-gradient)@H.T;r=np.abs(w);f=np.maximum(0,1-args['lambda']/np.maximum(r,np.finfo(float).tiny));w*=f;x=H.T@w@H;history.append(measure())
     result['cs'].append({'args':args,'reconstruction':pack(x),'history':history})
    return result

def dynamics():
    result={'bold':[],'diffusion':[]};mp.mp.dps=1100
    for flow,metabolism,duration in itertools.product([0,.6,1],[0,.2,1],[1,8,13.137,20]):
     def h(t,start,tau):
      if t<=start:return 0
      return 1-math.exp(-(t-start)/tau) if t<=start+duration else math.exp(-(t-start-duration)/tau)-math.exp(-(t-start)/tau)
     def rhs(t,z):
      f=1+flow*h(t,4,2);m=1+metabolism*h(t,2,1);v,q=z;out=v**2.5
      return [f-out,m-q*out/v]
     # Solve each forcing interval separately to avoid an adaptive step missing an onset/kink.
     state=[1.,1.];segments=[];events=sorted(set([0,2,4,2+duration,4+duration,60]))
     for a,b in zip(events[:-1],events[1:]):
      sol=solve_ivp(rhs,[a,b],state,method='DOP853',atol=2e-13,rtol=2e-13,dense_output=True,max_step=.2);segments.append((a,b,sol));state=sol.y[:,-1]
     times=[0,2,4,4.001,7.137,12,20,60]
     for TE in [0,30,80]:
      for time in times:
       sol=next(s for a,b,s in segments if a<=time<=b);v,q=sol.sol(time);C=.5*(2*math.pi*2*TE/1000)**2
       result['bold'].append({'args':dict(flow=flow,metabolism=metabolism,duration=duration,TE=TE,time=time),'expect':{'v':float(v),'q':float(q),'change':math.expm1(-C*(q*q/v-1))}})
    for g,delta,gap,d1,d2,angle in itertools.product([0,5e-324,35,80],[0,5e-324,20,40],[0,20,80],[.1,1.7],[.3,3],[0,30,90]):
     # Deterministically thin interior grid, retain boundaries and underflow values.
     if g not in (0,5e-324) and (int(delta+gap+d1*10+d2*10+angle)%7):continue
     G=mp.mpf(g)*mp.mpf('1e-6');d=mp.mpf(delta)/1000;gapS=mp.mpf(gap)/1000;gamma=2*mp.pi*42577000
     # q is a ramp, plateau, ramp to0: integrate q^2 directly, no ST expression.
     ramp=gamma*G;b=(ramp*ramp*d**3/3)+(ramp*d)**2*gapS+(ramp*ramp*d**3/3)
     theta=mp.mpf(angle)*mp.pi/180;D=(mp.mpf(d1)*mp.cos(theta)**2+mp.mpf(d2)*mp.sin(theta)**2)/1000
     signal=mp.exp(-b*D);loss=-mp.expm1(-b*D)
     def metric(x):return {'value':float(x),'log':float(mp.log(x)) if x else None}
     result['diffusion'].append({'args':dict(gradient=g,delta=delta,gap=gap,parallel=d1,perpendicular=d2,angle=angle),'expect':{'b':metric(b),'D':float(D),'signal':metric(signal),'attenuation':metric(loss)}})
    return result

def canonical(data):
    # One inspectable case per line; preserve compact arrays and deterministic order.
    parts=['{']
    for i,(key,rows) in enumerate(data.items()):
        if i:parts[-1]+=','
        parts.append(json.dumps(key)+':[')
        for j,row in enumerate(rows):parts.append(json.dumps(row,separators=(',',':'),allow_nan=False)+(',' if j<len(rows)-1 else ''))
        parts.append(']')
    parts.append('}')
    return '\n'.join(parts)+'\n'

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--out',type=Path,required=True);args=parser.parse_args()
    result={}
    for fn in [foundation,slice_references,reconstruction,linear_solvers,dynamics]:
        rows=fn();assert not result.keys()&rows.keys();result.update(rows)
    result['gaussianQuantiles']=[float(x) for x in ndtri([(j+.5)/31 for j in range(31)])]
    args.out.write_text(canonical(result));print(json.dumps({k:len(v) for k,v in result.items()}))
