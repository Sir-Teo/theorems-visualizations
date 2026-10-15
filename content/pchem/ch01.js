// Physical Chemistry — Chapter 1: Gases: perfect and real

// ======================================================================================================
// Molecular simulations. Units: length Å, mass u (dalton), energy in kelvin (k_B = 1). Then the time unit is
// t₀ = Å·√(u/(k_B·K)) = 1.0967 ps, the speed unit Å/t₀ = 91.18 m/s and the pressure unit K/Å³ = 138.06 bar.
// ======================================================================================================
const T0 = 1.09669e-12, BAR = 138.0649, VEL = 91.18;
const Lmol = (V, N) => V * 6.02214076e-4 / N;       // molar volume (L/mol) of N molecules in V Å³
const VofLmol = (Vm, N) => Vm * N / 6.02214076e-4;  // volume (Å³) of N molecules at molar volume Vm (L/mol)
const RBAR = 0.0831446;                              // R in L·bar/(mol·K)
// Lennard-Jones parameters fitted to second virial coefficients (σ in Å, ε/k_B in K) and molar masses (g/mol)
const MOL = {
  H2: { m: 2.016, sig: 2.928, eps: 37.0, col: 'pink', tex: '\\mathrm{H_2}', name: 'hydrogen' },
  He: { m: 4.003, sig: 2.556, eps: 10.22, col: 'teal', tex: '\\mathrm{He}', name: 'helium' },
  N2: { m: 28.014, sig: 3.698, eps: 95.05, col: 'blue', tex: '\\mathrm{N_2}', name: 'nitrogen' },
  Ar: { m: 39.948, sig: 3.405, eps: 119.8, col: 'green', tex: '\\mathrm{Ar}', name: 'argon' },
  Xe: { m: 131.29, sig: 4.055, eps: 229, col: 'purple', tex: '\\mathrm{Xe}', name: 'xenon' },
};

/**
 * Molecular dynamics in the box [0,Lx]×[0,Ly]×[0,Lz]: velocity Verlet with a cell list.
 * mode: 'ideal' (no forces — point molecules), 'hard' (repulsive Lennard-Jones core only) or 'lj' (full
 * Lennard-Jones, cut at 2.5σ). Walls (0: x=0, 1: x=Lx, 2: y=0, 3: y=Ly, 4: z=0, 5: z=Lz) reflect molecular
 * centres. A thermal wall re-emits each molecule with velocities drawn at the bath temperature G.T (a heat bath);
 * a moving wall (G.wv[k] ≠ 0) reflects specularly in its own frame (a driven piston); G.piston = {k, M, pext,
 * gamma} makes wall k a free piston of mass M under external pressure pext (elastic two-body impacts).
 * Every impact is tallied, so the pressure over any window is Δ(impulse)/Δ(area·time) — measured, not computed.
 */
function mdGas(o) {
  const N = o.N, SP = o.species, ns = SP.length, R = o.rng;
  const x = new Float64Array(N), y = new Float64Array(N), z = new Float64Array(N);
  const vx = new Float64Array(N), vy = new Float64Array(N), vz = new Float64Array(N);
  const fx = new Float64Array(N), fy = new Float64Array(N), fz = new Float64Array(N);
  const S = new Int8Array(N), m = new Float64Array(N);
  { let k = 0; (o.counts || [N]).forEach((c, s) => { for (let j = 0; j < c && k < N; j++, k++) { S[k] = s; m[k] = SP[s].m; } }); }
  const G = { N, x, y, z, vx, vy, vz, S, m, SP, L: o.L.slice(), T: o.T, mode: o.mode || 'lj', thermal: o.thermal || [1, 1, 1, 1, 1, 1],
    wv: [0, 0, 0, 0, 0, 0], piston: null, t: 0, imp: new Float64Array(6), hits: new Float64Array(6), impS: new Float64Array(ns),
    areaT: 0, keT: 0, kt: 0, vT: 0, j2: 0 };
  const s2 = new Float64Array(ns * ns), e4 = new Float64Array(ns * ns), rc2 = new Float64Array(ns * ns);
  let rcMax = 1;
  G.setMode = (mode) => {
    G.mode = mode; rcMax = 1;
    for (let a = 0; a < ns; a++) for (let b = 0; b < ns; b++) {
      const sg = (SP[a].sig + SP[b].sig) / 2, k = a * ns + b, rc = (mode === 'lj' ? 2.5 : 1.122462) * sg;
      s2[k] = sg * sg; e4[k] = 4 * Math.sqrt(SP[a].eps * SP[b].eps); rc2[k] = rc * rc; rcMax = Math.max(rcMax, rc);
    }
  };
  G.setMode(G.mode);
  G.place = () => {
    for (let i = 0; i < N; i++) {
      for (let tries = 0; tries < 3000; tries++) {
        x[i] = R() * G.L[0]; y[i] = R() * G.L[1]; z[i] = R() * G.L[2];
        if (G.mode === 'ideal') break;
        let ok = true;
        for (let j = 0; j < i && ok; j++) { const d = 0.45 * (SP[S[i]].sig + SP[S[j]].sig), dx = x[i] - x[j], dy = y[i] - y[j], dz = z[i] - z[j]; if (dx * dx + dy * dy + dz * dz < d * d) ok = false; }
        if (ok) break;
      }
      const sd = Math.sqrt(G.T / m[i]); vx[i] = sd * R.normal(); vy[i] = sd * R.normal(); vz[i] = sd * R.normal();
    }
  };
  G.place();
  let head = new Int32Array(8);
  const next = new Int32Array(N);
  const forces = () => {
    fx.fill(0); fy.fill(0); fz.fill(0);
    if (G.mode === 'ideal') return;
    const L = G.L, ncx = Math.max(1, Math.min(32, Math.floor(L[0] / rcMax))), ncy = Math.max(1, Math.min(32, Math.floor(L[1] / rcMax))), ncz = Math.max(1, Math.min(32, Math.floor(L[2] / rcMax)));
    const nt = ncx * ncy * ncz; if (head.length < nt) head = new Int32Array(nt);
    head.fill(-1, 0, nt);
    for (let i = 0; i < N; i++) {
      const cx = Math.min(ncx - 1, Math.max(0, (x[i] / L[0] * ncx) | 0)), cy = Math.min(ncy - 1, Math.max(0, (y[i] / L[1] * ncy) | 0)), cz = Math.min(ncz - 1, Math.max(0, (z[i] / L[2] * ncz) | 0));
      const c = (cx * ncy + cy) * ncz + cz; next[i] = head[c]; head[c] = i;
    }
    for (let i = 0; i < N; i++) {
      const cx = Math.min(ncx - 1, Math.max(0, (x[i] / L[0] * ncx) | 0)), cy = Math.min(ncy - 1, Math.max(0, (y[i] / L[1] * ncy) | 0)), cz = Math.min(ncz - 1, Math.max(0, (z[i] / L[2] * ncz) | 0)), si = S[i] * ns;
      for (let qx = Math.max(0, cx - 1); qx <= Math.min(ncx - 1, cx + 1); qx++) for (let qy = Math.max(0, cy - 1); qy <= Math.min(ncy - 1, cy + 1); qy++) for (let qz = Math.max(0, cz - 1); qz <= Math.min(ncz - 1, cz + 1); qz++) {
        for (let j = head[(qx * ncy + qy) * ncz + qz]; j >= 0; j = next[j]) {
          if (j <= i) continue;
          const k = si + S[j], dx = x[i] - x[j], dy = y[i] - y[j], dz = z[i] - z[j], r2 = dx * dx + dy * dy + dz * dz;
          if (r2 >= rc2[k]) continue;
          const rr = Math.max(r2, 0.5 * s2[k]), ir2 = s2[k] / rr, ir6 = ir2 * ir2 * ir2, f = 6 * e4[k] * ir6 * (2 * ir6 - 1) / rr;
          fx[i] += f * dx; fy[i] += f * dy; fz[i] += f * dz; fx[j] -= f * dx; fy[j] -= f * dy; fz[j] -= f * dz;
        }
      }
    }
  };
  forces();
  // reflect molecule i off wall k (axis arrays P, V); returns the impulse given to the wall along +axis
  const reflect = (i, k, P, V) => {
    const lo = (k & 1) === 0, ax = k >> 1, Lw = lo ? 0 : G.L[ax], vin = V[i], mi = m[i];
    let vout;
    if (G.piston && G.piston.k === k) { const Pm = G.piston.M, U = G.wv[k]; vout = ((mi - Pm) * vin + 2 * Pm * U) / (mi + Pm); G.wv[k] = U + mi * (vin - vout) / Pm; }
    else if (G.thermal[k] && !G.wv[k]) {
      const sd = Math.sqrt(G.T / mi), vn = sd * Math.sqrt(-2 * Math.log(1 - R()));
      vout = lo ? vn : -vn;
      if (ax !== 0) vx[i] = sd * R.normal();
      if (ax !== 1) vy[i] = sd * R.normal();
      if (ax !== 2) vz[i] = sd * R.normal();
    } else vout = 2 * G.wv[k] - vin;
    P[i] = Math.min(G.L[ax], Math.max(0, 2 * Lw - P[i]));
    V[i] = vout;
    const J = mi * Math.abs(vin - vout);
    G.imp[k] += J; G.hits[k]++; G.impS[S[i]] += J; G.j2 += J * J;
    return mi * (vin - vout);
  };
  G.step = (dt) => {
    const L = G.L, h = dt / 2;
    for (let i = 0; i < N; i++) { const im = h / m[i]; vx[i] += fx[i] * im; vy[i] += fy[i] * im; vz[i] += fz[i] * im; x[i] += vx[i] * dt; y[i] += vy[i] * dt; z[i] += vz[i] * dt; }
    for (let k = 1; k < 6; k += 2) if (G.wv[k]) L[k >> 1] = Math.max(1, L[k >> 1] + G.wv[k] * dt);
    const P = G.piston;
    for (let i = 0; i < N; i++) {
      if (x[i] < 0) reflect(i, 0, x, vx); else if (x[i] > L[0]) reflect(i, 1, x, vx);
      if (y[i] < 0) reflect(i, 2, y, vy); else if (y[i] > L[1]) reflect(i, 3, y, vy);
      if (z[i] < 0) reflect(i, 4, z, vz); else if (z[i] > L[2]) reflect(i, 5, z, vz);
    }
    if (P) { const a = P.k >> 1, A = L[(a + 1) % 3] * L[(a + 2) % 3], U = G.wv[P.k]; G.wv[P.k] = U - (P.pext * A + P.gamma * U) * dt / P.M; }
    forces();
    let ke = 0;
    for (let i = 0; i < N; i++) { const im = h / m[i]; vx[i] += fx[i] * im; vy[i] += fy[i] * im; vz[i] += fz[i] * im; ke += m[i] * (vx[i] * vx[i] + vy[i] * vy[i] + vz[i] * vz[i]); }
    G.areaT += 2 * (L[0] * L[1] + L[1] * L[2] + L[0] * L[2]) * dt; G.keT += ke / (3 * N) * dt; G.kt += dt; G.vT += L[0] * L[1] * L[2] * dt; G.t += dt;
  };
  G.run = (T, dt) => { const n = Math.max(1, Math.round(T / dt)); for (let i = 0; i < n; i++) G.step(T / n); };
  G.kinT = () => { let ke = 0; for (let i = 0; i < N; i++) ke += m[i] * (vx[i] * vx[i] + vy[i] * vy[i] + vz[i] * vz[i]); return ke / (3 * N); };
  /** Snapshot of the running tallies; meas(a, b) gives pressure, temperature, mean volume and impact count in between. */
  G.snap = () => ({ t: G.t, imp: G.imp.reduce((s, q) => s + q, 0), area: G.areaT, ke: G.keT, kt: G.kt, vT: G.vT, hits: G.hits.reduce((s, q) => s + q, 0), impS: Array.from(G.impS), j2: G.j2 });
  G.meas = (a, b) => ({ p: (b.imp - a.imp) / (b.area - a.area), dp: Math.sqrt(b.j2 - a.j2) / (b.area - a.area), T: (b.ke - a.ke) / (b.kt - a.kt), V: (b.vT - a.vT) / (b.kt - a.kt), hits: b.hits - a.hits, dt: b.t - a.t });
  return G;
}

/** Oblique ("cabinet") projection: depth z is drawn up and to the right. Returns P(x, y, z) → [X, Y]. */
function oblique(k = 0.38, ang = 0.62) { const cx = k * Math.cos(ang), cy = k * Math.sin(ang); const P = (x, y, z) => [x + cx * z, y + cy * z]; P.cx = cx; P.cy = cy; return P; }
/** Back half of a box [x0,x1]×[y0,y1]×[0,D] (faces behind the molecules), with an optional tint of the inside. */
function boxBack(s, P, x0, x1, y0, y1, D, st = {}) {
  const c = st.color || 'muted', b = [P(x0, y0, D), P(x1, y0, D), P(x1, y1, D), P(x0, y1, D)];
  if (st.fill) s.poly([P(x0, y0, 0), P(x1, y0, 0), P(x1, y0, D), P(x0, y0, D)], { fill: st.fill, fillAlpha: st.fillAlpha ?? 0.1, stroke: false });
  if (st.back) s.poly(b, { fill: st.back, fillAlpha: st.backAlpha ?? 0.06, stroke: false });
  s.path(b, { close: true, color: c, width: 1, alpha: 0.55 });
  for (const [xx, yy] of [[x0, y0], [x0, y1], [x1, y0], [x1, y1]]) s.line(...P(xx, yy, 0), ...P(xx, yy, D), { color: c, width: 1, alpha: 0.45 });
}
/** Front face of the box (drawn after the molecules). */
function boxFront(s, P, x0, x1, y0, y1, st = {}) { s.path([P(x0, y0, 0), P(x1, y0, 0), P(x1, y1, 0), P(x0, y1, 0)], { close: true, color: st.color || 'ink', width: st.width ?? 1.6, alpha: st.alpha ?? 0.85 }); }
/** Molecules of a simulation drawn back to front; coordinates mapped by map(i) → [x, y, z] (box frame) and P. */
function drawMolecules(s, G, P, o = {}) {
  const idx = Array.from({ length: G.N }, (_, i) => i), D = o.depth || G.L[2], ox = o.ox || 0, oy = o.oy || 0;
  idx.sort((a, b) => G.z[b] - G.z[a]);
  for (const i of idx) {
    const sp = G.SP[G.S[i]], [X, Y] = P(G.x[i] + ox, G.y[i] + oy, G.z[i]), f = 1 - 0.45 * G.z[i] / D;
    const r = o.point ? (o.pointR || 2.4) : Math.max(1.6, (o.size ? o.size(sp) : sp.sig / 2) * s.scale);
    s.dot(X, Y, { r, color: (o.color && o.color(i, sp)) || sp.col, alpha: o.point ? 0.9 : 0.35 + 0.6 * f, ring: !o.point && r > 3 });
  }
}
/** Running mean of y in log-spaced x bins: returns [[x̄, ȳ, n], …] for bins holding at least minN points. */
function binMeans(pts, xf, yf, lo, hi, nb, minN = 3) {
  const acc = Array.from({ length: nb }, () => [0, 0, 0]), l0 = Math.log(lo), l1 = Math.log(hi);
  for (const p of pts) { const b = Math.floor((Math.log(xf(p)) - l0) / (l1 - l0) * nb); if (b >= 0 && b < nb) { acc[b][0] += xf(p); acc[b][1] += yf(p); acc[b][2]++; } }
  return acc.filter((a) => a[2] >= minN).map((a) => [a[0] / a[2], a[1] / a[2], a[2]]);
}

export default {
  collection: 'pchem',
  chapter: 1,
  title: 'Gases: perfect and real',
  summary: String.raw`Boyle's, Charles's and Avogadro's observations fold into one equation, $pV = nRT$, and the kinetic model explains it as the drumming of molecules on the walls — here measured, impact by impact, in simulated boxes of real molecules. The same simulations show how far a molecule travels between collisions and why the atmosphere thins exponentially with height. Real molecules take up room and attract one another: the compression factor and the virial expansion measure the departure from the perfect gas, and van der Waals's two-parameter equation captures liquefaction, the critical point and the law of corresponding states.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1', kind: 'Law', name: 'Boyle’s law',
      statement: String.raw`For a fixed amount of gas held at a fixed temperature, the pressure is inversely proportional to the volume:
$$pV = \text{constant}\qquad\text{equivalently}\qquad p_1V_1 = p_2V_2 \quad (n,\ T\ \text{fixed}).$$
The isotherms on a $p$–$V$ diagram are hyperbolas. The constant is proportional to the amount of gas and grows with temperature (it is $nRT$, see 1.4). The law is a *limiting law*: it holds better and better as the pressure is lowered, for every gas.`,
      idea: String.raw`Halve the volume at constant temperature and the molecules, moving just as fast as before, are twice as crowded: twice as many strike each square centimetre of wall per second, each with the same average impulse, so the pressure doubles. That argument — made quantitative by the kinetic model 1.6 — assumes the molecules occupy no volume and exert no forces on each other. Real molecules do both; at high density (or near liquefaction) the attractions lower the pressure below the hyperbola and, when they are packed tight, their size pushes it above (1.11).`,
      caption: String.raw`Two boxes of 100 molecules at the same temperature share one piston: the top box holds point molecules that never touch (a perfect gas), the bottom one real xenon atoms (Lennard-Jones size and attraction). The pressure in each is **measured** from the impacts on the walls over short windows; each window adds a dot. Let the piston sweep, or drag its handle. Perfect-gas dots fall on the hyperbola $nRT/V$ and keep $pV/nRT = 1$; xenon, near its critical temperature, sags below once it is compressed. Heat it and xenon behaves better.`,
      deps: [],
      refs: ['Atkins 1A', 'M–S ch. 16'],
      tags: ['gas laws', 'isotherm'],
      credit: 'Boyle (with Towneley and Hooke), 1662; Mariotte, 1676',
      scope: String.raw`Holds for any gas in the limit of low pressure, at fixed temperature and amount. Deviations grow with density and with proximity to the gas's critical temperature: for nitrogen at room temperature they are below 1% up to about 50 bar, for xenon (critical temperature 290 K) they reach 10% by 20 bar.`,
      viz(v) {
        const N = 100, W = 24, VMAX = 0.6, VMIN = 0.08, RATE = 40, WIN = 6, PER = 1200;
        const LxOf = (Vm) => VofLmol(Vm, N) / (W * W), LMAX = LxOf(VMAX), LMIN = LxOf(VMIN);
        const Tsl = v.slider('temperature $T$', 250, 700, 298, { step: 1, fmt: (x) => `${x.toFixed(0)} K`, onChange: () => clear() });
        const auto = v.toggle('automatic sweep', true);
        v.button('Clear data', () => clear());
        const P3 = oblique(0.36, 0.62), DY = 40, YOKE = 16, yc = (DY + W) / 2;
        const sb = v.stage({ x: [-4, LMAX + YOKE + 12], y: [-11, DY + W + P3.cy * W + 9], equal: true, height: 260, axes: false, full: true });
        const sp = v.stage({ x: [0, 0.65], y: [0, 400], height: 290, axes: 'box', title: 'measured pressure $p$ (bar) against $V_m$ (L/mol)' });
        const sz = v.stage({ x: [0, 0.65], y: [0.3, 1.4], height: 290, axes: 'box', title: 'Boyle product $pV_m/RT$ against $V_m$ (L/mol)' });
        const ph = sb.handle(LMAX + YOKE, yc, { color: 'orange', r: 8, constrain: (xx) => [Math.min(LMAX, Math.max(LMIN, xx - YOKE)) + YOKE, yc] });
        ph.onDrag = () => { if (auto.value) auto.set(false); };
        let G, win, pts, tLast = 0, tSim = 0, last = [null, null];
        const make = () => {
          const T = Tsl.value, L = [LMAX, W, W], th = [1, 0, 1, 1, 1, 1];
          G = [mdGas({ N, species: [MOL.Xe], L, mode: 'ideal', T, rng: v.rng(11), thermal: th }), mdGas({ N, species: [MOL.Xe], L, mode: 'lj', T, rng: v.rng(12), thermal: th })];
          win = G.map((g) => g.snap());
        };
        const clear = () => { pts = [[], []]; last = [null, null]; if (G) { G.forEach((g) => { g.T = Tsl.value; }); win = G.map((g) => g.snap()); } };
        make(); clear();
        const target = () => {
          if (!auto.value) return ph.x - YOKE;
          const u = (tSim % PER) / PER, tri = u < 0.5 ? 2 * u : 2 - 2 * u;
          return LxOf(VMAX * (VMIN / VMAX) ** tri);
        };
        const advance = (dT) => {
          const CH = 0.3;
          for (let done = 0; done < dT - 1e-9; done += CH) {
            const Lx = G[0].L[0], U = Math.max(-2, Math.min(2, (target() - Lx) / 3));
            G[0].wv[1] = U; G[1].wv[1] = U; G[1].L[0] = Lx;
            G[0].run(CH, 0.1); G[1].run(CH, 0.03);
            tSim += CH;
            if (auto.value) ph.x = G[0].L[0] + YOKE;
            if (G[0].t - win[0].t >= WIN) G.forEach((g, k) => {
              const b = g.snap(), r = g.meas(win[k], b), Vm = Lmol(r.V, N);
              const pt = { Vm, p: r.p * BAR, Z: r.p * r.V / (N * r.T), T: r.T, pid: N * r.T / r.V * BAR };
              pts[k].push(pt); if (pts[k].length > 700) pts[k].shift(); last[k] = pt; win[k] = b;
            });
          }
        };
        v.animate((t) => {
          if (t < tLast - 1e-6) { tSim = 0; make(); clear(); }
          const dT = Math.min(700, (t - tLast) * RATE); tLast = t;
          if (dT > 0) advance(dT);
          // --- the cylinders, the gas and the shared piston ---
          const Lx = G[0].L[0], Y = (y0) => P3(Lx, y0 + W / 2, W / 2);
          [[G[0], DY, 'perfect gas: point molecules that never touch', 'accent', DY + W + P3.cy * W + 4], [G[1], 0, 'xenon: real atoms with size and attraction', 'purple', -6]].forEach(([g, y0, lab, col, ly], k) => {
            boxBack(sb, P3, 0, LMAX, y0, y0 + W, W, { color: 'faint' });
            boxBack(sb, P3, 0, Lx, y0, y0 + W, W, { color: 'muted', fill: col, fillAlpha: 0.07, back: col, backAlpha: 0.04 });
            drawMolecules(sb, g, P3, { oy: y0, point: k === 0, pointR: 2.2, color: () => col });
            boxFront(sb, P3, 0, Lx, y0, y0 + W);
            sb.path([P3(Lx, y0, 0), P3(LMAX, y0, 0), P3(LMAX, y0 + W, 0), P3(Lx, y0 + W, 0)], { color: 'faint', width: 1.2, dash: [4, 3] });
            sb.poly([P3(Lx, y0, 0), P3(Lx, y0, W), P3(Lx, y0 + W, W), P3(Lx, y0 + W, 0)], { fill: 'orange', fillAlpha: 0.35, color: 'orange', width: 2 });
            sb.text(lab, 0, ly, { color: col, size: 12, align: 'left', weight: 600 });
            const [X, Yp] = Y(y0); sb.line(X, Yp, Lx + YOKE, Yp, { color: 'orange', width: 3.5, alpha: 0.8 });
          });
          sb.line(Lx + YOKE, Y(DY)[1], Lx + YOKE, Y(0)[1], { color: 'orange', width: 4, alpha: 0.8 });
          ph.y = yc;
          sb.corner(`Vₘ = ${v.fix(Lmol(Lx * W * W, N), 3)} L/mol  ·  T = ${Tsl.value.toFixed(0)} K  ·  ${v.fix(G[0].t * T0 * 1e9, 2)} ns simulated`, 'tr', { size: 11.5 });
          // --- p–V and Boyle product ---
          const T = Tsl.value, pmax = RBAR * T / VMIN * 1.12;
          sp.setView([0, 0.65], [0, pmax]);
          sp.fn((Vm) => RBAR * T / Vm, { color: 'ink', width: 1.6, dash: [6, 4], domain: [0.06, 0.65] });
          sz.hline(1, { color: 'ink', width: 1.4, dash: [6, 4] });
          [[0, 'accent'], [1, 'purple']].forEach(([k, col]) => {
            sp.dots(pts[k].map((q) => [q.Vm, q.p]), { r: 2.3, color: col, alpha: 0.45 });
            sz.dots(pts[k].map((q) => [q.Vm, q.Z]), { r: 2.3, color: col, alpha: 0.45 });
            const bm = binMeans(pts[k], (q) => q.Vm, (q) => q.p, 0.07, 0.66, 12), bz = binMeans(pts[k], (q) => q.Vm, (q) => q.Z, 0.07, 0.66, 12);
            sp.path(bm.map((q) => [q[0], q[1]]), { color: col, width: 2.4 }); sz.path(bz.map((q) => [q[0], q[1]]), { color: col, width: 2.4 });
            if (last[k]) { sp.dot(last[k].Vm, last[k].p, { r: 4.5, color: col }); sz.dot(last[k].Vm, last[k].Z, { r: 4.5, color: col }); }
          });
          sp.text('p = nRT/V', 0.45, RBAR * T / 0.45, { color: 'ink', size: 14, dx: 4, dy: -16, math: true });
        }, { still: 15 });
        v.legend([['accent', 'perfect gas (point molecules)', { dot: true }], ['purple', 'xenon (Lennard-Jones atoms)', { dot: true }], ['ink', 'Boyle: $p = nRT/V$, $pV/nRT = 1$', { dash: true }], ['muted', 'solid lines: running means of the dots']]);
        v.readout(() => {
          if (!last[0] || !last[1]) return 'Collecting impacts…';
          const Vc = Lmol(G[0].L[0] * W * W, N), near = (k) => pts[k].slice(-60).filter((q) => Math.abs(Math.log(q.Vm / Vc)) < 0.12);
          const avg = (a, f) => a.reduce((s2, q) => s2 + f(q), 0) / a.length, A = near(0), B = near(1);
          const zr = (k) => { const q = binMeans(pts[k], (r) => r.Vm, (r) => r.Z, 0.07, 0.66, 12); return q.length ? [Math.min(...q.map((r) => r[1])), Math.max(...q.map((r) => r[1]))] : [1, 1]; };
          const z0 = zr(0), z1 = zr(1);
          const now = A.length && B.length ? `Around $V_m = ${v.fix(Vc, 3)}$ L/mol (${A.length} windows): perfect gas $\\bar p = ${v.fix(avg(A, (q) => q.p), 1)}$ bar against $nRT/V = ${v.fix(avg(A, (q) => q.pid), 1)}$ bar; xenon $\\bar p = ${v.fix(avg(B, (q) => q.p), 1)}$ bar, $pV/nRT = ${v.fix(avg(B, (q) => q.Z), 2)}$. ` : '';
          return now + `Over the whole sweep the averaged Boyle product stays within $${v.fix(z0[0], 2)}$–$${v.fix(z0[1], 2)}$ for the perfect gas but wanders over $${v.fix(z1[0], 2)}$–$${v.fix(z1[1], 2)}$ for xenon.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2', kind: 'Law', name: 'Charles’s and Gay-Lussac’s laws',
      statement: String.raw`For a fixed amount of gas:
(a) at fixed pressure the volume is a linear function of the temperature, $V = V_0\,(1 + \theta/273.15\,{}^\circ\mathrm C)$ (Charles's law);
(b) at fixed volume the pressure is a linear function of the temperature, $p = p_0\,(1 + \theta/273.15\,{}^\circ\mathrm C)$ (Gay-Lussac's or Amontons's law).
For every gas and every fixed pressure or volume the straight lines extrapolate to zero at the same temperature, $\theta = -273.15\,{}^\circ$C. Measuring temperature from that point, $T = \theta + 273.15$ K, both laws read $V \propto T$ and $p \propto T$. Like Boyle's law they are limiting laws, exact as the pressure goes to zero.`,
      idea: String.raw`Temperature measures the mean kinetic energy of the molecules, $\tfrac12 m\langle v^2\rangle = \tfrac32 kT$ (1.6). At fixed volume, heating makes each impact on the wall harder and the impacts more frequent — each grows like $\sqrt T$ — so the pressure grows like $T$. To hold the pressure at a fixed value instead, the gas must spread over a proportionally larger volume. The common intercept is the temperature at which the molecules of a perfect gas would stop moving: it does not depend on the gas because the kinetic energy per molecule does not. Real gases condense before reaching it, and their attractions bend the lines near condensation.`,
      caption: String.raw`A cylinder of 160 molecules sits in a bath that cycles between $-100$ °C and $300$ °C (or set the bath yourself). Weights on a free piston hold the pressure fixed; in constant-volume mode pins hold the piston where the weights left it at 20 °C and the wall pressure is measured instead. Each window adds a dot: the gas's own temperature (from the kinetic energy of its molecules) against its volume or pressure. After every ramp a new weight starts a new line; extended (dashed), every line hits zero near $-273$ °C. Switch to xenon: near condensation the cold end curls below its line and the intercept moves.`,
      deps: [],
      refs: ['Atkins 1A'],
      tags: ['gas laws', 'absolute zero'],
      credit: 'Amontons, 1702; Charles, c. 1787; Gay-Lussac, 1802; Thomson (Kelvin), 1848',
      scope: String.raw`Holds in the limit of low pressure for any gas, far from its condensation temperature. Near condensation real gases contract more than the law predicts; below it they liquefy, so the lines can never actually be followed down to absolute zero.`,
      viz(v) {
        const N = 160, W = 100, WIN = 10, TLO = 173.15, THI = 573.15, PSTEP = 10, COLS = ['accent', 'orange', 'teal'];
        const STEPS = [-100, -20, 60, 140, 220, 300].map((c) => c + 273.15);
        const law = v.select('hold fixed', [{ value: 'p', label: 'pressure (Charles)' }, { value: 'V', label: 'volume (Gay-Lussac)' }], 'p', { onChange: () => { make(); newSeries(); } });
        const gas = v.select('molecules', [{ value: 'ideal', label: 'point molecules' }, { value: 'lj', label: 'xenon atoms' }], 'ideal', { onChange: () => { make(); newSeries(); } });
        const load = v.slider('weights', 1, 3, 1, { int: true, fmt: (k) => `${k} (${k * PSTEP} bar)`, onChange: () => { make(); newSeries(); } });
        const auto = v.toggle('automatic heating in steps', true);
        const Tb = v.slider('bath', -100, 300, 20, { step: 1, fmt: (x) => `${x.toFixed(0)} °C`, onChange: () => { if (auto.value) auto.set(false); tChange = tSim; } });
        const P3 = oblique(0.42, 0.5), HMAX = N * THI / (PSTEP / BAR * W * W);
        const sc = v.stage({ x: [-56, W + P3.cx * W + 6], y: [-12, HMAX + P3.cy * W + 46], equal: true, height: 400, axes: false, weight: 0.8, minWidth: 240 });
        const sg = v.stage({ x: [-300, 330], y: [0, 5], height: 400, axes: 'box', weight: 1.2, xticks: [[-273.15, '−273'], -100, 0, 100, 200, 300] });
        let G, win, series = [], tLast = 0, tSim = 0, step = 0, dir = 1, tStep = 0, tChange = 0, last = null;
        const fast = () => gas.value === 'ideal';
        const DWELL = () => (fast() ? 80 : 360), RATE = () => (fast() ? 30 : 60);
        const bathT = () => (auto.value ? STEPS[step] : Tb.value + 273.15);
        const settled = () => tSim - (auto.value ? tStep : tChange) >= DWELL() / 2;
        const make = () => {
          const T = bathT(), pe = load.value * PSTEP / BAR, h = law.value === 'p' ? N * T / (pe * W * W) : N * 293.15 / (pe * W * W);
          G = mdGas({ N, species: [fast() ? MOL.He : MOL.Xe], L: [W, h, W], mode: gas.value, T, rng: v.rng(21 + series.length), thermal: [1, 1, 1, 0, 1, 1] });
          if (law.value === 'p') G.piston = { k: 3, M: fast() ? 200 : 2000, pext: pe, gamma: fast() ? 20 : 100 };
          win = G.snap(); tStep = tChange = tSim;
        };
        const newSeries = () => { series.push({ law: law.value, k: load.value, gas: gas.value, pts: [], col: COLS[(series.length ? COLS.indexOf(series[series.length - 1].col) + 1 : 0) % 3] }); if (series.length > 3) series.shift(); last = null; };
        const reset = () => { tSim = 0; step = 0; dir = 1; series = []; load.value = 1; make(); newSeries(); };
        reset();
        const fit = (S) => {
          if (S.pts.length < 4) return null;
          const xs = S.pts.map((q) => q.th), ys = S.pts.map((q) => q.y), r = v.M.linreg(xs, ys), n = xs.length, mx = v.M.mean(xs), my = v.M.mean(ys);
          if (!(Math.abs(r.slope) > 0)) return null;
          const th0 = mx - my / r.slope, se = Math.sqrt((r.sigma * r.sigma / n) / (r.slope * r.slope) + (my * my) * r.seSlope * r.seSlope / r.slope ** 4);
          return { ...r, th0, se, lo: Math.min(...xs), hi: Math.max(...xs) };
        };
        const advance = (dT) => {
          const CH = 0.5, dt = fast() ? 0.05 : 0.03;
          for (let done = 0; done < dT - 1e-9; done += CH) {
            if (auto.value && tSim - tStep >= DWELL()) {
              step += dir; tStep = tSim;
              if (step < 0 || step >= STEPS.length) { dir = -dir; step += dir; load.value = (load.value % 3) + 1; make(); newSeries(); }
            }
            G.T = bathT(); G.run(CH, dt); tSim += CH;
            if (G.t - win.t >= WIN) {
              const b = G.snap();
              if (settled()) {
                const m = G.meas(win, b), pt = { th: m.T - 273.15, y: law.value === 'p' ? Lmol(m.V, N) : m.p * BAR, T: m.T };
                series[series.length - 1].pts.push(pt); last = pt;
              }
              win = b;
            }
          }
        };
        v.animate((t) => {
          if (t < tLast - 1e-6) reset();
          const dT = Math.min(2400, (t - tLast) * RATE()); tLast = t;
          if (dT > 0) advance(dT);
          // --- the bath, the cylinder and its molecules ---
          const h = G.L[1], Tbath = bathT(), f = Math.max(0, Math.min(1, (Tbath - TLO) / (THI - TLO))), hot = v.mix('blue', 'red', f);
          sc.rect(-8, -8, W + P3.cx * W + 4, HMAX + P3.cy * W + 4, { fill: hot, fillAlpha: 0.12, color: hot, width: 1, alpha: 0.6 });
          boxBack(sc, P3, 0, W, 0, HMAX, W, { color: 'faint' });
          sc.path([P3(0, h, 0), P3(0, HMAX, 0), P3(W, HMAX, 0), P3(W, h, 0)], { color: 'faint', width: 1.2, dash: [4, 3] });
          boxBack(sc, P3, 0, W, 0, h, W, { color: 'muted', fill: 'muted', fillAlpha: 0.08 });
          drawMolecules(sc, G, P3, { point: fast(), pointR: 2, color: () => (fast() ? 'accent' : 'purple') });
          boxFront(sc, P3, 0, W, 0, h);
          const th = 4, top = [P3(0, h, 0), P3(W, h, 0), P3(W, h, W), P3(0, h, W)];
          sc.poly(top.map(([X, Y]) => [X, Y + th]), { fill: 'gray', fillAlpha: 0.55, color: 'muted', width: 1 });
          sc.poly([top[0], top[1], [top[1][0], top[1][1] + th], [top[0][0], top[0][1] + th]], { fill: 'gray', fillAlpha: 0.75, color: 'muted', width: 1 });
          if (law.value === 'p') for (let k = 0; k < load.value; k++) {
            const y0 = h + th + 1 + k * 11, a = P3(22, y0, W / 2), b = P3(W - 22, y0 + 9.5, W / 2);
            sc.rect(a[0], a[1], b[0], b[1], { fill: 'ink', fillAlpha: 0.78, color: 'ink', width: 1 });
            sc.text(`${PSTEP} bar`, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, { color: 'panel', size: 10, align: 'center', halo: false, weight: 600 });
          } else for (const xx of [-5, W + 5]) { const [X, Y] = P3(xx, h + th / 2, 0); sc.rect(X - 2.5, Y - 2.5, X + 2.5, Y + 2.5, { fill: 'red', fillAlpha: 0.9, stroke: false }); }
          // thermometer: bath (red column) and the gas's own measured temperature (dot)
          const tx = -36, ty0 = 10, ty1 = HMAX + 10, Ty = (T) => ty0 + (ty1 - ty0) * (T - TLO) / (THI - TLO);
          sc.rect(tx - 3.5, ty0 - 3, tx + 3.5, ty1 + 5, { color: 'muted', width: 1.2 });
          sc.circle(tx, ty0 - 7, 6, { fill: 'red', fillAlpha: 0.85, stroke: false });
          sc.rect(tx - 2, ty0 - 3, tx + 2, Ty(Tbath), { fill: 'red', fillAlpha: 0.85, stroke: false });
          for (const c of [-100, 0, 100, 200, 300]) { sc.line(tx + 3.5, Ty(c + 273.15), tx + 7, Ty(c + 273.15), { color: 'muted', width: 1 }); sc.text(`${c}°`, tx - 6, Ty(c + 273.15), { size: 10, color: 'muted', align: 'right' }); }
          if (last) sc.dot(tx + 3.5, Ty(last.T), { r: 4, color: fast() ? 'accent' : 'purple' });
          sc.text(settled() ? 'measuring' : 'settling…', W / 2 + P3.cx * W / 2, -5, { size: 11, color: settled() ? 'green' : 'muted', align: 'center' });
          // --- the graph ---
          const isP = law.value === 'p', ymax = isP ? RBAR * THI / PSTEP * 1.12 : 3 * PSTEP * THI / 293.15 * 1.12;
          sg.setView([-300, 330], [-0.075 * ymax, ymax]);
          sg.setTitle(isP ? 'molar volume $V_m$ (L/mol) against the gas temperature θ (°C)' : 'measured pressure $p$ (bar) against the gas temperature θ (°C)');
          sg.vline(-273.15, { color: 'red', width: 1.2, dash: [4, 3] });
          sg.text('absolute zero', -266, ymax * 0.95, { color: 'red', size: 11.5, align: 'left' });
          for (const S of series) {
            if (S.law !== law.value) continue;
            sg.dots(S.pts.map((q) => [q.th, q.y]), { r: 2.6, color: S.col, alpha: 0.55 });
            const F = fit(S); if (!F) continue;
            sg.line(F.th0, 0, F.lo, F.predict(F.lo), { color: S.col, width: 1.4, dash: [5, 4] });
            sg.line(F.lo, F.predict(F.lo), F.hi, F.predict(F.hi), { color: S.col, width: 2.2 });
            sg.dot(F.th0, 0, { r: 4.5, color: S.col });
            sg.text(`${S.k}×${PSTEP} bar${S.gas === 'lj' ? ', Xe' : ''}`, Math.min(F.hi, 285), F.predict(Math.min(F.hi, 285)), { color: S.col, size: 11, dx: -2, dy: -14, align: 'right' });
          }
          if (last) sg.dot(last.th, last.y, { r: 5, color: series[series.length - 1].col });
        }, { still: 45 });
        v.legend([['accent', 'measured windows, one colour per load', { dot: true }], ['muted', 'least-squares line, extended to zero', { dash: true }], ['red', 'θ = −273.15 °C', { dash: true }]]);
        v.readout(() => {
          const rows = series.filter((S) => S.law === law.value).map((S) => [S, fit(S)]).filter(([, F]) => F);
          if (!rows.length) return 'Collecting windows…';
          const ints = rows.map(([S, F]) => `$${v.fix(F.th0, 0)} \\pm ${v.fix(Math.max(1, 2 * F.se), 0)}$ °C (${S.k} weight${S.k > 1 ? 's' : ''}${S.gas === 'lj' ? ', xenon' : ''})`).join(', ');
          return `Extrapolated zero of each fitted line (±2 standard errors): ${ints} — against $-273.15$ °C. ` + (last ? `Latest window: gas at $${v.fix(last.th, 1)}$ °C, ${law.value === 'p' ? `$V_m = ${v.fix(last.y, 3)}$ L/mol` : `$p = ${v.fix(last.y, 2)}$ bar`}.` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3', kind: 'Principle', name: 'Avogadro’s principle',
      statement: String.raw`Equal volumes of different gases at the same temperature and pressure contain the same number of molecules. Equivalently, at fixed $T$ and $p$ the volume of a gas is proportional to the amount of substance, $V = V_m\,n$, with a **molar volume** $V_m$ that is the same for every gas (about 24.8 L/mol at 25 °C and 1 bar, 22.7 L/mol at 0 °C and 1 bar). Like the other gas laws it holds in the limit of low pressure.`,
      idea: String.raw`A heavy molecule moves slowly, so it strikes the wall less often, but each strike delivers more momentum; at a common temperature the mean kinetic energy $\tfrac12 m\langle v^2\rangle$ is the same for every gas (1.6), and the two effects cancel exactly: the impact rate goes as $1/\sqrt m$ and the impulse per impact as $\sqrt m$. Pressure therefore counts molecules, whatever their mass, which is how Avogadro's principle made it possible to weigh molecules relative to one another and fix the atomic weights. When the gas is crowded, molecular size and attraction — different for each gas — break the equality.`,
      caption: String.raw`Three boxes hold the **same number** of molecules (100) in the **same volume** at the **same temperature** (300 K): hydrogen, nitrogen and xenon, whose masses differ 65-fold. Each dial is a pressure gauge counting real impacts; the shaded arc is ±2 standard errors and the green mark the perfect-gas value $nRT/V$. The bars on the right show why the gauges agree: xenon hits the wall less often but harder, and on a log scale the two effects cancel. Crowd the boxes and the gauges part ways — xenon's attractions pull its reading down, hydrogen's size pushes it up.`,
      deps: [],
      refs: ['Atkins 1A'],
      tags: ['gas laws', 'mole'],
      credit: 'Avogadro, 1811 (made the basis of atomic weights by Cannizzaro, 1860)',
      scope: String.raw`Holds in the low-pressure limit. At 1 bar and room temperature real gases depart from it by less than about 1% (more for easily condensed gases such as xenon, CO₂ or water vapour); at hundreds of bar the departures reach tens of percent.`,
      viz(v) {
        const N = 100, T = 300, RATE = 15, GAS = [MOL.H2, MOL.N2, MOL.Xe], DT = [0.003, 0.012, 0.03], SETTLE = 15;
        const dens = v.slider('crowding $nRT/V$', 1, 300, 4, { log: true, fmt: (x) => `${x < 10 ? x.toFixed(1) : x.toFixed(0)} bar`, onChange: () => make() });
        v.button('Restart the gauges', () => make());
        const B = 10, GAP = 15.5, R = 4.2;
        const sa = v.stage({ x: [-2.5, 2 * GAP + B + 2.5], y: [-5.2, B + R + 3.4], equal: true, height: 330, axes: false, weight: 1.6 });
        const sr = v.stage({ x: [-0.3, 3], y: [0.1, 10], ylog: true, height: 330, axes: false, weight: 0.85, minWidth: 230, title: 'relative to the three-gas average (log scale)' });
        let G = [], s0 = [], tLast = 0, tSim = 0, L = 1;
        const make = () => {
          L = Math.cbrt(N * T / (dens.value / BAR));
          G = GAS.map((sp, k) => mdGas({ N, species: [sp], L: [L, L, L], mode: 'lj', T, rng: v.rng(31 + k) }));
          s0 = null; tSim = 0;
        };
        make();
        const read = () => (s0 ? G.map((g, k) => { const b = g.snap(), r = g.meas(s0[k], b); return { p: r.p * BAR, dp: r.dp * BAR, rate: r.hits / (r.dt * T0 * 1e9) / (6 * L * L * 1e-2), imp: (b.imp - s0[k].imp) / Math.max(1, r.hits) * 1.66054e-24 * VEL * 1e24, dt: r.dt }; }) : null);
        const dialAt = (cx, cy, rd, col, pid) => {
          const lo = 0, hi = 2 * pid, ang = (x) => Math.PI * (1 - Math.max(lo, Math.min(hi, x)) / hi);
          sa.curve((t) => [cx + R * Math.cos(t), cy + R * Math.sin(t)], 0, Math.PI, { color: 'muted', width: 1.5 });
          sa.line(cx - R, cy, cx + R, cy, { color: 'muted', width: 1 });
          for (let k = 0; k <= 8; k++) { const a = Math.PI * (1 - k / 8), r0 = k % 2 ? 0.88 : 0.8; sa.line(cx + R * r0 * Math.cos(a), cy + R * r0 * Math.sin(a), cx + R * Math.cos(a), cy + R * Math.sin(a), { color: 'muted', width: 1 }); }
          sa.text('0', cx - R, cy - 0.55, { size: 10, color: 'muted', align: 'center' });
          sa.text(v.fix(hi, hi < 10 ? 1 : 0), cx + R, cy - 0.55, { size: 10, color: 'muted', align: 'center' });
          const ag = ang(pid); sa.line(cx + 0.72 * R * Math.cos(ag), cy + 0.72 * R * Math.sin(ag), cx + 1.06 * R * Math.cos(ag), cy + 1.06 * R * Math.sin(ag), { color: 'green', width: 3 });
          if (rd) {
            const a0 = ang(rd.p - 2 * rd.dp), a1 = ang(rd.p + 2 * rd.dp);
            sa.curve((t) => [cx + 0.94 * R * Math.cos(t), cy + 0.94 * R * Math.sin(t)], a1, a0, { color: col, width: 7, alpha: 0.3 });
            const a = ang(rd.p); sa.line(cx, cy, cx + 0.86 * R * Math.cos(a), cy + 0.86 * R * Math.sin(a), { color: col, width: 2.6 });
            sa.text(`${v.fix(rd.p, rd.p < 10 ? 2 : 1)} ± ${v.fix(2 * rd.dp, rd.p < 10 ? 2 : 1)} bar`, cx, cy - 0.85, { size: 11.5, color: col, align: 'center', weight: 600 });
          }
          sa.dot(cx, cy, { r: 3.5, color: 'ink' });
        };
        let RD = null;
        v.animate((t) => {
          if (t < tLast - 1e-6) make();
          const dT = Math.min(700, (t - tLast) * RATE); tLast = t;
          if (dT > 0) {
            const CH = 0.25;
            for (let done = 0; done < dT - 1e-9; done += CH) { G.forEach((g, k) => g.run(CH, DT[k])); tSim += CH; if (!s0 && tSim >= SETTLE) s0 = G.map((g) => g.snap()); }
          }
          RD = read();
          const pid = dens.value;
          GAS.forEach((sp, k) => {
            const x0 = k * GAP, g = G[k];
            sa.rect(x0, 0, x0 + B, B, { fill: sp.col, fillAlpha: 0.05, color: 'ink', width: 1.4 });
            const idx = Array.from({ length: N }, (_, i) => i).sort((a, b) => g.z[b] - g.z[a]), sc = B / L;
            for (const i of idx) sa.dot(x0 + g.x[i] * sc, g.y[i] * sc, { r: Math.max(1.4, sp.sig / 2 * sc * sa.scale), color: sp.col, alpha: 0.35 + 0.55 * (1 - g.z[i] / L), ring: false });
            dialAt(x0 + B / 2, B + 1.6, RD && RD[k], sp.col, pid);
            sa.tex(sp.tex, x0 + B / 2, -1.15, { color: sp.col, size: 16 });
            const mass = N * sp.m * 1.66054e-27;
            sa.text(`mass of gas ${v.M.si(mass * 1000, 'g')}`, x0 + B / 2, -2.75, { size: 11, color: 'muted', align: 'center' });
            const w = (B - 1) * sp.m / GAS[2].m;
            sa.rect(x0 + 0.5, -4.6, x0 + 0.5 + Math.max(0.12, w), -3.8, { fill: sp.col, fillAlpha: 0.75, stroke: false });
          });
          sa.corner(`${N} molecules each · box ${v.fix(L / 10, 2)} nm wide · T = ${T} K · ${v.fix(tSim * T0 * 1e9, 2)} ns`, 'tl', { size: 11 });
          // why: rate × impulse
          if (RD) {
            const gm = (f) => Math.cbrt(f(RD[0]) * f(RD[1]) * f(RD[2]));
            const ref = { rate: gm((r) => r.rate), imp: gm((r) => r.imp), p: gm((r) => r.p) };
            for (const yv of [0.2, 0.5, 2, 5]) { sr.hline(yv, { color: 'grid', width: 1 }); sr.text(String(yv), -0.27, yv, { size: 10, color: 'muted', align: 'left' }); }
            sr.hline(1, { color: 'ink', width: 1.2 }); sr.text('1', -0.27, 1, { size: 10, color: 'ink', align: 'left' });
            GAS.forEach((sp, k) => {
              const x = k + 0.5, rr = RD[k].rate / ref.rate, ri = RD[k].imp / ref.imp, rp = RD[k].p / ref.p, e = 2 * RD[k].dp / RD[k].p;
              sr.rect(x - 0.34, 1, x - 0.06, rr, { fill: sp.col, fillAlpha: 0.75, stroke: false });
              sr.rect(x - 0.03, 1, x + 0.25, ri, { fill: sp.col, fillAlpha: 0.25, color: sp.col, width: 1.2 });
              sr.line(x + 0.36, rp * (1 - e), x + 0.36, rp * (1 + e), { color: 'green', width: 2 });
              sr.dot(x + 0.36, rp, { r: 4.5, color: 'green' });
              sr.tex(sp.tex, x, 0.135, { color: sp.col, size: 14 });
            });
            sr.text('impacts per second', 0.16, 8, { size: 10.5, color: 'muted', align: 'left' });
            sr.text('impulse per impact', 2.95, 0.25, { size: 10.5, color: 'muted', align: 'right' });
          }
        }, { still: 40 });
        v.legend([['green', 'dial: perfect-gas $nRT/V$ · right: measured pressure ±2σ', { dot: true }], ['muted', 'impacts per second (solid bars) and impulse per impact (open bars)', { area: true }]]);
        v.readout(() => {
          if (!RD) return 'Letting the gases settle…';
          const pm = RD.map((r) => r.p), spread = (Math.max(...pm) - Math.min(...pm)) / v.M.mean(pm), err = Math.max(...RD.map((r) => 2 * r.dp / r.p));
          const verdict = spread <= err * 1.2 ? `the three gauges agree within their error bars (spread ${v.fix(100 * spread, 1)}%, ±2σ up to ${v.fix(100 * err, 1)}%)` : `the gauges disagree by ${v.fix(100 * spread, 0)}% — more than the ±${v.fix(100 * err, 1)}% statistical error: at this crowding the gases are no longer perfect`;
          return `Same $N$, $V$, $T$: measured $p(\\mathrm{H_2}) = ${v.fix(pm[0], 2)}$, $p(\\mathrm{N_2}) = ${v.fix(pm[1], 2)}$, $p(\\mathrm{Xe}) = ${v.fix(pm[2], 2)}$ bar against $nRT/V = ${v.fix(dens.value, 2)}$ bar — ${verdict}. Hydrogen strikes ${v.fix(RD[0].rate / RD[2].rate, 1)}× as often as xenon, xenon ${v.fix(RD[2].imp / RD[0].imp, 1)}× as hard ($\\sqrt{65} = 8.1$).`;
        });
      },
    },
  ],
};
