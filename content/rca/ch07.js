// Rudin, Real and Complex Analysis — Chapter 7: Differentiation

// ---------------------------------------------------------------- shared helpers (batch 1)
/** Error function (Abramowitz–Stegun 7.1.26, |error| < 1.5e-7). */
function erf(x) {
  const s = x < 0 ? -1 : 1; x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  return s * (1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x));
}
const SQPI = Math.sqrt(Math.PI);
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
/** Tick labels for an axis that shows log10 of a quantity. */
function logTicks(a, b) {
  const out = [];
  for (let k = Math.ceil(a); k <= b; k++) out.push([k, k === 0 ? '1' : k === 1 ? '10' : k === -1 ? '0.1' : '10' + String(k).split('').map((c) => SUP[c]).join('')]);
  return out;
}
const logspace = (a, b, n) => Array.from({ length: n }, (_, i) => Math.pow(10, a + (b - a) * i / (n - 1)));
/** sup over r of q(r): best of a sorted radius grid, refined by golden-section search in log r around the best grid point. Returns [sup, argmax]. */
function supOver(q, rs, extra = []) {
  let bi = 0, best = -Infinity;
  rs.forEach((r, i) => { const y = q(r); if (y > best) { best = y; bi = i; } });
  let at = rs[bi];
  let lo = Math.log(rs[Math.max(0, bi - 1)]), hi = Math.log(rs[Math.min(rs.length - 1, bi + 1)]);
  const g = (Math.sqrt(5) - 1) / 2;
  for (let k = 0; k < 24; k++) { const a = hi - g * (hi - lo), b = lo + g * (hi - lo); if (q(Math.exp(a)) > q(Math.exp(b))) hi = b; else lo = a; }
  const rr = Math.exp((lo + hi) / 2), yy = q(rr); if (yy > best) { best = yy; at = rr; }
  for (const r of extra) { if (r > 0) { const y = q(r); if (y > best) { best = y; at = r; } } }
  return [best, at];
}
/** Draw y = f(x) on [a,b], broken at the listed points (no vertical joins at jumps). */
function pieces(S, f, a, b, breaks, st) {
  const cuts = [a, ...breaks.filter((c) => c > a && c < b).sort((u, w) => u - w), b];
  for (let i = 0; i + 1 < cuts.length; i++) {
    const lo = cuts[i] + (i > 0 ? 1e-9 : 0), hi = cuts[i + 1] - (i + 2 < cuts.length ? 1e-9 : 0);
    if (hi > lo) S.fn(f, { ...st, domain: [lo, hi] });
  }
}
/** Fat Cantor set: at step k remove an open middle interval of length 4^-k from each piece; m(E) = 1/2. */
function fatCantor(levels) {
  let I = [[0, 1]];
  for (let k = 1; k <= levels; k++) {
    const g = Math.pow(4, -k);
    I = I.flatMap(([a, b]) => { const c = (a + b) / 2; return [[a, c - g / 2], [c + g / 2, b]]; });
  }
  const cum = [0];
  for (const [a, b] of I) cum.push(cum[cum.length - 1] + (b - a));
  const find = (t) => { let lo = 0, hi = I.length - 1; if (t < I[0][0]) return -1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (I[m][0] <= t) lo = m; else hi = m - 1; } return lo; };
  const F = (t) => { const i = find(t); if (i < 0) return 0; return cum[i] + Math.min(Math.max(t - I[i][0], 0), I[i][1] - I[i][0]); };
  return { I, measure: (a, b) => F(b) - F(a), has: (t) => { const i = find(t); return i >= 0 && t <= I[i][1]; } };
}

export default {
  book: 'rca',
  chapter: 7,
  title: 'Differentiation',
  summary: String.raw`How do we recover a function from its integral, or a measure from its values on small balls? Rudin answers with the Hardy–Littlewood maximal function: a simple covering lemma gives a weak-type bound for it, and that bound yields Lebesgue's differentiation theorem — almost every point is a Lebesgue point, and the Radon–Nikodym derivative is a limit of ratios over nicely shrinking sets. The second part settles the fundamental theorem of calculus for Lebesgue integrals through absolute continuity (the Cantor function shows why it is needed), and the chapter ends with the change-of-variables formula for maps that are merely differentiable on the set of integration.`,
  items: [
    // ------------------------------------------------------------------ 7.2
    {
      num: '7.2',
      kind: 'Definition',
      name: 'Symmetric derivative and maximal function of a measure',
      statement: String.raw`Let $B(x,r)$ be the open ball of radius $r>0$ about $x\in\R^k$ and let $m$ be Lebesgue measure on $\R^k$; the number $m(B_r)=m(B(x,r))$ does not depend on $x$. For a complex Borel measure $\mu$ on $\R^k$ put
$$(Q_r\mu)(x)=\frac{\mu(B(x,r))}{m(B_r)} .$$
The **symmetric derivative** of $\mu$ at $x$ is $(D\mu)(x)=\lim_{r\to0}(Q_r\mu)(x)$, at every $x$ where this limit exists. The **maximal function** of $\mu$ is
$$(M\mu)(x)=\sup_{0<r<\infty}(Q_r|\mu|)(x)\qquad(x\in\R^k),$$
a function $M\mu:\R^k\to[0,\infty]$ that is lower semicontinuous, hence Borel measurable.`,
      idea: String.raw`$Q_r\mu(x)$ is the average density of $\mu$ on a ball, so $D\mu$ is an infinitesimal density: if $d\mu=f\,dm$ with $f$ continuous at $x$, then $(D\mu)(x)=f(x)$, while at a point mass the quotients blow up. The maximal function records the worst average over *all* scales at once; it is the tool that converts pointwise questions about $D\mu$ into a measure estimate (7.4). Lower semicontinuity: if $Q_r|\mu|(x)>\lambda$, pick $s>r$ so close to $r$ that $|\mu|(B(x,r))>\lambda\,m(B_s)$; every $y$ with $|y-x|<s-r$ has $B(y,s)\supset B(x,r)$, so $M\mu(y)>\lambda$ on a neighbourhood of $x$.`,
      caption: String.raw`Here $k=1$ and $\mu=f\,dm+c\,\delta_p$: a density with a jump, a smooth bump, and a point mass. Drag $x$ and change $r$; the orange interval is $B(x,r)$ and the gold rectangle over it carries the same mass as $\mu$, so its height is $Q_r\mu(x)$. The lower panel plots $r\mapsto Q_r\mu(x)$ on a log scale: it settles at $(D\mu)(x)$ — the mean of the two one-sided values of $f$ at a jump — explodes near the atom, and its supremum is $M\mu(x)$. Switch on the envelope to see $M\mu$ along the whole line.`,
      deps: ['rca-1.18', 'rca-2.20', 'rca-2.8'],
      tags: ['derivative of a measure', 'maximal function'],
      viz(v) {
        const M = v.M;
        const P = 3.3, C = 0.3;
        const f = (t) => (t >= 0.4 && t < 1.4 ? 1 : 0) + 1.6 * Math.exp(-(((t - 2.4) / 0.28) ** 2));
        const G = (t) => M.clamp(t - 0.4, 0, 1) + 1.6 * 0.28 * SQPI / 2 * (1 + erf((t - 2.4) / 0.28));
        const mu = (a, b) => G(b) - G(a) + (P > a && P < b ? C : 0); // μ((a,b))
        const Q = (x, r) => mu(x - r, x + r) / (2 * r);
        const RG = logspace(-3.2, 1.3, 120);
        const sup = (x) => supOver((r) => Q(x, r), RG, [Math.abs(x - P) * (1 + 1e-9)]);
        const top = v.stage({ x: [-0.4, 4.2], y: [-0.3, 2.75], height: 290, full: true, xlabel: 'x' });
        const bot = v.stage({ x: [-3.2, 1.25], y: [0, 2.5], height: 210, full: true, axes: 'box', xticks: logTicks(-3, 1), title: 'the quotient $Q_r\\mu(x)$ against the radius $r$ (log scale)' });
        const rS = v.slider('radius $r$', 0.002, 3, 0.2, { log: true, fmt: (x) => v.fmt(x, 2) });
        const env = v.toggle('show $M\\mu$ on the whole line', true);
        const xh = top.handle(2.95, 0, { color: 'accent', label: 'x', constrain: 'x' });
        const XS = M.linspace(-0.4, 4.2, 461), ENV = XS.map((x) => sup(x)[0]);
        const RS = logspace(-3.2, 1.25, 220);
        let st = {};
        v.legend([['accent', 'density $f$ and atom $c\\,\\delta_p$'], ['orange', 'ball $B(x,r)$', { area: true }], ['gold', 'height $Q_r\\mu(x)$, same mass', { area: true }], ['purple', '$M\\mu$']]);
        v.render(() => {
          const x = xh.x, r = rS.value, q = Q(x, r);
          // top panel
          top.vband(x - r, x + r, { color: 'orange', alpha: 0.12, edges: true });
          top.rect(x - r, 0, x + r, q, { fill: 'gold', fillAlpha: 0.28, color: 'gold', width: 1.4 });
          pieces(top, f, -0.4, 4.2, [0.4, 1.4], { color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.13 });
          top.arrow(P, 0, P, 2.35, { color: 'accent', width: 2.6, head: 11 });
          top.tex('c\\,\\delta_p', P, 2.42, { color: 'accent', baseline: 'bottom', size: 14 });
          if (env.value) top.path(XS.map((t, i) => [t, ENV[i]]), { color: 'purple', width: 2 });
          // bottom panel
          const qs = RS.map((s) => Q(x, s));
          const [Mx, at] = sup(x);
          const near = Math.abs(x - P) < 1e-9;
          const lim = near ? Infinity : (f(x - 1e-9) + f(x + 1e-9)) / 2;
          const ymax = M.clamp(Math.max(...qs) * 1.15, 2.2, 9);
          bot.setView(null, [-0.1 * ymax, ymax]);
          if (isFinite(lim)) { bot.hline(lim, { color: 'green', dash: [6, 4], width: 1.6 }); bot.tex('(D\\mu)(x)', -3.15, lim, { color: 'green', align: 'left', baseline: 'bottom', dy: -3, size: 13 }); }
          bot.hline(Mx, { color: 'purple', dash: [3, 4], width: 1.3 });
          bot.path(RS.map((s, i) => [Math.log10(s), qs[i]]), { color: 'accent', width: 2.4 });
          bot.dot(Math.log10(at), Mx, { color: 'purple', r: 4.5, label: 'Mμ(x)', labelPos: Mx > ymax * 0.8 ? 'se' : 'ne' });
          bot.vline(Math.log10(r), { color: 'orange', dash: [3, 3], width: 1.2 });
          bot.dot(Math.log10(r), q, { color: 'gold', r: 5.5 });
          st = { x, r, q, lim, Mx, at };
        });
        v.readout(() => `$x=${v.fix(st.x, 3)},\\ r=${v.fmt(st.r, 3)}$: $\\;Q_r\\mu(x)=${v.fix(st.q, 3)}$, $\\;(D\\mu)(x)=${isFinite(st.lim) ? v.fix(st.lim, 3) : '\\text{does not exist}'}$, $\\;(M\\mu)(x)=\\sup_r Q_r\\mu(x)=${v.fix(st.Mx, 3)}$ (attained near $r=${v.fmt(st.at, 2)}$).`);
      },
    },
    // ------------------------------------------------------------------ 7.3
    {
      num: '7.3',
      kind: 'Lemma',
      name: 'Covering lemma: disjoint balls whose triples cover',
      statement: String.raw`Let $W$ be the union of finitely many open balls $B(x_i,r_i)$, $1\le i\le N$, in $\R^k$. Then there is a set $S\subset\{1,\dots,N\}$ such that
(a) the balls $B(x_i,r_i)$ with $i\in S$ are pairwise disjoint,
(b) $W\subset\bigcup_{i\in S}B(x_i,3r_i)$, and
(c) $m(W)\le 3^k\sum_{i\in S}m(B(x_i,r_i))$.`,
      idea: String.raw`Choose greedily: take a ball of largest radius, throw away every ball that meets it, and repeat with the survivors. A discarded ball $B(x_j,r_j)$ meets some chosen $B(x_i,r_i)$ with $r_i\ge r_j$, so $|x_j-x_i|<r_i+r_j$ and every point of $B(x_j,r_j)$ lies within $r_i+2r_j\le3r_i$ of $x_i$; this is (b). Since a dilation by $3$ multiplies Lebesgue measure by $3^k$ (2.20), (c) follows from (b).`,
      caption: String.raw`A random finite family of discs in the plane ($k=2$, so $3^k=9$). Step through the greedy choice: the next chosen disc (green, numbered) is the largest survivor, and the discs that meet it (red) are discarded. The dashed circles are the enlargements $B(x_i,3r_i)$ — when the selection is finished they swallow every disc, and the bars compare $m(W)$ with $\sum_S m(B_i)$ and $9\sum_S m(B_i)$.`,
      deps: ['rca-2.20'],
      tags: ['covering lemma', 'Lebesgue measure'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-4.6, 4.6], y: [-2.9, 2.9], equal: true, axes: false, height: 370, weight: 2.4 });
        const Bs = v.stage({ x: [0.35, 3.65], y: [0, 1], height: 370, axes: 'box', weight: 1, minWidth: 200, xticks: [[1, 'm(W)'], [2, 'Σ m(Bᵢ)'], [3, '9·Σ m(Bᵢ)']], title: 'areas, $i\\in S$' });
        let seed = 11, step = Infinity, cache = null;
        const nS = v.slider('number of discs $N$', 3, 36, 18, { int: true, onChange: () => { step = Infinity; } });
        const tri = v.toggle('show $B(x_i,3r_i)$', true);
        v.button('Resample', () => { seed = (seed * 7919 + 17) % 100003; step = Infinity; });
        v.button('Restart', () => { step = 0; });
        v.button('Next step', () => { const n = cache ? cache.steps.length : 1; step = step >= n ? 1 : step + 1; });
        const circ = (b, s = 1) => M.range(72).map((k) => [b.x + s * b.r * Math.cos(k * M.TAU / 72), b.y + s * b.r * Math.sin(k * M.TAU / 72)]);
        function build(sd, N) {
          const R = M.rng(sd), balls = [];
          for (let i = 0; i < N; i++) { const r = 0.2 + 0.8 * Math.pow(R(), 1.7); balls.push({ x: R.uniform(-2.7, 2.7), y: R.uniform(-1.55, 1.55), r }); }
          const order = M.range(N).sort((a, b) => balls[b].r - balls[a].r);
          const alive = new Set(order), steps = [];
          for (const i of order) {
            if (!alive.has(i)) continue;
            const killed = [];
            for (const j of [...alive]) if (Math.hypot(balls[i].x - balls[j].x, balls[i].y - balls[j].y) < balls[i].r + balls[j].r) { alive.delete(j); if (j !== i) killed.push(j); }
            steps.push({ i, killed });
          }
          // m(W) by counting grid cells (each disc marks the cells in its bounding box)
          const h = 0.012, x0 = -5.5, y0 = -4, nx = Math.ceil(11 / h), ny = Math.ceil(8 / h), mark = new Uint8Array(nx * ny);
          for (const b of balls) {
            const i0 = Math.max(0, Math.floor((b.x - b.r - x0) / h)), i1 = Math.min(nx - 1, Math.ceil((b.x + b.r - x0) / h));
            const j0 = Math.max(0, Math.floor((b.y - b.r - y0) / h)), j1 = Math.min(ny - 1, Math.ceil((b.y + b.r - y0) / h));
            for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const px = x0 + (i + 0.5) * h, py = y0 + (j + 0.5) * h; if ((px - b.x) ** 2 + (py - b.y) ** 2 < b.r * b.r) mark[i * ny + j] = 1; }
          }
          let cnt = 0; for (let k = 0; k < mark.length; k++) cnt += mark[k];
          const covered = balls.every((b) => steps.some(({ i }) => Math.hypot(b.x - balls[i].x, b.y - balls[i].y) + b.r <= 3 * balls[i].r + 1e-12));
          return { key: sd + ':' + N, balls, steps, mW: cnt * h * h, covered };
        }
        let st = {};
        v.legend([['accent', 'the union $W$', { area: true }], ['green', 'chosen balls $B(x_i,r_i)$, $i\\in S$', { area: true }], ['red', 'discarded at this step', { area: true }], ['green', '$B(x_i,3r_i)$', { dash: true }]]);
        v.render(() => {
          const N = nS.value;
          if (!cache || cache.key !== seed + ':' + N) cache = build(seed, N);
          const { balls, steps } = cache;
          const k = Math.min(step, steps.length), done = k >= steps.length;
          const chosen = steps.slice(0, k).map((s) => s.i);
          const gone = new Set(steps.slice(0, k).flatMap((s) => s.killed));
          const cur = k > 0 ? steps[k - 1] : null;
          S.rings(balls.map((b) => circ(b)), { fill: 'accent', fillAlpha: 0.1, stroke: false });
          balls.forEach((b, j) => {
            if (chosen.includes(j)) return;
            if (cur && !done && cur.killed.includes(j)) S.poly(circ(b), { fill: 'red', fillAlpha: 0.16, color: 'red', width: 1.8 });
            else if (gone.has(j)) S.poly(circ(b), { color: 'muted', width: 1, dash: [3, 3] });
            else S.poly(circ(b), { color: 'accent', width: 1.6 });
          });
          chosen.forEach((i, n) => {
            const b = balls[i];
            S.poly(circ(b), { fill: 'green', fillAlpha: 0.3, color: 'green', width: 2.2 });
            if (tri.value) S.poly(circ(b, 3), { color: 'green', width: cur && cur.i === i && !done ? 2 : 1.1, dash: [5, 4], alpha: cur && cur.i === i && !done ? 0.95 : 0.5 });
            S.text(String(n + 1), b.x, b.y, { color: 'green', size: 12, weight: 700, align: 'center' });
          });
          if (cur && !done) S.corner(`step ${k}: largest survivor chosen, ${cur.killed.length} disc${cur.killed.length === 1 ? '' : 's'} meeting it discarded`, 'tl', { color: 'ink' });
          else if (done) S.corner(cache.covered ? 'finished: every disc lies inside some dashed B(xᵢ, 3rᵢ)' : 'finished', 'tl', { color: 'green', weight: 600 });
          else S.corner('press "Next step" to start the greedy selection', 'tl');
          const sumS = chosen.reduce((s, i) => s + Math.PI * balls[i].r ** 2, 0);
          const top = Math.max(9 * sumS, cache.mW) * 1.14 || 1;
          Bs.setView(null, [0, top]);
          const bar = (x, h, col, a) => { Bs.rect(x - 0.32, 0, x + 0.32, h, { fill: col, fillAlpha: a, stroke: false }); Bs.text(v.fmt(h, 3), x, h, { dy: -9, align: 'center', size: 11.5, color: col }); };
          bar(1, cache.mW, 'accent', 0.6); bar(2, sumS, 'green', 0.75); bar(3, 9 * sumS, 'green', 0.35);
          st = { k, done, n: chosen.length, sumS, mW: cache.mW, covered: cache.covered };
        });
        v.readout(() => st.done
          ? `$|S|=${st.n}$ disjoint discs; ${st.covered ? 'each of the $N$ discs lies in some $B(x_i,3r_i)$, so (b) holds' : ''}; $\\;m(W)\\approx${v.fix(st.mW, 3)}\\le 9\\sum_{S}m(B_i)=${v.fix(9 * st.sumS, 3)}$.`
          : `After ${st.k} step${st.k === 1 ? '' : 's'}: $\\sum m(B_i)$ over the chosen discs $=${v.fix(st.sumS, 3)}$, $\\;m(W)\\approx${v.fix(st.mW, 3)}$.`);
      },
    },
    // ------------------------------------------------------------------ 7.4
    {
      num: '7.4',
      kind: 'Theorem',
      name: 'The maximal theorem (weak-type bound for Mμ)',
      statement: String.raw`If $\mu$ is a complex Borel measure on $\R^k$ and $\lambda>0$, then
$$m\{x\in\R^k:(M\mu)(x)>\lambda\}\le 3^k\lambda^{-1}\|\mu\| ,$$
where $\|\mu\|=|\mu|(\R^k)$ is the total variation of $\mu$. (The set on the left is open, because $M\mu$ is lower semicontinuous.)`,
      idea: String.raw`Let $K$ be a compact subset of the open set $\{M\mu>\lambda\}$. Every $x\in K$ is the centre of a ball $B$ with $|\mu|(B)>\lambda\,m(B)$, and finitely many of these balls cover $K$. The covering lemma 7.3 extracts disjoint ones $B_i$ whose triples still cover, so
$$m(K)\le 3^k\sum_i m(B_i)<3^k\lambda^{-1}\sum_i|\mu|(B_i)\le 3^k\lambda^{-1}\|\mu\| .$$
Taking the supremum over $K$ (inner regularity of $m$) finishes the proof.`,
      caption: String.raw`Choose a measure on the line ($k=1$, so the constant is $3$) and drag the level $\lambda$. The purple curve is $M\mu$, computed as an honest supremum over radii; the orange intervals make up the open set $\{M\mu>\lambda\}$. The lower panel shows $\lambda\cdot m\{M\mu>\lambda\}$ for every $\lambda$: it never exceeds $3\|\mu\|$, although $M\mu$ is not integrable — far away it decays only like $\|\mu\|/(2|x|)$.`,
      deps: ['rca-7.2', 'rca-7.3', 'rca-2.20', 'rca-6.2'],
      tags: ['maximal function', 'weak type'],
      viz(v) {
        const M = v.M;
        const OPT = {
          bumps: { label: 'two bumps', atoms: [], f: (t) => 1.4 * Math.exp(-(((t + 0.9) / 0.18) ** 2)) + 0.8 * Math.exp(-(((t - 0.8) / 0.35) ** 2)), G: (t) => 1.4 * 0.18 * SQPI / 2 * (1 + erf((t + 0.9) / 0.18)) + 0.8 * 0.35 * SQPI / 2 * (1 + erf((t - 0.8) / 0.35)) },
          spike: { label: '$\\tfrac14|x|^{-1/2}$ on $[-1,1]$', atoms: [], f: (t) => (Math.abs(t) <= 1 && t !== 0 ? 0.25 / Math.sqrt(Math.abs(t)) : 0), G: (t) => (t <= -1 ? 0 : t >= 1 ? 1 : t < 0 ? (1 - Math.sqrt(-t)) / 2 : (1 + Math.sqrt(t)) / 2) },
          atoms: { label: 'two point masses', atoms: [[-0.7, 0.6], [0.9, 0.4]], f: null, G: () => 0 },
        };
        const which = v.select('$\\mu$', Object.entries(OPT).map(([value, o]) => ({ value, label: o.label })), 'bumps');
        const top = v.stage({ x: [-3, 3], y: [-0.25, 3.1], height: 290, full: true, xlabel: 'x' });
        const bot = v.stage({ x: [-1.6, 0.55], y: [-0.3, 3.4], height: 200, full: true, axes: 'box', title: '$\\lambda\\cdot m\\{M\\mu>\\lambda\\}$ against $\\lambda$ (log scale)', xticks: [[Math.log10(0.03), '0.03'], [-1, '0.1'], [Math.log10(0.3), '0.3'], [0, '1'], [Math.log10(3), '3']] });
        const lam = top.handle(2.55, 0.6, { color: 'orange', label: 'λ', labelPos: 'n', constrain: (x, y) => [2.55, M.clamp(y, 0.03, 3.0)] });
        const cache = {};
        function data(key) {
          if (cache[key]) return cache[key];
          const O = OPT[key];
          const mu = (a, b) => O.G(b) - O.G(a) + O.atoms.reduce((s, [p, c]) => s + (p > a && p < b ? c : 0), 0);
          const norm = mu(-1e9, 1e9);
          const U = Math.asinh(80 / 0.25), n = 1601, xs = [];
          for (let i = 0; i < n; i++) xs.push(0.25 * Math.sinh(-U + 2 * U * i / (n - 1)));
          const RS = logspace(-4, 2.6, 100);
          const Mfun = (x) => supOver((r) => mu(x - r, x + r) / (2 * r), RS, O.atoms.map(([p]) => Math.abs(x - p) * (1 + 1e-9)))[0];
          const Mf = xs.map(Mfun);
          // {g > l} as a union of intervals: runs on the grid, endpoints refined by bisection
          const level = (g, gv, l) => {
            const out = []; let a = null;
            const edge = (lo, hi) => { for (let k = 0; k < 22; k++) { const mid = (lo + hi) / 2; if ((g(mid) > l) === (g(lo) > l)) lo = mid; else hi = mid; } return (lo + hi) / 2; };
            for (let i = 0; i < n; i++) {
              const inS = gv[i] > l;
              if (inS && a === null) a = i === 0 ? xs[0] : edge(xs[i - 1], xs[i]);
              if (!inS && a !== null) { out.push([a, edge(xs[i - 1], xs[i])]); a = null; }
            }
            if (a !== null) out.push([a, xs[n - 1]]);
            return out;
          };
          const meas = (runs) => runs.reduce((s, [p, q]) => s + (q - p), 0);
          const LS = logspace(-1.6, 0.55, 90);
          const curveM = LS.map((l) => l * meas(level(Mfun, Mf, l)));
          const fv = O.f ? xs.map(O.f) : null;
          const curveF = fv ? LS.map((l) => l * meas(level(O.f, fv, l))) : null;
          return (cache[key] = { O, xs, Mf, Mfun, norm, level, meas, LS, curveM, curveF });
        }
        let st = {};
        v.render(() => {
          const D = data(which.value), O = D.O, l = lam.y;
          v.legend([['accent', O.f ? 'density $f$ of $\\mu$' : 'point masses of $\\mu$'], ['purple', '$M\\mu$'], ['orange', '$\\{M\\mu>\\lambda\\}$', { area: true }], ['red', 'bound $3\\|\\mu\\|$', { dash: true }]]
            .concat(O.f ? [['accent', '$\\lambda\\,m\\{f>\\lambda\\}$ (for comparison)', { dash: true }]] : []));
          const runs = D.level(D.Mfun, D.Mf, l);
          for (const [p, q] of runs) { top.vband(p, q, { color: 'orange', alpha: 0.11 }); top.line(p, 0, q, 0, { color: 'orange', width: 5, cap: 'butt' }); }
          for (const [p, q] of runs) { if (p < -3) top.text('◀ continues to ' + v.fmt(p, 3), -2.95, 0.22, { color: 'orange', size: 11 }); if (q > 3) top.text('continues to ' + v.fmt(q, 3) + ' ▶', 2.95, 0.22, { color: 'orange', size: 11, align: 'right' }); }
          if (O.f) top.fn(O.f, { color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.14, n: 1400 });
          for (const [p, c] of O.atoms) { top.arrow(p, 0, p, 2.6 * c / 0.6, { color: 'accent', width: 2.6, head: 10 }); top.tex(`${c}\\,\\delta_{${p}}`, p, 2.6 * c / 0.6, { color: 'accent', baseline: 'bottom', dy: -3, size: 13 }); }
          const inView = D.xs.map((x, i) => [x, D.Mf[i]]).filter(([x]) => x > -3.2 && x < 3.2);
          top.path(inView, { color: 'purple', width: 2.2 });
          top.hline(l, { color: 'orange', width: 1.4, dash: [6, 4] });
          const m = D.meas(runs);
          // bottom
          const bound = 3 * D.norm, H = bound * 1.2;
          bot.setView(null, [-0.1 * H, H]);
          bot.hline(bound, { color: 'red', dash: [6, 4], width: 1.5 });
          bot.text('3‖μ‖', 0.53, bound, { dy: -9, color: 'red', size: 11.5, align: 'right' });
          bot.hline(D.norm, { color: 'muted', dash: [2, 4], width: 1 });
          bot.text('‖μ‖', 0.53, D.norm, { dy: -9, color: 'muted', size: 11.5, align: 'right' });
          if (D.curveF) bot.path(D.LS.map((x, i) => [Math.log10(x), D.curveF[i]]), { color: 'accent', width: 1.6, dash: [4, 3] });
          bot.path(D.LS.map((x, i) => [Math.log10(x), D.curveM[i]]), { color: 'purple', width: 2.4 });
          bot.vline(Math.log10(l), { color: 'orange', dash: [3, 3], width: 1.2 });
          bot.dot(Math.log10(l), l * m, { color: 'orange', r: 5 });
          st = { l, m, bound: bound / l, norm: D.norm };
        });
        v.readout(() => `$\\lambda=${v.fix(st.l, 3)}$: $\\;m\\{M\\mu>\\lambda\\}=${v.fix(st.m, 3)}\\;\\le\\;3\\|\\mu\\|/\\lambda=${v.fix(st.bound, 3)}$ $\\;(\\|\\mu\\|=${v.fix(st.norm, 3)}$; ratio $${v.fix(st.m / st.bound, 3)})$.`);
      },
    },
    // ------------------------------------------------------------------ 7.5
    {
      num: '7.5',
      kind: 'Definition',
      name: 'Weak L¹ and the maximal function of an L¹ function',
      statement: String.raw`For $f\in L^1(\R^k)$ and $\lambda>0$ one always has $m\{|f|>\lambda\}\le\lambda^{-1}\|f\|_1$. A measurable $f$ is said to belong to **weak $L^1$** if $\lambda\cdot m\{|f|>\lambda\}$ is a bounded function of $\lambda\in(0,\infty)$; so $L^1\subset$ weak $L^1$, and the inclusion is proper. The **maximal function** of $f\in L^1(\R^k)$ is
$$(Mf)(x)=\sup_{0<r<\infty}\frac{1}{m(B_r)}\int_{B(x,r)}|f|\,dm .$$
If $f$ is identified with the measure $d\mu=f\,dm$, then $Mf=M\mu$ and $\|\mu\|=\|f\|_1$, so Theorem 7.4 says that $M$ maps $L^1$ into weak $L^1$: $m\{Mf>\lambda\}\le3^k\lambda^{-1}\|f\|_1$.`,
      idea: String.raw`The first inequality is Chebyshev's: $\lambda\,m\{|f|>\lambda\}\le\int_{\{|f|>\lambda\}}|f|\,dm\le\|f\|_1$. On $\R$, $1/|x|$ shows that weak $L^1$ is larger: $m\{1/|x|>\lambda\}=2/\lambda$, so $\lambda\,m\{\cdot\}\equiv2$, while $\int dx/|x|=\infty$. The maximal function of a nonzero $f\in L^1$ is never integrable — far out it is at least a constant times $1/|x|$ — so weak $L^1$ is exactly the right home for it.`,
      caption: String.raw`Pick a function and drag the level $\lambda$; the orange set is $\{|f|>\lambda\}$. The lower panel tracks $\lambda\cdot m\{|f|>\lambda\}$ over six decades of $\lambda$. For the integrable $|x|^{-1/2}\chi_{[-1,1]}$ it stays below $\|f\|_1=4$; for $1/|x|$ it is constant although the integral diverges; for $|x|^{-3/2}$ it is unbounded, so that function is not even in weak $L^1$. The last choice is the maximal function of $\chi_{[-1/2,1/2]}$: exactly $1/(2|x|+1)$ outside the box, not integrable, but weak $L^1$.`,
      deps: ['rca-7.4', 'rca-1.30'],
      tags: ['weak L¹', 'maximal function'],
      viz(v) {
        const M = v.M;
        const FN = {
          root: { label: '$|x|^{-1/2}\\chi_{[-1,1]}$', f: (x) => (Math.abs(x) <= 1 ? 1 / Math.sqrt(Math.abs(x)) : 0), m: (l) => (l < 1 ? 2 : 2 / (l * l)), half: (l) => (l < 1 ? 1 : 1 / (l * l)), norm: 4, br: [-1, 0, 1] },
          inv: { label: '$1/|x|$', f: (x) => 1 / Math.abs(x), m: (l) => 2 / l, half: (l) => 1 / l, norm: Infinity, br: [0] },
          inv32: { label: '$|x|^{-3/2}$', f: (x) => Math.pow(Math.abs(x), -1.5), m: (l) => 2 * Math.pow(l, -2 / 3), half: (l) => Math.pow(l, -2 / 3), norm: Infinity, br: [0] },
          max: { label: '$M\\chi_{[-1/2,1/2]}$', f: (x) => (Math.abs(x) <= 0.5 ? 1 : 1 / (2 * Math.abs(x) + 1)), m: (l) => (l >= 1 ? 0 : 1 / l - 1), half: (l) => (l >= 1 ? 0 : (1 / l - 1) / 2), norm: Infinity, br: [] },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'root');
        const top = v.stage({ x: [-3, 3], y: [-0.2, 4.2], height: 280, full: true, xlabel: 'x' });
        const bot = v.stage({ x: [-2, 2], y: [-0.5, 5], height: 200, full: true, axes: 'box', xticks: logTicks(-2, 2), yticks: [1, 2, 3, 4, 5], title: '$\\lambda\\cdot m\\{|f|>\\lambda\\}$ against $\\lambda$ (log scale)' });
        const lam = top.handle(2.45, 1.3, { color: 'orange', label: 'λ', labelPos: 'n', constrain: (x, y) => [2.45, M.clamp(y, 0.05, 4)] });
        let st = {};
        v.render(() => {
          const F = FN[which.value], l = lam.y, hw = F.half(l);
          v.legend(which.value === 'max'
            ? [['accent', '$\\chi_{[-1/2,1/2]}$', { area: true }], ['purple', '$f=M\\chi_{[-1/2,1/2]}$'], ['orange', '$\\{f>\\lambda\\}$', { area: true }], ['red', 'bound $3\\|\\chi\\|_1=3$ from 7.4', { dash: true }]]
            : [['accent', '$|f|$'], ['orange', '$\\{|f|>\\lambda\\}$', { area: true }], ['green', '$\\|f\\|_1$ (Chebyshev bound)', { dash: true }]]);
          if (hw > 0) {
            top.vband(-hw, hw, { color: 'orange', alpha: 0.11 });
            top.line(Math.max(-hw, -3.1), 0, Math.min(hw, 3.1), 0, { color: 'orange', width: 5, cap: 'butt' });
            if (hw > 3) { top.text('◀ to ' + v.fmt(-hw, 3), -2.95, 0.25, { color: 'orange', size: 11 }); top.text('to ' + v.fmt(hw, 3) + ' ▶', 2.95, 0.25, { color: 'orange', size: 11, align: 'right' }); }
          }
          if (which.value === 'max') top.rect(-0.5, 0, 0.5, 1, { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 1.6 });
          pieces(top, F.f, -3, 3, F.br, { color: which.value === 'max' ? 'purple' : 'accent', width: 2.4, n: 1600 });
          top.hline(l, { color: 'orange', width: 1.4, dash: [6, 4] });
          // bottom
          const LS = logspace(-2, 2, 300);
          if (isFinite(F.norm)) { bot.hline(F.norm, { color: 'green', dash: [6, 4], width: 1.5 }); bot.text('‖f‖₁ = ' + F.norm, 1.95, F.norm, { dy: -9, color: 'green', size: 11.5, align: 'right' }); }
          if (which.value === 'max') { bot.hline(3, { color: 'red', dash: [6, 4], width: 1.5 }); bot.text('3‖χ‖₁ (Theorem 7.4)', 1.95, 3, { dy: -9, color: 'red', size: 11.5, align: 'right' }); bot.hline(1, { color: 'green', dash: [3, 4], width: 1.2 }); }
          bot.path(LS.map((x) => [Math.log10(x), Math.min(9, x * F.m(x))]), { color: which.value === 'max' ? 'purple' : 'accent', width: 2.4 });
          bot.vline(Math.log10(l), { color: 'orange', dash: [3, 3], width: 1.2 });
          bot.dot(Math.log10(l), l * F.m(l), { color: 'orange', r: 5 });
          const tag = { root: 'in L¹, hence weak L¹', inv: 'weak L¹ but not L¹', inv32: 'not weak L¹: λ·m grows like λ^(1/3)', max: 'Mχ: weak L¹, not L¹' }[which.value];
          bot.corner(tag, 'tl', { color: which.value === 'inv32' ? 'red' : 'green', weight: 600 });
          st = { l, m: F.m(l), F };
        });
        v.readout(() => `$\\lambda=${v.fix(st.l, 3)}$: $\\;m\\{|f|>\\lambda\\}=${v.fix(st.m, 4)}$, $\\;\\lambda\\cdot m\\{|f|>\\lambda\\}=${v.fix(st.l * st.m, 4)}$` + (isFinite(st.F.norm) ? ` $\\le\\|f\\|_1=${st.F.norm}$.` : '.'));
      },
    },
    // ------------------------------------------------------------------ 7.6
    {
      num: '7.6',
      kind: 'Definition',
      name: 'Lebesgue points',
      statement: String.raw`Let $f\in L^1(\R^k)$. A point $x\in\R^k$ is called a **Lebesgue point** of $f$ if
$$\lim_{r\to0}\frac{1}{m(B_r)}\int_{B(x,r)}|f(y)-f(x)|\,dm(y)=0 .$$
Every point at which $f$ is continuous is a Lebesgue point; in general the condition says that, on small balls about $x$, $f$ stays close to the value $f(x)$ *in the mean*.`,
      idea: String.raw`The quantity in the definition dominates $\bigl|\frac{1}{m(B_r)}\int_{B(x,r)}f\,dm-f(x)\bigr|$, so at a Lebesgue point the ball averages of $f$ converge to $f(x)$; the converse is false. Note that the value $f(x)$ matters, so changing $f$ at one point can create or destroy a Lebesgue point. At a jump from $a$ to $b$ the quantity tends to $\tfrac12\bigl(|a-f(x)|+|b-f(x)|\bigr)\ge\tfrac12|b-a|$ whatever $f(x)$ is, so a jump is never a Lebesgue point, although the averages converge to $\tfrac12(a+b)$.`,
      caption: String.raw`Choose $f$, drag the point $x$ (it snaps to the special point $0$), and there drag the value $f(0)$ as well. The shaded area is $|f-f(x)|$ over $B(x,r)$. Lower panel, against $\log r$: the Lebesgue quantity $\frac{1}{2r}\int_{x-r}^{x+r}|f-f(x)|$ (blue) and the error of the plain average, $\bigl|\frac{1}{2r}\int_{x-r}^{x+r}f-f(x)\bigr|$ (orange). At the jump, or at $0$ for $\sin(1/y)$, the orange curve can reach $0$ while the blue one cannot; at the removable point only the right value of $f(0)$ makes $0$ a Lebesgue point.`,
      deps: ['rca-1.30', 'rca-2.20'],
      tags: ['Lebesgue points', 'averages'],
      viz(v) {
        const M = v.M;
        const EX = {
          jump: { label: 'a jump', f: (y) => 0.7 + 0.25 * Math.sin(2 * y) + (y >= 0 ? 0.9 : 0), v0: 1.15, br: [0], y: [-0.25, 2.3] },
          rem: { label: 'a removable point', f: (y) => 1 + 0.4 * Math.cos(3 * y), v0: 2.0, br: [], y: [-0.25, 2.3] },
          osc: { label: '$\\sin(1/y)$', f: (y) => Math.sin(1 / y), v0: 0, br: [0], y: [-1.5, 1.5] },
        };
        const which = v.select('$f$ with', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'jump', { onChange: () => { val.y = EX[which.value].v0; } });
        const rS = v.slider('radius $r$', 0.0005, 1, 0.25, { log: true, fmt: (x) => v.fmt(x, 2) });
        const top = v.stage({ x: [-1.5, 1.5], y: [-0.25, 2.3], height: 270, full: true, xlabel: 'y' });
        const bot = v.stage({ x: [-3.3, 0.05], y: [-0.1, 1.2], height: 200, full: true, axes: 'box', xticks: logTicks(-3, 0), title: 'against the radius $r$ (log scale)' });
        const xh = top.handle(0, -0.12, { color: 'accent', label: 'x', labelPos: 'e', constrain: (x) => [Math.abs(x) < 0.05 ? 0 : M.clamp(x, -1.45, 1.45), xh.y] });
        const val = top.handle(0, 1.15, { color: 'gold', label: 'f(0)', labelPos: 'w', constrain: (x, y) => [0, M.clamp(y, -1.3, 2.2)] });
        // ∫ over [p,q] ⊂ (0,∞) of g(sin(1/y)) via u = 1/y: ∫_{1/q}^{1/p} g(sin u) u^{-2} du, long tails replaced by the mean of g over a period.
        function oscPos(p, q, g, gMean) {
          const U1 = 1 / q, U2 = p > 0 ? 1 / p : Infinity, W = 40 * Math.PI;
          const top_ = Math.min(U2, U1 + W), n = Math.max(40, Math.ceil((top_ - U1) / (Math.PI / 30)));
          let s = M.integrate((u) => g(Math.sin(u)) / (u * u), U1, top_, n + (n % 2));
          if (U2 > U1 + W) s += gMean * (1 / (U1 + W) - (isFinite(U2) ? 1 / U2 : 0));
          return s;
        }
        const meanOf = (g) => M.integrate((u) => g(Math.sin(u)), 0, M.TAU, 400) / M.TAU;
        function quantities(E, x, c, r) {
          const a = x - r, b = x + r;
          if (which.value === 'osc') {
            // split at 0; on (−∞,0) use sin(1/y) = −sin(1/|y|)
            const gA = (s) => Math.abs(s - c), gAn = (s) => Math.abs(-s - c), gS = (s) => s;
            const mA = meanOf(gA), mAn = meanOf(gAn);
            const piece = (p, q, gp, gn, mp, mn) => (p >= 0 ? oscPos(p, q, gp, mp) : q <= 0 ? oscPos(-q, -p, gn, mn) : oscPos(0, q, gp, mp) + oscPos(0, -p, gn, mn));
            const L = piece(a, b, gA, gAn, mA, mAn) / (2 * r);
            const I = piece(a, b, gS, (s) => -s, 0, 0) / (2 * r);
            return [L, Math.abs(I - c)];
          }
          const cuts = [a, ...E.br.filter((t) => t > a && t < b), b];
          let L = 0, I = 0;
          for (let i = 0; i + 1 < cuts.length; i++) { L += M.integrate((y) => Math.abs(E.f(y) - c), cuts[i], cuts[i + 1], 120); I += M.integrate(E.f, cuts[i], cuts[i + 1], 120); }
          return [L / (2 * r), Math.abs(I / (2 * r) - c)];
        }
        let st = {};
        v.legend([['accent', '$y\\mapsto|f(y)-f(x)|$ on $B(x,r)$', { area: true }], ['accent', 'Lebesgue quantity'], ['orange', 'error of the average']]);
        v.render(() => {
          const E = EX[which.value], x = xh.x, r = rS.value;
          top.setView(null, E.y); xh.y = E.y[0] + 0.05 * (E.y[1] - E.y[0]);
          val.visible = x === 0;
          const c = x === 0 ? val.y : E.f(x);
          top.vband(x - r, x + r, { color: 'orange', alpha: 0.1, edges: true });
          const n = which.value === 'osc' ? 2400 : 400;
          const cuts = [x - r, ...E.br.filter((t) => t > x - r && t < x + r), x + r];
          for (let i = 0; i + 1 < cuts.length; i++) top.between((y) => E.f(y), () => c, cuts[i] + 1e-9, cuts[i + 1] - 1e-9, { fill: 'accent', fillAlpha: 0.25, n });
          pieces(top, E.f, -1.5, 1.5, E.br, { color: 'ink', width: which.value === 'osc' ? 1.2 : 2.2, n: which.value === 'osc' ? 5000 : undefined });
          top.hline(c, { color: 'gold', dash: [5, 4], width: 1.2 });
          if (x !== 0) top.dot(x, c, { color: 'accent', r: 4.5 });
          else if (which.value !== 'osc') top.dot(0, E.f(1e-9), { hollow: true, r: 4, color: 'ink' });
          // lower panel
          const RS = logspace(-3.3, 0, which.value === 'osc' ? 70 : 90);
          const QS = RS.map((s) => quantities(E, x, c, s));
          const ymax = Math.max(1.1, ...QS.map((q) => q[0] * 1.12));
          bot.setView(null, [-0.09 * Math.min(ymax, 3), Math.min(ymax, 3)]);
          bot.path(RS.map((s, i) => [Math.log10(s), QS[i][1]]), { color: 'orange', width: 2 });
          bot.path(RS.map((s, i) => [Math.log10(s), QS[i][0]]), { color: 'accent', width: 2.6 });
          const [Lr, Ir] = quantities(E, x, c, r);
          bot.vline(Math.log10(r), { color: 'orange', dash: [3, 3], width: 1.1 });
          bot.dot(Math.log10(r), Lr, { color: 'accent', r: 5 });
          const L0 = QS[0][0], isLeb = L0 < 0.01;
          bot.corner(isLeb ? 'Lebesgue point: blue curve → 0' : 'not a Lebesgue point: blue curve stays ≈ ' + v.fmt(L0, 2), 'tr', { color: isLeb ? 'green' : 'red', weight: 600 });
          st = { x, c, r, Lr, Ir, L0, isLeb };
        });
        v.readout(() => `$x=${v.fix(st.x, 3)},\\ f(x)=${v.fix(st.c, 3)},\\ r=${v.fmt(st.r, 3)}$: $\\;\\frac{1}{2r}\\int_{B(x,r)}|f-f(x)|=${v.fix(st.Lr, 4)}$, $\\;\\Bigl|\\frac{1}{2r}\\int_{B(x,r)}f-f(x)\\Bigr|=${v.fix(st.Ir, 4)}$.`);
      },
    },
    // ------------------------------------------------------------------ 7.7
    {
      num: '7.7',
      kind: 'Theorem',
      name: 'Almost every point is a Lebesgue point',
      statement: String.raw`If $f\in L^1(\R^k)$, then almost every $x\in\R^k$ is a Lebesgue point of $f$.`,
      idea: String.raw`Put $T_rf(x)=\frac{1}{m(B_r)}\int_{B(x,r)}|f-f(x)|\,dm$ and $Tf=\limsup_{r\to0}T_rf$. Given $\eps>0$, choose $g\in C_c(\R^k)$ with $\|f-g\|_1<\eps$ (3.14) and let $h=f-g$. Continuity gives $Tg=0$, and $T_rh\le Mh+|h|$, so $Tf\le Mh+|h|$. Hence $\{Tf>2\lambda\}\subset\{Mh>\lambda\}\cup\{|h|>\lambda\}$, whose measure is at most $(3^k+1)\eps/\lambda$ by the maximal theorem 7.4 and Chebyshev (7.5). As $\eps$ is arbitrary, $m\{Tf>2\lambda\}=0$ for every $\lambda>0$, i.e. $Tf=0$ a.e.`,
      caption: String.raw`$f=\chi_E$ for a fat Cantor set $E\subset[0,1]$: $m(E)=\tfrac12$ but $E$ has no interior, so $f$ is discontinuous at *every* point of $E$. The middle panel plots $T_rf(x)$ across $[0,1]$ for the chosen $r$; red marks the set where $T_rf>\eta$. Shrink $r$: that set loses measure (right panel, both axes logarithmic), so almost every point — of $E$ and of its complement — is a Lebesgue point. Compare with a step function, whose bad set shrinks onto its finitely many jumps.`,
      deps: ['rca-7.4', 'rca-7.5', 'rca-7.6', 'rca-3.14'],
      tags: ['Lebesgue points', 'differentiation theorem'],
      viz(v) {
        const M = v.M;
        const FC = fatCantor(11);
        const JUMPS = [0, 0.12, 0.27, 0.33, 0.5, 0.61, 0.78, 0.9, 1], LEV = [0.3, 0.9, 0.5, 1, 0.2, 0.7, 0.4, 0.85];
        const step = (x) => { if (x < 0 || x >= 1) return 0; for (let i = 0; i < LEV.length; i++) if (x < JUMPS[i + 1]) return LEV[i]; return 0; };
        const PC = [[-Infinity, 0, 0], ...LEV.map((l, i) => [JUMPS[i], JUMPS[i + 1], l]), [1, Infinity, 0]];
        const stepT = (x, r) => {
          const c = step(x); let s = 0;
          for (const [p, q, l] of PC) { const lo = Math.max(x - r, p), hi = Math.min(x + r, q); if (hi > lo) s += (hi - lo) * Math.abs(l - c); }
          return s / (2 * r);
        };
        const fatT = (x, r) => { const mm = FC.measure(x - r, x + r); return FC.has(x) ? 1 - mm / (2 * r) : mm / (2 * r); };
        const which = v.select('$f$', [{ value: 'fat', label: '$\\chi_E$, $E$ a fat Cantor set' }, { value: 'step', label: 'a step function' }], 'fat');
        const rS = v.slider('radius $r$', 0.0003, 0.1, 0.004, { log: true, fmt: (x) => v.fmt(x, 2) });
        const eta = v.slider('threshold $\\eta$', 0.05, 0.6, 0.25, { step: 0.01 });
        const top = v.stage({ x: [-0.04, 1.04], y: [-0.2, 1.25], height: 130, full: true, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1], yticks: [], title: 'the function $f$' });
        const mid = v.stage({ x: [-0.04, 1.04], y: [-0.1, 1.06], height: 220, weight: 2.3, axes: 'box', xticks: [], yticks: [0.5, 1], title: '$T_rf(x)=\\frac{1}{2r}\\int_{x-r}^{x+r}|f-f(x)|\\,dm$' });
        const ins = v.stage({ x: [-3.6, -0.9], y: [-3.2, 0.1], height: 220, weight: 1, minWidth: 210, axes: 'box', xticks: logTicks(-3, -1), yticks: logTicks(-3, 0), title: '$m\\{T_rf>\\eta\\}$ against $r$' });
        const NX = 4001, XS = M.linspace(-0.04, 1.04, NX), DX = 1.08 / (NX - 1);
        const RS = logspace(-3.5, -1, 36);
        const cache = {};
        const badMeasure = (T, r, e) => { let s = 0; for (const x of XS) if (T(x, r) > e) s += DX; return s; };
        let st = {};
        v.legend([['accent', '$f$', { area: true }], ['accent', '$T_rf$'], ['red', '$\\{T_rf>\\eta\\}$', { area: true }]]);
        v.render(() => {
          const fat = which.value === 'fat', T = fat ? fatT : stepT, r = rS.value, e = eta.value;
          // top: f
          if (fat) { const px = 1.08 / top.width; for (const [a, b] of FC.I) top.rect(a, 0, Math.max(b, a + px * 0.7), 1, { fill: 'accent', fillAlpha: 0.55, stroke: false }); top.setTitle('$f=\\chi_E$: $m(E)=\\tfrac12$, yet $E$ contains no interval'); }
          else { top.setTitle('a step function with eight jumps'); pieces(top, step, -0.04, 1.04, JUMPS, { color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.2 }); }
          top.line(0.5 - r, 1.15, 0.5 + r, 1.15, { color: 'orange', width: 4, cap: 'butt' });
          top.text('scale: 2r', 0.5 + Math.max(r, 0.004), 1.15, { color: 'orange', size: 11, dx: 6 });
          // middle: T_r f across x
          const ts = XS.map((x) => T(x, r));
          let bad = 0, run = null; const runs = [];
          ts.forEach((t, i) => { const b = t > e; if (b) bad += DX; if (b && run === null) run = XS[i]; if (!b && run !== null) { runs.push([run, XS[i]]); run = null; } });
          if (run !== null) runs.push([run, XS[NX - 1]]);
          for (const [a, b] of runs) { mid.rect(a, -0.085, Math.max(b, a + 0.0008), -0.025, { fill: 'red', fillAlpha: 0.85, stroke: false }); }
          mid.path(XS.map((x, i) => [x, ts[i]]).concat([[1.04, 0], [-0.04, 0]]), { fill: 'accent', fillAlpha: 0.22, stroke: false, close: true });
          mid.path(XS.map((x, i) => [x, ts[i]]), { color: 'accent', width: 1.1 });
          mid.hline(e, { color: 'red', dash: [6, 4], width: 1.4 });
          mid.text('η', 1.035, e, { color: 'red', dy: -9, align: 'right', math: true });
          // inset: m{T_r f > η} against r (cached per (f, η))
          const key = which.value + ':' + e.toFixed(2);
          if (!cache[key]) cache[key] = RS.map((s) => badMeasure(T, s, e));
          const ys = cache[key];
          ins.path(RS.map((s, i) => [Math.log10(s), Math.log10(Math.max(ys[i], 1e-4))]), { color: 'red', width: 2.2 });
          ins.dot(Math.log10(r), Math.log10(Math.max(bad, 1e-4)), { color: 'red', r: 5 });
          st = { r, e, bad, fat };
        });
        v.readout(() => `$r=${v.fmt(st.r, 3)}$: $\\;m\\{x:T_rf(x)>\\eta\\}=${v.fix(st.bad, 4)}$ — it tends to $0$ as $r\\to0$` + (st.fat ? ', although $\\chi_E$ is discontinuous on the set $E$ of measure $\\tfrac12$.' : '; the non-Lebesgue points are the jumps.'));
      },
    },
  ],
};
