// Rudin, Functional Analysis — Chapter 6: Test Functions and Distributions

// ---------------------------------------------------------------- the model test function ψ and its exact derivatives
/**
 * ψ(x) = exp(−1/(1−x²)) on (−1,1), 0 elsewhere. Its derivatives are ψ^{(k)} = p_k(x)(1−x²)^{−2k} ψ(x) with
 * p_0 = 1 and p_{k+1} = p_k′(1−x²)² + 4kx(1−x²)p_k − 2x p_k — an exact recursion (checked against Taylor
 * coefficients at 0), so no finite differences are used anywhere below.
 */
const PSI_P = (() => {
  const add = (a, b) => Array.from({ length: Math.max(a.length, b.length) }, (_, i) => (a[i] || 0) + (b[i] || 0));
  const mul = (a, b) => { const r = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; })); return r; };
  const der = (a) => (a.length > 1 ? a.slice(1).map((c, i) => c * (i + 1)) : [0]);
  const s = [1, 0, -1], s2 = mul(s, s), P = [[1]];
  for (let k = 0; k < 14; k++) { const p = P[k]; P.push(add(add(mul(der(p), s2), mul(mul([0, 4 * k], s), p)), mul([0, -2], p))); }
  return P;
})();
function psiD(k, x) {
  const s = 1 - x * x; if (!(s > 0)) return 0;
  const c = PSI_P[k]; let p = 0; for (let i = c.length - 1; i >= 0; i--) p = p * x + c[i];
  return p * Math.exp(-1 / s - 2 * k * Math.log(s));
}
const PSI_SUP = [];
/** sup |ψ^{(k)}| (sampled finely; cached). */
function psiSup(k) { if (PSI_SUP[k] == null) { let m = 0; for (let i = 0; i <= 8000; i++) m = Math.max(m, Math.abs(psiD(k, -1 + i / 4000))); PSI_SUP[k] = m; } return PSI_SUP[k]; }
const BIN = [[1]];
for (let n = 1; n <= 16; n++) { const r = [1]; for (let k = 1; k < n; k++) r.push(BIN[n - 1][k - 1] + BIN[n - 1][k]); r.push(1); BIN.push(r); }
// Jets: arrays [f(x), f′(x), …, f^{(K)}(x)].
/** Jet of A·ψ((x−c)/r). */
const bumpJet = (x, c, r, A, K) => { const u = (x - c) / r, out = []; let s = A; for (let k = 0; k <= K; k++) { out.push(s * psiD(k, u)); s /= r; } return out; };
/** Jet of cos(wx + θ). */
const cosJet = (x, w, th, K) => { const out = []; let s = 1; for (let k = 0; k <= K; k++) { out.push(s * Math.cos(w * x + th + k * Math.PI / 2)); s *= w; } return out; };
/** Jet of tanh(wx), K ≤ 3. */
const tanhJet = (x, w, K) => { const t = Math.tanh(w * x), u = 1 - t * t; return [t, w * u, -2 * w * w * t * u, -2 * w * w * w * u * (1 - 3 * t * t)].slice(0, K + 1); };
/** Leibniz rule. */
const jetMul = (a, b) => a.map((_, n) => { let s = 0; for (let k = 0; k <= n; k++) s += BIN[n][k] * a[k] * b[n - k]; return s; });
const jetAdd = (a, b) => a.map((x, i) => x + b[i]);
/** sup over [a, b] of |f^{(k)}|, k = 0..K, for a jet-valued J. */
function jetSups(J, a, b, K, n = 1200) {
  const s = new Array(K + 1).fill(0);
  for (let i = 0; i <= n; i++) { const q = J(a + (b - a) * i / n); for (let k = 0; k <= K; k++) s[k] = Math.max(s[k], Math.abs(q[k])); }
  return s;
}
const SUPDIG = '⁰¹²³⁴⁵⁶⁷⁸⁹';
/** Tick label "10ᵏ". */
const p10 = (k) => (k === 0 ? '1' : '10' + (k < 0 ? '⁻' : '') + String(Math.abs(k)).split('').map((d) => SUPDIG[+d]).join(''));
const intTicks = (lo, hi, step = 1) => { const out = []; for (let k = Math.ceil(lo / step) * step; k <= hi; k += step) out.push([k, p10(k)]); return out; };
/** Spread label positions (data units) so that neighbours are at least `gap` apart; keeps their order. */
function spread(ys, gap) {
  const idx = ys.map((y, i) => i).sort((a, b) => ys[a] - ys[b]), out = ys.slice();
  for (let k = 1; k < idx.length; k++) if (out[idx[k]] < out[idx[k - 1]] + gap) out[idx[k]] = out[idx[k - 1]] + gap;
  return out;
}
/** Composite Simpson rule on [a, b] with n (even) panels. */
function simpson(f, a, b, n) {
  if (n % 2) n++;
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return s * h / 3;
}

// ---------------------------------------------------------------- planar convex sets (for the slice picture in 6.4)
const dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];
function clipHalf(poly, a, b) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length];
    const fp = dot2(a, P) - b, fq = dot2(a, Q) - b;
    if (fp <= 0) out.push(P);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) { const t = fp / (fp - fq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
  }
  return out;
}
/** The symmetric convex polygon {v : |a·v| ≤ 1 for all a ∈ A}. */
function symPoly(A, R = 50) {
  let P = [[-R, -R], [R, -R], [R, R], [-R, R]];
  for (const a of A) { P = clipHalf(P, a, 1); P = clipHalf(P, [-a[0], -a[1]], 1); }
  return P;
}
/** Minkowski gauge of that polygon. */
const gaugeA = (A, v) => { let m = 0; for (const a of A) m = Math.max(m, Math.abs(dot2(a, v))); return m; };
const shiftPoly = (P, c, s = 1) => P.map((p) => [c[0] + s * p[0], c[1] + s * p[1]]);

export default {
  book: 'fa',
  chapter: 6,
  title: 'Test Functions and Distributions',
  summary: String.raw`The space $\mathscr D(\Omega)$ of smooth compactly supported test functions receives a locally convex topology that is not metrizable but is complete, has the Heine–Borel property, and in which a sequence converges only if all supports stay in one compact set and all derivatives converge uniformly. Distributions are the continuous linear functionals on it — locally finite combinations of derivatives of continuous functions — and they can be differentiated, multiplied by smooth functions, localised, glued from local pieces, and convolved with test functions and with one another.`,
  items: [
    {
      num: '6.2',
      kind: 'Definition',
      name: 'Test functions 𝒟(Ω) and the norms ‖φ‖_N',
      statement: String.raw`Let $\Omega$ be a nonempty open set in $\R^n$. For each compact $K\subset\Omega$, $\mathscr D_K$ is the Fréchet space (1.46) of all $\varphi\in C^\infty(\R^n)$ with $\supp\varphi\subset K$. The space of **test functions** in $\Omega$ is
$$\mathscr D(\Omega)=\bigcup\,\{\mathscr D_K : K\subset\Omega\ \text{compact}\},$$
the smooth functions on $\Omega$ whose support is a compact subset of $\Omega$. For $\varphi\in\mathscr D(\Omega)$ and $N=0,1,2,\dots$ put
$$\|\varphi\|_N=\max\{|D^\alpha\varphi(x)| : x\in\Omega,\ |\alpha|\le N\}.$$
Restricted to any $\mathscr D_K$, these norms induce the Fréchet topology $\tau_K$ of 1.46. On all of $\mathscr D(\Omega)$ they define a metrizable locally convex topology, but that topology is not complete — the reason for the different topology of 6.3.`,
      idea: String.raw`A test function must vanish to infinite order at the edge of its support, so it cannot be analytic; the model is $\psi(x)=e^{-1/(1-x^2)}$ on $(-1,1)$. Each norm $\|\cdot\|_N$ sees only finitely many derivatives, so $\mathscr D_K$ needs the whole sequence of them. Incompleteness of the normed topology on $\mathscr D(\Omega)$: a sum of ever narrower, ever smaller bumps marching towards $\partial\Omega$ is Cauchy for every $\|\cdot\|_N$, but its limit does not have compact support in $\Omega$.`,
      caption: String.raw`Drag the peak of $\varphi$ (position and height) and the two ends of the compact set $K\subset\Omega=(0,6)$; change the width. Lower left: the derivative $\varphi^{(k)}$, identically $0$ off $\supp\varphi$ and flat at its edges. Lower right: $\sup|\varphi^{(j)}|$ on a log scale — the norms $\|\varphi\|_N$ (green line) grow very fast with $N$, and a narrower bump makes them explode.`,
      deps: ['fa-1.46'],
      see: ['rca-2.12'],
      tags: ['test functions', 'Fréchet spaces'],
      viz(v) {
        const M = v.M, E = Math.E;
        const shape = v.select('$\\varphi=$', [{ value: 'one', label: 'one bump' }, { value: 'two', label: 'two bumps' }, { value: 'wave', label: 'modulated bump' }], 'two');
        const rS = v.slider('width $r$', 0.2, 1.5, 0.75, { step: 0.01 });
        const kS = v.slider('order $k$ of the derivative shown', 0, 6, 1, { int: true });
        const XT = [0, 1, 2, 3, 4, 5, 6];
        const top = v.stage({ x: [-0.4, 6.4], y: [-0.66, 0.8], height: 270, full: true, axes: false, title: 'a test function $\\varphi$ in $\\Omega=(0,6)$ and a compact set $K\\subset\\Omega$' });
        const der = v.stage({ x: [-0.4, 6.4], y: [-1, 1], height: 220, weight: 2, axes: 'box', xticks: XT });
        const bars = v.stage({ x: [-0.7, 6.7], y: [-2, 4], height: 220, weight: 1, minWidth: 230, axes: 'box', xticks: XT, title: '$\\sup|\\varphi^{(j)}|$, $j=0,\\dots,6$ (log scale)' });
        const pk = top.handle(2.1, 0.5, { color: 'blue', constrain: (x, y) => [M.clamp(x, 0.2, 5.8), M.clamp(y, 0.08, 0.7)] });
        const ka = top.handle(0.9, -0.55, { color: 'orange', constrain: (x) => [M.clamp(x, 0.04, 5.96), -0.55] });
        const kb = top.handle(4.7, -0.55, { color: 'orange', constrain: (x) => [M.clamp(x, 0.04, 5.96), -0.55] });
        const jet = (x, K) => {
          const c = pk.x, A = pk.y * E, r = rS.value;
          if (shape.value === 'one') return bumpJet(x, c, r, A, K);
          if (shape.value === 'two') return jetAdd(bumpJet(x, c, r, A, K), bumpJet(x, c + 1.4 * r, 0.6 * r, -0.55 * A, K));
          return jetMul(bumpJet(x, c, r, A, K), cosJet(x - c, 4 / r, 0, K));
        };
        const support = () => { const c = pk.x, r = rS.value; return shape.value === 'two' ? [c - r, c + 2 * r] : [c - r, c + r]; };
        let st = {};
        v.render(() => {
          const k = kS.value, [s0, s1] = support();
          const a = Math.min(ka.x, kb.x), b = Math.max(ka.x, kb.x);
          const sups = jetSups((x) => jet(x, 6), s0, s1, 6, 1600);
          const inO = s0 > 0 && s1 < 6, inK = s0 >= a && s1 <= b;
          // ---- top: Ω, K, φ, supp φ
          top.vband(-0.4, 0, { color: 'faint', alpha: 0.3 }); top.vband(6, 6.4, { color: 'faint', alpha: 0.3 });
          top.vline(0, { color: 'muted', dash: [5, 4] }); top.vline(6, { color: 'muted', dash: [5, 4] });
          top.line(-0.4, 0, 6.4, 0, { color: 'faint', width: 1 });
          top.vband(a, b, { color: 'orange', alpha: 0.1 });
          top.line(a, -0.55, b, -0.55, { color: 'orange', width: 4 });
          top.tex('K', (a + b) / 2, -0.55, { color: 'orange', dy: -8, baseline: 'bottom' });
          top.fn((x) => jet(x, 0)[0], { color: 'blue', width: 2.5, fill: 'blue', fillAlpha: 0.15, n: 900, domain: [0, 6] });
          const sc = inK && inO ? 'green' : 'red';
          top.line(s0, -0.4, s1, -0.4, { color: sc, width: 5 });
          top.tex('\\operatorname{supp}\\varphi', s1, -0.4, { color: sc, size: 14, dx: 8, align: 'left' });
          top.tex('\\Omega', 0.25, 0.7, { color: 'muted' });
          top.tex('\\varphi', pk.x + 0.18, pk.y, { color: 'blue', align: 'left' });
          const msg = !inO ? '\\operatorname{supp}\\varphi\\not\\subset\\Omega:\\ \\varphi\\notin\\mathscr D(\\Omega)' : inK ? '\\operatorname{supp}\\varphi\\subset K,\\ \\text{so}\\ \\varphi\\in\\mathscr D_K' : '\\varphi\\in\\mathscr D(\\Omega),\\ \\text{but}\\ \\varphi\\notin\\mathscr D_K';
          top.tex(msg, 5.85, 0.74, { color: inO && inK ? 'green' : inO ? 'orange' : 'red', align: 'right', baseline: 'top', size: 15 });
          // ---- derivative panel
          const m = sups[k] * 1.25 || 1;
          der.setView(null, [-m, m]);
          der.setTitle(`$\\varphi^{(${k})}$ — zero off $\\operatorname{supp}\\varphi$, flat at its edges`);
          der.vband(s0, s1, { color: 'orange', alpha: 0.07 });
          der.hline(sups[k], { color: 'purple', dash: [5, 4], width: 1 }); der.hline(-sups[k], { color: 'purple', dash: [5, 4], width: 1 });
          der.fn((x) => jet(x, k)[k], { color: 'purple', width: 2.2, fill: 'purple', fillAlpha: 0.12, n: 1200 });
          // ---- bars
          const logs = sups.map((s) => Math.log10(Math.max(s, 1e-12)));
          const lo = Math.floor(Math.min(-1, ...logs)) - 0.3, hi = Math.max(...logs) + 0.8;
          bars.setView(null, [lo - 0.09 * (hi - lo), hi]);
          bars.setTicks(undefined, intTicks(Math.ceil(lo), Math.floor(hi), Math.max(1, Math.ceil((hi - lo) / 5))));
          bars.bars(logs, { x0: 0, dx: 1, base: lo, barWidth: 0.62, color: (_, j) => (j === k ? 'purple' : j < k ? 'blue' : 'faint') });
          const nk = Math.max(...logs.slice(0, k + 1));
          bars.hline(nk, { color: 'green', width: 1.6, dash: [6, 4] });
          bars.text(`‖φ‖${'₀₁₂₃₄₅₆'[k]}`, -0.55, nk, { color: 'green', dy: -9, size: 12 });
          st = { sups, inK, inO, s0, s1, a, b, k };
        });
        v.legend([['blue', 'test function $\\varphi$', { area: true }], ['orange', 'compact $K\\subset\\Omega$'], ['purple', "derivative $\\varphi^{(k)}$"], ['green', '$\\|\\varphi\\|_k=\\max_{j\\le k}\\sup|\\varphi^{(j)}|$', { dash: true }]]);
        v.readout(() => {
          const s = st, nrm = [];
          let run = 0; for (let j = 0; j <= 6; j++) { run = Math.max(run, s.sups[j]); nrm.push(run); }
          const list = nrm.map((x, j) => `\\|\\varphi\\|_{${j}}=${v.sci(x, 3)}`).join(',\\ ');
          return `$\\operatorname{supp}\\varphi=[${v.fix(s.s0, 2)},\\,${v.fix(s.s1, 2)}]$, $K=[${v.fix(s.a, 2)},\\,${v.fix(s.b, 2)}]$. $\\;${list}$.`;
        });
      },
    },
    {
      num: '6.3',
      kind: 'Definition',
      name: 'The topology τ of 𝒟(Ω)',
      statement: String.raw`Fix a nonempty open $\Omega\subset\R^n$. Let $\beta$ be the collection of all **convex balanced** sets $W\subset\mathscr D(\Omega)$ such that $W\cap\mathscr D_K$ is open in $\mathscr D_K$ (for its topology $\tau_K$) for every compact $K\subset\Omega$. Let $\tau$ be the collection of all unions of sets of the form $\varphi+W$ with $\varphi\in\mathscr D(\Omega)$ and $W\in\beta$. Unless said otherwise, $\mathscr D(\Omega)$ carries the topology $\tau$.`,
      idea: String.raw`The requirement is checked one $\mathscr D_K$ at a time, so a set in $\beta$ may demand smaller and smaller values, and more and more derivatives, as one approaches $\partial\Omega$ — while each $\tau_K$ only ever sees a compact part. This makes $\tau$ strictly finer than every normed topology $\|\cdot\|_N$ on $\mathscr D(\Omega)$; yet on each $\mathscr D_K$ it induces exactly $\tau_K$ (6.5(b)). It is the strongest locally convex topology with that property (an inductive limit).`,
      caption: String.raw`$\Omega=(0,4)$ and $W=\{\varphi:\ |\varphi|<\varepsilon,\ |\varphi'|<\eta\ \text{pointwise}\}$, where $\varepsilon,\eta$ decay like $e^{-1/\operatorname{dist}(x,\partial\Omega)}$. $W$ is convex and balanced, and the green tube shows a whole $\tau_K$-ball about $\varphi$ inside $W\cap\mathscr D_K$ (drag $\varphi$ and the ends of $K$), so $W\in\beta$. But for every $N$ and $\delta$ there is a bump $\chi$ near $\partial\Omega$ (red; zoom at right) with $\|\chi\|_N<\delta$ and $\chi\notin W$: no norm ball fits in $W$.`,
      deps: ['fa-6.2', 'fa-1.46', 'fa-1.4'],
      tags: ['test functions', 'inductive limit', 'local base'],
      viz(v) {
        const M = v.M, E = Math.E;
        const dd = (x) => Math.max(0, Math.min(x, 4 - x));
        const eps = (x) => (dd(x) > 0 ? 0.5 * Math.exp(1 - 1 / dd(x)) : 0);
        const eta = (x) => (dd(x) > 0 ? 1.5 * Math.exp(1 - 1 / dd(x)) : 0);
        const NS = v.select('compare with the norm', [0, 1, 2, 3].map((N) => ({ value: N, label: `$\\|\\cdot\\|_${N}$` })), 1);
        const dS = v.slider('ball radius $\\delta$', 0.01, 1, 0.3, { log: true, decimals: 3 });
        const rS = v.slider('width of $\\varphi$', 0.15, 1.2, 0.6, { step: 0.01 });
        const top = v.stage({ x: [-0.32, 4.12], y: [-1, 1], height: 250, full: true, axes: 'box', xticks: [0, 1, 2, 3, 4], title: '$|\\varphi(x)|<\\varepsilon(x)$: the allowed band pinches off at $\\partial\\Omega$' });
        const bot = v.stage({ x: [-0.32, 4.12], y: [-2.6, 2.6], height: 210, weight: 2, axes: 'box', xticks: [0, 1, 2, 3, 4], title: "$|\\varphi'(x)|<\\eta(x)$" });
        const zoom = v.stage({ x: [0, 1], y: [-1, 1], height: 210, weight: 1, minWidth: 230, axes: 'box', ticks: false });
        const pk = top.handle(1.6, 0.45, { color: 'blue', constrain: (x, y) => [M.clamp(x, 0.1, 3.9), M.clamp(y, 0.03, 0.95)] });
        const ka = top.handle(0.75, -0.88, { color: 'orange', constrain: (x) => [M.clamp(x, 0.03, 3.97), -0.88] });
        const kb = top.handle(2.9, -0.88, { color: 'orange', constrain: (x) => [M.clamp(x, 0.03, 3.97), -0.88] });
        const cache = {};
        function counterexample(N, delta) {
          const key = N + ':' + delta.toFixed(5);
          if (cache[key]) return cache[key];
          let S0 = 0; for (let j = 0; j <= N; j++) S0 = Math.max(S0, psiSup(j));
          for (let i = 0; i < 160; i++) {
            const x0 = 1.6 * Math.pow(0.88, i), w = 0.45 * x0;
            let S = 0; for (let j = 0; j <= N; j++) S = Math.max(S, psiSup(j) / Math.pow(w, j));
            const A = delta / (2 * S);
            let worst = 0, at = x0, which = 0;
            for (let q = 1; q < 240; q++) {
              const x = x0 - w + 2 * w * q / 240, u = (x - x0) / w;
              const r0 = Math.abs(A * psiD(0, u)) / eps(x), r1 = Math.abs(A * psiD(1, u) / w) / eta(x);
              if (r0 > worst) { worst = r0; at = x; which = 0; }
              if (r1 > worst) { worst = r1; at = x; which = 1; }
            }
            if (worst >= 1) return (cache[key] = { x0, w, A, at, which, norm: A * S, worst });
          }
          return (cache[key] = null);
        }
        let st = {};
        v.render(() => {
          const r = rS.value;
          pk.x = M.clamp(pk.x, r + 0.02, 4 - r - 0.02);
          const c = pk.x, A = pk.y * E;
          const ph = (x) => A * psiD(0, (x - c) / r), dph = (x) => A * psiD(1, (x - c) / r) / r;
          const a = Math.min(ka.x, kb.x), b = Math.max(ka.x, kb.x);
          // membership in W and the τ_K-ball
          let v0 = 0, v1 = 0;
          for (let i = 0; i <= 600; i++) { const x = c - r + 2 * r * i / 600; if (eps(x) > 0) { v0 = Math.max(v0, Math.abs(ph(x)) / eps(x)); v1 = Math.max(v1, Math.abs(dph(x)) / eta(x)); } }
          const inW = v0 < 1 && v1 < 1, inK = c - r >= a && c + r <= b;
          let rK = Infinity;
          for (let i = 0; i <= 600; i++) { const x = a + (b - a) * i / 600; rK = Math.min(rK, eps(x) - Math.abs(ph(x)), eta(x) - Math.abs(dph(x))); }
          const ce = counterexample(NS.value, dS.value);
          // ---- top panel
          const sup1 = Math.max(...M.linspace(c - r, c + r, 200).map((x) => Math.abs(dph(x))));
          top.between(eps, (x) => -eps(x), 0, 4, { fill: 'blue', fillAlpha: 0.1, n: 400 });
          top.fn(eps, { color: 'blue', width: 1.2, alpha: 0.6, domain: [0, 4] }); top.fn((x) => -eps(x), { color: 'blue', width: 1.2, alpha: 0.6, domain: [0, 4] });
          top.vline(0, { color: 'muted', dash: [5, 4] }); top.vline(4, { color: 'muted', dash: [5, 4] });
          top.vband(a, b, { color: 'orange', alpha: 0.08 });
          top.line(a, -0.88, b, -0.88, { color: 'orange', width: 4 });
          top.tex('K', (a + b) / 2, -0.88, { color: 'orange', dy: -12, baseline: 'bottom' });
          if (inW && inK && rK > 0) top.between((x) => ph(x) + rK, (x) => ph(x) - rK, a, b, { fill: 'green', fillAlpha: 0.28, n: 300 });
          top.fn(ph, { color: inW ? 'blue' : 'red', width: 2.6, domain: [c - r, c + r], n: 500 });
          top.tex('\\varepsilon(x)', 3.35, eps(3.35), { color: 'blue', dx: 4, dy: -4, align: 'left', baseline: 'bottom', size: 14 });
          if (ce) { top.arrow(ce.x0 + 0.35, 0.55, ce.x0 + 0.04, 0.06, { color: 'red', width: 1.4, head: 7 }); top.tex('\\chi', ce.x0 + 0.38, 0.6, { color: 'red', align: 'left' }); }
          top.corner(inW ? 'φ ∈ W' : 'φ ∉ W', 'tr', { color: inW ? 'blue' : 'red', weight: 600 });
          // ---- derivative panel
          const m1 = Math.max(2.6, sup1 * 1.15);
          bot.setView(null, [-m1, m1]);
          bot.between(eta, (x) => -eta(x), 0, 4, { fill: 'blue', fillAlpha: 0.1, n: 400 });
          bot.fn(eta, { color: 'blue', width: 1.2, alpha: 0.6, domain: [0, 4] }); bot.fn((x) => -eta(x), { color: 'blue', width: 1.2, alpha: 0.6, domain: [0, 4] });
          bot.vline(0, { color: 'muted', dash: [5, 4] }); bot.vline(4, { color: 'muted', dash: [5, 4] });
          if (inW && inK && rK > 0) bot.between((x) => dph(x) + rK, (x) => dph(x) - rK, a, b, { fill: 'green', fillAlpha: 0.28, n: 300 });
          bot.fn(dph, { color: inW ? 'blue' : 'red', width: 2.2, domain: [c - r, c + r], n: 500 });
          bot.tex('\\eta(x)', 3.35, eta(3.35), { color: 'blue', dx: 4, dy: -4, align: 'left', baseline: 'bottom', size: 14 });
          // ---- zoom on the counterexample
          if (ce) {
            const which = ce.which, g = which ? eta : eps;
            const chi = which ? (x) => ce.A * psiD(1, (x - ce.x0) / ce.w) / ce.w : (x) => ce.A * psiD(0, (x - ce.x0) / ce.w);
            let ym = 0; for (let i = 0; i <= 200; i++) ym = Math.max(ym, Math.abs(chi(ce.x0 - ce.w + 2 * ce.w * i / 200)));
            const X1 = ce.x0 + 1.5 * ce.w;
            zoom.setView([0, X1], [-1.3 * ym, 1.3 * ym]);
            zoom.between(g, (x) => -g(x), 0, X1, { fill: 'blue', fillAlpha: 0.12, n: 300 });
            zoom.fn(g, { color: 'blue', width: 1.2, domain: [0, X1], n: 300 });
            zoom.fn((x) => -g(x), { color: 'blue', width: 1.2, domain: [0, X1], n: 300 });
            zoom.fn(chi, { color: 'red', width: 2.4, domain: [ce.x0 - ce.w, ce.x0 + ce.w], n: 400 });
            zoom.dot(ce.at, chi(ce.at), { color: 'red', r: 4 });
            zoom.vline(0, { color: 'muted', dash: [5, 4] });
            zoom.setTitle(which ? "zoom near $\\partial\\Omega$: $\\chi'$ leaves the $\\eta$-band" : 'zoom near $\\partial\\Omega$: $\\chi$ leaves the $\\varepsilon$-band');
            zoom.corner(`x ∈ [0, ${v.fmt(X1, 2)}]`, 'bl', { size: 11 });
          }
          st = { inW, inK, rK, ce, N: NS.value, delta: dS.value, a, b };
        });
        v.legend([['blue', '$W$: allowed band for $\\varphi$ and $\\varphi\'$', { area: true }], ['green', 'a $\\tau_K$-ball about $\\varphi$ inside $W\\cap\\mathscr D_K$', { area: true }], ['orange', 'compact $K$'], ['red', '$\\chi$: tiny in $\\|\\cdot\\|_N$, yet $\\chi\\notin W$']]);
        v.readout(() => {
          const s = st;
          let a = '';
          if (!s.inW) a = 'Here $\\varphi\\notin W$ (it leaves a blue band).';
          else if (!s.inK) a = `$\\varphi\\in W$, but $\\operatorname{supp}\\varphi\\not\\subset K$; widen $K$.`;
          else a = `$\\varphi\\in W\\cap\\mathscr D_K$ and every $\\psi\\in\\mathscr D_K$ with $\\|\\psi-\\varphi\\|_1<${v.sci(s.rK, 3)}$ lies in $W$: $W\\cap\\mathscr D_K$ is $\\tau_K$-open.`;
          const c = s.ce;
          const b = c ? ` Yet $\\chi$ (a bump at $x_0=${v.sci(c.x0, 3)}$) has $\\|\\chi\\|_${s.N}=${v.sci(c.norm, 3)}<\\delta=${v.sci(s.delta, 3)}$ and ${c.which ? "$|\\chi'|\\ge\\eta$" : '$|\\chi|\\ge\\varepsilon$'} at $x=${v.sci(c.at, 3)}$: $W$ contains no $\\|\\cdot\\|_${s.N}$-ball, so $\\tau$ is strictly finer than this norm.` : '';
          return a + b;
        });
      },
    },
    {
      num: '6.4',
      kind: 'Theorem',
      name: 'τ is a locally convex vector topology on 𝒟(Ω)',
      statement: String.raw`(a) $\tau$ is a topology on $\mathscr D(\Omega)$, and $\beta$ is a local base for $\tau$.

(b) With $\tau$, $\mathscr D(\Omega)$ is a locally convex topological vector space.`,
      idea: String.raw`For (a) one shows that if $\varphi\in(\varphi_1+W_1)\cap(\varphi_2+W_2)$ then $\varphi+W\subset$ both for some $W\in\beta$. Pick $K$ with $\varphi,\varphi_i\in\mathscr D_K$; since $W_i\cap\mathscr D_K$ is $\tau_K$-open, $\varphi-\varphi_i\in(1-\delta)W_i$ for a small $\delta>0$, and convexity gives $\varphi-\varphi_i+\delta W_i\subset(1-\delta)W_i+\delta W_i=W_i$; take $W=\delta W_1\cap\delta W_2$. For (b): points are closed because $W=\{\|\varphi\|_0<\|\varphi_1-\varphi_2\|_0\}\in\beta$ keeps $\varphi_1+\tfrac12W$ and $\varphi_2+\tfrac12W$ apart; addition is continuous since $\tfrac12W+\tfrac12W=W$ for convex $W$, and scalar multiplication similarly.`,
      caption: String.raw`A plane slice $\{s e_1+t e_2\}$ of $\mathscr D(\Omega)$ through two bumps (right panel shows the points as functions). In it, $W_1=\{\|\varphi\|_0<1\}$ and $W_2=\{\|\varphi'\|_0<2\}$ — both in $\beta$ — appear as convex balanced polygons. (a) Drag $\varphi$ into $(\varphi_1+W_1)\cap(\varphi_2+W_2)$: the green set $\varphi+\delta(W_1\cap W_2)$ fits inside. (b) The two half-size balls of $\|\cdot\|_0$-radius $\|\varphi_1-\varphi_2\|_0$ never overlap. (c) Drag $p$, $q$: their sum always stays in $\psi_1+\psi_2+W$.`,
      deps: ['fa-6.3', 'fa-1.46', 'fa-1.8'],
      tags: ['test functions', 'locally convex spaces'],
      viz(v) {
        const M = v.M, E = Math.E;
        const e1 = (x) => E * psiD(0, (x + 0.35) / 1.25), e2 = (x) => E * psiD(0, (x - 0.5) / 0.85);
        const e1d = (x) => E * psiD(1, (x + 0.35) / 1.25) / 1.25, e2d = (x) => E * psiD(1, (x - 0.5) / 0.85) / 0.85;
        const xs = M.linspace(-1.6, 1.35, 320);
        const A1 = xs.map((x) => [e1(x), e2(x)]), A2 = xs.map((x) => [e1d(x) / 2, e2d(x) / 2]), A12 = A1.concat(A2);
        const W1 = symPoly(A1), W2 = symPoly(A2), W12 = symPoly(A12);
        const mode = v.select('', [{ value: 'base', label: '(a) $\\beta$ is a local base' }, { value: 'haus', label: '(b) points are closed' }, { value: 'add', label: '(c) addition is continuous' }], 'base');
        const L = v.stage({ x: [-2.7, 2.7], y: [-1.9, 1.9], equal: true, height: 360, ticks: false, title: 'a plane slice $\\{s\\,e_1+t\\,e_2\\}$ of $\\mathscr D(\\Omega)$' });
        const R = v.stage({ x: [-2, 2], y: [-2, 2], height: 360, axes: 'box', xticks: [-2, -1, 0, 1, 2], title: 'the marked points as functions on $\\Omega=(-2,2)$' });
        const h1 = L.handle(-0.6, 0.5, { color: 'blue', label: 'φ₁' });
        const h2 = L.handle(0.55, -0.3, { color: 'purple', label: 'φ₂' });
        const proj = (c, x, y) => { const u = [x - c.x, y - c.y], g = gaugeA(A12, u); return g < 0.49 ? [x, y] : [c.x + u[0] * 0.49 / g, c.y + u[1] * 0.49 / g]; };
        const hp = L.handle(0.05, 0.42, { color: 'gold', label: 'φ', constrain: (x, y) => (mode.value === 'add' ? proj(h1, x, y) : [x, y]) });
        const hq = L.handle(0.9, -0.1, { color: 'gold', label: 'q', constrain: (x, y) => proj(h2, x, y) });
        let p1 = [h1.x, h1.y], p2 = [h2.x, h2.y];
        h1.onDrag = () => { if (mode.value === 'add') { hp.x += h1.x - p1[0]; hp.y += h1.y - p1[1]; } p1 = [h1.x, h1.y]; };
        h2.onDrag = () => { if (mode.value === 'add') { hq.x += h2.x - p2[0]; hq.y += h2.y - p2[1]; } p2 = [h2.x, h2.y]; };
        const F = (P) => (x) => P[0] * e1(x) + P[1] * e2(x);
        let st = {};
        v.render(() => {
          const md = mode.value, P1 = [h1.x, h1.y], P2 = [h2.x, h2.y];
          hq.visible = md === 'add';
          hp.label = md === 'add' ? 'p' : 'φ'; hp.visible = md !== 'haus';
          h1.label = md === 'add' ? 'ψ₁' : 'φ₁'; h2.label = md === 'add' ? 'ψ₂' : 'φ₂';
          L.line(-9, 0, 9, 0, { color: 'faint', width: 1 }); L.line(0, -9, 0, 9, { color: 'faint', width: 1 });
          L.dot(0, 0, { color: 'ink', r: 2.5 });
          const fns = [];
          if (md === 'base') {
            const PP = [hp.x, hp.y];
            L.poly(shiftPoly(W1, P1), { fill: 'blue', fillAlpha: 0.14, color: 'blue', width: 1.8 });
            L.poly(shiftPoly(W2, P2), { fill: 'purple', fillAlpha: 0.14, color: 'purple', width: 1.8 });
            const m1 = gaugeA(A1, [PP[0] - P1[0], PP[1] - P1[1]]), m2 = gaugeA(A2, [PP[0] - P2[0], PP[1] - P2[1]]);
            const ok = m1 < 1 && m2 < 1, delta = 1 - Math.max(m1, m2);
            if (ok) {
              L.poly(shiftPoly(W1, P1, 1 - delta), { color: 'blue', width: 1.2, dash: [4, 4] });
              L.poly(shiftPoly(W2, P2, 1 - delta), { color: 'purple', width: 1.2, dash: [4, 4] });
              L.poly(shiftPoly(W12, PP, delta), { fill: 'green', fillAlpha: 0.35, color: 'green', width: 2 });
            } else L.corner('φ is not in both translates', 'tl', { color: 'red', weight: 600 });
            L.tex('\\varphi_1+W_1', P1[0], P1[1] - 0.18, { color: 'blue', size: 14, baseline: 'top' });
            L.tex('\\varphi_2+W_2', P2[0], P2[1] - 0.18, { color: 'purple', size: 14, baseline: 'top' });
            fns.push([F(P1), 'blue', '\\varphi_1'], [F(P2), 'purple', '\\varphi_2'], [F(PP), 'gold', '\\varphi']);
            st = { md, ok, m1, m2, delta };
          } else if (md === 'haus') {
            const d = gaugeA(A1, [P1[0] - P2[0], P1[1] - P2[1]]);
            if (d > 1e-6) {
              L.poly(shiftPoly(W1, P1, d / 2), { fill: 'blue', fillAlpha: 0.16, color: 'blue', width: 1.8 });
              L.poly(shiftPoly(W1, P2, d / 2), { fill: 'red', fillAlpha: 0.16, color: 'red', width: 1.8 });
            }
            L.line(P1[0], P1[1], P2[0], P2[1], { color: 'muted', width: 1, dash: [3, 3] });
            L.tex('\\varphi_1+\\tfrac12W', P1[0], P1[1] + 0.16, { color: 'blue', size: 14, baseline: 'bottom' });
            L.tex('\\varphi_2+\\tfrac12W', P2[0], P2[1] - 0.16, { color: 'red', size: 14, baseline: 'top' });
            const f1 = F(P1), f2 = F(P2);
            let xm = 0, best = -1; for (const x of M.linspace(-2, 2, 801)) { const g = Math.abs(f1(x) - f2(x)); if (g > best) { best = g; xm = x; } }
            R.line(xm, f1(xm), xm, f2(xm), { color: 'green', width: 3 });
            R.tex('\\|\\varphi_1-\\varphi_2\\|_0', xm, (f1(xm) + f2(xm)) / 2, { color: 'green', size: 13, dx: 8, align: 'left' });
            fns.push([f1, 'blue', '\\varphi_1'], [f2, 'red', '\\varphi_2']);
            st = { md, d };
          } else {
            let pp = proj(h1, hp.x, hp.y); hp.x = pp[0]; hp.y = pp[1];
            pp = proj(h2, hq.x, hq.y); hq.x = pp[0]; hq.y = pp[1];
            const S = [P1[0] + P2[0], P1[1] + P2[1]], PQ = [hp.x + hq.x, hp.y + hq.y];
            L.poly(shiftPoly(W12, S), { fill: 'green', fillAlpha: 0.12, color: 'green', width: 2 });
            L.poly(shiftPoly(W12, P1, 0.5), { fill: 'blue', fillAlpha: 0.18, color: 'blue', width: 1.6 });
            L.poly(shiftPoly(W12, P2, 0.5), { fill: 'purple', fillAlpha: 0.18, color: 'purple', width: 1.6 });
            L.dot(S[0], S[1], { color: 'green', r: 3.5 });
            L.dot(PQ[0], PQ[1], { color: 'gold', r: 6, label: 'p + q', labelPos: 'ne' });
            L.tex('\\psi_1+\\psi_2+W', S[0], S[1] - 0.2, { color: 'green', size: 14, baseline: 'top' });
            fns.push([F([hp.x, hp.y]), 'blue', 'p'], [F([hq.x, hq.y]), 'purple', 'q'], [F(PQ), 'gold', 'p+q']);
            st = { md, g: gaugeA(A12, [PQ[0] - S[0], PQ[1] - S[1]]), gp: gaugeA(A12, [hp.x - P1[0], hp.y - P1[1]]), gq: gaugeA(A12, [hq.x - P2[0], hq.y - P2[1]]) };
          }
          // right panel: the functions
          let ym = 1.2; for (const [f] of fns) for (const x of M.linspace(-2, 2, 161)) ym = Math.max(ym, Math.abs(f(x)) * 1.15);
          R.setView(null, [-ym, ym]);
          R.line(-2, 0, 2, 0, { color: 'faint', width: 1 });
          fns.forEach(([f, col, lab]) => {
            R.fn(f, { color: col, width: 2.3, n: 400 });
            let xm = -1.6, best = -1; for (const x of M.linspace(-1.7, 1.5, 120)) if (Math.abs(f(x)) > best) { best = Math.abs(f(x)); xm = x; }
            R.tex(lab, xm, f(xm), { color: col, dx: 9, align: 'left', baseline: f(xm) >= 0 ? 'bottom' : 'top', size: 15 });
          });
        });
        v.readout(() => {
          const s = st;
          if (s.md === 'base') return s.ok ? `$\\varphi-\\varphi_1\\in ${v.fix(s.m1, 3)}\\,W_1$, $\\;\\varphi-\\varphi_2\\in ${v.fix(s.m2, 3)}\\,W_2$, so $\\delta=1-\\max = ${v.fix(s.delta, 3)}$ and convexity gives $\\varphi+\\delta(W_1\\cap W_2)\\subset(\\varphi_1+W_1)\\cap(\\varphi_2+W_2)$.` : 'Move $\\varphi$ into the overlap of the two translates.';
          if (s.md === 'haus') return `$W=\\{\\|\\varphi\\|_0<${v.fix(s.d, 3)}\\}\\in\\beta$, with radius $\\|\\varphi_1-\\varphi_2\\|_0$; a point of both $\\varphi_i+\\tfrac12W$ would give $\\|\\varphi_1-\\varphi_2\\|_0<${v.fix(s.d, 3)}$. So $\\{\\varphi_1\\}$ is closed and $\\tau$ is Hausdorff.`;
          return `$\\mu_W(p-\\psi_1)=${v.fix(s.gp, 3)}<\\tfrac12$, $\\mu_W(q-\\psi_2)=${v.fix(s.gq, 3)}<\\tfrac12$ $\\Rightarrow$ $\\mu_W\\big((p+q)-(\\psi_1+\\psi_2)\\big)=${v.fix(s.g, 3)}<1$.`;
        });
      },
    },
    {
      num: '6.5',
      kind: 'Theorem',
      name: 'Bounded sets, Cauchy and convergent sequences in 𝒟(Ω)',
      statement: String.raw`(a) A convex balanced subset $V$ of $\mathscr D(\Omega)$ is open if and only if $V\in\beta$.

(b) For every compact $K\subset\Omega$, $\tau_K$ coincides with the topology that $\mathscr D_K$ inherits from $\mathscr D(\Omega)$.

(c) If $E\subset\mathscr D(\Omega)$ is bounded, then $E\subset\mathscr D_K$ for some compact $K\subset\Omega$, and there are $M_N<\infty$ with $\|\varphi\|_N\le M_N$ for all $\varphi\in E$, $N=0,1,2,\dots$

(d) $\mathscr D(\Omega)$ has the Heine–Borel property.

(e) If $\{\varphi_i\}$ is a Cauchy sequence in $\mathscr D(\Omega)$, then all $\varphi_i$ lie in one $\mathscr D_K$ and $\|\varphi_i-\varphi_j\|_N\to0$ as $i,j\to\infty$, for every $N$.

(f) If $\varphi_i\to0$ in $\mathscr D(\Omega)$, then some compact $K$ contains every $\supp\varphi_i$, and $D^\alpha\varphi_i\to0$ uniformly for every multi-index $\alpha$.

(g) Every Cauchy sequence in $\mathscr D(\Omega)$ converges.`,
      idea: String.raw`The key is (c). If a set $E$ had members with support reaching a sequence of points $x_m$ that leaves every compact set, choose $\varphi_m\in E$ with $\varphi_m(x_m)\ne0$ and let $W=\{\varphi:|\varphi(x_m)|<|\varphi_m(x_m)|/m\ \forall m\}$; then $W\in\beta$ but $E\not\subset mW$ for every $m$, so $E$ is unbounded. Inside a single $\mathscr D_K$ the topologies agree by (b), and $\mathscr D_K$ is a Fréchet space with the Heine–Borel property (1.46). Cauchy sequences are bounded, so (e)–(g) follow from (c) and the completeness of $\mathscr D_K$.`,
      caption: String.raw`Three sequences in $\mathscr D(\R)$ with $j=1,\dots,30$. Top: $\varphi_1,\dots,\varphi_j$. Lower left: $\sup|\varphi_j^{(k)}|$ for $k=0,\dots,3$ on a log scale. Lower right: the supports. Only the first sequence converges in $\mathscr D$: the second tends to $0$ uniformly but its derivatives do not, and the third tends to $0$ with all derivatives while its supports escape every compact set, so it is not even bounded (c).`,
      deps: ['fa-6.4', 'fa-6.3', 'fa-1.46'],
      tags: ['test functions', 'convergence', 'Heine–Borel'],
      viz(v) {
        const M = v.M;
        const SEQ = {
          conv: { label: '$\\varphi_j=\\varphi/j$', jet: (x, j, K) => jetAdd(bumpJet(x, 2.8, 1.5, 1 / j, K), bumpJet(x, 3.7, 1.0, -0.75 / j, K)), supp: () => [1.3, 4.7], X: [0, 6] },
          osc: { label: '$\\varphi_j=\\frac1j\\sin(jx)\\,\\psi$', jet: (x, j, K) => jetMul(bumpJet(x, 3, 1.6, 1 / j, K), cosJet(x, j, -Math.PI / 2, K)), supp: () => [1.4, 4.6], X: [0, 6] },
          esc: { label: '$\\varphi_j=\\frac1j\\psi(x-c_j)$, $c_j\\to\\infty$', jet: (x, j, K) => bumpJet(x, 1 + 0.45 * j, 1, 1 / j, K), supp: (j) => [0.45 * j, 2 + 0.45 * j], X: [-0.5, 15.5] },
        };
        const which = v.select('', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'conv');
        const jS = v.slider('$j$', 1, 30, 6, { int: true });
        const top = v.stage({ x: [-0.5, 15.5], y: [-0.42, 0.45], height: 230, full: true, axes: 'box', xticks: [0, 2, 4, 6, 8, 10, 12, 14] });
        const nl = v.stage({ x: [0, 31], y: [-3, 3], height: 230, weight: 1, axes: 'box', xticks: [1, 5, 10, 15, 20, 25, 30], title: '$\\sup|\\varphi_j^{(k)}|$ against $j$' });
        const sp = v.stage({ x: [-0.5, 15.5], y: [0, 31.5], height: 230, weight: 1, axes: 'box', xticks: [0, 2, 4, 6, 8, 10, 12, 14], yticks: [1, 10, 20, 30], title: '$\\operatorname{supp}\\varphi_i$, $i=1,\\dots,j$ (vertical: $i$)' });
        const KC = ['blue', 'purple', 'teal', 'pink'];
        const cache = {};
        const table = (key) => {
          if (cache[key]) return cache[key];
          const S = SEQ[key], out = [];
          for (let j = 1; j <= 30; j++) { const [a, b] = S.supp(j); out.push(jetSups((x) => S.jet(x, j, 3), a, b, 3, 1500)); }
          return (cache[key] = out);
        };
        let st = {};
        v.render(() => {
          const key = which.value, S = SEQ[key], j = jS.value, T = table(key);
          top.setView(S.X, null); sp.setView(S.X, null);
          const xt = key === 'esc' ? [0, 2, 4, 6, 8, 10, 12, 14] : [0, 1, 2, 3, 4, 5, 6];
          top.setTicks(xt); sp.setTicks(xt);
          top.setTitle(`${S.label}: $\\varphi_1,\\dots,\\varphi_{${j}}$ (current one bold)`);
          for (let i = 1; i < j; i++) { const [a, b] = S.supp(i); top.fn((x) => S.jet(x, i, 0)[0], { domain: [a, b], color: 'blue', width: 1, alpha: 0.12 + 0.5 * i / j, n: 300 }); }
          const [a, b] = S.supp(j);
          top.fn((x) => S.jet(x, j, 0)[0], { domain: [a, b], color: 'blue', width: 2.6, fill: 'blue', fillAlpha: 0.12, n: 600 });
          // norms panel
          const logs = T.map((row) => row.map((s) => Math.log10(Math.max(s, 1e-9))));
          const all = logs.flat(), lo = Math.floor(Math.min(...all)) - 0.3, hi = Math.ceil(Math.max(...all)) + 0.3;
          nl.setView(null, [lo - 0.08 * (hi - lo), hi]); nl.setTicks(undefined, intTicks(Math.ceil(lo), Math.floor(hi)));
          for (let k = 0; k <= 3; k++) {
            nl.path(logs.map((row, i) => [i + 1, row[k]]), { color: KC[k], width: 2 });
            nl.dot(j, logs[j - 1][k], { color: KC[k], r: 4.5 });
          }
          const ly = spread(logs[29], 0.07 * (hi - lo));
          for (let k = 0; k <= 3; k++) nl.text(`k=${k}`, 30.6, ly[k], { color: KC[k], align: 'right', dy: -9, size: 11 });
          nl.vline(j, { color: 'muted', dash: [3, 3], width: 1 });
          // supports panel
          let K0 = Infinity, K1 = -Infinity;
          for (let i = 1; i <= 30; i++) { const [p, q] = S.supp(i); K0 = Math.min(K0, p); K1 = Math.max(K1, q); }
          const bounded = key !== 'esc';
          if (bounded) { sp.vband(K0, K1, { color: 'orange', alpha: 0.13, edges: true }); sp.tex('K', (K0 + K1) / 2, 30.5, { color: 'orange', baseline: 'top' }); }
          for (let i = 1; i <= j; i++) { const [p, q] = S.supp(i); sp.line(p, i, q, i, { color: i === j ? 'blue' : 'faint', width: i === j ? 3.5 : 2.2 }); }
          if (!bounded) sp.arrow(9, 26, 14.5, 26, { color: 'red', width: 2, head: 9 });
          const conv = key === 'conv';
          top.corner(conv ? 'φ_j → 0 in 𝒟(ℝ)' : key === 'osc' ? 'φ_j → 0 uniformly, but not in 𝒟(ℝ)' : 'all derivatives → 0 uniformly, but not in 𝒟(ℝ)', 'tr', { color: conv ? 'green' : 'red', weight: 600 });
          st = { key, j, row: T[j - 1], first: T[0], last: T[29] };
        });
        v.legend([['blue', '$k=0$'], ['purple', '$k=1$'], ['teal', '$k=2$'], ['pink', '$k=3$'], ['orange', 'one compact $K$ containing all supports', { area: true }]]);
        v.readout(() => {
          const s = st, r = s.row.map((x) => v.sci(x, 3));
          const nums = `$\\sup|\\varphi_{${s.j}}|=${r[0]}$, $\\sup|\\varphi_{${s.j}}'|=${r[1]}$, $\\sup|\\varphi_{${s.j}}''|=${r[2]}$, $\\sup|\\varphi_{${s.j}}'''|=${r[3]}$. `;
          if (s.key === 'conv') return nums + 'All supports lie in one $K$ and every derivative tends to $0$ uniformly (like $1/j$): the sequence tends to $0$ in $\\mathscr D_K$, hence in $\\mathscr D(\\R)$ by (b) — and (f) says these two conditions are also necessary.';
          if (s.key === 'osc') return nums + "Supports stay in one $K$ and $\\varphi_j\\to0$ uniformly, but $\\sup|\\varphi_j'|$ does not tend to $0$ and $\\varphi_j''$ blows up: by (f) the sequence does not converge in $\\mathscr D(\\R)$.";
          return nums + 'Every derivative tends to $0$ uniformly, yet no compact set contains all the supports: by (c) the set $\\{\\varphi_j\\}$ is not even bounded in $\\mathscr D(\\R)$, so it cannot converge.';
        });
      },
    },
    {
      num: '6.6',
      kind: 'Theorem',
      name: 'Continuity of linear maps on 𝒟(Ω)',
      statement: String.raw`Let $\Lambda$ be a linear map of $\mathscr D(\Omega)$ into a locally convex space $Y$. The following are equivalent:

(a) $\Lambda$ is continuous.

(b) $\Lambda$ is bounded.

(c) If $\varphi_i\to0$ in $\mathscr D(\Omega)$, then $\Lambda\varphi_i\to0$ in $Y$.

(d) The restriction of $\Lambda$ to every $\mathscr D_K$ is continuous.`,
      idea: String.raw`(a)$\Rightarrow$(b) holds for all linear maps (1.32). (b)$\Rightarrow$(c): a null sequence in $\mathscr D(\Omega)$ lives in one $\mathscr D_K$ and tends to $0$ there (6.5(f)), and a bounded linear map on the metrizable $\mathscr D_K$ is sequentially continuous (1.32). (c)$\Rightarrow$(d) because $\mathscr D_K$ is metrizable. (d)$\Rightarrow$(a): for a convex balanced neighbourhood $U$ of $0$ in $Y$, $W=\Lambda^{-1}(U)$ is convex and balanced and $W\cap\mathscr D_K$ is $\tau_K$-open for every $K$; so $W\in\beta$.`,
      caption: String.raw`$\Lambda\varphi=\sum_{k\ge0}\varphi^{(k)}(k)$ on $\mathscr D(\R)$. Drag the bump: only integers $k$ in $\supp\varphi$ contribute (lower left), so on $\mathscr D_K$ one has $|\Lambda\varphi|\le C_K\|\varphi\|_{N_K}$ and (d) holds — $\Lambda$ is continuous, of infinite order. Lower right: the escaping sequence $\varphi_j=\frac1j\psi(x-j+0.3)$ tends to $0$ in every norm $\|\cdot\|_N$, yet $|\Lambda\varphi_j|$ explodes; no contradiction with (c), since $\varphi_j\not\to0$ in $\mathscr D(\R)$.`,
      deps: ['fa-6.5', 'fa-1.32', 'fa-6.3'],
      tags: ['test functions', 'continuity', 'linear maps'],
      viz(v) {
        const M = v.M, E = Math.E;
        const mode = v.select('', [{ value: 'probe', label: 'drag a test function' }, { value: 'esc', label: 'the escaping sequence $\\varphi_j$' }], 'probe');
        const rS = v.slider('half-width $r$', 0.3, 2.5, 1.3, { step: 0.01 });
        const jS = v.slider('$j$', 1, 12, 6, { int: true });
        const top = v.stage({ x: [-1.2, 13.4], y: [-0.08, 0.46], height: 210, full: true, axes: 'box', xticks: M.range(14) });
        const bl = v.stage({ x: [-0.6, 13.6], y: [-3, 6], height: 230, weight: 1, axes: 'box', xticks: M.range(14), title: 'terms $\\varphi^{(k)}(k)$: $\\log_{10}|\\cdot|$, blue $>0$, red $<0$' });
        const br = v.stage({ x: [0.4, 12.6], y: [-3, 9], height: 230, weight: 1, axes: 'box', xticks: [1, 3, 5, 7, 9, 11], title: '$\\varphi_j$: $|\\Lambda\\varphi_j|$ (red) against $\\|\\varphi_j\\|_N$' });
        const pk = top.handle(3.4, 1 / E, { color: 'blue', constrain: (x) => [M.clamp(x, -0.6, 12.6), 1 / E] });
        const terms = (c, r, A) => { const out = []; for (let k = 0; k <= 13; k++) { const u = (k - c) / r; out.push(Math.abs(u) < 1 ? A * psiD(k, u) / Math.pow(r, k) : null); } return out; };
        // the escaping sequence: φ_j = ψ(x − (j − 0.3))/j
        const SEQ = M.range(12, 1).map((j) => {
          const t = terms(j - 0.3, 1, 1 / j), lam = t.reduce((s, x) => s + (x ?? 0), 0);
          const nrm = []; let run = 0; for (let N = 0; N <= 3; N++) { run = Math.max(run, psiSup(N) / j); nrm.push(run); }
          return { lam, nrm };
        });
        const NC = ['blue', 'purple', 'teal', 'pink'];
        let st = {};
        v.render(() => {
          const esc = mode.value === 'esc';
          rS.el.hidden = esc; jS.el.hidden = !esc; pk.visible = !esc;
          const j = jS.value, r = esc ? 1 : rS.value, c = esc ? j - 0.3 : pk.x, A = esc ? 1 / j : 1;
          if (!esc) pk.x = M.clamp(pk.x, -1.2 + r, 13.4 - r);
          top.setView(null, esc ? [-0.03, 0.42] : [-0.08, 0.46]);
          if (esc) for (let i = 1; i < j; i++) top.fn((x) => psiD(0, x - i + 0.3) / i, { domain: [i - 1.3, i + 0.7], color: 'blue', width: 1, alpha: 0.25 });
          top.fn((x) => A * psiD(0, (x - c) / r), { domain: [c - r, c + r], color: 'blue', width: 2.6, fill: 'blue', fillAlpha: 0.14, n: 500 });
          top.line(c - r, 0, c + r, 0, { color: 'orange', width: 4 });
          const T = terms(c, r, A);
          for (let k = 0; k <= 13; k++) top.dot(k, 0, { color: T[k] == null ? 'faint' : 'gold', r: T[k] == null ? 3 : 5 });
          top.setTitle(esc ? `$\\varphi_${j}=\\tfrac1{${j}}\\psi(x-${j}+0.3)$ and the earlier $\\varphi_i$` : '$\\varphi$ and the points $k=0,1,2,\\dots$ (gold: inside $\\operatorname{supp}\\varphi$)');
          // terms panel
          const lt = T.map((x) => (x == null || x === 0 ? null : Math.log10(Math.abs(x))));
          const vals = lt.filter((x) => x != null);
          const lo = Math.floor(Math.min(-2, ...vals)) - 0.5, hi = Math.max(1, ...vals) + 0.8;
          bl.setView(null, [lo - 0.09 * (hi - lo), hi]); bl.setTicks(undefined, intTicks(Math.ceil(lo), Math.floor(hi), Math.max(1, Math.ceil((hi - lo) / 6))));
          lt.forEach((x, k) => { if (x != null) bl.rect(k - 0.3, lo, k + 0.3, x, { fill: T[k] > 0 ? 'blue' : 'red', fillAlpha: 0.75, stroke: false }); });
          // sequence panel
          const ys = [];
          SEQ.forEach((o) => { if (o.lam !== 0) ys.push(Math.log10(Math.abs(o.lam))); o.nrm.forEach((n) => ys.push(Math.log10(n))); });
          const lo2 = Math.floor(Math.min(...ys)) - 0.4, hi2 = Math.ceil(Math.max(...ys)) + 0.4;
          br.setView(null, [lo2 - 0.06 * (hi2 - lo2), hi2]); br.setTicks(undefined, intTicks(Math.ceil(lo2), Math.floor(hi2), 2));
          const ly = spread(SEQ[11].nrm.map((n) => Math.log10(n)), 0.075 * (hi2 - lo2));
          for (let N = 0; N <= 3; N++) {
            br.path(SEQ.map((o, i) => [i + 1, Math.log10(o.nrm[N])]), { color: NC[N], width: 1.8 });
            br.text(`N=${N}`, 12.5, ly[N], { color: NC[N], align: 'right', dy: -8, size: 10.5 });
          }
          br.path(SEQ.map((o, i) => [i + 1, Math.log10(Math.abs(o.lam))]), { color: 'red', width: 2.4 });
          SEQ.forEach((o, i) => br.dot(i + 1, Math.log10(Math.abs(o.lam)), { color: 'red', r: esc && i + 1 === j ? 6 : 3.5 }));
          if (esc) br.vline(j, { color: 'muted', dash: [3, 3], width: 1 });
          const ks = []; for (let k = 0; k <= 13; k++) if (T[k] != null) ks.push(k);
          const NK = ks.length ? Math.max(...ks) : 0;
          const lam = T.reduce((s, x) => s + (x ?? 0), 0);
          let nK = 0; for (let N = 0; N <= NK; N++) nK = Math.max(nK, A * psiSup(N) / Math.pow(r, N));
          st = { esc, j, lam, ks, NK, nK, c, r, nrm: esc ? SEQ[j - 1].nrm : null };
        });
        v.legend([['blue', 'test function', { area: true }], ['gold', 'points $k$ in the support', { dot: true }], ['red', '$|\\Lambda\\varphi_j|$']]);
        v.readout(() => {
          const s = st;
          if (s.esc) return `$\\|\\varphi_{${s.j}}\\|_0=${v.sci(s.nrm[0], 3)}$, $\\|\\varphi_{${s.j}}\\|_3=${v.sci(s.nrm[3], 3)}$ — every $\\|\\varphi_j\\|_N\\to0$ — but $\\Lambda\\varphi_{${s.j}}=${v.sci(s.lam, 3)}$. So $\\Lambda$ is continuous for no norm $\\|\\cdot\\|_N$; it is continuous on $\\mathscr D(\\R)$ because the supports of $\\varphi_j$ leave every compact set, so $\\varphi_j\\not\\to0$ there (6.5(f)).`;
          if (!s.ks.length) return 'No integer lies in $\\operatorname{supp}\\varphi$, so $\\Lambda\\varphi=0$.';
          return `$K=[${v.fix(s.c - s.r, 2)},${v.fix(s.c + s.r, 2)}]$ contains $k=${s.ks.join(',')}$, so on $\\mathscr D_K$: $|\\Lambda\\varphi|\\le ${s.ks.length}\\,\\|\\varphi\\|_{${s.NK}}$. Here $|\\Lambda\\varphi|=${v.sci(Math.abs(s.lam), 3)}\\le ${s.ks.length}\\cdot${v.sci(s.nK, 3)}$. Each restriction is continuous, so $\\Lambda\\in\\mathscr D'(\\R)$ by (d).`;
        });
      },
    },
    {
      num: '6.6a',
      kind: 'Corollary',
      name: 'Differential operators are continuous on 𝒟(Ω)',
      statement: String.raw`For every multi-index $\alpha$, the differential operator $D^\alpha$ is a continuous linear map of $\mathscr D(\Omega)$ into $\mathscr D(\Omega)$.`,
      idea: String.raw`$D^\alpha$ maps each $\mathscr D_K$ into itself (it cannot enlarge supports), and there $\|D^\alpha\varphi\|_N\le\|\varphi\|_{N+|\alpha|}$, so $D^\alpha:\mathscr D_K\to\mathscr D_K\subset\mathscr D(\Omega)$ is continuous (6.5(b)). Criterion (d) of 6.6 finishes the proof. Note the index shift: $D^\alpha$ is *not* continuous for any single norm $\|\cdot\|_N$.`,
      caption: String.raw`$\Omega=(-2,2)^2$, $\varphi(x,y)=\psi\big(\tfrac{x-a}{r_1}\big)\cos(\omega(x-a))\,\psi\big(\tfrac{y-b}{r_2}\big)$. Drag the centre and the corner of the support rectangle $K$, pick $\alpha$, raise the frequency $\omega$. $D^\alpha\varphi$ keeps its support in $K$; the bars confirm $\|D^\alpha\varphi\|_N\le\|\varphi\|_{N+|\alpha|}$ for every $N$, while the ratio $\|D^\alpha\varphi\|_0/\|\varphi\|_0$ grows without bound as $\omega\to\infty$.`,
      deps: ['fa-6.6', 'fa-1.46', 'fa-6.5'],
      tags: ['test functions', 'differential operators'],
      verify: true,
      viz(v) {
        const M = v.M;
        const AL = [[1, 0], [0, 1], [1, 1], [2, 0], [0, 2], [2, 1]];
        const aS = v.select('$\\alpha=$', AL.map((a, i) => ({ value: i, label: `$(${a[0]},${a[1]})$` })), 2);
        const wS = v.slider('frequency $\\omega$', 0, 14, 4, { step: 0.1 });
        const L = v.stage({ x: [-2.1, 2.1], y: [-2.1, 2.1], equal: true, height: 300, axes: false, title: '$\\varphi\\in\\mathscr D_K$' });
        const R = v.stage({ x: [-2.1, 2.1], y: [-2.1, 2.1], equal: true, height: 300, axes: false, title: '$D^\\alpha\\varphi$ — support still in $K$' });
        const B = v.stage({ x: [-0.6, 3.6], y: [-1, 4], height: 180, full: true, axes: 'box', xticks: [[0, 'N = 0'], [1, 'N = 1'], [2, 'N = 2'], [3, 'N = 3']], title: 'log scale: $\\|\\varphi\\|_{N+|\\alpha|}$ (blue) and $\\|D^\\alpha\\varphi\\|_N$ (purple)' });
        const ctr = L.handle(-0.2, 0.15, { color: 'ink' });
        const cor = L.handle(0.85, 0.95, { color: 'orange' });
        let prev = [ctr.x, ctr.y];
        ctr.onDrag = () => { cor.x += ctr.x - prev[0]; cor.y += ctr.y - prev[1]; prev = [ctr.x, ctr.y]; };
        let st = {};
        v.render(() => {
          const [a1, a2] = AL[aS.value], w = wS.value;
          ctr.x = M.clamp(ctr.x, -1.6, 1.6); ctr.y = M.clamp(ctr.y, -1.6, 1.6); prev = [ctr.x, ctr.y];
          const r1 = M.clamp(Math.abs(cor.x - ctr.x), 0.25, 1.95 - Math.abs(ctr.x)), r2 = M.clamp(Math.abs(cor.y - ctr.y), 0.25, 1.95 - Math.abs(ctr.y));
          cor.x = ctr.x + r1; cor.y = ctr.y + r2;
          const a = ctr.x, b = ctr.y;
          const fJ = (x) => jetMul(bumpJet(x, a, r1, 1, 5), cosJet(x - a, w, 0, 5)), gJ = (y) => bumpJet(y, b, r2, 1, 5);
          const Sf = jetSups(fJ, a - r1, a + r1, 5, 1500), Sg = jetSups(gJ, b - r2, b + r2, 5, 1500);
          const key = [a, b, r1, r2, w].map((z) => z.toFixed(3)).join(',');
          const m0 = Sf[0] * Sg[0], ma = Sf[a1] * Sg[a2];
          L.heat((x, y) => fJ(x)[0] * gJ(y)[0], { range: [-m0, m0], cmap: 'diverging', res: 3, key: key });
          R.heat((x, y) => fJ(x)[a1] * gJ(y)[a2], { range: [-ma, ma], cmap: 'diverging', res: 3, key: key + '|' + aS.value });
          for (const S of [L, R]) {
            S.rect(-2, -2, 2, 2, { color: 'muted', width: 1.2, dash: [5, 4] });
            S.rect(a - r1, b - r2, a + r1, b + r2, { color: 'orange', width: 1.8 });
            S.tex('K', a + r1, b - r2, { color: 'orange', align: 'left', baseline: 'top', dx: 4, dy: 2, size: 14 });
            S.tex('\\Omega', -1.95, 1.95, { color: 'muted', align: 'left', baseline: 'top', size: 14 });
          }
          const norm = (M0, sh) => { let m = 0; for (let i = 0; i <= M0; i++) for (let j = 0; i + j <= M0; j++) m = Math.max(m, Sf[i + sh[0]] * Sg[j + sh[1]]); return m; };
          const nPhi = [0, 1, 2, 3].map((N) => norm(N + a1 + a2, [0, 0])), nD = [0, 1, 2, 3].map((N) => norm(N, [a1, a2]));
          const lg = (x) => Math.log10(Math.max(x, 1e-12)), all = nPhi.concat(nD).map(lg);
          const lo = Math.floor(Math.min(...all)) - 0.3, hi = Math.max(...all) + 0.6;
          B.setView(null, [lo - 0.13 * (hi - lo), hi]); B.setTicks(undefined, intTicks(Math.ceil(lo), Math.floor(hi)));
          for (let N = 0; N <= 3; N++) {
            B.rect(N - 0.32, lo, N - 0.02, lg(nPhi[N]), { fill: 'blue', fillAlpha: 0.7, stroke: false });
            B.rect(N + 0.02, lo, N + 0.32, lg(nD[N]), { fill: 'purple', fillAlpha: 0.75, stroke: false });
          }
          st = { nPhi, nD, ratio: nD[0] / (Sf[0] * Sg[0]), a1, a2, w };
        });
        v.readout(() => {
          const s = st;
          const ok = s.nD.every((x, N) => x <= s.nPhi[N] * (1 + 1e-9));
          return `$\\|D^\\alpha\\varphi\\|_N\\le\\|\\varphi\\|_{N+${s.a1 + s.a2}}$ for $N=0,\\dots,3$: ${ok ? 'yes' : 'no'}. But $\\|D^\\alpha\\varphi\\|_0/\\|\\varphi\\|_0=${v.fmt(s.ratio, 4)}$ — of order $\\omega^{${s.a1}}$ — so no estimate by $\\|\\varphi\\|_0$ alone can hold.`;
        });
      },
    },
    {
      num: '6.7',
      kind: 'Definition',
      name: 'Distributions',
      statement: String.raw`A **distribution** in $\Omega$ is a linear functional on $\mathscr D(\Omega)$ that is continuous for the topology $\tau$. The space of all distributions in $\Omega$ is denoted $\mathscr D'(\Omega)$.`,
      idea: String.raw`A distribution is known only through its action on test functions. By 6.6, continuity can be tested on sequences or on each $\mathscr D_K$ separately, which makes membership in $\mathscr D'(\Omega)$ easy to verify (6.8). Locally integrable functions and measures are distributions (6.11), but so are objects like $\delta'$ and the principal value of $1/x$, which are not functions at all.`,
      caption: String.raw`Choose a distribution on $\R$ and drag the test function $\varphi$ (its peak) or change its width. The top panel shows what $\Lambda$ "does" with $\varphi$ — evaluate it, minus its slope, integrate it over $(0,\infty)$, take the cancelling principal-value integral against $1/x$, or sum it over $\Z$. Bottom: the value $\Lambda(\varphi_c)$ for every translate $\varphi_c=\varphi(\cdot-c)$, with the current position marked.`,
      deps: ['fa-6.4', 'fa-6.6', 'fa-3.1'],
      tags: ['distributions'],
      viz(v) {
        const M = v.M, E = Math.E;
        const U = {
          delta: { label: '$\\delta_0$' }, dp: { label: "$\\delta_0'$" }, H: { label: '$\\Lambda_H$ (Heaviside)' }, pv: { label: '$\\mathrm{p.v.}\\tfrac1x$' }, comb: { label: '$\\sum_{k\\in\\Z}\\delta_k$' },
        };
        const which = v.select('$\\Lambda=$', Object.entries(U).map(([value, o]) => ({ value, label: o.label })), 'delta');
        const rS = v.slider('width of $\\varphi$', 0.3, 2.2, 1, { step: 0.01 });
        const top = v.stage({ x: [-4, 4], y: [-1.15, 1.5], height: 280, full: true, axes: true });
        const bot = v.stage({ x: [-4, 4], y: [-1, 1], height: 170, full: true, axes: true, title: 'translates: $c\\mapsto\\Lambda(\\varphi_c)$, $\\;\\varphi_c=\\varphi(\\cdot-c)$' });
        const pk = top.handle(0.7, 1, { color: 'blue', constrain: (x, y) => [M.clamp(x, -3.2, 3.2), M.clamp(y, 0.2, 1.3)] });
        const lam = (key, c, r) => {     // Λ(φ) for φ = ψ((x−c)/r)·e (peak 1)
          const ph = (x) => E * psiD(0, (x - c) / r), dph = (x) => E * psiD(1, (x - c) / r) / r;
          if (key === 'delta') return ph(0);
          if (key === 'dp') return -dph(0);
          if (key === 'H') { const a = Math.max(0, c - r), b = c + r; return b > a ? simpson(ph, a, b, 300) : 0; }
          if (key === 'pv') { const R = Math.abs(c) + r; return simpson((x) => (x < 1e-12 ? 2 * dph(0) : (ph(x) - ph(-x)) / x), 0, R, 600); }
          let s = 0; for (let k = Math.ceil(c - r); k <= Math.floor(c + r); k++) s += ph(k); return s;
        };
        const cache = {};
        const curve = (key, r) => { const k = key + r.toFixed(3); if (!cache[k]) cache[k] = M.linspace(-4, 4, 321).map((c) => [c, lam(key, c, r)]); return cache[k]; };
        let st = {};
        v.render(() => {
          const key = which.value, r = rS.value, c = pk.x, A = pk.y;
          const ph = (x) => A * E * psiD(0, (x - c) / r);
          const val = A * lam(key, c, r);
          top.setView(null, key === 'dp' || key === 'pv' ? [-1.15, 1.5] : [-0.35, 1.5]);
          // the distribution
          if (key === 'delta') { top.arrow(0, 0, 0, 1.25, { color: 'purple', width: 2.6, head: 10 }); top.tex('\\delta_0', 0.1, 1.25, { color: 'purple', align: 'left' }); top.dot(0, ph(0), { color: 'teal', r: 5.5, label: 'φ(0)', labelPos: 'ne' }); }
          if (key === 'dp') {
            top.arrow(-0.1, 0, -0.1, 1.1, { color: 'purple', width: 2.4, head: 9 }); top.arrow(0.1, 0, 0.1, -0.9, { color: 'purple', width: 2.4, head: 9 });
            top.tex("\\delta_0'", 0.2, 1.05, { color: 'purple', align: 'left' });
            const s0 = A * E * psiD(1, -c / r) / r, y0 = ph(0);
            top.line(-1.2, y0 - 1.2 * s0, 1.2, y0 + 1.2 * s0, { color: 'teal', width: 2, dash: [6, 4] });
            top.dot(0, y0, { color: 'teal', r: 5 });
            top.text(`slope φ′(0) = ${v.fmt(s0, 3)}`, 1.25, y0 + 1.2 * s0, { color: 'teal', size: 12 });
          }
          if (key === 'H') {
            top.fn(ph, { domain: [Math.max(0, c - r), Math.max(0, c + r)], fill: 'teal', fillAlpha: 0.3, color: 'teal', width: 0.1, n: 300 });
            top.line(-4, 0, 0, 0, { color: 'purple', width: 3 }); top.line(0, 1, 4, 1, { color: 'purple', width: 3 }); top.dot(0, 1, { color: 'purple', r: 3.5 });
            top.tex('H', -0.25, 1.05, { color: 'purple', align: 'right' });
          }
          if (key === 'pv') {
            const g = (x) => ph(x) / x;
            top.fn(g, { domain: [-4, -0.002], fill: 'teal', fillAlpha: 0.25, color: 'teal', width: 1.4, n: 900 });
            top.fn(g, { domain: [0.002, 4], fill: 'teal', fillAlpha: 0.25, color: 'teal', width: 1.4, n: 900 });
            top.fn((x) => 1 / x, { domain: [-4, -0.01], color: 'purple', width: 1.6, dash: [6, 4] }); top.fn((x) => 1 / x, { domain: [0.01, 4], color: 'purple', width: 1.6, dash: [6, 4] });
            top.tex('1/x', 0.75, 1.33, { color: 'purple', align: 'left' }); top.tex('\\varphi(x)/x', -3.9, -0.95, { color: 'teal', align: 'left', size: 14 });
          }
          if (key === 'comb') for (let k = -4; k <= 4; k++) { top.arrow(k, 0, k, 0.55, { color: 'purple', width: 2, head: 8 }); const y = ph(k); if (y > 1e-4) top.dot(k, y, { color: 'teal', r: 4.5 }); }
          top.fn(ph, { color: 'blue', width: 2.6, n: 600, domain: [c - r, c + r] });
          top.tex('\\varphi', c + 0.12, A, { color: 'blue', align: 'left', dy: -6 });
          top.corner(`Λφ = ${v.fmt(val, 4)}`, 'tl', { color: 'teal', weight: 700, size: 13 });
          // bottom: translates
          const C = curve(key, r).map(([x, y]) => [x, A * y]);
          let m = 0.3, neg = false; for (const p of C) { m = Math.max(m, Math.abs(p[1]) * 1.2); if (p[1] < -1e-6) neg = true; }
          bot.setView(null, [neg ? -m : -0.15 * m, m]);
          bot.path(C, { color: 'purple', width: 2.2 });
          bot.vline(c, { color: 'muted', dash: [3, 3], width: 1 });
          bot.dot(c, val, { color: 'teal', r: 5.5 });
          st = { key, val, c };
        });
        v.legend([['blue', 'test function $\\varphi$'], ['purple', 'the distribution $\\Lambda$'], ['teal', 'what $\\Lambda$ reads off $\\varphi$', { area: true }]]);
        v.readout(() => {
          const s = st, f = { delta: '\\varphi(0)', dp: "-\\varphi'(0)", H: '\\int_0^\\infty\\varphi\\,dx', pv: '\\int_0^\\infty\\frac{\\varphi(x)-\\varphi(-x)}{x}\\,dx', comb: '\\sum_{k\\in\\Z}\\varphi(k)' }[s.key];
          return `$\\Lambda\\varphi=${f}=${v.fix(s.val, 4)}$. Linear in $\\varphi$, and continuous: if $\\varphi_i\\to0$ in $\\mathscr D(\\R)$ then $\\Lambda\\varphi_i\\to0$ (see 6.8 for the estimates).`;
        });
      },
    },
    {
      num: '6.8',
      kind: 'Theorem',
      name: 'Distributions are locally of finite order',
      statement: String.raw`A linear functional $\Lambda$ on $\mathscr D(\Omega)$ is a distribution if and only if to every compact $K\subset\Omega$ correspond an integer $N\ge0$ and a constant $C<\infty$ with
$$|\Lambda\varphi|\le C\,\|\varphi\|_N\qquad(\varphi\in\mathscr D_K).$$
If one $N$ works for every $K$, the smallest such $N$ is the **order** of $\Lambda$; if none does, $\Lambda$ has infinite order.`,
      idea: String.raw`By 6.6, $\Lambda$ is continuous exactly when each restriction $\Lambda|_{\mathscr D_K}$ is. The topology $\tau_K$ is defined by the increasing norms $\|\cdot\|_N$, so a linear functional on $\mathscr D_K$ is continuous if and only if it is bounded on some ball $\{\|\varphi\|_N<1/C\}$, i.e. dominated by one of these norms.`,
      caption: String.raw`Pick $\Lambda$ and $K=[-R,R]$. Probes $\varphi_j=\psi(x/R)\cdot\{\cos jx,\ \sin jx,\ \tanh jx\}$ in $\mathscr D_K$ try to make $|\Lambda\varphi|/\|\varphi\|_N$ large; the lower panel plots the worst ratio against $j$ on log–log axes for $N=0,1,2,3$. Green lines stay bounded (that $N$ works), red ones grow. $\delta^{(m)}$ needs $N=m$; p.v.$\,1/x$ needs $N=1$ (the $N=0$ ratio grows like $\log j$); for $\sum_k\delta_k^{(k)}$ the required $N$ grows with $R$ — infinite order.`,
      deps: ['fa-6.6', 'fa-6.7', 'fa-1.46', 'fa-1.37'],
      tags: ['distributions', 'order', 'seminorms'],
      viz(v) {
        const M = v.M, E = Math.E;
        const LAM = {
          d0: { label: '$\\delta$' }, d1: { label: "$\\delta'$" }, d2: { label: "$\\delta''$" }, pv: { label: '$\\mathrm{p.v.}\\frac1x$' }, f: { label: '$|x|^{-1/2}$' }, comb: { label: '$\\sum_k\\delta_k^{(k)}$' },
        };
        const which = v.select('$\\Lambda=$', Object.entries(LAM).map(([value, o]) => ({ value, label: o.label })), 'd1');
        const RS = v.slider('$K=[-R,R]$, $R=$', 0.5, 3.6, 1, { step: 0.05 });
        const jS = v.slider('$\\log_{10}$ of the probe frequency $j$', 0, 2.5, 1.2, { step: 0.01, fmt: (x) => `j = ${Math.round(10 ** x)}` });
        const top = v.stage({ x: [-3.9, 3.9], y: [-1.35, 1.45], height: 230, full: true, axes: true });
        const bot = v.stage({ x: [-0.08, 2.62], y: [-2, 4], height: 250, full: true, axes: 'box', xticks: [[0, 'j = 1'], [1, '10'], [2, '100']], title: 'worst ratio $|\\Lambda\\varphi|/\\|\\varphi\\|_N$ over the probes (log–log)' });
        const JS = M.linspace(0, 2.5, 28).map((t) => 10 ** t);
        const PR = [(x, j) => cosJet(x, j, 0, 3), (x, j) => cosJet(x, j, -Math.PI / 2, 3), (x, j) => tanhJet(x, j, 3)];
        const probeJet = (p, x, j, R) => jetMul(bumpJet(x, 0, R, E, 3), PR[p](x, j));
        const nCache = {}, lCache = {};
        const norms = (R) => {
          const key = R.toFixed(2); if (nCache[key]) return nCache[key];
          return (nCache[key] = JS.map((j) => PR.map((_, p) => { const s = jetSups((x) => probeJet(p, x, j, R), -R, R, 3, Math.ceil(2 * R * j * 24 / (2 * Math.PI)) + 600); const n = []; let run = 0; for (let N = 0; N <= 3; N++) { run = Math.max(run, s[N]); n.push(run); } return n; })));
        };
        const value = (key, p, j, R) => {
          const P = (x) => probeJet(p, x, j, R)[0];
          if (key === 'd0') return probeJet(p, 0, j, R)[0];
          if (key === 'd1') return -probeJet(p, 0, j, R)[1];
          if (key === 'd2') return probeJet(p, 0, j, R)[2];
          if (key === 'pv') { if (p === 0) return 0; const d0 = probeJet(p, 0, j, R)[1]; return simpson((x) => (x < 1e-12 ? 2 * d0 : (P(x) - P(-x)) / x), 0, R, Math.ceil(R * j * 16) + 2000); }
          if (key === 'f') { const s = Math.sqrt(R); return 2 * simpson((u) => P(u * u) + P(-u * u), 0, s, Math.ceil(5 * R * j) + 2000); }
          let s = 0; for (let k = 0; k < R; k++) s += probeJet(p, k, j, R)[k]; return s;
        };
        const ratios = (key, R) => {
          const ck = key + R.toFixed(2); if (lCache[ck]) return lCache[ck];
          const NM = norms(R);
          return (lCache[ck] = JS.map((j, i) => { const vals = PR.map((_, p) => Math.abs(value(key, p, j, R))); return [0, 1, 2, 3].map((N) => Math.max(...vals.map((x, p) => x / NM[i][p][N]))); }));
        };
        const orderOf = (key, R) => ({ d0: 0, d1: 1, d2: 2, pv: 1, f: 0, comb: Math.max(0, Math.ceil(R) - 1) })[key];
        let st = {};
        v.render(() => {
          const key = which.value, R = RS.value, j = 10 ** jS.value;
          const Rt = ratios(key, R);
          // which probe is worst at the current j for N = 0
          const vals = PR.map((_, p) => Math.abs(value(key, p, j, R)));
          const nrm = PR.map((_, p) => jetSups((x) => probeJet(p, x, j, R), -R, R, 0, Math.ceil(2 * R * j * 24 / (2 * Math.PI)) + 600)[0]);
          const pw = M.argmax(vals.map((x, p) => x / nrm[p]));
          // ---- top
          top.setView(key === 'comb' ? [-R - 0.4, Math.max(R, 3.2) + 0.4] : [-Math.max(R, 1.2) - 0.4, Math.max(R, 1.2) + 0.4], null);
          top.vband(-R, R, { color: 'orange', alpha: 0.1, edges: true });
          top.tex('K', R, -1.3, { color: 'orange', align: 'left', baseline: 'bottom', dx: 5 });
          const sc = 1 / nrm[pw];
          top.fn((x) => sc * probeJet(pw, x, j, R)[0], { domain: [-R, R], color: 'blue', width: 1.8, n: Math.min(4000, Math.ceil(2 * R * j * 10) + 400) });
          if (key[0] === 'd') { const m = +key[1]; top.arrow(0, 0, 0, 1.3, { color: 'purple', width: 2.6, head: 10 }); top.tex(['\\delta', "\\delta'", "\\delta''"][m], 0.1, 1.3, { color: 'purple', align: 'left' }); }
          if (key === 'pv') { top.fn((x) => 0.3 / x, { domain: [-3.9, -0.2], color: 'purple', width: 1.6, dash: [6, 4] }); top.fn((x) => 0.3 / x, { domain: [0.2, 3.9], color: 'purple', width: 1.6, dash: [6, 4] }); }
          if (key === 'f') top.fn((x) => 0.4 / Math.sqrt(Math.abs(x)), { domain: [-3.9, 3.9], color: 'purple', width: 1.6, dash: [6, 4] });
          if (key === 'comb') for (let k = 0; k <= 3; k++) { top.arrow(k, 0, k, 1.25, { color: k < R ? 'purple' : 'faint', width: 2.2, head: 9 }); top.tex(`\\delta_{${k}}^{(${k})}`, k + 0.08, 1.3, { color: k < R ? 'purple' : 'faint', align: 'left', size: 13 }); }
          top.setTitle(`probe $\\varphi=\\psi(x/R)\\,${['\\cos jx', '\\sin jx', '\\tanh jx'][pw]}$ with $j=${Math.round(j)}$ (normalised to $\\|\\varphi\\|_0=1$)`);
          // ---- bottom
          const lg = Rt.map((row) => row.map((x) => Math.log10(Math.max(x, 1e-9))));
          const all = lg.flat(), lo = Math.floor(Math.min(...all)) - 0.3, hi = Math.ceil(Math.max(...all)) + 0.3;
          bot.setView(null, [lo, hi]); bot.setTicks(undefined, intTicks(Math.ceil(lo), Math.floor(hi), Math.max(1, Math.ceil((hi - lo) / 6))));
          const ord = orderOf(key, R), DASH = [[], [8, 4], [3, 3], [10, 3, 2, 3]];
          const slopes = [];
          for (let N = 0; N <= 3; N++) {
            const pts = lg.map((row, i) => [Math.log10(JS[i]), row[N]]);
            const ok = N >= ord;
            bot.path(pts, { color: ok ? 'green' : 'red', width: 2.2, dash: DASH[N] });
            bot.text(`N=${N}`, 2.6, pts[pts.length - 1][1], { color: ok ? 'green' : 'red', align: 'right', dy: -8, size: 11 });
            slopes.push((pts[pts.length - 1][1] - pts[pts.length - 12][1]) / (pts[pts.length - 1][0] - pts[pts.length - 12][0]));
          }
          bot.vline(jS.value, { color: 'muted', dash: [3, 3], width: 1 });
          st = { key, R, ord, slopes, C: Rt[Rt.length - 1][Math.min(3, ord)], j };
        });
        v.legend([['blue', 'worst probe in $\\mathscr D_K$'], ['purple', '$\\Lambda$'], ['green', 'ratio bounded: this $N$ works'], ['red', 'ratio unbounded']]);
        v.readout(() => {
          const s = st, sl = s.slopes.map((x, N) => `$N=${N}$: $${v.fix(x, 2)}$`).join(', ');
          const what = s.key === 'comb' ? `on $\\mathscr D_K$ with $R=${v.fix(s.R, 2)}$ one needs $N=${s.ord}$, and this grows with $K$: $\\Lambda$ has infinite order.` : `$\\Lambda$ has order $${s.ord}$: $|\\Lambda\\varphi|\\le C\\|\\varphi\\|_{${s.ord}}$ on $\\mathscr D_K$ (here $C\\gtrsim ${v.fmt(s.C, 3)}$).`;
          return `Log–log slopes over the last decade — ${sl}. ${what}`;
        });
      },
    },
  ],
};
