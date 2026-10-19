// Materials Science — Chapter 4, part b: items 4.5–4.8 (Hollomon's law, Hall–Petch, inverse Hall–Petch, solid-solution strengthening)
import { TENSILE_PRESETS, epsOfSigma, sigmaOfEps, considereSigma, sig } from './ch04.shared.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// ── Hall–Petch material sets (typical orders of magnitude, rounded; NOT a data table) ──────────────────────────────────────
// s0 MPa (friction stress), k MPa·m^(1/2), G GPa, b nm, nu
const HP = [
  { id: 'fe', label: 'iron / mild steel', s0: 80, k: 0.6, G: 82, b: 0.248, nu: 0.29 },
  { id: 'cu', label: 'copper', s0: 25, k: 0.11, G: 48, b: 0.256, nu: 0.34 },
  { id: 'al', label: 'aluminium', s0: 20, k: 0.06, G: 26, b: 0.286, nu: 0.34 },
  { id: 'ti', label: 'titanium', s0: 80, k: 0.4, G: 44, b: 0.295, nu: 0.32 },
];
const TAYLOR = 3.06;
/** Hall–Petch yield strength in MPa for grain size d in micrometres. */
const hpYield = (m, dUm) => m.s0 + (1000 * m.k) / Math.sqrt(dUm);
/** Number of dislocations a pile-up across half a grain can hold: n = pi (1-nu) tau L / (G b) with tau = (sigma - s0)/M, L = d/2. d in metres. */
const pileCount = (m, dM) => (Math.PI * (1 - m.nu) * (m.k * 1e6 / Math.sqrt(dM) / TAYLOR) * (dM / 2)) / (m.G * 1e9 * m.b * 1e-9);

/** Equilibrium of n dislocations pressed against a locked head by a uniform force (units of a = G b / (2 pi (1-nu) tau)); positions x_0 = 0 < x_1 < … */
function pileUp(n) {
  if (n < 2) return [0];
  const solve = (A, b) => {
    const m = b.length, Mx = A.map((r, i) => [...r, b[i]]);
    for (let i = 0; i < m; i++) { let p = i; for (let r = i + 1; r < m; r++) if (Math.abs(Mx[r][i]) > Math.abs(Mx[p][i])) p = r; [Mx[i], Mx[p]] = [Mx[p], Mx[i]]; for (let r = i + 1; r < m; r++) { const f = Mx[r][i] / Mx[i][i]; for (let c = i; c <= m; c++) Mx[r][c] -= f * Mx[i][c]; } }
    const x = Array(m).fill(0);
    for (let i = m - 1; i >= 0; i--) { let s = Mx[i][m]; for (let c = i + 1; c < m; c++) s -= Mx[i][c] * x[c]; x[i] = s / Mx[i][i]; }
    return x;
  };
  const x = [...Array(n).keys()].map((j) => 2 * n * Math.pow(j / (n - 1), 1.7));
  for (let it = 0; it < 200; it++) {
    const F = [], J = [];
    for (let j = 1; j < n; j++) {
      let f = -1; const row = Array(n - 1).fill(0);
      for (let k = 0; k < n; k++) { if (k === j) continue; const d = x[j] - x[k]; f += 1 / d; const dd = -1 / (d * d); row[j - 1] += dd; if (k >= 1) row[k - 1] -= dd; }
      F.push(f); J.push(row);
    }
    const dx = solve(J, F.map((q) => -q));
    let t = 1;
    for (let j = 1; j < n; j++) if (dx[j - 1] < 0) { const gap = x[j] - x[j - 1]; if (-dx[j - 1] * t > 0.5 * gap) t = Math.min(t, (0.5 * gap) / -dx[j - 1]); }
    let mx = 0;
    for (let j = 1; j < n; j++) { x[j] += t * dx[j - 1]; mx = Math.max(mx, Math.abs(t * dx[j - 1])); }
    if (mx < 1e-10) break;
  }
  return x;
}

// ── a dislocation line pinned by random solutes (4.8): overdamped elastic string, implicit in the elastic part (FFT) ───────
function fftInPlace(re, im, inv) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((2 * Math.PI) / len) * (inv ? -1 : 1), wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = i + k + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
  if (inv) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}
/** Random solute field: concentration c (per lattice site of the slip plane, b = 1), peak pinning force fm (in units of the line tension T = 1). */
function makeField({ N = 256, Lx = 128, Ly = 40, c, fm, seed = 1, w = 1 }) {
  let s = seed >>> 0;
  const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const nobs = Math.max(1, Math.round(c * Lx * Ly)), ox = [], oy = [];
  for (let k = 0; k < nobs; k++) { ox.push(rnd() * Lx); oy.push(2 + rnd() * Ly); }
  const nb = Math.floor(Lx / 4), bins = Array.from({ length: nb }, () => []);
  ox.forEach((x, k) => bins[Math.floor((x / Lx) * nb) % nb].push(k));
  return { N, Lx, Ly, c, fm, w, ox, oy, nb, bins, dx: Lx / N, V0: fm / (Math.sqrt(2 * Math.PI) * Math.exp(-0.5) * w) };
}
function relaxLine(L, y, tau, dt = 2, maxIt = 200, tol = 2e-4) {
  const { N, Lx, dx, ox, oy, w, V0, nb, bins } = L, lam = new Float64Array(N), re = new Float64Array(N), im = new Float64Array(N), F = new Float64Array(N);
  for (let k = 0; k < N; k++) { const kk = k <= N / 2 ? k : N - k; lam[k] = 1 / (1 + (dt * (2 - 2 * Math.cos((2 * Math.PI * kk) / N))) / (dx * dx)); }
  for (let it = 0; it < maxIt; it++) {
    for (let i = 0; i < N; i++) {
      const x = i * dx; let f = tau * dx; const b0 = Math.floor((x / Lx) * nb);
      for (let db = -1; db <= 1; db++) for (const k of bins[(b0 + db + nb) % nb]) {
        let ddx = x - ox[k]; ddx -= Lx * Math.round(ddx / Lx);
        if (Math.abs(ddx) > 4 * w) continue;
        const ry = y[i] - oy[k]; f -= (V0 * dx * Math.exp(-(ddx * ddx + ry * ry) / (2 * w * w)) * ry) / (w * w);
      }
      F[i] = f;
    }
    for (let i = 0; i < N; i++) { re[i] = y[i] + (dt * F[i]) / dx; im[i] = 0; }
    fftInPlace(re, im, false); for (let k = 0; k < N; k++) { re[k] *= lam[k]; im[k] *= lam[k]; } fftInPlace(re, im, true);
    let mx = 0; for (let i = 0; i < N; i++) { mx = Math.max(mx, Math.abs(re[i] - y[i])); y[i] = re[i]; }
    if (mx < tol) break;
  }
}
/** Ramp the stress and record the line at each step until it breaks free. Returns {taus, lines, tauC (NaN if never), tF}. */
function rampLine(L, steps = 50, span = 2.2) {
  const tF = (Math.pow(L.fm, 1.5) * Math.sqrt(L.c)) / Math.SQRT2, y = new Float64Array(L.N), taus = [0], lines = [Float64Array.from(y)];
  let tauC = NaN;
  for (let s = 1; s <= steps; s++) {
    const tau = ((tF * span) * s) / steps;
    relaxLine(L, y, tau);
    taus.push(tau); lines.push(Float64Array.from(y));
    let m = 0; for (const q of y) m += q; m /= L.N;
    if (m > L.Ly * 0.75) { tauC = tau; break; }
  }
  return { taus, lines, tauC, tF };
}

export default {
  collection: 'mat',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Law',
      name: 'Hollomon’s strain-hardening law',
      statement: String.raw`In the uniform part of a tensile test, the true stress of many metals follows a power law in the true **plastic** strain, $$\sigma=K\,\varepsilon_p^{\,n},$$ with the **strength coefficient** $K$ (the stress at $\varepsilon_p=1$) and the **strain-hardening exponent** $n$, typically $0.1$ to $0.5$ for metals. On log–log axes the data fall on a straight line of slope $n$. Combined with the Considère criterion (4.4) the law predicts where the bar necks: neglecting elastic strain and assuming constant volume, the true plastic strain at the force maximum equals $n$, and the tensile strength is $K\,n^n e^{-n}$ (per unit starting area).`,
      idea: String.raw`Taking logarithms, $\ln\sigma=\ln K+n\ln\varepsilon_p$ is the equation of a line, so $n$ and $K$ come from a least-squares fit of $\ln\sigma$ against $\ln\varepsilon_p$ over the uniform range, from just beyond yield to just before necking. Neglecting the elastic strain, the necking prediction follows from 4.4: $d\sigma/d\varepsilon=nK\varepsilon^{n-1}=K\varepsilon^n$ at $\varepsilon=n$. The law is empirical (it has no yield stress, and fails at very small strains where the elastic part matters), so the fitted $n$ depends a little on the window: that sensitivity is exactly what the sliders show.`,
      caption: String.raw`Dots are simulated measurements (the model of 4.1 plus a few per cent of seeded noise, converted to plastic strain by removing $\sigma/E$). Move the two window sliders to choose which points enter the log–log fit (the line); the right panel replots the same law on linear axes together with $d\sigma/d\varepsilon$, and marks the strain at which they cross. Change the material or the noise, and press *resample*.`,
      deps: ['mat-4.4', 'opt-1.6'],
      refs: ['Roylance, Stress–Strain Curves, pp6–8 Eq8; Cambridge DoITPoMS, Tensile Testing—Necking and Failure'],
      tags: ['strain hardening', 'power law', 'tensile test'],
      credit: 'J. H. Hollomon, 1945 (Tensile deformation, Trans. AIME 162)',
      scope: String.raw`The uniform deformation of a metal that follows a power law, at moderate temperature and strain rate. The "measurements" are generated from the elastic–Hollomon model of 4.1 with preset parameters (rounded orders of magnitude) and are not experimental data; the power law is a fit, not a derivation, and different windows give different $n$.`,
      viz(v) {
        const matS = v.select('material', TENSILE_PRESETS.map((p) => ({ value: p.id, label: p.label })), 'steel');
        const lo = v.slider('fit from plastic strain', 0.002, 0.05, 0.004, { log: true, decimals: 4 });
        const hi = v.slider('fit up to plastic strain', 0.02, 0.5, 0.5, { log: true, decimals: 3 });
        const noise = v.slider('noise (%)', 0, 3, 1, { step: 0.1 });
        let seed = 7;
        v.button('resample', () => { seed += 1; });
        const A = v.stage({ x: [1e-3, 0.6], y: [100, 1000], xlog: true, ylog: true, axes: 'box', gutter: true, height: 360, weight: 1.1, xlabel: 'true plastic strain  $\\varepsilon_p$', ylabel: 'true stress (MPa)', title: 'log–log: the slope is $n$' });
        const B = v.stage({ x: [0, 0.4], y: [0, 800], axes: 'box', gutter: true, height: 360, weight: 1, xlabel: 'true plastic strain', ylabel: 'MPa', title: 'the fitted law, and where it necks' });
        let info = null;
        v.render(() => {
          const m = TENSILE_PRESETS.find((p) => p.id === matS.value), su = considereSigma(m), eu = epsOfSigma(m, su), epu = eu - su / (m.E * 1000);
          const r = v.rng(seed), data = [];
          for (let i = 0; i < 32; i++) {
            const et = Math.exp(Math.log(0.0025) + (Math.log(0.97 * eu) - Math.log(0.0025)) * (i / 31));
            const s = sigmaOfEps(m, et) * (1 + (noise.value / 100) * r.normal()), ep = et - s / (m.E * 1000);
            if (ep > 1e-4) data.push({ ep, s });
          }
          const sel = data.filter((d) => d.ep >= lo.value && d.ep <= hi.value);
          const smin = Math.min(...data.map((d) => d.s)), smax = Math.max(...data.map((d) => d.s));
          A.setView([1e-3, 0.6], [smin * 0.8, smax * 1.25]);
          let fit = null;
          if (sel.length >= 3) fit = v.M.linreg(sel.map((d) => Math.log(d.ep)), sel.map((d) => Math.log(d.s)));
          for (const d of data) { const on = d.ep >= lo.value && d.ep <= hi.value; A.dot(d.ep, d.s, { r: on ? 4.5 : 3.5, color: on ? 'accent' : 'faint', fill: on ? 'accent' : 'faint' }); }
          A.vline(lo.value, { color: 'orange', dash: true, alpha: 0.6 }); A.vline(hi.value, { color: 'orange', dash: true, alpha: 0.6 });
          let n = NaN, K = NaN;
          if (fit) {
            n = fit.slope; K = Math.exp(fit.intercept);
            A.fn((x) => K * Math.pow(x, n), { domain: [1e-3, 0.6], color: 'green', width: 1.5, alpha: 0.4, dash: true });
            A.fn((x) => K * Math.pow(x, n), { domain: [Math.max(1e-3, lo.value), Math.min(0.6, hi.value)], color: 'green', width: 3 });
          }
          // linear panel
          B.setView([0, 0.42], [0, smax * 1.2]);
          for (const d of data) B.dot(d.ep, d.s, { r: 3.5, color: 'faint', fill: 'faint' });
          if (fit) {
            const sg = (e) => K * Math.pow(e, n), dsg = (e) => n * K * Math.pow(e, n - 1);
            B.fn(sg, { domain: [0.003, 0.42], color: 'green', width: 2.6 });
            B.fn(dsg, { domain: [0.02, 0.42], color: 'orange', width: 2 });
            B.vline(n, { color: 'red', dash: true });
            B.text('$\\varepsilon_p=n$', n + 0.006, smax * 1.1, { color: 'red', size: 12, align: 'left' });
            B.dot(n, sg(n), { r: 6, color: 'red', fill: 'red' });
          }
          B.vline(epu, { color: 'gold', width: 2, alpha: 0.9 });
          B.text('necking in the model', epu - 0.006, smax * 0.08, { color: 'gold', size: 11.5, align: 'right', plate: true });
          info = { fit, n, K, epu, count: sel.length, model: m };
        });
        v.legend([['accent', 'points in the fit', { dot: true }], ['faint', 'points left out', { dot: true }], ['green', '$K\\varepsilon_p^n$ (fit)'], ['orange', '$d\\sigma/d\\varepsilon$ of the fit'], ['gold', 'plastic strain at the force maximum in the model']]);
        v.readout(() => {
          if (!info) return '';
          if (!info.fit) return 'Fewer than three points in the window: widen it.';
          const { fit, n, K, epu, count } = info;
          return `Fit of ${count} points: $n=${v.fix(n, 3)}\\pm${v.fix(fit.seSlope, 3)}$, $K=${v.fix(K, 0)}$ MPa, $R^2=${v.fix(fit.r2, 4)}$.  Hollomon's prediction neglecting elasticity: $\\varepsilon_p=n=${v.fix(n, 3)}$ (tensile strength $Kn^ne^{-n}=${v.fix(K * Math.pow(n, n) * Math.exp(-n), 0)}$ MPa).\nIn the model that generated the data, the force maximum is at plastic strain $${v.fix(epu, 3)}$ (its parameter is $n=${v.fix(info.model.n, 2)}$): the fit ${Math.abs(n - epu) < 0.03 ? 'agrees with it' : 'is off by ' + v.fix(Math.abs(n - epu), 3) + ', because the window excludes the range that matters or the data are not a pure power law'}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Law',
      name: 'Hall–Petch relation',
      statement: String.raw`The yield strength of a polycrystalline metal rises as its grains are refined, $$\sigma_y=\sigma_0+\frac{k_y}{\sqrt d},$$ where $d$ is the mean grain diameter, $\sigma_0$ the friction stress that a single crystal would resist with, and $k_y$ the Hall–Petch slope (a few tenths of $\mathrm{MPa\,m^{1/2}}$ for common metals; it measures how hard it is to transmit slip across a grain boundary). Plotted against $d^{-1/2}$ the data fall on a straight line. This is an empirical fit over a material-dependent grain-size range; extrapolation to nanocrystals can fail (4.7).`,
      idea: String.raw`Dislocations piling up against a grain boundary in a slip plane of length about $d/2$ act together: a pile-up of $n$ dislocations concentrates the applied shear stress $\tau$ to $n\tau$ at its head, and the pile-up holds $n\approx\pi(1-\nu)\tau d/(2Gb)$ dislocations. The neighbour grain starts to slip when the concentrated stress reaches a critical value $\tau_c$, so $\tau\propto d^{-1/2}$: the larger the grain, the more dislocations pile up, the more stress they concentrate (Eshelby–Frank–Nabarro pile-up, and the Burgers vector's role through $Gb$ in 3.6). Smaller grains hold shorter pile-ups and need more applied stress.`,
      caption: String.raw`Drag the grain size (or the handle on the line). Left: one grain of width $d$ with its pile-up of edge dislocations (found by solving the force balance of all of them, not drawn by hand), all pressed against the boundary on the right; the readout gives how many fit. Right: the Hall–Petch line against $d^{-1/2}$ with the current grain size marked. Switch metal, and note how few dislocations a pile-up can hold in a submicron grain.`,
      deps: ['mat-3.10', 'mat-4.3'],
      refs: ['Roylance, Dislocation Basis of Yield and Creep, pp10–11 Eq7'],
      tags: ['grain size', 'strengthening', 'pile-up'],
      credit: 'E. O. Hall, 1951; N. J. Petch, 1953',
      scope: String.raw`A material-dependent range of polycrystalline grain sizes at temperatures where grain-boundary sliding is negligible. The constants $\sigma_0$ and $k_y$ of the four metals are rounded typical values, strongly dependent on purity, temperature and interstitials; the pile-up uses a Taylor factor 3.06 to turn the tensile excess $\sigma_y-\sigma_0$ into shear stress, a single slip band of length $d/2$ and the leading edge dislocation locked at the boundary.`,
      viz(v) {
        const matS = v.select('metal', HP.map((p) => ({ value: p.id, label: p.label })), 'cu');
        const dS = v.slider('grain size $d$ ($\\mu$m)', 0.05, 100, 10, { log: true, decimals: 2 });
        const A = v.stage({ x: [-0.62, 0.62], y: [-0.62, 0.62], equal: true, axes: false, height: 320, weight: 1.1, title: 'one grain, in units of $d$' });
        const B = v.stage({ x: [0, 4.2], y: [0, 400], axes: 'box', gutter: true, height: 320, weight: 1, xlabel: '$d^{-1/2}$  ($\\mu$m$^{-1/2}$)', ylabel: 'yield strength (MPa)', title: 'Hall–Petch plot' });
        const hB = B.handle(0.5, 100, { color: 'accent', r: 8, constrain: (x) => { const t = clamp(x, 0.1, Math.sqrt(20)); return [t, hpYield(HP.find((p) => p.id === matS.value), 1 / (t * t))]; } });
        hB.onDrag = () => dS.set(clamp(1 / (hB.x * hB.x), 0.05, 100));
        let info = null;
        v.render(() => {
          const m = HP.find((p) => p.id === matS.value), d = dS.value, dM = d * 1e-6;
          const sy = hpYield(m, d), tauPa = (m.k * 1e6) / Math.sqrt(dM) / TAYLOR, tau = tauPa / 1e6, a = (m.G * 1e9 * m.b * 1e-9) / (2 * Math.PI * (1 - m.nu) * tauPa), L = dM / 2, nCont = pileCount(m, dM);
          // number of dislocations that fit in the slip band: largest n with x_{n-1} a <= L
          let n = Math.max(1, Math.min(60, Math.floor(nCont))), xs = pileUp(n);
          for (let g = 0; g < 8 && n > 1 && xs[n - 1] * a > L; g++) { n--; xs = pileUp(n); }
          for (let g = 0; g < 8 && n < 60 && pileUp(n + 1)[n] * a <= L; g++) { n++; xs = pileUp(n); }
          // grain: hexagon of width 1, boundary highlighted
          const R = 0.5 / Math.cos(Math.PI / 6), hex = [0, 1, 2, 3, 4, 5].map((i) => [R * Math.cos(Math.PI / 6 + (Math.PI / 3) * i), R * Math.sin(Math.PI / 6 + (Math.PI / 3) * i)]);
          A.poly(hex, { fill: 'accent', fillAlpha: 0.07, color: 'ink', width: 2.5 });
          A.line(0.5, R / 2, 0.5, -R / 2, { color: 'red', width: 4, alpha: 0.9 });
          A.line(-0.5, 0, 0.5, 0, { color: 'faint', dash: true });
          A.dot(0, 0, { r: 7, color: 'gold', fill: 'gold', label: 'source', labelPos: 's' });
          for (let j = 0; j < n; j++) {
            const x = 0.5 - (xs[j] * a) / dM;
            A.tex('\\perp', x, 0.035, { color: 'orange', size: 16 });
          }
          A.arrow(-0.12, 0.2, 0.12, 0.2, { color: 'muted', head: 6 }); A.text('$\\tau$', 0, 0.28, { color: 'muted', size: 13 });
          A.text('grain boundary', 0.5, -R / 2 - 0.06, { color: 'red', size: 11.5, align: 'right' });
          // plot
          const xm = 1 / Math.sqrt(d);
          const xmax=Math.max(4.2,xm*1.08); B.setView([0, xmax], [0, hpYield(m, 1 / (xmax * xmax)) * 1.08]);
          B.fn((x) => m.s0 + 1000 * m.k * x, { domain: [0, xmax], color: 'ink', width: 2.5 });
          B.hline(m.s0, { color: 'faint', dash: true }); B.text('$\\sigma_0$', 3.9, m.s0 + 14, { color: 'muted', size: 12, align: 'right' });
          hB.set(xm, sy);
          B.vline(xm, { color: 'accent', alpha: 0.4, dash: true });
          info = { m, d, sy, n, nCont, a, L, tau, capped: nCont > 60 };
        });
        v.readout(() => {
          if (!info) return '';
          const { m, d, sy, n, nCont, a, tau, capped } = info;
          return `$d=${v.fmt(d, 3)}\\,\\mu$m: $\\sigma_y=\\sigma_0+k_y/\\sqrt d=${v.fix(m.s0, 0)}+${v.fix(1000 * m.k / Math.sqrt(d), 0)}=${v.fix(sy, 0)}$ MPa (shear $\\tau=(\\sigma_y-\\sigma_0)/3.06=${v.fix(tau, 0)}$ MPa).\nPile-up across half the grain: $n=\\pi(1-\\nu)\\tau d/(2Gb)=${v.fix(nCont, 1)}$ dislocations${capped ? ' (drawing capped at 60)' : ''}; the exact force balance fits ${n} dislocations in half a grain (drawn, bunched against the boundary; the formula is an asymptotic estimate), and the stress at the head is about $n\\tau=${v.fix(n * tau, 0)}$ MPa (the length unit of the force balance is $a=${v.fix(a * 1e9, 0)}$ nm).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Paradox',
      name: 'Inverse Hall–Petch in nanocrystals',
      statement: String.raw`Hall–Petch (4.6) says that finer grains are always stronger, which would let a metal be strengthened without limit. In nanocrystalline metals the trend stops: below a critical grain size of the order of $10$–$20\,$nm (for copper) the measured and simulated strength stops rising and falls as the grains are refined further, the **inverse Hall–Petch** effect. The grains become too small to hold a dislocation pile-up, and so many atoms sit in or next to grain boundaries (a boundary volume fraction of order $3\Delta/d$ for boundary thickness $\Delta$) that deformation is carried instead by grain-boundary sliding and shuffling, whose resistance falls with $d$.`,
      idea: String.raw`Two deformation mechanisms act in parallel and the softer one wins. The dislocation mechanism's resistance is the Hall–Petch stress (4.6), which keeps rising as $d^{-1/2}$ only while a pile-up can form: the number of dislocations it holds, $n\propto\sqrt d$ (4.6), falls below one at a grain size of order 100 nm for copper, and Hall–Petch strengthening gradually weakens before that. The boundary mechanism's resistance, a thermally assisted sliding, drops with falling grain size as $d^m$. Where the two curves cross the strength peaks: the model reproduces the shape of the molecular-dynamics maximum at $10$–$15$ nm found by Schiøtz and Jacobsen, but the position of the crossing is an adjustable input here, not a prediction.`,
      caption: String.raw`Left: strength against grain size on a log axis: the Hall–Petch line (blue), the boundary-sliding branch (red) with its exponent $m$ and the crossover size $d_c$ you choose, and the actual strength, the lower of the two (black). Drag the handle along the curve. Middle: the number of dislocations a pile-up can hold, with the line $n=1$. Right: a polycrystal of this grain size in a 60 nm window; the dark boundary layer (1 nm) takes up more and more of the material.`,
      deps: ['mat-4.6'],
      refs: ['Roylance, Dislocation Basis of Yield and Creep, pp10–11 Eq7'],
      tags: ['nanocrystals', 'grain boundaries', 'strength'],
      credit: 'A. H. Chokshi, A. Rosen, J. Karch and H. Gleiter, 1989 (first report of softening); J. Schiøtz and K. W. Jacobsen, 2003 (molecular-dynamics maximum at 10–15 nm in Cu)',
      scope: String.raw`A schematic two-mechanism model, not a prediction: the crossover size $d_c$ and sliding exponent $m$ are free parameters (the default $d_c=15$ nm is chosen to match the simulated maximum in copper; experiments give a range, depend on sample preparation and are debated). The Hall–Petch constants are the rounded values of 4.6.`,
      verify: true,
      viz(v) {
        const matS = v.select('metal', HP.map((p) => ({ value: p.id, label: p.label })), 'cu');
        const dcS = v.slider('crossover size $d_c$ (nm)', 5, 100, 15, { log: true, decimals: 1 });
        const mS = v.slider('sliding exponent $m$', 0.2, 1.5, 0.6, { step: 0.05 });
        const dS = v.slider('grain size $d$ (nm)', 3, 10000, 40, { log: true, decimals: 1 });
        const A = v.stage({ x: [3, 10000], y: [0, 1400], xlog: true, axes: 'box', gutter: true, height: 340, weight: 1.3, xlabel: 'grain size $d$ (nm)', ylabel: 'yield strength (MPa)', title: 'strength against grain size' });
        const B = v.stage({ x: [3, 10000], y: [0.01, 1000], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 250, xlabel: '$d$ (nm)', ylabel: 'dislocations per pile-up', title: 'can a pile-up form?' });
        const C = v.stage({ x: [0, 60], y: [0, 36], equal: true, axes: false, height: 340, weight: 1, minWidth: 250, title: 'microstructure, 60 nm window' });
        const hA = A.handle(40, 500, { color: 'accent', r: 8, constrain: (x) => { const dd = clamp(x, 3, 10000); return [dd, strength(dd).s]; } });
        hA.onDrag = () => dS.set(clamp(hA.x, 3, 10000));
        function strength(dnm) {
          const m = HP.find((p) => p.id === matS.value), dc = dcS.value, hp = hpYield(m, dnm / 1000), s_c = hpYield(m, dc / 1000), sl = s_c * Math.pow(dnm / dc, mS.value);
          return { hp, sl, s: Math.min(hp, sl) };
        }
        let info = null;
        v.render(() => {
          const m = HP.find((p) => p.id === matS.value), dc = dcS.value, d = dS.value;
          const peak = hpYield(m, dc / 1000);
          A.setView([3, 10000], [0, Math.max(600, peak * 1.25)]);
          A.fn((x) => strength(x).hp, { domain: [3, 10000], color: 'accent', width: 2, alpha: 0.5, dash: true });
          A.fn((x) => strength(x).sl, { domain: [3, 10000], color: 'red', width: 2, alpha: 0.6, dash: true });
          A.fn((x) => strength(x).s, { domain: [3, 10000], color: 'ink', width: 3 });
          A.vline(dc, { color: 'muted', dash: true, alpha: 0.6 }); A.text('$d_c$', dc * 1.06, Math.max(600, peak * 1.25) * 0.05, { color: 'muted', size: 12, align: 'left' });
          A.text('dislocations carry slip', 9000, Math.max(600, peak * 1.25) * 0.8, { color: 'accent', size: 12, align: 'right' });
          A.text('boundaries slide', 5.5, Math.max(600, peak * 1.25) * 0.93, { color: 'red', size: 12, align: 'left' });
          const st = strength(d);
          hA.set(d, st.s);
          // pile-up capacity
          B.fn((x) => pileCount(m, x * 1e-9), { domain: [3, 10000], color: 'orange', width: 2.6 });
          B.hline(1, { color: 'red', dash: true }); B.text('one dislocation', 5, 1.5, { color: 'red', size: 11.5, align: 'left' });
          B.vline(d, { color: 'accent', dash: true, alpha: 0.5 });
          // d where n = 1
          let d1 = 3; for (let x = 3; x < 1e5; x *= 1.01) { if (pileCount(m, x * 1e-9) >= 1) { d1 = x; break; } }
          B.dot(d1, 1, { r: 6, color: 'red', fill: 'red' });
          // polycrystal mosaic: jittered grid seeds of spacing d (nm)
          const W = 60, Hh = 36, gs = Math.max(d, 1.2), nx = Math.ceil(W / gs) + 2, ny = Math.ceil(Hh / gs) + 2, r = v.rng(11), seeds = [];
          for (let j = -1; j < ny; j++) for (let i = -1; i < nx; i++) seeds.push({ i, j, x: (i + 0.5 + 0.7 * (r() - 0.5)) * gs, y: (j + 0.5 + 0.7 * (r() - 0.5)) * gs, t: 0.15 + 0.5 * r() });
          const cell = (i, j) => seeds[(j + 1) * (nx + 1) + (i + 1)];
          const bw = 1.0;
          C.raster((x, y) => {
            const ci = Math.floor(x / gs), cj = Math.floor(y / gs);
            let d1s = 1e9, d2s = 1e9, best = null;
            for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
              const sd = (cj + dj + 1) * (nx + 1) + (ci + di + 1);
              if (ci + di < -1 || ci + di >= nx || cj + dj < -1 || cj + dj >= ny) continue;
              const s = seeds[sd]; if (!s) continue;
              const dd = Math.hypot(s.x - x, s.y - y);
              if (dd < d1s) { d2s = d1s; d1s = dd; best = s; } else if (dd < d2s) d2s = dd;
            }
            if (!best) return null;
            if (d2s - d1s < bw) return [...v.rgb('red').slice(0, 3), 235];
            const c = v.ramp(best.t, 'accent', 'panel');
            return [c[0], c[1], c[2], 255];
          }, { res: 2, key: `${matS.value}|${d.toFixed(3)}` });
          info = { m, st, d, d1, frac: Math.min(1, 3 * 1.0 / d), peak };
        });
        v.legend([['accent', 'Hall–Petch', { dash: true }], ['red', 'boundary sliding', { dash: true }], ['ink', 'actual strength = the softer mechanism']]);
        v.readout(() => {
          if (!info) return '';
          const { m, st, d, d1, frac } = info;
          const mech = st.hp <= st.sl ? 'dislocation slip (Hall–Petch)' : 'grain-boundary sliding';
          return `$d=${v.fmt(d, 3)}$ nm: Hall–Petch ${v.fix(st.hp, 0)} MPa, boundary sliding ${v.fix(st.sl, 0)} MPa; the material yields at ${v.fix(st.s, 0)} MPa by ${mech}. The strength peaks at ${v.fix(info.peak, 0)} MPa at $d_c=${v.fmt(dcS.value, 3)}$ nm.\nA pile-up holds $n=${v.fix(pileCount(m, d * 1e-9), 2)}$ dislocations here (it falls to 1 at $d\\approx${v.fmt(d1, 2)}$ nm); about ${v.fix(frac * 100, 0)} % of the atoms are in 1 nm grain boundaries ($3\\Delta/d$).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Model',
      name: 'Solid-solution strengthening',
      statement: String.raw`Foreign atoms dissolved in a metal distort the lattice (size misfit) and change its stiffness; each acts as a weak obstacle of peak force $f_m$ on a dislocation line of tension $T\approx Gb^2/2$. The line bows between the obstacles it meets and the stress to push it through is, in the isolated-obstacle Friedel approximation, $$\tau_c\approx\frac{f_m^{3/2}}{b^2\sqrt{2T}}\;c^{1/2}$$ with $c$ the fraction of lattice sites occupied by solute. Since $f_m$ grows with the misfit $\varepsilon$ ($f_m\propto Gb^2\varepsilon$), the strengthening $\Delta\tau_c\propto G\,\varepsilon^{3/2}c^{1/2}$ (Fleischer); for weaker obstacles theory (Labusch) gives a steeper concentration dependence, $c^{2/3}$. The strengthening is largest for big misfit, which is why the Hume-Rothery size rule (2.3) matters.`,
      idea: String.raw`A straight line meets obstacles at random; it cannot avoid them and costs line-tension energy to bend. At stress $\tau$ the line bows into arcs of radius $T/(\tau b)$ between pinning points; the obstacles' mean spacing along the line is then $L\approx f_m/(\tau b)$ (force balance at a pin) and on the other hand $L^2\,n\approx 1$ for the line to sweep up one obstacle per segment ($n$ the areal density, $c/b^2$). Eliminating $L$ gives $\tau_c\propto f_m^{3/2}n^{1/2}/\sqrt T$. The simulation below does not use this argument: it integrates the line under applied stress among random obstacles (a Gaussian pinning force $f_m$ of range $b$) and records the stress at which it breaks free.`,
      caption: String.raw`Left: a dislocation line (blue) advancing upward through random solute atoms (dots) on its slip plane; drag *applied stress* from zero to the critical value (in units of the Friedel estimate $\tau_F$): the line bows against the pinning points, then at $\tau_c$ the first segment runs away and the whole line follows. Right: the critical stress found this way for five concentrations (each a fresh run on the same random field) compared with the Friedel formula and the $c^{1/2}$ and $c^{2/3}$ guide lines. Increase $f_m$ (bigger misfit) or concentration.`,
      deps: ['mat-2.3', 'mat-3.6'],
      refs: ['Callister §7.9'],
      tags: ['solid solution', 'strengthening', 'obstacles'],
      credit: 'N. F. Mott and F. R. N. Nabarro, 1948; R. L. Fleischer, 1963 (solution hardening); R. Labusch, 1970 (statistical theory); J. Friedel (statistics of obstacles)',
      scope: String.raw`Dislocation line in one slip plane at zero temperature and constant line tension, in obstacle-free elasticity otherwise (no dynamics, no thermal activation, no cross-slip); obstacles are points with a Gaussian interaction of range $b$ and strength $f_m/T$ given in the slider. The exponents quoted from theory ($1/2$ for Fleischer, $2/3$ for Labusch) were recalled from the literature and not re-derived here; the simulated exponent comes from only five points on one random field, so it scatters.`,
      verify: true,
      viz(v) {
        const cS = v.slider('solute concentration $c$', 0.004, 0.064, 0.016, { log: true, decimals: 4 });
        const fS = v.slider('peak force $f_m/T$ (size misfit)', 0.15, 1.2, 0.6, { step: 0.05 });
        const tS = v.slider('applied stress $\\tau/\\tau_F$', 0, 2.2, 0.8, { step: 0.01 });
        let seed = 3;
        v.button('new random field', () => { seed += 1; plan(); });
        const A = v.stage({ x: [0, 128], y: [-4, 44], equal: true, axes: false, height: 250, full: true, title: 'a dislocation line in its slip plane (periodic in x)' });
        const B = v.stage({ x: [0.003, 0.09], y: [0.003, 0.3], xlog: true, ylog: true, axes: 'box', gutter: true, height: 300, full: true, xlabel: 'concentration $c$', ylabel: 'critical stress $\\tau_c b$ (units of $T/b$)', title: 'critical stress against concentration' });
        const CS = [0.004, 0.008, 0.016, 0.032, 0.064];
        let ramp = null, sweep = [], gen = 0, timer = null, busy = false;
        const sl1 = cS, sl2 = fS;
        let lastKey = '', sweepKey = '';
        const planSweep = () => {
          const g = ++gen; sweep = []; busy = true;
          if (timer) clearTimeout(timer);
          let k = 0;
          const next = () => {
            if (g !== gen) return;
            if (k >= CS.length) { busy = false; v.invalidate(); return; }
            const Lk = makeField({ c: CS[k], fm: fS.value, seed }), r = rampLine(Lk, 45, 2.6);
            sweep.push({ c: CS[k], tau: r.tauC, tF: r.tF }); k++; v.invalidate(); timer = setTimeout(next, 0);
          };
          timer = setTimeout(next, 200);
        };
        let rampTimer = null;
        const plan = () => {
          ramp = null; if (rampTimer) clearTimeout(rampTimer);
          rampTimer = setTimeout(() => { const L = makeField({ c: cS.value, fm: fS.value, seed }); ramp = { L, ...rampLine(L) }; v.invalidate(); }, 120);
          const sk = `${fS.value}|${seed}`;
          if (sk !== sweepKey) { sweepKey = sk; planSweep(); }
        };
        v.onCleanup(() => { gen++; if (timer) clearTimeout(timer); if (rampTimer) clearTimeout(rampTimer); });
        v.render(() => {
          const key = `${sl1.value}|${sl2.value}|${seed}`;
          if (key !== lastKey) { lastKey = key; plan(); }
          const L = ramp && ramp.L;
          if (L) {
            const kk = clamp(Math.round((tS.value / 2.2) * (ramp.lines.length - 1) * 1), 0, ramp.lines.length - 1);
            // snapshots are on a grid of tau in [0, 2.2 tF]; find the nearest
            let idx = 0, bd = 1e9; ramp.taus.forEach((t, i) => { const dd = Math.abs(t - tS.value * ramp.tF); if (dd < bd) { bd = dd; idx = i; } });
            const y = ramp.lines[idx];
            for (let k = 0; k < L.ox.length; k++) { A.dot(L.ox[k], L.oy[k], { r: 2.5 + 3 * L.fm, color: 'orange', fill: 'orange' }); }
            const pts = []; for (let i = 0; i <= L.N; i++) pts.push([i * L.dx, y[i % L.N]]);
            A.path(pts, { color: 'accent', width: 3 });
            A.arrow(124, 2, 124, 9, { color: 'muted', head: 6 }); A.text('$\\tau$', 118.5, 6, { color: 'muted', size: 13 });
            A.line(0, 0, 128, 0, { color: 'faint', dash: true, alpha: 0.6 });
            A.text('line at the start', 2, -2.2, { color: 'muted', size: 11, align: 'left' });
          } else A.text('computing…', 64, 20, { color: 'muted', size: 14 });
          // sweep plot
          const tFc = (c) => Math.pow(sl2.value, 1.5) * Math.sqrt(c) / Math.SQRT2;
          B.setView([0.003, 0.09], [Math.max(0.0005, tFc(0.004) * 0.35), tFc(0.064) * 2.2]);
          B.fn(tFc, { domain: [0.003, 0.09], color: 'ink', width: 2 });
          const first = sweep.find((p) => Number.isFinite(p.tau));
          if (first) {
            const ref = first.tau / Math.sqrt(first.c);
            B.fn((c) => ref * Math.sqrt(c), { domain: [0.003, 0.09], color: 'green', dash: true, width: 1.4 });
            const ref2 = first.tau / Math.pow(first.c, 2 / 3);
            B.fn((c) => ref2 * Math.pow(c, 2 / 3), { domain: [0.003, 0.09], color: 'purple', dash: true, width: 1.4 });
          }
          for (const p of sweep) if (Number.isFinite(p.tau)) B.dot(p.c, p.tau, { r: 5.5, color: 'accent', fill: 'accent' });
          if (ramp && Number.isFinite(ramp.tauC)) B.dot(sl1.value, ramp.tauC, { r: 8, color: 'red', hollow: true, width: 2.5 });
          B.vline(sl1.value, { color: 'red', alpha: 0.3, dash: true });
        });
        v.legend([['ink', 'Friedel estimate $f_m^{3/2}c^{1/2}/\\sqrt{2}$'], ['accent', 'simulated $\\tau_c$ (five concentrations)', { dot: true }], ['red', 'this field, from the slider', { dot: true }], ['green', '$\\propto c^{1/2}$ through the first point', { dash: true }], ['purple', '$\\propto c^{2/3}$', { dash: true }]]);
        v.readout(() => {
          if (!ramp) return 'Running the line simulation…';
          const { L, tauC, tF } = ramp;
          const pts = sweep.filter((p) => Number.isFinite(p.tau));
          let fit = '';
          if (pts.length >= 3) { const f = v.M.linreg(pts.map((p) => Math.log(p.c)), pts.map((p) => Math.log(p.tau))); fit = ` Over ${pts.length} concentrations the simulated exponent is ${v.fix(f.slope, 2)}.`; }
          return `${L.ox.length} solute atoms in the strip, $f_m=${v.fix(L.fm, 2)}\\,T$. Friedel estimate $\\tau_F=${v.fix(tF, 4)}$; this line breaks free at $\\tau_c=${Number.isFinite(tauC) ? v.fix(tauC, 4) + ' = ' + v.fix(tauC / tF, 2) + '\\,\\tau_F' : '\\text{not reached}'}$.${tS.value * tF >= (tauC || 1e9) ? ' The line has broken free of the field and is running.' : ''}${fit}${busy ? ' (sweep running…)' : ''}`;
        });
      },
    },
  ],
};

export { makeField, relaxLine, rampLine, fftInPlace, pileUp, hpYield };
