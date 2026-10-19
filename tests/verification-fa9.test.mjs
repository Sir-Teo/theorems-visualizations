import{test}from'node:test';import assert from'node:assert/strict';
import{renewalCharacteristic}from'../content/fa/ch09-source.shared.js';import{presetOscillationBound}from'../content/fa/ch09.js';
const near=(a,b,e=1e-10)=>assert.ok(Math.abs(a-b)<e,`${a} vs ${b}`);
test('probability convolution multipliers agree with an independent integral and exact atomic sums',()=>{
 for(const t of[0,.3,Math.PI,2*Math.PI,8.4]){
  const z=renewalCharacteristic('uniform',t);let re=0,im=0;const n=20000;
  for(let j=0;j<n;j++){const x=-1+2*(j+.5)/n;re+=Math.cos(t*x)/n;im-=Math.sin(t*x)/n;}near(z[0],re,1e-7);near(z[1],im);
 }
 const [re,im]=renewalCharacteristic('lattice',2*Math.PI);near(re,1);near(im,0);
 const z=renewalCharacteristic('irrational',2*Math.PI);assert.ok(Math.hypot(1-z[0],z[1])>.5);
 // No first moment is needed by the uniqueness theorem: this Cauchy
 // probability also has 1-muHat(t)>0 for every nonzero frequency.
 for(const t of[.1,1,10])assert.ok(1-Math.exp(-Math.abs(t))>0);
});
test('slow-oscillation certificates control the infinite tails rather than a finite horizon',()=>{
 for(const A of[0,.5,3,10,50])for(const delta of[.02,.3,1,4]){
  const bs=presetOscillationBound('sqrt',A,delta),bn=presetOscillationBound('sin',A,delta);
  for(let j=0;j<200;j++){const x=A+.001+j*7.13,y=x+delta*.9;
   assert.ok(Math.abs(Math.sin(2*Math.sqrt(x))-Math.sin(2*Math.sqrt(y)))<=bs+1e-12);
   assert.ok(Math.abs(Math.sin(x)-Math.sin(y))<=bn+1e-12);
  }
 }
 // The chirp may look nearly constant in a short finite prefix, but its
 // arbitrarily late max/min pairs can be closer than any fixed delta.
 const n=100000,x=Math.sqrt(4*(Math.PI/2+2*Math.PI*n)),y=Math.sqrt(4*(3*Math.PI/2+2*Math.PI*n));
 assert.ok(y-x<.02);near(Math.sin(x*x/4)-Math.sin(y*y/4),2,1e-9);
 assert.equal(presetOscillationBound('chirp',50,.02),2);
});
test('the actual Wiener readout refuses to call a small nonzero tone multiplier a limit',async()=>{
 const item=(await import('../content/fa/ch09.js')).default.items.find(x=>x.num==='9.5'),M=await import('../assets/js/viz/math.js');
 let read;const callbacks=[];const stage=()=>new Proxy({}, {get:()=>()=>{}});
 const v={M,stage,select:(_,o,value)=>({value}),slider:()=>({value:3.15,el:{}}),button:()=>({}),legend(){},render:fn=>callbacks.push(fn),readout:fn=>read=fn,fix:(x,n)=>x.toFixed(n)};
 item.viz(v);callbacks.forEach(fn=>fn());assert.match(read(),/persistent oscillation/);assert.doesNotMatch(read(),/exact multiplier vanishes/);
});
test('Euler-Maclaurin zeta agrees with independent positive-series bounds',async()=>{
 const{zeta}=await import('../content/fa/ch09-a2.js');
 for(const s of[2,3,4]){
  let partial=0,correction=0;const N=100000;for(let n=1;n<=N;n++){const y=n**(-s)-correction,t=partial+y;correction=(t-partial)-y;partial=t;}
  const value=zeta([s,0]);near(value[1],0);assert.ok(value[0]>=partial-2e-13);assert.ok(value[0]<=partial+N**(1-s)/(s-1)+2e-13);
 }
 near(zeta([2,0])[0],Math.PI**2/6,1e-13);
});
test('the actual annihilator picture distinguishes tiny coefficients, exact cancellations and a zero packet',async()=>{
 const item=(await import('../content/fa/ch09-a3.js')).default.items[0],M=await import('../assets/js/viz/math.js');
 for(const kind of['tiny','cancel','zero-packet']){
  const handles=[],callbacks=[];let read;const v={M,stage:()=>new Proxy({handle(x,y){const h={x,y,set(x,y){this.x=x;this.y=y;}};handles.push(h);return h;}},{get:(o,k)=>k in o?o[k]:()=>{}}),select:()=>({value:kind==='zero-packet'?'packet':'tones'}),button:()=>({}),legend(){},render:fn=>callbacks.push(fn),readout:fn=>read=fn,fix:(x,n)=>x.toFixed(n)};
  item.viz(v);if(kind==='tiny'){handles[0].x=1.1001;handles[1].y=handles[2].y=0;}else if(kind==='cancel'){handles[0].x=handles[1].x=1;handles[0].y=1;handles[1].y=-1;handles[2].y=0;}else handles[0].y=0;
  callbacks.forEach(fn=>fn());const r=read();assert.doesNotMatch(r,/NaN|undefined/);
  if(kind==='tiny')assert.match(r,/exact annihilation is not certified/);else assert.match(r,/every integrable kernel/);
 }
});
