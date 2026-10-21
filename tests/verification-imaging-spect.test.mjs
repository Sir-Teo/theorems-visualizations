import test from 'node:test';
import assert from 'node:assert/strict';
import { spectCellAudit as cell, spectSinoAudit as sino, changFactorAudit as chang, conjugateCorrectionAudit as conjugate } from '../content/imaging/source-audit-spect.shared.js';
import { makeScan360, exitLen, raster, ellAt } from '../content/imaging/ch04.shared.js';
const near=(a,b,tol=1e-11)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('emission within a cell agrees with independent numerical integration and the zero-attenuation limit',()=>{
  for(const mu of [0,1e-12,.153,4]){
    const n=20000,h=.25,step=h/n;let sum=0;
    for(let i=0;i<n;i++)sum+=2*Math.exp(-mu*(i+.5)*step)*step;
    near(cell(2,mu,h),sum,2e-10);
  }
});
test('uniform slab projector includes self attenuation rather than assigning emission to the front face',()=>{
  const W=48,act=new Float64Array(W*W).fill(1),mu=act,sc={nA:1,nd:1,cs:[1],sn:[0],sOf:()=>0},h=2*Math.SQRT2/(2*W),L=68*h;
  for(const m of [0,.153,3,4]){
    const expected=m===0?L:-Math.expm1(-m*L)/m;
    near(sino(act,mu,W,sc,m)[0],expected);
  }
});
test('zero attenuation restores opposite-view equality and unit Chang factors',()=>{
  const W=24,E=[1,.8,.65,0,0,0],act=raster((x,y)=>ellAt([E,[2,.1,.1,.3,.2,0]],x,y),W,W,1),body=raster((x,y)=>ellAt([E],x,y)>0?1:0,W,W,1),sc=makeScan360(24,32),p=sino(act,body,W,sc,0);
  for(let k=0;k<12;k++)for(let j=0;j<32;j++)near(p[k*32+j],p[(k+12)*32+31-j]);
  assert.ok([...chang(E,W,36,0)].every(x=>x===1));
});
test('Chang mean transmission has the analytic circle-centre value and masks exterior pixels',()=>{
  const W=25,mu=2,E=[1,.8,.8,0,0,0],c=chang(E,W,36,mu);
  near(c[12*W+12],Math.exp(mu*.8));
  near(c[0],1);
  const rotated=chang([1,.8,.6,0,0,10],W,36,mu),base=chang([1,.8,.6,0,0,0],W,36,mu);
  near(rotated[12*W+12],base[12*W+12]);
});
test('ellipse exit lengths land on the boundary in the requested direction',()=>{
  const E=[1,.85,.65,.1,-.05,25],phi=25*Math.PI/180;
  for(const angle of [0,.3,1,2,4,6]){
    const dx=Math.cos(angle),dy=Math.sin(angle),L=exitLen(E,.15,-.08,dx,dy),x=.15+L*dx-.1,y=-.08+L*dy+.05;
    near(((x*Math.cos(phi)+y*Math.sin(phi))/.85)**2+((-x*Math.sin(phi)+y*Math.cos(phi))/.65)**2,1);
    assert.ok(L>0);
  }
});
test('conjugate correction is depth independent for a point and overcorrects a uniform extended chord',()=>{
  const q=3,mu=.153,T=34;
  for(const d of [0,1,17,33,34])near(conjugate(q*Math.exp(-mu*d),q*Math.exp(-mu*(T-d)),mu,T),q);
  const uniform=2,p=uniform*(-Math.expm1(-mu*T))/mu,corrected=conjugate(p,p,mu,T);
  near(corrected,2*uniform*Math.sinh(mu*T/2)/mu);
  assert.ok(corrected>uniform*T*2);
  near(conjugate(uniform*T,uniform*T,0,T),uniform*T);
});
