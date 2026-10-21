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

import{readFile}from'node:fs/promises';import{mapCanvasCompositorPrototype}from'../scripts/lib/map-canvas-compositor-prototype.mjs';
test('prototype keeps the full original painter and fallback draw method byte-for-byte',async()=>{
 const source=await readFile(new URL('../assets/js/graph.js',import.meta.url),'utf8'),rewritten=mapCanvasCompositorPrototype(source),a=source.indexOf('  _draw() {'),b=source.indexOf('  _paint({ layer',a),original=source.slice(a,b).replace('  _draw() {','  _drawOriginal() {').trim(),start=rewritten.indexOf('  _drawOriginal() {'),end=rewritten.indexOf('  _paintCompositorPart',start);assert.equal(rewritten.slice(start,end).trim(),original);const endPaint=source.indexOf('\n}\n\n// ------------------------------------------------------------ treemap',b);assert.ok(rewritten.includes(source.slice(b,endPaint)));
});

test('old mixed-dimension resize exceeds the cap; zero-first transition stays bounded in every growth order',()=>{
 const old=[[2880,1864],[3776,2760]],target=compositorAllocation(1600,900,2),sum=stores=>stores.reduce((s,[w,h])=>s+w*h,0);assert.equal(sum(old),15_790_080);const broken=old.map(x=>[...x]);broken[0][0]=3200;assert.equal(sum(broken),16_386_560);assert.ok(sum(broken)>COMPOSITOR_PIXEL_CAP);
 const changes=[[0,0,target.underWidth],[0,1,target.underHeight],[1,0,target.pixelWidth],[1,1,target.pixelHeight]],permutations=xs=>xs.length?xs.flatMap((x,i)=>permutations(xs.filter((_,j)=>j!==i)).map(rest=>[x,...rest])):[[]];
 for(const order of permutations(changes)){const stores=old.map(x=>[...x]);for(const s of stores){s[0]=0;assert.ok(sum(stores)<=COMPOSITOR_PIXEL_CAP);s[1]=0;}for(const[i,k,v]of order){stores[i][k]=v;assert.ok(sum(stores)<=COMPOSITOR_PIXEL_CAP);}}
});
