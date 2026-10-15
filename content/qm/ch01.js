// Quantum Mechanics — Chapter 1: The quantum revolution (items 1.1–1.7; 1.8–1.14 in ch01-b.js)

// ---------- shared helpers ----------
/** Visible wavelength (nm) → [r, g, b] (piecewise-linear spectral ramp, dimmed at the ends of the eye's range); null outside 380–750 nm. */
function wlRGB(nm) {
  if (!(nm >= 380 && nm <= 750)) return null;
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else r = 1;
  const f = nm < 420 ? 0.35 + 0.65 * (nm - 380) / 40 : nm > 700 ? 0.35 + 0.65 * (750 - nm) / 50 : 1;
  return [r, g, b].map((c) => Math.round(255 * Math.pow(c * f, 0.8)));
}
/** Colour for a photon of wavelength nm: its true colour if visible, else a palette stand-in (UV purple, IR red). */
const photonColor = (nm) => wlRGB(nm) || (nm < 380 ? 'purple' : 'red');
const DARK = [14, 15, 22]; // the inside of a spectroscope: dark in both themes
/** Deterministic uniform generator (mulberry32) from an integer seed. */
function hrand(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** Poisson sample with mean lam (Knuth below 30, normal approximation above). */
function poisson(r, lam) {
  if (lam <= 0) return 0;
  if (lam < 30) { const L = Math.exp(-lam); let k = 0, p = r(); while (p > L) { k++; p *= r(); } return k; }
  const u = r() || 1e-12, w = r();
  return Math.max(0, Math.round(lam + Math.sqrt(lam) * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * w)));
}
/** A wavy photon drawn along the segment p → q with n crests. */
function wiggle(s, p, q, n, amp, st) {
  const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, pts = [];
  for (let i = 0; i <= 60; i++) { const f = i / 60, a = amp * Math.sin(2 * Math.PI * n * f) * Math.sin(Math.PI * f); pts.push([p[0] + f * dx + a * nx, p[1] + f * dy + a * ny]); }
  s.path(pts, { width: 2, ...st });
}
// Hydrogen lines: measured vacuum wavelengths (nm, NIST, rounded) as [n1, n2, λ].
const HLINES = [
  [1, 2, 121.567], [1, 3, 102.572], [1, 4, 97.254], [1, 5, 94.974], [1, 6, 93.780],
  [2, 3, 656.461], [2, 4, 486.272], [2, 5, 434.169], [2, 6, 410.294], [2, 7, 397.120], [2, 8, 389.016],
  [3, 4, 1875.61], [3, 5, 1282.16], [3, 6, 1094.11], [3, 7, 1005.21],
  [4, 5, 4052.3], [4, 6, 2625.9], [4, 7, 2166.1],
  [5, 6, 7459.9], [5, 7, 4653.8],
];
const SERIES = { 1: { name: 'Lyman', sym: 'Ly', color: 'purple' }, 2: { name: 'Balmer', sym: 'H', color: 'accent' }, 3: { name: 'Paschen', sym: 'Pa', color: 'orange' }, 4: { name: 'Brackett', sym: 'Br', color: 'red' }, 5: { name: 'Pfund', sym: 'Pf', color: 'teal' } };
const GREEK = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η'];
const lineName = (n1, n2) => SERIES[n1].sym + GREEK[n2 - n1 - 1];
/** Reduced-mass Rydberg constant for a nucleus of mass Mn (kg). */
const rydberg = (C, Mn) => C.Ry / (1 + C.me / Mn);
/** Lowest k eigenvalues of a symmetric tridiagonal matrix (diagonal d, constant off-diagonal e) by Sturm-sequence bisection. */
function sturmEigs(d, e, k) {
  const n = d.length, e2 = e * e;
  const count = (lam) => { let c = 0, q = 1; for (let i = 0; i < n; i++) { q = d[i] - lam - (i ? e2 / q : 0); if (q === 0) q = -1e-300; if (q < 0) c++; } return c; };
  let dmin = Infinity, dmax = -Infinity; for (const x of d) { if (x < dmin) dmin = x; if (x > dmax) dmax = x; }
  const out = [];
  for (let j = 1; j <= k; j++) {
    let lo = dmin - 2 * Math.abs(e), hi = dmax + 2 * Math.abs(e);
    for (let it = 0; it < 64; it++) { const mid = (lo + hi) / 2; if (count(mid) >= j) hi = mid; else lo = mid; }
    out.push((lo + hi) / 2);
  }
  return out;
}

export default {
  collection: 'qm',
  chapter: 1,
  title: 'The quantum revolution',
  summary: String.raw`Between 1900 and 1927 a string of experiments broke classical physics. Oscillator energies come in quanta $hf$ (Planck); light knocks electrons out of metals as particles carrying $hf$ and recoils off them with momentum $h/\lambda$ (Einstein, Compton); atoms emit sharp lines that fit the Rydberg formula and do not collapse; electrons lose energy to atoms only in fixed lumps (Franck–Hertz), diffract from crystals like waves of length $h/p$ (de Broglie, Davisson–Germer); and silver atoms passing a magnet land in just two spots (Stern–Gerlach). The Bohr model and Bohr–Sommerfeld quantization explained part of this, and the correspondence principle tied it to classical physics at large quantum numbers. Single-particle double-slit and sequential Stern–Gerlach experiments distil what any new theory must explain: individual events are random, their statistics interfere, and measurement changes the state.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Hypothesis',
      name: 'Planck’s quantum of action',
      credit: 'Planck, 1900',
      statement: String.raw`**Hypothesis.** An electromagnetic mode of frequency $f$ in a cavity whose walls are at temperature $T$ can hold energy only in whole multiples of a quantum,
$$E_n=n\,hf,\qquad n=0,1,2,\dots,\qquad h=6.626\times10^{-34}\ \text{J s}.$$
With Boltzmann weights $e^{-E_n/kT}$ the mean energy of a mode becomes $\langle E\rangle=hf/(e^{hf/kT}-1)$ instead of the classical equipartition value $kT$. Multiplying by the number of modes per unit volume and frequency, $8\pi f^2/c^3$, gives **Planck’s law** for the power radiated by a black surface per unit area and wavelength,
$$M_\lambda(T)=\frac{2\pi hc^2}{\lambda^5}\,\frac{1}{e^{hc/\lambda kT}-1}.$$
It implies
(a) Wien’s displacement law $\lambda_{\max}T=b=2.898\times10^{-3}$ m K;
(b) the Stefan–Boltzmann law $\int_0^\infty M_\lambda\,d\lambda=\sigma T^4$, $\sigma=2\pi^5k^4/15c^2h^3$;
(c) as $h\to0$, the classical Rayleigh–Jeans law $M_\lambda=2\pi ckT/\lambda^4$, whose total diverges at short wavelengths (the *ultraviolet catastrophe*).`,
      idea: String.raw`Counting standing waves in a box (em-11.18, waves-2.8) gives $8\pi f^2/c^3$ modes per unit volume and frequency; equipartition hands each one $kT$, so the classical spectrum grows without bound. Planck's ladder changes the average: a mode with $hf\gg kT$ can almost never afford even one quantum (Boltzmann factor $e^{-hf/kT}$), so high-frequency modes freeze out and the spectrum turns over. Summing the geometric series $\sum nhf\,e^{-nhf/kT}$ gives $\langle E\rangle$; in the variable $x=hc/\lambda kT$ the peak sits at $x=4.965$ (Wien) and the area is $\propto T^4\int_0^\infty x^3/(e^x-1)\,dx=T^4\pi^4/15$ (Stefan–Boltzmann). When $hf\ll kT$ the rungs are so close that the sum becomes the classical integral and $\langle E\rangle\to kT$.`,
      caption: String.raw`Slide the temperature: the computed Planck curve (blue) peaks at the dot, and the readout checks the peak against $b/T$ and the numerically integrated area against $\sigma T^4$. The red Rayleigh–Jeans curve agrees at long wavelengths and runs off to infinity at short ones. Now **shrink $h$**: the quanta get smaller, the curve climbs onto the classical one and the total power blows up like $h^{-3}$. Drag the purple marker to pick one mode: the right panel shows its energy ladder with Boltzmann populations — a mode with $hf\gg kT$ is stuck on the bottom rung.`,
      scope: String.raw`Holds for radiation in thermal equilibrium with a black (perfectly absorbing) surface; real surfaces emit $\varepsilon(\lambda)M_\lambda$ with emissivity $\varepsilon\le1$. The classical Rayleigh–Jeans limit is accurate only when $hf\ll kT$, i.e. $\lambda T\gg hc/k=1.44$ cm K.`,
      deps: ['em-11.18', 'waves-2.8'],
      see: ['thermo-9.4', 'thermo-9.5', 'thermo-9.6', 'thermo-9.3'],
      refs: ['Hall ch. 1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Planck%27s_law' },
      tags: ['blackbody', 'quanta'],
      viz(v) {
        const M = v.M, C = M.CONST, h0 = C.h, WX = 4.965114231744276;
        const Ts = v.slider('temperature $T$', 300, 30000, 5772, { log: true, fmt: (x) => `${Math.round(x)} K` });
        const hs = v.slider('Planck’s constant $h/h_0$', 0.01, 1, 1, { log: true, fmt: (x) => x.toPrecision(2) });
        const s = v.stage({ x: [0, 2.5], y: [0, 1], height: 340, axes: 'box', xlabel: 'λ (μm)', weight: 1.55, title: 'spectral exitance' });
        const m = v.stage({ x: [0, 1.08], y: [0, 6], height: 340, axes: 'box', xlabel: 'population', ylabel: 'E / kT', weight: 0.8, title: 'one mode: rungs $nhf$, populations $e^{-E/kT}$' });
        const planck = (lu, T, h) => { const l = lu * 1e-6, x = h * C.c / (l * C.kB * T); return x > 700 ? 0 : 2 * Math.PI * h * C.c * C.c / l ** 5 / Math.expm1(x) * 1e-6; };
        const rj = (lu, T) => { const l = lu * 1e-6; return 2 * Math.PI * C.c * C.kB * T / l ** 4 * 1e-6; };
        const total = (T, h) => { const lp = h * C.c / (WX * C.kB * T); return M.integrate((u) => { const l = Math.exp(u); return planck(l * 1e6, T, h) * 1e6 * l; }, Math.log(lp * 0.01), Math.log(lp * 1e4), 3000); };
        const PFX = ['', 'k', 'M', 'G', 'T'];
        const NAMES = [[300, 'room temperature'], [1900, 'candle flame'], [2800, 'tungsten filament'], [5772, 'the Sun’s surface'], [9600, 'Vega'], [25000, 'a hot blue star']];
        const pick = s.handle(1.4, 0, { color: 'purple', r: 7, constrain: 'x' });
        let lastX = null, st = null;
        v.render(() => {
          const T = Ts.value, h = hs.value * h0, xmax = 5 * C.b / T * 1e6;
          if (lastX != null && Math.abs(xmax / lastX - 1) > 1e-9) pick.x *= xmax / lastX;
          lastX = xmax;
          const Mpk = planck(C.b / T * 1e6, T, h0), k3 = M.clamp(Math.floor(Math.log10(1.3 * Mpk) / 3), 0, 4), U = 10 ** (3 * k3), ymax = 1.3 * Mpk / U;
          s.setView([0, xmax], [0, ymax]);
          pick.x = M.clamp(pick.x, xmax * 0.03, xmax * 0.97); pick.y = ymax * 0.06;
          s.setTitle(`spectral exitance $M_\\lambda$ (${PFX[k3]}W m⁻² μm⁻¹)`);
          // visible band
          for (let nm = 380; nm < 750; nm += 4) if (nm / 1000 < xmax) s.rect(nm / 1000, 0, Math.min(xmax, (nm + 4) / 1000), ymax * 0.03, { fill: wlRGB(nm + 2), fillAlpha: 0.95, stroke: false });
          const dom = { domain: [xmax * 1e-3, xmax] };
          if (hs.value < 0.995) s.fn((x) => planck(x, T, h0) / U, { color: 'muted', width: 1.4, dash: [5, 4], ...dom });
          s.fn((x) => rj(x, T) / U, { color: 'red', width: 2.2, dash: [8, 5], ...dom });
          s.fn((x) => planck(x, T, h) / U, { color: 'accent', width: 2.8, fill: 'accent', fillAlpha: 0.1, ...dom });
          // the peak of the computed curve
          let best = -1, lp = 0;
          for (let i = 0; i <= 600; i++) { const x = xmax * 1e-4 * Math.pow(1e4, i / 600), y = planck(x, T, h); if (y > best) { best = y; lp = x; } }
          let a = lp / 1.02, b = lp * 1.02;
          for (let it = 0; it < 80; it++) { const m1 = a + (b - a) * 0.382, m2 = a + (b - a) * 0.618; if (planck(m1, T, h) > planck(m2, T, h)) b = m2; else a = m1; }
          lp = (a + b) / 2; const yp = planck(lp, T, h) / U;
          if (yp < ymax * 0.97) { s.line(lp, 0, lp, yp, { color: 'green', dash: [4, 4], width: 1.2 }); s.dot(lp, yp, { r: 5, color: 'green', label: 'λ_max', labelPos: lp > xmax * 0.6 ? 'nw' : 'ne' }); }
          else s.corner(`Planck peak is off the chart: ${v.fix(yp / ymax, 0)}× higher, at λ = ${M.si(lp * 1e-6, 'm')}`, 'tr', { color: 'accent' });
          // curve labels
          const xr = Math.pow(2 * Math.PI * C.c * C.kB * T * 1e-6 / (0.88 * ymax * U), 0.25) * 1e6; // where Rayleigh–Jeans leaves the top
          if (xr < xmax * 0.9) s.text('Rayleigh–Jeans (classical)', xr, ymax * 0.88, { color: 'red', size: 12, dx: 8 });
          if (yp < ymax * 0.97) s.text('Planck', lp, yp, { color: 'accent', size: 12.5, dx: 10, dy: -14 });
          const name = NAMES.find(([TT]) => Math.abs(Math.log(T / TT)) < 0.12);
          if (name && yp < ymax * 0.97) s.corner(`≈ ${name[1]}`, 'tr', { color: 'muted' });
          // the picked mode
          const yq = planck(pick.x, T, h) / U;
          s.line(pick.x, pick.y, pick.x, Math.min(yq, ymax), { color: 'purple', width: 1.4 });
          if (yq < ymax) s.dot(pick.x, yq, { r: 4, color: 'purple' });
          // its ladder
          const xq = h * C.c / (pick.x * 1e-6 * C.kB * T);
          m.curve((u) => [Math.exp(-u), u], 0, 6, { color: 'muted', dash: [4, 4], width: 1.2 });
          const nR = Math.min(Math.floor(6 / xq), 400);
          for (let n = 0; n <= nR; n++) { const y = n * xq; m.line(0, y, Math.exp(-y), y, { color: 'accent', width: nR > 60 ? 1 : nR > 20 ? 1.6 : 3, alpha: nR > 60 ? 0.6 : 1 }); }
          let num = 0, den = 0; const N = Math.min(400000, Math.ceil(45 / xq) + 2);
          for (let n = 0; n < N; n++) { const w = Math.exp(-n * xq); num += n * xq * w; den += w; if (w < 1e-18) break; }
          const mean = num / den;
          m.hline(1, { color: 'red', dash: [6, 4], width: 1.6 });
          m.hline(mean, { color: 'green', width: 2.2 });
          m.text('classical kT', 1.06, 1, { color: 'red', size: 11.5, align: 'right', dy: -9 });
          m.text(`mean ⟨E⟩ = ${v.fix(mean, 3)} kT`, 1.06, mean, { color: 'green', size: 11.5, align: 'right', dy: mean > 0.25 ? 9 : -9 });
          m.corner(xq > 6 ? `first rung at hf = ${v.fix(xq, 1)} kT (off the chart)` : `rung spacing hf = ${v.fix(xq, xq < 0.1 ? 3 : 2)} kT`, 'tr', { color: 'purple' });
          st = { T, lp, wien: C.b * hs.value / T * 1e6, tot: total(T, h), sb: C.sigma / hs.value ** 3 * T ** 4, rjc: 2 * Math.PI * C.c * C.kB * T / (3 * (10e-9) ** 3), xq, mean, f: C.c / (pick.x * 1e-6) };
        });
        v.legend([['accent', 'Planck, computed with $h$'], ['red', 'Rayleigh–Jeans ($h\\to0$)', { dash: true }], ['muted', 'Planck with the true $h_0$', { dash: true }], ['purple', 'picked mode']]);
        v.readout(() => st && `**Wien:** peak of the computed curve at $\\lambda_{\\max} =$ ${M.si(st.lp * 1e-6, 'm', 4)}; $b\\,(h/h_0)/T =$ ${M.si(st.wien * 1e-6, 'm', 4)}. **Stefan–Boltzmann:** $\\int M_\\lambda d\\lambda =$ ${M.si(st.tot, 'W/m²', 5)} (numerical) vs $\\sigma T^4 =$ ${M.si(st.sb, 'W/m²', 5)}${hs.value < 0.995 ? ` — up by $(h_0/h)^3 = ${v.sci((1 / hs.value) ** 3, 2)}$` : ''}. **Rayleigh–Jeans:** the power beyond 10 nm alone is ${M.si(st.rjc, 'W/m²', 2)}, and it grows as (cutoff)$^{-3}\\to\\infty$. **Picked mode** $f =$ ${M.si(st.f, 'Hz')}: $hf = ${v.fix(st.xq, 3)}\\,kT$, mean energy $${v.fix(st.mean, 4)}\\,kT$ (formula $x/(e^x-1) = ${v.fix(st.xq / Math.expm1(st.xq), 4)}$).`);
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Phenomenon',
      name: 'Photoelectric effect',
      credit: 'Hertz, 1887; Lenard, 1902; Einstein, 1905; Millikan, 1916',
      statement: String.raw`Light falling on a clean metal surface ejects electrons, with these regularities:
(a) there is a **threshold frequency** $f_0=\varphi/h$, set by the metal's work function $\varphi$: below it no electrons emerge, however intense the light;
(b) above it the **maximum kinetic energy** of the electrons is $K_{\max}=hf-\varphi$, measured as $eV_s$ where $V_s$ is the stopping voltage; it rises linearly with $f$ with the universal slope $h$ and does **not** depend on the intensity;
(c) the **photocurrent** (electrons per second) is proportional to the intensity;
(d) emission starts without measurable delay (< $10^{-9}$ s) even in very faint light.
Einstein's explanation: light delivers energy in quanta $hf$, each absorbed by a single electron, which spends $\varphi$ (or more) to leave the metal.`,
      idea: String.raw`In the wave picture the energy delivered to an electron grows with the intensity and the time it soaks, so bright light of any colour should eject faster electrons, after a delay. Einstein's quanta (1.1 applied to light itself) replace the soaking by a single absorption: one photon, one electron, energy budget $hf=\varphi+K$. Intensity is the number of photons per second (em-11.5), so it sets the current but not the energy per electron. Electrons starting below the surface level lose more than $\varphi$, so energies spread from $0$ to $hf-\varphi$, and the retarding voltage that stops the fastest one measures $hf-\varphi$. Millikan's careful plots of $V_s$ against $f$ (1916) gave $h/e$ to within 1 %.`,
      caption: String.raw`Choose the metal, the colour and the brightness. In the tube, photons (wiggles) hit the cathode and knock out electrons (blue dots) that coast against the anode voltage $V$; with $V<0$ slow ones turn back. The I–V curves are computed from 4000 sampled electron energies at half, one and two times the irradiance: **brightness rescales the current, but all three reach zero at the same stopping voltage** (green). Lengthen the wavelength past the threshold and the current vanishes at any brightness. Right: stopping voltage against frequency is a line of slope $h/e$ for every metal.`,
      deps: ['qm-1.1', 'em-11.5'],
      refs: ['Hall ch. 1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Photoelectric_effect' },
      tags: ['photons', 'photoelectric effect'],
      viz(v) {
        const M = v.M, C = M.CONST, ETA = 2e-4, AREA = 1e-4, SIG = 1e-20;
        const MET = { Cs: { label: 'caesium', phi: 2.14, col: 'gold' }, Na: { label: 'sodium', phi: 2.36, col: 'orange' }, Zn: { label: 'zinc', phi: 4.33, col: 'teal' } };
        const metal = v.select('cathode', Object.entries(MET).map(([value, m]) => ({ value, label: `${m.label}, φ = ${m.phi} eV` })), 'Na');
        const lam = v.slider('wavelength λ', 180, 700, 400, { step: 1, fmt: (x) => `${Math.round(x)} nm` });
        const irr = v.slider('irradiance', 0.25, 4, 1, { log: true, fmt: (x) => `${x.toFixed(2)} W/m²` });
        const Vs = v.slider('anode voltage $V$', -5, 3, -0.5, { step: 0.01, fmt: (x) => `${v.fix(x, 2)} V` });
        const tube = v.stage({ x: [-0.3, 1.3], y: [-0.66, 0.66], height: 220, axes: false, full: true });
        const iv = v.stage({ x: [-5, 3], y: [0, 1], height: 250, axes: 'box', xlabel: 'V (volts)', ylabel: 'I (nA)', weight: 1.15, title: 'photocurrent against anode voltage' });
        const mk = v.stage({ x: [0, 1.7], y: [0, 5.2], height: 250, axes: 'box', xlabel: 'f (10¹⁵ Hz)', ylabel: 'V_s (volts)', weight: 1, title: 'stopping voltage against frequency' });
        const rng = v.rng(11), NS = 4000, U = Array.from({ length: NS }, () => rng()).sort((a, b) => a - b);
        const frac = (K, V) => { if (K <= 0) return 0; if (V >= 0) return 1; const q = -V / K; let lo = 0, hi = NS; while (lo < hi) { const mid = (lo + hi) >> 1; if (U[mid] <= q) lo = mid + 1; else hi = mid; } return (NS - lo) / NS; };
        const LAMP = [0.5, 0.6], DT = 0.05, FLY = 0.35;
        let st = null;
        v.animate((t) => {
          const met = MET[metal.value], E = C.h * C.c / (lam.value * 1e-9) / C.eV, K = E - met.phi, V = Vs.value;
          const rate = irr.value * AREA / (E * C.eV), Isat = (q) => C.e * ETA * q * AREA / (E * C.eV) * 1e9; // nA at irradiance q
          const cur = K > 0 ? Isat(irr.value) * frac(K, V) : 0, Vsm = K > 0 ? K * U[NS - 1] : 0;
          const pc = photonColor(lam.value);
          // ---- tube
          tube.rect(-0.06, -0.45, 0, 0.45, { fill: 'muted', fillAlpha: 0.85, stroke: false });
          tube.rect(1, -0.45, 1.05, 0.45, { fill: 'muted', fillAlpha: 0.5, stroke: false });
          tube.text(`cathode (${met.label})`, -0.03, -0.53, { align: 'center', color: 'ink', size: 12 });
          tube.text('anode', 1.025, -0.53, { align: 'center', color: 'ink', size: 12 });
          tube.path([[-0.03, -0.45], [-0.03, -0.6], [0.36, -0.6]], { color: 'muted', width: 1.4 });
          tube.path([[0.44, -0.6], [1.025, -0.6], [1.025, -0.45]], { color: 'muted', width: 1.4 });
          tube.line(0.37, -0.57, 0.37, -0.63, { color: 'ink', width: 2 }); tube.line(0.43, -0.55, 0.43, -0.65, { color: 'ink', width: 2 });
          tube.text(`V = ${v.fix(V, 2)} V`, 0.4, -0.6, { color: 'ink', size: 12, dx: 30, align: 'left' });
          tube.circle(0.85, -0.6, 0.035, { color: 'ink', width: 1.4, fill: 'panel', fillAlpha: 1 });
          tube.text('A', 0.85, -0.6, { align: 'center', size: 11, color: 'ink' });
          tube.text(M.si(cur * 1e-9, 'A'), 0.9, -0.6, { color: 'green', size: 12, align: 'left', weight: 600 });
          tube.circle(LAMP[0], LAMP[1], 0.04, { fill: Array.isArray(pc) ? pc : pc, fillAlpha: 0.9, color: 'muted', width: 1 });
          tube.text('lamp', LAMP[0] + 0.05, LAMP[1], { color: 'muted', size: 11.5, align: 'left' });
          // photons and electrons, generated per 50 ms bin with a deterministic generator
          const R = 24 * irr.value, k0 = Math.floor((t - 3.4) / DT), k1 = Math.floor(t / DT);
          const els = [];
          for (let k = Math.max(0, k0); k <= k1; k++) {
            const r = hrand(k * 7919 + 17), n = poisson(r, R * DT);
            for (let i = 0; i < n; i++) {
              const t0 = (k + r()) * DT, y0 = (r() - 0.5) * 0.8, u = r();
              if (t0 > t) continue;
              const q = (t - t0) / FLY;
              if (q < 1) { const P = [LAMP[0] + q * (0 - LAMP[0]), LAMP[1] + q * (y0 - LAMP[1])], dir = [-LAMP[0], y0 - LAMP[1]], L = Math.hypot(...dir), back = 0.07; wiggle(tube, [P[0] - back * dir[0] / L, P[1] - back * dir[1] / L], P, 2.5, 0.016, { color: pc, width: 1.8 }); continue; }
              if (K <= 0) continue;
              const tau = 1.4 * (t - t0 - FLY), w0 = Math.sqrt(u * K), x = w0 * tau + V * tau * tau / 4;
              if (x < 0 || x > 1) continue;
              els.push([x, y0]);
            }
          }
          tube.dots(els, { r: 3.2, color: 'accent' });
          tube.corner(K <= 0 ? `hf = ${v.fix(E, 2)} eV < φ = ${met.phi} eV: no electrons, however bright` : V < 0 ? `retarding: only electrons with K > ${v.fix(-V, 2)} eV reach the anode` : 'accelerating: every emitted electron is collected', 'tl', { color: K <= 0 ? 'red' : 'muted' });
          // ---- I–V curves
          const Imax = Isat(4) * 1.12;
          iv.setView([-5, 3], [0, Imax]);
          for (const [q, col, w] of [[irr.value * 2, 'muted', 1.3], [irr.value / 2, 'muted', 1.3], [irr.value, 'accent', 2.8]]) {
            const pts = []; for (let i = 0; i <= 400; i++) { const VV = -5 + 8 * i / 400; pts.push([VV, K > 0 ? Isat(q) * frac(K, VV) : 0]); }
            iv.path(pts, { color: col, width: w, dash: col === 'muted' ? [5, 4] : null });
          }
          if (K > 0) {
            iv.text('2×', 2.6, Math.min(Isat(irr.value * 2), Imax * 0.95), { color: 'muted', size: 11, dy: -8 });
            iv.text('½×', 2.6, Isat(irr.value / 2), { color: 'muted', size: 11, dy: -8 });
            iv.vline(-Vsm, { color: 'green', dash: [5, 4], width: 1.6 });
            iv.text(`−V_s = −${v.fix(Vsm, 2)} V`, -Vsm, Imax * 0.9, { color: 'green', size: 12, align: Vsm > 3.5 ? 'left' : 'right', dx: Vsm > 3.5 ? 6 : -6 });
          }
          iv.dot(V, cur, { r: 5.5, color: 'gold' });
          // ---- Millikan plot
          for (const [key, m] of Object.entries(MET)) {
            const f0 = m.phi * C.eV / C.h / 1e15, sel = key === metal.value;
            mk.line(0, 0, f0, 0, { color: m.col, width: sel ? 2 : 1, dash: [3, 4], alpha: sel ? 1 : 0.6 });
            mk.line(f0, 0, 1.7, (C.h * 1.7e15 / C.eV - m.phi), { color: m.col, width: sel ? 3 : 1.4, alpha: sel ? 1 : 0.6 });
            mk.text(m.label, f0, 0, { color: m.col, size: 11, dy: -10, align: 'center', weight: sel ? 700 : 500 });
          }
          const fN = C.c / (lam.value * 1e-9) / 1e15;
          mk.vline(fN, { color: 'muted', dash: [2, 4], width: 1 });
          mk.dot(fN, Math.max(0, K), { r: 6, color: K > 0 ? 'gold' : 'red', hollow: K <= 0 });
          st = { met, E, K, Vsm, cur, rate, lam0: C.h * C.c / (met.phi * C.eV), delay: met.phi * C.eV / (irr.value * SIG) };
        }, { still: 2.2 });
        v.legend([['accent', 'current at this irradiance'], ['muted', '½× and 2× irradiance', { dash: true }], ['green', 'stopping voltage (from the samples)', { dash: true }], ['gold', 'operating point', { dot: true }]]);
        v.readout(() => st && `Photon energy $hf = ${v.fix(st.E, 3)}$ eV; ${st.met.label}: $\\varphi = ${st.met.phi}$ eV, threshold $\\lambda_0 = hc/\\varphi =$ ${M.si(st.lam0, 'm', 3)}. ` + (st.K > 0
          ? `Stopping voltage of the simulated curve **${v.fix(st.Vsm, 3)} V** vs $(hf-\\varphi)/e = ${v.fix(st.K, 3)}$ V — the same at every irradiance. Saturation current ${M.si(st.rate * ETA * C.e, 'A')} $= e\\,\\eta\\,IA/hf$ ($\\eta = 2\\times10^{-4}$, $A = 1$ cm²), proportional to the irradiance. `
          : `**No photoelectrons** at any irradiance: one photon cannot pay the work function. `) + `Slope of every line: $h/e = ${v.sci(C.h / C.e, 4)}$ V s. Wave picture: an electron soaking up light over an atom-sized area ($10^{-20}$ m²) would need $\\varphi/(IA) \\approx ${v.fix(st.delay, 0)}$ s to escape; observed emission is prompt.`);
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Law',
      name: 'Photons: E = hf and p = h/λ',
      credit: 'Einstein, 1905 (energy), 1916 (momentum); Compton, 1923',
      statement: String.raw`Light of frequency $f$ and wavelength $\lambda=c/f$ is exchanged with matter in indivisible quanta, **photons**, each carrying
$$E=hf,\qquad p=\frac{E}{c}=\frac h\lambda$$
(massless particles, rel-4.6). A beam of power $P$ delivers $P/hf$ photons per second at random (Poisson) times; the classical intensity predicts only the *rate*. In particular, a photon scattered through the angle $\theta$ by a free electron at rest obeys energy and momentum conservation like a particle collision, which forces a wavelength increase (**Compton shift**)
$$\lambda'-\lambda=\frac{h}{m_ec}\,(1-\cos\theta),\qquad \frac{h}{m_ec}=2.426\ \text{pm},$$
independent of $\lambda$; classical wave scattering (Thomson) predicts no shift at all.`,
      idea: String.raw`The photoelectric effect (1.2) shows energy arriving in lumps $hf$; relativity then fixes the momentum, since a massless particle has $E=pc$ (rel-4.2), so $p=hf/c=h/\lambda$. Counting experiments make the lumps visible: each detector click carries the same energy, and only their rate follows the classical intensity. At high rates the clicks overlap and the signal looks like a smooth classical wave (its relative fluctuation is $1/\sqrt N$). Compton treated X-ray scattering as a billiard collision of a photon with an electron (rel-4.9): conserving four-momentum gives the shift, which is noticeable only when $\lambda$ is comparable to $h/m_ec$ — X-rays and γ-rays, not visible light.`,
      caption: String.raw`**Counting:** dim the beam and watch the detector trace: identical pulses of energy $hf$ at random times, while the classical wave (red) would deliver a steady power. The staircase below adds up the energy absorbed; brighten the beam and the steps merge into the classical straight line. Change the colour and every pulse changes size. **Compton:** drag the gold photon around the electron. The scattered wavelength (drawn to scale relative to the incoming one) is computed by solving the conservation laws; the momentum triangle closes, the shaded lobe is the Klein–Nishina angular distribution, and the right panel plots the shift against angle. Switch to visible light and the shift becomes invisible.`,
      scope: String.raw`$E=hf$ and $p=h/\lambda$ hold for light in vacuum (in a medium the momentum assignment is subtle). The Compton formula assumes a free electron at rest; for electrons bound with energy comparable to the transferred energy the line broadens and an unshifted component (scattering off the whole atom) appears.`,
      deps: ['qm-1.2', 'rel-4.9'],
      refs: ['Hall ch. 1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Photon' },
      tags: ['photons', 'compton scattering'],
      viz(v) {
        const M = v.M, C = M.CONST, TAUD = 0.004, DT = 0.01, MC2 = C.me * C.c * C.c, LC = C.h / (C.me * C.c);
        const mode = v.select('show', [{ value: 'count', label: 'energy: counting photons' }, { value: 'compton', label: 'momentum: Compton scattering' }], 'count');
        const Pw = v.slider('beam power $P$', 1e-18, 1e-14, 1e-17, { log: true, fmt: (x) => M.si(x, 'W', 2) });
        const lam = v.slider('wavelength λ', 300, 800, 550, { step: 1, fmt: (x) => `${Math.round(x)} nm` });
        const SRC = { mo: { label: 'Mo Kα X-ray, 71.1 pm', lam: 71.07e-12 }, cs: { label: 'Cs-137 γ-ray, 662 keV', lam: C.h * C.c / (661.657e3 * C.eV) }, vis: { label: 'green light, 532 nm', lam: 532e-9 } };
        const src = v.select('photons', Object.entries(SRC).map(([value, S]) => ({ value, label: S.label })), 'mo');
        const A = v.stage({ x: [-1, 0], y: [0, 1], height: 300, axes: 'box', weight: 1.25 });
        const B = v.stage({ x: [-1, 0], y: [0, 1], height: 300, axes: 'box', weight: 1 });
        const hd = A.handle(0.6, 0.6, { color: 'gold', r: 8 });
        hd.constrain = (x, y) => { const r = Math.hypot(x, y) || 1; return [1.0 * x / r, 1.0 * y / r]; };
        // Compton kinematics from conservation of energy and momentum (units of m c²): solve for the scattered energy ε'
        const scatter = (eps, th) => {
          const g = (e1) => eps + 1 - e1 - Math.sqrt(eps * eps + e1 * e1 - 2 * eps * e1 * Math.cos(th) + 1);
          let lo = 0, hi = eps; for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (g(mid) > 0) lo = mid; else hi = mid; if (hi - lo < eps * 1e-15) break; }
          const e1 = (lo + hi) / 2, px = eps - e1 * Math.cos(th), py = -e1 * Math.sin(th);
          return { e1, pe: Math.hypot(px, py), phi: Math.atan2(-py, px), Ke: eps - e1 };
        };
        const kn = (eps, th) => { const e1 = eps / (1 + eps * (1 - Math.cos(th))), q = e1 / eps; return q * q * (q + 1 / q - Math.sin(th) ** 2); };
        let st = null;
        v.animate((t) => {
          const cnt = mode.value === 'count';
          Pw.el.hidden = lam.el.hidden = !cnt; src.el.hidden = cnt; hd.visible = !cnt;
          A.o.axes = B.o.axes = 'box';
          if (cnt) {
            A.o.axes = 'box'; A.o.xlabel = 'time (s), now = 0'; A.o.ylabel = ''; B.o.xlabel = 'time (s)'; B.o.ylabel = 'energy / hf';
            const E = C.h * C.c / (lam.value * 1e-9), R = Pw.value / E, pc = photonColor(lam.value);
            const ev = [];
            for (let k = Math.floor((t - 1.03) / DT); k <= Math.floor(t / DT); k++) {
              const r = hrand(k * 2654435761 + 99), n = poisson(r, R * DT), loc = [];
              for (let i = 0; i < n; i++) loc.push((k + r()) * DT);
              loc.sort((a, b) => a - b); for (const x of loc) if (x <= t && x > t - 1.03) ev.push(x - t);
            }
            const H1 = E / TAUD, ymax = Math.max(1.6 * H1, 1.8 * Pw.value), k3 = Math.floor(Math.log10(ymax) / 3), Uy = 10 ** (3 * k3);
            A.setView([-1, 0], [0, ymax / Uy]); A.setTitle(`detector signal (${{ '-6': 'a', '-5': 'f', '-4': 'p', '-7': 'z' }[k3] || ''}W)`);
            const NSm = 600, sig = []; let y = 0, j = 0, tp = -1.03;
            while (j < ev.length && ev[j] < -1) { y = y * Math.exp(-(ev[j] - tp) / TAUD) + H1; tp = ev[j]; j++; }
            for (let i = 0; i <= NSm; i++) {
              const ts = -1 + i / NSm;
              while (j < ev.length && ev[j] <= ts) { y = y * Math.exp(-(ev[j] - tp) / TAUD) + H1; tp = ev[j]; j++; }
              sig.push([ts, y * Math.exp(-(ts - tp) / TAUD) / Uy]);
            }
            A.hline(Pw.value / Uy, { color: 'red', dash: [7, 5], width: 2 });
            A.text('classical wave: steady P', -0.98, Pw.value / Uy, { color: 'red', size: 11.5, dy: -10 });
            A.path(sig, { color: pc, width: 1.8 });
            if (ev.length < 1500) for (const x of ev) if (x > -1) A.line(x, 0, x, ymax / Uy * 0.035, { color: 'gold', width: 1.2 });
            const inWin = ev.filter((x) => x > -1);
            B.setView([-1, 0], [0, Math.max(4, 1.25 * R)]);
            const stair = [[-1, 0]]; inWin.forEach((x, i) => { stair.push([x, i]); stair.push([x, i + 1]); }); stair.push([0, inWin.length]);
            B.line(-1, 0, 0, R, { color: 'red', dash: [7, 5], width: 2 });
            B.path(stair, { color: 'accent', width: 2 });
            B.setTitle('energy absorbed since the window opened');
            st = { cnt, E, R, N: inWin.length, overlap: R * TAUD };
          } else {
            A.o.axes = false; B.o.xlabel = 'scattering angle θ (degrees)'; B.o.ylabel = 'Δλ (pm)';
            const S = SRC[src.value], eps = C.h * C.c / S.lam / MC2;
            const Wd = A.width, Hd = A.height, Hh = 1.25, Wh = Hh * Wd / Hd, cx0 = -0.25 * Wh;
            A.setView([-Wh - cx0, Wh - cx0], [-Hh, Hh]); A.setTitle('photon + electron at rest');
            const th = Math.atan2(Math.abs(hd.y), hd.x), sg = hd.y >= 0 ? 1 : -1;
            const sc = scatter(eps, th), lp = S.lam * eps / sc.e1;
            // Klein–Nishina lobe
            let kmax = 0; for (let i = 0; i <= 90; i++) kmax = Math.max(kmax, kn(eps, Math.PI * i / 90));
            A.poly(Array.from({ length: 181 }, (_, i) => { const a = 2 * Math.PI * i / 180, r = 0.75 * kn(eps, Math.abs(Math.atan2(Math.sin(a), Math.cos(a)))) / kmax; return [r * Math.cos(a), r * Math.sin(a)]; }), { fill: 'purple', fillAlpha: 0.08, color: 'purple', width: 1, alpha: 0.4 });
            A.circle(0, 0, 1, { color: 'faint', width: 1, dash: [3, 4] });
            const Lw = 0.16, Lw2 = Math.min(0.9, Lw * lp / S.lam);
            wiggle(A, [-Wh - cx0 + 0.1, 0], [-0.08, 0], (Wh + cx0 - 0.18) / Lw, 0.07, { color: 'accent', width: 2 });
            A.arrow(-0.3, 0, -0.1, 0, { color: 'accent', width: 0.1, head: 9 });
            const u = [Math.cos(th), sg * Math.sin(th)];
            wiggle(A, [0.08 * u[0], 0.08 * u[1]], [1.0 * u[0], 1.0 * u[1]], 0.92 / Lw2, 0.07, { color: 'gold', width: 2 });
            const ue = [Math.cos(sc.phi), -sg * Math.sin(sc.phi)], le = Math.min(1.1, 0.75 * sc.pe / eps);
            A.arrow(0, 0, le * ue[0], le * ue[1], { color: 'green', width: 2.6 });
            A.dot(0, 0, { r: 6, color: 'green' });
            A.text('e⁻', le * ue[0], le * ue[1], { color: 'green', size: 13, dx: 8, dy: sg * 10 });
            A.text(`λ = ${M.si(S.lam, 'm', 3)}`, -Wh - cx0 + 0.1, 0.16, { color: 'accent', size: 12 });
            A.text(`λ′ = ${M.si(lp, 'm', 4)}`, 1.02 * u[0], 1.02 * u[1], { color: 'gold', size: 12, dx: 10, dy: -sg * 12, align: u[0] < 0 ? 'right' : 'left' });
            // momentum triangle p = p′ + p_e
            const O = [Wh - cx0 - 0.95, -Hh + 0.3], k = 0.62, Pp = [O[0] + k, O[1]], Q = [O[0] + k * sc.e1 / eps * u[0], O[1] + k * sc.e1 / eps * u[1]];
            const Ob = [O[0], O[1] + (sg < 0 ? 0.75 : 0)], Ppb = [Pp[0], Ob[1]], Qb = [Ob[0] + (Q[0] - O[0]), Ob[1] + (Q[1] - O[1])];
            A.arrow(Ob[0], Ob[1], Ppb[0], Ppb[1], { color: 'accent', width: 2, head: 7 });
            A.arrow(Ob[0], Ob[1], Qb[0], Qb[1], { color: 'gold', width: 2, head: 7 });
            A.arrow(Qb[0], Qb[1], Ppb[0], Ppb[1], { color: 'green', width: 2, head: 7 });
            A.text('p = p′ + pₑ', Ob[0] + k / 2, Ob[1], { color: 'muted', size: 11.5, align: 'center', dy: sg > 0 ? 12 : -12 });
            // shift against angle
            B.setView([0, 180], [-0.4, Math.max(5.3, 1.15 * 2 * LC * 1e12)]); B.setTitle('Compton shift against angle');
            const pts = []; for (let i = 0; i <= 120; i++) { const a = Math.PI * i / 120, r = scatter(eps, a); pts.push([180 * i / 120, S.lam * (eps / r.e1 - 1) * 1e12]); }
            B.hline(0, { color: 'red', dash: [7, 5], width: 2 });
            B.text('classical (Thomson): no shift', 4, 0, { color: 'red', size: 11.5, dy: -10 });
            B.path(pts, { color: 'accent', width: 2.6 });
            B.hline(2 * LC * 1e12, { color: 'muted', dash: [3, 4], width: 1 });
            B.text('2h/mₑc', 4, 2 * LC * 1e12, { color: 'muted', size: 11, dy: -9 });
            B.dot(th * 180 / Math.PI, (lp - S.lam) * 1e12, { r: 6, color: 'gold' });
            st = { cnt, th, dl: lp - S.lam, form: LC * (1 - Math.cos(th)), rel: (lp - S.lam) / S.lam, Ke: sc.Ke * MC2, phi: sc.phi, E: eps * MC2 };
          }
        }, { still: 1.6 });
        v.legend([['accent', 'measured / computed'], ['red', 'classical wave prediction', { dash: true }], ['gold', 'photon events', { dot: true }]]);
        v.readout(() => st && (st.cnt
          ? `Every click deposits $hf = ${v.fix(st.E / C.eV, 3)}$ eV $= ${v.sci(st.E, 3)}$ J, whatever the power. Clicks in the last second: **${st.N}** vs $P/hf = ${v.fix(st.R, st.R < 100 ? 1 : 0)}$ per second (Poisson scatter $\\pm\\sqrt N \\approx ${v.fix(Math.sqrt(Math.max(st.N, 1)), 0)}$). ` + (st.overlap < 0.3 ? 'The trace is a train of separate, identical pulses — nothing like a steady wave.' : `About ${v.fix(st.overlap, 0)} pulses overlap at any moment, so the trace is nearly the steady classical signal (relative fluctuation $\\approx 1/\\sqrt{R\\tau} = ${v.fix(100 / Math.sqrt(st.overlap), 1)}$ %).`)
          : `θ = ${v.fix(st.th * 180 / Math.PI, 1)}°: shift from energy–momentum conservation **${M.si(st.dl, 'm', 5)}**; formula $\\frac{h}{m_ec}(1-\\cos\\theta) =$ ${M.si(st.form, 'm', 5)} · relative shift $\\Delta\\lambda/\\lambda = ${st.rel < 1e-3 ? v.sci(st.rel, 2) : v.fix(100 * st.rel, 2) + '\\,\\%'}$ · electron recoil ${M.si(st.Ke / C.eV, 'eV', 3)} at ${v.fix(st.phi * 180 / Math.PI, 1)}° below the beam · photon energy ${M.si(st.E / C.eV, 'eV', 3)}. Classical wave scattering: $\\Delta\\lambda = 0$.`));
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Phenomenon',
      name: 'Atomic line spectra and the Rydberg formula',
      credit: 'Ångström, 1868; Balmer, 1885; Rydberg, 1888; Lyman, 1906; Paschen, 1908',
      statement: String.raw`A gas of atoms emits and absorbs light only at sharp, characteristic wavelengths. For hydrogen every line satisfies the **Rydberg formula**
$$\frac1\lambda=R_{\rm H}\left(\frac1{n_1^2}-\frac1{n_2^2}\right),\qquad n_2>n_1\ge1\ \text{integers},$$
with a single constant $R_{\rm H}=1.09678\times10^{7}\ \text{m}^{-1}$. Lines with a common $n_1$ form a **series** — Lyman ($n_1=1$, ultraviolet), Balmer ($n_1=2$, visible), Paschen ($3$), Brackett ($4$), Pfund ($5$, infrared) — whose lines crowd toward the series limit $\lambda_\infty=n_1^2/R_{\rm H}$. Wavenumbers combine: the wavenumber of any line is a difference of two *terms* $R_{\rm H}/n^2$ (Ritz combination principle).`,
      idea: String.raw`Balmer found in 1885 that the four visible hydrogen lines measured by Ångström obey $\lambda=Bn^2/(n^2-4)$ with $B=364.6$ nm; Rydberg rewrote this in wavenumbers as a difference of two terms, which predicted the other series before they were seen. Measurement uses a diffraction grating (waves-7.9): the angles of the bright orders give $\lambda=d\sin\theta/m$. Classical physics has no explanation: an orbiting electron radiates at its orbital frequency and harmonics, which change continuously as it loses energy. The formula's integers are the first sign of quantized energy levels (1.5).`,
      caption: String.raw`Top: the measured hydrogen spectrum on a logarithmic wavelength scale, with true colours in the visible. **Click a line** to select it and its series. Left: every line plotted as $1/\lambda$ against $1/n_1^2-1/n_2^2$ falls on one straight line through the origin, whose least-squares slope is $R_{\rm H}$. **Break it:** reassign the selected series to a wrong lower level $n_1$ and its points leave the line. Right: the selected series on a linear scale, with the formula's predictions crowding toward the series limit.`,
      deps: ['waves-7.9'],
      refs: ['Griffiths §4.2'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rydberg_formula' },
      tags: ['spectra', 'hydrogen'],
      viz(v) {
        const M = v.M, C = M.CONST, RH = rydberg(C, C.mp);
        const assign = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };
        let selIdx = 6;
        const n1sel = v.select('assume lower level $n_1$ of the selected series', [1, 2, 3, 4, 5].map((n) => ({ value: n, label: `$n_1=${n}$` })), 2, { onChange: (n) => { assign[HLINES[selIdx][0]] = n; } });
        const sp = v.stage({ x: [80, 9500], y: [0, 1], height: 165, axes: 'box', xlog: true, yticks: [], xlabel: 'λ (nm)', full: true });
        const ry = v.stage({ x: [0, 1.05], y: [0, 11.6], height: 290, axes: 'box', xlabel: '1/n₁² − 1/n₂²', ylabel: '1/λ (μm⁻¹)', weight: 1, title: 'Rydberg plot: all series together' });
        const zm = v.stage({ x: [0, 1], y: [0, 1], height: 290, axes: 'box', yticks: [], xlabel: 'λ (nm)', weight: 1.15 });
        const xOf = (i) => { const [n1, n2] = HLINES[i], a = assign[n1], m2 = a + (n2 - n1); return 1 / (a * a) - 1 / (m2 * m2); };
        const pick = (stage, x, list) => { let best = -1, bd = 1e9; for (const i of list) { const d = Math.abs(stage.X(HLINES[i][2]) - stage.X(x)); if (d < bd) { bd = d; best = i; } } if (best >= 0 && bd < 40) { selIdx = best; n1sel.set(assign[HLINES[best][0]]); } };
        sp.onClick((x) => pick(sp, x, HLINES.map((_, i) => i)));
        zm.onClick((x) => pick(zm, x, HLINES.map((_, i) => i).filter((i) => HLINES[i][0] === HLINES[selIdx][0])));
        const glow = (s, x, y0, y1, col, w) => { s.line(x, y0, x, y1, { color: col, width: w * 3.2, alpha: 0.28, cap: 'butt' }); s.line(x, y0, x, y1, { color: col, width: w, cap: 'butt' }); };
        let st = null;
        v.render(() => {
          const ser = HLINES[selIdx][0];
          // least-squares line through the origin
          let sxy = 0, sxx = 0; HLINES.forEach((L, i) => { const x = xOf(i), y = 1e9 / L[2]; sxy += x * y; sxx += x * x; });
          const R = sxy / sxx; let worst = 0; HLINES.forEach((L, i) => { worst = Math.max(worst, Math.abs(xOf(i) * R / (1e9 / L[2]) - 1)); });
          // ---- full spectrum
          sp.rect(80, 0.2, 9500, 0.72, { fill: DARK, fillAlpha: 1, stroke: false });
          sp.rect(380, 0.2, 750, 0.72, { fill: 'gray', fillAlpha: 0.12, stroke: false });
          for (const [lo, hi, name] of [[80, 380, 'ultraviolet'], [380, 750, 'visible'], [750, 9500, 'infrared']]) sp.text(name, Math.sqrt(lo * hi), 0.1, { align: 'center', color: 'muted', size: 11 });
          for (const k of [1, 2, 3, 4, 5]) {
            const lim = 1e9 * k * k / RH, idx = HLINES.map((_, i) => i).filter((i) => HLINES[i][0] === k), lmax = HLINES[idx[0]][2];
            sp.line(lim, 0.2, lim, 0.72, { color: SERIES[k].color, dash: [2, 3], width: 1, alpha: 0.7 });
            sp.text(SERIES[k].name, Math.sqrt(lim * lmax), 0.86, { align: 'center', color: SERIES[k].color, size: 12, weight: k === ser ? 700 : 500 });
          }
          HLINES.forEach(([n1, n2, l], i) => { const col = wlRGB(l) || SERIES[n1].color; glow(sp, l, 0.22, 0.7, col, i === selIdx ? 3 : 1.6); });
          sp.line(HLINES[selIdx][2], 0.72, HLINES[selIdx][2], 0.78, { color: 'ink', width: 2 });
          sp.dot(HLINES[selIdx][2], 0.78, { r: 4, color: 'ink' });
          // ---- Rydberg plot
          ry.line(0, 0, 1.05, 1.05 * R * 1e-6, { color: 'green', width: 2 });
          HLINES.forEach(([n1, n2, l], i) => ry.dot(xOf(i), 1e3 / l, { r: i === selIdx ? 6.5 : 4.5, color: SERIES[n1].color, hollow: assign[n1] !== n1 }));
          for (const k of [1, 2, 3, 4, 5]) { const i = HLINES.findIndex((L) => L[0] === k); ry.text(SERIES[k].name, xOf(i), 1e3 / HLINES[i][2], { color: SERIES[k].color, size: 11, dx: 8, dy: k === 1 ? 10 : -8 }); }
          ry.text(`slope R = ${v.fix(R * 1e-7, 5)}×10⁷ m⁻¹`, 0.5, 0.5 * R * 1e-6, { color: 'green', size: 12, dx: 10, dy: 12 });
          // ---- zoom on the selected series
          const a = assign[ser], idx = HLINES.map((_, i) => i).filter((i) => HLINES[i][0] === ser);
          const lim = 1e9 * a * a / R, lA = HLINES[idx[0]][2], lo = Math.min(lim, ...idx.map((i) => HLINES[i][2])) * 0.97, hi = Math.max(lA, 1e9 / (R * (1 / (a * a) - 1 / ((a + 1) ** 2)))) * 1.03;
          zm.setView([lo, hi], [0, 1]); zm.setTitle(`${SERIES[ser].name} series ($n_1 = ${a}$ assumed): measured lines and the formula`);
          zm.rect(lo, 0.3, hi, 0.75, { fill: DARK, fillAlpha: 1, stroke: false });
          for (let m2 = a + 1; m2 <= a + 40; m2++) { const lp = 1e9 / (R * (1 / (a * a) - 1 / (m2 * m2))); if (lp > lo && lp < hi) zm.line(lp, 0.75, lp, 0.86, { color: 'muted', width: 1 }); if (m2 - a <= 4 && lp > lo && lp < hi) zm.text(`${m2}`, lp, 0.9, { align: 'center', color: 'muted', size: 11 }); }
          zm.text('formula, n₂ =', lo, 0.9, { color: 'muted', size: 11, dx: 4 });
          zm.line(lim, 0.22, lim, 0.86, { color: 'green', dash: [4, 3], width: 1.4 });
          zm.text('limit n₁²/R', lim, 0.15, { color: 'green', size: 11, align: 'center' });
          for (const i of idx) { const l = HLINES[i][2], col = wlRGB(l) || SERIES[ser].color; glow(zm, l, 0.32, 0.73, col, i === selIdx ? 3.4 : 2); }
          for (const i of idx.slice(0, 3)) zm.text(lineName(HLINES[i][0], HLINES[i][1]), HLINES[i][2], 0.22, { align: 'center', color: 'ink', size: 11 });
          const [n1, n2, l] = HLINES[selIdx], m2 = a + (n2 - n1);
          st = { R, worst, n1, n2, l, a, m2, pred: 1e9 / (R * (1 / (a * a) - 1 / (m2 * m2))), wrong: [1, 2, 3, 4, 5].some((k) => assign[k] !== k) };
        });
        v.legend(Object.values(SERIES).map((S) => [S.color, S.name, { dot: true }]).concat([['green', 'least-squares line']]));
        v.readout(() => st && `Line through the origin fitted to all ${HLINES.length} measured lines: $R = ${v.fix(st.R * 1e-7, 6)}\\times10^7$ m⁻¹, worst deviation **${st.worst < 1e-3 ? v.fix(st.worst * 1e6, 0) + ' ppm' : v.fix(st.worst * 100, 1) + ' %'}**. ` + (st.wrong ? 'With a wrong assignment the points no longer share one line — only the true integers put every series on it. ' : `Theory (1.5): $R_{\\rm H} = R_\\infty/(1+m_e/m_p) = ${v.fix(RH * 1e-7, 6)}\\times10^7$ m⁻¹ ($R_\\infty = ${v.fix(C.Ry * 1e-7, 6)}\\times10^7$). `) + `Selected: **${lineName(st.n1, st.n2)}**, measured ${v.fix(st.l, st.l < 1000 ? 3 : 1)} nm, assigned $n_2 = ${st.m2}\\to n_1 = ${st.a}$; the fitted formula gives ${v.fix(st.pred, st.pred < 1000 ? 3 : 1)} nm.`);
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Model',
      name: 'Bohr model of hydrogen',
      credit: 'Bohr, 1913',
      statement: String.raw`**Model.** An electron circles a nucleus of charge $Ze$ under the Coulomb attraction, but
(i) only orbits with angular momentum $L=n\hbar$, $n=1,2,3,\dots$, are allowed, and in them the electron does not radiate;
(ii) light is emitted or absorbed only in jumps between allowed orbits, as a photon of energy $hf=E_{n_2}-E_{n_1}$.
Then the radii, speeds and energies are
$$r_n=\frac{n^2}{Z}a_0,\qquad v_n=\frac{Z\alpha c}{n},\qquad E_n=-\frac{Z^2}{n^2}\,\frac{m_ee^4}{8\varepsilon_0^2h^2}=-\frac{13.606\ \text{eV}\,Z^2}{n^2},$$
with $a_0=\varepsilon_0h^2/\pi m_ee^2=0.0529$ nm. The photon wavelengths reproduce the Rydberg formula (1.4) with $R_\infty=m_ee^4/8\varepsilon_0^2h^3c$; replacing $m_e$ by the reduced mass $\mu=m_eM/(m_e+M)$ accounts for the nucleus' recoil and gives $R_{\rm H}$.`,
      idea: String.raw`Rutherford scattering (mech-8.18) had shown a tiny massive nucleus, and the Coulomb force is central, so angular momentum is conserved (mech-2.10) and circular orbits have $mv^2/r=Zke^2/r^2$. Classically such an electron radiates and spirals in within $10^{-11}$ s (em-12.17); Bohr simply forbade this for the orbits with $L=n\hbar$. Combining $mvr=n\hbar$ with the force balance gives $r_n\propto n^2$ and $E_n=-Zke^2/2r_n\propto-1/n^2$, so photon energies are differences of terms $\propto1/n^2$ — exactly Rydberg's empirical formula, now with $R$ computed from $m_e,e,\varepsilon_0,h,c$. The tiny remaining mismatch (0.05 %) disappears with the reduced mass, which also explained the He⁺ lines Pickering had found in stars.`,
      caption: String.raw`**Click a transition arrow** in the level diagram: the electron jumps between the drawn-to-scale orbits, the emitted photon flies off in its true colour, and its line lights up in the spectrum below at the wavelength the model predicts; the small triangle marks the measured hydrogen line. Toggle the reduced-mass correction to see the 0.05 % shift, and try He⁺ and Li²⁺ (energies × $Z^2$). **Break it:** switch to a *classical electron*: it radiates, spirals into the nucleus in about $10^{-11}$ s (turns not to scale) and paints a continuous smear instead of lines.`,
      scope: String.raw`Works for one-electron atoms and ions (H, He⁺, Li²⁺, …) and for the gross structure of their spectra. It fails for atoms with two or more electrons, cannot give line intensities, fine structure or the Zeeman pattern, and wrongly assigns the ground state the angular momentum $\hbar$ (it is 0). Superseded by the Schrödinger equation, which reproduces the same energies.`,
      deps: ['qm-1.4', 'em-12.17', 'mech-8.18', 'mech-2.10'],
      refs: ['Hall ch. 1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bohr_model' },
      tags: ['bohr model', 'hydrogen'],
      viz(v) {
        const M = v.M, C = M.CONST;
        const NUC = { 1: { label: 'H', M: C.mp }, 2: { label: 'He⁺', M: 6.6446573e-27 - 2 * C.me }, 3: { label: 'Li²⁺', M: 1.1650478e-26 - 3 * C.me } };
        const Zs = v.select('atom', [1, 2, 3].map((z) => ({ value: z, label: NUC[z].label })), 1);
        const red = v.toggle('reduced-mass correction', true);
        const cls = v.toggle('classical electron (radiates)', false);
        const so = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, height: 300, axes: false, weight: 0.95, title: 'orbits (to scale)' });
        const sl = v.stage({ x: [0, 5], y: [-15, 1], height: 300, axes: 'box', ylabel: 'E (eV)', weight: 1.1, title: 'energy levels: click a transition' });
        const ss = v.stage({ x: [20, 9500], y: [0, 1], height: 120, axes: 'box', xlog: true, yticks: [], xlabel: 'λ (nm)', full: true });
        const E1 = C.me * C.e ** 4 / (8 * C.eps0 ** 2 * C.h ** 2), A0 = C.eps0 * C.h ** 2 / (Math.PI * C.me * C.e ** 2), RE = C.e ** 2 / (4 * Math.PI * C.eps0 * C.me * C.c ** 2);
        const COLS = { 1: [0.55, 0.17], 2: [1.75, 0.17], 3: [2.95, 0.19], 4: [4.05, 0.22] };
        let sel = { n2: 3, n1: 2 };
        const arrowsOf = () => { const out = []; for (const n1 of [1, 2, 3, 4]) for (let n2 = n1 + 1; n2 <= 7; n2++) out.push({ n1, n2, x: COLS[n1][0] + (n2 - n1 - 1) * COLS[n1][1] }); return out; };
        const level = (n, Z) => -Z * Z * E1 * (red.value ? NUC[Z].M / (NUC[Z].M + C.me) : 1) / C.eV / (n * n);
        sl.onClick((x, y) => {
          if (cls.value) return;
          let best = null, bd = 30; const Z = Zs.value;
          for (const A of arrowsOf()) { const px = sl.X(A.x), y1 = sl.Y(level(A.n2, Z)), y2 = sl.Y(level(A.n1, Z)), py = sl.Y(y), qx = sl.X(x); const d = Math.abs(qx - px) + Math.max(0, Math.min(py - y1, 0) * -1, py - y2); if (d < bd) { bd = d; best = A; } }
          if (best) { sel = { n1: best.n1, n2: best.n2 }; v.restart(); }
        });
        let st = null;
        v.animate((t) => {
          const Z = Zs.value, mu = red.value ? NUC[Z].M / (NUC[Z].M + C.me) : 1, rOf = (n) => n * n / (Z * mu);
          const { n1, n2 } = sel, dE = level(n1, Z) - level(n2, Z) < 0 ? level(n2, Z) - level(n1, Z) : 0;
          const lnm = C.h * C.c / (dE * C.eV) * 1e9, pc = photonColor(lnm);
          const meas = Z === 1 ? HLINES.find((L) => L[0] === n1 && L[1] === n2) : null;
          const R = 1.22 * rOf(n2);
          so.setView([-R, R], [-R, R]);
          // ---- level diagram
          const Emin = level(1, Z);
          sl.setView([0, 5], [Emin * 1.08, -Emin * 0.07]);
          for (let n = 1; n <= 7; n++) { const E = level(n, Z); sl.line(0.35, E, 4.9, E, { color: n === n1 || n === n2 ? 'ink' : 'muted', width: n === n1 || n === n2 ? 2 : 1.1 }); if (n <= 4) sl.text(`n=${n}`, 0.32, E, { align: 'right', color: 'muted', size: 11 }); }
          sl.line(0.35, 0, 4.9, 0, { color: 'faint', dash: [4, 4], width: 1 }); sl.text('∞', 0.32, 0, { align: 'right', color: 'muted', size: 11 });
          for (const k of [1, 2, 3, 4]) sl.text(SERIES[k].name, COLS[k][0] + 0.25, -Emin * 0.035, { align: 'center', color: SERIES[k].color, size: 10.5 });
          for (const A of arrowsOf()) { const on = A.n1 === n1 && A.n2 === n2 && !cls.value; sl.arrow(A.x, level(A.n2, Z), A.x, level(A.n1, Z), { color: on ? 'gold' : SERIES[A.n1].color, width: on ? 3.2 : 1.4, alpha: on ? 1 : 0.55, head: on ? 10 : 6 }); }
          // ---- orbits and the electron
          for (let n = 1; n <= n2; n++) so.circle(0, 0, rOf(n), { color: n === n2 ? 'accent' : n === n1 ? 'green' : 'faint', width: n === n1 || n === n2 ? 1.8 : 1, dash: n === n1 || n === n2 ? null : [3, 4] });
          so.dot(0, 0, { r: 5, color: 'red' }); so.text(`+${Z}e`, 0, 0, { color: 'red', size: 11, dx: 8, dy: -9 });
          so.text(`n = ${n2}`, 0, -rOf(n2), { color: 'accent', size: 11.5, align: 'center', dy: 12 });
          const cyc = t % 4, wUp = 2 * Math.PI * 0.55, wLo = wUp * Math.pow(n2 / n1, 1.5);
          let ex, ey, lit = 0, smear = null;
          if (!cls.value) {
            const tj = 1.4, aj = wUp * tj;
            if (cyc < tj) { ex = rOf(n2) * Math.cos(wUp * cyc); ey = rOf(n2) * Math.sin(wUp * cyc); }
            else { const a = aj + wLo * (cyc - tj); ex = rOf(n1) * Math.cos(a); ey = rOf(n1) * Math.sin(a); lit = Math.min(1, (cyc - tj) / 0.3); const P = [rOf(n2) * Math.cos(aj), rOf(n2) * Math.sin(aj)], q = (cyc - tj) / 2.2; if (q < 1) { const u = [Math.cos(aj), Math.sin(aj)], d0 = rOf(n2) + q * R * 1.1; wiggle(so, [u[0] * (d0 - 0.25 * R), u[1] * (d0 - 0.25 * R)], [u[0] * d0, u[1] * d0], 3, 0.05 * R, { color: pc, width: 2.2 }); } if (cyc < tj + 0.35) so.line(P[0], P[1], rOf(n1) * Math.cos(aj), rOf(n1) * Math.sin(aj), { color: 'gold', dash: [3, 3], width: 1.4 }); }
            so.dot(ex, ey, { r: 5.5, color: 'gold' });
          } else {
            const sfr = Math.min(1, cyc / 3.4), r0 = rOf(n2), rr = (u) => r0 * Math.cbrt(Math.max(0, 1 - u)), ang = (u) => 4 * Math.PI * 2.5 * (1 - Math.sqrt(Math.max(0, 1 - u)));
            so.curve((u) => [rr(u) * Math.cos(ang(u)), rr(u) * Math.sin(ang(u))], 0, sfr, { color: 'red', width: 1.6, alpha: 0.75, n: 500 });
            so.dot(rr(sfr) * Math.cos(ang(sfr)), rr(sfr) * Math.sin(ang(sfr)), { r: 5.5, color: 'gold' });
            const forb = (r) => Math.sqrt(Z * C.e ** 2 / (4 * Math.PI * C.eps0 * C.me * r ** 3)) / (2 * Math.PI);
            smear = [C.c / forb(r0 * A0) * 1e9, C.c / forb(Math.max(rr(sfr), 1e-3 * r0) * A0) * 1e9];
          }
          // ---- spectrum strip
          ss.rect(20, 0.18, 9500, 0.78, { fill: DARK, fillAlpha: 1, stroke: false });
          for (let a = 1; a <= 5; a++) for (let b = a + 1; b <= 8; b++) { const l = C.h * C.c / ((level(a, Z) < 0 ? level(b, Z) - level(a, Z) : 1) * C.eV) * 1e9; ss.line(l, 0.2, l, 0.76, { color: wlRGB(l) || 'gray', width: 1, alpha: 0.35, cap: 'butt' }); }
          if (!cls.value) { ss.line(lnm, 0.2, lnm, 0.76, { color: pc, width: 9, alpha: 0.3 * lit, cap: 'butt' }); ss.line(lnm, 0.2, lnm, 0.76, { color: pc, width: 3, alpha: 0.25 + 0.75 * lit, cap: 'butt' }); ss.text(`${v.fix(lnm, lnm < 1000 ? 2 : 0)} nm`, lnm, 0.9, { align: 'center', color: 'ink', size: 11.5 }); }
          if (meas && !cls.value) { ss.poly([[meas[2], 0.16], [meas[2] * 1.035, 0.04], [meas[2] / 1.035, 0.04]], { fill: 'ink', fillAlpha: 1, stroke: false }); ss.text('measured', meas[2] * 1.06, 0.08, { color: 'muted', size: 10.5 }); }
          if (smear) { const [la, lb] = smear, l0 = Math.max(20, lb), n = 60; for (let i = 0; i < n; i++) { const x0 = l0 * Math.pow(la / l0, i / n), x1 = l0 * Math.pow(la / l0, (i + 1) / n); ss.rect(x0, 0.2, x1, 0.76, { fill: 'red', fillAlpha: 0.25 + 0.5 * (1 - i / n), stroke: false }); } ss.text('classical: continuous chirp', Math.sqrt(la * l0), 0.9, { align: 'center', color: 'red', size: 11.5 }); }
          st = { Z, n1, n2, lnm, lnm0: C.h * C.c / (dE * C.eV * (red.value ? 1 / mu : 1)) * 1e9, meas, mu, r: rOf(n2) * A0, vv: Z * C.alpha * C.c / n2, dE, Tc: (rOf(n2) * A0) ** 3 / (4 * Z * RE * RE * C.c) };
        }, { still: 1.9 });
        v.legend([['accent', 'upper orbit'], ['green', 'lower orbit'], ['gold', 'electron / selected jump', { dot: true }], ['ink', 'measured line (H)', { dot: true }]]);
        v.readout(() => st && (cls.value
          ? `**Classical electron** on the $n=${st.n2}$ radius ${M.si(st.r, 'm', 3)}: it radiates (Larmor) and spirals into the nucleus in $t = r^3/4Zr_e^2c =$ ${M.si(st.Tc, 's', 3)}, its orbital frequency rising without limit — a continuous spectrum and no stable atom.`
          : `$n = ${st.n2}\\to${st.n1}$${st.Z === 1 ? ` (${lineName(st.n1, st.n2)})` : ''}: photon energy $${v.fix(st.dE, 4)}$ eV, Bohr wavelength **${v.fix(st.lnm, 3)} nm**` + (st.meas ? `; measured ${v.fix(st.meas[2], 3)} nm (deviation ${v.fix(1e6 * Math.abs(st.lnm / st.meas[2] - 1), 0)} ppm)` : '') + `. Upper orbit: $r = ${st.n2 * st.n2}a_0/${st.Z}${red.value ? '\\cdot m_e/\\mu' : ''} =$ ${M.si(st.r, 'm', 3)}, $v = Z\\alpha c/n =$ ${M.si(st.vv, 'm/s', 3)}, $L = ${st.n2}\\hbar$. Ground-state energy from $m_ee^4/8\\varepsilon_0^2h^2$: $${v.fix(E1 / C.eV, 4)}$ eV × $Z^2$` + (red.value ? ` × $\\mu/m_e = ${v.fix(st.mu, 6)}$.` : ' (infinitely heavy nucleus).')));
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Principle',
      name: 'Correspondence principle',
      credit: 'Bohr, 1913 (named 1920)',
      statement: String.raw`In the limit of large quantum numbers the predictions of quantum theory must agree with those of classical physics. For the Bohr atom: the frequency of the photon emitted in the jump $n\to n-k$ approaches $k$ times the classical orbital frequency $f_{\rm orb}(n)=v_n/2\pi r_n=2Rc/n^3$,
$$\frac{f(n\to n-k)}{k\,f_{\rm orb}(n)}=1+\frac{3k}{2n}+O(n^{-2})\ \longrightarrow\ 1\qquad(n\to\infty),$$
and the photon frequency always lies between $k f_{\rm orb}(n)$ and $k f_{\rm orb}(n-k)$. Jumps by $\Delta n=k$ correspond to the $k$-th harmonic of the classical motion.`,
      idea: String.raw`From 1.5, $f(n\to n-k)=Rc\,[(n-k)^{-2}-n^{-2}]$. For $n\gg k$ the bracket is approximately $2k/n^3$, which is exactly $k$ times the classical orbital frequency $v_n/2\pi r_n$ of the Bohr orbit: the energy levels become so dense that $dE/dn=h f_{\rm orb}$, and emitting $k$ quanta of spacing $\approx hf_{\rm orb}$ produces radiation at the $k$-th harmonic — what a classical charge on an orbit of that frequency would radiate. Bohr used this requirement in reverse to guess quantum rules (and selection rules and intensities) from classical motion.`,
      caption: String.raw`Raise the quantum number $n$ (logarithmic slider). Left: the ratio of the photon frequency to the classical prediction $k f_{\rm orb}$ for the jump $\Delta n=k$, squeezed inside the orange band bounded by the orbital frequencies of the two orbits, tends to 1. Right: the lines emitted from level $n$, in units of its orbital frequency, slide onto the classical harmonics $1,2,3,\dots$ (green). At $n=1$–$3$ nothing classical survives.`,
      scope: String.raw`Concerns limits of large quantum numbers (or actions large compared with $\hbar$). It is a consistency requirement and a heuristic, not a theorem: some quantum effects (spin, tunnelling, entanglement) have no classical counterpart at any quantum number.`,
      deps: ['qm-1.5'],
      refs: ['Hall ch. 1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Correspondence_principle' },
      tags: ['correspondence principle', 'bohr model'],
      viz(v) {
        const M = v.M, C = M.CONST, RH = rydberg(C, C.mp), Rc = RH * C.c, A0H = C.a0 * (1 + C.me / C.mp);
        const nS = v.slider('quantum number $n$', 2, 1000, 12, { log: true, int: true });
        const kS = v.select('jump', [1, 2, 3].map((k) => ({ value: k, label: `$\\Delta n=${k}$` })), 1);
        const A = v.stage({ x: [1.6, 1100], y: [0.85, 3.3], height: 300, axes: 'box', xlog: true, xlabel: 'n', weight: 1.15, title: 'photon frequency ÷ classical prediction $k f_{\\rm orb}(n)$' });
        const B = v.stage({ x: [0, 6.6], y: [0, 1.2], height: 300, axes: 'box', yticks: [], xlabel: 'frequency / f_orb(n)', weight: 1, title: 'lines emitted from level $n$' });
        const fph = (n, k) => Rc * (1 / ((n - k) ** 2) - 1 / (n * n)), forb = (n) => 2 * Rc / n ** 3;
        let st = null;
        v.render(() => {
          const n = Math.max(nS.value, kS.value + 1), k = kS.value;
          A.between((x) => Math.pow(x / (x - k), 3), () => 1, k + 1.05, 1100, { fill: 'orange', fillAlpha: 0.16, n: 400 });
          A.fn((x) => (x > k + 1e-9 ? Math.pow(x / (x - k), 3) : NaN), { color: 'orange', width: 1.2, domain: [k + 1.02, 1100] });
          A.hline(1, { color: 'green', width: 2 });
          A.text('classical value 1', 300, 1, { color: 'green', size: 11.5, dy: -10, align: 'center' });
          const pts = []; for (let m = k + 1; m <= 1100; m = m < 40 ? m + 1 : Math.ceil(m * 1.03)) pts.push([m, fph(m, k) / (k * forb(m))]);
          A.path(pts, { color: 'accent', width: 2.4 });
          for (let m = k + 1; m <= 12; m++) A.dot(m, fph(m, k) / (k * forb(m)), { r: 2.5, color: 'accent' });
          A.text('f_orb(n−k)/f_orb(n)', 2.4 + k, Math.min(3.15, Math.pow((2.4 + k) / 2.4, 3)), { color: 'orange', size: 11, dx: 6 });
          const ratio = fph(n, k) / (k * forb(n));
          A.vline(n, { color: 'gold', dash: [4, 4], width: 1.2 });
          A.dot(n, Math.min(ratio, 3.25), { r: 6, color: 'gold' });
          // lines from level n
          for (let j = 1; j <= 6; j++) B.line(j, 0, j, 1.12, { color: 'green', dash: [4, 4], width: 1.3 });
          for (let j = 1; j <= Math.min(6, n - 1); j++) {
            const x = fph(n, j) / forb(n); if (x > 6.55) { B.text(`Δn=${j} → ${v.fix(x, 1)}`, 6.5, 1.02 - 0.09 * j, { color: 'accent', size: 11, align: 'right' }); continue; }
            B.line(x, 0, x, 0.92 - 0.06 * j, { color: 'accent', width: 3.2 }); B.text(`Δn=${j}`, x, 0.92 - 0.06 * j, { color: 'accent', size: 11, align: 'center', dy: -9 });
          }
          B.text('classical harmonics k·f_orb', 0.1, 1.14, { color: 'green', size: 11 });
          st = { n, k, ratio, f: fph(n, k), fo: forb(n), r: n * n * A0H, pred: 1 + 1.5 * k / n };
        });
        v.legend([['accent', 'quantum: $f(n\\to n-k)$'], ['green', 'classical $k f_{\\rm orb}$', { dash: true }], ['orange', 'band between $k f_{\\rm orb}(n)$ and $k f_{\\rm orb}(n-k)$', { area: true }]]);
        v.readout(() => st && `$n = ${st.n}$: orbit radius ${M.si(st.r, 'm', 3)}, orbital frequency ${M.si(st.fo, 'Hz', 4)}; photon $n\\to n-${st.k}$: ${M.si(st.f, 'Hz', 4)} → ratio **${v.fix(st.ratio, 5)}** (asymptotic $1+3k/2n = ${v.fix(st.pred, 5)}$). ` + (st.n >= 90 && st.n <= 130 ? 'Such transitions are seen by radio telescopes as recombination lines — H109α ($110\\to109$) at 5.0089 GHz.' : st.n < 4 ? 'At small $n$ the quantum jump has nothing to do with the orbital frequency.' : 'Each tenfold increase of $n$ cuts the mismatch tenfold.'));
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Principle',
      name: 'Bohr–Sommerfeld quantization',
      credit: 'Bohr, 1913; Wilson, Ishiwara, 1915; Sommerfeld, 1916',
      statement: String.raw`In the *old quantum theory*, the allowed motions of a periodic one-dimensional system with Hamiltonian $H=p^2/2m+V(q)$ are those whose orbit in phase space encloses an action that is a whole multiple of Planck's constant:
$$J(E)=\oint p\,dq=2\int_{q_1}^{q_2}\sqrt{2m\,(E-V(q))}\,dq=n\,h,\qquad n=1,2,\dots$$
Each allowed orbit therefore occupies an annulus of area $h$ in phase space. It reproduces $L=n\hbar$ for Bohr's circular orbits and exact energies for the square well, and Planck's $nhf$ for the oscillator. The later semiclassical (WKB) refinement replaces $n$ by $n+\mu/4$, where $\mu$ counts turning-point phase losses: $(n+\tfrac12)h$ for two smooth turning points, $nh$ ($n\ge1$) between two hard walls.`,
      idea: String.raw`For a periodic orbit the action $J=\oint p\,dq$ is the natural adiabatic invariant (mech-12.17), so Ehrenfest argued it is the quantity that can be quantized consistently. Since $dJ/dE=T$, the period of the motion, consecutive levels are spaced by $\Delta E\approx h/T=hf_{\rm orb}$ — the correspondence principle (1.6) built in. The rule is exact for the box and gives the oscillator spacing $\hbar\omega$ exactly; it misses the zero-point energy $\hbar\omega/2$, which wave mechanics restores through the half-integer (Maslov) correction at smooth turning points. For anharmonic wells it is only approximate, with errors fading at high $n$.`,
      caption: String.raw`Pick a potential and a rule. Left: phase space, with the allowed orbits (blue) enclosing areas $h, 2h, 3h,\dots$ (or $h/2, 3h/2,\dots$). **Drag the gold handle** to choose any orbit; its shaded area is read out in units of $h$ — only special energies give whole numbers. Right: the well with the predicted levels (blue dashed) against the exact levels of the Schrödinger equation (green, finite differences). The half-integer rule is exact for the oscillator; hard walls need whole numbers; the quartic and V-shaped wells converge only as $n$ grows. Units $\hbar=m=1$.`,
      scope: String.raw`Applies to integrable (separable, periodic) motion and is accurate when the action is large compared with $\hbar$ (high quantum numbers). It fails for chaotic systems, gives wrong results for helium and for the hydrogen molecule ion, and knows nothing of spin.`,
      deps: ['qm-1.5', 'mech-12.17'],
      see: ['qm-1.6'],
      refs: ['Sakurai ch. 2'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Old_quantum_theory' },
      tags: ['old quantum theory', 'phase space'],
      viz(v) {
        const M = v.M, HH = 2 * Math.PI, NL = 6, A = 1.5;
        const POT = {
          box: { label: 'square well', V: (x) => (Math.abs(x) < A ? 0 : Infinity), X: A, hard: true },
          ho: { label: 'oscillator $x^2/2$', V: (x) => 0.5 * x * x, X: 6.5 },
          quart: { label: 'quartic $x^4$', V: (x) => x ** 4, X: 2.6 },
          vee: { label: 'V-shaped $|x|$', V: (x) => Math.abs(x), X: 8 },
        };
        const pot = v.select('potential', Object.entries(POT).map(([value, P]) => ({ value, label: P.label })), 'quart');
        const rule = v.select('rule', [{ value: 0, label: '$\\oint p\\,dq = nh$ (1913–16)' }, { value: 0.5, label: '$(n+\\frac12)h$ (WKB, 1926)' }], 0);
        const ph = v.stage({ x: [-3, 3], y: [-5, 5], height: 340, axes: true, xlabel: 'x', ylabel: 'p', weight: 1.3, title: 'phase space' });
        const lv = v.stage({ x: [-3, 3], y: [0, 10], height: 340, axes: 'box', xlabel: 'x', ylabel: 'E', weight: 0.9, title: 'levels: predicted vs exact' });
        const cache = {};
        const exact = (key) => {
          if (cache[key]) return cache[key];
          const P = POT[key], N = 1400, L = P.hard ? A : P.X, dx = 2 * L / (N + 1), d = new Float64Array(N);
          for (let i = 0; i < N; i++) { const x = -L + (i + 1) * dx; d[i] = 1 / (dx * dx) + (P.hard ? 0 : P.V(x)); }
          return (cache[key] = sturmEigs(d, -1 / (2 * dx * dx), NL));
        };
        const turn = (P, E) => { if (P.hard) return A; let lo = 0, hi = P.X; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (P.V(m) < E) lo = m; else hi = m; } return (lo + hi) / 2; };
        const action = (P, E) => { if (E <= 0) return 0; const x2 = turn(P, E); return 2 * M.integrate((u) => Math.sqrt(2 * Math.max(0, E - (P.hard ? 0 : P.V(x2 * Math.sin(u))))) * x2 * Math.cos(u), -Math.PI / 2, Math.PI / 2, 400); };
        const energyFor = (P, J) => { let lo = 0, hi = 1; while (action(P, hi) < J) hi *= 2; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (action(P, m) < J) lo = m; else hi = m; } return (lo + hi) / 2; };
        const orbit = (P, E) => { const x2 = turn(P, E); return Array.from({ length: 301 }, (_, i) => { const t = 2 * Math.PI * i / 300, x = -x2 * Math.cos(t), p = Math.sqrt(2 * Math.max(0, E - (P.hard ? 0 : P.V(x)))); return [x, Math.sin(t) >= 0 ? p : -p]; }); };
        const hd = ph.handle(0, 2.5, { color: 'gold', r: 8 });
        let lastKey = null, st = null;
        v.render(() => {
          const key = pot.value, P = POT[key], mu = rule.value, ex = exact(key);
          const ns = mu ? [0, 1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6];
          const bs = ns.map((n) => energyFor(P, (n + mu) * HH));
          const Etop = Math.max(ex[NL - 1], bs[NL - 1]) * 1.12, xT = turn(P, Etop) * 1.12, pT = Math.sqrt(2 * Etop) * 1.1;
          ph.setView([-xT, xT], [-pT, pT]); lv.setView([-xT, xT], [0, Etop]);
          hd.constrain = (x, y) => [0, M.clamp(y, 0.06 * pT, 0.97 * pT)];
          if (lastKey !== key) { hd.x = 0; hd.y = Math.sqrt(2 * (0.5 * (ex[2] + ex[3]))); lastKey = key; }
          hd.x = 0;
          const E = hd.y * hd.y / 2, J = action(P, E);
          // phase space
          ph.poly(orbit(P, E), { fill: 'gold', fillAlpha: 0.22, color: 'gold', width: 2.2 });
          bs.forEach((Eb, i) => ph.path(orbit(P, Eb), { color: 'accent', width: 1.6, alpha: 0.85, close: true }));
          ph.text(`area = ${v.fix(J / HH, 3)} h`, 0, hd.y, { color: 'gold', size: 12.5, dx: 14, dy: -12, weight: 600 });
          // levels on the potential
          if (P.hard) { lv.line(-A, 0, -A, Etop, { color: 'ink', width: 3 }); lv.line(A, 0, A, Etop, { color: 'ink', width: 3 }); lv.line(-A, 0, A, 0, { color: 'ink', width: 2 }); }
          else lv.fn(P.V, { color: 'ink', width: 2.2 });
          ex.forEach((Ee) => { const x2 = turn(P, Ee); lv.line(-x2, Ee, x2, Ee, { color: 'green', width: 2.6 }); });
          bs.forEach((Eb, i) => { const x2 = turn(P, Eb); lv.line(-x2 * 1.12, Eb, x2 * 1.12, Eb, { color: 'accent', width: 1.6, dash: [5, 4] }); lv.text(`${ns[i]}`, x2 * 1.12, Eb, { color: 'accent', size: 10.5, dx: 4, align: 'left' }); });
          lv.hline(E, { color: 'gold', width: 1.2, alpha: 0.8 });
          const errs = bs.map((Eb, i) => (Eb - ex[i]) / ex[i]);
          st = { E, J, ex, bs, errs, ns, mu, key };
        });
        v.legend([['accent', 'Bohr–Sommerfeld orbits / levels'], ['green', 'exact levels (Schrödinger, finite differences)'], ['gold', 'your orbit', { area: true }]]);
        v.readout(() => st && `Your orbit: $E = ${v.fix(st.E, 3)}$, $\\oint p\\,dq = ${v.fix(st.J / (2 * Math.PI), 3)}\\,h$. Levels (exact → rule): ` + st.ex.map((e, i) => `$${v.fix(e, 3)}\\to${v.fix(st.bs[i], 3)}$`).join(', ') + `. Relative errors: ${st.errs.map((e) => (Math.abs(e) < 5e-4 ? '0.0' : v.fix(100 * e, 1)) + ' %').join(', ')}` + (st.key === 'ho' && st.mu === 0 ? ' — every level off by the zero-point energy $\\hbar\\omega/2$.' : st.key === 'box' && st.mu ? ' — hard walls do not take the half-integer correction.' : '.'));
      },
    },
  ],
};
