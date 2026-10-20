import test from 'node:test';
import assert from 'node:assert/strict';
import * as W from '../content/music/source-audit-wolf-equal.js';
const near=(a,b,t=1e-12)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const gcd=(a,b)=>b?gcd(b,a%b):a,reduce=(p,q)=>{const d=gcd(p,q);return[p/d,q/d];};
const R=x=>x.ratio.map(BigInt),mul=(a,b)=>reduce(a[0]*b[0],a[1]*b[1]),div=(a,b)=>reduce(a[0]*b[1],a[1]*b[0]);
const chain=['E♭','B♭','F','C','G','D','A','E','B','F♯','C♯','G♯'];
test('all 144 cut/selected states: exact closure, distinct octave notes, fixed C anchor, every actual fifth and crossed third',()=>{
 for(let cut=0;cut<12;cut++)for(let selected=0;selected<12;selected++){
  const m=W.wolfModel(cut,selected);assert.equal(m.nodes.length,12);assert.equal(new Set(m.nodes.map(n=>n.exact)).size,12);assert.deepEqual(m.nodes.map(n=>n.name),chain);assert.equal(m.nodes[3].exact,'1/1');assert.equal(m.nodes[3].hz,W.WE_C4);assert.equal(m.chosen.j,selected);assert.equal(m.wolf.j,cut);
  let prod=[1n,1n];for(let j=0;j<12;j++){
   const f=m.fifths[j],expected=j===cut?[262144n,177147n]:[3n,2n];assert.deepEqual(R(f),expected);prod=mul(prod,R(f));
   const a=m.nodes[j],b=m.nodes[(j+1)%12],actual=div(R(b),R(a));while(actual[0]<actual[1])actual[0]*=2n;while(actual[0]>=2n*actual[1])actual[1]*=2n;assert.deepEqual(reduce(...actual),expected);assert.deepEqual(f.frequencies,[a.hz,a.hz*f.value]);assert.ok(a.hz>=W.WE_C4&&a.hz<2*W.WE_C4);assert.ok(8*f.frequencies[1]<22050);
  }
  assert.deepEqual(prod,[128n,1n]);assert.deepEqual(div([3n,2n],[262144n,177147n]),[531441n,524288n]);
  let crossed=0;for(const t of m.thirds){const edges=Array.from({length:4},(_,k)=>(t.j+k)%12),isCross=edges.includes(cut);assert.equal(t.crosses,isCross);crossed+=isCross;assert.deepEqual(R(t),isCross?[8192n,6561n]:[81n,64n]);const ratio=div(R(t),[5n,4n]);assert.equal(t.errorRatio,ratio.join('/'));near(t.error,isCross?-1.9537207879342:21.5062895967149,3e-13);}assert.equal(crossed,4);assert.equal(m.thirds.filter(t=>!t.crosses).length,8);
 }
 // Equality of the twelve factors is necessary for this particular 700c conclusion.
 assert.notEqual(W.WE_PURE_FIFTH.cents,W.WE_WOLF.cents);near(11*W.WE_PURE_FIFTH.cents+W.WE_WOLF.cents,8400,2e-15);assert.equal(3n**12n>2n**19n,true);
});
test('actual visible segment selection, not invisible angular sectors; all 12 edges, bounded interior, empty center and endpoints',()=>{
 for(let j=0;j<12;j++){const a=W.wolfPoint(j),b=W.wolfPoint((j+1)%12);near(Math.hypot(...a),1,1e-15);for(const t of[.2,.5,.8]){const x=a[0]+t*(b[0]-a[0]),y=a[1]+t*(b[1]-a[1]);assert.equal(W.wolfEdgeHit(x,y),j);const len=Math.hypot(b[0]-a[0],b[1]-a[1]),nx=-(b[1]-a[1])/len,ny=(b[0]-a[0])/len;assert.equal(W.wolfEdgeHit(x+.09*nx,y+.09*ny),j);assert.notEqual(W.wolfEdgeHit(x+.12*nx,y+.12*ny),j);}assert.equal(W.wolfEdgeHit(...a),null);}
 for(const p of[[0,0],[2,0],[0,-2],[NaN,0],[0,Infinity]])assert.equal(W.wolfEdgeHit(...p),null);
});
const refs=[['m2',16,15,1,111.73128526977777],['M2',9,8,2,203.91000173077484],['m3',6,5,3,315.6412870005526],['M3',5,4,4,386.3137138648348],['P4',4,3,5,498.04499913461257],['TT',45,32,6,590.2237155956096],['P5',3,2,7,701.9550008653874],['m6',8,5,8,813.6862861351652],['M6',5,3,9,884.3587129994474],['m7',9,5,10,1017.59628786594],['H7',7,4,10,968.8259064691249],['M7',15,8,11,1088.2687147302222]];
test('entire equal-tempered octave, independent rational references and ideal-string length/nut-distance identities',()=>{
 for(const[id,p,q,n,c]of refs)for(const chord of['major','minor','harmonic7']){const m=W.equalModel(id,chord),r=m.row;assert.equal(r.id,id);assert.deepEqual(r.ratio,[p,q]);assert.equal(r.n,n);near(r.cents,c,5e-15);assert.equal(r.etCents,100*n);near(r.error,100*n-c,2e-13);near(r.justPosition,1-q/p,2e-15);near(r.distanceMm,650*Math.abs(r.etPosition-r.justPosition),1e-15);assert.equal(m.rows.length,12);
  for(const f of m.frets){const expected=Math.pow(Math.pow(2,1/12),f.n);near(f.ratio,expected,3e-15);near(f.remaining*f.ratio,1,2e-15);near(f.position+f.remaining,1,2e-15);assert.equal(f.cents,100*f.n);assert.ok(f.position>=0&&f.position<=.5);}assert.equal(m.frets[0].position,0);assert.equal(m.frets[12].position,.5);
 }
 // Unique factorization: if a reduced p/q satisfies (p/q)^12=2^n, q=1 and the prime-2 valuation forces 12|n.
 for(let n=0;n<=12;n++){let x=1n<<BigInt(n),v=0;while(x%2n===0n){x/=2n;v++;}assert.equal(x,1n);assert.equal(v%12===0,n===0||n===12);}
 assert.notEqual(W.equalModel('m7').row.exact,W.equalModel('H7').row.exact);near(W.equalFret(7).ratio,1.4983070768766815,2e-15);
});
test('all exact coinciding partials by independent common-multiple enumeration; H8 includes every counted harmonic',()=>{
 const scales={major:[4,5,6],minor:[10,12,15],harmonic7:[4,5,6,7]},notes={major:[0,4,7],minor:[0,3,7],harmonic7:[0,4,7,10]};
 for(const[chord,scale]of Object.entries(scales)){const m=W.equalModel('H7',chord),expected=[];for(let i=0;i<scale.length;i++)for(let j=i+1;j<scale.length;j++){const right=new Map(Array.from({length:8},(_,k)=>[scale[j]*(k+1),k+1]));for(let h=1;h<=8;h++)if(right.has(scale[i]*h))expected.push([i,j,h,right.get(scale[i]*h)]);}assert.deepEqual(m.coincidences.map(x=>[x.i,x.j,x.h,x.k]),expected);assert.equal(expected.length,chord==='harmonic7'?7:4);assert.deepEqual(m.semitones,notes[chord]);for(let j=0;j<scale.length;j++){near(m.just[j],W.WE_C4*scale[j]/scale[0],2e-15);near(m.equal[j],W.WE_C4*Math.exp(notes[chord][j]*Math.LN2/12),2e-15);}for(const p of m.coincidences){assert.ok(p.h>=1&&p.h<=8&&p.k>=1&&p.k<=8);near(p.justSeparation,0,5e-13);const d=W.WE_C4*Math.abs(p.h*Math.exp(notes[chord][p.i]*Math.LN2/12)-p.k*Math.exp(notes[chord][p.j]*Math.LN2/12));near(p.equalSeparation,d,3e-12);assert.ok(d>0);}}
});
function sample(fs,j,frames){let sum=0;for(let h=8;h>=1;h--)for(const f of fs)sum+=Math.sin(j*(2*Math.PI/44100)*f*h)/h;const envelope=j<441?j/441:j>=frames-441?(frames-1-j)/441:1;return .12*sum*envelope/(fs.length*(761/280));}
function checkAudio(a,full=false){assert.equal(a.sampleRate,44100);assert.equal(a.harmonics,8);assert.equal(a.amplitudeSum,761/280);assert.equal(a.samples.length,a.frequencies.length*a.frames+(a.frequencies.length-1)*a.silence);const indices=full?Array.from({length:a.frames},(_,j)=>j):[0,1,17,220,440,441,442,1000,1237,Math.floor(a.frames/2),a.frames-443,a.frames-442,a.frames-441,a.frames-220,a.frames-2,a.frames-1];for(let e=0;e<a.frequencies.length;e++){for(const j of indices){const y=a.samples[e*(a.frames+a.silence)+j];assert.ok(Number.isFinite(y));assert.ok(Math.abs(y-sample(a.frequencies[e],j,a.frames))<7e-9,`event ${e} sample ${j}`);assert.ok(Math.abs(y)<=.12000001);}for(let j=0;j<a.silence&&e<a.frequencies.length-1;j++)assert.equal(a.samples[e*(a.frames+a.silence)+a.frames+j],0);}assert.equal(a.samples[0],0);assert.ok(a.samples.at(-1)===0);}
test('all 12 wolf cycles/144 selected edges and every reference/chord/action: actual H8 waveform, register, ramps and gaps',()=>{
 for(let cut=0;cut<12;cut++){const cycle=W.wolfAudio(cut,0,'cycle'),m=W.wolfModel(cut);checkAudio(cycle,cut===0||cut===11);assert.equal(cycle.frequencies.length,12);for(let k=0;k<12;k++)assert.deepEqual(cycle.frequencies[k],m.fifths[(cut+1+k)%12].frequencies);near(cycle.frequencies.at(-1)[1]/cycle.frequencies.at(-1)[0],262144/177147,2e-15);for(let selected=0;selected<12;selected++){const a=W.wolfAudio(cut,selected,'edge');checkAudio(a,cut===0&&(selected===0||selected===11));assert.deepEqual(a.frequencies,[W.wolfModel(cut,selected).chosen.frequencies]);}const a=W.wolfAudio(cut,0,'wolf');checkAudio(a);assert.deepEqual(a.frequencies,[m.wolf.frequencies]);}
 for(const r of W.WE_REFERENCES)for(const chord of['major','minor','harmonic7'])for(const action of['just','equal','alternate']){const m=W.equalModel(r.id,chord),a=W.equalAudio(r.id,chord,action);checkAudio(a,r.id==='M3');assert.deepEqual(a.frequencies,action==='just'?[m.just]:action==='equal'?[m.equal]:[m.just,m.equal,m.just,m.equal]);for(const fs of a.frequencies)for(const f of fs)assert.ok(8*f<22050);}
});
test('reject unsupported/coerced/nonfinite/ragged/sparse/inherited domains before allocating buffers',()=>{
 for(const x of[-1,12,.5,'1',NaN,Infinity,{},null]){assert.throws(()=>W.wolfModel(x));assert.throws(()=>W.wolfModel(0,x));assert.throws(()=>W.wolfPoint(x));if(x!==12)assert.throws(()=>W.equalFret(x));}assert.throws(()=>W.equalFret(13));assert.equal(W.equalFret(12).n,12);
 for(const x of['',null,{},'__proto__','toString']){assert.throws(()=>W.equalModel(x));assert.throws(()=>W.equalModel('M3',x));}for(const action of['',null,{},'__proto__']){assert.throws(()=>W.wolfAudio(0,0,action));assert.throws(()=>W.equalAudio('M3','major',action));}
 const inherited=Array(1);Object.setPrototypeOf(inherited,Object.assign(Object.create(Array.prototype),{0:[440]}));const voice=Array(1);Object.setPrototypeOf(voice,Object.assign(Object.create(Array.prototype),{0:440}));
 for(const fs of[[],[[]],[[0]],[[-440]],[[NaN]],[[Infinity]],[[2756.25]],[[440,440,440,440,440]],Array(1),[Array(1)],[[440,,660]],inherited,[voice],Array(13).fill([440])])assert.throws(()=>W.weRenderAudio(fs,1));
 for(const t of[.049,2.001,NaN,Infinity,'1'])assert.throws(()=>W.weRenderAudio([[440]],t));for(const gap of[-1,.121,NaN,Infinity,'0'])assert.throws(()=>W.weRenderAudio([[440]],1,gap));for(const[t,g]of[[.05,0],[2,.12]])checkAudio(W.weRenderAudio([[1,22050/8-1e-8]],t,g));
});
