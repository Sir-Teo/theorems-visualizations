// Thermodynamics & Statistical Mechanics — Chapter 2: helpers shared by ch02.js and ch02-b.js
//
// Part 1 is the exact event-driven hard-sphere gas of chapter 1 (copied here so the chapters stay independent).
// Units: molecular diameter σ = 1, mass m = 1, Boltzmann's constant k = 1, so a temperature is an energy and the
// thermal speed √(kT/m) is 1 at T = 1. Pressures come out in kT/σ³ (at T = 1), volumes in σ³.
// Part 2 holds ideal-gas formulas (SI-ish: n in mol, V in L, P in kPa, so P·V is in J) and drawing helpers for
// engines: energy-flow bands, reservoirs, a piston cylinder, and moving packets.

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;

/** Gamma(dof/2) variate with unit scale: half the sum of dof squared standard normals (dof = 0 → 0). */
export function gammaHalf(R, dof) { let s = 0; for (let k = 0; k < dof; k++) { const z = R.normal(); s += z * z; } return 0.5 * s; }

/**
 * Event-driven hard spheres in the cylinder 0 ≤ x ≤ X (piston), 0 ≤ y ≤ Ly, 0 ≤ z ≤ Lz. Walls reflect the molecular
 * centres, so the volume open to the gas is X·Ly·Lz. Every event (molecule–molecule, molecule–wall, piston or plate
 * reaching a stop) is found exactly, so impacts are never missed and the pressure is a tally of real impulses.
 *
 * o = {
 *   species: [{ m, d, dof, T? }]  mass, diameter, internal quadratic degrees of freedom (0 = monatomic, 2 = diatomic
 *                                 rotation, 3 = nonlinear rotation), optional starting temperature
 *   counts: [n per species], side: [0 | 1 per species] (which side of the plate it starts on)
 *   Ly, Lz, T (start temperature), rng,
 *   piston: { X, U = 0, M = Infinity (driven by the program) or a mass, F = external force pushing in, lo, hi }
 *   plate:  { X, U = 0, M = Infinity (fixed) or a mass, lo, hi }   optional partition: side 0 left of it, side 1 right
 *   thermal: [x=0, –, y=0, y=Ly, z=0, z=Lz] booleans for heat-bath walls at temperature Tb
 *   diffuse: same layout, walls that scatter molecules in random directions at unchanged speed (adiabatic but isotropizing)
 * }
 * Internal energy: in a molecule–molecule collision the energy of the normal relative motion and both molecules'
 * internal energies are pooled and re-split by a Dirichlet(1, dof_i/2, dof_j/2) draw. Colliding pairs carry that pool
 * with exactly this distribution in equilibrium, so the rule preserves the canonical ensemble (detailed balance) while
 * conserving energy and momentum; it stands in for the rotational energy of real molecules.
 * Wall ids: 0 x=0 · 1 piston · 2 y=0 · 3 y=Ly · 4 z=0 · 5 z=Lz · 6 plate (left face) · 7 plate (right face).
 */
export function hsGas(o) {
  const SP = o.species, R = o.rng, counts = o.counts || [o.N], N = counts.reduce((a, b) => a + b, 0);
  const x = new Float64Array(N), y = new Float64Array(N), z = new Float64Array(N);
  const vx = new Float64Array(N), vy = new Float64Array(N), vz = new Float64Array(N);
  const m = new Float64Array(N), d = new Float64Array(N), e = new Float64Array(N);
  const S = new Int8Array(N), side = new Int8Array(N), dof = new Int8Array(N);
  const tP = new Float64Array(N), jP = new Int32Array(N), cP = new Int32Array(N), cc = new Int32Array(N);
  const tW = new Float64Array(N), wW = new Int8Array(N);
  { let k = 0; counts.forEach((c, s) => { for (let q = 0; q < c; q++, k++) { S[k] = s; m[k] = SP[s].m ?? 1; d[k] = SP[s].d ?? 1; dof[k] = SP[s].dof ?? 0; side[k] = (o.side && o.side[s]) || 0; } }); }
  const pist = Object.assign({ X: 20, U: 0, M: Infinity, F: 0, lo: 1, hi: 1e9, rest: false }, o.piston || {});
  let plate = o.plate ? Object.assign({ X: 10, U: 0, M: Infinity, lo: 0, hi: 1e9 }, o.plate) : null;
  const G = {
    N, x, y, z, vx, vy, vz, m, d, e, S, side, dof, SP, Ly: o.Ly ?? 10, Lz: o.Lz ?? 10, pist, plate, t: 0,
    thermal: o.thermal || [0, 0, 0, 0, 0, 0], diffuse: o.diffuse || [0, 0, 0, 0, 0, 0], Tb: o.Tb ?? o.T ?? 1, exchange: o.exchange ?? 1,
    imp: new Float64Array(8), hits: new Float64Array(8), impS: new Float64Array(SP.length),
    Wp: 0, Qb: 0, Ep: [0, 0], ncol: 0, Vint: 0, Aint: 0, tPist: Infinity, tPlate: Infinity, onWall: null,
  };
  const acc = () => (pist.M < Infinity && !pist.rest ? -pist.F / pist.M : 0);
  const xr = (i) => (plate && side[i] === 0 ? plate.X : pist.X);       // right boundary of i's region
  const xl = (i) => (plate && side[i] === 1 ? plate.X : 0);            // left boundary
  // ---- placement
  for (let i = 0; i < N; i++) {
    const T0 = SP[S[i]].T ?? o.T ?? 1;
    for (let tries = 0; tries < 4000; tries++) {
      const a = xl(i), b = xr(i);
      x[i] = a + 0.02 + R() * Math.max(0.01, b - a - 0.04); y[i] = R() * G.Ly; z[i] = R() * G.Lz;
      let ok = true;
      for (let j = 0; j < i && ok; j++) {
        if (side[j] !== side[i]) continue;
        const dd = (d[i] + d[j]) / 2 * 1.001, dx = x[i] - x[j], dy = y[i] - y[j], dz = z[i] - z[j];
        if (dx * dx + dy * dy + dz * dz < dd * dd) ok = false;
      }
      if (ok) break;
    }
    const sd = Math.sqrt(T0 / m[i]);
    vx[i] = sd * R.normal(); vy[i] = sd * R.normal(); vz[i] = sd * R.normal(); e[i] = T0 * gammaHalf(R, dof[i]);
  }
  // ---- predictions
  const per = !!o.periodic, dmax = Math.max(...SP.map((q) => q.d ?? 1));
  const my = (q) => (per ? q - G.Ly * Math.round(q / G.Ly) : q), mz = (q) => (per ? q - G.Lz * Math.round(q / G.Lz) : q);
  let vcap = 0;
  const speedCap = () => { vcap = 0; for (let i = 0; i < N; i++) vcap = Math.max(vcap, Math.hypot(vx[i], vy[i], vz[i])); vcap = 1.1 * vcap + 1e-9; };
  speedCap();
  const pairT = (i, j) => {
    const dx = x[i] - x[j], dy = my(y[i] - y[j]), dz = mz(z[i] - z[j]), ux = vx[i] - vx[j], uy = vy[i] - vy[j], uz = vz[i] - vz[j];
    const b = dx * ux + dy * uy + dz * uz; if (b >= 0) return Infinity;
    const u2 = ux * ux + uy * uy + uz * uz, dd = (d[i] + d[j]) / 2, c = dx * dx + dy * dy + dz * dz - dd * dd, disc = b * b - u2 * c;
    if (disc <= 0) return Infinity;
    return c <= 0 ? 0 : c / (-b + Math.sqrt(disc));
  };
  const predictPair = (i) => {
    let tb = Infinity, jb = -1; const si = side[i];
    if (per) { tb = Math.max(1e-6, (Math.min(G.Ly, G.Lz) / 2 - dmax) / (Math.hypot(vx[i], vy[i], vz[i]) + vcap)); jb = -2; }
    for (let j = 0; j < N; j++) { if (j === i || side[j] !== si) continue; const t = pairT(i, j); if (t < tb) { tb = t; jb = j; } }
    tP[i] = G.t + tb; jP[i] = jb; cP[i] = jb >= 0 ? cc[jb] : 0;
  };
  const predictWall = (i) => {
    let tb = Infinity, wb = -1, t;
    if (!per) {
    if (vy[i] > 0) { t = (G.Ly - y[i]) / vy[i]; if (t < tb) { tb = t; wb = 3; } } else if (vy[i] < 0) { t = -y[i] / vy[i]; if (t < tb) { tb = t; wb = 2; } }
    if (vz[i] > 0) { t = (G.Lz - z[i]) / vz[i]; if (t < tb) { tb = t; wb = 5; } } else if (vz[i] < 0) { t = -z[i] / vz[i]; if (t < tb) { tb = t; wb = 4; } }
    }
    const v = vx[i];
    if (plate && side[i] === 1) { if (plate.U > v) { t = Math.max(0, x[i] - plate.X) / (plate.U - v); if (t < tb) { tb = t; wb = 7; } } }
    else if (v < 0) { t = -x[i] / v; if (t < tb) { tb = t; wb = 0; } }
    if (plate && side[i] === 0) { if (v > plate.U) { t = Math.max(0, plate.X - x[i]) / (v - plate.U); if (t < tb) { tb = t; wb = 6; } } }
    else {
      const D = Math.max(0, pist.X - x[i]), B = v - pist.U, A = -acc() / 2, q = B + Math.sqrt(Math.max(0, B * B + 4 * A * D));
      if (q > 0) { t = 2 * D / q; if (t < tb) { tb = t; wb = 1; } }
    }
    tW[i] = G.t + Math.max(0, tb); wW[i] = wb;
  };
  const predictPist = () => {
    G.tPist = Infinity;
    if (!(pist.M < Infinity)) return;
    const a = acc(), U = pist.U;
    if (pist.rest && U === 0) return;
    // time to reach lo: X + U t + a t²/2 = lo ; and hi
    const root = (target) => {
      const D = target - pist.X; // solve a/2 t² + U t − D = 0
      if (Math.abs(a) < 1e-14) { const t = U !== 0 ? D / U : Infinity; return t > 1e-12 ? t : Infinity; }
      const disc = U * U + 2 * a * D; if (disc < 0) return Infinity;
      const s = Math.sqrt(disc), t1 = (-U - s) / a, t2 = (-U + s) / a;
      let best = Infinity; for (const tt of [t1, t2]) if (tt > 1e-12 && tt < best) best = tt;
      return best;
    };
    G.tPist = G.t + Math.min(root(pist.lo), root(pist.hi));
  };
  const predictPlate = () => {
    G.tPlate = Infinity;
    if (!plate || !(plate.M < Infinity) || plate.U === 0) return;
    const t = plate.U > 0 ? (plate.hi - plate.X) / plate.U : (plate.lo - plate.X) / plate.U;
    G.tPlate = G.t + Math.max(0, t);
  };
  G.repredict = () => { for (let i = 0; i < N; i++) { predictPair(i); predictWall(i); } predictPist(); predictPlate(); };
  const rewall = () => { for (let i = 0; i < N; i++) predictWall(i); predictPist(); predictPlate(); };
  G.repredict();
  // ---- motion
  const drift = (dt) => {
    if (dt <= 0) return;
    for (let i = 0; i < N; i++) { x[i] += vx[i] * dt; y[i] += vy[i] * dt; z[i] += vz[i] * dt; }
    if (per) for (let i = 0; i < N; i++) { y[i] -= G.Ly * Math.floor(y[i] / G.Ly); z[i] -= G.Lz * Math.floor(z[i] / G.Lz); }
    const a = acc(), X0 = pist.X;
    pist.X += pist.U * dt + 0.5 * a * dt * dt; pist.U += a * dt;
    if (plate) plate.X += plate.U * dt;
    const Xm = (X0 + pist.X) / 2;
    G.Vint += Xm * G.Ly * G.Lz * dt;
    G.Aint += 2 * (G.Ly * G.Lz + (per ? 0 : Xm * (G.Ly + G.Lz))) * dt;
    G.t += dt;
  };
  const ke = (i) => 0.5 * m[i] * (vx[i] * vx[i] + vy[i] * vy[i] + vz[i] * vz[i]);
  const bath = (i, w) => {
    const T = G.Tb, sd = Math.sqrt(T / m[i]), vn = sd * Math.sqrt(-2 * Math.log(1 - R())), E0 = ke(i) + e[i];
    const ax = w >> 1, sg = (w & 1) ? -1 : 1;
    vx[i] = ax === 0 ? sg * vn : sd * R.normal(); vy[i] = ax === 1 ? sg * vn : sd * R.normal(); vz[i] = ax === 2 ? sg * vn : sd * R.normal();
    e[i] = T * gammaHalf(R, dof[i]);
    G.Qb += ke(i) + e[i] - E0;
  };
  // diffuse elastic wall: the molecule leaves with the same speed in a random direction (Lambert's cosine law),
  // which keeps the gas isotropic without adding or removing energy
  const diffuse = (i, w) => {
    const sp = Math.hypot(vx[i], vy[i], vz[i]), c = Math.sqrt(R()), sn = Math.sqrt(1 - c * c), ph = 2 * Math.PI * R();
    const ax = w >> 1, sg = (w & 1) ? -1 : 1, t1 = sp * sn * Math.cos(ph), t2 = sp * sn * Math.sin(ph), vn = sg * sp * c;
    if (ax === 0) { vx[i] = vn; vy[i] = t1; vz[i] = t2; } else if (ax === 1) { vy[i] = vn; vx[i] = t1; vz[i] = t2; } else { vz[i] = vn; vx[i] = t1; vy[i] = t2; }
  };
  const hitWall = (i, w) => {
    const mi = m[i]; let J = 0;
    if (G.diffuse[w] && !G.thermal[w] && (w === 0 || w >= 2) && w <= 5) {
      const ax = w >> 1, V = ax === 0 ? vx : ax === 1 ? vy : vz, vin = Math.abs(V[i]);
      diffuse(i, w); J = mi * (vin + Math.abs(V[i]));
      if (ax === 0) x[i] = 0; else if (ax === 1) y[i] = w === 2 ? 0 : G.Ly; else z[i] = w === 4 ? 0 : G.Lz;
    } else if (w === 2 || w === 3) { J = 2 * mi * Math.abs(vy[i]); if (G.thermal[w]) bath(i, w); else vy[i] = -vy[i]; y[i] = w === 2 ? 0 : G.Ly; }
    else if (w === 4 || w === 5) { J = 2 * mi * Math.abs(vz[i]); if (G.thermal[w]) bath(i, w); else vz[i] = -vz[i]; z[i] = w === 4 ? 0 : G.Lz; }
    else if (w === 0) { J = 2 * mi * Math.abs(vx[i]); if (G.thermal[0]) bath(i, 0); else vx[i] = -vx[i]; x[i] = 0; }
    else {
      const P = w === 1 ? pist : plate, v = vx[i], E0 = 0.5 * mi * v * v;
      let v2;
      if (P.M < Infinity) { const U = P.U, Mw = P.M; v2 = ((mi - Mw) * v + 2 * Mw * U) / (mi + Mw); P.U = ((Mw - mi) * U + 2 * mi * v) / (mi + Mw); if (w === 1) P.rest = false; }
      else v2 = 2 * P.U - v;
      vx[i] = v2; x[i] = P.X; J = mi * Math.abs(v - v2);
      const dE = 0.5 * mi * v2 * v2 - E0;
      if (w === 1) G.Wp += dE; else G.Ep[side[i]] += dE;
    }
    G.imp[w] += J; G.hits[w]++; G.impS[S[i]] += J;
    if (G.onWall) G.onWall(i, w, J);
    return w === 1 || w >= 6 ? (w === 1 ? pist.M : plate.M) < Infinity : false;
  };
  const collide = (i, j) => {
    const dx = x[i] - x[j], dy = my(y[i] - y[j]), dz = mz(z[i] - z[j]), r = Math.hypot(dx, dy, dz) || 1;
    const nx = dx / r, ny = dy / r, nz = dz / r, un = (vx[i] - vx[j]) * nx + (vy[i] - vy[j]) * ny + (vz[i] - vz[j]) * nz;
    const mu = m[i] * m[j] / (m[i] + m[j]);
    let un2 = -un;
    if ((dof[i] || dof[j]) && R() < G.exchange) {
      const E = 0.5 * mu * un * un + e[i] + e[j];
      const g0 = -Math.log(1 - R()), gi = gammaHalf(R, dof[i]), gj = gammaHalf(R, dof[j]), sum = g0 + gi + gj;
      un2 = Math.sqrt(2 * E * g0 / sum / mu); e[i] = E * gi / sum; e[j] = E * gj / sum;
    }
    const J = mu * (un2 - un);
    vx[i] += J / m[i] * nx; vy[i] += J / m[i] * ny; vz[i] += J / m[i] * nz;
    vx[j] -= J / m[j] * nx; vy[j] -= J / m[j] * ny; vz[j] -= J / m[j] * nz;
    G.ncol++;
  };
  /** Run the gas for a time T (events processed exactly in order). */
  G.advance = (T) => {
    const tEnd = G.t + T;
    for (let guard = 0; guard < 400000; guard++) {
      let tm = Infinity, i = -1, kind = 0;
      for (let k = 0; k < N; k++) { if (tP[k] < tm) { tm = tP[k]; i = k; kind = 1; } if (tW[k] < tm) { tm = tW[k]; i = k; kind = 2; } }
      if (G.tPist < tm) { tm = G.tPist; kind = 3; }
      if (G.tPlate < tm) { tm = G.tPlate; kind = 4; }
      if (tm > tEnd) break;
      drift(tm - G.t);
      if (kind === 1) {
        const j = jP[i];
        if (j < 0 || cP[i] !== cc[j]) { predictPair(i); continue; }
        collide(i, j); cc[i]++; cc[j]++;
        if (per && (Math.hypot(vx[i], vy[i], vz[i]) > vcap || Math.hypot(vx[j], vy[j], vz[j]) > vcap)) { speedCap(); G.repredict(); continue; }
        predictPair(i); predictPair(j); predictWall(i); predictWall(j);
      } else if (kind === 2) {
        const moved = hitWall(i, wW[i]); cc[i]++;
        if (per && Math.hypot(vx[i], vy[i], vz[i]) > vcap) { speedCap(); G.repredict(); continue; }
        if (moved) rewall(); else predictWall(i);
        predictPair(i);
      } else if (kind === 3) {
        const atLo = Math.abs(pist.X - pist.lo) < Math.abs(pist.X - pist.hi);
        pist.X = atLo ? pist.lo : pist.hi; pist.U = 0; pist.rest = atLo ? pist.F >= 0 : pist.F < 0; rewall();
      } else if (kind === 4) {
        plate.X = plate.U > 0 ? plate.hi : plate.lo; plate.U = -plate.U; rewall();
      }
    }
    drift(tEnd - G.t);
  };
  /** Friction on a free piston over a time h (drag coefficient gamma); the heat it makes is returned to the gas. */
  G.pistonFriction = (gamma, h) => {
    if (!(pist.M < Infinity) || !pist.U) return 0;
    const f = Math.exp(-gamma * h / pist.M), dE = 0.5 * pist.M * pist.U * pist.U * (1 - f * f);
    pist.U *= f; G.Wf = (G.Wf || 0) + dE; G.heat(dE); return dE;
  };
  /** Driven piston: set its velocity (the program moves it; molecules bounce off it in its own frame). */
  G.setU = (U) => { pist.U = U; rewall(); };
  /** Move a driven piston instantly to X (only outward or into empty space is safe; molecules beyond X are pushed back). */
  G.setX = (X) => { pist.X = X; for (let i = 0; i < N; i++) if (x[i] > X && !(plate && side[i] === 0)) x[i] = X - 1e-6; rewall(); };
  /** Kinetic energy, internal energy, count and temperature estimate of one side (or all with s = -1). */
  G.stats = (s = -1) => {
    let K = 0, E = 0, n = 0, f = 0, Kx = 0;
    for (let i = 0; i < N; i++) { if (s >= 0 && side[i] !== s) continue; const k = ke(i); K += k; Kx += 0.5 * m[i] * vx[i] * vx[i]; E += e[i]; n++; f += 3 + dof[i]; }
    return { K, E, U: K + E, n, f, T: f ? 2 * (K + E) / f : 0, Ttr: n ? 2 * K / (3 * n) : 0, Kx };
  };
  /** Add energy Q to side s by scaling the molecular velocities (an instant heater); Q < 0 cools. */
  G.heat = (Q, s = -1) => {
    const st = G.stats(s); if (st.K <= 0) return;
    const f = Math.sqrt(Math.max(0.05, (st.K + Q) / st.K));
    for (let i = 0; i < N; i++) { if (s >= 0 && side[i] !== s) continue; vx[i] *= f; vy[i] *= f; vz[i] *= f; cc[i]++; }
    speedCap(); G.repredict();
  };
  /** Rescale side s to temperature T (translation and internal energy). */
  G.setT = (T, s = -1) => {
    const st = G.stats(s); if (st.K <= 0) return;
    const f = Math.sqrt(T / st.Ttr), g = st.E > 0 ? T / (2 * st.E / Math.max(1, st.f - 3 * st.n)) : 1;
    for (let i = 0; i < N; i++) { if (s >= 0 && side[i] !== s) continue; vx[i] *= f; vy[i] *= f; vz[i] *= f; e[i] *= g; cc[i]++; }
    speedCap(); G.repredict();
  };
  /** Remove the partition: both sides become one region (free expansion). */
  G.removePlate = () => { if (!plate) return; plate = null; G.plate = null; side.fill(0); G.repredict(); };
  G.volume = () => pist.X * G.Ly * G.Lz;
  G.snap = () => ({ t: G.t, imp: Array.from(G.imp), hits: Array.from(G.hits), impS: Array.from(G.impS), Wp: G.Wp, Qb: G.Qb, Ep: G.Ep.slice(), Vint: G.Vint, Aint: G.Aint, ncol: G.ncol });
  /** Window averages between two snapshots: piston pressure, pressure on all walls, mean volume, wall hits. */
  G.meas = (a, b) => {
    const dt = Math.max(1e-12, b.t - a.t), A = G.Ly * G.Lz;
    const sum = (k) => b.imp[k] - a.imp[k];
    const all = [0, 1, 2, 3, 4, 5].reduce((s, k) => s + sum(k), 0);
    return { dt, pPist: sum(1) / (A * dt), pAll: all / Math.max(1e-12, b.Aint - a.Aint), V: (b.Vint - a.Vint) / dt, hits: b.hits.reduce((s, q) => s + q, 0) - a.hits.reduce((s, q) => s + q, 0), W: b.Wp - a.Wp, Q: b.Qb - a.Qb, impS: b.impS.map((q, k) => q - a.impS[k]), Aint: b.Aint - a.Aint };
  };
  return G;
}

/** Carnahan–Starling compressibility factor of hard spheres at packing fraction η. */
/** n-step colour ramp between two palette colours (arrays, cheap to pass to the stage). */
export function ramp(v, a, b, n = 24, c) {
  const A = v.rgb(a), B = v.rgb(b), C = c ? v.rgb(c) : null;
  return Array.from({ length: n }, (_, k) => {
    const t = k / (n - 1);
    if (!C) return [0, 1, 2].map((q) => A[q] + (B[q] - A[q]) * t);
    return t < 0.5 ? [0, 1, 2].map((q) => A[q] + (C[q] - A[q]) * 2 * t) : [0, 1, 2].map((q) => C[q] + (B[q] - C[q]) * (2 * t - 1));
  });
}
export const pick = (rmp, t) => rmp[Math.round(clamp(t, 0, 1) * (rmp.length - 1))];

/**
 * Side view of the cylinder and its molecules (x right, y up, depth z shown by fading). o = {x0, y0 (offset of the
 * cylinder's inner corner in stage units), scale (stage units per σ), color(i) → colour, wallColor, piston: true,
 * pistonColor, rod: length of the piston rod, fill, len: drawn length of the cylinder, hot: [side] bath walls}.
 */
export function drawGas(s, G, o = {}) {
  const x0 = o.x0 ?? 0, y0 = o.y0 ?? 0, k = o.scale ?? 1, H = G.Ly * k, X = G.pist.X * k, Lc = (o.len ?? G.pist.X) * k;
  const wc = o.wallColor || 'ink', pw = o.pistonWidth ?? 1.1 * k;
  if (o.fill) s.rect(x0, y0, x0 + X, y0 + H, { fill: o.fill, fillAlpha: o.fillAlpha ?? 0.08, stroke: false });
  if (o.bathLeft) s.rect(x0 - 1.2 * k, y0 - 0.6 * k, x0 - 0.15 * k, y0 + H + 0.6 * k, { fill: o.bathLeft, fillAlpha: 0.35, stroke: false });
  // molecules back to front
  const idx = o._idx && o._idx.length === G.N ? o._idx : (o._idx = Array.from({ length: G.N }, (_, i) => i));
  idx.sort((a, b) => G.z[b] - G.z[a]);
  const rpx = Math.max(1.6, 0.5 * k * s.scale);
  for (const i of idx) {
    const f = 1 - 0.5 * G.z[i] / G.Lz, r = Math.max(1.4, (o.rScale ?? 1) * rpx * G.d[i]);
    s.dot(x0 + G.x[i] * k, y0 + G.y[i] * k, { r, color: o.color ? o.color(i) : 'accent', alpha: 0.35 + 0.6 * f, ring: false });
  }
  // walls (dashed when the gas repeats periodically sideways)
  const sideSt = o.periodic ? { color: 'muted', width: 1.4, dash: [5, 4] } : { color: wc, width: 2.4 };
  s.line(x0, y0, x0 + Lc, y0, sideSt);
  s.line(x0, y0 + H, x0 + Lc, y0 + H, sideSt);
  s.line(x0, y0, x0, y0 + H, { color: o.leftColor || wc, width: o.leftWidth ?? 2.4 });
  if (G.plate) {
    const Xp = x0 + G.plate.X * k;
    s.rect(Xp - 0.12 * k, y0, Xp + 0.12 * k, y0 + H, { fill: o.plateColor || 'muted', fillAlpha: 0.9, color: o.plateColor || 'muted', width: 1 });
  }
  if (o.piston !== false) {
    s.rect(x0 + X, y0 + 0.05 * k, x0 + X + pw, y0 + H - 0.05 * k, { fill: o.pistonColor || 'orange', fillAlpha: 0.55, color: o.pistonColor || 'orange', width: 1.6 });
    if (o.rod) s.line(x0 + X + pw, y0 + H / 2, x0 + X + pw + o.rod * k, y0 + H / 2, { color: o.pistonColor || 'orange', width: 3.5, alpha: 0.85 });
  } else s.line(x0 + Lc, y0, x0 + Lc, y0 + H, { color: wc, width: 2.4 });
}

/** Running window of measurement snapshots: keeps the last `len` simulated time units for a smoothed reading. */
export function windowed(len) {
  const q = [];
  return {
    push(snap) { q.push(snap); while (q.length > 2 && snap.t - q[1].t >= len) q.shift(); },
    span() { return q.length >= 2 ? [q[0], q[q.length - 1]] : null; },
    clear() { q.length = 0; },
  };
}

/** Least-squares slope through the origin-free line y = a + b x: returns {a, b}. */
export function fitLine(xs, ys) {
  const n = xs.length; if (n < 2) return { a: NaN, b: NaN };
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; sxx += xs[i] * xs[i]; sxy += xs[i] * ys[i]; }
  const b = (n * sxy - sx * sy) / (n * sxx - sx * sx); return { a: (sy - b * sx) / n, b };
}

// ---------- simulation clocks and small drawing helpers ----------
/** Advance a gas by up to T in chunks of ch, giving up after ms of wall-clock time; each(h) runs before every chunk. */
export function runBudget(G, T, ch, ms, each) {
  const t0 = performance.now(); let done = 0;
  while (done < T - 1e-9) { const h = Math.min(ch, T - done); if (each) each(h); G.advance(h); done += h; if (performance.now() - t0 > ms) break; }
  return done;
}
/** Clock for animated simulations: returns the simulated time to add this frame (catching up after a jump, e.g. a still frame). */
export function simClock(rate, cap = 0.25, warm = 0) {
  let last = null, pending = 0;
  const clock = (t, reset) => {
    clock.big = false;
    if (pending > 0 && last !== null && t >= last - 1e-6) { const p = pending; pending = 0; clock.big = true; last = t; return p; }
    if (last === null || t < last - 1e-6) { const first = last === null; last = t; reset?.(); clock.big = true; return Math.max(first ? warm : 0, Math.min(t, 8) * rate); }
    const dt = t - last; last = t;
    if (dt > 0.5) { clock.big = true; return Math.min(dt, 8) * rate; }
    return Math.min(dt, cap) * rate;
  };
  clock.big = false;
  /** ask for a head start of `amount` simulated time on the next frame (after a reset, so plots are not empty) */
  clock.kick = (amount) => { pending = amount; };
  /** wall-clock budget (ms) for this frame: generous when catching up */
  clock.ms = () => (clock.big ? 900 : 14);
  return clock;
}
/** Temperature colour ramp (cold blue → purple → hot red). */
export const tRamp = (v) => ramp(v, 'blue', 'red', 32, 'purple');
/** Deterministic scatter of n points in a rectangle (for drawing gas samples). */
export function scatter(n, seed, x0, y0, x1, y1) { let a = seed; const r = () => ((a = (a * 16807) % 2147483647) / 2147483647); return Array.from({ length: n }, () => [x0 + (x1 - x0) * r(), y0 + (y1 - y0) * r()]); }


// ======================================================================================================
// Part 2 — ideal gases, cycles and engine drawings
// ======================================================================================================
export const R = 8.314462618; // J/(mol K) = kPa·L/(mol K)

/** Entropy of n mol of ideal gas with f quadratic degrees of freedom, relative to (V0, T0): n R [ln(V/V0) + (f/2) ln(T/T0)]. */
export const sGas = (n, f, V, T, V0 = 1, T0 = 1) => n * R * (Math.log(V / V0) + f / 2 * Math.log(T / T0));

/**
 * Carnot cycle of n mol of ideal gas between Th and Tc; state 1 = (V1, Th), isothermal expansion to V2 = r V1, adiabatic
 * expansion to Tc (V3), isothermal compression to V4, adiabatic compression back. at(u), u ∈ [0, 4), returns the state and
 * the heats and works accumulated since state 1 (Qh in, Qc out, Wby = work done by the gas).
 */
export function carnot(Th, Tc, V1, r, f = 3, n = 1) {
  const k = (Th / Tc) ** (f / 2), V2 = V1 * r, V3 = V2 * k, V4 = V1 * k, nR = n * R, cv = f / 2 * nR;
  const Qh = nR * Th * Math.log(r), Qc = nR * Tc * Math.log(r);
  const at = (u) => {
    u = ((u % 4) + 4) % 4; const s = Math.floor(u), q = u - s;
    let V, T, qh = 0, qc = 0, w = 0;
    if (s === 0) { V = V1 * r ** q; T = Th; qh = nR * Th * Math.log(V / V1); w = qh; }
    else if (s === 1) { T = Th + (Tc - Th) * q; V = V2 * (Th / T) ** (f / 2); qh = Qh; w = Qh + cv * (Th - T); }
    else if (s === 2) { V = V3 * (V4 / V3) ** q; T = Tc; qh = Qh; qc = nR * Tc * Math.log(V3 / V); w = Qh + cv * (Th - Tc) - qc; }
    else { T = Tc + (Th - Tc) * q; V = V4 * (Tc / T) ** (f / 2); qh = Qh; qc = Qc; w = Qh - Qc + cv * (Th - Tc) - cv * (T - Tc); }
    return { V, T, P: nR * T / V, S: nR * Math.log(V / V1) + cv * Math.log(T / Th), stroke: s, q, qh, qc, w };
  };
  return { V1, V2, V3, V4, Th, Tc, Qh, Qc, W: Qh - Qc, eta: 1 - Tc / Th, dS: nR * Math.log(r), at, f, n };
}

/** Heat along a straight P–V segment of an ideal gas (f dof): dQ = (f/2 + 1) P dV + (f/2) V dP, split at sign changes. */
export function segHeat(a, b, f, m = 60) {
  let qin = 0, qout = 0, w = 0; const pieces = []; let run = [a], sg = null;
  for (let i = 1; i <= m; i++) {
    const s0 = (i - 0.5) / m, V = a[0] + (b[0] - a[0]) * s0, P = a[1] + (b[1] - a[1]) * s0;
    const dV = (b[0] - a[0]) / m, dP = (b[1] - a[1]) / m, dq = (f / 2 + 1) * P * dV + f / 2 * V * dP;
    if (dq >= 0) qin += dq; else qout -= dq; w += P * dV;
    const g = dq >= 0 ? 1 : -1, pt = [a[0] + (b[0] - a[0]) * i / m, a[1] + (b[1] - a[1]) * i / m];
    if (sg !== null && g !== sg) { pieces.push({ pts: run, sign: sg }); run = [run[run.length - 1]]; }
    sg = g; run.push(pt);
  }
  pieces.push({ pts: run, sign: sg });
  return { qin, qout, w, pieces };
}

// ---------- drawing helpers (palette names only; v supplies the colours) ----------
/** Thick energy-flow band along a polyline in data coordinates, width w in pixels, with an arrowhead at the end. */
export function band(v, s, pts, w, color, o = {}) {
  if (!(w > 0.4) || pts.length < 2) return;
  const c = s.ctx, P = pts.map(([x, y]) => [s.X(x), s.Y(y)]), n = P.length;
  const [xa, ya] = P[n - 2], [xb, yb] = P[n - 1], L = Math.hypot(xb - xa, yb - ya) || 1, ux = (xb - xa) / L, uy = (yb - ya) / L;
  const hl = o.head === false ? 0 : Math.min(L * 0.7, Math.max(9, w * 0.75)), hw = Math.max(w * 1.6, w + 9);
  c.save(); c.globalAlpha = o.alpha ?? 0.8; c.strokeStyle = v.color(color); c.fillStyle = v.color(color);
  c.lineWidth = w; c.lineJoin = 'miter'; c.miterLimit = 4; c.lineCap = 'butt';
  c.beginPath(); c.moveTo(P[0][0], P[0][1]); for (let i = 1; i < n - 1; i++) c.lineTo(P[i][0], P[i][1]);
  c.lineTo(xb - ux * hl * 0.98, yb - uy * hl * 0.98); c.stroke();
  if (hl) { c.beginPath(); c.moveTo(xb, yb); c.lineTo(xb - ux * hl - uy * hw / 2, yb - uy * hl + ux * hw / 2); c.lineTo(xb - ux * hl + uy * hw / 2, yb - uy * hl - ux * hw / 2); c.closePath(); c.fill(); }
  c.restore();
}
/** Point at fraction u ∈ [0,1] of the arc length along a polyline. */
export function along(pts, u) {
  let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; }
  let d = clamp(u, 0, 1) * L;
  for (let i = 0; i < seg.length; i++) { if (d <= seg[i] || i === seg.length - 1) { const t = seg[i] ? d / seg[i] : 0; return [lerp(pts[i][0], pts[i + 1][0], t), lerp(pts[i][1], pts[i + 1][1], t)]; } d -= seg[i]; }
  return pts[pts.length - 1];
}
/** Little energy packets travelling along a polyline (phase t ∈ ℝ, k packets). */
export function packets(s, pts, t, k, st = {}) { for (let j = 0; j < k; j++) { const p = along(pts, ((t + j / k) % 1 + 1) % 1); s.dot(p[0], p[1], { r: st.r ?? 3.2, color: st.color || 'gold', ring: false, alpha: st.alpha ?? 0.95 }); } }
/** A heat reservoir: rounded block with a name and a temperature line. */
export function reservoir(s, x0, y0, x1, y1, color, name, sub, o = {}) {
  s.rect(x0, y0, x1, y1, { fill: color, fillAlpha: o.alpha ?? 0.22, color, width: 1.6, radius: 6 });
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  if (sub) { s.text(name, cx, cy, { dy: -7, align: 'center', size: o.size ?? 12.5, weight: 650, color }); s.text(sub, cx, cy, { dy: 9, align: 'center', size: (o.size ?? 12.5) - 1, color: 'ink' }); }
  else s.text(name, cx, cy, { align: 'center', size: o.size ?? 12.5, weight: 650, color });
}
/** A device drawn as a disc with a label. */
export function device(s, x, y, r, label, color, o = {}) {
  s.circle(x, y, r, { fill: o.fill || 'panel', fillAlpha: 1, color, width: 2.4, dash: o.dash });
  if (o.tint) s.circle(x, y, r, { fill: color, fillAlpha: 0.12, stroke: false });
  s.text(label, x, y, { align: 'center', size: o.size ?? 13, weight: 700, color });
}
/**
 * Upright piston cylinder: inner box [x0, x0 + w] × [y0, y0 + h], gas filling up to fraction frac of the height, coloured col.
 * o.stand: 'hot' | 'cold' | 'ins' | null draws what the cylinder stands on; o.label writes beneath.
 */
export function cylinder(v, s, x0, y0, w, h, frac, col, o = {}) {
  const top = y0 + h * clamp(frac, 0.03, 1);
  s.rect(x0, y0, x0 + w, top, { fill: col, fillAlpha: o.alpha ?? 0.45, stroke: false });
  if (o.dots) s.dots(o.dots.map(([a, b]) => [x0 + a * w, y0 + b * (top - y0)]), { r: 2.2, color: 'ink', alpha: 0.45 });
  const t = h * 0.07;
  s.rect(x0, top, x0 + w, top + t, { fill: 'muted', fillAlpha: 0.85, color: 'ink', width: 1.2 });
  s.line(x0 + w / 2, top + t, x0 + w / 2, y0 + h * 1.22, { color: 'muted', width: 4 });
  s.line(x0, y0, x0, y0 + h * 1.08, { color: 'ink', width: 2.6 }); s.line(x0 + w, y0, x0 + w, y0 + h * 1.08, { color: 'ink', width: 2.6 });
  const base = o.stand;
  const sc = base === 'hot' ? 'red' : base === 'cold' ? 'blue' : 'muted';
  s.line(x0, y0, x0 + w, y0, { color: base === 'hot' || base === 'cold' ? sc : 'ink', width: base === 'hot' || base === 'cold' ? 2 : 2.6, dash: base === 'hot' || base === 'cold' ? [3, 3] : null });
  if (base) {
    const bh = h * 0.16;
    s.rect(x0 - w * 0.12, y0 - bh, x0 + w * 1.12, y0, { fill: sc, fillAlpha: base === 'ins' ? 0.25 : 0.5, color: sc, width: 1.2, hatch: base === 'ins' ? 'muted' : false, hatchGap: 5 });
    if (o.standLabel) s.text(o.standLabel, x0 + w / 2, y0 - bh / 2, { align: 'center', size: 11.5, weight: 650, color: base === 'ins' ? 'ink' : sc, plate: true });
  }
  return top;
}

/**
 * Observed efficiencies of thermal power plants with their hot and cold temperatures (K), as tabulated by
 * Esposito, Kawai, Lindenberg & Van den Broeck, Phys. Rev. Lett. 105, 150603 (2010), Table I, compiled from
 * Curzon & Ahlborn, Am. J. Phys. 43, 22 (1975) (via Callen 1985) and Bejan, Advanced Engineering Thermodynamics (1997).
 */
export const PLANTS = [
  { name: 'Doel 4', kind: 'nuclear, Belgium', Th: 566, Tc: 283, eta: 0.35 },
  { name: 'Almaraz II', kind: 'nuclear, Spain', Th: 600, Tc: 290, eta: 0.34 },
  { name: 'Sizewell B', kind: 'nuclear, UK', Th: 581, Tc: 288, eta: 0.36 },
  { name: 'Cofrentes', kind: 'nuclear, Spain', Th: 562, Tc: 289, eta: 0.34 },
  { name: 'Heysham', kind: 'nuclear, UK', Th: 727, Tc: 288, eta: 0.40 },
  { name: 'West Thurrock', kind: 'coal, UK', Th: 838, Tc: 298, eta: 0.36, ca: true },
  { name: 'CANDU', kind: 'nuclear, Canada', Th: 573, Tc: 298, eta: 0.30, ca: true },
  { name: 'Larderello', kind: 'geothermal, Italy', Th: 523, Tc: 353, eta: 0.16, ca: true },
  { name: 'Calder Hall', kind: 'nuclear, UK', Th: 583, Tc: 298, eta: 0.19 },
  { name: 'steam/mercury plant', kind: 'US', Th: 783, Tc: 298, eta: 0.34 },
  { name: 'steam plant', kind: 'UK', Th: 698, Tc: 298, eta: 0.28 },
  { name: 'gas turbine', kind: 'Switzerland', Th: 963, Tc: 298, eta: 0.32 },
  { name: 'gas turbine', kind: 'France', Th: 953, Tc: 298, eta: 0.34 },
];
