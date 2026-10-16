// Chemical Kinetics — Chapter 2: helpers shared by ch02.js and ch02-b.js
// Energies in eV (surfaces) or kJ/mol (Arrhenius items), lengths in angstrom, times in fs, masses in u.

export const R = 8.314462618e-3; // kJ/(mol K)
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// ---------------------------------------------------------------- LEPS surface for the collinear atom-transfer A + B-C -> A-B + C
// Morse curves for the singlet and (anti-Morse) triplet pair interactions, combined by the London-Eyring-Polanyi-Sato rule.
// x = r(AB), y = r(BC), r(AC) = x + y. All three atoms have the mass of hydrogen. Morse constants are those of H2.
export const H2 = { D: 4.746, beta: 1.942, re: 0.7414 }; // eV, 1/angstrom, angstrom (spectroscopic values of H2, quoted from memory)
export const MASS = 1.00794;                 // u
export const U_EV = 103.6427;                // 1 u (angstrom/fs)^2 in eV
export const M_EFF = 2 * MASS / 3 * U_EV;    // mass of the point in mass-scaled (skewed Cartesian) coordinates, eV fs^2 / angstrom^2

export function leps(x, y, P) {
  const DAB = P.DAB ?? H2.D, DBC = P.DBC ?? H2.D, DAC = P.DAC ?? H2.D, b = H2.beta, re = H2.re;
  const parts = (r, D) => {
    const e1 = Math.exp(-b * (r - re)), e2 = e1 * e1;
    const sing = D * (e2 - 2 * e1), trip = 0.5 * D * (e2 + 2 * e1);
    const s = sing, t = trip * P.w; // triplet weight w = (1+S)/(1-S); w = 1 is plain LEPS (barrier ~1 eV); the diatomic limit stays exactly Morse
    return [0.5 * (s + t), 0.5 * (s - t)];
  };
  const [q1, j1] = parts(x, DAB), [q2, j2] = parts(y, DBC), [q3, j3] = parts(x + y, DAC);
  const rad = 0.5 * ((j1 - j2) ** 2 + (j2 - j3) ** 2 + (j3 - j1) ** 2);
  return q1 + q2 + q3 - Math.sqrt(rad);
}
/** potential relative to separated A + BC at its equilibrium length */
export const vRel = (x, y, P) => leps(x, y, P) + (P.DBC ?? H2.D);

// skewed Cartesian picture: kinetic energy is (M/2)(X'^2 + Y'^2), so classical motion is a billiard-ball motion of one point
export const toXY = (x, y) => [x + y / 2, y * Math.sqrt(3) / 2];
export const fromXY = (X, Y) => [X - Y / Math.sqrt(3), 2 * Y / Math.sqrt(3)];
export const vXY = (X, Y, P) => { const [x, y] = fromXY(X, Y); return vRel(x, y, P); };

export function gradXY(X, Y, P, h = 1e-4) {
  return [(vXY(X + h, Y, P) - vXY(X - h, Y, P)) / (2 * h), (vXY(X, Y + h, P) - vXY(X, Y - h, P)) / (2 * h)];
}
export function hessXY(X, Y, P, h = 2e-3) {
  const f = (a, b) => vXY(a, b, P), f0 = f(X, Y);
  const xx = (f(X + h, Y) - 2 * f0 + f(X - h, Y)) / (h * h), yy = (f(X, Y + h) - 2 * f0 + f(X, Y - h)) / (h * h);
  const xy = (f(X + h, Y + h) - f(X + h, Y - h) - f(X - h, Y + h) + f(X - h, Y - h)) / (4 * h * h);
  return [[xx, xy], [xy, yy]];
}
/** eigen-decomposition of a symmetric 2x2: values ascending, unit vectors */
export function eig2(A) {
  const a = A[0][0], b = A[0][1], d = A[1][1], m = (a + d) / 2, r = Math.hypot((a - d) / 2, b);
  const l1 = m - r, l2 = m + r;
  const vec = (l) => { let v = Math.abs(b) > 1e-14 ? [b, l - a] : (Math.abs(l - a) < Math.abs(l - d) ? [1, 0] : [0, 1]); const n = Math.hypot(v[0], v[1]); return [v[0] / n, v[1] / n]; };
  return { values: [l1, l2], vectors: [vec(l1), vec(l2)] };
}

/** saddle point of the (symmetric) surface: minimum of V along x = y. Returns {s, V, X, Y}. For asymmetric surfaces the saddle is refined by Newton. */
export function saddle(P) {
  let a = 0.7, b = 2.2;
  const g = (s) => vRel(s, s, P);
  for (let i = 0; i < 60; i++) { const m1 = a + (b - a) * 0.382, m2 = a + (b - a) * 0.618; if (g(m1) < g(m2)) b = m2; else a = m1; }
  let s = (a + b) / 2, [X, Y] = toXY(s, s);
  for (let it = 0; it < 40; it++) { // Newton on grad = 0
    const gr = gradXY(X, Y, P), H = hessXY(X, Y, P), det = H[0][0] * H[1][1] - H[0][1] ** 2;
    if (Math.abs(det) < 1e-10) break;
    const dX = -(H[1][1] * gr[0] - H[0][1] * gr[1]) / det, dY = -(-H[0][1] * gr[0] + H[0][0] * gr[1]) / det;
    X += dX; Y += dY; if (Math.hypot(dX, dY) < 1e-9) break;
  }
  const [x, y] = fromXY(X, Y);
  return { x, y, X, Y, V: vXY(X, Y, P) };
}

/** minimum-energy path: steepest descent (with unit steps) from the saddle along the reaction coordinate, both directions.
 *  Returns a polyline [[X, Y], ...] ordered from reactants (A + BC, large x) through the saddle to products. */
export function mep(P, sd) {
  sd = sd || saddle(P);
  const H = hessXY(sd.X, sd.Y, P), E = eig2(H), u = E.vectors[0]; // negative eigenvalue direction
  const branch = (sign) => {
    let X = sd.X + sign * 0.02 * u[0], Y = sd.Y + sign * 0.02 * u[1]; const pts = [[X, Y]];
    for (let i = 0; i < 400; i++) {
      const g = gradXY(X, Y, P), n = Math.hypot(g[0], g[1]);
      if (n < 1e-5) break;
      X -= 0.02 * g[0] / n; Y -= 0.02 * g[1] / n; pts.push([X, Y]);
      const [x, y] = fromXY(X, Y); if (x > 4.2 || y > 4.2 || x < 0.2 || y < 0.2) break;
    }
    return pts;
  };
  const A = branch(1), B = branch(-1);
  // orient so that the first point has large x (reactant valley)
  const xs = (p) => fromXY(p[0], p[1])[0];
  let r = A, pr = B; if (xs(A[A.length - 1]) < xs(B[B.length - 1])) { r = B; pr = A; }
  return [...r.slice().reverse(), [sd.X, sd.Y], ...pr];
}

/** Classical trajectory by velocity Verlet in (X, Y). Returns {pts: [[X,Y]], outcome: 'reaction'|'reflected'|'trapped', t}. */
export function trajectory(P, X0, Y0, VX0, VY0, { dt = 0.1, tmax = 260, keep = true } = {}) {
  let X = X0, Y = Y0, VX = VX0, VY = VY0, g = gradXY(X, Y, P), t = 0; const pts = keep ? [[X, Y]] : null, en = keep ? [] : null; const energy = () => 0.5 * M_EFF * (VX * VX + VY * VY) + vXY(X, Y, P); if (keep) en.push(energy());
  let out = 'trapped';
  for (let i = 0; i * dt < tmax; i++) {
    VX -= 0.5 * dt * g[0] / M_EFF; VY -= 0.5 * dt * g[1] / M_EFF;
    X += dt * VX; Y += dt * VY;
    g = gradXY(X, Y, P);
    VX -= 0.5 * dt * g[0] / M_EFF; VY -= 0.5 * dt * g[1] / M_EFF; t += dt;
    if (keep && i % 2 === 0) { pts.push([X, Y]); en.push(energy()); }
    const [x, y] = fromXY(X, Y);
    if (x < 0.15 || y < 0.15) { out = 'trapped'; break; }
    if (y > 3.6 && x < 2.6 && VY > 0 && ((y - x) > 1.5)) { out = 'reaction'; break; }
    if (x > 3.6 && y < 2.6 && VX > 0 && ((x - y) > 1.5)) { out = 'reflected'; break; }
  }
  return { pts, en, outcome: out, t, dtStore: 2 * dt, X, Y, VX, VY };
}

/** Morse vibration of the diatomic BC (reduced mass m/2) with vibrational energy Ev above its minimum, started at the outer turning point
 *  and advanced by `phase` (0..1) of a period; returns [y, ydot]. Uses the surface itself with A far away (x = 6 angstrom). */
export function vibState(P, Ev, phase, xFar = 6) {
  const D = P.DBC ?? H2.D, b = H2.beta, re = H2.re, mu = MASS / 2 * U_EV;
  const morse = (y) => D * (Math.exp(-2 * b * (y - re)) - 2 * Math.exp(-b * (y - re))) + D;
  Ev = clamp(Ev, 1e-4, D * 0.98);
  const yo = re - Math.log(1 - Math.sqrt(Ev / D)) / b; // outer turning point: Morse energy = Ev
  const dm = (y) => D * (-2 * b * Math.exp(-2 * b * (y - re)) + 2 * b * Math.exp(-b * (y - re)));
  const dt = 0.05;
  // period by crossing: integrate until second return near the outer turning point (cap)
  let y = yo, vy = 0, a = -dm(y) / mu, t = 0, T = 0, crossed = 0, prevV = 0;
  const hist = [];
  for (let i = 0; i < 4000; i++) {
    vy += 0.5 * dt * a; y += dt * vy; a = -dm(y) / mu; vy += 0.5 * dt * a; t += dt;
    if (prevV < 0 && vy >= 0 && t > 1) { T = 2 * t; break; } // first return of vy to 0 is the inner turning point: half a period
    prevV = vy;
  }
  if (!T) T = 8;
  y = yo; vy = 0; a = -dm(y) / mu; const n = Math.round(phase * T / dt);
  for (let i = 0; i < n; i++) { vy += 0.5 * dt * a; y += dt * vy; a = -dm(y) / mu; vy += 0.5 * dt * a; }
  return { y, vy, T, morse };
}

/** initial condition for A + BC: A at x = xFar (from B), BC vibrating with energy Ev and phase, relative translational energy Et (eV) */
export function launch(P, Et, Ev, phase, xFar = 4.3) {
  const vs = vibState(P, Ev, phase), muR = 2 * MASS / 3 * U_EV;
  const Rdot = -Math.sqrt(2 * Et / muR), ydot = vs.vy, xdot = Rdot - ydot / 2;
  const x = xFar - vs.y / 2, y = vs.y; // R = x + y/2 = xFar
  const [X, Y] = toXY(x, y);
  // velocity in XY: X = x + y/2, Y = sqrt3/2 y
  return { X, Y, VX: xdot + ydot / 2, VY: ydot * Math.sqrt(3) / 2, T: vs.T };
}

// ---------------------------------------------------------------- generic helpers
export function logGrid(a, b, n) { const o = []; for (let i = 0; i < n; i++) o.push(a * Math.pow(b / a, i / (n - 1))); return o; }

// ---------------------------------------------------------------- 2D hard-disc gas (reduced units: mass 1, box side 1)
// Elastic collisions of equal discs of diameter d; every collision is recorded with its relative kinetic energy along the line of
// centres, E_n = (1/2) mu u_n^2 with mu = 1/2, in a histogram (so thresholds can be changed without rerunning).
export class DiscGas {
  constructor(N, d, kT, seed, v) {
    this.N = N; this.d = d; this.kT = kT; const r = v.rng(seed); this.rnd = r;
    this.x = new Float64Array(N); this.y = new Float64Array(N); this.vx = new Float64Array(N); this.vy = new Float64Array(N);
    // lattice start with jitter, 2D Maxwell velocities (each component normal with variance kT)
    const m = Math.ceil(Math.sqrt(N)), gap = 1 / m;
    for (let i = 0; i < N; i++) {
      this.x[i] = (0.5 + i % m) * gap + (r() - 0.5) * gap * 0.3; this.y[i] = (0.5 + Math.floor(i / m)) * gap + (r() - 0.5) * gap * 0.3;
      this.vx[i] = Math.sqrt(kT) * r.normal(); this.vy[i] = Math.sqrt(kT) * r.normal();
    }
    this.NB = 80; this.EMAX = 8; this.hist = new Float64Array(this.NB); this.time = 0; this.total = 0; this.recent = [];
    this.nc = Math.floor(1 / d);
  }
  setKT(kT) { const f = Math.sqrt(kT / this.kT); for (let i = 0; i < this.N; i++) { this.vx[i] *= f; this.vy[i] *= f; } this.kT = kT; this.resetCounts(); }
  resetCounts() { this.hist.fill(0); this.time = 0; this.total = 0; this.recent = []; }
  step(dt) {
    const { N, x, y, vx, vy, d } = this, d2 = d * d, nc = this.nc;
    for (let i = 0; i < N; i++) {
      x[i] += vx[i] * dt; y[i] += vy[i] * dt;
      if (x[i] < d / 2) { x[i] = d - x[i]; vx[i] = -vx[i]; } else if (x[i] > 1 - d / 2) { x[i] = 2 - d - x[i]; vx[i] = -vx[i]; }
      if (y[i] < d / 2) { y[i] = d - y[i]; vy[i] = -vy[i]; } else if (y[i] > 1 - d / 2) { y[i] = 2 - d - y[i]; vy[i] = -vy[i]; }
    }
    const cells = new Array(nc * nc);
    for (let i = 0; i < N; i++) { const c = Math.min(nc - 1, Math.floor(x[i] * nc)) + nc * Math.min(nc - 1, Math.floor(y[i] * nc)); (cells[c] || (cells[c] = [])).push(i); }
    for (let cy = 0; cy < nc; cy++) for (let cx = 0; cx < nc; cx++) {
      const A = cells[cx + nc * cy]; if (!A) continue;
      for (let ddy = -1; ddy <= 1; ddy++) for (let ddx = -1; ddx <= 1; ddx++) {
        const X = cx + ddx, Y = cy + ddy; if (X < 0 || Y < 0 || X >= nc || Y >= nc) continue;
        const B = cells[X + nc * Y]; if (!B) continue;
        for (const i of A) for (const j of B) if (i < j) {
          const ex = x[i] - x[j], ey = y[i] - y[j], q = ex * ex + ey * ey;
          if (q < d2 && q > 0) {
            const rr = Math.sqrt(q), nx = ex / rr, ny = ey / rr, un = (vx[i] - vx[j]) * nx + (vy[i] - vy[j]) * ny;
            if (un < 0) {
              vx[i] -= un * nx; vy[i] -= un * ny; vx[j] += un * nx; vy[j] += un * ny;
              const E = 0.25 * un * un, b = Math.min(this.NB - 1, Math.floor(E / this.kT / this.EMAX * this.NB));
              this.hist[b]++; this.total++; this.recent.push({ x: (x[i] + x[j]) / 2, y: (y[i] + y[j]) / 2, E: E / this.kT, age: 0 });
            }
          }
        }
      }
    }
    this.time += dt;
  }
  /** collisions per unit time with E_n >= E0 (E0 in units of kT), from the histogram (bin edges: the threshold is rounded to a bin) */
  count(E0) { const b0 = Math.ceil(E0 / this.EMAX * this.NB - 1e-9); let s = 0; for (let b = b0; b < this.NB; b++) s += this.hist[b]; return s; }
  /** dilute hard-disc theory (2D: the collision cross-section is a width 2d for discs of diameter d, so Z = (N^2 d / A)(mean relative speed)) including the Enskog pair-contact factor */
  theory(E0) {
    const N = this.N, d = this.d, eta = N * Math.PI * d * d / 4, g = (1 - 7 * eta / 16) / ((1 - eta) ** 2);
    const vrel = Math.sqrt(Math.PI * this.kT / 1); // mean relative speed in 2D for mu = 1/2: sqrt(pi kT / (2 mu))
    return { Z: N * (N - 1) * d * vrel * g * Math.exp(-E0), Z0: N * (N - 1) * d * vrel, g, eta };
  }
}
