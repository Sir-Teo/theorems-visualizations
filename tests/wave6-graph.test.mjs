import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadAll} from '../scripts/lib.mjs';
import * as H from '../content/graph/ch07.shared.js';
const near=(a,b,e=2e-12)=>assert.ok(Math.abs(a-b)<=e*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const refMinorMemo=new Map();
function refMinor(A){const n=A.length,key=n+':'+A.flat().join('');if(refMinorMemo.has(key))return refMinorMemo.get(key);if(A.every((row,i)=>row.every((v,j)=>v===+(i!==j))))return n;let best=0;for(let v=0;v<n;v++)best=Math.max(best,refMinor(A.filter((_,i)=>i!==v).map(row=>row.filter((_,j)=>j!==v))));for(let u=0;u<n;u++)for(let v=u+1;v<n;v++)if(A[u][v]){const sets=Array.from({length:n},(_,i)=>i===u?[u,v]:[i]).filter((_,i)=>i!==v),B=sets.map((s,i)=>sets.map((t,j)=>i===j?0:+s.some(a=>t.some(b=>A[a][b]))));best=Math.max(best,refMinor(B));}refMinorMemo.set(key,best);return best;}
function refColor(A){const n=A.length;for(let k=1;k<=n;k++)for(let code=0;code<k**n;code++){let q=code;const c=Array.from({length:n},()=>{const t=q%k;q=Math.floor(q/k);return t;});if(A.every((r,i)=>r.every((e,j)=>!e||c[i]!==c[j])))return k;}return 0;}
function refGirth(A){let best=Infinity;for(let a=0;a<A.length;a++)for(let b=a+1;b<A.length;b++)if(A[a][b]){const dist=Array(A.length).fill(-1),queue=[a];dist[a]=0;for(let k=0;k<queue.length;k++){const u=queue[k];for(let v=0;v<A.length;v++)if(A[u][v]&&!((u===a&&v===b)||(u===b&&v===a))&&dist[v]<0){dist[v]=dist[u]+1;queue.push(v);}}if(dist[b]>=0)best=Math.min(best,dist[b]+1);}return best;}
function verifyMinor(A,sets){const seen=new Set();for(const set of sets){assert.ok(set.length);const reached=new Set([set[0]]);for(let k=0;k<set.length;k++)for(const v of set)if([...reached].some(u=>A[u][v]))reached.add(v);assert.equal(reached.size,set.length);for(const v of set){assert.ok(!seen.has(v));seen.add(v);}}for(let i=0;i<sets.length;i++)for(let j=0;j<i;j++)assert.ok(sets[i].some(u=>sets[j].some(v=>A[u][v])));}
function independentPair(B,epsilon){const a=B.length,b=B[0].length,E=B.flat().reduce((s,x)=>s+x,0);let regular=true,uniform=0;for(let x=1;x<2**a;x++)for(let y=1;y<2**b;y++){const X=Array.from({length:a},(_,i)=>i).filter(i=>(x>>i)&1),Y=Array.from({length:b},(_,j)=>j).filter(j=>(y>>j)&1);let e=0;for(const i of X)for(const j of Y)e+=B[i][j];const numerator=Math.abs(e*a*b-E*X.length*Y.length);uniform=Math.max(uniform,numerator/(a*b)**2);if(X.length>=epsilon*a&&Y.length>=epsilon*b&&numerator>epsilon*a*b*X.length*Y.length)regular=false;}return{regular,uniform};}
function independentHom(Hp,A,parts,phi){let total=0,inj=0;const choices=phi.map(i=>parts[i]),N=choices.reduce((p,x)=>p*x.length,1);for(let code=0;code<N;code++){let rest=code;const map=choices.map(c=>{const v=c[rest%c.length];rest=Math.floor(rest/c.length);return v;});let valid=true;for(let i=0;i<Hp.length;i++)for(let j=0;j<i;j++)if(Hp[i][j]&&!A[map[i]][map[j]])valid=false;if(valid){total++;inj+=new Set(map).size===map.length;}}return{total,inj};}

test('balanced Turan counts agree with direct graph edges and exact remainder formula, including empty classes',()=>{
 for(let n=1;n<=30;n++)for(let k=1;k<=8;k++){const t=H.turan(n,k),b=n%k;assert.equal(H.edges(t.A).length,t.m);assert.equal(t.m,(n*n-(n*n/k+b*(1-b/k)))/2);assert.ok(Math.max(...t.sizes)-Math.min(...t.sizes)<=1);assert.equal(H.sum(t.sizes),n);if(k>=n)assert.equal(t.m,H.choose2(n));}
});
test('small extremal enumeration matches Turan and distinguishes greedy maximal from maximum',()=>{
 for(let n=2;n<=6;n++)for(const r of[3,4]){const e=H.extremalSmall(n,H.complete(r));assert.equal(e.m,H.turan(n,r-1).m);assert.equal(H.cliques(e.A,r).length,0);}let gap=false;for(let seed=1;seed<=40;seed++){const g=H.greedyFree(6,3,seed);if(H.edges(g.A).length<9)gap=true;for(const[u,v]of H.pairs(6))if(!g.A[u][v]){const A=H.graph(6,[...H.edges(g.A),[u,v]]);assert.ok(H.cliques(A,3).length);}}assert.ok(gap);
 assert.equal(H.extremalSmall(5,H.graph(4,[[0,1],[1,2],[2,3],[3,0]])).m,6);
});
test('injections preserve every required edge without incorrectly requiring an induced copy',()=>{
 const path=H.graph(4,[[0,1],[1,2],[2,3]]),map=H.findEmbedding(path,H.complete(4));assert.ok(map);assert.equal(new Set(map).size,4);assert.equal(H.findEmbedding(H.complete(4),H.preset('cycle 5')),null);
 for(const r of[2,3])for(const s of[1,2]){const pattern=H.multipartite(Array(r).fill(s)).A,A=H.complete(8),f=H.findEmbedding(pattern,A);assert.equal(new Set(f).size,pattern.length);for(const[i,j]of H.edges(pattern))assert.ok(A[f[i]][f[j]]);}
});
test('complete minor search agrees with independent deletion/contraction recursion on every graph through order five',()=>{
 for(let n=0;n<=5;n++)for(let mask=0;mask<2**H.choose2(n);mask++){const A=H.fromMask(n,mask),m=H.completeMinor(A);assert.equal(m.h,refMinor(A),`${n}/${mask}`);verifyMinor(A,m.sets);}
 assert.equal(H.completeMinor(H.wagner()).h,4);assert.equal(H.completeMinor(H.multipartite([3,3]).A).h,4);
});
test('minimum coloring agrees with exhaustive assignments and every returned color is proper',()=>{
 for(let n=1;n<=5;n++)for(let mask=0;mask<2**H.choose2(n);mask++){const A=H.fromMask(n,mask),c=H.coloring(A);assert.equal(c.chi,refColor(A));for(const[i,j]of H.edges(A))assert.notEqual(c.colors[i],c.colors[j]);}
});
test('density contractions have actual connected branch sets and preserve the selected edge ratio when applicable',()=>{
 for(const n of[4,8,12])for(const r of[3,4,5]){const A=H.complete(n),g=H.denseContractions(A,r);for(let t=0;t<g.trace.length;t++){const row=g.trace[t];verifyMinor(A,row.sets);assert.equal(row.A.length,row.sets.length);if(t)assert.ok(H.edges(row.A).length>=g.threshold*row.A.length);assert.deepEqual(row.sets.flat().toSorted((a,b)=>a-b),H.range(n));}}
});
test('subdivision routes have private interiors, correct degrees and independently measured girth',()=>{
 for(const r of[3,4,5])for(const length of[1,2,3,5]){const g=H.subdivision(r,length),seen=new Set();assert.equal(g.routes.length,H.choose2(r));for(const path of g.routes){assert.equal(path.length,length+1);for(const v of path.slice(1,-1)){assert.ok(v>=r&&!seen.has(v));seen.add(v);}for(let j=1;j<path.length;j++)assert.ok(g.A[path[j-1]][path[j]]);}assert.equal(H.girth(g.A),3*length);assert.equal(refGirth(g.A),3*length);H.degrees(g.A).forEach((d,i)=>assert.equal(d,i<r?r-1:2));}
});
test('Voronoi contraction partitions into connected trees, covers every vertex and measures failed girth hypotheses',()=>{
 for(const name of['Petersen','K3,3','cycle 5'])for(const k of[0,1,2]){const A=H.preset(name),g=H.ballContraction(A,k);assert.equal(g.girth,refGirth(A));assert.deepEqual(g.sets.flat().toSorted((a,b)=>a-b),H.range(A.length));for(const set of g.sets)assert.ok(H.connectedMask(A,H.sum(set.map(i=>2**i))));assert.ok(Math.max(...g.level)<=2*k);for(const[u,v]of H.edges(g.A))assert.ok(g.sets[u].some(a=>g.sets[v].some(b=>A[a][b])));if(k===0)assert.deepEqual(g.A,A);if(g.delta>=3&&g.girth>=8*k+3)assert.ok(g.minorDelta>=g.delta*(g.delta-1)**k);}
 for(let r=2;r<=50;r++)assert.ok(3*2**Math.max(0,r-3)>=2**(r-2));
});
test('two-trees have 2n−3 edges, proper three-color construction, no K4 minor and every extra edge creates one',()=>{
 for(let n=3;n<=8;n++)for(const fan of[false,true]){const g=H.twoTree(n,fan);assert.equal(H.edges(g.A).length,2*n-3);assert.equal(H.completeMinor(g.A).h,3);for(const[i,j]of H.edges(g.A))assert.notEqual(g.colors[i],g.colors[j]);for(const[i,j]of H.pairs(n))if(!g.A[i][j])assert.ok(H.completeMinor(H.graph(n,[...H.edges(g.A),[i,j]])).h>=4);}
});
test('clique sums subtract only shared vertices/edges and obey K5 edge and coloring bounds',()=>{
 for(const B of[H.complete(4),H.wagner()])for(const k of(B.length===8?[2]:[2,3])){let A=H.complete(4);for(let t=1;t<=4;t++){const beforeN=A.length,beforeE=H.edges(A).length,m=H.cliqueSum(A,B,k);assert.equal(m.A.length,beforeN+B.length-k);assert.equal(H.edges(m.A).length,beforeE+H.edges(B).length-H.choose2(k));assert.ok(H.edges(m.A).length<=3*m.A.length-6);const c=H.coloring(m.A);assert.ok(c.chi<=4);for(const[u,v]of H.edges(m.A))assert.notEqual(c.colors[u],c.colors[v]);A=m.A;}}
});
test('critical extraction preserves exact chromatic number and ends with the degree lower bound',()=>{
 for(const name of['cycle 5','two-tree','Wagner','K3,3']){const A=H.preset(name),g=H.critical(A);for(const r of g.trace){assert.equal(H.coloring(r.A).chi,g.target);assert.ok(H.girth(r.A)>=H.girth(A));assert.deepEqual(r.A,H.induced(A,r.labels));}const last=g.trace.at(-1).A;assert.ok(Math.min(...H.degrees(last))>=g.target-1);for(let i=0;i<last.length;i++)assert.ok(H.coloring(H.induced(last,H.range(last.length).filter(j=>j!==i))).chi<g.target);}
});
test('regularity and uniformity agree with independent integer cross-products on all 2×3 matrices',()=>{
 for(let mask=0;mask<64;mask++){const B=H.range(2).map(i=>H.range(3).map(j=>+(!!(mask&2**(3*i+j)))));for(const eps of[.1,.25,.5,1]){const a=H.pairAudit(B,eps),b=independentPair(B,eps);assert.equal(a.regular,b.regular,`${mask}/${eps}`);near(a.uniform,b.uniform);}}
 const B=H.pairModel('checkerboard');assert.equal(H.pairAudit(B,.5).regular,true);assert.equal(H.pairAudit(B,.5-Number.EPSILON).regular,false);assert.equal(H.pairAudit(B,1).eligible,1);
});
test('rational threshold decisions distinguish exact fractions from rounded binary controls',()=>{
 assert.equal(H.fractionCompare(1,10,.1),-1);assert.equal(H.fractionCompare(1,3,1/3),1);assert.equal(H.fractionCompare(3,10,.3),1);assert.equal(H.fractionCompare(1,2,.5),0);assert.equal(H.fractionCompare(0,1,Number.MIN_VALUE),-1);assert.equal(H.fractionCompare(0,1,0),0);assert.equal(H.fractionCompare(6,36,1/6),1);assert.equal(H.fractionCompare(6,36,1/6+Number.EPSILON),-1);
 const B=H.pairModel('checkerboard');assert.equal(H.pairAudit(B,.5-Number.EPSILON).regular,false);assert.equal(H.pairAudit(B,.5).regular,true);assert.equal(H.pairAudit(B,.5+Number.EPSILON).regular,true);assert.equal(H.pairAudit(B,.5).eligible,121);assert.equal(H.pairAudit(B,.5+Number.EPSILON).eligible,25);
 assert.equal(H.typicalCounts(B,.5,[0,1]).eligible,true);assert.equal(H.typicalCounts(B,.5+Number.EPSILON,[0,1]).eligible,false);assert.equal(H.typicalCounts(B,.5,[0,1]).bad,0);
});
test('every certified irregular witness yields the weighted epsilon-fourth gain',()=>{
 for(const mode of['checkerboard','matching','complete','seeded sample'])for(const seed of[1,17,30])for(const eps of[.05,.25,.499,.5,1]){const g=H.pairSplit(H.pairModel(mode,4,seed),eps);assert.ok(g.gain>=-1e-14);if(!g.regular){assert.ok(g.X.length>=4*eps&&g.Y.length>=4*eps);assert.ok(g.gain>=g.lower-1e-14);}assert.equal(new Set(g.parts.flat()).size,8);assert.ok(g.parts.every(p=>p.length));}
});
test('partition index equals an independent sum over pair edge counts and increases under nested refinement',()=>{
 function index(A,parts){let total=0;for(let a=0;a<parts.length;a++)for(let b=a+1;b<parts.length;b++){let E=0;for(const i of parts[a])for(const j of parts[b])E+=A[i][j];total+=E*E/(A.length*A.length*parts[a].length*parts[b].length);}return total;}
 for(const seed of[1,17,30]){const A=H.planted(seed),parts=[H.range(6),H.range(6).map(i=>i+6)],atoms=H.refineWitnesses(A,parts,.15);near(H.energy(A,parts),index(A,parts));near(atoms.after,index(A,atoms.parts));assert.ok(atoms.after>=atoms.q-1e-14);near(H.energy(A,[],H.range(12)),H.edges(A).length/144);const a=H.partitionAudit(A,H.range(12).map(i=>[i]),.15);assert.equal(a.regular,true);if(!atoms.regular)assert.ok(atoms.gain>=.15**5/2-1e-14);}
});
test('typical-neighbor strict bound holds whenever both raw hypotheses hold, including threshold equalities',()=>{
 for(const mode of['checkerboard','matching','complete','seeded sample'])for(const eps of[.05,.25,.5,.75,1]){const B=H.pairModel(mode),a=H.pairAudit(B,eps);for(let mask=0;mask<16;mask++){const Y=H.vertices(mask,4),bad=B.map(row=>H.sum(Y.map(j=>row[j]))).filter(d=>d<(a.d-eps)*Y.length).length;if(a.regular&&Y.length>=eps*4)assert.ok(bad<eps*4);}}
});
test('reduced graph tests both pair predicates and complete-host greedy embeddings respect every edge and occupancy',()=>{
 const A=H.planted(17),parts=H.range(4).map(k=>H.range(3).map(j=>3*k+j));for(const eps of[.05,.5,1])for(const d of[0,.5,1]){const g=H.reduced(A,parts,eps,d);for(const p of g.audit)assert.equal(g.A[p.i][p.j],+(p.regular&&p.d>=d));}
 const P=H.graph(4,[[0,1],[1,2],[2,3]]);for(const n of[3,4,5]){const g=H.uniformGraph(n,17,true),emb=H.greedyEmbedding(P,g.A,g.parts,[0,1,0,1]);assert.equal(emb.success,true);assert.equal(new Set(emb.map).size,4);for(const[i,j]of H.edges(P))assert.ok(g.A[emb.map[i]][emb.map[j]]);}
});
test('counting lemma agrees with an independent Cartesian enumeration, with collapsed images retained',()=>{
 const patterns=[{P:H.complete(3),phi:[0,1,2]},{P:H.graph(4,[[0,1],[1,2],[2,3]]),phi:[0,1,0,1]},{P:H.graph(4,[[0,1],[0,2],[0,3]]),phi:[0,1,1,1]}];let collapse=false;for(const n of[2,3,4])for(const seed of[1,17,30])for(const {P,phi}of patterns){const g=H.uniformGraph(n,seed),a=H.homCount(P,g.A,g.parts,phi),b=independentHom(P,g.A,g.parts,phi);assert.equal(a.count,b.total);assert.equal(a.injective,b.inj);assert.ok(Math.abs(a.count-a.expected)<=a.error+1e-12);if(a.count>a.injective)collapse=true;if(P.length===3)assert.equal(a.count,H.triangles(g.A).length);}assert.ok(collapse);
 const g=H.uniformGraph(3,17);const e=H.homCount(H.graph(2,[]),g.A,g.parts,[0,0]);assert.equal(e.count,9);assert.equal(e.injective,6);assert.equal(e.expected,9);assert.equal(e.error,0);
});
test('minimum triangle edge cover agrees with independent all-edge-subset enumeration through order five',()=>{
 for(let mask=0;mask<1024;mask+=7){const A=H.fromMask(5,mask),es=H.edges(A),g=H.triangleCover(A);let best=es.length;for(let removed=0;removed<2**es.length;removed++){const count=H.pop(removed);if(count>=best)continue;const B=H.graph(5,es.filter((_,i)=>!(removed&2**i)));if(!H.triangles(B).length)best=count;}assert.equal(g.deleted.length,best);assert.equal(H.triangles(g.A).length,0);assert.equal(g.labelled,6*H.triangles(A).length);}
 assert.equal(H.triangleCover(H.complete(6)).deleted.length,6);
});
test('exact AP maxima agree with all subsets on small windows and allow nonmonotone density',()=>{
 for(let n=1;n<=12;n++)for(const k of[3,4,5]){let best=0;const progressions=H.arithmeticProgressions(n,k).map(p=>H.sum(p.map(i=>2**i)));for(let m=0;m<2**n;m++)if(!progressions.some(p=>(p&m)===p))best=Math.max(best,H.pop(m));const g=H.progressionFree(n,k);assert.equal(g.size,best);for(const p of H.arithmeticProgressions(n,k))assert.ok(!p.every(i=>g.set.includes(i)));}
 assert.ok(H.progressionFree(4,3).size/4>H.progressionFree(3,3).size/3);
});
test('Roth construction counts all vertices/edges and gives one triangle per edge exactly for AP-free input',()=>{
 for(let n=3;n<=8;n++)for(const D of[H.progressionFree(n,3).set,H.range(n),[0]]){const g=H.roth(n,D);assert.equal(g.A.length,6*n);assert.equal(g.edges.length,3*n*D.length);assert.equal(g.defining.length,n*D.length);assert.equal(new Set(g.defining.map(t=>t.join(','))).size,g.defining.length);if(!g.progressions.length){assert.equal(g.triangles.length,n*D.length);assert.ok(g.counts.every(c=>c===1));}else{assert.ok(g.triangles.length>g.defining.length);assert.ok(g.max>1);}}
});
test('GRAPH7 preserves all 38 frozen identities and flags and uses written prerequisites',async()=>{
 const plan=JSON.parse(await readFile(new URL('../docs/wave-6-plan.json',import.meta.url),'utf8')),{items}=await loadAll(),chapter=items.filter(x=>x.col==='graph'&&x.chapter===7),all=new Set(items.map(x=>x.id)),S=(await import('../content/graph/syllabus.js')).default.chapters.find(x=>x.n===7),frozen=plan.chapters.find(x=>(x.col||x.collection)==='graph');assert.equal(chapter.length,38);assert.equal(new Set(chapter.map(x=>x.viz)).size,38);
 for(const it of chapter){const s=S.items.find(x=>x.num===it.num),p=(frozen.items||frozen.newItems).find(x=>x.num===it.num||x.id===it.id);assert.equal(it.name,p.name);assert.equal(it.kind,p.kind);assert.equal(!!it.verify,!!p.verify);assert.equal(it.name,s.name);assert.deepEqual(it.deps,s.deps);assert.deepEqual(it.refs,s.refs);assert.equal(it.caption,s.pic);for(const d of it.deps)assert.ok(all.has(d),d);assert.equal(typeof it.viz,'function');}
});
