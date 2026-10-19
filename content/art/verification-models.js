import { toLMS, cmf, cross3 } from './ch04.shared.js';

/** Brettel–Viénot–Mollon1997 equations6–11 and branch rules p2650.
 * This illustration uses the chapter's approximate LMS basis, with equal-energy white [1,1,1]. */
export function simulateDichromat(type,q) {
 const missing=type==='protan'?0:type==='deutan'?1:2;
 const lambda=type==='tritan'?(q[1]<q[0]?660:485):(q[2]<(type==='protan'?q[1]:q[0])?575:475);
 const normal=cross3([1,1,1],toLMS(cmf(lambda))),out=q.slice();
 out[missing]=-normal.reduce((sum,n,i)=>sum+(i===missing?0:n*q[i]),0)/normal[missing];
 return out;
}
