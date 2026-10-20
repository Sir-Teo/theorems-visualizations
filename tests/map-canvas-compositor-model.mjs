// Explicit-only diagnostic; not a lasting source/flag snapshot regression.
import test from'node:test';import assert from'node:assert/strict';import{compositorAllocation,COMPOSITOR_PIXEL_CAP,COMPOSITOR_EDGE_CAP}from'../scripts/lib/map-canvas-compositor-runtime.mjs';
test('two real Canvas backings jointly respect the pixel/edge cap without resolution reduction',()=>{
 for(const W of[284,320,768,1440,1920,3840])for(const H of[520,932,2092])for(const d of[1,1.5,2]){
  const a=compositorAllocation(W,H,d);if(!a){assert.ok(2*Math.ceil(W*d)*Math.ceil(H*d)>COMPOSITOR_PIXEL_CAP||Math.max(Math.ceil(W*d),Math.ceil(H*d))>COMPOSITOR_EDGE_CAP);continue;}
  assert.equal(a.pixels,Math.ceil(W*d)*Math.ceil(H*d)+Math.ceil((W+2*a.pad)*d)*Math.ceil((H+2*a.pad)*d));assert.ok(a.pixels<=COMPOSITOR_PIXEL_CAP);assert.ok(Math.max(a.underWidth,a.underHeight,a.pixelWidth,a.pixelHeight)<=COMPOSITOR_EDGE_CAP);assert.equal(a.pad%16,0);
 }
 assert.equal(compositorAllocation(1440,932,2).pad,224);assert.equal(compositorAllocation(1440,932,2).pixels,15_790_080);assert.equal(compositorAllocation(3840,2092,2),null);
 for(const tuple of[[0,100,2],[100,-1,2],[100,100,NaN],[Infinity,100,2]])assert.equal(compositorAllocation(...tuple),null);
});
