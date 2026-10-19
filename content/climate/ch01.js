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
/**
 * Mie scattering by a homogeneous sphere of real refractive index m at size parameter x = 2πr/λ (the Bohren–Huffman
 * BHMIE recurrences). Returns {qsca, a, b}: the scattering efficiency and the coefficients a_n, b_n as [re, im].
 */
function mie(x, m) {
  const nstop = Math.round(x + 4.05 * Math.cbrt(x) + 2), y = m * x, nmx = Math.round(Math.max(nstop, Math.abs(y)) + 16);
  const D = new Float64Array(nmx + 1);
  for (let n = nmx; n >= 2; n--) D[n - 1] = n / y - 1 / (D[n] + n / y);
  let psi0 = Math.cos(x), psi1 = Math.sin(x), chi0 = -Math.sin(x), chi1 = Math.cos(x), q = 0;
  const A = [], Bc = [];
  const coef = (t, psi, chi) => { const re = t * psi - psi1, im = -(t * chi - chi1), d = re * re + im * im; return [(re * re) / d, (re * -im) / d]; }; // re/(re + i·im)
  for (let n = 1; n <= nstop; n++) {
    const psi = ((2 * n - 1) / x) * psi1 - psi0, chi = ((2 * n - 1) / x) * chi1 - chi0;
    const an = coef(D[n] / m + n / x, psi, chi), bn = coef(m * D[n] + n / x, psi, chi);
    A.push(an); Bc.push(bn);
    q += (2 * n + 1) * (an[0] ** 2 + an[1] ** 2 + bn[0] ** 2 + bn[1] ** 2);
    psi0 = psi1; psi1 = psi; chi0 = chi1; chi1 = chi;
  }
  return { qsca: (2 / (x * x)) * q, a: A, b: Bc };
}
/** Unpolarised scattered intensity (|S1|² + |S2|²)/2 at cos θ = mu from Mie coefficients. */
function mieIntensity(r, mu) {
  let pi0 = 0, pi1 = 1, s1r = 0, s1i = 0, s2r = 0, s2i = 0;
  for (let n = 1; n <= r.a.length; n++) {
    const tau = n * mu * pi1 - (n + 1) * pi0, f = (2 * n + 1) / (n * (n + 1)), [ar, ai] = r.a[n - 1], [br, bi] = r.b[n - 1];
    s1r += f * (ar * pi1 + br * tau); s1i += f * (ai * pi1 + bi * tau);
    s2r += f * (ar * tau + br * pi1); s2i += f * (ai * tau + bi * pi1);
    const p = ((2 * n + 1) * mu * pi1 - (n + 1) * pi0) / n; pi0 = pi1; pi1 = p;
  }
  return (s1r * s1r + s1i * s1i + s2r * s2r + s2i * s2i) / 2;
}

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
      caption: String.raw`Left: the spectrum at temperature $T$ cut into strips whose areas are summed (the midpoint rule); the dashed curve is the same body warmed by the chosen percentage, and the orange area between them is the extra emission. Right: total emission against temperature on log–log axes, where $\sigma T^4$ is a straight line of slope 4; the gold dots are numerical integrals of the Planck curve. Raise the strip count and watch the sum converge to $\sigma T^4$. Switch to the classical (Rayleigh–Jeans) spectrum, $\pi B_\lambda \approx 2\pi c k_BT/\lambda^4$: the curve blows up at short wavelengths and the strip sum grows without limit as the strips get finer — without Planck's cutoff there is no $T^4$ law at all.`,
      deps: ['climate-1.1', 'thermo-9.6'],
      refs: ['Archer ch. 2'],
      tags: ['radiation', 'blackbody'],
      viz(v) {
        const P = phys(v), sig = P.sigma;
        const T = logSlider(v, 'temperature $T$ (K)', 150, 6000, 288);
        const dT = v.slider('warm it by (%)', 0, 10, 1, { step: 0.1 });
        const N = v.slider('strips', 4, 60, 12, { int: true });
        const rj = v.toggle('classical (Rayleigh–Jeans) spectrum', false);
        const sA = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', height: 330, weight: 1.15, xlabel: 'λ (µm)', title: String.raw`spectrum $\pi B_\lambda$ (scaled to its peak at $T$)` });
        const sB = v.stage({ x: [100, 10000], y: [1, 2e9], xlog: true, ylog: true, axes: 'box', height: 330, xlabel: 'T (K)', title: String.raw`total emission $F$ (W/m²)` });
        const SAMPLES = [150, 200, 255, 288, 400, 600, 1000, 1500, 2500, 4000, 5772, 8000];
        const dots = SAMPLES.map((t) => [t, planckTotal(P, t)]);
        let R = null;
        v.render(() => {
          const t = T.value, t2 = t * (1 + dT.value / 100), lp = 2897.77 / t, L = 8 * lp, pk = planck(P, lp, t), n = N.value;
          sA.setView([0, L], [0, Math.max(rj.value ? 1.6 : 1.12, 1.08 * planck(P, 2897.77 / t2, t2) / pk)]);
          const f = (l) => planck(P, l, t) / pk, f2 = (l) => planck(P, l, t2) / pk;
          if (dT.value > 0) sA.between(f2, f, 1e-4, L, { fill: 'orange', fillAlpha: 0.35, n: 300 });
          const g = rj.value ? (l) => (P.c1 * t) / (P.c2 * l ** 4) / pk : f; // the classical limit x ≪ 1 of Planck's law
          let sum = 0; const h = L / n;
          for (let i = 0; i < n; i++) { const m = (i + 0.5) * h, y = g(m); sum += y * h; sA.rect(i * h, 0, (i + 1) * h, Math.min(y, 50), { fill: rj.value ? 'red' : 'accent', fillAlpha: 0.16, color: rj.value ? 'red' : 'accent', width: 0.8, alpha: 0.55 }); }
          if (rj.value) sA.fn(g, { color: 'red', width: 2.4, domain: [L / 400, L] });
          sA.fn(f, { color: 'accent', width: 2.6, domain: [1e-4, L] });
          if (dT.value > 0) sA.fn(f2, { color: 'orange', width: 2, dash: [6, 4], domain: [1e-4, L] });
          sA.dot(lp, 1, { color: 'accent', r: 4 });
          const stripSum = sum * pk, tail = (1 - fracBelow(P, L, t)) * sig * t ** 4, full = planckTotal(P, t), full2 = planckTotal(P, t2);
          if (rj.value) sA.corner(`classical strip sum ${v.M.si(stripSum, 'W/m²', 3)} — ${v.fix(stripSum / (sig * t ** 4), 1)} × σT⁴ and growing`, 'tr', { color: 'red', weight: 600 });
          else sA.corner(`strip sum ${v.M.si(stripSum, 'W/m²', 4)} + tail beyond ${v.fix(L, L < 10 ? 2 : 0)} µm ${v.M.si(tail, 'W/m²', 2)}`, 'tr', { color: 'accent', weight: 600 });
          // right: F(T) on log–log axes
          sB.fn((x) => sig * x ** 4, { color: 'ink', width: 2 });
          for (const [x, F] of dots) sB.dot(x, F, { color: 'gold', r: 4.5 });
          sB.line(1000, sig * 1000 ** 4, 2000, sig * 1000 ** 4, { color: 'muted', width: 1.2, dash: [3, 3] });
          sB.line(2000, sig * 1000 ** 4, 2000, sig * 2000 ** 4, { color: 'muted', width: 1.2, dash: [3, 3] });
          sB.text('×2 in T', 1414, sig * 1000 ** 4, { color: 'muted', size: 11, align: 'center', baseline: 'top', dy: 4 });
          sB.text('×16 in F', 2000, sig * 1414 ** 4, { color: 'muted', size: 11, align: 'left', dx: 5 });
          sB.text('Earth 255 K', 255, sig * 255 ** 4, { color: 'muted', size: 11, align: 'left', dx: 9, dy: 9 });
          sB.text('Sun 5772 K', 5772, sig * 5772 ** 4, { color: 'muted', size: 11, align: 'right', dx: -10, dy: -10 });
          sB.dot(t, full, { color: 'accent', r: 6, label: v.M.si(full, 'W/m²', 3), labelPos: 'nw', labelColor: 'accent', math: false });
          R = { t, t2, stripSum, tail, full, full2, sb: sig * t ** 4, rj: rj.value, n };
        });
        v.legend([['accent', 'Planck spectrum at $T$, and midpoint strips'], ['orange', 'warmed spectrum (extra area shaded)', { dash: true }], ['ink', String.raw`$\sigma T^4$`], ['gold', 'numerical integrals', { dot: true }]]);
        v.readout(() => {
          if (!R) return '';
          const d = dT.value / 100;
          if (R.rj) return String.raw`classical spectrum: ${R.n} strips give ${v.M.si(R.stripSum, 'W/m²', 3)}; the first strip alone grows as $n^3$ because $\int_{\lambda_0}^\infty 2\pi c k_BT\lambda^{-4}\,d\lambda = 2\pi c k_BT/3\lambda_0^3 \to \infty$ as $\lambda_0 \to 0$ — the ultraviolet catastrophe · Planck's law gives the finite ${v.M.si(R.full, 'W/m²', 5)} = $\sigma T^4$`;
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
          const X = sB.X(0.08) + 82, Y = sB.Y(150) - 100, c = sB.ctx; // a dark room, so that the glow shows in both themes
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
        const sC = v.stage({ x: [-18, 600], y: [200, 600], axes: 'box', height: 190, full: true, xlabel: 't (s)', title: 'plate temperature (K) — a 1 mm steel plate, both faces exchanging radiation' });
        const h0 = sC.handle(0, 300, { color: 'accent', label: 'start', labelPos: 'ne', constrain: (x, y) => [0, Math.max(150, Math.min(900, y))] });
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
          const eEff = pass[0] * e[0] * fw + pass[1] * e[1] * (1 - fw), kRate = (8 * eEff * sig * Tw ** 3) / CAP; // linearised relaxation rate
          const tEnd = Math.min(20000, Math.max(300, Math.ceil(7 / kRate / 100) * 100));
          const ts = [0], Ts = [h0.y]; let T = h0.y;
          for (let i = 1; i <= 300; i++) { const h = tEnd / 300, k1 = rate(T), k2 = rate(T + (h / 2) * k1), k3 = rate(T + (h / 2) * k2), k4 = rate(T + h * k3); T += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4); ts.push(i * h); Ts.push(T); }
          R = { a, e, pass, absorbed, emitted, Teq, ts, Ts, emitW: emitted(Tw), tEnd };
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
          sB.tex('\\lambda_c', lamC, 1.13, { color: 'muted', size: 13, align: 'left', dx: 4 });
          sB.text('short', lamC, 1.13, { color: 'gold', size: 11, align: 'right', dx: -8, weight: 600 });
          sB.text('long', lamC, 1.05, { color: 'red', size: 11, align: 'left', dx: 30, weight: 600 });
          // ── relaxation
          const lo = Math.min(Tw, m.Teq, h0.y, ...m.Ts), hi = Math.max(Tw, m.Teq, h0.y, ...m.Ts), pad = Math.max(25, (hi - lo) * 0.18);
          sC.setView([-0.03 * m.tEnd, m.tEnd], [lo - pad, hi + pad]);
          sC.hline(Tw, { color: 'orange', dash: [6, 4], width: 1.5 });
          sC.text('walls', m.tEnd, Tw, { color: 'orange', size: 11, align: 'right', baseline: 'bottom', dy: -3, dx: -6 });
          if (Math.abs(dT) > 0.5) { sC.hline(m.Teq, { color: hot ? 'red' : 'blue', dash: [3, 3], width: 1.2 }); sC.text(`equilibrium ${v.fix(m.Teq, 1)} K`, m.tEnd, m.Teq, { color: hot ? 'red' : 'blue', size: 11, align: 'right', baseline: dT > 0 ? 'bottom' : 'top', dy: dT > 0 ? -3 : 3, dx: -6 }); }
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
          PL.forEach(([n, dd]) => { sA.dot(dd, Sd(dd), { color: n === 'Earth' ? 'blue' : 'muted', r: 4.5, label: n, labelPos: n === 'Neptune' ? 'nw' : 'ne', labelColor: n === 'Earth' ? 'blue' : 'muted', math: false, labelSize: 11 }); });
          if (2 * d < 50) {
            sA.line(d, S, d, S / 4, { color: 'orange', dash: [4, 3], width: 1.4 });
            sA.line(d, S / 4, 2 * d, S / 4, { color: 'orange', dash: [4, 3], width: 1.4 });
            sA.text('×2', Math.SQRT2 * d, S / 4, { color: 'orange', size: 11, align: 'center', baseline: 'top', dy: 4 });
            sA.text('÷4', d, S / 2, { color: 'orange', size: 11, align: 'right', dx: -6 });
          }
          sA.corner(`${v.fix(d, 3)} AU: S = ${v.fix(S, S < 10 ? 2 : 0)} W/m²`, 'tr', { color: 'gold', weight: 600 });
          // ── the planet
          const cx = 0.25, cy = 0.2, R = 0.78, g = Math.round(255 * Math.pow(Math.max(a, 0.005), 1 / 2.2));
          for (let k = -2.5; k <= 2.5; k++) {
            const y = cy + (k / 3.2) * R, xs = cx - Math.sqrt(R * R - (y - cy) ** 2);
            sB.arrow(-1.55, y, xs - 0.02, y, { color: 'gold', width: 2.2, head: 7 });
          }
          if (a > 0.02) for (let k = -2; k <= 2; k++) { // diffuse reflection, thickness ∝ albedo
            const ang = Math.PI - (k / 3.2) * 1.25, xs = cx + R * Math.cos(ang), ys = cy + R * Math.sin(ang), L = 0.42;
            sB.arrow(xs, ys, xs + Math.cos(ang) * L, ys + Math.sin(ang) * L, { color: 'gold', width: 0.5 + 3.5 * a, alpha: 0.6, head: 6, dash: [4, 3] });
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
          const lab = (str, xc, wide) => sB.text(str, xc, wide ? yb : yb - 0.2, { size: 10.5, align: 'center', color: 'ink', halo: !wide });
          if (a > 0.005) lab(`reflected ${v.fix((a * S) / 4, 0)}`, Math.max(x0 + 0.4, x0 + (w * a) / 2), a > 0.24);
          if (a < 0.995) lab(`absorbed ${v.fix(((1 - a) * S) / 4, 0)}`, Math.min(x1 - 0.4, xr + (x1 - xr) / 2), a < 0.76);
        });
        v.legend([['gold', String.raw`$S \propto 1/d^2$`], ['orange', 'doubling the distance', { dash: true }], ['faint', 'reflected', { dot: true }], ['gold', 'absorbed', { dot: true }]]);
        v.readout(() => {
          const d = hd.x, S = Sd(d), a = alb.value;
          return String.raw`$S = L_\odot/4\pi d^2$ = ${v.fix(S, 1)} W/m² at ${v.fix(d, 3)} AU · $S d^2$ = ${v.fix(S * d * d, 1)} W m⁻² AU² (the same everywhere) · reflected $\alpha S/4$ = ${v.fix((a * S) / 4, 1)} W/m², absorbed $S(1-\alpha)/4$ = ${v.fix(((1 - a) * S) / 4, 1)} W/m² · Earth's own orbit (eccentricity 0.0167) swings $S$ between ${v.fix(Sd(0.98329), 0)} W/m² in January and ${v.fix(Sd(1.01671), 0)} W/m² in July`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Model',
      name: 'Zero-dimensional energy balance and effective temperature',
      credit: 'Joseph Fourier, 1824 (planetary temperature as a radiative balance); Svante Arrhenius, 1896',
      statement: String.raw`Treat a planet as one body of uniform temperature $T$ in steady state. It absorbs $S(1-\alpha)/4$ per unit area of its surface (1.5) and emits $\sigma T^4$ (1.2); balance gives
$$\frac{S(1-\alpha)}{4} = \sigma T_e^4,\qquad T_e = \Big(\frac{S(1-\alpha)}{4\sigma}\Big)^{1/4}.$$
$T_e$ is the **effective (emission) temperature**: the temperature of the blackbody that radiates what the planet absorbs. For Earth ($S = 1361$ W m⁻², $\alpha = 0.30$) the absorbed flux is 238 W m⁻² and $T_e \approx 255$ K ($-18$ °C), **33 K colder than the observed global-mean surface temperature of 288 K**. The equilibrium is stable: a planet warmer than $T_e$ emits more than it absorbs and cools, a colder one warms. The 33 K gap is what the greenhouse effect must explain; equivalently, Earth radiates to space only about 61 % of $\sigma T_s^4$ (an *effective emissivity* $\varepsilon \approx 0.61$).`,
      scope: String.raw`Holds for global, annual means in steady state with no internal heat source (it fails for Jupiter, which radiates about 1.7 times the sunlight it absorbs). $T_e$ is the temperature at which the planet radiates to space; it equals the surface temperature only for an airless planet of uniform temperature (1.7).`,
      idea: String.raw`Over a year the planet's heat content barely changes, so absorbed and emitted power must match. Sunlight is intercepted by the shadow disc $\pi R^2$ but the planet radiates from its whole surface $4\pi R^2$ — the area integral of $\max(0,\cos Z)$ over the sphere is exactly $\pi R^2$, hence the factor 4. Because $\sigma T^4$ rises steeply, $T_e \propto [S(1-\alpha)]^{1/4}$ is insensitive: 1 % more sunlight raises $T_e$ by 0.25 %, about 0.64 K, and the restoring slope $4\sigma T_e^3 \approx 3.8$ W m⁻² K⁻¹ makes the equilibrium stable.`,
      caption: String.raw`Top left: the instantaneous sunlight on the globe, $S\max(0,\cos Z)$; drag the subsolar point anywhere and the area mean in the corner stays at a quarter of $S$. Top right: the planet catches a beam as wide as its disc but radiates from its whole sphere. Below: absorbed sunlight (gold) against emission (red), crossing at $T_e$; the purple band is the gap to Earth's observed 288 K. Drag the trial temperature along the red curve: below $T_e$ the planet gains energy and warms, above it loses energy and cools. Lower the emissivity to find the fraction of $\sigma T^4$ that Earth must send to space to sit at 288 K.`,
      deps: ['climate-1.2', 'climate-1.5', 'ode-1.7'],
      refs: ['Archer ch. 3', 'Pierrehumbert'],
      tags: ['energy balance', 'effective temperature'],
      viz(v) {
        const P = phys(v), M = v.M, sig = P.sigma, vec = (p) => v.geo('vec', p);
        const S = v.slider('solar constant $S$ (W/m²)', 500, 3000, 1361, { step: 1 });
        const alb = v.slider('albedo $\\alpha$', 0, 0.95, 0.3, { step: 0.01 });
        const eps = v.slider('effective emissivity $\\varepsilon$', 0.4, 1, 1, { step: 0.01 });
        const sA = v.stage({ height: 270, title: String.raw`sunlight $S\max(0,\cos Z)$ on the globe` });
        const sB = v.stage({ x: [-2.3, 2.3], y: [-1.4, 1.4], equal: true, axes: false, height: 270, title: String.raw`catches $\pi R^2$, radiates from $4\pi R^2$` });
        const sC = v.stage({ x: [150, 400], y: [0, 450], axes: 'box', height: 300, full: true, xlabel: 'T (K)', title: 'energy balance (W/m²)' });
        const G = v.globe(sA, { projection: 'orthographic', center: [30, 18], graticule: 30 });
        const sub = G.handle(-5, 14, { label: 'subsolar point', color: 'gold', labelPos: 'n' });
        const trial = sC.handle(215, 0, { color: 'accent', label: 'trial T', labelPos: 'nw', constrain: (x) => { const T = M.clamp(x, 152, 398); return [T, eps.value * sig * T ** 4]; } });
        const GRID = []; // unit vectors and weights of a 1° × 1° grid, for the sphere average
        for (let i = 0; i < 180; i++) { const f = -89.5 + i, w = Math.cos(f * D2R); for (let j = 0; j < 360; j++) GRID.push([...vec([-179.5 + j, f]), w]); }
        let mc = null, mk = '';
        const meanCos = () => {
          const k = `${sub.lon}|${sub.lat}`; if (k === mk) return mc; mk = k;
          const u = vec([sub.lon, sub.lat]); let num = 0, den = 0;
          for (const g of GRID) { num += Math.max(0, g[0] * u[0] + g[1] * u[1] + g[2] * u[2]) * g[3]; den += g[3]; }
          return (mc = num / den);
        };
        let R = null;
        v.render(() => {
          // ── globe
          const u = vec([sub.lon, sub.lat]);
          G.draw({ land: false, graticule: false });
          sA.raster((x, y) => {
            const q = G.invert(x, y); if (!q) return null;
            const w = vec(q), c = w[0] * u[0] + w[1] * u[1] + w[2] * u[2];
            return c <= 0 ? [10, 16, 44, 125] : [255, 186, 30, Math.round(35 + 185 * c)];
          }, { key: `${G.center}|${sub.lon}|${sub.lat}`, res: 2 });
          G.graticule(30);
          G.land(null, { fillAlpha: 0, color: 'ink', alpha: 0.45, width: 0.8 });
          G.smallCircle([sub.lon, sub.lat], 90, { color: 'ink', width: 1.1, dash: [4, 3], alpha: 0.6 });
          sA.corner(`area mean: ${v.fix(meanCos(), 4)} S`, 'bl', { color: 'gold', weight: 600 });
          // ── side view
          const Rr = 0.95, cx = 0.45;
          sB.rect(cx, -Rr, 2.3, Rr, { fill: 'ink', fillAlpha: 0.06, stroke: false });
          sB.text('shadow', 1.85, 0, { color: 'muted', size: 11, align: 'center' });
          for (let k = -4; k <= 4; k++) {
            const y = k * 0.265, hit = Math.abs(y) < Rr, xe = hit ? cx - Math.sqrt(Rr * Rr - y * y) : 2.25;
            sB.arrow(-2.25, y, xe - 0.03, y, { color: 'gold', width: 1.6, head: 6, alpha: hit ? 1 : 0.4 });
          }
          const disc = []; for (let i = 0; i <= 60; i++) { const t = (i / 60) * TAU; disc.push([-1.3 + 0.11 * Math.cos(t), Rr * Math.sin(t)]); }
          sB.poly(disc, { fill: 'gold', fillAlpha: 0.3, color: 'gold', width: 1.6 });
          sB.tex(String.raw`\pi R^2`, -1.3, Rr, { color: 'gold', baseline: 'bottom', dy: -4, size: 14 });
          sB.circle(cx, 0, Rr, { fill: 'blue', fillAlpha: 0.13, color: 'blue', width: 1.6 });
          for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU + 0.22; sB.arrow(cx + Rr * 1.05 * Math.cos(a), Rr * 1.05 * Math.sin(a), cx + Rr * 1.36 * Math.cos(a), Rr * 1.36 * Math.sin(a), { color: 'red', width: 1.5, head: 5 }); }
          sB.tex(String.raw`4\pi R^2`, cx, 0, { color: 'blue', size: 15 });
          // ── balance
          const ASR = (S.value * (1 - alb.value)) / 4, e = eps.value, Te = (ASR / sig) ** 0.25, Ts = (ASR / (e * sig)) ** 0.25;
          const ymax = Math.max(450, ASR * 1.5);
          sC.setView(null, [0, ymax]);
          if (Te < 288) { sC.vband(Te, 288, { color: 'purple', alpha: 0.12 }); sC.text(`gap ${v.fix(288 - Te, 1)} K`, (Te + 288) / 2, ymax * 0.93, { color: 'purple', size: 11.5, weight: 600, align: 'center' }); }
          sC.vline(288, { color: 'blue', dash: [5, 4], width: 1.4 });
          sC.text('observed Earth 288 K', 288, ymax * 0.35, { color: 'blue', size: 11, align: 'left', dx: 6 });
          sC.fn((T) => sig * T ** 4, { color: 'red', width: e < 1 ? 1.3 : 2.6, dash: e < 1 ? [5, 4] : null, alpha: e < 1 ? 0.6 : 1 });
          if (e < 1) sC.fn((T) => e * sig * T ** 4, { color: 'red', width: 2.6 });
          sC.hline(ASR, { color: 'gold', width: 2.6 });
          sC.tex(String.raw`\text{absorbed } S(1-\alpha)/4`, 152, ASR, { color: 'gold', align: 'left', baseline: 'bottom', dy: -4, size: 13 });
          const xr = Math.min(390, (ymax * 0.93 / (e * sig)) ** 0.25);
          sC.tex(e < 1 ? String.raw`\varepsilon\sigma T^4` : String.raw`\sigma T^4`, xr, e * sig * xr ** 4, { color: 'red', align: 'left', baseline: 'middle', dx: 12, size: 14 });
          const T = M.clamp(trial.x, 152, 398), O = e * sig * T ** 4, N = ASR - O; trial.y = O;
          if (Math.abs(N) > 1) {
            sC.line(T, O, T, ASR, { color: N > 0 ? 'green' : 'red', width: 3, alpha: 0.75 });
            sC.arrow(T, ymax * 0.07, T + Math.sign(N) * Math.min(28, 4 + Math.abs(N) / 6), ymax * 0.07, { color: N > 0 ? 'green' : 'red', width: 2.4, head: 8 });
            sC.text(N > 0 ? 'gains energy: warms' : 'loses energy: cools', T, ymax * 0.07, { color: N > 0 ? 'green' : 'red', size: 11, align: N > 0 ? 'right' : 'left', dx: N > 0 ? -6 : 6 });
          }
          if (Ts >= 150 && Ts <= 400) sC.dot(Ts, ASR, { color: 'green', r: 6.5, label: e < 1 ? `$T_s = ${v.fix(Ts, 1)}\\text{ K}$` : `$T_e = ${v.fix(Te, 1)}\\text{ K}$`, labelPos: 'se', labelColor: 'green' });
          R = { ASR, Te, Ts, e, T, N, epsNeed: ASR / (sig * 288 ** 4) };
        });
        v.legend([['gold', 'absorbed sunlight'], ['red', 'emitted infrared'], ['green', 'equilibrium', { dot: true }], ['purple', 'greenhouse gap to 288 K', { dot: true }]]);
        v.readout(() => {
          if (!R) return '';
          let s = String.raw`absorbed $S(1-\alpha)/4$ = ${v.fix(R.ASR, 1)} W/m² · $T_e = (S(1-\alpha)/4\sigma)^{1/4}$ = ${v.fix(R.Te, 1)} K (${v.fix(R.Te - 273.15, 1)} °C)`;
          if (R.e < 1) s += String.raw` · with $\varepsilon$ = ${v.fix(R.e, 2)} the surface sits at ${v.fix(R.Ts, 1)} K`;
          s += String.raw` · Earth at 288 K needs $\varepsilon$ = ${v.fix(R.epsNeed, 3)} · at the trial ${v.fix(R.T, 0)} K the net flux is ${v.fix(R.N, 1)} W/m² · restoring slope $4\varepsilon\sigma T_s^3$ = ${v.fix(4 * R.e * P.sigma * R.Ts ** 3, 2)} W m⁻² K⁻¹`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7',
      kind: 'Phenomenon',
      name: 'Effective versus surface temperatures of the planets',
      statement: String.raw`The zero-dimensional balance (1.6) predicts each body's effective temperature from its distance and albedo alone. Compared with measured mean surface temperatures it ranks the strength of their greenhouse effects:
- **Venus** $T_e \approx 229$ K, surface 737 K: about $+510$ K under 92 bar of CO₂;
- **Earth** 255 K against 288 K: $+33$ K;
- **Mars** 210 K against roughly 210–215 K (mean surface temperature is uncertain by several kelvin): a few kelvin from 6 mbar of CO₂;
- **Titan** 83 K against 94 K: about $+11$ K from 1.5 bar of nitrogen with methane.

Venus is hot although it absorbs *less* sunlight than Earth — its clouds reflect 76 % — and no albedo, not even zero, explains its surface by sunlight alone. An airless, slowly rotating body breaks the model the other way: the Moon's mean surface temperature (about 197 K, from Diviner-constrained thermal models) lies far *below* its $T_e = 270$ K, because a body with uneven temperature has $\langle T\rangle < \langle T^4\rangle^{1/4}$.`,
      idea: String.raw`$T_e$ follows from $S = S_\oplus/d^2$ and $\alpha$ (1.5, 1.6); the excess $T_s - T_e$ measures how far the atmosphere lifts the surface above the level that radiates to space, and it grows with the amount of infrared-absorbing gas (chapter 2). Without an atmosphere and without heat storage or transport, each patch balances its own sunlight: $T = T_{ss}\cos^{1/4}Z$ by day and nearly zero at night, where $T_{ss} = (S(1-\alpha)/\sigma)^{1/4}$. The power-mean inequality then gives $\langle T\rangle \le \langle T^4\rangle^{1/4} = T_e$, with equality only for a uniform temperature; the numerical sphere average is $\langle T\rangle = 0.400\,T_{ss} \approx 0.57\,T_e$.`,
      caption: String.raw`Each row compares the computed effective temperature (hollow dot) with the measured mean surface temperature (filled dot) and labels the difference; the small orange mark is the mean temperature the body would have with no atmosphere and no heat transport. Pick a body (or click its row) and change its albedo to test whether reflectivity alone could produce its surface temperature. The globe shows the selected body either at a uniform $T_e$ or in local radiative equilibrium; drag it to turn it.`,
      deps: ['climate-1.6', 'rca-3.3'],
      refs: ['Pierrehumbert'],
      tags: ['planets', 'greenhouse effect', 'effective temperature'],
      viz(v) {
        const P = phys(v), sig = P.sigma, vec = (p) => v.geo('vec', p);
        const B = [
          { id: 'venus', name: 'Venus', d: 0.723, alb: 0.76, Ts: 737, atm: '92 bar, 96 % CO₂, sulfuric-acid clouds' },
          { id: 'earth', name: 'Earth', d: 1, alb: 0.3, Ts: 288, atm: '1 bar N₂ and O₂ with H₂O and CO₂' },
          { id: 'mars', name: 'Mars', d: 1.524, alb: 0.25, Ts: 215, atm: '6 mbar CO₂ (mean surface temperature uncertain by several K)' },
          { id: 'titan', name: 'Titan', d: 9.58, alb: 0.265, Ts: 94, atm: '1.5 bar N₂ with methane and organic haze' },
          { id: 'moon', name: 'Moon', d: 1, alb: 0.11, Ts: 197, atm: 'none' },
        ];
        // sphere averages of max(0, cos Z) and max(0, cos Z)^{1/4}, by quadrature on a 1° grid
        let m1 = 0, mq = 0, wsum = 0;
        for (let i = 0; i < 180; i++) { const f = (-89.5 + i) * D2R, w = Math.cos(f); for (let j = 0; j < 360; j++) { const c = Math.max(0, Math.cos(f) * Math.cos((-179.5 + j) * D2R)); m1 += c * w; mq += Math.sqrt(Math.sqrt(c)) * w; wsum += w; } }
        m1 /= wsum; mq /= wsum;
        let alb = null, cur = 'venus';
        const body = v.select('', B.map((b) => ({ value: b.id, label: b.name })), 'venus', { onChange: (id) => { cur = id; alb.set(B.find((b) => b.id === id).alb); } });
        alb = v.slider('albedo of the selected body', 0, 0.95, 0.76, { step: 0.01 });
        const mode = v.select('globe', [{ value: 'u', label: 'uniform at $T_e$' }, { value: 'l', label: 'airless, no transport' }], 'l');
        const sA = v.stage({ x: [-175, 800], y: [-0.65, 4.65], axes: 'box', height: 330, weight: 1.4, xticks: [0, 100, 200, 300, 400, 500, 600, 700, 800], yticks: [], xlabel: 'temperature (K)' });
        const sB = v.stage({ height: 330, weight: 1 });
        const G = v.globe(sB, { projection: 'orthographic', center: [-40, 18], graticule: 30, land: false, zoom: 0.8 });
        sA.onClick((x, y) => { const i = Math.round(4 - y); if (i >= 0 && i < B.length) body.set(B[i].id), (cur = B[i].id), alb.set(B[i].alb); });
        const temps = (b, a) => { const S = P.S0 / (b.d * b.d), Te = ((S * (1 - a)) / (4 * sig)) ** 0.25, Tss = ((S * (1 - a)) / sig) ** 0.25; return { S, Te, Tss, Tloc: mq * Tss }; };
        let R = null;
        v.render(() => {
          cur = body.value;
          B.forEach((b, i) => {
            const y = 4 - i, sel = b.id === cur, t = temps(b, sel ? alb.value : b.alb), d = b.Ts - t.Te;
            if (sel) sA.hband(y - 0.45, y + 0.45, { color: 'accent', alpha: 0.09 });
            sA.text(b.name, -165, y, { color: sel ? 'accent' : 'ink', weight: sel ? 700 : 500, size: 12.5, align: 'left' });
            sA.line(t.Te, y, b.Ts, y, { color: d >= 0 ? 'red' : 'blue', width: 5, alpha: 0.45 });
            sA.dot(t.Tloc, y, { color: 'orange', r: 3.5 });
            sA.dot(t.Te, y, { color: 'accent', r: 6, hollow: true, width: 2.2 });
            sA.dot(b.Ts, y, { color: d >= 0 ? 'red' : 'blue', r: 6 });
            sA.text(`${d >= 0 ? '+' : '−'}${Math.round(Math.abs(d))} K`, (t.Te + b.Ts) / 2, y, { color: d >= 0 ? 'red' : 'blue', size: 11.5, weight: 600, align: 'center', baseline: 'bottom', dy: -9 });
          });
          // ── globe of the selected body
          const b = B.find((x) => x.id === cur), t = temps(b, alb.value), Tmax = t.Tss * 1.05;
          sB.setTitle(`${b.name}: ${mode.value === 'u' ? `uniform ${Math.round(t.Te)} K` : 'local radiative equilibrium, no atmosphere'}`);
          G.draw({ land: false, graticule: false, shade: false });
          const u = vec([0, 0]);
          sB.raster((x, y) => {
            const q = G.invert(x, y); if (!q) return null;
            const w = vec(q), c = Math.max(0, w[0] * u[0] + w[1] * u[1] + w[2] * u[2]);
            const T = mode.value === 'u' ? t.Te : t.Tss * Math.sqrt(Math.sqrt(c));
            return v.M.cmap(T / Tmax, 'magma');
          }, { key: `${G.center}|${cur}|${alb.value}|${mode.value}`, res: 2 });
          G.graticule(30, { color: 'faint', alpha: 0.5 });
          if (cur === 'earth') G.land(null, { fillAlpha: 0, color: 'faint', alpha: 0.8, width: 0.8 });
          G.dot([0, 0], { color: 'gold', r: 4 });
          sB.colorbar([0, Tmax], 'magma', { pos: 'right', label: 'K', length: 0.5 });
          R = { b, t, a: alb.value };
        });
        v.legend([['accent', 'effective temperature $T_e$ (computed)', { dot: true }], ['red', 'measured mean surface temperature', { dot: true }], ['orange', 'mean if airless, no heat transport', { dot: true }]]);
        v.readout(() => {
          if (!R) return '';
          const { b, t, a } = R, need = 1 - (4 * sig * b.Ts ** 4) / t.S;
          let s = String.raw`**${b.name}**: $S$ = ${v.fix(t.S, t.S < 100 ? 1 : 0)} W/m², $\alpha$ = ${v.fix(a, 2)} → $T_e$ = ${v.fix(t.Te, 1)} K; measured ${b.Ts} K → ${b.Ts >= t.Te ? 'greenhouse warming' : 'difference'} ${b.Ts >= t.Te ? '+' : '−'}${v.fix(Math.abs(b.Ts - t.Te), 0)} K · atmosphere: ${b.atm}`;
          if (b.id !== 'moon') s += need < 0 ? String.raw` · no albedo can do it: even $\alpha = 0$ gives only ${v.fix(((t.S / 4) / sig) ** 0.25, 0)} K` : String.raw` · sunlight alone would need $\alpha$ = ${v.fix(need, 3)}`;
          s += String.raw` · airless and without heat transport: $\langle T\rangle$ = ${v.fix(mq, 3)} $T_{ss}$ = ${v.fix(t.Tloc, 0)} K, while $\langle T^4\rangle^{1/4}$ = ${v.fix(Math.sqrt(Math.sqrt(m1)) * t.Tss, 1)} K = $T_e$`;
          if (b.id === 'moon') s += ' — the modelled ≈ 197 K lies between this no-storage limit and the uniform $T_e$, because the regolith stores a little daytime heat';
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8',
      kind: 'Phenomenon',
      name: 'Insolation by latitude and season',
      credit: 'Milutin Milanković, 1920 (insolation tables by latitude and season)',
      statement: String.raw`The daily-mean sunlight reaching the top of the atmosphere at latitude $\varphi$ is
$$\bar Q = \frac{S}{\pi}\Big(\frac{\bar d}{d}\Big)^2\big(h_0\sin\varphi\sin\delta + \cos\varphi\cos\delta\sin h_0\big),\qquad \cos h_0 = -\tan\varphi\tan\delta ,$$
where $\delta$ is the Sun's declination ($\sin\delta = \sin\varepsilon\,\sin\lambda_\odot$ for obliquity $\varepsilon$ and solar longitude $\lambda_\odot$), $h_0$ the hour angle of sunset ($h_0 = \pi$ in polar day, $0$ in polar night) and $(\bar d/d)^2$ the distance factor. Insolation therefore depends on latitude *and* season: with Earth's $\varepsilon = 23.44°$ the summer pole, lit for 24 hours, receives about 525 W m⁻² at the solstice — more than the equator (about 385 W m⁻²) — while the winter polar cap gets nothing. The annual mean still falls from about 416 W m⁻² at the equator to about 172 W m⁻² at the poles. With zero obliquity the seasons disappear (apart from the small distance effect) and the poles are dark all year.`,
      idea: String.raw`The flux on a horizontal surface is $S(\bar d/d)^2\cos Z$ with $\cos Z = \sin\varphi\sin\delta + \cos\varphi\cos\delta\cos h$ (spherical trigonometry on the globe, geog-1.2); averaging over the hours of daylight, $|h| < h_0$, gives the formula (energy-4.2). At the pole $\cos Z = \sin\delta$ all day, while the equator sees a higher noon Sun for only 12 hours. Integrated over the sphere, the insolation of any day is $S(\bar d/d)^2/4$ (1.5): tilt only moves sunlight between latitudes.`,
      caption: String.raw`The map shows daily-mean insolation for every latitude and day of the year, computed from the formula with Kepler's equation for the orbit; drag the cross to choose a day and latitude. The globe shows that day's lit hemisphere, the tropics and polar circles; the lower panel is the latitude profile on that day against the annual mean. Set the obliquity to zero and the seasons vanish; push it past 54° and the poles receive more sunlight than the equator over the year.`,
      deps: ['climate-1.5', 'energy-4.2', 'geog-1.2'],
      refs: ['Pierrehumbert'],
      tags: ['insolation', 'seasons', 'orbit'],
      viz(v) {
        const P = phys(v), M = v.M, S0 = P.S0;
        const obl = v.slider('obliquity $\\varepsilon$ (°)', 0, 90, 23.44, { step: 0.01, decimals: 2 });
        const ecc = v.slider('eccentricity $e$', 0, 0.1, 0.0167, { step: 0.0001, decimals: 4 });
        const MT = MDAYS.slice(0, 12).map((d, i) => [d + 15, MONTHS[i][0]]);
        const LT = [-90, -60, -30, 0, 30, 60, 90].map((f) => [f, f === 0 ? '0°' : `${Math.abs(f)}°${f > 0 ? 'N' : 'S'}`]);
        const sA = v.stage({ height: 300, weight: 0.8 });
        const sB = v.stage({ x: [-40, 432], y: [-106, 92], axes: 'box', height: 300, weight: 1.2, xticks: MT, yticks: LT, title: 'daily-mean insolation by latitude and day of year' });
        const sC = v.stage({ x: [-93, 93], y: [-60, 640], axes: 'box', height: 210, full: true, xticks: LT, yticks: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600], title: 'latitude profile (W/m²)' });
        const G = v.globe(sA, { projection: 'orthographic', center: [50, 22], graticule: 30 });
        const pick = sB.handle(172, 45, { color: 'accent', constrain: (x, y) => [M.clamp(x, 0, 364), M.clamp(y, -89, 89)] });
        let cache = null, ck = '';
        const tables = () => {
          const k = `${obl.value}|${ecc.value}`; if (k === ck) return cache; ck = k;
          const days = M.range(366).map((d) => { const o = orbitPos(d, ecc.value); return { dec: declination(obl.value, o.lon), fac: o.fac }; });
          const lats = M.range(181).map((i) => -90 + i), ann = lats.map((f) => M.mean(days.slice(0, 365).map((d) => dailyQ(S0, f, d.dec, d.fac))));
          const xs = M.range(74).map((i) => Math.min(365, i * 5)), ys = M.range(37).map((j) => -90 + 5 * j);
          const F = ys.map((f) => xs.map((d) => dailyQ(S0, f, days[d].dec, days[d].fac)));
          const qmax = Math.max(...F.map((r) => Math.max(...r)));
          return (cache = { days, lats, ann, xs, ys, F, hi: Math.max(600, Math.ceil(qmax / 100) * 100) });
        };
        let R = null;
        v.render(() => {
          const T = tables(), day = pick.x, lat = pick.y, o = orbitPos(day, ecc.value), dec = declination(obl.value, o.lon), dd = dec / D2R;
          const Q = (f) => dailyQ(S0, f, dec, o.fac);
          // ── map
          sB.heat((x, y) => { if (x < 0 || x > 365 || Math.abs(y) > 90) return NaN; const p = orbitPos(x, ecc.value); return dailyQ(S0, y, declination(obl.value, p.lon), p.fac); }, { range: [0, T.hi], cmap: 'magma', key: `${obl.value}|${ecc.value}|${T.hi}`, res: 3 });
          for (let L = 100; L < T.hi; L += 100) sB.path(isoSegments(T.F, T.xs, T.ys, L), { color: [255, 255, 255], alpha: L % 200 ? 0.22 : 0.45, width: 1 });
          if (obl.value > 2) { sB.text('polar night', 172, -84, { color: [235, 235, 235], halo: false, size: 10.5, align: 'center' }); sB.text('polar night', 355, 84, { color: [235, 235, 235], halo: false, size: 10.5, align: 'right' }); }
          sB.line(day, -90, day, 90, { color: [255, 255, 255], width: 1, alpha: 0.6, dash: [4, 3] });
          sB.line(0, lat, 365, lat, { color: [255, 255, 255], width: 1, alpha: 0.6, dash: [4, 3] });
          sB.colorbar([0, T.hi], 'magma', { pos: 'right', label: 'W/m²', length: 0.72 });
          // ── globe on that day (subsolar point at longitude 0)
          G.draw();
          G.smallCircle([180, -dd], 89.9, { fill: [8, 12, 34], fillAlpha: 0.55, color: 'muted', alpha: 0.7, width: 1 }); // night side
          const par = (f) => M.range(181).map((i) => [-180 + 2 * i, f]);
          const e = obl.value;
          if (e > 0.5 && e < 89.5) { for (const f of [e, -e]) G.path(par(f), { geodesic: false, color: 'orange', width: 1.3, dash: [5, 4] }); for (const f of [90 - e, e - 90]) G.path(par(f), { geodesic: false, color: 'teal', width: 1.3, dash: [5, 4] }); }
          G.path(par(lat), { geodesic: false, color: 'accent', width: 2.4 });
          G.dot([0, dd], { color: 'gold', r: 6, label: 'Sun overhead', labelPos: 'e', labelColor: 'gold', math: false });
          sA.setTitle(`${dateLabel(day)}: Sun overhead at ${v.fix(Math.abs(dd), 1)}°${dd >= 0 ? 'N' : 'S'}`);
          // ── profile
          const top = Math.max(640, T.hi * 1.06);
          sC.setView(null, [-top * 0.09, top]);
          sC.hline(0, { color: 'faint' });
          sC.path(T.lats.map((f, i) => [f, T.ann[i]]), { color: 'muted', width: 1.8, dash: [6, 4] });
          sC.fn(Q, { color: 'accent', width: 2.6, fill: 'accent', fillAlpha: 0.14, domain: [-90, 90], n: 361 });
          for (const f of [-90, 0, 90]) sC.dot(f, Q(f), { color: 'accent', r: 4.5, label: `${Math.round(Q(f))}`, labelPos: f < 0 ? 'ne' : f > 0 ? 'nw' : 'n', labelColor: 'accent', math: false, labelSize: 11 });
          sC.vline(lat, { color: 'accent', dash: [3, 3], alpha: 0.6 });
          const gm = 0.5 * simpson((u) => Q(u / D2R) * Math.cos(u), -Math.PI / 2, Math.PI / 2, 360);
          const h0 = sunsetAngle(lat, dec);
          R = { day, lat, dd, q: Q(lat), np: Q(90), sp: Q(-90), eq: Q(0), len: (24 * h0) / Math.PI, gm, exp: (S0 * o.fac) / 4, annEq: T.ann[90], annNP: T.ann[180] };
        });
        v.legend([['accent', 'on the chosen day'], ['muted', 'annual mean', { dash: true }], ['orange', 'tropics (±ε)', { dash: true }], ['teal', 'polar circles (±(90° − ε))', { dash: true }], ['gold', 'subsolar point', { dot: true }]]);
        v.readout(() => {
          if (!R) return '';
          const L = (f) => `${Math.abs(Math.round(f))}°${f >= 0 ? 'N' : 'S'}`;
          const dl = R.len >= 23.995 ? 'polar day (24 h)' : R.len <= 0.005 ? 'polar night' : `${v.fix(R.len, 1)} h of daylight`;
          return String.raw`${dateLabel(R.day)}, declination $\delta$ = ${v.fix(R.dd, 2)}° · at ${L(R.lat)}: ${dl}, $\bar Q$ = ${v.fix(R.q, 1)} W/m² · North Pole ${v.fix(R.np, 0)}, equator ${v.fix(R.eq, 0)}, South Pole ${v.fix(R.sp, 0)} W/m² · area-weighted mean over all latitudes ${v.fix(R.gm, 2)} W/m² = $S(\bar d/d)^2/4$ = ${v.fix(R.exp, 2)} W/m² · annual mean: equator ${v.fix(R.annEq, 0)}, North Pole ${v.fix(R.annNP, 0)} W/m²`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.9
    {
      num: '1.9',
      kind: 'Phenomenon',
      name: 'Thermal inertia and the seasonal lag',
      statement: String.raw`A surface layer of heat capacity $C$ per unit area (water-equivalent depth $h$, $C = \rho c_p h$) forced by the seasonal cycle of absorbed sunlight $F(t)$ and losing heat at a rate $B\,T'$ for a temperature anomaly $T'$ obeys
$$C\,\frac{dT'}{dt} = F'(t) - B\,T' .$$
For a sinusoidal forcing of angular frequency $\omega = 2\pi/\text{year}$ the response lags the forcing by $\Delta t = \arctan(\omega C/B)/\omega$ and its amplitude is reduced by $1/\sqrt{B^2+\omega^2C^2}$. A thin layer (land, $h$ of a few metres including the air above) follows the Sun within about a month and swings widely; a deep ocean mixed layer lags by two to three months — never more than a quarter year — and swings little. This is the contrast between continental and maritime climates: midsummer comes weeks after the solstice, later still by the sea.`,
      scope: String.raw`A linear slab model: it assumes a well-mixed layer of fixed depth and a linear loss $B\,T'$ standing for outgoing radiation plus heat carried away by the atmosphere (a few W m⁻² K⁻¹); real mixed layers deepen in winter and continents exchange heat with the oceans.`,
      idea: String.raw`It is a first-order linear system (sig-6.8) with time constant $\tau = C/B$, driven by the seasonal insolation of 1.8. When $\omega\tau \ll 1$ the layer stays in near-equilibrium, $T' \approx F'/B$, and follows the forcing; when $\omega\tau \gg 1$ the layer integrates the forcing, $T' \approx \int F'\,dt/C$, which turns a cosine into a sine — a quarter-period lag — and divides the amplitude by $\omega C$. The heat capacity of 50 m of water is that of the whole atmosphere about 20 times over.`,
      caption: String.raw`The top panel is the seasonal anomaly of absorbed sunlight at the chosen latitude, from the insolation formula of 1.8; below, the exactly periodic temperature response of a slab of the chosen depth (solid) beside land and deep-ocean references (dashed). The arrow marks the lag from peak sunshine to peak temperature. The right panel plots the predicted lag against depth with the measured one from the simulation (gold).`,
      deps: ['climate-1.6', 'climate-1.8', 'sig-3.10'],
      refs: ['Pierrehumbert'],
      tags: ['heat capacity', 'seasons', 'ocean'],
      viz(v) {
        const P = phys(v), M = v.M, S0 = P.S0, YR = 365.2422, DAY = 86400, w = TAU / (YR * DAY), ALB = 0.3, RHOC = 1025 * 3990;
        let hS = null;
        v.select('', [{ value: 2.5, label: 'land + air (2.5 m)' }, { value: 50, label: 'ocean mixed layer (50 m)' }, { value: 200, label: 'deep mixing (200 m)' }], 10, { onChange: (x) => hS.set(x) });
        hS = logSlider(v, 'water-equivalent depth $h$ (m)', 0.5, 500, 10, { round: (x) => (x < 10 ? Math.round(x * 10) / 10 : Math.round(x)) });
        const lat = v.slider('latitude (°N)', 15, 85, 45, { step: 1 });
        const Bs = v.slider('damping $B$ (W m⁻² K⁻¹)', 1, 10, 4, { step: 0.1 });
        const TK = [0, 90, 181, 273, 365, 455, 546, 638, 730].map((d) => [d, dateLabel(d).replace(/^\d+ /, '1 ')]);
        const sF = v.stage({ x: [0, 730], y: [-150, 150], axes: 'box', height: 150, full: true, xticks: TK, title: 'seasonal anomaly of absorbed sunlight $(1-\\alpha)\\,\\bar Q\'$ (W/m²)' });
        const sT = v.stage({ x: [0, 730], y: [-30, 30], axes: 'box', height: 260, weight: 1.65, xticks: TK, title: 'temperature anomaly $T\'$ (K)' });
        const sL = v.stage({ x: [0.5, 500], y: [0, 100], xlog: true, axes: 'box', height: 260, weight: 1, xlabel: 'h (m)', title: 'lag of peak temperature (days)' });
        const N = 730, dt = (YR * DAY) / N; // half-day steps
        let fk = '', forcing = null;
        const getForcing = () => { // F'(t) at the 2N + 1 half-step points of one year
          const k = `${lat.value}`; if (k === fk) return forcing; fk = k;
          const q = M.range(2 * N + 1).map((i) => { const day = (i / (2 * N)) * YR, o = orbitPos(day, 0.0167); return (1 - ALB) * dailyQ(S0, lat.value, declination(23.44, o.lon), o.fac); });
          const mean = M.mean(q.slice(0, 2 * N));
          return (forcing = q.map((x) => x - mean));
        };
        const harm = (xs) => { let a = 0, b = 0; xs.forEach((x, k) => { const ph = (TAU * k) / xs.length; a += x * Math.cos(ph); b += x * Math.sin(ph); }); return { amp: (2 * Math.hypot(a, b)) / xs.length, ph: Math.atan2(b, a) }; };
        const memo = new Map();
        const sim = (h) => {
          const F = getForcing(), B = Bs.value, key = `${h}|${B}|${fk}`; if (memo.has(key)) return memo.get(key);
          const C = RHOC * h, f = (i, T) => (F[i] - B * T) / C;
          const run = (T0, drive) => { const out = [T0]; let T = T0; for (let k = 0; k < N; k++) { const i = 2 * k, g = (j, x) => (drive ? f(j, x) : (-B * x) / C); const k1 = g(i, T), k2 = g(i + 1, T + (dt / 2) * k1), k3 = g(i + 1, T + (dt / 2) * k2), k4 = g(i + 2, T + dt * k3); T += (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4); out.push(T); } return out; };
          const part = run(0, true), gain = run(1, false)[N], T0 = part[N] / (1 - gain), Ts = run(T0, true).slice(0, N); // exactly periodic
          const Fh = harm(F.filter((_, i) => i % 2 === 0).slice(0, N)), Th = harm(Ts);
          let lag = ((Th.ph - Fh.ph) / TAU) * YR; lag = ((lag % YR) + YR) % YR; if (lag > YR / 2) lag -= YR;
          const pk = (xs) => { let m = 0; xs.forEach((x, k) => { if (x > xs[m]) m = k; }); return (m * YR) / N; };
          const r = { Ts, lag, amp: Th.amp, famp: Fh.amp, peakT: pk(Ts), peakF: pk(F.filter((_, i) => i % 2 === 0).slice(0, N)), C };
          memo.set(key, r); if (memo.size > 60) memo.delete(memo.keys().next().value);
          return r;
        };
        let R = null;
        v.render(() => {
          const h = hS.value, B = Bs.value, F = getForcing(), S = sim(h), land = sim(2.5), deep = sim(200);
          const yrs = (arr, step) => { const pts = []; for (let c = 0; c < 2; c++) arr.forEach((x, k) => pts.push([c * YR + k * step, x])); return pts; };
          const Fd = F.filter((_, i) => i % 2 === 0).slice(0, N), fmax = Math.max(...Fd.map(Math.abs));
          sF.setView(null, [-fmax * 1.25, fmax * 1.25]);
          sF.hline(0, { color: 'faint' });
          sF.path(yrs(Fd, YR / N), { color: 'gold', width: 2.3, fill: 'gold', fillAlpha: 0.12 });
          const tmax = Math.max(...[S, land, deep].flatMap((r) => r.Ts.map(Math.abs)));
          sT.setView(null, [-tmax * 1.3, tmax * 1.3]);
          sT.hline(0, { color: 'faint' });
          sT.path(yrs(land.Ts, YR / N), { color: 'orange', width: 1.5, dash: [6, 4] });
          sT.path(yrs(deep.Ts, YR / N), { color: 'purple', width: 1.5, dash: [6, 4] });
          sT.path(yrs(S.Ts, YR / N), { color: 'accent', width: 2.8 });
          const pF = S.peakF + YR, pT = S.peakT + (S.peakT < S.peakF ? 2 * YR : YR);
          for (const st of [sF, sT]) st.vline(pF, { color: 'gold', dash: [4, 3], width: 1.3 });
          sT.vline(pT, { color: 'accent', dash: [4, 3], width: 1.3 });
          const ya = tmax * 1.12;
          if (pT - pF > 3) sT.arrow(pF, ya, pT, ya, { color: 'green', width: 2, head: 7 });
          sT.text(`lag ${Math.round(pT - pF)} days`, (pF + pT) / 2, ya, { color: 'green', weight: 600, size: 11.5, align: 'center', baseline: 'bottom', dy: -4 });
          sF.text('peak sunshine', pF, fmax * 1.12, { color: 'gold', size: 10.5, align: 'left', dx: 5 });
          sT.text('peak temperature', pT, -tmax * 1.02, { color: 'accent', size: 10.5, align: pT > 560 ? 'right' : 'left', dx: pT > 560 ? -5 : 5 });
          // ── lag against depth
          sL.hline((YR / 4), { color: 'muted', dash: [5, 4] });
          sL.text('quarter year', 0.6, YR / 4, { color: 'muted', size: 10.5, align: 'left', baseline: 'bottom', dy: -3 });
          sL.fn((x) => (Math.atan((w * RHOC * x) / B) / w) / DAY, { color: 'green', width: 2.4 });
          sL.dot(2.5, land.lag, { color: 'orange', r: 4 }); sL.dot(200, deep.lag, { color: 'purple', r: 4 });
          sL.dot(h, S.lag, { color: 'gold', r: 6.5 });
          R = { h, B, S, pred: (Math.atan((w * S.C) / B) / w) / DAY, ampPred: S.famp / Math.hypot(B, w * S.C), land, deep, peakDiff: pT - pF };
        });
        v.legend([['gold', 'sunlight anomaly'], ['accent', 'slab of depth $h$'], ['orange', 'land + air, 2.5 m', { dash: true }], ['purple', 'deep mixing, 200 m', { dash: true }], ['green', 'predicted lag $\\arctan(\\omega C/B)/\\omega$']]);
        v.readout(() => {
          if (!R) return '';
          return String.raw`$h$ = ${v.fix(R.h, R.h < 10 ? 1 : 0)} m: $C$ = ${v.M.si(R.S.C, 'J m⁻² K⁻¹', 3)}, time constant $C/B$ = ${v.fix(R.S.C / R.B / 86400, 1)} days · lag of the annual harmonic: simulated ${v.fix(R.S.lag, 1)} days, predicted ${v.fix(R.pred, 1)} days (peak to peak ${Math.round(R.peakDiff)} days) · amplitude: simulated ${v.fix(R.S.amp, 2)} K, predicted $|F_1|/\sqrt{B^2+\omega^2C^2}$ = ${v.fix(R.ampPred, 2)} K · land ${v.fix(R.land.amp, 1)} K and ${v.fix(R.land.lag, 0)} days, deep ocean ${v.fix(R.deep.amp, 1)} K and ${v.fix(R.deep.lag, 0)} days`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.10
    {
      num: '1.10',
      kind: 'Paradox',
      name: 'The faint young Sun paradox',
      credit: 'Carl Sagan & George Mullen, 1972',
      statement: String.raw`Stellar-evolution models agree that the Sun brightens as hydrogen in its core turns to helium: about 4 billion years ago it shone at roughly 70–75 % of today's luminosity (Gough's fit $L(t)/L_0 = [1 + \tfrac25(1 - t/t_\odot)]^{-1}$, $t_\odot = 4.57$ Gyr). With today's albedo and today's greenhouse effect the energy balance (1.6) then puts Earth's mean surface temperature below freezing for its first two billion years. Yet the geological record shows liquid water almost throughout: water-altered zircons by 4.4 billion years ago, water-laid sediments by 3.8, stromatolites by 3.5, and only a few glaciations. The resolution must be a stronger early greenhouse (more CO₂, methane), a darker early Earth, or both — and the ice–albedo feedback makes the problem sharper, since a frozen Earth reflects so much sunlight that it would stay frozen even under today's Sun.`,
      idea: String.raw`In the zero-dimensional model with a fixed effective emissivity, $T_s \propto [S(1-\alpha)]^{1/4}$ (1.6), so 25 % less sunlight lowers the temperature by a factor $0.75^{1/4} \approx 0.93$, about 20 K — enough to freeze a planet that today sits 15 K above freezing. Keeping 288 K at 4 Ga requires about 60–70 W m⁻² of extra greenhouse forcing, some 16 times the forcing of doubling CO₂ today. The carbonate–silicate weathering cycle, which draws CO₂ down faster when the climate is warm, is the favoured thermostat that lowered the greenhouse as the Sun brightened.`,
      caption: String.raw`The top panel is the Sun's brightening; below, the global surface temperature that today's greenhouse would give (red, dashed) and that of your early Earth (blue). Add an early greenhouse forcing or darken the early surface — both fade linearly to today's values — and drag the epoch marker to read off the forcing needed. Switch on the ice–albedo feedback: once frozen, the planet stays frozen until the forcing is large enough to melt a white Earth. Green marks are evidence of liquid water, blue bars known glaciations.`,
      deps: ['climate-1.6'],
      refs: ['Pierrehumbert'],
      tags: ['paleoclimate', 'solar luminosity'],
      viz(v) {
        const P = phys(v), M = v.M, sig = P.sigma, S0 = P.S0, TSUN = 4.57, A0 = 0.3, AICE = 0.62;
        const eps0 = (S0 * (1 - A0)) / 4 / (sig * 288 ** 4); // today's effective emissivity
        const Lr = (g) => 1 / (1 + 0.4 * (1 - (TSUN - g) / TSUN)); // g = billions of years ago
        const dF = v.slider('extra greenhouse forcing at 4 Ga (W/m²)', 0, 100, 30, { step: 0.5 });
        const aA = v.slider('albedo at 4 Ga', 0.15, 0.45, 0.3, { step: 0.005 });
        const ice = v.toggle('ice–albedo feedback (frozen Earth: α = 0.62)', false);
        const XT = [[-4.5, '4.5'], [-4, '4'], [-3.5, '3.5'], [-3, '3'], [-2.5, '2.5'], [-2, '2'], [-1.5, '1.5'], [-1, '1'], [-0.5, '0.5'], [0, 'now']];
        const sL = v.stage({ x: [-4.62, 0.08], y: [0.61, 1.04], axes: 'box', height: 120, full: true, xticks: XT, yticks: [0.7, 0.8, 0.9, 1], title: 'solar luminosity $L/L_0$' });
        const sT = v.stage({ x: [-4.62, 0.08], y: [185, 350], axes: 'box', height: 330, full: true, xticks: XT, xlabel: 'billions of years ago', title: 'global mean surface temperature (K)' });
        const model = (F0, aEarly, withIce) => {
          const pts = [], n = 900; let frozen = null;
          for (let i = 0; i <= n; i++) {
            const g = 4.5 * (1 - i / n), sF = g / 4, S = S0 * Lr(g), a = A0 + (aEarly - A0) * sF;
            const Tw = (((S * (1 - a)) / 4 + F0 * sF) / (eps0 * sig)) ** 0.25, Ti = (((S * (1 - AICE)) / 4 + F0 * sF) / (eps0 * sig)) ** 0.25;
            if (!withIce) { pts.push([-g, Tw]); continue; }
            if (frozen === null) frozen = Tw < 273.15;
            else if (frozen && Ti >= 273.15) frozen = false;
            else if (!frozen && Tw < 273.15) frozen = true;
            pts.push([-g, frozen ? Ti : Tw]);
          }
          return pts;
        };
        const at = (pts, x) => { const i = M.clamp(Math.round(((x + 4.5) / 4.5) * 900), 0, 900); return pts[i][1]; };
        let cur = null;
        const ep = sT.handle(-3.8, 260, { color: 'accent', label: 'epoch', labelPos: 'ne', constrain: (x) => { const xx = M.clamp(x, -4.5, 0); return [xx, cur ? at(cur, xx) : 260]; } });
        const WATER = [[4.4, 'zircons', 1], [3.8, 'sediments', 0], [3.5, 'stromatolites', 1]], GLAC = [[2.95, 2.9, 'Pongola'], [2.45, 2.22, 'Huronian'], [0.72, 0.635, 'Snowball']];
        let R = null;
        v.render(() => {
          const ref = model(0, A0, ice.value), mine = model(dF.value, aA.value, ice.value); cur = mine;
          // ── luminosity
          sL.fn((x) => Lr(-x), { color: 'gold', width: 2.6, domain: [-4.5, 0] });
          sL.vline(ep.x, { color: 'accent', dash: [3, 3], alpha: 0.7 });
          sL.dot(ep.x, Lr(-ep.x), { color: 'accent', r: 4.5 });
          // ── temperature
          sT.hband(185, 273.15, { color: 'blue', alpha: 0.07 });
          sT.hline(273.15, { color: 'blue', width: 1.4 });
          sT.text('water freezes (273 K)', -1.3, 273.15, { color: 'blue', size: 11, align: 'left', baseline: 'top', dy: 4 });
          sT.hline(288, { color: 'muted', width: 1, dash: [2, 4] });
          sT.text('today 288 K', 0.05, 288, { color: 'muted', size: 10.5, align: 'right', baseline: 'bottom', dy: -3 });
          for (const [g, name, row] of WATER) { const y = row ? 341 : 332; sT.dot(-g, y, { color: 'green', r: 4.5 }); sT.text(`${name} ${g}`, -g, y, { color: 'green', size: 10.5, align: 'left', dx: 7 }); }
          for (const [g0, g1, name] of GLAC) { sT.rect(-g0, 207, -g1, 215, { fill: 'blue', fillAlpha: 0.6, stroke: false }); sT.text(name, (-g0 - g1) / 2, 215, { color: 'blue', size: 10.5, align: 'center', baseline: 'bottom', dy: -2 }); }
          sT.path(ref, { color: 'red', width: 2, dash: [7, 5] });
          sT.path(mine, { color: 'accent', width: 2.8 });
          const x = ep.x, g = -x, T = at(mine, x); ep.y = T;
          sT.vline(x, { color: 'accent', dash: [3, 3], alpha: 0.5 });
          const S = S0 * Lr(g), sF = g / 4, a = A0 + (aA.value - A0) * sF, need = (Tt) => eps0 * sig * Tt ** 4 - (S * (1 - a)) / 4;
          R = { g, L: Lr(g), S, Tref: at(ref, x), T, n273: need(273.15), n288: need(288), F: dF.value * sF };
        });
        v.legend([['gold', 'luminosity'], ['red', "today's greenhouse and albedo", { dash: true }], ['accent', 'with your early greenhouse / albedo'], ['green', 'liquid-water evidence', { dot: true }], ['blue', 'glaciations', { dot: true }]]);
        v.readout(() => {
          if (!R) return '';
          const f = (x) => v.fix(x, 1);
          return String.raw`${v.fix(R.g, 2)} billion years ago: $L$ = ${v.fix(R.L, 3)} $L_0$, $S$ = ${v.fix(R.S, 0)} W/m² · today's greenhouse gives ${f(R.Tref)} K${R.Tref < 273.15 ? ' (frozen)' : ''}, your model ${f(R.T)} K${R.T < 273.15 ? ' (frozen)' : ''} with ${f(R.F)} W/m² of extra forcing · to reach 273 K the early Earth needs ${f(Math.max(0, R.n273))} W/m², to reach 288 K ${f(Math.max(0, R.n288))} W/m² of extra greenhouse forcing at this albedo — doubling CO₂ today gives about 3.9 W/m²`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.11
    {
      num: '1.11',
      kind: 'Phenomenon',
      name: 'Scattering of sunlight: Rayleigh and Mie',
      credit: 'Lord Rayleigh, 1871 (small particles); Gustav Mie, 1908 (spheres of any size)',
      statement: String.raw`How strongly a particle of radius $r$ scatters light of wavelength $\lambda$ depends on the size parameter $x = 2\pi r/\lambda$. For $x \ll 1$ (air molecules, the smallest aerosols) the scattering efficiency follows Rayleigh's law
$$Q_{\rm sca} = \frac83\,x^4\left|\frac{m^2-1}{m^2+2}\right|^2 \propto \lambda^{-4},$$
so blue light (0.45 µm) is scattered about 4.4 times more than red (0.65 µm), symmetrically forwards and backwards: the sky is blue and the setting Sun red. When $x \gtrsim 1$ (haze, sulfate aerosol, cloud droplets) Mie's exact solution for a sphere applies: $Q_{\rm sca}$ oscillates about and tends to 2, nearly independent of wavelength — clouds are white — and the light goes mostly forward. The fraction scattered back to space feeds the planetary albedo (1.5); per unit mass, particles of a few tenths of a micron scatter sunlight most efficiently, which is why sulfate aerosols cool the climate.`,
      idea: String.raw`A particle much smaller than the wavelength sees a uniform oscillating field and becomes a tiny dipole whose induced moment is proportional to its volume; a dipole radiates power $\propto \omega^4 p^2$ (em-12.10), giving $\lambda^{-4}$ and the $(1+\cos^2\theta)$ angular pattern. For larger spheres Mie expanded the incident wave in vector spherical harmonics; the coefficients $a_n, b_n$ computed here by the Bohren–Huffman recurrences contain the resonances that make $Q_{\rm sca}$ ripple and the diffraction peak that sends light forward. At large $x$, $Q_{\rm sca}\to 2$: a particle removes twice its geometric cross-section from the beam, half of it by diffraction.`,
      caption: String.raw`Choose a particle size: the left panel shows the Mie scattering efficiency against size parameter on log–log axes, with the Rayleigh law (slope 4) dashed and the blue and red ends of the spectrum marked for this particle. The polar plot is the angular pattern at 550 nm on a logarithmic radial scale (one ring per decade), averaged over a spread of radii of about ±10 %, with sunlight coming from the left. The swatches give the colour of the scattered light and of sunlight transmitted through a layer of the chosen optical depth.`,
      deps: ['em-12.10', 'climate-1.5'],
      refs: ['Pierrehumbert'],
      tags: ['scattering', 'aerosols', 'albedo'],
      viz(v) {
        const P = phys(v), M = v.M;
        let rS = null;
        v.select('', [{ value: 0.0002, label: 'air molecule' }, { value: 0.05, label: 'smoke' }, { value: 0.25, label: 'sulfate haze' }, { value: 1, label: 'dust' }, { value: 10, label: 'cloud droplet' }], 0.25, { onChange: (x) => rS.set(x) });
        rS = logSlider(v, 'particle radius $r$', 0.0002, 20, 0.25, { round: (x) => Number(x.toPrecision(2)), fmt: (x) => (x < 0.01 ? `${v.fix(x * 1000, 1)} nm` : `${x} µm`) });
        const mS = v.select('refractive index', [{ value: 1.33, label: 'water 1.33' }, { value: 1.43, label: 'sulfate 1.43' }, { value: 1.53, label: 'mineral 1.53' }], 1.43);
        const tau = v.slider('optical depth of the layer at 550 nm', 0, 6, 2, { step: 0.05 });
        const sA = v.stage({ x: [1e-3, 400], y: [1e-13, 20], xlog: true, ylog: true, axes: 'box', height: 330, weight: 1.25, xlabel: 'x = 2πr/λ', title: 'scattering efficiency $Q_{\\rm sca}$' });
        const sB = v.stage({ x: [-1.3, 1.3], y: [-1.22, 1.22], equal: true, axes: false, height: 330, title: 'angular pattern at 550 nm (log scale)' });
        let ck = '', curve = null, pk = '', pol = null; const qmemo = new Map();
        // angular pattern at 550 nm, averaged over a narrow spread of radii (±15 %) as in any real population of particles
        const NA = 721, TH = Array.from({ length: NA }, (_, i) => (Math.PI * i) / (NA - 1));
        const pattern = (r, m) => {
          const k = `${r}|${m}`; if (k === pk) return pol; pk = k;
          const I = new Float64Array(NA);
          for (let j = -6; j <= 6; j++) { const f = 1 + 0.025 * j, wt = Math.exp(-0.5 * (j / 4) ** 2), mr = mie((TAU * r * f) / 0.55, m); for (let i = 0; i < NA; i++) I[i] += wt * mieIntensity(mr, Math.cos(TH[i])); }
          return (pol = I);
        };
        const Qcurve = (m) => { if (ck === String(m)) return curve; ck = String(m); const xs = M.range(361).map((i) => 1e-3 * (4e5) ** (i / 360)); return (curve = xs.map((x) => [x, mie(x, m).qsca])); };
        const Qat = (r, lam, m) => { const k = `${r}|${lam}|${m}`; if (!qmemo.has(k)) { qmemo.set(k, mie((TAU * r) / lam, m).qsca); if (qmemo.size > 4000) qmemo.clear(); } return qmemo.get(k); };
        let R = null;
        v.render(() => {
          const r = rS.value, m = mS.value, K = ((m * m - 1) / (m * m + 2)) ** 2;
          // ── efficiency curve
          sA.fn((x) => (8 / 3) * x ** 4 * K, { color: 'muted', width: 1.4, dash: [6, 4] });
          sA.hline(2, { color: 'faint', dash: [3, 4] });
          sA.text('geometric limit Q = 2', 1e-3, 2, { color: 'muted', size: 10.5, align: 'left', baseline: 'bottom', dx: 6, dy: -3 });
          sA.path(Qcurve(m), { color: 'accent', width: 2.4 });
          const xb = (TAU * r) / 0.45, xr = (TAU * r) / 0.65, qb = mie(xb, m).qsca, qr = mie(xr, m).qsca;
          sA.vband(xr, xb, { color: 'gold', alpha: 0.18 });
          sA.dot(xb, qb, { color: 'blue', r: 6 }); sA.dot(xr, qr, { color: 'red', r: 6 });
          sA.text('Rayleigh, slope 4', 3e-3, (8 / 3) * 3e-3 ** 4 * K, { color: 'muted', size: 10.5, align: 'left', dx: 8, dy: 6 });
          // ── angular pattern at 550 nm
          const x5 = (TAU * r) / 0.55, I = pattern(r, m), th = TH;
          let imax = 0, imin = Infinity; for (const q of I) { imax = Math.max(imax, q); imin = Math.min(imin, q); }
          const DEC = Math.max(2, Math.min(6, Math.ceil(Math.log10(imax / imin) + 0.15))), rad = (q) => Math.max(0, (Math.log10(q / imax) + DEC) / DEC);
          sB.polarGrid({ rings: M.range(DEC, 1).map((k) => k / DEC), spokes: 12, labels: false, angles: false });
          for (let k = 1; k <= DEC; k++) sB.text(k === DEC ? '1' : v.M.pow10Text(k - DEC), 0.02, k / DEC, { color: 'muted', size: 10, align: 'left', baseline: 'bottom' });
          const pts = []; for (let i = 0; i < NA; i++) pts.push([rad(I[i]) * Math.cos(th[i]), rad(I[i]) * Math.sin(th[i])]);
          for (let i = NA - 1; i >= 0; i--) pts.push([rad(I[i]) * Math.cos(th[i]), -rad(I[i]) * Math.sin(th[i])]);
          sB.path(pts, { color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.18, close: true });
          const ray = []; for (let i = 0; i <= 360; i++) { const t = (TAU * i) / 360; const q = rad(((1 + Math.cos(t) ** 2) / 2) * imax); ray.push([q * Math.cos(t), q * Math.sin(t)]); }
          sB.path(ray, { color: 'muted', width: 1.2, dash: [5, 4] });
          sB.arrow(-1.28, 0, -1.03, 0, { color: 'gold', width: 2.5, head: 8 });
          sB.text('sunlight', -1.28, 0, { color: 'gold', size: 10.5, align: 'left', baseline: 'bottom', dy: -5 });
          sB.text('forward', 1.03, 0, { color: 'muted', size: 10.5, align: 'right', baseline: 'top', dy: 5 });
          // back-scattered fraction ∫_{π/2}^{π} I sinθ dθ / ∫_0^π I sinθ dθ (Simpson on the 1° grid)
          const simp = (a, b) => { let s = 0; for (let i = a; i <= b; i++) s += (i === a || i === b ? 1 : (i - a) % 2 ? 4 : 2) * I[i] * Math.sin(th[i]); return s; };
          const back = simp((NA - 1) / 2, NA - 1) / simp(0, NA - 1);
          // colours: scattered and transmitted sunlight
          const Qr = (nm) => Qat(r, nm / 1000, m), q550 = Qr(550);
          const sky = spectrumRGB((nm) => planck(P, nm / 1000, P.Tsun) * Qr(nm)), sun = spectrumRGB((nm) => planck(P, nm / 1000, P.Tsun) * Math.exp((-tau.value * Qr(nm)) / q550));
          const c = sB.ctx, Y = sB.H - 40;
          for (const [rgb, X, lab] of [[sky, 14, 'scattered'], [sun, sB.W - 50, 'transmitted']]) {
            c.save(); c.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`; c.strokeStyle = v.color('faint'); c.lineWidth = 1;
            c.beginPath(); if (c.roundRect) c.roundRect(X, Y, 36, 28, 5); else c.rect(X, Y, 36, 28); c.fill(); c.stroke(); c.restore();
            sB.textPx(lab, X + 18, Y - 8, { size: 10.5, color: 'muted', align: 'center' });
          }
          const rho = m < 1.4 ? 1.0 : m < 1.5 ? 1.77 : 2.6; // g/cm³: water, sulfate, mineral dust
          R = { r, m, x5, ratio: qb / qr, ang: -Math.log(qb / qr) / Math.log(0.45 / 0.65), back, q550, refl: back * (1 - Math.exp(-tau.value)), mass: (3 * q550) / (4 * rho * 1e6 * r * 1e-6) };
        });
        v.legend([['accent', 'Mie (exact)'], ['muted', String.raw`Rayleigh $\tfrac83x^4|\tfrac{m^2-1}{m^2+2}|^2$, and the dipole pattern`, { dash: true }], ['blue', '450 nm', { dot: true }], ['red', '650 nm', { dot: true }]]);
        v.readout(() => {
          if (!R) return '';
          let s = String.raw`$x$ = ${R.x5 < 0.01 ? v.fix(R.x5, 4) : v.fix(R.x5, 2)} at 550 nm · blue/red scattering ratio $Q(450)/Q(650)$ = ${v.fix(R.ratio, 2)} (Rayleigh limit $(650/450)^4$ = 4.35; Ångström exponent ${v.fix(R.ang, 2)}) · back-scattered fraction ${v.fix(R.back * 100, 1)} % · a layer of optical depth ${v.fix(tau.value, 2)} sends ≈ $b(1-e^{-\tau})$ = ${v.fix(R.refl * 100, 1)} % of sunlight back up (single scattering)`;
          if (R.r >= 0.01) s += String.raw` · mass scattering efficiency $3Q/4\rho r$ = ${v.fix(R.mass, 2)} m²/g`;
          return s;
        });
      },
    },
  ],
};
