// Thermodynamics & Statistical Mechanics — Chapter 3: Thermodynamic potentials and relations
import { clamp, lerp, R, tRamp, pick, band, reservoir, cylinder, KB, NA, HP, AMU, FARADAY, GAS, vdw, sUVN, dpart, bar } from './ch03.shared.js';

// ---------- helpers for this file ----------
const L = 1e-3, KJ = 1e3, BAR = 1e5;
/** Deterministic scatter in the unit square (for gas dots). */
const DOTS = (() => { let a = 7; const r = () => ((a = (a * 16807) % 2147483647) / 2147483647); return Array.from({ length: 400 }, () => [r(), r()]); })();
/** Simpson integral of f over [a, b] with n (even) panels. */
const simpson = (f, a, b, n = 200) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; };
/** Energy in J → "1.23 kJ" style text. */
const kj = (v, x, d = 2) => `${v.fix(x / KJ, d)} kJ`;

export default {
  collection: 'thermo',
  chapter: 3,
  title: 'Thermodynamic potentials and relations',
  summary: String.raw`A system's fundamental relation $S(U, V, N)$ contains all its equilibrium thermodynamics: its slopes are $1/T$, $P/T$ and $-\mu/T$, and systems that may exchange energy, volume or particles come to equilibrium where those slopes agree. Extensivity alone gives the Euler relation $U = TS - PV + \mu N$ and, differentiated, the Gibbs–Duhem constraint among the intensive variables. Legendre transforms trade an extensive variable for its conjugate slope, turning $U$ into the free energies $F$, $H$ and $G$ that are minimized under the constraints chemists and engineers actually impose and that bound the work a process can deliver. Equality of mixed partial derivatives yields Maxwell's relations, which with a little Jacobian algebra express any derivative through measurable heat capacities, expansivities and compressibilities. Stability demands concave entropy, and the third law fixes how entropy behaves as $T \to 0$. Most pictures compute on a real equation of state — van der Waals fluids with handbook constants, water from tabulated data — and check each identity by finite differences.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1', kind: 'Definition', name: 'The fundamental relation S(U, V, N)',
      statement: String.raw`For a simple system (one chemical species, no internal walls, no fields) the **fundamental relation** is the function
$$S = S(U, V, N)$$
giving the equilibrium entropy in terms of the extensive variables energy, volume and amount. Thermodynamics postulates that it is

- **continuous and differentiable**, and **strictly increasing in $U$** (so it can be inverted to $U = U(S, V, N)$, the energy form of the same relation);
- **extensive**: first-order homogeneous, $S(\lambda U, \lambda V, \lambda N) = \lambda S(U, V, N)$;
- **concave**, so that the entropy of a composite system is maximized by uniform states (3.15).

Every equilibrium property — equation of state, heat capacities, compressibilities, chemical potential — follows from this one function by differentiation; an equation of state such as $PV = NkT$ alone does not determine it.`,
      idea: String.raw`The second law (2.10) makes entropy the quantity maximized in an isolated system, so knowing $S$ as a function of the conserved quantities answers every question about which equilibrium is reached when constraints are released. Monotonicity in $U$ says temperature is positive (3.2); homogeneity expresses the additivity of weakly coupled parts; concavity is the stability condition. The partial derivatives are the intensive variables (3.2), and their integrability conditions are the Maxwell relations (3.12). For the monatomic ideal gas the relation is the Sackur–Tetrode formula $S = Nk\left[\ln\!\left(\tfrac{V}{N}\left(\tfrac{4\pi mU}{3Nh^2}\right)^{3/2}\right) + \tfrac52\right]$; for a van der Waals fluid $U$ is replaced by $U + aN^2/V$ and $V$ by $V - Nb$.`,
      caption: String.raw`Left: the entropy of 1 mol of argon over the $(U, V)$ plane (contours every 5 J/K); the dashed line is the isotherm through the state. **Drag the state.** Right: the same function as a surface (drag to rotate), with its tangent plane at the state in gold — the red and blue arrows are its slopes $\partial S/\partial U = 1/T$ and $\partial S/\partial V = P/T$. The surface rises with $U$ and with $V$ and lies everywhere *below* its tangent plane: concave. The readout measures the slopes by finite differences and compares them with the temperature and pressure the model's equation of state gives; switch to **van der Waals** to see the attraction and excluded volume reshape the surface.`,
      deps: ['thermo-2.9'],
      see: ['thermo-2.11', 'thermo-5.11'],
      refs: ['Callen ch. 1'],
      tags: ['fundamental relation', 'entropy'],
      credit: 'Gibbs, 1873–1876; axiomatized by Callen, 1960',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fundamental_thermodynamic_relation' },
      viz(v) {
        const model = v.select('1 mol of argon as', [{ value: 'ideal', label: 'ideal gas' }, { value: 'vdw', label: 'van der Waals fluid' }], 'ideal');
        const U0 = 0.4, U1 = 8, V0 = 0.5, V1 = 40;
        const sm = v.stage({ x: [U0, U1], y: [V0, V1], ylog: true, height: 350, axes: 'box', gutter: true, xlabel: 'U (kJ)', ylabel: 'V (L)', weight: 1.05, title: 'entropy $S(U, V)$ of 1 mol (J/K)' });
        const s3 = v.stage3d({ range: 1.55, axisLength: 1.2, height: 350, yaw: -0.7, pitch: 0.5, labels: ['U', 'ln V', 'S'], title: 'the surface and its tangent plane at the state' });
        const h = sm.handle(3.4, 22.4, { color: 'gold', label: 'state', constrain: { x: [0.7, 7.7], y: [0.7, 36] } });
        let st = null;
        v.render(() => {
          const M = vdw('Ar', model.value === 'ideal');
          const S = (Uk, VL) => sUVN(M, Uk * KJ, VL * L, 1);
          const lo = S(U0, V0), hi = S(U1, V1);
          sm.heat(S, { range: [lo, hi], cmap: 'theme', color: 'teal', res: 3, key: 'S' + model.value });
          const lv = []; for (let k = Math.ceil(lo / 5) * 5; k <= hi; k += 5) lv.push(k);
          sm.contour(S, lv, { color: 'ink', width: 0.8, alpha: 0.35, res: 80 });
          const U = h.x, V = h.y, T = M.TofU(U * KJ, V * L);
          sm.curve((t) => { const VL = V0 * (V1 / V0) ** t; return [(M.cv * T - M.a / (VL * L)) / KJ, VL]; }, 0, 1, { color: 'ink', dash: [6, 4], width: 1.3 });
          sm.text(`isotherm ${v.fix(T, 0)} K`, (M.cv * T - M.a / (1.2 * L)) / KJ, 1.2, { dx: 6, size: 11, color: 'ink', plate: true });
          // slopes by finite differences (per J, per m³)
          const Sj = (Uj, Vm) => sUVN(M, Uj, Vm, 1), x0 = [U * KJ, V * L];
          const SU = dpart(Sj, x0, 0, 1e-3 * x0[0]), SV = dpart(Sj, x0, 1, 1e-4 * x0[1]);
          const SUU = (Sj(x0[0] * 1.01, x0[1]) - 2 * Sj(...x0) + Sj(x0[0] * 0.99, x0[1])) / (0.01 * x0[0]) ** 2;
          const SVV = (Sj(x0[0], x0[1] * 1.01) - 2 * Sj(...x0) + Sj(x0[0], x0[1] * 0.99)) / (0.01 * x0[1]) ** 2;
          const SUV = (Sj(x0[0] * 1.01, x0[1] * 1.01) - Sj(x0[0] * 1.01, x0[1] * 0.99) - Sj(x0[0] * 0.99, x0[1] * 1.01) + Sj(x0[0] * 0.99, x0[1] * 0.99)) / (4 * 0.01 * x0[0] * 0.01 * x0[1]);
          // 3D
          const lnV0 = Math.log(V0), lnV1 = Math.log(V1), zs = 1.5 / (hi - lo);
          const toA = (Uk) => 2 * (Uk - U0) / (U1 - U0) - 1, toB = (VL) => 2 * (Math.log(VL) - lnV0) / (lnV1 - lnV0) - 1;
          const fromA = (a) => U0 + (a + 1) / 2 * (U1 - U0), fromB = (b) => Math.exp(lnV0 + (b + 1) / 2 * (lnV1 - lnV0));
          const Z = (s) => (s - lo) * zs - 0.75;
          s3.surface((a, b) => [a, b, Z(S(fromA(a), fromB(b)))], [-1, 1], [-1, 1], { n: 24, colorFn: (a, b, P) => v.ramp(clamp((P[2] + 0.75) / 1.5, 0, 1) * 0.85 + 0.1, 'teal'), alpha: 0.9 });
          const a0 = toA(U), b0 = toB(V), S0 = S(U, V), z0 = Z(S0);
          const dzda = SU * (U1 - U0) / 2 * KJ * zs, dzdb = SV * V * L * (lnV1 - lnV0) / 2 * zs, w = 0.38;
          const pl = (da, db) => [a0 + da, b0 + db, z0 + dzda * da + dzdb * db];
          s3.poly([pl(-w, -w), pl(w, -w), pl(w, w), pl(-w, w)], { fill: 'gold', fillAlpha: 0.42, color: 'gold', bias: -0.05 });
          s3.arrow(pl(0, 0), pl(w * 0.95, 0), { color: 'red', width: 3, bias: -0.1 });
          s3.arrow(pl(0, 0), pl(0, w * 0.95), { color: 'blue', width: 3, bias: -0.1 });
          s3.dot(pl(0, 0), { r: 5.5, color: 'gold', bias: -0.12 });
          // concavity: largest height of the surface above the plane on a grid
          let gap = -Infinity;
          for (let i = 0; i <= 24; i++) for (let j = 0; j <= 24; j++) { const Uk = fromA(-1 + i / 12), VL = fromB(-1 + j / 12), d = S(Uk, VL) - (S0 + SU * (Uk - U) * KJ + SV * (VL - V) * L); if (isFinite(d)) gap = Math.max(gap, d); }
          st = { T, P: M.P(T, V * L), SU, SV, SUU, SVV, SUV, gap, S0 };
        });
        v.legend([['gold', 'tangent plane at the state', { area: true }], ['red', '$\\partial S/\\partial U = 1/T$'], ['blue', '$\\partial S/\\partial V = P/T$']]);
        v.readout(() => {
          if (!st) return '';
          const { T, P, SU, SV, SUU, SVV, SUV, gap, S0 } = st;
          return `$S$ = ${v.fix(S0, 2)} J/K · measured slopes: $\\partial S/\\partial U$ = ${v.fix(SU * 1e3, 4)} mK⁻¹ → $T = 1/(\\partial S/\\partial U)$ = **${v.fix(1 / SU, 2)} K** (equation of state: ${v.fix(T, 2)} K); $\\partial S/\\partial V$ = ${v.fix(SV / 1e3, 3)} J/(K·L) → $P$ = **${v.fix(SV / SU / BAR, 4)} bar** (equation of state: ${v.fix(P / BAR, 4)} bar)\nconcavity: $S_{UU}$ = $${v.sci(SUU, 2)}$ < 0, $S_{UU}S_{VV} - S_{UV}^2$ = $${v.sci(SUU * SVV - SUV * SUV, 2)}$ ${SUU * SVV - SUV * SUV > 0 ? '> 0' : '≤ 0'}; highest point of the surface above its tangent plane: ${v.fix(gap, 4)} J/K ${gap <= 1e-6 ? '(never above — concave)' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2', kind: 'Definition', name: 'Temperature, pressure and chemical potential',
      statement: String.raw`The intensive variables of a simple system are defined as the partial derivatives of its fundamental relation $S(U, V, N)$ (3.1):
$$\frac1T = \left(\frac{\partial S}{\partial U}\right)_{V,N},\qquad \frac PT = \left(\frac{\partial S}{\partial V}\right)_{U,N},\qquad -\frac{\mu}{T} = \left(\frac{\partial S}{\partial N}\right)_{U,V}.$$
$T$ is the **temperature**, $P$ the **pressure** and $\mu$ the **chemical potential** (energy per particle, or per mole when $N$ counts moles). Each is a function of $(U, V, N)$ that is homogeneous of degree zero, so it depends only on the ratios $U/N$ and $V/N$. These definitions agree with the ideal-gas temperature of 1.4, the mechanical pressure, and the empirical temperature of 1.3.`,
      idea: String.raw`The definitions are forced by what happens when two systems exchange something (3.4): total entropy is maximized when the derivatives match, so a quantity that is equal across systems in contact must be a function of $\partial S/\partial U$, and choosing $1/T$ makes $T$ agree with the ideal-gas thermometer. For the ideal gas, $S = Nk\ln V + \tfrac32 Nk\ln U + \dots$ gives $1/T = \tfrac32 Nk/U$ (equipartition) and $P/T = Nk/V$ (the ideal gas law). The chemical potential of a dilute gas, $\mu = -kT\ln\!\big(V/(N\lambda^3)\big)$ with thermal wavelength $\lambda = h/\sqrt{2\pi mkT}$, is large and negative: adding a particle at fixed $U$ and $V$ raises the entropy. Partial derivatives in several variables (pma 9.16) are exactly what is needed.`,
      caption: String.raw`Three slices through the entropy of argon, each through the same state: $S$ against $U$ (with $V, N$ fixed), against $V$, and against $N$. **Drag the gold points** along the curves — each moves one variable and updates the other two slices. The tangent lines are the three slopes; the readout converts them into $T$, $P$ and $\mu$ and compares them with the textbook formulas. Notice that $S(N)$ at fixed $U$ and $V$ still rises at everyday conditions: $\mu < 0$. Push $N$ up and $U$ down (a cold, dense gas) and $\mu$ climbs toward zero, where the ideal-gas (classical) description is about to fail.`,
      deps: ['thermo-3.1', 'pma-9.16'],
      see: ['thermo-1.4', 'thermo-1.3'],
      refs: ['Schroeder §3.5', 'Callen ch. 2'],
      tags: ['temperature', 'chemical potential'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Chemical_potential' },
      viz(v) {
        const model = v.select('argon as', [{ value: 'ideal', label: 'ideal gas' }, { value: 'vdw', label: 'van der Waals' }], 'ideal');
        const D = { U: [0.3, 8], V: [1, 60], N: [0.25, 3] };
        const mk = (xl, title) => v.stage({ x: [0, 1], y: [0, 1], height: 300, axes: 'box', gutter: true, xlabel: xl, ylabel: 'S (J/K)', title, minWidth: 220 });
        const sU = mk('U (kJ)', 'slope $\\partial S/\\partial U = 1/T$'), sV = mk('V (L)', 'slope $\\partial S/\\partial V = P/T$'), sN = mk('N (mol)', 'slope $\\partial S/\\partial N = -\\mu/T$');
        const cur = { U: 3.4, V: 22.4, N: 1 };
        let M = vdw('Ar', true);
        const S = (U, V, N) => sUVN(M, U * KJ, V * L, N);
        const curve = { U: (x) => S(x, cur.V, cur.N), V: (x) => S(cur.U, x, cur.N), N: (x) => S(cur.U, cur.V, x) };
        const stg = { U: sU, V: sV, N: sN }, col = { U: 'red', V: 'blue', N: 'green' };
        const H = {};
        for (const k of ['U', 'V', 'N']) H[k] = stg[k].handle(cur[k], 0, { color: 'gold', constrain: (x) => { const xx = clamp(x, D[k][0] * 1.02, D[k][1] * 0.98); return [xx, curve[k](xx)]; }, onDrag: (q) => { cur[k] = q.x; } });
        let st = null;
        v.render(() => {
          M = vdw('Ar', model.value === 'ideal');
          const sl = {};
          for (const k of ['U', 'V', 'N']) {
            const s = stg[k], f = curve[k], [a, b] = D[k];
            const ys = []; for (let i = 0; i <= 60; i++) { const y = f(a + (b - a) * i / 60); if (isFinite(y)) ys.push(y); }
            const ylo = Math.min(...ys), yhi = Math.max(...ys), pad = 0.08 * (yhi - ylo);
            s.setView([a, b], [ylo - pad, yhi + pad]);
            s.fn(f, { color: 'ink', width: 2.2, domain: [a, b] });
            const x0 = cur[k], y0 = f(x0), hh = 1e-4 * x0, d = (f(x0 + hh) - f(x0 - hh)) / (2 * hh);
            sl[k] = d;
            const span = (b - a) * 0.28;
            s.line(x0 - span, y0 - d * span, x0 + span, y0 + d * span, { color: col[k], width: 2.4 });
            s.vline(x0, { color: 'faint', dash: [3, 4], width: 1 });
            if (!H[k].dragging) H[k].set(x0, y0);
          }
          const T = 1 / (sl.U / KJ), P = T * sl.V / L, mu = -T * sl.N;
          const m = GAS.Ar.M * AMU, lam = HP / Math.sqrt(2 * Math.PI * m * KB * T);
          const muIdeal = -KB * T * Math.log(cur.V * L / (cur.N * NA * lam ** 3)) * NA;
          sU.corner(`T = ${v.fix(T, 1)} K`, 'br', { color: 'red', weight: 650 });
          sV.corner(`P = ${v.fix(P / BAR, 3)} bar`, 'br', { color: 'blue', weight: 650 });
          sN.corner(`μ = ${v.fix(mu / KJ, 2)} kJ/mol`, 'br', { color: 'green', weight: 650 });
          st = { T, P, mu, muIdeal, lam, Teos: M.TofU(cur.U * KJ / cur.N, cur.V * L / cur.N), Peos: M.P(M.TofU(cur.U * KJ / cur.N, cur.V * L / cur.N), cur.V * L / cur.N) };
        });
        v.readout(() => {
          if (!st) return '';
          const { T, P, mu, muIdeal, lam, Teos, Peos } = st;
          return `state $U$ = ${v.fix(cur.U, 2)} kJ, $V$ = ${v.fix(cur.V, 1)} L, $N$ = ${v.fix(cur.N, 2)} mol · from the slopes: $T$ = **${v.fix(T, 2)} K** (equation of state ${v.fix(Teos, 2)} K), $P$ = **${v.fix(P / BAR, 4)} bar** (${v.fix(Peos / BAR, 4)} bar), $\\mu$ = **${v.fix(mu / KJ, 3)} kJ/mol** = ${v.fix(mu / NA / 1.602176634e-19, 3)} eV per atom\nideal-gas formula $\\mu = -kT\\ln\\big(V/N\\lambda^3\\big)$ with $\\lambda$ = ${v.fix(lam * 1e12, 2)} pm: ${v.fix(muIdeal / KJ, 3)} kJ/mol ${model.value === 'vdw' ? '(differs: the van der Waals attraction lowers μ)' : ''} · $V/N\\lambda^3$ = $${v.sci(cur.V * L / (cur.N * NA * lam ** 3), 2)}$ ≫ 1, so the gas is classical`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3', kind: 'Theorem', name: 'Thermodynamic identity',
      statement: String.raw`For a simple system, along any infinitesimal change between neighbouring equilibrium states,
$$dU = T\,dS - P\,dV + \mu\,dN.$$
Equivalently $dS = \tfrac1T\,dU + \tfrac PT\,dV - \tfrac{\mu}{T}\,dN$. The identity relates state functions only, so it holds for *any* pair of neighbouring equilibrium states, however the system actually got from one to the other. Only for a quasistatic process can its terms be read as heat ($T\,dS$), work ($-P\,dV$) and chemical work ($\mu\,dN$).`,
      idea: String.raw`Because $S(U, V, N)$ is differentiable and increasing in $U$, the total differential $dS = S_U\,dU + S_V\,dV + S_N\,dN$ holds, and inserting the definitions of $T$, $P$ and $\mu$ (3.2) and solving for $dU$ gives the identity. It is a statement about the *linear part* of the change in $U$: for a finite step the error is quadratic in the step size, which is what "infinitesimal" means. Comparing with the first law $dU = \delta Q + \delta W$ (1.11) for a reversible process identifies $\delta Q_{\text{rev}} = T\,dS$ (2.9).`,
      caption: String.raw`The plane is the $(S, V)$ state space of argon, coloured by the energy $U(S, V, N)$ (an ideal gas or van der Waals). **Drag the state A** and the **end of the step B**, and set $dN$. The waterfall adds $T\,dS$, $-P\,dV$ and $\mu\,dN$ — with $T$, $P$, $\mu$ measured at A as slopes of $U$ — and compares the sum (green) with the exact change $\Delta U$ (gold). For a big step they differ; the right panel shrinks the same step by factors of 2 and plots the mismatch on log axes: it falls along a line of slope 2, so the identity holds to first order — exactly what an infinitesimal statement promises.`,
      deps: ['thermo-3.2'],
      see: ['thermo-1.11', 'thermo-2.9'],
      refs: ['Schroeder §3.5'],
      tags: ['thermodynamic identity', 'differentials'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fundamental_thermodynamic_relation' },
      viz(v) {
        const model = v.select('argon as', [{ value: 'ideal', label: 'ideal gas' }, { value: 'vdw', label: 'van der Waals' }], 'ideal');
        const dN = v.slider('$dN$ (mol)', -0.1, 0.1, 0.03, { step: 0.005, fmt: (x) => v.fix(x, 3) });
        const S0 = 125, S1 = 175, V0 = 2, V1 = 50;
        const sp = v.stage({ x: [S0, S1], y: [V0, V1], ylog: true, height: 320, axes: 'box', gutter: true, xlabel: 'S (J/K)', ylabel: 'V (L)', weight: 1.1, title: 'energy $U(S, V)$ of 1 mol (kJ)' });
        const sb = v.stage({ x: [-0.6, 4.6], y: [-1, 1], height: 320, axes: 'box', gutter: true, ylabel: 'kJ', weight: 1, title: '$T\\,dS - P\\,dV + \\mu\\,dN$ against $\\Delta U$', xticks: [[0, 'T dS'], [1, '−P dV'], [2, 'μ dN'], [3, 'sum'], [4, 'ΔU']] });
        const se = v.stage({ x: [1e-4, 1], y: [1e-8, 10], xlog: true, ylog: true, height: 320, axes: 'box', gutter: true, xlabel: 'step size (fraction of A→B)', ylabel: '|mismatch| (kJ)', weight: 0.9, title: 'the error is second order' });
        const A = sp.handle(150, 22.4, { color: 'accent', label: 'A', constrain: { x: [S0 + 2, S1 - 2], y: [V0 + 1, V1 - 1] } });
        const B = sp.handle(155, 17, { color: 'gold', label: 'B', constrain: { x: [S0 + 2, S1 - 2], y: [V0 + 1, V1 - 1] } });
        let st = null;
        v.render(() => {
          const M = vdw('Ar', model.value === 'ideal');
          // U(S, V, n): invert s(T, v) = s(1 K, v) + cv ln T
          const Uf = (S, V, n) => { const vv = V / n; if (vv <= M.b) return NaN; const T = Math.exp((S / n - M.s(1, vv)) / M.cv); return n * M.u(T, vv); };
          const Uk = (S, VL) => Uf(S, VL * L, 1) / KJ;
          sp.heat((S, VL) => Math.log10(Uk(S, VL)), { range: [-0.6, 1.6], cmap: 'theme', color: 'orange', res: 3, key: 'U' + model.value });
          sp.contour(Uk, [0.5, 1, 2, 4], { color: 'ink', width: 0.8, alpha: 0.4, labels: true, fmt: (x) => x + ' kJ', res: 70 });
          sp.arrow(A.x, A.y, B.x, B.y, { color: 'ink', width: 1.8 });
          const x0 = [A.x, A.y * L, 1], d = [B.x - A.x, (B.y - A.y) * L, dN.value];
          const Tm = dpart(Uf, x0, 0, 1e-4), Pm = -dpart(Uf, x0, 1, 1e-5 * x0[1]), mum = dpart(Uf, x0, 2, 1e-5);
          const lin = (k) => Tm * d[0] * k - Pm * d[1] * k + mum * d[2] * k;
          const exact = (k) => Uf(x0[0] + d[0] * k, x0[1] + d[1] * k, x0[2] + d[2] * k) - Uf(...x0);
          const parts = [Tm * d[0], -Pm * d[1], mum * d[2]].map((x) => x / KJ), sum = parts[0] + parts[1] + parts[2], dU = exact(1) / KJ;
          // waterfall
          const ys = [0, parts[0], parts[0] + parts[1], sum, dU];
          const yl = Math.min(...ys, 0), yh = Math.max(...ys, 0), pad = Math.max(0.15, 0.15 * (yh - yl));
          sb.setView([-0.6, 4.6], [yl - pad, yh + pad]);
          sb.hline(0, { color: 'muted', width: 1 });
          let acc = 0; const cl = ['red', 'blue', 'purple'];
          parts.forEach((p, i) => { bar(sb, i, acc + p, 0.32, cl[i], { base: acc }); if (i < 2) sb.line(i + 0.32, acc + p, i + 0.68, acc + p, { color: 'faint', dash: [3, 3] }); acc += p; });
          sb.line(2.32, acc, 2.68, acc, { color: 'faint', dash: [3, 3] });
          bar(sb, 3, sum, 0.32, 'green'); bar(sb, 4, dU, 0.32, 'gold');
          [...parts, sum, dU].forEach((p, i) => sb.text(v.fix(p, 3), i, (i < 3 ? ys[i] + p / 2 : p / 2), { align: 'center', size: 11, plate: true }));
          // convergence
          const pts = [], ks = []; for (let j = 0; j <= 13; j++) ks.push(2 ** -j);
          for (const k of ks) { const e = Math.abs(exact(k) - lin(k)) / KJ; if (e > 0) pts.push([k, e]); }
          const e1 = pts.length ? pts[0][1] : 1e-3;
          se.fn((k) => e1 * k * k, { color: 'faint', width: 1.4, dash: [6, 4] });
          se.text('slope 2', 3e-3, e1 * 9e-6, { size: 11, color: 'muted', dx: -14, dy: -12, align: 'right' });
          se.path(pts, { color: 'green', width: 1.6 }); se.dots(pts, { r: 3.5, color: 'green' });
          se.dot(1, e1, { r: 5, color: 'gold' });
          st = { Tm, Pm, mum, sum, dU, e1 };
        });
        v.legend([['red', '$T\\,dS$', { area: true }], ['blue', '$-P\\,dV$', { area: true }], ['purple', '$\\mu\\,dN$', { area: true }], ['green', 'sum (linear part)', { area: true }], ['gold', 'exact $\\Delta U$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { Tm, Pm, mum, sum, dU } = st;
          return `slopes at A: $T = \\partial U/\\partial S$ = ${v.fix(Tm, 2)} K, $P = -\\partial U/\\partial V$ = ${v.fix(Pm / BAR, 4)} bar, $\\mu = \\partial U/\\partial N$ = ${v.fix(mum / KJ, 3)} kJ/mol · $T\\,dS - P\\,dV + \\mu\\,dN$ = **${v.fix(sum, 4)} kJ** vs exact $\\Delta U$ = **${v.fix(dU, 4)} kJ** (mismatch ${v.fix(Math.abs(dU - sum), 4)} kJ; halving the step quarters it)`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4', kind: 'Theorem', name: 'Conditions for equilibrium',
      statement: String.raw`Let an isolated composite system consist of two simple subsystems separated by an internal wall, with fixed totals $U = U_1 + U_2$, $V = V_1 + V_2$, $N = N_1 + N_2$. At equilibrium the total entropy $S_1(U_1, V_1, N_1) + S_2(U_2, V_2, N_2)$ is maximal over the values the wall leaves free, and therefore:

(a) a **diathermal** wall (energy exchange) forces $T_1 = T_2$;

(b) a diathermal **movable** wall (energy and volume) forces $T_1 = T_2$ and $P_1 = P_2$;

(c) a diathermal **permeable** wall (energy and particles) forces $T_1 = T_2$ and $\mu_1 = \mu_2$.

Away from equilibrium the entropy increases as energy flows toward the colder side, volume toward the higher pressure, and particles toward the lower chemical potential.`,
      idea: String.raw`By the entropy maximum principle (2.10), at equilibrium the first-order change of $S_1 + S_2$ vanishes for every allowed exchange: $dS = (1/T_1 - 1/T_2)\,dU_1 + (P_1/T_1 - P_2/T_2)\,dV_1 - (\mu_1/T_1 - \mu_2/T_2)\,dN_1 = 0$ with the definitions of 3.2. Each free variable kills one bracket. Before equilibrium, $dS > 0$ fixes the sign of each flow: $dU_1 > 0$ exactly when $1/T_1 > 1/T_2$, i.e. heat runs from hot to cold. This is why $T$, $P$ and $\mu$ are the quantities thermometers, manometers and osmometers can compare.`,
      caption: String.raw`Two samples of argon (2 mol and 7.5 kJ in total, in 40 L) share a wall; pick what it lets through. Left: the total entropy over the free variables — energy of side 1 horizontally and, for a movable or permeable wall, its volume or amount vertically. The orange curve is where $T_1 = T_2$, the blue curve $P_1 = P_2$, the purple curve $\mu_1 = \mu_2$; **drag the state** and press ▶ to release it: it climbs the entropy hill along the spontaneous flows (heat to the colder side, volume to the higher pressure, particles to the lower $\mu$) and stops where the relevant curves cross — the top of the hill. Right: the two chambers, coloured by temperature.`,
      deps: ['thermo-3.2', 'thermo-2.10'],
      see: ['thermo-1.2', 'thermo-3.10'],
      refs: ['Callen ch. 2'],
      tags: ['equilibrium', 'entropy maximum'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Thermodynamic_equilibrium' },
      viz(v) {
        const UT = 7500, VT = 40e-3, NT = 2;
        const wall = v.select('wall', [{ value: 'U', label: 'diathermal, fixed' }, { value: 'V', label: 'diathermal, movable' }, { value: 'N', label: 'diathermal, permeable' }], 'V', { onChange: () => { setStart(); v.restart(); } });
        const sm = v.stage({ x: [0.05, 0.95], y: [0.05, 0.95], height: 340, axes: 'box', gutter: true, xlabel: 'U₁ / U', ylabel: 'V₁ / V', weight: 1.15, title: 'total entropy $S_1 + S_2$ over the free variables' });
        const sbx = v.stage({ x: [-0.05, 1.05], y: [-0.25, 0.75], height: 340, equal: true, axes: false, weight: 1, title: 'the two chambers' });
        const M = vdw('Ar', true);
        const fix = { V: 0.35, N: 0.8 / NT };
        // state y-coordinate means V1/V (wall V or U) or N1/N (wall N)
        const vars = (x, y) => { const w = wall.value; return { U1: x * UT, V1: (w === 'N' ? 0.5 : w === 'V' ? y : fix.V) * VT, N1: (w === 'N' ? y : fix.N) * NT }; };
        const side = (U, V, N) => { const vv = V / N, T = M.TofU(U / N, vv); return { T, P: M.P(T, vv), mu: M.g(T, vv), S: N * M.s(T, vv) }; };
        const both = (x, y) => { const q = vars(x, y); return [side(q.U1, q.V1, q.N1), side(UT - q.U1, VT - q.V1, NT - q.N1)]; };
        const Stot = (x, y) => { const [a, b] = both(x, y); return a.S + b.S; };
        const h = sm.handle(0.8, 0.35, { color: 'gold', label: 'start', constrain: (x, y) => [clamp(x, 0.06, 0.94), wall.value === 'U' ? fix.V : clamp(y, 0.06, 0.94)], onDrag: () => { path = null; v.restart(); } });
        const setStart = () => { if (wall.value === 'U') h.set(0.8, fix.V); else if (wall.value === 'V') h.set(0.8, 0.25); else h.set(0.8, 0.75); path = null; };
        let path = null;
        // gradient flow of S in the scaled variables (x = U1/U, y = V1/V or N1/N), integrated until it stalls
        const flow = () => {
          const pts = [[h.x, h.y]]; let x = h.x, y = h.y;
          for (let k = 0; k < 4000; k++) {
            const e = 1e-5, gx = (Stot(x + e, y) - Stot(x - e, y)) / (2 * e), gy = wall.value === 'U' ? 0 : (Stot(x, y + e) - Stot(x, y - e)) / (2 * e);
            const g = Math.hypot(gx, gy); if (g < 1e-3) break;
            const dt = Math.min(2e-4, 0.004 / g); x = clamp(x + gx * dt, 0.02, 0.98); y = clamp(y + gy * dt, 0.02, 0.98);
            if (k % 4 === 0) pts.push([x, y]);
          }
          pts.push([x, y]); return pts;
        };
        let st = null;
        v.animate((t) => {
          const w = wall.value;
          sm.setLabels('U₁ / U', w === 'N' ? 'N₁ / N' : 'V₁ / V');
          if (!path) path = flow();
          const lo = Stot(0.5, 0.5) - 25, hi = Math.max(...[0.3, 0.5, 0.7].map((y) => Stot(0.5, y)), Stot(path[path.length - 1][0], path[path.length - 1][1]));
          const key = 'S' + w;
          sm.heat((x, y) => Stot(x, w === 'U' ? fix.V : y), { range: [hi - 25, hi], cmap: 'theme', color: 'teal', res: 3, key });
          const T12 = (x, y) => { const [a, b] = both(x, y); return 1 / a.T - 1 / b.T; };
          sm.contour(T12, [0], { color: 'orange', width: 2.4, res: 90 });
          if (w !== 'U') {
            if (w === 'V') sm.contour((x, y) => { const [a, b] = both(x, y); return a.P / a.T - b.P / b.T; }, [0], { color: 'blue', width: 2.4, res: 90 });
            if (w === 'N') sm.contour((x, y) => { const [a, b] = both(x, y); return a.mu / a.T - b.mu / b.T; }, [0], { color: 'purple', width: 2.4, res: 90 });
          } else sm.hline(fix.V, { color: 'ink', width: 1.4, dash: [6, 4] });
          // progress along the precomputed relaxation path
          const u = clamp(t / 5, 0, 1), k = Math.round(u * (path.length - 1)), cur = path[k];
          sm.path(path.slice(0, k + 1), { color: 'gold', width: 2.6 });
          sm.dot(cur[0], cur[1], { r: 6, color: 'gold' });
          const end = path[path.length - 1];
          if (u >= 1) sm.dot(end[0], end[1], { r: 8, color: 'green', hollow: true, label: 'maximum', labelPos: 'nw' });
          // chambers
          const q = vars(cur[0], cur[1]), [a, b] = both(cur[0], cur[1]), xw = q.V1 / VT, rp = tRamp(v);
          const tc = (T) => pick(rp, (T - 50) / 300);
          sbx.rect(0, 0, xw, 0.6, { fill: tc(a.T), fillAlpha: 0.35, stroke: false }); sbx.rect(xw, 0, 1, 0.6, { fill: tc(b.T), fillAlpha: 0.35, stroke: false });
          const nd = (n, x0, x1, off) => { const cnt = Math.round(n * 90); const pts = []; for (let i = 0; i < cnt; i++) { const p = DOTS[(i + off) % DOTS.length]; pts.push([x0 + 0.015 + p[0] * (x1 - x0 - 0.03), 0.015 + p[1] * 0.57]); } sbx.dots(pts, { r: 2.2, color: 'ink' }); };
          nd(q.N1, 0, xw, 0); nd(NT - q.N1, xw, 1, 200);
          sbx.rect(0, 0, 1, 0.6, { color: 'ink', width: 2.6 });
          sbx.line(xw, 0, xw, 0.6, { color: w === 'N' ? 'purple' : 'red', width: w === 'V' ? 5 : 3, dash: w === 'N' ? [5, 5] : null });
          sbx.text(`T₁ = ${v.fix(a.T, 0)} K`, xw / 2, 0.68, { align: 'center', size: 12, weight: 650, color: 'ink' });
          sbx.text(`T₂ = ${v.fix(b.T, 0)} K`, (1 + xw) / 2, 0.68, { align: 'center', size: 12, weight: 650, color: 'ink' });
          sbx.text(`P₁ = ${v.fix(a.P / BAR, 2)} bar · μ₁ = ${v.fix(a.mu / KJ, 1)} kJ/mol`, 0, -0.08, { size: 11.5, color: 'muted' });
          sbx.text(`P₂ = ${v.fix(b.P / BAR, 2)} bar · μ₂ = ${v.fix(b.mu / KJ, 1)} kJ/mol`, 0, -0.18, { size: 11.5, color: 'muted' });
          st = { a, b, S: Stot(cur[0], cur[1]), S0: Stot(path[0][0], path[0][1]), done: u >= 1 };
        }, { period: 7, still: 6 });
        v.legend([['orange', '$T_1 = T_2$'], ['blue', '$P_1 = P_2$ (movable)'], ['purple', '$\\mu_1 = \\mu_2$ (permeable)'], ['gold', 'spontaneous relaxation']]);
        v.readout(() => {
          if (!st) return '';
          const { a, b, S, S0, done } = st;
          return `$1/T_1 - 1/T_2$ = $${v.sci(1 / a.T - 1 / b.T, 2)}$ K⁻¹ · $P_1/T_1 - P_2/T_2$ = $${v.sci((a.P / a.T - b.P / b.T) * L, 2)}$ J/(K·L) · $\\mu_1/T_1 - \\mu_2/T_2$ = $${v.sci(a.mu / a.T - b.mu / b.T, 2)}$ J/(K·mol) · total entropy gained since release: **${v.fix(S - S0, 3)} J/K** ${done ? '— at the maximum the brackets of the free variables vanish' : '(still climbing)'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5', kind: 'Theorem', name: 'Euler relation',
      statement: String.raw`If the fundamental relation is first-order homogeneous, $S(\lambda U, \lambda V, \lambda N) = \lambda S(U, V, N)$ for all $\lambda > 0$ (extensivity), then
$$U = TS - PV + \mu N,\qquad\text{equivalently}\qquad S = \frac UT + \frac{PV}{T} - \frac{\mu N}{T}.$$
For several species, $\mu N$ becomes $\sum_j \mu_j N_j$. The relation fails for systems that are not extensive: small systems whose surface contributes, or systems with long-range forces (gravitating clusters).`,
      idea: String.raw`Differentiate the homogeneity identity with respect to $\lambda$ and set $\lambda = 1$ (Euler's theorem on homogeneous functions): $S = U\,\partial_U S + V\,\partial_V S + N\,\partial_N S$, and the partial derivatives are $1/T$, $P/T$, $-\mu/T$ (3.2). Geometrically, $\lambda \mapsto S(\lambda X)$ is a straight line through the origin, so its tangent at $\lambda = 1$ — whose slope is the right-hand side — passes through the origin too. The thermodynamic identity (3.3) then "integrates" to the Euler form because $T$, $P$, $\mu$ stay fixed as the system is scaled. The multivariable chain rule (pma 9.15) supplies the precise derivative: for a differentiable fundamental relation on its open thermodynamic domain, $dS(\lambda U,\lambda V,\lambda N)/d\lambda=U S_U+V S_V+N S_N$, evaluated at the scaled state. At $\lambda=1$ homogeneity makes that derivative equal to $S(U,V,N)$.`,
      caption: String.raw`Choose a model and **drag $\lambda$**: the left panel plots $S(\lambda U, \lambda V, \lambda N)$ against $\lambda$ (gold), with the straight line $\lambda S$ (dashed) and the tangent at $\lambda = 1$ (green). For extensive models the three coincide. The right panel is a waterfall: $TS$, $-PV$ and $\mu N$, with $T$, $P$, $\mu$ measured as finite-difference slopes of $S$, add up to $U$ exactly. The photon gas has $\mu = 0$ and still balances. The last model adds a surface term $\propto N^{2/3}$ (a small droplet): $S(\lambda X)$ bends away from the line and the Euler sum misses $U$ by the surface contribution.`,
      deps: ['thermo-3.3', 'pma-9.15'],
      see: ['thermo-3.6'],
      refs: ['Callen ch. 3'],
      tags: ['extensivity', 'Euler relation'],
      credit: 'Euler (homogeneous functions), 1755; Gibbs, 1876',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Homogeneous_function#Euler%27s_theorem' },
      viz(v) {
        const aRad = 7.565733e-16; // radiation constant 4σ/c (J m⁻³ K⁻⁴)
        const which = v.select('model', [{ value: 'ideal', label: 'ideal gas (Ar)' }, { value: 'vdw', label: 'van der Waals (CO₂)' }, { value: 'photon', label: 'photon gas' }, { value: 'drop', label: 'droplet with surface term' }], 'vdw');
        const lam = v.slider('$\\lambda$', 0.05, 3, 2, { step: 0.01, fmt: (x) => v.fix(x, 2) });
        const sl = v.stage({ x: [0, 3.1], y: [0, 1], height: 320, axes: 'box', gutter: true, xlabel: 'λ', ylabel: 'S (J/K)', weight: 1, title: '$S(\\lambda U, \\lambda V, \\lambda N)$ against $\\lambda$' });
        const sb = v.stage({ x: [-0.6, 4.6], y: [-1, 1], height: 320, axes: 'box', gutter: true, weight: 1, title: '$TS - PV + \\mu N$ against $U$', xticks: [[0, 'TS'], [1, '−PV'], [2, 'μN'], [3, 'sum'], [4, 'U']] });
        const Mi = vdw('Ar', true), Mv = vdw('CO2');
        const MODELS = {
          ideal: { X: [3718, 22.4e-3, 1], S: (U, V, N) => sUVN(Mi, U, V, N), unit: 'kJ', sc: 1e-3 },
          vdw: { X: [6000, 1.0e-3, 1], S: (U, V, N) => sUVN(Mv, U, V, N), unit: 'kJ', sc: 1e-3 },
          photon: { X: [aRad * 3000 ** 4, 1, 1], S: (U, V) => 4 / 3 * (aRad * V) ** 0.25 * U ** 0.75, unit: 'mJ', sc: 1e3 },
          // toy: an ideal gas whose entropy carries a surface deficit −c R N^(2/3) (N in mol), c chosen to be visible
          drop: { X: [3718, 22.4e-3, 1], S: (U, V, N) => sUVN(Mi, U, V, N) - 4 * R * N ** (2 / 3), unit: 'kJ', sc: 1e-3 },
        };
        let st = null;
        v.render(() => {
          const Md = MODELS[which.value], [U, V, N] = Md.X, S = Md.S;
          const Sl = (l) => S(l * U, l * V, l * N), S1 = Sl(1);
          const x0 = [U, V, N];
          const SU = dpart(S, x0, 0, 1e-5 * U), SV = dpart(S, x0, 1, 1e-5 * V), SN = dpart(S, x0, 2, 1e-5 * N);
          const T = 1 / SU, P = SV * T, mu = -SN * T;
          const ys = []; for (let i = 1; i <= 60; i++) ys.push(Sl(3.1 * i / 60));
          const slope0 = U * SU + V * SV + N * SN;
          const ymin = Math.min(0, ...ys, S1 - slope0), ymax = Math.max(...ys, 3.1 * S1);
          sl.setView([0, 3.1], [ymin, ymax * 1.08]);
          sl.fn((l) => l * S1, { color: 'ink', dash: [6, 4], width: 1.4, domain: [0, 3.1] });
          const slope = U * SU + V * SV + N * SN; // dS(λX)/dλ at λ = 1, from the measured slopes
          sl.fn((l) => S1 + slope * (l - 1), { color: 'green', width: 2.2, domain: [0, 3.1] });
          sl.fn(Sl, { color: 'gold', width: 2.6, domain: [0.02, 3.1] });
          sl.dot(1, S1, { r: 5, color: 'green' });
          sl.dot(lam.value, Sl(lam.value), { r: 6, color: 'gold' });
          sl.dot(0, S1 - slope, { r: 4.5, color: 'green', hollow: true });
          sl.text(`tangent meets λ = 0 at ${v.fix(Math.abs(S1 - slope) < 5e-4 ? 0 : S1 - slope, 3)} J/K`, 0.08, S1 - slope, { dx: 8, dy: -12, size: 11, color: 'green', plate: true });
          // waterfall
          const sc = Md.sc, parts = [T * S1 * sc, -P * V * sc, mu * N * sc], sum = parts[0] + parts[1] + parts[2], Uu = U * sc;
          const tops = [parts[0], parts[0] + parts[1], sum, sum, Uu];
          const yl = Math.min(0, ...tops), yh = Math.max(0, ...tops), pad = 0.12 * (yh - yl);
          sb.setView([-0.6, 4.6], [yl - pad, yh + pad]); sb.setLabels(undefined, Md.unit);
          sb.hline(0, { color: 'muted', width: 1 });
          let acc = 0; const cl = ['red', 'blue', 'purple'];
          parts.forEach((p, i) => { bar(sb, i, acc + p, 0.32, cl[i], { base: acc }); acc += p; sb.line(i + 0.32, acc, i + 0.68, acc, { color: 'faint', dash: [3, 3] }); });
          bar(sb, 3, sum, 0.32, 'green'); bar(sb, 4, Uu, 0.32, 'gold');
          [parts[0], parts[1], parts[2], sum, Uu].forEach((p, i) => sb.text(v.fix(p, 3), i, i < 3 ? (i ? tops[i - 1] : 0) + p / 2 : p / 2, { align: 'center', size: 11, plate: true }));
          st = { T, P, mu, sum, Uu, S1, Sl: Sl(lam.value), unit: Md.unit, ratio: Sl(lam.value) / (lam.value * S1) };
        });
        v.legend([['gold', '$S(\\lambda X)$'], ['ink', '$\\lambda S(X)$', { dash: true }], ['green', 'tangent at $\\lambda = 1$']]);
        v.readout(() => {
          if (!st) return '';
          const { T, P, mu, sum, Uu, Sl, ratio, unit } = st;
          return `measured slopes: $T$ = ${v.fix(T, 2)} K, $P$ = ${v.fmt(P / BAR, 4)} bar, $\\mu$ = ${which.value === 'photon' ? '$' + v.sci(mu, 1) + '$ J (zero: photons are not conserved)' : v.fix(mu / KJ, 3) + ' kJ/mol'} · $TS - PV + \\mu N$ = **${v.fix(sum, 4)} ${unit}** vs $U$ = **${v.fix(Uu, 4)} ${unit}** · at $\\lambda$ = ${v.fix(lam.value, 2)}: $S(\\lambda X)/\\lambda S(X)$ = ${v.fix(ratio, 5)} ${Math.abs(ratio - 1) < 1e-6 ? '(extensive)' : '(not extensive: Euler fails)'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6', kind: 'Theorem', name: 'Gibbs–Duhem relation',
      statement: String.raw`For a simple extensive system,
$$S\,dT - V\,dP + N\,d\mu = 0,\qquad\text{i.e.}\qquad d\mu = -s\,dT + v\,dP$$
with molar (or per-particle) entropy $s = S/N$ and volume $v = V/N$. Hence the intensive variables $T$, $P$, $\mu$ are not independent: a one-component system has only two intensive degrees of freedom, and $\mu(T, P)$ is the molar Gibbs free energy. With $r$ components, $S\,dT - V\,dP + \sum_j N_j\,d\mu_j = 0$ leaves $r + 1$ independent intensive variables.`,
      idea: String.raw`Differentiate the Euler relation (3.5) $U = TS - PV + \mu N$ completely, $dU = T\,dS + S\,dT - P\,dV - V\,dP + \mu\,dN + N\,d\mu$, and subtract the thermodynamic identity $dU = T\,dS - P\,dV + \mu\,dN$ (3.3). What is left is a relation among the differentials of the intensive variables alone. Because $d\mu$ is an exact differential, integrating $-s\,dT + v\,dP$ between two states gives the same $\Delta\mu$ along every path — a strong numerical test. Gibbs–Duhem underlies the phase rule and the Clausius–Clapeyron equation (chapter 4).`,
      caption: String.raw`The colour map is the chemical potential $\mu(T, P)$ of carbon dioxide as a van der Waals fluid above its critical temperature (or as an ideal gas). **Drag A and B** and choose a route. Along the route the program solves the equation of state for $v(T, P)$, computes $s(T, v)$, and integrates $-s\,dT + v\,dP$ step by step (right panel: the running integral in gold, its two pieces in red and blue). The integral lands on $\mu(B) - \mu(A)$ computed directly, whichever route you take: $\mu$ is fixed once $T$ and $P$ are, so the three intensive variables are never independent.`,
      deps: ['thermo-3.5'],
      see: ['thermo-3.9'],
      refs: ['Callen ch. 3'],
      tags: ['Gibbs–Duhem', 'chemical potential'],
      credit: 'Gibbs, 1876; Duhem, 1886',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gibbs%E2%80%93Duhem_equation' },
      viz(v) {
        const model = v.select('CO₂ as', [{ value: 'vdw', label: 'van der Waals' }, { value: 'ideal', label: 'ideal gas' }], 'vdw');
        const route = v.select('route A → B', [{ value: 'line', label: 'straight' }, { value: 'TP', label: 'T first, then P' }, { value: 'PT', label: 'P first, then T' }, { value: 'wig', label: 'wiggly' }], 'wig');
        const T0 = 310, T1 = 560, P0 = 1, P1 = 200;
        const sm = v.stage({ x: [T0, T1], y: [P0, P1], ylog: true, height: 330, axes: 'box', gutter: true, xlabel: 'T (K)', ylabel: 'P (bar)', weight: 1.1, title: 'chemical potential $\\mu(T, P)$ (kJ/mol)' });
        const sp = v.stage({ x: [0, 1], y: [-1, 1], height: 330, axes: 'box', gutter: true, xlabel: 'fraction of the route', ylabel: 'kJ/mol', weight: 1, title: 'integrating $d\\mu = -s\\,dT + v\\,dP$ along the route' });
        const A = sm.handle(330, 20, { color: 'accent', label: 'A', constrain: { x: [T0 + 5, T1 - 5], y: [P0 + 2, P1 - 3] } });
        const B = sm.handle(520, 150, { color: 'gold', label: 'B', constrain: { x: [T0 + 5, T1 - 5], y: [P0 + 2, P1 - 3] } });
        let st = null;
        v.render(() => {
          const M = vdw('CO2', model.value === 'ideal');
          const mu = (T, PB) => { const vv = M.vOf(T, PB * BAR); return M.g(T, vv); };
          sm.heat((T, PB) => mu(T, PB) / KJ, { range: [-62, -18], cmap: 'theme', color: 'purple', res: 4, key: 'mu' + model.value });
          sm.contour((T, PB) => mu(T, PB) / KJ, [-52, -48, -44, -40, -36, -32, -28, -24], { color: 'ink', width: 0.8, alpha: 0.4, labels: true, fmt: (x) => x.toFixed(0), res: 60 });
          if (model.value === 'vdw') sm.text(`critical point ${v.fix(M.Tc, 0)} K, ${v.fix(M.Pc / BAR, 0)} bar (off the left edge)`, T1 - 4, 1.35, { size: 11, color: 'muted', plate: true, align: 'right' });
          const r = route.value, a = [A.x, A.y], b = [B.x, B.y];
          const at = (u) => {
            if (r === 'line') return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
            if (r === 'TP') return u < 0.5 ? [lerp(a[0], b[0], 2 * u), a[1]] : [b[0], lerp(a[1], b[1], 2 * u - 1)];
            if (r === 'PT') return u < 0.5 ? [a[0], lerp(a[1], b[1], 2 * u)] : [lerp(a[0], b[0], 2 * u - 1), b[1]];
            const wv = Math.sin(3 * Math.PI * u);
            return [clamp(lerp(a[0], b[0], u) + 60 * wv * (1 - Math.abs(2 * u - 1) ** 6), T0 + 1, T1 - 1), clamp(Math.exp(lerp(Math.log(a[1]), Math.log(b[1]), u) - 0.9 * wv), P0 + 0.1, P1 - 1)];
          };
          const n = 1200, pts = [], run = [[0, 0]], rs = [[0, 0]], rv = [[0, 0]];
          let I = 0, Is = 0, Iv = 0, prev = at(0);
          pts.push(prev);
          for (let i = 1; i <= n; i++) {
            const q = at(i / n), mid = [(prev[0] + q[0]) / 2, (prev[1] + q[1]) / 2], vv = M.vOf(mid[0], mid[1] * BAR), s = M.s(mid[0], vv);
            const ds = -s * (q[0] - prev[0]), dv = vv * (q[1] - prev[1]) * BAR;
            Is += ds; Iv += dv; I += ds + dv; prev = q; pts.push(q);
            if (i % 10 === 0) { run.push([i / n, I / KJ]); rs.push([i / n, Is / KJ]); rv.push([i / n, Iv / KJ]); }
          }
          sm.path(pts, { color: 'ink', width: 2.6 });
          sm.path(pts, { color: 'gold', width: 1.4 });
          const direct = (mu(b[0], b[1]) - mu(a[0], a[1])) / KJ;
          const all = [...run, ...rs, ...rv].map((p) => p[1]), lo = Math.min(0, ...all, direct), hi = Math.max(0, ...all, direct), pad = 0.1 * (hi - lo || 1);
          sp.setView([0, 1], [lo - pad, hi + pad]);
          sp.hline(0, { color: 'muted', width: 1 });
          sp.hline(direct, { color: 'green', width: 1.6, dash: [6, 4] });
          sp.path(rs, { color: 'red', width: 1.8 }); sp.path(rv, { color: 'blue', width: 1.8 }); sp.path(run, { color: 'gold', width: 3 });
          sp.dot(1, I / KJ, { r: 5, color: 'gold' });
          const vA = M.vOf(a[0], a[1] * BAR);
          st = { I: I / KJ, direct, sA: M.s(a[0], vA), vA, Z: a[1] * BAR * vA / (R * a[0]) };
        });
        v.legend([['gold', '$\\int(-s\\,dT + v\\,dP)$ so far'], ['red', '$-\\int s\\,dT$'], ['blue', '$\\int v\\,dP$'], ['green', 'direct $\\Delta\\mu$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { I, direct, sA, vA, Z } = st;
          return `at A: $s$ = ${v.fix(sA, 2)} J/(K·mol), $v$ = ${v.fix(vA / L, 4)} L/mol (compressibility $Pv/RT$ = ${v.fix(Z, 4)}) · route integral of $-s\\,dT + v\\,dP$ = **${v.fix(I, 4)} kJ/mol** · direct $\\mu(B) - \\mu(A)$ = **${v.fix(direct, 4)} kJ/mol** · difference $${v.sci(Math.abs(I - direct), 1)}$ kJ/mol (discretization only)`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7', kind: 'Method', name: 'Legendre transforms and thermodynamic potentials',
      statement: String.raw`Let $U(S)$ be a convex function (other variables held fixed) with slope $T = U'(S)$. Its **Legendre transform** is
$$F(T) = \min_S\,\big[U(S) - TS\big] = U(S^*) - TS^*,\qquad U'(S^*) = T,$$
the intercept on the $U$ axis of the tangent line of slope $T$. Then $F'(T) = -S^*$, $F$ is concave, and transforming back, $U(S) = \max_T\,[F(T) + TS]$, recovers $U$: the transform loses no information. Applied to the energy form $U(S, V, N)$ this produces the **thermodynamic potentials**
$$F = U - TS,\quad H = U + PV,\quad G = U - TS + PV,$$
with $dF = -S\,dT - P\,dV + \mu\,dN$, $dH = T\,dS + V\,dP + \mu\,dN$, $dG = -S\,dT + V\,dP + \mu\,dN$, each a complete fundamental relation in its natural variables. If $U$ is not convex, the double transform returns its convex hull instead.`,
      idea: String.raw`A convex curve is the envelope of its tangent lines, and a line is fixed by its slope and intercept, so the family "intercept as a function of slope" describes the curve as completely as "height as a function of position" does. Differentiating $F = U(S^*) - TS^*$ and using $U'(S^*) = T$ kills the $dS^*$ term, leaving $dF = -S^*\,dT$; this is why the transformed variable's conjugate appears as the new slope. The same construction is Hamilton's passage from Lagrangian to Hamiltonian (mech 12.1). When $U$ has a non-convex stretch, tangents of one slope touch it twice, the minimum jumps between them, $F$ develops a corner, and the back-transform bridges the stretch with a straight segment — the signature of a first-order phase transition (3.15, 4.1).`,
      caption: String.raw`Left: a curve $U(S)$ with a fan of tangent lines (its envelope). **Drag the slope $T$**: the gold tangent touches at $S^*$ and cuts the $U$ axis at $F(T)$. Right: the transform $F(T)$, built point by point as a minimum over $S$, with the slope $-S^*$ at the current $T$. Turn on **transform back** to compute $\max_T[F(T) + TS]$ (green dashed): on a convex curve it reproduces $U$ exactly; on the non-convex curve it returns the convex hull — the red region is information the free energy never saw — and $F$ has a corner. The units are dimensionless ($S$ in units of $Nk$).`,
      deps: ['thermo-3.3', 'mech-12.1'],
      see: ['thermo-3.15'],
      refs: ['Callen ch. 5'],
      tags: ['Legendre transform', 'free energy'],
      credit: 'Legendre, 1787; Gibbs, 1875',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Legendre_transformation' },
      viz(v) {
        const CURVES = {
          gas: { label: 'ideal gas $U \\propto e^{2S/3}$', U: (S) => Math.exp(2 * S / 3), T: [0.6, 5] },
          osc: { label: 'harmonic $U = 1 + S^2/2$', U: (S) => 1 + S * S / 2, T: [-0.5, 4] },
          bump: { label: 'non-convex', U: (S) => 1 + 0.55 * S * S - 0.3 * S + 1.15 * Math.exp(-((S - 2) ** 2) / 0.18), T: [-0.5, 4] },
        };
        const which = v.select('curve', Object.entries(CURVES).map(([value, o]) => ({ value, label: o.label })), 'bump');
        const Tsl = v.slider('slope $T$', -0.5, 5, 1.3, { step: 0.01, fmt: (x) => v.fix(x, 2) });
        const back = v.toggle('transform back', true);
        const SMAX = 4;
        const sl = v.stage({ x: [0, SMAX], y: [-8, 10], height: 340, axes: 'box', gutter: true, xlabel: 'S', ylabel: 'U', weight: 1.1, title: '$U(S)$ and its tangent lines' });
        const sr = v.stage({ x: [-0.5, 5], y: [-8, 2], height: 340, axes: 'box', gutter: true, xlabel: 'T', ylabel: 'F', weight: 1, title: '$F(T) = \\min_S\\,[U(S) - TS]$' });
        const NS = 800, Ss = Array.from({ length: NS + 1 }, (_, i) => SMAX * i / NS);
        let st = null;
        v.render(() => {
          const C = CURVES[which.value], U = C.U, Us = Ss.map(U);
          const [Ta, Tb] = C.T, T = clamp(Tsl.value, Ta, Tb);
          const Ft = (t) => { let m = Infinity, k = 0; for (let i = 0; i <= NS; i++) { const f = Us[i] - t * Ss[i]; if (f < m) { m = f; k = i; } } return [m, Ss[k]]; };
          const [F0, Sst] = Ft(T);
          const Umax = Math.max(...Us), Fmin = Ft(Tb)[0];
          sl.setView([0, SMAX], [Math.min(-1, Fmin - 0.5), Umax * 1.05]);
          sr.setView([Ta, Tb], [Fmin - 0.5, Math.max(...[Ta, (Ta + Tb) / 2].map((t) => Ft(t)[0])) + 1]);
          // fan of tangents
          for (let k = 0; k <= 16; k++) { const t = Ta + (Tb - Ta) * k / 16, [f] = Ft(t); sl.line(0, f, SMAX, f + t * SMAX, { color: 'faint', width: 1 }); }
          // back transform: max over T of F(T) + T S  (T sampled finely)
          const NT = 400, Ts = Array.from({ length: NT + 1 }, (_, i) => Ta - 3 + (Tb - Ta + 6) * i / NT), Fs = Ts.map((t) => Ft(t)[0]);
          const Ubb = (S) => { let m = -Infinity; for (let i = 0; i <= NT; i++) m = Math.max(m, Fs[i] + Ts[i] * S); return m; };
          let gap = 0;
          if (back.value) {
            const lost = [];
            for (let i = 0; i <= 200; i++) { const S = SMAX * i / 200, d = U(S) - Ubb(S); if (S > 0.15 && S < SMAX - 0.15) gap = Math.max(gap, d); lost.push(d > 1e-3 ? 1 : 0); }
            if (gap > 1e-3) sl.between(U, Ubb, 0.15, SMAX - 0.15, { fill: 'red', fillAlpha: 0.3 });
          }
          sl.fn(U, { color: 'ink', width: 2.6, domain: [0, SMAX] });
          if (back.value) sl.fn(Ubb, { color: 'green', width: 2.2, dash: [7, 5], domain: [0.05, SMAX - 0.05] });
          sl.line(0, F0, SMAX, F0 + T * SMAX, { color: 'gold', width: 2.4 });
          sl.dot(Sst, U(Sst), { r: 5.5, color: 'gold', label: 'S*', labelPos: 'se' });
          sl.dot(0, F0, { r: 6, color: 'orange' });
          sl.tex('F(T)', 0, F0, { dx: 28, dy: 16, color: 'orange', size: 14 });
          // F(T)
          sr.fn((t) => Ft(t)[0], { color: 'orange', width: 2.6, domain: [Ta, Tb], n: 300 });
          sr.line(T - 0.6, F0 + 0.6 * Sst, T + 0.6, F0 - 0.6 * Sst, { color: 'ink', width: 1.6 });
          sr.dot(T, F0, { r: 6, color: 'orange' });
          sr.text(`slope −S* = ${v.fix(-Sst, 2)}`, T, F0, { dx: 10, dy: 16, size: 11, plate: true });
          const dF = (Ft(T + 1e-3)[0] - Ft(T - 1e-3)[0]) / 2e-3;
          st = { T, F0, Sst, dF, gap };
        });
        v.legend([['ink', '$U(S)$'], ['gold', 'tangent of slope $T$'], ['orange', '$F(T)$ = intercept'], ['green', '$\\max_T[F + TS]$', { dash: true }], ['red', 'lost by the transform', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { T, F0, Sst, dF, gap } = st;
          return `$T$ = ${v.fix(T, 2)}: tangent point $S^*$ = ${v.fix(Sst, 3)}, $F(T) = U(S^*) - TS^*$ = **${v.fix(F0, 4)}** · measured $dF/dT$ = ${v.fix(dF, 3)} ≈ $-S^*$ · back-transform: largest gap $U - \\max_T[F + TS]$ = ${back.value ? v.fix(gap, 4) + (gap > 1e-3 ? ' — the non-convex stretch is replaced by its convex hull' : ' — U recovered exactly') : '(off)'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8', kind: 'Definition', name: 'Helmholtz free energy',
      statement: String.raw`The **Helmholtz free energy** is the Legendre transform of $U$ with respect to $S$ (3.7):
$$F = U - TS,\qquad dF = -S\,dT - P\,dV + \mu\,dN,$$
a fundamental relation in its natural variables $(T, V, N)$, with $S = -(\partial F/\partial T)_{V,N}$ and $P = -(\partial F/\partial V)_{T,N}$. For a system in thermal contact with a reservoir at temperature $T$, the work it can deliver in a process between equilibrium states at that temperature satisfies
$$W_{\text{by}} \le -\Delta F,$$
with equality for a reversible process. The energy $U$ is not the relevant budget: the heat $T\Delta S$ drawn from the reservoir pays for part of the work (or absorbs part of it).`,
      idea: String.raw`The system plus reservoir is isolated, so its total entropy cannot fall (2.10): $\Delta S + \Delta S_{\text{res}} \ge 0$ with $\Delta S_{\text{res}} = -Q/T$. Hence $Q \le T\Delta S$, and the first law (1.11) gives $W_{\text{by}} = Q - \Delta U \le T\Delta S - \Delta U = -\Delta F$. "Free" energy is the part of $U$ that can be freed as work at constant temperature. For an ideal gas $U$ depends on $T$ only, so in an isothermal expansion $\Delta U = 0$ and *all* the work comes from the bath; for a van der Waals gas the attraction makes $\Delta U > 0$ and the bath must supply even more.`,
      caption: String.raw`One mole of gas in a cylinder on a heat bath expands from 0.4 L. **Drag the end point** on the $P$–$V$ diagram and choose the process: a slow, reversible expansion along the isotherm (the shaded area is the work), or a sudden one against a constant external pressure equal to the final pressure (only the rectangle is work). The ledger compares the work delivered with $-\Delta F$, $-\Delta U$, the heat $Q$ drawn from the bath, and $T\Delta S$ — all computed from the van der Waals state functions. Reversibly, $W = -\Delta F$ to every digit; suddenly, $W < -\Delta F$ and the shortfall is entropy produced.`,
      deps: ['thermo-3.7'],
      see: ['thermo-3.10', 'thermo-3.11'],
      refs: ['Schroeder §5.1'],
      tags: ['free energy', 'work'],
      credit: 'Helmholtz, 1882',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Helmholtz_free_energy' },
      viz(v) {
        const gas = v.select('gas', [{ value: 'ideal', label: 'ideal gas' }, { value: 'vdw', label: 'van der Waals CO₂' }], 'vdw');
        const proc = v.select('process', [{ value: 'rev', label: 'slow (reversible)' }, { value: 'irr', label: 'sudden, against the final pressure' }], 'rev');
        const Tsl = v.slider('bath $T$', 320, 500, 340, { step: 1, fmt: (x) => x.toFixed(0) + ' K' });
        const V1 = 0.4;
        const sc = v.stage({ x: [0, 1], y: [-0.25, 1.35], height: 320, axes: false, weight: 0.5, minWidth: 150, title: 'gas on a heat bath' });
        const sp = v.stage({ x: [0, 4.2], y: [0, 70], height: 320, axes: 'box', gutter: true, xlabel: 'V (L)', ylabel: 'P (bar)', weight: 1.1, title: 'isothermal expansion' });
        const sb = v.stage({ x: [-0.6, 4.6], y: [0, 1], height: 320, axes: 'box', gutter: true, ylabel: 'kJ', weight: 1, title: 'energy ledger', xticks: [[0, 'W by gas'], [1, '−ΔF'], [2, '−ΔU'], [3, 'Q from bath'], [4, 'TΔS']] });
        const M0 = { ideal: vdw('CO2', true), vdw: vdw('CO2') };
        const hd = sp.handle(3, 0, { color: 'gold', label: 'end', constrain: (x) => { const M = M0[gas.value], xx = clamp(x, 0.6, 4); return [xx, M.P(Tsl.value, xx * L) / BAR]; } });
        let st = null;
        v.render(() => {
          const M = M0[gas.value], T = Tsl.value, V2 = hd.x, v1 = V1 * L, v2 = V2 * L;
          const Pb = (VL) => M.P(T, VL * L) / BAR;
          if (!hd.dragging) hd.set(V2, Pb(V2));
          const ymax = Math.min(Pb(V1) * 1.1, 120);
          sp.setView([0, 4.2], [0, ymax]);
          sp.fn(Pb, { color: 'ink', width: 2.2, domain: [0.25, 4.2] });
          const P2 = Pb(V2);
          const Wrev = simpson((x) => M.P(T, x), v1, v2, 400), Wirr = P2 * BAR * (v2 - v1);
          const rev = proc.value === 'rev', W = rev ? Wrev : Wirr;
          if (rev) sp.between(Pb, () => 0, V1, V2, { fill: 'orange', fillAlpha: 0.35 });
          else { sp.rect(V1, 0, V2, P2, { fill: 'orange', fillAlpha: 0.35, color: 'orange', width: 1.4 }); sp.line(V1, Pb(V1), V1, P2, { color: 'red', width: 1.6, dash: [4, 3] }); sp.text('pressure drops suddenly', V1, (Pb(V1) + P2) / 2, { dx: 8, size: 11, color: 'red' }); }
          sp.dot(V1, Pb(V1), { r: 5, color: 'accent', label: 'start', labelPos: 'ne' });
          sp.text(`isotherm ${T} K`, 1.0, Pb(1.0), { dx: 8, dy: -6, size: 11, color: 'ink', plate: true });
          const dF = M.f(T, v2) - M.f(T, v1), dU = M.u(T, v2) - M.u(T, v1), dS = M.s(T, v2) - M.s(T, v1), Q = dU + W;
          const vals = [W, -dF, -dU, Q, T * dS].map((x) => x / KJ), lo = Math.min(0, ...vals), hi = Math.max(...vals);
          sb.setView([-0.6, 4.6], [lo - 0.1 * (hi - lo), hi * 1.15]);
          sb.hline(0, { color: 'muted', width: 1 });
          const cl = ['orange', 'green', 'purple', 'red', 'red'];
          vals.forEach((x, i) => { bar(sb, i, x, 0.32, cl[i], { alpha: i === 4 ? 0.35 : 0.78 }); sb.text(v.fix(x, 3), i, x, { dy: x >= 0 ? -10 : 12, align: 'center', size: 11, plate: true }); });
          if (!rev) sb.rect(-0.32, vals[0], 0.32, vals[1], { fill: 'red', fillAlpha: 0.12, hatch: 'red', color: 'red', width: 1, dash: [3, 3] });
          // cylinder drawing
          const frac = clamp((V2 - 0) / 4.2, 0.08, 1);
          cylinder(v, sc, 0.22, 0, 0.56, 1, frac, 'blue', { stand: 'hot', standLabel: `bath ${T} K`, alpha: 0.35, dots: DOTS.slice(0, 60) });
          st = { W, dF, dU, Q, dS, T, Wrev, rev };
        });
        v.readout(() => {
          if (!st) return '';
          const { W, dF, dU, Q, dS, T, rev } = st;
          return `work delivered $W_{\\text{by}}$ = **${kj(v, W, 3)}** · $-\\Delta F$ = **${kj(v, -dF, 3)}** · $-\\Delta U$ = ${kj(v, -dU, 3)} · heat from the bath $Q = \\Delta U + W$ = ${kj(v, Q, 3)} · $T\\Delta S$ = ${kj(v, T * dS, 3)} · ${rev ? 'reversible: $W = -\\Delta F$ and $Q = T\\Delta S$' : `sudden: $W < -\\Delta F$ by ${kj(v, -dF - W, 3)}, entropy produced $\\Delta S - Q/T$ = ${v.fix(dS - Q / T, 3)} J/K`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9', kind: 'Definition', name: 'Gibbs free energy',
      statement: String.raw`The **Gibbs free energy** is the Legendre transform of $U$ with respect to both $S$ and $V$:
$$G = U - TS + PV = H - TS,\qquad dG = -S\,dT + V\,dP + \mu\,dN,$$
natural variables $(T, P, N)$; for one species $G = \mu N$ by the Euler relation (3.5). For a system held at the temperature $T$ and pressure $P$ of its surroundings, the work *other than* $P\,dV$ work that a process can deliver — electrical work of a battery or fuel cell, work of a muscle — satisfies
$$W_{\text{other}} \le -\Delta G = -(\Delta H - T\Delta S),$$
with equality for a reversible process. For an electrochemical cell transferring $n$ moles of electrons per mole of reaction, the reversible voltage is $E = -\Delta G/(nF)$.`,
      idea: String.raw`As for the Helmholtz bound (3.8), combine the first law with the entropy of the surroundings, now also crediting the work $P\,\Delta V$ done on the atmosphere: total entropy cannot decrease, so $W_{\text{other}} \le -(\Delta U + P\Delta V - T\Delta S) = -\Delta G$. Of the reaction enthalpy $-\Delta H$ released, the part $-T\Delta S$ must be exchanged as heat with the surroundings even in the ideal limit; when $\Delta S < 0$ (as for hydrogen + oxygen → water) a fuel cell must reject heat, when $\Delta S > 0$ it would absorb heat and deliver more work than $-\Delta H$. No Carnot factor appears: a fuel cell is not a heat engine.`,
      caption: String.raw`Pick a cell. The energy-flow diagram splits the enthalpy of reaction (per mole) into the electrical work $-\Delta G$ (orange) and the heat that must leave (red); **lower the operating voltage** (a real cell under load) and part of the work turns into extra heat. Right: the reversible voltage $E = -\Delta G/nF$ against temperature, with $\Delta H$ and $\Delta S$ taken from CODATA standard data and held constant; the dot marks the slider temperature, and its slope is $\Delta S/nF$. Data: CODATA Key Values for Thermodynamics (Cox, Wagman & Medvedev, 1989).`,
      deps: ['thermo-3.7'],
      see: ['thermo-1.14', 'thermo-3.6'],
      refs: ['Schroeder §5.1', 'CODATA Key Values for Thermodynamics (1989)'],
      tags: ['Gibbs free energy', 'electrochemistry'],
      credit: 'Gibbs, 1876; Helmholtz, 1882 (galvanic cells)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gibbs_free_energy' },
      viz(v) {
        // CODATA (1989) ΔfH° (kJ/mol) and S° (J/(K mol)) at 298.15 K
        const D = { H2Ol: [-285.830, 69.95], H2Og: [-241.826, 188.835], H2: [0, 130.680], O2: [0, 205.152], Zn: [0, 41.63], Zn2: [-153.39, -109.8], Cu: [0, 33.15], Cu2: [64.9, -98] };
        const rx = (prod, reac) => { const H = prod.reduce((s, [k, c]) => s + c * D[k][0], 0) - reac.reduce((s, [k, c]) => s + c * D[k][0], 0); const S = prod.reduce((s, [k, c]) => s + c * D[k][1], 0) - reac.reduce((s, [k, c]) => s + c * D[k][1], 0); return { dH: H * KJ, dS: S }; };
        const CELLS = {
          fcl: { label: 'H₂ fuel cell → liquid water', eq: '\\mathrm{H_2 + \\tfrac12 O_2 \\to H_2O(l)}', n: 2, ...rx([['H2Ol', 1]], [['H2', 1], ['O2', 0.5]]), range: [273.15, 373.15] },
          fcg: { label: 'H₂ fuel cell → steam', eq: '\\mathrm{H_2 + \\tfrac12 O_2 \\to H_2O(g)}', n: 2, ...rx([['H2Og', 1]], [['H2', 1], ['O2', 0.5]]), range: [373.15, 1273.15] },
          dan: { label: 'Daniell cell', eq: '\\mathrm{Zn + Cu^{2+} \\to Zn^{2+} + Cu}', n: 2, ...rx([['Zn2', 1], ['Cu', 1]], [['Zn', 1], ['Cu2', 1]]), range: [273.15, 373.15] },
        };
        const cell = v.select('cell', Object.entries(CELLS).map(([value, o]) => ({ value, label: o.label })), 'fcl', { onChange: () => { const c = CELLS[cell.value]; Tsl.set(c.range[0] < 300 ? 298.15 : 800); } });
        const Tsl = v.slider('temperature', 273.15, 1273.15, 298.15, { step: 0.5, fmt: (x) => v.fix(x, 1) + ' K' });
        const load = v.slider('operating voltage / reversible', 0.3, 1, 1, { step: 0.01, fmt: (x) => Math.round(x * 100) + ' %' });
        const sf = v.stage({ x: [0, 11], y: [0, 6], height: 330, equal: true, axes: false, weight: 1.15, title: 'where the reaction enthalpy goes (per mole)' });
        const se = v.stage({ x: [273, 373], y: [0.9, 1.3], height: 330, axes: 'box', gutter: true, xlabel: 'T (K)', ylabel: 'E (V)', weight: 1, title: 'reversible cell voltage $E = -\\Delta G/nF$' });
        let st = null;
        v.render(() => {
          const c = CELLS[cell.value], T = clamp(Tsl.value, c.range[0], c.range[1]);
          const dG = c.dH - T * c.dS, E = -dG / (c.n * FARADAY), Wel = -dG * load.value, Qout = -c.dH - Wel;
          // energy flow: reactants → cell → work and heat (band widths ∝ energy)
          const scale = 54 / (-c.dH);    // px per J
          reservoir(sf, 0.2, 2.2, 2.6, 3.8, 'blue', 'reactants', `−ΔH = ${v.fix(-c.dH / KJ, 1)} kJ`);
          band(v, sf, [[2.6, 3], [4.3, 3]], -c.dH * scale, 'blue', { head: false, alpha: 0.5 });
          sf.rect(4.3, 1.8, 6.1, 4.2, { fill: 'panel', fillAlpha: 1, color: 'ink', width: 2, radius: 8 });
          sf.text('cell', 5.2, 3.25, { align: 'center', size: 13, weight: 700 }); sf.text(`n = ${c.n} e⁻`, 5.2, 2.7, { align: 'center', size: 11, color: 'muted' });
          band(v, sf, [[6.1, 3.7], [8.0, 3.7]], Math.max(0, Wel) * scale, 'orange');
          if (Qout > 0) band(v, sf, [[6.1, 2.3], [7.0, 2.3], [7.0, 1.4], [8.0, 1.4]], Qout * scale, 'red');
          sf.text('electrical work', 8.2, 3.95, { size: 11.5, weight: 650, color: 'orange' }); sf.text(`${v.fix(Wel / KJ, 1)} kJ`, 8.2, 3.45, { size: 11.5, color: 'ink' });
          sf.text('heat out', 8.2, 1.65, { size: 11.5, weight: 650, color: 'red' }); sf.text(`${v.fix(Qout / KJ, 1)} kJ`, 8.2, 1.15, { size: 11.5, color: 'ink' });
          sf.tex(c.eq, 5.5, 5.3, { align: 'center', size: 15 });
          sf.text(`of which −TΔS = ${v.fix(-T * c.dS / KJ, 1)} kJ must leave even reversibly`, 5.5, 0.35, { align: 'center', size: 11.5, color: 'muted' });
          // E(T)
          const [Ta, Tb] = c.range, Ef = (t) => -(c.dH - t * c.dS) / (c.n * FARADAY);
          const ea = Ef(Ta), eb = Ef(Tb), elo = Math.min(ea, eb), ehi = Math.max(ea, eb), pad = Math.max(0.02, 0.2 * (ehi - elo));
          se.setView([Ta, Tb], [elo - pad, ehi + pad]);
          se.fn(Ef, { color: 'orange', width: 2.6, domain: [Ta, Tb] });
          se.fn((t) => Ef(t) * load.value, { color: 'red', width: 1.4, dash: [6, 4], domain: [Ta, Tb] });
          se.vline(298.15, { color: 'faint', dash: [3, 4] });
          se.dot(T, E, { r: 6, color: 'orange' });
          se.text(`${v.fix(E, 4)} V`, T, E, { dx: 10, dy: -12, size: 11.5, weight: 650, plate: true });
          st = { c, T, dG, E, Wel, Qout };
        });
        v.legend([['blue', 'reaction enthalpy $-\\Delta H$', { area: true }], ['orange', 'electrical work $\\le -\\Delta G$', { area: true }], ['red', 'heat to surroundings', { area: true }], ['red', 'voltage under load', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { c, T, dG, E, Wel, Qout } = st;
          return `CODATA at 298.15 K: $\\Delta H$ = ${v.fix(c.dH / KJ, 2)} kJ/mol, $\\Delta S$ = ${v.fix(c.dS, 2)} J/(K·mol) · at ${v.fix(T, 1)} K: $\\Delta G = \\Delta H - T\\Delta S$ = **${v.fix(dG / KJ, 2)} kJ/mol**, $E = -\\Delta G/nF$ = **${v.fix(E, 4)} V** · ideal efficiency $\\Delta G/\\Delta H$ = ${v.fix(dG / c.dH * 100, 1)} % · delivered ${v.fix(Wel / KJ, 1)} kJ, heat out ${v.fix(Qout / KJ, 1)} kJ (tabulated standard potentials: 1.229 V for H₂/O₂ to liquid water, 1.10 V for the Daniell cell)`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10', kind: 'Theorem', name: 'Minimum principles for free energies',
      statement: String.raw`Let a system with an unconstrained internal variable $x$ (a piston position, a volume, a composition) be in contact with a reservoir.

(a) At fixed temperature $T$ (reservoir) and fixed total volume, the equilibrium value of $x$ minimizes the Helmholtz free energy $F(T, V, N; x)$, and any spontaneous process lowers $F$.

(b) At fixed $T$ and fixed external pressure $P$, the equilibrium minimizes the Gibbs free energy $G(T, P, N; x) = F + PV$, and spontaneous processes lower $G$.

Each is equivalent to the entropy maximum principle (2.10) for system plus reservoir: $\Delta S_{\text{total}} = -\Delta F/T$ in case (a) and $-\Delta G/T$ in case (b). A local minimum that is not global is a metastable state.`,
      idea: String.raw`The reservoir is so large that it stays at $T$ (and $P$), so its entropy changes by $-Q/T$ (and absorbs $P\Delta V$ of work). With the first law, the total entropy change of system plus reservoir becomes $\Delta S - (\Delta U + P\Delta V)/T = -\Delta G/T$ (set $\Delta V = 0$ for $F$). Maximizing total entropy is therefore the same as minimizing the free energy of the system alone — the reservoir drops out of the bookkeeping. This is why $F$ and $G$ (3.8, 3.9) are the working potentials of chemistry: laboratories fix $T$ and $P$, not $U$ and $V$.`,
      caption: String.raw`**(a) Free piston:** a cylinder on a heat bath, divided by a frictional piston with 1 mol of argon on the left and the amount you set on the right. **(b) Weighted piston:** 1 mol of CO₂ (van der Waals) under a constant external pressure, below its critical temperature. Right: $F(x)$ or $G(V)$; **drag the gold start point** and press ▶: the piston's real equation of motion, $M\ddot x = A\,\Delta P - \gamma\dot x$, is integrated, and the ball rolls down to the minimum of the free energy, where the pressures balance. The free energy plus the piston's kinetic energy only ever decreases (the friction heat goes to the bath). In (b), start on the liquid side and the system stays in the *local* minimum — a metastable liquid — while the deeper minimum waits.`,
      deps: ['thermo-3.8', 'thermo-3.9', 'thermo-2.10'],
      see: ['thermo-3.4', 'thermo-3.15'],
      refs: ['Schroeder §5.2', 'Callen ch. 6'],
      tags: ['free energy', 'equilibrium'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Principle_of_minimum_energy' },
      viz(v) {
        const mode = v.select('setting', [{ value: 'F', label: '(a) free piston, fixed T and V' }, { value: 'G', label: '(b) weighted piston, fixed T and P' }], 'F', { onChange: () => { reset(); } });
        const n2 = v.slider('right side (mol)', 0.2, 2, 0.5, { step: 0.05, fmt: (x) => v.fix(x, 2), onChange: () => reset() });
        const Tsl = v.slider('$T$', 240, 300, 260, { step: 1, fmt: (x) => x + ' K', onChange: () => reset() });
        const Pex = v.slider('external $P$', 25, 70, 35, { step: 0.5, fmt: (x) => v.fix(x, 1) + ' bar', onChange: () => reset() });
        const gam = v.slider('friction', 0.1, 3, 0.6, { step: 0.05, fmt: (x) => v.fix(x, 2), onChange: () => reset() });
        const sc = v.stage({ x: [-0.05, 1.05], y: [-0.2, 0.75], height: 300, equal: true, axes: false, weight: 0.9, title: 'the cylinder' });
        const sf = v.stage({ x: [0, 1], y: [0, 1], height: 300, axes: 'box', gutter: true, xlabel: 'x', ylabel: 'F', weight: 1.1 });
        const Ar = vdw('Ar', true), CO2 = vdw('CO2');
        const VT = 10 * L, TF = 300, AREA = 0.01;   // (a) 10 L cylinder at 300 K; piston area 100 cm²
        let eMin = 0;
        const hd = sf.handle(0.15, 0, { color: 'gold', label: 'start', constrain: (x) => { const r = range(); const xx = clamp(x, r[0] + 0.02 * (r[1] - r[0]), r[1] - 0.02 * (r[1] - r[0])); return [xx, energy(xx) - eMin]; }, onDrag: () => reset(false) });
        const range = () => mode.value === 'F' ? [0.05, 0.95] : [0.06, 1.2];   // x = V1/VT (a) or V in L (b)
        const energy = (x) => {
          if (mode.value === 'F') { const V1 = x * VT, V2 = VT - V1; return Ar.f(TF, V1) + n2.value * Ar.f(TF, V2 / n2.value); }
          const V = x * L; return CO2.f(Tsl.value, V) + Pex.value * BAR * V;
        };
        const force = (x) => {   // generalized force −dE/dx (J per unit x)
          if (mode.value === 'F') { const V1 = x * VT, V2 = VT - V1; return (Ar.P(TF, V1) - Ar.P(TF, V2 / n2.value)) * VT; }
          return (CO2.P(Tsl.value, x * L) - Pex.value * BAR) * L;
        };
        let traj = null;
        const reset = (moveStart = true) => {
          n2.el.hidden = mode.value !== 'F'; Tsl.el.hidden = Pex.el.hidden = mode.value !== 'G';
          if (moveStart) { const x0 = mode.value === 'F' ? 0.15 : 0.95; hd.set(x0, energy(x0) - eMin); }
          traj = null; v.restart();
        };
        const integrate = () => {
          // effective mass so the small oscillations take about a second; friction in units of that frequency
          const r = range(), xs = []; let lo = Infinity, xm = r[0];
          for (let i = 0; i <= 400; i++) { const x = lerp(r[0], r[1], i / 400), e = energy(x); xs.push(e); if (e < lo) { lo = e; xm = x; } }
          const kx = Math.abs((force(xm + 1e-4) - force(xm - 1e-4)) / 2e-4) || 1, w = 2 * Math.PI * 0.8, Mx = kx / (w * w), g = gam.value * w * Mx;
          let x = hd.x, u = 0; const out = [];
          const dt = 0.002;
          for (let k = 0; k <= 9000; k++) {
            if (k % 10 === 0) out.push({ t: k * dt, x, E: energy(x), K: 0.5 * Mx * u * u });
            const a = (force(x) - g * u) / Mx;
            u += a * dt; x += u * dt;
            if (x < r[0] * 0.6 || x > r[1] * 1.02) { x = clamp(x, r[0] * 0.6, r[1] * 1.02); u = -0.3 * u; }
          }
          return { out, xm, lo };
        };
        let st = null;
        reset();
        v.animate((t) => {
          const F = mode.value === 'F', r = range();
          if (!traj) traj = integrate();
          const k = Math.min(traj.out.length - 1, Math.floor(t / 0.02)), cur = traj.out[k];
          // energy curve
          const es = []; for (let i = 0; i <= 200; i++) es.push(energy(lerp(r[0], r[1], i / 200)));
          const emin = Math.min(...es), emax = Math.max(energy(hd.x), ...es.slice(10, 190));
          eMin = emin; if (!hd.dragging) hd.set(hd.x, energy(hd.x) - emin);
          const top = Math.min(emax, emin + (F ? 4000 : 3000)) - emin;
          sf.setView(r, [-0.06 * top, top * 1.08]);
          sf.setTitle(F ? 'Helmholtz free energy $F(x)$ of both gases' : 'Gibbs free energy $G(V) = F + P_{\\text{ext}}V$');
          sf.setLabels(F ? 'piston position x = V₁/V' : 'V (L)', F ? 'F − F_min (J)' : 'G − G_min (J)');
          sf.fn((x) => energy(x) - emin, { color: 'ink', width: 2.4, domain: r, n: 300 });
          // local minima
          for (let i = 1; i < 200; i++) if (es[i] < es[i - 1] && es[i] <= es[i + 1]) { const x = lerp(r[0], r[1], i / 200); sf.vline(x, { color: 'green', dash: [4, 4], width: 1.2 }); sf.dot(x, es[i] - emin, { r: 5, color: 'green', hollow: true }); }
          sf.path(traj.out.slice(0, k + 1).map((p) => [p.x, p.E - emin]), { color: 'gold', width: 1.2, alpha: 0.6 });
          sf.dot(cur.x, cur.E - emin, { r: 7, color: 'gold' });
          // cylinder
          if (F) sc.rect(0, 0, 1, 0.55, { color: 'ink', width: 2.6 });
          sc.rect(-0.04, -0.1, 1.04, 0, { fill: 'red', fillAlpha: 0.45, color: 'red', width: 1 });
          sc.text(`heat bath ${F ? TF : Tsl.value} K`, 0.5, -0.16, { align: 'center', size: 11.5, color: 'red', weight: 650 });
          if (F) {
            const xp = cur.x;
            sc.rect(0, 0, xp, 0.55, { fill: 'blue', fillAlpha: 0.25, stroke: false }); sc.rect(xp, 0, 1, 0.55, { fill: 'teal', fillAlpha: 0.25, stroke: false });
            sc.dots(DOTS.slice(0, 60).map(([a, b]) => [0.01 + a * (xp - 0.03), 0.02 + b * 0.5]), { r: 2, color: 'blue' });
            sc.dots(DOTS.slice(100, 100 + Math.round(60 * n2.value)).map(([a, b]) => [xp + 0.02 + a * (1 - xp - 0.03), 0.02 + b * 0.5]), { r: 2, color: 'teal' });
            sc.rect(xp - 0.015, 0, xp + 0.015, 0.55, { fill: 'muted', fillAlpha: 0.9, color: 'ink', width: 1 });
            const P1 = Ar.P(TF, xp * VT) / BAR, P2 = Ar.P(TF, (1 - xp) * VT / n2.value) / BAR;
            sc.text(`P₁ = ${v.fix(P1, 2)} bar`, 0.02, 0.65, { size: 11.5, color: 'blue', weight: 650 });
            sc.text(`P₂ = ${v.fix(P2, 2)} bar`, 0.98, 0.65, { size: 11.5, color: 'teal', weight: 650, align: 'right' });
          } else {
            const hgt = clamp(cur.x / 1.25, 0.03, 1) * 0.55;
            sc.rect(0.3, 0, 0.7, hgt, { fill: cur.x < 0.2 ? 'blue' : 'teal', fillAlpha: cur.x < 0.2 ? 0.55 : 0.25, stroke: false });
            sc.rect(0.3, hgt, 0.7, hgt + 0.04, { fill: 'muted', fillAlpha: 0.9, color: 'ink', width: 1 });
            sc.rect(0.4, hgt + 0.04, 0.6, hgt + 0.13, { fill: 'ink', fillAlpha: 0.7, color: 'ink', width: 1 });
            sc.line(0.3, 0, 0.3, 0.7, { color: 'ink', width: 2.6 }); sc.line(0.7, 0, 0.7, 0.7, { color: 'ink', width: 2.6 });
            sc.text(`weight: ${v.fix(Pex.value, 1)} bar`, 0.75, hgt + 0.09, { size: 11.5, color: 'ink' });
            sc.text(cur.x < 0.2 ? 'liquid-like' : 'gas-like', 0.5, hgt / 2, { align: 'center', size: 11.5, color: 'ink', plate: true });
            sc.text(`P = ${v.fix(CO2.P(Tsl.value, cur.x * L) / BAR, 1)} bar`, 0.02, 0.65, { size: 11.5, color: 'teal', weight: 650 });
          }
          st = { cur, start: traj.out[0], xm: traj.xm, lo: traj.lo, T: F ? TF : Tsl.value, F, settled: t > 12 };
        }, { period: 20, still: 15 });
        v.readout(() => {
          if (!st) return '';
          const { cur, start, xm, lo, T, F } = st, name = F ? 'F' : 'G';
          const local = st.settled && Math.abs(cur.E - lo) > 1;
          return `$${name}$ + kinetic energy fell by **${v.fix(start.E + start.K - cur.E - cur.K, 1)} J** since the start (never rises) · entropy given to the bath $-\\Delta ${name}/T$ = ${v.fix((start.E - cur.E) / T, 3)} J/K ≥ 0 · global minimum at ${F ? 'x' : 'V'} = ${v.fix(xm, 3)}${F ? ` (ideal gases: $N_1/N$ = ${v.fix(1 / (1 + n2.value), 3)})` : ' L'}${local ? ' · stuck in a **local** minimum: metastable' : ''}`;
        });
      },
    },
  ],
};
