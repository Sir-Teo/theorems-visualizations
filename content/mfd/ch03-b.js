// Manifolds & Riemannian Geometry — Chapter 3: Submersions, immersions and submanifolds (items 3.8–3.14; 3.1–3.7 in ch03.js)
import {
  PI, TAU, clamp, wrap, minus, dot3, sc3, torusPt, torusN, gexp, adiff,
} from './ch03.shared.js';

// ---- 3.8: landscapes h(x, y) for Sard's theorem
const stair = (() => {
  const nb = 400, B = (u) => { if (u <= 0.5 || u >= 1) return 0; const s = (u - 0.5) / 0.5; return gexp(s) * gexp(1 - s); };
  const cum = [0];
  for (let i = 0; i < nb; i++) cum.push(cum[i] + ((B(i / nb) + B((i + 1) / nb)) / 2) / nb);
  const tot = cum[nb];
  return (t) => { const k = Math.floor(t), x = (t - k) * nb, i = Math.min(nb - 1, Math.floor(x)); return k + (cum[i] + (cum[i + 1] - cum[i]) * (x - i)) / tot; };
})();
const LAND = {
  volcano: { label: 'volcano rim', win: 2, f: (x, y) => { const r2 = x * x + y * y - 1; return 0.5 * r2 * r2; }, hint: 'a whole circle of critical points, all at the single value $0$, plus the crater centre at $\\tfrac12$' },
  egg: { label: 'egg crate $\\sin x\\sin y$', win: 3.3, f: (x, y) => Math.sin(x) * Math.sin(y), hint: 'isolated maxima, minima and saddles at the three values $-1,0,1$' },
  bumps: { label: 'three bumps', win: 2.5, f: (x, y) => 1.2 * Math.exp(-((x + 0.8) ** 2 + (y + 0.4) ** 2) / 0.5) + Math.exp(-((x - 1) ** 2 + (y - 0.6) ** 2) / 0.4) - 0.8 * Math.exp(-(x * x + (y - 1.2) ** 2) / 0.35), hint: 'a handful of isolated critical points' },
  terraces: { label: 'terraces $T(x)+T(y)$', win: 2, f: (x, y) => stair(x) + stair(y), hint: 'flat squares of critical points of positive area, but only the integer values' },
};
const GRID = 200, NB = 400;
const landCache = {};
function landData(key) {
  if (landCache[key]) return landCache[key];
  const L = LAND[key], W = L.win, G = GRID, h = (2 * W) / G, e = 1e-4;
  const val = new Float64Array((G + 1) * (G + 1)), gn = new Float64Array((G + 1) * (G + 1)), gx = new Float64Array((G + 1) * (G + 1)), gy = new Float64Array((G + 1) * (G + 1));
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i <= G; i++) for (let j = 0; j <= G; j++) {
    const x = -W + i * h, y = -W + j * h, k = i * (G + 1) + j, f = L.f(x, y);
    val[k] = f; lo = Math.min(lo, f); hi = Math.max(hi, f);
    gx[k] = (L.f(x + e, y) - L.f(x - e, y)) / (2 * e); gy[k] = (L.f(x, y + e) - L.f(x, y - e)) / (2 * e); gn[k] = Math.hypot(gx[k], gy[k]);
  }
  const cmin = new Float64Array(G * G), cosc = new Float64Array(G * G), hmn = new Float64Array(G * G), hmx = new Float64Array(G * G);
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
    const ks = [i * (G + 1) + j, (i + 1) * (G + 1) + j, i * (G + 1) + j + 1, (i + 1) * (G + 1) + j + 1];
    let m = Infinity, o = 0, a = Infinity, b = -Infinity;
    for (const k of ks) { m = Math.min(m, gn[k]); a = Math.min(a, val[k]); b = Math.max(b, val[k]); for (const k2 of ks) o = Math.max(o, Math.hypot(gx[k] - gx[k2], gy[k] - gy[k2])); }
    const c = i * G + j; cmin[c] = m; cosc[c] = o; hmn[c] = a; hmx[c] = b;
  }
  return (landCache[key] = { lo, hi, W, h, G, cmin, cosc, hmn, hmx });
}
/** Cells that may contain a point with |grad| < eps, the area fraction and the covered fraction of values. */
function coverEps(D, eps) {
  const { G, lo, hi } = D, flags = new Uint8Array(G * G), bins = new Uint8Array(NB);
  let n = 0;
  for (let c = 0; c < G * G; c++) {
    if (D.cmin[c] < eps + D.cosc[c] * 0.5) {
      flags[c] = 1; n++;
      const a = Math.floor(((D.hmn[c] - lo) / (hi - lo)) * NB), b = Math.floor(((D.hmx[c] - lo) / (hi - lo)) * NB);
      for (let k = clamp(a, 0, NB - 1); k <= clamp(b, 0, NB - 1); k++) bins[k] = 1;
    }
  }
  let cov = 0; for (let k = 0; k < NB; k++) cov += bins[k];
  return { flags, bins, area: n / (G * G), frac: cov / NB };
}

// ---- 3.9: the Klein bottle: figure-8 immersion in R^3 plus a fourth coordinate lambda*cos(v)
const KB = (u, v, lam) => {
  const c = Math.cos(u / 2), s = Math.sin(u / 2), r = 2 + c * Math.sin(v) - s * Math.sin(2 * v);
  return [r * Math.cos(u), r * Math.sin(u), s * Math.sin(v) + c * Math.sin(2 * v), lam * Math.cos(v)];
};
const kbCirc = (a) => { const t = ((a % TAU) + TAU) % TAU; return Math.min(t, TAU - t); };
const kbPdist = (u1, v1, u2, v2) => Math.min(Math.hypot(kbCirc(u1 - u2), kbCirc(v1 - v2)), Math.hypot(Math.min(Math.abs(u1 - u2 - TAU), Math.abs(u1 - u2 + TAU)), kbCirc(v1 + v2)));
let kbPairs = null;
function kbCandidates() {
  if (kbPairs) return kbPairs;
  const NU = 64, NV = 32, P = [];
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const u = (TAU * i) / NU, v = (TAU * j) / NV; P.push([u, v, ...KB(u, v, 1)]); }
  const out = [];
  for (let a = 0; a < P.length; a++) for (let b = a + 1; b < P.length; b++) {
    const A = P[a], B = P[b], dx = A[2] - B[2], dy = A[3] - B[3], dz = A[4] - B[4];
    if (dx * dx + dy * dy + dz * dz > 0.36) continue;
    if (kbPdist(A[0], A[1], B[0], B[1]) < 0.7) continue;
    out.push([dx, dy, dz, Math.cos(A[1]) - Math.cos(B[1])]);
  }
  return (kbPairs = out);
}

// ---- 3.10: a jagged continuous map of the circle to the plane
function jagged(seed, amp) {
  const r = (() => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
  const K = 64, nodes = [];
  for (let k = 0; k < K; k++) {
    const ph = (TAU * k) / K, a = amp * (0.12 + 0.88 * Math.exp(-((adiff(ph - PI * 0.6)) ** 2) / 0.9)) * 0.55;
    nodes.push([1.2 * Math.cos(ph) + a * (r() * 2 - 1), 1.2 * Math.sin(ph) + a * (r() * 2 - 1)]);
  }
  return (t) => { const x = ((((t / TAU) % 1) + 1) % 1) * K, k = Math.floor(x), f = x - k, A = nodes[k % K], B = nodes[(k + 1) % K]; return [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f]; };
}
const kern = (d, rho) => { const s = d / rho; return Math.abs(s) < 1 ? gexp(1 - s * s) : 0; };

// ---- 3.11 / 3.12 / 3.13 / 3.14 helpers
const SURF = {
  bowl: { label: 'bowl $z=0.35(x^2+y^2)$', F: (x, y) => 0.35 * (x * x + y * y), A: () => 0.35 },
  saddle: { label: 'saddle $z=0.4(x^2-y^2)$', F: (x, y) => 0.4 * (x * x - y * y), A: (ph) => 0.4 * Math.cos(2 * ph) },
};
const segX = (p1, p2, p3, p4) => {
  const d1x = p2[0] - p1[0], d1y = p2[1] - p1[1], d2x = p4[0] - p3[0], d2y = p4[1] - p3[1], den = d1x * d2y - d1y * d2x;
  if (Math.abs(den) < 1e-14) return null;
  const t = ((p3[0] - p1[0]) * d2y - (p3[1] - p1[1]) * d2x) / den, u = ((p3[0] - p1[0]) * d1y - (p3[1] - p1[1]) * d1x) / den;
  return t >= 0 && t < 1 && u >= 0 && u < 1 ? [p1[0] + t * d1x, p1[1] + t * d1y, d1x, d1y, d2x, d2y] : null;
};
const Sc = (s) => { const r = 1.5 + 0.22 * Math.cos(3 * s) + 0.08 * Math.sin(5 * s); return [r * Math.cos(s), r * Math.sin(s)]; };
const Cc = (t) => { const x = 0.55 * Math.cos(t), y = 0.3 * Math.sin(t); return [0.8 * x - 0.6 * y, 0.6 * x + 0.8 * y + 0.15 * Math.cos(2 * t)]; };
const dd = (F, s, e = 1e-5) => { const a = F(s + e), b = F(s - e); return [(a[0] - b[0]) / (2 * e), (a[1] - b[1]) / (2 * e)]; };
let tgData = null;
function tangencies() {
  if (tgData) return tgData;
  const N = 420, E = [];
  const cr = (s, t) => { const a = dd(Sc, s), b = dd(Cc, t); return a[0] * b[1] - a[1] * b[0]; };
  for (let i = 0; i < N; i++) {
    const s = (TAU * i) / N; let prevv = cr(s, 0), prevt = 0;
    for (let j = 1; j <= N; j++) {
      const t = (TAU * j) / N, cv = cr(s, t);
      if ((prevv < 0) !== (cv < 0)) {
        let a = prevt, b = t, fa = prevv;
        for (let k = 0; k < 30; k++) { const m = (a + b) / 2, fm = cr(s, m); if ((fa < 0) === (fm < 0)) { a = m; fa = fm; } else b = m; }
        const tt = (a + b) / 2, S = Sc(s), C = Cc(tt); E.push([S[0] - C[0], S[1] - C[1]]);
      }
      prevv = cv; prevt = t;
    }
  }
  // random sample of translations and their distance to E
  let seed = 12345; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const smp = []; for (let i = 0; i < 2400; i++) { const q = [-3 + 6 * rnd(), -3 + 6 * rnd()]; let m = Infinity; for (const e of E) m = Math.min(m, Math.hypot(q[0] - e[0], q[1] - e[1])); smp.push([q[0], q[1], m]); }
  return (tgData = { E, smp });
}

const Hh = (tau) => { const w = [Math.sin(tau), 0, Math.cos(tau)]; return { w, h: (a, b) => dot3(w, torusPt(a, b)) }; };

export default {
  collection: 'mfd',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Theorem',
      name: 'Sard’s theorem',
      statement: String.raw`Let $F\colon M\to N$ be a smooth map between smooth manifolds (Hausdorff and second countable). Then the set of **critical values** $F(\{p: dF_p\text{ not onto}\})$ has **measure zero** in $N$ (measure zero in every chart). Consequently the regular values are dense in $N$. For maps of class $C^k$ between manifolds of dimensions $m$ and $n$ the same holds when $k\ge\max(m-n+1,1)$.`,
      idea: String.raw`Measure zero is unchanged by smooth coordinate changes between charts of the same dimension: these maps are locally Lipschitz. This does not say arbitrary smooth maps between different dimensions preserve null sets (a null line segment in the plane can project onto an interval). Thus the problem is local, and second countability reduces it to countably many pieces. For one variable the idea is simple: on the critical set $f'=0$, so a short interval $I$ of length $\delta$ is sent to a set of length $o(\delta)$, and covering the critical set by such intervals leaves total image length $\to0$. In higher dimensions one inducts on the dimension, splitting the critical set by how many derivatives vanish and applying Fubini on the level sets of a coordinate. The proof is the delicate part: in lower smoothness the statement is false, and Whitney's example shows the number of derivatives required cannot be lowered.`,
      caption: String.raw`Pick a landscape $h(x,y)$ and the tolerance $\varepsilon$. Left: the region where $|\nabla h|<\varepsilon$ (red, with a safety margin of one grid cell), which for the **terraces** is a large area. Middle: the *values* $h$ takes on that red region, as orange bars on the value axis; the readout gives their total length as a fraction of the range. Right: that fraction as $\varepsilon\to0$ (log scale): it falls towards $0$, as Sard predicts — even for the terraces, whose critical set has positive area but only integer critical values. The orange curve on the landscape is the level $c$ of your choice.`,
      deps: ['mfd-3.1', 'rca-2.20'],
      refs: ['Lee SM Ch. 6'],
      tags: ['critical value', 'measure zero'],
      credit: 'Arthur Sard, 1942 (real-valued functions were handled earlier by A. P. Morse)',
      scope: String.raw`Smooth ($C^\infty$) maps; for $F\colon\R^m\to\R^n$ of class $C^k$ one needs $k\ge\max(m-n+1,1)$. The picture is a numerical sketch on a $200\times200$ grid, not a proof.`,
      viz(v) {
        const ls = v.select('landscape $h$', Object.entries(LAND).map(([value, o]) => ({ value, label: o.label })), 'terraces');
        const eps = v.slider('tolerance $\\varepsilon$', 0.003, 1.5, 0.25, { log: true, sig: 2 });
        const lv = v.slider('level $c$', 0, 1, 0.5, { step: 0.001, decimals: 3 });
        const A = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 280, xlabel: 'x', ylabel: 'y', title: 'landscape; red: $|\\nabla h|<\\varepsilon$' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 250, xlabel: 'value $h$', ylabel: '', title: 'values taken on the red region' });
        const Cc2 = v.stage({ x: [0.003, 1.5], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 250, xlabel: 'ε', ylabel: 'fraction of values covered', title: 'covered fraction as $\\varepsilon\\to0$' });
        const curves = {};
        const curveOf = (key) => {
          if (!curves[key]) { const D = landData(key), pts = []; for (let k = 0; k <= 26; k++) { const e = 0.003 * Math.pow(500, k / 26); pts.push([e, coverEps(D, e).frac]); } curves[key] = pts; }
          return curves[key];
        };
        let info = null, last = '';
        v.render(() => {
          const D = landData(ls.value), W = D.W, e = eps.value, cv = coverEps(D, e), F = LAND[ls.value].f;
          if (last !== ls.value) { last = ls.value; A.setView([-W, W], [-W, W]); B.setView([D.lo, D.hi], [0, 1]); }
          const c = D.lo + lv.value * (D.hi - D.lo);
          A.heat(F, { range: [D.lo, D.hi], cmap: 'theme', res: 3, key: ls.value, rect: [-W, -W, W, W] });
          const G = D.G;
          for (let i = 0; i < G; i++) {
            let j = 0;
            while (j < G) {
              if (cv.flags[i * G + j]) { let k = j; while (k < G && cv.flags[i * G + k]) k++; A.rect(-W + i * D.h, -W + j * D.h, -W + (i + 1) * D.h, -W + k * D.h, { fill: 'red', fillAlpha: 0.38, stroke: false }); j = k; } else j++;
            }
          }
          A.clip(() => A.contour(F, [c], { color: 'orange', width: 2.6, res: 200 }), [-W, W], [-W, W]);
          // value axis
          const dv = (D.hi - D.lo) / NB;
          for (let k = 0; k < NB; k++) if (cv.bins[k]) B.rect(D.lo + k * dv, 0.15, D.lo + (k + 1) * dv, 0.85, { fill: 'orange', fillAlpha: 0.85, stroke: false });
          B.line(D.lo, 0.5, D.hi, 0.5, { color: 'muted', width: 1 });
          B.vline(c, { color: 'orange', width: 2 });
          B.rect(D.lo, 0, D.hi, 1, { color: 'faint', width: 1, fill: false });
          // fraction curve
          const cu = curveOf(ls.value);
          Cc2.path(cu, { color: 'accent', width: 2.6 });
          Cc2.setView([0.003, 1.5], [0, Math.max(0.1, 1.15 * Math.max(...cu.map((q) => q[1])))]);
          Cc2.dot(e, cv.frac, { r: 6, color: 'gold' });
          info = { e, area: cv.area, frac: cv.frac, hint: LAND[ls.value].hint, c, covered: cv.bins[clamp(Math.floor(((c - D.lo) / (D.hi - D.lo)) * NB), 0, NB - 1)] };
        });
        v.readout(() => {
          if (!info) return '';
          const p = (x) => v.fix(100 * x, 1);
          return `$\\varepsilon=${v.fix(info.e, 3)}$: the region $|\\nabla h|<\\varepsilon$ covers **${p(info.area)}%** of the window, but the values $h$ takes on it fill only **${p(info.frac)}%** of the value range. This landscape has ${info.hint}.\nThe level $c=${v.fix(info.c, 3)}$ is ${info.covered ? 'inside the orange set: it is (nearly) a critical value for this $\\varepsilon$.' : 'outside the orange set: a regular value, whose level curve (orange, left) is smooth.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Theorem',
      name: 'Whitney embedding theorem',
      statement: String.raw`Every smooth $n$-manifold $M$ (Hausdorff, second countable) admits a smooth embedding into $\R^{2n+1}$ (the easy form, proved with Sard's theorem) and in fact a proper smooth embedding into $\R^{2n}$ (the strong form); for $n>1$ it also admits an immersion into $\R^{2n-1}$. The dimension $2n$ cannot be lowered in general: the Klein bottle ($n=2$) embeds in $\R^4$ but not in $\R^3$.`,
      idea: String.raw`Embed $M$ by finitely many bump functions and charts into some large $\R^N$ (this is where the partitions of unity of 1.10 enter), then project to a hyperplane along a direction $e$. The projection fails to be an embedding only if $e$ is a tangent direction (a set of dimension $2n$ in the projective space of directions) or a secant direction between two points of $M$ (dimension $2n$ as well). By Sard these sets of directions have measure zero when $N-1>2n$, so a generic direction works and $N$ drops step by step down to $2n+1$. Getting from $2n+1$ to $2n$ needs Whitney's trick for removing isolated double points by a local twist; it is the genuinely hard part.`,
      caption: String.raw`The Klein bottle $K$ is drawn as the familiar figure-eight immersion in $\R^3$ with a fourth coordinate $w=\lambda\cos v$ (colour: blue/orange = negative/positive $w$). At $\lambda=0$ the surface passes through itself along the circle $v\in\{0,\pi\}$ (the red and green curves coincide). Raise $\lambda$ and the two sheets there get different $w$: in $\R^4$ they are $2\lambda$ apart, so $K$ is embedded. The two angle sliders rotate the 4D shape in the $(z,w)$ and $(x,w)$ planes before projecting to the 3D picture; however you rotate, some self-intersection remains in 3D (the readout), because no embedding in $\R^3$ exists.`,
      deps: ['mfd-3.8', 'mfd-1.10'],
      see: ['top-6.7'],
      refs: ['Lee SM Ch. 6'],
      tags: ['embedding', 'Klein bottle'],
      credit: 'Hassler Whitney, 1936 (dimension 2n+1) and 1944 (dimension 2n)',
      scope: String.raw`Smooth manifolds without boundary; the picture is the Klein bottle only (a standard immersion plus a fourth coordinate $\lambda\cos v$, checked numerically below to separate the sheets), not a general construction.`,
      viz(v) {
        const lam = v.slider('fourth coordinate scale $\\lambda$', 0, 1.5, 1, { step: 0.01 });
        const al = v.slider('rotation in the $(z,w)$-plane (degrees)', 0, 90, 35, { step: 1 });
        const be = v.slider('rotation in the $(x,w)$-plane (degrees)', 0, 90, 0, { step: 1 });
        const S3 = v.stage3d({ range: 3.3, height: 440, yaw: -0.5, pitch: 0.55, axes: false, weight: 1, minWidth: 320, title: 'projection of the Klein bottle to $\\mathbb R^3$ (colour = fourth coordinate)' });
        let info = null;
        v.render(() => {
          const L = lam.value, a = (al.value * PI) / 180, b = (be.value * PI) / 180;
          const rot = (p) => {
            let [x, y, z, w] = p; const z1 = z * Math.cos(a) - w * Math.sin(a), w1 = z * Math.sin(a) + w * Math.cos(a), x1 = x * Math.cos(b) - w1 * Math.sin(b), w2 = x * Math.sin(b) + w1 * Math.cos(b);
            return [x1, y, z1, w2];
          };
          const amp = Math.max(0.6, 1.3 * (Math.abs(Math.sin(a)) * 1.2 + Math.abs(Math.sin(b)) * 2 + L));
          S3.surface((u, vv) => rot(KB(u, vv, L)).slice(0, 3), [0, TAU], [0, TAU], { nu: 72, nv: 36, alpha: 0.96, colorFn: (u, vv) => v.mix('blue', 'orange', (clamp(rot(KB(u, vv, L))[3] / amp, -1, 1) + 1) / 2) });
          S3.curve((u) => rot(KB(u, 0, L)).slice(0, 3), 0, TAU, { n: 160, color: 'red', width: 3 });
          S3.curve((u) => rot(KB(u, PI, L)).slice(0, 3), 0, TAU, { n: 160, color: 'green', width: 3 });
          const pairs = kbCandidates();
          let m3 = Infinity, m4 = Infinity;
          const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
          for (const [dx, dy, dz, dc] of pairs) {
            const dw = L * dc, z1 = dz * ca - dw * sa, w1 = dz * sa + dw * ca, x1 = dx * cb - w1 * sb;
            m3 = Math.min(m3, x1 * x1 + dy * dy + z1 * z1); m4 = Math.min(m4, dx * dx + dy * dy + dz * dz + dw * dw);
          }
          info = { m3: Math.sqrt(m3), m4: Math.sqrt(m4), L };
        });
        v.readout(() => {
          if (!info) return '';
          return `Smallest distance between two points of $K$ that are not parameter-neighbours (mesh $\\approx0.1$): in $\\mathbb R^4$ **${v.fix(info.m4, 3)}** (the two sheets along $v=0,\\pi$ differ by $2\\lambda=${v.fix(2 * info.L, 2)}$ in $w$); in the current $3$D projection **${v.fix(info.m3, 3)}**.\n${info.m4 > 0.15 ? 'In $\\mathbb R^4$ the surface does not touch itself: an embedding.' : 'At $\\lambda\\approx0$ the sheets meet in $\\mathbb R^4$ too: only an immersion.'} Near $0$ in the $3$D projection means a visible self-intersection; since the Klein bottle has no embedding in $\\mathbb R^3$ one always remains, though on this mesh a shallow crossing can show a value above $0.1$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Theorem',
      name: 'Whitney approximation theorem',
      statement: String.raw`Let $M$ be a smooth manifold and $N$ a smooth manifold (possibly with boundary), $F\colon M\to N$ continuous, and $\delta\colon M\to(0,\infty)$ a continuous function. Then $F$ is homotopic to a smooth map $\tilde F$ with $d(F(p),\tilde F(p))<\delta(p)$ for all $p$ (for $N=\R^k$, or $N\subset\R^k$ with $F$ having values near $N$, $d$ is the Euclidean distance). If $F$ is already smooth on a closed set $A$, then $\tilde F$ can be chosen equal to $F$ on $A$. Consequently homotopic smooth maps are smoothly homotopic.`,
      idea: String.raw`For $N=\R^k$: cover $M$ by chart domains $U_i$ on each of which $F$ varies by less than a given amount, choose a smooth partition of unity $\{\psi_i\}$ subordinate to the cover (1.10), and on each chart smooth $F$ by convolving it with a bump kernel supported in a ball of radius $\rho_i$; a continuous map is uniformly close to its convolution when $\rho_i$ is small, uniformly on compact sets. The glued map $\tilde F=\sum\psi_i\,(F*k_{\rho_i})$ is smooth, and each term is within $\delta$ of $F$, so the convex combination is too. The kernel widths $\rho_i$ may differ from chart to chart, which is how $\delta$ can vary over $M$: you smooth strongly where $F$ is calm and gently where it is wild.`,
      caption: String.raw`A random jagged (piecewise linear, hence only continuous) map $f$ of the circle to the plane, rougher on the left. Choose the tolerance $\varepsilon$ and the number of patches. Each patch of the partition of unity $\psi_i$ (middle) gets the widest kernel $\rho_i$ that keeps $|f*k_{\rho_i}-f|\le\varepsilon$ on its support; the glued smooth map $g=\sum\psi_i(f*k_{\rho_i})$ is the blue curve, and the right panel shows the distance $|g(t)-f(t)|$ against $\varepsilon$. With more patches the calm part of the curve is smoothed more and the maximal turning angle per sample of $g$ falls.`,
      deps: ['mfd-1.10'],
      refs: ['Lee SM Ch. 6'],
      tags: ['approximation', 'partition of unity'],
      scope: String.raw`The picture is the case $M=S^1$, $N=\R^2$ with a piecewise linear $f$; $|g-f|\le\varepsilon$ is checked on 1440 sample points.`,
      viz(v) {
        const eps = v.slider('tolerance $\\varepsilon$', 0.01, 0.5, 0.1, { log: true, sig: 2 });
        const np = v.select('patches', ['1', '2', '3', '4'], '3');
        const amp = v.slider('roughness', 0.1, 1.2, 0.5, { step: 0.01 });
        let seed = 7;
        v.button('resample', () => { seed += 11; });
        const A = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 320, weight: 1, minWidth: 270, title: 'the maps $f$ (grey) and $g$ (blue)' });
        const B = v.stage({ x: [0, TAU], y: [-0.25, 1.15], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 250, xlabel: 't', ylabel: '', xticks: [[0, '0'], [PI, 'π'], [TAU, '2π']], title: 'partition of unity $\\psi_i$ and kernel widths $\\rho_i$' });
        const C = v.stage({ x: [0, TAU], y: [0, 1], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 250, xlabel: 't', ylabel: '|g − f|', xticks: [[0, '0'], [PI, 'π'], [TAU, '2π']], title: 'error $|g-f|$ against $\\varepsilon$' });
        const M = 1440, cache = {};
        const PAL = ['accent', 'orange', 'green', 'purple'];
        function build(e, n, a, sd) {
          const key = [e.toFixed(4), n, a.toFixed(3), sd].join('|');
          if (cache[key]) return cache[key];
          const f = jagged(sd, a), T = [], Fx = [], Fy = [];
          for (let j = 0; j < M; j++) { const t = (TAU * j) / M, p = f(t); T.push(t); Fx.push(p[0]); Fy.push(p[1]); }
          const R = (1.5 * PI) / n, psi = [];
          for (let i = 0; i < n; i++) { const c = (TAU * i) / n; psi.push(T.map((t) => gexp(1 - (adiff(t - c) / R) ** 2) * (Math.abs(adiff(t - c)) < R ? 1 : 0))); }
          const sum = T.map((_, j) => psi.reduce((s, p) => s + p[j], 0));
          const w = psi.map((p) => p.map((x, j) => x / sum[j]));
          const conv = (rho, js) => {
            const half = Math.max(1, Math.ceil((rho / TAU) * M)), out = [];
            for (const j of js) {
              let sx = 0, sy = 0, sw = 0;
              for (let d = -half; d <= half; d++) { const k = (j + d + M) % M, wt = kern((d * TAU) / M, rho); sx += wt * Fx[k]; sy += wt * Fy[k]; sw += wt; }
              out.push([sx / sw, sy / sw]);
            }
            return out;
          };
          const rhos = [], parts = [];
          for (let i = 0; i < n; i++) {
            const js = []; for (let j = 0; j < M; j++) if (w[i][j] > 1e-9) js.push(j);
            const err = (rho) => { const o = conv(rho, js); let m = 0; o.forEach((q, k) => { m = Math.max(m, Math.hypot(q[0] - Fx[js[k]], q[1] - Fy[js[k]])); }); return m; };
            let lo = 0.004, hi = 1.4;
            if (err(hi) <= e) lo = hi; else { for (let it = 0; it < 12; it++) { const m = Math.sqrt(lo * hi); if (err(m) <= e) lo = m; else hi = m; } }
            rhos.push(lo);
            const full = conv(lo, T.map((_, j) => j)); parts.push(full);
          }
          const G = T.map((_, j) => { let x = 0, y = 0; for (let i = 0; i < n; i++) { x += w[i][j] * parts[i][j][0]; y += w[i][j] * parts[i][j][1]; } return [x, y]; });
          const turn = (P) => { let m = 0; for (let j = 0; j < M; j++) { const a0 = P[(j + M - 1) % M], b0 = P[j], c0 = P[(j + 1) % M], u = [b0[0] - a0[0], b0[1] - a0[1]], w2 = [c0[0] - b0[0], c0[1] - b0[1]], cs = (u[0] * w2[0] + u[1] * w2[1]) / (Math.hypot(...u) * Math.hypot(...w2) || 1); m = Math.max(m, Math.acos(clamp(cs, -1, 1))); } return m; };
          const Fp = T.map((_, j) => [Fx[j], Fy[j]]);
          const errs = G.map((q, j) => Math.hypot(q[0] - Fx[j], q[1] - Fy[j]));
          return (cache[key] = { T, Fp, G, w, rhos, errs, tF: turn(Fp), tG: turn(G), cen: Array.from({ length: n }, (_, i) => (TAU * i) / n) });
        }
        let info = null;
        v.render(() => {
          const n = +np.value, e = eps.value, R = build(e, n, amp.value, seed);
          A.path(R.Fp.concat([R.Fp[0]]), { color: 'muted', width: 1.2 });
          A.path(R.G.concat([R.G[0]]), { color: 'accent', width: 2.8 });
          for (let k = 0; k < 12; k++) { const q = R.G[Math.floor((k * M) / 12)]; A.circle(q[0], q[1], e, { color: 'orange', width: 1, fill: 'orange', fillAlpha: 0.08 }); }
          for (let i = 0; i < n; i++) {
            B.path(R.T.map((t, j) => [t, R.w[i][j]]), { color: PAL[i], width: 2 });
            const c = R.cen[i], r = R.rhos[i];
            B.line(c - r, -0.12 - 0.04 * i, c + r, -0.12 - 0.04 * i, { color: PAL[i], width: 5 });
            if (c - r < 0) B.line(c - r + TAU, -0.12 - 0.04 * i, TAU, -0.12 - 0.04 * i, { color: PAL[i], width: 5 });
            if (c + r > TAU) B.line(0, -0.12 - 0.04 * i, c + r - TAU, -0.12 - 0.04 * i, { color: PAL[i], width: 5 });
          }
          C.setView([0, TAU], [0, Math.max(1.3 * e, ...R.errs) * 1.1]);
          C.hband(0, e, { color: 'green', alpha: 0.12 }); C.hline(e, { color: 'green', width: 2 });
          C.path(R.T.map((t, j) => [t, R.errs[j]]), { color: 'accent', width: 1.8 });
          info = { e, n, rhos: R.rhos, mx: Math.max(...R.errs), tF: R.tF, tG: R.tG };
        });
        v.readout(() => {
          if (!info) return '';
          return `$\\varepsilon=${v.fix(info.e, 3)}$, kernel half-widths $\\rho_i=${info.rhos.map((r) => v.fix(r, 3)).join(',\\ ')}$ (in $t$). Largest error $\\max|g-f|=${v.fix(info.mx, 4)}$ ${info.mx <= info.e + 1e-9 ? '$\\le\\varepsilon$ ✓' : '$>\\varepsilon$ (the widest allowed kernel hit its lower limit)'}.\nLargest turning angle between consecutive samples: $f$: $${v.fix((info.tF * 180) / PI, 1)}^\\circ$, $g$: $${v.fix((info.tG * 180) / PI, 1)}^\\circ$. $f$ has genuine corners; $g$ is smooth, being a finite sum of convolutions with a $C^\\infty$ kernel weighted by smooth functions (its tight turns follow the tolerance, not corners).`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Definition',
      name: 'Transversality',
      statement: String.raw`Let $S\subset M$ be an embedded submanifold and $F\colon X\to M$ a smooth map. $F$ is **transverse to $S$** ($F\pitchfork S$) if for every $x$ with $F(x)=q\in S$ one has $dF_x(T_xX)+T_qS=T_qM$. Two submanifolds $S,S'$ are transverse if the inclusion of $S'$ is transverse to $S$, i.e. $T_qS+T_qS'=T_qM$ at each common point. If $F\pitchfork S$ then $F^{-1}(S)$ is an embedded submanifold of $X$ whose codimension equals the codimension of $S$ in $M$ (when $S$ is closed, it is closed too).`,
      idea: String.raw`Locally $S$ is the zero set $\{g=0\}$ of a submersion $g$ with $\ker dg=TS$ (a slice chart, 3.4); the condition $dF(T_xX)+T_qS=T_qM$ says exactly that $g\circ F$ has surjective differential at $x$, so $F^{-1}(S)=(g\circ F)^{-1}(0)$ is a regular level set (3.5), of the stated codimension. Transversality is stronger than "the dimensions add up": two curves in $\R^3$ never meet transversally in a point where they are tangent, and a curve lying in a surface is tangent to it everywhere. It is also **open**: a small perturbation of a transverse map stays transverse, whereas tangential contact can be destroyed by a nudge.`,
      caption: String.raw`A line (a curve, parametrized by $s$) is moved across a surface $z=F(x,y)$. Its height above the surface along the line is $g(s)=c+ks-F(s\cos\varphi,s\sin\varphi)$, and the intersection points are the zeros of $g$; the intersection is transverse at a zero exactly when $g'\ne0$ there. Slide the height $c$: points appear in pairs (green: transverse) and at the moment of birth the contact is tangential (red, $g'=0$, a double root). Press **tangent contact**, then change the tilt $k$ slightly: the contact is destroyed or splits into two transverse points, so transverse is the stable situation. On the saddle at $\varphi=45^\circ$ the line is an asymptotic direction.`,
      deps: ['mfd-3.5'],
      refs: ['Lee SM Ch. 6'],
      tags: ['transversality', 'intersection'],
      viz(v) {
        const sf = v.select('surface', Object.entries(SURF).map(([value, o]) => ({ value, label: o.label })), 'bowl');
        const ph = v.slider('direction of the line $\\varphi$ (degrees)', 0, 90, 0, { step: 1 });
        const cc = v.slider('height $c$', -1.2, 1.2, 0.5, { step: 0.005, decimals: 3 });
        const kk = v.slider('tilt $k$ (the nudge)', -1.5, 1.5, 0.3, { step: 0.005, decimals: 3 });
        v.button('tangent contact', () => {
          const A = SURF[sf.value].A((ph.value * PI) / 180);
          if (Math.abs(A) > 1e-9) cc.set(clamp(-(kk.value ** 2) / (4 * A), -1.2, 1.2));
        });
        const S3 = v.stage3d({ range: 2.6, height: 380, yaw: -0.65, pitch: 0.45, axes: false, weight: 1.2, minWidth: 290, title: 'a line and a surface in $\\mathbb R^3$' });
        const G = v.stage({ x: [-2.4, 2.4], y: [-1.5, 1.5], axes: true, height: 380, weight: 1, minWidth: 250, title: 'height above the surface, $g(s)$', xlabel: '', ylabel: '' });
        let info = null;
        v.render(() => {
          const S = SURF[sf.value], phi = (ph.value * PI) / 180, c = cc.value, k = kk.value, A = S.A(phi), cp = Math.cos(phi), sp = Math.sin(phi);
          const gfun = (s) => c + k * s - A * s * s;
          S3.surface((r, th) => [r * Math.cos(th), r * Math.sin(th), S.F(r * Math.cos(th), r * Math.sin(th))], [0, 2.3], [0, TAU], { nu: 14, nv: 48, alpha: 0.5, color: 'accent', wire: true });
          S3.curve((s) => [s * cp, s * sp, c + k * s], -2.4, 2.4, { n: 2, color: 'ink', width: 2.6 });
          // roots of g in [-2.4, 2.4]
          const roots = [];
          if (Math.abs(A) < 1e-9) { if (Math.abs(k) > 1e-9) roots.push(-c / k); }
          else { const D = k * k + 4 * A * c; if (Math.abs(D) < 1e-6) roots.push(k / (2 * A)); else if (D > 0) { roots.push((k + Math.sqrt(D)) / (2 * A)); roots.push((k - Math.sqrt(D)) / (2 * A)); } }
          const hits = roots.filter((s) => Math.abs(s) <= 2.4).map((s) => ({ s, d: k - 2 * A * s }));
          for (const h of hits) {
            const tang = Math.abs(h.d) < 5e-3, P = [h.s * cp, h.s * sp, c + k * h.s];
            S3.dot(P, { r: 6, color: tang ? 'red' : 'green' });
            // tangent plane patch at P
            const gx = 0, e1 = [1, 0, 0], e2 = [0, 1, 0];
            const fx = (S.F(P[0] + 1e-5, P[1]) - S.F(P[0] - 1e-5, P[1])) / 2e-5, fy = (S.F(P[0], P[1] + 1e-5) - S.F(P[0], P[1] - 1e-5)) / 2e-5;
            const q = (a, b) => [P[0] + a, P[1] + b, P[2] + fx * a + fy * b];
            S3.poly([q(-0.35, -0.35), q(0.35, -0.35), q(0.35, 0.35), q(-0.35, 0.35)], { fill: tang ? 'red' : 'green', fillAlpha: 0.25, color: tang ? 'red' : 'green' });
            void gx; void e1; void e2;
          }
          G.fn(gfun, { color: 'accent', width: 2.6, domain: [-2.4, 2.4] });
          G.hline(0, { color: 'ink', width: 1 });
          for (const h of hits) { const tang = Math.abs(h.d) < 5e-3; G.dot(h.s, 0, { r: 6, color: tang ? 'red' : 'green' }); G.line(h.s - 0.5, -0.5 * h.d, h.s + 0.5, 0.5 * h.d, { color: tang ? 'red' : 'green', width: 1.8, dash: [4, 3] }); }
          info = { hits, A };
        });
        v.readout(() => {
          if (!info) return '';
          const f = (x) => minus(v.fix(x, 3));
          if (!info.hits.length) return 'The line misses the surface: empty intersection (vacuously transverse).';
          const list = info.hits.map((h) => `$s=${f(h.s)}$, $g'(s)=${f(h.d)}$`).join('; ');
          const bad = info.hits.some((h) => Math.abs(h.d) < 5e-3);
          return `Intersection points: ${list}.\n${bad ? "**Tangential contact**: $g'(s)=0$, the line lies in the tangent plane, so $dF(T)+T_qS$ is only 2-dimensional and the intersection is not transverse (a double root; one nudge of the tilt $k$ removes it or splits it in two)." : "All intersection points are transverse: $g'(s)\\ne0$ at each, so the intersection is a $0$-dimensional submanifold (isolated points)."}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Theorem',
      name: 'Transversality is generic',
      statement: String.raw`(Parametric transversality.) Let $\Phi\colon X\times P\to M$ be a smooth map of manifolds (without boundary, second countable) and $S\subset M$ an embedded submanifold. If $\Phi\pitchfork S$, then for **almost every** parameter $q\in P$ (all outside a set of measure zero) the map $\Phi_q=\Phi(\cdot,q)\colon X\to M$ is transverse to $S$. In particular, for any smooth $f\colon X\to M$ and any $S$ there are arbitrarily small perturbations of $f$ transverse to $S$ (take the parameter space to be a small ball of linear maps added to an embedding in $\R^N$).`,
      idea: String.raw`Look at the manifold $W=\Phi^{-1}(S)$, which is a submanifold of $X\times P$ because $\Phi\pitchfork S$ (3.11). The projection $\pi\colon W\to P$ has a differential that fails to be onto exactly at the points $(x,q)$ where $\Phi_q$ is not transverse to $S$ at $x$: a short linear-algebra check. So the parameters $q$ for which $\Phi_q$ is not transverse are precisely the critical values of $\pi$, and by Sard's theorem (3.8) they form a null set. The generic statement is the engine behind the Whitney theorems and the dimension count of intersections.`,
      caption: String.raw`The fixed curve $S$ is the wavy closed curve; the moving curve is a small closed curve $C$ translated by $q=(a,b)$. Drag $q$ in the right panel, the parameter plane; on the left you see $S$, $C+q$, their intersection points and the sine of the crossing angle at each. The map $(\sigma,t)\mapsto S(\sigma)-C(t)$ is a map of a torus to the plane whose critical values are exactly the translations with a tangency: the curve drawn in the parameter plane (dots). Choose $\delta$: the random sample points (green) lie farther than $\delta$ from that curve, so the corresponding translates are transverse; the red ones are within $\delta$. As $\delta\to0$ the red share shrinks to $0$.`,
      deps: ['mfd-3.11', 'mfd-3.8'],
      refs: ['Lee SM Ch. 6'],
      tags: ['transversality', 'generic'],
      scope: String.raw`The picture is the translation family $q\mapsto C+q$ of two plane curves, the simplest instance of the parametric transversality theorem.`,
      viz(v) {
        const dl = v.slider('tolerance $\\delta$', 0.01, 1, 0.3, { log: true, sig: 2 });
        const A = v.stage({ x: [-3, 3], y: [-2.4, 2.4], equal: true, axes: false, height: 340, weight: 1, minWidth: 280, title: 'the curves $S$ and $C+q$' });
        const B = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 280, xlabel: 'a', ylabel: 'b', title: 'parameter plane $q=(a,b)$' });
        const q = B.handle(0.9, 0.5, { color: 'gold', label: 'q', constrain: { x: [-3, 3], y: [-3, 3] } });
        const NP = 300, Spts = [], Cpts = [];
        for (let i = 0; i <= NP; i++) { Spts.push(Sc((TAU * i) / NP)); }
        for (let i = 0; i <= NP; i++) { Cpts.push(Cc((TAU * i) / NP)); }
        let info = null;
        v.render(() => {
          const { E, smp } = tangencies(), d = dl.value;
          const sh = Cpts.map((p) => [p[0] + q.x, p[1] + q.y]);
          A.path(Spts, { color: 'ink', width: 2.6 });
          A.path(sh, { color: 'orange', width: 2.6 });
          const pts = [];
          for (let i = 0; i < NP; i++) for (let j = 0; j < NP; j++) { const X = segX(Spts[i], Spts[i + 1], sh[j], sh[j + 1]); if (X) { const sn = Math.abs(X[2] * X[5] - X[3] * X[4]) / (Math.hypot(X[2], X[3]) * Math.hypot(X[4], X[5])); pts.push([X[0], X[1], sn]); } }
          for (const p of pts) A.dot(p[0], p[1], { r: 5, color: p[2] < 0.05 ? 'red' : 'green' });
          const dE = Math.min(...E.map((e) => Math.hypot(e[0] - q.x, e[1] - q.y)));
          B.dots(E, { r: 1.6, color: 'purple' });
          let bad = 0;
          for (const s of smp) { const isBad = s[2] < d; if (isBad) bad++; B.dot(s[0], s[1], { r: 1.8, color: isBad ? 'red' : 'green' }); }
          B.circle(q.x, q.y, d, { color: 'gold', width: 1.2, fill: 'gold', fillAlpha: 0.06 });
          B.dot(q.x, q.y, { r: 6, color: 'gold' });
          info = { pts, dE, bad: bad / smp.length, d, n: smp.length };
        });
        v.readout(() => {
          if (!info) return '';
          const sn = info.pts.length ? Math.min(...info.pts.map((p) => p[2])) : null;
          return `At $q$: ${info.pts.length} intersection point${info.pts.length === 1 ? '' : 's'}${sn === null ? '' : `, smallest $|\\sin(\\text{crossing angle})|=${v.fix(sn, 3)}$`}; distance from $q$ to the tangency curve: $${v.fix(info.dE, 3)}$ (it is $0$ only on that curve).\nOf $${info.n}$ random translations, **${v.fix(100 * info.bad, 1)}%** lie within $\\delta=${v.fix(info.d, 2)}$ of the tangency curve; the share shrinks about linearly with $\\delta$, so the exceptional set has measure zero.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Theorem',
      name: 'Mod 2 degree',
      statement: String.raw`Let $F\colon M\to N$ be a smooth map between compact manifolds of the same dimension, $N$ connected, and $q\in N$ a regular value. Then $F^{-1}(q)$ is a finite set, and the number $\#F^{-1}(q)\bmod 2$ does not depend on the regular value $q$ and is unchanged if $F$ is replaced by a smoothly homotopic map. This common residue is the **mod 2 degree** $\deg_2F\in\{0,1\}$. (For oriented $M,N$ the signed count of preimages is the integer degree, and $\#F^{-1}(q)\equiv\deg F\pmod 2$.)`,
      idea: String.raw`Regular values are plentiful (Sard, 3.8), and at a regular value $q$ the fibre is a compact $0$-dimensional submanifold (3.5), hence finite. Near $q$ the count is locally constant because the inverse function theorem gives disjoint neighbourhoods on which $F$ is a diffeomorphism. As $q$ moves across a critical value, preimages appear or disappear in pairs at a fold, which changes the count by $2$. A homotopy $H\colon M\times[0,1]\to N$ with $q$ regular for $H$ and its ends has $H^{-1}(q)$ a compact $1$-manifold with boundary $F_0^{-1}(q)\sqcup F_1^{-1}(q)$, and a compact $1$-manifold has an even number of boundary points. This is the treatment in Milnor's *Topology from the Differentiable Viewpoint* (1965).`,
      caption: String.raw`**Circle to circle:** $f(\theta)=d\theta+A\sin3\theta$. Move the target point $y$ (orange lines in the graph of the lift, and the point on the target circle): the dots are the preimages, green where $f$ is increasing and red where it is decreasing. Increase the wiggle $A$ and watch the number of preimages jump by $2$ at the critical values, never by $1$; the parity stays that of $d$, and the signed count equals $d$. **Plane map** $z\mapsto z^3+t\bar z$ on the sphere: the target is coloured by the number of preimages (counted from the images of a fine triangulation of the domain), and the red curve is the set of critical values, where the count changes by $2$; drag $q$ to see its preimages.`,
      deps: ['mfd-3.8', 'mfd-1.8'],
      refs: ['Lee SM Ch. 6'],
      tags: ['degree', 'regular value'],
      scope: String.raw`Compact domain and target of equal dimension; the plane picture is the map $z\mapsto z^3+t\bar z$ of the Riemann sphere (it is a proper map of the plane, extended by $\infty\mapsto\infty$) with $0\le t\le3$.`,
      viz(v) {
        const mode = v.select('map', [{ value: 'circle', label: '$S^1\\to S^1$' }, { value: 'plane', label: '$z\\mapsto z^3+t\\bar z$ on $S^2$' }], 'circle');
        const dsel = v.select('degree $d$', ['1', '2', '3'], '2');
        const amp = v.slider('wiggle $A$', 0, 2.2, 0.9, { step: 0.01 });
        const yy = v.slider('target value $y$', 0, TAU, 1.2, { step: 0.005, decimals: 3 });
        const tt = v.slider('$t$', 0, 3, 1.5, { step: 0.01 });
        const G1 = v.stage({ x: [0, TAU], y: [-0.5, 10], axes: 'box', gutter: true, height: 340, weight: 1.3, minWidth: 290, xlabel: 'θ', ylabel: 'f(θ)', xticks: [[0, '0'], [PI, 'π'], [TAU, '2π']], title: 'lift of $f$ and the line $f=y+2\\pi m$' });
        const G2 = v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, axes: false, height: 340, weight: 1, minWidth: 250, title: 'source circle (left) and target circle (right)' });
        const P1 = v.stage({ x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'Re z', ylabel: 'Im z', title: 'domain: preimages of $q$' });
        const P2 = v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], equal: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'Re w', ylabel: 'Im w', title: 'target, coloured by number of preimages' });
        const qh = P2.handle(0.9, 0.4, { color: 'gold', label: 'q', constrain: { x: [-2.4, 2.4], y: [-2.4, 2.4] } });
        // plane map counts
        const pc = {};
        const cmap = (t) => (z) => { const re = z[0] ** 3 - 3 * z[0] * z[1] ** 2 + t * z[0], im = 3 * z[0] ** 2 * z[1] - z[1] ** 3 - t * z[1]; return [re, im]; };
        function planeData(t) {
          const key = t.toFixed(3);
          if (pc[key]) return pc[key];
          const F = cmap(t), n = 110, W = 2.4, h = (2 * W) / n, GT = 100, TW = 2.5, ph = (2 * TW) / GT;
          const cnt = new Uint8Array(GT * GT), img = [];
          for (let i = 0; i <= n; i++) { img.push([]); for (let j = 0; j <= n; j++) img[i].push(F([-W + i * h, -W + j * h])); }
          const tris = [];
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { tris.push([i, j, i + 1, j, i + 1, j + 1]); tris.push([i, j, i + 1, j + 1, i, j + 1]); }
          for (const [i1, j1, i2, j2, i3, j3] of tris) {
            const a = img[i1][j1], b = img[i2][j2], c = img[i3][j3];
            const x0 = Math.min(a[0], b[0], c[0]), x1 = Math.max(a[0], b[0], c[0]), y0 = Math.min(a[1], b[1], c[1]), y1 = Math.max(a[1], b[1], c[1]);
            if (x1 < -TW || x0 > TW || y1 < -TW || y0 > TW) continue;
            const d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
            if (Math.abs(d) < 1e-14) continue;
            for (let I = Math.max(0, Math.floor((x0 + TW) / ph)); I <= Math.min(GT - 1, Math.floor((x1 + TW) / ph)); I++) for (let J = Math.max(0, Math.floor((y0 + TW) / ph)); J <= Math.min(GT - 1, Math.floor((y1 + TW) / ph)); J++) {
              const px = -TW + (I + 0.5) * ph, py = -TW + (J + 0.5) * ph;
              const l1 = ((b[1] - c[1]) * (px - c[0]) + (c[0] - b[0]) * (py - c[1])) / d, l2 = ((c[1] - a[1]) * (px - c[0]) + (a[0] - c[0]) * (py - c[1])) / d, l3 = 1 - l1 - l2;
              if (l1 >= 0 && l2 >= 0 && l3 >= 0) cnt[I * GT + J]++;
            }
          }
          return (pc[key] = { cnt, GT, TW, ph, F, W, n, h, img });
        }
        function preimages(D, w) {
          const out = [], { F, W, h, n, img } = D, tol = 1e-9;
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            const c = [img[i][j], img[i + 1][j], img[i][j + 1], img[i + 1][j + 1]];
            if (Math.min(...c.map((p) => p[0])) > w[0] + 0.3 || Math.max(...c.map((p) => p[0])) < w[0] - 0.3 || Math.min(...c.map((p) => p[1])) > w[1] + 0.3 || Math.max(...c.map((p) => p[1])) < w[1] - 0.3) continue;
            let z = [-W + (i + 0.5) * h, -W + (j + 0.5) * h];
            for (let it = 0; it < 30; it++) {
              const f = F(z), r = [f[0] - w[0], f[1] - w[1]], e = 1e-6, a = F([z[0] + e, z[1]]), b = F([z[0], z[1] + e]);
              const J = [[(a[0] - f[0]) / e, (b[0] - f[0]) / e], [(a[1] - f[1]) / e, (b[1] - f[1]) / e]], det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
              if (Math.abs(det) < 1e-12) break;
              z = [z[0] - (J[1][1] * r[0] - J[0][1] * r[1]) / det, z[1] - (-J[1][0] * r[0] + J[0][0] * r[1]) / det];
              if (Math.hypot(r[0], r[1]) < tol) break;
            }
            const f = F(z);
            if (Math.hypot(f[0] - w[0], f[1] - w[1]) < 1e-7 && Math.abs(z[0]) <= W && Math.abs(z[1]) <= W && !out.some((o) => Math.hypot(o[0] - z[0], o[1] - z[1]) < 1e-5)) {
              const e = 1e-6, a = F([z[0] + e, z[1]]), b = F([z[0], z[1] + e]), det = ((a[0] - f[0]) / e) * ((b[1] - f[1]) / e) - ((b[0] - f[0]) / e) * ((a[1] - f[1]) / e);
              out.push([z[0], z[1], Math.sign(det)]);
            }
          }
          return out;
        }
        let info = null;
        v.render(() => {
          const circ = mode.value === 'circle';
          for (const s of [G1, G2]) s.el.style.display = circ ? '' : 'none';
          for (const s of [P1, P2]) s.el.style.display = circ ? 'none' : '';
          dsel.el.hidden = !circ; amp.el.hidden = !circ; yy.el.hidden = !circ; tt.el.hidden = circ;
          qh.visible = !circ;
          if (circ) {
            const d = +dsel.value, A = amp.value, f = (th) => d * th + A * Math.sin(3 * th), fp = (th) => d + 3 * A * Math.cos(3 * th);
            const y = yy.value, lo = Math.min(...Array.from({ length: 400 }, (_, i) => f((TAU * i) / 400))), hi = Math.max(...Array.from({ length: 400 }, (_, i) => f((TAU * i) / 400)));
            G1.setView([0, TAU], [Math.min(-0.5, lo - 0.5), Math.max(TAU * d + 0.5, hi + 0.5)]);
            G1.fn(f, { color: 'accent', width: 2.6, domain: [0, TAU], n: 500 });
            const roots = [];
            for (let m = -3; m <= 4; m++) {
              const lv = y + TAU * m;
              if (lv >= lo - 1e-9 && lv <= hi + 1e-9) G1.hline(lv, { color: 'orange', width: 1.2, alpha: 0.7 });
              let prev = f(0) - lv;
              for (let i = 1; i <= 2000; i++) {
                const th = (TAU * i) / 2000, cur = f(th) - lv;
                if ((prev < 0) !== (cur < 0) && prev !== 0) { let a = (TAU * (i - 1)) / 2000, b = th; for (let k = 0; k < 40; k++) { const mm = (a + b) / 2; if ((f(a) - lv < 0) === (f(mm) - lv < 0)) a = mm; else b = mm; } roots.push((a + b) / 2); }
                prev = cur;
              }
            }
            const dedup = roots.filter((r, i) => roots.findIndex((s) => Math.abs(s - r) < 1e-6) === i);
            for (const r of dedup) G1.dot(r, f(r), { r: 6, color: fp(r) > 0 ? 'green' : 'red' });
            // fold points: critical values
            const crit = []; for (let i = 0; i < 6000; i++) { const th = (TAU * i) / 6000; if ((fp(th) < 0) !== (fp((TAU * (i + 1)) / 6000) < 0)) crit.push(th); }
            const cx0 = -0.8, cx1 = 1.0, R0 = 0.65;
            G2.circle(cx0, 0, R0, { color: 'muted', width: 2 }); G2.circle(cx1, 0, R0, { color: 'muted', width: 2 });
            G2.text('source $\\theta$', cx0, -R0 - 0.2, { align: 'center', color: 'muted' }); G2.text('target', cx1, -R0 - 0.2, { align: 'center', color: 'muted' });
            G2.dot(cx1 + R0 * Math.cos(y), R0 * Math.sin(y), { r: 7, color: 'orange' });
            for (const r of dedup) { const col = fp(r) > 0 ? 'green' : 'red'; G2.dot(cx0 + R0 * Math.cos(r), R0 * Math.sin(r), { r: 6, color: col }); G2.line(cx0 + R0 * Math.cos(r), R0 * Math.sin(r), cx1 + R0 * Math.cos(y), R0 * Math.sin(y), { color: col, width: 1, alpha: 0.35 }); }
            const np = dedup.filter((r) => fp(r) > 0).length, nm = dedup.length - np;
            const cvals = crit.map((th) => ((f(th) % TAU) + TAU) % TAU);
            const nearCrit = cvals.some((c) => Math.abs(adiff(c - y)) < 0.01);
            info = { circ, n: dedup.length, np, nm, d, nearCrit };
          } else {
            const t = tt.value, D = planeData(t), GT = D.GT, TW = D.TW;
            P2.heat((x, y) => { const I = Math.floor((x + TW) / D.ph), J = Math.floor((y + TW) / D.ph); return I >= 0 && I < GT && J >= 0 && J < GT ? D.cnt[I * GT + J] : 0; }, { range: [0, 6], cmap: 'theme', res: 3, key: 'c' + t.toFixed(3), rect: [-TW, -TW, TW, TW] });
            const rc = Math.sqrt(t / 3);
            if (t > 1e-6) { P2.curve((th) => { const z = [rc * Math.cos(th), rc * Math.sin(th)], w = D.F(z); return w; }, 0, TAU, { n: 400, color: 'red', width: 2.4 }); P1.circle(0, 0, rc, { color: 'red', width: 2.2 }); }
            else { P2.dot(0, 0, { r: 5, color: 'red' }); P1.dot(0, 0, { r: 5, color: 'red' }); }
            const pre = preimages(D, [qh.x, qh.y]);
            for (const p of pre) P1.dot(p[0], p[1], { r: 6, color: p[2] > 0 ? 'green' : 'red' });
            P2.dot(qh.x, qh.y, { r: 6, color: 'gold' });
            const np = pre.filter((p) => p[2] > 0).length, nm = pre.length - np;
            const I = Math.floor((qh.x + TW) / D.ph), J = Math.floor((qh.y + TW) / D.ph);
            info = { circ, n: pre.length, np, nm, grid: D.cnt[I * GT + J], t };
          }
        });
        v.readout(() => {
          if (!info) return '';
          if (info.circ) return `Number of preimages of $y$: **${info.n}** (${info.np} with $f'>0$, ${info.nm} with $f'<0$). Signed count $${info.np}-${info.nm}=${info.np - info.nm}=d$, and $${info.n}\\equiv${info.n % 2}\\equiv d\\pmod 2$: the mod 2 degree is $${info.d % 2}$ for every regular value.${info.nearCrit ? '\\nNear a critical value: the count is about to change by $2$.' : ''}`;
          return `Preimages of $q$: **${info.n}** (orientation preserving $${info.np}$, reversing $${info.nm}$; the triangulation count at $q$ gives $${info.grid}$). Signed count $${info.np - info.nm}$, parity $${info.n % 2}$: odd, as for $z^3$ (degree $3$). Counts change by $2$ across the red curve of critical values $|z|^2=t/3$ and nowhere else.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.14
    {
      num: '3.14',
      kind: 'Definition',
      name: 'Morse functions and the Morse lemma',
      statement: String.raw`A critical point $p$ of a smooth function $f\colon M\to\R$ ($df_p=0$) is **nondegenerate** if the Hessian matrix $\big(\partial^2f/\partial x^i\partial x^j\big)(p)$ in some (hence any) chart is invertible; its **index** is the number of negative eigenvalues. A **Morse function** has only nondegenerate critical points. **Morse lemma:** near a nondegenerate critical point of index $\lambda$ there is a chart $(y^1,\dots,y^n)$ centred at $p$ with
$$f=f(p)-(y^1)^2-\dots-(y^\lambda)^2+(y^{\lambda+1})^2+\dots+(y^n)^2 .$$
In particular nondegenerate critical points are isolated, and for a Morse function on a compact manifold without boundary, sublevel sets between regular values are diffeomorphic if no critical value is crossed. Crossing a single critical point of index $\lambda$ attaches a $\lambda$-handle; up to homotopy this is a cell of dimension $\lambda$. Several critical points at the same level attach one handle each.`,
      idea: String.raw`Write $f-f(p)=\sum x^ix^j g_{ij}(x)$ with smooth $g_{ij}$ (Hadamard's lemma applied twice), so that $g_{ij}(0)=\tfrac12\partial_{ij}f(p)$ is half the invertible Hessian. Then complete squares inductively, one coordinate at a time, using the inverse function theorem (2.8) at each step to turn the new square roots into coordinates. At first order this just diagonalizes the Hessian; the content of the lemma is that the nonlinear corrections can be absorbed into the chart. The topological consequence comes from flowing along $\nabla f/|\nabla f|^2$ between critical values, which is a diffeomorphism of sublevel sets; the Euler characteristic of $M$ is $\sum(-1)^{\lambda}$ over the critical points.`,
      caption: String.raw`The height function on a torus of revolution, projected along a direction tilted by $\tau$ from its axis. The 3D torus shows the sublevel set $\{h\le c\}$ in blue; the chart shows the same set in the angle square, and the step plot gives the Euler characteristic $\chi(\{h\le c\})=\sum(-1)^{\text{index}}$ over critical values below $c$: it goes $0\to1\to0\to-1\to0$, ending at $\chi(T^2)=0$. Pick a critical point: the left lower panel shows the level curves of $h-h(p)$ (blue) against those of its Hessian quadratic form (orange) near $p$, the right one the normal form $\pm u^2\pm v^2$ in Hessian coordinates; shrink the radius and the two match. At $\tau=0$ the critical points become two whole circles: $h$ is no longer Morse.`,
      deps: ['mfd-3.1'],
      refs: ['Nicolaescu, An Invitation to Morse Theory, Theorem1.1.12 and Corollary1.1.17 pp.10–14; Theorems2.2.2–2.2.3 pp.38–42; Corollary2.3.3 pp.48–49'],
      tags: ['Morse function', 'index'],
      scope: String.raw`The local panels use the quadratic (Hessian) part, which already agrees with $f$ to second order; the nonlinear chart of the Morse lemma itself is not computed. The critical points are located by an explicit formula valid for the torus of revolution.`,
      viz(v) {
        const tl = v.slider('tilt $\\tau$ of the projection (degrees)', 0, 90, 35, { step: 1 });
        const lev = v.slider('level $c$', -1.9, 1.9, 0.2, { step: 0.005, decimals: 3 });
        const which = v.select('critical point (by value)', [{ value: 0, label: 'lowest' }, { value: 1, label: '2nd' }, { value: 2, label: '3rd' }, { value: 3, label: 'highest' }], 0);
        const rad = v.slider('radius $\\rho$', 0.06, 1.2, 0.6, { step: 0.01 });
        const S3 = v.stage3d({ range: 2.1, height: 340, yaw: -0.55, pitch: 0.5, axes: false, weight: 1, minWidth: 270, title: 'sublevel set $\\{h\\le c\\}$' });
        const C = v.stage({ x: [0, TAU], y: [0, TAU], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 270, xlabel: 'a', ylabel: 'b', xticks: [[0, '0'], [PI, 'π'], [TAU, '2π']], yticks: [[0, '0'], [PI, 'π'], [TAU, '2π']], title: 'angle square' });
        const X = v.stage({ x: [-2, 2], y: [-1.6, 2.2], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 270, xlabel: 'c', ylabel: 'χ', title: '$\\chi(\\{h\\le c\\})$' });
        const L1 = v.stage({ x: [-0.6, 0.6], y: [-0.6, 0.6], equal: true, axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 250, xlabel: 'Δa', ylabel: 'Δb', title: '$h-h(p)$ (blue) and its Hessian form (orange)' });
        const L2 = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 250, xlabel: 'u₁', ylabel: 'u₂', title: 'normal form $\\pm u_1^2\\pm u_2^2$' });
        let info = null;
        v.render(() => {
          const tau = (tl.value * PI) / 180, { w, h } = Hh(tau), c = lev.value;
          const beta = PI / 2 - tau, degenerate = Math.abs(tau) < 1e-10;
          let crit = [];
          if (!degenerate) {
            crit = [[0, beta], [PI, PI - beta], [PI, -beta], [0, beta - PI]].map(([a, b]) => [a, wrap(b)]).map(([a, b]) => {
              const e = 1e-3, hab = (h(a + e, b + e) - h(a + e, b - e) - h(a - e, b + e) + h(a - e, b - e)) / (4 * e * e), haa = (h(a + e, b) - 2 * h(a, b) + h(a - e, b)) / (e * e), hbb = (h(a, b + e) - 2 * h(a, b) + h(a, b - e)) / (e * e);
              const tr = haa + hbb, dt = haa * hbb - hab * hab, disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - dt)), l1 = tr / 2 - disc, l2 = tr / 2 + disc;
              return { a, b, val: h(a, b), H: [[haa, hab], [hab, hbb]], l: [l1, l2], idx: (l1 < 0 ? 1 : 0) + (l2 < 0 ? 1 : 0) };
            }).sort((p, q) => p.val - q.val);
          }
          S3.surface((a, b) => torusPt(a, b), [0, TAU], [0, TAU], { nu: 64, nv: 32, alpha: 0.97, colorFn: (a, b) => (h(a, b) <= c ? 'accent' : 'faint') });
          const col = ['green', 'orange', 'orange', 'red'];
          crit.forEach((p, i) => S3.dot(torusPt(p.a, p.b), { r: 6, color: col[p.idx === 0 ? 0 : p.idx === 1 ? 1 : 3] }));
          C.heat((a, b) => (h(a, b) <= c ? 1 : 0), { range: [0, 1.6], cmap: 'theme', res: 3, key: 'sl' + tl.value + '|' + c.toFixed(3) });
          const lv = []; for (let k = -8; k <= 8; k++) lv.push(k * 0.2);
          C.contour((a, b) => h(a, b), lv, { color: 'ink', width: 1, alpha: 0.3, res: 110 });
          C.contour((a, b) => h(a, b), [c], { color: 'orange', width: 2.6, res: 160 });
          crit.forEach((p) => C.dot(p.a, p.b, { r: 5, color: p.idx === 0 ? 'green' : p.idx === 1 ? 'orange' : 'red' }));
          // Euler characteristic step plot
          const chi = (x) => crit.reduce((s, p) => s + (p.val <= x ? (p.idx % 2 ? -1 : 1) : 0), 0);
          if (!degenerate) {
            let prev = -2, cur = 0;
            for (const p of crit.concat([{ val: 2 }])) { X.line(prev, cur, Math.min(p.val, 2), cur, { color: 'accent', width: 2.6 }); if (p.val < 2) { X.line(p.val, cur, p.val, chi(p.val), { color: 'faint', width: 1 }); } prev = p.val; cur = chi(p.val + 1e-9); }
            crit.forEach((p) => X.dot(p.val, chi(p.val), { r: 5, color: p.idx === 0 ? 'green' : p.idx === 1 ? 'orange' : 'red' }));
            X.vline(c, { color: 'orange', width: 1.6 }); X.dot(c, chi(c), { r: 6, color: 'gold' });
          } else X.text('degenerate: no isolated critical points', 0, 0.3, { align: 'center', color: 'muted' });
          // local panels
          const sel = crit[+which.value];
          which.el.hidden = degenerate; rad.el.hidden = degenerate;
          L1.el.style.display = degenerate ? 'none' : ''; L2.el.style.display = degenerate ? 'none' : '';
          let err = null;
          if (sel) {
            const rho = rad.value, hp = sel.val, [l1, l2] = sel.l, H = sel.H;
            L1.setView([-rho, rho], [-rho, rho]);
            const qf = (x, y) => 0.5 * (H[0][0] * x * x + 2 * H[0][1] * x * y + H[1][1] * y * y);
            const lmax = Math.max(Math.abs(l1), Math.abs(l2)), step = (0.5 * lmax * rho * rho) / 4, lv2 = []; for (let k = -4; k <= 4; k++) lv2.push(k * step);
            L1.contour((x, y) => h(sel.a + x, sel.b + y) - hp, lv2, { color: 'accent', width: 2.4, res: 140 });
            L1.contour(qf, lv2, { color: 'orange', width: 1.2, alpha: 0.9, res: 140 });
            L1.dot(0, 0, { r: 4.5, color: 'red' });
            // normal form in Hessian coordinates
            const Rr = rho * Math.sqrt(lmax / 2) * 1.2;
            L2.setView([-Rr, Rr], [-Rr, Rr]);
            const s1 = Math.sign(l1) || 1, s2 = Math.sign(l2) || 1;
            L2.contour((x, y) => s1 * x * x + s2 * y * y, lv2.map((x) => x), { color: 'green', width: 2, res: 140 });
            L2.dot(0, 0, { r: 4.5, color: 'red' });
            // second-order error on the circle of radius rho
            let m = 0; for (let k = 0; k < 48; k++) { const th = (TAU * k) / 48, x = rho * Math.cos(th), y = rho * Math.sin(th); m = Math.max(m, Math.abs(h(sel.a + x, sel.b + y) - hp - qf(x, y))); }
            err = m / (rho * rho);
          }
          info = { degenerate, crit, sel, err, chi: chi(c), c };
        });
        v.readout(() => {
          if (!info) return '';
          const f = (x) => minus(v.fix(x, 3));
          if (info.degenerate) return 'Tilt $0$: $h=z$-coordinate along the axis. Its critical set is the top and the bottom circle: along them the Hessian in the direction of the circle is $0$ (a **degenerate** critical set), so $h$ is not a Morse function and the Morse lemma does not apply.';
          const s = info.sel;
          return `Critical values $${info.crit.map((p) => f(p.val)).join(',\\ ')}$ with indices $${info.crit.map((p) => p.idx).join(',\\ ')}$ (sum of $(-1)^{\\text{index}}=0=\\chi(T^2)$). At the level $c=${f(info.c)}$: $\\chi(\\{h\\le c\\})=${info.chi}$.\nSelected point: Hessian eigenvalues $${f(s.l[0])},\\ ${f(s.l[1])}$, $\\det=${f(s.l[0] * s.l[1])}\\ne0$: nondegenerate, index ${s.idx}. Largest $|h-h(p)-\\tfrac12\\,\\text{Hess}|/\\rho^2$ on the circle of radius $\\rho$: $${f(info.err)}$ (→ 0 as $\\rho\\to0$).`;
        });
      },
    },
  ],
};
