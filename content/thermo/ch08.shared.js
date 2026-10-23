// Dimensionless ideal-gas calculations; physical conversions are explicit below.
export const K_B=1.380649e-23,H_PLANCK=6.62607015e-34,HBAR=H_PLANCK/(2*Math.PI),EV=1.602176634e-19;
export const M_E=9.1093837e-31,AMU=1.6605391e-27,ZETA_3_2=2.6123753486854883,ZETA_3=1.2020569031595943;
const finite=x=>Number.isFinite(x),positive=x=>finite(x)&&x>0;
export function rng(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return(s+.5)/4294967296;};}
export function fermi(x){if(x>=0){const e=Math.exp(-x);return e/(1+e);}return 1/(1+Math.exp(x));}
export function bose(x){if(!(x>0))return x===0?Infinity:NaN;return x>40?Math.exp(-x)/(1-Math.exp(-x)):1/Math.expm1(x);}
export const softplus=x=>Math.max(x,0)+Math.log1p(Math.exp(-Math.abs(x)));
const minusLogOneMinusExp=x=>x>Math.LN2?-Math.log1p(-Math.exp(-x)):-Math.log(-Math.expm1(-x));
export function fermiVariance(x){const e=Math.exp(-Math.abs(x));return e/(1+e)**2;}
export function occupancy(E,mu,T,kind='fermion'){
 if(T<0||![E,mu,T].every(finite))throw new RangeError('Finite energies and nonnegative temperature required.');
 if(T===0){if(kind!=='fermion')throw new RangeError('Use a positive temperature for a boson mode.');return E<mu?1:E>mu?0:.5;}
 return kind==='fermion'?fermi((E-mu)/T):kind==='boson'?bose((E-mu)/T):Math.exp((mu-E)/T);
}
export function grandSites(T=1,mu=1,U=0,seed=17,count=1024){
 if(!positive(T)||!finite(mu)||!finite(U)||!Number.isInteger(count)||count<1)throw new RangeError('Invalid finite reservoir.');
 const states=[{N:0,E:0,label:'empty'},{N:1,E:1,label:'site A'},{N:1,E:1.7,label:'site B'},{N:2,E:2.7+U,label:'both'}];
 const ex=states.map(s=>(mu*s.N-s.E)/T),m=Math.max(...ex),weights=ex.map(x=>Math.exp(x-m)),Z=weights.reduce((a,b)=>a+b),random=rng(seed),counts=[0,0,0,0];
 states.forEach((s,i)=>s.p=weights[i]/Z);
 for(let k=0;k<count;k++){let u=random(),i=0;for(;i<3&&u>states[i].p;i++)u-=states[i].p;counts[i]++;}
 const meanN=states.reduce((s,a)=>s+a.N*a.p,0),meanE=states.reduce((s,a)=>s+a.E*a.p,0),variance=states.reduce((s,a)=>s+(a.N-meanN)**2*a.p,0);
 return{states,counts,count,logXi:m+Math.log(Z),meanN,meanE,variance,response:variance/T};
}
export function numberLaw(x=-1,M=4,kind='fermion',maxN=180){
 if(!(x<0)||!finite(x)||!Number.isInteger(M)||M<1)throw new RangeError('Use x<0 and a positive integer mode count.');
 const q=Math.exp(x),meanPer=kind==='fermion'?q/(1+q):kind==='boson'?q/(-Math.expm1(x)):q,mean=M*meanPer;
 const variance=kind==='fermion'?mean*(1-meanPer):kind==='boson'?mean*(1+meanPer):mean;
 const probs=[kind==='fermion'?(1+q)**(-M):kind==='boson'?(-Math.expm1(x))**M:Math.exp(-mean)];
 for(let n=0;n<maxN;n++)probs.push(kind==='fermion'?(n<M?probs[n]*(M-n)/(n+1)*q:0):kind==='boson'?probs[n]*(n+M)/(n+1)*q:probs[n]*mean/(n+1));
 return{q,meanPer,mean,variance,fano:variance/mean,response:variance,probs,tail:Math.max(0,1-probs.reduce((a,b)=>a+b,0))};
}
// Nodes and weights are generated from Legendre polynomials, not fitted to these models.
function gaussRule(n=16){const out=[];for(let i=0;i<n;i++){let x=Math.cos(Math.PI*(i+.75)/(n+.5)),dp;
 for(let k=0;k<30;k++){let p=1,q=0;for(let j=1;j<=n;j++){const r=q;q=p;p=((2*j-1)*x*q-(j-1)*r)/j;}dp=n*(x*p-q)/(x*x-1);const dx=p/dp;x-=dx;if(Math.abs(dx)<2e-16)break;}
 let p=1,q=0;for(let j=1;j<=n;j++){const r=q;q=p;p=((2*j-1)*x*q-(j-1)*r)/j;}dp=n*(x*p-q)/(x*x-1);out.push([x,2/((1-x*x)*dp*dp)]);}return out;}
const GL=gaussRule();
export function integrate(f,a,b,panels=1){let sum=0;for(let j=0;j<panels;j++){const lo=a+(b-a)*j/panels,hi=a+(b-a)*(j+1)/panels,c=(lo+hi)/2,h=(hi-lo)/2;for(const[x,w]of GL)sum+=h*w*f(c+h*x);}return sum;}
function roots(mu,T){const end=Math.sqrt(Math.max(0,mu)+48*T);return[...new Set([0,end,...[.5,1,2,4].map(x=>Math.min(end,x*Math.sqrt(T))),...[-40,-16,-8,-4,-2,0,2,4,8,16,40].map(x=>Math.sqrt(Math.max(0,mu+x*T)))])].sort((a,b)=>a-b);}
function integrateFermiY(fn,mu,T){const p=roots(mu,T);let sum=0;for(let i=1;i<p.length;i++)sum+=integrate(fn,p[i-1],p[i],2);return sum;}
export function fermiIntegral(power,mu,T){
 if(!finite(mu)||!finite(T)||T<0||![-.5,.5,1.5].includes(power))throw new RangeError('Unsupported Fermi integral.');
 if(T===0)return Math.max(0,mu)**(power+1)/(power+1);
 return integrateFermiY(y=>2*y**(2*power+1)*fermi((y*y-mu)/T),mu,T);
}
export function solveIncreasing(fn,target,lo,hi,iterations=58){if(fn(lo)>target||fn(hi)<target)throw new RangeError('Root is not bracketed.');for(let i=0;i<iterations;i++){const m=(lo+hi)/2;if(fn(m)<target)lo=m;else hi=m;}return(lo+hi)/2;}
export function fermiThermo(T){
 if(!finite(T)||T<0||T>4)throw new RangeError('Use 0≤T/TF≤4.');
 const N=2/3,mu=T===0?1:solveIncreasing(m=>fermiIntegral(.5,m,T),N,-40*T-2,2+40*T),U=fermiIntegral(1.5,mu,T);
 let cv=0,densityResponse=1;
 if(T>0){const J=[0,1,2].map(k=>integrateFermiY(y=>{const x=(y*y-mu)/T;return 2*y*y*x**k*fermiVariance(x);},mu,T));cv=(J[2]-J[1]*J[1]/J[0])/N;densityResponse=J[0]/T;}
 return{T,mu,number:fermiIntegral(.5,mu,T),energyPer:U/N,pressurePer:2*U/(3*N),cv,densityResponse,muSommerfeld:1-Math.PI**2*T*T/12,cvSommerfeld:Math.PI**2*T/2};
}
export function pauli(T,b){
 if(T<0||!finite(T)||!finite(b))throw new RangeError('Invalid spin gas.');
 const N=2/3,number=m=>(fermiIntegral(.5,m+b,T)+fermiIntegral(.5,m-b,T))/2,mu=solveIncreasing(number,N,-40*T-Math.abs(b)-2,2+40*T+Math.abs(b));
 const up=fermiIntegral(.5,mu+b,T)/2,down=fermiIntegral(.5,mu-b,T)/2;
 return{mu,up,down,number:up+down,polarization:(up-down)/N,linear:1.5*b,weakSlope:fermiThermo(T).densityResponse/N};
}
export function landau(T,b,mu=1){
 if(!positive(T)||!positive(b)||!finite(mu))throw new RangeError('Positive T and cyclotron spacing required.');
 const levels=Math.max(1,Math.ceil((Math.max(mu,0)+40*T)/b)),terms=[];let omega=0;
 for(let n=0;n<levels;n++){const edge=b*(n+.5),a=mu-edge,term=-b*T*integrateFermiY(y=>softplus((a-y*y)/T),a,T);terms.push({n,edge,term});omega+=term;}
 const zero=-2/3*fermiIntegral(1.5,mu,T),coefficient=fermiIntegral(-.5,mu,T)/48;
 const tailBound=b*T*Math.sqrt(Math.PI*T)/2*Math.exp((mu-b*(levels+.5))/T)/(-Math.expm1(-b/T));
 return{omega,zero,delta:omega-zero,coefficient,prediction:b*b*coefficient,ratio:(omega-zero)/(b*b*coefficient),levels,terms,tailBound};
}
export function thermalScales(T,n,mass,g=1){
 if(![T,n,mass,g].every(positive))throw new RangeError('Positive physical scales required.');
 const lambda=H_PLANCK/Math.sqrt(2*Math.PI*mass*K_B*T),spacing=n**(-1/3),nQ=g/lambda**3;
 return{lambda,spacing,nQ,degeneracy:n/nQ,ratio:lambda/spacing};
}
export function boxStates(d=3,cutoff=100,bins=12){
 if(![1,2,3].includes(d)||!Number.isInteger(bins)||bins<1||!positive(cutoff))throw new RangeError('Invalid box.');
 const energies=[],bound=Math.floor(Math.sqrt(cutoff));
 function visit(prefix,sum){if(prefix===d){energies.push(sum);return;}for(let n=1;n<=bound&&sum+n*n+(d-prefix-1)<=cutoff;n++)visit(prefix+1,sum+n*n);}
 visit(0,0);energies.sort((a,b)=>a-b);const width=cutoff/bins,counts=Array(bins).fill(0);energies.forEach(E=>counts[Math.min(bins-1,Math.floor(E/width))]++);
 const c=[0,1,Math.PI/4,Math.PI/6][d],weyl=E=>E<=0?0:c*E**(d/2),expected=counts.map((_,i)=>weyl((i+1)*width)-weyl(i*width));
 return{d,cutoff,width,energies,counts,expected,weyl,count:energies.length};
}
export function fermiScales(n,mass=M_E,g=2){const kF=(6*Math.PI**2*n/g)**(1/3),EF=HBAR**2*kF*kF/(2*mass);return{kF,EF,TF:EF/K_B,U0per:3*EF/5,P0:2*n*EF/5};}
const gamma=s=>s===1?1:s===1.5?Math.sqrt(Math.PI)/2:s===2?1:s===2.5?3*Math.sqrt(Math.PI)/4:s===3?2:NaN;
export function boseIntegral(s,a){
 if(!(a>=0)||!finite(a)||![1,1.5,2,2.5,3].includes(s))throw new RangeError('Invalid Bose integral.');
 if(s===1)return a===0?Infinity:minusLogOneMinusExp(a);
 if(a===0&&s===1.5)return ZETA_3_2;if(a===0&&s===2)return Math.PI**2/6;if(a===0&&s===3)return ZETA_3;
 const end=Math.sqrt(48),r=Math.sqrt(a),breaks=[0,.25,.5,1,2,4,end];
 // Near condensation a narrow boundary layer spans y≈sqrt(a); resolve all intervening scales.
 if(r>0)for(let y=r/8;y<end;y*=2)breaks.push(y);
 const p=[...new Set(breaks)].sort((x,y)=>x-y);let sum=0;
 for(let i=1;i<p.length;i++)sum+=integrate(y=>2*y**(2*s-1)*bose(y*y+a),p[i-1],p[i],2);
 return sum/gamma(s);
}
export function classical(z,E=1){if(!(z>0&&z<1))throw new RangeError('Use 0<z<1.');const q=z*Math.exp(-E);return{q,fd:q/(1+q),be:q/(1-q),mb:q,fdRelative:q/(1+q),beRelative:q/(1-q),boseDensity:boseIntegral(1.5,-Math.log(z)),fermiDensity:fermiIntegral(.5,Math.log(z),1)/(Math.sqrt(Math.PI)/2)};}
export function intrinsic(T,Eg,me=1,mh=.6){
 if(![T,Eg,me,mh].every(positive))throw new RangeError('Positive temperature, gap and masses required.');
 const kT=K_B*T/EV,Nc=2*(2*Math.PI*me*M_E*K_B*T/H_PLANCK**2)**1.5,Nv=2*(2*Math.PI*mh*M_E*K_B*T/H_PLANCK**2)**1.5;
 const F=x=>fermiIntegral(.5,x,1)/(Math.sqrt(Math.PI)/2),electron=m=>Nc*F((m-Eg)/kT),hole=m=>Nv*F(-m/kT),mu=solveIncreasing(m=>Math.log(electron(m))-Math.log(hole(m)),0,-20*kT,Eg+20*kT),n=electron(mu),p=hole(mu),muMB=Eg/2+kT/2*Math.log(Nv/Nc),nMB=Math.sqrt(Nc*Nv)*Math.exp(-Eg/(2*kT));
 return{T,Eg,kT,Nc,Nv,mu,n,p,muMB,nMB,relativeMB:nMB/n-1,conduction:E=>E>=Eg?2*Nc/(Math.sqrt(Math.PI)*kT**1.5)*Math.sqrt(E-Eg)*fermi((E-mu)/kT):0,valence:E=>E<=0?2*Nv/(Math.sqrt(Math.PI)*kT**1.5)*Math.sqrt(-E)*fermi((mu-E)/kT):0};
}
export function condensate(t){
 if(!finite(t)||t<0)throw new RangeError('Use a nonnegative reduced temperature.');
 if(t<=1)return{t,a:0,z:1,excited:t**1.5,fraction:1-t**1.5};
 const target=ZETA_3_2/t**1.5,a=solveIncreasing(x=>-boseIntegral(1.5,x),-target,0,Math.max(10,Math.log(t)*2+10));
 return{t,a,z:Math.exp(-a),excited:1,fraction:0};
}
export function infraredCapacity(d,xmin){
 if(![2,3].includes(d)||!positive(xmin))throw new RangeError('Use dimension 2 or 3 and a positive cutoff.');
 if(d===2)return minusLogOneMinusExp(xmin);
 return integrate(y=>2*y*y*bose(y*y),Math.sqrt(xmin),Math.sqrt(48),20)/(Math.sqrt(Math.PI)/2);
}
export function uniform2D(density){if(!positive(density))throw new RangeError('Positive phase-space density required.');const a=minusLogOneMinusExp(density);return{density,a,z:Math.exp(-a),recovered:boseIntegral(1,a)};}
export function trap(N,t,d=3){
 if(!Number.isInteger(N)||N<1||!finite(t)||t<0||![2,3].includes(d))throw new RangeError('Invalid harmonic trap.');
 const zeta=d===3?ZETA_3:Math.PI**2/6,tau=t*(N/zeta)**(1/d),asymptotic=Math.max(0,1-t**d);
 if(t===0)return{N,t,d,tau,a:Infinity,ground:N,fraction:1,asymptotic,excited:0,shells:[],last:0,tailBound:0};
 const last=Math.ceil(48*tau),deg=n=>d===3?(n+1)*(n+2)/2:n+1,shells=Array.from({length:last},(_,i)=>({n:i+1,g:deg(i+1)}));
 const total=a=>bose(a)+shells.reduce((s,r)=>s+r.g*bose(r.n/tau+a),0),a=solveIncreasing(x=>-total(x),-N,Math.log1p(1/N)*.25,Math.log1p(1/N)+20),ground=bose(a),excited=shells.reduce((s,r)=>{r.count=r.g*bose(r.n/tau+a);return s+r.count;},0);
 const r=Math.exp(-1/tau),n=last+1,base=Math.exp(-a-n/tau)/(-Math.expm1(-n/tau-a));
 // Bound Bose factors by a geometric tail times the exact polynomial shell degeneracy.
 const S0=1/(1-r),S1=r/(1-r)**2,S2=r*(1+r)/(1-r)**3;
 const tailBound=base*(d===3?((n+1)*(n+2)*S0+(2*n+3)*S1+S2)/2:(n+1)*S0+S1);
 return{N,t,d,tau,a,ground,excited,fraction:ground/N,asymptotic,shells,last,tailBound};
}
export function helium({gapK=8.6,sound=238,speed=40,T=.3}={}){
 const mass=4.0026*AMU,p0=HBAR*1.92e10,mr=.16*mass,delta=gapK*K_B,pstar=Math.sqrt(p0*p0+2*mr*delta),rotonCritical=2*delta/(pstar+p0),critical=Math.min(sound,rotonCritical),rho=145,n=rho/mass;
 const energy=p=>Math.min(sound*p,delta+(p-p0)**2/(2*mr)),rhoNormal=2*Math.PI**2/45*(K_B*T)**4/(HBAR**3*sound**5),cvVolume=2*Math.PI**2/15*K_B**4*T**3/(HBAR**3*sound**3),idealTc=2*Math.PI*HBAR**2/(mass*K_B)*(n/ZETA_3_2)**(2/3);
 return{p0,mr,delta,pstar,rotonCritical,critical,energy,speed,rhoNormal,normalFraction:rhoNormal/rho,cvVolume,idealTc,lambdaT:2.17};
}
