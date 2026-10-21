// Exact SI defining constants; deliberately scoped to reviewed kinetic models.
export const H=6.62607015e-34, K=1.380649e-23, N=6.02214076e23, C=299792458, GAS=K*N, CM_ENERGY=H*C*N/10, HC_TEMP=H*C*100/K;
export function isotope(nu,m,phi,T){const red=(x,a)=>Number.isFinite(x)?x*a/(x+a):a,rr=Math.sqrt(red(m,1)/red(m,2)),nuD=nu*rr,zH=.5*CM_ENERGY*nu,zD=.5*CM_ENERGY*nuD,dz=zH-zD;return{rr,nuD,zH,zD,dz,E:(1-phi)*dz,k:Math.exp((1-phi)*dz*1000/(GAS*T))};}
export function tunnelLog(V,hv,T,panels=2400){const kt=GAS*T/1000,top=V/kt+45,n=panels+(panels%2),h=top/n;let sum=0;for(let i=0;i<=n;i++){const x=i*h,a=2*Math.PI*(V-kt*x)/hv,sp=a>35?a:Math.log1p(Math.exp(a));sum+=(i===0||i===n?1:i%2?4:2)*Math.exp(V/kt-x-sp);}return Math.log(sum*h/3);}
export const tunnel=(V,hv,T)=>Math.exp(tunnelLog(V,hv,T));
export function conformers(T,gB,gA,gTB,GI,st='eq'){const rt=GAS*T/1000,f=G=>K*T/H*Math.exp(-G/rt),kAB=f(GI),kBA=f(GI-gB),kA=f(gA),kB=f(gTB-gB),Keq=Math.exp(-gB/rt),xA=st==='eq'?1/(1+Keq):1,xB=1-xA;
 // Expanded determinant has only positive terms. Direct ratio additionally cancels it.
 const det=kAB*kB+kA*kBA+kA*kB,IA=((kBA+kB)*xA+kBA*xB)/det,IB=(kAB*xA+(kAB+kA)*xB)/det;
 return{r:kB*(kAB*xA+(kAB+kA)*xB)/(kA*((kBA+kB)*xA+kBA*xB)),pA:kA*IA,pB:kB*IB,kA,kB,kAB,kBA,K:Keq,GI};}
// Selected unambiguous entries of original Hammett1937 TableI, p97. No modern CN/CF3/OH values.
export const HAMMETT_SUB=[['NO₂',.778,.710],['Br',.232,.391],['Cl',.227,.373],['F',.062,.337],['H',0,0],['CH₃',-.170,-.069],['OCH₃',-.268,.115],['NH₂',-.660,-.161]];
export const HAMMETT_RX={e:['benzoic ester hydrolysis; 87.83% ethanol,30°C',2.498],p:['phenol ionisation; water,25°C',2.008],a:['base-catalysed acetophenone bromination; acetate,35°C',.417],s:['benzoic acid esterification; absolute ethanol/HCl,25°C',-.085],b:['benzyl chloride hydrolysis; acetone–water,69.8°C',-1.875]};
export function hammettSigma(sub,pos,rx){return sub[0]==='NO₂'&&pos==='p'&&rx==='p'?1.27:sub[pos==='p'?1:2];}
export function eyringFlux(T,m,l,c=1,barrier=0,q=1){const mass=m*1.66053906892e-27,length=l*1e-10,Q=length*Math.sqrt(2*Math.PI*mass*K*T)/H,speed=Math.sqrt(K*T/(2*Math.PI*mass)),pref=Q*speed/length;return{Q,speed,pref,rate:c*pref*q*Math.exp(-barrier*1000/(GAS*T))};}
