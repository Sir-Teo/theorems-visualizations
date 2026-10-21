// SI internally. G: CODATA2022; g: conventional standard gravity, not a regional observation.
export const G=6.67430e-11,g=9.80665,YEAR=365.25*86400,KM=1000,MGAL=1e-5;
export const airyRoot=(h,rc,rm)=>rc*h/(rm-rc);
export const airyMass=(h,root,rc,rm,C=35000,Z=150000)=>rc*(C+h+root)+rm*(Z-C-root);
export const referenceMass=(rc,rm,C=35000,Z=150000)=>rc*C+rm*(Z-C);
export const prattDensity=(h,rho,D)=>rho*D/(D+h);
const quadratureCache=new Map();
export function gauss(n=32){if(quadratureCache.has(n))return quadratureCache.get(n);const out=[];for(let i=1;i<=n;i++){let x=Math.cos(Math.PI*(i-.25)/(n+.5)),dp;for(let j=0;j<20;j++){let p0=1,p1=x;for(let k=2;k<=n;k++){const p=((2*k-1)*x*p1-(k-1)*p0)/k;p0=p1;p1=p;}dp=n*(x*p1-p0)/(x*x-1);const dx=p1/dp;x-=dx;if(Math.abs(dx)<2e-15)break;}out.push([x,2/((1-x*x)*dp*dp)]);}quadratureCache.set(n,out);return out;}
// Infinite y-strike prism, vertical attraction positive down. Observer z >= top.
export function prismGravity(x,z,L,bottom,top,rho,n=32){const thickness=top-bottom;if(thickness===0||rho===0)return 0;const mid=(top+bottom)/2,half=thickness/2;let sum=0;for(const [t,w]of gauss(n)){const a=z-(mid+half*t);sum+=w*(Math.atan2(L-x,a)-Math.atan2(-L-x,a));}return 2*G*rho*half*sum;}
export function prismAnalytic(x,z,L,bottom,top,rho){const F=(u,a)=>{a=Math.abs(a);if(u===0)return 0;return u*Math.log(u*u+a*a)-2*u+2*a*Math.atan2(u,a);},H=a=>F(L-x,a)-F(-L-x,a);return G*rho*(H(z-bottom)-H(z-top));}
export const sphereGravity=(x,z,depth,radius,contrast)=>G*(4*Math.PI*radius**3*contrast/3)*(z+depth)/(x*x+(z+depth)**2)**1.5;
export function gravitySurvey(x,{h=1500,L=40000,compensation=1,contrast=300,depth=8000,n=32}={}){const rc=2800,rm=3300,C=35000,z=h,root=compensation*airyRoot(h,rc,rm),topo=prismGravity(x,z,L,0,h,rc,n),deficit=prismGravity(x,z,L,-C-root,-C,rc-rm,n),body=sphereGravity(x,z,depth,1500,contrast),gamma=.3086*MGAL,raw=-gamma*z+topo+deficit+body,fa=raw+gamma*z,slab=2*Math.PI*G*rc*z;return {raw,fa,simple:fa-slab,terrain:slab-topo,complete:fa-topo,topo,deficit,body,root,slab};}
export function flexural(Te,E=70e9,nu=.25,drho=2300){const D=E*Te**3/(12*(1-nu*nu)),c=drho*g,alpha=(4*D/c)**.25;return {Te,E,nu,drho,D,c,alpha};}
export function lineDerivative(x,Q,p,n=0){const u=Math.abs(x)/p.alpha,w0=Q/(2*p.c*p.alpha),e=Math.exp(-u),c=Math.cos(u),s=Math.sin(u),f=[c+s,-2*s,2*(s-c),4*c,-4*(c+s)][n];return w0*e*f/p.alpha**n*(x<0&&n%2?-1:1);}
export const lineFlexure=(x,Q,p)=>lineDerivative(x,Q,p,0);
export const sinusoidFlexure=(x,q,lambda,p)=>q*Math.cos(2*Math.PI*x/lambda)/(p.D*(2*Math.PI/lambda)**4+p.c);
export const edgeFlexure=(x,C,S,p)=>Math.exp(-x/p.alpha)*(C*Math.cos(x/p.alpha)+S*Math.sin(x/p.alpha));
export function edgeFeatures(C,S,p){const phi=Math.atan2(S,C),x0=p.alpha*(phi+Math.PI/2),xb=p.alpha*(phi+3*Math.PI/4),wb=-Math.hypot(C,S)*Math.exp(-xb/p.alpha)/Math.SQRT2,alphaFit=4*(xb-x0)/Math.PI,Dfit=p.c*alphaFit**4/4,TeFit=(12*(1-p.nu*p.nu)*Dfit/p.E)**(1/3);return {phi,x0,xb,wb,alphaFit,TeFit};}
export const relaxationTime=(eta,lambda,rho=3300)=>4*Math.PI*eta/(rho*g*lambda);
export function phi1(u){return u<1e-8?1-u/2+u*u/6:-Math.expm1(-u)/u;}
export function reboundFactor(t,tau,melt=0){if(melt===0)return Math.exp(-t/tau);if(t<melt)return 1+(t/melt)*(phi1(t/tau)-1);return phi1(melt/tau)*Math.exp(-(t-melt)/tau);}
export function rebound(t,eta,lambda,a0,melt=0){const tau=relaxationTime(eta,lambda),remaining=a0*reboundFactor(t,tau,melt),equilibrium=melt>0&&t<melt?a0*(1-t/melt):0,rate=(remaining-equilibrium)/tau;return {tau,remaining,uplift:a0-remaining,rate};}
export function geoidSignals(x,m,depth,separation=30000,compensated=true){const r=Math.hypot(x,depth),r2=Math.hypot(x,depth+separation),T=G*m*(1/r-(compensated?1/r2:0)),down=G*m*(depth/r**3-(compensated?(depth+separation)/r2**3:0));return {T,N:T/g,down};}
// w and z are positive downward; top z=−Te/2. Axial stress is positive in tension.
export const edgeCurvature=(x,C,S,p)=>{const u=x/p.alpha;return Math.exp(-u)*(-2*S*Math.cos(u)+2*C*Math.sin(u))/p.alpha**2;};
export const topFibreStress=(x,C,S,p)=>p.E*p.Te*edgeCurvature(x,C,S,p)/(2*(1-p.nu*p.nu));
// Evaluate intended imbalance directly: subtraction of full column pressures loses tiny loads.
export const airyPressureMismatch=(h,rho,fraction)=>g*rho*h*(1-fraction);
export const prattUniformMismatch=(h,rho)=>g*rho*h;
