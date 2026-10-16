// Chemical Kinetics — Chapter 3: Transition-state theory (items 3.1–3.6)
import { R, clamp, KB, HP, RJ, kTh, HC_K, eyring, mkRng, dwell, langevinStep, kappaTunnel } from './ch03.shared.js';

const CM = 0.011962656; // kJ/mol per cm^-1

export default {
  collection: 'kin',
  chapter: 3,
  title: 'Transition-state theory',
  summary: String.raw`Transition-state theory treats the activated complex as a molecule in quasi-equilibrium with the reactants, crossing the barrier at a universal frequency $k_BT/h$. The Eyring equation recasts rates in terms of an enthalpy and entropy of activation, isotope effects and tunnelling follow from zero-point energies, and the structure of transition states is linked to reaction energies by the Hammond postulate and the Bell–Evans–Polanyi and Hammett relations. Curtin–Hammett and kinetic-versus-thermodynamic control say which product wins, and Kramers extends the theory to friction.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1', kind: 'Postulate', name: 'Activated complex in quasi-equilibrium',
      statement: String.raw`**Transition-state theory** rests on two assumptions about a reaction on a single Born–Oppenheimer potential energy surface. (i) There is a *dividing surface* through the saddle point, transverse to the reaction coordinate, such that every system crossing it in the forward direction goes on to become product and is never seen to return (no recrossing). (ii) The systems that sit on the surface and move forward are populated as if reactants and activated complexes were in equilibrium: the density at the surface is the Boltzmann density, with the reactant temperature, for the forward-moving half of the velocity distribution. The rate per reactant is then the one-way equilibrium flux through the surface,
$$k_{\rm TST}\;=\;\langle v_+\rangle\,\frac{\rho^\ddagger}{\rho_{\rm R}},\qquad \langle v_+\rangle=\sqrt{\frac{k_BT}{2\pi m}},$$
where $m$ is the mass of the reaction coordinate. The true rate differs from this by a transmission coefficient $\kappa\le 1$ in classical mechanics: $k=\kappa\,k_{\rm TST}$.`,
      idea: String.raw`Forward flux through a surface is a purely equilibrium quantity, so no dynamics is needed to compute it: this is why the theory is useful. A trajectory that crosses the surface forward and later recrosses back is counted by the flux each time it crosses, although it produced at most one net reaction, so the flux is an **upper bound** on the classical rate; this is also why the best dividing surface is the one of least flux, which for a barrier is the saddle (the surface of lowest Boltzmann density). Pelzer and Wigner introduced the saddle-point picture in 1932, and Eyring and, independently, Evans and Polanyi turned it into a rate theory in 1935. Evaluating the flux with partition functions gives the Eyring equation (3.2).`,
      caption: String.raw`**A model, not a molecule:** 60 independent Langevin particles in a double well (reduced units, barrier $3\,k_BT$), started in equilibrium. Dots sit at their total energy. Drag the orange dividing surface and change the friction $\gamma$. Every forward or backward crossing of the surface flashes gold. The right panel is the Boltzmann flux through a surface at $x_d$ (curve) with your measured crossing rate (gold dot) on it: it is least at the barrier top. The green line is the measured rate of actual well-to-well transitions, always below the flux; at high friction each reaction event is crossed many times.`,
      deps: ['kin-2.7', 'pchem-7.3'],
      refs: ['Steinfeld et al.', 'Houston'],
      tags: ['transition-state theory', 'recrossing'],
      credit: 'Eyring, 1935; Evans & Polanyi, 1935 (saddle-point picture: Pelzer & Wigner, 1932)',
      scope: String.raw`Classical motion of the nuclei over one electronic surface; the reaction coordinate is separable at the surface. Fails through recrossing (friction, 3.11), tunnelling (3.5), and electronically non-adiabatic crossings.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Transition_state_theory' },
      viz(v) {
        const W = dwell(3), N = 60, dt = 0.02, SUB = 5;
        const g = v.slider('friction $\\gamma$', 0.1, 30, 2, { log: true, sig: 2 });
        v.button('Reset counts', () => reset());
        const A = v.stage({ x: [-2, 2], y: [-0.2, 8], axes: 'box', gutter: true, height: 340, xlabel: 'reaction coordinate x', ylabel: 'E / kT', title: 'particles in a double well', weight: 1.15 });
        const pr = (x) => 0.5 * W.kTST(x);
        const B = v.stage({ x: [-1.3, 1.3], y: [pr(0) / 2, pr(1) * 2.2], ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'position of the dividing surface', ylabel: 'one-way crossings per particle per time', title: 'flux through a surface', weight: 1 });
        const h = A.handle(0, 7.2, { color: 'orange', label: 'x_d', constrain: (x) => [clamp(x, -1.25, 1.25), 7.2] });
        let counts = { cross: 0, trans: 0, t: 0 };
        const reset = () => { counts = { cross: 0, trans: 0, t: 0 }; };
        h.onDrag = reset;
        const S = v.sim(() => {
          const rnd = mkRng(31), x = new Float64Array(N), p = new Float64Array(N), side = new Int8Array(N), prev = new Float64Array(N);
          for (let i = 0; i < N; i++) { let q; do { q = (rnd() - 0.5) * 3.4; } while (rnd() > Math.exp(-W.V(q) + 0)); x[i] = q; p[i] = rnd.normal(); side[i] = q < 0 ? -1 : 1; }
          counts = { cross: 0, trans: 0, t: 0 };
          return { x, p, side, prev, rnd, flash: [] };
        }, (st) => {
          const xd = h.x;
          for (let s = 0; s < SUB; s++) {
            st.prev.set(st.x);
            langevinStep(W, st.x, st.p, g.value, dt, st.rnd);
            for (let i = 0; i < N; i++) {
              const a = st.prev[i], b = st.x[i];
              if ((a - xd) * (b - xd) < 0) { counts.cross += 0.5; st.flash.push({ x: xd, y: W.V(b) + 0.5 * st.p[i] ** 2, age: 0 }); }
              if (Math.abs(b) > 0.6) { const sd = b < 0 ? -1 : 1; if (sd !== st.side[i]) { counts.trans += 0.5; st.side[i] = sd; } }
            }
          }
          counts.t += SUB * dt;
        }, { dt: 1 / 30 });
        let info = {};
        v.animate((t) => {
          S.advance(t);
          const st = S.state;
          A.fn(W.V, { color: 'ink', width: 2, domain: [-1.9, 1.9] });
          A.vline(h.x, { color: 'orange', width: 1.6, dash: [5, 4] });
          st.flash = st.flash.filter((f) => ++f.age < 10);
          for (const f of st.flash) A.dot(f.x, f.y, { r: 4 + f.age * 0.9, hollow: true, color: 'gold', alpha: 1 - f.age / 10 });
          for (let i = 0; i < N; i++) A.dot(st.x[i], W.V(st.x[i]) + 0.5 * st.p[i] ** 2, { r: 3.2, color: st.side[i] < 0 ? 'accent' : 'purple' });
          B.fn(pr, { color: 'accent', width: 2.4, domain: [-1.3, 1.3] });
          B.vline(h.x, { color: 'orange', width: 1.4, dash: [5, 4] });
          const nt = counts.t * N, rc = counts.cross / Math.max(nt, 1e-9), rt = counts.trans / Math.max(nt, 1e-9);
          if (counts.cross > 0) B.dot(h.x, clamp(rc, pr(0) / 2.2, pr(1) * 2), { r: 6, color: 'gold' });
          if (counts.trans > 0) B.hline(clamp(rt, pr(0) / 2.2, pr(1) * 2), { color: 'green', width: 2 });
          info = { rc, rt, pred: pr(h.x), n: counts.cross, nt: counts.trans, kappa: counts.cross > 0 ? counts.trans / counts.cross : NaN, V: W.V(h.x) };
        }, { period: 200, still: 60 });
        v.legend([['accent', 'last in left well', { dot: true }], ['purple', 'last in right well', { dot: true }], ['orange', 'dividing surface', { dash: true }], ['gold', 'crossing', { dot: true }], ['green', 'measured transition rate']]);
        v.readout(() => `surface at $x_d=${v.fix(h.x, 2)}$ ($V=${v.fix(info.V, 2)}\\,k_BT$): Boltzmann flux $\\langle v_+\\rangle\\rho(x_d)=${v.sci(info.pred, 3)}$, measured crossings $${v.sci(info.rc || 0, 3)}$ per particle per unit time\nwell-to-well transitions $${v.sci(info.rt || 0, 3)}$ → each reaction event was crossed ${isFinite(info.kappa) ? v.fix(1 / info.kappa, 1) : '–'} times; measured $\\kappa=${isFinite(info.kappa) ? v.fix(Math.min(1, info.kappa), 2) : '–'}$  (${v.fix(info.n, 0)} crossings, ${v.fix(info.nt, 0)} transitions)`);
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2', kind: 'Theorem', name: 'Eyring equation',
      statement: String.raw`If the activated complex is in quasi-equilibrium with the reactants (3.1) and the motion along the reaction coordinate over the barrier top is treated as a free translation, then for a unimolecular step
$$k\;=\;\kappa\,\frac{k_BT}{h}\,K^\ddagger\;=\;\kappa\,\frac{k_BT}{h}\,\frac{q^\ddagger}{q_{\rm R}}\,e^{-E_0/k_BT},$$
where $q^\ddagger$ is the partition function of the activated complex with the reaction-coordinate degree of freedom removed, $q_{\rm R}$ that of the reactant (both measured from their own zero-point levels), $E_0$ the barrier height between the zero-point levels, and $\kappa\le1$ the transmission coefficient. The universal prefactor $k_BT/h\approx 6.2\times10^{12}\ \mathrm{s^{-1}}$ at $298\ \mathrm K$ is the frequency at which a complex in equilibrium crosses; in terms of free energies, $k=\kappa\,(k_BT/h)\,e^{-\Delta G^\ddagger/RT}$ (for a bimolecular step $K^\ddagger$ carries the standard-state concentration).`,
      idea: String.raw`The reaction coordinate at the top of the barrier is a free translation along a short length $\delta$, whose partition function is $\delta\sqrt{2\pi m k_BT}/h$. Multiplying by the mean forward speed $\langle v_+\rangle/\delta$ (3.1) leaves $k_BT/h$, independent of $m$ and $\delta$. The remaining modes of the complex give $q^\ddagger$, and the ratio $q^\ddagger/q_{\rm R}$ is the equilibrium constant between reactant and complex, built from partition functions as in pchem-9.11. A "loose" complex with softer modes than the reactant has a large $q^\ddagger/q_{\rm R}$ and a large prefactor; a "tight" one has a small prefactor, which is the origin of the entropy of activation (3.3).`,
      caption: String.raw`Build $k$ from partition functions for a model reactant with $n+1$ vibrations of $500\ \mathrm{cm^{-1}}$ whose complex keeps $n$ of them at $f\times500\ \mathrm{cm^{-1}}$ (the last has become the reaction coordinate). Tune the barrier $E_0$, the stiffness ratio $f$ and the number of modes. Left: $\ln k$ against $1000/T$ (blue) with the local straight-line Arrhenius fit (orange) over $\pm15\%$ of $T$; the grey curve is the ceiling $k_BT/h$. Right: $k$ against $E_0$ at three temperatures, where all three curves converge on $(k_BT/h)K^\ddagger$ as $E_0\to0$.`,
      deps: ['kin-3.1', 'pchem-9.11'],
      refs: ['Steinfeld et al.', 'Houston'],
      tags: ['Eyring equation', 'partition functions'],
      credit: 'Eyring, 1935; Evans & Polanyi, 1935',
      scope: String.raw`Quasi-equilibrium transition-state theory with harmonic partition functions: assumes $\kappa=1$ (here), no tunnelling and a separable reaction coordinate. The numbers are a model of a generic unimolecular reaction, not a particular molecule.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Eyring_equation' },
      viz(v) {
        const E0 = v.slider('barrier $E_0$ (kJ/mol)', 10, 120, 60, { step: 1 });
        const nM = v.slider('modes kept in the complex $n$', 1, 6, 3, { int: true });
        const f = v.slider('stiffness ratio $f=\\nu^\\ddagger/\\nu_{\\rm R}$', 0.2, 1.5, 0.6, { step: 0.02 });
        const Tm = v.slider('temperature $T$ (K)', 150, 800, 298, { step: 1 });
        const nuR = 500, q = (nu, T) => 1 / (1 - Math.exp(-HC_K * nu / T));
        const Kd = (T) => { let k = 1; for (let i = 0; i < nM.value; i++) k *= q(f.value * nuR, T); return k / Math.pow(q(nuR, T), nM.value + 1); };
        const kk = (T, e0 = E0.value) => kTh(T) * Kd(T) * Math.exp(-e0 * 1000 / (RJ * T));
        const A = v.stage({ x: [1.2, 6.8], y: [-30, 30], axes: 'box', gutter: true, height: 340, xlabel: '1000 / T  (1/K × 1000)', ylabel: 'ln (k / s⁻¹)', title: 'Eyring rate constant against 1/T', weight: 1.15 });
        const B = v.stage({ x: [0, 120], y: [1e-20, 1e14], ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'E₀ (kJ/mol)', ylabel: 'k (s⁻¹)', title: 'rate constant against barrier', weight: 1 });
        let info = {};
        v.render(() => {
          const T = Tm.value;
          const grid = []; for (let t = 150; t <= 800; t += 10) grid.push(t);
          const ys = grid.map((t) => Math.log(kk(t)));
          A.setView([1.2, 6.8], [Math.min(-8, Math.min(...ys) - 2), Math.max(Math.log(kTh(800)) + 1, Math.max(...ys) + 2)]);
          A.curve((x) => [x, Math.log(kTh(1000 / x))], 1.25, 6.7, { n: 60, color: 'faint', width: 2 });
          A.curve((x) => [x, Math.log(kk(1000 / x))], 1.25, 6.7, { n: 120, color: 'accent', width: 2.6 });
          const lo = T * 0.85, hi = T * 1.15, xs = [], zs = [];
          for (let i = 0; i < 9; i++) { const t = lo + (hi - lo) * i / 8; xs.push(1000 / t); zs.push(Math.log(kk(t))); }
          const fit = v.M.linreg(xs, zs);
          A.line(1.2, fit.slope * 1.2 + fit.intercept, 6.8, fit.slope * 6.8 + fit.intercept, { color: 'orange', width: 2, dash: [7, 4] });
          A.dot(1000 / T, Math.log(kk(T)), { r: 6, color: 'gold' });
          for (const [t, c] of [[200, 'blue'], [300, 'green'], [500, 'red']]) B.fn((e) => kk(t, e), { color: c, width: 2, domain: [0, 120] });
          B.dot(E0.value, kk(T), { r: 6, color: 'gold' });
          const K = Kd(T);
          info = { T, kth: kTh(T), K, k: kk(T), Ea: -fit.slope * RJ, Ea0: E0.value + RJ * T / 1000, lnA: fit.intercept, dS: RJ * Math.log(K) };
        });
        v.legend([['accent', '$k(T)$ from partition functions'], ['orange', 'Arrhenius fit', { dash: true }], ['faint', '$k_BT/h$'], ['blue', '$k(E_0)$ at 200 K'], ['green', '300 K'], ['red', '500 K']]);
        v.readout(() => `at $T=${info.T}$ K: $k_BT/h=${v.sci(info.kth, 3)}\\ \\mathrm{s^{-1}}$ · $K^\\ddagger=q^\\ddagger/q_{\\rm R}=${v.fix(info.K, 3)}$ (so $\\Delta S^\\ddagger\\approx R\\ln K^\\ddagger=${v.fix(info.dS, 1)}$ J/mol/K) · $k=${v.sci(info.k, 3)}\\ \\mathrm{s^{-1}}$\nArrhenius straight-line fit around $T$: $E_a=${v.fix(info.Ea, 1)}$ kJ/mol, $A=${v.sci(Math.exp(info.lnA), 2)}\\ \\mathrm{s^{-1}}$; compare $E_0+RT=${v.fix(info.Ea0, 1)}$ kJ/mol`);
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3', kind: 'Definition', name: 'Enthalpy and entropy of activation',
      statement: String.raw`Writing the Eyring equation with the free energy of activation $\Delta G^\ddagger=-RT\ln K^\ddagger_c$ (standard state $1\ \mathrm M$) and splitting it as $\Delta G^\ddagger=\Delta H^\ddagger-T\Delta S^\ddagger$ defines the **enthalpy of activation** $\Delta H^\ddagger$ and the **entropy of activation** $\Delta S^\ddagger$:
$$\ln\frac{k}{T}\;=\;\ln\frac{k_B}{h}+\frac{\Delta S^\ddagger}{R}-\frac{\Delta H^\ddagger}{R}\cdot\frac1T .$$
In an **Eyring plot** of $\ln(k/T)$ against $1/T$ the slope is $-\Delta H^\ddagger/R$ and the intercept is $\ln(k_B/h)+\Delta S^\ddagger/R$. A negative $\Delta S^\ddagger$ means the complex is more ordered (fewer accessible states) than the reactants, typical of association steps; a positive one means it is looser, typical of bond-breaking steps. The Arrhenius parameters follow as $E_a=\Delta H^\ddagger+RT$ for a unimolecular or solution-phase step.`,
      idea: String.raw`Taking $\ln$ of the Eyring equation (3.2) and separating the temperature-dependent exponent from the temperature-independent entropy term is just algebra. The physics is in reading the pieces: $\Delta H^\ddagger$ is the energy cost of reaching the complex, $\Delta S^\ddagger=R\ln(q^\ddagger/q_{\rm R})$ (up to the translational/standard-state bookkeeping) measures how much freedom is lost or gained. The extra factor $T$ in $k/T$ comes from the $k_BT/h$ prefactor, which is why the Eyring slope differs from the Arrhenius slope by $RT$.`,
      caption: String.raw`**Illustrative values, synthetic data:** seven rate constants between $T_{\min}$ and $T_{\max}$ are generated from the chosen $\Delta H^\ddagger$ and $\Delta S^\ddagger$ with Gaussian scatter, and an ordinary least-squares line is fitted. The presets give typical *signs* only (they are not measurements). Left: the Eyring plot. Right: $\Delta G^\ddagger=\Delta H^\ddagger-T\Delta S^\ddagger$ against $T$ for the three presets (faint) and for your fit. Narrow the window or raise the scatter and watch the error on $\Delta S^\ddagger$ explode: slope and intercept are strongly correlated.`,
      deps: ['kin-3.2'],
      refs: ['Houston'],
      tags: ['activation parameters', 'Eyring plot'],
      scope: String.raw`Quasi-equilibrium TST with temperature-independent $\Delta H^\ddagger,\Delta S^\ddagger$ over the window; for gas-phase bimolecular steps $E_a=\Delta H^\ddagger+2RT$, and $\Delta S^\ddagger$ depends on the standard state chosen.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Eyring_equation' },
      viz(v) {
        const PRE = { d: [95, 45, 'dissociative: ΔS‡ > 0'], r: [85, -5, 'rearrangement: ΔS‡ ≈ 0'], a: [60, -120, 'associative: ΔS‡ ≪ 0'] };
        const preset = v.select('example type', [{ value: 'd', label: 'dissociative' }, { value: 'r', label: 'rearrangement' }, { value: 'a', label: 'associative' }, { value: 'c', label: 'custom' }], 'a', {
          onChange(val) { if (PRE[val]) { dH.set(PRE[val][0]); dS.set(PRE[val][1]); } },
        });
        const dH = v.slider('$\\Delta H^\\ddagger$ (kJ/mol)', 20, 150, 60, { step: 1 });
        const dS = v.slider('$\\Delta S^\\ddagger$ (J/mol/K)', -150, 100, -120, { step: 1 });
        const T1 = v.slider('$T_{\\min}$ (K)', 250, 340, 285, { step: 1 });
        const T2 = v.slider('$T_{\\max}$ (K)', 300, 400, 335, { step: 1 });
        const sg = v.slider('scatter in $k$ (%)', 0, 15, 3, { step: 0.5 });
        const nz = (() => { const r = v.rng(303); return Array.from({ length: 7 }, () => r.normal()); })();
        const A = v.stage({ x: [2.4, 3.8], y: [-10, 0], axes: 'box', gutter: true, height: 340, xlabel: '1000 / T  (1/K × 1000)', ylabel: 'ln (k / T)', title: 'Eyring plot', weight: 1.1 });
        const B = v.stage({ x: [200, 450], y: [20, 140], axes: 'box', gutter: true, height: 340, xlabel: 'T (K)', ylabel: 'ΔG‡ (kJ/mol)', title: 'free energy of activation', weight: 1 });
        const lnkh = Math.log(KB / HP);
        let info = {};
        v.render(() => {
          const t1 = Math.min(T1.value, T2.value - 10), t2 = Math.max(T2.value, t1 + 10);
          const Ts = Array.from({ length: 7 }, (_, i) => t1 + (t2 - t1) * i / 6);
          const pts = Ts.map((T, i) => ({ T, x: 1000 / T, y: Math.log(eyring(T, dH.value, dS.value) / T) + sg.value / 100 * nz[i] }));
          const fit = v.M.linreg(pts.map((p) => p.x), pts.map((p) => p.y));
          const ys = pts.map((p) => p.y), ylo = Math.min(...ys), yhi = Math.max(...ys);
          const xlo = 1000 / (t2 + 25), xhi = 1000 / (t1 - 25);
          A.setView([xlo, xhi], [ylo - 0.6 * (yhi - ylo) - 0.5, yhi + 0.6 * (yhi - ylo) + 0.5]);
          A.line(xlo, fit.slope * xlo + fit.intercept, xhi, fit.slope * xhi + fit.intercept, { color: 'green', width: 2.2, dash: [7, 4] });
          pts.forEach((p) => A.dot(p.x, p.y, { r: 5, color: 'accent' }));
          for (const k of Object.keys(PRE)) B.fn((T) => PRE[k][0] - T * PRE[k][1] / 1000, { color: 'faint', width: 1.4, domain: [200, 450] });
          const dHf = -fit.slope * RJ, dSf = RJ * (fit.intercept - lnkh);
          B.fn((T) => dHf - T * dSf / 1000, { color: 'accent', width: 2.6, domain: [200, 450] });
          B.fn((T) => dH.value - T * dS.value / 1000, { color: 'green', width: 1.6, dash: [7, 4], domain: [200, 450] });
          const Tm = (t1 + t2) / 2; B.dot(Tm, dHf - Tm * dSf / 1000, { r: 5, color: 'gold' });
          info = { dHf, dSf, sH: fit.seSlope * RJ, sS: RJ * fit.seIntercept, r2: fit.r2, Tm, G: dHf - Tm * dSf / 1000, k: eyring(298.15, dH.value, dS.value) };
        });
        v.legend([['accent', 'synthetic data', { dot: true }], ['green', 'least squares / true values', { dash: true }], ['faint', 'the three presets']]);
        v.readout(() => `fit: $\\Delta H^\\ddagger=${v.fix(info.dHf, 1)}\\pm${v.fix(info.sH, 1)}$ kJ/mol (true ${dH.value}), $\\Delta S^\\ddagger=${v.fix(info.dSf, 0)}\\pm${v.fix(info.sS, 0)}$ J/mol/K (true ${dS.value}), $r^2=${v.fix(info.r2, 4)}$\n$\\Delta G^\\ddagger(${v.fix(info.Tm, 0)}\\,\\mathrm K)=${v.fix(info.G, 1)}$ kJ/mol · the true rate constant at 298 K is $${v.sci(info.k, 2)}\\ \\mathrm{s^{-1}}$ (a change of 1 kJ/mol in $\\Delta G^\\ddagger$ changes $k$ by a factor $${v.fix(Math.exp(1000 / (RJ * 298.15)), 2)}$)`);
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4', kind: 'Phenomenon', name: 'Kinetic isotope effect',
      statement: String.raw`Replacing an atom by a heavier isotope changes a rate constant even though the potential energy surface is unchanged. For a **primary** effect, where the bond to the isotope is broken or formed in the rate-determining step, the lighter isotope usually reacts faster ($k_{\rm H}/k_{\rm D}>1$). In the simplest semiclassical picture, the zero-point energy of a stretching vibration is $\tfrac12 h\nu$ with $\nu\propto\mu^{-1/2}$, and if the stretch is lost (or much weakened) at the transition state the heavier isotope has to climb a higher barrier by the difference of zero-point energies:
$$\frac{k_{\rm H}}{k_{\rm D}}\;\approx\;\exp\!\Big[\frac{(1-\phi)\,\tfrac12 h c(\tilde\nu_{\rm H}-\tilde\nu_{\rm D})\,N_A}{RT}\Big],$$
with $\phi\in[0,1]$ the fraction of the stretching zero-point energy that survives at the transition state. For a C–H stretch near $3000\ \mathrm{cm^{-1}}$ and $\phi=0$ this gives a value near $7$ at room temperature, which falls toward 1 as $T$ rises.`,
      idea: String.raw`In TST (3.2) both isotopologues share one surface, so the only differences are in the partition functions, and the dominant one is the zero-point term $e^{-\mathrm{ZPE}/RT}$ that makes the effective barrier $E_0^{\rm D}-E_0^{\rm H}=(1-\phi)(\mathrm{ZPE}^{\rm H}_{\rm R}-\mathrm{ZPE}^{\rm D}_{\rm R})$. A symmetric transition state with the hydrogen half-way between two heavy atoms has $\phi\approx0$ for the stretch that becomes the reaction coordinate. The ratio of the zero-point energies follows from the reduced masses (zero-point energy, qm-4.4), and the effect decays as $e^{\Delta\mathrm{ZPE}/RT}$ with temperature. Bending modes and tunnelling (3.5) move real values away from this bare estimate.`,
      caption: String.raw`Left: a schematic of the zero-point levels of H and D in the reactant well and at the transition state (the right-hand well is the same stretch at the transition state, its frequency scaled by $\phi$). The arrows are the two activation energies measured between zero-point levels; their lengths differ by $(1-\phi)$ times the reactant zero-point gap. Right: $k_{\rm H}/k_{\rm D}$ against $T$ for $\phi$ you choose (blue) and for $\phi=0$ (dashed grey). The stretch frequency, the heavy partner atom (which sets the reduced masses) and $\phi$ are yours to change.`,
      deps: ['kin-3.2', 'qm-4.4'],
      refs: ['Steinfeld et al.'],
      tags: ['isotope effect', 'zero-point energy'],
      credit: 'Bigeleisen, 1949 (theory of isotope effects on rates)',
      verify: true,
      scope: String.raw`Semiclassical, one stretching mode, harmonic zero-point energies; real primary effects also depend on bending modes, transition-state symmetry and tunnelling. Secondary and heavy-atom effects are far smaller than this bare estimate.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kinetic_isotope_effect' },
      viz(v) {
        const nuS = v.slider('C–H stretch $\\tilde\\nu_{\\rm H}$ (cm⁻¹)', 2400, 3600, 3000, { step: 10 });
        const mx = v.select('heavy partner X', [{ value: '12', label: 'C (12)' }, { value: '14', label: 'N (14)' }, { value: '16', label: 'O (16)' }, { value: '1000', label: 'infinitely heavy' }], '12');
        const phi = v.slider('stretch ZPE kept at the TS, $\\phi$', 0, 1, 0, { step: 0.01 });
        const Ts = v.slider('$T$ (K)', 150, 800, 298, { step: 1 });
        const A = v.stage({ x: [0, 10], y: [-8, 100], axes: false, height: 350, title: 'zero-point levels (schematic)', weight: 1, minWidth: 270 });
        const B = v.stage({ x: [150, 800], y: [1, 100], ylog: true, axes: 'box', gutter: true, height: 350, xlabel: 'T (K)', ylabel: 'k(H) / k(D)', title: 'isotope effect against temperature', weight: 1.1 });
        const red = (m, a) => m * a / (m + a);
        let info = {};
        v.render(() => {
          const m = +mx.value, rr = Math.sqrt(red(m, 1.00783) / red(m, 2.01410));
          const nuH = nuS.value, nuD = nuH * rr;
          const zH = 0.5 * CM * nuH, zD = 0.5 * CM * nuD, ph = phi.value, V = 62, w = 0.8;
          const kie = (T, p) => Math.exp((1 - p) * (zH - zD) * 1000 / (RJ * T));
          const x0 = 2.2, x1 = 7.6;
          const reac = (x) => zH * ((x - x0) / w) ** 2, ts = (x) => V + zH * ph * ph * ((x - x1) / w) ** 2;
          A.curve((x) => [x, reac(x)], x0 - 1.35, x0 + 1.35, { n: 60, color: 'ink', width: 2.2 });
          A.curve((x) => [x, Math.min(96, ts(x))], x1 - 1.35, x1 + 1.35, { n: 60, color: 'ink', width: 2.2 });
          const ya = reac(x0 + 1.35), yb = ts(x1 - 1.35);
          A.curve((x) => [x, ya + (yb - ya) * (1 - Math.cos(Math.PI * (x - (x0 + 1.35)) / (x1 - 1.35 - x0 - 1.35))) / 2], x0 + 1.35, x1 - 1.35, { n: 40, color: 'faint', width: 1.8, dash: [5, 4] });
          const tH = V + ph * zH, tD = V + ph * zD, dw = w * Math.sqrt(zD / zH);
          A.line(x0 - w, zH, x0 + w, zH, { color: 'accent', width: 3.4 }); A.line(x0 - dw, zD, x0 + dw, zD, { color: 'purple', width: 3.4 });
          const tw = (z) => (ph > 0.02 ? Math.min(1.3, w * Math.sqrt(z / (zH * ph * ph))) : 1.3);
          A.line(x1 - tw(ph * zH), tH, x1 + tw(ph * zH), tH, { color: 'accent', width: 3.4 }); A.line(x1 - tw(ph * zD), tD, x1 + tw(ph * zD), tD, { color: 'purple', width: 3.4 });
          A.line(x0 + w, zH, 8.9, zH, { color: 'accent', width: 1, dash: [2, 4] }); A.line(x0 + dw, zD, 9.6, zD, { color: 'purple', width: 1, dash: [2, 4] });
          A.line(x1 + 0.5, tH, 8.9, tH, { color: 'accent', width: 1, dash: [2, 4] }); A.line(x1 + 0.5, tD, 9.6, tD, { color: 'purple', width: 1, dash: [2, 4] });
          A.arrow(8.9, zH, 8.9, tH, { color: 'accent', width: 2, head: 7 }); A.arrow(9.6, zD, 9.6, tD, { color: 'purple', width: 2, head: 7 });
          A.tex('E_0^{\\rm H}', 8.75, (zH + tH) / 2, { size: 13, color: 'accent', align: 'right' }); A.tex('E_0^{\\rm D}', 9.6, tD + 7, { size: 13, color: 'purple', align: 'center' });
          A.tex('\\mathrm{ZPE}_{\\rm H}', x0, zH + 8, { size: 12, color: 'accent' }); A.tex('\\mathrm{ZPE}_{\\rm D}', x0 - 0.75, zD - 7, { size: 12, color: 'purple', align: 'right' });
          A.text('reactant', x0, -5, { size: 12, color: 'muted', align: 'center' }); A.text('transition state', x1, 83, { size: 12, color: 'muted', align: 'center' });
          B.hband(6, 8, { color: 'green', alpha: 0.1 });
          B.fn((T) => kie(T, 0), { color: 'faint', width: 1.8, dash: [6, 4], domain: [150, 800] });
          B.fn((T) => kie(T, ph), { color: 'accent', width: 2.6, domain: [150, 800] });
          B.dot(Ts.value, kie(Ts.value, ph), { r: 6, color: 'gold' });
          info = { nuD, dz: zH - zD, E: (1 - ph) * (zH - zD), k: kie(Ts.value, ph), kmax: kie(298.15, 0), T: Ts.value };
        });
        v.legend([['accent', 'H', { dot: true }], ['purple', 'D', { dot: true }], ['green', 'the “about 7” band', { area: true }], ['faint', 'stretch lost at TS ($\\phi=0$)', { dash: true }]]);
        v.readout(() => `$\\tilde\\nu_{\\rm D}=${v.fix(info.nuD, 0)}$ cm⁻¹ · zero-point gap in the reactant $${v.fix(info.dz, 2)}$ kJ/mol, difference of activation energies $E_0^{\\rm D}-E_0^{\\rm H}=${v.fix(info.E, 2)}$ kJ/mol\n$k_{\\rm H}/k_{\\rm D}(${info.T}\\,\\mathrm K)=${v.fix(info.k, 2)}$ · the largest value for these frequencies ($\\phi=0$) at 298 K is $${v.fix(info.kmax, 2)}$ — values far above that point to tunnelling (3.5)`);
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5', kind: 'Phenomenon', name: 'Tunnelling corrections to rates',
      statement: String.raw`For light atoms, especially hydrogen, a fraction of the reacting systems goes through the barrier instead of over it. The rate constant acquires a tunnelling factor $\kappa(T)=k_{\rm quantum}/k_{\rm classical}\ge1$ that grows as the temperature falls. For a parabolic barrier of height $V_0$ and imaginary frequency $\nu^\ddagger$, with $u=h\nu^\ddagger/k_BT$, the leading correction is Wigner's $\kappa\approx1+u^2/24$, and Bell's closed form $\kappa=\dfrac{u/2}{\sin(u/2)}$ holds while $u<2\pi$; below the **crossover temperature** $T_c=h\nu^\ddagger/2\pi k_B$ tunnelling dominates and Arrhenius plots flatten. Because $\nu^\ddagger\propto m^{-1/2}$, deuterium tunnels far less than hydrogen, so the isotope effect can greatly exceed the semiclassical limit of about 7 (3.4).`,
      idea: String.raw`The thermally averaged transmission through a barrier is $\int_0^\infty P(E)\,e^{-E/k_BT}\,dE/k_BT$ divided by the classical $e^{-V_0/k_BT}$. For the parabolic (Kemble) barrier, $P(E)=[1+e^{2\pi(V_0-E)/h\nu^\ddagger}]^{-1}$, which is exactly 1/2 at the top and decays exponentially below it, so energies somewhat below $V_0$ contribute at low $T$. Wigner's formula is the first term of an expansion in $h\nu^\ddagger/k_BT$ and Bell's the sum of the geometric series; both fail when $k_BT$ falls below the crossover. A deuterium has $\nu^\ddagger/\sqrt2$, so a smaller $u$ and a much smaller $\kappa$.`,
      caption: String.raw`The parabolic-barrier (Kemble) model integrated numerically, with energies measured from the reactant zero-point level. Left: Arrhenius plots for H (blue), for D (orange; barrier raised by the zero-point gap and $\nu^\ddagger/\sqrt2$) and for the classical barrier alone (grey). Middle: the tunnelling factor for H with Wigner's and Bell's approximations (they leave the exact curve near $T_c$). Right: the resulting $k_{\rm H}/k_{\rm D}$ compared with its zero-point-only value. Lower $T$, a higher $\nu^\ddagger$ or a lower barrier make the Arrhenius plot of H curve and the isotope effect soar.`,
      deps: ['kin-3.2', 'qchem-1.11'],
      refs: ['Steinfeld et al.'],
      tags: ['tunnelling', 'isotope effect'],
      credit: 'Wigner, 1932 (correction); Bell, 1959 (parabolic-barrier treatment)',
      verify: true,
      scope: String.raw`A one-dimensional parabolic barrier, truncated at the reactant zero-point energy: reliable for $T\gtrsim T_c$ and qualitative below it, where multidimensional (small-curvature, instanton) treatments are needed. The numbers do not describe a particular reaction.`,
      viz(v) {
        const V0 = v.slider('barrier $V_0$ (kJ/mol)', 15, 80, 40, { step: 1 });
        const nu = v.slider('$\\nu^\\ddagger_{\\rm H}$ (cm⁻¹)', 400, 2000, 1200, { step: 50 });
        const dz = v.slider('ZPE gap D–H (kJ/mol)', 0, 8, 4.7, { step: 0.1 });
        const tun = v.toggle('tunnelling', true);
        const A = v.stage({ x: [1.5, 8.3], y: [-45, 0], axes: 'box', gutter: true, height: 330, xlabel: '1000 / T  (1/K × 1000)', ylabel: 'ln (k / A)', title: 'Arrhenius plots', weight: 1.1, minWidth: 250 });
        const B = v.stage({ x: [100, 600], y: [1, 1e4], ylog: true, axes: 'box', gutter: true, height: 330, xlabel: 'T (K)', ylabel: 'κ(T)', title: 'tunnelling factor for H', weight: 1, minWidth: 250 });
        const C = v.stage({ x: [100, 600], y: [1, 1e5], ylog: true, axes: 'box', gutter: true, height: 330, xlabel: 'T (K)', ylabel: 'k(H) / k(D)', title: 'isotope effect', weight: 1, minWidth: 250 });
        let info = {};
        v.render(() => {
          const hvH = nu.value * CM, hvD = hvH / Math.SQRT2, V = V0.value, Dz = dz.value;
          const kc = (T) => Math.exp(-V * 1000 / (RJ * T));
          const kH = (T) => (tun.value ? kappaTunnel(V, hvH, T) : 1) * kc(T);
          const kD = (T) => (tun.value ? kappaTunnel(V + Dz, hvD, T) : 1) * Math.exp(-(V + Dz) * 1000 / (RJ * T));
          const Tc = nu.value * HC_K / (2 * Math.PI), Tmin = 100;
          A.setView([1.5, 8.3], [-(V + Dz) * 1000 / (RJ * Tmin) - 3, 1]);
          A.curve((x) => [x, Math.log(kc(1000 / x))], 1.7, 8.2, { n: 40, color: 'faint', width: 1.8, dash: [6, 4] });
          A.curve((x) => [x, Math.log(kD(1000 / x))], 1.7, 8.2, { n: 90, color: 'orange', width: 2.4 });
          A.curve((x) => [x, Math.log(kH(1000 / x))], 1.7, 8.2, { n: 90, color: 'accent', width: 2.6 });
          if (1000 / Tc <= 8.3) A.vline(1000 / Tc, { color: 'gold', dash: [3, 4] });
          const u = (T) => hvH * 1000 / (RJ * T), wig = (T) => 1 + u(T) ** 2 / 24, bell = (T) => (u(T) < 2 * Math.PI ? (u(T) / 2) / Math.sin(u(T) / 2) : NaN);
          B.fn((T) => kappaTunnel(V, hvH, T), { color: 'accent', width: 2.6, domain: [100, 600] });
          B.fn(wig, { color: 'green', width: 1.8, dash: [6, 4], domain: [100, 600] });
          B.fn(bell, { color: 'red', width: 1.8, dash: [2, 3], domain: [Math.max(100, Tc * 1.0001), 600] });
          B.vline(Tc, { color: 'gold', dash: [3, 4] });
          const zpe = (T) => Math.exp(Dz * 1000 / (RJ * T));
          C.fn(zpe, { color: 'faint', width: 1.8, dash: [6, 4], domain: [100, 600] });
          C.fn((T) => zpe(T) * (tun.value ? kappaTunnel(V, hvH, T) / kappaTunnel(V + Dz, hvD, T) : 1), { color: 'accent', width: 2.6, domain: [100, 600] });
          C.vline(Tc, { color: 'gold', dash: [3, 4] });
          const T0 = 300;
          info = { Tc, k300: kappaTunnel(V, hvH, T0), k200: kappaTunnel(V, hvH, 200), kie300: zpe(T0) * (tun.value ? kappaTunnel(V, hvH, T0) / kappaTunnel(V + Dz, hvD, T0) : 1), kie200: zpe(200) * (tun.value ? kappaTunnel(V, hvH, 200) / kappaTunnel(V + Dz, hvD, 200) : 1), z300: zpe(T0), wig300: wig(T0), bell300: bell(T0) };
        });
        v.legend([['accent', 'H (with tunnelling if on)'], ['orange', 'D'], ['faint', 'classical / ZPE only', { dash: true }], ['green', 'Wigner', { dash: true }], ['red', 'Bell', { dash: true }], ['gold', 'crossover $T_c$', { dash: true }]]);
        v.readout(() => `crossover temperature $T_c=h\\nu^\\ddagger/2\\pi k_B=${v.fix(info.Tc, 0)}$ K · $\\kappa_{\\rm H}(300\\,\\mathrm K)=${v.fix(info.k300, 2)}$ (Wigner $${v.fix(info.wig300, 2)}$, Bell $${isFinite(info.bell300) ? v.fix(info.bell300, 2) : '–'}$), $\\kappa_{\\rm H}(200\\,\\mathrm K)=${v.fix(info.k200, 1)}$\n$k_{\\rm H}/k_{\\rm D}$: $${v.fix(info.kie300, 1)}$ at 300 K and $${v.sci(info.kie200, 2)}$ at 200 K, against $${v.fix(info.z300, 1)}$ from zero-point energy alone at 300 K`);
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6', kind: 'Principle', name: 'Hammond postulate',
      statement: String.raw`For an elementary step, the transition state resembles the species nearest to it in energy. In a strongly **exothermic** step the transition state lies early and looks like the reactants; in a strongly **endothermic** step it lies late and looks like the products; for a thermoneutral step it is half-way. In the two-parabola picture, with reactant surface $V_{\rm R}=\tfrac12k_{\rm R}x^2$ and product surface $V_{\rm P}=\tfrac12k_{\rm P}(x-1)^2+\Delta E$ along a dimensionless coordinate from reactants ($x=0$) to products ($x=1$), the crossing point $x^\ddagger$ moves toward $0$ as $\Delta E$ falls, and for $k_{\rm R}=k_{\rm P}=k$ it is exactly $x^\ddagger=\tfrac12+\Delta E/k$ as long as $|\Delta E|<k/2$.`,
      idea: String.raw`Raising the product curve by $\Delta E$ slides its intersection with the reactant parabola up the reactant's right-hand wall, so a more endothermic reaction crosses further along the coordinate and higher. The postulate is a statement about the shape of any single smooth barrier: a small change in the energy of the product moves the maximum only a little, in the direction of the species whose energy is closer. It is built on a quasi-equilibrium picture of the transition state (3.1) and on the geometry of the reaction coordinate (2.7). Hammond proposed it in 1955; Leffler stated a similar idea in 1953.`,
      caption: String.raw`Drag the product well up and down (or use the presets). The blue parabola is the reactant, the orange the product, the gold dot their crossing: the transition state. The right panel shows how far along the coordinate it lies, $x^\ddagger$, as a function of the reaction energy; the dot is you. Change the stiffness ratio $k_{\rm P}/k_{\rm R}$, then push $\Delta E$ below $-k/2$ so the product parabola crosses *behind* the reactant minimum, where the picture (and the postulate) stops making sense.`,
      deps: ['kin-2.7'],
      refs: ['Houston'],
      tags: ['transition state', 'reaction energy'],
      credit: 'Hammond, 1955 (Leffler, 1953)',
      scope: String.raw`A qualitative rule for a single elementary step with a smooth one-dimensional profile and similar curvatures; neglects entropy, and fails for very exothermic steps (the inverted region) or when other coordinates change character.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hammond%27s_postulate' },
      viz(v) {
        const kR = 200; // kJ/mol per unit^2 (so lambda = 100 kJ/mol at x = 1)
        const rat = v.slider('stiffness ratio $k_{\\rm P}/k_{\\rm R}$', 0.5, 2, 1, { step: 0.05 });
        const dEs = v.slider('$\\Delta E$ (kJ/mol)', -250, 250, 0, { step: 1 });
        v.button('exothermic', () => dEs.set(-80)); v.button('thermoneutral', () => dEs.set(0)); v.button('endothermic', () => dEs.set(80));
        const A = v.stage({ x: [-0.4, 1.4], y: [-270, 400], axes: 'box', gutter: true, height: 350, xlabel: 'reaction coordinate x (reactants 0, products 1)', ylabel: 'E (kJ/mol)', title: 'two crossing parabolas', weight: 1.2 });
        const B = v.stage({ x: [-250, 250], y: [-0.4, 1.4], axes: 'box', gutter: true, height: 350, xlabel: 'ΔE (kJ/mol)', ylabel: 'x‡', title: 'where the transition state lies', weight: 1 });
        const hP = A.handle(1, 0, { color: 'orange', label: 'product', constrain: (x, y) => [1, clamp(y, -250, 250)] });
        let lock = false;
        hP.onDrag = () => { lock = true; dEs.set(hP.y); lock = false; };
        const cross = (kP, dE) => {
          // 0.5 kR x^2 = 0.5 kP (x-1)^2 + dE  ->  (kR-kP) x^2 + 2 kP x - kP - 2 dE = 0
          const a = kR - kP, b = 2 * kP, c = -kP - 2 * dE;
          const roots = Math.abs(a) < 1e-9 ? [-c / b] : (() => { const d = b * b - 4 * a * c; return d < 0 ? [] : [(-b + Math.sqrt(d)) / (2 * a), (-b - Math.sqrt(d)) / (2 * a)]; })();
          let best = null; for (const r of roots) if (r >= -0.5 && r <= 1.5 && (best === null || Math.abs(r - 0.5) < Math.abs(best - 0.5))) best = r;
          return best;
        };
        let info = {};
        v.render(() => {
          const kP = kR * rat.value, dE = dEs.value;
          if (!lock) hP.set(1, dE);
          A.fn((x) => 0.5 * kR * x * x, { color: 'accent', width: 2.6, domain: [-0.4, 1.4] });
          A.fn((x) => 0.5 * kP * (x - 1) ** 2 + dE, { color: 'orange', width: 2.6, domain: [-0.4, 1.4] });
          const xs = cross(kP, dE);
          if (xs !== null) {
            const E = 0.5 * kR * xs * xs;
            A.vline(xs, { color: 'gold', dash: [4, 4] });
            A.dot(xs, E, { r: 7, color: 'gold' });
            A.text(`x‡ = ${v.fix(xs, 2)}`, xs, -250, { size: 12, color: 'gold', align: 'center' });
          }
          A.dot(0, 0, { r: 5, color: 'accent' }); A.dot(1, dE, { r: 5, color: 'orange' });
          B.line(-250, 0.5 - 250 / kR, 250, 0.5 + 250 / kR, { color: 'faint', width: 1.4, dash: [5, 4] });
          const pts = []; for (let e = -250; e <= 250; e += 5) { const x = cross(kP, e); pts.push(x === null ? null : [e, x]); }
          B.path(pts, { color: 'accent', width: 2.6 });
          B.hline(0.5, { color: 'faint' });
          if (xs !== null) B.dot(dE, xs, { r: 6, color: 'gold' });
          info = { xs, dE, E: xs === null ? NaN : 0.5 * kR * xs * xs, inv: xs !== null && (xs < 0 || xs > 1) };
        });
        v.legend([['accent', 'reactant surface'], ['orange', 'product surface'], ['gold', 'transition state', { dot: true }], ['faint', 'equal stiffness: $x^\\ddagger=\\tfrac12+\\Delta E/k$', { dash: true }]]);
        v.readout(() => info.xs === null ? 'the two parabolas do not cross in this window' : `$\\Delta E=${v.fix(info.dE, 0)}$ kJ/mol: transition state at $x^\\ddagger=${v.fix(info.xs, 3)}$ — ${info.inv ? 'outside the interval between reactant and product: the picture has broken down' : info.xs < 0.4 ? 'early, reactant-like' : info.xs > 0.6 ? 'late, product-like' : 'in the middle'}; barrier $E^\\ddagger=${v.fix(info.E, 1)}$ kJ/mol ($\\lambda=k_{\\rm R}/2=100$ kJ/mol)`);
      },
    },
  ],
};
