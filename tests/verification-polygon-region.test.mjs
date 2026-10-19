import assert from 'node:assert/strict';
import {test} from 'node:test';
import {polygonRegionClearance} from '../content/top/ch03-b.js';

test('Open-region clearances exclude holes, cut boundaries and disconnected gaps', () => {
  assert.equal(polygonRegionClearance('ring', 0, 0), 0);
  assert.equal(polygonRegionClearance('ring', 1.5, 0), .5);
  assert.equal(polygonRegionClearance('ring', 2, 0), 0);
  assert.equal(polygonRegionClearance('two', 0, 0), 0);
  assert.equal(polygonRegionClearance('two', 1.3, 0), 1);
  assert.equal(polygonRegionClearance('C', 1.5, 0), 0);
  assert.equal(polygonRegionClearance('C', 1.5, .55), 0);
  assert.ok(Math.abs(polygonRegionClearance('C', 1.5, .65) - .1) < 1e-14);
  assert.throws(() => polygonRegionClearance('unknown', 0, 0), RangeError);
});

test('Every drawn gold ball stays inside its open region across a spatial grid', () => {
  const inside = {
    ring: (x,y) => x*x+y*y>1 && x*x+y*y<4,
    two: (x,y) => (x+1.3)**2+y*y<1 || (x-1.3)**2+y*y<1,
    C: (x,y) => x*x+y*y>1.69 && x*x+y*y<4 && (x<0 || y<-.55 || y>.55),
  };
  let checked = 0;
  for (const [region, contains] of Object.entries(inside)) {
    for (let ix=-25; ix<=25; ix++) for (let iy=-20; iy<=20; iy++) {
      const x=ix/10+.003, y=iy/10+.007, clearance=polygonRegionClearance(region,x,y);
      if (!contains(x,y)) { assert.ok(clearance<1e-14); continue; }
      assert.ok(clearance>0);
      for (let k=0; k<120; k++) {
        const angle=2*Math.PI*k/120, r=.8*clearance;
        assert.ok(contains(x+r*Math.cos(angle),y+r*Math.sin(angle)), `${region} ball at ${x},${y}`);
      }
      checked++;
    }
  }
  assert.ok(checked>1000);
});
