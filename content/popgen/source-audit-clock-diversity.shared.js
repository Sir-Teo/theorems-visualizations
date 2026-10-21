export const jcMismatch=(rate,time)=>-.75*Math.expm1(-8*rate*time/3);
export function clockMoments(rate,length,time,cv=0){const lambda=2*rate*length*time;return{lambda,variance:lambda+cv*cv*lambda*lambda};}
export function clockDraw(r,M,rate,length,time,cv=0){const G=cv>0?M.dist.gamma(1/(cv*cv),cv*cv).sample(r):1;return{G,count:M.dist.poisson(2*rate*length*time*G).sample(r)};}
export function poissonCentral(M,lambda){const d=M.dist.poisson(lambda),lo=d.quantile(.025),hi=d.quantile(.975);return{lo,hi,outside:d.cdf(lo-1)+1-d.cdf(hi)};}
export function pearsonKnown(points,slope){const z=points.map(([t,k])=>(k-slope*t)/Math.sqrt(slope*t));return{z,meanSquare:z.reduce((a,x)=>a+x*x,0)/z.length};}
export function neutralDiversity(census,mu,ceiling=Infinity){if(!(census>0&&mu>=0&&ceiling>0))throw new RangeError('positive sizes and nonnegative mutation rate');const ne=1/(1/census+1/ceiling),theta=4*ne*mu;return{ne,theta,pi:theta/(1+4*theta/3)};}
export const LEFFLER_EXAMPLES=[{name:'gibbon',species:'Hoolock leuconedys',low:1e4,high:5e4,pi:.0021},{name:'collared flycatcher',species:'Ficedula albicollis',low:4e6,high:7e6,pi:.0038},{name:'white-throated sparrow',species:'Zonotrichia albicollis',low:1.4e8,high:1.4e8,pi:.0066}];
