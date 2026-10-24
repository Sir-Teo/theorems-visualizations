"""Independent scientific references for the own PHYSIO6 teaching families.
Uses explicit labelled microstates, high-precision physical roots, full-species
reaction ODEs, independent spectral calculations and radial BVP collocation.
No source bodies or network access are needed to regenerate the fixture.
"""
import json,math
from pathlib import Path
import numpy as np
import mpmath as mp
from scipy.integrate import solve_ivp,solve_bvp
from scipy.optimize import brentq

def first_references():
    mp.mp.dps=120
    q=mp.mpf('1.36');a=mp.mpf('.003')
    def point(P,Hb,P50,n):
     P,Hb,P50,n=map(mp.mpf,[P,Hb,P50,n]);S=P**n/(P50**n+P**n);bound=q*Hb*S;diss=a*P
     return {'S':float(S),'logS':float(mp.log(S)) if S else None,'bound':float(bound),'logBound':float(mp.log(bound)) if bound else None,'dissolved':float(diss),'logDissolved':float(mp.log(diss)) if diss else None,'total':float(bound+diss),'logTotal':float(mp.log(bound+diss)) if bound+diss else None,'slope':float(n*S*(1-S))}
    def inverse(target,Hb,P50,n):
     target,Hb,P50,n=map(mp.mpf,[target,Hb,P50,n]);lo=mp.mpf(0);hi=min(mp.mpf(200),target/a)
     def C(P):return q*Hb*P**n/(P50**n+P**n)+a*P
     if target>C(200):return None
     for _ in range(300):
      mid=(lo+hi)/2
      if C(mid)<target:lo=mid
      else:hi=mid
     P=(lo+hi)/2;return {'value':float(P),'log':float(mp.log(P))}
    def scale(L,c):
     L,c=map(mp.mpf,[L,c]);lo=mp.mpf(0);hi=1/c
     def frac(alpha):
      R=(1+alpha)**4;T=L*(1+c*alpha)**4;return (R*alpha/(1+alpha)+T*c*alpha/(1+c*alpha))/(R+T)
     for _ in range(300):
      mid=(lo+hi)/2
      if frac(mid)<mp.mpf('.5'):lo=mid
      else:hi=mid
     KR=27/((lo+hi)/2);return KR,KR/c
    scales={}
    def binding(P,L,c,family,third):
     P,L,c,third=map(mp.mpf,[P,L,c,third]);key=(L,c)
     if key not in scales:scales[key]=scale(L,c)
     KR,KT=scales[key];rows=[]
     for mask in range(16):
      j=mask.bit_count();weight=(P/27)**j if family=='independent sites' else ((P/KR)**j+L*(P/KT)**j)
      if family=='modified Adair'and j==3:weight*=third
      rows.append((j,weight))
     Z=mp.fsum(w for j,w in rows);E=mp.fsum(j*w for j,w in rows)/Z;var=mp.fsum((j-E)**2*w for j,w in rows)/Z;S=E/4
     return {'KR':float(KR),'KT':float(KT),'S':float(S),'logS':float(mp.log(S)) if S else None,'probabilities':[float(mp.fsum(w for j,w in rows if j==k)/Z)for k in range(5)],'localHill':float(var/(4*S*(1-S))) if P>0 else None}
    def co(P,occupied,bias):
     P=mp.mpf(P);KR,KT=scale(10000,.01);L=mp.mpf(10000)*mp.exp(-occupied*bias);m=4-occupied
     if not m:return {'absolute':0.,'logAbsolute':None,'remaining':None}
     rows=[]
     for mask in range(2**m):
      j=mask.bit_count();rows.append((j,(P/KR)**j+L*(P/KT)**j))
     Z=mp.fsum(w for j,w in rows);conditional=mp.fsum(j*w for j,w in rows)/(m*Z);absolute=mp.mpf(m)/4*conditional
     return {'absolute':float(absolute),'logAbsolute':float(mp.log(absolute)) if absolute else None,'remaining':float(conditional)}
    out={'method':'Independent120-digit rational Hill mass balance, physical pressure bisection,16 labelled-site assignments per MWC conformation and conditional CO occupancy'}
    out['content']=[{'params':{'P':P,'Hb':Hb,'P50':P50,'n':n},'expected':point(P,Hb,P50,n)}for P in [0,5e-324,1e-100,2.6,20,40,100,200]for Hb in [0,5,15,20]for P50 in [.1,27,100]for n in [1,2.7,4]]
    out['inverse']=[]
    for target in [5e-324,1e-200,.01,10,20]:
     for Hb in [0,20]:
      for P50 in [.1,27]:
       for n in [1,1+2**-52,2.7,4]:
        z=inverse(target,Hb,P50,n)
        if z is not None:out['inverse'].append({'target':target,'params':{'Hb':Hb,'P50':P50,'n':n},'expected':z})
    out['differences']=[]
    for Pa,Pv in [(100,40),(40,math.nextafter(40,0)),(0,40),(5e-324,0),(1e-200,5e-201),(0,0)]:
     for Hb in [0,15]:
      P1,P2=map(mp.mpf,[Pa,Pv]);d=(q*Hb*(P1**mp.mpf('2.7')/(27**mp.mpf('2.7')+P1**mp.mpf('2.7'))-P2**mp.mpf('2.7')/(27**mp.mpf('2.7')+P2**mp.mpf('2.7')))+a*(P1-P2));out['differences'].append({'Pa':Pa,'Pv':Pv,'Hb':Hb,'sign':int(mp.sign(d)),'log':float(mp.log(abs(d))) if d else None,'value':float(abs(d))})
    out['binding']=[{'params':{'P':P,'L':L,'c':c,'family':family,'third':3.2},'expected':binding(P,L,c,family,3.2)}for P in [0,5e-324,1e-100,20,40,100,200]for L,c in [(1,1),(1e4,.01),(1e6,.001)]for family in ['MWC-derived','independent sites','modified Adair']]
    out['co']=[{'params':{'P':P,'occupied':n,'bias':bias},'expected':co(P,n,bias)}for P in [0,5e-324,20,40,100,200]for n in range(5)for bias in [3,4,6]]
    return out

def linked_references():
    mp.mp.dps=120
    h0=mp.power(10,mp.mpf('-7.4'));KHd=mp.power(10,mp.mpf('-7.2'));KHo=mp.power(10,mp.mpf('-6.7'));KCd=mp.mpf('.2')*h0/40;KCo=mp.mpf('.05')*h0/40
    m=6;r=2;alpha=mp.mpf('.03');pKa=mp.mpf('6.1')
    def state(P,h,pc,Hb,Kp):
        rows=[]
        for o in [0,1]:
            KH,KC=(KHd,KCd) if o==0 else (KHo,KCo)
            for j in range(m+1):
                for k in range(r+1):
                    w=mp.mpf(math.comb(m,j)*math.comb(r,k))*(h/KH)**j*(KC*pc/h)**k*(1 if o==0 else (P/Kp)**4)
                    rows.append((w,4*o,j,k))
        Z=mp.fsum(w for w,*_ in rows)
        mean=lambda f:mp.fsum(row[0]*f(row)for row in rows)/Z
        O=mean(lambda x:x[1]);H=mean(lambda x:x[2]);C=mean(lambda x:x[3]);N=H-C
        return {'Y':O/4,'Hbound':Hb/mp.mpf('6.45')*H,'carb':Hb/mp.mpf('6.45')*C,'N':Hb/mp.mpf('6.45')*N,'protonVariance':Hb/mp.mpf('6.45')*mean(lambda x:(x[2]-x[3]-N)**2),'covON':mean(lambda x:(x[1]-O)*(x[2]-x[3]-N))}
    # Calibrate from independently enumerated zero/four-O2 partition coefficients.
    q=state(mp.mpf(1),h0,mp.mpf(40),mp.mpf(15),mp.mpf(1));Kp=27*(q['Y']/(1-q['Y']))**mp.mpf('.25')
    def blood(P,pc,Hb):
        ref=state(mp.mpf(100),h0,mp.mpf(40),Hb,Kp);B0=alpha*40*mp.power(10,mp.mpf('7.4')-pKa);target=alpha*pc*mp.power(10,-pKa)
        def at(h):
            z=state(P,h,pc,Hb,Kp);B=B0+1000*(h-h0)+z['N']-ref['N'];return z,B,h*B-target
        lo=mp.mpf('1e-14');hi=mp.mpf('1e-3')
        assert at(lo)[2]<0<at(hi)[2]
        for _ in range(300):
            mid=(lo+hi)/2
            if at(mid)[2]>0:hi=mid
            else:lo=mid
        h=(lo+hi)/2;z,B,residual=at(h);assert abs(residual)<mp.mpf('1e-90')
        return {**{k:float(v)for k,v in z.items()},'h':float(h),'pH':float(-mp.log10(h)),'B':float(B),'totalCO2':float(alpha*pc+B+z['carb']),'logY':float(mp.log(z['Y'])) if z['Y']>0 else None}
    rows=[]
    for Hb in [0,5,15,20]:
     for pc in [10,40,80]:
      for P in [0,5e-324,.1,20,100,200]:rows.append({'Hb':Hb,'pc':pc,'P':P,'expected':blood(mp.mpf(P),mp.mpf(pc),mp.mpf(Hb))})
    cov=[]
    for P in [.1,20,100]:
     for pc in [10,40,80]:
      z=state(mp.mpf(P),h0,mp.mpf(pc),mp.mpf('6.45'),Kp);cov.append({'P':P,'pc':pc,'h':float(h0),'covON':float(z['covON'])})
    out={'method':'Independent explicit42-microstate sums in120-digit arithmetic;300-step physical hydrogen bracketing, residual<1e-90; covariance cross-response checks','Kp':float(Kp),'cases':rows,'covariance':cov}
    return out

def transport_references():
    mp.mp.dps=120
    SELECT=[0,1,17,60,120,180,240]
    def chloride(p):
     dose=p.get('dose',1.9);cat=p.get('catalyst',4);exchange=p.get('exchange',True);T=p.get('T',20)
     def rhs(t,y):
      ci,co,bi,bo,carb,amine,B,BH,Cli,Clo=y;diff=1.5*(co-ci);hydr=.2*(1+cat)*ci*B-.02*(1+cat)*bi*BH;cb=5*ci*amine*B-.5*carb*BH;ex=bi*Clo-.5*bo*Cli if exchange else 0
      return [diff-hydr-cb,-diff,hydr-ex,ex,cb,-cb,-hydr-cb,hydr+cb,ex,-ex]
     initial=[.1,dose,.2,.5,.1,.3,2.2,.8,1,2]
     if T==0:values=np.array([initial]*241).T
     else:values=solve_ivp(rhs,(0,T),initial,t_eval=np.linspace(0,T,241),method='DOP853',rtol=3e-13,atol=1e-14).y
     return {'params':p,'selected':[[j,*values[:,j].tolist()]for j in SELECT]}
    def epo(p):
     s=p.get('availability',.7);h=p.get('hillExponent',8);tau=p.get('delay',7);deficit=p.get('deficit',0);T=p.get('T',400);instant=p.get('mode','four-stage maturation')=='instantaneous feedback';gamma=1/120;a=4/tau
     def rhs(t,y):
      R=y[-1];f=2/(1+(s*R)**h)
      return [gamma*(f-R)]if instant else [a*(f-y[0]),a*(y[0]-y[1]),a*(y[1]-y[2]),a*(y[2]-y[3]),gamma*(y[3]-R)]
     initial=[1-deficit] if instant else [1,1,1,1,1-deficit]
     if T==0:values=np.array([initial]*241).T
     else:values=solve_ivp(rhs,(0,T),initial,t_eval=np.linspace(0,T,241),method='DOP853',rtol=3e-13,atol=1e-14).y
     return {'params':p,'selected':[[j,*values[:,j].tolist()]for j in SELECT]}
    def krogh(p):
     Rc=mp.mpf(p.get('capillaryRadius',3))*mp.mpf('1e-4');Rt=mp.mpf(p.get('tissueRadius',30))*mp.mpf('1e-4');L=mp.mpf(p.get('length',500))*mp.mpf('1e-4');u=mp.mpf(p.get('speed',500))*mp.mpf('1e-4');M=mp.mpf(p.get('consumption',.0005));Pa=mp.mpf(p.get('Pa',100));Hb=mp.mpf(p.get('Hb',15));D=mp.mpf('2e-5');alpha=mp.mpf('3e-5');q=mp.mpf('1.36');ab=mp.mpf('.003');n=mp.mpf(2.7)
     def content(P):return q*Hb*P**n/(mp.mpf(27)**n+P**n)+ab*P
     Ca=content(Pa);flow=mp.pi*Rc**2*u;radial=[];columns=[]
     for j in range(9):
      r=Rc+(Rt-Rc)*j/8;drop=mp.mpf(0)if j==0 or M==0 else -mp.quad(lambda x:M/(2*D*alpha)*(x-Rt**2/x),[Rc,r]);radial.append(drop)
     for j in range(9):
      z=L*j/8;remaining=Ca-100*M*mp.pi*(Rt**2-Rc**2)*z/flow
      if remaining<0:columns.append({'fraction':j/8,'remaining':float(remaining),'P':None,'field':None});continue
      lo=mp.mpf(0);hi=Pa
      for _ in range(250):
       mid=(lo+hi)/2
       if content(mid)<remaining:lo=mid
       else:hi=mid
      P=(lo+hi)/2;columns.append({'fraction':j/8,'remaining':float(remaining),'P':float(P),'field':[float(P-d)for d in radial]})
     # An independent collocation solution of the scaled radial differential equation.
     bvp=None
     if M>0 and M>mp.mpf('1e-100'):
      ratio=float(Rt/Rc);coef=float(M*Rc**2/(D*alpha));xs=np.geomspace(1,ratio,201)
      def rhs(x,y):return np.vstack([y[1],coef-y[1]/x])
      solution=solve_bvp(rhs,lambda ya,yb:np.array([ya[0],yb[1]]),xs,np.zeros((2,len(xs))),tol=1e-10,max_nodes=20000)
      assert solution.success,(p,solution.message,len(solution.x),max(solution.rms_residuals))
      bvp=(-solution.sol(np.linspace(1,ratio,9))[0]).tolist()
     return {'params':p,'radialDrops':[float(d)for d in radial],'columns':columns,'bvpRadialDrops':bvp,'flow':float(flow),'criticalConsumption':float(flow*Ca/(100*mp.pi*(Rt**2-Rc**2)*L))}
    cs=[{}, {'dose':0},{'dose':4,'catalyst':20},{'dose':0,'catalyst':0,'exchange':False},{'dose':4,'catalyst':0},{'dose':1.9,'exchange':False},{'catalyst':20},{'T':0},{'dose':.12345,'catalyst':.37,'exchange':False,'T':13.4}]
    es=[{}, {'T':0},{'T':600,'delay':1,'hillExponent':20},{'T':600,'delay':160,'hillExponent':20,'availability':1},{'delay':80,'hillExponent':20,'T':600},{'availability':.4,'deficit':.5,'hillExponent':1,'T':600},{'availability':1.2,'deficit':.2,'delay':160,'T':600},{'mode':'instantaneous feedback'},{'mode':'instantaneous feedback','hillExponent':20,'availability':1,'deficit':.5,'T':600},{'hillExponent':3.7,'delay':37.2,'availability':.85,'T':300,'deficit':.17}]
    ks=[{}, {'consumption':0},{'consumption':5e-324},{'consumption':.0015},{'consumption':.003},{'consumption':.0020325380789553366},{'Hb':0},{'capillaryRadius':2,'tissueRadius':60,'length':1000,'speed':100,'consumption':.003,'Pa':20},{'capillaryRadius':5,'tissueRadius':10,'length':100,'speed':2000,'consumption':.003,'Pa':150,'Hb':20}]
    out={'method':'Independent full10-species chloride reaction system and five-state maturation DOP853;120-digit radial flux quadrature/axial volume balance plus scaled radial BVP collocation','chloride':[chloride(p)for p in cs],'epo':[epo(p)for p in es],'krogh':[krogh(p)for p in ks]}
    return out

def stability_references():
    gamma=1/120;m=4;rows=[]
    for h in [1,4,8,12,20]:
     for s in [.4,.7,1,1.2]:
      R=brentq(lambda R:R-2/(1+(s*R)**h),0,2,xtol=1e-14);k=h*(1-R/2)
      for tau in [1,7,40,80,160]:
       a=m/tau;J=np.zeros((m+1,m+1));J[0,0]=-a;J[0,m]=-a*k
       for j in range(1,m):J[j,j]=-a;J[j,j-1]=a
       J[m,m]=-gamma;J[m,m-1]=gamma;eigen=np.linalg.eigvals(J);largest=float(max(eigen.real))
       w=brentq(lambda w:math.atan(w)+m*math.atan(w*tau*gamma/m)-math.pi,1e-12,1e6);threshold=math.sqrt(1+w*w)*(1+(w*tau*gamma/m)**2)**(m/2)
       assert (k<threshold)==(largest<0),(h,s,tau,k,threshold,largest)
       rows.append({'h':h,'s':s,'tau':tau,'steady':R,'loopGain':k,'criticalGain':threshold,'maximumEigenReal':largest,'eigenvalues':[[float(z.real),float(z.imag)]for z in eigen]})
    out={'method':'Independent SciPy physical steady roots and NumPy5x5 reaction/filter Jacobian eigenvalues; comparison with derived unique negative-feedback phase threshold','cases':rows}
    return out

HISTORICAL = {'source': 'https://www1.udel.edu/chem/white/C342/Bohr%281904%29.html', 'sourceSha256': 'c2ea885498aaf2e09fc974c5ba6867c957cc2559ad3c35453fb3c0ade87d27a2', 'kind': 'authors interpolated/corrected summary cells; not raw independent observations', 'pressures': [5.0, 10.0, 15.0, 20.0, 25.0, 30.0, 35.0, 40.0, 45.0, 50.0, 60.0, 70.0, 80.0, 90.0, 100.0, 150.0], 'co2': [5.0, 10.0, 20.0, 40.0, 80.0], 'uptake': [[11.0, 28.5, 51.0, 67.5, 76.0, 82.0, 86.0, 89.0, 91.0, 92.5, 95.0, 97.0, 98.0, 98.5, 99.0, 100.0], [7.5, 20.5, 36.0, 54.0, 67.0, 74.5, 79.5, 84.0, 87.5, 90.0, 93.5, 95.5, 97.0, 98.0, 98.5, 100.0], [5.0, 14.0, 27.0, 41.0, 54.0, 63.5, 71.0, 77.0, 82.0, 86.0, 90.5, 94.0, 96.0, 97.0, 98.0, 100.0], [3.0, 9.0, 18.5, 29.5, 40.0, 50.0, 58.0, 66.5, 73.0, 78.5, 86.0, 91.0, 94.5, 96.0, 97.0, 99.8], [1.5, 4.0, 8.0, 14.0, 22.0, 31.0, 40.0, 49.0, 56.0, 62.5, 73.0, 80.5, 87.0, 91.5, 95.0, 99.5]]}

def generate():
    first=first_references();linked=linked_references();transport=transport_references();stability=stability_references()
    out={'method':'Independent120-digit rational/physical-root and42-state finite sums, full reaction DOP853, exact volume balance/radial flux quadrature, BVP collocation and five-state Jacobian eigenvalues'}
    out.update({k:v for k,v in first.items() if k!='method'})
    out['linked']=linked['cases'];out['covariance']=linked['covariance'];out['linkedKp']=linked['Kp']
    out.update({k:v for k,v in transport.items() if k!='method'});out['stability']=stability['cases'];out['historical']=HISTORICAL
    return out

if __name__=='__main__':
    out=generate();path=Path(__file__).with_name('fixtures')/'wave6-physio-reference.json'
    path.write_text(json.dumps(out,indent=2,allow_nan=False)+'\n')
    print(path,{k:len(v) for k,v in out.items() if isinstance(v,list)})
