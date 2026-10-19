import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as M from '../assets/js/viz/math.js';
import {FIFTH,SCOMMA,J5,cents} from '../content/music/ch07.shared.js';
import {fromMask,primeForm,classes,fixCounts,icv,ifun,fcoef,complement,zPairs} from '../content/music/ch08.shared.js';
import tuning from '../content/music/ch07-b.js';
import scales from '../content/music/ch08.js';
import lattice from '../content/music/ch07-c.js';
import rows from '../content/music/ch08-c.js';
const close=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<t,`${a} versus ${b}`);
function run(item,initial={}){
  const stages=[],controls=new Map(),buttons=new Map();let draw,read;
  const ctl=(label,value)=>{const q={value:initial[label]??value,set(x){this.value=x},el:{}};controls.set(label,q);return q};
  const v={M,rng:M.rng,fix:(x,n=3)=>Number(x).toFixed(n),fmt:(x,n=3)=>Number(x).toFixed(n),invalidate(){},sound(){return{stop(){},samples(){}}},soundButton(){},legend(){},button(n,f){buttons.set(n,f)},slider(n,a,b,x){return ctl(n,x)},select(n,o,x){return ctl(n,x)},toggle(n,x){return ctl(n,x)},input(n,x){return ctl(n,x)},render(f){draw=f},readout(f){read=f},stage(options){const calls=[];const s=new Proxy({calls,options,onClick(){},onDrag(){},handle(x,y){return{x,y,set(a,b){this.x=a;this.y=b}}}},{get(t,k){return k in t?t[k]:(...a)=>{calls.push([k,...a]);if(k==='clip')a[0]();return s}}});stages.push(s);return s}};
  item.viz(v);const render=()=>{for(const s of stages)s.calls.length=0;draw();return read?.()};render();return{stages,controls,buttons,render};
}
test('Actual meantone 12-TET preset makes all twelve fifths exactly 700 cents, beyond approximate eleventh-comma tuning',()=>{
  const r=run(tuning.items.find(i=>i.num==='7.7'));r.buttons.get('12-TET (≈1/11)')();r.render();const a=r.controls.get('fraction of the syntonic comma taken from each fifth').value;close(FIFTH-a*SCOMMA,700,1e-12);assert.ok(Math.abs(a-1/11)>1e-6);
  const E=r.stages[0].calls.filter(q=>q[0]==='rect');close(E[0][4],E[3][4],1e-11);
});
test('53-TET small-interval accuracy is finite-list accuracy, not a uniform bound for the five-limit lattice',()=>{
  const mapped=r=>Math.round(53*Math.log2(r))*1200/53-cents(r);
  assert.ok(Math.max(...J5.map(([p,q])=>Math.abs(mapped(p/q))))<1.55);
  assert.ok(Math.abs(mapped(27/25))>2.5);
});
test('Myhill property alone does not imply maximal evenness',()=>{
  const S=[0,1,2,3,4];for(let k=1;k<5;k++){const d=S.map((x,j)=>S[(j+k)%5]+(j+k>=5?12:0)-x);assert.equal(new Set(d).size,2)}
  assert.notDeepEqual(S,Array.from({length:5},(_,j)=>Math.floor(12*j/5)));
});
test('Actual rational-generator gap panel removes repeated pitches before counting positive gaps',()=>{
  const r=run(scales.items.find(i=>i.num==='8.6')),g=r.controls.get('generator (cents)'),n=r.controls.get('number of notes $n$');
  g.value=700;for(const N of[12,13,24,60]){n.value=N;assert.match(r.render(),/1 distinct step sizes: 100\.000/)}
  g.value=0;n.value=60;assert.match(r.render(),/1 distinct step sizes: 1200\.000/);
});
test('Actual periodicity blocks have determinant-many points and preset pitch maps cover each equal division once',()=>{
  const r=run(lattice.items.find(i=>i.num==='7.15'));r.controls.get('temper the unison vectors out').value=true;
  for(const n of[12,19,31,41,53]){r.controls.get('tempering').value=n;const text=r.render();assert.match(text,new RegExp(`block holds ${n} lattice points =`));const points=r.stages[2].calls.filter(q=>q[0]==='dot');assert.equal(points.length,n);for(let i=0;i<n;i++)for(let j=0;j<i;j++)assert.ok(Math.hypot(points[i][1]-points[j][1],points[i][2]-points[j][2])>.01)}
});
const canon=S=>{
  const candidates=[];for(const inv of[1,-1])for(let n=0;n<12;n++)candidates.push(S.map(x=>((inv*x+n)%12+12)%12).sort((a,b)=>a-b));
  const order=a=>a.length?[a.at(-1),...a.slice(1,-1)]:[];
  candidates.sort((a,b)=>{const A=order(a),B=order(b);for(let j=0;j<A.length;j++)if(A[j]!==B[j])return A[j]-B[j];return 0});return candidates[0];
};
test('All 4096 prime forms agree with an independent full-orbit canonical search',()=>{
  for(let m=0;m<4096;m++){const S=fromMask(m);assert.deepEqual(primeForm(S),canon(S))}
});
function cyclePolynomial(mapping){const visited=new Set();let p=[1];for(let i=0;i<12;i++)if(!visited.has(i)){let j=i,len=0;do{visited.add(j);len++;j=mapping(j)}while(j!==i);const q=new Array(p.length+len).fill(0);p.forEach((x,k)=>{q[k]+=x;q[k+len]+=x});p=q}return p}
test('Burnside subset counts agree with independent permutation cycle polynomials and orbit enumeration',()=>{
  const pol=[];for(let n=0;n<12;n++)pol.push(cyclePolynomial(j=>(j+n)%12));for(let n=0;n<12;n++)pol.push(cyclePolynomial(j=>(n-j+12)%12));
  const C=classes(),wantT=[1,1,6,19,43,66,80,66,43,19,6,1,1],wantTI=[1,1,6,12,29,38,50,38,29,12,6,1,1];
  for(let k=0;k<=12;k++){const counts=pol.map(p=>p[k]||0);assert.deepEqual(fixCounts(k),counts);assert.equal(counts.slice(0,12).reduce((s,x)=>s+x,0)/12,wantT[k]);assert.equal(counts.reduce((s,x)=>s+x,0)/24,wantTI[k]);assert.equal(C.ti.filter(c=>fromMask(c[0]).length===k).length,wantTI[k])}
});
test('All subsets satisfy complement interval shifts and inverse Fourier reconstruction of the interval function',()=>{
  for(let m=0;m<4096;m++){
    const S=fromMask(m),T=complement(S),v=icv(S),w=icv(T),I=ifun(S),F=Array.from({length:12},(_,k)=>fcoef(S,k)),sq=F.map(([a,b])=>a*a+b*b);
    for(let k=0;k<6;k++)assert.equal(w[k]-v[k],k===5?6-S.length:12-2*S.length);
    for(let d=0;d<12;d++)close(sq.reduce((s,x,k)=>s+x*Math.cos(2*Math.PI*k*d/12),0)/12,I[d],1e-10);
    for(let k=1;k<12;k++){const G=fcoef(T,k);close(F[k][0]+G[0],0,1e-10);close(F[k][1]+G[1],0,1e-10)}
  }
});
test('Enumerated Z pairs have the stated distribution and every hexachord pair is complementary up to T/I',()=>{
  const Z=zPairs(),C=classes(),count={};for(const[A,B]of Z){const S=fromMask(A[0]),T=fromMask(B[0]);assert.deepEqual(icv(S),icv(T));count[S.length]=(count[S.length]||0)+1;if(S.length===6)assert.equal(C.tiOf[4095^A[0]],C.tiOf[B[0]])}assert.deepEqual(count,{4:1,5:3,6:15,7:3,8:1});
});
test('Actual change-ringing presets return to rounds with expected distinct-row counts',()=>{
  const r=run(rows.items.find(i=>i.num==='8.21'));
  for(const[n,pn,want]of[[4,'x14x14x14x14',8],[4,'x14x14x14x12',24],[5,'5.1.5.1.5.1.5.1.5.1',10],[6,'x16x16x16x16x16x16',12]]){
    r.controls.get('bells').value=n;r.controls.get('place notation').value=pn;const t=r.render();assert.match(t,new RegExp(`rounds returns after ${want} changes`));assert.match(t,new RegExp(`distinct rows rung: ${want} of`));
  }
});

test('Change ringing explains invalid bell/notation combinations and recovers with valid notation',()=>{
  const r=run(rows.items.find(i=>i.num==='8.21'));
  r.controls.get('bells').value=5;
  assert.match(r.render(),/place 5 with no partner/);
  assert.ok(r.stages[0].calls.some(q=>q[0]==='text'&&q[1]==='No rows: invalid place notation'));
  assert.equal(r.stages[0].calls.filter(q=>q[0]==='path').length,0);
  r.controls.get('place notation').value='5.1.5.1.5.1.5.1.5.1';
  assert.match(r.render(),/rounds returns after 10 changes/);
  assert.equal(r.stages[0].calls.filter(q=>q[0]==='path').length,5);
});

test('Actual adaptive-tuning variant respects held common tones and anchored roots',()=>{
  for(const mode of['follow','anchor']){
    const r=run(lattice.items.find(i=>i.num==='7.16'),{'rule':mode,'passes':1,'pull toward 12-TET':0});
    const calls=r.stages[0].calls;if(mode==='follow')for(const q of calls.filter(q=>q[0]==='line'))close(q[2],q[4],1e-12);
    if(mode==='anchor')for(const q of calls.filter(q=>q[0]==='dot'&&q.at(-1).color==='gold'))close(q[2],0,1e-12);
  }
});

test('The actual periodicity-block panel rejects dependent free-choice vectors',()=>{
 const r=run(lattice.items.find(i=>i.num==='7.15'),{'tempering':0,'u: fifths':0,'u: thirds':0,'v: fifths':1,'v: thirds':1});assert.match(r.render(),/do not define a finite periodicity block/);
});
