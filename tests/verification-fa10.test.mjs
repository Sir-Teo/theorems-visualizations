import{test}from'node:test';import assert from'node:assert/strict';
import{boundaryData,jordanExp,norm2}from'../content/fa/ch10-source.shared.js';
const near=(a,b,e=1e-11)=>assert.ok(Math.abs(a-b)<e,`${a} vs ${b}`);
test('inverse blowup is actual matrix inversion, including off-diagonal terms',()=>{
 for(const t of[1,.1,1e-4,1e-6])for(const b of[-3,0,2]){const d=boundaryData(t,b);for(let i=0;i<2;i++)for(let j=0;j<2;j++)near(d.matrix[i].reduce((s,x,k)=>s+x*d.inverse[k][j],0),i===j?1:0);assert.ok(d.norm>=1/t*(1-1e-12));}
});
test('Hermite derivative term matches the independently summed exponential of a repeated-root matrix',()=>{
 for(const mu of[-1,.3,1])for(const k of[0,.2,2]){const d=jordanExp(mu,k);near(norm2(d.series.map((r,i)=>r.map((x,j)=>x-d.hermite[i][j]))),0);near(d.hermite[0][1],Math.exp(mu)*k);}
});
test('the actual roots readout admits square roots at nonzero even winding',async()=>{
 const item=(await import('../content/fa/ch10-a3.js')).default.items.find(x=>x.num==='10.30'),M=await import('../assets/js/viz/math.js');
 const handles=[],callbacks=[];let read,i=0;const v={M,stage:()=>new Proxy({handle(x,y){const h={x,y};handles.push(h);return h;}},{get:(o,k)=>k in o?o[k]:()=>{}}),slider:()=>({value:i++===0?0:1}),legend(){},render:f=>callbacks.push(f),readout:f=>read=f,fix:(x,n)=>x.toFixed(n)};
 item.viz(v);handles[0].x=handles[0].y=0;callbacks.forEach(f=>f());assert.match(read(),/Even winding permits a square root/);assert.doesNotMatch(read(),/no square root/);
});
