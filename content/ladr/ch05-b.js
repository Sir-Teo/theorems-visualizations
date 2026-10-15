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
            const wx = 1.72, wy = 3;
            box(D, wx, wy, BW, BH, { v, color: 'red', width: isW ? 3 : 1.6, dash: [5, 4], fill: 'red', fillAlpha: isW ? 0.14 : 0.06 });
            D.tex(wInfo.f, wx, wy, { size: 13, color: 'red' });
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
  ],
};
