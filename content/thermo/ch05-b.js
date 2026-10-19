// Thermodynamics & Statistical Mechanics — Chapter 5 (part b): gas entropy, paradoxes, demons and the cost of information
import { clamp, lerp, R, KB, NA, HP, AMU, lnGam, lnFac, lnBin, lnEin, shannon, texExp, sup10, tRamp, ramp, pick } from './ch05.shared.js';

// ---------- helpers for this file ----------
/** Noble gases: standard atomic weight (IUPAC) and the CODATA key value of S° at 298.15 K, 1 bar (J/(mol K), NIST WebBook). */
const NOBLE = {
  He: { name: 'helium', m: 4.002602, S: 126.153, tex: '\\mathrm{He}' },
  Ne: { name: 'neon', m: 20.1797, S: 146.328, tex: '\\mathrm{Ne}' },
  Ar: { name: 'argon', m: 39.948, S: 154.846, tex: '\\mathrm{Ar}' },
  Kr: { name: 'krypton', m: 83.798, S: 164.085, tex: '\\mathrm{Kr}' },
  Xe: { name: 'xenon', m: 131.293, S: 169.685, tex: '\\mathrm{Xe}' },
};
/** Thermal de Broglie wavelength (m) of an atom of mass m (kg). */
const lambdaT = (m, T, hf = 1) => hf * HP / Math.sqrt(2 * Math.PI * m * KB * T);
/** Sackur–Tetrode entropy per atom in units of k at temperature T (K), pressure P (Pa): ln(kT/(Pλ³)) + 5/2. */
const sST = (mAmu, T, P, hf = 1) => Math.log(KB * T / (P * lambdaT(mAmu * AMU, T, hf) ** 3)) + 2.5;
/** Temperature (K) at which nλ³ = 1 for pressure P (Pa) (the classical treatment is unreliable below it). */
const Tdeg = (mAmu, P) => Math.pow(P * HP ** 3 / (KB * Math.pow(2 * Math.PI * mAmu * AMU * KB, 1.5)), 0.4);

export default {
  collection: 'thermo',
  chapter: 5,
  items: [
    // ------------------------------------------------------------------ 5.11
    {
      num: '5.11', kind: 'Theorem', name: 'Sackur–Tetrode equation',
      statement: String.raw`For a dilute monatomic ideal gas of $N$ identical atoms of mass $m$ in volume $V$ at temperature $T$ (energy $U=\tfrac32NkT$), counting one microstate per phase-space cell of size $h^{3}$ per atom and dividing by $N!$ for indistinguishability gives the absolute entropy
$$S=Nk\left[\ln\!\left(\frac{V}{N\lambda^{3}}\right)+\frac52\right],\qquad \lambda=\frac{h}{\sqrt{2\pi mkT}}.$$
Equivalently $S=Nk\{\ln[\tfrac VN(\tfrac{4\pi mU}{3Nh^2})^{3/2}]+\tfrac52\}$. It reproduces $\partial S/\partial U=1/T$, $P=NkT/V$ and $C_V=\tfrac32Nk$ and is valid only when $N\lambda^3/V\ll1$; as $T\to0$ it would give $S\to-\infty$, so the classical gas fails below the degeneracy temperature.`,
      idea: String.raw`The number of states below energy $E$ is the momentum-ball volume of 5.10 times $V^N$, divided by $h^{3N}$ (one quantum state per cell of size $h$ per degree of freedom, qm-12.13) and by $N!$ for identical atoms. Taking the logarithm and using Stirling's formula (pma-8.22) for $\ln N!$ and $\ln\Gamma(\tfrac{3N}2+1)$ gives the equation; differentiating with respect to $U$, $V$, $N$ reproduces the ideal-gas law and $\mu$. The constant $h$ appears inside the logarithm, so changing it shifts the absolute entropy by $-3Nk\ln f$ for $h\to fh$.`,
      caption: String.raw`**Choose a noble gas, a pressure and a temperature.** Left: $S/Nk$ against $T$ for the chosen gas (thick) and the others (thin); the red zone is where $N\lambda^3/V>1$ and the formula breaks down (its extrapolation eventually gives negative entropy). Right: the formula, evaluated at 298.15 K and 1 bar (bars), against the CODATA key values of the standard entropy (rings), with the difference printed above each bar. The *Planck-constant factor* rescales $h$: the agreement is lost at once, which is the point — the absolute entropy depends on $h$.`,
      deps: ['thermo-5.10', 'pma-8.22'], refs: ["Tong §2.2.3, Eq. (2.13)","NIST Chemistry WebBook: noble-gas CODATA entropy reviews"], tags: ['ideal gas', 'entropy'],
      credit: 'Sackur–Tetrode equation',
      scope: String.raw`Dilute monatomic gas with $N\lambda^3/V\ll1$ (classical limit of the ideal quantum gas) and negligible electronic excitation. The CODATA review values are the ideal-gas standard entropies at 298.15 K and 1 bar quoted by the NIST Chemistry WebBook. Their close agreement checks the constants and arithmetic; the comparison is not an independent calorimetric determination of Planck’s constant.`,

      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sackur%E2%80%93Tetrode_equation' },
      viz(v) {
        const gsel = v.select('gas', Object.keys(NOBLE), 'He');
        const Ts = v.slider('temperature $T$ (K)', 0.1, 3000, 298.15, { log: true, sig: 4, fmt: (x) => v.fix(x, x < 10 ? 2 : 1) });
        const Ps = v.slider('pressure $P$ (bar)', 1e-4, 1e3, 1, { log: true, sig: 2, fmt: (x) => String(+x.toPrecision(2)) });
        const hs = v.slider('Planck-constant factor $h\\to f\\,h$', 0.5, 2, 1, { log: true, sig: 3, fmt: (x) => v.fix(x, 2) });
        const sa = v.stage({ x: [0.1, 3000], y: [-10, 26], xlog: true, axes: 'box', gutter: true, height: 300, weight: 1.3, xlabel: 'temperature $T$ (K)', ylabel: '$S/Nk$', title: 'Sackur–Tetrode entropy per atom' });
        const sb = v.stage({ x: [0.4, 5.6], y: [100, 185], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 250, ylabel: '$S^\\circ$ (J/(mol K))', xticks: Object.keys(NOBLE).map((k, i) => [i + 1, k]), title: 'formula (bars) vs CODATA (rings), 298.15 K, 1 bar' });
        const keys = Object.keys(NOBLE);
        let st = null;
        v.render(() => {
          const P = Ps.value * 1e5, hf = hs.value, key = gsel.value, g = NOBLE[key];
          const standard = keys.map(k => R * sST(NOBLE[k].m, 298.15, 1e5, hf));
          sb.setView([.4, 5.6], [Math.min(100, ...standard.map(x => x - 8)), Math.max(185, ...standard.map(x => x + 8))]);
          const td = Tdeg(g.m, P) * Math.pow(hf, 1.2);   // At fixed P, nλ³ ∝ h³ T^{-5/2}, hence Tdeg ∝ h^{6/5}.
          if (td > 0.1) sa.vband(0.1, td, { color: 'red', alpha: 0.14 });
          for (const k of keys) if (k !== key) sa.fn((T) => sST(NOBLE[k].m, T, P, hf), { color: 'muted', width: 1.1, alpha: 0.7, n: 120 });
          sa.fn((T) => sST(g.m, T, P, hf), { color: 'accent', width: 2.8, n: 200 });
          sa.hline(0, { color: 'faint', width: 1 });
          if (td > 0.2) sa.text('$N\\lambda^3/V>1$: formula fails', Math.max(0.35, Math.sqrt(0.1 * td)), -7.5, { size: 11, color: 'red', align: 'center', plate: true });
          sa.dot(Ts.value, sST(g.m, Ts.value, P, hf), { r: 6, color: 'gold' });
          keys.forEach((k, i) => {
            const S = R * sST(NOBLE[k].m, 298.15, 1e5, hf), d = S - NOBLE[k].S;
            sb.rect(i + 0.65, 100, i + 1.35, S, { fill: k === key ? 'accent' : 'muted', fillAlpha: 0.65, color: k === key ? 'accent' : 'muted', width: 1 });
            sb.dot(i + 1, NOBLE[k].S, { r: 7, color: 'orange', hollow: true });
            sb.text(Math.abs(d) < 0.05 ? v.fix(1e6 * d / NOBLE[k].S, 1) + ' ppm' : v.fix(d, 1), i + 1, S, { dy: -12, size: 10.5, align: 'center', color: 'ink', plate: true });
          });
          const T = Ts.value, lam = lambdaT(g.m * AMU, T, hf), n = P / (KB * T);
          st = { key, g, T, lam, n, nl3: n * lam ** 3, S: R * sST(g.m, T, P, hf), S0: R * sST(g.m, 298.15, 1e5, hf), td, hf, P };
        });
        v.legend([['accent', 'chosen gas'], ['red', '$N\\lambda^3/V>1$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { key, g, T, lam, nl3, S, S0, td, hf, P } = st;
          return `$${g.tex}$ at ${v.fix(T, 1)} K, ${String(+(P / 1e5).toPrecision(2))} bar: $\\lambda=${v.sci(lam, 3)}$ m, $N\\lambda^3/V=${v.sci(nl3, 3)}$ ${nl3 > 0.3 ? '(**quantum regime: formula invalid**)' : ''} · $S=${v.fix(S, 2)}$ J/(mol K) = $${v.fix(S / R, 2)}\\,k$/atom · degeneracy temperature at this $P$: ${v.fix(td, td < 1 ? 3 : 2)} K\nstandard entropy at 298.15 K, 1 bar: formula **${v.fix(S0, 3)}** J/(mol K) vs CODATA ${g.S} (${v.fix(1e6 * (S0 - g.S) / g.S, 1)} ppm)${Math.abs(hf - 1) > 0.005 ? ` — with $h\\to${v.fix(hf, 2)}\\,h$ every entropy shifts by $-3R\\ln f=${v.fix(-3 * R * Math.log(hf), 2)}$ J/(mol K)` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.12
    {
      num: '5.12', kind: 'Theorem', name: 'Resolving the Gibbs paradox',
      statement: String.raw`If the $N$ molecules of a gas are treated as distinguishable, classical counting gives $S(N,V,T)=Nk[\ln(V/\lambda^3)+\tfrac32]$, which is not extensive: $S(2N,2V)\ne2S(N,V)$, and removing a partition between two samples of the *same* gas would raise the entropy by $2Nk\ln2$. Dividing the number of states by $N!$ — because identical particles are indistinguishable (a permutation does not produce a new state, qm-10.1) — gives $S=Nk[\ln(V/N\lambda^3)+\tfrac52]$ up to $O(\ln N)$ terms: it is extensive, and mixing two samples of the same gas changes $S$ only by the subextensive $\tfrac12k\ln(\pi N)$ (negligible per particle), while mixing two *different* gases still gives $2Nk\ln2$.`,
      idea: String.raw`The extra $2Nk\ln2$ comes from the factor $2^N$ by which the number of position assignments grows when each of the $N$ labelled molecules is free to be in either half; for identical molecules most of those assignments are the same physical state, and the overcounting is exactly $N!$ to leading order. Stirling's formula (pma-8.22) turns $\ln N!$ into $N\ln N-N$, which converts $\ln V^N$ into $N\ln(V/N)$ and restores extensivity. The distinction between "same" and "different" is discontinuous because indistinguishability is a property of the quantum state space (qm-10.1), not a matter of degree; the operational side is discussed in 4.13.`,
      caption: String.raw`**Toggle the counting rule and the kind of gas.** Left: entropy per molecule at fixed density against the number of molecules — flat for the corrected counting (Sackur–Tetrode, with its small $\ln N/N$ finite-size correction), growing like $\ln N$ without $1/N!$. Right: the entropy change $\Delta S/Nk$ on removing the partition between two boxes of $N$ molecules each at the same $T$ and $P$ — for identical gas, different gases, with and without the factor. Notice that only identical gas with the classical counting gives a nonzero answer that cannot be right.`,
      deps: ['thermo-5.11', 'thermo-4.13', 'qm-10.1'], refs: ['Kardar §4.5'], tags: ['Gibbs paradox', 'indistinguishability'],
      credit: 'J. W. Gibbs, 1870s (the paradox and the $1/N!$ remedy); the quantum justification came later',
      viz(v) {
        const rule = v.select('counting', [{ value: 'cor', label: 'with $1/N!$' }, { value: 'cls', label: 'without (distinguishable)' }], 'cor');
        const kind = v.select('gases', [{ value: 'same', label: 'identical' }, { value: 'diff', label: 'different' }], 'same');
        const Nl = v.slider('$\\log_{10}N$ in each box', 0, 12, 3, { step: 0.1, fmt: (x) => v.fix(x, 1) });
        const nl3 = v.slider('density in thermal units $n\\lambda^3$', -9, -2, -6, { step: 0.1, fmt: (x) => '1e' + v.fix(x, 1) });
        const sa = v.stage({ x: [1, 1e12], y: [8, 46], xlog: true, axes: 'box', gutter: true, height: 290, weight: 1.2, xlabel: 'number of molecules $N$ (at fixed density)', ylabel: '$S/Nk$', title: 'is the entropy extensive?' });
        const sb = v.stage({ x: [0.4, 4.6], y: [0, 1.7], axes: 'box', gutter: true, height: 290, weight: 1, minWidth: 250, ylabel: '$\\Delta S_{\\text{mix}}/Nk$', xticks: [[1, 'same, 1/N!'], [2, 'same, none'], [3, 'diff., 1/N!'], [4, 'diff., none']], title: 'removing the partition' });
        const sMol = (N, a, corr) => { // S/(N k) at density n with lnFac exact (N ≥ 1): ln(V/λ³) = ln N − ln(nλ³)
          const lnVl = Math.log(N) - a * Math.LN10;
          return corr ? (N * lnVl - (N < 1e7 ? lnFac(N) : N * Math.log(N) - N + 0.5 * Math.log(2 * Math.PI * N))) / N + 1.5 : lnVl + 1.5;
        };
        let st = null;
        v.render(() => {
          const N = Math.round(10 ** Nl.value), a = nl3.value;
          sa.fn((x) => sMol(Math.max(1, x), a, true), { color: 'accent', width: 2.6, n: 240 });
          sa.fn((x) => sMol(Math.max(1, x), a, false), { color: 'red', width: 2.4, n: 240, dash: rule.value === 'cls' ? null : [6, 4] });
          sa.hline(-a * Math.LN10 + 2.5, { color: 'green', width: 1.2, dash: true });
          sa.text('$\\ln(1/n\\lambda^3)+5/2$', 3e8, -a * Math.LN10 + 2.5, { dy: -10, size: 11, color: 'green', align: 'center', plate: true });
          sa.dot(N, sMol(N, a, rule.value === 'cor'), { r: 6, color: 'gold' });
          const half = N < 1e7 ? 0.5 * Math.log(Math.PI * N) : 0.5 * Math.log(Math.PI * N);
          const vals = [half / N, 2 * Math.LN2, 2 * Math.LN2, 2 * Math.LN2];
          const sel = (kind.value === 'same' ? 0 : 2) + (rule.value === 'cor' ? 0 : 1);
          vals.forEach((d, i) => { sb.rect(i + 0.65, 0, i + 1.35, d, { fill: i === sel ? (i === 1 ? 'red' : 'accent') : 'muted', fillAlpha: i === sel ? 0.8 : 0.3, color: i === sel ? (i === 1 ? 'red' : 'accent') : 'muted', width: 1 }); sb.text(v.fix(d, d < 0.1 ? 4 : 3), i + 1, d, { dy: -9, size: 10.5, align: 'center', color: 'ink' }); });
          st = { N, a, sel, half };
        });
        v.legend([['accent', 'with $1/N!$'], ['red', 'without $1/N!$'], ['green', 'large-$N$ limit', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { N, a, sel, half } = st, cor = rule.value === 'cor';
          // extensivity defect S(N,V)·2 − S(2N,2V)
          const S1 = N * sMol(N, a, cor), S2 = 2 * N * sMol(2 * N, a, cor);
          return `$N=${N >= 1e6 ? v.sci(N, 2) : N}$ per box: mixing ${kind.value === 'same' ? 'identical' : 'different'} gases, ${cor ? 'with' : 'without'} $1/N!$: $\\Delta S=${sel === 0 ? '\\tfrac12k\\ln(\\pi N)=' + v.fix(half, 2) + '\\,k' : '2Nk\\ln2=' + v.sci(2 * N * Math.LN2, 3) + '\\,k'}$ ${sel === 1 ? '— **the paradox**: identical gases, yet entropy rises by an extensive amount' : ''}\nextensivity: $2S(N,V)-S(2N,2V)=${v.sci(Math.abs(2 * S1 - S2), 3)}\\,k$ (${cor ? 'a subextensive $O(\\ln N)$ remainder' : 'exactly $-2Nk\\ln2$: not extensive'})`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.13
    {
      num: '5.13', kind: 'Paradox', name: 'Loschmidt’s reversibility paradox',
      statement: String.raw`The microscopic laws of classical mechanics are invariant under time reversal: if every velocity of an isolated gas is reversed at some instant, the gas retraces its history exactly and, in particular, a gas that has spread out from a corner would gather back into it, with the entropy *decreasing*. Loschmidt (1876) put this forward as an objection to Boltzmann's $H$-theorem, which derives monotonically increasing entropy from the same laws. The resolution: the reversed state exists, but it belongs to a set of microstates of overwhelmingly small measure (5.4, 5.7); a typical microstate of the same macrostate evolves toward equilibrium in both time directions, and the slightest error in a reversal destroys the gathering because small differences grow exponentially in chaotic gases.`,
      idea: String.raw`Hamilton's equations (mech-12.3) are reversible, so the objection is logically correct: the second law cannot be a theorem of the dynamics alone. Boltzmann's answer was statistical (5.7): among all microstates compatible with a macrostate, those that will lower the entropy form a vanishing fraction, but the velocity-reversed image of an entropy-increasing history is one of them, and it is exquisitely tuned. Because trajectories of a dense gas diverge exponentially (Lyapunov exponent $\lambda$), a perturbation $\delta$ before the reversal has grown to $\delta e^{\lambda t}$ when the gas is meant to be back at the start, and the rewind fails after a few Lyapunov times.`,
      caption: String.raw`**Press play.** A gas of 36 soft disks, released as a compact block in the corner of a box, spreads out; at the reversal time every velocity is flipped (with the relative error you choose) and the evolution continues with the same, exactly time-reversible integrator (velocity Verlet). The middle panel is the coarse-grained entropy of the particle distribution on a $4\times4$ grid, the right panel the root-mean-square distance of the particles from their original positions on a log scale. With a perfect reversal the block reassembles; with a kick of $10^{-6}$ it does so only if you reverse early.`,
      deps: ['thermo-5.7', 'mech-12.3'], refs: ['Kardar §3.5'], tags: ['irreversibility', 'chaos'],
      credit: 'J. Loschmidt, 1876 (Sitzungsberichte der Wiener Akademie 73, 128–142); Boltzmann’s reply: the statistical interpretation of the second law',
      scope: String.raw`A 36-particle, two-dimensional soft-disk gas in a box with reflecting walls; the chaos is genuine but the entropy plotted is a coarse-grained occupancy entropy, not a thermodynamic one.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Loschmidt%27s_paradox' },
      viz(v) {
        const tr = v.slider('reversal time $t_{\\text{rev}}$', 1, 25, 8, { step: 0.5, fmt: (x) => v.fix(x, 1) });
        const kk = v.select('error in the reversal', [{ value: 0, label: 'none' }, { value: 1e-12, label: '$10^{-12}$' }, { value: 1e-9, label: '$10^{-9}$' }, { value: 1e-6, label: '$10^{-6}$' }, { value: 1e-3, label: '$10^{-3}$' }], 0);
        const N = 36, L = 10, dt = 0.004, sub = 25;
        let run = null, runKey = '';
        function simulate(trev, kick) {
          const r = v.rng(3);
          const x = new Float64Array(N), y = new Float64Array(N), vx = new Float64Array(N), vy = new Float64Array(N), ax = new Float64Array(N), ay = new Float64Array(N);
          const n = 6;
          for (let i = 0; i < N; i++) { x[i] = 0.7 + (i % n) * 1.05; y[i] = 0.7 + Math.floor(i / n) * 1.05; vx[i] = r.normal(); vy[i] = r.normal(); }
          let mx = 0, my = 0; for (let i = 0; i < N; i++) { mx += vx[i]; my += vy[i]; } for (let i = 0; i < N; i++) { vx[i] -= mx / N; vy[i] -= my / N; }
          const x0 = Float64Array.from(x), y0 = Float64Array.from(y), rc2 = Math.pow(2, 1 / 3);
          const force = () => { ax.fill(0); ay.fill(0); for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { const dx = x[i] - x[j], dy = y[i] - y[j], r2 = dx * dx + dy * dy; if (r2 < rc2) { const s2 = 1 / r2, s6 = s2 * s2 * s2, f = 24 * (2 * s6 * s6 - s6) * s2; ax[i] += f * dx; ay[i] += f * dy; ax[j] -= f * dx; ay[j] -= f * dy; } } };
          const step = () => {
            for (let i = 0; i < N; i++) { vx[i] += 0.5 * dt * ax[i]; vy[i] += 0.5 * dt * ay[i]; x[i] += dt * vx[i]; y[i] += dt * vy[i]; if (x[i] < 0) { x[i] = -x[i]; vx[i] = -vx[i]; } if (x[i] > L) { x[i] = 2 * L - x[i]; vx[i] = -vx[i]; } if (y[i] < 0) { y[i] = -y[i]; vy[i] = -vy[i]; } if (y[i] > L) { y[i] = 2 * L - y[i]; vy[i] = -vy[i]; } }
            force(); for (let i = 0; i < N; i++) { vx[i] += 0.5 * dt * ax[i]; vy[i] += 0.5 * dt * ay[i]; }
          };
          const cg = () => { const c = new Array(16).fill(0); for (let i = 0; i < N; i++) c[Math.min(3, Math.floor(x[i] / L * 4)) + 4 * Math.min(3, Math.floor(y[i] / L * 4))]++; return shannon(c.map((k) => k / N)); };
          const rms = () => { let d = 0; for (let i = 0; i < N; i++) d += (x[i] - x0[i]) ** 2 + (y[i] - y0[i]) ** 2; return Math.sqrt(d / N); };
          const frames = [], ser = [];
          const snap = (t) => { frames.push([Float32Array.from(x), Float32Array.from(y)]); ser.push([t, cg(), rms()]); };
          force(); snap(0);
          const ns = Math.round(trev / dt);
          for (let k = 1; k <= ns; k++) { step(); if (k % sub === 0) snap(k * dt); }
          for (let i = 0; i < N; i++) { vx[i] = -vx[i] * (1 + kick * r.normal()); vy[i] = -vy[i] * (1 + kick * r.normal()); }
          for (let k = 1; k <= ns; k++) { step(); if (k % sub === 0) snap((ns + k) * dt); }
          return { frames, ser, trev, kick, nrev: Math.floor(ns / sub) };
        }
        const sa = v.stage({ x: [-0.3, L + 0.3], y: [-0.3, L + 0.3], equal: true, axes: false, height: 290, weight: 0.9, minWidth: 250, title: 'the gas' });
        const sb = v.stage({ x: [0, 50], y: [0, 2.9], axes: 'box', gutter: true, height: 290, weight: 1, minWidth: 250, xlabel: 'time', ylabel: 'coarse-grained entropy', title: 'entropy of a $4\\times4$ occupancy grid' });
        const sc = v.stage({ x: [0, 50], y: [1e-13, 20], ylog: true, axes: 'box', gutter: true, height: 290, weight: 1, minWidth: 250, xlabel: 'time', ylabel: 'rms distance from start', title: 'distance from the initial state' });
        const rampc = ramp(v, 'blue', 'red', 36, 'gold');
        let info = null;
        v.animate((t) => {
          const key = tr.value + '|' + kk.value;
          if (key !== runKey) { runKey = key; run = simulate(tr.value, +kk.value); }
          const nf = run.frames.length, ph = clamp(((t % 24) / 24) * 1.12, 0, 1), f = Math.min(nf - 1, Math.floor(ph * (nf - 1) + 1e-9));
          const [fx, fy] = run.frames[f], T = run.ser[run.ser.length - 1][0];
          sa.rect(0, 0, L, L, { color: 'ink', width: 2 });
          sa.rect(0.0, 0.0, 6.0, 6.0, { color: 'faint', width: 1, dash: true });
          for (let i = 0; i < N; i++) sa.dot(fx[i], fy[i], { r: 7, color: pick(rampc, (i % 6 + Math.floor(i / 6)) / 10), alpha: 0.9, ring: false });
          sa.text(f > run.nrev ? 'after the reversal' : 'before the reversal', L / 2, L + 0.15, { size: 11.5, color: f > run.nrev ? 'red' : 'muted', align: 'center', baseline: 'bottom', weight: 650 });
          sb.setView([0, T], [0, 2.9]); sc.setView([0, T], [1e-13, 20]);
          const mk = (st, col, idx) => { st.path(run.ser.map((p) => [p[0], p[idx]]), { color: col, width: 2.2 }); st.vline(run.trev, { color: 'red', width: 1.2, dash: true }); st.vline(run.ser[f][0], { color: 'gold', width: 1.6 }); };
          mk(sb, 'accent', 1); sb.hline(Math.log(16), { color: 'green', width: 1, dash: true });
          mk(sc, 'accent', 2);
          sc.path(run.ser.filter((p) => p[2] > 0).map((p) => [p[0], p[2]]), { color: 'accent', width: 2.2 });
          const last = run.ser[run.ser.length - 1];
          info = { S0: run.ser[0][1], Smid: run.ser[run.nrev][1], Send: last[1], dend: last[2], trev: run.trev, kick: run.kick, Sn: run.ser[f][1], tn: run.ser[f][0] };
        }, { still: 22, period: 24 });
        v.legend([['red', 'velocities reversed', { dash: true }], ['green', 'maximum $\\ln16$', { dash: true }], ['gold', 'now']]);
        v.readout(() => {
          if (!info) return '';
          const { S0, Smid, Send, dend, trev, kick, Sn, tn } = info;
          return `$t=${v.fix(tn, 1)}$: entropy ${v.fix(Sn, 2)} · start ${v.fix(S0, 2)}, at the reversal ${v.fix(Smid, 2)} (max ${v.fix(Math.log(16), 2)}), at $t=2t_{\\text{rev}}$ **${v.fix(Send, 2)}**\nerror ${kick === 0 ? 'only rounding ($\\sim10^{-16}$)' : 'of relative size $' + v.sci(kick, 1) + '$'}: the particles end $${v.sci(dend, 2)}$ from where they started ${dend < 0.05 ? '— the block has reassembled' : dend < 1 ? '— partly reassembled' : '— the memory of the reversal is gone'}; crude estimate of the growth rate of errors $\\lambda\\approx${v.fix(Math.log(Math.max(dend / Math.max(kick, 1e-16), 1)) / (2 * trev), 1)}$ per unit time`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.14
    {
      num: '5.14', kind: 'Paradox', name: 'Zermelo’s recurrence paradox',
      statement: String.raw`By Poincaré's recurrence theorem (mech-13.1), a bounded, isolated mechanical system returns, after a finite time, arbitrarily close to its initial microstate. So a gas that starts in the left half of a box must come back to it, and the entropy cannot increase forever. Zermelo (1896) used this against Boltzmann's derivation of irreversibility. Boltzmann's reply is quantitative: the recurrence time of a macroscopically distinguished state grows like $e^{\Delta S/k}$ times a microscopic time, which for $N\sim10^{23}$ is vastly longer than the age of the universe, so recurrences are real but never observed; for a few particles they are seen all the time.`,
      idea: String.raw`If a system visits its states with probability proportional to their weight (5.5), it visits a macrostate of probability $p$ about once per $\tau/p$, where $\tau$ is the time to produce a fresh configuration. For $N$ independent molecules, "all in the left half" has $p=2^{-N}$, so the recurrence time is $2^N\tau$: exponential in $N$. Recurrence therefore does not conflict with the second law as a statement about observable time scales (5.7); it conflicts only with a claim of absolute, eternal monotonic increase, which nobody can derive from the dynamics (5.13).`,
      caption: String.raw`**Choose the number of molecules $N$ in the box** and the time $\tau$ to produce a new configuration. Left: the number of molecules in the left half over time for $N$ independent particles bouncing at different speeds — it fluctuates around $N/2$. Middle: the waiting times between visits to "all on the left" from a long run, with their mean compared with $2^N$ samples. Right: the predicted recurrence time $2^N\tau$ against $N$, with the age of the universe marked: with $\tau=10^{-12}$ s it is crossed near $N\approx100$.`,
      deps: ['thermo-5.7', 'mech-13.1'], refs: ['Kardar §3.5'], tags: ['recurrence', 'irreversibility'],
      credit: 'H. Poincaré, 1890 (recurrence theorem); E. Zermelo, 1896 (Annalen der Physik 57, 485–494); L. Boltzmann, 1896 (Annalen der Physik 57, 773–784)',
      scope: String.raw`The simulation uses non-interacting particles with distinct speeds in a one-dimensional box, whose configurations at well-separated sampling times behave as independent draws; real gases mix more efficiently, which only makes recurrences rarer.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Poincar%C3%A9_recurrence_theorem' },
      viz(v) {
        const Ns = v.slider('molecules $N$', 2, 14, 8, { int: true });
        const tau = v.slider('time per fresh configuration $\\tau$ (s)', -15, 0, -12, { step: 0.5, fmt: (x) => '1e' + v.fix(x, 1) });
        const sa = v.stage({ x: [0, 300], y: [0, 15], axes: 'box', gutter: true, height: 280, weight: 1.2, xlabel: 'sample number', ylabel: 'molecules in the left half', title: 'the left half of the box' });
        const sb = v.stage({ x: [0, 5], y: [0, 1], axes: 'box', gutter: true, height: 280, weight: 1, minWidth: 240, xlabel: 'waiting time / $2^N$ samples', ylabel: 'frequency', title: 'time between returns to “all left”' });
        const sc = v.stage({ x: [1, 160], y: [-14, 40], axes: 'box', gutter: true, height: 280, weight: 1, minWidth: 240, xlabel: 'molecules $N$', ylabel: '$\\log_{10}$ (recurrence time in s)', title: 'recurrence time $2^N\\tau$' });
        const AGE = 13.8e9 * 3.156e7;   // 13.8 Gyr in s
        const cache = new Map();
        function sim(N) {
          if (cache.has(N)) return cache.get(N);
          const r = v.rng(70 + N), x0 = Array.from({ length: N }, () => r()), sp = Array.from({ length: N }, () => 0.6 + 0.8 * r());
          const dt = 0.37, M = N <= 12 ? 1500000 : 3000000, n = new Uint8Array(Math.min(M, 600));
          let last = -1, waits = [], count = 0;
          for (let k = 0; k < M; k++) {
            let c = 0;
            for (let i = 0; i < N; i++) { const u = (x0[i] + sp[i] * dt * k) % 2, p = u < 1 ? u : 2 - u; if (p < 0.5) c++; }
            if (k < n.length) n[k] = c;
            if (c === N) { if (last >= 0) waits.push(k - last); last = k; count++; }
          }
          const out = { n, waits, count, M }; cache.set(N, out); return out;
        }
        let st = null;
        v.render(() => {
          const N = Ns.value, o = sim(N), pred = 2 ** N;
          sa.setView([0, 300], [0, N + 0.5]);
          sa.path(Array.from(o.n.slice(0, 300), (c, k) => [k, c]), { color: 'accent', width: 1.4 });
          sa.hline(N / 2, { color: 'green', width: 1.2, dash: true }); sa.hline(N, { color: 'red', width: 1, dash: true });
          const mean = o.waits.length ? o.waits.reduce((a, b) => a + b, 0) / o.waits.length : NaN;
          const bins = 20, cnt = new Array(bins).fill(0); o.waits.forEach((w) => { const b = Math.floor(w / pred / 5 * bins); if (b < bins) cnt[b]++; });
          const tot = o.waits.length || 1;
          sb.setView([0, 5], [0, Math.max(1.05, Math.max(...cnt.map((c) => c / tot * bins / 5)) * 1.15)]);
          sb.bars(cnt.map((c) => c / tot * bins / 5), { x0: 0.125, dx: 0.25, color: 'accent' });
          sb.fn((x) => Math.exp(-x), { domain: [0, 5], color: 'orange', width: 2.2, n: 100 });
          sb.vline(1, { color: 'green', width: 1.2, dash: true });
          const lt = tau.value;
          sc.fn((x) => x * Math.log10(2) + lt, { color: 'orange', width: 2.4, n: 100 });
          sc.hline(Math.log10(AGE), { color: 'red', width: 1.4, dash: true });
          sc.text('age of the universe', 20, Math.log10(AGE), { dy: -9, size: 11, color: 'red', align: 'left' });
          sc.dot(N, N * Math.log10(2) + lt, { r: 6, color: 'gold' });
          const Nstar = (Math.log10(AGE) - lt) / Math.log10(2);
          sc.vline(Nstar, { color: 'green', width: 1, dash: true });
          st = { N, pred, mean, count: o.count, M: o.M, Nstar, lt };
        });
        v.legend([['orange', 'prediction ($e^{-x}$; $2^N\\tau$)'], ['green', '$N/2$; mean wait; crossing point', { dash: true }], ['red', 'all left; age of the universe', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { N, pred, mean, count, M, Nstar, lt } = st;
          return `$N=${N}$: probability of “all left” $2^{-N}=${v.sci(1 / pred, 2)}$ → predicted mean wait $2^N=${pred}$ samples; **simulated: ${isFinite(mean) ? v.fix(mean, 0) : '—'}** from ${count} visits in ${M.toLocaleString('en-US')} samples\nwith $\\tau=10^{${v.fix(lt, 1)}}$ s the recurrence time $2^N\\tau$ is **${sup10(N * Math.log10(2) + lt)} s** here; it exceeds the age of the universe ($${v.sci(AGE, 2)}$ s) beyond $N\\approx${v.fix(Nstar, 0)}$ molecules; for a mole it is $10^{(1.8\\times10^{23})}$ times $\\tau$`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.15
    {
      num: '5.15', kind: 'Model', name: 'Ehrenfest urn model',
      statement: String.raw`$N$ numbered balls are distributed between two urns. At each step a ball is chosen uniformly at random and moved to the other urn. If $k$ balls are in urn A, the chain on $\{0,\dots,N\}$ jumps $k\to k-1$ with probability $k/N$ and $k\to k+1$ with probability $(N-k)/N$. Its stationary distribution is binomial, $\pi_k=\binom Nk2^{-N}$, and the mean of $k$ relaxes geometrically, $\mathbb E[k_t]-\tfrac N2=(k_0-\tfrac N2)(1-\tfrac2N)^t$. Starting from any $k_0$ the system relaxes to the neighbourhood of $N/2$, fluctuates around it with standard deviation $\tfrac12\sqrt N$, and by recurrence theory returns to the extreme state $k=0$ with mean recurrence time $1/\pi_0=2^N$ steps.`,
      idea: String.raw`The model is a stochastic caricature of a gas relaxing between two halves of a box: the drift $(N/2-k)\cdot2/N$ toward the middle is the "$H$-theorem" behaviour, while the fully reversible random fluctuations make every state recur (stoch-1.11 treats it as a random walk on the hypercube). Because the chain is irreversible-looking only in how it is prepared, the mean time between visits to a state equals the reciprocal of its stationary probability (Kac's lemma for finite irreducible chains), so rare states recur rarely but surely: this is the quantitative answer to Zermelo (5.14) and the concrete counterpart of Loschmidt's rewind (5.13).`,
      caption: String.raw`**Press play** to run the chain: the bars show the number of balls in each urn over time, with the exact mean $N/2+(k_0-N/2)(1-2/N)^t$. The right-hand panel counts how many steps pass between visits to $k=0$ in simulations for $N=2,\dots,12$ and compares the average with $2^N$. Slide $N$ and the starting imbalance; watch the trace relax and then fluctuate with $\sigma=\sqrt N/2$.`,
      deps: ['thermo-5.7', 'thermo-5.14', 'stoch-1.11'], refs: ['Kardar §3.5'], tags: ['Ehrenfest', 'recurrence'],
      credit: 'P. and T. Ehrenfest, 1907 (Physikalische Zeitschrift 8, 311–314)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ehrenfest_model' },
      viz(v) {
        const Ns = v.slider('balls $N$', 4, 200, 60, { int: true, onChange: () => S.reset() });
        const k0s = v.slider('initially in urn A (fraction)', 0, 1, 1, { step: 0.05, fmt: (x) => v.fix(x, 2), onChange: () => S.reset() });
        const rate = v.slider('steps per second', 20, 5000, 400, { log: true, sig: 2 });
        const S = v.sim(() => { const N = Ns.value, k = Math.round(k0s.value * N); return { k, t: 0, r: v.rng(33), ser: [k], hist: new Array(N + 1).fill(0), N, k0: k }; }, (st) => {
          const m = Math.max(1, Math.round(rate.value / 30)), { N, r } = st;
          for (let i = 0; i < m; i++) { if (r() < st.k / N) st.k--; else st.k++; st.t++; if (st.t > 80) st.hist[st.k]++; }
          st.ser.push(st.k); if (st.ser.length > 3000) { st.ser = st.ser.filter((_, i) => i % 2 === 0); }
          return st;
        }, { dt: 1 / 30, maxSteps: 4000 });
        // mean recurrence time of the empty urn for small N (exact chain, simulated once)
        const rec = (() => { const out = []; for (let N = 2; N <= 12; N++) { const r = v.rng(500 + N); let k = 0, gap = 0, sum = 0, c = 0; const total = Math.min(3e6, 400 * 2 ** N); for (let t = 0; t < total; t++) { if (r() < k / N) k--; else k++; gap++; if (k === 0) { sum += gap; c++; gap = 0; } } out.push([N, c ? sum / c : NaN, c]); } return out; })();
        const sa = v.stage({ x: [0, 400], y: [0, 60], axes: 'box', gutter: true, height: 270, weight: 1.3, xlabel: 'step', ylabel: 'balls in urn A', title: 'the urn contents' });
        const sb = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 270, weight: 0.9, minWidth: 230, xlabel: 'balls in urn A', ylabel: 'time fraction', title: 'occupation after relaxation' });
        const sc = v.stage({ x: [1.5, 12.5], y: [1, 1e4], ylog: true, axes: 'box', gutter: true, height: 270, weight: 0.9, minWidth: 230, xlabel: 'balls $N$', ylabel: 'mean return time (steps)', title: 'mean recurrence time' });
        let info = null;
        v.animate((t) => {
          S.advance(t);
          const st = S.state, N = st.N, ser = st.ser, n = ser.length, stride = st.t / n;
          sa.setView([0, Math.max(300, st.t)], [0, N]);
          sa.path(ser.map((k, i) => [i * stride, k]), { color: 'accent', width: 1.5 });
          sa.fn((x) => N / 2 + (st.k0 - N / 2) * Math.pow(1 - 2 / N, x), { color: 'orange', width: 2.2, domain: [0, Math.max(300, st.t)], n: 200 });
          sa.hline(N / 2, { color: 'green', width: 1, dash: true });
          const tot = st.hist.reduce((a, b) => a + b, 0) || 1;
          sb.setView([-0.5, N + 0.5], [0, Math.max(...st.hist.map((h) => h / tot), ...Array.from({ length: N + 1 }, (_, k) => Math.exp(lnBin(N, k) - N * Math.LN2))) * 1.2]);
          sb.bars(st.hist.map((h) => h / tot), { x0: 0, dx: 1, color: 'accent' });
          sb.path(Array.from({ length: N + 1 }, (_, k) => [k, Math.exp(lnBin(N, k) - N * Math.LN2)]), { color: 'orange', width: 2.2 });
          sc.fn((x) => 2 ** x, { color: 'orange', width: 2.2, n: 100 });
          sc.dots(rec.map((p) => [p[0], p[1]]), { r: 4.5, color: 'accent' });
          if (N <= 12) sc.dot(N, 2 ** N, { r: 7, color: 'gold', hollow: true });
          const m = st.hist.reduce((a, b, k) => a + b * k, 0) / tot, s = Math.sqrt(st.hist.reduce((a, b, k) => a + b * (k - m) ** 2, 0) / tot);
          info = { N, t: st.t, k: st.k, m, s, tot };
        }, { still: 8, period: 40 });
        v.legend([['accent', 'simulation'], ['orange', 'exact: mean relaxation, binomial, $2^N$']]);
        v.readout(() => {
          if (!info) return '';
          const { N, t, k, m, s, tot } = info;
          return `step ${t}: ${k} balls in A, ${N - k} in B · after the first 80 steps the occupancy has mean ${tot > 1 ? v.fix(m, 1) : '—'} and standard deviation ${tot > 1 ? v.fix(s, 2) : '—'} (theory $N/2=${v.fix(N / 2, 1)}$, $\\sqrt N/2=${v.fix(Math.sqrt(N) / 2, 2)}$)\nmean return time to $k=0$: ${rec.map((p) => `$N=${p[0]}$: ${v.fix(p[1], 0)} vs ${2 ** p[0]}`).filter((_, i) => i % 3 === 0).join(' · ')} (simulated vs $2^N$); a gas of $10^{23}$ molecules would need $2^{10^{23}}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.16
    {
      num: '5.16', kind: 'Paradox', name: 'Maxwell’s demon',
      statement: String.raw`Maxwell (1867) imagined a small being at a trapdoor between two chambers of gas at equal temperature that opens only for fast molecules coming from the right and slow ones coming from the left. Without any work, the left chamber would get hotter and the right colder, decreasing the total entropy and apparently violating the second law. The paradox is resolved by treating the demon as a physical system that must acquire and store information about each molecule: its memory fills up, and since a finite memory must eventually be erased, the entropy (at least $k\ln2$ per bit, 5.17) dumped into the environment by erasure more than compensates the entropy decrease of the gas. A demon that only measures and discards the result gives no net benefit: the second law holds for demon plus gas plus memory.`,
      idea: String.raw`The gas entropy decrease is a macroscopic bookkeeping quantity, $S=\sum_i N_k[\ln(V_i/N_i)+\ln T_i+\text{const}]$ for an ideal gas in two dimensions; the demon's decisions each record one bit about a molecule. Szilard (1929) first identified the measurement as the cost; Landauer's principle (5.17) and Bennett's analysis (1982) show that measurement can be done reversibly in principle, and that the unavoidable cost is the *erasure* of the stored bits. The ledger below makes the accounting explicit: the gas gains order, the memory's entropy rises by $\ln2$ per decision, and erasing it moves that entropy to the bath.`,
      caption: String.raw`**Press play** with the demon active: it records one bit for every molecule that arrives at the door and lets fast ones pass right-to-left and slow ones left-to-right. The middle panel follows the two temperatures. The right panel is the entropy ledger in units of $k$: the gas entropy change (small and negative), the demon's memory ($+\ln2$ per bit), and — after *Erase memory* — the heat sent to the surroundings. The total is never negative. Switch the demon off and the door simply stays open: the temperatures remain equal.`,
      deps: ['thermo-5.7'], refs: ['Tong §2.2.3, Eq. (2.13)', 'NIST Chemistry WebBook: noble-gas CODATA entropy reviews'], tags: ['demon', 'information'],
      credit: 'J. C. Maxwell, 1867 (letter to P. G. Tait, 11 December); the name “demon”: W. Thomson, 1874 (Nature 9, 441); C. H. Bennett, 1982 (Int. J. Theor. Phys. 21, 905)',
      scope: String.raw`A two-dimensional ideal gas of 200 non-interacting molecules and a demon that records one bit (fast or slow) per arrival; the entropy of the gas is evaluated from its instantaneous $N_i$ and $T_i$ (kinetic temperatures).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Maxwell%27s_demon' },
      viz(v) {
        const on = v.toggle('demon active', true);
        const speed = v.slider('simulated time per second', 1, 30, 8, { log: true, sig: 2 });
        const Np = 200, dt = 0.004, w = 0.17, vth = Math.sqrt(2 * Math.LN2);
        let eraseNow = 0;
        v.button('Erase memory', () => { eraseNow = 1; });
        const S = v.sim(() => {
          const r = v.rng(5), x = new Float64Array(Np), y = new Float64Array(Np), vx = new Float64Array(Np), vy = new Float64Array(Np);
          for (let i = 0; i < Np; i++) { x[i] = (i % 2 ? 0.5 : 0) + 0.5 * r(); y[i] = r(); vx[i] = r.normal(); vy[i] = r.normal(); }
          return { x, y, vx, vy, t: 0, bits: 0, erased: 0, ser: [[0, 1, 1]], r, Tl: 1, Tr: 1, nl: Np / 2, dSg: 0 };
        }, (st) => {
          const { x, y, vx, vy } = st, n = Math.round(1 / 30 / dt * speed.value / 1);
          for (let k = 0; k < n; k++) {
            for (let i = 0; i < Np; i++) {
              const xo = x[i], yo = y[i]; let xn = xo + vx[i] * dt, yn = yo + vy[i] * dt;
              if (yn < 0) { yn = -yn; vy[i] = -vy[i]; } else if (yn > 1) { yn = 2 - yn; vy[i] = -vy[i]; }
              if (xn < 0) { xn = -xn; vx[i] = -vx[i]; } else if (xn > 1) { xn = 2 - xn; vx[i] = -vx[i]; }
              if ((xo < 0.5) !== (xn < 0.5)) {
                const inDoor = Math.abs(yn - 0.5) < w / 2;
                let pass = false;
                if (inDoor) {
                  if (!on.value) pass = true;
                  else { const sp = Math.hypot(vx[i], vy[i]); st.bits++; pass = vx[i] < 0 ? sp > vth : sp < vth; }
                }
                if (!pass) { xn = 1 - xn; vx[i] = -vx[i]; }
              }
              x[i] = xn; y[i] = yn;
            }
            st.t += dt;
          }
          if (eraseNow) { st.erased = st.bits; eraseNow = 0; }
          // temperatures
          let nl = 0, nr = 0, el = 0, er = 0;
          for (let i = 0; i < Np; i++) { const e = (vx[i] ** 2 + vy[i] ** 2) / 2; if (x[i] < 0.5) { nl++; el += e; } else { nr++; er += e; } }
          const Tl = el / nl, Tr = er / nr;
          const Sg = nl * (Math.log(0.5 / nl) + Math.log(Tl)) + nr * (Math.log(0.5 / nr) + Math.log(Tr));
          if (st.S0 === undefined) st.S0 = Sg;
          st.ser.push([st.t, Tl, Tr]); if (st.ser.length > 2500) st.ser = st.ser.filter((_, i) => i % 2 === 0);
          st.Tl = Tl; st.Tr = Tr; st.nl = nl; st.dSg = Sg - st.S0;
          return st;
        }, { dt: 1 / 30, maxSteps: 4000 });
        const rampc = tRamp(v);
        const sa = v.stage({ x: [-0.05, 1.05], y: [-0.05, 1.12], equal: true, axes: false, height: 290, weight: 0.8, minWidth: 230, title: 'the two chambers' });
        const sb = v.stage({ x: [0, 100], y: [0.3, 1.8], axes: 'box', gutter: true, height: 290, weight: 1, minWidth: 230, xlabel: 'time', ylabel: 'temperature (kinetic)', title: 'temperatures' });
        const sc = v.stage({ x: [0.4, 4.6], y: [-5, 20], axes: 'box', gutter: true, height: 290, weight: 1, minWidth: 230, ylabel: 'entropy change / $k$', xticks: [[1, 'gas'], [2, 'memory'], [3, 'erasure'], [4, 'total']], title: 'entropy ledger' });
        let info = null;
        v.animate((t) => {
          S.advance(t);
          const st = S.state, { x, y, vx, vy } = st;
          sa.rect(0, 0, 1, 1, { color: 'ink', width: 2.2 });
          sa.line(0.5, 0, 0.5, 0.5 - w / 2, { color: 'ink', width: 3.5 }); sa.line(0.5, 0.5 + w / 2, 0.5, 1, { color: 'ink', width: 3.5 });
          sa.text(on.value ? 'demon at the door' : 'door open', 0.5, 1.045, { size: 11, color: on.value ? 'gold' : 'muted', align: 'center', weight: 700 });
          for (let i = 0; i < Np; i++) sa.dot(x[i], y[i], { r: 2.8, color: pick(rampc, clamp((Math.hypot(vx[i], vy[i]) - 0.3) / 2.2, 0, 1)), ring: false });
          const tm = st.t;
          sb.setView([0, Math.max(40, tm)], [0.3, 1.8]);
          sb.path(st.ser.map((p) => [p[0], p[1]]), { color: 'red', width: 2 }); sb.path(st.ser.map((p) => [p[0], p[2]]), { color: 'blue', width: 2 });
          sb.hline(1, { color: 'faint', width: 1, dash: true });
          const memo = (st.bits - st.erased) * Math.LN2, env = st.erased * Math.LN2, tot = st.dSg + memo + env;
          const top = Math.max(5, memo, env, tot) * 1.15;
          sc.setView([0.4, 4.6], [Math.min(-4, st.dSg * 1.4 - 0.12 * top), top]);
          [[1, st.dSg, 'blue'], [2, memo, 'orange'], [3, env, 'purple'], [4, tot, 'green']].forEach(([i, val, c]) => { sc.rect(i - 0.33, 0, i + 0.33, val, { fill: c, fillAlpha: 0.6, color: c, width: 1.2 }); sc.text(v.fix(val, 1), i, val, { dy: val >= 0 ? -9 : 12, size: 11, align: 'center', color: 'ink' }); });
          sc.hline(0, { color: 'ink', width: 1 });
          info = { t: st.t, bits: st.bits, erased: st.erased, Tl: st.Tl, Tr: st.Tr, nl: st.nl, dSg: st.dSg, tot };
        }, { still: 5, period: 60 });
        v.legend([['red', 'left chamber'], ['blue', 'right chamber']]);
        v.readout(() => {
          if (!info) return '';
          const { t, bits, erased, Tl, Tr, nl, dSg, tot } = info;
          return `$t=${v.fix(t, 1)}$: left $T=${v.fix(Tl, 3)}$ (${nl} molecules), right $T=${v.fix(Tr, 3)}$ · bits recorded **${bits}**, erased ${erased}\ngas entropy change $${v.fix(dSg, 2)}\\,k$ · memory $+${v.fix((bits - erased) * Math.LN2, 1)}\\,k$ · erasure heat $\\ge+${v.fix(erased * Math.LN2, 1)}\\,k$ → total **$${v.fix(tot, 1)}\\,k$** ${tot >= 0 ? '(≥ 0: the second law holds)' : ''}${bits === 0 && on.value ? ' (nothing yet)' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.17
    {
      num: '5.17', kind: 'Principle', name: 'Landauer’s principle',
      statement: String.raw`Erasing one bit of information — resetting a memory that may hold 0 or 1 to a standard value — in an environment at temperature $T$ necessarily dissipates heat $Q\ge kT\ln2$ into that environment, i.e. increases the entropy of the surroundings by at least $k\ln2$. More generally, any logically irreversible operation that reduces the entropy of the memory by $\Delta S$ releases at least $T\,|\Delta S|$. The bound can be approached by quasi-static (slow) protocols and is exceeded by finite-time ones. At $T=300$ K, $kT\ln2=2.87\times10^{-21}$ J $=0.0179$ eV.`,
      idea: String.raw`Erasure maps two logical states onto one, so the system's phase-space volume available to the memory shrinks by half and its entropy decreases by $k\ln2$ (5.6). Since the combined system plus bath cannot lose entropy (5.7), at least $k\ln2$ must go to the bath, as heat $T\Delta S$ (the second law, 2.10). For a particle in a double well (a model of a memory) erased by lowering the barrier, tilting the wells and raising the barrier again, the average work done on the particle equals the heat released, since the energy returns to its original value; this work exceeds $kT\ln2$ by the dissipation of the finite-speed protocol.`,
      caption: String.raw`**Choose the protocol duration $\tau$** (in units of the time a particle takes to diffuse across a well) and press play. The memory is a particle in a double well $V=\tfrac14ax^4-\tfrac12m(t)x^2+f(t)x$ with a barrier of $8\,kT$: the barrier is lowered, the wells tilted toward the left, the barrier restored, the tilt removed. The distribution $p(x)$ is evolved by the Fokker–Planck equation, so the work $W=\int\langle\partial_tV\rangle dt$ is exact. Right: the heat released against $\tau$, with the bound $kT\,|\Delta S|$ (green) from the entropy actually removed and $kT\ln2$ (orange).`,
      deps: ['thermo-5.16', 'thermo-5.6', 'info-1.2'], refs: ['Kardar §2.7'], tags: ['information', 'erasure'],
      credit: 'R. Landauer, 1961 (IBM J. Res. Dev. 5, 183–191); experimental test with a colloidal particle in a double well: A. Bérut et al., 2012 (Nature 483, 187)',
      scope: String.raw`Overdamped Brownian particle at fixed temperature; heat is $kT$ per unit of entropy only for the bath at $T$. The same bound applies to any physical implementation of the bit.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Landauer%27s_principle' },
      viz(v) {
        const A = 4, MM = Math.sqrt(32 * A), FT = 4.5, Lx = 3, dx = 0.1, dt = 1e-3, n = Math.round(2 * Lx / dx) + 1;
        const xs = Float64Array.from({ length: n }, (_, i) => -Lx + i * dx);
        const sm = (u) => u * u * (3 - 2 * u);
        const proto = (s) => { const seg = (s0, s1, a, b) => (s <= s0 ? a : s >= s1 ? b : a + (b - a) * sm((s - s0) / (s1 - s0))); return { m: s < 0.5 ? seg(0, 0.25, MM, 0) : seg(0.5, 0.75, 0, MM), f: s < 0.5 ? seg(0.25, 0.5, 0, FT) : seg(0.75, 1, FT, 0) }; };
        const Vx = (x, m, f) => A * x ** 4 / 4 - m * x * x / 2 + f * x;
        const bern = (z) => (Math.abs(z) < 1e-8 ? 1 : z / Math.expm1(z));
        const ent = (p) => { let s = 0; for (let i = 0; i < n; i++) if (p[i] > 1e-300) s -= p[i] * Math.log(p[i]) * dx; return s; };
        function fp(tau, keep) {
          let p = new Float64Array(n), q = new Float64Array(n); const { m: m0, f: f0 } = proto(0); let Z = 0;
          for (let i = 0; i < n; i++) { p[i] = Math.exp(-Vx(xs[i], m0, f0)); Z += p[i] * dx; } for (let i = 0; i < n; i++) p[i] /= Z;
          const S0 = ent(p); let U0 = 0; for (let i = 0; i < n; i++) U0 += p[i] * Vx(xs[i], m0, f0) * dx;
          const ns = Math.max(10, Math.round(tau / dt)), every = Math.max(1, Math.floor(ns / 140)), frames = [], Wser = [];
          let W = 0, mp = m0, fp0 = f0; const bp = new Float64Array(n - 1), bm = new Float64Array(n - 1);
          for (let k = 1; k <= ns; k++) {
            const s = k / ns, { m, f } = proto(s);
            let dW = 0; for (let i = 0; i < n; i++) dW += p[i] * (-(m - mp) * xs[i] * xs[i] / 2 + (f - fp0) * xs[i]) * dx;
            W += dW; mp = m; fp0 = f;
            if (k % 8 === 1) for (let i = 0; i < n - 1; i++) { const d = Vx(xs[i + 1], m, f) - Vx(xs[i], m, f); bp[i] = bern(d); bm[i] = bern(-d); }
            q.fill(0);
            for (let i = 0; i < n - 1; i++) { const J = (bp[i] * p[i] - bm[i] * p[i + 1]) / dx * dt / dx; q[i] -= J; q[i + 1] += J; }
            for (let i = 0; i < n; i++) p[i] += q[i];
            if (keep && (k % every === 0 || k === ns)) { frames.push({ s, p: Float64Array.from(p), m, f }); Wser.push([s, W]); }
          }
          const { m, f } = proto(1); let U1 = 0, pr = 0; for (let i = 0; i < n; i++) { U1 += p[i] * Vx(xs[i], m, f) * dx; if (xs[i] > 0) pr += p[i] * dx; }
          return { W, Q: W - (U1 - U0), dS: ent(p) - S0, pr, frames, Wser };
        }
        const curve = [3, 5, 8, 12, 20, 32, 50, 80, 128].map((t) => { const r = fp(t, false); return [t, r.Q, -r.dS]; });
        const tau = v.slider('protocol duration $\\tau$', 3, 128, 20, { log: true, sig: 2, fmt: (x) => v.fix(x, 0) });
        let run = null, rk = 0;
        const sa = v.stage({ x: [-3, 3], y: [-10, 24], axes: 'box', gutter: true, height: 260, weight: 1, minWidth: 230, xlabel: 'position $x$', ylabel: '$V/kT$', title: 'the memory: potential' });
        const sp = v.stage({ x: [-3, 3], y: [0, 1.4], axes: 'box', gutter: true, height: 260, weight: 1, minWidth: 230, xlabel: 'position $x$', ylabel: '$p(x)$', title: 'its probability density' });
        const sw = v.stage({ x: [0, 1], y: [-1, 3], axes: 'box', gutter: true, height: 260, weight: 1, minWidth: 230, xlabel: 'protocol time $t/\\tau$', ylabel: '$W/kT$', title: 'work done on the particle' });
        const sq = v.stage({ x: [2, 160], y: [0, 6], xlog: true, axes: 'box', gutter: true, height: 260, weight: 1, minWidth: 230, xlabel: 'duration $\\tau$', ylabel: '$Q/kT$', title: 'heat released vs duration' });
        let info = null;
        v.animate((t) => {
          if (!run || rk !== tau.value) { rk = tau.value; run = fp(tau.value, true); }
          const ph = clamp(((t % 14) / 14) * 1.15, 0, 1), fr = run.frames[Math.min(run.frames.length - 1, Math.floor(ph * (run.frames.length - 1)))];
          sa.fn((x) => Vx(x, fr.m, fr.f), { color: 'ink', width: 2.4, n: 200 }); sa.hline(0, { color: 'faint', width: 1, dash: true });
          const pm = Math.max(...fr.p);
          sp.setView([-3, 3], [0, Math.max(1.4, pm * 1.25)]);
          sp.path(Array.from(xs, (x, i) => [x, fr.p[i]]), { color: 'accent', width: 2.2 });
          let pl = 0; for (let i = 0; i < n; i++) if (xs[i] < 0) pl += fr.p[i] * dx;
          sp.text(`left ${v.fix(100 * pl, 1)} %`, -1.6, Math.max(1.4, pm * 1.25) * 0.92, { size: 11.5, color: 'accent', align: 'center', plate: true }); sp.text(`right ${v.fix(100 * (1 - pl), 1)} %`, 1.6, Math.max(1.4, pm * 1.25) * 0.92, { size: 11.5, color: 'accent', align: 'center', plate: true });
          const wv = run.Wser.map((q) => q[1]), wlo = Math.min(0, ...wv), whi = Math.max(1, ...wv);
          sw.setView([0, 1], [wlo - 0.1 * (whi - wlo), whi + 0.1 * (whi - wlo)]);
          sw.path(run.Wser, { color: 'accent', width: 2.2 }); sw.hline(Math.LN2, { color: 'orange', width: 1.5, dash: true });
          sw.vline(fr.s, { color: 'gold', width: 1.4 });
          sq.setView([2, 160], [0, Math.max(...curve.map((c) => c[1])) * 1.1]);
          sq.path(curve.map((c) => [c[0], c[1]]), { color: 'accent', width: 2.4 }); sq.dots(curve.map((c) => [c[0], c[1]]), { r: 3.5, color: 'accent' });
          sq.path(curve.map((c) => [c[0], c[2]]), { color: 'green', width: 1.8, dash: true }); sq.hline(Math.LN2, { color: 'orange', width: 1.5, dash: true });
          sq.dot(tau.value, run.Q, { r: 6, color: 'gold' });
          info = { Q: run.Q, W: run.W, dS: run.dS, pr: run.pr, s: fr.s };
        }, { still: 10, period: 14 });
        v.legend([['accent', 'simulation (Fokker–Planck)'], ['green', '$kT|\\Delta S|$ bound', { dash: true }], ['orange', '$kT\\ln2$', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { Q, W, dS, pr } = info;
          return `$\\tau=${v.fix(tau.value, 0)}$: work $W=${v.fix(W, 3)}\\,kT$ = heat released $Q=${v.fix(Q, 3)}\\,kT$ (the potential is the same at start and end up to a small internal-energy change) · entropy removed from the memory $|\\Delta S|=${v.fix(-dS, 3)}\\,k$ (erasure failed with probability ${v.fix(100 * pr, 2)} % → less than $\\ln2=${v.fix(Math.LN2, 3)}$)\n$Q/kT-|\\Delta S|/k=${v.fix(Q + dS, 3)}\\ge0$ ✓ · at 300 K: $kT\\ln2=${v.fix(KB * 300 * Math.LN2 * 1e21, 3)}\\times10^{-21}$ J = ${v.fix(KB * 300 * Math.LN2 / 1.602176634e-19, 4)} eV`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.18
    {
      num: '5.18', kind: 'Model', name: 'Szilard engine',
      statement: String.raw`A single molecule in a box in contact with a heat bath at $T$ is the working substance of Szilard's engine. A partition is inserted in the middle, trapping the molecule on one side; an observer determines which side (one bit of information); a piston is then coupled to the partition so that the molecule's pressure $P=kT/V_{\text{side}}$ pushes it out to the empty side isothermally, extracting work $W=kT\ln2$ per cycle, drawn from the bath as heat. The cycle appears to turn heat into work with a single reservoir. It does not, because the measurement record must be reset to make the cycle repeatable, which by Landauer's principle (5.17) costs at least $kT\ln2$ of work: the net work is at most zero. If the observer does not measure and couples the load blindly, the average work is zero.`,
      idea: String.raw`Isothermal expansion of one molecule from $V/2$ to $V$ is an ideal-gas isotherm (1.16): $W=\int P\,dV=kT\ln2$, and the heat absorbed is the same, so the entropy of the gas rises by $k\ln2$, exactly the information gained. Szilard (1929) argued that the measurement must produce at least this much entropy; Landauer and Bennett later located the cost in the erasure of the memory rather than the measurement. The ledger at the end of every cycle is therefore: gas $+k\ln2$ (heat in), memory $-k\ln2$ upon reset, bath $+k\ln2$ (heat out), work: $+kT\ln2$ out, $kT\ln2$ in.`,
      caption: String.raw`**Press play** to watch the cycle (free molecule, partition inserted, measurement, isothermal expansion, reset). The middle panel is the $P$–$V$ diagram of the one-molecule gas with the extracted work as the shaded area under $P=kT/V$. The right panel runs 40 cycles at once: the engine's gross work grows as $kT\ln2$ per cycle; once the erasure cost of the memory is charged the net work stays at zero; a blind engine, which cannot tell which side holds the molecule, makes a random walk around zero.`,
      deps: ['thermo-5.17', 'thermo-1.16'], refs: ['Kardar §2.7'], tags: ['Szilard', 'information'],
      credit: 'L. Szilard, 1929 (Zeitschrift für Physik 53, 840–856)',
      scope: String.raw`A single molecule in thermal contact with a bath, with ideal reversible (quasi-static) operation of the piston.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Szilard_engine' },
      viz(v) {
        const showErase = v.toggle('charge the erasure cost in the plot', true);
        const PER = 12, sm = (u) => u * u * (3 - 2 * u);
        const tri = (u) => { const w = ((u % 2) + 2) % 2; return w < 1 ? w : 2 - w; };
        const cyc = (c) => { const r = v.rng(900 + c), x0 = r(), sp = 1.6 + r() * 1.4, y0 = r(), spy = 1.1 + r() * 1.3; return { x0, sp, y0, spy, side: tri(x0 + sp * 2.3) < 0.5 ? 0 : 1 }; };
        const NC = 40;
        const hist = (() => { const g = [0], n = [0], b = [0]; let G = 0, B = 0; for (let c = 0; c < NC; c++) { const side = cyc(c).side; G += Math.LN2; B += side === 0 ? Math.LN2 : -Math.LN2; g.push(G); n.push(0); b.push(B); } return { g, n, b }; })();
        let cycle = 0, lastT = -1;
        const sa = v.stage({ x: [-0.05, 1.45], y: [-0.55, 1.15], equal: true, axes: false, height: 280, weight: 1.1, minWidth: 260, title: 'one molecule' });
        const sb = v.stage({ x: [0.2, 1.1], y: [0, 4.2], axes: 'box', gutter: true, height: 280, weight: 0.9, minWidth: 230, xlabel: 'occupied volume / $V$', ylabel: '$P/(kT/V)$', title: 'the $P$–$V$ diagram' });
        const sc = v.stage({ x: [0, NC], y: [-6, 30], axes: 'box', gutter: true, height: 280, weight: 1, minWidth: 230, xlabel: 'cycles', ylabel: 'work extracted / $kT$', title: 'cumulative work' });
        let info = null;
        v.animate((t) => {
          if (lastT >= 0 && t < lastT - 1) cycle++;
          lastT = t;
          const c = cyc(cycle), ph = t % PER, { side } = c;
          // positions
          let x, y, xp = 0.5, part = false, Wd = 0, mem = '?', stage = 'free molecule';
          const lo = (s) => (s === 0 ? 0 : xp), hi = (s) => (s === 0 ? xp : 1);
          if (ph < 2) { x = tri(c.x0 + c.sp * ph); y = tri(c.y0 + c.spy * ph); }
          else if (ph < 3) { part = true; stage = 'partition inserted'; }
          else if (ph < 4) { part = true; stage = 'measure: which side?'; mem = side === 0 ? 'L' : 'R'; }
          else if (ph < 8) { part = true; stage = 'isothermal expansion: work out'; mem = side === 0 ? 'L' : 'R'; const u = sm((ph - 4) / 4); xp = side === 0 ? 0.5 + 0.5 * u : 0.5 - 0.5 * u; Wd = Math.log((side === 0 ? xp : 1 - xp) / 0.5); }
          else if (ph < 9) { stage = 'partition removed'; mem = side === 0 ? 'L' : 'R'; Wd = Math.LN2; xp = 0.5; }
          else if (ph < 11) { stage = 'reset the memory: heat kT ln2 to the bath'; mem = ph < 10 ? (side === 0 ? 'L' : 'R') : '0'; Wd = Math.LN2; }
          else { stage = 'ready'; mem = '?'; Wd = Math.LN2; }
          if (x === undefined) { // inside its side
            const u = ph - 2, wlo = side === 0 ? 0 : (ph >= 4 && ph < 8 ? xp : 0.5), whi = side === 0 ? (ph >= 4 && ph < 8 ? xp : 0.5) : 1;
            x = wlo + (whi - wlo) * tri(c.x0 + c.sp * 2 + c.sp * 1.3 * u); y = tri(c.y0 + c.spy * ph);
            if (ph >= 8) { x = tri(c.x0 + c.sp * ph); }
          }
          sa.rect(0, 0, 1, 1, { color: 'ink', width: 2.2 });
          if (part) sa.rect(xp - 0.012, 0, xp + 0.012, 1, { fill: 'orange', fillAlpha: 0.9, color: 'orange', width: 1.5 });
          if (ph >= 4 && ph < 8) sa.line(xp, 0.5, side === 0 ? 1.12 : -0.12, 0.5, { color: 'orange', width: 3 });
          sa.dot(x, y, { r: 7, color: 'gold' });
          sa.text(stage, 0.5, 1.09, { size: 12, color: 'ink', align: 'center', weight: 650 });
          // memory register and bath
          sa.rect(1.1, -0.1, 1.4, 0.25, { color: 'purple', width: 1.8, fill: 'purple', fillAlpha: 0.1 }); sa.text(mem, 1.25, 0.075, { size: 19, color: 'purple', align: 'center', weight: 700 }); sa.text('memory', 1.25, -0.2, { size: 10.5, color: 'purple', align: 'center' });
          sa.rect(0, -0.5, 1, -0.3, { fill: 'red', fillAlpha: 0.12, color: 'red', width: 1 }); sa.text('heat bath at $T$', 0.5, -0.4, { size: 11, color: 'red', align: 'center' });
          sa.rect(1.1, 0.5, 1.4, 0.5 + 0.45 * Wd / Math.LN2 * 0.9 + 0.001, { fill: 'green', fillAlpha: 0.6, color: 'green', width: 1 }); sa.text('work', 1.25, 0.43, { size: 10.5, color: 'green', align: 'center' });
          // PV
          sb.fn((u) => 1 / u, { domain: [0.2, 1.1], color: 'ink', width: 2, n: 150 });
          if (ph >= 4) { const wv = ph < 8 ? (side === 0 ? xp : 1 - xp) : 1; sb.fn((u) => 1 / u, { domain: [0.5, Math.max(0.5001, wv)], color: 'green', width: 2.4, fill: true, base: 0, n: 100 }); sb.dot(wv, 1 / wv, { r: 6, color: 'gold' }); } else sb.dot(0.5, 2, { r: 6, color: 'gold' });
          sb.text('$W=kT\\ln2$', 0.78, 0.55, { size: 12, color: 'green', align: 'center' });
          // cumulative
          sc.setView([0, NC], [-6, Math.max(30, hist.g[NC] * 1.05)]);
          sc.path(hist.g.map((g, i) => [i, g]), { color: 'green', width: 2.2 });
          sc.path(hist.g.map((g, i) => [i, showErase.value ? 0 : g - 0]), { color: 'accent', width: 2.4, alpha: showErase.value ? 1 : 0 });
          sc.path(hist.b.map((g, i) => [i, g]), { color: 'orange', width: 1.8 });
          sc.dot(Math.min(NC, cycle + (ph >= 8 ? 1 : 0)), hist.g[Math.min(NC, cycle + (ph >= 8 ? 1 : 0))], { r: 5, color: 'gold' });
          info = { ph, cycle, Wd, side, stage };
        }, { still: 5.5, period: PER });
        v.legend([['green', 'engine, measuring (gross)'], ['accent', 'after charging erasure'], ['orange', 'blind coupling']]);
        v.readout(() => {
          if (!info) return '';
          const { ph, cycle, Wd, side, stage } = info;
          return `cycle ${cycle + 1}, ${stage} · the molecule is on the ${side === 0 ? 'left' : 'right'} · work extracted so far this cycle $W=${v.fix(Wd, 3)}\\,kT$ ($kT\\ln2=${v.fix(Math.LN2, 3)}\\,kT$)\nover 40 cycles: gross $${v.fix(hist.g[40], 1)}\\,kT$ ($=40\\ln2$) · erasure cost $-${v.fix(hist.g[40], 1)}\\,kT$ · net **0** · the blind engine ends at $${v.fix(hist.b[40], 1)}\\,kT$ (a random walk of $\\pm\\ln2$ steps)`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.19
    {
      num: '5.19', kind: 'Paradox', name: 'Feynman’s ratchet and pawl',
      statement: String.raw`Feynman's ratchet is a small vane in a gas at temperature $T_1$, joined by an axle to a ratchet wheel whose teeth are asymmetric, held by a spring-loaded pawl at temperature $T_2$. It seems that molecular bombardment of the vane should make the wheel rotate in the direction the teeth allow, extracting work from a single temperature. It does not: when $T_1=T_2$ and the load is zero, the pawl itself fluctuates and occasionally lifts, letting the wheel slip backward at exactly the rate at which thermal kicks advance it, so the net rotation is zero on average. If the vane is hotter than the pawl ($T_1>T_2$) the ideal two-rate device can lift a load below its stall value; its limiting work-to-heat ratio at stall equals the Carnot value $1-T_2/T_1$ (at vanishing power). In the two-rate model used here the forward and backward step rates are $r_f=r_0e^{-(\varepsilon+w)/kT_1}$ and $r_b=r_0e^{-\varepsilon/kT_2}$, with $\varepsilon$ the energy to lift the pawl over a tooth and $w$ the load work per tooth.`,
      idea: String.raw`The statistical content is that fluctuations occur at *both* ends of the axle: whatever the vane's thermal energy can do to the ratchet, the pawl's thermal energy can undo, and at equal temperatures detailed balance forces the two rates to match (the second law, 2.1, in microscopic form). Feynman derives the rates and the reversible limit in the *Lectures*, I §46–2. Balancing the two rates gives the stall load $w^*=\varepsilon(T_1/T_2-1)$, and with energy $\varepsilon+w^*$ drawn from the hot vane per tooth, the efficiency $w^*/(\varepsilon+w^*)=1-T_2/T_1$ — the Carnot limit of the earlier chapter (2.7), approached only when the ratchet advances infinitely slowly.`,
      caption: String.raw`**Adjust the vane temperature $T_1$ (the pawl stays at $T_2=1$), the lifting energy $\varepsilon$ and the load $w$**, then press play: the wheel turns by a random sequence of forward and backward steps (Gillespie simulation of the two rates). With $T_1=T_2$ and $w=0$ the trace wanders with no drift; an applied load drives it backward. With $T_1>T_2$ it climbs until you raise the load beyond the stall value $w^*$, when it descends. The right panel plots the net rate against load for the chosen $T_1$ (blue) and for equal temperatures (grey).`,
      deps: ['thermo-5.16', 'thermo-2.1'], refs: ["Feynman Lectures I §§46–1–2, Eq. (46.1)"], tags: ['ratchet', 'second law'],
      credit: 'Feynman Lectures on Physics, vol. I, ch. 46',
      scope: String.raw`A schematic two-rate model in the spirit of Feynman's argument: the numerical prefactors and the way heat is partitioned are simplified, and heat leaking from the vane to the pawl through the axle, which makes real ratchets far less efficient than Carnot, is ignored.`,

      links: { wikipedia: 'https://en.wikipedia.org/wiki/Brownian_ratchet' },
      viz(v) {
        const T1 = v.slider('vane temperature $T_1$ (pawl $T_2=1$)', 1, 4, 2, { step: 0.05, fmt: (x) => v.fix(x, 2) });
        const eps = v.slider('pawl-lifting energy $\\varepsilon/kT_2$', 0.5, 6, 3, { step: 0.05, fmt: (x) => v.fix(x, 2) });
        const wl = v.slider('load work per tooth $w/kT_2$', 0, 8, 1, { step: 0.05, fmt: (x) => v.fix(x, 2) });
        const rate = v.slider('simulated time per second', 2, 200, 40, { log: true, sig: 2 });
        const S = v.sim(() => ({ n: 0, t: 0, r: v.rng(17), ser: [[0, 0]], nf: 0, nb: 0 }), (st) => {
          const rf = Math.exp(-(eps.value + wl.value) / T1.value), rb = Math.exp(-eps.value / 1), tot = rf + rb;
          let left = rate.value / 30;
          while (left > 0) { const wt = -Math.log(1 - st.r()) / tot; if (wt > left) { st.t += left; left = 0; } else { st.t += wt; left -= wt; if (st.r() < rf / tot) { st.n++; st.nf++; } else { st.n--; st.nb++; } st.ser.push([st.t, st.n]); } }
          st.ser.push([st.t, st.n]); if (st.ser.length > 6000) st.ser = st.ser.filter((_, i) => i % 2 === 0 || i === st.ser.length - 1);
          return st;
        }, { dt: 1 / 30, maxSteps: 3000 });
        const sa = v.stage({ x: [-1.9, 1.9], y: [-1.45, 1.45], equal: true, axes: false, height: 290, weight: 0.9, minWidth: 250, title: 'the ratchet' });
        const sb = v.stage({ x: [0, 100], y: [-5, 5], axes: 'box', gutter: true, height: 290, weight: 1.1, minWidth: 250, xlabel: 'time (units of $1/r_0$)', ylabel: 'teeth advanced', title: 'one run' });
        const sc = v.stage({ x: [0, 8], y: [-0.2, 0.2], axes: 'box', gutter: true, height: 290, weight: 1, minWidth: 250, xlabel: 'load $w/kT_2$', ylabel: 'net rate $(r_f-r_b)/r_0$', title: 'engine or no engine' });
        const rampc = tRamp(v);
        const NT = 8, sector = 2 * Math.PI / NT;
        let info = null;
        v.animate((t) => {
          S.advance(t);
          const st = S.state, rf = Math.exp(-(eps.value + wl.value) / T1.value), rb = Math.exp(-eps.value);
          // wheel
          const rot = -st.n * sector, pts = [];
          for (let k = 0; k < NT; k++) { const a = rot + k * sector; pts.push([0.78 * Math.cos(a), 0.78 * Math.sin(a)], [1.0 * Math.cos(a), 1.0 * Math.sin(a)]); }
          // sawtooth outline: tip at a, drop to inner radius at a + sector
          const poly = []; for (let k = 0; k < NT; k++) { const a = rot + k * sector; poly.push([0.78 * Math.cos(a), 0.78 * Math.sin(a)], [1.0 * Math.cos(a + 0.05), 1.0 * Math.sin(a + 0.05)]); }
          sa.poly(poly, { fill: 'muted', fillAlpha: 0.35, color: 'ink', width: 2 });
          sa.circle(0, 0, 0.15, { fill: 'ink', fillAlpha: 0.7, color: 'ink' });
          sa.line(0.3, 1.38, 0.0, 0.93, { color: tRamp(v)[0], width: 4 }); sa.dot(0.3, 1.38, { r: 4, color: 'ink' });
          sa.text('pawl at $T_2=1$', 0.4, 1.3, { size: 11, color: 'blue', align: 'left', plate: true });
          sa.rect(-1.85, -0.45, -1.2, 0.45, { fill: 'red', fillAlpha: 0.15 + 0.12 * (T1.value - 1), color: 'red', width: 1.2 });
          sa.line(-1.2, 0, -0.15, 0, { color: 'ink', width: 3 });
          sa.text('vane', -1.52, 0, { size: 12, color: 'red', align: 'center', weight: 650 }); sa.text(`$T_1=${v.fix(T1.value, 2)}$`, -1.4, -0.62, { size: 11.5, color: 'red', align: 'center' });
          sa.arrow(0.55, -1.0, 0.55 + 0.4, -1.0 + 0.12, { color: 'green', width: 2, head: 7 });
          sa.text(st.n >= 0 ? `+${st.n} teeth` : `${st.n.toString().replace('-', '−')} teeth`, 0, -1.3, { size: 12.5, color: 'ink', align: 'center', weight: 650 });
          const tm = Math.max(50, st.t);
          const lo = Math.min(-5, ...st.ser.map((p) => p[1])) - 1, hi = Math.max(5, ...st.ser.map((p) => p[1])) + 1;
          sb.setView([0, tm], [lo, hi]); sb.path(st.ser, { color: 'accent', width: 1.6 });
          sb.line(0, 0, tm, (rf - rb) * tm, { color: 'orange', width: 2, dash: [6, 4] });
          sb.hline(0, { color: 'faint', width: 1 });
          const f = (T, w) => Math.exp(-(eps.value + w) / T) - Math.exp(-eps.value);
          const low = Math.min(-.02, f(T1.value, 8), f(1, 8)), high = Math.max(.02, f(T1.value, 0));
          sc.setView([0, 8], [1.2 * low, 1.2 * high]);
          sc.fn((w) => f(T1.value, w), { color: 'accent', width: 2.4, n: 100 }); sc.fn((w) => f(1, w), { color: 'muted', width: 1.8, n: 100, dash: [5, 4] });
          sc.hline(0, { color: 'ink', width: 1 });
          const ws = eps.value * (T1.value - 1);
          if (ws > 0 && ws < 8) { sc.dot(ws, 0, { r: 6, color: 'green' }); sc.text('stall $w^*$', ws, 0, { dy: 16, size: 11, color: 'green', align: 'center' }); }
          sc.dot(wl.value, rf - rb, { r: 6, color: 'gold' });
          info = { rf, rb, n: st.n, t: st.t, ws, nf: st.nf, nb: st.nb };
        }, { still: 8, period: 30 });
        v.legend([['accent', 'simulation'], ['orange', 'mean drift $(r_f-r_b)t$', { dash: true }], ['muted', '$T_1=T_2$', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { rf, rb, n, t, ws, nf, nb } = info;
          const eta = ws > 0 ? ws / (eps.value + ws) : 0;
          return `$r_f/r_0=${v.fix(rf, 4)}$, $r_b/r_0=${v.fix(rb, 4)}$ → mean rate **${v.fix(rf - rb, 4)}** teeth per unit time ${rf > rb ? '(turns forward, lifting the load)' : rf < rb ? '(slips backward)' : '(no net motion)'} · after $t=${v.fix(t, 1)}$: ${nf} forward and ${nb} backward steps, net ${n}\nstall load $w^*=\\varepsilon(T_1/T_2-1)=${v.fix(ws, 2)}\\,kT_2$ ${T1.value === 1 ? '(zero: no engine at equal temperatures)' : ''} · limiting work/heat ratio (zero net current at stall) $w^*/(\\varepsilon+w^*)=${v.fix(eta, 3)}$ vs Carnot $1-T_2/T_1=${v.fix(1 - 1 / T1.value, 3)}$`;
        });
      },
    },
  ],
};
