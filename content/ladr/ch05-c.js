// Linear Algebra Done Right — Chapter 5: Eigenvalues and Eigenvectors
// Part 3 (5.54–5.81): sums of eigenspaces and diagonalizability, the minimal-polynomial test, restrictions to
// invariant subspaces, Gershgorin disks, and commuting operators. Parts 1 and 2 are ch05.js and ch05-b.js.

// ---------- shared helpers ----------
/** A number for TeX: at most d decimals, trailing zeros dropped, never "-0". */
function tn(x, d = 2) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  let s = (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s === '-0' ? '0' : s;
}
/** The same for canvas text (real minus sign). */
const pn = (x, d = 2) => tn(x, d).replace('-', '−');
/** TeX for a real matrix (array of rows). */
const mtex = (A, d = 2) => `\\begin{bmatrix}${A.map((r) => r.map((x) => tn(x, d)).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`;
/** a + bi as TeX. */
function ctn(re, im, d = 2) {
  const a = Number(tn(re, d)), b = Number(tn(im, d));
  if (b === 0) return tn(a, d);
  const bb = Math.abs(b) === 1 ? '' : tn(Math.abs(b), d);
  return a === 0 ? `${b < 0 ? '-' : ''}${bb}i` : `${tn(a, d)} ${b < 0 ? '-' : '+'} ${bb}i`;
}
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
const unit3 = (a) => { const l = len3(a); return l > 1e-12 ? mul3(a, 1 / l) : [0, 0, 0]; };
const ZERO = [0, 0, 0];
const ap = (A, x) => A.map((r) => r.reduce((s, a, j) => s + a * x[j], 0));
const ap2 = (A, p) => [A[0][0] * p[0] + A[0][1] * p[1], A[1][0] * p[0] + A[1][1] * p[1]];
const maxAbs = (A) => Math.max(0, ...A.flat().map(Math.abs));
const msub = (A, B) => A.map((r, i) => r.map((x, j) => x - B[i][j]));
const shift = (A, lam) => A.map((r, i) => r.map((x, j) => (i === j ? x - lam : x)));
const colOf = (A, k) => A.map((r) => r[k]);
const fromCols = (cs) => cs[0].map((_, i) => cs.map((c) => c[i]));
/** Orthonormal basis of span(vs) in Rⁿ (Gram–Schmidt, twice); vectors already in the span are skipped. */
function orthN(vs, tol = 1e-7) {
  const B = [];
  for (const x of vs) {
    let w = x.slice();
    for (let p = 0; p < 2; p++) for (const e of B) { const d = w.reduce((s, c, i) => s + c * e[i], 0); w = w.map((c, i) => c - d * e[i]); }
    const l = Math.hypot(...w); if (l > tol * Math.max(1, Math.hypot(...x))) B.push(w.map((c) => c / l));
  }
  return B;
}
const projOnto = (x, B) => B.reduce((s, e) => add3(s, mul3(e, dot3(x, e))), [0, 0, 0]);
/** The operator whose matrix in the basis of P's columns is K, as a matrix in the standard basis: P K P⁻¹. */
const conj = (M, P, K) => M.matMul(M.matMul(P, K), M.inverse(P));
/** A tilted, well-conditioned basis of R³ in which the hidden matrices below are written. */
const QB = [unit3([1, -0.3, -0.2]), unit3([0.1, 1, 0.35]), unit3([-0.35, 0.25, 1])];
const QM = fromCols(QB);
const EC = ['blue', 'purple', 'teal']; // eigenspace colours
/**
 * Distinct real eigenvalues of A, clustered, each with an orthonormal basis of its eigenspace
 * E(λ, A) = null(A − λI) computed by the SVD; `nonreal` counts the nonreal eigenvalues.
 */
function eigenspaces(M, A) {
  const sc = 1 + maxAbs(A), vals = M.eig(A, { vectors: false }).values;
  const re = vals.filter((z) => Math.abs(z.im) <= 1e-6 * sc).map((z) => z.re).sort((a, b) => a - b);
  const groups = [];
  for (const x of re) { const g = groups[groups.length - 1]; if (g && x - g[g.length - 1] < 2e-4 * sc) g.push(x); else groups.push([x]); }
  const list = groups.map((g) => {
    const lam = g.reduce((s, x) => s + x, 0) / g.length;
    return { lam, mult: g.length, B: M.nullspace(shift(A, lam), 1e-6 * sc) };
  });
  return { list, nonreal: vals.length - re.length, vals };
}
/** Minimal polynomial (ascending monic coefficients): the first power Aᵏ that is a combination of I, A, …, Aᵏ⁻¹. */
function minPoly(M, A, tol = 1e-8) {
  const n = A.length, pw = [M.identity(n)];
  for (let k = 1; k <= n; k++) {
    pw.push(M.matMul(pw[k - 1], A));
    const B = M.transpose(pw.slice(0, k).map((X) => X.flat())), y = pw[k].flat();
    const c = M.lstsq(B, y);
    const r = y.map((t, i) => t - B[i].reduce((s, b, j) => s + b * c[j], 0));
    if (Math.hypot(...r) <= tol * Math.max(1, Math.hypot(...y))) return [...c.map((x) => -x), 1];
  }
  return M.charPoly(A);
}
/** Distinct zeros of a real polynomial (ascending coefficients) with multiplicities, sorted. */
function zerosMult(M, c) {
  const rs = M.polyRoots(c), out = [];
  const sc = 1 + Math.max(0, ...rs.map((z) => z.abs()));
  for (const z of rs) {
    const g = out.find((o) => Math.hypot(o.sr / o.m - z.re, o.si / o.m - z.im) < 2e-3 * sc);
    if (g) { g.m++; g.sr += z.re; g.si += z.im; } else out.push({ sr: z.re, si: z.im, m: 1 });
  }
  return out.map((o) => ({ re: o.sr / o.m, im: Math.abs(o.si / o.m) < 1e-6 * sc ? 0 : o.si / o.m, m: o.m })).sort((a, b) => a.re - b.re || a.im - b.im);
}
/** TeX for ∏ (z − r)^m from zerosMult output. */
function factT(zs, d = 2) {
  return zs.map(({ re, im, m }) => {
    const r = ctn(re, im, d);
    const f = r === '0' ? 'z' : im !== 0 && Number(tn(re, d)) !== 0 ? `(z - (${r}))` : r[0] === '-' ? `(z + ${r.slice(1)})` : `(z - ${r})`;
    return m > 1 ? `${f.startsWith('(') ? f : `(${f})`}^{${m}}` : f;
  }).join('');
}
/** The faces of the parallelepiped spanned by a, b, c (for scene3). */
function pped(sc, a, b, c, st) {
  const O = ZERO, ab = add3(a, b), ac = add3(a, c), bc = add3(b, c), abc = add3(ab, c);
  for (const f of [[O, a, ab, b], [c, ac, abc, bc], [O, a, ac, c], [b, ab, abc, bc], [O, b, bc, c], [a, ab, abc, ac]]) sc.poly(f, st);
}
/** Draw a subspace (orthonormal basis B) in a scene3: a fading line, a disc, or nothing for {0} and R³. */
function drawSub(sc, B, color, o = {}) {
  if (B.length === 1) { const L = o.len ?? 2; sc.line(mul3(B[0], -L), mul3(B[0], L), { color, width: o.width ?? 4.5, alpha: o.alpha ?? 0.45 }, 16); }
  else if (B.length === 2) sc.disc(B[0], B[1], o.r ?? 1.5, { fill: color, color, fillAlpha: o.fillAlpha ?? 0.12, grid: o.grid ?? true, alpha: o.edge ?? 0.6 });
}
/**
 * A point where a subspace label can go: the upper tip of a line (o.low: the lower one), or the top rim point of a
 * disc (o.low: the bottom one). Pair it with dy ≈ −12 (above) or +14 (below).
 */
function subLabelAt(sc, B, o = {}) {
  const sg = o.low ? -1 : 1;
  if (B.length === 1) { const u = sc.P(B[0])[1] * sg >= 0 ? B[0] : mul3(B[0], -1); return mul3(u, o.len ?? 1.8); }
  const ax = o.side ? 0 : 1, sx = o.side === 'left' ? -1 : o.side ? 1 : sg;
  const P0 = sc.P(B[0]), P1 = sc.P(B[1]), t = Math.atan2(sx * P1[ax], sx * P0[ax]), r = o.r ?? 1.5;
  return add3(mul3(B[0], r * Math.cos(t)), mul3(B[1], r * Math.sin(t)));
}

// ---------- complex matrices (for Gershgorin disks and 5.81) ----------
/** Characteristic polynomial (ascending, Cx) of a complex matrix (Faddeev–LeVerrier). */
function cCharPoly(Cx, A) {
  const n = A.length, Z = () => new Cx(0, 0), c = Array.from({ length: n + 1 }, Z);
  c[n] = new Cx(1, 0);
  let Mk = A.map((r) => r.map(Z));
  for (let k = 1; k <= n; k++) {
    const P = A.map((r) => Mk[0].map((_, j) => r.reduce((s, a, l) => s.add(a.mul(Mk[l][j])), Z())));
    for (let i = 0; i < n; i++) P[i][i] = P[i][i].add(c[n - k + 1]);
    Mk = P;
    let tr = Z();
    for (let i = 0; i < n; i++) for (let l = 0; l < n; l++) tr = tr.add(A[i][l].mul(Mk[l][i]));
    c[n - k] = tr.scale(-1 / k);
  }
  return c;
}
/** Eigenvalues of a complex matrix: zeros of its characteristic polynomial, refined by Newton steps. */
function cEigvals(M, A) {
  const c = cCharPoly(M.Cx, A), n = c.length - 1;
  const P = (z) => { let p = new M.Cx(0, 0), d = new M.Cx(0, 0); for (let k = n; k >= 0; k--) { d = d.mul(z).add(p); p = p.mul(z).add(c[k]); } return [p, d]; };
  return M.polyRoots(c).map((z) => { for (let i = 0; i < 3; i++) { const [p, d] = P(z); if (d.abs() < 1e-12) break; z = z.sub(p.div(d)); } return z; });
}
/** A unit vector x with (A − λI)x ≈ 0 (complex Gaussian elimination with complete pivoting). */
function cNullVec(Cx, A, lam) {
  const n = A.length, R = A.map((r, i) => r.map((z, j) => (i === j ? z.sub(lam) : z))), perm = [...Array(n).keys()];
  for (let k = 0; k < n - 1; k++) {
    let bi = k, bj = k, bv = -1;
    for (let i = k; i < n; i++) for (let j = k; j < n; j++) { const a = R[i][j].abs(); if (a > bv) { bv = a; bi = i; bj = j; } }
    [R[k], R[bi]] = [R[bi], R[k]];
    for (const r of R) [r[k], r[bj]] = [r[bj], r[k]];
    [perm[k], perm[bj]] = [perm[bj], perm[k]];
    if (bv < 1e-14) continue;
    for (let i = k + 1; i < n; i++) { const f = R[i][k].div(R[k][k]); for (let j = k; j < n; j++) R[i][j] = R[i][j].sub(f.mul(R[k][j])); }
  }
  const big = Math.max(1e-300, ...R.flat().map((z) => z.abs())), y = Array(n);
  y[n - 1] = new Cx(1, 0);
  for (let i = n - 2; i >= 0; i--) {
    let s = new Cx(0, 0); for (let j = i + 1; j < n; j++) s = s.add(R[i][j].mul(y[j]));
    y[i] = R[i][i].abs() < 1e-10 * big ? new Cx(0, 0) : s.neg().div(R[i][i]);
  }
  const x = Array(n); perm.forEach((p, j) => { x[p] = y[j]; });
  const nr = Math.sqrt(x.reduce((s, z) => s + z.abs2(), 0)) || 1;
  return x.map((z) => z.scale(1 / nr));
}
/** P·diag(d)·P⁻¹ for a real P and complex diagonal d (Cx list), as a matrix of Cx. */
function cDiagConj(M, P, d) {
  const Pi = M.inverse(P), n = P.length;
  return P.map((r, i) => Pi[0].map((_, j) => { let re = 0, im = 0; for (let k = 0; k < n; k++) { const w = r[k] * Pi[k][j]; re += w * d[k].re; im += w * d[k].im; } return new M.Cx(re, im); }));
}
/** Rotation of R³ by angle t about the axis u (Rodrigues). */
function rot3(u, t) {
  const [x, y, z] = unit3(u), c = Math.cos(t), s = Math.sin(t), C = 1 - c;
  return [[c + x * x * C, x * y * C - z * s, x * z * C + y * s], [y * x * C + z * s, c + y * y * C, y * z * C - x * s], [z * x * C - y * s, z * y * C + x * s, c + z * z * C]];
}
/** An asymmetric "F" in the unit square, so that orientation and shear are visible. */
const FSH = [[0, 0], [0.28, 0], [0.28, 0.42], [0.66, 0.42], [0.66, 0.62], [0.28, 0.62], [0.28, 0.8], [0.8, 0.8], [0.8, 1], [0, 1]];

export default {
  collection: 'ladr',
  chapter: 5,
  items: [
    // ------------------------------------------------------------------ 5.54
    {
      num: '5.54',
      kind: 'Theorem',
      name: 'Sum of eigenspaces is a direct sum',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ and $\lambda_1, \dots, \lambda_m$ are distinct eigenvalues of $T$. Then the sum
$$E(\lambda_1, T) + \cdots + E(\lambda_m, T)$$
is a direct sum: each of its vectors is $v_1 + \cdots + v_m$ with $v_k \in E(\lambda_k, T)$ in exactly one way. If moreover $V$ is finite-dimensional, then
$$\dim E(\lambda_1, T) + \cdots + \dim E(\lambda_m, T) \le \dim V.$$`,
      idea: String.raw`By 1.45 it is enough to show that $0$ is written only trivially. If $v_1 + \cdots + v_m = 0$ with $v_k \in E(\lambda_k, T)$, the nonzero $v_k$ would be eigenvectors for distinct eigenvalues adding up to $0$ — a linear dependence, which 5.11 forbids. So every $v_k = 0$. For the dimension count, the dimensions of the summands of a direct sum add up to the dimension of the sum (3.94), and the sum is a subspace of $V$, so its dimension is at most $\dim V$ (2.37).`,
      caption: String.raw`The coloured lines and planes are the eigenspaces of an operator $T$ on $\mathbf R^3$, computed from its matrix. Drag the gold vector $x$ (it stays inside the sum of the eigenspaces): it splits into eigen-components in exactly one way. Use the presets or the sliders to merge eigenvalues — a plane appears, or, with coupling, an eigenspace shrinks and the sum is only a plane; the dimensions never add to more than $3$. Then switch on the comparison: an arbitrary line $\ell$ (red) *can* be dragged into the plane of the others, and the moment it lies there the decomposition stops being unique.`,
      deps: ['ladr-5.11', 'ladr-1.45', 'ladr-3.94', 'ladr-2.37', 'ladr-5.52'],
      tags: ['eigenvalues', 'direct sums'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2.45, 2.45], y: [-2.2, 2.3], equal: true, axes: false, height: 430, minWidth: 340 });
        const sc = v.scene3(S, { yaw: -0.55, pitch: 0.32, axis: 1.75, lim: 1.75 });
        const PRE = { d: [2, -0.6, 0.6], p: [1, 2.4, 0], j: [1, 2.4, 0.8], s: [1, 1, 0] };
        const pre = v.select('', [{ value: 'd', label: '3 distinct' }, { value: 'p', label: '$\\lambda_2 = \\lambda_1$' }, { value: 'j', label: '$\\lambda_2 = \\lambda_1$, coupled' }, { value: 's', label: '$T = I$' }], 'd', {
          onChange: (k) => { const [a, b, c] = PRE[k]; l2.set(a); l3.set(b); cp.set(c); },
        });
        const l2 = v.slider('$\\lambda_2$', -1, 3, 2, { step: 0.05 }), l3 = v.slider('$\\lambda_3$', -1, 3, -0.6, { step: 0.05 });
        const cp = v.slider('coupling $c$', 0, 1.5, 0.6, { step: 0.05 });
        const cmp = v.toggle('compare: replace the $\\lambda_3$-eigenspace by an arbitrary line $\\ell$', false);
        const x = sc.handle([1.1, 0.8, 1.25], { color: 'gold', label: 'x', snap: (p) => (sumB.length && sumB.length < 3 ? projOnto(p, sumB) : p) });
        const ell = sc.handle(mul3(unit3([0.75, 0.75, 0.25]), 1.5), {
          color: 'red', snap: (p) => {
            const u = unit3(p), L = len3(p) || 1, base = orthN(others.flatMap((s) => s.B));
            if (base.length === 2) { const q = projOnto(u, base); if (len3(sub3(u, q)) < 0.12) return mul3(unit3(q), L); }
            for (const s of others) if (s.B.length === 1 && Math.abs(dot3(u, s.B[0])) > 0.993) return mul3(s.B[0], L * Math.sign(dot3(u, s.B[0])));
            return p;
          },
        });
        let sumB = [], others = [], st = null;
        const near = (a, b) => Math.abs(a - b) < 1e-6;
        v.render(() => {
          const lam = [1, near(l2.value, 1) ? 1 : l2.value, near(l3.value, 1) ? 1 : near(l3.value, l2.value) ? l2.value : l3.value];
          const T = conj(M, QM, [[lam[0], cp.value, 0], [0, lam[1], 0], [0, 0, lam[2]]]);
          const es = eigenspaces(M, T).list;
          let subs = es.map((e) => ({ B: e.B.map((b) => b.slice()), lam: e.lam, eig: true }));
          others = subs.filter((s) => Math.abs(s.lam - lam[2]) > 1e-6);
          ell.h.visible = cmp.value;
          if (cmp.value) subs = [...others, { B: [unit3(ell.p)], lam: null, eig: false }];
          subs.forEach((s) => { s.color = s.eig ? EC[Math.max(0, lam.findIndex((t) => Math.abs(t - s.lam) < 1e-6))] : 'red'; });
          const all = subs.flatMap((s) => s.B), d = all.length;
          sumB = orthN(all);
          if (sumB.length < 3) { const q = projOnto(x.p, sumB); x.p = len3(q) > 0.25 ? q : add3(mul3(sumB[0], 1.1), sumB[1] ? mul3(sumB[1], 0.7) : ZERO); }
          const B = fromCols(all), c = M.lstsq(B, x.p);
          let off = 0; const comps = subs.map((s) => { const u = s.B.reduce((acc, b, i) => add3(acc, mul3(b, c[off + i])), ZERO); off += s.B.length; return u; });
          const N = sumB.length < d ? M.nullspace(B) : [];
          sc.begin();
          if (sumB.length === 2 && subs.length > 1) drawSub(sc, sumB, 'muted', { r: 1.7, fillAlpha: 0.05, grid: false, edge: 0.35 });
          subs.forEach((s) => drawSub(sc, s.B, s.color, { fillAlpha: 0.14, len: 1.7 }));
          // the decomposition, tip to tail
          let at = ZERO;
          comps.forEach((u, k) => { if (len3(u) > 0.03) { sc.arrow(at, add3(at, u), { color: subs[k].color, width: 2.6, head: 9 }); sc.line(ZERO, u, { color: subs[k].color, width: 1.2, alpha: 0.6, dash: [4, 4] }); } at = add3(at, u); });
          if (N.length) { // a second decomposition: add a multiple of a nonzero way of writing 0
            const w = N[0], k0 = 0.9 / Math.max(...w.map(Math.abs));
            let o2 = 0, at2 = ZERO;
            subs.forEach((s) => { const u = s.B.reduce((acc, b, i) => add3(acc, mul3(b, c[o2 + i] + k0 * w[o2 + i])), ZERO); o2 += s.B.length; sc.arrow(at2, add3(at2, u), { color: 'red', width: 2, head: 8, dash: [5, 4] }); at2 = add3(at2, u); });
          }
          sc.arrow(ZERO, x.p, { color: 'gold', width: 3.2 });
          subs.forEach((s) => {
            if (s.B.length === 3) return;
            const lab = s.eig ? `E(${tn(s.lam)}, T)` : '\\ell';
            const lowL = s.B.length === 1 && subs.filter((t) => t.B.length === 1).indexOf(s) === 1;
            sc.tex(lab, subLabelAt(sc, s.B, { len: 1.7, low: lowL }), { color: s.color, size: 14, dy: lowL ? 14 : -12 });
          });
          sc.flush();
          if (sumB.length === 3 && subs.length === 1) S.corner('E(1, T) = R³: every nonzero vector is an eigenvector', 'tl', { color: 'blue', weight: 600 });
          else if (N.length) S.corner('ℓ lies in the sum of the others: NOT a direct sum', 'tl', { color: 'red', weight: 700 });
          else S.corner(`direct sum of dimension ${sumB.length} = ${subs.map((s) => s.B.length).join(' + ')}`, 'tl', { color: 'green', weight: 700 });
          st = { subs, comps, dsum: sumB.length, d, N: N.length };
        });
        v.legend([['gold', '$x$, dragged inside the sum'], ['blue', 'its components $v_k \\in E(\\lambda_k, T)$'], ['muted', 'the sum, when it is a plane', { area: true }], ['red', 'a second decomposition (only for $\\ell$)', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { subs, comps, dsum, d, N } = st;
          const nm = subs.map((s) => (s.eig ? `E(${tn(s.lam)},T)` : '\\ell'));
          const dec = `x = ${comps.map((u, k) => `\\underbrace{${'(' + u.map((t) => tn(t)).join(',') + ')'}}_{${subs[k].eig ? `\\in ${nm[k]}` : '\\in \\ell'}}`).join(' + ')}`;
          const dims = `${nm.map((t) => `\\dim ${t}`).join(' + ')} = ${subs.map((s) => s.B.length).join(' + ')} = ${d}`;
          if (N) return `$${dims}$ but the sum is only ${dsum}-dimensional, so it is **not direct**: the red chain is a second way of writing the same $x$ — the eigenspace hypothesis is what rules this out.`;
          return `$${dec}$ — the only way, since $${dims} \\le 3$ is also the dimension of the sum (3.94).`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.55
    {
      num: '5.55',
      kind: 'Theorem',
      name: 'Conditions equivalent to diagonalizability',
      statement: String.raw`Suppose $V$ is finite-dimensional, $T \in \mathcal L(V)$, and $\lambda_1, \dots, \lambda_m$ are the distinct eigenvalues of $T$. The following are equivalent:
(a) $T$ is diagonalizable;
(b) $V$ has a basis consisting of eigenvectors of $T$;
(c) $V = E(\lambda_1, T) \oplus \cdots \oplus E(\lambda_m, T)$;
(d) $\dim V = \dim E(\lambda_1, T) + \cdots + \dim E(\lambda_m, T)$.`,
      idea: String.raw`(a)⟺(b): the matrix of $T$ in a basis $v_1, \dots, v_n$ is diagonal exactly when each $Tv_k$ is a multiple of $v_k$. (b)⟹(c): an eigenbasis shows that the eigenspaces add up to $V$, and the sum is direct by 5.54. (c)⟹(d) is 3.94. (d)⟹(b): put bases of the eigenspaces side by side; this is a list of $\dim V$ eigenvectors, and it is linearly independent because grouping a vanishing combination by eigenvalue gives eigenvectors for distinct eigenvalues summing to $0$ (5.11), so it is a basis (2.38).`,
      caption: String.raw`$T$ has matrix $\begin{bmatrix} 2 & a \\ 0 & \lambda_2 \end{bmatrix}$. Drag the gold vector $v$ (it snaps onto eigen-lines, where $Tv$ turns green) and move the sliders. While $\lambda_2 \ne 2$, two eigen-lines exist and the cell they span is only stretched by $T$: all four conditions hold. Set $\lambda_2 = 2$: with $a = 0$ every vector is an eigenvector; with $a \ne 0$ the eigenvectors fill only one line, the cell is sheared, and all four conditions fail together.`,
      deps: ['ladr-5.50', 'ladr-5.54', 'ladr-3.94', 'ladr-5.11', 'ladr-2.38'],
      tags: ['diagonalization'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-3.1, 3.1], y: [-2.5, 2.5], equal: true, height: 390, weight: 1.25, minWidth: 320 });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 390, minWidth: 270, title: 'the four conditions' });
        const aS = v.slider('$a$', -2, 2, 1, { step: 0.05 });
        const lS = v.slider('$\\lambda_2$', 0.5, 3.5, 3, { step: 0.05 });
        let lines = [];
        const vh = S.handle(-1.0, 0.6, {
          color: 'gold', label: 'v', constrain: (x, y) => {
            for (const L of lines) { const t = x * L[0] + y * L[1]; if (Math.abs(x * L[1] - y * L[0]) < 0.12 && Math.abs(t) > 0.2) return [t * L[0], t * L[1]]; }
            return [x, y];
          },
        });
        let st = null;
        v.render(() => {
          const a = aS.value, l2 = Math.abs(lS.value - 2) < 1e-6 ? 2 : lS.value, T = [[2, a], [0, l2]];
          const es = eigenspaces(M, T).list, dims = es.map((e) => e.B.length), tot = dims.reduce((s, x) => s + x, 0), diag = tot === 2;
          const scalar = es.length === 1 && dims[0] === 2;
          lines = scalar ? [] : es.filter((e) => e.B.length === 1).map((e) => e.B[0]);
          // unit circle and its image
          S.circle(0, 0, 0.7, { color: 'faint', width: 1, dash: [3, 4] });
          S.curve((t) => ap2(T, [0.7 * Math.cos(t), 0.7 * Math.sin(t)]), 0, 2 * Math.PI, { color: 'muted', width: 1.2, fill: 'muted', fillAlpha: 0.07, n: 120 });
          if (scalar) S.rect(-9, -9, 9, 9, { fill: 'blue', fillAlpha: 0.05, stroke: false });
          es.forEach((e, k) => { if (e.B.length === 1) { const u = e.B[0]; S.line(-6 * u[0], -6 * u[1], 6 * u[0], 6 * u[1], { color: EC[k], width: 4, alpha: 0.4 }); const s = u[1] > 0.05 || (Math.abs(u[1]) <= 0.05 && u[0] > 0) ? -1 : 1; S.tex(`E(${tn(e.lam)}, T)`, 2.5 * u[0] * s, 2.5 * u[1] * s, { color: EC[k], size: 14, dy: Math.abs(u[1]) < 0.3 ? -14 : 14 }); } });
          // the cell spanned by an eigenbasis (or by the standard basis when there is none) and its image
          let b1, b2, cellCol;
          if (diag) { b1 = scalar ? [1, 0] : es[0].B[0]; b2 = scalar ? [0, 1] : es[1] ? es[1].B[0] : es[0].B[1]; cellCol = 'green'; } else { b1 = [1, 0]; b2 = [0, 1]; cellCol = 'red'; }
          b1 = [0.7 * b1[0], 0.7 * b1[1]]; b2 = [0.7 * b2[0], 0.7 * b2[1]];
          const cell = [[0, 0], b1, [b1[0] + b2[0], b1[1] + b2[1]], b2];
          S.poly(cell, { color: 'muted', width: 1.2, fill: 'muted', fillAlpha: 0.06 });
          S.poly(cell.map((p) => ap2(T, p)), { color: cellCol, width: 2, fill: cellCol, fillAlpha: 0.1, dash: diag ? false : [6, 4] });
          // the dragged vector and its image
          const Tv = ap2(T, [vh.x, vh.y]), par = Math.abs(vh.x * Tv[1] - vh.y * Tv[0]) < 1e-9 * (1 + Math.hypot(...Tv));
          S.arrow(0, 0, Tv[0], Tv[1], { color: par ? 'green' : 'orange', width: 2.6 });
          S.arrow(0, 0, vh.x, vh.y, { color: 'gold', width: 2.8 });
          const bx = S.bounds, lx = M.clamp(Tv[0], bx.x[0] + 0.5, bx.x[1] - 0.6), ly = M.clamp(Tv[1], bx.y[0] + 0.3, bx.y[1] - 0.3);
          S.tex(par ? `Tv = ${tn(Math.hypot(...Tv) / Math.hypot(vh.x, vh.y) * Math.sign(Tv[0] * vh.x + Tv[1] * vh.y))}\\,v` : 'Tv', lx, ly, { color: par ? 'green' : 'orange', size: 14, dx: 18, dy: -10 });
          // the checklist
          const ok = diag, mk = (y, s, good) => { R.tex(s, 0.06, y, { align: 'left', size: 14 }); R.text(good ? '✓' : '✗', 0.95, y, { color: good ? 'green' : 'red', size: 19, weight: 700, align: 'right' }); };
          R.text('(a)', 0.06, 0.9, { color: 'muted', size: 12, weight: 700 });
          R.text('(b)', 0.06, 0.66, { color: 'muted', size: 12, weight: 700 });
          R.text('(c)', 0.06, 0.42, { color: 'muted', size: 12, weight: 700 });
          R.text('(d)', 0.06, 0.2, { color: 'muted', size: 12, weight: 700 });
          if (ok) {
            const V = [b1, b2], Vm = M.transpose(V), D = M.matMul(M.inverse(Vm), M.matMul(T, Vm));
            mk(0.81, `\\mathcal M(T,(v_1,v_2)) = ${mtex(D)}`, true);
            mk(0.58, scalar ? '\\text{every basis is an eigenbasis}' : `v_1, v_2 \\text{ eigenvectors, a basis}`, true);
            mk(0.34, scalar ? 'E(2,T) = \\mathbf R^2' : `E(${tn(es[0].lam)},T) \\oplus E(${tn(es[1].lam)},T) = \\mathbf R^2`, true);
            mk(0.12, scalar ? '\\dim E(2,T) = 2' : `\\dim E(${tn(es[0].lam)},T) + \\dim E(${tn(es[1].lam)},T) = 2`, true);
          } else {
            mk(0.81, '\\text{no basis gives a diagonal } \\mathcal M(T)', false);
            mk(0.58, '\\text{all eigenvectors lie on one line}', false);
            mk(0.34, 'E(2,T) \\text{ is a line} \\ne \\mathbf R^2', false);
            mk(0.12, '\\dim E(2,T) = 1 < 2', false);
          }
          st = { a, l2, es, ok, scalar, par, Tv };
        });
        v.legend([['muted', 'a circle and its image under $T$', { area: true }], ['green', 'image of the eigen-cell: stretched', { area: true }], ['red', 'no eigenbasis: sheared square', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { a, l2, es, ok, scalar } = st;
          const E = es.map((e) => `\\dim E(${tn(e.lam)},T) = ${e.B.length}`).join(',\\ ');
          if (scalar) return `$a = 0,\\ \\lambda_2 = 2$: $T = 2I$, so $E(2,T) = \\mathbf R^2$ and every basis diagonalizes $T$.`;
          return `${es.length > 1 ? 'Eigenvalues' : 'Only eigenvalue'} ${es.map((e) => `$${tn(e.lam)}$`).join(' and ')}: $${E}$, total $${es.reduce((s, e) => s + e.B.length, 0)}$ ${ok ? '$= 2 = \\dim \\mathbf R^2$ — **diagonalizable**' : '$< 2$ — **not diagonalizable**: $(T - 2I)^2 = 0$ but $T - 2I \\ne 0$'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.58
    {
      num: '5.58',
      kind: 'Theorem',
      name: 'Enough eigenvalues implies diagonalizability',
      statement: String.raw`Suppose $V$ is finite-dimensional and $T \in \mathcal L(V)$ has $\dim V$ distinct eigenvalues. Then $T$ is diagonalizable.`,
      idea: String.raw`Pick one eigenvector for each of the $\dim V$ distinct eigenvalues. Eigenvectors for distinct eigenvalues are linearly independent (5.11), and a linearly independent list of length $\dim V$ is a basis (2.38). In this basis of eigenvectors $T$ has a diagonal matrix (5.55). The condition is sufficient but not necessary: $I$ has one eigenvalue and is diagonal in every basis.`,
      caption: String.raw`An operator on $\mathbf R^3$ is built with the eigenvalues you drag on the number line (right). Its eigen-axes are computed from the matrix and drawn with the box spanned by unit eigenvectors; the table shows the matrix of $T$ in that eigenbasis. While the three eigenvalues are distinct the box never flattens and the matrix is diagonal. Drag one eigenvalue onto another (it snaps): with coupling on, an eigen-axis disappears and the box collapses; with coupling off, a whole plane of eigenvectors appears and $T$ is still diagonalizable. Resample for another operator.`,
      deps: ['ladr-5.11', 'ladr-2.38', 'ladr-5.50'],
      tags: ['diagonalization'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2.3, 2.3], y: [-2.1, 2.2], equal: true, axes: false, height: 400, weight: 1.25, minWidth: 320 });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.3, axis: 1.6 });
        const R = v.stage({ x: [-1.45, 3.45], y: [0, 1], axes: false, height: 400, minWidth: 250, title: 'eigenvalues $\\lambda_1, \\lambda_2, \\lambda_3$ (drag)' });
        const LY = 0.86, H = [];
        [-0.5, 1, 2.5].forEach((x0, k) => H.push(R.handle(x0, LY, {
          color: EC[k], label: `λ${'₁₂₃'[k]}`, labelPos: 'n',
          constrain: (x) => { x = M.clamp(x, -1.2, 3.2); for (let j = 0; j < 3; j++) if (j !== k && Math.abs(x - H[j].x) < 0.12) return [H[j].x, LY]; return [Math.round(x * 20) / 20, LY]; },
        })));
        const coup = v.toggle('coupling (off-diagonal entries)', true);
        let seed = 3, Q = QM, U = [0.9, -0.6, 0.7];
        const resample = () => {
          const r = v.rng(seed++);
          for (let tries = 0; tries < 50; tries++) { const C = [0, 1, 2].map(() => [r.uniform(-1, 1), r.uniform(-1, 1), r.uniform(-1, 1)]); const Bs = C.map(unit3); if (Math.abs(M.det(Bs)) > 0.5) { Q = fromCols(Bs); break; } }
          U = [r.uniform(-1.2, 1.2), r.uniform(-1.2, 1.2), r.uniform(-1.2, 1.2)];
        };
        v.button('Resample', resample);
        const tab = v.table(R, { rows: 3, cols: 3, region: [-1.4, 0.04, 3.4, 0.6], maxCell: 52, size: 14 });
        let st = null;
        v.render(() => {
          const L = H.map((h) => h.x), k = coup.value ? 1 : 0;
          const T = conj(M, Q, [[L[0], k * U[0], k * U[1]], [0, L[1], k * U[2]], [0, 0, L[2]]]);
          const es = eigenspaces(M, T).list, vecs = es.flatMap((e) => e.B.map((b) => ({ b, lam: e.lam }))), d = vecs.length;
          const order = vecs.map((w) => H.findIndex((h) => Math.abs(h.x - w.lam) < 1e-3));
          sc.begin();
          es.forEach((e) => { const kk = H.findIndex((h) => Math.abs(h.x - e.lam) < 1e-3); drawSub(sc, e.B, EC[Math.max(0, kk)], { len: 1.7, r: 1.45, alpha: 0.35, fillAlpha: 0.08 }); });
          const vol = d === 3 ? Math.abs(M.det(vecs.map((w) => w.b))) : 0;
          if (d === 3) pped(sc, vecs[0].b, vecs[1].b, vecs[2].b, { fill: 'green', color: 'green', fillAlpha: 0.08 + 0.1 * vol, alpha: 0.7 });
          else if (d === 2) sc.poly([ZERO, vecs[0].b, add3(vecs[0].b, vecs[1].b), vecs[1].b], { fill: 'red', color: 'red', fillAlpha: 0.2 });
          vecs.forEach((w, i) => { const c = EC[Math.max(0, order[i])]; sc.arrow(ZERO, w.b, { color: c, width: 3 }); sc.tex(`v_{${i + 1}}`, mul3(w.b, 1.18), { color: c, size: 15 }); });
          sc.flush();
          S.corner(d === 3 ? `eigen-box volume ${pn(vol, 3)}: a basis of eigenvectors` : `only ${d} independent eigenvectors: no eigenbasis`, 'tl', { color: d === 3 ? 'green' : 'red', weight: 700 });
          // number line
          R.line(-1.3, LY, 3.3, LY, { color: 'muted', width: 1.4 });
          for (let t = -1; t <= 3; t++) { R.line(t, LY - 0.015, t, LY + 0.015, { color: 'muted', width: 1 }); R.text(pn(t), t, LY - 0.05, { align: 'center', size: 11, color: 'muted' }); }
          const ndist = new Set(L.map((x) => x.toFixed(4))).size;
          R.text(`${ndist} distinct eigenvalue${ndist > 1 ? 's' : ''} on dim V = 3`, 1, 0.71, { align: 'center', size: 12.5, weight: 600, color: ndist === 3 ? 'green' : 'muted' });
          if (d === 3) {
            const V = fromCols(vecs.map((w) => w.b)), D = M.matMul(M.inverse(V), M.matMul(T, V));
            tab.draw({ value: (i, j) => D[i][j], format: (x) => pn(x), fill: (i, j) => (i === j ? ['green', 0.16] : null), textColor: (i, j) => (i === j ? 'ink' : 'faint') });
            const g = tab.geo; if (g) R.texPx('\\mathcal M\\big(T,(v_1,v_2,v_3)\\big)', g.X0 + (g.cols * g.cw) / 2, g.Y0 - 14, { size: 14, color: 'green' });
            st = { ok: true, vol, off: Math.max(...D.flatMap((r, i) => r.filter((_, j) => j !== i).map(Math.abs))), ndist, L };
          } else {
            R.text('no basis of eigenvectors —', 1, 0.36, { align: 'center', size: 13, color: 'red', weight: 600 });
            R.text('no diagonal matrix', 1, 0.29, { align: 'center', size: 13, color: 'red', weight: 600 });
            st = { ok: false, d, ndist, L };
          }
        });
        v.legend([['green', 'box spanned by unit eigenvectors', { area: true }], ['red', 'flattened: eigenvectors dependent', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const ev = st.L.map((x) => tn(x)).join(', ');
          if (st.ok) return `Eigenvalues $${ev}$${st.ndist === 3 ? ' (distinct)' : ''}: the eigenvectors are independent (box volume ${tn(st.vol, 3)}), and in their basis the largest off-diagonal entry is $${v.sci(st.off, 1)}$ — **diagonal**${st.ndist < 3 ? ', even though the eigenvalues are not distinct' : ''}.`;
          return `Eigenvalues $${ev}$: only ${st.d} independent eigenvectors, so no eigenbasis — fewer than $\\dim V$ distinct eigenvalues **can** fail.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.62
    {
      num: '5.62',
      kind: 'Theorem',
      name: 'Necessary and sufficient condition for diagonalizability',
      statement: String.raw`Suppose $V$ is finite-dimensional and $T \in \mathcal L(V)$. Then $T$ is diagonalizable if and only if the minimal polynomial of $T$ equals $(z - \lambda_1)\cdots(z - \lambda_m)$ for some list of **distinct** numbers $\lambda_1, \dots, \lambda_m \in \mathbf F$.`,
      idea: String.raw`If $v_1, \dots, v_n$ is an eigenbasis and $\lambda_1, \dots, \lambda_m$ are the distinct eigenvalues, then $(T - \lambda_1 I)\cdots(T - \lambda_m I)$ kills every $v_j$, so it is $0$ and the minimal polynomial divides this product of distinct factors (5.29). Conversely, induct on $m$: $\operatorname{range}(T - \lambda_m I)$ is invariant (5.18), and $T$ restricted to it is killed by the first $m-1$ factors, so it has an eigenbasis by induction. A vector in $\operatorname{range}(T - \lambda_m I) \cap \operatorname{null}(T - \lambda_m I)$ is multiplied by $\prod_{k<m}(\lambda_m - \lambda_k) \ne 0$ and sent to $0$, so the intersection is $\{0\}$; by 1.46, 3.94 and 3.21 the range and the null space are complementary, and their eigenbases together form one for $V$.`,
      caption: String.raw`$T$ is the operator on $\mathbf R^3$ with matrix $\begin{bmatrix} 2 & s & 0 \\ 0 & \lambda & 0 \\ 0 & 0 & 3\end{bmatrix}$ in a tilted basis. Its minimal polynomial is computed from the powers of $T$ (right). The picture shows $\operatorname{null}(T - \mu I)$ (green) and $\operatorname{range}(T - \mu I)$ (orange) for the chosen eigenvalue $\mu$ — the two pieces of the proof. With $\lambda \ne 2$, or with $s = 0$, they are complementary and the factors are distinct. Set $\lambda = 2$ with $s \ne 0$: the factor $z - 2$ repeats, the null line falls *inside* the range plane (red), and no eigenbasis exists.`,
      deps: ['ladr-5.29', 'ladr-5.18', 'ladr-1.46', 'ladr-3.94', 'ladr-3.21', 'ladr-5.55'],
      tags: ['diagonalization', 'minimal polynomial'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2.3, 2.3], y: [-2.1, 2.2], equal: true, axes: false, height: 400, weight: 1.3, minWidth: 320 });
        const sc = v.scene3(S, { yaw: -0.55, pitch: 0.3, axis: 1.6 });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, minWidth: 260, title: 'minimal polynomial, computed' });
        const lamS = v.slider('$\\lambda$', 1, 3.5, 2, { step: 0.05 }), sS = v.slider('coupling $s$', 0, 1.5, 1, { step: 0.05 });
        const mu = v.select('show null and range of', [{ value: 2, label: '$T - 2I$' }, { value: 3, label: '$T - 3I$' }], 2);
        let st = null;
        v.render(() => {
          const lam = [2, 3].find((t) => Math.abs(lamS.value - t) < 1e-6) ?? lamS.value, s = sS.value, m = +mu.value;
          const T = conj(M, QM, [[2, s, 0], [0, lam, 0], [0, 0, 3]]), A = shift(T, m);
          const N = M.nullspace(A, 1e-7), Rg = orthN([0, 1, 2].map((k) => colOf(A, k)), 1e-7);
          const inter = N.length + Rg.length - orthN([...N, ...Rg], 1e-7).length;
          const interB = inter ? orthN(N.filter((u) => len3(sub3(u, projOnto(u, Rg))) < 1e-6)) : [];
          const mp = minPoly(M, T), zs = zerosMult(M, mp), distinct = zs.every((z) => z.m === 1);
          const es = eigenspaces(M, T).list, tot = es.reduce((a, e) => a + e.B.length, 0);
          sc.begin();
          drawSub(sc, Rg, 'orange', { r: 1.5, fillAlpha: 0.12, width: 5, alpha: 0.5, len: 1.65 });
          drawSub(sc, N, 'green', { r: 1.35, fillAlpha: 0.14, width: 7, alpha: 0.55, len: 1.65 });
          if (interB.length === 1) sc.line(mul3(interB[0], -1.65), mul3(interB[0], 1.65), { color: 'red', width: 2.6, bias: -0.02 }, 16);
          if (Rg.length && Rg.length < 3) sc.tex(`\\operatorname{range}(T - ${m}I)`, subLabelAt(sc, Rg, { r: 1.5, len: 1.65 }), { color: 'orange', size: 14, dy: -13 });
          if (N.length && N.length < 3) sc.tex(`\\operatorname{null}(T - ${m}I)`, subLabelAt(sc, N, { r: 1.35, len: 1.65, low: true }), { color: 'green', size: 14, dy: 15 });
          sc.flush();
          S.corner(inter ? 'range ∩ null ≠ {0}: not complementary' : 'range + null = R³, a direct sum', 'tl', { color: inter ? 'red' : 'green', weight: 700 });
          // right panel
          R.tex(factT(zs), 0.5, 0.87, { size: 20, color: distinct ? 'green' : 'red' });
          R.text(distinct ? 'distinct linear factors' : 'a repeated factor', 0.5, 0.76, { align: 'center', size: 12.5, weight: 600, color: distinct ? 'green' : 'red' });
          const prod = zs.reduce((P, z) => M.matMul(P, shift(T, z.re)), M.identity(3));
          R.tex(`\\textstyle\\prod_k (T - \\lambda_k I) ${maxAbs(prod) < 1e-7 ? '= 0' : '\\ne 0'}`, 0.5, 0.6, { size: 15 });
          R.text(`largest entry ${maxAbs(prod) < 1e-7 ? '≈ 0' : pn(maxAbs(prod), 3)} (over distinct λₖ)`, 0.5, 0.52, { align: 'center', size: 11.5, color: 'muted' });
          R.tex(`${es.map((e) => `\\dim E(${tn(e.lam)},T)`).join(' + ')}`, 0.5, 0.36, { size: 13.5 });
          R.tex(`= ${es.map((e) => e.B.length).join(' + ')} = ${tot}`, 0.5, 0.28, { size: 15, color: tot === 3 ? 'green' : 'red' });
          R.text(tot === 3 ? 'diagonalizable ✓' : 'not diagonalizable ✗', 0.5, 0.13, { align: 'center', size: 15, weight: 700, color: tot === 3 ? 'green' : 'red' });
          st = { zs, distinct, inter, N: N.length, Rg: Rg.length, m, tot };
        });
        v.legend([['green', '$\\operatorname{null}(T - \\mu I) = E(\\mu, T)$', { area: true }], ['orange', '$\\operatorname{range}(T - \\mu I)$', { area: true }], ['red', 'their intersection']]);
        v.readout(() => {
          if (!st) return '';
          const { zs, distinct, inter, N, Rg, m, tot } = st;
          return `Minimal polynomial $${factT(zs)}$: ${distinct ? 'distinct linear factors' : 'a repeated factor'}. For $\\mu = ${m}$: $\\dim\\operatorname{null} + \\dim\\operatorname{range} = ${N} + ${Rg} = 3$ (3.21) and the intersection has dimension $${inter}$, so ${inter ? 'they are **not** complementary' : 'they **are** complementary'}. Eigenvectors span a ${tot}-dimensional space: ${tot === 3 ? '**diagonalizable**' : '**not diagonalizable**'} — exactly as the factors predict.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.65
    {
      num: '5.65',
      kind: 'Theorem',
      name: 'Diagonalizability passes to invariant subspaces',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ is diagonalizable and $U$ is a subspace of $V$ that is invariant under $T$. Then the restriction $T|_U$ is a diagonalizable operator on $U$.`,
      idea: String.raw`By 5.62 the minimal polynomial of $T$ is $(z - \lambda_1)\cdots(z - \lambda_m)$ with distinct $\lambda_k$. The minimal polynomial of $T|_U$ divides that of $T$ (5.31), so it is again a product of distinct linear factors, and 5.62 applied on $U$ says $T|_U$ is diagonalizable. Concretely: an eigenbasis of $U$ can be found inside $U$, although the eigenbasis of $T$ itself may have no vector in $U$ at all.`,
      caption: String.raw`Drag the normal $n$ of the plane $U$, or press *next invariant plane*; the plane snaps when it becomes invariant (the dashed curve is the image under $T$ of a circle in $U$, and lies in $U$ exactly then). When $U$ is invariant the right panel shows $T|_U$ in an orthonormal basis of $U$, with its eigen-directions, which are eigenvectors of $T$ lying in $U$. With eigenvalues $2, 2, 3$ there are infinitely many invariant planes, most of them containing no eigenvector of the original eigenbasis — yet $T|_U$ is still diagonalizable. Switch to the non-diagonalizable $T$ and find the plane where $T|_U$ has a single eigen-direction.`,
      deps: ['ladr-5.62', 'ladr-5.31', 'ladr-5.2'],
      tags: ['diagonalization', 'invariant subspaces'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2.3, 2.3], y: [-2.1, 2.2], equal: true, axes: false, height: 400, weight: 1.3, minWidth: 320 });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.32, axis: 1.6 });
        const R = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, axes: false, height: 400, minWidth: 250, title: '$T|_U$ in an orthonormal basis $e_1, e_2$ of $U$' });
        const KS = { a: [[1, 0, 0], [0, 2, 0], [0, 0, 3]], b: [[2, 0, 0], [0, 2, 0], [0, 0, 3]], c: [[2, 1, 0], [0, 2, 0], [0, 0, 3]] };
        // candidate invariant planes, listed by their normals (eigenvectors of Tᵀ); a 2-dimensional eigenspace of Tᵀ gives a fan of them
        const cands = (k) => eigenspaces(M, M.transpose(conj(M, QM, KS[k]))).list.flatMap((e) => (e.B.length === 1 ? [e.B[0]] : [0.5, 1.6, 2.6].map((a) => add3(mul3(e.B[0], Math.cos(a)), mul3(e.B[1], Math.sin(a))))));
        const START = { a: 0, b: 1, c: 1 };
        let ci = 1;
        const goTo = (k, idx) => { const C = cands(k); ci = ((idx % C.length) + C.length) % C.length; const u = C[ci]; n.set(mul3(u[2] < 0 ? mul3(u, -1) : u, 1.3)); };
        const kind = v.select('$T$', [{ value: 'a', label: 'eigenvalues $1, 2, 3$' }, { value: 'b', label: 'eigenvalues $2, 2, 3$' }, { value: 'c', label: 'not diagonalizable' }], 'b', { onChange: (k) => goTo(k, START[k]) });
        v.button('next invariant plane', () => goTo(kind.value, ci + 1));
        let normals = [];
        const n = sc.handle([0, 0, 1.3], {
          color: 'accent', label: 'n', snap: (p) => {
            const u = unit3(p), L = Math.max(0.6, len3(p));
            for (const B of normals) { const q = projOnto(u, B); if (len3(sub3(u, q)) < 0.14 && len3(q) > 0.1) return mul3(unit3(q), L); }
            return p;
          },
        });
        goTo('b', START.b);
        let st = null;
        v.render(() => {
          const T = conj(M, QM, KS[kind.value]);
          normals = eigenspaces(M, M.transpose(T)).list.map((e) => e.B); // U = n^⊥ is invariant ⟺ Tᵀn ∥ n
          const u = unit3(n.p), e1 = unit3(Math.abs(u[2]) < 0.9 ? cross3([0, 0, 1], u) : cross3([1, 0, 0], u)), e2 = cross3(u, e1);
          const leak = Math.max(Math.abs(dot3(ap(T, e1), u)), Math.abs(dot3(ap(T, e2), u)));
          const inv = leak < 1e-7 * (1 + maxAbs(T));
          const es = eigenspaces(M, T).list;
          sc.begin();
          es.forEach((e, k) => drawSub(sc, e.B, EC[k], { len: 1.7, r: 1.25, alpha: 0.3, fillAlpha: 0.05, grid: false }));
          sc.disc(e1, e2, 1.3, { fill: inv ? 'green' : 'muted', color: inv ? 'green' : 'muted', fillAlpha: inv ? 0.16 : 0.08, grid: true, alpha: 0.7 });
          const circ = [], rim = []; for (let i = 0; i <= 72; i++) { const t = (2 * Math.PI * i) / 72, w = add3(mul3(e1, 0.4 * Math.cos(t)), mul3(e2, 0.4 * Math.sin(t))); circ.push(w); rim.push(ap(T, w)); }
          sc.path(circ, { color: inv ? 'green' : 'muted', width: 1.4 });
          sc.path(rim, { color: inv ? 'green' : 'red', width: 1.8, dash: [5, 4] });
          sc.arrow(ZERO, n.p, { color: 'accent', width: 2.2 });
          sc.arrow(ZERO, mul3(e1, 1.0), { color: 'muted', width: 1.6, head: 7 }); sc.arrow(ZERO, mul3(e2, 1.0), { color: 'muted', width: 1.6, head: 7 });
          sc.tex('e_1', mul3(e1, 1.14), { color: 'muted', size: 13 }); sc.tex('e_2', mul3(e2, 1.14), { color: 'muted', size: 13 });
          let RU = null, rev = null;
          if (inv) {
            RU = [[dot3(e1, ap(T, e1)), dot3(e1, ap(T, e2))], [dot3(e2, ap(T, e1)), dot3(e2, ap(T, e2))]];
            rev = eigenspaces(M, RU).list;
            rev.forEach((e) => e.B.forEach((b) => { const w = add3(mul3(e1, b[0]), mul3(e2, b[1])); sc.arrow(ZERO, mul3(w, 1.25), { color: 'gold', width: 3 }); }));
          }
          sc.flush();
          S.corner(inv ? 'U is invariant under T' : 'U is not invariant: T pushes its rim out', 'tl', { color: inv ? 'green' : 'red', weight: 700 });
          if (inv) {
            R.arrow(0, 0, 1.1, 0, { color: 'muted', width: 1.4, head: 7 }); R.arrow(0, 0, 0, 1.1, { color: 'muted', width: 1.4, head: 7 });
            R.tex('e_1', 1.1, 0, { color: 'muted', size: 13, dx: 10, dy: 10 }); R.tex('e_2', 0, 1.1, { color: 'muted', size: 13, dx: -12 });
            R.circle(0, 0, 0.6, { color: 'muted', width: 1.2 });
            R.curve((t) => ap2(RU, [0.6 * Math.cos(t), 0.6 * Math.sin(t)]), 0, 2 * Math.PI, { color: 'green', width: 1.6, fill: 'green', fillAlpha: 0.07, n: 120 });
            const dsum = rev.reduce((a, e) => a + e.B.length, 0);
            rev.forEach((e) => {
              if (e.B.length === 2) { R.rect(-9, -9, 9, 9, { fill: 'gold', fillAlpha: 0.06, stroke: false }); return; }
              const b = e.B[0]; R.line(-5 * b[0], -5 * b[1], 5 * b[0], 5 * b[1], { color: 'gold', width: 3, alpha: 0.55 });
              const s = b[0] < -0.05 ? -1 : 1; R.tex(`\\lambda = ${tn(e.lam)}`, 1.8 * b[0] * s, 1.8 * b[1] * s, { color: 'gold', size: 14, dx: 14 * Math.abs(b[1]), dy: -13 * Math.abs(b[0]) });
            });
            R.corner(dsum === 2 ? 'eigenbasis of U found inside U' : 'only one eigen-direction in U', 'tl', { color: dsum === 2 ? 'green' : 'red', weight: 700 });
            R.tex(`\\mathcal M(T|_U) = ${mtex(RU)}`, 0, -1.8, { size: 13.5 });
          } else {
            R.text('T|U is not an operator on U', 0, 1.65, { align: 'center', size: 13, color: 'red', weight: 600 });
            R.text(`T moves vectors of U out of U by up to ${pn(leak, 2)}`, 0, 1.35, { align: 'center', size: 12, color: 'muted' });
          }
          st = { inv, T, RU, rev, kind: kind.value };
        });
        v.legend([['green', 'invariant plane $U$', { area: true }], ['gold', 'eigenvectors of $T|_U$'], ['blue', 'eigenspaces of $T$']]);
        v.readout(() => {
          if (!st) return '';
          if (!st.inv) return `$U$ is not invariant, so $T|_U$ is not an operator on $U$. Drag $n$ until the plane snaps: the invariant planes are exactly those whose normal is an eigenvector of $T^{\\mathrm t}$.`;
          const zsT = zerosMult(v.M, minPoly(v.M, st.T)), zsU = zerosMult(v.M, minPoly(v.M, st.RU));
          const dsum = st.rev.reduce((a, e) => a + e.B.length, 0);
          return `Minimal polynomial of $T$: $${factT(zsT)}$; of $T|_U$: $${factT(zsU)}$, a divisor of it (5.31). ${zsU.every((z) => z.m === 1) ? 'Distinct factors' : 'A repeated factor'}, so $T|_U$ is ${dsum === 2 ? '**diagonalizable** (5.62)' : '**not diagonalizable** — possible only because $T$ itself is not'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.66
    {
      num: '5.66',
      kind: 'Definition',
      name: 'Gershgorin disks',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ and $v_1, \dots, v_n$ is a basis of $V$, and let $A = \mathcal M\bigl(T, (v_1, \dots, v_n)\bigr)$. For $j \in \{1, \dots, n\}$, the $j$th **Gershgorin disk** of $T$ with respect to this basis is
$$\Bigl\{ z \in \mathbf F : |z - A_{j,j}| \le \sum_{k \ne j} |A_{j,k}| \Bigr\}.$$
So $T$ has $n$ Gershgorin disks. When $\mathbf F = \mathbf C$ the $j$th one is the closed disk centred at the diagonal entry $A_{j,j}$ whose radius is the sum of the absolute values of the other entries in row $j$; when $\mathbf F = \mathbf R$ it is a closed interval.`,
      idea: String.raw`Each row of the matrix is read as "a diagonal entry plus a perturbation": the centre is the diagonal entry and the radius measures how big the rest of the row is. If $A$ is diagonal, every radius is $0$ and each disk shrinks to the point $A_{j,j}$, which is an eigenvalue; the disk theorem (5.67) says the eigenvalues can never escape the disks once the off-diagonal entries are switched on. The disks depend on the basis, since the matrix does.`,
      caption: String.raw`Left: drag the centres $A_{1,1}, A_{2,2}, A_{3,3}$ in $\mathbf C$. Right: each off-diagonal entry $A_{j,k}$ is a dot in its own little complex plane; drag it, and its length $|A_{j,k}|$ (the dashed circle) becomes one piece of the radius of disk $j$, drawn as a chain of segments from the centre. Switch to a real matrix: all entries move onto the real axis and the disks become intervals of $\mathbf R$.`,
      deps: ['ladr-5.35'],
      tags: ['eigenvalues'],
      credit: 'Gershgorin, 1931',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gershgorin_circle_theorem' },
      viz(v) {
        const S = v.stage({ x: [-3.4, 4.6], y: [-2.6, 2.6], equal: true, height: 400, weight: 1.35, minWidth: 320, title: 'Gershgorin disks in $\\mathbf C$' });
        const G = v.stage({ x: [0, 3], y: [0, 3], equal: true, axes: false, height: 400, minWidth: 260, title: 'the matrix $A$ (one little $\\mathbf C$ per entry)' });
        const real = v.toggle('real matrix ($\\mathbf F = \\mathbf R$)', false);
        const D0 = [[-1.4, 0.8], [1.3, -0.9], [2.7, 1.1]];
        const OFF0 = { '0,1': [0.5, 0.35], '0,2': [-0.45, 0.4], '1,0': [0.3, -0.55], '1,2': [0.7, 0.25], '2,0': [-0.2, -0.3], '2,1': [0.4, 0.5] };
        const SC = 0.34, RM = 1.25, cellC = (i, j) => [j + 0.5, 2.5 - i];
        const dh = D0.map((p, j) => S.handle(p[0], p[1], { color: EC[j], constrain: (x, y) => [x, real.value ? 0 : y] }));
        const oh = {};
        for (const [key, z] of Object.entries(OFF0)) {
          const [i, j] = key.split(',').map(Number), c = cellC(i, j);
          oh[key] = G.handle(c[0] + SC * z[0], c[1] + SC * z[1], {
            color: EC[i], r: 6, constrain: (x, y) => {
              let a = (x - c[0]) / SC, b = real.value ? 0 : (y - c[1]) / SC; const m = Math.hypot(a, b);
              if (m > RM) { a *= RM / m; b *= RM / m; }
              return [c[0] + SC * a, c[1] + SC * b];
            },
          });
        }
        const entry = (i, j) => { if (i === j) return [dh[i].x, dh[i].y]; const h = oh[`${i},${j}`], c = cellC(i, j); return [(h.x - c[0]) / SC, (h.y - c[1]) / SC]; };
        let st = null;
        v.render(() => {
          if (real.value) { dh.forEach((h) => { h.y = 0; }); for (const k in oh) { const [i, j] = k.split(',').map(Number); oh[k].y = cellC(i, j)[1]; } }
          const A = [0, 1, 2].map((i) => [0, 1, 2].map((j) => entry(i, j)));
          const rad = A.map((r, j) => r.reduce((s, z, k) => s + (k === j ? 0 : Math.hypot(z[0], z[1])), 0));
          // the disks
          A.forEach((r, j) => {
            const [cx, cy] = r[j];
            S.circle(cx, cy, rad[j], { color: EC[j], width: 1.8, fill: EC[j], fillAlpha: real.value ? 0.05 : 0.13, alpha: real.value ? 0.45 : 1 });
            // the radius as a chain of |A_jk|
            const th = [2.3, -0.75, 0.5][j];
            let s0 = 0;
            r.forEach((z, k) => {
              if (k === j) return;
              const m = Math.hypot(z[0], z[1]), a = [cx + s0 * Math.cos(th), cy + s0 * Math.sin(th)], b = [cx + (s0 + m) * Math.cos(th), cy + (s0 + m) * Math.sin(th)];
              S.line(a[0], a[1], b[0], b[1], { color: EC[j], width: 3, dash: s0 > 0 ? [5, 3] : false });
              S.dot(b[0], b[1], { r: 3, color: EC[j] });
              s0 += m;
            });
            if (real.value) {
              const y = -0.32 - 0.28 * j;
              S.line(cx - rad[j], y, cx + rad[j], y, { color: EC[j], width: 4 });
              for (const e of [-1, 1]) { S.line(cx + e * rad[j], y - 0.09, cx + e * rad[j], y + 0.09, { color: EC[j], width: 2 }); S.line(cx + e * rad[j], y, cx + e * rad[j], 0, { color: EC[j], width: 1, dash: [2, 3], alpha: 0.6 }); }
            }
            S.tex(`D_${j + 1}`, cx + rad[j] * Math.cos(th + 0.9) * 0.62, cy + rad[j] * Math.sin(th + 0.9) * 0.62, { color: EC[j], size: 15 });
          });
          // the matrix: little complex planes
          for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
            const [cx, cy] = cellC(i, j);
            G.rect(j + 0.03, 2.03 - i, j + 0.97, 2.97 - i, { color: EC[i], width: 1, alpha: 0.5, fill: EC[i], fillAlpha: i === j ? 0.16 : 0.04 });
            const z = A[i][j];
            if (i === j) {
              G.tex(`A_{${i + 1}${j + 1}}`, cx, cy + 0.2, { color: EC[i], size: 14 });
              G.tex(ctn(z[0], z[1], 1), cx, cy - 0.12, { color: 'ink', size: 13 });
              G.text('centre', cx, cy - 0.36, { align: 'center', size: 10, color: 'muted' });
              continue;
            }
            G.line(cx - 0.42, cy, cx + 0.42, cy, { color: 'faint', width: 0.8 }); G.line(cx, cy - 0.34, cx, cy + 0.34, { color: 'faint', width: 0.8 });
            G.tex(`A_{${i + 1}${j + 1}}`, j + 0.06, 2.94 - i, { color: EC[i], size: 11, align: 'left', baseline: 'top' });
            const m = Math.hypot(z[0], z[1]);
            G.circle(cx, cy, m * SC, { color: EC[i], width: 1, dash: [3, 3], alpha: 0.7 });
            G.line(cx, cy, cx + SC * z[0], cy + SC * z[1], { color: EC[i], width: 2 });
            G.text(`|A${'₁₂₃'[i]}${'₁₂₃'[j]}| = ${pn(m)}`, cx, cy - 0.43, { align: 'center', size: 10, color: 'muted' });
          }
          st = { A, rad };
        });
        v.legend([['blue', 'row 1 → disk $D_1$', { area: true }], ['purple', 'row 2 → $D_2$', { area: true }], ['teal', 'row 3 → $D_3$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { A, rad } = st;
          return A.map((r, j) => `$D_{${j + 1}}$: centre $${ctn(r[j][0], r[j][1])}$, radius $${r.map((z, k) => (k === j ? null : tn(Math.hypot(z[0], z[1])))).filter((x) => x != null).join(' + ')} = ${tn(rad[j])}$`).join(';  ');
        });
      },
    },
    // ------------------------------------------------------------------ 5.67
    {
      num: '5.67',
      kind: 'Theorem',
      name: 'Gershgorin disk theorem',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ and $v_1, \dots, v_n$ is a basis of $V$. Then every eigenvalue of $T$ lies in at least one of the Gershgorin disks of $T$ with respect to $v_1, \dots, v_n$.`,
      idea: String.raw`Let $\lambda$ be an eigenvalue with eigenvector $w = c_1 v_1 + \cdots + c_n v_n$, and pick $j$ with $|c_j|$ as large as possible (so $c_j \ne 0$). Comparing the $v_j$-coefficients of $Tw = \lambda w$ gives $\lambda c_j = \sum_k A_{j,k} c_k$, hence
$$|\lambda - A_{j,j}| = \Bigl|\sum_{k \ne j} A_{j,k} \frac{c_k}{c_j}\Bigr| \le \sum_{k \ne j} |A_{j,k}|,$$
because every ratio $|c_k / c_j|$ is at most $1$. So $\lambda$ lies in disk $j$ — the disk of the eigenvector's largest coordinate.`,
      caption: String.raw`A $4 \times 4$ complex matrix: drag the diagonal entries (the disk centres) and slide the size $t$ of the off-diagonal part. The gold dots are the eigenvalues, computed from the matrix; click one to select it. The bar chart shows the sizes $|c_k|$ of the coordinates of its eigenvector: the tallest bar picks the disk (outlined) that must contain it. At $t = 0$ the eigenvalues sit on the centres; as $t$ grows they wander, but never leave the union of the disks. The column version (Exercise 23) works too.`,
      deps: ['ladr-5.66', 'ladr-5.8'],
      tags: ['eigenvalues'],
      credit: 'Gershgorin, 1931',
      viz(v) {
        const M = v.M, Cx = M.Cx;
        const S = v.stage({ x: [-3.7, 4.3], y: [-3.1, 3.3], equal: true, height: 410, weight: 1.45, minWidth: 330, title: 'disks and eigenvalues in $\\mathbf C$' });
        const B = v.stage({ x: [0.3, 4.7], y: [-0.18, 1.18], axes: false, height: 400, minWidth: 220, title: 'eigenvector coordinates $|c_k|$' });
        const tS = v.slider('off-diagonal size $t$', 0, 2.5, 1.3, { step: 0.02 });
        const mode = v.select('radii from', [{ value: 'r', label: 'rows' }, { value: 'c', label: 'columns' }], 'r');
        let seed = 12, OFF = null;
        const gen = () => { const r = v.rng(seed++); OFF = [0, 1, 2, 3].map(() => [0, 1, 2, 3].map(() => Cx.polar(r.uniform(0.2, 0.75), r.uniform(0, 2 * Math.PI)))); };
        gen();
        v.button('Resample', gen);
        const C4 = ['blue', 'purple', 'teal', 'pink'];
        const dh = [[-1.2, 0.3], [0.2, 1.0], [0.5, -0.8], [1.8, 0.2]].map((p, j) => S.handle(p[0], p[1], { color: C4[j], r: 5.5 }));
        let sel = 0, lams = [];
        S.onClick((x, y) => { let b = -1, bd = 0.35; lams.forEach((z, i) => { const d = Math.hypot(z.re - x, z.im - y); if (d < bd) { bd = d; b = i; } }); if (b >= 0) sel = b; });
        let st = null;
        v.render(() => {
          const t = tS.value, cols = mode.value === 'c';
          const A = [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => (i === j ? new Cx(dh[i].x, dh[i].y) : OFF[i][j].scale(t))));
          const At = A[0].map((_, j) => A.map((r) => r[j])), W = cols ? At : A; // the column version: disks of Aᵗ, same eigenvalues
          const rad = W.map((r, j) => r.reduce((s, z, k) => s + (k === j ? 0 : z.abs()), 0));
          lams = cEigvals(M, A).sort((a, b) => a.re - b.re);
          sel = Math.min(sel, lams.length - 1);
          const lam = lams[sel], w = cNullVec(Cx, W, lam), mags = w.map((z) => z.abs()), jj = mags.indexOf(Math.max(...mags));
          W.forEach((r, j) => S.circle(r[j].re, r[j].im, rad[j], { color: C4[j], width: j === jj ? 3 : 1.4, fill: C4[j], fillAlpha: 0.1 }));
          S.line(W[jj][jj].re, W[jj][jj].im, lam.re, lam.im, { color: 'ink', width: 1.4, dash: [4, 3] });
          const inAll = lams.map((z) => W.some((r, j) => Math.hypot(z.re - r[j].re, z.im - r[j].im) <= rad[j] + 1e-9));
          S.dot(lam.re, lam.im, { r: 12, hollow: true, color: 'ink', width: 1.6 });
          lams.forEach((z, i) => S.dot(z.re, z.im, { r: i === sel ? 7 : 5, color: inAll[i] ? 'gold' : 'red' }));
          S.tex('\\lambda', lam.re, lam.im, { size: 15, dx: 14, dy: -13 });
          // bar chart of |c_k|
          const mx = Math.max(...mags);
          mags.forEach((m, k) => {
            const h = m / mx;
            B.rect(k + 0.62, 0, k + 1.38, h, { fill: C4[k], fillAlpha: k === jj ? 0.55 : 0.2, color: C4[k], width: k === jj ? 2.4 : 1 });
            B.tex(`|c_${k + 1}|`, k + 1, -0.08, { size: 13, color: C4[k] });
            B.text(pn(h, 2), k + 1, h + 0.05, { align: 'center', size: 11, color: k === jj ? 'ink' : 'muted', weight: k === jj ? 700 : 500 });
          });
          B.line(0.45, 0, 4.55, 0, { color: 'muted', width: 1 });
          B.text(`largest: k = ${jj + 1} → disk ${jj + 1}`, 2.5, 1.12, { align: 'center', size: 12.5, weight: 700, color: C4[jj] });
          st = { lam, jj, d: Math.hypot(lam.re - W[jj][jj].re, lam.im - W[jj][jj].im), r: rad[jj], ok: inAll.every(Boolean), n: lams.length, cols, lams };
        });
        v.legend([['gold', 'eigenvalues (click one)', { dot: true }], ['ink', 'selected $\\lambda$ to the centre of its disk', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { lam, jj, d, r, ok, cols, lams } = st;
          return `Eigenvalues ${lams.map((z) => `$${ctn(z.re, z.im)}$`).join(', ')} — ${ok ? 'all inside the union of the disks ✓' : '**one is outside!**'}. Selected $\\lambda = ${ctn(lam.re, lam.im)}$: ${cols ? 'its eigenvector for $A^{\\mathrm t}$' : 'its eigenvector'} has largest coordinate $c_{${jj + 1}}$, so $|\\lambda - A_{${jj + 1},${jj + 1}}| = ${tn(d, 3)} \\le ${tn(r, 3)} = $ radius of disk ${jj + 1}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.71
    {
      num: '5.71',
      kind: 'Definition',
      name: 'Commuting operators and matrices',
      statement: String.raw`Two operators $S, T$ on the same vector space **commute** if $ST = TS$. Two square matrices $A, B$ of the same size **commute** if $AB = BA$.`,
      idea: String.raw`$ST$ means "first $T$, then $S$", so commuting means the order of the two actions does not matter. Some pairs always commute: $\lambda I$ commutes with every operator, and any two polynomials $p(T), q(T)$ in one operator commute (5.17). But commuting is rare — a random pair of matrices almost never commutes; Axler reports that only about $0.3\%$ of the pairs of $2 \times 2$ matrices with integer entries in $[-5, 5]$ do.`,
      caption: String.raw`A commutative square. The F in the top-left corner is moved along the top and right edges (first $S$, then $T$: the blue F is $TS(\mathrm F)$) and along the left and bottom edges (first $T$, then $S$: the orange outline is $ST(\mathrm F)$). Pick $S$ and $T$, and the angle $\theta$ for rotations: the two F's in the bottom-right corner coincide exactly when $ST = TS$. Try two rotations, a rotation with a scaling, and a rotation with a reflection.`,
      deps: ['ladr-5.1'],
      tags: ['commuting'],
      viz(v) {
        const M = v.M;
        const MAPS = {
          rot: { label: 'rotate by $\\theta$' }, refl: { label: 'reflect', A: [[1, 0], [0, -1]] }, str: { label: 'stretch', A: [[1.6, 0], [0, 1]] },
          shear: { label: 'shear', A: [[1, 0.8], [0, 1]] }, sc: { label: 'scale by 1.4', A: [[1.4, 0], [0, 1.4]] },
        };
        const opts = Object.entries(MAPS).map(([value, m]) => ({ value, label: m.label }));
        const sS = v.select('$S$', opts, 'rot'), tS = v.select('$T$', opts, 'str');
        const th = v.slider('$\\theta$', -180, 180, 90, { step: 5, fmt: (x) => `${x}°` });
        const P = v.stage({ x: [0, 12], y: [-0.05, 6.45], equal: true, axes: false, height: 450, full: true });
        const mat = (k) => { if (k !== 'rot') return MAPS[k].A; const a = (th.value * Math.PI) / 180; return [[Math.cos(a), -Math.sin(a)], [Math.sin(a), Math.cos(a)]]; };
        const BX = { tl: [2.2, 4.85], tr: [9.8, 4.85], bl: [2.2, 1.35], br: [9.8, 1.35] }, H = 1.25, K = H / 2.3, FB = FSH.map(([x, y]) => [1.3 * x, 1.3 * y]);
        const loc = (b, p) => [BX[b][0] + K * p[0], BX[b][1] + K * p[1]];
        const clip = (b, f) => {
          const [cx, cy] = BX[b], c = P.ctx; c.save(); c.beginPath();
          c.rect(P.X(cx - H), P.Y(cy + H), P.X(cx + H) - P.X(cx - H), P.Y(cy - H) - P.Y(cy + H)); c.clip(); f(); c.restore();
        };
        const box = (b, title) => {
          const [cx, cy] = BX[b];
          clip(b, () => { for (let k = -2; k <= 2; k++) { P.line(...loc(b, [k, -2.5]), ...loc(b, [k, 2.5]), { color: 'grid', width: k ? 0.8 : 1.4 }); P.line(...loc(b, [-2.5, k]), ...loc(b, [2.5, k]), { color: 'grid', width: k ? 0.8 : 1.4 }); } });
          P.rect(cx - H, cy - H, cx + H, cy + H, { color: 'muted', width: 1 });
          P.tex(title, cx, cy + H + 0.17, { size: 13, color: 'muted' });
        };
        const shape = (b, A, st) => clip(b, () => P.poly(FB.map((p) => loc(b, ap2(A, p))), st));
        let st = null;
        v.render(() => {
          const A = mat(sS.value), B = mat(tS.value), I2 = [[1, 0], [0, 1]];
          const TS = M.matMul(B, A), ST = M.matMul(A, B), diff = maxAbs(msub(ST, TS)), eq = diff < 1e-9;
          th.el.hidden = sS.value !== 'rot' && tS.value !== 'rot';
          box('tl', '\\mathrm F'); box('tr', 'S(\\mathrm F)'); box('bl', 'T(\\mathrm F)'); box('br', 'TS(\\mathrm F) \\text{ and } ST(\\mathrm F)');
          shape('tl', I2, { color: 'ink', width: 1.5, fill: 'muted', fillAlpha: 0.2 });
          shape('tr', A, { color: 'accent', width: 1.5, fill: 'accent', fillAlpha: 0.12 });
          shape('bl', B, { color: 'orange', width: 1.5, fill: 'orange', fillAlpha: 0.12 });
          shape('br', TS, { color: 'accent', width: 2, fill: 'accent', fillAlpha: 0.2 });
          shape('br', ST, { color: eq ? 'green' : 'orange', width: 2.4, dash: [6, 4] });
          // arrows of the square
          const arr = (p, q, lab, col, side) => { P.arrow(p[0], p[1], q[0], q[1], { color: col, width: 2, head: 9 }); P.tex(lab, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, { color: col, size: 17, dx: side[0], dy: side[1] }); };
          arr([BX.tl[0] + H + 0.15, BX.tl[1]], [BX.tr[0] - H - 0.15, BX.tr[1]], 'S', 'accent', [0, -14]);
          arr([BX.tr[0], BX.tr[1] - H - 0.1], [BX.br[0], BX.br[1] + H + 0.42], 'T', 'accent', [16, 0]);
          arr([BX.tl[0], BX.tl[1] - H - 0.1], [BX.bl[0], BX.bl[1] + H + 0.42], 'T', 'orange', [-16, 0]);
          arr([BX.bl[0] + H + 0.15, BX.bl[1]], [BX.br[0] - H - 0.15, BX.br[1]], 'S', 'orange', [0, 14]);
          P.tex(`TS = ${mtex(TS)}`, 6, 3.75, { size: 15, color: 'accent' });
          P.tex(`ST = ${mtex(ST)}`, 6, 2.45, { size: 15, color: eq ? 'green' : 'orange' });
          P.text(eq ? 'ST = TS: they commute' : 'ST ≠ TS: they do not commute', 6, 3.1, { align: 'center', size: 13.5, weight: 700, color: eq ? 'green' : 'red' });
          st = { diff, eq };
        });
        v.legend([['accent', '$TS(\\mathrm F)$: $S$ first', { area: true }], ['orange', '$ST(\\mathrm F)$: $T$ first', { dash: true }]]);
        v.readout(() => st && (st.eq ? `$ST - TS = 0$: the two routes around the square end at the same F.` : `$ST - TS \\ne 0$ (largest entry ${tn(st.diff, 3)}): the order of the two maps matters.`));
      },
    },
    // ------------------------------------------------------------------ 5.74
    {
      num: '5.74',
      kind: 'Theorem',
      name: 'Commuting operators ⟺ commuting matrices',
      statement: String.raw`Suppose $S, T \in \mathcal L(V)$ and $v_1, \dots, v_n$ is a basis of $V$. Then $S$ and $T$ commute if and only if $\mathcal M\bigl(S, (v_1, \dots, v_n)\bigr)$ and $\mathcal M\bigl(T, (v_1, \dots, v_n)\bigr)$ commute.`,
      idea: String.raw`Taking matrices in a fixed basis is an injective, linear and multiplicative operation: $\mathcal M(ST) = \mathcal M(S)\mathcal M(T)$ (3.43), and $\mathcal M$ is an isomorphism from $\mathcal L(V)$ onto $\mathbf F^{n,n}$ (3.71). So $ST = TS \iff \mathcal M(ST) = \mathcal M(TS) \iff \mathcal M(S)\mathcal M(T) = \mathcal M(T)\mathcal M(S)$. In particular, whether the matrices commute does not depend on the basis — although the matrices themselves do.`,
      caption: String.raw`Drag the basis vectors $v_1, v_2$ of $\mathbf R^2$. The two operators $S, T$ stay fixed (their action on the F, left, does not care about the basis), but their matrices on the right change with every move. The bottom matrix is $\mathcal M(S)\mathcal M(T) - \mathcal M(T)\mathcal M(S)$, the matrix of $ST - TS$: for a commuting pair it is $0$ in every basis; for a non-commuting pair its entries change but it is never $0$. Make $v_1, v_2$ parallel and there is no basis at all.`,
      deps: ['ladr-5.71', 'ladr-3.43', 'ladr-3.71'],
      tags: ['commuting'],
      viz(v) {
        const M = v.M;
        const S0 = [[0.9, -0.6], [0.5, 0.8]], S2 = M.matMul(S0, S0);
        const PAIRS = { c: { S: S0, T: S2.map((r, i) => r.map((x, j) => x - 0.5 * S0[i][j] + (i === j ? 0.4 : 0))) }, n: { S: S0, T: [[0.9, 0.7], [0.1, -0.6]] } };
        const FB = FSH.map(([x, y]) => [1.4 * x, 1.4 * y]);
        const pair = v.select('', [{ value: 'c', label: 'commuting: $T = S^2 - 0.5S + 0.4I$' }, { value: 'n', label: 'not commuting' }], 'c');
        const P = v.stage({ x: [-2.6, 2.6], y: [-2.4, 2.4], equal: true, axes: false, height: 400, weight: 1.15, minWidth: 300, title: 'the basis grid; the F moved by $ST$ and by $TS$' });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, minWidth: 280 });
        const h1 = P.handle(1, 0.25, { color: 'blue', label: 'v₁' }), h2 = P.handle(0.35, 1, { color: 'purple', label: 'v₂' });
        const TA = v.table(Q, { rows: 2, cols: 2, region: [0, 0.52, 0.5, 0.92], maxCell: 50, size: 13.5 }), TB = v.table(Q, { rows: 2, cols: 2, region: [0.5, 0.52, 1, 0.92], maxCell: 50, size: 13.5 });
        const TC = v.table(Q, { rows: 2, cols: 2, region: [0.15, 0.02, 0.85, 0.4], maxCell: 54, size: 14 });
        const ttl = (T, tex, col) => { const g = T.geo; if (g) Q.texPx(tex, g.X0 + (g.cols * g.cw) / 2, g.Y0 - 15, { color: col, size: 13.5 }); };
        let st = null;
        v.render(() => {
          const { S, T } = PAIRS[pair.value], b1 = [h1.x, h1.y], b2 = [h2.x, h2.y], Pm = [[b1[0], b2[0]], [b1[1], b2[1]]], dt = M.det(Pm);
          for (let k = -6; k <= 6; k++) {
            P.line(k * b1[0] - 6 * b2[0], k * b1[1] - 6 * b2[1], k * b1[0] + 6 * b2[0], k * b1[1] + 6 * b2[1], { color: k ? 'blue' : 'purple', width: k ? 1 : 1.6, alpha: k ? 0.2 : 0.45 });
            P.line(-6 * b1[0] + k * b2[0], -6 * b1[1] + k * b2[1], 6 * b1[0] + k * b2[0], 6 * b1[1] + k * b2[1], { color: k ? 'purple' : 'blue', width: k ? 1 : 1.6, alpha: k ? 0.2 : 0.45 });
          }
          const ST = M.matMul(S, T), TS = M.matMul(T, S);
          P.poly(FB, { color: 'muted', width: 1, fill: 'muted', fillAlpha: 0.12 });
          P.poly(FB.map((p) => ap2(ST, p)), { color: 'accent', width: 2, fill: 'accent', fillAlpha: 0.18 });
          P.poly(FB.map((p) => ap2(TS, p)), { color: 'orange', width: 2.2, dash: [6, 4] });
          P.arrow(0, 0, b1[0], b1[1], { color: 'blue', width: 2.6 }); P.arrow(0, 0, b2[0], b2[1], { color: 'purple', width: 2.6 });
          const ok = Math.abs(dt) > 0.04;
          if (ok) {
            const Pi = M.inverse(Pm), MS = M.matMul(Pi, M.matMul(S, Pm)), MT = M.matMul(Pi, M.matMul(T, Pm)), C = msub(M.matMul(MS, MT), M.matMul(MT, MS));
            const zero = maxAbs(C) < 1e-9;
            TA.draw({ value: (i, j) => MS[i][j], format: (x) => pn(x) }); TB.draw({ value: (i, j) => MT[i][j], format: (x) => pn(x) });
            TC.draw({ value: (i, j) => C[i][j], format: (x) => pn(Math.abs(x) < 5e-10 ? 0 : x), fill: () => [zero ? 'green' : 'red', 0.14] });
            ttl(TA, '\\mathcal M(S)', 'ink'); ttl(TB, '\\mathcal M(T)', 'ink'); ttl(TC, '\\mathcal M(S)\\mathcal M(T) - \\mathcal M(T)\\mathcal M(S)', zero ? 'green' : 'red');
            st = { ok, zero, C, MS, MT };
          } else {
            Q.text('v₁, v₂ are not a basis:', 0.5, 0.55, { align: 'center', size: 13.5, color: 'red', weight: 600 });
            Q.text('no matrices at all', 0.5, 0.47, { align: 'center', size: 13.5, color: 'red', weight: 600 });
            st = { ok };
          }
        });
        v.legend([['muted', 'F', { area: true }], ['accent', '$ST(\\mathrm F)$', { area: true }], ['orange', '$TS(\\mathrm F)$', { dash: true }], ['blue', 'basis $v_1, v_2$ and its grid']]);
        v.readout(() => {
          if (!st) return '';
          if (!st.ok) return 'The two vectors are (nearly) parallel: they are not a basis, so the matrices are undefined.';
          return st.zero ? `In this basis $\\mathcal M(S)\\mathcal M(T) - \\mathcal M(T)\\mathcal M(S) = 0$, and it stays $0$ wherever you drag the basis: it is the matrix of $ST - TS = 0$.` : `In this basis the commutator matrix is $${mtex(st.C)}$; drag the basis and it changes (it is $P^{-1}(ST - TS)P$ for the change of basis $P$), but it can never become $0$ because $ST - TS \\ne 0$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.75
    {
      num: '5.75',
      kind: 'Theorem',
      name: 'Eigenspace is invariant under a commuting operator',
      statement: String.raw`Suppose $S, T \in \mathcal L(V)$ commute and $\lambda \in \mathbf F$. Then $E(\lambda, S)$ is invariant under $T$.`,
      idea: String.raw`If $Sv = \lambda v$, then $S(Tv) = (ST)v = (TS)v = T(Sv) = T(\lambda v) = \lambda\,Tv$, so $Tv$ is again in $E(\lambda, S)$. This one-line computation is the reason commuting operators behave so well together: each eigenspace of one is a stage on which the other acts by itself (5.76, 5.78).`,
      caption: String.raw`$S$ has the eigenspace $E(2, S)$ (a plane) and $E(-1, S)$ (a line) in $\mathbf R^3$. Drag the gold vector $v$ inside the chosen eigenspace: for an operator $T$ that commutes with $S$, the arrow $Tv$ (green) stays in that eigenspace, and so does the image of a whole circle of the plane (the green curve). Raise $\varepsilon$ to add a non-commuting part to $T$: $Tv$ tilts out (red), with the drop to the eigenspace showing by how much.`,
      deps: ['ladr-5.71', 'ladr-5.52', 'ladr-5.2'],
      tags: ['commuting', 'invariant subspaces'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2.3, 2.3], y: [-2.1, 2.2], equal: true, axes: false, height: 420, minWidth: 340 });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.3, axis: 1.6 });
        const SM = conj(M, QM, [[2, 0, 0], [0, 2, 0], [0, 0, -1]]);
        const T0 = conj(M, QM, [[0.6, -0.9, 0], [0.8, 1.1, 0], [0, 0, 1.3]]), PERT = conj(M, QM, [[0, 0, 0.8], [0, 0, -0.5], [0.9, 0.6, 0]]);
        const PL = orthN([QB[0], QB[1]]), LN = [unit3(QB[2])];
        const which = v.select('eigenspace', [{ value: 'p', label: '$E(2, S)$, a plane' }, { value: 'l', label: '$E(-1, S)$, a line' }], 'p');
        const eps = v.slider('non-commuting part $\\varepsilon$', 0, 1, 0, { step: 0.02 });
        const hp = sc.handle(add3(mul3(PL[0], 0.9), mul3(PL[1], 0.6)), { mode: 'plane', a: PL[0], b: PL[1], color: 'gold', label: 'v', lim: 1.3 });
        const hl = sc.handle(mul3(LN[0], 0.7), { mode: 'line', d: LN[0], color: 'gold', label: 'v', labelPos: 'w', lim: 1.2 });
        let st = null;
        v.render(() => {
          const T = T0.map((r, i) => r.map((x, j) => x + eps.value * PERT[i][j])), lamS = which.value === 'p' ? 2 : -1, E = which.value === 'p' ? PL : LN;
          hp.h.visible = which.value === 'p'; hl.h.visible = which.value === 'l';
          const x = which.value === 'p' ? hp.p : hl.p, Tx = ap(T, x), pr = projOnto(Tx, E), dist = len3(sub3(Tx, pr)), inv = dist < 1e-9;
          const comm = maxAbs(msub(M.matMul(SM, T), M.matMul(T, SM)));
          sc.begin();
          drawSub(sc, PL, 'blue', { r: 1.45, fillAlpha: which.value === 'p' ? 0.15 : 0.05, edge: which.value === 'p' ? 0.6 : 0.25 });
          drawSub(sc, LN, 'purple', { len: 1.7, alpha: which.value === 'l' ? 0.55 : 0.25 });
          if (which.value === 'p') {
            const rim = []; for (let i = 0; i <= 72; i++) { const t = (2 * Math.PI * i) / 72; rim.push(ap(T, add3(mul3(PL[0], 0.55 * Math.cos(t)), mul3(PL[1], 0.55 * Math.sin(t))))); }
            sc.path(rim, { color: inv ? 'green' : 'red', width: 1.8, dash: [5, 4] });
          }
          if (!inv) { sc.line(Tx, pr, { color: 'red', width: 1.4, dash: [3, 3] }); sc.dot(pr, { r: 3, color: 'red' }); }
          sc.arrow(ZERO, Tx, { color: inv ? 'green' : 'red', width: 3 });
          sc.arrow(ZERO, x, { color: 'gold', width: 3 });
          sc.tex('Tv', Tx, { color: inv ? 'green' : 'red', size: 15, dx: 16, dy: -10 });
          sc.tex('E(2,S)', subLabelAt(sc, PL, { r: 1.45, side: 'left' }), { color: 'blue', size: 14, dx: -30 });
          sc.tex('E(-1,S)', subLabelAt(sc, LN, { len: 1.7, low: true }), { color: 'purple', size: 14, dy: 14 });
          sc.flush();
          S.corner(comm < 1e-9 ? 'ST = TS' : `ST ≠ TS (largest entry of ST − TS: ${pn(comm, 2)})`, 'tl', { color: comm < 1e-9 ? 'green' : 'red', weight: 700 });
          const STx = ap(SM, Tx);
          st = { dist, comm, lamS, err: len3(sub3(STx, mul3(Tx, lamS))) };
        });
        v.legend([['gold', '$v \\in E(\\lambda, S)$'], ['green', '$Tv$, inside the eigenspace'], ['red', '$Tv$ leaving it (non-commuting $T$)']]);
        v.readout(() => st && `With $\\lambda = ${st.lamS}$: $S(Tv) - \\lambda\\,Tv$ has length $${st.comm < 1e-9 ? v.sci(st.err, 1) : tn(st.err, 3)}$ and $Tv$ is at distance $${st.dist < 1e-9 ? '0' : tn(st.dist, 3)}$ from $E(${st.lamS}, S)$: ${st.comm < 1e-9 ? 'since $ST = TS$, $S(Tv) = T(Sv) = \\lambda\\,Tv$ — **invariant**.' : 'without commutativity the eigenspace is **not** invariant.'}`);
      },
    },
  ],
};
