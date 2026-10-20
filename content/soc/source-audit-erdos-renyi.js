// Isolated authored simulation/numerics for soc4.1/4.2. Ideal random-graph laws
// use independent uniforms; drawings use this finite, reproducible PRNG.
const finite=Number.isFinite;
export function erSeed(x){if(!Number.isInteger(x)||x<0||x>0xffffffff)throw new RangeError('A uint32 sample seed is required');return x;}
export const erValidSeed=x=>Number.isInteger(x)&&x>=0&&x<=0xffffffff;
export function erRng(seed){let a=erSeed(seed);return()=>{a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function integerN(n,cap=10000){if(!Number.isInteger(n)||n<1||n>cap)throw new RangeError('Integer graph size outside the offered bound');}
function probability(p){if(!finite(p)||p<0||p>1)throw new RangeError('A probability in[0,1] is required');}
export function erUniforms(n,seed){integerN(n,120);const R=erRng(seed);return Float64Array.from({length:n*(n-1)/2},R);}
export function erGraph(n,edges){
 integerN(n,120);if(!Array.isArray(edges))throw new RangeError('An edge list is required');const adj=Array.from({length:n},()=>[]),matrix=Array.from({length:n},()=>new Uint8Array(n)),seen=new Set();
 for(const e of edges){if(!Array.isArray(e)||e.length!==2||!e.every(Number.isInteger))throw new RangeError('Integer endpoint pairs required');const[a,b]=e;if(a<0||b<=a||b>=n||seen.has(a*n+b))throw new RangeError('Distinct ordered simple-graph pairs required');seen.add(a*n+b);adj[a].push(b);adj[b].push(a);matrix[a][b]=matrix[b][a]=1;}
 const degrees=adj.map(a=>a.length),counts=Array(n).fill(0);degrees.forEach(d=>counts[d]++);const used=new Uint8Array(n),components=[];
 for(let a=0;a<n;a++)if(!used[a]){const q=[a];used[a]=1;for(let h=0;h<q.length;h++)for(const b of adj[q[h]])if(!used[b]){used[b]=1;q.push(b);}components.push(q);}
 components.sort((a,b)=>b.length-a.length||a[0]-b[0]);const m=edges.length,mean=2*m/n,variance=degrees.reduce((s,d)=>s+(d-mean)**2,0)/n,wedges=degrees.reduce((s,d)=>s+d*(d-1)/2,0);let triangles=0;
 for(let a=0;a<n;a++)for(let b=a+1;b<n;b++)if(matrix[a][b])for(let c=b+1;c<n;c++)if(matrix[a][c]&&matrix[b][c])triangles++;
 return{n,edges:edges.map(e=>e.slice()),adj,degrees,counts,components,m,mean,variance,wedges,triangles,transitivity:wedges?3*triangles/wedges:null,largest:components[0].length,second:components[1]?.length??0};
}
export function erGnp(n,uniforms,p){integerN(n,120);probability(p);if(!uniforms||uniforms.length!==n*(n-1)/2||!Array.from(uniforms).every(x=>finite(x)&&x>=0&&x<1))throw new RangeError('One[0,1) uniform per unordered pair required');const edges=[];let k=0;for(let a=0;a<n;a++)for(let b=a+1;b<n;b++)if(uniforms[k++]<p)edges.push([a,b]);return erGraph(n,edges);}
export function erDegreeLaw(n,p){
 integerN(n,120);probability(p);const N=n-1,c=N*p,binomial=Array(n).fill(0);
 if(p===0||N===0)binomial[0]=1;else if(p===1)binomial[N]=1;else{const mode=Math.min(N,Math.floor((N+1)*p));binomial[mode]=1;for(let k=mode;k>0;k--)binomial[k-1]=binomial[k]*k/(N-k+1)*(1-p)/p;for(let k=mode;k<N;k++)binomial[k+1]=binomial[k]*(N-k)/(k+1)*p/(1-p);const sum=binomial.reduce((s,x)=>s+x,0);for(let k=0;k<=N;k++)binomial[k]/=sum;}
 const poisson=Array(n+1).fill(0);poisson[0]=Math.exp(-c);for(let k=1;k<n;k++)poisson[k]=poisson[k-1]*c/k;
 // All impossible finite degrees k>=n form ONE explicit Poisson overflow bin.
 // Sum its positive series instead of subtracting a nearly-unit CDF.
 let term=poisson[n-1]*c/n,tail=0,tailBound=0,k=n;
 while(term>0){tail+=term;const next=term*c/(k+1),ratio=c/(k+2);tailBound=next/(1-ratio);if(tailBound<=tail*Number.EPSILON/2||next===0)break;term=next;k++;if(k>2000)throw new Error('Poisson tail did not converge');}
 poisson[n]=tail;return{n,p,c,variance:c*(1-p),expectedEdges:n*c/2,binomial:[...binomial,0],poisson,tailBound,conditionalClosure:n>=3&&p>0?p:null};
}
export function erCircle(n){integerN(n,120);return n===1?[[0,0]]:Array.from({length:n},(_,j)=>{const a=2*Math.PI*j/n;return[.94*Math.cos(a),.94*Math.sin(a)];});}
/** Exactly the declared finite-decimal hundredth grid; no tolerance creates a
 * critical c=1 state. Browser events and generic saved-state replay call this. */
export function erCenti(c){
 if(!finite(c)||c<0||c>3)throw new RangeError('c must lie on the declared0.01 grid in[0,3]');const [mantissa,exponent='0']=String(c).toLowerCase().split('e'),parts=mantissa.split('.'),digits=BigInt(parts.join('')),power=Number(exponent)-(parts[1]?.length??0);let a=digits,b=1n;if(power>=0)a*=10n**BigInt(power);else b=10n**BigInt(-power);if(a*100n%b!==0n)throw new RangeError('c must lie on the declared0.01 grid in[0,3]');return Number(a*100n/b);
}
function expMeanMinusOne(x){if(x===0)return 0;if(x<.1){let term=-x/2,sum=term;for(let k=1;k<20;k++){term*=-x/(k+2);sum+=term;}return sum;}return-Math.expm1(-x)/x-1;}
/** Positive root: divide S=1-exp(-cS) by S and stably subtract1.
 * Bisection avoids selecting the always-present zero root or slow iteration. */
export function erGiant(c){if(!finite(c)||c<0||c>3)throw new RangeError('c in[0,3] required');if(c<=1)return 0;let lo=0,hi=1;for(let k=0;k<110;k++){const s=(lo+hi)/2;if(s===lo||s===hi)break;const h=(c-1)+c*expMeanMinusOne(c*s);if(h>0)lo=s;else hi=s;}return(lo+hi)/2;}
export function erEdgeOrder(n,M,seed){
 integerN(n);if(!Number.isInteger(M)||M<0||M>Math.min(n*(n-1)/2,Math.floor(1.5*n)))throw new RangeError('Offered sparse edge prefix required');const R=erRng(seed),seen=new Set(),edges=[];
 // With ideal iid uniforms, rejection makes each remaining unordered edge
 // equally likely. The UI uses the stated finite PRNG, not empirical data.
 while(edges.length<M){let a=Math.floor(R()*n),b=Math.floor(R()*n);if(a===b)continue;if(a>b)[a,b]=[b,a];const key=a*n+b;if(seen.has(key))continue;seen.add(key);edges.push([a,b]);}return edges;
}
export function erGrowth(n,edges){
 integerN(n);if(!Array.isArray(edges)||edges.length>Math.min(n*(n-1)/2,Math.floor(1.5*n)))throw new RangeError('Offered sparse edge prefix required');const parent=Int32Array.from({length:n},(_,i)=>i),size=new Int32Array(n).fill(1),counts=new Map([[1,n]]),seen=new Set(),big=[1],second=[n>1?1:0],number=[n];
 const find=x=>{while(parent[x]!==x){parent[x]=parent[parent[x]];x=parent[x];}return x;},remove=s=>{const c=counts.get(s)-1;if(c)counts.set(s,c);else counts.delete(s);};let largest=1,components=n;
 for(const e of edges){if(!Array.isArray(e)||e.length!==2||!e.every(Number.isInteger))throw new RangeError('Integer endpoint pairs required');const[a,b]=e;if(a<0||a>=b||b>=n||seen.has(a*n+b))throw new RangeError('Distinct simple edge prefix required');seen.add(a*n+b);let ra=find(a),rb=find(b);if(ra!==rb){if(size[ra]<size[rb])[ra,rb]=[rb,ra];remove(size[ra]);remove(size[rb]);parent[rb]=ra;size[ra]+=size[rb];counts.set(size[ra],(counts.get(size[ra])??0)+1);largest=Math.max(largest,size[ra]);components--;}
  let runnerUp=0;for(const[s,count]of counts)if(s<largest||count>1)runnerUp=Math.max(runnerUp,s);big.push(largest);second.push(runnerUp);number.push(components);
 }
 const points=[[0,1/n]];for(let m=1;m<big.length;m++)if(big[m]!==big[m-1])points.push([2*m/n,big[m-1]/n],[2*m/n,big[m]/n]);points.push([2*edges.length/n,big.at(-1)/n]);return{n,edges:edges.map(e=>e.slice()),big,second,number,points};
}
export function erGrowthAt(run,c){const tick=erCenti(c),m=Math.floor(tick*run.n/200);if(m>=run.big.length)throw new RangeError('Requested prefix is not in the stored run');return{n:run.n,m,realizedMean:2*m/run.n,largest:run.big[m],second:run.second[m],components:run.number[m],fraction:run.big[m]/run.n};}
