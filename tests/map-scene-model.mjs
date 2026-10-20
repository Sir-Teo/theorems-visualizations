import test from 'node:test';
import assert from 'node:assert/strict';
import { worldCurve, fidelityScale, edgeInView, buildWorldEdges, buildWorldPaths, sceneEdgeIndices, sceneNodeFlags } from '../assets/js/map-scene-model.js';
import { SceneBudget } from '../assets/js/map-scene-gl.js';
const node = (id, x, y, col = 'a', kind = 'Theorem') => ({ it: { id, col, kind }, x, y });

test('retained world geometry is transform independent, contiguous and accurately encodes endpoints/arc length', () => {
  const a = node('a', 10, 20), b = node('b', 200, 100), c = node('c', -30, 80), edges = [[a, b], [b, c]], mesh = buildWorldEdges(edges, 4);
  assert.deepEqual(worldCurve(a, b), [[10, 20], [95.5, 20], [114.5, 100], [200, 100]]);
  assert.equal(mesh.ranges[1].startSegment, mesh.ranges[0].segments);
  assert.equal(mesh.pointCount, mesh.segmentCount + edges.length);
  for (let e = 0; e < edges.length; e++) {
    const range = mesh.ranges[e], first = mesh.points.slice(range.startPoint * 4, range.startPoint * 4 + 4), end = (range.startPoint + range.segments) * 4;
    assert.deepEqual([...first], [edges[e][0].x, edges[e][0].y, 0, e + .25]); assert.equal(mesh.points[end + 3], e + .5);
    let accumulated = 0;
    for (let i = 0; i < range.segments; i++) { const p = (range.startPoint + i) * 4; accumulated += Math.hypot(mesh.points[p + 4] - mesh.points[p], mesh.points[p + 5] - mesh.points[p + 1]); }
    assert.ok(Math.abs(accumulated - range.length) < .001); assert.ok(range.length >= Math.hypot(edges[e][1].x - edges[e][0].x, edges[e][1].y - edges[e][0].y));
  }
  const saved = Buffer.from(mesh.points.buffer).toString('hex');
  sceneEdgeIndices(edges, mesh, { k: .5, tx: 1, ty: 2, width: 200, height: 200 }); sceneEdgeIndices(edges, mesh, { k: 8, tx: -1000, ty: -300, width: 200, height: 200 });
  assert.equal(Buffer.from(mesh.points.buffer).toString('hex'), saved);
});
test('visibility indices preserve the independent Canvas endpoint test and control predicates', () => {
  const nodes = Array.from({ length: 50 }, (_, i) => node(String(i), (i * 137 % 2000) - 500, (i * 227 % 1600) - 400, i % 2 ? 'b' : 'a'));
  const edges = nodes.slice(1).map((b, i) => [nodes[i], b]), mesh = buildWorldEdges(edges, 1);
  for (const k of [.01, .13, .65, 1.6, 8]) {
    const view = { k, tx: 12.25, ty: -.375, width: 320, height: 240 }, expected = [];
    for (let e = 0; e < edges.length; e++) { const [a, b] = edges[e], ax = a.x * k + view.tx, ay = a.y * k + view.ty, bx = b.x * k + view.tx, by = b.y * k + view.ty; const on = Math.max(ax, bx) >= -50 && Math.min(ax, bx) <= 370 && Math.max(ay, by) >= -50 && Math.min(ay, by) <= 290; assert.equal(edgeInView(a, b, view), on); if (on && a.it.col === 'a') for (let i = 0; i < mesh.ranges[e].segments; i++) expected.push(mesh.ranges[e].startPoint + i); }
    const actual = [...sceneEdgeIndices(edges, mesh, view, { visible: () => true, include: a => a.it.col === 'a' }).values()].flatMap(xs => [...xs]);
    assert.deepEqual(actual, expected);
  }
});
test('fidelity buckets round upward and resource limits fail explicitly', () => {
  for (const k of [.01, .1299, .13, .35, 1.15, 1.6, 8]) for (const dpr of [1, 2]) { const s = fidelityScale(k, dpr); assert.ok(s >= k * dpr && s < 2 * k * dpr); }
  assert.throws(() => fidelityScale(0, 2), TypeError);
  assert.throws(() => buildWorldEdges([[node('a', 0, 0), node('b', 100, 100)]], 1, { maxBytes: 1 }), RangeError);
});
test('visible/ancestor/descendant/highlight/selection/focus/ghost/definition flags remain distinct', () => {
  const nodes = [node('a', 0, 0, 'a', 'Definition'), node('b', 1, 1), node('c', 2, 2), node('d', 3, 3)]; nodes[3].ghost = true;
  const flags = sceneNodeFlags(nodes, { visible: n => n !== nodes[3], focus: nodes[1], selection: nodes[2], closure: { anc: new Set(['a']), desc: new Set(['c']) }, highlight: new Set(['a', 'd']) });
  assert.deepEqual([...flags], [1 | 2 | 8 | 128, 1 | 2 | 4 | 32, 1 | 4 | 16, 8 | 64]);
});
test('independent dense Bernstein samples stay inside the stated device-pixel centerline tolerance', () => {
  const paths = [[[0,0],[400,-300],[-200,500],[200,100]],[[0,0],[200,-500],[400,0]],[[10,20],[10,20],[10,20],[10,20]],[[100,200],[80,200],[-80,-100],[-100,-100]]];
  const distance = (p,a,b) => { const dx=b[0]-a[0],dy=b[1]-a[1],d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/d)):0;return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy); };
  for (const scale of [.5,4,16]) {const mesh=buildWorldPaths(paths,scale);for(let id=0;id<paths.length;id++){const path=paths[id],range=mesh.ranges[id],poly=Array.from({length:range.segments+1},(_,i)=>[mesh.points[(range.startPoint+i)*4],mesh.points[(range.startPoint+i)*4+1]]);for(let i=0;i<=2000;i++){const t=i/2000,u=1-t,p=path.length===4?[0,1].map(j=>u**3*path[0][j]+3*u*u*t*path[1][j]+3*u*t*t*path[2][j]+t**3*path[3][j]):[0,1].map(j=>u*u*path[0][j]+2*u*t*path[1][j]+t*t*path[2][j]);const error=poly.length===1?Math.hypot(p[0]-poly[0][0],p[1]-poly[0][1]):Math.min(...poly.slice(1).map((b,j)=>distance(p,poly[j],b)));assert.ok(error*scale<=.201,`${scale}/${id}: ${error*scale}`);}}}
});
test('owned-resource accounting evicts only inactive entries and releases every resource once',()=>{
 const budget=new SceneBudget(100),released=[],put=(key,bytes,evictable=false)=>budget.reserve(key,bytes,()=>released.push(key),{evictable});put('active',30);put('old',30,true);put('newer',30,true);budget.touch('old');put('replacement',30);assert.deepEqual(released,['newer']);assert.equal(budget.bytes,90);assert.equal(budget.peak,90);assert.throws(()=>put('oversized',110),RangeError);assert.ok(budget.bytes<=100);budget.clear();assert.equal(budget.bytes,0);assert.equal(new Set(released).size,released.length);assert.ok(released.includes('active'));
});
