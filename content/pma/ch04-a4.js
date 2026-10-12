// Rudin, Principles of Mathematical Analysis — Chapter 4 (part 4): monotonic functions,
// infinite limits and limits at infinity.

// ---------- shared helpers ----------
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
/** The fraction p/q with the smallest denominator strictly inside (lo, hi), 0 ≤ lo < hi (Stern–Brocot descent). */
function simplest(lo, hi) {
  let a = 0, b = 1, c = 1, d = 0;
  for (let k = 0; k < 200000; k++) {
    const p = a + c, q = b + d;
    if (p <= lo * q) { a = p; b = q; } else if (p >= hi * q) { c = p; d = q; } else return [p, q];
  }
  return null;
}
/** Squash the extended line onto [−1, 1]: s(u) = u/(1+|u|), s(±∞) = ±1. */
const sq = (u) => (u === Infinity ? 1 : u === -Infinity ? -1 : u / (1 + Math.abs(u)));
const unsq = (s) => (s >= 1 ? Infinity : s <= -1 ? -Infinity : s / (1 - Math.abs(s)));
const TICKS = [-10, -3, -1, 0, 1, 3, 10];
/** Grid for squashed coordinates: ticks at a few real values and the two points ±∞. */
function squashedFrame(S, { xs = TICKS, ys = TICKS, xInf = [-1, 1] } = {}) {
  for (const u of ys) { S.hline(sq(u), { color: 'grid', width: 1 }); S.text(String(u).replace('-', '−'), S.bounds.x[0], sq(u), { dx: 6, color: 'muted', size: 10.5, align: 'left', dy: -7 }); }
  for (const u of xs) { S.vline(sq(u), { color: 'grid', width: 1 }); S.text(String(u).replace('-', '−'), sq(u), S.bounds.y[0], { dy: -8, color: 'muted', size: 10.5, align: 'center' }); }
  S.hline(0, { color: 'faint', width: 1 }); if (xs.includes(0)) S.vline(0, { color: 'faint', width: 1 });
  for (const s of [-1, 1]) S.hline(s, { color: 'muted', width: 1, dash: [5, 4] });
  for (const s of xInf) S.vline(s, { color: 'muted', width: 1, dash: [5, 4] });
  S.text('+∞', S.bounds.x[0], 1, { dx: 6, dy: -9, color: 'muted', size: 11, weight: 600 });
  S.text('−∞', S.bounds.x[0], -1, { dx: 6, dy: 9, color: 'muted', size: 11, weight: 600 });
  for (const s of xInf) S.text(s > 0 ? '+∞' : s < 0 ? '−∞' : '0', s, S.bounds.y[0], { dy: -8, color: 'muted', size: 11, weight: 600, align: 'center' });
}
const fmtX = (v, x) => (x === Infinity ? '+\\infty' : x === -Infinity ? '-\\infty' : v.fmt(x, 3));

export default {
  book: 'pma',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ monotonic functions
    {
      num: '4.28',
      kind: 'Definition',
      name: 'Monotonic functions',
      statement: String.raw`A real function $f$ on $(a,b)$ is *monotonically increasing* if $a<x<y<b$ implies $f(x)\le f(y)$, and *monotonically decreasing* if it implies $f(x)\ge f(y)$. A function that is one or the other is *monotonic*.`,
      idea: String.raw`The inequalities are not strict, so constant stretches are allowed. Order is all that is assumed — no continuity — yet it is enough to control every discontinuity (4.29, 4.30).`,
      deps: [],
      tags: ['monotonic functions'],
    },
    {
      num: '4.29',
      kind: 'Theorem',
      name: 'One-sided limits of monotonic functions',
      statement: String.raw`Let $f$ be monotonically increasing on $(a,b)$. Then $f(x+)$ and $f(x-)$ exist at every $x\in(a,b)$; more precisely
$$\sup_{a<t<x}f(t)=f(x-)\le f(x)\le f(x+)=\inf_{x<t<b}f(t).$$
Moreover, if $a<x<y<b$, then $f(x+)\le f(y-)$. Analogous statements hold for decreasing functions.`,
      idea: String.raw`The set $\{f(t):a<t<x\}$ is bounded above by $f(x)$, so it has a least upper bound $A\le f(x)$ (1.19). Given $\eps>0$ some $f(x-\delta)>A-\eps$, and monotonicity traps $f(t)$ in $(A-\eps,A]$ for all $t\in(x-\delta,x)$; hence $f(x-)=A$. The right-hand limit is the infimum in the same way, and for $x<y$ one has $f(x+)=\inf_{x<t<b}f(t)\le\inf_{x<t<y}f(t)\le\sup_{x<t<y}f(t)=f(y-)$.`,
      caption: String.raw`Drag $x$ and $y$ along the axis (they snap to the jumps). The columns on the left show the value sets $\{f(t):t<p\}$ (blue) and $\{f(t):t>p\}$ (purple) for $p=x$ and $p=y$: their sup and inf are $f(p-)$ and $f(p+)$, and the gap between them contains $f(p)$ (gold). Between $x$ and $y$ the graph is squeezed between $f(x+)$ and $f(y-)$ (green band).`,
      deps: ['pma-4.28', 'pma-4.25', 'pma-1.19'],
      tags: ['monotonic functions', 'limits'],
      viz(v) {
        const JUMPS = [[1.0, 0.5], [2.3, 0.35], [3.1, 0.6]];
        const base = (t) => 0.35 * t + 0.15 * Math.sin(1.5 * t);
        const val = v.select('value at a jump', [{ value: 0, label: 'left limit' }, { value: 0.5, label: 'in between' }, { value: 1, label: 'right limit' }], 0.5);
        const fm = (t) => base(t) + JUMPS.reduce((s, [p, c]) => s + (t > p ? c : 0), 0); // f(t−)
        const fp = (t) => base(t) + JUMPS.reduce((s, [p, c]) => s + (t >= p ? c : 0), 0); // f(t+)
        const f = (t) => { const j = JUMPS.find(([p]) => Math.abs(t - p) < 1e-12); return j ? fm(t) + val.value * j[1] : fm(t); };
        const A = 0, B = 4;
        const S = v.stage({ x: [-0.95, 4.12], y: [-0.38, 3.05], height: 370, axes: false });
        const snap = (x) => { x = v.M.clamp(x, 0.02, 3.98); for (const [p] of JUMPS) if (Math.abs(x - p) < 0.08) return p; return x; };
        const X = S.handle(1.0, 0, { color: 'accent', label: 'x', constrain: (x) => [snap(x), 0] });
        const Y = S.handle(3.1, 0, { color: 'teal', label: 'y', constrain: (x) => [snap(x), 0] });
        // value set {f(t) : lo < t < hi} as segments and isolated jump values
        function valueSet(lo, hi) {
          const cuts = [lo, ...JUMPS.map(([p]) => p).filter((p) => p > lo && p < hi), hi];
          const segs = [], pts = [];
          for (let i = 0; i + 1 < cuts.length; i++) segs.push([fp(cuts[i]), fm(cuts[i + 1])]);
          for (let i = 1; i + 1 < cuts.length; i++) pts.push(f(cuts[i]));
          return { segs, pts };
        }
        const column = (xc, set, col) => { for (const [l, u] of set.segs) S.line(xc, l, xc, u, { color: col, width: 6, cap: 'butt', alpha: 0.75 }); for (const y of set.pts) S.dot(xc, y, { r: 3, color: col }); };
        let state = null;
        v.legend([['blue', '$\\{f(t): t<p\\}$, top $=f(p-)$'], ['purple', '$\\{f(t): t>p\\}$, bottom $=f(p+)$'], ['gold', '$f(p)$', { dot: true }], ['green', 'between $f(x+)$ and $f(y-)$', { area: true }]]);
        v.render(() => {
          let x = X.x, y = Y.x;
          if (x > y) [x, y] = [y, x];
          // axis
          S.line(A, 0, B, 0, { color: 'muted', width: 1.2 });
          S.dot(A, 0, { r: 3.5, color: 'muted', hollow: true }); S.dot(B, 0, { r: 3.5, color: 'muted', hollow: true });
          S.text('a', A, 0, { dy: 16, math: true, color: 'muted', align: 'center' }); S.text('b', B, 0, { dy: 16, math: true, color: 'muted', align: 'center' });
          // squeeze band between x and y
          const lo = fp(x), hi = fm(y);
          if (y > x) S.rect(x, lo, y, hi, { fill: 'green', fillAlpha: 0.12, stroke: false });
          S.line(x, lo, y, lo, { color: 'purple', width: 1.2, dash: [4, 3] }); S.line(x, hi, y, hi, { color: 'blue', width: 1.2, dash: [4, 3] });
          // graph
          const brk = JUMPS.map(([p]) => p);
          const cuts = [A, ...brk, B];
          for (let i = 0; i + 1 < cuts.length; i++) {
            const off = JUMPS.slice(0, i).reduce((s, [, c]) => s + c, 0);
            S.fn((t) => base(t) + off, { domain: [cuts[i] + 1e-9, cuts[i + 1] - 1e-9], color: 'ink', width: 2.3 });
          }
          for (const [p] of JUMPS) { S.dot(p, fm(p), { r: 4, color: 'ink', hollow: true }); S.dot(p, fp(p), { r: 4, color: 'ink', hollow: true }); S.dot(p, f(p), { r: 4, color: 'ink' }); S.line(p, 0, p, fm(p), { color: 'faint', width: 1, dash: [2, 3] }); }
          // columns for x and y
          for (const [p, xc, lab] of [[x, -0.62, 'x'], [y, -0.3, 'y']]) {
            column(xc - 0.05, valueSet(A, p), 'blue');
            column(xc + 0.05, valueSet(p, B), 'purple');
            S.dot(xc, f(p), { r: 5, color: 'gold' });
            S.line(xc, f(p), p, f(p), { color: 'gold', width: 1, dash: [2, 3], alpha: 0.8 });
            S.text(lab, xc, -0.2, { math: true, color: lab === 'x' ? 'accent' : 'teal', align: 'center', size: 16 });
          }
          S.dot(x, f(x), { r: 5, color: 'gold' }); S.dot(y, f(y), { r: 5, color: 'gold' });
          state = { x, y };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          const { x, y } = s, F = (z) => v.fix(z, 3);
          return `$f(x-) = \\sup_{t<x} f(t) = ${F(fm(x))} \\le f(x) = ${F(f(x))} \\le f(x+) = \\inf_{t>x} f(t) = ${F(fp(x))}$; and for $x<y$: $f(x+) = ${F(fp(x))} \\le f(y-) = ${F(fm(y))}$.`;
        });
      },
    },
    {
      num: '4.29a',
      kind: 'Corollary',
      name: 'Monotonic functions have only simple discontinuities',
      statement: String.raw`A monotonic function on $(a,b)$ has no discontinuities of the second kind.`,
      idea: String.raw`By 4.29 both one-sided limits $f(x-)$ and $f(x+)$ exist at every point, which is exactly what a simple discontinuity (4.26) requires. Concretely, the oscillation of an increasing $f$ on $(x,x+h)$ equals $f((x+h)-)-f(x+)$, which tends to $0$ — however many jumps pile up near $x$.`,
      caption: String.raw`Both functions have infinitely many jumps accumulating at $0$. Shrink $h$: for the increasing staircase the purple box over $(0,h)$ collapses — its jumps $c_n$ are the tail of a convergent series — so $f(0+)$ exists and the discontinuity at $0$ is simple. The alternating staircase keeps a box of height $0.55$: no $g(0+)$, a discontinuity of the second kind, and indeed $g$ is not monotonic (red pair).`,
      deps: ['pma-4.29', 'pma-4.26'],
      tags: ['monotonic functions', 'discontinuities'],
      viz(v) {
        const R = 0.6;
        // on (1/(n+1), 1/n]: mono = 0.45 + 0.55 R^(n-1), alt alternates between 1 and 0.45
        const nOf = (x) => Math.floor(1 / x + 1e-12);
        const EX = {
          mono: { label: 'increasing staircase', f: (x) => (x <= 0 ? 0.3 * x : 0.45 + 0.55 * R ** (nOf(x) - 1)), lim: 0.45 },
          alt: { label: 'alternating staircase', f: (x) => (x <= 0 ? 0.3 * x : nOf(x) % 2 ? 1 : 0.45), lim: null },
        };
        const which = v.select('', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'mono');
        const hS = v.slider('$h$', 0.004, 1, 0.3, { log: true, fmt: (x) => v.fmt(x, 3) });
        const S = v.stage({ x: [-0.28, 1.05], y: [-0.2, 1.2], height: 340, xlabel: 'x' });
        let state = null;
        v.legend([['ink', 'the staircase'], ['purple', 'box over $(0,h)$: $\\inf$ to $\\sup$', { area: true }], ['red', 'a pair violating monotonicity', { dot: true }]]);
        v.render(() => {
          const E = EX[which.value], h = hS.value;
          // box over (0,h)
          let lo = Infinity, hi = -Infinity;
          const nMin = nOf(h);
          for (let n = nMin + 1; n < nMin + 400; n++) { const y = E.f(1 / (n + 0.5)); if (y < lo) lo = y; if (y > hi) hi = y; }
          hi = Math.max(hi, E.f(h));
          if (E.lim != null) lo = E.lim; // the infimum is the (unattained) limit
          S.rect(0, lo, h, hi, { fill: 'purple', fillAlpha: 0.15, color: 'purple', width: 1.4 });
          // staircase
          S.fn((x) => 0.3 * x, { domain: [-0.28, 0], color: 'ink', width: 2.2 });
          for (let n = 1; n < 400; n++) {
            const l = 1 / (n + 1), r = 1 / n, y = E.f(r);
            if ((r - l) * S.scale < 0.4) { S.line(0, E.lim ?? 0.45, l, E.lim ?? 0.45, { color: 'ink', width: 2.2 }); if (E.lim == null) S.rect(0, 0.45, l, 1, { fill: 'ink', fillAlpha: 0.5, stroke: false }); break; }
            S.line(l, y, r, y, { color: 'ink', width: 2.2 });
            if (n < 25) { S.dot(r, y, { r: 2.6, color: 'ink' }); S.dot(l, y, { r: 2.6, color: 'ink', hollow: true, width: 1.2 }); }
          }
          S.dot(0, 0, { r: 4, color: 'ink' });
          if (E.lim != null) { S.dot(0, E.lim, { r: 5, color: 'green', hollow: true, width: 2.2, label: 'f(0+)', labelPos: 'nw' }); }
          else {
            const p = 0.3, q = 0.4; // 1/4 < p ≤ 1/3 (n = 3, value 1) and 1/3 < q ≤ 1/2 (n = 2, value 0.45)
            S.dot(p, E.f(p), { r: 5, color: 'red' }); S.dot(q, E.f(q), { r: 5, color: 'red' });
            S.arrow(p, E.f(p), q, E.f(q), { color: 'red', width: 1.6, head: 8 });
            S.text('s < t but g(s) > g(t)', 0.42, 0.75, { color: 'red', size: 11.5, weight: 600 });
          }
          S.corner(E.lim != null ? 'monotone ⇒ f(0+) exists: a simple discontinuity' : 'not monotone: no g(0+), second kind', 'tr', { color: E.lim != null ? 'green' : 'red', weight: 600 });
          state = { h, lo, hi, mono: E.lim != null };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          return s.mono
            ? `On $(0,h)$ the values lie in $(${v.fix(s.lo, 3)}, ${v.fix(s.hi, 3)}]$: the box has height $${v.fmt(s.hi - s.lo, 3)}$, the sum of the jumps inside $(0,h)$ — a tail of a convergent series, so it tends to $0$ and $f(0+) = 0.45$ exists, while $f(0) = 0$.`
            : `On $(0,h)$ the values $0.45$ and $1$ both occur, for every $h$: the box keeps height $${v.fix(s.hi - s.lo, 2)}$, so $g(0+)$ does not exist. A monotonic function could not do this (4.29).`;
        });
      },
    },
    {
      num: '4.30',
      kind: 'Theorem',
      name: 'A monotonic function has countably many discontinuities',
      statement: String.raw`If $f$ is monotonic on $(a,b)$, then the set of points of $(a,b)$ at which $f$ is discontinuous is at most countable.`,
      idea: String.raw`Say $f$ increases, and let $E$ be its set of discontinuities. For $x\in E$ the interval $(f(x-),f(x+))$ is nonempty (4.29), so it contains a rational $r(x)$ (1.20). If $x_1<x_2$ then $f(x_1+)\le f(x_2-)$, so these intervals are pairwise disjoint and $x\mapsto r(x)$ is one-to-one. Thus $E$ is equivalent to a subset of $\Q$, which is countable (2.13a, 2.8). Rudin's Remark 4.31 shows the bound is sharp: the jumps can sit at every rational.`,
      caption: String.raw`An increasing step function with jumps of sizes $c_n=0.1\cdot0.9^{\,n}$ at the first $N$ rationals of $(0,1)$ — Rudin's construction 4.31. Each jump opens an interval $(f(x-),f(x+))$ on the vertical axis (coloured column); disjoint intervals, each tagged with its own rational (the one with the smallest denominator, ticked). Drag the gold marker to pick a jump; raise $N$ to watch the jumps become dense while every one keeps a private rational.`,
      deps: ['pma-4.29', 'pma-1.20', 'pma-2.13a', 'pma-2.8'],
      see: ['pma-6.16'],
      tags: ['monotonic functions', 'countability'],
      viz(v) {
        const Qs = [];
        for (let q = 2; Qs.length < 90; q++) for (let p = 1; p < q; p++) if (gcd(p, q) === 1) Qs.push([p, q]);
        const c = (n) => 0.1 * 0.9 ** n;
        const N = v.slider('jumps $N$', 1, 60, 18, { int: true });
        const S = v.stage({ x: [-0.42, 1.06], y: [-0.17, 1.04], height: 400, axes: false });
        const xCol = -0.16;
        const M = S.handle(0.5, -0.05, { color: 'gold', constrain: (x) => [v.M.clamp(x, 0, 1), -0.05] });
        let state = null;
        v.render(() => {
          const n = N.value;
          const J = Qs.slice(0, n).map(([p, q], k) => ({ x: p / q, p, q, c: c(k), k }));
          const sorted = J.slice().sort((u, w) => u.x - w.x);
          let acc = 0; for (const j of sorted) { j.lo = acc; acc += j.c; j.hi = acc; }
          S.setView(null, [-0.24, acc + 0.1]);
          for (const j of J) j.r = simplest(j.lo, j.hi);
          // axis
          S.line(0, -0.05, 1, -0.05, { color: 'muted', width: 1.2 });
          for (const [x, lab] of [[0, '0'], [0.5, '½'], [1, '1']]) S.text(lab, x, -0.05, { dy: 13, align: 'center', color: 'muted', size: 11 });
          // staircase (left-continuous: f(x) = sum of c over jumps strictly left of x)
          let prevX = 0, prevY = 0;
          for (const j of sorted) { S.line(prevX, prevY, j.x, prevY, { color: 'ink', width: 2 }); S.line(j.x, j.lo, j.x, j.hi, { color: 'faint', width: 1, dash: [2, 2] }); prevX = j.x; prevY = j.hi; }
          S.line(prevX, prevY, 1, prevY, { color: 'ink', width: 2 });
          for (const j of sorted) if (j.c * S.sy > 6) { S.dot(j.x, j.lo, { r: 2.8, color: 'ink' }); S.dot(j.x, j.hi, { r: 2.8, color: 'ink', hollow: true, width: 1.2 }); }
          // column of jump intervals with their rationals
          sorted.forEach((j, i) => S.line(xCol, j.lo, xCol, j.hi, { color: i % 2 ? 'purple' : 'teal', width: 10, cap: 'butt', alpha: 0.8 }));
          for (const j of J) if (j.r) { const y = j.r[0] / j.r[1]; S.line(xCol - 0.025, y, xCol + 0.025, y, { color: 'ink', width: 1.2 }); }
          // selected jump
          let sel = J[0]; for (const j of J) if (Math.abs(j.x - M.x) < Math.abs(sel.x - M.x)) sel = j;
          S.line(xCol, sel.lo, xCol, sel.hi, { color: 'gold', width: 14, cap: 'butt' });
          S.line(xCol, sel.lo, sel.x, sel.lo, { color: 'gold', width: 1, dash: [3, 3] }); S.line(xCol, sel.hi, sel.x, sel.hi, { color: 'gold', width: 1, dash: [3, 3] });
          S.line(sel.x, -0.05, sel.x, sel.lo, { color: 'gold', width: 1, dash: [2, 3] });
          S.dot(sel.x, sel.hi, { r: 5, color: 'gold', hollow: true, width: 2 }); S.dot(sel.x, sel.lo, { r: 4.5, color: 'gold' });
          if (sel.r) { const y = sel.r[0] / sel.r[1]; S.dot(xCol, y, { r: 4, color: 'ink' }); S.tex(`r = \\tfrac{${sel.r[0]}}{${sel.r[1]}}`, xCol - 0.04, y, { align: 'right', color: 'ink', size: 15 }); }
          S.tex(`x = \\tfrac{${sel.p}}{${sel.q}}`, sel.x, -0.05, { baseline: 'top', dy: 16, color: 'gold', size: 14 });
          S.text('jump intervals', xCol, acc, { align: 'center', color: 'muted', size: 11, dy: -14 });
          state = { sel, n, total: acc };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          const { sel } = s;
          return `The jump at $x = ${sel.p}/${sel.q}$ opens the interval $(f(x-), f(x+)) = (${v.fix(sel.lo, 4)}, ${v.fix(sel.hi, 4)})$, which contains the rational $${sel.r ? `${sel.r[0]}/${sel.r[1]}` : '?'}$. The ${s.n} intervals are pairwise disjoint, so different jumps get different rationals: the discontinuities inject into $\\Q$.`;
        });
      },
    },
    // ------------------------------------------------------------------ infinite limits and limits at infinity
    {
      num: '4.32',
      kind: 'Definition',
      name: 'Neighbourhoods of plus and minus infinity',
      statement: String.raw`For a real number $c$, the set of real $x$ with $x>c$ is a *neighbourhood of $+\infty$*, written $(c,+\infty)$; similarly $(-\infty,c)$ is a *neighbourhood of $-\infty$*.`,
      idea: String.raw`These play the role of the balls $(A-\eps,A+\eps)$ around a real point: shrinking a neighbourhood of $+\infty$ means pushing $c$ to the right. With them, limits can be defined uniformly for real and infinite points of the extended real line (1.23).`,
      deps: ['pma-1.23'],
      tags: ['extended reals'],
    },
    {
      num: '4.33',
      kind: 'Definition',
      name: 'Limits in the extended real number system',
      statement: String.raw`Let $f$ be a real function on $E\subset\R$. For $A$ and $x$ in the extended real number system we say $f(t)\to A$ as $t\to x$ if for every neighbourhood $U$ of $A$ there is a neighbourhood $V$ of $x$ such that $V\cap E$ is nonempty and $f(t)\in U$ for every $t\in V\cap E$ with $t\neq x$.

When $A$ and $x$ are real this agrees with Definition 4.1.`,
      idea: String.raw`Neighbourhoods of $\pm\infty$ (4.32) make infinite points behave like ordinary ones, so "$t\to+\infty$" and "$f\to-\infty$" become instances of a single definition. Squashing the extended line onto the closed interval $[-1,1]$ by $u\mapsto u/(1+|u|)$ makes this literal: neighbourhoods of $\pm\infty$ become ordinary intervals at the ends.`,
      caption: String.raw`Both axes are squashed by $u\mapsto u/(1+|u|)$, so $\pm\infty$ sit on the dashed edges. Choose an example and the size of the neighbourhood $U$ of $A$ (blue band). The orange band is the largest neighbourhood $V$ of $x$ that works: every $t\in V$, $t\ne x$, has $f(t)\in U$. In the last example no $V$ works, since $1/t\to-\infty$ from the left.`,
      deps: ['pma-4.32', 'pma-4.1', 'pma-1.23'],
      tags: ['limits', 'extended reals'],
      viz(v) {
        const EX = {
          pole: { label: '$1/t^2$, $t\\to0$', f: (t) => 1 / (t * t), x: 0, A: Infinity },
          rat: { label: '$\\frac{1+2t^2}{1+t^2}$, $t\\to+\\infty$', f: (t) => (1 + 2 * t * t) / (1 + t * t), x: Infinity, A: 2 },
          exp: { label: '$e^{t}$, $t\\to-\\infty$', f: Math.exp, x: -Infinity, A: 0 },
          cube: { label: '$t^3$, $t\\to-\\infty$', f: (t) => t * t * t, x: -Infinity, A: -Infinity },
          inv: { label: '$1/t$, $t\\to0$', f: (t) => 1 / t, x: 0, A: Infinity },
        };
        const which = v.select('', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'pole');
        const rS = v.slider('size of $U$', 0.03, 0.6, 0.2, { step: 0.005 });
        const S = v.stage({ x: [-1.14, 1.14], y: [-1.14, 1.3], height: 390, axes: false });
        function vSize(E, r) {
          const s0 = sq(E.x), sA = sq(E.A);
          const okAt = (s) => { if (s <= -1 || s >= 1) return true; const t = unsq(s); if (t === E.x) return true; const y = sq(E.f(t)); return isFinite(y) && Math.abs(y - sA) < r; };
          const sides = E.x === Infinity ? [-1] : E.x === -Infinity ? [1] : [1, -1];
          const bad = (d) => sides.some((sd) => !okAt(s0 + sd * d));
          const ds = []; for (let j = 40; j >= 1; j--) ds.push(0.002 * 0.5 ** j); for (let k = 1; k <= 1000; k++) ds.push(0.002 * k);
          for (let i = 0; i < ds.length; i++) {
            if (!bad(ds[i])) continue;
            if (ds[i] < 1e-9) return 0;
            let lo = i ? ds[i - 1] : 0, hi = ds[i];
            for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (bad(m)) hi = m; else lo = m; }
            return hi;
          }
          return 2;
        }
        let state = null;
        v.legend([['ink', '$(s(t), s(f(t)))$ with $s(u)=u/(1+|u|)$'], ['accent', 'neighbourhood $U$ of $A$', { area: true }], ['orange', 'neighbourhood $V$ of $x$', { area: true }]]);
        v.render(() => {
          const E = EX[which.value], r = rS.value;
          const s0 = sq(E.x), sA = sq(E.A);
          const rho = vSize(E, r);
          const u0 = Math.max(-1, sA - r), u1 = Math.min(1, sA + r);
          S.hband(u0, u1, { color: 'accent', alpha: 0.12, edges: true });
          const v0 = Math.max(-1, s0 - rho), v1 = Math.min(1, s0 + rho);
          if (rho > 0) S.vband(v0, v1, { color: 'orange', alpha: 0.14, edges: true });
          squashedFrame(S, { xInf: [-1, 1] });
          const G = (s) => { const t = unsq(s); const y = E.f(t); return isFinite(y) ? sq(y) : y > 0 ? 1 : NaN; };
          S.fn(G, { domain: [-0.9995, 0.9995], color: 'ink', width: 2.3, n: 3000 });
          if (rho > 0) S.fn(G, { domain: [Math.max(-0.9995, v0), Math.min(0.9995, v1)], color: 'accent', width: 3.6, n: 1500 });
          S.dot(s0, sA, { r: 5.5, color: rho > 0 ? 'green' : 'red', hollow: true, width: 2.2 });
          S.tex('U', S.bounds.x[1], (u0 + u1) / 2, { color: 'accent', align: 'right', dx: -6 });
          if (rho > 0) S.tex('V', (v0 + v1) / 2, S.bounds.y[0], { color: 'orange', baseline: 'bottom', dy: -24 });
          S.corner(rho > 0 ? 'a neighbourhood V works' : 'no neighbourhood V works', 'tr', { color: rho > 0 ? 'green' : 'red', weight: 600 });
          state = { E, U: [unsq(u0), unsq(u1)], V: [unsq(v0), unsq(v1)], rho };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          const iv = ([a, b]) => `(${fmtX(v, a)}, ${fmtX(v, b)})`;
          const U = s.E.A === Infinity ? `(${fmtX(v, s.U[0])}, +\\infty)` : s.E.A === -Infinity ? `(-\\infty, ${fmtX(v, s.U[1])})` : iv(s.U);
          const V = s.E.x === Infinity ? `(${fmtX(v, s.V[0])}, +\\infty)` : s.E.x === -Infinity ? `(-\\infty, ${fmtX(v, s.V[1])})` : iv(s.V);
          return s.rho > 0
            ? `$U = ${U}$ is a neighbourhood of $A = ${fmtX(v, s.E.A)}$, and $V = ${V}$ is a neighbourhood of $x = ${fmtX(v, s.E.x)}$ with $f(t)\\in U$ for all $t\\in V$, $t\\ne x$.`
            : `For $U = ${U}$ no neighbourhood of $x = ${fmtX(v, s.E.x)}$ works: points just left of $0$ have $f(t) = 1/t$ very negative. So $1/t$ does not tend to $+\\infty$ as $t\\to0$ — nor to $-\\infty$, nor to any real number.`;
        });
      },
    },
    {
      num: '4.34',
      kind: 'Theorem',
      name: 'Limit rules in the extended reals',
      statement: String.raw`Let $f$ and $g$ be defined on $E\subset\R$, and suppose $f(t)\to A$ and $g(t)\to B$ as $t\to x$, with $A$, $B$, $x$ in the extended real number system. Then
(a) $f(t)\to A'$ implies $A'=A$;
(b) $(f+g)(t)\to A+B$;
(c) $(fg)(t)\to AB$;
(d) $(f/g)(t)\to A/B$,
provided the right-hand sides of (b), (c), (d) are defined. The expressions $\infty-\infty$, $0\cdot\infty$, $\infty/\infty$ and $A/0$ are not defined.`,
      idea: String.raw`The proof copies that of 4.4 (and of 3.3 for sequences), with neighbourhoods of $\pm\infty$ in place of $\eps$-balls where needed; e.g. if $f\to+\infty$ and $g\to B$ finite, then $g$ is eventually bounded below, so $f+g$ eventually exceeds any $c$. The excluded forms really must be excluded: for them the limit depends on more than $A$ and $B$, as the free parameter $\kappa$ shows.`,
      caption: String.raw`Coordinates squashed as in 4.33, with $t\to+\infty$ at the right edge. Pick a case and move the free parameter $\kappa$, which changes $f$ or $g$ without changing their limits $A$ and $B$. In the defined cases the combination $h$ (green) always lands on the predicted $A\circ B$; in the four undefined forms the limit of $h$ (red) moves with $\kappa$ — or fails to exist.`,
      deps: ['pma-4.33', 'pma-4.4', 'pma-1.23'],
      tags: ['limits', 'extended reals'],
      viz(v) {
        const I = Infinity;
        const CASES = {
          sum: { label: '$+\\infty+1$', f: (t) => t, g: (t, k) => 1 + (k * Math.sin(3 * t)) / (1 + t), A: I, B: 1, op: (a, b) => a + b, C: () => I, sym: 'A+B' },
          prod: { label: '$(+\\infty)(-2)$', f: (t) => t, g: (t, k) => -2 + k / (1 + t), A: I, B: -2, op: (a, b) => a * b, C: () => -I, sym: 'AB' },
          quot: { label: '$3/(+\\infty)$', f: (t, k) => 3 + (k * Math.sin(t)) / (1 + 0.3 * t), g: (t) => 1 + t, A: 3, B: I, op: (a, b) => a / b, C: () => 0, sym: 'A/B' },
          dd: { label: '$\\infty-\\infty$', f: (t) => t, g: (t, k) => -t + k, A: I, B: -I, op: (a, b) => a + b, C: (k) => k, undef: true, sym: 'A+B' },
          zi: { label: '$0\\cdot\\infty$', f: (t, k) => k / (1 + t), g: (t) => 1 + t, A: 0, B: I, op: (a, b) => a * b, C: (k) => k, undef: true, sym: 'AB' },
          ii: { label: '$\\infty/\\infty$', f: (t) => 1 + t, g: (t, k) => 2 ** k * (1 + t), A: I, B: I, op: (a, b) => a / b, C: (k) => 2 ** -k, undef: true, sym: 'A/B' },
          az: { label: '$1/0$', f: () => 1, g: (t, k) => (k + Math.sin(t)) / (1 + t), A: 1, B: 0, op: (a, b) => a / b, C: (k) => (Math.abs(k) > 1 ? Math.sign(k) * I : NaN), undef: true, sym: 'A/B' },
        };
        const which = v.select('', Object.entries(CASES).map(([value, o]) => ({ value, label: o.label })), 'dd');
        const kS = v.slider('free parameter $\\kappa$', -2, 2, 0.8, { step: 0.05 });
        const S = v.stage({ x: [-0.06, 1.1], y: [-1.14, 1.3], height: 390, axes: false });
        let state = null;
        v.legend([['blue', '$f\\to A$'], ['purple', '$g\\to B$'], ['green', '$h$ (defined case)'], ['red', '$h$ (undefined form)']]);
        v.render(() => {
          const Cs = CASES[which.value], k = kS.value;
          squashedFrame(S, { xs: [0, 1, 3, 10, 30], xInf: [1] });
          const T = (s) => unsq(s);
          const Fh = (t) => Cs.op(Cs.f(t, k), Cs.g(t, k));
          const plot = (F, st) => S.fn((s) => { const y = F(T(s)); return isFinite(y) ? sq(y) : NaN; }, { domain: [0, 0.9985], n: 3000, ...st });
          plot((t) => Cs.f(t, k), { color: 'blue', width: 1.7, alpha: 0.85 });
          plot((t) => Cs.g(t, k), { color: 'purple', width: 1.7, alpha: 0.85 });
          plot(Fh, { color: Cs.undef ? 'red' : 'green', width: 2.6 });
          const C = Cs.C(k);
          S.dot(1, sq(Cs.A), { r: 5.5, color: 'blue', hollow: true, width: 2.2, label: 'A', labelPos: 'e' });
          S.dot(1, sq(Cs.B), { r: 5.5, color: 'purple', hollow: true, width: 2.2, label: 'B', labelPos: 'e' });
          if (!Number.isNaN(C)) S.dot(1, sq(C), { r: 6.5, color: Cs.undef ? 'red' : 'green', hollow: true, width: 2.6 });
          S.corner(Cs.undef ? `${Cs.sym} is an undefined form here` : `${Cs.sym} is defined: h → ${Cs.sym}`, 'tr', { color: Cs.undef ? 'red' : 'green', weight: 600 });
          state = { Cs, k, C, h1000: Fh(1000) };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          const { Cs, k, C } = s;
          const lim = Number.isNaN(C) ? '\\text{no limit}' : fmtX(v, C);
          const head = `$A = ${fmtX(v, Cs.A)}$, $B = ${fmtX(v, Cs.B)}$; $h(1000) = ${v.fmt(s.h1000, 4)}$. `;
          if (!Cs.undef) return head + `Here $${Cs.sym} = ${fmtX(v, C)}$ is defined, and $h\\to ${fmtX(v, C)}$ whatever $\\kappa$ is.`;
          if (Number.isNaN(C)) return head + `$${Cs.sym}$ is an undefined form: with $\\kappa = ${v.fix(k, 2)}$ the denominator $g$ changes sign infinitely often and $h$ has no limit at all, while for $|\\kappa|>1$ it tends to $\\pm\\infty$ with the sign of $\\kappa$.`;
          return head + `$${Cs.sym}$ is an undefined form: with $\\kappa = ${v.fix(k, 2)}$ we get $h\\to${lim}$, and the limit changes with $\\kappa$ — which is why the theorem must exclude it.`;
        });
      },
    },
  ],
};
