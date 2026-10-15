// Rudin, Principles of Mathematical Analysis — Chapter 3, part 2: Cauchy sequences, completeness,
// monotone sequences, upper and lower limits (3.8–3.16).

/** Partial sums s_1..s_N of a(k), k = 1..N (index 0 is 0). */
function partial(a, N) { const s = new Float64Array(N + 1); for (let k = 1; k <= N; k++) s[k] = s[k - 1] + a(k); return s; }
/** Diameter of a planar point set via its convex hull: returns [d, p, q]. */
function diameter(M, pts) {
  const h = pts.length > 3 ? M.hull(pts) : pts.slice();
  let best = [0, h[0], h[0]];
  for (let i = 0; i < h.length; i++) for (let j = i + 1; j < h.length; j++) { const d = Math.hypot(h[i][0] - h[j][0], h[i][1] - h[j][1]); if (d > best[0]) best = [d, h[i], h[j]]; }
  return best;
}
/** Closed capsule {x : dist(x, [a,b]) <= r} as a polygon. */
function capsule(a, b, r, n = 40) {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), out = [];
  for (let i = 0; i <= n; i++) { const t = ang + Math.PI / 2 + Math.PI * i / n; out.push([a[0] + r * Math.cos(t), a[1] + r * Math.sin(t)]); }
  for (let i = 0; i <= n; i++) { const t = ang - Math.PI / 2 + Math.PI * i / n; out.push([b[0] + r * Math.cos(t), b[1] + r * Math.sin(t)]); }
  return out;
}
const lg = Math.log10;
/** TeX scientific notation, e.g. 1.0\times10^{-5}. */
function sci(x, d = 2) {
  if (!isFinite(x) || x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e <= 3) return x.toPrecision(d);
  return `${(x / Math.pow(10, e)).toFixed(d - 1)}\\times10^{${e}}`;
}
const LOGTICKS = [[0, '1'], [1, '10'], [2, '100'], [3, '1000'], [4, '10⁴']];

export default {
  collection: 'pma',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Definition',
      name: 'Cauchy sequence',
      statement: String.raw`A sequence $\{p_n\}$ in a metric space $X$ is a *Cauchy sequence* if for every $\eps>0$ there is an integer $N$ such that $d(p_n,p_m)<\eps$ whenever $n\ge N$ and $m\ge N$.`,
      idea: String.raw`The condition never mentions a limit: it only asks that late terms be close *to one another* — all pairs, not just consecutive ones. Every convergent sequence is Cauchy (3.11(a)); whether every Cauchy sequence converges is a property of the space, called completeness (3.12).`,
      caption: String.raw`The right panel is the matrix of all distances $d(p_m,p_n)$, $1\le m,n\le 48$: blue cells are below $\eps$, red cells are not. The sequence is Cauchy when some square $[N,\infty)^2$ — outlined in green — is free of red. Hover a cell to see the pair on the left. The harmonic partial sums have steps $1/n\to0$ hugging the diagonal, yet far-apart pairs stay red: not Cauchy.`,
      deps: ['pma-2.15'],
      tags: ['Cauchy sequences', 'sequences'],
      viz(v) {
        const M = 48, PI2 = Math.PI * Math.PI / 6;
        const SEQ = {
          sq: { label: '$\\sum_{k\\le n}k^{-2}$', s: partial((k) => 1 / (k * k), 4000), tail: (s, N) => PI2 - s[N] },
          alt: { label: '$\\sum_{k\\le n}(-1)^{k+1}/k$', s: partial((k) => (k % 2 ? 1 : -1) / k, 4000), tail: (s, N) => 1 / (N + 1) },
          harm: { label: '$\\sum_{k\\le n}1/k$', s: partial((k) => 1 / k, 4000), tail: () => Infinity },
        };
        const which = v.select('', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'alt');
        const eps = v.slider('$\\varepsilon$', 0.02, 0.6, 0.08, { step: 0.005 });
        const L = v.stage({ x: [0, M + 1], y: [0, 2], height: 380, axes: 'box', title: 'the sequence $p_n$ against $n$' });
        const H = v.stage({ x: [0.5, M + 0.5], y: [0.5, M + 0.5], height: 380, equal: true, axes: 'box', hover: true, title: 'distances $d(p_m,p_n)$ ($m$ across, $n$ up)' });
        let st = {};
        v.render(() => {
          const S = SEQ[which.value], s = S.s, e = eps.value;
          // N = first index whose tail diameter is below eps (tail diameters known in closed form)
          let N = 1; while (N < 3999 && !(S.tail(s, N) < e)) N++;
          if (!isFinite(S.tail(s, 1))) N = Infinity;
          const pm = H.pointer.inside ? [Math.round(H.pointer.x), Math.round(H.pointer.y)] : [38, 9];
          const m = Math.min(M, Math.max(1, pm[0])), n = Math.min(M, Math.max(1, pm[1]));
          // heat map
          for (let i = 1; i <= M; i++) for (let j = 1; j <= M; j++) {
            const d = Math.abs(s[i] - s[j]);
            const col = d < e ? v.mix('panel', 'accent', 0.12 + 0.55 * (d / e)) : v.mix('panel', 'red', 0.4 + 0.45 * Math.min(1, (d - e) / (2 * e)));
            H.rect(i - 0.5, j - 0.5, i + 0.5, j + 0.5, { fill: col, fillAlpha: 1, stroke: false });
          }
          if (N <= M) H.rect(N - 0.5, N - 0.5, M + 0.5, M + 0.5, { color: 'green', width: 2.6 });
          H.rect(m - 0.5, n - 0.5, m + 0.5, n + 0.5, { color: 'gold', width: 2.4 });
          // sequence panel
          const vals = []; for (let k = 1; k <= M; k++) vals.push(s[k]);
          const lo = Math.min(...vals), hi = Math.max(...vals), pad = (hi - lo) * 0.08 + 0.02;
          L.setView([0, M + 1], [lo - pad, hi + pad]);
          if (N <= M) {
            let a = Infinity, b = -Infinity; for (let k = N; k <= M; k++) { a = Math.min(a, s[k]); b = Math.max(b, s[k]); }
            L.rect(N - 0.5, a, M + 0.8, b, { fill: 'green', fillAlpha: 0.13, color: 'green', width: 1 });
            L.vline(N, { color: 'green', dash: [4, 3] });
          }
          const pts = []; for (let k = 1; k <= M; k++) pts.push([k, s[k]]);
          L.path(pts, { color: 'faint', width: 1 });
          L.dots(pts, { color: 'accent', r: 2.6 });
          const dmn = Math.abs(s[m] - s[n]);
          L.line(m, s[m], n, s[n], { color: 'gold', width: 1.2, dash: [3, 3] });
          L.measure(Math.max(m, n) + 1.6, s[m], Math.max(m, n) + 1.6, s[n], null, { color: dmn < e ? 'accent' : 'red' });
          L.dot(m, s[m], { color: 'gold', r: 5.5 }); L.dot(n, s[n], { color: 'gold', r: 5.5 });
          L.tex('p_m', m, s[m], { color: 'gold', baseline: 'bottom', dy: -8, size: 13 });
          L.tex('p_n', n, s[n], { color: 'gold', baseline: 'top', dy: 8, size: 13 });
          L.corner(N === Infinity ? 'no N works: not Cauchy' : N <= M ? `N = ${N}` : `N = ${N} (beyond the picture)`, 'tr', { color: N === Infinity ? 'red' : 'green', weight: 600 });
          v.legend([['accent', '$d(p_m,p_n)<\\varepsilon$', { area: true }], ['red', '$d(p_m,p_n)\\ge\\varepsilon$', { area: true }], ['green', 'the tail square $m,n\\ge N$'], ['gold', 'selected pair']]);
          st = { N, m, n, dmn, e };
        });
        v.readout(() => {
          const s = st; if (s.m == null) return '';
          const pair = `$d(p_{${s.m}},p_{${s.n}}) = ${v.fix(s.dmn, 4)}$ ${s.dmn < s.e ? '$<$' : '$\\ge$'} $\\varepsilon$.`;
          if (s.N === Infinity) return `${pair} For the harmonic sums $d(p_{2n},p_n)\\ge\\tfrac12$ for every $n$, so no $N$ works for $\\varepsilon\\le\\tfrac12$ — although consecutive terms differ by only $1/n$.`;
          return `${pair} Every pair with $m,n\\ge N=${s.N}$ is within $\\varepsilon=${v.fix(s.e, 3)}$ (tail diameters are computed exactly, not just inside the picture).`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Definition',
      name: 'Diameter of a set; Cauchy via tail diameters',
      statement: String.raw`Let $E$ be a nonempty subset of a metric space $X$. The *diameter* of $E$ is
$$\diam E=\sup\{d(p,q): p\in E,\ q\in E\}.$$
If $\{p_n\}$ is a sequence in $X$ and $E_N=\{p_N,p_{N+1},p_{N+2},\dots\}$ is its $N$-th tail, then $\{p_n\}$ is a Cauchy sequence if and only if $\lim_{N\to\infty}\diam E_N=0$.`,
      idea: String.raw`"$d(p_m,p_n)<\eps$ for all $m,n\ge N$" says almost verbatim that $\diam E_N\le\eps$. The tails are nested, $E_{N+1}\subset E_N$, so their diameters never increase; the Cauchy condition is precisely that they shrink to $0$.`,
      caption: String.raw`Slide $N$. The tail $E_N$ is drawn in blue (earlier terms faint) with its farthest pair joined; the right panel plots $N\mapsto\diam E_N$, a non-increasing staircase. For the spiral it drops to $0$; for $e^{i\log n}$ — whose steps shrink like $1/n$ — every tail still wraps around the whole circle, so $\diam E_N=2$ forever.`,
      deps: ['pma-3.8'],
      tags: ['Cauchy sequences', 'diameter'],
      viz(v) {
        const M = v.M, NS = 40;
        const SEQ = {
          spiral: { label: 'spiral', NM: 2500, p: (n) => { const r = 1.15 * Math.pow(0.9, n); return [0.2 + r * Math.cos(1.1 * n), 0.05 + r * Math.sin(1.1 * n)]; } },
          circ: { label: '$e^{i\\log n}$', NM: 8000, p: (n) => [Math.cos(Math.log(n)), Math.sin(Math.log(n))] },
          two: { label: 'two clusters', NM: 2500, p: (n) => [(n % 2 ? -0.9 : 0.9) + 0.5 * Math.cos(n) / Math.sqrt(n), 0.5 * Math.sin(n) / Math.sqrt(n)] },
        };
        const cache = {};
        function data(key) {
          if (cache[key]) return cache[key];
          const S = SEQ[key], pts = [null]; for (let n = 1; n <= S.NM; n++) pts.push(S.p(n));
          const diam = [null]; for (let N = 1; N <= NS; N++) diam.push(diameter(M, pts.slice(N)));
          return (cache[key] = { pts, diam });
        }
        const which = v.select('', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'spiral');
        const nS = v.slider('$N$', 1, NS, 6, { int: true });
        const P = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, height: 340, axes: false, title: 'the tail $E_N$ and its diameter' });
        const G = v.stage({ x: [0, NS + 1], y: [-0.1, 2.3], height: 340, axes: 'box', title: '$\\operatorname{diam}E_N$ against $N$' });
        let st = {};
        v.render(() => {
          const key = which.value, D = data(key), N = nS.value, S = SEQ[key];
          const show = Math.min(S.NM, key === 'circ' ? 8000 : 700);
          const early = [], tail = [];
          for (let n = 1; n <= show; n++) (n < N ? early : tail).push(D.pts[n]);
          if (key === 'circ') P.circle(0, 0, 1, { color: 'faint', width: 1, dash: [2, 4] });
          const hull = M.hull(D.pts.slice(N, S.NM + 1));
          P.poly(hull, { fill: 'accent', fillAlpha: 0.08, color: 'accent', width: 1, alpha: 0.5 });
          if (key !== 'circ') P.path(D.pts.slice(1, 60), { color: 'faint', width: 1 });
          P.dots(early, { color: 'muted', r: 2.2, alpha: 0.45 });
          P.dots(tail, { color: 'accent', r: key === 'circ' ? 1.4 : 2.8 });
          const [d, a, b] = D.diam[N];
          const ok = key === 'spiral';
          P.line(a[0], a[1], b[0], b[1], { color: ok ? 'green' : 'red', width: 2.2 });
          P.dot(a[0], a[1], { color: ok ? 'green' : 'red', r: 4.5 }); P.dot(b[0], b[1], { color: ok ? 'green' : 'red', r: 4.5 });
          { const L2 = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / L2, uy = (b[1] - a[1]) / L2; P.tex('\\operatorname{diam}E_N', b[0], b[1], { color: ok ? 'green' : 'red', align: ux >= 0 ? 'left' : 'right', dx: 10 * ux + (ux >= 0 ? 4 : -4), dy: -12 * uy - 10, size: 14 }); }
          P.tex(`p_{${N}}`, D.pts[N][0], D.pts[N][1], { color: 'accent', align: 'left', dx: 7, dy: -7, size: 13 });
          // staircase
          const top = Math.max(0.5, D.diam[1][0] * 1.12);
          G.setView([0, NS + 1], [-0.05 * top, top]);
          const stair = []; for (let k = 1; k <= NS; k++) { stair.push([k - 0.5, D.diam[k][0]], [k + 0.5, D.diam[k][0]]); }
          G.path(stair, { color: ok ? 'green' : 'red', width: 2 });
          G.bars(D.diam.slice(1).map((x) => x[0]), { color: (x, i) => (i + 1 === N ? 'gold' : ok ? 'green' : 'red'), fillAlpha: 0.25, barWidth: 0.85 });
          G.dot(N, d, { color: 'gold', r: 5.5 });
          G.tex(`\\operatorname{diam}E_{${N}}=${v.fix(d, 3)}`, N, d, { color: 'gold', align: 'left', baseline: 'bottom', dx: 6, dy: -6, size: 13 });
          G.corner(ok ? 'diam E_N → 0: Cauchy' : 'diam E_N stays ≥ ' + v.fix(D.diam[NS][0], 2) + ': not Cauchy', 'tr', { color: ok ? 'green' : 'red', weight: 600 });
          v.legend([['muted', 'terms before $N$', { dot: true }], ['accent', 'the tail $E_N$', { dot: true }], [ok ? 'green' : 'red', 'a farthest pair in $E_N$']]);
          st = { N, d, key, step: Math.hypot(D.pts[N + 1][0] - D.pts[N][0], D.pts[N + 1][1] - D.pts[N][1]) };
        });
        v.readout(() => {
          const s = st; if (s.N == null) return '';
          return `$\\operatorname{diam}E_{${s.N}} = ${v.fix(s.d, 4)}$, while the single step $d(p_{${s.N}},p_{${s.N + 1}}) = ${v.fix(s.step, 4)}$. ` + (s.key === 'spiral' ? 'Both shrink, and the tails close in on one point.' : s.key === 'circ' ? 'Small steps are not enough: the tail still reaches across the circle.' : 'The tails always contain points of both clusters.');
        });
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Theorem',
      name: 'Nested compact sets with diameters tending to 0',
      statement: String.raw`(a) If $\overline E$ is the closure of a set $E$ in a metric space $X$, then $\diam\overline E=\diam E$.
(b) If $K_1\supset K_2\supset K_3\supset\cdots$ are nonempty compact sets in $X$ and $\lim_{n\to\infty}\diam K_n=0$, then $\bigcap_{n=1}^\infty K_n$ consists of exactly one point.`,
      idea: String.raw`(a) Clearly $\diam E\le\diam\overline E$. Points $p,q\in\overline E$ have points $p',q'\in E$ within $\eps$, so $d(p,q)<2\eps+d(p',q')\le 2\eps+\diam E$. (b) The intersection $K$ is nonempty by the finite-intersection property of compact sets (2.36). It cannot contain two points: $K\subset K_n$ gives $\diam K\le\diam K_n\to0$.`,
      caption: String.raw`Raise $n$ to draw more sets. With compact sets of shrinking diameter the intersection is a single point (green). Keep compactness but let the diameters stall and the intersection is a whole segment; keep shrinking diameters but use *open* discs tangent at $0$ and the intersection is empty. The last option illustrates (a): the supremum defining $\diam E$ is approached inside $E$ and attained in $\overline E$.`,
      deps: ['pma-3.9', 'pma-2.26', 'pma-2.36a'],
      see: ['rca-5.6', 'fa-2.2'],
      tags: ['compactness', 'diameter'],
      viz(v) {
        const MODES = [
          { value: 'pt', label: 'compact, diam → 0' },
          { value: 'seg', label: 'compact, diam ↛ 0' },
          { value: 'open', label: 'open discs, diam → 0' },
          { value: 'clos', label: '(a): $\\operatorname{diam}\\overline E$' },
        ];
        const mode = v.select('', MODES, 'pt');
        const nS = v.slider('$n$', 1, 12, 6, { int: true });
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.12, 1.12], equal: true, height: 330, full: true, axes: false });
        const Dg = v.stage({ x: [0, 13], y: [0, 2.6], height: 150, full: true, axes: 'box', title: 'the diameters against $n$' });
        const pstar = [0.35, 0.05];
        const disc = (n) => { const r = 0.98 * Math.pow(0.72, n - 1); return { c: [pstar[0] + 0.1 * r * Math.cos(2 * n), pstar[1] + 0.1 * r * Math.sin(2 * n)], r }; };
        const segA = [-0.85, -0.1], segB = [0.85, 0.25];
        let st = {};
        v.render(() => {
          const m = mode.value, n = nS.value;
          const col = (k) => ({ color: 'orange', width: k === n ? 2.4 : 1.2, alpha: 0.35 + 0.65 * (k / n), fill: 'orange', fillAlpha: 0.05 });
          if (m === 'pt') {
            for (let k = 1; k <= n; k++) { const D = disc(k); S.circle(D.c[0], D.c[1], D.r, col(k)); }
            const D = disc(n);
            S.tex(`K_{${n}}`, D.c[0] + D.r * 0.72, D.c[1] + D.r * 0.72, { color: 'orange', align: 'left', size: 14 });
            S.tex('K_1', disc(1).c[0] - 0.75, disc(1).c[1] + 0.78, { color: 'orange', size: 14 });
            S.dot(pstar[0], pstar[1], { color: 'green', r: 5 });
            S.tex('\\bigcap K_n=\\{p\\}', pstar[0] + 0.12, pstar[1] - 0.12, { color: 'green', align: 'left', baseline: 'top', size: 14 });
            st = { m, diam: 2 * D.r, ds: Array.from({ length: 12 }, (_, i) => 2 * disc(i + 1).r) };
          } else if (m === 'seg') {
            for (let k = 1; k <= n; k++) S.poly(capsule(segA, segB, 0.75 * Math.pow(0.7, k - 1)), col(k));
            S.line(segA[0], segA[1], segB[0], segB[1], { color: 'red', width: 3.2 });
            S.tex('\\bigcap K_n', segB[0], segB[1], { color: 'red', align: 'left', dx: 10, size: 14 });
            const r = 0.75 * Math.pow(0.7, n - 1);
            const Ls = Math.hypot(segB[0] - segA[0], segB[1] - segA[1]);
            st = { m, diam: Ls + 2 * r, ds: Array.from({ length: 12 }, (_, i) => Ls + 1.5 * Math.pow(0.7, i)), ref: Ls };
          } else if (m === 'open') {
            const O = [-0.9, -0.05];
            for (let k = 1; k <= n; k++) { const r = 0.95 * Math.pow(0.72, k - 1); S.circle(O[0] + r, O[1], r, { ...col(k), dash: [5, 4] }); }
            S.dot(O[0], O[1], { color: 'red', r: 5.5, hollow: true, width: 2.2 });
            S.tex('0\\notin K_n', O[0], O[1], { color: 'red', align: 'right', dx: -10, size: 14 });
            S.tex('K_n=\\{z:|z-r_n|<r_n\\}', 0.3, 0.98, { color: 'orange', size: 14 });
            st = { m, diam: 2 * 0.95 * Math.pow(0.72, n - 1), ds: Array.from({ length: 12 }, (_, i) => 1.9 * Math.pow(0.72, i)) };
          } else {
            const c = [-0.55, 0], rho = 0.75, q0 = [1.25, 0.35];
            const u = [(q0[0] - c[0]), (q0[1] - c[1])], L = Math.hypot(...u), e = [u[0] / L, u[1] / L];
            const far = [c[0] - rho * e[0], c[1] - rho * e[1]];
            S.circle(c[0], c[1], rho, { fill: 'blue', fillAlpha: 0.16, color: 'blue', width: 1.5, dash: [5, 4] });
            const qk = (k) => [q0[0] - 0.9 * e[0] / (k + 1) + 0.25 * e[1] / (k + 1), q0[1] - 0.9 * e[1] / (k + 1) - 0.25 * e[0] / (k + 1)];
            const nf = (k) => [c[0] - rho * (1 - 0.25 / (k + 1)) * e[0], c[1] - rho * (1 - 0.25 / (k + 1)) * e[1]];
            const qs = []; for (let k = 1; k <= n; k++) qs.push(qk(k));
            S.dots(qs, { color: 'blue', r: 3.6 });
            S.dot(q0[0], q0[1], { color: 'green', r: 5.5, hollow: true, width: 2.2 });
            S.dot(far[0], far[1], { color: 'green', r: 5.5, hollow: true, width: 2.2 });
            S.line(far[0], far[1], q0[0], q0[1], { color: 'green', width: 1.6, dash: [6, 4] });
            const qn = qs[qs.length - 1], nearFar = nf(n);
            S.dot(nearFar[0], nearFar[1], { color: 'blue', r: 3.6 });
            S.line(nearFar[0], nearFar[1], qn[0], qn[1], { color: 'blue', width: 1.6 });
            S.tex('E', c[0], c[1] + 0.2, { color: 'blue', size: 18 });
            S.tex('q\\in\\overline E\\setminus E', q0[0], q0[1], { color: 'green', align: 'left', dx: 9, dy: -10, size: 14 });
            st = { m, dE: L + rho, dn: Math.hypot(qn[0] - nearFar[0], qn[1] - nearFar[1]), ds: Array.from({ length: 12 }, (_, i) => { const a = qk(i + 1), b = nf(i + 1); return Math.hypot(a[0] - b[0], a[1] - b[1]); }), ref: L + rho };
          }
          const ok = m === 'pt';
          if (m !== 'clos') S.corner(ok ? 'exactly one point in the intersection' : m === 'seg' ? 'more than one point: the diameters do not shrink' : 'empty intersection: the sets are not compact', 'tl', { color: ok ? 'green' : 'red', weight: 600 });
          else S.corner('diam E = diam Ē, attained only in the closure', 'tl', { color: 'green', weight: 600 });
          // diameter panel
          const top = Math.max(...st.ds, st.ref || 0) * 1.15;
          Dg.setView([0.3, 12.7], [0, top]);
          Dg.bars(st.ds, { color: (x, i) => (i + 1 === n ? 'gold' : i + 1 > n ? 'faint' : m === 'pt' ? 'green' : m === 'clos' ? 'blue' : m === 'open' ? 'orange' : 'red'), fillAlpha: 0.55, barWidth: 0.6 });
          if (st.ref) { Dg.hline(st.ref, { color: m === 'clos' ? 'green' : 'red', dash: [6, 4], width: 1.5 }); Dg.tex(m === 'clos' ? '\\operatorname{diam}E=\\operatorname{diam}\\overline E' : '\\text{length of the segment}', 12.6, st.ref, { color: m === 'clos' ? 'green' : 'red', align: 'right', baseline: 'bottom', dy: -3, size: 13 }); }
          Dg.setTitle(m === 'clos' ? 'distance of the $n$-th pair in $E$ against $n$' : 'the diameters $\\operatorname{diam}K_n$ against $n$');
          v.legend(m === 'clos' ? [['blue', 'open disc $\\cup$ points $q_k$: the set $E$', { area: true }], ['green', 'pair realizing $\\operatorname{diam}\\overline E$', { dash: true }], ['blue', 'a pair in $E$ (nearly as far)']] : [['orange', `the sets $K_1\\supset\\dots\\supset K_{${n}}$`], [ok ? 'green' : 'red', '$\\bigcap_n K_n$', { dot: true }]]);
        });
        v.readout(() => {
          const s = st, n = nS.value;
          if (s.m === 'pt') return `$\\operatorname{diam}K_{${n}} = ${v.fix(s.diam, 4)}\\to0$, and the intersection is the single point $p$.`;
          if (s.m === 'seg') return `$\\operatorname{diam}K_{${n}} = ${v.fix(s.diam, 3)}$ never drops below the segment's length $${v.fix(s.diam - 1.5 * Math.pow(0.7, n - 1), 3)}$: the hypothesis $\\operatorname{diam}K_n\\to0$ fails and the intersection is a segment.`;
          if (s.m === 'open') return `$\\operatorname{diam}K_{${n}} = ${v.fix(s.diam, 3)}\\to0$, but every $K_n$ misses $0$ and any other point eventually falls outside: $\\bigcap K_n=\\emptyset$.`;
          return `The pair in $E$ is at distance $${v.fix(s.dn, 4)}$; the supremum $\\operatorname{diam}E = ${v.fix(s.dE, 4)}$ is not attained in $E$ but is attained in $\\overline E$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Theorem',
      name: 'Convergent ⇔ Cauchy in compact spaces and in $\\R^k$',
      statement: String.raw`(a) In every metric space, a convergent sequence is a Cauchy sequence.
(b) If $X$ is a compact metric space and $\{p_n\}$ is a Cauchy sequence in $X$, then $\{p_n\}$ converges to some point of $X$.
(c) In $\R^k$ every Cauchy sequence converges.`,
      idea: String.raw`(a) If $d(p_n,p)<\eps/2$ for $n\ge N$, then $d(p_m,p_n)\le d(p_m,p)+d(p,p_n)<\eps$. (b) The closures $\overline{E_N}$ of the tails are nested compact sets (2.35) with $\diam\overline{E_N}=\diam E_N\to0$ (3.10(a)), so they meet in exactly one point $p$ (3.10(b)); every tail then lies in a small ball about $p$. (c) A Cauchy sequence is bounded — beyond some $N$ all terms are within $1$ of $p_N$ — so its range lies in a $k$-cell, which is compact (2.40), and (b) applies.`,
      caption: String.raw`**(a)**: drag $\eps$; the triangle $p_m\to p\to p_n$ shows two legs shorter than $\eps/2$. **(b, c)**: the nested tails $E_1\supset E_2\supset\cdots$ (hulls drawn for a few $N$) close in on the limit; the orange box is the $k$-cell from the boundedness step. Now delete the limit from the space: in $X=\R^2\setminus\{0\}$ the same sequence is still Cauchy, but the closures of its tails have empty intersection and it has no limit in $X$.`,
      deps: ['pma-3.8', 'pma-3.10', 'pma-2.35', 'pma-2.41'],
      see: ['rca-3.11'],
      tags: ['Cauchy sequences', 'completeness', 'compactness'],
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'a', label: 'convergent ⇒ Cauchy (a)' }, { value: 'bc', label: 'Cauchy ⇒ convergent in $\\R^2$ (b, c)' }, { value: 'hole', label: '$X=\\R^2\\setminus\\{0\\}$' }], 'bc');
        const eps = v.slider('$\\varepsilon$', 0.03, 1, 0.3, { step: 0.01 });
        const S = v.stage({ x: [-1.25, 1.35], y: [-1.05, 1.15], equal: true, height: 380, full: true, axes: false });
        const NM = 1500;
        const pts = [null]; for (let n = 1; n <= NM; n++) { const r = 1.25 * Math.pow(0.86, n) * (1 + 0.35 * Math.sin(2.3 * n)); pts.push([r * Math.cos(0.9 * n), r * Math.sin(0.9 * n)]); }
        const dist0 = (n) => Math.hypot(pts[n][0], pts[n][1]);
        const tailDiam = []; for (let N = 1; N <= 60; N++) tailDiam[N] = diameter(M, pts.slice(N))[0];
        let st = {};
        v.render(() => {
          const m = mode.value, e = eps.value;
          if (m === 'a') { const R = Math.max(0.3, 1.5 * e); S.setView([-R, R], [-0.85 * R, 0.85 * R]); } else S.setView([-1.25, 1.35], [-1.05, 1.15]);
          S.path(pts.slice(1, 70), { color: 'faint', width: 1 });
          if (m === 'a') {
            let last = 0; for (let n = 1; n <= NM; n++) if (dist0(n) >= e / 2) last = n;
            const N = last + 1;
            S.circle(0, 0, e / 2, { fill: 'accent', fillAlpha: 0.13, color: 'accent', width: 1.5 });
            const early = [], tail = []; for (let n = 1; n <= 300; n++) (n < N ? early : tail).push(pts[n]);
            S.dots(early, { color: 'muted', r: 2.6, alpha: 0.6 }); S.dots(tail, { color: 'accent', r: 2.6 });
            // two tail terms far apart
            let mi = N, ni = N, best = -1; for (let i = N; i < N + 12; i++) for (let j = i + 1; j < N + 12; j++) { const d = M.dist(pts[i], pts[j]); if (d > best) { best = d; mi = i; ni = j; } }
            const a = pts[mi], b = pts[ni];
            S.line(a[0], a[1], 0, 0, { color: 'green', width: 1.8 }); S.line(0, 0, b[0], b[1], { color: 'green', width: 1.8 });
            S.line(a[0], a[1], b[0], b[1], { color: 'gold', width: 2.2, dash: [5, 3] });
            S.dot(a[0], a[1], { color: 'gold', r: 5 }); S.dot(b[0], b[1], { color: 'gold', r: 5 });
            S.tex(`p_{${mi}}`, a[0], a[1], { color: 'gold', align: 'left', dx: 7, dy: -8, size: 13 });
            S.tex(`p_{${ni}}`, b[0], b[1], { color: 'gold', align: 'left', dx: 7, dy: 8, size: 13 });
            S.dot(0, 0, { color: 'green', r: 5 }); S.tex('p', 0, 0, { color: 'green', align: 'right', dx: -8, dy: 10 });
            S.tex('\\varepsilon/2', e / 2 * Math.cos(-2.4), e / 2 * Math.sin(-2.4), { color: 'accent', align: 'right', dx: -4, dy: 10, size: 13 });
            S.corner(`for n ≥ N = ${N}: d(p_n, p) < ε/2`, 'tl', { color: 'green', weight: 600 });
            v.legend([['accent', 'ball of radius $\\varepsilon/2$ about the limit $p$', { area: true }], ['green', 'two legs, each $<\\varepsilon/2$'], ['gold', '$d(p_m,p_n)<\\varepsilon$', { dash: true }]]);
            st = { m, N, d: M.dist(a, b), mi, ni };
            return;
          }
          let N = 1; while (N < 60 && tailDiam[N] >= e) N++;
          // k-cell from the boundedness step (eps = 1)
          if (m === 'bc') {
            let N1 = 1; while (N1 < 60 && tailDiam[N1] >= 1) N1++;
            let x0 = pts[N1][0] - 1, x1 = pts[N1][0] + 1, y0 = pts[N1][1] - 1, y1 = pts[N1][1] + 1;
            for (let n = 1; n < N1; n++) { x0 = Math.min(x0, pts[n][0]); x1 = Math.max(x1, pts[n][0]); y0 = Math.min(y0, pts[n][1]); y1 = Math.max(y1, pts[n][1]); }
            S.rect(x0, y0, x1, y1, { color: 'orange', width: 1.6, dash: [6, 4] });
            S.tex('k\\text{-cell}', x1, y1, { color: 'orange', align: 'right', baseline: 'top', dx: -6, dy: 6, size: 13 });
          }
          for (const k of [1, 3, 6, 10, 16, 25].filter((k) => k < N)) S.poly(M.hull(pts.slice(k, 400)), { color: 'accent', width: 1, alpha: 0.3, fill: 'accent', fillAlpha: 0.04 });
          const hullN = M.hull(pts.slice(N, 400));
          S.poly(hullN, { color: 'accent', width: 2, fill: 'accent', fillAlpha: 0.14 });
          const early = [], tail = []; for (let n = 1; n <= 400; n++) (n < N ? early : tail).push(pts[n]);
          S.dots(early, { color: 'muted', r: 2.6, alpha: 0.6 }); S.dots(tail, { color: 'accent', r: 2.6 });
          S.tex(`E_{${N}}`, hullN.reduce((a, p) => (p[0] > a[0] ? p : a))[0], 0, { color: 'accent', align: 'left', dx: 8, size: 14 });
          if (m === 'bc') { S.dot(0, 0, { color: 'green', r: 5.5 }); S.tex('\\bigcap_N\\overline{E_N}=\\{p\\}', -0.08, -0.08, { color: 'green', align: 'right', baseline: 'top', dx: -4, dy: 6, size: 13 }); }
          else { S.dot(0, 0, { color: 'red', r: 6, hollow: true, width: 2.2 }); S.tex('0\\notin X', 0.05, -0.05, { color: 'red', align: 'left', baseline: 'top', dx: 6, dy: 4, size: 13 }); }
          S.corner(m === 'bc' ? `diam E_N < ε from N = ${N}; the tails shrink to the limit` : 'still Cauchy, but the tails shrink onto a missing point', 'tl', { color: m === 'bc' ? 'green' : 'red', weight: 600 });
          v.legend([['accent', `tail $E_{${N}}$ (hull), earlier tails faint`, { area: true }], ...(m === 'bc' ? [['orange', 'bounding $k$-cell', { dash: true }]] : []), [m === 'bc' ? 'green' : 'red', m === 'bc' ? 'the limit' : 'the hole', { dot: true }]]);
          st = { m, N, diam: tailDiam[N] };
        });
        v.readout(() => {
          const s = st, e = v.fix(eps.value, 2);
          if (s.m === 'a') return `$d(p_{${s.mi}},p_{${s.ni}}) = ${v.fix(s.d, 4)} \\le d(p_{${s.mi}},p)+d(p,p_{${s.ni}}) < \\varepsilon = ${e}$: every convergent sequence is Cauchy.`;
          if (s.m === 'bc') return `$\\operatorname{diam}E_{${s.N}} = ${v.fix(s.diam, 4)} < \\varepsilon = ${e}$. The closed tails are compact (inside the $k$-cell) and nested, so they meet in exactly one point — the limit.`;
          return `In $\\R^2\\setminus\\{0\\}$: $\\operatorname{diam}E_{${s.N}} = ${v.fix(s.diam, 4)}$, so the sequence is Cauchy, yet $\\bigcap_N\\overline{E_N}=\\emptyset$ (closures taken in $X$) and there is no limit in $X$. The space is not complete.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Definition',
      name: 'Complete metric space',
      statement: String.raw`A metric space in which every Cauchy sequence converges is called *complete*.

By 3.11, every compact metric space and every Euclidean space $\R^k$ is complete. A closed subset of a complete metric space is complete, whereas $\Q$, with the metric $d(x,y)=|x-y|$, is not.`,
      idea: String.raw`Completeness says the space has no "holes" that a Cauchy sequence could converge towards. In $\Q$ the truncated decimal expansions of $\sqrt2$ (or the Newton iterates $x\mapsto\tfrac12(x+2/x)$) are rational and Cauchy, but the only candidate limit, $\sqrt2$, is not rational (1.1). If $E$ is closed in a complete $X$, a Cauchy sequence in $E$ converges in $X$, and its limit lies in $E$ because $E$ is closed.`,
      caption: String.raw`Each line zooms in tenfold around $\surd2$. Gold dots are the terms that are visible at that magnification; the deeper lines are reached only by later terms — the sequence is Cauchy. Switch the space: in $\R$ the target point is there (green), in $\Q$ it is a hole (red), although rationals crowd around it at every scale.`,
      deps: ['pma-3.8', 'pma-3.1'],
      see: ['rca-5.1', 'rca-3.11', 'rca-5.6', 'fa-2.2'],
      tags: ['completeness', 'Cauchy sequences'],
      viz(v) {
        const R2 = Math.SQRT2;
        const trunc = [null, 1, 1.4, 1.41, 1.414, 1.4142, 1.41421, 1.414213, 1.4142135, 1.41421356];
        const newt = [null, 1]; for (let k = 2; k <= 9; k++) { const x = newt[k - 1]; newt.push(0.5 * (x + 2 / x)); }
        const FR = ['1', '3/2', '17/12', '577/408', '665857/470832'];
        const SEQ = { trunc: { label: 'decimal truncations', a: trunc }, newt: { label: 'Newton: $x\\mapsto\\frac12(x+2/x)$', a: newt } };
        const which = v.select('', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'trunc');
        const space = v.select('space', [{ value: 'Q', label: '$X=\\Q$' }, { value: 'R', label: '$X=\\R$' }], 'Q');
        const nS = v.slider('terms shown', 1, 9, 6, { int: true });
        const LV = 6;
        const S = v.stage({ x: [-1.32, 1.32], y: [-0.7, LV - 0.35], height: 430, full: true, axes: false });
        let st = {};
        v.render(() => {
          const A = SEQ[which.value].a, n = nS.value, inQ = space.value === 'Q';
          for (let L = 0; L < LV; L++) {
            const y = LV - 1 - L, w = 0.5 * Math.pow(10, -L);
            // funnel to the next level
            if (L < LV - 1) { S.line(-0.1, y, -1, y - 1, { color: 'faint', width: 1, dash: [2, 3] }); S.line(0.1, y, 1, y - 1, { color: 'faint', width: 1, dash: [2, 3] }); S.rect(-0.1, y - 0.06, 0.1, y + 0.06, { color: 'faint', width: 1 }); }
            S.line(-1, y, 1, y, { color: 'muted', width: 1.4 });
            // rational grid ticks (multiples of w/10)
            for (let k = -10; k <= 10; k++) { const big = k % 5 === 0; S.line(k / 10, y - (big ? 0.07 : 0.04), k / 10, y + (big ? 0.07 : 0.04), { color: 'faint', width: 1 }); }
            const dig = L + 2;
            S.text((R2 - w).toFixed(dig), -1, y - 0.2, { align: 'center', color: 'muted', size: 11 });
            S.text((R2 + w).toFixed(dig), 1, y - 0.2, { align: 'center', color: 'muted', size: 11 });
            S.text(`×10^${L}`.replace('^0', '⁰').replace('^1', '¹').replace('^2', '²').replace('^3', '³').replace('^4', '⁴').replace('^5', '⁵'), -1.3, y, { align: 'left', color: 'faint', size: 11 });
            for (let k = 1; k <= n; k++) {
              const u = (A[k] - R2) / w;
              if (Math.abs(u) <= 1) { S.dot(u, y, { color: 'gold', r: 4.5 }); let crowd = false; for (let j = k + 1; j <= n; j++) if (Math.abs((A[j] - R2) / w - u) < 0.09) crowd = true; if (!crowd) S.tex(`x_{${k}}`, u, y, { color: 'gold', baseline: 'bottom', dy: -7, size: 12 }); }
            }
            S.dot(0, y, inQ ? { color: 'red', r: 5, hollow: true, width: 2 } : { color: 'green', r: 4.5 });
          }
          S.tex(inQ ? '\\sqrt2\\notin\\Q' : '\\sqrt2\\in\\R', 0, LV - 1, { color: inQ ? 'red' : 'green', baseline: 'bottom', dy: -22, size: 15 });
          S.corner(inQ ? 'Cauchy in ℚ, but no limit in ℚ' : 'in ℝ the limit exists', 'tl', { color: inQ ? 'red' : 'green', weight: 600 });
          v.legend([['gold', 'terms $x_k$ (rational)', { dot: true }], [inQ ? 'red' : 'green', inQ ? 'the missing limit $\\sqrt2$' : 'the limit $\\sqrt2$', { dot: true }], ['faint', 'decimal grid: more rationals', { dash: true }]]);
          st = { A, n, key: which.value };
        });
        v.readout(() => {
          const s = st; if (!s.A) return '';
          const xs = s.key === 'newt' ? FR.slice(0, Math.min(5, s.n)).join(',\\ ') + (s.n > 5 ? ',\\dots' : '') : s.A.slice(1, s.n + 1).join(',\\ ');
          const gap = Math.abs(s.A[s.n] - s.A[Math.max(1, s.n - 1)]);
          return `$x_k$: $${xs}$. Gap $|x_{${s.n}}-x_{${Math.max(1, s.n - 1)}}| = ${sci(gap)}$; every later term is within $${sci(Math.abs(s.A[s.n] - R2))}$ of $\\sqrt2$, so any two of them differ by less than twice that.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Definition',
      name: 'Monotonic sequence',
      statement: String.raw`A sequence $\{s_n\}$ of real numbers is *monotonically increasing* if $s_n\le s_{n+1}$ for every $n$, and *monotonically decreasing* if $s_n\ge s_{n+1}$ for every $n$. A sequence that is either is called *monotonic*. (The same terms are used for sequences in the extended real number system.)`,
      idea: String.raw`Monotonicity is an order condition, so it only makes sense on the real line. Its value lies in 3.14: for monotonic sequences, convergence reduces to boundedness, and the limit is the supremum (or infimum) of the range.`,
      deps: [],
      tags: ['sequences', 'monotone'],
    },
    // ------------------------------------------------------------------ 3.14
    {
      num: '3.14',
      kind: 'Theorem',
      name: 'Monotone sequences converge iff bounded',
      statement: String.raw`A monotonic sequence $\{s_n\}$ converges if and only if it is bounded.`,
      idea: String.raw`Convergent sequences are always bounded (3.2(c)). Conversely, let $\{s_n\}$ increase and be bounded; by the least-upper-bound property (1.19) its range has a supremum $s$. For $\eps>0$, $s-\eps$ is not an upper bound, so $s_N>s-\eps$ for some $N$, and monotonicity keeps every later term in $(s-\eps,s]$. The decreasing case uses the infimum.`,
      caption: String.raw`The horizontal axis is $\log_{10}n$. For a bounded monotone sequence the supremum (green) is the limit: once one term enters the band $(s-\eps,s]$, all later terms stay there. Drag the orange level $M$: if $M$ lies below the supremum, some term crosses it; at or above, none ever does. For the harmonic sums every level is eventually crossed — unbounded, hence divergent.`,
      deps: ['pma-3.13', 'pma-1.19', 'pma-3.2'],
      see: ['rca-1.26'],
      tags: ['monotone', 'sequences', 'supremum'],
      viz(v) {
        const NM = 10000, PI2 = Math.PI * Math.PI / 6, GAMMA = 0.5772156649;
        const SEQ = {
          e: { label: '$(1+\\frac1n)^n\\uparrow e$', f: (n) => Math.pow(1 + 1 / n, n), lim: Math.E, inc: true, y: [1.9, 2.86] },
          z2: { label: '$\\sum_{k\\le n}k^{-2}\\uparrow\\frac{\\pi^2}{6}$', f: null, a: (k) => 1 / (k * k), lim: PI2, inc: true, y: [0.95, 1.72] },
          ed: { label: '$(1+\\frac1n)^{n+1}\\downarrow e$', f: (n) => Math.pow(1 + 1 / n, n + 1), lim: Math.E, inc: false, y: [2.6, 4.1] },
          h: { label: '$\\sum_{k\\le n}1/k$ (unbounded)', f: null, a: (k) => 1 / k, lim: Infinity, inc: true, y: [0, 10.6] },
        };
        const cache = {};
        const vals = (key) => { if (cache[key]) return cache[key]; const S = SEQ[key], s = new Float64Array(NM + 1); let acc = 0; for (let n = 1; n <= NM; n++) { if (S.f) s[n] = S.f(n); else { acc += S.a(n); s[n] = acc; } } return (cache[key] = s); };
        const which = v.select('', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'e');
        const eps = v.slider('$\\varepsilon$', 0.002, 0.3, 0.03, { log: true, fmt: (x) => x.toPrecision(2) });
        const G = v.stage({ x: [-0.05, 4.12], y: [1.9, 2.86], height: 360, axes: 'box', full: true, xticks: LOGTICKS, title: '$s_n$ against $n$ (log scale)' });
        const Mh = G.handle(4.0, 2.6, { color: 'orange', r: 7, constrain: (x, y) => [4.0, y] });
        let last = null, st = {};
        v.render(() => {
          const key = which.value, S = SEQ[key], s = vals(key), e = eps.value;
          if (key !== last) { last = key; G.setView(null, S.y); Mh.y = S.inc ? (isFinite(S.lim) ? S.lim - 0.12 * (S.y[1] - S.y[0]) : 6) : S.lim + 0.15 * (S.y[1] - S.y[0]); }
          const pts = []; for (let n = 1; n <= NM; n = n < 200 ? n + 1 : Math.ceil(n * 1.01)) pts.push([lg(n), s[n]]);
          let N = null;
          if (isFinite(S.lim)) {
            const lo = S.inc ? S.lim - e : S.lim, hi = S.inc ? S.lim : S.lim + e;
            G.hband(lo, hi, { color: 'green', alpha: 0.13 });
            G.hline(S.lim, { color: 'green', width: 1.8, dash: [6, 4] });
            G.tex(S.inc ? 's=\\sup_n s_n' : 's=\\inf_n s_n', 0.05, S.lim, { color: 'green', align: 'left', baseline: S.inc ? 'bottom' : 'top', dy: S.inc ? -4 : 4, size: 14 });
            for (let n = 1; n <= NM; n++) if (Math.abs(s[n] - S.lim) < e) { N = n; break; }
            if (N) { G.vline(lg(N), { color: 'green', dash: [3, 3] }); G.tex(`N=${N}`, lg(N), S.y[1], { color: 'green', align: 'left', baseline: 'top', dx: 5, dy: 6, size: 13 }); }
          }
          // level M
          const Mv = Mh.y; let cross = null;
          for (let n = 1; n <= NM; n++) if (S.inc ? s[n] > Mv : s[n] < Mv) { cross = n; break; }
          let crossEst = null; if (!cross && key === 'h') crossEst = Math.exp(Mv - GAMMA);
          G.hline(Mv, { color: 'orange', width: 1.6 });
          G.tex('M', 4.0, Mv, { color: 'orange', align: 'right', dx: -12, dy: -11, size: 14 });
          G.path(pts, { color: 'accent', width: 1.4, alpha: 0.6 });
          const d1 = []; for (let n = 1; n <= 60; n++) d1.push([lg(n), s[n]]);
          G.dots(d1, { color: 'accent', r: 2.6 });
          if (N) { const tl = pts.filter((p) => p[0] >= lg(N)); G.dots(tl.filter((_, i) => i % 3 === 0), { color: 'green', r: 2.2 }); }
          if (cross) { G.dot(lg(cross), s[cross], { color: 'orange', r: 6, hollow: true, width: 2.2 }); G.tex(`n=${cross}`, lg(cross), s[cross], { color: 'orange', align: 'left', baseline: S.inc ? 'top' : 'bottom', dx: 6, dy: S.inc ? 6 : -6, size: 13 }); }
          v.legend([['accent', '$s_n$', { dot: true }], ...(isFinite(S.lim) ? [['green', `band of width $\\varepsilon$ ${S.inc ? 'below the supremum' : 'above the infimum'}`, { area: true }]] : []), ['orange', 'test level $M$ (drag)']]);
          st = { key, N, cross, crossEst, Mv, S };
        });
        v.readout(() => {
          const s = st; if (!s.S) return '';
          const lev = `$M=${v.fix(s.Mv, 3)}$`;
          const mpart = s.cross ? `${lev} is crossed at $n=${s.cross}$, so it is not ${s.S.inc ? 'an upper' : 'a lower'} bound` : s.crossEst ? `${lev} is crossed only near $n\\approx${v.fmt(s.crossEst, 3)}$ (beyond the picture) — still crossed` : `${lev} is never crossed: it is ${s.S.inc ? 'an upper' : 'a lower'} bound`;
          if (s.key === 'h') return `${mpart}. Every level is eventually exceeded ($s_n>\\log n$), so the sequence is unbounded and diverges.`;
          return `${mpart}. All $s_n$ with $n\\ge N=${s.N}$ lie within $\\varepsilon$ of $s=${v.fix(s.S.lim, 5)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.15
    {
      num: '3.15',
      kind: 'Definition',
      name: 'Divergence to $+\\infty$ and $-\\infty$',
      statement: String.raw`Let $\{s_n\}$ be a sequence of real numbers. We write $s_n\to+\infty$ if for every real $M$ there is an integer $N$ such that $s_n\ge M$ for all $n\ge N$. Similarly, $s_n\to-\infty$ means that for every real $M$ there is an $N$ with $s_n\le M$ for all $n\ge N$.`,
      idea: String.raw`This is convergence in the extended real line (1.23), with the neighbourhoods $(M,+\infty]$ of $+\infty$ playing the role of $\eps$-balls. It is still *divergence* in the sense of 3.1; the notation simply records the direction. It lets every real sequence have subsequential limits in $[-\infty,+\infty]$, which is what 3.16 needs.`,
      deps: ['pma-3.1', 'pma-1.23'],
      tags: ['sequences', 'extended reals'],
    },
    // ------------------------------------------------------------------ 3.16
    {
      num: '3.16',
      kind: 'Definition',
      name: 'Upper and lower limits',
      statement: String.raw`Let $\{s_n\}$ be a sequence of real numbers and let $E$ be the set of all $x$ in the extended real number system such that $s_{n_k}\to x$ for some subsequence $\{s_{n_k}\}$; thus $E$ contains every subsequential limit (3.5), together with $+\infty$ or $-\infty$ when some subsequence tends to it (3.15). Put
$$s^*=\sup E,\qquad s_*=\inf E .$$
These are the *upper* and *lower limits* of $\{s_n\}$, written $\limsup_{n\to\infty}s_n=s^*$ and $\liminf_{n\to\infty}s_n=s_*$.`,
      idea: String.raw`$E$ is never empty: a bounded sequence has a convergent subsequence (3.6), and an unbounded one has a subsequence tending to $\pm\infty$. So every real sequence has an upper and a lower limit, always with $s_*\le s^*$, and $s_*=s^*$ exactly when $\{s_n\}$ converges (possibly to $\pm\infty$) to that common value.`,
      caption: String.raw`Left: the terms against $\log_{10}n$. Right: a histogram of the *late* terms, those with $n$ in the shaded window $[K,5K]$. As $K$ grows the late terms pile up on the set $E$ of subsequential limits (green), whose top and bottom are $s^*$ and $s_*$. In the last example the even terms run off to $+\infty$, so $+\infty\in E$ and $s^*=+\infty$.`,
      deps: ['pma-3.5', 'pma-3.15', 'pma-1.23'],
      see: ['rca-1.28'],
      tags: ['limsup', 'subsequences'],
      viz(v) {
        const NM = 10000;
        const c5 = [2, 2 * Math.cos(2 * Math.PI / 5), 2 * Math.cos(4 * Math.PI / 5)];
        const SEQ = {
          alt: { label: '$(-1)^n(1+\\frac1n)$', f: (n) => (n % 2 ? -1 : 1) * (1 + 1 / n), E: { pts: [-1, 1] }, sup: 1, inf: -1 },
          sin: { label: '$\\sin n$', f: (n) => Math.sin(n), E: { seg: [-1, 1] }, sup: 1, inf: -1 },
          five: { label: '$\\frac{2\\cos(2\\pi n/5)}{1+3/n}$', f: (n) => 2 * Math.cos(2 * Math.PI * n / 5) / (1 + 3 / n), E: { pts: [c5[2], c5[1], c5[0]] }, sup: 2, inf: c5[2] },
          inf: { label: '$n$ ($n$ even), $\\frac1n$ ($n$ odd)', f: (n) => (n % 2 ? 1 / n : n), E: { pts: [0], plusInf: true }, sup: Infinity, inf: 0 },
        };
        const which = v.select('', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'five');
        const kS = v.slider('window start $K$', 5, 2000, 60, { log: true, fmt: (x) => String(Math.round(x)) });
        const Y = [-2.35, 2.75];
        const L = v.stage({ x: [-0.05, 5.75], y: Y, height: 380, axes: 'box', full: true, xticks: LOGTICKS, title: 'terms $s_n$ against $n$ (log scale); on the right, a histogram of the late terms beside the set $E$' });
        const X0 = 4.3, rx = (x) => X0 + 1.15 * x;
        const R = {
          rect: (a, b, c, d, o) => L.rect(rx(a), b, rx(c), d, o), line: (a, b, c, d, o) => L.line(rx(a), b, rx(c), d, o),
          dot: (a, b, o) => L.dot(rx(a), b, o), tex: (t, a, b, o) => L.tex(t, rx(a), b, o), text: (t, a, b, o) => L.text(t, rx(a), b, o),
        };
        let st = {};
        v.render(() => {
          const S = SEQ[which.value], K = Math.round(kS.value), K2 = Math.min(NM, 5 * K);
          L.vband(lg(K), lg(K2), { color: 'gold', alpha: 0.12 });
          const pts = []; for (let n = 1; n <= NM; n++) { const y = S.f(n); pts.push([lg(n), Math.min(Y[1] + 1, y)]); }
          L.dots(pts, { color: 'accent', r: 1.5, alpha: 0.6 });
          for (const [val, lab, top] of [[S.sup, 's^*', true], [S.inf, 's_*', false]]) {
            if (isFinite(val)) { L.hline(val, { color: 'green', width: 1.6, dash: [6, 4] }); L.tex(lab, 4.0, val, { color: 'green', align: 'right', baseline: top ? 'bottom' : 'top', dy: top ? -3 : 3, size: 14 }); }
          }
          if (!isFinite(S.sup)) { L.corner('the even terms leave the picture upwards, towards +∞', 'tl', { color: 'green', weight: 600 }); }
          // histogram of late terms (right-hand strip)
          L.rect(X0 - 0.12, Y[0], 5.75, Y[1], { fill: 'panel', fillAlpha: 1, stroke: false });
          L.line(X0 - 0.12, Y[0], X0 - 0.12, Y[1], { color: 'faint', width: 1 });
          const B = 64, h = new Array(B).fill(0); let cnt = 0, above = 0;
          for (let n = K; n <= K2; n++) { const y = S.f(n); if (y > Y[1]) { above++; continue; } const b = Math.floor((y - Y[0]) / (Y[1] - Y[0]) * B); if (b >= 0 && b < B) { h[b]++; cnt++; } }
          const hmax = Math.max(1, ...h);
          for (let b = 0; b < B; b++) if (h[b]) { const y0 = Y[0] + (Y[1] - Y[0]) * b / B; R.rect(0, y0, 0.8 * h[b] / hmax, y0 + (Y[1] - Y[0]) / B, { fill: 'gold', fillAlpha: 0.75, stroke: false }); }
          R.line(0, Y[0], 0, Y[1], { color: 'faint', width: 1 });
          const EX = 1.02;
          R.line(EX, Y[0] + 0.05, EX, Y[1] - 0.05, { color: 'faint', width: 1 });
          if (S.E.seg) R.line(EX, S.E.seg[0], EX, S.E.seg[1], { color: 'green', width: 6, cap: 'butt' });
          for (const p of S.E.pts || []) R.dot(EX, p, { color: 'green', r: 5.5 });
          if (S.E.plusInf) { R.dot(EX, Y[1] - 0.12, { color: 'green', r: 5.5 }); R.tex('+\\infty', EX, Y[1] - 0.12, { color: 'green', align: 'left', dx: 9, size: 13 }); R.text(`${above} late terms above the frame`, 0.02, Y[1] - 0.45, { color: 'gold', size: 11 }); }
          R.tex('E', EX, Y[0] + 0.12, { color: 'green', align: 'left', dx: 8, size: 15 });
          if (isFinite(S.sup)) R.tex('s^*', EX, S.sup, { color: 'green', align: 'left', dx: 8, size: 14 });
          R.tex('s_*', EX, S.inf, { color: 'green', align: 'left', dx: 8, size: 14 });
          v.legend([['accent', 'terms $s_n$', { dot: true }], ['gold', `late window $K\\le n\\le 5K$`, { area: true }], ['green', 'subsequential limits $E$; $s^*=\\sup E$, $s_*=\\inf E$', { dot: true }]]);
          st = { S, K, K2, cnt, above };
        });
        v.readout(() => {
          const s = st; if (!s.S) return '';
          const fx = (x) => (isFinite(x) ? v.fix(x, 4) : '+\\infty');
          return `$\\limsup s_n = s^* = ${fx(s.S.sup)}$, $\\ \\liminf s_n = s_* = ${fx(s.S.inf)}$. The histogram uses the ${s.K2 - s.K + 1} terms with $${s.K}\\le n\\le ${s.K2}$.`;
        });
      },
    },
  ],
};
