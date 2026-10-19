// Exact finite certificates for the audited perfect-graph/χ-boundedness demonstrations (n ≤ 14).
import {bitsOf,popc,full,complementA,masksOf,mycielski,CP,lemmaColour,gyNbr,compMasks,lowBit} from './ch05-z.shared.js';
const cache=new Map();
/** Dynamic programming over all vertex subsets, with no search timeout interpreted as impossibility. */
export function exactTable(A){
 const n=A.length;if(n>14)throw new Error('Exact coloring demonstration supports at most 14 vertices.');
 const key=A.join(','),hit=cache.get(key);if(hit)return hit;
 const M=1<<n,stable=new Uint8Array(M),chi=new Uint8Array(M),omega=new Uint8Array(M),alpha=new Uint8Array(M),choice=new Uint16Array(M);stable[0]=1;
 for(let S=1;S<M;S++){
  const b=S&-S,v=31-Math.clz32(b),R=S^b;
  stable[S]=stable[R]&&!(A[v]&R)?1:0;omega[S]=Math.max(omega[R],1+omega[R&A[v]]);alpha[S]=Math.max(alpha[R],1+alpha[R&~A[v]]);
  if(stable[S]){chi[S]=1;choice[S]=S;continue;}
  let best=chi[R]+1,pick=b;const C=R&~A[v];
  for(let T=C;best>omega[S]&&T;T=(T-1)&C)if(stable[T]){const value=1+chi[S^(T|b)];if(value<best){best=value;pick=T|b;}}
  chi[S]=best;choice[S]=pick;
 }
 const result={chi,omega,alpha,choice,stable};if(cache.size>=60)cache.delete(cache.keys().next().value);cache.set(key,result);return result;
}
export function chiColour(A,S=full(A.length)){const t=exactTable(A),col=new Int16Array(A.length).fill(-1);let left=S,c=0;while(left){const I=t.choice[left];for(const v of bitsOf(I))col[v]=c;left^=I;c++;}return{chi:t.chi[S],col};}
export const chiOf=(A,S=full(A.length))=>exactTable(A).chi[S];
export function scanInduced(A){const t=exactTable(A),rows=[];for(let S=1;S<1<<A.length;S++)rows.push({S,size:popc(S),w:t.omega[S],a:t.alpha[S],chi:t.chi[S]});return rows;}
/** Exhaustive induced-cycle certificates: no cap shared with shorter/even cycles. */
export function holesIn(A,S=full(A.length),minLen=4){
 const out=[];for(let T=S;T;T=(T-1)&S){if(popc(T)<minLen)continue;const vertices=bitsOf(T);if(vertices.some(v=>popc(A[v]&T)!==2))continue;
  const start=vertices[0],cycle=[start];let prev=-1,u=start;
  for(;;){const next=bitsOf(A[u]&T).find(w=>w!==prev);if(next===start)break;if(cycle.includes(next))break;cycle.push(next);prev=u;u=next;}
  if(cycle.length===vertices.length)out.push(cycle);
 }return out.sort((a,b)=>a.length-b.length||a.join(',').localeCompare(b.join(',')));
}
export const oddHoles=(A,S=full(A.length))=>holesIn(A,S,5).filter(c=>c.length%2);
export const oddAntiholes=(A,S=full(A.length))=>oddHoles(complementA(A),S);
export function classColor(c){if(c<0)return null;if(CP[c])return CP[c];const h=((c*137.508)%360)/60,C=.6256,X=C*(1-Math.abs(h%2-1)),m=.2272,channels=[[C,X,0],[X,C,0],[0,C,X],[0,X,C],[X,0,C],[C,0,X]][Math.floor(h)];return `rgb(${channels.map(x=>Math.round(255*(x+m))).join(',')})`;}
export function normalizeColouring(col,S){const classes=[...new Set(bitsOf(S).map(v=>col[v]))].sort((a,b)=>a-b),out=new Int16Array(col.length).fill(-1);for(const v of bitsOf(S))out[v]=classes.indexOf(col[v]);return{col:out,used:classes.length};}
export function pathBound(k,w){if(!w)return 0;let b=1;for(let r=2;r<=w;r++)b=(k-2)*(b+1)+1;return b;}
export function pathProofColour(A,root=0){const F=full(A.length),col=new Int16Array(A.length).fill(-1),f=gyNbr(A);for(const C of compMasks(A,F)){const r=(C>>root)&1?root:lowBit(C),proof=lemmaColour(A,C,r,f);for(const v of bitsOf(C))col[v]=proof.col[v];}return normalizeColouring(col,F);}
export function mycielskiCertificates(){let n=2,E=[[0,1]];const points=[];for(let k=2;k<=4;k++){const A=masksOf(n,E),t=exactTable(A),F=full(n);points.push({k:t.chi[F],omega:t.omega[F],exact:true,n});if(k<4){const next=mycielski(n,E);n=next.n;E=next.E;}}for(let k=5;k<=8;k++)points.push({k,omega:2,exact:false});return points;}
