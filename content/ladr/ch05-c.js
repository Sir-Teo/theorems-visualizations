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
          for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) if (Math.abs(L[a] - L[b]) < 1e-9) R.text(`λ${'₁₂₃'[a]} = λ${'₁₂₃'[b]}`, L[a], LY + 0.115, { align: 'center', size: 12, weight: 700, color: 'red' });
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
      idea: String.raw`If $v_1, \dots, v_n$ is an eigenbasis and $\lambda_1, \dots, \lambda_m$ are the distinct eigenvalues, then $(T - \lambda_1 I)\cdots(T - \lambda_m I)$ kills every $v_j$, so it is $0$; the minimal polynomial divides this product (5.29) and has every $\lambda_k$ as a zero (5.27), so it equals it. Conversely, induct on $m$: $\operatorname{range}(T - \lambda_m I)$ is invariant (5.18), and $T$ restricted to it is killed by the first $m-1$ factors, so it has an eigenbasis by induction. A vector in $\operatorname{range}(T - \lambda_m I) \cap \operatorname{null}(T - \lambda_m I)$ is multiplied by $\prod_{k<m}(\lambda_m - \lambda_k) \ne 0$ and sent to $0$, so the intersection is $\{0\}$; by 1.46, 3.94 and 3.21 the range and the null space are complementary, and their eigenbases together form one for $V$.`,
      caption: String.raw`$T$ is the operator on $\mathbf R^3$ with matrix $\begin{bmatrix} 2 & s & 0 \\ 0 & \lambda & 0 \\ 0 & 0 & 3\end{bmatrix}$ in a tilted basis. Its minimal polynomial is computed from the powers of $T$ (right). The picture shows $\operatorname{null}(T - \mu I)$ (green) and $\operatorname{range}(T - \mu I)$ (orange) for the chosen eigenvalue $\mu$ — the two pieces of the proof. With $\lambda \ne 2$, or with $s = 0$, they are complementary and the factors are distinct. Set $\lambda = 2$ with $s \ne 0$: the factor $z - 2$ repeats, the null line falls *inside* the range plane (red), and no eigenbasis exists.`,
      deps: ['ladr-5.29', 'ladr-5.27', 'ladr-5.18', 'ladr-1.46', 'ladr-3.94', 'ladr-3.21'],
      tags: ['diagonalization', 'minimal polynomial'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2.3, 2.3], y: [-2.1, 2.2], equal: true, axes: false, height: 400, weight: 1.3, minWidth: 320 });
        const sc = v.scene3(S, { yaw: -1.0, pitch: 0.42, axis: 1.6 });
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
          // how a line sits relative to a plane: drop its tip onto the plane (the drop has length 0 exactly when the line lies in it)
          const [Ln, Pl, lc] = N.length === 1 && Rg.length === 2 ? [N[0], Rg, 'green'] : N.length === 2 && Rg.length === 1 ? [Rg[0], N, 'orange'] : [null];
          if (Ln && !interB.length) {
            const tip = mul3(Ln, sc.P(Ln)[1] >= 0 ? 1.45 : -1.45), q = projOnto(tip, Pl);
            sc.line(tip, q, { color: lc, width: 1.4, dash: [4, 3] }); sc.line(ZERO, q, { color: lc, width: 1.4, dash: [4, 3], alpha: 0.7 }); sc.dot(q, { r: 3.5, color: lc });
          }
          if (interB.length === 1) sc.line(mul3(interB[0], -1.65), mul3(interB[0], 1.65), { color: 'red', width: 2.6, bias: -0.02 }, 16);
          if (Rg.length && Rg.length < 3) sc.tex(`\\operatorname{range}(T - ${m}I)`, subLabelAt(sc, Rg, { r: 1.5, len: 1.65, low: true }), { color: 'orange', size: 14, dy: 16 });
          if (N.length && N.length < 3) sc.tex(`\\operatorname{null}(T - ${m}I)`, subLabelAt(sc, N, { r: 1.35, len: 1.65 }), { color: 'green', size: 14, align: 'left', dx: 10, dy: -4 });
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
            R.circle(0, 0, 0.45, { color: 'muted', width: 1.2 });
            R.curve((t) => ap2(RU, [0.45 * Math.cos(t), 0.45 * Math.sin(t)]), 0, 2 * Math.PI, { color: 'green', width: 1.6, fill: 'green', fillAlpha: 0.07, n: 120 });
            const dsum = rev.reduce((a, e) => a + e.B.length, 0);
            rev.forEach((e) => {
              if (e.B.length === 2) { R.rect(-9, -9, 9, 9, { fill: 'gold', fillAlpha: 0.06, stroke: false }); return; }
              const b = e.B[0]; R.line(-5 * b[0], -5 * b[1], 5 * b[0], 5 * b[1], { color: 'gold', width: 3, alpha: 0.55 });
              const s = b[1] < -0.05 || (Math.abs(b[1]) <= 0.05 && b[0] < 0) ? -1 : 1; R.tex(`\\lambda = ${tn(e.lam)}`, 1.6 * b[0] * s, 1.6 * b[1] * s, { color: 'gold', size: 14, dx: 14 * Math.abs(b[1]), dy: -13 * Math.abs(b[0]) });
            });
            R.corner(dsum === 2 ? 'eigenbasis of U found inside U' : 'only one eigen-direction in U', 'tl', { color: dsum === 2 ? 'green' : 'red', weight: 700 });
            R.tex(`\\mathcal M(T|_U) = ${mtex(RU)}`, 0, -1.82, { size: 13.5 });
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
            const th = real.value ? 0 : [2.3, -0.75, 0.5][j], y0 = real.value ? -0.32 - 0.28 * j : cy;
            let s0 = 0;
            r.forEach((z, k) => {
              if (k === j) return;
              const m = Math.hypot(z[0], z[1]), a = [cx + s0 * Math.cos(th), y0 + s0 * Math.sin(th)], b = [cx + (s0 + m) * Math.cos(th), y0 + (s0 + m) * Math.sin(th)];
              S.line(a[0], a[1], b[0], b[1], { color: EC[j], width: 3, dash: s0 > 0 ? [5, 3] : false });
              S.dot(b[0], b[1], { r: 3, color: EC[j] });
              s0 += m;
            });
            if (real.value) {
              const y = -0.32 - 0.28 * j;
              S.line(cx - rad[j], y, cx + rad[j], y, { color: EC[j], width: 4, alpha: 0.45 });
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
          return A.map((r, j) => `$D_{${j + 1}}$: centre $${ctn(r[j][0], r[j][1])}$, radius $${r.map((z, k) => (k === j ? null : tn(Math.hypot(z[0], z[1])))).filter((x) => x != null).join(' + ')} = ${tn(rad[j])}$${real.value ? `, i.e. the interval $[${tn(r[j][0] - rad[j])}, ${tn(r[j][0] + rad[j])}]$` : ''}`).join(';  ');
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
      idea: String.raw`$ST$ means "first $T$, then $S$", so commuting means the order of the two actions does not matter. Some pairs always commute: $\lambda I$ commutes with every operator, and any two polynomials $p(T), q(T)$ in one operator commute (5.17). But commuting is rare: of the $11^8$ ordered pairs of $2 \times 2$ matrices with integer entries in $[-5, 5]$, only $674{,}609$ — about $0.3\%$ — commute.`,
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
        const h1 = P.handle(1.45, 0.35, { color: 'blue', label: 'v₁' }), h2 = P.handle(-0.5, 1.25, { color: 'purple', label: 'v₂' });
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
    // ------------------------------------------------------------------ 5.76
    {
      num: '5.76',
      kind: 'Theorem',
      name: 'Simultaneous diagonalizability ⟺ commutativity',
      statement: String.raw`Two diagonalizable operators on the same vector space have diagonal matrices with respect to one and the same basis if and only if they commute.`,
      idea: String.raw`Diagonal matrices of the same size commute, so operators that are diagonal in a common basis commute (5.74). Conversely, let $S, T$ be diagonalizable and commute, and let $\lambda_1, \dots, \lambda_m$ be the distinct eigenvalues of $S$. Then $V = E(\lambda_1, S) \oplus \cdots \oplus E(\lambda_m, S)$ (5.55), each $E(\lambda_k, S)$ is invariant under $T$ (5.75), and $T$ restricted to it is diagonalizable (5.65). An eigenbasis of each restriction consists of vectors that are eigenvectors of $T$ and (being in $E(\lambda_k, S)$) of $S$; together they form a basis of $V$ in which both matrices are diagonal.`,
      caption: String.raw`$S$ is fixed (its eigen-axes are blue). Drag the tips $Te_1, Te_2$ to choose $T$; they snap when $T$ commutes with $S$. The orange lines are $T$'s eigen-axes, and the thin orange grid is the image under $T$ of the blue grid. While $ST = TS$ the axes coincide, the grid is only stretched along its own lines, and both matrices on the right are diagonal in one basis. Pull a tip away: the axes split and $\mathcal M(T)$ fills in. With $S = 1.5I$ every $T$ commutes, and the common basis is simply an eigenbasis of $T$.`,
      deps: ['ladr-5.74', 'ladr-5.55', 'ladr-5.75', 'ladr-5.65'],
      tags: ['commuting', 'diagonalization'],
      viz(v) {
        const M = v.M;
        const ang = (d) => [Math.cos((d * Math.PI) / 180), Math.sin((d * Math.PI) / 180)];
        const P0 = M.transpose([ang(18), ang(105)]);
        const SS = { d: M.matMul(M.matMul(P0, [[2, 0], [0, 0.6]]), M.inverse(P0)), s: [[1.5, 0], [0, 1.5]] };
        const which = v.select('$S$', [{ value: 'd', label: 'eigenvalues $2, 0.6$' }, { value: 's', label: '$S = 1.5I$' }], 'd');
        const P = v.stage({ x: [-2.8, 2.8], y: [-2.4, 2.4], equal: true, axes: false, height: 400, weight: 1.3, minWidth: 320 });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, minWidth: 250 });
        const T0 = SS.d.map((r, i) => r.map((x, j) => -0.6 * x + (i === j ? 1.8 : 0)));
        // snap T onto the commutant span{I, S} (Frobenius projection) when it is close
        const snapT = (T) => {
          const S = SS[which.value]; if (which.value === 's') return T;
          const B = orthN([[1, 0, 0, 1], S.flat()]), t = T.flat(), pr = B.reduce((acc, e) => acc.map((c, i) => c + e[i] * t.reduce((s, x, k) => s + x * e[k], 0)), [0, 0, 0, 0]);
          return Math.hypot(...t.map((x, i) => x - pr[i])) < 0.13 ? [[pr[0], pr[1]], [pr[2], pr[3]]] : T;
        };
        const h1 = P.handle(T0[0][0], T0[1][0], { color: 'orange', label: 'Te₁', constrain: (x, y) => { const T = snapT([[x, h2.x], [y, h2.y]]); h2.x = T[0][1]; h2.y = T[1][1]; return [T[0][0], T[1][0]]; } });
        const h2 = P.handle(T0[0][1], T0[1][1], { color: 'orange', label: 'Te₂', constrain: (x, y) => { const T = snapT([[h1.x, x], [h1.y, y]]); h1.x = T[0][0]; h1.y = T[1][0]; return [T[0][1], T[1][1]]; } });
        const TA = v.table(Q, { rows: 2, cols: 2, region: [0.05, 0.5, 0.95, 0.86], maxCell: 52, size: 14 }), TB = v.table(Q, { rows: 2, cols: 2, region: [0.05, 0.04, 0.95, 0.4], maxCell: 52, size: 14 });
        const ttl = (T, tex, col) => { const g = T.geo; if (g) Q.texPx(tex, g.X0 + (g.cols * g.cw) / 2, g.Y0 - 15, { color: col, size: 14 }); };
        let st = null;
        v.render(() => {
          const S = SS[which.value], T = [[h1.x, h2.x], [h1.y, h2.y]];
          const comm = maxAbs(msub(M.matMul(S, T), M.matMul(T, S))), ok = comm < 1e-9;
          const eS = eigenspaces(M, S).list, eT = eigenspaces(M, T);
          // a basis to show the matrices in: a common eigenbasis if there is one, else S's eigenbasis (or T's when S is scalar)
          let B = null, common = false;
          const tB = eT.list.flatMap((e) => e.B), sB = eS.flatMap((e) => e.B);
          if (ok && tB.length === 2) { B = which.value === 's' || eS.length === 1 ? tB : sB; common = true; }
          else B = which.value === 's' ? (tB.length === 2 ? tB : [[1, 0], [0, 1]]) : sB;
          // S's eigen-grid and its image under T
          if (which.value === 'd') {
            const [a, b] = sB;
            for (let k = -5; k <= 5; k++) {
              P.line(k * a[0] - 6 * b[0], k * a[1] - 6 * b[1], k * a[0] + 6 * b[0], k * a[1] + 6 * b[1], { color: 'blue', width: 1, alpha: 0.13 });
              P.line(-6 * a[0] + k * b[0], -6 * a[1] + k * b[1], 6 * a[0] + k * b[0], 6 * a[1] + k * b[1], { color: 'blue', width: 1, alpha: 0.13 });
              const Ta = ap2(T, a), Tb = ap2(T, b);
              P.line(k * Ta[0] - 6 * Tb[0], k * Ta[1] - 6 * Tb[1], k * Ta[0] + 6 * Tb[0], k * Ta[1] + 6 * Tb[1], { color: 'orange', width: 0.8, alpha: 0.3 });
              P.line(-6 * Ta[0] + k * Tb[0], -6 * Ta[1] + k * Tb[1], 6 * Ta[0] + k * Tb[0], 6 * Ta[1] + k * Tb[1], { color: 'orange', width: 0.8, alpha: 0.3 });
            }
            eS.forEach((e) => { const u = e.B[0]; P.line(-6 * u[0], -6 * u[1], 6 * u[0], 6 * u[1], { color: 'blue', width: 5, alpha: 0.35 }); const s = u[0] < 0 ? -1 : 1; P.tex(`E(${tn(e.lam)}, S)`, 2.15 * u[0] * s, 2.15 * u[1] * s, { color: 'blue', size: 13.5, dx: 34 * Math.abs(u[1]), dy: -13 * Math.abs(u[0]) }); });
          } else { P.rect(-9, -9, 9, 9, { fill: 'blue', fillAlpha: 0.05, stroke: false }); P.corner('S = 1.5 I: every nonzero vector is an eigenvector of S', 'tl', { color: 'blue', weight: 600 }); }
          P.dot(0, 0, { r: 3, color: 'ink' });
          eT.list.forEach((e) => e.B.length === 1 && P.line(-6 * e.B[0][0], -6 * e.B[0][1], 6 * e.B[0][0], 6 * e.B[0][1], { color: 'orange', width: 2, dash: [7, 5] }));
          P.arrow(0, 0, h1.x, h1.y, { color: 'orange', width: 2.2 }); P.arrow(0, 0, h2.x, h2.y, { color: 'orange', width: 2.2 });
          if (eT.nonreal) P.corner('T has no real eigenvectors', which.value === 'd' ? 'tl' : 'bl', { color: 'red', weight: 700 });
          else if (which.value === 'd') P.corner(ok ? 'ST = TS: the eigen-axes coincide' : 'ST ≠ TS: the eigen-axes split', 'tl', { color: ok ? 'green' : 'red', weight: 700 });
          const Bm = M.transpose(B), Bi = M.inverse(Bm), MS = M.matMul(Bi, M.matMul(S, Bm)), MT = M.matMul(Bi, M.matMul(T, Bm));
          const offT = Math.max(Math.abs(MT[0][1]), Math.abs(MT[1][0])), offS = Math.max(Math.abs(MS[0][1]), Math.abs(MS[1][0]));
          const cell = (X, off) => (i, j) => (i === j ? ['green', 0.14] : Math.abs(X[i][j]) < 1e-9 ? null : ['red', 0.18]);
          TA.draw({ value: (i, j) => MS[i][j], format: (x) => pn(Math.abs(x) < 5e-10 ? 0 : x), fill: cell(MS, offS) });
          TB.draw({ value: (i, j) => MT[i][j], format: (x) => pn(Math.abs(x) < 5e-10 ? 0 : x), fill: cell(MT, offT) });
          const bn = common ? 'the common eigenbasis' : which.value === 's' ? "T's eigenbasis" : "S's eigenbasis";
          ttl(TA, `\\mathcal M(S) \\text{ in ${bn}}`, 'blue'); ttl(TB, `\\mathcal M(T) \\text{ in the same basis}`, offT < 1e-9 ? 'green' : 'red');
          st = { comm, ok, common, offT, nonreal: eT.nonreal, T };
        });
        v.legend([['blue', "$S$'s eigen-axes and grid"], ['orange', "$T$'s eigen-axes; image of the grid under $T$", { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { comm, ok, common, offT, nonreal } = st;
          if (ok && common) return `$ST - TS = 0$, and in the basis on the right **both** matrices are diagonal: a common eigenbasis.`;
          if (ok) return `$ST = TS$, but $T$ is not diagonalizable over $\\mathbf R$, so the theorem does not apply.`;
          return `$ST - TS \\ne 0$ (largest entry ${tn(comm, 3)}): ${nonreal ? '$T$ has no real eigenvectors at all' : `in $S$'s eigenbasis $\\mathcal M(T)$ has off-diagonal entries up to ${tn(offT, 3)}`}, so no basis diagonalizes both.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.78
    {
      num: '5.78',
      kind: 'Theorem',
      name: 'Common eigenvector for commuting operators',
      statement: String.raw`Every pair of commuting operators on a finite-dimensional nonzero complex vector space has a common eigenvector.`,
      idea: String.raw`Let $S, T \in \mathcal L(V)$ commute. By 5.19, $S$ has an eigenvalue $\lambda$, so $E(\lambda, S) \ne \{0\}$. By 5.75, $E(\lambda, S)$ is invariant under $T$, so $T|_{E(\lambda, S)}$ is an operator on a nonzero complex vector space and has an eigenvector $w$ (5.19 again). Then $Tw = \mu w$ and, because $w \in E(\lambda, S)$, also $Sw = \lambda w$. The two operators need not share an eigenvalue — only the eigenvector.`,
      caption: String.raw`Step through the proof for two commuting operators on $\mathbf R^3$ (real ones, so that everything can be drawn). Choose the eigenvalue $\lambda$ of $S$: its eigenspace is a plane or a line. Step 2 shows that $T$ maps it into itself; step 3 finds an eigenvector $w$ of $T$ inside it; step 4 checks $Sw = \lambda w$ and $Tw = \mu w$. Turn up the twist: $T$ restricted to the plane then has no *real* eigenvector — over $\mathbf C$ it would, which is why the theorem is stated for complex spaces. Turn up $\varepsilon$ to break commutativity: the plane is no longer invariant, and no common eigenvector exists.`,
      deps: ['ladr-5.19', 'ladr-5.75'],
      tags: ['commuting', 'eigenvalues'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2.3, 2.3], y: [-2.1, 2.2], equal: true, axes: false, height: 400, minWidth: 330 });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.3, axis: 1.6 });
        const SM = conj(M, QM, [[2, 0, 0], [0, 2, 0], [0, 0, -1]]), PERT = conj(M, QM, [[0, 0, 0.8], [0, 0, -0.5], [0.9, 0.6, 0]]);
        const PL = orthN([QB[0], QB[1]]), LN = [unit3(QB[2])];
        const lamSel = v.select('eigenvalue of $S$', [{ value: 2, label: '$\\lambda = 2$ (plane)' }, { value: -1, label: '$\\lambda = -1$ (line)' }], 2);
        const tw = v.slider('twist of $T$ on the plane', 0, 2, 0, { step: 0.05 }), eps = v.slider('non-commuting part $\\varepsilon$', 0, 1, 0, { step: 0.05 });
        const code = ['$S$ has an eigenvalue $\\lambda$: $E(\\lambda,S) \\ne \\{0\\}$   ▷ 5.19', '$E(\\lambda,S)$ is invariant under $T$   ▷ 5.75', '$T|_{E(\\lambda,S)}$ has an eigenvector $w$   ▷ 5.19', '$Sw = \\lambda w$ and $Tw = \\mu w$: common eigenvector'];
        const frames = [0, 1, 2, 3].map((k) => ({ k, line: k + 1 }));
        const SP = v.steps({ frames, code, codeTitle: 'proof of 5.78', codePos: 'below', start: 3, note: false });
        let st = null;
        v.render(() => {
          const k = SP.frame.k ?? 3, lam = +lamSel.value, E = lam === 2 ? PL : LN;
          const T0 = conj(M, QM, [[1.2, 0.9, 0], [0.8 - tw.value, -0.3, 0], [0, 0, 0.7]]);
          const T = T0.map((r, i) => r.map((x, j) => x + eps.value * PERT[i][j]));
          const comm = maxAbs(msub(M.matMul(SM, T), M.matMul(T, SM)));
          const leak = Math.max(...E.map((e) => len3(sub3(ap(T, e), projOnto(ap(T, e), E)))));
          const inv = leak < 1e-9;
          // eigenvectors of T inside E (honest: through the restriction when E is invariant)
          let ws = [], cplx = false;
          if (inv) {
            if (E.length === 1) ws = [{ w: E[0], mu: dot3(ap(T, E[0]), E[0]) }];
            else {
              const R = [[dot3(E[0], ap(T, E[0])), dot3(E[0], ap(T, E[1]))], [dot3(E[1], ap(T, E[0])), dot3(E[1], ap(T, E[1]))]];
              const es = eigenspaces(M, R); cplx = es.nonreal > 0;
              ws = es.list.flatMap((e) => e.B.map((b) => ({ w: unit3(add3(mul3(E[0], b[0]), mul3(E[1], b[1]))), mu: e.lam }))).sort((p, q) => Math.abs(q.mu) - Math.abs(p.mu));
            }
          }
          // all common eigenvectors (for the readout): eigenvectors of T that are also eigenvectors of S
          const eT = eigenspaces(M, T).list, eS = eigenspaces(M, SM).list;
          let ncommon = 0;
          for (const a of eT) for (const b of eS) { const B = orthN([...a.B, ...b.B]); ncommon += a.B.length + b.B.length - B.length; }
          sc.begin();
          drawSub(sc, PL, 'blue', { r: 1.45, fillAlpha: lam === 2 ? 0.14 : 0.04, edge: lam === 2 ? 0.6 : 0.2, grid: lam === 2 });
          drawSub(sc, LN, 'purple', { len: 1.7, alpha: lam === -1 ? 0.55 : 0.2 });
          sc.tex(lam === 2 ? 'E(2,S)' : 'E(-1,S)', lam === 2 ? subLabelAt(sc, PL, { r: 1.45, side: 'left' }) : subLabelAt(sc, LN, { len: 1.7, low: true }), { color: lam === 2 ? 'blue' : 'purple', size: 14, dx: lam === 2 ? -30 : 0, dy: lam === 2 ? 0 : 14 });
          if (k >= 1 && !(k >= 3 && E.length === 1)) {
            if (E.length === 2) {
              const circ = [], img = [];
              for (let i = 0; i <= 48; i++) { const t = (2 * Math.PI * i) / 48, w = add3(mul3(E[0], 0.6 * Math.cos(t)), mul3(E[1], 0.6 * Math.sin(t))); circ.push(w); img.push(ap(T, w)); }
              sc.path(circ, { color: 'muted', width: 1.2 }); sc.path(img, { color: inv ? 'green' : 'red', width: 2 });
            } else { const Te = ap(T, mul3(E[0], 0.8)); sc.arrow(ZERO, Te, { color: inv ? 'green' : 'red', width: 2 }); }
          }
          const w = ws[0];
          if (k >= 2 && w) ws.forEach((u, i) => { const s = sc.P(u.w)[1] >= 0 ? 1 : -1; sc.line(mul3(u.w, -1.6), mul3(u.w, 1.6), { color: 'gold', width: i ? 2 : 3.5, alpha: i ? 0.45 : 0.85 }, 12); });
          if (k >= 3 && w) {
            const ww = mul3(w.w, sc.P(w.w)[0] >= 0 ? 0.75 : -0.75), Sw = ap(SM, ww), Tw = ap(T, ww);
            const pd = sc.P(ww), pl = Math.hypot(pd[0], pd[1]) || 1, nx = -pd[1] / pl, ny = pd[0] / pl; // screen normal to the line of w
            sc.arrow(ZERO, Sw, { color: 'blue', width: 7, head: 14, alpha: 0.45, bias: 0.02 }); sc.arrow(ZERO, Tw, { color: 'orange', width: 4, head: 11, bias: 0.01 }); sc.arrow(ZERO, ww, { color: 'gold', width: 2.4, head: 9 });
            sc.tex('w', ww, { color: 'gold', size: 15, dx: -16 * nx, dy: 16 * ny }); sc.tex('Sw', Sw, { color: 'blue', size: 14, dx: 18 * nx + 8 * pd[0] / pl, dy: -18 * ny - 8 * pd[1] / pl }); sc.tex('Tw', Tw, { color: 'orange', size: 14, dx: -18 * nx, dy: 18 * ny });
          }
          sc.flush();
          let msg, col;
          if (k === 0) { msg = `step 1: λ = ${lam} is an eigenvalue of S`; col = 'muted'; }
          else if (!inv) { msg = 'T pushes vectors out of E(λ, S): ST ≠ TS'; col = 'red'; }
          else if (k === 1) { msg = 'step 2: T maps E(λ, S) into itself'; col = 'green'; }
          else if (!w) { msg = 'T on this plane has no real eigenvector (over C it has one)'; col = 'red'; }
          else { msg = k === 2 ? 'step 3: an eigenvector w of T inside E(λ, S)' : 'step 4: w is an eigenvector of both S and T'; col = 'green'; }
          S.corner(msg, 'tl', { color: col, weight: 700 });
          st = { k, inv, w, lam, comm, ncommon, cplx, T };
        });
        v.legend([['blue', '$E(\\lambda, S)$ and $Sw$', { area: true }], ['green', 'image under $T$ (inside: invariant)'], ['gold', 'eigenvectors of $T$ in $E(\\lambda, S)$'], ['orange', '$Tw$']]);
        v.readout(() => {
          if (!st) return '';
          const { inv, w, lam, comm, ncommon, cplx, T } = st;
          const head = comm < 1e-9 ? '$ST = TS$. ' : `$ST \\ne TS$ (largest entry of $ST - TS$: ${tn(comm, 2)}). `;
          if (!inv) return head + `$E(${lam}, S)$ is not invariant, and computing all eigenvectors of both operators finds **${ncommon ? ncommon + ' common direction(s)' : 'no common eigenvector'}**.`;
          if (!w) return head + `$T|_{E(2,S)}$ has nonreal eigenvalues: no real eigenvector in this plane. Over $\\mathbf C$ the proof goes through; here the other eigenspace of $S$ still supplies a common eigenvector (${ncommon} found in all).`;
          const Sw = ap(SM, w.w), Tw = ap(T, w.w);
          return head + `$w = (${w.w.map((x) => tn(x)).join(', ')})$: $Sw = ${tn(dot3(Sw, w.w))}\\,w$ and $Tw = ${tn(w.mu)}\\,w$ (residuals $${v.sci(len3(sub3(Sw, mul3(w.w, lam))), 1)}$ and $${v.sci(len3(sub3(Tw, mul3(w.w, w.mu))), 1)}$) — a **common eigenvector**, with different eigenvalues $${lam}$ and $${tn(w.mu)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.80
    {
      num: '5.80',
      kind: 'Theorem',
      name: 'Commuting operators are simultaneously triangularizable',
      statement: String.raw`Suppose $V$ is a finite-dimensional complex vector space and $S, T \in \mathcal L(V)$ commute. Then there is a basis of $V$ with respect to which both $S$ and $T$ have upper-triangular matrices.`,
      idea: String.raw`Induct on $\dim V$. Take a common eigenvector $v_1$ (5.78) and a complement $W$ with $V = \operatorname{span}(v_1) \oplus W$ (2.33); let $P$ be the projection onto $W$ along $v_1$. The compressions $\hat S = PS|_W$ and $\hat T = PT|_W$ still commute, because $P$ only discards multiples of the common eigenvector $v_1$. By induction they are upper triangular in some basis $v_2, \dots, v_n$ of $W$; then $Sv_k$ and $Tv_k$ lie in $\operatorname{span}(v_1, \dots, v_k)$ for every $k$, so both matrices in $v_1, \dots, v_n$ are upper triangular (5.39).`,
      caption: String.raw`Two commuting operators on $\mathbf R^3$ with real eigenvalues; their matrices are shown in the current basis, with the entries below the diagonal red until they vanish. Step through the construction: a common eigenvector $v_1$ kills the first column below the diagonal of **both** matrices; the commuting compressions to $W = v_1^\perp$ give a common eigenvector $v_2$; any $v_3$ completes the basis. In 3D the flag $\operatorname{span}(v_1) \subset \operatorname{span}(v_1, v_2)$ is drawn, invariant under both operators. Resample for another pair, or switch to a non-commuting pair and watch the first step fail.`,
      deps: ['ladr-5.78', 'ladr-2.33', 'ladr-5.39'],
      tags: ['commuting', 'triangular'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2.3, 2.3], y: [-2.1, 2.2], equal: true, axes: false, height: 400, weight: 1.1, minWidth: 300 });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.3, axis: 1.5 });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, minWidth: 280 });
        const pairSel = v.select('', [{ value: 'c', label: 'commuting pair' }, { value: 'n', label: 'non-commuting pair' }], 'c');
        let seed = 5, SM = null, TM = null, NM = null;
        const gen = () => {
          const r = v.rng(seed++);
          let Q = QM;
          for (let tries = 0; tries < 60; tries++) { const C = [0, 1, 2].map(() => unit3([r.uniform(-1, 1), r.uniform(-1, 1), r.uniform(-1, 1)])); if (Math.abs(M.det(C)) > 0.55) { Q = fromCols(C); break; } }
          const lam = Math.round(r.uniform(-1, 2) * 2) / 2, nu = lam + (r.uniform() < 0.5 ? -1.5 : 1.5), s = r.uniform(0.6, 1.2) * (r.uniform() < 0.5 ? -1 : 1);
          const a = Math.round(r.uniform(-1, 2) * 2) / 2, b = r.uniform(-1.2, 1.2), c = a + (r.uniform() < 0.5 ? -1 : 1);
          SM = conj(M, Q, [[lam, s, 0], [0, lam, 0], [0, 0, nu]]); TM = conj(M, Q, [[a, b, 0], [0, a, 0], [0, 0, c]]);
          NM = TM.map((rw, i) => rw.map((x, j) => x + [[0, 0, 0.7], [0.5, 0, 0], [0, 0.9, 0]][i][j]));
        };
        gen();
        v.button('Resample', () => { gen(); SP.reset({ at: 'keep' }); });
        /** Common eigenvectors of A, B on Rⁿ: bases of the intersections E(λ, A) ∩ E(μ, B) over all pairs of real eigenvalues. */
        const commonEig = (A, B) => {
          const out = [], eA = eigenspaces(M, A).list, eB = eigenspaces(M, B).list;
          for (const a of eA) for (const b of eB) {
            const K = A.map((_, r) => [...a.B.map((u) => u[r]), ...b.B.map((u) => -u[r])]);
            for (const z of M.nullspace(K, 1e-7)) { const w = A.map((_, r) => a.B.reduce((s, u, k) => s + z[k] * u[r], 0)); if (Math.hypot(...w) > 1e-6) out.push(w); }
          }
          return out;
        };
        const perpBasis = (u) => { const a = unit3(Math.abs(u[0]) < 0.8 ? cross3([1, 0, 0], u) : cross3([0, 1, 0], u)); return [a, cross3(u, a)]; };
        const build = () => {
          const A = SM, B = pairSel.value === 'c' ? TM : NM, fr = [{ k: 0, basis: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], A, B, note: 'Standard basis: neither matrix is upper triangular.' }];
          const c1 = commonEig(A, B);
          if (!c1.length) { fr.push({ k: 1, fail: true, basis: fr[0].basis, A, B, note: 'Step 1 fails: these operators do not commute, and they have no common eigenvector — no basis can start the flag.' }); return fr; }
          const v1 = unit3(c1[0]), [w2, w3] = perpBasis(v1), B1 = [v1, w2, w3];
          fr.push({ k: 1, basis: B1, A, B, note: String.raw`$v_1$ is a common eigenvector (5.78); complete it by $W = v_1^\perp$. Column 1 of both matrices is now zero below the diagonal.` });
          const MA = M.matMul(M.inverse(fromCols(B1)), M.matMul(A, fromCols(B1))), MB = M.matMul(M.inverse(fromCols(B1)), M.matMul(B, fromCols(B1)));
          const hA = [[MA[1][1], MA[1][2]], [MA[2][1], MA[2][2]]], hB = [[MB[1][1], MB[1][2]], [MB[2][1], MB[2][2]]];
          const c2 = commonEig(hA, hB);
          if (!c2.length) { fr.push({ k: 2, fail: true, basis: B1, A, B, note: 'The compressions to $W$ have no common real eigenvector.' }); return fr; }
          const u = c2[0], v2 = unit3(add3(mul3(w2, u[0]), mul3(w3, u[1]))), v3 = unit3(cross3(v1, v2));
          const hc = maxAbs(msub(M.matMul(hA, hB), M.matMul(hB, hA)));
          fr.push({ k: 2, basis: [v1, v2, v3], A, B, note: String.raw`$\hat S = PS|_W$ and $\hat T = PT|_W$ commute (their commutator is $${v.sci(hc, 1)}$); their common eigenvector gives $v_2 \in W$. Column 2 is now zero below the diagonal.` });
          fr.push({ k: 3, basis: [v1, v2, v3], A, B, done: true, note: String.raw`Any $v_3$ completing the basis works: both matrices are upper triangular, and their diagonals list the eigenvalues (5.41).` });
          return fr;
        };
        const SP = v.steps({ frames: build, code: ['find a common eigenvector $v_1$   ▷ 5.78', '$W$ with $V = \\operatorname{span}(v_1) \\oplus W$   ▷ 2.33', 'common eigenvector $v_2$ of $\\hat S, \\hat T$ on $W$', 'complete to a basis $v_1, v_2, v_3$'], codeTitle: 'triangularize both', codePos: 'below', start: 'end' });
        pairSel.el.addEventListener('click', () => SP.reset({ at: 'end' }));
        const TA = v.table(R, { rows: 3, cols: 3, region: [0.02, 0.5, 0.49, 0.9], maxCell: 46, size: 12.5 }), TB = v.table(R, { rows: 3, cols: 3, region: [0.51, 0.5, 0.98, 0.9], maxCell: 46, size: 12.5 });
        const ttl = (T, tex, col) => { const g = T.geo; if (g) R.texPx(tex, g.X0 + (g.cols * g.cw) / 2, g.Y0 - 14, { color: col, size: 13.5 }); };
        let st = null;
        v.render(() => {
          const f = SP.frame.basis ? SP.frame : { k: 0, basis: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], A: SM, B: TM };
          const kk = f.fail ? (f.k === 1 ? 0 : 1) : f.k;
          const Bm = fromCols(f.basis), Bi = M.inverse(Bm), MA = M.matMul(Bi, M.matMul(f.A, Bm)), MB = M.matMul(Bi, M.matMul(f.B, Bm));
          const fill = (X) => (i, j) => (i > j ? (Math.abs(X[i][j]) < 1e-8 ? ['green', 0.16] : ['red', 0.2]) : i === j ? ['gold', 0.12] : null);
          const fmt = (x) => pn(Math.abs(x) < 5e-9 ? 0 : x, 2);
          TA.draw({ value: (i, j) => MA[i][j], format: fmt, fill: fill(MA) }); TB.draw({ value: (i, j) => MB[i][j], format: fmt, fill: fill(MB) });
          ttl(TA, '\\mathcal M(S)', 'blue'); ttl(TB, '\\mathcal M(T)', 'orange');
          const below = Math.max(Math.abs(MA[1][0]), Math.abs(MA[2][0]), Math.abs(MA[2][1]), Math.abs(MB[1][0]), Math.abs(MB[2][0]), Math.abs(MB[2][1]));
          const comm = maxAbs(msub(M.matMul(f.A, f.B), M.matMul(f.B, f.A)));
          R.text(comm < 1e-9 ? 'ST = TS' : `ST ≠ TS (largest entry of ST − TS: ${pn(comm, 2)})`, 0.5, 0.36, { align: 'center', size: 13, weight: 700, color: comm < 1e-9 ? 'green' : 'red' });
          R.text(f.fail ? 'no common eigenvector: the construction stops' : below < 1e-8 ? 'both upper triangular ✓' : 'red entries: not yet upper triangular', 0.5, 0.26, { align: 'center', size: 13, weight: 600, color: f.fail ? 'red' : below < 1e-8 ? 'green' : 'muted' });
          R.text(`basis: ${kk === 0 ? 'e₁, e₂, e₃' : kk === 1 ? 'v₁, and two vectors w₂, w₃ of W' : 'v₁, v₂, v₃'}`, 0.5, 0.16, { align: 'center', size: 12, color: 'muted' });
          sc.begin();
          const [b1, b2, b3] = f.basis;
          if (f.k >= 1 && !f.fail) {
            if (f.k >= 2) sc.disc(b1, unit3(sub3(b2, mul3(b1, dot3(b1, b2)))), 1.35, { fill: 'green', color: 'green', fillAlpha: 0.13, grid: true, alpha: 0.6 });
            else sc.disc(b2, b3, 1.3, { fill: 'muted', color: 'muted', fillAlpha: 0.06, grid: false, alpha: 0.4 });
            sc.line(mul3(b1, -1.7), mul3(b1, 1.7), { color: 'gold', width: 4, alpha: 0.5 }, 12);
          }
          const names = kk === 0 ? ['e_1', 'e_2', 'e_3'] : kk === 1 ? ['v_1', 'w_2', 'w_3'] : ['v_1', 'v_2', 'v_3'];
          f.basis.forEach((b, i) => { const c = kk >= 1 && i <= (kk >= 2 ? 1 : 0) ? 'gold' : 'muted'; sc.arrow(ZERO, mul3(b, 1.1), { color: kk === 0 ? EC[i] : c, width: 2.6 }); sc.tex(names[i], mul3(b, 1.27), { color: kk === 0 ? EC[i] : c, size: 14 }); });
          if (f.k >= 1 && !f.fail) {
            const u = mul3(b1, 0.8); sc.arrow(ZERO, ap(f.A, u), { color: 'blue', width: 1.6, head: 7 }); sc.arrow(ZERO, ap(f.B, u), { color: 'orange', width: 1.6, head: 7 });
          }
          sc.flush();
          if (f.k >= 2 && !f.fail) S.corner('span(v₁) ⊂ span(v₁, v₂): invariant under S and T', 'tl', { color: 'green', weight: 700 });
          else if (f.k === 1 && !f.fail) S.corner('Sv₁ and Tv₁ lie on the line of v₁', 'tl', { color: 'green', weight: 700 });
          st = { MA, MB, below, f };
        });
        v.legend([['gold', 'the flag $\\operatorname{span}(v_1) \\subset \\operatorname{span}(v_1, v_2)$'], ['red', 'nonzero below the diagonal', { area: true }], ['green', 'zero below the diagonal', { area: true }]]);
        v.readout(() => st && (st.f.fail ? 'The two operators do not commute: no common eigenvector, so no basis makes both matrices upper triangular.' : st.below < 1e-8 ? `Both matrices are upper triangular in $v_1, v_2, v_3$ (largest entry below the diagonal: $${v.sci(st.below, 1)}$); their diagonals are $(${[0, 1, 2].map((i) => tn(st.MA[i][i])).join(', ')})$ and $(${[0, 1, 2].map((i) => tn(st.MB[i][i])).join(', ')})$.` : `Largest entry below the diagonal: ${tn(st.below, 3)}.`));
      },
    },
    // ------------------------------------------------------------------ 5.81
    {
      num: '5.81',
      kind: 'Theorem',
      name: 'Eigenvalues of sum and product of commuting operators',
      statement: String.raw`Suppose $V$ is a finite-dimensional complex vector space and $S, T \in \mathcal L(V)$ commute. Then
- every eigenvalue of $S + T$ is an eigenvalue of $S$ plus an eigenvalue of $T$;
- every eigenvalue of $ST$ is an eigenvalue of $S$ times an eigenvalue of $T$.`,
      idea: String.raw`Choose a basis in which both $S$ and $T$ are upper triangular (5.80). Then $\mathcal M(S + T) = \mathcal M(S) + \mathcal M(T)$ and $\mathcal M(ST) = \mathcal M(S)\mathcal M(T)$ (3.35, 3.43) are upper triangular too, with diagonals the entrywise sums and products of the two diagonals. The eigenvalues of a triangular matrix are its diagonal entries (5.41), so each eigenvalue of $S + T$ is $\lambda_k + \mu_k$ and each eigenvalue of $ST$ is $\lambda_k\mu_k$, where $\lambda_k$ and $\mu_k$ are the $k$th diagonal entries — eigenvalues of $S$ and of $T$. Without commutativity the conclusion fails.`,
      caption: String.raw`$S$ and $T$ act on $\mathbf C^3$, built from their eigenvalues, which you drag: $\lambda_k$ (blue) and $\mu_k$ (orange). The faint rings are all nine candidates $\lambda_i + \mu_j$ (or $\lambda_i \mu_j$); the green dots are the eigenvalues of $S + T$ (or $ST$), computed from the matrix. While $T$'s eigenbasis equals $S$'s, the operators commute and each green dot sits on a candidate — the matched pair is joined by an arrow. Turn $T$'s eigenbasis by the angle $\varphi$: $T$ keeps its eigenvalues, so the candidates stay put, but $ST \ne TS$ and the green dots drift off.`,
      deps: ['ladr-5.80', 'ladr-3.35', 'ladr-3.43', 'ladr-5.41'],
      tags: ['commuting', 'eigenvalues'],
      viz(v) {
        const M = v.M, Cx = M.Cx;
        const S = v.stage({ x: [-3.3, 3.9], y: [-2.4, 2.4], equal: true, height: 420, full: true, xlabel: 'Re', ylabel: 'Im' });
        const op = v.select('', [{ value: 's', label: '$S + T$' }, { value: 'p', label: '$ST$' }], 's');
        const phi = v.slider("turn $T$'s eigenbasis by $\\varphi$", 0, 60, 0, { step: 1, fmt: (x) => `${x}°` });
        const L = [[-1.4, 0.9], [0.4, -0.9], [1.5, 0.8]].map((p, k) => S.handle(p[0], p[1], { color: 'blue', label: `λ${'₁₂₃'[k]}` }));
        const U = [[0.6, 0.5], [-0.8, -0.3], [0.7, -0.7]].map((p, k) => S.handle(p[0], p[1], { color: 'orange', label: `μ${'₁₂₃'[k]}` }));
        let st = null;
        v.render(() => {
          const lam = L.map((h) => new Cx(h.x, h.y)), mu = U.map((h) => new Cx(h.x, h.y)), sum = op.value === 's';
          const R = M.matMul(rot3([0.3, 1, 0.5], (phi.value * Math.PI) / 180), QM);
          const SM = cDiagConj(M, QM, lam), TM = cDiagConj(M, R, mu);
          const C = sum ? SM.map((r, i) => r.map((z, j) => z.add(TM[i][j]))) : SM.map((r, i) => TM[0].map((_, j) => r.reduce((s, z, k) => s.add(z.mul(TM[k][j])), new Cx(0, 0))));
          const ev = cEigvals(M, C);
          const comb = (a, b) => (sum ? a.add(b) : a.mul(b));
          const cands = []; lam.forEach((a, i) => mu.forEach((b, j) => cands.push({ z: comb(a, b), i, j })));
          cands.forEach((c) => S.dot(c.z.re, c.z.im, { r: 6, hollow: true, color: c.i === c.j ? 'muted' : 'faint', width: 1.4 }));
          if (phi.value === 0) lam.forEach((a, k) => {
            const z = comb(a, mu[k]);
            if (sum) S.arrow(a.re, a.im, z.re, z.im, { color: 'orange', width: 1.4, dash: [5, 4], head: 7 });
            else S.arrow(a.re, a.im, z.re, z.im, { color: 'purple', width: 1.4, dash: [5, 4], head: 7 });
          });
          const dists = ev.map((z) => Math.min(...cands.map((c) => Math.hypot(z.re - c.z.re, z.im - c.z.im))));
          ev.forEach((z, k) => {
            if (dists[k] >= 1e-6) { const c = cands.reduce((b, q) => (Math.hypot(z.re - q.z.re, z.im - q.z.im) < Math.hypot(z.re - b.z.re, z.im - b.z.im) ? q : b)); S.line(z.re, z.im, c.z.re, c.z.im, { color: 'red', width: 1.4, dash: [3, 3] }); }
            S.dot(z.re, z.im, { r: 6, color: dists[k] < 1e-6 ? 'green' : 'red' });
          });
          const comm = (() => { let m = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { let a = new Cx(0, 0), b = new Cx(0, 0); for (let k = 0; k < 3; k++) { a = a.add(SM[i][k].mul(TM[k][j])); b = b.add(TM[i][k].mul(SM[k][j])); } m = Math.max(m, a.sub(b).abs()); } return m; })();
          S.corner(comm < 1e-9 ? `ST = TS: every eigenvalue of ${sum ? 'S + T' : 'ST'} is a candidate` : `ST ≠ TS: eigenvalues of ${sum ? 'S + T' : 'ST'} miss the candidates`, 'tl', { color: comm < 1e-9 ? 'green' : 'red', weight: 700 });
          st = { ev, dists, comm, sum };
        });
        v.legend([['blue', 'eigenvalues $\\lambda_k$ of $S$', { dot: true }], ['orange', 'eigenvalues $\\mu_k$ of $T$', { dot: true }], ['muted', 'candidates $\\lambda_i + \\mu_j$ or $\\lambda_i\\mu_j$', { dot: true }], ['green', 'computed eigenvalues', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { ev, dists, comm, sum } = st, nm = sum ? 'S + T' : 'ST';
          return `Eigenvalues of $${nm}$: ${ev.map((z) => `$${ctn(z.re, z.im)}$`).join(', ')}. Distance to the nearest candidate: ${dists.map((d) => (d < 1e-6 ? `$${v.sci(d, 1)}$` : `$${tn(d, 3)}$`)).join(', ')} — ${comm < 1e-9 ? '**on the candidates**, as 5.81 promises.' : `**off** them (red dashes): $ST - TS$ has entries up to ${tn(comm, 2)}, so the theorem does not apply.`}`;
        });
      },
    },
  ],
};
