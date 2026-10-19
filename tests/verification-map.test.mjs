import test from 'node:test';
import assert from 'node:assert/strict';
import{traceClippedCubic}from'../assets/js/map-path.js';
const segments=p=>{const out=[];let start;traceClippedCubic({moveTo:(x,y)=>{start=[x,y]},bezierCurveTo:(...q)=>{out.push([...start,...q]);start=q.slice(-2)}},p,100,100);return out};
const at=(p,t)=>[0,1].map(j=>(1-t)**3*p[j]+3*(1-t)**2*t*p[j+2]+3*(1-t)*t*t*p[j+4]+t**3*p[j+6]);
test('map clipping keeps exact cubic geometry while bounding long offscreen strokes',()=>{
 const p=[-10000,-10000,-10000+20000/3,10000,-10000+40000/3,-10000,10000,10000],pieces=segments(p);
 assert.ok(pieces.length>0);
 for(const q of pieces){
  const t0=(q[0]+10000)/20000,t1=(q[6]+10000)/20000;
  for(const u of [0,.13,.5,.87,1]){
   const actual=at(q,u),expected=at(p,t0+(t1-t0)*u);
   assert.ok(Math.hypot(actual[0]-expected[0],actual[1]-expected[1])<1e-9);
  }
  assert.ok(Math.max(q[0],q[2],q[4],q[6])-Math.min(q[0],q[2],q[4],q[6])<200);
 }
});
test('map clipping rejects outside curves and preserves an inside curve',()=>{
 assert.deepEqual(segments([200,200,210,230,250,230,280,200]),[]);
 const p=[10,10,30,20,50,80,90,90];assert.deepEqual(segments(p),[p]);
});
test('a backwards edge can enter the view even when both endpoints are outside it',()=>{
 const p=[200,50,-500,50,-500,50,300,50];assert.ok(segments(p).length>0);
});
