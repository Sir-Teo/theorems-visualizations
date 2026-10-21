// Chapter-local calculations: SI internally; energies supplied in kJ mol^-1.
export const R=8.31446261815324,F=96485.33212331002,NA=6.02214076e23,kB=1.380649e-23,h=6.62607015e-34;
export const sources={cage:'https://goldbook.iupac.org/terms/view/C00771',diff:'https://www.ks.uiuc.edu/Services/Class/PHYS498/LectureNotes/chp8.pdf',salt:'https://goldbook.iupac.org/terms/view/K03401',dh:'https://goldbook.iupac.org/terms/view/D01534',bron:'https://goldbook.iupac.org/terms/view/B00746',marcus:'https://goldbook.iupac.org/terms/view/M03702',nobel:'https://www.nobelprize.org/uploads/2018/06/marcus-lecture.pdf',paper:'https://authors.library.caltech.edu/records/desqy-fmq55',bv:'https://ocw.mit.edu/courses/10-626-electrochemical-energy-systems-spring-2014/56cfa6e0f28bc8fc1a647cbe679384d1_MIT10_626S14_S11lec13.pdf'};
export const sci=x=>x.toExponential(3),log10=Math.log10;
export function cage(p,q,n=12){const r=(1-p)*q,z=1-r;return{r,reaction:p/z,escape:(1-p)*(1-q)/z,mean:1/z,bins:Array.from({length:n},(_,j)=>z*r**j),tail:r**n};}
export const diffusion=(radius,D)=>4*Math.PI*radius*D;
export const molar=k=>1000*NA*k;
export const capture=da=>da/(1+da);
export const coulomb=x=>x===0?1:x/Math.expm1(x);
export function simpson(f,n=512){let s=f(0)+f(1);for(let i=1;i<n;i++)s+=(i%2?4:2)*f(i/n);return s/(3*n);}
export function screened(xi,s,n=512){if(s===0)return coulomb(xi);return 1/simpson(x=>Math.exp(x===0?0:xi*x*Math.exp(-s/x)),n);}
export function salt(zA,zB,I,A=.509){const u=Math.sqrt(I),gamma=z=>10**(-A*z*z*u);return{ratio:10**(2*A*zA*zB*u),a:gamma(zA),b:gamma(zB),ts:gamma(zA+zB),slope:2*A*zA*zB};}
export const acidLog=(pKa,alpha,intercept)=>intercept-alpha*pKa;
export const harmonic=(a,b)=>a*b/(a+b);
export const barrier=(lambda,dG)=>(lambda+dG)**2/(4*lambda);
export const etLog=(lambda,dG,T,kappa=1)=>Math.log(kappa*kB*T/h)-1000*barrier(lambda,dG)/(R*T);
export function bv(eta,alpha,T,j0=1){const u=F*eta/(R*T),a=j0*Math.exp((1-alpha)*u),c=-j0*Math.exp(-alpha*u);return{a,c,net:j0*Math.exp(-alpha*u)*Math.expm1(u),u,rct:R*T/(F*j0)};}
export const tafelError=u=>1/Math.expm1(Math.abs(u));
export const tafelSlope=(alpha,T,cathodic=false)=>Math.LN10*R*T/(F*(cathodic?alpha:1-alpha));
export function crossing(ls,li,u){const L=ls+li,n=Math.hypot(ls,li),qs=.5+u*li/n,qi=.5-u*ls/n,gr=ls*qs*qs+li*qi*qi,gp=ls*(qs-1)**2+li*(qi-1)**2;return{qs,qi,gr,gp,min:L/4,excess:gr-L/4};}
export function plot(v,title,x=[0,1],y=[0,1],xlabel='x',ylabel='y',equal=false){const s=v.stage({x,y,axes:'box',gutter:true,height:310,minWidth:260,title,xlabel,ylabel,equal});if(equal){s.el.style.maxWidth='580px';s.el.style.marginInline='auto';}return s;}
export const scope=String.raw`All curves are authored model calculations, not experimental measurements. Constants are SI; unit conversions and model assumptions are stated locally. Activity corrections, continuum diffusion, harmonic electron-transfer surfaces and electrode kinetics describe different regimes and cannot be substituted for one another.`;
