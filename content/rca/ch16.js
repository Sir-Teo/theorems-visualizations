// Rudin, Real and Complex Analysis — Chapter 16: Analytic Continuation

// ---------------------------------------------------------------- helpers shared by this file
// Phase-portrait colour of w = re + i im (same scheme as Stage.domain): hue = arg w, bands = log2|w|.
// `fade` in [0,1] blends toward the RGB colour `bg` (pass v.rgb('panel') so it works in both themes).
function phaseRGB(M, re, im, fade = 0, bg = null) {
  if (!isFinite(re) || !isFinite(im)) return bg ? [bg[0], bg[1], bg[2]] : [250, 250, 250];
  const t = M.fract(Math.log2(Math.hypot(re, im) + 1e-300));
  const c = M.hsl2rgb(Math.atan2(im, re) / M.TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
  if (!fade || !bg) return c;
  return [c[0] + (bg[0] - c[0]) * fade, c[1] + (bg[1] - c[1]) * fade, c[2] + (bg[2] - c[2]) * fade];
}
// A small "×" marking a singular point, with a halo so it reads on top of a phase portrait.
function xMark(S, x, y, color = 'ink', size = 5.5) {
  const d = size / S.scale;
  for (const [col, w] of [['panel', 5], [color, 2.2]]) {
    S.line(x - d, y - d, x + d, y + d, { color: col, width: w });
    S.line(x - d, y + d, x + d, y - d, { color: col, width: w });
  }
}
const subD = (n) => String(n).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[+d]).join('');
// complex arithmetic on [re, im] pairs (fast, allocation-light)
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const clog = (a) => [Math.log(Math.hypot(a[0], a[1])), Math.atan2(a[1], a[0])];
const csqrt = (a) => { const r = Math.sqrt(Math.hypot(a[0], a[1])), t = Math.atan2(a[1], a[0]) / 2; return [r * Math.cos(t), r * Math.sin(t)]; };
const cexp = (a) => { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; };
function cpowInt(z, k) { let r = [1, 0], b = z; while (k > 0) { if (k & 1) r = cmul(r, b); b = cmul(b, b); k >>= 1; } return r; }

// Σ_{k≥0} c_k z^{2^k} by repeated squaring (decay = c_{k+1}/c_k).
function lac2(x, y, decay = 1) {
  let pr = x, pi = y, sr = 0, si = 0, c = 1;
  for (let k = 0; k < 60; k++) {
    sr += c * pr; si += c * pi;
    const m = pr * pr + pi * pi; if (m < 1e-34 || m > 1e300) break;
    const t = pr * pr - pi * pi; pi = 2 * pr * pi; pr = t; c *= decay;
  }
  return [sr, si];
}
// Σ_{k≥1} z^{k!}
function lacFact(x, y) {
  let p = [x, y], sr = 0, si = 0;
  for (let k = 1; k < 13; k++) {
    if (k > 1) p = cpowInt(p, k);
    sr += p[0]; si += p[1];
    if (p[0] * p[0] + p[1] * p[1] < 1e-34) break;
  }
  return [sr, si];
}

// Dilogarithm Li₂(z) = Σ zⁿ/n² on the closed disc (and its principal continuation off [1,∞)):
// direct series near 0, Euler's reflection near 1, Bernoulli series in u = −log(1−z) elsewhere.
const LI2B = (() => {
  const N = 42, B = new Array(N).fill(0); B[0] = 1;
  const binom = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; };
  for (let m = 1; m < N; m++) { let s = 0; for (let k = 0; k < m; k++) s += binom(m + 1, k) * B[k]; B[m] = -s / (m + 1); }
  return B.map((b, n) => { let f = 1; for (let i = 2; i <= n + 1; i++) f *= i; return b / f; });
})();
function li2s(z, N) { let p = [1, 0]; const s = [0, 0]; for (let n = 1; n <= N; n++) { p = cmul(p, z); s[0] += p[0] / (n * n); s[1] += p[1] / (n * n); } return s; }
function li2(z) {
  const [x, y] = z;
  if (Math.hypot(x, y) < 0.5) return li2s(z, 60);
  if (Math.hypot(1 - x, y) < 0.5) {
    const ab = cmul(clog(z), clog([1 - x, -y])), l = li2s([1 - x, -y], 60);
    return [Math.PI * Math.PI / 6 - ab[0] - l[0], -ab[1] - l[1]];
  }
  const l = clog([1 - x, -y]); const u = [-l[0], -l[1]];
  let p = [1, 0]; const s = [0, 0];
  for (let n = 0; n < 40; n++) { p = cmul(p, u); s[0] += LI2B[n] * p[0]; s[1] += LI2B[n] * p[1]; }
  return s;
}

// Taylor coefficients of f about c from values on the circle |ξ−c| = ρ inside U (discrete Cauchy integral),
// and the radius of convergence R of the re-centred series from a fit log|b_n| ≈ A − n log R + C log n.
function solve3(A, b) {
  const m = A.map((r, i) => [...r, b[i]]);
  for (let i = 0; i < 3; i++) {
    let p = i; for (let k = i + 1; k < 3; k++) if (Math.abs(m[k][i]) > Math.abs(m[p][i])) p = k;
    [m[i], m[p]] = [m[p], m[i]];
    for (let k = 0; k < 3; k++) if (k !== i) { const f = m[k][i] / m[i][i]; for (let j = i; j < 4; j++) m[k][j] -= f * m[i][j]; }
  }
  return m.map((r, i) => r[3] / r[i]);
}
function probeSeries(f, c, MS = 256, NC = 56) {
  const rho = 0.92 * (1 - Math.hypot(c[0], c[1]));
  const vr = new Float64Array(MS), vi = new Float64Array(MS); let fmax = 0;
  for (let j = 0; j < MS; j++) {
    const t = 2 * Math.PI * j / MS; const w = f([c[0] + rho * Math.cos(t), c[1] + rho * Math.sin(t)]);
    vr[j] = w[0]; vi[j] = w[1]; fmax = Math.max(fmax, Math.hypot(w[0], w[1]));
  }
  const ar = [], ai = [], mag = [];
  for (let n = 0; n < NC; n++) {
    let sr = 0, si = 0;
    for (let j = 0; j < MS; j++) { const t = -2 * Math.PI * ((j * n) % MS) / MS; const co = Math.cos(t), sn = Math.sin(t); sr += vr[j] * co - vi[j] * sn; si += vr[j] * sn + vi[j] * co; }
    ar.push(sr / MS); ai.push(si / MS); mag.push(Math.hypot(sr, si) / MS);
  }
  const W = 4, floor = 1e-13 * fmax; const pts = []; let nValid = 2;
  for (let n = 3; n < NC - W; n++) { const e = Math.max(...mag.slice(n, n + W)); if (e > floor) { pts.push([n, Math.log(e)]); nValid = n; } else break; }
  let fit;
  if (pts.length >= 9) {
    const XtX = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], Xty = [0, 0, 0];
    for (const [n, yv] of pts) { const X = [1, n, Math.log(n)]; for (let i = 0; i < 3; i++) { Xty[i] += X[i] * yv; for (let j = 0; j < 3; j++) XtX[i][j] += X[i] * X[j]; } }
    fit = solve3(XtX, Xty);
  } else {
    let sn = 0, sy = 0, snn = 0, sny = 0; for (const [n, yv] of pts) { sn += n; sy += yv; snn += n * n; sny += n * yv; }
    const k = pts.length, sl = k > 1 ? (k * sny - sn * sy) / (k * snn - sn * sn) : 0; fit = [k ? (sy - sl * sn) / k : 0, sl, 0];
  }
  const slope = fit[1], R = rho * Math.exp(-slope);
  // log10 |b_n| (b_n = a_n / ρ^n) and the fitted model, for plotting
  const lb = mag.map((m, n) => (Math.log(m) - n * Math.log(rho)) / Math.LN10);
  const model = (n) => (fit[0] + fit[1] * n + fit[2] * Math.log(n) - n * Math.log(rho)) / Math.LN10;
  const br = new Float64Array(nValid + 1), bi = new Float64Array(nValid + 1);
  for (let n = 0; n <= nValid; n++) { const s = Math.pow(rho, n); br[n] = ar[n] / s; bi[n] = ai[n] / s; }
  return { c, R, rho, br, bi, nValid, lb, model, Rdisp: R * Math.min(0.9, Math.pow(10, -2.5 / Math.max(nValid, 1))) };
}

// Catmull–Rom curve through control points, sampled at n+1 points.
function catmull(P, n = 320) {
  const Q = [P[0], ...P, P[P.length - 1]]; const segs = P.length - 1; const out = [];
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * segs; const k = Math.min(segs - 1, Math.floor(u)); const t = u - k, t2 = t * t, t3 = t2 * t;
    const p0 = Q[k], p1 = Q[k + 1], p2 = Q[k + 2], p3 = Q[k + 3];
    const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
    out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
  }
  return out;
}
// Greedy chain covering a sampled curve: discs centred on the curve, radius κ·|centre| (so they avoid the
// branch point 0); each disc contains the arc up to the next centre, the last one is centred at γ(1).
function chainAlong(pts, kappa, rmax = 1.4) {
  const N = pts.length - 1; const discs = []; let i = 0;
  for (let guard = 0; guard < 500; guard++) {
    const c = pts[i]; const r = Math.min(rmax, kappa * Math.hypot(c[0], c[1]));
    if (r < 0.05) return { discs, ok: false };
    discs.push({ c, r, i });
    if (i === N) return { discs, ok: true };
    let j = i; while (j < N && Math.hypot(pts[j + 1][0] - c[0], pts[j + 1][1] - c[1]) < 0.82 * r) j++;
    if (j === i) return { discs, ok: false };
    i = j;
  }
  return { discs, ok: false };
}
// Elements of log z and √z on a disc D(c, κ|c|): f(z) = v + Log(z/c), resp. v·√(z/c) (principal branches of the ratio).
const BRANCH = {
  log: { start: (c) => clog(c), at: (vv, c, z) => { const l = clog(cdiv(z, c)); return [vv[0] + l[0], vv[1] + l[1]]; } },
  sqrt: { start: (c) => csqrt(c), at: (vv, c, z) => cmul(vv, csqrt(cdiv(z, c))) },
};
function continueChain(discs, kind, v0) {
  const B = BRANCH[kind]; const vals = [v0 || B.start(discs[0].c)];
  for (let k = 1; k < discs.length; k++) vals.push(B.at(vals[k - 1], discs[k - 1].c, discs[k].c));
  return vals;
}
const fmtC = (v, z, d = 3) => `${v.fix(z[0], d)} ${z[1] < 0 ? '-' : '+'} ${v.fix(Math.abs(z[1]), d)}\\,i`;
// convex region where all given discs overlap (boundary samples sorted by angle), or null
function discMeet(discs, n = 240) {
  const pts = [];
  for (const D of discs) for (let k = 0; k < n; k++) {
    const t = 2 * Math.PI * k / n; const p = [D.c[0] + D.r * Math.cos(t), D.c[1] + D.r * Math.sin(t)];
    if (discs.every((E) => E === D || Math.hypot(p[0] - E.c[0], p[1] - E.c[1]) < E.r)) pts.push(p);
  }
  if (pts.length < 3) return null;
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  pts.sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));
  return { pts, c: [cx, cy] };
}

export default {
  collection: 'rca',
  chapter: 16,
  title: 'Analytic Continuation',
  summary: String.raw`A power series lives on a disc, but the function it defines usually wants to live somewhere larger. The chapter first studies the boundary of the disc: every power series meets at least one singular point on its circle of convergence, and series with large enough gaps meet nothing but singular points. It then formalises continuation by chains of discs and along curves, shows that the result is unique for a given curve and unchanged under a homotopy that fixes the end points (the monodromy theorem), and so obtains single-valued branches on simply connected regions. The chapter ends by building, from a conformal map of a curvilinear triangle and the reflection principle, a modular function $\lambda$ that maps the upper half-plane onto $\C\setminus\{0,1\}$, and uses it to prove Picard's theorem: a nonconstant entire function omits at most one value.`,
  items: [
    // ------------------------------------------------------------------ 16.1
    {
      num: '16.1',
      kind: 'Definition',
      name: 'Regular and singular points; natural boundary',
      statement: String.raw`Let $D$ be an open disc, $f\in H(D)$, and $\beta\in\partial D$. The point $\beta$ is a **regular point** of $f$ if there exist an open disc $D_1$ centred at $\beta$ and a function $g\in H(D_1)$ with $g=f$ on $D\cap D_1$. A point of $\partial D$ that is not regular is a **singular point** of $f$.

The regular points form an open subset of $\partial D$, so the singular points form a closed set. When every point of $\partial D$ is singular, $\partial D$ is called the **natural boundary** of $f$.`,
      idea: String.raw`Regularity is a local, one-sided notion: $f$ is only given inside $D$, and $\beta$ is regular when a holomorphic function on a full neighbourhood of $\beta$ agrees with $f$ on the overlap. Because $D\cap D_1$ is convex, hence connected, the uniqueness theorem (10.18) makes $g$ unique. If $\beta$ is regular, every boundary point inside $D_1$ is regular too (a small disc about it inside $D_1$ works with the same $g$), so the regular set is open.`,
      caption: String.raw`Drag $\beta$ around the circle and change the radius of $D_1$. The left panel shows $f$, which is only given on $D$. The right panel zooms in on $D_1$ and shows the extension $g$, drawn only where it exists: its colours continue those of $f$ across the lens $D\cap D_1$. Green arcs are regular points and red crosses are singular points. The dashed green circle is the largest admissible $D_1$, whose radius is the distance from $\beta$ to the nearest singular point. The function $e^{1/(z-1)}$ is bounded in $D$, yet $1$ is singular. For $\sum z^{2^n}$ no disc works anywhere: the right panel only shows $f$ on the lens.`,
      deps: ['rca-10.2'],
      tags: ['analytic continuation', 'singularities'],
      viz(v) {
        const M = v.M;
        const s3 = Math.sqrt(3) / 2;
        const EX = {
          cube: { label: '$\\frac{1}{1-z^3}$', f: (x, y) => { const z3 = cpowInt([x, y], 3); return cdiv([1, 0], [1 - z3[0], -z3[1]]); }, sing: [[1, 0], [-0.5, s3], [-0.5, -s3]] },
          sqrt: { label: '$\\sqrt{1-z}$', f: (x, y) => csqrt([1 - x, -y]), sing: [[1, 0]] },
          ess: { label: '$e^{1/(z-1)}$', f: (x, y) => cexp(cdiv([1, 0], [x - 1, y])), sing: [[1, 0]] },
          lac: { label: '$\\sum_n z^{2^n}$', f: (x, y) => lac2(x, y), sing: null },
        };
        const which = v.select('$f$', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'cube');
        const rad = v.slider('radius of $D_1$', 0.05, 0.9, 0.3, { step: 0.01 });
        const S = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, height: 360, ticks: false, title: '$f$ on $D$, with the disc $D_1$ about $\\beta$' });
        const Z = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, height: 360, axes: false, title: '$g$ on $D_1$ (zoomed): it must equal $f$ on the lens $D\\cap D_1$' });
        const onT = (x, y) => { const a = Math.atan2(y, x); return [Math.cos(a), Math.sin(a)]; };
        const beta = S.handle(Math.cos(2.45), Math.sin(2.45), { color: 'accent', label: 'β', constrain: onT });
        const compass = (t) => ['e', 'ne', 'n', 'nw', 'w', 'sw', 's', 'se'][((Math.round(t / (Math.PI / 4)) % 8) + 8) % 8];
        let st = null;
        v.legend([['green', 'regular points of $T$'], ['red', 'singular points'], ['orange', 'the disc $D_1$', { area: true }], ['green', 'largest admissible $D_1$', { dash: true }], ['ink', 'the lens $D\\cap D_1$', { dash: true }]]);
        v.render(() => {
          const E = EX[which.value], BG = v.rgb('panel');
          const b = [beta.x, beta.y], r = rad.value, th = Math.atan2(b[1], b[0]);
          beta.labelPos = compass(th);
          const rStar = E.sing ? Math.min(...E.sing.map((q) => Math.hypot(q[0] - b[0], q[1] - b[1]))) : 0;
          const rg = Math.min(r, rStar), ok = r <= rStar;
          // left: f on D only
          S.raster((x, y) => { if (x * x + y * y >= 1) return null; const w = E.f(x, y); return phaseRGB(M, w[0], w[1]); }, { key: which.value, id: 'u', res: 2 });
          S.circle(b[0], b[1], r, { color: ok ? 'orange' : 'red', width: 2.2, fill: ok ? 'orange' : 'red', fillAlpha: 0.1 });
          if (rStar > 0) S.circle(b[0], b[1], rStar, { color: 'green', width: 1.4, dash: [5, 4] });
          S.circle(0, 0, 1, { color: 'panel', width: 6 });
          S.circle(0, 0, 1, { color: E.sing ? 'green' : 'red', width: 3 });
          if (E.sing) for (const q of E.sing) xMark(S, q[0], q[1], 'red', 6.5);
          const lt = th + (beta.labelPos.length === 1 ? 0.55 : 0.75);
          S.tex('D_1', b[0] + (r + 0.1) * Math.cos(lt), b[1] + (r + 0.1) * Math.sin(lt), { color: ok ? 'orange' : 'red', size: 16 });
          S.tex('D', -0.55 * Math.cos(th), -0.55 * Math.sin(th), { color: 'ink', size: 19 });
          // right: g on D(β, r*) ∩ D_1, zoomed
          const h = r * 1.18;
          Z.setView([b[0] - h, b[0] + h], [b[1] - h, b[1] + h]);
          Z.raster((x, y) => {
            const d2 = (x - b[0]) ** 2 + (y - b[1]) ** 2; if (d2 >= r * r) return null;
            if (!E.sing) { if (x * x + y * y >= 1) return null; const w = E.f(x, y); return phaseRGB(M, w[0], w[1], 0.55, BG); }
            const inG = d2 < rg * rg; if (!inG && x * x + y * y >= 1) return null;
            const w = E.f(x, y); return phaseRGB(M, w[0], w[1], inG ? 0 : 0.6, BG);
          }, { key: `${which.value}|${b[0].toFixed(4)},${b[1].toFixed(4)}|${r}`, id: 'z', res: 2 });
          Z.circle(b[0], b[1], r, { color: ok ? 'orange' : 'red', width: 2.4 });
          if (rStar > 0 && rStar < r) Z.circle(b[0], b[1], rStar, { color: 'green', width: 1.6, dash: [5, 4] });
          const lens = discMeet([{ c: [0, 0], r: 1 }, { c: b, r }], 360);
          if (lens) Z.poly(lens.pts, { color: 'ink', width: 1.6, dash: [6, 4] });
          Z.circle(0, 0, 1, { color: E.sing ? 'green' : 'red', width: 2.4 });
          if (E.sing) for (const q of E.sing) if (Math.hypot(q[0] - b[0], q[1] - b[1]) < h * 1.4) xMark(Z, q[0], q[1], 'red', 7);
          Z.dot(b[0], b[1], { color: 'accent', r: 4.5, label: 'β', labelPos: beta.labelPos });
          if (lens) Z.tex('D\\cap D_1', lens.c[0] - 0.25 * r * Math.cos(th), lens.c[1] - 0.25 * r * Math.sin(th), { color: 'ink', size: 14 });
          let msg, col;
          if (!E.sing) { msg = 'no g exists: T is the natural boundary'; col = 'red'; }
          else if (ok) { msg = 'g ∈ H(D₁) exists: β is regular'; col = 'green'; }
          else { msg = 'D₁ too big: it contains a singular point'; col = 'red'; }
          Z.corner(msg, 'tl', { color: col, weight: 600 });
          st = { E, b, r, rStar, ok };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const th = Math.atan2(s.b[1], s.b[0]);
          if (!s.E.sing) return `$\\beta = e^{${v.fix(th, 3)}i}$: points $e^{2\\pi i j/2^m}$, where $f(r\\beta)\\to\\infty$ as $r\\to1$, are dense in $T$, and the singular set is closed — so no $\\beta\\in T$ is regular.`;
          if (s.rStar < 1e-3) return `$\\beta = e^{${v.fix(th, 3)}i}$ is a singular point: every disc about it meets the singularity.`;
          return `$\\beta = e^{${v.fix(th, 3)}i}$, distance to the nearest singular point $= ${v.fix(s.rStar, 3)}$. ` + (s.ok ? `With radius $${v.fix(s.r, 2)}\\le ${v.fix(s.rStar, 3)}$ the extension $g$ exists, so $\\beta$ is **regular**.` : `Radius $${v.fix(s.r, 2)} > ${v.fix(s.rStar, 3)}$ fails, but any smaller disc works: $\\beta$ is still **regular**.`);
        });
      },
    },
    // ------------------------------------------------------------------ 16.2
    {
      num: '16.2',
      kind: 'Theorem',
      name: 'A power series has a singular point on its circle of convergence',
      statement: String.raw`Suppose $f\in H(U)$ and the power series $f(z)=\sum_{n\ge 0}a_nz^n$ has radius of convergence exactly $1$. Then $f$ has at least one singular point on $T$.`,
      idea: String.raw`If every $\beta\in T$ were regular, each would carry a disc $D_\beta$ and an extension $g_\beta$. By compactness finitely many discs cover $T$. Where two of them meet, their intersection also meets $U$ and is connected, so the two extensions agree there (10.18). They glue into one holomorphic function on $D(0,1+\eps)$ for some $\eps>0$. By 10.16 its Taylor series at $0$, which is the series of $f$, converges in $D(0,1+\eps)$. This contradicts radius $1$ (Cauchy–Hadamard, PMA 3.39).`,
      caption: String.raw`The gold probes $c$ sit on the circle $|c|=r$. For each probe, the Taylor coefficients of $f$ about $c$ are computed only from values of $f$ inside $U$ (a discrete Cauchy integral). A fit to their growth gives the radius $R(c)$ of the re-centred series (right panel: $\log_{10}|b_n|$ grows with slope $\log_{10}(1/R(c))$, and the dashed red line is the slope that radius $1-|c|$ would give). The phase portrait outside $U$ is that series itself. Past the branch point of $\log\frac1{1-z}$ or $\sum z^n/n^2$, discs from above and below land on different branches, so a seam appears along $(1,\infty)$; that is continuation at work, not an error. Points of $T$ inside some probe disc are certified regular (green). The lower panel plots the excess $R(c)-(1-r)$: it drops to $0$ exactly in the directions of singular points, so the discs can never push the radius past $1$. Drag the highlighted probe, change $r$, and add probes. $\sum z^n/n^2$ converges uniformly on $\overline U$, yet $1$ is still singular.`,
      deps: ['rca-16.1', 'rca-10.16', 'rca-10.18', 'pma-3.39'],
      see: ['pma-8.4', 'pma-8.5'],
      tags: ['power series', 'singularities', 'compactness'],
      viz(v) {
        const M = v.M;
        const EX = {
          rat: { label: '$\\frac{1}{1+z^2}$', f: (z) => cdiv([1, 0], [1 + z[0] * z[0] - z[1] * z[1], 2 * z[0] * z[1]]), sing: [[0, 1], [0, -1]] },
          log: { label: '$\\log\\frac{1}{1-z}$', f: (z) => { const l = clog([1 - z[0], -z[1]]); return [-l[0], -l[1]]; }, sing: [[1, 0]] },
          li2: { label: '$\\sum_{n\\ge1} z^n/n^2$', f: li2, sing: [[1, 0]] },
        };
        const which = v.select('$f$', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'rat');
        const rr = v.slider('probe circle $|c|=r$', 0.25, 0.8, 0.55, { step: 0.01 });
        const K = v.slider('number of probes', 4, 36, 14, { int: true });
        const S = v.stage({ x: [-1.85, 1.85], y: [-1.75, 1.75], equal: true, height: 400, ticks: false, weight: 1.15, title: 'probes $c$ and the discs of their re-centred series' });
        const Cf = v.stage({ x: [0, 56], y: [-2, 20], height: 400, axes: 'box', xlabel: 'n', title: 'coefficients about the highlighted $c$: $\\log_{10}|b_n|$' });
        const PI = Math.PI;
        const B = v.stage({ x: [-PI, PI], y: [-0.05, 1.3], height: 175, full: true, axes: 'box', xticks: [[-PI, '−π'], [-PI / 2, '−π/2'], [0, '0'], [PI / 2, 'π/2'], [PI, 'π']], title: 'excess radius $R(c)-(1-|c|)$ against the direction $\\arg c$' });
        const hp = S.handle(0.55 * Math.cos(1.2), 0.55 * Math.sin(1.2), { color: 'accent', label: 'c', labelPos: 'sw', constrain: (x, y) => { const a = Math.atan2(y, x); return [rr.value * Math.cos(a), rr.value * Math.sin(a)]; } });
        let cacheKey = '', ring = [], st = null;
        v.legend([['gold', 'probe centres $c$; bars: fitted excess', { area: true }], ['muted', 'disc of convergence about $c$'], ['ink', 'exact: $\\operatorname{dist}(c,\\text{singular set})-(1-r)$'], ['green', 'certified regular part of $T$'], ['red', 'never covered (singular)']]);
        v.render(() => {
          const E = EX[which.value], r = rr.value, n = K.value;
          { const a = Math.atan2(hp.y, hp.x); hp.x = r * Math.cos(a); hp.y = r * Math.sin(a); }
          const key = `${which.value}|${r}|${n}`;
          if (key !== cacheKey) {
            cacheKey = key; ring = [];
            for (let k = 0; k < n; k++) { const t = -PI + (2 * PI * (k + 0.5)) / n; ring.push({ th: t, ...probeSeries(E.f, [r * Math.cos(t), r * Math.sin(t)]) }); }
          }
          const hpTh = Math.atan2(hp.y, hp.x);
          const P = probeSeries(E.f, [hp.x, hp.y]);
          // phase portraits: f inside U, the re-centred series in the probe discs outside U
          S.raster((x, y) => { if (x * x + y * y >= 1) return null; const w = E.f([x, y]); return phaseRGB(M, w[0], w[1]); }, { key: which.value, id: 'u', res: 2 });
          S.raster((x, y) => {
            if (x * x + y * y < 1) return null;
            let best = null, bq = 1;
            for (const p of ring) { const q = Math.hypot(x - p.c[0], y - p.c[1]) / p.Rdisp; if (q < bq) { bq = q; best = p; } }
            if (!best) return null;
            const ur = x - best.c[0], ui = y - best.c[1]; let sr = 0, si = 0;
            for (let k = best.nValid; k >= 0; k--) { const t = sr * ur - si * ui + best.br[k]; si = sr * ui + si * ur + best.bi[k]; sr = t; }
            return phaseRGB(M, sr, si);
          }, { key, id: 'p', res: 2 });
          for (const p of ring) S.circle(p.c[0], p.c[1], p.R, { color: 'muted', width: 1, alpha: 0.55 });
          S.circle(0, 0, r, { color: 'gold', width: 1, dash: [3, 4] });
          // coverage of T
          const NT = 720, cov = [];
          for (let k = 0; k < NT; k++) { const t = -PI + 2 * PI * k / NT, x = Math.cos(t), y = Math.sin(t); cov.push(ring.some((p) => Math.hypot(x - p.c[0], y - p.c[1]) < 0.985 * p.R)); }
          S.circle(0, 0, 1, { color: 'panel', width: 6.5 });
          for (let k = 0; k < NT; k++) { const t0 = -PI + 2 * PI * k / NT, t1 = t0 + 2 * PI / NT; S.line(Math.cos(t0), Math.sin(t0), Math.cos(t1), Math.sin(t1), { color: cov[k] ? 'green' : 'red', width: 3.4, cap: 'butt' }); }
          for (const q of E.sing) xMark(S, q[0], q[1], 'red', 6.5);
          for (const p of ring) S.dot(p.c[0], p.c[1], { color: 'gold', r: 3.2 });
          S.circle(P.c[0], P.c[1], P.R, { color: 'accent', width: 2.6 });
          { const u = hpTh + Math.PI / 2, ex = P.c[0] + P.R * Math.cos(u), ey = P.c[1] + P.R * Math.sin(u);
            S.line(P.c[0], P.c[1], ex, ey, { color: 'accent', width: 1.4, dash: [4, 3] });
            S.tex('R(c)', ex + 0.16 * Math.cos(u), ey + 0.16 * Math.sin(u), { color: 'accent', size: 14 }); }
          // coefficient plot of the highlighted probe: dots, fitted model, and the slope that radius 1−|c| would give
          { const N1 = P.nValid; const ys = P.lb.slice(0, N1 + 1); const lo = Math.min(...ys), hi = Math.max(...ys); const pad = 0.12 * (hi - lo + 1), padTop = 0.3 * (hi - lo + 1);
            Cf.setView([0, Math.max(20, N1 + 3)], [lo - pad, hi + padTop]);
            const m0 = 3; const y0 = P.model(m0);
            Cf.line(m0, y0, N1, y0 - (N1 - m0) * Math.log10(1 - r), { color: 'red', width: 1.4, dash: [5, 4] });
            Cf.fn((n) => P.model(n), { domain: [m0, N1], color: 'accent', width: 2.2 });
            Cf.dots(ys.map((yv, n) => [n, yv]), { color: 'gold', r: 2.6 });
            Cf.corner(`slope ⇒ R(c) = ${v.fix(P.R, 3)}`, 'tl', { color: 'accent', weight: 600 });
            Cf.corner('dashed: the slope radius 1 − |c| would give', 'tl', { color: 'red', size: 11, dy: 20 }); }
          // lower panel
          const exact = (t) => Math.min(...E.sing.map((q) => Math.hypot(q[0] - r * Math.cos(t), q[1] - r * Math.sin(t)))) - (1 - r);
          const ex = ring.map((p) => p.R - (1 - r));
          const top = Math.max(0.3, ...ex.map((e) => e * 1.18), exact(hpTh) * 1.18);
          B.setView(null, [-0.14 * top, top]);
          B.hline(0, { color: 'faint', width: 1 });
          for (const q of E.sing) B.vline(Math.atan2(q[1], q[0]), { color: 'red', width: 1.2, dash: [4, 4] });
          const bw = Math.min(0.12, 1.2 / n);
          ring.forEach((p, k) => B.rect(p.th - bw, 0, p.th + bw, Math.max(0, ex[k]), { fill: 'gold', fillAlpha: 0.75, stroke: false }));
          B.fn(exact, { color: 'ink', width: 1.6, n: 600 });
          B.vline(hpTh, { color: 'accent', width: 1.2, dash: [3, 3] });
          B.dot(hpTh, P.R - (1 - r), { color: 'accent', r: 5 });
          st = { E, r, P, th: hpTh, exact: exact(hpTh) + (1 - r), uncovered: cov.filter((x) => !x).length / NT };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const ex = s.P.R - (1 - s.r);
          return `Probe $c = ${v.fix(s.r, 2)}\\,e^{${v.fix(s.th, 2)}i}$: fitted $R(c) = ${v.fix(s.P.R, 3)}$ (true distance to the nearest singular point $${v.fix(s.exact, 3)}$), $1-|c| = ${v.fix(1 - s.r, 3)}$. ` + (ex > 0.02 ? 'The re-centred series reaches across $T$, certifying the nearby boundary points as regular.' : 'Here $R(c) = 1-|c|$: this direction points at a singular point, and no disc gets past it.');
        });
      },
    },
    // ------------------------------------------------------------------ 16.6 (gap theorem)
    {
      num: '16.6',
      kind: 'Theorem',
      name: 'Hadamard gap theorem',
      credit: 'Hadamard, 1892',
      verify: true,
      statement: String.raw`Let $\lambda$ be a positive integer and $p_1<p_2<p_3<\cdots$ positive integers with
$$p_{k+1}>\Big(1+\frac1\lambda\Big)\,p_k\qquad(k=1,2,3,\dots).$$
If the lacunary series $f(z)=\sum_{k\ge1}c_kz^{p_k}$ has radius of convergence $1$, then no point of $T$ is a regular point of $f$: the unit circle is the natural boundary of $f$.`,
      idea: String.raw`Rotate so that, if some point were regular, it is $1$. Then $f$ extends to a disc $D_1$ about $1$. Put $\varphi(w)=\tfrac12(w^\lambda+w^{\lambda+1})$. It maps $\overline U$ into $U\cup\{1\}$, so for small $\eps>0$ it maps $D(0,1+\eps)$ into $U\cup D_1$. Hence $F=f\circ\varphi$ is holomorphic there, and its Taylor series converges in $D(0,1+\eps)$ (10.16). Now $\varphi(w)^{p_k}$ contains exactly the degrees $\lambda p_k$ through $(\lambda+1)p_k$, and the gap condition $(\lambda+1)p_k<\lambda p_{k+1}$ keeps these blocks disjoint. So the partial sums of $F$ of degree $(\lambda+1)p_k$ are exactly $s_{p_k}(\varphi(w))$. They converge for $w$ near $1$, even with $|w|>1$. Since $\varphi'(1)\ne0$, $\varphi$ covers a neighbourhood of $1$, so the series of $f$ would converge at some $|z|>1$, which is impossible.`,
      caption: String.raw`**Near $T$**: the phase portrait of a gap series. Drag $\beta$. The right panel unrolls the outlined sector at $\beta$: across is the angle, upward is the distance $1-|z|$ to $T$ on a log scale, from $0.5$ to $2.5\times10^{-5}$. The pattern keeps refining at every depth, the same at every $\beta$. Hollow dots mark directions in which $f(r\beta)\to\infty$ as $r\to1$ (roots of unity of order $2^m$; for $\sum z^{k!}$, all roots of unity). They are dense, and the singular set is closed. $\sum 2^{-k}z^{2^k}$ is even continuous on $\overline U$, and still nowhere regular. Without gaps, $\sum z^n=1/(1-z)$ stays smooth up to $T$ away from $1$, and continues across it (shown faded on the left). The lower panel shows which coefficients are nonzero.
**Rudin's trick**: $\varphi(\overline U)$ (green) touches $T$ only at $1$, and $\varphi$ of the larger circle $|w|=1+\eps$ stays inside $U\cup D_1$. The lower panel draws the degree blocks $[\lambda p_k,(\lambda+1)p_k]$ on a log scale with $p_{k+1}\approx q\,p_k$. They are disjoint exactly when $q>1+1/\lambda$.`,
      deps: ['rca-16.1', 'rca-16.2', 'rca-10.16', 'pma-3.39'],
      tags: ['lacunary series', 'natural boundary', 'power series'],
      viz(v) {
        const M = v.M, PI = Math.PI;
        const fact = (k) => { let f = 1; for (let i = 2; i <= k; i++) f *= i; return f; };
        const GAP = {
          two: { label: '$\\sum z^{2^k}$', f: (x, y) => lac2(x, y), coef: (n) => ((n & (n - 1)) === 0 && n > 0 ? 1 : 0), dots: 'dyadic' },
          twoh: { label: '$\\sum 2^{-k}z^{2^k}$', f: (x, y) => lac2(x, y, 0.5), coef: (n) => ((n & (n - 1)) === 0 && n > 0 ? 1 / n : 0), dots: null },
          fact: { label: '$\\sum z^{k!}$', f: lacFact, coef: (n) => ([1, 2, 6, 24, 120].includes(n) ? 1 : 0), dots: 'rational' },
          none: { label: '$\\sum z^n$ (no gaps)', f: (x, y) => cdiv([1, 0], [1 - x, -y]), coef: () => 1, dots: null, cont: true },
        };
        const mode = v.select('', [{ value: 'T', label: 'near $T$' }, { value: 'phi', label: "Rudin's trick $\\varphi$" }], 'T');
        const which = v.select('$f$', Object.entries(GAP).map(([value, o]) => ({ value, label: o.label })), 'two');
        const zoom = v.slider('angular half-width $w$', 0.01, 1, 0.2, { log: true, decimals: 3 });
        const lam = v.slider('$\\lambda$', 1, 6, 2, { int: true });
        const qs = v.slider('gap ratio $q\\approx p_{k+1}/p_k$', 1.05, 3, 1.7, { step: 0.01 });
        const epsS = v.slider('$\\varepsilon$', 0.0001, 0.05, 0.0005, { log: true, decimals: 4 });
        const L = v.stage({ x: [-1.15, 1.15], y: [-1.15, 1.15], equal: true, height: 340, axes: false });
        const Y0 = 0.3, Y1 = 4.6;
        const R = v.stage({ x: [-0.2, 0.2], y: [Y0, Y1], height: 340, axes: 'box' });
        const Bt = v.stage({ x: [-1, 65], y: [-0.3, 1.15], height: 120, full: true, axes: 'box' });
        const onT = (x, y) => { const a = Math.atan2(y, x); return [Math.cos(a), Math.sin(a)]; };
        const beta = L.handle(Math.cos(0.9), Math.sin(0.9), { color: 'accent', label: 'β', labelPos: 'ne', constrain: onT });
        const wH = L.handle(0.62, 0.55, { color: 'gold', label: 'w', constrain: (x, y) => { const m = Math.hypot(x, y), cap = 1 + epsS.value; return m > cap ? [x * cap / m, y * cap / m] : [x, y]; } });
        const phi = (w, l) => { const a = cpowInt(w, l); const b = cmul(a, w); return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
        let st = null;
        v.render(() => {
          const md = mode.value; const G = GAP[which.value], BG = v.rgb('panel');
          which.el.hidden = md !== 'T'; zoom.el.hidden = md !== 'T';
          lam.el.hidden = md === 'T'; qs.el.hidden = md === 'T'; epsS.el.hidden = md === 'T';
          beta.visible = md === 'T'; wH.visible = md !== 'T';
          if (md === 'T') {
            L.setTitle('phase portrait of $f$ on $U$'); R.setTitle('the sector at $\\beta$ unrolled: $\\theta-\\arg\\beta$ across, $1-|z|$ (log scale) up'); Bt.setTitle('coefficients: $a_n\\neq0$ only for $n=p_k$');
            L.setView([-1.15, 1.15], [-1.15, 1.15]);
            L.raster((x, y) => { const inU = x * x + y * y < 1; if (!inU && !G.cont) return null; const w = G.f(x, y); return phaseRGB(M, w[0], w[1], inU ? 0 : 0.55, BG); }, { key: which.value, id: 'L', res: 2 });
            const w = zoom.value, b = [beta.x, beta.y], thB = Math.atan2(b[1], b[0]);
            R.setView([-w, w], [Y0, Y1]);
            R.setTicks([[-w, `−${v.fmt(w, 2)}`], [-w / 2, `−${v.fmt(w / 2, 2)}`], [0, 'arg β'], [w / 2, v.fmt(w / 2, 2)], [w, v.fmt(w, 2)]], [1, 2, 3, 4].map((k) => [k, `10${'⁻¹⁻²⁻³⁻⁴'.slice(2 * k - 2, 2 * k)}`]));
            R.raster((u, yy) => {
              const rr = 1 - Math.pow(10, -yy), t = thB + u;
              const val = G.f(rr * Math.cos(t), rr * Math.sin(t)); return phaseRGB(M, val[0], val[1]);
            }, { key: `${which.value}|${thB.toFixed(5)}|${w}`, id: 'R', res: 2 });
            R.axes();
            L.circle(0, 0, 1, { color: 'panel', width: 4 }); L.circle(0, 0, 1, { color: G.cont ? 'ink' : 'red', width: 1.8 });
            { const sec = []; const r0 = 1 - Math.pow(10, -Y0); for (let k = 0; k <= 40; k++) { const t = thB - w + 2 * w * k / 40; sec.push([Math.cos(t), Math.sin(t)]); } for (let k = 40; k >= 0; k--) { const t = thB - w + 2 * w * k / 40; sec.push([r0 * Math.cos(t), r0 * Math.sin(t)]); }
              L.poly(sec, { color: 'panel', width: 4.5 }); L.poly(sec, { color: 'ink', width: 1.7 }); }
            if (G.cont) xMark(L, 1, 0, 'red', 6);
            // points where f is radially unbounded, inside the angular window (drawn at the top edge = T)
            const marks = [];
            if (G.dots === 'dyadic') { const m = Math.min(14, Math.max(2, Math.ceil(Math.log2(2 * PI * 14 / (2 * w))))); const N = 2 ** m; const j0 = Math.ceil((thB - w) / (2 * PI) * N), j1 = Math.floor((thB + w) / (2 * PI) * N); for (let j = j0; j <= j1; j++) marks.push(2 * PI * j / N); }
            if (G.dots === 'rational') { const Q = Math.max(3, Math.min(80, Math.round(Math.sqrt(30 * PI / w)))); for (let q = 1; q <= Q; q++) for (let p = Math.ceil((thB - w) / (2 * PI) * q); p <= Math.floor((thB + w) / (2 * PI) * q); p++) { let g = p, hh = q; while (hh) [g, hh] = [hh, g % hh]; if (Math.abs(g) === 1) marks.push(2 * PI * p / q); } }
            const yTop = Y1 - (Y1 - Y0) * 0.03;
            for (const t of marks) { R.line(t - thB, Y0, t - thB, Y1, { color: 'panel', width: 0.6, alpha: 0.3 }); R.dot(t - thB, yTop, { color: 'ink', r: 3.2, hollow: true, width: 1.4 }); }
            R.corner(G.cont ? 'smooth up to T: f extends past β' : 'structure at every depth: no point of T is regular', 'bl', { color: G.cont ? 'green' : 'red', weight: 600 });
            Bt.setView([-1, 65], [-0.3, 1.15]); Bt.setTicks(null, [0, 1]);
            const vals = []; for (let n = 0; n <= 64; n++) vals.push(Math.abs(G.coef(n)));
            Bt.bars(vals, { x0: 0, dx: 1, color: (val) => (val > 0 ? 'accent' : 'faint'), barWidth: 0.6 });
            v.legend(G.cont ? [['ink', '$T$ (only $1$ is singular)'], ['red', 'singular point'], ['faint', 'continuation $1/(1-z)$ beyond $T$', { area: true }], ['ink', 'window shown on the right', { area: true }]] : [['red', '$T$ — every point singular'], ['ink', 'window shown on the right', { area: true }], ['ink', '$f(r\\beta)\\to\\infty$ along these rays', { dot: true }]]);
            const h = w;
            st = { md, G, b, h };
          } else {
            const l = lam.value, q = qs.value, e = epsS.value, d1 = 0.35;
            L.setTitle('$w$-plane'); R.setTitle('$z=\\varphi(w)=\\frac12(w^\\lambda+w^{\\lambda+1})$');
            Bt.setTitle('degree blocks $[\\lambda p_k,(\\lambda+1)p_k]$ of $\\varphi(w)^{p_k}$ (log scale)');
            L.setView([-1.45, 1.45], [-1.45, 1.45]);
            { const hy = 1.25, hx = hy * R.width / R.height; R.setView([0.15 - hx, 0.15 + hx], [-hy, hy]); R.setTicks([], []); }
            L.circle(0, 0, 1, { color: 'accent', width: 2, fill: 'accent', fillAlpha: 0.12 });
            L.circle(0, 0, 1 + e, { color: 'gold', width: 1.8, dash: [5, 4] });
            L.tex('\\overline U', -0.45, -0.45, { color: 'accent' });
            L.tex('|w|=1+\\varepsilon', -0.7, 1.12, { color: 'gold', size: 13 });
            // φ(Ū) by the argument principle: winding number of φ(e^{it}) − z, row by row
            const NB = 900; const bd = []; for (let k = 0; k <= NB; k++) bd.push(phi([Math.cos(2 * PI * k / NB), Math.sin(2 * PI * k / NB)], l));
            const Gc = v.rgb('green'), Pc = v.rgb('panel'), fillC = [0, 1, 2].map((i) => Pc[i] + (Gc[i] - Pc[i]) * 0.3);
            const rowCache = new Map();
            R.raster((x, y) => {
              let row = rowCache.get(y);
              if (!row) { row = []; for (let k = 0; k < NB; k++) { const a = bd[k], c = bd[k + 1]; if ((a[1] > y) !== (c[1] > y)) row.push([a[0] + (y - a[1]) * (c[0] - a[0]) / (c[1] - a[1]), c[1] > a[1] ? 1 : -1]); } rowCache.set(y, row); }
              let wn = 0; for (const [xc, sg] of row) if (xc > x) wn += sg;
              return wn !== 0 ? fillC : null;
            }, { key: `phi|${l}`, id: 'phi', res: 2 });
            R.circle(1, 0, d1, { color: 'orange', width: 2, fill: 'orange', fillAlpha: 0.1 });
            R.circle(0, 0, 1, { color: 'ink', width: 1.8 });
            R.path(bd.map((p) => p), { color: 'green', width: 1.6 });
            const big = []; let inside = true;
            for (let k = 0; k <= 720; k++) { const p = phi([(1 + e) * Math.cos(2 * PI * k / 720), (1 + e) * Math.sin(2 * PI * k / 720)], l); big.push(p); if (Math.hypot(p[0], p[1]) >= 1 && Math.hypot(p[0] - 1, p[1]) >= d1) inside = false; }
            R.path(big, { color: 'gold', width: 1.8, dash: [5, 4] });
            R.tex('D_1', 1 + d1 * 0.62, d1 * 0.85, { color: 'orange', size: 14 });
            R.tex('T', -0.78, 0.78, { color: 'ink', size: 15 });
            R.dot(1, 0, { color: 'ink', r: 3.5 });
            const pw = phi([wH.x, wH.y], l);
            R.dot(pw[0], pw[1], { color: 'gold', r: 5.5, label: 'φ(w)', labelPos: 'ne' });
            R.corner(inside ? 'φ(D(0,1+ε)) ⊂ U ∪ D₁' : 'ε too large: leaves U ∪ D₁', 'tl', { color: inside ? 'green' : 'red', weight: 600 });
            // degree blocks
            const ps = [4]; while (ps.length < 30) { const nx = Math.max(ps[ps.length - 1] + 1, Math.round(ps[ps.length - 1] * q)); if ((l + 1) * nx > 2 ** 15) break; ps.push(nx); }
            Bt.setView([1, 15.2], [-0.3, 1]); Bt.setTicks([2, 4, 6, 8, 10, 12, 14].map((j) => [j, String(2 ** j)]), []);
            let overlap = false;
            ps.forEach((p, k) => {
              const a = Math.log2(l * p), c = Math.log2((l + 1) * p);
              Bt.rect(a, 0.3, c, 0.7, { fill: k % 2 ? 'teal' : 'blue', fillAlpha: 0.55, color: k % 2 ? 'teal' : 'blue', width: 1 });
              if (k + 1 < ps.length) { const a2 = Math.log2(l * ps[k + 1]); if (a2 <= c) { overlap = true; Bt.rect(a2, 0.22, c, 0.78, { fill: 'red', fillAlpha: 0.75, stroke: false }); } }
            });
            Bt.corner(overlap ? 'blocks overlap: partial sums of F mix different p_k' : 'blocks disjoint', 'tl', { color: overlap ? 'red' : 'green', weight: 600 });
            v.legend([['accent', '$\\overline U$ and its image', { area: true }], ['green', '$\\varphi(\\overline U)$', { area: true }], ['gold', '$|w|=1+\\varepsilon$ and its image', { dash: true }], ['orange', 'disc $D_1$ where $f$ would extend', { area: true }]]);
            st = { md, l, q, e, overlap, inside, pw, ratio: ps.length > 2 ? ps[ps.length - 1] / ps[ps.length - 2] : q };
          }
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.md === 'T') {
            const th = Math.atan2(s.b[1], s.b[0]);
            return s.G.cont ? `$\\beta = e^{${v.fix(th, 3)}i}$: without gaps, $f=1/(1-z)$ is regular at every $\\beta\\ne1$. The unrolled picture is smooth up to $T$, and the faded colours on the left are its continuation.` : `$\\beta = e^{${v.fix(th, 3)}i}$, angular window $\\pm${v.fix(s.h, 3)}$: new structure appears at every depth $1-|z|$, and the series diverges at every $|z|>1$. There is no disc about $\\beta$ on which $f$ extends.`;
          }
          return `$\\lambda=${s.l}$: needs $p_{k+1}/p_k > 1+1/\\lambda = ${v.fix(1 + 1 / s.l, 3)}$; here $q = ${v.fix(s.q, 2)}$ — ` + (s.overlap ? 'the blocks overlap, so the gap argument breaks down.' : 'the blocks are disjoint, so $s_{(\\lambda+1)p_k}(F) = s_{p_k}\\circ\\varphi$.') + ` $|\\varphi(w)| = ${v.fix(Math.hypot(s.pw[0], s.pw[1]), 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 16.9
    {
      num: '16.9',
      kind: 'Definition',
      name: 'Function elements; continuation along chains and curves',
      statement: String.raw`A **function element** is a pair $(f,D)$ of an open disc $D$ and a function $f\in H(D)$. Two elements $(f_0,D_0)$, $(f_1,D_1)$ are **direct continuations** of each other, written $(f_0,D_0)\sim(f_1,D_1)$, if $D_0\cap D_1\ne\emptyset$ and $f_0=f_1$ on $D_0\cap D_1$.

A **chain** is a finite sequence $\mathscr C=\{A_0,A_1,\dots,A_n\}$ of discs with $A_{i-1}\cap A_i\ne\emptyset$ for $1\le i\le n$. If $(f_0,A_0)$ is given and there are elements $(f_i,A_i)$ with $(f_{i-1},A_{i-1})\sim(f_i,A_i)$ for $1\le i\le n$, then $(f_n,A_n)$ is the **analytic continuation of $(f_0,A_0)$ along $\mathscr C$**.

If $\gamma:[0,1]\to\C$ is a curve and there are numbers $0=s_0<s_1<\dots<s_n=1$ such that $\gamma(0)$ is the centre of $A_0$, $\gamma(1)$ is the centre of $A_n$, and $\gamma([s_i,s_{i+1}])\subset A_i$ for $0\le i\le n-1$, the chain **covers** $\gamma$. A continuation $(f_n,A_n)$ of $(f_0,A_0)$ along such a chain is called an **analytic continuation of $(f_0,A_0)$ along $\gamma$**.`,
      idea: String.raw`Each step is forced. $A_{i-1}\cap A_i$ is a nonempty connected open set, so by the uniqueness theorem (10.18) at most one $f_i\in H(A_i)$ agrees with $f_{i-1}$ there. The continuation along a given chain is therefore unique when it exists. What is *not* automatic is consistency at the end. Following $\log z$ once around $0$ returns to a disc overlapping $A_0$ but carrying $f_0+2\pi i$. So $\sim$ is not transitive, and continuation naturally produces multivalued functions.`,
      caption: String.raw`Drag the five points that shape $\gamma$, and use the slider to run along the chain. Each disc is centred on $\gamma$ with radius $0.62$ times its distance to the branch point $0$, and is coloured by its own element $f_i$. Consecutive elements agree on the overlaps, so the colours join seamlessly. For $\log z$ the colour is $\Im f_i$, which keeps growing while $\gamma$ winds around $0$. Where the last disc overlaps the first (dashed pink), the colours clash. The readout compares $f_n(\gamma(1))$ with the principal value.`,
      deps: ['rca-10.2'],
      tags: ['analytic continuation', 'function elements'],
      viz(v) {
        const M = v.M;
        const kind = v.select('', [{ value: 'log', label: '$\\log z$ (colour $=\\Im f_i$)' }, { value: 'sqrt', label: '$\\sqrt z$ (phase portrait)' }], 'log');
        const prog = v.slider('run along the chain', 0, 1, 1, { step: 0.01, fmt: (x) => `${Math.round(x * 100)}%` });
        const S = v.stage({ x: [-2.3, 2.3], y: [-1.85, 1.85], equal: true, height: 420, ticks: false });
        const CP = [[1.45, 0.35], [0.45, 1.35], [-1.35, 0.55], [-0.75, -1.2], [1.2, -0.75]];
        const H = CP.map((p, k) => S.handle(p[0], p[1], k === 0 || k === CP.length - 1
          ? { color: 'accent', r: 7, label: k === 0 ? 'γ(0)' : 'γ(1)', labelPos: k === 0 ? 'e' : 'se' }
          : { color: 'gray', r: 5.5 }));
        let st = null;
        v.render(() => {
          const pts = catmull(H.map((h) => [h.x, h.y]), 360);
          const ch = chainAlong(pts, 0.62, 0.85);
          const BG = v.rgb('panel');
          if (!ch.ok) {
            S.path(pts, { color: 'red', width: 2.4 });
            xMark(S, 0, 0, 'red', 7);
            S.corner('γ passes (almost) through 0 — no chain of discs avoiding 0 covers it', 'tl', { color: 'red', weight: 600 });
            st = { ok: false }; return;
          }
          const D = ch.discs, n = D.length - 1;
          const vals = continueChain(D, kind.value);
          const show = Math.max(0, Math.round(prog.value * n));
          let lo = Infinity, hi = -Infinity; for (const vv of vals) { lo = Math.min(lo, vv[1]); hi = Math.max(hi, vv[1]); }
          lo -= 1.2; hi += 1.2;
          const B = BRANCH[kind.value];
          S.raster((x, y) => {
            for (let k = show; k >= 0; k--) {
              const d = D[k]; if ((x - d.c[0]) ** 2 + (y - d.c[1]) ** 2 >= d.r * d.r) continue;
              const w = B.at(vals[k], d.c, [x, y]);
              if (kind.value === 'log') { const c = M.cmap((w[1] - lo) / (hi - lo), 'viridis'); return [c[0] + (BG[0] - c[0]) * 0.12, c[1] + (BG[1] - c[1]) * 0.12, c[2] + (BG[2] - c[2]) * 0.12]; }
              return phaseRGB(M, w[0], w[1], 0.05, BG);
            }
            return null;
          }, { key: `${kind.value}|${show}|${H.map((h) => h.x.toFixed(4) + ',' + h.y.toFixed(4)).join(';')}`, res: 2 });
          for (let k = 0; k <= show; k++) S.circle(D[k].c[0], D[k].c[1], D[k].r, { color: 'ink', width: 0.8, alpha: 0.35 });
          if (show > 1) S.circle(D[0].c[0], D[0].c[1], D[0].r, { color: 'pink', width: 2, dash: [6, 4] });
          if (show > 0) S.circle(D[show - 1].c[0], D[show - 1].c[1], D[show - 1].r, { color: 'orange', width: 2 });
          S.circle(D[show].c[0], D[show].c[1], D[show].r, { color: 'accent', width: 2.6 });
          S.path(pts, { color: 'panel', width: 5 });
          S.path(pts, { color: 'ink', width: 2 });
          for (const s of [0.3, 0.62]) { const a = pts[Math.round(s * 360)], b = pts[Math.round(s * 360) + 4]; S.arrow(a[0], a[1], b[0], b[1], { color: 'ink', head: 10 }); }
          for (let k = 0; k <= show; k++) S.dot(D[k].c[0], D[k].c[1], { color: 'gold', r: 3 });
          xMark(S, 0, 0, 'red', 6.5);
          { const d = D[0], u = Math.hypot(d.c[0], d.c[1]); S.tex('A_0', d.c[0] * (1 + 0.62 * d.r / u) - 0.3 * d.c[1] / u * d.r, d.c[1] * (1 + 0.62 * d.r / u) + 0.3 * d.c[0] / u * d.r, { color: show > 1 ? 'pink' : 'ink', size: 15 }); }
          if (show > 0) { const d = D[show], u = Math.hypot(d.c[0], d.c[1]); S.tex(`A_{${show}}`, d.c[0] * (1 + 0.62 * d.r / u), d.c[1] * (1 + 0.62 * d.r / u), { color: 'accent', size: 15 }); }
          S.corner(`chain of ${n + 1} discs covering γ`, 'tl', { weight: 600 });
          if (kind.value === 'log') { // colour bar for Im f
            const bx = S.bounds, x1 = bx.x[1] - 0.18, x0 = x1 - 0.13, y0 = bx.y[0] + 0.35, y1 = bx.y[1] - 0.35, NBAR = 60;
            for (let k = 0; k < NBAR; k++) { const c = M.cmap((k + 0.5) / NBAR, 'viridis'); S.rect(x0, y0 + (y1 - y0) * k / NBAR, x1, y0 + (y1 - y0) * (k + 1) / NBAR + 0.005, { fill: [c[0], c[1], c[2]], fillAlpha: 1, stroke: false }); }
            S.rect(x0, y0, x1, y1, { color: 'muted', width: 1 });
            for (let m = Math.ceil(lo / Math.PI); m <= Math.floor(hi / Math.PI); m++) { const yy = y0 + (y1 - y0) * (m * Math.PI - lo) / (hi - lo); S.line(x0 - 0.05, yy, x0, yy, { color: 'muted', width: 1 }); S.text(m === 0 ? '0' : `${m === 1 ? '' : m === -1 ? '−' : m}π`, x0 - 0.08, yy, { align: 'right', size: 11, color: 'muted' }); }
            S.text('Im f', (x0 + x1) / 2, y1 + 0.14, { align: 'center', size: 11, color: 'muted' });
          }
          v.legend([['accent', 'current disc $A_i$'], ['orange', 'previous disc $A_{i-1}$ (the elements agree on the overlap)'], ['pink', 'first disc $A_0$', { dash: true }], ['gold', 'centres on $\\gamma$', { dot: true }], ['red', 'branch point $0$']]);
          st = { ok: true, n, show, vals, D, end: pts[pts.length - 1] };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (!s.ok) return 'Move the curve away from $0$: every disc of a chain must avoid the branch point.';
          const vi = s.vals[s.show], ci = s.D[s.show].c;
          let txt = `$f_{${s.show}}$ at the centre of $A_{${s.show}}$: $${fmtC(v, vi)}$. `;
          if (s.show === s.n) {
            const e = s.end;
            if (kind.value === 'log') { const pr = clog(e); const k = Math.round((vi[1] - pr[1]) / (2 * Math.PI)); txt += `At $\\gamma(1)$ the principal value is $${fmtC(v, pr)}$, so $f_n(\\gamma(1)) = \\operatorname{Log}\\gamma(1) ${k >= 0 ? '+' : '-'} ${Math.abs(k)}\\cdot 2\\pi i$.`; }
            else { const pr = csqrt(e); const sg = vi[0] * pr[0] + vi[1] * pr[1] > 0 ? '+' : '-'; txt += `At $\\gamma(1)$: $f_n(\\gamma(1)) = ${sg}\\sqrt{\\gamma(1)}$ (principal root $${fmtC(v, pr)}$).`; }
          } else txt += `Centre $${fmtC(v, ci, 2)}$, radius $${v.fix(s.D[s.show].r, 2)}$.`;
          return txt;
        });
      },
    },
    // ------------------------------------------------------------------ 16.10
    {
      num: '16.10',
      kind: 'Lemma',
      name: 'Direct continuation is transitive through a common point',
      verify: true,
      statement: String.raw`Suppose $D_0\cap D_1\cap D_2\ne\emptyset$, $(f_0,D_0)\sim(f_1,D_1)$ and $(f_1,D_1)\sim(f_2,D_2)$. Then $(f_0,D_0)\sim(f_2,D_2)$.

Without a common point of the three discs the conclusion can fail, even when $D_0\cap D_2\neq\emptyset$.`,
      idea: String.raw`On the nonempty open set $D_0\cap D_1\cap D_2$ we have $f_0=f_1=f_2$. The set $D_0\cap D_2$ is convex, hence connected, and contains it, so $f_0=f_2$ on all of $D_0\cap D_2$ by the uniqueness theorem (10.18). When three discs ring a branch point, each pair can overlap while no point lies in all three, and a branch of $\sqrt z$ comes back with the opposite sign.`,
      caption: String.raw`Drag the centres $c_0,c_1,c_2$; the slider scales the radii, which always stay below the distance to $0$. Each disc shows its own element of $\sqrt z$ as a phase portrait. $f_1$ is the direct continuation of $f_0$, and $f_2$ that of $f_1$. In the lens $D_0\cap D_2$ the stripes alternate between $f_0$ and $f_2$, and they disappear when the two agree. Choose "discs ringing $0$" (or drag) until the green triple intersection vanishes. The stripes then reveal $f_2=-f_0$.`,
      deps: ['rca-16.9', 'rca-10.18'],
      tags: ['analytic continuation', 'function elements'],
      viz(v) {
        const M = v.M;
        const P = { meet: [[0.66, -0.94], [1.2, 0.1], [0.52, 0.97]], ring: [[1.1, 0], [-0.55, 0.95], [-0.55, -0.95]] };
        let H = null;
        const preset = v.select('', [{ value: 'meet', label: 'discs with a common point' }, { value: 'ring', label: 'discs ringing $0$' }], 'meet', { onChange: (val) => P[val].forEach((p, k) => { H[k].x = p[0]; H[k].y = p[1]; }) });
        const kap = v.slider('radius $=\\kappa\\cdot|c_i|$, $\\kappa$', 0.5, 0.97, 0.94, { step: 0.01 });
        const S = v.stage({ x: [-1.9, 2.6], y: [-2.1, 2.1], equal: true, height: 430, ticks: false });
        const COL = ['blue', 'orange', 'purple'];
        H = P.meet.map((p, k) => S.handle(p[0], p[1], { color: COL[k], label: `c${subD(k)}`, labelPos: 'ne', constrain: (x, y) => (Math.hypot(x, y) < 0.35 ? [x * 0.35 / Math.hypot(x, y), y * 0.35 / Math.hypot(x, y)] : [x, y]) }));
        let st = null;
        v.render(() => {
          void preset.value;
          const BG = v.rgb('panel');
          const D = H.map((h) => ({ c: [h.x, h.y], r: kap.value * Math.hypot(h.x, h.y) }));
          const meets = (a, b) => Math.hypot(a.c[0] - b.c[0], a.c[1] - b.c[1]) < a.r + b.r - 1e-9;
          const ptIn = (a, b) => { const d = Math.hypot(b.c[0] - a.c[0], b.c[1] - a.c[1]); const t = (d + a.r - b.r) / 2 / d; return [a.c[0] + (b.c[0] - a.c[0]) * t, a.c[1] + (b.c[1] - a.c[1]) * t]; };
          const vals = [csqrt(D[0].c), null, null];
          const at = (k, z) => BRANCH.sqrt.at(vals[k], D[k].c, z);
          if (meets(D[0], D[1])) { const p = ptIn(D[0], D[1]); vals[1] = BRANCH.sqrt.at(at(0, p), p, D[1].c); }
          if (vals[1] && meets(D[1], D[2])) { const p = ptIn(D[1], D[2]); vals[2] = BRANCH.sqrt.at(at(1, p), p, D[2].c); }
          const lens02 = meets(D[0], D[2]) ? discMeet([D[0], D[2]]) : null;
          const triple = discMeet(D);
          let ratio = null;
          if (lens02 && vals[2]) { const p = lens02.c; const a = at(0, p), b = at(2, p); ratio = cdiv(b, a); }
          const mismatch = ratio && ratio[0] < 0;
          const sw = 0.09;
          S.raster((x, y) => {
            const z = [x, y]; const inD = D.map((d) => (x - d.c[0]) ** 2 + (y - d.c[1]) ** 2 < d.r * d.r);
            let k = -1;
            if (inD[0] && inD[2] && vals[2]) k = Math.floor((x - y) / sw) & 1 ? 2 : 0;
            else if (inD[2] && vals[2]) k = 2; else if (inD[1] && vals[1]) k = 1; else if (inD[0]) k = 0;
            if (k < 0) return null;
            const w = at(k, z); return phaseRGB(M, w[0], w[1], 0.06, BG);
          }, { key: `${D.map((d) => d.c.map((u) => u.toFixed(4)).join(',')).join(';')}|${kap.value}`, res: 2 });
          D.forEach((d, k) => S.circle(d.c[0], d.c[1], d.r, { color: COL[k], width: 2.2, alpha: vals[k] || k === 0 ? 1 : 0.5, dash: vals[k] || k === 0 ? null : [5, 4] }));
          if (triple) S.poly(triple.pts, { color: 'green', width: 2.6, fill: 'green', fillAlpha: 0.22 });
          if (lens02) S.poly(lens02.pts, { color: mismatch ? 'red' : 'green', width: 1.6, dash: [5, 3] });
          xMark(S, 0, 0, 'ink', 6);
          D.forEach((d, k) => { const u = Math.hypot(d.c[0], d.c[1]); S.tex(`D_${k}`, d.c[0] * (1 + 0.7 * d.r / u), d.c[1] * (1 + 0.7 * d.r / u), { color: COL[k], size: 17 }); });
          let msg, col;
          if (!vals[1] || !vals[2]) { msg = 'consecutive discs must overlap to continue'; col = 'red'; }
          else if (!lens02) { msg = 'D₀ and D₂ do not meet: nothing to compare'; col = 'muted'; }
          else if (mismatch) { msg = triple ? 'f₂ = −f₀ on D₀ ∩ D₂' : 'no common point: f₂ = −f₀ on D₀ ∩ D₂'; col = 'red'; }
          else { msg = triple ? 'common point ⇒ f₂ = f₀ on D₀ ∩ D₂' : 'f₂ = f₀ on D₀ ∩ D₂'; col = 'green'; }
          S.corner(msg, 'tl', { color: col, weight: 600 });
          v.legend([['green', '$D_0\\cap D_1\\cap D_2$', { area: true }], [mismatch ? 'red' : 'green', 'the lens $D_0\\cap D_2$ (striped $f_0$ / $f_2$)', { dash: true }], ['ink', 'branch point $0$']]);
          st = { vals, triple: !!triple, lens02: !!lens02, ratio };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (!s.vals[1] || !s.vals[2]) return 'A direct continuation needs overlapping discs: drag the centres closer.';
          if (!s.lens02) return `$D_0\\cap D_1\\cap D_2 ${s.triple ? '\\ne' : '='}\\emptyset$, but $D_0\\cap D_2=\\emptyset$, so the question does not arise.`;
          const r = s.ratio;
          return `$D_0\\cap D_1\\cap D_2 ${s.triple ? '\\ne' : '='}\\emptyset$. On $D_0\\cap D_2$: $f_2/f_0 = ${v.fix(r[0], 6)}${Math.abs(r[1]) > 5e-7 ? ` ${r[1] < 0 ? '-' : '+'} ${v.fix(Math.abs(r[1]), 6)}i` : ''}$` + (r[0] > 0 ? ', so $(f_0,D_0)\\sim(f_2,D_2)$.' : ' — the two elements are *not* direct continuations of each other.');
        });
      },
    },
    // ------------------------------------------------------------------ 16.11
    {
      num: '16.11',
      kind: 'Theorem',
      name: 'Continuation along a curve is unique',
      statement: String.raw`Let $(f,D)$ be a function element and $\gamma$ a curve that starts at the centre of $D$. Then $(f,D)$ admits at most one analytic continuation along $\gamma$. More precisely, if two chains $\{A_0,\dots,A_m\}$ and $\{B_0,\dots,B_n\}$ with $A_0=B_0=D$ both cover $\gamma$, and $(f,D)$ continues along them to $(g_m,A_m)$ and $(h_n,B_n)$, then $(g_m,A_m)\sim(h_n,B_n)$: the two terminal elements agree near $\gamma(1)$.`,
      idea: String.raw`Let the partitions be $\{s_i\}$ for the $A$-chain and $\{\sigma_j\}$ for the $B$-chain. Show by induction on $i+j$ that $(g_i,A_i)\sim(h_j,B_j)$ whenever the parameter intervals $[s_{i},s_{i+1}]$ and $[\sigma_{j},\sigma_{j+1}]$ overlap. Such discs share a point of $\gamma$. In the inductive step, say $s_i\ge\sigma_j$: the three discs $A_{i-1},A_i,B_j$ all contain $\gamma(s_i)$, so Lemma 16.10 passes the relation from $(A_{i-1},B_j)$ to $(A_i,B_j)$. The case $i=m$, $j=n$ is the claim.`,
      caption: String.raw`One curve $\gamma$ (drag its shape points) is covered by two quite different chains. Chain A uses orange discs of radius $\kappa_A|c|$, chain B purple discs of radius $\kappa_B|c|$, and $\log z$ is continued along both. The lower panel plots $\Im f$ along $\gamma$ for each chain. The graphs coincide piece by piece and end on the same branch. Now let chain B cover the other curve $\gamma'$, which runs on the other side of $0$: the terminal elements differ by $2\pi i$. Uniqueness is per curve, not per end point.`,
      deps: ['rca-16.9', 'rca-16.10', 'rca-10.18'],
      tags: ['analytic continuation', 'uniqueness'],
      viz(v) {
        const kA = v.slider('chain A: $\\kappa_A$', 0.3, 0.92, 0.72, { step: 0.01 });
        const kB = v.slider('chain B: $\\kappa_B$', 0.25, 0.92, 0.4, { step: 0.01 });
        const otherSel = v.select('', [{ value: 'same', label: 'chain B covers $\\gamma$' }, { value: 'other', label: "chain B covers $\\gamma'$" }], 'same');
        const other = { get value() { return otherSel.value === 'other'; } };
        const S = v.stage({ x: [-2.2, 2.2], y: [-1.75, 1.75], equal: true, height: 400, full: true, ticks: false });
        const Lw = v.stage({ x: [0, 1], y: [-4, 4], height: 180, full: true, axes: 'box', xlabel: 's', title: '$\\Im f$ along the curve, chain by chain: A (orange) and B (purple)' });
        const CP = [[1.5, 0.1], [0.85, 1.05], [-0.85, 1.05], [-1.5, 0.1]];
        const H = CP.map((p, k) => S.handle(p[0], p[1], k === 0 || k === 3 ? { color: 'accent', label: k === 0 ? 'γ(0)' : 'γ(1)', labelPos: k === 0 ? 'e' : 'w' } : { color: 'gray', r: 5.5 }));
        let st = null;
        v.legend([['orange', 'chain A along $\\gamma$', { area: true }], ['purple', "chain B along $\\gamma$ or $\\gamma'$", { area: true }], ['ink', '$\\gamma$'], ['muted', "$\\gamma'$", { dash: true }]]);
        v.render(() => {
          const C = H.map((h) => [h.x, h.y]);
          const a = C[0], b = C[3], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
          const mirror = (p) => { const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2; const f = [a[0] + t * dx, a[1] + t * dy]; return [f[0] - 0.9 * (p[0] - f[0]), f[1] - 0.9 * (p[1] - f[1])]; };
          const N = 360;
          const g1 = catmull(C, N), g2 = catmull([C[0], mirror(C[1]), mirror(C[2]), C[3]], N);
          const chA = chainAlong(g1, kA.value, 1.1), chB = chainAlong(other.value ? g2 : g1, kB.value, 1.1);
          const okA = chA.ok, okB = chB.ok;
          const v0 = clog(a);
          const valsA = okA ? continueChain(chA.discs, 'log', v0) : null, valsB = okB ? continueChain(chB.discs, 'log', v0) : null;
          if (okB) for (const d of chB.discs) S.circle(d.c[0], d.c[1], d.r, { color: 'purple', width: 1.1, fill: 'purple', fillAlpha: 0.05 });
          if (okA) for (const d of chA.discs) S.circle(d.c[0], d.c[1], d.r, { color: 'orange', width: 1.3, fill: 'orange', fillAlpha: 0.05 });
          S.path(g2, { color: 'muted', width: 1.6, dash: [5, 4] });
          S.path(g1, { color: 'ink', width: 2.4 });
          for (const [g, col] of [[g1, 'ink'], [g2, 'muted']]) { const p = g[Math.round(N * 0.5)], q = g[Math.round(N * 0.5) + 4]; S.arrow(p[0], p[1], q[0], q[1], { color: col, head: 10 }); }
          if (okA) for (const d of chA.discs) S.dot(d.c[0], d.c[1], { color: 'orange', r: 3.2 });
          if (okB) for (const d of chB.discs) S.dot(d.c[0], d.c[1], { color: 'purple', r: 2.6 });
          xMark(S, 0, 0, 'red', 6.5);
          { const m = g1[Math.round(N * 0.42)]; S.tex('\\gamma', m[0], m[1], { color: 'ink', dy: -14 }); const m2 = g2[Math.round(N * 0.42)]; S.tex("\\gamma'", m2[0], m2[1], { color: 'muted', dy: 14 }); }
          // Im f along s
          const trace = (ch, vals, g) => { const out = []; let k = 0; for (let i = 0; i <= N; i++) { while (k + 1 < ch.discs.length && ch.discs[k + 1].i <= i) k++; out.push([i / N, BRANCH.log.at(vals[k], ch.discs[k].c, g[i])[1]]); } return out; };
          const tA = okA ? trace(chA, valsA, g1) : [], tB = okB ? trace(chB, valsB, other.value ? g2 : g1) : [];
          const all = tA.concat(tB).map((p) => p[1]);
          const lo = Math.min(...all, -1), hi = Math.max(...all, 1);
          Lw.setView([0, 1], [lo - 0.6, hi + 0.6]);
          const PI = Math.PI; const yt = []; for (let k = Math.ceil((lo - 0.6) / (PI / 2)); k <= Math.floor((hi + 0.6) / (PI / 2)); k++) yt.push([k * PI / 2, k === 0 ? '0' : `${k % 2 ? k : k / 2}${k % 2 ? 'π/2' : 'π'}`.replace(/^1π/, 'π').replace(/^-1π/, '−π').replace('-', '−')]);
          Lw.setTicks(null, yt);
          if (okA) { Lw.path(tA, { color: 'orange', width: 4, alpha: 0.85 }); chA.discs.forEach((d) => Lw.vline(d.i / N, { color: 'orange', width: 0.8, alpha: 0.35 })); }
          if (okB) Lw.path(tB, { color: 'purple', width: 2, dash: [6, 4] });
          const endA = okA ? valsA[valsA.length - 1] : null, endB = okB ? valsB[valsB.length - 1] : null;
          if (endA) Lw.dot(1, endA[1], { color: 'orange', r: 5.5 });
          if (endB) Lw.dot(1, endB[1], { color: 'purple', r: 4 });
          const same = endA && endB && Math.abs(endA[1] - endB[1]) < 1e-9;
          if (endA && endB) S.corner(same ? 'both chains end with the same element' : 'different curves: the end elements differ', 'tl', { color: same ? 'green' : 'red', weight: 600 });
          else S.corner('a curve passes too close to 0', 'tl', { color: 'red', weight: 600 });
          st = { okA, okB, nA: chA.discs.length, nB: chB.discs.length, endA, endB, same };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (!s.okA || !s.okB) return 'Keep the curves away from $0$, where no disc of a chain may go.';
          const d = (s.endB[1] - s.endA[1]) / (2 * Math.PI);
          return `Chain A: $${s.nA}$ discs, terminal value $${fmtC(v, s.endA)}$. Chain B: $${s.nB}$ discs, terminal value $${fmtC(v, s.endB)}$. ` + (s.same ? 'Identical, as 16.11 guarantees.' : `They differ by $${v.fix(d, 6)}\\cdot 2\\pi i$: chain B covers a different curve.`);
        });
      },
    },
  ],
};
