// Linear Algebra Done Right (Axler, 4th ed.) — Chapter 5: Eigenvalues and Eigenvectors
// Part 2 (5.31–5.52): the minimal polynomial of a restriction, invertibility, odd-dimensional real spaces,
// matrices of operators, upper-triangular matrices, diagonalizable operators and eigenspaces.
// Part 1 is ch05.js (5.1–5.29, with the chapter title and summary); part 3 is ch05-c.js (5.54–5.81).

// =====================================================================================================
// Shared helpers
// =====================================================================================================
const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const sub = (k) => String(k).split('').map((d) => SUBS[+d]).join('');
const VC = ['blue', 'purple', 'teal', 'pink'];
const TAU = 2 * Math.PI;

/** A number for TeX: at most d decimals, trailing zeros dropped, never "-0". */
function tn(x, d = 2) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  let s = (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s === '-0' ? '0' : s;
}
/** The same for canvas text (real minus sign). */
const pn = (x, d = 2) => tn(x, d).replace('-', '−');
/** TeX for a matrix (array of rows), with Axler's round brackets. */
const mtex = (A, f = (x) => tn(x)) => `\\begin{pmatrix}${A.map((r) => r.map(f).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;
/** TeX for a vector as a list (x₁, …, xₙ). */
const vtex = (p, d = 2) => `(${p.map((x) => tn(x, d)).join(',\\,')})`;

// ---------- vectors and matrices ----------
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dotN = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const normN = (a) => Math.hypot(...a);
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unitN = (a) => { const l = normN(a); return l > 1e-12 ? a.map((x) => x / l) : a.map(() => 0); };
const colOf = (A, k) => A.map((r) => r[k]);
const fromCols = (cols) => cols[0].map((_, i) => cols.map((c) => c[i]));
const mv = (A, x) => A.map((r) => dotN(r, x));
const maxAbs = (A) => Math.max(0, ...A.flat().map(Math.abs));
const ident = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
const shiftI = (A, t) => A.map((r, i) => r.map((x, j) => (i === j ? x - t : x)));
/** Orthonormal basis of span(vs) (Gram–Schmidt, twice); vectors already in the span are skipped. */
function orthN(vs, tol = 1e-7) {
  const B = [];
  for (const x of vs) {
    let w = x.slice();
    for (let p = 0; p < 2; p++) for (const e of B) { const d = dotN(w, e); w = w.map((c, i) => c - d * e[i]); }
    const l = normN(w); if (l > tol * Math.max(1, normN(x))) B.push(w.map((c) => c / l));
  }
  return B;
}
const projN = (x, B) => B.reduce((s, e) => { const d = dotN(x, e); return s.map((c, i) => c + d * e[i]); }, x.map(() => 0));
const distN = (x, B) => normN(x.map((c, i) => c - projN(x, B)[i]));
/** Matrix S·D·S⁻¹. */
const conj = (M, S, D) => M.matMul(M.matMul(S, D), M.inverse(S));

// ---------- polynomials (ascending coefficient lists) ----------
function pTrim(c, tol = 1e-12) { const a = c.slice(); while (a.length > 1 && Math.abs(a[a.length - 1]) <= tol) a.pop(); return a; }
function pMul(a, b) { const c = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { c[i + j] += x * y; })); return c; }
/** Division with remainder p = s·q + r, deg r < deg s. */
function pDiv(p, s) {
  s = pTrim(s); const m = s.length - 1, r = p.slice();
  if (p.length - 1 < m) return { q: [0], r };
  const q = new Array(p.length - m).fill(0);
  for (let e = p.length - 1 - m; e >= 0; e--) { const c = r[e + m] / s[m]; q[e] = c; for (let k = 0; k <= m; k++) r[e + k] -= c * s[k]; r[e + m] = 0; }
  return { q, r: r.slice(0, Math.max(1, m)) };
}
/** Polynomial in an operator T as TeX, the constant term written as a multiple of I. */
function polyOpT(c, d = 2) {
  let s = '';
  for (let k = c.length - 1; k >= 0; k--) {
    const a = Number(c[k].toFixed(d)); if (a === 0) continue;
    const mag = Math.abs(a) === 1 ? '' : tn(Math.abs(a), d);
    const mon = k === 0 ? 'I' : k === 1 ? 'T' : `T^{${k}}`;
    s += s ? ` ${a < 0 ? '-' : '+'} ${mag}${mon}` : `${a < 0 ? '-' : ''}${mag}${mon}`;
  }
  return s || '0';
}
const pVal = (c, x) => c.reduceRight((acc, a) => acc * x + a, 0);
/** Polynomial with ascending coefficients c as TeX in the variable v. */
function polyT(c, v = 'z', d = 2) {
  let s = '';
  for (let k = c.length - 1; k >= 0; k--) {
    const a = Number(c[k].toFixed(d)); if (a === 0) continue;
    const mag = Math.abs(a) === 1 && k > 0 ? '' : tn(Math.abs(a), d);
    const mon = k === 0 ? '' : k === 1 ? v : `${v}^{${k}}`;
    s += s ? ` ${a < 0 ? '-' : '+'} ${mag}${mon}` : `${a < 0 ? '-' : ''}${mag}${mon}`;
  }
  return s || '0';
}
/** p(A) for a square matrix A (Horner). */
function pOfMat(M, c, A) {
  const n = A.length; let P = ident(n).map((r) => r.map((x) => x * c[c.length - 1]));
  for (let k = c.length - 2; k >= 0; k--) { P = M.matMul(P, A); for (let i = 0; i < n; i++) P[i][i] += c[k]; }
  return P;
}
/**
 * Minimal polynomial of the square matrix A, computed from the definition: the first power A^k that lies in
 * span(I, A, …, A^{k−1}) (tested by least squares on the flattened matrices) gives the monic
 * p(z) = z^k − Σ c_j z^j. Returns ascending coefficients ([1] for the operator on {0}).
 */
function minPoly(M, A, tol = 1e-7) {
  const n = A.length; if (!n) return [1];
  const scale = Math.max(1, maxAbs(A));
  const B = A.map((r) => r.map((x) => x / scale));               // work with A/scale, rescale at the end
  const pw = [ident(n)], vecs = [ident(n).flat()];
  for (let k = 1; k <= n; k++) {
    const P = M.matMul(B, pw[k - 1]), x = P.flat();
    const G = fromCols(vecs), c = M.lstsq(G, x), res = normN(mv(G, c).map((y, i) => y - x[i]));
    if (res <= tol * Math.max(1, normN(x))) return [...c.map((t, j) => -t * scale ** (k - j)), 1];
    pw.push(P); vecs.push(x);
  }
  return [...new Array(n).fill(0), 1];
}
/** Complex zeros of a real polynomial as [re, im] pairs. */
function rootsOf(M, c) {
  const a = pTrim(c); if (a.length < 2) return [];
  return M.polyRoots(a).map((z) => [z.re, Math.abs(z.im) < 1e-7 * (1 + Math.abs(z.re)) ? 0 : z.im]);
}
/** Group zeros: real ones by value, nonreal ones into conjugate pairs → [{re, im ≥ 0, m}], sorted by real part. */
function groupRoots(roots, tol = 2e-3) {
  const g = [];
  for (const [re, im0] of roots) {
    const im = Math.abs(im0) < tol ? 0 : im0;
    if (im < 0) continue;
    const hit = g.find((q) => Math.abs(q.re - re) < tol && Math.abs(q.im - im) < tol);
    if (hit) { hit.m++; hit.re = (hit.re * (hit.m - 1) + re) / hit.m; } else g.push({ re, im, m: 1 });
  }
  return g.sort((a, b) => a.re - b.re || a.im - b.im);
}
/** TeX for the factorization over R of the monic polynomial with these grouped zeros. */
function factorTeX(groups, v = 'z', d = 2) {
  if (!groups.length) return '1';
  const one = groups.length === 1;
  return groups.map((q) => {
    let base;
    if (q.im) base = polyT([q.re * q.re + q.im * q.im, -2 * q.re, 1], v, d);
    else base = Math.abs(q.re) < 0.5 * 10 ** -d ? v : `${v} ${q.re > 0 ? '-' : '+'} ${tn(Math.abs(q.re), d)}`;
    const bare = base === v;
    const b = bare || (one && q.m === 1) ? base : `(${base})`;
    return q.m > 1 ? `${b}^{${q.m}}` : b;
  }).join('');
}
/** TeX for the monic polynomial c, factored over R. */
const factored = (M, c, v = 'z') => factorTeX(groupRoots(rootsOf(M, c)), v);

// ---------- drawing helpers ----------
/** Draw span(vs) ⊂ R³ in a scene3: a dot, a line, a disc or a faint box. Returns its dimension. */
function spanDraw(sc, vs, st = {}) {
  const B = orthN(vs, 1e-6), col = st.color || 'green', R = st.r ?? 1.8;
  if (B.length === 0) sc.dot([0, 0, 0], { color: col, r: 6 });
  else if (B.length === 1) sc.line(B[0].map((c) => -R * c), B[0].map((c) => R * c), { color: col, width: st.width ?? 3.4, alpha: st.alpha ?? 0.7 }, 16);
  else if (B.length === 2) sc.disc(B[0], B[1], R, { fill: col, color: col, fillAlpha: st.fillAlpha ?? 0.13, grid: true });
  else {
    const c = st.box ?? 1.2, P = (a, b, k, sg) => { const p = [0, 0, 0]; p[k] = sg * c; return [[a, b], [-a, b], [-a, -b], [a, -b]].map(([x, y]) => { const q = p.slice(); q[(k + 1) % 3] = x * c; q[(k + 2) % 3] = y * c; return q; }); };
    for (let k = 0; k < 3; k++) for (const sg of [-1, 1]) sc.poly(P(1, 1, k, sg), { fill: col, color: col, fillAlpha: 0.03, alpha: 0.3 });
  }
  return B.length;
}
/** Title above (or below) a drawn table. */
function ttl(s, T, tex, color = 'ink', below = false, size = 15) {
  const g = T.geo; if (!g) return;
  s.texPx(tex, g.X0 + (g.cols * g.cw) / 2, below ? g.Y0 + g.rows * g.ch + 14 : g.Y0 - g.lh - 13, { color, size });
}
/**
 * Make the cells of table T editable; get() returns the matrix shown (mutated in place).
 * Click the upper / lower half of a cell for ±step, or drag a cell up / down. o.ok(i, j) limits which cells.
 */
function editable(v, s, T, get, o = {}) {
  const step = o.step ?? 1, lo = o.min ?? -9, hi = o.max ?? 9;
  let d = null;
  const put = (i, j, x) => { get()[i][j] = Math.round(v.M.clamp(x, lo, hi) / step) * step; o.onChange?.(i, j); };
  s.onDrag((x, y, ph) => {
    if (ph === 'start') {
      const c = T.hit(x, y);
      d = c && c.i >= 0 && c.j >= 0 && (!o.ok || o.ok(c.i, c.j)) ? { ...c, Y: s.Y(y), a: get()[c.i][c.j], moved: false } : null;
      return;
    }
    if (!d) return;
    const dy = d.Y - s.Y(y);
    if (ph === 'move' && (d.moved || Math.abs(dy) > 5)) { d.moved = true; put(d.i, d.j, d.a + Math.round(dy / 14) * step); }
    if (ph === 'end') {
      if (!d.moved) { const r = T.cellRect(d.i, d.j); put(d.i, d.j, d.a + (y > (r[1] + r[3]) / 2 ? step : -step)); }
      d = null;
    }
  });
}
/** Rounded box in pixel units around (x, y) (data), drawn on stage S. */
function box(S, x, y, wPx, hPx, st = {}) {
  const X = S.X(x), Y = S.Y(y), c = S.ctx, r = st.radius ?? 8;
  c.save(); c.beginPath();
  const x0 = X - wPx / 2, y0 = Y - hPx / 2;
  c.moveTo(x0 + r, y0); c.arcTo(x0 + wPx, y0, x0 + wPx, y0 + hPx, r); c.arcTo(x0 + wPx, y0 + hPx, x0, y0 + hPx, r);
  c.arcTo(x0, y0 + hPx, x0, y0, r); c.arcTo(x0, y0, x0 + wPx, y0, r); c.closePath();
  if (st.fill) { c.fillStyle = st.v.color(st.fill, st.fillAlpha ?? 0.15); c.fill(); }
  if (st.color) { c.lineWidth = st.width ?? 1.5; c.strokeStyle = st.v.color(st.color, st.alpha ?? 1); if (st.dash) c.setLineDash(st.dash); c.stroke(); }
  c.restore();
}

// ---------- complex numbers as [re, im] (for 5.47) ----------
const cA = (a, b) => [a[0] + b[0], a[1] + b[1]];
const cS = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cM = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cD = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cC = (a) => [a[0], -a[1]];
const cAbs = (a) => Math.hypot(a[0], a[1]);
const cSqrt = (a) => { const r = cAbs(a), t = Math.atan2(a[1], a[0]) / 2; return [Math.sqrt(r) * Math.cos(t), Math.sqrt(r) * Math.sin(t)]; };
/** a + bi as TeX (or plain text with plain = true). */
function cxT(z, d = 2, plain = false) {
  const a = Number(z[0].toFixed(d)), b = Number(z[1].toFixed(d)), m = plain ? '−' : '-';
  const A = tn(a, d).replace('-', m), Bm = Math.abs(b) === 1 ? '' : tn(Math.abs(b), d);
  if (b === 0) return A;
  if (a === 0) return `${b < 0 ? m : ''}${Bm}i`;
  return `${A} ${b < 0 ? m : '+'} ${Bm}i`;
}
const cmm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => cA(s, cM(x, B[k][j])), [0, 0])));
const cH = (A) => A[0].map((_, j) => A.map((r) => cC(r[j])));            // conjugate transpose
const cvDot = (x, y) => x.reduce((s, xi, i) => cA(s, cM(xi, cC(y[i]))), [0, 0]); // Hermitian ⟨x, y⟩
const cvNorm = (x) => Math.sqrt(x.reduce((s, z) => s + z[0] * z[0] + z[1] * z[1], 0));
const cvScale = (x, k) => x.map((z) => cM(z, k));
const cvUnit = (x) => { const l = cvNorm(x); return x.map((z) => [z[0] / l, z[1] / l]); };
/** Unitary completion of the orthonormal list vs (in Cⁿ) to an orthonormal basis, by Gram–Schmidt on e₁, e₂, …. */
function cComplete(vs, n) {
  const B = vs.map((x) => x.slice());
  for (let e = 0; e < n && B.length < n; e++) {
    let w = Array.from({ length: n }, (_, i) => [+(i === e), 0]);
    for (let p = 0; p < 2; p++) for (const b of B) w = w.map((z, i) => cS(z, cM(cvDot(w, b), b[i])));
    if (cvNorm(w) > 1e-6) B.push(cvUnit(w));
  }
  return B;
}

export default {
  collection: 'ladr',
  chapter: 5,
  items: [
    // ------------------------------------------------------------------ 5.31
    {
      num: '5.31',
      kind: 'Theorem',
      name: 'Minimal polynomial of a restriction operator',
      statement: String.raw`Suppose $V$ is finite-dimensional, $T \in \mathcal L(V)$, and $U$ is a subspace of $V$ that is invariant under $T$, so that the restriction $T|_U$ is an operator on $U$. Then the minimal polynomial of $T$ is a polynomial multiple of the minimal polynomial of $T|_U$: there is $s \in \mathcal P(\mathbf F)$ with
$$p_T = s\cdot p_{T|_U}.$$`,
      idea: String.raw`Let $p$ be the minimal polynomial of $T$. Then $p(T)$ is the zero operator on all of $V$, so in particular $p(T)u = 0$ for every $u \in U$. Because $U$ is invariant, applying $T|_U$ to a vector of $U$ is the same as applying $T$, so $p(T|_U)u = p(T)u = 0$: the polynomial $p$ annihilates $T|_U$. By 5.29, applied to the operator $T|_U$, every polynomial that annihilates $T|_U$ is a multiple of its minimal polynomial. In particular every eigenvalue of $T|_U$ is an eigenvalue of $T$, with no larger multiplicity in the minimal polynomial.`,
      caption: String.raw`The diagram shows every subspace of $\mathbf R^3$ invariant under the chosen operator $T$, ordered by inclusion, each labelled with the minimal polynomial of $T$ restricted to it — computed from the matrix of the restriction. **Click a node** $U$: the invariant subspaces above it light up, and each green edge carries the factor by which the polynomial grows. On the right, $U$ is drawn in $\mathbf R^3$; drag $u$ inside it and $Tu$ stays in $U$. Switch on the plane $W$, which is *not* invariant, to see the conclusion fail.`,
      deps: ['ladr-5.29', 'ladr-5.2'],
      tags: ['minimal polynomial', 'invariant subspaces'],
      viz(v) {
        const M = v.M;
        const Sb = [[1.1, 0.25, 0.1], [-0.35, 1.0, 0.3], [0.3, -0.45, 1.0]];          // s₁, s₂, s₃
        const SM = fromCols(Sb);
        const L = (idx, x, y) => ({ idx, x, y });
        const PRE = {
          jordan: { label: 'a Jordan block and $-1$', J: [[2, 1, 0], [0, 2, 0], [0, 0, -1]], sel: 3,
            nodes: [L([], 0, 0), L([0], -1, 1), L([2], 1, 1), L([0, 1], -1, 2), L([0, 2], 1, 2), L([0, 1, 2], 0, 3)] },
          distinct: { label: 'three distinct eigenvalues', J: [[2, 0, 0], [0, 1, 0], [0, 0, -1]], sel: 1,
            nodes: [L([], 0, 0), L([0], -1.45, 1), L([1], 0, 1), L([2], 1.45, 1), L([0, 1], -1.45, 2), L([0, 2], 0, 2), L([1, 2], 1.45, 2), L([0, 1, 2], 0, 3)] },
          rot: { label: 'a rotation block and $2$', J: [[0, -1, 0], [1, 0, 0], [0, 0, 2]], sel: 2,
            nodes: [L([], 0, 0), L([2], 1, 1.25), L([0, 1], -1, 1.75), L([0, 1, 2], 0, 3)] },
          chain: { label: 'one $3\\times3$ Jordan block', J: [[1, 1, 0], [0, 1, 1], [0, 0, 1]], sel: 2,
            nodes: [L([], 0, 0), L([0], 0, 1), L([0, 1], 0, 2), L([0, 1, 2], 0, 3)] },
        };
        const pre = v.select('operator $T$', Object.entries(PRE).map(([value, P]) => ({ value, label: P.label })), 'jordan', {
          onChange: (k) => { sel = PRE[k].sel; reset = true; },
        });
        const showW = v.toggle('add the non-invariant plane $W$', false, { onChange: (b) => { if (!b && sel === 'W') sel = PRE[pre.value].sel; } });
        const D = v.stage({ x: [-2.45, 2.45], y: [-0.5, 3.5], axes: false, height: 380, weight: 1.25, title: 'invariant subspaces of $T$ and the minimal polynomial of $T|_U$' });
        const S3 = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, axes: false, height: 380, weight: 0.95, minWidth: 260 });
        const sc = v.scene3(S3, { yaw: -0.75, pitch: 0.55, axis: 1.6, lim: 1.25, labels: ['x', 'y', 'z'] });
        const hu = sc.handle([0.6, 0.2, 0.1], { color: 'accent', label: 'u', mode: 'plane', a: [1, 0, 0], b: [0, 1, 0] });
        let sel = PRE.jordan.sel, reset = true, curKey = '', st = null, geo = [];
        const BW = 116, BH = 30;
        D.onClick((x, y) => {
          for (const g of geo) if (Math.abs(D.X(x) - D.X(g.x)) <= BW / 2 && Math.abs(D.Y(y) - D.Y(g.y)) <= BH / 2 + 12) { sel = g.k; reset = true; }
        });
        const Wvecs = [add3(Sb[0], Sb[2]), Sb[1]];
        v.render(() => {
          const P = PRE[pre.value], T = conj(M, SM, P.J);
          const pT = minPoly(M, T), fT = factored(M, pT);
          // the minimal polynomial of each restriction, from the matrix of T|_U in the basis s_i (i in U)
          const info = P.nodes.map((nd) => {
            const B = nd.idx.map((i) => Sb[i]);
            if (!B.length) return { ...nd, p: [1], f: '1', B };
            const Bm = fromCols(B), X = fromCols(B.map((b) => M.lstsq(Bm, mv(T, b))));
            const p = minPoly(M, X);
            return { ...nd, p, f: factored(M, p), B };
          });
          const contains = (a, b) => a.idx.every((i) => b.idx.includes(i)) && a.idx.length < b.idx.length;
          const edges = [];
          info.forEach((a, i) => info.forEach((b, j) => { if (contains(a, b) && !info.some((c) => contains(a, c) && contains(c, b))) edges.push([i, j]); }));
          const isW = sel === 'W' && showW.value, sIdx = isW ? -1 : Math.min(sel, info.length - 1);
          const above = new Set(info.map((b, j) => (sIdx >= 0 && (j === sIdx || contains(info[sIdx], b)) ? j : -1)).filter((j) => j >= 0));
          // ---- the diagram
          for (const [i, j] of edges) {
            const a = info[i], b = info[j], on = above.has(i) && above.has(j);
            const y0 = D.invY(D.Y(a.y) - BH / 2 - 17), y1 = D.invY(D.Y(b.y) + BH / 2 + 1);
            D.line(a.x, y0, b.x, y1, { color: on ? 'green' : 'faint', width: on ? 2.6 : 1.4 });
            if (on) {
              const f = factored(M, pDiv(b.p, a.p).q), lab = f === '1' || f.startsWith('(') || !/[+-]/.test(f) ? f : `(${f})`;
              let ex = D.X(b.x) - D.X(a.x), ey = D.Y(y1) - D.Y(y0); const l = Math.hypot(ex, ey); ex /= l; ey /= l;
              let nx = -ey, ny = ex; if (nx < 0 || (Math.abs(nx) < 1e-6 && ny > 0)) { nx = -nx; ny = -ny; }
              if (a.x > b.x + 1e-6) { nx = -nx; ny = -ny; }
              const mx = (D.X(a.x) + D.X(b.x)) / 2 + nx * 24, my = (D.Y(y0) + D.Y(y1)) / 2 + ny * 24;
              D.texPx(`\\times ${lab}`, mx, my, { color: 'green', size: 12.5 });
            }
          }
          geo = [];
          info.forEach((nd, j) => {
            const isSel = j === sIdx, on = above.has(j);
            box(D, nd.x, nd.y, BW, BH, { v, color: isSel ? 'accent' : on ? 'green' : 'muted', width: isSel ? 3 : on ? 2 : 1.2, fill: isSel ? 'accent' : on ? 'green' : 'faint', fillAlpha: isSel ? 0.16 : on ? 0.1 : 0.06 });
            D.tex(nd.f, nd.x, nd.y, { size: 14, color: isSel ? 'accent' : 'ink' });
            const name = !nd.idx.length ? '{0}' : nd.idx.length === 3 ? 'V = ℝ³' : `span(${nd.idx.map((i) => 's' + sub(i + 1)).join(', ')})`;
            D.textPx(name, D.X(nd.x), D.Y(nd.y) - BH / 2 - 7, { align: 'center', size: 11, color: 'muted' });
            geo.push({ k: j, x: nd.x, y: nd.y });
          });
          let wInfo = null;
          if (showW.value) {
            const Q = orthN(Wvecs), C = Q.map((a) => Q.map((b) => dotN(a, mv(T, b))));      // compression P_W T|_W
            const q = minPoly(M, C), dv = pDiv(pT, q);
            wInfo = { q, f: factored(M, q), r: dv.r, Q };
            const wx = 1.62, wy = 3;
            box(D, wx, wy, BW + 30, BH, { v, color: 'red', width: isW ? 3 : 1.6, dash: [5, 4], fill: 'red', fillAlpha: isW ? 0.14 : 0.06 });
            D.tex(wInfo.f, wx, wy, { size: 11.5, color: 'red' });
            D.textPx('W (not invariant)', D.X(wx), D.Y(wy) - BH / 2 - 7, { align: 'center', size: 11, color: 'red' });
            geo.push({ k: 'W', x: wx, y: wy });
          }
          D.corner('click a node', 'bl', { size: 11, color: 'faint' });
          // ---- the subspace in R³
          const key = `${pre.value}|${sel}|${showW.value}`;
          const U = isW ? wInfo.Q : orthN(info[sIdx].B);
          if (key !== curKey || reset) {
            curKey = key; reset = false;
            if (U.length === 1) { hu.mode = 'line'; hu.d = U[0]; hu.set(mul3(U[0], 0.75)); }
            else if (U.length === 2) { hu.mode = 'plane'; hu.a = U[0]; hu.b = U[1]; hu.set(add3(mul3(U[0], 0.25), mul3(U[1], 0.75))); }
            else if (U.length === 3) { hu.mode = 'free'; hu.set([0.5, 0.45, 0.35]); }
          }
          hu.h.visible = U.length > 0;
          sc.begin();
          const col = isW ? 'red' : 'green';
          spanDraw(sc, U, { color: col, r: 1.7 });
          let Tu = null, out = 0;
          if (U.length) {
            const u = hu.p; Tu = mv(T, u);
            const foot = projN(Tu, U); out = normN(sub3(Tu, foot));
            if (out > 1e-6) sc.line(Tu, foot, { color: 'red', width: 1.6, dash: [4, 3] });
            sc.arrow([0, 0, 0], Tu, { color: isW && out > 1e-6 ? 'red' : 'orange', width: 2.6 });
            sc.arrow([0, 0, 0], u, { color: 'accent', width: 2.8 });
            sc.tex('Tu', Tu, { color: isW && out > 1e-6 ? 'red' : 'orange', dx: 14, dy: -10, size: 14 });
          }
          sc.flush();
          S3.setTitle(isW ? '$W$: $Tu$ leaves the plane' : `$U$ = ${['$\\{0\\}$', 'a line', 'a plane', '$V$'][U.length]}: $Tu \\in U$`);
          let pu = null;
          if (!isW) {
            const nd = info[sIdx], dv = pDiv(pT, nd.p);
            pu = { nd, q: dv.q, rmax: Math.max(...dv.r.map(Math.abs)), killed: U.length ? normN(mv(pOfMat(M, nd.p, T), hu.p)) : 0 };
          }
          st = { fT, isW, wInfo, pu, out, dim: U.length };
        });
        v.legend([['accent', '$u \\in U$'], ['orange', '$Tu$'], ['green', 'invariant subspaces containing $U$'], ['red', '$W$, not invariant', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          if (st.isW) {
            const { wInfo } = st, rm = Math.max(...wInfo.r.map(Math.abs));
            return `$Tu$ is at distance ${tn(st.out, 3)} from $W$, so $W$ is not invariant and $T|_W$ is not an operator on $W$ — 5.31 says nothing. Its nearest stand-in, the compression $P_W T|_W$, has minimal polynomial $${wInfo.f}$, and dividing $p_T = ${st.fT}$ by it leaves the remainder $${polyT(wInfo.r)}$` + (rm > 1e-6 ? ' $\\ne 0$: **not a divisor**.' : '.');
          }
          const { nd, q, rmax, killed } = st.pu;
          return `$p_T = ${st.fT}$ and $p_{T|_U} = ${nd.f}$. Long division gives $p_T = p_{T|_U}\\cdot(${polyT(q)})$ with remainder of size $${v.sci(rmax, 1)}$ — **a polynomial multiple** ✓.` + (st.dim ? ` For your $u$: $\\lVert p_{T|_U}(T)\\,u\\rVert = ${v.sci(killed, 1)}$.` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 5.32
    {
      num: '5.32',
      kind: 'Theorem',
      name: 'Not invertible ⟺ minimal polynomial has constant term 0',
      statement: String.raw`Suppose $V$ is finite-dimensional and $T \in \mathcal L(V)$. Then $T$ is not invertible if and only if the constant term of the minimal polynomial of $T$ is $0$.`,
      idea: String.raw`Let $p$ be the minimal polynomial of $T$. Three equivalences chain together: $T$ is not invertible $\iff$ $T - 0I$ is not injective, i.e. $0$ is an eigenvalue of $T$ (5.7); $\iff$ $0$ is a zero of $p$ (5.27); $\iff$ the constant term $p(0)$ of $p$ is $0$. Conversely, when $p(0) = a_0 \ne 0$, the equation $p(T) = 0$ can be solved for $I$, giving the inverse as a polynomial in $T$: $T^{-1} = -\tfrac{1}{a_0}\bigl(a_1 I + a_2 T + \dots + T^{m-1}\bigr)$.`,
      caption: String.raw`Slide $t$. Left: the zeros of the minimal polynomial of $T$ (gold), computed from the definition, move through $\mathbf C$ along the faint tracks; the origin is circled. Right: the constant term $p(0)$ as a function of $t$, with red lines where $T$ is singular (found independently, from $\det T = 0$). The curve crosses $0$ exactly on the red lines — exactly when a zero of $p$ passes through the origin. Complex zeros (third family) never cause singularity for real $t$.`,
      deps: ['ladr-5.7', 'ladr-5.27'],
      tags: ['minimal polynomial', 'invertibility'],
      viz(v) {
        const M = v.M;
        const S0 = [[1, 0.5, 0.2], [0.3, 1, -0.4], [-0.2, 0.6, 1]];
        const T0 = conj(M, S0, [[-1, 0, 0], [0, 0.5, 0], [0, 0, 1.5]]);
        const T1 = conj(M, S0, [[1, 0, 0], [0, -0.5, -1.2], [0, 1.2, -0.5]]);
        const FAM = {
          tri: { label: 'triangular, entry $t$', A: (t) => [[t, 1, 0.5], [0, 1.5, 1], [0, 0, -1]], tex: String.raw`\begin{pmatrix} t & 1 & 0.5\\ 0 & 1.5 & 1\\ 0 & 0 & -1\end{pmatrix}` },
          shift: { label: '$T_0 - tI$ (real eigenvalues)', A: (t) => shiftI(T0, t), tex: 'T_0 - tI' },
          cx: { label: '$T_1 - tI$ (a complex pair)', A: (t) => shiftI(T1, t), tex: 'T_1 - tI' },
        };
        const fam = v.select('family', Object.entries(FAM).map(([value, F]) => ({ value, label: F.label })), 'tri');
        const ts = v.slider('$t$', -2, 2, 0.4, { step: 0.01 });
        const Z = v.stage({ x: [-3.3, 3.3], y: [-2, 2], equal: true, height: 330, xlabel: 'Re', ylabel: 'Im', title: 'zeros of the minimal polynomial $p$' });
        const G = v.stage({ x: [-2, 2], y: [-3, 3], height: 330, axes: 'box', xlabel: 't', title: 'constant term $p(0)$' });
        const cache = {};
        function sweep(k) {
          if (cache[k]) return cache[k];
          const F = FAM[k], N = 200, ts0 = [], c0 = [], tracks = [], sing = [];
          for (let i = 0; i <= N; i++) {
            const t = -2 + (4 * i) / N, p = minPoly(M, F.A(t));
            ts0.push(t); c0.push(p[0]); tracks.push(...rootsOf(M, p));
          }
          const det = (t) => M.det(F.A(t));
          for (let i = 0; i < N; i++) {
            let a = ts0[i], b = ts0[i + 1], fa = det(a), fb = det(b);
            if (fa === 0) { sing.push(a); continue; }
            if (fa * fb < 0) { for (let it = 0; it < 60; it++) { const m = (a + b) / 2, fm = det(m); if (fa * fm <= 0) { b = m; fb = fm; } else { a = m; fa = fm; } } sing.push((a + b) / 2); }
          }
          const lo = Math.min(...c0), hi = Math.max(...c0), pad = 0.12 * (hi - lo || 1);
          return (cache[k] = { ts0, c0, tracks, sing, yr: [Math.min(lo - pad, -0.5), Math.max(hi + pad, 0.5)] });
        }
        let st = null;
        v.render(() => {
          const F = FAM[fam.value], sw = sweep(fam.value), t = ts.value, A = F.A(t);
          const p = minPoly(M, A), z = rootsOf(M, p), c0 = p[0];
          const sc = Math.max(1, ...p.map(Math.abs)), singNow = Math.abs(c0) < 1e-7 * sc;
          // ---- zeros in C
          Z.dots(sw.tracks.map(([x, y]) => [x, y]), { r: 1.3, color: 'faint' });
          Z.circle(0, 0, 0.16, { color: singNow ? 'red' : 'muted', width: singNow ? 2.6 : 1.4, dash: singNow ? false : [3, 3] });
          z.forEach(([x, y]) => Z.dot(x, y, { r: 6, color: 'gold' }));
          if (singNow) Z.tex('p(0) = 0', 0, 0, { color: 'red', dy: -24, size: 14 });
          Z.corner(`deg p = ${p.length - 1}`, 'tl', { color: 'muted' });
          Z.texPx(`T = ${mtex(A)}`, 12, Z.height - 12, { align: 'left', baseline: 'bottom', size: 12, color: 'muted' });
          // ---- p(0) against t
          G.setView([-2, 2], sw.yr);
          G.hline(0, { color: 'muted', width: 1 });
          for (const s of sw.sing) { G.vline(s, { color: 'red', width: 1.6, dash: [5, 4] }); G.text('singular', s, sw.yr[1], { color: 'red', size: 11, align: 'center', baseline: 'top', dy: 4 }); }
          G.path(sw.ts0.map((x, i) => [x, sw.c0[i]]), { color: 'accent', width: 2.4 });
          G.vline(t, { color: 'gold', width: 1.2, alpha: 0.6 });
          G.dot(t, c0, { r: 6, color: singNow ? 'red' : 'gold' });
          // ---- inverse as a polynomial in T
          let invErr = null, Tinv = null;
          if (!singNow) {
            const q = p.slice(1).map((a) => -a / c0);                                 // T⁻¹ = q(T)
            Tinv = pOfMat(M, q, A); invErr = maxAbs(M.matMul(A, Tinv).map((r, i) => r.map((x, j) => x - (i === j ? 1 : 0))));
          }
          const nul = singNow ? M.nullspace(A, 1e-7)[0] : null;
          st = { p, c0, singNow, invErr, nul, F, t };
        });
        v.legend([['gold', 'zeros of $p$', { dot: true }], ['accent', '$p(0)$ as $t$ varies'], ['red', '$T$ singular', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { p, c0, singNow, invErr, nul } = st;
          const head = `$p(z) = ${polyT(p)}$, constant term $p(0) = ${tn(c0, 3)}$. `;
          if (singNow) return head + `Since $p(0) = 0$, the number $0$ is a zero of $p$, hence an eigenvalue: **$T$ is not invertible** — it kills $v = ${vtex(nul, 2)}$.`;
          return head + `$p(0) \\ne 0$, so $T$ is invertible, and $p(T) = 0$ solved for $I$ gives $T^{-1} = ${c0 < 0 ? '' : '-'}\\tfrac{1}{${tn(Math.abs(c0), 3)}}\\bigl(${polyOpT(p.slice(1))}\\bigr)$: $\\max|T\\,T^{-1} - I| = ${v.sci(invErr, 1)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.33
    {
      num: '5.33',
      kind: 'Theorem',
      name: 'Even-dimensional null space',
      statement: String.raw`Suppose $\mathbf F = \mathbf R$, $V$ is finite-dimensional, $T \in \mathcal L(V)$, and $b, c \in \mathbf R$ satisfy $b^2 < 4c$. Then $\dim \operatorname{null}(T^2 + bT + cI)$ is an even number.`,
      idea: String.raw`The null space is invariant under $T$ (5.18), so replace $V$ by it and assume $T^2 + bT + cI = 0$. Then $T$ has no eigenvector: $Tv = \lambda v$ would give $0 = (\lambda^2 + b\lambda + c)v = \bigl((\lambda + \tfrac b2)^2 + c - \tfrac{b^2}{4}\bigr)v$ with a positive scalar. Now take an invariant subspace $U$ of even dimension that is as large as possible. If some $w \notin U$, then $W = \operatorname{span}(w, Tw)$ is invariant (because $T^2w = -bTw - cw$), two-dimensional (no eigenvectors) and meets $U$ only in $0$ (an invariant line would be an eigenline), so $U + W$ is invariant of even dimension $\dim U + 2$ (2.43) — a contradiction. Hence $U = V$.`,
      caption: String.raw`An operator $T$ on $\mathbf R^4$, in a random basis. Drag the point $(b, c)$; above the parabola $c = b^2/4$ (green) the hypothesis $b^2 < 4c$ holds. The right panel shows the four singular values of $T^2 + bT + cI$ (log scale): the number that vanish is $\dim\operatorname{null}$. Above the parabola they vanish **in pairs**, at the purple points $(-2\alpha, \alpha^2 + \beta^2)$ given by eigenvalue pairs $\alpha \pm i\beta$ of $T$. Below it (third operator) the orange tangent lines, one for each real eigenvalue, give dimension $1$ — odd.`,
      deps: ['ladr-5.18', 'ladr-2.43', 'ladr-5.5'],
      tags: ['eigenvalues'],
      viz(v) {
        const M = v.M;
        const blk = (a, b) => [[a, -b], [b, a]];
        const diag2 = (A, B) => [[A[0][0], A[0][1], 0, 0], [A[1][0], A[1][1], 0, 0], [0, 0, B[0][0], B[0][1]], [0, 0, B[1][0], B[1][1]]];
        const PRE = {
          two: { label: 'two conjugate pairs', B: diag2(blk(0.5, 1), blk(-1, 0.6)) },
          same: { label: 'one pair, twice', B: diag2(blk(0.5, 1), blk(0.5, 1)) },
          mixed: { label: 'a pair and two real eigenvalues', B: diag2(blk(0.5, 1), [[-1.2, 0], [0, 0.8]]) },
        };
        const pre = v.select('operator $T$ on $\\mathbf R^4$', Object.entries(PRE).map(([value, P]) => ({ value, label: P.label })), 'two');
        let seed = 3;
        v.button('Random basis', () => { seed++; });
        const P = v.stage({ x: [-3.2, 3.2], y: [-1.9, 3.3], height: 360, weight: 1.35, xlabel: 'b', ylabel: 'c', title: 'the $(b, c)$-plane of $x^2 + bx + c$' });
        const Q = v.stage({ x: [0.3, 4.7], y: [2e-8, 300], ylog: true, height: 360, weight: 0.8, minWidth: 230, axes: 'box', xticks: [[1, 'σ₁'], [2, 'σ₂'], [3, 'σ₃'], [4, 'σ₄']], title: 'singular values of $T^2 + bT + cI$' });
        let geom = { pairs: [], reals: [], cross: [] };
        const h = P.handle(-1, 1.25, {
          color: 'accent',
          constrain: (x, y) => {
            for (const [b, c] of [...geom.pairs, ...geom.cross]) if (Math.hypot(x - b, y - c) < 0.16) return [b, c];
            if (y < x * x / 4) for (const l of geom.reals) { const d = (l * l + x * l + y) / Math.hypot(l, 1); if (Math.abs(d) < 0.09) { const n = [l, 1].map((c) => c / Math.hypot(l, 1)); return [x - d * n[0], y - d * n[1]]; } }
            return [x, y];
          },
        });
        let key = '', T = null, st = null;
        v.render(() => {
          const k = `${pre.value}|${seed}`;
          if (k !== key) {
            key = k;
            const r = v.rng(seed * 101 + 7); let S;
            do { S = [0, 1, 2, 3].map(() => [0, 1, 2, 3].map(() => r.normal())); } while (Math.abs(M.det(S)) < 0.6);
            T = conj(M, S, PRE[pre.value].B);
            const ev = M.eig(T, { vectors: false }).values;                        // located from T itself
            const pairs = [], reals = [];
            for (const z of ev) {
              if (Math.abs(z.im) > 1e-6) { if (z.im > 0) { const p = [-2 * z.re, z.re * z.re + z.im * z.im]; if (!pairs.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-4)) pairs.push(p); } }
              else if (!reals.some((q) => Math.abs(q - z.re) < 1e-6)) reals.push(z.re);
            }
            const cross = [];
            for (let i = 0; i < reals.length; i++) for (let j = i; j < reals.length; j++) cross.push([-(reals[i] + reals[j]), reals[i] * reals[j]]);
            geom = { pairs, reals, cross };
          }
          const b = h.x, c = h.y, T2 = M.matMul(T, T);
          const Qm = T2.map((r, i) => r.map((x, j) => x + b * T[i][j] + (i === j ? c : 0)));
          const sv = M.svd(Qm).S, tol = 1e-9 * (1 + maxAbs(T2));
          const dim = sv.filter((s) => s <= tol).length, hyp = b * b < 4 * c;
          // ---- (b, c)-plane
          P.between((x) => x * x / 4, () => 3.3, -3.2, 3.2, { fill: 'green', fillAlpha: 0.09 });
          P.fn((x) => x * x / 4, { color: 'green', width: 2.2 });
          P.text('b² < 4c: no real zeros', -3.05, 3.05, { color: 'green', size: 12, weight: 600 });
          P.text('b² ≥ 4c', 1.7, -1.6, { color: 'muted', size: 12, weight: 600 });
          for (const l of geom.reals) { P.fn((x) => -l * l - x * l, { color: 'orange', width: 1.8, dash: [6, 4] }); P.dot(-2 * l, l * l, { r: 3, color: 'orange' }); }
          for (const [x, y] of geom.cross) P.dot(x, y, { r: 4.5, color: 'orange' });
          for (const [x, y] of geom.pairs) P.dot(x, y, { r: 7, color: 'purple', hollow: true, width: 2.6 });
          geom.pairs.forEach(([x, y], i) => { const a = -x / 2, bb = Math.sqrt(Math.max(0, y - a * a)); P.tex(`${tn(a)} \\pm ${tn(bb) === '1' ? '' : tn(bb)}i`, x, y, { color: 'purple', size: 12.5, dy: -18 }); });
          geom.reals.forEach((l) => { const b0 = -2 * l - 0.85 * Math.sign(-2 * l || 1); P.tex(`\\lambda = ${tn(l)}`, b0, -l * l - b0 * l, { color: 'orange', size: 12.5, dy: 14, dx: l > 0 ? 30 : -30 }); });
          // ---- singular values
          const lo = 1e-6;
          sv.forEach((s, i) => {
            const zero = s <= tol, x = i + 1;
            if (zero) Q.line(x - 0.3, lo, x + 0.3, lo, { color: 'green', width: 3 });
            else Q.rect(x - 0.3, lo, x + 0.3, Math.max(s, lo * 1.001), { fill: 'accent', fillAlpha: 0.45, color: 'accent', width: 1.4 });
            Q.text(zero ? '0' : pn(s, s < 0.01 ? 4 : 2), x, Math.max(s, lo), { align: 'center', baseline: 'bottom', dy: -4, size: zero ? 14 : 11.5, color: zero ? 'green' : 'ink', weight: 700 });
          });
          Q.corner(`dim null = ${dim}`, 'tr', { color: dim ? (dim % 2 ? 'red' : 'green') : 'muted', weight: 700, size: 13 });
          st = { b, c, dim, hyp };
        });
        v.legend([['green', 'region $b^2 < 4c$', { area: true }], ['purple', 'eigenvalue pair $\\alpha\\pm i\\beta$ ↦ $(-2\\alpha,\\,\\alpha^2+\\beta^2)$', { dot: true }], ['orange', 'real eigenvalue $\\lambda$: $\\lambda^2 + b\\lambda + c = 0$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { b, c, dim, hyp } = st, disc = b * b - 4 * c;
          const head = `$${polyT([c, b, 1], 'x')}$: $b^2 - 4c = ${tn(disc, 3)}$ ${hyp ? '$< 0$ (hypothesis holds)' : '$\\ge 0$ (hypothesis broken)'}; $\\dim\\operatorname{null}(T^2 + bT + cI) = ${dim}$`;
          if (hyp) return head + (dim ? ` — even ✓: the null space is ${dim === 2 ? 'an invariant plane' : 'all of $\\mathbf R^4$'} on which $T$ turns like $\\alpha \\pm i\\beta$.` : ' — even ✓ (drag onto a purple point to make it positive).');
          return head + (dim % 2 ? ' — **odd**: with real zeros the quadratic splits into linear factors, and a single eigenvector contributes one dimension.' : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 5.34
    {
      num: '5.34',
      kind: 'Theorem',
      name: 'Operators on odd-dimensional spaces have eigenvalues',
      statement: String.raw`Every operator on an odd-dimensional vector space has an eigenvalue. (Over $\mathbf C$ this is already known for every nonzero finite dimension (5.19); the new content is the case $\mathbf F = \mathbf R$.)`,
      idea: String.raw`Induction on the odd number $n = \dim V$, in steps of two; $n = 1$ is clear. Let $p$ be the minimal polynomial of $T$. If $p$ has a factor $z - \lambda$ with $\lambda \in \mathbf R$, then $\lambda$ is an eigenvalue (5.27). Otherwise, by the factorization over $\mathbf R$ (4.16), $p = q\cdot(z^2 + bz + c)$ with $b^2 < 4c$. Then $q(T)$ vanishes on $\operatorname{range}(T^2 + bT + cI)$, and $\deg q < \deg p$ forces that range to be a proper subspace. Its null space has even dimension (5.33), so by the fundamental theorem of linear maps (3.21) the range has odd dimension less than $n$; it is invariant (5.18), so the induction hypothesis gives an eigenvalue of $T$ restricted to it.`,
      caption: String.raw`Press **Random $T$** repeatedly. On $\mathbf R^3$ a real eigenvector line (green) appears every time: when $T$ also has a pair of nonreal eigenvalues, the purple plane is $\operatorname{null}(T^2 + bT + cI)$ — even-dimensional, where $T$ turns vectors — and the green line is the range of the same operator, odd-dimensional and invariant. Drag $u$ onto the line: $Tu$ becomes parallel to $u$. Switch to $\mathbf R^2$ and many operators have no real eigenvector at all. The bar chart counts, for each size $n$, how many of 300 random real $n\times n$ matrices have a real eigenvalue.`,
      deps: ['ladr-5.27', 'ladr-4.16', 'ladr-3.21', 'ladr-5.33', 'ladr-5.18'],
      tags: ['eigenvalues'],
      viz(v) {
        const M = v.M;
        const dimS = v.select('$V$', [{ value: '3', label: '$\\mathbf R^3$ (odd)' }, { value: '2', label: '$\\mathbf R^2$ (even)' }], '3');
        let seed = 2;
        v.button('Random $T$', () => { seed++; });
        const S = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, axes: false, height: 380, weight: 1.15, title: 'an operator $T$ on $V$' });
        const sc = v.scene3(S, { yaw: 0.35, pitch: 0.42, axis: 1.6, lim: 1.3 });
        const B = v.stage({ x: [-0.25, 7.65], y: [-0.09, 1.3], height: 380, weight: 0.85, minWidth: 240, axes: 'box', xlabel: 'n',
          xticks: [1, 2, 3, 4, 5, 6, 7], yticks: [[0, '0%'], [0.25, '25%'], [0.5, '50%'], [0.75, '75%'], [1, '100%']], title: 'random $n\\times n$ real matrices with a real eigenvalue' });
        // the tally, computed once: entries independent standard normal
        const frac = [];
        { const r = v.rng(20240); for (let n = 1; n <= 7; n++) { let k = 0; for (let t = 0; t < 300; t++) { const A = Array.from({ length: n }, () => Array.from({ length: n }, () => r.normal())); if (M.eig(A, { vectors: false }).values.some((z) => Math.abs(z.im) <= 1e-10 * (1 + Math.abs(z.re)))) k++; } frac.push(k / 300); } }
        let T = null, key = '', info = null;
        const snap = (p) => {
          if (!info) return p;
          for (const e of info.lines) { const d = dotN(p, e), l = normN(p); if (l > 0.15 && Math.abs(d) / l > Math.cos((7 * Math.PI) / 180)) return mul3(e, d); }
          return p;
        };
        const hu = sc.handle([0.8, 0.3, 0.5], { color: 'accent', label: 'u', snap });
        function make() {
          const r = v.rng(seed * 7919 + 11), n = +dimS.value;
          let Sm; do { Sm = Array.from({ length: n }, () => Array.from({ length: n }, () => r.normal())); } while (Math.abs(M.det(Sm)) < 0.5);
          const ru = () => (r() < 0.5 ? -1 : 1) * r.uniform(0.55, 1.4);
          const cx = r() < 0.72 || seed === 2, a = r.uniform(-0.6, 0.6), b = r.uniform(0.5, 1.1), lam = ru();
          let D;
          if (n === 3) D = cx ? [[a, -b, 0], [b, a, 0], [0, 0, lam]] : [[lam, 0, 0], [0, ru(), 0], [0, 0, ru()]];
          else D = cx ? [[a, -b], [b, a]] : [[lam, 0], [0, ru()]];
          T = conj(M, Sm, D);
          const E = M.eig(T), lines = [], vals = [];
          E.values.forEach((z, i) => { if (Math.abs(z.im) < 1e-9 && E.vectors[i]) { const e = unitN(E.vectors[i]); if (!lines.some((f) => Math.abs(dotN(e, f)) > 1 - 1e-6)) { lines.push(n === 2 ? [e[0], e[1], 0] : e); vals.push(z.re); } } });
          const pair = E.values.find((z) => z.im > 1e-9);
          info = { n, lines, vals, pair, E };
          if (n === 3 && pair) {
            const q = [pair.re * pair.re + pair.im * pair.im, -2 * pair.re, 1], Q = pOfMat(M, q, T);
            info.q = q; info.N = M.nullspace(Q, 1e-7); info.R = orthN([0, 1, 2].map((k) => colOf(Q, k)), 1e-6);
          }
          info.p = minPoly(M, T);
          hu.mode = n === 2 ? 'plane' : 'free'; hu.a = [1, 0, 0]; hu.b = [0, 1, 0];
          hu.set(n === 2 ? [0.85, 0.35, 0] : [0.8, 0.3, 0.5]);
        }
        let st = null;
        v.render(() => {
          const k = `${seed}|${dimS.value}`; if (k !== key) { key = k; make(); }
          const n = info.n, T3 = n === 3 ? T : [[T[0][0], T[0][1], 0], [T[1][0], T[1][1], 0], [0, 0, 0]];
          sc.begin();
          if (n === 2) sc.disc([1, 0, 0], [0, 1, 0], 1.8, { fill: 'faint', color: 'muted', fillAlpha: 0.1, grid: true });
          if (info.N) sc.disc(info.N[0], info.N[1], 1.7, { fill: 'purple', color: 'purple', fillAlpha: 0.12, grid: true });
          info.lines.forEach((e) => sc.line(mul3(e, -2), mul3(e, 2), { color: 'green', width: 3.6, alpha: 0.75 }, 16));
          const u = hu.p, Tu = mv(T3, u), par = normN(cross3(u, Tu)) < 1e-6 * (1 + normN(Tu)) && normN(u) > 1e-6;
          sc.arrow([0, 0, 0], Tu, { color: par ? 'green' : 'orange', width: 2.6 });
          sc.arrow([0, 0, 0], u, { color: 'accent', width: 2.8 });
          sc.tex(par ? 'Tu = \\lambda u' : 'Tu', Tu, { color: par ? 'green' : 'orange', dx: 18, dy: -10, size: 14 });
          sc.flush();
          if (!info.lines.length) S.corner('no real eigenvector: every direction is turned', 'tl', { color: 'red', weight: 700, size: 12.5 });
          else S.corner(info.N ? 'green line = range of T² + bT + cI' : `${info.lines.length} real eigenline${info.lines.length > 1 ? 's' : ''}`, 'tl', { color: 'green', weight: 700, size: 12.5 });
          // ---- tally
          frac.forEach((f, i) => {
            const m = i + 1, odd = m % 2 === 1, cur = m === n, col = odd ? 'green' : 'orange';
            B.rect(m - 0.34, 0, m + 0.34, f, { fill: col, fillAlpha: cur ? 0.6 : 0.3, color: col, width: cur ? 2.6 : 1.2 });
            B.text(`${Math.round(f * 100)}%`, m, f, { align: 'center', baseline: 'bottom', dy: -3, size: 11, color: col, weight: 700 });
          });
          B.text('odd n: every time', 0.1, 1.22, { color: 'green', weight: 700, size: 12 });
          // the turning angle on R², for the readout
          let minAng = null;
          if (n === 2) { minAng = Infinity; for (let i = 0; i < 360; i++) { const t = (Math.PI * i) / 360, w = [Math.cos(t), Math.sin(t), 0], Tw = mv(T3, w); minAng = Math.min(minAng, Math.asin(Math.min(1, normN(cross3(w, Tw)) / (normN(Tw) || 1)))); } }
          st = { u, Tu, par, minAng };
        });
        v.legend([['green', 'real eigenvector line'], ['purple', '$\\operatorname{null}(T^2+bT+cI)$', { area: true }], ['accent', '$u$'], ['orange', '$Tu$']]);
        v.readout(() => {
          if (!st || !info) return '';
          const fp = factored(M, info.p), ev = info.E.values.map((z) => (Math.abs(z.im) < 1e-9 ? tn(z.re) : `${tn(z.re)} ${z.im > 0 ? '+' : '-'} ${tn(Math.abs(z.im))}i`)).join(',\\ ');
          let s = `Minimal polynomial $${fp}$ (eigenvalues $${ev}$). `;
          if (info.n === 3 && info.N) {
            const [c0, b0] = info.q;
            s += `With $x^2 + bx + c = ${polyT(info.q, 'x')}$ ($b^2 - 4c = ${tn(b0 * b0 - 4 * c0)} < 0$): $\\dim\\operatorname{null} = ${info.N.length}$ (even), so $\\dim\\operatorname{range} = 3 - ${info.N.length} = ${info.R.length}$ — odd, invariant, hence an eigenline with $\\lambda = ${tn(info.vals[0])}$.`;
          } else if (info.lines.length) s += 'The minimal polynomial splits into real linear factors, so each of its zeros is an eigenvalue (5.27).';
          else s += `No real eigenvalue: every vector is turned by at least ${tn((st.minAng * 180) / Math.PI, 1)}°. Even dimension allows this.`;
          if (st.par) s += ` Your $u$ is an eigenvector: $Tu = ${tn(dotN(st.Tu, st.u) / dotN(st.u, st.u))}\\,u$.`;
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 5.35
    {
      num: '5.35',
      kind: 'Definition',
      name: 'Matrix of an operator',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ and $v_1, \dots, v_n$ is a basis of $V$. The **matrix of $T$** with respect to this basis is the $n$-by-$n$ matrix $\mathcal M(T) = \mathcal M\bigl(T, (v_1,\dots,v_n)\bigr)$ whose entries $A_{j,k}$ are defined by
$$Tv_k = A_{1,k}v_1 + \dots + A_{n,k}v_n \qquad (k = 1, \dots, n).$$
So column $k$ lists the coordinates of $Tv_k$ in the same basis. For an operator on $\mathbf F^n$ with no basis specified, the standard basis is meant, and column $k$ is then $T$ applied to the $k$-th standard basis vector.`,
      idea: String.raw`This is the matrix of a linear map (3.31) in the special case $W = V$, where one uses the *same* basis for the domain and the target — which is why operators have square matrices. The operator is a geometric object; the matrix is a description of it in one coordinate system, and changing the basis changes the description but not the operator. Much of the rest of the book is the search for a basis in which this matrix is as simple as possible: upper triangular (5.38) or diagonal (5.50).`,
      caption: String.raw`The operator $T$ is fixed: it always sends the faint F to the blue F. Drag the basis vectors $v_1$, $v_2$. The tilted grid is the coordinate system of the basis; the dashed paths show $Tv_1$ and $Tv_2$ reached by walking along $v_1$ and then along $v_2$ — those step lengths are the columns of $\mathcal M(T)$ on the right. Drag $v_1$ near an eigen-direction (it snaps): the first column becomes $(\lambda, 0)$. Snap both, and the matrix is diagonal.`,
      deps: ['ladr-3.31', 'ladr-5.1'],
      tags: ['matrices'],
      viz(v) {
        const M = v.M;
        const r50 = (50 * Math.PI) / 180;
        const OPS = {
          axler: { label: 'Axler 5.51, divided by 46', A: [[41 / 46, 7 / 46], [-20 / 46, 74 / 46]] },
          shear: { label: 'a shear', A: [[1, 0.8], [0, 1]] },
          rot: { label: 'rotate 50°, stretch 1.1', A: [[1.1 * Math.cos(r50), -1.1 * Math.sin(r50)], [1.1 * Math.sin(r50), 1.1 * Math.cos(r50)]] },
        };
        const op = v.select('operator $T$', Object.entries(OPS).map(([value, O]) => ({ value, label: O.label })), 'axler');
        const P = v.stage({ x: [-2.5, 2.5], y: [-2.1, 2.3], equal: true, axes: false, height: 380, weight: 1.3, title: 'the operator $T$ and the grid of the basis $v_1, v_2$' });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, weight: 0.7, minWidth: 230 });
        const FSH = [[0, 0], [0.28, 0], [0.28, 0.42], [0.66, 0.42], [0.66, 0.62], [0.28, 0.62], [0.28, 0.8], [0.8, 0.8], [0.8, 1], [0, 1]].map(([x, y]) => [x - 1.3, y - 1.3]);
        let eigdirs = [];
        const snapDir = (x, y) => {
          const l = Math.hypot(x, y); if (l < 0.12) return [x, y];
          for (const e of eigdirs) { const c = (x * e[0] + y * e[1]) / l; if (Math.abs(c) > Math.cos((5 * Math.PI) / 180)) { const s = Math.sign(c) * l; return [s * e[0], s * e[1]]; } }
          return [x, y];
        };
        const h1 = P.handle(1.15, -0.15, { color: 'blue', label: 'v₁', constrain: snapDir }), h2 = P.handle(-0.45, 0.95, { color: 'purple', label: 'v₂', constrain: snapDir });
        const TM = v.table(Q, { rows: 2, cols: 2, region: [0, 0.48, 1, 0.95], maxCell: 60, size: 16, rowLabels: ['$v_1$', '$v_2$'], colLabels: ['$Tv_1$', '$Tv_2$'] });
        const TS = v.table(Q, { rows: 2, cols: 2, region: [0, 0.02, 1, 0.4], maxCell: 46, size: 13, rowLabels: ['$e_1$', '$e_2$'], colLabels: ['$Te_1$', '$Te_2$'] });
        let st = null;
        v.render(() => {
          const A = OPS[op.value].A;
          const E = M.eig(A); eigdirs = E.values.map((z, i) => (Math.abs(z.im) < 1e-9 && E.vectors[i] ? unitN(E.vectors[i]) : null)).filter(Boolean);
          const v1 = [h1.x, h1.y], v2 = [h2.x, h2.y], det = v1[0] * v2[1] - v1[1] * v2[0], ok = Math.abs(det) > 0.04;
          const ap = (p) => mv(A, p);
          // the grid of the basis
          if (ok) for (let k = -5; k <= 5; k++) {
            P.line(k * v1[0] - 6 * v2[0], k * v1[1] - 6 * v2[1], k * v1[0] + 6 * v2[0], k * v1[1] + 6 * v2[1], { color: k ? 'grid' : 'muted', width: k ? 1 : 1.4 });
            P.line(k * v2[0] - 6 * v1[0], k * v2[1] - 6 * v1[1], k * v2[0] + 6 * v1[0], k * v2[1] + 6 * v1[1], { color: k ? 'grid' : 'muted', width: k ? 1 : 1.4 });
          }
          for (const e of eigdirs) P.line(-4 * e[0], -4 * e[1], 4 * e[0], 4 * e[1], { color: 'green', width: 1.2, dash: [2, 5], alpha: 0.8 });
          P.poly(FSH, { color: 'muted', width: 1.2, fill: 'muted', fillAlpha: 0.06 });
          P.poly(FSH.map(ap), { color: 'accent', width: 2, fill: 'accent', fillAlpha: 0.16 });
          let C = null;
          if (ok) {
            const Bi = M.inverse([[v1[0], v2[0]], [v1[1], v2[1]]]);
            C = M.matMul(Bi, M.matMul(A, [[v1[0], v2[0]], [v1[1], v2[1]]]));          // M(T, (v1, v2))
            [[v1, 0, 'blue'], [v2, 1, 'purple']].forEach(([w, k, col]) => {
              const a = C[0][k], b = C[1][k], m1 = [a * v1[0], a * v1[1]], Tw = ap(w);
              P.path([[0, 0], m1, Tw], { color: col, width: 1.6, dash: [5, 4], alpha: 0.85 });
              P.arrow(0, 0, Tw[0], Tw[1], { color: col, width: 2.4, alpha: 0.75, head: 9 });
              P.tex(`Tv_${k + 1}`, Tw[0], Tw[1], { color: col, size: 13.5, dx: 14, dy: -10 });
            });
          }
          P.arrow(0, 0, v1[0], v1[1], { color: 'blue', width: 3 }); P.arrow(0, 0, v2[0], v2[1], { color: 'purple', width: 3 });
          if (!ok) P.corner('v₁, v₂ are dependent: not a basis', 'tl', { color: 'red', weight: 700 });
          else if (Math.abs(C[1][0]) < 1e-9 && Math.abs(C[0][1]) < 1e-9) P.corner('a basis of eigenvectors: the matrix is diagonal', 'tl', { color: 'green', weight: 700 });
          else if (Math.abs(C[1][0]) < 1e-9) P.corner('v₁ is an eigenvector: first column is (λ, 0)', 'tl', { color: 'green', weight: 700 });
          const fm = (x) => (typeof x === 'number' ? pn(x, 2) : x), colc = (i, j) => (j === 0 ? 'blue' : 'purple');
          TM.draw({ value: (i, j) => (ok ? C[i][j] : '—'), format: fm, textColor: colc, fill: (i, j) => (ok && i !== j && Math.abs(C[i][j]) < 1e-9 ? ['green', 0.2] : [colc(i, j), 0.08]) });
          TS.draw({ value: (i, j) => A[i][j], format: fm, textColor: () => 'muted' });
          ttl(Q, TM, '\\mathcal M\\bigl(T, (v_1, v_2)\\bigr)', 'ink', false, 15);
          ttl(Q, TS, '\\mathcal M(T)\\ \\text{in the standard basis}', 'muted', false, 13);
          st = { ok, C };
        });
        v.legend([['muted', 'F', { area: true }], ['accent', '$T$(F) — never changes', { area: true }], ['green', 'eigen-directions', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          if (!st.ok) return 'Move $v_1$, $v_2$ apart: a dependent list is not a basis, and coordinates in it are not defined.';
          const C = st.C, cb = (a, b) => `${tn(a)}\\,v_1 ${b < 0 ? '-' : '+'} ${tn(Math.abs(b))}\\,v_2`;
          return `$Tv_1 = ${cb(C[0][0], C[1][0])}$ and $Tv_2 = ${cb(C[0][1], C[1][1])}$, so (column $k$ = coordinates of $Tv_k$) $\\mathcal M\\bigl(T,(v_1,v_2)\\bigr) = ${mtex(C)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.38
    {
      num: '5.38',
      kind: 'Definition',
      name: 'Upper-triangular matrix',
      statement: String.raw`A square matrix is **upper triangular** if all its entries below the diagonal are $0$: $A_{j,k} = 0$ whenever $j > k$. (The *diagonal* consists of the entries $A_{1,1}, \dots, A_{n,n}$ from the upper left to the lower right corner.) One usually writes such a matrix as
$$\begin{pmatrix} \lambda_1 & & * \\ & \ddots & \\ 0 & & \lambda_n \end{pmatrix},$$
with $*$ standing for entries that are unknown or irrelevant.`,
      idea: String.raw`For the matrix of an operator with respect to $v_1, \dots, v_n$, column $k$ lists the coordinates of $Tv_k$ (5.35). Zeros below the diagonal in column $k$ say that $Tv_k$ needs only $v_1, \dots, v_k$. So $T$ maps the line $\operatorname{span}(v_1)$ into itself, the plane $\operatorname{span}(v_1, v_2)$ into itself, and so on: a nested chain of invariant subspaces (made precise in 5.39). At least $n(n-1)/2$ of the $n^2$ entries are forced to be $0$ — almost half when $n$ is large.`,
      caption: String.raw`Edit the matrix on the right (click the top or bottom half of an entry, or drag it up/down). The arrows on the left are its columns $Te_1$, $Te_2$, $Te_3$ in $\mathbf R^3$. With the entries below the diagonal locked at $0$, $Te_1$ stays on the teal line $\operatorname{span}(e_1)$, and $Te_2$ and $Tw$ (drag $w$) stay in the purple plane $\operatorname{span}(e_1, e_2)$. Unlock those entries and give one a nonzero value: a red segment shows the arrow leaving its subspace.`,
      deps: ['ladr-5.35'],
      tags: ['triangular'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Triangular_matrix' },
      viz(v) {
        const A = [[1.5, -1, 0.5], [0, 1, 1], [0, 0, 1.5]];
        const unlock = v.toggle('allow entries below the diagonal', false, { onChange: (b) => { if (!b) { A[1][0] = 0; A[2][0] = 0; A[2][1] = 0; } else if (!A[2][1]) A[2][1] = 0.5; } });
        const S = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, axes: false, height: 390, weight: 1.15 });
        const sc = v.scene3(S, { yaw: -0.55, pitch: 0.62, axis: 1.8, lim: 1.4, labels: ['e₁', 'e₂', 'e₃'] });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 390, weight: 0.85, minWidth: 250 });
        const TT = v.table(Q, { rows: 3, cols: 3, region: [0, 0.3, 1, 0.9], maxCell: 58, size: 16, rowLabels: ['$e_1$', '$e_2$', '$e_3$'], colLabels: ['$Te_1$', '$Te_2$', '$Te_3$'] });
        editable(v, Q, TT, () => A, { step: 0.5, min: -1.5, max: 1.5, ok: (i, j) => i <= j || unlock.value });
        const hw = sc.handle([0.3, -0.8, 0], { mode: 'plane', a: [1, 0, 0], b: [0, 1, 0], color: 'gold', label: 'w' });
        let st = null;
        v.render(() => {
          const cols = [0, 1, 2].map((k) => colOf(A, k));
          sc.begin();
          sc.disc([1, 0, 0], [0, 1, 0], 2, { fill: 'purple', color: 'purple', fillAlpha: 0.1, grid: true });
          sc.line([-2.2, 0, 0], [2.2, 0, 0], { color: 'teal', width: 4, alpha: 0.7 }, 16);
          const leave = [];
          cols.forEach((c, k) => {
            const allowed = c.map((x, i) => (i <= k ? x : 0)), off = normN(sub3(c, allowed));
            if (off > 1e-9 && k < 2) { sc.line(c, allowed, { color: 'red', width: 2.4, dash: [4, 3] }); leave.push(k); }
            sc.arrow([0, 0, 0], c, { color: VC[k], width: 2.8 });
            sc.tex(`Te_${k + 1}`, c, { color: VC[k], dx: 16, dy: -10, size: 14 });
          });
          const w = hw.p, Tw = mv(A, w), offw = Math.abs(Tw[2]);
          if (offw > 1e-9) sc.line(Tw, [Tw[0], Tw[1], 0], { color: 'red', width: 2, dash: [4, 3] });
          sc.arrow([0, 0, 0], Tw, { color: 'orange', width: 2.2 });
          sc.arrow([0, 0, 0], w, { color: 'gold', width: 2.2 });
          sc.tex('Tw', Tw, { color: 'orange', dx: 14, dy: 10, size: 13 });
          sc.flush();
          const tri = A[1][0] === 0 && A[2][0] === 0 && A[2][1] === 0;
          TT.draw({
            value: (i, j) => A[i][j], format: (x) => pn(x, 1),
            fill: (i, j) => (i > j ? (A[i][j] ? ['red', 0.25] : ['faint', 0.35]) : i === j ? ['gold', 0.2] : ['accent', 0.08]),
            textColor: (i, j) => (i > j ? (A[i][j] ? 'red' : 'muted') : VC[j]),
          });
          ttl(Q, TT, '\\mathcal M(T)', tri ? 'green' : 'red', false, 16);
          Q.tex(tri ? '\\text{upper triangular: } \\begin{pmatrix} \\lambda_1 & * & * \\\\ 0 & \\lambda_2 & * \\\\ 0 & 0 & \\lambda_3 \\end{pmatrix}' : '\\text{not upper triangular}', 0.5, 0.13, { color: tri ? 'green' : 'red', size: 14 });
          st = { tri, leave, offw };
        });
        v.legend([['teal', '$\\operatorname{span}(e_1)$'], ['purple', '$\\operatorname{span}(e_1, e_2)$', { area: true }], ['red', 'part outside the subspace', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          if (st.tri) return `$A_{2,1} = A_{3,1} = A_{3,2} = 0$: $\\mathcal M(T)$ is upper triangular (3 of its 9 entries forced to be $0$). Hence $Te_1 = ${tn(A[0][0], 1)}\\,e_1 \\in \\operatorname{span}(e_1)$ and $Te_2, Tw \\in \\operatorname{span}(e_1, e_2)$: $T$ maps the line into the line and the plane into the plane.`;
          const bad = [[1, 0], [2, 0], [2, 1]].filter(([i, j]) => A[i][j]).map(([i, j]) => `A_{${i + 1},${j + 1}} = ${tn(A[i][j], 1)}`);
          const out = [];
          if (st.leave.includes(0)) out.push('$Te_1$ leaves the line');
          const pl = [...(st.leave.includes(1) ? ['Te_2'] : []), ...(st.offw > 1e-9 ? ['Tw'] : [])];
          if (pl.length) out.push(`$${pl.join('$ and $')}$ leave${pl.length === 1 ? 's' : ''} the plane`);
          return `$${bad.join(',\\ ')}$ below the diagonal: **not upper triangular**` + (out.length ? ` — ${out.join('; ')}.` : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 5.39
    {
      num: '5.39',
      kind: 'Theorem',
      name: 'Conditions for upper-triangular matrix',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ and $v_1, \dots, v_n$ is a basis of $V$. The following are equivalent:
(a) the matrix of $T$ with respect to $v_1, \dots, v_n$ is upper triangular;
(b) $\operatorname{span}(v_1, \dots, v_k)$ is invariant under $T$ for each $k = 1, \dots, n$;
(c) $Tv_k \in \operatorname{span}(v_1, \dots, v_k)$ for each $k = 1, \dots, n$.`,
      idea: String.raw`(a) $\Rightarrow$ (b): column $j$ of an upper-triangular matrix says $Tv_j \in \operatorname{span}(v_1,\dots,v_j)$, which lies inside $\operatorname{span}(v_1,\dots,v_k)$ when $j \le k$; so $T$ maps each spanning vector of $\operatorname{span}(v_1,\dots,v_k)$, hence the whole span, into it. (b) $\Rightarrow$ (c) is immediate, since $v_k$ lies in $\operatorname{span}(v_1,\dots,v_k)$. (c) $\Rightarrow$ (a): writing $Tv_k$ in the basis uses only $v_1,\dots,v_k$, so the entries of column $k$ below the diagonal are $0$.`,
      caption: String.raw`$T$ is a fixed operator on $\mathbf R^3$ (its three eigen-lines are dotted green). Drag $v_1$, $v_2$, $v_3$; on the right are the matrix of $T$ in this basis and three independent tests. Red segments show how far $Tv_1$ is from the line $\operatorname{span}(v_1)$ and $Tv_2$ from the plane $\operatorname{span}(v_1, v_2)$. Drag $v_1$ onto an eigen-line and $v_2$ into an invariant plane (both snap): all three tests turn green at the same moment. **Snap to a flag** cycles through the six bases of this kind.`,
      deps: ['ladr-5.38', 'ladr-5.2'],
      tags: ['triangular', 'invariant subspaces'],
      viz(v) {
        const M = v.M;
        const Sm = fromCols([[1, 0.3, -0.2], [0.4, 1, 0.3], [-0.3, 0.5, 1]]);
        const T = conj(M, Sm, [[1.6, 0.6, 0.4], [0, 0.8, 0.5], [0, 0, -0.7]]);
        const E = M.eig(T), ev = E.vectors.map(unitN), lam = E.values.map((z) => z.re);
        const planes = [[0, 1], [0, 2], [1, 2]].map(([i, j]) => ({ i, j, n: unitN(cross3(ev[i], ev[j])) }));
        const S = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, axes: false, height: 390, weight: 1.15 });
        const sc = v.scene3(S, { yaw: -0.65, pitch: 0.36, axis: 1.5, lim: 1.35 });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 390, weight: 0.85, minWidth: 250 });
        const onLine = (p) => ev.findIndex((e) => normN(p) > 0.1 && Math.abs(dotN(p, e)) / normN(p) > 1 - 1e-9);
        const snap1 = (p) => { const l = normN(p); if (l < 0.15) return p; for (const e of ev) { const d = dotN(p, e); if (Math.abs(d) / l > Math.cos((7 * Math.PI) / 180)) return mul3(e, d); } return p; };
        const snap2 = (p) => {
          const k = onLine(h1.p), l = normN(p); if (k < 0 || l < 0.15) return p;
          for (const P of planes) if (P.i === k || P.j === k) { const d = dotN(p, P.n); if (Math.abs(d) / l < Math.sin((7 * Math.PI) / 180)) return sub3(p, mul3(P.n, d)); }
          return p;
        };
        const h1 = sc.handle(mul3(ev[0], 1.1), { color: 'blue', label: 'v₁', snap: snap1 });
        const h2 = sc.handle([-0.2, 0.9, 0.8], { color: 'purple', label: 'v₂', snap: snap2 });
        const h3 = sc.handle([0.4, -0.7, 0.9], { color: 'teal', label: 'v₃' });
        const flags = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (i !== j) flags.push([i, j]);
        let fk = 0;
        v.button('Snap to a flag', () => {
          const [i, j] = flags[fk++ % flags.length];
          h1.set(mul3(ev[i], 1.1)); h2.set(add3(mul3(ev[i], 0.35), mul3(ev[j], 1.05)));
          const v3 = h3.p; if (Math.abs(M.det(fromCols([h1.p, h2.p, v3]))) < 0.05) h3.set(mul3(unitN(cross3(h1.p, h2.p)), 1.1));
        });
        const TM = v.table(Q, { rows: 3, cols: 3, region: [0, 0.4, 1, 0.92], maxCell: 54, size: 14, rowLabels: ['$v_1$', '$v_2$', '$v_3$'], colLabels: ['$Tv_1$', '$Tv_2$', '$Tv_3$'] });
        let st = null;
        v.render(() => {
          const vs = [h1.p, h2.p, h3.p], Bm = fromCols(vs), det = M.det(Bm), ok = Math.abs(det) > 0.03;
          const Tv = vs.map((x) => mv(T, x)), L1 = orthN([vs[0]]), P12 = orthN([vs[0], vs[1]]);
          const tol = 1e-6;
          const d1 = distN(Tv[0], L1), d2 = distN(Tv[1], P12), d12 = distN(Tv[0], P12);
          sc.begin();
          ev.forEach((e) => sc.line(mul3(e, -2), mul3(e, 2), { color: 'green', width: 1.4, dash: [2, 4], alpha: 0.9 }));
          const inv1 = d1 < tol, inv2 = d2 < tol && d12 < tol;
          if (P12.length === 2) sc.disc(P12[0], P12[1], 1.6, { fill: inv2 ? 'green' : 'purple', color: inv2 ? 'green' : 'purple', fillAlpha: 0.1, grid: true });
          if (L1.length) sc.line(mul3(L1[0], -2.1), mul3(L1[0], 2.1), { color: inv1 ? 'green' : 'blue', width: 3.4, alpha: 0.5 }, 16);
          if (d1 > tol) sc.line(Tv[0], projN(Tv[0], L1), { color: 'red', width: 2.2, dash: [4, 3] });
          if (d2 > tol) sc.line(Tv[1], projN(Tv[1], P12), { color: 'red', width: 2.2, dash: [4, 3] });
          [0, 1].forEach((k) => { sc.arrow([0, 0, 0], Tv[k], { color: VC[k], width: 1.8, alpha: 0.6, dash: [5, 3] }); sc.tex(`Tv_${k + 1}`, Tv[k], { color: VC[k], size: 12.5, dx: 14, dy: -8 }); });
          vs.forEach((x, k) => sc.arrow([0, 0, 0], x, { color: VC[k], width: 2.8 }));
          sc.flush();
          let C = null, a = false;
          if (ok) { C = M.matMul(M.inverse(Bm), M.matMul(T, Bm)); a = [[1, 0], [2, 0], [2, 1]].every(([i, j]) => Math.abs(C[i][j]) < 1e-6); }
          const b = ok && inv1 && inv2, c = ok && d1 < tol && d2 < tol;
          TM.draw({
            value: (i, j) => (ok ? C[i][j] : '—'), format: (x) => (typeof x === 'number' ? pn(x, 2) : x),
            fill: (i, j) => (!ok ? null : i > j ? (Math.abs(C[i][j]) < 1e-6 ? ['green', 0.25] : ['red', 0.22]) : null),
            textColor: (i, j) => VC[j],
          });
          ttl(Q, TM, '\\mathcal M\\bigl(T, (v_1, v_2, v_3)\\bigr)', 'ink', false, 14);
          const lights = [[a, '\\text{(a)}\\ \\text{upper triangular}'], [b, '\\text{(b)}\\ \\operatorname{span}(v_1),\\ \\operatorname{span}(v_1,v_2)\\ \\text{invariant}'], [c, '\\text{(c)}\\ Tv_k \\in \\operatorname{span}(v_1,\\dots,v_k)']];
          lights.forEach(([on, txt], i) => Q.tex(`${on ? '\\checkmark' : '\\times'}\\ ${txt}`, 0.03, 0.29 - i * 0.1, { align: 'left', color: on ? 'green' : 'red', size: 13 }));
          if (!ok) S.corner('v₁, v₂, v₃ are not a basis', 'tl', { color: 'red', weight: 700 });
          st = { ok, a, b, c, d1, d2, k1: onLine(h1.p) };
        });
        v.legend([['green', 'eigen-lines of $T$', { dash: true }], ['blue', '$\\operatorname{span}(v_1)$'], ['purple', '$\\operatorname{span}(v_1, v_2)$', { area: true }], ['red', 'distance to the span', { dash: true }]]);
        v.readout(() => {
          if (!st || !st.ok) return 'Choose three independent vectors.';
          const { a, d1, d2 } = st;
          const s = `$\\operatorname{dist}(Tv_1, \\operatorname{span}(v_1)) = ${tn(d1, 3)}$, $\\operatorname{dist}(Tv_2, \\operatorname{span}(v_1, v_2)) = ${tn(d2, 3)}$. `;
          if (a) return s + `All three conditions hold together; the diagonal is $${[0, 1, 2].map((k) => tn(mv(M.inverse(fromCols([h1.p, h2.p, h3.p])), mv(T, [h1.p, h2.p, h3.p][k]))[k])).join(',\\ ')}$ — the eigenvalues of $T$.`;
          return s + (st.k1 < 0 ? 'Condition (c) already fails at $k = 1$: $v_1$ is not an eigenvector, so the first column has nonzero entries below the diagonal.' : 'It holds at $k = 1$ ($v_1$ is an eigenvector) but fails at $k = 2$: $\\operatorname{span}(v_1, v_2)$ is not invariant, and the entry in row 3, column 2 is not $0$.');
        });
      },
    },
    // ------------------------------------------------------------------ 5.40
    {
      num: '5.40',
      kind: 'Theorem',
      name: 'Equation satisfied by an upper-triangular operator',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ and $V$ has a basis with respect to which $T$ has an upper-triangular matrix with diagonal entries $\lambda_1, \dots, \lambda_n$. Then
$$(T - \lambda_1 I)\cdots(T - \lambda_n I) = 0.$$`,
      idea: String.raw`Let $v_1, \dots, v_n$ be the basis. Column $k$ of the matrix of $T - \lambda_k I$ is column $k$ of $\mathcal M(T)$ with its diagonal entry replaced by $0$, so $(T - \lambda_k I)v_k \in \operatorname{span}(v_1, \dots, v_{k-1})$; together with 5.39 this shows that $T - \lambda_k I$ maps $\operatorname{span}(v_1,\dots,v_k)$ into $\operatorname{span}(v_1,\dots,v_{k-1})$. Applying $T - \lambda_n I$, then $T - \lambda_{n-1}I$, …, then $T - \lambda_1 I$ therefore pushes any vector down the chain of subspaces, one dimension at a time, to $0$. The factors commute (5.17), so the product is $0$ in any order.`,
      caption: String.raw`$T$ is upper triangular in the basis $v_1, v_2, v_3$ (choose its diagonal with the sliders). Drag $v$, then step through: $w_1 = (T - \lambda_3 I)v$ falls into the purple plane $\operatorname{span}(v_1, v_2)$, $w_2 = (T - \lambda_2 I)w_1$ onto the teal line $\operatorname{span}(v_1)$, and $T - \lambda_1 I$ sends $w_2$ to $0$. The bars show its coordinates vanishing from the top. Apply the factors in the other order: the intermediate vectors leave the flag, yet the end is still $0$. Use a wrong value $\mu$ in place of $\lambda_2$ and the vector never reaches $0$.`,
      deps: ['ladr-5.38', 'ladr-5.39', 'ladr-5.17'],
      tags: ['triangular'],
      viz(v) {
        const M = v.M;
        const Bv = [[1.1, 0.15, -0.1], [0.3, 1.0, 0.25], [0.1, 0.35, 1.0]], Bm = fromCols(Bv), Bi = M.inverse(Bm);
        const l1 = v.slider('$\\lambda_1$', -1.5, 1.5, 1.2, { step: 0.1 }), l2 = v.slider('$\\lambda_2$', -1.5, 1.5, -0.6, { step: 0.1 }), l3 = v.slider('$\\lambda_3$', -1.5, 1.5, 0.8, { step: 0.1 });
        const ord = v.select('order', [{ value: 'down', label: '$T-\\lambda_3I$ first' }, { value: 'up', label: '$T-\\lambda_1I$ first' }], 'down');
        const wrong = v.toggle('replace $\\lambda_2$ by a wrong $\\mu$', false);
        const mu = v.slider('$\\mu$', -1.5, 1.5, 0.3, { step: 0.1 });
        const S = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, axes: false, height: 380, weight: 1.15, title: 'the flag $\\operatorname{span}(v_1) \\subset \\operatorname{span}(v_1, v_2) \\subset V$' });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.42, axis: 1.4, lim: 1.3 });
        const G = v.stage({ x: [-0.6, 3.6], y: [-1.5, 1.5], height: 380, weight: 0.85, minWidth: 240, axes: 'box', xticks: [[0, 'v'], [1, '1st'], [2, '2nd'], [3, '3rd']], title: 'coordinates in $v_1, v_2, v_3$ after each factor' });
        const hv = sc.handle([1.27, 0.72, 0.22], { color: 'gold', label: 'v' });
        let cur = null;
        const factorsNow = () => { const L = [l1.value, wrong.value ? mu.value : l2.value, l3.value]; return ord.value === 'down' ? [[2, L[2]], [1, L[1]], [0, L[0]]] : [[0, L[0]], [1, L[1]], [2, L[2]]]; };
        const lamName = (k) => (k === 1 && wrong.value ? '\\mu' : `\\lambda_${k + 1}`);
        const noteFor = (i) => {
          if (!cur) return '';
          if (i === 0) return 'Any vector $v$: in general all three of its coordinates are nonzero.';
          const [k] = cur.f[i - 1], down = ord.value === 'down' && !wrong.value, where = ['the line $\\operatorname{span}(v_1)$', 'the plane $\\operatorname{span}(v_1, v_2)$'];
          let s = `Apply $T - ${lamName(k)} I$. `;
          if (i === 3) s += cur.norms[3] < 1e-9 ? '**The vector is $0$.**' : `The result is not $0$ (length ${tn(cur.norms[3], 3)}).`;
          else if (down) s += `It lands in ${where[2 - i]}.`;
          else s += cur.flag[i] ? `It lies in ${where[cur.flag[i] - 1]}.` : 'It is not in the flag.';
          return s;
        };
        const ST = v.steps({ frames: [0, 1, 2, 3].map((i) => ({ i, note: () => noteFor(i) })), transition: 0.45, speed: 0.8, start: 2 });
        let st = null;
        v.render(() => {
          mu.el.hidden = !wrong.value;
          const U = [[l1.value, 0.7, -0.4], [0, l2.value, 0.6], [0, 0, l3.value]], T = M.matMul(Bm, M.matMul(U, Bi));
          const f = factorsNow(), ws = [hv.p];
          for (const [, lam] of f) ws.push(mv(shiftI(T, lam), ws[ws.length - 1]));
          const cs = ws.map((w) => mv(Bi, w)), norms = ws.map(normN);
          const flag = cs.map((c) => (Math.abs(c[2]) > 1e-9 ? 0 : Math.abs(c[1]) > 1e-9 ? 2 : Math.abs(c[0]) > 1e-9 ? 1 : 0));
          cur = { f, ws, cs, norms, flag };
          const i = ST.frame.i ?? 3, ip = ST.prev && ST.prev.i != null ? ST.prev.i : i, tw = ST.tween;
          const lerpV = (a, b) => a.map((x, j) => x + (b[j] - x) * tw), w = lerpV(ws[ip], ws[i]);
          sc.begin();
          const hi = ord.value === 'down' && !wrong.value ? [null, 2, 1, 0][i] : null;
          sc.disc(unitN(Bv[0]), orthN([Bv[0], Bv[1]])[1], 1.75, { fill: 'purple', color: 'purple', fillAlpha: hi === 2 ? 0.2 : 0.08, grid: true });
          sc.line(mul3(unitN(Bv[0]), -2.1), mul3(unitN(Bv[0]), 2.1), { color: 'teal', width: hi === 1 ? 5 : 3.2, alpha: 0.75 }, 16);
          Bv.forEach((b, k) => { sc.arrow([0, 0, 0], b, { color: 'muted', width: 1.6, head: 7 }); sc.tex(`v_${k + 1}`, b, { color: 'muted', size: 12.5, dx: 10, dy: 10 }); });
          for (let j = 1; j < i; j++) if (normN(ws[j]) > 1e-6) { sc.arrow([0, 0, 0], ws[j], { color: 'gold', width: 1.6, alpha: 0.5, dash: [4, 3] }); sc.tex(`w_${j}`, ws[j], { color: 'gold', size: 12.5, dx: 10, dy: 10, alpha: 0.8 }); }
          if (i > 0) sc.arrow([0, 0, 0], ws[0], { color: 'gold', width: 1.4, alpha: 0.35, dash: [4, 3] });
          if (i > 0 && i < 3 && normN(w) > 1e-6) sc.tex(`w_${i}`, w, { color: 'gold', size: 14, dx: 12, dy: -10 });
          if (normN(w) > 1e-6) sc.arrow([0, 0, 0], w, { color: i === 3 && norms[3] > 1e-9 ? 'red' : 'gold', width: 3 });
          else sc.dot([0, 0, 0], { r: 7, color: 'green' });
          sc.flush();
          // ---- coordinate bars
          const m = Math.max(0.6, ...cs.flat().map(Math.abs)) * 1.18;
          G.setView([-0.6, 3.6], [-m, m]);
          G.hline(0, { color: 'muted', width: 1 });
          cs.forEach((c, j) => {
            if (j === i) G.rect(j - 0.42, -m, j + 0.42, m, { fill: 'gold', fillAlpha: 0.08, stroke: false });
            c.forEach((x, k) => {
              const xx = j + (k - 1) * 0.24, zero = Math.abs(x) < 1e-9;
              if (zero) G.dot(xx, 0, { r: 3, color: VC[k], alpha: j <= i ? 1 : 0.35 });
              else G.rect(xx - 0.1, 0, xx + 0.1, x, { fill: VC[k], fillAlpha: j <= i ? 0.6 : 0.15, color: VC[k], width: 1 });
            });
          });
          G.corner('bars: v₁, v₂, v₃ coordinates', 'tr', { size: 11, color: 'muted' });
          const P = f.reduce((acc, [, lam]) => M.matMul(acc, shiftI(T, lam)), ident(3));
          st = { norms, Pmax: maxAbs(P), f };
        });
        v.legend([['teal', '$\\operatorname{span}(v_1)$'], ['purple', '$\\operatorname{span}(v_1, v_2)$', { area: true }], ['gold', 'the vector after each factor']]);
        v.readout(() => {
          if (!st) return '';
          const prod = st.f.slice().reverse().map(([k]) => `(T - ${lamName(k)} I)`).join('');
          return `$${prod}\\,v$ has length $${v.sci(st.norms[3], 1)}$, and the whole operator $${prod}$ has largest entry $${v.sci(st.Pmax, 1)}$` + (st.Pmax < 1e-9 ? ' — **it is the zero operator**.' : ' — **not zero**: $\\mu$ is not a diagonal entry.');
        });
      },
    },
    // ------------------------------------------------------------------ 5.41
    {
      num: '5.41',
      kind: 'Theorem',
      name: 'Eigenvalues are the diagonal of a triangular matrix',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ has an upper-triangular matrix with respect to some basis of $V$. Then the eigenvalues of $T$ are precisely the entries on the diagonal of that matrix.`,
      idea: String.raw`Let $v_1, \dots, v_n$ be the basis and $\lambda_1, \dots, \lambda_n$ the diagonal. $Tv_1 = \lambda_1 v_1$, so $\lambda_1$ is an eigenvalue. For $k \ge 2$, $T - \lambda_k I$ maps the $k$-dimensional space $\operatorname{span}(v_1,\dots,v_k)$ into the $(k-1)$-dimensional $\operatorname{span}(v_1,\dots,v_{k-1})$, so it is not injective there (3.22): $\lambda_k$ is an eigenvalue. Conversely $q(z) = (z - \lambda_1)\cdots(z - \lambda_n)$ satisfies $q(T) = 0$ (5.40), so $q$ is a multiple of the minimal polynomial (5.29), whose zeros are exactly the eigenvalues (5.27); every eigenvalue is therefore among the $\lambda_k$.`,
      caption: String.raw`Edit the $4\times4$ matrix (click the top or bottom half of an entry, or drag it). The rings in $\mathbf C$ mark the diagonal entries; the dots are the eigenvalues, computed numerically from the whole matrix. Change any entry above the diagonal, or press **Scramble**: the dots never leave the rings. Unlock the entries below the diagonal and make one nonzero: the eigenvalues wander off — even out of $\mathbf R$.`,
      deps: ['ladr-3.22', 'ladr-5.40', 'ladr-5.29', 'ladr-5.27', 'ladr-5.38'],
      tags: ['triangular', 'eigenvalues'],
      viz(v) {
        const M = v.M;
        const A = [[1, 2, -1, 1], [0, -1.5, 1, 2], [0, 0, 2.5, -1], [0, 0, 0, 0.5]];
        const unlock = v.toggle('allow entries below the diagonal', false, { onChange: (b) => { if (!b) for (let i = 0; i < 4; i++) for (let j = 0; j < i; j++) A[i][j] = 0; else if (A.every((r, i) => r.every((x, j) => j >= i || !x))) A[2][1] = -2; } });
        let seed = 1;
        v.button('Scramble the $*$ entries', () => { const r = v.rng(seed++ * 31 + 5); for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) A[i][j] = r.int(-6, 6) / 2; });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 350, weight: 0.95, minWidth: 260, title: 'edit the diagonal and the $*$ entries above it' });
        const Z = v.stage({ x: [-3.4, 3.4], y: [-2.4, 2.4], equal: true, height: 350, weight: 1.05, xlabel: 'Re', ylabel: 'Im', title: 'diagonal entries (rings) and eigenvalues (dots) in $\\mathbf C$' });
        const TT = v.table(Q, { rows: 4, cols: 4, region: [0, 0.03, 1, 0.88], maxCell: 64, size: 15 });
        editable(v, Q, TT, () => A, { step: 0.5, min: -3, max: 3, ok: (i, j) => i <= j || unlock.value });
        let st = null, prev = null;
        v.render(() => {
          const tri = A.every((r, i) => r.every((x, j) => j >= i || x === 0));
          TT.draw({
            value: (i, j) => A[i][j], format: (x) => pn(x, 1),
            fill: (i, j) => (i > j ? (A[i][j] ? ['red', 0.25] : ['faint', 0.35]) : i === j ? ['gold', 0.25] : ['accent', 0.07]),
            textColor: (i, j) => (i > j ? (A[i][j] ? 'red' : 'muted') : i === j ? 'ink' : 'accent'),
            weight: (i, j) => (i === j ? 700 : 500),
          });
          ttl(Q, TT, tri ? '\\text{upper triangular } \\mathcal M(T)' : '\\mathcal M(T)\\ \\text{(not triangular)}', tri ? 'green' : 'red', false, 14);
          const ev = M.eig(A, { vectors: false }).values.map((z) => [z.re, Math.abs(z.im) < 1e-9 ? 0 : z.im]);
          const diag = A.map((r, i) => r[i]);
          diag.forEach((d, k) => {
            Z.dot(d, 0, { r: 11, hollow: true, color: 'gold', width: 2.6 });
            const same = diag.slice(0, k).filter((e) => e === d).length;
            Z.tex(`\\lambda_${k + 1}`, d, 0, { color: 'gold', size: 13, dy: 22 + 15 * same });
          });
          ev.forEach(([x, y]) => Z.dot(x, y, { r: 5, color: tri ? 'accent' : 'red' }));
          const dist = ev.map(([x, y]) => Math.min(...diag.map((d) => Math.hypot(x - d, y))));
          st = { tri, ev, diag, dmax: Math.max(...dist) };
          prev = ev;
        });
        v.legend([['gold', 'diagonal entries $\\lambda_1,\\dots,\\lambda_4$', { dot: true }], ['accent', 'eigenvalues of $T$ (computed)', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const evs = st.ev.map(([x, y]) => (y ? `${tn(x)} ${y > 0 ? '+' : '-'} ${tn(Math.abs(y))}i` : tn(x, 3))).join(',\\ ');
          return `Eigenvalues: $${evs}$; diagonal: $${st.diag.map((d) => tn(d, 1)).join(',\\ ')}$. Largest distance from an eigenvalue to the diagonal: $${v.sci(st.dmax, 1)}$` + (st.tri ? ' — **they coincide**.' : ' — with nonzero entries below the diagonal, the diagonal says nothing.');
        });
      },
    },
    // ------------------------------------------------------------------ 5.44
    {
      num: '5.44',
      kind: 'Theorem',
      name: 'Upper-triangular matrix ⟺ minimal polynomial splits',
      statement: String.raw`Suppose $V$ is finite-dimensional and $T \in \mathcal L(V)$. Then $T$ has an upper-triangular matrix with respect to some basis of $V$ if and only if the minimal polynomial of $T$ equals $(z - \lambda_1)\cdots(z - \lambda_m)$ for some $\lambda_1, \dots, \lambda_m \in \mathbf F$.`,
      idea: String.raw`If the matrix is upper triangular with diagonal $\alpha_1, \dots, \alpha_n$, then $q(z) = (z - \alpha_1)\cdots(z - \alpha_n)$ annihilates $T$ (5.40), so the minimal polynomial divides $q$ (5.29) and is itself a product of such factors. Conversely, induct on $m$. Put $U = \operatorname{range}(T - \lambda_m I)$, which is invariant (5.18); on $U$ the shorter product $(z - \lambda_1)\cdots(z - \lambda_{m-1})$ already annihilates $T|_U$, so by induction $U$ has a basis $u_1, \dots, u_M$ making $T|_U$ triangular. Extend it by any $v_1, \dots, v_N$: since $Tv_k = (T - \lambda_m I)v_k + \lambda_m v_k \in \operatorname{span}(u_1,\dots,u_M, v_k)$, the conditions of 5.39 hold.`,
      caption: String.raw`A real operator on $\mathbf R^2$: $T = T_0 + sJ$, where $J$ is a quarter turn, so $s$ adds rotation. Drag the unit vector $v_1$ around the circle; $v_2$ is perpendicular to it. The matrix of $T$ in the basis $v_1, v_2$ is triangular exactly when $Tv_1$ has no $v_2$-component — the red segment, plotted on the right as $A_{2,1}$ against the angle of $v_1$. While the minimal polynomial splits over $\mathbf R$ the curve crosses $0$ (at the eigen-directions; $v_1$ snaps there). Slide $|s|$ past the critical value and the minimal polynomial acquires an irreducible factor $z^2 + bz + c$: the curve lifts off the axis, and no basis of $\mathbf R^2$ triangularizes $T$.`,
      deps: ['ladr-5.39', 'ladr-5.40', 'ladr-5.29', 'ladr-5.18'],
      tags: ['triangular', 'minimal polynomial'],
      viz(v) {
        const M = v.M;
        const T0 = [[1.2, 0.3], [0.3, 0.5]], sStar = Math.sqrt(0.85) / 2;   // discriminant 0.85 − 4s²
        const sS = v.slider('rotation added: $s$', -1, 1, 0.2, { step: 0.01 });
        const P = v.stage({ x: [-2.3, 2.3], y: [-2, 2], equal: true, axes: false, height: 360, weight: 1.05, title: '$Tv_1 = A_{1,1}v_1 + A_{2,1}v_2$' });
        const G = v.stage({ x: [0, 180], y: [-1.3, 1.3], height: 360, weight: 0.95, axes: 'box', xlabel: 'angle of v₁ (degrees)', xticks: [0, 45, 90, 135, 180], title: '$A_{2,1}$ as $v_1$ turns' });
        let dirs = [];
        const hv = P.handle(Math.cos(2.3), Math.sin(2.3), {
          color: 'blue', label: 'v₁',
          constrain: (x, y) => {
            let t = Math.atan2(y, x);
            for (const d of dirs) for (const sg of [0, Math.PI]) { let dd = t - (d + sg); dd = Math.atan2(Math.sin(dd), Math.cos(dd)); if (Math.abs(dd) < (5 * Math.PI) / 180) t = d + sg; }
            return [Math.cos(t), Math.sin(t)];
          },
        });
        let st = null;
        v.render(() => {
          let s = sS.value; if (Math.abs(Math.abs(s) - sStar) < 0.006) s = Math.sign(s) * sStar;
          const T = [[T0[0][0], T0[0][1] - s], [T0[1][0] + s, T0[1][1]]];
          const p = minPoly(M, T), g = groupRoots(rootsOf(M, p)), splits = g.every((q) => !q.im);
          const E = M.eig(T); dirs = E.values.map((z, i) => (Math.abs(z.im) < 1e-7 && E.vectors[i] ? Math.atan2(E.vectors[i][1], E.vectors[i][0]) : null)).filter((x) => x != null);
          const th = Math.atan2(hv.y, hv.x), v1 = [Math.cos(th), Math.sin(th)], v2 = [-v1[1], v1[0]], Tv = mv(T, v1);
          const a11 = dotN(v1, Tv), a21 = dotN(v2, Tv);
          // ---- the plane
          P.line(-2.3, 0, 2.3, 0, { color: 'faint', width: 1 }); P.line(0, -2, 0, 2, { color: 'faint', width: 1 });
          P.circle(0, 0, 1, { color: 'muted', width: 1, dash: [3, 4] });
          dirs.forEach((d) => P.line(-3 * Math.cos(d), -3 * Math.sin(d), 3 * Math.cos(d), 3 * Math.sin(d), { color: 'green', width: 1.6, dash: [6, 4] }));
          P.arrow(0, 0, v2[0], v2[1], { color: 'purple', width: 2 }); P.tex('v_2', v2[0], v2[1], { color: 'purple', dx: -12, dy: -10, size: 14 });
          const foot = [a11 * v1[0], a11 * v1[1]];
          P.line(0, 0, foot[0], foot[1], { color: 'blue', width: 5, alpha: 0.25 });
          const z21 = Math.abs(a21) < 1e-9;
          if (!z21) P.line(foot[0], foot[1], Tv[0], Tv[1], { color: 'red', width: 2.6 });
          P.arrow(0, 0, Tv[0], Tv[1], { color: 'orange', width: 2.6 }); P.tex('Tv_1', Tv[0], Tv[1], { color: 'orange', dx: 16, dy: -10, size: 14 });
          P.arrow(0, 0, v1[0], v1[1], { color: 'blue', width: 3 });
          P.texPx(`\\mathcal M(T,(v_1,v_2)) = ${mtex([[a11, dotN(v1, mv(T, v2))], [a21, dotN(v2, mv(T, v2))]])}`, 10, P.height - 10, { align: 'left', baseline: 'bottom', size: 12.5, color: z21 ? 'green' : 'muted' });
          // ---- A21 against the angle
          const pts = [];
          for (let i = 0; i <= 360; i++) { const t = (Math.PI * i) / 360, w = [Math.cos(t), Math.sin(t)]; pts.push([i / 2, dotN([-w[1], w[0]], mv(T, w))]); }
          const mn = Math.min(...pts.map((q) => Math.abs(q[1])));
          G.hline(0, { color: 'muted', width: 1.2 });
          if (!splits) { const sg = Math.sign(pts[0][1]); G.hband(0, sg * mn, { color: 'red', alpha: 0.12 }); G.text(`gap: |A₂,₁| ≥ ${pn(mn, 3)}`, 90, sg * mn / 2, { align: 'center', color: 'red', size: 12, weight: 700 }); }
          G.path(pts, { color: splits ? 'accent' : 'red', width: 2.4 });
          dirs.forEach((d) => { let deg = ((d * 180) / Math.PI + 360) % 180; G.dot(deg, 0, { r: 5.5, color: 'green' }); });
          const deg = ((th * 180) / Math.PI + 360) % 180;
          G.vline(deg, { color: 'blue', width: 1.2, alpha: 0.5 }); G.dot(deg, a21 * (((th * 180) / Math.PI + 360) % 360 >= 180 ? 1 : 1), { r: 6, color: z21 ? 'green' : 'blue' });
          st = { s, p, g, splits, z21, a11, a21, crit: Math.abs(s) === sStar };
        });
        v.legend([['blue', '$v_1$'], ['orange', '$Tv_1$'], ['red', '$v_2$-component $A_{2,1}$'], ['green', 'eigen-directions: $A_{2,1} = 0$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { p, g, splits, z21, a11 } = st;
          const ft = factorTeX(g), cz = g.filter((q) => q.im).map((q) => `${tn(q.re)} \\pm ${tn(q.im)}i`).join(',\\ ');
          const head = `Minimal polynomial $${polyT(p)}${ft === polyT(p) ? '' : ` = ${ft}`}$ over $\\mathbf R$${cz ? ` (zeros $${cz}$)` : ''} — ${splits ? `**splits**${st.crit ? ' (a repeated zero: only one eigen-direction)' : ''}` : '**does not split**'}. `;
          if (!splits) return head + 'No direction $v_1$ is an eigenvector, so no basis of $\\mathbf R^2$ gives a triangular matrix (over $\\mathbf C$ one would).';
          return head + (z21 ? `Here $Tv_1 = ${tn(a11)}\\,v_1$: the basis $v_1, v_2$ makes $\\mathcal M(T)$ upper triangular.` : 'Turn $v_1$ to a green zero of the curve to make $\\mathcal M(T)$ upper triangular.');
        });
      },
    },
    // ------------------------------------------------------------------ 5.47
    {
      num: '5.47',
      kind: 'Corollary',
      name: 'Over C, every operator has an upper-triangular matrix',
      statement: String.raw`Suppose $V$ is a finite-dimensional complex vector space and $T \in \mathcal L(V)$. Then $T$ has an upper-triangular matrix with respect to some basis of $V$.`,
      idea: String.raw`By the fundamental theorem of algebra (4.13) the minimal polynomial of $T$ factors completely as $(z - \lambda_1)\cdots(z - \lambda_m)$ over $\mathbf C$, so 5.44 applies. Concretely the basis can be built one vector at a time: an eigenvector $v_1$ (which exists by 5.19); then an eigenvector of the operator that $T$ induces on what is left (the lower-right block once $v_1$ is the first basis vector), giving $v_2$ with $\operatorname{span}(v_1, v_2)$ invariant; and so on. Over $\mathbf R$ the process can stall, when such a block has no real eigenvalue.`,
      caption: String.raw`Each entry of the complex $3\times3$ matrix is drawn as an arrow in its own small copy of $\mathbf C$ (the circle has radius $|$largest entry$|$). Step through: first an eigenvector $v_1$ is chosen and completed to an orthonormal basis — column 1 becomes $(\lambda_1, 0, 0)$; then an eigenvector of the lower-right $2\times2$ block gives $v_2$ — and the matrix is upper triangular. On the right, the diagonal entries (gold) land on the eigenvalues (rings). **New random $T$** repeats it; switch to a real $T$ whose minimal polynomial has a factor $z^2 + bz + c$ with $b^2 < 4c$, and over $\mathbf R$ the second step is impossible.`,
      deps: ['ladr-5.44', 'ladr-4.13'],
      verify: true,
      tags: ['triangular'],
      viz(v) {
        const M = v.M;
        const fld = v.select('$\\mathbf F$', [{ value: 'C', label: '$\\mathbf C$: random complex $T$' }, { value: 'R', label: '$\\mathbf R$: real $T$ with a rotation' }], 'C');
        let seed = 1;
        v.button('New random $T$', () => { seed++; });
        const Mx = v.stage({ x: [-0.3, 3.15], y: [-0.2, 3.25], equal: true, axes: false, height: 360, weight: 1.1, title: 'the matrix of $T$' });
        const Z = v.stage({ x: [-2.6, 2.6], y: [-2.3, 2.3], equal: true, height: 360, weight: 0.9, xlabel: 'Re', ylabel: 'Im', title: 'eigenvalues (rings), diagonal entries (gold)' });
        let key = '', data = null;
        const ST = v.steps({ frames: [0, 1, 2].map((i) => ({ i, note: () => (data ? data.notes[i] : '') })), speed: 0.6, start: 2 });
        function build() {
          const r = v.rng(seed * 977 + (fld.value === 'R' ? 13 : 0)), n = 3;
          let A;
          if (fld.value === 'C') A = Array.from({ length: n }, () => Array.from({ length: n }, () => [r.normal() * 0.75, r.normal() * 0.75]));
          else {
            let Sm; do { Sm = Array.from({ length: n }, () => Array.from({ length: n }, () => r.normal())); } while (Math.abs(M.det(Sm)) < 0.6);
            const a = r.uniform(-0.6, 0.6), b = r.uniform(0.6, 1.2), lam = (r() < 0.5 ? -1 : 1) * r.uniform(0.6, 1.4);
            A = conj(M, Sm, [[lam, 0, 0], [0, a, -b], [0, b, a]]).map((row) => row.map((x) => [x, 0]));
          }
          // eigenvalues: zeros of the characteristic polynomial (complex arithmetic)
          const tr = cA(cA(A[0][0], A[1][1]), A[2][2]);
          const m2 = (i, j) => cS(cM(A[i][i], A[j][j]), cM(A[i][j], A[j][i]));
          const c1 = cA(cA(m2(0, 1), m2(0, 2)), m2(1, 2));
          const det = [0, 1, 2].reduce((s, j) => { const a = A[1][(j + 1) % 3], b = A[2][(j + 2) % 3], c = A[1][(j + 2) % 3], d = A[2][(j + 1) % 3]; return cA(s, cM(A[0][j], cS(cM(a, b), cM(c, d)))); }, [0, 0]);
          const ev = M.polyRoots([v.cx(-det[0], -det[1]), v.cx(c1[0], c1[1]), v.cx(-tr[0], -tr[1]), v.cx(1, 0)]).map((z) => [z.re, z.im]);
          ev.sort((p, q) => Math.abs(p[1]) - Math.abs(q[1]) || q[0] - p[0]);        // a real one first, if any
          const lam1 = ev[0];
          // eigenvector v1: a (bilinear) cross product of two rows of A − λ1 I
          const N = A.map((row, i) => row.map((z, j) => (i === j ? cS(z, lam1) : z)));
          const cr = (x, y) => [cS(cM(x[1], y[2]), cM(x[2], y[1])), cS(cM(x[2], y[0]), cM(x[0], y[2])), cS(cM(x[0], y[1]), cM(x[1], y[0]))];
          const cands = [cr(N[0], N[1]), cr(N[0], N[2]), cr(N[1], N[2])].sort((p, q) => cvNorm(q) - cvNorm(p));
          let v1 = cvUnit(cands[0]);
          if (fld.value === 'R') { const k = v1.reduce((b, z, i) => (cAbs(z) > cAbs(v1[b]) ? i : b), 0), ph = cD(cC(v1[k]), [cAbs(v1[k]), 0]); v1 = v1.map((z) => cM(z, ph)).map((z) => [z[0], 0]); v1 = cvUnit(v1); }
          const cols = (vs) => vs[0].map((_, i) => vs.map((x) => x[i]));
          const Q1 = cComplete([v1], 3), Qm1 = cols(Q1), B1 = cmm(cH(Qm1), cmm(A, Qm1));
          const C = [[B1[1][1], B1[1][2]], [B1[2][1], B1[2][2]]], ctr = cA(C[0][0], C[1][1]), cdet = cS(cM(C[0][0], C[1][1]), cM(C[0][1], C[1][0]));
          const disc = cS(cM(ctr, ctr), cM([4, 0], cdet));
          const stuck = fld.value === 'R' && disc[0] < 0;
          let B2 = B1, Qm2 = Qm1;
          if (!stuck) {
            const mu = cM(cA(ctr, cSqrt(disc)), [0.5, 0]);
            let y = cAbs(C[0][1]) > 1e-9 ? [C[0][1], cS(mu, C[0][0])] : cAbs(C[1][0]) > 1e-9 ? [cS(mu, C[1][1]), C[1][0]] : [[1, 0], [0, 0]];
            y = cvUnit(y);
            let v2 = [0, 1, 2].map((i) => cA(cM(Q1[1][i], y[0]), cM(Q1[2][i], y[1])));
            v2 = cvUnit(v2);
            const v3 = cvUnit(cr(v1, v2).map(cC));
            Qm2 = cols([v1, v2, v3]); B2 = cmm(cH(Qm2), cmm(A, Qm2));
          }
          const evT = ev.map((z) => cxT(z, 2)).join(',\\ ');
          const blockEv = stuck ? [[ctr[0] / 2, Math.sqrt(-disc[0]) / 2]] : null;
          const notes = [
            `The matrix of $T$ in the standard basis. Its eigenvalues are $${evT}$; the diagonal entries are unrelated to them.`,
            `Take the eigenvalue $\\lambda_1 = ${cxT(lam1)}$ and a unit eigenvector $v_1$, and complete it to an orthonormal basis $v_1, w_2, w_3$. Since $Tv_1 = \\lambda_1 v_1$, **column 1 is $(\\lambda_1, 0, 0)$**.`,
            stuck ? `The lower-right block has eigenvalues $${tn(blockEv[0][0])} \\pm ${tn(blockEv[0][1])}i$ — not real. Over $\\mathbf R$ there is no $v_2$ with $\\operatorname{span}(v_1, v_2)$ invariant: **stuck**, as 5.44 predicts (the minimal polynomial does not split).`
              : `The lower-right $2\\times2$ block has an eigenvalue $\\lambda_2$; its eigenvector gives $v_2$ (and $v_3 \\perp v_1, v_2$). Now $\\operatorname{span}(v_1, v_2)$ is invariant too, and **the matrix is upper triangular**.`,
          ];
          data = { mats: [A, B1, B2], ev, notes, stuck };
        }
        function phasor(i, j, z, rmax, st) {
          const cx = j + 0.5, cy = 2.5 - i, R = 0.34, zero = cAbs(z) < 1e-9;
          Mx.rect(j + 0.04, 2.04 - i, j + 0.96, 2.96 - i, { color: 'faint', width: 1, fill: st.fill || false, fillAlpha: st.fillAlpha ?? 0.18 });
          Mx.circle(cx, cy + 0.08, R, { color: 'faint', width: 1 });
          if (zero) Mx.text('0', cx, cy + 0.08, { align: 'center', size: 16, color: 'green', weight: 700 });
          else { const k = R / rmax; Mx.arrow(cx, cy + 0.08, cx + z[0] * k, cy + 0.08 + z[1] * k, { color: st.color || 'accent', width: 2, head: 6 }); }
          Mx.text(zero ? '' : cxT(z, 2, true), cx, cy - 0.34, { align: 'center', size: 10.5, color: st.color || 'ink', weight: 600 });
        }
        v.render(() => {
          const k = `${seed}|${fld.value}`; if (k !== key) { key = k; build(); }
          const i = ST.frame.i ?? 2, B = data.mats[i];
          const rmax = Math.max(...B.flat().map(cAbs));
          for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
            const z = B[a][b], low = a > b, zero = cAbs(z) < 1e-9;
            phasor(a, b, z, rmax, { fill: a === b ? 'gold' : low ? (zero ? 'green' : 'red') : false, fillAlpha: a === b ? 0.18 : 0.13, color: a === b ? 'gold' : low && !zero ? 'red' : 'accent' });
          }
          const names = [['e_1', 'e_2', 'e_3'], ['v_1', 'w_2', 'w_3'], data.stuck ? ['v_1', 'w_2', 'w_3'] : ['v_1', 'v_2', 'v_3']][i];
          Mx.setTitle(`the matrix of $T$ in the basis $${names.join(', ')}$`);
          if (i === 2 && data.stuck) Mx.corner('over ℝ: no v₂ exists', 'tr', { color: 'red', weight: 700, size: 12 });
          // eigenvalues and diagonal
          data.ev.forEach(([x, y]) => Z.dot(x, y, { r: 11, hollow: true, color: 'accent', width: 2.4 }));
          for (let a = 0; a < 3; a++) Z.dot(B[a][a][0], B[a][a][1], { r: 5, color: 'gold' });
          const dmax = Math.max(...[0, 1, 2].map((a) => Math.min(...data.ev.map((e) => Math.hypot(e[0] - B[a][a][0], e[1] - B[a][a][1])))));
          const low = Math.max(cAbs(B[1][0]), cAbs(B[2][0]), cAbs(B[2][1]));
          Z.corner(`largest |entry below the diagonal| ${low < 1e-9 ? '≈ 0' : '= ' + pn(low, 2)}`, 'bl', { color: low < 1e-9 ? 'green' : 'muted', size: 11.5 });
          data.cur = { i, dmax, low };
        });
        v.legend([['gold', 'diagonal entry', { dot: true }], ['accent', 'eigenvalue of $T$', { dot: true }], ['green', 'entry $= 0$ below the diagonal', { area: true }], ['red', 'nonzero below the diagonal', { area: true }]]);
        v.readout(() => {
          if (!data || !data.cur) return '';
          const { i, dmax, low } = data.cur;
          if (i < 2 || data.stuck) return `Largest entry below the diagonal: $${v.sci(low, 1)}$.` + (data.stuck && i === 2 ? ' Over $\\mathbf C$ the block would have an eigenvector after all (for a nonreal eigenvalue), and the construction would finish.' : '');
          return `Entries below the diagonal: at most $${v.sci(low, 1)}$; each diagonal entry is within $${v.sci(dmax, 1)}$ of an eigenvalue — the triangular matrix lists the eigenvalues (5.41).`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.50
    {
      num: '5.50',
      kind: 'Definition',
      name: 'Diagonalizable operator',
      statement: String.raw`An operator on $V$ is **diagonalizable** if it has a diagonal matrix with respect to some basis of $V$ — a matrix that is $0$ everywhere off the diagonal. Equivalently, $V$ has a basis $v_1, \dots, v_n$ consisting of eigenvectors of $T$: $Tv_k = \lambda_k v_k$, and the diagonal entries are $\lambda_1, \dots, \lambda_n$.`,
      idea: String.raw`Column $k$ of $\mathcal M(T)$ holds the coordinates of $Tv_k$ (5.35), so the matrix is diagonal exactly when each $Tv_k$ is a multiple $\lambda_k v_k$ of $v_k$ — when every basis vector is an eigenvector. In that basis $T$ acts by pure stretching: the coordinate of $v_k$ is multiplied by $\lambda_k$, independently in each direction. The standard basis is often not the right one (Axler's example 5.51), and some operators have no eigenvector basis at all: a shear has too few eigenvectors, a rotation of $\mathbf R^2$ has none.`,
      caption: String.raw`Slide the morph from the identity ($0$) to $T$ ($1$), and watch the grid. In the **eigenvector grid** every line stays parallel to itself — $T$ only stretches along $v_1$ by $\lambda_1$ and along $v_2$ by $\lambda_2$ — and $\mathcal M(T, (v_1, v_2))$ on the right is diagonal. The standard grid, by contrast, shears and turns. Drag the tips $Te_1$, $Te_2$ to change $T$, or pick the shear or the rotation: then no eigenvector basis exists.`,
      deps: ['ladr-5.35'],
      tags: ['diagonalization'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Diagonalizable_matrix' },
      viz(v) {
        const M = v.M;
        const r40 = (40 * Math.PI) / 180;
        const PRE = { axler: [[41 / 46, 7 / 46], [-20 / 46, 74 / 46]], shear: [[1, 0.7], [0, 1]], rot: [[1.1 * Math.cos(r40), -1.1 * Math.sin(r40)], [1.1 * Math.sin(r40), 1.1 * Math.cos(r40)]] };
        const pre = v.select('operator', [{ value: 'axler', label: 'Axler 5.51, divided by 46' }, { value: 'shear', label: 'shear' }, { value: 'rot', label: 'rotation' }], 'axler', {
          onChange: (k) => { const A = PRE[k]; h1.set(A[0][0], A[1][0]); h2.set(A[0][1], A[1][1]); },
        });
        const grid = v.select('grid', [{ value: 'eig', label: 'eigenvector grid' }, { value: 'std', label: 'standard grid' }], 'eig');
        const sm = v.slider('morph: $(1-s)I + sT$', 0, 1, 1, { step: 0.01 });
        const P = v.stage({ x: [-2.6, 2.6], y: [-2.3, 2.3], equal: true, axes: false, height: 380, weight: 1.3 });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, weight: 0.7, minWidth: 230 });
        const A0 = PRE.axler;
        const h1 = P.handle(A0[0][0], A0[1][0], { color: 'orange', label: 'Te₁' }), h2 = P.handle(A0[0][1], A0[1][1], { color: 'orange', label: 'Te₂' });
        const TS = v.table(Q, { rows: 2, cols: 2, region: [0, 0.55, 1, 0.95], maxCell: 50, size: 14 });
        const TD = v.table(Q, { rows: 2, cols: 2, region: [0, 0.08, 1, 0.47], maxCell: 58, size: 15 });
        let st = null;
        v.render(() => {
          const A = [[h1.x, h2.x], [h1.y, h2.y]], s = sm.value;
          const Ms = A.map((r, i) => r.map((x, j) => (1 - s) * (i === j ? 1 : 0) + s * x));
          const E = M.eig(A), real = E.values.every((z) => Math.abs(z.im) < 1e-9);
          let basis = null, lam = null;
          if (real && E.vectors[0] && E.vectors[1]) {
            const b1 = E.vectors[0], b2 = E.vectors[1], d = b1[0] * b2[1] - b1[1] * b2[0];
            if (Math.abs(d) > 1e-6) { basis = [b1, b2].map((b) => mul3([...b, 0], 1).slice(0, 2)); lam = [E.values[0].re, E.values[1].re]; }
          }
          const useEig = grid.value === 'eig' && basis;
          const g1 = useEig ? basis[0] : [1, 0], g2 = useEig ? basis[1] : [0, 1];
          const F = (p) => mv(Ms, p);
          for (let k = -6; k <= 6; k++) {
            P.line(k * g1[0] - 7 * g2[0], k * g1[1] - 7 * g2[1], k * g1[0] + 7 * g2[0], k * g1[1] + 7 * g2[1], { color: 'grid', width: 1 });
            P.line(k * g2[0] - 7 * g1[0], k * g2[1] - 7 * g1[1], k * g2[0] + 7 * g1[0], k * g2[1] + 7 * g1[1], { color: 'grid', width: 1 });
          }
          for (let k = -6; k <= 6; k++) {
            const a = F([k * g1[0] - 7 * g2[0], k * g1[1] - 7 * g2[1]]), b = F([k * g1[0] + 7 * g2[0], k * g1[1] + 7 * g2[1]]);
            const c = F([k * g2[0] - 7 * g1[0], k * g2[1] - 7 * g1[1]]), d = F([k * g2[0] + 7 * g1[0], k * g2[1] + 7 * g1[1]]);
            P.line(a[0], a[1], b[0], b[1], { color: k ? (useEig ? 'teal' : 'muted') : 'ink', width: k ? 1 : 1.6, alpha: k ? 0.45 : 0.8 });
            P.line(c[0], c[1], d[0], d[1], { color: k ? (useEig ? 'teal' : 'muted') : 'ink', width: k ? 1 : 1.6, alpha: k ? 0.45 : 0.8 });
          }
          const cell = [[0, 0], g1, [g1[0] + g2[0], g1[1] + g2[1]], g2];
          P.poly(cell, { color: 'muted', width: 1, dash: [4, 3], fill: false });
          P.poly(cell.map(F), { color: 'accent', width: 2, fill: 'accent', fillAlpha: 0.16 });
          if (basis) basis.forEach((b, k) => { P.line(-4 * b[0], -4 * b[1], 4 * b[0], 4 * b[1], { color: 'green', width: 1.4, dash: [6, 4] }); const Fb = F(b); P.arrow(0, 0, Fb[0], Fb[1], { color: VC[k], width: 2.8 }); P.tex(s === 1 ? `Tv_${k + 1} = ${tn(lam[k]) === '1' ? '' : tn(lam[k])}v_${k + 1}` : `v_${k + 1} \\mapsto ${tn(1 - s + s * lam[k])}\\,v_${k + 1}`, Fb[0], Fb[1], { color: VC[k], size: 13.5, dx: 10, dy: k ? -12 : 14, align: 'left' }); });
          P.arrow(0, 0, h1.x, h1.y, { color: 'orange', width: 1.3, alpha: 0.6, head: 7 }); P.arrow(0, 0, h2.x, h2.y, { color: 'orange', width: 1.3, alpha: 0.6, head: 7 });
          if (!basis) P.corner(real ? 'one eigen-direction only: not diagonalizable' : 'no real eigenvector: not diagonalizable over ℝ', 'tl', { color: 'red', weight: 700 });
          else if (grid.value === 'std') P.corner('standard grid: lines tilt and shear', 'tl', { color: 'muted', weight: 600 });
          else P.corner('eigenvector grid: pure stretching', 'tl', { color: 'green', weight: 700 });
          TS.draw({ value: (i, j) => A[i][j], format: (x) => (typeof x === 'number' ? pn(x, 2) : x), textColor: () => 'muted' });
          ttl(Q, TS, '\\mathcal M(T)\\ \\text{(standard basis)}', 'muted', false, 13);
          let D = null;
          if (basis) { const Bm = [[basis[0][0], basis[1][0]], [basis[0][1], basis[1][1]]]; D = M.matMul(M.inverse(Bm), M.matMul(A, Bm)); }
          TD.draw({ value: (i, j) => (D ? D[i][j] : '—'), format: (x) => (typeof x === 'number' ? pn(x, 2) : x), fill: (i, j) => (D ? (i === j ? ['gold', 0.25] : ['green', 0.15]) : ['red', 0.1]), textColor: (i, j) => (D ? (i === j ? VC[i] : 'green') : 'red') });
          ttl(Q, TD, D ? '\\mathcal M\\bigl(T, (v_1, v_2)\\bigr)\\ \\text{— diagonal}' : '\\text{no basis of eigenvectors}', D ? 'green' : 'red', false, 13.5);
          v.legend([[useEig ? 'teal' : 'muted', `${useEig ? 'eigenvector' : 'standard'} grid, moved (faint: before)`], ['accent', 'the cell of the basis, moved', { area: true }], ['green', 'eigen-directions', { dash: true }]]);
          st = { basis, lam, D, real };
        });

        v.readout(() => {
          if (!st) return '';
          if (!st.basis) return st.real ? 'Only one eigen-direction: every basis contains a vector that is not an eigenvector, so no basis makes the matrix diagonal.' : 'The eigenvalues are not real, so no nonzero vector of $\\mathbf R^2$ is mapped to a multiple of itself: $T$ is not diagonalizable over $\\mathbf R$ (it is over $\\mathbf C$).';
          const { lam, D, basis } = st;
          const cf = (x) => (tn(x) === '1' ? '' : tn(x) === '-1' ? '-' : `${tn(x)}\\,`);
          return `$Tv_1 = ${cf(lam[0])}v_1$ and $Tv_2 = ${cf(lam[1])}v_2$ with $v_1 = ${vtex(basis[0])}$, $v_2 = ${vtex(basis[1])}$, so $\\mathcal M(T, (v_1, v_2)) = ${mtex(D)}$: $T$ is diagonalizable.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.52
    {
      num: '5.52',
      kind: 'Definition',
      name: 'Eigenspace E(λ, T)',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ and $\lambda \in \mathbf F$. The **eigenspace** of $T$ corresponding to $\lambda$ is the subspace
$$E(\lambda, T) = \operatorname{null}(T - \lambda I) = \{v \in V : Tv = \lambda v\}.$$
It consists of all eigenvectors of $T$ for $\lambda$ together with $0$; so $\lambda$ is an eigenvalue of $T$ exactly when $E(\lambda, T) \ne \{0\}$.`,
      idea: String.raw`$E(\lambda, T)$ is a null space, hence a subspace (3.13). For most $\lambda$ it is just $\{0\}$; it is nonzero precisely at the eigenvalues (5.7), and its dimension — the number of independent eigenvectors for $\lambda$ — can be smaller than the number of times $\lambda$ is repeated. On $E(\lambda, T)$ the operator $T$ is simply multiplication by $\lambda$.`,
      caption: String.raw`$T$ has the eigenvalues $2$ and $-1$, with $2$ repeated; the slider $s$ couples two directions. Slide $\lambda$ (it snaps to the eigenvalues): $E(\lambda, T)$ is drawn in $\mathbf R^3$ — only the origin unless $\lambda$ is an eigenvalue. At $\lambda = 2$ it is a plane while $s = 0$ and collapses to a line as soon as $s \ne 0$. Drag $v$ inside it: $Tv = \lambda v$. On the right, the two smallest singular values of $T - \lambda I$: $\dim E(\lambda, T)$ is the number of them that touch $0$.`,
      deps: ['ladr-5.5', 'ladr-3.11'],
      tags: ['eigenvalues'],
      viz(v) {
        const M = v.M;
        const Sm = fromCols([[1, 0.2, -0.15], [-0.25, 1, 0.3], [0.3, -0.35, 1]]);
        const ss = v.slider('coupling $s$', 0, 1.5, 0, { step: 0.05 });
        const lamS = v.slider('$\\lambda$', -2, 3, 2, { step: 0.01, onChange: (x) => { for (const e of [2, -1]) if (Math.abs(x - e) < 0.07 && x !== e) lamS.set(e); } });
        const S = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, axes: false, height: 370, weight: 1.1 });
        const sc = v.scene3(S, { yaw: -0.7, pitch: 0.55, axis: 1.5, lim: 1.1 });
        const G = v.stage({ x: [-2, 3], y: [-0.3, 3], height: 370, weight: 0.9, axes: 'box', xlabel: 'λ', title: 'the two smallest singular values of $T - \\lambda I$' });
        const hv = sc.handle([0.6, 0.3, 0.2], { color: 'accent', label: 'v' });
        const cache = {};
        let curKey = '', st = null;
        v.render(() => {
          const s = ss.value, lam = lamS.value, T = conj(M, Sm, [[2, s, 0], [0, 2, 0], [0, 0, -1]]);
          const E = M.nullspace(shiftI(T, lam), 1e-8), dim = E.length;
          const key = `${s}|${lam}|${dim}`;
          if (key !== curKey) {
            curKey = key;
            if (dim === 1) { hv.mode = 'line'; hv.d = E[0]; hv.set(mul3(E[0], 0.8)); }
            else if (dim === 2) { hv.mode = 'plane'; hv.a = E[0]; hv.b = E[1]; hv.set(add3(mul3(E[0], 0.2), mul3(E[1], 0.75))); }
          }
          hv.h.visible = dim > 0;
          sc.begin();
          spanDraw(sc, E, { color: dim ? 'green' : 'red', r: 1.7 });
          let Tv = null;
          if (dim) {
            const w = hv.p; Tv = mv(T, w);
            sc.arrow([0, 0, 0], Tv, { color: 'orange', width: 2.4 });
            sc.arrow([0, 0, 0], w, { color: 'accent', width: 3 });
            sc.tex(`Tv = ${tn(lam)}v`, Tv, { color: 'orange', dx: lam < 0 ? -30 : 26, dy: -12, size: 13.5 });
          }
          sc.flush();
          S.setTitle(`$E(${tn(lam)}, T)$ = ${['$\\{0\\}$', 'a line', 'a plane', '$\\mathbf R^3$'][dim]}`);
          // ---- singular values against λ
          const ck = String(s);
          if (!cache[ck]) { const xs = [], s1 = [], s2 = []; for (let i = 0; i <= 250; i++) { const x = -2 + (5 * i) / 250, sv = M.svd(shiftI(T, x)).S; xs.push(x); s1.push(sv[2]); s2.push(sv[1]); } cache[ck] = { xs, s1, s2 }; }
          const C = cache[ck];
          G.path(C.xs.map((x, i) => [x, C.s2[i]]), { color: 'orange', width: 2 });
          G.path(C.xs.map((x, i) => [x, C.s1[i]]), { color: 'accent', width: 2.4 });
          for (const e of [2, -1]) { const d = M.nullspace(shiftI(T, e), 1e-8).length; G.vline(e, { color: 'green', width: 1.2, dash: [4, 4] }); G.text(`dim E = ${d}`, e, 2.85, { align: e > 0 ? 'right' : 'left', dx: e > 0 ? -6 : 6, color: 'green', size: 11.5, weight: 700 }); }
          G.hline(0, { color: 'muted', width: 1 });
          const sv = M.svd(shiftI(T, lam)).S;
          G.vline(lam, { color: 'gold', width: 1.4 });
          G.dot(lam, sv[2], { r: 5, color: 'accent' }); G.dot(lam, sv[1], { r: 5, color: 'orange' });
          st = { lam, dim, s, Tv, w: hv.p, sv };
        });
        v.legend([['accent', 'smallest $\\sigma_3$'], ['orange', 'next $\\sigma_2$'], ['green', '$E(\\lambda, T)$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { lam, dim, sv } = st;
          const head = `$\\sigma(T - ${tn(lam)}I) = ${sv.map((x) => tn(x, 3)).join(',\\ ')}$, so $\\dim E(${tn(lam)}, T) = \\dim\\operatorname{null}(T - ${tn(lam)}I) = ${dim}$. `;
          if (!dim) return head + `$${tn(lam)}$ is not an eigenvalue: only $v = 0$ satisfies $Tv = ${tn(lam)}v$.`;
          return head + `Your $v = ${vtex(st.w)}$ has $Tv = ${vtex(st.Tv)} = ${tn(lam)}\\,v$.` + (lam === 2 ? (dim === 2 ? ' Two independent eigenvectors for the repeated eigenvalue.' : ' Only one independent eigenvector, although $2$ is repeated.') : '');
        });
      },
    },
  ],
};
