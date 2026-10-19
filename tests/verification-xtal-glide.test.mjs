import assert from 'node:assert/strict';
import test from 'node:test';
import ch from '../content/xtal/ch03.js';
import {record,near} from './verification-physics-utils.mjs';
const item=ch.items.find(x=>x.num==='3.6');
test('Actual glide images match independent affine-matrix powers for every requested k',()=>{
 const r=record(item),vectors={m:[0,0],a:[.5,0],c:[0,.5],n:[.5,.5],d:[.25,.25]};r.controls[0].set('glide');
 for(const[g,[dx,dz]]of Object.entries(vectors))for(let k=0;k<=12;k++){
  r.controls[2].set(g);r.controls[3].set(k);r.draw();const points=r.stages[0].calls.filter(c=>c[0]==='scene:dot').map(c=>c[1]);assert.equal(points.length,k+1);
  // Independent homogeneous affine map: x'=x+dx, y'=-y, z'=z+dz.
  const A=[[1,0,0,dx],[0,-1,0,0],[0,0,1,dz],[0,0,0,1]];let q=[.15,.3,.1,1];
  for(let j=0;j<=k;j++){const expected=[1.2*(q[0]-.5),2.16*q[1],1.2*(q[2]-.5)];for(let i=0;i<3;i++)near(points[j][i],expected[i],1e-12);q=A.map(row=>row.reduce((s,x,i)=>s+x*q[i],0));}
  assert.match(r.text(),new RegExp(`After ${k} application`));assert.match(r.text(),new RegExp(`having slid ${(k*Math.hypot(dx,dz)).toFixed(2)}`));
  const arrows=r.stages[0].calls.filter(c=>c[0]==='scene:arrow');assert.equal(arrows.length,k);for(let j=0;j<k;j++){assert.deepEqual(arrows[j][1],points[j]);assert.deepEqual(arrows[j][2],points[j+1]);}
 }
});
test('Switching back from a fitted glide resets the screw reference view',()=>{
 const r=record(item);r.controls[0].set('glide');r.controls[2].set('c');r.controls[3].set(12);r.draw();r.controls[0].set('screw');r.draw();assert.ok(r.stages[0].calls.some(c=>c[0]==='setView'&&JSON.stringify(c.slice(1))==='[[-2,2],[-1.9,1.9]]'));assert.match(r.text(),/rotation by/);assert.match(r.text(),/yes ✓/);
});
