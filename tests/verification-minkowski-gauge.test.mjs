import assert from 'node:assert/strict';
import {test} from 'node:test';
import {exampleSetGauge} from '../content/fa/ch01-a4.js';
const rectangle={poly:[[-2,-1],[2,-1],[2,1],[-2,1]]},disk={tangentDiskRadius:.75},segment={halfLength:1.2};

test('closed polygon gauge agrees with the independent rectangular norm and includes zero',()=>{
  for(const x of[-5,-.002,0,1,4])for(const y of[-3,-.001,0,2])assert.ok(Math.abs(exampleSetGauge(rectangle,x,y)-Math.max(Math.abs(x)/2,Math.abs(y)))<1e-12);
  for(const shape of[rectangle,disk,segment])assert.equal(exampleSetGauge(shape,0,0),0);
});

test('tangent-disk gauge is finite on precisely the open inward half-plane and includes the endpoint',()=>{
  const a=disk.tangentDiskRadius;
  for(const x of[.0001,.02,.7,3])for(const y of[-2,0,1.3]){
    const mu=exampleSetGauge(disk,x,y),distance=t=>Math.hypot(x/t-a,y/t);
    assert.ok(Math.abs(distance(mu)-a)<1e-11);
    assert.ok(distance(mu*.99)>a);assert.ok(distance(mu*1.01)<a);
  }
  for(const[x,y]of[[-1,0],[0,1],[0,-1],[-.0001,3]])assert.equal(exampleSetGauge(disk,x,y),Infinity);
});

test('a line segment absorbs its line, not a narrow cone around it',()=>{
  assert.equal(exampleSetGauge(segment,1.2,0),1);assert.equal(exampleSetGauge(segment,-2.4,0),2);
  for(const y of[1e-12,1e-6,.001,-.001])assert.equal(exampleSetGauge(segment,1,y),Infinity);
});
