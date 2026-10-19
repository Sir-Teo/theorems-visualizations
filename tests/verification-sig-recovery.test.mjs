import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as M from '../assets/js/viz/math.js';
import chapter from '../content/sig/ch02.js';
import {sample,NG,iOf,tOf,pts,SYS} from '../content/sig/ch02.shared.js';
import {recoveryPlot} from '../content/sig/recovery-plot.shared.js';
const zeroIndices=Array.from({length:20},(_,k)=>iOf(-4.75+.5*k));

test('The actual uniform grid puts every carrier-zero catastrophe on the omitted parity of stride-two plotting',()=>{
 const x=sample(t=>.7+.1*Math.sin(t));
 // Independent observation/inversion calculation with a known constant output perturbation.
 const recovered=Float64Array.from(x,(v,i)=>(v*Math.cos(2*Math.PI*tOf(i))+.001)/Math.cos(2*Math.PI*tOf(i)));
 const plot=recoveryPlot(recovered);
 assert.equal(plot.points.length,1041);
 for(const i of zeroIndices){
  assert.equal(i%2,1);assert.ok(Math.abs(Math.cos(2*Math.PI*tOf(i)))<1e-12);
  const point=plot.points[i-iOf(-5.2)];assert.deepEqual(point,[tOf(i),recovered[i]]);assert.ok(Math.abs(point[1])>1e9);
  assert.ok([...plot.above,...plot.below].some(p=>p.index===i));
 }
 const old=pts(recovered,-5.2,5.2,2);
 assert.ok(old.every(p=>!zeroIndices.includes(iOf(p[0]))));
 assert.ok(Math.max(...old.map(([t,v])=>Math.abs(v-x[iOf(t)])))<.02,'the old decimated curve conceals the enormous inverse error');
 assert.ok(Math.max(...plot.points.map(p=>Math.abs(p[1]-x[iOf(p[0])])) )>1e12);
});

test('Off-scale finite samples retain their magnitude; nonfinite samples break the curve and retain their locations',()=>{
 const y=new Float64Array(NG+1);y[iOf(.25)]=1e300;y[iOf(.75)]=-1e300;y[iOf(1.25)]=Infinity;y[iOf(1.75)]=-Infinity;y[iOf(2.25)]=NaN;
 const plot=recoveryPlot(y);assert.deepEqual(plot.above.map(p=>p.value),[1e300]);assert.deepEqual(plot.below.map(p=>p.value),[-1e300]);
 assert.equal(plot.points[iOf(.25)-iOf(-5.2)][1],1e300);
 assert.deepEqual(plot.nonFinite.map(p=>p.t),[1.25,1.75,2.25]);
 for(const p of plot.nonFinite)assert.equal(plot.points[p.index-iOf(-5.2)],null);
});

function replay(system,noise){
 const stages=[],control=value=>({value,el:{},set(x){this.value=x;}});let render,read;
 const v={M,select:(label,opts,value)=>control(label==='system'?system:value),toggle:()=>control(noise),legend(){},fix:(x,n)=>x.toFixed(n),render:f=>render=f,readout:f=>read=f};
 v.stage=options=>{let s;const calls=[];s=new Proxy({calls,options,handle(x,y){return{x,y,set(a,b){this.x=a;this.y=b;}}},clip(f){f();return s;}},{get:(o,k)=>k in o?o[k]:(...a)=>{calls.push([k,...a]);return s;}});stages.push(s);return s;};
 chapter.items.find(x=>x.num==='2.5').viz(v);render();return{stages,readout:read()};
}
test('The actual visualization submits every recovered sample and a boundary arrow for every off-scale sample',()=>{
 const r=replay('mod',true),path=r.stages[0].calls.find(c=>c[0]==='path'&&c[2]?.color==='green')[1];
 assert.equal(path.length,1041);assert.ok(Math.max(...path.filter(Boolean).map(p=>Math.abs(p[1])))>1e12);
 for(const i of zeroIndices)assert.ok(path.some(p=>p&&iOf(p[0])===i));
 const clipped=path.filter(p=>p&&(p[1]>2.1||p[1]<-1.9));
 const arrows=r.stages[0].calls.filter(c=>c[0]==='arrow');assert.equal(arrows.length,clipped.length);assert.ok(arrows.length>=20);
 assert.match(r.readout,/off scale \(green arrows\)/);assert.match(r.readout,/undefined.*floating-point roundoff/);
});
test('Noiseless modulation and ordinary invertible examples preserve their recovered traces without spurious markers',()=>{
 for(const [system,noise] of [['mod',false],['gain',false],['gain',true],['cube',false],['delay',false]]){
  const r=replay(system,noise),paths=r.stages[0].calls.filter(c=>c[0]==='path');const input=paths.find(c=>c[2]?.color==='accent')[1],recovered=paths.find(c=>c[2]?.color==='green')[1];
  assert.equal(recovered.length,input.length);assert.equal(r.stages[0].calls.filter(c=>c[0]==='arrow').length,0);
  const error=Math.max(...recovered.map((p,i)=>Math.abs(p[1]-input[i][1])));assert.ok(error<(noise?.00051:1e-10));
 }
 assert.match(replay('mod',false).readout,/invertible on continuous inputs/);
});
