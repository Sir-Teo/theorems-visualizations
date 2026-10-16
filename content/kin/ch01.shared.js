// Chemical Kinetics — Chapter 1: helpers shared by ch01.js and ch01-b.js
//
// Time-courses are integrated numerically (RK4 on a dense grid) from the rate law, and every "measured" derivative is a
// finite difference of that solution, never a closed form, unless a name says otherwise. Concentrations in mol/L (M).

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/**
 * Real data quoted from the LibreTexts chemistry course of Mount Royal University (Chem 1202, section 4.4, "Using Graphs to
 * Determine Rate Laws, Rate Constants, and Reaction Orders"), which tabulates them as worked textbook examples.
 */
export const DATA = {
  // 2 N2O5 -> 4 NO2 + O2 in CCl4 solution at 45 C; stated first-order constant k = 4.820e-4 per second
  n2o5: { t: [0, 600, 1200, 1800, 2400, 3000, 3600], c: [0.0365, 0.0274, 0.0206, 0.0157, 0.0117, 0.00860, 0.00640], kStated: 4.820e-4 },
  // 2 NO2 -> 2 NO + O2 at 330 C (second order in NO2)
  no2: { t: [0, 60, 120, 180, 240, 300, 360], c: [1.00e-2, 6.83e-3, 5.18e-3, 4.18e-3, 3.50e-3, 3.01e-3, 2.64e-3] },
  // 2 NO + 2 H2 -> N2 + 2 H2O at 1280 C; initial rates in M/s (textbook problem set, rate = k [NO]^2 [H2], k = 250 M^-2 s^-1)
  noh2: { no: [0.0050, 0.010, 0.010], h2: [0.0020, 0.0020, 0.0040], rate: [1.25e-5, 5.0e-5, 1.0e-4] },
};

/** Integrate y' = F(t, y) from t = 0 to T with n RK4 steps; returns {T, n, y} (y[i] = state at t = i T / n) and `at(t)` interpolation. */
export function solve(F, y0, T, n = 800) {
  const d = y0.length, h = T / n, Y = [y0.slice()];
  let y = y0.slice(), t = 0;
  const add = (a, b, s) => a.map((x, i) => x + s * b[i]);
  for (let i = 0; i < n; i++) {
    const k1 = F(t, y), k2 = F(t + h / 2, add(y, k1, h / 2)), k3 = F(t + h / 2, add(y, k2, h / 2)), k4 = F(t + h, add(y, k3, h));
    y = y.map((x, j) => x + h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
    t += h; Y.push(y);
  }
  const at = (tt) => {
    const u = clamp(tt / T, 0, 1) * n, i = Math.min(n - 1, Math.floor(u)), f = u - i;
    return Y[i].map((x, j) => x + f * (Y[i + 1][j] - x));
  };
  /** centred finite-difference derivative of every component at time tt (step = 3 grid cells) */
  const deriv = (tt) => {
    const e = 3 * h, a = clamp(tt - e, 0, T - 2 * e), b = a + 2 * e, ya = at(a), yb = at(b);
    return ya.map((x, j) => (yb[j] - x) / (2 * e));
  };
  return { T, n, y: Y, at, deriv };
}

/** Gaussian multiplicative noise generator seeded for reproducible pictures. */
export const noiser = (v, seed) => { const r = v.rng(seed); return () => r.normal(); };

/** Least-squares fit of first-order decay: ln c = ln c0 - k t (points with c <= 0 skipped). */
export function fitFirst(M, ts, cs) {
  const x = [], y = [];
  ts.forEach((t, i) => { if (cs[i] > 0) { x.push(t); y.push(Math.log(cs[i])); } });
  if (x.length < 3) return null;
  const f = M.linreg(x, y);
  return { k: -f.slope, se: f.seSlope, c0: Math.exp(f.intercept), r2: f.r2, f };
}

/** Least-squares fit of second-order decay: 1/c = 1/c0 + k t. */
export function fitSecond(M, ts, cs) {
  const x = [], y = [];
  ts.forEach((t, i) => { if (cs[i] > 0) { x.push(t); y.push(1 / cs[i]); } });
  if (x.length < 3) return null;
  const f = M.linreg(x, y);
  return { k: f.slope, se: f.seSlope, c0: 1 / f.intercept, r2: f.r2, f };
}

/** Sum of squared residuals of a model on data. */
export const sse = (ts, cs, model) => ts.reduce((s, t, i) => s + (cs[i] - model(t)) ** 2, 0);

/** Format a rate constant with its unit as TeX for the order p (units M^(1-p) s^-1). */
export function kUnit(p) {
  const e = 1 - p; // exponent of M
  const q = Math.round(e * 2) / 2;
  const m = q === 0 ? '' : q === 1 ? '\\,\\mathrm{M}' : `\\,\\mathrm{M}^{${q}}`;
  return `${m}\\,\\mathrm{s}^{-1}`.replace(/^\\,/, '');
}

/** Format x as TeX scientific notation using v.sci when large/small, else fixed. */
export function nice(v, x, d = 3) {
  if (!isFinite(x)) return '\\infty';
  const a = Math.abs(x);
  if (a === 0) return '0';
  if (a >= 0.01 && a < 1000) return v.fix(x, a < 0.1 ? d + 1 : a < 10 ? d : d - 1);
  return v.sci(x, d);
}

// ------------------------------------------------------------------------------------------------------------------
// A two-dimensional gas of discs in a unit box with reflecting walls, used to count elementary events by molecularity.
// "Events": unimolecular (each molecule reacts with probability k dt per step), bimolecular (a pair comes within distance d)
// and termolecular (three molecules mutually within d for the first time). Reacted molecules are replaced (the concentration
// is held fixed), so the counted events per unit time are the reaction rate at that concentration.
export class GasBox {
  constructor(N, seed, d = 0.02, k1 = 0.5, speed = 1) {
    const r = this.r = (() => { let a = (seed * 2654435761) >>> 0 || 1; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; })();
    this.N = N; this.d = d; this.k1 = k1;
    this.x = new Float64Array(N); this.y = new Float64Array(N); this.vx = new Float64Array(N); this.vy = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      this.x[i] = r(); this.y[i] = r();
      const th = 2 * Math.PI * r(), s = speed * Math.sqrt(-2 * Math.log(1 - r() * 0.999)) * 0.8;
      this.vx[i] = s * Math.cos(th); this.vy[i] = s * Math.sin(th);
    }
    this.nc = Math.max(1, Math.floor(1 / d)); this.cells = new Array(this.nc * this.nc);
    this.prevPairs = new Set(); this.prevTrip = new Set();
    this.count = [0, 0, 0]; this.time = 0; this.flash = []; // flash: {type, x, y, x2, y2, age}
  }
  step(dt, keepFlash = false) {
    const { N, x, y, vx, vy, d, nc } = this;
    for (let i = 0; i < N; i++) {
      x[i] += vx[i] * dt; y[i] += vy[i] * dt;
      if (x[i] < 0) { x[i] = -x[i]; vx[i] = -vx[i]; } else if (x[i] > 1) { x[i] = 2 - x[i]; vx[i] = -vx[i]; }
      if (y[i] < 0) { y[i] = -y[i]; vy[i] = -vy[i]; } else if (y[i] > 1) { y[i] = 2 - y[i]; vy[i] = -vy[i]; }
    }
    // unimolecular events
    const p1 = this.k1 * dt;
    for (let i = 0; i < N; i++) if (this.r() < p1) { this.count[0]++; if (keepFlash) this.flash.push({ type: 0, x: x[i], y: y[i], age: 0 }); }
    // neighbour lists by cell hashing
    const cells = this.cells; for (let c = 0; c < cells.length; c++) cells[c] = null;
    for (let i = 0; i < N; i++) {
      const cx = Math.min(nc - 1, Math.floor(x[i] * nc)), cy = Math.min(nc - 1, Math.floor(y[i] * nc)), c = cy * nc + cx;
      (cells[c] || (cells[c] = [])).push(i);
    }
    const nb = Array.from({ length: N }, () => []), pairs = new Set(), d2 = d * d;
    for (let cy = 0; cy < nc; cy++) for (let cx = 0; cx < nc; cx++) {
      const A = cells[cy * nc + cx]; if (!A) continue;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = cx + dx, Y = cy + dy; if (X < 0 || Y < 0 || X >= nc || Y >= nc) continue;
        const B = cells[Y * nc + X]; if (!B) continue;
        for (const i of A) for (const j of B) if (i < j) {
          const ex = x[i] - x[j], ey = y[i] - y[j];
          if (ex * ex + ey * ey < d2) { nb[i].push(j); nb[j].push(i); pairs.add(i * N + j); }
        }
      }
    }
    let nPair = 0; const trip = new Set();
    for (const key of pairs) {
      if (!this.prevPairs.has(key)) { nPair++; if (keepFlash) { const i = Math.floor(key / N), j = key % N; this.flash.push({ type: 1, x: x[i], y: y[i], x2: x[j], y2: y[j], age: 0 }); } }
      const i = Math.floor(key / N), j = key % N;
      for (const k of nb[i]) if (k > j && nb[j].includes(k)) trip.add((i * N + j) * N + k);
    }
    let nTrip = 0;
    for (const key of trip) if (!this.prevTrip.has(key)) {
      nTrip++;
      if (keepFlash) { const k = key % N, j = Math.floor(key / N) % N, i = Math.floor(key / (N * N)); this.flash.push({ type: 2, x: (x[i] + x[j] + x[k]) / 3, y: (y[i] + y[j] + y[k]) / 3, age: 0 }); }
    }
    this.prevPairs = pairs; this.prevTrip = trip;
    this.count[1] += nPair; this.count[2] += nTrip; this.time += dt;
  }
}
