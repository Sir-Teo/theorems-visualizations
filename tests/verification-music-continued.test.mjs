import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CF_ALPHA,CF_QUOTIENTS,CF_CONVERGENTS,CF_POINTS,continuedModel} from '../content/music/source-audit-continued.js';
const oracle=JSON.parse(fs.readFileSync(new URL('../docs/verification/music-continued-reference.json',import.meta.url)));
const near=(x,y,t=2e-13)=>assert.ok(Math.abs(x-y)<t,`${x} differs from independently enclosed ${y}`);
test('certified rational-log oracle: every nearest numerator and signed error for q1–665',()=>{
  assert.deepEqual(CF_QUOTIENTS,oracle.quotients);near(CF_ALPHA,oracle.alpha,2e-16);assert.equal(CF_POINTS.length,665);
  for(let i=0;i<665;i++){assert.equal(CF_POINTS[i].q,oracle.points[i].q);assert.equal(CF_POINTS[i].p,oracle.points[i].p);near(CF_POINTS[i].signed,oracle.points[i].signed);assert.equal(Math.sign(CF_POINTS[i].signed),Math.sign(oracle.points[i].signed));}
});
test('all selectable second-kind minima, strict next-record error and bounds, determinant basis',()=>{
  const expected=[[0,1],[1,1],[1,2],[3,5],[7,12],[24,41],[31,53],[179,306],[389,665],[9126,15601]];
  assert.deepEqual(CF_CONVERGENTS.map(x=>[x.p,x.q]),expected);
  for(let k=1;k<=7;k++){
    const m=continuedModel(k);assert.equal(m.minimizer,m.current.q);assert.equal(m.minimum,m.error);assert.equal(m.rows.length,9);assert.equal(m.points.length,665);
    const error=Math.abs(oracle.points[m.current.q-1].signed);near(m.error,error);assert.ok(error<1/m.next.q);assert.ok(Math.abs(oracle.points[m.next.q-1].signed)<error);
    for(const x of oracle.points.slice(0,m.next.q-1))if(x.q!==m.current.q)assert.ok(Math.abs(x.signed)>error);
    assert.equal(Math.abs(m.current.p*m.next.q-m.current.q*m.next.p),1);
  }
  // First-kind and second-kind differ: 4/7 improves α−p/q on3/5 but not qα−p.
  assert.ok(Math.abs(CF_ALPHA-4/7)<Math.abs(CF_ALPHA-3/5));assert.ok(Math.abs(7*CF_ALPHA-4)>Math.abs(5*CF_ALPHA-3));
});
test('reject unsupported indexes instead of replaying a different convergent',()=>{
 for(const x of[0,8,-1,1.5,NaN,Infinity,'4',null,{},undefined])if(x!==undefined)assert.throws(()=>continuedModel(x),RangeError);
 assert.equal(continuedModel().k,4);
});
