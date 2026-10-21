// Closed radial integrals for H = −∇²/2 − 1/r (atomic units).
export const HYDROGEN_TRIALS = {
  gauss: { psi: (r,p)=>Math.exp(-p*r*r), dpsi: (r,p)=>-2*p*r*Math.exp(-p*r*r), lo:.03, hi:1.5, peak:p=>1/Math.sqrt(2*p) },
  slater: { psi: (r,p)=>Math.exp(-p*r), dpsi: (r,p)=>-p*Math.exp(-p*r), lo:.2, hi:2.4, peak:p=>1/p },
  lor: { psi: (r,p)=>(1+p*r)**-3, dpsi: (r,p)=>-3*p*(1+p*r)**-4, lo:.1, hi:4, peak:p=>.5/p },
};
export function hydrogenEnergy(f,p) {
  if (!(p>0) || !HYDROGEN_TRIALS[f]) throw new RangeError('positive exponent and known trial family required');
  const T=f==='gauss'?1.5*p:f==='slater'?p*p/2:9*p*p/7;
  const V=f==='gauss'?-2*Math.sqrt(2*p/Math.PI):f==='slater'?-p:-1.5*p;
  const norm=f==='gauss'?Math.sqrt(Math.PI)/(4*(2*p)**1.5):f==='slater'?1/(4*p**3):1/(30*p**3);
  return {E:T+V,T,V,norm};
}
export function hydrogenTrial(f,p) {
  const a=hydrogenEnergy(f,p);let ov=0;
  // Only the overlap needs quadrature. exp(−r) makes the omitted r>40 tail negligible.
  if(f==='slater')a.c0=64*p**3/(p+1)**6;
  else {const n=8000,h=40/n;for(let i=0;i<=n;i++){const r=i*h;ov+=(i===0||i===n?1:i%2?4:2)*r*r*HYDROGEN_TRIALS[f].psi(r,p)*Math.exp(-r);}a.c0=4*(ov*h/3)**2/a.norm;}
  return a;
}
export const heliumTerms=(Z,z)=>({T:z*z,Vne:-2*Z*z,Vee:5*z/8,E:z*z-2*Z*z+5*z/8});
export const heliumOptimum=Z=>({z:Z-5/16,E:-((Z-5/16)**2)});
