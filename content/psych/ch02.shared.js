// Psychology & Perception — Chapter 2: Signal detection theory (helpers shared by ch02.js and ch02-b.js)

export const SQ2PI = Math.sqrt(2 * Math.PI);
/** Standard normal distribution function (M = v.M). */
export const Phi = (M, z) => 0.5 * M.erfc(-z / Math.SQRT2);
/** Standard normal density. */
export const phi = (z) => Math.exp(-0.5 * z * z) / SQ2PI;
let Z01 = null;
/** Standard normal quantile z(p) = Φ⁻¹(p). */
export const zq = (M, p) => (Z01 || (Z01 = M.dist.normal(0, 1))).quantile(p);
/** Choices for the "who is the subject" control. */
export const OBS = [{ value: 'sim', label: 'simulated observer' }, { value: 'you', label: 'you' }];
/** Colours of the four outcomes, used throughout the chapter (the criterion is always purple). */
export const OC = { hit: 'green', miss: 'orange', fa: 'red', cr: 'teal' };
/** Percent with no decimals (one below 10%). */
export const pc = (x) => (!isFinite(x) ? '—' : (100 * x).toFixed(Math.abs(x) < 0.1 && x !== 0 ? 1 : 0) + '%');
/** Wilson 95% interval for k successes in n trials. */
export function wilson(k, n, z = 1.96) {
  if (!n) return [0, 1];
  const p = k / n, d = 1 + (z * z) / n, c = (p + (z * z) / (2 * n)) / d, h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)];
}
/** setTimeout that redraws afterwards and dies with the viz; after.clear() cancels everything pending. */
export function timers(v) {
  const ids = new Set();
  const after = (ms, fn) => { const id = setTimeout(() => { ids.delete(id); fn(); v.invalidate(); }, ms); ids.add(id); return id; };
  after.clear = () => { for (const id of ids) clearTimeout(id); ids.clear(); };
  v.onCleanup(after.clear);
  return after;
}
/** Log-linear corrected rate (k + ½)/(n + 1) (Hautus, 1995): keeps z finite when k = 0 or k = n. */
export const adj = (k, n) => (k + 0.5) / (n + 1);
/**
 * Equal-variance SDT indices from counts: h hits of nS signal trials, f false alarms of nN noise trials.
 * Rates are log-linear corrected before z; seD is the Gourevitch–Galanter (1967) standard error of d′.
 */
export function sdt(M, h, nS, f, nN) {
  const Ha = adj(h, nS), Fa = adj(f, nN), zH = zq(M, Ha), zF = zq(M, Fa);
  const vH = (Ha * (1 - Ha)) / (nS * phi(zH) ** 2), vF = (Fa * (1 - Fa)) / (nN * phi(zF) ** 2), se = Math.sqrt(vH + vF);
  const d = zH - zF, c = -(zH + zF) / 2;
  return { H: nS ? h / nS : NaN, F: nN ? f / nN : NaN, zH, zF, d, c, lnb: c * d, beta: Math.exp(c * d), seD: se, seC: se / 2 };
}
/** Nelder–Mead minimum of f over R^n, started at x0 with initial step(s) `step`; restarts once from the best point. */
export function nelderMead(f, x0, step, iters = 2500) {
  const n = x0.length, st = Array.isArray(step) ? step : x0.map(() => step);
  const run = (start, its) => {
    let S = [start.slice()];
    for (let i = 0; i < n; i++) { const p = start.slice(); p[i] += st[i]; S.push(p); }
    let F = S.map(f);
    for (let it = 0; it < its; it++) {
      const idx = F.map((_, i) => i).sort((a, b) => F[a] - F[b]);
      S = idx.map((i) => S[i]); F = idx.map((i) => F[i]);
      if (it > 40 && Math.abs(F[n] - F[0]) < 1e-11 * (1 + Math.abs(F[0]))) break;
      const c = new Array(n).fill(0);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) c[j] += S[i][j] / n;
      const at = (t) => c.map((cj, j) => cj + t * (S[n][j] - cj));
      const xr = at(-1), fr = f(xr);
      if (fr < F[0]) { const xe = at(-2), fe = f(xe); if (fe < fr) { S[n] = xe; F[n] = fe; } else { S[n] = xr; F[n] = fr; } }
      else if (fr < F[n - 1]) { S[n] = xr; F[n] = fr; }
      else {
        const xc = at(fr < F[n] ? -0.5 : 0.5), fc = f(xc);
        if (fc < Math.min(fr, F[n])) { S[n] = xc; F[n] = fc; }
        else for (let i = 1; i <= n; i++) { S[i] = S[i].map((x, j) => S[0][j] + 0.5 * (x - S[0][j])); F[i] = f(S[i]); }
      }
    }
    let b = 0; for (let i = 1; i <= n; i++) if (F[i] < F[b]) b = i;
    return { x: S[b], f: F[b] };
  };
  const a = run(x0, iters);
  const b = run(a.x, Math.round(iters / 2));
  return b.f <= a.f ? b : a;
}
/** Points of the binormal ROC: noise N(0,1), signal N(mu, sig²), criterion swept from strict to lax. */
export function rocPts(M, mu, sig = 1, n = 220) {
  const lo = Math.min(-6, mu - 6 * sig), hi = Math.max(6, mu + 6 * sig), out = [];
  for (let i = 0; i <= n; i++) { const k = hi - ((hi - lo) * i) / n; out.push([Phi(M, -k), Phi(M, (mu - k) / sig)]); }
  return out;
}
/** ROC panel furniture: the chance diagonal, and optionally a faint family of equal-variance iso-d′ curves (o.family). */
export function rocFrame(s, M, o = {}) {
  s.rect(0, 0, 1, 1, { color: 'faint', width: 1 });
  if (o.family) for (const d of o.family) {
    s.path(rocPts(M, d, 1, 120), { color: 'faint', width: 1 });
    if (o.labels !== false) { const F = Phi(M, -d / 2 - 0.9), H = Phi(M, d / 2 - 0.9); s.text(`${d}`, F, H, { dx: -4, dy: -7, align: 'right', color: 'muted', size: 10.5 }); }
  }
  s.line(0, 0, 1, 1, { color: 'muted', dash: [5, 4], width: 1.2 });
}
/** Common options of an ROC stage. */
export const ROCOPT = { x: [-0.07, 1.05], y: [-0.07, 1.06], equal: true, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1], yticks: [0, 0.25, 0.5, 0.75, 1], xlabel: 'false-alarm rate F', ylabel: 'hit rate H' };
/**
 * Cumulative ROC points from rating counts (index 0 = most confident "noise" … m − 1 = most confident "signal"):
 * point j (j = 1 … m − 1) treats ratings ≥ j as "yes". Returned from the strictest (j = m − 1) to the laxest.
 */
export function cumROC(nC, sC) {
  const m = nC.length, Nn = nC.reduce((a, b) => a + b, 0), Ns = sC.reduce((a, b) => a + b, 0), out = [];
  let kF = 0, kH = 0;
  for (let j = m - 1; j >= 1; j--) { kF += nC[j]; kH += sC[j]; out.push({ j, kF, kH, Nn, Ns, F: Nn ? kF / Nn : NaN, H: Ns ? kH / Ns : NaN }); }
  return out;
}
/** Draw rating ROC points with Wilson 95% crosses. */
export function drawCum(s, pts, o = {}) {
  const col = o.color || 'ink';
  if (o.line !== false) s.path([[0, 0], ...pts.map((p) => [p.F, p.H]), [1, 1]], { color: col, width: 1, alpha: 0.35, dash: [3, 3] });
  for (const p of pts) {
    const [a, b] = wilson(p.kF, p.Nn), [c, d] = wilson(p.kH, p.Ns);
    s.line(a, p.H, b, p.H, { color: col, width: 1.2, alpha: 0.5 }); s.line(p.F, c, p.F, d, { color: col, width: 1.2, alpha: 0.5 });
    s.dot(p.F, p.H, { r: o.r ?? 4.5, color: col });
  }
}
/**
 * Maximum-likelihood fit of the binormal model to rating counts (Dorfman & Alf, 1969): noise N(0,1), signal N(mu, sig²),
 * m − 1 ordered boundaries b. o.equal fixes sig = 1. Returns {mu, sig, b, nll, k (parameters)} or null with too few trials.
 */
export function fitRating(M, nC, sC, o = {}) {
  const m = nC.length, Nn = nC.reduce((a, b) => a + b, 0), Ns = sC.reduce((a, b) => a + b, 0);
  if (Nn < 4 || Ns < 4) return null;
  const pts = cumROC(nC, sC).reverse(); // j = 1 … m − 1: boundary b_j
  const zF = pts.map((p) => zq(M, adj(p.kF, Nn))), zH = pts.map((p) => zq(M, adj(p.kH, Ns)));
  let slope = 1, icpt = M.mean(zH) - M.mean(zF);
  if (!o.equal && pts.length > 1) { const L = M.linreg(zF, zH); if (L.slope > 0.25 && L.slope < 4) { slope = L.slope; icpt = L.intercept; } }
  const sig0 = 1 / slope, mu0 = icpt * sig0;
  const b0 = zF.map((z) => -z); for (let i = 1; i < b0.length; i++) if (b0[i] < b0[i - 1] + 0.05) b0[i] = b0[i - 1] + 0.05;
  const unpack = (t) => {
    let i = 0; const mu = t[i++], sig = o.equal ? 1 : Math.exp(t[i++]), b = [t[i++]];
    while (b.length < m - 1) b.push(b[b.length - 1] + Math.exp(t[i++]));
    return { mu, sig, b };
  };
  const nll = (t) => {
    const { mu, sig, b } = unpack(t); let L = 0;
    for (let r = 0; r < m; r++) {
      const lo = r ? b[r - 1] : -Infinity, hi = r < m - 1 ? b[r] : Infinity;
      const pN = Math.max(1e-12, (hi === Infinity ? 1 : Phi(M, hi)) - (lo === -Infinity ? 0 : Phi(M, lo)));
      const pS = Math.max(1e-12, (hi === Infinity ? 1 : Phi(M, (hi - mu) / sig)) - (lo === -Infinity ? 0 : Phi(M, (lo - mu) / sig)));
      L -= nC[r] * Math.log(pN) + sC[r] * Math.log(pS);
    }
    const pen = Math.max(0, Math.abs(mu) - 8) + (o.equal ? 0 : Math.max(0, Math.abs(Math.log(sig)) - 2));
    return L + 1e3 * pen * pen;
  };
  const t0 = [mu0, ...(o.equal ? [] : [Math.log(Math.max(0.2, Math.min(5, sig0)))]), b0[0], ...b0.slice(1).map((x, i) => Math.log(Math.max(0.03, x - b0[i])))];
  const r = nelderMead(nll, t0, t0.map(() => 0.25), 2500);
  const P = unpack(r.x);
  return { ...P, nll: r.f, k: t0.length, Nn, Ns };
}
/** Expected rating proportions of a binormal fit: {pN: [...], pS: [...]} */
export function ratingProbs(M, f) {
  const m = f.b.length + 1, pN = [], pS = [];
  for (let r = 0; r < m; r++) {
    const lo = r ? f.b[r - 1] : -Infinity, hi = r < m - 1 ? f.b[r] : Infinity;
    pN.push((hi === Infinity ? 1 : Phi(M, hi)) - (lo === -Infinity ? 0 : Phi(M, lo)));
    pS.push((hi === Infinity ? 1 : Phi(M, (hi - f.mu) / f.sig)) - (lo === -Infinity ? 0 : Phi(M, (lo - f.mu) / f.sig)));
  }
  return { pN, pS };
}
/** Sensitivity of the simulated observer to a grating of contrast c (%): d′ = (c/5)^1.5, as in psych-1.8. */
export const dGrating = (c) => Math.pow(Math.max(0, c) / 5, 1.5);
/** The stimulus screen: grey background, pixel noise SD (grey levels), patch radius, Gabor envelope SD and frequency. */
export const SCR = { BG: 128, NS: 9, R: 0.42, SG: 0.14, FR: 4.6 };
/** Vertical Gabor gratings in pixel noise; list = [[cx, cy, contrast %]] (contrast 0 = noise only). Cached by key. */
export function gabors(st, M, list, key, seed, R = SCR.R) {
  const Rn = M.rng(seed), { BG, NS, SG, FR } = SCR;
  st.raster((x, y) => {
    for (const [cx, cy, c] of list) {
      const dx = x - cx, dy = y - cy, r2 = dx * dx + dy * dy;
      if (r2 > R * R) continue;
      const s = (R / SCR.R), val = BG + NS * Rn.normal() + (c ? ((c * BG) / 100) * Math.cos((2 * Math.PI * FR * dx) / s) * Math.exp(-r2 / (2 * SG * SG * s * s)) : 0);
      const g = M.clamp(Math.round(val), 0, 255); return [g, g, g];
    }
    return null;
  }, { res: 1, key, id: 'gabor' });
}
/** Corner brackets around a stimulus location (half-size q, arm d, grey value gv). */
export function brackets(st, cx, cy, q, d, gv) {
  for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) st.path([[cx + a * q, cy + b * (q - d)], [cx + a * q, cy + b * q], [cx + a * (q - d), cy + b * q]], { color: [gv, gv, gv], width: 2 });
}
/** Light grey text for the stimulus screen (readable on its fixed grey background in both themes). */
export const SCRTXT = [232, 232, 232];
