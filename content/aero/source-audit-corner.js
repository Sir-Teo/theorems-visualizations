// Perfect-gas corner states, checked against NACA Report 1135, pp620–626.
import {G,thetaMax,shockAngles,obliqueJump,nuPM,NU_MAX} from './ch04.shared.js';
export function expansionMach(nu) {
  if (nu <= 0) return 1;
  if (nu >= NU_MAX) return Infinity;
  let lo=1,hi=2;
  while(nuPM(hi)<nu)hi*=2;
  for(let i=0;i<100;i++){const mid=(lo+hi)/2;if(nuPM(mid)<nu)lo=mid;else hi=mid;}
  return(lo+hi)/2;
}
export function cornerState(M1,turn,branch='weak') {
  if(turn===0)return{kind:'none',M2:M1,p:1,T:1,p0:1};
  if(turn>0){
    const tm=thetaMax(M1),sa=shockAngles(turn,M1);
    if(!sa)return{kind:'detached',tm};
    const beta=sa[branch],j=obliqueJump(M1,beta);
    return{kind:'shock',beta,sa,j,tm};
  }
  const nu1=nuPM(M1),nu2=nu1-turn,vac=nu2>=NU_MAX;
  if(vac)return{kind:'fan',nu1,nu2,vac,M2:Infinity,p:0,T:0,p0:1};
  const M2=expansionMach(nu2),T=(1+.5*(G-1)*M1*M1)/(1+.5*(G-1)*M2*M2);
  return{kind:'fan',nu1,nu2,vac,M2,p:T**(G/(G-1)),T,p0:1};
}
