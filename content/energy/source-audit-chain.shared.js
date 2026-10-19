// DOE-HDBK-1019/2-93 NP03pp6–7 teaching example (not a current evaluated library).
// Moderator absorption: inspected NIST NCNR table, 2200 m/s.
export const CHAIN_INPUTS_AUDIT={nu:2.42,fission235:582,absorption235:694,absorption238:2.71,resonance:25,fast:1.03};
export const CHAIN_MODERATORS_AUDIT={
  h2o:{n:'light water',sa:2*.3326+.00019,slowing:40,N0:3,lab:'H₂O molecules per U atom'},
  d2o:{n:'heavy water',sa:2*.000519+.00019,slowing:5.3,N0:150,lab:'D₂O molecules per U atom'},
  c:{n:'graphite',sa:.0035,slowing:.75,N0:400,lab:'C atoms per U atom'},
};
// Equal thermal flux for the utilization approximation; resonance and slowing
// parameters are explicitly chosen effective inputs, not measured lattice data.
export function chainFactorsAudit({moderator='h2o',fraction=.03,ratio=3,absorber=6,nonleakage=.97}={}){
  const a=CHAIN_INPUTS_AUDIT,m=CHAIN_MODERATORS_AUDIT[moderator],fuel=fraction*a.absorption235+(1-fraction)*a.absorption238;
  const eta=a.nu*fraction*a.fission235/fuel,f=fuel/(fuel+ratio*m.sa+absorber),p=Math.exp(-(1-fraction)*a.resonance/(ratio*m.slowing));
  const kinf=eta*f*p*a.fast;return {eta,f,p,eps:a.fast,kinf,keff:kinf*nonleakage};
}
// Solve survival s=1−exp(−k s). Dividing by s removes the trivial root,
// and expm1 preserves precision close to criticality.
export function poissonSurvivalAudit(k){
  if(k<=1)return 0;
  let lo=0,hi=1;
  for(let j=0;j<75;j++){const mid=(lo+hi)/2,g=-Math.expm1(-k*mid)/mid-1;if(g>0)lo=mid;else hi=mid;}
  return (lo+hi)/2;
}
export function chainGenerationsAudit(random,k,generations=9,initial=4){
  const layers=[Array.from({length:initial},()=>({par:-1}))];
  const poisson=()=>{const limit=Math.exp(-k);let n=0,p=1;do{n++;p*=random();}while(p>limit);return n-1;};
  for(let g=1;g<=generations;g++){
    const next=[];for(let i=0;i<layers[g-1].length;i++){const count=poisson();for(let j=0;j<count;j++)next.push({par:i});}
    layers.push(next);
  }
  return layers;
}
