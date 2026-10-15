// Classical Mechanics — Chapter 8: Central forces and orbits (part c: 8.16–8.22)

import { TAU, clamp, memo, rk4, centralOrbit, stateAt, kepEl, conicPts, span, sci, sun } from './ch08.shared.js';

/** Linear interpolation in a table of [x, y] rows sorted by x. */
function interp(tab, x) {
  if (x <= tab[0][0]) return tab[0][1];
  if (x >= tab[tab.length - 1][0]) return tab[tab.length - 1][1];
  let lo = 0, hi = tab.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tab[m][0] <= x) lo = m; else hi = m; }
  const u = (x - tab[lo][0]) / (tab[hi][0] - tab[lo][0]);
  return tab[lo][1] + u * (tab[hi][1] - tab[lo][1]);
}
/** Deflection angle (signed, radians) of a particle (m = 1, speed v0) sent along +x at impact parameter b past a central potential with
 *  radial acceleration acc(r); integrated from x = −X0 until it is X0 away again. */
function deflect(acc, b, v0, X0) {
  const R = centralOrbit(acc, [-Math.sqrt(Math.max(X0 * X0 - b * b, 1e-9)), b, v0, 0], { T: (6 * X0) / v0, eta: 0.01, rmax: X0 * 1.0001, rmin: 1e-4, maxSteps: 20000 });
  const L = R.s[R.s.length - 1];
  return { th: Math.atan2(L[3], L[2]), R };
}

// Yoshida's 4th-order symplectic composition (drift–kick), coefficients
const YW1 = 1 / (2 - Math.cbrt(2)), YW0 = -Math.cbrt(2) * YW1, YC = [YW1 / 2, (YW0 + YW1) / 2, (YW0 + YW1) / 2, YW1 / 2], YD = [YW1, YW0, YW1];
/** Planar three-body accelerations (G = 1); returns the smallest separation. */
function acc3(x, m, a) {
  a.fill(0); let rmin = Infinity;
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
    const dx = x[2 * j] - x[2 * i], dy = x[2 * j + 1] - x[2 * i + 1], r2 = dx * dx + dy * dy, r = Math.sqrt(r2), k = 1 / (r2 * r);
    rmin = Math.min(rmin, r); a[2 * i] += m[j] * k * dx; a[2 * i + 1] += m[j] * k * dy; a[2 * j] -= m[i] * k * dx; a[2 * j + 1] -= m[i] * k * dy;
  }
  return rmin;
}
function energy3(x, v, m) {
  let E = 0;
  for (let i = 0; i < 3; i++) E += 0.5 * m[i] * (v[2 * i] ** 2 + v[2 * i + 1] ** 2);
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) E -= (m[i] * m[j]) / Math.hypot(x[2 * j] - x[2 * i], x[2 * j + 1] - x[2 * i + 1]);
  return E;
}

// Geiger & Marsden (1913), Table I, gold foil: deflection (degrees) and scintillations counted (relative)
const GM1913 = [[150, 33.1], [135, 43.0], [120, 51.9], [105, 69.5], [75, 211], [60, 477], [45, 1435], [37.5, 3300], [30, 7800], [22.5, 27300], [15, 132000]];

export default {
  collection: 'mech',
  chapter: 8,
  items: [
    // ───────────────────────────────────────────────────────────── 8.16
    {
      num: '8.16',
      kind: 'Theorem',
      name: 'Virial theorem',
      statement: String.raw`For a system of particles whose positions and velocities stay bounded for all time, the long-time averages of the kinetic energy $T$ and of the virial $\sum_i\mathbf F_i\cdot\mathbf r_i$ satisfy
$$2\langle T\rangle = -\Big\langle\sum_i \mathbf F_i\cdot\mathbf r_i\Big\rangle .$$
If the forces come from a potential energy $U$ that is homogeneous of degree $k$ in the coordinates, $U(\lambda\mathbf r_1,\dots) = \lambda^kU(\mathbf r_1,\dots)$, this reads $2\langle T\rangle = k\langle U\rangle$: for gravity or the Coulomb force ($k = -1$) $\langle T\rangle = -\tfrac12\langle U\rangle$ and $\langle E\rangle = -\langle T\rangle < 0$; for springs ($k = 2$) $\langle T\rangle = \langle U\rangle$. The time average of $\tfrac{d}{dt}\sum\mathbf p_i\cdot\mathbf r_i$ is what vanishes, so the theorem fails for unbound motion.`,
      idea: String.raw`Let $G = \sum_i\mathbf p_i\cdot\mathbf r_i$. By Newton’s second law, $\dot G = \sum_i m_i|\dot{\mathbf r}_i|^2 + \sum_i\mathbf F_i\cdot\mathbf r_i = 2T + \sum\mathbf F_i\cdot\mathbf r_i$ (2.1). Averaging over $[0,t]$ with the fundamental theorem of calculus (pma-6.21) gives $\langle 2T + \sum\mathbf F_i\cdot\mathbf r_i\rangle_t = (G(t) - G(0))/t$, which tends to zero like $1/t$ whenever $G$ stays bounded. For a homogeneous potential Euler’s relation gives $\sum\mathbf r_i\cdot\nabla_iU = kU$, and $\mathbf F_i = -\nabla_iU$ (3.4). The same scaling idea underlies mechanical similarity (3.16).`,
      caption: String.raw`Sixteen particles attract each other (velocity Verlet); pick the pair force. Top right: the running time averages of $2T$ (gold) and of $-\sum\mathbf F_i\cdot\mathbf r_i$ (blue) — the faint gold curve is $2T$ itself — with $k\langle U\rangle$ dashed: they lock together although $T$ and $U$ keep fluctuating. Bottom: the gap between the two averages on log–log axes, falling like $1/t$ (dashed guide) because $G = \sum\mathbf p\cdot\mathbf r$ stays bounded. Choose the unbound start: the cluster flies apart, $G$ grows, and the gap stops shrinking.`,
      deps: ['mech-2.1', 'mech-3.4', 'mech-3.16', 'pma-6.21'],
      refs: ['Goldstein §3.4'],
      tags: ['virial', 'time average', 'many-body'],
      credit: 'Rudolf Clausius, 1870',
      scope: String.raw`Needs bounded positions and velocities (or at least $G$ growing slower than $t$); with gravity, softening of close encounters changes $k\langle U\rangle$ slightly but not the general form with $\sum\mathbf F\cdot\mathbf r$.`,
      viz(v) {
        const N = 16;
        const LAW = {
          grav: { label: 'gravity ($k=-1$)', k: -1, kick: 0.45 },
          unbound: { label: 'gravity, unbound start', k: -1, kick: 1.9 },
          spring: { label: 'springs ($k=2$)', k: 2, kick: 0.6 },
          quartic: { label: 'quartic ($k=4$)', k: 4, kick: 0.6 },
        };
        const law = v.select('pair potential', Object.entries(LAW).map(([value, q]) => ({ value, label: q.label })), 'grav');
        const s = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, axes: false, height: 300 });
        const a = v.stage({ x: [0, 60], y: [0, 1], axes: 'box', height: 300, xlabel: 't', title: 'running averages', weight: 1.3 });
        const c = v.stage({ x: [0.3, 60], y: [1e-4, 10], xlog: true, ylog: true, axes: 'box', height: 200, full: true, xlabel: 't (log)', title: 'gap $|\\langle 2T\\rangle_t - \\langle -\\sum\\mathbf F\\cdot\\mathbf r\\rangle_t| = |G(t) - G(0)|/t$' });
        const cache = memo(); let cur = null;
        const run = () => cache(law.value, () => {
          const L = LAW[law.value], m = 1 / N, eps2 = 0.06 ** 2, r = v.rng(7);
          // pair force magnitude along r̂ (positive = repulsive) and pair potential
          const pf = law.value === 'spring' ? (d) => -m * m * N * d : law.value === 'quartic' ? (d) => -m * m * N * d ** 3 : (d) => (-m * m * d) / (d * d + eps2) ** 1.5;
          const pu = law.value === 'spring' ? (d) => 0.5 * m * m * N * d * d : law.value === 'quartic' ? (d) => 0.25 * m * m * N * d ** 4 : (d) => (-m * m) / Math.sqrt(d * d + eps2);
          const x = [], vel = [];
          for (let i = 0; i < N; i++) { const rr = Math.sqrt(r()) * 1.0, ph = TAU * r(); x.push(rr * Math.cos(ph), rr * Math.sin(ph)); vel.push(r.normal(), r.normal()); }
          // remove centre-of-mass motion and set the kinetic energy relative to |U|
          for (const arr of [x, vel]) { let mx = 0, my = 0; for (let i = 0; i < N; i++) { mx += arr[2 * i] / N; my += arr[2 * i + 1] / N; } for (let i = 0; i < N; i++) { arr[2 * i] -= mx; arr[2 * i + 1] -= my; } }
          const forces = (X, F) => { F.fill(0); let U = 0, W = 0; for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { const dx = X[2 * j] - X[2 * i], dy = X[2 * j + 1] - X[2 * i + 1], d = Math.hypot(dx, dy), f = pf(d) / d; F[2 * j] += f * dx; F[2 * j + 1] += f * dy; F[2 * i] -= f * dx; F[2 * i + 1] -= f * dy; U += pu(d); W += f * d * d; } return { U, W }; };
          const F = new Array(2 * N).fill(0); let st = forces(x, F);
          let T0 = 0; for (let i = 0; i < 2 * N; i++) T0 += 0.5 * m * vel[i] ** 2;
          const target = L.kick * Math.abs(st.U - (law.value === 'grav' || law.value === 'unbound' ? 0 : 0)), sc = Math.sqrt(target / T0);
          for (let i = 0; i < 2 * N; i++) vel[i] *= sc;
          const dt = 0.001, TT = 60, every = 25, nSteps = Math.round(TT / dt);
          const rec = { t: [], T: [], U: [], W: [], G: [], x: [], E0: 0 };
          let intT = 0, intW = 0, intU = 0; const avT = [], avW = [], avU = [];
          const kin = () => { let T = 0; for (let i = 0; i < 2 * N; i++) T += 0.5 * m * vel[i] ** 2; return T; };
          const Gf = () => { let G = 0; for (let i = 0; i < 2 * N; i++) G += m * vel[i] * x[i]; return G; };
          let T = kin(); rec.E0 = T + st.U; const G0 = Gf();
          let dEmax = 0;
          for (let n = 0; n <= nSteps; n++) {
            if (n % every === 0) { rec.t.push(n * dt); rec.T.push(T); rec.U.push(st.U); rec.W.push(st.W); rec.G.push(Gf()); rec.x.push(x.slice()); }
            if (n === nSteps) break;
            // velocity Verlet
            for (let i = 0; i < 2 * N; i++) { vel[i] += (0.5 * dt * F[i]) / m; x[i] += dt * vel[i]; }
            const Tb = T, Wb = st.W, Ub = st.U;
            st = forces(x, F);
            for (let i = 0; i < 2 * N; i++) vel[i] += (0.5 * dt * F[i]) / m;
            T = kin();
            intT += 0.5 * dt * (2 * Tb + 2 * T); intW += 0.5 * dt * (-Wb - st.W); intU += 0.5 * dt * L.k * (Ub + st.U);
            if ((n + 1) % every === 0) { const t = (n + 1) * dt; avT.push([t, intT / t]); avW.push([t, intW / t]); avU.push([t, intU / t]); }
            dEmax = Math.max(dEmax, Math.abs(T + st.U - rec.E0));
          }
          const gap = avT.map((q, i) => [q[0], Math.abs(q[1] - avW[i][1])]);
          const Gdev = rec.G.map((g) => Math.abs(g - G0)), Gmax = Math.max(...Gdev);
          return { L, rec, avT, avW, avU, gap, G0, Gmax, dEmax, TT, dt: dt * every };
        });
        v.animate((t) => {
          const D = run(), n = D.rec.t.length - 1, k = Math.min(n, Math.round(((t * D.TT) / 20) / D.dt));
          // particles with short trails
          for (let j = Math.max(0, k - 12); j < k; j++) s.dots(Array.from({ length: N }, (_, i) => [D.rec.x[j][2 * i], D.rec.x[j][2 * i + 1]]), { r: 1.4, color: 'accent', alpha: 0.25 });
          s.dots(Array.from({ length: N }, (_, i) => [D.rec.x[k][2 * i], D.rec.x[k][2 * i + 1]]), { r: 4.2, color: 'gold' });
          s.corner(`t = ${v.fix(D.rec.t[k], 1)}`, 'tl', { color: 'muted' });
          if (law.value === 'unbound') s.corner('E > 0: unbound', 'tr', { color: 'red', weight: 600 });
          // running averages
          const tk = D.rec.t[k], vis = (arr) => arr.filter((q) => q[0] <= tk);
          const ys = [D.avT.map((q) => q[1]), D.avW.map((q) => q[1]), D.rec.T.map((x) => 2 * x)];
          a.setView([0, D.TT], span(ys, 0.08, 0.05));
          a.path(D.rec.t.map((x, i) => [x, 2 * D.rec.T[i]]).filter((q) => q[0] <= tk), { color: 'gold', width: 1, alpha: 0.35 });
          a.path(vis(D.avU), { color: 'purple', width: 1.6, dash: [5, 4] });
          a.path(vis(D.avW), { color: 'blue', width: 2.6 });
          a.path(vis(D.avT), { color: 'gold', width: 2.2 });
          a.vline(tk, { color: 'faint', width: 1 });
          // convergence
          c.path(vis(D.gap).filter((q) => q[1] > 0), { color: law.value === 'unbound' ? 'red' : 'green', width: 2.2 });
          c.fn((x) => D.Gmax / x, { color: 'muted', width: 1.2, dash: [5, 4] });
          cur = { D, k };
        }, { period: 20, still: 19.5 });
        v.legend([['gold', '$\\langle 2T\\rangle_t$ (faint: $2T$)'], ['blue', '$\\langle -\\sum\\mathbf F\\cdot\\mathbf r\\rangle_t$'], ['purple', '$k\\langle U\\rangle_t$', { dash: true }], ['muted', '$\\max|G - G_0|/t$', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { D, k } = cur, i = Math.max(0, Math.min(D.avT.length - 1, Math.round((D.rec.t[k] / D.TT) * D.avT.length) - 1));
          const aT = D.avT[i][1], aW = D.avW[i][1], aU = D.avU[i][1];
          const base = String.raw`at $t = ${v.fix(D.avT[i][0], 1)}$: $\langle 2T\rangle = ${v.fix(aT, 4)}$, $\langle -\sum\mathbf F\cdot\mathbf r\rangle = ${v.fix(aW, 4)}$, $k\langle U\rangle = ${v.fix(aU, 4)}$ ($k = ${D.L.k}$) · gap $${sci(v, Math.abs(aT - aW))}$ · energy drift $${sci(v, D.dEmax)}$`;
          if (law.value === 'unbound') return base + String.raw` · $E = ${v.fix(D.rec.E0, 3)} > 0$: $G$ has grown to $${v.fix(D.rec.G[k] - D.rec.G[0], 2)}$, so the gap $(G - G_0)/t$ levels off instead of vanishing — no virial balance for unbound motion`;
          return base + String.raw` · $G$ stays within $\pm${v.fix(D.Gmax, 3)}$ of its start, so the gap is at most $${v.fix(D.Gmax, 3)}/t$` + (D.L.k === -1 ? ' (softened gravity: $k\\langle U\\rangle$ differs slightly from the exact virial)' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.17
    {
      num: '8.17',
      kind: 'Definition',
      name: 'Scattering angle and cross-section',
      statement: String.raw`A uniform beam of particles with intensity $I$ (particles per unit area per unit time) is sent at a fixed target. A particle arriving with impact parameter $b$ (the distance of its incoming line from the centre) leaves at the **scattering angle** $\theta(b)$ between its outgoing and incoming directions. The **differential cross-section** is defined by the number scattered per unit time into the solid angle $d\Omega$ around $\theta$: $dN = I\,\frac{d\sigma}{d\Omega}\,d\Omega$. For a central force, particles in the ring $b\ldots b + db$ (area $2\pi b\,db$) land in the cone band $d\Omega = 2\pi\sin\theta\,d\theta$, so
$$\frac{d\sigma}{d\Omega} = \frac{b}{\sin\theta}\,\Big|\frac{db}{d\theta}\Big|,$$
summed over all $b$ giving the same $\theta$. The total cross-section $\sigma = \int\frac{d\sigma}{d\Omega}\,d\Omega$ is the effective area of the target. Where $d\theta/db = 0$ (a *rainbow* angle) the cross-section diverges.`,
      idea: String.raw`Conservation of particles: everything entering through the annulus of area $2\pi b\,|db|$ must leave through the corresponding band on the unit sphere of area $2\pi\sin\theta\,|d\theta|$; the cross-section is the ratio of the two areas. The deflection function $\theta(b)$ comes from the orbit in the effective potential (8.3): $\theta = \pi - 2\int_{r_{\min}}^\infty \frac{b\,dr}{r^2\sqrt{1 - b^2/r^2 - U(r)/E}}$. For a hard sphere of radius $R$, reflection at the surface gives $b = R\cos(\theta/2)$ and $d\sigma/d\Omega = R^2/4$ — the same in every direction — with total $\sigma = \pi R^2$, the sphere’s shadow.`,
      caption: String.raw`A beam comes in from the left. Drag the orange handle to pick a thin ring of impact parameters $b$; its rays are drawn in orange and land in the orange band of angles. Middle: the deflection function $\theta(b)$, with the ring mapped to its band. Right: 6000 beam particles, sampled uniformly over the beam, binned by angle and divided by solid angle (bars), against $b\,|db/d\theta|/\sin\theta$ (curve). The hard sphere scatters isotropically. The attractive well has a rainbow: $\theta(b)$ turns round, and the counts pile up at that angle.`,
      deps: ['mech-8.3'],
      refs: ['Taylor §14.4', 'Goldstein §3.10'],
      tags: ['scattering', 'cross-section'],
      viz(v) {
        const TG = {
          sphere: { label: 'hard sphere', bmax: 1, X0: 3 },
          hill: { label: 'repulsive hill', bmax: 2.4, X0: 6, U0: 1.4 },
          well: { label: 'attractive well (rainbow)', bmax: 2.4, X0: 6, U0: -1.2 },
        };
        const tg = v.select('target', Object.entries(TG).map(([value, q]) => ({ value, label: q.label })), 'sphere');
        const s = v.stage({ x: [-3.2, 3.2], y: [-1.7, 1.7], equal: true, axes: false, height: 250, full: true, title: 'side view: beam from the left (energy $E = 1$, $m = 1$)' });
        const g = v.stage({ x: [0, 1], y: [0, 180], axes: 'box', height: 260, xlabel: 'impact parameter b', ylabel: 'θ (°)', title: 'deflection function $\\theta(b)$' });
        const h = v.stage({ x: [0, 180], y: [0, 1], axes: 'box', height: 260, xlabel: 'θ (°)', title: 'cross-section $d\\sigma/d\\Omega$' });
        const Hb = s.handle(-2.9, 0.45, { color: 'orange', r: 6, label: 'b', labelPos: 'w', constrain: (x, y) => [-2.9, clamp(Math.abs(y), 0.02, TG[tg.value].bmax * (tg.value === 'sphere' ? 0.97 : 0.9) * (s.bounds ? 1 : 1))] });
        const v0 = Math.SQRT2, DB = 0.05;
        const cache = memo(); let cur = null;
        const run = () => cache(tg.value, () => {
          const Q = TG[tg.value];
          let theta, trajs = [];
          if (tg.value === 'sphere') theta = (b) => (b < 1 ? Math.PI - 2 * Math.asin(b) : 0);
          else {
            const acc = (r) => 2 * Q.U0 * r * Math.exp(-r * r); // −dU/dr for U = U0 e^{−r²}
            const tab = []; for (let i = 0; i <= 300; i++) { const b = (Q.bmax * i) / 300; tab.push([b, Math.abs(deflect(acc, Math.max(b, 1e-4), v0, Q.X0).th)]); }
            theta = (b) => interp(tab, b);
            Q.acc = acc;
          }
          const tabT = []; for (let i = 0; i <= 400; i++) { const b = (Q.bmax * i) / 400; tabT.push([b, theta(b)]); }
          // Monte Carlo: b uniform over the disc of radius bmax (b = bmax √u), binned in θ
          const r = v.rng(11), NMC = 6000, nb = 36, cnt = new Array(nb).fill(0);
          for (let i = 0; i < NMC; i++) { const b = Q.bmax * Math.sqrt(r()), th = theta(b); const k = Math.min(nb - 1, Math.floor((th / Math.PI) * nb)); cnt[k]++; }
          const I = NMC / (Math.PI * Q.bmax ** 2), dth = Math.PI / nb;
          const hist = cnt.map((n, k) => { const t0 = k * dth, t1 = t0 + dth, dO = TAU * (Math.cos(t0) - Math.cos(t1)); return [((t0 + t1) / 2) * (180 / Math.PI), n / (I * dO)]; });
          // formula b |db/dθ| / sin θ from the tabulated deflection function (summing branches)
          const formula = [];
          for (let k = 1; k < 180; k++) {
            const th = (k * Math.PI) / 180; let sum = 0;
            for (let i = 0; i < tabT.length - 1; i++) { const [b0, t0] = tabT[i], [b1, t1] = tabT[i + 1]; if ((t0 - th) * (t1 - th) <= 0 && t1 !== t0) { const bb = b0 + ((th - t0) / (t1 - t0)) * (b1 - b0); sum += (bb * Math.abs((b1 - b0) / (t1 - t0))) / Math.sin(th); } }
            formula.push([k, sum]);
          }
          let rb = null; if (tg.value === 'well') { let best = 0; for (const [b, t] of tabT) if (t > best) { best = t; rb = b; } rb = { b: rb, th: best }; }
          return { Q, theta, tabT, hist, formula, rb, sigma: (NMC - cnt[0] * 0) / I };
        });
        v.render(() => {
          const D = run(), Q = D.Q, b0 = Hb.y, b1 = Math.min(b0 + DB, Q.bmax);
          const th0 = D.theta(b0), th1 = D.theta(b1);
          s.setView([-3.2, 3.2], [-1.7, 1.7]);
          // target
          if (tg.value === 'sphere') s.circle(0, 0, 1, { fill: 'accent', fillAlpha: 0.25, color: 'accent', width: 1.5 });
          else for (let k = 6; k >= 1; k--) s.circle(0, 0, 0.35 * k, { fill: Q.U0 > 0 ? 'red' : 'blue', fillAlpha: 0.05, stroke: false });
          // detector arc and the landing band
          const Rd = 2.6;
          s.curve((u) => [Rd * Math.cos(u), Rd * Math.sin(u)], -Math.PI, Math.PI, { color: 'faint', width: 1, dash: [3, 4] });
          for (const sg of [1, -1]) s.curve((u) => [Rd * Math.cos(sg * u), Rd * Math.sin(sg * u)], Math.min(th0, th1), Math.max(th0, th1) + 1e-3, { color: 'orange', width: 6, alpha: 0.6 });
          // rays
          const ray = (b, st) => {
            const sg = Math.sign(b) || 1, ab = Math.abs(b);
            if (tg.value === 'sphere') {
              if (ab >= 1) { s.line(-3.3, b, 3.3, b, st); return; }
              const xh = -Math.sqrt(1 - ab * ab), out = Math.PI - 2 * Math.asin(ab);
              s.line(-3.3, b, xh, b, st); s.line(xh, b, xh + 4 * Math.cos(sg * out), b + 4 * Math.sin(sg * out), st);
            } else {
              const R = deflect(Q.acc, sg * Math.max(ab, 1e-4), v0, 3.4).R;
              s.path(R.s.map((S) => [S[0], S[1]]), st);
            }
          };
          const nr = 13; for (let i = -nr; i <= nr; i++) { const b = (Q.bmax * 1.15 * i) / nr; ray(b, { color: 'muted', width: 1, alpha: 0.55 }); }
          for (const b of [b0, b0 + DB / 2, b1]) for (const sg of [1, -1]) ray(sg * b, { color: 'orange', width: 1.8 });
          s.line(-2.9, -b0, -2.9, -b1, { color: 'orange', width: 4, alpha: 0.6 });
          // deflection function
          g.setView([0, Q.bmax], [0, 185]);
          g.vband(b0, b1, { color: 'orange', alpha: 0.25 });
          g.hband(Math.min(th0, th1) * (180 / Math.PI), Math.max(th0, th1) * (180 / Math.PI) + 0.4, { color: 'orange', alpha: 0.25 });
          g.path(D.tabT.map(([b, t]) => [b, (t * 180) / Math.PI]), { color: 'accent', width: 2.4 });
          if (D.rb) { g.hline((D.rb.th * 180) / Math.PI, { color: 'red', dash: [4, 4], width: 1.2 }); g.text('rainbow', Q.bmax * 0.97, (D.rb.th * 180) / Math.PI, { color: 'red', size: 11, align: 'right', dy: -9 }); }
          // cross-section
          const ymax = tg.value === 'sphere' ? 0.5 : Math.max(0.5, Math.min(6, 1.3 * Math.max(...D.hist.slice(1).map((q) => q[1]))));
          h.setView([0, 180], [0, ymax]);
          h.bars(D.hist.map((q) => q[1]), { x0: D.hist[0][0], dx: 5, color: 'gold', fillAlpha: 0.55, barWidth: 0.92 });
          h.path(D.formula.filter((q) => q[1] < ymax * 3), { color: 'accent', width: 2.2 });
          if (tg.value === 'sphere') h.hline(0.25, { color: 'green', dash: [5, 4], width: 1.4 });
          const mid = ((th0 + th1) / 2) * (180 / Math.PI);
          h.vline(mid, { color: 'orange', width: 1.5 });
          const dsig = TAU * ((b0 + b1) / 2) * (b1 - b0), dOm = TAU * Math.sin((th0 + th1) / 2) * Math.abs(th1 - th0);
          cur = { D, b0, b1, th0, th1, dsig, dOm };
        });
        v.legend([['orange', 'the chosen ring $b\\ldots b+db$ and its band'], ['accent', '$\\theta(b)$; formula $b|db/d\\theta|/\\sin\\theta$'], ['gold', 'Monte Carlo counts / solid angle', { area: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { D, b0, b1, th0, th1, dsig, dOm } = cur;
          let out = String.raw`ring $b = ${v.fix(b0, 3)}\ldots${v.fix(b1, 3)}$: area $d\sigma = 2\pi b\,db = ${v.fix(dsig, 4)}$ lands in $\theta = ${v.fix((th0 * 180) / Math.PI, 1)}°\ldots${v.fix((th1 * 180) / Math.PI, 1)}°$, solid angle $d\Omega = 2\pi\sin\theta\,d\theta = ${v.fix(dOm, 4)}$ · ratio $d\sigma/d\Omega = ${v.fix(dsig / dOm, 3)}$`;
          if (tg.value === 'sphere') out += String.raw` (exact: $R^2/4 = 0.25$, the same at every angle) · total $\sigma = \pi R^2 = ${v.fix(Math.PI, 3)}$`;
          if (D.rb) out += String.raw` · rainbow at $\theta_r = ${v.fix((D.rb.th * 180) / Math.PI, 1)}°$ from $b = ${v.fix(D.rb.b, 2)}$, where $d\theta/db = 0$ and the cross-section is infinite`;
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.18
    {
      num: '8.18',
      kind: 'Theorem',
      name: 'Rutherford scattering formula',
      statement: String.raw`A particle of charge $q$ and kinetic energy $E$ scattered by a fixed point charge $Q$ (force $kqQ/r^2$, either sign) follows a hyperbola with deflection $\theta$ given by $\tan(\theta/2) = d/2b$, where $d = |kqQ|/E$ is the head-on distance of closest approach for repulsion. The differential cross-section is
$$\frac{d\sigma}{d\Omega} = \Big(\frac{d}{4}\Big)^2\frac{1}{\sin^4(\theta/2)} = \Big(\frac{kqQ}{4E}\Big)^2\frac{1}{\sin^4(\theta/2)},$$
independent of the sign of the charges, steeply forward-peaked, and with infinite total cross-section (the Coulomb force has infinite range). Classical mechanics happens to give the exact quantum-mechanical result. The formula fails once the particle reaches the nucleus itself, $r_{\min} \lesssim R_{\rm nucleus}$.`,
      idea: String.raw`The orbit is a conic (8.7) with eccentricity $e = \sqrt{1 + (2b/d)^2}$; the asymptotes make the angle $2\arcsin(1/e)$, which gives $\tan(\theta/2) = d/2b$. Inverting, $b = \tfrac d2\cot(\theta/2)$, and the definition of the cross-section (8.17) gives $b\,|db/d\theta|/\sin\theta = (d/4)^2/\sin^4(\theta/2)$. Only $b^2$ enters, so flipping the sign of the force (attractive orbits wrap around the nucleus) leaves $d\sigma/d\Omega$ unchanged. Geiger and Marsden’s 1913 counts of alpha particles scattered by gold foil followed the $1/\sin^4(\theta/2)$ law over a factor of 4000 in counting rate — the evidence for a tiny, massive, charged nucleus.`,
      caption: String.raw`Alpha particles ($z = 2$) from a uniform beam scatter off a nucleus (units: femtometres). Left: hyperbolas for evenly spaced impact parameters; the dashed circle is the head-on closest approach $d/2$… actually the turning radius for $b=0$ is $d$, drawn dashed, and the shaded disc is the nucleus. Right, on a log scale: 200 000 beam particles binned by angle per solid angle (dots), against Rutherford’s formula (curve) and Geiger and Marsden’s 1913 gold data (diamonds, one overall scale factor). Flip the charge: the paths change, the cross-section does not. Choose aluminium at high energy with the finite nucleus switched on to see the formula break at large angles.`,
      deps: ['mech-8.17', 'mech-8.7'],
      refs: ['Taylor §14.6', 'Goldstein §3.10'],
      tags: ['scattering', 'Coulomb', 'nucleus'],
      credit: 'Ernest Rutherford, 1911; Geiger and Marsden, 1913',
      scope: String.raw`Point charges, non-relativistic speeds, recoil neglected (or use the reduced mass and the CM angle, 8.19), screening by atomic electrons negligible (angles not too small), and closest approach outside the nucleus.`,
      viz(v) {
        const C = v.M.CONST, KE2 = (C.ke * C.e * C.e) / (1e6 * C.eV * 1e-15); // k e² in MeV·fm (≈ 1.44)
        const TGT = { gold: { label: 'gold (Z = 79)', Z: 79, A: 197 }, al: { label: 'aluminium (Z = 13)', Z: 13, A: 27 } };
        const tgt = v.select('target', Object.entries(TGT).map(([value, q]) => ({ value, label: q.label })), 'gold');
        const En = v.slider('alpha energy $E$ (MeV)', 2, 40, 7.7, { step: 0.1 });
        const flip = v.toggle('attractive (flip the charge)', false);
        const finite = v.toggle('finite nucleus (uniform sphere)', false);
        const s = v.stage({ x: [-120, 120], y: [-90, 90], equal: true, axes: false, height: 320, title: 'trajectories (fm)' });
        const g = v.stage({ x: [0, 180], y: [1e-4, 1e4], ylog: true, axes: 'box', height: 320, xlabel: 'θ (°)', title: 'counts per solid angle (log scale)', weight: 1.15 });
        const cache = memo(); let cur = null;
        const run = () => cache([tgt.value, En.value, flip.value, finite.value].join('|'), () => {
          const T = TGT[tgt.value], E = En.value, d = (KE2 * 2 * T.Z) / E, Rn = 1.2 * Math.cbrt(T.A) + 1.2 * Math.cbrt(4), sg = flip.value ? -1 : 1;
          // potential energy / E as a function of r (fm): point charge d/r, or a uniform sphere of radius Rn inside
          const acc = (r) => sg * (finite.value && r < Rn ? (2 * d * r) / Rn ** 3 : (2 * d) / (r * r)) * 0.5 * 2; // −dU/dr with m = 1, E = 1 (v0 = √2), U = E·d/r
          const v0 = Math.SQRT2, X0 = 60 * d;
          // deflection table on log-spaced b (fm)
          const tab = []; for (let i = 0; i <= 500; i++) { const b = d * 10 ** (-3 + (5 * i) / 500); tab.push([b, Math.abs(deflect(acc, b, v0, X0).th)]); }
          tab.unshift([0, Math.PI]);
          const bmax = 20 * d, r = v.rng(5), NMC = 200000, nb = 34, cnt = new Array(nb).fill(0);
          for (let i = 0; i < NMC; i++) { const b = bmax * Math.sqrt(r()), th = interp(tab, b); const k = Math.floor(((th * 180) / Math.PI - 10) / 5); if (k >= 0 && k < nb) cnt[k]++; }
          const I = NMC / (Math.PI * bmax * bmax);
          const pts = cnt.map((n, k) => { const t0 = ((10 + 5 * k) * Math.PI) / 180, t1 = t0 + (5 * Math.PI) / 180, dO = TAU * (Math.cos(t0) - Math.cos(t1)); return [10 + 5 * k + 2.5, n / (I * dO), n]; });
          const fans = []; for (let i = -12; i <= 12; i++) { const b = (i / 12) * 3.2 * d; if (Math.abs(b) < 1e-9) continue; fans.push(deflect(acc, b, v0, 3.5 * d).R); }
          fans.push(deflect(acc, 1e-3 * d, v0, 3.5 * d).R);
          // Geiger–Marsden scale factor: least squares in log against the formula
          const ruth = (th) => (d / 4) ** 2 / Math.sin((th * Math.PI) / 360) ** 4;
          let lsum = 0; for (const [th, n] of GM1913) lsum += Math.log(ruth(th) / n);
          const gmScale = Math.exp(lsum / GM1913.length);
          return { T, E, d, Rn, pts, fans, ruth, gmScale, sg };
        });
        v.render(() => {
          const D = run(), d = D.d, lim = 3.4 * d;
          s.setView([-lim * 1.25, lim * 1.25], [-lim, lim]);
          s.circle(0, 0, d, { color: 'muted', width: 1, dash: [4, 4] });
          s.circle(0, 0, D.Rn, { fill: 'red', fillAlpha: 0.35, color: 'red', width: 1 });
          for (const R of D.fans) s.path(R.s.map((S) => [S[0], S[1]]), { color: D.sg > 0 ? 'accent' : 'purple', width: 1.3, alpha: 0.85 });
          s.dot(0, 0, { r: 3, color: 'red' });
          s.corner(`d = ${v.fix(d, 1)} fm, nucleus ${v.fix(D.Rn, 1)} fm`, 'tl', { color: 'muted', size: 11.5 });
          // cross-section, log scale
          const ys = D.pts.filter((q) => q[2] > 0).map((q) => q[1]);
          const lo = Math.min(...ys, D.ruth(180)) / 3, hi = Math.max(...ys, D.ruth(10)) * 3;
          g.setView([0, 180], [lo, hi]);
          g.fn((th) => (th > 1 ? D.ruth(th) : NaN), { color: 'accent', width: 2 });
          for (const q of D.pts) if (q[2] > 0) g.dot(q[0], q[1], { r: 3.4, color: 'gold' });
          if (tgt.value === 'gold') for (const [th, n] of GM1913) { const y = n * D.gmScale; g.poly([[th - 2.5, y], [th, y * 1.25], [th + 2.5, y], [th, y / 1.25]], { fill: 'ink', fillAlpha: 0.8, color: 'ink', width: 1 }); }
          cur = { D };
        });
        v.legend([['accent', 'Rutherford $(d/4)^2/\\sin^4(\\theta/2)$'], ['gold', 'simulated beam', { dot: true }], ['ink', 'Geiger & Marsden 1913 (gold)', { dot: true }], ['red', 'nucleus', { area: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { D } = cur, d = D.d;
          const mid = D.pts.filter((q) => q[0] > 30 && q[0] < 150 && q[2] > 20), ratio = mid.map((q) => q[1] / D.ruth(q[0])), mean = ratio.reduce((a, b) => a + b, 0) / (ratio.length || 1), dev = Math.max(...ratio.map((x) => Math.abs(x - 1)));
          const back = D.pts.filter((q) => q[0] > 150 && q[2] > 0), bratio = back.length ? back.reduce((a, q) => a + q[1] / D.ruth(q[0]), 0) / back.length : NaN;
          let out = String.raw`$d = kzZe^2/E = ${v.fix(KE2, 3)}\times 2\times ${D.T.Z}/${v.fix(D.E, 1)} = ${v.fix(d, 2)}$ fm · simulated ÷ formula for $30°$–$150°$: ${v.fix(mean, 3)} (largest deviation ${v.fix(100 * dev, 1)}%, statistical)`;
          if (finite.value && d < D.Rn) out += String.raw` · backscattering ($>150°$) is only ${v.fix(100 * bratio, 0)}% of Rutherford: the alphas reach the nucleus ($d = ${v.fix(d, 1)} < R = ${v.fix(D.Rn, 1)}$ fm) and the $1/r$ potential is cut off — real nuclei deviate further through the strong force`;
          else if (finite.value) out += String.raw` · the alphas never get closer than $${v.fix(d / 2 * (1 + 1), 1)}$… at least $d/2$… so the finite size does not matter here`;
          if (D.sg < 0) out += ' · attractive force: the same $|\\theta(b)|$, so the same cross-section';
          if (tgt.value === 'gold') out += String.raw` · Geiger–Marsden: $N\sin^4(\theta/2)$ stays within ±${v.fix(100 * Math.max(...GM1913.map(([th, n]) => Math.abs((n * Math.sin((th * Math.PI) / 360) ** 4) / 31 - 1))), 0)}% of constant over a ${v.fix(132000 / 33.1, 0)}-fold range of counts`;
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.19
    {
      num: '8.19',
      kind: 'Proposition',
      name: 'Laboratory and centre-of-mass scattering angles',
      statement: String.raw`In an elastic collision of a projectile of mass $m_1$ with a target of mass $m_2$ initially at rest, let $\chi$ be the projectile’s scattering angle in the centre-of-mass frame and $\theta$ its angle in the laboratory. Then
$$\tan\theta = \frac{\sin\chi}{\cos\chi + m_1/m_2}.$$
For $m_1 < m_2$ every lab angle from $0$ to $\pi$ occurs; for $m_1 = m_2$, $\theta = \chi/2 \le \pi/2$; for $m_1 > m_2$ the lab angle can never exceed $\theta_{\max} = \arcsin(m_2/m_1)$. Lab and CM cross-sections differ by the Jacobian: $\sigma_{\rm lab}(\theta)\sin\theta\,d\theta = \sigma_{\rm cm}(\chi)\sin\chi\,d\chi$.`,
      idea: String.raw`In the centre-of-mass frame (2.5) the two particles approach and recede with fixed speeds, so the projectile’s final CM velocity $\mathbf v_1'$ has length $u\,m_2/(m_1+m_2)$ and only its direction $\chi$ depends on the collision. The lab velocity is $\mathbf V + \mathbf v_1'$ with $\mathbf V = u\,m_1/(m_1+m_2)$ along the beam: its tip lies on a circle of radius $|\mathbf v_1'|$ centred at the tip of $\mathbf V$. If $m_1 > m_2$ the origin lies outside this circle and the steepest lab direction is the tangent from the origin, with $\sin\theta_{\max} = |\mathbf v_1'|/|\mathbf V| = m_2/m_1$.`,
      caption: String.raw`Two smooth discs collide elastically; set the mass ratio and the impact parameter (which fixes $\chi$). Top: the same collision in the lab (target at rest) and in the CM frame (equal and opposite momenta, speeds unchanged). Bottom left: the velocity diagram — the final lab velocity of the projectile always ends on the dashed circle around the tip of the CM velocity. Make the projectile heavier: the origin leaves the circle, the tangents mark the largest possible lab angle, and on the right the curve $\theta(\chi)$ tops out at $\arcsin(m_2/m_1)$.`,
      deps: ['mech-8.17', 'mech-2.5'],
      refs: ['Taylor §14.8', 'Goldstein §3.11'],
      tags: ['collisions', 'reference frames', 'scattering'],
      viz(v) {
        const mr = v.slider('mass ratio $m_1/m_2$', 0.2, 5, 2.5, { log: true, step: 0.01 });
        const bS = v.slider('impact parameter $b/(R_1+R_2)$', 0, 0.98, 0.45, { step: 0.01 });
        const sl = v.stage({ x: [-3, 3], y: [-1.6, 1.6], equal: true, axes: false, height: 210, title: 'laboratory frame' });
        const sc = v.stage({ x: [-3, 3], y: [-1.6, 1.6], equal: true, axes: false, height: 210, title: 'centre-of-mass frame' });
        const vd = v.stage({ x: [-0.3, 1.3], y: [-0.75, 0.75], equal: true, axes: false, height: 270, title: 'velocity diagram (units of $u$)' });
        const cg = v.stage({ x: [0, 180], y: [0, 180], axes: 'box', height: 270, xlabel: 'CM angle χ (°)', ylabel: 'lab angle θ (°)', title: 'lab angle against CM angle' });
        const cache = memo(); let cur = null;
        const run = () => cache([mr.value, bS.value].join('|'), () => {
          const q = mr.value, m1 = q / (1 + q), m2 = 1 / (1 + q), R1 = 0.28 * Math.cbrt(m1 / 0.5), R2 = 0.28 * Math.cbrt(m2 / 0.5), Rs = R1 + R2, u = 1;
          const b = bS.value * Rs;
          // event-driven hard-disc collision: projectile from (-2.4, b) moving +x, target at rest at the origin
          const p0 = [-2.4, b], tc = (-p0[0] - Math.sqrt(Rs * Rs - b * b)) / u; // contact time
          const pc = [p0[0] + u * tc, b], n = [-pc[0] / Rs, -pc[1] / Rs]; // unit normal from projectile to target
          const vrel = u * n[0], J = (2 * m1 * m2 * vrel) / (m1 + m2); // impulse along n
          const v1 = [u - (J / m1) * n[0], -(J / m1) * n[1]], v2 = [(J / m2) * n[0], (J / m2) * n[1]];
          const V = (m1 * u) / (m1 + m2), w1 = [v1[0] - V, v1[1]];
          const chi = Math.atan2(Math.abs(w1[1]), w1[0]), thLab = Math.atan2(Math.abs(v1[1]), v1[0]), thT = Math.atan2(Math.abs(v2[1]), v2[0]);
          const thF = Math.atan2(Math.sin(chi), Math.cos(chi) + q);
          return { q, m1, m2, R1, R2, b, p0, tc, v1, v2, V, w1, chi, thLab, thT, thF, u };
        });
        v.animate((t) => {
          const D = run(), T = (t % 6) * 1.0, tt = T - 0.5; // time from the start of the run
          const posL = (tt2) => { if (tt2 < D.tc) return [[D.p0[0] + D.u * tt2, D.p0[1]], [0, 0]]; const dt = tt2 - D.tc; return [[D.p0[0] + D.u * D.tc + D.v1[0] * dt, D.p0[1] + D.v1[1] * dt], [D.v2[0] * dt, D.v2[1] * dt]]; };
          const cmAt = (tt2) => [(D.m1 * (D.p0[0] + D.u * tt2)) / 1, (D.m1 * D.p0[1]) / 1]; // centre of mass moves with V along x
          const draw = (s, frame) => {
            const tr1 = [], tr2 = [];
            for (let k = 0; k <= 60; k++) { const tk = (Math.max(0, tt) * k) / 60, [a, b2] = posL(tk), c = cmAt(tk); tr1.push(frame ? [a[0] - c[0], a[1] - c[1]] : a); tr2.push(frame ? [b2[0] - c[0], b2[1] - c[1]] : b2); }
            const [a, b2] = posL(Math.max(0, tt)), c = cmAt(Math.max(0, tt));
            const A = frame ? [a[0] - c[0], a[1] - c[1]] : a, B = frame ? [b2[0] - c[0], b2[1] - c[1]] : b2;
            s.path(tr1, { color: 'blue', width: 1.4, alpha: 0.6 }); s.path(tr2, { color: 'orange', width: 1.4, alpha: 0.6 });
            s.circle(A[0], A[1], D.R1, { fill: 'blue', fillAlpha: 0.55, color: 'blue', width: 1.2 });
            s.circle(B[0], B[1], D.R2, { fill: 'orange', fillAlpha: 0.55, color: 'orange', width: 1.2 });
            const C0 = frame ? [0, 0] : c; s.dot(C0[0], C0[1], { r: 3.5, color: 'green' });
          };
          draw(sl, false); draw(sc, true);
          // velocity diagram
          const r1 = D.m2 / (D.m1 + D.m2);
          vd.circle(D.V, 0, r1, { color: 'muted', width: 1.4, dash: [5, 4] });
          vd.line(-0.3, 0, 1.3, 0, { color: 'faint', width: 1 });
          vd.arrow(0, 0, D.V, 0, { color: 'green', width: 2.6 });
          vd.arrow(D.V, 0, D.V + D.w1[0], D.w1[1], { color: 'purple', width: 2 });
          vd.arrow(0, 0, D.v1[0], D.v1[1], { color: 'blue', width: 2.6 });
          if (D.q > 1) { const tm = Math.asin(1 / D.q), L = 1.25; for (const sg of [1, -1]) vd.line(0, 0, L * Math.cos(tm), sg * L * Math.sin(tm), { color: 'red', width: 1.2, dash: [3, 3] }); }
          vd.dot(0, 0, { r: 3, color: 'ink', label: 'O', labelPos: 'sw' });
          vd.tex('\\mathbf V', D.V / 2, 0, { color: 'green', dy: 12, size: 14 });
          vd.tex('\\mathbf v_1^{\\rm lab}', D.v1[0], D.v1[1], { color: 'blue', dx: 16, dy: D.v1[1] > 0 ? -8 : 8, size: 14 });
          // θ(χ)
          cg.fn((x) => { const c = (x * Math.PI) / 180; return (Math.atan2(Math.sin(c), Math.cos(c) + D.q) * 180) / Math.PI; }, { color: 'accent', width: 2.4, domain: [0, 180] });
          if (D.q > 1) { const tm = (Math.asin(1 / D.q) * 180) / Math.PI; cg.hline(tm, { color: 'red', dash: [4, 4], width: 1.2 }); cg.text('θ_max', 4, tm, { color: 'red', size: 11, dy: -9 }); }
          cg.fn((x) => x / 2, { color: 'faint', width: 1, dash: [3, 4] });
          cg.dot((D.chi * 180) / Math.PI, (D.thLab * 180) / Math.PI, { r: 6, color: 'gold' });
          cur = D;
        }, { period: 6, still: 4.2 });
        v.legend([['blue', 'projectile $m_1$'], ['orange', 'target $m_2$'], ['green', 'centre of mass / its velocity'], ['purple', 'projectile velocity in the CM frame'], ['red', 'largest lab angle', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const D = cur;
          let out = String.raw`$m_1/m_2 = ${v.fix(D.q, 2)}$: CM angle $\chi = ${v.fix((D.chi * 180) / Math.PI, 2)}°$ (hard discs: $\pi - 2\arcsin(b/(R_1+R_2))$ = ${v.fix(180 - (2 * Math.asin(bS.value) * 180) / Math.PI, 2)}°) · lab angle from the simulated collision $${v.fix((D.thLab * 180) / Math.PI, 2)}°$, formula $\arctan\frac{\sin\chi}{\cos\chi + m_1/m_2} = ${v.fix((D.thF * 180) / Math.PI, 2)}°$ · target recoils at $${v.fix((D.thT * 180) / Math.PI, 2)}° = (180° - \chi)/2$`;
          if (D.q > 1) out += String.raw` · heavier projectile: lab angle never exceeds $\arcsin(m_2/m_1) = ${v.fix((Math.asin(1 / D.q) * 180) / Math.PI, 2)}°$`;
          else if (Math.abs(D.q - 1) < 0.02) out += ' · equal masses: $\\theta = \\chi/2$ and the two leave at right angles';
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.20
    {
      num: '8.20',
      kind: 'Phenomenon',
      name: 'The three-body problem',
      statement: String.raw`Three point masses attracting by Newtonian gravity have, besides energy, momentum and angular momentum, no further conserved quantities that would make the motion integrable (Bruns 1887, Poincaré 1890): the general three-body problem has no closed-form solution, and most of its motions are chaotic — nearby initial conditions separate exponentially. Special periodic solutions exist: Euler’s collinear and Lagrange’s equilateral configurations rotating rigidly (stable only when one mass dominates, $27(m_1m_2 + m_2m_3 + m_3m_1) < (m_1+m_2+m_3)^2$), and choreographies such as the figure-eight, in which three equal masses chase each other along one curve. Generic bound motions with negative energy end, sooner or later, by ejecting one body and leaving a binary.`,
      idea: String.raw`Reducing to the centre of mass (8.2) and using the ten classical integrals (7.11) still leaves a system with too many degrees of freedom for the remaining conserved quantities; Poincaré showed that the stable and unstable manifolds of periodic orbits intersect transversally, which forbids any further analytic integral and produces chaos. Numerically the equations are easy to integrate, provided the method respects the Hamiltonian structure: a symplectic scheme keeps the energy error bounded, and the time step must shrink during close encounters. Lagrange’s triangle is a relative equilibrium whose stability can be decided by linearization; the figure-eight was found numerically by Moore (1993) and proved to exist by Chenciner and Montgomery (2000).`,
      caption: String.raw`Integrated with a fourth-order symplectic (Yoshida) scheme whose step shrinks during close encounters ($G = 1$). Pick a configuration and push one body. The figure-eight is robust to a tiny push (it is linearly stable), but larger pushes make it wander and finally fling a body out; Lagrange’s equal-mass triangle falls apart from round-off alone; the Pythagorean problem (masses 3, 4, 5 released from rest) is the classic chaotic dance that ends with the lightest body escaping. Right: the energy error stays small throughout; bottom: the distances from the centre of mass — an ejection is a distance that keeps growing.`,
      deps: ['mech-8.2', 'mech-7.11'],
      refs: ['Goldstein §3.12', 'Tong §2.5'],
      tags: ['three-body', 'chaos', 'gravity'],
      credit: 'Newton, 1687; Poincaré, 1890',
      viz(v) {
        const x1 = [-0.97000436, 0.24308753], v3 = [-0.93240737, -0.86473146];
        const LAGR = (() => { const R = 1 / Math.sqrt(3), w = Math.sqrt(3), x = [], vv = []; for (let i = 0; i < 3; i++) { const a = Math.PI / 2 + (i * TAU) / 3; x.push(R * Math.cos(a), R * Math.sin(a)); vv.push(-w * R * Math.sin(a), w * R * Math.cos(a)); } return { x, v: vv }; })();
        const CFG = {
          eight: { label: 'figure-eight', m: [1, 1, 1], x: [x1[0], x1[1], -x1[0], -x1[1], 0, 0], v: [-v3[0] / 2, -v3[1] / 2, -v3[0] / 2, -v3[1] / 2, v3[0], v3[1]], T: 80, lim: 2.2, eta: 0.002 },
          lagrange: { label: 'Lagrange triangle', m: [1, 1, 1], x: LAGR.x, v: LAGR.v, T: 60, lim: 2.4, eta: 0.002 },
          pyth: { label: 'Pythagorean 3–4–5', m: [3, 4, 5], x: [1, 3, -2, -1, 1, -1], v: [0, 0, 0, 0, 0, 0], T: 70, lim: 6, eta: 0.0007 },
        };
        const cfg = v.select('configuration', Object.entries(CFG).map(([value, q]) => ({ value, label: q.label })), 'eight');
        const push = v.slider('push on body 1 (fraction of its speed)', 0, 0.3, 0.15, { step: 0.005 });
        const s = v.stage({ x: [-2.2, 2.2], y: [-1.6, 1.6], equal: true, axes: false, height: 320, weight: 1.3 });
        const ge = v.stage({ x: [0, 80], y: [1e-14, 1e-2], ylog: true, axes: 'box', height: 320, xlabel: 't', title: 'relative energy error $|\\Delta E/E|$' });
        const gd = v.stage({ x: [0, 80], y: [0, 6], axes: 'box', height: 190, full: true, xlabel: 't', title: 'distance of each body from the centre of mass' });
        const COL = ['blue', 'orange', 'green'];
        const cache = memo(); let cur = null;
        const run = () => cache([cfg.value, push.value].join('|'), () => {
          const Q = CFG[cfg.value], m = Q.m, x = Q.x.slice(), vel = Q.v.slice(), d = push.value;
          if (cfg.value !== 'pyth') { vel[0] *= 1 + d; vel[1] *= 1 + d; const M = m[0] + m[1] + m[2]; let px = 0, py = 0; for (let i = 0; i < 3; i++) { px += m[i] * vel[2 * i]; py += m[i] * vel[2 * i + 1]; } for (let i = 0; i < 3; i++) { vel[2 * i] -= px / M; vel[2 * i + 1] -= py / M; } }
          else { x[0] += d * 0.05; } // a small displacement of body 1 in the Pythagorean problem
          const a = new Array(6).fill(0); let rmin = acc3(x, m, a), t = 0, n = 0; const E0 = energy3(x, vel, m);
          const rec = { t: [0], x: [x.slice()], dE: [], tE: [] }; let nextRec = 0.02, nextE = 0.05, dEmax = 0, rClose = rmin, ej = null;
          while (t < Q.T && n < 600000) {
            const h = Math.min(0.002, Q.eta * rmin ** 1.5, Q.T - t);
            for (let k = 0; k < 4; k++) { for (let i = 0; i < 6; i++) x[i] += YC[k] * h * vel[i]; if (k < 3) { rmin = acc3(x, m, a); for (let i = 0; i < 6; i++) vel[i] += YD[k] * h * a[i]; } }
            t += h; n++; rClose = Math.min(rClose, rmin);
            if (t >= nextRec) { rec.t.push(t); rec.x.push(x.slice()); nextRec += 0.02; }
            if (t >= nextE) { const e = Math.abs(energy3(x, vel, m) / E0 - 1); rec.tE.push(t); rec.dE.push(e); dEmax = Math.max(dEmax, e); nextE += 0.05; }
            if (!ej) for (let i = 0; i < 3; i++) { const r = Math.hypot(x[2 * i], x[2 * i + 1]); if (r > 4 * Q.lim / 2.2 * 1.6) { ej = { i, t }; } }
          }
          let P = [0, 0], Lz = 0; for (let i = 0; i < 3; i++) { P[0] += m[i] * vel[2 * i]; P[1] += m[i] * vel[2 * i + 1]; Lz += m[i] * (x[2 * i] * vel[2 * i + 1] - x[2 * i + 1] * vel[2 * i]); }
          const dist = rec.x.map((X) => [0, 1, 2].map((i) => Math.hypot(X[2 * i], X[2 * i + 1])));
          return { Q, rec, dist, dEmax, n, rClose, ej, P, E0, Lz };
        });
        v.animate((t) => {
          const D = run(), Q = D.Q, N = D.rec.t.length - 1, simT = Math.min((t * Q.T) / 30, Q.T);
          let k = 0; { let lo = 0, hi = N; while (hi - lo > 1) { const mm = (lo + hi) >> 1; if (D.rec.t[mm] <= simT) lo = mm; else hi = mm; } k = lo; }
          s.setView([-Q.lim, Q.lim], [-Q.lim * 0.73, Q.lim * 0.73]);
          if (cfg.value === 'eight') s.path(CFG.eight.x && Array.from({ length: 200 }, (_, j) => j), { color: 'faint' });
          const tail = Math.round((cfg.value === 'pyth' ? 4 : 2.5) / 0.02);
          for (let i = 0; i < 3; i++) {
            s.path(D.rec.x.slice(0, k + 1).map((X) => [X[2 * i], X[2 * i + 1]]), { color: COL[i], width: 0.8, alpha: 0.18 });
            s.path(D.rec.x.slice(Math.max(0, k - tail), k + 1).map((X) => [X[2 * i], X[2 * i + 1]]), { color: COL[i], width: 2.2 });
            const X = D.rec.x[k]; s.dot(X[2 * i], X[2 * i + 1], { r: 4 + 2.2 * Math.cbrt(Q.m[i]), color: COL[i] });
          }
          s.dot(0, 0, { r: 2.5, color: 'muted' });
          s.corner(`t = ${v.fix(D.rec.t[k], 1)}`, 'tl', { color: 'muted' });
          if (D.ej && D.ej.t <= simT) s.corner(`body ${D.ej.i + 1} ejected`, 'tr', { color: 'red', weight: 600 });
          // energy error
          ge.setView([0, Q.T], [1e-14, 1e-2]);
          const pts = []; for (let j = 0; j < D.rec.tE.length && D.rec.tE[j] <= simT; j++) pts.push([D.rec.tE[j], Math.max(D.rec.dE[j], 1e-14)]);
          ge.path(pts, { color: 'accent', width: 1.6 });
          // distances
          let dmax = 1.5; for (let j = 0; j <= k; j++) dmax = Math.max(dmax, ...D.dist[j]);
          gd.setView([0, Q.T], [0, Math.min(1.1 * dmax, 30)]);
          for (let i = 0; i < 3; i++) gd.path(D.dist.slice(0, k + 1).map((dd, j) => [D.rec.t[j], dd[i]]), { color: COL[i], width: 1.8 });
          gd.vline(D.rec.t[k], { color: 'faint', width: 1 });
          cur = { D, k };
        }, { period: 30, still: 26 });
        v.legend(['blue', 'orange', 'green'].map((c, i) => [c, `body ${i + 1}`]));
        v.readout(() => {
          if (!cur) return '';
          const { D } = cur;
          let out = String.raw`${D.n.toLocaleString('en')} adaptive steps; largest $|\Delta E/E| = ${sci(v, D.dEmax)}$ (closest approach ${v.fix(D.rClose, 4)}); total momentum $${sci(v, Math.hypot(...D.P))}$, angular momentum $L_z = ${v.fix(D.Lz, 6)}$ — conserved`;
          if (D.ej) out += String.raw` · body ${D.ej.i + 1} ejected near $t \approx ${v.fix(D.ej.t, 1)}$`;
          else out += ' · no ejection within this run';
          if (cfg.value === 'eight') out += push.value === 0 ? ' · unperturbed: the three bodies chase each other on one figure-eight, period 6.326' : ' · the figure-eight survives tiny pushes (it is linearly stable) but not this one';
          if (cfg.value === 'lagrange') out += ' · equal masses violate Routh’s condition $27\\sum m_im_j < M^2$, so the rotating triangle is unstable';
          if (cfg.value === 'pyth') out += ' · Burrau’s problem (1913); Szebehely and Peters (1967) found that the mass-3 body escapes and masses 4 and 5 form a binary';
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.21
    {
      num: '8.21',
      kind: 'Proposition',
      name: 'Orbital energy and the vis-viva equation',
      statement: String.raw`For a Kepler orbit about a body of mass $M$ (with $m \ll M$), the total energy depends only on the semi-major axis,
$$E = \tfrac12 mv^2 - \frac{GMm}{r} = -\frac{GMm}{2a},\qquad\text{equivalently}\qquad v^2 = GM\Big(\frac2r - \frac1a\Big)\quad\text{(vis-viva)},$$
at every point of the orbit. Consequently all satellites launched from the same point with the same speed, in any direction, have the same semi-major axis and therefore (Kepler’s third law) the same period, whatever their eccentricities; their empty foci lie on a circle of radius $2a - r_0$ about the launch point. The orbit is bound ($a>0$) exactly when $v^2 < 2GM/r$.`,
      idea: String.raw`At the apsides $r_\pm = a(1\pm e)$ the velocity is perpendicular to the radius, so energy (3.6) and angular momentum give two equations whose solution is $E = -GMm/(r_+ + r_-) = -GMm/2a$; since $E$ is conserved, this holds all along the orbit, and solving for $v^2$ gives vis-viva. The bound/unbound split of 8.4 is the sign of $1/a$. The focal property of the ellipse (8.7), $r + r' = 2a$, puts the empty focus at distance $2a - r_0$ from the launch point, in a direction set by the launch angle.`,
      caption: String.raw`Twelve satellites leave the gold point at $2R_\oplus$ from the Earth’s centre with the same speed in twelve directions (SI values of $GM_\oplus$; the Earth is treated as a point mass, so orbits that dip below the surface are drawn faint). Press play: the ellipses differ wildly, yet all twelve come back to the launch point together after one common period. Their empty foci (hollow dots) lie on one circle. Right: speed against distance for every sample of every orbit — all on the single vis-viva curve. Raise the speed to escape speed and the curve and the orbits open up.`,
      deps: ['mech-8.7', 'mech-8.4', 'mech-3.6'],
      refs: ['Goldstein §3.7', 'Taylor §8.6'],
      tags: ['energy', 'Kepler', 'spaceflight'],
      viz(v) {
        const C = v.M.CONST, GM = C.G * C.Mearth, RE = C.Rearth, r0 = 2 * RE, vesc = Math.sqrt((2 * GM) / r0) / 1000, vcirc = Math.sqrt(GM / r0) / 1000;
        const sp = v.slider('launch speed (km/s)', 3, 9, 6.4, { step: 0.01, onChange: (x) => { if (Math.abs(x - vesc) < 0.03 && x !== vesc) sp.set(vesc); } });
        const s = v.stage({ x: [-6, 4], y: [-4, 4], equal: true, axes: false, height: 340, weight: 1.25, title: 'orbits (units of $R_\\oplus$)' });
        const g = v.stage({ x: [0, 8], y: [0, 10], axes: 'box', height: 340, xlabel: 'r / R⊕', ylabel: 'v (km/s)', title: 'speed against distance, all orbits' });
        const NS = 12, COLS = ['blue', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red', 'blue', 'orange', 'green', 'purple'];
        const cache = memo(); let cur = null;
        const run = () => cache(sp.value, () => {
          const v0 = sp.value * 1000, invA = 2 / r0 - (v0 * v0) / GM, a = 1 / invA, bound = invA > 1e-15;
          const Tp = bound ? TAU * Math.sqrt(a ** 3 / GM) : Infinity, Tsim = bound ? Tp : 6 * 3600;
          const orbits = [];
          for (let k = 0; k < NS; k++) {
            const ang = (TAU * (k + 0.5)) / NS, vx = v0 * Math.cos(ang), vy = v0 * Math.sin(ang);
            const R = centralOrbit((r) => -GM / (r * r), [r0, 0, vx, vy], { T: Tsim, eta: 0.004, rmax: 40 * RE, rmin: 0.02 * RE, maxSteps: 60000 });
            const el = kepEl(GM, r0, 0, vx, vy);
            let lo = Infinity, hi = 0, vvErr = 0;
            for (const S of R.s) { const r = Math.hypot(S[0], S[1]); lo = Math.min(lo, r); hi = Math.max(hi, r); if (bound) vvErr = Math.max(vvErr, Math.abs((S[2] ** 2 + S[3] ** 2) / (GM * (2 / r - 1 / a)) - 1)); }
            const last = R.s[R.s.length - 1], back = bound && R.stop === 'time' ? Math.hypot(last[0] - r0, last[1]) : NaN;
            orbits.push({ R, el, lo, hi, vvErr, back, hits: el.p / (1 + el.e) < RE, F2: bound ? [-2 * a * el.ex, -2 * a * el.ey] : null, stop: R.stop });
          }
          return { a, bound, Tp, Tsim, orbits, v0 };
        });
        v.animate((t) => {
          const D = run(), simT = D.bound ? ((t % 9) / 8) * D.Tp : ((t % 9) / 8) * D.Tsim, tt = Math.min(simT, D.Tsim);
          const lim = D.bound ? Math.min(14, Math.max(3.2, 1.1 * (2 * D.a / RE))) : 8;
          s.setView([-lim * 1.25 + 1, lim * 0.6 + 1], [-lim * 0.85, lim * 0.85]);
          s.circle(0, 0, 1, { fill: 'blue', fillAlpha: 0.25, color: 'blue', width: 1.2 });
          if (D.bound) s.circle(r0 / RE, 0, (2 * D.a - r0) / RE, { color: 'muted', width: 1, dash: [4, 4] });
          D.orbits.forEach((o, k) => {
            const pts = o.R.s.map((S) => [S[0] / RE, S[1] / RE]);
            s.path(pts, { color: COLS[k], width: o.hits ? 1 : 1.8, alpha: o.hits ? 0.35 : 0.9, dash: o.hits ? [3, 3] : null });
            const S = stateAt(o.R, Math.min(tt, o.R.t[o.R.t.length - 1]));
            s.dot(S[0] / RE, S[1] / RE, { r: 4, color: COLS[k] });
            if (o.F2) s.dot(o.F2[0] / RE, o.F2[1] / RE, { r: 3.2, hollow: true, color: COLS[k], width: 1.4 });
          });
          s.dot(r0 / RE, 0, { r: 5, color: 'gold' });
          s.corner(D.bound ? `all periods ${v.fix(D.Tp / 60, 1)} min` : 'v ≥ escape speed: unbound', 'tl', { color: D.bound ? 'green' : 'red', weight: 600 });
          // v against r
          g.setView([0, Math.max(4, Math.min(16, lim + 1))], [0, Math.max(10, sp.value * 1.6)]);
          if (D.bound) g.fn((x) => { const r = x * RE, q = GM * (2 / r - 1 / D.a); return q > 0 ? Math.sqrt(q) / 1000 : NaN; }, { color: 'ink', width: 1.6, dash: [5, 4], domain: [0.3, 40] });
          else g.fn((x) => { const r = x * RE; return Math.sqrt(GM * (2 / r - 1 / D.a)) / 1000; }, { color: 'ink', width: 1.6, dash: [5, 4], domain: [0.3, 40] });
          g.fn((x) => Math.sqrt((2 * GM) / (x * RE)) / 1000, { color: 'red', width: 1, alpha: 0.6, domain: [0.3, 40] });
          D.orbits.forEach((o, k) => { const pts = []; for (let i = 0; i < o.R.s.length; i += 6) { const S = o.R.s[i]; pts.push([Math.hypot(S[0], S[1]) / RE, Math.hypot(S[2], S[3]) / 1000]); } g.dots(pts, { r: 1.8, color: COLS[k], alpha: 0.8 }); });
          g.vline(1, { color: 'blue', width: 1, alpha: 0.5 });
          cur = D;
        }, { period: 9, still: 3.6 });
        v.legend([['ink', 'vis-viva $v^2 = GM(2/r - 1/a)$', { dash: true }], ['red', 'escape speed $\\sqrt{2GM/r}$'], ['muted', 'circle of empty foci, radius $2a - r_0$', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const D = cur;
          if (!D.bound) return String.raw`$v_0 = ${v.fix(sp.value, 2)}$ km/s $\ge v_{\rm esc} = \sqrt{2GM_\oplus/r_0} = ${v.fix(vesc, 3)}$ km/s at $r_0 = 2R_\oplus$: $1/a \le 0$, every direction escapes (parabolas or hyperbolas)`;
          const as = D.orbits.map((o) => (o.lo + o.hi) / 2), aErr = Math.max(...as.map((x) => Math.abs(x / D.a - 1))), back = Math.max(...D.orbits.map((o) => o.back / RE)), vv = Math.max(...D.orbits.map((o) => o.vvErr));
          const es = D.orbits.map((o) => o.el.e);
          return String.raw`$v_0 = ${v.fix(sp.value, 2)}$ km/s (circular ${v.fix(vcirc, 2)}, escape ${v.fix(vesc, 2)}): $a = 1/(2/r_0 - v_0^2/GM) = ${v.fix(D.a / 1000, 0)}$ km for every direction; measured $(r_{\min}+r_{\max})/2$ agrees to $${sci(v, aErr)}$ although $e$ ranges from ${v.fix(Math.min(...es), 3)} to ${v.fix(Math.max(...es), 3)} · after one period $2\pi\sqrt{a^3/GM} = ${v.fix(D.Tp / 60, 2)}$ min all twelve are back within $${sci(v, back)}\,R_\oplus$ of the launch point · vis-viva holds along every orbit to $${sci(v, vv)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.22
    {
      num: '8.22',
      kind: 'Theorem',
      name: 'Hamilton’s hodograph: Kepler velocities trace a circle',
      statement: String.raw`For any orbit in the inverse-square field $F = -k/r^2$, the **hodograph** — the curve traced by the tip of the velocity vector $\mathbf v(t)$ drawn from a fixed origin — is (an arc of) a circle of radius $k/\ell$ (with $\mu = 1$), whose centre lies at distance $e\,k/\ell$ from the origin, perpendicular to the apse line:
$$\mathbf v = \frac{k}{\ell}\,\hat{\mathbf z}\times\big(\hat{\mathbf r} + \mathbf e\big),\qquad \mathbf e = \frac{\mathbf A}{\mu k}.$$
For ellipses ($e<1$) the origin lies inside the circle and the whole circle is traced; for a parabola it lies on it; for hyperbolas it lies outside and only an arc is traced. No other central force law gives a circular hodograph for every orbit.`,
      idea: String.raw`The Runge–Lenz vector (8.10) is conserved: $\mathbf A = \mathbf p\times\mathbf L - \mu k\hat{\mathbf r}$. Taking the cross product with $\mathbf L = \ell\hat{\mathbf z}$ solves for the velocity: $\mathbf v = (k/\ell)\,\hat{\mathbf z}\times\hat{\mathbf r} + \hat{\mathbf z}\times\mathbf A/\ell$ ($\mu = 1$). The first term is a vector of fixed length $k/\ell$ turning with the planet, the second is constant — a circle with a fixed offset. Equivalently, by the area law (8.5) $d\phi/dt\propto 1/r^2$ and the force $\propto 1/r^2$, so $d\mathbf v/d\phi$ has constant length $k/\ell$: equal angles, equal velocity steps.`,
      caption: String.raw`Drag the launch point and the tip of the launch velocity. Left: the orbit with velocity arrows at equal time steps. Right: the same arrows drawn from one origin; their tips fall on a circle (a least-squares circle fit is dashed, the gold point is its centre). The readout compares the fitted radius and offset with $k/\ell$ and $ek/\ell$. Launch faster than escape speed: the origin moves outside the circle and only an arc is used. Change the force exponent and the tips leave the circle.`,
      deps: ['mech-8.10', 'mech-8.5'],
      refs: ['Goldstein Ex. 3.29'],
      tags: ['hodograph', 'Kepler', 'Runge–Lenz'],
      credit: 'William Rowan Hamilton, 1846',
      viz(v) {
        const pw = v.slider('force exponent $n$ in $F = -k/r^n$', 1.7, 2.3, 2, { step: 0.005, onChange: (x) => { if (Math.abs(x - 2) < 0.008 && x !== 2) pw.set(2); } });
        const s = v.stage({ x: [-2.4, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 330, title: 'orbit, with $\\mathbf v$ at equal time steps' });
        const hd = v.stage({ x: [-1.6, 1.6], y: [-1.3, 1.9], equal: true, axes: false, height: 330, title: 'hodograph: the same velocities from one origin' });
        const P0 = s.handle(1, 0, { color: 'ink', r: 6, label: 'launch', labelPos: 'se', constrain: (x, y) => { const r = Math.hypot(x, y); return r < 0.35 ? [(0.35 * x) / (r || 1), (0.35 * y) / (r || 1)] : [x, y]; } });
        const V = s.handle(1.0, 1.15, { color: 'accent', label: 'v₀', labelPos: 'ne' });
        let ox = P0.x, oy = P0.y;
        P0.onDrag = () => { V.set(V.x + P0.x - ox, V.y + P0.y - oy); ox = P0.x; oy = P0.y; };
        const cache = memo(); let cur = null;
        const run = () => cache([pw.value, P0.x, P0.y, V.x, V.y].join('|'), () => {
          ox = P0.x; oy = P0.y;
          const n = pw.value, s0 = [P0.x, P0.y, V.x - P0.x, V.y - P0.y], el = kepEl(1, ...s0), bound = el.E < 0;
          const Tsim = bound ? Math.min(el.T, 60) * (n === 2 ? 1 : 2.2) : 14;
          const F = centralOrbit((r) => -1 / r ** n, s0, { T: Tsim, eta: 0.003, rmax: 10, rmin: 0.03, maxSteps: 80000 });
          const B = bound ? null : centralOrbit((r) => -1 / r ** n, s0, { T: -14, eta: 0.003, rmax: 10, rmin: 0.03, maxSteps: 40000 });
          // equal-time samples
          const Tt = Math.abs(F.t[F.t.length - 1]), M = 36, samp = [];
          for (let k = 0; k < M; k++) samp.push(stateAt(F, (k * Tt) / M));
          if (B) { const Tb = Math.abs(B.t[B.t.length - 1]); for (let k = 1; k < M / 2; k++) samp.push(stateAt(B, (-k * Tb) / (M / 2))); }
          // algebraic (Kåsa) circle fit to all velocity samples
          const all = F.s.concat(B ? B.s : []), rows = [], rhs = [];
          for (let i = 0; i < all.length; i += Math.max(1, Math.floor(all.length / 800))) { const [, , vx, vy] = all[i]; rows.push([vx, vy, 1]); rhs.push(vx * vx + vy * vy); }
          const [A2, B2, C2] = v.M.lstsq(rows, rhs), cx = A2 / 2, cy = B2 / 2, R = Math.sqrt(C2 + cx * cx + cy * cy);
          let res = 0; for (let i = 0; i < rows.length; i++) res = Math.max(res, Math.abs(Math.hypot(rows[i][0] - cx, rows[i][1] - cy) - R));
          return { n, el, bound, F, B, samp, cx, cy, R, res, all };
        });
        v.render(() => {
          const D = run(), el = D.el;
          s.path((D.B ? D.B.s.slice().reverse() : []).concat(D.F.s).map((S) => [S[0], S[1]]), { color: 'ink', width: 1.4, alpha: 0.7 });
          sun(s, 0, 0, { r: 0.06 });
          const sc = 0.35;
          D.samp.forEach((S, k) => s.arrow(S[0], S[1], S[0] + sc * S[2], S[1] + sc * S[3], { color: k === 0 ? 'accent' : 'purple', width: 1.3, head: 6, alpha: 0.85 }));
          s.arrow(P0.x, P0.y, V.x, V.y, { color: 'accent', width: 2.4 });
          // hodograph
          let vmax = 0.8; for (const S of D.all) vmax = Math.max(vmax, Math.abs(S[2]), Math.abs(S[3]));
          const lim = Math.min(4, 1.12 * Math.max(vmax, Math.hypot(D.cx, D.cy) + D.R));
          hd.setView([-lim, lim], [-lim, lim]);
          hd.line(-lim, 0, lim, 0, { color: 'faint', width: 1 }); hd.line(0, -lim, 0, lim, { color: 'faint', width: 1 });
          hd.circle(D.cx, D.cy, D.R, { color: 'green', width: 1.4, dash: [6, 4] });
          hd.path(D.all.map((S) => [S[2], S[3]]), { color: D.n === 2 ? 'accent' : 'red', width: 2 });
          D.samp.forEach((S, k) => { hd.arrow(0, 0, S[2], S[3], { color: k === 0 ? 'accent' : 'purple', width: 1.1, head: 6, alpha: 0.6 }); });
          hd.dot(D.cx, D.cy, { r: 4, color: 'gold' });
          hd.dot(0, 0, { r: 3, color: 'ink', label: 'O', labelPos: 'sw' });
          s.corner(D.n === 2 ? (D.bound ? `ellipse, e = ${v.fix(el.e, 3)}` : `hyperbola, e = ${v.fix(el.e, 3)}`) : `n = ${v.fix(D.n, 3)}`, 'tl', { color: D.n === 2 ? 'green' : 'red', weight: 600 });
          cur = D;
        });
        v.legend([['purple', 'velocity at equal time steps'], ['accent', 'hodograph (tip of $\\mathbf v$)'], ['green', 'least-squares circle', { dash: true }], ['gold', 'its centre', { dot: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const D = cur, el = D.el, kl = 1 / Math.abs(el.h), off = Math.hypot(D.cx, D.cy);
          let out = String.raw`fitted circle: radius $${v.fix(D.R, 5)}$, centre at distance $${v.fix(off, 5)}$ from $O$, largest misfit $${sci(v, D.res)}$`;
          if (D.n === 2) out += String.raw` · predicted $k/\ell = ${v.fix(kl, 5)}$ and $e\,k/\ell = ${v.fix(el.e * kl, 5)}$ ($e = ${v.fix(el.e, 4)}$)` + (el.e > 1 ? ' · $e>1$: the origin is outside the circle and the hyperbola uses only an arc' : '');
          else out += ' · not inverse-square: no circle fits the velocities';
          return out;
        });
      },
    },
  ],
};
