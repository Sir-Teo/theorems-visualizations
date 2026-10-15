// Rudin, Principles of Mathematical Analysis — Chapter 11 (part 2): measure spaces, measurable functions,
// simple functions (11.12–11.20).

/** Intervals of [x0,x1] on which f > a (sampled on N cells, endpoints refined by bisection where f is finite). */
function superlevel(f, a, x0, x1, N = 1600, strict = true) {
  const test = (x) => { const y = f(x); return strict ? y > a : y >= a; };
  const out = []; let start = null, prevX = x0, prevIn = test(x0);
  if (prevIn) start = x0;
  const refine = (lo, hi, inLo) => { for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (test(m) === inLo) lo = m; else hi = m; } return (lo + hi) / 2; };
  for (let i = 1; i <= N; i++) {
    const x = x0 + (x1 - x0) * i / N, inn = test(x);
    if (inn !== prevIn) { const e = refine(prevX, x, prevIn); if (inn) start = e; else { out.push([start, e]); start = null; } }
    prevX = x; prevIn = inn;
  }
  if (start != null) out.push([start, x1]);
  return out;
}
const total = (I) => I.reduce((s, [a, b]) => s + (b - a), 0);
/** Complement of a sorted list of intervals inside [x0,x1]. */
function complement(I, x0, x1) {
  const out = []; let x = x0;
  for (const [a, b] of I) { if (a > x) out.push([x, a]); x = Math.max(x, b); }
  if (x < x1) out.push([x, x1]);
  return out;
}
function intersect(I, J) {
  const out = []; let i = 0, j = 0;
  while (i < I.length && j < J.length) {
    const a = Math.max(I[i][0], J[j][0]), b = Math.min(I[i][1], J[j][1]);
    if (b > a) out.push([a, b]);
    if (I[i][1] < J[j][1]) i++; else j++;
  }
  return out;
}
function union(I, J) {
  const s = [...I, ...J].sort((p, q) => p[0] - q[0]); const out = [];
  for (const [a, b] of s) { if (out.length && a <= out[out.length - 1][1] + 1e-12) out[out.length - 1][1] = Math.max(out[out.length - 1][1], b); else out.push([a, b]); }
  return out;
}
/** Draw a set of intervals as a thick bar at height y, with an optional TeX label at the left. */
function row(S, I, y, color, label, opt = {}) {
  S.line(S.bounds.x[0], y, S.bounds.x[1], y, { color: 'grid', width: 1 });
  for (const [a, b] of I) S.line(a, y, b, y, { color, width: opt.width ?? 7, cap: 'butt', alpha: opt.alpha });
  if (label) S.tex(label, S.bounds.x[0], y, { color, align: 'left', baseline: 'bottom', dx: 4, dy: -5, size: 13 });
}
/** Plot a step function as horizontal pieces (no vertical connectors). */
function steps(S, s, a, b, st = {}, N = 1600) {
  const pts = []; let prev = s(a);
  for (let i = 0; i <= N; i++) {
    const x = a + (b - a) * i / N, y = s(x);
    if (Math.abs(y - prev) > 1e-12) { pts.push([x, prev], null); prev = y; }
    pts.push([x, y]);
  }
  S.path(pts, st);
}

export default {
  collection: 'pma',
  chapter: 11,
  items: [
    // ------------------------------------------------------------------ measure spaces
    {
      num: '11.12',
      kind: 'Definition',
      name: 'Measure space and measurable space',
      statement: String.raw`A **measure space** is a set $X$ together with a $\sigma$-ring $\mathfrak M$ of subsets of $X$ (the **measurable sets**) and a nonnegative countably additive set function $\mu$ on $\mathfrak M$ (the **measure**). If in addition $X\in\mathfrak M$, then $X$ is a **measurable space**.

Examples: $\R^p$ with the Lebesgue measurable sets and Lebesgue measure; the positive integers with all subsets and $\mu(E)=$ the number of elements of $E$ (counting measure); any probability space, where $\mu(X)=1$.`,
      idea: String.raw`Everything that follows — measurable functions, the integral, the convergence theorems — uses only the $\sigma$-ring and countable additivity, not the geometry of $\R^p$. So one theory covers lengths and volumes, sums over the integers (integrals against counting measure) and expectations in probability.`,
      caption: String.raw`Four measures drawn as distributions of mass along a line. Drag the endpoints of $E=[a,b]$: Lebesgue measure spreads mass uniformly, a density concentrates it smoothly, point masses $2^{-n}$ sit at the integers, and counting measure puts mass $1$ at each positive integer. In every case $\mu(E)$ is the total mass over $E$, added up countably (vertical scales differ between the four pictures).`,
      deps: ['pma-11.1', 'pma-11.2', 'pma-11.10'],
      see: ['rca-1.18', 'rca-1.3'],
      tags: ['measure', 'measure space'],
      viz(v) {
        const M = v.M;
        const kind = v.select('$\\mu=$', [
          { value: 'leb', label: 'Lebesgue $m$' },
          { value: 'den', label: 'density $w\\,dm$' },
          { value: 'atom', label: '$\\sum 2^{-n}\\delta_n$' },
          { value: 'cnt', label: 'counting on $\\N$' },
        ], 'den');
        const S = v.stage({ x: [-0.4, 10.4], y: [-0.38, 1.25], height: 320, axes: 'box', xticks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], yticks: [] });
        const ROWY = -0.2;
        const ha = S.handle(1.6, ROWY, { color: 'blue', label: 'a', labelPos: 'n', constrain: (x) => [M.clamp(x, -0.3, 10.3), ROWY] });
        const hb = S.handle(4.3, ROWY, { color: 'blue', label: 'b', labelPos: 'n', constrain: (x) => [M.clamp(x, -0.3, 10.3), ROWY] });
        const G = [[2.5, 0.8, 0.55], [6.5, 1.1, 0.45]];
        const w = (x) => G.reduce((s, [c, sg, p]) => s + p * M.gaussian(x, c, sg), 0);
        const W = (x) => G.reduce((s, [c, sg, p]) => s + p * 0.5 * (1 + erfA((x - c) / (sg * Math.SQRT2))), 0);
        function erfA(x) { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)); }
        let st = {};
        v.render(() => {
          const a = Math.min(ha.x, hb.x), b = Math.max(ha.x, hb.x), k = kind.value;
          S.vband(a, b, { color: 'blue', alpha: 0.08 });
          S.line(a, ROWY, b, ROWY, { color: 'blue', width: 4 });
          let muE = 0, muX = '', inside = [];
          if (k === 'leb') {
            S.rect(-0.4, 0, 10.4, 1, { fill: 'ink', fillAlpha: 0.08, stroke: false }); S.hline(1, { color: 'ink', width: 1.6 });
            S.rect(a, 0, b, 1, { fill: 'blue', fillAlpha: 0.35, stroke: false });
            muE = b - a; muX = '\\infty';
          } else if (k === 'den') {
            const wd = (x) => 3.2 * w(x); // drawn with a vertical scale factor
            S.fn(wd, { color: 'ink', width: 2, fill: 'ink', fillAlpha: 0.08 });
            S.fn(wd, { domain: [a, b], color: 'blue', width: 2.4, fill: 'blue', fillAlpha: 0.35 });
            muE = W(b) - W(a); muX = '1';
          } else {
            const atom = k === 'atom';
            for (let n = 1; n <= 10; n++) {
              const h = atom ? Math.pow(2, -n) * 2 : 1, inn = n >= a && n <= b;
              if (inn) { inside.push(n); muE += atom ? Math.pow(2, -n) : 1; }
              S.line(n, 0, n, h, { color: inn ? 'blue' : 'muted', width: 3 });
              S.dot(n, h, { color: inn ? 'blue' : 'muted', r: 4.5 });
            }
            if (atom) S.text('heights ∝ 2⁻ⁿ', 10.3, 1.15, { align: 'right', size: 11, color: 'muted' });
            else S.text('… mass 1 at every n ∈ ℕ', 10.3, 1.15, { align: 'right', size: 11, color: 'muted' });
            muX = atom ? '1' : '\\infty';
          }
          v.legend([['blue', '$E=[a,b]$ and the mass $\\mu$ puts on it', { area: true }], ['ink', 'distribution of $\\mu$ over $X$']]);
          st = { k, a, b, muE, muX, inside };
        });
        v.readout(() => {
          const s = st; if (s.k == null) return '';
          const E = `[${v.fix(s.a, 2)},\\,${v.fix(s.b, 2)}]`;
          if (s.k === 'leb') return `$m(E)=b-a=${v.fix(s.muE, 3)}$; $\\;m(\\R)=\\infty$, and $\\R\\in\\mathfrak M$: a measurable space with infinite measure.`;
          if (s.k === 'den') return `$\\mu(E)=\\int_E w\\,dm=${v.fix(s.muE, 4)}$; $\\;\\mu(\\R)=1$: a probability space.`;
          const list = s.inside.length ? `\\{${s.inside.join(',')}\\}` : '\\emptyset';
          if (s.k === 'atom') return `$E\\cap\\N=${list}$, $\\;\\mu(E)=\\sum_{n\\in E}2^{-n}=${v.fix(s.muE, 5)}$ by countable additivity; $\\;\\mu(\\N)=\\sum_{n\\ge1}2^{-n}=1$.`;
          return `$E\\cap\\N=${list}$, $\\;\\mu(E)=\\#(E\\cap\\N)=${s.muE}$; every subset of $\\N$ is measurable and $\\mu(\\N)=\\infty$.`;
        });
      },
    },
    {
      num: '11.13',
      kind: 'Definition',
      name: 'Measurable function',
      credit: 'Lebesgue, 1902',
      statement: String.raw`Let $f$ be a function on a measurable space $X$ with values in the extended real number system. $f$ is **measurable** if for every real $a$ the set
$$\{x\in X: f(x)>a\}$$
is measurable. For instance, if $X=\R^p$ and $\mathfrak M=\mathfrak M(\mu)$, every continuous $f$ is measurable, since then $\{f>a\}$ is open.`,
      idea: String.raw`Integration will slice the range of $f$ horizontally, so what must be measurable are the superlevel sets $\{f>a\}$ — the domain pieces where $f$ is high. Nothing about continuity is needed, and $f$ may take the values $\pm\infty$. Note that the definition involves only the $\sigma$-ring, not the measure.`,
      caption: String.raw`Drag the level $a$ (gold handle). The set $\{f>a\}$ is marked on the axis; the right panel plots its measure $\lambda(a)=m(\{f>a\})$ sideways, aligned with the levels. For continuous $f$ the set is open; with jumps it gains endpoints; for the function with $f(0.6)=+\infty$ the point $0.6$ lies in $\{f>a\}$ for every real $a$.`,
      deps: ['pma-11.12', 'pma-1.23', 'pma-4.8'],
      see: ['rca-1.3', 'rca-1.12'],
      tags: ['measurable functions'],
      viz(v) {
        const M = v.M;
        const F = {
          cont: { label: 'continuous', f: (x) => 0.5 + 0.28 * Math.sin(3 * Math.PI * x) + 0.14 * Math.sin(8.6 * Math.PI * x + 1), y: [-0.25, 1.1] },
          jump: { label: 'with jumps', f: (x) => 0.25 + 0.35 * x + (x >= 0.3 ? 0.35 : 0) - (x > 0.72 ? 0.42 : 0) + 0.06 * Math.sin(14 * x), y: [-0.25, 1.1] },
          inf: { label: '$f(0.6)=+\\infty$', f: (x) => (x === 0.6 ? Infinity : 0.1 / Math.sqrt(Math.abs(x - 0.6)) + 0.05), y: [-0.25, 1.6] },
        };
        const which = v.select('$f$', Object.entries(F).map(([value, o]) => ({ value, label: o.label })), 'cont');
        const S = v.stage({ x: [0, 1.05], y: [-0.25, 1.1], height: 320, axes: 'box', weight: 2.4, xticks: [0, 0.25, 0.5, 0.75, 1] });
        const R = v.stage({ x: [-0.05, 1.05], y: [-0.25, 1.1], height: 320, axes: 'box', weight: 1, minWidth: 150, xticks: [0.5, 1], yticks: [], title: '$\\lambda(a)=m(\\{f>a\\})$' });
        const ha = S.handle(1.025, 0.62, { color: 'gold', label: 'a', labelPos: 'n', constrain: (x, y) => [1.025, y] });
        let cacheK = null, sorted = [];
        let st = {};
        v.render(() => {
          const o = F[which.value], f = o.f;
          S.setView(null, o.y); R.setView(null, o.y);
          if (cacheK !== which.value) { cacheK = which.value; sorted = M.range(4000).map((i) => f((i + 0.5) / 4000)).sort((p, q) => p - q); ha.y = M.clamp(ha.y, 0, o.y[1] - 0.1); }
          const a = ha.y;
          const lam = (t) => { let lo = 0, hi = sorted.length; while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] > t) hi = m; else lo = m + 1; } return (sorted.length - lo) / sorted.length; };
          S.hline(a, { color: 'gold', width: 1.4, dash: [6, 4] });
          const I = superlevel(f, a, 0, 1, 2000);
          for (const [p, q] of I) { S.vband(p, q, { color: 'blue', alpha: 0.07 }); S.fn(f, { domain: [p, q], color: 'blue', width: 3.2, n: 600 }); }
          if (which.value === 'jump') { for (const [p, q] of [[0, 0.3], [0.3, 0.72], [0.72, 1]]) S.fn(f, { domain: [p, q - 1e-9], color: 'ink', width: 1.6 }); S.dot(0.3, f(0.3), { r: 3.5, color: 'ink' }); S.dot(0.3, f(0.3 - 1e-9), { r: 3.5, hollow: true, color: 'ink' }); S.dot(0.72, f(0.72), { r: 3.5, color: 'ink' }); S.dot(0.72, f(0.72 + 1e-9), { r: 3.5, hollow: true, color: 'ink' }); }
          else S.fn(f, { color: 'ink', width: 1.6, n: 1500 });
          if (which.value === 'inf') { S.arrow(0.6, o.y[1] - 0.25, 0.6, o.y[1] - 0.02, { color: 'ink', width: 1.5, head: 7 }); S.text('+∞', 0.6, o.y[1] - 0.06, { dx: 8, size: 12 }); S.dot(0.6, -0.12, { color: 'blue', r: 4 }); }
          for (const [p, q] of I) S.line(p, -0.12, q, -0.12, { color: 'blue', width: 7, cap: 'butt' });
          S.tex('\\{f>a\\}', 0.99, -0.12, { color: 'blue', align: 'right', baseline: 'top', dy: 6, size: 13 });
          // distribution function, sideways
          const ys = M.linspace(o.y[0], o.y[1], 300);
          R.path(ys.map((t) => [lam(t), t]), { color: 'purple', width: 2 });
          R.hline(a, { color: 'gold', width: 1.4, dash: [6, 4] });
          R.dot(lam(a), a, { color: 'gold', r: 5.5 });
          v.legend([['ink', '$y=f(x)$'], ['gold', 'level $a$', { dash: true }], ['blue', '$\\{x: f(x)>a\\}$', { area: true }], ['purple', '$\\lambda(a)$']]);
          st = { a, I, m: total(I), k: which.value };
        });
        v.readout(() => {
          const s = st; if (!s.I) return '';
          const show = s.I.slice(0, 4).map(([p, q]) => `(${v.fix(p, 3)},${v.fix(q, 3)})`).join('\\cup') + (s.I.length > 4 ? '\\cup\\cdots' : '');
          return `$a=${v.fix(s.a, 3)}$: $\\{f>a\\}=${s.I.length ? show : '\\emptyset'}$ (endpoints up to the conventions at jumps), of measure $${v.fix(s.m, 4)}$.` + (s.k === 'cont' ? ' A finite union of open intervals — open, hence measurable.' : s.k === 'inf' ? ' It always contains $0.6$, where $f=+\\infty$.' : '');
        });
      },
    },
    {
      num: '11.15',
      kind: 'Theorem',
      name: 'Four equivalent forms of measurability',
      statement: String.raw`For a function $f$ on a measurable space $X$ with values in the extended reals, each of the following conditions implies the other three:

(a) $\{x: f(x)>a\}$ is measurable for every real $a$;

(b) $\{x: f(x)\ge a\}$ is measurable for every real $a$;

(c) $\{x: f(x)<a\}$ is measurable for every real $a$;

(d) $\{x: f(x)\le a\}$ is measurable for every real $a$.`,
      idea: String.raw`Countable set operations convert one into the next: $\{f\ge a\}=\bigcap_n\{f>a-\tfrac1n\}$, $\{f<a\}=X-\{f\ge a\}$, $\{f\le a\}=\bigcap_n\{f<a+\tfrac1n\}$ and $\{f>a\}=X-\{f\le a\}$. A $\sigma$-ring is closed under countable intersections and under differences, and $X\in\mathfrak M$.`,
      caption: String.raw`The graph has a plateau at height $0.6$, so $\{f>a\}$ and $\{f\ge a\}$ differ by an interval when $a=0.6$. Increase $n$: the sets $\{f>a-\frac1n\}$ (orange) shrink down to $\{f\ge a\}$ (green), which is their intersection; complements give the other two sets. Drag the gold level off the plateau and the two sets differ by a null set only.`,
      deps: ['pma-11.13', 'pma-11.1'],
      see: ['rca-1.12'],
      tags: ['measurable functions', 'set algebra'],
      viz(v) {
        const M = v.M;
        const f = (x) => (x < 0.25 ? 0.2 + 0.4 * M.smoothstep(x / 0.25) : x < 0.5 ? 0.6 : x < 0.7 ? 0.6 + 0.28 * Math.sin(Math.PI * (x - 0.5) / 0.2) : 0.6 - 0.42 * M.smoothstep((x - 0.7) / 0.3));
        const nS = v.slider('$n$', 1, 40, 4, { int: true });
        const S = v.stage({ x: [0, 1.04], y: [-0.06, 1.0], height: 230, full: true, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1], yticks: [0.2, 0.4, 0.6, 0.8] });
        const Rw = v.stage({ x: [0, 1.04], y: [-0.6, 0.1], height: 230, full: true, axes: false });
        const ha = S.handle(1.02, 0.6, { color: 'gold', label: 'a', labelPos: 'n', constrain: (x, y) => [1.02, Math.abs(y - 0.6) < 0.02 ? 0.6 : M.clamp(y, 0.05, 0.95)] });
        let st = {};
        v.render(() => {
          const a = ha.y, n = nS.value, lo = a - 1 / n;
          S.hband(Math.max(lo, -1), a, { color: 'orange', alpha: 0.1 });
          S.hline(a, { color: 'gold', width: 1.4, dash: [6, 4] });
          if (lo > -0.06) S.hline(lo, { color: 'orange', width: 1.2, dash: [3, 3] });
          S.fn(f, { color: 'ink', width: 2.2, n: 1200 });
          if (lo > -0.06) S.tex('a-\\tfrac1n', 1.035, lo, { color: 'orange', align: 'right', baseline: 'top', dy: 3, size: 13 });
          const gt = superlevel(f, a, 0, 1, 2000, true), ge = superlevel(f, a, 0, 1, 2000, false), gn = superlevel(f, lo, 0, 1, 2000, true);
          const lt = complement(ge, 0, 1), le = complement(gt, 0, 1);
          row(Rw, gn, 0, 'orange', '\\{f>a-\\tfrac1n\\}');
          row(Rw, ge, -0.12, 'green', '\\{f\\ge a\\}=\\bigcap_n\\{f>a-\\tfrac1n\\}');
          row(Rw, gt, -0.24, 'blue', '\\{f>a\\}');
          row(Rw, lt, -0.36, 'purple', '\\{f<a\\}=X-\\{f\\ge a\\}');
          row(Rw, le, -0.48, 'teal', '\\{f\\le a\\}=X-\\{f>a\\}');
          st = { a, n, mn: total(gn), mge: total(ge), mgt: total(gt) };
        });
        v.readout(() => {
          const s = st; if (s.a == null) return '';
          return `$m(\\{f>a-\\tfrac1{${s.n}}\\})=${v.fix(s.mn, 4)}\\;\\downarrow\\; m(\\{f\\ge a\\})=${v.fix(s.mge, 4)}$, while $m(\\{f>a\\})=${v.fix(s.mgt, 4)}$` + (Math.abs(s.a - 0.6) < 1e-9 ? ' — on the plateau the two differ by its length $0.25$.' : '.');
        });
      },
    },
    {
      num: '11.16',
      kind: 'Theorem',
      name: 'The absolute value of a measurable function is measurable',
      statement: String.raw`If $f$ is measurable, then $|f|$ is measurable.`,
      idea: String.raw`For every real $a$, $\{|f|<a\}=\{f<a\}\cap\{f>-a\}$, an intersection of two measurable sets (11.15); so condition (c) of 11.15 holds for $|f|$. The converse fails: if $E$ is not measurable, $f=K_E-K_{X-E}$ is not measurable although $|f|\equiv1$ is.`,
      caption: String.raw`Drag the level $a$: the green band $-a<y<a$ contains the graph of $f$ exactly over the set $\{|f|<a\}$ (green row), which is the intersection of $\{f<a\}$ (orange) and $\{f>-a\}$ (purple). The blue curve is $|f|$.`,
      deps: ['pma-11.15'],
      tags: ['measurable functions'],
      viz(v) {
        const M = v.M;
        const f = (x) => 0.85 * Math.sin(2 * Math.PI * 1.3 * x + 0.4) + 0.28 * Math.sin(17 * x);
        const S = v.stage({ x: [0, 1.04], y: [-1.25, 1.25], height: 260, full: true, axes: true, xticks: [0.25, 0.5, 0.75, 1], yticks: [-1, -0.5, 0.5, 1] });
        const Rw = v.stage({ x: [0, 1.04], y: [-0.33, 0.1], height: 150, full: true, axes: false });
        const ha = S.handle(1.02, 0.5, { color: 'gold', label: 'a', labelPos: 'n', constrain: (x, y) => [1.02, M.clamp(y, 0.03, 1.2)] });
        let st = {};
        v.render(() => {
          const a = ha.y;
          S.hband(-a, a, { color: 'green', alpha: 0.12, edges: true });
          S.fn((x) => Math.abs(f(x)), { color: 'blue', width: 2, alpha: 0.85, domain: [0, 1] });
          S.fn(f, { color: 'ink', width: 2, domain: [0, 1] });
          S.tex('-a', 1.035, -a, { color: 'green', align: 'right', baseline: 'top', dy: 3, size: 13 });
          const A = superlevel((x) => -f(x), -a, 0, 1), B = superlevel(f, -a, 0, 1), C = intersect(A, B);
          row(Rw, A, 0, 'orange', '\\{f<a\\}');
          row(Rw, B, -0.11, 'purple', '\\{f>-a\\}');
          row(Rw, C, -0.22, 'green', '\\{|f|<a\\}=\\{f<a\\}\\cap\\{f>-a\\}');
          v.legend([['ink', '$f$'], ['blue', '$|f|$'], ['green', 'band $|y|<a$', { area: true }]]);
          st = { a, m: total(C) };
        });
        v.readout(() => `$a=${v.fix(st.a ?? 0, 3)}$: $\\;m(\\{|f|<a\\})=${v.fix(st.m ?? 0, 4)}$ — the intersection of two measurable sets.`);
      },
    },
    {
      num: '11.17',
      kind: 'Theorem',
      name: 'Suprema and upper limits of measurable functions',
      statement: String.raw`Let $\{f_n\}$ be a sequence of measurable functions and put
$$g(x)=\sup_n f_n(x),\qquad h(x)=\limsup_{n\to\infty}f_n(x).$$
Then $g$ and $h$ are measurable. The same holds for $\inf_n f_n$ and $\liminf_n f_n$.`,
      idea: String.raw`$g(x)>a$ exactly when some $f_n(x)>a$, so $\{g>a\}=\bigcup_n\{f_n>a\}$, a countable union of measurable sets. For the upper limit write $h=\inf_m g_m$ with $g_m=\sup_{n\ge m}f_n$; each $g_m$ is measurable, and $\inf_m g_m=-\sup_m(-g_m)$.`,
      caption: String.raw`Faint curves: $f_m,f_{m+1},\dots$, each a fixed profile ($f_n$ alternates between two) plus a bump of height $\sim1/n$ wandering around. Orange: $g_m=\sup_{n\ge m}f_n$ (computed over $n\le400$); green dashed: $h=\limsup f_n$. Raise $m$ and $g_m$ decreases to $h$. Drag the level $a$: the rows show $\{f_n>a\}$ for the first few $n\ge m$ and their union $\{g_m>a\}$.`,
      deps: ['pma-11.15', 'pma-3.16', 'pma-11.1'],
      see: ['rca-1.14'],
      tags: ['measurable functions', 'limits'],
      viz(v) {
        const M = v.M;
        const u = (x) => 0.45 + 0.22 * Math.sin(2 * Math.PI * x + 0.3), w = (x) => 0.42 + 0.2 * Math.cos(3 * Math.PI * x);
        const c = (n) => M.fract(n * 0.6180339887 + 0.13);
        const fn = (n) => (x) => (n % 2 ? u(x) : w(x)) + (0.9 / n) * Math.exp(-(((x - c(n)) / 0.05) ** 2));
        const NMAX = 400;
        const mS = v.slider('$m$', 1, 30, 1, { int: true });
        const S = v.stage({ x: [0, 1.04], y: [-0.02, 1.45], height: 270, full: true, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1], yticks: [0.5, 1] });
        const Rw = v.stage({ x: [0, 1.04], y: [-0.62, 0.1], height: 210, full: true, axes: false });
        const ha = S.handle(1.02, 0.62, { color: 'gold', label: 'a', labelPos: 'n', constrain: (x, y) => [1.02, M.clamp(y, 0.05, 1.4)] });
        const XS = M.linspace(0, 1, 700);
        const h = (x) => Math.max(u(x), w(x));
        let st = {};
        v.render(() => {
          const m = mS.value, a = ha.y;
          const g = XS.map((x) => { let s = -Infinity; for (let n = m; n <= NMAX; n++) s = Math.max(s, fn(n)(x)); return s; });
          for (let n = m; n < m + 12; n++) S.fn(fn(n), { color: n % 2 ? 'blue' : 'teal', width: 1, alpha: 0.4 * (1 - (n - m) / 13) + 0.1, domain: [0, 1] });
          S.path(XS.map((x, i) => [x, g[i]]), { color: 'orange', width: 3 });
          S.fn(h, { color: 'green', width: 2, dash: [6, 4], domain: [0, 1] });
          S.hline(a, { color: 'gold', width: 1.3, dash: [5, 4] });
          const gI = (() => { const out = []; let st0 = null; XS.forEach((x, i) => { const inn = g[i] > a; if (inn && st0 == null) st0 = x; if (!inn && st0 != null) { out.push([st0, x]); st0 = null; } }); if (st0 != null) out.push([st0, 1]); return out; })();
          for (let k = 0; k < 4; k++) row(Rw, superlevel(fn(m + k), a, 0, 1, 900), -0.11 * k, (m + k) % 2 ? 'blue' : 'teal', `\\{f_{${m + k}}>a\\}`, { width: 6 });
          Rw.text('⋮', 0.5, -0.43, { size: 14, color: 'muted', align: 'center' });
          row(Rw, gI, -0.53, 'orange', `\\{g_{${m}}>a\\}=\\bigcup_{n\\ge ${m}}\\{f_n>a\\}`);
          v.legend([['blue', '$f_n$ ($n$ odd / even in blue / teal)'], ['orange', `$g_m=\\sup_{n\\ge m}f_n$`], ['green', '$h=\\limsup f_n=\\max(u,w)$', { dash: true }]]);
          const gap = Math.max(...g.map((y, i) => y - h(XS[i])));
          st = { m, gap, mg: total(gI) };
        });
        v.readout(() => `$m=${st.m}$: $\\;\\sup_x\\,(g_m-h)=${v.fix(st.gap ?? 0, 4)}\\to0$ as $m\\to\\infty$, so $g_m\\downarrow h$; $\\;m(\\{g_m>a\\})=${v.fix(st.mg ?? 0, 4)}$.`);
      },
    },
    {
      num: '11.17a',
      kind: 'Corollary',
      name: 'max, min, f⁺ and f⁻ are measurable',
      statement: String.raw`If $f$ and $g$ are measurable, so are $\max(f,g)$ and $\min(f,g)$. In particular the positive and negative parts
$$f^+=\max(f,0),\qquad f^-=-\min(f,0)$$
are measurable; note $f=f^+-f^-$ and $|f|=f^++f^-$.`,
      idea: String.raw`Apply 11.17 to the sequence $f,g,g,g,\dots$: its supremum is $\max(f,g)$ and its infimum $\min(f,g)$. Concretely $\{\max(f,g)>a\}=\{f>a\}\cup\{g>a\}$ and $\{\min(f,g)>a\}=\{f>a\}\cap\{g>a\}$. Constant functions are measurable, which gives $f^\pm$.`,
      caption: String.raw`In the first mode drag the level $a$ and compare the rows: the superlevel set of $\max(f,g)$ is the union, that of $\min(f,g)$ the intersection. In the second mode $f$ is split into $f^+$ (blue) and $f^-$ (red, drawn upward); for $a\ge0$, $\{f^+>a\}=\{f>a\}$ and $\{f^->a\}=\{f<-a\}$.`,
      deps: ['pma-11.17'],
      see: ['rca-1.14a', 'rca-1.15'],
      tags: ['measurable functions'],
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'mm', label: '$\\max(f,g)$, $\\min(f,g)$' }, { value: 'pm', label: '$f^+$, $f^-$' }], 'mm');
        const f = (x) => 0.5 + 0.32 * Math.sin(2 * Math.PI * x + 0.2), g = (x) => 0.45 + 0.3 * Math.cos(3 * Math.PI * x + 0.5);
        const F = (x) => 0.75 * Math.sin(2 * Math.PI * 1.25 * x + 0.3) + 0.12;
        const S = v.stage({ x: [0, 1.04], y: [-0.05, 1], height: 250, full: true, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1] });
        const Rw = v.stage({ x: [0, 1.04], y: [-0.45, 0.1], height: 170, full: true, axes: false });
        const ha = S.handle(1.02, 0.55, { color: 'gold', label: 'a', labelPos: 'n', constrain: (x, y) => [1.02, M.clamp(y, 0.02, 0.98)] });
        let st = {};
        v.render(() => {
          const a = ha.y;
          S.hline(a, { color: 'gold', width: 1.3, dash: [5, 4] });
          if (mode.value === 'mm') {
            S.setView(null, [-0.05, 1]); S.setTicks(null, [0.25, 0.5, 0.75]);
            S.fn((x) => Math.max(f(x), g(x)), { color: 'green', width: 5, alpha: 0.35 });
            S.fn((x) => Math.min(f(x), g(x)), { color: 'purple', width: 5, alpha: 0.35 });
            S.fn(f, { color: 'blue', width: 2 }); S.fn(g, { color: 'red', width: 2 });
            const A = superlevel(f, a, 0, 1), B = superlevel(g, a, 0, 1);
            row(Rw, A, 0, 'blue', '\\{f>a\\}'); row(Rw, B, -0.1, 'red', '\\{g>a\\}');
            row(Rw, union(A, B), -0.22, 'green', '\\{\\max(f,g)>a\\}=\\{f>a\\}\\cup\\{g>a\\}');
            row(Rw, intersect(A, B), -0.34, 'purple', '\\{\\min(f,g)>a\\}=\\{f>a\\}\\cap\\{g>a\\}');
            v.legend([['blue', '$f$'], ['red', '$g$'], ['green', '$\\max(f,g)$'], ['purple', '$\\min(f,g)$']]);
            st = { mode: 'mm', a, mU: total(union(A, B)), mI: total(intersect(A, B)) };
          } else {
            S.setView(null, [-0.8, 1]); S.setTicks(null, [-0.5, 0.5]);
            S.fn((x) => Math.max(F(x), 0), { color: 'blue', width: 2.6, fill: 'blue', fillAlpha: 0.18 });
            S.fn((x) => Math.max(-F(x), 0), { color: 'red', width: 2.6, fill: 'red', fillAlpha: 0.18 });
            S.fn(F, { color: 'ink', width: 1.5, dash: [5, 4] });
            S.hline(0, { color: 'muted', width: 1 });
            const P = superlevel(F, a, 0, 1), N = superlevel((x) => -F(x), a, 0, 1);
            row(Rw, P, 0, 'blue', '\\{f^+>a\\}=\\{f>a\\}'); row(Rw, N, -0.12, 'red', '\\{f^->a\\}=\\{f<-a\\}');
            row(Rw, superlevel(F, 0, 0, 1), -0.26, 'muted', '\\{f>0\\}\\ (\\text{where }f=f^+)', { alpha: 0.6 });
            v.legend([['ink', '$f=f^+-f^-$', { dash: true }], ['blue', '$f^+$', { area: true }], ['red', '$f^-$', { area: true }]]);
            st = { mode: 'pm', a, mP: total(P), mN: total(N) };
          }
        });
        v.readout(() => {
          const s = st; if (!s.mode) return '';
          if (s.mode === 'mm') return `$a=${v.fix(s.a, 3)}$: $\\;m(\\{\\max(f,g)>a\\})=${v.fix(s.mU, 4)}$, $\\;m(\\{\\min(f,g)>a\\})=${v.fix(s.mI, 4)}$.`;
          return `$a=${v.fix(s.a, 3)}$: $\\;m(\\{f^+>a\\})=${v.fix(s.mP, 4)}$, $\\;m(\\{f^->a\\})=${v.fix(s.mN, 4)}$; at every $x$ one of $f^+(x)$, $f^-(x)$ is $0$, so $|f|=f^++f^-$.`;
        });
      },
    },
    {
      num: '11.17b',
      kind: 'Corollary',
      name: 'Pointwise limits of measurable functions are measurable',
      statement: String.raw`If $f_n\to f$ pointwise on $X$ and every $f_n$ is measurable, then $f$ is measurable.`,
      idea: String.raw`Where the limit exists it equals $\limsup f_n$, which is measurable by 11.17. Repeated limits stay measurable too, so the class is far larger than the continuous functions: the Dirichlet function $K_{\mathbb Q}$ is a double limit of continuous functions.`,
      caption: String.raw`$f_{m,n}(x)=\cos(m!\,\pi x)^{2n}$ is continuous. As $n\to\infty$ it tends to the indicator of $\{k/m!\}$ (spikes narrowing onto those points), and as $m\to\infty$ these indicators increase to $K_{\mathbb Q}$, which is discontinuous everywhere. Two applications of the corollary show that $K_{\mathbb Q}$ is measurable; the readout tracks the measure of $\{f_{m,n}>\tfrac12\}$, which tends to $0=m(\mathbb Q\cap[0,1])$.`,
      deps: ['pma-11.17'],
      see: ['rca-1.14a'],
      tags: ['measurable functions', 'limits'],
      viz(v) {
        const M = v.M;
        const mS = v.slider('$m$', 1, 5, 3, { int: true });
        const nS = v.slider('$n$', 1, 2000, 20, { log: true, int: true });
        const S = v.stage({ x: [-0.03, 1.03], y: [-0.18, 1.12], height: 320, full: true, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1], yticks: [0.5, 1] });
        let st = {};
        v.render(() => {
          const m = mS.value, n = nS.value, q = M.factorial(m);
          const f = (x) => Math.pow(Math.cos(q * Math.PI * x), 2 * n);
          S.hline(0.5, { color: 'gold', width: 1.2, dash: [5, 4] });
          S.fn(f, { color: 'blue', width: 1.6, n: 9000, fill: 'blue', fillAlpha: 0.15, domain: [0, 1] });
          // limit in n: indicator of {k/m!}
          const pts = M.range(q + 1).map((k) => [k / q, 1]);
          S.dots(pts, { r: 3.6, color: 'green' });
          // half-width of each spike where f > 1/2: cos^2n > 1/2 ⇔ |cos| > 2^{-1/(2n)}
          const hw = Math.acos(Math.pow(0.5, 1 / (2 * n))) / (q * Math.PI);
          const meas = Math.min(1, 2 * hw * q);
          for (let k = 0; k <= q; k++) S.line(Math.max(0, k / q - hw), -0.1, Math.min(1, k / q + hw), -0.1, { color: 'blue', width: 6, cap: 'butt' });
          S.tex('\\{f_{m,n}>\\tfrac12\\}', 1, -0.1, { color: 'blue', align: 'right', baseline: 'bottom', dy: -6, size: 13 });
          v.legend([['blue', '$f_{m,n}(x)=\\cos(m!\\,\\pi x)^{2n}$', { area: true }], ['green', '$\\lim_n f_{m,n}=K_{\\{k/m!\\}}$', { dot: true }], ['gold', 'level $\\tfrac12$', { dash: true }]]);
          st = { m, n, q, meas };
        });
        v.readout(() => `$m!=${st.q}$ spikes; $\\;m(\\{f_{m,n}>\\tfrac12\\})=${v.fix(st.meas, 5)}$. Letting $n\\to\\infty$ and then $m\\to\\infty$ yields $K_{\\mathbb Q}$: measurable, with $\\{K_{\\mathbb Q}>a\\}=\\mathbb Q\\cap[0,1]$ for $0\\le a<1$, a set of measure $0$.`);
      },
    },
    {
      num: '11.18',
      kind: 'Theorem',
      name: 'Continuous functions of measurable functions',
      statement: String.raw`Let $f$ and $g$ be measurable real-valued functions on $X$, let $F$ be real and continuous on $\R^2$, and put $h(x)=F(f(x),g(x))$. Then $h$ is measurable. In particular $f+g$ and $fg$ are measurable.`,
      idea: String.raw`The set $G_a=\{(u,v):F(u,v)>a\}$ is open, hence a countable union of open boxes $I_n=(a_n,b_n)\times(c_n,d_n)$. Then
$$\{h>a\}=\bigcup_n\{a_n<f<b_n\}\cap\{c_n<g<d_n\},$$
a countable union of intersections of measurable sets.`,
      caption: String.raw`Left: the $(u,v)$-plane, the open set $G_a=\{F>a\}$ (shaded) exhausted by dyadic boxes, and the curve $x\mapsto(f(x),g(x))$ for $x\in[0,1]$. Right: $h=F(f,g)$, the level $a$, and below it the parts of $[0,1]$ sent into each box, in that box's colour. Their union is $\{h>a\}$; the grey part is still uncovered at this box level and shrinks as the level rises.`,
      deps: ['pma-11.15', 'pma-4.8', 'pma-11.1'],
      see: ['rca-1.8', 'rca-1.9'],
      tags: ['measurable functions'],
      viz(v) {
        const M = v.M;
        const FS = {
          sum: { label: '$F=u+v$', F: (u, v2) => u + v2, minBox: (x0, y0) => x0 + y0, a: 0.3, range: [-2.4, 2.4] },
          prod: { label: '$F=uv$', F: (u, v2) => u * v2, minBox: (x0, y0, x1, y1) => Math.min(x0 * y0, x0 * y1, x1 * y0, x1 * y1), a: 0.12, range: [-1.5, 1.5] },
          rad: { label: '$F=u^2+v^2$', F: (u, v2) => u * u + v2 * v2, minBox: (x0, y0, x1, y1) => { const cx = M.clamp(0, x0, x1), cy = M.clamp(0, y0, y1); return cx * cx + cy * cy; }, a: 0.8, range: [0, 2.6] },
        };
        const which = v.select('', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'sum');
        const aS = v.slider('$a$', -1.5, 2.2, 0.3, { step: 0.01 });
        const lev = v.slider('box level', 1, 6, 4, { int: true });
        const f = (x) => 1.05 * Math.sin(2 * Math.PI * x + 0.3), g = (x) => 0.95 * Math.cos(2 * Math.PI * 1.5 * x - 0.2);
        const L = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, height: 330, axes: true, weight: 1, title: '$(u,v)$-plane' });
        const R = v.stage({ x: [0, 1], y: [-1.6, 2.4], height: 330, axes: 'box', weight: 1.2, xticks: [0, 0.25, 0.5, 0.75, 1], title: '$h(x)=F(f(x),g(x))$ on $[0,1]$' });
        const COLS = ['blue', 'teal', 'purple', 'pink', 'orange', 'green', 'gold'];
        let lastW = null, st = {};
        v.render(() => {
          const o = FS[which.value];
          if (lastW !== which.value) { lastW = which.value; aS.set(o.a); }
          const a = aS.value, Fh = (x) => o.F(f(x), g(x));
          // G_a shading
          const gc = v.rgb('green');
          L.raster((x, y) => (o.F(x, y) > a ? [gc[0], gc[1], gc[2], 46] : null), { key: `${which.value}|${a}|${v.color('green')}`, res: 2 });
          // maximal dyadic boxes inside G_a (exact containment test), levels 1..lev, on [-1.3,1.3]^2
          const boxes = []; const B0 = 2.6;
          const inside = (x0, y0, h) => o.minBox(x0, y0, x0 + h, y0 + h) > a;
          for (let j = 1; j <= lev.value; j++) {
            const N = 1 << j, h = B0 / N;
            for (let i = 0; i < N; i++) for (let k = 0; k < N; k++) {
              const x0 = -1.3 + i * h, y0 = -1.3 + k * h;
              if (!inside(x0, y0, h)) continue;
              if (j > 1 && inside(-1.3 + Math.floor(i / 2) * 2 * h, -1.3 + Math.floor(k / 2) * 2 * h, 2 * h)) continue;
              boxes.push([x0, y0, x0 + h, y0 + h]);
            }
          }
          boxes.forEach((b, i) => L.rect(b[0], b[1], b[2], b[3], { color: COLS[i % COLS.length], width: 1, fill: COLS[i % COLS.length], fillAlpha: 0.1 }));
          // curve, coloured by which box it is in
          const N = 1400, xs = M.linspace(0, 1, N + 1);
          const boxOf = xs.map((x) => { const u = f(x), w = g(x); return boxes.findIndex((b) => u > b[0] && u < b[2] && w > b[1] && w < b[3]); });
          L.curve((t) => [f(t), g(t)], 0, 1, { color: 'ink', width: 1.4, n: 600 });
          for (let i = 0; i < N; i++) if (boxOf[i] >= 0) L.line(f(xs[i]), g(xs[i]), f(xs[i + 1]), g(xs[i + 1]), { color: COLS[boxOf[i] % COLS.length], width: 3.6 });
          L.dot(f(0), g(0), { color: 'ink', r: 4, label: 'x=0', labelPos: 'e' });
          // right panel
          const span = o.range[1] - o.range[0];
          R.setView(null, [o.range[0] - 0.32 * span, o.range[1]]);
          R.setTicks(undefined, M.range(Math.floor(o.range[1]) - Math.ceil(o.range[0]) + 1, Math.ceil(o.range[0])));
          R.hline(a, { color: 'gold', width: 1.3, dash: [5, 4] });
          R.fn(Fh, { color: 'ink', width: 1.6 });
          const yb = o.range[0] - 0.12 * span; let cov = 0, unc = 0;
          for (let i = 0; i < N; i++) {
            const x = xs[i], x2 = xs[i + 1], k = boxOf[i], hi = Fh((x + x2) / 2) > a;
            if (k >= 0) { const c = COLS[k % COLS.length]; R.line(x, yb, x2, yb, { color: c, width: 9, cap: 'butt' }); R.line(x, Fh(x), x2, Fh(x2), { color: c, width: 3.6 }); cov += x2 - x; }
            else if (hi) { R.line(x, yb, x2, yb, { color: 'muted', width: 9, cap: 'butt', alpha: 0.5 }); unc += x2 - x; }
          }
          R.tex('\\{h>a\\}', 1, yb, { color: 'ink', align: 'right', baseline: 'bottom', dy: -7, size: 13 });
          v.legend([['green', '$G_a=\\{F>a\\}$, open', { area: true }], ['blue', 'boxes $I_n\\subset G_a$ and the $x$ with $(f(x),g(x))\\in I_n$', { area: true }], ['ink', 'curve $(f(x),g(x))$ and $h$']]);
          st = { a, nb: boxes.length, cov, unc };
        });
        v.readout(() => `$${st.nb}$ boxes; the $x$ sent into them have total length $${v.fix(st.cov ?? 0, 4)}$, and $m(\\{h>a\\})-${v.fix(st.cov ?? 0, 4)}=${v.fix(st.unc ?? 0, 4)}$ is still uncovered (grey). Each piece is $\\{a_n<f<b_n\\}\\cap\\{c_n<g<d_n\\}$, so $\\{h>a\\}$ is a countable union of measurable sets.`);
      },
    },
    // ------------------------------------------------------------------ simple functions
    {
      num: '11.19',
      kind: 'Definition',
      name: 'Simple functions and characteristic functions',
      statement: String.raw`A real function $s$ on $X$ is **simple** if its range is finite. For $E\subset X$ the **characteristic function** $K_E$ is $1$ on $E$ and $0$ off $E$. If the distinct values of $s$ are $c_1,\dots,c_n$ and $E_i=\{x:s(x)=c_i\}$, then
$$s=\sum_{i=1}^n c_iK_{E_i},$$
and $s$ is measurable if and only if every $E_i$ is measurable.`,
      idea: String.raw`Simple functions are the "step functions" of measure theory, except that their level sets $E_i$ may be any measurable sets, not intervals. Every simple function is a finite combination of characteristic functions, and a combination of overlapping characteristic functions can always be rewritten with disjoint sets — the canonical form $E_i=\{s=c_i\}$.`,
      caption: String.raw`Here $s=1\cdot K_A+2\cdot K_B$ with $A$ a union of two intervals and $B$ an interval (drag the endpoints on their rows). The graph takes the values $0,1,2,3$; the lower rows show the canonical sets $E_i=\{s=c_i\}$, which are disjoint and give the same $s$.`,
      deps: ['pma-11.13'],
      see: ['rca-1.16'],
      tags: ['simple functions'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [0, 1], y: [-0.3, 3.4], height: 250, full: true, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1], yticks: [1, 2, 3] });
        const Rw = v.stage({ x: [0, 1], y: [-0.84, 0.36], height: 230, full: true, axes: false });
        const rA = 0.24, rB = 0.12;
        const mk = (x, y, c) => Rw.handle(x, y, { color: c, r: 6, constrain: (xx) => [M.clamp(xx, 0.01, 0.99), y] });
        const A = [mk(0.08, rA, 'blue'), mk(0.38, rA, 'blue'), mk(0.62, rA, 'blue'), mk(0.82, rA, 'blue')];
        const B = [mk(0.25, rB, 'red'), mk(0.7, rB, 'red')];
        let st = {};
        v.render(() => {
          const ax = A.map((h) => h.x).sort((p, q) => p - q), bx = B.map((h) => h.x).sort((p, q) => p - q);
          const IA = union([[ax[0], ax[1]]], [[ax[2], ax[3]]]), IB = [[bx[0], bx[1]]];
          const inI = (I, x) => I.some(([p, q]) => x >= p && x <= q);
          const s = (x) => (inI(IA, x) ? 1 : 0) + (inI(IB, x) ? 2 : 0);
          const COL = ['muted', 'blue', 'red', 'purple'];
          for (let c = 1; c <= 3; c++) S.hline(c, { color: 'grid', width: 1 });
          steps(S, s, 0, 1, { color: 'ink', width: 3 });
          // rows: representation and canonical sets
          row(Rw, IA, rA, 'blue', '1\\cdot K_A'); row(Rw, IB, rB, 'red', '2\\cdot K_B');
          Rw.line(0, 0.02, 1, 0.02, { color: 'faint', width: 1, dash: [3, 3] });
          const level = (c) => { const out = []; let st0 = null; const N = 2000; for (let i = 0; i <= N; i++) { const x = i / N, on = s(x) === c; if (on && st0 == null) st0 = x; if ((!on || i === N) && st0 != null) { out.push([st0, x]); st0 = null; } } return out; };
          const E = [0, 1, 2, 3].map(level);
          [3, 2, 1, 0].forEach((c, k) => row(Rw, E[c], -0.12 - 0.17 * k, COL[c], `E_{${c}}=\\{s=${c}\\}`));
          v.legend([['ink', '$s=K_A+2K_B$'], ['blue', '$A$', { area: true }], ['red', '$B$', { area: true }], ['purple', '$E_3=A\\cap B$', { area: true }]]);
          st = { m: E.map(total) };
        });
        v.readout(() => {
          const m = st.m; if (!m) return '';
          return `Canonical form $s=1\\cdot K_{E_1}+2\\cdot K_{E_2}+3\\cdot K_{E_3}$ with $m(E_1)=${v.fix(m[1], 3)}$, $m(E_2)=${v.fix(m[2], 3)}$, $m(E_3)=${v.fix(m[3], 3)}$ (and $E_0$ of measure $${v.fix(m[0], 3)}$): disjoint level sets, the same function.`;
        });
      },
    },
    {
      num: '11.20',
      kind: 'Theorem',
      name: 'Every function is a pointwise limit of simple functions',
      statement: String.raw`Let $f$ be a real function on $X$. There is a sequence $\{s_n\}$ of simple functions with $s_n(x)\to f(x)$ for every $x\in X$. If $f$ is measurable, the $s_n$ can be taken measurable; if $f\ge0$, they can be taken monotonically increasing.`,
      idea: String.raw`For $f\ge0$ slice the range, not the domain: with $E_{n,i}=\{\frac{i-1}{2^n}\le f<\frac i{2^n}\}$ ($1\le i\le n2^n$) and $F_n=\{f\ge n\}$, put
$$s_n=\sum_{i=1}^{n2^n}\frac{i-1}{2^n}K_{E_{n,i}}+nK_{F_n}.$$
Then $0\le f-s_n<2^{-n}$ wherever $f<n$, the sequence increases, and the sets are measurable when $f$ is. For general $f$ apply this to $f^+$ and $f^-$. If $f$ is bounded the convergence is uniform.`,
      caption: String.raw`Raise $n$. Top: $f$ and the simple function $s_n$ (blue), with the dyadic levels $i/2^n$ below the cap $n$ (red). Bottom: the error $f-s_n$; it lies in the band $[0,2^{-n})$ wherever $f<n$, and where $f\ge n$ (red) it is $f-n$, which disappears as $n$ grows. For bounded $f$ the convergence is uniform; for $1/\sqrt x$ it is not; signed $f$ uses $s_n(f^+)-s_n(f^-)$.`,
      deps: ['pma-11.19', 'pma-11.17a', 'pma-11.15'],
      see: ['rca-1.17'],
      tags: ['simple functions', 'approximation'],
      viz(v) {
        const M = v.M;
        const FS = {
          bdd: { label: 'bounded $f\\ge0$', f: (x) => 1.1 + 0.6 * Math.sin(2 * Math.PI * x) + 0.35 * Math.sin(7 * x), y: [-0.15, 2.3] },
          unb: { label: '$f=1/\\sqrt x$', f: (x) => 1 / Math.sqrt(Math.max(x, 1e-9)), y: [-0.15, 5.4] },
          sgn: { label: 'signed $f$', f: (x) => 1.3 * Math.sin(2 * Math.PI * 1.2 * x + 0.4) + 0.3 * Math.sin(9 * x), y: [-1.75, 1.75] },
        };
        const which = v.select('', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'bdd');
        const nS = v.slider('$n$', 1, 7, 3, { int: true });
        const T = v.stage({ x: [0, 1], y: [-0.15, 2.3], height: 280, full: true, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1] });
        const Bt = v.stage({ x: [0, 1], y: [-0.12, 0.6], height: 160, full: true, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1], title: 'error $f-s_n$' });
        const sPos = (y, n) => (y >= n ? n : Math.floor(y * (1 << n)) / (1 << n));
        let st = {};
        v.render(() => {
          const o = FS[which.value], f = o.f, n = nS.value;
          const s = (x) => { const y = f(x); return y >= 0 ? sPos(y, n) : -sPos(-y, n); };
          T.setView(null, o.y);
          const top = Math.min(o.y[1], n);
          for (let i = 1; i < (1 << n) * Math.min(n, o.y[1] + 1) && i / (1 << n) < o.y[1]; i++) { const y = i / (1 << n); if (y < n) { T.hline(y, { color: 'orange', width: 0.6, alpha: 0.45 }); if (o.y[0] < 0) T.hline(-y, { color: 'orange', width: 0.6, alpha: 0.45 }); } }
          if (n < o.y[1]) T.hline(n, { color: 'red', width: 1.6, dash: [6, 4] });
          if (o.y[0] < -n) T.hline(-n, { color: 'red', width: 1.6, dash: [6, 4] });
          T.fn(f, { color: 'ink', width: 2, n: 1500 });
          steps(T, s, 0.0005, 1, { color: 'blue', width: 2.6 }, 2000);
          if (n < o.y[1]) T.tex('\\text{cap } n', 0.99, n, { color: 'red', align: 'right', baseline: 'bottom', dy: -3, size: 13 });
          // error panel
          const xs = M.linspace(0.0005, 1, 1500);
          const err = xs.map((x) => f(x) - s(x));
          const big = xs.map((x) => Math.abs(f(x)) >= n);
          const e = Math.pow(2, -n);
          const emax = Math.max(...err.map(Math.abs));
          const sg = which.value === 'sgn', top2 = Math.max(0.6, Math.min(emax, 3) * 1.1);
          Bt.setView(null, sg ? [-top2, top2] : [-0.15 * top2, top2]);
          Bt.hband(0, e, { color: 'green', alpha: 0.18, edges: true });
          if (which.value === 'sgn') Bt.hband(-e, 0, { color: 'green', alpha: 0.18, edges: true });
          const pts = xs.map((x, i) => (big[i] ? null : [x, err[i]])), ptsB = xs.map((x, i) => (big[i] ? [x, err[i]] : null));
          Bt.path(pts, { color: 'blue', width: 1.4 }); Bt.path(ptsB, { color: 'red', width: 2 });
          let supSmall = 0, mBig = 0;
          xs.forEach((x, i) => { if (big[i]) mBig += 1 / xs.length; else supSmall = Math.max(supSmall, Math.abs(err[i])); });
          v.legend([['ink', '$f$'], ['blue', '$s_n$ and the error where $|f|<n$'], ['orange', 'levels $i/2^n$'], ['red', 'cap $n$, and the error on $F_n=\\{|f|\\ge n\\}$', { dash: true }], ['green', 'band of width $2^{-n}$', { area: true }]]);
          st = { n, supSmall, mBig, e, emax, unb: which.value === 'unb' };
        });
        v.readout(() => {
          const s = st; if (s.n == null) return '';
          return `$\\sup_{|f|<n}|f-s_n|=${v.fix(s.supSmall, 4)}<2^{-${s.n}}=${v.fix(s.e, 4)}$; $\\;m(\\{|f|\\ge n\\})\\approx${v.fix(s.mBig, 4)}$` + (s.mBig > 0 ? (s.unb ? ', where the error $f-n$ is unbounded: the convergence is pointwise, not uniform.' : `, where the error is $f-n\\le${v.fmt(s.emax, 3)}$; it disappears once $n>\\sup|f|$.`) : ', so here $\\sup|f-s_n|<2^{-n}$: uniform convergence.');
        });
      },
    },
  ],
};
