// Persistent world-space data for the isolated WebGL scene experiment.
import { flattenBezier } from './map-webgl-edges.js';

export function worldCurve(a, b) {
  const dx = Math.max(20, Math.abs(b.x - a.x) * .45);
  return [[a.x, a.y], [a.x + dx, a.y], [b.x - dx, b.y], [b.x, b.y]];
}
export function fidelityScale(k, dpr) {
  if (!(k > 0 && dpr > 0 && Number.isFinite(k * dpr))) throw new TypeError('Invalid scene scale');
  return 2 ** Math.ceil(Math.log2(k * dpr));
}

/** The culling predicate is intentionally the same endpoint rule as Canvas. */
export function edgeInView(a, b, { k, tx, ty, width, height }, margin = 50) {
  const x1 = a.x * k + tx, y1 = a.y * k + ty, x2 = b.x * k + tx, y2 = b.y * k + ty;
  return !(Math.max(x1, x2) < -margin || Math.min(x1, x2) > width + margin || Math.max(y1, y2) < -margin || Math.min(y1, y2) > height + margin);
}

/**
 * One RGBA32F texel per world point: x, y, arc length, edge ID plus endpoint
 * flags. A Uint32 segment index addresses its first point. Geometry is static;
 * pan/zoom only change shader uniforms. A new fidelity bucket rebuilds once.
 */
export function buildWorldPaths(paths, scale, { tolerancePixels = .2, maxBytes = 44_000_000, textureWidth = 1024, includeInstances = true } = {}) {
  if (!(scale > 0 && Number.isFinite(scale)) || !(tolerancePixels > 0) || !Number.isInteger(textureWidth) || textureWidth < 1) throw new TypeError('Invalid world geometry budget');
  const coordinates = [], ranges = []; let segmentCount = 0;
  for (let edge = 0; edge < paths.length; edge++) {
    const polyline = flattenBezier(paths[edge], tolerancePixels / scale).filter((p, i, all) => !i || Math.hypot(p[0] - all[i - 1][0], p[1] - all[i - 1][1]) > 1e-10);
    const startPoint = coordinates.length / 4, count = Math.max(0, polyline.length - 1); let length = 0;
    for (let i = 0; i < polyline.length; i++) {
      if (i) length += Math.hypot(polyline[i][0] - polyline[i - 1][0], polyline[i][1] - polyline[i - 1][1]);
      coordinates.push(polyline[i][0], polyline[i][1], length, edge + (!i ? .25 : i === polyline.length - 1 ? .5 : 0));
    }
    ranges.push({ startPoint, segments: count, startSegment: segmentCount, length }); segmentCount += count;
    if (coordinates.length * 4 + segmentCount * 4 > maxBytes) throw new RangeError('World geometry budget exceeded');
  }
  const height = Math.max(1, Math.ceil(coordinates.length / 4 / textureWidth)), points = new Float32Array(textureWidth * height * 4), joins = new Float32Array(textureWidth * height * 2);
  if (points.byteLength + joins.byteLength + segmentCount * 4 > maxBytes) throw new RangeError('Padded world geometry budget exceeded');
  points.set(coordinates);
  const normal=(a,b)=>{const dx=points[b*4]-points[a*4],dy=points[b*4+1]-points[a*4+1],d=Math.hypot(dx,dy);return d>1e-10?[-dy/d,dx/d]:[0,1];};
  for(const range of ranges)for(let i=0;i<=range.segments;i++){const id=range.startPoint+i,a=i?normal(id-1,id):normal(id,id+Math.min(1,range.segments)),b=i<range.segments?normal(id,id+1):a,den=1+a[0]*b[0]+a[1]*b[1];let x=den<.0001?b[0]:(a[0]+b[0])/den,y=den<.0001?b[1]:(a[1]+b[1])/den;const d=Math.hypot(x,y);if(d>10){x*=10/d;y*=10/d;}joins.set([x,y],id*2);}
  // This compact index can be regenerated from ranges after GPU upload. It need
  // not remain as a second CPU copy of all world geometry.
  const instances = includeInstances ? new Uint32Array(segmentCount) : null; let offset = 0;
  if (instances) for (const range of ranges) for (let i = 0; i < range.segments; i++) instances[offset++] = range.startPoint + i;
  return { scale, tolerancePixels, textureWidth, textureHeight: height, points, joins, instances, ranges, pointCount: coordinates.length / 4, segmentCount, bytes: points.byteLength + joins.byteLength + (instances?.byteLength || 0) };
}

export function buildWorldEdges(edges, scale, options) { return buildWorldPaths(edges.map(([a, b]) => worldCurve(a, b)), scale, options); }

/** Prepare visibility/closure indices on view/control changes; no retessellation. */
export function sceneEdgeIndices(edges, geometry, view, { visible = () => true, include = () => true, pad = 0 } = {}) {
  const groups = new Map();
  for (let id = 0; id < edges.length; id++) {
    const [a, b] = edges[id];
    if (!visible(a) || !visible(b) || !include(a, b) || !edgeInView(a, b, view, 50 + pad)) continue;
    const key = a.it?.col ?? a.col ?? '', group = groups.get(key) || [];
    const range = geometry.ranges[id]; for (let i = 0; i < range.segments; i++) group.push(range.startPoint + i);
    groups.set(key, group);
  }
  return new Map([...groups].map(([key, indices]) => [key, new Uint32Array(indices)]));
}

export function sceneNodeFlags(nodes, { visible, focus = null, selection = null, closure = null, highlight = null }) {
  const flags = new Uint8Array(nodes.length);
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i], id = n.it.id;
    flags[i] = (visible(n) ? 1 : 0) | (closure && (n === focus || closure.anc.has(id)) ? 2 : 0) | (closure && (n === focus || closure.desc.has(id)) ? 4 : 0) | (highlight?.has(id) ? 8 : 0) | (n === selection ? 16 : 0) | (n === focus ? 32 : 0) | (n.ghost ? 64 : 0) | (n.it.kind === 'Definition' ? 128 : 0);
  }
  return flags;
}
