import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as H from '../content/cplx/ch06.shared.js';

test('private information limits every finite policy, while disclosure breaks soundness',()=>{
 for(let i=0;i<16;i++){const policy=H.bitVector(i,4);assert.equal(H.privateGame(false,policy).success,.5);assert.equal(H.privateGame(false,policy,true).success,1);}
 assert.equal(H.privateGame(true,[0,1,0,1]).success,1);
 assert.throws(()=>H.privateGame(false,[0,1]));
});
test('graph distributions count permutation multiplicities and weighted orbits',()=>{
 const a=H.graphExperiment(4,'0-1 1-2 2-3','0-2 2-1 1-3');assert.equal(a.isomorphic,true);assert.equal(a.optimum,.5);assert.equal(a.weightedOrbitSize,24);for(const r of a.rows)assert.equal(r.count0,r.count1);
 const b=H.graphExperiment(4,'0-1 1-2 2-3','0-1 0-2 0-3');assert.equal(b.isomorphic,false);assert.equal(b.optimum,1);assert.equal(b.weightedOrbitSize,48);assert.deepEqual(b.automorphisms,[2,6]);
 assert.equal(H.graphExperiment(3,'','').automorphisms[0],6);assert.throws(()=>H.parseGraph('0-0',3));
});
test('AM and MA preserve the order of maximum and averaging',()=>{
 const a=H.acceptMatrix('[[1,0],[0,1]]');assert.equal(a.am,1);assert.equal(a.ma,.5);
 const b=H.acceptMatrix('[[1,0],[1,0]]');assert.equal(b.ma,1);
 for(let code=0;code<16;code++){const bits=H.bitVector(code,4),r=H.acceptMatrix(JSON.stringify([bits.slice(0,2),bits.slice(2)]));assert(r.ma<=r.am);}
 assert.throws(()=>H.acceptMatrix('[[1],[0,1]]'));
});
test('binary affine hash families are pairwise independent and satisfy exact hit bounds',()=>{
 for(let k=1;k<=2;k++)for(const [x,y]of [[0,1],[3,15],[5,10]]){const M=2**k,counts=Array.from({length:M},()=>Array(M).fill(0));for(let A=0;A<2**(4*k);A++)for(let b=0;b<M;b++)counts[H.binaryHash(x,A,b,k)][H.binaryHash(y,A,b,k)]++;for(const row of counts)for(const count of row)assert.equal(count,2**(4*k)/M);}
 for(let k=1;k<=3;k++)for(const src of ['', '0','0 1','0 2 5 9','0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15']){const r=H.hashExperiment(src,k,65535,31);assert(r.probability+1e-12>=r.lower);assert(r.probability<=r.upper+1e-12);assert(r.preimages.every(x=>H.binaryHash(x,r.A,r.b,k)===0));}
});
test('intersection shifts give perfect completeness only with a strict covering bound',()=>{
 const dense=H.shiftExperiment('0 1 2 3 4 5 6',[0,1,2]);assert.equal(dense.probability,1);assert(dense.complementCover<8);
 const sparse=H.shiftExperiment('0 1',[0,1,2]);assert(sparse.probability<=sparse.unionUpper);
 const boundary=H.shiftExperiment('0 1 2 3',[0,4]);assert.equal(boundary.intersection.length,0);assert.equal(boundary.complementCover,8);
});
test('arithmetization agrees on the entire cube for all connectives and preserves formal degree',()=>{
 for(const p of [3,5,17,101])for(const src of ['0','1','a','!a','a&a','a|b','a^b','a->b','a<->b','!(a&b)|c','(a|!b)&(b|c)&(!a|!c)']){const F=H.formula(src,p);for(const r of F.rows)assert.equal(r.boolean,r.polynomial);}
 const F=H.formula('a&a');assert.equal(F.degrees[0],2);assert.equal(H.polyValue(F.P,[3],101),9);assert.equal(H.polyValue(H.linearize(F.P,0,101),[3],101),3);
 assert.throws(()=>H.formula('a|b|c|d|e'));assert.throws(()=>H.formula(''));assert.throws(()=>H.field(9));
});
test('sumcheck accepts every honest tape and bounds an adaptive false claim',()=>{
 for(const src of ['0','1','a|b','(a|b)&(!a|b)','a&a']){const F=H.formula(src,5),n=F.vars.length;let accepted=0;for(let code=0;code<5**n;code++){let z=code;const points=Array.from({length:n},()=>{const t=z%5;z=Math.floor(z/5);return t;});assert.equal(H.sumcheck(F,{points}).accepted,true);if(H.sumcheck(F,{claim:F.count+1,points,strategy:'adaptive',guess:0}).accepted)accepted++;}assert(accepted/5**n<=H.sumcheck(F).bound+1e-12);}
 const F=H.formula('a|b',17);assert.equal(H.sumcheck(F,{manual:[0,0,1]}).accepted,false);assert.equal(H.sumcheck(F,{manual:[0]}).accepted,false);
 const alias=H.formula('a|b',3);assert.equal(alias.count,3);assert.equal(H.sumcheck(alias,{claim:0}).accepted,true); // honest modular count does not certify the integer zero
});
test('QBF elimination and every small honest transcript agree with recursive Boolean semantics',()=>{
 function truth(F,Q,j=0,env={}){if(j===F.vars.length)return F.rows.find(r=>r.point.every((x,k)=>x===env[F.vars[k]])).boolean;const a=truth(F,Q,j+1,{...env,[F.vars[j]]:0}),b=truth(F,Q,j+1,{...env,[F.vars[j]]:1});return Q[j]==='A'?a&b:a|b;}
 for(const src of ['0','1','a','a|b','a<->b','a^b','a&a']){const F=H.formula(src,5),n=F.vars.length;for(let quant=0;quant<2**n;quant++){const Q=H.bitVector(quant,n).map(x=>x?'A':'E').join(''),R=H.quantified(F,Q);assert.equal(R.value,truth(F,Q));assert.equal(R.operations.length,n+n*(n+1)/2);const L=R.operations.length;for(let t=0;t<25;t++){const points=Array.from({length:L},(_,j)=>(t*(j+1)+j*j)%5);assert.equal(H.qbfProtocol(R,{points}).accepted,true);}}}
 const F=H.formula('a',5),R=H.quantified(F,'E');let count=0;for(let a=0;a<5;a++)for(let b=0;b<5;b++)if(H.qbfProtocol(R,{claim:0,points:[a,b],strategy:'adaptive'}).accepted)count++;assert(count/25<=H.qbfProtocol(R).bound);
 assert.throws(()=>H.quantified(H.formula('a|b'),'A'));
});
test('the separated clause game has a genuine unsatisfiable gap; communication removes it',()=>{
 const src='[[1,2],[-1,2],[1,-2],[-1,-2]]',r=H.clauseGame(src,'1 1 1 0','0 0');assert.equal(r.optimum,7/8);assert.equal(r.satisfiable,false);assert.equal(r.communicating,1);
 const b=H.clauseGame(src,r.best.local.join(' '),r.best.global.join(' '));assert.equal(b.value,r.optimum);
 const sat=H.clauseGame('[[1],[-1,2]]','1 3','1 1');assert.equal(sat.optimum,1);assert.equal(sat.value,1);
 assert.throws(()=>H.clauseGame('[[1,1]]','1','1'));
});
test('permanent checker follows actual minors and interpolation, including malicious zero answers',()=>{
 for(const p of [17,101])for(const source of ['[[3]]','[[1,2],[3,4]]','[[1,1,-1],[0,1,1],[1,0,1]]']){const A=H.parseMatrix(source,p),expected=A.length===1?3:A.length===2?10:1;assert.equal(H.permanent(A,p),expected);for(let r=0;r<p;r++)assert.equal(H.permanentChecker(A,p,{points:[r,(r*3)%p]}).accepted,true);}
 const p=17,A=H.parseMatrix('[[1,1,-1],[0,1,1],[1,0,1]]',p);let accepts=0;for(let a=0;a<p;a++)for(let b=0;b<p;b++)if(H.permanentChecker(A,p,{mode:'zero',points:[a,b]}).accepted)accepts++;assert(accepts/(p*p)<=H.permanentChecker(A,p).bound);assert.equal(H.permanentChecker(A,p,{mode:'zero'}).initial,0);
 assert.throws(()=>H.interpolate([0,5],[0,1],5));assert.throws(()=>H.parseMatrix('[[1,2]]',17));
});

test('all eleven frozen identities and syllabus fields agree, with written proof inputs', async () => {
  const plan = JSON.parse(fs.readFileSync(new URL('../docs/wave-6-plan.json', import.meta.url))), frozen = plan.chapters.find(c => (c.col || c.collection) === 'cplx').items;
  const parts = await Promise.all(['', '-b'].map(p => import(`../content/cplx/ch06${p}.js`))), items = parts.flatMap(p => p.default.items), syllabus = (await import('../content/cplx/syllabus.js')).default.chapters.find(c => c.n === 6).items;
  assert.equal(items.length, 11); assert.equal(frozen.length, 11);
  for (const [j, item] of items.entries()) {
    assert.equal('cplx-' + item.num, frozen[j].id);
    for (const key of ['name', 'kind', 'verify', 'paper', 'introduces']) { assert.deepEqual(item[key], frozen[j][key]); assert.deepEqual(item[key], syllabus[j][key]); }
    for (const key of ['deps', 'refs']) assert.deepEqual(item[key], syllabus[j][key]);
    assert.equal(item.caption, syllabus[j].pic); for (const key of ['statement', 'idea', 'caption']) assert.ok(item[key].length > 100); assert.equal(typeof item.viz, 'function');
  }
  for (const id of new Set(items.flatMap(i => i.deps).filter(id => !id.startsWith('cplx-6.')))) {
    const [col, num] = id.split('-'), chapter = num.split('.')[0].padStart(2, '0'), dir = new URL('../content/' + col + '/', import.meta.url); let found = false;
    for (const file of fs.readdirSync(dir).filter(f => new RegExp('^ch' + chapter + '(?:-[a-z0-9]+)?\\.js$').test(f))) if ((await import(new URL(file, dir))).default.items.some(i => i.num === num)) found = true;
    assert.ok(found, id + ' is written');
  }
});

test('polynomial commitments cannot depend on the challenge revealed afterward',()=>{
 const F=H.formula('(a | b) & (!a | b)',17),R=H.quantified(F,'AE'),A=H.parseMatrix('[[1,1,-1],[0,1,1],[1,0,1]]',17);
 const first=[];for(let r=0;r<17;r++)first.push({sum:H.sumcheck(F,{claim:F.count+1,points:[r,3],strategy:'adaptive',guess:2}).frames[0].proposed,qbf:H.qbfProtocol(R,{claim:1-R.value,points:[r,3,4],strategy:'adaptive'}).frames[0].proposed,checker:H.permanentChecker(A,17,{mode:'zero',points:[r,3]}).frames[0].proposed});
 for(const f of first)assert.deepEqual(f,first[0]);
});
