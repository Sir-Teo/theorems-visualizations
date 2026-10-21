import test from 'node:test';
import assert from 'node:assert/strict';
import { flattenBezier, strokeMesh } from '../assets/js/map-webgl-edges.js';

// Independent polynomial evaluation and point-to-segment distance, rather than
// reusing the subdivision's control-point flatness criterion.
const evaluate = (points, t) => points.length === 4 ? [0, 1].map(d => (1 - t) ** 3 * points[0][d] + 3 * (1 - t) ** 2 * t * points[1][d] + 3 * (1 - t) * t * t * points[2][d] + t ** 3 * points[3][d]) : [0, 1].map(d => (1 - t) ** 2 * points[0][d] + 2 * (1 - t) * t * points[1][d] + t * t * points[2][d]);
const distance = (p, a, b) => {
  const d = [b[0] - a[0], b[1] - a[1]], length = d[0] * d[0] + d[1] * d[1], t = length ? Math.min(1, Math.max(0, ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / length)) : 0;
  return Math.hypot(p[0] - a[0] - t * d[0], p[1] - a[1] - t * d[1]);
};
test('cubic, bundled quadratic, looping and degenerate curves stay within the chosen chord tolerance', () => {
  const cases = [ [[0, 0], [200, 0], [100, 300], [300, 300]], [[0, 0], [200, -300], [400, 0]], [[0, 0], [20, 0], [-120, 0], [-100, 0]], [[0, 0], [200, 300], [-200, 300], [0, 0]], [[10, 20], [10, 20], [10, 20], [10, 20]] ];
  for (const ps of cases) for (const tolerance of [2, .2, .0125]) {
    const polyline = flattenBezier(ps, tolerance); assert.deepEqual(polyline[0], ps[0]); assert.deepEqual(polyline.at(-1), ps.at(-1));
    let maximum = 0;
    for (let i = 0; i <= 2000; i++) { const p = evaluate(ps, i / 2000); maximum = Math.max(maximum, Math.min(...polyline.slice(1).map((b, j) => distance(p, polyline[j], b)))); }
    assert.ok(maximum <= tolerance + 1e-9, `${maximum} > ${tolerance}`);
  }
});
test('tessellation is bounded and rejects invalid geometry rather than silently reducing fidelity', () => {
  assert.throws(() => flattenBezier([[0, 0], [1, 1]], .2), TypeError);
  assert.throws(() => flattenBezier([[0, 0], [Infinity, 1], [1, 1]], .2), TypeError);
  assert.throws(() => flattenBezier([[0, 0], [100, 100], [200, 0]], 0), TypeError);
  assert.throws(() => flattenBezier([[0, 0], [100, 100], [200, 0]], .00001, 1), RangeError);
});
test('straight strokes have exact half-width offsets, while round caps retain a bounded radius', () => {
  const ps = [[[0, 0], [50, 0], [100, 0]]], butt = strokeMesh(ps, { tolerance: .2 }), round = strokeMesh(ps, { tolerance: .2, cap: 'round' });
  assert.equal(butt.segments, 1); assert.equal(butt.vertices.length, 24); assert.equal(round.segments, 1);
  for (let i = 0; i < butt.vertices.length; i += 4) { assert.equal(butt.vertices[i + 1], 0); assert.equal(Math.abs(butt.vertices[i + 2]), 0); assert.equal(Math.abs(butt.vertices[i + 3]), 1); }
  for (let i = 0; i < round.vertices.length; i += 4) assert.ok(Math.hypot(round.vertices[i + 2], round.vertices[i + 3]) <= 1.000001);
  assert.equal(strokeMesh([[[0, 0], [0, 0], [0, 0]]], { tolerance: .2 }).vertices.length, 0);
});
