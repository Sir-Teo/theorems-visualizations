// Rudin, Principles of Mathematical Analysis — Chapter 7: Sequences and Series of Functions
// This file: 7.1–7.11 (pointwise and uniform convergence, Cauchy criterion, M-test, interchange of limits).
// Part file ch07-a2.js: 7.12–7.17 (7.18 onward: ch07-b*.js).

/** Draw a limit function that may jump: pieces between the jump points, hollow one-sided limits, filled value. */
function drawLimit(s, F, st = {}) {
  const col = st.color || 'green';
  const J = F.jumps || [];
  const cuts = [F.a, ...J, F.b];
  const eta = (F.b - F.a) * 1e-6;
  for (let i = 0; i + 1 < cuts.length; i++) {
    const lo = cuts[i] + (i > 0 ? eta : 0), hi = cuts[i + 1] - (i + 1 < cuts.length - 1 ? eta : 0);
    s.fn(F.lim, { domain: [lo, hi], color: col, width: st.width ?? 2.6, dash: st.dash });
  }
  for (const j of J) {
    if (j > F.a) s.dot(j, F.lim(j - eta), { hollow: true, color: col, r: 4.5, width: 2 });
    if (j < F.b) s.dot(j, F.lim(j + eta), { hollow: true, color: col, r: 4.5, width: 2 });
    s.dot(j, F.lim(j), { color: col, r: 4.5 });
  }
}

/** Unicode subscript digits for canvas labels. */
const sub = (k) => String(k).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[+d]);

/** Draw y = g(x) on [a,b], blue where |g - lim| <= eps and red where it escapes. Returns the escaping fraction. */
function drawInOut(s, g, lim, a, b, eps, st = {}) {
  const n = st.n || 900; const inP = [], outP = []; let prev = null, prevPt = null, bad = 0;
  for (let i = 0; i <= n; i++) {
    const x = a + (b - a) * i / n, y = g(x), ok = Math.abs(y - lim(x)) <= eps, p = [x, y];
    if (!ok) bad++;
    if (prev !== null && ok !== prev) { (prev ? inP : outP).push(p, null); (ok ? inP : outP).push(prevPt); }
    (ok ? inP : outP).push(p);
    prev = ok; prevPt = p;
  }
  s.path(inP, { color: st.color || 'accent', width: st.width ?? 2.6 });
  s.path(outP, { color: 'red', width: (st.width ?? 2.6) + 0.6 });
  return bad / (n + 1);
}


export default {
  collection: 'pma',
  chapter: 7,
  title: 'Sequences and Series of Functions',
  summary: String.raw`When does a limit of functions inherit the good properties of the functions themselves? Pointwise limits can destroy continuity, integrals and derivatives, so Rudin introduces uniform convergence — with its Cauchy criterion and the Weierstrass M-test — and shows that it preserves continuity (making $\mathscr C(X)$ a complete metric space under the sup norm), commutes with integration, and commutes with differentiation when the derivatives converge uniformly; a uniformly convergent sum of zigzags gives a continuous, nowhere differentiable function. The chapter closes with equicontinuity and the Arzelà–Ascoli theorem, and with the Weierstrass approximation theorem and Stone's generalization of it.`,
  items: [
    // ------------------------------------------------------------------ 7.1
    {
      num: '7.1',
      kind: 'Definition',
      name: 'Pointwise convergence and the limit function',
      statement: String.raw`Let $\{f_n\}$ be a sequence of real or complex functions on a set $E$. If for every $x\in E$ the sequence of numbers $\{f_n(x)\}$ converges, then
$$f(x)=\lim_{n\to\infty}f_n(x)\qquad(x\in E)$$
defines a function $f$ on $E$, called the *limit* of $\{f_n\}$; one says that $f_n\to f$ *pointwise* on $E$. Likewise, if $\sum_n f_n(x)$ converges for every $x\in E$, the function $f(x)=\sum_{n=1}^\infty f_n(x)$ is called the *sum* of the series $\sum f_n$.`,
      idea: String.raw`Pointwise convergence is just a family of numerical limits, one for each $x$, so the index $N$ that brings $f_n(x)$ within $\eps$ of $f(x)$ may depend on $x$ as well as on $\eps$. Rudin's Examples 7.2–7.6 show what can then go wrong: a pointwise limit of continuous functions can be discontinuous, and integrals and derivatives need not pass to the limit. The cure, uniform convergence (7.7), demands a single $N$ for all $x$.`,
      caption: String.raw`Drag $x_0$ along the limit curve. Left: $f_1,\dots,f_n$ and the limit $f$. Right: the numerical sequence $f_k(x_0)$ and the first index $N(x_0,\eps)$ after which it stays in the $\eps$-band. Bottom: $N(x,\eps)$ at every $x$ — always finite, but bounded only for $(1+x/n)^n$.`,
      deps: ['pma-3.1', 'pma-3.21'],
      tags: ['pointwise convergence', 'sequences of functions'],
      viz(v) {
        const M = v.M;
        const ustar = (e) => M.bisect((u) => u * Math.exp(1 - u) - e, 1, 80); // root u > 1 of u e^{1-u} = ε
        const S73 = (n, x) => (x === 0 ? 0 : (1 + x * x) * (1 - Math.pow(1 / (1 + x * x), n + 1)));
        const FAM = {
          exp: {
            label: '$(1+x/n)^n$ on $[0,2]$', a: 0, b: 2, y: [-0.7, 8], x0: 1.4,
            f: (n, x) => Math.pow(1 + x / n, n), lim: (x) => Math.exp(x),
            N: (x, e) => { // error e^x − (1+x/n)^n decreases in n
              const err = (n) => Math.exp(x) - Math.pow(1 + x / n, n);
              if (err(1) <= e) return 1;
              let lo = 1, hi = 2; while (err(hi) > e) { lo = hi; hi *= 2; }
              while (hi - lo > 1) { const m = (lo + hi) >> 1; if (err(m) > e) lo = m; else hi = m; }
              return hi;
            },
          },
          pow: {
            label: '$x^n$ on $[0,1]$', a: 0, b: 1, y: [-0.12, 1.12], x0: 0.8, jumps: [1], bad: 1,
            f: (n, x) => Math.pow(x, n), lim: (x) => (x < 1 ? 0 : 1),
            N: (x, e) => (x <= e || x >= 1 ? 1 : Math.max(1, Math.ceil(Math.log(e) / Math.log(x) - 1e-9))),
          },
          bump: {
            label: '$nx\\,e^{1-nx}$ on $[0,1]$', a: 0, b: 1, y: [-0.12, 1.12], x0: 0.15, bad: 0,
            f: (n, x) => n * x * Math.exp(1 - n * x), lim: () => 0,
            N: (x, e) => {
              if (x <= 0 || e >= 1) return 1;
              const n0 = Math.max(1, Math.ceil(ustar(e) / x - 1e-9));
              return n0 >= 2 && (n0 - 1) * x * Math.exp(1 - (n0 - 1) * x) > e ? n0 : 1;
            },
          },
          ser: {
            label: '$\\sum_{k=0}^{n}\\frac{x^2}{(1+x^2)^k}$ on $[-1,1]$', a: -1, b: 1, y: [-0.25, 2.3], x0: 0.35, jumps: [0], bad: 0,
            f: S73, lim: (x) => (x === 0 ? 0 : 1 + x * x),
            N: (x, e) => {
              if (x === 0 || e >= 1 + x * x) return 1;
              const q = 1 / (1 + x * x);
              return Math.max(1, Math.ceil(Math.log(e / (1 + x * x)) / Math.log(q) - 1 - 1e-9));
            },
          },
        };
        const which = v.select('', Object.entries(FAM).map(([value, F]) => ({ value, label: F.label })), 'pow');
        const nS = v.slider('$n$', 1, 40, 8, { int: true });
        const eS = v.slider('$\\varepsilon$', 0.02, 0.5, 0.12, { step: 0.01 });
        const L = v.stage({ x: [-0.05, 1.05], y: [-0.12, 1.12], height: 300, title: 'graphs of $f_1,\\dots,f_n$ and the limit $f$' });
        const R = v.stage({ x: [-3, 41], y: [-0.12, 1.12], height: 300, axes: 'box', xticks: [1, 10, 20, 30, 40], title: 'the numbers $f_k(x_0)$ against $k$' });
        const B = v.stage({ x: [-0.05, 1.05], y: [-0.85, 4.75], height: 170, full: true, axes: 'box', yticks: [[0, '1'], [1, '10'], [2, '100'], [3, '1000']], title: 'the index $N(x,\\varepsilon)$ needed at each point $x$ (log scale)' });
        const h = L.handle(0.8, 0, { color: 'gold', constrain: (x) => { const F = FAM[which.value]; const xx = M.clamp(x, F.a, F.b); return [xx, F.lim(xx)]; } });
        let last = null, info = {};
        v.legend([['accent', '$f_n$'], ['faint', '$f_1,\\dots,f_{n-1}$'], ['green', 'limit $f$'], ['gold', '$f_k(x_0)$', { dot: true }], ['green', '$f(x_0)$', { dash: true }], ['accent', '$\\varepsilon$-band about $f(x_0)$', { area: true }]]);
        v.render(() => {
          const F = FAM[which.value], n = nS.value, e = eS.value;
          if (last !== which.value) {
            last = which.value; const pad = (F.b - F.a) * 0.04;
            L.setView([F.a - pad, F.b + pad], F.y); const sp = F.y[1] - F.y[0]; R.setView(null, [F.y[0] - 0.06 * sp, F.y[1]]); B.setView([F.a - 2.2 * pad, F.b + pad], null);
            h.x = F.x0;
          }
          h.y = F.lim(h.x);
          const x0 = h.x, fx = F.lim(x0);
          // ---- left: the graphs
          for (let k = 1; k < n; k++) L.fn((x) => F.f(k, x), { domain: [F.a, F.b], color: 'accent', width: 1, alpha: 0.1 + 0.35 * k / n });
          L.fn((x) => F.f(n, x), { domain: [F.a, F.b], color: 'accent', width: 2.6 });
          drawLimit(L, F);
          L.vline(x0, { color: 'gold', dash: [4, 4], width: 1.2 });
          const col = []; for (let k = 1; k <= n; k++) col.push([x0, F.f(k, x0)]);
          L.dots(col, { color: 'gold', r: 3.2 });
          L.tex('x_0', x0, L.bounds.y[1], { color: 'gold', baseline: 'top', align: 'left', dy: 6, dx: 6 });
          // ---- right: the sequence f_k(x0)
          const N = F.N(x0, e);
          R.hband(fx - e, fx + e, { color: 'accent', alpha: 0.12, edges: true });
          R.hline(fx, { color: 'green', width: 1.6, dash: [6, 4] });
                    if (N <= 40) {
            R.vband(N - 0.5, 40.5, { color: 'green', alpha: 0.07 });
            R.vline(N - 0.5, { color: 'orange', width: 1.6 });
            R.tex(`N(x_0,\\varepsilon)=${N}`, N - 0.5, R.bounds.y[1], { color: 'orange', align: N > 28 ? 'right' : 'left', baseline: 'top', dx: N > 28 ? -5 : 5, dy: 4, size: 14 });
          } else {
            R.tex(`N(x_0,\\varepsilon)=${N}\\;\\to`, 40.5, R.bounds.y[1], { color: 'orange', align: 'right', baseline: 'top', dx: -4, dy: 4, size: 14 });
          }
          for (let k = 1; k <= 40; k++) {
            const y = F.f(k, x0), ins = Math.abs(y - fx) <= e;
            R.dot(k, y, { r: k === n ? 5.5 : 3.3, color: ins ? 'accent' : 'red' });
          }
          R.dot(n, F.f(n, x0), { r: 7.5, hollow: true, color: 'gold', width: 2 });
          // ---- bottom: N(x, eps) across the domain
          const xs = M.linspace(F.a, F.b, 500);
          if (F.bad != null) { for (let k = 2; k <= 9; k++) { const d = Math.pow(10, -k); if (F.bad - d >= F.a) xs.push(F.bad - d); if (F.bad + d <= F.b) xs.push(F.bad + d); } xs.sort((p, q) => p - q); }
          const top = 4.5; let supN = 0;
          const pts = xs.map((x) => { const Nx = F.N(x, e); supN = Math.max(supN, Nx); return [x, Math.min(top, Math.log10(Nx))]; });
          B.path(pts.concat([[F.b, 0], [F.a, 0]]), { fill: 'orange', fillAlpha: 0.13, stroke: false, close: true });
          B.path(pts, { color: 'orange', width: 2 });
          B.dot(x0, Math.min(top, Math.log10(N)), { color: 'gold', r: 5 });
          if (F.bad != null) { B.arrow(F.bad, 3.6, F.bad, 4.7, { color: 'red', head: 8, width: 1.6 }); B.tex('\\infty', F.bad, 4.2, { color: 'red', align: F.bad > F.a ? 'right' : 'left', dx: F.bad > F.a ? -6 : 6, size: 15 }); }
          const bounded = which.value === 'exp';
          if (bounded) B.hline(Math.log10(supN), { color: 'green', dash: [5, 4], width: 1.4 });
          B.corner(bounded ? `max N(x, ε) = ${supN}: one index serves every x` : 'N(x, ε) is unbounded: no single index works', F.bad != null && F.bad > (F.a + F.b) / 2 ? 'tl' : 'tr', { color: bounded ? 'green' : 'red', weight: 600 });
          info = { F, n, e, x0, fx, N, supN, bounded };
        });
        v.readout(() => {
          const { F, n, x0, fx, N, supN, bounded } = info; if (!F) return '';
          return `$x_0 = ${v.fix(x0, 3)}$: $\\;f_{${n}}(x_0) = ${v.fix(F.f(n, x0), 4)}$, $\\;f(x_0) = ${v.fix(fx, 4)}$, $\\;N(x_0,\\varepsilon) = ${N}$. ` +
            (bounded ? `Here $\\sup_x N(x,\\varepsilon) = ${supN} < \\infty$.` : `Every $N(x,\\varepsilon)$ is finite, yet $\\sup_x N(x,\\varepsilon)=\\infty$: the convergence is pointwise only.`);
        });
      },
    },

    // ------------------------------------------------------------------ 7.7
    {
      num: '7.7',
      kind: 'Definition',
      name: 'Uniform convergence',
      statement: String.raw`A sequence of functions $\{f_n\}$ *converges uniformly* on $E$ to a function $f$ if for every $\eps>0$ there is an integer $N$ such that
$$|f_n(x)-f(x)|\le\eps\qquad\text{for all } n\ge N \text{ and all } x\in E .$$
A series $\sum f_n$ converges uniformly on $E$ if the sequence of its partial sums $s_n=\sum_{k=1}^n f_k$ converges uniformly on $E$.`,
      idea: String.raw`Uniform convergence implies pointwise convergence, but not conversely: in 7.1 the index $N$ may depend on $x$, while here one $N$ must serve every point of $E$ at once. Geometrically, from $N$ on the whole graph of $f_n$ lies in the tube of half-width $\eps$ around the graph of $f$. This is exactly the extra control needed to pass continuity, integrals and (with care) derivatives to the limit.`,
      caption: String.raw`Choose $\eps$ and scrub through $n$. The shaded tube has half-width $\eps$ about the limit $f$; whatever part of $f_n$ escapes it is drawn red. The bars below show how far each $f_k$ ($k\le 60$) strays from $f$; a bar is green when the entire graph of $f_k$ lies in the tube. Uniform convergence means the bars turn green for good — they never do for $x^n$ on $[0,1]$ or for the travelling bump, whatever $\eps<1$.`,
      deps: ['pma-7.1'],
      tags: ['uniform convergence', 'sequences of functions'],
      viz(v) {
        const M = v.M;
        const FAM = {
          pow1: { label: '$x^n$ on $[0,1]$', a: 0, b: 1, y: [-0.3, 1.3], jumps: [1], f: (n, x) => Math.pow(x, n), lim: (x) => (x < 1 ? 0 : 1), Mn: () => 1, Mtex: () => '1' },
          pow9: { label: '$x^n$ on $[0,0.9]$', a: 0, b: 0.9, y: [-0.3, 1.3], f: (n, x) => Math.pow(x, n), lim: () => 0, Mn: (n) => Math.pow(0.9, n), Mtex: (n) => `0.9^{${n}}` },
          sqrt: { label: '$\\sqrt{x^2+1/n}$ on $[-1,1]$', a: -1, b: 1, y: [-0.35, 1.6], f: (n, x) => Math.sqrt(x * x + 1 / n), lim: (x) => Math.abs(x), Mn: (n) => 1 / Math.sqrt(n), Mtex: (n) => `1/\\sqrt{${n}}` },
          bump: { label: '$\\frac{2nx}{1+n^2x^2}$ on $[0,1]$', a: 0, b: 1, y: [-0.3, 1.3], f: (n, x) => 2 * n * x / (1 + n * n * x * x), lim: () => 0, Mn: () => 1, Mtex: () => '1' },
        };
        const which = v.select('', Object.entries(FAM).map(([value, F]) => ({ value, label: F.label })), 'pow9');
        const nS = v.slider('$n$', 1, 60, 6, { int: true });
        const eS = v.slider('$\\varepsilon$', 0.02, 0.6, 0.15, { step: 0.01 });
        const S = v.stage({ x: [-0.05, 1.05], y: [-0.3, 1.3], height: 300, full: true, title: 'the $\\varepsilon$-tube about $f$ and the graph of $f_n$' });
        const T = v.stage({ x: [-3, 60.8], y: [-0.16, 1.12], height: 165, full: true, axes: 'box', xticks: [1, 10, 20, 30, 40, 50, 60], title: '$\\sup_E|f_k-f|$ for $k=1,\\dots,60$: green bars have their whole graph inside the tube' });
        let last = null, info = {};
        v.legend([['green', 'limit $f$'], ['accent', '$\\varepsilon$-tube about $f$', { area: true }], ['accent', '$f_n$ inside the tube'], ['red', '$f_n$ outside the tube'], ['faint', 'other $f_k$']]);
        v.render(() => {
          const F = FAM[which.value], n = nS.value, e = eS.value;
          if (last !== which.value) { last = which.value; const pad = (F.b - F.a) * 0.04; S.setView([F.a - pad, F.b + pad], F.y); }
          const eta = (F.b - F.a) * 1e-6;
          const bEnd = F.jumps ? F.jumps[0] - eta : F.b;
          // tube
          S.between((x) => F.lim(x) + e, (x) => F.lim(x) - e, F.a, bEnd, { fill: 'accent', fillAlpha: 0.14 });
          S.fn((x) => F.lim(x) + e, { domain: [F.a, bEnd], color: 'accent', width: 1, dash: [5, 4], alpha: 0.7 });
          S.fn((x) => F.lim(x) - e, { domain: [F.a, bEnd], color: 'accent', width: 1, dash: [5, 4], alpha: 0.7 });
          if (F.jumps) { const j = F.jumps[0]; S.line(j, F.lim(j) - e, j, F.lim(j) + e, { color: 'accent', width: 7, alpha: 0.25, cap: 'butt' }); }
          // the other f_k, faint
          for (let k = 1; k <= 60; k += (k < 12 ? 1 : 3)) if (k !== n) S.fn((x) => F.f(k, x), { domain: [F.a, F.b], color: 'faint', width: 1, alpha: 0.5 });
          drawLimit(S, F, { width: 2.4 });
          drawInOut(S, (x) => F.f(n, x), F.lim, F.a, F.b, e, { width: 2.6 });
          const xm = F.a + 0.025 * (F.b - F.a);
          S.measure(xm, F.lim(xm), xm, F.lim(xm) + e, 'ε', { color: 'accent', offset: -10 });
          const Mn = F.Mn(n);
          // label f_n where it is worst
          let wx = F.a, wv = -1; for (let i = 0; i <= 800; i++) { const x = F.a + (F.b - F.a) * i / 800; const d = Math.abs(F.f(n, x) - F.lim(x)); if (d > wv && !(F.jumps && x >= F.jumps[0])) { wv = d; wx = x; } }
          const lr = wx > F.a + 0.8 * (F.b - F.a);
          S.tex(`f_{${n}}`, wx, F.f(n, wx), { color: Mn <= e ? 'accent' : 'red', align: lr ? 'right' : 'left', baseline: 'bottom', dx: lr ? -8 : 6, dy: -4 });
          S.corner(Mn <= e ? `sup |f${sub(n)} − f| = ${v.fmt(Mn, 3)} ≤ ε: inside the tube` : `sup |f${sub(n)} − f| = ${v.fmt(Mn, 3)} > ε: escapes the tube`, 'tl', { color: Mn <= e ? 'green' : 'red', weight: 600 });
          // bars of sup|f_k − f| against the threshold ε
          let N = null; for (let k = 1; k <= 60; k++) if (F.Mn(k) <= e) { N = k; break; }
          const vals = []; for (let k = 1; k <= 60; k++) vals.push(Math.min(1.08, F.Mn(k)));
          T.bars(vals, { x0: 1, barWidth: 0.72, color: (val, i) => (F.Mn(i + 1) <= e ? 'green' : 'red'), fillAlpha: 0.7 });
          T.rect(n - 0.5, 0, n + 0.5, Math.min(1.08, Mn), { color: 'ink', width: 1.8 });
          T.hline(e, { color: 'accent', width: 1.6, dash: [6, 4] });
          T.tex('\\varepsilon', 60.8, e, { color: 'accent', align: 'right', baseline: 'bottom', dx: -4, dy: -2 });
          if (N) { T.vline(N - 0.5, { color: 'green', width: 1.4 }); T.text(`N(ε) = ${N}`, N - 0.5, 1.1, { size: 12, color: 'green', align: N > 45 ? 'right' : 'left', baseline: 'top', weight: 600, dx: N > 45 ? -5 : 5 }); }
          else T.text('no N: every f_k leaves the tube', 30.5, 1.1, { size: 12, color: 'red', align: 'center', baseline: 'top', weight: 600 });
          info = { F, n, e, Mn, N };
        });
        v.readout(() => {
          const { F, n, e, Mn, N } = info; if (!F) return '';
          return `$\\sup_{x\\in E}|f_{${n}}(x)-f(x)| = ${F.Mtex(n)}${/^[\\d.]+$/.test(F.Mtex(n)) ? '' : ' = ' + v.fmt(Mn, 4)}$. ` +
            (N ? `For $\\varepsilon = ${v.fix(e, 2)}$ the index $N = ${N}$ works: every $f_k$ with $k\\ge ${N}$ lies in the tube.` : `For $\\varepsilon = ${v.fix(e, 2)}$ no index works, so $f_n\\not\\to f$ uniformly — although $f_n(x)\\to f(x)$ at every single $x$.`);
        });
      },
    },

    // ------------------------------------------------------------------ 7.8
    {
      num: '7.8',
      kind: 'Theorem',
      name: 'Cauchy criterion for uniform convergence',
      statement: String.raw`A sequence of functions $\{f_n\}$ defined on $E$ converges uniformly on $E$ if and only if for every $\eps>0$ there is an integer $N$ such that
$$|f_n(x)-f_m(x)|\le\eps\qquad\text{whenever } m,n\ge N \text{ and } x\in E .$$`,
      idea: String.raw`If $f_n\to f$ uniformly, the triangle inequality through $f$ gives the condition with $2\eps$. Conversely, for each fixed $x$ the numbers $f_n(x)$ form a Cauchy sequence, which converges (3.11) to some $f(x)$. Letting $m\to\infty$ in $|f_n(x)-f_m(x)|\le\eps$ gives $|f_n(x)-f(x)|\le\eps$ for all $n\ge N$ and all $x$ simultaneously. The criterion never mentions the limit, which is why it is the tool of choice for series.`,
      caption: String.raw`The matrix shows $\|f_n-f_m\| = \sup_E|f_n-f_m|$ for $1\le m,n\le 40$, green where it is at most $\eps$. Click a cell (or use the sliders) to see that pair on the left, with the widest gap marked. The criterion needs a block $m,n\ge N$ that is green *all the way to infinity*: the outlined block is guaranteed by the readout's bound. For $x^n$ on $[0,1)$ every row eventually turns red again, since $\|f_n-f_m\|\to1$ as $m\to\infty$.`,
      deps: ['pma-7.7', 'pma-3.11'],
      tags: ['uniform convergence', 'Cauchy sequences'],
      viz(v) {
        const M = v.M, K = 40;
        // partial sums of Σ sin(kx)/k² on a grid, and the 40×40 distance matrix
        const G = 1200, X = M.linspace(0, 2 * Math.PI, G);
        function sinSeries() {
          const S = [new Float64Array(G)];
          for (let n = 1; n <= K; n++) { const a = new Float64Array(G); for (let j = 0; j < G; j++) a[j] = S[n - 1][j] + Math.sin(n * X[j]) / (n * n); S.push(a); }
          const D = [], A = [];
          for (let n = 0; n <= K; n++) { D.push(new Float64Array(K + 1)); A.push(new Float64Array(K + 1)); }
          for (let n = 1; n <= K; n++) for (let m = n + 1; m <= K; m++) {
            let best = 0, at = 0; for (let j = 0; j < G; j++) { const d = Math.abs(S[m][j] - S[n][j]); if (d > best) { best = d; at = X[j]; } }
            D[n][m] = D[m][n] = best; A[n][m] = A[m][n] = at;
          }
          return { D, A };
        }
        const powGap = (n, m, b) => { // sup over [0,b) of x^n − x^m, m > n
          const r = n / m, xc = Math.pow(r, 1 / (m - n));
          return xc < b ? [Math.pow(r, n / (m - n)) * (1 - r), xc] : [Math.pow(b, n) - Math.pow(b, m), b];
        };
        const zeta2tail = (N) => { let s = 0; for (let k = N + 1; k < N + 200000; k++) s += 1 / (k * k); return s; };
        const FAM = {
          sin2: { label: '$\\sum_{k\\le n}\\frac{\\sin kx}{k^2}$ on $[0,2\\pi]$', a: 0, b: 2 * Math.PI, y: [-1.3, 1.3],
            f: (n, x) => { let s = 0; for (let k = 1; k <= n; k++) s += Math.sin(k * x) / (k * k); return s; },
            tail: (N) => zeta2tail(N - 1), tailTex: (N) => `\\sum_{k\\ge ${N}} \\tfrac1{k^2}`, exact: false },
          pow1: { label: '$x^n$ on $[0,1)$', a: 0, b: 1, y: [-0.12, 1.12], f: (n, x) => Math.pow(x, n), b1: 1,
            tail: () => 1, tailTex: () => '1', exact: true },
          pow9: { label: '$x^n$ on $[0,0.9]$', a: 0, b: 0.9, y: [-0.12, 1.12], f: (n, x) => Math.pow(x, n), b1: 0.9,
            tail: (N) => Math.pow(0.9, N), tailTex: (N) => `0.9^{${N}}`, exact: true },
        };
        const cache = {};
        const dist = (key, n, m) => {
          if (n === m) return [0, 0];
          const F = FAM[key];
          if (key === 'sin2') { cache.sin2 ||= sinSeries(); return [cache.sin2.D[n][m], cache.sin2.A[n][m]]; }
          return powGap(Math.min(n, m), Math.max(n, m), F.b1);
        };
        const which = v.select('', Object.entries(FAM).map(([value, F]) => ({ value, label: F.label })), 'sin2');
        const nS = v.slider('$n$', 1, K, 3, { int: true });
        const mS = v.slider('$m$', 1, K, 8, { int: true });
        const eS = v.slider('$\\varepsilon$', 0.01, 0.3, 0.06, { step: 0.005, decimals: 3 });
        const L = v.stage({ x: [0, 2 * Math.PI], y: [-1.3, 1.3], height: 350, title: 'the pair $f_n$, $f_m$ and their largest gap' });
        const R = v.stage({ x: [-2.8, K + 3.2], y: [-K - 3.6, 4], height: 350, axes: false, title: 'the matrix $\\|f_n-f_m\\|$: row $n$, column $m$' });
        R.onClick((x, y) => { const m = Math.round(x), n = Math.round(-y); if (m >= 1 && m <= K && n >= 1 && n <= K) { mS.set(m); nS.set(n); } });
        let last = null, info = {};
        v.legend([['accent', '$f_n$'], ['purple', '$f_m$'], ['orange', 'gap $|f_n-f_m|$', { area: true }], ['green', 'cell $\\le\\varepsilon$', { area: true }], ['red', 'cell $>\\varepsilon$', { area: true }]]);
        v.render(() => {
          const key = which.value, F = FAM[key], n = nS.value, m = mS.value, e = eS.value;
          if (last !== key) { last = key; const w = F.b - F.a; L.setView([F.a - 0.1 * w, F.b + 0.03 * w], F.y); }
          // ---- left panel
          L.between((x) => F.f(n, x), (x) => F.f(m, x), F.a, F.b, { fill: 'orange', fillAlpha: 0.22, n: 500 });
          L.fn((x) => F.f(m, x), { domain: [F.a, F.b], color: 'purple', width: 2.2 });
          L.fn((x) => F.f(n, x), { domain: [F.a, F.b], color: 'accent', width: 2.2 });
          const [d, at] = dist(key, n, m);
          if (n !== m) {
            const y1 = F.f(n, at), y2 = F.f(m, at), ok = d <= e;
            L.line(at, y1, at, y2, { color: ok ? 'green' : 'red', width: 2.6 });
            L.dot(at, y1, { r: 3.5, color: ok ? 'green' : 'red' }); L.dot(at, y2, { r: 3.5, color: ok ? 'green' : 'red' });
            L.corner(`‖f${sub(n)} − f${sub(m)}‖ = ${v.fmt(d, 3)} ${ok ? '≤' : '>'} ε`, 'tr', { color: ok ? 'green' : 'red', weight: 600 });
          }
          if (key === 'pow1') L.dot(1, 1, { hollow: true, color: 'muted', r: 4 });
          // ---- right panel: the matrix
          const tail = (N) => F.tail(N);
          let N0 = null; for (let N = 1; N <= K; N++) if (tail(N) <= e) { N0 = N; break; }
          let maxD = 0; const DD = [];
          for (let i = 1; i <= K; i++) { DD.push([]); for (let j = 1; j <= K; j++) { const dd = dist(key, i, j)[0]; DD[i - 1].push(dd); maxD = Math.max(maxD, dd); } }
          for (let i = 1; i <= K; i++) for (let j = 1; j <= K; j++) {
            const dd = DD[i - 1][j - 1];
            const col = dd <= e ? v.mix('panel', 'green', 0.35 + 0.5 * (1 - dd / e)) : v.mix('panel', 'red', 0.22 + 0.68 * Math.min(1, Math.sqrt((dd - e) / Math.max(1e-9, maxD - e))));
            R.rect(j - 0.5, -i - 0.5, j + 0.5, -i + 0.5, { fill: col, fillAlpha: 1, stroke: false });
          }
          if (N0) R.rect(N0 - 0.5, -K - 0.5, K + 0.5, -N0 + 0.5, { color: 'green', width: 2.6 });
          R.rect(m - 0.5, -n - 0.5, m + 0.5, -n + 0.5, { color: 'ink', width: 2 });
          for (const k of [1, 10, 20, 30, 40]) {
            R.text(String(k), k, 0.5, { size: 10.5, color: 'muted', align: 'center', baseline: 'bottom', dy: -2, halo: false });
            R.text(String(k), 0.5, -k, { size: 10.5, color: 'muted', align: 'right', dx: -4, halo: false });
          }
          R.text('m', K + 1.2, 0.5, { size: 16, color: 'muted', align: 'left', baseline: 'bottom', dy: -1, math: true, halo: false });
          R.text('n', 0.5, -K - 0.6, { size: 16, color: 'muted', align: 'right', baseline: 'top', dx: -5, dy: 2, math: true, halo: false });
          if (N0) R.text(`block m, n ≥ N = ${N0}`, N0 - 0.5, -K - 0.5, { size: 12, color: 'green', weight: 600, align: N0 > 25 ? 'right' : 'left', baseline: 'top', dy: 3, halo: false });
          info = { F, n, m, d, e, N0, key };
        });
        v.readout(() => {
          const { F, n, m, d, e, N0, key } = info; if (!F) return '';
          const pair = `$\\|f_{${n}}-f_{${m}}\\| = ${v.fmt(d, 4)}$ ${d <= e ? '$\\le\\varepsilon$' : '$>\\varepsilon$'}. `;
          if (key === 'pow1') return pair + 'For every $N$, $\\sup_{m,n\\ge N}\\|f_n-f_m\\| = 1$ (let $m\\to\\infty$ with $n$ fixed): the sequence is not uniformly Cauchy, so it cannot converge uniformly.';
          const N = N0 || 1;
          return pair + (N0 ? `For all $m,n\\ge ${N0}$: $\\|f_n-f_m\\|\\le ${F.tailTex(N0)} = ${v.fmt(F.tail(N0), 3)}\\le\\varepsilon$ — the Cauchy condition holds with $N = ${N0}$.` : `The bound $${F.tailTex(N)}$ needs an index beyond $40$ for this $\\varepsilon$.`);
        });
      },
    },

    // ------------------------------------------------------------------ 7.9
    {
      num: '7.9',
      kind: 'Theorem',
      name: 'Uniform convergence means the sup of the error tends to 0',
      statement: String.raw`Suppose $\lim_{n\to\infty}f_n(x)=f(x)$ for every $x\in E$, and put
$$M_n=\sup_{x\in E}|f_n(x)-f(x)| .$$
Then $f_n\to f$ uniformly on $E$ if and only if $M_n\to0$ as $n\to\infty$.`,
      idea: String.raw`This is Definition 7.7 rewritten: "$|f_n(x)-f(x)|\le\eps$ for every $x\in E$" says precisely that $M_n\le\eps$. Its value is practical — uniform convergence is decided by one number per $n$, usually found by calculus — and it is the first appearance of the sup norm that turns $\mathscr C(X)$ into a metric space (7.14).`,
      caption: String.raw`The heat map stacks the error functions $|f_k-f|$ for $k=1,\dots,50$, one per row; the thin line traces where each row peaks, and the bars on the right are the row maxima $M_k$. Move $n$ to inspect a row below. Only for $x/(1+nx^2)$ does the whole picture fade. The travelling bump slides into $x=0$ but keeps its height $\tfrac12$; for $x^n$ the hot spot at $x=1$ narrows, yet its supremum stays equal to $1$ and is never attained.`,
      deps: ['pma-7.7', 'pma-7.1'],
      tags: ['uniform convergence', 'sup norm'],
      viz(v) {
        const FAM = {
          dec: { label: '$\\frac{x}{1+nx^2}$ on $[0,4]$', a: 0, b: 4, y: [-0.06, 0.6], f: (n, x) => x / (1 + n * x * x), lim: () => 0, Mn: (n) => 1 / (2 * Math.sqrt(n)), at: (n) => 1 / Math.sqrt(n), limM: 0, Mtex: (n) => `\\tfrac{1}{2\\sqrt{${n}}}` },
          bump: { label: '$\\frac{nx}{1+n^2x^2}$ on $[0,1]$', a: 0, b: 1, y: [-0.06, 0.6], f: (n, x) => n * x / (1 + n * n * x * x), lim: () => 0, Mn: () => 0.5, at: (n) => 1 / n, limM: 0.5, Mtex: () => '\\tfrac12' },
          pow: { label: '$x^n$ on $[0,1]$', a: 0, b: 1, y: [-0.1, 1.15], jumps: [1], f: (n, x) => Math.pow(x, n), lim: (x) => (x < 1 ? 0 : 1), Mn: () => 1, at: () => 1, limM: 1, notAttained: true, Mtex: () => '1' },
        };
        const which = v.select('', Object.entries(FAM).map(([value, F]) => ({ value, label: F.label })), 'dec');
        const nS = v.slider('$n$', 1, 50, 5, { int: true });
        const K = 50;
        const H = v.stage({ x: [0, 1], y: [-K - 3.2, 3], height: 350, full: true, axes: false, title: 'every error function at once: row $k$ shows $|f_k(x)-f(x)|$ along $E$; the bars are the row maxima $M_k$' });
        const S = v.stage({ x: [-0.1, 4.1], y: [-0.06, 0.6], height: 200, full: true, title: 'row $n$ in detail: $f_n$, its limit $f$, and the gap $M_n$' });
        const lerp3 = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
        let last = null, info = {};
        v.legend([['accent', '$f_n$'], ['green', 'limit $f$'], ['orange', 'error $|f_k-f|$ (stronger colour = larger)', { area: true }], ['ink', 'where $M_k$ is attained'], ['gold', '$M_n$ (current row)', { area: true }]]);
        v.render(() => {
          const F = FAM[which.value], n = nS.value, w = F.b - F.a;
          const xb0 = F.b + 0.08 * w, bw = 0.34 * w, Mmax = F.Mn(1);
          if (last !== which.value) {
            last = which.value;
            H.setView([F.a - 0.075 * w, xb0 + bw + 0.04 * w], null);
            S.setView([F.a - 0.06 * w, F.b + 0.025 * w], F.y);
          }
          // ---- heat map of all the error functions
          const P = v.rgb('panel'), O = v.rgb('orange'), Rd = v.rgb('red');
          H.raster((x, y) => {
            if (x < F.a || x > F.b || y > -0.5 || y < -K - 0.5) return null;
            const k = Math.round(-y), t = Math.min(1, Math.abs(F.f(k, x) - F.lim(x)) / Mmax);
            return t < 0.5 ? lerp3(P, O, t * 2) : lerp3(O, Rd, (t - 0.5) * 2);
          }, { key: which.value + '|' + P.join(','), res: 2 });
          H.rect(F.a, -K - 0.5, F.b, -0.5, { color: 'faint', width: 1 });
          const am = []; for (let k = 1; k <= K; k++) am.push([F.at(k), -k]);
          H.path(am, { color: 'ink', width: 1.3, alpha: 0.75 });
          H.rect(F.a, -n - 0.5, xb0 + bw, -n + 0.5, { color: 'accent', width: 1.6 });
          // bars M_k
          for (let k = 1; k <= K; k++) H.rect(xb0, -k - 0.38, xb0 + bw * F.Mn(k) / Mmax, -k + 0.38, { fill: k === n ? 'gold' : 'accent', fillAlpha: k === n ? 0.95 : 0.6, stroke: false });
          H.line(xb0, -K - 0.5, xb0, -0.5, { color: 'muted', width: 1 });
          const xl = xb0 + bw * F.limM / Mmax;
          H.line(xl, -K - 0.6, xl, -0.4, { color: F.limM === 0 ? 'green' : 'red', width: 2, dash: [5, 4] });
          H.dot(F.at(n), -n, { color: 'gold', r: 4.5 });
          // labels
          for (const k of [1, 10, 20, 30, 40, 50]) H.text(String(k), F.a, -k, { size: 10.5, color: 'muted', align: 'right', dx: -6, halo: false });
          H.text('k', F.a, -25, { size: 15, color: 'muted', align: 'right', dx: -8, math: true, halo: false });
          H.text(`x = ${v.fmt(F.a, 2)}`, F.a, 0, { size: 11, color: 'muted', align: 'left', baseline: 'bottom', dy: -3, halo: false });
          H.text(`x = ${v.fmt(F.b, 2)}`, F.b, 0, { size: 11, color: 'muted', align: 'right', baseline: 'bottom', dy: -3, halo: false });
          H.tex('M_k', xb0 + bw / 2, 0, { color: 'accent', baseline: 'bottom', dy: -2, size: 14 });
          H.text(F.limM === 0 ? 'Mₖ → 0: uniform' : `Mₖ = ${v.fmt(F.limM, 2)} for all k: not uniform`, xb0, -K - 0.6, { size: 11.5, weight: 600, color: F.limM === 0 ? 'green' : 'red', align: 'left', baseline: 'top', dy: 3, halo: false });
          // ---- the current row in detail
          const eta = w * 1e-6, hi = F.jumps ? F.jumps[0] - eta : F.b;
          S.between((x) => F.f(n, x), F.lim, F.a, hi, { fill: 'orange', fillAlpha: 0.25, n: 600 });
          drawLimit(S, F, { width: 2.4 });
          S.fn((x) => F.f(n, x), { domain: [F.a, F.b], color: 'accent', width: 2.6 });
          const Mn = F.Mn(n), at = F.at(n);
          const base = F.notAttained ? 0 : F.lim(at), top = base + Mn;
          S.arrow(at, base, at, top, { color: 'ink', width: 1.6, head: 8, both: true, dash: F.notAttained ? [4, 3] : null });
          if (F.notAttained) S.dot(1, 1, { hollow: true, color: 'accent', r: 5, width: 2 });
          else S.dot(at, F.f(n, at), { color: 'gold', r: 5 });
          S.tex(F.notAttained ? 'M_{' + n + '} = 1\\ \\text{(not attained)}' : `M_{${n}} = ${F.Mtex(n)}`, at, (top + base) / 2, { align: F.notAttained ? 'right' : 'left', dx: F.notAttained ? -10 : 10, size: 15 });
          info = { F, n, Mn, at };
        });
        v.readout(() => {
          const { F, n, Mn, at } = info; if (!F) return '';
          return `$M_{${n}} = ${v.fmt(Mn, 4)}$` + (F.notAttained ? ', approached as $x\\to1^-$ but attained nowhere' : `, attained at $x = ${v.fix(at, 3)}$`) + '. ' +
            (F.limM === 0 ? 'Since $M_n\\to0$, the convergence is uniform.' : `Each $f_n(x)\\to f(x)$, but $M_n\\not\\to0$: the convergence is not uniform.`);
        });
      },
    },

    // ------------------------------------------------------------------ 7.10
    {
      num: '7.10',
      kind: 'Theorem',
      name: 'Weierstrass M-test',
      statement: String.raw`Let $\{f_n\}$ be functions defined on $E$, and suppose there are constants $M_n$ such that
$$|f_n(x)|\le M_n\qquad(x\in E,\ n=1,2,3,\dots).$$
If $\sum M_n$ converges, then $\sum f_n$ converges uniformly on $E$.`,
      idea: String.raw`For $m>n$ and every $x\in E$, the triangle inequality gives $\bigl|\sum_{k=n+1}^{m}f_k(x)\bigr|\le\sum_{k=n+1}^{m}M_k$, and the right side is small for large $n$ by the Cauchy criterion for the numerical series $\sum M_k$ (3.22). So the partial sums are uniformly Cauchy and 7.8 applies. Letting $m\to\infty$ even gives an explicit error bound: $|f(x)-s_N(x)|\le\sum_{k>N}M_k$ for every $x$.`,
      caption: String.raw`Pick a series and the last index $N$. Gold: the partial sum $s_N$ (all terms up to $k=N$); green: the full sum $f$; blue band: $s_N\pm\sum_{k>N}M_k$, which the M-test guarantees $f$ never leaves. Below, the bounds $M_k$ — the blue tail is what the band is made of. For $\sum\sin(kx)/k$ the bounds $1/k$ are not summable, the test says nothing, and indeed the error near $0$ never drops below $\pi/2$.`,
      deps: ['pma-7.8', 'pma-3.22'],
      see: ['pma-7.18'],
      tags: ['series of functions', 'uniform convergence'],
      viz(v) {
        const M = v.M, TAU = 2 * Math.PI;
        const G = 1400;
        const FAM = {
          sin2: {
            label: '$\\sum_{k\\ge1}\\frac{\\sin kx}{k^2}$ on $[0,2\\pi]$', a: 0, b: TAU, y: [-1.9, 1.9], k0: 1, kMax: 40,
            term: (k, x) => Math.sin(k * x) / (k * k), Mk: (k) => 1 / (k * k), Mtex: '\\tfrac1{k^2}',
            sumGrid() { // Clausen-type sum with 4000 terms (truncation error ≤ 1/4000)
              const X = M.linspace(0, TAU, G), Y = new Float64Array(G);
              for (let j = 0; j < G; j++) { const c = Math.cos(X[j]), s = Math.sin(X[j]); let re = 1, im = 0, acc = 0; for (let k = 1; k <= 4000; k++) { const r2 = re * c - im * s; im = re * s + im * c; re = r2; acc += im / (k * k); } Y[j] = acc; }
              return { X, Y };
            },
          },
          exp: {
            label: '$\\sum_{k\\ge0}\\frac{x^k}{k!}$ on $[-2,2]$', a: -2, b: 2, y: [-1.2, 8.6], k0: 0, kMax: 20,
            term: (k, x) => Math.pow(x, k) / M.factorial(k), Mk: (k) => Math.pow(2, k) / M.factorial(k), Mtex: '\\tfrac{2^k}{k!}',
            sumGrid() { const X = M.linspace(-2, 2, G); return { X, Y: Float64Array.from(X, Math.exp) }; },
          },
          sin1: {
            label: '$\\sum_{k\\ge1}\\frac{\\sin kx}{k}$ on $[0,2\\pi]$', a: 0, b: TAU, y: [-2.3, 2.3], k0: 1, kMax: 40, divergent: true,
            term: (k, x) => Math.sin(k * x) / k, Mk: (k) => 1 / k, Mtex: '\\tfrac1k',
            sumGrid() { const X = M.linspace(0, TAU, G); return { X, Y: Float64Array.from(X, (x) => (x <= 0 || x >= TAU ? 0 : (Math.PI - x) / 2)) }; },
          },
        };
        const grids = {};
        const which = v.select('', Object.entries(FAM).map(([value, F]) => ({ value, label: F.label })), 'sin2');
        const nS = v.slider('$N$', 1, 30, 4, { int: true });
        const S = v.stage({ x: [0, TAU], y: [-1.9, 1.9], height: 300, full: true, title: 'partial sum $s_N$, the sum $f$, and the M-test band $s_N\\pm\\sum_{k>N}M_k$' });
        const B = v.stage({ x: [0, 41], y: [-3.5, 0.2], height: 170, full: true, axes: 'box', title: 'the bounds $M_k\\ge\\sup_E|f_k|$ on a log scale: gold terms are summed, the blue tail bounds the error' });
        let last = null, info = {};
        v.legend([['gold', 'partial sum $s_N$'], ['green', 'sum $f$'], ['accent', 'band of half-width $\\sum_{k>N}M_k$', { area: true }], ['ink', 'largest actual error $\\sup_E|f-s_N|$']]);
        v.render(() => {
          const key = which.value, F = FAM[key], N = nS.value;
          const g = grids[key] ||= F.sumGrid();
          const logs = M.range(F.kMax - F.k0 + 1, F.k0).map((k) => Math.log10(F.Mk(k)));
          const lo = Math.floor(Math.min(...logs) - 0.15), hi = Math.max(0, ...logs) + 0.4;
          if (last !== key) {
            last = key; const pad = (F.b - F.a) * 0.02; S.setView([F.a - pad, F.b + pad], F.y);
            const span = hi - lo, cnt = F.kMax - F.k0 + 1;
            B.setView([F.k0 - 0.5 - cnt * 0.06, F.kMax + 0.7], [lo - span * 0.14, hi]);
            const step = span > 6 ? 3 : 1; const yt = [];
            for (let q = 0; q >= lo; q -= step) yt.push([q, q === 0 ? '1' : '10' + String(q).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d])]);
            B.o.yticks = yt;
            B.o.xticks = F.k0 === 0 ? [0, 4, 8, 12, 16, 20] : [1, 5, 10, 15, 20, 25, 30, 35, 40];
          }
          const lastIdx = N; // s_N uses the terms k0..N
          const sN = (x) => { let s = 0; for (let k = F.k0; k <= lastIdx; k++) s += F.term(k, x); return s; };
          let T = Infinity;
          if (!F.divergent) { T = 0; for (let k = lastIdx + 1; k < lastIdx + 20000; k++) { const mk = F.Mk(k); T += mk; if (mk < 1e-17) break; } }
          if (isFinite(T)) {
            S.between((x) => sN(x) + T, (x) => sN(x) - T, F.a, F.b, { fill: 'accent', fillAlpha: 0.15, n: 500 });
            S.fn((x) => sN(x) + T, { domain: [F.a, F.b], color: 'accent', width: 1, dash: [5, 4], alpha: 0.7 });
            S.fn((x) => sN(x) - T, { domain: [F.a, F.b], color: 'accent', width: 1, dash: [5, 4], alpha: 0.7 });
          } else {
            S.rect(F.a, S.bounds.y[0], F.b, S.bounds.y[1], { fill: 'red', fillAlpha: 0.05, stroke: false });
            S.corner('Σ Mₖ = Σ 1/k = ∞: the M-test gives no band', 'tl', { color: 'red', weight: 600 });
          }
          // the sum f, with the jump of the sawtooth drawn honestly
          const pts = []; for (let j = 0; j < G; j++) pts.push([g.X[j], g.Y[j]]);
          if (key === 'sin1') { S.path(pts.slice(1, G - 1), { color: 'green', width: 2.4 }); S.dot(0, 0, { color: 'green', r: 4 }); S.dot(TAU, 0, { color: 'green', r: 4 }); S.dot(0, Math.PI / 2, { hollow: true, color: 'green', r: 4 }); S.dot(TAU, -Math.PI / 2, { hollow: true, color: 'green', r: 4 }); }
          else S.path(pts, { color: 'green', width: 2.4 });
          S.fn(sN, { domain: [F.a, F.b], color: 'gold', width: 2.4, n: 1400 });
          // actual sup error on the grid (for the sawtooth: the supremum π/2 is approached at 0⁺)
          let err = 0, at = F.a; for (let j = 0; j < G; j++) { const d = Math.abs(g.Y[j] - sN(g.X[j])); if (d > err) { err = d; at = g.X[j]; } }
          if (key === 'sin1') { err = Math.PI / 2; at = 0; }
          if (key !== 'sin1') {
            const fy = g.Y[g.X.findIndex((x) => x === at)], sy = sN(at);
            S.line(at, sy, at, fy, { color: 'ink', width: 2 });
            S.dot(at, fy, { color: 'ink', r: 3 }); S.dot(at, sy, { color: 'ink', r: 3 });
                      }
          // bars
          B.bars(logs, { x0: F.k0, base: lo, color: (val, i) => (F.k0 + i <= lastIdx ? 'gold' : 'accent'), fillAlpha: 0.75 });
          B.vline(lastIdx + 0.5, { color: 'muted', dash: [4, 3], width: 1.2 });
          B.corner(isFinite(T) ? `sum of the blue tail = ${v.fmt(T, 3)}` : 'sum of the blue tail = ∞', 'tr', { color: isFinite(T) ? 'accent' : 'red', weight: 600 });
          info = { F, N, T, err, key };
        });
        v.readout(() => {
          const { F, N, T, err, key } = info; if (!F) return '';
          if (key === 'sin1') return `$\\sup_E|f-s_N| = \\pi/2$ for every $N$ (approached as $x\\to0^+$), while $\\sum M_k=\\sum\\tfrac1k=\\infty$. The M-test is only sufficient — but here the convergence really is not uniform.`;
          return `$\\sup_E|f-s_N| = ${v.fmt(err, 3)}\\;\\le\\;\\sum_{k>N}${F.Mtex} = ${v.fmt(T, 3)}$` + (key === 'exp' ? ' — the bound is attained at $x=2$, where every term equals its $M_k$.' : ' — the bound holds at every $x$ simultaneously.');
        });
      },
    },

    // ------------------------------------------------------------------ 7.11
    {
      num: '7.11',
      kind: 'Theorem',
      name: 'Uniform convergence lets limits be interchanged',
      statement: String.raw`Suppose $f_n\to f$ uniformly on a set $E$ in a metric space. Let $x$ be a limit point of $E$, and suppose that
$$\lim_{t\to x}f_n(t)=A_n\qquad(n=1,2,3,\dots).$$
Then $\{A_n\}$ converges, and $\lim_{t\to x}f(t)=\lim_{n\to\infty}A_n$; that is,
$$\lim_{t\to x}\,\lim_{n\to\infty}f_n(t)=\lim_{n\to\infty}\,\lim_{t\to x}f_n(t).$$`,
      idea: String.raw`By the Cauchy criterion (7.8), $|f_n(t)-f_m(t)|\le\eps$ for all $t\in E$ once $m,n\ge N$; letting $t\to x$ gives $|A_n-A_m|\le\eps$, so $\{A_n\}$ is Cauchy and converges to some $A$ (3.11). Then $|f(t)-A|\le|f(t)-f_n(t)|+|f_n(t)-A_n|+|A_n-A|$: fix one $n$ that makes the outer terms small uniformly in $t$, and the middle term is small for $t$ close to $x$.`,
      caption: String.raw`Here $x=0$ is a limit point of $E=(0,\pi]$ (or $(0,1]$) that is not in $E$. Drag $t$ toward $0$ and vary $n$. The hollow dots on the vertical axis are $A_k=\lim_{t\to0}f_k(t)$; the right panel plots them against $k$ next to $\lim_{t\to0}f(t)$ in green. For the uniformly convergent cosine series both iterated limits are $\pi^2/6$; for $\sum\sin(kt)/k$, and for $1/(1+nt)$ — Rudin's double sequence $m/(m+n)$ with $t=1/m$ — they differ.`,
      deps: ['pma-7.8', 'pma-3.11', 'pma-4.1'],
      tags: ['uniform convergence', 'limits'],
      viz(v) {
        const PI = Math.PI;
        const FAM = {
          cos2: { label: '$\\sum_{k\\le n}\\frac{\\cos kt}{k^2}$', b: PI, y: [-1.15, 1.95],
            f: (n, t) => { let s = 0; for (let k = 1; k <= n; k++) s += Math.cos(k * t) / (k * k); return s; },
            lim: (t) => PI * PI / 6 - PI * t / 2 + t * t / 4,
            A: (n) => { let s = 0; for (let k = 1; k <= n; k++) s += 1 / (k * k); return s; },
            Alim: PI * PI / 6, Ltex: '\\pi^2/6', flim: PI * PI / 6, ftex: '\\pi^2/6', uniform: true,
            sup: (n) => PI * PI / 6 - FAM.cos2.A(n) },
          sin1: { label: '$\\sum_{k\\le n}\\frac{\\sin kt}{k}$', b: PI, y: [-0.35, 2.05],
            f: (n, t) => { let s = 0; for (let k = 1; k <= n; k++) s += Math.sin(k * t) / k; return s; },
            lim: (t) => (PI - t) / 2, A: () => 0, Alim: 0, Ltex: '0', flim: PI / 2, ftex: '\\pi/2', uniform: false, sup: () => PI / 2 },
          dbl: { label: '$\\frac{1}{1+nt}$', b: 1, y: [-0.12, 1.15],
            f: (n, t) => 1 / (1 + n * t), lim: () => 0, A: () => 1, Alim: 1, Ltex: '1', flim: 0, ftex: '0', uniform: false, sup: () => 1 },
        };
        const which = v.select('', Object.entries(FAM).map(([value, F]) => ({ value, label: F.label })), 'cos2');
        const nS = v.slider('$n$', 1, 30, 3, { int: true });
        const L = v.stage({ x: [-0.2, PI + 0.1], y: [-1.15, 1.95], height: 330, title: 'graphs on $E$; hollow dots: $A_k=\\lim_{t\\to0}f_k(t)$' });
        const R = v.stage({ x: [-2.5, 31], y: [-1.15, 1.95], height: 330, axes: 'box', xticks: [1, 10, 20, 30], title: '$A_k$ against $k$, and $\\lim_{t\\to0}f(t)$' });
        const th = L.handle(1.2, 0, { color: 'gold', label: 't', constrain: (x) => [Math.max(0.004 * FAM[which.value].b, Math.min(FAM[which.value].b, x)), 0] });
        let last = null, info = {};
        v.legend([['accent', '$f_n$'], ['faint', '$f_1,\\dots,f_{n-1}$'], ['green', 'limit $f$'], ['accent', '$A_k$', { dot: true }]]);
        v.render(() => {
          const F = FAM[which.value], n = nS.value;
          if (last !== which.value) {
            last = which.value; L.setView([-0.07 * F.b, F.b * 1.03], F.y); th.x = 0.35 * F.b;
            const vals = [F.flim, F.Alim]; for (let k = 1; k <= 30; k++) vals.push(F.A(k));
            const lo = Math.min(...vals), hi = Math.max(...vals), sp = Math.max(0.4, hi - lo);
            R.setView(null, [lo - 0.32 * sp, hi + 0.22 * sp]);
          }
          th.y = 0;
          const t = th.x;
          L.vband(L.bounds.x[0], 0, { color: 'faint', alpha: 0.12 });
          for (let k = 1; k < n; k++) L.fn((s) => F.f(k, s), { domain: [1e-4 * F.b, F.b], color: 'accent', width: 1, alpha: 0.12 + 0.3 * k / n });
          L.fn(F.lim, { domain: [1e-4 * F.b, F.b], color: 'green', width: 2.6 });
          L.fn((s) => F.f(n, s), { domain: [1e-4 * F.b, F.b], color: 'accent', width: 2.6 });
          for (let k = 1; k <= n; k++) L.dot(0, F.A(k), { hollow: true, color: 'accent', r: k === n ? 5 : 3.2, width: k === n ? 2 : 1.4 });
          L.dot(0, F.flim, { hollow: true, color: 'green', r: 6.5, width: 2.4 });
          L.tex(`\\lim_{t\\to0}f(t)=${F.ftex}`, 0, F.flim, { color: 'green', align: 'left', baseline: F.uniform ? 'middle' : 'bottom', dx: F.uniform ? 0.12 * L.scale * F.b : 10, dy: F.uniform ? 0 : -8, size: 14 });
          L.vline(t, { color: 'gold', dash: [4, 4], width: 1.2 });
          L.dot(t, F.f(n, t), { color: 'accent', r: 5 });
          L.dot(t, F.lim(t), { color: 'green', r: 5 });
          // right panel
          const As = []; for (let k = 1; k <= 30; k++) As.push([k, F.A(k)]);
          R.line(0.4, F.flim, 31, F.flim, { color: 'green', width: 2, dash: [7, 4] });
          R.line(0.4, F.Alim, 31, F.Alim, { color: 'accent', width: 1.4, dash: [3, 3] });
          R.path(As, { color: 'accent', width: 1, alpha: 0.5 });
          As.forEach(([k, a]) => R.dot(k, a, { color: k === n ? 'gold' : 'accent', r: k === n ? 5.5 : 3.4 }));
          const same = Math.abs(F.flim - F.Alim) < 1e-9;
          R.tex(same ? `\\lim_k A_k = \\lim_{t\\to0}f(t) = ${F.Ltex}` : `\\lim_k A_k = ${F.Ltex}`, 30.5, F.Alim, { color: same ? 'green' : 'accent', align: 'right', baseline: same || F.Alim > F.flim ? 'bottom' : 'top', dy: same || F.Alim > F.flim ? -6 : 6, size: 14 });
          if (!same) R.tex(`\\lim_{t\\to0}f(t) = ${F.ftex}`, 30.5, F.flim, { color: 'green', align: 'right', baseline: F.flim > F.Alim ? 'bottom' : 'top', dy: F.flim > F.Alim ? -6 : 6, size: 14 });
          L.corner(same ? 'the two iterated limits agree' : 'the iterated limits differ', 'tr', { color: same ? 'green' : 'red', weight: 600 });
          info = { F, n, t, same };
        });
        v.readout(() => {
          const { F, n, t, same } = info; if (!F) return '';
          return `$t = ${v.fix(t, 3)}$: $\\;f_{${n}}(t) = ${v.fix(F.f(n, t), 4)}$, $\\;f(t) = ${v.fix(F.lim(t), 4)}$, $\\;A_{${n}} = ${v.fix(F.A(n), 4)}$. $\\;\\sup_E|f_{${n}}-f| = ${v.fmt(F.sup(n), 3)}$` +
            (same ? ' $\\to 0$: uniform, and the limits commute.' : ' for every $n$: not uniform, and $\\lim_k A_k\\ne\\lim_{t\\to0}f(t)$.');
        });
      },
    },
  ],
};
