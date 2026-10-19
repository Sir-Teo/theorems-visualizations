// Coale–Trussell standards: UN Manual X (1983), printed p.24, Table3.
// Ages20–24,...,45–49; distinct from Coale's Hutterite index reference.
export const CT_NATURAL = [0.460,0.431,0.395,0.322,0.167,0.024];
export const CT_DEPARTURE = [0,-0.279,-0.667,-1.042,-1.414,-1.671];
/** Log-linear fit over ages20–44, as recommended next to Table3 (EqE.6). */
export function fitCoaleTrussell(rates) {
 const points=rates.slice(0,5).flatMap((r,i)=>r>0?[{v:CT_DEPARTURE[i],y:Math.log(r/CT_NATURAL[i]),i}]:[]);
 if(points.length<2)return null;
 const n=points.length,mv=points.reduce((s,p)=>s+p.v,0)/n,my=points.reduce((s,p)=>s+p.y,0)/n;
 const sxx=points.reduce((s,p)=>s+(p.v-mv)**2,0),sxy=points.reduce((s,p)=>s+(p.v-mv)*(p.y-my),0),syy=points.reduce((s,p)=>s+(p.y-my)**2,0);
 const m=sxy/sxx,lnM=my-m*mv;
 return {M:Math.exp(lnM),m,r2:syy>0?sxy*sxy/(sxx*syy):1};
}
