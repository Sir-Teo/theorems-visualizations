import assert from 'node:assert/strict';
import {test} from 'node:test';
import {welzlRun} from '../content/cg/ch04.shared.js';
import * as M from '../assets/js/viz/math.js';
import {coupledOracleAnswers} from '../content/crypto/ch03.shared.js';
import crypto from '../content/crypto/ch03-b.js';

function referenceDisc(P){
  if(!P.length)return null;
  const all=P.map(([x,y])=>({x,y,r:0}));
  for(let i=0;i<P.length;i++)for(let j=0;j<i;j++){
    const a=P[i],b=P[j],x=(a[0]+b[0])/2,y=(a[1]+b[1])/2;all.push({x,y,r:Math.hypot(x-a[0],y-a[1])});
    for(let k=0;k<j;k++){
      const c=P[k],A=2*(b[0]-a[0]),B=2*(b[1]-a[1]),C=2*(c[0]-a[0]),D=2*(c[1]-a[1]);
      const e=b[0]**2+b[1]**2-a[0]**2-a[1]**2,f=c[0]**2+c[1]**2-a[0]**2-a[1]**2,det=A*D-B*C;
      if(Math.abs(det)<1e-14)continue;const x=(e*D-B*f)/det,y=(A*f-e*C)/det;all.push({x,y,r:Math.hypot(x-a[0],y-a[1])});
    }
  }
  return all.filter(q=>P.every(p=>Math.hypot(p[0]-q.x,p[1]-q.y)<=q.r+1e-9)).sort((a,b)=>a.r-b.r)[0];
}
function* permutations(P){if(!P.length){yield [];return}for(let i=0;i<P.length;i++)for(const t of permutations(P.filter((_,j)=>i!==j)))yield[P[i],...t]}
test('Enclosing-disc algorithm defines empty and singleton inputs without a false uniqueness claim',()=>{
  assert.deepEqual(welzlRun([]),{frames:[],tests:0,rebuilds:0,D:null});assert.deepEqual(welzlRun([[3,-2]]).D,{x:3,y:-2,r:0});
});
test('Incremental enclosing discs match exhaustive geometric candidates for every order of degenerate and asymmetric examples',()=>{
  for(const P of [[[0,0],[1,0],[.5,.9],[.1,.2]],[[0,0],[0,0],[3,0],[-2,0]],[[2,1],[-1,2],[-3,-2],[1,-3],[.2,.1]]]){
    const want=referenceDisc(P);
    for(const Q of permutations(P)){
      const got=welzlRun(Q).D;assert.ok(P.every(p=>Math.hypot(p[0]-got.x,p[1]-got.y)<=got.r+1e-9));assert.ok(Math.abs(got.r-want.r)<1e-9);
    }
  }
});
test('Enclosing-disc geometry remains consistent under changes of length unit',()=>{
  for(const scale of [1e-7,1,1e7]){
    const P=[[0,0],[1,0],[.5,Math.sqrt(3)/2]].map(p=>p.map(x=>x*scale)),D=welzlRun(P).D;
    assert.ok(Math.abs(D.r/scale-1/Math.sqrt(3))<1e-10);
    for(const p of P)assert.ok(Math.hypot(p[0]-D.x,p[1]-D.y)<=D.r+scale*1e-10);
  }
});
test('Switching-lemma transcript really couples the oracles until collision, with uniform permutation marginals',()=>{
  const r=M.rng(91823),counts=new Map(),N=4,T=96000;
  for(let t=0;t<T;t++){
    const {f,p}=coupledOracleAnswers(r,N,100);assert.equal(f.length,N);assert.equal(new Set(p).size,N);
    const seen=new Set();for(let i=0;i<N;i++){if(seen.has(f[i]))break;assert.equal(f[i],p[i]);seen.add(f[i]);}
    const key=p.join(',');counts.set(key,(counts.get(key)||0)+1);
  }
  assert.equal(counts.size,24);for(const n of counts.values())assert.ok(Math.abs(n-T/24)<250);
});
function replay(item,values={}){
  const stages=[];let render,read;
  const v={M,rng:M.rng,color:x=>x,fix:(x,n)=>x.toFixed(n),legend(){},button(){},slider:(l,a,b,x)=>({value:values[l]??x}),select:(l,o,x)=>({value:values[l]??x}),render:f=>render=f,readout:f=>read=f,
    stage(o){const calls=[],s=new Proxy({calls,ctx:new Proxy({},{get:()=>()=>{}}),width:600,height:o.height||400,invX:x=>x,invY:y=>y},{get(t,k){return k in t?t[k]:(...a)=>{calls.push([k,...a]);return s}}});stages.push(s);return s}};
  item.viz(v);render();return{stages,text:read()};
}
test('Goldwasser–Micali actual displayed encryptions lie in disjoint square/pseudosquare cosets',()=>{
  const {text}=replay(crypto.items.find(i=>i.num==='3.15'),{'Modulus $N=pq$':0});
  const m=text.match(/squares\): ([\d, ]+);.*pseudosquares\): ([\d, ]+)/);assert.ok(m);
  const squares=new Set(),units=[];for(let r=1;r<77;r++)if(r%7&&r%11){units.push(r);squares.add(r*r%77)}
  for(const c of m[1].split(',').map(Number))assert.ok(squares.has(c));
  for(const c of m[2].split(',').map(Number)){assert.ok(units.includes(c));assert.ok(!squares.has(c));assert.ok(!new Set(Array.from({length:7},(_,r)=>r*r%7)).has(c%7));}
  assert.match(text,/repetitions are possible/);
});

import {greedyIndep,matroidTest} from '../content/algo/ch10.shared.js';
import {fordFulkerson,isFeasible,minCutBrute,bipNet,coverBrute,simplex,detOf} from '../content/algo/ch11.shared.js';
import {quarter,chachaBlock,chachaInit,des,SBOXES,ddt,lat} from '../content/crypto/ch04.shared.js';
import {runPrefix,lupanov,randomTable} from '../content/cplx/ch04.shared.js';
import {planarFK,planarJ,svd2xn} from '../content/robot/ch04.shared.js';
import {bracket,CA,clNormalForm,clKey} from '../content/pl/ch03.shared.js';
import {reverseN,detRename} from '../content/toc/ch04.shared.js';
import {nfaAccepts} from '../content/toc/ch03.shared.js';

test('Actual greedy independent-set algorithm attains exhaustive optima for nonnegative weights on partition matroids',()=>{
  const pc=m=>m.toString(2).replace(/0/g,'').length,sys={n:5,indep:m=>pc(m&7)<=2&&pc(m&24)<=1};assert.ok(matroidTest(sys).exchange);
  for(let t=0;t<180;t++){
    const w=Array.from({length:5},(_,i)=>(t*(i+3)+i*i)%13),got=greedyIndep(sys,w);
    const best=Math.max(...Array.from({length:32},(_,m)=>sys.indep(m)?w.reduce((s,x,i)=>s+((m>>i)&1)*x,0):-Infinity));assert.equal(got.weight,best);
  }
});
test('Actual max-flow and residual-cut certificate agree with independent cuts on 80 cyclic directed networks',()=>{
  const rng=M.rng(723);for(let trial=0;trial<80;trial++){
    const ids=['s','a','b','c','t'],arcs=[];
    for(const u of ids)for(const v of ids)if(u!==v&&rng()<.34)arcs.push([u,v,1+Math.floor(rng()*6)]);
    const R=fordFulkerson(ids,arcs,'s','t','bfs');assert.ok(isFeasible(arcs,R.f,ids,'s','t'));assert.equal(R.value,minCutBrute(ids,arcs,'s','t').cap);assert.equal(R.cap,R.value);
    for(let k=1;k<R.steps.length;k++)for(const v of ids)assert.ok((R.steps[k].dist[v]??Infinity)>=(R.steps[k-1].dist[v]??Infinity));
  }
});
test('All 512 bipartite 3×3 graphs have matching flow equal to exhaustive vertex-cover cardinality',()=>{
  for(let mask=0;mask<512;mask++){
    const E=[];for(let i=0;i<9;i++)if(mask>>i&1)E.push([Math.floor(i/3),i%3]);
    const N=bipNet(3,3,E),R=fordFulkerson(N.ids,N.arcs,'s','t');assert.equal(R.value,coverBrute(3,3,E));
  }
});
test('Displayed Klee–Minty family takes 2^n−1 largest-coefficient pivots, while greatest-improvement takes one',()=>{
  for(let n=1;n<=6;n++){
    const c=Array.from({length:n},(_,j)=>10**(n-1-j)),rows=Array.from({length:n},(_,i)=>({a:Array.from({length:n},(_,j)=>j<i?2*10**(i-j):j===i?1:0),b:100**i,op:'<='}));
    const d=simplex(c,rows),g=simplex(c,rows,{rule:'greatest'});assert.equal(d.status,'optimal');assert.equal(d.pivots.length,2**n-1);assert.equal(g.pivots.length,1);assert.equal(d.value,g.value);
  }
});
test('Every square minor of a 4-cycle incidence matrix is TU; the triangle determinant is 2',()=>{
  const A=[[1,0,0,1],[1,1,0,0],[0,1,1,0],[0,0,1,1]],sets=[];
  for(let m=1;m<16;m++)sets.push(Array.from({length:4},(_,i)=>i).filter(i=>m>>i&1));
  for(const R of sets)for(const C of sets)if(R.length===C.length)assert.ok(Math.abs(detOf(R.map(i=>C.map(j=>A[i][j]))))<=1);
  assert.equal(Math.abs(detOf([[1,0,1],[1,1,0],[0,1,1]])),2);
});
test('ChaCha quarter-round matches RFC8439 §2.1.1 and block function matches §2.3.2',()=>{
  const s=Uint32Array.from([0x11111111,0x01020304,0x9b8d6f43,0x01234567]);quarter(s,0,1,2,3);assert.deepEqual([...s],[0xea2a92f4,0xcb1cf8ce,0x4581472e,0x5881c4bb]);
  const key=Array.from({length:8},(_,i)=>(4*i)|((4*i+1)<<8)|((4*i+2)<<16)|((4*i+3)<<24));
  const block=chachaBlock(chachaInit(key,1,[0x09000000,0x4a000000,0]));
  assert.deepEqual([...block],[0xe4e7f110,0x15593bd1,0x1fdd0f50,0xc47120a3,0xc7f4d1c7,0x0368c033,0x9aaa2204,0x4e6cd4c3,0x466482d2,0x09aa9f07,0x05d7c214,0xa2028bd9,0xd19c12b5,0xb94e16de,0xe883d0cb,0x4e3c50a2]);
});
test('Actual DES implementation matches independent standard KAT and reverses round keys for decryption',()=>{
  const encrypted=des('133457799BBCDFF1','0123456789ABCDEF').out;assert.equal(encrypted.toUpperCase(),'85E813540F0AB405');assert.equal(des('133457799BBCDFF1',encrypted,true).out.toUpperCase(),'0123456789ABCDEF');
});
test('DDT probabilities sum to one; LAT trivial cells are unavoidable and affine maps can spread one-bit differences',()=>{
  for(const {S} of Object.values(SBOXES)){const D=ddt(S),L=lat(S);assert.equal(D[0][0],16);assert.equal(L[0][0],8);for(const row of D)assert.equal(row.reduce((a,b)=>a+b,0),16);}
  // Invertible shear: x0 controls both output bits0 and1. Affine need not mean one changed output bit.
  const S=Array.from({length:16},(_,x)=>x^((x&1)<<1));assert.equal(new Set(S).size,16);assert.equal(S[0]^S[1],3);
});
test('Actual three prefix networks add every pair through six bits, including outgoing carries',()=>{
  for(let n=1;n<=6;n++)for(let a=0;a<2**n;a++)for(let b=0;b<2**n;b++)for(const kind of ['ks','sk','rc']){
    const R=runPrefix(Array.from({length:n},(_,i)=>a>>i&1),Array.from({length:n},(_,i)=>b>>i&1),kind),sum=R.sum.reduce((s,x,i)=>s+x*2**i,0)+R.cout*2**n;assert.equal(sum,a+b);
  }
});
test('Lupanov block construction reproduces every 3-variable truth table and random larger tables',()=>{
  for(let m=0;m<256;m++)for(const [k,s] of [[1,1],[2,2],[2,3]])assert.ok(lupanov(Array.from({length:8},(_,i)=>m>>i&1),3,k,s).ok);
  for(let n=4;n<=8;n++)for(let seed=0;seed<6;seed++)assert.ok(lupanov(randomTable(seed,n),n,Math.ceil(Math.log2(n)),Math.max(1,n-2)).ok);
});
test('Planar Jacobian matches finite differences; manipulability and isotropy obey independent formulas',()=>{
  for(const theta of [-2.6,-1.3,.2,1.5]){
    const L=[1.3,.8],q=[.4,theta],J=planarJ(L,q),sv=svd2xn(J).s,h=1e-6;
    for(let i=0;i<2;i++){const plus=q.slice(),minus=q.slice();plus[i]+=h;minus[i]-=h;const A=planarFK(L,plus).tip,B=planarFK(L,minus).tip;for(let j=0;j<2;j++)assert.ok(Math.abs((A[j]-B[j])/(2*h)-J[j][i])<1e-8);}
    assert.ok(Math.abs(sv[0]*sv[1]-L[0]*L[1]*Math.abs(Math.sin(theta)))<1e-10);
  }
  const s=svd2xn(planarJ([Math.SQRT2,1],[.2,3*Math.PI/4])).s;assert.ok(Math.abs(s[0]/s[1]-1)<1e-7);
});
test('Bracket abstraction obeys substitution on fresh arguments with and without eta optimization',()=>{
 const V=x=>({t:'v',x}),sub=(t,x,n)=>t.t==='v'?(t.x===x?n:t):t.t==='a'?CA(sub(t.f,x,n),sub(t.a,x,n)):t;
 const terms=[V('x'),V('y'),CA(V('f'),V('x')),CA(V('x'),V('y')),CA(V('f'),CA(V('x'),V('z')))];
 for(const t of terms)for(const eta of [false,true]){const got=clNormalForm(CA(bracket('x',t,eta),V('z')));assert.ok(got.ok);assert.equal(clKey(got.t),clKey(sub(t,'x',V('z'))));}
});
test('Arden epsilon case can have exactly two solutions: a+ and a*',()=>{
  const N=7,solutions=[];for(let m=0;m<2**(N+1);m++){
    const X=new Set(Array.from({length:N+1},(_,i)=>i).filter(i=>m>>i&1)),rhs=new Set([1,...X,...[...X].filter(i=>i<N).map(i=>i+1)]);
    if(rhs.size===X.size&&[...rhs].every(i=>X.has(i)))solutions.push(m);
  }
  assert.deepEqual(solutions,[254,255]);
});
test('Double reversal preserves a DFA whose existing state is named z, including partial transitions',()=>{
  const D={alpha:['a','b'],start:'z',states:[{id:'z',acc:false},{id:'q',acc:true}],delta:{z:{a:['q'],b:['z']},q:{a:['q'],b:[]}}};
  const R=detRename(reverseN(detRename(reverseN(D))));
  for(let n=0;n<=7;n++)for(let m=0;m<2**n;m++){const w=Array.from({length:n},(_,i)=>m>>i&1?'a':'b').join('');assert.equal(nfaAccepts(R,w),nfaAccepts(D,w),w);}
  assert.equal(R.states.length,2);
});

import {dEngine} from '../content/dist/ch04-b.js';
test('A weakly fair scheduler can starve one dining philosopher while both neighbours repeatedly eat',()=>{
  const E=dEngine(3,{rule:'coin',rng:()=>.75});E.stepOne(0);assert.equal(E.side[0],1);
  for(let round=0;round<100;round++){
    // Neighbour1 reaches eating; philosopher0 gets a genuine scheduled test, always sees fork1 held.
    E.stepOne(1);E.stepOne(1);E.stepOne(1);assert.equal(E.pc[1],3);E.stepOne(0);E.stepOne(1);
    // The other neighbour also completes a meal, so all three processes take infinitely many steps on repetition.
    E.stepOne(2);E.stepOne(2);E.stepOne(2);E.stepOne(2);
    assert.equal(E.pc[0],1);assert.equal(E.eat[0],0);assert.equal(E.eat[1],round+1);assert.equal(E.eat[2],round+1);
    assert.deepEqual(E.own,[-1,-1,-1]);
  }
});

test('Signed EDF objective attains exhaustive optimum even when all jobs are early',()=>{
  const L=(jobs,order)=>{let C=0,out=-Infinity;for(const j of order){C+=jobs[j].t;out=Math.max(out,C-jobs[j].d)}return out};
  for(let seed=0;seed<14;seed++){
    const jobs=Array.from({length:6},(_,j)=>({t:1+(seed*3+j*7)%5,d:seed%2?100+j*3:(seed*5+j*11)%20})),order=jobs.map((_,j)=>j).sort((a,b)=>jobs[a].d-jobs[b].d);
    assert.equal(L(jobs,order),Math.min(...[...permutations(jobs.map((_,j)=>j))].map(p=>L(jobs,p))));
  }
});
test('Ciphertext collisions need not equal random-coin collisions when encryption ignores some coins',()=>{
  const N=8;for(const enc of [(m,r)=>m*N+r,(m,r)=>m*2+(r&1),(m,r)=>m]){
    let same=0;for(let r=0;r<N;r++)for(let s=0;s<N;s++)if(enc(0,r)===enc(0,s))same++;
    const kappa=same/N**2;assert.ok(kappa>=1/N);assert.equal(kappa,enc(0,0)===enc(0,2)?(enc(0,0)===enc(0,1)?1:.5):1/N);
    let wins=0;for(let b=0;b<2;b++)for(let r=0;r<N;r++)for(let s=0;s<N;s++){const guess=enc(0,r)===enc(b,s)?0:1;if(guess===b)wins++;}assert.equal(wins/(2*N**2),.5+kappa/2);
  }
});

import {triangulate,ccwPoly,area2,isSimplePoly} from '../content/cg/ch03.shared.js';
test('Ear clipping handles a boundary vertex on the proposed diagonal and collinear consecutive vertices',()=>{
 for(const input of [[[0,0],[2,-1],[4,-1],[2,0],[4,1],[2,1]],[[0,0],[1,0],[2,0],[0,1]]]){
  const P=ccwPoly(input);assert.ok(isSimplePoly(P));const tris=triangulate(P);assert.equal(tris.length,P.length-2);
  const areas=tris.map(t=>area2(t.map(i=>P[i])));assert.ok(areas.every(a=>a>0));assert.ok(Math.abs(areas.reduce((s,a)=>s+a,0)-area2(P))<1e-12);
 }
});
