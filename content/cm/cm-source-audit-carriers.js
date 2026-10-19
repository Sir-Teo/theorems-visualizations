import {fdHalf} from './ch04.shared.js';
export const KB_A=1.380649e-23/1.602176634e-19;
// Hu2010 Table1–4 DOS at300K; Ioffe institutional parameterization for gaps.
export const MATERIALS={
 Si:{name:'Si',Eg0:1.17,alpha:4.73e-4,beta:636,Nc300:2.8e19,Nv300:1.04e19,Ed:.045},
 Ge:{name:'Ge',Eg0:.742,alpha:4.8e-4,beta:235,Nc300:1.04e19,Nv300:6e18,Ed:.013},
 GaAs:{name:'GaAs',Eg0:1.519,alpha:5.405e-4,beta:204,Nc300:4.7e17,Nv300:7e18,Ed:.006},
};
export const gapA=(m,T)=>m.Eg0-m.alpha*T*T/(T+m.beta);
export const densityC=(m,T)=>m.Nc300*(T/300)**1.5;
export const densityV=(m,T)=>m.Nv300*(T/300)**1.5;
export const intrinsicA=(m,T,E=gapA(m,T))=>Math.sqrt(densityC(m,T)*densityV(m,T))*Math.exp(-E/(2*KB_A*T));
export const fermiA=z=>z>=0?Math.exp(-z)/(1+Math.exp(-z)):1/(1+Math.exp(z));
export function carriersA(m,T,mu,E=gapA(m,T)){return{n:densityC(m,T)*fdHalf((mu-E)/(KB_A*T)),p:densityV(m,T)*fdHalf(-mu/(KB_A*T))};}
export function neutralityA(m,T,Nd,Na,Ed=m.Ed,E=gapA(m,T)){
 const kT=KB_A*T,donor=mu=>Nd*fermiA((mu-E+Ed)/kT+Math.LN2),f=mu=>{const c=carriersA(m,T,mu,E);return c.n+Na-c.p-donor(mu);};let lo=-.5,hi=E+.5;while(f(lo)>0)lo-=1;while(f(hi)<0)hi+=1;for(let j=0;j<90;j++){const mid=(lo+hi)/2;if(f(mid)>0)hi=mid;else lo=mid;}const mu=(lo+hi)/2,c=carriersA(m,T,mu,E),ndp=donor(mu);return{mu,...c,ndp,residual:c.n+Na-c.p-ndp};
}
export function dopingRegime(c,Nd,Na){if(Math.abs(c.n-c.p)/(c.n+c.p)<.1)return'intrinsic-like: electron and hole populations comparable';if(c.p>c.n)return'acceptor-dominated (compensated donor model)';if(c.ndp/Nd<.9)return'donor freeze-out / partial ionization';return'net donor-dominated, mostly ionized';}
export const HYDROGEN={RydbergEv:13.605693122990,bohrNm:.0529177210544};
export function impurityA(m,eps,a,T){const Ed=HYDROGEN.RydbergEv*m/(eps*eps),radius=HYDROGEN.bohrNm*eps/m;return{Ed,aB:radius,nat:4*Math.PI*radius**3*8/(3*a**3),kT:KB_A*T,valid:radius/a>=5};}
export const BAND_MODELS={
 GaAs:{label:'GaAs',Ed:1.424,valleys:[{k0:0,E0:1.424,c:5},{k0:1,E0:1.904,c:1.6,dom:[.5,1]}],Ei:null,Ep:0,Ad:5e4,Ai:0,edge:'X',a:.5653},
 Si:{label:'Si',Ed:3.4,valleys:[{k0:.85,E0:1.12,c:3.2,dom:[0,1]},{k0:0,E0:3.4,c:1.1}],Ei:1.12,k0:.85,Ep:.057,Ad:5e4,Ai:8e3,edge:'X',a:.5431},
 Ge:{label:'Ge',Ed:.8,valleys:[{k0:1,E0:.66,c:2.4,dom:[0,1]},{k0:0,E0:.8,c:2.2}],Ei:.66,k0:1,Ep:.03,Ad:5e4,Ai:1e4,edge:'L',a:.5658},
};
export const conductionA=(val,k)=>val.E0+val.c*(Math.abs(k)-val.k0)**2;
export function absorptionA(b,E,kT=KB_A*300){let d=b.Ad*Math.sqrt(Math.max(0,E-b.Ed)),a=0,e=0;if(b.Ei){const n=1/Math.expm1(b.Ep/kT);a=b.Ai*Math.max(0,E-b.Ei+b.Ep)**2*n;e=b.Ai*Math.max(0,E-b.Ei-b.Ep)**2*(1+n);}return{direct:d,absorb:a,emit:e,total:d+a+e};}
export function indirectA(b,E){if(!b.Ei||E<b.Ei-b.Ep)return null;const emission=E>=b.Ei+b.Ep,Ef=E+(emission?-b.Ep:b.Ep),v=b.valleys[0],q=Math.sqrt(Math.max(0,(Ef-v.E0)/v.c)),candidates=[v.k0-q,v.k0+q],kf=candidates.find(k=>k>=0&&k<=1);return{emission,Ef,kf:kf??null,deltaPhonon:Ef-E};}
