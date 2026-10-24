import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as H from '../content/rep/ch06.shared.js';
const near=(a,b,tol=2e-10)=>assert.ok(Math.abs(a-b)<tol,`${a} ≠ ${b}`);
const nearz=(a,b,tol)=>{near(a[0],b[0],tol);near(a[1],b[1],tol);};
// A second induction oracle sums over every group element, not chosen cosets.
function inducedOracle(G,sub,chi){const members=new Set(sub);return Array.from({length:G.N},(_,g)=>{let z=[0,0];for(let x=0;x<G.N;x++){const h=G.mult(G.mult(G.inv(x),g),x);if(members.has(h))z=H.zadd(z,chi[h]);}return H.zscale(z,1/sub.length);});}
function checkAction(G,I,selected=Array.from({length:G.N},(_,i)=>i)){for(const a of selected)for(const b of selected)for(let j=0;j<I.degree;j++){const B=I.actions[b][j],A=I.actions[a][B.to],AB=I.actions[G.mult(a,b)][j];assert.equal(AB.to,A.to);nearz(AB.phase,H.zmul(A.phase,B.phase));}}
test('S4 characters agree with permutation modules, signs and pair-partition action',()=>{
 const partitions=[[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]],key=p=>p.map(a=>a.slice().sort().join('')).sort().join('|');
 for(let i=0;i<24;i++){const p=H.S4.elements[i],fixed=p.filter((x,j)=>x===j).length;let inv=0;for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)inv+=+(p[a]>p[b]);const sign=(-1)**inv,fp=partitions.filter(Q=>key(Q.map(pair=>pair.map(x=>p[x])))===key(Q)).length;assert.deepEqual(H.S4chars.map(c=>c[i][0]),[1,sign,fp-1,fixed-1,sign*(fixed-1)]);}
 for(let i=0;i<5;i++)for(let j=0;j<5;j++)nearz(H.inner(H.S4chars[i],H.S4chars[j]),[+(i===j),0]);
});
test('restriction gives complete S4 to S3 and A4 branching with dimension preservation',()=>{
 assert.deepEqual(H.branching('S3').multiplicities,[[1,0,0],[0,1,0],[0,0,1],[1,0,1],[0,1,1]]);
 assert.deepEqual(H.branching('A4').multiplicities,[[1,0,0,0],[1,0,0,0],[0,1,1,0],[0,0,0,1],[0,0,0,1]]);
 for(const name of ['S3','A4']){const B=H.branching(name);for(let i=0;i<5;i++)for(const h of B.H){const sum=H.sumz(B.chars.map((c,j)=>H.zscale(c[h],B.multiplicities[i][j])));nearz(sum,H.S4chars[i][h]);}}
});
test('induction matrices obey every S3 multiplication and the independent character formula',()=>{
 for(const sub of[H.C2,H.C3])for(let k=0;k<sub.length;k++){const chi=H.cyclicChar(H.S3,sub,k),I=H.induced(H.S3,sub,chi),oracle=inducedOracle(H.S3,sub,chi);assert.equal(I.degree,6/sub.length);assert.equal(new Set(I.sets.flat()).size,6);checkAction(H.S3,I);for(let g=0;g<6;g++){nearz(I.values[g],oracle[g]);const A=H.inducedMatrix(I,g);nearz(H.sumz(A.map((r,i)=>r[i])),oracle[g]);}}
});
test('Frobenius reciprocity matches known restriction multiplicities for every pair',()=>{
 for(const[sub,expected]of[[H.C2,[[1,0],[0,1],[1,1]]],[H.C3,[[1,0,0],[1,0,0],[0,1,1]]]])for(let k=0;k<sub.length;k++)for(let r=0;r<3;r++){const chi=H.cyclicChar(H.S3,sub,k),I=H.induced(H.S3,sub,chi);nearz(H.inner(I.values,H.S3chars[r]),[expected[r][k],0]);nearz(H.inner(chi,H.S3chars[r],sub),[expected[r][k],0]);}
});
test('Mackey intersections and overlap sums distinguish reducible from irreducible induction',()=>{
 for(const sub of[H.C2,H.C3])for(let k=0;k<sub.length;k++){const c=H.cyclicChar(H.S3,sub,k),M=H.mackey(H.S3,sub,c),I=H.induced(H.S3,sub,c);assert.equal(new Set(M.flatMap(r=>r.double)).size,6);assert.equal(M.reduce((s,r)=>s+r.double.length,0),6);nearz(H.sumz(M.map(r=>r.overlap)),H.inner(I.values,I.values));near(H.inner(I.values,I.values)[0],sub===H.C3&&k?1:2);}
});
test('external tensor products have orthogonal characters and the full degree-square sum',()=>{
 const chars=[];for(const sign of[1,-1])for(const c of H.S3chars)chars.push([...c,...c.map(z=>H.zscale(z,sign))]);for(let i=0;i<6;i++)for(let j=0;j<6;j++)nearz(H.inner(chars[i],chars[j]),[+(i===j),0]);assert.equal(chars.reduce((s,c)=>s+c[0][0]**2,0),12);
});
test('dihedral orbit classifications agree with full character orthogonality from n=3 through 12',()=>{
 for(let n=3;n<=12;n++){const G=H.dihedral(n),O=H.dualOrbits(n);assert.deepEqual(O.flatMap(o=>o.orbit).sort((a,b)=>a-b),Array.from({length:n},(_,i)=>i));assert.deepEqual(O.flatMap(o=>o.degrees).sort(),G.degrees.slice().sort());assert.equal(G.degrees.reduce((s,d)=>s+d*d,0),2*n);for(let i=0;i<G.chars.length;i++)for(let j=0;j<G.chars.length;j++)nearz(H.inner(G.chars[i],G.chars[j]),[+(i===j),0]);assert.ok(G.degrees.every(d=>d<=2));}
});
test('Artin rational certificates reconstruct all Klein characters and omission really fails',()=>{
 for(let k=0;k<4;k++){const A=H.artin(k);for(let g=0;g<4;g++){nearz(A.values[g],A.chi[g]);assert.ok(A.coeff.every(c=>Number.isInteger(2*c)));}assert.equal(Math.abs(A.coeff[0]*4),2);}
});
test('Brauer integer certificates use actual elementary subgroup characters and reconstruct all S4 elements',()=>{
 const cols=H.brauerColumns();for(const c of cols){for(const a of c.H)for(const b of c.H)nearz(c.chi[H.S4.mult(a,b)],H.zmul(c.chi[a],c.chi[b]));const oracle=inducedOracle(H.S4,c.H,c.chi);for(let g=0;g<24;g++)nearz(c.I.values[g],oracle[g]);checkAction(H.S4,c.I);}
 for(let k=0;k<5;k++){assert.ok(H.brauerCoefficients[k].every(Number.isInteger));for(let g=0;g<24;g++)nearz(H.sumz(cols.map((c,j)=>H.zscale(c.I.values[g],H.brauerCoefficients[k][j]))),H.S4chars[k][g]);}
});
test('affine kernels pass all products, inverses, conjugations and sharp transitivity',()=>{
 for(const p of[3,5,7]){const G=H.affine(p),K=new Set(G.kernel);assert.equal(K.size,p);assert.ok(G.fixed.every((f,i)=>i===G.e?f.length===p:f.length<=1));for(const k of K){assert.ok(K.has(G.inv(k)));for(const h of K)assert.ok(K.has(G.mult(k,h)));for(let g=0;g<G.N;g++)assert.ok(K.has(G.mult(G.mult(g,k),G.inv(g))));}for(let x=0;x<p;x++)for(let y=0;y<p;y++)assert.equal([...K].filter(k=>{const[a,b]=G.elements[k];return(a*x+b)%p===y;}).length,1);}
});
test('GL2 matrix enumeration and conjugacy orbits match four independently counted types',()=>{
 for(const q of[3,5]){const G=H.gl2(q);assert.equal(G.N,(q*q-1)*(q*q-q));const unused=new Set(G.elements.map((_,i)=>i)),count=[0,0,0,0],sizes=[1,q*q-1,q*(q+1),q*(q-1)];while(unused.size){const x=unused.values().next().value,C=new Set(G.elements.map((_,g)=>G.mult(G.mult(g,x),G.inv(g))));assert.equal(C.size,sizes[G.types[x]]);count[G.types[x]]++;for(const y of C){assert.equal(G.types[y],G.types[x]);unused.delete(y);}}assert.deepEqual(count,[q-1,q-1,(q-1)*(q-2)/2,q*(q-1)/2]);assert.equal(G.families.reduce((s,f)=>s+f.count*f.degree**2,0),G.N);assert.equal(G.families.reduce((s,f)=>s+f.count,0),q*q-1);}
});
test('GL2 principal series norms and permutation character agree with independent projective-line action',()=>{
 for(const q of[3,5]){const G=H.gl2(q),lines=[...Array.from({length:q},(_,t)=>[1,t]),[0,1]];for(let k=0;k<q-1;k++)for(let l=0;l<q-1;l++){const I=H.principal(G,k,l);nearz(H.inner(I.values,I.values),[k===l?2:1,0]);assert.equal(I.degree,q+1);if(k===0&&l===0)for(let g=0;g<G.N;g++){const[a,b,c,d]=G.elements[g],fixed=lines.filter(([x,y])=>H.mod((a*x+b*y)*y-(c*x+d*y)*x,q)===0).length;nearz(I.values[g],[fixed,0]);}checkAction(G,I,Array.from({length:12},(_,i)=>Math.floor(i*G.N/12)));}}
});
test('chapter identities, available prerequisites and source references stay synchronized with the frozen inventory',async()=>{
 const A=(await import('../content/rep/ch06.js')).default,B=(await import('../content/rep/ch06-b.js')).default,S=(await import('../content/rep/syllabus.js')).default,plan=JSON.parse(await readFile(new URL('../docs/wave-6-plan.json',import.meta.url))),items=[...A.items,...B.items],frozen=plan.chapters.find(c=>c.collection==='rep');assert.equal(items.length,12);const {loadAll}=await import('../scripts/lib.mjs'),ids=new Set((await loadAll()).items.map(i=>i.id));for(const p of frozen.items){const i=items.find(i=>i.num===p.num),s=S.chapters.find(c=>c.n===6).items.find(i=>i.num===p.num);for(const key of['num','kind','name'])assert.equal(i[key],p[key]);for(const key of['refs','deps'])assert.deepEqual(i[key],s[key]);for(const d of i.deps)assert.ok(ids.has(d),d);assert.equal(typeof i.viz,'function');assert.ok(i.scope);assert.ok(i.links.source.startsWith('https://'));}
});
