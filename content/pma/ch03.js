// Rudin, Principles of Mathematical Analysis — Chapter 3: Numerical Sequences and Series
// Items 3.1–3.7 live here; 3.8–3.27 are in ch03-a2.js and ch03-a3.js.

/** Points of a plane sequence n ↦ p(n) for n = 1..N (index 0 unused). */
function samplePlane(p, N) {
  const xs = new Float64Array(N + 1), ys = new Float64Array(N + 1);
  for (let n = 1; n <= N; n++) { const q = p(n); xs[n] = q[0]; ys[n] = q[1]; }
  return { xs, ys, N };
}

export default {
  collection: 'pma',
  chapter: 3,
  title: 'Numerical Sequences and Series',
  summary: String.raw`Convergence of sequences in a metric space, subsequences and their limits (where compactness reappears as Bolzano–Weierstrass), Cauchy sequences and complete spaces, monotone sequences, and the upper and lower limits that every real sequence possesses. The second half is about series: the Cauchy criterion and the comparison test, geometric series and Cauchy's condensation test, the number $e$, the root and ratio tests, power series and their radius of convergence, summation by parts, absolute convergence, Cauchy products, and Riemann's theorem that a conditionally convergent series can be rearranged to have any sum.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Convergent sequence',
      statement: String.raw`A sequence $\{p_n\}$ in a metric space $X$ *converges* if there is a point $p\in X$ such that for every $\eps>0$ some integer $N$ makes $d(p_n,p)<\eps$ for all $n\ge N$. The point $p$ is then the *limit* of the sequence, written $p_n\to p$ or $\lim_{n\to\infty}p_n=p$; a sequence that does not converge *diverges*. The sequence is *bounded* when its range $\{p_n : n=1,2,3,\dots\}$ is a bounded set.

Convergence depends on the ambient space: $1/n\to0$ in $\R$, while the same sequence diverges in the metric space $(0,\infty)$.`,
      idea: String.raw`Read the definition as a game. A challenger names a tolerance $\eps$; you must answer with an index $N$ after which every term lies in the ball $N_\eps(p)$. Only the finitely many terms before $N$ may wander, and $N$ is allowed to depend on $\eps$. A point that is not the limit loses as soon as $\eps$ drops below the distance that infinitely many terms keep from it.`,
      caption: String.raw`Drag the candidate limit $q$ and shrink $\eps$. Terms inside the ball $N_\eps(q)$ are green, terms outside are red; the right panel plots $d(p_n,q)$ and marks the index $N$ after which no term leaves the ball. Only the true limit wins for every $\eps$ — for the two-cluster sequence no point wins at all.`,
      deps: ['pma-2.15'],
      tags: ['sequences', 'convergence'],
      viz(v) {
        const L = [0.35, 0.2];
        const SEQ = {
          spiral: { label: 'spiral', lim: L, p: (n) => { const r = 1.3 * Math.pow(0.88, n); return [L[0] + r * Math.cos(0.9 * n), L[1] + r * Math.sin(0.9 * n)]; } },
          slow: { label: 'slow, $\\sim 1/n$', lim: L, p: (n) => [L[0] + 1.2 * Math.cos(2.1 * n) / n, L[1] + 1.2 * Math.sin(3.3 * n) / n] },
          two: { label: 'two clusters (divergent)', lim: null, p: (n) => [(n % 2 ? -0.85 : 0.85) + 0.45 * Math.cos(n) / n, 0.2 + 0.45 * Math.sin(n) / n] },
        };
        const NMAX = 5000;
        const cache = {};
        const data = (k) => cache[k] || (cache[k] = samplePlane(SEQ[k].p, NMAX));
        const which = v.select('', Object.entries(SEQ).map(([value, s]) => ({ value, label: s.label })), 'spiral');
        const eps = v.slider('$\\varepsilon$', 0.02, 0.8, 0.2, { step: 0.01 });
        const S = v.stage({ x: [-1.45, 1.6], y: [-1.0, 1.45], equal: true, height: 330, title: 'the sequence in $X=\\R^2$' });
        const G = v.stage({ x: [0, 60], y: [0, 2], height: 330, axes: 'box', title: 'the distances $d(p_n,q)$ against $n$' });
        const q = S.handle(L[0] + 0.1, L[1] + 0.07, { color: 'accent', label: 'q' });
        v.button('move $q$ to the limit', () => { const t = SEQ[which.value].lim || [0.85, 0.2]; q.set(t[0], t[1]); });
        const d = new Float64Array(NMAX + 1);
        let st = {};
        v.render(() => {
          const D = data(which.value), e = eps.value;
          let last = 0;
          for (let n = 1; n <= NMAX; n++) { d[n] = Math.hypot(D.xs[n] - q.x, D.ys[n] - q.y); if (d[n] >= e) last = n; }
          const none = last > NMAX * 0.8, N = last + 1;
          st = { none, N };
          // plane
          S.circle(q.x, q.y, e, { fill: 'accent', fillAlpha: 0.13, color: 'accent', width: 1.6 });
          const path = []; for (let n = 1; n <= 70; n++) path.push([D.xs[n], D.ys[n]]);
          S.path(path, { color: 'faint', width: 1 });
          const inn = [], out = [];
          for (let n = 1; n <= 600; n++) (d[n] < e ? inn : out).push([D.xs[n], D.ys[n]]);
          S.dots(out, { color: 'red', r: 3.2 });
          S.dots(inn, { color: 'green', r: 3.2 });
          S.tex('p_1', D.xs[1], D.ys[1], { color: 'muted', align: 'left', dx: 7, dy: -2, size: 14 });
          if (e * S.scale > 26) S.measure(q.x, q.y, q.x + e * Math.cos(-0.7), q.y + e * Math.sin(-0.7), 'ε', { color: 'accent', offset: 10 });
          // distance plot
          const nShow = none ? 120 : Math.max(40, Math.min(400, Math.ceil(N * 1.5)));
          let ymax = 0; for (let n = 1; n <= nShow; n++) ymax = Math.max(ymax, d[n]);
          const gtop = Math.max(e * 1.7, ymax * 1.08); G.setView([0, nShow + 1], [-0.06 * gtop, gtop]);
          G.hband(0, e, { color: 'accent', alpha: 0.1 });
          G.hline(e, { color: 'accent', dash: true, width: 1.4 });
          if (!none) { G.vband(N - 0.5, nShow + 1, { color: 'green', alpha: 0.07 }); G.vline(N, { color: 'orange', dash: [4, 3], width: 1.6 }); }
          const gi = [], go = [];
          for (let n = 1; n <= nShow; n++) {
            if (nShow <= 90) G.line(n, 0, n, d[n], { color: d[n] < e ? 'green' : 'red', width: 1, alpha: 0.35 });
            (d[n] < e ? gi : go).push([n, d[n]]);
          }
          G.dots(go, { color: 'red', r: nShow > 150 ? 2 : 2.8 });
          G.dots(gi, { color: 'green', r: nShow > 150 ? 2 : 2.8 });
          G.tex('\\varepsilon', G.bounds.x[1], e, { color: 'accent', align: 'right', baseline: 'bottom', dx: -6, dy: -2 });
          if (!none) G.tex(`N=${N}`, N, G.bounds.y[1], { color: 'orange', align: 'left', baseline: 'top', dx: 5, dy: 6, size: 14 });
          G.corner(none ? 'terms leave the ball forever' : 'all later terms inside', 'tr', { color: none ? 'red' : 'green', weight: 600 });
          v.legend([['green', 'term inside $N_\\varepsilon(q)$', { dot: true }], ['red', 'term outside', { dot: true }], ['accent', 'ball $N_\\varepsilon(q)$', { area: true }]]);
        });
        v.readout(() => {
          const e = v.fix(eps.value, 2);
          if (st.none) return `With $\\varepsilon=${e}$, terms keep leaving $N_\\varepsilon(q)$ (checked up to $n=5000$): no $N$ works, so $q$ is not a limit.`;
          if (st.N === 1) return `Every term already lies in $N_\\varepsilon(q)$ for $\\varepsilon=${e}$: $N=1$ works.`;
          return `The last term outside $N_\\varepsilon(q)$ is $p_{${st.N - 1}}$, so $N=${st.N}$ works for $\\varepsilon=${e}$. Shrink $\\varepsilon$: does some $N$ always exist?`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'Basic properties of limits in a metric space',
      statement: String.raw`Let $\{p_n\}$ be a sequence in a metric space $X$.
(a) $p_n\to p\in X$ if and only if every neighbourhood of $p$ contains $p_n$ for all but finitely many $n$.
(b) Limits are unique: if $p_n\to p$ and $p_n\to p'$, then $p'=p$.
(c) A convergent sequence is bounded.
(d) If $E\subset X$ and $p$ is a limit point of $E$, then some sequence of points of $E$ converges to $p$.`,
      idea: String.raw`(a) is the definition rewritten with the balls $N_\eps(p)$. For (b), take $\eps=\tfrac12 d(p,p')$: the tail would have to sit in two disjoint balls at once. For (c), all terms after some $N$ are within $1$ of $p$, and the finitely many earlier ones are within $\max_{n\le N} d(p_n,p)$; the larger of the two radii contains everything. For (d), the limit-point property (2.18) gives a point $p_n\in E$ in each ball $N_{1/n}(p)$, and $d(p_n,p)<1/n\to0$.`,
      caption: String.raw`Choose a part. **(b)** Drag the rival limit $p'$: the balls of radius $\tfrac12 d(p,p')$ are disjoint, and only finitely many terms ever visit the red one. **(c)** Drag the grey handle to change the tail radius $\rho$ (Rudin uses $\rho=1$): the green ball of radius $\max(\rho,\text{farthest early term})$ swallows the whole sequence. **(d)** Drag $p$ around the set $E$ (blue region plus isolated dots): at a limit point every ball $N_{1/n}(p)$ yields a point $p_n\in E$; at an isolated or exterior point the construction breaks.`,
      deps: ['pma-3.1', 'pma-2.18'],
      tags: ['sequences', 'convergence', 'limit points'],
      viz(v) {
        const M = v.M;
        const mode = v.select('part', [{ value: 'b', label: 'uniqueness (b)' }, { value: 'c', label: 'boundedness (c)' }, { value: 'd', label: 'limit points (d)' }], 'b');
        const S = v.stage({ x: [-2.6, 2.6], y: [-1.45, 1.45], equal: true, height: 380, full: true, axes: false });
        const P0 = [-1.1, -0.1], RH0 = [-0.24, -0.33];
        const P = S.handle(P0[0], P0[1], { color: 'green', label: 'p' });
        P.labelPos = 'w';
        const P2 = S.handle(0.35, -0.25, { color: 'red', label: "p'" });
        const RH = S.handle(P0[0] + RH0[0], P0[1] + RH0[1], { color: 'gray', r: 6 });
        let prev = [P.x, P.y];
        P.onDrag = () => { RH.x += P.x - prev[0]; RH.y += P.y - prev[1]; prev = [P.x, P.y]; };
        // the set E for (d): an open blob plus isolated points accumulating at a ∉ E
        const blobPts = M.blob(-0.65, 0.1, 0.85, 7, 0.28);
        const A = [1.45, -0.95];
        const Dk = Array.from({ length: 60 }, (_, i) => [A[0], A[1] + 1.6 / (i + 2)]);
        const NM = 4000;
        const seq = (n) => { const r = 2.2 * Math.pow(n, -0.8); const th = 0.55 * Math.sin(1.7 * n) + 0.15; return [P.x + r * Math.cos(th), P.y + r * Math.sin(th)]; };
        let lastMode = null, st = {};
        const distToBlob = (p) => {
          if (M.pointInPoly(p, blobPts)) return 0;
          let b = Infinity; for (let i = 0; i < blobPts.length; i++) b = Math.min(b, M.dist(p, M.closestOnSegment(p, blobPts[i], blobPts[(i + 1) % blobPts.length])));
          return b;
        };
        v.render(() => {
          const m = mode.value;
          if (m !== lastMode) {
            lastMode = m;
            P.visible = true; P2.visible = m === 'b'; RH.visible = m === 'c';
            P.color = m === 'd' ? 'accent' : 'green';
            P.constrain = m === 'd' ? (x, y) => { if (Math.hypot(x - A[0], y - A[1]) < 0.09) return A.slice(); for (const q of Dk.slice(0, 8)) if (Math.hypot(x - q[0], y - q[1]) < 0.05) return q.slice(); return [x, y]; } : null;
            if (m === 'd') { P.x = -0.25; P.y = 0.15; } else { P.x = P0[0]; P.y = P0[1]; RH.x = P.x + RH0[0]; RH.y = P.y + RH0[1]; }
            prev = [P.x, P.y];
          }
          const p = [P.x, P.y];
          if (m === 'b' || m === 'c') {
            const pts = []; const ds = [];
            for (let n = 1; n <= NM; n++) { const q = seq(n); pts.push(q); ds.push(M.dist(q, p)); }
            if (m === 'b') {
              const p2 = [P2.x, P2.y], r = M.dist(p, p2) / 2;
              let last = 0; for (let n = 1; n <= NM; n++) if (ds[n - 1] >= r) last = n;
              const N = last + 1;
              const visit = []; for (let n = 1; n <= NM; n++) if (M.dist(pts[n - 1], p2) < r) visit.push(n);
              S.circle(p[0], p[1], r, { fill: 'green', fillAlpha: 0.1, color: 'green', width: 1.5 });
              S.circle(p2[0], p2[1], r, { fill: 'red', fillAlpha: 0.08, color: 'red', width: 1.5 });
              S.line(p[0], p[1], p2[0], p2[1], { color: 'muted', width: 1, dash: [3, 4] });
              S.path(pts.slice(0, 60), { color: 'faint', width: 1 });
              const early = pts.slice(0, Math.min(N - 1, 300)), tail = pts.slice(N - 1, 300);
              S.dots(early, { color: 'gold', r: 3.4 });
              S.tex('p_1', pts[0][0], pts[0][1], { color: 'gold', align: 'left', dx: 7, size: 13 });
              S.dots(tail, { color: 'green', r: 2.4 });
              for (const n of visit.slice(0, 12)) S.dot(pts[n - 1][0], pts[n - 1][1], { color: 'red', r: 5, hollow: true, width: 2 });
              S.tex('\\tfrac12 d(p,p\')', (p[0] + p2[0]) / 2, (p[1] + p2[1]) / 2, { color: 'muted', dy: -12, size: 13 });
              v.legend([['gold', 'terms $p_n$, $n<N$', { dot: true }], ['green', 'tail $n\\ge N$ (inside the green ball)', { dot: true }], ['red', 'terms visiting the ball about $p\'$', { dot: true }]]);
              st = { m, r, N, visit };
            } else {
              const rho = Math.max(0.12, Math.hypot(RH.x - p[0], RH.y - p[1]));
              let last = 0; for (let n = 1; n <= NM; n++) if (ds[n - 1] >= rho) last = n;
              const N = last + 1;
              let far = 0, farN = 0; for (let n = 1; n < N; n++) if (ds[n - 1] > far) { far = ds[n - 1]; farN = n; }
              const R = Math.max(rho, far);
              S.circle(p[0], p[1], R, { fill: 'green', fillAlpha: 0.07, color: 'green', width: 2, dash: [7, 5] });
              S.circle(p[0], p[1], rho, { fill: 'accent', fillAlpha: 0.14, color: 'accent', width: 1.5 });
              S.path(pts.slice(0, 40), { color: 'faint', width: 1 });
              S.dots(pts.slice(N - 1, 400), { color: 'accent', r: 2.4 });
              S.dots(pts.slice(0, N - 1), { color: 'orange', r: 3.6 });
              if (farN) { const f = pts[farN - 1]; S.dot(f[0], f[1], { color: 'orange', r: 7, hollow: true, width: 2 }); S.tex(`p_{${farN}}`, f[0], f[1], { color: 'orange', align: 'left', dx: 10, dy: -8, size: 14 }); S.measure(p[0], p[1], f[0], f[1], null, { color: 'orange' }); }
              S.tex('\\rho', RH.x, RH.y, { color: 'muted', align: 'left', dx: 9, dy: 10, size: 14 });
              S.tex(`r=${v.fix(R, 2)}`, p[0], p[1] + R, { color: 'green', baseline: 'bottom', dy: -4, size: 14 });
              v.legend([['orange', 'the $N-1$ early terms', { dot: true }], ['accent', 'tail terms, within $\\rho$ of $p$', { dot: true }], ['green', 'ball of radius $r=\\max(\\rho,\\ \\max_{n<N}d(p_n,p))$', { dash: true }]]);
              st = { m, rho, N, far, farN, R };
            }
            S.corner(m === 'b' ? 'the tail lives in the green ball, so the red ball is visited only finitely often' : 'one ball contains every term', 'tl', { color: 'green', weight: 600 });
          } else {
            // (d)
            S.poly(blobPts, { fill: 'blue', fillAlpha: 0.18, color: 'blue', width: 1.6 });
            S.dots(Dk, { color: 'blue', r: 3.4 });
            S.dot(A[0], A[1], { color: 'blue', r: 4.5, hollow: true, width: 1.8 });
            S.tex('a\\notin E', A[0], A[1], { color: 'muted', align: 'left', dx: 9, dy: 8, size: 13 });
            S.tex('E', -0.65, 0.95, { color: 'blue', size: 20 });
            const isA = Math.hypot(p[0] - A[0], p[1] - A[1]) < 1e-9;
            let dE = distToBlob(p);
            for (const q of Dk) { const dq = M.dist(q, p); if (dq > 1e-9) dE = Math.min(dE, dq); }
            if (isA) dE = 0;
            // nFail = first n whose ball N_{1/n}(p) misses E \ {p}
            const nFail = dE > 0 ? Math.max(1, Math.ceil(1 / dE - 1e-12)) : Infinity;
            const shown = Math.min(8, nFail === Infinity ? 8 : nFail - 1);
            const chosen = [];
            for (let n = 1; n <= shown; n++) {
              const r = 1 / n; let got = null;
              const inBlob = (q) => M.pointInPoly(q, blobPts);
              const th0 = 2.39996 * n;
              outer: for (const f of [0.6, 0.85, 0.4, 0.2, 0.08, 0.03]) for (let j = 0; j < 72; j++) { const th = th0 + M.TAU * j / 72; const q = [p[0] + f * r * Math.cos(th), p[1] + f * r * Math.sin(th)]; if (inBlob(q)) { got = q; break outer; } }
              if (!got) for (const q of Dk) { const dq = M.dist(q, p); if (dq > 1e-9 && dq < r) { got = q; break; } }
              if (got) chosen.push([n, got]);
            }
            for (let n = 1; n <= shown; n++) S.circle(p[0], p[1], 1 / n, { color: 'orange', width: 1.2, alpha: 0.35 + 0.5 * (n / 8) });
            if (nFail !== Infinity && nFail <= 30) S.circle(p[0], p[1], 1 / nFail, { color: 'red', width: 2, dash: [5, 4], fill: 'red', fillAlpha: 0.06 });
            S.path(chosen.map((c) => c[1]), { color: 'gold', width: 1.4, alpha: 0.8 });
            for (const [n, q] of chosen) { S.dot(q[0], q[1], { color: 'gold', r: 4.5 }); if (n <= 3) S.tex(`p_${n}`, q[0], q[1], { color: 'gold', align: 'left', dx: 7, dy: -9, size: 14 }); }
            const ok = nFail === Infinity;
            S.corner(ok ? 'p is a limit point of E: every ball of radius 1/n meets E' : `the ball of radius 1/${nFail} misses E \\ {p}: p is not a limit point`, 'tl', { color: ok ? 'green' : 'red', weight: 600 });
            v.legend([['blue', 'the set $E$', { area: true }], ['orange', 'balls $N_{1/n}(p)$, $n=1,\\dots,8$'], ['gold', 'chosen $p_n\\in E\\cap N_{1/n}(p)$', { dot: true }]]);
            st = { m, ok, nFail, isA, dE };
          }
        });
        v.readout(() => {
          const s = st;
          if (s.m === 'b') return `$\\varepsilon=\\tfrac12 d(p,p')=${v.fix(s.r, 3)}$: every $p_n$ with $n\\ge N=${s.N}$ lies in $N_\\varepsilon(p)$, so $N_\\varepsilon(p')$ contains only ${s.visit.length} term${s.visit.length === 1 ? '' : 's'}${s.visit.length ? ` ($n=${s.visit.slice(0, 6).join(',')}${s.visit.length > 6 ? ',\\dots' : ''}$)` : ''} — $p'$ is not a limit.`;
          if (s.m === 'c') return `Tail radius $\\rho=${v.fix(s.rho, 2)}$ needs $N=${s.N}$; the farthest earlier term is ${s.farN ? `$p_{${s.farN}}$ at distance $${v.fix(s.far, 3)}$` : 'absent'}, so $d(p_n,p)\\le r=${v.fix(s.R, 3)}$ for every $n$.`;
          if (s.ok) return s.isA ? `$p=a$ is not in $E$, yet it is a limit point: the isolated points of $E$ give $p_n\\to p$ with $d(p_n,p)<1/n$.` : `$p$ lies in the closure of the open region, so each $N_{1/n}(p)$ contains points of $E$; the chosen $p_n$ satisfy $d(p_n,p)<1/n\\to0$.`;
          return `The nearest point of $E\\setminus\\{p\\}$ is at distance $${v.fix(s.dE, 3)}$, so the ball $N_{1/${s.nFail}}(p)$ contains no point of $E$ other than $p$: the hypothesis of (d) fails here.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Theorem',
      name: 'Limits of sums, products and quotients',
      statement: String.raw`Let $\{s_n\}$ and $\{t_n\}$ be complex sequences with $s_n\to s$ and $t_n\to t$. Then
(a) $s_n+t_n\to s+t$;
(b) $c\,s_n\to cs$ and $c+s_n\to c+s$ for every complex number $c$;
(c) $s_nt_n\to st$;
(d) $1/s_n\to 1/s$, provided $s\ne0$ and $s_n\ne0$ for every $n$.`,
      idea: String.raw`Each part is an error estimate built from the triangle inequality (1.33). For sums, $|(s_n+t_n)-(s+t)|\le|s_n-s|+|t_n-t|$, so $\eps/2$ for each piece suffices. For products, the identity
$$s_nt_n-st=(s_n-s)(t_n-t)+s(t_n-t)+t(s_n-s)$$
splits the error into three small pieces. For reciprocals, once $|s_n-s|<\tfrac12|s|$ we have $|s_n|>\tfrac12|s|$, hence $|1/s_n-1/s|<2|s_n-s|/|s|^2$.`,
      caption: String.raw`The sequences are real here so the pictures fit on the page. Pick an operation, set the limits $s,t$ and move the index $n$. For the product, the area of the $s_n\times t_n$ rectangle exceeds $st$ by exactly the two strips and the corner of the identity; all three shrink with $n$. For the reciprocal, slide $s$ to $0$ to break the hypothesis $s\ne0$.`,
      deps: ['pma-3.1', 'pma-1.33'],
      see: ['pma-4.4'],
      tags: ['sequences', 'limits'],
      viz(v) {
        const op = v.select('', [{ value: 'sum', label: 'sum $s_n+t_n$' }, { value: 'prod', label: 'product $s_n t_n$' }, { value: 'inv', label: 'reciprocal $1/s_n$' }], 'prod');
        const sS = v.slider('$s$', -1.5, 2.5, 1.4, { step: 0.05 });
        const tS = v.slider('$t$', 0.3, 2.5, 1.1, { step: 0.05 });
        const nS = v.slider('$n$', 1, 40, 5, { int: true });
        const L = v.stage({ x: [0, 41], y: [-1, 3], height: 330, axes: 'box', title: 'the sequences against $n$, with their limits' });
        const R = v.stage({ x: [-0.2, 3], y: [-0.2, 3], height: 330, title: 'the error at index $n$' });
        const sn = (n, s) => s + 0.9 * Math.sin(1.3 * n + 0.4) / Math.pow(n, 0.75);
        const tn = (n, t) => t + 0.8 * Math.cos(0.9 * n + 1) / Math.pow(n, 0.85);
        const NN = 40;
        let st = {};
        v.render(() => {
          const o = op.value, s = sS.value, t = tS.value, n = nS.value;
          const comb = o === 'sum' ? (k) => sn(k, s) + tn(k, t) : o === 'prod' ? (k) => sn(k, s) * tn(k, t) : (k) => 1 / sn(k, s);
          const lim = o === 'sum' ? s + t : o === 'prod' ? s * t : (Math.abs(s) < 1e-9 ? NaN : 1 / s);
          // left: sequences
          const vals = [];
          for (let k = 1; k <= NN; k++) { vals.push(sn(k, s)); if (o !== 'inv') vals.push(tn(k, t)); const c = comb(k); if (isFinite(c)) vals.push(c); }
          if (isFinite(lim)) vals.push(lim);
          const lo = Math.max(-5, Math.min(...vals)), hi = Math.min(6, Math.max(...vals));
          const pad = (hi - lo) * 0.08 + 0.05;
          L.setView([0, NN + 1], [lo - pad, hi + pad]);
          L.vline(n, { color: 'gold', width: 6, alpha: 0.25 });
          L.hline(s, { color: 'blue', dash: [5, 4], width: 1.2, alpha: 0.8 });
          if (o !== 'inv') L.hline(t, { color: 'purple', dash: [5, 4], width: 1.2, alpha: 0.8 });
          if (isFinite(lim)) L.hline(lim, { color: 'green', dash: [5, 4], width: 1.4 });
          const sp = [], tp = [], cp = [];
          for (let k = 1; k <= NN; k++) { sp.push([k, sn(k, s)]); tp.push([k, tn(k, t)]); cp.push([k, comb(k)]); }
          L.path(cp, { color: 'green', width: 1.6, alpha: 0.6 });
          L.dots(sp, { color: 'blue', r: 2.8 });
          if (o !== 'inv') L.dots(tp, { color: 'purple', r: 2.8 });
          L.dots(cp.filter((p) => isFinite(p[1])), { color: 'green', r: 3.2 });
          const name = o === 'sum' ? 's_n+t_n' : o === 'prod' ? 's_nt_n' : '1/s_n';
          v.legend([['blue', '$s_n$', { dot: true }], ...(o !== 'inv' ? [['purple', '$t_n$', { dot: true }]] : []), ['green', `$${name}$ and its claimed limit`], ['gold', 'index $n$', { area: true }]]);
          const es = sn(n, s) - s, et = tn(n, t) - t;
          // right: the error picture
          if (o === 'sum') {
            const a = Math.abs(es), b = Math.abs(et), c = Math.abs(es + et);
            const top = Math.max(0.2, (a + b) * 1.2);
            R.setView([-0.45, 3], [0, top]);
            R.rect(0.55, 0, 1.25, a, { fill: 'blue', fillAlpha: 0.55, stroke: false });
            R.rect(0.55, a, 1.25, a + b, { fill: 'purple', fillAlpha: 0.55, stroke: false });
            R.rect(1.75, 0, 2.45, c, { fill: 'green', fillAlpha: 0.65, stroke: false });
            R.tex('|s_n-s|', 0.9, a / 2, { color: 'ink', size: 13 });
            R.tex('|t_n-t|', 0.9, a + b / 2, { color: 'ink', size: 13 });
            R.text('bound', 0.9, a + b, { align: 'center', baseline: 'bottom', dy: -4, color: 'muted' });
            R.text('actual error', 2.1, c, { align: 'center', baseline: 'bottom', dy: -4, color: 'green' });
            st = { o, a, b, c };
          } else if (o === 'prod') {
            const S1 = sn(n, s), T1 = tn(n, t);
            const xs = [0, s, S1], ys = [0, t, T1];
            const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
            const pd = 0.16 * Math.max(x1 - x0, y1 - y0) + 0.05;
            R.setView([x0 - pd, x1 + pd], [y0 - pd, y1 + pd]);
            R.rect(0, 0, s, t, { fill: 'gray', fillAlpha: 0.16, color: 'muted', width: 1 });
            R.rect(s, 0, S1, t, { fill: 'blue', fillAlpha: 0.35, stroke: false });
            R.rect(0, t, s, T1, { fill: 'purple', fillAlpha: 0.35, stroke: false });
            R.rect(s, t, S1, T1, { fill: 'gold', fillAlpha: 0.6, stroke: false });
            R.rect(0, 0, S1, T1, { color: 'green', width: 2 });
            R.tex('st', s / 2, t / 2, { color: 'muted', size: 15 });
            R.dot(s, t, { color: 'ink', r: 3.5 });
            R.dot(S1, T1, { color: 'green', r: 4.5 });
            R.tex('(s_n,t_n)', S1, T1, { color: 'green', align: 'right', baseline: 'bottom', dx: -6, dy: -5, size: 13 });
            R.tex('(s,t)', s, t, { color: 'ink', align: 'right', baseline: 'top', dx: -5, dy: 4, size: 13 });
            st = { o, c1: (S1 - s) * (T1 - t), c2: s * (T1 - t), c3: t * (S1 - s), tot: S1 * T1 - s * t };
            v.legend([['blue', '$s_n$', { dot: true }], ['purple', '$t_n$', { dot: true }], ['green', '$s_nt_n$ and $st$'], ['blue', 'strip $t(s_n-s)$', { area: true }], ['purple', 'strip $s(t_n-t)$', { area: true }], ['gold', 'corner $(s_n-s)(t_n-t)$', { area: true }]]);
          } else {
            R.setView([-1.7, 2.7], [-4.5, 4.5]);
            const S1 = sn(n, s), as = Math.abs(s);
            if (as > 1e-9) {
              R.vband(-as / 2, as / 2, { color: 'red', alpha: 0.1 });
              R.vband(s - as / 2, s + as / 2, { color: 'green', alpha: 0.1 });
            }
            R.fn((x) => 1 / x, { color: 'ink', width: 2 });
            R.dot(s, 0, { color: 'blue', r: 4 }); R.tex('s', s, 0, { color: 'blue', align: 'right', baseline: 'top', dx: -3, dy: 5, size: 14 });
            R.dot(S1, 0, { color: 'gold', r: 4 }); R.tex('s_n', S1, 0, { color: 'gold', align: 'left', baseline: 'top', dx: 3, dy: 5, size: 14 });
            const f1 = 1 / S1, f0 = as > 1e-9 ? 1 / s : NaN;
            if (Math.abs(f1) < 4.5) { R.line(S1, 0, S1, f1, { color: 'gold', dash: [3, 3], width: 1.2 }); R.dot(S1, f1, { color: 'gold', r: 4.5 }); }
            if (isFinite(f0) && Math.abs(f0) < 4.5) { R.line(s, 0, s, f0, { color: 'blue', dash: [3, 3], width: 1.2 }); R.dot(s, f0, { color: 'green', r: 4.5 }); }
            if (isFinite(f0) && Math.abs(f1) < 4.5 && Math.abs(f0) < 4.5) R.measure(2.45, f0, 2.45, f1, null, { color: 'green' });
            R.corner(as < 1e-9 ? 's = 0: the hypothesis fails' : 'green: |x − s| < |s|/2,  red: |x| < |s|/2', 'br', { color: as < 1e-9 ? 'red' : 'green', weight: 600 });
            st = { o, s, S1, err: Math.abs(f1 - f0), bound: 2 * Math.abs(S1 - s) / (s * s), near: Math.abs(S1 - s) < as / 2 };
          }
        });
        v.readout(() => {
          const s = st, f = (x) => v.fix(x, 4);
          if (s.o === 'sum') return `$|(s_n+t_n)-(s+t)| = ${f(s.c)} \\;\\le\\; |s_n-s|+|t_n-t| = ${f(s.a)}+${f(s.b)}$`;
          if (s.o === 'prod') return `$s_nt_n-st = ${f(s.tot)} = \\underbrace{${f(s.c1)}}_{\\text{corner}} + \\underbrace{${f(s.c2)}}_{s(t_n-t)} + \\underbrace{${f(s.c3)}}_{t(s_n-s)}$ (signed areas)`;
          if (Math.abs(s.s) < 1e-9) return `With $s=0$ the reciprocals $1/s_n$ are unbounded (here $1/s_n=${v.fix(1 / s.S1, 2)}$): part (d) needs $s\\ne0$.`;
          return s.near ? `$|1/s_n-1/s| = ${f(s.err)} \\;<\\; 2|s_n-s|/|s|^2 = ${f(s.bound)}$` : `$|s_n-s|\\ge|s|/2$ at this $n$, so the estimate does not apply yet — increase $n$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: String.raw`Convergence in $\R^k$ is coordinatewise`,
      statement: String.raw`(a) Let $\mathbf x_n=(\alpha_{1,n},\dots,\alpha_{k,n})\in\R^k$ and $\mathbf x=(\alpha_1,\dots,\alpha_k)$. Then $\mathbf x_n\to\mathbf x$ if and only if $\alpha_{j,n}\to\alpha_j$ for each $j=1,\dots,k$.
(b) If $\mathbf x_n\to\mathbf x$ and $\mathbf y_n\to\mathbf y$ in $\R^k$ and $\beta_n\to\beta$ in $\R$, then $\mathbf x_n+\mathbf y_n\to\mathbf x+\mathbf y$, $\ \mathbf x_n\cdot\mathbf y_n\to\mathbf x\cdot\mathbf y$ and $\beta_n\mathbf x_n\to\beta\mathbf x$.`,
      idea: String.raw`Everything rests on the two inequalities
$$|\alpha_{j,n}-\alpha_j|\;\le\;|\mathbf x_n-\mathbf x|\;\le\;\sqrt k\,\max_j|\alpha_{j,n}-\alpha_j| .$$
The left one gives "only if". For "if", make every coordinate error smaller than $\eps/\sqrt k$: the point is then in a cube of half-side $\eps/\sqrt k$, which sits inside the ball of radius $\eps$. Part (b) follows from (a) and the scalar rules of 3.3 applied coordinate by coordinate.`,
      caption: String.raw`Here $k=2$. The orange square has half-side $\eps/\surd2$ and fits inside the $\eps$-ball. The right panel plots both coordinate errors and the Euclidean distance: once both coordinates are below $\eps/\surd2$ (after $\max(N_1,N_2)$), the distance is below $\eps$. Turn on the oscillation to make one coordinate diverge — and the vectors with it.`,
      deps: ['pma-3.1', 'pma-3.3', 'pma-1.37'],
      see: ['pma-4.10'],
      tags: ['sequences', 'euclidean space'],
      viz(v) {
        const a = [0.75, -0.1];
        const osc = v.toggle('second coordinate oscillates', false);
        const eps = v.slider('$\\varepsilon$', 0.06, 0.8, 0.32, { step: 0.01 });
        const S = v.stage({ x: [0.0, 1.6], y: [-1.0, 0.65], equal: true, height: 340, axes: false, title: 'the points $\\mathbf x_n\\in\\R^2$' });
        const G = v.stage({ x: [0, 50], y: [0, 1.5], height: 340, axes: 'box', title: 'errors against $n$' });
        const c1 = (n) => a[0] + 1.1 * Math.cos(1.1 * n) / n;
        const c2 = (n) => a[1] + 1.25 * Math.pow(0.8, n) * Math.sin(2 * n + 1) + (osc.value ? 0.42 * (n % 2 ? -1 : 1) : 0);
        const NMAX = 3000;
        let st = {};
        v.render(() => {
          const e = eps.value, h = e / Math.SQRT2;
          let l1 = 0, l2 = 0, lv = 0;
          for (let n = 1; n <= NMAX; n++) {
            const d1 = Math.abs(c1(n) - a[0]), d2 = Math.abs(c2(n) - a[1]);
            if (d1 >= h) l1 = n; if (d2 >= h) l2 = n; if (Math.hypot(d1, d2) >= e) lv = n;
          }
          const N1 = l1 + 1, N2 = l2 + 1, Nv = lv + 1;
          const bad2 = l2 > NMAX * 0.8, badv = lv > NMAX * 0.8;
          const Nm = Math.max(N1, N2);
          st = { N1, N2, Nv, bad2, badv, Nm };
          // plane
          S.circle(a[0], a[1], e, { fill: 'accent', fillAlpha: 0.12, color: 'accent', width: 1.5 });
          S.rect(a[0] - h, a[1] - h, a[0] + h, a[1] + h, { fill: 'orange', fillAlpha: 0.14, color: 'orange', width: 1.5 });
          const pts = []; for (let n = 1; n <= 300; n++) pts.push([c1(n), c2(n)]);
          S.path(pts.slice(0, 40), { color: 'faint', width: 1 });
          const early = [], late = [];
          pts.forEach((p, i) => ((!bad2 && i + 1 >= Nm) ? late : early).push(p));
          S.dots(early, { color: bad2 ? 'red' : 'gold', r: 3 });
          S.dots(late, { color: 'green', r: 2.6 });
          S.dot(a[0], a[1], { color: 'ink', r: 3.5 });
          S.tex('\\mathbf x', a[0], a[1], { color: 'ink', align: 'left', dx: 6, dy: 9, size: 14 });
          S.tex('\\mathbf x_1', pts[0][0], pts[0][1], { color: 'muted', align: 'left', dx: 7, size: 13 });
          // errors
          const nShow = bad2 ? 60 : Math.max(30, Math.min(300, Math.ceil(Math.max(Nm, Nv) * 1.6)));
          const gtop = Math.max(e * 1.5, 1.3); G.setView([0, nShow + 1], [-0.07 * gtop, gtop]);
          G.hline(e, { color: 'accent', dash: true, width: 1.3 });
          G.hline(h, { color: 'orange', dash: true, width: 1.3 });
          if (!bad2) { G.vband(Nm - 0.5, nShow + 1, { color: 'green', alpha: 0.07 }); G.vline(Nm, { color: 'green', dash: [4, 3] }); }
          const p1 = [], p2 = [], pv = [];
          for (let n = 1; n <= nShow; n++) { const d1 = Math.abs(c1(n) - a[0]), d2 = Math.abs(c2(n) - a[1]); p1.push([n, d1]); p2.push([n, d2]); pv.push([n, Math.hypot(d1, d2)]); }
          G.path(pv, { color: 'green', width: 1.8 });
          G.dots(p1, { color: 'blue', r: nShow > 120 ? 1.8 : 2.6 });
          G.dots(p2, { color: 'purple', r: nShow > 120 ? 1.8 : 2.6 });
          G.tex('\\varepsilon', G.bounds.x[1], e, { color: 'accent', align: 'right', baseline: 'bottom', dx: -6, dy: -2 });
          G.tex('\\varepsilon/\\sqrt2', G.bounds.x[1], h, { color: 'orange', align: 'right', baseline: 'top', dx: -6, dy: 3, size: 14 });
          if (!bad2) G.tex(`\\max(N_1,N_2)=${Nm}`, Nm, G.bounds.y[1], { color: 'green', align: 'left', baseline: 'top', dx: 5, dy: 6, size: 13 });
          else G.corner('second coordinate never settles: no N₂', 'tr', { color: 'red', weight: 600 });
          v.legend([['blue', '$|\\alpha_{1,n}-\\alpha_1|$', { dot: true }], ['purple', '$|\\alpha_{2,n}-\\alpha_2|$', { dot: true }], ['green', '$|\\mathbf x_n-\\mathbf x|$'], ['orange', 'square of half-side $\\varepsilon/\\sqrt2$', { area: true }], ['accent', '$\\varepsilon$-ball', { area: true }]]);
        });
        v.readout(() => {
          const s = st;
          if (s.bad2) return `The second coordinate keeps jumping by $0.84$, so $\\alpha_{2,n}$ diverges — and so does $\\mathbf x_n$: its distance to $\\mathbf x$ stays $\\ge 0.42-\\dots$ infinitely often (part (a), "only if").`;
          return `$N_1=${s.N1}$, $N_2=${s.N2}$: for $n\\ge${s.Nm}$ both coordinate errors are $<\\varepsilon/\\sqrt2$, hence $|\\mathbf x_n-\\mathbf x|<\\varepsilon$. (The vectors themselves stay in the ball from $n=${s.Nv}$ on — never later than $\\max(N_1,N_2)$.)`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Definition',
      name: 'Subsequence and subsequential limit',
      statement: String.raw`Let $\{p_n\}$ be a sequence and let $n_1<n_2<n_3<\cdots$ be a strictly increasing sequence of positive integers. The sequence $\{p_{n_i}\}$, indexed by $i$, is a *subsequence* of $\{p_n\}$. If a subsequence converges, its limit is called a *subsequential limit* of $\{p_n\}$.

A sequence converges to $p$ precisely when every one of its subsequences converges to $p$.`,
      idea: String.raw`A subsequence keeps infinitely many terms in their original order and re-indexes them by $i$. Because $n_i\ge i$, any tail condition "$n\ge N$" on the original sequence is inherited by the subsequence, which is why a convergent sequence has only one subsequential limit; a divergent sequence may have several.`,
      caption: String.raw`The sequence $p_n=\cos(n\pi/2)+0.8/n$ cycles through values near $0, -1, 0, 1$. Pick a rule for the indices $n_i$ (or click points in the top panel to build your own increasing choice). The bottom panel re-indexes the chosen terms by $i$: the rules $4i$, $2i-1$, $4i-2$ give the three subsequential limits $1$, $0$, $-1$; the rule $i^2$ keeps alternating and has no limit.`,
      deps: ['pma-3.1'],
      tags: ['sequences', 'subsequences'],
      viz(v) {
        const p = (n) => Math.cos(n * Math.PI / 2) + 0.8 / n;
        const RULES = {
          r4: { label: '$n_i=4i$', f: (i) => 4 * i, lim: 1 },
          odd: { label: '$n_i=2i-1$', f: (i) => 2 * i - 1, lim: 0 },
          r42: { label: '$n_i=4i-2$', f: (i) => 4 * i - 2, lim: -1 },
          sq: { label: '$n_i=i^2$', f: (i) => i * i, lim: null },
          custom: { label: 'your clicks', f: null, lim: null },
        };
        const rule = v.select('indices', Object.entries(RULES).map(([value, r]) => ({ value, label: r.label })), 'r4');
        const T = v.stage({ x: [0, 41], y: [-1.35, 1.95], height: 270, axes: 'box', full: true, title: 'the sequence $p_n$ against $n$ (chosen terms in gold)' });
        const B = v.stage({ x: [0, 21], y: [-1.35, 1.95], height: 200, axes: 'box', full: true, title: 'the subsequence $p_{n_i}$ against its own index $i$' });
        const custom = new Set([1, 4, 5, 8, 13, 16, 24]);
        T.onClick((x, y) => {
          const n = Math.round(x); if (n < 1 || n > 40) return;
          if (Math.abs(T.Y(y) - T.Y(p(n))) > 14) return;
          if (custom.has(n)) custom.delete(n); else custom.add(n);
          rule.set('custom');
        });
        let st = {};
        v.render(() => {
          const R = RULES[rule.value];
          let idx;
          if (R.f) { idx = []; for (let i = 1; R.f(i) <= 2000 && i <= 60; i++) idx.push(R.f(i)); } else idx = [...custom].sort((a, b) => a - b);
          for (const c of [1, 0, -1]) T.hline(c, { color: 'teal', width: 1, alpha: 0.35, dash: [2, 4] });
          const all = []; for (let n = 1; n <= 40; n++) all.push([n, p(n)]);
          T.path(all, { color: 'faint', width: 1 });
          T.dots(all, { color: 'muted', r: 3 });
          const chosen = idx.filter((n) => n <= 40);
          chosen.forEach((n, i) => {
            T.dot(n, p(n), { color: 'gold', r: 5.5 });
            if (i < 5 || i === chosen.length - 1) T.tex(`n_{${i + 1}}`, n, p(n), { color: 'gold', baseline: 'bottom', dy: -9, size: 13 });
          });
          // bottom: re-indexed
          const I = Math.max(8, Math.min(30, idx.length));
          B.setView([0, I + 1], null);
          if (R.lim != null) { B.hline(R.lim, { color: 'green', dash: true, width: 1.5 }); B.tex(`\\lim_i p_{n_i}=${R.lim}`, I + 0.6, R.lim, { color: 'green', align: 'right', baseline: 'bottom', dy: -4, size: 14 }); }
          const sub = idx.slice(0, I).map((n, i) => [i + 1, p(n)]);
          B.path(sub, { color: R.lim != null ? 'green' : rule.value === 'sq' ? 'red' : 'gold', width: 1.4, alpha: 0.7 });
          B.dots(sub, { color: R.lim != null ? 'green' : rule.value === 'sq' ? 'red' : 'gold', r: 3.6 });
          if (rule.value === 'sq') B.corner('alternates between ≈1 and ≈0: no limit', 'tr', { color: 'red', weight: 600 });
          if (rule.value === 'custom') B.corner('click points above to add or remove them', 'tr', { color: 'muted' });
          st = { idx, R };
          v.legend([['muted', '$p_n$', { dot: true }], ['gold', 'chosen terms $p_{n_i}$', { dot: true }], ['teal', 'subsequential limits $1, 0, -1$', { dash: true }]]);
        });
        v.readout(() => {
          const { idx, R } = st; if (!idx) return '';
          const list = idx.slice(0, 8).join(',\\ ') + (idx.length > 8 ? ',\\ \\dots' : '');
          if (rule.value === 'custom') return idx.length ? `Your indices $n_1<n_2<\\cdots$: $${list}$. A finite choice decides nothing — any of $1,0,-1$ can still be reached by continuing it.` : 'Click points of the sequence to choose indices.';
          return `$n_i = ${list}$` + (R.lim != null ? ` — the subsequence converges to $${R.lim}$, a subsequential limit of $\\{p_n\\}$.` : ' — this subsequence diverges, although each of its own subsequences $n_{2i}$, $n_{2i+1}$ converges.');
        });
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Theorem',
      name: 'Convergent subsequences (Bolzano–Weierstrass)',
      credit: 'Bolzano & Weierstrass, 1817',
      statement: String.raw`(a) Every sequence in a compact metric space $X$ has a subsequence converging to a point of $X$.
(b) Every bounded sequence in $\R^k$ has a convergent subsequence.`,
      idea: String.raw`If the range of $\{p_n\}$ is finite, some value is taken for infinitely many $n$, giving a constant subsequence. Otherwise the range is an infinite subset of the compact space $X$ and so has a limit point $p\in X$ (2.37); choose $n_1<n_2<\cdots$ with $d(p,p_{n_i})<1/i$. Part (b) follows because a bounded set in $\R^k$ lies in a $k$-cell, which is compact (2.40). The picture shows the halving argument behind 2.40: always keep a quarter that still contains infinitely many terms.`,
      caption: String.raw`Raise the step $k$. Each step splits the current square into four and keeps a quarter holding the most later terms (counted among the first $250\,000$ — a finite stand-in for "infinitely many"); the gold subsequence $p_{n_1},p_{n_2},\dots$ is then trapped in squares of side $2^{1-k}$. The right panel zooms into the current square and shows the counts. For the unbounded sequence no square can start the process.`,
      deps: ['pma-3.5', 'pma-2.37', 'pma-2.41'],
      see: ['pma-7.25', 'rca-14.6', 'fa-3.15'],
      tags: ['compactness', 'subsequences'],
      viz(v) {
        const SEQ = {
          dense: { label: '$(\\sin n,\\ \\sin n\\sqrt2)$', p: (n) => [Math.sin(n), Math.sin(n * Math.SQRT2)], bounded: true },
          clus: { label: 'three clusters', p: (n) => { const C = [[0.52, 0.47], [-0.55, 0.3], [0.12, -0.58]][n % 3]; const r = 0.4 / Math.sqrt(n); return [C[0] + r * Math.cos(2.4 * n), C[1] + r * Math.sin(2.4 * n)]; }, bounded: true },
          unb: { label: 'unbounded: $\\tfrac18\\sqrt n\\,(\\cos n,\\sin n)$', p: (n) => { const r = Math.sqrt(n) / 8; return [r * Math.cos(n), r * Math.sin(n)]; }, bounded: false },
        };
        const NMAX = 250000, KMAX = 8;
        const which = v.select('', Object.entries(SEQ).map(([value, s]) => ({ value, label: s.label })), 'dense');
        const kS = v.slider('step $k$', 0, KMAX, 3, { int: true });
        const S = v.stage({ x: [-1.12, 1.12], y: [-1.12, 1.12], equal: true, height: 360, axes: false, title: 'nested squares $[-1,1]^2=Q_0\\supset Q_1\\supset\\cdots$' });
        const Z = v.stage({ x: [-1.12, 1.12], y: [-1.12, 1.12], equal: true, height: 360, axes: 'box', title: 'zoom: the current square $Q_k$' });
        const cache = {};
        function run(key) {
          if (cache[key]) return cache[key];
          const D = samplePlane(SEQ[key].p, NMAX);
          const out = { D, steps: [{ x0: -1, y0: -1, s: 2, n: 0, counts: null, pick: -1 }] };
          if (SEQ[key].bounded) {
            let idx = Int32Array.from({ length: NMAX }, (_, i) => i + 1);
            let sq = out.steps[0], prevN = 0;
            for (let k = 1; k <= KMAX; k++) {
              const h = sq.s / 2, counts = [0, 0, 0, 0];
              for (const i of idx) if (i > prevN) counts[(D.xs[i] >= sq.x0 + h ? 1 : 0) + (D.ys[i] >= sq.y0 + h ? 2 : 0)]++;
              const best = counts.indexOf(Math.max(...counts));
              if (counts[best] < 3) break;
              sq.counts = counts; sq.pick = best;
              const nx = sq.x0 + (best & 1 ? h : 0), ny = sq.y0 + (best & 2 ? h : 0);
              idx = idx.filter((i) => D.xs[i] >= nx && D.xs[i] < nx + h && D.ys[i] >= ny && D.ys[i] < ny + h);
              let nk = 0; for (const i of idx) if (i > prevN) { nk = i; break; }
              if (!nk) break;
              sq = { x0: nx, y0: ny, s: h, n: nk, counts: null, pick: -1, idx };
              out.steps.push(sq); prevN = nk;
            }
            // counts for the last square too (for the zoom panel)
            const h = sq.s / 2, counts = [0, 0, 0, 0];
            for (const i of (sq.idx || idx)) if (i > prevN) counts[(D.xs[i] >= sq.x0 + h ? 1 : 0) + (D.ys[i] >= sq.y0 + h ? 2 : 0)]++;
            sq.counts = counts; sq.pick = counts.indexOf(Math.max(...counts));
          } else {
            const counts = [0, 0, 0, 0], inQ = [];
            for (let i = 1; i <= NMAX; i++) if (Math.abs(D.xs[i]) < 1 && Math.abs(D.ys[i]) < 1) { counts[(D.xs[i] >= 0 ? 1 : 0) + (D.ys[i] >= 0 ? 2 : 0)]++; inQ.push(i); }
            Object.assign(out.steps[0], { counts, pick: -1, inQ });
          }
          return (cache[key] = out);
        }
        let st = {};
        v.render(() => {
          const key = which.value, R = run(key), D = R.D;
          if (!SEQ[key].bounded) {
            S.setView([-3.4, 3.4], [-3.4, 3.4]);
            const pts = []; for (let n = 1; n <= 700; n++) pts.push([D.xs[n], D.ys[n]]);
            S.rect(-1, -1, 1, 1, { color: 'orange', width: 1.5, dash: [5, 4] });
            S.dots(pts, { color: 'red', r: 2 });
            for (const r of [1, 2, 3]) S.circle(0, 0, r, { color: 'faint', width: 1, dash: [2, 4] });
            S.corner('the terms escape every bounded set', 'tl', { color: 'red', weight: 600 });
            const q0 = R.steps[0];
            Z.setView([-1.12, 1.12], [-1.12, 1.12]);
            Z.setTitle('$Q_0=[-1,1]^2$ holds only finitely many terms');
            Z.rect(-1, -1, 1, 1, { color: 'orange', width: 2.2 });
            Z.line(0, -1, 0, 1, { color: 'orange', width: 1, dash: [4, 4] });
            Z.line(-1, 0, 1, 0, { color: 'orange', width: 1, dash: [4, 4] });
            Z.dots(q0.inQ.map((i) => [D.xs[i], D.ys[i]]), { color: 'red', r: 2.4 });
            q0.counts.forEach((c, j) => Z.text(String(c), (j & 1 ? 0.5 : -0.5), (j & 2 ? 0.5 : -0.5), { align: 'center', size: 15, weight: 600, color: 'red' }));
            v.legend([['red', 'terms $p_n$, $n\\le700$', { dot: true }], ['orange', 'the square $[-1,1]^2$', { dash: true }]]);
            st = { bounded: false, inQ: q0.inQ.length, lastQ: q0.inQ[q0.inQ.length - 1] };
            return;
          }
          S.setView([-1.12, 1.12], [-1.12, 1.12]);
          const K = Math.min(kS.value, R.steps.length - 1);
          const faint = []; for (let n = 1; n <= 2500; n++) faint.push([D.xs[n], D.ys[n]]);
          S.dots(faint, { color: 'muted', r: 1.2, alpha: 0.45 });
          for (let j = 0; j <= K; j++) { const q = R.steps[j]; S.rect(q.x0, q.y0, q.x0 + q.s, q.y0 + q.s, { color: 'orange', width: j === K ? 2.2 : 1.2, alpha: 0.45 + 0.55 * (j / Math.max(1, K)), fill: j === K ? 'orange' : null, fillAlpha: 0.13 }); }
          const chosen = R.steps.slice(1, K + 1).map((q) => [D.xs[q.n], D.ys[q.n]]);
          S.path(chosen, { color: 'gold', width: 1.6 });
          chosen.forEach((c, i) => { S.dot(c[0], c[1], { color: 'gold', r: 4.6 }); if (i < 3) S.tex(`p_{n_${i + 1}}`, c[0], c[1], { color: 'gold', align: 'left', dx: 7, dy: -9, size: 13 }); });
          // zoom panel
          const q = R.steps[K], pad = q.s * 0.06;
          Z.setTitle(`zoom: the current square $Q_{${K}}$ (side $2^{${1 - K}}$)`);
          Z.setView([q.x0 - pad, q.x0 + q.s + pad], [q.y0 - pad, q.y0 + q.s + pad]);
          const inside = []; const src = q.idx || null;
          if (src) { for (let j = 0; j < src.length && inside.length < 3000; j++) inside.push([D.xs[src[j]], D.ys[src[j]]]); }
          else for (let n = 1; n <= 3000; n++) inside.push([D.xs[n], D.ys[n]]);
          Z.rect(q.x0, q.y0, q.x0 + q.s, q.y0 + q.s, { color: 'orange', width: 2.2 });
          const h = q.s / 2;
          if (q.pick >= 0) { const bx = q.x0 + (q.pick & 1 ? h : 0), by = q.y0 + (q.pick & 2 ? h : 0); Z.rect(bx, by, bx + h, by + h, { fill: 'green', fillAlpha: 0.12, stroke: false }); }
          Z.line(q.x0 + h, q.y0, q.x0 + h, q.y0 + q.s, { color: 'orange', width: 1, dash: [4, 4] });
          Z.line(q.x0, q.y0 + h, q.x0 + q.s, q.y0 + h, { color: 'orange', width: 1, dash: [4, 4] });
          Z.dots(inside, { color: 'muted', r: 1.5, alpha: 0.6 });
          if (q.counts) q.counts.forEach((c, j) => { const cx = q.x0 + (j & 1 ? 1.5 : 0.5) * h, cy = q.y0 + (j & 2 ? 1.5 : 0.5) * h; Z.text(c.toLocaleString('en-US'), cx, cy, { align: 'center', size: 15, weight: 600, color: j === q.pick ? 'green' : 'muted' }); });
          if (K > 0) { const c = [D.xs[q.n], D.ys[q.n]]; Z.dot(c[0], c[1], { color: 'gold', r: 5.5 }); Z.tex(`p_{n_{${K}}}`, c[0], c[1], { color: 'gold', align: 'left', dx: 7, dy: -9, size: 13 }); }
          v.legend([['muted', 'terms $p_n$', { dot: true }], ['orange', 'nested squares $Q_k$'], ['gold', 'subsequence $p_{n_k}\\in Q_k$', { dot: true }], ['green', 'quarter kept next', { area: true }]]);
          st = { bounded: true, K, ns: R.steps.slice(1, K + 1).map((s) => s.n), side: q.s, maxK: R.steps.length - 1 };
        });
        v.readout(() => {
          const s = st;
          if (!s.bounded) return `Only $${s.inQ}$ of the $250\\,000$ terms lie in $Q_0$, and none after $n=${s.lastQ}$: no quarter holds infinitely many, so the halving cannot start. Every subsequence is unbounded, hence divergent (3.2(c)).`;
          if (s.K === 0) return 'Step 0: all terms lie in the square $Q_0=[-1,1]^2$, a compact $2$-cell.';
          return `Indices $n_1<\\dots<n_${s.K}$: $${s.ns.join(',\\ ')}$. Every $p_{n_i}$ with $i\\ge${s.K}$ lies in $Q_{${s.K}}$ of side $${v.fmt(s.side, 3)}$, so the subsequence is Cauchy and converges to the single point $\\bigcap_k Q_k$.` + (s.K < kS.value ? ` (Finite data stop the halving at $k=${s.maxK}$.)` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Theorem',
      name: 'Subsequential limits form a closed set',
      statement: String.raw`For a sequence $\{p_n\}$ in a metric space $X$, the set $E^*$ of all subsequential limits of $\{p_n\}$ is closed in $X$.`,
      idea: String.raw`Let $q$ be a limit point of $E^*$, choose $n_1$ with $p_{n_1}\ne q$ and put $\delta=d(q,p_{n_1})$. Having chosen $n_1<\dots<n_{i-1}$, take a subsequential limit $x\in E^*$ with $d(x,q)<2^{-i}\delta$; infinitely many terms lie within $2^{-i}\delta$ of $x$, so one of them has an index $n_i>n_{i-1}$. Then $d(p_{n_i},q)<2^{1-i}\delta$, so $p_{n_i}\to q$ and $q\in E^*$.`,
      caption: String.raw`The horizontal axis is $\log_{10}n$. Drag $q$ along the green column on the right, where $E^*$ is drawn next to the range of the sequence. Raise $i$ to run the diagonal construction: the gold terms $p_{n_1},p_{n_2},\dots$ close in on $q$. In the first listing $0$ is never a term, yet it is a subsequential limit; in the listing of the rationals every point of $[0,1]$ — rational or not — is.`,
      deps: ['pma-3.5', 'pma-2.18'],
      tags: ['subsequences', 'closed sets'],
      viz(v) {
        const NMAX = 12000;
        const recip = [null]; for (let m = 1; recip.length <= NMAX; m++) for (let k = 1; k <= m && recip.length <= NMAX; k++) recip.push(1 / k);
        const gcd = (a, b) => (b ? gcd(b, a % b) : a);
        const rat = [null]; for (let qd = 1; rat.length <= NMAX; qd++) for (let pn = 0; pn <= qd && rat.length <= NMAX; pn++) if (gcd(pn, qd) === 1) rat.push(pn / qd);
        const LIST = {
          recip: { label: '$1;\\ 1,\\tfrac12;\\ 1,\\tfrac12,\\tfrac13;\\ \\dots$', a: recip },
          rat: { label: 'all rationals in $[0,1]$', a: rat },
        };
        const which = v.select('sequence', Object.entries(LIST).map(([value, s]) => ({ value, label: s.label })), 'recip');
        const iS = v.slider('diagonal steps $i$', 1, 7, 5, { int: true });
        const lg = Math.log10;
        const S = v.stage({ x: [-0.05, 5.3], y: [-0.07, 1.13], height: 360, axes: 'box', full: true, xticks: [[0, '1'], [1, '10'], [2, '100'], [3, '1000'], [4, '10⁴']], title: 'terms $p_n$ against $n$ (log scale), and on the right: the range beside $E^*$' });
        const C = S, RX = 4.6, COLX = 5.05;
        const inStar = (key, y) => key === 'rat' ? (y >= 0 && y <= 1) : (y < 1e-9 || Math.abs(1 / y - Math.round(1 / y)) < 1e-9);
        const Q = C.handle(COLX, 0, { color: 'accent', label: 'q', constrain: (x, y) => {
          y = Math.max(0, Math.min(1, y));
          if (which.value === 'recip') { if (y < 0.012) return [COLX, 0]; const k = Math.round(1 / y); if (k >= 1 && Math.abs(1 / k - y) < 0.018) return [COLX, 1 / k]; }
          return [COLX, y];
        } });
        let st = {}, lastKey = null;
        v.render(() => {
          const key = which.value, A = LIST[key].a;
          if (key !== lastKey) { lastKey = key; Q.y = key === 'recip' ? 0 : 1 / Math.SQRT2; }
          const q = Q.y, I = iS.value;
          // diagonal construction
          let n1 = 1; while (n1 < NMAX && Math.abs(A[n1] - q) < 1e-12) n1++;
          const delta = Math.abs(A[n1] - q);
          const member = inStar(key, q);
          const picks = []; let prevN = n1, fail = false;
          picks.push({ n: n1, x: null });
          if (member) {
            for (let i = 2; i <= I + 1; i++) {
              const tol = delta * Math.pow(2, -i);
              let x = q;
              if (key === 'recip' && q < 1e-9) x = 1 / (Math.floor(1 / tol) + 1);
              let found = 0; for (let n = prevN + 1; n <= NMAX; n++) if (Math.abs(A[n] - x) < tol) { found = n; break; }
              if (!found) { fail = true; break; }
              picks.push({ n: found, x }); prevN = found;
            }
          }
          // nearest distance to E* and count of terms near q (if q not in E*)
          let gap = 0, cnt = 0;
          if (!member) { gap = Infinity; for (let k = 1; k <= 400; k++) gap = Math.min(gap, Math.abs(1 / k - q)); gap = Math.min(gap, q); for (let n = 1; n <= NMAX; n++) if (Math.abs(A[n] - q) < gap / 2) cnt++; }
          // left panel
          const pts = []; for (let n = 1; n <= NMAX; n++) pts.push([lg(n), A[n]]);
          S.dots(pts, { color: 'muted', r: 1.3, alpha: 0.55 });
          S.hline(q, { color: 'accent', width: 1.2, dash: [5, 4] });
          if (!member) S.hband(q - gap / 2, q + gap / 2, { color: 'red', alpha: 0.12 });
          const gp = picks.map((p) => [lg(p.n), A[p.n]]);
          if (member) { S.path(gp, { color: 'gold', width: 1.6 }); gp.forEach((g, i) => { S.dot(g[0], g[1], { color: 'gold', r: 4.8 }); if (i < 4) S.tex(`p_{n_{${i + 1}}}`, g[0], g[1], { color: 'gold', align: 'left', dx: 6, dy: -10, size: 13 }); }); }
          // right column
          C.rect(4.3, -0.07, 5.3, 1.1, { fill: 'bg', fillAlpha: 0.9, stroke: false });
          C.line(4.3, -0.07, 4.3, 1.1, { color: 'faint', width: 1 });
          C.text('range', RX, 1.07, { align: 'center', color: 'muted', size: 12 });
          C.tex('E^*', COLX, 1.07, { color: 'green', size: 14 });
          C.line(RX, 0, RX, 1, { color: 'faint', width: 1 });
          C.line(COLX, 0, COLX, 1, { color: 'faint', width: 1 });
          if (key === 'recip') {
            for (let k = 1; k <= 120; k++) { C.line(RX - 0.09, 1 / k, RX + 0.09, 1 / k, { color: 'muted', width: 1, alpha: 0.7 }); C.dot(COLX, 1 / k, { color: 'green', r: k < 12 ? 3.2 : 2, ring: false }); }
            C.dot(COLX, 0, { color: 'green', r: 5.5, hollow: true, width: 2.2 });
            C.text('0 ∉ range', RX, -0.035, { align: 'center', color: 'red', size: 11 });
          } else {
            for (let k = 1; k <= 400; k++) C.line(RX - 0.09, rat[k], RX + 0.09, rat[k], { color: 'muted', width: 0.8, alpha: 0.5 });
            C.line(COLX, 0, COLX, 1, { color: 'green', width: 5, cap: 'butt' });
          }
          if (member && picks.length > 1) picks.slice(1).forEach((p) => { if (p.x !== q) C.dot(COLX, p.x, { color: 'gold', r: 4, hollow: true, width: 1.8 }); });
          v.legend([['muted', 'terms $p_n$', { dot: true }], ['gold', 'diagonal subsequence $p_{n_i}\\to q$', { dot: true }], ['green', 'subsequential limits $E^*$', { dot: true }]]);
          st = { member, picks, delta, fail, q, key, gap, cnt };
        });
        v.readout(() => {
          const s = st; if (!s.picks) return '';
          if (!s.member) return `$q=${v.fix(s.q, 3)}$ is at distance $${v.fix(s.gap, 3)}$ from $E^*$; the red strip of half-width $${v.fix(s.gap / 2, 3)}$ holds only ${s.cnt} term${s.cnt === 1 ? '' : 's'}, so $q$ is neither a subsequential limit nor a limit point of $E^*$.`;
          const ns = s.picks.map((p) => p.n);
          return `$\\delta=${v.fix(s.delta, 3)}$; indices $n_i$: $${ns.join(',\\ ')}$ with $|p_{n_i}-q|<2^{1-i}\\delta$` + (s.key === 'recip' && s.q < 1e-9 ? ' — via the subsequential limits $x_i=1/k_i$ (hollow gold) creeping down to $0$.' : '.') + (s.fail ? ' (Beyond this, the tolerance needs indices past $12\\,000$.)' : '');
        });
      },
    },
  ],
};
