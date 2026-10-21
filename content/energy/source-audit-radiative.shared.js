import{KB,HPL,CLIGHT,QE,FW,T_SUN,S0}from'./ch04.shared.js';

// Source basis: Shockley–Queisser1961 §§2–5, Herrmann–Würfel2005,
// author proof, Eqs7/14, and Rühle2016 Eqs3–4. The full Bose denominator
// is retained rather than replaced by its Boltzmann approximation. This uses
// full distribution with mu=qV, step absorption/emission in the same window,
// fixed temperatures and ambient thermal photons at the cell temperature.
const PREF=2*Math.PI/(HPL**3*CLIGHT**2),Z2=Math.PI**2/6,Z3=1.2020569031595943;
export const RADIATIVE_INPUTS_AUDIT={KB,HPL,CLIGHT,QE,FW,T_SUN,S0,maxConcentration:1/FW};

// Li_s(exp(-x)),s=1,2,3. For x<=1, integrate the convergent Bernoulli
// expansion of log(1-exp(-x)); otherwise sum the rapidly converging series.
// The Li1 singularity is kept analytically, so a very small positive Eg-mu
// never requires summing millions of nearly equal exponential terms.
function polylogs(x){
 if(x===0)return[Infinity,Z2,Z3];
 const L1=x<.5?-Math.log(-Math.expm1(-x)):-Math.log1p(-Math.exp(-x));let L2,L3;
 if(x<=1){
  const log=Math.log(x);L2=Z2+x*(log-1)-x*x/4;L3=Z3-Z2*x+x*x*(.75-.5*log)+x**3/12;
  const B=[1/6,-1/30,1/42,-1/30,5/66,-691/2730,7/6];let fact=1;
  for(let i=0;i<B.length;i++){const n=i+1,k=2*n;fact*=(k-1)*k;const a=B[i]/(k*fact*(k+1));L2+=a*x**(k+1);L3-=a*x**(k+2)/(k+2);}
 }else{
  const r=Math.exp(-x);let q=r;L2=0;L3=0;
  for(let n=1;n<1000;n++){const a=q/(n*n);L2+=a;L3+=a/n;if(a<1e-16*Math.max(L2,1e-300))break;q*=r;}
 }
 return[L1,L2,L3];
}
function tail(E,T,mu=0){
 if(E===Infinity)return{N:0,dN:0};
 const t=KB*T;if(E===0&&mu===0)return{N:PREF*2*t**3*Z3,dN:PREF*2*t*t*Z2};
 const x=(E-mu)/t;if(x<=0)return{N:Infinity,dN:Infinity};
 const[a,b,c]=polylogs(x);
 return{N:PREF*(E*E*t*a+2*E*t*t*b+2*t**3*c),dN:PREF*(E*E/Math.expm1(x)+2*E*t*a+2*t*t*b)};
}
export function radiativeFluxAudit(E1,E2,T,mu=0){
 if(!(E2>E1))return{N:0,dN:0};const a=tail(E1,T,mu),b=tail(E2,T,mu);return{N:a.N-b.N,dN:a.dN-b.dN};
}
export function radiativeEnergyAudit(E1,E2,T){
 const t=KB*T;
 const integral=E=>{if(E===Infinity)return 0;if(E===0)return PREF*t**4*Math.PI**4/15;let sum=0;const r=Math.exp(-E/t);let q=r;
  for(let n=1;n<1000;n++){const a=q*(E**3*t/n+3*E*E*t*t/n**2+6*E*t**3/n**3+6*t**4/n**4);sum+=a;if(a<1e-16*Math.max(sum,1e-300))break;q*=r;}return PREF*sum;};
 return E2>E1?integral(E1)-integral(E2):0;
}
export function radiativeJunctionAudit(E1,E2,o){
 const faces=o.faces??1,Tc=o.Tc??300,conc=o.conc??1,F=FW*conc;
 if(!(F>0&&F<=1+1e-12&&Tc>0&&Tc<T_SUN&&faces>=1&&E1>0&&E2>=E1))throw new RangeError('Outside the radiative teaching model');
 const thermal=radiativeFluxAudit(E1,E2,Tc).N,solar=F*radiativeFluxAudit(E1,E2,T_SUN).N,A=solar-F*thermal,vt=KB*Tc;
 const flux=V=>radiativeFluxAudit(E1,E2,Tc,V),J=V=>A-faces*(flux(V).N-thermal);
 // Solve in log((Eg-mu)/kT): Voc may round to Eg for small gaps at
 // full concentration, although its positive gap remains representable.
 const voltageForCurrent=current=>{
  if(!(A>0)||current>=A)return{V:0,gap:E1,dN:flux(0).dN};
  const target=thermal+(A-current)/faces;let lo=-700,hi=Math.log(E1/vt),z;
  const boltz=vt*Math.log(target/thermal);
  if(boltz<E1-vt*.5)z=Math.log((E1-Math.max(0,boltz))/vt);
  else z=Math.min(hi,Math.max(lo,(2*E1*vt*vt*Z2+2*vt**3*Z3-target/PREF)/(E1*E1*vt)));
  let point;
  for(let i=0;i<70;i++){
   const gap=vt*Math.exp(z),V=E1-gap;
   // Keep the lower-limit gap without cancellation when V rounds to Eg.
   const L=polylogs(Math.exp(z)),high=tail(E2,Tc,V);
   point={N:PREF*(E1*E1*vt*L[0]+2*E1*vt*vt*L[1]+2*vt**3*L[2])-high.N,dN:PREF*(E1*E1/Math.expm1(Math.exp(z))+2*E1*vt*L[0]+2*vt*vt*L[1])-high.dN,V,gap};
   const residual=point.N-target;if(Math.abs(residual)<2e-13*Math.max(target,1e-300))return point;
   if(residual>0)lo=z;else hi=z;
   const step=z+residual/(gap*point.dN);z=step>lo&&step<hi?step:(lo+hi)/2;
  }
  return point;
 };
 const open=voltageForCurrent(0);
 return{A,solar,thermal,faces,Tc,vt,E1,E2,conc,Voc:open.V,VocGap:open.gap,J,flux,voltageForCurrent};
}
export function radiativeMaximumAudit(j){
 if(!(j.A>0))return{P:0,V:0,J:0};let lo=0,hi=j.E1;
 for(let i=0;i<55;i++){const V=(lo+hi)/2,q=j.flux(V),J=j.A-j.faces*(q.N-j.thermal);if(J-V*j.faces*q.dN>0)lo=V;else hi=V;}
 const V=(lo+hi)/2,J=j.J(V);return{V,J,P:QE*V*J};
}
export function radiativeStackAudit(gaps,o,mode='series'){
 const g=[...gaps].sort((a,b)=>b-a),js=g.map((E,i)=>radiativeJunctionAudit(E,i?g[i-1]:Infinity,o)),Pin=S0*o.conc;
 if(mode==='indep'||js.length===1){
  const parts=js.map(j=>({...radiativeMaximumAudit(j),A:j.A,solar:j.solar}));return{eta:parts.reduce((s,p)=>s+p.P,0)/Pin,parts,js,...(js.length===1?{j:parts[0].J}:{})};
 }
 let lo=0,hi=Math.min(...js.map(j=>j.A));
 if(!(hi>0))return{eta:0,parts:js.map(j=>({P:0,V:0,A:j.A,solar:j.solar})),j:0,js};
 for(let i=0;i<45;i++){const current=(lo+hi)/2,pts=js.map(j=>j.voltageForCurrent(current)),V=pts.reduce((s,p)=>s+p.V,0),slope=pts.reduce((s,p,k)=>s+1/(js[k].faces*p.dN),0);if(V-current*slope>0)lo=current;else hi=current;}
 const current=(lo+hi)/2,parts=js.map(j=>{const p=j.voltageForCurrent(current);return{V:p.V,P:QE*current*p.V,A:j.A,solar:j.solar};});return{eta:parts.reduce((s,p)=>s+p.P,0)/Pin,parts,j:current,js};
}
