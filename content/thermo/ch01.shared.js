// Thermodynamics & Statistical Mechanics — Chapter 1: helpers shared by ch01.js and ch01-b.js
//
// The workhorse is an exact event-driven hard-sphere gas in a cylinder. Units: molecular diameter σ = 1,
// the default molecular mass m = 1 and Boltzmann's constant k = 1, so a temperature is an energy and the
// thermal speed √(kT/m) is 1 at T = 1. Pressures come out in kT/σ³ (at T = 1), volumes in σ³.

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
  const plate = o.plate ? Object.assign({ X: 10, U: 0, M: Infinity, lo: 0, hi: 1e9 }, o.plate) : null;
  const G = {
    N, x, y, z, vx, vy, vz, m, d, e, S, side, dof, SP, Ly: o.Ly ?? 10, Lz: o.Lz ?? 10, pist, plate, t: 0,
    thermal: o.thermal || [0, 0, 0, 0, 0, 0], Tb: o.Tb ?? o.T ?? 1, exchange: o.exchange ?? 1,
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
  const hitWall = (i, w) => {
    const mi = m[i]; let J = 0;
    if (w === 2 || w === 3) { J = 2 * mi * Math.abs(vy[i]); if (G.thermal[w]) bath(i, w); else vy[i] = -vy[i]; y[i] = w === 2 ? 0 : G.Ly; }
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
  G.removePlate = () => { if (!G.plate) return; G.plate = null; side.fill(0); G.repredict(); };
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
export const carnahanStarling = (eta) => (1 + eta + eta * eta - eta ** 3) / (1 - eta) ** 3;

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
