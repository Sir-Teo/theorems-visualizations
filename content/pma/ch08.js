// Rudin, Principles of Mathematical Analysis — Chapter 8: Some Special Functions
// Part 1: power series (8.1–8.5). Further parts: ch08-a2.js (exp, trig, FTA, definitions),
// ch08-a3.js (Fourier series), ch08-a4.js (gamma function).

/** k-th falling factorial n(n-1)…(n-k+1). */
function falling(n, k) { let r = 1; for (let i = 0; i < k; i++) r *= n - i; return r; }
/** A number as TeX (scientific notation as m×10^e when very small or large). */
function texNum(x, d = 3) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e-3 && a < 1e5) return String(Number(x.toPrecision(d)));
  const e = Math.floor(Math.log10(a));
  return `${(x / 10 ** e).toFixed(Math.max(0, d - 1))}\\times10^{${e}}`;
}

export default {
  book: 'pma',
  chapter: 8,
  title: 'Some Special Functions',
  summary: String.raw`Power series are differentiated term by term, re-expanded about new centres and pinned down by their values on any set with a limit point; Abel's theorem controls them at the edge of the interval. The single series $E(z)=\sum z^n/n!$ then yields $e^x$, the logarithm, the trigonometric functions and the number $\pi$, and a minimum-modulus argument shows that every complex polynomial has a root. Fourier series are treated as best mean-square approximations (Bessel, Parseval) that converge at every point where $f$ is Lipschitz, and the chapter closes with the gamma function — characterised by log-convexity (Bohr–Mollerup) — the beta integral and Stirling's formula.`,
  items: [
    // ------------------------------------------------------------------ 8.1
    {
      num: '8.1',
      kind: 'Theorem',
      name: 'Power series converge uniformly inside and differentiate termwise',
      statement: String.raw`Suppose $\sum c_n x^n$ converges for every $x$ with $|x|<R$, and let $f(x)$ be its sum there. Then for every $\eps>0$ the series converges uniformly on $[-R+\eps,\,R-\eps]$. The function $f$ is continuous and differentiable on $(-R,R)$, and its derivative is obtained by differentiating term by term:
$$f'(x)=\sum_{n=1}^{\infty} n c_n x^{n-1}\qquad(|x|<R).$$`,
      idea: String.raw`On $|x|\le R-\eps$ each term is dominated by $|c_n|(R-\eps)^n$, and $\sum|c_n|(R-\eps)^n$ converges because $R-\eps$ is inside the radius of convergence (3.39); the Weierstrass M-test (7.10) gives uniform convergence. Since $\sqrt[n]{n}\to 1$ (3.20), the derived series $\sum nc_nx^{n-1}$ has the same radius, so it also converges uniformly on $[-R+\eps,R-\eps]$, and Theorem 7.17 allows differentiation term by term. Differentiability gives continuity.`,
      caption: String.raw`Choose a series and move $N$ and $\eps$. Gold is the partial sum $s_N$; the gold shading is the error $f-s_N$ on the orange interval $[-R+\eps,R-\eps]$. The bottom panel plots, on a log scale, the worst error there for $f$ and for $f'$ against $N$, together with the M-test bound. Shrink $\eps$ and convergence slows; on all of $(-R,R)$ it is not uniform.`,
      deps: ['pma-3.39', 'pma-7.10', 'pma-7.17', 'pma-3.20'],
      tags: ['power series', 'uniform convergence'],
      viz(v) {
        const M = v.M;
        const cAtan = (n) => (n % 2 ? (((n - 1) / 2) % 2 ? -1 : 1) / n : 0);
        const OPT = {
          geo: { label: '$\\frac{1}{1-x}=\\sum x^n$', c: () => 1, f: (x) => 1 / (1 - x), df: (x) => 1 / (1 - x) ** 2, y: [-1.4, 7.5], dy: [-4, 32] },
          log: { label: '$\\log(1+x)=\\sum\\frac{(-1)^{n+1}}{n}x^n$', c: (n) => (n === 0 ? 0 : (n % 2 ? 1 : -1) / n), f: (x) => Math.log(1 + x), df: (x) => 1 / (1 + x), y: [-3.4, 1.5], dy: [-1.5, 10] },
          atan: { label: '$\\arctan x=\\sum\\frac{(-1)^k x^{2k+1}}{2k+1}$', c: cAtan, f: Math.atan, df: (x) => 1 / (1 + x * x), y: [-1.35, 1.35], dy: [-0.4, 1.7] },
        };
        const which = v.select('', Object.entries(OPT).map(([value, o]) => ({ value, label: o.label })), 'geo');
        const nS = v.slider('$N$', 0, 40, 8, { int: true });
        const eps = v.slider('$\\varepsilon$', 0.03, 0.6, 0.2, { step: 0.01 });
        const F = v.stage({ x: [-1.18, 1.18], y: OPT.geo.y, height: 340, title: '$f$ and the partial sum $s_N$' });
        const D = v.stage({ x: [-1.18, 1.18], y: OPT.geo.dy, height: 340, title: "$f'$ and the derived partial sum $s_N'$" });
        const E = v.stage({ x: [-0.8, 42.5], y: [-7.2, 2.6], height: 190, axes: 'box', full: true, xlabel: 'N',
          title: 'worst error on $[-R+\\varepsilon,\\,R-\\varepsilon]$ against $N$ (log scale)',
          yticks: [[-6, '10⁻⁶'], [-4, '10⁻⁴'], [-2, '10⁻²'], [0, '1'], [2, '10²']] });
        let last = null, st = null;
        const NMAX = 40;
        v.render(() => {
          const o = OPT[which.value], N = nS.value, e = eps.value, a = -1 + e, b = 1 - e;
          if (last !== which.value) { last = which.value; F.setView(null, o.y); D.setView(null, o.dy); }
          const sN = (x) => { let s = 0, p = 1; for (let n = 0; n <= N; n++) { s += o.c(n) * p; p *= x; } return s; };
          const dN = (x) => { let s = 0, p = 1; for (let n = 1; n <= N; n++) { s += n * o.c(n) * p; p *= x; } return s; };
          // worst errors on the compact interval for every N (incremental partial sums)
          const errF = new Array(NMAX + 1).fill(0), errD = new Array(NMAX + 1).fill(0);
          let argF = a, argD = a;
          for (const x of M.linspace(a, b, 320)) {
            const fx = o.f(x), gx = o.df(x); let s = 0, d = 0, p = 1, q = 0;
            for (let n = 0; n <= NMAX; n++) {
              const cn = o.c(n); s += cn * p; if (n >= 1) d += n * cn * q; q = p; p *= x;
              const ef = Math.abs(fx - s), ed = Math.abs(gx - d);
              if (ef > errF[n]) { errF[n] = ef; if (n === N) argF = x; }
              if (ed > errD[n]) { errD[n] = ed; if (n === N) argD = x; }
            }
          }
          // Weierstrass M-test bound  sum_{n>N} |c_n| (1-eps)^n
          const bound = []; {
            const tail = []; let p = 1; const terms = [];
            for (let n = 0; n < 20000; n++) { terms.push(Math.abs(o.c(n)) * p); p *= b; if (p < 1e-17) break; }
            let acc = 0; for (let n = terms.length - 1; n >= 0; n--) { tail[n] = acc; acc += terms[n]; }
            for (let n = 0; n <= NMAX; n++) bound.push(tail[n] ?? 0);
          }
          // whole interval (-1,1)
          let whole;
          if (which.value === 'atan') { let s1 = 0; for (let n = 0; n <= N; n++) s1 += o.c(n); whole = [Math.abs(Math.PI / 4 - s1), 0.5]; }
          else whole = [Infinity, Infinity];
          st = { N, e, eF: errF[N], eD: errD[N], bd: bound[N], whole };

          for (const [S, g, gN, arg, col] of [[F, o.f, sN, argF, 'blue'], [D, o.df, dN, argD, 'purple']]) {
            S.vband(a, b, { color: 'orange', alpha: 0.08, edges: true });
            S.vline(-1, { color: 'muted', dash: [3, 4], width: 1 }); S.vline(1, { color: 'muted', dash: [3, 4], width: 1 });
            S.between(g, gN, a, b, { fill: 'gold', fillAlpha: 0.3, n: 300 });
            S.fn(g, { domain: [-0.9995, 0.9995], color: 'ink', width: 2.2 });
            S.fn(gN, { domain: [-1, 1], color: 'gold', width: 2.2 });
            S.line(arg, g(arg), arg, gN(arg), { color: col, width: 2.6 });
            S.dot(arg, gN(arg), { color: col, r: 3.5 });
            const yt = S.bounds.y[1];
            S.tex('-R', -1, yt, { color: 'muted', align: 'right', baseline: 'top', dx: -4, dy: 4, size: 13 });
            S.tex('R', 1, yt, { color: 'muted', align: 'left', baseline: 'top', dx: 4, dy: 4, size: 13 });
            S.tex('-R+\\varepsilon', a, yt, { color: 'orange', align: 'left', baseline: 'top', dx: 4, dy: 22, size: 12 });
          }
          // error panel
          const lg = (y) => Math.log10(Math.max(1e-7, y));
          E.hband(-7.2, -6.9, { color: 'faint', alpha: 0.3 });
          E.path(bound.map((y, n) => [n, lg(y)]), { color: 'blue', width: 1.5, dash: [5, 4], alpha: 0.8 });
          E.path(errF.map((y, n) => [n, lg(y)]), { color: 'blue', width: 2 });
          E.dots(errF.map((y, n) => [n, lg(y)]), { color: 'blue', r: 2.3 });
          E.path(errD.map((y, n) => [n, lg(y)]), { color: 'purple', width: 2 });
          E.dots(errD.map((y, n) => [n, lg(y)]), { color: 'purple', r: 2.3 });
          E.vline(N, { color: 'gold', width: 1.6 });
          E.dot(N, lg(errF[N]), { color: 'blue', r: 4.5 }); E.dot(N, lg(errD[N]), { color: 'purple', r: 4.5 });
          v.legend([['ink', '$f$, $f\'$'], ['gold', '$s_N$, $s_N\'$'], ['orange', '$[-R+\\varepsilon,R-\\varepsilon]$', { area: true }], ['blue', '$\\sup|f-s_N|$'], ['purple', '$\\sup|f\'-s_N\'|$'], ['blue', 'M-test bound $\\sum_{n>N}|c_n|(R-\\varepsilon)^n$', { dash: true }]]);
        });
        v.readout(() => {
          if (!st) return '';
          const w = st.whole;
          const wTxt = w[0] === Infinity
            ? 'on all of $(-1,1)$ the error is unbounded for every $N$ — the convergence is not uniform there.'
            : `on all of $(-1,1)$: $\\sup|f-s_N| = ${texNum(w[0])}$ (this series happens to converge uniformly), but $\\sup|f'-s_N'| = ${texNum(w[1])}$ for every $N$ — the derived series does not.`;
          return `$N=${st.N}$, $\\varepsilon=${v.fix(st.e, 2)}$: on $[-1+\\varepsilon,1-\\varepsilon]$, $\\sup|f-s_N| = ${texNum(st.eF)} \\le ${texNum(st.bd)}$ (M-test) and $\\sup|f'-s_N'| = ${texNum(st.eD)}$; ` + wTxt;
        });
      },
    },
    // ------------------------------------------------------------------ 8.1a
    {
      num: '8.1a',
      kind: 'Corollary',
      name: 'Power series have derivatives of all orders; $c_k=f^{(k)}(0)/k!$',
      statement: String.raw`Under the hypotheses of Theorem 8.1, $f$ has derivatives of every order on $(-R,R)$, given by the $k$-times differentiated series
$$f^{(k)}(x)=\sum_{n=k}^{\infty} n(n-1)\cdots(n-k+1)\,c_n x^{n-k}.$$
In particular $f^{(k)}(0)=k!\,c_k$ for $k=0,1,2,\dots$`,
      idea: String.raw`Apply Theorem 8.1 to $f$, then to $f'$ (which is again a power series with radius $R$), and so on by induction. Putting $x=0$ kills every term of the $k$-th derived series except the one with $n=k$, which equals $k!\,c_k$. So a power series is the Taylor series of its own sum.`,
      caption: String.raw`Choose a series and the order $k$; drag $x$. Left: $f^{(k-1)}$ and $f^{(k)}$, both computed from differentiated series — the gold tangent to $f^{(k-1)}$ has slope $f^{(k)}(x)$. Right: the individual terms of the $k$-th derived series at $x$. Slide $x$ to $0$ and every bar except $n=k$ collapses, leaving $k!\,c_k$.`,
      deps: ['pma-8.1'],
      tags: ['power series', 'Taylor series'],
      viz(v) {
        const M = v.M;
        const OPT = {
          cos: { label: '$\\sum\\frac{(-1)^m}{(2m)!}x^{2m}$', c: (n) => (n % 2 ? 0 : ((n / 2) % 2 ? -1 : 1) / M.factorial(n)), x: [-4.2, 4.2], R: '\\infty', fixedY: [-1.45, 1.45], h0: 1.1 },
          geo: { label: '$\\sum x^n$', c: () => 1, x: [-0.62, 0.62], R: '1', h0: 0.22 },
          log: { label: '$\\sum\\frac{(-1)^{n+1}}{n}x^n$', c: (n) => (n === 0 ? 0 : (n % 2 ? 1 : -1) / n), x: [-0.62, 0.62], R: '1', h0: 0.22 },
        };
        const NMAX = 110;
        const dk = (o, k, x) => { let s = 0, p = 1; for (let n = k; n <= NMAX; n++) { const cn = o.c(n); if (cn) s += falling(n, k) * cn * p; p *= x; } return s; };
        const which = v.select('', Object.entries(OPT).map(([value, o]) => ({ value, label: o.label })), 'cos');
        const kS = v.slider('order $k$', 1, 6, 2, { int: true });
        const L = v.stage({ x: OPT.cos.x, y: [-1.45, 1.45], height: 320, title: '$f^{(k-1)}$ and $f^{(k)}$ from the differentiated series' });
        const B = v.stage({ x: [-0.7, 16.7], y: [-1, 1], height: 320, axes: 'box', xlabel: 'n', title: 'terms $n(n-1)\\cdots(n-k+1)\\,c_n x^{n-k}$ at the chosen $x$' });
        const hx = L.handle(1.1, 0, { color: 'gold', label: 'x', constrain: 'x' });
        let last = null, st = null;
        v.render(() => {
          const o = OPT[which.value], k = kS.value;
          if (last !== which.value) { last = which.value; L.setView(o.x, null); hx.x = o.h0; }
          hx.y = 0;
          const g0 = (x) => dk(o, k - 1, x), g1 = (x) => dk(o, k, x);
          // vertical range: fixed for the entire series, from the central part of the window otherwise
          let yr = o.fixedY;
          if (!yr) {
            let lo = 0, hi = 0;
            for (const x of M.linspace(o.x[0] * 0.7, o.x[1] * 0.7, 60)) for (const y of [g0(x), g1(x)]) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
            const pad = (hi - lo) * 0.15 || 1; yr = [lo - pad, hi + pad];
          }
          L.setView(null, yr);
          const x = M.clamp(hx.x, o.x[0], o.x[1]);
          const y0 = g0(x), slope = g1(x), y1 = slope;
          L.fn(g0, { color: 'blue', width: 2 });
          L.fn(g1, { color: 'purple', width: 2.6 });
          const span = (o.x[1] - o.x[0]) * 0.13;
          L.line(x - span, y0 - slope * span, x + span, y0 + slope * span, { color: 'gold', width: 2.2 });
          L.line(x, 0, x, y1, { color: 'muted', width: 1, dash: [3, 3] });
          L.dot(x, y0, { color: 'blue', r: 4.5 }); L.dot(x, y1, { color: 'purple', r: 4.5 });
          const atZero = g1(0);
          L.dot(0, atZero, { color: 'green', r: 5.5, label: `${k}!\\,c_${k}`, tex: true, labelPos: atZero >= 0 ? 'ne' : 'se' });
          // terms of the k-th derived series at x
          const terms = M.range(17).map((n) => (n < k ? 0 : falling(n, k) * o.c(n) * x ** (n - k)));
          let lo = Math.min(0, ...terms, y1), hi = Math.max(0, ...terms, y1);
          const pad = (hi - lo) * 0.12 || 0.5; B.setView(null, [lo - pad, hi + pad]);
          B.vband(-0.5, k - 0.5, { color: 'faint', alpha: 0.35 });
          B.text('n < k: terms differentiated away', -0.3, hi + pad * 0.45, { align: 'left', color: 'muted', size: 10.5 });
          B.bars(terms, { x0: 0, color: (_, n) => (n === k ? 'green' : 'gold'), barWidth: 0.72 });
          B.hline(y1, { color: 'purple', dash: [5, 4], width: 1.5 });
          B.text(`sum = f⁽ᵏ⁾(x) = ${v.fmt(y1, 4)}`, 16.4, y1, { align: 'right', baseline: y1 >= 0 ? 'bottom' : 'top', dy: y1 >= 0 ? -4 : 4, color: 'purple', size: 11.5 });
          const h = 1e-4, numSlope = (g0(x + h) - g0(x - h)) / (2 * h);
          st = { k, x, slope, numSlope, atZero, ck: o.c(k) };
          v.legend([['blue', '$f^{(k-1)}$'], ['purple', '$f^{(k)}$'], ['gold', 'tangent to $f^{(k-1)}$ at $x$'], ['green', '$f^{(k)}(0)=k!\\,c_k$', { dot: true }]]);
        });
        v.readout(() => {
          if (!st) return '';
          return `$k=${st.k}$, $x=${v.fix(st.x, 3)}$: derived series gives $f^{(k)}(x)=${v.fmt(st.slope, 6)}$; numerical slope of $f^{(k-1)}$ $=${v.fmt(st.numSlope, 6)}$. At $x=0$: $f^{(k)}(0)=${v.fmt(st.atZero, 6)}$ and $k!\\,c_k=${v.fmt(M.factorial(st.k) * st.ck, 6)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.2
    {
      num: '8.2',
      kind: 'Theorem',
      name: "Abel's theorem",
      statement: String.raw`Suppose $\sum_{n=0}^\infty c_n$ converges, and put $f(x)=\sum_{n=0}^{\infty} c_n x^n$ for $-1<x<1$. Then
$$\lim_{x\to 1^-} f(x)=\sum_{n=0}^{\infty} c_n .$$`,
      idea: String.raw`With partial sums $s_n=c_0+\dots+c_n$, summation by parts (3.41) gives $f(x)=(1-x)\sum_{n\ge0} s_n x^n$ for $|x|<1$. The weights $(1-x)x^n$ are positive and add up to $1$, so $f(x)-s=(1-x)\sum (s_n-s)x^n$. Choose $N$ with $|s_n-s|<\eps$ for $n>N$: the first $N$ terms carry total weight $\le (1-x)(N+1)$, which tends to $0$ as $x\to1$, and the rest contribute at most $\eps$.`,
      caption: String.raw`Drag $x$ toward $1$ along the graph of $f$. On the right, the orange bars are the weights $(1-x)x^n$ (they sum to $1$) and the dots are the partial sums $s_n$; $f(x)$ (gold line) is their weighted average. As $x\to1$ the weight slides out to large $n$, where $s_n$ is already close to $\sum c_n$. The divergent series $\sum(-1)^n$ shows the converse is false.`,
      deps: ['pma-3.41', 'pma-3.39'],
      tags: ['power series', 'Abel summation'],
      viz(v) {
        const M = v.M;
        const OPT = {
          log2: { label: '$\\sum\\frac{(-1)^n}{n+1}$', c: (n) => (n % 2 ? -1 : 1) / (n + 1), f: (x) => (x < 1e-9 ? 1 : Math.log1p(x) / x), s: Math.LN2, sTex: '\\log 2', y: [0.42, 1.08], conv: true },
          pi4: { label: '$\\sum\\frac{(-1)^n}{2n+1}$', c: (n) => (n % 2 ? -1 : 1) / (2 * n + 1), f: (x) => (x < 1e-9 ? 1 : Math.atan(Math.sqrt(x)) / Math.sqrt(x)), s: Math.PI / 4, sTex: '\\pi/4', y: [0.6, 1.06], conv: true },
          grandi: { label: '$\\sum(-1)^n$ (divergent)', c: (n) => (n % 2 ? -1 : 1), f: (x) => 1 / (1 + x), s: 0.5, sTex: '\\tfrac12', y: [-0.12, 1.12], conv: false },
        };
        const which = v.select('', Object.entries(OPT).map(([value, o]) => ({ value, label: o.label })), 'log2');
        const L = v.stage({ x: [-0.05, 1.07], y: OPT.log2.y, height: 320, xlabel: 'x', title: '$f(x)=\\sum c_n x^n$ on $[0,1)$' });
        const R = v.stage({ x: [-1, 60], y: OPT.log2.y, height: 320, axes: 'box', xlabel: 'n', title: 'partial sums $s_n$ and weights $(1-x)x^n$' });
        const hx = L.handle(0.9, OPT.log2.f(0.9), { color: 'gold', label: 'x', constrain: (x) => { const o = OPT[which.value]; const xx = M.clamp(x, 0, 0.995); return [xx, o.f(xx)]; } });
        let last = null, st = null;
        v.render(() => {
          const o = OPT[which.value];
          if (last !== which.value) { last = which.value; L.setView(null, o.y); }
          const x = hx.x; hx.y = o.f(x);
          const nMax = Math.round(M.clamp(4.5 * x / (1 - x) + 12, 30, 640));
          R.setView([-nMax * 0.02 - 0.5, nMax + 0.5], o.y);
          // partial sums and the Abel weighted average (1-x) Σ s_n x^n
          let s = 0, p = 1, avg = 0; const pts = [];
          for (let n = 0; n < 200000; n++) {
            s += o.c(n); if (n <= nMax) pts.push([n, s]);
            avg += s * p; p *= x; if (p < 1e-15 && n > nMax) break;
          }
          avg *= 1 - x;
          const fx = o.f(x);
          // left panel
          L.hline(o.s, { color: o.conv ? 'green' : 'orange', dash: [6, 4], width: 1.6 });
          L.tex((o.conv ? '\\textstyle\\sum c_n=' : '\\text{Abel limit }') + o.sTex, 0.3, o.s, { color: o.conv ? 'green' : 'orange', align: 'left', baseline: 'top', dy: 5, size: 14 });
          L.fn(o.f, { domain: [0, 0.9999], color: 'ink', width: 2.4 });
          L.dot(1, o.s, { hollow: true, color: o.conv ? 'green' : 'orange', r: 5 });
          L.line(x, fx, x, o.s, { color: 'gold', width: 2, dash: [3, 3] });
          // right panel: weights on a secondary scale along the bottom
          const [y0, y1] = o.y, wmax = 1 - x, H = (y1 - y0) * 0.32;
          const wts = []; let pw = 1;
          for (let n = 0; n <= nMax; n++) { wts.push((1 - x) * pw); pw *= x; }
          R.bars(wts.map((w) => y0 + (w / wmax) * H), { x0: 0, base: y0, color: 'orange', fillAlpha: 0.5, barWidth: nMax > 120 ? 1 : 0.8 });
          R.hline(o.s, { color: o.conv ? 'green' : 'orange', dash: [6, 4], width: 1.6 });
          R.hline(avg, { color: 'gold', width: 2.2 });
          R.dots(pts, { color: 'ink', r: nMax > 150 ? 1.6 : 2.6 });
          const mean = x / (1 - x);
          if (mean < nMax) R.vline(mean, { color: 'orange', dash: [2, 3], width: 1 });
          R.text('f(x) = weighted average', nMax * 0.98, avg, { align: 'right', baseline: avg > o.s ? 'bottom' : 'top', dy: avg > o.s ? -4 : 4, color: 'gold', size: 11.5, weight: 600 });
          st = { x, fx, avg, o };
          v.legend([['ink', 'partial sums $s_n$', { dot: true }], ['orange', 'weights $(1-x)x^n$', { area: true }], ['gold', '$f(x)=(1-x)\\sum s_n x^n$'], [o.conv ? 'green' : 'orange', o.conv ? '$\\sum c_n$' : 'Abel limit $\\frac12$', { dash: true }]]);
        });
        v.readout(() => {
          if (!st) return '';
          const { x, fx, avg, o } = st;
          const head = `$x=${v.fix(x, 3)}$: $f(x)=${v.fix(fx, 5)}$, $(1-x)\\sum s_nx^n=${v.fix(avg, 5)}$, distance to the limit $${texNum(Math.abs(fx - o.s))}$.`;
          return o.conv ? head + ` The series converges, so $f(x)\\to ${o.sTex}$.`
            : head + ' Here $s_n=1,0,1,0,\\dots$ does not converge, yet $f(x)\\to\\frac12$: a radial limit does not imply convergence — the converse of Abel\'s theorem fails.';
        });
      },
    },
    // ------------------------------------------------------------------ 8.3
    {
      num: '8.3',
      kind: 'Theorem',
      name: 'Interchanging the order of a double series',
      statement: String.raw`Let $\{a_{ij}\}$ $(i,j=1,2,3,\dots)$ be a double sequence. If $\sum_{j=1}^\infty |a_{ij}|=b_i$ for each $i$ and $\sum_i b_i$ converges, then
$$\sum_{i=1}^\infty\sum_{j=1}^\infty a_{ij}=\sum_{j=1}^\infty\sum_{i=1}^\infty a_{ij}.$$`,
      idea: String.raw`Take a sequence $x_n\to x_0$ and on $E=\{x_0,x_1,\dots\}$ define $f_i(x_0)=\sum_j a_{ij}$, $f_i(x_n)=\sum_{j\le n}a_{ij}$. Each $f_i$ is continuous at $x_0$ and $|f_i|\le b_i$, so $g=\sum_i f_i$ converges uniformly (M-test, 7.10) and is continuous at $x_0$ (7.11). Then $\sum_i\sum_j a_{ij}=g(x_0)=\lim_n g(x_n)=\lim_n\sum_{j\le n}\sum_i a_{ij}$.`,
      caption: String.raw`Choose a double array. Left: the first $7\times7$ entries (blue $>0$, orange $<0$) with their full row sums and column sums. Right: partial sums of the row sums (sum rows first) and of the column sums (sum columns first) as $m$ grows. Under absolute convergence both orders agree; the two other arrays have $\sum b_i=\infty$ and the orders give different answers.`,
      deps: ['pma-7.10', 'pma-7.11'],
      tags: ['series', 'double series'],
      viz(v) {
        const M = v.M;
        const OPT = {
          abs: { label: '$\\frac{(-1)^{i+j}}{(i+j)^3}$', a: (i, j) => ((i + j) % 2 ? -1 : 1) / (i + j) ** 3, absConv: true, text: false },
          diag: { label: '$a_{ii}=1,\\ a_{i,i+1}=-1$', a: (i, j) => (j === i ? 1 : j === i + 1 ? -1 : 0), absConv: false, text: true },
          anti: { label: '$\\frac{1}{i^2-j^2}$ ($i\\ne j$)', a: (i, j) => (i === j ? 0 : 1 / (i * i - j * j)), absConv: false, text: false },
        };
        const J = 40000, MM = 40, DSZ = 7;
        const short = (x) => (Math.abs(x) < 5e-4 ? '≈0' : v.fmt(x, 2).replace(/^(−?)0\./, '$1.'));
        const cache = {};
        function sums(key) {
          if (cache[key]) return cache[key];
          const a = OPT[key].a, rows = [], cols = [], babs = [];
          for (let i = 1; i <= MM; i++) {
            let r = 0, b = 0, c = 0;
            for (let j = 1; j <= J; j++) { const x = a(i, j); r += x; b += Math.abs(x); }
            for (let k = 1; k <= J; k++) c += a(k, i);
            rows.push(r); babs.push(b); cols.push(c);
          }
          const P = M.partialSums((k) => rows[k], MM), Q = M.partialSums((k) => cols[k], MM), Bs = M.partialSums((k) => babs[k], MM);
          return (cache[key] = { rows, cols, babs, P, Q, Bs });
        }
        const which = v.select('$a_{ij}=$', Object.entries(OPT).map(([value, o]) => ({ value, label: o.label })), 'abs');
        const mS = v.slider('outer terms $m$', 1, MM, 6, { int: true });
        const G = v.stage({ x: [-0.1, DSZ + 2.25], y: [-(DSZ + 2.3), 0.05], equal: true, axes: false, height: 440, title: 'the array, its row sums and column sums' });
        const S = v.stage({ x: [-0.5, MM + 0.8], y: [-1, 1], axes: 'box', height: 440, xlabel: 'm', title: 'outer partial sums: rows first vs. columns first' });
        let st = null;
        v.render(() => {
          const key = which.value, o = OPT[key], Z = sums(key), m = mS.value;
          let amax = 0; for (let i = 1; i <= DSZ; i++) for (let j = 1; j <= DSZ; j++) amax = Math.max(amax, Math.abs(o.a(i, j)));
          const cell = (x, y, val, scale, st2 = {}) => {
            const al = val === 0 ? 0 : 0.12 + 0.78 * Math.sqrt(Math.min(1, Math.abs(val) / scale));
            G.rect(x - 0.46, y - 0.46, x + 0.46, y + 0.46, { fill: val >= 0 ? 'blue' : 'orange', fillAlpha: al, color: 'grid', width: 1 });
            if (st2.text) G.text(st2.text, x, y, { align: 'center', size: st2.size || 10.5, color: 'ink', weight: 600 });
          };
          for (let i = 1; i <= DSZ; i++) for (let j = 1; j <= DSZ; j++) { const a = o.a(i, j); cell(j, -i, a, amax, { text: o.text && a ? (a > 0 ? '1' : '−1') : null }); }
          const rs = Math.max(...Z.rows.slice(0, DSZ).map(Math.abs), ...Z.cols.slice(0, DSZ).map(Math.abs), 1e-9);
          const rx = DSZ + 1.45, cy = -(DSZ + 1.45);
          for (let i = 1; i <= DSZ; i++) cell(rx, -i, Z.rows[i - 1], rs, { text: short(Z.rows[i - 1]), size: 10 });
          for (let j = 1; j <= DSZ; j++) cell(j, cy, Z.cols[j - 1], rs, { text: short(Z.cols[j - 1]), size: 10 });
          // highlight the first m rows / columns
          const mm = Math.min(m, DSZ);
          G.rect(0.5, -0.5, rx + 0.5, -(mm + 0.5), { color: 'blue', width: 2.2 });
          G.rect(0.5, -0.5, mm + 0.5, cy - 0.5, { color: 'purple', width: 2.2, dash: [5, 3] });
          G.text('Σⱼ', rx, -0.25, { align: 'center', color: 'blue', size: 12, weight: 600 });
          G.text('Σᵢ', 0.3, cy, { align: 'right', color: 'purple', size: 12, weight: 600 });
          G.text('j →', 1, -0.22, { align: 'center', color: 'muted', size: 11 });
          G.text('i ↓', 0.32, -1, { align: 'right', color: 'muted', size: 11 });
          if (m > DSZ) G.text(`… rows/cols up to ${m}`, rx + 0.5, cy - 0.8, { align: 'right', color: 'muted', size: 10.5 });
          // partial-sum panel
          const vals = [...Z.P, ...Z.Q];
          const lo = Math.min(...vals), hi = Math.max(...vals), pad = (hi - lo) * 0.14 || 0.5;
          S.setView(null, [lo - pad, hi + pad]);
          const lim = [Z.P[MM - 1], Z.Q[MM - 1]];
          S.hline(lim[0], { color: 'blue', dash: [6, 4], width: 1.2, alpha: 0.7 });
          S.hline(lim[1], { color: 'purple', dash: [6, 4], width: 1.2, alpha: 0.7 });
          S.path(Z.P.map((y, k) => [k + 1, y]), { color: 'blue', width: 4.5, alpha: 0.55 });
          S.dots(Z.P.map((y, k) => [k + 1, y]), { color: 'blue', r: 3.6 });
          S.path(Z.Q.map((y, k) => [k + 1, y]), { color: 'purple', width: 1.8 });
          S.dots(Z.Q.map((y, k) => [k + 1, y]), { color: 'purple', r: 2.2 });
          S.vline(m, { color: 'gold', width: 1.5 });
          S.dot(m, Z.P[m - 1], { color: 'blue', r: 5 }); S.dot(m, Z.Q[m - 1], { color: 'purple', r: 5 });
          const same = Math.abs(lim[0] - lim[1]) < 1e-3;
          S.corner(same ? 'both orders give the same sum' : 'the two orders disagree', 'tr', { color: same ? 'green' : 'red', weight: 600 });
          st = { m, P: Z.P[m - 1], Q: Z.Q[m - 1], lim, B: Z.Bs[MM - 1], absConv: o.absConv };
          v.legend([['blue', 'rows first: $\\sum_{i\\le m}\\sum_j a_{ij}$'], ['purple', 'columns first: $\\sum_{j\\le m}\\sum_i a_{ij}$'], ['blue', 'entry $>0$', { area: true }], ['orange', 'entry $<0$', { area: true }]]);
        });
        v.readout(() => {
          if (!st) return '';
          const b = st.absConv ? `$\\sum_{i\\le 40} b_i = ${v.fix(st.B, 4)}$ — the series of row absolute sums converges, so the theorem applies.`
            : `$\\sum_{i\\le 40} b_i = ${v.fix(st.B, 2)}$ and growing without bound — the hypothesis fails.`;
          return `$m=${st.m}$: rows first $${v.fix(st.P, 4)}$, columns first $${v.fix(st.Q, 4)}$; limits $\\sum_i\\sum_j a_{ij}\\approx ${v.fix(st.lim[0], 4)}$ and $\\sum_j\\sum_i a_{ij}\\approx ${v.fix(st.lim[1], 4)}$. ` + b;
        });
      },
    },
    // ------------------------------------------------------------------ 8.4
    {
      num: '8.4',
      kind: 'Theorem',
      name: 'Re-expanding a power series about a new centre',
      statement: String.raw`Suppose $f(x)=\sum c_n x^n$ with the series converging for $|x|<R$. If $-R<a<R$, then $f$ can be expanded in a power series about $a$ that converges for $|x-a|<R-|a|$, namely
$$f(x)=\sum_{n=0}^{\infty}\frac{f^{(n)}(a)}{n!}(x-a)^n\qquad(|x-a|<R-|a|).$$`,
      idea: String.raw`Write $x^n=((x-a)+a)^n$ and expand by the binomial theorem; this produces a double series $\sum_n\sum_m c_n\binom nm a^{n-m}(x-a)^m$. When $|x-a|+|a|<R$ it converges absolutely (its absolute version is $\sum|c_n|(|x-a|+|a|)^n$), so Theorem 8.3 lets us sum over $n$ first. The coefficient of $(x-a)^m$ is then identified as $f^{(m)}(a)/m!$ by the corollary of 8.1.`,
      caption: String.raw`Drag the new centre $a$ and raise the degree $N$. Gold is the degree-$N$ Taylor polynomial at $a$. The orange interval/disc is the radius $R-|a|$ that the theorem guarantees; the green dashed one is the true radius — the distance from $a$ to the nearest complex singularity — which can be larger, even reaching past the original interval.`,
      deps: ['pma-8.3', 'pma-8.1a'],
      tags: ['power series', 'Taylor series'],
      viz(v) {
        const M = v.M, { Cx } = v;
        const I = new Cx(0, 1);
        const OPT = {
          geo: { label: '$\\frac{1}{1-x}$', c: () => 1, f: (x) => 1 / (1 - x), coef: (a, m) => 1 / (1 - a) ** (m + 1), sing: [[1, 0]], rho: (a) => Math.abs(1 - a), y: [-1.6, 4.6] },
          rat: { label: '$\\frac{1}{1+x^2}$', c: (n) => (n % 2 ? 0 : ((n / 2) % 2 ? -1 : 1)), f: (x) => 1 / (1 + x * x), coef: (a, m) => { const A = new Cx(a, 0); return I.sub(A).pow(m + 1).inv().neg().add(I.neg().sub(A).pow(m + 1).inv()).div(new Cx(0, 2)).re; }, sing: [[0, 1], [0, -1]], rho: (a) => Math.hypot(1, a), y: [-0.9, 1.7] },
          log: { label: '$\\log(1+x)$', c: (n) => (n === 0 ? 0 : (n % 2 ? 1 : -1) / n), f: (x) => (x > -1 ? Math.log1p(x) : NaN), coef: (a, m) => (m === 0 ? Math.log1p(a) : (m % 2 ? 1 : -1) / (m * (1 + a) ** m)), sing: [[-1, 0]], rho: (a) => 1 + a, y: [-2.6, 1.6] },
        };
        // coefficient of (x-a)^m from the rearranged double series  Σ_n C(n,m) a^(n-m) c_n
        function viaDouble(o, a, m) {
          let s = 0, T = 1;
          for (let n = m; n < m + 6000; n++) { s += T * o.c(n); T *= ((n + 1) / (n + 1 - m)) * a; if (Math.abs(T) < 1e-17 && n > m + 40) break; }
          return s;
        }
        const which = v.select('$f(x)=$', Object.entries(OPT).map(([value, o]) => ({ value, label: o.label })), 'geo');
        const nS = v.slider('degree $N$', 1, 30, 8, { int: true });
        const L = v.stage({ x: [-2.15, 2.15], y: OPT.geo.y, height: 330, xlabel: 'x', title: 'real line: $f$ and its Taylor polynomial about $a$' });
        const Cp = v.stage({ x: [-2.1, 2.1], y: [-1.75, 1.75], equal: true, height: 330, title: 'complex plane: discs of convergence' });
        const ha = L.handle(-0.45, 0, { color: 'gold', label: 'a', constrain: (x) => [M.clamp(x, -0.95, 0.95), 0] });
        let last = null, st = null;
        v.render(() => {
          const o = OPT[which.value], N = nS.value, a = ha.x;
          if (last !== which.value) { last = which.value; L.setView(null, o.y); }
          const g = 1 - Math.abs(a), rho = o.rho(a);
          const d = M.range(N + 1).map((m) => o.coef(a, m));
          const P = (x) => { let s = 0, p = 1; for (let m = 0; m <= N; m++) { s += d[m] * p; p *= x - a; } return s; };
          // real panel
          L.vband(a - g, a + g, { color: 'orange', alpha: 0.12 });
          L.vline(a - rho, { color: 'green', dash: [6, 4], width: 1.6 }); L.vline(a + rho, { color: 'green', dash: [6, 4], width: 1.6 });
          L.vline(-1, { color: 'muted', dash: [2, 4], width: 1 }); L.vline(1, { color: 'muted', dash: [2, 4], width: 1 });
          L.fn(o.f, { color: 'muted', width: 1.4, dash: [4, 4] });
          L.fn(o.f, { domain: [-0.999, 0.999], color: 'ink', width: 2.4 });
          L.fn(P, { color: 'gold', width: 2.2 });
          L.dot(a, o.f(a), { color: 'gold', r: 4 });
          const yt = L.bounds.y[1];
          L.tex('-R', -1, yt, { color: 'muted', align: 'right', baseline: 'top', dx: -3, dy: 3, size: 13 });
          L.tex('R', 1, yt, { color: 'muted', align: 'left', baseline: 'top', dx: 3, dy: 3, size: 13 });
          // complex panel
          Cp.circle(0, 0, 1, { fill: 'blue', fillAlpha: 0.07, color: 'blue', width: 1.6 });
          Cp.circle(a, 0, g, { fill: 'orange', fillAlpha: 0.2, color: 'orange', width: 1.8 });
          Cp.circle(a, 0, rho, { color: 'green', width: 2, dash: [6, 4] });
          for (const [sx, sy] of o.sing) {
            const r = 0.07; Cp.line(sx - r, sy - r, sx + r, sy + r, { color: 'red', width: 2.4 }); Cp.line(sx - r, sy + r, sx + r, sy - r, { color: 'red', width: 2.4 });
          }
          Cp.dot(0, 0, { color: 'ink', r: 3, label: '0', labelPos: 'se' });
          Cp.dot(a, 0, { color: 'gold', r: 4.5, label: 'a', labelPos: 'sw' });
          Cp.text('|z| < R', 0.74, 0.8, { color: 'blue', math: true, size: 15, align: 'left', baseline: 'bottom' });
          Cp.corner('× singularity of f', 'br', { color: 'red' });
          // sup error of P on the guaranteed interval
          let err = 0; for (const x of M.linspace(a - g * 0.98, a + g * 0.98, 200)) err = Math.max(err, Math.abs(P(x) - o.f(x)));
          const chk = M.range(5).map((m) => Math.abs(viaDouble(o, a, m) - d[m]) / Math.max(1, Math.abs(d[m])));
          st = { a, g, rho, err, chk: Math.max(...chk), N, d };
          v.legend([['ink', '$f$ on $(-R,R)$'], ['gold', 'Taylor polynomial about $a$'], ['orange', 'guaranteed: $|x-a|<R-|a|$', { area: true }], ['green', 'actual radius', { dash: true }]]);
        });
        v.readout(() => {
          if (!st) return '';
          return `$a=${v.fix(st.a, 3)}$: guaranteed radius $R-|a|=${v.fix(st.g, 3)}$, actual radius $${v.fix(st.rho, 3)}$. Degree-$${st.N}$ error on $[a-0.98(R-|a|),\\,a+0.98(R-|a|)]$: $${texNum(st.err)}$. Coefficients $\\sum_n\\binom nm a^{n-m}c_n$ from the double series match $f^{(m)}(a)/m!$ for $m\\le4$ to relative error $${texNum(st.chk, 2)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.5
    {
      num: '8.5',
      kind: 'Theorem',
      name: 'Identity theorem for power series',
      statement: String.raw`Suppose $\sum a_n x^n$ and $\sum b_n x^n$ both converge on $S=(-R,R)$, and let $E$ be the set of $x\in S$ where their sums coincide. If $E$ has a limit point in $S$, then $a_n=b_n$ for every $n$; consequently the two sums agree on all of $S$.`,
      idea: String.raw`Let $h=\sum(a_n-b_n)x^n$ and let $A$ be the set of limit points of $E$ that lie in $S$. If $x_0\in A$, expand $h$ about $x_0$ (8.4). If some coefficient there were nonzero, the first one, say of order $k$, would give $h(x)=(x-x_0)^k g(x)$ with $g(x_0)\ne0$; by continuity $h\ne 0$ on a punctured neighbourhood, contradicting that zeros accumulate at $x_0$. So $h\equiv0$ near $x_0$ and $A$ is open; its complement in $S$ is open too, and $S$ is connected (2.47), so $A=S$. Then all $a_n-b_n=h^{(n)}(0)/n!=0$.`,
      caption: String.raw`$h$ plays the role of the difference of the two series; red dots are its zeros. Drag $x_0$ (it snaps to a zero). The orange window is the zero-free punctured neighbourhood of $x_0$, and the lower panel records its radius at every zero. For the power series $\sin\frac{\pi}{1-x}$ the zeros pile up only at $1\notin S$; for $x\sin\frac1x$ they pile up at $0\in S$ — possible only because it is not a power series.`,
      deps: ['pma-8.4', 'pma-8.1a', 'pma-2.47'],
      tags: ['power series', 'identity theorem'],
      viz(v) {
        const M = v.M;
        const OPT = {
          ps: { label: '$h(x)=\\sin\\frac{\\pi}{1-x}$ (a power series on $S$)', h: (x) => Math.sin(Math.PI / (1 - x)), zeros: M.range(400, 1).map((k) => 1 - 1 / k), acc: 1, isPS: true, dh: (x) => Math.cos(Math.PI / (1 - x)) * Math.PI / (1 - x) ** 2, x0: 0.5 },
          bad: { label: '$h(x)=x\\sin\\frac1x$ (not a power series)', h: (x) => (x === 0 ? 0 : x * Math.sin(1 / x)), zeros: M.range(400, 1).flatMap((k) => [1 / (k * Math.PI), -1 / (k * Math.PI)]).sort((p, q) => p - q), acc: 0, isPS: false, x0: 1 / (2 * Math.PI) },
        };
        const which = v.select('', Object.entries(OPT).map(([value, o]) => ({ value, label: o.label })), 'ps');
        const T = v.stage({ x: [-1.08, 1.08], y: [-1.35, 1.35], height: 270, full: true, xlabel: 'x', title: 'the difference $h$ on $S=(-1,1)$ and its zeros' });
        const B = v.stage({ x: [-1.08, 1.08], y: [0, 0.55], height: 170, full: true, axes: 'box', xticks: [], title: 'radius of the zero-free punctured neighbourhood at each zero' });
        const snap = (x) => { const Z = OPT[which.value].zeros; let best = Z[0]; for (const z of Z) if (Math.abs(z - x) < Math.abs(best - x)) best = z; return [best, 0]; };
        const hx = T.handle(0.5, 0, { color: 'gold', label: 'x₀', constrain: snap });
        let last = null, st = null;
        const gap = (Z, i) => Math.min(i > 0 ? Z[i] - Z[i - 1] : Infinity, i < Z.length - 1 ? Z[i + 1] - Z[i] : Infinity);
        v.render(() => {
          const o = OPT[which.value];
          if (last !== which.value) { last = which.value; hx.x = o.x0; }
          const Z = o.zeros, i0 = Z.indexOf(hx.x) >= 0 ? Z.indexOf(hx.x) : M.argmin(Z, (z) => Math.abs(z - hx.x));
          const x0 = Z[i0]; hx.x = x0; hx.y = 0;
          const dl = gap(Z, i0);
          const dmax = Math.max(...Z.map((_, i) => gap(Z, i)).filter(isFinite));
          const top = Math.min(0.62, dmax * 1.18); B.setView(null, [-0.12 * top, top]);
          // top
          T.vband(-1.08, -1, { color: 'faint', alpha: 0.35 }); T.vband(1, 1.08, { color: 'faint', alpha: 0.35 });
          T.vband(x0 - dl, x0 + dl, { color: 'orange', alpha: 0.13, edges: true });
          T.fn(o.h, { domain: [-0.999, o.isPS ? 0.9975 : 0.999], color: 'ink', width: 1.8, n: 5000 });
          T.dots(Z.filter((z) => Math.abs(z - o.acc) > 0.004).map((z) => [z, 0]), { color: 'red', r: 2.6 });
          T.dot(o.acc, 0, { color: o.isPS ? 'muted' : 'red', r: 6, hollow: true, width: 2.2 });
          T.text(o.isPS ? 'zeros accumulate at 1 ∉ S' : 'zeros accumulate at 0 ∈ S', o.acc + (o.isPS ? -0.02 : 0.03), -1.18, { align: o.isPS ? 'right' : 'left', color: o.isPS ? 'muted' : 'red', size: 11.5, weight: 600 });
          if (o.isPS) { const s = o.dh(x0), w = 0.06; T.line(x0 - w, -s * w, x0 + w, s * w, { color: 'green', width: 2.4 }); }
          // bottom: stems
          for (let i = 0; i < Z.length; i++) { const d = gap(Z, i); if (!isFinite(d) || Math.abs(Z[i] - o.acc) < 0.003) continue; B.line(Z[i], 0, Z[i], d, { color: 'red', width: 1.4, alpha: 0.75 }); }
          B.dot(x0, dl, { color: 'gold', r: 5 });
          B.line(x0, 0, x0, dl, { color: 'orange', width: 2.6 });
          B.vline(o.acc, { color: o.isPS ? 'muted' : 'red', dash: [4, 4], width: 1.2 });
          B.corner(o.isPS ? 'positive at every zero inside S; → 0 only at the boundary' : 'radius → 0 at 0, an interior point of S', 'tr', { color: o.isPS ? 'green' : 'red', weight: 600 });
          st = { o, x0, dl };
          v.legend([['ink', '$h$'], ['red', 'zeros of $h$', { dot: true }], ['orange', 'zero-free window about $x_0$', { area: true }], ...(o.isPS ? [['green', "slope $h'(x_0)\\ne0$: a simple zero"]] : [])]);
        });
        v.readout(() => {
          if (!st) return '';
          const { o, x0, dl } = st;
          return o.isPS
            ? `$x_0=${v.fix(x0, 4)}$: nearest other zero at distance $${v.fmt(dl, 3)}$, and $h'(x_0)=${v.fmt(o.dh(x0), 3)}\\ne0$. Every zero inside $S$ is isolated, so the zero set has no limit point in $S$ — consistent with $h\\not\\equiv 0$.`
            : `$x_0=${v.fix(x0, 4)}$: nearest other zero at distance $${v.fmt(dl, 3)}$. These zeros accumulate at $0\\in S$ although $h\\not\\equiv0$; the theorem is not violated because $x\\sin(1/x)$ is not even differentiable at $0$, let alone a power series.`;
        });
      },
    },
  ],
};
