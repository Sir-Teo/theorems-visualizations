// Rudin, Functional Analysis — Chapter 6 (part 3): localization and supports
//
// Numbering note: recalled, not checked against the book; uncertain items carry `verify: true`.

// ---------------------------------------------------------------- smooth building blocks
const PSI_P = (() => {
  const add = (a, b) => Array.from({ length: Math.max(a.length, b.length) }, (_, i) => (a[i] || 0) + (b[i] || 0));
  const mul = (a, b) => { const r = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; })); return r; };
  const der = (a) => (a.length > 1 ? a.slice(1).map((c, i) => c * (i + 1)) : [0]);
  const s = [1, 0, -1], s2 = mul(s, s), P = [[1]];
  for (let k = 0; k < 4; k++) { const p = P[k]; P.push(add(add(mul(der(p), s2), mul(mul([0, 4 * k], s), p)), mul([0, -2], p))); }
  return P;
})();
function psiD(k, x) {
  const s = 1 - x * x; if (!(s > 0)) return 0;
  const c = PSI_P[k]; let p = 0; for (let i = c.length - 1; i >= 0; i--) p = p * x + c[i];
  return p * Math.exp(-1 / s - 2 * k * Math.log(s));
}
const E1 = Math.E;
/** Test function with peak A at c and support [c − r, c + r], and its derivatives. */
const phiD = (k, x, c, r, A = 1) => A * E1 * psiD(k, (x - c) / r) / Math.pow(r, k);
function simpson(f, a, b, n) {
  if (!(b > a)) return 0;
  if (n % 2) n++;
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return s * h / 3;
}
/** C^∞ step: 0 for t ≤ 0, 1 for t ≥ 1. */
const hExp = (t) => (t > 0 ? Math.exp(-1 / t) : 0);
const step = (t) => { const a = hExp(t), b = hExp(1 - t); return a / (a + b); };
/** Derivative of the step (numerically safe, exact formula). */
function stepD(t) {
  if (t <= 0 || t >= 1) return 0;
  const a = hExp(t), b = hExp(1 - t), da = a / (t * t), db = -b / ((1 - t) * (1 - t));
  return (da * (a + b) - a * (da + db)) / ((a + b) * (a + b));
}
/** Plateau function: 1 on [a, b], 0 outside (a − d, b + d), smooth in between. */
const plateau = (x, a, b, d) => step((x - a + d) / d) * step((b + d - x) / d);
const plateauD = (x, a, b, d) => stepD((x - a + d) / d) / d * step((b + d - x) / d) - step((x - a + d) / d) * stepD((b + d - x) / d) / d;
const PAL = ['blue', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red'];
/** Draw a δ of weight w at x as an arrow, and a dipole w·δ' (up-arrow left, down-arrow right). */
function deltaArrow(S, x, w, unit, color, label) {
  if (Math.abs(w) < 1e-9) return;
  S.arrow(x, 0, x, w * unit, { color, width: 2.6, head: 9 });
  if (label) S.tex(label, x, w * unit, { color, dy: w > 0 ? -12 : 12, size: 14 });
}
function dipole(S, x, w, unit, color, label) {
  const h = 0.08, L = w * unit;
  S.arrow(x - h, 0, x - h, L, { color, width: 2.2, head: 8 });
  S.arrow(x + h, 0, x + h, -L, { color, width: 2.2, head: 8 });
  if (label) S.tex(label, x - h, L, { color, align: 'right', dx: -6, dy: L > 0 ? 4 : -4, size: 14 });
}

export default {
  collection: 'fa',
  chapter: 6,
  items: [
    // ------------------------------------------------------------------ localization
    {
      num: '6.19',
      kind: 'Definition',
      name: 'Distributions that agree, or vanish, on an open set',
      statement: String.raw`Let $\Lambda_1,\Lambda_2\in\mathscr D'(\Omega)$ and let $\omega\subset\Omega$ be open. One says $\Lambda_1=\Lambda_2$ **in $\omega$** if $\Lambda_1\varphi=\Lambda_2\varphi$ for every $\varphi\in\mathscr D(\omega)$; in particular $\Lambda$ **vanishes in $\omega$** if $\Lambda\varphi=0$ for all $\varphi\in\mathscr D(\omega)$. More generally the **restriction** of $\Lambda$ to $\omega$ is the distribution $\varphi\mapsto\Lambda\varphi$, $\varphi\in\mathscr D(\omega)$, in $\mathscr D'(\omega)$.`,
      idea: String.raw`A distribution has no values at points, but it does have a local behaviour: it can be restricted to open subsets. For $\Lambda_f$ with $f\in L^1_{loc}$, "$\Lambda_f=0$ in $\omega$" means $f=0$ a.e. in $\omega$. The next theorems say that this local information is coherent: a distribution is determined by its restrictions to the sets of an open cover, and compatible local pieces can be glued.`,
      deps: ['fa-6.7'],
      tags: ['distributions', 'localization'],
      verify: true,
    },
    {
      num: '6.20',
      kind: 'Theorem',
      name: 'Smooth partitions of unity',
      statement: String.raw`Let $\Gamma$ be a collection of open sets in $\R^n$ whose union is $\Omega$. Then there is a sequence $\psi_1,\psi_2,\ldots\in\mathscr D(\Omega)$ with $\psi_i\ge0$ such that
(a) each $\psi_i$ has its support in some member of $\Gamma$;
(b) $\sum_i\psi_i(x)=1$ for every $x\in\Omega$;
(c) to every compact $K\subset\Omega$ correspond $m$ and an open $W\supset K$ with $\psi_1+\dots+\psi_m=1$ on $W$ — so only finitely many $\psi_i$ are nonzero near $K$.`,
      idea: String.raw`Cover $\Omega$ by countably many balls $B_i'$ whose concentric doubles $B_i$ have closures inside members of $\Gamma$, chosen so that every compact set meets only finitely many $B_i$. Take $\varphi_i\in\mathscr D(B_i)$ with $0\le\varphi_i\le1$ and $\varphi_i=1$ on $B_i'$, and put
$$\psi_1=\varphi_1,\qquad\psi_{i+1}=(1-\varphi_1)\cdots(1-\varphi_i)\,\varphi_{i+1}.$$
Then $\psi_1+\dots+\psi_m=1-\prod_{i\le m}(1-\varphi_i)$ telescopically, which equals $1$ on $B_1'\cup\dots\cup B_m'$.`,
      caption: String.raw`$\Omega=(-3,3)$, covered by intervals (the bars below the axis) that crowd towards both ends. Each $\varphi_i$ is $1$ on a plateau and vanishes outside its interval; the stacked colours are $\psi_1,\dots,\psi_m$ built by the product formula. Raise $m$: the stack fills up to $1$ (black line $=1-\prod(1-\varphi_i)$) on the union of the first $m$ plateaus. Drag the ends of the compact set $K$: only finitely many $\psi_i$ touch it, and a finite partial sum is already $\equiv1$ near $K$ — even though infinitely many are needed near $\partial\Omega$.`,
      deps: ['fa-1.46'],
      see: ['rca-2.13', 'pma-10.8'],
      tags: ['partitions of unity', 'smooth functions'],
      verify: true,
      viz(v) {
        const M = v.M;
        const J = 12, t = M.range(J + 1).map((j) => 3 - 3 * Math.pow(0.55, j));
        const PL = [];   // plateaus [a, b] and transition widths, in the order R0, L0, R1, L1, …
        for (let j = 0; j < J; j++) {
          const d = 0.3 * (t[j + 1] - t[j]);
          PL.push({ a: t[j], b: t[j + 1], d }); PL.push({ a: -t[j + 1], b: -t[j], d });
        }
        const N = PL.length;
        const mS = v.slider('number of terms $m$', 1, N, 6, { int: true });
        const S = v.stage({ x: [-3.15, 3.15], y: [-0.62, 1.32], height: 380, full: true, axes: false, xticks: [-3, -2, -1, 0, 1, 2, 3], title: 'the stack $\\psi_1+\\dots+\\psi_m$ and the cover $\\Gamma$' });
        const hA = S.handle(-2.2, 1.18, { color: 'ink', r: 6, label: 'K', labelPos: 'n', constrain: (x) => [M.clamp(x, -2.98, 2.9), 1.18] });
        const hB = S.handle(1.2, 1.18, { color: 'ink', r: 6, constrain: (x) => [M.clamp(x, -2.9, 2.98), 1.18] });
        const xs = M.linspace(-3, 3, 1501);
        const phis = PL.map((p) => xs.map((x) => plateau(x, p.a, p.b, p.d)));
        let st = {};
        v.legend([['blue', '$\\psi_1,\\psi_2,\\ldots$ (stacked)', { area: true }], ['ink', '$1-\\prod_{i\\le m}(1-\\varphi_i)$'], ['muted', 'supports of $\\varphi_i$: the cover', { area: true }]]);
        v.render(() => {
          const m = mS.value, a = Math.min(hA.x, hB.x), b = Math.max(hA.x, hB.x);
          // cover
          PL.forEach((p, i) => {
            const y = -0.14 - 0.1 * (i % 4);
            S.line(p.a - p.d, y, p.b + p.d, y, { color: i < m ? PAL[i % PAL.length] : 'faint', width: i < m ? 4 : 2.5, alpha: i < m ? 0.8 : 0.6, cap: 'butt' });
          });
          S.line(-3, 0, 3, 0, { color: 'ink', width: 1.2 });
          S.dot(-3, 0, { hollow: true, color: 'ink', r: 4 }); S.dot(3, 0, { hollow: true, color: 'ink', r: 4 });
          // stacked ψ_i
          let prod = xs.map(() => 1), cum = xs.map(() => 0);
          for (let i = 0; i < m; i++) {
            const psi = xs.map((x, k) => prod[k] * phis[i][k]);
            const top = cum.map((c, k) => c + psi[k]);
            const pts = xs.map((x, k) => [x, top[k]]).concat(xs.map((x, k) => [x, cum[k]]).reverse());
            S.poly(pts, { fill: PAL[i % PAL.length], fillAlpha: 0.55, stroke: false });
            cum = top; prod = prod.map((q, k) => q * (1 - phis[i][k]));
          }
          S.path(xs.map((x, k) => [x, cum[k]]), { color: 'ink', width: 1.8 });
          S.hline(1, { color: 'muted', width: 1, dash: [4, 4] });
          // K
          S.line(a, 1.18, b, 1.18, { color: 'ink', width: 4 });
          S.vband(a, b, { color: 'ink', alpha: 0.05 });
          // bookkeeping
          const touch = PL.map((p, i) => i).filter((i) => PL[i].a - PL[i].d < b && PL[i].b + PL[i].d > a);
          let mK = 0;
          for (let mm = 1; mm <= N && !mK; mm++) {
            // merge the first mm plateaus (touching closed intervals merge) and ask whether K lies inside one piece's interior
            const iv = PL.slice(0, mm).map((p) => [p.a, p.b]).sort((u, w) => u[0] - w[0]), merged = [];
            for (const [lo, hi] of iv) { const L = merged[merged.length - 1]; if (L && lo <= L[1] + 1e-12) L[1] = Math.max(L[1], hi); else merged.push([lo, hi]); }
            if (merged.some(([lo, hi]) => lo < a && hi > b)) mK = mm;
          }
          const minOnK = Math.min(...xs.map((x, k) => (x >= a && x <= b ? cum[k] : 2)));
          S.corner(`K meets ${touch.length} of the supports`, 'tr', { color: 'ink', weight: 600 });
          st = { a, b, m, nT: touch.length, mK, minOnK };
        });
        v.readout(() => {
          const s = st;
          return `$K=[${v.fix(s.a, 2)},\\,${v.fix(s.b, 2)}]$ meets the supports of only $${s.nT}$ of the $\\psi_i$; ` + (s.mK ? `$\\psi_1+\\dots+\\psi_{${s.mK}}=1$ on a neighbourhood of $K$. ` : '') + `With $m=${s.m}$, $\\min_K\\sum_{i\\le m}\\psi_i = ${v.fix(s.minOnK, 4)}$.`;
        });
      },
    },
    {
      num: '6.21',
      kind: 'Theorem',
      name: 'Gluing compatible local distributions',
      statement: String.raw`Let $\Gamma$ be an open cover of $\Omega\subset\R^n$, and suppose that to each $\omega\in\Gamma$ a distribution $\Lambda_\omega\in\mathscr D'(\omega)$ is assigned so that $\Lambda_{\omega'}=\Lambda_{\omega''}$ in $\omega'\cap\omega''$ whenever this intersection is nonempty. Then there is exactly one $\Lambda\in\mathscr D'(\Omega)$ with $\Lambda=\Lambda_\omega$ in $\omega$ for every $\omega\in\Gamma$.`,
      idea: String.raw`Take a partition of unity $\{\psi_i\}$ subordinate to $\Gamma$ (6.20), with $\operatorname{supp}\psi_i\subset\omega_i\in\Gamma$, and define $\Lambda\varphi=\sum_i\Lambda_{\omega_i}(\psi_i\varphi)$ — a finite sum for each $\varphi$. Compatibility on overlaps makes the result independent of the partition and makes $\Lambda=\Lambda_\omega$ in each $\omega$; continuity holds on each $\mathscr D_K$ because only finitely many terms occur there. Uniqueness: two such $\Lambda$ agree in every $\omega$, so $\Lambda\varphi=\sum\Lambda(\psi_i\varphi)$ is determined.`,
      caption: String.raw`$\Omega=(-3,3)$ is covered by $\omega_1=(-3,0.9)$ and $\omega_2=(-0.9,3)$. On $\omega_1$ we are given $\Lambda_1=g+0.8\,\delta_{-1.8}$, on $\omega_2$ the distribution $\Lambda_2=g+0.6\,\delta'_{1.6}$; they agree on the overlap. The glued value $\Lambda_1(\psi_1\varphi)+\Lambda_2(\psi_2\varphi)$ uses a partition $\psi_1+\psi_2=1$ whose crossover $t$ you can slide. Bottom: that value as a function of $t$ — flat, so it does not depend on the partition. Switch on the incompatible data ($\Lambda_2$ gets an extra $\delta_{0.2}$ in the overlap): now the "glued" value moves with $t$, and no global $\Lambda$ exists.`,
      deps: ['fa-6.20', 'fa-6.19', 'fa-6.6'],
      tags: ['distributions', 'localization', 'sheaf property'],
      verify: true,
      viz(v) {
        const M = v.M;
        const bad = v.toggle('incompatible data (extra $\\delta_{0.2}$ in $\\Lambda_2$)', false);
        const tS = v.slider('crossover $t$ of the partition', -0.6, 0.6, 0.1, { step: 0.01 });
        const top = v.stage({ x: [-3.1, 3.1], y: [-1.05, 1.75], height: 290, full: true, axes: true, title: 'local data, the partition $\\psi_1+\\psi_2=1$ and the test function $\\varphi$' });
        const bot = v.stage({ x: [-0.65, 0.65], y: [-1, 1], height: 190, full: true, axes: 'box', xlabel: 't', title: 'glued value $\\Lambda_1(\\psi_1\\varphi)+\\Lambda_2(\\psi_2\\varphi)$ as the partition varies' });
        const hc = top.handle(0.5, 0, { color: 'blue', label: 'c', labelPos: 's', constrain: (x) => [M.clamp(x, -2, 2), 0] });
        const r = 1.35, w = 0.55;
        const g = (x) => 0.35 + 0.25 * Math.sin(1.5 * x);
        const psi1 = (x, t) => 1 - step((x - t + w / 2) / w), psi1D = (x, t) => -stepD((x - t + w / 2) / w) / w;
        const glued = (t, c, incons) => {
          const ph = (x) => phiD(0, x, c, r), phD = (x) => phiD(1, x, c, r);
          const h1 = (x) => psi1(x, t) * ph(x), h2 = (x) => (1 - psi1(x, t)) * ph(x);
          const h2D = (x) => -psi1D(x, t) * ph(x) + (1 - psi1(x, t)) * phD(x);
          let L1 = simpson((x) => g(x) * h1(x), c - r, c + r, 600) + 0.8 * h1(-1.8);
          let L2 = simpson((x) => g(x) * h2(x), c - r, c + r, 600) - 0.6 * h2D(1.6);
          if (incons) L2 += 0.7 * h2(0.2);
          return [L1, L2];
        };
        let st = {};
        v.legend([['purple', '$\\omega_1$, $\\Lambda_1$, $\\psi_1$'], ['orange', '$\\omega_2$, $\\Lambda_2$, $\\psi_2$'], ['blue', '$\\varphi$'], ['red', 'incompatible $\\delta_{0.2}$']]);
        v.render(() => {
          const t = tS.value, c = hc.x, inc = bad.value;
          top.line(-3, 1.6, 0.9, 1.6, { color: 'purple', width: 5, alpha: 0.75 });
          top.line(-0.9, 1.45, 3, 1.45, { color: 'orange', width: 5, alpha: 0.75 });
          top.tex('\\omega_1', -2.9, 1.6, { color: 'purple', align: 'left', dy: -12, size: 13 });
          top.tex('\\omega_2', 2.9, 1.45, { color: 'orange', align: 'right', dy: 12, size: 13 });
          top.vband(-0.9, 0.9, { color: 'ink', alpha: 0.05 });
          top.fn(g, { domain: [-3, 0.9], color: 'purple', width: 2 });
          top.fn(g, { domain: [-0.9, 3], color: 'orange', width: 2, dash: [5, 4] });
          deltaArrow(top, -1.8, 0.8, 1, 'purple', '0.8\\,\\delta_{-1.8}');
          dipole(top, 1.6, 0.6, 1, 'orange', "0.6\\,\\delta'_{1.6}");
          if (inc) deltaArrow(top, 0.2, 0.7, 1, 'red', '0.7\\,\\delta_{0.2}');
          top.fn((x) => psi1(x, t), { color: 'purple', width: 1.5, dash: [3, 3] });
          top.fn((x) => 1 - psi1(x, t), { color: 'orange', width: 1.5, dash: [3, 3] });
          top.fn((x) => phiD(0, x, c, r) - 0, { domain: [c - r, c + r], color: 'blue', width: 2.2, fill: 'blue', fillAlpha: 0.08 });
          // bottom
          const ts = M.linspace(-0.6, 0.6, 61), vals = ts.map((tt) => { const [a, b] = glued(tt, c, inc); return a + b; });
          const lo = Math.min(...vals), hi = Math.max(...vals), mid = (lo + hi) / 2, half = Math.max(0.25, (hi - lo) * 0.7);
          bot.setView(null, [mid - half, mid + half]);
          bot.path(ts.map((tt, i) => [tt, vals[i]]), { color: inc ? 'red' : 'green', width: 2.4 });
          const [L1, L2] = glued(t, c, inc);
          bot.dot(t, L1 + L2, { color: inc ? 'red' : 'green', r: 5.5 });
          st = { L1, L2, inc, spread: hi - lo };
        });
        v.readout(() => {
          const s = st;
          return `$\\Lambda_1(\\psi_1\\varphi) = ${v.fix(s.L1, 4)}$, $\\Lambda_2(\\psi_2\\varphi) = ${v.fix(s.L2, 4)}$, sum $${v.fix(s.L1 + s.L2, 4)}$. Over all partitions the sum varies by $${v.sci(s.spread, 2)}$` + (s.inc ? ' — the data disagree on the overlap, so they do not define a distribution on $\\Omega$.' : ' — independent of the partition: this is the glued $\\Lambda\\varphi$.');
        });
      },
    },
    // ------------------------------------------------------------------ supports
    {
      num: '6.22',
      kind: 'Definition',
      name: 'Support of a distribution',
      statement: String.raw`Let $\Lambda\in\mathscr D'(\Omega)$ and let $\omega$ be the union of all open sets $\omega'\subset\Omega$ in which $\Lambda$ vanishes. The **support** of $\Lambda$ is the relatively closed set $S_\Lambda=\Omega\setminus\omega$.`,
      idea: String.raw`By the gluing theorem 6.21 (applied to the zero distributions on the sets $\omega'$), $\Lambda$ vanishes on the union $\omega$ itself, so $\omega$ is the largest open set in which $\Lambda$ vanishes. For $\Lambda_f$ with $f$ continuous, $S_\Lambda$ is the usual support of $f$; $\operatorname{supp}\delta^{(k)}_p=\{p\}$; the support of p.v.$\frac1x$ is all of $\R$.`,
      deps: ['fa-6.21', 'fa-6.19'],
      tags: ['distributions', 'support'],
      verify: true,
    },
    {
      num: '6.23',
      kind: 'Theorem',
      name: 'What the support controls',
      statement: String.raw`Let $\Lambda\in\mathscr D'(\Omega)$ with support $S_\Lambda$.
(a) If $\varphi\in\mathscr D(\Omega)$ and $\operatorname{supp}\varphi\cap S_\Lambda=\varnothing$, then $\Lambda\varphi=0$.
(b) If $S_\Lambda=\varnothing$, then $\Lambda=0$.
(c) If $\psi\in C^\infty(\Omega)$ and $\psi=1$ on some open set containing $S_\Lambda$, then $\psi\Lambda=\Lambda$.`,
      idea: String.raw`(a) $\Lambda$ vanishes on the open set $\Omega\setminus S_\Lambda$, which contains $\operatorname{supp}\varphi$; (b) is (a) for every $\varphi$. For (c), $(\psi\Lambda-\Lambda)(\varphi)=\Lambda((\psi-1)\varphi)$, and $(\psi-1)\varphi$ vanishes on a neighbourhood of $S_\Lambda$, so its support misses $S_\Lambda$ and (a) applies. A neighbourhood is needed: $\psi$ must be $1$ near $S_\Lambda$, not just on it, because $\Lambda$ may differentiate.`,
      caption: String.raw`$\Lambda=g\cdot1_{[-2.2,-1.2]}+0.7\,\delta'_{0.9}+0.5\,\delta_{1.8}$; its support (red) is an interval and two points. Drag $\varphi$: whenever its support misses $S_\Lambda$, $\Lambda\varphi$ is exactly $0$. The orange cutoff $\psi$ equals $1$ on the support enlarged by the margin; the readout compares $\Lambda\varphi$ with $(\psi\Lambda)(\varphi)=\Lambda(\psi\varphi)$. They agree for every positive margin and part ways when the margin turns negative and $\psi$ stops being $1$ near $S_\Lambda$.`,
      deps: ['fa-6.22', 'fa-6.14'],
      tags: ['distributions', 'support'],
      verify: true,
      viz(v) {
        const M = v.M;
        const mS = v.slider('margin of $\\{\\psi=1\\}$ around $S_\\Lambda$', -0.25, 0.6, 0.25, { step: 0.01 });
        const rS = v.slider('width of $\\varphi$', 0.2, 1.5, 0.55, { step: 0.01 });
        const S = v.stage({ x: [-3, 3], y: [-1.05, 1.8], height: 330, full: true, axes: true, title: '$\\Lambda$ (purple), its support $S_\\Lambda$ (red), the cutoff $\\psi$ (orange) and $\\varphi$ (blue)' });
        const hc = S.handle(0.55, 0, { color: 'blue', label: 'c', labelPos: 's', constrain: (x) => [M.clamp(x, -2.8, 2.8), 0] });
        const g = (x) => 0.8 + 0.3 * Math.sin(5 * x);
        const COMP = [[-2.2, -1.2], [0.9, 0.9], [1.8, 1.8]], tw = 0.22;
        const Lam = (h, hD, lo, hi) => simpson((x) => g(x) * h(x), Math.max(-2.2, lo), Math.min(-1.2, hi), 400) - 0.7 * hD(0.9) + 0.5 * h(1.8);
        let st = {};
        v.legend([['purple', '$\\Lambda$'], ['red', '$S_\\Lambda$'], ['orange', 'cutoff $\\psi$'], ['blue', '$\\varphi$']]);
        v.render(() => {
          const m = mS.value, r = rS.value, c = hc.x;
          // ψ = 1 − ∏(1 − plateau_k)
          const pl = COMP.map(([a, b]) => [a - m, b + m]);
          const psi = (x) => 1 - pl.reduce((p, [a, b]) => p * (1 - (b >= a ? plateau(x, a, b, tw) : plateau(x, (a + b) / 2, (a + b) / 2, tw + (b - a) / 2))), 1);
          const psiD = (x) => (psi(x + 1e-5) - psi(x - 1e-5)) / 2e-5;
          // drawing
          S.vband(-3, 3, { color: 'green', alpha: 0.04 });
          S.fn((x) => g(x), { domain: [-2.2, -1.2], color: 'purple', width: 2.2, fill: 'purple', fillAlpha: 0.15 });
          dipole(S, 0.9, 0.7, 1, 'purple', "0.7\\,\\delta'_{0.9}");
          deltaArrow(S, 1.8, 0.5, 1, 'purple', '0.5\\,\\delta_{1.8}');
          S.line(-2.2, 0, -1.2, 0, { color: 'red', width: 6, alpha: 0.85, cap: 'butt' });
          S.dot(0.9, 0, { color: 'red', r: 5 }); S.dot(1.8, 0, { color: 'red', r: 5 });
          S.fn(psi, { color: 'orange', width: 1.8, dash: [6, 4], n: 1200 });
          S.fn((x) => phiD(0, x, c, r), { domain: [c - r, c + r], color: 'blue', width: 2.4, fill: 'blue', fillAlpha: 0.12 });
          const ph = (x) => phiD(0, x, c, r), phD = (x) => phiD(1, x, c, r);
          const val = Lam(ph, phD, c - r, c + r);
          const val2 = Lam((x) => psi(x) * ph(x), (x) => psiD(x) * ph(x) + psi(x) * phD(x), c - r, c + r);
          const miss = (c + r <= -2.2 || c - r >= -1.2) && Math.abs(c - 0.9) >= r && Math.abs(c - 1.8) >= r;
          S.corner(miss ? 'supp φ ∩ S_Λ = ∅  ⇒  Λφ = 0' : 'supp φ meets S_Λ', 'tl', { color: miss ? 'green' : 'muted', weight: 600 });
          st = { val, val2, miss, m };
        });
        v.readout(() => {
          const s = st;
          return `$\\Lambda\\varphi = ${v.fix(s.val, 5)}$${s.miss ? ' (exactly $0$: (a))' : ''}; $\\;(\\psi\\Lambda)(\\varphi)=\\Lambda(\\psi\\varphi) = ${v.fix(s.val2, 5)}$` + (s.m > 0 ? ' — equal, as (c) says, since $\\psi=1$ on a neighbourhood of $S_\\Lambda$.' : Math.abs(s.val - s.val2) > 1e-6 ? ' — different: $\\psi$ is no longer $1$ near $S_\\Lambda$.' : '.');
        });
      },
    },
  ],
};
