// Explicit offline actual-class peer; no native GL, browser, map or timing.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const [root,out]=process.argv.slice(2);
assert.ok(root&&out);assert.ok(!fs.existsSync(out));fs.mkdirSync(out,{recursive:true});
const load=p=>import(pathToFileURL(path.resolve(root,p)));
const {SceneEdges}=await load('assets/js/map-scene-edges.js');
const {SceneBudget}=await load('assets/js/map-scene-gl.js');
const {RecordingGL}=await load('tests/verification-map-optional-recording-gl.mjs');
const {curveBoundsEdgesClass}=await load('scripts/lib/map-curve-bounds-runtime.mjs');
const math=await load('scripts/lib/map-curve-bounds-math.mjs');
const {chunkedEdgesClass}=await load('scripts/lib/map-chunked-indices-runtime.mjs');
const rows=[];let checks=0;
function save(){fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({nativeEvidence:false,checks,rows},null,2));}
function eq(a,b){checks++;assert.deepEqual(a,b);}
function fixture(){
 const gl=new RecordingGL,budget=new SceneBudget(2_000_000),C=curveBoundsEdgesClass(SceneEdges),e=new C(gl,budget);
 const paths=[[[10,10],[20,10]],[[30,10],[40,10]]];
 const G={scale:4,textureWidth:4,textureHeight:1,pointCount:4,segmentCount:2,
  points:new Float32Array([10,10,0,.25,20,10,10,.5,30,10,0,1.25,40,10,10,1.5]),
  joins:new Float32Array([0,1,0,1,0,1,0,1]),
  ranges:[{startPoint:0,startSegment:0,segments:1,length:10},{startPoint:2,startSegment:1,segments:1,length:10}]};
 const model=e.upload(G,paths),ids=Array(32769).fill(0),coverage=[0,0,128,96];
 e.__construction={model,key:'gray',ids,paths,coverage};
 const g=e.group(new Uint32Array(ids.length),{width:2,color:[.1,.2,.3,.5],cap:'round',bounds:[0,0,128,96]});e.__construction=null;
 g.model=model;g.coverage=coverage;
 const v={k:1,tx:0,ty:0,width:128,height:96,dpr:1};
 e.scene={map:{...v,W:128,H:96},groups:new Map([['4:gray',g]]),visibleEdges:ids,paths,generation:1,controlKey:'fixed'};
 return {gl,budget,e,model,g,ids,v,G,run(){return e.union(model,[g],v);}};
}
function probe(name,mutate,expect){
 const f=fixture(),row={name};rows.push(row);save();
 try{mutate(f);try{f.run();}catch(error){row.error=error.message;}
  row.stats=structuredClone(f.e.stats);row.chunks=f.gl.calls.filter(c=>c.name==='bufferSubData').map(c=>({count:c.indices.length,first:c.indices[0],last:c.indices.at(-1)}));
  row.composites=f.gl.calls.filter(c=>c.name==='drawArrays').length;row.last=f.gl.calls.filter(c=>c.name==='bufferSubData').at(-1)?.indices.at(-1);save();
  expect(f,row);row.pass=true;
 }catch(error){row.failure=error.message;}
 finally{f.e.destroy();f.budget.clear();row.cleanupBytes=f.budget.bytes;save();}
}
probe('unchanged-snapshot',()=>{},(_,r)=>{eq(r.last,0);eq(r.stats.optimizedTiles,1);});
probe('range-snapshot-rewrite-before-bind',f=>{f.model.ranges[0].segments=0;f.model.ranges[1].startPoint=1;f.model.ranges[1].startSegment=0;f.model.ranges[1].segments=2;},(_,r)=>{eq(r.stats.originalBinds,1);eq(r.chunks,[]);});
probe('range-snapshot-rewrite-mid-prefix',f=>{f.gl.onSubData=()=>{f.model.ranges[0].segments=0;f.model.ranges[1].startPoint=1;f.model.ranges[1].startSegment=0;f.model.ranges[1].segments=2;};},(_,r)=>{eq(r.stats.staleAborts,1);eq(r.stats.liveReplays,0);eq(r.composites,0);});
probe('release-only-real-owner-mid-prefix',f=>{f.gl.onSubData=()=>{f.e.releaseGroup(f.g);f.gl.failChunk=true;};},(_,r)=>{eq(r.stats.staleAborts,1);eq(r.stats.liveReplays,0);eq(r.composites,0);});
probe('released-original-owner-before-bind',f=>f.e.releaseGroup(f.g),(_,r)=>{eq(r.stats.staleAborts,1);eq(r.stats.originalBinds,0);eq(r.composites,0);});
probe('metadata-denial-inherited-original-buffer',f=>f.e.dropOptional('peer denial'),(_,r)=>{eq(r.stats.originalBinds,1);eq(r.chunks,[]);});
probe('live-gl-failure-full-replay',f=>{f.gl.failChunk=true;},(_,r)=>{eq(r.stats.liveReplays,1);eq(r.stats.originalBinds,1);eq(r.composites,1);});
// Deliberately violate the disclosed no-writer premise: retain failure, no waiver.
probe('same-count-style-IDs-rewrite-before-bind',f=>{f.ids[f.ids.length-1]=1;},(_,r)=>{eq(r.last,0);});
probe('same-count-style-IDs-rewrite-mid-prefix',f=>{f.gl.onSubData=()=>{f.ids[f.ids.length-1]=1;};},(_,r)=>{eq(r.last,0);});
// Independent seeded Float32 endpoint oracle against the actual old box.
let seed=0x5e70123;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const old=chunkedEdgesClass(class{}).prototype.box;
const arithmetic={name:'seeded-actual-computed-box-domination',cases:0};rows.push(arithmetic);save();
for(let i=0;i<2048;i++){
 const xy=new Float32Array(Array.from({length:8},()=>Math.fround((rand()*2-1)*2**20)));
 const xs=[xy[0],xy[2],xy[4],xy[6]],ys=[xy[1],xy[3],xy[5],xy[7]];
 const b=new Float32Array([Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]);
 const v={width:1+Math.floor(rand()*4095),height:1+Math.floor(rand()*4095),k:.01+rand()*15.99,tx:(rand()*2-1)*2**20,ty:(rand()*2-1)*2**20,dpr:i%2+1};
 const g={width:.1+rand()*7.9,cap:i%3?'butt':'round'},J=rand()*16,pw=v.width*v.dpr,ph=v.height*v.dpr;
 const box=math.curveBox(b,0,J,g,v,pw,ph);
 for(let j=0;j<3;j++){const s=old.call({meta:{xy,J}},j,g,v,pw,ph);arithmetic.last={i,j,box,s};save();checks++;assert.ok(box&&box[0]<=s[0]&&box[1]<=s[1]&&box[2]>=s[2]&&box[3]>=s[3]);arithmetic.cases++;}
}
delete arithmetic.last;arithmetic.pass=true;save();
console.log(JSON.stringify({checks,rows:rows.length,failures:rows.filter(r=>r.failure).map(r=>r.name),out}));
