// ASTRO6: explicit educational models in SI; dated observational/model inputs below.
export const G=6.67430e-11,C=299792458,K=1.380649e-23,MP=1.67262192369e-27;
export const MS=1.98847e30,RS=6.957e8,LS=3.828e26,YEAR=365.25*86400;
export const SIGMA=5.670374419e-8,ARAD=4*SIGMA/C,EV=1.602176634e-19,MEVB=1e-22*EV,ALPHA=1/137.035999084;
export const fmt=x=>x===null?'not available':!Number.isFinite(x)?String(x):x===0?'0':Math.abs(x)<1e-3||Math.abs(x)>1e5?x.toExponential(5):Number(x.toPrecision(6)).toString();
export const samples=(fn,a,b,n=100)=>Array.from({length:n+1},(_,j)=>fn(a+(b-a)*j/n));
export function homologous(delta=.06,tau=2){
 const den=1+2*delta,A=(1+delta)**2/den,e=Math.abs(delta)/(1+delta),M=(delta>0?Math.PI:0)+tau/A**1.5;let u=M;
 for(let j=0;j<12;j++)u-=(u-e*Math.sin(u)-M)/(1-e*Math.cos(u));
 const da=tau===0?delta:delta*delta/den-Math.abs(delta)*(1+delta)/den*Math.cos(u),a=1+da,velocity=tau===0?0:e*Math.sin(u)/(Math.sqrt(A)*(1-e*Math.cos(u))),acceleration=-da/a**3;
 return{a,da,velocity,acceleration,energy:.5*velocity**2+.5/a**2-1/a,energy0:.5/(1+delta)**2-1/(1+delta),period:2*Math.PI*A**1.5,residual:u-e*Math.sin(u)-M};
}
export function hydro(m=1,r=1,delta=.06,tau=2,u=.6){const M=m*MS,R=r*RS,z=homologous(delta,tau),rho=3*M/(4*Math.PI*R**3),pc=3*G*M*M/(8*Math.PI*R**4),g=G*M/R**2;return{...z,mass:M,radius:R*z.a,density:rho/z.a**3,pressure:pc*(1-u*u)/z.a**5,pressureAcceleration:g*u/z.a**3,gravityAcceleration:-g*u/z.a**2,netAcceleration:g*u*z.acceleration,seconds:tau*Math.sqrt(R**3/(G*M)),rho0:rho,pc0:pc};}
export function virial(m=1,r=1,alpha=.6,mu=.61,surface=0){const M=m*MS,R=r*RS,V=4*Math.PI*R**3/3,W=-alpha*G*M*M/R,U=(3*surface*V-W)/2,N=M/(mu*MP);return{W,U,E:W+U,N,temperature:2*U/(3*N*K),surfaceWork:3*surface*V,PV:(3*surface*V-W)/3};}
export function cooling(fraction=.2){const z=virial(),loss=fraction*z.U;return{...z,loss,newEnergy:z.E-loss,newThermal:z.U+loss,newTemperature:z.temperature*(1+fraction),newRadius:RS/(1+fraction),boxTemperature:z.temperature*(1-fraction),capacity:-1.5*z.N*K};}
export function times(m=1,r=1,l=1,fuel=.1,efficiency=.007){const M=m*MS,R=r*RS,L=l*LS,dynamical=Math.sqrt(R**3/(G*M));return{dynamical,freefall:Math.PI*dynamical/(2*Math.sqrt(2)),thermal:G*M*M/(R*L),nuclear:fuel*efficiency*M*C*C/L};}
export function kelvin(alpha=.6,startRadius=10,fuel=.1){const z=times(),budget=alpha*G*MS*MS/(2*RS)*(1-1/startRadius);return{budget,gravityTime:budget/LS,nuclearTime:times(1,1,1,fuel).nuclear,referenceAge:4.57e9*YEAR,conventional:z.thermal};}

function rk4(fn,x,y,h){const a=fn(x,y),b=fn(x+h/2,y.map((v,j)=>v+h*a[j]/2)),c=fn(x+h/2,y.map((v,j)=>v+h*b[j]/2)),d=fn(x+h,y.map((v,j)=>v+h*c[j]));return y.map((v,j)=>v+h*(a[j]+2*b[j]+2*c[j]+d[j])/6);}
function doubled(fn,x,y,h){const whole=rk4(fn,x,y,h),half=rk4(fn,x,y,h/2),two=rk4(fn,x+h/2,half,h/2),error=two.map((v,j)=>(v-whole[j])/15);return{y:two.map((v,j)=>v+error[j]),error};}
export function polytrope(n=3,maxXi=1e4){
 if(!(n>=0&&n<=5&&maxXi>0&&Number.isFinite(maxXi)))throw new RangeError('Polytropic index 0–5 and finite positive window required');
 const validate=x=>{if(x<0||!Number.isFinite(x))throw new RangeError('Nonnegative finite radius required');},analytic=n===0||n===1||n===5,edge=n===0?Math.sqrt(6):n===1?Math.PI:null;
 const exact=x=>{if(x===0)return[1,0];if(n===0)return[1-x*x/6,x**3/3];if(n===1)return x<.01?[1-x*x/6+x**4/120-x**6/5040,x**3*(1/3-x*x/30+x**4/840-x**6/45360)]:[Math.sin(x)/x,Math.sin(x)-x*Math.cos(x)];const f=1+x*x/3;return[1/Math.sqrt(f),x**3/(3*f**1.5)];};
 if(analytic){const end=edge===null?maxXi:Math.min(edge,maxXi),points=samples(t=>{const x=Math.expm1(t),y=exact(x);return{x,theta:y[0],q:y[1]};},0,Math.log1p(end),320),at=x=>{validate(x);if(edge!==null&&x>edge)return{theta:null,rho:0,q:exact(edge)[1],outside:true};const y=exact(x);return{theta:edge!==null&&x===edge?0:y[0],rho:n===0?1:y[0]**n,q:y[1],outside:false};};return{n,points,edge:edge!==null&&edge<=maxXi?edge:null,qEdge:edge!==null&&edge<=maxXi?exact(edge)[1]:null,status:n===5?'analytic infinite radius':edge<=maxXi?'finite edge':'edge beyond window',steps:0,localError:0,rootResidual:0,at};}
 const fn=(x,y)=>[-y[1]/(x*x),x*x*(y[0]>0?y[0]**n:0)];
 let x=Math.min(1e-4,maxXi),y=[1-x*x/6+n*x**4/120-n*(8*n-5)*x**6/15120,x**3/3-n*x**5/30+n*(8*n-5)*x**7/2520],h=.02,steps=0,localError=0,found=null,qEdge=null,rootResidual=null,status='edge beyond window';const points=[{x:0,theta:1,q:0},{x,theta:y[0],q:y[1]}];
 while(x<maxXi&&steps<24000){h=Math.min(h,maxXi-x,.08*Math.max(1,x));if(!(h>1e-14*Math.max(1,x))){status='step limit reached';break;}const z=doubled(fn,x,y,h),norm=Math.max(...z.error.map((e,j)=>Math.abs(e)/(1e-12+1e-10*Math.max(Math.abs(y[j]),Math.abs(z.y[j])))));steps++;
  if(!Number.isFinite(norm)||norm>1){h*=Number.isFinite(norm)?Math.max(.15,.85*norm**(-.2)):.25;continue;}
  localError=Math.max(localError,norm);
  if(z.y[0]<=0){let lo=0,hi=h;for(let j=0;j<55;j++){const mid=(lo+hi)/2;if(doubled(fn,x,y,mid).y[0]>0)lo=mid;else hi=mid;}const dt=(lo+hi)/2,end=doubled(fn,x,y,dt);found=x+dt;qEdge=end.y[1];rootResidual=end.y[0];points.push({x:found,theta:0,q:qEdge});status='finite edge';break;}
  x+=h;y=z.y;points.push({x,theta:y[0],q:y[1]});h*=norm===0?2:Math.min(2,Math.max(.5,.9*norm**(-.2)));
 }
 if(steps>=24000)status='iteration limit reached';
 const at=xi=>{if(xi<0||!Number.isFinite(xi))throw new RangeError('Nonnegative finite radius required');if(found!==null&&xi>found)return{theta:null,rho:0,q:qEdge,outside:true};if(xi>points.at(-1).x)return{theta:null,rho:null,q:null,outside:false,unresolved:true};if(xi===0)return{theta:1,rho:1,q:0,outside:false};let lo=0,hi=points.length-1;while(hi-lo>1){const j=(lo+hi)>>1;if(points[j].x<=xi)lo=j;else hi=j;}const p=points[lo];let yy;if(p.x===0)yy=[1-xi*xi/6+n*xi**4/120,xi**3/3-n*xi**5/30];else yy=doubled(fn,p.x,[p.theta,p.q],xi-p.x).y;return{theta:found!==null&&xi===found?0:yy[0],rho:found!==null&&xi===found?0:yy[0]**n,q:yy[1],outside:false};};
 return{n,points,edge:found,qEdge,status,steps,localError,rootResidual,at};
}
export function radiation(kappa=.5,flux=1e9,depth=.015){const T0=1e7,rho=1e4,g=1000,mu=.61,Hp=K*T0/(mu*MP*g),phi=3*kappa*rho*flux*Hp/(ARAD*C*T0**4),t4=1-phi*depth;return{Hp,phi,temperature:T0*t4**.25,pressureRatio:1-depth,gradient:(1-depth)*phi/(4*t4),opticalDepth:kappa*rho*Hp*.03,meanFreePath:1/(kappa*rho),t4};}
export function parcel(gradient=.5,u=.2,gamma=5/3){const ad=(gamma-1)/gamma,q=-gradient*u,logP=q===0?-u:-u*Math.log1p(q)/q,logT=Math.log1p(q),logRatio=(ad-gradient)*logP,environmentTemperature=Math.exp(logT);return{adiabatic:ad,pressureRatio:Math.exp(logP),environmentTemperature,parcelTemperature:environmentTemperature*Math.exp(logRatio),densityRatio:Math.exp(-logRatio),acceleration:Math.expm1(logRatio),N2:ad-gradient};}
export function eddington(m=10,luminosity=1e5,kappa=.034,radius=5){const M=m*MS,L=luminosity*LS,r=radius*RS,limit=4*Math.PI*G*M*C/kappa,gravity=G*M/(r*r),radiative=kappa*L/(4*Math.PI*r*r*C);return{limit,ratio:L/limit,gravity,radiative,net:gravity*(L/limit-1)};}

// Adaptive Simpson on a peak-scaled, dimensionless nonresonant Gamow integrand.
function simpson(fn,a,b,tol=1e-11,depth=20){let evaluations=0,estimatedError=0,exhausted=false;const F=x=>{evaluations++;return fn(x);},fa=F(a),fb=F(b),mid=(a+b)/2,fm=F(mid),S=(b-a)*(fa+4*fm+fb)/6;
 const step=(a,b,fa,fm,fb,S,tol,d)=>{const m=(a+b)/2,l=(a+m)/2,r=(m+b)/2,fl=F(l),fr=F(r),A=(m-a)*(fa+4*fl+fm)/6,B=(b-m)*(fm+4*fr+fb)/6,error=(A+B-S)/15;if(Math.abs(error)<=tol||d===0){if(d===0&&Math.abs(error)>tol)exhausted=true;estimatedError+=Math.abs(error);return A+B+error;}return step(a,m,fa,fl,fm,A,tol/2,d-1)+step(m,b,fm,fr,fb,B,tol/2,d-1);};
 return{value:step(a,b,fa,fm,fb,S,tol,depth),evaluations,estimatedError,exhausted};
}
export const REACTIONS={pp:{Z:1,mass:.5,S0:4.03e-25},CN:{Z:7,mass:14/15,S0:1.59e-3}};
export function gamow(T=15.7e6,reaction='pp'){
 if(!(T>0&&Number.isFinite(T))||!REACTIONS[reaction])throw new RangeError('Positive finite temperature and pp or CN reaction required');
 const z=REACTIONS[reaction],mass=z.mass*MP,kT=K*T,EG=2*mass*C*C*(Math.PI*ALPHA*z.Z)**2,E0=Math.cbrt(EG*kT*kT/4),lambda=E0/kT,hi=3+52/lambda,kernel=x=>{if(x<=0)return 0;const y=Math.sqrt(x);return Math.exp(-lambda*(y-1)**2*(y+2)/y);},cuts=[0,.25,.5,1,2,4,hi].filter(x=>x<=hi).sort((a,b)=>a-b);let integral=0,moment=0,error=0,evaluations=0,exhausted=false;
 for(let j=1;j<cuts.length;j++){const a=simpson(kernel,cuts[j-1],cuts[j]),b=simpson(x=>x*kernel(x),cuts[j-1],cuts[j]);integral+=a.value;moment+=b.value;error+=a.estimatedError;evaluations+=a.evaluations+b.evaluations;exhausted||=a.exhausted||b.exhausted;}
 const S=z.S0*MEVB,logRate=.5*Math.log(8/(Math.PI*mass))+Math.log(S*E0)-1.5*Math.log(kT)-3*lambda+Math.log(integral),width=4*Math.sqrt(E0*kT/3),gaussianIntegral=Math.sqrt(Math.PI)*width/(2*E0);
 return{T,reaction,EG,E0,kT,lambda,hi,integral,moment,error,evaluations,exhausted,rate:Math.exp(logRate),logRate,meanEnergy:E0*moment/integral,localPower:-1.5+lambda*moment/integral,approxPower:lambda-2/3,width,gaussianIntegral,gaussianError:gaussianIntegral/integral-1,tailBound:Math.exp(-52)/lambda,kernel};
}
export function burning(T=15.7e6,rho=1e5,X=.35,XCNO=.01){const pp=gamow(T,'pp'),CN=gamow(T,'CN'),np=rho*X/MP,n14=rho*XCNO/(14*MP),ppCycles=np*np*pp.rate/4,cnCycles=np*n14*CN.rate,Q=26.73e6*EV,ppHeat=ppCycles*Q*.98/rho,cnHeat=cnCycles*25e6*EV/rho;return{pp,CN,ppCycles,cnCycles,ppHeat,cnHeat,ratio:cnHeat/ppHeat,Q};}
export function crossover(X=.35,XCNO=.01){if(XCNO===0)return null;let lo=5e6,hi=40e6;if(burning(lo,1,X,XCNO).ratio>=1||burning(hi,1,X,XCNO).ratio<=1)return null;for(let j=0;j<42;j++){const m=(lo+hi)/2;if(burning(m,1,X,XCNO).ratio>1)hi=m;else lo=m;}return(lo+hi)/2;}
export const SPECIES={p:[1,1,0],d:[2,1,0],He3:[3,2,0],He4:[4,2,0],C12:[12,6,0],N13:[13,7,0],C13:[13,6,0],N14:[14,7,0],O15:[15,8,0],N15:[15,7,0],positron:[0,1,-1],neutrino:[0,0,1],photon:[0,0,0]};
export const NETWORKS={
 pp:{initial:{p:6},steps:[{p:-2,d:1,positron:1,neutrino:1},{d:-1,p:-1,He3:1,photon:1},{p:-2,d:1,positron:1,neutrino:1},{d:-1,p:-1,He3:1,photon:1},{He3:-2,He4:1,p:2}]},
 CN:{initial:{p:4,C12:1},steps:[{C12:-1,p:-1,N13:1,photon:1},{N13:-1,C13:1,positron:1,neutrino:1},{C13:-1,p:-1,N14:1,photon:1},{N14:-1,p:-1,O15:1,photon:1},{O15:-1,N15:1,positron:1,neutrino:1},{N15:-1,p:-1,C12:1,He4:1}]}
};
export function network(kind='pp',step=0){const n=NETWORKS[kind];if(!n||!Number.isInteger(step)||step<0||step>n.steps.length)throw new RangeError('Network step must be an offered integer');const counts={...n.initial};for(const change of n.steps.slice(0,step))for(const[k,v]of Object.entries(change))counts[k]=(counts[k]||0)+v;const totals=[0,0,0];for(const[k,v]of Object.entries(counts))for(let j=0;j<3;j++)totals[j]+=SPECIES[k][j]*v;return{counts,totals,steps:n.steps.length,complete:step===n.steps.length};}
// Vinyoles et al. arXiv:1611.09867v4, Table4, PDF8; marginal 1-sigma intervals.
export const SOLAR={GS98:{Y:.2426,sY:.0059,cz:.7116,sCZ:.0048,rho:-.35},AGSS09met:{Y:.2317,sY:.0059,cz:.7223,sCZ:.0053,rho:-.41},observed:{Y:.2485,sY:.0035,cz:.713,sCZ:.001}};
// SNO2002 v2 PDF4: effective channel fluxes, units 1e6 cm^-2 s^-1.
export const SNO={CC:{mean:1.76,stat:[.05,.06],syst:[.09,.09]},NC:{mean:5.09,stat:[.43,.44],syst:[.43,.46]},ES:{mean:2.39,stat:[.23,.24],syst:[.12,.12]}};
export function neutrinos(total=5.09,fraction=1.76/5.09){return{electron:total*fraction,other:total*(1-fraction),CC:total*fraction,NC:total};}
