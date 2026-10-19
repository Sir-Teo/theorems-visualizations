// Rudin, Real and Complex Analysis — Chapter 11 (part 4): representation theorems.

// ---------------------------------------------------------------- helpers shared by this file
const TAU = 2 * Math.PI;
/** P(z, e^{it}) = (1 − |z|²)/|e^{it} − z|² at z = x + iy. */
const Pz = (x, y, t) => { const dx = Math.cos(t) - x, dy = Math.sin(t) - y; return (1 - x * x - y * y) / (dx * dx + dy * dy); };
/** Harmonic measure at z = x+iy of the arc {e^{it} : a < t < b} = P[χ_arc](z), exact. */
function arcMeasure(x, y, a, b) {
  const d = Math.atan2(Math.sin(b) - y, Math.cos(b) - x) - Math.atan2(Math.sin(a) - y, Math.cos(a) - x);
  return (((d % TAU) + TAU) % TAU) / Math.PI - (b - a) / TAU;
}
/** A cached colour-mapped scalar field with iso-lines on stage S; call the returned function inside render. */
function fieldLayer(v, S) {
  let cache = null;
  return (fn, { key, res = 2, range = [-1, 1], cmap = 'diverging', step = 0, offset = 0, lines = 0.35, alpha = 1 }) => {
    const W = Math.ceil(S.width / res), H = Math.ceil(S.height / res), ink = v.rgb('ink');
    const k = `${W}x${H}|${S.bounds.x}|${S.bounds.y}|${key}|${range}|${step}|${offset}|${cmap}|${ink}`;
    if (!cache || cache.k !== k) {
      const val = new Float64Array(W * H);
      for (let j = 0; j < H; j++) { const y = S.invY((j + 0.5) * res); for (let i = 0; i < W; i++) val[j * W + i] = fn(S.invX((i + 0.5) * res), y); }
      const cols = new Array(W * H);
      for (let p = 0; p < W * H; p++) {
        const z = val[p]; if (!isFinite(z)) { cols[p] = null; continue; }
        let c = v.M.cmap((z - range[0]) / (range[1] - range[0]), cmap);
        if (step && z >= range[0] && z <= range[1]) {
          const lv = (q) => Math.floor((q - offset) / step), L = lv(z), i = p % W, q1 = i + 1 < W ? val[p + 1] : NaN, q2 = p + W < W * H ? val[p + W] : NaN;
          if ((isFinite(q1) && lv(q1) !== L) || (isFinite(q2) && lv(q2) !== L)) c = c.map((x, m) => x + (ink[m] - x) * lines);
        }
        cols[p] = c;
      }
      cache = { k, cols };
    }
    let n = 0; const cols = cache.cols;
    S.raster(() => cols[n++], { key: cache.k, res, alpha, id: 'field' });
  };
}
/** Phase-portrait colour of w = re + i im (hue = arg, bands = log₂|w|). */
function phaseRGB(M, re, im) {
  if (!isFinite(re) || !isFinite(im)) return [250, 250, 250];
  const t = M.fract(Math.log2(Math.hypot(re, im) + 1e-300));
  return M.hsl2rgb(Math.atan2(im, re) / TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
}
const cxTeX = (v, p, d = 3) => `${v.fix(p[0], d)} ${p[1] < 0 ? '-' : '+'} ${v.fix(Math.abs(p[1]), d)}\\,i`;
const PI_TICKS = [[-Math.PI, '−π'], [-Math.PI / 2, '−π/2'], [0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']];
const onCircle = (x, y) => { const m = Math.hypot(x, y) || 1; return [x / m, y / m]; };

export default {
  collection: 'rca',
  chapter: 11,
  items: [
    {
      num: '11.29',
      kind: 'Theorem',
      name: 'Bounded sequences of functionals have weak* convergent subsequences',
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Theorem 11.29 and proof, pp. 246–247'],
      statement: String.raw`Let $X$ be a separable Banach space and $\{\Lambda_n\}$ a sequence of linear functionals on $X$ with $\sup_n\|\Lambda_n\|=M<\infty$. Then some subsequence $\{\Lambda_{n_i}\}$ converges pointwise on $X$: the limit $\Lambda x=\lim_{i\to\infty}\Lambda_{n_i}x$ exists for every $x\in X$, and $\Lambda$ is a linear functional with $\|\Lambda\|\le M$.`,
      idea: String.raw`Take a countable dense set $\{x_1,x_2,\dots\}$. The numbers $\Lambda_nx_1$ are bounded by $M\|x_1\|$, so (Bolzano–Weierstrass) some infinite $S_1\subset\N$ makes them converge; inside $S_1$ choose $S_2$ along which $\Lambda_nx_2$ converges, and so on. The **diagonal** sequence — the $i$-th element of $S_i$ — is eventually inside every $S_k$, so it makes $\Lambda_nx_k$ converge for all $k$. The uniform bound $M$ and density give convergence at every $x$ by an $\eps/3$ argument, and linearity and $\|\Lambda\|\le M$ pass to the limit. This is the compactness behind 11.30 (applied to $X=C(T)$, whose dual is the space of measures, 6.19).`,
      caption: String.raw`$X=C(T)$ and $\Lambda_n f=f(e^{in})$, point evaluations of norm $1$ wandering densely around $T$ (faint). Stage $k$ of the diagonal process keeps only the indices for which $\Lambda_n$ of the next test function ($\cos t,\sin t,\dots,\sin3t$, then round again with finer intervals) lies in a halved interval, so the gold arc containing the survivors shrinks; $n_k$ is the next surviving index. Right: $\Lambda_{n_k}g$ for three $g$ — two from the dense set and a bump that is not — settle down, while the original sequence $\Lambda_kg$ (faint) never does. The limit is $\Lambda=\delta_\zeta$.`,
      deps: ['rca-5.2', 'rca-6.19'],
      see: ['fa-3.17', 'fa-3.15'],
      tags: ['weak* compactness', 'diagonal process'],
      viz(v) {
        const N = 400000, K = 14;
        const tests = [(t) => Math.cos(t), (t) => Math.sin(t), (t) => Math.cos(2 * t), (t) => Math.sin(2 * t), (t) => Math.cos(3 * t), (t) => Math.sin(3 * t)];
        // the diagonal process (computed once): stage k halves (twice) the value interval of one test function,
        // cycling through the dense set, so that S_1 ⊃ S_2 ⊃ … and every Λ_n g_j is pinned down along S_k
        let S = Array.from({ length: N }, (_, i) => i + 1);
        const stages = [], picks = [], J = tests.map(() => [-1, 1]);
        let prev = 0;
        for (let k = 0; k < K; k++) {
          const gi = k % tests.length, g = tests[gi];
          let [lo, hi] = J[gi];
          for (let b = 0; b < 2; b++) {
            const mid = (lo + hi) / 2, left = S.filter((n) => g(n) < mid), right = S.filter((n) => g(n) >= mid);
            const pick = left.length >= right.length ? [left, lo, mid] : [right, mid, hi];
            if (pick[0].length < 30 || !pick[0].some((n) => n > prev)) break;
            [S, lo, hi] = pick;
          }
          J[gi] = [lo, hi];
          const next = S.find((n) => n > prev);
          picks.push(next); prev = next;
          stages.push({ S: S.slice(0, 800), all: S.slice(), size: S.length, test: gi, J: [lo, hi] });
        }
        const zeta = picks[K - 1];
        const kS = v.slider('stage $k$', 1, K, 6, { int: true });
        const L = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, height: 330, axes: false, title: 'points $e^{in}$, the arc of $S_k$, the diagonal $n_1<n_2<\\cdots$' });
        const R = v.stage({ x: [0.5, K + 0.5], y: [-1.15, 1.15], height: 330, axes: 'box', xlabel: 'k', title: '$\\Lambda_{n_k}g$ (bold) versus $\\Lambda_k g$ (faint)' });
        const bump = (t) => Math.exp(-3 * (1 - Math.cos(t - 1))) * 1.6 - 0.6;
        const G = [{ g: tests[0], c: 'accent', lab: '$\\cos t$' }, { g: tests[5], c: 'teal', lab: '$\\sin 3t$' }, { g: bump, c: 'purple', lab: 'a bump (not in the dense set)' }];
        let st = null;
        v.render(() => {
          const k = kS.value, stg = stages[k - 1];
          const raw = [];
          for (let n = 1; n <= 1500; n++) raw.push([Math.cos(n), Math.sin(n)]);
          L.circle(0, 0, 1, { color: 'ink', width: 1.4 });
          L.dots(raw, { color: 'faint', r: 1.5 });
          // the arc containing S_k (relative to the limit point)
          const zt = Math.atan2(Math.sin(zeta), Math.cos(zeta));
          let a0 = Infinity, a1 = -Infinity;
          for (const n of stg.all) { const d = Math.atan2(Math.sin(n - zt), Math.cos(n - zt)); a0 = Math.min(a0, d); a1 = Math.max(a1, d); }
          L.curve((t) => [1.07 * Math.cos(zt + t), 1.07 * Math.sin(zt + t)], a0, a1, { color: 'gold', width: 7 });
          const pts = picks.slice(0, k).map((n) => [Math.cos(n), Math.sin(n)]);
          L.path(pts.map(([x, y]) => [0.93 * x, 0.93 * y]), { color: 'ink', width: 1, alpha: 0.5 });
          pts.forEach((p, j) => L.dot(0.93 * p[0], 0.93 * p[1], { color: 'ink', r: j === k - 1 ? 5 : 3.2 }));
          const last = picks[k - 1];
          L.tex(`n_{${k}}=${last}`, 0.93 * Math.cos(last), 0.93 * Math.sin(last), { color: 'ink', size: 14, align: 'right', dx: -12 });
          if (k > 1) L.tex(`n_1=${picks[0]}`, 0.93 * Math.cos(picks[0]), 0.93 * Math.sin(picks[0]), { color: 'ink', size: 13, align: 'right', dx: -10 });
          L.tex('S_{' + k + '}', 1.2 * Math.cos(zt + (a0 + a1) / 2), 1.2 * Math.sin(zt + (a0 + a1) / 2) + 0.08, { color: 'gold', size: 15 });
          L.corner(`indices left after stage ${k}: ${stg.size.toLocaleString('en-US')} of ${N.toLocaleString('en-US')}`, 'bl', { color: 'muted' });
          L.dot(Math.cos(zeta), Math.sin(zeta), { color: 'green', r: 7, hollow: true, width: 2.2 });
          L.tex('\\zeta', Math.cos(zeta) * 1.17, Math.sin(zeta) * 1.17 - 0.1, { color: 'green', size: 16 });
          // right: values
          for (const { g, c } of G) {
            R.path(Array.from({ length: K }, (_, j) => [j + 1, g(j + 1)]), { color: c, width: 1, alpha: 0.35 });
            const pk = picks.slice(0, k).map((n, j) => [j + 1, g(n)]);
            R.path(pk, { color: c, width: 2.6 });
            R.dots(pk, { color: c, r: 3 });
            R.hline(g(zeta), { color: c, width: 1, dash: [3, 4], alpha: 0.7 });
          }
          R.vline(k, { color: 'ink', width: 1, dash: [3, 3] });
          st = { k, n: picks[k - 1], size: stg.size, test: stg.test, J: stg.J, spread: G.map(({ g }) => Math.abs(g(picks[k - 1]) - g(zeta))) };
          v.legend(G.map(({ c, lab }) => [c, lab]).concat([['gold', 'arc containing $\\{e^{in}: n\\in S_k\\}$'], ['ink', 'diagonal points $e^{in_j}$', { dot: true }]]));
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const names = ['\\cos t', '\\sin t', '\\cos 2t', '\\sin 2t', '\\cos 3t', '\\sin 3t'];
          return `Stage $${s.k}$ restricts $\\Lambda_n(${names[s.test]})$ to $[${v.fix(s.J[0], 3)},\\,${v.fix(s.J[1], 3)}]$; $n_{${s.k}}=${s.n}$. Distance of $\\Lambda_{n_k}g$ from the limit $g(\\zeta)$: $${s.spread.map((x) => v.fix(x, 4)).join(',\\ ')}$ — and $\\|\\delta_\\zeta\\|=1=M$.`;
        });
      },
    },
    {
      num: '11.30',
      kind: 'Theorem',
      name: 'Harmonic functions with bounded Lᵖ means are Poisson integrals',
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Theorem 11.30 and complete proof, pp. 247–248'],
      statement: String.raw`Let $u$ be harmonic in $U$, write $u_r(e^{i\theta})=u(re^{i\theta})$, and let $1\le p\le\infty$.
(a) If $\sup_{0<r<1}\|u_r\|_1<\infty$, then $u=P[d\mu]$ for a unique complex Borel measure $\mu$ on $T$.
(b) If $1<p\le\infty$ and $\sup_{0<r<1}\|u_r\|_p<\infty$, then $u=P[f]$ for a unique $f\in L^p(T)$.
(c) If $u>0$ in $U$, then $u=P[d\mu]$ for a unique positive Borel measure $\mu$ on $T$.
Conversely, every $P[d\mu]$ satisfies $\|u_r\|_1\le\|\mu\|$, and every $P[f]$ with $f\in L^p$ satisfies $\|u_r\|_p\le\|f\|_p$.`,
      idea: String.raw`For each $r$, $u_r$ is continuous on $T$ and $u(rz)=P[u_r](z)$ by 11.9. The measures $u_r\,d\sigma$ are bounded in $C(T)^*=M(T)$ (6.19), so by 11.29 some sequence $r_j\to1$ has $u_{r_j}d\sigma\to\mu$ weak*; letting $j\to\infty$ in $u(r_jz)=\int P(z,\cdot)\,u_{r_j}d\sigma$ gives $u=P[d\mu]$. For $p>1$ use $L^p=(L^q)^*$ instead (6.16) to get a weak* limit $f\in L^p$. For $u>0$, the mean value property gives $\|u_r\|_1=u(0)$, so (a) applies and the limit is positive. Uniqueness: the Fourier coefficients of $\mu$ are read off from $u$.`,
      caption: String.raw`Choose $u$. Right: $\log\|u_r\|_p$ for $p=1,2,\infty$ as $r\to1$ (horizontal axis $1-r$, log scale). Bottom: the distribution functions $\theta\mapsto\int_{-\pi}^{\theta}u_r\,d\sigma$ for $r=0.5,0.8,0.95,0.99$ — they converge (weak*) to the dashed distribution of $\mu$. Bounded data: all norms bounded, $u=P[f]$, $f\in L^\infty$. $\log|1-z|$: $\|u_r\|_\infty\to\infty$ but $\|u_r\|_2$ stays bounded, so $f\in L^2$. A point mass: only $\|u_r\|_1=1$ stays bounded — $\mu=\delta_1$. The conjugate kernel $\operatorname{Im}\frac{1+z}{1-z}$: even $\|u_r\|_1\to\infty$, and the distributions run off to $-\infty$ near $0$: no measure.`,
      deps: ['rca-11.29', 'rca-11.9', 'rca-6.19', 'rca-6.16', 'rca-11.5'],
      tags: ['Poisson integral', 'representation', 'positive harmonic functions'],
      viz(v) {
        const EX = {
          arc: { label: 'bounded data', u: (x, y) => 2 * arcMeasure(x, y, -0.8, 1.4) - 0.6, range: 1.5, limF: (th) => (2 * Math.max(0, Math.min(th, 1.4) - -0.8)) / TAU - (0.6 * (th + Math.PI)) / TAU },
          log: { label: '$\\log|1-z|$', u: (x, y) => 0.5 * Math.log((1 - x) ** 2 + y * y), range: 2 },
          atom: { label: 'point mass $P(z,1)$', u: (x, y) => Pz(x, y, 0), range: 6, limF: (th) => (th >= 0 ? 1 : 0) },
          conj: { label: '$\\operatorname{Im}\\frac{1+z}{1-z}$', u: (x, y) => (2 * y) / ((1 - x) ** 2 + y * y), range: 6, limF: (th) => Math.log(Math.abs(Math.sin(th / 2))) / Math.PI, bad: true },
        };
        // ∫_{−π}^{θ} log|1−e^{it}| dσ, by the (convergent) Fourier series log|1−e^{it}| = −Σ cos(nt)/n
        EX.log.limF = (th) => { let s = 0; for (let n = 1; n <= 400; n++) s -= Math.sin(n * th) / (n * n); return s / TAU; };
        const which = v.select('$u$', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'atom');
        const D = v.stage({ x: [-1.2, 1.2], y: [-1.2, 1.2], equal: true, height: 300, axes: false, title: 'the harmonic function $u$' });
        const LX = [[0, '1'], [1, '0.1'], [2, '0.01'], [3, '0.001']];
        const R = v.stage({ x: [0, 3.05], y: [-1, 2], height: 300, axes: 'box', xticks: LX, xlabel: '1 − r', title: '$\\log_{10}\\|u_r\\|_p$, $\\;p=1,2,\\infty$' });
        const B = v.stage({ x: [-Math.PI, Math.PI], y: [-1, 1.2], height: 190, full: true, axes: 'box', xticks: PI_TICKS, title: 'distribution functions $\\int_{-\\pi}^{\\theta}u_r\\,d\\sigma$ and the limit measure' });
        const heat = fieldLayer(v, D);
        const cache = {};
        const compute = (k) => {
          const u = EX[k].u, rows = [];
          for (let i = 1; i <= 36; i++) {
            const e = (3 * i) / 36, r = 1 - 10 ** -e, M = Math.min(60000, Math.max(2048, Math.ceil(40 / (1 - r))));
            let n1 = 0, n2 = 0, ni = 0;
            for (let j = 0; j < M; j++) { const t = -Math.PI + (TAU * j) / M, w = Math.abs(u(r * Math.cos(t), r * Math.sin(t))); n1 += w; n2 += w * w; ni = Math.max(ni, w); }
            rows.push([e, n1 / M, Math.sqrt(n2 / M), ni]);
          }
          const cdfs = [0.5, 0.8, 0.95, 0.99].map((r) => {
            const M = 4000, out = []; let acc = 0;
            for (let j = 0; j <= M; j++) { const t = -Math.PI + (TAU * j) / M; if (j) { const tm = t - Math.PI / M; acc += u(r * Math.cos(tm), r * Math.sin(tm)) / M; } out.push([t, acc]); }
            return out;
          });
          return { rows, cdfs };
        };
        let st = null;
        v.render(() => {
          const k = which.value, E = EX[k];
          cache[k] ||= compute(k);
          const { rows, cdfs } = cache[k];
          heat((x, y) => (x * x + y * y < 1 ? E.u(x, y) : NaN), { key: k, range: [-E.range, E.range], step: E.range / 8, offset: E.range / 16 });
          D.circle(0, 0, 1, { color: 'ink', width: 1.4 });
          // norms
          const lg = (x) => Math.log10(Math.max(x, 1e-12));
          let lo = Infinity, hi = -Infinity;
          for (const r of rows) for (const q of r.slice(1)) { lo = Math.min(lo, lg(q)); hi = Math.max(hi, lg(q)); }
          R.setView([0, 3.05], [Math.max(-1.2, Math.min(lo, -0.2)) - 0.15, Math.max(hi, 0.5) + 0.25]);
          R.hline(0, { color: 'muted', width: 1, dash: [2, 3] });
          [['accent', 1], ['teal', 2], ['orange', 3]].forEach(([c, j]) => R.path(rows.map((r) => [r[0], lg(r[j])]), { color: c, width: 2.4 }));
          const end = rows[rows.length - 1];
          // distribution functions
          let blo = Infinity, bhi = -Infinity;
          for (const cd of cdfs) for (const p of cd) { blo = Math.min(blo, p[1]); bhi = Math.max(bhi, p[1]); }
          if (E.limF) for (let i = 0; i <= 400; i++) { const t = -Math.PI + (TAU * i) / 400, y = E.limF(t); if (isFinite(y)) { blo = Math.min(blo, Math.max(y, -2.5)); bhi = Math.max(bhi, y); } }
          const pad = 0.1 * (bhi - blo + 0.2);
          B.setView(null, [blo - pad, bhi + pad]);
          cdfs.forEach((cd, j) => B.path(cd, { color: 'gold', width: 1.4 + 0.45 * j, alpha: 0.3 + 0.23 * j }));
          if (E.limF) {
            const pts = []; for (let i = 0; i <= 800; i++) { const t = -Math.PI + (TAU * i) / 800; pts.push([t, k === 'conj' && Math.abs(t) < 0.01 ? NaN : E.limF(t)]); }
            if (k === 'atom') { B.line(-Math.PI, 0, 0, 0, { color: E.bad ? 'red' : 'ink', width: 2, dash: [6, 4] }); B.line(0, 1, Math.PI, 1, { color: 'ink', width: 2, dash: [6, 4] }); B.dot(0, 1, { color: 'ink', r: 3.5 }); }
            else B.path(pts, { color: E.bad ? 'red' : 'ink', width: 2, dash: [6, 4] });
          }
          D.corner(E.bad ? 'not a Poisson integral' : k === 'atom' ? 'u = P[dμ], μ = δ₁ ≥ 0' : k === 'log' ? 'u = P[f], f ∈ Lᵖ (p < ∞)' : 'u = P[f], f ∈ L∞', 'tl', { color: E.bad ? 'red' : 'green', weight: 600 });
          st = { k, end, rows };
          v.legend([['accent', '$\\|u_r\\|_1$'], ['teal', '$\\|u_r\\|_2$'], ['orange', '$\\|u_r\\|_\\infty$'], ['gold', '$\\int_{-\\pi}^\\theta u_r\\,d\\sigma$, $r=0.5,\\dots,0.99$'], [EX[k].bad ? 'red' : 'ink', EX[k].bad ? 'pointwise limit: unbounded, not a measure' : 'distribution of $\\mu$', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const [, n1, n2, ni] = s.end;
          const verdict = { arc: 'all three stay bounded: (b) with $p=\\infty$.', log: '$\\|u_r\\|_2$ stays bounded although $\\|u_r\\|_\\infty$ does not: (b) with $p=2$ (indeed every $p<\\infty$).', atom: '$\\|u_r\\|_1=u(0)=1$ for all $r$ but $\\|u_r\\|_2\\to\\infty$: by (a) and (c) $u=P[d\\mu]$ with $\\mu=\\delta_1\\ge0$, and no $L^p$ density exists.', conj: '$\\|u_r\\|_1$ grows like $\\log\\frac{1}{1-r}$, so $u$ is not the Poisson integral of any measure.' }[s.k];
          return `At $r=0.999$: $\\|u_r\\|_1=${v.fix(n1, 3)}$, $\\|u_r\\|_2=${v.fix(n2, 3)}$, $\\|u_r\\|_\\infty=${v.fix(ni, 1)}$ — ${verdict}`;
        });
      },
    },
    {
      num: '11.32',
      kind: 'Theorem',
      name: 'Bounded holomorphic functions have radial limits a.e.',
      credit: 'Fatou, 1906',
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Theorem 11.32 and complete proof, p. 249'],
      statement: String.raw`Let $f$ be a bounded holomorphic function in $U$ ($f\in H^\infty$). Then the radial limit
$$f^*(e^{i\theta})=\lim_{r\to1}f(re^{i\theta})$$
exists at almost every point of $T$ (indeed $f$ has nontangential limits a.e.), $f^*\in L^\infty(T)$ with $\|f^*\|_\infty=\sup_U|f|$, and $f=P[f^*]$: $f$ is the Poisson integral of its boundary function. If $f^*=0$ almost everywhere on a nonempty open arc of $T$, then $f\equiv0$ in $U$.`,
      idea: String.raw`Apply 11.30(b) with $p=\infty$ to the bounded harmonic functions $\operatorname{Re}f$ and $\operatorname{Im}f$: $f=P[g]$ for some $g\in L^\infty(T)$, and $\|g\|_\infty\le\sup|f|$. By 11.23 (or 11.24), $P[g]$ has nontangential limit $g$ at almost every point, so $f^*$ exists a.e. and equals $g$. Finally $|f|=|P[f^*]|\le\|f^*\|_\infty$ gives the equality of norms. For the uniqueness clause, rotate the zero arc finitely many times to cover $T$ and form the corresponding finite product of rotated copies of $f$. That product has boundary values zero a.e., hence is identically zero by the norm equality. If $f$ were nonzero, its zero set and those of the finitely many rotated factors would be countable, contradicting that the product vanishes everywhere. The limit may fail along tangential curves: for the singular inner function $S(z)=\exp\big(-\frac{1+z}{1-z}\big)$, $|S|$ is constant on each horocycle at $1$, while the radial limit there is $0$.`,
      caption: String.raw`Phase portrait of $f$ in $U$. Drag $\zeta$ on $T$: on the right the radial path $r\mapsto f(r\zeta)$ (gold) runs inside the closed unit disc to the boundary value $f^*(\zeta)$ (green), which lies on $|w|=1$ for the inner functions $S$ and $B$ (a Blaschke product whose zeros pile up at $e^{2i}$). For $S$ at $\zeta=1$ the radial limit is $0$, but along the red horocycle $|S|\equiv e^{-1}$. Drag $z$: the readout recomputes $f(z)$ from the boundary values alone, as $P[f^*](z)$.`,
      deps: ['rca-11.30', 'rca-11.23', 'rca-11.9'],
      see: ['rca-10.24'],
      tags: ['H∞', 'boundary values', 'Fatou'],
      viz(v) {
        const { Cx } = v.M;
        const one = new Cx(1, 0);
        const ZER = Array.from({ length: 22 }, (_, j) => { const k = j + 1; return Cx.polar(1 - 0.72 ** k, 2 + 0.9 * 0.72 ** k * Math.sin(1.7 * k)); });
        const FN = {
          S: { label: 'singular inner $S$', f: (z) => one.add(z).div(one.sub(z)).neg().exp(), star: (t) => (Math.abs(t) < 1e-12 ? new Cx(0, 0) : Cx.polar(1, -1 / Math.tan(t / 2))), M: 200000 },
          B: { label: 'Blaschke product $B$', f: (z) => ZER.reduce((p, a) => p.mul(a.sub(z).div(one.sub(a.conj().mul(z))).scale(a.abs()).div(a)), one), M: 16384 },
          P: { label: '$\\frac{z+z^2}{2}$', f: (z) => z.add(z.mul(z)).scale(0.5), M: 4096 },
        };
        FN.B.star = (t) => FN.B.f(Cx.polar(1, t));
        FN.P.star = (t) => FN.P.f(Cx.polar(1, t));
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'S');
        const L = v.stage({ x: [-1.15, 1.15], y: [-1.15, 1.15], equal: true, height: 340, axes: false, title: 'phase portrait of $f$ in $U$' });
        const R = v.stage({ x: [-1.2, 1.2], y: [-1.2, 1.2], equal: true, height: 340, axes: false, title: 'values: the radial path $f(r\\zeta)$, $0\\le r<1$' });
        const zeta = L.handle(Math.cos(0.5), Math.sin(0.5), { color: 'ink', r: 6.5, label: 'ζ', labelPos: 'ne', constrain: (x, y) => { const t = Math.atan2(y, x); return Math.abs(t) < 0.06 ? [1, 0] : onCircle(x, y); } });
        const z = L.handle(-0.35, -0.3, { color: 'accent', label: 'z', labelPos: 'sw', constrain: (x, y) => { const m = Math.hypot(x, y); return m > 0.95 ? [0.95 * x / m, 0.95 * y / m] : [x, y]; } });
        const pcache = {};
        let st = null;
        v.render(() => {
          const k = which.value, F = FN[k];
          L.raster((x, y) => { if (x * x + y * y >= 1) return null; const w = F.f(new Cx(x, y)); return phaseRGB(v.M, w.re, w.im); }, { key: k, res: 2 });
          L.circle(0, 0, 1, { color: 'ink', width: 1.4 });
          if (k === 'B') for (const a of ZER) L.dot(a.re, a.im, { color: 'ink', r: 1.8 });
          const th = Math.atan2(zeta.y, zeta.x);
          L.line(0, 0, zeta.x, zeta.y, { color: 'gold', width: 2.2 });
          const hc = 1;
          if (k === 'S') L.circle(hc / (1 + hc), 0, 1 / (1 + hc), { color: 'red', width: 1.8, dash: [5, 4] });
          // radial path in the image plane
          const path = [];
          for (let i = 0; i <= 600; i++) { const r = i < 300 ? (0.99 * i) / 300 : 1 - 10 ** (-2 - (3 * (i - 300)) / 300); const w = F.f(Cx.polar(r, th)); path.push([w.re, w.im]); }
          R.circle(0, 0, 1, { color: 'ink', width: 1.6 });
          R.circle(0, 0, 1, { fill: 'muted', fillAlpha: 0.05, stroke: false });
          if (k === 'S') { R.circle(0, 0, Math.exp(-hc), { color: 'red', width: 1.8, dash: [5, 4] }); R.tex('|S|=e^{-1}\\ \\text{on the horocycle}', 0, -Math.exp(-hc), { color: 'red', size: 12, dy: 12 }); }
          R.path(path, { color: 'gold', width: 2.2 });
          const fs = F.star(th);
          R.dot(path[0][0], path[0][1], { color: 'ink', r: 3.5, label: 'f(0)', labelPos: 'sw', labelSize: 13 });
          R.dot(fs.re, fs.im, { color: 'green', r: 6.5, hollow: true, width: 2.4, label: 'f*(ζ)', labelPos: 'ne', labelSize: 13 });
          // Poisson reconstruction at z
          const key = `${k}|${z.x}|${z.y}`;
          if (pcache.key !== key) {
            let sr = 0, si = 0; const M = F.M;
            for (let j = 0; j < M; j++) { const t = -Math.PI + (TAU * (j + 0.5)) / M, p = Pz(z.x, z.y, t), w = F.star(t); sr += p * w.re; si += p * w.im; }
            pcache.key = key; pcache.val = [sr / M, si / M];
          }
          const fz = F.f(new Cx(z.x, z.y));
          const rad = [0.99, 0.999, 0.9999].map((r) => F.f(Cx.polar(r, th)).sub(fs).abs());
          st = { k, fs: [fs.re, fs.im], fz: [fz.re, fz.im], pz: pcache.val, rad, mod: fs.abs() };
          v.legend([['gold', 'radius to $\\zeta$ and its image'], ['green', 'boundary value $f^*(\\zeta)$', { dot: true }]].concat(k === 'S' ? [['red', 'horocycle at $1$ and its image', { dash: true }]] : []));
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$f^*(\\zeta)=${cxTeX(v, s.fs, 4)}$ ($|f^*(\\zeta)|=${v.fix(s.mod, 4)}$); $\\;|f(r\\zeta)-f^*(\\zeta)|=${s.rad.map((x) => v.fix(x, 4)).join(',\\ ')}$ for $r=0.99,0.999,0.9999$. At $z$: $f(z)=${cxTeX(v, s.fz, 4)}$ and $P[f^*](z)=${cxTeX(v, s.pz, 4)}$.`;
        });
      },
    },
  ],
};
