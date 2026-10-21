// Classical Mechanics — Chapter 11: Small oscillations and normal modes (part b: 11.10–11.17)

import { TAU, clamp, memo, rk4, rk4rec, idxAt, span, sci, num, mv, qf, dotv, chol, fwd, bwd, genEig, toModes, chainMK, MODE_COLS, spring, springPts, hatch, series } from './ch11.shared.js';

/** Draw a fixed-ends chain of beads with transverse displacements ys at x = 1..n (walls at 0 and n + 1). */
function beadChain(v, s, ys, o = {}) {
  const n = ys.length, y0 = o.y0 ?? 0, rs = o.r || ys.map(() => 6), col = o.color || 'purple';
  hatch(v, s, 0, y0 - 0.9, 0, y0 + 0.9, -1, 7, 6); hatch(v, s, n + 1, y0 - 0.9, n + 1, y0 + 0.9, 1, 7, 6);
  const pts = [[0, y0], ...ys.map((y, i) => [i + 1, y0 + y]), [n + 1, y0]];
  s.path(pts, { color: o.line || 'ink', width: 1.3, alpha: o.alpha ?? 1, dash: o.dash });
  if (o.dots !== false) ys.forEach((y, i) => s.dot(i + 1, y0 + y, { r: rs[i], color: Array.isArray(col) ? col[i] : col, alpha: o.alpha }));
}
/** Sorted eigen-frequencies ω (not ω²) of a chain with masses ms, springs ks, and extra diagonal stiffness / mass at bead j. */
function chainFreqs(Mlib, ms, ks, j = -1, dk = 0, dm = 0) {
  const m2 = ms.slice(); if (j >= 0) m2[j] += dm;
  const { M, K } = chainMK(m2, ks); if (j >= 0) K[j][j] += dk;
  return genEig(M, K, Mlib).w2.map((x) => Math.sqrt(Math.max(0, x)));
}
/** Frequencies with bead j held fixed (the constrained system): drop row and column j. */
function pinnedFreqs(Mlib, ms, ks, j) {
  const { M, K } = chainMK(ms, ks), keep = ms.map((_, i) => i).filter((i) => i !== j);
  const sub = (A) => keep.map((a) => keep.map((b) => A[a][b]));
  return genEig(sub(M), sub(K), Mlib).w2.map((x) => Math.sqrt(Math.max(0, x)));
}

export default {
  collection: 'mech',
  chapter: 11,
  items: [
    // ───────────────────────────────────────────────────────────── 11.10
    {
      num: '11.10',
      kind: 'Theorem',
      name: 'Rayleigh’s principle',
      statement: String.raw`For a system with mass matrix $M$ (positive definite) and stiffness matrix $K$ (symmetric), with eigen-frequencies $\omega_1^2\le\omega_2^2\le\dots\le\omega_n^2$, define the **Rayleigh quotient** of a trial displacement $\mathbf a\ne0$:
$$R(\mathbf a) = \frac{\mathbf a^{\mathsf T}K\mathbf a}{\mathbf a^{\mathsf T}M\mathbf a} = \frac{\text{(twice the) potential energy}}{\text{(twice the) kinetic energy per }\omega^2}.$$
Then:
(a) $\omega_1^2 \le R(\mathbf a) \le \omega_n^2$ for every $\mathbf a$, with $R = \omega_1^2$ exactly when $\mathbf a$ is a fundamental mode and $R = \omega_n^2$ exactly when it is a top mode;
(b) the stationary points of $R$ on the sphere of directions are exactly the normal modes, and the stationary values are the $\omega_k^2$;
(c) the minimum is quadratically insensitive: if $\mathbf a$ makes an angle $\theta$ (in the $M$-inner product) with the fundamental mode, then $(\omega_2^2-\omega_1^2)\sin^2\theta \le R(\mathbf a)-\omega_1^2 \le (\omega_n^2-\omega_1^2)\sin^2\theta$.
So even a rough guess of the fundamental mode shape gives a good upper bound for the fundamental frequency.`,
      idea: String.raw`Expand the trial vector in the $M$-orthonormal modes of 11.4, $\mathbf a = \sum c_k\mathbf a_k$. Then $\mathbf a^{\mathsf T}M\mathbf a = \sum c_k^2$ and $\mathbf a^{\mathsf T}K\mathbf a = \sum\omega_k^2c_k^2$, so $R$ is a weighted average of the $\omega_k^2$ with weights $c_k^2/\sum c_j^2$. An average lies between the smallest and largest values and equals the smallest only when all the weight is on it. Subtracting $\omega_1^2$ leaves $\sum_{k\ge2}(\omega_k^2-\omega_1^2)c_k^2/\sum c_j^2$, a weighted sum of the $\sin^2\theta = \sum_{k\ge2}c_k^2/\sum c_j^2$; this is the quadratic accuracy. It is the finite-dimensional case of fa-12.13: the spectrum of a self-adjoint operator lies between the infimum and supremum of its quadratic form on the unit sphere.`,
      caption: String.raw`A three-bead chain with unequal masses. Left: the Rayleigh quotient on the sphere of directions in the coordinates $\boldsymbol\xi = M^{1/2}\mathbf a$, coloured from blue (low) to red (high); its stationary points are the modes (green minimum, gold saddle, red maximum). Drag the gold trial point on the sphere, or drag the beads on the right to sculpt a trial shape; the dashed curve is the true fundamental mode. The gauge at the bottom shows $R$ trapped between $\omega_1^2$ and $\omega_3^2$, never entering the red zone below $\omega_1^2$. The inverse-iteration button replaces the guess by $K^{-1}M\mathbf a$, which sends $R$ down toward $\omega_1^2$ very quickly.`,
      deps: ['mech-11.4', 'fa-12.13'],
      see: ['nla-5.10', 'qm-12.2', 'solid-8.9'],
      refs: ['Arnold §24', 'Goldstein §6.2'],
      tags: ['Rayleigh quotient', 'variational principle', 'eigenvalues'],
      credit: 'Lord Rayleigh, The Theory of Sound, 1877',
      viz(v) {
        const Mlib = v.M, ms = [1, 1.8, 0.7], ks = [1, 1.4, 0.8, 1.2], { M, K } = chainMK(ms, ks), G = genEig(M, K, Mlib), w2 = G.w2;
        const sq = ms.map(Math.sqrt), toXi = (a) => a.map((x, i) => x * sq[i]), toA = (xi) => xi.map((x, i) => x / sq[i]);
        const R = (a) => qf(K, a) / qf(M, a);
        const S = v.stage({ x: [-1.45, 1.45], y: [-1.45, 1.45], equal: true, axes: false, height: 330, title: 'Rayleigh quotient on the sphere of directions' });
        const sc = v.scene3(S, { yaw: -0.5, pitch: 0.4, axes: false });
        const sB = v.stage({ x: [-0.3, 4.3], y: [-1.25, 1.25], axes: false, height: 330, title: 'trial shape of the chain (drag the beads)' });
        const sG = v.stage({ x: [0, 1], y: [-0.6, 1], axes: false, height: 110, full: true });
        const basis = () => { const P = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map(sc.P); return { ex: P.map((p) => p[0]), ey: P.map((p) => p[1]), ez: P.map((p) => p[2]) }; };
        const front = (p) => {
          const { ex, ey, ez } = basis(), A = sc.P(p); let x = A[0], y = A[1], r2 = x * x + y * y;
          if (r2 > 0.999) { const r = Math.sqrt(r2); x /= r * 1.0005; y /= r * 1.0005; r2 = x * x + y * y; }
          const d = -Math.sqrt(Math.max(0, 1 - r2));
          return [0, 1, 2].map((i) => x * ex[i] + y * ey[i] + d * ez[i]);
        };
        const unit = (p) => { const n = Math.hypot(...p) || 1; return p.map((c) => c / n); };
        let syncing = false;
        const fromSphere = (xi) => { const a = toA(xi), s = 0.85 / Math.max(...a.map(Math.abs)); syncing = true; bh.forEach((h, i) => h.set(i + 1, a[i] * s)); syncing = false; };
        const fromBeads = () => { if (syncing) return; let xi = unit(toXi(bh.map((h) => h.y))); if (sc.P(xi)[2] > 0) xi = xi.map((c) => -c); H.set(xi); };
        let xi0 = unit(toXi([1, 0.45, 0.9])); if (sc.P(xi0)[2] > 0) xi0 = xi0.map((c) => -c);
        const H = sc.handle(xi0, { color: 'gold', label: 'trial', snap: front, onDrag: (h) => fromSphere(h.p) });
        const bh = [0, 1, 2].map((i) => sB.handle(i + 1, 0.5, { color: 'purple', r: 7 + 3 * Math.sqrt(ms[i]), constrain: (x, y) => [i + 1, clamp(y, -1.05, 1.05)] }));
        bh.forEach((h) => (h.onDrag = fromBeads));
        fromSphere(H.p);
        const hist = [];
        v.button('inverse-iteration step', () => { const a = toA(H.p), b = Mlib.solve(K, mv(M, a)); let xi = unit(toXi(b)); if (dotv(xi, H.p) < 0) xi = xi.map((c) => -c); hist.push(H.p.slice()); if (hist.length > 6) hist.shift(); H.set(xi); fromSphere(xi); });
        let seed = 3;
        v.button('new random guess', () => { const r = Mlib.rng(seed++); let xi = unit([r.uniform(-1, 1), r.uniform(-1, 1), r.uniform(-1, 1)]); if (sc.P(xi)[2] > 0) xi = xi.map((c) => -c); hist.length = 0; H.set(xi); fromSphere(xi); });
        const NT = 22, NP = 44, col = (t) => { const q = (Math.floor(clamp(t, 0, 0.9999) * 12) + 0.5) / 12; return v.diverge(2 * q - 1, 'blue', 'red'); };
        let cur = null;
        v.render(() => {
          sc.begin();
          if (sc.P(H.p)[2] > 0.02 && !H.dragging) H.set(H.p.map((c) => -c));
          const pt = (th, ph) => [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
          for (let i = 0; i < NT; i++) for (let j = 0; j < NP; j++) {
            const t0 = (Math.PI * i) / NT, t1 = (Math.PI * (i + 1)) / NT, p0 = (TAU * j) / NP, p1 = (TAU * (j + 1)) / NP, c = pt((t0 + t1) / 2, (p0 + p1) / 2);
            if (sc.P(c)[2] > 0.08) continue;
            const r = qf(G.C, c);
            sc.poly([pt(t0, p0), pt(t1, p0), pt(t1, p1), pt(t0, p1)], { fill: col((r - w2[0]) / (w2[2] - w2[0])), fillAlpha: 0.92, edge: false });
          }
          const lab = ['ω₁² (min)', 'ω₂² (saddle)', 'ω₃² (max)'], cl = ['green', 'gold', 'red'];
          for (let k = 0; k < 3; k++) for (const sg of [1, -1]) {
            const u = G.U[k].map((c) => c * sg); if (sc.P(u)[2] > 0.05) continue;
            sc.dot(u, { r: 6, color: cl[k], label: lab[k], labelPos: 'e' });
          }
          for (let i = 1; i < hist.length; i++) sc.line(hist[i - 1], hist[i], { color: 'ink', width: 1.2, dash: [3, 3], top: true }, 1);
          if (hist.length) sc.line(hist[hist.length - 1], H.p, { color: 'ink', width: 1.2, dash: [3, 3], top: true }, 1);
          sc.flush();
          // chain
          const a = bh.map((h) => h.y), A1 = G.A[0], proj = qf(M, A1, a), fit = A1.map((x) => x * proj);
          sB.line(0, 0, 4, 0, { color: 'faint', width: 1, dash: [3, 4] });
          beadChain(v, sB, fit, { dots: false, line: 'green', dash: [6, 4], alpha: 0.9 });
          beadChain(v, sB, a, { dots: false, line: 'purple' });
          ms.forEach((m, i) => sB.text(`m = ${m}`, i + 1, -1.17, { color: 'muted', size: 11, align: 'center' }));
          // gauge
          const r = R(a), X = (x) => x / (1.08 * w2[2]);
          sG.rect(0, -0.08, X(w2[0]), 0.08, { fill: 'red', fillAlpha: 0.15, hatch: 'red', stroke: false });
          sG.line(0, 0, 1, 0, { color: 'muted', width: 1.5 });
          for (let k = 0; k < 3; k++) { sG.line(X(w2[k]), -0.18, X(w2[k]), 0.18, { color: cl[k], width: 2.4 }); sG.tex(`\\omega_${k + 1}^2 = ${v.fix(w2[k], 3)}`, X(w2[k]), -0.42, { color: cl[k], size: 13 }); }
          sG.poly([[X(r), 0.12], [X(r) - 0.008, 0.5], [X(r) + 0.008, 0.5]], { fill: 'gold', fillAlpha: 1, color: 'gold' });
          sG.tex(`R(\\mathbf a) = ${v.fix(r, 4)}`, X(r), 0.74, { color: 'gold', size: 14 });
          sG.text('impossible: R < ω₁²', X(w2[0]) / 2, 0.3, { color: 'red', size: 11, align: 'center' });
          cur = { a, r };
        });
        v.legend([['purple', 'trial shape $\\mathbf a$'], ['green', 'fundamental mode (best multiple)', { dash: true }], ['gold', 'trial direction and its $R$']]);
        v.readout(() => {
          if (!cur) return '';
          const { a, r } = cur, c = G.A.map((ak) => qf(M, ak, a)), n2 = c.reduce((s, x) => s + x * x, 0), s2 = (c[1] ** 2 + c[2] ** 2) / n2;
          const ratio = s2 > 1e-14 ? (r - w2[0]) / s2 : NaN;
          return String.raw`$R(\mathbf a) = ${v.fix(r, 5)}$ lies in $[\omega_1^2, \omega_3^2] = [${v.fix(w2[0], 4)}, ${v.fix(w2[2], 4)}]$ · angle to the fundamental mode $\theta = ${v.fix((Math.asin(Math.sqrt(clamp(s2, 0, 1))) * 180) / Math.PI, 2)}°$ · error $R-\omega_1^2 = ${num(v, r - w2[0], 5)}$` + (isFinite(ratio) ? String.raw` $= ${v.fix(ratio, 4)}\,\sin^2\theta$, and ${v.fix(ratio, 4)} lies between $\omega_2^2-\omega_1^2 = ${v.fix(w2[1] - w2[0], 4)}$ and $\omega_3^2-\omega_1^2 = ${v.fix(w2[2] - w2[0], 4)}$ (quadratic accuracy)` : ' · the trial shape is the fundamental mode');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 11.11
    {
      num: '11.11',
      kind: 'Theorem',
      name: 'Interlacing of frequencies under constraints',
      statement: String.raw`Let a system with $n$ degrees of freedom have frequencies $\omega_1\le\dots\le\omega_n$ (11.4).
(a) **Constraint.** Impose one linear constraint, for example hold one mass fixed. The constrained system has $n-1$ frequencies $\omega'_1\le\dots\le\omega'_{n-1}$, and they **interlace** with the old ones:
$$\omega_1 \le \omega'_1 \le \omega_2 \le \omega'_2 \le \dots \le \omega'_{n-1} \le \omega_n .$$
(b) **Stiffening.** Adding stiffness (replacing $K$ by $K + \Delta K$ with $\Delta K$ positive semidefinite) raises every frequency, $\omega_k(K+\Delta K)\ge\omega_k(K)$. If $\Delta K$ has rank one (a single extra spring), each new frequency also stays below the next old one, $\omega_k\le\tilde\omega_k\le\omega_{k+1}$; as the extra spring becomes infinitely stiff, the frequencies rise to those of the constrained system.
(c) **Loading.** Adding mass lowers every frequency, and a single added mass at one point moves each $\omega_k$ into $[\omega_{k-1}, \omega_k]$.`,
      idea: String.raw`Rayleigh’s principle (11.10) gives the Courant–Fischer characterisation: $\omega_k^2$ is the smallest possible maximum of $R$ over $k$-dimensional subspaces of trial shapes. A constraint removes trial shapes, which can only raise each min–max: $\omega'_k \ge \omega_k$. It removes only one dimension, so every $(k+1)$-dimensional subspace still contains a $k$-dimensional subspace of allowed shapes, which gives $\omega'_k\le\omega_{k+1}$. Extra stiffness raises $R$ for every trial shape, so every min–max rises. A single spring of stiffness $s$ is a penalty that forces the constraint as $s\to\infty$, so its frequencies climb monotonically from the free ones to the constrained ones. An added mass acts the same way in reverse.`,
      caption: String.raw`A chain of beads with random masses between walls. Click a bead to choose where to act, then add a spring from it to the ground (or extra mass on it) and vary its size. Left: every frequency as a function of the added stiffness on a log scale. Each curve rises monotonically from its free value (grey) toward the pinned-bead value (green) and never crosses the next free frequency. Right: the frequency ladder before, at the current setting, and with the bead pinned, with each new frequency in its band. Adding mass makes everything slide down instead.`,
      deps: ['mech-11.10'],
      see: ['nla-5.11', 'qm-12.3'],
      refs: ['Arnold §24'],
      tags: ['interlacing', 'constraints', 'eigenvalues'],
      viz(v) {
        const Mlib = v.M;
        const NS = v.slider('number of beads $N$', 3, 7, 5, { int: true });
        const kind = v.select('change at the chosen bead', [{ value: 'k', label: 'add a spring to ground' }, { value: 'm', label: 'add mass' }], 'k');
        const sS = v.slider('added stiffness or mass', 0.01, 1000, 2, { log: true });
        let seed = 7, jSel = 1;
        v.button('new random masses', () => { seed++; });
        const sC = v.stage({ x: [-0.4, 6.4], y: [-1.5, 1.3], axes: false, height: 170, full: true, title: 'click a bead to choose where the change acts' });
        const sF = v.stage({ x: [0.01, 1000], y: [0, 2.2], xlog: true, axes: 'box', height: 290, weight: 1.3, ylabel: '$\\omega$', title: 'frequencies against the added stiffness $s$' });
        const sL = v.stage({ x: [-0.4, 2.4], y: [0, 2.2], axes: 'box', height: 290, weight: 1, xticks: [[0, 'free'], [1, 'now'], [2, 'pinned']], ylabel: '$\\omega$', title: 'interlacing ladder' });
        const masses = () => { const r = Mlib.rng(seed); return Array.from({ length: NS.value }, () => r.uniform(0.5, 1.8)); };
        sC.onClick((x) => { jSel = clamp(Math.round(x) - 1, 0, NS.value - 1); v.invalidate(); });
        const cache = memo(); let cur = null;
        v.render(() => {
          const N = NS.value, ms = masses(), ks = new Array(N + 1).fill(1), j = Math.min(jSel, N - 1), isK = kind.value === 'k', s = sS.value;
          const D = cache([N, seed, j, kind.value].join('|'), () => {
            const free = chainFreqs(Mlib, ms, ks), pin = pinnedFreqs(Mlib, ms, ks, j);
            const grid = []; for (let i = 0; i <= 80; i++) { const x = 0.01 * 1e5 ** (i / 80); grid.push([x, isK ? chainFreqs(Mlib, ms, ks, j, x, 0) : chainFreqs(Mlib, ms, ks, j, 0, x)]); }
            return { free, pin, grid };
          });
          const now = isK ? chainFreqs(Mlib, ms, ks, j, s, 0) : chainFreqs(Mlib, ms, ks, j, 0, s);
          const top = 1.3 * Math.max(...D.free);
          sF.setTitle(isK ? 'frequencies against the added stiffness $s$ (log scale)' : 'frequencies against the added mass $\\Delta m$ (log scale)');
          sF.setView([0.01, 1000], [0, top]); sL.setView([-0.4, 2.4], [0, top]);
          // chain picture with the lowest mode before (faint) and after
          const shape = (dk, dm) => { const m2 = ms.slice(); m2[j] += dm; const { M, K } = chainMK(m2, ks); K[j][j] += dk; const a = genEig(M, K, Mlib).A[0], sc = 0.75 / Math.max(...a.map(Math.abs)); return a.map((x) => x * sc); };
          sC.setView([-0.4, N + 1.4], [-1.5, 1.3]);
          sC.line(0, 0, N + 1, 0, { color: 'faint', width: 1, dash: [3, 4] });
          beadChain(v, sC, shape(0, 0), { dots: false, line: 'muted', dash: [5, 4], alpha: 0.8 });
          const after = isK ? shape(s, 0) : shape(0, s);
          beadChain(v, sC, after, { r: ms.map((m, i) => 4 + 4 * Math.sqrt(m + (i === j && !isK ? Math.min(s, 30) * 0.15 : 0))), color: ms.map((_, i) => (i === j ? 'gold' : 'purple')), line: 'blue' });
          if (isK) { const gx = j + 1, gy = after[j]; spring(sC, gx, gy - 0.12, gx, -1.15, { n: 6, w: 0.12, color: 'gold', width: 1.2 + Math.min(3, Math.log10(1 + s)) }); hatch(v, sC, gx - 0.3, -1.15, gx + 0.3, -1.15, 1, 6, 5); }
          sC.text(`bead ${j + 1}: ${isK ? 'spring to ground, s = ' : 'extra mass Δm = '}${v.fmt(s, 3)}`, N + 1.3, 1.12, { color: 'gold', size: 12, align: 'right', weight: 600 });
          // frequencies against s
          for (let k = 0; k < N; k++) {
            sF.hline(D.free[k], { color: 'muted', width: 1, dash: [4, 4], alpha: 0.8 });
            if (k < N - 1) sF.hline(D.pin[k], { color: 'green', width: 1, dash: [2, 3], alpha: 0.9 });
            sF.path(D.grid.map(([x, f]) => [x, f[k]]), { color: MODE_COLS[k % MODE_COLS.length], width: 2.2 });
            sF.dot(s, now[k], { r: 4.5, color: MODE_COLS[k % MODE_COLS.length] });
          }
          sF.vline(s, { color: 'gold', width: 1.2 });
          // ladder
          for (let k = 0; k < N; k++) {
            const lo = isK ? D.free[k] : k ? D.free[k - 1] : 0, hi = isK ? (k + 1 < N ? D.free[k + 1] : top) : D.free[k];
            sL.rect(-0.25 + 0, lo, 2.25, hi, { fill: MODE_COLS[k % MODE_COLS.length], fillAlpha: 0.06, stroke: false });
            sL.line(0, D.free[k], 1, Math.min(now[k], top * 0.99), { color: MODE_COLS[k % MODE_COLS.length], width: 1.2, alpha: 0.7 });
            sL.dot(0, D.free[k], { r: 5, color: 'muted' });
            if (now[k] < top) sL.dot(1, now[k], { r: 6, color: MODE_COLS[k % MODE_COLS.length] });
            else { sL.arrow(1, top * 0.9, 1, top * 0.99, { color: MODE_COLS[k % MODE_COLS.length], width: 2 }); sL.text(`${v.fix(now[k], 1)} → ∞`, 1, top * 0.9, { color: MODE_COLS[k % MODE_COLS.length], size: 11, dx: 8, align: 'left' }); }
            if (k < N - 1) { sL.dot(2, D.pin[k], { r: 5, color: 'green' }); }
          }
          if (!isK) sL.dot(2, 0, { r: 5, color: 'green', hollow: true });
          cur = { N, j, isK, s, now, free: D.free, pin: D.pin };
        });
        v.legend([['muted', 'free frequencies $\\omega_k$', { dash: true }], ['green', 'pinned-bead frequencies $\\omega\'_k$', { dash: true }], ['gold', 'chosen bead and current change']]);
        v.readout(() => {
          if (!cur) return '';
          const { N, isK, now, free, pin } = cur, tol = 1e-9;
          let okP = true; for (let k = 0; k < N - 1; k++) okP = okP && free[k] <= pin[k] + tol && pin[k] <= free[k + 1] + tol;
          let okN = true; for (let k = 0; k < N; k++) okN = okN && (isK ? free[k] <= now[k] + tol && (k + 1 >= N || now[k] <= free[k + 1] + tol) : now[k] <= free[k] + tol && (k === 0 || free[k - 1] <= now[k] + tol));
          const f = (a) => a.map((x) => v.fix(x, 3)).join(', ');
          return String.raw`Free $\omega$: ${f(free)} · now: ${f(now)} · pinned: ${f(pin)} · ${isK ? String.raw`$\omega_k\le\tilde\omega_k\le\omega_{k+1}$` : String.raw`$\omega_{k-1}\le\tilde\omega_k\le\omega_k$`} for every $k$: **${okN ? 'yes' : 'no'}** · pinned values interlace, $\omega_k\le\omega'_k\le\omega_{k+1}$: **${okP ? 'yes' : 'no'}**`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 11.12
    {
      num: '11.12',
      kind: 'Phenomenon',
      name: 'Driven coupled oscillators: the vibration absorber',
      statement: String.raw`A main mass $M$ on a spring $K$ (natural frequency $\omega_0 = \sqrt{K/M}$) is driven by a force $F\cos\Omega t$. Attach a small absorber mass $m = \mu M$ to it through a spring $k$, tuned so that $\omega_a = \sqrt{k/m}$ is near $\omega_0$. The steady state solves $(K_{\rm tot} - \Omega^2M_{\rm tot} + i\Omega C)\mathbf X = (F, 0)$, and without damping the main mass responds with
$$X_1 = \frac{F\,(k - m\Omega^2)}{(K + k - M\Omega^2)(k - m\Omega^2) - k^2}.$$
(a) At $\Omega = \omega_a$ the main mass stands **exactly still** ($X_1 = 0$): the absorber swings so that its spring force cancels the drive, $kX_2 = -F$.
(b) The single resonance of the main mass is replaced by two resonances, on either side of $\omega_0$, which separate further as $\mu$ grows.
(c) With damping in the absorber the two peaks can be flattened. Den Hartog’s classical tuning $\omega_a/\omega_0 = 1/(1+\mu)$ and damping ratio $\zeta = \sqrt{3\mu/(8(1+\mu)^3)}$ make the two fixed points $P$, $Q$ (through which every damping curve passes) equally high, near their lowest possible level, about $\sqrt{1+2/\mu}$ times the static deflection.
**Tuned mass dampers** in tall buildings use this. Taipei 101 has a steel sphere of about 660 t and 5.5 m diameter, built from 41 plates and hung from the 92nd to the 88th floor; its operators credit it with reducing the tower’s sway by up to 40%, and in Typhoon Soudelor (2015) it swung by about 1 m.`,
      scope: String.raw`Linear springs and dampers, harmonic driving, steady state after transients have died away. A real building has many modes; a damper tuned to the first mode does little for the others, and a damper that is mistuned (by a change in mass or stiffness) loses most of its effect.`,
      idea: String.raw`At $\Omega = \omega_a$ the absorber’s own equation $(k - m\Omega^2)X_2 = kX_1$ forces $X_1 = 0$: an oscillator driven at its natural frequency can sustain any amplitude with zero net force from its mount, so the absorber takes the whole drive. Away from that point, the two masses form the coupled system of 11.4, with two normal modes and so two resonances, split by the coupling exactly as in 11.13. Adding absorber damping turns the sharp zero into a broad, low response. For any damping the curves pass through the same two frequencies, because there $|X_1|$ does not depend on $c$; Den Hartog’s rule makes the two fixed points equal. Each resonance peak is limited by damping as for one oscillator (4.11).`,
      caption: String.raw`The tower sways under a periodic push at its top (blue arrow) with a pendulum absorber hanging near the top; displacements are drawn on a compressed scale. Right: the main mass’s amplitude against driving frequency on a log scale, with the absorber (blue), without it (red, dashed), and the absorber’s swing relative to the tower (orange). Drag the frequency marker: at the absorber frequency the tower stands still while the pendulum swings, with $|X_1| = 0$ exactly when the absorber has no damping. Then add absorber damping, or press the Den Hartog button: the two peaks merge into a low plateau through the fixed points $P$ and $Q$.`,
      deps: ['mech-11.4', 'mech-4.11'],
      see: ['mech-4.10', 'arch-7.7'],
      refs: ['Goldstein §6.5', 'Den Hartog, Mechanical Vibrations §3.3'],
      tags: ['vibration absorber', 'resonance', 'tuned mass damper'],
      credit: 'Frahm (patent, 1909); Den Hartog & Ormondroyd, 1928',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Tuned_mass_damper' },
      viz(v) {
        const Z1 = 0.01, W = [0.6, 1.4];
        const muS = v.slider('mass ratio $\\mu = m/M$', 0.005, 0.1, 0.02, { log: true });
        const fS = v.slider('tuning $\\omega_a/\\omega_0$', 0.8, 1.15, 0.98, { step: 0.001 });
        const zS = v.slider('absorber damping ratio $\\zeta_a$', 0, 0.3, 0, { step: 0.001 });
        const on = v.toggle('absorber attached', true);
        const sT = v.stage({ x: [-0.75, 0.75], y: [-0.05, 1.25], equal: true, axes: false, height: 350, weight: 0.75, title: 'a tower with a pendulum absorber' });
        const sR = v.stage({ x: W, y: [0.1, 200], ylog: true, axes: 'box', height: 350, weight: 1.3, title: 'amplitude ÷ static deflection $F/K$, against $\\Omega/\\omega_0$' });
        const hO = sR.handle(0.98, 0.15, { color: 'gold', constrain: (x) => [clamp(x, W[0] + 0.005, W[1] - 0.005), 0.15] });
        v.button('Den Hartog optimum', () => { const mu = muS.value; fS.set(1 / (1 + mu)); zS.set(Math.sqrt((3 * mu) / (8 * (1 + mu) ** 3))); });
        v.button('drive at the absorber frequency', () => hO.set(fS.value, 0.15));
        const resp = (Om, mu, f, za, att) => {
          const cx = (re, im) => ({ re, im }), mul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re), div = (a, b) => { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); }, sub = (a, b) => cx(a.re - b.re, a.im - b.im);
          if (!att) { const X1 = div(cx(1, 0), cx(1 - Om * Om, 2 * Z1 * Om)); return { X1, X2: X1 }; }
          const k2 = mu * f * f, c2 = 2 * za * mu * f;
          const A11 = cx(1 + k2 - Om * Om, Om * (2 * Z1 + c2)), A12 = cx(-k2, -Om * c2), A22 = cx(k2 - mu * Om * Om, Om * c2);
          const det = sub(mul(A11, A22), mul(A12, A12)), X1 = div(A22, det), X2 = div(cx(-A12.re, -A12.im), det); // Cramer's rule
          return { X1, X2 };
        };
        const ab = (z) => Math.hypot(z.re, z.im);
        const cacheC = memo();
        /** Response curves, fixed points and peak heights for one parameter set (cached). */
        const curves = (mu, f, za, att) => cacheC([mu, f, za, att].join('|'), () => {
          const n = 1200, free = [], main = [], rel = []; let pk = 0, pk0 = 0;
          for (let i = 0; i <= n; i++) {
            const x = W[0] + ((W[1] - W[0]) * i) / n, q0 = resp(x, mu, f, za, false), q = resp(x, mu, f, za, att);
            free.push([x, ab(q0.X1)]); main.push([x, ab(q.X1)]); rel.push([x, ab({ re: q.X2.re - q.X1.re, im: q.X2.im - q.X1.im })]);
            pk = Math.max(pk, ab(q.X1)); pk0 = Math.max(pk0, ab(q0.X1));
          }
          // fixed points: where the undamped and the locked (infinitely damped) absorber give the same |X1|
          const d = (x) => ab(resp(x, mu, f, 0, true).X1) - 1 / Math.abs(1 - (1 + mu) * x * x);
          const fp = []; let x0 = W[0], d0 = d(x0);
          for (let i = 1; i <= 800; i++) { const x1 = W[0] + ((W[1] - W[0]) * i) / 800, d1 = d(x1); if (isFinite(d0) && isFinite(d1) && Math.sign(d0) !== Math.sign(d1) && Math.abs(d0 - d1) < 50) { let a = x0, b = x1; for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (Math.sign(d(m)) === Math.sign(d(a))) a = m; else b = m; } const xm = (a + b) / 2; if (Math.abs(1 - (1 + mu) * xm * xm) > 1e-3) fp.push(xm); } x0 = x1; d0 = d1; }
          return { free, main, rel, fp, pk, pk0 };
        });
        let cur = null;
        v.animate((t) => {
          const mu = muS.value, f = fS.value, za = zS.value, att = on.value, Om = hO.x;
          const r = resp(Om, mu, f, za, att), X1 = r.X1, X2 = r.X2;
          // response curves
          const C = curves(mu, f, za, att);
          sR.path(C.free, { color: 'red', width: 1.6, dash: [6, 4] });
          if (att) {
            sR.path(C.rel, { color: 'orange', width: 1.4 });
            sR.path(C.main, { color: 'blue', width: 2.6 });
            C.fp.slice(0, 2).forEach((x, i) => { const y = 1 / Math.abs(1 - (1 + mu) * x * x); sR.dot(x, y, { r: 4.5, color: 'ink', hollow: true }); sR.text(i ? 'Q' : 'P', x, y, { color: 'ink', size: 12, dy: -12, align: 'center', weight: 600 }); });
            sR.vline(f, { color: 'green', width: 1, dash: [2, 4], alpha: 0.8 });
            sR.text('absorber frequency', f, 0.3, { color: 'green', size: 10.5, align: 'left', dx: 4 });
          }
          sR.vline(Om, { color: 'gold', width: 1.6 });
          sR.dot(Om, Math.max(0.1, ab(X1)), { r: 5.5, color: 'blue' });
          // the tower: lateral deflection ∝ (z/H)², compressed display scale
          const vis = (x) => 0.2 * Math.tanh(x / 12), ph = Om * 2.2 * t, re = (z) => z.re * Math.cos(ph) - z.im * Math.sin(ph);
          const u1 = vis(ab(X1)) * (ab(X1) > 0 ? re(X1) / ab(X1) : 0), u2 = vis(ab(X2)) * (ab(X2) > 0 ? re(X2) / ab(X2) : 0);
          const H = 1, Wd = 0.16, prof = (z) => u1 * (z / H) ** 2;
          sT.rect(-0.6, -0.05, 0.6, 0, { fill: 'muted', fillAlpha: 0.25, stroke: false }); sT.line(-0.6, 0, 0.6, 0, { color: 'muted', width: 1.5 });
          const L = [], Rr = []; for (let i = 0; i <= 20; i++) { const z = (H * i) / 20, wz = Wd * (1 - 0.35 * (z / H)); L.push([prof(z) - wz, z]); Rr.push([prof(z) + wz, z]); }
          sT.poly([...L, ...Rr.reverse()], { fill: 'accent', fillAlpha: 0.1, color: 'muted', width: 1.4 });
          for (let i = 1; i < 20; i += 1) { const z = (H * i) / 20, wz = Wd * (1 - 0.35 * (z / H)); sT.line(prof(z) - wz, z, prof(z) + wz, z, { color: 'faint', width: 0.8 }); }
          sT.line(prof(H), H, prof(H), H + 0.15, { color: 'muted', width: 1.5 });
          if (att) {
            const zs = 0.93, zb = 0.8, sx = prof(zs), bx = 0.11 * Math.tanh(ab(X2) / 25) * (ab(X2) > 0 ? re(X2) / ab(X2) : 0), by = zb;
            sT.line(sx, zs, bx, by, { color: 'ink', width: 1.2 });
            sT.circle(bx, by, 0.04, { fill: 'gold', fillAlpha: 0.85, color: 'gold', width: 1.5 });
          }
          const Fv = Math.cos(ph) * 0.13;
          if (Math.abs(Fv) > 0.01) sT.arrow(prof(H) - 0.25 - Fv / 2, H - 0.05, prof(H) - 0.25 + Fv / 2, H - 0.05, { color: 'blue', width: 2.2, head: 7 });
          sT.text(att ? 'pendulum absorber' : 'no absorber', 0.25, 0.8, { color: att ? 'gold' : 'muted', size: 11, align: 'left' });
          cur = { mu, f, za, att, Om, X1, X2 };
        }, { period: 1e9, still: 2 });
        v.legend([['blue', 'main mass $|X_1|$ with absorber'], ['red', 'main mass without absorber', { dash: true }], ['orange', 'absorber swing relative to the mass $|X_2 - X_1|$'], ['gold', 'driving frequency']]);
        v.readout(() => {
          if (!cur) return '';
          const { mu, f, za, att, Om, X1, X2 } = cur, a1 = ab(X1), rel = ab({ re: X2.re - X1.re, im: X2.im - X1.im });
          const { pk, pk0 } = curves(mu, f, za, att);
          const s = String.raw`At $\Omega/\omega_0 = ${v.fix(Om, 3)}$: $|X_1| = ${num(v, a1, 3)}\,F/K$` + (att ? String.raw`, absorber swing $|X_2-X_1| = ${v.fix(rel, 2)}\,F/K$, phase of the absorber relative to the drive ${v.fix((Math.atan2(X2.im, X2.re) * 180) / Math.PI, 0)}°` : '');
          const opt = String.raw` · Den Hartog: $\omega_a/\omega_0 = 1/(1+\mu) = ${v.fix(1 / (1 + mu), 3)}$, $\zeta = ${v.fix(Math.sqrt((3 * mu) / (8 * (1 + mu) ** 3)), 3)}$, peak level $\approx\sqrt{1+2/\mu} = ${v.fix(Math.sqrt(1 + 2 / mu), 1)}$`;
          return s + (att ? String.raw` · highest response over the band: ${v.fix(pk, 1)} with the absorber, ${v.fix(pk0, 1)} without (1% structural damping)` + opt : String.raw` · highest response over the band without the absorber: ${v.fix(pk0, 1)} $= 1/(2\zeta)$ for 1% structural damping`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 11.13
    {
      num: '11.13',
      kind: 'Phenomenon',
      name: 'Avoided crossings',
      statement: String.raw`Take two oscillators with natural frequencies $\omega_a$ (fixed) and $\omega_b$ (tunable), coupled by a spring of relative strength $\kappa$ (unit masses, $K = \begin{pmatrix}\omega_a^2+\kappa & -\kappa\\ -\kappa & \omega_b^2+\kappa\end{pmatrix}$). The normal-mode frequencies are
$$\omega_\pm^2 = \tfrac12\big(\omega_a^2+\omega_b^2\big) + \kappa \pm \sqrt{\tfrac14\big(\omega_a^2-\omega_b^2\big)^2 + \kappa^2}.$$
As $\omega_b$ is swept through $\omega_a$ the two curves do not cross: they **repel**, leaving a minimum gap $\omega_+-\omega_- = \sqrt{\omega_a^2+2\kappa}-\omega_a\approx\kappa/\omega_a$ at $\omega_b = \omega_a$, proportional to the coupling, and they cross only if $\kappa = 0$. Along each branch the mode changes character: far below the crossing the lower mode is mostly oscillator $b$, far above it is mostly oscillator $a$, and at the closest approach both modes are equal mixtures. If the tuning is swept in time, a slow sweep carries the system along its branch, so the energy ends up in the other oscillator; a fast sweep jumps the gap and leaves the energy where it started. With the detuning changing at rate $\alpha$ (in units of $\omega_a$), the fraction left behind is the Landau–Zener factor $\exp(-\pi\kappa^2/2\alpha)$ when $\kappa \ll \omega_a$.`,
      scope: String.raw`Two linear oscillators. A crossing becomes an exact crossing when a symmetry forbids the coupling (the non-crossing rule), and the Landau–Zener formula assumes weak coupling and a sweep that starts and ends far from the gap.`,
      idea: String.raw`The eigenvalues of a real symmetric $2\times2$ matrix (11.4) are equal only if the matrix is a multiple of the identity, which needs both equal diagonal entries and zero off-diagonal entry, two conditions. Tuning a single parameter generically meets only one of them, so the curves miss each other by a gap set by the off-diagonal entry $\kappa$. Near the crossing the problem looks like the beating pair of 11.2 with a slowly changing detuning. In the slow limit the adiabatic principle keeps the system in one normal mode as that mode changes from $a$-like to $b$-like. The Landau–Zener formula of quantum mechanics carries over because, for weak coupling, the slowly varying complex amplitudes obey a two-level Schrödinger equation.`,
      caption: String.raw`Left: the two normal-mode frequencies against the tuning $\omega_b/\omega_a$, coloured by their make-up (blue = oscillator $a$, red = oscillator $b$); the dashed lines are the uncoupled frequencies. Drag the gold marker to read off the mixture; set the coupling to zero to see the curves cross. Bottom: the energy in each oscillator while $\omega_b$ is swept from 0.6 to 1.4 in the chosen time, starting with all the energy in oscillator $a$. Right: the energy left in oscillator $a$ after the sweep against the sweep time, simulated (dots) and from the Landau–Zener formula (curve); the dots follow the formula’s curve, with differences of several percent left by the finite sweep range and the beating at its ends (the formula assumes an infinitely long sweep through a weak coupling).`,
      deps: ['mech-11.2', 'mech-11.4'],
      see: ['qm-11.5', 'qchem-4.10'],
      refs: ['Taylor §11.3'],
      tags: ['avoided crossing', 'level repulsion', 'Landau–Zener'],
      credit: 'von Neumann & Wigner, 1929 (non-crossing rule); Landau, Zener, 1932',
      viz(v) {
        const Mlib = v.M, D0 = 0.6, D1 = 1.4;
        const kS = v.slider('coupling $\\kappa$', 0, 0.3, 0.1, { step: 0.001 });
        const tS = v.slider('sweep time $T$ (units of $1/\\omega_a$)', 2, 2000, 60, { log: true });
        const sB = v.stage({ x: [D0, D1], y: [0.5, 1.55], axes: 'box', height: 300, weight: 1.15, ylabel: '$\\omega/\\omega_a$', title: 'normal-mode frequencies against the tuning $\\omega_b/\\omega_a$' });
        const sZ = v.stage({ x: [2, 2000], y: [-0.03, 1.05], xlog: true, axes: 'box', height: 300, weight: 1, title: 'energy left in oscillator $a$ against the sweep time $T$' });
        const sE = v.stage({ x: [0, 1], y: [-0.03, 1.12], axes: 'box', height: 160, full: true, yticks: [0, 0.5, 1], title: 'energy in each oscillator during the current sweep, against time as a fraction of $T$' });
        const hd = sB.handle(0.9, 0.53, { color: 'gold', constrain: (x) => [clamp(x, D0, D1), 0.53] });
        const eig = (d, c) => { const K = [[1 + c, -c], [-c, d * d + c]], E = Mlib.eigSym2(K); return { w: [Math.sqrt(E.values[1]), Math.sqrt(E.values[0])], vec: [E.vectors[1], E.vectors[0]] }; };
        const sweep = (c, T, keep = false) => {
          const dt = Math.min(0.05, T / 400), n = Math.round(T / dt), tail = 30, nt = Math.round(tail / dt), d = (t) => (t < T ? D0 + ((D1 - D0) * t) / T : D1);
          const e0 = eig(D0, c), a = e0.vec[1], s = Math.abs(a[0]) > 0 ? 1 / a[0] : 1; // upper branch at the start: oscillator a
          let y = [a[0] * s, a[1] * s, 0, 0]; const F = (t, q) => { const dd = d(t); return [q[2], q[3], -(1 + c) * q[0] + c * q[1], -(dd * dd + c) * q[1] + c * q[0]]; };
          const rec = []; let acc = 0, cnt = 0;
          for (let k = 0; k < n + nt; k++) {
            const t = k * dt, dd = d(t), Ea = 0.5 * y[2] ** 2 + 0.5 * y[0] ** 2, Eb = 0.5 * y[3] ** 2 + 0.5 * dd * dd * y[1] ** 2, fa = Ea / (Ea + Eb);
            if (keep && k % Math.max(1, Math.round(n / 600)) === 0 && k <= n) rec.push([t / T, fa]);
            if (k >= n) { acc += fa; cnt++; }
            y = rk4(F, t, y, dt);
          }
          return { frac: acc / cnt, rec };
        };
        const cacheZ = memo(), cacheS = memo(); let cur = null;
        v.render(() => {
          const c = kS.value, d = hd.x, T = tS.value;
          // branches coloured by make-up
          sB.line(D0, 1, D1, 1, { color: 'blue', width: 1, dash: [5, 4], alpha: 0.6 });
          sB.line(D0, D0, D1, D1, { color: 'red', width: 1, dash: [5, 4], alpha: 0.6 });
          let prev = null;
          for (let i = 0; i <= 240; i++) {
            const x = D0 + ((D1 - D0) * i) / 240, e = eig(x, c), pts = e.w.map((w, k) => [x, w, e.vec[k][0] ** 2]);
            if (prev) for (let k = 0; k < 2; k++) sB.line(prev[k][0], prev[k][1], pts[k][0], pts[k][1], { color: v.mix('red', 'blue', pts[k][2]), width: 3 });
            prev = pts;
          }
          const e = eig(d, c), e1 = eig(1, c);
          sB.vline(d, { color: 'gold', width: 1.2 });
          e.w.forEach((w, k) => sB.dot(d, w, { r: 5.5, color: v.mix('red', 'blue', e.vec[k][0] ** 2) }));
          if (c > 0.004) { sB.arrow(1, e1.w[0], 1, e1.w[1], { color: 'ink', width: 1.4, both: true, head: 6 }); sB.text('gap', 1, (e1.w[0] + e1.w[1]) / 2, { color: 'ink', size: 11.5, dx: 8 }); }
          sB.text('oscillator a', D1, 1, { color: 'blue', size: 11, align: 'right', dy: 10, dx: -4 }); sB.text('oscillator b', 0.66, 0.66, { color: 'red', size: 11, align: 'left', dx: 10, dy: 8 });
          // Landau–Zener scan
          const Ts = [2, 4, 8, 15, 30, 60, 120, 250, 500, 1000, 2000];
          const Z = cacheZ(c.toFixed(4), () => Ts.map((T0) => [T0, sweep(c, T0).frac]));
          sZ.fn((x) => Math.exp((-Math.PI * c * c * x) / (2 * (D1 - D0))), { color: 'ink', width: 2 });
          sZ.dots(Z, { r: 4.5, color: 'blue' });
          const S = cacheS(`${c.toFixed(4)}|${T}`, () => sweep(c, T, true));
          sZ.dot(T, S.frac, { r: 6.5, color: 'gold' });
          // energy during the current sweep
          const xc = (1 - D0) / (D1 - D0);
          sE.vline(xc, { color: 'muted', width: 1, dash: [3, 4] }); sE.tex('\\omega_b = \\omega_a', xc, 1.06, { color: 'muted', size: 12, align: 'left', dx: 4 });
          sE.path(S.rec, { color: 'blue', width: 1.6 });
          sE.path(S.rec.map(([x, f]) => [x, 1 - f]), { color: 'red', width: 1.6, alpha: 0.85 });
          cur = { c, d, e, e1, S, T };
        });
        v.legend([['blue', 'oscillator $a$ / its energy'], ['red', 'oscillator $b$ / its energy'], ['ink', 'Landau–Zener $e^{-\\pi\\kappa^2/2\\alpha}$'], ['gold', 'current tuning / sweep']]);
        v.readout(() => {
          if (!cur) return '';
          const { c, d, e, e1, S, T } = cur, pa = e.vec.map((q) => q[0] ** 2);
          const alpha = (D1 - D0) / T;
          return String.raw`At $\omega_b/\omega_a = ${v.fix(d, 3)}$: $\omega_- = ${v.fix(e.w[0], 4)}$ (${v.fix(100 * pa[0], 0)}% oscillator $a$), $\omega_+ = ${v.fix(e.w[1], 4)}$ (${v.fix(100 * pa[1], 0)}% $a$) · minimum gap $\sqrt{1+2\kappa}-1 = ${v.fix(e1.w[1] - e1.w[0], 4)}$ ≈ κ = ${v.fix(c, 3)} · sweep in $T = ${v.fmt(T, 3)}$: energy left in $a$ ${v.fix(100 * S.frac, 1)}% (simulated), Landau–Zener ${v.fix(100 * Math.exp((-Math.PI * c * c) / (2 * alpha)), 1)}%`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 11.14
    {
      num: '11.14',
      kind: 'Theorem',
      name: 'Unstable modes and saddle equilibria',
      statement: String.raw`Let $\mathbf q_0$ be an equilibrium of a natural system with linearisation $M\ddot{\boldsymbol\eta} + K\boldsymbol\eta = 0$ (11.3), and suppose the generalized eigenvalue problem $K\mathbf a = \lambda M\mathbf a$ (11.4) has a **negative** eigenvalue $\lambda = -\gamma^2 < 0$, i.e. $\mathbf q_0$ is not a minimum of $V$ but a saddle (or a maximum) in the direction $\mathbf a$. Then:
(a) the corresponding mode has an **imaginary frequency** $\omega = i\gamma$: its normal coordinate obeys $\ddot q = \gamma^2q$, so $q(t) = q(0)\cosh\gamma t + \dot q(0)\sinh(\gamma t)/\gamma$, and almost every small displacement grows like $e^{\gamma t}$;
(b) the equilibrium is **unstable**, for the linearised and for the full nonlinear system: there are starting points arbitrarily close to $\mathbf q_0$, at rest, whose trajectories leave a fixed neighbourhood;
(c) modes with $\lambda > 0$ keep oscillating, so near a saddle the motion escapes along the unstable eigenvector while oscillating across it.
A transition state in chemistry is such a saddle, with exactly one imaginary-frequency mode, the reaction coordinate.`,
      idea: String.raw`In normal coordinates (11.5) the linearised Lagrangian is $\sum\tfrac12(\dot q_k^2-\lambda_kq_k^2)$; for $\lambda_k = -\gamma^2$ that term describes a particle on an inverted parabola, which runs away exponentially. For the full system the escape survives the nonlinear terms: near $\mathbf q_0$ they are smaller than the linear push by a factor of the distance. Lyapunov’s instability theorem (or a Chetaev function such as $q\dot q$) makes this rigorous when the unstable eigenvalue is strictly negative. The stability definitions are those of 3.12.`,
      caption: String.raw`The potential $V = \tfrac12\lambda x^2 + \tfrac14x^4 + \tfrac12(y-sx)^2$ is shown as a heat map (blue below the equilibrium value, red above), with the eigen-directions of its Hessian at the origin: red for a negative $\omega^2$, green for a positive one. Twelve trajectories start at rest on a small circle around the origin. With $\lambda < 0$ the origin is a saddle between two valleys: almost every trajectory slides off along the red direction, and the right panel shows its distance growing like $\varepsilon\cosh\gamma t$ (dashed). Slide $\lambda$ above zero: the saddle becomes a minimum, $\omega^2$ turns positive (bottom), and every trajectory stays near the origin.`,
      deps: ['mech-11.4', 'mech-3.12'],
      see: ['kin-2.7', 'astro-2.3'],
      refs: ['Arnold §22', 'Tong §2.6'],
      tags: ['instability', 'saddle point', 'imaginary frequency'],
      viz(v) {
        const T = 16, DT = 0.01, EV = 5, R0 = 2.3;
        const lS = v.slider('curvature at the equilibrium $\\lambda$', -1.5, 1.5, -0.6, { step: 0.01 });
        const sS = v.slider('coupling $s$ (tilts the eigen-directions)', 0, 1.2, 0.6, { step: 0.01 });
        const eS = v.slider('starting distance $\\varepsilon$', 0.01, 0.2, 0.03, { log: true });
        const sV = v.stage({ x: [-R0, R0], y: [-R0, R0], equal: true, axes: true, height: 340, xlabel: '$x$', ylabel: '$y$', title: 'potential near the equilibrium' });
        const sG = v.stage({ x: [0, T], y: [1e-3, 5], ylog: true, axes: 'box', height: 340, xlabel: 't', title: 'distance from the equilibrium (log scale)' });
        const sW = v.stage({ x: [-1.5, 1.5], y: [-2.6, 3.6], axes: true, height: 150, full: true, ylabel: '$\\omega^2$', title: 'the two eigenvalues $\\omega^2$ of the linearised problem against $\\lambda$' });
        const Vf = (x, y, l, s) => 0.5 * l * x * x + 0.25 * x ** 4 + 0.5 * (y - s * x) ** 2;
        const eig = (l, s) => { const E = v.M.eigSym2([[l + s * s, -s], [-s, 1]]); return { lam: [E.values[1], E.values[0]], vec: [E.vectors[1], E.vectors[0]] }; };
        const cache = memo(); let cur = null;
        const run = () => cache([lS.value, sS.value, eS.value].join('|'), () => {
          const l = lS.value, s = sS.value, eps = eS.value, E = eig(l, s);
          const F = (t, q) => { const u = q[1] - s * q[0]; return [q[2], q[3], -(l * q[0] + q[0] ** 3 - s * u), -u]; };
          const out = (t, q) => Math.abs(q[0]) > R0 || Math.abs(q[1]) > R0;
          const trajs = Array.from({ length: 12 }, (_, k) => { const ph = (TAU * k) / 12 + 0.13; return rk4rec(F, [eps * Math.cos(ph), eps * Math.sin(ph), 0, 0], T, Math.round(T / DT), EV, out); });
          let gMeas = NaN;
          if (E.lam[0] < 0) {
            const u = E.vec[0], e0 = 1e-5, R = rk4rec(F, [e0 * u[0], e0 * u[1], 0, 0], 3 * T, Math.round((3 * T) / DT), EV, out);
            const pts = R.y.map((q, i) => [R.t[i], Math.log(Math.hypot(q[0], q[1]))]).filter((p) => p[1] > Math.log(1e-3) && p[1] < Math.log(0.03));
            if (pts.length > 4) gMeas = v.M.linreg(pts.map((p) => p[0]), pts.map((p) => p[1])).slope;
          }
          let maxR = 0; for (const R of trajs) for (const q of R.y) maxR = Math.max(maxR, Math.hypot(q[0], q[1]));
          return { l, s, eps, E, trajs, gMeas, maxR };
        });
        v.animate((t) => {
          const B = run(), tau = Math.min(2 * t, T), l = B.l, s = B.s;
          sV.heat((x, y) => Math.asinh(Vf(x, y, l, s) / 0.04) / Math.asinh(3 / 0.04), { range: [-1, 1], cmap: 'theme-diverging', neg: 'blue', pos: 'red', key: `${l}|${s}`, res: 3, alpha: 0.85 });
          sV.contour((x, y) => Vf(x, y, l, s), [-0.5, -0.3, -0.15, -0.05, 0.1, 0.3, 0.6, 1, 1.6], { color: 'muted', width: 0.8 });
          sV.contour((x, y) => Vf(x, y, l, s), [0], { color: 'ink', width: 1.2, dash: [5, 4] });
          for (let k = 0; k < 2; k++) {
            const u = B.E.vec[k], lam = B.E.lam[k], col = lam < 0 ? 'red' : 'green', L = 1.2;
            sV.line(-u[0] * L, -u[1] * L, u[0] * L, u[1] * L, { color: col, width: 2.4 });
            const e = u[0] >= 0 ? [-u[0] * L, -u[1] * L] : [u[0] * L, u[1] * L];
            sV.tex(lam < 0 ? `\\omega = ${v.fix(Math.sqrt(-lam), 2)}\\,i` : `\\omega = ${v.fix(Math.sqrt(lam), 2)}`, e[0], e[1], { color: col, size: 13, align: 'right', dx: -6, dy: e[1] > 0 ? -8 : 8, plate: true });
          }
          for (const R of B.trajs) {
            const i = Math.min(R.t.length - 1, Math.round(tau / R.dt));
            series(sV, R.y.map((q) => q[0]), R.y.map((q) => q[1]), i, { color: 'purple', width: 1.3, alpha: 0.8 });
            sV.dot(R.y[i][0], R.y[i][1], { r: 3.5, color: 'gold' });
            series(sG, R.t, R.y.map((q) => Math.max(1.1e-3, Math.hypot(q[0], q[1]))), i, { color: 'purple', width: 1.2, alpha: 0.6 });
          }
          sV.dot(0, 0, { r: 3.5, color: 'ink' });
          if (B.E.lam[0] < 0) { const g = Math.sqrt(-B.E.lam[0]); sG.fn((x) => B.eps * Math.cosh(g * x), { color: 'red', width: 1.8, dash: [6, 4] }); sG.text('ε cosh γt', Math.acosh(Math.max(1.01, 0.8 / B.eps)) / g, 0.8, { color: 'red', size: 12, align: 'right', dx: -8 }); }
          else sG.hband(B.eps * 0.98, B.eps * Math.sqrt(B.E.lam[1] / Math.max(B.E.lam[0], 1e-9)), { color: 'green', alpha: 0.12 });
          sG.hline(R0, { color: 'muted', width: 1, dash: [3, 4] }); sG.text('edge of the picture', T, R0, { color: 'muted', size: 10.5, align: 'right', dy: -8 });
          sG.vline(tau, { color: 'gold', width: 1.2 });
          // eigenvalues against λ
          sW.hband(-3, 0, { color: 'red', alpha: 0.07 });
          sW.text('ω² < 0: ω = iγ, unstable', -1.45, -2.0, { color: 'red', size: 11 });
          sW.fn((x) => eig(x, s).lam[0], { color: 'red', width: 2, domain: [-1.5, 0] });
          sW.fn((x) => eig(x, s).lam[0], { color: 'green', width: 2, domain: [0, 1.5] });
          sW.fn((x) => eig(x, s).lam[1], { color: 'green', width: 2 });
          sW.vline(l, { color: 'gold', width: 1.2 });
          for (let k = 0; k < 2; k++) sW.dot(l, B.E.lam[k], { r: 4.5, color: B.E.lam[k] < 0 ? 'red' : 'green' });
          cur = B;
        }, { period: T / 2 + 1, still: 5 });
        v.legend([['purple', 'trajectories from rest at distance ε'], ['red', 'unstable direction / $\\omega^2<0$'], ['green', 'oscillating direction / $\\omega^2>0$'], ['ink', 'level $V = V(0)$', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const B = cur, [l1, l2] = B.E.lam;
          if (l1 < 0) return String.raw`Hessian eigenvalues $\omega^2 = ${v.fix(l1, 4)}$ and $${v.fix(l2, 4)}$: a saddle, $\gamma = \sqrt{${v.fix(-l1, 4)}} = ${v.fix(Math.sqrt(-l1), 4)}$ · measured growth rate of a run started $10^{-5}$ along the unstable direction (slope of $\log|\boldsymbol\eta|$ while it is small): ${v.fix(B.gMeas, 4)} · trajectories reach ${v.fix(B.maxR, 2)} from a start at ${v.fix(B.eps, 3)}`;
          return String.raw`Hessian eigenvalues $\omega^2 = ${v.fix(l1, 4)}$ and $${v.fix(l2, 4)}$, both positive: a minimum, frequencies $${v.fix(Math.sqrt(Math.max(0, l1)), 3)}$ and $${v.fix(Math.sqrt(l2), 3)}$ · every trajectory stays within ${v.fix(B.maxR, 4)} of the equilibrium (started at ${v.fix(B.eps, 3)})`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 11.15
    {
      num: '11.15',
      kind: 'Theorem',
      name: 'Lagrange–Dirichlet theorem: potential minima are stable',
      statement: String.raw`Consider a natural system $L = \tfrac12\dot{\mathbf q}^{\mathsf T}M(\mathbf q)\dot{\mathbf q} - V(\mathbf q)$ with $M$ positive definite. If $\mathbf q_0$ is a **strict local minimum** of $V$ (even a degenerate one, where the Hessian vanishes), then the equilibrium $\mathbf q = \mathbf q_0$, $\dot{\mathbf q} = 0$ is **Lyapunov stable**: for every neighbourhood $U$ of $(\mathbf q_0, 0)$ in phase space there is a smaller neighbourhood $W$ such that every motion starting in $W$ stays in $U$ for all time. The minimum need not be quadratic: $V = x^4 + y^4$ has a stable minimum although its linearisation (11.3) is identically zero and says nothing. The equilibrium is stable but never asymptotically stable, since energy is conserved. The converse fails for merely smooth potentials: Painlevé’s example $V(x) = e^{-1/x^2}\cos(1/x)$ has a stable equilibrium at $x = 0$ that is not a minimum. When the Hessian has a negative eigenvalue, however, the equilibrium is unstable (11.14).`,
      idea: String.raw`Use the energy $E = T + V$ as a Lyapunov function (ode-5.6). It is conserved (3.6), and near $\mathbf q_0$ it is positive except at the equilibrium. Choose a small sphere around $\mathbf q_0$ and let $m$ be the minimum of $V - V(\mathbf q_0)$ on it, which is positive because the minimum is strict. Any motion starting with $E - V(\mathbf q_0) < m$ can never reach the sphere, since there its energy would be at least $m$. So it stays inside the connected "cup" of the sublevel set $\{V \le E\}$ around $\mathbf q_0$, and this cup shrinks to $\mathbf q_0$ as $E\to V(\mathbf q_0)$. Nothing about the Hessian is used, only the strict minimum.`,
      caption: String.raw`Choose a potential and drag the gold start point and the purple velocity tip. The shaded region is the connected part of $\{V \le E\}$ that contains the equilibrium. When it is a closed cup (green) the trajectory (blue) can never leave it; when it reaches the edge of the window (red), nothing holds the motion in. Right: the farthest distance reached against the starting distance, for starts at rest along the same direction. At a minimum, quadratic or flat quartic, the points fall on a line toward the origin: small starts stay small, which is stability. At a saddle, even tiny starts reach the edge.`,
      deps: ['mech-3.12', 'mech-3.6', 'mech-6.6', 'ode-5.6'],
      see: ['mech-11.14'],
      refs: ['Arnold §22'],
      tags: ['stability', 'Lyapunov function', 'energy'],
      credit: 'Lagrange, 1788; Dirichlet, 1846',
      viz(v) {
        const WR = 1.5, T = 60, DT = 0.01, NG = 150;
        const POT = {
          quad: { V: (x, y) => x * x + 0.6 * y * y + 0.4 * x * y, g: (x, y) => [2 * x + 0.4 * y, 1.2 * y + 0.4 * x] },
          quart: { V: (x, y) => x ** 4 + y ** 4 + 0.6 * x * x * y * y, g: (x, y) => [4 * x ** 3 + 1.2 * x * y * y, 4 * y ** 3 + 1.2 * x * x * y] },
          saddle: { V: (x, y) => x * x - y * y + 0.5 * (x * x + y * y) ** 2, g: (x, y) => { const r2 = x * x + y * y; return [2 * x + 2 * x * r2, -2 * y + 2 * y * r2]; } },
          monkey: { V: (x, y) => x ** 3 - 3 * x * y * y, g: (x, y) => [3 * x * x - 3 * y * y, -6 * x * y] },
        };
        const pick = v.select('potential', [{ value: 'quad', label: 'quadratic minimum' }, { value: 'quart', label: 'flat quartic minimum' }, { value: 'saddle', label: 'saddle' }, { value: 'monkey', label: 'monkey saddle' }], 'quart');
        const sV = v.stage({ x: [-WR, WR], y: [-WR, WR], equal: true, axes: true, height: 360, title: 'energy cup $\\{V \\le E\\}$ around the equilibrium' });
        const sR = v.stage({ x: [0.02, 1.2], y: [0.01, 3], xlog: true, ylog: true, axes: 'box', height: 360, xlabel: 'starting distance δ (from rest)', title: 'farthest distance reached in $0 \\le t \\le 60$' });
        const hp = sV.handle(0.45, 0.25, { color: 'gold', label: 'start', constrain: (x, y) => [clamp(x, -1.4, 1.4), clamp(y, -1.4, 1.4)] });
        const hv = sV.handle(0.45, 0.55, { color: 'purple', label: 'velocity', constrain: (x, y) => [clamp(x, -1.45, 1.45), clamp(y, -1.45, 1.45)] });
        let last = [hp.x, hp.y];
        hp.onDrag = () => { hv.set(hv.x + hp.x - last[0], hv.y + hp.y - last[1]); last = [hp.x, hp.y]; };
        const cacheT = memo(), cacheC = memo(), cacheS = memo(); let cur = null;
        const sim = (P, x0, v0) => {
          const F = (t, q) => { const g = P.g(q[0], q[1]); return [q[2], q[3], -g[0], -g[1]]; };
          const R = rk4rec(F, [x0[0], x0[1], v0[0], v0[1]], T, Math.round(T / DT), 4, (t, q) => Math.abs(q[0]) > WR || Math.abs(q[1]) > WR);
          let rmax = 0, e0 = 0.5 * (v0[0] ** 2 + v0[1] ** 2) + P.V(x0[0], x0[1]), de = 0;
          for (const q of R.y) { rmax = Math.max(rmax, Math.hypot(q[0], q[1])); de = Math.max(de, Math.abs(0.5 * (q[2] ** 2 + q[3] ** 2) + P.V(q[0], q[1]) - e0)); }
          return { R, rmax, escaped: R.stopped, de };
        };
        v.render(() => {
          const key = pick.value, P = POT[key], x0 = [hp.x, hp.y], v0 = [hv.x - hp.x, hv.y - hp.y], E = P.V(x0[0], x0[1]) + 0.5 * (v0[0] ** 2 + v0[1] ** 2);
          // the connected sublevel set containing the origin (flood fill on a grid)
          const C = cacheC(`${key}|${E.toFixed(6)}`, () => {
            const h = (2 * WR) / NG, V = new Float64Array((NG + 1) ** 2), inC = new Uint8Array((NG + 1) ** 2), id = (i, j) => j * (NG + 1) + i;
            for (let j = 0; j <= NG; j++) for (let i = 0; i <= NG; i++) V[id(i, j)] = P.V(-WR + i * h, -WR + j * h);
            const c0 = NG / 2, st = [[c0, c0]]; let leak = false, rc = 0;
            if (V[id(c0, c0)] <= E) inC[id(c0, c0)] = 1; else st.length = 0;
            while (st.length) {
              const [i, j] = st.pop(); rc = Math.max(rc, Math.hypot(-WR + i * h, -WR + j * h));
              if (i === 0 || j === 0 || i === NG || j === NG) leak = true;
              for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) if (a >= 0 && b >= 0 && a <= NG && b <= NG && !inC[id(a, b)] && V[id(a, b)] <= E) { inC[id(a, b)] = 1; st.push([a, b]); }
            }
            return { inC, leak, rc, h, id };
          });
          const col = v.rgb(C.leak ? 'red' : 'green');
          sV.raster((x, y) => { const i = Math.round((x + WR) / C.h), j = Math.round((y + WR) / C.h); return i >= 0 && j >= 0 && i <= NG && j <= NG && C.inC[C.id(i, j)] ? [col[0], col[1], col[2], 60] : null; }, { key: `${key}|${E.toFixed(6)}`, res: 2 });
          const lv = key === 'quad' ? [0.02, 0.1, 0.25, 0.5, 1, 1.6] : key === 'quart' ? [0.005, 0.03, 0.1, 0.3, 0.7, 1.4] : key === 'saddle' ? [-0.4, -0.2, -0.05, 0.05, 0.3, 0.8, 1.6] : [-1.5, -0.6, -0.2, -0.03, 0.03, 0.2, 0.6, 1.5];
          sV.contour(P.V, lv, { color: 'muted', width: 0.9 });
          sV.contour(P.V, [E], { color: C.leak ? 'red' : 'green', width: 1.8 });
          const S = cacheT(`${key}|${x0}|${v0}`, () => sim(P, x0, v0));
          sV.path(S.R.y.map((q) => [q[0], q[1]]), { color: 'blue', width: 1.4, alpha: 0.85 });
          sV.arrow(hp.x, hp.y, hv.x, hv.y, { color: 'purple', width: 2 });
          sV.dot(0, 0, { r: 3.5, color: 'ink' });
          // farthest distance against starting distance
          const n0 = Math.hypot(x0[0], x0[1]) || 1, dir = [x0[0] / n0, x0[1] / n0];
          const Sw = cacheS(`${key}|${dir}`, () => Array.from({ length: 13 }, (_, k) => { const d = 0.025 * 1.36 ** k; const r = sim(P, [dir[0] * d, dir[1] * d], [0, 0]); return [d, r.escaped ? 2.2 : r.rmax, r.escaped]; }));
          sR.fn((d) => d, { color: 'faint', width: 1.2, dash: [4, 4] });
          sR.text('reached = start', 0.5, 0.5, { color: 'muted', size: 11, dx: 6, dy: 10 });
          sR.hline(2.2, { color: 'red', width: 1, dash: [3, 4] }); sR.text('escaped from the window', 0.022, 2.2, { color: 'red', size: 11, dy: -9 });
          for (const [d, r, esc] of Sw) sR.dot(d, r, { r: 4.5, color: esc ? 'red' : 'green' });
          cur = { key, E, C, S };
        });
        v.legend([['green', 'closed cup: trapped'], ['red', 'cup reaches the edge: escape possible'], ['blue', 'trajectory'], ['purple', 'initial velocity']]);
        v.readout(() => {
          if (!cur) return '';
          const { key, E, C, S } = cur;
          const lin = { quad: 'Hessian positive definite: linearisation already predicts stability', quart: 'Hessian identically zero: linearisation is inconclusive, yet the minimum is strict', saddle: 'Hessian has a negative eigenvalue: unstable (11.14)', monkey: 'Hessian identically zero and the origin is not a minimum' }[key];
          const cup = C.leak ? 'the sublevel set reaches the edge of the window: no trap' : String.raw`closed cup of radius ${v.fix(C.rc, 3)}; the trajectory reaches ${v.fix(S.rmax, 3)}`;
          return String.raw`$E - V(0) = ${num(v, E, 4)}$ · ${cup} · energy conserved to $${sci(v, S.de)}$ · ${lin}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 11.16
    {
      num: '11.16',
      kind: 'Theorem',
      name: 'Lagrangian density and the field Euler–Lagrange equation',
      statement: String.raw`Let a field $y(x,t)$ have action $S = \int\!\!\int \mathcal L(y, y_t, y_x)\,dx\,dt$ with a **Lagrangian density** $\mathcal L$. Then $S$ is stationary under all variations $\delta y$ that vanish at the boundary of the space-time region exactly when $y$ satisfies the **field Euler–Lagrange equation**
$$\frac{\partial}{\partial t}\frac{\partial\mathcal L}{\partial y_t} + \frac{\partial}{\partial x}\frac{\partial\mathcal L}{\partial y_x} - \frac{\partial\mathcal L}{\partial y} = 0 .$$
For the string, the bead-chain Lagrangian $L = \sum_j\big[\tfrac12m\dot y_j^2 - \tfrac12k(y_{j+1}-y_j)^2\big]$ with $m = \mu a$ and $k = \tau/a$ is a Riemann sum $\sum_j a\big[\tfrac12\mu\dot y_j^2 - \tfrac12\tau\big(\tfrac{y_{j+1}-y_j}{a}\big)^2\big]$, which tends to $\int\mathcal L\,dx$ with
$$\mathcal L = \tfrac12\mu y_t^2 - \tfrac12\tau y_x^2 - U(y),$$
where an on-site potential $U$ (a restoring term $\tfrac12\kappa y^2$, a quartic term $\tfrac14\lambda y^4$, …) may be added. The field equation is then $\mu y_{tt} = \tau y_{xx} - U'(y)$: the wave equation for $U = 0$, the Klein–Gordon equation for $U = \tfrac12\kappa y^2$ (dispersive, $\omega^2 = (\tau k^2 + \kappa)/\mu$), and a nonlinear ($\phi^4$) wave equation for the quartic term.`,
      idea: String.raw`Vary the action: $\delta S = \int\!\!\int\big(\mathcal L_y\,\delta y + \mathcal L_{y_t}\,\partial_t\delta y + \mathcal L_{y_x}\,\partial_x\delta y\big)\,dx\,dt$. Integrating the last two terms by parts moves the derivatives onto $\mathcal L_{y_t}$ and $\mathcal L_{y_x}$; the boundary terms vanish, and since $\delta y$ is arbitrary inside, the fundamental lemma used for the ordinary Euler–Lagrange equation (5.4) forces the bracket to vanish. This is Hamilton’s principle (6.5) with infinitely many coordinates $y(x)$. Equivalently, the chain’s own Lagrange equations, $\ddot y_j = (y_{j+1}-2y_j+y_{j-1})/a^2\cdot\tau/\mu - U'(y_j)/\mu$, are a finite-difference form of the field equation, and their solutions converge to it as $a\to0$ (11.9).`,
      caption: String.raw`A bump on a string fixed at both ends is released from rest. Blue: a chain of $N$ beads whose Lagrangian is the Riemann sum of the density; grey: the continuum string (a very fine chain). Add beads and the chain merges with the string; the right panel shows the error at $t = 0.6$ falling like $1/N^2$. The middle panel plots the density $\mathcal L(x,t)$: kinetic part above the axis, potential part below (dots: the chain’s per-bead values). Add a restoring term and the field equation becomes Klein–Gordon: the pulses now disperse and leave a ringing tail. Add the quartic term and the equation turns nonlinear.`,
      deps: ['mech-11.9', 'mech-6.5', 'mech-5.4'],
      see: ['pde-11.8', 'waves-3.12', 'waves-1.1'],
      refs: ['Goldstein §13.1', 'Goldstein §13.2'],
      tags: ['field theory', 'Lagrangian density', 'continuum limit'],
      viz(v) {
        const TT = 2, FR = 0.01, NREF = 600, A0 = 0.3, X0 = 0.3, W0 = 0.05, TC = 0.6;
        const NS = v.slider('beads $N$', 4, 160, 30, { int: true });
        const kS = v.slider('restoring term $\\kappa$', 0, 400, 0, { step: 1 });
        const qS = v.slider('quartic term $\\lambda$', 0, 3000, 0, { step: 10 });
        const sY = v.stage({ x: [-0.02, 1.02], y: [-0.33, 0.36], axes: false, height: 200, full: true });
        const sL = v.stage({ x: [0, 1], y: [-30, 30], axes: 'box', height: 220, weight: 1.45, title: 'Lagrangian density $\\mathcal L(x,t)$: kinetic (up), potential (down)' });
        const sC = v.stage({ x: [5, 220], y: [1e-5, 0.3], xlog: true, ylog: true, axes: 'box', height: 220, weight: 1, title: 'max |chain − string| at $t = 0.6$ against $N$' });
        const simulate = (N, kap, lam, Tend) => {
          const a = 1 / (N + 1), nf = Math.ceil(FR / (0.4 * a)), dt = FR / nf, nF = Math.round(Tend / FR);
          const y = new Float64Array(N + 2), u = new Float64Array(N + 2), acc = new Float64Array(N + 2);
          for (let j = 1; j <= N; j++) { const x = j * a; y[j] = A0 * Math.exp(-((x - X0) ** 2) / (2 * W0 * W0)); }
          const force = () => { for (let j = 1; j <= N; j++) acc[j] = (y[j + 1] - 2 * y[j] + y[j - 1]) / (a * a) - kap * y[j] - lam * y[j] ** 3; };
          force(); const frames = [{ y: y.slice(), u: u.slice() }];
          for (let f = 1; f <= nF; f++) {
            for (let s = 0; s < nf; s++) { for (let j = 1; j <= N; j++) { u[j] += 0.5 * dt * acc[j]; y[j] += dt * u[j]; } force(); for (let j = 1; j <= N; j++) u[j] += 0.5 * dt * acc[j]; }
            frames.push({ y: y.slice(), u: u.slice() });
          }
          return { a, N, frames };
        };
        const Uf = (y, kap, lam) => 0.5 * kap * y * y + 0.25 * lam * y ** 4;
        const lagr = (S, F, kap, lam) => { const a = S.a; let L = 0; for (let j = 1; j <= S.N; j++) L += a * (0.5 * F.u[j] ** 2 - Uf(F.y[j], kap, lam)); for (let j = 0; j <= S.N; j++) L -= (0.5 * (F.y[j + 1] - F.y[j]) ** 2) / a; return L; };
        const interp = (S, F, x) => { const p = x / S.a, j = Math.min(S.N, Math.floor(p)), w = p - j; return F.y[j] * (1 - w) + F.y[j + 1] * w; };
        const err = (S, R, fi) => { let e = 0; for (let j = 1; j <= S.N; j++) e = Math.max(e, Math.abs(S.frames[fi].y[j] - interp(R, R.frames[fi], j * S.a))); return e; };
        const cR = memo(), cN = memo(), cV = memo(); let cur = null;
        v.animate((t) => {
          const kap = kS.value, lam = qS.value, N = NS.value, key = `${kap}|${lam}`;
          const R = cR(key, () => simulate(NREF, kap, lam, TT)), S = cN(`${key}|${N}`, () => simulate(N, kap, lam, TT));
          const CV = cV(key, () => [8, 16, 32, 64, 128].map((n) => [n, err(simulate(n, kap, lam, TC), R, Math.round(TC / FR))]));
          const tau = Math.min(0.15 * t, TT), fi = Math.min(S.frames.length - 1, Math.round(tau / FR)), FS = S.frames[fi], FRf = R.frames[fi];
          // the string and the chain
          sY.line(0, 0, 1, 0, { color: 'faint', width: 1, dash: [3, 4] });
          for (const x of [0, 1]) sY.line(x, -0.1, x, 0.1, { color: 'muted', width: 3 });
          const ref = []; for (let j = 0; j <= NREF + 1; j += 2) ref.push([j * R.a, FRf.y[j]]); sY.path(ref, { color: 'muted', width: 3, alpha: 0.55 });
          const ch = []; for (let j = 0; j <= N + 1; j++) ch.push([j * S.a, FS.y[j]]);
          sY.path(ch, { color: 'blue', width: 1.6 });
          if (N <= 80) sY.dots(ch.slice(1, -1), { r: N <= 30 ? 4 : 2.5, color: 'blue' });
          sY.corner(`t = ${v.fix(tau, 2)} · N = ${N} beads, spacing a = ${v.fix(S.a, 4)}`, 'tl');
          sY.corner(String.raw`field equation: $y_{tt} = y_{xx}${kap ? ` - ${kap}\\,y` : ''}${lam ? ` - ${lam}\\,y^3` : ''}$`, 'tr', { color: 'ink' });
          // the density
          const kin = [], pot = [], net = [];
          for (let j = 1; j <= NREF; j += 2) { const x = j * R.a, yx = (FRf.y[j + 1] - FRf.y[j - 1]) / (2 * R.a), k = 0.5 * FRf.u[j] ** 2, p = 0.5 * yx * yx + Uf(FRf.y[j], kap, lam); kin.push([x, k]); pot.push([x, -p]); net.push([x, k - p]); }
          let m = 1; for (const q of kin) m = Math.max(m, q[1]); for (const q of pot) m = Math.max(m, -q[1]);
          sL.setView([0, 1], [-1.15 * m, 1.15 * m]);
          sL.path([[0, 0], ...kin, [1, 0]], { fill: 'blue', fillAlpha: 0.25, color: 'blue', width: 1.2 });
          sL.path([[0, 0], ...pot, [1, 0]], { fill: 'red', fillAlpha: 0.2, color: 'red', width: 1.2 });
          sL.path(net, { color: 'ink', width: 1.2 });
          if (N <= 80) { const pts = []; for (let j = 1; j <= N; j++) { const l1 = (FS.y[j] - FS.y[j - 1]) / S.a, l2 = (FS.y[j + 1] - FS.y[j]) / S.a; pts.push([j * S.a, 0.5 * FS.u[j] ** 2 - 0.25 * (l1 * l1 + l2 * l2) - Uf(FS.y[j], kap, lam)]); } sL.dots(pts, { r: 3, color: 'gold' }); }
          // convergence
          sC.fn((n) => CV[0][1] * (CV[0][0] / n) ** 2, { color: 'faint', width: 1.2, dash: [4, 4] });
          sC.text('slope −2', 40, CV[0][1] * (CV[0][0] / 40) ** 2, { color: 'muted', size: 11, dx: 6, dy: -8 });
          sC.path(CV, { color: 'blue', width: 1.8 }); sC.dots(CV, { r: 4, color: 'blue' });
          const eN = err(S, R, Math.round(TC / FR)); sC.dot(N, Math.max(1e-5, eN), { r: 6, color: 'gold' });
          cur = { N, kap, lam, LN: lagr(S, FS, kap, lam), LR: lagr(R, FRf, kap, lam), eNow: err(S, R, fi), CV, tau };
        }, { period: TT / 0.15 + 1, still: 2.4 });
        v.legend([['blue', 'bead chain / kinetic density $\\tfrac12\\mu y_t^2$'], ['muted', 'continuum string'], ['red', 'potential density $\\tfrac12\\tau y_x^2 + U(y)$'], ['gold', 'chain, per bead']]);
        v.readout(() => {
          if (!cur) return '';
          const c = cur, sl = Math.log(c.CV[3][1] / c.CV[4][1]) / Math.log(2);
          return String.raw`At $t = ${v.fix(c.tau, 2)}$: chain Lagrangian $\sum_j a\big[\tfrac12\dot y_j^2 - \tfrac12\big(\tfrac{\Delta y_j}{a}\big)^2 - U(y_j)\big] = ${v.fix(c.LN, 4)}$, continuum $\int\mathcal L\,dx = ${v.fix(c.LR, 4)}$ · max distance between chain and string now ${v.fix(c.eNow, 4)} · convergence order between $N = 64$ and $128$: ${v.fix(sl, 2)} · field Euler–Lagrange equation $\mu y_{tt} = \tau y_{xx} - \kappa y - \lambda y^3$ with $\mu = \tau = 1$, $\kappa = ${c.kap}$, $\lambda = ${c.lam}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 11.17
    {
      num: '11.17',
      kind: 'Theorem',
      name: 'Noether’s theorem for fields: conserved currents',
      statement: String.raw`Let $y(x,t)$ satisfy the field Euler–Lagrange equation (11.16) of a density $\mathcal L(y, y_t, y_x)$.
(a) If $\mathcal L$ does not depend explicitly on $t$, the **energy density** and **energy flux**
$$\mathcal E = y_t\frac{\partial\mathcal L}{\partial y_t} - \mathcal L,\qquad S = y_t\frac{\partial\mathcal L}{\partial y_x}$$
obey the local conservation law $\partial_t\mathcal E + \partial_xS = 0$. Integrated over a window $[a,b]$: the energy inside changes exactly by what flows through the ends, $\frac{d}{dt}\int_a^b\mathcal E\,dx = S(a) - S(b)$.
(b) If $\mathcal L$ does not depend explicitly on $x$, the **momentum density** $\mathcal P = -y_x\,\partial\mathcal L/\partial y_t$ is conserved in the same way, with flux $\mathcal L - y_x\,\partial\mathcal L/\partial y_x$.
For the string, $\mathcal L = \tfrac12\mu y_t^2 - \tfrac12\tau y_x^2$ gives $\mathcal E = \tfrac12\mu y_t^2 + \tfrac12\tau y_x^2$, $S = -\tau y_ty_x$ and $\mathcal P = -\mu y_ty_x$. A pulse moving right at speed $c$ carries $S = c\,\mathcal E$ and $\mathcal P = \mathcal E/c$. Together these components form the canonical energy–momentum tensor $T^\mu{}_\nu = \frac{\partial\mathcal L}{\partial(\partial_\mu y)}\partial_\nu y - \delta^\mu_\nu\mathcal L$, with $\partial_\mu T^\mu{}_\nu = 0$. If $\mathcal L$ depends on $t$ (a tension that is pumped) energy is not conserved; if $\mu$ depends on $x$, momentum is not.`,
      idea: String.raw`Differentiate $\mathcal E$ along a solution: $\partial_t\mathcal E = y_{tt}\mathcal L_{y_t} + y_t\partial_t\mathcal L_{y_t} - \partial_t\mathcal L$. Expand $\partial_t\mathcal L = \mathcal L_y y_t + \mathcal L_{y_t}y_{tt} + \mathcal L_{y_x}y_{xt} + \partial\mathcal L/\partial t|_{\rm explicit}$, then use the field equation to replace $\partial_t\mathcal L_{y_t}$ by $\mathcal L_y - \partial_x\mathcal L_{y_x}$. Everything collapses to $\partial_t\mathcal E = -\partial_x(y_t\mathcal L_{y_x}) - \partial\mathcal L/\partial t|_{\rm explicit}$. This is Noether’s theorem (7.3) for the time-translation symmetry, now producing a local conservation law with a flux instead of a single conserved number; space translations give momentum in the same way. The integrated form follows from the fundamental theorem of calculus.`,
      caption: String.raw`Two pulses run around a ring of string, simulated from the chain equations. Drag the two ends of the shaded window. Middle: the energy density (gold), energy flux (purple) and momentum density (teal); for the right-moving pulse all three coincide, for the left-moving one the flux and momentum are negative. Bottom left: the change of energy inside the window (gold) and the energy that flowed in through its ends (purple, dashed) lie on top of each other. Bottom right: total energy and momentum. Make the density vary with position: momentum is no longer conserved, energy still is. Pump the tension in time: energy is not conserved, momentum is, and the window balance acquires a source term.`,
      deps: ['mech-11.16', 'mech-7.3'],
      see: ['waves-1.7', 'pde-11.8', 'em-10.11'],
      refs: ['Goldstein §13.3', 'Goldstein §13.7'],
      tags: ['Noether theorem', 'conservation laws', 'energy flux'],
      credit: 'Emmy Noether, 1918',
      viz(v) {
        const N = 400, dx = 1 / N, TT = 2, A = 0.05, W = 0.03, EVR = 2;
        const mode = v.select('symmetry', [{ value: 'uni', label: 'uniform string' }, { value: 'mu', label: 'density varies with x' }, { value: 'tau', label: 'tension pumped in time' }], 'uni');
        const sY = v.stage({ x: [0, 1], y: [-0.085, 0.075], axes: false, height: 175, full: true, title: 'string on a ring (periodic): drag the ends of the window' });
        const sD = v.stage({ x: [0, 1], y: [-1, 1], axes: 'box', height: 170, full: true, yticks: [0], title: 'energy density $\\mathcal E$, energy flux $S$, momentum density $\\mathcal P$' });
        const sB = v.stage({ x: [0, TT], y: [-1, 1], axes: 'box', height: 210, weight: 1.2, xlabel: 't', title: 'energy in the window: change and inflow' });
        const sT = v.stage({ x: [0, TT], y: [0.5, 1.5], axes: 'box', height: 210, weight: 1, xlabel: 't', title: 'totals ÷ initial values' });
        const ha = sY.handle(0.38, -0.068, { color: 'ink', constrain: (x) => [clamp(x, 0.01, 0.99), -0.068] });
        const hb = sY.handle(0.62, -0.068, { color: 'ink', constrain: (x) => [clamp(x, 0.01, 0.99), -0.068] });
        const muOf = (key) => Float64Array.from({ length: N }, (_, j) => (key === 'mu' ? 1 + 3 * Math.exp(-(((j * dx - 0.5) / 0.05) ** 2)) : 1));
        const tauOf = (key) => (key === 'tau' ? (t) => 1 + 0.45 * Math.sin(TAU * 1.5 * t) : () => 1);
        const cacheS = memo(), cacheW = memo(); let cur = null;
        const run = () => cacheS(mode.value, () => {
          const key = mode.value, mu = muOf(key), tauF = tauOf(key), cmax = key === 'tau' ? Math.sqrt(1.45) : 1, dt = (0.35 * dx) / cmax, n = Math.ceil(TT / dt);
          const y = new Float64Array(N), u = new Float64Array(N), acc = new Float64Array(N);
          const wrap = (d) => d - Math.round(d);
          for (let j = 0; j < N; j++) {
            const x = j * dx, d1 = wrap(x - 0.25), d2 = wrap(x - 0.72), g1 = A * Math.exp(-(d1 * d1) / (2 * W * W)), g2 = 0.6 * A * Math.exp(-(d2 * d2) / (2 * W * W));
            y[j] = g1 + g2; u[j] = g1 * (d1 / (W * W)) - g2 * (d2 / (W * W)); // right-moving: y_t = −c y_x; left-moving: y_t = +c y_x
          }
          const force = (t) => { const tt = tauF(t); for (let j = 0; j < N; j++) acc[j] = ((tt / mu[j]) * (y[(j + 1) % N] - 2 * y[j] + y[(j + N - 1) % N])) / (dx * dx); };
          const tot = (t) => { const tt = tauF(t); let E = 0, P = 0; for (let j = 0; j < N; j++) { const jp = (j + 1) % N, jm = (j + N - 1) % N, s = (y[jp] - y[j]) / dx; E += (0.5 * mu[j] * u[j] * u[j] + 0.5 * tt * s * s) * dx; P -= mu[j] * u[j] * ((y[jp] - y[jm]) / (2 * dx)) * dx; } return [E, P]; };
          const rec = { t: [], y: [], u: [], tau: [], E: [], P: [] };
          const push = (t) => { rec.t.push(t); rec.y.push(Float32Array.from(y)); rec.u.push(Float32Array.from(u)); rec.tau.push(tauF(t)); const [E, P] = tot(t); rec.E.push(E); rec.P.push(P); };
          force(0); push(0);
          for (let k = 1; k <= n; k++) {
            const t = k * dt;
            for (let j = 0; j < N; j++) { u[j] += 0.5 * dt * acc[j]; y[j] += dt * u[j]; }
            force(t); for (let j = 0; j < N; j++) u[j] += 0.5 * dt * acc[j];
            if (k % EVR === 0) push(t);
          }
          let mE = 0; for (let r = 0; r < rec.t.length; r += 10) for (let j = 0; j < N; j++) { const Y = rec.y[r], U = rec.u[r], jp = (j + 1) % N, jm = (j + N - 1) % N, s = (Y[jp] - Y[j]) / dx, tt = rec.tau[r]; mE = Math.max(mE, 0.5 * mu[j] * U[j] ** 2 + 0.5 * tt * s * s, Math.abs(tt * s * 0.5 * (U[j] + U[jp])), Math.abs(mu[j] * U[j] * (Y[jp] - Y[jm]) / (2 * dx))); }
          return { key, mu, rec, dtr: dt * EVR, mE };
        });
        const windowOf = (S, ia, ib) => cacheW(`${S.key}|${ia}|${ib}`, () => {
          const { mu, rec } = S, nR = rec.t.length, EW = new Float64Array(nR), IN = new Float64Array(nR), SRC = new Float64Array(nR);
          const flux = (r) => { const y = rec.y[r], u = rec.u[r], tt = rec.tau[r]; const SR = -u[ib] * tt * (y[(ib + 1) % N] - y[ib]) / dx, SL = -u[ia] * tt * (y[ia] - y[(ia + N - 1) % N]) / dx; return SL - SR; };
          const ew = (r) => { const y = rec.y[r], u = rec.u[r], tt = rec.tau[r]; let e = 0, g = 0; for (let j = ia; j <= ib; j++) e += 0.5 * mu[j] * u[j] * u[j] * dx; for (let j = ia; j < ib; j++) { const s = (y[j + 1] - y[j]) / dx; e += 0.5 * tt * s * s * dx; g += 0.5 * s * s * dx; } return [e, g]; };
          let f0 = flux(0), [e0, g0] = ew(0), dtau0 = 0;
          const dtau = (r) => (S.key === 'tau' ? 0.45 * TAU * 1.5 * Math.cos(TAU * 1.5 * rec.t[r]) : 0);
          EW[0] = 0; IN[0] = 0; SRC[0] = 0; dtau0 = dtau(0) * g0;
          for (let r = 1; r < nR; r++) { const f1 = flux(r), [e1, g1] = ew(r), d1 = dtau(r) * g1; EW[r] = e1 - e0; IN[r] = IN[r - 1] + 0.5 * S.dtr * (f0 + f1); SRC[r] = SRC[r - 1] + 0.5 * S.dtr * (dtau0 + d1); f0 = f1; dtau0 = d1; }
          let res = 0, scale = 1e-12, resS = 0; for (let r = 0; r < nR; r++) { scale = Math.max(scale, Math.abs(EW[r]), Math.abs(IN[r])); res = Math.max(res, Math.abs(EW[r] - IN[r])); resS = Math.max(resS, Math.abs(EW[r] - IN[r] - SRC[r])); }
          return { EW, IN, SRC, res: res / scale, resS: resS / scale, scale };
        });
        v.animate((t) => {
          const S = run(), rec = S.rec, tau = Math.min(0.16 * t, TT), r = Math.min(rec.t.length - 1, Math.round(tau / S.dtr)), y = rec.y[r], u = rec.u[r], tt = rec.tau[r];
          const a = Math.min(ha.x, hb.x), b = Math.max(ha.x, hb.x), ia = Math.round(a / dx), ib = Math.max(ia + 1, Math.round(b / dx));
          // string
          sY.vband(ia * dx, ib * dx, { color: 'gold', alpha: 0.12 });
          if (S.key === 'mu') { const pts = []; for (let j = 0; j <= N; j++) pts.push([j * dx, -0.085 + 0.006 * (S.mu[j % N] - 1)]); sY.path([[0, -0.085], ...pts, [1, -0.085]], { fill: 'muted', fillAlpha: 0.3, color: 'muted', width: 1 }); sY.text('denser string here', 0.5, -0.058, { color: 'muted', size: 11, align: 'center' }); }
          sY.line(0, 0, 1, 0, { color: 'faint', width: 1, dash: [3, 4] });
          const pts = []; for (let j = 0; j <= N; j++) pts.push([j * dx, y[j % N]]);
          sY.path(pts, { color: 'blue', width: 2 });
          sY.corner(S.key === 'tau' ? `t = ${v.fix(tau, 2)} · tension τ = ${v.fix(tt, 2)}` : `t = ${v.fix(tau, 2)}`, 'tr');
          // densities
          const m = 1.15 * S.mE; sD.setView([0, 1], [-m, m]);
          sD.vband(ia * dx, ib * dx, { color: 'gold', alpha: 0.08 });
          const E = [], F = [], P = [];
          for (let j = 0; j < N; j++) { const jp = (j + 1) % N, jm = (j + N - 1) % N, s = (y[jp] - y[j]) / dx; E.push([j * dx, 0.5 * S.mu[j] * u[j] ** 2 + 0.5 * tt * s * s]); F.push([(j + 0.5) * dx, -tt * s * 0.5 * (u[j] + u[jp])]); P.push([j * dx, -S.mu[j] * u[j] * ((y[jp] - y[jm]) / (2 * dx))]); }
          sD.path([[0, 0], ...E, [1, 0]], { fill: 'gold', fillAlpha: 0.3, color: 'gold', width: 1.4 });
          sD.path(F, { color: 'purple', width: 3, alpha: 0.85 });
          sD.path(P, { color: 'teal', width: 1.4, dash: [5, 3] });
          // window balance
          const Wn = windowOf(S, ia, ib), sc = 1.15 * Math.max(1e-9, Wn.scale);
          sB.setView([0, TT], [-sc, sc]);
          sB.hline(0, { color: 'faint', width: 1 });
          series(sB, rec.t, Wn.EW, r, { color: 'gold', width: 2.6 });
          series(sB, rec.t, Wn.IN, r, { color: 'purple', width: 1.8, dash: [6, 4] });
          if (S.key === 'tau') series(sB, rec.t, Array.from(Wn.IN, (x, k) => x + Wn.SRC[k]), r, { color: 'red', width: 1.2, dash: [2, 3] });
          // totals
          const E0 = rec.E[0], P0 = rec.P[0], eR = rec.E.map((x) => x / E0), pR = rec.P.map((x) => x / P0);
          let lo = 0.9, hi = 1.1; for (let k = 0; k < rec.t.length; k++) { lo = Math.min(lo, eR[k], pR[k]); hi = Math.max(hi, eR[k], pR[k]); }
          sT.setView([0, TT], [lo - 0.05 * (hi - lo), hi + 0.05 * (hi - lo)]);
          sT.hline(1, { color: 'faint', width: 1 });
          series(sT, rec.t, eR, r, { color: 'gold', width: 2.2 }); series(sT, rec.t, pR, r, { color: 'teal', width: 2.2 });
          sT.text('energy', rec.t[r], eR[r], { color: 'gold', size: 11, dx: 6, dy: -8 }); sT.text('momentum', rec.t[r], pR[r], { color: 'teal', size: 11, dx: 6, dy: 9 });
          sB.vline(tau, { color: 'gold', width: 1, alpha: 0.6 }); sT.vline(tau, { color: 'gold', width: 1, alpha: 0.6 });
          let dE = 0, dP = 0; for (let k = 0; k < rec.t.length; k++) { dE = Math.max(dE, Math.abs(eR[k] - 1)); dP = Math.max(dP, Math.abs(pR[k] - 1)); }
          cur = { S, Wn, dE, dP };
        }, { period: TT / 0.16 + 1, still: 4 });
        v.legend([['gold', 'energy density / window energy change'], ['purple', 'energy flux $S$ / energy flowed in', { dash: false }], ['teal', 'momentum density $\\mathcal P$', { dash: true }], ['red', 'inflow + explicit-time source (pumped tension)', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { S, Wn, dE, dP } = cur;
          const bal = S.key === 'tau' ? String.raw`window balance without the source term fails by ${v.fix(100 * Wn.res, 1)}%, with the source $-\partial\mathcal L/\partial t$ it closes to ${v.fix(100 * Wn.resS, 3)}%` : String.raw`window balance: change minus inflow stays within ${v.fix(100 * Wn.res, 3)}% of the largest change (time-step error)`;
          const what = { uni: 'both symmetries hold', mu: 'no space-translation symmetry: momentum changes, energy does not', tau: 'no time-translation symmetry: energy changes, momentum does not' }[S.key];
          return String.raw`${bal} · total energy varies by ${v.fix(100 * dE, 3)}%, total momentum by ${v.fix(100 * dP, 3)}% · ${what}`;
        });
      },
    },
  ],
};
