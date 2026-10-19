import assert from 'node:assert/strict';
import test from 'node:test';
import * as M from '../assets/js/viz/math.js';
import { BEA, beaOf, BETA, DN_BETA, DN_LAM, kinMatrix, kinEq, kinAdvance, inhour } from '../content/energy/ch03.shared.js';
import main from '../content/energy/ch03.js';
import nuclear from '../content/energy/ch03-b.js';

const near = (a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} ≉ ${b}`);
function record(item) {
  const noop=()=>{}, stages=[], controls=[], renders=[], readouts=[];
  const v={M, color:()=>'',fix:(x,n)=>x.toFixed(n),fmt:(x,n)=>Number(x.toPrecision(n)).toString(),sci:(x,n)=>x.toExponential(n),
    rng:M.rng,legend:noop,button:noop,readout:fn=>readouts.push(fn),render:fn=>renders.push(fn),
    slider:(label,min,max,value)=>{const c={label,value,el:{},set(x){this.value=x;}};controls.push(c);return c;},
    select:(label,options,value)=>{const c={label,value};controls.push(c);return c;},
    toggle:(label,value)=>{const c={label,value};controls.push(c);return c;},
    stage:()=>{const calls=[],ctx=new Proxy({},{get:()=>noop}); const s=new Proxy({calls,ctx,width:900,height:400,handle:(x,y)=>({x,y,set(a,b){this.x=a;this.y=b;}}),X:x=>x,Y:y=>y,clip:fn=>fn()}, {get:(s,k)=>k in s?s[k]:(...args)=>calls.push([k,...args])});stages.push(s);return s;}};
  item.viz(v); const draw=()=>renders.forEach(fn=>fn());draw();return{stages,controls,draw,text:()=>readouts.map(fn=>fn()).join('\n')};
}
test('NIST enthalpies reproduce actual heating-value readout, including wet wood comparison',()=>{
  const r=record(main.items[0]);assert.match(r.text(),/HHV \$= 55\.51/);assert.match(r.text(),/LHV \$= 50\.03/);
  r.controls[0].value='H2';r.draw();assert.match(r.text(),/141\.79/);assert.match(r.text(),/119\.97/);
  r.controls[0].value='wood';r.controls[1].value=.5;r.draw();assert.doesNotMatch(r.text(),/NaN|Infinity/);
  assert.match(r.text(),/HHV \$= 10\.85/);
});
test('binding-energy table lookup honors actual mass numbers across gaps',()=>{
  for(const[A,,B]of BEA)near(beaOf(A),B/1000,0);
  assert.equal(beaOf(263),0);assert.equal(beaOf(264),7.298);assert.equal(beaOf(269),7.25);
});
test('DOE Table 3 delayed group fractions and half-lives are the actual model inputs',()=>{
  assert.deepEqual(DN_BETA,[.00021,.00142,.00127,.00257,.00075,.00027]);
  [55.7,22.7,6.2,2.3,.61,.23].forEach((t,i)=>near(Math.LN2/DN_LAM[i],t,1e-13));
  near(BETA,.00649,1e-14);
});
test('kinetics preserves critical equilibrium and has a continuous prompt transient',()=>{
  const L=1e-4, y=kinEq(L), critical=M.matVec(kinMatrix(0,L),y);critical.forEach(x=>near(x,0,1e-11));
  const eq=kinAdvance(M,y,0,L,100);eq.forEach((x,i)=>near(x,y[i],1e-7));
  const rho=.3*BETA,dt=1e-8,next=kinAdvance(M,y,rho,L,dt);
  near(next[0],1+rho/L*dt,1e-11);assert.ok(next[0]<1.000001,'no instantaneous factor 1/(1-.3)');
  for(const rho of [-.005,.001,.009]) {
    const w=inhour(M,rho,L), z=[1,...DN_BETA.map((b,i)=>b/(L*(w+DN_LAM[i])))];
    M.matVec(kinMatrix(rho,L),z).forEach((x,i)=>near(x,w*z[i],1e-8));
  }
});
test('actual kinetics views stay finite at prompt-critical extremes and identify truncation',()=>{
  const delayed=record(nuclear.items.find(i=>i.num==='3.7'));
  delayed.controls[0].value=1.3;delayed.controls[1].value=1e-5;delayed.draw();
  assert.doesNotMatch(delayed.text(),/NaN|Infinity/);
  for(const s of delayed.stages)for(const c of s.calls)if(c[0]==='path')for(const p of c[1])assert.ok(p.every(Number.isFinite));
  const point=record(nuclear.items.find(i=>i.num==='3.8'));
  point.controls[1].value=1.4;point.controls[2].value=1e-5;point.draw();
  assert.doesNotMatch(point.text(),/NaN|Infinity/);assert.match(point.text(),/trace stops/);
  point.controls[0].value='scram';point.controls[1].value=.3;point.draw();
  assert.doesNotMatch(point.text(),/NaN|Infinity/);assert.match(point.text(),/power at 60\.00 s/);
});
