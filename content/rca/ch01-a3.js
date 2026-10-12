// Rudin, Real and Complex Analysis — Chapter 1, part 3: arithmetic in [0,∞] and the
// integration of positive functions (MCT, series, Fatou, densities).

/** Maximal intervals in [a,b] on which pred holds (sampled, endpoints refined by bisection). */
function intervalsWhere(pred, a, b, n = 1200) {
  const out = []; let prevX = a, prevIn = !!pred(a), start = prevIn ? a : null;
  for (let i = 1; i <= n; i++) {
    const x = a + (b - a) * i / n, inn = !!pred(x);
    if (inn !== prevIn) {
      let lo = prevX, hi = x;
      for (let k = 0; k < 28; k++) { const m = (lo + hi) / 2; if (!!pred(m) === prevIn) lo = m; else hi = m; }
      const t = (lo + hi) / 2;
      if (inn) start = t; else { out.push([start, t]); start = null; }
    }
    prevX = x; prevIn = inn;
  }
  if (start != null) out.push([start, b]);
  return out;
}
const totalLength = (ivs) => ivs.reduce((s, [a, b]) => s + (b - a), 0);
/** Midpoint-rule integral on [a,b] with n cells (robust for discontinuous integrands). */
function mid(f, a, b, n = 4000) { const h = (b - a) / n; let s = 0; for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * h); return s * h; }
const CYCLE = ['blue', 'orange', 'teal', 'purple', 'pink', 'gold', 'green', 'red'];

export default {
  book: 'rca',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.22
    {
      num: '1.22',
      kind: 'Proposition',
      name: 'Arithmetic in [0, ∞]; the convention 0 · ∞ = 0',
      statement: String.raw`In $[0,\infty]$ put $a+\infty=\infty+a=\infty$ for $0\le a\le\infty$, $a\cdot\infty=\infty\cdot a=\infty$ for $0<a\le\infty$, and $0\cdot\infty=\infty\cdot0=0$. With these conventions addition and multiplication are commutative, associative and distributive, the cancellation laws hold only for finite (resp. finite nonzero) cancelled terms, and:

if $0\le a_1\le a_2\le\cdots$, $0\le b_1\le b_2\le\cdots$, $a_n\to a$ and $b_n\to b$, then $a_nb_n\to ab$.

Consequently (with 1.14 and 1.17) sums and products of measurable functions $X\to[0,\infty]$ are measurable.`,
      idea: String.raw`If $a,b<\infty$ this is ordinary calculus. If $b=\infty$ and $a>0$, then $a_nb_n\ge a_Nb_n\to\infty$ for any fixed $N$ with $a_N>0$. If $a=0$, monotonicity forces $a_n=0$ for every $n$, so $a_nb_n=0=0\cdot\infty$ — the convention is exactly what keeps the rule true. For measurability, approximate $f,g$ by increasing simple functions $s_n\uparrow f$, $t_n\uparrow g$ (1.17); then $s_n+t_n\uparrow f+g$ and $s_nt_n\uparrow fg$, and limits of measurable functions are measurable (1.14).`,
      caption: String.raw`The product $a_nb_n$ is the area of the rectangle $[0,a_n]\times[0,b_n]$. Slide $n$ and compare the cases: when both sequences increase, the areas converge to $ab$ — including $0\cdot\infty=0$, where the rectangle never gets any width. The last case drops monotonicity ($a_n=\frac{1.5}n$ decreases) and the products stay at $0.9\ne 0\cdot\infty$.`,
      deps: ['rca-1.13'],
      tags: ['extended reals'],
      verify: true,
      viz(v) {
        const M = v.M;
        const C = {
          fin: { label: '$a,b<\\infty$', a: (n) => 1.6 * (1 - 0.6 ** n), b: (n) => 1.25 * (1 - 0.72 ** n), A: 1.6, B: 1.25 },
          inf: { label: '$a>0$, $b=\\infty$', a: (n) => 1.6 * (1 - 0.6 ** n), b: (n) => 0.3 * n, A: 1.6, B: Infinity },
          zero: { label: '$a=0$, $b=\\infty$', a: () => 0, b: (n) => 0.3 * n, A: 0, B: Infinity },
          bad: { label: 'not monotone', a: (n) => 1.5 / n, b: (n) => 0.6 * n, A: 0, B: Infinity, bad: true },
        };
        const which = v.select('', Object.entries(C).map(([value, o]) => ({ value, label: o.label })), 'fin');
        const nS = v.slider('$n$', 1, 30, 4, { int: true });
        const L = v.stage({ x: [-0.3, 2.3], y: [-0.38, 3.2], height: 340, title: 'the rectangle $[0,a_n]\\times[0,b_n]$' });
        const R = v.stage({ x: [0, 31], y: [0, 3], axes: 'box', height: 340, xticks: [1, 5, 10, 15, 20, 25, 30], title: 'the products $a_kb_k$, $k\\le n$' });
        let st = null;
        v.render(() => {
          const Q = C[which.value], n = nS.value, top = 3.05;
          for (let k = 1; k < n; k++) L.rect(0, 0, Q.a(k), Math.min(Q.b(k), top), { color: 'accent', width: 0.8, alpha: 0.25 });
          const an = Q.a(n), bn = Q.b(n);
          L.rect(0, 0, an, Math.min(bn, top), { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 2.2 });
          if (bn > top) L.arrow(Math.max(an, 0.02) / 2, top - 0.35, Math.max(an, 0.02) / 2, top, { color: 'accent', head: 8 });
          if (an === 0) L.line(0, 0, 0, Math.min(bn, top), { color: 'red', width: 3.5 });
          if (isFinite(Q.B) && !Q.bad) L.rect(0, 0, Q.A, Q.B, { color: 'green', width: 1.6, dash: [5, 4] });
          L.tex('a_n', an / 2, 0, { color: 'accent', dy: 14, size: 14 });
          L.tex('b_n', 0, Math.min(bn, top) / 2, { color: 'accent', dx: -16, size: 14 });
          L.tex(`a_nb_n=${v.fix(an * bn, 3)}`, Math.max(an, isFinite(Q.B) && !Q.bad ? Q.A : 0, 0.05) + 0.08, Math.min(bn, top) * 0.55, { color: an === 0 ? 'red' : 'accent', align: 'left', size: 14 });
          const prods = M.range(n, 1).map((k) => Q.a(k) * Q.b(k));
          const lim = Q.bad ? 0 : (Q.A === 0 ? 0 : (isFinite(Q.B) ? Q.A * Q.B : Infinity));
          const ymax = Math.max(2.5, ...M.range(30, 1).map((k) => Math.min(Q.a(k) * Q.b(k), 12))) * 1.1;
          R.setView(null, [-0.08 * ymax, ymax]);
          if (isFinite(lim)) { R.hline(lim, { color: Q.bad ? 'red' : 'green', width: 1.6, dash: [6, 4] }); R.tex(Q.bad ? '0\\cdot\\infty=0' : 'ab', 30.6, lim, { color: Q.bad ? 'red' : 'green', align: 'right', baseline: 'bottom', dy: -4, size: 14 }); }
          else R.tex('ab=\\infty', 30.6, ymax, { color: 'green', align: 'right', baseline: 'top', dy: 6, size: 14 });
          R.path(prods.map((p, i) => [i + 1, Math.min(p, ymax)]), { color: 'accent', width: 1.3, alpha: 0.6 });
          R.dots(prods.map((p, i) => [i + 1, Math.min(p, ymax)]), { color: 'accent', r: 3.6 });
          v.legend([['accent', '$a_n b_n$'], ['green', 'the limit $ab$ (with $0\\cdot\\infty=0$)', { dash: true }], ['red', 'failure without monotonicity', { dash: true }]]);
          st = { an, bn, p: an * bn, lim, bad: Q.bad };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const lim = isFinite(s.lim) ? v.fix(s.lim, 3) : '\\infty';
          return `$a_n=${v.fix(s.an, 3)}$, $b_n=${v.fix(s.bn, 3)}$, $a_nb_n=${v.fix(s.p, 3)}$; $\\;ab=${lim}$` + (s.bad ? ' — but $a_n$ decreases, so the rule does not apply and $a_nb_n\\not\\to ab$.' : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 1.23
    {
      num: '1.23',
      kind: 'Definition',
      name: 'The integral of a nonnegative measurable function',
      statement: String.raw`If $s=\sum_{i=1}^n\alpha_i\chi_{A_i}$ is a measurable simple function with distinct values $\alpha_i\in[0,\infty)$, and $E\in\mathfrak M$, put
$$\int_E s\,d\mu=\sum_{i=1}^n\alpha_i\,\mu(A_i\cap E)\qquad(0\cdot\infty=0).$$
For measurable $f:X\to[0,\infty]$ and $E\in\mathfrak M$ define
$$\int_E f\,d\mu=\sup\int_E s\,d\mu,$$
the supremum over all measurable simple $s$ with $0\le s\le f$. (For simple $f$ the two definitions agree.)`,
      idea: String.raw`The Lebesgue integral measures the area under $f$ by slicing horizontally: a simple function below $f$ is a finite stack of slabs of height $\alpha_i$ over arbitrary measurable bases $A_i$, whose areas $\alpha_i\mu(A_i)$ need only the measure — no partition of the domain into intervals. Taking the supremum over all such stacks gives the integral.`,
      caption: String.raw`Drag the five gold levels on the left. The blue simple function $s$ takes the largest level below $f$ at each point, so $0\le s\le f$; the coloured strip at the bottom shows its level sets $A_i$ (unions of intervals). On the right the same slabs are rearranged as rectangles of height $\alpha_i$ and width $\mu(A_i)$: their total area is $\int s$, never more than the area $\int f$ under the decreasing rearrangement of $f$ (black).`,
      deps: ['rca-1.16', 'rca-1.18', 'rca-1.22'],
      tags: ['integral', 'definitions'],
      viz(v) {
        const M = v.M;
        const f = (x) => 1.3 + 0.8 * Math.sin(2 * Math.PI * x + 0.4) + 0.32 * Math.sin(9 * x);
        const L = v.stage({ x: [-0.08, 1.01], y: [-0.52, 2.6], axes: 'box', height: 360, weight: 1.5, xticks: [0, 0.25, 0.5, 0.75, 1], title: '$f$ and a simple $s\\le f$ on $X=[0,1]$' });
        const R = v.stage({ x: [-0.02, 1.02], y: [-0.52, 2.6], axes: 'box', height: 360, weight: 1, minWidth: 220, xticks: [0, 0.5, 1], title: 'slabs rearranged: $\\sum\\alpha_i\\,\\mu(A_i)$' });
        const H = [0.45, 0.9, 1.3, 1.75, 2.15].map((y) => L.handle(-0.045, y, { color: 'gold', r: 6, constrain: (x, yy) => [-0.045, M.clamp(yy, 0.02, 2.5)] }));
        const xs = M.linspace(0.0001, 0.9999, 4000);
        const fstar = xs.map(f).sort((a, b) => b - a);
        const If = M.integrate(f, 0, 1, 2000);
        let st = null;
        v.render(() => {
          const lev = H.map((h) => h.y).sort((a, b) => a - b);
          const s = (x) => { const y = f(x); let r = 0; for (const a of lev) if (a <= y) r = a; return r; };
          const idx = (x) => { const y = f(x); let r = -1; lev.forEach((a, i) => { if (a <= y) r = i; }); return r; };
          lev.forEach((a) => L.line(0, a, 1, a, { color: 'gold', width: 1, dash: [3, 4], alpha: 0.8 }));
          L.fn(s, { domain: [0, 1], color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.2, n: 2400 });
          L.fn(f, { domain: [0, 1], color: 'ink', width: 2 });
          // level sets A_i as one coloured strip
          const meas = lev.map(() => 0);
          lev.forEach((a, i) => {
            const ivs = intervalsWhere((x) => idx(x) === i, 0, 1, 1500);
            meas[i] = totalLength(ivs);
            for (const [u, w] of ivs) L.rect(u, -0.33, w, -0.17, { fill: CYCLE[i], fillAlpha: 0.85, stroke: false });
          });
          L.tex('A_1,\\dots,A_5', 1, -0.15, { color: 'muted', align: 'right', baseline: 'bottom', size: 12.5 });
          // right: rectangles
          let x0 = 0, Is = 0;
          for (let i = lev.length - 1; i >= 0; i--) {
            if (meas[i] <= 0) continue;
            R.rect(x0, 0, x0 + meas[i], lev[i], { fill: CYCLE[i], fillAlpha: 0.45, color: CYCLE[i], width: 1.2 });
            if (meas[i] > 0.06) R.tex(`\\alpha_${i + 1}`, x0 + meas[i] / 2, lev[i], { color: CYCLE[i], dy: -10, size: 13 });
            Is += lev[i] * meas[i]; x0 += meas[i];
          }
          R.path(fstar.map((y, i) => [(i + 0.5) / fstar.length, y]), { color: 'ink', width: 2 });
          
          v.legend([['ink', '$f$ (right: its decreasing rearrangement)'], ['accent', '$s=\\sum\\alpha_i\\chi_{A_i}\\le f$', { area: true }], ['gold', 'the levels $\\alpha_i$', { dash: true }]]);
          st = { Is, If, lev, meas };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$\\int s\\,d\\mu=\\sum_i\\alpha_i\\,\\mu(A_i)=${s.lev.map((a, i) => `${v.fix(a, 2)}\\cdot${v.fix(s.meas[i], 3)}`).join('+')}=${v.fix(s.Is, 4)}\\ \\le\\ \\int f\\,d\\mu=${v.fix(s.If, 4)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.24
    {
      num: '1.24',
      kind: 'Proposition',
      name: 'Immediate properties of the integral',
      statement: String.raw`For measurable functions into $[0,\infty]$ and sets $A,B,E\in\mathfrak M$:
(a) if $0\le f\le g$, then $\int_E f\,d\mu\le\int_E g\,d\mu$;
(b) if $A\subset B$ and $f\ge0$, then $\int_A f\,d\mu\le\int_B f\,d\mu$;
(c) if $f\ge0$ and $0\le c<\infty$, then $\int_E cf\,d\mu=c\int_E f\,d\mu$;
(d) if $f(x)=0$ for all $x\in E$, then $\int_E f\,d\mu=0$, even if $\mu(E)=\infty$;
(e) if $\mu(E)=0$, then $\int_E f\,d\mu=0$, even if $f(x)=\infty$ for every $x\in E$;
(f) if $f\ge0$, then $\int_E f\,d\mu=\int_X\chi_Ef\,d\mu$.`,
      idea: String.raw`Each item is read off the definition 1.23: (a) every simple $s\le f$ is also $\le g$; (b) $\mu(A_i\cap A)\le\mu(A_i\cap B)$; (c) $s\le f$ iff $cs\le cf$; (d) and (e) because every term $\alpha_i\mu(A_i\cap E)$ of a simple integral has $\alpha_i=0$, respectively $\mu(A_i\cap E)=0$, and $0\cdot\infty=0$; (f) simple functions below $\chi_Ef$ vanish off $E$.`,
      caption: String.raw`Three pictures. (a),(b): drag the ends of $A$ inside the fixed set $B$ — the shaded integrals are nested. (c): drag the handle to rescale $f$; the area scales by exactly $c$. (d),(e): on $X=[0,\infty)$, $f$ vanishes on the infinite-measure set $E=[3,\infty)$ and is $+\infty$ at the single point $p$, yet both contribute $0$.`,
      deps: ['rca-1.23'],
      tags: ['integral'],
      verify: true,
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'ab', label: '(a), (b) monotonicity' }, { value: 'c', label: '(c) scaling' }, { value: 'de', label: '(d), (e) $0\\cdot\\infty=0$' }], 'ab');
        const S = v.stage({ x: [-0.02, 1.02], y: [-0.3, 2.4], height: 340, axes: 'box', full: true, title: ' ' });
        const f = (x) => 0.9 + 0.5 * Math.sin(2 * Math.PI * x);
        const g = (x) => f(x) + 0.6 * Math.exp(-(((x - 0.6) / 0.14) ** 2));
        const B = [0.08, 0.92], RY = -0.17;
        const ha = S.handle(0.3, RY, { color: 'accent', constrain: (x) => [M.clamp(x, B[0], B[1]), RY] });
        const hb = S.handle(0.62, RY, { color: 'accent', constrain: (x) => [M.clamp(x, B[0], B[1]), RY] });
        const hc = S.handle(0.25, 2.1, { color: 'accent', label: 'cf', constrain: (x, y) => [0.25, M.clamp(y, 0, 2.3)] });
        const fd = (x) => (x < 3 ? 0.9 + 0.6 * Math.sin(1.7 * x) * Math.exp(-0.2 * x) : 0);
        const P = 1.9;
        let st = null;
        v.render(() => {
          const md = mode.value;
          ha.visible = hb.visible = md === 'ab'; hc.visible = md === 'c';
          if (md === 'ab') {
            S.setView([-0.02, 1.02], [-0.3, 2.4]); S.setTitle('$0\\le f\\le g$ and $A\\subset B$: $\\int_A f\\le\\int_B f\\le\\int_B g$');
            const a = Math.min(ha.x, hb.x), b = Math.max(ha.x, hb.x);
            S.between(g, () => 0, B[0], B[1], { fill: 'orange', fillAlpha: 0.12 });
            S.between(f, () => 0, B[0], B[1], { fill: 'accent', fillAlpha: 0.14 });
            S.between(f, () => 0, a, b, { fill: 'accent', fillAlpha: 0.35 });
            S.fn(g, { domain: [0, 1], color: 'orange', width: 2.2 });
            S.fn(f, { domain: [0, 1], color: 'accent', width: 2.2 });
            S.line(B[0], RY, B[1], RY, { color: 'orange', width: 6, cap: 'butt', alpha: 0.5 });
            S.line(a, RY, b, RY, { color: 'accent', width: 6, cap: 'butt' });
            S.tex('B', B[1], RY, { color: 'orange', dx: 12, size: 14 }); S.tex('A', (a + b) / 2, RY, { color: 'accent', dy: -13, size: 14 });
            S.tex('f', 0.03, f(0.03), { color: 'accent', dy: 14, size: 15 }); S.tex('g', 0.6, g(0.6), { color: 'orange', dy: -14, size: 15 });
            const IA = M.integrate(f, a, b, 400), IB = M.integrate(f, B[0], B[1], 400), IBg = M.integrate(g, B[0], B[1], 400);
            st = { md, IA, IB, IBg };
            v.legend([['accent', '$\\int_A f$ (dark) inside $\\int_B f$', { area: true }], ['orange', '$\\int_B g$', { area: true }]]);
          } else if (md === 'c') {
            S.setView([-0.02, 1.02], [-0.1, 2.4]); S.setTitle('$\\int cf=c\\int f$');
            const c = hc.y / f(0.25);
            S.fn(f, { domain: [0, 1], color: 'muted', width: 1.6, dash: [5, 4], fill: 'gray', fillAlpha: 0.12 });
            S.fn((x) => c * f(x), { domain: [0, 1], color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.2 });
            const If = M.integrate(f, 0, 1, 400);
            st = { md, c, If, Icf: M.integrate((x) => c * f(x), 0, 1, 400) };
            v.legend([['muted', '$f$', { dash: true }], ['accent', '$cf$', { area: true }]]);
          } else {
            S.setView([-0.15, 6.3], [-0.3, 2.4]); S.setTitle('$X=[0,\\infty)$ with Lebesgue measure');
            S.vband(3, 6.3, { color: 'red', alpha: 0.08 });
            S.fn(fd, { domain: [0, 6.3], color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.18 });
            S.dot(P, fd(P), { color: 'accent', r: 4, hollow: true });
            S.line(P, 0, P, 2.25, { color: 'red', width: 2.2 }); S.arrow(P, 2.0, P, 2.38, { color: 'red', head: 9 });
            S.tex('f(p)=\\infty,\\ \\mu(\\{p\\})=0', P, 2.2, { color: 'red', align: 'left', dx: 8, size: 14 });
            S.tex('E=[3,\\infty):\\ f=0,\\ \\mu(E)=\\infty', 4.6, 1.2, { color: 'red', size: 14 });
            S.arrow(5.6, 0.25, 6.25, 0.25, { color: 'red', head: 8, width: 1.4 });
            st = { md, I: M.integrate(fd, 0, 3, 600) };
            v.legend([['accent', '$f$', { area: true }], ['red', 'the sets that contribute $0$', { area: true }]]);
          }
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.md === 'ab') return `$\\int_A f=${v.fix(s.IA, 4)}\\ \\le\\ \\int_B f=${v.fix(s.IB, 4)}\\ \\le\\ \\int_B g=${v.fix(s.IBg, 4)}$`;
          if (s.md === 'c') return `$c=${v.fix(s.c, 3)}$: $\\int cf=${v.fix(s.Icf, 4)}$ and $c\\int f=${v.fix(s.c * s.If, 4)}$`;
          return `$\\int_E f=0\\cdot\\infty=0$, $\\;\\int_{\\{p\\}}f=\\infty\\cdot 0=0$, so $\\int_X f=\\int_{[0,3)}f=${v.fix(s.I, 4)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.25
    {
      num: '1.25',
      kind: 'Proposition',
      name: 'Integrals of simple functions: a measure, and additivity',
      statement: String.raw`Let $s$ and $t$ be nonnegative measurable simple functions on $X$. For $E\in\mathfrak M$ put $\varphi(E)=\int_E s\,d\mu$. Then $\varphi$ is a measure on $\mathfrak M$, and
$$\int_X(s+t)\,d\mu=\int_X s\,d\mu+\int_X t\,d\mu.$$`,
      idea: String.raw`If $s=\sum\alpha_i\chi_{A_i}$ and $E=\bigcup E_r$ disjointly, then $\varphi(E)=\sum_i\alpha_i\sum_r\mu(A_i\cap E_r)=\sum_r\varphi(E_r)$ by countable additivity of $\mu$ (sums of nonnegative terms may be rearranged). For additivity let $t=\sum\beta_j\chi_{B_j}$ and $E_{ij}=A_i\cap B_j$: on $E_{ij}$ the function $s+t$ is the constant $\alpha_i+\beta_j$, so $\int_{E_{ij}}(s+t)=\int_{E_{ij}}s+\int_{E_{ij}}t$; sum over $i,j$ using that $\varphi$ is a measure.`,
      caption: String.raw`Drag the handles to set the three values of $s$ (blue) and of $t$ (orange); each value is taken on a set that is a union of two intervals. Below, $s+t$ is drawn as a stack on the common refinement $E_{ij}=A_i\cap B_j$ (dashed cuts): its area splits exactly into the blue area $\int s$ and the orange area $\int t$.`,
      deps: ['rca-1.23', 'rca-1.18'],
      tags: ['integral', 'simple functions'],
      viz(v) {
        const M = v.M;
        const sb = [0, 0.2, 0.45, 0.7, 0.85, 1], sl = [0, 1, 2, 0, 1];
        const tb = [0, 0.12, 0.32, 0.58, 0.9, 1], tl = [1, 0, 2, 1, 0];
        const T = v.stage({ x: [-0.02, 1.02], y: [-0.16, 1.6], height: 220, axes: 'box', full: true, title: '$s=\\sum_i\\alpha_i\\chi_{A_i}$ and $t=\\sum_j\\beta_j\\chi_{B_j}$' });
        const Bt = v.stage({ x: [-0.02, 1.02], y: [-0.28, 3.0], height: 260, axes: 'box', full: true, title: '$s+t$ on the refinement $E_{ij}=A_i\\cap B_j$' });
        const firstMid = (br, lab, v0) => { const k = lab.indexOf(v0); return (br[k] + br[k + 1]) / 2; };
        const HS = [0.55, 1.15, 0.85].map((y, i) => T.handle(firstMid(sb, sl, i), y, { color: 'blue', r: 6, constrain: (x, yy) => [firstMid(sb, sl, i), M.clamp(yy, 0.05, 1.5)] }));
        const HT = [0.3, 0.7, 0.45].map((y, i) => T.handle(firstMid(tb, tl, i), y, { color: 'orange', r: 6, constrain: (x, yy) => [firstMid(tb, tl, i), M.clamp(yy, 0.05, 1.5)] }));
        let st = null;
        v.render(() => {
          const al = HS.map((h) => h.y), be = HT.map((h) => h.y);
          for (let k = 0; k < 5; k++) T.line(sb[k], al[sl[k]], sb[k + 1], al[sl[k]], { color: 'blue', width: 3 });
          for (let k = 0; k < 5; k++) T.line(tb[k], be[tl[k]], tb[k + 1], be[tl[k]], { color: 'orange', width: 3, dash: [7, 3] });
          // refinement
          const cuts = [...new Set([...sb, ...tb])].sort((a, b) => a - b);
          const pieceOf = (br, x) => { let k = 0; while (k < br.length - 2 && x >= br[k + 1]) k++; return k; };
          let Is = 0, It = 0;
          for (let k = 0; k + 1 < cuts.length; k++) {
            const u = cuts[k], w = cuts[k + 1], m = (u + w) / 2;
            const a = al[sl[pieceOf(sb, m)]], b = be[tl[pieceOf(tb, m)]];
            Bt.rect(u, 0, w, a, { fill: 'blue', fillAlpha: 0.35, color: 'blue', width: 1 });
            Bt.rect(u, a, w, a + b, { fill: 'orange', fillAlpha: 0.35, color: 'orange', width: 1 });
            Is += a * (w - u); It += b * (w - u);
          }
          for (const c of cuts.slice(1, -1)) Bt.vline(c, { color: 'muted', width: 1, dash: [3, 4] });
          ['A_1', 'A_2', 'A_3'].forEach((lab, i) => T.tex(`\\alpha_${i + 1}`, firstMid(sb, sl, i), al[i], { color: 'blue', dy: -15, dx: 12, size: 13 }));
          ['B_1', 'B_2', 'B_3'].forEach((lab, i) => T.tex(`\\beta_${i + 1}`, firstMid(tb, tl, i), be[i], { color: 'orange', dy: -15, dx: 12, size: 13 }));
          // the two-component level sets, along the bottom of the top panel
          v.legend([['blue', '$s$; below: the part $s$ of $s+t$', { area: true }], ['orange', '$t$; below: the part $t$ of $s+t$', { area: true }], ['muted', 'cuts of the refinement $\\{E_{ij}\\}$', { dash: true }]]);
          st = { Is, It, n: cuts.length - 1, al, be };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$\\int(s+t)=\\sum_{i,j}(\\alpha_i+\\beta_j)\\,\\mu(E_{ij})=${v.fix(s.Is + s.It, 4)}$ $=\\ \\int s+\\int t=${v.fix(s.Is, 4)}+${v.fix(s.It, 4)}$ (${s.n} nonempty cells $E_{ij}$).`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.26
    {
      num: '1.26',
      kind: 'Theorem',
      name: "Lebesgue's monotone convergence theorem",
      statement: String.raw`Let $\{f_n\}$ be a sequence of measurable functions on $X$ such that
(a) $0\le f_1(x)\le f_2(x)\le\cdots\le\infty$ for every $x\in X$, and
(b) $f_n(x)\to f(x)$ as $n\to\infty$, for every $x\in X$.
Then $f$ is measurable, and $\int_X f_n\,d\mu\to\int_X f\,d\mu$ as $n\to\infty$.`,
      idea: String.raw`$f$ is measurable by 1.14, and $\int f_n$ increases to some $\alpha\le\int f$. For the reverse, fix a simple $0\le s\le f$ and $0<c<1$, and let $E_n=\{f_n\ge cs\}$. The $E_n$ increase to $X$, so by 1.25 and 1.19(d), $\int f_n\ge\int_{E_n}f_n\ge c\int_{E_n}s\to c\int s$. Hence $\alpha\ge c\int s$; let $c\to1$ and take the supremum over $s$.`,
      caption: String.raw`Slide $n$: the blue function $f_n$ rises toward the green limit $f$, and the bars $\int f_n$ climb to $\int f$ (dashed). In the last example the sequence is not increasing — a bump of area $1$ slides into $0$ and grows taller — so $f_n\to0$ pointwise while $\int f_n=1$ for every $n$.`,
      deps: ['rca-1.14', 'rca-1.23', 'rca-1.19', 'rca-1.24', 'rca-1.25'],
      see: ['pma-11.28'],
      tags: ['convergence theorems', 'integral'],
      viz(v) {
        const M = v.M, NB = 30;
        const fS = (x) => 1.25 + 0.75 * Math.sin(2 * Math.PI * x + 0.5) + 0.3 * Math.cos(11 * x);
        const sN = (n, x) => { const y = fS(x); return y >= n ? n : Math.floor(y * 2 ** n) / 2 ** n; };
        const EX = {
          cap: { label: '$\\min(f,n)$, $f=\\frac{1}{2\\sqrt x}$', fn: (n, x) => Math.min(0.5 / Math.sqrt(x), n), lim: (x) => 0.5 / Math.sqrt(x), I: (n) => 1 - 1 / (4 * n), Il: 1, y: [-0.1, 5.2] },
          root: { label: '$x^{1/n}$', fn: (n, x) => x ** (1 / n), lim: (x) => (x > 0 ? 1 : 0), I: (n) => n / (n + 1), Il: 1, y: [-0.06, 1.25] },
          simple: { label: 'simple $s_n\\uparrow f$ (1.17)', fn: (n, x) => sN(n, x), lim: fS, I: null, Il: null, y: [-0.06, 2.6] },
          bad: { label: 'not increasing: $n\\chi_{(1/n,\\,2/n)}$', fn: (n, x) => (x > 1 / n && x < 2 / n ? n : 0), lim: () => 0, I: () => 1, Il: 0, y: [-0.3, 8.5], bad: true },
        };
        const which = v.select('', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'cap');
        const nS = v.slider('$n$', 1, NB, 3, { int: true });
        const T = v.stage({ x: [-0.02, 1.02], y: [-0.1, 5.2], height: 300, axes: 'box', full: true, xticks: [0, 0.2, 0.4, 0.6, 0.8, 1], title: ' ' });
        const B = v.stage({ x: [0, NB + 1], y: [0, 1.2], height: 170, axes: 'box', full: true, xticks: [1, 5, 10, 15, 20, 25, 30], title: '$\\int_X f_n\\,d\\mu$' });
        const cacheI = {};
        const integ = (key, n) => {
          const Q = EX[key]; if (Q.I) return Q.I(n);
          const k = key + n; if (cacheI[k] == null) cacheI[k] = mid((x) => Q.fn(n, x), 0, 1, 8000); return cacheI[k];
        };
        let st = null;
        v.render(() => {
          const Q = EX[which.value], n = nS.value;
          T.setView(null, Q.y);
          T.setTitle(Q.bad ? '$f_n$ is **not** increasing; $f_n\\to0$ pointwise' : '$0\\le f_1\\le f_2\\le\\cdots\\uparrow f$');
          const Il = Q.Il ?? (Q.Ilc ??= M.integrate(fS, 0, 1, 2000));
          for (let k = Math.max(1, n - 6); k < n; k++) T.fn((x) => Q.fn(k, x), { domain: [1e-4, 1], color: 'accent', width: 1, alpha: 0.15 + 0.1 * (k - n + 7), n: 1600 });
          T.fn(Q.lim, { domain: [1e-4, 1], color: 'green', width: 2, dash: [6, 4], n: 1600 });
          T.fn((x) => Q.fn(n, x), { domain: [1e-4, 1], color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.2, n: 2400 });
          const vals = M.range(NB, 1).map((k) => integ(which.value, k));
          const ymax = Math.max(Il, ...vals) * 1.18;
          B.setView(null, [-0.1 * ymax, ymax]);
          B.bars(vals, { color: (val, i) => (i + 1 === n ? 'accent' : 'faint'), fillAlpha: 0.8 });
          B.hline(Il, { color: Q.bad ? 'red' : 'green', width: 1.8, dash: [6, 4] });
          B.tex(`\\int f=${v.fix(Il, 3)}`, NB + 0.9, Il, { color: Q.bad ? 'red' : 'green', align: 'right', baseline: 'bottom', dy: -3, size: 13 });
          v.legend([['accent', '$f_n$', { area: true }], ['green', '$f=\\lim f_n$', { dash: true }]]);
          st = { n, In: vals[n - 1], Il, bad: Q.bad };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$\\int f_{${s.n}}=${v.fix(s.In, 4)}$, $\\;\\int f=${v.fix(s.Il, 4)}$` + (s.bad ? ' — the integrals do **not** converge to $\\int\\lim f_n$: hypothesis (a) fails.' : `, gap $${v.fix(s.Il - s.In, 4)}\\to0$.`);
        });
      },
    },
    // ------------------------------------------------------------------ 1.27
    {
      num: '1.27',
      kind: 'Theorem',
      name: 'Termwise integration of nonnegative series',
      statement: String.raw`If $f_n:X\to[0,\infty]$ is measurable for $n=1,2,3,\ldots$ and $f(x)=\sum_{n=1}^\infty f_n(x)$ for $x\in X$, then
$$\int_X f\,d\mu=\sum_{n=1}^\infty\int_X f_n\,d\mu.$$`,
      idea: String.raw`First two functions: approximate $f_1,f_2$ by increasing simple $s_i\uparrow f_1$, $t_i\uparrow f_2$ (1.17); then $s_i+t_i\uparrow f_1+f_2$, and 1.25 plus monotone convergence (1.26) give $\int(f_1+f_2)=\int f_1+\int f_2$. By induction this holds for finite sums, and the partial sums $g_N=\sum_{n\le N}f_n$ increase to $f$, so 1.26 once more finishes the proof.`,
      caption: String.raw`The coloured layers are $f_1,f_2,\dots,f_N$ stacked on top of each other; the outline is the partial sum $g_N$. Below, the bars are $\int f_n$ and the dots their partial sums, which converge to $\int f$ (dashed). In the second example $f=\sum f_n$ is unbounded near $0$, yet everything is finite and the two sides agree.`,
      deps: ['rca-1.17', 'rca-1.25', 'rca-1.26'],
      tags: ['series', 'integral'],
      viz(v) {
        const M = v.M, NB = 16;
        const EX = {
          geo: { label: '$f_n=x^{n-1}(1-x)$', f: (n, x) => x ** (n - 1) * (1 - x), I: (n) => 1 / (n * (n + 1)), Il: 1, y: [-0.05, 1.25], sum: (x) => (x < 1 ? 1 : 0) },
          spk: { label: '$f_n=2^{(n-1)/2}\\chi_{[0,\\,2^{1-n})}$', f: (n, x) => (x < 2 ** (1 - n) ? 2 ** ((n - 1) / 2) : 0), I: (n) => 2 ** ((1 - n) / 2), Il: 1 / (1 - Math.SQRT1_2), y: [-0.1, 7], sum: null },
          bmp: { label: 'bumps $f_n$ at $q_n$', f: (n, x) => (0.9 / n) * Math.exp(-(((x - ((n * 0.618034) % 1)) / 0.06) ** 2)), I: null, Il: null, y: [-0.05, 1.3], sum: null },
        };
        const which = v.select('', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'geo');
        const nS = v.slider('$N$', 1, NB, 5, { int: true });
        const T = v.stage({ x: [-0.02, 1.02], y: [-0.05, 1.25], height: 300, axes: 'box', full: true, xticks: [0, 0.2, 0.4, 0.6, 0.8, 1], title: 'layers $f_1,\\dots,f_N$ and the partial sum $g_N=\\sum_{n\\le N}f_n$' });
        const B = v.stage({ x: [0, NB + 1], y: [0, 1.2], height: 180, axes: 'box', full: true, xticks: M.range(NB, 1).filter((k) => k % 2 === 1 || k === NB), title: '$\\int f_n$ (bars) and $\\sum_{n\\le N}\\int f_n$ (dots)' });
        const cache = {};
        const In = (key, n) => { const Q = EX[key]; if (Q.I) return Q.I(n); const k = key + n; return cache[k] ??= M.integrate((x) => Q.f(n, x), 0, 1, 2000); };
        const IlOf = (key) => { const Q = EX[key]; if (Q.Il != null) return Q.Il; return cache[key + 'L'] ??= M.range(400, 1).reduce((s, n) => s + In(key, n), 0); };
        let st = null;
        v.render(() => {
          const Q = EX[which.value], N = nS.value;
          T.setView(null, [Q.y[1] * -0.08, Q.y[1]]);
          const cum = (k, x) => { let s = 0; for (let n = 1; n <= k; n++) s += Q.f(n, x); return s; };
          for (let n = 1; n <= N; n++) T.between((x) => cum(n, x), (x) => cum(n - 1, x), 0, 1, { fill: CYCLE[(n - 1) % CYCLE.length], fillAlpha: 0.5, n: 1200 });
          T.fn((x) => cum(N, x), { domain: [0, 1], color: 'ink', width: 2, n: 1500 });
          if (Q.sum) T.fn(Q.sum, { domain: [0, 0.999], color: 'green', width: 1.6, dash: [6, 4] });
          const vals = M.range(NB, 1).map((n) => In(which.value, n));
          const sums = M.partialSums((k) => vals[k], NB);
          const Il = IlOf(which.value);
          B.setView(null, [-0.1 * Il * 1.15, Il * 1.15]);
          B.bars(vals, { color: (val, i) => (i < N ? CYCLE[i % CYCLE.length] : 'faint'), fillAlpha: 0.7 });
          B.hline(Il, { color: 'green', width: 1.6, dash: [6, 4] });
          B.tex(`\\int f=${v.fix(Il, 4)}`, NB + 0.9, Il, { color: 'green', align: 'right', baseline: 'top', dy: 4, size: 13 });
          B.path(sums.slice(0, N).map((s, i) => [i + 1, s]), { color: 'ink', width: 1.4 });
          B.dots(sums.slice(0, N).map((s, i) => [i + 1, s]), { color: 'ink', r: 3.4 });
          v.legend([['ink', 'partial sums'], ['green', '$f=\\sum f_n$ and $\\int f$', { dash: true }]]);
          st = { N, SN: sums[N - 1], IgN: mid((x) => cum(N, x), 0, 1, 6000), Il };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$\\int g_{${s.N}}=${v.fix(s.IgN, 4)}=\\sum_{n\\le ${s.N}}\\int f_n=${v.fix(s.SN, 4)}$, increasing to $\\int f=\\sum_n\\int f_n=${v.fix(s.Il, 4)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.27a
    {
      num: '1.27a',
      kind: 'Corollary',
      name: 'Double series with nonnegative terms',
      statement: String.raw`If $a_{ij}\ge0$ for $i,j=1,2,3,\ldots$, then
$$\sum_{i=1}^\infty\sum_{j=1}^\infty a_{ij}=\sum_{j=1}^\infty\sum_{i=1}^\infty a_{ij}.$$`,
      idea: String.raw`Apply Theorem 1.27 to counting measure on $X=\{1,2,3,\ldots\}$ with $f_i(j)=a_{ij}$: integration with respect to counting measure is summation, so "integral of the sum = sum of the integrals" is exactly the interchange of the two summations.`,
      caption: String.raw`The matrix $(a_{ij})$, with squares of area proportional to $|a_{ij}|$ (blue positive, red negative); the right column holds the full row sums $\sum_j a_{ij}$ and the bottom row the full column sums $\sum_i a_{ij}$. Click a cell to highlight its row and column. For nonnegative terms both iterated sums agree; the signed example ($1$ on the diagonal, $-1$ just right of it) gives $0$ one way and $1$ the other.`,
      deps: ['rca-1.27'],
      tags: ['series'],
      viz(v) {
        const M = v.M, N = 8, BIG = 3000;
        const EX = {
          geo: { label: '$a_{ij}=6\\cdot2^{-i}3^{-j}$', a: (i, j) => 6 / (2 ** i * 3 ** j), row: (i) => 3 / 2 ** i, col: (j) => 6 / 3 ** j, R: 3, C: 3 },
          cube: { label: '$a_{ij}=(i+j)^{-3}$', a: (i, j) => 1 / (i + j) ** 3, R: 0.4428771636, C: 0.4428771636 },
          bad: { label: 'signed: $a_{ii}=1$, $a_{i,i+1}=-1$', a: (i, j) => (i === j ? 1 : j === i + 1 ? -1 : 0), row: () => 0, col: (j) => (j === 1 ? 1 : 0), R: 0, C: 1 },
        };
        const which = v.select('', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'geo');
        const S = v.stage({ x: [0.35, N + 3.4], y: [-0.75, N + 1.25], equal: true, axes: false, height: 410 });
        let sel = [2, 3];
        S.onClick((x, y) => { const j = Math.round(x), i = Math.round(N + 1 - y); if (i >= 1 && i <= N && j >= 1 && j <= N) sel = [i, j]; });
        const tail = {};
        const rowSum = (key, i) => { const Q = EX[key]; if (Q.row) return Q.row(i); return tail[key + 'r' + i] ??= M.range(BIG, 1).reduce((s, j) => s + Q.a(i, j), 0) + 1 / (2 * (i + BIG + 0.5) ** 2); };
        const colSum = (key, j) => { const Q = EX[key]; if (Q.col) return Q.col(j); return tail[key + 'c' + j] ??= M.range(BIG, 1).reduce((s, i) => s + Q.a(i, j), 0) + 1 / (2 * (j + BIG + 0.5) ** 2); };
        const total = (key, f) => tail[key + f.name] ??= M.range(BIG, 1).reduce((s, k) => s + f(key, k), 0);
        let st = null;
        v.render(() => {
          const Q = EX[which.value];
          let amax = 0; for (let i = 1; i <= N; i++) for (let j = 1; j <= N; j++) amax = Math.max(amax, Math.abs(Q.a(i, j)));
          const [si, sj] = sel;
          S.rect(0.5, N + 1 - si - 0.5, N + 0.5, N + 1 - si + 0.5, { fill: 'gold', fillAlpha: 0.12, stroke: false });
          S.rect(sj - 0.5, 0.5, sj + 0.5, N + 0.5, { fill: 'gold', fillAlpha: 0.12, stroke: false });
          for (let i = 1; i <= N; i++) for (let j = 1; j <= N; j++) {
            const a = Q.a(i, j), x = j, y = N + 1 - i;
            S.rect(x - 0.48, y - 0.48, x + 0.48, y + 0.48, { color: 'grid', width: 1 });
            if (a === 0) continue;
            const h = 0.46 * Math.sqrt(Math.abs(a) / amax);
            S.rect(x - h, y - h, x + h, y + h, { fill: a > 0 ? 'blue' : 'red', fillAlpha: 0.75, stroke: false });
          }
          S.text('⋯', N + 0.85, N / 2 + 0.5, { color: 'muted', size: 16, align: 'center' });
          S.text('⋮', N / 2 + 0.5, 0.12, { color: 'muted', size: 16, align: 'center' });
          for (let i = 1; i <= N; i++) S.text(v.fmt(rowSum(which.value, i), 3), N + 2.35, N + 1 - i, { color: i === si ? 'ink' : 'muted', size: 12, align: 'center', weight: i === si ? 700 : 500 });
          for (let j = 1; j <= N; j++) S.text(v.fmt(colSum(which.value, j), 2), j, -0.45, { color: j === sj ? 'ink' : 'muted', size: 11, align: 'center', weight: j === sj ? 700 : 500 });
          S.tex('\\textstyle\\sum_j a_{ij}', N + 2.35, N + 0.62, { color: 'muted', size: 13, baseline: 'bottom' });
          S.tex('\\textstyle\\sum_i a_{ij}', 0.45, -0.45, { color: 'muted', size: 13, align: 'right' });
          S.tex('i\\downarrow\\quad j\\rightarrow', 0.5, N + 0.55, { color: 'muted', size: 12, align: 'left', baseline: 'bottom' });
          const R = Q.R ?? total(which.value, rowSum), C = Q.C ?? total(which.value, colSum);
          st = { R, C, bad: which.value === 'bad', si, sj, a: Q.a(si, sj), r: rowSum(which.value, si), c: colSum(which.value, sj) };
          v.legend([['blue', '$a_{ij}>0$', { area: true }], ['red', '$a_{ij}<0$', { area: true }], ['gold', 'selected row and column', { area: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$a_{${s.si}${s.sj}}=${v.fmt(s.a, 4)}$, row sum $${v.fmt(s.r, 5)}$, column sum $${v.fmt(s.c, 5)}$. $\\quad\\sum_i\\sum_j a_{ij}=${v.fmt(s.R, 6)}$, $\\;\\sum_j\\sum_i a_{ij}=${v.fmt(s.C, 6)}$` + (s.bad ? ' — different: the terms are not $\\ge0$.' : ' — equal.');
        });
      },
    },
    // ------------------------------------------------------------------ 1.28
    {
      num: '1.28',
      kind: 'Lemma',
      name: "Fatou's lemma",
      statement: String.raw`If $f_n:X\to[0,\infty]$ is measurable for each positive integer $n$, then
$$\int_X\Big(\liminf_{n\to\infty}f_n\Big)\,d\mu\ \le\ \liminf_{n\to\infty}\int_X f_n\,d\mu .$$`,
      idea: String.raw`Put $g_k=\inf_{i\ge k}f_i$. Then $g_k\le f_k$, so $\int g_k\le\int f_k$; and $0\le g_1\le g_2\le\cdots$ with $g_k\to\liminf f_n$. By monotone convergence (1.26) the left side is $\lim\int g_k$, which is at most $\liminf\int f_k$. Inequality can be strict: mass can concentrate or oscillate away without leaving a trace in the pointwise $\liminf$.`,
      caption: String.raw`Each $f_n$ is a shrinking multiple $(1-\frac{1}{2n})\varphi$ of a fixed profile plus a bump of mass $\frac12$ (or $0.3$). Green: $g_n=\inf_{k\ge n}f_k$, increasing to $\liminf f_n=\varphi$. Below, the blue dots $\int f_n$ and green dots $\int g_n$; the dashed lines are $\liminf\int f_n$ and $\int\liminf f_n$, and the gap between them is the mass Fatou allows to be lost. The travelling "typewriter" bump loses nothing — equality.`,
      deps: ['rca-1.26', 'rca-1.14', 'rca-1.24'],
      see: ['pma-11.31'],
      tags: ['convergence theorems', 'Fatou'],
      viz(v) {
        const M = v.M, NB = 40;
        const phi = (x) => 0.55 + 0.25 * Math.sin(2 * Math.PI * x + 1);
        const typ = (n) => { const k = Math.floor(Math.log2(n)), j = n - 2 ** k; return [j / 2 ** k, (j + 1) / 2 ** k]; };
        const EX = {
          conc: { label: 'concentrating spike', bump: (n, x) => (x > 0 && x < 1 / n ? n / 2 : 0), mass: () => 0.5, lost: 0.5 },
          osc: { label: 'oscillating halves', bump: (n, x) => ((n % 2 === 0) === (x < 0.5) ? 0.6 : 0), mass: () => 0.3, lost: 0.3 },
          typ: { label: 'typewriter (equality)', bump: (n, x) => { const [a, b] = typ(n); return x >= a && x < b ? 0.8 : 0; }, mass: (n) => 0.8 * (typ(n)[1] - typ(n)[0]), lost: 0 },
        };
        const which = v.select('', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'conc');
        const nS = v.slider('$n$', 1, NB, 5, { int: true });
        const T = v.stage({ x: [-0.02, 1.02], y: [-0.05, 2.6], height: 300, axes: 'box', full: true, xticks: [0, 0.2, 0.4, 0.6, 0.8, 1], title: ' ' });
        const B = v.stage({ x: [0, NB + 1], y: [0, 1.25], height: 190, axes: 'box', full: true, xticks: [1, 5, 10, 15, 20, 25, 30, 35, 40], title: '$\\int f_n$ (blue) and $\\int g_n$ (green)' });
        const cacheG = {};
        let st = null;
        v.render(() => {
          const key = which.value, Q = EX[key], n = nS.value;
          const fN = (k, x) => (1 - 0.5 / k) * phi(x) + Q.bump(k, x);
          // g_n(x) = f_k(x) at the first k >= n where the bump misses x (later terms are larger)
          const gN = (k0, x) => { let best = Infinity; for (let k = k0; k < k0 + 600; k++) { const val = fN(k, x); if (val < best) best = val; if (Q.bump(k, x) === 0) break; } return best; };
          T.setTitle(`$f_n=(1-\\frac{1}{2n})\\varphi+$ bump; $\\;g_n=\\inf_{k\\ge n}f_k\\uparrow\\liminf f_n=\\varphi$`);
          T.fn((x) => gN(n, x), { domain: [0, 1], color: 'green', width: 2, fill: 'green', fillAlpha: 0.22, n: 1200 });
          T.fn(phi, { domain: [0, 1], color: 'green', width: 1.4, dash: [6, 4] });
          let peak = 0; for (let i = 1; i < 2000; i++) peak = Math.max(peak, fN(n, i / 2000));
          const ymax = Math.min(6.5, Math.max(2.6, peak * 1.08));
          T.setView(null, [-0.05 * ymax, ymax]);
          T.fn((x) => Math.min(fN(n, x), ymax * 0.985), { domain: [0, 1], color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.1, connect: true, n: 2400 });
          if (peak > ymax) { T.arrow(0.5 / n, ymax * 0.8, 0.5 / n, ymax * 0.99, { color: 'accent', head: 8 }); T.tex(`\\text{height } ${v.fix(peak - (1 - 0.5 / n) * 0.8, 1)}\\uparrow`, 1 / n, ymax * 0.9, { color: 'accent', align: 'left', dx: 6, size: 13 }); }
          const If = M.range(NB, 1).map((k) => (1 - 0.5 / k) * 0.55 + Q.mass(k));
          const Ig = M.range(NB, 1).map((k) => (cacheG[key + k] ??= mid((x) => gN(k, x), 0, 1, 1500)));
          const liminfI = 0.55 + Q.lost, Ilim = 0.55;
          B.setView(null, [-0.12, 1.25]);
          B.hline(liminfI, { color: 'accent', width: 1.4, dash: [6, 4] });
          B.hline(Ilim, { color: 'green', width: 1.4, dash: [6, 4] });
          if (Q.lost > 0) { B.measure(NB - 2, Ilim, NB - 2, liminfI, null, { color: 'red' }); B.text('lost mass', NB - 2.6, (Ilim + liminfI) / 2, { color: 'red', size: 12, align: 'right' }); }
          B.path(If.map((y, i) => [i + 1, y]), { color: 'accent', width: 1.2, alpha: 0.6 });
          B.dots(If.map((y, i) => [i + 1, y]), { color: 'accent', r: 3.2 });
          B.dots(Ig.map((y, i) => [i + 1, y]), { color: 'green', r: 3.2 });
          B.dot(n, If[n - 1], { color: 'accent', r: 6, hollow: true, width: 2 });
          B.dot(n, Ig[n - 1], { color: 'green', r: 6, hollow: true, width: 2 });
          v.legend([['accent', '$f_n$; $\\liminf\\int f_n$ (dashed)'], ['green', '$g_n$; $\\int\\liminf f_n$ (dashed)', { area: true }]]);
          st = { n, If: If[n - 1], Ig: Ig[n - 1], liminfI, Ilim };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const strict = s.liminfI - s.Ilim > 1e-9;
          return `$\\int f_{${s.n}}=${v.fix(s.If, 4)}$, $\\int g_{${s.n}}=${v.fix(s.Ig, 4)}$. $\\quad\\int\\liminf f_n=${v.fix(s.Ilim, 3)}\\ ${strict ? '<' : '='}\\ \\liminf\\int f_n=${v.fix(s.liminfI, 3)}$` + (strict ? ' — strict.' : ' — equality.');
        });
      },
    },
    // ------------------------------------------------------------------ 1.29
    {
      num: '1.29',
      kind: 'Theorem',
      name: 'Measures with a density: dφ = f dμ',
      statement: String.raw`Suppose $f:X\to[0,\infty]$ is measurable and $\varphi(E)=\int_E f\,d\mu$ for $E\in\mathfrak M$. Then $\varphi$ is a measure on $\mathfrak M$, and
$$\int_X g\,d\varphi=\int_X gf\,d\mu$$
for every measurable $g$ on $X$ with values in $[0,\infty]$. One writes $d\varphi=f\,d\mu$.`,
      idea: String.raw`If $E=\bigcup E_j$ disjointly, then $\chi_Ef=\sum_j\chi_{E_j}f$, and Theorem 1.27 gives $\varphi(E)=\sum_j\varphi(E_j)$. The formula holds for $g=\chi_E$ by definition, hence for simple $g$ by linearity; for general $g$ take simple $s_n\uparrow g$ (1.17), so that $s_nf\uparrow gf$ (1.22), and apply monotone convergence (1.26) on both sides.`,
      caption: String.raw`Drag the three handles to shape the density $f$ (top). Bottom left: $gf$ against $dx$. Bottom right: $g$ against the stretched axis $u=\varphi([0,x])$, on which every set $E$ has length $\varphi(E)$. The two shaded areas are $\int gf\,d\mu$ and $\int g\,d\varphi$ — always equal. The faint verticals at $x=0.1,0.2,\dots$ show how $\varphi$ stretches the axis where $f$ is large.`,
      deps: ['rca-1.27', 'rca-1.26', 'rca-1.17', 'rca-1.22'],
      see: ['rca-6.10'],
      tags: ['density', 'integral'],
      viz(v) {
        const M = v.M;
        const G = {
          wave: { label: '$g=1+\\cos 6x$', g: (x) => 1 + Math.cos(6 * x) },
          sq: { label: '$g=x^2$', g: (x) => x * x },
          ind: { label: '$g=\\chi_{[0.3,0.6)}$', g: (x) => (x >= 0.3 && x < 0.6 ? 1 : 0) },
        };
        const which = v.select('$g$', Object.entries(G).map(([value, o]) => ({ value, label: o.label })), 'wave');
        const A = v.stage({ x: [-0.02, 1.02], y: [-0.05, 3.2], height: 170, axes: 'box', full: true, title: 'the density $f$ (drag the handles); $\\mu$ = length on $X=[0,1]$' });
        const B = v.stage({ x: [-0.02, 1.02], y: [-0.05, 4.2], height: 250, axes: 'box', title: '$\\int_X gf\\,d\\mu$: $gf$ against $x$' });
        const C = v.stage({ x: [-0.05, 3], y: [-0.05, 2.2], height: 250, axes: 'box', title: '$\\int_X g\\,d\\varphi$: $g$ against $u=\\varphi([0,x])$' });
        const KX = [0.15, 0.5, 0.85];
        const H = [1.8, 0.4, 1.1].map((y, i) => A.handle(KX[i], y, { color: 'orange', constrain: (x, yy) => [KX[i], M.clamp(yy, 0, 3)] }));
        const f = (x) => 0.12 + H.reduce((s, h, i) => s + h.y * Math.exp(-(((x - KX[i]) / 0.17) ** 2)), 0);
        let st = null;
        v.render(() => {
          const g = G[which.value].g;
          const N = 1200, xs = M.linspace(0, 1, N + 1);
          const U = [0]; for (let i = 1; i <= N; i++) U.push(U[i - 1] + (f(xs[i - 1]) + f(xs[i])) / 2 / N);
          const phiX = U[N];
          A.fn(f, { domain: [0, 1], color: 'orange', width: 2.4, fill: 'orange', fillAlpha: 0.15 });
          // left: g f against x
          const gf = (x) => g(x) * f(x);
          const ymaxB = Math.max(1, ...xs.map(gf)) * 1.12;
          B.setView(null, [-0.03 * ymaxB, ymaxB]);
          B.fn(gf, { domain: [0, 1], color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.22, n: 1600 });
          // right: g against u
          C.setView([-0.02 * phiX, phiX * 1.02], [-0.05, 2.2]);
          C.path(xs.map((x, i) => [U[i], g(x)]), { color: 'accent', width: 2.2 });
          C.path(xs.map((x, i) => [U[i], g(x)]).concat([[phiX, 0], [0, 0]]), { fill: 'accent', fillAlpha: 0.22, stroke: false, close: true });
          for (let k = 1; k < 10; k++) { const x = k / 10, i = Math.round(x * N); B.vline(x, { color: 'muted', width: 0.8, alpha: 0.35 }); C.vline(U[i], { color: 'muted', width: 0.8, alpha: 0.35 }); A.vline(x, { color: 'muted', width: 0.8, alpha: 0.25 }); }
          // ∫ g dφ by the trapezoid rule in u, ∫ g f dμ by Simpson in x
          let Iphi = 0; for (let i = 1; i <= N; i++) Iphi += (g(xs[i - 1]) + g(xs[i])) / 2 * (U[i] - U[i - 1]);
          const Imu = mid(gf, 0, 1, 6000);
          v.legend([['orange', 'density $f$', { area: true }], ['accent', 'the two areas', { area: true }], ['muted', 'images of $x=0.1,\\dots,0.9$']]);
          st = { Iphi, Imu, phiX };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$\\varphi(X)=${v.fix(s.phiX, 4)}$. $\\quad\\int_X gf\\,d\\mu=${v.fix(s.Imu, 4)}$, $\\;\\int_X g\\,d\\varphi=${v.fix(s.Iphi, 4)}$.`;
        });
      },
    },
  ],
};
