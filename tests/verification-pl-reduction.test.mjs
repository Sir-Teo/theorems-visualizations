import test from 'node:test';
import assert from 'node:assert/strict';
import {P,DEFS,subst,redexes,contract,key,dev,parAll,contractSet,V,L,A,bracketSteps,clKey,clLeaves,clFV} from '../content/pl/ch03.shared.js';
import {parseTM,typeOf,tyEq,tyStr,derive,genTyped,TN,TB,tKey} from '../content/pl/ch04.shared.js';
import {oneStepDiamond,finiteOneStepDiamond,limitedParallel,parallelMembership,boundedBracket,freshObservation,reductionGraph,validatedTyped} from '../content/pl/reduction-audit.shared.js';

// Independent locally nameless representation and beta substitution (no runtime substitution helpers).
const db=(t,E=[])=>t.t==='v'?(E.includes(t.x)?['b',E.length-1-E.lastIndexOf(t.x)]:['v',t.x]):t.t==='l'?['l',db(t.b,[...E,t.x])]:['a',db(t.f,E),db(t.a,E)];
function shift(t,d,c=0){if(t[0]==='b')return['b',t[1]>=c?t[1]+d:t[1]];if(t[0]==='v')return t;if(t[0]==='l')return['l',shift(t[1],d,c+1)];return['a',shift(t[1],d,c),shift(t[2],d,c)];}
function bound(t,j,s,depth=0){if(t[0]==='b')return t[1]===j+depth?shift(s,depth):t;if(t[0]==='v')return t;if(t[0]==='l')return['l',bound(t[1],j,s,depth+1)];return['a',bound(t[1],j,s,depth),bound(t[2],j,s,depth)];}
const beta=(b,a)=>shift(bound(b,0,shift(a,1)),-1);
function freeSub(t,x,s,d=0){if(t[0]==='v')return t[1]===x?shift(s,d):t;if(t[0]==='b')return t;if(t[0]==='l')return['l',freeSub(t[1],x,s,d+1)];return['a',freeSub(t[1],x,s,d),freeSub(t[2],x,s,d)];}
function steps(t){if(t[0]==='v'||t[0]==='b')return[];if(t[0]==='l')return steps(t[1]).map(u=>['l',u]);return[...(t[1][0]==='l'?[beta(t[1][1],t[2])]:[]),...steps(t[1]).map(u=>['a',u,t[2]]),...steps(t[2]).map(u=>['a',t[1],u])];}
const json=JSON.stringify;
function terms(n){if(n===1)return[V('x'),V('y')];const out=[];for(const b of terms(n-1))for(const x of ['x','y'])out.push(L(x,b));for(let i=1;i<n-1;i++)for(const f of terms(i))for(const a of terms(n-1-i))out.push(A(f,a));return out;}
const SMALL=[...terms(1),...terms(2),...terms(3),...terms(4),...terms(5),...terms(6)];
function independentPar(t){if(t[0]==='b'||t[0]==='v')return[t];if(t[0]==='l')return independentPar(t[1]).map(u=>['l',u]);const F=independentPar(t[1]),N=independentPar(t[2]),out=F.flatMap(f=>N.map(a=>['a',f,a]));if(t[1][0]==='l')for(const b of independentPar(t[1][1]))for(const a of N)out.push(beta(b,a));return[...new Map(out.map(u=>[json(u),u])).values()];}
test('capture-avoiding substitution and every beta contraction agree with independent de Bruijn operations',()=>{
 for(const t of SMALL){for(const s of [V('x'),V('y'),P('λx. y'),P('λy. x y')])for(const x of ['x','y'])assert.deepEqual(db(subst(t,x,s)),freeSub(db(t),x,db(s)));assert.deepEqual(new Set(redexes(t).map(p=>json(db(contract(t,p))))),new Set(steps(db(t)).map(json)));}
 for(const src of ['(λx. λy. x) y','(λx. λy. λy\'. x y) y','(λx. λx. x) y']){const t=P(src);assert.deepEqual(db(contract(t,'')),steps(db(t))[0]);}
});
test('parallel reduct enumeration, complete development and parallel substitution lemma agree independently',()=>{
 for(const t of [...SMALL,P('(λx. x x) ((λy. y) z)'),P('(λx. λy. x) y')]){
  const expected=new Set(independentPar(db(t)).map(json)),actual=parAll(t,400);assert.equal(actual.complete,true);assert.deepEqual(new Set(actual.list.map(u=>json(db(u)))),expected);
  for(const u of actual.list){assert.ok(new Set(independentPar(db(u)).map(json)).has(json(db(dev(t)))));assert.equal(parallelMembership(u,dev(t)),true);}
  const rs=redexes(t);if(rs.length<=6)for(let mask=0;mask<2**rs.length;mask++){const S=new Set(rs.filter((_,j)=>mask>>j&1)),r=limitedParallel(t,S);assert.equal(r.complete,true);assert.deepEqual(db(r.term),db(contractSet(t,S)));assert.ok(expected.has(json(db(r.term))));}
  const D=limitedParallel(t,new Set(),{all:true});assert.equal(D.complete,true);assert.deepEqual(db(D.term),db(dev(t)));
 }
 for(const t of SMALL.filter((_,i)=>i%7===0))for(const u of [P('(λx. x) y'),P('λy. x')])for(const a of parAll(t).list)for(const b of parAll(u).list){const left=subst(t,'x',u),right=subst(a,'x',b);assert.ok(new Set(independentPar(db(left)).map(json)).has(json(db(right))));}
 assert.equal(limitedParallel(P('(λx. x x x) (a b c d)'),new Set(['']),{maxSize:10}).complete,false);
});
test('exact one-step diamonds are independent of shortest joins and preserve strict repeated-successor convention',()=>{
 const e=P('(λx. y) ((λz. z) w)'),[a,b]=redexes(e).map(p=>contract(e,p));assert.equal(oneStepDiamond(a,b).value,false);
 const t=P('(λx. x) y');assert.equal(oneStepDiamond(t,t).value,true);assert.equal(oneStepDiamond(V('y'),V('y')).value,false);
 assert.equal(finiteOneStepDiamond([[1,2],[3],[3],[]],1,2),true);assert.equal(finiteOneStepDiamond([[1,2],[3],[4],[4],[]],1,2),false);
});
function clSteps(t){const out=[];if(t.t!=='a')return out;const h=t.f;if(h.t==='c'&&h.c==='I')out.push(t.a);if(h.t==='a'&&h.f.t==='c'&&h.f.c==='K')out.push(h.a);if(h.t==='a'&&h.f.t==='a'&&h.f.f.t==='c'&&h.f.f.c==='S')out.push({t:'a',f:{t:'a',f:h.f.a,a:t.a},a:{t:'a',f:h.a,a:t.a}});return[...out,...clSteps(t.f).map(f=>({...t,f})),...clSteps(t.a).map(a=>({...t,a}))];}
const substCL=(m,x,n)=>m.t==='v'&&m.x===x?n:m.t==='a'?{t:'a',f:substCL(m.f,x,n),a:substCL(m.a,x,n)}:m;
function reachableCL(a,b){const target=clKey(b),seen=new Set(),q=[a];for(let i=0;i<q.length&&i<2000;i++){const u=q[i],k=clKey(u);if(k===target)return true;for(const v of clSteps(u)){const j=clKey(v);if(!seen.has(j)){seen.add(j);q.push(v);}}}return false;}
test('bracket application law, free-variable side conditions, eta distinction and fresh open-term observations',()=>{
 const M=[V('x'),V('y'),A(V('x'),V('y')),A(V('f'),V('x')),A(V('x'),A(V('y'),V('x')))];
 for(const m of M)for(const eta of [false,true])for(const n of [V('a'),A(V('b'),V('c'))]){const r=boundedBracket(L('x',m),eta);assert.equal(r.complete,true);assert.ok(!clFV(r.states.at(-1)).has('x'));assert.ok(reachableCL({t:'a',f:r.states.at(-1),a:n},substCL(m,'x',n)));}
 for(const src of ['λx. x','λx y. x','λx y z. x z (y z)','λx. a x','λx. p0 x','λx. λx. x'])for(const eta of [false,true]){const t=P(src),r=boundedBracket(t,eta),old=bracketSteps(t,eta);assert.equal(r.complete,true);assert.equal(clKey(r.states.at(-1)),clKey(old.states.at(-1)));const o=freshObservation(t,r.states.at(-1));assert.ok(o&&o.complete);assert.equal(o.lam,o.cl);for(const x of o.names)assert.ok(!src.includes(x));}
 const plain=boundedBracket(P('λx. f x'),false).states.at(-1),eta=boundedBracket(P('λx. f x'),true).states.at(-1);assert.notEqual(clKey(plain),clKey(eta));assert.equal(clKey(eta),'$f');
 assert.equal(boundedBracket(P('λx y z. x z (y z)'),false,5).complete,false);
 const Y=P('Y',DEFS),r=boundedBracket(Y);assert.equal(r.complete,true);assert.equal(freshObservation(Y,r.states.at(-1)),null);
});
function typing(t,E=[]){const eq=(a,b)=>json(a)===json(b);switch(t.t){case'c':return t.c==='zero'?'N':'B';case'v':return E.findLast(([x])=>x===t.x)?.[1]||null;case'l':{if(!t.ty)return null;const S=ty(t.ty),B=typing(t.b,[...E,[t.x,S]]);return B?['f',S,B]:null;}case'a':{const F=typing(t.f,E),A=typing(t.a,E);return F?.[0]==='f'&&eq(F[1],A)?F[2]:null;}case'p':return typing(t.a,E)==='N'?(t.op==='iszero'?'B':'N'):null;case'i':{const A=typing(t.a,E),B=typing(t.b,E),C=typing(t.c,E);return A==='B'&&B&&eq(B,C)?B:null;}default:return null;}}
const ty=T=>T.k==='f'?['f',ty(T.a),ty(T.b)]:T.k;
test('STLC rules, shadowing, contexts and admitted generated terms agree with an independent type checker',()=>{
 const strings=['λx:Nat. succ x','λf:Nat->Nat. λx:Nat. f (f x)','(λx:Nat. iszero x) 3','λb:Bool. λn:Nat. if b then n else 0','λx:Nat. x x','(λx:Nat. x) true','λx:Nat. λx:Bool. x','λx. x','x'];
 for(const s of strings){const t=parseTM(s).ast,expected=typing(t),actual=typeOf(t);assert.deepEqual(actual?ty(actual):null,expected);assert.deepEqual(derive(t).ty?ty(derive(t).ty):null,expected);}
 function random(seed){const f=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};f.pick=a=>a[Math.floor(f()*a.length)];return f;}
 for(let seed=0;seed<120;seed++)for(const n of [8,24,36]){const T=seed%2?TN:TB,g=validatedTyped(random(seed),T,n);assert.deepEqual(typing(g.term),ty(T));assert.ok(tyEq(typeOf(g.term),T));}
});
function purePathStats(t){const seen=new Set();function go(u){const k=json(u);assert.ok(!seen.has(k));seen.add(k);const S=steps(u),R=S.map(go);seen.delete(k);return S.length?{min:1+Math.min(...R.map(x=>x.min)),max:1+Math.max(...R.map(x=>x.max))}:{min:0,max:0};}return go(t);}
test('normalization graph exact extrema, cycle certificates and all three unknown budgets are distinguished',()=>{
 for(const s of ['(λx:Nat. x) 0','(λx:Nat. x) ((λy:Nat. y) 0)','(λx:Nat. (λy:Nat. x) x) ((λz:Nat. z) 0)']){const t=parseTM(s).ast,q=reductionGraph(t),replace=u=>u.t==='c'?V(u.c):u.t==='v'?V(u.x):u.t==='l'?L(u.x,replace(u.b)):A(replace(u.f),replace(u.a)),ref=purePathStats(db(replace(t)));assert.equal(q.status,'complete');assert.equal(q.min,ref.min);assert.equal(q.max,ref.max);}
 for(const s of ['(λx. x x) (λx. x x)','(λx. y) ((λx. x x) (λx. x x))'])assert.equal(reductionGraph(parseTM(s).ast).status,'cycle');
 const t=parseTM('(λx:Nat. x) ((λy:Nat. y) 0)').ast;for(const[option,reason]of [[{cap:1},'state count'],[{maxSize:2},'term size'],[{maxDepth:0},'depth']]){const q=reductionGraph(t,option);assert.equal(q.status,'unknown');assert.ok(q.limits.includes(reason));assert.equal(q.min,null);assert.equal(q.max,null);}
 const p=parseTM('if true then pred (succ 0) else iszero 0').ast;assert.equal(reductionGraph(p).status,'complete');
});
