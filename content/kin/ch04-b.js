// Chemical Kinetics — Chapter 4: Parallel channels and unimolecular reactions (items 4.6–4.9)
import { clamp, ode, logspace, nz } from './ch04.shared.js';

import{lindemannSlow as lamLH,lindemannAudit as lindemann,rrkMixture as rrkFalloff,troeAudit as troe,matchTroeCenter}from'./kin-source-audit-mechanisms.js';

// ---------------------------------------------------------------- RRKM: Beyer-Swinehart direct count of harmonic oscillators
const FREQS = [3000, 2900, 1500, 1450, 1200, 1100, 1000, 900, 800, 700, 600, 500, 400, 300];   // cm^-1, a model set (not a real molecule)
const GRAIN = 20, CLIGHT = 2.99792458e10;
const bsCache = new Map();
function bsCount(freqs, nb) {
  const n = new Float64Array(nb); n[0] = 1;
  for (const nu of freqs) { const m = Math.max(1, Math.round(nu / GRAIN)); for (let i = m; i < nb; i++) n[i] += n[i - m]; }
  return n;
}
function rrkmTables(s, tight, Emax) {
  const key = s + '|' + tight + '|' + Emax, hit = bsCache.get(key);
  if (hit) return hit;
  const nb = Math.ceil(Emax / GRAIN) + 2;
  const mol = bsCount(FREQS.slice(0, s), nb);
  const ts = bsCount(FREQS.slice(0, s - 1).map((x) => x * tight), nb);     // transition state: reaction coordinate removed
  const cum = new Float64Array(nb); let c = 0; for (let i = 0; i < nb; i++) { c += ts[i]; cum[i] = c; }
  const res = { mol, cum };
  if (bsCache.size > 40) bsCache.clear();
  bsCache.set(key, res); return res;
}
const rrkm = (T, E, E0) => {
  const i = Math.round(E / GRAIN), x = (E - E0) / GRAIN;
  if (x < 0) return 0;
  const j = Math.floor(x), f = x - j, N = T.cum[j] + f * ((T.cum[j + 1] ?? T.cum[j]) - T.cum[j]);
  let rho = 0, c = 0; for (let q = i - 8; q <= i + 8; q++) if (q >= 0 && q < T.mol.length) { rho += T.mol[q]; c++; }
  return CLIGHT * N / (rho / c / GRAIN);     // state density smoothed over +-160 cm^-1 (removes the commensurability ripples of a few model frequencies)
};

export default {
  collection: 'kin',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6', kind: 'Proposition', name: 'Parallel reactions and branching ratios',
      statement: String.raw`If A reacts by several first-order channels, $\mathrm A\xrightarrow{k_i}\mathrm P_i$ ($i=1,\dots,m$), then
$$[\mathrm A]=[\mathrm A]_0e^{-k_{\rm tot}t},\quad k_{\rm tot}=\sum_ik_i,\qquad [\mathrm P_i]=\frac{k_i}{k_{\rm tot}}[\mathrm A]_0\bigl(1-e^{-k_{\rm tot}t}\bigr).$$
All products appear with the same time constant $1/k_{\rm tot}$ (the *observed* rate constant is the sum, not any one $k_i$), and their ratio is fixed at all times, $[\mathrm P_i]/[\mathrm P_j]=k_i/k_j$. The fraction of molecules that choose channel $i$ is the **branching ratio** $\Phi_i=k_i/k_{\rm tot}$; for $N$ molecules the number taking it is binomial with mean $N\Phi_i$ and relative scatter $\sqrt{(1-\Phi_i)/(N\Phi_i)}$.`,
      idea: String.raw`Each molecule independently decays with the exponential waiting time of rate $k_{\rm tot}$ (a competition of independent exponential clocks), and the winning clock is channel $i$ with probability $k_i/k_{\rm tot}$, independently of *when* it rings. That is why the ratio of products does not drift. Linearity of the rate equations (1.5) gives the same result as a one-line integration. Because ratios of products are fixed by rate constants, product ratios measure $k_i/k_j$ even when the absolute rates are hard to get, and they change with temperature through the differing activation energies (2.1). For a fixed channel and N independent molecules, let $I_j$ indicate whether molecule j chooses it. Each has variance $\Phi_i(1-\Phi_i)$; variance addition in prob 2.2.1 gives $\operatorname{var}(\sum_j I_j)=N\Phi_i(1-\Phi_i)$. Dividing the standard deviation by the positive mean $N\Phi_i$ yields the displayed relative scatter; independence across molecules, rather than across competing channels of one molecule, is used.`,
      caption: String.raw`Left: three channels (set $k_3=0$ to switch the third off) with the products' fixed ratio shown as the final bar heights; the thin vertical line is the lifetime $1/k_{\rm tot}$. Right: a single molecule-by-molecule experiment on $N$ molecules; press **Resample** to draw new fates. The bars are the observed fractions and the black ticks the expected branching ratios, with a one-standard-deviation whisker. Few molecules give scatter; many molecules reproduce $k_i/k_{\rm tot}$.`,
      deps: ['kin-1.5', 'prob-2.2.1'],
      refs: ['Houston'],
      tags: ['parallel reactions', 'selectivity'],
      scope: String.raw`Independent, irreversible first-order (or pseudo-first-order) channels from one reactant; if the products can interconvert, the ratio drifts toward thermodynamic control.`,
      viz(v) {
        const k1 = v.slider('$k_1$ (s$^{-1}$)', 0.01, 10, 1, { log: true, sig: 2 });
        const k2 = v.slider('$k_2$ (s$^{-1}$)', 0.01, 10, 0.4, { log: true, sig: 2 });
        const k3 = v.slider('$k_3$ (s$^{-1}$, 0 = off)', 0, 5, 0.2, { step: 0.01 });
        const N = v.slider('molecules $N$', 10, 5000, 200, { log: true, int: true, sig: 2 });
        let seed = 1;
        const bt = v.button('Resample', () => { seed++; });
        const s = v.stage({ x: [0, 5], y: [0, 1.05], axes: 'box', gutter: true, height: 320, xlabel: 'time t (s)', ylabel: 'fraction of initial A', title: 'competing channels', weight: 1.3 });
        const b = v.stage({ x: [0.4, 3.6], y: [0, 1], axes: 'box', gutter: true, height: 320, xticks: [[1, 'P₁'], [2, 'P₂'], [3, 'P₃']], ylabel: 'fraction of molecules', title: 'which channel each molecule takes', weight: 1 });
        const cols = ['blue', 'orange', 'purple'];
        let info = {};
        v.render(() => {
          const ks = [k1.value, k2.value, k3.value], kt = ks[0] + ks[1] + ks[2], T = 5 / kt * 0.9 + 0.5 / kt;
          s.setView([0, T], [0, 1.05]);
          s.fn((t) => Math.exp(-kt * t), { color: 'ink', width: 2.2, domain: [0, T] });
          ks.forEach((k, i) => { if (k > 0) s.fn((t) => k / kt * (1 - Math.exp(-kt * t)), { color: cols[i], width: 2.4, domain: [0, T] }); });
          s.vline(1 / kt, { color: 'muted', dash: true });
          const r = v.rng(seed * 7919 + 13), n = N.value, cnt = [0, 0, 0];
          for (let i = 0; i < n; i++) { const u = r() * kt; cnt[u < ks[0] ? 0 : u < ks[0] + ks[1] ? 1 : 2]++; }
          const phi = ks.map((k) => k / kt);
          b.bars(cnt.map((c) => c / n), { x0: 1, dx: 1, color: (val, i) => cols[i] });
          phi.forEach((p, i) => {
            const sd = Math.sqrt(p * (1 - p) / n);
            b.line(i + 0.7, p, i + 1.3, p, { color: 'ink', width: 2.4 });
            b.line(i + 1, Math.max(0, p - sd), i + 1, p + sd, { color: 'ink', width: 1.2 });
          });
          info = { kt, phi, obs: cnt.map((c) => c / n), n, ratio: ks[1] > 0 ? ks[0] / ks[1] : NaN };
        });
        v.legend([['ink', 'A'], ['blue', 'P₁'], ['orange', 'P₂'], ['purple', 'P₃']]);
        v.readout(() => `observed rate constant $k_{\\rm tot}=${nz(v, info.kt)}$ s$^{-1}$ (lifetime $${nz(v, 1 / info.kt)}$ s), the sum of all channels.\n$[\\mathrm P_1]/[\\mathrm P_2]=k_1/k_2=${v.fix(info.ratio, 2)}$ at every time; branching ratios $\\Phi=(${info.phi.map((x) => v.fix(x, 3)).join(',\\ ')})$; \nsampled with $N=${info.n}$: $(${info.obs.map((x) => v.fix(x, 3)).join(',\\ ')})$`);
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7', kind: 'Model', name: 'Lindemann–Hinshelwood mechanism',
      statement: String.raw`A unimolecular reaction $\mathrm A\to\mathrm P$ in a bath gas M proceeds by collisional activation and deactivation followed by reaction of the energized molecule,
$$\mathrm A+\mathrm M\underset{k_{-1}}{\overset{k_1}{\rightleftharpoons}}\mathrm A^*+\mathrm M,\qquad \mathrm A^*\xrightarrow{k_2}\mathrm P.$$
With the steady-state approximation for $\mathrm A^*$ (4.3),
$$k_{\rm uni}=\frac{k_1k_2[\mathrm M]}{k_{-1}[\mathrm M]+k_2}\;\longrightarrow\;\begin{cases}k_1[\mathrm M]&[\mathrm M]\to0\ \text{(second order overall)}\\[2pt] k_\infty=k_1k_2/k_{-1}&[\mathrm M]\to\infty\ \text{(first order)}\end{cases}$$
so a plot of $1/k_{\rm uni}$ against $1/[\mathrm M]$ should be a straight line with intercept $1/k_\infty$. The crossover pressure is $[\mathrm M]_{1/2}=k_2/k_{-1}$. The mechanism explains the change of order with pressure but, with a single rate constant $k_2$, can mispredict the crossover and fall-off shape (4.8, 4.9).`,
      idea: String.raw`At low pressure every activated molecule reacts before it can be deactivated, so activation by collision is the bottleneck and the rate is $k_1[\mathrm M][\mathrm A]$; at high pressure A and A* stay in equilibrium (the pre-equilibrium limit, 4.4) with $[\mathrm A^*]=K[\mathrm A]$ and the unimolecular step controls the rate. The steady-state formula interpolates between the two with a single Lorentzian-like crossover.`,
      caption: String.raw`The effective rate constant against bath-gas pressure over eight decades. Orange: the Lindemann expression. Blue: the exact slow rate constant of the three-species kinetics at constant M (the two nearly coincide when $k_1\ll k_{-1}$). Dots: synthetic "measurements" scattered 5 % about the model with a seeded generator (not real data). Choose the second view to see the Lindemann plot $1/k$ against $1/p$, over the displayed pressure subset $p\ge10^{-3}$ atm; the approximate Lindemann line is straight with intercept $1/k_\infty$. Parameters: $k_{-1}=10^{10}\,\mathrm{atm^{-1}s^{-1}}$, $k_\infty$ and the half-pressure are yours.`,
      deps: ['kin-4.3'],
      refs: ['Claire Vallance, Reaction Kinetics §13 pp.18–19; Theories of Unimolecular Reaction Rates §1 p.1'],
      tags: ['unimolecular reactions', 'pressure dependence'],
      credit: 'Collisional activation–deactivation model',
      verify: false,
      scope: String.raw`Strong-collision model in which every collision with M deactivates A*, and a single energy-independent $k_2$; displayed pressure substitutes for concentration at fixed temperature and its rate coefficients include that conversion. The slow eigenvalue governs the late decay of A+A*, while the SSA coefficient multiplies A; the difference is small only when the energized population is small. Real molecules have $k_2=k(E)$ (4.9).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lindemann_mechanism' },
      viz(v) {
        const kinf = v.slider('$k_\\infty$ (s$^{-1}$)', 1e-4, 1e3, 1, { log: true, sig: 2 });
        const ph = v.slider('half-pressure $[\\mathrm M]_{1/2}$ (atm)', 1e-4, 1, 0.01, { log: true, sig: 2 });
        const noise = v.toggle('synthetic noisy data', true);
        const view = v.select('plot', [{ value: 'loglog', label: '$\\log k$ vs $\\log p$' }, { value: 'recip', label: '$1/k$ vs $1/p$' }], 'loglog');
        const s = v.stage({ x: [-6, 2], y: [-6, 3], axes: 'box', gutter: true, height: 340, xlabel: 'log₁₀ p / atm', ylabel: 'log₁₀ k / s⁻¹', title: 'fall-off over eight decades' });
        let info = {};
        const r = v.rng(11), jit = Array.from({ length: 30 }, () => r.normal());
        v.render(() => {
          const ki = kinf.value, p1 = ph.value;
          const lp = (i) => -6 + 8 * i / 29;
          if (view.value === 'loglog') {
            s.setView([-6, 2], [Math.log10(ki) - 6.5, Math.log10(ki) + 1.2]);
            s.setLabels('log₁₀ p / atm', 'log₁₀ k / s⁻¹');
            s.path(Array.from({ length: 161 }, (_, i) => { const l = -6 + i * 0.05; return [l, Math.log10(lamLH(ki, p1, Math.pow(10, l)))]; }), { color: 'accent', width: 2.6 });
            s.path(Array.from({ length: 161 }, (_, i) => { const l = -6 + i * 0.05; return [l, Math.log10(lindemann(ki, p1, Math.pow(10, l)))]; }), { color: 'orange', width: 2, dash: true });
            s.hline(Math.log10(ki), { color: 'green', dash: [3, 3], alpha: 0.8 });
            s.line(-6, Math.log10(ki / p1) - 6, Math.log10(p1) + 1, Math.log10(ki) + 1, { color: 'purple', width: 1.3, dash: [3, 3] });
            s.vline(Math.log10(p1), { color: 'faint', dash: true });
            if (noise.value) s.dots(Array.from({ length: 30 }, (_, i) => [lp(i), Math.log10(lamLH(ki, p1, Math.pow(10, lp(i)))) + 0.0217 * jit[i]]), { r: 3.5, color: 'ink' });
          } else {
            const pts = Array.from({ length: 30 }, (_, i) => { const p = Math.pow(10, lp(i)); return [1 / p, 1 / lamLH(ki, p1, p)]; });
            const xm = 1 / 1e-3, ym = 1 / ki + p1 / ki * xm;
            s.setView([0, xm], [0, ym * 1.05]);
            s.setLabels('1/p (atm⁻¹)', '1/k (s)');
            s.line(0, 1 / ki, xm, 1 / ki + p1 / ki * xm, { color: 'orange', width: 2, dash: true });
            s.dots(pts.filter((q) => q[0] <= xm), { r: 3.5, color: 'accent' });
            s.dot(0, 1 / ki, { r: 5, color: 'green' });
          }
          const pm = Math.sqrt(p1 * 1);
          info = { kLow: ki / p1, ex: lamLH(ki, p1, 1e-3 * 0 + p1), L: lindemann(ki, p1, p1), p1 };
        });
        v.legend([['accent', 'exact'], ['orange', 'Lindemann', { dash: true }], ['ink', 'synthetic data', { dot: true }], ['green', '$k_\\infty$', { dash: true }], ['purple', '$k_1p$', { dash: true }]]);
        v.readout(() => `$k_1=k_\\infty/[\\mathrm M]_{1/2}=${nz(v, info.kLow)}$ atm$^{-1}$s$^{-1}$; at the half-pressure $k_{\\rm uni}=k_\\infty/2=${nz(v, info.L)}$ s$^{-1}$ (exact slow rate constant $${nz(v, info.ex)}$ s$^{-1}$).\nSlope of $\\log k$ vs $\\log p$ is 1 well below $[\\mathrm M]_{1/2}$ (second order) and 0 well above it (first order).`);
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8', kind: 'Phenomenon', name: 'Fall-off curves',
      statement: String.raw`The rate constant of a unimolecular reaction (or of the association reaction in the reverse direction) varies between a low-pressure limit $k_0[\mathrm M]$ and a high-pressure limit $k_\infty$. In reduced form, with $P_r=k_0[\mathrm M]/k_\infty$, the Lindemann mechanism gives $k/k_\infty=P_r/(1+P_r)$, but measured and computed fall-off curves are **broader**: they rise more slowly and lie below the Lindemann curve, throughout the crossover, with a broadening parameter $0<F_{\rm cent}\le1$. In the shifted Troe form below, $F(P_r=1)$ generally differs from $F_{\rm cent}$; the latter is attained at $\log_{10}P_r=-c$. Combustion and atmospheric databases use the Troe parametrization
$$\frac{k}{k_\infty}=\frac{P_r}{1+P_r}\,F,\qquad \log F=\frac{\log F_{\rm cent}}{1+\bigl[(\log P_r+c)/(n-d(\log P_r+c))\bigr]^2},$$
with $c=-0.4-0.67\log F_{\rm cent}$, $n=0.75-1.27\log F_{\rm cent}$, $d=0.14$.`,
      idea: String.raw`The Lindemann scheme gives every energized molecule the same decay rate. In reality $k(E)$ grows with energy (4.9), so the molecules that are activated at low pressure sit at a distribution of energies and a spread of lifetimes, and the crossover from collision control to unimolecular control happens at different pressures for different energies: the single sharp step is smeared over more decades of pressure. The picture here uses the Rice–Ramsperger–Kassel $k(E)$ with $s$ oscillators and strong collisions; real systems are broadened further by incomplete (weak) collisional energy transfer.`,
      caption: String.raw`Reduced fall-off curves $k/k_\infty$ against $\log P_r$: Lindemann (orange), the strong-collision RRK curve for $s$ oscillators and $E_0/k_BT=x_0$ (blue; a model, not data), and the Troe form (green dashed) with your $F_{\rm cent}$. Press **Match centre** to solve for the Troe parameter that gives the same actual rate at $P_r=1$ and see how well this single-broadening-parameter form follows the whole curve. The shape depends on both the oscillator count and threshold ratio; oscillator count alone does not order these curves throughout the full input range. No measured data or molecule-specific fit are plotted.`,
      deps: ['kin-4.7'],
      refs: ['Claire Vallance, Theories of Unimolecular Reaction Rates §§2–4 pp.2–4', 'Cantera developers, Rate Constant Parameterizations, Falloff Reactions/The Troe Falloff Function (official implementation specification)'],
      tags: ['fall-off', 'unimolecular reactions'],
      credit: 'Energy-resolved SSA model and Troe falloff form',
      verify: false,
      scope: String.raw`Model curves in reduced coordinates; real falloff parameters depend on molecule, bath gas and temperature. The blue curve applies energy-resolved SSA to an unenergized reservoir with classical harmonic density of states and RRK dissociation; it is not a time-dependent master-equation solution for the conserved total molecular population. Strong-collision and fast energy-randomization assumptions are explicit. The displayed Troe formula is an empirical finite-pressure fit: for fixed Fcent its extrapolated F at infinite positive or negative log pressure tends to Fcent^(d²/(1+d²)), not exactly1, so it does not enforce the theoretical asymptotes at arbitrary extremes.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lindemann_mechanism' },
      viz(v) {
        const sS = v.slider('oscillators $s$', 3, 25, 5, { int: true });
        const x0S = v.slider('$E_0/k_BT$', 10, 60, 30, { step: 1 });
        const fc = v.slider('Troe $F_{\\rm cent}$', 1e-5,1,.5,{log:true,sig:3,fmt:x=>x<.01?x.toExponential(3):x.toFixed(3)});
        const st = v.stage({ x: [-4, 4], y: [0, 1.05], axes: 'box', gutter: true, height: 340, xlabel: 'log₁₀ P_r', ylabel: 'k / k∞', title: 'reduced fall-off curve', weight: 1.3 });
        const dv = v.stage({ x: [-4, 4], y: [-1.2, 0.1], axes: 'box', gutter: true, height: 340, xlabel: 'log₁₀ P_r', ylabel: 'log₁₀ (k / k_L)', title: 'broadening relative to Lindemann', weight: 1 });
        v.button('Match centre', () => { const c = rrkFalloff(sS.value, x0S.value).curve.find((q) => Math.abs(q[0]) < 1e-6); fc.set(matchTroeCenter(c[1])); });
        let info = {};
        v.render(() => {
          const { curve } = rrkFalloff(sS.value, x0S.value), F = fc.value;
          st.fn((x) => 1 / (1 + Math.pow(10, -x)), { color: 'orange', width: 2, domain: [-4, 4] });
          st.path(curve.filter((q) => q[0] >= -4 && q[0] <= 4), { color: 'accent', width: 2.6 });
          st.fn((x) => troe(x, F), { color: 'green', width: 2, dash: true, domain: [-4, 4] });
          st.vline(0, { color: 'faint', dash: true });
          dv.path(curve.filter((q) => q[0] >= -4 && q[0] <= 4).map(([x, y]) => [x, Math.log10(y * (1 + Math.pow(10, -x)))]), { color: 'accent', width: 2.4 });
          dv.fn((x) => Math.log10(troe(x, F) * (1 + Math.pow(10, -x))), { color: 'green', width: 2, dash: true, domain: [-4, 4] });
          dv.hline(0, { color: 'orange', width: 1.6 });
          const lo = Math.min(...curve.filter((q) => q[0] >= -4 && q[0] <= 4).map(([x, y]) => Math.log10(y * (1 + Math.pow(10, -x)))), Math.log10(F));
          dv.setView([-4, 4], [Math.min(-0.3, lo * 1.15), 0.1]);
          const c0 = curve.find((q) => Math.abs(q[0]) < 1e-6)[1];
          let rms = 0, cnt = 0; for (const [x, y] of curve) if (x >= -3 && x <= 3) { rms += (Math.log10(y) - Math.log10(troe(x, F))) ** 2; cnt++; }
          info = { Fc: 2 * c0, rms: Math.sqrt(rms / cnt) };
        });
        v.legend([['orange', 'Lindemann'], ['accent', 'RRK, strong collisions'], ['green', 'Troe form', { dash: true }]]);
        v.readout(() => `RRK actual centre ratio $2\\,k/k_\\infty|_{P_r=1}=${v.fix(info.Fc, 6)}$ (Lindemann: 1). Your Troe parameter $F_{\\rm cent}=${v.fix(fc.value,4)}$ gives actual $2k(P_r=1)/k_\\infty=${v.fix(2*troe(0,fc.value),4)}$; rms difference $\\log_{10}$ over $|\\log P_r|\\le3$: $${v.fix(info.rms, 3)}$.`);
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9', kind: 'Model', name: 'RRK and RRKM theory',
      statement: String.raw`Treat an energized molecule with total internal energy $E$ as a set of $s$ coupled oscillators whose energy redistributes fast and randomly compared with reaction (the ergodic hypothesis of statistical unimolecular theory). In **RRK** theory (Rice and Ramsperger 1927, Kassel 1928) reaction requires that one critical oscillator collect at least $E_0$ of the energy, and the microcanonical rate constant is
$$k(E)=A\Bigl(1-\frac{E_0}{E}\Bigr)^{s-1}\quad(E\ge E_0),$$
the probability that this happens. **RRKM** theory (Marcus 1952) replaces the classical estimate by a quantum count of states,
$$k(E)=\frac{N^\ddagger(E-E_0)}{h\,\rho(E)},$$
with $\rho(E)$ the density of vibrational states of the molecule and $N^\ddagger(E-E_0)$ the number of states of the transition state with excess energy up to $E-E_0$ (transition-state theory, 3.2, applied microcanonically). Both give $k(E)$ rising steeply above threshold and, at fixed $E$, falling as the energy is shared among more oscillators.`,
      idea: String.raw`Lindemann's picture (4.7) needs the lifetime of A* as a function of its energy. If energy flows freely among the modes, every arrangement of the quanta is equally likely, and the molecule reacts when the quanta happen to pile up in the reaction coordinate: the fraction of arrangements in which a given mode holds more than $E_0$ out of $E$ is $(1-E_0/E)^{s-1}$ for classical oscillators. Counting states exactly with the Beyer–Swinehart algorithm gives RRKM, with no adjustable $A$: the pre-exponential factor comes from the ratio of the transition state's states to the molecule's, which is the microcanonical form of the Eyring equation. Averaging $k(E)$ over the thermal distribution of activated molecules gives the fall-off curves of 4.8.`,
      caption: String.raw`Left: $k(E)$ against $E/E_0$ on a log axis, RRK (orange; $A$ is matched to RRKM at $E=2E_0$) and RRKM (blue, Beyer–Swinehart state counts with the density of states smoothed over ±160 cm$^{-1}$, for a model molecule of $s$ harmonic oscillators with frequencies 3000, 2900, 1500, … cm$^{-1}$; not a real molecule), with a dot at your $E$. Right: 3000 random ways to share the energy $E$ among the $s$ oscillators (uniform on the simplex): the histogram of the energy in one chosen mode against $(s-1)/E\,(1-\varepsilon/E)^{s-2}$, with the part above $E_0$ shaded: its area is the RRK probability. Loosen the transition state (tightness below 1) to raise the RRKM rate.`,
      deps: ['kin-4.7', 'kin-3.2'],
      refs: ['Steinfeld et al.'],
      tags: ['unimolecular reactions', 'statistical theory'],
      credit: 'Rice & Ramsperger, 1927; Kassel, 1928; Marcus, J. Chem. Phys. 20, 359 (1952)',
      scope: String.raw`Statistical (intramolecular-vibrational-redistribution-limited) behaviour, harmonic oscillators, no tunnelling, no rotation; the model frequencies are illustrative.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/RRKM_theory' },
      viz(v) {
        const sS = v.slider('oscillators $s$', 3, 14, 8, { int: true });
        const E0S = v.slider('$E_0$ (kJ/mol)', 100, 300, 200, { step: 5 });
        const er = v.slider('$E/E_0$', 1.02, 3, 1.8, { step: 0.01 });
        const tight = v.slider('TS tightness (frequency scale)', 0.6, 1.3, 1, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const k = v.stage({ x: [1, 3], y: [0, 14], axes: 'box', gutter: true, height: 330, xlabel: 'E / E₀', ylabel: 'log₁₀ k(E) (s⁻¹)', title: 'microcanonical rate constant', weight: 1.1 });
        const h = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'energy in the critical mode / E', ylabel: 'probability density', title: 'random sharing of the energy', weight: 1 });
        let info = {};
        v.render(() => {
          const s = sS.value, cmk = 83.5935;
          const E0 = E0S.value * cmk, Emax = 3.05 * E0;
          const T = rrkmTables(s, Math.round(tight.value * 100) / 100, Math.round(Emax / 1000) * 1000 + 1000);
          const kM = (x) => rrkm(T, x * E0, E0);
          const Aref = (() => { const kk = kM(2); return kk > 0 ? kk / Math.pow(0.5, s - 1) : 1e13; })();
          const rrk = (x) => Aref * Math.pow(1 - 1 / x, s - 1);
          const lg = (f) => (x) => { const y = f(x); return y > 0 ? Math.log10(y) : NaN; };
          k.fn(lg(rrk), { color: 'orange', width: 2.2, domain: [1.05, 3] });
          const pts = []; for (let x = 1.0; x <= 3.0001; x += 0.01) { const y = kM(x); pts.push(y > 0 ? [x, Math.log10(y)] : null); }
          k.path(pts, { color: 'accent', width: 2.4 });
          const fin = pts.filter(Boolean).map((q) => q[1]); k.setView([1, 3], [Math.floor(Math.min(...fin)) - 1, Math.ceil(Math.max(...fin, 12)) + 1]);
          const E = er.value; k.vline(E, { color: 'muted', dash: true });
          const yM = kM(E), yR = rrk(E);
          if (yM > 0) k.dot(E, Math.log10(yM), { r: 5.5, color: 'accent' });
          if (yR > 0) k.dot(E, Math.log10(yR), { r: 5.5, color: 'orange' });
          // random sharing
          const r = v.rng(seed * 101), n = 3000, ep = [];
          for (let i = 0; i < n; i++) {
            // s oscillators share unit energy uniformly on the simplex: spacings of s-1 sorted uniforms
            const u = Array.from({ length: s - 1 }, () => r()).sort((a, b) => a - b);
            ep.push(u[0]);
          }
          const f0 = 1 / E;                         // E0/E
          const dens = (x) => (s - 1) * Math.pow(1 - x, s - 2);
          h.setView([0, 1], [0, Math.max(3, Math.min(14, (s - 1) * 1.1))]);
          h.hist(ep, { bins: 40, range: [0, 1], density: true, color: 'blue', fillAlpha: 0.3 });
          h.fn(dens, { color: 'ink', width: 2, domain: [0, 1] });
          h.fn(dens, { color: 'orange', width: 0, fill: true, base: 0, domain: [f0, 1] });
          h.vline(f0, { color: 'orange', dash: true });
          const frac = ep.filter((x) => x >= f0).length / n;
          info = { yM, yR, frac, pred: Math.pow(1 - f0, s - 1), E, Aref };
        });
        v.legend([['accent', 'RRKM (state count)'], ['orange', 'RRK, A matched at 2E₀'], ['blue', 'sampled sharing', { area: true }]]);
        v.readout(() => `At $E=${v.fix(info.E, 2)}E_0$: RRKM $k=${nz(v, info.yM, 2)}$ s$^{-1}$, RRK $k=${nz(v, info.yR, 2)}$ s$^{-1}$ ($A=${nz(v, info.Aref, 2)}$ s$^{-1}$).\nFraction of $N=3000$ random partitions with $\\ge E_0$ in the critical mode: $${v.fix(info.frac, 3)}$ against $(1-E_0/E)^{s-1}=${v.fix(info.pred, 3)}$.`);
      },
    },
  ],
};
