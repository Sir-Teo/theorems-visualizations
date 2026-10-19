import test from 'node:test';import assert from 'node:assert/strict';
import {faceStruct,regionsOf,PGS,pgFaces,pgFlatten,crossPairs} from '../content/graph/ch04-a.shared.js';
import {polygonRadius,radialLower,angularMap,conePoint,coneInverse,coneMeshAngles,complementProbe,checkedPlaneState,checkedPlaneGuard,triangulateAttempt} from '../content/graph/ch04-plane-audit.shared.js';
const tau=2*Math.PI,close=(a,b,tol=3e-12)=>assert.ok(Math.abs(a-b)<tol,`${a} vs ${b}`);
test('polygonal cone extensions have positive radii and a two-sided inverse in either orientation',()=>{
 for(const kind of ['blob','star','pear'])for(const angles of [[0,Math.PI/2,Math.PI,3*Math.PI/2],[-.7,-.5,-.3,2],[1,1.2,1.4,1.6]])for(const reverse of [false,true]){
  for(let j=0;j<400;j++){const t=tau*j/400;assert.ok(polygonRadius(kind,t)>=radialLower[kind]*Math.cos(Math.PI/80)-1e-13);for(const r of [.01,.25,.8,1]){const p=conePoint(r,t,kind,angles,reverse),inv=coneInverse(...p,kind,angles,reverse);close(inv.r,r);close(Math.cos(inv.t),Math.cos(t));close(Math.sin(inv.t),Math.sin(t));}}
  const samples=coneMeshAngles(kind,angles,reverse);for(let i=0;i<80;i++){const a=tau*i/80;assert.ok(samples.some(t=>Math.hypot(Math.cos(angularMap(t,angles,reverse))-Math.cos(a),Math.sin(angularMap(t,angles,reverse))-Math.sin(a))<1e-12));}
 }
 assert.deepEqual(coneInverse(0,0,'blob',[0,1,2,3]),{r:0,t:0});
});
// Independent digital flood fill is exact for these orthogonal grid segments with four pixels per unit.
function rasterRegions(P,E){const N=13,W=N+4,blocked=new Set(),key=(x,y)=>y*W+x;for(const [x,y]of P)blocked.add(key(2+4*x,2+4*y));for(const [a,b]of E){const p=P[a],q=P[b],length=4*(Math.abs(p[0]-q[0])+Math.abs(p[1]-q[1]));for(let k=0;k<=length;k++)blocked.add(key(2+4*p[0]+4*(q[0]-p[0])*k/length,2+4*p[1]+4*(q[1]-p[1])*k/length));}let regions=0;const seen=new Set(blocked);for(let y=0;y<W;y++)for(let x=0;x<W;x++){const start=key(x,y);if(seen.has(start))continue;regions++;seen.add(start);const queue=[[x,y]];for(let k=0;k<queue.length;k++){const [u,v]=queue[k];for(const [a,b]of [[u-1,v],[u+1,v],[u,v-1],[u,v+1]])if(a>=0&&b>=0&&a<W&&b<W&&!seen.has(key(a,b))){seen.add(key(a,b));queue.push([a,b]);}}}return regions;}
test('plane-face counts and Euler balance match independent raster topology for every 3x3 grid subgraph',()=>{
 const P=Array.from({length:9},(_,i)=>[i%3,Math.floor(i/3)]),all=[];for(let i=0;i<9;i++){if(i%3<2)all.push([i,i+1]);if(i<6)all.push([i,i+3]);}
 for(let mask=0;mask<4096;mask++){const E=all.filter((_,i)=>(mask>>i)&1),F=faceStruct(P,E);assert.equal(F.faces.length,rasterRegions(P,E),`mask ${mask}`);assert.equal(P.length-E.length+F.faces.length,1+F.comps);}
 const empty=faceStruct([],[]);assert.equal(empty.faces.length,1);assert.equal(empty.comps,0);
});
test('frontiers, crossings, nested components, isolated points and on-drawing probes are distinguished',()=>{
 const square={pts:[[0,0],[4,0],[4,4],[0,4]],closed:true},point={pts:[[2,2]],closed:false};let R=complementProbe([square,point],[1,1]);assert.equal(R.F.faces.length,2);assert.equal(R.frontierPoints.length,1);assert.equal(R.allFrontier,true);
 R=complementProbe([square,point],[5,5]);assert.equal(R.frontierPoints.length,0);assert.equal(R.allFrontier,false);R=complementProbe([square],[2,0]);assert.equal(R.near,true);assert.equal(R.cur,null);R=complementProbe([square],[2,.01]);assert.equal(R.near,true);
 const nested={pts:[[1,1],[3,1],[3,3],[1,3]],closed:true};R=complementProbe([square,nested],[.5,.5]);assert.equal(R.F.faces.length,3);assert.equal(R.allFrontier,true);R=complementProbe([square,nested],[2,2]);assert.equal(R.allFrontier,false);
 const bow={pts:[[0,0],[4,4],[4,0],[0,4]],closed:true};assert.equal(regionsOf([bow]).F.faces.length,3);
});
test('all five triangulation presets reach valid maximal drawings; both face and edge tests agree',()=>{
 for(const name of ['ring6','cube','fan','path7','nested']){const pg=PGS[name](),before=pg.E.length,result=triangulateAttempt(pg);assert.equal(result.remaining,0,name);assert.equal(result.triangulation,true,name);assert.equal(pg.E.length,3*pg.P.length-6,name);assert.equal(result.added,pg.E.length-before);const fl=pgFlatten(pg);assert.equal(crossPairs(fl.P,fl.E,.01).length,0);const F=pgFaces(pg);assert.equal(F.faces.length,2*pg.P.length-4);assert.ok(F.faces.every(f=>f.rlen===3));}
 const stopped=triangulateAttempt(PGS.path7(),0);assert.ok(stopped.remaining>0);assert.equal(stopped.triangulation,false);assert.equal(stopped.limited,true);
});
test('cycle-edge deletion preserves connectivity and removes exactly one face until a forest remains',()=>{
 for(const name of ['ring6','cube','fan','path7','nested']){const pg=PGS[name]();let last=pgFaces(pg);for(;;){const fl=pgFlatten(pg),F=pgFaces(pg),k=pg.E.findIndex((_,j)=>{const hs=fl.orig.flatMap((e,i)=>e===j?[2*i]:[]);return hs.some(h=>F.faceOfHe[h]!==F.faceOfHe[h^1]);});if(k<0){assert.equal(F.faces.length,1);break;}pg.E.splice(k,1);const next=pgFaces(pg);assert.equal(next.faces.length,F.faces.length-1);assert.equal(next.comps,F.comps);last=next;}}
});
test('editor guards refuse coincident vertices as well as crossings and restore valid positions',()=>{
 const G={nodes:[{id:'a',x:0,y:0},{id:'b',x:1,y:0}],edges:[],removeEdge(e){this.edges=this.edges.filter(x=>x!==e);},removeNode(id){this.nodes=this.nodes.filter(n=>n.id!==id);}};const st={},guard=checkedPlaneGuard(G,st);G.nodes[1].x=0;assert.ok(checkedPlaneState(G).bad.length);G.onChange('move',G.nodes[1]);assert.equal(G.nodes[1].x,1);assert.match(st.msg,/distinct/);assert.equal(checkedPlaneState(G).bad.length,0);guard.reset();assert.equal(st.msg,'');
});
