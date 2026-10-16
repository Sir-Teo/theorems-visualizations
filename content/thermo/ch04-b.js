// Thermodynamics & Statistical Mechanics — Chapter 4 (part b): metastability, mixtures, chemical equilibrium, cycles
import { clamp, lerp, R, KB, NA, HP, AMU, GAS, vdw, pdiff, interp, interp3, bisect, simpson, W, satW, WSAT, tsatW, psatW, vdwP, vdwCoex, vdwSpinodal, PHASE, JANAF, N2INV, N2H300, N2SAT1ATM, N2JT, STEAM, band, device, reservoir, bar } from './ch04.shared.js';

// ---------- helpers for this file ----------
const MPA = 1e6, BAR = 1e5;
/** Reduced van der Waals chemical potential as a function of reduced density ρ = ρ/ρc (units Pc vc). */
const muRho = (T, p) => (8 * T / 3) * (Math.log(p / (3 - p)) + 3 / (3 - p)) - 6 * p;
/** Theme-aware RGBA ramp (array of n colours) from the panel colour to a palette colour. */
const rampRGBA = (v, to, n = 64, from) => Array.from({ length: n }, (_, k) => { const c = v.ramp(k / (n - 1), to, from); return [c[0], c[1], c[2], 255]; });
/** Numerical first and second derivatives of tabulated y(x) on a uniform grid. */
const deriv = (xs, ys) => ys.map((_, i) => { const a = Math.max(0, i - 1), b = Math.min(ys.length - 1, i + 1); return (ys[b] - ys[a]) / (xs[b] - xs[a]); });

export default {
  collection: 'thermo',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9', kind: 'Phenomenon', name: 'Metastability: supercooling and superheating',
      statement: String.raw`A phase can persist beyond its coexistence curve as a **metastable** state: vapour compressed above its saturation pressure (supersaturated), liquid heated above its boiling point (superheated) or cooled below its freezing point (supercooled). A metastable state is stable against small fluctuations — its free energy is locally convex, $(\partial P/\partial v)_T < 0$ — but not against large ones: it decays only after a sufficiently large nucleus of the stable phase forms. The limit of metastability is the **spinodal**, where $(\partial P/\partial v)_T = 0$; inside it the homogeneous state is unstable and separates spontaneously, without nucleation (**spinodal decomposition**). Coexistence (binodal) and spinodal curves meet at the critical point.`,
      idea: String.raw`Stability against small fluctuations requires a convex free energy $f(v)$, i.e. $\partial P/\partial v < 0$ (3.15). Between the binodal and the spinodal of the van der Waals isotherm this still holds, although a two-phase state of lower Gibbs energy exists (4.3); reaching it requires passing through intermediate states with an interface, which cost surface free energy, so there is a barrier (4.10). Inside the spinodal $f''(v) < 0$: any long-wavelength density ripple lowers the free energy and grows exponentially, at a rate set by the competition between the negative curvature and the gradient (surface) energy — the Cahn–Hilliard picture.`,
      caption: String.raw`Left: the van der Waals phase diagram in reduced density and temperature — coexistence curve (binodal, ink) and spinodal (red dashed); the band between them is metastable. **Drag the quench point** (it restarts the run). Right: a 64 × 64 Cahn–Hilliard simulation of the fluid's density after the quench (van der Waals free energy plus a gradient term; strong teal = dense liquid, background colour = dilute vapour). Inside the spinodal, tiny noise grows into an interconnected pattern at once. In the metastable band nothing happens — until you **seed a droplet**: below a critical radius it dissolves, above it grows by draining the supersaturated vapour. Outside the binodal the fluid is simply stable.`,
      deps: ['thermo-4.3', 'thermo-3.15'],
      see: ['thermo-4.10', 'pchem-4.8'],
      refs: ['Callen ch. 9'],
      tags: ['metastability', 'phase transitions'],
      credit: 'J. W. Gibbs, 1876 (stability); J. W. Cahn & J. E. Hilliard, 1958 (spinodal decomposition)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Spinodal_decomposition' },
      viz(v) {
        const rad = v.slider('droplet radius (cells)', 1, 8, 4, { step: 0.5, fmt: (x) => v.fix(x, 1) });
        let seed = false;
        v.button('Seed a droplet', () => { seed = true; v.restart(); v.play(); });
        v.button('Quench again (no droplet)', () => { seed = false; v.restart(); v.play(); });
        const sd = v.stage({ x: [0, 2.4], y: [0.78, 1.04], height: 350, axes: 'box', gutter: true, xlabel: 'ρ/ρc', ylabel: 'T/Tc', weight: 1, title: 'where the quench lands' });
        const sf = v.stage({ x: [0, 64], y: [0, 64], equal: true, height: 350, axes: false, weight: 0.95, minWidth: 240, title: 'density after the quench' });
        const q = sd.handle(1.0, 0.85, { color: 'gold', label: 'quench', constrain: { x: [0.12, 2.3], y: [0.79, 1.03] } });
        q.onDrag = () => { seed = false; v.restart(); };
        // binodal and spinodal in (ρ, T)
        const bin = [], spl = [];
        for (let i = 0; i <= 140; i++) { const T = 0.78 + (0.99999 - 0.78) * (i / 140) ** 0.5; const c = vdwCoex(T), s = vdwSpinodal(T); if (c) bin.push([T, 1 / c.vg, 1 / c.vl]); if (s) spl.push([T, 1 / s[1], 1 / s[0]]); }
        const classify = (p, T) => { if (T >= 1) return 'stable'; const c = vdwCoex(T), s = vdwSpinodal(T); if (p <= 1 / c.vg || p >= 1 / c.vl) return 'stable'; if (p > 1 / s[1] && p < 1 / s[0]) return 'unstable'; return 'metastable'; };
        const N = 64, kap = 1.5, A = 8, dt = 0.5;
        const K2 = Array.from({ length: N }, (_, i) => Float64Array.from({ length: N }, (_, j) => { const a = 2 * Math.PI * (i <= N / 2 ? i : i - N) / N, b = 2 * Math.PI * (j <= N / 2 ? j : j - N) / N; return a * a + b * b; }));
        const M = v.M;
        const S = v.sim(() => {
          const r = v.rng(11), p0 = q.x, T = q.y;
          const f = Array.from({ length: N }, () => Float64Array.from({ length: N }, () => p0 + 0.02 * (r() - 0.5)));
          if (seed) {
            const c = vdwCoex(T), pl = c ? 1 / c.vl : 2; let added = 0, outside = 0;
            for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const d = Math.hypot(i - 31.5, j - 31.5); if (d < rad.value) { added += pl - f[i][j]; f[i][j] = pl; } else outside++; }
            for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (Math.hypot(i - 31.5, j - 31.5) >= rad.value) f[i][j] -= added / outside;   // conserve the mean density
          }
          return { f, T, steps: 0 };
        }, (st) => {
          const { f, T } = st;
          const re = f.map((row) => Array.from(row)), im = f.map(() => new Array(N).fill(0));
          const mr = f.map((row) => Array.from(row, (p) => muRho(T, clamp(p, 0.02, 2.95)))), mi = f.map(() => new Array(N).fill(0));
          M.fft2(re, im); M.fft2(mr, mi);
          for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const k2 = K2[i][j], den = 1 + dt * k2 * (A + kap * k2); re[i][j] = (re[i][j] - dt * k2 * (mr[i][j] - A * re[i][j])) / den; im[i][j] = (im[i][j] - dt * k2 * (mi[i][j] - A * im[i][j])) / den; }
          M.ifft2(re, im);
          for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) f[i][j] = re[i][j];
          st.steps++;
          return st;
        }, { dt: 1 / 150 });
        let info = null;
        v.animate((t) => {
          S.advance(t);
          const st = S.state, T = q.y, p0 = q.x, cls = classify(p0, T);
          // regions
          const meta = v.rgb('gold'), uns = v.rgb('red');
          sd.raster((p, TT) => { const c = classify(p, TT); return c === 'metastable' ? [meta[0], meta[1], meta[2], 50] : c === 'unstable' ? [uns[0], uns[1], uns[2], 40] : null; }, { res: 3, key: 'ms' + v.color('panel') });
          sd.path(bin.map((b) => [b[1], b[0]]).concat(bin.slice().reverse().map((b) => [b[2], b[0]])), { color: 'ink', width: 2.4 });
          sd.path(spl.map((b) => [b[1], b[0]]).concat(spl.slice().reverse().map((b) => [b[2], b[0]])), { color: 'red', width: 2, dash: [6, 4] });
          sd.dot(1, 1, { r: 4.5, color: 'red' });
          sd.text('metastable vapour', 0.43, 0.8, { size: 10.5, color: 'ink', align: 'center', plate: true });
          sd.text('metastable liquid', 1.72, 0.8, { size: 10.5, color: 'ink', align: 'center', plate: true });
          sd.text('unstable', 1.0, 0.935, { size: 11.5, weight: 650, color: 'red', align: 'center' });
          sd.text('one fluid', 1.2, 1.025, { size: 11, color: 'muted', align: 'center' });
          // field
          const pal = rampRGBA(v, 'teal', 64);
          const f = st.f;
          sf.raster((x, y) => { const i = clamp(Math.floor(y), 0, N - 1), j = clamp(Math.floor(x), 0, N - 1); return pal[clamp(Math.round((f[i][j] - 0.2) / 1.75 * 63), 0, 63)]; }, { res: 2, rect: [0, 0, 64, 64], key: 'f' + st.steps + seed + p0 + T });
          sf.rect(0, 0, 64, 64, { color: 'muted', width: 1 });
          let liq = 0, mn = 9, mx = 0, m = 0; const c = vdwCoex(T);
          const mid = c ? (1 / c.vl + 1 / c.vg) / 2 : 1;
          for (const row of f) for (const p of row) { if (p > mid) liq++; mn = Math.min(mn, p); mx = Math.max(mx, p); m += p; }
          info = { cls, T, p0, steps: st.steps, liq: liq / (N * N), mn, mx, m: m / (N * N), mup: (muRho(T, p0 * 1.001) - muRho(T, p0 / 1.001)) / (p0 * 0.002), c };
        }, { still: 6, period: 14 });
        v.legend([['ink', 'coexistence (binodal)'], ['red', 'spinodal $\\partial P/\\partial v = 0$', { dash: true }], ['gold', 'metastable', { area: true }], ['teal', 'dense (liquid-like)', { area: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { cls, T, p0, steps, liq, mn, mx, m, mup, c } = info;
          return `quench to $\\rho/\\rho_c$ = ${v.fix(p0, 3)}, $T/T_c$ = ${v.fix(T, 3)}: **${cls}** · $\\partial\\mu/\\partial\\rho$ = ${v.fix(mup, 3)} ${mup > 0 ? '> 0 (small ripples decay)' : '< 0 (ripples grow)'}${c ? ` · coexisting densities ${v.fix(1 / c.vg, 3)} and ${v.fix(1 / c.vl, 3)}` : ''}\nafter ${steps} steps (model time ${steps * dt}): density range ${v.fix(mn, 3)}–${v.fix(mx, 3)}, liquid-like fraction ${v.fix(100 * liq, 1)} %, mean ${v.fix(m, 4)} (conserved)${seed ? ` · seeded droplet of radius ${v.fix(rad.value, 1)} cells ${mx > (c ? (1 / c.vl + 1 / c.vg) / 2 : 9) ? 'is alive' : 'has dissolved'}` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10', kind: 'Model', name: 'Classical nucleation theory',
      statement: String.raw`In a metastable phase the stable phase appears through small clusters (nuclei). A spherical nucleus of radius $r$ changes the Gibbs energy by
$$\Delta G(r) = 4\pi r^2\gamma - \tfrac43\pi r^3\,\Delta g_v,$$
where $\gamma$ is the interfacial free energy per area and $\Delta g_v > 0$ the bulk Gibbs-energy gain per volume of new phase. $\Delta G$ peaks at the **critical radius** $r^* = 2\gamma/\Delta g_v$ with barrier $\Delta G^* = 16\pi\gamma^3/3\Delta g_v^2$: smaller clusters tend to shrink, larger ones to grow. The nucleation rate per volume is $J = J_0\,e^{-\Delta G^*/kT}$. For freezing at supercooling $\Delta T$, $\Delta g_v \approx \rho_s L\,\Delta T/T_m$, so $\Delta G^* \propto 1/\Delta T^2$ and $J$ switches on abruptly at a characteristic supercooling.`,
      idea: String.raw`A small cluster is mostly surface: its interface costs free energy proportional to $r^2$, while its interior gains only in proportion to $r^3$, so tiny clusters are uphill (that is why metastable states persist, 4.9). Thermal fluctuations climb the barrier with Boltzmann probability $e^{-\Delta G^*/kT}$ (minimum principle at fixed $T$ and $P$, 3.10). Because $\Delta g_v$ grows linearly with supercooling and the barrier goes as its inverse square, the exponent changes by orders of magnitude over a few kelvin — homogeneous freezing of pure water droplets is negligible at −20 °C and almost instantaneous near −38 °C. Impurities and surfaces lower the barrier (heterogeneous nucleation), which is why ordinary water freezes near 0 °C.`,
      caption: String.raw`Ice nuclei in supercooled water. Left: $\Delta G(r)$ in units of $kT$ (ink) with its surface (orange) and bulk (blue) parts; gold dots are clusters, each doing a random walk biased down the slope (press play, **Respawn** to start again). Those starting left of $r^*$ shrink away, those right of it grow. **Set the supercooling and the ice–water interfacial energy** (estimates range from about 22 to 32 mJ/m²): both move the barrier dramatically. Right: the predicted nucleation rate (log scale) against temperature with $J_0 = 10^{39}$ m⁻³ s⁻¹, an order-of-magnitude kinetic prefactor. Where it crosses the gold line a 10 µm droplet freezes within about a second — compare the observed homogeneous freezing limit near −38 °C.`,
      deps: ['thermo-4.9', 'thermo-3.10'],
      see: ['pchem-4.10'],
      refs: ['Schroeder §5.3'],
      tags: ['nucleation', 'metastability'],
      credit: 'Volmer & Weber, 1926; Becker & Döring, 1935',
      scope: String.raw`Treats a nanometre cluster as a sphere with bulk properties and a flat-interface surface energy — the "capillary approximation". Barriers come out right in order of magnitude; absolute rates are uncertain by many powers of ten because $\gamma$ enters cubed in an exponent.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Classical_nucleation_theory' },
      viz(v) {
        const dT = v.slider('supercooling ΔT', 5, 45, 30, { step: 0.5, fmt: (x) => v.fix(x, 1) + ' K' });
        const gam = v.slider('interfacial energy γ', 15, 35, 25, { step: 0.5, fmt: (x) => v.fix(x, 1) + ' mJ/m²' });
        let gen = 0;
        v.button('Respawn clusters', () => { gen++; v.restart(); v.play(); });
        const sg = v.stage({ x: [0, 3], y: [-60, 100], height: 350, axes: 'box', gutter: true, xlabel: 'cluster radius r (nm)', ylabel: 'ΔG / kT', weight: 1.2, title: 'free energy of an ice cluster' });
        const sj = v.stage({ x: [-45, -5], y: [1e-20, 1e30], ylog: true, height: 350, axes: 'box', gutter: { l: 56 }, xlabel: 't (°C)', ylabel: 'J (m⁻³ s⁻¹)', weight: 1, title: 'homogeneous nucleation rate' });
        const Tm = 273.15, Lf = W.Lf, rhoI = W.rhoIce, dcp = 4219 - W.cpIce, J0 = 1e39, Vd = 4 / 3 * Math.PI * (5e-6) ** 3, Jth = 1 / Vd;
        // Gibbs energy of melting per kg at T (constant Δcp): Δμ = Δh − TΔs
        const dmu = (T) => (Lf - dcp * (Tm - T)) - T * (Lf / Tm - dcp * Math.log(Tm / T));
        const params = (T, g) => { const dg = rhoI * dmu(T), rs = 2 * g / dg, Gs = 16 * Math.PI * g ** 3 / (3 * dg * dg); return { dg, rs, Gs, kT: KB * T }; };
        const NC = 36;
        const S = v.sim(() => {
          const r = v.rng(7 + gen), T = Tm - dT.value, p = params(T, gam.value * 1e-3);
          return { r: Array.from({ length: NC }, (_, i) => p.rs * (0.45 + 1.1 * (i + r()) / NC)), rng: r, p };
        }, (st, h) => {
          const { p } = st, D = p.rs * p.rs / (p.Gs / p.kT) * 0.15;   // diffusion constant: the drift moves clusters by ~r* in a few seconds
          for (let i = 0; i < NC; i++) {
            const r = st.r[i]; if (r <= 0 || r > 3 * p.rs) continue;
            const dGdr = (8 * Math.PI * r * gam.value * 1e-3 - 4 * Math.PI * r * r * p.dg) / p.kT;
            st.r[i] = r - D * dGdr * h + Math.sqrt(2 * D * h) * st.rng.normal();
            if (st.r[i] < 0.02 * p.rs) st.r[i] = 0;
          }
          return st;
        }, { dt: 1 / 120 });
        let info = null;
        v.animate((t) => {
          S.advance(t);
          const T = Tm - dT.value, g = gam.value * 1e-3, p = params(T, g), rs = p.rs * 1e9, hb = p.Gs / p.kT;
          const G = (rn) => { const r = rn * 1e-9; return (4 * Math.PI * r * r * g - 4 / 3 * Math.PI * r ** 3 * p.dg) / p.kT; };
          const xr = 2.6 * rs;
          sg.setView([0, xr], [-0.9 * hb, 1.6 * hb]);
          sg.hline(0, { color: 'muted', width: 1 });
          sg.fn((rn) => 4 * Math.PI * (rn * 1e-9) ** 2 * g / p.kT, { color: 'orange', width: 1.8, dash: [6, 4] });
          sg.fn((rn) => -4 / 3 * Math.PI * (rn * 1e-9) ** 3 * p.dg / p.kT, { color: 'blue', width: 1.8, dash: [6, 4] });
          sg.fn(G, { color: 'ink', width: 2.8 });
          sg.vline(rs, { color: 'red', width: 1.2, dash: [3, 3] });
          sg.dot(rs, hb, { r: 5, color: 'red' });
          sg.text(`r* = ${v.fix(rs, 2)} nm, ΔG* = ${v.fix(hb, 0)} kT`, rs, hb, { dy: -12, size: 11.5, color: 'red', align: 'center', plate: true });
          sg.text('bulk −(4/3)πr³Δg', xr * 0.6, -0.8 * hb, { size: 11, color: 'blue', align: 'left' });
          // clusters (radii in SI from the sim; the sim restarts when the clock does)
          const st = S.state; let grown = 0, gone = 0;
          for (const r of st.r) { if (r <= 0) { gone++; continue; } const rn = r * 1e9; if (rn > xr) { grown++; continue; } sg.dot(rn, G(rn), { r: 4, color: 'gold' }); if (rn > rs) grown++; }
          sg.corner(`grown ${grown} · dissolved ${gone}`, 'tr', { color: 'ink', weight: 650 });
          // rate curve
          const Jof = (tc) => { const TT = Tm + tc, q = params(TT, g); return J0 * Math.exp(-q.Gs / q.kT); };
          sj.fn(Jof, { color: 'accent', width: 2.6, domain: [-45, -5] });
          sj.hline(Jth, { color: 'gold', width: 1.6 });
          sj.text('10 µm droplet freezes in ~1 s', -44, Jth, { dy: -10, size: 11, color: 'gold', align: 'left', plate: true });
          sj.vline(-38, { color: 'muted', dash: [4, 4], width: 1.2 });
          sj.text('observed limit ≈ −38 °C', -38, 1e-15, { dx: 5, size: 10.5, color: 'muted', align: 'left' });
          sj.dot(-dT.value, Jof(-dT.value), { r: 5, color: 'red' });
          const tHom = bisect((tc) => Math.log(Jof(tc)) - Math.log(Jth), -60, -2);
          sj.dot(tHom, Jth, { r: 4.5, color: 'gold' });
          const J1 = Jof(-dT.value), J2 = Jof(-dT.value - 1);
          info = { T, rs, hb, n: 4 / 3 * Math.PI * (p.rs) ** 3 * rhoI / W.M * NA, tHom, J1, fac: J2 / J1, grown, gone };
        }, { still: 3, period: 10 });
        v.legend([['ink', 'ΔG(r)'], ['orange', 'surface cost', { dash: true }], ['blue', 'bulk gain', { dash: true }], ['gold', 'clusters', { dot: true }], ['accent', 'rate J(T)']]);
        v.readout(() => {
          if (!info) return '';
          const { T, rs, hb, n, tHom, J1, fac } = info;
          return `at ${v.fix(T - 273.15, 1)} °C: critical radius $r^*$ = **${v.fix(rs, 2)} nm** (≈ ${v.fix(n, 0)} molecules), barrier $\\Delta G^*$ = **${v.fix(hb, 1)} kT** · rate $J$ = $${v.sci(J1, 2)}$ m⁻³ s⁻¹, ×${v.fix(fac, 1)} for each further kelvin of supercooling\npredicted homogeneous freezing temperature (10 µm droplet, ~1 s): **${v.fix(tHom, 1)} °C** with γ = ${v.fix(gam.value, 1)} mJ/m²; observed for micrometre droplets: about −38 °C`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11', kind: 'Phenomenon', name: 'Joule–Thomson effect and liquefaction',
      statement: String.raw`When a gas flows steadily through a throttle (a porous plug or valve) from high to low pressure, insulated and without doing shaft work, its **enthalpy is conserved**. Its temperature changes at the rate given by the **Joule–Thomson coefficient**
$$\mu_{JT} = \left(\frac{\partial T}{\partial P}\right)_H = \frac{V}{C_P}\,(T\alpha - 1),$$
which vanishes for an ideal gas. Real gases cool on expansion ($\mu_{JT} > 0$) inside the **inversion curve** in the $(T, P)$ plane and warm outside it. For nitrogen at room temperature and low pressure $\mu_{JT} \approx 0.21$ K/bar; the maximum inversion temperature is about 620 K for N₂ but only about 40 K for helium. Throttling below the inversion temperature, with counter-flow heat exchange, is the basis of the Linde process for liquefying gases.`,
      idea: String.raw`The gas pushed into the plug has work $P_1V_1$ done on it and does work $P_2V_2$ leaving it, so the first law with $Q = 0$ gives $U_1 + P_1V_1 = U_2 + P_2V_2$: $H$ is constant (1.14). Expanding at constant $H$ lets molecules move apart; if attraction dominates, potential energy rises at the expense of kinetic energy and the gas cools; if hard-core repulsion dominates (high $T$ or density), it warms. For a van der Waals gas at low density $\mu_{JT} \approx (2a/RT - b)/c_P$, so cooling requires $T < 2a/Rb$, and the full inversion curve is $P_r = 24\sqrt{3T_r} - 12T_r - 27$ in reduced units (4.1). The derivative identity follows from $dH = T\,dS + V\,dP$ and a Maxwell relation (3.12, 3.13).`,
      caption: String.raw`Isenthalps of nitrogen as a van der Waals gas (faint) on the $(P, T)$ plane, the van der Waals inversion curve (red dashed) and nitrogen's real inversion curve (red dots, located from the sign change of $\mu_{JT}$ in NIST data). **Drag the inlet state** and set the outlet pressure: the gas follows its isenthalp (thick) to the outlet, cooling inside the inversion curve and warming outside. Start cold and dense enough and the isenthalp ends in the two-phase region — part of the gas comes out liquid. Right: $\mu_{JT}$ at 1 bar, van der Waals (computed as $(\partial T/\partial P)_H$ by finite differences) against NIST data. The readout gives the Linde liquid yield from 300 K, both ways.`,
      deps: ['thermo-1.14', 'thermo-4.1'],
      see: ['thermo-3.13'],
      refs: ['Schroeder §4.4'],
      tags: ['Joule–Thomson', 'liquefaction'],
      credit: 'J. P. Joule & W. Thomson, 1852–1862; C. von Linde, 1895',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Joule%E2%80%93Thomson_effect' },
      viz(v) {
        const Pout = v.slider('outlet pressure', 0.1, 10, 0.1, { step: 0.1, fmt: (x) => v.fix(x, 1) + ' MPa' });
        const sp = v.stage({ x: [0, 45], y: [60, 900], height: 370, axes: 'box', gutter: true, xlabel: 'P (MPa)', ylabel: 'T (K)', weight: 1.35, title: 'nitrogen: isenthalps and inversion curves' });
        const sj = v.stage({ x: [80, 900], y: [-1, 26], height: 370, axes: 'box', gutter: true, xlabel: 'T (K)', ylabel: 'μ_JT (K/MPa)', weight: 1, title: 'Joule–Thomson coefficient at 0.1 MPa' });
        const M = vdw('N2'), Tc = M.Tc, Pc = M.Pc;
        // saturation of the model: reduced coexistence → (Tsat, Psat), cached by pressure
        const satCache = new Map();
        const satAt = (P) => { if (P >= Pc) return null; const k = Math.round(P / 1e3); if (satCache.has(k)) return satCache.get(k); const Tr = bisect((t) => vdwCoex(t).p - P / Pc, 0.3, 0.99999, 50); const c = vdwCoex(Tr); const T = Tr * Tc, vl = c.vl * 3 * M.b, vg = c.vg * 3 * M.b; const o = { T, hl: M.h(T, vl), hv: M.h(T, vg) }; satCache.set(k, o); return o; };
        /** Temperature (and liquid fraction) on the isenthalp h0 at pressure P. */
        const onH = (h0, P) => {
          const s = satAt(P);
          const hT = (T, br) => M.h(T, M.vOf(T, P, br));
          if (s) {
            if (h0 >= s.hv) return { T: bisect((T) => hT(T, 'gas') - h0, s.T, 2000, 50), x: 0 };
            if (h0 <= s.hl) return { T: bisect((T) => hT(T, 'liquid') - h0, 40, s.T, 50), x: 1 };
            return { T: s.T, x: (s.hv - h0) / (s.hv - s.hl) };
          }
          return { T: bisect((T) => hT(T, 'stable') - h0, 40, 2000, 50), x: 0 };
        };
        const Ps = []; for (let i = 0; i <= 45; i++) Ps.push(Math.max(0.1, i) * MPA);
        const family = [];
        for (const T0 of [100, 125, 150, 175, 200, 250, 300, 350, 400, 500, 600, 700, 800]) { const h0 = M.h(T0, M.vOf(T0, 0.1 * MPA, 'gas')); family.push(Ps.map((P) => [P / MPA, onH(h0, P).T])); }
        const invV = []; for (let i = 0; i <= 120; i++) { const tr = 0.75 + (6.75 - 0.75) * i / 120, pr = 24 * Math.sqrt(3 * tr) - 12 * tr - 27; invV.push([pr * Pc / MPA, tr * Tc]); }
        const muV = []; for (let T = 85; T <= 900; T += 5) { const vv = M.vOf(T, 0.1 * MPA, 'gas'); muV.push([T, pdiff((T_) => T_, M.P, M.h, T, vv) * MPA]); }
        const satLine = []; for (let i = 0; i <= 60; i++) { const tr = 0.55 + (0.99999 - 0.55) * i / 60, c = vdwCoex(tr); satLine.push([c.p * Pc / MPA, tr * Tc]); }
        const hin = sp.handle(20, 300, { color: 'gold', label: 'inlet', constrain: { x: [0.5, 44], y: [70, 880] } });
        let st = null;
        v.render(() => {
          for (const f of family) sp.path(f, { color: 'faint', width: 1.1 });
          sp.path(invV, { color: 'red', width: 2, dash: [6, 4] });
          sp.path(N2INV.map(([T, P]) => [P, T]), { color: 'red', width: 1.2, alpha: 0.7 }); sp.dots(N2INV.map(([T, P]) => [P, T]), { r: 3.4, color: 'red' });
          sp.path(satLine, { color: PHASE.liquid, width: 2.2 });
          sp.dot(Pc / MPA, Tc, { r: 4, color: PHASE.liquid });
          sp.text('liquid–vapour (model)', Pc / MPA, Tc, { dx: 8, dy: -2, size: 10.5, color: PHASE.liquid, align: 'left', plate: true });
          sp.text('cools on throttling', 9, 175, { size: 11.5, weight: 650, color: 'blue', align: 'center' });
          sp.text('warms', 30, 760, { size: 11.5, weight: 650, color: 'red', align: 'center' });
          // the throttling path
          const Pin = hin.x * MPA, Tin = hin.y, po = Math.min(Pout.value, hin.x - 0.05) * MPA;
          const sIn = satAt(Pin);
          const vin = M.vOf(Tin, Pin, sIn && Tin < sIn.T ? 'liquid' : 'stable'), h0 = M.h(Tin, vin);
          const path = []; let end = null;
          for (let i = 0; i <= 80; i++) { const P = Pin + (po - Pin) * i / 80, r = onH(h0, P); path.push([P / MPA, r.T]); end = r; }
          sp.path(path, { color: 'accent', width: 3.2 });
          sp.arrow(path[70][0], path[70][1], path[80][0], path[80][1], { color: 'accent', width: 3, head: 10 });
          sp.dot(po / MPA, end.T, { r: 5.5, color: end.x > 0 ? PHASE.liquid : 'accent' });
          sp.text(`${v.fix(end.T, 1)} K${end.x > 0 ? `, ${v.fix(100 * end.x, 1)} % liquid` : ''}`, po / MPA, end.T, { dx: 8, dy: end.T > Tin ? -10 : 12, size: 11.5, weight: 650, color: end.x > 0 ? PHASE.liquid : 'accent', align: 'left', plate: true });
          // mu_JT panel
          sj.hline(0, { color: 'muted', width: 1 });
          sj.path(muV, { color: 'purple', width: 2.4 });
          sj.dots(N2JT, { r: 3.4, color: 'ink' });
          const muIn = pdiff((T_) => T_, M.P, M.h, Tin, vin) * MPA;
          const vv1 = M.vOf(Tin, 0.1 * MPA, 'gas'), mu1 = Tin > 80 ? pdiff((T_) => T_, M.P, M.h, Tin, vv1) * MPA : NaN, mu1d = interp(N2JT, 0, 1, Tin);
          sj.vline(Tin, { color: 'gold', width: 1.2 });
          sj.text(`van der Waals: inverts at 2a/Rb = ${v.fix(2 * M.a / (R * M.b), 0)} K`, 880, 4, { size: 10.5, color: 'purple', align: 'right', plate: true });
          // Linde yield from 300 K
          const P1 = hin.x * MPA, hReal = interp(N2H300, 0, 1, hin.x), yReal = (N2H300[0][1] - hReal) / (N2H300[0][1] - N2SAT1ATM.hl);
          const s1 = satAt(101325), hV300a = M.h(300, M.vOf(300, 101325, 'gas')), hV300 = M.h(300, M.vOf(300, P1, 'gas')), yV = (hV300a - hV300) / (hV300a - s1.hl);
          st = { Tin, Pin, end, muIn, mu1, mu1d, yReal, yV, P1, Tmax: 2 * M.a / (R * M.b) };
        });
        v.legend([['faint', 'isenthalps (van der Waals)'], ['red', 'inversion curve: van der Waals', { dash: true }], ['red', 'inversion curve: NIST data', { dot: true }], ['purple', 'van der Waals μ_JT'], ['ink', 'NIST μ_JT', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { Tin, Pin, end, muIn, mu1, mu1d, yReal, yV, P1, Tmax } = st;
          return `inlet ${v.fix(Pin / MPA, 1)} MPa, ${v.fix(Tin, 0)} K → outlet ${v.fix(Math.min(Pout.value, Pin / MPA - 0.05), 2)} MPa: **${v.fix(end.T, 1)} K** (ΔT = ${v.fix(end.T - Tin, 1)} K)${end.x > 0 ? `, **${v.fix(100 * end.x, 1)} % liquid**` : ''} · $\\mu_{JT}$ at the inlet ${v.fix(muIn, 3)} K/MPa ${muIn > 0 ? '(cooling side)' : '(warming side)'}\nat 0.1 MPa and ${v.fix(Tin, 0)} K: van der Waals ${v.fix(mu1, 3)} K/MPa, NIST ${v.fix(mu1d, 3)} K/MPa · maximum inversion temperature: van der Waals ${v.fix(Tmax, 0)} K, real N₂ ≈ 608 K · Linde yield from 300 K and ${v.fix(P1 / MPA, 1)} MPa: real N₂ ${v.fix(100 * yReal, 1)} %, van der Waals ${v.fix(100 * yV, 1)} %`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12', kind: 'Definition', name: 'Chemical potential in mixtures and entropy of mixing',
      statement: String.raw`In a mixture the **chemical potential** of species $i$ is $\mu_i = (\partial G/\partial N_i)_{T, P, N_{j \ne i}}$, and $G = \sum_i N_i\mu_i$. In an ideal mixture (ideal gases, or ideal solutions) each species behaves as if alone at its mole fraction $x_i = N_i/N$:
$$\mu_i(T, P, x_i) = \mu_i^\circ(T, P) + kT\ln x_i,$$
lower than for the pure substance because $\ln x_i < 0$. Mixing pure ideal components at fixed $T$ and $P$ therefore changes the entropy and Gibbs energy by
$$\Delta S_{\text{mix}} = -Nk\sum_i x_i\ln x_i > 0,\qquad \Delta G_{\text{mix}} = NkT\sum_i x_i\ln x_i < 0,$$
with no heat and no volume change; for two species the entropy peaks at $Nk\ln 2$ for $x = 1/2$.`,
      idea: String.raw`When a partition is removed, each ideal gas expands isothermally from its own volume $V_i = x_iV$ into the whole volume $V$, gaining entropy $N_ik\ln(V/V_i) = -N_ik\ln x_i$ as in a free expansion (2.11); the gases do not notice one another. Equivalently, the number of ways of arranging the $N$ molecules among positions, once they may share the volume, grows by the multinomial $N!/\prod N_i!$, whose logarithm is $-N\sum x_i\ln x_i$ by Stirling's formula. The chemical potential is the slope of $G$; its $kT\ln x$ term is what makes it energetically favourable for every species to spread into every available phase (3.4) — the root of osmosis (4.14) and of chemical equilibrium (4.15).`,
      caption: String.raw`500 molecules of two ideal gases (blue and orange) in a box, at first separated by a partition placed so both sides have the same pressure. The partition is removed at $t = 1$ s; each molecule then random-walks freely. The middle panel tracks the mixing entropy measured from the counts in 32 cells, $-\sum_\text{cells} \sum_i n_i\ln(n_i/n)$ per molecule, which climbs to the ideal value $-\sum x\ln x$ (dashed). **Change the composition** to move along the curve on the right, which also shows how far each species' chemical potential has dropped, $(\mu - \mu^\circ)/RT = \ln x$. Keep the partition in and nothing changes.`,
      deps: ['thermo-3.4', 'thermo-2.11'],
      see: ['pchem-5.4', 'thermo-4.13'],
      refs: ['Schroeder §5.4', 'Kardar §4.5'],
      tags: ['chemical potential', 'mixing'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Entropy_of_mixing' },
      viz(v) {
        const xs = v.slider('mole fraction of blue $x$', 0.1, 0.9, 0.5, { step: 0.02, fmt: (x) => v.fix(x, 2), onChange: () => v.restart() });
        const keep = v.toggle('keep the partition', false, { onChange: () => v.restart() });
        const sb = v.stage({ x: [-0.04, 2.04], y: [-0.05, 1.05], equal: true, height: 220, axes: false, full: true, title: 'the box' });
        const sh = v.stage({ x: [0, 12], y: [0, 0.75], height: 290, axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'ΔS / Nk', weight: 1, title: 'mixing entropy, measured' });
        const sc = v.stage({ x: [0, 1], y: [-2.5, 0.85], height: 290, axes: 'box', gutter: true, xlabel: 'x (blue)', ylabel: 'ΔS/Nk  and  (μ − μ°)/RT', weight: 1, title: 'ideal mixing' });
        const N = 500, CX = 8, CY = 4;
        const S = v.sim(() => {
          const r = v.rng(21), x = xs.value, nA = Math.round(N * x), wall = 2 * x;
          const P = []; for (let i = 0; i < N; i++) { const a = i < nA; P.push({ x: a ? r() * wall : wall + r() * (2 - wall), y: r(), a }); }
          return { P, r, hist: [], wall, S: 0 };
        }, (st, h, t) => {
          const on = keep.value || t < 1, step = 0.055;
          for (const p of st.P) {
            let nx = p.x + step * st.r.normal(), ny = p.y + step * st.r.normal();
            if (nx < 0) nx = -nx; if (nx > 2) nx = 4 - nx; if (ny < 0) ny = -ny; if (ny > 1) ny = 2 - ny;
            if (on && (p.x < st.wall) !== (nx < st.wall)) nx = p.x;
            p.x = nx; p.y = ny;
          }
          // coarse-grained mixing entropy
          const nA = new Array(CX * CY).fill(0), nB = new Array(CX * CY).fill(0);
          for (const p of st.P) { const k = Math.min(CX - 1, Math.floor(p.x / 2 * CX)) + CX * Math.min(CY - 1, Math.floor(p.y * CY)); if (p.a) nA[k]++; else nB[k]++; }
          let Sm = 0; for (let k = 0; k < CX * CY; k++) { const n = nA[k] + nB[k]; if (nA[k]) Sm -= nA[k] * Math.log(nA[k] / n); if (nB[k]) Sm -= nB[k] * Math.log(nB[k] / n); }
          if (Math.round(t / h) % 6 === 0) st.hist.push([t, Sm / N]);
          st.S = Sm / N;
          return st;
        }, { dt: 1 / 60 });
        let info = null;
        v.animate((t) => {
          S.advance(t);
          const st = S.state, x = xs.value, ideal = -(x * Math.log(x) + (1 - x) * Math.log(1 - x));
          // box
          sb.rect(0, 0, 2, 1, { color: 'ink', width: 2 });
          for (let i = 1; i < CX; i++) sb.line(2 * i / CX, 0, 2 * i / CX, 1, { color: 'grid', width: 0.8 });
          for (let j = 1; j < CY; j++) sb.line(0, j / CY, 2, j / CY, { color: 'grid', width: 0.8 });
          sb.dots(st.P.filter((p) => p.a).map((p) => [p.x, p.y]), { r: 2.6, color: 'blue' });
          sb.dots(st.P.filter((p) => !p.a).map((p) => [p.x, p.y]), { r: 2.6, color: 'orange' });
          if (keep.value || t < 1) sb.line(st.wall, 0, st.wall, 1, { color: 'ink', width: 4 });
          // history
          sh.hline(ideal, { color: 'green', width: 1.6, dash: [6, 4] });
          sh.text(`ideal −Σ x ln x = ${v.fix(ideal, 3)}`, 11.8, ideal, { dy: -9, size: 11, color: 'green', align: 'right', plate: true });
          sh.vline(1, { color: 'muted', width: 1, dash: [3, 3] });
          sh.text('partition removed', 1, 0.05, { dx: 5, size: 10.5, color: 'muted', align: 'left' });
          if (st.hist.length > 1) sh.path(st.hist.filter((q) => q[0] <= 12), { color: 'accent', width: 2.4 });
          // theory panel
          sc.hline(0, { color: 'muted', width: 1 });
          sc.fn((q) => -(q * Math.log(q) + (1 - q) * Math.log(1 - q)), { color: 'green', width: 2.6, domain: [0.001, 0.999] });
          sc.fn((q) => Math.log(q), { color: 'blue', width: 2, domain: [0.08, 1] });
          sc.fn((q) => Math.log(1 - q), { color: 'orange', width: 2, domain: [0, 0.92] });
          sc.dot(x, ideal, { r: 5, color: 'green' }); sc.dot(x, st.S, { r: 4, color: 'accent', hollow: true });
          sc.dot(x, Math.log(x), { r: 4.5, color: 'blue' }); sc.dot(x, Math.log(1 - x), { r: 4.5, color: 'orange' });
          sc.text('blue: ln x', 0.15, Math.log(0.15), { dx: 10, dy: 4, size: 10.5, color: 'blue', align: 'left' });
          sc.text('orange: ln(1 − x)', 0.85, Math.log(0.15), { dx: -10, dy: 4, size: 10.5, color: 'orange', align: 'right' });
          sc.text('−x ln x − (1 − x) ln(1 − x)', 0.12, -(0.12 * Math.log(0.12) + 0.88 * Math.log(0.88)), { dx: 6, dy: -12, size: 10.5, color: 'green', align: 'left', plate: true });
          info = { t, x, ideal, S: st.S, dmuA: R * 298.15 * Math.log(x), dmuB: R * 298.15 * Math.log(1 - x) };
        }, { still: 8, period: 12 });
        v.legend([['blue', 'species A'], ['orange', 'species B'], ['accent', 'measured −Σ n ln(n/n_cell) / N'], ['green', 'ideal $-\\sum x\\ln x$', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { t, x, ideal, S, dmuA, dmuB } = info;
          return `$t$ = ${v.fix(t, 1)} s · measured $\\Delta S/Nk$ = **${v.fix(S, 3)}**, ideal $-[x\\ln x + (1 - x)\\ln(1 - x)]$ = **${v.fix(ideal, 3)}** (a few per cent below it is counting noise in 32 cells of ~16 molecules) · maximum $\\ln 2$ = 0.693 at $x = 1/2$\nper mole at 298 K: $T\\Delta S_{\\text{mix}}$ = ${v.fix(R * 298.15 * ideal / 1e3, 3)} kJ/mol — the least work needed to separate the mixture again · $\\mu_A - \\mu_A^\\circ = RT\\ln x$ = ${v.fix(dmuA / 1e3, 3)} kJ/mol, $\\mu_B - \\mu_B^\\circ$ = ${v.fix(dmuB / 1e3, 3)} kJ/mol`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13', kind: 'Paradox', name: 'Gibbs paradox',
      statement: String.raw`Removing a partition between equal volumes of two *different* ideal gases (same $T$, $P$, $N$ each) raises the entropy by $\Delta S = 2Nk\ln 2$, however slightly the gases differ; removing it between two samples of the *same* gas changes nothing, since reinserting the partition restores the initial state. The mixing entropy thus jumps discontinuously as the gases become identical. Worse, if molecules are counted as distinguishable (classical phase-space counting without the factor $1/N!$), the formula gives $2Nk\ln 2$ even for identical gases and makes the entropy non-extensive, $S(2N, 2V) \ne 2S(N, V)$. The paradox is resolved by treating identical particles as indistinguishable — dividing the phase-space volume by $N!$, which yields the Sackur–Tetrode entropy (5.11) — and by recognising that whether two gases count as "different" depends on whether any available process can separate them.`,
      idea: String.raw`With distinguishable labels, letting $N$ labelled molecules spread from $V$ into $2V$ always multiplies the number of states by $2^N$. Dividing by $N!$ (and $N!^2$ before mixing for two samples of $N$) cancels exactly that factor when the molecules are truly identical, via $\ln\binom{2N}{N} \approx 2N\ln 2$, and leaves it when they are not. Operationally (Jaynes 1992), the entropy increase is the reversible work $2NkT\ln 2$ one could extract with semipermeable membranes that pass one gas and stop the other; if no membrane or process can tell the gases apart, no work is available, and the entropy assigned to the mixing is zero. The discontinuity is real because distinguishability is a yes/no property of the description, not a continuous one.`,
      caption: String.raw`Left: two boxes of gas, $N$ molecules each, before mixing. **Slide the dissimilarity** between the species (0 = identical) and **set the resolution** of the membranes your laboratory owns. The middle panel plots the entropy of mixing against dissimilarity: with correct counting (indistinguishable identical molecules) it is $2Nk\ln 2$ for any difference and drops to zero only at identity — the jump; with classical counting (toggle) it stays at $2Nk\ln 2$ even for identical gases. The work you can actually extract is shown in gold. Right: entropy per molecule of a gas at fixed density as the sample grows — extensive (flat) with $1/N!$, growing like $\ln N$ without it.`,
      deps: ['thermo-4.12'],
      see: ['pchem-9.9', 'thermo-5.11'],
      refs: ['Kardar §4.5'],
      tags: ['Gibbs paradox', 'entropy'],
      credit: 'J. W. Gibbs, 1876 (Equilibrium of Heterogeneous Substances)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gibbs_paradox' },
      viz(v) {
        const del = v.slider('dissimilarity δ', 0, 1, 0.35, { step: 0.01, fmt: (x) => v.fix(x, 2) });
        const res = v.slider('membrane resolution ε', 0, 1, 0.2, { step: 0.01, fmt: (x) => v.fix(x, 2) });
        const cls = v.toggle('classical counting (no 1/N!)', false);
        const sb = v.stage({ x: [0, 2.1], y: [0, 1.3], equal: true, height: 300, axes: false, weight: 0.9, minWidth: 220, title: 'before the partition is removed' });
        const sd = v.stage({ x: [0, 1], y: [-0.1, 1.6], height: 300, axes: 'box', gutter: true, xlabel: 'dissimilarity δ', ylabel: 'ΔS / Nk', weight: 1, title: 'entropy of mixing' });
        const se = v.stage({ x: [1, 1e24], y: [5, 75], xlog: true, height: 300, axes: 'box', gutter: true, xlabel: 'number of molecules N', ylabel: 'S / Nk', weight: 1, title: 'argon at 300 K, 1 bar: extensive?' });
        const pts = (() => { const r = v.rng(4); return Array.from({ length: 70 }, () => [r(), r()]); })();
        let st = null;
        v.render(() => {
          const d = del.value, eps = res.value, ln2 = Math.log(2);
          // boxes
          const cB = v.mix('blue', 'orange', d);
          sb.rect(0.02, 0.15, 1.02, 1.15, { color: 'ink', width: 2 }); sb.rect(1.08, 0.15, 2.08, 1.15, { color: 'ink', width: 2 });
          sb.dots(pts.map(([x, y]) => [0.07 + 0.9 * x, 0.2 + 0.9 * y]), { r: 3.4, color: 'blue' });
          sb.dots(pts.map(([x, y]) => [1.13 + 0.9 * y, 0.2 + 0.9 * x]), { r: 3.4, color: cB });
          sb.text('gas A', 0.52, 0.06, { size: 12, align: 'center', color: 'blue', weight: 650 });
          sb.text(d === 0 ? 'gas A again' : 'gas B', 1.58, 0.06, { size: 12, align: 'center', color: cB, weight: 650 });
          sb.text(d === 0 ? 'identical' : d < eps ? 'different, but no membrane can tell' : 'distinguishable by membranes', 1.05, 1.24, { size: 11.5, align: 'center', color: d === 0 ? 'muted' : d < eps ? 'orange' : 'green', weight: 650 });
          // entropy vs dissimilarity
          sd.hline(2 * ln2, { color: 'faint', width: 1, dash: [3, 3] });
          sd.text('2 ln 2', 0.99, 2 * ln2, { dy: -9, size: 11, color: 'muted', align: 'right' });
          if (cls.value) sd.line(0, 2 * ln2, 1, 2 * ln2, { color: 'red', width: 2.8 });
          else { sd.line(0.004, 2 * ln2, 1, 2 * ln2, { color: 'accent', width: 2.8 }); sd.dot(0, 2 * ln2, { r: 4.5, color: 'accent', hollow: true }); sd.dot(0, 0, { r: 5, color: 'accent' }); }
          // extractable work / NkT
          sd.line(0, 0, eps, 0, { color: 'gold', width: 4, alpha: 0.8 }); sd.line(eps, 2 * ln2, 1, 2 * ln2, { color: 'gold', width: 4, alpha: 0.55 });
          sd.vline(eps, { color: 'gold', width: 1, dash: [4, 3] });
          sd.vline(d, { color: 'ink', width: 1.2 });
          const dS = cls.value ? 2 * ln2 : d > 0 ? 2 * ln2 : 0, Wx = d >= eps && d > 0 ? 2 * ln2 : 0;
          sd.dot(d, dS, { r: 5.5, color: cls.value ? 'red' : 'accent' });
          sd.text(cls.value ? 'classical: even for identical gases' : 'correct counting', 0.5, 2 * ln2 + 0.12, { size: 11, color: cls.value ? 'red' : 'accent', align: 'center' });
          sd.text('extractable work', Math.min(eps, 0.7) + 0.02, 2 * ln2 - 0.12, { size: 10.5, color: 'gold', align: 'left' });
          // extensivity: S/Nk for argon at 300 K, 1 bar
          const m = 39.948 * AMU, T = 300, lam = HP / Math.sqrt(2 * Math.PI * m * KB * T), vper = KB * T / 1e5, a = Math.log(vper / lam ** 3);
          const lnFact = (n) => v.M.lgamma(n + 1);
          const Sq = (n) => a - lnFact(n) / n + Math.log(n) + 1.5;      // ln(V^N / N! λ^3N)/N + 3/2 with V = N v
          const Sc = (n) => a + Math.log(n) + 1.5;                       // without 1/N!
          se.fn(Sq, { color: 'accent', width: 2.6 }); se.fn(Sc, { color: 'red', width: 2.4, dash: cls.value ? null : [6, 4] });
          se.hline(a + 2.5, { color: 'green', width: 1, dash: [3, 3] });
          se.text(`Sackur–Tetrode: ${v.fix(a + 2.5, 2)}`, 1e12, a + 2.5, { dy: -9, size: 11, color: 'green', align: 'center', plate: true });
          se.text('without 1/N!: grows like ln N', 1e16, Sc(1e16), { dy: -10, size: 11, color: 'red', align: 'center', plate: true });
          const N = 6.022e23, ext = 2 * (Sc(N) * N) - Sc(2 * N) * 2 * N;   // 2S(N) − S(2N) per k (classical)
          st = { d, eps, dS, Wx, a, extPerN: ext / N, SqA: (a + 2.5) * R };
        });
        v.legend([['accent', 'indistinguishable (1/N!)'], ['red', 'classical, distinguishable'], ['gold', 'extractable work / NkT']]);
        v.readout(() => {
          if (!st) return '';
          const { d, eps, dS, Wx, a, extPerN, SqA } = st;
          return `δ = ${v.fix(d, 2)}: entropy of mixing **${v.fix(dS, 3)} Nk** ${cls.value ? '(classical counting)' : ''} · membranes resolve δ ≥ ${v.fix(eps, 2)}: extractable work **${v.fix(Wx, 3)} NkT** = ${v.fix(Wx * R * 300 / 1e3, 2)} kJ per mole of each gas at 300 K\nclassical counting: $2S(N, V) - S(2N, 2V)$ = −${v.fix(-extPerN, 3)} $Nk$ = −2 ln 2 $Nk$ — the same amount, so the "paradox" is the non-extensivity · with $1/N!$: $S$ = ${v.fix(SqA, 1)} J/(mol K) for argon at 300 K (JANAF tables, from calorimetry and spectroscopy: 154.97)`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.14
    {
      num: '4.14', kind: 'Law', name: 'Osmotic pressure and colligative properties',
      statement: String.raw`A dilute solution of a non-volatile solute (mole fraction $x_s \ll 1$, molality $m$) in a solvent of molar mass $M$ differs from the pure solvent in ways that depend only on the *number* of dissolved particles, not their kind:
(i) **osmotic pressure** — across a membrane permeable only to the solvent, equilibrium requires an extra pressure on the solution $\Pi = c\,RT$ (van 't Hoff), $c$ the solute concentration;
(ii) **vapour-pressure lowering** (Raoult) $p = x_{\text{solvent}}\,p^*$;
(iii) **boiling-point elevation** $\Delta T_b = K_b\,m$ with $K_b = RT_b^2M/\Delta H_{\text{vap}}$;
(iv) **freezing-point depression** $\Delta T_f = K_f\,m$ with $K_f = RT_f^2M/\Delta H_{\text{fus}}$.
For water $K_f$ = 1.86 K kg/mol and $K_b$ = 0.512 K kg/mol (CRC Handbook). A dissociating solute counts each ion (van 't Hoff factor $i$).`,
      idea: String.raw`Dissolving lowers the solvent's chemical potential by $RT\ln x_{\text{solvent}} \approx -RT\,x_s$ (4.12), while the pure solid and vapour are unaffected. Every equilibrium involving the solvent shifts to compensate. Across a membrane, the solution side needs extra pressure $\Pi$ to raise $\mu$ by $\bar V\Pi$ (Gibbs–Duhem at fixed $T$, 3.6), giving $\Pi\bar V = RT x_s$, i.e. $\Pi = cRT$ — formally the ideal gas law for the solute. Against the solid or the vapour, the coexistence temperature moves until the change of $\mu$ with $T$, i.e. $\Delta S\,\Delta T$, cancels $RT x_s$; with $\Delta S = \Delta H/T$ this is the Clapeyron reasoning of 4.6 and gives $K_f$ and $K_b$.`,
      caption: String.raw`**Set the molality** and the solute. Left: a U-tube with a semipermeable membrane; water flows into the solution (press play) until the extra column of height $h = \Pi/\rho g$ balances the osmotic pressure. Middle and right: chemical potential of each phase minus that of pure liquid water, near 0 °C and near 100 °C. The solution's line sits $RT\ln x_w$ below the pure-water line, so it meets the ice line at a lower temperature and the vapour line at a higher one; the readout compares those crossings with $K_f m$ and $K_b m$, where $K_f$ and $K_b$ are computed from IAPWS latent heats.`,
      deps: ['thermo-4.12', 'thermo-4.6'],
      see: ['pchem-5.13', 'pchem-5.5', 'physio-1.4'],
      refs: ['Schroeder §5.5'],
      tags: ['colligative properties', 'osmosis'],
      credit: 'W. Pfeffer, 1877 (measurements); J. H. van ’t Hoff, 1887; F.-M. Raoult, 1878–1887',
      scope: String.raw`Ideal dilute solutions. Real solutes deviate at higher concentration (osmotic coefficient ≠ 1; for NaCl about 0.92 at 0.5 mol/kg), and ionic solutes dissociate only partly in effect.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Colligative_properties' },
      viz(v) {
        const mol = v.slider('molality m', 0, 2, 0.5, { step: 0.01, fmt: (x) => v.fix(x, 2) + ' mol/kg' });
        const sol = v.select('solute', [{ value: '1', label: 'sucrose (i = 1)' }, { value: '2', label: 'NaCl (ideal i = 2)' }], '1');
        const su = v.stage({ x: [0, 10], y: [-0.8, 10.2], height: 330, axes: false, weight: 0.8, minWidth: 200, title: 'osmosis' });
        const sf = v.stage({ x: [-8, 2], y: [-120, 60], height: 330, axes: 'box', gutter: true, xlabel: 't (°C)', ylabel: 'μ − μ*liquid (J/mol)', weight: 1, title: 'near freezing' });
        const sbp = v.stage({ x: [99, 103], y: [-120, 60], height: 330, axes: 'box', gutter: true, xlabel: 't (°C)', ylabel: null, weight: 1, title: 'near boiling' });
        const Mw = W.M, Tf = 273.15, Tb = 373.124, Hf = W.Lf * Mw, Hv = satW(Tb).L * Mw, Sf = Hf / Tf, Sv = Hv / Tb;
        const Kf = R * Tf * Tf * Mw / Hf, Kb = R * Tb * Tb * Mw / Hv;
        let info = null;
        v.animate((t) => {
          const i = +sol.value, m = mol.value * i, xw = 1 / (1 + m * Mw), lnx = Math.log(xw);
          // osmotic pressure at 25 °C
          const T = 298.15, Vw = Mw / 997.05, PiEx = -R * T / Vw * lnx, PivH = m * R * T * 997.05;   // van 't Hoff with c ≈ m ρ_water (dilute solutions)
          const hEq = PiEx / (997.05 * 9.81), hNow = hEq * (1 - Math.exp(-t / 1.6));
          // U-tube drawing (scaled to the equilibrium height)
          const scale = hEq > 0 ? 3.2 / Math.max(hEq, 1e-9) : 0, base = 3.6, dh = hNow * scale;
          su.rect(1, 1, 4, base - dh / 2, { fill: PHASE.liquid, fillAlpha: 0.35, stroke: false });
          su.rect(6, 1, 9, base + dh / 2, { fill: 'purple', fillAlpha: 0.3, stroke: false });
          su.rect(1, 0.3, 9, 1, { fill: PHASE.liquid, fillAlpha: 0.2, stroke: false });
          for (const [x0, x1] of [[1, 4], [6, 9]]) { su.line(x0, 0.3, x0, 9.2, { color: 'ink', width: 2 }); su.line(x1, 1, x1, 9.2, { color: 'ink', width: 2 }); }
          su.line(1, 0.3, 9, 0.3, { color: 'ink', width: 2 }); su.line(4, 1, 6, 1, { color: 'ink', width: 2 });
          su.line(5, 0.3, 5, 1, { color: 'gold', width: 4, dash: [3, 2] });
          su.text('membrane', 5, -0.35, { size: 10.5, align: 'center', color: 'gold' });
          su.text('pure water', 2.5, 9.6, { size: 11, align: 'center', color: PHASE.liquid, weight: 650 });
          su.text('solution', 7.5, 9.6, { size: 11, align: 'center', color: 'purple', weight: 650 });
          const R2 = v.rng(9);
          for (let k = 0; k < 18; k++) su.dot(6.3 + R2() * 2.4, 1.2 + R2() * (base + dh / 2 - 1.4), { r: 3, color: 'purple', alpha: 0.85 });
          if (hEq > 0) { su.measure(9.5, base - dh / 2, 9.5, base + dh / 2, null, { color: 'ink' }); su.text(`h = ${hNow >= 10 ? v.fix(hNow, 0) : v.fix(hNow, 2)} m (height not to scale)`, 5, 8.6, { size: 11, align: 'center', color: 'ink', plate: true }); }
          const ph = (t * 0.9) % 1; if (hNow < hEq * 0.97) su.arrow(4.4 + ph * 0.4, 0.65, 5.6 + ph * 0.4, 0.65, { color: PHASE.liquid, width: 2, head: 7 });
          // μ diagrams (per mole of water)
          const draw = (s, Tc, Sx, col, name, sign) => {
            s.hline(0, { color: PHASE.liquid, width: 2.4 });
            s.hline(R * (Tc) * lnx, { color: 'purple', width: 2.4 });
            s.fn((tc) => sign * Sx * (tc + 273.15 - Tc), { color: col, width: 2.4 });
            s.text('pure water', s === sf ? -7.8 : 99.1, 0, { dy: -8, size: 11, color: PHASE.liquid, align: 'left' });
            s.text('solution: RT ln x', s === sf ? -7.8 : 99.1, R * Tc * lnx, { dy: 13, size: 11, color: 'purple', align: 'left' });
            const tl = Tc - 273.15 - sign * 100 / Sx;
            s.text(name, tl, -100, { dx: 8, size: 11.5, weight: 650, color: col, align: 'left' });
          };
          const ylo = Math.min(-120, 1.35 * R * Tf * lnx);
          sf.setView([Math.min(-8, -1.25 * (Tf - Tf / (1 - R * lnx / Sf))), 2], [ylo, 60]); sbp.setView([99, 103], [ylo, 60]);
          draw(sf, Tf, Sf, PHASE.solid, 'ice', 1);
          draw(sbp, Tb, Sv, PHASE.gas, 'vapour', -1);
          // exact crossings (constant ΔH): ΔS (T − T*) = ± R T ln x
          const Tfx = Tf / (1 - R * lnx / Sf), Tbx = Tb / (1 + R * lnx / Sv);
          sf.dot(Tf - 273.15, 0, { r: 4.5, color: PHASE.liquid }); sf.dot(Tfx - 273.15, R * Tfx * lnx, { r: 5, color: 'purple' });
          sbp.dot(Tb - 273.15, 0, { r: 4.5, color: PHASE.liquid }); sbp.dot(Tbx - 273.15, R * Tbx * lnx, { r: 5, color: 'purple' });
          if (m > 0.02) { sf.measure(Tfx - 273.15, 35, Tf - 273.15, 35, `ΔTf = ${v.fix(Tf - Tfx, 2)} K`, { math: false, color: 'ink', size: 11 }); sbp.measure(Tb - 273.15, 35, Tbx - 273.15, 35, `ΔTb = ${v.fix(Tbx - Tb, 2)} K`, { math: false, color: 'ink', size: 11 }); }
          info = { m, i, xw, PiEx, PivH, hEq, dTf: Tf - Tfx, dTb: Tbx - Tb, dp: (1 - xw) * psatW(298.15) };
        }, { still: 6, period: 9 });
        v.legend([[PHASE.liquid, 'pure liquid water'], ['purple', 'solution'], [PHASE.solid, 'ice'], [PHASE.gas, 'vapour']]);
        v.readout(() => {
          if (!info) return '';
          const { m, i, xw, PiEx, PivH, hEq, dTf, dTb, dp } = info;
          return `${v.fix(m, 2)} mol of particles per kg (i = ${i}): $x_w$ = ${v.fix(xw, 5)} · at 25 °C: $\\Pi = -(RT/\\bar V)\\ln x_w$ = **${v.fix(PiEx / BAR, 2)} bar**, van 't Hoff $cRT$ ≈ ${v.fix(PivH / BAR, 2)} bar → column $h$ = ${v.fix(hEq, 1)} m · Raoult: vapour pressure lowered by ${v.fix(dp, 1)} Pa (of 3170 Pa)\n$\\Delta T_f$ = **${v.fix(dTf, 3)} K** (crossing) vs $K_f m$ = ${v.fix(Kf * m, 3)} K with $K_f = RT_f^2M/\\Delta H_{\\text{fus}}$ = ${v.fix(Kf, 3)} · $\\Delta T_b$ = **${v.fix(dTb, 3)} K** vs $K_b m$ = ${v.fix(Kb * m, 3)} K with $K_b$ = ${v.fix(Kb, 3)} (CRC: 1.86 and 0.512 K kg/mol)`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.15
    {
      num: '4.15', kind: 'Model', name: 'Chemical equilibrium and the law of mass action',
      statement: String.raw`For a reaction $\sum_i \nu_i A_i = 0$ (stoichiometric coefficients $\nu_i$, negative for reactants) in a mixture at fixed $T$ and $P$, the composition changes along the extent of reaction $\xi$ ($dN_i = \nu_i\,d\xi$) until $G(\xi)$ is minimal, i.e. until $\sum_i \nu_i\mu_i = 0$. For ideal gases ($\mu_i = \mu_i^\circ + RT\ln(x_iP/P^\circ)$) this is the **law of mass action**
$$\prod_i \left(\frac{x_iP}{P^\circ}\right)^{\nu_i} = K(T) = e^{-\Delta G^\circ/RT},\qquad \Delta G^\circ = \sum_i \nu_i\mu_i^\circ = \Delta H^\circ - T\Delta S^\circ.$$
The temperature dependence follows the **van 't Hoff equation** $d\ln K/d(1/T) = -\Delta H^\circ/R$. Disturbing an equilibrium (adding a species, changing $P$ or $T$) makes the reaction quotient $Q \ne K$, and the system relaxes in the direction that reduces $|\ln(Q/K)|$ — the content of Le Chatelier's principle.`,
      idea: String.raw`$G(\xi)$ is the sum of a linear part, the Gibbs energies of the unmixed species, and the mixing term $RT\sum N_i\ln x_i$ (4.12), which is convex with infinite slope at the ends. Their sum therefore has an interior minimum (3.10): no reaction runs exactly to completion. Setting $dG/d\xi = \sum\nu_i\mu_i = \Delta G^\circ + RT\ln Q$ to zero gives $Q = K$. Since $\ln K = -\Delta H^\circ/RT + \Delta S^\circ/R$, a plot of $\ln K$ against $1/T$ is nearly straight with slope $-\Delta H^\circ/R$ (Gibbs–Helmholtz). Pressure enters through $(P/P^\circ)^{\Delta\nu}$, so compression favours the side with fewer gas molecules.`,
      caption: String.raw`**Pick a reaction** and set $T$ and $P$. Left: $G(\xi)$ (ink), computed from JANAF Gibbs energies of formation at the chosen temperature, as the sum of the unmixed line (dashed) and the mixing term (dotted); the green dot is the equilibrium. Middle: the van 't Hoff plot — the line uses $\Delta H^\circ$ and $\Delta S^\circ$ at 298 K from the NIST-JANAF tables, the dots are JANAF's own equilibrium constants (which include the temperature dependence of $\Delta H^\circ$). Bottom: **choose a disturbance** and press play — at $t$ = 1 s it is applied, $Q/K$ jumps, and the composition relaxes to the new equilibrium. Adding argon at fixed volume changes nothing; at fixed pressure it dilutes the mixture and shifts it toward more molecules.`,
      deps: ['thermo-4.12', 'thermo-3.10'],
      see: ['pchem-7.4', 'pchem-7.7', 'pchem-7.9', 'pchem-7.11'],
      refs: ['Schroeder §5.6'],
      tags: ['chemical equilibrium', 'mass action'],
      credit: 'Guldberg & Waage, 1864; van ’t Hoff, 1884; Le Chatelier, 1884',
      scope: String.raw`Ideal-gas mixture: at the high pressures of ammonia synthesis (≈ 200 bar) fugacity corrections of tens of per cent apply. Constant $\Delta H^\circ$ and $\Delta S^\circ$ (straight van 't Hoff line) is accurate over a few hundred kelvin.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Law_of_mass_action' },
      viz(v) {
        const RX = {
          nh3: { label: 'N₂ + 3H₂ ⇌ 2NH₃', sp: ['N2', 'H2', 'NH3'], tex: ['N₂', 'H₂', 'NH₃'], nu: [-1, -3, 2], feed: [1, 3, 0], T: 700, P: 200, Trange: [300, 1000], add: 'add 1 mol N₂', rem: 'remove half the NH₃', kJ: (T) => 2 * interp(JANAF.NH3.logKf, 0, 1, T) },
          no2: { label: 'N₂O₄ ⇌ 2NO₂', sp: ['N2O4', 'NO2'], tex: ['N₂O₄', 'NO₂'], nu: [-1, 2], feed: [1, 0], T: 320, P: 1, Trange: [280, 450], add: 'add 0.5 mol N₂O₄', rem: 'remove half the NO₂', kJ: (T) => 2 * interp(JANAF.NO2.logKf, 0, 1, T) - interp(JANAF.N2O4.logKf, 0, 1, T) },
        };
        const rx = v.select('reaction', [{ value: 'nh3', label: RX.nh3.label }, { value: 'no2', label: RX.no2.label }], 'nh3', { onChange: () => { const r = RX[rx.value]; Ts.set(r.T); Ps.set(r.P); v.restart(); } });
        const Ts = v.slider('$T$', 280, 1000, 700, { step: 1, fmt: (x) => x + ' K', onChange: () => v.restart() });
        const Ps = v.slider('$P$', 0.1, 400, 200, { log: true, fmt: (x) => v.fix(x, x < 10 ? 2 : 0) + ' bar', onChange: () => v.restart() });
        const dist = v.select('disturbance at t = 1 s', [{ value: 'add', label: 'add reactant' }, { value: 'rem', label: 'remove product' }, { value: 'P2', label: 'double P' }, { value: 'T50', label: 'heat by 50 K' }, { value: 'ArP', label: 'add Ar, fixed P' }, { value: 'ArV', label: 'add Ar, fixed V' }], 'P2', { onChange: () => v.restart() });
        const sg = v.stage({ x: [0, 1], y: [0, 1], height: 290, axes: 'box', gutter: true, xlabel: 'extent ξ / ξmax', ylabel: 'G / RT', weight: 1, title: 'Gibbs energy along the reaction' });
        const sv = v.stage({ x: [1, 3.6], y: [-20, 20], height: 290, axes: 'box', gutter: true, xlabel: '1000 K / T', ylabel: 'ln K', weight: 1, title: 'van ’t Hoff plot' });
        const sl = v.stage({ x: [0, 6], y: [0, 1], height: 230, axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'product mole fraction', full: true, title: 'disturb the equilibrium (Le Chatelier)' });
        const thermo = (r) => { const H = r.sp.reduce((a, s, k) => a + r.nu[k] * JANAF[s].H, 0) * 1e3, S = r.sp.reduce((a, s, k) => a + r.nu[k] * JANAF[s].S, 0); return { H, S }; };
        /** log10 Kf of a species at T from JANAF, linear in 1/T (extrapolated beyond the table); 0 for elements. */
        const logKf = (sp, T) => { const t = JANAF[sp].logKf; if (!t) return 0; const rows = t.map(([TT, k]) => [1 / TT, k]).sort((a, b) => a[0] - b[0]); const u = 1 / T; let i = rows.findIndex((q) => q[0] >= u); if (i <= 0) i = i === 0 ? 1 : rows.length - 1; const a = rows[i - 1], b = rows[i]; return a[1] + (b[1] - a[1]) * (u - a[0]) / (b[0] - a[0]); };
        /** Standard chemical potential μ°/RT of a species: −ln Kf (= ΔfG°/RT, elements in their reference state = 0). */
        const mu0 = (sp, T) => -logKf(sp, T) * Math.LN10;
        /** Mixture state: amounts n (array incl. inert last), T, P. */
        const G = (r, n, T, P) => { const tot = n.reduce((a, b) => a + b, 0); let g = 0; r.sp.forEach((s, k) => { if (n[k] > 0) g += n[k] * (mu0(s, T) + Math.log(n[k] / tot * P)); }); const ni = n[r.sp.length]; if (ni > 0) g += ni * Math.log(ni / tot * P); return g; };
        const amounts = (r, base, xi) => r.sp.map((_, k) => base[k] + r.nu[k] * xi).concat([base[r.sp.length] || 0]);
        const range = (r, base) => { let lo = -Infinity, hi = Infinity; r.nu.forEach((nu, k) => { const lim = -base[k] / nu; if (nu < 0) hi = Math.min(hi, lim); else lo = Math.max(lo, lim); }); return [lo, hi]; };
        const lnQK = (r, base, xi, T, P) => { const n = amounts(r, base, xi), tot = n.reduce((a, b) => a + b, 0); let q = 0; r.sp.forEach((sp, k) => { q += r.nu[k] * (Math.log(Math.max(n[k], 1e-300) / tot * P) + mu0(sp, T)); }); return q; };
        const eqXi = (r, base, T, P) => { const [lo, hi] = range(r, base), e = 1e-9 * (hi - lo); return bisect((xi) => lnQK(r, base, xi, T, P), lo + e, hi - e, 80); };
        const prodFrac = (r, n) => n[r.sp.length - 1] / n.reduce((a, b) => a + b, 0);
        // the Le Chatelier run: before/after states
        const run = () => {
          const r = RX[rx.value], T0 = Ts.value, P0 = Ps.value;
          const base0 = r.feed.concat([0]);
          const xi0 = eqXi(r, base0, T0, P0), n0 = amounts(r, base0, xi0);
          // disturbance → new "feed" (amounts at ξ' = 0 equal the disturbed amounts), new T, P
          let n1 = n0.slice(), T1 = T0, P1 = P0;
          const d = dist.value;
          if (d === 'add') n1[0] += rx.value === 'nh3' ? 1 : 0.5;
          if (d === 'rem') n1[r.sp.length - 1] *= 0.5;
          if (d === 'P2') P1 = 2 * P0;
          if (d === 'T50') T1 = T0 + 50;
          if (d === 'ArP') n1[r.sp.length] += 1;
          if (d === 'ArV') { const tot = n1.reduce((a, b) => a + b, 0); n1[r.sp.length] += 1; P1 = P0 * (tot + 1) / tot; }
          const xi1 = eqXi(r, n1, T1, P1);
          // relaxation: dξ/dt = −k ln(Q/K), small explicit steps
          const path = [[0, prodFrac(r, n0)], [1, prodFrac(r, n0)]];
          let xi = 0; const [lo, hi] = range(r, n1), k = 0.9 * Math.abs(xi1) / Math.max(1e-9, Math.abs(lnQK(r, n1, 0, T1, P1))) || 0.1;
          const kk = Math.max(k, 1e-4);
          for (let s = 1; s <= 500; s++) { const h = 0.01; xi -= kk * lnQK(r, n1, xi, T1, P1) * h * 3; xi = clamp(xi, lo + 1e-9 * (hi - lo), hi - 1e-9 * (hi - lo)); path.push([1 + s * h, prodFrac(r, amounts(r, n1, xi))]); }
          return { r, T0, P0, T1, P1, n0, n1, xi0, xi1, path, qk: Math.exp(lnQK(r, n1, 0, T1, P1)), f0: prodFrac(r, n0), f1: prodFrac(r, amounts(r, n1, xi1)) };
        };
        let info = null, cache = null, ckey = '';
        v.animate((t) => {
          const key = [rx.value, Ts.value, Ps.value, dist.value].join('|');
          if (key !== ckey) { cache = run(); ckey = key; }
          const c = cache, r = c.r, T = Ts.value, P = Ps.value, { H, S } = thermo(r);
          // --- G(ξ) ---
          const base = r.feed.concat([0]), [lo, hi] = range(r, base);
          const xs = []; for (let i = 0; i <= 200; i++) xs.push(lo + (hi - lo) * (0.0005 + 0.999 * i / 200));
          const Gv = xs.map((xi) => G(r, amounts(r, base, xi), T, P));
          const lin = (xi) => { const n = amounts(r, base, xi); return r.sp.reduce((a, s, k) => a + n[k] * (mu0(s, T) + Math.log(P)), 0); };
          const mixT = (xi) => G(r, amounts(r, base, xi), T, P) - lin(xi);
          const all = Gv.concat(xs.map(lin)), g0 = Math.min(...Gv), gy = [Math.min(...all), Math.max(...all)];
          const yr = [Math.min(gy[0], g0 - 0.5) - g0, Math.min(gy[1] - g0, (Math.max(...Gv) - g0) * 1.6 + 0.5)];
          sg.setView([0, 1], [yr[0] - 0.05 * (yr[1] - yr[0]), yr[1]]);
          const X = (xi) => (xi - lo) / (hi - lo);
          sg.path(xs.map((xi) => [X(xi), lin(xi) - g0]), { color: 'muted', width: 1.6, dash: [6, 4] });
          sg.path(xs.map((xi) => [X(xi), mixT(xi) + lin(xs[0]) - g0]), { color: 'purple', width: 1.6, dash: [2, 3] });
          sg.path(xs.map((xi, i) => [X(xi), Gv[i] - g0]), { color: 'ink', width: 2.8 });
          const xe = eqXi(r, base, T, P);
          sg.dot(X(xe), G(r, amounts(r, base, xe), T, P) - g0, { r: 6, color: 'green' });
          sg.text(`equilibrium ξ/ξmax = ${v.fix(X(xe), 3)}`, X(xe), G(r, amounts(r, base, xe), T, P) - g0, { dy: -14, size: 11, color: 'green', align: X(xe) > 0.6 ? 'right' : 'left', plate: true });
          sg.text('reactants', 0.02, yr[1], { dy: 12, size: 10.5, color: 'muted', align: 'left' }); sg.text('products', 0.98, yr[1], { dy: 12, size: 10.5, color: 'muted', align: 'right' });
          // --- van 't Hoff ---
          const [Ta, Tb] = r.Trange;
          sv.setView([1000 / Tb - 0.1, 1000 / Ta + 0.1], rx.value === 'nh3' ? [-17, 16] : [-5, 7]);
          sv.fn((u) => -H / (R * 1000 / u) * 1 + S / R, { color: 'accent', width: 2.4 });
          const pts = (r.sp.includes('NH3') ? JANAF.NH3.logKf : JANAF.NO2.logKf).map((q) => q[0]).filter((TT) => TT >= Ta - 1 && TT <= Tb + 1);
          sv.dots(pts.map((TT) => [1000 / TT, r.kJ(TT) * Math.LN10]), { r: 4, color: 'ink' });
          sv.hline(0, { color: 'muted', width: 1 });
          sv.dot(1000 / T, -r.sp.reduce((a, s2, k) => a + r.nu[k] * mu0(s2, T), 0), { r: 5.5, color: 'gold' });
          sv.text(`slope −ΔH°/R = ${v.fix(-H / R / 1000, 2)}×10³ K`, 1000 / Tb + 0.05, rx.value === 'nh3' ? 13 : 6, { size: 11, color: 'accent', align: 'left', plate: true });
          // --- Le Chatelier ---
          const ys = c.path.map((q) => q[1]); const ylo = Math.min(...ys), yhi = Math.max(...ys), pad = Math.max(0.02, 0.25 * (yhi - ylo));
          sl.setView([0, 6], [Math.max(0, ylo - pad), Math.min(1, yhi + pad)]);
          sl.hline(c.f0, { color: 'faint', width: 1, dash: [4, 3] }); sl.hline(c.f1, { color: 'green', width: 1.4, dash: [6, 4] });
          sl.vline(1, { color: 'red', width: 1.2, dash: [3, 3] });
          sl.path(c.path.filter((q) => q[0] <= t), { color: 'accent', width: 2.8 });
          const cur = c.path.filter((q) => q[0] <= t).pop(); if (cur) sl.dot(cur[0], cur[1], { r: 5, color: 'gold' });
          sl.text('new equilibrium', 5.9, c.f1, { dy: c.f1 >= c.f0 ? -9 : 13, size: 11, color: 'green', align: 'right', plate: true });
          sl.text('disturbance', 1, Math.min(1, yhi + pad), { dx: 5, dy: 12, size: 10.5, color: 'red', align: 'left' });
          const lnK = -(H - T * S) / (R * T);
          info = { r, T, P, H, S, lnK, lnKJ: -r.sp.reduce((a, s2, k) => a + r.nu[k] * mu0(s2, T), 0), xe: X(xe), c };
        }, { still: 5, period: 7 });
        v.legend([['ink', 'G(ξ)'], ['muted', 'unmixed species', { dash: true }], ['purple', 'mixing term', { dash: true }], ['accent', "constant ΔH°, ΔS° (van 't Hoff)"], ['ink', 'JANAF K(T)', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { r, T, P, H, S, lnK, lnKJ, xe, c } = info;
          const dir = c.qk < 0.999 ? 'Q < K: shifts toward products' : c.qk > 1.001 ? 'Q > K: shifts toward reactants' : 'Q = K: no shift';
          return `${r.label} · $\\Delta H^\\circ$ = ${v.fix(H / 1e3, 2)} kJ, $\\Delta S^\\circ$ = ${v.fix(S, 2)} J/K (JANAF, 298 K) · at ${T} K: $K$ = $${v.sci(Math.exp(lnKJ), 3)}$ from JANAF (used for $G(\\xi)$), $${v.sci(Math.exp(lnK), 3)}$ on the constant-$\\Delta H^\\circ$ line · equilibrium at ${v.fix(P, P < 10 ? 2 : 0)} bar: product mole fraction **${v.fix(c.f0, 4)}**\ndisturbance "${{ add: r.add, rem: r.rem, P2: 'double P', T50: 'heat by 50 K', ArP: 'add 1 mol Ar at fixed P', ArV: 'add 1 mol Ar at fixed V' }[dist.value]}": right after it $Q/K$ = **${v.fix(c.qk, 4)}** → ${dir}; product fraction ${v.fix(c.f0, 4)} → ${v.fix(c.f1, 4)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.16
    {
      num: '4.16', kind: 'Definition', name: 'Ehrenfest classification of transitions',
      statement: String.raw`Ehrenfest classified phase transitions by the lowest derivative of the Gibbs energy $G(T, P)$ that is discontinuous across the transition. In a **first-order** transition $G$ is continuous but its first derivatives jump: the entropy $S = -(\partial G/\partial T)_P$ (latent heat $L = T\Delta S$) and the volume $V = (\partial G/\partial P)_T$ — melting, boiling, sublimation. In a **second-order** transition $G$, $S$ and $V$ are continuous and the second derivatives jump: heat capacity $C_P = -T\,\partial^2G/\partial T^2$, compressibility and expansivity, as in mean-field theories of magnets and superconductors. Real continuous transitions (the Curie point of iron, the λ point of helium, the critical point of a fluid) usually show *divergences* rather than finite jumps of the second derivatives, so the modern classification distinguishes only first-order transitions (with latent heat) from **continuous** ones.`,
      idea: String.raw`At a first-order transition two distinct phases, each with its own smooth $G$, cross (4.4): the stable $G$ is their lower envelope and has a kink, so its slope $-S$ jumps, and $C_P = T\,dS/dT$ contains a delta function of weight $L$. At a continuous transition the ordered phase grows continuously out of the disordered one — the order parameter starts from zero — so the two branches meet tangentially; Landau theory gives a finite jump in $C_P$, while fluctuations (the exact 2D Ising solution) turn it into a logarithmic or power-law divergence. Ehrenfest's own equations for second-order lines, $dP/dT = \Delta C_P/(TV\Delta\alpha)$, are the analogue of Clausius–Clapeyron (4.6, 3.14).`,
      caption: String.raw`**Pick a transition**: ice melting at 1 atm (Gibbs energies of ice and water built from JANAF/IAPWS entropies, heat capacities and latent heat), a mean-field (Curie–Weiss) magnet, or the exact Onsager solution of the 2D Ising model. Each column is computed from the one to its left by numerical differentiation: $G(T)$, then $S = -dG/dT$, then $C = T\,dS/dT$. **Move the temperature cursor** through the transition. Melting: $G$ has a kink (dashed: metastable continuations), $S$ jumps by $L/T_m$, $C$ has a spike. Mean field: $S$ has only a kink, $C$ jumps by $\tfrac32 k$. Ising: $C$ diverges logarithmically — the readout tests its slope against Onsager's $-\tfrac{8}{\pi}K_c^2\ln|1 - T/T_c|$.`,
      deps: ['thermo-4.5', 'thermo-3.14'],
      see: ['pchem-4.14'],
      refs: ['Callen ch. 9'],
      tags: ['phase transitions', 'classification'],
      credit: 'P. Ehrenfest, 1933',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Phase_transition#Ehrenfest_classification' },
      viz(v) {
        const model = v.select('transition', [{ value: 'ice', label: 'melting of ice (first order)' }, { value: 'mf', label: 'mean-field magnet (second order)' }, { value: 'is', label: '2D Ising (continuous)' }], 'ice');
        const cur = v.slider('temperature cursor', 0.02, 0.98, 0.42, { step: 0.002, fmt: (x) => v.fix(x, 3) });
        const mk = (title, yl) => v.stage({ x: [0, 1], y: [0, 1], height: 300, axes: 'box', gutter: true, xlabel: 'T', ylabel: yl, title, minWidth: 220 });
        const sG = mk('G(T)', 'G'), sS = mk('S = −dG/dT', 'S'), sC = mk('C = T dS/dT', 'C');
        // models: grids of T and the stable G (plus optional branches), per mole (ice) or per spin (k = J = 1)
        const MODELS = {};
        const build = (k) => {
          if (MODELS[k]) return MODELS[k];
          let T = [], Gs = [], br = [], units = {}, Tc;
          if (k === 'ice') {
            const Tm = 273.15, L = W.Lf * W.M, cpl = 4219.4 * W.M, cpi = W.cpIce * W.M, Sl0 = 69.95 - 75.35 * Math.log(298.15 / Tm), Si0 = Sl0 - L / Tm;   // J/mol, JANAF S°(l) at 298 K
            const Gl = (t) => cpl * (t - Tm) - t * (Sl0 + cpl * Math.log(t / Tm)), Gi = (t) => -L + cpi * (t - Tm) - t * (Si0 + cpi * Math.log(t / Tm));
            for (let t = 248; t <= 298.0001; t += 0.05) { T.push(t); Gs.push(Math.min(Gl(t), Gi(t))); }
            br = [[Gl, PHASE.liquid, 'water'], [Gi, PHASE.solid, 'ice']]; Tc = Tm; units = { T: 'K', G: 'kJ/mol', S: 'J/(mol K)', C: 'J/(mol K)', gs: 1e-3 };
          } else if (k === 'mf') {
            const s = (m) => Math.log(2) - ((1 + m) / 2 * Math.log(1 + m) + (1 - m) / 2 * Math.log(Math.max(1e-300, 1 - m)));
            const mOf = (t) => (t >= 1 ? 0 : bisect((m) => m - Math.tanh(m / t), 1e-12, 1, 80));
            for (let t = 0.4; t <= 1.6000001; t += 0.0005) { T.push(t); const m = mOf(t); Gs.push(-m * m / 2 - t * s(m)); }
            br = [[(t) => -t * Math.log(2), 'muted', 'm = 0 branch']]; Tc = 1; units = { T: 'J/k', G: 'J', S: 'k', C: 'k', gs: 1 };
          } else {
            const f = (t) => { const K = 1 / t, kap = 2 * Math.sinh(2 * K) / Math.cosh(2 * K) ** 2; const I = simpson((th) => Math.log((1 + Math.sqrt(Math.max(0, 1 - kap * kap * Math.sin(th) ** 2))) / 2), 0, Math.PI / 2, 400); return -t * (Math.log(2 * Math.cosh(2 * K)) + I / Math.PI); };
            for (let t = 1.2; t <= 3.4000001; t += 0.001) { T.push(t); Gs.push(f(t)); }
            Tc = 2 / Math.log(1 + Math.SQRT2); units = { T: 'J/k', G: 'J', S: 'k', C: 'k', gs: 1 };
          }
          const S0 = deriv(T, Gs).map((x) => -x), C0 = deriv(T, S0).map((x, i) => T[i] * x);
          const cut = (a) => a.slice(3, a.length - 3);   // drop the one-sided differences at the ends
          return (MODELS[k] = { T: cut(T), Gs: cut(Gs), S: cut(S0), C: cut(C0), br, Tc, units });
        };
        let info = null;
        v.render(() => {
          const md = build(model.value), { T, Gs, S, C, br, Tc, units } = md;
          const T0 = T[0], T1 = T[T.length - 1], Tcur = lerp(T0, T1, cur.value), i = clamp(Math.round((Tcur - T0) / (T1 - T0) * (T.length - 1)), 1, T.length - 2);
          const g = Gs.map((x) => x * units.gs);
          const fit = (s, ys, lo, hi) => { s.setView([T0, T1], [lo, hi]); };
          const gl = Math.min(...g), gh = Math.max(...g), gp = 0.06 * (gh - gl);
          fit(sG, g, gl - gp, gh + gp);
          const sl = Math.min(...S), sh = Math.max(...S), spd = 0.08 * (sh - sl);
          fit(sS, S, sl - spd, sh + spd);
          let cl = 0, ch;
          if (model.value === 'ice') ch = 120; else if (model.value === 'mf') ch = 2.2; else ch = 4;
          fit(sC, C, cl - 0.05 * ch, ch);
          for (const s of [sG, sS, sC]) { s.setLabels(`T (${units.T})`, undefined); s.vline(Tc, { color: 'red', width: 1, dash: [3, 4] }); s.vline(Tcur, { color: 'gold', width: 1.4 }); }
          sG.setLabels(undefined, `G (${units.G})`); sS.setLabels(undefined, `S (${units.S})`); sC.setLabels(undefined, `C (${units.C})`);
          for (const [f, col] of br) sG.fn((t) => f(t) * units.gs, { color: col, width: 1.4, dash: [5, 4], domain: [T0, T1] });
          sG.path(T.map((t, k) => [t, g[k]]), { color: 'ink', width: 2.6 });
          if (model.value === 'ice') { sG.text('water', T1, br[0][0](T1) * units.gs, { dx: -4, dy: -9, size: 11, color: PHASE.liquid, align: 'right' }); sG.text('ice', T0, br[1][0](T0) * units.gs, { dx: 6, dy: 14, size: 11, color: PHASE.solid, align: 'left' }); }
          // S, with the jump drawn as a gap
          const jumpAt = model.value === 'ice' ? Tc : null;
          const segS = (lo, hi) => T.map((t, k) => (t >= lo && t <= hi ? [t, S[k]] : null)).filter(Boolean);
          if (jumpAt) { sS.path(segS(T0, jumpAt - 0.06), { color: 'accent', width: 2.6 }); sS.path(segS(jumpAt + 0.06, T1), { color: 'accent', width: 2.6 }); }
          else sS.path(T.map((t, k) => [t, S[k]]), { color: 'accent', width: 2.6 });
          // C
          if (jumpAt) {
            const segC = (lo, hi) => T.map((t, k) => (t >= lo && t <= hi ? [t, C[k]] : null)).filter(Boolean);
            sC.path(segC(T0, jumpAt - 0.1), { color: 'green', width: 2.6 }); sC.path(segC(jumpAt + 0.1, T1), { color: 'green', width: 2.6 });
            sC.arrow(jumpAt, 80, jumpAt, ch * 0.98, { color: 'red', width: 2.4, head: 9 });
            sC.text('δ spike at Tm', T0, ch * 0.9, { dx: 8, size: 10.5, color: 'red', align: 'left' }); sC.text(`area L = ${v.fix(W.Lf * W.M / 1e3, 2)} kJ`, T0, ch * 0.79, { dx: 8, size: 10.5, color: 'red', align: 'left' });
          } else sC.path(T.map((t, k) => [t, Math.min(C[k], ch * 1.5)]), { color: 'green', width: 2.6 });
          sG.dot(Tcur, g[i], { r: 4.5, color: 'gold' }); sS.dot(Tcur, S[i], { r: 4.5, color: 'gold' }); sC.dot(Tcur, Math.min(C[i], ch), { r: 4.5, color: 'gold' });
          // diagnostics
          const k0 = T.findIndex((t) => t >= Tc);
          const dS = S[Math.min(T.length - 1, k0 + 2)] - S[Math.max(0, k0 - 2)];
          const Cbelow = C[Math.max(0, k0 - 3)], Cabove = C[Math.min(T.length - 1, k0 + 3)];
          let isTest = null;
          if (model.value === 'is') {
            const Cat = (tt) => interp(T.map((t, k) => [t, C[k]]), 0, 1, Tc * (1 - tt));
            const slope = (Cat(0.002) - Cat(0.02)) / Math.log(0.02 / 0.002), Kc = 1 / Tc;
            isTest = { slope, onsager: (8 / Math.PI) * Kc * Kc };
          }
          info = { k: model.value, Tcur, G: g[i], S: S[i], C: C[i], Tc, dS, Cbelow, Cabove, isTest, units };
        });
        v.legend([['ink', 'stable G'], ['muted', 'other branch (metastable or unstable)', { dash: true }], ['accent', 'S = −dG/dT'], ['green', 'C = T dS/dT'], ['red', 'transition', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { k, Tcur, G, S, C, Tc, dS, Cbelow, Cabove, isTest, units } = info;
          const head = `at $T$ = ${v.fix(Tcur, 3)} ${units.T}: $G$ = ${v.fix(G, 3)} ${units.G}, $S$ = ${v.fix(S, 3)} ${units.S}, $C$ = ${v.fix(C, 3)} ${units.C}`;
          if (k === 'ice') return `${head}\n**first order**: $S$ jumps by ${v.fix(dS, 2)} J/(mol K) at 273.15 K = $L/T_m$ = ${v.fix(W.Lf * W.M / 273.15, 2)}; volume jumps too: ice 19.65 cm³/mol, water 18.02 cm³/mol · $C_P$: ice ${v.fix(Cbelow, 1)}, water ${v.fix(Cabove, 1)} J/(mol K)`;
          if (k === 'mf') return `${head}\n**second order (Ehrenfest)**: $S$ continuous (change across $T_c$ ${v.fix(dS, 4)} k), $C$ jumps from ${v.fix(Cbelow, 3)} to ${v.fix(Cabove, 3)} k — Landau theory: $\\tfrac32 k$`;
          return `${head} · $T_c = 2/\\ln(1 + \\sqrt2)$ = ${v.fix(Tc, 4)}\n**continuous**: $S$ continuous, $C$ diverges: slope of $C$ against $-\\ln|1 - T/T_c|$ measured between $|t|$ = 0.02 and 0.002: **${v.fix(isTest.slope, 3)}**; Onsager $\\tfrac{8}{\\pi}K_c^2$ = ${v.fix(isTest.onsager, 3)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.17
    {
      num: '4.17', kind: 'Model', name: 'Rankine steam cycle',
      statement: String.raw`The **Rankine cycle**, the ideal model of a steam power plant, takes water through four steps: (1→2) isentropic expansion of high-pressure steam through a turbine, (2→3) condensation at constant low pressure, rejecting heat to cooling water, (3→4) isentropic pumping of the liquid back to boiler pressure, (4→1) heating at constant pressure — warming the liquid, boiling it and usually superheating the steam. Per kilogram, the net work is $w = (h_1 - h_2) - (h_4 - h_3)$, the heat input $q_{\text{in}} = h_1 - h_4$, and the efficiency $\eta = w/q_{\text{in}} = 1 - T_C/\bar T_H$, where $\bar T_H = q_{\text{in}}/\Delta s$ is the mean temperature at which heat is added. Raising the boiler pressure and the superheat raises $\bar T_H$ and the efficiency, which always stays below the Carnot value $1 - T_C/T_1$.`,
      idea: String.raw`Each step is a steady flow, so heat and shaft work equal enthalpy changes (1.14). Pumping a liquid costs little because its volume is small ($w_p = v\Delta P$), while expanding steam delivers a lot: that asymmetry, made possible by the phase change (4.5), is why steam cycles are practical. Heat leaves only at $T_C$, but enters over a range of temperatures, much of it while warming the liquid; hence $\eta = 1 - T_C/\bar T_H$ (2.3, 3.11) is lower than Carnot's. Superheating adds heat at high temperature and also keeps the turbine exhaust drier — wet steam (quality below about 0.88) erodes turbine blades.`,
      caption: String.raw`The cycle on the temperature–entropy diagram of water: the two-phase dome and all states from IAPWS-95 (NIST WebBook), condenser at 10 kPa (45.8 °C). **Choose the boiler pressure** and **the turbine inlet temperature**. The area enclosed is the net work, the area under the top line the heat input; the dashed rectangle is a Carnot cycle between the same extreme temperatures. The right panel draws the energy flows per kilogram as bands. The readout checks $\eta = w/q_{\text{in}}$ against $1 - T_C/\bar T_H$ and warns when the turbine exhaust gets too wet.`,
      deps: ['thermo-4.5', 'thermo-2.3'],
      see: ['thermo-3.11'],
      refs: ['Schroeder §4.3'],
      tags: ['heat engines', 'steam'],
      credit: 'W. J. M. Rankine, 1859',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rankine_cycle' },
      viz(v) {
        const Psel = v.select('boiler pressure', ['0.5', '1', '2', '4', '8', '12', '16'].map((p) => ({ value: p, label: p + ' MPa' })), '8');
        const T1s = v.slider('turbine inlet', 430, 873, 773, { step: 1, fmt: (x) => v.fix(x - 273.15, 0) + ' °C' });
        const ts = v.stage({ x: [0, 9.2], y: [273, 900], height: 380, axes: 'box', gutter: true, xlabel: 's (kJ/(kg K))', ylabel: 'T (K)', weight: 1.35, title: 'Rankine cycle on the T–s diagram of water' });
        const sc = v.stage({ x: [0, 10], y: [0, 10], equal: true, height: 380, axes: false, weight: 0.8, minWidth: 230, title: 'energy per kg of steam' });
        const Pc = 1e4, Tc = tsatW(Pc), c3 = satW(Tc);
        const dome = WSAT.map((r) => [r[4], r[0]]).concat(WSAT.slice().reverse().map((r) => [r[7], r[0]]));
        let st = null;
        v.render(() => {
          const P1 = +Psel.value * MPA, rows = STEAM[Psel.value], Ts = tsatW(P1), cs = satW(Ts);
          const T1 = clamp(T1s.value, rows[0][0], rows[rows.length - 1][0]);
          const h1 = interp(rows, 0, 1, T1) * 1e3, s1 = interp(rows, 0, 2, T1) * 1e3;
          const hf = c3.hl, sf = c3.sl, vf = 1 / c3.rl, wp = vf * (P1 - Pc), h4 = hf + wp;
          let h2, T2, x2;
          if (s1 <= c3.sv) { x2 = (s1 - sf) / (c3.sv - sf); h2 = hf + x2 * (c3.hv - hf); T2 = Tc; }
          else { const r10 = STEAM['0.01']; x2 = 1; T2 = interp(r10, 2, 0, s1 / 1e3); h2 = interp(r10, 2, 1, s1 / 1e3) * 1e3; }
          const wt = h1 - h2, qin = h1 - h4, qout = h2 - hf, w = wt - wp, eta = w / qin, Tbar = qin / (s1 - sf), carnot = 1 - Tc / T1;
          // dome
          ts.poly(dome.map(([s, T]) => [s, T]), { fill: PHASE.liquid, fillAlpha: 0.08, color: 'muted', width: 1.6 });
          ts.dot(WSAT[WSAT.length - 1][4] / 2 + WSAT[WSAT.length - 1][7] / 2, 647.096, { r: 4, color: 'red' });
          // cycle path
          const kJ = (x) => x / 1e3;
          const liqLine = WSAT.filter((r) => r[0] > Tc && r[0] < Ts).map((r) => [r[4], r[0]]);
          const sup = rows.filter((r) => r[0] < T1).map((r) => [r[2], r[0]]).concat([[kJ(s1), T1]]);
          const top = [[kJ(sf), Tc + 0.3], ...liqLine, [kJ(cs.sl), Ts], [kJ(cs.sv), Ts], ...sup];
          const down = x2 < 1 ? [[kJ(s1), Tc]] : [[kJ(s1), T2], ...STEAM['0.01'].filter((r) => r[0] < T2).reverse().map((r) => [r[2], r[0]]), [kJ(c3.sv), Tc]];
          const loop = [...top, ...down, [kJ(sf), Tc]];
          ts.poly(loop, { fill: 'accent', fillAlpha: 0.18, stroke: false });
          ts.rect(kJ(sf), Tc, kJ(s1), T1, { color: 'gold', width: 1.4, dash: [6, 4] });
          ts.path(top, { color: 'red', width: 2.8 });
          ts.path([[kJ(s1), T1], ...down], { color: 'green', width: 2.8 });
          ts.path([...down.slice(-1), [kJ(sf), Tc]], { color: 'blue', width: 2.8 });
          ts.line(kJ(sf), Tc, kJ(sf), Tc + 0.3, { color: 'purple', width: 3 });
          const lab = (txt, s, T, o) => { ts.dot(s, T, { r: 4.5, color: 'ink' }); ts.text(txt, s, T, { size: 12, weight: 700, color: 'ink', ...o }); };
          lab('1', kJ(s1), T1, { dx: 8, dy: -6, align: 'left' }); lab('2', kJ(s1), T2, { dx: 8, dy: 10, align: 'left' }); lab('3', kJ(sf), Tc, { dx: -8, dy: 10, align: 'right' }); lab('4', kJ(sf), Tc + 0.3, { dx: -8, dy: -8, align: 'right' });
          ts.text(`boils at ${v.fix(Ts - 273.15, 0)} °C`, kJ((cs.sl + cs.sv) / 2), Ts, { dy: -9, size: 11, color: 'red', align: 'center', plate: true });
          ts.text('Carnot', kJ(sf), T1, { dx: 6, dy: 12, size: 10.5, color: 'gold', align: 'left' });
          // energy-flow schematic
          const sc2 = 1 / 3500e3 * 60;   // px per J/kg
          const B = [5, 7.9], Tu = [7.7, 5], Co = [5, 2.1], Pu = [2.3, 5];
          sc.path([Pu, [Pu[0], B[1]], B], { color: PHASE.liquid, width: 2 }); sc.path([B, [Tu[0], B[1]], Tu], { color: PHASE.gas, width: 2.4 });
          sc.path([Tu, [Tu[0], Co[1]], Co], { color: PHASE.gas, width: 2, dash: x2 < 1 ? [5, 3] : null }); sc.path([Co, [Pu[0], Co[1]], Pu], { color: PHASE.liquid, width: 2 });
          band(v, sc, [[B[0], B[1] + 1.8], [B[0], B[1] + 0.85]], Math.max(2, qin * sc2), 'red');
          band(v, sc, [[Tu[0] + 0.85, Tu[1]], [Tu[0] + 1.9, Tu[1]]], Math.max(2, wt * sc2), 'green');
          band(v, sc, [[Co[0], Co[1] - 0.85], [Co[0], Co[1] - 1.7]], Math.max(2, qout * sc2), 'blue');
          band(v, sc, [[Pu[0] - 1.6, Pu[1]], [Pu[0] - 0.85, Pu[1]]], Math.max(2, wp * sc2 * 20), 'purple');
          device(sc, B[0], B[1], 0.8, 'boiler', 'red'); device(sc, Tu[0], Tu[1], 0.8, 'turbine', 'green', { size: 11 }); device(sc, Co[0], Co[1], 0.8, 'condenser', 'blue', { size: 10 }); device(sc, Pu[0], Pu[1], 0.8, 'pump', 'purple', { size: 11 });
          sc.text(`heat in ${v.fix(qin / 1e3, 0)} kJ`, B[0] - 1.2, B[1] + 1.35, { size: 11, color: 'red', align: 'right', plate: true });
          sc.text(`work ${v.fix(wt / 1e3, 0)} kJ`, Tu[0] + 0.3, Tu[1] - 1.1, { size: 11, color: 'green', align: 'center' });
          sc.text(`heat out ${v.fix(qout / 1e3, 0)} kJ`, Co[0] - 1.2, Co[1] - 1.3, { size: 11, color: 'blue', align: 'right', plate: true });
          sc.text(`pump ${v.fix(wp / 1e3, 1)} kJ (×20)`, Pu[0], Pu[1] + 1.05, { size: 10.5, color: 'purple', align: 'center' });
          sc.text(`η = ${v.fix(100 * eta, 1)} %`, 5, 5, { size: 16, weight: 700, color: 'accent', align: 'center' });
          st = { P1, T1, Ts, h1, s1, h2, x2, wt, wp, qin, qout, eta, Tbar, carnot, Tc };
        });
        v.legend([['red', 'heat in (4 → 1)'], ['green', 'turbine (1 → 2)'], ['blue', 'condenser (2 → 3)'], ['purple', 'pump (3 → 4)'], ['gold', 'Carnot between T₁ and T_C', { dash: true }], [PHASE.liquid, 'two-phase dome', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { P1, T1, Ts, x2, wt, wp, qin, qout, eta, Tbar, carnot, Tc } = st;
          return `boiler ${v.fix(P1 / MPA, 1)} MPa (boils at ${v.fix(Ts - 273.15, 1)} °C), turbine inlet ${v.fix(T1 - 273.15, 0)} °C · $w_{\\text{turbine}}$ = ${v.fix(wt / 1e3, 1)}, $w_{\\text{pump}}$ = ${v.fix(wp / 1e3, 2)}, $q_{\\text{in}}$ = ${v.fix(qin / 1e3, 1)}, $q_{\\text{out}}$ = ${v.fix(qout / 1e3, 1)} kJ/kg (balance ${v.fix((qin - qout - wt + wp) / 1e3, 3)})\n$\\eta = w/q_{\\text{in}}$ = **${v.fix(100 * eta, 2)} %** · $1 - T_C/\\bar T_H$ with $\\bar T_H = q_{\\text{in}}/\\Delta s$ = ${v.fix(Tbar, 1)} K: ${v.fix(100 * (1 - Tc / Tbar), 2)} % · Carnot $1 - T_C/T_1$ = ${v.fix(100 * carnot, 1)} % · exhaust quality ${x2 < 1 ? v.fix(x2, 3) + (x2 < 0.88 ? ' — **too wet for the turbine blades**' : '') : 'superheated'}`;
        });
      },
    },
  ],
};
