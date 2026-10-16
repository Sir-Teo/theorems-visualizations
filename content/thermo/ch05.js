// Thermodynamics & Statistical Mechanics — Chapter 5: Counting microstates: the statistical meaning of entropy
import { clamp, lerp, R, KB, lnGam, lnFac, lnBin, lnEin, lnStirling, shannon, texExp, log10Tail, sup10, tRamp, ramp, pick } from './ch05.shared.js';

// ---------- helpers for this file ----------
/** Probability list over k of a binomial(n, 1/2). */
const binomP = (n) => Array.from({ length: n + 1 }, (_, k) => Math.exp(lnBin(n, k) - n * Math.LN2));
/** Exact probability that |k − n/2| ≤ w for a fair-coin count. */
const binomWithin = (n, w) => { let s = 0; for (let k = 0; k <= n; k++) if (Math.abs(k - n / 2) <= w + 1e-9) s += Math.exp(lnBin(n, k) - n * Math.LN2); return s; };
/** Compositions of q into N non-negative parts, in lexicographic order. */
function compositions(N, q) {
  const out = [], cur = new Array(N).fill(0);
  (function rec(i, left) {
    if (i === N - 1) { cur[i] = left; out.push(cur.slice()); return; }
    for (let a = 0; a <= left; a++) { cur[i] = a; rec(i + 1, left - a); }
  })(0, q);
  return out;
}
/** ln Ω of two Einstein solids as a function of q_A (total q): returns arrays over 0..q. */
function twoSolids(NA, NB, q) {
  const a = [], b = [], t = [];
  for (let k = 0; k <= q; k++) { const x = lnEin(NA, k), y = lnEin(NB, q - k); a.push(x); b.push(y); t.push(x + y); }
  return { a, b, t };
}
const argmax = (xs) => { let m = 0; for (let i = 1; i < xs.length; i++) if (xs[i] > xs[m]) m = i; return m; };

export default {
  collection: 'thermo',
  chapter: 5,
  title: 'Counting microstates: the statistical meaning of entropy',
  summary: String.raw`Entropy counts microscopic arrangements: $S = k\ln\Omega$. For large systems multiplicities are fantastically sharp, so the most probable macrostate is overwhelmingly likely and the second law becomes a statement of probability; temperature is the rate at which entropy grows with energy, which can even be negative. Counting gas states requires a phase-space cell of size $h$ and a factor $N!$ for identical particles, giving the Sackur–Tetrode entropy and resolving Gibbs's paradox. Reversibility, recurrence, Maxwell's demon and Landauer's principle probe the foundations.`,
  items: [
    // ------------------------------------------------------------------ 5.1
    {
      num: '5.1', kind: 'Definition', name: 'Microstates, macrostates and multiplicity',
      statement: String.raw`A **microstate** is a complete specification of a system at the finest level of description in use (for $N$ coins: which ones show heads; for a gas, the quantum state of every molecule). A **macrostate** is a specification by the few quantities one can measure or control (the number of heads; $U$, $V$, $N$). Many microstates realise the same macrostate, and the **multiplicity** $\Omega$ of a macrostate is the number of microstates that do. For $N$ two-sided coins the total number of microstates is $2^N$, and the macrostate "$k$ heads" has $\Omega(k)=\binom{N}{k}=\dfrac{N!}{k!\,(N-k)!}$; multiplicities of different macrostates are in general very unequal.`,
      idea: String.raw`Counting is just combinatorics: choose which $k$ of the $N$ coins are heads. What makes the definition powerful is the sum rule $\sum_k\Omega(k)=2^N$ together with the shape of $\Omega(k)$: it is symmetric about $N/2$ and peaked there, because there are more ways to mix heads and tails than to line them all up. If every microstate is equally likely (which 5.5 will elevate to a postulate), the probability of a macrostate is $\Omega/\Omega_{\text{total}}$, so a randomly chosen microstate almost always belongs to one of the high-multiplicity macrostates near the middle.`,
      caption: String.raw`**Change $N$**, then press *Flip all* to draw a microstate uniformly at random and *Flip 1000×* to accumulate many draws. The bars are the exact multiplicities $\binom{N}{k}/2^N$ (the probability of $k$ heads); the gold dots are the sampled frequencies. Switch to $\ln\Omega$ to see the same data on the scale that entropy will use. Notice how little of the probability sits at the extremes: for $N=100$ the all-heads macrostate has multiplicity 1 and is never seen.`,
      deps: [], refs: ['Schroeder §2.1'], tags: ['multiplicity', 'microstates'],
      viz(v) {
        const Ns = v.slider('number of coins $N$', 2, 100, 20, { int: true, onChange: () => reset() });
        const lnm = v.toggle('show $\\ln\\Omega$ instead of probability', false);
        const rng = v.rng(3);
        let cur = [], counts = new Array(101).fill(0), total = 0;
        const draw = () => Array.from({ length: Ns.value }, () => (rng() < 0.5 ? 1 : 0));
        const reset = () => { counts = new Array(101).fill(0); total = 0; cur = draw(); counts[cur.reduce((a, b) => a + b, 0)]++; total = 1; };
        reset();
        v.button('Flip all', () => { cur = draw(); counts[cur.reduce((a, b) => a + b, 0)]++; total++; });
        v.button('Flip 1000×', () => { for (let i = 0; i < 1000; i++) { cur = draw(); counts[cur.reduce((a, b) => a + b, 0)]++; total++; } });
        v.button('Reset', reset);
        const sc = v.stage({ x: [0, 10], y: [0, 5], equal: true, axes: false, height: 250, weight: 0.8, minWidth: 240, title: 'one microstate: ● heads, ○ tails' });
        const sh = v.stage({ x: [-1, 21], y: [0, 0.2], axes: 'box', gutter: true, height: 250, weight: 1.3, xlabel: 'number of heads $k$', ylabel: 'probability', title: 'the macrostates' });
        let st = null;
        v.render(() => {
          const N = Ns.value, k0 = cur.reduce((a, b) => a + b, 0);
          const cols = Math.ceil(Math.sqrt(N * 1.9)), rows = Math.ceil(N / cols);
          sc.setView([0, cols], [0, rows]);
          const r = clamp(11 - N / 12, 4, 11);
          cur.forEach((b, i) => sc.dot((i % cols) + 0.5, rows - 1 - Math.floor(i / cols) + 0.5, { r, color: b ? 'accent' : 'muted', hollow: !b, ring: true }));
          const P = binomP(N), pm = Math.max(...P);
          if (lnm.value) {
            const L = Array.from({ length: N + 1 }, (_, k) => lnBin(N, k));
            sh.setView([-0.5, N + 0.5], [0, Math.max(0.8, Math.max(...L) * 1.15)]);
            sh.setLabels('number of heads $k$', '$\\ln\\Omega(k)$');
            sh.bars(L, { x0: 0, dx: 1, color: 'accent' });
            sh.dot(k0, lnBin(N, k0), { r: 5, color: 'gold' });
          } else {
            sh.setView([-0.5, N + 0.5], [0, pm * 1.25]);
            sh.setLabels('number of heads $k$', 'probability');
            sh.bars(P, { x0: 0, dx: 1, color: 'accent' });
            if (total > 0) sh.dots(counts.slice(0, N + 1).map((c, k) => [k, c / total]), { r: Math.max(2.2, 4.5 - N / 40), color: 'gold' });
            sh.vline(k0, { color: 'gold', width: 1.2, dash: true });
          }
          st = { N, k0, P, total };
        });
        v.legend([['accent', 'multiplicity $\\binom{N}{k}$'], ['gold', 'sampled / current draw']]);
        v.readout(() => {
          if (!st) return '';
          const { N, k0, total } = st, w = Math.sqrt(N);
          return `$N=${N}$: total microstates $2^N=${texExp(N * Math.LN2)}$ · this draw has $k=${k0}$ heads, multiplicity $\\binom{${N}}{${k0}}=${texExp(lnBin(N, k0))}$ (probability ${sup10(Math.log10(Math.exp(lnBin(N, k0) - N * Math.LN2)))})\nlargest multiplicity $\\binom{${N}}{${Math.floor(N / 2)}}=${texExp(lnBin(N, Math.floor(N / 2)))}$ · fraction of all microstates within $\\pm\\sqrt N$ heads of $N/2$: **${v.fix(100 * binomWithin(N, w), 1)} %** · draws so far: ${total}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.2
    {
      num: '5.2', kind: 'Model', name: 'Two-state paramagnet',
      statement: String.raw`A two-state paramagnet is $N$ distinguishable, non-interacting magnetic dipoles $\mu$ in a field $B$, each pointing along or against the field. With $N_\uparrow$ dipoles aligned and $N_\downarrow=N-N_\uparrow$ anti-aligned, the energy is $U=-\mu B\,(N_\uparrow-N_\downarrow)$ and the macrostate is fixed by $U$ (equivalently $N_\uparrow$). Its multiplicity is $\Omega(N_\uparrow)=\binom{N}{N_\uparrow}$, so the entropy $S=k\ln\Omega$ rises from zero at the ground state $U=-N\mu B$ to a maximum at $U=0$ and falls again to zero at $U=+N\mu B$. For large $N$, $S\approx -Nk\,[x\ln x+(1-x)\ln(1-x)]$ with $x=N_\uparrow/N$.`,
      idea: String.raw`Fixing the energy fixes the number of up dipoles; the multiplicity is then the same binomial coefficient as for coin flips (5.1), with "heads" meaning "aligned". Stirling's formula (pma-8.22) turns $\ln\binom{N}{N_\uparrow}$ into the binary-entropy form. The entropy is not monotonic in energy: with the energy bounded above, there are more ways to be half-flipped than fully flipped, a feature of systems with a bounded spectrum that will give negative temperatures in 5.9. The spin-½ nature of each dipole (qm-7.7) is what makes two states per dipole.`,
      caption: String.raw`**Choose $N$ and drag the fraction of up dipoles** (or the handle on the middle panel). Left: the dipoles, arranged at random for a given fraction. Middle: multiplicity of each energy relative to the largest. Right: $S/Nk$ against $U/N\mu B$ — the exact points and the Stirling curve — with the tangent whose slope is $\mu B/kT$ (see 5.8). Notice that the energy $U=0$ has the largest multiplicity, and that the tangent slope changes sign there.`,
      deps: ['thermo-5.1', 'qm-7.7'], refs: ['Schroeder §2.1'], tags: ['paramagnet', 'entropy'],
      viz(v) {
        const Ns = v.select('number of dipoles $N$', ['10', '20', '50', '100'], '50');
        const fr = v.slider('fraction pointing up $N_\\uparrow/N$', 0, 1, 0.72, { step: 0.01, fmt: (x) => v.fix(x, 2) });
        const order = (() => { const r = v.rng(8); return r.shuffle(Array.from({ length: 100 }, (_, i) => i)); })();
        const sa = v.stage({ x: [0, 10], y: [0, 5], equal: true, axes: false, height: 250, weight: 0.8, minWidth: 220, title: 'the dipoles (field points up)' });
        const sb = v.stage({ x: [-1, 1], y: [0, 1.15], axes: 'box', gutter: true, height: 250, weight: 1, xlabel: '$U/N\\mu B$', ylabel: '$\\Omega/\\Omega_{\\max}$', title: 'multiplicity' });
        const sc = v.stage({ x: [-1, 1], y: [0, 0.8], axes: 'box', gutter: true, height: 250, weight: 1, xlabel: '$U/N\\mu B$', ylabel: '$S/Nk$', title: 'entropy' });
        const hS = sc.handle(0.4, 0.4, { color: 'gold', r: 6 });
        let lock = false;
        hS.onDrag = () => { lock = true; fr.set(clamp((1 - hS.x) / 2, 0, 1)); lock = false; };
        let st = null;
        v.render(() => {
          const N = +Ns.value, nu = Math.round(fr.value * N), x = nu / N, U = -(2 * nu - N) / N;
          const cols = Math.ceil(Math.sqrt(N * 1.9)), rows = Math.ceil(N / cols);
          sa.setView([0, cols], [0, rows]);
          const L = 0.38;
          const rank = Array.from({ length: N }, (_, i) => i).sort((a, b) => order[a] - order[b]), isUp = new Array(N).fill(false);
          for (let j = 0; j < nu; j++) isUp[rank[j]] = true;
          for (let i = 0; i < N; i++) {
            const up = isUp[i];
            const cx = (i % cols) + 0.5, cy = rows - 1 - Math.floor(i / cols) + 0.5;
            sa.arrow(cx, cy - (up ? L : -L), cx, cy + (up ? L : -L), { color: up ? 'accent' : 'orange', width: 2, head: 6 });
          }
          const lnO = Array.from({ length: N + 1 }, (_, k) => lnBin(N, k)), mx = lnO[Math.floor(N / 2)];
          for (let k = 0; k <= N; k++) {
            const u = -(2 * k - N) / N, rel = Math.exp(lnO[k] - mx);
            sb.rect(u - 0.9 / N, 0, u + 0.9 / N, rel, { fill: k === nu ? 'gold' : 'accent', fillAlpha: k === nu ? 0.9 : 0.55, stroke: false });
          }
          const sf = (xx) => (xx <= 0 || xx >= 1 ? 0 : -(xx * Math.log(xx) + (1 - xx) * Math.log(1 - xx)));
          sc.fn((u) => sf((1 - u) / 2), { domain: [-1, 1], color: 'ink', width: 1.6, n: 200 });
          sc.dots(lnO.map((l, k) => [-(2 * k - N) / N, l / N]), { r: 2.8, color: 'accent' });
          const sl = nu > 0 && nu < N ? (lnO[nu - 1] - lnO[nu + 1]) / 4 : 0;   // d ln Ω / d(U/μB) = μB/kT
          const s0 = lnO[nu] / N;
          if (nu > 0 && nu < N) sc.line(U - 0.5, s0 - 0.5 * sl, U + 0.5, s0 + 0.5 * sl, { color: 'gold', width: 2 });
          if (!lock) hS.set(U, s0);
          st = { N, nu, U, lnO: lnO[nu], sl, s0 };
        });
        v.readout(() => {
          if (!st) return '';
          const { N, nu, U, lnO, sl, s0 } = st;
          return `$N_\\uparrow=${nu}$, $N_\\downarrow=${N - nu}$, $U=${v.fix(U * N, 0)}\\,\\mu B$ · $\\Omega=\\binom{${N}}{${nu}}=${texExp(lnO)}$ · $S/k=\\ln\\Omega=${v.fix(lnO, 2)}$, $S/Nk=${v.fix(s0, 3)}$ (Stirling: ${v.fix(-(nu / N * Math.log(nu / N || 1) + (1 - nu / N) * Math.log(1 - nu / N || 1)), 3)})\nslope $\\partial(S/k)/\\partial(U/\\mu B)=\\mu B/kT=${v.fix(sl, 3)}$ ${nu > N / 2 ? '(positive: $U<0$)' : nu < N / 2 ? '(negative: $U>0$, see 5.9)' : '(zero: the entropy maximum)'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.3
    {
      num: '5.3', kind: 'Model', name: 'Einstein solid',
      statement: String.raw`An Einstein solid is a collection of $N$ identical, independent, distinguishable quantum harmonic oscillators, each able to hold $n=0,1,2,\dots$ quanta of energy $\varepsilon=\hbar\omega$ (the zero-point energy is a constant and is dropped). The macrostate with $q$ quanta in total has multiplicity $\Omega(N,q)=\binom{q+N-1}{q}$: the number of ways to distribute $q$ identical quanta among $N$ labelled oscillators. If all microstates of fixed $q$ are equally likely, the probability that oscillator 1 holds exactly $n$ quanta is $\Omega(N-1,q-n)/\Omega(N,q)$.`,
      idea: String.raw`Arrange the $q$ quanta as dots and the $N-1$ walls between oscillators as bars in a row of length $q+N-1$; choosing which positions are dots counts the distributions, so $\Omega=\binom{q+N-1}{q}$. The energy ladder of each oscillator is equally spaced (qm-4.3), which is exactly what lets quanta be treated as identical units shared among the oscillators. A random walk that moves one quantum between a randomly chosen pair of oscillators treats all microstates alike, so its long-run visit frequencies are flat: the model is the simplest stage on which "all microstates are equally likely" can be watched at work.`,
      caption: String.raw`**Set $N$ and $q$** (kept small so that every microstate can be listed). Top left: the current microstate, the number of quanta on each oscillator. Press *Hop 20000×* to let quanta move between random pairs of oscillators: the middle panel counts how often each of the $\Omega$ microstates (one bar each) is visited — the bars come out level. Right: $\ln\Omega$ against $q$ for the chosen $N$, whose growth with energy is the root of everything in 5.8.`,
      deps: ['thermo-5.1', 'qm-4.3'], refs: ['Schroeder §2.2'], tags: ['Einstein solid', 'multiplicity'], credit: 'A. Einstein, 1907 (quantized oscillators as a model of a solid)',
      scope: String.raw`A model of independent oscillators of one frequency; real solids have a spectrum of frequencies (Debye), and coupling between oscillators is neglected here.`,
      viz(v) {
        const Ns = v.slider('oscillators $N$', 2, 5, 3, { int: true, onChange: () => init() });
        const qs = v.slider('quanta $q$', 0, 8, 4, { int: true, onChange: () => init() });
        const rng = v.rng(21);
        let micro = [], idx = new Map(), visits = [], state = [], hops = 0;
        function init() {
          const N = Ns.value, q = qs.value;
          micro = compositions(N, q); idx = new Map(micro.map((m, i) => [m.join(','), i])); visits = new Array(micro.length).fill(0);
          state = new Array(N).fill(0); state[0] = q; hops = 0; run(20000);
        }
        function run(n) {
          const N = Ns.value;
          for (let h = 0; h < n; h++) {
            const i = Math.floor(rng() * N), j = Math.floor(rng() * N);
            if (i !== j && state[i] > 0) { state[i]--; state[j]++; }
            visits[idx.get(state.join(','))]++; hops++;
          }
        }
        init();
        v.button('Hop 20000×', () => run(20000));
        v.button('Restart', () => { init(); });
        const sa = v.stage({ x: [0.3, 6.7], y: [0, 9], axes: 'box', gutter: true, height: 240, weight: 0.9, minWidth: 220, xlabel: 'oscillator', ylabel: 'quanta $n_i$', title: 'one microstate' });
        const sb = v.stage({ x: [0, 20], y: [0, 2], axes: 'box', gutter: true, height: 240, weight: 1.3, xlabel: 'microstate (listed in order)', ylabel: 'visits / mean', title: 'visit frequency of each microstate' });
        const sc = v.stage({ x: [-0.5, 12.5], y: [0, 10], axes: 'box', gutter: true, height: 240, weight: 0.9, minWidth: 220, xlabel: 'quanta $q$', ylabel: '$\\ln\\Omega(N,q)$', title: 'multiplicity grows with energy' });
        let st = null;
        v.render(() => {
          const N = Ns.value, q = qs.value, M = micro.length;
          sa.setView([0.3, N + 0.7], [0, Math.max(2, q + 1)]);
          state.forEach((n, i) => sa.rect(i + 0.7, 0, i + 1.3, n, { fill: 'accent', fillAlpha: 0.6, color: 'accent', width: 1.2 }));
          const mean = hops / M;
          sb.setView([-0.5, M - 0.5], [0, 2]);
          sb.bars(visits.map((c) => c / mean), { x0: 0, dx: 1, color: 'accent' });
          sb.hline(1, { color: 'green', width: 1.5, dash: true });
          const lo = Math.min(...visits) / mean, hi = Math.max(...visits) / mean;
          const mxl = lnEin(N, 12);
          sc.setView([-0.5, 12.5], [0, mxl * 1.1]);
          sc.bars(Array.from({ length: 13 }, (_, k) => lnEin(N, k)), { x0: 0, dx: 1, color: 'blue' });
          sc.dot(q, lnEin(N, q), { r: 5.5, color: 'gold' });
          st = { N, q, M, lo, hi, hops };
        });
        v.readout(() => {
          if (!st) return '';
          const { N, q, M, lo, hi, hops } = st;
          const tab = Array.from({ length: 7 }, (_, k) => Math.round(Math.exp(lnEin(N, k)))).join(', ');
          return `$N=${N}$, $q=${q}$: $\\Omega=\\binom{${q + N - 1}}{${q}}=${M}$ microstates (listed: ${M}) · after ${hops} hops every microstate was visited between **${v.fix(lo, 2)}** and **${v.fix(hi, 2)}** times the mean\n$\\Omega(${N},q)$ for $q=0,\\dots,6$: ${tab}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.4
    {
      num: '5.4', kind: 'Theorem', name: 'Multiplicities become sharply peaked',
      statement: String.raw`Let two Einstein solids (5.3), each of $N$ oscillators, share $q=2N\bar n$ quanta, and consider the macrostate in which solid A holds $q_A$ of them. Its multiplicity is $\Omega_A(q_A)\,\Omega_B(q-q_A)$, and for $N\gg1$, $\bar n=O(1)$ it has a single maximum at $q_A=q/2$ with a Gaussian shape of standard deviation $\sigma=\sqrt{N\bar n(1+\bar n)/2}$. The **relative** width $\sigma/q_A\propto1/\sqrt N$ therefore shrinks without limit: for macroscopic $N\sim10^{23}$ deviations of even $10^{-9}$ of the energy are astronomically improbable. The same statement holds for any pair of macroscopic systems sharing a conserved quantity.`,
      idea: String.raw`Write $\ln\Omega_A(q_A)$ with Stirling's formula (pma-8.22): $\ln\Omega\approx N[(1+x)\ln(1+x)-x\ln x]$ with $x=q_A/N$, an extensive, smooth, concave function. The sum $\ln\Omega_A+\ln\Omega_B$ of two such terms is maximal at the symmetric split and falls quadratically around it with curvature of order $1/N$ per quantum$^2$ (the second derivative is $-2/[N\bar n(1+\bar n)]$). Exponentiating gives a Gaussian of variance $\propto N$, while the mean $q_A\propto N$: the ratio of the two scales is $N^{-1/2}$.`,
      caption: String.raw`**Slide $\log_{10}N$** from 10 to $10^{23}$. In *whole range* the curve is the multiplicity of the energy split $q_A/q$, normalised to its peak: it collapses to a spike. In *zoom* the horizontal axis is measured in units of $\sigma$ and all curves look the same Gaussian. Orange is the Gaussian prediction; the blue curve is exact (evaluated through log-gamma) up to $N=10^9$, beyond which only the Gaussian is drawn. The right panel plots $\sigma/q_A$ against $N$ on log axes: the slope is $-\tfrac12$.`,
      deps: ['thermo-5.3', 'pma-8.22'], refs: ['Schroeder §2.4'], tags: ['fluctuations', 'Stirling'],
      scope: String.raw`Large $N$ with fixed energy per oscillator; the Gaussian formula for $\sigma$ is the leading term and is checked against the exact sums here for $N\le3000$.`,
      viz(v) {
        const lg = v.slider('$\\log_{10}N$', 1, 23, 3, { step: 0.1, fmt: (x) => v.fix(x, 1) });
        const nb = v.slider('quanta per oscillator $\\bar n$', 0.25, 4, 1, { step: 0.05, fmt: (x) => v.fix(x, 2) });
        const view = v.select('view', [{ value: 'whole', label: 'whole range' }, { value: 'zoom', label: 'zoom in $\\sigma$' }], 'whole');
        const sa = v.stage({ x: [0, 1], y: [0, 1.12], axes: 'box', gutter: true, height: 300, weight: 1.35, xlabel: '$q_A/q$', ylabel: '$\\Omega_{AB}/\\Omega_{\\max}$', title: 'multiplicity of the energy split' });
        const sb = v.stage({ x: [1, 1e24], y: [1e-13, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 240, xlabel: 'oscillators $N$ per solid', ylabel: '$\\sigma/q_A$', title: 'relative width' });
        const gsig = (N, n) => Math.sqrt(N * n * (1 + n) / 2);
        const cache = new Map();
        const exactSig = (N, n) => {
          const key = N + '|' + n; if (cache.has(key)) return cache.get(key);
          const q = Math.round(2 * N * n), L = []; let mx = -Infinity;
          for (let k = 0; k <= q; k++) { const l = lnEin(N, k) + lnEin(N, q - k); L.push(l); if (l > mx) mx = l; }
          let s0 = 0, s1 = 0, s2 = 0; L.forEach((l, k) => { const w = Math.exp(l - mx); s0 += w; s1 += w * k; s2 += w * k * k; });
          const m = s1 / s0, out = { sig: Math.sqrt(s2 / s0 - m * m), q }; cache.set(key, out); return out;
        };
        let st = null;
        v.render(() => {
          const N = Math.round(10 ** lg.value), n = nb.value, q = 2 * N * n, sig = gsig(N, n), exact = N <= 1e9;
          const lnO = (qA) => lnEin(N, qA) + lnEin(N, Math.round(q) - qA);
          const qi = Math.round(q), mid = qi / 2;
          const gau = (qA) => Math.exp(-((qA - mid) ** 2) / (2 * sig * sig));
          if (view.value === 'whole') {
            sa.setView([0, 1], [0, 1.12]); sa.setLabels('$q_A/q$', '$\\Omega_{AB}/\\Omega_{\\max}$');
            sa.fn((x) => gau(x * q), { domain: [0, 1], color: 'orange', width: 2.2, dash: [6, 4], n: 1500 });
            if (exact) {
              const xs = new Set();
              if (qi <= 3000) for (let k = 0; k <= qi; k++) xs.add(k);
              else { for (let i = 0; i <= 500; i++) xs.add(Math.round(qi * i / 500)); for (let i = -300; i <= 300; i++) xs.add(clamp(Math.round(mid + i * sig / 50), 0, qi)); }
              const ks = [...xs].sort((a, b) => a - b), m0 = lnO(Math.round(mid));
              const pts = ks.map((k) => [k / q, Math.exp(lnO(k) - m0)]);
              sa.path(pts, { color: 'blue', width: 2.6 });
            }
            sa.vline(0.5, { color: 'faint', width: 1 });
          } else {
            sa.setView([-5, 5], [0, 1.12]); sa.setLabels('$(q_A-q/2)/\\sigma$', '$\\Omega_{AB}/\\Omega_{\\max}$');
            sa.fn((z) => Math.exp(-z * z / 2), { domain: [-5, 5], color: 'orange', width: 2.2, dash: [6, 4], n: 300 });
            if (exact) {
              const m0 = lnO(Math.round(mid)), pts = [];
              for (let i = -200; i <= 200; i++) { const z = i / 40, k = Math.round(mid + z * sig); if (k >= 0 && k <= qi) pts.push([(k - mid) / sig, Math.exp(lnO(k) - m0)]); }
              sa.path(pts, { color: 'blue', width: 2.6 });
            }
          }
          sb.fn((NN) => gsig(NN, n) / (NN * n), { color: 'orange', width: 2, dash: [6, 4], n: 200 });
          const ex = [10, 30, 100, 300, 1000, 3000].map((NN) => { const e = exactSig(NN, n); return [NN, e.sig / (e.q / 2)]; });
          sb.dots(ex, { r: 4, color: 'blue' });
          sb.dot(N, sig / (N * n), { r: 6, color: 'gold' });
          let exs = null; if (N <= 3000) exs = exactSig(N, n);
          const dev = 0.01 * q / 2, z = dev / sig;
          st = { N, n, q, sig, exact, exs, z, tail: log10Tail(z), rel: sig / (N * n) };
        });
        v.legend([['blue', 'exact multiplicity'], ['orange', 'Gaussian, $\\sigma=\\sqrt{N\\bar n(1+\\bar n)/2}$', { dash: true }], ['gold', 'current $N$']]);
        v.readout(() => {
          if (!st) return '';
          const { N, n, q, sig, exact, exs, z, tail, rel } = st;
          const lnf = N > 1 ? 0.5 * Math.log(2 * Math.PI * N) / (N * Math.log(N) - N) : NaN;
          return `$N=${N >= 1e6 ? '10^{' + v.fix(Math.log10(N), 1) + '}' : N}$ per solid, $q=${N >= 1e6 ? v.sci(q, 2) : Math.round(q)}$: $\\sigma=${v.sci(sig, 3)}$ quanta${exs ? ` (exact sum: ${v.sci(exs.sig, 3)})` : ''} · relative width $\\sigma/q_A=${v.sci(rel, 3)}$ ($=1/\\sqrt N$ times ${v.fix(Math.sqrt((1 + n) / (2 * n)), 2)}) · ${exact ? 'curve exact' : 'Gaussian only'}\nprobability that A's energy is off by more than 1 % of $q/2$: ${z < 40 ? sup10(tail) : '10^(−' + v.sci(-tail, 2).replace(/\\times10\^\{(\d+)\}/, '×10^$1') + ')'} (${v.fix(z, 1)} $\\sigma$) · crude Stirling $N\\ln N-N$ for $\\ln N!$ is off by a fraction ${N > 1 ? v.sci(lnf, 2) : '—'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.5
    {
      num: '5.5', kind: 'Postulate', name: 'Equal a priori probabilities',
      statement: String.raw`For an isolated system in equilibrium with energy in $[E,E+\delta E]$, every accessible microstate is equally probable; equivalently, in classical phase space the equilibrium probability density is uniform on the energy shell with respect to the Liouville measure. For the postulate to hold in this time-average sense (the ergodic hypothesis), a typical trajectory must visit regions of the shell for a fraction of time proportional to their phase-space volume; the postulate is a statement about equilibrium, and for systems that are not ergodic (many integrable ones) it fails.`,
      idea: String.raw`Liouville's theorem (mech-12.13) says that Hamiltonian flow preserves phase-space volume, so a uniform density on the shell is stationary: the postulate is consistent with the dynamics. That it is the *only* natural stationary choice requires the trajectory to explore the whole shell, which is what ergodicity (mech-13.11) asserts: time averages along one orbit equal averages over the shell. Chaotic systems such as the stadium billiard are ergodic (proved by Bunimovich); integrable ones keep conserved quantities that confine an orbit to a sub-region, and the postulate then fails for the single-orbit average.`,
      caption: String.raw`A single particle bounces in a billiard at constant speed, so its phase space is position plus direction. **Choose the table.** The heat map shows how long the orbit has spent in each cell, relative to the cell's area; the right-hand panel shows the distribution of its direction of motion. For the *stadium* both become uniform; for the *circle* a hole around the centre is never visited (angular momentum is conserved); for the *rectangle* only four directions ever occur. The readouts give the total-variation distance from the uniform (equal-probability) distributions.`,
      deps: ['thermo-5.1', 'mech-12.13', 'mech-13.11'], refs: ['Tong ch. 1', 'Kardar §4.2'], tags: ['ergodicity', 'postulate'],
      credit: 'ergodic hypothesis: L. Boltzmann, 1870s; ergodicity of the stadium: L. A. Bunimovich, 1979 (Commun. Math. Phys. 65, 295)',
      scope: String.raw`A one-particle illustration with constant speed; the postulate in statistical mechanics refers to the energy shell of a many-particle isolated system and is justified (where it is) by chaos, not proved in general.`,
      viz(v) {
        const mode = v.select('table', [{ value: 'stadium', label: 'stadium (chaotic)' }, { value: 'circle', label: 'circle (integrable)' }, { value: 'rect', label: 'rectangle (integrable)' }], 'stadium', { onChange: () => { S.reset(); } });
        const aS = v.slider('straight length $2a$ of the stadium', 0.3, 2.4, 1.6, { step: 0.05, fmt: (x) => v.fix(x, 2), onChange: () => { S.reset(); } });
        const rate = v.slider('path length per second', 100, 3000, 900, { log: true, sig: 2 });
        const NX = 22, NY = 11, CS = 0.2;
        const geom = () => {
          const a = aS.value / 2, m = mode.value;
          if (m === 'circle') return { inside: (x, y) => x * x + y * y < 1, hit: (px, py, dx, dy) => { const b = px * dx + py * dy, c = px * px + py * py - 1, disc = b * b - c; const t = -b + Math.sqrt(Math.max(0, disc)); return { t, nx: -(px + t * dx), ny: -(py + t * dy) }; }, x0: -1, x1: 1 };
          if (m === 'rect') { const W = a + 1; return { inside: (x, y) => Math.abs(x) < W && Math.abs(y) < 1, hit: (px, py, dx, dy) => { let t = Infinity, nx = 0, ny = 0; if (dx > 0) { const tt = (W - px) / dx; if (tt < t) { t = tt; nx = -1; ny = 0; } } else if (dx < 0) { const tt = (-W - px) / dx; if (tt < t) { t = tt; nx = 1; ny = 0; } } if (dy > 0) { const tt = (1 - py) / dy; if (tt < t) { t = tt; nx = 0; ny = -1; } } else if (dy < 0) { const tt = (-1 - py) / dy; if (tt < t) { t = tt; nx = 0; ny = 1; } } return { t, nx, ny }; }, x0: -W, x1: W }; }
          return {
            inside: (x, y) => (Math.abs(x) <= a ? Math.abs(y) < 1 : (Math.hypot(Math.abs(x) - a, y) < 1)),
            hit(px, py, dx, dy) {
              let t = Infinity, nx = 0, ny = 0;
              if (dy > 1e-12) { const tt = (1 - py) / dy; if (tt > 1e-10 && Math.abs(px + tt * dx) <= a && tt < t) { t = tt; nx = 0; ny = -1; } }
              if (dy < -1e-12) { const tt = (-1 - py) / dy; if (tt > 1e-10 && Math.abs(px + tt * dx) <= a && tt < t) { t = tt; nx = 0; ny = 1; } }
              for (const cx of [a, -a]) {
                const ox = px - cx, b = ox * dx + py * dy, c = ox * ox + py * py - 1, disc = b * b - c;
                if (disc >= 0) { const tt = -b + Math.sqrt(disc), hx = px + tt * dx; if (tt > 1e-10 && tt < t && (cx > 0 ? hx >= a : hx <= -a)) { t = tt; nx = -(hx - cx); ny = -(py + tt * dy); } }
              }
              return { t, nx, ny };
            },
            x0: -a - 1, x1: a + 1,
          };
        };
        let G = geom(), areaFr = null, key = '';
        const cellArea = () => {
          const A = new Float64Array(NX * NY); let tot = 0;
          for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) { let c = 0; for (let u = 0; u < 5; u++) for (let w = 0; w < 5; w++) if (G.inside(-2.2 + (i + (u + 0.5) / 5) * CS, -1.1 + (j + (w + 0.5) / 5) * CS)) c++; A[i + NX * j] = c / 25; tot += c / 25; }
          for (let k = 0; k < A.length; k++) A[k] /= tot; return A;
        };
        const NB = 36;
        const S = v.sim(() => {
          G = geom(); areaFr = cellArea();
          const th = 0.41, ang = mode.value === 'stadium' ? th : th;
          return { x: -0.55, y: 0.3, dx: Math.cos(ang), dy: Math.sin(ang), occ: new Float64Array(NX * NY), dir: new Float64Array(NB), n: 0, trail: [], bounces: 0, L: 0 };
        }, (st) => {
          let left = rate.value / 60;
          while (left > 0) {
            const h = G.hit(st.x, st.y, st.dx, st.dy), run = Math.min(h.t, left), sp = 0.05;
            const steps = Math.max(1, Math.ceil(run / sp));
            for (let k = 1; k <= steps; k++) {
              const u = run * k / steps, x = st.x + u * st.dx, y = st.y + u * st.dy;
              const i = Math.floor((x + 2.2) / CS), j = Math.floor((y + 1.1) / CS);
              if (i >= 0 && i < NX && j >= 0 && j < NY) st.occ[i + NX * j]++;
              let a = Math.atan2(st.dy, st.dx); if (a < 0) a += 2 * Math.PI; st.dir[Math.min(NB - 1, Math.floor(a / (2 * Math.PI) * NB))]++;
              st.n++;
            }
            st.x += run * st.dx; st.y += run * st.dy; left -= run;
            if (run >= h.t - 1e-12) {
              const nl = Math.hypot(h.nx, h.ny), nx = h.nx / nl, ny = h.ny / nl, dn = st.dx * nx + st.dy * ny;
              st.dx -= 2 * dn * nx; st.dy -= 2 * dn * ny; const dl = Math.hypot(st.dx, st.dy); st.dx /= dl; st.dy /= dl; st.bounces++;
              st.trail.push([st.x, st.y]); if (st.trail.length > 40) st.trail.shift();
            }
          }
          return st;
        }, { dt: 1 / 60 });
        const sa = v.stage({ x: [-2.3, 2.3], y: [-1.2, 1.2], equal: true, axes: false, height: 290, weight: 1.5, title: 'time spent in each cell, relative to its area' });
        const sb = v.stage({ x: [0, 360], y: [0, 3], axes: 'box', gutter: true, height: 290, weight: 1, minWidth: 240, xlabel: 'direction of motion (degrees)', ylabel: 'relative frequency', xticks: [0, 90, 180, 270, 360], title: 'direction of motion' });
        let info = null;
        v.animate((t) => {
          S.advance(t);
          const st = S.state, tot = st.occ.reduce((a, b) => a + b, 0) || 1;
          const rel = new Float64Array(NX * NY); let tv = 0, vis = 0, cells = 0;
          for (let k = 0; k < rel.length; k++) { const f = st.occ[k] / tot; tv += Math.abs(f - areaFr[k]); rel[k] = areaFr[k] > 0 ? f / areaFr[k] : 0; if (areaFr[k] > 0.3 / (NX * NY) * 0.5) { cells++; if (st.occ[k] > 0) vis++; } }
          tv /= 2;
          sa.raster((x, y) => {
            const i = Math.floor((x + 2.2) / CS), j = Math.floor((y + 1.1) / CS);
            if (i < 0 || i >= NX || j < 0 || j >= NY || !G.inside(x, y)) return null;
            const c = v.ramp(clamp(rel[i + NX * j] / 2.4, 0, 1), 'accent'); return [c[0], c[1], c[2], 255];
          }, { res: 3, key: 'occ' + mode.value + aS.value + st.n + v.color('panel') });
          // boundary
          if (mode.value === 'circle') sa.curve((u) => [Math.cos(u), Math.sin(u)], 0, 2 * Math.PI, { color: 'ink', width: 2.2, n: 120 });
          else if (mode.value === 'rect') { const W = aS.value / 2 + 1; sa.rect(-W, -1, W, 1, { color: 'ink', width: 2.2 }); }
          else { const a = aS.value / 2; sa.path([[-a, 1], [a, 1]], { color: 'ink', width: 2.2 }); sa.path([[-a, -1], [a, -1]], { color: 'ink', width: 2.2 }); sa.curve((u) => [a + Math.cos(u), Math.sin(u)], -Math.PI / 2, Math.PI / 2, { color: 'ink', width: 2.2, n: 60 }); sa.curve((u) => [-a + Math.cos(u), Math.sin(u)], Math.PI / 2, 3 * Math.PI / 2, { color: 'ink', width: 2.2, n: 60 }); }
          if (st.trail.length) sa.path([...st.trail, [st.x, st.y]], { color: 'gold', width: 1.2, alpha: 0.7 });
          sa.dot(st.x, st.y, { r: 5, color: 'gold' });
          const dt2 = st.dir.reduce((a, b) => a + b, 0) || 1;
          sb.hline(1, { color: 'green', width: 1.5, dash: true });
          sb.bars(Array.from(st.dir, (c) => Math.min(2.95, c / dt2 * NB)), { x0: 5, dx: 10, color: 'accent' });
          let tvd = 0; for (let k = 0; k < NB; k++) tvd += Math.abs(st.dir[k] / dt2 - 1 / NB); tvd /= 2;
          const Lz = st.x * st.dy - st.y * st.dx;
          info = { n: st.n, tv, tvd, vis, cells, Lz, b: st.bounces };
        }, { still: 9, period: 30 });
        v.legend([['accent', 'time in cell / area (dark = more)'], ['green', 'uniform', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { n, tv, tvd, vis, cells, Lz, b } = info;
          return `after ${b} bounces (${v.fix(n * 0.05, 0)} path lengths): positions deviate from equal-probability by **${v.fix(100 * tv, 1)} %** (total variation), directions by **${v.fix(100 * tvd, 1)} %** · cells visited: ${vis} of ${cells}\nangular momentum about the centre $x\\,\\dot y-y\\,\\dot x=${v.fix(Lz, 3)}$ ${mode.value === 'circle' ? '(conserved for the circle: the orbit never enters the disc of radius $|L|$)' : '(not conserved here)'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.6
    {
      num: '5.6', kind: 'Definition', name: 'Boltzmann entropy',
      statement: String.raw`The (Boltzmann) entropy of an isolated system in the macrostate with multiplicity $\Omega$ is $S=k\ln\Omega$, where $k=1.380649\times10^{-23}\,\mathrm{J/K}$ is Boltzmann's constant. Because the multiplicity of two independent systems is the product $\Omega_{AB}=\Omega_A\Omega_B$, the logarithm makes the entropy **additive**, $S_{AB}=S_A+S_B$, and extensive; it also compresses astronomically large counts into numbers of the size of $N$. Given the postulate 5.5, $S$ is the logarithm of the probability weight of a macrostate (up to an additive constant), and its maximisation over unconstrained macrostates is the statistical form of the second law.`,
      idea: String.raw`Entropy must be additive for independent systems and must increase with the number of accessible states; the only continuous function turning a product into a sum is a logarithm, with the constant $k$ fixing the unit (kelvin per joule). Counting is done at the level of the macrostate, so $S$ is a function of $(U,V,N)$ exactly as the thermodynamic entropy of 2.9 was, and the two coincide when $k$ is Boltzmann's constant (checked quantitatively for the ideal gas in 5.11). The formula is attributed to Boltzmann's work of the 1870s and was put into its present form by Planck.`,
      caption: String.raw`**Set the size and energy of two Einstein solids** with the sliders. The left panel stacks the entropies $S_A/k=\ln\Omega_A$ and $S_B/k=\ln\Omega_B$ into the entropy of the combined system, whose multiplicity is the product — the stack and the bar for the product agree. The right panel scales one solid with $q=N$ up to a mole: its entropy in J/K grows linearly in $N$, while its multiplicity has about $10^{23}$ digits.`,
      deps: ['thermo-5.5'], refs: ['Schroeder §2.6'], tags: ['entropy', 'Boltzmann'],
      credit: 'L. Boltzmann, 1870s (entropy–probability relation); M. Planck, c. 1900 (the form $S=k\\ln W$ and the constant $k$)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Boltzmann%27s_entropy_formula' },
      viz(v) {
        const NA = v.slider('$N_A$', 2, 300, 40, { int: true });
        const qA = v.slider('$q_A$', 0, 600, 60, { int: true });
        const NB = v.slider('$N_B$', 2, 300, 100, { int: true });
        const qB = v.slider('$q_B$', 0, 600, 90, { int: true });
        const lg = v.slider('scale: $\\log_{10}N$ of one solid with $q=N$', 1, 24.5, 6, { step: 0.1, fmt: (x) => v.fix(x, 1) });
        const sa = v.stage({ x: [0.4, 3.6], y: [0, 100], axes: 'box', gutter: true, height: 290, weight: 1.1, ylabel: '$S/k=\\ln\\Omega$', xticks: [[1, 'A'], [2, 'B'], [3, 'A and B']], title: 'entropies add' });
        const sb = v.stage({ x: [1, 1e25], y: [1e-23, 1e3], xlog: true, ylog: true, axes: 'box', gutter: true, height: 290, weight: 1, minWidth: 250, xlabel: 'oscillators $N$', ylabel: '$S$ (J/K)', title: 'from counting to joules per kelvin' });
        let st = null;
        v.render(() => {
          const a = lnEin(NA.value, qA.value), b = lnEin(NB.value, qB.value), tot = a + b, top = Math.max(tot * 1.18, 8);
          sa.setView([0.4, 3.6], [0, top]);
          sa.rect(0.65, 0, 1.35, a, { fill: 'blue', fillAlpha: 0.6, color: 'blue', width: 1.2 });
          sa.rect(1.65, 0, 2.35, b, { fill: 'orange', fillAlpha: 0.6, color: 'orange', width: 1.2 });
          sa.rect(2.65, 0, 3.35, a, { fill: 'blue', fillAlpha: 0.6, color: 'blue', width: 1.2 });
          sa.rect(2.65, a, 3.35, tot, { fill: 'orange', fillAlpha: 0.6, color: 'orange', width: 1.2 });
          sa.text(`${v.fix(a, 1)}`, 1, a, { dy: -9, size: 11.5, align: 'center', color: 'blue' });
          sa.text(`${v.fix(b, 1)}`, 2, b, { dy: -9, size: 11.5, align: 'center', color: 'orange' });
          sa.text(`${v.fix(a, 1)} + ${v.fix(b, 1)} = ${v.fix(tot, 1)}`, 3, tot, { dy: -9, size: 11.5, align: 'center', color: 'ink', weight: 650 });
          const N = Math.round(10 ** lg.value);
          const lnO = N < 1e9 ? lnEin(N, N) : 2 * N * Math.LN2 - 0.5 * Math.log(Math.PI * N);
          sb.fn((x) => KB * 2 * x * Math.LN2, { color: 'accent', width: 2.4 });
          sb.vline(6.02214076e23, { color: 'faint', width: 1.2, dash: true });
          sb.text('one mole', 6.02214076e23, 1e-22 * 3, { size: 11, color: 'muted', align: 'right', dx: -6 });
          sb.dot(N, KB * lnO, { r: 6, color: 'gold' });
          st = { a, b, tot, N, lnO, S: KB * lnO };
        });
        v.legend([['blue', 'solid A'], ['orange', 'solid B']]);
        v.readout(() => {
          if (!st) return '';
          const { a, b, tot, N, lnO, S } = st;
          return `$\\Omega_A=${texExp(a)}$, $\\Omega_B=${texExp(b)}$, product $\\Omega_A\\Omega_B=${texExp(tot)}$ · $S_A/k+S_B/k=${v.fix(a, 2)}+${v.fix(b, 2)}=${v.fix(tot, 2)}=\\ln(\\Omega_A\\Omega_B)$ · the sum $\\Omega_A+\\Omega_B$ would be ${texExp(Math.max(a, b) + Math.log1p(Math.exp(-Math.abs(a - b))))}, not additive in $S$\n$N=${N >= 1e6 ? v.sci(N, 2) : N}$ with $q=N$: $\\ln\\Omega=${v.sci(lnO, 3)}$, so $\\Omega$ has about ${v.sci(lnO / Math.LN10, 2)}$ digits · $S=k\\ln\\Omega=${v.sci(S, 3)}$ J/K${N > 1e22 && N < 1e25 ? ` (one mole of oscillators, $q=N$: $S=2Nk\\ln2$ = ${v.fix(2 * R * Math.LN2, 2)} J/K per mole)` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.7
    {
      num: '5.7', kind: 'Theorem', name: 'The second law as overwhelming probability',
      statement: String.raw`If all microstates of an isolated system are equally likely (5.5), then a system started in a low-multiplicity macrostate will, over time, be found in macrostates in proportion to their multiplicities. Since multiplicities are sharply peaked (5.4), for a macroscopic system the entropy $S=k\ln\Omega$ almost always increases to within a negligible fraction of its maximum and then stays there; fluctuations to lower entropy do occur but their probability is $\approx e^{-\Delta S/k}$ and is utterly negligible once $\Delta S\gg k$. The second law is thus a statement about probabilities, exact in the limit of many particles, not an absolute law of the dynamics.`,
      idea: String.raw`Two Einstein solids that can exchange quanta by random hops (the walk of 5.3) are an exactly solvable model of an isolated system relaxing. The chance of the macrostate $q_A$ is $\Omega_A(q_A)\Omega_B(q-q_A)/\Omega_{\text{tot}}$; the initial all-in-A macrostate has multiplicity $\Omega_A(q)\cdot1$, a vanishing fraction of the total, whereas the neighbourhood of the equilibrium split carries essentially all of it (5.4, with the entropy of 5.6 as the logarithm of the weight). Hence the drift to the peak and the astronomically small chance $p\approx\Omega(\text{initial})/\Omega_{\text{tot}}$ of ever returning.`,
      caption: String.raw`**Press play.** Quanta hop at random between the oscillators of two solids that start with all the energy in A (or choose a start at equilibrium). Top: the energy fraction in A, with its equilibrium band. Middle: the total entropy $S/k=\ln\Omega_A+\ln\Omega_B$ rising to its maximum and then jittering just below it. **Raise $N$** and the jitter shrinks; the right panel gives the probability that the initial state is found at a random instant, $10^{-\text{(hundreds)}}$ already for 400 oscillators.`,
      deps: ['thermo-5.6', 'thermo-5.4'], refs: ['Schroeder §2.3'], tags: ['second law', 'probability'],
      scope: String.raw`Valid for isolated systems whose microstates are equally likely; a model in which "time" is the number of random hops, not a physical dynamics.`,
      viz(v) {
        const Ns = v.slider('oscillators $N$ in each solid', 4, 120, 30, { int: true, onChange: () => S.reset() });
        const start = v.select('start', [{ value: 'a', label: 'all energy in A' }, { value: 'eq', label: 'equal split' }], 'a', { onChange: () => S.reset() });
        const rate = v.slider('hops per second', 100, 20000, 2500, { log: true, sig: 2 });
        const qOf = () => 2 * Ns.value;     // two quanta per oscillator on average
        const S = v.sim(() => {
          const N = Ns.value, q = qOf(), e = new Array(2 * N).fill(0), r = v.rng(13);
          if (start.value === 'a') for (let i = 0; i < q; i++) e[i % N]++; else for (let i = 0; i < q; i++) e[i % (2 * N)]++;
          let qa = 0; for (let i = 0; i < N; i++) qa += e[i];
          return { e, r, qa, moves: 0, ser: [[0, qa, lnEin(N, qa) + lnEin(N, q - qa)]], N, q };
        }, (st) => {
          const { e, r, N } = st, nm = Math.max(1, Math.round(rate.value / 30));
          for (let h = 0; h < nm; h++) {
            const i = Math.floor(r() * 2 * N), j = Math.floor(r() * 2 * N);
            if (i !== j && e[i] > 0) { e[i]--; e[j]++; if (i < N && j >= N) st.qa--; else if (i >= N && j < N) st.qa++; }
          }
          st.moves += nm; st.ser.push([st.moves, st.qa, lnEin(N, st.qa) + lnEin(N, st.q - st.qa)]);
          if (st.ser.length > 4000) st.ser = st.ser.filter((_, k) => k % 2 === 0 || k === st.ser.length - 1);
          return st;
        }, { dt: 1 / 30, maxSteps: 3000 });
        const sa = v.stage({ x: [0, 1000], y: [0, 1], axes: 'box', gutter: true, height: 210, weight: 1.4, xlabel: 'hops', ylabel: '$q_A/q$', title: 'energy of solid A' });
        const sb = v.stage({ x: [0, 1000], y: [0, 1], axes: 'box', gutter: true, height: 210, weight: 1.4, xlabel: 'hops', ylabel: '$S/k$', title: 'total entropy' });
        const sc = v.stage({ x: [0, 125], y: [-50, 1], axes: 'box', gutter: true, height: 210, weight: 0.9, minWidth: 230, xlabel: 'oscillators $N$ per solid', ylabel: '$\\log_{10}p$', title: 'chance the initial state is found' });
        let info = null;
        v.animate((t) => {
          S.advance(t);
          const st = S.state, { N, q, ser } = st, mx = Math.max(400, st.moves), eqS = 2 * lnEin(N, q / 2);
          const sig = Math.sqrt(N);   // σ of q_A at 1 quantum per oscillator: sqrt(N n̄(1+n̄)/2)
          sa.setView([0, mx], [0, 1]); sb.setView([0, mx], [Math.max(0, Math.min(...ser.map((p) => p[2])) - 2), eqS * 1.03]);
          sa.hband(0.5 - sig / q, 0.5 + sig / q, { color: 'green', alpha: 0.18 });
          sa.hline(0.5, { color: 'green', width: 1.2, dash: true });
          sa.path(ser.map((p) => [p[0], p[1] / q]), { color: 'accent', width: 1.6 });
          sb.hline(eqS, { color: 'green', width: 1.4, dash: true });
          sb.path(ser.map((p) => [p[0], p[2]]), { color: 'accent', width: 1.6 });
          sc.path(Array.from({ length: 130 }, (_, i) => { const n = i + 1; return [n, (lnEin(n, 2 * n) - lnEin(2 * n, 2 * n)) / Math.LN10]; }), { color: 'red', width: 2.2 });
          sc.dot(N, (lnEin(N, 2 * N) - lnEin(2 * N, 2 * N)) / Math.LN10, { r: 6, color: 'gold' });
          const cur = ser[ser.length - 1], lo = Math.min(...ser.slice(Math.floor(ser.length * 0.6)).map((p) => p[2]));
          info = { N, q, moves: st.moves, S: cur[2], eqS, qa: st.qa, S0: ser[0][2], lo, p: (lnEin(N, q) - lnEin(2 * N, q)) / Math.LN10 };
        }, { still: 8, period: 40 });
        v.legend([['accent', 'simulation'], ['green', 'equilibrium (maximum / most probable)', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { N, q, moves, S, eqS, qa, S0, p } = info;
          return `after ${moves} hops: $q_A=${qa}$ of $q=${q}$, $S/k=${v.fix(S, 1)}$ (start ${v.fix(S0, 1)}, maximum ${v.fix(eqS, 1)}; $\\Delta S/k=${v.fix(S - S0, 1)}$ gained)\nthe initial macrostate (all $q$ quanta in A) has multiplicity $\\Omega_A(q)=${texExp(lnEin(N, q))}$ out of $\\Omega_{\\text{tot}}=${texExp(lnEin(2 * N, q))}$: probability **$10^{${v.fix(p, 1)}}$** per instant (for $N=${N}$)`;
        });
      },
    },
