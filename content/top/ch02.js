// Topology — Chapter 2: Continuity, products and quotients (items 2.1–2.8; 2.9–2.15 in ch02-b.js, 2.16–2.22 in ch02-c.js)
import { pc, inF, members, famOf, setOf, setTex, psFrom, psUnion, psInter, psComp, psClos, psInt, psEq, psTex, psHas, drawPSet, EMPTYSET } from './ch01.shared.js';
import { preimage, badPreimages, allMaps, plPre, plImg, plDraw, psEmpty } from './ch02.shared.js';

const TAU = 2 * Math.PI;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const snap = (x, h = 0.05) => Math.round(x / h) * h;

// ------------------------------------------------------------------ finite spaces on three points
const TOP3 = {
  disc: { label: 'discrete', F: (1 << 8) - 1 },
  chain: { label: 'chain', F: famOf([0, setOf([1]), setOf([1, 2]), 7]) },
  sier: { label: 'one open point', F: famOf([0, setOf([1]), 7]) },
  vee: { label: 'two open points', F: famOf([0, setOf([1]), setOf([2]), setOf([1, 2]), 7]) },
  part: { label: 'partition', F: famOf([0, setOf([1]), setOf([2, 3]), 7]) },
  ind: { label: 'indiscrete', F: famOf([0, 7]) },
};
const LETTERS = ['a', 'b', 'c'];
const yTex = (m) => { if (!m) return '\\varnothing'; const el = []; for (let i = 0; i < 3; i++) if (m & (1 << i)) el.push(LETTERS[i]); return '\\{' + el.join(',') + '\\}'; };
/** Rounded hull of the points of a subset (offset by r), as a polygon. */
function blob(v, P, m, r) {
  const pts = [];
  for (let i = 0; i < P.length; i++) if (m & (1 << i)) for (let k = 0; k < 24; k++) pts.push([P[i][0] + r * Math.cos((TAU * k) / 24), P[i][1] + r * Math.sin((TAU * k) / 24)]);
  return v.M.hull(pts);
}
/** Draw an exact subset of ℝ (intervals and points only) on a vertical line x = x0. */
function drawVSet(s, A, x0, { color = 'accent', lo, hi, width = 5 } = {}) {
  lo = lo ?? s.bounds.y[0]; hi = hi ?? s.bounds.y[1];
  const k = A.bp.length;
  for (let i = 0; i <= k; i++) {
    if (!A.pc[i]) continue;
    const a = Math.max(i === 0 ? -Infinity : A.bp[i - 1], lo), b = Math.min(i === k ? Infinity : A.bp[i], hi);
    if (b > a) s.line(x0, a, x0, b, { color, width, cap: 'butt' });
  }
  for (let i = 0; i < k; i++) {
    const y = A.bp[i]; if (y < lo || y > hi) continue;
    if (A.pt[i]) s.dot(x0, y, { r: 4.2, color });
    else if (A.pc[i] || A.pc[i + 1]) s.dot(x0, y, { r: 4.2, hollow: true, color });
  }
}
const fmtR = (x) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : (Math.round(x * 100) / 100).toString()).replace('-', '−');

// piecewise-linear test functions for 2.2
const PL = {
  cont: { label: 'continuous', f: { pieces: [[-Infinity, -1, -0.8, -0.3], [-1, 1, 0.5, 1.0], [1, Infinity, -1.2, 2.7]], pts: [[-1, 0.5], [1, 1.5]] } },
  jump: { label: 'jump at 1', f: { pieces: [[-Infinity, 1, 0.45, -0.25], [1, Infinity, 0.45, 0.75]], pts: [[1, 0.2]] } },
  floor: { label: '$\\lfloor x\\rfloor$', f: { pieces: [[-Infinity, -2, 0, -3], [-2, -1, 0, -2], [-1, 0, 0, -1], [0, 1, 0, 0], [1, 2, 0, 1], [2, Infinity, 0, 2]], pts: [[-2, -2], [-1, -1], [0, 0], [1, 1], [2, 2]] } },
  sign: { label: '$\\operatorname{sgn} x$', f: { pieces: [[-Infinity, 0, 0, -1], [0, Infinity, 0, 1]], pts: [[0, 0]] } },
};

// ------------------------------------------------------------------ the coffee mug (2.3)
// The mug is the boundary of a solid torus: a cup body (surface of revolution, a sphere) with two small discs removed at the
// handle's feet, plus a tube along the handle. The body is parametrised by bipolar coordinates whose poles are the two feet
// (a Möbius transformation of the stereographic coordinate), so the body minus the feet is an annulus (u, σ) exactly like
// half of a torus. Both surfaces share the parameter square (U, V) ∈ [0,1]², and the morph is the straight-line homotopy.
function makeMug(M) {
  // cup profile (ρ, z): bottom centre → outer bottom → outer wall → rim → inner wall → inner bottom centre; rounded corners
  const corners = [[0, -0.95], [0.78, -0.95], [0.82, 0.78], [0.66, 0.78], [0.63, -0.72], [0, -0.72]];
  const prof = [];
  const R0 = [0, 0.09, 0.06, 0.06, 0.09, 0];
  for (let i = 0; i < corners.length; i++) {
    const P = corners[i];
    if (i === 0 || i === corners.length - 1) { prof.push(P); continue; }
    const A = corners[i - 1], B = corners[i + 1], r = R0[i];
    const da = M.normalize(M.vsub(A, P)), db = M.normalize(M.vsub(B, P));
    const p0 = M.vadd(P, M.vscale(da, r)), p1 = M.vadd(P, M.vscale(db, r));
    for (let k = 0; k <= 6; k++) { const t = k / 6; prof.push([(1 - t) * (1 - t) * p0[0] + 2 * t * (1 - t) * P[0] + t * t * p1[0], (1 - t) * (1 - t) * p0[1] + 2 * t * (1 - t) * P[1] + t * t * p1[1]]); }
  }
  const cum = [0]; for (let i = 1; i < prof.length; i++) cum.push(cum[i - 1] + Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]));
  const Ltot = cum[cum.length - 1];
  const at = (s) => { const L = clamp(s, 0, 1) * Ltot; let j = 0; while (j < cum.length - 2 && cum[j + 1] < L) j++; const f = (L - cum[j]) / (cum[j + 1] - cum[j] || 1); return [prof[j][0] + f * (prof[j + 1][0] - prof[j][0]), prof[j][1] + f * (prof[j + 1][1] - prof[j][1])]; };
  const body = (s, phi) => { const [r, z] = at(s); return [r * Math.cos(phi), r * Math.sin(phi), z]; };
  // arc-length parameter of the two feet on the outer wall
  const sOf = (zt) => { let lo = cum[2] / Ltot, hi = cum[9] / Ltot; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (at(m)[1] < zt) lo = m; else hi = m; } return (lo + hi) / 2; };
  const sA = sOf(0.42), sB = sOf(-0.5);
  const a = Math.tan((Math.PI * sA) / 2), b = Math.tan((Math.PI * sB) / 2);
  // w = (z − a)/(z − b); inverse z = (a − b w)/(1 − w); polar angle 2·atan|z| ↦ s, arg z ↦ φ
  const fromW = (tau, sig) => {
    const wr = Math.exp(tau) * Math.cos(sig), wi = Math.exp(tau) * Math.sin(sig);
    const nr = a - b * wr, ni = -b * wi, dr = 1 - wr, di = -wi, dd = dr * dr + di * di;
    const zr = (nr * dr + ni * di) / dd, zi = (ni * dr - nr * di) / dd;
    return body((2 * Math.atan(Math.hypot(zr, zi))) / Math.PI, Math.atan2(zi, zr));
  };
  const A = body(sA, 0), B = body(sB, 0);
  const rh = 0.115;
  const meanR = (tau, P) => { let s = 0; for (let k = 0; k < 16; k++) s += M.dist(fromW(tau, (TAU * k) / 16), P); return s / 16; };
  const solveTau = (P, sgn) => { let lo = -12, hi = 0; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (meanR(sgn * m, P) > rh) hi = m; else lo = m; } return sgn * ((lo + hi) / 2); };
  const tA = solveTau(A, 1), tB = solveTau(B, -1);
  // handle core: from B (bottom foot) out to the right and back into A (top foot)
  const zc = (A[2] + B[2]) / 2, hz = (A[2] - B[2]) / 2, xr = A[0];
  const core = (u) => { const th = -Math.PI / 2 + Math.PI * u; return [xr + 0.66 * Math.cos(th), 0, zc + hz * Math.sin(th)]; };
  const tang = (u) => { const th = -Math.PI / 2 + Math.PI * u; return M.normalize([-0.66 * Math.sin(th), 0, hz * Math.cos(th)]); };
  const n1 = [0, 1, 0];
  const n2 = (u) => M.cross3(tang(u), n1);
  // body coordinates (q, V) ∈ [0,1]²: q reparametrises τ by arc length (averaged over σ) and, on each level circle, V
  // reparametrises σ by arc length — the bipolar coordinates crowd the far side of the cup into a tiny σ-range otherwise
  const NT = 300, cumT = [0];
  for (let k = 1; k <= NT; k++) { let d = 0; for (let j = 0; j < 8; j++) d += M.dist(fromW(tA + ((tB - tA) * k) / NT, (TAU * j) / 8), fromW(tA + ((tB - tA) * (k - 1)) / NT, (TAU * j) / 8)); cumT.push(cumT[k - 1] + d / 8); }
  const tauOf = (q) => { const L = q * cumT[NT]; let k = 0; while (k < NT - 1 && cumT[k + 1] < L) k++; const f = (L - cumT[k]) / (cumT[k + 1] - cumT[k] || 1); return tA + ((tB - tA) * (k + f)) / NT; };
  const NQ = 60, NS = 240, tab = [];
  for (let k = 0; k <= NQ; k++) {
    const tau = tauOf(k / NQ), cum = [0]; let prev = fromW(tau, 0);
    for (let j = 1; j <= NS; j++) { const p = fromW(tau, (TAU * j) / NS); cum.push(cum[j - 1] + M.dist(p, prev)); prev = p; }
    const row = []; let j = 0;
    for (let i = 0; i <= NS; i++) { const L = (cum[NS] * i) / NS; while (j < NS - 1 && cum[j + 1] < L) j++; row.push((TAU * (j + (L - cum[j]) / (cum[j + 1] - cum[j] || 1))) / NS); }
    tab.push(row);
  }
  const sigOf = (q, V) => {
    const x = clamp(q, 0, 1) * NQ, k = Math.min(NQ - 1, Math.floor(x)), f = x - k, y = (((V % 1) + 1) % 1) * NS, i = Math.min(NS - 1, Math.floor(y)), g = y - i;
    const r0 = tab[k][i] + g * (tab[k][i + 1] - tab[k][i]), r1 = tab[k + 1][i] + g * (tab[k + 1][i + 1] - tab[k + 1][i]);
    return r0 + f * (r1 - r0);
  };
  const bodyPt = (q, V) => fromW(tauOf(q), sigOf(q, V));
  // phase of the foot circles in the tube frame, so the blend does not twist
  const phaseAt = (P, q, u) => { const d = M.vsub(bodyPt(q, 0), P), d2 = M.vsub(bodyPt(q, 0.05), P); const N2 = n2(u); const a0 = Math.atan2(M.dot(d, N2), M.dot(d, n1)), a1 = Math.atan2(M.dot(d2, N2), M.dot(d2, n1)); const dir = Math.sign(Math.sin(a1 - a0)) || 1; return { a0, dir }; };
  const phB = phaseAt(B, 1, 0), phA = phaseAt(A, 0, 1);
  let dA = phA.a0 - phB.a0; while (dA > Math.PI) dA -= TAU; while (dA < -Math.PI) dA += TAU;
  const handle = (u, V) => {
    const ph = phB.a0 + phB.dir * TAU * V + dA * u, P = core(u), N2 = n2(u);
    const tube = [0, 1, 2].map((i) => P[i] + rh * (Math.cos(ph) * n1[i] + Math.sin(ph) * N2[i]));
    const e = 0.14;
    if (u < e) { const k = M.smoothstep(u / e), J = bodyPt(1, V); return J.map((c, i) => c + k * (tube[i] - c)); }
    if (u > 1 - e) { const k = M.smoothstep((1 - u) / e), J = bodyPt(0, V); return J.map((c, i) => c + k * (tube[i] - c)); }
    return tube;
  };
  // full mug on the square: U ∈ [0, 0.62] body from A to B, U ∈ [0.62, 1] handle from B back to A
  const SPLIT = 0.62;
  const mug = (U, V) => (U <= SPLIT ? bodyPt(U / SPLIT, V) : handle((U - SPLIT) / (1 - SPLIT), V));
  // the doughnut on the same square: core circle in the xz-plane, the body half on the left, phase matched at U = 0
  const R = 0.78, r = 0.3, cx = 0.15;
  const d0 = M.vsub(mug(0, 0), A), d1 = M.vsub(mug(0, 0.05), A);
  const a0 = Math.atan2(d0[1], d0[2]), a1 = Math.atan2(d1[1], d1[2]);
  const vdir = Math.sign(Math.sin(a1 - a0)) || 1;
  const torus = (U, V) => {
    const th = Math.PI / 2 + (U <= SPLIT ? (Math.PI * U) / SPLIT : Math.PI + (Math.PI * (U - SPLIT)) / (1 - SPLIT)); // top of the ring at U = 0, body half on the left
    const ex = [Math.cos(th), 0, Math.sin(th)];
    const ph = a0 + vdir * TAU * V; // angle measured from the radial direction toward +y, like the mug's foot
    const rad = Math.cos(ph), yy = Math.sin(ph);
    return [cx + R * ex[0] + r * rad * ex[0], r * yy, R * ex[2] + r * rad * ex[2]];
  };
  return { mug, torus };
}

export default {
  collection: 'top',
  chapter: 2,
  title: 'Continuity, products and quotients',
  summary: String.raw`A map is continuous when it pulls open sets back to open sets — a definition that needs no distances and that can be tested by hand on finite spaces. Homeomorphisms are the isomorphisms of topology, and they are subtler than continuous bijections. Products and quotients are the two basic constructions, each pinned down by a universal property: maps into a product are continuous coordinate by coordinate, and maps out of a quotient are continuous exactly when they respect the identifications. Gluing the edges of a square produces the cylinder, the Möbius band, the torus, the Klein bottle and the projective plane; quotients also produce cones, suspensions, attached cells, orbit spaces — and the line with two origins, a locally Euclidean space that is not Hausdorff.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Continuous map',
      statement: String.raw`A function $f\colon X\to Y$ between topological spaces is **continuous** if for every open set $V\subset Y$ the preimage
$$f^{-1}(V)=\{x\in X: f(x)\in V\}$$
is open in $X$. It is **continuous at** $x$ if for every open $V\ni f(x)$ there is an open $U\ni x$ with $f(U)\subset V$; $f$ is continuous iff it is continuous at every point. For metric spaces this is the $\varepsilon$–$\delta$ definition (Rudin 4.8).`,
      idea: String.raw`Preimages commute with unions, intersections and complements, so the condition only has to be checked on a basis (or subbasis) of $Y$. Two extremes make the definition vivid: every map *out of* a discrete space and every map *into* an indiscrete space is continuous, while a map from an indiscrete space to a space where points can be separated is continuous only if it is constant on the pieces the target can tell apart. Composition is continuous because $(g\circ f)^{-1}(W)=f^{-1}(g^{-1}(W))$.`,
      caption: String.raw`Two three-point spaces, with their open sets drawn as rounded outlines. **Click a point of $X$** to send it to the next point of $Y$; click a row on the right to highlight that open set $V$ and its preimage (green when open in $X$, red when not). Change the topologies and watch the count of continuous maps among all $27$.`,
      deps: ['top-1.1', 'pma-4.8'],
      see: ['rca-1.2'],
      refs: ['Munkres §18'],
      tags: ['continuity', 'finite spaces'],
      viz(v) {
        const opts = Object.entries(TOP3).map(([value, o]) => ({ value, label: o.label }));
        const tx = v.select('$\\tau_X$', opts, 'chain');
        const ty = v.select('$\\tau_Y$', opts, 'sier');
        const PX = [[1.5, 3.75], [0.85, 1.45], [2.45, 1.05]], PY = [[6.15, 3.75], [5.5, 1.45], [7.1, 1.05]];
        let f = [1, 0, 1], sel = 1, cnt = null, ckey = '';
        const L = v.stage({ x: [0, 8], y: [0, 5], equal: true, axes: false, height: 340, weight: 1.15, title: '$f\\colon X\\to Y$ — click a point of $X$' });
        const Rt = v.stage({ x: [0, 10], y: [0, 9], axes: false, height: 340, title: 'open sets of $Y$, preimages, and all 27 maps' });
        const MAPS = allMaps(3, 3), TW = 9.4 / 9, TH = 0.82, TY0 = 0.25;
        L.onClick((x, y) => { let best = -1, bd = 0.6; PX.forEach((p, i) => { const d = Math.hypot(x - p[0], y - p[1]); if (d < bd) { bd = d; best = i; } }); if (best >= 0) f[best] = (f[best] + 1) % 3; });
        Rt.onClick((x, y) => {
          if (y < TY0 + 3 * TH) { const c = Math.floor((x - 0.3) / TW), r = 2 - Math.floor((y - TY0) / TH); if (c >= 0 && c < 9 && r >= 0 && r < 3) f = MAPS[r * 9 + c].slice(); return; }
          const V = members(TOP3[ty.value].F, 3); const i = Math.floor((8.75 - y) / 0.62); if (i >= 0 && i < V.length) sel = V[i];
        });
        v.button('constant map', () => { f = [0, 0, 0]; });
        v.button('“identity” 1↦a, 2↦b, 3↦c', () => { f = [0, 1, 2]; });
        v.render(() => {
          const FX = TOP3[tx.value].F, FY = TOP3[ty.value].F, VY = members(FY, 3);
          if (!VY.includes(sel)) sel = VY.find((m) => m && m !== 7) ?? 7;
          const bad = badPreimages(f, FX, FY, 3);
          const key = tx.value + ty.value;
          if (key !== ckey) { ckey = key; cnt = allMaps(3, 3).filter((g) => badPreimages(g, FX, FY, 3).length === 0).length; }
          // open sets as outlines (largest first)
          const draw = (P, F, hi, hiCol) => {
            const ms = members(F, 3).filter((m) => m).sort((p, q) => pc(q) - pc(p));
            for (const m of ms) { const poly = blob(v, P, m, 0.3 + 0.17 * (pc(m) - 1)); L.poly(poly, { color: 'muted', width: 1.1, alpha: 0.55, fill: 'faint', fillAlpha: 0.07 }); }
            if (hi) L.poly(blob(v, P, hi, 0.26 + 0.17 * (pc(hi) - 1)), { color: hiCol, width: 2.4, fill: hiCol, fillAlpha: 0.2 });
          };
          const pre = preimage(f, sel), preOpen = inF(FX, pre);
          draw(PX, FX, pre, preOpen ? 'green' : 'red');
          draw(PY, FY, sel, 'accent');
          // arrows
          for (let i = 0; i < 3; i++) {
            const p = PX[i], q = PY[f[i]], d = Math.hypot(q[0] - p[0], q[1] - p[1]), ux = (q[0] - p[0]) / d, uy = (q[1] - p[1]) / d;
            L.arrow(p[0] + 0.22 * ux, p[1] + 0.22 * uy, q[0] - 0.24 * ux, q[1] - 0.24 * uy, { color: 'gold', width: 2, head: 8, alpha: 0.9 });
          }
          PX.forEach((p, i) => L.dot(p[0], p[1], { r: 7, color: 'ink', label: String(i + 1), labelPos: i === 0 ? 'n' : 's' }));
          PY.forEach((p, i) => L.dot(p[0], p[1], { r: 7, color: 'ink', label: LETTERS[i], labelPos: i === 0 ? 'n' : 's' }));
          L.text('X', 1.4, 4.75, { math: true, size: 18, color: 'muted', align: 'center' });
          L.text('Y', 6.5, 4.75, { math: true, size: 18, color: 'muted', align: 'center' });
          // table of open sets
          VY.forEach((V, i) => {
            const y = 8.45 - 0.62 * i, P = preimage(f, V), ok = inF(FX, P);
            if (V === sel) Rt.rect(0.2, y - 0.29, 9.8, y + 0.29, { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1, radius: 6 });
            Rt.tex(`V=${yTex(V)}`, 0.5, y, { align: 'left', size: 13, color: V === sel ? 'accent' : 'ink' });
            Rt.tex(`f^{-1}(V)=${setTex(P, 3)}`, 4.0, y, { align: 'left', size: 13, color: ok ? 'green' : 'red' });
            Rt.text(ok ? '✓ open' : '✗ not open', 9.7, y, { align: 'right', size: 11.5, color: ok ? 'green' : 'red', weight: 600 });
          });
          // all 27 maps as tiles (images of 1, 2, 3), green = continuous
          Rt.text('every map X → Y (images of 1, 2, 3) — click one', 0.3, TY0 + 3 * TH + 0.32, { size: 11, color: 'muted' });
          MAPS.forEach((g, k) => {
            const r = Math.floor(k / 9), c = k % 9, x0 = 0.3 + c * TW, y0 = TY0 + (2 - r) * TH, ok = badPreimages(g, FX, FY, 3).length === 0, cur = g.every((x, i) => x === f[i]);
            Rt.rect(x0 + 0.05, y0 + 0.06, x0 + TW - 0.05, y0 + TH - 0.06, { radius: 4, fill: ok ? 'green' : 'red', fillAlpha: cur ? 0.45 : 0.14, color: cur ? 'ink' : ok ? 'green' : 'red', width: cur ? 2 : 0.8 });
            Rt.text(g.map((x) => LETTERS[x]).join(''), x0 + TW / 2, y0 + TH / 2, { size: 11, color: 'ink', align: 'center', math: true });
          });
          L.corner(bad.length ? 'not continuous' : 'continuous', 'tl', { color: bad.length ? 'red' : 'green', weight: 600, size: 13 });
          L.corner(`${cnt} of 27 maps X → Y are continuous`, 'bl', { size: 11.5 });
        });
        v.legend([['accent', 'chosen open $V\\subset Y$', { area: true }], ['green', 'preimage open in $X$', { area: true }], ['red', 'preimage not open', { area: true }], ['muted', 'open sets', { area: true }]]);
        v.readout(() => {
          const FX = TOP3[tx.value].F, FY = TOP3[ty.value].F, bad = badPreimages(f, FX, FY, 3);
          const map = `$f: 1\\mapsto ${LETTERS[f[0]]},\\ 2\\mapsto ${LETTERS[f[1]]},\\ 3\\mapsto ${LETTERS[f[2]]}$`;
          if (!bad.length) return `${map} is **continuous**: all ${members(FY, 3).length} open sets of $Y$ pull back to open sets of $X$.`;
          return `${map} is **not continuous**: ${bad.map((V) => `$f^{-1}(${yTex(V)})=${setTex(preimage(f, V), 3)}$`).join(', ')} ${bad.length > 1 ? 'are' : 'is'} not open in $X$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'Equivalent forms of continuity',
      statement: String.raw`For a function $f\colon X\to Y$ between topological spaces the following are equivalent:

(i) $f$ is continuous (preimages of open sets are open);

(ii) preimages of closed sets are closed;

(iii) $f(\overline A)\subset\overline{f(A)}$ for every $A\subset X$;

(iv) for every $x\in X$ and every neighbourhood $V$ of $f(x)$ there is a neighbourhood $U$ of $x$ with $f(U)\subset V$.

For first-countable $X$ (metric spaces, say) they are also equivalent to sequential continuity: $x_n\to x$ implies $f(x_n)\to f(x)$.`,
      idea: String.raw`(i)⇔(ii) because $f^{-1}(Y\setminus C)=X\setminus f^{-1}(C)$. For (ii)⇒(iii), $f^{-1}(\overline{f(A)})$ is closed and contains $A$, hence contains $\overline A$. For (iii)⇒(ii), apply (iii) to $A=f^{-1}(C)$: $f(\overline A)\subset\overline C=C$, so $\overline A\subset A$. (i)⇔(iv) is the local form: an open set is one that is a neighbourhood of each of its points. The picture computes all three global tests exactly, for sets of reals with finitely many endpoints.`,
      caption: String.raw`Pick a function and a test. **Open / closed**: drag the ends of the blue interval $V$ on the left edge; its preimage is drawn on the bottom line, with the points that spoil openness (or closedness) in red. **Closure**: drag the ends of $A$ on the bottom line; the right edge compares $f(\overline A)$ (orange) with $\overline{f(A)}$ (green). Try $V=(-\tfrac12,\tfrac12)$ for $\lfloor x\rfloor$, and $A=(0,1)$.`,
      deps: ['top-2.1', 'top-1.8', 'top-1.14'],
      refs: ['Munkres §18'],
      tags: ['continuity', 'closure'],
      viz(v) {
        const fs = v.select('$f$', Object.entries(PL).map(([value, o]) => ({ value, label: o.label })), 'jump');
        const crit = v.select('test', [{ value: 'open', label: 'open preimages' }, { value: 'closed', label: 'closed preimages' }, { value: 'clos', label: '$f(\\overline A)\\subset\\overline{f(A)}$' }], 'open');
        const s = v.stage({ x: [-2.6, 2.6], y: [-1.9, 2.7], height: 380, full: true, axes: 'box', gutter: true, xlabel: 'x', ylabel: 'f(x)' });
        const XV = -2.45, YA = -1.65, XI = 2.42;
        const v0 = s.handle(XV, -0.1, { color: 'accent', constrain: (x, y) => [XV, clamp(snap(y), -1.8, 2.6)] });
        const v1 = s.handle(XV, 0.5, { color: 'accent', constrain: (x, y) => [XV, clamp(snap(y), -1.8, 2.6)] });
        const a0 = s.handle(1.0, YA, { color: 'orange', constrain: (x, y) => [clamp(snap(x), -2.5, 2.5), YA] });
        const a1 = s.handle(1.5, YA, { color: 'orange', constrain: (x, y) => [clamp(snap(x), -2.5, 2.5), YA] });
        let st = null;
        v.render(() => {
          const f = PL[fs.value].f, mode = crit.value;
          v0.visible = v1.visible = mode !== 'clos'; a0.visible = a1.visible = mode === 'clos';
          s.hline(YA, { color: 'faint', width: 1 });
          if (mode !== 'clos') {
            const c = Math.min(v0.y, v1.y), d = Math.max(v0.y, v1.y);
            const V = psFrom([[c, d, 3, mode === 'closed', mode === 'closed']]);
            s.hband(c, d, { color: 'accent', alpha: 0.1 });
            s.line(XV, c, XV, d, { color: 'accent', width: 5, cap: 'butt' });
            const P = plPre(f, V), good = mode === 'open' ? psInt(P) : P, ideal = mode === 'open' ? P : psClos(P);
            const badSet = mode === 'open' ? psInter(P, psComp(psInt(P))) : psInter(psClos(P), psComp(P));
            plDraw(s, f, -2.6, 2.6, { color: 'ink', width: 2.2 });
            s.vband(-9, 9, { alpha: 0 });
            // shade the preimage columns
            drawPSet(s, P, YA, { color: 'green', labels: false });
            const bpts = []; const B = badSet; for (let i = 0; i < B.bp.length; i++) if (B.pt[i] || B.pc[i] || B.pc[i + 1]) bpts.push(B.bp[i]);
            for (const x of bpts) { s.vline(x, { color: 'red', width: 1.2, dash: [4, 4], alpha: 0.7 }); s.dot(x, YA, { r: 6, color: 'red', hollow: !psHas(P, x) }); }
            st = { mode, P, ok: bpts.length === 0, bpts, V, ideal, good };
          } else {
            const lo = Math.min(a0.x, a1.x), hi = Math.max(a0.x, a1.x);
            const A = psFrom([[lo, hi, 3, false, false]]), cA = psClos(A);
            const fcA = plImg(f, cA), cfA = psClos(plImg(f, A)), extra = psInter(fcA, psComp(cfA));
            s.vband(lo, hi, { color: 'orange', alpha: 0.08 });
            plDraw(s, f, -2.6, 2.6, { color: 'ink', width: 2.2 });
            drawPSet(s, A, YA, { color: 'orange', labels: false });
            s.dot(lo, YA, { r: 4.2, hollow: true, color: 'orange' }); s.dot(hi, YA, { r: 4.2, hollow: true, color: 'orange' });
            drawVSet(s, cfA, XI, { color: 'green', width: 9 });
            drawVSet(s, fcA, XI - 0.17, { color: 'orange', width: 4 });
            s.text('f(Ā)', XI - 0.17, 2.5, { size: 11, color: 'orange', align: 'center' }); s.text('cl f(A)', XI + 0.02, 2.3, { size: 11, color: 'green', align: 'center' });
            const bad = []; for (let i = 0; i < extra.bp.length; i++) if (extra.pt[i]) bad.push(extra.bp[i]);
            for (const y of bad) { s.hline(y, { color: 'red', width: 1.2, dash: [4, 4], alpha: 0.7 }); s.dot(XI - 0.17, y, { r: 6.5, color: 'red' }); }
            st = { mode, A, cA, fcA, cfA, ok: bad.length === 0, bad };
          }
        });
        v.legend([['ink', 'graph of $f$ (hollow = not the value)'], ['accent', 'test set $V$', { area: true }], ['green', 'preimage / $\\overline{f(A)}$'], ['orange', '$A$ and $f(\\overline A)$'], ['red', 'where the test fails', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          if (st.mode === 'open') return `$V=${psTex(st.V, fmtR)}$, $f^{-1}(V)=${psTex(st.P, fmtR)}$ — ${st.ok ? '**open** ✓' : `**not open**: no interval around $x=${st.bpts.map(fmtR).join(',')}$ stays inside`}.`;
          if (st.mode === 'closed') return `$C=${psTex(st.V, fmtR)}$, $f^{-1}(C)=${psTex(st.P, fmtR)}$ — ${st.ok ? '**closed** ✓' : `**not closed**: it misses its limit point${st.bpts.length > 1 ? 's' : ''} $${st.bpts.map(fmtR).join(',')}$`}.`;
          return `$\\overline A=${psTex(st.cA, fmtR)}$, $f(\\overline A)=${psTex(st.fcA, fmtR)}$, $\\overline{f(A)}=${psTex(st.cfA, fmtR)}$ — ${st.ok ? 'inclusion **holds** ✓' : `**fails**: $${st.bad.map(fmtR).join(',')}\\in f(\\overline A)\\setminus\\overline{f(A)}$`}. ${PL[fs.value].label === 'continuous' ? '' : 'All three tests fail together or pass together.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Definition',
      name: 'Homeomorphism',
      statement: String.raw`A **homeomorphism** is a bijection $f\colon X\to Y$ such that both $f$ and $f^{-1}$ are continuous; equivalently, a bijection with $f(U)$ open exactly when $U$ is open. Spaces related by a homeomorphism are **homeomorphic**, $X\cong Y$. A property preserved by homeomorphisms (compactness, connectedness, being Hausdorff, the number of components, …) is a **topological property**.`,
      idea: String.raw`A homeomorphism is a renaming of points that carries the topology along: open sets correspond to open sets, so everything defined from open sets corresponds too. Distances, angles and straightness are *not* preserved — the surface of a doughnut and of a one-handled mug are homeomorphic because one can be deformed into the other, and the grid painted on the surface shows the deformation as a bijection that never tears (continuity) and never glues two points (injectivity). Homeomorphism is about the spaces themselves, not about how they sit in $\R^3$.`,
      caption: String.raw`Slide **deform** from the doughnut to the mug. Both surfaces are parametrized by the same square $(U,V)$: the mug is a cup body (a sphere) with the two feet of the handle cut out — coordinates with the feet as poles make it half of a torus — plus a tube for the handle; the morph is the straight-line homotopy. The readout monitors tearing (longest grid edge) and gluing (closest pair of grid points that are far apart on the square). Drag to rotate.`,
      deps: ['top-2.1'],
      refs: ['Munkres §18'],
      tags: ['homeomorphism'],
      viz(v) {
        const M = v.M, S3 = makeMug(M);
        const t = v.slider('deform', 0, 1, 0.55, { step: 0.01 });
        const grid = v.toggle('grid lines', true);
        const S = v.stage3d({ range: 1.25, height: 420, yaw: -0.95, pitch: 0.45, axes: false, full: true });
        const F = (U, V) => { const a = S3.torus(U, V), b = S3.mug(U, V), k = t.value; return [0, 1, 2].map((i) => a[i] + k * (b[i] - a[i])); };
        // tearing / gluing monitor on a coarse grid
        const NU = 40, NV = 16;
        let mon = null, mkey = -1;
        const monitor = () => {
          const P = []; for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) P.push(F(i / NU, j / NV));
          let maxEdge = 0, minFar = Infinity;
          for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
            const p = P[i * NV + j];
            maxEdge = Math.max(maxEdge, M.dist(p, P[((i + 1) % NU) * NV + j]), M.dist(p, P[i * NV + ((j + 1) % NV)]));
            for (let k = i * NV + j + 1; k < P.length; k++) {
              const i2 = Math.floor(k / NV), j2 = k % NV, di = Math.min(Math.abs(i2 - i), NU - Math.abs(i2 - i)), dj = Math.min(Math.abs(j2 - j), NV - Math.abs(j2 - j));
              if (di <= 3 && dj <= 3) continue;
              const d = M.dist(p, P[k]); if (d < minFar) minFar = d;
            }
          }
          return { maxEdge, minFar };
        };
        v.render(() => {
          const pal = ['blue', 'teal', 'gold', 'orange'].map((c) => v.rgb(c));
          S.surface(F, [0, 1], [0, 1], {
            nu: 140, nv: 40, alpha: 0.97, wire: grid.value, wireColor: 'ink',
            colorFn: (U, V) => { const w = (U * 4) % 1, k = Math.floor(U * 4), c0 = pal[k % 4], c1 = pal[(k + 1) % 4]; const sh = ((Math.floor(U * 30) + Math.floor(V * 12)) & 1) ? 0.86 : 1; return [0, 1, 2].map((i) => sh * (c0[i] + w * (c1[i] - c0[i]))); },
          });
          const key = Math.round(t.value * 100);
          if (key !== mkey) { mkey = key; mon = monitor(); }
        });
        v.readout(() => mon ? `deform $=${v.fix(t.value, 2)}$: longest grid edge $${v.fix(mon.maxEdge, 3)}$ (bounded: **no tearing**), closest pair of grid points that are $\\ge 4$ cells apart on the square $${v.fix(mon.minFar, 3)}>0$ (**no gluing**). The same $(U,V)$ labels every point at every stage, so the end map doughnut → mug is a bijection, continuous both ways.` : '');
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Proposition',
      name: 'A continuous bijection need not be a homeomorphism',
      statement: String.raw`The map $f\colon[0,1)\to S^1$, $f(t)=(\cos 2\pi t,\sin 2\pi t)$, is a continuous bijection whose inverse is not continuous at $(1,0)=f(0)$. Hence $[0,1)$ and $S^1$ are not homeomorphic through $f$ (in fact not at all: removing a point disconnects $[0,1)$ only if it is interior, while $S^1$ minus any point is connected).`,
      idea: String.raw`$f$ is continuous because its coordinates are, and it is a bijection because $2\pi t$ runs through $[0,2\pi)$ exactly once. The inverse $g=f^{-1}$ fails at $(1,0)$: the set $[0,\tfrac14)$ is open in $[0,1)$, but $f([0,\tfrac14))$ is not open in $S^1$ — every arc around $(1,0)$ contains points just below it, which come from $t$ near $1$. Equivalently, points $z_k\to(1,0)$ from below have $g(z_k)\to1\ne0=g(1,0)$. The domain $[0,1]$ would cure the problem (a continuous bijection from a compact space to a Hausdorff space is a homeomorphism), but then $f$ is no longer injective.`,
      caption: String.raw`Left: the interval, rolled up by the **roll** slider ($1$ is the hollow end). Right: drag the arc centre $p$ on the circle and its width; its preimage under $f$ is coloured green on the interval. Put the arc over $(1,0)$: one arc downstairs, two far-apart pieces upstairs. The gold points $z_k\to(1,0)$ have $g(z_k)\to1$. Switch the domain to $[0,1]$ to see injectivity fail instead.`,
      deps: ['top-2.3'],
      refs: ['Munkres §18'],
      tags: ['homeomorphism', 'counterexample'],
      viz(v) {
        const rollT = v.slider('roll', 0, 1, 0.72, { step: 0.01 });
        const w = v.slider('arc half-width (turns)', 0.01, 0.2, 0.08, { step: 0.005 });
        const dom = v.select('domain', [{ value: 'half', label: '$[0,1)$' }, { value: 'closed', label: '$[0,1]$' }], 'half');
        const L = v.stage({ x: [-2.6, 1.6], y: [-1.45, 1.45], equal: true, axes: false, height: 320, title: 'the domain, rolled up' });
        const R = v.stage({ x: [-1.6, 1.6], y: [-1.45, 1.45], equal: true, axes: false, height: 320, title: '$S^1$' });
        const p = R.handle(Math.cos(0.4), Math.sin(0.4), { color: 'orange', label: 'p', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; } });
        let st = null;
        // rolling by curvature, anchored at f(½) = (−1, 0): at roll 1 this is exactly f(s) = (cos 2πs, sin 2πs)
        const rollPt = (s, t) => { const sig = TAU * (s - 0.5); let x, y; if (t < 1e-4) { x = sig; y = 0; } else { const rho = 1 / t, a = sig / rho; x = rho * Math.sin(a); y = rho * (1 - Math.cos(a)); } return [y - 1, -x]; };
        v.render(() => {
          const th = Math.atan2(p.y, p.x), c = ((th / TAU) % 1 + 1) % 1, hw = w.value, closed = dom.value === 'closed';
          const inArc = (s) => { let d = Math.abs(((s - c) % 1 + 1.5) % 1 - 0.5); return d < hw; };
          // preimage intervals in [0,1)
          const lo = c - hw, hi = c + hw;
          let pieces;
          if (lo < 0) pieces = [[0, hi, true, false], [1 + lo, 1, false, closed]];
          else if (hi > 1) pieces = [[0, hi - 1, true, false], [lo, 1, false, closed]];
          else pieces = [[lo, hi, false, false]];
          // left: rolled interval
          const t = rollT.value, N = 400;
          const pts = []; for (let i = 0; i <= N; i++) pts.push(rollPt(i / N, t));
          L.path(pts, { color: 'accent', width: 4 });
          for (const [a, b] of pieces) { const q = []; for (let i = 0; i <= 80; i++) q.push(rollPt(a + ((b - a) * i) / 80, t)); L.path(q, { color: 'green', width: 7 }); }
          const e0 = rollPt(0, t), e1 = rollPt(1, t);
          L.dot(e0[0], e0[1], { r: 5.5, color: 'accent' });
          L.dot(e1[0], e1[1], { r: 5.5, color: 'accent', hollow: !closed });
          L.text('0', e0[0] + 0.2, e0[1], { size: 13, color: 'muted', align: 'left' });
          L.text('1', e1[0] + 0.2, e1[1], { size: 13, color: 'muted', align: 'left' });
          L.corner(t > 0.995 ? 'rolled up: this is f' : `roll ${v.fix(t, 2)} — at 1 the picture is f itself`, 'tl', { size: 11.5 });
          // sequence z_k → (1,0) from below, preimages t_k → 1
          const ks = [1, 2, 3, 4, 5, 6, 8, 10, 14, 20].map((k) => 1 - 0.18 / k);
          for (const s of ks) { const q = rollPt(s, t); L.dot(q[0], q[1], { r: 3, color: 'gold' }); R.dot(Math.cos(TAU * s), Math.sin(TAU * s), { r: 3, color: 'gold' }); }
          // right: circle with arc
          R.circle(0, 0, 1, { color: 'accent', width: 4 });
          const arc = []; for (let i = 0; i <= 80; i++) { const a = TAU * (c - hw + (2 * hw * i) / 80); arc.push([Math.cos(a), Math.sin(a)]); }
          R.path(arc, { color: 'green', width: 8 });
          R.dot(1, 0, { r: 5, color: 'ink', label: closed ? 'f(0) = f(1)' : 'f(0)', labelPos: 'e' });
          st = { pieces, wraps: pieces.length > 1, closed, c };
        });
        v.legend([['accent', 'domain and $S^1$'], ['green', 'arc and its preimage'], ['gold', '$z_k\\to(1,0)$, $g(z_k)\\to1$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const iv = st.pieces.map(([a, b, lc, rc]) => `${lc ? '[' : '('}${v.fix(a, 3)},${v.fix(b, 3)}${rc ? ']' : ')'}`).join('\\cup');
          if (st.closed) return `$f^{-1}(\\text{arc})=${iv}$. On $[0,1]$ the map is still continuous, but $f(0)=f(1)$: **not injective**, so no inverse at all.`;
          return `$f^{-1}(\\text{arc})=${iv}$. ${st.wraps ? '**One arc around $f(0)$ comes from two pieces at opposite ends of $[0,1)$**: $g=f^{-1}$ sends points just below $(1,0)$ near $1$, but $(1,0)$ itself to $0$ — not continuous.' : 'Away from $(1,0)$ the preimage is a single interval and $g$ is continuous there.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Proposition',
      name: 'Stereographic projection: Sⁿ minus a point ≅ ℝⁿ',
      statement: String.raw`Let $N=(0,\dots,0,1)$ be the north pole of $S^n\subset\R^{n+1}$. Stereographic projection
$$\sigma(x_1,\dots,x_{n+1})=\frac{(x_1,\dots,x_n)}{1-x_{n+1}}$$
is a homeomorphism $S^n\setminus\{N\}\to\R^n$, with inverse $\sigma^{-1}(y)=\dfrac{(2y,\ \abs{y}^2-1)}{\abs{y}^2+1}$. It sends circles on the sphere not through $N$ to circles in the plane.`,
      idea: String.raw`$\sigma(p)$ is where the line from $N$ through $p$ meets the plane $x_{n+1}=0$; both $\sigma$ and the explicit inverse are rational functions with nonvanishing denominators on their domains, hence continuous, and composing them gives the identity in both orders. As $p\to N$, $\abs{\sigma(p)}^2=\frac{1+x_{n+1}}{1-x_{n+1}}\to\infty$: the missing point is "at infinity", which is why $S^n$ is the one-point compactification of $\R^n$. Circle preservation follows because a circle on $S^2$ is a plane section, and the plane's equation transforms into the equation of a circle.`,
      caption: String.raw`Drag $p$ on the sphere (drag the background to rotate). The ray from $N$ through $p$ hits the plane at $\sigma(p)$; a small circle around $p$ (orange) maps to a curve in the plane, and the readout fits a circle to it — the deviation is at rounding level. Bring $p$ toward $N$ and $\sigma(p)$ runs off to infinity (right panel, top view).`,
      deps: ['top-2.3'],
      refs: ['Munkres §18'],
      tags: ['homeomorphism', 'sphere'],
      viz(v) {
        const M = v.M;
        const rad = v.slider('circle radius (rad)', 0.05, 0.6, 0.3, { step: 0.01 });
        const S = v.stage({ x: [-2.5, 2.5], y: [-1.6, 1.75], equal: true, axes: false, height: 380, weight: 1.3 });
        const sc = v.scene3(S, { yaw: -0.7, pitch: 0.42, axes: false });
        const P = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: true, height: 380, title: 'the plane (top view)', ticks: false });
        const snapS = (q) => { let n = M.normalize(q); if (n[2] > 0.985) { const h = Math.hypot(n[0], n[1]) || 1; n = [(n[0] / h) * Math.sqrt(1 - 0.985 ** 2), (n[1] / h) * Math.sqrt(1 - 0.985 ** 2), 0.985]; } return n; };
        const hp = sc.handle(snapS([0.8, -0.5, 0.2]), { color: 'accent', label: 'p', snap: snapS, lim: 1.2 });
        const sig = (q) => [q[0] / (1 - q[2]), q[1] / (1 - q[2])];
        const inv = (y) => { const r2 = y[0] * y[0] + y[1] * y[1]; return [(2 * y[0]) / (r2 + 1), (2 * y[1]) / (r2 + 1), (r2 - 1) / (r2 + 1)]; };
        let st = null;
        v.render(() => {
          sc.begin();
          // the plane z = 0 as a grid square
          const G = 2.3;
          sc.poly([[-G, -G, 0], [G, -G, 0], [G, G, 0], [-G, G, 0]], { fill: 'muted', fillAlpha: 0.06, color: 'faint', alpha: 0.5 });
          for (let k = -4; k <= 4; k++) { sc.line([k * 0.575, -G, 0], [k * 0.575, G, 0], { color: 'faint', width: 0.7, alpha: 0.5 }, 2); sc.line([-G, k * 0.575, 0], [G, k * 0.575, 0], { color: 'faint', width: 0.7, alpha: 0.5 }, 2); }
          // sphere wireframe
          for (let i = 1; i < 6; i++) { const ph = (Math.PI * i) / 6, z = Math.cos(ph), r = Math.sin(ph); const c = []; for (let k = 0; k <= 64; k++) c.push([r * Math.cos((TAU * k) / 64), r * Math.sin((TAU * k) / 64), z]); sc.path(c, { color: i === 3 ? 'ink' : 'muted', width: i === 3 ? 1.3 : 0.8, alpha: i === 3 ? 0.6 : 0.4 }); }
          for (let j = 0; j < 8; j++) { const a = (TAU * j) / 8, c = []; for (let k = 0; k <= 48; k++) { const ph = (Math.PI * k) / 48; c.push([Math.sin(ph) * Math.cos(a), Math.sin(ph) * Math.sin(a), Math.cos(ph)]); } sc.path(c, { color: 'muted', width: 0.8, alpha: 0.45 }); }
          const p = hp.p, y = sig(p), Np = [0, 0, 1];
          // small circle around p and its image
          const e1 = M.normalize(M.cross3(p, Math.abs(p[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0])), e2 = M.cross3(p, e1), rr = rad.value;
          const circ = [], img = [];
          for (let k = 0; k <= 96; k++) { const a = (TAU * k) / 96; const q = [0, 1, 2].map((i) => Math.cos(rr) * p[i] + Math.sin(rr) * (Math.cos(a) * e1[i] + Math.sin(a) * e2[i])); circ.push(q); img.push(q[2] < 0.9999 ? sig(q) : null); }
          sc.path(circ, { color: 'orange', width: 2.4 });
          const imgIn = img.filter((q) => q && Math.hypot(q[0], q[1]) < G);
          if (imgIn.length === img.length) sc.path(img.map((q) => [q[0], q[1], 0]), { color: 'orange', width: 2.4 });
          // ray
          const far = Math.hypot(y[0], y[1]) > G ? M.vadd(Np, M.vscale(M.vsub([y[0], y[1], 0], Np), G / Math.hypot(y[0], y[1]))) : [y[0], y[1], 0];
          sc.line(Np, far, { color: 'accent', width: 1.6, dash: true });
          sc.dot(Np, { color: 'ink', r: 5, label: 'N' });
          if (Math.hypot(y[0], y[1]) <= G) sc.dot([y[0], y[1], 0], { color: 'green', r: 5.5, label: 'σ(p)' });
          sc.flush();
          // Kåsa circle fit of the image curve
          const pts = img.filter(Boolean);
          const A = pts.map((q) => [q[0], q[1], 1]), b = pts.map((q) => q[0] * q[0] + q[1] * q[1]);
          const sol = M.lstsq(A, b), cx = sol[0] / 2, cy = sol[1] / 2, R0 = Math.sqrt(sol[2] + cx * cx + cy * cy);
          const dev = Math.max(...pts.map((q) => Math.abs(Math.hypot(q[0] - cx, q[1] - cy) - R0)));
          // top view
          for (let i = 1; i < 8; i++) { const ph = (Math.PI * i) / 8, r = Math.sin(ph) / (1 - Math.cos(ph)); P.circle(0, 0, r, { color: 'faint', width: 0.8 }); }
          P.circle(0, 0, 1, { color: 'ink', width: 1.3, dash: [4, 3], alpha: 0.7 });
          P.text('equator', 0.72, 0.82, { size: 10.5, color: 'muted' });
          P.text('southern hemisphere ↦ inside, northern ↦ outside', -2.9, -2.78, { size: 10.5, color: 'muted' });
          P.path(pts, { color: 'orange', width: 2.4 });
          if (Math.hypot(y[0], y[1]) < 2.9) P.dot(y[0], y[1], { r: 5.5, color: 'green', label: 'σ(p)' });
          else { const u = M.normalize(y); P.arrow(u[0] * 2.1, u[1] * 2.1, u[0] * 2.85, u[1] * 2.85, { color: 'green', width: 2.5 }); P.corner(`σ(p) is off the map: |σ(p)| = ${v.fix(Math.hypot(y[0], y[1]), 1)}`, 'tl', { color: 'green' }); }
          const back = inv(y);
          st = { p, y, dev, R0, err: M.dist(back, p) };
        });
        v.legend([['orange', 'circle on $S^2$ and its image'], ['green', '$\\sigma(p)$', { dot: true }], ['faint', 'images of the latitudes']]);
        v.readout(() => st ? `$p=(${st.p.map((c) => v.fix(c, 3)).join(',')})$, $\\sigma(p)=(${v.fix(st.y[0], 3)},${v.fix(st.y[1], 3)})$, $\\abs{\\sigma(p)}=\\sqrt{\\tfrac{1+z}{1-z}}=${v.fix(Math.hypot(...st.y), 3)}$. Image of the orange circle: best-fit circle of radius $${v.fix(st.R0, 4)}$, max deviation $${v.sci(st.dev + 1e-17, 1)}$ — **a circle**. $\\abs{\\sigma^{-1}(\\sigma(p))-p}=${v.sci(st.err + 1e-17, 1)}$.` : '');
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Lemma',
      name: 'Pasting lemma',
      statement: String.raw`Let $X=A\cup B$ with $A$ and $B$ both closed in $X$ (or both open). If $f\colon A\to Y$ and $g\colon B\to Y$ are continuous and agree on $A\cap B$, then the function $h\colon X\to Y$ equal to $f$ on $A$ and to $g$ on $B$ is continuous.`,
      idea: String.raw`For a closed $C\subset Y$, $h^{-1}(C)=f^{-1}(C)\cup g^{-1}(C)$. Each piece is closed in $A$ (resp. $B$), and a closed subset of a closed subspace is closed in $X$ — so the union of the two is closed, and 2.2(ii) applies. The hypothesis that the pieces are closed is essential: with $A=[0,1]$ and $B=(1,2]$, the set $g^{-1}(C)$ can be closed in $B$ yet accumulate at $1\notin B$, and then $h$ jumps there even though each piece is continuous.`,
      caption: String.raw`$f$ on $[0,1]$ (blue) and $g$ on the second piece (purple). Drag the ends of the closed test set $C$ on the left; the three lanes show $f^{-1}(C)$, $g^{-1}(C)$ and $h^{-1}(C)$, red where closedness fails. Use **mismatch** to make $g(1)\ne f(1)$: with two closed pieces $h$ is no longer well defined; with $B=(1,2]$ it is, but $h^{-1}(C)$ stops being closed.`,
      deps: ['top-2.2'],
      refs: ['Munkres §18'],
      tags: ['continuity', 'gluing'],
      viz(v) {
        const mis = v.slider('mismatch $g(1^{+})-f(1)$', -0.8, 0.8, 0.4, { step: 0.05 });
        const md = v.select('pieces', [{ value: 'closed', label: '$A=[0,1],\\ B=[1,2]$' }, { value: 'half', label: '$A=[0,1],\\ B=(1,2]$' }], 'half');
        const s = v.stage({ x: [-0.25, 2.1], y: [-1.15, 2.2], height: 380, full: true, axes: 'box', gutter: true, xlabel: 'x', xticks: [0, 0.5, 1, 1.5, 2] });
        const XC = -0.17, lanes = [-0.4, -0.65, -0.92];
        const c0 = s.handle(XC, 1.0, { color: 'accent', constrain: (x, y) => [XC, clamp(snap(y), -0.2, 2.1)] });
        const c1 = s.handle(XC, 1.3, { color: 'accent', constrain: (x, y) => [XC, clamp(snap(y), -0.2, 2.1)] });
        let st = null;
        v.render(() => {
          const d = Math.abs(mis.value) < 1e-9 ? 0 : mis.value, closed = md.value === 'closed';
          // f: kink at ½; g: starts at f(1) + d and falls
          const f = { pieces: [[0, 0.5, 1.2, 0.3], [0.5, 1, -0.4, 1.1]], pts: [[0, 0.3], [0.5, 0.9], [1, 0.7]] };
          const g1 = 0.7 + d;
          const g = { pieces: [[1, 1.6, 0.9, g1 - 0.9], [1.6, 2, -1.2, g1 + 0.54 + 1.92]], pts: [[1.6, g1 + 0.54], [2, g1 + 0.54 - 0.48]].concat(closed ? [[1, g1]] : []) };
          const lo = Math.min(c0.y, c1.y), hi = Math.max(c0.y, c1.y), C = psFrom([[lo, hi, 3, true, true]]);
          s.hband(lo, hi, { color: 'accent', alpha: 0.1 });
          s.line(XC, lo, XC, hi, { color: 'accent', width: 5, cap: 'butt' });
          s.vband(1, 1, { alpha: 0 });
          s.vline(1, { color: 'faint', width: 1, dash: [3, 3] });
          plDraw(s, f, 0, 1, { color: 'blue' });
          plDraw(s, g, 1, 2, { color: 'purple' });
          if (!closed) s.dot(1, g1, { r: 4.4, hollow: true, color: 'purple' });
          const X = psFrom([[0, 2, 3, true, true]]);
          const Pf = plPre(f, C), Pg = plPre(g, C), Ph = psUnion(Pf, Pg);
          const relBad = (P, D) => { const B = psInter(psInter(psClos(P), D), psComp(P)); const out = []; for (let i = 0; i < B.bp.length; i++) if (B.pt[i]) out.push(B.bp[i]); return out; };
          const Adom = psFrom([[0, 1, 3, true, true]]), Bdom = psFrom([[1, 2, 3, !closed ? false : true, true]]);
          const badF = relBad(Pf, Adom), badG = relBad(Pg, Bdom), badH = closed && d ? [] : relBad(Ph, X);
          const labels = ['$f^{-1}(C)$', '$g^{-1}(C)$', '$h^{-1}(C)$'];
          [[Pf, 'blue', badF], [Pg, 'purple', badG], [Ph, 'green', badH]].forEach(([P, col, bad], k) => {
            s.line(0, lanes[k], 2, lanes[k], { color: 'faint', width: 1 });
            if (!(k === 2 && closed && d)) drawPSet(s, P, lanes[k], { color: col, labels: false, lo: 0, hi: 2 });
            for (const x of bad) s.dot(x, lanes[k], { r: 6, color: 'red', hollow: true, width: 2.2 });
            s.text(labels[k], -0.24, lanes[k], { size: 10.5, color: col, align: 'left' });
          });
          if (closed && d) { s.dot(1, 0.7, { r: 6, color: 'red' }); s.dot(1, g1, { r: 6, color: 'red' }); s.text('h(1) = ?', 1.04, (0.7 + g1) / 2, { color: 'red', size: 12, weight: 600 }); s.text('h is not defined: f(1) ≠ g(1)', 1.0, lanes[2], { color: 'red', size: 11.5, align: 'center', plate: true }); }
          st = { closed, d, Ph, badH, ok: !(closed && d) && badH.length === 0, lo, hi };
        });
        v.legend([['blue', '$f$ on $A$'], ['purple', '$g$ on $B$'], ['accent', 'closed test set $C$', { area: true }], ['red', 'limit point missing', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          if (st.closed && st.d) return `Both pieces are closed, but $f(1)=0.7\\ne g(1)=${v.fix(0.7 + st.d, 2)}$: the hypothesis "agree on $A\\cap B=\\{1\\}$" fails and there is no function $h$ to speak of. Set the mismatch to $0$.`;
          const hc = `$h^{-1}(C)=${psTex(st.Ph, fmtR)}$`;
          if (st.ok) return `${hc} is **closed** in $[0,2]$ ${st.closed ? '— the pasting lemma at work: each piece is closed in a closed set.' : st.d ? 'for this $C$ — but move $C$ to contain $g(1^+)$ and not $f(1)$.' : '— here the pieces agree in the limit, so $h$ is continuous anyway.'}`;
          return `${hc} is **not closed**: it accumulates at $x=1$ without containing it. $g^{-1}(C)$ is closed *in* $B=(1,2]$, but $B$ is not closed in $[0,2]$ — so $h$ is discontinuous at $1$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Definition',
      name: 'Embedding',
      statement: String.raw`A continuous injective map $f\colon X\to Y$ is an **embedding** (imbedding) if it is a homeomorphism of $X$ onto its image $f(X)$, the image carrying the subspace topology of $Y$. Equivalently: for every open $U\subset X$ there is an open $W\subset Y$ with $f(U)=W\cap f(X)$.`,
      idea: String.raw`Continuity and injectivity give a continuous bijection $X\to f(X)$; what can fail is continuity of the inverse, exactly as in 2.4. The figure-6 curve is the standard example: $\gamma\colon\R\to\R^2$ runs down a tail into the point $P=\gamma(0)$, around a loop, and approaches $P$ again as $t\to\infty$ without reaching it. It is injective and continuous, but the image of $(-1,1)$ is not relatively open: every ball about $P$ also catches the end of the loop, so the inverse map tears the picture at $P$. Stopping the loop short of $P$ gives an embedding.`,
      caption: String.raw`Left: the whole real line, squeezed into a segment (ticks at $t=-10,\dots,10$). Drag $t_0$ and the ball radius; the ball about $\gamma(t_0)$ is drawn on the right, and its preimage $\gamma^{-1}(B)$ is coloured on the line. On the figure 6 with $t_0=0$ the preimage has a second piece reaching to $+\infty$ — not an embedding. Switch to the open loop and every small ball pulls back to one short interval.`,
      deps: ['top-2.3', 'top-1.7'],
      refs: ['Munkres §18'],
      tags: ['embedding', 'subspace'],
      viz(v) {
        const md = v.select('curve', [{ value: 'six', label: 'figure 6' }, { value: 'open', label: 'open loop' }], 'six');
        const rr = v.slider('ball radius $r$', 0.04, 0.6, 0.22, { step: 0.01 });
        const xi = (t) => (2 / Math.PI) * Math.atan(t / 3), tOf = (x) => 3 * Math.tan((Math.PI / 2) * x);
        const L = v.stage({ x: [-1.08, 1.08], y: [-0.5, 0.6], axes: false, height: 150, full: true, title: '$\\R$ (compressed: $\\xi=\\tfrac2\\pi\\arctan\\tfrac t3$)' });
        const R = v.stage({ x: [-2.6, 3.4], y: [-1.25, 1.95], equal: true, axes: false, height: 300, full: true });
        const ht = L.handle(xi(0), 0, { color: 'accent', label: '$t_0$', labelPos: 'n', constrain: (x) => [clamp(Math.abs(x) < 0.02 ? 0 : x, -0.98, 0.98), 0] });
        const gam = (t, mode) => {
          if (t <= 0) return [1, -0.6 * t];
          const th = -(mode === 'six' ? TAU : 0.8 * TAU) * (1 - Math.exp(-t / 2));
          return [Math.cos(th), Math.sin(th)];
        };
        let st = null;
        v.render(() => {
          const mode = md.value, t0 = tOf(ht.x), c = gam(t0, mode), r = rr.value;
          // the curve
          const pts = []; for (let i = 0; i <= 1500; i++) { const x = -0.995 + (1.99 * i) / 1500; pts.push(gam(tOf(x), mode)); }
          R.path(pts.filter((p) => p[1] < 2.1), { color: 'accent', width: 3 });
          R.circle(c[0], c[1], r, { color: 'orange', width: 2, fill: 'orange', fillAlpha: 0.12 });
          R.dot(1, 0, { r: 4, color: 'ink' }); R.text('P = γ(0)', 1 + r + 0.08, -0.12, { size: 13, color: 'ink', math: true });
          if (mode === 'open') { const e = gam(1e6, mode); R.dot(e[0], e[1], { r: 4.5, hollow: true, color: 'accent', label: 'limit, not on the curve', labelPos: 'ne' }); }
          // preimage of the ball: sample the compressed line
          const N = 4000, inB = []; for (let i = 0; i <= N; i++) { const x = -0.9995 + (1.999 * i) / N; const p = gam(tOf(x), mode); inB.push(Math.hypot(p[0] - c[0], p[1] - c[1]) < r); }
          const comps = []; let start = null;
          for (let i = 0; i <= N; i++) { if (inB[i] && start === null) start = i; if ((!inB[i] || i === N) && start !== null) { comps.push([start, inB[i] ? i : i - 1]); start = null; } }
          const X = (i) => -0.9995 + (1.999 * i) / N;
          L.line(-1, 0, 1, 0, { color: 'accent', width: 3 });
          for (const tk of [-10, -3, -1, 0, 1, 3, 10]) { L.line(xi(tk), -0.06, xi(tk), 0.06, { color: 'muted', width: 1 }); L.text(String(tk).replace('-', '−'), xi(tk), -0.2, { size: 11, color: 'muted', align: 'center' }); }
          L.text('−∞', -1.05, 0, { size: 12, color: 'muted', align: 'center' }); L.text('+∞', 1.05, 0, { size: 12, color: 'muted', align: 'center' });
          const ownIdx = comps.findIndex(([a, b]) => X(a) <= ht.x + 1e-3 && X(b) >= ht.x - 1e-3);
          comps.forEach(([a, b], k) => {
            const ext = b === N, col = k === ownIdx ? 'green' : 'red';
            L.line(X(a), 0, X(b), 0, { color: col, width: 8, cap: 'butt' });
            if (ext) L.text('… to +∞', X(a), 0.3, { size: 11, color: 'red', align: 'left' });
            // the same piece on the curve
            const q = []; for (let i = a; i <= b; i++) q.push(gam(tOf(X(i)), mode));
            R.path(q.filter((p) => p[1] < 2.1), { color: col, width: 6 });
          });
          const own = comps.find(([a, b]) => X(a) <= ht.x + 1e-9 && X(b) >= ht.x - 1e-9);
          const far = comps.reduce((m, [a, b]) => Math.max(m, Math.abs(tOf(X(a)) - t0), b === N ? Infinity : Math.abs(tOf(X(b)) - t0)), 0);
          st = { t0, comps: comps.length, far, own, mode };
        });
        v.legend([['accent', 'curve $\\gamma(\\R)$'], ['orange', 'ball $B$ about $\\gamma(t_0)$', { area: true }], ['green', 'piece of $\\gamma^{-1}(B)$ around $t_0$'], ['red', 'stray pieces of $\\gamma^{-1}(B)$']]);
        v.readout(() => {
          if (!st) return '';
          const s1 = `$t_0=${v.fix(st.t0, 2)}$: $\\gamma^{-1}(B)$ has **${st.comps}** piece${st.comps === 1 ? '' : 's'}; $\\sup_{t\\in\\gamma^{-1}(B)}\\abs{t-t_0}=${isFinite(st.far) ? v.fix(st.far, 2) : '\\infty'}$.`;
          if (st.comps > 1) return s1 + ' Shrinking $r$ never removes the stray piece: no ball about $\\gamma(t_0)$ meets the image only in $\\gamma(t_0-\\delta,t_0+\\delta)$, so $\\gamma^{-1}\\colon\\gamma(\\R)\\to\\R$ is **not continuous** — injective and continuous, but **not an embedding**.';
          return s1 + (st.mode === 'six' ? ' Fine here — the trouble sits at $P=\\gamma(0)$ only.' : ' Small balls pull back to small intervals at every point: an **embedding**.');
        });
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Definition',
      name: 'Product topology',
      statement: String.raw`For spaces $X_\alpha$ ($\alpha\in J$), the **product topology** on $\prod_\alpha X_\alpha$ is the coarsest topology making every projection $\pi_\beta\colon\prod X_\alpha\to X_\beta$ continuous. It has the subbasis $\{\pi_\beta^{-1}(U_\beta): U_\beta\text{ open in }X_\beta\}$, hence the basis of sets $\prod_\alpha U_\alpha$ with each $U_\alpha$ open and $U_\alpha=X_\alpha$ for all but finitely many $\alpha$. The **box topology** uses all products $\prod U_\alpha$ of open sets; the two agree for finite products, where the basis is the "open rectangles" $U\times V$.`,
      idea: String.raw`Making $\pi_\beta$ continuous forces each slab $\pi_\beta^{-1}(U_\beta)$ to be open, and finite intersections of slabs are the basic sets — which is why only finitely many coordinates can be restricted. In a finite product of finite spaces, a set $W$ is open exactly when every point of $W$ sits in an open rectangle $U\times V\subset W$, i.e. when $W$ equals the union of the open rectangles it contains. In $\R\times\R$ that recovers the usual topology: every disc is a union of open rectangles and every rectangle a union of discs.`,
      caption: String.raw`Left: the product of two finite spaces drawn as a grid, with each factor's open sets as brackets. **Click cells** to build a set $W$; cells of $W$ inside an open rectangle $U\times V\subset W$ turn green, the others red — $W$ is open when no red remains. Right: drag the point inside an open set of $\R^2$ and see the largest open square around it that still fits.`,
      deps: ['top-1.3'],
      refs: ['Munkres §15', 'Munkres §19'],
      tags: ['product', 'basis'],
      viz(v) {
        const TX = { sier: { label: 'Sierpiński', F: famOf([0, 1, 3]) }, disc: { label: 'discrete', F: 15 }, ind: { label: 'indiscrete', F: famOf([0, 3]) } };
        const TY = { chain: TOP3.chain, vee: TOP3.vee, ind: TOP3.ind, disc: TOP3.disc };
        const tx = v.select('$X$ (2 points)', Object.entries(TX).map(([value, o]) => ({ value, label: o.label })), 'sier');
        const ty = v.select('$Y$ (3 points)', Object.entries(TY).map(([value, o]) => ({ value, label: o.label })), 'chain');
        let W = 0b001011; // cells (i, j) ↦ bit i + 2j: (1,a), (2,a), (2,b)
        const L = v.stage({ x: [-1.75, 3.0], y: [-1.45, 3.45], equal: true, axes: false, height: 340, title: '$X\\times Y$ — click cells' });
        const R = v.stage({ x: [-2, 2], y: [-1.6, 1.6], equal: true, axes: false, height: 340, title: 'an open set in $\\R\\times\\R$' });
        L.onClick((x, y) => { const i = Math.floor(x), j = Math.floor(y); if (i >= 0 && i < 2 && j >= 0 && j < 3) W ^= 1 << (i + 2 * j); });
        const hp = R.handle(0.75, 0.25, { color: 'accent', label: 'p' });
        const inW = (x, y) => Math.hypot(x + 0.55, y - 0.1) < 0.95 || Math.hypot(x - 0.65, y + 0.15) < 0.75 || (Math.abs(x) < 1.6 && Math.abs(y + 0.95) < 0.22);
        let st = null;
        v.render(() => {
          const FX = TX[tx.value].F, FY = TY[ty.value].F;
          const UX = members(FX, 2), VY = members(FY, 3);
          // interior of W in the product: union of open rectangles inside W
          let inter = 0; const rects = [];
          for (const U of UX) for (const V of VY) {
            if (!U || !V) continue; let R0 = 0;
            for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) if ((U >> i) & 1 && (V >> j) & 1) R0 |= 1 << (i + 2 * j);
            if ((R0 & W) === R0) { inter |= R0; rects.push([U, V]); }
          }
          for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
            const b = 1 << (i + 2 * j), inn = W & b;
            L.rect(i + 0.06, j + 0.06, i + 0.94, j + 0.94, { radius: 6, fill: inn ? (inter & b ? 'green' : 'red') : 'faint', fillAlpha: inn ? 0.35 : 0.08, color: inn ? (inter & b ? 'green' : 'red') : 'muted', width: inn ? 2 : 1 });
            L.text(`(${i + 1},${LETTERS[j]})`, i + 0.5, j + 0.5, { size: 12, color: 'ink', align: 'center' });
          }
          // brackets for open sets of the factors (proper, nonempty)
          const pX = UX.filter((m) => m && m !== 3), pY = VY.filter((m) => m && m !== 7);
          pX.forEach((m, k) => { const i0 = m & 1 ? 0 : 1, i1 = m & 2 ? 2 : 1, y = -0.35 - 0.33 * k; L.line(i0 + 0.1, y, i1 - 0.1, y, { color: 'orange', width: 3 }); L.text(setTex(m, 2).replace(/\\/g, '').replace('varnothing', '∅'), i1 + 0.05, y, { size: 10.5, color: 'orange', align: 'left' }); });
          pY.forEach((m, k) => { const x = -0.3 - 0.42 * k; let top = 0; for (let j = 0; j < 3; j++) if ((m >> j) & 1) { L.line(x, j + 0.1, x, j + 0.9, { color: 'purple', width: 3 }); top = j + 0.9; } for (let j = 0; j < 2; j++) if ((m >> j) & 1 && (m >> (j + 1)) & 1) L.line(x, j + 0.9, x, j + 1.1, { color: 'purple', width: 3 }); L.text(yTex(m).replace(/\\/g, ''), x, top + 0.2, { size: 10.5, color: 'purple', align: 'center' }); });
          L.text('X', 1, -1.35, { math: true, size: 16, color: 'muted', align: 'center' });
          L.text('Y', -1.6, 1.5, { math: true, size: 16, color: 'muted', align: 'center' });
          // R²: open set and the largest square around p
          R.raster((x, y) => (inW(x, y) ? v.rgb('accent').slice(0, 3).concat([0.16]) : null), { key: 'W', res: 2 });
          const fits = (h) => { for (let a = 0; a <= 12; a++) for (let b = 0; b <= 12; b++) { const x = hp.x - h + (2 * h * a) / 12, y = hp.y - h + (2 * h * b) / 12; if (!inW(x, y)) return false; } return true; };
          let hs = 0; if (inW(hp.x, hp.y)) { let lo = 0, hi = 2; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (fits(m)) lo = m; else hi = m; } hs = lo * 0.999; }
          if (hs > 0) {
            R.rect(hp.x - hs, hp.y - hs, hp.x + hs, hp.y + hs, { color: 'green', width: 2.2, fill: 'green', fillAlpha: 0.18 });
            R.line(hp.x - hs, -1.55, hp.x + hs, -1.55, { color: 'orange', width: 4 }); R.line(-1.95, hp.y - hs, -1.95, hp.y + hs, { color: 'purple', width: 4 });
            R.line(hp.x - hs, -1.55, hp.x - hs, hp.y - hs, { color: 'orange', width: 0.8, dash: [3, 3] }); R.line(-1.95, hp.y - hs, hp.x - hs, hp.y - hs, { color: 'purple', width: 0.8, dash: [3, 3] });
          }
          st = { W, inter, rects: rects.length, hs, inside: inW(hp.x, hp.y), FX, FY };
        });
        v.legend([['green', 'covered by an open rectangle', { area: true }], ['red', 'in $W$, but no open rectangle fits', { area: true }], ['orange', 'open in $X$ / $U$'], ['purple', 'open in $Y$ / $V$']]);
        v.readout(() => {
          if (!st) return '';
          const bad = st.W & ~st.inter, open = bad === 0;
          const left = open ? `**$W$ is open** in $X\\times Y$: it is the union of the ${st.rects} open rectangle${st.rects === 1 ? '' : 's'} it contains.` : `**$W$ is not open**: no open rectangle $U\\times V\\subset W$ contains the red cell${pc(bad) > 1 ? 's' : ''}.`;
          const right = st.inside ? `Around $p$ the open square $U\\times V$ of half-side $${v.fix(st.hs, 3)}$ fits inside the set.` : '$p$ is outside the open set.';
          return left + ' ' + right;
        });
      },
    },
  ],
};
