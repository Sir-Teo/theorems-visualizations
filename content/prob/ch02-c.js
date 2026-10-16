// Probability: Theory and Examples (Durrett) — Chapter 2, part C: Borel–Cantelli lemmas and the strong law (§§2.3–2.4)

// ---------- helpers (local to this part) ----------
const clampN = (x, a, b) => Math.min(b, Math.max(a, x));
/** Status text pinned to a corner of the data area (inside the gutter). */
function cornerIn(S, str, pos = 'tl', st = {}) {
  const l = S.X(S.xr[0]), r = S.X(S.xr[1]), t = S.Y(S.yr[1]), b = S.Y(S.yr[0]);
  const X = pos[1] === 'l' ? l + 8 : r - 8, Y = pos[0] === 't' ? t + 13 : b - 13;
  const o = { align: pos[1] === 'l' ? 'left' : 'right', color: 'muted', size: 12, ...st };
  if (/\$[^$]+\$/.test(str)) return S.texPx(String(str), X, Y, { ...o, rich: true });
  return S.textPx(String(str), X, Y, o);
}
/** About m log-spaced distinct integers in [n0, n1], always including both ends. */
function logGrid(n0, n1, m = 200) {
  const out = [n0]; const q = Math.pow(n1 / n0, 1 / m);
  for (let x = n0 * q; x < n1; x *= q) { const k = Math.round(x); if (k > out[out.length - 1]) out.push(k); }
  if (out[out.length - 1] !== n1) out.push(n1);
  return out;
}
/**
 * Exact simulation of independent indicators 1_{A_n}, n0 ≤ n ≤ nmax, with P(A_n) = p(n) nonincreasing:
 * geometric jumps at the current bound q = p(n), each proposal accepted with probability p(m)/q (thinning).
 */
function bernTimes(p, n0, nmax, r) {
  const out = []; let n = n0;
  while (n <= nmax) {
    const q = p(n);
    if (q >= 1) { out.push(n); n++; continue; }
    if (!(q > 0)) break;
    const g = Math.floor(Math.log(1 - r()) / Math.log1p(-q));
    n += g; if (n > nmax) break;
    if (r() * q < p(n)) out.push(n);
    n++;
  }
  return out;
}
/** Running averages S_n/n of a generator of steps, recorded at the integers of grid (sorted). */
function runAvg(draw, grid) {
  const out = new Float64Array(grid.length); let s = 0, j = 0; const N = grid[grid.length - 1];
  for (let n = 1; n <= N; n++) { s += draw(n); if (n === grid[j]) { out[j] = s / n; j++; } }
  return out;
}
/** ζ(s) for s > 1 (direct sum plus Euler–Maclaurin tail). */
function zeta(s) { let t = 0; const N = 2000; for (let k = 1; k <= N; k++) t += k ** -s; return t + N ** (1 - s) / (s - 1) - 0.5 * N ** -s; }
/** H_n = Σ_{k ≤ n} 1/k (asymptotic beyond 1e6). */
function harm(n) { if (n <= 1e6) { let t = 0; for (let k = 1; k <= n; k++) t += 1 / k; return t; } return Math.log(n) + 0.5772156649 + 1 / (2 * n) - 1 / (12 * n * n); }
const Q_PRIME = 1000003;

export default {
  collection: 'prob',
  chapter: 2,
  items: [
    // ======================================================================== §2.3 Borel–Cantelli lemmas
    {
      num: '2.3.1',
      kind: 'Theorem',
      name: 'Borel–Cantelli lemma',
      credit: 'Borel, 1909; Cantelli, 1917',
      statement: String.raw`Let $A_1,A_2,\dots$ be events on a probability space. If $\sum_{n}P(A_n)<\infty$, then
$$P(A_n\text{ i.o.})=0,$$
where $\{A_n\text{ i.o.}\}=\limsup_n A_n=\bigcap_{m\ge1}\bigcup_{n\ge m}A_n$ is the event that infinitely many of the $A_n$ occur. Nothing is assumed about how the events depend on one another.`,
      idea: String.raw`Count the occurrences, $N=\sum_n 1_{A_n}$. Monotone convergence (or Fubini, Theorem 1.6.6's companion results) gives $EN=\sum_nP(A_n)<\infty$, so $N<\infty$ almost surely; but $\{A_n\text{ i.o.}\}$ is exactly $\{N=\infty\}$. Said differently, $P\big(\bigcup_{n\ge m}A_n\big)\le\sum_{n\ge m}P(A_n)$, a tail of a convergent series.`,
      caption: String.raw`Left: each row is one seeded sample point $\omega$, and a dot at $n$ means $A_n$ occurred, with $P(A_n)=n^{-s}$ (log scale in $n$); the green ring marks the last occurrence up to $10^4$. Right: the average count $N_n$ over the 40 rows (gold) follows $\sum_{k\le n}P(A_k)$ (blue). Slide $s$ above $1$: the dots die out and the curves flatten at $\zeta(s)$. Below $1$ they never stop. Switch to the nested coupling $A_n=\{U\le n^{-s}\}$: occurrences form one initial block, finite for every $s$, so the lemma's conclusion can hold even when the sum diverges.`,
      deps: ['prob-1.6.6'],
      see: ['rca-1.41', 'prob-2.3.7'],
      tags: ['borel-cantelli'],
      viz(v) {
        const sS = v.slider('$s$ in $P(A_n)=n^{-s}$', 0.5, 2.5, 1.4, { step: 0.05 });
        const cpl = v.select('coupling', [{ value: 'ind', label: 'independent' }, { value: 'nest', label: 'nested: $A_n=\\{U\\le n^{-s}\\}$' }], 'ind');
        let seed = 1; v.button('Resample', () => { seed++; });
        const NMAX = 10000, ROWS = 40, grid = logGrid(1, NMAX, 160);
        const L = v.stage({ x: [1, NMAX], y: [0.3, ROWS + 0.7], xlog: true, height: 340, weight: 1.45, axes: 'box', gutter: true, xlabel: '$n$', yticks: [], title: 'which $A_n$ occur (one row per $\\omega$)' });
        const R = v.stage({ x: [1, NMAX], y: [0, 10], xlog: true, height: 340, axes: 'box', gutter: true, xlabel: '$n$', title: 'counts up to $n$' });
        let cache = null, st = null;
        v.render(() => {
          const s = sS.value, key = `${s}|${cpl.value}|${seed}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 31 + 7), p = new Float64Array(NMAX + 1);
            for (let n = 1; n <= NMAX; n++) p[n] = n ** -s;
            const rows = [];
            for (let i = 0; i < ROWS; i++) {
              if (cpl.value === 'nest') { const U = r(); const last = Math.min(NMAX, Math.floor(U ** (-1 / s))); rows.push({ block: last }); }
              else { const occ = []; for (let n = 1; n <= NMAX; n++) if (r() < p[n]) occ.push(n); rows.push({ occ }); }
            }
            const mean = grid.map((g) => rows.reduce((t, rw) => t + (rw.block != null ? Math.min(rw.block, g) : rw.occ.filter((n) => n <= g).length), 0) / ROWS);
            const EN = []; let acc = 0, j = 0; for (let n = 1; n <= NMAX; n++) { acc += p[n]; if (n === grid[j]) { EN.push(acc); j++; } }
            let surv = 1; for (let n = 1001; n <= NMAX; n++) surv *= 1 - p[n];
            const quiet = rows.filter((rw) => (rw.block != null ? rw.block <= 1000 : !rw.occ.some((n) => n > 1000))).length / ROWS;
            cache = { key, rows, mean, EN, surv, quiet };
          }
          const { rows, mean, EN } = cache;
          rows.forEach((rw, i) => {
            const y = i + 1;
            if (rw.block != null) { L.line(1, y, Math.max(1.0001, rw.block), y, { color: 'accent', width: 3, alpha: 0.7 }); L.dot(rw.block, y, { r: 3.2, color: 'green', hollow: true }); }
            else { L.dots(rw.occ.map((n) => [n, y]), { r: 1.7, color: 'accent' }); if (rw.occ.length) L.dot(rw.occ[rw.occ.length - 1], y, { r: 3.4, color: 'green', hollow: true }); }
          });
          const top = Math.max(EN[EN.length - 1], mean[mean.length - 1], 2) * 1.12;
          R.setView(null, [0, top]);
          if (s > 1) R.hline(zeta(s), { color: 'green', dash: [6, 4], width: 1.5 });
          R.path(grid.map((g, k) => [g, EN[k]]), { color: 'accent', width: 2.4 });
          R.path(grid.map((g, k) => [g, mean[k]]), { color: 'gold', width: 2 });
          if (s > 1) cornerIn(R, `$EN=\\zeta(s)=${v.fix(zeta(s), 2)}$`, 'br', { color: 'green' });
          v.legend([['accent', '$\\sum_{k\\le n}P(A_k)$'], ['gold', 'average count over rows'], ['green', 'last occurrence', { dot: true }]]);
          st = { s, sum: EN[EN.length - 1], quiet: cache.quiet, surv: cache.surv, nest: cpl.value === 'nest' };
        });
        v.readout(() => st && `$\\sum_{n\\le10^4}P(A_n)=${v.fix(st.sum, 2)}$` + (st.s > 1 ? `, and the full series converges to $\\zeta(${v.fix(st.s, 2)})=${v.fix(zeta(st.s), 3)}$` : ' and the full series diverges') + `. Rows with no occurrence in $(10^3,10^4]$: $${Math.round(st.quiet * 100)}\\%$` + (st.nest ? ' (nested: once $U>n^{-s}$ nothing more happens).' : ` (independent, exact: $\\prod(1-n^{-s})=${v.fix(st.surv * 100, 1)}\\%$).`));
      },
    },
    {
      num: '2.3.2',
      kind: 'Theorem',
      name: 'In probability ⇔ a.s. convergent sub-subsequences',
      statement: String.raw`$X_n\to X$ in probability if and only if every subsequence $X_{n(m)}$ has a further subsequence $X_{n(m_k)}$ that converges to $X$ almost surely.`,
      idea: String.raw`($\Rightarrow$) Given $n(m)$, pick $m_k$ increasing with $P\big(|X_{n(m_k)}-X|>1/k\big)\le2^{-k}$, possible because these probabilities tend to $0$. The probabilities are summable, so by Borel–Cantelli (2.3.1) only finitely many of these events occur, and $X_{n(m_k)}\to X$ a.s. ($\Leftarrow$) Apply Theorem 2.3.3 to the numbers $y_n=P(|X_n-X|>\eps)$: each subsequence has a sub-subsequence along which a.s. convergence, and hence (bounded convergence) $y\to0$, holds.`,
      caption: String.raw`The typewriter sequence on $\Omega=[0,1]$: $X_n$ is the indicator of the shaded interval in column $n$ (block $k$ sweeps $[0,1]$ with intervals of length $2^{-k}$). Drag $\omega$ (gold): $X_n(\omega)=1$ once in every block (red), so $X_n(\omega)$ converges for no $\omega$, although $P(X_n\ne0)\to0$. Pick a starting subsequence; the app keeps the first term of it with $P(X_n=1)\le2^{-k}$ at step $k$ (green columns). Along those, the strip shows that $\omega$ is hit only finitely often.`,
      deps: ['prob-2.3.1', 'prob-2.2.1a', 'prob-1.3.7a', 'prob-2.3.3'],
      tags: ['convergence'],
      viz(v) {
        const sub = v.select('start from', [{ value: 'all', label: 'all $n$' }, { value: 'odd', label: 'odd $n$' }, { value: 'three', label: '$n\\in3\\mathbb N$' }, { value: 'rand', label: 'random half' }], 'three');
        const NMAX = 2047, lev = (n) => Math.floor(Math.log2(n) + 1e-12);
        const I = (n) => { const k = lev(n), j = n - 2 ** k; return [j / 2 ** k, (j + 1) / 2 ** k]; };
        const T = v.stage({ x: [1, NMAX + 1], y: [0, 1], xlog: true, height: 300, full: true, axes: 'box', gutter: true, xlabel: '$n$ (log scale)', ylabel: '$\\omega$', title: '$X_n=1$ on the shaded interval of column $n$' });
        const B = v.stage({ x: [1, NMAX + 1], y: [-0.25, 1.35], xlog: true, height: 130, full: true, axes: 'box', gutter: true, yticks: [[0, '0'], [1, '1']], xlabel: '$n$', title: '$X_n(\\omega)$: whole sequence (red) and the extracted sub-subsequence (green)' });
        const H = T.handle(1.25, 0.37, { color: 'gold', label: 'ω', labelPos: 'e', constrain: (x, y) => [1.25, clampN(y, 0.002, 0.998)] });
        let st = null;
        v.render(() => {
          const r = v.rng(11), seq = [];
          for (let n = 1; n <= NMAX; n++) { const keep = sub.value === 'all' || (sub.value === 'odd' && n % 2) || (sub.value === 'three' && n % 3 === 0) || (sub.value === 'rand' && r() < 0.5); if (keep) seq.push(n); }
          const pick = []; let k = 1;
          for (const n of seq) if (2 ** -lev(n) <= 2 ** -k) { pick.push(n); k++; }
          const w = H.y, pickSet = new Set(pick);
          for (let n = 1; n < 64; n++) { const [a, b] = I(n); T.rect(n, a, n + 1, b, { fill: pickSet.has(n) ? 'green' : 'accent', fillAlpha: pickSet.has(n) ? 0.75 : 0.28, stroke: false }); }
          for (let k2 = 6; k2 <= 10; k2++) { const pts = []; for (let j = 0; j < 2 ** k2; j += 2 ** (k2 - 6)) pts.push([2 ** k2 + j + 0.5, (j + 0.5) / 2 ** k2]); pts.push([2 ** (k2 + 1), 1]); T.path(pts, { color: 'accent', width: 3, alpha: 0.4 }); }
          pick.filter((n) => n >= 64).forEach((n) => { const [a, b] = I(n); T.line(n + 0.5, a, n + 0.5, b, { color: 'green', width: 4 }); T.dot(n + 0.5, (a + b) / 2, { r: 3, color: 'green' }); });
          for (let k2 = 0; k2 <= 11; k2++) T.vline(2 ** k2, { color: 'grid', width: 1 });
          T.hline(w, { color: 'gold', width: 1.6 });
          const hits = [];
          for (let n = 1; n <= NMAX; n++) { const [a, b] = I(n); if (w >= a && w < b) hits.push(n); }
          hits.forEach((n) => T.dot(n + 0.5, w, { r: 3.5, color: 'red' }));
          // strip
          B.hline(0, { color: 'faint', width: 1 });
          hits.forEach((n) => B.line(n + 0.5, 0, n + 0.5, 1, { color: 'red', width: 2 }));
          const subHits = [];
          pick.forEach((n, i) => { const [a, b] = I(n), on = w >= a && w < b; if (on) subHits.push(i + 1); B.dot(n + 0.5, on ? 1 : 0, { r: 5, color: 'green', hollow: !on }); });
          const tail = (K) => pick.slice(K - 1).reduce((t, n) => t + 2 ** -lev(n), 0);
          st = { hits: hits.length, pick, subHits, tail3: tail(3), tail6: tail(6) };
          v.legend([['accent', '$\\{X_n=1\\}$', { area: true }], ['green', 'kept: $P(X_{n_k}=1)\\le2^{-k}$', { area: true }], ['red', '$X_n(\\omega)=1$', { dot: true }]]);
        });
        v.readout(() => st && `Whole sequence: $X_n(\\omega)=1$ for ${st.hits} of the $n\\le2047$, one in every block, forever. Kept indices $n_k$: ${st.pick.slice(0, 8).join(', ')}${st.pick.length > 8 ? ', …' : ''}; ${st.subHits.length ? `$X_{n_k}(\\omega)=1$ only for $k\\in\\{${st.subHits.join(',')}\\}$.` : '$X_{n_k}(\\omega)=0$ for every $k$.'} Borel–Cantelli: $P(X_{n_k}=1\\text{ for some }k\\ge3)\\le${v.fix(st.tail3, 3)}$, $\\ \\ge6$: $\\le${v.fix(st.tail6, 4)}$.`);
      },
    },
    {
      num: '2.3.3',
      kind: 'Theorem',
      name: 'Sub-subsequence criterion for convergence',
      statement: String.raw`Let $y_n$ be a sequence in a topological space. If every subsequence $y_{n(m)}$ has a further subsequence $y_{n(m_k)}$ that converges to $y$, then $y_n\to y$.`,
      idea: String.raw`Argue by contradiction. If $y_n\not\to y$, some open set $G\ni y$ misses $y_n$ for infinitely many $n$; list those $n$ as a subsequence $n(m)$. No sub-subsequence of it can converge to $y$, because all its terms stay outside $G$. Read in reverse, the theorem is a test: to prove convergence it suffices to extract convergent pieces from arbitrary subsequences, which is how Theorem 2.3.2 turns almost sure statements into statements in probability.`,
      caption: String.raw`The sequence is $y_n=y^*+(-1)^n/n$, except on the perfect squares, where a rogue value $y^*+r$ sits. Choose a starting subsequence (orange); the app greedily extracts a sub-subsequence with $|y_{n_k}-y|<1/k$ (green). Drag the target $y$ (gold) away from $y^*$, or set $r\ne0$ and start from the squares: the extraction gets stuck, which certifies that $y_n\not\to y$. With $r=0$ and $y=y^*$ every start succeeds.`,
      deps: [],
      see: ['prob-2.3.2'],
      tags: ['convergence'],
      viz(v) {
        const rS = v.slider('rogue offset $r$', 0, 1, 0.6, { step: 0.05 });
        const sub = v.select('start from', [{ value: 'three', label: 'every 3rd term' }, { value: 'sq', label: 'the squares' }, { value: 'rand', label: 'random' }], 'three');
        const N = 400, YS = 1;
        const S = v.stage({ x: [1, N], xlog: true, y: [-0.2, 2.4], height: 330, full: true, axes: 'box', gutter: true, xlabel: '$n$', ylabel: '$y_n$', title: 'a sequence, a subsequence, and the extracted sub-subsequence' });
        const H = S.handle(1.12, YS, { color: 'gold', label: 'y', labelPos: 'e', constrain: (x, y) => [1.12, clampN(y, -0.1, 2.3)] });
        let st = null;
        v.render(() => {
          const r = rS.value, yt = H.y, isSq = (n) => Number.isInteger(Math.sqrt(n));
          const y = (n) => (isSq(n) ? YS + r : YS + (-1) ** n / n);
          const rr = v.rng(5), seq = [];
          for (let n = 1; n <= N; n++) if ((sub.value === 'three' && n % 3 === 0) || (sub.value === 'sq' && isSq(n)) || (sub.value === 'rand' && rr() < 0.3)) seq.push(n);
          const pick = []; let k = 1;
          for (const n of seq) if (Math.abs(y(n) - yt) < 1 / k) { pick.push(n); k++; }
          const kLast = k, eps = 1 / kLast;
          S.hband(yt - eps, yt + eps, { color: 'green', alpha: 0.12 });
          S.hline(YS, { color: 'muted', dash: [5, 4], width: 1 });
          S.tex('y^*', N * 0.8, YS + 0.12, { color: 'muted', size: 13 });
          const all = []; for (let n = 1; n <= N; n++) all.push([n, y(n)]);
          S.dots(all, { r: 1.6, color: 'faint' });
          S.dots(seq.map((n) => [n, y(n)]), { r: 3, color: 'orange' });
          if (pick.length > 1) S.path(pick.map((n) => [n, y(n)]), { color: 'green', width: 1.5, alpha: 0.7 });
          S.dots(pick.map((n) => [n, y(n)]), { r: 4.5, color: 'green' });
          const ok = pick.length >= 6 && Math.abs(y(pick[pick.length - 1]) - yt) < 0.05;
          cornerIn(S, ok ? 'extraction keeps going: converges to y' : 'extraction stuck: no sub-subsequence tends to y', 'tr', { color: ok ? 'green' : 'red' });
          v.legend([['faint', '$y_n$', { dot: true }], ['orange', 'starting subsequence', { dot: true }], ['green', 'extracted sub-subsequence', { dot: true }], ['green', 'band $|y_n-y|<1/k$', { area: true }]]);
          st = { pick, k: kLast, ok, conv: r === 0 && Math.abs(yt - YS) < 1e-9 };
        });
        v.readout(() => st && `Extracted $${st.pick.length}$ terms (${st.pick.slice(0, 7).join(', ')}${st.pick.length > 7 ? ', …' : ''}); the next one would need $|y_n-y|<1/${st.k}$. ` + (st.ok ? 'Every start that succeeds is consistent with $y_n\\to y$.' : 'This start has no sub-subsequence converging to $y$, so by the theorem (contrapositive) $y_n\\not\\to y$.'));
      },
    },
    {
      num: '2.3.4',
      kind: 'Theorem',
      name: 'Continuous mapping and dominated convergence in probability',
      statement: String.raw`Suppose $X_n\to X$ in probability.

(a) If $f$ is continuous, then $f(X_n)\to f(X)$ in probability.
(b) If in addition $f$ is bounded, then $Ef(X_n)\to Ef(X)$.
(c) (Dominated convergence) If $|X_n|\le Y$ with $EY<\infty$, then $EX_n\to EX$.`,
      idea: String.raw`Use sub-subsequences. Given a subsequence, Theorem 2.3.2 yields a further subsequence with $X_{n(m_k)}\to X$ a.s.; continuity gives $f(X_{n(m_k)})\to f(X)$ a.s., and the bounded (or dominated) convergence theorem gives convergence of the means along it. Since every subsequence has such a sub-subsequence, Theorem 2.3.3 upgrades this to the whole sequence, for the real numbers $Ef(X_n)$ and for $P(|f(X_n)-f(X)|>\eps)$ alike.`,
      caption: String.raw`Here $X_n=X+Z/\sqrt n$ plus, with probability $1/n$, a jump of size $n$ (3000 seeded samples; left: the pairs $(X,X_n)$ for the chosen $n$). Right, against $n$: the fraction of samples with $|f(X_n)-f(X)|>0.1$ (gold) and $|\overline{f(X_n)}-\overline{f(X)}|$ (blue, capped at $1$). For bounded continuous $\arctan$ both vanish. For $x^2$ the probability still vanishes but the means blow up, because the jump $n$ with probability $1/n$ adds about $n$ to $E X_n^2$: no domination. For $1\{x>0\}$ with $X\equiv0$, $X$ sits on the discontinuity and even (a) fails.`,
      deps: ['prob-2.3.2', 'prob-2.3.3', 'prob-1.6.7'],
      tags: ['convergence'],
      viz(v) {
        const fS = v.select('$f$', [{ value: 'atan', label: '$\\arctan x$' }, { value: 'sq', label: '$x^2$' }, { value: 'ind', label: '$1\\{x>0\\}$' }], 'atan');
        const xS = v.select('$X$', [{ value: 'norm', label: 'standard normal' }, { value: 'zero', label: '$X\\equiv0$' }], 'norm');
        const nS = v.slider('$n$', 1, 1000, 20, { log: true, int: true });
        const F = { atan: Math.atan, sq: (x) => x * x, ind: (x) => (x > 0 ? 1 : 0) };
        const N = 3000, r0 = v.rng(17), X0 = [], Z = [], U = [];
        for (let i = 0; i < N; i++) { X0.push(r0.normal()); Z.push(r0.normal()); U.push(r0()); }
        const grid = logGrid(1, 1000, 60);
        const L = v.stage({ x: [-4, 4], y: [-4, 4], height: 320, equal: true, axes: 'box', gutter: true, xlabel: '$X$', ylabel: '$X_n$', title: 'samples $(X,X_n)$' });
        const R = v.stage({ x: [1, 1000], y: [0, 1.08], xlog: true, height: 320, weight: 1.3, axes: 'box', gutter: true, xlabel: '$n$', title: 'convergence in probability and of means' });
        let cache = null, st = null;
        const Xn = (i, n, X) => X[i] + Z[i] / Math.sqrt(n) + (U[i] < 1 / n ? n : 0);
        v.render(() => {
          const f = F[fS.value], X = xS.value === 'zero' ? X0.map(() => 0) : X0, key = fS.value + xS.value;
          if (!cache || cache.key !== key) {
            const pr = [], mg = [];
            for (const n of grid) {
              let bad = 0, s1 = 0, s0 = 0;
              for (let i = 0; i < N; i++) { const a = f(Xn(i, n, X)), b = f(X[i]); if (Math.abs(a - b) > 0.1) bad++; s1 += a; s0 += b; }
              pr.push(bad / N); mg.push(Math.abs(s1 - s0) / N);
            }
            cache = { key, pr, mg };
          }
          const n = nS.value;
          L.line(-4, -4, 4, 4, { color: 'muted', dash: [5, 4], width: 1 });
          const pts = []; let off = 0;
          for (let i = 0; i < 1200; i++) { const y = Xn(i, n, X); if (Math.abs(y) > 4) off++; else pts.push([X[i] + (xS.value === 'zero' ? 0.04 * Z[(i + 7) % N] : 0), y]); }
          L.dots(pts, { r: 1.6, color: 'accent', alpha: 0.5 });
          if (off) cornerIn(L, `${off} jumps off the panel`, 'tl', { color: 'red' });
          R.hline(0, { color: 'muted', width: 1 });
          R.path(grid.map((g, k) => [g, cache.pr[k]]), { color: 'gold', width: 2.4 });
          R.path(grid.map((g, k) => [g, Math.min(1.05, cache.mg[k])]), { color: 'accent', width: 2.4 });
          R.vline(n, { color: 'muted', dash: [3, 3], width: 1 });
          const k = grid.findIndex((g) => g >= n);
          v.legend([['gold', '$P(|f(X_n)-f(X)|>0.1)$'], ['accent', '$|Ef(X_n)-Ef(X)|$ (estimate)']]);
          st = { n, pr: cache.pr[k], mg: cache.mg[k], prEnd: cache.pr[grid.length - 1], mgEnd: cache.mg[grid.length - 1] };
        });
        v.readout(() => st && `At $n=${st.n}$: $P(|f(X_n)-f(X)|>0.1)\\approx${v.fix(st.pr, 3)}$, $\\ |Ef(X_n)-Ef(X)|\\approx${v.fix(st.mg, 3)}$. At $n=1000$: $${v.fix(st.prEnd, 3)}$ and $${v.fix(st.mgEnd, 3)}$.` + (fS.value === 'sq' ? ' The mean gap grows like $n\\cdot(1/n)\\cdot n$: $x^2$ is unbounded and nothing dominates.' : fS.value === 'ind' && xS.value === 'zero' ? ' $f$ jumps exactly where $X$ lives, so $f(X_n)$ is a fair coin and never converges.' : ''));
      },
    },
    {
      num: '2.3.5',
      kind: 'Theorem',
      name: 'Strong law with fourth moments',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. with $EX_i=\mu$ and $EX_i^4<\infty$, and $S_n=X_1+\dots+X_n$. Then $S_n/n\to\mu$ almost surely.`,
      idea: String.raw`Take $\mu=0$. Expanding $ES_n^4$, every term containing some $X_i$ to the first power has mean $0$, leaving $nEX_1^4+3n(n-1)(EX_1^2)^2\le Cn^2$. Chebyshev's inequality with the fourth power gives $P(|S_n|>n\eps)\le Cn^2/(n\eps)^4=C/(\eps^4n^2)$, which is summable. Borel–Cantelli (2.3.1) says $|S_n/n|>\eps$ only finitely often, for every $\eps=1/k$.`,
      caption: String.raw`Left: 20 of 100 seeded paths of $S_n/n$ (mean $0$, variance $1$) with the band $\pm\eps$; a dot marks each path's last exit from the band. Right (log–log): the Borel–Cantelli tail $\sum_{m\ge n}\min(1,b_m)$ of the fourth-moment bounds $b_m$ (blue) and the fraction of the 100 paths that still leave the band after time $n$ (gold); the bound sits above the truth and is useful once it drops below $1$. Pick the Pareto law, with $EX^4=\infty$: the bound is gone, though the paths still converge (Etemadi, 2.4.1).`,
      deps: ['prob-2.3.1', 'prob-2.2.3a'],
      see: ['prob-2.4.1'],
      tags: ['law of large numbers'],
      viz(v) {
        const LAWS = {
          coin: { label: '$\\pm1$ coin', m4: 1, draw: (r) => (r() < 0.5 ? -1 : 1) },
          unif: { label: 'uniform', m4: 1.8, draw: (r) => (2 * r() - 1) * Math.sqrt(3) },
          exp: { label: 'exponential $-1$', m4: 9, draw: (r) => -Math.log(1 - r()) - 1 },
          par: { label: 'Pareto $\\alpha=3$', m4: Infinity, draw: (r) => (r() < 0.5 ? -1 : 1) * (1 - r()) ** (-1 / 3) / Math.sqrt(3) },
        };
        const law = v.select('law', Object.entries(LAWS).map(([value, o]) => ({ value, label: o.label })), 'exp');
        const eS = v.slider('$\\eps$', 0.05, 0.5, 0.3, { step: 0.01 });
        const NMAX = 10000, P = 100, grid = logGrid(1, NMAX, 220);
        const L = v.stage({ x: [1, NMAX], y: [-1.2, 1.2], xlog: true, height: 320, weight: 1.3, axes: 'box', gutter: true, xlabel: '$n$', title: 'paths of $S_n/n$ and the band $\\pm\\eps$' });
        const R = v.stage({ x: [1, NMAX], y: [1e-3, 1e3], xlog: true, ylog: true, height: 320, axes: 'box', gutter: true, xlabel: '$n$', title: 'chance of leaving the band after $n$' });
        let cache = null, st = null;
        v.render(() => {
          const Lw = LAWS[law.value], eps = eS.value;
          if (!cache || cache.key !== law.value) {
            const r = v.rng(23), paths = [], sup = [];
            for (let p = 0; p < P; p++) {
              const avg = new Float64Array(NMAX + 1); let s = 0;
              for (let n = 1; n <= NMAX; n++) { s += Lw.draw(r); avg[n] = s / n; }
              const sm = new Float64Array(grid.length); let m = 0, j = grid.length - 1;
              for (let n = NMAX; n >= 1; n--) { m = Math.max(m, Math.abs(avg[n])); while (j >= 0 && grid[j] === n) { sm[j] = m; j--; } }
              paths.push(grid.map((g) => avg[g])); sup.push(sm);
            }
            cache = { key: law.value, paths, sup };
          }
          L.hband(-eps, eps, { color: 'green', alpha: 0.13 });
          L.hline(0, { color: 'green', width: 1.2 });
          const lastExit = [];
          cache.paths.forEach((pth, p) => {
            let j = -1; for (let k = grid.length - 1; k >= 0; k--) if (cache.sup[p][k] > eps) { j = k; break; }
            lastExit.push(j < 0 ? 0 : grid[j]);
            if (p < 20) { L.path(grid.map((g, k) => [g, clampN(pth[k], -1.3, 1.3)]), { color: 'accent', width: 1.1, alpha: 0.55 }); if (j >= 0) L.dot(grid[j], pth[j], { r: 3, color: 'gold' }); }
          });
          // bound
          const b = (m) => Math.min(1, (m * Lw.m4 + 3 * m * (m - 1)) / (m ** 4 * eps ** 4));
          const B = new Float64Array(grid.length);
          if (isFinite(Lw.m4)) {
            const MM = 1e6; let acc = 3 / (MM * eps ** 4), j = grid.length - 1;
            for (let m = MM; m >= 1; m--) { acc += b(m); while (j >= 0 && grid[j] === m) { B[j] = acc; j--; } }
            R.hline(1, { color: 'muted', dash: [4, 4], width: 1 });
            R.path(grid.map((g, k) => [g, B[k]]), { color: 'accent', width: 2.4 });
          } else cornerIn(R, '$EX^4=\\infty$: no fourth-moment bound', 'tr', { color: 'red' });
          const frac = grid.map((g, k) => [g, cache.sup.filter((sm) => sm[k] > eps).length / P]);
          R.path(frac.map(([g, f]) => [g, f > 0 ? f : null]), { color: 'gold', width: 2.2 });
          v.legend([['accent', 'bound $\\sum_{m\\ge n}\\min(1,b_m)$'], ['gold', 'fraction of paths leaving after $n$'], ['gold', 'last exit', { dot: true }]]);
          const kN = grid.indexOf(1000) >= 0 ? grid.indexOf(1000) : grid.findIndex((g) => g >= 1000);
          st = { maxExit: Math.max(...lastExit), B1000: isFinite(Lw.m4) ? B[kN] : Infinity, f1000: frac[kN][1], nOk: isFinite(Lw.m4) ? grid.find((g, k) => B[k] < 1) : null };
        });
        v.readout(() => st && `Latest exit among the 100 paths: $n=${st.maxExit}$. After $n=1000$: bound $${isFinite(st.B1000) ? v.fix(Math.min(st.B1000, 999), 3) : '\\infty'}$, observed fraction $${v.fix(st.f1000, 2)}$.` + (st.nOk ? ` The bound certifies a probability below $1$ from $n\\approx${st.nOk}$ on, and tends to $0$: hence $|S_n/n|>\\eps$ only finitely often.` : ''));
      },
    },
    {
      num: '2.3.7',
      kind: 'Theorem',
      name: 'Second Borel–Cantelli lemma',
      statement: String.raw`If the events $A_1,A_2,\dots$ are **independent** and $\sum_nP(A_n)=\infty$, then $P(A_n\text{ i.o.})=1$.`,
      idea: String.raw`Show that no tail is empty: for $M<N$, independence (Theorem 2.1.3's consequences for complements) and $1-x\le e^{-x}$ give
$$P\Big(\bigcap_{n=M}^NA_n^c\Big)=\prod_{n=M}^N\big(1-P(A_n)\big)\le\exp\Big(-\sum_{n=M}^NP(A_n)\Big)\to0\quad(N\to\infty).$$
So $P(\bigcup_{n\ge M}A_n)=1$ for every $M$, and intersecting over $M$ gives the claim.`,
      caption: String.raw`Rows are seeded sample points; dots mark the $A_n$ with $P(A_n)=\min(1,c/n)$, simulated exactly up to $n=10^6$. On the log axis independent occurrences arrive at a steady rate $c$ per unit of $\log n$, forever. Right: the chance of a silent stretch $(M,N]$ (drag $M$ with the slider), exact product (green), the bound $e^{-\sum P(A_n)}$ (blue, dashed) and the fraction of 200 rows (gold), all falling to $0$. Switch to the nested events $A_n=\{U\le c/n\}$: the sum still diverges but the occurrences stop, so independence cannot be dropped.`,
      deps: ['prob-2.1.3', 'prob-2.1.1a'],
      see: ['prob-2.3.1'],
      tags: ['borel-cantelli'],
      viz(v) {
        const cS = v.slider('$c$ in $P(A_n)=c/n$', 0.2, 3, 1, { step: 0.05 });
        const mS = v.slider('silent stretch starts at $M$', 10, 10000, 100, { log: true, int: true });
        const cpl = v.select('events', [{ value: 'ind', label: 'independent' }, { value: 'nest', label: 'nested $\\{U\\le c/n\\}$' }], 'ind');
        let seed = 1; v.button('Resample', () => { seed++; });
        const NMAX = 1e6, ROWS = 30, RR = 200;
        const L = v.stage({ x: [1, NMAX], y: [0.3, ROWS + 0.7], xlog: true, height: 330, weight: 1.4, axes: 'box', gutter: true, xlabel: '$n$', yticks: [], title: 'occurrences of $A_n$, one row per $\\omega$' });
        const R = v.stage({ x: [10, NMAX], y: [0, 1.02], xlog: true, height: 330, axes: 'box', gutter: true, xlabel: '$N$', title: 'P(no $A_n$ with $M<n\\le N$)' });
        let cache = null, st = null;
        v.render(() => {
          const c = cS.value, M = mS.value, nest = cpl.value === 'nest', key = `${c}|${nest}|${seed}`;
          const p = (n) => Math.min(1, c / n);
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 97 + 1), rows = [];
            for (let i = 0; i < RR; i++) {
              if (nest) { const U = r(); const last = Math.min(NMAX, Math.floor(c / U)); rows.push(Array.from({ length: Math.min(last, 4000) }, (_, k) => k + 1).filter((n) => n <= 30 || n === last || n % Math.ceil(last / 200) === 0)); rows[rows.length - 1].last = last; }
              else { const t = bernTimes(p, 1, NMAX, r); t.last = t[t.length - 1] || 0; rows.push(t); }
            }
            cache = { key, rows };
          }
          cache.rows.slice(0, ROWS).forEach((occ, i) => {
            const y = i + 1;
            if (nest) { L.line(1, y, Math.max(1.0001, occ.last), y, { color: 'accent', width: 3, alpha: 0.7 }); L.dot(occ.last, y, { r: 3.2, color: 'red', hollow: true }); }
            else L.dots(occ.map((n) => [n, y]), { r: 1.9, color: 'accent' });
          });
          L.vline(M, { color: 'orange', width: 1.5, dash: [5, 3] });
          // right panel
          const Ns = logGrid(M + 1, NMAX, 140);
          const ex = [], bd = [], em = [];
          let prod = 1, sum = 0, j = 0;
          for (let n = M + 1; n <= NMAX && j < Ns.length; n++) { prod *= 1 - p(n); sum += p(n); if (n === Ns[j]) { ex.push([n, nest ? 1 - Math.min(1, c / (M + 1)) : prod]); bd.push([n, Math.exp(-sum)]); j++; } }
          for (const N of Ns) em.push([N, cache.rows.filter((occ) => (nest ? occ.last <= M : !occ.some((n) => n > M && n <= N))).length / RR]);
          R.setView([M, NMAX], [0, 1.02]);
          if (!nest) R.path(bd, { color: 'accent', width: 2, dash: [6, 4] });
          R.path(ex, { color: nest ? 'red' : 'green', width: 2.6 });
          R.path(em, { color: 'gold', width: 1.8 });
          v.legend(nest ? [['accent', 'occurrences (one block)'], ['red', 'exact: $P(U>c/(M+1))$'], ['gold', 'fraction of 200 rows']] : [['accent', 'occurrences', { dot: true }], ['green', '$\\prod(1-P(A_n))$'], ['accent', '$e^{-\\sum P(A_n)}$', { dash: true }], ['gold', 'fraction of 200 rows']]);
          st = { M, nest, end: ex[ex.length - 1][1], bd: bd[bd.length - 1][1], em: em[em.length - 1][1], sum };
        });
        v.readout(() => st && `$\\sum_{M<n\\le10^6}P(A_n)=${v.fix(st.sum, 2)}$ (and $\\to\\infty$ as the horizon grows). P(silent on $(${st.M},10^6]$): ` + (st.nest ? `$${v.fix(st.end, 3)}$, which tends to $1$ as $M\\to\\infty$: the nested events stop.` : `exact $${v.sci(st.end, 3)}\\le e^{-\\sum}=${v.sci(st.bd, 3)}$, observed $${v.fix(st.em, 3)}$.`));
      },
    },
    {
      num: '2.3.8',
      kind: 'Theorem',
      name: 'Infinite mean: |Xₙ| ≥ n infinitely often',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. with $E|X_i|=\infty$. Then $P(|X_n|\ge n\text{ i.o.})=1$. Consequently, with $S_n=X_1+\dots+X_n$, the event that $\lim S_n/n$ exists and is finite has probability $0$.`,
      idea: String.raw`By the tail formula (Lemma 2.2.13), $E|X_1|=\int_0^\infty P(|X_1|>x)\,dx\le\sum_{n\ge0}P(|X_1|>n)$, so $\sum_nP(|X_n|\ge n)=\infty$; the events are independent, and the second Borel–Cantelli lemma (2.3.7) applies. If $S_n/n$ had a finite limit, then $X_n/n=S_n/n-\frac{n-1}{n}\cdot\frac{S_{n-1}}{n-1}\to0$, contradicting $|X_n|\ge n$ infinitely often.`,
      caption: String.raw`Top (log–log): $|X_n|$ for $10^5$ seeded draws, with the line $|x|=n$; red points are the $n$ with $|X_n|\ge n$. Bottom: the running average $S_n/n$, with faint red lines at those times. For the Cauchy law (and the Pareto law with $\alpha=1$) the red points keep coming, at a rate that adds about $\frac2\pi\log10$ per decade, and each one kicks the average. For the Pareto law with $\alpha=1.5$ the mean is finite: red points stop and the average settles.`,
      deps: ['prob-2.3.7', 'prob-2.2.13'],
      tags: ['borel-cantelli', 'law of large numbers'],
      viz(v) {
        const LAWS = {
          cau: { label: 'Cauchy', draw: (r) => Math.tan(Math.PI * (r() - 0.5)), tail: (x) => 1 - (2 / Math.PI) * Math.atan(x) },
          p1: { label: 'symmetric Pareto $\\alpha=1$', draw: (r) => (r() < 0.5 ? -1 : 1) / (1 - r()), tail: (x) => (x <= 1 ? 1 : 1 / x) },
          p15: { label: 'symmetric Pareto $\\alpha=1.5$', draw: (r) => (r() < 0.5 ? -1 : 1) * (1 - r()) ** (-1 / 1.5), tail: (x) => (x <= 1 ? 1 : x ** -1.5) },
        };
        const law = v.select('law', Object.entries(LAWS).map(([value, o]) => ({ value, label: o.label })), 'cau');
        let seed = 1; v.button('Resample', () => { seed++; });
        const N = 100000, grid = logGrid(1, N, 400);
        const T = v.stage({ x: [1, N], y: [1e-2, 1e7], xlog: true, ylog: true, height: 260, full: true, axes: 'box', gutter: true, xlabel: '$n$', title: '$|X_n|$ and the line $|x|=n$' });
        const B = v.stage({ x: [1, N], y: [-6, 6], xlog: true, height: 210, full: true, axes: 'box', gutter: true, xlabel: '$n$', title: 'running average $S_n/n$' });
        let cache = null, st = null;
        v.render(() => {
          const Lw = LAWS[law.value], key = law.value + seed;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 13 + 5), big = [], small = [], hits = [], avg = []; let s = 0, j = 0;
            for (let n = 1; n <= N; n++) {
              const x = Lw.draw(r); s += x; const a = Math.abs(x);
              if (a >= n) hits.push([n, a]); else if (a > n / 30) big.push([n, a]); else if (((Math.imul(n, 2654435761) >>> 0) / 4294967296) * n < 60) small.push([n, Math.max(a, 1.1e-2)]);
              if (n === grid[j]) { avg.push([n, s / n]); j++; }
            }
            let ES = 0; for (let n = 1; n <= N; n++) ES += Lw.tail(n);
            cache = { key, big, small, hits, avg, ES };
          }
          T.fn((x) => x, { color: 'red', width: 1.6, dash: [6, 4] });
          T.dots(cache.small, { r: 1.2, color: 'faint' });
          T.dots(cache.big, { r: 1.8, color: 'accent', alpha: 0.7 });
          T.dots(cache.hits, { r: 3.5, color: 'red' });
          cache.hits.forEach(([n]) => B.vline(n, { color: 'red', alpha: 0.25, width: 1 }));
          B.hline(0, { color: 'muted', width: 1 });
          B.path(cache.avg.map(([n, a]) => [n, clampN(a, -6.5, 6.5)]), { color: 'gold', width: 2 });
          v.legend([['accent', '$|X_n|$ (thinned)', { dot: true }], ['red', '$|X_n|\\ge n$', { dot: true }], ['gold', '$S_n/n$']]);
          const late = cache.hits.filter(([n]) => n > 1000).length;
          st = { h: cache.hits.length, late, ES: cache.ES, last: cache.avg[cache.avg.length - 1][1] };
        });
        v.readout(() => st && `$\\#\\{n\\le10^5:|X_n|\\ge n\\}=${st.h}$ (expected $\\sum_{n\\le10^5}P(|X|\\ge n)=${v.fix(st.ES, 2)}$), of which ${st.late} after $n=1000$. $S_{10^5}/10^5=${v.fix(st.last, 3)}$.` + (law.value === 'p15' ? ' Here $E|X|<\\infty$, the sum converges and the hits stop.' : ' The sum diverges like a logarithm, so by Borel–Cantelli II the hits never stop.'));
      },
    },
    {
      num: '2.3.9',
      kind: 'Theorem',
      name: 'Pairwise-independent Borel–Cantelli with rates',
      statement: String.raw`If $A_1,A_2,\dots$ are **pairwise** independent and $\sum_nP(A_n)=\infty$, then
$$\frac{\sum_{m=1}^n1_{A_m}}{\sum_{m=1}^nP(A_m)}\to1\quad\text{a.s.}$$
In particular $P(A_n\text{ i.o.})=1$, and the number of occurrences grows like its mean.`,
      idea: String.raw`Let $S_n=\sum_{m\le n}1_{A_m}$. Pairwise independence makes the variances add (Theorem 2.2.1's computation), so $\operatorname{var}(S_n)\le ES_n$ and Chebyshev gives $P(|S_n-ES_n|>\delta ES_n)\le1/(\delta^2ES_n)$. This is not summable in $n$, but along $n_k=\inf\{n:ES_n\ge k^2\}$ it is $\le1/(\delta^2k^2)$, so Borel–Cantelli (2.3.1) gives $S_{n_k}/ES_{n_k}\to1$. Monotonicity of $S_n$ and $ES_{n_{k+1}}/ES_{n_k}\to1$ fill the gaps.`,
      caption: String.raw`Pairwise independent but highly dependent events: on $\Omega=\mathbb Z_q\times\mathbb Z_q$ ($q=1000003$) put $Z_a=X+aY\bmod q$ and $A_a=\{Z_a<q\,a^{-s}\}$. Any two $Z_a,Z_b$ are independent and uniform (right: 1500 seeded pairs $(Z_1,Z_2)$ fill the square), yet $Z_3=2Z_2-Z_1$ is determined by them (colour). Left: the ratio of count to expected count for 30 seeded $\omega$ tends to $1$. Compare fully independent events, and the nested events $\{U<a^{-s}\}$ where the ratio does not settle at $1$.`,
      deps: ['prob-2.2.1', 'prob-2.3.1', 'prob-2.1.3a'],
      tags: ['borel-cantelli'],
      viz(v) {
        const sS = v.slider('$s$ in $P(A_a)\\approx a^{-s}$', 0.3, 1, 0.6, { step: 0.05 });
        const cpl = v.select('events', [{ value: 'pair', label: 'pairwise independent' }, { value: 'ind', label: 'independent' }, { value: 'nest', label: 'nested' }], 'pair');
        let seed = 1; v.button('Resample', () => { seed++; });
        const q = Q_PRIME, NMAX = 100000, ROWS = 30, grid = logGrid(10, NMAX, 160);
        const L = v.stage({ x: [10, NMAX], y: [0, 2.2], xlog: true, height: 320, weight: 1.45, axes: 'box', gutter: true, xlabel: '$n$', title: 'count $/$ expected count' });
        const R = v.stage({ x: [0, 1], y: [0, 1], height: 320, equal: true, axes: 'box', gutter: true, xlabel: '$Z_1/q$', ylabel: '$Z_2/q$', title: 'pairs look independent' });
        let cache = null, st = null;
        const pts = (() => { const r = v.rng(4), out = []; for (let i = 0; i < 1500; i++) { const x = Math.floor(r() * q), y = Math.floor(r() * q); const z1 = (x + y) % q, z2 = (x + 2 * y) % q, z3 = (x + 3 * y) % q; out.push([z1 / q, z2 / q, z3 / q]); } return out; })();
        v.render(() => {
          const s = sS.value, key = `${s}|${cpl.value}|${seed}`;
          if (!cache || cache.key !== key) {
            const thr = new Float64Array(NMAX + 1), pr = new Float64Array(NMAX + 1);
            for (let a = 1; a <= NMAX; a++) { thr[a] = Math.ceil(q * a ** -s); pr[a] = thr[a] / q; }
            const E = []; let acc = 0, j = 0; for (let a = 1; a <= NMAX; a++) { acc += pr[a]; if (a === grid[j]) { E.push(acc); j++; } }
            const r = v.rng(seed * 7 + 2), rows = [];
            for (let i = 0; i < ROWS; i++) {
              const x = Math.floor(r() * q), y = Math.floor(r() * q), U = r(); let c = 0; const out = []; j = 0;
              for (let a = 1; a <= NMAX; a++) {
                let hit;
                if (cpl.value === 'pair') hit = (x + a * y) % q < thr[a];
                else if (cpl.value === 'ind') hit = r() < pr[a];
                else hit = U < pr[a];
                if (hit) c++;
                if (a === grid[j]) { out.push(c / E[j]); j++; }
              }
              rows.push(out);
            }
            cache = { key, rows, E };
          }
          L.hline(1, { color: 'green', width: 1.6, dash: [6, 4] });
          cache.rows.forEach((row) => L.path(grid.map((g, k) => [g, Math.min(2.3, row[k])]), { color: cpl.value === 'nest' ? 'red' : 'accent', width: 1.1, alpha: 0.55 }));
          for (const p of pts) R.dot(p[0], p[1], { r: 2, color: v.mix('accent', 'orange', p[2]) });
          const fin = cache.rows.map((row) => row[row.length - 1]);
          const mean = fin.reduce((a, b) => a + b, 0) / fin.length, sd = Math.sqrt(fin.reduce((a, b) => a + (b - mean) ** 2, 0) / fin.length);
          v.legend([['accent', 'ratio for one $\\omega$'], ['green', 'limit $1$', { dash: true }], ['orange', 'colour: $Z_3/q$', { dot: true }]]);
          st = { mean, sd, E: cache.E[cache.E.length - 1] };
        });
        v.readout(() => st && `Expected count by $n=10^5$: $${v.fix(st.E, 1)}$. Ratio over the 30 rows: mean $${v.fix(st.mean, 3)}$, spread (s.d.) $${v.fix(st.sd, 3)}$` + (cpl.value === 'nest' ? ': nested events are all-or-nothing, so the ratio is far from $1$.' : `, of order $1/\\sqrt{ES_n}=${v.fix(1 / Math.sqrt(st.E), 3)}$ as the variance bound predicts.`));
      },
    },
    {
      num: '2.3.11',
      kind: 'Theorem',
      name: 'Number of records grows like log n',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. with a continuous distribution, let $A_k=\{X_k>\max_{j<k}X_j\}$ be the event that a record occurs at time $k$, and $R_n=\sum_{k\le n}1_{A_k}$ the number of records up to time $n$. The $A_k$ are independent with $P(A_k)=1/k$, and
$$\frac{R_n}{\log n}\to1\quad\text{a.s.}$$`,
      idea: String.raw`By symmetry the rank of $X_k$ among $X_1,\dots,X_k$ is uniform and independent of the relative order of the earlier ones, which gives the independence and $P(A_k)=1/k$. Then $ER_n=\sum_{k\le n}1/k\sim\log n$, and Theorem 2.3.9 (independent events are in particular pairwise independent) says $R_n/ER_n\to1$ a.s.`,
      caption: String.raw`Top: 100 seeded uniforms, records in gold, the running maximum as a staircase. Bottom: $R_n/\log n$ for 20 seeded sequences up to $n=10^{10}$, simulated exactly by jumping from record to record (after a record at level $m$ the wait for the next is geometric with success probability $1-m$). The blue curve is $ER_n/\log n=H_n/\log n$ with a $\pm2$ s.d. band. Convergence is real but slow: the fluctuations shrink only like $1/\sqrt{\log n}$.`,
      deps: ['prob-2.3.1', 'prob-2.2.1', 'prob-2.3.9'],
      tags: ['records', 'law of large numbers'],
      viz(v) {
        const nS = v.slider('top panel: $n$', 10, 100, 100, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const NMAX = 1e10, grid = logGrid(3, NMAX, 300);
        const T = v.stage({ x: [0, 101], y: [0, 1.06], height: 220, full: true, axes: 'box', gutter: true, xlabel: '$k$', ylabel: '$X_k$', title: 'records of a seeded uniform sequence' });
        const B = v.stage({ x: [3, NMAX], y: [0, 3], xlog: true, height: 280, full: true, axes: 'box', gutter: true, xlabel: '$n$', title: '$R_n/\\log n$' });
        let cache = null, st = null;
        v.render(() => {
          if (!cache || cache.seed !== seed) {
            const r = v.rng(seed * 3 + 1), xs = Array.from({ length: 100 }, () => r());
            const rows = [];
            for (let i = 0; i < 20; i++) {
              const times = [1]; let k = 1, qq = 1 - r();
              while (k <= NMAX) { const g = Math.max(1, Math.ceil(Math.log(1 - r()) / Math.log1p(-qq))); k += g; if (k > NMAX) break; times.push(k); qq *= 1 - r(); }
              let j = 0; rows.push(grid.map((n) => { while (j < times.length && times[j] <= n) j++; return j / Math.log(n); }));
            }
            cache = { seed, xs, rows };
          }
          const n = nS.value, xs = cache.xs.slice(0, n); let m = -1; const rec = [], stair = [];
          xs.forEach((x, i) => { if (x > m) { rec.push([i + 1, x]); m = x; } stair.push([i + 1, m], [i + 2, m]); });
          T.path(stair, { color: 'gold', width: 1.4, alpha: 0.6 });
          T.dots(xs.map((x, i) => [i + 1, x]), { r: 2.6, color: 'accent', alpha: 0.6 });
          T.dots(rec, { r: 5, color: 'gold' });
          B.hline(1, { color: 'green', width: 1.6, dash: [6, 4] });
          const mu = grid.map((g) => harm(g) / Math.log(g)), sd = grid.map((g) => Math.sqrt(Math.max(0, harm(g) - 1.6449 + 1 / g)) / Math.log(g));
          B.poly([...grid.map((g, k) => [g, Math.min(3, mu[k] + 2 * sd[k])]), ...grid.map((g, k) => [g, Math.max(0, mu[k] - 2 * sd[k])]).reverse()], { fill: 'accent', fillAlpha: 0.12, stroke: false });
          cache.rows.forEach((row) => B.path(grid.map((g, k) => [g, Math.min(3.1, row[k])]), { color: 'gold', width: 1.1, alpha: 0.6 }));
          B.path(grid.map((g, k) => [g, mu[k]]), { color: 'accent', width: 2.4 });
          v.legend([['gold', 'records / $R_n/\\log n$ paths'], ['accent', '$H_n/\\log n\\pm2$ s.d.'], ['green', 'limit $1$', { dash: true }]]);
          const fin = cache.rows.map((row) => Math.round(row[row.length - 1] * Math.log(NMAX)));
          st = { rec: rec.length, n, H: harm(n), fin };
        });
        v.readout(() => st && `Top: $R_{${st.n}}=${st.rec}$ records, $ER_{${st.n}}=H_{${st.n}}=${v.fix(st.H, 2)}$. Bottom, at $n=10^{10}$: $R_n$ ranges over $${Math.min(...st.fin)}$–$${Math.max(...st.fin)}$ with mean $${v.fix(st.fin.reduce((a, b) => a + b, 0) / st.fin.length, 1)}$; $\\log n=23.0$, $H_n=23.6$.`);
      },
    },
    {
      num: '2.3.12',
      kind: 'Theorem',
      name: 'Longest head run is about log₂ n',
      statement: String.raw`Toss a fair coin repeatedly. Let $\ell_n$ be the length of the run of heads ending at time $n$ ($0$ if toss $n$ is tails) and $L_n=\max_{m\le n}\ell_m$ the longest run of heads in the first $n$ tosses. Then
$$\limsup_{n\to\infty}\frac{\ell_n}{\log_2n}=1\quad\text{and}\quad\frac{L_n}{\log_2n}\to1\qquad\text{a.s.}$$`,
      idea: String.raw`Upper bound: $P(\ell_n\ge(1+\eps)\log_2n)\le n^{-(1+\eps)}$ is summable, so by Borel–Cantelli (2.3.1) $\ell_n<(1+\eps)\log_2n$ eventually, and the same then holds for $L_n$. Lower bound: cut the tosses into disjoint blocks of length $k_n\approx(1-\eps)\log_2n$; each block is all heads with probability $2^{-k_n}\approx n^{-(1-\eps)}$, independently. Among the $n/k_n$ blocks up to time $n$ one is all heads except with probability $\le\exp(-n^{\eps}/k_n)$, which is summable; the second Borel–Cantelli lemma (2.3.7) gives the $\limsup$ for $\ell_n$.`,
      caption: String.raw`Top: the first $n$ seeded tosses, read row by row (blue = heads); the longest head run is outlined in gold. Bottom: $L_n/\log_2n$ for 12 seeded sequences up to $n=2^{20}\approx10^6$, together with the band $1\pm2/\log_2n$ (the run length fluctuates by $O(1)$ around $\log_2 n$, so the ratio approaches $1$ only like $1/\log n$).`,
      deps: ['prob-2.3.1', 'prob-2.3.7'],
      tags: ['borel-cantelli', 'runs'],
      viz(v) {
        const nS = v.slider('top panel: $n$ tosses', 60, 1200, 600, { step: 20, int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const NMAX = 2 ** 20, ROWS = 12, grid = logGrid(4, NMAX, 240);
        const T = v.stage({ x: [0, 60], y: [0, 10], height: 220, full: true, axes: false, title: 'tosses (blue = heads), longest head run outlined' });
        const B = v.stage({ x: [4, NMAX], y: [0, 2.2], xlog: true, height: 260, full: true, axes: 'box', gutter: true, xlabel: '$n$', title: '$L_n/\\log_2 n$' });
        let cache = null, st = null;
        v.render(() => {
          if (!cache || cache.seed !== seed) {
            const r = v.rng(seed * 5 + 3), rows = [];
            let first = null;
            for (let i = 0; i < ROWS; i++) {
              const out = []; let run = 0, L = 0, j = 0, word = 0, bits = 0; const keep = i === 0 ? new Uint8Array(1200) : null;
              for (let n = 1; n <= NMAX; n++) {
                if (!bits) { word = Math.floor(r() * 4294967296); bits = 32; }
                const h = word & 1; word >>>= 1; bits--;
                if (keep && n <= 1200) keep[n - 1] = h;
                run = h ? run + 1 : 0; if (run > L) L = run;
                if (n === grid[j]) { out.push(L / Math.log2(n)); j++; }
              }
              rows.push(out); if (keep) first = keep;
            }
            cache = { seed, rows, first };
          }
          const n = nS.value, cols = 60, nr = Math.ceil(n / cols), f = cache.first;
          T.setView([0, cols], [0, Math.max(nr, 6)]);
          let best = 0, bestEnd = 0, run = 0;
          for (let i = 0; i < n; i++) { run = f[i] ? run + 1 : 0; if (run > best) { best = run; bestEnd = i; } }
          const top = Math.max(nr, 6);
          for (let i = 0; i < n; i++) { const c = i % cols, rr = Math.floor(i / cols); T.rect(c + 0.08, top - rr - 0.92, c + 0.92, top - rr - 0.08, { fill: f[i] ? 'accent' : 'faint', fillAlpha: f[i] ? 0.85 : 0.35, stroke: false, radius: 2 }); }
          for (let i = bestEnd - best + 1; i <= bestEnd; i++) { const c = i % cols, rr = Math.floor(i / cols); T.rect(c, top - rr - 1, c + 1, top - rr, { color: 'gold', width: 2.4, fill: false }); }
          B.poly([...grid.map((g) => [g, Math.min(2.2, 1 + 2 / Math.log2(g))]), ...grid.map((g) => [g, Math.max(0, 1 - 2 / Math.log2(g))]).reverse()], { fill: 'green', fillAlpha: 0.1, stroke: false });
          B.hline(1, { color: 'green', width: 1.6, dash: [6, 4] });
          cache.rows.forEach((row) => B.path(grid.map((g, k) => [g, row[k]]), { color: 'accent', width: 1.2, alpha: 0.6 }));
          v.legend([['accent', '$L_n/\\log_2 n$, 12 sequences'], ['green', '$1\\pm2/\\log_2 n$', { area: true }]]);
          const fin = cache.rows.map((row) => Math.round(row[row.length - 1] * 20));
          st = { n, best, lg: Math.log2(n), fin };
        });
        v.readout(() => st && `Top: longest head run in $${st.n}$ tosses is $${st.best}$, $\\ \\log_2 ${st.n}=${v.fix(st.lg, 2)}$. Bottom: at $n=2^{20}$ the 12 longest runs are ${st.fin.join(', ')} (against $\\log_2n=20$).`);
      },
    },
    // ======================================================================== §2.4 Strong law of large numbers
    {
      num: '2.4.1',
      kind: 'Theorem',
      name: 'Strong law of large numbers (Etemadi)',
      credit: 'Kolmogorov, 1933; Etemadi, 1981',
      statement: String.raw`Let $X_1,X_2,\dots$ be **pairwise independent** and identically distributed with $E|X_i|<\infty$. Let $\mu=EX_i$ and $S_n=X_1+\dots+X_n$. Then
$$\frac{S_n}{n}\to\mu\quad\text{almost surely.}$$`,
      idea: String.raw`Treat $X^+$ and $X^-$ separately, so assume $X_i\ge0$. Truncate: $Y_k=X_k1(|X_k|\le k)$; by Lemma 2.4.2 it suffices to show $T_n/n\to\mu$ for $T_n=Y_1+\dots+Y_n$. Pairwise independence is enough for variances to add, and Lemma 2.4.3 bounds $\sum_k\operatorname{var}(Y_k)/k^2\le4E|X_1|$. Along the geometric times $k(n)=[\alpha^n]$ Chebyshev and Borel–Cantelli (2.3.1) give $T_{k(n)}/k(n)\to\mu$; since $T_m$ is increasing, for $k(n)\le m<k(n+1)$ the ratio is trapped between $\mu/\alpha$ and $\alpha\mu$ asymptotically. Let $\alpha\downarrow1$.`,
      caption: String.raw`Forty seeded running averages $S_n/n$ (log scale in $n$) with the band between their 10% and 90% quantiles. Pareto steps with $\alpha=1.5$ have mean $3$ and infinite variance; the averages still close in on $\mu$. The pairwise option uses the same Pareto law but $X_a=G(X+aY\bmod q)$ on $\mathbb Z_q^2$, a sequence where any two terms are independent but two of them determine all the rest: the strong law holds anyway. Cauchy steps have no mean and the averages never settle.`,
      deps: ['prob-2.3.1', 'prob-1.6.4', 'prob-2.1.3a', 'prob-2.2.3a', 'prob-2.4.2', 'prob-2.4.3'],
      see: ['prob-2.5.10', 'stat-1.5'],
      tags: ['law of large numbers'],
      viz(v) {
        const q = Q_PRIME, al = 1.5;
        const pairMean = (() => { let s = 0; for (let z = 0; z < q; z++) s += ((z + 0.5) / q) ** (-1 / al); return s / q; })();
        const LAWS = {
          par: { label: 'Pareto $\\alpha=1.5$', mu: 3, y: [0, 9] },
          pair: { label: 'Pareto, pairwise only', mu: pairMean, y: [0, 9] },
          exp: { label: 'exponential', mu: 1, y: [0, 3] },
          cau: { label: 'Cauchy', mu: NaN, y: [-6, 6] },
        };
        const law = v.select('steps', Object.entries(LAWS).map(([value, o]) => ({ value, label: o.label })), 'par');
        let seed = 1; v.button('Resample', () => { seed++; });
        const NMAX = 100000, P = 40, grid = logGrid(1, NMAX, 220);
        const S = v.stage({ x: [1, NMAX], y: [0, 9], xlog: true, height: 360, full: true, axes: 'box', gutter: true, xlabel: '$n$', title: 'running averages $S_n/n$' });
        let cache = null, st = null;
        v.render(() => {
          const Lw = LAWS[law.value], key = law.value + seed;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 41 + 3), paths = [];
            for (let p = 0; p < P; p++) {
              let draw;
              if (law.value === 'par') draw = () => (1 - r()) ** (-1 / al);
              else if (law.value === 'exp') draw = () => -Math.log(1 - r());
              else if (law.value === 'cau') draw = () => Math.tan(Math.PI * (r() - 0.5));
              else { const x = Math.floor(r() * q), y = Math.floor(r() * q); draw = (a) => (((x + a * y) % q + 0.5) / q) ** (-1 / al); }
              paths.push(runAvg(draw, grid));
            }
            const qs = grid.map((_, k) => { const col = paths.map((pp) => pp[k]).sort((a, b) => a - b); return [col[4], col[35]]; });
            cache = { key, paths, qs };
          }
          S.setView(null, Lw.y);
          S.poly([...grid.map((g, k) => [g, cache.qs[k][1]]), ...grid.map((g, k) => [g, cache.qs[k][0]]).reverse()], { fill: 'accent', fillAlpha: 0.13, stroke: false });
          cache.paths.forEach((pp) => S.path(grid.map((g, k) => [g, clampN(pp[k], Lw.y[0] - 1, Lw.y[1] + 1)]), { color: law.value === 'cau' ? 'red' : 'accent', width: 1, alpha: 0.5 }));
          if (isFinite(Lw.mu)) S.hline(Lw.mu, { color: 'green', width: 2, dash: [7, 4] });
          else cornerIn(S, 'no mean: nothing to converge to', 'tr', { color: 'red' });
          v.legend([[law.value === 'cau' ? 'red' : 'accent', '$S_n/n$, 40 seeded runs'], ['accent', '10%–90% band', { area: true }], ['green', '$\\mu$', { dash: true }]]);
          const w = (n) => { const k = grid.indexOf(n); return cache.qs[k][1] - cache.qs[k][0]; };
          st = { w3: w(1000), w4: w(10000), w5: w(100000), mu: Lw.mu };
        });
        v.readout(() => st && (isFinite(st.mu) ? `$\\mu=${v.fix(st.mu, 4)}$. ` : '') + `Width of the 10%–90% band: $${v.fix(st.w3, 3)}$ at $n=10^3$, $${v.fix(st.w4, 3)}$ at $10^4$, $${v.fix(st.w5, 3)}$ at $10^5$.` + (law.value === 'cau' ? ' For Cauchy steps $S_n/n$ is again Cauchy: the band never shrinks.' : law.value === 'exp' ? ' (Finite variance: width $\\propto n^{-1/2}$.)' : ' (Infinite variance: the width shrinks more slowly, like $n^{-1/3}$, but it does shrink.)'));
      },
    },
    {
      num: '2.4.2',
      kind: 'Lemma',
      name: 'Truncation at level k suffices for the strong law',
      statement: String.raw`Let $X_1,X_2,\dots$ be identically distributed with $E|X_1|<\infty$, put $Y_k=X_k1(|X_k|\le k)$ and $T_n=Y_1+\dots+Y_n$. Then $P(X_k\ne Y_k\text{ i.o.})=0$; hence $S_n/n\to\mu$ a.s. as soon as $T_n/n\to\mu$ a.s.`,
      idea: String.raw`$\sum_kP(|X_k|>k)=\sum_kP(|X_1|>k)\le\int_0^\infty P(|X_1|>t)\,dt=E|X_1|<\infty$, so by Borel–Cantelli (2.3.1) $X_k=Y_k$ for all $k\ge K(\omega)$, with $K(\omega)<\infty$ a.s. Then $|S_n-T_n|$ is eventually a constant $C(\omega)$ and $(S_n-T_n)/n\to0$. No independence is needed.`,
      caption: String.raw`Pareto variables with $P(X>x)=x^{-\alpha}$ ($x\ge1$). Left: each row is a seeded $\omega$; a dot at $k$ marks a time where truncation bites, $X_k>k$ (simulated exactly up to $k=10^8$). For $\alpha>1$ the dots stop; drag $\alpha$ below $1$ ($E|X|=\infty$) and they never do. Right: $\sum_{k\le n}P(X>k)$ (blue) against $E|X|=\alpha/(\alpha-1)$ (green), and the average count over 200 rows (gold).`,
      deps: ['prob-2.3.1', 'prob-2.2.13'],
      see: ['prob-2.4.1'],
      tags: ['truncation'],
      viz(v) {
        const aS = v.slider('tail index $\\alpha$', 0.7, 2.5, 1.3, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const NMAX = 1e8, ROWS = 30, RR = 200, grid = logGrid(1, NMAX, 200);
        const L = v.stage({ x: [1, NMAX], y: [0.3, ROWS + 0.7], xlog: true, height: 320, weight: 1.4, axes: 'box', gutter: true, xlabel: '$k$', yticks: [], title: 'times with $X_k\\ne Y_k$ (i.e. $X_k>k$)' });
        const R = v.stage({ x: [1, NMAX], y: [0, 6], xlog: true, height: 320, axes: 'box', gutter: true, xlabel: '$n$', title: 'expected and observed counts' });
        let cache = null, st = null;
        v.render(() => {
          const a = aS.value, key = a + '|' + seed, p = (k) => k ** -a;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 19 + 7), rows = [];
            for (let i = 0; i < RR; i++) rows.push(bernTimes(p, 1, NMAX, r));
            const E = []; let acc = 0, j = 0;
            for (let k = 1; k <= NMAX && j < grid.length; k++) { acc += p(k); if (k === grid[j]) { E.push(acc); j++; } if (k > 2e6 && j < grid.length) { // integral tail beyond 2e6
                const k0 = k; for (; j < grid.length; j++) { const g = grid[j]; E.push(acc + (a === 1 ? Math.log(g / k0) : (g ** (1 - a) - k0 ** (1 - a)) / (1 - a))); } break; } }
            const obs = grid.map((g) => rows.reduce((t, rw) => t + rw.filter((k) => k <= g).length, 0) / RR);
            cache = { key, rows, E, obs };
          }
          cache.rows.slice(0, ROWS).forEach((rw, i) => { L.dots(rw.map((k) => [k, i + 1]), { r: 2, color: a > 1 ? 'accent' : 'red' }); if (a > 1 && rw.length) L.dot(rw[rw.length - 1], i + 1, { r: 3.4, color: 'green', hollow: true }); });
          const EX = a > 1 ? a / (a - 1) : Infinity, top = Math.max(isFinite(EX) ? EX : 0, cache.E[cache.E.length - 1], 2) * 1.12;
          R.setView(null, [0, Math.min(top, 60)]);
          if (isFinite(EX)) R.hline(EX, { color: 'green', width: 2, dash: [7, 4] });
          R.path(grid.map((g, k) => [g, cache.E[k]]), { color: 'accent', width: 2.4 });
          R.path(grid.map((g, k) => [g, cache.obs[k]]), { color: 'gold', width: 1.8 });
          v.legend([['accent', '$\\sum_{k\\le n}P(|X|>k)$'], ['gold', 'average count'], ['green', '$E|X|$', { dash: true }]]);
          const late = cache.rows.filter((rw) => rw.some((k) => k > 1e4)).length / RR;
          st = { a, EX, sum: cache.E[cache.E.length - 1], late };
        });
        v.readout(() => st && `$\\sum_{k\\le10^8}P(|X|>k)=${v.fix(st.sum, 3)}$` + (isFinite(st.EX) ? `$\\le E|X|=${v.fix(st.EX, 3)}$` : ', unbounded as $n\\to\\infty$ since $E|X|=\\infty$') + `. Rows where truncation still bites after $k=10^4$: $${v.fix(st.late * 100, 1)}\\%$.`);
      },
    },
    {
      num: '2.4.3',
      kind: 'Lemma',
      name: 'Σ var(Yₖ)/k² ≤ 4E|X₁|',
      statement: String.raw`With $Y_k=X_k1(|X_k|\le k)$ as in Lemma 2.4.2 and $E|X_1|<\infty$,
$$\sum_{k=1}^\infty\frac{\operatorname{var}(Y_k)}{k^2}\le4E|X_1|<\infty.$$`,
      idea: String.raw`Bound the variance by the second moment and use the tail formula (Lemma 2.2.13): $EY_k^2\le\int_0^k2y\,P(|X_1|>y)\,dy$. Summing and exchanging sum and integral (Fubini for nonnegative terms),
$$\sum_k\frac{EY_k^2}{k^2}\le\int_0^\infty\Big(2y\sum_{k>y}k^{-2}\Big)P(|X_1|>y)\,dy\le4\int_0^\infty P(|X_1|>y)\,dy,$$
where the weight in brackets is at most $4$ by Lemma 2.4.4.`,
      caption: String.raw`Left: partial sums of $\operatorname{var}(Y_k)/k^2$ (blue) and of $EY_k^2/k^2$ (orange), computed exactly, level off below the line $4E|X|$ (green). Right: the integrand of the proof, $w(y)P(|X|>y)$ with $w(y)=2y\sum_{k>y}k^{-2}$ (orange, area $\ge\sum EY_k^2/k^2$), under $4P(|X|>y)$ (green, area $4E|X|$). Make the Pareto tail heavier ($\alpha\downarrow1$): $E|X|$ grows and the sums with it; for the Cauchy law $E|X|=\infty$ and the sums diverge like $\log n$.`,
      deps: ['prob-2.2.13', 'prob-2.4.4'],
      see: ['prob-2.4.1'],
      tags: ['truncation', 'variance'],
      viz(v) {
        const law = v.select('law of $X$', [{ value: 'par', label: 'Pareto' }, { value: 'exp', label: 'exponential' }, { value: 'cau', label: 'Cauchy' }], 'par');
        const aS = v.slider('Pareto $\\alpha$', 1.05, 3, 1.5, { step: 0.05 });
        const NMAX = 1e6, grid = logGrid(1, NMAX, 160);
        const L = v.stage({ x: [1, NMAX], y: [0, 10], xlog: true, height: 320, weight: 1.2, axes: 'box', gutter: true, xlabel: '$n$', title: 'partial sums up to $n$' });
        const R = v.stage({ x: [0, 12], y: [0, 4.4], height: 320, axes: 'box', gutter: true, xlabel: '$y$', title: 'the integrand of the proof' });
        let st = null;
        v.render(() => {
          const a = aS.value, lw = law.value;
          aS.el.hidden = lw !== 'par';
          let m2, m1, tail, EX;
          if (lw === 'par') {
            tail = (y) => (y < 1 ? 1 : y ** -a); EX = a / (a - 1);
            m2 = (k) => (k < 1 ? 0 : Math.abs(a - 2) < 1e-9 ? 2 * Math.log(k) : (a / (2 - a)) * (k ** (2 - a) - 1));
            m1 = (k) => (k < 1 ? 0 : (a / (1 - a)) * (k ** (1 - a) - 1));
          } else if (lw === 'exp') {
            tail = (y) => Math.exp(-y); EX = 1;
            m2 = (k) => 2 - Math.exp(-k) * (k * k + 2 * k + 2); m1 = (k) => 1 - Math.exp(-k) * (k + 1);
          } else {
            tail = (y) => 1 - (2 / Math.PI) * Math.atan(y); EX = Infinity;
            m2 = (k) => (2 / Math.PI) * (k - Math.atan(k)); m1 = () => 0;
          }
          const sv = [], s2 = []; let av = 0, a2 = 0, j = 0;
          for (let k = 1; k <= NMAX; k++) { const e2 = m2(k), e1 = m1(k); av += (e2 - e1 * e1) / (k * k); a2 += e2 / (k * k); if (k === grid[j]) { sv.push([k, av]); s2.push([k, a2]); j++; } }
          const top = Math.max(isFinite(EX) ? 4 * EX : 0, a2) * 1.12;
          L.setView(null, [0, top]);
          if (isFinite(EX)) L.hline(4 * EX, { color: 'green', width: 2, dash: [7, 4] });
          L.path(s2, { color: 'orange', width: 2 });
          L.path(sv, { color: 'accent', width: 2.6 });
          if (isFinite(EX)) L.tex('4E|X|', 3, 4 * EX, { color: 'green', size: 13, baseline: 'bottom', dy: -3 });
          const w = (y) => (y <= 0 ? 0 : 2 * y * v.M.trigamma(Math.floor(y) + 1));
          R.setView([0, lw === 'exp' ? 8 : 12], [0, 4.4]);
          R.fn((y) => 4 * tail(y), { color: 'green', width: 2, fill: 'green', fillAlpha: 0.12, n: 600 });
          R.fn((y) => w(y) * tail(y), { color: 'orange', width: 2, fill: 'orange', fillAlpha: 0.3, n: 1200 });
          R.fn(w, { color: 'muted', width: 1, dash: [4, 4], n: 1200 });
          R.tex('w(y)', 10.2, 2.25, { color: 'muted', size: 12 });
          v.legend([['accent', '$\\sum\\operatorname{var}(Y_k)/k^2$'], ['orange', '$\\sum EY_k^2/k^2$ / $w(y)P(|X|>y)$'], ['green', '$4E|X|$ / $4P(|X|>y)$']]);
          const I = isFinite(EX) ? v.M.integrate((y) => w(y) * tail(y), 1e-9, 60, 6000) + (lw === 'par' ? v.M.integrate((y) => 2 * y ** -a, 60, 1e5, 4000) : 0) : Infinity;
          st = { sv: av, s2: a2, I, EX };
        });
        v.readout(() => st && `$\\sum_{k\\le10^6}\\operatorname{var}(Y_k)/k^2=${v.fix(st.sv, 3)}\\le\\sum EY_k^2/k^2=${v.fix(st.s2, 3)}$` + (isFinite(st.EX) ? `$\\le\\int w\\,P(|X|>y)\\,dy\\approx${v.fix(st.I, 3)}\\le4E|X|=${v.fix(4 * st.EX, 3)}$.` : '; with $E|X|=\\infty$ the partial sums grow without bound.'));
      },
    },
    {
      num: '2.4.4',
      kind: 'Lemma',
      name: '2y Σ_{k>y} k⁻² ≤ 4',
      statement: String.raw`For every $y\ge0$,
$$2y\sum_{k>y}\frac1{k^2}\le4,$$
the sum running over integers $k>y$.`,
      idea: String.raw`For $y\ge1$, compare the sum with an integral: with $m=\lfloor y\rfloor\ge1$, $\sum_{k>y}k^{-2}\le\sum_{k\ge m+1}k^{-2}\le\int_m^\infty x^{-2}\,dx=1/m$, and $y<m+1\le2m$, so the product is at most $2(m+1)/m\le4$. For $0\le y<1$ the sum is $\pi^2/6<2$ and $2y<2$. The true supremum is $\pi^2/3\approx3.29$, approached as $y\uparrow1$; the limit at infinity is $2$.`,
      caption: String.raw`Left: the sawtooth $g(y)=2y\sum_{k>y}k^{-2}$; it jumps down each time $y$ passes an integer (one term leaves the sum) and never reaches the line $4$. Drag the gold point. Right: for that $y$, the terms $k^{-2}$, $k>y$, as bars under the curve $x^{-2}$; the bars fit under the curve from $\lfloor y\rfloor$ on, which is the integral comparison.`,
      deps: [],
      see: ['prob-2.4.3'],
      tags: ['estimates'],
      viz(v) {
        const g = (y) => (y <= 0 ? 0 : 2 * y * v.M.trigamma(Math.floor(y) + 1));
        const L = v.stage({ x: [0, 12], y: [0, 4.5], height: 320, weight: 1.3, axes: 'box', gutter: true, xlabel: '$y$', title: '$g(y)=2y\\sum_{k>y}k^{-2}$' });
        const R = v.stage({ x: [0, 14], y: [0, 1.1], height: 320, axes: 'box', gutter: true, xlabel: '$k$', title: 'terms $k^{-2}$, $k>y$, under $x^{-2}$' });
        const H = L.handle(3.6, g(3.6), { color: 'gold', label: 'y', constrain: (x) => { const y = clampN(x, 0.02, 11.98); return [y, g(y)]; } });
        let st = null;
        v.render(() => {
          L.hband(4, 4.5, { color: 'red', alpha: 0.1 });
          L.hline(4, { color: 'red', width: 2 }); L.hline(2, { color: 'muted', dash: [5, 4], width: 1 });
          L.hline(Math.PI ** 2 / 3, { color: 'orange', dash: [3, 3], width: 1 });
          L.tex('4', 11.6, 4.12, { color: 'red', size: 13 }); L.tex('\\pi^2/3', 10.6, 3.47, { color: 'orange', size: 12 }); L.tex('2', 11.6, 2.15, { color: 'muted', size: 12 });
          for (let m = 0; m < 12; m++) L.path(Array.from({ length: 41 }, (_, i) => { const y = m + 1e-6 + (i / 40) * (1 - 2e-6); return [y, g(y)]; }), { color: 'accent', width: 2.4 });
          const y = H.x, m = Math.floor(y);
          L.vline(y, { color: 'gold', width: 1, dash: [3, 3] });
          const vals = []; for (let k = m + 1; k <= 14; k++) vals.push(k);
          vals.forEach((k) => R.rect(k - 1, 0, k, 1 / (k * k), { fill: 'accent', fillAlpha: 0.45, color: 'accent', width: 1 }));
          R.fn((x) => 1 / (x * x), { domain: [Math.max(0.95, m), 14], color: 'orange', width: 2.2 });
          if (m >= 1) R.between((x) => 1 / (x * x), () => 0, m, 14, { fill: 'orange', fillAlpha: 0.1 });
          R.vline(y, { color: 'gold', width: 1.5, dash: [4, 3] });
          v.legend([['accent', 'terms $k^{-2}$ (bar on $[k-1,k]$)', { area: true }], ['orange', '$x^{-2}$, area $1/\\lfloor y\\rfloor$']]);
          st = { y, g: g(y), sum: v.M.trigamma(m + 1), m };
        });
        v.readout(() => st && `$y=${v.fix(st.y, 3)}$: $\\sum_{k>y}k^{-2}=${v.fix(st.sum, 4)}$, $\\ g(y)=${v.fix(st.g, 4)}\\le4$.` + (st.m >= 1 ? ` Integral bound: $\\sum_{k>y}k^{-2}\\le1/\\lfloor y\\rfloor=${v.fix(1 / st.m, 4)}$, giving $g\\le2y/\\lfloor y\\rfloor=${v.fix((2 * st.y) / st.m, 3)}$.` : ' Here $y<1$: $g=2y\\,\\pi^2/6<\\pi^2/3$.'));
      },
    },
    {
      num: '2.4.5',
      kind: 'Theorem',
      name: 'Strong law with infinite mean',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. with $EX_i^+=\infty$ and $EX_i^-<\infty$. Then $S_n/n\to\infty$ almost surely.`,
      idea: String.raw`Cap the variables: for $M>0$ let $X_i^M=X_i\wedge M$. These are i.i.d. with finite mean, so the strong law (2.4.1) gives $S_n^M/n\to EX_1^M$, and $S_n\ge S_n^M$. Hence $\liminf S_n/n\ge EX_1^M$ for every $M$, and $EX_1^M\uparrow\infty$ by monotone convergence.`,
      caption: String.raw`Thirty seeded running averages of Pareto variables, $P(X>x)=x^{-\alpha}$ for $x\ge1$, on log–log axes. The dashed lines are the capped means $E(X\wedge M)$ for $M=10,10^2,10^3$: each average eventually stays above every one of them. For $\alpha<1$ the averages climb like $n^{1/\alpha-1}$. Push $\alpha$ above $1$: the mean $\alpha/(\alpha-1)$ becomes finite (green) and the climb stops.`,
      deps: ['prob-2.4.1', 'prob-1.6.6'],
      tags: ['law of large numbers'],
      viz(v) {
        const aS = v.slider('tail index $\\alpha$', 0.5, 1.6, 0.8, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const NMAX = 100000, P = 30, grid = logGrid(1, NMAX, 200);
        const S = v.stage({ x: [1, NMAX], y: [1, 1e5], xlog: true, ylog: true, height: 360, full: true, axes: 'box', gutter: true, xlabel: '$n$', title: 'running averages $S_n/n$ (log–log)' });
        let cache = null, st = null;
        v.render(() => {
          const a = aS.value, key = a + '|' + seed;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 29 + 11), paths = [];
            for (let p = 0; p < P; p++) paths.push(runAvg(() => (1 - r()) ** (-1 / a), grid));
            cache = { key, paths };
          }
          const EM = (M) => (Math.abs(a - 1) < 1e-9 ? 1 + Math.log(M) : 1 + (M ** (1 - a) - 1) / (1 - a));
          const mx = Math.max(...cache.paths.map((pp) => pp[pp.length - 1]));
          S.setView(null, [1, Math.max(30, mx * 3)]);
          [10, 100, 1000].forEach((M, i) => { S.hline(EM(M), { color: ['purple', 'orange', 'red'][i], dash: [6, 4], width: 1.4 }); S.text(`M = ${M}`, 7e4, EM(M), { color: ['purple', 'orange', 'red'][i], size: 11, align: 'right', baseline: 'top', dy: 3, plate: true }); });
          if (a > 1) S.hline(a / (a - 1), { color: 'green', width: 2.2 });
          cache.paths.forEach((pp) => S.path(grid.map((g, k) => [g, pp[k]]), { color: 'accent', width: 1, alpha: 0.5 }));
          v.legend([['accent', '$S_n/n$'], ['purple', '$E(X\\wedge M)$', { dash: true }], ...(a > 1 ? [['green', '$EX=\\alpha/(\\alpha-1)$']] : [])]);
          const fin = cache.paths.map((pp) => pp[pp.length - 1]).sort((x, y) => x - y);
          st = { a, med: fin[15], e3: EM(1000), above: fin.filter((x) => x > EM(1000)).length };
        });
        v.readout(() => st && `Median of $S_{10^5}/10^5$: $${v.fix(st.med, 1)}$; $\\ E(X\\wedge10^3)=${v.fix(st.e3, 2)}$, exceeded by ${st.above} of 30 paths. ` + (st.a < 1 ? `$EX=\\infty$: $S_n/n$ grows like $n^{1/\\alpha-1}$ times a random factor ($n^{1/\\alpha-1}=${v.fix(1e5 ** (1 / st.a - 1), 0)}$ at $n=10^5$).` : st.a > 1 ? `$EX=${v.fix(st.a / (st.a - 1), 3)}<\\infty$: back to the ordinary strong law.` : ''));
      },
    },
    {
      num: '2.4.7',
      kind: 'Theorem',
      name: 'Strong law for renewal processes',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. with $0<X_i<\infty$, put $T_n=X_1+\dots+X_n$ and $N_t=\sup\{n:T_n\le t\}$. If $EX_1=\mu\le\infty$, then
$$\frac{N_t}{t}\to\frac1\mu\quad\text{a.s. as }t\to\infty\qquad(1/\infty=0).$$`,
      idea: String.raw`The strong law (2.4.1, or 2.4.5 when $\mu=\infty$) gives $T_n/n\to\mu$. Since $N_t\to\infty$, also $T(N_t)/N_t\to\mu$ and $T(N_t+1)/(N_t+1)\to\mu$. The definition of $N_t$ sandwiches $T(N_t)\le t<T(N_t+1)$; divide by $N_t$ and both ends tend to $\mu$, so $t/N_t\to\mu$.`,
      caption: String.raw`Think of light bulbs replaced on failure. Top: three seeded runs, each bulb's life a coloured segment, up to the time $t$ you drag; $N_t$ counts the replacements so far. Bottom: $N_t/t$ for 20 runs up to $t=10^5$, approaching $1/\mu$ (green). All laws but the last have $\mu=1$; the Pareto law with $\alpha=0.8$ has $\mu=\infty$ and the replacement rate dies out.`,
      deps: ['prob-2.4.1', 'prob-2.4.5'],
      see: ['prob-2.6.1'],
      tags: ['renewal', 'law of large numbers'],
      viz(v) {
        const LAWS = {
          unif: { label: 'uniform $(0,2)$', mu: 1, draw: (r) => 2 * (1 - r()) },
          exp: { label: 'exponential', mu: 1, draw: (r) => -Math.log(1 - r()) },
          par: { label: 'Pareto $\\alpha=1.5$', mu: 1, draw: (r) => (1 - r()) ** (-1 / 1.5) / 3 },
          inf: { label: 'Pareto $\\alpha=0.8$ ($\\mu=\\infty$)', mu: Infinity, draw: (r) => (1 - r()) ** (-1 / 0.8) / 4 },
        };
        const law = v.select('lifetimes', Object.entries(LAWS).map(([value, o]) => ({ value, label: o.label })), 'unif');
        let seed = 1; v.button('Resample', () => { seed++; });
        const TMAX = 1e5, grid = logGrid(1, TMAX, 200);
        const T = v.stage({ x: [0, 20], y: [0.3, 3.7], height: 170, full: true, axes: 'box', gutter: true, xlabel: '$t$', yticks: [], title: 'bulb lifetimes laid end to end' });
        const B = v.stage({ x: [1, TMAX], y: [0, 2], xlog: true, height: 260, full: true, axes: 'box', gutter: true, xlabel: '$t$', title: '$N_t/t$' });
        const H = T.handle(12, 0.3, { color: 'gold', label: 't', labelPos: 'e', constrain: (x) => [clampN(x, 0.2, 19.8), 0.3] });
        let cache = null, st = null;
        v.render(() => {
          const Lw = LAWS[law.value], key = law.value + seed;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 61 + 9), paths = [], tops = [];
            for (let p = 0; p < 20; p++) {
              const out = []; let t = 0, n = 0, j = 0; const seg = [];
              while (j < grid.length) { const x = Lw.draw(r); const tn = t + x; while (j < grid.length && grid[j] < tn) { out.push(n / grid[j]); j++; } if (p < 3 && t < 20) seg.push([t, tn]); t = tn; n++; }
              paths.push(out); if (p < 3) tops.push(seg);
            }
            cache = { key, paths, tops };
          }
          const t = H.x, cols = ['accent', 'teal'], counts = [];
          cache.tops.forEach((seg, i) => {
            const y = 3 - i; let c = 0;
            seg.forEach(([a, b], k) => { if (a > 20) return; const on = a <= t; if (b <= t) c++; T.rect(a, y - 0.32, Math.min(b, 20), y + 0.32, { fill: cols[k % 2], fillAlpha: on ? 0.75 : 0.18, color: 'panel', width: 1 }); });
            counts.push(c);
            T.text(`N = ${c}`, Math.min(t + 0.25, 18.6), y + 0.43, { size: 11, color: 'ink' });
          });
          T.vline(t, { color: 'gold', width: 2 });
          if (isFinite(Lw.mu)) B.hline(1 / Lw.mu, { color: 'green', width: 2, dash: [7, 4] }); else B.hline(0, { color: 'green', width: 2, dash: [7, 4] });
          cache.paths.forEach((pp) => B.path(grid.map((g, k) => [g, pp[k]]), { color: 'accent', width: 1.1, alpha: 0.55 }));
          v.legend([['accent', '$N_t/t$, 20 runs'], ['green', '$1/\\mu$', { dash: true }]]);
          const fin = cache.paths.map((pp) => pp[pp.length - 1]);
          st = { t, counts, lo: Math.min(...fin), hi: Math.max(...fin), mu: Lw.mu };
        });
        v.readout(() => st && `At $t=${v.fix(st.t, 2)}$ the three runs have $N_t=${st.counts.join(', ')}$. At $t=10^5$: $N_t/t\\in[${v.fix(st.lo, 4)},${v.fix(st.hi, 4)}]$, $\\ 1/\\mu=${isFinite(st.mu) ? v.fix(1 / st.mu, 4) : '0'}$.`);
      },
    },
  ],
};
