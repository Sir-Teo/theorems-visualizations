import {test} from 'node:test';import assert from 'node:assert/strict';import * as M from '../assets/js/viz/math.js';
import chapter,{projectKernel} from '../content/fa/ch08-a3.js';import{quadraticExterior,quadraticZeroDirections}from'../content/fa/ch08-a2.js';
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<t,`${a} vs ${b}`);
test('dependent conjugate interpolation equations project without NaN and preserve all constraints',()=>{
 const rows=[[1,.3,-.7],[.2,1,.8],[1,.3,-.7],[-.2,-1,-.8]],a=[1.1,-.8,.6],p=projectKernel(rows,a);
 assert.ok(p.every(Number.isFinite));for(const row of rows)near(row.reduce((s,x,i)=>s+x*p[i],0),0);
 near(projectKernel(rows,p).reduce((s,x,i)=>s+(x-p[i])**2,0),0);
});
test('the actual compact-support projection button handles all three operator presets',()=>{
 const item=chapter.items.find(x=>x.num==='8.4');
 for(const key of['d1','osc','hyp']){
  const callbacks=[],handles=[];let button,readout;
  const v={M,select:()=>({value:key}),stage:()=>new Proxy({handle(x,y){const h={x,y,set(x,y){this.x=x;this.y=y;}};handles.push(h);return h;}},{get:(o,k)=>k in o?o[k]:()=>{}}),button:(_,fn)=>button=fn,legend(){},render:fn=>callbacks.push(fn),readout:fn=>readout=fn,fix:(x,n)=>x.toFixed(n),sci:(x,n)=>x.toExponential(n)};
  item.viz(v);button();assert.ok(handles.every(h=>Number.isFinite(h.y)));callbacks.forEach(fn=>fn());
  assert.match(readout(),/constraints are met to tolerance/);assert.doesNotMatch(readout(),/NaN|undefined/);
 }
});
test('the exterior radius certifies the entire continuum, independently of the plotting grid',()=>{
 for(const [a,b,c]of[[1,.5,2],[-2,.3,-1],[.02,.002,.01]])for(const [b1,b2,b0]of[[2.5,-1.5,-3],[-4,4,6],[0,0,0]]){
  const {m,R}=quadraticExterior(a,b,c,b1,b2,b0);assert.ok(m>0);
  for(const scale of[1,1.01,2,10])for(let j=0;j<1000;j++){
   const r=Math.max(1,R)*scale,t=j*Math.PI*2/1000,x=r*Math.cos(t),y=r*Math.sin(t),P=a*x*x+2*b*x*y+c*y*y+b1*x+b2*y+b0;
   assert.ok(Math.abs(P)+1e-8>=m*r*r/2);
  }
 }
 assert.equal(quadraticExterior(1,0,-1,2,3,4).R,null);
});
test('a rotated semidefinite symbol has its tangent characteristic line detected exactly',()=>{
 const theta=.371,a=Math.cos(theta)**2,b=Math.cos(theta)*Math.sin(theta),c=Math.sin(theta)**2;
 const dirs=quadraticZeroDirections(a,b,c);assert.ok(dirs.length);
 for(const t of dirs)near(a*Math.cos(t)**2+2*b*Math.cos(t)*Math.sin(t)+c*Math.sin(t)**2,0);
 assert.deepEqual(quadraticZeroDirections(1,.5,2),[]);
});
test('the actual Gaussian H0 squared norm uses both normalized Fourier and integration measures',()=>{
 const item=chapter.items.find(x=>x.num==='8.8'),callbacks=[];let read;
 const stage=o=>{const t={bounds:{y:o.y},setView(x,y){if(y)this.bounds.y=y;}};return new Proxy(t,{get:(o,k)=>k in o?o[k]:()=>{}});};
 const v={M,stage,select:()=>({value:'gauss'}),slider:()=>({value:0}),legend(){},render:fn=>callbacks.push(fn),readout:fn=>read=fn,fix:(x,n)=>x.toFixed(n)};
 item.viz(v);callbacks.forEach(fn=>fn());const r=read(),value=Number(r.match(/norm is \$([\d.]+)/)[1]);near(value,1/Math.sqrt(2),2e-4);
});
