// Rudin, Functional Analysis — Chapter 4 (part 3): compact operators and complemented subspaces, 4.16–4.21

// ---------------------------------------------------------------- shared helpers
const SQ2 = Math.SQRT2, PI = Math.PI;
const sub = (n) => String(n).split('').map((c) => '₀₁₂₃₄₅₆₇₈₉'[+c]).join('');
const pn = (x, p) => (p === Infinity ? Math.max(Math.abs(x[0]), Math.abs(x[1])) : p === 1 ? Math.abs(x[0]) + Math.abs(x[1]) : Math.pow(Math.abs(x[0]) ** p + Math.abs(x[1]) ** p, 1 / p));
function sphere(p, n = 720) {
  const out = [];
  for (let i = 0; i < n; i++) { const t = 2 * PI * i / n, c = Math.cos(t), s = Math.sin(t), r = 1 / pn([c, s], p); out.push([r * c, r * s]); }
  return out;
}
const unit3 = (a) => { const n = Math.hypot(...a); return a.map((x) => x / n); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const lin3 = (ca, a, cb, b) => [0, 1, 2].map((i) => ca * a[i] + cb * b[i]);
function plane3(S, a, b, h, st, n = 6) {
  const P = (s, t) => lin3(s, a, t, b);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const s0 = -h + 2 * h * i / n, s1 = -h + 2 * h * (i + 1) / n, t0 = -h + 2 * h * j / n, t1 = -h + 2 * h * (j + 1) / n;
    S.poly([P(s0, t0), P(s1, t0), P(s1, t1), P(s0, t1)], { fill: st.color, fillAlpha: st.fillAlpha ?? 0.16, stroke: false });
  }
  S.path([P(-h, -h), P(h, -h), P(h, h), P(-h, h)], { close: true, color: st.color, width: st.width ?? 1.4, alpha: 0.85 });
  for (const s of [-h / 2, 0, h / 2]) { S.line(P(s, -h), P(s, h), { color: st.color, width: 0.7, alpha: 0.35 }); S.line(P(-h, s), P(h, s), { color: st.color, width: 0.7, alpha: 0.35 }); }
}
/** The Green operator (Tf)(s) = ∫ (min(s,t) − st) f(t) dt, i.e. −u'' = f, u(0) = u(1) = 0, evaluated on a grid. */
function greenApply(f, M) {
  const h = 1 / M, s = [], F = [];
  for (let i = 0; i <= M; i++) { s.push(i * h); F.push(f(i * h)); }
  // A(s) = ∫_0^s t f(t) dt, B(s) = ∫_s^1 (1 − t) f(t) dt (trapezoid)
  const A = [0], B = new Array(M + 1).fill(0);
  for (let i = 1; i <= M; i++) A.push(A[i - 1] + h * (s[i - 1] * F[i - 1] + s[i] * F[i]) / 2);
  for (let i = M - 1; i >= 0; i--) B[i] = B[i + 1] + h * ((1 - s[i]) * F[i] + (1 - s[i + 1]) * F[i + 1]) / 2;
  return s.map((x, i) => [x, (1 - x) * A[i] + x * B[i]]);
}

export default {
  book: 'fa',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.16
    {
      num: '4.16',
      kind: 'Definition',
      name: 'Compact operators',
      statement: String.raw`Let $X$ and $Y$ be Banach spaces and $U$ the open unit ball of $X$. A linear map $T:X\to Y$ is **compact** if the closure of $T(U)$ is compact in $Y$. Equivalently, $T(U)$ is totally bounded; equivalently, every bounded sequence $\{x_n\}$ in $X$ has a subsequence $\{x_{n_i}\}$ for which $\{Tx_{n_i}\}$ converges in $Y$. A compact operator is bounded, since compact sets are bounded.`,
      idea: String.raw`Compactness is the infinite-dimensional substitute for "finite rank": in $\R^n$ every bounded set is relatively compact, but the unit ball of an infinite-dimensional space is not (1.22) — the unit vectors $e_k$ of $\ell^2$ stay $\sqrt2$ apart. A compact operator must crush such sequences: for a diagonal operator $T=\operatorname{diag}(t_n)$ on $\ell^2$ the tail of every $Tx$, $x\in U$, beyond index $N$ has norm at most $\sup_{n>N}|t_n|$, so $T$ is compact exactly when $t_n\to0$.`,
      caption: String.raw`$T=\operatorname{diag}(t_n)$ on $\ell^2$, tested on the bounded sequence $e_1,e_2,\dots$. Left: the matrix of distances $\|Te_j-Te_k\|=\sqrt{t_j^2+t_k^2}$ (dark = small). Right: the diagonal entries and the uniform tail bound. When $t_n\to0$ the tail block (green frame) goes dark — $\{Te_k\}$ is Cauchy — and $T(U)$ lies within $\sup_{n>N}|t_n|$ of the finite-dimensional set $P_NT(U)$. For the identity, or with infinitely many $t_n=1$, a bright pattern persists: no subsequence of $\{Te_k\}$ converges.`,
      deps: ['fa-1.2', 'fa-1.22'],
      tags: ['compact operators', 'total boundedness'],
      viz(v) {
        const OPS = {
          harm: { label: '$t_n=1/n$', t: (n) => 1 / n },
          sqrt: { label: '$t_n=1/\\sqrt n$', t: (n) => 1 / Math.sqrt(n) },
          id: { label: '$t_n=1$', t: () => 1 },
          alt: { label: '$t_n=1$ ($n$ odd), $\\frac1n$ ($n$ even)', t: (n) => (n % 2 ? 1 : 1 / n) },
        };
        const oS = v.select('$t_n$:', Object.entries(OPS).map(([value, o]) => ({ value, label: o.label })), 'harm');
        const nS = v.slider('tail after $N=$', 1, 38, 8, { int: true });
        const NN = 40;
        const H = v.stage({ x: [-1.5, NN + 0.6], y: [-0.4, NN + 2.4], equal: true, height: 340, axes: false, ticks: false, title: 'distances $\\|Te_j-Te_k\\|$ for $1\\le j,k\\le 40$' });
        const B = v.stage({ x: [-1.5, NN + 1], y: [-0.12, 1.18], height: 340, axes: 'box', xticks: [1, 10, 20, 30, 40], yticks: [0, 0.25, 0.5, 0.75, 1], title: 'entries $t_n$ and the tail bound $\\sup_{n>N}|t_n|$' });
        let st = {};
        v.render(() => {
          const key = oS.value, t = OPS[key].t, N = nS.value;
          H.raster((x, y) => {
            const j = Math.round(x), k = Math.round(NN + 1 - y);
            if (j < 1 || j > NN || k < 1 || k > NN || x < 0.5 || x > NN + 0.5 || y < 0.5 || y > NN + 0.5) return null;
            const d = j === k ? 0 : Math.hypot(t(j), t(k));
            return v.M.cmap(0.08 + 0.9 * d / SQ2, 'magma');
          }, { key, res: 2 });
          let tail = 0; for (let n = N + 1; n <= 100000; n++) tail = Math.max(tail, Math.abs(t(n)));
          let blk = 0; for (let j = N + 1; j <= NN; j++) for (let k = j + 1; k <= NN; k++) blk = Math.max(blk, Math.hypot(t(j), t(k)));
          const ok = tail < 0.35;
          H.rect(N + 0.5, 0.5, NN + 0.5, NN + 0.5 - N, { color: ok ? 'green' : 'red', width: 2.4 });
          H.text('j →', NN + 0.5, NN + 2.0, { align: 'right', color: 'muted', size: 11.5 });
          H.text('k ↓', -1.3, NN - 4.5, { align: 'left', color: 'muted', size: 11.5 });
          for (const n of [1, 10, 20, 30, 40]) { H.text(String(n), n, NN + 0.95, { align: 'center', color: 'muted', size: 10 }); H.text(String(n), -0.2, NN + 1 - n, { align: 'right', color: 'muted', size: 10 }); }
          for (let n = 1; n <= NN; n++) B.rect(n - 0.36, 0, n + 0.36, t(n), { fill: n > N ? 'orange' : 'blue', fillAlpha: n > N ? 0.75 : 0.5, stroke: false });
          B.vband(N + 0.5, NN + 1, { color: 'orange', alpha: 0.07 });
          B.hline(tail, { color: ok ? 'green' : 'red', width: 2, dash: [6, 4] });
          B.text(`sup over n > ${N}: ${v.fmt(tail, 3)}`, NN + 0.6, tail + 0.04, { align: 'right', baseline: 'bottom', color: ok ? 'green' : 'red', size: 12, weight: 600 });
          st = { key, N, tail, blk };
        });
        v.legend([['blue', 'entries $t_n$, $n\\le N$', { area: true }], ['orange', 'the tail $n>N$', { area: true }], ['green', 'tail block / tail bound']]);
        v.readout(() => {
          const s = st, cpt = s.key === 'harm' || s.key === 'sqrt';
          return `Largest distance inside the tail block: $${v.fix(s.blk, 3)}$; $\\;$every $x\\in U$ has $\\|Tx-P_NTx\\|\\le\\sup_{n>${s.N}}|t_n| = ${v.fix(s.tail, 3)}$. ` + (cpt ? 'Since $t_n\\to0$ this tends to $0$: $T(U)$ is totally bounded and $T$ is **compact**.' : 'This bound does not tend to $0$: $T$ is **not compact**.');
        });
      },
    },
    // ------------------------------------------------------------------ 4.17
    {
      num: '4.17',
      kind: 'Definition',
      name: 'Spectrum and eigenvalues',
      statement: String.raw`Let $X$ be a Banach space and $T\in\mathscr B(X)$. The **spectrum** $\sigma(T)$ is the set of scalars $\lambda$ for which $T-\lambda I$ is not invertible, i.e. has no inverse in $\mathscr B(X)$. By the open mapping theorem this happens exactly when $T-\lambda I$ is not one-to-one or $\mathscr R(T-\lambda I)\ne X$. If $\mathscr N(T-\lambda I)\ne\{0\}$, $\lambda$ is an **eigenvalue** of $T$; $\mathscr N(T-\lambda I)$ is its eigenspace, its nonzero members are eigenvectors, and $\dim\mathscr N(T-\lambda I)$ is the multiplicity of $\lambda$.`,
      idea: String.raw`If $T-\lambda I$ is a bijection of $X$ onto $X$, its inverse is automatically continuous (2.12), so invertibility is a purely algebraic matter. In finite dimensions one-to-one and onto are equivalent and $\sigma(T)$ is just the set of eigenvalues. In infinite dimensions they separate: $T-\lambda I$ can be one-to-one without being onto, and then $\lambda\in\sigma(T)$ without being an eigenvalue.`,
      caption: String.raw`The plane of $\lambda$'s, shaded by $\log_{10}\|(T-\lambda I)^{-1}\|$ (bright = nearly singular); drag $\lambda$ (it snaps to special points). A $2\times2$ matrix: the resolvent blows up only at the two eigenvalues. $\operatorname{diag}(t_n)$ on $\ell^2$ with $t_n\to0$: each $t_n$ is an eigenvalue, while $0\in\sigma(T)$ is **not** — $T$ is one-to-one there but not onto. The shift $S(x_1,x_2,\dots)=(0,x_1,x_2,\dots)$: $\sigma(S)$ is the closed unit disc, yet $S$ has no eigenvalues at all.`,
      deps: ['fa-4.1', 'fa-2.12'],
      tags: ['spectrum', 'eigenvalues'],
      verify: true,
      viz(v) {
        const { Cx } = v.M;
        const mS = v.select('$T=$', [{ value: 'mat', label: '$2\\times2$ matrix' }, { value: 'diag', label: '$\\operatorname{diag}(t_n)$ on $\\ell^2$' }, { value: 'shift', label: 'shift $S$ on $\\ell^2$' }], 'diag');
        const S = v.stage({ x: [-1.45, 1.45], y: [-1.3, 1.3], equal: true, height: 360, weight: 1.3, ticks: false, title: '$\\lambda\\in\\C$, shaded by $\\log_{10}\\|(T-\\lambda I)^{-1}\\|$' });
        const W = v.stage({ x: [-0.5, 21], y: [-0.08, 1.3], height: 360, axes: 'box', weight: 1, title: 'why $\\lambda$ is (not) in $\\sigma(T)$' });
        const A = [[0.25, -0.9], [0.5, 0.25]];
        const ev = [new Cx(0.25, Math.sqrt(0.45)), new Cx(0.25, -Math.sqrt(0.45))];
        const tn = (n) => Cx.polar(0.95 * Math.pow(0.8, n - 1), 2.3 * n);
        const TN = []; for (let n = 1; n <= 60; n++) TN.push(tn(n));
        const special = () => (mS.value === 'mat' ? ev : mS.value === 'diag' ? TN.slice(0, 30).concat([new Cx(0, 0)]) : [new Cx(0, 0)]);
        const lam = S.handle(0.62, 0.55, { color: 'accent', label: 'λ', constrain: (x, y) => { for (const z of special()) if (Math.hypot(x - z.re, y - z.im) < 0.07) return [z.re, z.im]; return [x, y]; } });
        // resolvent norms
        const resMat = (l) => {
          const b11 = new Cx(A[0][0], 0).sub(l), b22 = new Cx(A[1][1], 0).sub(l), b12 = A[0][1], b21 = A[1][0];
          const F = b11.abs2() + b22.abs2() + b12 * b12 + b21 * b21, D = b11.mul(b22).sub(new Cx(b12 * b21, 0)).abs();
          const smax = Math.sqrt((F + Math.sqrt(Math.max(0, F * F - 4 * D * D))) / 2);
          return D < 1e-14 ? Infinity : smax / D;   // 1/σ_min = σ_max/|det|
        };
        const resDiag = (l) => { let d = l.abs(); for (const z of TN) d = Math.min(d, z.sub(l).abs()); return d < 1e-14 ? Infinity : 1 / d; };
        const resShift = (l) => { const r = l.abs(); return r <= 1 ? Infinity : 1 / (r - 1); };
        let st = {};
        v.render(() => {
          const mode = mS.value, R = mode === 'mat' ? resMat : mode === 'diag' ? resDiag : resShift;
          S.raster((x, y) => {
            const r = R(new Cx(x, y));
            if (!isFinite(r)) return v.M.cmap(1, 'magma');
            return v.M.cmap(v.M.clamp((Math.log10(r) + 0.6) / 3, 0, 1), 'magma');
          }, { key: mode, res: 2 });
          S.axes();
          S.circle(0, 0, 1, { color: 'faint', width: 1, dash: [3, 4] });
          if (mode === 'mat') for (const z of ev) S.dot(z.re, z.im, { color: 'red', r: 5.5 });
          if (mode === 'diag') { for (const z of TN.slice(0, 40)) S.dot(z.re, z.im, { color: 'red', r: 4 }); S.dot(0, 0, { color: 'gold', r: 5.5, hollow: true, width: 2.2 }); }
          if (mode === 'shift') S.circle(0, 0, 1, { color: 'red', width: 2.2 });
          const l = new Cx(lam.x, lam.y), r = R(l);
          // classification
          let cls, col;
          if (mode === 'mat') { const e = ev.find((z) => z.sub(l).abs() < 1e-9); cls = e ? 'eigenvalue: T − λI is not one-to-one' : 'resolvent point: T − λI is invertible'; col = e ? 'red' : 'green'; }
          else if (mode === 'diag') {
            const k = TN.findIndex((z) => z.sub(l).abs() < 1e-9);
            if (k >= 0) { cls = `eigenvalue t${sub(k + 1)}, eigenvector e${sub(k + 1)}`; col = 'red'; }
            else if (l.abs() < 1e-9) { cls = 'λ = 0 ∈ σ(T): one-to-one but not onto — not an eigenvalue'; col = 'gold'; }
            else { cls = 'resolvent point: T − λI is invertible'; col = 'green'; }
          } else {
            if (l.abs() <= 1) { cls = 'λ ∈ σ(S): S − λI one-to-one but not onto'; col = 'gold'; }
            else { cls = 'resolvent point: S − λI is invertible'; col = 'green'; }
          }
          // witness panel
          if (mode === 'mat') {
            const b11 = new Cx(A[0][0], 0).sub(l), b22 = new Cx(A[1][1], 0).sub(l);
            const F = b11.abs2() + b22.abs2() + A[0][1] ** 2 + A[1][0] ** 2, D = b11.mul(b22).sub(new Cx(A[0][1] * A[1][0], 0)).abs();
            const s1 = Math.sqrt((F + Math.sqrt(Math.max(0, F * F - 4 * D * D))) / 2), s2 = s1 > 0 ? D / s1 : 0;
            W.setView([-0.5, 6.5], [-0.08, Math.max(1.3, s1 * 1.25)]); W.setTicks([[2, 'σ₁'], [4, 'σ₂']], null);
            W.rect(1.4, 0, 2.6, s1, { fill: 'blue', fillAlpha: 0.6, stroke: false }); W.rect(3.4, 0, 4.6, s2, { fill: s2 < 1e-6 ? 'red' : 'blue', fillAlpha: 0.6, stroke: false });
            W.setTitle('singular values of $T-\\lambda I$; $\\|(T-\\lambda I)^{-1}\\|=1/\\sigma_2$');
          } else if (mode === 'diag') {
            W.setTicks([1, 5, 10, 15, 20], null);
            let top = l.abs(); for (let n = 1; n <= 20; n++) top = Math.max(top, TN[n - 1].sub(l).abs());
            W.setView([-0.5, 21], [-0.08 * top, top * 1.25]);
            W.setTitle('$|t_n-\\lambda|$, the diagonal of $T-\\lambda I$ (dashed: the limit $|\\lambda|$)');
            let mn = Infinity, kn = 1;
            for (let n = 1; n <= 20; n++) { const d = TN[n - 1].sub(l).abs(); if (d < mn) { mn = d; kn = n; } W.rect(n - 0.35, 0, n + 0.35, d, { fill: d < 1e-9 ? 'red' : 'blue', fillAlpha: 0.6, stroke: false }); if (d < 1e-9) W.dot(n, 0, { color: 'red', r: 5 }); }
            W.hline(l.abs(), { color: 'gold', width: 1.6, dash: [6, 4] });
          } else {
            const rr = l.abs();
            W.setView([-0.5, 21], [-0.08, 1.3]); W.setTicks([1, 5, 10, 15, 20], null);
            for (let n = 1; n <= 20; n++) { const c = Math.pow(rr, n - 1); W.rect(n - 0.35, 0, n + 0.35, Math.min(1.25, c), { fill: rr < 1 ? 'red' : 'gray', fillAlpha: rr < 1 ? 0.6 : 0.35, stroke: false }); }
            W.setTitle(rr < 1 ? '$|\\lambda|^{n-1}$: $(1,\\lambda,\\lambda^2,\\dots)\\in\\ell^2$ annihilates $\\mathscr R(S-\\lambda I)$' : '$|\\lambda|^{n-1}$ grows: nothing in $\\ell^2$ annihilates $\\mathscr R(S-\\lambda I)$');
          }
          st = { mode, r, l, cls };
        });
        v.legend([['red', 'eigenvalues / spectrum'], ['gold', 'spectrum without eigenvalue', { dot: true }], ['faint', 'unit circle', { dash: true }]]);
        v.readout(() => {
          const s = st, rr = isFinite(s.r) ? v.fix(s.r, 3) : '\\infty';
          let extra = '';
          if (s.mode === 'diag') extra = ` Here $\\|(T-\\lambda I)^{-1}\\| = 1/\\operatorname{dist}(\\lambda,\\{t_n\\}\\cup\\{0\\})$ and $\\sigma(T)=\\{t_n\\}\\cup\\{0\\}$.`;
          if (s.mode === 'shift') extra = ` For $|\\lambda|<1$, $\\mathscr R(S-\\lambda I)$ is annihilated by $(1,\\lambda,\\lambda^2,\\dots)\\in\\ell^2$, an eigenvector of $S^*$.`;
          if (s.mode === 'mat') extra = ` Here $\\sigma(T)$ is the set of roots of $\\det(T-\\lambda I)$.`;
          return `$\\lambda = ${v.fix(s.l.re, 3)} ${s.l.im < 0 ? '-' : '+'} ${v.fix(Math.abs(s.l.im), 3)}\\,i$ — **${s.cls}**; $\\;\\|(T-\\lambda I)^{-1}\\| = ${rr}$.` + extra;
        });
      },
    },
    // ------------------------------------------------------------------ 4.18
    {
      num: '4.18',
      kind: 'Theorem',
      name: 'Basic properties of compact operators',
      statement: String.raw`Let $X$ and $Y$ be Banach spaces.
(a) If $T\in\mathscr B(X,Y)$ and $\dim\mathscr R(T)<\infty$, then $T$ is compact.
(b) If $T\in\mathscr B(X,Y)$ is compact and $\mathscr R(T)$ is closed, then $\dim\mathscr R(T)<\infty$.
(c) The compact operators form a closed subspace of $\mathscr B(X,Y)$ in its norm topology.
(d) If $T\in\mathscr B(X)$ is compact and $\lambda\ne0$, then $\dim\mathscr N(T-\lambda I)<\infty$.
(e) If $\dim X=\infty$ and $T\in\mathscr B(X)$ is compact, then $0\in\sigma(T)$.
(f) If $S,T\in\mathscr B(X)$ and $T$ is compact, then $ST$ and $TS$ are compact.`,
      idea: String.raw`(a) Bounded sets of a finite-dimensional space are totally bounded. (c) If $\|T-T_n\|<\eps$ with $T_n$ compact, then $T(U)$ lies within $\eps$ of the totally bounded $T_n(U)$, hence is totally bounded. (b) If $\mathscr R(T)$ is closed it is a Banach space onto which $T$ is open (2.11), so $T(U)$ contains a ball of $\mathscr R(T)$ with compact closure; by 1.22 $\mathscr R(T)$ is finite-dimensional. (f) $S$ is continuous, so it preserves compact sets and maps bounded sets to bounded sets. (d) On $\mathscr N(T-\lambda I)$, $T$ acts as $\lambda I$, so the restriction is compact with closed range; apply (b). (e) If $T^{-1}\in\mathscr B(X)$, then $I=T^{-1}T$ would be compact by (f), contradicting 1.22.`,
      caption: String.raw`The integral operator $(Tf)(s)=\int_0^1(\min(s,t)-st)f(t)\,dt$ on $L^2(0,1)$, which solves $-u''=f$, $u(0)=u(1)=0$. Its eigenfunctions $\sqrt2\sin n\pi s$ have eigenvalues $\lambda_n=1/(n\pi)^2$; keeping the first $N$ gives the rank-$N$ operator $T_N$ (compact by (a)) with kernel shown on the left, and $\|T-T_N\|=\lambda_{N+1}\to0$, so $T$ is compact by (c). Right: $Tf$ (blue) and $T_Nf$ (gold) for the chosen $f$ (grey, scaled). Bottom: the eigenvalues, the tail that $T_N$ discards, and part (e): $\|T^{-1}\varphi_n\|=1/\lambda_n\to\infty$.`,
      deps: ['fa-4.16', 'fa-4.17', 'fa-1.22', 'fa-2.11'],
      tags: ['compact operators', 'finite rank'],
      viz(v) {
        const M = v.M;
        const FS = {
          step: { label: 'step', f: (t) => (t > 0.2 && t < 0.55 ? 1 : 0) - (t > 0.7 && t < 0.85 ? 0.8 : 0) },
          bump: { label: 'off-centre bump', f: (t) => Math.exp(-(((t - 0.3) / 0.06) ** 2)) },
          wave: { label: '$\\operatorname{sgn}\\sin 5\\pi t$', f: (t) => (Math.sin(5 * PI * t) >= 0 ? 1 : -1) },
        };
        const fS = v.select('$f=$', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'step');
        const nS = v.slider('rank $N$ of $T_N$', 1, 25, 3, { int: true });
        const K = v.stage({ x: [-0.08, 1.02], y: [-0.06, 1.04], equal: true, height: 300, axes: false, ticks: false, title: 'kernel of $T_N$: $\\sum_{n\\le N}\\lambda_n\\varphi_n(s)\\varphi_n(t)$' });
        const F = v.stage({ x: [-0.02, 1.02], y: [-0.06, 0.06], height: 300, axes: true, xticks: [0, 0.25, 0.5, 0.75, 1], title: '$Tf$ (blue) and $T_Nf$ (gold)' });
        const B = v.stage({ x: [0.2, 25.8], y: [-1.5, 0.95], height: 150, full: true, axes: false, ticks: false, title: 'eigenvalues $\\lambda_n=1/(n\\pi)^2$ (bar height $\\propto\\sqrt{\\lambda_n}$); the orange tail is discarded, $\\|T-T_N\\|=\\lambda_{N+1}$' });
        const lamN = (n) => 1 / (n * PI) ** 2, phi = (n, s) => SQ2 * Math.sin(n * PI * s);
        let st = {};
        v.render(() => {
          const N = nS.value, f = FS[fS.value].f;
          // kernel raster
          K.raster((s, t) => {
            if (s < 0 || s > 1 || t < 0 || t > 1) return null;
            let k = 0; for (let n = 1; n <= N; n++) k += lamN(n) * phi(n, s) * phi(n, t);
            return M.cmap(M.clamp(0.5 + k / 0.5, 0, 1), 'diverging');
          }, { key: N, res: 3 });
          K.rect(0, 0, 1, 1, { color: 'muted', width: 1 });
          K.text('s', 0.5, -0.035, { align: 'center', color: 'muted', math: true });
          K.text('t', -0.04, 0.5, { align: 'center', color: 'muted', math: true });
          // Tf exact and T_N f
          const Tf = greenApply(f, 800);
          const cs = []; for (let n = 1; n <= N; n++) cs.push(M.integrate((t) => f(t) * phi(n, t), 0, 1, 1600));
          const TNf = (s) => { let u = 0; for (let n = 1; n <= N; n++) u += lamN(n) * cs[n - 1] * phi(n, s); return u; };
          let ymax = 0.01; for (const [, u] of Tf) ymax = Math.max(ymax, Math.abs(u));
          F.setView(null, [-ymax * 1.35, ymax * 1.35]);
          const fmax = Math.max(...Tf.map(([s]) => Math.abs(f(s)))) || 1;
          F.fn((s) => f(s) * ymax * 0.9 / fmax, { color: 'gray', width: 1.2, alpha: 0.6, domain: [0, 1] });
          F.path(Tf, { color: 'blue', width: 2.6 });
          F.fn(TNf, { color: 'gold', width: 2.2, dash: [6, 4], domain: [0, 1] });
          // errors
          let e2 = 0; for (let i = 0; i < Tf.length; i++) { const d = Tf[i][1] - TNf(Tf[i][0]); e2 += d * d / (Tf.length - 1); }
          const f2 = Math.sqrt(M.integrate((t) => f(t) ** 2, 0, 1, 2000));
          // bars (√λ for visibility) and the inverse growth
          for (let n = 1; n <= 25; n++) {
            const h = Math.sqrt(lamN(n)) * PI * 0.85;
            B.rect(n - 0.35, 0, n + 0.35, h, { fill: n > N ? 'orange' : 'blue', fillAlpha: n > N ? 0.8 : 0.55, stroke: false });
            const g = Math.log10(1 / lamN(n)) / Math.log10(1 / lamN(25));
            B.rect(n - 0.22, -0.12, n + 0.22, -0.12 - 1.2 * g, { fill: 'red', fillAlpha: 0.22, stroke: false });
          }
          B.line(0.2, 0, 25.8, 0, { color: 'faint', width: 1 });
          B.text('below: ‖T⁻¹φₙ‖ = 1/λₙ (log scale) → ∞, so T⁻¹ is unbounded (e)', 0.5, -1.3, { align: 'left', color: 'red', size: 11.5, weight: 600 });
          B.text(`λ${sub(N + 1)} = ${v.fmt(lamN(N + 1), 3)}`, N + 1, Math.sqrt(lamN(N + 1)) * PI * 0.85 + 0.1, { align: 'left', color: 'orange', size: 12, weight: 600 });
          st = { N, err: Math.sqrt(e2), bound: lamN(N + 1) * f2, f2 };
        });
        v.legend([['blue', '$Tf$ / kept eigenvalues'], ['gold', '$T_Nf$', { dash: true }], ['orange', 'discarded tail', { area: true }], ['gray', '$f$ (rescaled)']]);
        v.readout(() => {
          const s = st;
          return `rank $${s.N}$: $\\;\\|Tf-T_Nf\\|_2 = ${v.fmt(s.err, 3)}\\;\\le\\;\\|T-T_N\\|\\,\\|f\\|_2 = \\lambda_{${s.N + 1}}\\cdot${v.fix(s.f2, 3)} = ${v.fmt(s.bound, 3)}$. Since $\\lambda_{N+1}\\to0$, $T$ is a norm limit of finite-rank operators.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.19
    {
      num: '4.19',
      kind: 'Theorem',
      name: "Schauder's theorem: T is compact iff T* is",
      statement: String.raw`Let $X$ and $Y$ be Banach spaces and $T\in\mathscr B(X,Y)$. Then $T$ is compact if and only if $T^*$ is compact.`,
      idea: String.raw`Let $T$ be compact and $K=\overline{T(U)}$, a compact metric space. Restricted to $K$, the functionals $y^*$ with $\|y^*\|\le1$ form a uniformly bounded, equicontinuous (indeed $1$-Lipschitz) family in $C(K)$, so by Arzelà–Ascoli it is totally bounded there. Since $\|T^*y^*-T^*z^*\|=\sup_{x\in U}|\langle Tx,y^*-z^*\rangle|=\sup_K|y^*-z^*|$, the set $T^*(B_{Y^*})$ is totally bounded in $X^*$. Conversely, if $T^*$ is compact, so is $T^{**}$, and $T$ is the restriction of $T^{**}$ to $X\subset X^{**}$ (4.3), hence compact.`,
      caption: String.raw`On $L^2(0,1)$ (real, so $T^*$ has the transposed kernel). Apply $T$ and $T^*$ to the bounded orthonormal sequence $f_k=\sqrt2\sin k\pi t$, $k\le K$ (later $k$ = lighter). For the Volterra operator $Vf(s)=\int_0^sf$ and its adjoint $V^*f(s)=\int_s^1f$, both image families are uniformly bounded and equicontinuous and shrink to $0$ — compact, with the same singular values $1/((n-\frac12)\pi)$. Multiplication by $1+t$ (its own adjoint) is not compact: its images keep oscillating at full size. The bottom strip shows the kernels $k(s,t)$ and $k(t,s)$.`,
      deps: ['fa-4.16', 'fa-4.10', 'fa-4.3'],
      see: ['pma-7.25'],
      tags: ['compact operators', 'adjoint', 'Arzelà–Ascoli'],
      viz(v) {
        const M = v.M;
        const oS = v.select('$T=$', [{ value: 'vol', label: 'Volterra $V$' }, { value: 'mul', label: 'multiplication by $1+t$' }], 'vol');
        const kS = v.slider('number of functions $K$', 1, 24, 10, { int: true });
        const A = v.stage({ x: [-0.02, 1.02], y: [-0.55, 0.95], height: 260, axes: true, xticks: [0, 0.5, 1], title: 'images $Tf_k$' });
        const B = v.stage({ x: [-0.02, 1.02], y: [-0.55, 0.95], height: 260, axes: true, xticks: [0, 0.5, 1], title: 'images $T^*f_k$' });
        const C = v.stage({ x: [-0.1, 6.4], y: [-0.12, 1.12], equal: true, height: 150, full: true, axes: false, ticks: false, title: 'kernel of $T$ (left), kernel of $T^*$ (middle), singular values $\\sigma_n$ (right)' });
        const fk = (k, t) => SQ2 * Math.sin(k * PI * t);
        const ops = {
          vol: { T: (k, s) => SQ2 * (1 - Math.cos(k * PI * s)) / (k * PI), Ts: (k, s) => SQ2 * (Math.cos(k * PI * s) - Math.cos(k * PI)) / (k * PI), y: [-0.55, 1.02] },
          mul: { T: (k, s) => (1 + s) * fk(k, s), Ts: (k, s) => (1 + s) * fk(k, s), y: [-3, 3] },
        };
        let st = {};
        v.render(() => {
          const key = oS.value, O = ops[key], K = kS.value;
          A.setView(null, O.y); B.setView(null, O.y);
          const sups = [[], []];
          for (let k = 1; k <= K; k++) {
            const a = 1 - 0.75 * (k - 1) / Math.max(1, K - 1);
            A.fn((s) => O.T(k, s), { color: 'blue', width: 1.6, alpha: a, domain: [0, 1], n: 500 });
            B.fn((s) => O.Ts(k, s), { color: 'purple', width: 1.6, alpha: a, domain: [0, 1], n: 500 });
          }
          for (const [i, G] of [[0, O.T], [1, O.Ts]]) { let m = 0; for (let j = 0; j <= 400; j++) m = Math.max(m, Math.abs(G(K, j / 400))); sups[i] = m; }
          // modulus of continuity at δ = 0.05 over the family
          let om = [0, 0];
          for (const [i, G] of [[0, O.T], [1, O.Ts]]) for (let k = 1; k <= K; k++) for (const gap of [0.01, 0.02, 0.03, 0.04, 0.05]) for (let j = 0; j <= 400 - 400 * gap; j++) { const s = j / 400; om[i] = Math.max(om[i], Math.abs(G(k, s + gap) - G(k, s))); }
          if (key === 'vol') {
            A.corner(`sup |T f${sub(K)}| = ${v.fmt(sups[0], 3)}`, 'tl', { color: 'blue', weight: 600 });
            B.corner(`sup |T* f${sub(K)}| = ${v.fmt(sups[1], 3)}`, 'tr', { color: 'purple', weight: 600 });
          }
          // kernels and singular values
          C.raster((x, y) => {
            if (y < 0 || y > 1) return null;
            let s, t, T = false;
            if (x >= 0 && x <= 1) { s = 1 - y; t = x; }
            else if (x >= 1.25 && x <= 2.25) { s = 1 - y; t = x - 1.25; T = true; }
            else return null;
            if (key === 'mul') return Math.abs(s - t) < 0.012 ? M.cmap(0.95, 'viridis') : M.cmap(0.05, 'viridis');
            const val = T ? (s < t ? 1 : 0) : (t < s ? 1 : 0);
            return M.cmap(val ? 0.85 : 0.08, 'viridis');
          }, { key, res: 2 });
          C.rect(0, 0, 1, 1, { color: 'muted', width: 1 }); C.rect(1.25, 0, 2.25, 1, { color: 'muted', width: 1 });
          const x0 = 2.6, w = 3.7;
          if (key === 'vol') {
            for (let n = 1; n <= 16; n++) {
              const h = (1 / ((n - 0.5) * PI)) * 0.5 * PI, xx = x0 + (n - 0.5) * w / 16;
              C.rect(xx - 0.07, 0, xx + 0.07, h, { fill: 'green', fillAlpha: 0.7, stroke: false });
            }
            C.text('σₙ = 1/((n − ½)π) → 0', x0 + w, 0.9, { align: 'right', color: 'green', size: 12, weight: 600 });
          } else {
            C.text('no kernel function: T is concentrated on the diagonal s = t', x0 + w / 2, 0.66, { align: 'center', color: 'red', size: 12, weight: 600 });
            C.text('σ(T) = [1, 2]: no decaying singular values', x0 + w / 2, 0.36, { align: 'center', color: 'red', size: 12, weight: 600 });
          }
          C.line(x0, 0, x0 + w, 0, { color: 'faint', width: 1 });
          st = { key, K, sups, om };
        });
        v.legend([['blue', '$Tf_k$'], ['purple', '$T^*f_k$'], ['green', 'singular values (shared by $T$ and $T^*$)', { area: true }]]);
        v.readout(() => {
          const s = st;
          const head = `$\\sup_{k\\le${s.K}}\\sup_{|s-s'|\\le0.05}|Tf_k(s)-Tf_k(s')| = ${v.fix(s.om[0], 3)}$, $\\;$ for $T^*$: $${v.fix(s.om[1], 3)}$. `;
          return head + (s.key === 'vol' ? 'Equicontinuous and $\\|Vf_K\\|_\\infty,\\|V^*f_K\\|_\\infty\\le 2\\sqrt2/(K\\pi)\\to0$: both $V$ and $V^*$ are compact.' : 'Not equicontinuous and no decay: $\\|Tf_j-Tf_k\\|_2\\ge\\sqrt2$ for $j\\ne k$, so neither $T$ nor $T^*=T$ is compact.');
        });
      },
    },
    // ------------------------------------------------------------------ 4.20
    {
      num: '4.20',
      kind: 'Definition',
      name: 'Complemented subspaces',
      statement: String.raw`Let $M$ be a closed subspace of a topological vector space $X$. If there is a closed subspace $N$ of $X$ with $X=M+N$ and $M\cap N=\{0\}$, then $M$ is **complemented** in $X$, and $X$ is the **direct sum** of $M$ and $N$, written $X=M\oplus N$.`,
      idea: String.raw`Every $x$ then splits uniquely as $x=m+n$; the map $P:x\mapsto m$ is the projection onto $M$ along $N$, with $\mathscr N(P)=N$. In an $F$-space it is continuous (the closed graph theorem, 2.15, since $M$ and $N$ are closed). How large $\|P\|$ is depends on how close $N$ comes to $M$. In a Hilbert space every closed subspace is complemented by its orthogonal complement; in Banach spaces this can fail (e.g. $c_0$ in $\ell^\infty$), which is why the next lemma matters.`,
      caption: String.raw`$X=\R^2$ with an $\ell^p$ norm. Drag the direction handles of the lines $M$ (blue) and $N$ (orange), and the point $x$: it splits as $x=Px+(x-Px)$ along the parallelogram. The right panel plots $\|P\|=\sup_{\|x\|_p=1}\|Px\|_p$ against the angle between $M$ and $N$: it is $1$ when the complement is "perpendicular" (for $p=2$) and blows up as $N$ folds onto $M$.`,
      deps: ['fa-1.6', 'fa-2.15'],
      see: ['rca-4.11'],
      tags: ['complemented subspaces', 'projections'],
      verify: true,
      viz(v) {
        const pS = v.select('$p=$', [{ value: 1, label: '$1$' }, { value: 2, label: '$2$' }, { value: Infinity, label: '$\\infty$' }], 2);
        const L = v.stage({ x: [-2.1, 2.1], y: [-1.65, 1.65], equal: true, height: 330, ticks: false, title: '$X=M\\oplus N$' });
        const G = v.stage({ x: [-8, 188], y: [-0.4, 8.4], height: 330, axes: 'box', xticks: [0, 45, 90, 135, 180], yticks: [1, 2, 4, 6, 8], title: '$\\|P\\|$ against the angle from $M$ to $N$ (degrees)' });
        const R0 = 1.45;
        const onC = (x, y) => { const a = Math.atan2(y, x); return [R0 * Math.cos(a), R0 * Math.sin(a)]; };
        const mh = L.handle(R0 * Math.cos(0.3), R0 * Math.sin(0.3), { color: 'blue', label: 'M', constrain: onC });
        const nh = L.handle(R0 * Math.cos(1.25), R0 * Math.sin(1.25), { color: 'orange', label: 'N', constrain: onC });
        const xh = L.handle(1.2, 0.95, { color: 'accent', label: 'x' });
        const pnorm = (m, n, p) => { // ‖P‖ for projection onto span m along span n
          const det = m[0] * n[1] - m[1] * n[0]; if (Math.abs(det) < 1e-9) return Infinity;
          let best = 0; for (const z of sphere(p, 720)) { const a = (z[0] * n[1] - z[1] * n[0]) / det; best = Math.max(best, Math.abs(a) * pn(m, p)); }
          return best;
        };
        let st = {};
        v.render(() => {
          const p = pS.value;
          const am = Math.atan2(mh.y, mh.x), an = Math.atan2(nh.y, nh.x);
          const m = [Math.cos(am), Math.sin(am)], n = [Math.cos(an), Math.sin(an)];
          const x = [xh.x, xh.y], det = m[0] * n[1] - m[1] * n[0];
          L.poly(sphere(p, 360), { fill: 'gray', fillAlpha: 0.08, color: 'gray', width: 1.2 });
          L.line(-5 * m[0], -5 * m[1], 5 * m[0], 5 * m[1], { color: 'blue', width: 2.4 });
          L.line(-5 * n[0], -5 * n[1], 5 * n[0], 5 * n[1], { color: 'orange', width: 2.4 });
          let nP = Infinity;
          if (Math.abs(det) > 1e-6) {
            const a = (x[0] * n[1] - x[1] * n[0]) / det, b = (m[0] * x[1] - m[1] * x[0]) / det;
            const Px = [a * m[0], a * m[1]], Qx = [b * n[0], b * n[1]];
            L.poly([[0, 0], Px, x, Qx], { fill: 'accent', fillAlpha: 0.07, color: 'muted', width: 1.1, dash: [4, 4] });
            L.arrow(0, 0, Px[0], Px[1], { color: 'blue', width: 2.6, head: 9 });
            L.arrow(0, 0, Qx[0], Qx[1], { color: 'orange', width: 2.6, head: 9 });
            L.text('Px', Px[0], Px[1], { color: 'blue', math: true, dx: 6, dy: 12, size: 15 });
            L.text('x − Px', Qx[0], Qx[1], { color: 'orange', math: true, dx: 6, dy: -12, size: 15 });
            nP = pnorm(m, n, p);
          } else L.corner('N = M: not a complement', 'tl', { color: 'red', weight: 600 });
          L.dot(0, 0, { color: 'ink', r: 2.5 });
          // curve ‖P‖ vs angle
          const pts = [];
          for (let d = 2; d <= 178; d += 2) { const nn = [Math.cos(am + d * PI / 180), Math.sin(am + d * PI / 180)]; pts.push([d, Math.min(9, pnorm(m, nn, p))]); }
          G.path(pts, { color: 'green', width: 2.2 });
          G.hline(1, { color: 'faint', width: 1, dash: [3, 3] });
          let ang = ((an - am) * 180 / PI) % 180; if (ang < 0) ang += 180;
          if (isFinite(nP)) G.dot(ang, Math.min(8.3, nP), { color: 'orange', r: 6 });
          st = { nP, ang };
        });
        v.legend([['blue', '$M$ and $Px$'], ['orange', '$N$ and $x-Px$'], ['green', '$\\|P\\|$']]);
        v.readout(() => {
          const s = st;
          return isFinite(s.nP) ? `angle $${v.fix(s.ang, 1)}^\\circ$: $\\;\\|P\\| = ${v.fix(s.nP, 3)}$, so $\\|Px\\|\\le${v.fix(s.nP, 3)}\\,\\|x\\|$ and $\\|x-Px\\|\\le${v.fix(s.nP + 1, 3)}\\,\\|x\\|$.` : '$M\\cap N\\ne\\{0\\}$: no decomposition.';
        });
      },
    },
    // ------------------------------------------------------------------ 4.21
    {
      num: '4.21',
      kind: 'Lemma',
      name: 'Finite dimension or finite codimension ⇒ complemented',
      statement: String.raw`Let $M$ be a closed subspace of a topological vector space $X$.
(a) If $X$ is locally convex and $\dim M<\infty$, then $M$ is complemented in $X$.
(b) If $\dim(X/M)<\infty$, then $M$ is complemented in $X$.`,
      idea: String.raw`(a) Take a basis $e_1,\dots,e_n$ of $M$ with coordinate functionals $\alpha_i$; they are continuous on the finite-dimensional $M$, so Hahn–Banach (3.6) extends them to $\Lambda_i\in X^*$. Then $N=\bigcap_i\mathscr N(\Lambda_i)$ is closed and $x=\sum\Lambda_i(x)e_i+\big(x-\sum\Lambda_i(x)e_i\big)$ splits $X=M\oplus N$. Different extensions give different complements. (b) Pick $e_1,\dots,e_k$ whose cosets form a basis of $X/M$; their span $N$ is finite-dimensional, hence closed (1.21), and $X=M\oplus N$.`,
      caption: String.raw`$X=\R^3$. (a) $M$ is a line spanned by $e$. The coordinate functional on $M$ has many extensions $\Lambda$ — the slider runs through them — and each kernel $N=\mathscr N(\Lambda)$ (orange plane) is a complement; the gold point $x$ splits as $\Lambda(x)e+(x-\Lambda(x)e)$. (b) $M$ is a plane, of codimension $1$; any vector $e_1\notin M$ spans a complement (orange line). Drag the panel to rotate.`,
      deps: ['fa-4.20', 'fa-3.6', 'fa-1.21'],
      tags: ['complemented subspaces', 'Hahn–Banach'],
      verify: true,
      viz(v) {
        const mS = v.select('', [{ value: 'a', label: '(a) $\\dim M=1$' }, { value: 'b', label: '(b) $\\dim X/M=1$' }], 'a');
        const tS = v.slider('choice of $\\Lambda$ / of $e_1$', -1.5, 1.5, 0.6, { step: 0.01 });
        const e = unit3([0.85, 0.35, 0.4]);
        const a = unit3(cross(e, [0, 0, 1])), b = cross(e, a);
        const S = v.stage3d({ range: 1.85, axisLength: 1.45, height: 360, yaw: -0.75, pitch: 0.36, labels: ['', '', ''], weight: 1.25, title: '$X=\\R^3=M\\oplus N$' });
        const G = v.stage({ x: [-1.65, 1.65], y: [-0.2, 2.6], height: 360, axes: 'box', xticks: [-1.5, -1, -0.5, 0, 0.5, 1, 1.5], yticks: [0, 1, 2], title: 'norm of the projection $P$ onto $M$ along $N$' });
        const FIB = []; { const n = 3000, g = Math.PI * (3 - Math.sqrt(5)); for (let i = 0; i < n; i++) { const z = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(1 - z * z); FIB.push([r * Math.cos(g * i), r * Math.sin(g * i), z]); } }
        const projNorm = (P) => { let m = 0; for (const u of FIB) m = Math.max(m, Math.hypot(...P(u))); return m; };
        const PA = (t) => { const om = lin3(1, a, 0.6, b), Lam = lin3(1, e, t, om); return (u) => e.map((w) => dot3(Lam, u) * w); };
        const PB = (t) => { const e1 = unit3(lin3(1, e, t, a)); return (u) => { const c = dot3(u, e) / dot3(e1, e); return [0, 1, 2].map((i) => u[i] - c * e1[i]); }; };
        const curves = { a: [], b: [] };
        const x0 = [-0.35, 0.95, 0.75];
        for (let t = -1.5; t <= 1.5001; t += 0.05) { curves.a.push([t, projNorm(PA(t))]); curves.b.push([t, projNorm(PB(t))]); }
        let st = {};
        v.render(() => {
          const t = tS.value;
          if (mS.value === 'a') {
            // Λ = e (dual to e, as a vector) + t·ω with ω = a + 0.6 b vanishing on M
            const om = lin3(1, a, 0.6, b), Lam = lin3(1, e, t, om);
            const n1 = unit3(cross(Lam, e)), n2 = unit3(cross(Lam, n1));
            plane3(S, n1, n2, 1.1, { color: 'orange', fillAlpha: 0.14 });
            S.line(e.map((u) => -1.6 * u), e.map((u) => 1.6 * u), { color: 'blue', width: 4 });
            S.tex('M', e.map((u) => 1.75 * u), { color: 'blue' });
            S.tex('N=\\mathscr N(\\Lambda)', lin3(1.15, n1, 1.15, n2), { color: 'orange', size: 14 });
            const c = dot3(Lam, x0), Px = e.map((u) => c * u), Qx = [0, 1, 2].map((i) => x0[i] - Px[i]);
            S.line(x0, Px, { color: 'muted', width: 1.3, dash: [4, 3] }); S.line(x0, Qx, { color: 'muted', width: 1.3, dash: [4, 3] });
            S.arrow([0, 0, 0], Px, { color: 'blue', width: 2.4 }); S.arrow([0, 0, 0], Qx, { color: 'orange', width: 2.4 });
            S.dot(x0, { color: 'gold', r: 5.5, label: 'x' });
            S.dot([0, 0, 0], { color: 'ink', r: 3 });
            st = { mode: 'a', c, chk: dot3(Lam, e), qn: Math.abs(dot3(Lam, Qx)), np: projNorm(PA(t)) };
          } else {
            // M = span{a, b} (normal e); complement spanned by e1 = e + t·a
            const e1 = unit3(lin3(1, e, t, a));
            plane3(S, a, b, 1.05, { color: 'blue', fillAlpha: 0.15 });
            S.line(e1.map((u) => -1.6 * u), e1.map((u) => 1.6 * u), { color: 'orange', width: 4 });
            S.tex('M', lin3(1.15, a, 1.15, b), { color: 'blue' });
            S.tex('N=\\operatorname{span}\\{e_1\\}', e1.map((u) => 1.78 * u), { color: 'orange', size: 14 });
            const c = dot3(x0, e) / dot3(e1, e), Qx = e1.map((u) => c * u), Px = [0, 1, 2].map((i) => x0[i] - Qx[i]);
            S.line(x0, Px, { color: 'muted', width: 1.3, dash: [4, 3] }); S.line(x0, Qx, { color: 'muted', width: 1.3, dash: [4, 3] });
            S.arrow([0, 0, 0], Px, { color: 'blue', width: 2.4 }); S.arrow([0, 0, 0], Qx, { color: 'orange', width: 2.4 });
            S.dot(x0, { color: 'gold', r: 5.5, label: 'x' });
            S.dot([0, 0, 0], { color: 'ink', r: 3 });
            st = { mode: 'b', c, pm: Math.abs(dot3(Px, e)), ang: Math.acos(Math.abs(dot3(e1, e))) * 180 / PI, np: projNorm(PB(t)) };
          }
          const cv = curves[st.mode];
          G.path(cv, { color: 'green', width: 2.4 });
          G.hline(1, { color: 'faint', width: 1, dash: [3, 3] });
          G.dot(t, st.np, { color: 'orange', r: 6 });
          G.text(st.mode === 'a' ? 't = 0: the norm-preserving (Hahn–Banach) extension' : 't = 0: N ⟂ M', 0, 1 - 0.12, { align: 'center', baseline: 'top', color: 'muted', size: 11 });
        });
        v.legend([['blue', '$M$ and the component $Px\\in M$'], ['orange', 'the complement $N$ and $x-Px\\in N$'], ['gold', '$x$', { dot: true }]]);
        v.readout(() => {
          const s = st, z = (u) => v.fix(Math.abs(u) < 5e-13 ? 0 : u, 3);
          if (s.mode === 'a') return `$\\Lambda(e) = ${z(s.chk)}$ (so $\\Lambda$ extends the coordinate functional of $M$), $\\;\\Lambda(x) = ${z(s.c)}$, $\\;\\Lambda(x-\\Lambda(x)e) = ${z(s.qn)}$: the second piece lies in $N$. $\\;\\|P\\| = \\|\\Lambda\\|\\,\\|e\\| = ${v.fix(s.np, 3)}$.`;
          return `$e_1$ makes an angle of $${v.fix(90 - s.ang, 1)}^\\circ$ with $M$; $\\;x = Px + ${z(s.c)}\\,e_1$ with $Px\\in M$ (its normal component is $${z(s.pm)}$); $\\;\\|P\\| = ${v.fix(s.np, 3)}$.`;
        });
      },
    },
  ],
};
