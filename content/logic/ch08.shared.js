// Exact finite models for LOGIC 8. BigInt codes name pure hereditarily finite sets;
// ordinal labels and arbitrary membership graphs are separate representations.
export const SOURCE = Object.freeze({olp:'https://builds.openlogicproject.org/courses/set-theory/settheory-screen.pdf',tarau:'https://arxiv.org/pdf/0808.0754',zermelo:'https://gdz.sub.uni-goettingen.de/id/PPN235181684_0065?tify=%7B%22pages%22%3A%5B271%5D%7D'});
function natural(n){n=BigInt(n);if(n<0n)throw new RangeError('nonnegative integer required');return n;}
export function members(n){n=natural(n);const a=[];for(let k=0n;n;n>>=1n,k++)if(n&1n)a.push(k);return a;}
export function setOf(xs){let n=0n;for(let x of xs){x=natural(x);if(x>262143n)throw new RangeError('display model bit budget exceeded');n|=1n<<x;}return n;}
export function member(a,b){a=natural(a);b=natural(b);return a<BigInt(b.toString(2).length)&&!!(b&(1n<<a));}
export const subset=(a,b)=>(natural(a)&natural(b))===natural(a);
export const union=a=>members(a).reduce((s,x)=>s|x,0n);
export const pair=(a,b)=>setOf([a,b]);
export function power(a){const xs=members(a);if(xs.length>12)throw new RangeError('display subset budget exceeded');let ys=[0n];for(const x of xs)ys=ys.concat(ys.map(y=>y|(1n<<x)));return setOf(ys);}
export const ordered=(a,b)=>pair(setOf([a]),pair(a,b));
export const transitive=a=>subset(union(a),a);
export function closureSteps(a){a=natural(a);const steps=[a];while(true){const b=a|union(a);if(b===a)return steps;a=b;steps.push(a);}}
export function descendants(a){return members(closureSteps(setOf([a])).at(-1));}
export function rank(a){const xs=members(a);return xs.length?1+Math.max(...xs.map(rank)):0;}
export function literal(a,limit=130){const print=x=>'{'+members(x).map(print).join(',')+'}';const s=print(a);return s.length<=limit?s:s.slice(0,limit-1)+'…';}
export function ordinalCode(n){if(!Number.isInteger(n)||n<0||n>5)throw new RangeError('ordinal code display bound is 5');let a=0n;for(let k=0;k<n;k++)a|=1n<<a;return a;}
export function ordinalIndex(code){code=natural(code);const xs=members(code);for(let j=0;j<xs.length;j++){if(j>5||xs[j]!==ordinalCode(j))return null;}return xs.length;}
export function separate(a,rule,p=0n){return setOf(members(a).filter(x=>rule==='contains empty'?member(0n,x):rule==='subset of parameter'?subset(x,p):rule==='transitive'?transitive(x):(()=>{throw new Error('unknown predicate');})()));}
export function replace(a,rule){const rows=members(a).map(x=>({x,ys:rule==='singleton'?[setOf([x])]:rule==='union'?[union(x)]:rule==='x or singleton'?[x,setOf([x])]:(()=>{throw new Error('unknown map');})()}));const valid=rows.every(r=>new Set(r.ys).size===1);return{rows,valid,result:valid?setOf(rows.map(r=>r.ys[0])):null};}
export const russellRows=()=>[0,1].flatMap(inA=>[0,1].map(inSelf=>({inA:!!inA,inSelf:!!inSelf,consistent:!!inSelf===(!!inA&&!inSelf)})));
export function relation(mode){const edges=mode==='function'?[[0,1],[1,1],[2,0]]:mode==='missing input'?[[0,1],[2,0]]:[[0,1],[1,1],[1,2],[2,0]];return{edges,total:[0,1,2].every(x=>edges.some(e=>e[0]===x)),single:[0,1,2].every(x=>new Set(edges.filter(e=>e[0]===x).map(e=>e[1])).size<=1)};}
export function membershipEdges(mask,n=4){if(!Number.isInteger(mask)||mask<0||mask>=2**(n*n))throw new RangeError('invalid relation mask');return Array.from({length:n*n},(_,k)=>k).filter(k=>mask&(2**k)).map(k=>[Math.floor(k/n),k%n]);}
export function graphFoundation(mask,n=4){const edges=membershipEdges(mask,n),subsets=[];for(let s=1;s<2**n;s++){const vertices=Array.from({length:n},(_,i)=>i).filter(i=>s&(1<<i)),minimal=vertices.filter(x=>!edges.some(([y,z])=>z===x&&(s&(1<<y))));subsets.push({mask:s,vertices,minimal});}const incoming=Array.from({length:n},(_,x)=>edges.filter(e=>e[1]===x).reduce((m,[y])=>m|(1<<y),0)),collisions=[];for(let i=0;i<n;i++)for(let j=0;j<i;j++)if(incoming[i]===incoming[j])collisions.push([j,i]);return{edges,subsets,wellFounded:subsets.every(s=>s.minimal.length),witness:subsets.find(s=>!s.minimal.length)??null,collisions};}
export const ordinalMembers=n=>Array.from({length:n},(_,i)=>i);
export const integerEquivalent=(a,b,c,d)=>BigInt(a)+BigInt(d)===BigInt(c)+BigInt(b);
export const rationalEquivalent=(a,b,c,d)=>{if(BigInt(b)===0n||BigInt(d)===0n)throw new RangeError('nonzero denominators required');return BigInt(a)*BigInt(d)===BigInt(c)*BigInt(b);};
export function cutMember(p,q,kind='sqrt2',a=0,b=1){p=BigInt(p);q=BigInt(q);if(q<=0n)throw new RangeError('positive denominator required');return kind==='sqrt2'?(p<0n||p*p<2n*q*q):p*BigInt(b)<BigInt(a)*q;}
export function cutLarger(p,q){p=BigInt(p);q=BigInt(q);if(!cutMember(p,q))throw new RangeError('input outside sqrt2 cut');return p<0n?[0n,1n]:[2n*p+2n*q,p+2n*q];}
export const classFacts=Object.freeze([
 {name:'all sets',proper:true,proof:'A set V of every set would contain its separated Russell subset R; then R∈R iff R∉R.',test:()=>true},
 {name:'all ordinals',proper:true,proof:'A transitive set of all ordinals would itself be an ordinal, hence a member of itself. Strict well-ordering excludes that.',test:x=>ordinalIndex(x)!==null},
 {name:'all singletons',proper:true,proof:'If all singletons formed a set C, its union would contain every set, contradicting the Russell argument.',test:x=>members(x).length===1},
 {name:'subsets of ω',proper:false,proof:'Power Set applied to the already constructed set ω gives P(ω). Its members include infinite subsets absent from this finite sample.',test:x=>members(x).every(y=>ordinalIndex(y)!==null)},
 {name:'hereditarily finite sets',proper:false,proof:'Form V₀=∅, Vₙ₊₁=P(Vₙ), collect the finite stages by Replacement, and take their union. This is the infinite set Vω.',test:()=>true}
]);
export const historicalAxioms=Object.freeze(['I · extensionality','II · elementary sets','III · separation','IV · power set','V · union','VI · choice','VII · infinity']);
export const recipeRequirements=Object.freeze({pair:[0,1],union:[0,4],power:[0,3],separation:[0,2],'finite choice':[5],'singleton chain':[6],'unrestricted comprehension':[]});
export function historicalRecipe(operation,a,b,enabled){if(!recipeRequirements[operation])throw new Error('unknown recipe');const missing=recipeRequirements[operation].filter(i=>!enabled[i]);return{licensed:missing.length===0,missing,result:operation==='pair'?pair(a,b):operation==='union'?union(a):operation==='power'?power(a):operation==='separation'?separate(a,'contains empty'):null,contradiction:operation==='unrestricted comprehension'};}
