// Explicitly illustrative global energy-balance models; no historical reconstruction.
export const ICE_S=1361,ICE_AO=.265,ICE_AI=.62,ICE_EPS=.6106,ICE_SIG=5.670374419e-8,ICE_F0=(.3-ICE_AO)/(ICE_AI-ICE_AO);
export const iceFraction=(T,k)=>Math.max(0,Math.min(1,ICE_F0+k*(288-T)));
export const iceASR=(T,k)=>ICE_S/4*(1-ICE_AO-(ICE_AI-ICE_AO)*iceFraction(T,k));
export const iceOLR=T=>ICE_EPS*ICE_SIG*T**4;
export const iceResidual=(T,F,k)=>iceASR(T,k)+F-iceOLR(T);
export const iceForcing=(T,k)=>iceOLR(T)-iceASR(T,k);
export function iceRoots(F,k){
 const critical=k>0?(ICE_S/4*(ICE_AI-ICE_AO)*k/(4*ICE_EPS*ICE_SIG))**(1/3):0;
 const knots=[0,500];if(k>0)knots.push(288+(ICE_F0-1)/k,288+ICE_F0/k,critical);
 const xs=[...new Set(knots.filter(x=>x>=0&&x<=500))].sort((a,b)=>a-b),out=[];
 const put=T=>{if(out.some(r=>Math.abs(r.T-T)<1e-6))return;const h=1e-5,left=iceResidual(T-h,F,k),right=iceResidual(T+h,F,k);out.push({T,stable:left>0&&right<0,unstable:left<0&&right>0,marginal:!(left*right<0)});};
 for(const x of xs)if(Math.abs(iceResidual(x,F,k))<1e-9)put(x);
 for(let j=1;j<xs.length;j++){let a=xs[j-1],b=xs[j],ga=iceResidual(a,F,k),gb=iceResidual(b,F,k);if(ga*gb>=0)continue;for(let n=0;n<80;n++){const m=(a+b)/2,g=iceResidual(m,F,k);if(ga*g>0){a=m;ga=g;}else b=m;}put((a+b)/2);}
 return out.sort((a,b)=>a.T-b.T);
}
export function feedbackRounds(f,d0,n){let S=0,term=d0;const pts=[];for(let j=0;j<=n;j++){const before=S;S+=term;pts.push({j,before,total:S,term});term*=f;}return{pts,total:S,limit:f<1?d0/(1-f):null,gain:f<1?1/(1-f):null};}
