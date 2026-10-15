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
    for (let cx = 0; cx < ncx; cx++) for (let cy = 0; cy < ncy; cy++) for (let cz = 0; cz < ncz; cz++) {
      const c = (cx * ncy + cy) * ncz + cz;
      for (let i = head[c]; i >= 0; i = next[i]) {
        const si = S[i] * ns;
        for (let ox = -1; ox <= 1; ox++) { const qx = cx + ox; if (qx < 0 || qx >= ncx) continue;
          for (let oy = -1; oy <= 1; oy++) { const qy = cy + oy; if (qy < 0 || qy >= ncy) continue;
            for (let oz = -1; oz <= 1; oz++) { const qz = cz + oz; if (qz < 0 || qz >= ncz) continue;
              const q = (qx * ncy + qy) * ncz + qz; if (q < c) continue;
              for (let j = q === c ? next[i] : head[q]; j >= 0; j = next[j]) {
                const k = si + S[j], dx = x[i] - x[j], dy = y[i] - y[j], dz = z[i] - z[j], r2 = dx * dx + dy * dy + dz * dz;
                if (r2 >= rc2[k]) continue;
                const ir2 = s2[k] / Math.max(r2, 0.5 * s2[k]), ir6 = ir2 * ir2 * ir2, f = 6 * e4[k] * ir6 * (2 * ir6 - 1) / Math.max(r2, 0.5 * s2[k]);
                fx[i] += f * dx; fy[i] += f * dy; fz[i] += f * dz; fx[j] -= f * dx; fy[j] -= f * dy; fz[j] -= f * dz;
              }
            }
          }
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
        const sp = v.stage({ x: [0, 0.84], y: [0, 400], height: 290, axes: 'box', title: 'measured pressure $p$ (bar) against $V_m$ (L/mol)' });
        const sz = v.stage({ x: [0, 0.84], y: [0.3, 1.4], height: 290, axes: 'box', title: 'Boyle product $pV_m/RT$ against $V_m$ (L/mol)' });
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
          const dT = Math.min(320, (t - tLast) * RATE); tLast = t;
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
          sp.setView([0, 0.84], [0, pmax]);
          sp.fn((Vm) => RBAR * T / Vm, { color: 'ink', width: 1.6, dash: [6, 4], domain: [0.06, 0.84] });
          sz.hline(1, { color: 'ink', width: 1.4, dash: [6, 4] });
          [[0, 'accent'], [1, 'purple']].forEach(([k, col]) => {
            sp.dots(pts[k].map((q) => [q.Vm, q.p]), { r: 2.3, color: col, alpha: 0.45 });
            sz.dots(pts[k].map((q) => [q.Vm, q.Z]), { r: 2.3, color: col, alpha: 0.45 });
            const bm = binMeans(pts[k], (q) => q.Vm, (q) => q.p, 0.07, 0.86, 12), bz = binMeans(pts[k], (q) => q.Vm, (q) => q.Z, 0.07, 0.86, 12);
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
          const zr = (k) => { const q = binMeans(pts[k], (r) => r.Vm, (r) => r.Z, 0.07, 0.86, 12); return q.length ? [Math.min(...q.map((r) => r[1])), Math.max(...q.map((r) => r[1]))] : [1, 1]; };
          const z0 = zr(0), z1 = zr(1);
          const now = A.length && B.length ? `Around $V_m = ${v.fix(Vc, 3)}$ L/mol (${A.length} windows): perfect gas $\\bar p = ${v.fix(avg(A, (q) => q.p), 1)}$ bar against $nRT/V = ${v.fix(avg(A, (q) => q.pid), 1)}$ bar; xenon $\\bar p = ${v.fix(avg(B, (q) => q.p), 1)}$ bar, $pV/nRT = ${v.fix(avg(B, (q) => q.Z), 2)}$. ` : '';
          return now + `Over the whole sweep the averaged Boyle product stays within $${v.fix(z0[0], 2)}$–$${v.fix(z0[1], 2)}$ for the perfect gas but wanders over $${v.fix(z1[0], 2)}$–$${v.fix(z1[1], 2)}$ for xenon.`;
        });
      },
    },
  ],
};
