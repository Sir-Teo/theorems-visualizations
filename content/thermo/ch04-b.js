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
      caption: String.raw`Left: the van der Waals phase diagram in reduced density and temperature — coexistence curve (binodal, ink) and spinodal (red dashed); the band between them is metastable. **Drag the quench point** (it restarts the run). Right: a 64 × 64 Cahn–Hilliard simulation of the fluid's density after the quench (van der Waals free energy plus a gradient term; dark = dense, liquid). Inside the spinodal, tiny noise grows into an interconnected pattern at once. In the metastable band nothing happens — until you **seed a droplet**: below a critical radius it dissolves, above it grows by draining the supersaturated vapour. Outside the binodal the fluid is simply stable.`,
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
          const { p } = st, D = p.rs * p.rs / (p.Gs / p.kT) * 0.6;   // diffusion constant: the drift moves clusters by ~r* in a few seconds
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
        }, { still: 1.6, period: 8 });
        v.legend([['ink', 'ΔG(r)'], ['orange', 'surface cost', { dash: true }], ['blue', 'bulk gain', { dash: true }], ['gold', 'clusters', { dot: true }], ['accent', 'rate J(T)']]);
        v.readout(() => {
          if (!info) return '';
          const { T, rs, hb, n, tHom, J1, fac } = info;
          return `at ${v.fix(T - 273.15, 1)} °C: critical radius $r^*$ = **${v.fix(rs, 2)} nm** (≈ ${v.fix(n, 0)} molecules), barrier $\\Delta G^*$ = **${v.fix(hb, 1)} kT** · rate $J$ = $${v.sci(J1, 2)}$ m⁻³ s⁻¹, ×${v.fix(fac, 1)} for each further kelvin of supercooling\npredicted homogeneous freezing temperature (10 µm droplet, ~1 s): **${v.fix(tHom, 1)} °C** with γ = ${v.fix(gam.value, 1)} mJ/m²; observed for micrometre droplets: about −38 °C`;
        });
      },
    },
  ],
};
