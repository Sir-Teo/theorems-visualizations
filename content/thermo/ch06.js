// Thermodynamics & Statistical Mechanics — Chapter 6: The Boltzmann distribution
import { clamp, lerp, lnBin, lnEin, shannon, texExp, canon, geomDraw, cEin, gauss, brillouin, langevin, tRamp, pick } from './ch06.shared.js';

// ---------- helpers for this file ----------
const fix = (x, d = 3) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(d);
/** Bisection for a monotone function. */
const bis = (f, a, b, n = 80) => { let fa = f(a); for (let i = 0; i < n; i++) { const m = (a + b) / 2, fm = f(m); if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; };

export default {
  collection: 'thermo',
  chapter: 6,
  title: 'The Boltzmann distribution',
  summary: String.raw`A system in contact with a heat bath occupies a state of energy $E$ with probability proportional to $e^{-E/kT}$, normalized by the partition function $Z$, from which average energy, fluctuations, free energy and entropy all follow. The same distribution maximizes entropy at fixed mean energy. Two-level systems, paramagnets, Einstein solids and molecules show quantized degrees of freedom freezing out; classically, equipartition gives $\tfrac12kT$ per quadratic term, the Maxwell speed distribution and the Dulong–Petit law, and forbids classical magnetism altogether.`,
  items: [
    // ------------------------------------------------------------------ 6.1
    {
      num: '6.1', kind: 'Theorem', name: 'Boltzmann distribution',
      statement: String.raw`Let a small system $s$ be in thermal contact with a much larger reservoir $R$, the combination being isolated with total energy $E_{\rm tot}$ and all its microstates equally likely. Then the probability that $s$ is found in a particular microstate of energy $E$ is
$$P(E)=\frac{e^{-E/kT}}{Z},\qquad Z=\sum_{\text{microstates}}e^{-E/kT},$$
where $T$ is the temperature of the reservoir, $1/T=\partial S_R/\partial U_R$. Corrections are of relative order $E/U_R$ and vanish as the reservoir grows.`,
      idea: String.raw`With the system in a definite microstate, the number of microstates of the whole is just the number of the reservoir's, $\Omega_R(E_{\rm tot}-E)$, so by equal a priori probability $P(E)\propto\Omega_R(E_{\rm tot}-E)=e^{S_R(E_{\rm tot}-E)/k}$. Because $E\ll U_R$, expand $S_R(E_{\rm tot}-E)\approx S_R(E_{\rm tot})-E\,\partial S_R/\partial U$; the slope is $1/T$ (statistical temperature, 5.8), leaving $e^{-E/kT}$. The sum of all probabilities fixes the constant, $Z$.`,
      caption: String.raw`The small system is a **single oscillator** with energy $n\varepsilon$; the reservoir is an Einstein solid (5.3) of $N_R$ oscillators sharing the rest of $q$ quanta. The chain below visits the combined microstates with equal probability (it accepts a move $n\to n\pm1$ with probability $\min(1,\Omega_R'/\Omega_R)$). **Grow the reservoir** and the exact finite-reservoir probabilities (orange) and the sampled histogram (bars) converge onto the pure exponential (green); on the log panel it becomes a straight line.`,
      deps: ['thermo-5.8', 'thermo-5.5'], refs: ['Schroeder §6.1'], tags: ['boltzmann factor', 'canonical ensemble'],
      credit: 'Boltzmann, 1868; Gibbs, 1902', verify: true,
      scope: String.raw`The reservoir must be large enough that its temperature does not change appreciably when it exchanges the energy $E$ with the system; the system itself may be of any size.`,
      viz(v) {
        const NR = v.slider('reservoir oscillators $N_R$', 3, 400, 40, { int: true, log: true, onChange: () => reset() });
        const qpo = v.slider('reservoir energy per oscillator $q/N_R$', 0.3, 4, 1.5, { step: 0.05, onChange: () => reset() });
        const rng = v.rng(11);
        let counts = [], total = 0, n = 0, tab = [], q = 0;
        const sweep = (steps) => {
          for (let i = 0; i < steps; i++) {
            const m = n + (rng() < 0.5 ? 1 : -1);
            if (m < 0 || m > q) { counts[n] = (counts[n] || 0) + 1; total++; continue; }
            if (Math.log(rng() + 1e-300) < tab[q - m] - tab[q - n]) n = m;
            counts[n] = (counts[n] || 0) + 1; total++;
          }
        };
        function reset() {
          q = Math.round(qpo.value * NR.value);
          tab = Array.from({ length: q + 1 }, (_, k) => lnEin(NR.value, k));
          counts = []; total = 0; n = 0; sweep(30000);
        }
        reset();
        v.button('Sample 30 000 more', () => sweep(30000));
        v.button('Restart', reset);
        const sa = v.stage({ x: [-0.5, 12.5], y: [0, 1], axes: 'box', gutter: true, height: 270, xlabel: 'oscillator energy $n\\varepsilon$ ($n$ quanta)', ylabel: 'probability $P(n)$', title: 'probabilities', weight: 1.1 });
        const sb = v.stage({ x: [-0.5, 12.5], y: [-9, 0.5], axes: 'box', gutter: true, height: 270, xlabel: 'quanta $n$', ylabel: '$\\ln P(n)$', title: 'logarithm: a straight line is a Boltzmann factor', weight: 1 });
        let st = null;
        v.render(() => {
          const N = NR.value, nmax = 12;
          const x = q / (q + N - 1), be = -Math.log(x);
          const ex = Array.from({ length: nmax + 1 }, (_, k) => tab[q - k]), mx = Math.max(...ex);
          const Pr = ex.map((l) => Math.exp(l - mx)), sP = Pr.reduce((a, b) => a + b, 0), pr = Pr.map((p) => p / sP);
          const pb = Array.from({ length: nmax + 1 }, (_, k) => (1 - x) * x ** k);
          const ps = Array.from({ length: nmax + 1 }, (_, k) => (counts[k] || 0) / total);
          sa.setView([-0.5, nmax + 0.5], [0, Math.max(pb[0], ps[0], pr[0]) * 1.15]);
          sa.bars(ps, { x0: 0, dx: 1, color: 'accent' });
          sa.path(pb.map((p, k) => [k, p]), { color: 'green', width: 2.2 });
          sa.dots(pb.map((p, k) => [k, p]), { r: 3.5, color: 'green' });
          sa.dots(pr.map((p, k) => [k, p]), { r: 4.5, color: 'orange', hollow: true });
          sb.path(pb.map((p, k) => [k, Math.log(p)]), { color: 'green', width: 2.2 });
          sb.dots(pr.map((p, k) => [k, Math.log(p)]), { r: 4.5, color: 'orange', hollow: true });
          sb.dots(ps.map((p, k) => (p > 0 ? [k, Math.log(p)] : null)).filter(Boolean), { r: 3, color: 'accent' });
          const tv = 0.5 * pr.reduce((s, p, k) => s + Math.abs(p - pb[k]), 0);
          st = { N, q, kT: 1 / be, mean: ps.reduce((s, p, k) => s + k * p, 0), meanB: x / (1 - x), tv, total };
        });
        v.legend([['accent', 'sampled (equal-probability chain)'], ['orange', 'exact $\\Omega_R(q-n)$ (finite reservoir)', { dot: true }], ['green', 'Boltzmann $(1-x)x^n$, $x=e^{-\\varepsilon/kT}$']]);
        v.readout(() => st && `$N_R=${st.N}$, $q=${st.q}$ quanta: reservoir temperature $kT=${fix(st.kT, 2)}\\,\\varepsilon$ · $\\langle n\\rangle$ sampled **${fix(st.mean, 3)}**, Boltzmann ${fix(st.meanB, 3)} · distance between the exact finite-reservoir law and the exponential (total variation) **${fix(st.tv, 4)}** · ${st.total.toLocaleString('en-US')} steps`);
      },
    },
    // ------------------------------------------------------------------ 6.2
    {
      num: '6.2', kind: 'Definition', name: 'Partition function',
      statement: String.raw`For a system with microstates $s$ of energy $E_s$ in equilibrium with a bath at temperature $T$, $\beta=1/kT$, the **partition function** is
$$Z=\sum_s e^{-\beta E_s}=\sum_i g_i\,e^{-\beta E_i},$$
the second sum running over distinct energy levels of degeneracy $g_i$. It is the normalization of the Boltzmann distribution, $P_s=e^{-\beta E_s}/Z$, and counts roughly how many states are thermally accessible: $Z\to g_0e^{-\beta E_0}$ as $T\to0$ and $Z\to\sum g_i$ as $T\to\infty$.`,
      idea: String.raw`Boltzmann factors are only relative probabilities; $Z$ is what turns them into absolute ones. Its real importance is that thermodynamic quantities are derivatives of $\ln Z$ (next results), so one sum, done once, contains the whole thermodynamics of the system. The energy zero is a convention: shifting every $E_s$ by $c$ multiplies $Z$ by $e^{-\beta c}$ and leaves all probabilities unchanged.`,
      caption: String.raw`**Drag the level handles** up and down (the ground level stays at $0$); choose the degeneracies; move $kT$. Each bar is the Boltzmann weight $g_ie^{-E_i/kT}$ of a level and the stacked column shows $Z$ as their total length. At low $kT$ the ground level takes everything and $Z\to g_0$; at high $kT$ all weights approach $g_i$.`,
      deps: ['thermo-6.1'], refs: ['Schroeder §6.1'], tags: ['partition function', 'canonical ensemble'],
      credit: 'Boltzmann; Gibbs, 1902', verify: true,
      viz(v) {
        const kT = v.slider('$kT$', 0.05, 8, 1, { log: true, sig: 2 });
        const gs = v.select('degeneracies', [{ value: 'a', label: '$1,1,1,1,1,1$' }, { value: 'b', label: '$1,3,5,7,9,11$' }, { value: 'c', label: '$1,2,4,8,16,32$' }], 'a');
        const G = { a: [1, 1, 1, 1, 1, 1], b: [1, 3, 5, 7, 9, 11], c: [1, 2, 4, 8, 16, 32] };
        const E0 = [0, 0.6, 1.3, 2.1, 3.0, 4.1];
        const sa = v.stage({ x: [0, 1], y: [-0.3, 5.2], axes: false, height: 300, weight: 0.8, minWidth: 220, title: 'energy levels (drag)' });
        const hs = E0.slice(1).map((e, i) => sa.handle(0.2, e, { color: 'orange', r: 6, constrain: { x: [0.2, 0.2], y: [0.05, 5] } }));
        const sb = v.stage({ x: [-0.6, 5.6], y: [0, 1], axes: 'box', gutter: true, height: 300, weight: 1.2, xlabel: 'level $i$', ylabel: 'weight $g_ie^{-E_i/kT}$', title: 'Boltzmann weights' });
        const sc = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 300, weight: 0.5, minWidth: 140, ylabel: '$Z$', title: '$Z$ as a total' });
        let st = null;
        v.render(() => {
          const g = G[gs.value], E = [0, ...hs.map((h) => h.y)];
          const T = kT.value, w = E.map((e, i) => g[i] * Math.exp(-e / T)), Z = w.reduce((a, b) => a + b, 0);
          const Zmax = g.reduce((a, b) => a + b, 0);
          E.forEach((e, i) => {
            sa.line(0.28, e, 0.7, e, { color: 'ink', width: 2.2 });
            sa.text('$g=' + g[i] + '$', 0.74, e, { size: 11, color: 'muted', baseline: 'middle' });
          });
          sa.text('$E$', 0.08, 5.0, { size: 12, color: 'muted' });
          sb.setView([-0.6, 5.6], [0, Math.max(1.05, ...w) * 1.15]);
          w.forEach((x, i) => sb.rect(i - 0.38, 0, i + 0.38, x, { fill: 'accent', fillAlpha: 0.6, color: 'accent', width: 1 }));
          w.forEach((x, i) => sb.text(fix(x, 2), i, x, { size: 10, color: 'muted', dy: -8, align: 'center' }));
          sc.setView([0, 1], [0, Zmax * 1.05]);
          let y = 0;
          const cols = ['accent', 'orange', 'green', 'purple', 'teal', 'pink'];
          w.forEach((x, i) => { sc.rect(0.2, y, 0.8, y + x, { fill: cols[i], fillAlpha: 0.65, color: cols[i], width: 1 }); y += x; });
          sc.hline(Zmax, { color: 'faint', dash: true });
          sc.text('$\\sum g_i$', 0.5, Zmax, { size: 10, color: 'muted', dy: -8, align: 'center' });
          st = { Z, p0: w[0] / Z, Zmax, eff: Z };
        });
        v.readout(() => st && `$Z=${fix(st.Z, 3)}$ (limits: $g_0=${G[gs.value][0]}$ cold, $\\sum g_i=${st.Zmax}$ hot) · probability of the ground level **${fix(100 * st.p0, 1)} %**`);
      },
    },
    // ------------------------------------------------------------------ 6.3
    {
      num: '6.3', kind: 'Theorem', name: 'Average energy and heat capacity from ln Z',
      statement: String.raw`In the canonical ensemble the mean energy and heat capacity follow from the partition function by differentiation:
$$U=\langle E\rangle=-\frac{\partial\ln Z}{\partial\beta},\qquad C=\frac{\partial U}{\partial T}=k\beta^2\frac{\partial^2\ln Z}{\partial\beta^2}.$$
The same derivative gives the variance of the energy, $\langle E^2\rangle-\langle E\rangle^2=\partial^2\ln Z/\partial\beta^2$.`,
      idea: String.raw`Differentiating $Z=\sum e^{-\beta E_s}$ brings down a factor $-E_s$ from each term, and dividing by $Z$ is exactly the Boltzmann-weighted average: $-\partial_\beta Z/Z=\langle E\rangle$. A second derivative brings down $E_s^2$, giving $\langle E^2\rangle$, so $\partial_\beta^2\ln Z$ is a variance; and $C=dU/dT=-k\beta^2\,\partial_\beta U$ gives the second form.`,
      caption: String.raw`**Drag the three upper levels** or pick a preset (the first three leave unused levels empty). The solid curves are the direct Boltzmann averages; the gold dots are obtained by numerically differentiating $\ln Z$ at the same temperature, and agree to many digits. Move the temperature handle (slider) to see where $C$ peaks: when $kT$ is comparable to a level spacing.`,
      deps: ['thermo-6.2'], refs: ['Schroeder §6.2'], tags: ['partition function', 'heat capacity'],
      viz(v) {
        const kT = v.slider('$kT$', 0.05, 6, 0.7, { log: true, sig: 2 });
        let g = [1, 1, 1, 1];
        const hs = [1, 2, 3].map((e) => null);
        const ps = v.select('presets', [{ value: 'two', label: 'two-level' }, { value: 'lad', label: 'equally spaced' }, { value: 'deg', label: 'degenerate $1,2,3,4$' }, { value: 'free', label: 'free' }], 'lad', {
          onChange: (val) => {
            const P = { two: [[1, 2, 3], [1, 1, 0, 0]], lad: [[1, 2, 3], [1, 1, 1, 1]], deg: [[1, 2, 3], [1, 2, 3, 4]], free: [[0.7, 1.9, 2.4], [1, 1, 1, 1]] }[val];
            P[0].forEach((e, i) => hs[i].set(0.5, e)); g = P[1];
          },
        });
        const sa = v.stage({ x: [0, 1], y: [-0.2, 4], axes: false, height: 300, weight: 0.7, minWidth: 200, title: 'levels (drag)' });
        for (let i = 0; i < 3; i++) hs[i] = sa.handle(0.5, i + 1, { color: 'orange', r: 6, constrain: { x: [0.5, 0.5], y: [0.05, 3.8] } });
        const sb = v.stage({ x: [0.05, 6], xlog: true, y: [0, 3], axes: 'box', gutter: true, height: 300, xlabel: '$kT$', ylabel: '$U$', title: 'mean energy', weight: 1 });
        const sc = v.stage({ x: [0.05, 6], xlog: true, y: [0, 1], axes: 'box', gutter: true, height: 300, xlabel: '$kT$', ylabel: '$C/k$', title: 'heat capacity', weight: 1 });
        let st = null;
        v.render(() => {
          const L = [{ E: 0, g: g[0] }, ...hs.map((h, i) => ({ E: h.y, g: g[i + 1] }))];
          hs.forEach((h, i) => { h.visible = g[i + 1] > 0; });
          L.forEach((l) => { if (l.g > 0) { sa.line(0.3, l.E, 0.7, l.E, { color: 'ink', width: 2.2 }); sa.text('$g=' + l.g + '$', 0.78, l.E, { size: 11, color: 'muted', baseline: 'middle' }); } });
          const Us = [], Cs = [];
          for (const t of [0.05, 0.1, 0.2, 0.4, 0.8, 1.6, 3.2, 6]) { const c = canon(L, 1 / t); Us.push(c.U); Cs.push(c.C); }
          const fU = (t) => canon(L, 1 / t).U, fC = (t) => canon(L, 1 / t).C;
          const Umax = Math.max(0.5, ...Array.from({ length: 30 }, (_, i) => fU(0.05 * Math.pow(120, i / 29))));
          const Cmax = Math.max(0.2, ...Array.from({ length: 60 }, (_, i) => fC(0.05 * Math.pow(120, i / 59))));
          sb.setView([0.05, 6], [0, Umax * 1.1]); sc.setView([0.05, 6], [0, Cmax * 1.15]);
          sb.fn(fU, { color: 'accent', width: 2.4, n: 160 }); sc.fn(fC, { color: 'accent', width: 2.4, n: 160 });
          const T = kT.value, be = 1 / T, h = 1e-3 * be;
          const lz = (b) => canon(L, b).lnZ;
          const Un = -(lz(be + h) - lz(be - h)) / (2 * h), Cn = be * be * (lz(be + h) + lz(be - h) - 2 * lz(be)) / (h * h);
          const c0 = canon(L, be);
          sb.dot(T, Un, { r: 5.5, color: 'gold' }); sc.dot(T, Cn, { r: 5.5, color: 'gold' });
          sb.vline(T, { color: 'faint', dash: true }); sc.vline(T, { color: 'faint', dash: true });
          st = { U: c0.U, Un, C: c0.C, Cn };
        });
        v.legend([['accent', 'direct Boltzmann average'], ['gold', 'from derivatives of $\\ln Z$', { dot: true }]]);
        v.readout(() => st && `at the chosen $kT$: $U=${fix(st.U, 6)}$ (direct) vs $-\\partial_\\beta\\ln Z=${fix(st.Un, 6)}$ · $C/k=${fix(st.C, 6)}$ vs $\\beta^2\\partial_\\beta^2\\ln Z=${fix(st.Cn, 5)}$`);
      },
    },
    // ------------------------------------------------------------------ 6.4
    {
      num: '6.4', kind: 'Theorem', name: 'Energy fluctuations and heat capacity',
      statement: String.raw`In the canonical ensemble the energy of a system fluctuates, with variance
$$\sigma_E^2=\langle E^2\rangle-\langle E\rangle^2=kT^2C_V.$$
Since $C_V$ and $U$ are extensive, the relative fluctuation $\sigma_E/U$ is of order $1/\sqrt N$: for a macroscopic body the energy is, for all practical purposes, fixed even though the system exchanges heat with a bath.`,
      idea: String.raw`From 6.3, $\sigma_E^2=\partial^2_\beta\ln Z=-\partial U/\partial\beta$, and $-\partial U/\partial\beta=kT^2\,\partial U/\partial T=kT^2C_V$. Heat capacity, an equilibrium response, therefore equals a fluctuation of the very quantity it measures: a fluctuation–response relation, the simplest of its kind. Because $\ln Z$ of $N$ independent parts is a sum of $N$ terms, its derivatives grow like $N$, so $\sigma_E/U\sim N^{-1/2}$.`,
      caption: String.raw`A system of $N$ quantum oscillators in a bath at $kT$ (Einstein solid, canonical). Each dot-cloud histogram is **2000 sampled energies**; the orange curve is a Gaussian with the predicted variance $kT^2C_V$. **Change $N$**: the histogram narrows relative to its mean. The right panel shows the sampled relative width for $N=1\ldots1000$ against the predicted $N^{-1/2}$ line.`,
      deps: ['thermo-6.3'], refs: ['Tong ch. 1', 'Kardar §4.6'], tags: ['fluctuations', 'heat capacity'],
      credit: 'Gibbs, 1902; Einstein, 1904', verify: true,
      viz(v) {
        const Ns = v.slider('oscillators $N$', 1, 500, 30, { int: true, log: true });
        const kT = v.slider('$kT/\\varepsilon$', 0.3, 5, 1.2, { step: 0.05 });
        const rng = v.rng(21);
        const cache = new Map();
        const sample = (N, x, M, key) => {
          if (cache.has(key)) return cache.get(key);
          const out = new Array(M);
          for (let i = 0; i < M; i++) { let s = 0; for (let j = 0; j < N; j++) s += geomDraw(rng(), x); out[i] = s; }
          cache.set(key, out); return out;
        };
        const sa = v.stage({ x: [0, 100], y: [0, 1], axes: 'box', gutter: true, height: 290, xlabel: 'energy $E/\\varepsilon$ above the ground state', ylabel: 'probability density', title: 'sampled energies', weight: 1.2 });
        const sb = v.stage({ x: [1, 1000], xlog: true, y: [0.01, 3], ylog: true, axes: 'box', gutter: true, height: 290, xlabel: 'number of oscillators $N$', ylabel: '$\\sigma_E/U$', title: 'relative fluctuation', weight: 1 });
        let st = null;
        v.render(() => {
          const N = Ns.value, T = kT.value, x = Math.exp(-1 / T);
          const E = sample(N, x, 2000, `${N}|${T}`);
          const U = N * x / (1 - x), varT = N * x / (1 - x) ** 2, sd = Math.sqrt(varT);
          const lo = Math.max(0, Math.floor(U - 4.5 * sd)), hi = Math.ceil(U + 4.5 * sd), w = Math.max(1, Math.round((hi - lo) / 40));
          const nb = Math.ceil((hi - lo) / w), cnt = new Array(nb).fill(0);
          E.forEach((e) => { const k = Math.floor((e - lo) / w); if (k >= 0 && k < nb) cnt[k]++; });
          const dens = cnt.map((c) => c / E.length / w);
          sa.setView([lo, hi], [0, Math.max(...dens, gauss(U, U, sd)) * 1.2]);
          dens.forEach((d, k) => sa.rect(lo + k * w, 0, lo + (k + 1) * w, d, { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 1 }));
          sa.fn((e) => gauss(e, U, sd), { color: 'orange', width: 2.2, n: 200 });
          sa.vline(U, { color: 'green', dash: true });
          const mean = E.reduce((a, b) => a + b, 0) / E.length, vr = E.reduce((a, b) => a + (b - mean) ** 2, 0) / (E.length - 1);
          const th = (n) => 1 / Math.sqrt(n * x);
          sb.fn(th, { color: 'orange', width: 2.2, n: 100 });
          for (const n of [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]) {
            const Es = sample(n, x, 1000, `s${n}|${T}`);
            const m = Es.reduce((a, b) => a + b, 0) / Es.length, vv = Es.reduce((a, b) => a + (b - m) ** 2, 0) / (Es.length - 1);
            sb.dot(n, Math.sqrt(vv) / m, { r: 3.5, color: 'accent' });
          }
          sb.dot(N, Math.sqrt(vr) / mean, { r: 6, color: 'gold' });
          const y = 1 / T, C = N * y * y * Math.exp(y) / (Math.exp(y) - 1) ** 2;
          st = { U, mean, vr, var: T * T * C, N, rel: sd / U };
        });
        v.legend([['accent', 'sampled', { dot: true }], ['orange', 'theory ($kT^2C_V$, $N^{-1/2}$)'], ['gold', 'chosen $N$', { dot: true }]]);
        v.readout(() => st && `$\\langle E\\rangle$ sampled ${fix(st.mean, 2)} (exact ${fix(st.U, 2)}) · variance sampled **${fix(st.vr, 2)}** vs $kT^2C_V=${fix(st.var, 2)}$ · relative width ${fix(100 * st.rel, 2)} %\nfor a mole of such oscillators ($N\\sim6\\times10^{23}$) the relative width would be about $10^{-12}$`);
      },
    },
    // ------------------------------------------------------------------ 6.5
    {
      num: '6.5', kind: 'Theorem', name: 'Free energy from the partition function',
      statement: String.raw`The Helmholtz free energy of a system in equilibrium with a bath is
$$F=-kT\ln Z,$$
and all its thermodynamic derivatives agree with ensemble averages: $S=-\partial F/\partial T$ equals $-k\sum_sP_s\ln P_s$, $\;P=-\partial F/\partial V=-\langle\partial E_s/\partial V\rangle$, $\;\mu=\partial F/\partial N$, and $U=F+TS=\langle E\rangle$.`,
      idea: String.raw`Write $U=-\partial_\beta\ln Z$ (6.3) and compare with the thermodynamic relation $U=\partial(\beta F)/\partial\beta$; both are solved by $\beta F=-\ln Z$ (the constant is fixed by $F\to E_0$ as $T\to0$). The Maxwell-style relations of 3.8 ($dF=-SdT-PdV+\mu\,dN$) then turn derivatives of $\ln Z$ into $S$, $P$, $\mu$. Pressure is the average force: each level's energy depends on the volume, and $-\partial E_s/\partial V$ is the force on the wall in state $s$.`,
      caption: String.raw`The model is a solid of independent oscillators whose frequency rises as the volume shrinks, $\hbar\omega=\hbar\omega_0(V_0/V)^\gamma$ ($\gamma$ is the Grüneisen-like exponent). **Change $kT$, $V$ and $\gamma$.** Left: $F(T)$ with its tangent, whose slope is $-S$. Right: $F(V)$ with its tangent, whose slope is $-P$. The readout compares these derivatives with the direct averages over the levels $(n+\tfrac12)\hbar\omega$ (computed by summing explicitly).`,
      deps: ['thermo-6.2', 'thermo-3.8'], refs: ['Schroeder §6.5'], tags: ['free energy', 'partition function'],
      credit: 'Gibbs, 1902', verify: true,
      viz(v) {
        const kT = v.slider('$kT/\\hbar\\omega_0$', 0.1, 4, 1.0, { step: 0.01 });
        const Vs = v.slider('volume $V/V_0$', 0.5, 2, 1, { step: 0.01 });
        const gm = v.slider('exponent $\\gamma$', 0.3, 3, 1.5, { step: 0.05 });
        const om = (V) => Math.pow(1 / V, gm.value);                // ħω in units of ħω0
        const Fp = (T, V) => T * Math.log(2 * Math.sinh(om(V) / (2 * T)));
        const sa = v.stage({ x: [0.05, 4], y: [-4, 2], axes: 'box', gutter: true, height: 280, xlabel: '$kT/\\hbar\\omega_0$', ylabel: '$F/N\\hbar\\omega_0$', title: '$F(T)$ at fixed $V$' });
        const sb = v.stage({ x: [0.5, 2], y: [0, 2], axes: 'box', gutter: true, height: 280, xlabel: '$V/V_0$', ylabel: '$F/N\\hbar\\omega_0$', title: '$F(V)$ at fixed $T$' });
        let st = null;
        v.render(() => {
          const T = kT.value, V = Vs.value, d = 1e-4;
          sa.setView([0.05, 4], [-4.5, 1.5]);
          sa.fn((t) => Fp(t, V), { color: 'accent', width: 2.4, n: 120 });
          const Sd = -(Fp(T + d, V) - Fp(T - d, V)) / (2 * d), Pd = -(Fp(T, V + d) - Fp(T, V - d)) / (2 * d);
          const F0 = Fp(T, V);
          sa.line(0.05, F0 - Sd * (0.05 - T), 4, F0 - Sd * (4 - T), { color: 'orange', width: 1.5, dash: true, alpha: 0.9 });
          sa.dot(T, F0, { r: 6, color: 'gold' });
          const fv = Array.from({ length: 40 }, (_, i) => Fp(T, 0.5 + 1.5 * i / 39)), mn = Math.min(...fv), mx = Math.max(...fv);
          sb.setView([0.5, 2], [mn - 0.1 * (mx - mn) - 0.05, mx + 0.15 * (mx - mn) + 0.05]);
          sb.fn((x) => Fp(T, x), { color: 'accent', width: 2.4, n: 120 });
          sb.line(0.5, F0 - Pd * (0.5 - V), 2, F0 - Pd * (2 - V), { color: 'orange', width: 1.5, dash: true });
          sb.dot(V, F0, { r: 6, color: 'gold' });
          // direct ensemble averages
          const w = om(V), Ls = Array.from({ length: 2400 }, (_, n) => (n + 0.5) * w);
          const c = canon(Ls.map((E) => ({ E, g: 1 })), 1 / T);
          const Pavg = c.p.reduce((s, p, n) => s + p * gm.value * Ls[n] / V, 0);
          st = { F: F0, S: Sd, Sdir: c.S, P: Pd, Pdir: Pavg, U: c.U, FTS: F0 + T * Sd, mu: F0 };
        });
        v.readout(() => st && `$F=-kT\\ln Z=${fix(st.F, 5)}$ · entropy $-\\partial_TF=${fix(st.S, 5)}$ vs $-\\sum P\\ln P=${fix(st.Sdir, 5)}$ · pressure $-\\partial_VF=${fix(st.P, 5)}$ vs $\\langle-\\partial E/\\partial V\\rangle=${fix(st.Pdir, 5)}$\n$\\langle E\\rangle=${fix(st.U, 5)}$ vs $F+TS=${fix(st.FTS, 5)}$ · chemical potential per oscillator $\\mu=F/N=${fix(st.mu, 4)}$ (units $\\hbar\\omega_0$)`);
      },
    },
    // ------------------------------------------------------------------ 6.6
    {
      num: '6.6', kind: 'Definition', name: 'Gibbs entropy',
      statement: String.raw`For a system whose microstates $s$ have probabilities $P_s$, the **Gibbs entropy** is
$$S=-k\sum_sP_s\ln P_s.$$
For $\Omega$ equally likely states it reduces to Boltzmann's $S=k\ln\Omega$, and for the Boltzmann distribution it equals $(U-F)/T$, the thermodynamic entropy.`,
      idea: String.raw`Boltzmann's $k\ln\Omega$ only makes sense when all accessible states are equally likely. Gibbs's expression is its natural extension: $-\ln P_s$ is the "surprise" of state $s$ and $S/k$ is its average, which is also Shannon's entropy of the distribution (info-1.2). For $P_s=e^{-\beta E_s}/Z$ we get $-\ln P_s=\beta E_s+\ln Z$, so $S=k(\beta U+\ln Z)=(U-F)/T$ with $F=-kT\ln Z$ (6.5).`,
      caption: String.raw`Six states with energies $0,1,\dots,5$. In **drag** mode pull the top of any bar (the others rescale to keep the sum $1$); **uniform** spreads probability over the first $m$ states ($S=k\ln m$); **Boltzmann** uses the chosen $kT$. The right panel shows each state's contribution $-P_s\ln P_s$.`,
      deps: ['thermo-6.5', 'thermo-5.6', 'info-1.2'], refs: ['Tong ch. 1'], tags: ['entropy', 'information'],
      credit: 'Gibbs, 1902', verify: true,
      viz(v) {
        const E = [0, 1, 2, 3, 4, 5];
        let p = [0.4, 0.25, 0.15, 0.1, 0.06, 0.04];
        const mode = v.select('distribution', [{ value: 'drag', label: 'drag' }, { value: 'uni', label: 'uniform' }, { value: 'boltz', label: 'Boltzmann' }], 'drag', { onChange: () => sync() });
        const m = v.slider('equally likely states $m$', 1, 6, 3, { int: true });
        const kT = v.slider('$kT$', 0.2, 10, 1.5, { log: true, sig: 2 });
        const sa = v.stage({ x: [-0.6, 5.6], y: [0, 1.05], axes: 'box', gutter: true, height: 270, xlabel: 'state energy $E_s$', ylabel: '$P_s$', title: 'probabilities', weight: 1.1 });
        const hs = p.map((x, i) => sa.handle(i, x, { color: 'gold', r: 6, constrain: { x: [i, i], y: [0, 1] } }));
        const sb = v.stage({ x: [-0.6, 5.6], y: [0, 0.5], axes: 'box', gutter: true, height: 270, xlabel: 'state energy $E_s$', ylabel: '$-P_s\\ln P_s$', title: 'contributions to $S/k$', weight: 1 });
        let dragging = -1;
        hs.forEach((h, i) => { h.onDrag = () => { if (mode.value !== 'drag') mode.set('drag'); const old = p[i], nw = clamp(h.y, 0, 1); const rest = 1 - old; p = p.map((x, j) => (j === i ? nw : rest > 1e-9 ? x * (1 - nw) / rest : (1 - nw) / 5)); dragging = i; }; });
        function sync() {
          if (mode.value === 'uni') p = E.map((_, i) => (i < m.value ? 1 / m.value : 0));
          if (mode.value === 'boltz') p = canon(E.map((e) => ({ E: e })), 1 / kT.value).p;
        }
        m.el.addEventListener?.('input', () => { if (mode.value === 'uni') sync(); });
        let st = null;
        v.render(() => {
          if (mode.value === 'uni') p = E.map((_, i) => (i < m.value ? 1 / m.value : 0));
          if (mode.value === 'boltz') p = canon(E.map((e) => ({ E: e })), 1 / kT.value).p;
          m.el.hidden = mode.value !== 'uni'; kT.el.hidden = mode.value !== 'boltz';
          hs.forEach((h, i) => { if (dragging !== i || !h.dragging) h.set(i, p[i]); });
          sa.bars(p, { x0: 0, dx: 1, color: 'accent' });
          const c = p.map((x) => (x > 0 ? -x * Math.log(x) : 0)), S = c.reduce((a, b) => a + b, 0);
          sb.bars(c, { x0: 0, dx: 1, color: 'orange' });
          sb.hline(S / 6, { color: 'green', dash: true });
          const U = p.reduce((s, x, i) => s + x * E[i], 0);
          const be = bis((b) => canon(E.map((e) => ({ E: e })), b).U - U, -20, 60);
          const cb = canon(E.map((e) => ({ E: e })), be);
          st = { S, U, Sb: cb.S, tex: mode.value };
          if (mode.value === 'boltz') { const Fz = -Math.log(canon(E.map((e) => ({ E: e })), 1 / kT.value).Z) * kT.value; st.UF = (U - Fz) / kT.value; }
        });
        v.legend([['accent', 'probabilities'], ['orange', '$-P_s\\ln P_s$'], ['green', 'mean contribution $S/6$', { dash: true }]]);
        v.readout(() => st && `$S/k=-\\sum P\\ln P=${fix(st.S, 4)}$ (maximum $\\ln6=${fix(Math.log(6), 4)}$) · $\\langle E\\rangle=${fix(st.U, 3)}$ · ${st.UF !== undefined ? `Boltzmann: $(U-F)/kT=${fix(st.UF, 4)}$ equals $S/k$` : `a Boltzmann law with the same $\\langle E\\rangle$ would have $S/k=${fix(st.Sb, 4)}\\ge S/k$`}`);
      },
    },
    // ------------------------------------------------------------------ 6.7
    {
      num: '6.7', kind: 'Principle', name: 'Maximum entropy principle',
      statement: String.raw`Among all probability distributions $\{P_s\}$ over the states of a system with prescribed mean energy $\sum P_sE_s=\bar E$, the Gibbs entropy $-k\sum P_s\ln P_s$ is largest for the Boltzmann distribution $P_s=e^{-\beta E_s}/Z$, where $\beta$ is chosen so that $\langle E\rangle=\bar E$. Moreover for any other admissible $P$: $S[\text{Boltzmann}]-S[P]=k\,D(P\,\|\,P_{\rm B})\ge0$, with $D=\sum P\ln(P/P_{\rm B})$.`,
      idea: String.raw`Because $\sum P_s\ln P^{\rm B}_s=-\beta\bar E-\ln Z$ depends on $P$ only through the constraint, one finds $S[P]=S_{\rm B}-kD(P\|P_{\rm B})$, and Gibbs' inequality (from Jensen's inequality, rca-3.3: $\ln x\le x-1$) says $D\ge0$ with equality only for $P=P_{\rm B}$. This is the information-theoretic reading of statistical mechanics (Jaynes): the Boltzmann law is the least-biased guess that agrees with the known mean energy (see maximum-entropy distributions in info-6.4).`,
      caption: String.raw`Three states with energies $0,1,2$. Probabilities live in the triangle (colour = entropy, brighter is larger); the fixed mean energy $\bar E$ (slider) cuts it in a **line**. **Drag the gold handle along that line**: the right panel shows the entropy along it, peaking exactly at the Boltzmann point (green), where the exponential family curve (dashed) crosses the line. The gap is $kD(P\|P_{\rm B})$.`,
      deps: ['thermo-6.6', 'rca-3.3', 'info-6.4'], refs: ['Kardar §2.7'], tags: ['entropy', 'maximum entropy', 'information'],
      credit: 'Jaynes, 1957', scope: String.raw`A statement about inference (what to assume given only the mean energy); that equilibrium systems actually realize it needs the dynamical or counting arguments of chapters 5 and 6.1.`,
      viz(v) {
        const Eb = v.slider('mean energy $\\bar E$', 0.1, 1.9, 0.8, { step: 0.01 });
        const h3 = Math.sqrt(3) / 2;
        const xy = (p) => [p[1] + p[2] / 2, p[2] * h3];
        const Sf = (p) => p.reduce((s, x) => (x > 1e-12 ? s - x * Math.log(x) : s), 0);
        const pt = (t, E) => [1 - E + t, E - 2 * t, t];
        const sa = v.stage({ x: [-0.1, 1.1], y: [-0.1, 1], equal: true, axes: false, height: 330, weight: 1.1, title: 'simplex of $(P_0,P_1,P_2)$' });
        const h = sa.handle(0.5, 0.3, { color: 'gold', r: 7, constrain: (x, y) => { const E = Eb.value, tl = Math.max(0, E - 1), tu = E / 2, t = clamp(y / h3, tl, tu); return xy(pt(t, E)); } });
        const sb = v.stage({ x: [0, 1], y: [0, 1.2], axes: 'box', gutter: true, height: 330, weight: 1, xlabel: '$P_2$ along the constraint line', ylabel: '$S/k$', title: 'entropy along $\\langle E\\rangle=\\bar E$' });
        let st = null;
        v.render(() => {
          const E = Eb.value, tl = Math.max(0, E - 1), tu = E / 2;
          sa.raster((x, y) => {
            const p2 = y / h3, p1 = x - p2 / 2, p0 = 1 - p1 - p2;
            if (p0 < 0 || p1 < 0 || p2 < 0) return null;
            return [...v.ramp(Sf([p0, p1, p2]) / Math.log(3), 'accent'), 1];
          }, { res: 3, key: 'tri' });
          sa.poly([[0, 0], [1, 0], [0.5, h3]], { stroke: true, fill: false, color: 'ink', width: 1.6 });
          sa.tex('P_0{=}1', -0.02, -0.04, { size: 12 }); sa.tex('P_1{=}1', 1.02, -0.04, { size: 12 }); sa.tex('P_2{=}1', 0.5, h3 + 0.05, { size: 12 });
          sa.path(Array.from({ length: 81 }, (_, i) => xy(pt(tl + (tu - tl) * i / 80, E))), { color: 'ink', width: 2.2 });
          // exponential family
          const fam = []; for (let i = 0; i <= 160; i++) { const b = -6 + 12 * i / 160, w = [1, Math.exp(-b), Math.exp(-2 * b)], s = w[0] + w[1] + w[2]; fam.push(xy(w.map((x) => x / s))); }
          sa.path(fam, { color: 'green', width: 1.6, dash: true });
          const x = ((2 - E) > 1e-9) ? (-(1 - E) + Math.sqrt((1 - E) ** 2 + 4 * E * (2 - E))) / (2 * (2 - E)) : 1;
          const pB = [1, x, x * x].map((q) => q / (1 + x + x * x));
          sa.dot(...xy(pB), { r: 6, color: 'green' });
          sa.dot(...xy([1 / 3, 1 / 3, 1 / 3]), { r: 3.5, color: 'muted', hollow: true });
          const t = clamp(h.y / h3, tl, tu); h.set(...xy(pt(t, E)));
          const P = pt(t, E);
          sb.setView([tl, tu], [0, 1.2]);
          sb.fn((u) => Sf(pt(u, E)), { color: 'accent', width: 2.4, domain: [tl, tu], n: 200 });
          sb.vline(pB[2], { color: 'green', dash: true }); sb.dot(P[2], Sf(P), { r: 6, color: 'gold' });
          sb.hline(Math.log(3), { color: 'faint', dash: true });
          const D = P.reduce((s, q, i) => (q > 1e-12 ? s + q * Math.log(q / pB[i]) : s), 0);
          st = { S: Sf(P), SB: Sf(pB), D, P, pB };
        });
        v.legend([['gold', 'chosen $P$', { dot: true }], ['green', 'Boltzmann family (dashed) and its point on the line', { dot: true }], ['ink', 'constraint line']]);
        v.readout(() => st && `$P=(${st.P.map((q) => fix(q, 3)).join(',\\,')})$, $S/k=${fix(st.S, 4)}$ · Boltzmann point $(${st.pB.map((q) => fix(q, 3)).join(',\\,')})$ with $S_{\\rm B}/k=${fix(st.SB, 4)}$ · $(S_{\\rm B}-S)/k=${fix(st.SB - st.S, 5)}$ and $D(P\\|P_{\\rm B})=${fix(st.D, 5)}$ (equal)`);
      },
    },
    // ------------------------------------------------------------------ 6.8
    {
      num: '6.8', kind: 'Theorem', name: 'Independent subsystems: partition functions multiply',
      statement: String.raw`If a system consists of two parts that do not interact, so that every composite state $(a,b)$ has energy $E_a+E_b$, then
$$Z_{AB}=Z_AZ_B,\qquad F_{AB}=F_A+F_B,\qquad P(a,b)=P_A(a)P_B(b).$$
Equivalently $\ln Z$, $U$, $S$, $C$ are additive. If the parts interact, $E_{ab}=E_a+E_b+W_{ab}$, the factorization fails.`,
      idea: String.raw`The exponential turns a sum of energies into a product of Boltzmann factors, $e^{-\beta(E_a+E_b)}=e^{-\beta E_a}e^{-\beta E_b}$, and a double sum of a product of factors is a product of sums. The probabilities factor too, so independent parts are statistically independent. Any coupling $W_{ab}$ spoils the factorization by the extra factor $e^{-\beta W_{ab}}$. For $N$ identical independent parts this gives $Z=Z_1^N$ (and $Z_1^N/N!$ for indistinguishable ones, 6.16).`,
      caption: String.raw`System A has four evenly spaced levels, system B has three. The picture is a **tiling**: column widths are A's Boltzmann weights, row heights are B's, so each cell's area is the joint weight and the total area is $Z_AZ_B$. Turn on the **coupling** $J$ (energy $J$ per pair of excitation quanta, $E_{ab}=a\varepsilon_A+b\varepsilon_B+Jab$): the cells that feel it shrink or grow and the area no longer equals $Z_AZ_B$.`,
      deps: ['thermo-6.2'], refs: ['Schroeder §6.6'], tags: ['partition function', 'independence'],
      viz(v) {
        const kT = v.slider('$kT$', 0.2, 5, 1.2, { log: true, sig: 2 });
        const eA = v.slider('$\\varepsilon_A$', 0.2, 2, 1, { step: 0.05 });
        const eB = v.slider('$\\varepsilon_B$', 0.2, 2, 0.7, { step: 0.05 });
        const J = v.slider('coupling $J$', -1, 2, 0, { step: 0.05 });
        const sa = v.stage({ x: [0, 4], y: [0, 3], equal: false, axes: false, height: 320, weight: 1.1, title: 'joint weights as areas' });
        const sb = v.stage({ x: [0.2, 5], xlog: true, y: [0, 8], axes: 'box', gutter: true, height: 320, weight: 1, xlabel: '$kT$', ylabel: '$\\ln Z$', title: '$\\ln Z_{AB}$ against $\\ln Z_A+\\ln Z_B$' });
        let st = null;
        v.render(() => {
          const T = kT.value, b = 1 / T, wA = [0, 1, 2, 3].map((a) => Math.exp(-b * a * eA.value)), wB = [0, 1, 2].map((c) => Math.exp(-b * c * eB.value));
          const ZA = wA.reduce((x, y) => x + y, 0), ZB = wB.reduce((x, y) => x + y, 0);
          sa.setView([-0.06 * ZA, ZA * 1.06], [-0.06 * ZB, ZB * 1.06]);
          let Zab = 0, xA = 0;
          wA.forEach((a, i) => {
            let yB = 0;
            wB.forEach((c, j) => {
              const f = Math.exp(-b * J.value * i * j), s = Math.sqrt(f);
              const w = a, h = c; Zab += a * c * f;
              sa.rect(xA, yB, xA + w, yB + h, { stroke: true, fill: false, color: 'muted', width: 1, dash: true });
              sa.rect(xA, yB, xA + w * s, yB + h * s, { fill: Math.abs(J.value) < 1e-9 ? 'accent' : f < 1 ? 'orange' : 'red', fillAlpha: 0.2 + 0.55 * Math.min(1, a * c / 1.6), color: 'ink', width: 1 });
              yB += h;
            });
            xA += a;
          });
          sa.text('width $e^{-a\\varepsilon_A/kT}$ (system A) →', ZA / 2, -0.03 * ZB, { size: 11, color: 'muted', baseline: 'top', align: 'center' });
          sa.text('height $e^{-b\\varepsilon_B/kT}$ (B) →', -0.03 * ZA, ZB / 2, { size: 11, color: 'muted', align: 'right', baseline: 'middle' });
          sb.fn((t) => Math.log(wsum(t, eA.value, eB.value, J.value)), { color: 'accent', width: 2.4, n: 140 });
          sb.fn((t) => Math.log(wsum(t, eA.value, eB.value, 0)), { color: 'green', width: 2, dash: true, n: 140 });
          sb.setView([0.2, 5], [0, Math.max(1, Math.log(12) * 1.05)]);
          sb.vline(T, { color: 'faint', dash: true });
          sb.dot(T, Math.log(Zab), { r: 5.5, color: 'gold' });
          st = { Zab, prod: ZA * ZB, ZA, ZB, FAB: -T * Math.log(Zab), Fsum: -T * Math.log(ZA * ZB) };
          function wsum(t, ea, eb, j) { let s = 0; for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) s += Math.exp(-(i * ea + k * eb + j * i * k) / t); return s; }
        });
        v.legend([['accent', '$\\ln Z_{AB}$ (with coupling)'], ['green', '$\\ln Z_A+\\ln Z_B$', { dash: true }], ['orange', 'cell shrunk by $e^{-J/kT}$', { area: true }]]);
        v.readout(() => st && `$Z_A=${fix(st.ZA, 3)}$, $Z_B=${fix(st.ZB, 3)}$, $Z_AZ_B=${fix(st.prod, 4)}$ · $Z_{AB}=${fix(st.Zab, 4)}$ · ratio **${fix(st.Zab / st.prod, 4)}** · $F_{AB}-(F_A+F_B)=${fix(st.FAB - st.Fsum, 4)}$`);
      },
    },
    // ------------------------------------------------------------------ 6.9
    {
      num: '6.9', kind: 'Model', name: 'Two-level system and the Schottky anomaly',
      statement: String.raw`A system with two levels $0$ and $\Delta$ (degeneracies $g_0,g_1$) has $Z=g_0+g_1e^{-\Delta/kT}$, upper-level occupation $\bigl[1+(g_0/g_1)e^{\Delta/kT}\bigr]^{-1}$ and heat capacity per particle
$$\frac{C}{k}=\frac{g_0g_1\,(\Delta/kT)^2e^{\Delta/kT}}{\bigl(g_0e^{\Delta/kT}+g_1\bigr)^2}.$$
It vanishes both at low $T$ (exponentially) and at high $T$ (as $T^{-2}$) and has a single maximum, the **Schottky anomaly**: for $g_0=g_1$ it lies at $kT\approx0.42\Delta$ and has height $\approx0.44\,k$.`,
      idea: String.raw`At low $T$ the upper level is frozen out, so energy can hardly be absorbed; at high $T$ the two levels are equally populated and the system is saturated, again unable to absorb more. Only when $kT\sim\Delta$ does warming move population, and the energy absorbed per kelvin peaks. The entropy meanwhile climbs from $k\ln g_0$ to $k\ln(g_0+g_1)$; the area under $C/T$ is that entropy, which is also why the peak area is fixed.`,
      caption: String.raw`**Drag the gold dot along the heat-capacity curve** (or the temperature slider) and watch the populations of the two levels in the middle panel. Change the degeneracy ratio $g_1/g_0$: the peak moves and grows. The right panel shows the entropy, which must rise by $k\ln\frac{g_0+g_1}{g_0}$ and does.`,
      deps: ['thermo-6.3'], refs: ['Tong ch. 1'], tags: ['two-level', 'heat capacity'],
      credit: 'Schottky, 1922', verify: true,
      scope: String.raw`Applies to a bounded spectrum (here two levels): unbounded spectra have no high-temperature drop. Paramagnetic salts, nuclear spins in a field and tunnelling defects in glasses show such peaks (examples only; no data are plotted here).`,
      viz(v) {
        const r = v.slider('degeneracy ratio $g_1/g_0$', 1, 6, 1, { int: true });
        const kT = v.slider('$kT/\\Delta$', 0.05, 5, 0.42, { log: true, sig: 2 });
        const Cf = (t, g) => { const y = 1 / t; return g * y * y * Math.exp(y) / (Math.exp(y) + g) ** 2; };
        const Sf = (t, g) => { const y = 1 / t, p = g / (g + Math.exp(y)); return (p > 0 ? -p * Math.log(p) : 0) - (p < 1 ? (1 - p) * Math.log(1 - p) : 0) + p * Math.log(g); };
        const sa = v.stage({ x: [0.05, 5], xlog: true, y: [0, 0.6], axes: 'box', gutter: true, height: 280, xlabel: '$kT/\\Delta$', ylabel: '$C/k$', title: 'heat capacity', weight: 1.2 });
        const h = sa.handle(0.42, 0.44, { color: 'gold', r: 7, constrain: (x) => { const t = clamp(x, 0.05, 5); return [t, Cf(t, r.value)]; } });
        h.onDrag = () => kT.set(clamp(h.x, 0.05, 5));
        const sb = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 280, weight: 0.6, minWidth: 160, ylabel: 'occupation', title: 'populations', xticks: [[0.275, 'lower'], [0.725, 'upper']] });
        const sc = v.stage({ x: [0.05, 5], xlog: true, y: [0, 2.2], axes: 'box', gutter: true, height: 280, xlabel: '$kT/\\Delta$', ylabel: '$S/k$', title: 'entropy', weight: 1 });
        let st = null;
        v.render(() => {
          const g = r.value, T = kT.value;
          sa.fn((t) => Cf(t, g), { color: 'accent', width: 2.4, n: 200 });
          let tm = 0.05, cm = 0; for (let i = 0; i <= 2000; i++) { const t = 0.05 * Math.pow(100, i / 2000), c = Cf(t, g); if (c > cm) { cm = c; tm = t; } }
          sa.setView([0.05, 5], [0, Math.max(0.2, cm * 1.25)]);
          sa.vline(tm, { color: 'green', dash: true });
          h.set(T, Cf(T, g));
          const p1 = g / (g + Math.exp(1 / T));
          sb.rect(0.1, 0, 0.45, 1 - p1, { fill: 'accent', fillAlpha: 0.65, color: 'accent', width: 1 });
          sb.rect(0.55, 0, 0.9, p1, { fill: 'orange', fillAlpha: 0.65, color: 'orange', width: 1 });
          
          sc.fn((t) => Sf(t, g), { color: 'purple', width: 2.4, n: 200 });
          sc.hline(Math.log(1 + g), { color: 'faint', dash: true }); sc.dot(T, Sf(T, g), { r: 5.5, color: 'gold' }); sc.vline(tm, { color: 'green', dash: true });
          st = { tm, cm, p1, C: Cf(T, g), S: Sf(T, g), g };
        });
        v.readout(() => st && `peak of $C$ at $kT=${fix(st.tm, 4)}\\,\\Delta$ with $C_{\\max}=${fix(st.cm, 4)}\\,k$ (for $g_1/g_0=1$: $0.417\\Delta$, $0.439k$) · now $C/k=${fix(st.C, 4)}$, upper level holds ${fix(100 * st.p1, 1)} % · $S/k\\to\\ln${st.g + 1}=${fix(Math.log(st.g + 1), 3)}$ at high $T$`);
      },
    },
    // ------------------------------------------------------------------ 6.10
    {
      num: '6.10', kind: 'Model', name: 'Paramagnet: Brillouin function and Curie’s law',
      statement: String.raw`$N$ independent atoms with total angular momentum $J$ and moment $g\mu_B\mathbf J$ in a field $B$ have levels $E_m=-g\mu_BBm$, $m=-J,\dots,J$. Their magnetization is
$$M=Ng\mu_BJ\,\mathcal B_J(x),\quad x=\frac{g\mu_BJB}{kT},\quad \mathcal B_J(x)=\frac{2J+1}{2J}\coth\frac{(2J+1)x}{2J}-\frac1{2J}\coth\frac{x}{2J}.$$
For $x\ll1$ this is **Curie's law** $M=\dfrac{N g^2\mu_B^2J(J+1)}{3k}\dfrac BT$; for $x\gg1$ it saturates at $Ng\mu_BJ$; as $J\to\infty$ the Brillouin function becomes the classical Langevin function $\coth x-1/x$.`,
      idea: String.raw`The partition function of one atom is a geometric series in $e^{g\mu_BB/kT}$ over the $2J+1$ levels, $Z_1=\sinh\frac{(2J+1)x}{2J}/\sinh\frac x{2J}$, and $M=NkT\,\partial_B\ln Z_1$ (6.3, 6.5). Expanding at small $x$ gives the linear Curie law, which depends on $B/T$ only; at large $x$ all moments align. The spin-$\frac12$ limit is $\tanh x$ and the large-$J$ limit is the classical orientation average of a freely rotating dipole.`,
      caption: String.raw`Plotted against $x=g\mu_BJB/kT$ (for $g=2$, $x=1.343\,J\,B/T$ with $B$ in tesla and $T$ in kelvin): the full Brillouin curve for the chosen $J$ (blue), the Curie-law tangent (orange dashed), and the classical Langevin limit (grey). **Move $B$ and $T$** (only $B/T$ matters) and choose $J$; the right panel shows how the $2J+1$ Zeeman levels are populated. Curie's law is accurate only while $g\mu_BB\ll kT$.`,
      deps: ['thermo-6.3', 'qm-7.13', 'em-8.3'], refs: ['Schroeder §3.3'], tags: ['paramagnet', 'magnetization'],
      credit: 'Curie, 1895; Langevin, 1905; Brillouin, 1927', verify: true,
      scope: String.raw`Non-interacting moments with spin-only magnetism ($g=2$ assumed here), ignoring crystal-field effects; real salts follow the curve only at low enough concentration and temperature (Henry, Phys. Rev. 88, 559 (1952), compared measured magnetization of Gd³⁺, Fe³⁺ and Cr³⁺ salts at liquid-helium temperatures with Brillouin functions; the curves here are theory, not his data).`,
      viz(v) {
        const Js = v.select('angular momentum $J$', ['1/2', '1', '3/2', '5/2', '7/2', '15/2'], '7/2');
        const Bs = v.slider('field $B$ (tesla)', 0.05, 10, 2, { log: true, sig: 2 });
        const Ts = v.slider('temperature $T$ (K)', 0.3, 30, 2, { log: true, sig: 2 });
        const gmu = 2 * v.M.CONST.muB / v.M.CONST.kB;      // g μB/k in kelvin per tesla (g = 2)
        const Jv = () => ({ '1/2': 0.5, '1': 1, '3/2': 1.5, '5/2': 2.5, '7/2': 3.5, '15/2': 7.5 }[Js.value]);
        const sa = v.stage({ x: [0, 6], y: [0, 1.05], axes: 'box', gutter: true, height: 300, xlabel: '$x=g\\mu_BJB/kT$', ylabel: '$M/M_{\\rm sat}$', title: 'magnetization', weight: 1.3 });
        const h = sa.handle(1, 0.5, { color: 'gold', r: 7, constrain: (x) => { const t = clamp(x, 0.01, 6); return [t, brillouin(Jv(), t)]; } });
        h.onDrag = () => { const x = clamp(h.x, 0.01, 6), bt = x / (gmu * Jv()); Bs.set(clamp(bt * Ts.value, 0.05, 10)); };
        const sb = v.stage({ x: [-0.5, 7.5], y: [0, 1], axes: 'box', gutter: true, height: 300, weight: 0.8, minWidth: 190, ylabel: 'population', title: 'Zeeman levels $m$' });
        let st = null;
        v.render(() => {
          const J = Jv(), bt = Bs.value / Ts.value, x = gmu * J * bt;
          sa.fn((t) => brillouin(J, t), { color: 'accent', width: 2.6, n: 240, domain: [0, 6] });
          sa.fn((t) => Math.min(1.3, ((J + 1) / (3 * J)) * t), { color: 'orange', width: 1.6, dash: true, domain: [0, 6] });
          sa.fn(langevin, { color: 'muted', width: 1.4, alpha: 0.9, domain: [0, 6], n: 200 });
          const xc = clamp(x, 0.01, 6);
          sa.vline(xc, { color: 'faint', dash: true }); h.set(xc, brillouin(J, xc));
          const n = Math.round(2 * J + 1), ms = Array.from({ length: n }, (_, i) => J - i);
          const cc = canon(ms.map((m) => ({ E: -gmu * Bs.value * m })), 1 / Ts.value);
          sb.setView([-0.5, n - 0.5], [0, Math.max(0.5, ...cc.p) * 1.2]);
          cc.p.forEach((p, i) => sb.rect(i - 0.38, 0, i + 0.38, p, { fill: 'accent', fillAlpha: 0.65, color: 'accent', width: 1 }));
          sb.setTicks(ms.filter((m, i) => n <= 8 || i % 3 === 0).map((m) => [J - m, m % 1 ? `${2 * m}/2` : `${m}`]), null);
          st = { bt, x, M: brillouin(J, x), curie: ((J + 1) / (3 * J)) * x };
        });
        v.legend([['accent', 'Brillouin function'], ['orange', 'Curie law (linear)', { dash: true }], ['muted', 'Langevin ($J\\to\\infty$)']]);
        v.readout(() => st && `$B/T=${fix(st.bt, 3)}$ T/K, $x=${fix(st.x, 3)}$: $M/M_{\\rm sat}=${fix(st.M, 4)}$ · Curie's law would give ${fix(st.curie, 4)}${st.curie > 1 ? ' (impossible: beyond saturation)' : ''} · it overestimates by ${fix(100 * (st.curie - st.M) / Math.max(st.M, 1e-9), 1)} %`);
      },
    },
  ],
};
