import test from 'node:test';import assert from 'node:assert/strict';
import {WHITCOMB_BODIES,bodyRadius,bodyVolume,whitcombStation} from '../content/aero/source-audit-whitcomb.js';
const close=(a,b,t=2e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('Original source-table anchors, ordering and recovered cross sections preserve all three body datasets and distinguish body-only geometry from reported drag increments',()=>{
  const anchors={unswept:[[27.5,2.185,1.470],[29,2.113,1.580]],delta:[[30.5,2.185,1.470],[29,2.113,1.580]],swept:[[29.125,2.143,1.560],[33.125,2.071,1.656]]};
  for(const [key,b] of Object.entries(WHITCOMB_BODIES)){
    for(const pts of[b.equivalent,b.indented]){assert.equal(pts[0][0],22.5);assert.equal(pts.at(-1)[0],43);for(let i=1;i<pts.length;i++)assert.ok(pts[i][0]>pts[i-1][0]);for(const [x,r] of pts)close(bodyRadius(pts,x),r);}
    for(const [x,re,ri] of anchors[key]){const p=whitcombStation(key,x);close(p.equivalentRadius,re);close(p.indentedRadius,ri);close(p.equivalentArea,Math.PI*re*re);close(p.indentedArea,Math.PI*ri*ri);assert.ok(p.equivalentArea>p.basicArea&&p.indentedArea<p.basicArea);}
    assert.equal(b.remaining,key==='swept'?0:.4);
  }
});
test('Independent per-interval Simpson quadrature verifies exact reconstructed body volumes and station interpolation over the complete source-table domain',()=>{
  for(const [key,b] of Object.entries(WHITCOMB_BODIES))for(const pts of[b.equivalent,b.indented]){
    let volume=0;for(let i=1;i<pts.length;i++){const [a,ra]=pts[i-1],[z,rz]=pts[i],mid=(a+z)/2;close(bodyRadius(pts,mid),(ra+rz)/2);volume+=(z-a)*Math.PI*(ra*ra+4*((ra+rz)/2)**2+rz*rz)/6;}
    close(bodyVolume(pts),volume);for(let x=22.5;x<=43;x+=.125){const p=whitcombStation(key,x);assert.ok(p.removedBodyVolume>0);assert.ok(p.indentedArea<=p.basicArea+1e-12&&p.equivalentArea>=p.basicArea-1e-12);}
  }
});
