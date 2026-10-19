import test from 'node:test';import assert from 'node:assert/strict';
import {synthesisDNF,synthesisMux,evalC,sizeC,shallowMetrics,satWitness,tableauViolations,formulaWalk,squaredReachability,unaryAdviceAccept} from '../content/cplx/circuit-source-audit.shared.js';
import {lupanov,lupanovBest,randomTable,runPrefix,prefixNet,smallTM,runSmallTM,caRun}from'../content/cplx/ch04.shared.js';
const vectors=n=>Array.from({length:2**n},(_,m)=>Array.from({length:n},(_,j)=>m>>(n-1-j)&1));
const truth=(n,C)=>vectors(n).map(x=>{const v=evalC(C,x);return v[C.outs[0]];});
const cnf=(C,a)=>C.every(c=>c.some(l=>!!(a>>(Math.abs(l)-1)&1)===(l>0)));
const sat=(n,C)=>Array.from({length:2**n},(_,a)=>cnf(C,a)).some(Boolean);
test('all256 three-variable functions: independent direct circuit evaluation of DNF and shared multiplexers',()=>{
 for(let mask=0;mask<256;mask++){const f=Array.from({length:8},(_,m)=>mask>>m&1);for(const C of[synthesisDNF(f,3),synthesisMux(f,3)]){assert.deepEqual(truth(3,C),f);assert.ok(C.g.every(g=>['in','and','or','not','c0','c1'].includes(g.t)));}
 const D=synthesisDNF(f,3),ones=f.reduce((a,b)=>a+b,0),neg=[0,1,2].filter(j=>f.some((x,m)=>x&&!(m>>(2-j)&1))).length;assert.equal(sizeC(D),ones?3*ones-1+neg:0);}
});
test('Lupanov block sharing reconstructs every3-bit function for all allowable k/s and finite random larger cases',()=>{
 for(let mask=0;mask<256;mask++){const f=Array.from({length:8},(_,m)=>mask>>m&1);for(let k=1;k<3;k++)for(let s=1;s<=2**k;s++)assert.equal(lupanov(f,3,k,s).ok,true);}
 for(let n=4;n<=11;n++)for(const seed of[0,7,19]){const f=randomTable(seed,n),B=lupanovBest(f,n);assert.equal(B.ok,true);assert.ok(B.k>=1&&B.k<n&&B.s<=2**B.k);assert.equal(lupanov(f,n,B.k,B.s).size,B.size);}
});
test('displayed block-argument parameter costs have O(2^n/n) normalized bounds, not a small-n leading-constant claim',()=>{
 for(const n of[64,128,256,512,1000]){const k=Math.ceil(2*Math.log2(n)),s=Math.floor(n-3*Math.log2(n));assert.ok(s>0&&k<n);const scaledDecoder=n*(2**(-k)+2**(k-n)),scaledGroups=n/s+n*2**(-k),scaledRows=n*2**(k+s-n);assert.ok(scaledDecoder<2&&scaledGroups<2&&scaledRows<=2);}
});
test('shallow circuits use only the declared basis and actual depths/counts, including expanded XOR',()=>{
 for(let n=2;n<=8;n++)for(const fn of['and','or','xor'])for(const style of['chain','tree','flat']){
  const R=shallowMetrics(n,fn,style);if(!R.C){assert.equal(R.depth,3);assert.equal(R.size,n+2**(n-1)+1);continue;}
  const expected=vectors(n).map(x=>fn==='and'?+x.every(Boolean):fn==='or'?+x.some(Boolean):x.reduce((a,b)=>a^b,0));assert.deepEqual(truth(n,R.C),expected);assert.ok(R.C.g.every(g=>g.t==='in'||['and','or','not'].includes(g.t)));
  const factor=fn==='xor'?3:1;assert.equal(R.depth,style==='flat'?1:factor*(style==='chain'?n-1:Math.ceil(Math.log2(n))));assert.equal(R.size,style==='flat'?1:(fn==='xor'?4:1)*(n-1));assert.equal(R.binarySize,(fn==='xor'?4:1)*(n-1));
 }
});
test('parity flat DNF quotes all minterms and input complements, with a real3-layer witness',()=>{
 for(let n=2;n<=8;n++){const f=vectors(n).map(x=>x.reduce((a,b)=>a^b,0)),D=synthesisDNF(f,n),R=shallowMetrics(n,'xor','flat');assert.equal(f.reduce((a,b)=>a+b,0),R.terms);assert.equal(sizeC(D),n+R.terms*n-1);assert.equal(R.size,n+R.terms+1);assert.deepEqual(truth(n,D),f);}
});
test('self-reduction is sound for arbitrary adversarial answer streams and complete for exhaustive truth',()=>{
 const clauses=[[[1],[-1]],[[1,2],[-1,3],[-2,-3]],[[]],[],[[1],[-2],[3]]];
 for(const C of clauses){const actual=sat(3,C);for(let stream=0;stream<16;stream++){let q=0;const R=satWitness(3,C,()=>({ans:!!(stream>>q++&1)}));if(R.accepted)assert.equal(actual,true);if(!actual)assert.equal(R.accepted,false);}
 const R=satWitness(3,C,Q=>({ans:sat(3,Q)}));assert.equal(R.accepted,actual);if(actual){const a=[...R.assignment].reduce((s,[i,b])=>s+b*2**(i-1),0);assert.equal(cnf(C,a),true);}}
});
test('self-reduction handles all64 one/two-literal3-variable CNF subsets with malicious oracles',()=>{
 const terms=[[1],[-1],[2],[-2],[1,2],[-1,-2]];for(let mask=0;mask<64;mask++){const C=terms.filter((_,i)=>mask>>i&1),actual=sat(2,C);for(const answer of[true,false]){const R=satWitness(2,C,()=>({ans:answer}));assert.ok(!R.accepted||actual);}assert.equal(satWitness(2,C,Q=>({ans:sat(2,Q)})).accepted,actual);}
});
test('every single-cell alteration is rejected by full initial/local consistency checks, for all256 CA rules',()=>{
 for(let rule=0;rule<256;rule++){const init=[0,0,1,0],rows=caRun(init,rule,3);assert.deepEqual(tableauViolations(rows,init,rule),[]);for(let t=0;t<rows.length;t++)for(let j=0;j<4;j++){const fake=rows.map(r=>r.slice());fake[t][j]^=1;assert.ok(tableauViolations(fake,init,rule).length>0);}}
});
test('local checks do not require a sampled window to catch a forged final cell',()=>{
 const init=[0,0,1,0,0,0,0,0],rows=caRun(init,110,6);rows[6][7]^=1;assert.deepEqual(tableauViolations(rows,init,110),[[6,7]]);assert.equal(6*8+8,56);
});
test('carry composition is associative as functions on both possible carry inputs',()=>{
 const pairs=[[0,0],[0,1],[1,0],[1,1]],op=([g,p],[h,q])=>[g|(p&h),p&q],f=([g,p],c)=>g|(p&c);
 for(const a of pairs)for(const b of pairs)for(const c of pairs){assert.deepEqual(op(op(a,b),c),op(a,op(b,c)));for(const v of[0,1])assert.equal(f(op(a,b),v),f(a,f(b,v)));}
});
test('all input pairs up to7bits and all3 prefix networks reproduce integer arithmetic, including final carry',()=>{
 const bits=(a,n)=>Array.from({length:n},(_,i)=>a>>i&1);
 for(let n=2;n<=7;n++)for(const kind of['rc','ks','sk'])for(let a=0;a<2**n;a++)for(let b=0;b<2**n;b++){
 const R=runPrefix(bits(a,n),bits(b,n),kind);assert.equal(R.sum.reduce((s,x,i)=>s+x*2**i,0)+R.cout*2**n,a+b);assert.equal(R.net.length,kind==='rc'?n-1:Math.ceil(Math.log2(n)));}
 for(let n=2;n<=64;n++){const ks=prefixNet(n,'ks'),sk=prefixNet(n,'sk');assert.equal(ks.flat().length,Array.from({length:Math.ceil(Math.log2(n))},(_,j)=>n-2**j).reduce((a,b)=>a+b,0));for(const net of[ks,sk])assert.ok(net.flat().every(([i,j])=>j<i&&j>=0&&i<n));}
});
test('branch-path formula evaluation matches independent recursion; explicit bit budget stays linear in depth',()=>{
 for(let d=1;d<=9;d++)for(let seed=0;seed<8;seed++){const N={};for(let k=2**d;k<2**(d+1);k++)N[k]=(Math.imul(k+seed+1,2654435761)>>>10)&1;for(let k=2**d-1;k;k--)N[k]={op:['and','or','xor'][(k+seed)%3]};const rec=k=>typeof N[k]==='number'?N[k]:N[k].op==='and'?rec(2*k)&rec(2*k+1):N[k].op==='or'?rec(2*k)|rec(2*k+1):rec(2*k)^rec(2*k+1),R=formulaWalk(N,d);assert.equal(R.value,rec(1));assert.equal(R.frames.at(-1).k,1);assert.ok(R.maxBits<=2*d+3+2*Math.ceil(Math.log2(d+2)));assert.ok(R.frames.every(f=>f.path.length<=d&&f.left.length===f.path.length));}
});
test('all512 three-node digraphs: repeated squaring equals independent bounded-length path enumeration',()=>{
 const bounded=(A,L)=>A.map((_,s)=>A.map((__,t)=>{let at=new Set([s]);for(let k=0;k<L;k++){const next=new Set(at);for(const i of at)A[i].forEach((x,j)=>{if(x)next.add(j);});at=next;}return+at.has(t);}));
 for(let mask=0;mask<512;mask++){const A=Array.from({length:3},(_,i)=>Array.from({length:3},(_,j)=>mask>>(i*3+j)&1));for(let k=0;k<=2;k++)assert.deepEqual(squaredReachability(A,k),bounded(A,2**k));}
 const A=Array.from({length:8},(_,i)=>Array.from({length:8},(_,j)=>+(j===i+1)));assert.equal(squaredReachability(A,2)[0][7],0);assert.equal(squaredReachability(A,3)[0][7],1);
});
test('unary advice rejects binary nonunary strings and the finite TM run agrees with an independent tape interpreter',()=>{
 for(let n=0;n<=8;n++)for(const x of vectors(n))for(const b of[0,1])assert.equal(unaryAdviceAccept(x.join(''),b),b===1&&x.every(Boolean));
 const ref=(tr,cap)=>{const cells={},out={halted:false,steps:0};let q=0,h=0;while(out.steps<cap){const t=tr[2*q+(cells[h]||0)];cells[h]=t.w;h+=t.mv;out.steps++;if(t.nx===3){out.halted=true;break;}q=t.nx;}return out;};
 for(let i=0;i<256;i++)for(const cap of[1,20,20000])assert.deepEqual(runSmallTM(smallTM(i),cap),ref(smallTM(i),cap));
});
test('independently rebuilt block circuits match raw generated gate counts and direct truth tables',async()=>{
 const{newC,addIn,addG}=await import('../content/cplx/ch04.shared.js');
 function build(f,n,k,s){const C=newC(),X=Array.from({length:n},(_,j)=>addIn(C,'x'+j)),cache=new Map(),dcache=new Map();let count=0;const input=j=>{const key='x'+j;if(!cache.has(key))cache.set(key,X[j]);return cache.get(key);},gate=(t,parents)=>{const a=t==='not'?parents:[...parents].sort((a,b)=>a-b),key=t+':'+a.join(',');if(!cache.has(key)){cache.set(key,addG(C,t,a));count++;}return cache.get(key);},fold=(t,ids)=>{let a=ids;while(a.length>1){const b=[];for(let j=0;j<a.length;j+=2)b.push(j+1<a.length?gate(t,[a[j],a[j+1]]):a[j]);a=b;}return a[0];},decode=(lo,hi,v)=>{const key=[lo,hi,v].join(',');if(dcache.has(key))return dcache.get(key);let out;if(hi-lo===1)out=v?input(lo):gate('not',[input(lo)]);else{const m=(lo+hi)>>1,low=hi-m;out=gate('and',[decode(lo,m,v>>low),decode(m,hi,v%(2**low))]);}dcache.set(key,out);return out;};
 const R=2**k,W=2**(n-k),terms=[];for(let base=0;base<R;base+=s){const height=Math.min(s,R-base),groups=new Map();for(let y=0;y<W;y++){const pat=Array.from({length:height},(_,j)=>f[(base+j)*W+y]).join('');if(!pat.includes('1'))continue;if(!groups.has(pat))groups.set(pat,[]);groups.get(pat).push(y);}const fun=[...groups].map(([pat,cols])=>[pat,fold('or',cols.map(y=>decode(k,n,y)))]);for(let j=0;j<height;j++){const use=fun.filter(([pat])=>pat[j]==='1').map(q=>q[1]);if(use.length)terms.push(gate('and',[decode(0,k,base+j),fold('or',use)]));}}C.outs=[terms.length?fold('or',terms):addG(C,'c0',[])];return{C,count};}
 for(let n=2;n<=6;n++)for(let k=1;k<n;k++)for(const s of[1,2,3,4,6])for(const seed of[1,7]){const f=Array.from(randomTable(seed,n)),B=build(f,n,k,s),R=lupanov(f,n,k,s);assert.equal(R.size,B.count);assert.deepEqual(truth(n,B.C),f);}
});
