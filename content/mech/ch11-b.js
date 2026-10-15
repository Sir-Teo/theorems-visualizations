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
        const H = sc.handle(unit(toXi([0.7, 0.4, 1])), { color: 'gold', label: 'trial', snap: front, onDrag: (h) => fromSphere(h.p) });
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
        const sF = v.stage({ x: [0.01, 1000], y: [0, 2.2], xlog: true, axes: 'box', height: 290, weight: 1.3, xlabel: 'added stiffness s (or mass) at the chosen bead', ylabel: '$\\omega$', title: 'frequencies as the change grows' });
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
          const top = 1.12 * Math.max(...D.free, ...now);
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
            sL.line(0, D.free[k], 1, now[k], { color: MODE_COLS[k % MODE_COLS.length], width: 1.2, alpha: 0.7 });
            sL.dot(0, D.free[k], { r: 5, color: 'muted' });
            sL.dot(1, now[k], { r: 6, color: MODE_COLS[k % MODE_COLS.length] });
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
        const sR = v.stage({ x: W, y: [0.1, 200], ylog: true, axes: 'box', height: 350, weight: 1.3, xlabel: 'driving frequency $\\Omega/\\omega_0$', title: 'amplitude ÷ static deflection $F/K$' });
        const hO = sR.handle(0.98, 0.15, { color: 'gold', constrain: (x) => [clamp(x, W[0] + 0.005, W[1] - 0.005), 0.15] });
        v.button('Den Hartog optimum', () => { const mu = muS.value; fS.set(1 / (1 + mu)); zS.set(Math.sqrt((3 * mu) / (8 * (1 + mu) ** 3))); });
        v.button('drive at the absorber frequency', () => hO.set(fS.value, 0.15));
        const resp = (Om, mu, f, za, att) => {
          const cx = (re, im) => ({ re, im }), mul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re), div = (a, b) => { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); }, sub = (a, b) => cx(a.re - b.re, a.im - b.im);
          if (!att) { const X1 = div(cx(1, 0), cx(1 - Om * Om, 2 * Z1 * Om)); return { X1, X2: X1 }; }
          const k2 = mu * f * f, c2 = 2 * za * mu * f;
          const A11 = cx(1 + k2 - Om * Om, Om * (2 * Z1 + c2)), A12 = cx(-k2, -Om * c2), A22 = cx(k2 - mu * Om * Om, Om * c2);
          const det = sub(mul(A11, A22), mul(A12, A12)), X1 = div(A22, det), X2 = div(mul(cx(-A12.re, -A12.im), X1), A22.re === 0 && A22.im === 0 ? cx(1e-300, 0) : A22);
          return { X1, X2 };
        };
        const ab = (z) => Math.hypot(z.re, z.im);
        let cur = null;
        v.animate((t) => {
          const mu = muS.value, f = fS.value, za = zS.value, att = on.value, Om = hO.x;
          const r = resp(Om, mu, f, za, att), X1 = r.X1, X2 = r.X2;
          // response curves
          const g = (fn) => (x) => fn(resp(x, mu, f, za, att));
          sR.fn((x) => ab(resp(x, mu, f, za, false).X1), { color: 'red', width: 1.6, dash: [6, 4], n: 600 });
          if (att) {
            sR.fn(g((q) => ab({ re: q.X2.re - q.X1.re, im: q.X2.im - q.X1.im })), { color: 'orange', width: 1.4, n: 600 });
            sR.fn(g((q) => ab(q.X1)), { color: 'blue', width: 2.6, n: 900 });
            // fixed points: where the undamped and the locked (infinitely damped) absorber give the same |X1|
            const d = (x) => ab(resp(x, mu, f, 0, true).X1) - 1 / Math.abs(1 - (1 + mu) * x * x);
            const fp = []; let x0 = W[0], d0 = d(x0);
            for (let i = 1; i <= 800; i++) { const x1 = W[0] + ((W[1] - W[0]) * i) / 800, d1 = d(x1); if (isFinite(d0) && isFinite(d1) && Math.sign(d0) !== Math.sign(d1) && Math.abs(d0 - d1) < 50) { let a = x0, b = x1; for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (Math.sign(d(m)) === Math.sign(d(a))) a = m; else b = m; } const xm = (a + b) / 2; if (Math.abs(1 - (1 + mu) * xm * xm) > 1e-3) fp.push(xm); } x0 = x1; d0 = d1; }
            fp.slice(0, 2).forEach((x, i) => { const y = 1 / Math.abs(1 - (1 + mu) * x * x); sR.dot(x, y, { r: 4.5, color: 'ink', hollow: true }); sR.text(i ? 'Q' : 'P', x, y, { color: 'ink', size: 12, dy: -12, align: 'center', weight: 600 }); });
            sR.vline(f, { color: 'green', width: 1, dash: [2, 4], alpha: 0.8 });
            sR.text('absorber frequency', f, 140, { color: 'green', size: 10.5, align: 'center' });
          }
          sR.vline(Om, { color: 'gold', width: 1.6 });
          sR.dot(Om, Math.max(0.1, ab(X1)), { r: 5.5, color: 'blue' });
          // the tower: lateral deflection ∝ (z/H)², compressed display scale
          const vis = (x) => 0.2 * Math.tanh(x / 12), ph = Om * 2.2 * t, re = (z) => z.re * Math.cos(ph) - z.im * Math.sin(ph);
          const u1 = vis(ab(X1)) * (ab(X1) > 0 ? re(X1) / ab(X1) : 0), u2 = vis(ab(X2)) * (ab(X2) > 0 ? re(X2) / ab(X2) : 0);
          const H = 1, Wd = 0.11, prof = (z) => u1 * (z / H) ** 2;
          sT.rect(-0.6, -0.05, 0.6, 0, { fill: 'muted', fillAlpha: 0.25, stroke: false }); sT.line(-0.6, 0, 0.6, 0, { color: 'muted', width: 1.5 });
          const L = [], Rr = []; for (let i = 0; i <= 20; i++) { const z = (H * i) / 20, wz = Wd * (1 - 0.35 * (z / H)); L.push([prof(z) - wz, z]); Rr.push([prof(z) + wz, z]); }
          sT.poly([...L, ...Rr.reverse()], { fill: 'accent', fillAlpha: 0.1, color: 'muted', width: 1.4 });
          for (let i = 1; i < 20; i += 1) { const z = (H * i) / 20, wz = Wd * (1 - 0.35 * (z / H)); sT.line(prof(z) - wz, z, prof(z) + wz, z, { color: 'faint', width: 0.8 }); }
          sT.line(prof(H), H, prof(H), H + 0.15, { color: 'muted', width: 1.5 });
          if (att) {
            const zs = 0.93, zb = 0.8, sx = prof(zs), bx = u2 * 0.96 + 0.0, by = zb;
            sT.line(sx, zs, bx, by, { color: 'ink', width: 1.2 });
            sT.circle(bx, by, 0.035, { fill: 'gold', fillAlpha: 0.85, color: 'gold', width: 1.5 });
          }
          const Fv = Math.cos(ph) * 0.13;
          if (Math.abs(Fv) > 0.01) sT.arrow(prof(H) - 0.25 - Fv / 2, H - 0.05, prof(H) - 0.25 + Fv / 2, H - 0.05, { color: 'blue', width: 2.2, head: 7 });
          sT.text(att ? 'pendulum absorber' : 'no absorber', 0.42, 0.86, { color: att ? 'gold' : 'muted', size: 11, align: 'center' });
          cur = { mu, f, za, att, Om, X1, X2 };
        }, { period: 1e9, still: 2 });
        v.legend([['blue', 'main mass $|X_1|$ with absorber'], ['red', 'main mass without absorber', { dash: true }], ['orange', 'absorber swing relative to the mass $|X_2 - X_1|$'], ['gold', 'driving frequency']]);
        v.readout(() => {
          if (!cur) return '';
          const { mu, f, za, att, Om, X1, X2 } = cur, a1 = ab(X1), rel = ab({ re: X2.re - X1.re, im: X2.im - X1.im });
          let pk = 0, pk0 = 0; for (let i = 0; i <= 2000; i++) { const x = W[0] + ((W[1] - W[0]) * i) / 2000; pk = Math.max(pk, ab(resp(x, mu, f, za, att).X1)); pk0 = Math.max(pk0, ab(resp(x, mu, f, za, false).X1)); }
          const s = String.raw`At $\Omega/\omega_0 = ${v.fix(Om, 3)}$: $|X_1| = ${num(v, a1, 3)}\,F/K$` + (att ? String.raw`, absorber swing $|X_2-X_1| = ${v.fix(rel, 2)}\,F/K$, phase of the absorber relative to the drive ${v.fix((Math.atan2(X2.im, X2.re) * 180) / Math.PI, 0)}°` : '');
          const opt = String.raw` · Den Hartog: $\omega_a/\omega_0 = 1/(1+\mu) = ${v.fix(1 / (1 + mu), 3)}$, $\zeta = ${v.fix(Math.sqrt((3 * mu) / (8 * (1 + mu) ** 3)), 3)}$, peak level $\approx\sqrt{1+2/\mu} = ${v.fix(Math.sqrt(1 + 2 / mu), 1)}$`;
          return s + String.raw` · highest response over the band: ${v.fix(pk, 1)} with the absorber, ${v.fix(pk0, 1)} without (1% structural damping)` + (att ? opt : '');
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
      caption: String.raw`Left: the two normal-mode frequencies against the tuning $\omega_b/\omega_a$, coloured by their make-up (blue = oscillator $a$, red = oscillator $b$); the dashed lines are the uncoupled frequencies. Drag the gold marker to read off the mixture; set the coupling to zero to see the curves cross. Bottom: the energy in each oscillator while $\omega_b$ is swept from 0.6 to 1.4 in the chosen time, starting with all the energy in oscillator $a$. Right: the energy left in oscillator $a$ after the sweep against the sweep time, simulated (dots) and from the Landau–Zener formula (curve).`,
      deps: ['mech-11.2', 'mech-11.4'],
      see: ['qm-11.5', 'qchem-4.10'],
      refs: ['Taylor §11.3'],
      tags: ['avoided crossing', 'level repulsion', 'Landau–Zener'],
      credit: 'von Neumann & Wigner, 1929 (non-crossing rule); Landau, Zener, 1932',
      viz(v) {
        const Mlib = v.M, D0 = 0.6, D1 = 1.4;
        const kS = v.slider('coupling $\\kappa$', 0, 0.3, 0.1, { step: 0.001 });
        const tS = v.slider('sweep time $T$ (units of $1/\\omega_a$)', 2, 2000, 60, { log: true });
        const sB = v.stage({ x: [D0, D1], y: [0.5, 1.55], axes: 'box', height: 300, weight: 1.15, xlabel: 'tuning $\\omega_b/\\omega_a$', ylabel: '$\\omega/\\omega_a$', title: 'normal-mode frequencies' });
        const sZ = v.stage({ x: [2, 2000], y: [-0.03, 1.05], xlog: true, axes: 'box', height: 300, weight: 1, xlabel: 'sweep time $T$', title: 'energy left in oscillator $a$ after the sweep' });
        const sE = v.stage({ x: [0, 1], y: [-0.03, 1.08], axes: 'box', height: 160, full: true, xlabel: 'time during the sweep (fraction of $T$)', yticks: [0, 0.5, 1], title: 'energy in each oscillator during the current sweep' });
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
          sB.text('oscillator a', D1, 1, { color: 'blue', size: 11, align: 'right', dy: c > 0.05 ? 0 : -10, dx: -4 });
          // Landau–Zener scan
          const Ts = [2, 4, 8, 15, 30, 60, 120, 250, 500, 1000, 2000];
          const Z = cacheZ(c.toFixed(4), () => Ts.map((T0) => [T0, sweep(c, T0).frac]));
          sZ.fn((x) => Math.exp((-Math.PI * c * c * x) / (2 * (D1 - D0))), { color: 'ink', width: 2 });
          sZ.dots(Z, { r: 4.5, color: 'blue' });
          const S = cacheS(`${c.toFixed(4)}|${T}`, () => sweep(c, T, true));
          sZ.dot(T, S.frac, { r: 6.5, color: 'gold' });
          // energy during the current sweep
          const xc = (1 - D0) / (D1 - D0);
          sE.vline(xc, { color: 'muted', width: 1, dash: [3, 4] }); sE.text('ω_b = ω_a', xc, 1.02, { color: 'muted', size: 11, align: 'center' });
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
  ],
};
