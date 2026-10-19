// Original Bosch & Hale 1992, Eqs12–14/TableVII, T(d,n)4He column.
// Reactivity fit range: 0.2–100 keV; cm³/s converted to m³/s.
const DT_C=[1.17302e-9,1.51361e-2,7.51886e-2,4.60643e-3,1.35e-2,-1.0675e-4,1.366e-5];
export const KEV_J_AUDIT=1.602176634e-16;
// Rounded energies and bremsstrahlung coefficient used by Wurzel & Hsu,
// original author manuscript arXiv2105.10954, SecIII/Eqs7,11,16,22.
export const FUSION_INPUTS_AUDIT={alphaKeV:3500,fusionKeV:17600,bremsW:5.34e-37};
export function fusionReactivityAudit(T){
  if(!(T>=.2&&T<=100))throw new RangeError('Bosch–Hale D–T fit requires 0.2–100 keV');
  const[c1,c2,c3,c4,c5,c6,c7]=DT_C;
  const theta=T/(1-T*(c2+T*(c4+T*c6))/(1+T*(c3+T*(c5+T*c7))));
  const xi=Math.cbrt(34.3827**2/(4*theta));
  return 1e-6*c1*theta*Math.sqrt(xi/(1124656*T**3))*Math.exp(-3*xi);
}
export function fusionThresholdAudit(T,Q=Infinity){
  const a=FUSION_INPUTS_AUDIT,d=fusionReactivityAudit(T)/4*(a.alphaKeV+(Number.isFinite(Q)?a.fusionKeV/Q:0))*KEV_J_AUDIT-a.bremsW*Math.sqrt(T);
  return d>0?3*T*T*KEV_J_AUDIT/d:Infinity;
}
export function fusionBalanceAudit({n=1e20,T=15,tau=1}={}){
  const a=FUSION_INPUTS_AUDIT,rate=n*n/4*fusionReactivityAudit(T),fusion=rate*a.fusionKeV*KEV_J_AUDIT,alpha=rate*a.alphaKeV*KEV_J_AUDIT;
  const transport=3*n*T*KEV_J_AUDIT/tau,brems=a.bremsW*n*n*Math.sqrt(T),net=transport+brems-alpha,external=Math.max(0,net);
  return{fusion,alpha,transport,brems,external,net,Q:net>0?fusion/net:Infinity,triple:n*T*tau,need:fusionThresholdAudit(T)};
}
export function fusionMinimumAudit(){
  // The displayed 1–100 keV window; minimize in log-temperature.
  let lo=0,hi=Math.log(100);const r=(Math.sqrt(5)-1)/2;let a=hi-r*(hi-lo),b=lo+r*(hi-lo);
  for(let j=0;j<100;j++)if(fusionThresholdAudit(Math.exp(a))<fusionThresholdAudit(Math.exp(b))){hi=b;b=a;a=hi-r*(hi-lo);}else{lo=a;a=b;b=lo+r*(hi-lo);}
  const T=Math.exp((lo+hi)/2);return{T,triple:fusionThresholdAudit(T)};
}
