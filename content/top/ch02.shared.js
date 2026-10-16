// Topology — Chapter 2: helpers shared by ch02.js, ch02-b.js and ch02-c.js (plain named exports).
//
//  1. Finite maps between finite spaces (subsets as bitmasks, as in ch01.shared.js).
//  2. Piecewise-linear functions ℝ → ℝ with exact preimages and images of the exact subsets of ℝ of
//     ch01.shared.js (finitely many breakpoints), so openness and closedness are decided exactly.
//  3. Gluing the square: the identifications of the five classical quotients, a walker that crosses
//     edges, and honest 3D foldings (rolling by curvature, bending a tube, twisting, the cross-cap).
//  4. Combinatorial invariants of a glued triangulated grid: V − E + F, orientability, boundary circles.
import { members, inF, EMPTYSET, psUnion, psInter, psFrom, psHas, psNorm } from './ch01.shared.js';

// ------------------------------------------------------------------ 1. finite maps
/** Preimage of the subset V (mask over Y) under f: X → Y given as an array f[i] = image of point i (0-based). */
export function preimage(f, V) { let m = 0; for (let i = 0; i < f.length; i++) if ((V >> f[i]) & 1) m |= 1 << i; return m; }
/** Image of the subset A under f. */
export function imageOf(f, A) { let m = 0; for (let i = 0; i < f.length; i++) if ((A >> i) & 1) m |= 1 << f[i]; return m; }
/** Open sets V of (Y, FY) whose preimage is not open in (X, FX). */
export function badPreimages(f, FX, FY, nY) { return members(FY, nY).filter((V) => !inF(FX, preimage(f, V))); }
/** All maps {0..nX−1} → {0..nY−1} as arrays. */
export function allMaps(nX, nY) {
  const out = [], f = new Array(nX).fill(0);
  const rec = (i) => { if (i === nX) { out.push(f.slice()); return; } for (let y = 0; y < nY; y++) { f[i] = y; rec(i + 1); } };
  rec(0); return out;
}

// ------------------------------------------------------------------ 2. piecewise-linear functions
// f = { pieces: [[a, b, m, q]], pts: [[x, y]] }: f(x) = m·x + q on the open interval (a, b) (a may be −∞, b may be +∞),
// and f(x) = y at each breakpoint x listed in pts. Breakpoints and values are rational in spirit (the exact-set class).
const rnd = (x) => (isFinite(x) ? Math.round(x * 1e9) / 1e9 : x);
/** Value of a piecewise-linear function. */
export function plEval(f, x) {
  for (const [px, py] of f.pts) if (Math.abs(x - px) < 1e-12) return py;
  for (const [a, b, m, q] of f.pieces) if (x > a && x < b) return m * x + q;
  return NaN;
}
/** Image of an exact set under x ↦ s·x + t (s ≠ 0). */
export function psAffine(A, s, t) {
  const B = psNorm(A);
  let bp = B.bp.map((x) => rnd(s * x + t)), pt = B.pt.slice(), pc = B.pc.slice();
  if (s < 0) { bp = bp.reverse(); pt = pt.reverse(); pc = pc.reverse(); }
  return psNorm({ bp, pt, pc });
}
const isEmpty = (A) => { const B = psNorm(A); return B.bp.length === 0 && B.pc[0] === 0; };
export { isEmpty as psEmpty };
const openIv = (a, b) => psFrom([[a, b]]);
/** Exact preimage f⁻¹(V) of an exact set V. */
export function plPre(f, V) {
  let P = EMPTYSET;
  for (const [a, b, m, q] of f.pieces) {
    if (m === 0) { if (psHas(V, q)) P = psUnion(P, openIv(a, b)); }
    else P = psUnion(P, psInter(psAffine(V, 1 / m, -q / m), openIv(a, b)));
  }
  const pts = f.pts.filter(([, y]) => psHas(V, y)).map(([x]) => x);
  return pts.length ? psUnion(P, psFrom([], pts)) : P;
}
/** Exact image f(A) of an exact set A (pieces with m = 0 contribute their value when A meets them). */
export function plImg(f, A) {
  let I = EMPTYSET;
  for (const [a, b, m, q] of f.pieces) {
    const part = psInter(A, openIv(a, b));
    if (isEmpty(part)) continue;
    I = psUnion(I, m === 0 ? psFrom([], [q]) : psAffine(part, m, q));
  }
  const pts = f.pts.filter(([x]) => psHas(A, x)).map(([, y]) => y);
  return pts.length ? psUnion(I, psFrom([], pts)) : I;
}
/** Polyline pieces for drawing the graph of a PL function on [lo, hi] (null breaks at jumps), plus breakpoint dots. */
export function plDraw(s, f, lo, hi, st = {}) {
  const col = st.color || 'accent';
  for (const [a, b, m, q] of f.pieces) {
    const x0 = Math.max(a, lo), x1 = Math.min(b, hi); if (!(x1 > x0)) continue;
    s.line(x0, m * x0 + q, x1, m * x1 + q, { color: col, width: st.width ?? 2.6 });
  }
  for (const [x, y] of f.pts) {
    if (x < lo || x > hi) continue;
    // hollow ends where a piece's limit differs from the value
    for (const [a, b, m, q] of f.pieces) {
      if (Math.abs(a - x) < 1e-12 && Math.abs(m * x + q - y) > 1e-9) s.dot(x, m * x + q, { r: 4.2, hollow: true, color: col });
      if (Math.abs(b - x) < 1e-12 && Math.abs(m * x + q - y) > 1e-9) s.dot(x, m * x + q, { r: 4.2, hollow: true, color: col });
    }
    s.dot(x, y, { r: 4.4, color: col });
  }
}

// ------------------------------------------------------------------ 3. gluing the square
/**
 * The classical identifications of the unit square [0,1]²:
 *   x-edges: (0, y) ~ (1, y) ('same') or (0, y) ~ (1, 1 − y) ('flip') or free (null); likewise y-edges (x, 0) ~ (x, 1) / (1 − x, 1).
 */
export const GLUE = {
  cyl: { name: 'cylinder', x: 'same', y: null },
  mob: { name: 'Möbius band', x: 'flip', y: null },
  tor: { name: 'torus', x: 'same', y: 'same' },
  kln: { name: 'Klein bottle', x: 'same', y: 'flip' },
  rp2: { name: 'projective plane', x: 'flip', y: 'flip' },
};
/**
 * Move a point one small step (dx, dy) inside the glued square: crossing a glued edge re-enters through its partner
 * (mirrored when the gluing flips), crossing a free edge stops. Returns {x, y, dx, dy, flips} (direction updated).
 */
export function glueStep(kind, p, dx, dy) {
  const G = GLUE[kind];
  let { x, y } = p, flips = 0;
  x += dx; y += dy;
  if (x > 1 || x < 0) {
    if (!G.x) { x = Math.min(1, Math.max(0, x)); dx = -dx; }
    else { x = x > 1 ? x - 1 : x + 1; if (G.x === 'flip') { y = 1 - y; dy = -dy; flips++; } }
  }
  if (y > 1 || y < 0) {
    if (!G.y) { y = Math.min(1, Math.max(0, y)); dy = -dy; }
    else { y = y > 1 ? y - 1 : y + 1; if (G.y === 'flip') { x = 1 - x; dx = -dx; flips++; } }
  }
  return { x, y, dx, dy, flips };
}
/** The walker's path: from p0 in direction θ for length L, as a list of segments [[x,y],…] broken at edge crossings, with flip counts. */
export function gluePath(kind, p0, theta, L, h = 0.004) {
  let p = { x: p0[0], y: p0[1] }, dx = Math.cos(theta) * h, dy = Math.sin(theta) * h, flips = 0, crossings = 0;
  const segs = [[[p.x, p.y]]];
  const n = Math.round(L / h);
  for (let i = 0; i < n; i++) {
    const q = glueStep(kind, p, dx, dy);
    const jumped = Math.abs(q.x - p.x) > 0.5 || Math.abs(q.y - p.y) > 0.5;
    if (jumped) { segs.push([]); crossings++; }
    flips += q.flips; dx = q.dx; dy = q.dy; p = q;
    segs[segs.length - 1].push([p.x, p.y]);
  }
  return { segs, end: [p.x, p.y], dir: [dx / h, dy / h], flips, crossings };
}
/** Theme-aware colouring of the square: bilinear blend of four corner colours with a faint checkerboard. */
export function squarePaint(v, cells = 6) {
  const C = ['blue', 'teal', 'gold', 'pink'].map((c) => v.rgb(c));
  return (u, w) => {
    u = Math.min(1, Math.max(0, u)); w = Math.min(1, Math.max(0, w));
    const k = ((Math.floor(u * cells - 1e-9) + Math.floor(w * cells - 1e-9)) & 1) ? 0.84 : 1;
    const out = [0, 1, 2].map((i) => k * ((1 - u) * (1 - w) * C[0][i] + u * (1 - w) * C[1][i] + (1 - u) * w * C[3][i] + u * w * C[2][i]));
    return out;
  };
}
/** Rolling a flat segment of length L into a circle of circumference L: point at arc parameter s ∈ [0,1] for roll t ∈ [0,1]. Mid-point fixed at the origin with horizontal tangent; the circle lies above. */
export function roll(s, t, L) {
  const sig = L * (s - 0.5);
  if (t < 1e-5) return [sig, 0];
  const rho = L / (2 * Math.PI * t), a = sig / rho;
  return [rho * Math.sin(a), rho * (1 - Math.cos(a))];
}
/**
 * Bend a flat segment into a closed target curve by scaling its turning angle: the target c(s), s ∈ [0,1], is sampled by
 * arc length; at stage t the tangent angle is t·θ(s), integrated from the mid-point. Exact target at t = 1, straight at t = 0.
 * Returns (t) → sampled points [[x,y]] (N+1 of them), memoised.
 */
export function bender(c, N = 160) {
  const raw = []; for (let i = 0; i <= 2000; i++) raw.push(c(i / 2000));
  const cum = [0]; for (let i = 1; i < raw.length; i++) cum.push(cum[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
  const Ltot = cum[cum.length - 1];
  // resample by arc length
  const P = []; let j = 0;
  for (let i = 0; i <= N; i++) { const L = (Ltot * i) / N; while (j < cum.length - 2 && cum[j + 1] < L) j++; const f = (L - cum[j]) / (cum[j + 1] - cum[j] || 1); P.push([raw[j][0] + f * (raw[j + 1][0] - raw[j][0]), raw[j][1] + f * (raw[j + 1][1] - raw[j][1])]); }
  const th = []; for (let i = 0; i < N; i++) th.push(Math.atan2(P[i + 1][1] - P[i][1], P[i + 1][0] - P[i][0]));
  for (let i = 1; i < N; i++) { while (th[i] - th[i - 1] > Math.PI) th[i] -= 2 * Math.PI; while (th[i] - th[i - 1] < -Math.PI) th[i] += 2 * Math.PI; }
  const mid = N / 2, th0 = (th[mid - 1] + th[mid]) / 2, ds = Ltot / N, cache = new Map();
  return (t) => {
    const key = Math.round(t * 400);
    if (cache.has(key)) return cache.get(key);
    const tt = key / 400, out = new Array(N + 1);
    out[mid] = P[mid].slice();
    for (let i = mid; i < N; i++) { const a = th0 + tt * (th[i] - th0); out[i + 1] = [out[i][0] + ds * Math.cos(a), out[i][1] + ds * Math.sin(a)]; }
    for (let i = mid - 1; i >= 0; i--) { const a = th0 + tt * (th[i] - th0); out[i] = [out[i + 1][0] - ds * Math.cos(a), out[i + 1][1] - ds * Math.sin(a)]; }
    cache.set(key, out); return out;
  };
}
const sampleAt = (pts, s) => { const N = pts.length - 1, x = Math.min(N - 1e-9, Math.max(0, s * N)), i = Math.floor(x), f = x - i; return [pts[i][0] + f * (pts[i + 1][0] - pts[i][0]), pts[i][1] + f * (pts[i + 1][1] - pts[i][1])]; };
const FIG8 = bender((s) => [0.5 * Math.sin(2 * Math.PI * s), 0.34 * Math.sin(4 * Math.PI * s)]);
const sm = (x) => Math.min(1, Math.max(0, x));
/**
 * Tube bending: a section point (a, b) in the normal plane of a centreline of length Lc that is bent into an arc of total angle
 * 2π·t (a circle when t = 1); the section is rotated by φ inside its plane. Returns [x, y, z]; the bending happens in the
 * horizontal plane, so the closed ring lies flat.
 */
function bendTube(a, b, w, t, Lc, phi = 0) {
  const sig = Lc * (w - 0.5), ca = Math.cos(phi), sa = Math.sin(phi);
  const A = a * ca - b * sa, B = a * sa + b * ca; // rotated section coordinates (A along the binormal, B along the normal)
  if (t < 1e-5) return [sig, B, A];
  const rho = Lc / (2 * Math.PI * t), ang = sig / rho;
  const cz = rho * (1 - Math.sin(Math.PI * t) / (Math.PI * t)); // centroid shift keeps the picture centred
  // centreline in the (x, z) plane bending toward −z; normal points to the centre of curvature
  const px = rho * Math.sin(ang), pz = -rho * (1 - Math.cos(ang)) + cz;
  const nx = Math.sin(ang), nz = Math.cos(ang); // unit normal, perpendicular to the tangent (cos ang, −sin ang)
  return [px + B * nx, pz + B * nz, A]; // the closed ring lies in the horizontal plane
}
/**
 * The square folded toward the quotient `kind` at morph stage t ∈ [0,1] (two-step foldings use t ≤ ½ for the first gluing).
 * Returns F(u, w) → [x, y, z] with (u, w) the square's coordinates, so colours and walkers transfer exactly.
 */
export function folded(kind, t) {
  const t1 = sm(2 * t), t2 = sm(2 * t - 1);
  if (kind === 'cyl') return (u, w) => { const [a, b] = roll(u, sm(t), 3.6); return [a, 2.4 * (w - 0.5), b - 0.573 * sm(t)]; };
  if (kind === 'mob') return (u, w) => bendTube(0.9 * (w - 0.5), 0, u, sm(t), 2 * Math.PI * 0.8, Math.PI * sm(t) * (u - 0.5));
  if (kind === 'tor') return (u, w) => { const [a, b] = roll(u, t1, 2 * Math.PI * 0.36); return bendTube(a, b - 0.36 * t1, w, t2, 2 * Math.PI * 0.85); };
  if (kind === 'kln') return (u, w) => { const [a, b] = sampleAt(FIG8(t1), u); return bendTube(a, b, w, t2, 2 * Math.PI * 0.85, Math.PI * t2 * (w - 0.5)); };
  // rp2: square → disc → upper hemisphere (t ≤ ½), then a straight-line homotopy to the cross-cap Q(p) = (yz, 2xy, x² − y²)·k,
  // which is even (Q(−p) = Q(p)), so antipodal points of the boundary circle land on the same point.
  return (u, w) => {
    const X = 2 * u - 1, Y = 2 * w - 1, m = Math.max(Math.abs(X), Math.abs(Y)), r = Math.hypot(X, Y) || 1;
    const dx = (X * m) / r, dy = (Y * m) / r; // square → disc, boundary to boundary, antipodes to antipodes
    const x = X + t1 * (dx - X), y = Y + t1 * (dy - Y), z = t1 * Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy));
    const hx = dx, hy = dy, hz = Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy));
    const Q = [1.25 * hy * hz, 1.25 * 2 * hx * hy * 0.75, 1.25 * (hx * hx - hy * hy) * 0.75];
    const P = [x * 1.15, y * 1.15, z * 1.15 - 0.5 * t1];
    return P.map((c, i) => c + t2 * (Q[i] - c));
  };
}

// ------------------------------------------------------------------ 4. invariants of a glued grid
/**
 * Triangulate an n × m grid on the square, identify vertices by key(i, j) (a string or number after the gluing), and
 * compute V, E, F, χ = V − E + F, the number of boundary circles and orientability (by propagating an orientation across
 * shared edges). Triangles that collapse (two equal vertex keys) are dropped, as in a quotient that crushes a set; with
 * `dedupe`, triangles folded onto the same three vertices count once (for crushed regions).
 */
export function gridInvariants(n, m, key, { dedupe = false } = {}) {
  const id = new Map(), vid = (i, j) => { const k = key(i, j); if (!id.has(k)) id.set(k, id.size); return id.get(k); };
  const tris = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
    const a = vid(i, j), b = vid(i + 1, j), c = vid(i + 1, j + 1), d = vid(i, j + 1);
    for (const T of [[a, b, c], [a, c, d]]) if (T[0] !== T[1] && T[1] !== T[2] && T[0] !== T[2]) tris.push(T);
  }
  // dedupe triangles with the same vertex set (a crushed region can fold two triangles onto one)
  const seenT = new Map(); const T2 = [];
  for (const T of tris) { const k = [...T].sort((p, q) => p - q).join(','); if (!dedupe || !seenT.has(k)) { seenT.set(k, T2.length); T2.push(T); } }
  const edges = new Map();
  T2.forEach((T, ti) => { for (let e = 0; e < 3; e++) { const p = T[e], q = T[(e + 1) % 3], k = p < q ? p + ',' + q : q + ',' + p; if (!edges.has(k)) edges.set(k, []); edges.get(k).push([ti, p, q]); } });
  const usedV = new Set(); T2.forEach((T) => T.forEach((x) => usedV.add(x)));
  // boundary: edges in exactly one triangle; count circles by connected components of the boundary graph
  const bAdj = new Map();
  for (const [k, L] of edges) if (L.length === 1) { const [p, q] = k.split(',').map(Number); for (const [x, y] of [[p, q], [q, p]]) { if (!bAdj.has(x)) bAdj.set(x, []); bAdj.get(x).push(y); } }
  let circles = 0; const seenB = new Set();
  for (const s0 of bAdj.keys()) { if (seenB.has(s0)) continue; circles++; const st = [s0]; seenB.add(s0); while (st.length) { const x = st.pop(); for (const y of bAdj.get(x)) if (!seenB.has(y)) { seenB.add(y); st.push(y); } } }
  // orientability: sign[t] ∈ {±1}; across an edge shared by two triangles the traversal directions must be opposite
  const sign = new Array(T2.length).fill(0); let orientable = true, conflict = null;
  for (let s0 = 0; s0 < T2.length && orientable; s0++) {
    if (sign[s0]) continue; sign[s0] = 1; const st = [s0];
    while (st.length && orientable) {
      const t = st.pop();
      for (let e = 0; e < 3; e++) {
        const p = T2[t][e], q = T2[t][(e + 1) % 3], k = p < q ? p + ',' + q : q + ',' + p;
        for (const [u, a] of edges.get(k)) {
          if (u === t) continue;
          const want = a === p ? -sign[t] : sign[t]; // same direction ⇒ opposite signs
          if (!sign[u]) { sign[u] = want; st.push(u); } else if (sign[u] !== want) { orientable = false; conflict = k; break; }
        }
      }
    }
  }
  const V = usedV.size, E = edges.size, F = T2.length;
  return { V, E, F, chi: V - E + F, circles, orientable, conflict };
}
/** Vertex key for the grid of the glued square (i, j on an n × m grid). */
export function glueKey(kind, n, m) {
  const G = GLUE[kind];
  return (i, j) => {
    for (let k = 0; k < 2; k++) {
      if (G.x && i === n) { i = 0; if (G.x === 'flip') j = m - j; }
      if (G.y && j === m) { j = 0; if (G.y === 'flip') i = n - i; }
    }
    if (G.x && i === n) i = 0;
    return i * (m + 1) + j;
  };
}
/** Name of a compact surface from its invariants (χ, orientability, boundary circles). */
export function surfaceName({ chi, orientable, circles }) {
  if (orientable) {
    const g = (2 - chi - circles) / 2;
    const base = g === 0 ? 'sphere' : g === 1 ? 'torus' : `genus-${g} surface`;
    if (circles === 0) return base;
    if (g === 0 && circles === 1) return 'disc';
    if (g === 0 && circles === 2) return 'annulus (cylinder)';
    return `${base} with ${circles} holes`;
  }
  const k = 2 - chi - circles; // number of cross-caps
  const base = k === 1 ? 'projective plane' : k === 2 ? 'Klein bottle' : `sum of ${k} projective planes`;
  if (circles === 0) return base;
  if (k === 1 && circles === 1) return 'Möbius band';
  return `${base} with ${circles} holes`;
}

// ------------------------------------------------------------------ 5. drawing the glued square
/**
 * Draw the edges of the unit square on a 2D stage with the arrow labels of a gluing: the x-edges (left/right) in red with
 * single arrowheads, the y-edges (bottom/top) in teal with double arrowheads; a flipped pair points opposite ways; free
 * edges are plain. `o`: {x0, y0, size} place the square (default the unit square), `width`.
 */
export function drawGlueSquare(s, kind, o = {}) {
  const G = GLUE[kind], x0 = o.x0 ?? 0, y0 = o.y0 ?? 0, S = o.size ?? 1, w = o.width ?? 3, A = (o.head ?? 0.05) * S;
  const P = (u, v) => [x0 + S * u, y0 + S * v];
  const edge = (a, b, col, heads) => {
    s.line(...P(...a), ...P(...b), { color: col, width: w });
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), d = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], n = [-d[1], d[0]];
    for (let k = 0; k < heads; k++) {
      const t = 0.5 + (k - (heads - 1) / 2) * 0.1, m = P(a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]));
      s.poly([[m[0] + d[0] * A, m[1] + d[1] * A], [m[0] - d[0] * A * 0.6 + n[0] * A * 0.75, m[1] - d[1] * A * 0.6 + n[1] * A * 0.75], [m[0] - d[0] * A * 0.6 - n[0] * A * 0.75, m[1] - d[1] * A * 0.6 - n[1] * A * 0.75]], { fill: col, fillAlpha: 1, color: col, width: 1 });
    }
  };
  // left edge goes up; right edge goes up ('same') or down ('flip')
  edge([0, 0], [0, 1], G.x ? 'red' : 'muted', G.x ? 1 : 0);
  if (G.x === 'flip') edge([1, 1], [1, 0], 'red', 1); else edge([1, 0], [1, 1], G.x ? 'red' : 'muted', G.x ? 1 : 0);
  edge([0, 0], [1, 0], G.y ? 'teal' : 'muted', G.y ? 2 : 0);
  if (G.y === 'flip') edge([1, 1], [0, 1], 'teal', 2); else edge([0, 1], [1, 1], G.y ? 'teal' : 'muted', G.y ? 2 : 0);
}
