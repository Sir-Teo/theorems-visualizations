import test from 'node:test';
import assert from 'node:assert/strict';
import chapter from '../content/ladr/ch03-d.js';

test('dual-range handle keeps its zero-projection fallback inside the annihilator at both ranks',()=>{
 let rank,handle;
 const stage=new Proxy({handle:(x,y,o)=>({x,y,...o})},{get:(t,k)=>k in t?t[k]:()=>stage});
 const scene={handle(p,o){handle={p,...o};return handle}};
 const v={M:{},stage:()=>stage,scene3:()=>scene,select(l,o,x){rank={value:x};return rank},legend(){},render(){},readout(){}};
 chapter.items.find(x=>x.num==='3.130').viz(v);
 // Cross product of the two rank-2 rows gives a null vector; in rank1
 // two independent vectors perpendicular to its row span the null plane.
 const row=[.8,.45,-.35],normal=[.515,-.3925,.6725];
 for(const r of ['2','1']){rank.value=r;for(const p of [[0,0,0],[1e-15,-1e-15,0]]){const q=handle.snap(p);assert.ok(Math.abs(Math.hypot(...q)-.25)<1e-14);assert.ok(Math.abs(q.reduce((s,x,i)=>s+x*normal[i],0))<1e-14);if(r==='1'){const c=[q[1]*row[2]-q[2]*row[1],q[2]*row[0]-q[0]*row[2],q[0]*row[1]-q[1]*row[0]];assert.ok(Math.hypot(...c)<1e-14)}}}
});
