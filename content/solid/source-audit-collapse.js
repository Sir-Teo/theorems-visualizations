// Chosen fixed-ended beam, symmetric bending capacity and a midspan point load.
export function collapseStatic(Mp,L,mA,mB){
  const load=4*(Mp+(mA+mB)/2)/L;
  const moments=[-mA,Mp,-mB],moment=x=>x<=L/2?moments[0]+(moments[1]-moments[0])*2*x/L:moments[1]+(moments[2]-moments[1])*(2*x/L-1);
  return{load,moments,moment,leftReaction:(Mp+mA)*2/L,rightReaction:(Mp+mB)*2/L};
}
export function collapseMechanism(Mp,L,x){
  const tA=1/x,tB=1/(L-x),deflection=s=>s<=x?s/x:(L-s)/(L-x),work=2*Mp*(tA+tB),dL=deflection(L/2);
  return{load:work/dL,work,dL,tA,tB,deflection};
}
