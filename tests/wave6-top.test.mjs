import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadAll} from '../scripts/lib.mjs';
import * as H from '../content/top/ch06.shared.js';
const near=(a,b,tol=4e-13)=>assert.ok(Math.abs(a-b)<=tol,`${a} differs from ${b}`);
const samples=Array.from({length:121},(_,i)=>-2+i/30);

test('Urysohn interval separator has exact endpoints and strict dyadic closure nesting',()=>{
  for(const gap of[.15,.8,1.5,.37123456789]){
    near(H.ramp(-gap/2,gap),0);near(H.ramp(gap/2,gap),1);
    for(let n=1;n<=3;n++)for(let j=1;j<2**n;j++){
      const r=j/2**n,x=gap*(r-.5);near(H.ramp(x,gap),r);
      assert.ok(gap*((j+1)/2**n-.5)>x);
    }
    for(let i=0;i<samples.length-1;i++)assert.ok(H.ramp(samples[i],gap)<=H.ramp(samples[i+1],gap));
  }
});
test('Tietze corrections satisfy the residual and global magnitude bounds, including empty threshold sets',()=>{
  for(const residual of[[.1,.2,.1,.2],[-.1,-.2,-.1,-.2],[0,0,0,0],[1,-1,1,-1],[.8,.5,.4,.7],[-.9,-.7,-.4,-.5]]){
    const c=H.correction([-1,-.3,.4,1],residual,1);
    for(const x of samples)assert.ok(Math.abs(c.value(x))<=1/3+1e-14);
    for(let i=0;i<4;i++)assert.ok(Math.abs(residual[i]-c.value([-1,-.3,.4,1][i]))<=2/3+1e-14);
  }
  for(let j=0;j<=80;j++)for(let n=0;n<=10;n++){
    const T=H.tietze(-1+j/40,n);
    T.nodes.forEach((x,i)=>{near(T.values[i]-T.value(x),T.residual[i]);assert.ok(Math.abs(T.residual[i])<=T.bound+1e-13);});
    for(const x of samples)assert.ok(Math.abs(T.value(x))<=1-T.bound+1e-13);
    for(let k=0;k<T.terms.length;k++)for(const x of samples)assert.ok(Math.abs(T.terms[k].value(x))<=(1/3)*(2/3)**k+1e-14);
  }
});
test('finite partitions cover the whole interval and omission creates a genuine gap',()=>{
  for(const r of[.3,.36,.45,.37123456789])for(let j=0;j<=400;j++){
    const x=j/400,P=H.finitePartition(x,r);assert.ok(P.total>0);near(H.sum(P.phi),1);
    for(let k=0;k<3;k++)if(P.phi[k]>0)assert.ok(Math.abs(x-k/2)<r);
  }
  for(const r of[.3,.36,.45]){assert.equal(H.finitePartition(.5,r,true).total,0);near(H.sum(H.finitePartition(0,r,true).phi),1);}
});
test('circle coordinate metric matches trigonometric coordinates and its finite tails',()=>{
  for(let k=1;k<=120;k++){
    const a=Math.PI*k/121,b=-a,z=H.coordinateMetric(a,b,2);
    near(z.head,Math.abs(Math.sin(a))/4);near(H.coordinateMetric(a,b,1).head,0);
    assert.ok(z.head>0);
    const total=H.coordinateMetric(a,b,100).head;
    for(let n=1;n<=8;n++){const prefix=H.coordinateMetric(a,b,n);assert.ok(total>=prefix.head-1e-14);assert.ok(total-prefix.head<=prefix.tail+1e-14);}
  }
});
test('partition-coordinate circle embedding recovers each point from an active chart',()=>{
  for(let j=0;j<=800;j++){
    const a=2*Math.PI*j/800,E=H.circleEmbedding(a);near(H.sum(E.phi),1);
    const i=E.phi.findIndex(p=>p>.1),recovered=i*Math.PI/2+E.coordinates[2*i+1]/E.coordinates[2*i];
    near(Math.cos(recovered),Math.cos(a));near(Math.sin(recovered),Math.sin(a));
    for(let k=0;k<4;k++)if(E.phi[k]>1e-14)assert.ok(Math.abs(E.deltas[k])<Math.PI/2+1e-14);
  }
  for(const d of[.2,.5,.9]){const a=Math.PI-d,b=Math.PI+d;assert.ok(H.dist(H.circleEmbedding(a).coordinates,H.circleEmbedding(b).coordinates)>.1);near(H.dist(H.circleEmbedding(a,true).coordinates,H.circleEmbedding(b,true).coordinates),0);}
});
test('finite choice-cylinder counts agree with an independent Cartesian-product enumeration',()=>{
  const tuples=[];for(let a=0;a<=2;a++)for(let b=0;b<=3;b++)for(let c=0;c<=2;c++)tuples.push([a,b,c]);
  const keys=new Set(Array.from({length:36},(_,i)=>H.choiceTuple(i).join(',')));
  assert.equal(keys.size,36);for(const tuple of tuples)assert.ok(keys.has(tuple.join(',')));
  for(let k=0;k<=3;k++)assert.equal(H.choiceSurvivors(k),tuples.filter(t=>t.slice(0,k).every(x=>x>0)).length);
  assert.deepEqual([0,1,2,3].map(H.choiceSurvivors),[36,24,18,12]);
});
test('binary witnesses have exact integer prefixes with the intended digits at every chosen index',()=>{
  for(const kind of['consecutive','even','squares'])for(let count=2;count<=10;count++){
    const W=H.digitWitness(kind,count),L=W.bits.length;
    assert.equal(W.denominator,1n<<BigInt(L));assert.ok(W.numerator>0n&&W.numerator<W.denominator);
    for(let k=1;k<=count;k++){
      const pos=kind==='squares'?k*k:kind==='even'?2*k:k;
      assert.equal(Number((W.numerator>>BigInt(L-pos))&1n),k%2);
    }
    near(Number(W.numerator)/Number(W.denominator),W.prefix);near(W.tail,1/Number(W.denominator));
  }
});
test('Hilbert and Cantor sequence distances agree with direct long coordinate sums',()=>{
  for(const kind of['Hilbert','Cantor'])for(let m=0;m<=30;m++){
    let d=0;for(let j=1;j<=1100;j++)d+=2**-j*(j<=m?(kind==='Cantor'?0:1/(m+1)):1);
    const C=H.cubeSequence(kind,m);near(C.distance,d);near(C.tail,1/4096);
    if(m)assert.ok(C.distance<H.cubeSequence(kind,m-1).distance);
  }
});
test('integer refinement counts match exact binary-rational open-boundary comparisons',()=>{
  const view=new DataView(new ArrayBuffer(8));
  const rational=x=>{view.setFloat64(0,x);const bits=view.getBigUint64(0),e=Number((bits>>52n)&2047n),m=(bits&((1n<<52n)-1n))|(e?1n<<52n:0n);return[(bits>>63n)?-m:m,e?e-1075:-1074];};
  const sign=xs=>{const terms=xs.map(rational),e=Math.min(...terms.map(t=>t[1])),s=terms.reduce((a,[m,k])=>a+(m<<BigInt(k-e)),0n);return s<0n?-1:s>0n?1:0;};
  for(let j=-200;j<=200;j++)for(const eps of[.03,.1,.15,.3,.4,Number.MIN_VALUE]){
    const x=j/100,brute=[];for(let k=-5;k<=5;k++)if(sign([k,-x,-.6,-eps])<0&&sign([k,-x,.6,eps])>0)brute.push(k);
    assert.deepEqual(H.localCount(x,eps),brute,JSON.stringify({x,eps}));
  }
  assert.deepEqual(H.localCount(0,.4),[0]);assert.deepEqual(H.localCount(-1.1,.3),[-2,-1]);
  for(let k=-40;k<=40;k++){assert.ok(k-.6>-(Math.abs(k)+1));assert.ok(k+.6<Math.abs(k)+1);}
});
test('integer tents reproduce constants and their square interpolation error is exact',()=>{
  for(let j=-1200;j<=1200;j++){
    const x=j/317,P=H.linePartition(x);let constant=0,square=0;
    for(let k=-20;k<=20;k++){const w=Math.max(0,1-Math.abs(x-k));constant+=w;square+=w*k*k;}
    near(constant,1);near(P.square,square);near(P.square-x*x,P.error);near(H.sum(P.weights),1);
  }
});
test('dyadic basis witnesses satisfy strict containment and a scale bound without sampling',()=>{
  for(let j=-70;j<=70;j++)for(const eps of[.04,.1,.2,.45,.37123456789]){
    const x=j/100,B=H.basisWitness(x,eps);assert.ok(Math.abs(x-B.center)<B.radius);
    assert.ok(B.center-B.radius>x-eps);assert.ok(B.center+B.radius<x+eps);assert.ok(B.slack>0);
    assert.ok(B.n<=6);
  }
});
test('patched line coordinates recover the original point and their distance satisfies triangle inequalities',()=>{
  for(const x of samples){const F=H.patchCoordinates(x);near(F[0]+F[2],1);if(F[0]>.1)near(F[1]/F[0],x);else near(Math.tan(F[3]/F[2]),x);}
  for(let i=0;i<samples.length;i+=4)for(let j=0;j<samples.length;j+=7)for(let k=0;k<samples.length;k+=17){const a=H.patchCoordinates(samples[i]),b=H.patchCoordinates(samples[j]),c=H.patchCoordinates(samples[k]);assert.ok(H.dist(a,c)<=H.dist(a,b)+H.dist(b,c)+1e-12);if(i!==j)assert.ok(H.dist(a,b)>0);}
});
test('TOP6 preserves frozen identities and uses only written prerequisites with synchronized metadata',async()=>{
  const plan=JSON.parse(await readFile(new URL('../docs/wave-6-plan.json',import.meta.url),'utf8'));
  const {items}=await loadAll(),chapter=items.filter(x=>x.col==='top'&&x.chapter===6),all=new Set(items.map(x=>x.id));
  const S=(await import('../content/top/syllabus.js')).default.chapters.find(x=>x.n===6);
  assert.equal(chapter.length,17);
  for(const it of chapter){const s=S.items.find(x=>x.num===it.num);assert.equal(it.name,s.name);assert.equal(it.kind,s.kind);assert.deepEqual(it.deps,s.deps);assert.deepEqual(it.refs,s.refs);for(const dep of it.deps)assert.ok(all.has(dep),dep);assert.equal(typeof it.viz,'function');}
  const frozen=plan.chapters.find(x=>x.col==='top'||x.collection==='top');assert.ok(frozen);
  const frozenItems=frozen.items||frozen.newItems;assert.ok(frozenItems);
  for(const it of chapter){const entry=frozenItems.find(x=>x.num===it.num||x.id===it.id);assert.ok(entry,it.id);if(entry.name)assert.equal(entry.name,it.name);if(entry.kind)assert.equal(entry.kind,it.kind);}
});
