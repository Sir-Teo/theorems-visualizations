// Helpers used only by the scoped logic source-review corrections.
import {godelSat as originalSat,herbrandStage as originalHerbrand,nnfFO,toStr,freeVars} from './ch04.shared.js';
import {THEORIES as originalTheories} from './ch05.shared.js';
export const godelSat=(inst,fixed=[])=>originalSat(inst.map(b=>({...b,g:nnfFO(b.g)})),fixed);
export function herbrandStage(sk,level,options){const h=originalHerbrand(sk,level,options);return{...h,capped:h.capped||h.aborted||h.terms.length>400};}
export function groundWitness(inst,atoms){const fixed=[],val=new Map();for(const a of atoms){const r=godelSat(inst,[...fixed,[a,true]]);if(r.sat===null)return{aborted:true,val:null};const b=r.sat===true;fixed.push([a,b]);val.set(a,b);}return{aborted:false,val};}
/** Exact finite interpretation, returning null if the explicit recursive-work budget is exhausted. */
export function boundedHolds(phi,M,{budget=250000,env={}}={}){let work=0;const exhausted=Symbol('budget');const tick=()=>{if(++work>budget)throw exhausted;};
 const term=(t,e)=>{tick();if(t.t==='var')return e[t.name];if(t.t==='const')return M.konst(t.name);return M.fn(t.f,t.args.map(a=>term(a,e)));};
 const go=(f,e)=>{tick();switch(f.op){case'const':return f.val;case'rel':{const a=f.args.map(t=>term(t,e));if(f.r==='=')return a[0]===a[1];if(f.r==='≠')return a[0]!==a[1];return Boolean(M.rel(f.r,a));}case'not':return!go(f.a,e);case'and':return go(f.a,e)&&go(f.b,e);case'or':return go(f.a,e)||go(f.b,e);case'imp':return!go(f.a,e)||go(f.b,e);case'iff':return go(f.a,e)===go(f.b,e);case'all':for(const x of M.dom)if(!go(f.a,{...e,[f.v]:x}))return false;return true;case'ex':for(const x of M.dom)if(go(f.a,{...e,[f.v]:x}))return true;return false;default:throw new Error(`Unsupported finite formula ${toStr(f)}`);}};
 try{return go(phi,env);}catch(e){if(e===exhausted)return null;throw e;}
}
export function finiteBatch(kind,requested,size,infinite){const total=kind==='4'?4:kind==='8'?8:Infinity,shown=Number.isFinite(total)?total:8,b=Math.min(requested,shown),capacity=infinite?Infinity:size;return{total,shown,b,capacity,failed:Math.max(0,b-capacity),batchSat:b<=capacity,everySat:total<=capacity,infiniteTarget:!Number.isFinite(total)};}
/** A finite stage of the extension-property construction: one independent new vertex for each old neighbor set. */
export function extensionLayer(A){const n=A.length;if(n>8)throw new Error('Finite extension-layer test supports at most eight old vertices.');const B=Array.from({length:n+2**n},()=>Array(n+2**n).fill(false));for(let i=0;i<n;i++)for(let j=0;j<n;j++)B[i][j]=Boolean(A[i][j]);for(let mask=0;mask<2**n;mask++)for(let i=0;i<n;i++)if(mask>>i&1)B[n+mask][i]=B[i][n+mask]=true;return B;}
export const THEORIES=originalTheories.map(T=>({...T,n0:null,nu:null,verify:false,
 ...(T.id==='dlo'?{witu:'For any uncountable κ, let D be κ copies of ℚ followed by ℵ₁ copies of ℚ, all in lexicographic order. Both D and D+ℚ have size κ and are dense without endpoints; their cofinalities are ℵ₁ and ℵ₀, so they are not isomorphic'}:{}),
 ...(T.id==='eq'?{witu:'κ classes each countably infinite versus countably many classes each of size κ: both have size κ, and the number of equivalence classes differs'}:{}),
 ...(T.id==='succ'?{name:'Th(ℕ, 0, S): zero and successor',tex:String.raw`\mathrm{Th}(\mathbb N,0,S)`}:{}),
 ...(T.id==='rcf'?{witu:'At every uncountable κ, elementary chains of real closed ordered fields of size κ give two models: an ω-chain whose new stages contain an element above every earlier element, and an ω₁-chain with the same property. Their unions have cardinality κ and cofinalities ℵ₀ and ℵ₁, so they are not isomorphic'}:{}),
 ...(T.id==='rado'?{whyu:'',witu:'Start once with an independent set of size κ and once with a clique of size κ. In ω rounds, adjoin witnesses for all finite adjacency/nonadjacency patterns. Both resulting size-κ graphs satisfy the extension axioms. The first is a union of countably many independent layers, while the second retains an uncountable clique, so they are not isomorphic',why0:'Cameron’s extension-property back-and-forth proof gives a unique countable graph'}:{}),
}));

/** Give each quantifier its own variable before stripping a prenex prefix. */
export function freshenBound(phi){let i=0;const used=new Set(freeVars(phi));const go=(n,ren)=>{if(n.t==='var')return{...n,name:ren.get(n.name)??n.name};if(n.t==='const'||n.op==='const')return n;if(n.t==='fn'||n.op==='rel')return{...n,args:n.args.map(a=>go(a,ren))};if(n.op==='all'||n.op==='ex'){let v;do{v=`v${++i}`;}while(used.has(v));used.add(v);const r=new Map(ren);r.set(n.v,v);return{...n,v,a:go(n.a,r)};}if(n.op==='not')return{...n,a:go(n.a,ren)};return{...n,a:go(n.a,ren),b:go(n.b,ren)};};return go(phi,new Map());}
