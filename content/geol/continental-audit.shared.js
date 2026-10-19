// Chosen constant-property column models. Depth km, flux mW/m², production µW/m³.
export const layers=[{name:'shale',k:1.8,h:.7,col:'orange'},{name:'sandstone',k:3.2,h:.9,col:'gold'},{name:'rock salt',k:5.5,h:.5,col:'teal'},{name:'granite',k:2.9,h:1.5,col:'purple'}];
export function layerK(z,ls=layers){let depth=0;for(const l of ls){depth+=l.h;if(z<=depth)return l.k;}return ls.at(-1).k;}
export function layerTemperature(z,q,ls=layers,T0=10){let depth=0,T=T0;for(const l of ls){const dz=Math.min(l.h,Math.max(0,z-depth));T+=q*dz/l.k;depth+=l.h;if(z<=depth)break;}return T;}
export function productionAt(z,{A0,h,model='uni'}){return model==='uni'?(z<=h?A0:0):A0*Math.exp(-z/h);}
export function productionFlux(z,{qm,A0,h,model='uni'}){return qm+(model==='uni'?A0*Math.max(h-z,0):A0*h*Math.exp(-z/h));}
export function productionTemperature(z,{qm,A0,h,model='uni',k=2.5,T0=10}){return T0+qm*z/k+(model==='uni'?A0*(z<=h?h*z-z*z/2:h*h/2)/k:-A0*h*h*Math.expm1(-z/h)/k);}
export function fitLine(pts){const n=pts.length,mx=pts.reduce((s,p)=>s+p[0],0)/n,my=pts.reduce((s,p)=>s+p[1],0)/n;let xx=0,xy=0;for(const[x,y]of pts){xx+=(x-mx)**2;xy+=(x-mx)*(y-my);}if(!n||xx===0)return null;const slope=xy/xx,intercept=my-slope*mx,rss=pts.reduce((s,[x,y])=>s+(y-intercept-slope*x)**2,0);return{slope,intercept,rss,rms:Math.sqrt(rss/n)};}
