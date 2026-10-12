// Rudin, Real and Complex Analysis — Chapter 3: L^p-Spaces
// Part 3 of 3: a.e.-convergent subsequences, density of simple functions and of C_c, C_0 (3.12–3.17).

const fmtP = (p) => (p === Infinity ? '\\infty' : Number.isInteger(p) ? String(p) : String(+p.toFixed(2)));

/** Rudin's 1.17 approximant: phi_n(t) = 2^{-n} floor(2^n t) for t < n, and n for t >= n. */
const phiN = (n, t) => (t >= n ? n : Math.floor(t * 2 ** n) / 2 ** n);

export default {
  book: 'rca',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Theorem',
      name: 'Cauchy in Lᵖ ⇒ an a.e.-convergent subsequence',
      statement: String.raw`Let $1\le p\le\infty$ and let $\{f_n\}$ be a Cauchy sequence in $L^p(\mu)$ with limit $f$. Then some subsequence $\{f_{n_i}\}$ converges to $f(x)$ for almost every $x$.`,
      idea: String.raw`This is extracted from the proof of 3.11: for $p<\infty$ the fast subsequence with $\|f_{n_{i+1}}-f_{n_i}\|_p<2^{-i}$ has $\sum_i|f_{n_{i+1}}(x)-f_{n_i}(x)|<\infty$ a.e., so it converges a.e., and its pointwise limit agrees a.e. with the $L^p$-limit $f$. For $p=\infty$ the whole sequence converges uniformly off a null set. The whole sequence need not converge at any point.`,
      caption: String.raw`The "typewriter" sequence: $f_n$ is the indicator of the $j$-th dyadic interval of length $2^{-k}$, where $n=2^k+j$. Since $\|f_n\|_p=2^{-k/p}\to0$ it is Cauchy in $L^p$ ($p<\infty$) with limit $0$, yet every $x$ is swept over once per level, so $f_n(x)$ hits $1$ infinitely often and converges nowhere (right panel, blue). The green subsequence — one interval per level, of summable lengths — does converge to $0$ at every $x$ off a null set. Drag $x$ and play the sweep; choosing $p=\infty$ breaks the hypothesis.`,
      deps: ['rca-3.11'],
      tags: ['Lp spaces', 'convergence'],
      viz(v) {
        const M = v.M;
        const sub = v.select('subsequence', [{ value: 'left', label: 'leftmost blocks $n=2^k$' }, { value: 'chase', label: 'blocks containing $c=1/3$' }], 'left');
        const Ps = v.select('$p$', [{ value: 1, label: '$1$' }, { value: 2, label: '$2$' }, { value: Infinity, label: '$\\infty$' }], 1);
        const K = 6, NMAX = 2 ** K - 1; // levels k = 0..5, n = 1..63
        const A = v.stage({ x: [-0.01, 1.075], y: [-NMAX - 3, 0.3], height: 330, full: true, axes: false, title: 'all the $f_n$: row $n$ is shaded where $f_n=1$ (top row $n=1$)' });
        const B = v.stage({ x: [-0.02, 1.02], y: [-0.2, 1.3], height: 190, title: 'the current $f_n$' });
        const C = v.stage({ x: [0, 64], y: [-0.25, 1.35], height: 190, axes: 'box', title: '$n\\mapsto f_n(x)$ at the chosen $x$', yticks: [0, 1] });
        const hx = A.handle(0.62, -NMAX - 1.7, { color: 'accent', label: 'x', constrain: (x) => [M.clamp(x, 0.001, 0.999), -NMAX - 1.7] });
        hx.labelPos = 'e';
        const block = (n) => { const k = Math.floor(Math.log2(n)), j = n - 2 ** k; return [k, j / 2 ** k, (j + 1) / 2 ** k]; };
        const inSub = (n) => {
          const [k, a, b] = block(n);
          if (sub.value === 'left') return a === 0;
          return a <= 1 / 3 && 1 / 3 < b;
        };
        let st = {};
        v.animate((t) => {
          const p = Ps.value, x0 = hx.x;
          const cur = 1 + (Math.floor(t / 0.45) % NMAX);
          // left: the array of rows
          for (let n = 1; n <= NMAX; n++) {
            const [k, a, b] = block(n);
            const s = inSub(n);
            A.rect(a, -n + 0.42, b, -n - 0.42, { fill: s ? 'green' : 'accent', fillAlpha: s ? 0.75 : 0.42, stroke: false });
          }
          for (let k = 1; k < K; k++) A.hline(-(2 ** k) + 0.5, { color: 'muted', width: 0.8, alpha: 0.5 });
          const [ck, ca, cb] = block(cur);
          A.rect(ca, -cur + 0.6, cb, -cur - 0.6, { color: 'gold', width: 2.2 });
          A.vline(x0, { color: 'ink', width: 1.4, dash: [4, 3] });
          if (sub.value === 'chase') A.vline(1 / 3, { color: 'green', width: 1, dash: [2, 3] });
          for (let k = 2; k < K; k++) A.text(`k = ${k}`, 1.012, -(2 ** k) - (2 ** k - 1) / 2, { size: 11, color: 'muted', align: 'left' });
          A.text('k ≤ 1', 1.012, -2, { size: 11, color: 'muted', align: 'left' });
          // middle: current f_n
          B.fn((x) => (x >= ca && x <= cb ? 1 : 0), { color: 'gold', width: 2.6, fill: 'gold', fillAlpha: 0.2, domain: [0, 1], n: 1200 });
          B.vline(x0, { color: 'ink', width: 1.2, dash: [4, 3] });
          B.setTitle(p === Infinity ? 'the current $f_n$ — for $p=\\infty$: $\\|f_n-f_m\\|_\\infty=1$, not Cauchy' : 'the current $f_n$');
          B.texPx(`n = ${cur} = 2^{${ck}} + ${cur - 2 ** ck}`, B.width - 10, 8, { color: 'gold', align: 'right', baseline: 'top', size: 15 });
          // right: the sequence at x0
          const vals = [], subv = [];
          for (let n = 1; n <= NMAX; n++) { const [, a, b] = block(n); const y = x0 >= a && x0 < b ? 1 : 0; vals.push([n, y]); if (inSub(n)) subv.push([n, y]); }
          C.dots(vals, { color: 'accent', r: 2.6 });
          C.path(subv, { color: 'green', width: 1.6 });
          subv.forEach(([n, y]) => C.dot(n, y, { color: 'green', r: 4.5 }));
          C.vline(cur, { color: 'gold', width: 1, alpha: 0.7 });
          const lastSub = subv[subv.length - 1][1];
          C.corner(lastSub === 0 ? 'subsequence → 0 here' : 'subsequence stuck at 1 (x is the chased point)', 'tr', { color: lastSub === 0 ? 'green' : 'red', weight: 600 });
          const nrm = p === Infinity ? 1 : 2 ** (-ck / p);
          st = { p, cur, ck, nrm };
          v.legend([['accent', '$f_n=1$', { area: true }], ['green', 'subsequence $f_{n_k}$', { area: true }], ['gold', 'current $n$'], ['ink', 'the point $x$', { dash: true }]]);
        }, { period: NMAX * 0.45 });
        v.readout(() => st.p === Infinity
          ? `$\\|f_n\\|_\\infty = 1$ and $\\|f_n-f_m\\|_\\infty=1$ for $n\\ne m$: not Cauchy in $L^\\infty$, so 3.12 does not apply.`
          : `$\\|f_{${st.cur}}\\|_{${fmtP(st.p)}} = 2^{-${st.ck}/${fmtP(st.p)}} = ${v.fix(st.nrm, 4)} \\to 0$: Cauchy with limit $0$ in $L^{${fmtP(st.p)}}$; the full sequence diverges at every $x$, the subsequence converges a.e.`);
      },
    },

    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Theorem',
      name: 'Simple functions are dense in Lᵖ (p < ∞)',
      statement: String.raw`Let $S$ be the class of complex, measurable, simple functions $s$ on $X$ with $\mu(\{x:s(x)\ne0\})<\infty$. If $1\le p<\infty$, then $S$ is dense in $L^p(\mu)$.`,
      idea: String.raw`Clearly $S\subset L^p$. For $f\ge0$ in $L^p$ take the simple functions $0\le s_n\uparrow f$ of 1.17. Each $s_n$ satisfies $s_n^p\le f^p$, so its support has finite measure, and $|f-s_n|^p\le f^p$ lets dominated convergence (1.34) give $\|f-s_n\|_p\to0$. A complex $f$ is a combination of four nonnegative ones. (For $p=\infty$ the finite-measure requirement makes the statement false: the constant $1$ on $\R$ is far from $S$.)`,
      caption: String.raw`The staircases are Rudin's approximants $s_n=\varphi_n\circ f$ from 1.17 (values rounded down to multiples of $2^{-n}$ and capped at $n$). For the unbounded $x^{-1/3}$ the cap leaves a spike of error near $0$; for $1/(1+x)$ on $[0,\infty)$ the support of $s_n$ is the finite interval $[0,2^n-1]$ and the error is the tail. Raise $n$ to watch $\|f-s_n\|_p\to0$ (bottom); push $p$ out of range ($p\ge3$, resp. $p=1$) and $f$ itself leaves $L^p$.`,
      deps: ['rca-1.17', 'rca-1.34', 'rca-3.6'],
      tags: ['density', 'Lp spaces'],
      viz(v) {
        const M = v.M;
        // monotone decreasing examples, handled through the inverse x(y) and |x'(y)|
        const FN = {
          root: { label: '$x^{-1/3}$ on $(0,1]$', f: (x) => x ** (-1 / 3), y0: 1, y1: Infinity, xOf: (y) => y ** -3, dx: (y) => 3 * y ** -4, inLp: (p) => p < 3, normP: (p) => 1 / (1 - p / 3), view: [[-0.01, 1.01], [-0.4, 8.6]] },
          inv: { label: '$1/(1+x)$ on $[0,\\infty)$', f: (x) => 1 / (1 + x), y0: 0, y1: 1, xOf: (y) => 1 / y - 1, dx: (y) => y ** -2, inLp: (p) => p > 1, normP: (p) => 1 / (p - 1), view: [[-0.5, 20.5], [-0.1, 1.08]] },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'root');
        const Nn = v.slider('$n$', 1, 8, 3, { int: true });
        const P = v.slider('$p$', 1, 4, 2, { step: 0.05 });
        const T = v.stage({ x: FN.root.view[0], y: FN.root.view[1], height: 320, full: true });
        const B = v.stage({ x: [0.4, 8.6], y: [-0.15, 1], height: 170, full: true, axes: true, title: '$\\|f-s_n\\|_p$ for $n=1,\\dots,8$', xticks: [1, 2, 3, 4, 5, 6, 7, 8] });
        const cache = new Map();
        /** ∫ |f - s_n|^p dμ, computed in the value variable y with x = x(y). */
        function errP(key, n, p) {
          const id = `${key}|${n}|${p}`; if (cache.has(id)) return cache.get(id);
          const F = FN[key]; const d = 2 ** -n; let tot = 0;
          if (!F.inLp(p)) { cache.set(id, Infinity); return Infinity; }
          if (key === 'root') {
            // values y in [1, n): error y - floor_d(y); values above n: error y - n
            const steps = Math.max(1, Math.round((n - 1) / d));
            for (let k = 0; k < steps; k++) { const a = 1 + k * d; tot += M.integrate((y) => (y - a) ** p * F.dx(y), a, a + d, 8); }
            // part where f > n: ∫_0^{n^-3} (x^{-1/3} - n)^p dx = n^{p-3} ∫_0^1 (t^{-1/3} - 1)^p dt, with t = e^{-u}
            const C = M.integrate((u) => (Math.exp(u / 3) - 1) ** p * Math.exp(-u), 0, 700, 7000);
            tot += n ** (p - 3) * C;
          } else {
            // values y in (0, 1]: below d the approximant is 0 and the error is f itself
            tot += d ** (p - 1) / (p - 1);
            for (let k = 1; k * d < 1; k++) { const a = k * d; tot += M.integrate((y) => (y - a) ** p * F.dx(y), a, Math.min(1, a + d), 8); }
          }
          const r = tot ** (1 / p); cache.set(id, r); return r;
        }
        let last = null, st = {};
        v.render(() => {
          const key = which.value, F = FN[key], n = Nn.value, p = P.value;
          if (last !== key) { last = key; T.setView(...F.view); }
          const s = (x) => phiN(n, F.f(x));
          const lo = key === 'root' ? 1e-6 : 0;
          T.between((x) => F.f(x), s, Math.max(lo, T.bounds.x[0]), key === 'root' ? 1 : T.bounds.x[1], { fill: 'red', fillAlpha: 0.22, n: 1500 });
          T.fn(s, { domain: [lo, key === 'root' ? 1 : T.bounds.x[1]], color: 'accent', width: 1.8, fill: 'accent', fillAlpha: 0.18, n: 3000 });
          T.fn(F.f, { domain: [lo, key === 'root' ? 1 : T.bounds.x[1]], color: 'ink', width: 2.2 });
          if (key === 'root') {
            T.hline(n, { color: 'orange', width: 1.2, dash: [5, 4] });
            T.tex(`\\text{cap } n=${n}`, 0.3, n, { color: 'orange', baseline: 'bottom', dy: -3, size: 13 });
          } else {
            const e = 2 ** n - 1;
            if (e < T.bounds.x[1]) { T.vline(e, { color: 'orange', width: 1.4, dash: [5, 4] }); T.tex(`2^{${n}}-1`, e, 0.95, { color: 'orange', align: 'left', dx: 5, size: 13 }); }
            else T.corner(`supp sₙ = [0, ${e}] continues off-screen →`, 'tr', { color: 'orange', weight: 600 });
          }
          // error chart
          const errs = M.range(8, 1).map((k) => errP(key, k, p));
          const fin = errs.filter(isFinite), top = fin.length ? Math.max(...fin) * 1.15 : 1;
          B.setView(null, [-top * 0.15, top]);
          if (fin.length) B.bars(errs.map((e) => (isFinite(e) ? e : 0)), { x0: 1, color: (val, i) => (i + 1 === n ? 'accent' : 'gray'), fillAlpha: 0.75 });
          else B.corner('f ∉ Lᵖ for this p — the theorem does not apply', 'tl', { color: 'red', weight: 600 });
          const supp = key === 'root' ? 1 : 2 ** n - 1;
          st = { n, p, err: errs[n - 1], supp, inLp: F.inLp(p), norm: F.inLp(p) ? F.normP(p) ** (1 / p) : Infinity, key };
          v.legend([['ink', '$f$'], ['accent', '$s_n$', { area: true }], ['red', '$|f-s_n|$', { area: true }]]);
        });
        v.readout(() => (st.inLp
          ? `$\\|f\\|_{${fmtP(st.p)}} = ${v.fix(st.norm, 3)}$, $\\;\\|f-s_{${st.n}}\\|_{${fmtP(st.p)}} = ${v.fix(st.err, 4)}$, $\\;\\mu(\\{s_{${st.n}}\\ne0\\}) = ${st.supp} < \\infty$.`
          : `$f\\notin L^{${fmtP(st.p)}}$: $\\int|f|^p=\\infty$ ` + (st.key === 'root' ? '(the singularity at $0$ is too strong for $p\\ge3$).' : '(the tail is too fat for $p=1$).')));
      },
    },

    // ------------------------------------------------------------------ 3.14
    {
      num: '3.14',
      kind: 'Theorem',
      name: 'C_c(X) is dense in Lᵖ(μ) (p < ∞)',
      statement: String.raw`Let $X$ be a locally compact Hausdorff space and $\mu$ a measure on $X$ with the properties provided by the Riesz representation theorem (2.14). For $1\le p<\infty$, $C_c(X)$ is dense in $L^p(\mu)$.`,
      idea: String.raw`By 3.13 it suffices to approximate a simple $s$ whose support has finite measure. Lusin's theorem (2.24) gives $g\in C_c(X)$ with $g=s$ except on a set $E$ of measure $<\varepsilon$, and $|g|\le\|s\|_\infty$. Then $\|g-s\|_p\le2\|s\|_\infty\,\mu(E)^{1/p}<2\|s\|_\infty\varepsilon^{1/p}$. The exponent $1/p$ is where $p<\infty$ is used: in the sup norm the error never shrinks.`,
      caption: String.raw`On $\R$ with Lebesgue measure: $s$ is a step function, and $g_\delta\in C_c(\R)$ replaces each jump by a linear ramp of width $\delta$, so $g_\delta=s$ off the orange set $E$ with $\mu(E)\le(\#\text{jumps})\,\delta$ and $|g_\delta|\le\|s\|_\infty$ — exactly what Lusin's theorem provides. Shrink $\delta$: the $L^p$ error (blue, bottom) falls like $\delta^{1/p}$ under Rudin's bound $2\|s\|_\infty\mu(E)^{1/p}$, while the sup-norm error (red) stays at half the largest jump.`,
      deps: ['rca-3.13', 'rca-2.24', 'rca-2.14'],
      see: ['pma-11.38'],
      tags: ['density', 'approximation', 'Lp spaces'],
      viz(v) {
        const M = v.M;
        const D = v.slider('ramp width $\\delta$', 0.002, 0.07, 0.04, { log: true, decimals: 3 });
        const P = v.slider('$p$', 1, 8, 2, { step: 0.05 });
        let seed = 7;
        const make = () => {
          const r = v.rng(seed);
          let inner;
          do { inner = M.range(4).map(() => r.uniform(0.18, 0.9)).sort((a, b) => a - b); } while (inner.some((c, i) => c - (i ? inner[i - 1] : 0.1) < 0.08) || 0.98 - inner[3] < 0.08);
          const cuts = [0.1, ...inner, 0.98];
          const vals = M.range(5).map(() => +(r.uniform(-1, 1.6)).toFixed(2));
          return { cuts, vals };
        };
        let S = make();
        v.button('new step function', () => { seed += 1; S = make(); });
        const T = v.stage({ x: [-0.02, 1.08], y: [-1.45, 1.95], height: 300, full: true });
        const B = v.stage({ x: [Math.log10(0.0015), Math.log10(0.08)], y: [-2.3, 0.55], height: 190, full: true, axes: 'box', title: 'errors against $\\delta$ (log–log)', xticks: [0.002, 0.005, 0.01, 0.02, 0.05].map((t) => [Math.log10(t), String(t)]), yticks: [0.01, 0.03, 0.1, 0.3, 1, 3].map((t) => [Math.log10(t), String(t)]) });
        let st = {};
        v.render(() => {
          const d = D.value, p = P.value, { cuts, vals } = S;
          const sv = (x) => { for (let i = 0; i < vals.length; i++) if (x >= cuts[i] && x < cuts[i + 1]) return vals[i]; return 0; };
          // jumps (including the drop to 0 at both ends)
          const levels = [0, ...vals, 0];
          const jumps = cuts.map((c, i) => [c, levels[i + 1] - levels[i]]).filter(([, J]) => Math.abs(J) > 1e-9);
          const g = (x) => {
            for (const [c, J] of jumps) if (Math.abs(x - c) < d / 2) { const left = sv(c - d / 2 - 1e-9), right = sv(c + d / 2); return left + (right - left) * (x - (c - d / 2)) / d; }
            return sv(x);
          };
          const sInf = Math.max(...vals.map(Math.abs));
          const errAt = (dd, pp) => (jumps.reduce((acc, [, J]) => acc + dd * (Math.abs(J) / 2) ** pp / (pp + 1), 0)) ** (1 / pp);
          const supErr = Math.max(...jumps.map(([, J]) => Math.abs(J) / 2));
          const muE = jumps.length * d;
          // top panel
          T.between(sv, g, -0.02, 1.06, { fill: 'red', fillAlpha: 0.3, n: 2400 });
          T.fn(sv, { color: 'ink', width: 2, domain: [-0.02, 1.06], n: 2400 });
          T.fn(g, { color: 'accent', width: 2.4, domain: [-0.02, 1.06], n: 2400 });
          for (const [c] of jumps) T.line(c - d / 2, -1.3, c + d / 2, -1.3, { color: 'orange', width: 7, cap: 'butt' });
          T.text('E', jumps[0][0] - d / 2 - 0.012, -1.3, { color: 'orange', math: true, align: 'right' });
          // bottom: log-log errors
          const ds = M.linspace(Math.log10(0.0015), Math.log10(0.08), 80);
          B.path(ds.map((L) => [L, Math.log10(2 * sInf * (jumps.length * 10 ** L) ** (1 / p))]), { color: 'orange', width: 1.6, dash: [6, 4] });
          B.path(ds.map((L) => [L, Math.log10(errAt(10 ** L, p))]), { color: 'accent', width: 2.4 });
          B.hline(Math.log10(supErr), { color: 'red', width: 2 });
          B.vline(Math.log10(d), { color: 'muted', width: 1, dash: [3, 3] });
          B.dot(Math.log10(d), Math.log10(errAt(d, p)), { color: 'accent', r: 5 });
          st = { d, p, e: errAt(d, p), sup: supErr, muE, bound: 2 * sInf * muE ** (1 / p) };
          v.legend([['ink', 'step function $s$'], ['accent', '$g_\\delta\\in C_c$, and $\\|s-g_\\delta\\|_p$'], ['orange', '$E=\\{g_\\delta\\ne s\\}$, and the bound $2\\|s\\|_\\infty\\mu(E)^{1/p}$'], ['red', '$\\|s-g_\\delta\\|_\\infty$']]);
        });
        v.readout(() => `$\\mu(E) = ${v.fix(st.muE, 4)}$: $\\;\\|s-g_\\delta\\|_{${fmtP(st.p)}} = ${v.fix(st.e, 4)} \\le ${v.fix(st.bound, 4)}$, but $\\|s-g_\\delta\\|_\\infty = ${v.fix(st.sup, 3)}$ for every $\\delta$.`);
      },
    },

    // ------------------------------------------------------------------ 3.16
    {
      num: '3.16',
      kind: 'Definition',
      name: 'Functions vanishing at infinity; C₀(X)',
      statement: String.raw`A complex function $f$ on a locally compact Hausdorff space $X$ **vanishes at infinity** if for every $\varepsilon>0$ there is a compact $K\subset X$ with $|f(x)|<\varepsilon$ for all $x\notin K$. The continuous functions on $X$ that vanish at infinity form the class $C_0(X)$. Clearly $C_c(X)\subset C_0(X)$, and the two coincide when $X$ is compact.`,
      idea: String.raw`On $\R$ this just says $f(x)\to0$ as $|x|\to\infty$. Being continuous and integrable is not enough: a train of ever thinner spikes of height $1$ is in $L^1$ but does not vanish at infinity.`,
      caption: String.raw`Choose $f$ and $\varepsilon$. The orange interval is the smallest symmetric compact $K=[-R,R]$ outside which $|f|<\varepsilon$ (searched over $|x|\le40$). For $\arctan$ and the spike train no such $K$ exists — the red points are where $|f|\ge\varepsilon$ far out.`,
      deps: [],
      tags: ['continuous functions'],
      viz(v) {
        const M = v.M;
        const spikes = (x) => { const n = Math.round(x); if (n === 0) return 0; const w = 0.5 / (1 + n * n); return Math.max(0, 1 - Math.abs(x - n) / w); };
        const FN = {
          gauss: { label: '$e^{-x^2/4}$', f: (x) => Math.exp(-x * x / 4), c0: true },
          inv: { label: '$\\frac{1}{1+|x|}$', f: (x) => 1 / (1 + Math.abs(x)), c0: true },
          osc: { label: '$\\frac{\\sin 2x}{1+|x|}$', f: (x) => Math.sin(2 * x) / (1 + Math.abs(x)), c0: true },
          atan: { label: '$\\arctan x$', f: (x) => Math.atan(x), c0: false },
          spk: { label: 'spike train', f: spikes, c0: false },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'inv');
        const E = v.slider('$\\varepsilon$', 0.03, 0.6, 0.1, { log: true, decimals: 3 });
        const S = v.stage({ x: [-21, 21], y: [-1.75, 1.75], height: 320, full: true, yticks: [-1, -0.5, 0.5, 1, 1.5] });
        let st = {};
        v.render(() => {
          const F = FN[which.value], e = E.value;
          // largest |x| <= 40 with |f(x)| >= eps
          let R = 0;
          for (let i = 0; i <= 64000; i++) { const x = -40 + 80 * i / 64000; if (Math.abs(F.f(x)) >= e) R = Math.max(R, Math.abs(x)); }
          if (which.value === 'spk') R = 40; // the spikes at every integer reach height 1
          const found = F.c0 && R < 39.5;
          S.hband(-e, e, { color: 'accent', alpha: 0.13, edges: true });
          if (found) S.vband(-R, R, { color: 'orange', alpha: 0.13, edges: true });
          if (which.value === 'spk') {
            S.hline(0, { color: 'ink', width: 2 });
            for (let n = -21; n <= 21; n++) { if (!n) continue; const w = 0.5 / (1 + n * n); S.poly([[n - w, 0], [n, 1], [n + w, 0]], { fill: 'ink', fillAlpha: 0.5, color: 'ink', width: 1.6 }); }
          } else S.fn(F.f, { color: 'ink', width: 2, n: 4000 });
          if (found) {
            S.line(-R, -1.4, R, -1.4, { color: 'orange', width: 5, cap: 'butt' });
            S.tex(`K = [-${v.fix(R, 2)},\\, ${v.fix(R, 2)}]`, 0, -1.4, { color: 'orange', baseline: 'bottom', dy: -6, size: 14 });
          } else {
            const pts = [];
            if (which.value === 'spk') { for (let n = -21; n <= 21; n++) if (Math.abs(n) > 6) pts.push([n, 1]); }
            else for (let i = 0; i <= 4200; i++) { const x = -21 + 42 * i / 4200; if (Math.abs(x) > 6 && Math.abs(F.f(x)) >= e) pts.push([x, F.f(x)]); }
            S.dots(pts, { color: 'red', r: 2.2 });
            S.corner('|f| ≥ ε arbitrarily far out — no compact K works', 'tl', { color: 'red', weight: 600 });
          }
          S.tex('\\varepsilon', S.bounds.x[1], e, { color: 'accent', align: 'right', baseline: 'bottom', dx: -6, dy: -2 });
          st = { e, R, found, c0: F.c0 };
          v.legend([['ink', '$f$'], ['accent', '$|y|<\\varepsilon$', { area: true }], ['orange', 'compact $K$', { area: true }]]);
        });
        v.readout(() => (st.found ? `$|f(x)|<\\varepsilon=${v.fix(st.e, 3)}$ whenever $|x|>R=${v.fix(st.R, 3)}$; such an $R$ exists for every $\\varepsilon$, so $f\\in C_0(\\R)$.` : `For $\\varepsilon=${v.fix(st.e, 3)}$ there are points with $|f(x)|\\ge\\varepsilon$ at every distance: $f\\notin C_0(\\R)$.`));
      },
    },

    // ------------------------------------------------------------------ 3.17
    {
      num: '3.17',
      kind: 'Theorem',
      name: 'C₀(X) is the sup-norm completion of C_c(X)',
      statement: String.raw`If $X$ is a locally compact Hausdorff space, then $C_0(X)$ is the completion of $C_c(X)$ with respect to the metric of the supremum norm $\|f\|_\infty=\sup_{x\in X}|f(x)|$: $C_0(X)$ is complete in this norm and $C_c(X)$ is dense in it.`,
      idea: String.raw`Density: given $f\in C_0(X)$ and $\varepsilon>0$, take a compact $K$ with $|f|<\varepsilon$ off $K$ and, by Urysohn's lemma (2.12), $g\in C_c(X)$ with $0\le g\le1$ and $g=1$ on $K$; then $fg\in C_c(X)$ and $\|f-fg\|_\infty<\varepsilon$. Completeness: a uniform limit of continuous functions is continuous, and if $\|f_n-f\|_\infty<\varepsilon/2$ with $|f_n|<\varepsilon/2$ off a compact $K$, then $|f|<\varepsilon$ off $K$.`,
      caption: String.raw`The cut-off $\varphi_R$ is an Urysohn function: $1$ on $K=[-R,R]$, falling linearly to $0$ on $[R,R+1]$. Then $h=f\varphi_R\in C_c(\R)$ (blue), and the red band is $|f-h|$. Drag $R$ or the handle: for $f\in C_0$ the sup-error (bottom) tends to $0$. For $\arctan$ it is stuck at $\pi/2$ — no function in $C_c$ comes closer, so $\arctan$ is not in the closure.`,
      deps: ['rca-3.16', 'rca-2.12'],
      see: ['pma-7.15'],
      tags: ['continuous functions', 'completeness', 'density'],
      viz(v) {
        const M = v.M;
        const FN = {
          lor: { label: '$\\frac{1}{1+x^2}$', f: (x) => 1 / (1 + x * x), lim: 0 },
          osc: { label: '$\\frac{\\sin 3x}{1+|x|}$', f: (x) => Math.sin(3 * x) / (1 + Math.abs(x)), lim: 0 },
          slow: { label: '$(1+|x|)^{-1/2}$', f: (x) => 1 / Math.sqrt(1 + Math.abs(x)), lim: 0 },
          atan: { label: '$\\arctan x$ (not $C_0$)', f: (x) => Math.atan(x), lim: Math.PI / 2 },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'osc');
        const T = v.stage({ x: [-16, 16], y: [-1.85, 1.85], height: 300, full: true, yticks: [-1, -0.5, 0.5, 1, 1.5] });
        const B = v.stage({ x: [0, 14.5], y: [0, 1.75], height: 170, full: true, axes: 'box', xlabel: 'R', title: '$\\sup_x|f(x)-f(x)\\varphi_R(x)|$ as a function of $R$' });
        const hR = T.handle(4, -1.6, { color: 'orange', label: 'R', constrain: (x) => [M.clamp(x, 0.3, 14), -1.6] });
        const phi = (R, x) => { const a = Math.abs(x); return a <= R ? 1 : a >= R + 1 ? 0 : R + 1 - a; };
        // sup over |x| >= R of |f|(1 - phi_R): sampled out to R + 60, plus the limit of |f| at infinity
        const supErr = (F, R) => { let m = F.lim; for (let i = 0; i <= 3000; i++) { const x = R + 60 * i / 3000; m = Math.max(m, Math.abs(F.f(x)) * (1 - phi(R, x)), Math.abs(F.f(-x)) * (1 - phi(R, -x))); } return m; };
        const curves = {};
        let st = {};
        v.render(() => {
          const F = FN[which.value], R = hR.x, f = F.f;
          const h = (x) => f(x) * phi(R, x);
          T.vband(-R, R, { color: 'orange', alpha: 0.08 });
          T.between((x) => Math.max(f(x), h(x)), (x) => Math.min(f(x), h(x)), -16, 16, { fill: 'red', fillAlpha: 0.32, n: 1600 });
          T.fn(f, { color: 'ink', width: 1.6, n: 1600 });
          T.fn(h, { color: 'accent', width: 2.6, n: 1600 });
          T.fn((x) => 0.25 * phi(R, x) - 1.6, { color: 'orange', width: 1.6, n: 800 });
          T.line(-R, -1.6, R, -1.6, { color: 'orange', width: 4, cap: 'butt' });
          T.text('K', -R / 2, -1.6, { color: 'orange', math: true, dy: -12 });
          const e = supErr(F, R);
          // bottom: error curve
          const Rs = M.linspace(0.3, 14.5, 120);
          curves[which.value] ||= Rs.map((r) => [r, supErr(F, r)]);
          const cv = curves[which.value];
          B.setView(null, [0, Math.max(0.3, ...cv.map((q) => q[1])) * 1.18]);
          B.path(cv, { color: 'red', width: 2.2 });
          B.vline(R, { color: 'muted', width: 1, dash: [3, 3] });
          B.dot(R, e, { color: 'red', r: 5 });
          if (which.value === 'atan') { B.hline(Math.PI / 2, { color: 'muted', width: 1, dash: [6, 4] }); B.tex('\\pi/2', 14.4, Math.PI / 2, { color: 'muted', align: 'right', baseline: 'bottom', dy: -2, size: 13 }); }
          st = { R, e, atan: which.value === 'atan' };
          v.legend([['ink', '$f$'], ['accent', '$h=f\\varphi_R\\in C_c(\\R)$'], ['red', '$|f-h|$', { area: true }], ['orange', 'cut-off $\\varphi_R$ (scaled) and $K$']]);
        });
        v.readout(() => `$R=${v.fix(st.R, 2)}$: $\\;\\|f-f\\varphi_R\\|_\\infty = ${v.fix(st.e, 4)}$` + (st.atan ? ' — does not tend to $0$: $\\arctan\\notin C_0(\\R)$, so it is not a uniform limit of $C_c$ functions.' : ' $\\to0$ as $R\\to\\infty$, because $f$ vanishes at infinity.'));
      },
    },
  ],
};
