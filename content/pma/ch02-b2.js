// Rudin, Principles of Mathematical Analysis — Chapter 2: Basic Topology (part b2: nested cells, Heine–Borel, Weierstrass, 2.38–2.42)

// ---------------------------------------------------------------- shared helpers
/** A number as TeX: plain decimals when moderate, a×10^k otherwise. */
function sci(x, d = 4) {
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e-3 && a < 1e5) return String(Number(x.toPrecision(d)));
  const e = Math.floor(Math.log10(a)), m = x / 10 ** e;
  return `${Number(m.toPrecision(d))}\\times10^{${e}}`;
}

/** Seeded nested intervals [a_n,b_n] (n = 1..n) starting from [lo,hi]; lengths shrink by a random factor in [u0,u1]. */
function nestedIntervals(seed, n, lo, hi, u0 = 0.5, u1 = 0.8, rngf) {
  const r = rngf(seed); const a = [], b = []; let A = lo, B = hi;
  for (let i = 0; i < n; i++) {
    a.push(A); b.push(B);
    const L = B - A, nl = L * r.uniform(u0, u1), w = r();
    A = A + (L - nl) * w; B = A + nl;
  }
  return { a, b };
}

/** Vertical number-line bar at abscissa x from y=a to y=b (closed or open ends). */
function vbar(s, x, a, b, st = {}) {
  const col = st.color || 'accent';
  s.line(x, a, x, b, { color: col, width: st.width ?? 7, cap: 'butt', alpha: st.alpha, dash: st.dash });
  const [lo, hi] = st.open || [false, false];
  if (st.ends !== false) { s.dot(x, a, { color: col, hollow: lo, r: st.r ?? 3.8, alpha: st.alpha }); s.dot(x, b, { color: col, hollow: hi, r: st.r ?? 3.8, alpha: st.alpha }); }
}

export default {
  book: 'pma',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.38
    {
      num: '2.38',
      kind: 'Theorem',
      name: 'Nested interval theorem',
      statement: String.raw`If $I_1\supset I_2\supset I_3\supset\cdots$ is a decreasing sequence of intervals $I_n=[a_n,b_n]$ in $\R^1$ (closed and bounded, as in 2.17), then $\bigcap_{n=1}^\infty I_n$ is not empty.`,
      idea: String.raw`Nestedness gives $a_n\le a_{m+n}\le b_{m+n}\le b_m$ for all $m,n$, so the left endpoints form a nonempty set bounded above by every $b_m$. By the least-upper-bound property its supremum $x$ exists and satisfies $a_m\le x\le b_m$ for every $m$, i.e. $x\in I_m$ for all $m$.`,
      caption: String.raw`Each interval $I_n=[a_n,b_n]$ is drawn as a vertical bar above $n$; the right panel zooms in on $I_N$. The green line $x=\sup_n a_n$ passes through every bar. With open intervals $(0,\tfrac4n)$ the supremum $0$ lies in none of them; with rational points only, the supremum is $\sqrt2$, which is not there to be found.`,
      deps: ['pma-1.19', 'pma-2.17'],
      tags: ['nested intervals', 'least upper bound'],
      viz(v) {
        const fam = v.select('', [{ value: 'closed', label: 'closed $[a_n,b_n]$' }, { value: 'open', label: 'open $(0,\\tfrac4n)$' }, { value: 'rat', label: '$[a_n,b_n]\\cap\\mathbb{Q}$, endpoints $\\to\\sqrt2$' }], 'closed');
        const nN = v.slider('$N$', 1, 14, 10, { int: true });
        let seed = 5;
        v.button('new sequence', () => { seed += 1; });
        const L = v.stage({ x: [0.3, 14.7], y: [-0.25, 4.25], height: 340, axes: 'box', weight: 1.5, title: '$I_1\\supset I_2\\supset\\dots\\supset I_N$', xticks: [1, 2, 4, 6, 8, 10, 12, 14] });
        const Z = v.stage({ x: [0.3, 14.7], y: [0, 1], height: 340, axes: 'box', minWidth: 240, title: 'zoom on $I_N$', xticks: [] });
        const SQ2 = Math.SQRT2;
        function family(kind, n) {
          if (kind === 'closed') { const F = nestedIntervals(seed, 70, 0, 4, 0.5, 0.82, v.rng); return { a: F.a.slice(0, n), b: F.b.slice(0, n), sup: Math.max(...F.a), inf: Math.min(...F.b), open: [false, false] }; }
          if (kind === 'open') { const a = [], b = []; for (let k = 1; k <= n; k++) { a.push(0); b.push(4 / k); } return { a, b, sup: 0, inf: 0, open: [true, true] }; }
          const a = [], b = []; for (let k = 1; k <= n; k++) { const s = Math.floor(SQ2 * 2 ** k) / 2 ** k; a.push(s); b.push(s + 2 ** -k); } return { a, b, sup: SQ2, inf: SQ2, open: [false, false] };
        }
        let st = null;
        v.render(() => {
          const kind = fam.value, N = nN.value, F = family(kind, N);
          L.setView([0.3, Math.max(N, 6) + 0.7], kind === 'rat' ? [0.95, 1.55] : [-0.45, 4.25]);
          Z.setView([-0.9, Math.max(N, 6) + 0.7], null);
          const len = F.b[N - 1] - F.a[N - 1];
          const zc = kind === 'open' ? len * 0.45 : (F.a[N - 1] + F.b[N - 1]) / 2, zh = Math.max(len * 1.6, 1e-9);
          Z.setView(null, [zc - zh, zc + zh]);
          for (const S of [L, Z]) {
            const good = kind === 'closed';
            S.hline(F.sup, { color: good ? 'green' : 'red', width: 1.6, dash: good ? null : [5, 4] });
            for (let k = 0; k < N; k++) vbar(S, k + 1, F.a[k], F.b[k], { color: k === N - 1 ? 'accent' : 'accent', alpha: k === N - 1 ? 1 : 0.55, open: F.open, dash: kind === 'rat' ? [2, 3] : null, width: kind === 'rat' ? 5 : 7 });
          }
          const lab = kind === 'closed' ? 'x = sup aₙ' : kind === 'open' ? '0 = sup aₙ ∉ Iₙ' : '√2 = sup aₙ ∉ ℚ';
          L.corner(lab, 'tr', { color: kind === 'closed' ? 'green' : 'red', weight: 600 });
          Z.text(kind === 'closed' ? 'x' : kind === 'open' ? '0' : '√2', Math.max(N, 6) + 0.6, F.sup, { color: kind === 'closed' ? 'green' : 'red', align: 'right', baseline: 'bottom', dy: -3, size: 15, math: true });
          st = { kind, N, F, len };
        });
        v.legend([['accent', 'intervals $I_n$ (newest darkest)'], ['green', '$x=\\sup_n a_n$, a common point']]);
        v.readout(() => {
          const s = st; if (!s) return '';
          const { F, N } = s;
          if (s.kind === 'closed') return `$\\sup_n a_n = ${v.fix(F.sup, 6)}$, $\\;\\inf_n b_n = ${v.fix(F.inf, 6)}$. For instance $a_{${N}} = ${v.fix(F.a[N - 1], 6)} \\le x \\le ${v.fix(F.b[N - 1], 6)} = b_{${N}}$: $x$ lies in every $I_n$.`;
          if (s.kind === 'open') return `Every $I_n$ — down to $I_{${N}}=(0,\\,${v.fmt(4 / N, 3)})$ — is nonempty and they are nested, but $\\sup_n a_n = 0$ belongs to none of them: $\\bigcap_n I_n=\\emptyset$. The theorem needs closed intervals.`;
          return `$a_{${N}} = ${F.a[N - 1] * 2 ** N}/2^{${N}}$ and $b_{${N}}$ are rational and the sets $I_n\\cap\\mathbb{Q}$ are nested and nonempty, but $\\sup_n a_n=\\sqrt2\\notin\\mathbb{Q}$: in $\\mathbb{Q}$ the intersection is empty. The proof needs the least-upper-bound property.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.39
    {
      num: '2.39',
      kind: 'Theorem',
      name: 'Nested k-cells have a common point',
      statement: String.raw`Let $k$ be a positive integer. If $I_1\supset I_2\supset I_3\supset\cdots$ is a decreasing sequence of $k$-cells in $\R^k$, then $\bigcap_{n=1}^\infty I_n$ is not empty.`,
      idea: String.raw`Write $I_n=\{x: a_{n,j}\le x_j\le b_{n,j},\ 1\le j\le k\}$. For each coordinate $j$ the intervals $[a_{n,j},b_{n,j}]$ are nested, so 2.38 gives a number $x_j^*$ in all of them. The point $x^*=(x_1^*,\dots,x_k^*)$ then lies in every $I_n$.`,
      caption: String.raw`Nested rectangles ($k=2$; the right panel follows $I_N$ as it shrinks). Their shadows on the two axes are nested intervals — darker where more of them overlap — and 2.38 gives a common point in each shadow. Together the two coordinates give the green point $x^*$. With open rectangles $(0,\tfrac4n)^2$ the candidate $x^*=(0,0)$ is in none of them.`,
      deps: ['pma-2.38', 'pma-2.17'],
      tags: ['nested intervals', 'k-cells'],
      viz(v) {
        const fam = v.select('', [{ value: 'closed', label: 'closed $2$-cells' }, { value: 'open', label: 'open $(0,\\tfrac4n)\\times(0,\\tfrac4n)$' }], 'closed');
        const nN = v.slider('$N$', 1, 12, 7, { int: true });
        let seed = 11;
        v.button('new sequence', () => { seed += 1; });
        const L = v.stage({ x: [-0.75, 4.3], y: [-0.75, 4.3], equal: true, height: 380, axes: false, weight: 1.2, title: '$I_1\\supset\\dots\\supset I_N$ and their shadows on the axes' });
        const Z = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 380, axes: false, minWidth: 240, title: 'following $I_N$' });
        function cells(kind, n) {
          if (kind === 'open') return { r: Array.from({ length: n }, (_, k) => [0, 0, 4 / (k + 1), 4 / (k + 1)]), star: [0, 0], open: true };
          const X = nestedIntervals(seed, 60, 0, 4, 0.5, 0.8, v.rng), Y = nestedIntervals(seed * 7 + 3, 60, 0, 4, 0.5, 0.8, v.rng);
          return { r: Array.from({ length: n }, (_, k) => [X.a[k], Y.a[k], X.b[k], Y.b[k]]), star: [Math.max(...X.a), Math.max(...Y.a)], open: false };
        }
        let st = null;
        v.render(() => {
          const kind = fam.value, N = nN.value, C = cells(kind, N), [sx, sy] = C.star;
          const last = C.r[N - 1], w = last[2] - last[0], hh = last[3] - last[1];
          const half = Math.max(w, hh) * 0.85;
          const cx = kind === 'open' ? half * 0.6 : (last[0] + last[2]) / 2, cy = kind === 'open' ? half * 0.6 : (last[1] + last[3]) / 2;
          Z.setView([cx - half, cx + half], [cy - half, cy + half]);
          const yb = -0.4, xb = -0.4; // shadow baselines in the overview
          for (const S of [L, Z]) {
            const good = kind === 'closed';
            C.r.forEach(([a, c, b, d], k) => {
              const newest = k === N - 1;
              S.rect(a, c, b, d, { fill: S === L || newest ? 'accent' : null, fillAlpha: newest ? 0.14 : 0.05, color: 'accent', width: newest ? 2.4 : 1.2, alpha: newest ? 1 : 0.5, dash: C.open ? [5, 4] : null });
            });
            if (good) S.dot(sx, sy, { color: 'green', r: S === Z ? 6 : 4.5 });
            else S.dot(0, 0, { color: 'red', r: S === Z ? 6 : 4.5, hollow: true, width: 2 });
          }
          // shadows (overview only)
          L.line(-0.6, yb, 4.2, yb, { color: 'faint', width: 1 }); L.line(xb, -0.6, xb, 4.2, { color: 'faint', width: 1 });
          C.r.forEach(([a, c, b, d]) => { L.line(a, yb, b, yb, { color: 'accent', width: 9, cap: 'butt', alpha: 0.2 }); L.line(xb, c, xb, d, { color: 'accent', width: 9, cap: 'butt', alpha: 0.2 }); });
          const good = kind === 'closed';
          L.line(sx, sy, sx, yb, { color: good ? 'green' : 'red', width: 1.1, dash: [3, 3] });
          L.line(sx, sy, xb, sy, { color: good ? 'green' : 'red', width: 1.1, dash: [3, 3] });
          L.dot(sx, yb, { color: good ? 'green' : 'red', r: 4, hollow: !good });
          L.dot(xb, sy, { color: good ? 'green' : 'red', r: 4, hollow: !good });
          L.tex('x_1^*', sx, yb - 0.08, { color: good ? 'green' : 'red', baseline: 'top', size: 13 });
          L.tex('x_2^*', xb - 0.08, sy, { color: good ? 'green' : 'red', align: 'right', size: 13 });
          L.tex('x^*', sx + 0.08, sy + 0.08, { color: good ? 'green' : 'red', align: 'left', baseline: 'bottom', size: 14 });
          Z.corner(`side ≈ ${v.fmt(Math.max(w, hh), 3)}`, 'tr');
          st = { kind, N, sx, sy, last };
        });
        v.legend([['accent', '$k$-cells $I_n$ and their shadows', { area: true }], ['green', '$x^*=(\\sup_n a_{n,1},\\,\\sup_n a_{n,2})$', { dot: true }]]);
        v.readout(() => {
          const s = st; if (!s) return '';
          const [a, c, b, d] = s.last;
          if (s.kind === 'closed') return `$x^* = (${v.fix(s.sx, 5)},\\ ${v.fix(s.sy, 5)})$ and $I_{${s.N}} = [${v.fix(a, 4)}, ${v.fix(b, 4)}]\\times[${v.fix(c, 4)}, ${v.fix(d, 4)}]$ contains it — as does every other $I_n$.`;
          return `Each coordinate gives $\\sup_n a_{n,j} = 0$, but $(0,0)$ lies in no open square $(0,\\tfrac4n)^2$: the intersection is empty. $k$-cells are closed by definition, and that matters.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.40
    {
      num: '2.40',
      kind: 'Theorem',
      name: 'Every k-cell is compact',
      statement: String.raw`Every $k$-cell $I=\{x\in\R^k: a_j\le x_j\le b_j,\ 1\le j\le k\}$ is compact.`,
      idea: String.raw`Suppose an open cover $\{G_\alpha\}$ of $I$ had no finite subcover. Bisect every edge: of the $2^k$ sub-cells at least one, $I_1$, has no finite subcover either; repeat to get nested cells $I_n$ of diameter $2^{-n}\delta$ with the same defect. By 2.39 they share a point $x^*$, which lies in some $G_\alpha$ together with a ball $N_r(x^*)$. Once $2^{-n}\delta<r$ (the Archimedean property), $I_n\subset G_\alpha$ — a one-set subcover, contradiction.`,
      caption: String.raw`The square is covered by the balls $B(x,r(x))$, $x\in I$. A cell is subdivided until it fits inside the ball about its own centre; the leaves give a finite subcover (drag $q$ to see the ball that swallows its cell). Drag the point $c$ where the radii are smallest. Choose $r(c)=0$: then $c$ is in no ball, the family is not a cover, and the red cells containing $c$ are subdivided for ever — the nested cells of the proof, closing in on the uncovered point.`,
      deps: ['pma-2.39', 'pma-2.32', 'pma-1.20'],
      tags: ['compactness', 'k-cells', 'bisection'],
      viz(v) {
        const M = v.M;
        const kind = v.select('radii', [{ value: 'pos', label: '$r(x)=r_0+0.35\\,|x-c|$' }, { value: 'zero', label: '$r(x)=0.35\\,|x-c|$, so $r(c)=0$' }], 'pos');
        const r0 = v.slider('$r_0$', 0.005, 0.15, 0.03, { step: 0.005 });
        const S = v.stage({ x: [-0.04, 1.04], y: [-0.04, 1.04], equal: true, height: 400, axes: false, title: 'the $k$-cell $I=[0,1]^2$, subdivided' });
        const Z = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 400, axes: false, minWidth: 240, title: 'zoom around $c$' });
        const c = S.handle(0.62, 0.38, { color: 'purple', label: 'c', constrain: { x: [0, 1], y: [0, 1] } });
        const q = S.handle(0.2, 0.75, { color: 'accent', label: 'q', constrain: { x: [0, 1], y: [0, 1] } });
        const MAXD = 9;
        let st = null;
        v.render(() => {
          const zero = kind.value === 'zero', rr0 = zero ? 0 : r0.value;
          const r = (x, y) => rr0 + 0.35 * Math.hypot(x - c.x, y - c.y);
          const leaves = [], bad = [];
          (function sub(x0, y0, s, d) {
            const mx = x0 + s / 2, my = y0 + s / 2, h = s * Math.SQRT1_2;
            if (r(mx, my) > h) { leaves.push([x0, y0, s, d]); return; }
            if (d >= MAXD) { bad.push([x0, y0, s, d]); return; }
            const t = s / 2; sub(x0, y0, t, d + 1); sub(x0 + t, y0, t, d + 1); sub(x0, y0 + t, t, d + 1); sub(x0 + t, y0 + t, t, d + 1);
          })(0, 0, 1, 0);
          // zoom window: a few cells around c
          const zs = zero ? 2 ** -(MAXD - 4) : Math.max(0.05, rr0 * 4);
          Z.setView([c.x - zs, c.x + zs], [c.y - zs, c.y + zs]);
          const O = 'orange';
          for (const P of [S, Z]) {
            P.rect(0, 0, 1, 1, { fill: 'accent', fillAlpha: 0.06, color: 'accent', width: 2 });
            for (const [x0, y0, s, d] of leaves) P.rect(x0, y0, x0 + s, y0 + s, { fill: O, fillAlpha: 0.05 + 0.035 * Math.min(d, 8), color: 'ink', width: 0.6, alpha: 0.35 });
            for (const [x0, y0, s] of bad) P.rect(x0, y0, x0 + s, y0 + s, { fill: 'red', fillAlpha: 0.55, stroke: false });
            if (zero) {
              // the chain of cells containing c
              let x0 = 0, y0 = 0, s = 1;
              for (let d = 0; d <= MAXD; d++) { P.rect(x0, y0, x0 + s, y0 + s, { color: 'red', width: 1.6, alpha: 0.9 }); s /= 2; if (c.x >= x0 + s) x0 += s; if (c.y >= y0 + s) y0 += s; }
            }
          }
          // in the zoom: the ball about the leaf that contains c (the smallest balls live here)
          const lc = leaves.find(([x0, y0, s]) => c.x >= x0 && c.x <= x0 + s && c.y >= y0 && c.y <= y0 + s);
          if (lc) { const [x0, y0, s] = lc, mx = x0 + s / 2, my = y0 + s / 2; Z.circle(mx, my, r(mx, my), { color: 'orange', width: 1.8, dash: [5, 4] }); Z.rect(x0, y0, x0 + s, y0 + s, { color: 'purple', width: 1.8 }); }
          // the ball swallowing q's leaf
          const lf = leaves.find(([x0, y0, s]) => q.x >= x0 && q.x <= x0 + s && q.y >= y0 && q.y <= y0 + s);
          if (lf) {
            const [x0, y0, s] = lf, mx = x0 + s / 2, my = y0 + s / 2, R = r(mx, my);
            for (const P of [S, Z]) {
              P.circle(mx, my, R, { color: 'orange', width: 2, fill: 'orange', fillAlpha: 0.12 });
              P.rect(x0, y0, x0 + s, y0 + s, { color: 'accent', width: 2.2 });
              P.dot(mx, my, { color: 'orange', r: 3 });
            }
          }
          st = { zero, n: leaves.length, nb: bad.length, lf, rmin: rr0 };
        });
        v.legend([['orange', 'leaf cells (darker = deeper)', { area: true }], ['orange', '$B(m,r(m))$ about a leaf\'s centre $m$'], ['red', 'cells that never fit in one ball', { area: true }]]);
        v.readout(() => {
          const s = st; if (!s) return '';
          if (!s.zero) return `${s.n} leaf cells, each inside the ball about its own centre: **${s.n} members** of the cover already cover $I$. Every radius is at least $r_0=${v.fix(s.rmin, 3)}$, so no cell needs diameter below $r_0$ — the subdivision must stop.`;
          return `$r(c)=0$: the point $c$ lies in no ball, so this family is **not** a cover of $I$. ${s.n} cells fit inside balls, but the cells containing $c$ (red chain) never do; after ${MAXD} halvings ${s.nb} red cells remain, and their nested intersection is exactly $\\{c\\}$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.41
    {
      num: '2.41',
      kind: 'Theorem',
      name: 'Heine–Borel theorem',
      statement: String.raw`For a set $E\subset\R^k$ the following three properties are equivalent:
(a) $E$ is closed and bounded;
(b) $E$ is compact;
(c) every infinite subset of $E$ has a limit point in $E$.`,
      idea: String.raw`(a)⇒(b): a bounded $E$ sits inside a $k$-cell, which is compact (2.40), and closed subsets of compact sets are compact (2.35). (b)⇒(c) is 2.37. (c)⇒(a): if $E$ were unbounded, points $x_n\in E$ with $|x_n|>n$ would form an infinite set with no limit point at all; if $E$ were not closed, points $x_n\in E$ with $|x_n-x_0|<1/n$ for a limit point $x_0\notin E$ would form an infinite set whose only limit point, $x_0$, is outside $E$ (2.20). The equivalence (b)⇔(c) holds in every metric space; (a)⇒(b) is special to $\R^k$.`,
      caption: String.raw`Pick a set. Gold: an infinite subset $S\subset E$ and where it accumulates. Orange: an open cover and whether finitely many of its members suffice. The scorecard in the corner always shows three ✓ or three ✗ — the properties stand or fall together. Raise $N$ to add more witnesses.`,
      deps: ['pma-2.40', 'pma-2.35', 'pma-2.37', 'pma-2.20'],
      see: ['fa-1.23', 'fa-3.15'],
      tags: ['compactness', 'Heine–Borel'],
      viz(v) {
        const M = v.M;
        const p0 = [Math.cos(0.65), Math.sin(0.65)];
        const SETS = {
          disc: { label: 'closed disc' },
          open: { label: 'open disc' },
          strip: { label: 'closed strip $|y|\\le\\tfrac12$' },
          seq: { label: '$\\{0\\}\\cup\\{\\tfrac1n\\}$ (on a line)' },
        };
        const which = v.select('$E$', Object.entries(SETS).map(([value, o]) => ({ value, label: o.label })), 'disc');
        const nN = v.slider('witnesses $N$', 3, 40, 14, { int: true });
        const S = v.stage({ x: [-2.6, 2.6], y: [-1.35, 1.35], equal: true, height: 380, axes: false });
        let st = null;
        v.render(() => {
          const key = which.value, N = nN.value;
          const A = v.rgb('accent'), theme = v.color('accent');
          let a, b, c; // the three properties
          if (key === 'disc' || key === 'open') {
            S.raster((x, y) => (x * x + y * y < 1 ? [A[0], A[1], A[2], 60] : null), { key: 'd' + theme, res: 2 });
            S.circle(0, 0, 1, { color: 'accent', width: 2.2, dash: key === 'open' ? [7, 5] : null });
            // S: x_n → p0
            const xs = M.range(N, 1).map((n) => { const t = 0.65 + 0.9 * Math.sin(2.1 * n) / n, r = 1 - 0.6 / n; return [r * Math.cos(t), r * Math.sin(t)]; });
            S.dots(xs, { color: 'gold', r: 3.4 });
            if (key === 'disc') {
              S.dot(p0[0], p0[1], { color: 'green', r: 5.5, label: 'limit point ∈ E', labelPos: 'ne' });
              // finite subcover: a few balls of radius 0.45 centred on a grid of E
              const ctrs = []; for (let x = -0.9; x <= 0.91; x += 0.6) for (let y = -0.9; y <= 0.91; y += 0.6) if (x * x + y * y <= 1.25) ctrs.push([x, y]);
              // the covering radius actually needed: max over (sampled) E of the distance to the nearest centre
              let worst = 0; for (let rr = 0; rr <= 1.0001; rr += 0.02) for (let t = 0; t < 1; t += 0.004) { const x = rr * Math.cos(t * M.TAU), y = rr * Math.sin(t * M.TAU); worst = Math.max(worst, Math.min(...ctrs.map(([a, b]) => Math.hypot(x - a, y - b)))); }
              for (const [x, y] of ctrs) S.circle(x, y, 0.5, { color: 'orange', width: 1.2, alpha: 0.75 });
              S.corner(`${ctrs.length} balls of radius 0.5 cover E (every point is within ${v.fix(worst, 3)} of a centre)`, 'br', { color: 'orange' });
              a = b = c = true;
            } else {
              S.dot(p0[0], p0[1], { color: 'red', r: 5.5, hollow: true, width: 2.2, label: 'limit point ∉ E', labelPos: 'ne' });
              for (let n = 1; n <= N; n++) S.circle(0, 0, 1 - 1 / (n + 1), { color: 'orange', width: 1, alpha: 0.6 });
              const rN = 1 - 1 / (N + 1);
              S.raster((x, y) => { const d = x * x + y * y; return d < 1 && d >= rN * rN ? [210, 52, 79, 90] : null; }, { key: 'gap' + N, id: 'gap', res: 2 });
              S.corner('Gₙ = {|x| < 1 − 1/(n+1)}: finitely many miss a ring (red)', 'br', { color: 'orange' });
              a = b = c = false;
            }
          } else if (key === 'strip') {
            S.rect(-3, -0.5, 3, 0.5, { fill: 'accent', fillAlpha: 0.22, stroke: false });
            S.hline(0.5, { color: 'accent', width: 2.2 }); S.hline(-0.5, { color: 'accent', width: 2.2 });
            const xs = M.range(N, 1).map((n) => [-2.3 + 0.45 * (n - 1), 0.3 * Math.sin(1.9 * n)]);
            S.dots(xs.filter((p) => p[0] < 2.7), { color: 'gold', r: 3.4 });
            S.arrow(1.9, 0.75, 2.5, 0.75, { color: 'red', head: 9 });
            S.text('S escapes: no limit point', 1.85, 0.75, { color: 'red', size: 12, align: 'right' });
            for (let n = 1; n <= N; n++) S.circle(-2.3, 0, 0.6 * n, { color: 'orange', width: 1, alpha: 0.6 });
            S.corner('Gₙ = B((−2.3, 0), 0.6n): finitely many leave the far strip uncovered', 'br', { color: 'orange' });
            a = b = c = false;
          } else {
            const pts = [[-1.8, 0]].concat(M.range(80, 1).map((n) => [-1.8 + 3.6 / n, 0]));
            S.line(-2.4, 0, 2.4, 0, { color: 'faint', width: 1 });
            S.dots(pts, { color: 'accent', r: 3.6 });
            S.dot(-1.8, 0, { color: 'green', r: 5.5, label: '0 ∈ E', labelPos: 's' });
            const xs = pts.slice(1, N + 1);
            S.dots(xs.map(([x]) => [x, 0.18]), { color: 'gold', r: 3 });
            // cover: one ball about 0 plus a ball about each 1/n
            const eps = 0.5; S.circle(-1.8, 0, eps, { color: 'orange', width: 2, fill: 'orange', fillAlpha: 0.1 });
            let m = 0; for (const [x] of pts.slice(1)) if (x - -1.8 >= eps) { S.circle(x, 0, Math.min(0.25, 0.8 * (x + 1.8) / 4), { color: 'orange', width: 1.2, alpha: 0.8 }); m++; }
            S.corner(`the ball about 0 holds all but ${m} points: ${m + 1} sets suffice`, 'br', { color: 'orange' });
            a = b = c = true;
          }
          // scorecard
          const rows = [['(a) closed and bounded', a], ['(b) compact', b], ['(c) infinite subsets have limit points in E', c]];
          rows.forEach(([t, ok], i) => S.textPx(`${ok ? '✓' : '✗'}  ${t}`, 12, 18 + 19 * i, { color: ok ? 'green' : 'red', size: 12.5, weight: 600 }));
          st = { key, a };
        });
        v.legend([['accent', '$E$', { area: true }], ['gold', 'infinite subset $S\\subset E$', { dot: true }], ['orange', 'open cover']]);
        v.readout(() => {
          const s = st; if (!s) return '';
          return {
            disc: 'Closed and bounded, hence compact (2.40 + 2.35), hence every infinite subset accumulates at a point of $E$ (2.37).',
            open: 'Not closed: the boundary point is a limit point of $E$ outside $E$. The nested open discs $G_n$ cover $E$ with no finite subcover, and $S$ accumulates only at a point not in $E$.',
            strip: 'Closed but unbounded: $S$ has no limit point anywhere, and the growing balls $G_n$ cover $E$ without a finite subcover.',
            seq: 'A countable compact set: every neighbourhood of $0$ contains all but finitely many points $\\tfrac1n$, which is exactly why finitely many sets of any open cover suffice.',
          }[s.key];
        });
      },
    },

    // ------------------------------------------------------------------ 2.42
    {
      num: '2.42',
      kind: 'Theorem',
      name: 'Weierstrass (Bolzano–Weierstrass) theorem',
      statement: String.raw`Every bounded infinite subset of $\R^k$ has a limit point in $\R^k$.`,
      idea: String.raw`A bounded set $E$ lies in some $k$-cell $I$, which is compact by 2.40; by 2.37 the infinite set $E$ then has a limit point in $I$. Unwinding the proofs gives the familiar bisection: of the $2^k$ halves of a cell holding infinitely many points of $E$, at least one again holds infinitely many, and the nested cells shrink to a limit point.`,
      caption: String.raw`$E=\{x_1,x_2,\dots\}$; the first 20000 points are used. Each step halves the current square and keeps a quarter holding the most of them — a finite stand-in for "infinitely many". The right panel shows the kept square magnified. For the bounded sets the squares close in on a limit point; for the unbounded spiral every square eventually holds only finitely many points.`,
      deps: ['pma-2.40', 'pma-2.37'],
      see: ['pma-3.6'],
      tags: ['compactness', 'limit points', 'bisection'],
      viz(v) {
        const M = v.M, NP = 20000;
        const SETS = {
          circ: { label: '$x_n=1.3\\,e^{in}$ (dense on a circle)', f: (n) => [1.3 * Math.cos(n), 1.3 * Math.sin(n)] },
          spiral: { label: 'spiral into a point', f: (n) => { const r = 1.5 / n ** 0.8; return [0.55 + r * Math.cos(2.4 * n), -0.35 + r * Math.sin(2.4 * n)]; } },
          unb: { label: 'unbounded spiral', f: (n) => { const r = 0.22 * Math.sqrt(n); return [r * Math.cos(2.4 * n), r * Math.sin(2.4 * n)]; } },
        };
        const which = v.select('$E$', Object.entries(SETS).map(([value, o]) => ({ value, label: o.label })), 'circ');
        const steps = v.slider('halvings', 0, 10, 6, { int: true });
        const S = v.stage({ x: [-2.1, 2.1], y: [-2.1, 2.1], equal: true, height: 380, axes: false, weight: 1.2, title: 'nested squares $Q_0\\supset Q_1\\supset\\dots$' });
        const Z = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 380, axes: false, minWidth: 240, title: 'the current square, magnified' });
        const cache = {};
        const ptsOf = (key) => cache[key] ||= M.range(NP, 1).map(SETS[key].f);
        let st = null;
        v.render(() => {
          const key = which.value, P = ptsOf(key), K = steps.value;
          let x0 = -2, y0 = -2, s = 4; let inside = P.filter(([x, y]) => x >= x0 && x < x0 + s && y >= y0 && y < y0 + s);
          const chain = [[x0, y0, s, inside.length]];
          for (let k = 0; k < K; k++) {
            const h = s / 2; let best = null;
            for (const [dx, dy] of [[0, 0], [h, 0], [0, h], [h, h]]) {
              const sub = inside.filter(([x, y]) => x >= x0 + dx && x < x0 + dx + h && y >= y0 + dy && y < y0 + dy + h);
              if (!best || sub.length > best[2].length) best = [x0 + dx, y0 + dy, sub];
            }
            [x0, y0, inside] = best; s = h; chain.push([x0, y0, s, inside.length]);
          }
          const outside = P.filter(([x, y]) => Math.max(Math.abs(x), Math.abs(y)) > 2).length;
          // overview
          S.dots(key === 'circ' ? P.slice(0, 3000) : P, { color: 'gold', r: 1.1, alpha: 0.7 });
          chain.forEach(([a, b, w], i) => S.rect(a, b, a + w, b + w, { color: i === K ? (inside.length > 1 ? 'green' : 'red') : 'accent', width: i === K ? 2.4 : 1.3, alpha: i === K ? 1 : 0.7 }));
          if (key === 'unb') S.corner(`${outside} of the first ${NP} points lie outside Q₀`, 'bl', { color: 'red' });
          // zoom
          const pad = s * 0.16;
          Z.setView([x0 - pad, x0 + s + pad], [y0 - pad, y0 + s + pad]);
          Z.rect(x0, y0, x0 + s, y0 + s, { color: inside.length > 1 ? 'green' : 'red', width: 2.4, fill: inside.length > 1 ? 'green' : 'red', fillAlpha: 0.05 });
          Z.line(x0 + s / 2, y0, x0 + s / 2, y0 + s, { color: 'muted', width: 1, dash: [4, 4] });
          Z.line(x0, y0 + s / 2, x0 + s, y0 + s / 2, { color: 'muted', width: 1, dash: [4, 4] });
          const near = P.filter(([x, y]) => x >= x0 - pad && x <= x0 + s + pad && y >= y0 - pad && y <= y0 + s + pad);
          Z.dots(near.slice(0, 1500), { color: 'gold', r: 1.7 });
          if (key === 'spiral') { S.dot(0.55, -0.35, { color: 'green', r: 4 }); Z.dot(0.55, -0.35, { color: 'green', r: 5.5 }); }
          Z.corner(`${inside.length} of the first ${NP} points inside`, 'tl', { color: inside.length > 1 ? 'green' : 'red', weight: 600 });
          st = { key, K, s, n: inside.length, x0, y0, outside };
        });
        v.legend([['gold', 'points of $E$', { dot: true }], ['accent', 'squares $Q_0\\supset Q_1\\supset\\dots$'], ['green', 'current square $Q_k$ / limit point']]);
        v.readout(() => {
          const s = st; if (!s) return '';
          const head = `$Q_{${s.K}}$ has side $4/2^{${s.K}} = ${sci(s.s)}$ and contains ${s.n} of the first ${NP} points. `;
          if (s.key === 'unb') return head + 'This $E$ is unbounded: no square holds all of it, every square holds only finitely many points, and $E$ has no limit point.';
          return head + (s.key === 'spiral' ? 'The squares shrink onto $(0.55,-0.35)$, the limit point.' : 'Each kept square meets the circle in an arc, which holds infinitely many $x_n$ (only finitely many are plotted); the squares shrink onto one point of the circle — a limit point.');
        });
      },
    },
  ],
};
