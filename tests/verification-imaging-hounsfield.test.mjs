import test from 'node:test';
import assert from 'node:assert/strict';
import {HOUNSFIELD_HEAD_AUDIT as HEAD,paintedHuAudit as hu,paintedProjectionAudit as projection,paintedSinogramAudit as sinogram,headClotIncrementAudit as increment} from '../content/imaging/source-audit-hounsfield.shared.js';
import {makeScan,fbp,mean} from '../content/imaging/ch03.shared.js';
const near=(a,b,tol=1e-11)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('last painted region supplies the stated HU for nested and overlapping tissue',()=>{
  assert.equal(hu(2,2),-1000);assert.equal(hu(.38,-.2),65);
  // Here the clot overwrites a ventricular ellipse; the old centre-subtracted
  // additive approximation assigned 49 HU instead of the declared 65 HU.
  assert.equal(hu(.264,-.208),65);
  assert.equal(hu(.264,-.208,HEAD.filter(q=>q[0]!==65)),10);
  const crossing=[[40,.9,.7,0,0,0],[26,.6,.4,0,0,0],[65,.2,.2,.55,0,0]];
  assert.equal(hu(.7,0,crossing),65);
  assert.equal(hu(.7,0,crossing.slice(0,-1)),40);
});
test('single-ellipse exact projection agrees with a geometric central chord and tangency',()=>{
  const E=[[200,.8,.4,.1,-.2,30]],phi=Math.PI/6;
  for(const theta of [0,.4,1,2]){
    const s=.1*Math.cos(theta)-.2*Math.sin(theta),r=theta-phi,half=.8*.4/Math.hypot(.8*Math.cos(r),.4*Math.sin(r));
    near(projection(theta,s,E),1.2*2*half);
  }
  near(projection(0,2,E),0);
  // Bone is tangent at x=.9; its zero-length contact contributes no bone.
  near(projection(0,.9),1.04*2*.78*Math.sqrt(1-(.9/.95)**2));
});
test('all overlapping regions agree with independent dense midpoint ray integration',()=>{
  const layers=HEAD.map(([H,a,b,x,y,phi])=>({H,a,b,x,y,c:Math.cos(phi*Math.PI/180),s:Math.sin(phi*Math.PI/180)}));
  const density=(x,y)=>{for(let i=layers.length-1;i>=0;i--){const q=layers[i],X=x-q.x,Y=y-q.y;if(((q.c*X+q.s*Y)/q.a)**2+((-q.s*X+q.c*Y)/q.b)**2<=1)return 1+q.H/1000;}return 0;};
  const n=60000,dt=4/n;
  for(const theta of [0,.3,1.2,2.5])for(const offset of [-.8,-.3,0,.3,.5,.8]){
    const c=Math.cos(theta),s=Math.sin(theta);let sum=0;
    for(let i=0;i<n;i++){const t=-2+(i+.5)*dt;sum+=density(offset*c-t*s,offset*s+t*c)*dt;}
    near(projection(theta,offset),sum,4e-4);
  }
});
test('clot curve is the replacement increment rather than a full isolated material chord',()=>{
  const noClot=HEAD.filter(q=>q[0]!==65);
  for(const s of [.27,.3,.38,.45,.5])near(increment(0,s),projection(0,s)-projection(0,s,noClot));
  const isolated=projection(0,.38,[HEAD.find(q=>q[0]===65)]);
  assert.ok(increment(0,.38)>0&&increment(0,.38)<isolated/20);
});
test('projection symmetry and scan bins remain consistent',()=>{
  for(const th of [0,.3,1,2])for(const s of [-.9,-.4,0,.4,.9])near(projection(th,s),projection(th+Math.PI,-s),1e-10);
  const sc=makeScan(12,32,1),p=sinogram(sc);
  for(let k=0;k<12;k++)for(let j=0;j<32;j++)near(p[k*32+j],projection(sc.th[k],sc.sOf(j)));
  assert.ok([...p].every(x=>x>=0&&Number.isFinite(x)));
});
test('noise-free full-view FBP recovers the selected tissue means within finite-grid error',()=>{
  const W=80,sc=makeScan(180,160,1),img=fbp(sinogram(sc),sc,W,W,'shepp').map(x=>1000*(x-1));
  const roi=(cx,cy)=>{const a=[];for(let j=0;j<W;j++)for(let i=0;i<W;i++)if(Math.hypot(-1+(i+.5)*2/W-cx,1-(j+.5)*2/W-cy)<.05)a.push(img[j*W+i]);return mean(a);};
  assert.ok(Math.abs(roi(0,-.3)-26)<12);
  assert.ok(Math.abs(roi(.38,-.2)-65)<12);
  assert.ok(roi(.38,-.2)>roi(0,-.3)+20);
});
