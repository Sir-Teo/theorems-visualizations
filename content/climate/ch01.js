// Climate Science — Chapter 1: Radiation and the planetary energy balance

// ── shared helpers ────────────────────────────────────────────────────────────
const D2R = Math.PI / 180, TAU = 2 * Math.PI;
let PHYS = null;
/**
 * Radiation constants from v.M.CONST, for wavelengths in µm: c1 = 2πhc² (W·µm⁴/m², so πB_λ comes out in
 * W m⁻² µm⁻¹), c2 = hc/k_B (µm·K), the solar constant S0 = L☉/(4π au²) and the Sun's effective temperature.
 */
function phys(v) {
  if (PHYS) return PHYS;
  const C = v.M.CONST;
  PHYS = { ...C, c1: 2 * Math.PI * C.h * C.c * C.c * 1e24, c2: ((C.h * C.c) / C.kB) * 1e6, S0: C.Lsun / (4 * Math.PI * C.au * C.au), Tsun: 5772 };
  return PHYS;
}
/** Blackbody spectral exitance πB_λ(T) in W m⁻² µm⁻¹ (λ in µm). */
function planck(P, lam, T) { const x = P.c2 / (lam * T); return x > 700 ? 0 : P.c1 / (lam ** 5 * Math.expm1(x)); }
/** Composite Simpson rule on [a, b] with n (even) panels. */
function simpson(f, a, b, n = 200) {
  n += n % 2; const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}
/** ∫₀^∞ πB_λ dλ computed numerically (Simpson in ln λ over λT = 50 … 5·10⁶ µm·K). */
function planckTotal(P, T) {
  return simpson((u) => { const l = Math.exp(u); return l * planck(P, l, T); }, Math.log(50 / T), Math.log(5e6 / T), 2400);
}
/** Fraction of σT⁴ emitted at wavelengths below lam (µm): series for large x = c2/λT, quadrature otherwise. */
function fracBelow(P, lam, T) {
  const x = P.c2 / (lam * T), k = 15 / Math.PI ** 4;
  if (x >= 6) { let s = 0; for (let n = 1; n <= 12; n++) s += (Math.exp(-n * x) / n) * (x ** 3 + (3 * x * x) / n + (6 * x) / (n * n) + 6 / n ** 3); return k * s; }
  return 1 - k * simpson((t) => (t < 1e-9 ? t * t : t ** 3 / Math.expm1(t)), 0, x, 160);
}
/** Maximiser of f on [lo, hi] by golden-section search in ln λ (f unimodal). */
function argmaxLog(f, lo, hi) {
  let a = Math.log(lo), b = Math.log(hi); const g = (Math.sqrt(5) - 1) / 2;
  let c = b - g * (b - a), d = a + g * (b - a), fc = f(Math.exp(c)), fd = f(Math.exp(d));
  for (let i = 0; i < 80; i++) { if (fc > fd) { b = d; d = c; fd = fc; c = b - g * (b - a); fc = f(Math.exp(c)); } else { a = c; c = d; fc = fd; d = a + g * (b - a); fd = f(Math.exp(d)); } }
  return Math.exp((a + b) / 2);
}
/** Root of an increasing function on [lo, hi] by bisection. */
function bisect(f, lo, hi, n = 70) { for (let i = 0; i < n; i++) { const m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m; } return (lo + hi) / 2; }
// CIE 1931 colour-matching functions (multi-lobe Gaussian fit of Wyman, Sloan & Shirley 2013), λ in nm.
function cmf(l) {
  const g = (m, s1, s2) => { const t = (l - m) / (l < m ? s1 : s2); return Math.exp(-0.5 * t * t); };
  return [1.056 * g(599.8, 37.9, 31.0) + 0.362 * g(442.0, 16.0, 26.7) - 0.065 * g(501.1, 20.4, 26.2),
    0.821 * g(568.8, 46.9, 40.5) + 0.286 * g(530.9, 16.3, 31.1),
    1.217 * g(437.0, 11.8, 36.0) + 0.681 * g(459.0, 26.0, 13.8)];
}
/** XYZ → sRGB 0–255 at full brightness (out-of-gamut colours desaturated toward white). */
function xyzToRGB(X, Y, Z) {
  let r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z, g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z, b = 0.0557 * X - 0.204 * Y + 1.057 * Z;
  const mn = Math.min(r, g, b); if (mn < 0) { r -= mn; g -= mn; b -= mn; }
  const mx = Math.max(r, g, b) || 1, gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
  return [r, g, b].map((c) => Math.round(255 * gam(c / mx)));
}
/** Perceived colour of a spectrum f(λ nm) (any units). */
function spectrumRGB(f) { let X = 0, Y = 0, Z = 0; for (let l = 380; l <= 780; l += 5) { const w = f(l), [a, b, c] = cmf(l); X += w * a; Y += w * b; Z += w * c; } return xyzToRGB(X, Y, Z); }
/** The visible band as a strip of spectral colours, between px0 and px1 pixels above the bottom edge (x axis in µm). */
function rainbow(s, px0 = 21, px1 = 31) {
  const y0 = s.invY(s.H - px0), y1 = s.invY(s.H - px1);
  for (let l = 380; l < 780; l += 5) {
    const [x, y, z] = cmf(l + 2.5), a = Math.max(0, Math.min(1, (l - 372) / 45, (788 - l) / 70));
    s.rect(l / 1000, y0, (l + 5.4) / 1000, y1, { fill: xyzToRGB(x, y, z), fillAlpha: 0.95 * a, stroke: false });
  }
}
/**
 * Slider on a logarithmic scale that returns rounded values (default: integers) and keeps an exact value set by
 * code or at start until the reader moves it.
 */
function logSlider(v, label, lo, hi, val, o = {}) {
  const N = 1000, toU = (x) => Math.round((N * Math.log(x / lo)) / Math.log(hi / lo)), fromU = (u) => lo * (hi / lo) ** (u / N);
  const rnd = o.round || Math.round; let ex = val;
  const fmt = (u) => { const x = ex ?? rnd(fromU(u)); return o.fmt ? o.fmt(x) : String(x); };
  const s = v.slider(label, 0, N, toU(val), { int: true, fmt, onChange: () => { ex = null; o.onChange?.(); } });
  return { el: s.el, get value() { return ex ?? rnd(fromU(s.value)); }, set(x) { ex = x; s.set(toU(x)); } };
}
/** Disc of a physical colour (rgb 0–255) with a soft glow, drawn in pixels. */
function glowDisc(s, X, Y, R, rgb, alpha) {
  const c = s.ctx, [r, g, b] = rgb;
  c.save();
  const gr = c.createRadialGradient(X, Y, R * 0.6, X, Y, R * 1.9);
  gr.addColorStop(0, `rgba(${r},${g},${b},${0.55 * alpha})`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  c.fillStyle = gr; c.beginPath(); c.arc(X, Y, R * 1.9, 0, TAU); c.fill();
  c.fillStyle = `rgba(${r},${g},${b},${alpha})`; c.beginPath(); c.arc(X, Y, R, 0, TAU); c.fill();
  c.restore();
}
/** Earth's orbit: solar longitude (rad from the March equinox) and (a/r)² on a day of the year (Kepler's equation). */
function orbitPos(day, ecc, perLon = 282.9, dayPeri = 3) {
  const Mn = (TAU * (day - dayPeri)) / 365.2422; let E = Mn;
  for (let i = 0; i < 8; i++) E -= (E - ecc * Math.sin(E) - Mn) / (1 - ecc * Math.cos(E));
  const nu = 2 * Math.atan2(Math.sqrt(1 + ecc) * Math.sin(E / 2), Math.sqrt(1 - ecc) * Math.cos(E / 2));
  return { lon: nu + perLon * D2R, fac: 1 / (1 - ecc * Math.cos(E)) ** 2 };
}
/** Solar declination (rad) for obliquity obl (deg) at solar longitude lon (rad). */
const declination = (obl, lon) => Math.asin(Math.sin(obl * D2R) * Math.sin(lon));
/** Hour angle of sunset (rad): 0 in polar night, π in polar day. */
function sunsetAngle(lat, dec) { const t = -Math.tan(lat * D2R) * Math.tan(dec); return t >= 1 ? 0 : t <= -1 ? Math.PI : Math.acos(t); }
/** Daily-mean top-of-atmosphere insolation (W/m²) at latitude lat (deg) for declination dec and distance factor fac. */
function dailyQ(S0, lat, dec, fac) {
  const p = lat * D2R, h0 = sunsetAngle(lat, dec);
  return Math.max(0, ((S0 * fac) / Math.PI) * (h0 * Math.sin(p) * Math.sin(dec) + Math.cos(p) * Math.cos(dec) * Math.sin(h0)));
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MDAYS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];
/** "21 Jun" for a day of the year (0 = 1 Jan). */
function dateLabel(d) { d = ((Math.round(d) % 365) + 365) % 365; let m = 0; while (d >= MDAYS[m + 1]) m++; return `${d - MDAYS[m] + 1} ${MONTHS[m]}`; }
/** Line segments of the level set f = level on a grid (marching squares, unlinked): returns a path with null breaks. */
function isoSegments(F, xs, ys, level) {
  const out = [], pt = (i0, j0, i1, j1) => { const a = F[j0][i0] - level, b = F[j1][i1] - level, t = a / (a - b); return [xs[i0] + t * (xs[i1] - xs[i0]), ys[j0] + t * (ys[j1] - ys[j0])]; };
  for (let j = 0; j + 1 < ys.length; j++) for (let i = 0; i + 1 < xs.length; i++) {
    const c = [F[j][i] > level, F[j][i + 1] > level, F[j + 1][i + 1] > level, F[j + 1][i] > level];
    const e = []; // crossings on edges: bottom, right, top, left
    if (c[0] !== c[1]) e.push(pt(i, j, i + 1, j)); if (c[1] !== c[2]) e.push(pt(i + 1, j, i + 1, j + 1));
    if (c[2] !== c[3]) e.push(pt(i + 1, j + 1, i, j + 1)); if (c[3] !== c[0]) e.push(pt(i, j + 1, i, j));
    if (e.length === 2) out.push(e[0], e[1], null); else if (e.length === 4) out.push(e[0], e[1], null, e[2], e[3], null);
  }
  return out;
}
const SIGMA = 5.670374419e-8; // only for helper defaults; viz code reads v.M.CONST.sigma

export default {
  collection: 'climate',
  chapter: 1,
  title: 'Radiation and the planetary energy balance',
  summary: String.raw`A planet's temperature is set by a balance between the sunlight it absorbs and the infrared it emits. Planck's law and its two consequences — the Stefan–Boltzmann $T^4$ law and Wien's displacement law — separate the short-wave solar spectrum from the long-wave terrestrial one, and Kirchhoff's law ties a body's emission to its absorption. The solar constant falls off as the inverse square of distance, the albedo decides how much sunlight is kept, and the zero-dimensional balance $S(1-\alpha)/4 = \sigma T^4$ gives Earth an effective temperature of 255 K, 33 K below the surface it actually has; the other planets show the same gap at very different strengths. Sunlight is shared unequally by latitude and season, the oceans delay the seasons, the faint young Sun poses the first puzzle of climate history, and scattering by molecules and particles colours the sky and helps set the albedo.`,
  items: [
    // ───────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1',
      kind: 'Law',
      name: 'Planck’s law and blackbody spectra',
      credit: 'Max Planck, 1900',
      statement: String.raw`A **blackbody** — a body that absorbs all radiation falling on it — in thermal equilibrium at absolute temperature $T$ emits a spectrum fixed by $T$ alone. Its spectral radiance per unit wavelength is
$$B_\lambda(T) = \frac{2hc^2}{\lambda^5}\,\frac{1}{e^{hc/\lambda k_BT}-1},$$
and a flat surface emits the spectral flux (exitance) $\pi B_\lambda(T)$ into the hemisphere above it. The curve rises steeply on the short-wave side, has a single peak and decays as $\lambda^{-4}$ on the long-wave side, and a hotter body emits more at *every* wavelength. Because $B_\lambda$ depends on $\lambda$ and $T$ essentially through $\lambda T$, the spectra of the Sun's photosphere ($T_\odot \approx 5772$ K) and of Earth ($255$–$288$ K) have the same shape, shifted by a factor of about 20 in wavelength: almost all sunlight lies below $4\ \mu$m and almost all terrestrial emission above it.`,
      scope: String.raw`Holds for matter in local thermodynamic equilibrium that is optically thick (black). Real surfaces emit $\varepsilon_\lambda\,\pi B_\lambda$ with emissivity $\varepsilon_\lambda \le 1$ (1.4), gases emit only in their absorption bands, and the Sun's spectrum is close to, but not exactly, that of a 5772 K blackbody.`,
      idea: String.raw`Planck counted the standing electromagnetic modes of a cavity (their density grows as $\nu^2$) and gave each mode the mean energy of a quantised oscillator, $h\nu/(e^{h\nu/k_BT}-1)$, instead of the classical $k_BT$ (thermo-9.4). The exponential switches off the short wavelengths that would classically carry unlimited energy. Written as energy per $\ln\lambda$, $\lambda B_\lambda$ is $T^4$ times a universal function of $\lambda T$, so on a logarithmic wavelength axis changing the temperature only *slides* the curve: the solar and terrestrial spectra are the same bump, 1.3 decades apart.`,
      caption: String.raw`Both spectra are plotted on a logarithmic wavelength axis as energy per $\ln\lambda$ (equal areas carry equal energy), each scaled to its own peak; switch to *absolute* to see sunlight arriving at 1 AU against Earth's own glow, in W m⁻² µm⁻¹ on a log scale. The purple sliver is the overlap of the two normalised spectra. Cool the star toward a red dwarf and heat the planet toward a lava world: the overlap grows and the clean split into "short-wave in, long-wave out" fails.`,
      deps: ['thermo-9.4'],
      refs: ['Archer ch. 2', 'Pierrehumbert'],
      tags: ['radiation', 'blackbody'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Planck%27s_law' },
      viz(v) {
        const P = phys(v), M = v.M;
        const mode = v.select('', [{ value: 'shape', label: 'normalised, per ln λ' }, { value: 'abs', label: 'absolute, at 1 AU (log scale)' }], 'shape');
        const Ts = v.slider(String.raw`star $T_\star$ (K)`, 2500, 12000, 5772, { step: 1 });
        const Tp = logSlider(v, String.raw`planet $T$ (K)`, 150, 1500, 288);
        const s = v.stage({ x: [0.1, 100], y: [-0.13, 1.13], xlog: true, height: 360, full: true, axes: 'box', xlabel: 'wavelength λ (µm)' });
        const dil = (P.Rsun / P.au) ** 2;
        let info = null;
        v.render(() => {
          const ab = mode.value === 'abs', T1 = Ts.value, T2 = Tp.value;
          const eS = planckTotal(P, T1), eE = planckTotal(P, T2);
          const pS = (l) => (l * planck(P, l, T1)) / eS, pE = (l) => (l * planck(P, l, T2)) / eE; // densities per ln λ
          const mS = pS(3669.7 / T1), mE = pE(3669.7 / T2);
          const fS = ab ? (l) => Math.log10(planck(P, l, T1) * dil) : (l) => pS(l) / mS;
          const fE = ab ? (l) => Math.log10(planck(P, l, T2)) : (l) => pE(l) / mE;
          const yr = ab ? [-2.9, 4.7] : [-0.13, 1.13];
          s.setView(null, yr);
          s.setTicks(null, ab ? [-2, -1, 0, 1, 2, 3, 4].map((k) => [k, k < 0 ? String(10 ** k) : k < 4 ? String(10 ** k) : '10⁴']) : [0, 0.25, 0.5, 0.75, 1]);
          rainbow(s);
          for (const [x, t] of [[0.22, 'ultraviolet'], [0.55, 'visible'], [1.7, 'near infrared'], [20, 'thermal infrared']]) s.text(t, x, yr[1], { align: 'center', baseline: 'top', dy: 6, size: 11, color: 'muted' });
          s.vline(4, { color: 'faint', dash: [3, 4] });
          s.text('4 µm', 4, yr[1] - (yr[1] - yr[0]) * 0.09, { size: 11, color: 'muted', dx: 4, align: 'left' });
          if (!ab) s.between((l) => Math.min(pS(l) / mS, pE(l) / mE), () => 0, 0.1, 100, { fill: 'purple', fillAlpha: 0.55, n: 500 });
          s.fn(fS, { color: 'gold', width: 2.6, fill: ab ? null : 'gold', fillAlpha: 0.14, base: 0 });
          s.fn(fE, { color: 'red', width: 2.6, fill: ab ? null : 'red', fillAlpha: 0.12, base: 0 });
          // overlap of the normalised densities, and the crossing of the absolute spectra
          const ov = simpson((u) => { const l = Math.exp(u); return Math.min(pS(l), pE(l)); }, Math.log(0.03), Math.log(1000), 1600);
          let cross = null;
          const g = (u) => Math.log(planck(P, Math.exp(u), T2)) - Math.log(planck(P, Math.exp(u), T1) * dil);
          const ua = Math.log(2898 / T1), ub = Math.log(2898 / T2);
          if (ub > ua && g(ua) < 0 && g(ub) > 0) cross = Math.exp(bisect(g, ua, ub));
          const lS = 3669.7 / T1, lE = 3669.7 / T2; // peaks of λB_λ
          const yS = ab ? Math.log10(planck(P, 2897.8 / T1, T1) * dil) : 1, yE = ab ? Math.log10(planck(P, 2897.8 / T2, T2)) : 1;
          s.text(`star, ${Math.round(T1)} K`, ab ? 2897.8 / T1 : lS, yS, { color: 'gold', align: 'center', baseline: 'bottom', dy: -7, weight: 600 });
          s.text(`planet, ${Math.round(T2)} K`, ab ? 2897.8 / T2 : lE, yE, { color: 'red', align: 'center', baseline: 'bottom', dy: -7, weight: 600 });
          if (ab && cross) {
            const yc = Math.log10(planck(P, cross, T2));
            s.dot(cross, yc, { color: 'purple', r: 4.5, label: `equal at ${v.fix(cross, 2)} µm`, labelPos: 'ne', labelColor: 'purple', math: false });
          }
          if (!ab) { // label the overlap where the two normalised curves cross
            const h = (u) => pE(Math.exp(u)) / mE - pS(Math.exp(u)) / mS, ua2 = Math.log(3669.7 / T1), ub2 = Math.log(3669.7 / T2);
            const xc = ub2 > ua2 ? Math.exp(bisect(h, ua2, ub2)) : Math.sqrt(3669.7 / T1 * 3669.7 / T2);
            s.text(`overlap ${v.fix(ov * 100, ov < 0.001 ? 3 : 2)} %`, xc, Math.min(pS(xc) / mS, 1) + 0.05, { color: 'purple', weight: 600, align: 'left', baseline: 'bottom', dx: 6 });
          }
          info = { ov, T1, T2, sw: 1 - fracBelow(P, 4, T1), lw: fracBelow(P, 4, T2), lS: 2897.8 / T1, lE: 2897.8 / T2, cross, ab };
        });
        v.legend([['gold', 'star (short-wave)'], ['red', 'planet (long-wave)'], ['purple', 'overlap of the two', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const pc = (x) => (x < 1e-4 ? `$${v.sci(x * 100, 2)}$` : v.fix(x * 100, x < 0.01 ? 3 : 2));
          let s = String.raw`overlap $\int\min(p_\star,p)\,d\ln\lambda$ = ${pc(info.ov)} % · starlight beyond 4 µm: ${pc(info.sw)} % · planet emission below 4 µm: ${pc(info.lw)} % · peaks of $B_\lambda$ at ${v.fix(info.lS, 3)} µm and ${v.fix(info.lE, 2)} µm`;
          if (info.ab && info.cross) s += ` · at 1 AU the two spectra cross at ${v.fix(info.cross, 2)} µm`;
          s += info.ov < 0.03 ? ' — the two spectra can be treated separately.' : ' — the short-wave/long-wave split is no longer clean.';
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2',
      kind: 'Law',
      name: 'Stefan–Boltzmann law',
      credit: 'Josef Stefan, 1879 (from measurements); Ludwig Boltzmann, 1884 (from thermodynamics)',
      statement: String.raw`The total power emitted per unit area by a blackbody at temperature $T$, summed over all wavelengths and over the hemisphere, is
$$F = \int_0^\infty \pi B_\lambda(T)\,d\lambda = \sigma T^4,\qquad \sigma = \frac{2\pi^5 k_B^4}{15\,h^3c^2} = 5.670\times10^{-8}\ \text{W m}^{-2}\,\text{K}^{-4}.$$
In particular $dF/F = 4\,dT/T$: a 1 % rise in temperature increases the emission by about 4 %, and near Earth's emission temperature (255 K) the emission grows by $4\sigma T^3 \approx 3.8$ W m⁻² per kelvin.`,
      scope: String.raw`Holds for a blackbody. A grey body of emissivity $\varepsilon$ emits $\varepsilon\sigma T^4$; a body whose emissivity varies with wavelength emits the Planck-weighted average, which itself changes with $T$.`,
      idea: String.raw`Substituting $x = hc/\lambda k_BT$ in Planck's law (1.1) turns the integral into $T^4$ times the pure number $\int_0^\infty x^3/(e^x-1)\,dx = \pi^4/15$: the temperature comes out of the integral as a fourth power because the spectrum stretches as $1/T$ in wavelength while its height grows as $T^5$. Boltzmann obtained the same $T^4$ from thermodynamics alone, using the radiation pressure $u/3$ of an isotropic photon gas (thermo-9.6).`,
      caption: String.raw`Left: the spectrum at temperature $T$ cut into strips whose areas are summed (the midpoint rule); the dashed curve is the same body warmed by the chosen percentage, and the orange area between them is the extra emission. Right: total emission against temperature on log–log axes, where $\sigma T^4$ is a straight line of slope 4; the gold dots are numerical integrals of the Planck curve. Raise the strip count and watch the sum converge to $\sigma T^4$.`,
      deps: ['climate-1.1', 'thermo-9.6'],
      refs: ['Archer ch. 2'],
      tags: ['radiation', 'blackbody'],
      viz(v) {
        const P = phys(v), sig = P.sigma;
        const T = logSlider(v, 'temperature $T$ (K)', 150, 6000, 288);
        const dT = v.slider('warm it by (%)', 0, 10, 1, { step: 0.1 });
        const N = v.slider('strips', 4, 60, 12, { int: true });
        const sA = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', height: 330, weight: 1.15, xlabel: 'λ (µm)', title: String.raw`spectrum $\pi B_\lambda$ (scaled to its peak at $T$)` });
        const sB = v.stage({ x: [100, 10000], y: [1, 2e9], xlog: true, ylog: true, axes: 'box', height: 330, xlabel: 'T (K)', title: String.raw`total emission $F$ (W/m²)` });
        const SAMPLES = [150, 200, 255, 288, 400, 600, 1000, 1500, 2500, 4000, 5772, 8000];
        const dots = SAMPLES.map((t) => [t, planckTotal(P, t)]);
        let R = null;
        v.render(() => {
          const t = T.value, t2 = t * (1 + dT.value / 100), lp = 2897.77 / t, L = 8 * lp, pk = planck(P, lp, t), n = N.value;
          sA.setView([0, L], [0, Math.max(1.12, 1.08 * planck(P, 2897.77 / t2, t2) / pk)]);
          const f = (l) => planck(P, l, t) / pk, f2 = (l) => planck(P, l, t2) / pk;
          if (dT.value > 0) sA.between(f2, f, 1e-4, L, { fill: 'orange', fillAlpha: 0.35, n: 300 });
          let sum = 0; const h = L / n;
          for (let i = 0; i < n; i++) { const m = (i + 0.5) * h, y = f(m); sum += y * h; sA.rect(i * h, 0, (i + 1) * h, y, { fill: 'accent', fillAlpha: 0.16, color: 'accent', width: 0.8, alpha: 0.55 }); }
          sA.fn(f, { color: 'accent', width: 2.6, domain: [1e-4, L] });
          if (dT.value > 0) sA.fn(f2, { color: 'orange', width: 2, dash: [6, 4], domain: [1e-4, L] });
          sA.dot(lp, 1, { color: 'accent', r: 4 });
          const stripSum = sum * pk, tail = (1 - fracBelow(P, L, t)) * sig * t ** 4, full = planckTotal(P, t), full2 = planckTotal(P, t2);
          sA.corner(`strip sum ${v.M.si(stripSum, 'W/m²', 4)} + tail beyond ${v.fix(L, L < 10 ? 2 : 0)} µm ${v.M.si(tail, 'W/m²', 2)}`, 'tr', { color: 'accent', weight: 600 });
          // right: F(T) on log–log axes
          sB.fn((x) => sig * x ** 4, { color: 'ink', width: 2 });
          for (const [x, F] of dots) sB.dot(x, F, { color: 'gold', r: 4.5 });
          sB.line(1000, sig * 1000 ** 4, 2000, sig * 1000 ** 4, { color: 'muted', width: 1.2, dash: [3, 3] });
          sB.line(2000, sig * 1000 ** 4, 2000, sig * 2000 ** 4, { color: 'muted', width: 1.2, dash: [3, 3] });
          sB.text('×2 in T', 1414, sig * 1000 ** 4, { color: 'muted', size: 11, align: 'center', baseline: 'top', dy: 4 });
          sB.text('×16 in F', 2000, sig * 1414 ** 4, { color: 'muted', size: 11, align: 'left', dx: 5 });
          sB.text('Earth 255 K', 255, sig * 255 ** 4, { color: 'muted', size: 11, align: 'left', dx: 9, dy: 9 });
          sB.text('Sun 5772 K', 5772, sig * 5772 ** 4, { color: 'muted', size: 11, align: 'left', dx: 9, dy: 9 });
          sB.dot(t, full, { color: 'accent', r: 6, label: v.M.si(full, 'W/m²', 3), labelPos: 'nw', labelColor: 'accent', math: false });
          R = { t, t2, stripSum, tail, full, full2, sb: sig * t ** 4 };
        });
        v.legend([['accent', 'Planck spectrum at $T$, and midpoint strips'], ['orange', 'warmed spectrum (extra area shaded)', { dash: true }], ['ink', String.raw`$\sigma T^4$`], ['gold', 'numerical integrals', { dot: true }]]);
        v.readout(() => {
          if (!R) return '';
          const d = dT.value / 100;
          return String.raw`strips + tail: ${v.M.si(R.stripSum + R.tail, 'W/m²', 5)} · Simpson over all λ: ${v.M.si(R.full, 'W/m²', 6)} · $\sigma T^4$ = ${v.M.si(R.sb, 'W/m²', 6)} (ratio ${v.fix(R.full / R.sb, 6)}) · warming by ${v.fix(dT.value, 1)} %: emission ×${v.fix(R.full2 / R.full, 4)} by integration, $(1+\delta)^4$ = ${v.fix((1 + d) ** 4, 4)}, $1+4\delta$ = ${v.fix(1 + 4 * d, 4)} · slope $dF/dT = 4\sigma T^3$ = ${v.fix(4 * P.sigma * R.t ** 3, R.t < 1000 ? 2 : 0)} W m⁻² K⁻¹`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3',
      kind: 'Law',
      name: 'Wien’s displacement law',
      credit: 'Wilhelm Wien, 1893',
      statement: String.raw`The wavelength at which the blackbody spectrum $B_\lambda(T)$ peaks is inversely proportional to the temperature:
$$\lambda_{\max} = \frac{b}{T},\qquad b = 2897.8\ \mu\text{m}\cdot\text{K}.$$
Earth at 288 K peaks near $10\ \mu$m, in the thermal infrared; the Sun at 5772 K near $0.50\ \mu$m, in the green. The constant depends on how the spectrum is measured: per unit frequency the peak lies at $\lambda T = 5099\ \mu$m·K, and per unit $\ln\lambda$ (equal energy per octave) at $3670\ \mu$m·K. All three move as $1/T$.`,
      scope: String.raw`Holds for a blackbody. The location of "the" peak is a property of the spectral variable chosen, not of the radiation; the $1/T$ scaling holds in every representation.`,
      idea: String.raw`Planck's law (1.1) has the form $B_\lambda = T^5\,g(\lambda T)$, so its maximum over $\lambda$ sits at a fixed value of $\lambda T$: setting the derivative to zero gives $x = 5(1-e^{-x})$ with $x = hc/\lambda k_BT$, whose root $x = 4.965$ yields $b = hc/(4.965\,k_B)$ (thermo-9.5). Per unit frequency the Jacobian $d\lambda/d\nu \propto \lambda^2$ reweights the curve and the equation becomes $x = 3(1-e^{-x})$, root $2.821$; per $\ln\lambda$ it is $x = 4(1-e^{-x})$, root $3.921$.`,
      caption: String.raw`Drag the temperature (or pick an object): the solid spectrum slides along the log-wavelength axis and its numerically located peak follows $b/T$, the straight line on the right. Switch the spectral variable: the peak jumps — the Sun peaks in the green per wavelength but in the near infrared per frequency — yet each version stays on its own $1/T$ line. The disc shows the colour of the glowing body and fades with its visible fraction.`,
      deps: ['climate-1.1', 'thermo-9.5'],
      refs: ['Archer ch. 2'],
      tags: ['radiation', 'blackbody'],
      viz(v) {
        const P = phys(v);
        const PRE = [{ value: 288, label: 'Earth' }, { value: 1400, label: 'lava' }, { value: 2800, label: 'lamp filament' }, { value: 5772, label: 'Sun' }, { value: 9940, label: 'Sirius' }];
        let T = null;
        v.select('', PRE, 5772, { onChange: (x) => T.set(x) });
        T = logSlider(v, '$T$ (K)', 200, 20000, 5772);
        const rep = v.select('spectrum per', [{ value: 'lam', label: 'wavelength' }, { value: 'ln', label: 'ln λ' }, { value: 'nu', label: 'frequency' }], 'lam');
        const sA = v.stage({ x: [0.05, 300], y: [-0.12, 1.16], xlog: true, axes: 'box', height: 330, weight: 1.45, xlabel: 'λ (µm)', title: 'blackbody spectrum, each version scaled to its own peak' });
        const sB = v.stage({ x: [0.08, 60], y: [150, 30000], xlog: true, ylog: true, axes: 'box', height: 330, xlabel: 'peak λ (µm)', title: 'temperature (K) against peak wavelength' });
        const REPS = { lam: { k: 0, c: 'accent', name: 'per wavelength' }, ln: { k: 1, c: 'teal', name: 'per ln λ' }, nu: { k: 2, c: 'purple', name: 'per frequency' } };
        let R = null;
        v.render(() => {
          const t = T.value, cur = rep.value;
          const f = (k) => (l) => l ** k * planck(P, l, t); // λ^k B_λ: k = 0 per λ, 1 per ln λ, 2 per ν
          const peaks = {};
          for (const [key, r] of Object.entries(REPS)) peaks[key] = argmaxLog(f(r.k), 200 / t, 30000 / t);
          rainbow(sA);
          for (const [key, r] of Object.entries(REPS)) {
            const g = f(r.k), m = g(peaks[key]), on = key === cur;
            if (on) { sA.fn((l) => g(l) / m, { color: r.c, width: 2.8, fill: r.c, fillAlpha: 0.13 }); }
            else sA.fn((l) => g(l) / m, { color: r.c, width: 1.4, dash: [5, 4], alpha: 0.6 });
            sA.line(peaks[key], 0, peaks[key], 1, { color: r.c, width: on ? 1.6 : 1, dash: [3, 3], alpha: on ? 1 : 0.6 });
            sA.dot(peaks[key], 1, { color: r.c, r: on ? 5.5 : 3.5, hollow: !on });
          }
          sA.text(`peak ${v.fix(peaks[cur], peaks[cur] < 1 ? 3 : 2)} µm`, peaks[cur], 1, { color: REPS[cur].c, weight: 600, align: 'center', baseline: 'bottom', dy: -9 });
          // right: the 1/T laws
          for (const [key, r] of Object.entries(REPS)) {
            const c = peaks[key] * t;
            sB.fn((l) => c / l, { color: r.c, width: key === cur ? 2.6 : 1.2, alpha: key === cur ? 1 : 0.55, dash: key === cur ? null : [5, 4] });
          }
          const bc = peaks[cur] * t;
          for (const p of PRE) sB.dot(bc / p.value, p.value, { color: 'muted', r: 3.5, label: p.label, labelPos: 'e', labelColor: 'muted', math: false, labelSize: 11 });
          sB.hline(t, { color: 'gold', dash: [4, 4], width: 1.2 });
          sB.dot(peaks[cur], t, { color: REPS[cur].c, r: 6 });
          // glow of the body
          const vis = fracBelow(P, 0.75, t) - fracBelow(P, 0.38, t);
          const rgb = spectrumRGB((nm) => planck(P, nm / 1000, t)), a = Math.max(0, Math.min(1, (Math.log10(Math.max(vis, 1e-300)) + 8) / 7));
          const X = sB.X(0.08) + 52, Y = sB.Y(150) - 72, c = sB.ctx; // a dark room, so that the glow shows in both themes
          c.save(); c.fillStyle = 'rgb(14,15,20)'; c.beginPath(); if (c.roundRect) c.roundRect(X - 40, Y - 40, 80, 80, 10); else c.rect(X - 40, Y - 40, 80, 80); c.fill();
          c.strokeStyle = 'rgba(160,160,170,0.5)'; c.setLineDash([3, 3]); c.beginPath(); c.arc(X, Y, 20, 0, TAU); c.stroke(); c.restore();
          glowDisc(sB, X, Y, 20, rgb, a);
          sB.textPx(a < 0.02 ? 'invisible glow' : 'in a dark room', X, Y + 50, { size: 11, color: 'muted', align: 'center' });
          R = { t, peaks, vis };
        });
        v.legend([['accent', 'per wavelength'], ['teal', 'per ln λ'], ['purple', 'per frequency'], ['gold', 'current T', { dash: true }]]);
        v.readout(() => {
          if (!R) return '';
          const pc = R.vis < 1e-4 ? `$${v.sci(R.vis * 100, 1)}$` : v.fix(R.vis * 100, 1);
          return String.raw`numerical peak ${REPS[rep.value].name}: $\lambda_{\max}$ = ${v.fix(R.peaks[rep.value], 4)} µm, so $\lambda_{\max}T$ = ${v.fix(R.peaks[rep.value] * R.t, 1)} µm·K · the three products: ${v.fix(R.peaks.lam * R.t, 1)} (per λ, Wien's $b$ = ${v.fix(P.b * 1e6, 1)}), ${v.fix(R.peaks.ln * R.t, 1)} (per ln λ), ${v.fix(R.peaks.nu * R.t, 1)} (per ν) µm·K — independent of $T$ · visible fraction of the emission: ${pc} %`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4',
      kind: 'Law',
      name: 'Kirchhoff’s law: emissivity equals absorptivity',
      credit: 'Gustav Kirchhoff, 1859–60',
      statement: String.raw`At every wavelength (and for every direction and polarisation) the emissivity of a body in local thermodynamic equilibrium equals its absorptivity:
$$\varepsilon_\lambda = a_\lambda .$$
The body emits $\varepsilon_\lambda\,\pi B_\lambda(T)$, a fraction $\varepsilon_\lambda$ of the blackbody spectrum (1.1) at its own temperature: a good absorber at some wavelength is an equally good emitter there, and a medium transparent at $\lambda$ cannot emit at $\lambda$. A grey body of absorptivity $a$ therefore emits $a\sigma T^4$. The equality holds wavelength by wavelength, not between different wavelengths: fresh snow absorbs only about 10 % of sunlight yet is nearly black ($\varepsilon \approx 0.99$) at 10 µm, and greenhouse gases emit exactly in the bands where they absorb.`,
      scope: String.raw`Holds for matter in local thermodynamic equilibrium, i.e. when collisions keep the energy levels populated at the local temperature — true in the troposphere and stratosphere, not in the thin upper atmosphere above roughly 70 km. It relates emission and absorption at the same wavelength, direction and polarisation only.`,
      idea: String.raw`Put the body inside a closed cavity whose walls are at temperature $T$; the radiation there is blackbody radiation $B_\lambda(T)$. By the second law no temperature difference can arise spontaneously inside an isothermal enclosure (thermo-9.1), so the body must end at $T$, absorbing exactly what it emits. Surrounding it by a filter that passes only a narrow band near $\lambda$ forces the balance in that band alone: $a_\lambda B_\lambda = \varepsilon_\lambda B_\lambda$. A material with $\varepsilon_\lambda \ne a_\lambda$ would settle hotter or colder than its surroundings and could drive a heat engine with no fuel.`,
      caption: String.raw`A thin plate sits in a cavity whose walls are at 500 K; the dashed wavelength $\lambda_c$ splits the walls' radiation into two bands carrying equal energy, and you set the plate's absorptivity in each. Obeying Kirchhoff's law, it always ends at 500 K. Pick a material that breaks the law — one that emits like a blackbody, or whose emissivity is its absorptivity swapped between the bands — and add a filter that lets only one band reach the plate: it settles at a different temperature from its surroundings, a free temperature difference the second law forbids. Drag the start temperature in the lower panel.`,
      deps: ['climate-1.1', 'thermo-9.1'],
      refs: ['Pierrehumbert'],
      tags: ['radiation', 'emissivity', 'second law'],
      viz(v) {
        const P = phys(v), sig = P.sigma, Tw = 500, CAP = 7850 * 470 * 1e-3; // walls (K); 1 mm of steel (J m⁻² K⁻¹)
        const lamC = bisect((l) => fracBelow(P, l, Tw) - 0.5, 1, 100); // median wavelength of the walls' radiation
        const law = v.select('plate', [{ value: 'k', label: 'obeys Kirchhoff' }, { value: 'swap', label: 'ε swapped between bands' }, { value: 'black', label: 'emits as a blackbody' }], 'k');
        const filt = v.select('filter', [{ value: 'none', label: 'none' }, { value: 's', label: 'short band only' }, { value: 'l', label: 'long band only' }], 'none');
        const aS = v.slider('absorptivity, short band', 0.05, 1, 0.9, { step: 0.01 });
        const aL = v.slider('absorptivity, long band', 0.05, 1, 0.3, { step: 0.01 });
        const sA = v.stage({ x: [0, 10], y: [0, 6.4], equal: true, axes: false, height: 280 });
        const sB = v.stage({ x: [1, 200], y: [-0.06, 1.2], xlog: true, axes: 'box', height: 280, xlabel: 'λ (µm)', title: 'energy per ln λ, scaled to the walls' });
        const sC = v.stage({ x: [0, 600], y: [200, 600], axes: 'box', height: 190, full: true, xlabel: 't (s)', title: 'plate temperature (K)' });
        const h0 = sC.handle(0, 300, { color: 'accent', label: 'start', labelPos: 'e', constrain: (x, y) => [0, Math.max(150, Math.min(900, y))] });
        let R = null, key = '';
        const model = () => {
          const k = [law.value, filt.value, aS.value, aL.value, h0.y].join('|');
          if (k === key) return R;
          key = k;
          const a = [aS.value, aL.value], e = law.value === 'k' ? a : law.value === 'swap' ? [a[1], a[0]] : [1, 1];
          const pass = [filt.value !== 'l' ? 1 : 0, filt.value !== 's' ? 1 : 0], fw = fracBelow(P, lamC, Tw);
          const absorbed = sig * Tw ** 4 * (pass[0] * a[0] * fw + pass[1] * a[1] * (1 - fw));
          const emitted = (T) => { const f = fracBelow(P, lamC, T); return sig * T ** 4 * (pass[0] * e[0] * f + pass[1] * e[1] * (1 - f)); };
          const Teq = bisect((T) => emitted(T) - absorbed, 20, 4000, 60);
          const rate = (T) => (2 * (absorbed - emitted(T))) / CAP; // two faces
          const ts = [0], Ts = [h0.y]; let T = h0.y;
          for (let i = 1; i <= 300; i++) { const h = 2, k1 = rate(T), k2 = rate(T + (h / 2) * k1), k3 = rate(T + (h / 2) * k2), k4 = rate(T + h * k3); T += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4); ts.push(i * h); Ts.push(T); }
          R = { a, e, pass, absorbed, emitted, Teq, ts, Ts, emitW: emitted(Tw) };
          return R;
        };
        v.render(() => {
          const m = model(), dT = m.Teq - Tw, hot = dT > 0.05, cold = dT < -0.05;
          // ── the cavity
          sA.rect(0.25, 0.25, 9.75, 6.15, { color: 'orange', width: 7, alpha: 0.75 });
          sA.text(`walls at ${Tw} K`, 5, 5.85, { color: 'orange', weight: 600, align: 'center', size: 12 });
          const y0 = [4.15, 2.15], cols = ['gold', 'red'], names = ['short band', 'long band'], Pmax = 0.5 * sig * Tw ** 4;
          for (let b = 0; b < 2; b++) {
            const inn = m.pass[b] ? m.a[b] * Pmax * (b ? 1 : 1) : Pmax, fb = fracBelow(P, lamC, m.Teq), out = m.e[b] * sig * m.Teq ** 4 * (b ? 1 - fb : fb);
            const wIn = 1 + 6 * (m.pass[b] ? (m.a[b] * Pmax) / Pmax : 1), wOut = 1 + 6 * (out / Pmax);
            for (const side of [-1, 1]) {
              const xw = 5 + side * 4.35, xs = 5 + side * 0.62, xf = 5 + side * 1.55, yi = y0[b] + 0.32, yo = y0[b] - 0.32;
              if (m.pass[b]) {
                sA.arrow(xw, yi, xs, yi, { color: cols[b], width: wIn, head: 10 });
                sA.arrow(xs, yo, xw, yo, { color: cols[b], width: wOut, head: 10, alpha: 0.6 });
              } else {
                sA.arrow(xw, yi, xf + side * 0.12, yi, { color: cols[b], width: 1 + 6 * 1, head: 9, alpha: 0.35 });
                sA.text('reflected', xf + side * 0.5, yo, { color: 'muted', size: 10.5, align: side < 0 ? 'right' : 'left' });
              }
            }
            sA.text(names[b], 0.7, y0[b] + 0.85, { color: cols[b], size: 11.5, weight: 600, align: 'left' });
          }
          if (filt.value !== 'none') { sA.rect(3.45, 0.85, 6.55, 5.25, { color: 'teal', width: 2, dash: [6, 4] }); sA.text(`filter: ${filt.value === 's' ? 'short' : 'long'} band only`, 5, 0.62, { color: 'teal', size: 11, align: 'center', weight: 600 }); }
          sA.rect(4.62, 1.3, 5.38, 4.95, { fill: hot ? 'red' : cold ? 'blue' : 'gray', fillAlpha: hot || cold ? 0.18 + Math.min(0.5, Math.abs(dT) / 120) : 0.3, color: 'ink', width: 1.4 });
          sA.text(`${v.fix(m.Teq, 1)} K`, 5, 3.15, { color: 'ink', weight: 700, size: 12.5, align: 'center' });
          // ── spectra
          const pw = (l) => l * planck(P, l, Tw), mw = pw(3669.7 / Tw), pt = (l) => l * planck(P, l, m.Teq) / mw;
          const band = (l) => (l < lamC ? 0 : 1), ok = (l) => m.pass[band(l)];
          for (let b = 0; b < 2; b++) if (!m.pass[b]) sB.vband(b ? lamC : 1, b ? 200 : lamC, { color: 'gray', alpha: 0.13 });
          sB.fn((l) => pw(l) / mw, { color: 'orange', width: 1.6, dash: [5, 4] });
          sB.fn((l) => (ok(l) ? (m.a[band(l)] * pw(l)) / mw : NaN), { color: 'accent', width: 0.1, fill: 'accent', fillAlpha: 0.25, alpha: 0 });
          sB.fn((l) => (ok(l) ? m.e[band(l)] * pt(l) : NaN), { color: 'red', width: 2.4 });
          sB.vline(lamC, { color: 'muted', dash: [3, 4] });
          sB.text('λ_c', lamC, 1.13, { color: 'muted', size: 11, align: 'left', dx: 4 });
          sB.text('short', lamC, 1.13, { color: 'gold', size: 11, align: 'right', dx: -8, weight: 600 });
          sB.text('long', lamC, 1.05, { color: 'red', size: 11, align: 'left', dx: 30, weight: 600 });
          // ── relaxation
          const lo = Math.min(Tw, m.Teq, h0.y, ...m.Ts), hi = Math.max(Tw, m.Teq, h0.y, ...m.Ts), pad = Math.max(25, (hi - lo) * 0.18);
          sC.setView(null, [lo - pad, hi + pad]);
          sC.hline(Tw, { color: 'orange', dash: [6, 4], width: 1.5 });
          sC.text('walls', 600, Tw, { color: 'orange', size: 11, align: 'right', baseline: 'bottom', dy: -3, dx: -6 });
          if (Math.abs(dT) > 0.5) { sC.hline(m.Teq, { color: hot ? 'red' : 'blue', dash: [3, 3], width: 1.2 }); sC.text(`equilibrium ${v.fix(m.Teq, 1)} K`, 600, m.Teq, { color: hot ? 'red' : 'blue', size: 11, align: 'right', baseline: dT > 0 ? 'bottom' : 'top', dy: dT > 0 ? -3 : 3, dx: -6 }); }
          sC.path(m.ts.map((t, i) => [t, m.Ts[i]]), { color: 'accent', width: 2.6 });
        });
        v.legend([['orange', "walls' blackbody spectrum", { dash: true }], ['accent', 'absorbed: $a(\\lambda)$ × walls'], ['red', 'emitted by the plate at its temperature'], ['teal', 'filter', { dash: true }]]);
        v.readout(() => {
          const m = model(), dT = m.Teq - Tw;
          const s = String.raw`absorbed ${v.fix(m.absorbed, 1)} W/m² per face · emitted at 500 K would be ${v.fix(m.emitW, 1)} W/m² · equilibrium plate temperature ${v.fix(m.Teq, 2)} K, walls ${Tw} K: $\Delta T$ = ${v.fix(dT, 2)} K`;
          if (Math.abs(dT) < 0.05) return s + (law.value === 'k' ? ' — no temperature difference, whatever the absorptivities.' : ' — balanced on average, but only by luck: try a filter.');
          return s + String.raw` — a heat engine between plate and walls could run for ever (Carnot efficiency ${v.fix((Math.abs(dT) / Math.max(m.Teq, Tw)) * 100, 1)} %): a perpetual-motion machine of the second kind, so no real material behaves like this.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Definition',
      name: 'Solar constant and planetary albedo',
      credit: 'Claude Pouillet, 1838 (first measurement of the solar constant)',
      statement: String.raw`The **solar constant** $S$ of a planet is the flux of sunlight through a surface perpendicular to the rays at the planet's mean distance $d$ from the Sun, outside any atmosphere. Since the Sun's luminosity $L_\odot = 3.83\times10^{26}$ W crosses every sphere around it,
$$S = \frac{L_\odot}{4\pi d^2},$$
about $1361$ W m⁻² at Earth ($d = 1$ AU; the measured *total solar irradiance*), and it scales as $1/d^2$. The **planetary (Bond) albedo** $\alpha$ is the fraction of the incident sunlight, summed over all wavelengths and directions, that the planet reflects back to space (Earth: $\alpha \approx 0.30$). A sphere of radius $R$ intercepts $S\pi R^2$ and absorbs $(1-\alpha)S\pi R^2$; spread over its surface $4\pi R^2$, the mean absorbed flux is
$$\frac{S(1-\alpha)}{4}\approx 238\ \text{W m}^{-2}\ \text{for Earth.}$$`,
      idea: String.raw`With no absorption in space, the same power $L_\odot$ crosses every sphere centred on the Sun, so the flux falls as $1/d^2$ (astro-4.2) — doubling the distance quarters it. The albedo lumps together everything that sends sunlight back: clouds, ice, deserts, oceans at grazing sun and the air molecules themselves (1.11). The factor $1/4$ is the ratio of the cross-section $\pi R^2$ that catches the beam to the area $4\pi R^2$ over which it is shared by day, night and latitude (1.6).`,
      caption: String.raw`Drag the gold point along the inverse-square line, or click a planet: the dashed step shows the flux falling by 4 when the distance doubles. Pick a surface or set the albedo: the planet's brightness and the budget bar show how the sunlight arriving on an average square metre — $S/4$ — splits into reflected and absorbed parts.`,
      deps: ['astro-4.2', 'energy-4.1'],
      refs: ['Archer ch. 2', 'Pierrehumbert'],
      tags: ['solar radiation', 'albedo'],
      viz(v) {
        const P = phys(v), M = v.M;
        const PL = [['Mercury', 0.387], ['Venus', 0.723], ['Earth', 1], ['Mars', 1.524], ['Ceres', 2.77], ['Jupiter', 5.203], ['Saturn', 9.537], ['Uranus', 19.19], ['Neptune', 30.07]];
        const COVER = [{ value: 0.06, label: 'ocean' }, { value: 0.14, label: 'forest' }, { value: 0.3, label: 'Earth' }, { value: 0.4, label: 'desert' }, { value: 0.6, label: 'cloud deck' }, { value: 0.85, label: 'fresh snow' }];
        let alb = null;
        v.select('surface', COVER, 0.3, { onChange: (x) => alb.set(x) });
        alb = v.slider('albedo $\\alpha$', 0, 1, 0.3, { step: 0.01 });
        const Sd = (d) => P.Lsun / (4 * Math.PI * (d * P.au) ** 2);
        const sA = v.stage({ x: [0.25, 50], y: [0.4, 4e4], xlog: true, ylog: true, axes: 'box', height: 330, weight: 1.2, xlabel: 'distance d (AU)', title: String.raw`solar constant $S = L_\odot/4\pi d^2$ (W/m²)` });
        const sB = v.stage({ x: [-1.6, 1.6], y: [-1.45, 1.25], equal: true, axes: false, height: 330, title: 'what the planet does with it' });
        const hd = sA.handle(1, Sd(1), { color: 'gold', r: 8, constrain: (x) => { const d = M.clamp(x, 0.3, 40); return [d, Sd(d)]; } });
        sA.onClick((x) => { let best = null, bd = 0.08; for (const [, d] of PL) { const e = Math.abs(Math.log10(x / d)); if (e < bd) { bd = e; best = d; } } if (best) hd.set(best, Sd(best)); });
        v.render(() => {
          const d = hd.x, S = Sd(d), a = alb.value;
          // ── inverse square
          sA.fn(Sd, { color: 'gold', width: 2.2 });
          PL.forEach(([n, dd], i) => { const up = i % 2 === 0; sA.dot(dd, Sd(dd), { color: n === 'Earth' ? 'blue' : 'muted', r: 4.5, label: n, labelPos: up ? 'ne' : 'sw', labelColor: n === 'Earth' ? 'blue' : 'muted', math: false, labelSize: 11 }); });
          if (2 * d < 50) {
            sA.line(d, S, 2 * d, S, { color: 'orange', dash: [4, 3], width: 1.4 });
            sA.line(2 * d, S, 2 * d, S / 4, { color: 'orange', dash: [4, 3], width: 1.4 });
            sA.text('×2', Math.SQRT2 * d, S, { color: 'orange', size: 11, align: 'center', baseline: 'bottom', dy: -3 });
            sA.text('÷4', 2 * d, S / 2, { color: 'orange', size: 11, align: 'left', dx: 5 });
          }
          sA.corner(`${v.fix(d, 3)} AU: S = ${v.fix(S, S < 10 ? 2 : 0)} W/m²`, 'tr', { color: 'gold', weight: 600 });
          // ── the planet
          const cx = 0.25, cy = 0.2, R = 0.78, g = Math.round(255 * Math.pow(Math.max(a, 0.005), 1 / 2.2));
          for (let k = -3; k <= 3; k++) {
            const y = cy + (k / 3.4) * R, xs = cx - Math.sqrt(R * R - (y - cy) ** 2);
            sB.arrow(-1.55, y, xs - 0.02, y, { color: 'gold', width: 2.2, head: 7 });
            if (a > 0.02) { const ang = Math.atan2(y - cy, xs - cx); sB.arrow(xs, y, xs + Math.cos(ang) * 0.55, y + Math.sin(ang) * 0.55, { color: 'gold', width: 0.5 + 3 * a, alpha: 0.85, head: 6 }); }
          }
          sB.circle(cx, cy, R, { fill: [g, g, g], fillAlpha: 1, color: 'ink', width: 1.2 });
          sB.text(`α = ${v.fix(a, 2)}`, cx, cy, { color: g > 128 ? [20, 20, 20] : [235, 235, 235], halo: false, align: 'center', weight: 700, size: 13 });
          sB.text('sunlight', -1.55, cy + R + 0.14, { color: 'gold', size: 11, align: 'left' });
          // budget bar for an average square metre
          const x0 = -1.45, x1 = 1.45, yb = -1.12, w = x1 - x0, xr = x0 + w * a;
          sB.rect(x0, yb - 0.11, xr, yb + 0.11, { fill: 'faint', fillAlpha: 0.55, stroke: false });
          sB.rect(xr, yb - 0.11, x1, yb + 0.11, { fill: 'gold', fillAlpha: 0.75, stroke: false });
          sB.rect(x0, yb - 0.11, x1, yb + 0.11, { color: 'ink', width: 1 });
          sB.text(`S/4 = ${v.fix(S / 4, 1)} W/m² arrives on an average m²`, 0, yb + 0.24, { size: 11.5, align: 'center', color: 'ink' });
          if (a > 0.12) sB.text(`reflected ${v.fix((a * S) / 4, 0)}`, x0 + (w * a) / 2, yb, { size: 10.5, align: 'center', color: 'ink', halo: false });
          if (a < 0.86) sB.text(`absorbed ${v.fix(((1 - a) * S) / 4, 0)}`, xr + (x1 - xr) / 2, yb, { size: 10.5, align: 'center', color: 'ink', halo: false });
        });
        v.legend([['gold', String.raw`$S \propto 1/d^2$`], ['orange', 'doubling the distance', { dash: true }], ['faint', 'reflected', { dot: true }], ['gold', 'absorbed', { dot: true }]]);
        v.readout(() => {
          const d = hd.x, S = Sd(d), a = alb.value;
          return String.raw`$S = L_\odot/4\pi d^2$ = ${v.fix(S, 1)} W/m² at ${v.fix(d, 3)} AU · $S d^2$ = ${v.fix(S * d * d, 1)} W m⁻² AU² (the same everywhere) · reflected $\alpha S/4$ = ${v.fix((a * S) / 4, 1)} W/m², absorbed $S(1-\alpha)/4$ = ${v.fix(((1 - a) * S) / 4, 1)} W/m² · Earth's own orbit (eccentricity 0.0167) swings $S$ between ${v.fix(Sd(0.98329), 0)} W/m² in January and ${v.fix(Sd(1.01671), 0)} W/m² in July`;
        });
      },
    },
  ],
};
