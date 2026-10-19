/** Exact Poisson sampling by additivity of independent Poisson pieces of mean at most 30. */
export function clockPoisson(rng,mean){let total=0;while(mean>0){const a=Math.min(30,mean),limit=Math.exp(-a);let k=0,p=1;do{k++;p*=rng();}while(p>limit);total+=k-1;mean-=a;}return total;}
/** Pearson mean-square against the known rate (no fitted degree of freedom removed). */
export function summarizeClock(points,rate,length){const residuals=points.map(([t,d])=>(d-2*rate*length*t)/Math.sqrt(2*rate*length*t)),sumTime=points.reduce((s,p)=>s+p[0],0);return{residuals,dispersion:residuals.reduce((s,z)=>s+z*z,0)/points.length,fittedRate:points.reduce((s,p)=>s+p[1],0)/(2*length*sumTime),overflow:residuals.filter(z=>Math.abs(z)>=4).length};}
