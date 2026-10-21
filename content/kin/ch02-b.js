// Chemical Kinetics — Chapter 2: Temperature dependence and collision theory (items 2.7–2.12)
import { R, clamp, H2, saddle, mep, vRel, vXY, toXY, fromXY, hessXY, eig2, launch, trajectory, M_EFF } from './ch02.shared.js';

export default {
  collection: 'kin',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7', kind: 'Definition', name: 'Reaction coordinate and saddle point',
      statement: String.raw`A **saddle point** (transition structure) of a potential energy surface is a stationary point, $\nabla V=0$, whose Hessian has exactly one negative eigenvalue: $V$ is a maximum along one direction and a minimum along all others. The eigenvector of the negative eigenvalue is the **reaction coordinate** at the saddle; away from it the reaction coordinate is the path of steepest descent (in mass-weighted coordinates) into the reactant and product valleys, and $V$ along that path is the one-dimensional barrier profile. The negative eigenvalue $\lambda^\ddagger<0$ corresponds to an imaginary frequency $\nu^\ddagger=\frac{1}{2\pi}\sqrt{\lambda^\ddagger/M}$ (imaginary), the curvature of the barrier top.`,
      idea: String.raw`At a stationary point the energy to second order is $V_0+\tfrac12\,\delta\mathbf q^{\!\top}\mathsf H\,\delta\mathbf q$, and diagonalising $\mathsf H$ separates independent directions. One positive eigenvalue is a bound mode (here the symmetric stretch), the negative one an unbound mode: motion along it never returns, which is what makes the saddle the bottleneck. The familiar one-dimensional barrier diagram is the slice of the surface along the steepest-descent path through it. The Hessian of a twice continuously differentiable real potential is symmetric. The real spectral theorem ladr 7.29 supplies an orthonormal eigenbasis, so in those local coordinates the quadratic energy is $\tfrac12\sum_j\lambda_j q_j^2$. Exactly one negative eigenvalue identifies one unstable quadratic direction; zero eigenvalues would require higher-order terms rather than this nondegenerate saddle test.`,
      caption: String.raw`Zoom on the saddle of the model surface of 2.6. The green arrow is the eigenvector with the negative eigenvalue (reaction coordinate), the red arrow the positive one. Rotate the slice direction $\theta$ (or snap to the eigenvectors): the middle panel shows the actual energy along the dotted line, with the Hessian's parabola dashed. Right: $V$ along the minimum-energy path, the barrier diagram; slide the point along it.`,
      deps: ['kin-2.6', 'mech-11.14', 'ladr-7.29'],
      refs: ['Steinfeld et al.'],
      tags: ['saddle point', 'reaction coordinate'],
      viz(v) {
        const wS = v.slider('barrier weight $w$', 0.6, 0.95, 0.75, { step: 0.01 });
        const th = v.slider('slice direction $\\theta$ (°)', 0, 180, 40, { step: 1 });
        const sS = v.slider('position along the path', -2, 2, -0.8, { step: 0.01 });
        v.button('snap to reaction coordinate', () => th.set(((Math.atan2(cache.E.vectors[0][1], cache.E.vectors[0][0]) * 180 / Math.PI) + 180) % 180));
        v.button('snap to the other eigenvector', () => th.set(((Math.atan2(cache.E.vectors[1][1], cache.E.vectors[1][0]) * 180 / Math.PI) + 180) % 180));
        const A = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 330, title: 'surface near the saddle', weight: 1.1, minWidth: 250 });
        const B = v.stage({ x: [-0.6, 0.6], y: [-0.6, 0.6], axes: 'box', gutter: true, height: 330, xlabel: 'slice coordinate (Å)', ylabel: 'V − V‡ (eV)', title: 'energy along the slice', weight: 1, minWidth: 250 });
        const C = v.stage({ x: [-2, 2], y: [-0.1, 0.5], axes: 'box', gutter: true, height: 330, xlabel: 'path length s (Å, mass-scaled)', ylabel: 'V (eV)', title: 'barrier profile', weight: 1, minWidth: 250 });
        let cache = null, key = '';
        const prep = () => {
          if (key === String(wS.value)) return cache; key = String(wS.value);
          const P = { w: wS.value }, sd = saddle(P), E = eig2(hessXY(sd.X, sd.Y, P)), path = mep(P, sd);
          let k0 = 0, dm = 1e9; path.forEach((p, i) => { const d = Math.hypot(p[0] - sd.X, p[1] - sd.Y); if (d < dm) { dm = d; k0 = i; } });
          const s = [0]; for (let i = 1; i < path.length; i++) s.push(s[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
          const s0 = s[k0], S = s.map((x) => x - s0), V = path.map((p) => vXY(p[0], p[1], P));
          cache = { P, sd, E, path, S, V }; return cache;
        };
        let info = {};
        v.render(() => {
          const { P, sd, E, path, S, V } = prep();
          const cx = sd.X, cy = sd.Y, hw = 1.1;
          A.setView([cx - hw, cx + hw], [cy - hw * 0.75, cy + hw * 0.75]);
          const f = (X, Y) => Math.max(-0.8, Math.min(1.6, vXY(X, Y, P) - sd.V));
          A.heat((X, Y) => { const [x, y] = fromXY(X, Y); return (x < 0.3 || y < 0.3) ? NaN : f(X, Y); }, { range: [-0.8, 1.2], cmap: 'theme-diverging', res: 3, key: 'sd' + wS.value });
          A.clip(() => A.contour(f, Array.from({ length: 17 }, (_, i) => -0.8 + 0.1 * i).filter((l) => Math.abs(l) > 1e-6), { color: 'ink', width: 1, alpha: 0.4, res: 150 }));
          A.path(path, { color: 'ink', width: 1.6, dash: [6, 4], alpha: 0.7 });
          const [u1, u2] = E.vectors, L = 0.65;
          A.arrow(cx - L * u1[0], cy - L * u1[1], cx + L * u1[0], cy + L * u1[1], { color: 'green', width: 2.6, head: 9, both: true });
          A.arrow(cx - L * 0.8 * u2[0], cy - L * 0.8 * u2[1], cx + L * 0.8 * u2[0], cy + L * 0.8 * u2[1], { color: 'red', width: 2.6, head: 9, both: true });
          const a = th.value * Math.PI / 180, d = [Math.cos(a), Math.sin(a)];
          A.line(cx - 0.9 * d[0], cy - 0.9 * d[1], cx + 0.9 * d[0], cy + 0.9 * d[1], { color: 'gold', width: 2, dash: [2, 4] });
          A.dot(cx, cy, { r: 6, color: 'ink' });
          // position on the path
          const sp = sS.value; let kk = 0; for (let i = 0; i < S.length; i++) if (Math.abs(S[i] - sp) < Math.abs(S[kk] - sp)) kk = i;
          A.dot(path[kk][0], path[kk][1], { r: 6, color: 'accent' });
          // slice
          const kap = (E.values[0]) * (d[0] * u1[0] + d[1] * u1[1]) ** 2 + E.values[1] * (d[0] * u2[0] + d[1] * u2[1]) ** 2;
          B.hline(0, { color: 'faint' }); B.vline(0, { color: 'faint' });
          B.fn((r) => Math.min(0.6, vXY(cx + r * d[0], cy + r * d[1], P) - sd.V), { color: 'gold', width: 2.6, domain: [-0.6, 0.6] });
          B.fn((r) => 0.5 * kap * r * r, { color: 'ink', width: 1.6, dash: [6, 4], domain: [-0.6, 0.6] });
          // profile
          C.setView([-2, 2], [-0.1, Math.max(...V) * 1.25]);
          C.path(S.map((s, i) => [s, V[i]]).filter((p) => Math.abs(p[0]) <= 2.05), { color: 'accent', width: 2.6 });
          C.dot(0, sd.V, { r: 5, color: 'ink', label: 'saddle', labelPos: 'n' }); C.dot(S[kk], V[kk], { r: 6, color: 'accent' });
          C.hline(0, { color: 'faint', dash: [3, 4] });
          const nu = Math.sqrt(Math.abs(E.values[0]) / M_EFF) / (2 * Math.PI * 2.99792458e-5);
          const eps = 0.04, num = (vXY(cx + eps * d[0], cy + eps * d[1], P) + vXY(cx - eps * d[0], cy - eps * d[1], P) - 2 * sd.V) / (eps * eps);
          info = { E, kap, num, nu, sd, bar: sd.V, x: sd.x, y: sd.y, grad: Math.hypot(...hessXY(cx, cy, P).flat()) };
        });
        v.legend([['green', 'reaction coordinate (negative eigenvalue)'], ['red', 'positive eigenvalue'], ['gold', 'slice', { dash: true }], ['ink', 'minimum-energy path', { dash: true }]]);
        v.readout(() => `saddle at $r_{AB}=r_{BC}=${v.fix(info.x, 3)}$ Å, barrier $${v.fix(info.bar, 3)}$ eV · Hessian eigenvalues $${v.fix(info.E.values[0], 2)}$ and $${v.fix(info.E.values[1], 2)}$ eV/Å² (one negative: a saddle) → $\\nu^\\ddagger=${v.fix(info.nu, 0)}\\,i$ cm⁻¹\ncurvature along the slice: Hessian $${v.fix(info.kap, 2)}$ eV/Å² vs finite difference of the surface $${v.fix(info.num, 2)}$ — ${info.kap < 0 ? 'downhill in both directions along this slice: the saddle is a maximum here' : 'uphill both ways: a minimum along this slice'}`);
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8', kind: 'Principle', name: 'Polanyi’s rules',
      statement: String.raw`For an atom-transfer reaction $\mathrm A+\mathrm{BC}\to\mathrm{AB}+\mathrm C$ on a single surface with the barrier in the **entrance** valley (**early barrier**, typically exothermic), reactant **translational** energy is more effective than vibrational energy at promoting reaction. If the barrier is in the **exit** valley (**late barrier**, typically endothermic), **vibrational** energy of BC is more effective than translation. Conversely, the energy released appears mainly as vibration of AB for an early barrier, and as translation for a late one (microscopic reversibility).`,
      idea: String.raw`Think of the point rolling on the surface: motion along the reactant valley (translation) carries it toward the barrier if the barrier is in that valley, but if the barrier lies beyond the corner, the point must first turn the corner, and a point approaching with only translation hits the wall of the corner and rebounds. Vibration of BC pushes the point sideways across the valley, setting it up to cut the corner. The effect is therefore a statement about where the pass lies relative to the bend of the surface.`,
      caption: String.raw`Choose how exothermic the model reaction is (it changes the strength of the new AB bond relative to BC; the barrier moves from the entrance to the exit valley). For a fixed total energy, the right panel shows the reaction probability against the fraction of the energy that is vibrational, computed from 120 classical trajectories (12 vibrational phases for each of 10 fractions). The map shows one trajectory with your chosen fraction.`,
      deps: ['kin-2.6'],
      refs: ['Steinfeld et al.'],
      tags: ['dynamics', 'potential energy surface'],
      credit: 'J. C. Polanyi, 1960s (infrared chemiluminescence of products); Polanyi & Wong, 1969',
      scope: String.raw`A rule of thumb for direct atom-transfer reactions on one surface, with equal masses here: it can fail for heavy–light–heavy systems and when the barrier is not a simple early/late one. These are collinear classical trajectories on a model surface, not an accurate dynamics calculation.`,
      viz(v) {
        const preset = v.select('surface', [{ value: 'e', label: 'early barrier (exothermic)' }, { value: 's', label: 'symmetric' }, { value: 'l', label: 'late barrier (endothermic)' }], 'e', {
          onChange(val) { const p = { e: [0.6, 0.6], s: [0, 0.7], l: [-0.6, 1.1] }[val]; dD.set(p[0]); Etot.set(p[1]); },
        });
        const dD = v.slider('change of the AB bond energy $\\Delta D$ (eV)', -0.7, 0.7, 0.6, { step: 0.05 });
        const Etot = v.slider('total energy $E_t+E_v$ (eV)', 0.3, 1.6, 0.6, { step: 0.05 });
        const fv = v.slider('vibrational fraction $E_v/E$ shown', 0.03, 0.92, 0.7, { step: 0.01 });
        const A = v.stage({ x: [0, 5.4], y: [0, 3.2], equal: true, axes: false, height: 330, title: 'surface and one trajectory', weight: 1.15 });
        const B = v.stage({ x: [0, 1], y: [0, 1.05], axes: 'box', gutter: true, height: 330, xlabel: 'fraction of the energy that is vibrational', ylabel: 'reaction probability', title: 'which energy promotes the reaction?', weight: 1, minWidth: 260 });
        const FR = Array.from({ length: 10 }, (_, i) => 0.03 + (0.92 - 0.03) * i / 9), NPH = 12;
        const memo = {};
        const scan = (P, E) => {
          const k = `${P.DAB.toFixed(3)}|${E.toFixed(3)}`; if (memo[k]) return memo[k];
          const out = FR.map((f) => { const Ev = f * E, Et = E - Ev; let n = 0; for (let j = 0; j < NPH; j++) { const L = launch(P, Et, Ev, j / NPH); if (trajectory(P, L.X, L.Y, L.VX, L.VY, { keep: false }).outcome === 'reaction') n++; } return n / NPH; });
          return (memo[k] = out);
        };
        let info = {};
        v.render(() => {
          const P = { w: 0.75, DAB: H2.D + dD.value }, sd = saddle(P), E = Etot.value;
          const f = (X, Y) => { const [x, y] = fromXY(X, Y); return (x < 0.3 || y < 0.3) ? 9 : Math.min(9, vRel(x, y, P)); };
          A.heat((X, Y) => { const [x, y] = fromXY(X, Y); return (x < 0.3 || y < 0.3) ? NaN : Math.min(vRel(x, y, P), 2.5); }, { range: [Math.min(0, -dD.value), 2.5], cmap: 'theme', res: 3, key: 'pol' + dD.value });
          A.clip(() => { A.contour(f, Array.from({ length: 13 }, (_, i) => -0.6 + 0.2 * i), { color: 'ink', width: 1, alpha: 0.5, res: 150 }); A.contour(f, [sd.V], { color: 'red', width: 1.8, res: 150 }); });
          A.dot(sd.X, sd.Y, { r: 5, color: 'red', label: 'saddle', labelPos: 'ne' });
          const Ev = fv.value * E, Et = E - Ev, L = launch(P, Et, Ev, 0.25), tr = trajectory(P, L.X, L.Y, L.VX, L.VY);
          A.path(tr.pts, { color: 'gold', width: 2.4 }); A.dot(tr.pts[0][0], tr.pts[0][1], { r: 4, color: 'gold' });
          A.text('A + BC', 4.2, 1.2, { color: 'ink', size: 13, weight: 650, align: 'center' }); A.text('AB + C', 1.0, 2.95, { color: 'ink', size: 13, weight: 650, align: 'center' });
          const pr = scan(P, E);
          B.path(FR.map((x, i) => [x, pr[i]]), { color: 'accent', width: 2.6 }); B.dots(FR.map((x, i) => [x, pr[i]]), { r: 4, color: 'accent' });
          B.vline(fv.value, { color: 'gold', dash: [4, 4] });
          const m = (a, b) => { const s = pr.slice(a, b); return s.reduce((p, q) => p + q, 0) / s.length; };
          info = { x: sd.x, y: sd.y, bar: sd.V, exo: dD.value, out: tr.outcome, lo: m(0, 3), hi: m(7, 10), E };
        });
        v.legend([['accent', 'reaction probability (trajectories)'], ['gold', 'trajectory shown'], ['red', 'saddle and its level']]);
        v.readout(() => `saddle at $r_{AB}=${v.fix(info.x, 2)}$, $r_{BC}=${v.fix(info.y, 2)}$ Å (BC bond ${info.y < 0.9 ? 'barely stretched: an **early** barrier' : info.y > 1.05 ? 'much stretched: a **late** barrier' : 'moderately stretched: a central barrier'}); exothermicity $${v.fix(info.exo, 2)}$ eV, barrier $${v.fix(info.bar, 2)}$ eV\nmean reaction probability with mostly translation (first three fractions): $${v.fix(info.lo, 2)}$ · mostly vibration (last three): $${v.fix(info.hi, 2)}$ → **${info.lo > info.hi + 0.1 ? 'translation is more effective' : info.hi > info.lo + 0.1 ? 'vibration is more effective' : 'no strong preference'}** at $E=${v.fix(info.E, 2)}$ eV`);
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9', kind: 'Method', name: 'Crossed molecular beams',
      statement: String.raw`In a **crossed-beam experiment** two collimated beams of reactants, A and BC, intersect in vacuum so that single reactive collisions occur at known velocities $\mathbf v_A,\mathbf v_B$ and the products are detected as a function of **lab angle** $\Theta$ and speed. Momentum conservation fixes the centre-of-mass velocity $\mathbf v_{cm}=(m_A\mathbf v_A+m_B\mathbf v_B)/(m_A+m_B)$, and energy conservation fixes the product speed in the centre-of-mass frame, $\tfrac12\mu' u'^2=E_{\rm rel}+Q$ (with $\mu'$ the reduced mass of the products). In a **Newton diagram** the allowed lab velocities of a product lie on a circle (the Newton sphere) of that radius around the tip of $\mathbf v_{cm}$; the angular distribution in the centre-of-mass frame, forward-, backward- or symmetric-peaked, reveals the mechanism (stripping, rebound, or a long-lived complex).`,
      idea: String.raw`The lab frame blurs the dynamics, because the centre of mass moves; transforming back to the frame where the total momentum vanishes (adding $\mathbf v_{cm}$) turns each measured lab velocity into a scattering angle and speed. A rebound reaction (head-on at small impact parameters) throws the product back along the direction the reactant came from; stripping (large impact parameters, atom plucked on the fly) leaves it forward. A complex that lives for several rotations forgets the direction and gives a forward–backward symmetric pattern.`,
      caption: String.raw`Left: the Newton diagram in velocity space for the chosen reaction (masses in u, speeds in m/s): beam velocities, the centre-of-mass velocity, and the circle of possible product velocities, with 2 000 sampled products (choose AB or C) (their COM angular distribution is drawn from the chosen mechanism). Middle: the centre-of-mass angular distribution; right: what a lab detector sees, the distribution in lab angle. The angular patterns are schematic, but kinematics are exact.`,
      deps: ['kin-2.5'],
      refs: ['Steinfeld et al.'],
      tags: ['molecular beams', 'scattering'],
      credit: 'Herschbach, Lee and coworkers, 1960s onward (K + CH₃I, K + Br₂; Nobel 1986 with Polanyi)',
      viz(v) {
        const RX = {
          kch3i: { name: 'K + CH₃I → KI + CH₃', mA: 39.10, mB: 141.94, mAB: 166.00, mC: 15.03, mech: 'rebound' },
          kbr2: { name: 'K + Br₂ → KBr + Br', mA: 39.10, mB: 159.81, mAB: 119.00, mC: 79.90, mech: 'stripping' },
          csrb: { name: 'Cs + RbCl → CsCl + Rb', mA: 132.91, mB: 120.92, mAB: 168.36, mC: 85.47, mech: 'complex' },
        };
        const rx = v.select('reaction', Object.keys(RX).map((k) => ({ value: k, label: RX[k].name })), 'kch3i', { onChange(k) { mech.set(RX[k].mech); } });
        const mech = v.select('mechanism', [{ value: 'rebound', label: 'rebound' }, { value: 'stripping', label: 'stripping' }, { value: 'complex', label: 'long-lived complex' }, { value: 'iso', label: 'isotropic' }], 'rebound');
        const prod = v.select('follow product', [{ value: 'AB', label: 'AB' }, { value: 'C', label: 'C' }], 'AB');
        const vA = v.slider('speed of beam A (m/s)', 300, 1500, 900, { step: 10 });
        const vB = v.slider('speed of beam BC (m/s)', 100, 1000, 500, { step: 10 });
        const ang = v.slider('crossing angle (°)', 30, 150, 90, { step: 1 });
        const Q = v.slider('energy released $Q$ (kJ/mol)', 0, 80, 20, { step: 1 });
        const NS = 2000;
        const A = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: false, height: 340, title: 'Newton diagram (velocity space)', weight: 1.4, minWidth: 300 });
        const B = v.stage({ x: [-1.2, 1.2], y: [-1.2, 1.2], equal: true, axes: false, height: 340, title: 'COM angular distribution', weight: 0.8, minWidth: 220 });
        const C = v.stage({ x: [-180, 180], y: [0, 1], axes: 'box', gutter: true, height: 340, xlabel: 'lab angle Θ (°, from beam A)', ylabel: 'relative counts', title: 'lab-frame signal', weight: 1, minWidth: 260 });
        const I = (m, th) => { // angular intensity per unit angle (not normalised); th = 0 is forward (along A's COM velocity)
          const w = (t0, s) => { let d = th - t0; d = Math.atan2(Math.sin(d), Math.cos(d)); return Math.exp(-d * d / (2 * s * s)); };
          if (m === 'rebound') return 0.05 + w(Math.PI, 0.55);
          if (m === 'stripping') return 0.05 + w(0, 0.5);
          if (m === 'complex') return 0.3 + (1 + 3 * Math.cos(th) ** 2) / 4;
          return 1;
        };
        const rr = v.rng(3), U = Array.from({ length: NS }, () => rr()), mu = Array.from({ length: NS }, () => rr());
        const sample = (m) => { // inverse transform on a grid
          const N = 720, cdf = new Float64Array(N + 1); for (let i = 0; i < N; i++) cdf[i + 1] = cdf[i] + I(m, -Math.PI + 2 * Math.PI * (i + 0.5) / N);
          return U.map((u) => { const t = u * cdf[N]; let lo = 0, hi = N; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cdf[mid] <= t) lo = mid; else hi = mid; } return -Math.PI + 2 * Math.PI * (lo + (t - cdf[lo]) / (cdf[lo + 1] - cdf[lo] || 1)) / N; });
        };
        let info = {};
        v.render(() => {
          const r = RX[rx.value], M = r.mA + r.mB, a = ang.value * Math.PI / 180;
          const VA = [vA.value, 0], VB = [vB.value * Math.cos(a), vB.value * Math.sin(a)];
          const vcm = [(r.mA * VA[0] + r.mB * VB[0]) / M, (r.mA * VA[1] + r.mB * VB[1]) / M];
          const g = [VA[0] - VB[0], VA[1] - VB[1]], gs = Math.hypot(g[0], g[1]), mu0 = r.mA * r.mB / M;
          const Erel = 0.5 * mu0 * 1e-3 * gs * gs / 1000; // kJ/mol (mass in kg/mol)
          const Ep = Erel + Q.value, muP = r.mAB * r.mC / M, gp = Math.sqrt(2 * Ep * 1000 / (muP * 1e-3)), uAB = gp * r.mC / M, uC = gp * r.mAB / M;
          const uA = [VA[0] - vcm[0], VA[1] - vcm[1]], e0 = Math.atan2(uA[1], uA[0]); // forward direction
          const ths = sample(mech.value);
          const isAB = prod.value === 'AB', uP = isAB ? uAB : uC, off = isAB ? 0 : Math.PI;
          const pts = ths.map((t) => [vcm[0] + uP * Math.cos(e0 + t + off), vcm[1] + uP * Math.sin(e0 + t + off)]);
          const bx = [0, VA[0], VB[0], vcm[0] - uP, vcm[0] + uP], by = [0, VA[1], VB[1], vcm[1] - uP, vcm[1] + uP];
          const x0 = Math.min(...bx), x1 = Math.max(...bx), y0 = Math.min(...by), y1 = Math.max(...by), pad = 0.12 * Math.max(x1 - x0, y1 - y0), ext = Math.max(x1 - x0, y1 - y0);
          A.setView([x0 - pad, x1 + pad], [y0 - pad, y1 + pad]);
          A.circle(vcm[0], vcm[1], uP, { color: 'ink', width: 1.4, dash: [5, 4], fill: 'purple', fillAlpha: 0.05 });
          A.dots(pts, { r: 1.6, color: 'purple', alpha: 0.5 });
          A.arrow(0, 0, VA[0], VA[1], { color: 'accent', width: 2.4, head: 9 }); A.arrow(0, 0, VB[0], VB[1], { color: 'orange', width: 2.4, head: 9 });
          A.arrow(0, 0, vcm[0], vcm[1], { color: 'green', width: 2.8, head: 9 });
          A.arrow(vcm[0], vcm[1], VA[0], VA[1], { color: 'accent', width: 1.2, head: 6, alpha: 0.5, dash: true });
          A.text('A', VA[0], VA[1] - ext * 0.06, { color: 'accent', size: 13, weight: 650, align: 'center' }); A.text('BC', VB[0] + ext * 0.04, VB[1] + ext * 0.04, { color: 'orange', size: 13, weight: 650 });
          A.text('v_cm', vcm[0] * 0.5 + ext * 0.02, vcm[1] * 0.5 - ext * 0.07, { color: 'green', size: 12, weight: 650 });
          A.text(isAB ? 'forward' : 'forward partner', vcm[0] + uP * Math.cos(e0 + off) * 1.03, vcm[1] + uP * Math.sin(e0 + off) * 1.03 + ext * 0.04, { color: 'muted', size: 11, align: 'center' });
          // COM polar distribution
          B.polarGrid({ rings: [0.5, 1], spokes: 8, rmax: 1.05, angles: false });
          const mx = Math.max(...Array.from({ length: 360 }, (_, i) => I(mech.value, -Math.PI + 2 * Math.PI * i / 360)));
          B.curve((t) => [(0.1 + 0.9 * I(mech.value, t) / mx) * Math.cos(t), (0.1 + 0.9 * I(mech.value, t) / mx) * Math.sin(t)], -Math.PI, Math.PI, { n: 240, color: 'purple', width: 2.4 });
          B.text('forward (0°)', 1.0, -0.08, { size: 11, color: 'muted', align: 'right' }); B.text('backward (180°)', -1.0, -0.08, { size: 11, color: 'muted', align: 'left' });
          // lab histogram: lab angle relative to beam A direction
          const lab = pts.map((p) => Math.atan2(p[1], p[0]) * 180 / Math.PI);
          const H = v.M.histogram(lab, { bins: 36, range: [-180, 180] }), mxh = Math.max(...H.counts, 1);
          C.hist({ edges: H.edges, counts: H.counts.map((c) => c / mxh) }, { color: 'purple', fillAlpha: 0.35 });
          // momentum check
          const vAB = isAB ? pts[0] : [vcm[0] - (r.mC / r.mAB) * (pts[0][0] - vcm[0]), vcm[1] - (r.mC / r.mAB) * (pts[0][1] - vcm[1])], vC = isAB ? [vcm[0] - (r.mAB / r.mC) * (vAB[0] - vcm[0]), vcm[1] - (r.mAB / r.mC) * (vAB[1] - vcm[1])] : pts[0];
          const P2 = [r.mAB * vAB[0] + r.mC * vC[0], r.mAB * vAB[1] + r.mC * vC[1]], P1 = [M * vcm[0], M * vcm[1]];
          info = { vcm, Erel, Ep, uAB, uC, res: Math.hypot(P2[0] - P1[0], P2[1] - P1[1]) / Math.hypot(...P1), gs };
        });
        v.legend([['accent', 'beam A'], ['orange', 'beam BC'], ['green', 'centre-of-mass velocity'], ['purple', 'chosen product (Newton circle)']]);
        v.readout(() => `$|\\mathbf v_{cm}|=${v.fix(Math.hypot(...info.vcm), 0)}$ m/s · relative speed $${v.fix(info.gs, 0)}$ m/s, $E_{\\rm rel}=${v.fix(info.Erel, 1)}$ kJ/mol → product translational energy $E'=E_{\\rm rel}+Q=${v.fix(info.Ep, 1)}$ kJ/mol\nproduct speeds in the COM frame: AB $${v.fix(info.uAB, 0)}$ m/s, C $${v.fix(info.uC, 0)}$ m/s (momentum conservation: $m_{AB}u_{AB}=m_Cu_C$; lab momentum of a sampled pair equals the total to $${v.sci(info.res, 1)}$ relative)`);
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10', kind: 'Phenomenon', name: 'Negative activation energies',
      statement: String.raw`Some reactions slow down when heated: their Arrhenius plots have a positive slope and an apparent activation energy $E_a=-R\,d\ln k/d(1/T)<0$. This is possible for a composite rate constant. For $\mathrm A+\mathrm B\underset{k_{-1}}{\overset{k_1}{\rightleftharpoons}}\mathrm C^{*}\xrightarrow{k_2}\mathrm P$ with the steady-state approximation for $\mathrm C^*$,
$$k_{\rm eff}=\frac{k_1k_2}{k_{-1}+k_2},\qquad E_a^{\rm eff}=E_1+w\,(E_2-E_{-1}),\quad w=\frac{k_{-1}}{k_{-1}+k_2}.$$
When $k_{-1}\gg k_2$ ($w\to1$) the reactants are in pre-equilibrium with the complex and $E_a^{\rm eff}=E_1+E_2-E_{-1}$, which is negative if redissociating from the complex needs more energy than forming it and reacting on, $E_{-1}>E_1+E_2$. An elementary step cannot have $E_a<0$ in the Arrhenius picture, but a mechanism can.`,
      idea: String.raw`The equilibrium constant $K=k_1/k_{-1}$ of an exothermic association falls with temperature, and in the pre-equilibrium limit it multiplies the second step: $k_{\rm eff}=K k_2$. If the exothermicity $E_{-1}-E_1$ outweighs the small barrier $E_2$ of the second step, the loss of complex at higher $T$ beats the faster reaction of what remains. At low temperature the complex rarely redissociates ($k_{-1}\ll k_2$), every complex reacts and $k_{\rm eff}\to k_1$, which has an ordinary small positive $E_a$. A well-known example is the oxidation $2\mathrm{NO}+\mathrm O_2\to2\mathrm{NO_2}$, whose rate constant decreases slightly with $T$ (via the dimer $(\mathrm{NO})_2$). Put $x=1/T$ and assume the three elementary Arrhenius prefactors and energies are constant over the window. The product, sum and quotient derivative rules in pma 5.3, with $k_i\prime(x)=-(E_i/R)k_i(x)$, give $-R(\log k_{\rm eff})\prime=E_1+E_2-(E_{-1}k_{-1}+E_2k_2)/(k_{-1}+k_2)$. Rearrangement gives the displayed weighted energy; the positive denominator is essential.`,
      caption: String.raw`Drag the activation energies of the three steps (pre-exponentials fixed at $A_1=10^9$, $A_{-1}=10^{13}$, $A_2=10^{9}$ in consistent units). Left: the Arrhenius plot of $k_{\rm eff}$ (solid), with the pre-equilibrium limit dashed: for the default values it bends from a flat part at low $T$ into a line of positive slope. Right: the local apparent activation energy $E_a^{\rm eff}(T)$ computed numerically from the curve (dots), against the formula (line).`,
      deps: ['kin-2.1', 'kin-1.9', 'pma-5.3'],
      refs: ['Houston'],
      tags: ['activation energy', 'mechanism'],
      scope: String.raw`Needs a bound or loosely bound intermediate in rapid equilibrium with the reactants; $E_a<0$ is an apparent value for a composite mechanism, not the barrier of any elementary step.`,
      viz(v) {
        const E1 = v.slider('$E_1$ (kJ/mol)', 0, 40, 0, { step: 0.5 });
        const Em1 = v.slider('$E_{-1}$ (kJ/mol)', 5, 80, 30, { step: 0.5 });
        const E2 = v.slider('$E_2$ (kJ/mol)', 0, 60, 10, { step: 0.5 });
        const Tm = v.slider('temperature marker (K)', 150, 1000, 400, { step: 5 });
        const A1 = 1e9, Am1 = 1e13, A2 = 1e9;
        const kk = (T) => { const k1 = A1 * Math.exp(-E1.value / (R * T)), km = Am1 * Math.exp(-Em1.value / (R * T)), k2 = A2 * Math.exp(-E2.value / (R * T)); return { k1, km, k2, k: k1 * k2 / (km + k2), w: km / (km + k2) }; };
        const A = v.stage({ x: [1, 6.7], y: [-10, 25], axes: 'box', gutter: true, height: 330, xlabel: '1000 / T  (1/K × 1000)', ylabel: 'ln k(eff)', title: 'Arrhenius plot of the composite rate constant', weight: 1.1 });
        const B = v.stage({ x: [150, 1000], y: [-80, 80], axes: 'box', gutter: true, height: 330, xlabel: 'T (K)', ylabel: 'apparent Eₐ (kJ/mol)', title: 'local activation energy', weight: 1, minWidth: 260 });
        let info = {};
        v.render(() => {
          const Ts = []; for (let T = 150; T <= 1000; T += 5) Ts.push(T);
          const ln = (T) => Math.log(kk(T).k), lnK = (T) => Math.log(A1 * A2 / Am1) - (E1.value + E2.value - Em1.value) / (R * T);
          const y = Ts.map((T) => ln(T)), lo = Math.min(...y), hi = Math.max(...y);
          A.setView([1, 6.7], [lo - 1.5, hi + 1.5]);
          A.curve((x) => [x, lnK(1000 / x)], 1, 6.7, { n: 80, color: 'green', width: 1.8, dash: [6, 4] });
          A.curve((x) => [x, Math.log(A1) - E1.value / (R * 1000 / x)], 1, 6.7, { n: 80, color: 'orange', width: 1.5, dash: [3, 4] });
          A.curve((x) => [x, ln(1000 / x)], 1, 6.7, { n: 200, color: 'accent', width: 2.8 });
          const T0 = Tm.value; A.dot(1000 / T0, ln(T0), { r: 6, color: 'gold' });
          const Eform = (T) => E1.value + kk(T).w * (E2.value - Em1.value);
          const Enum = (T) => { const h = 1e-3, x = 1000 / T; return -R * 1000 * (ln(1000 / (x + h)) - ln(1000 / (x - h))) / (2 * h); };
          B.hline(0, { color: 'ink', width: 1.2 });
          B.curve((T) => [T, Eform(T)], 150, 1000, { n: 170, color: 'accent', width: 2.6 });
          B.dots(Ts.filter((_, i) => i % 12 === 0).map((T) => [T, Enum(T)]), { r: 3.2, color: 'orange' });
          B.dot(T0, Eform(T0), { r: 6, color: 'gold' });
          B.hband(-80, 0, { color: 'red', alpha: 0.07 });
          const o = kk(T0); info = { T0, w: o.w, Ef: Eform(T0), En: Enum(T0), Elim: E1.value + E2.value - Em1.value, ratio: Math.exp(ln(T0 + 50) - ln(T0)) };
        });
        v.legend([['accent', 'exact steady-state $k_{\\rm eff}$'], ['green', 'pre-equilibrium limit $Kk_2$', { dash: true }], ['orange', '$k_1$', { dash: true }], ['gold', 'marker', { dot: true }]]);
        v.readout(() => `at $T=${info.T0}$ K: $w=k_{-1}/(k_{-1}+k_2)=${v.fix(info.w, 3)}$, apparent $E_a=E_1+w(E_2-E_{-1})=${v.fix(info.Ef, 1)}$ kJ/mol (numerical slope $${v.fix(info.En, 1)}$) · pre-equilibrium limit $E_1+E_2-E_{-1}=${v.fix(info.Elim, 1)}$ kJ/mol\nheating from $T$ to $T+50$ K changes $k_{\\rm eff}$ by a factor $${v.fix(info.ratio, 3)}$ — ${info.Ef < 0 ? 'the rate **falls** on heating' : 'the rate rises'}`);
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11', kind: 'Phenomenon', name: 'Non-Arrhenius behaviour and curved Arrhenius plots',
      statement: String.raw`Over wide temperature ranges $\ln k$ against $1/T$ is generally **curved**, and the apparent activation energy $E_a(T)=-R\,d\ln k/d(1/T)$ depends on $T$. Two common causes: (i) a temperature-dependent prefactor, as in the modified Arrhenius form $k=AT^{n}e^{-E/RT}$, which gives $E_a=E+nRT$ and curves the plot upward at high $T$; (ii) **quantum tunnelling** through the barrier, which adds a transmission factor $\kappa(T)\ge1$ that grows as $T$ falls and bends the plot upward at low $T$ (towards a temperature-independent limit as $T\to0$ where only tunnelling at the bottom of the well contributes).`,
      idea: String.raw`With $k\propto T^{n}$ the local slope has an extra $nRT$ term, small at low $T$ and growing with $T$ (for $n=1$ this is the $k_BT/h$ prefactor of transition-state theory, chapter 3). Tunnelling is computed here honestly: for a parabolic barrier of height $V_0$ and imaginary frequency $\nu^\ddagger$ the transmission probability at energy $E$ is $P(E)=[1+e^{2\pi(V_0-E)/h\nu^\ddagger}]^{-1}$ (Kemble), and $\kappa(T)$ is its Boltzmann average divided by the classical $e^{-V_0/RT}$, integrated from $E=0$. Light atoms and thin barriers (hydrogen transfer) tunnel most.`,
      caption: String.raw`The solid curve is $\ln k$ against $1000/T$ for $k=A(T/300)^{n}\kappa(T)e^{-V_0/RT}$ from 100 K to 1000 K; the dashed line is the straight Arrhenius fit over the shaded window, which you can slide. Right: the local activation energy. Switch off tunnelling to isolate the prefactor effect; raise $\nu^\ddagger$ to tunnel more. Notice that an activation energy measured in a narrow window depends on where the window is.`,
      deps: ['kin-2.1'],
      refs: ['Houston'],
      tags: ['activation energy', 'tunnelling'],
      scope: String.raw`Parabolic-barrier tunnelling truncated at $E=0$ is a model: it is reliable for $T$ above the crossover $T_c=h\nu^\ddagger/2\pi k_B$ and a qualitative picture below it.`,
      viz(v) {
        const V0 = v.slider('barrier $V_0$ (kJ/mol)', 15, 80, 40, { step: 1 });
        const n = v.slider('prefactor exponent $n$ in $T^n$', 0, 2, 0.5, { step: 0.05 });
        const tun = v.toggle('tunnelling', true);
        const nu = v.slider('$\\nu^\\ddagger$ (cm⁻¹)', 300, 2000, 1200, { step: 50 });
        const w1 = v.slider('window: $T_{\\min}$ (K)', 100, 900, 250, { step: 10 });
        const w2 = v.slider('window: $T_{\\max}$ (K)', 150, 1000, 450, { step: 10 });
        const kap = (T) => {
          const kT = R * T, hw = nu.value * 0.011962656, v0 = V0.value, top = v0 + 40 * kT, N = 600, h = top / N;
          let s = 0; for (let i = 0; i <= N; i++) { const E = i * h, ex = (v0 - E) / kT - Math.log(1 + Math.exp(2 * Math.PI * (v0 - E) / hw)); s += (i === 0 || i === N ? 0.5 : 1) * Math.exp(ex); }
          return s * h / kT;
        };
        const lnk = (T) => n.value * Math.log(T / 300) - V0.value / (R * T) + (tun.value ? Math.log(kap(T)) : 0);
        const A = v.stage({ x: [1, 10], y: [-40, 5], axes: 'box', gutter: true, height: 330, xlabel: '1000 / T  (1/K × 1000)', ylabel: 'ln (k / A)', title: 'Arrhenius plot', weight: 1.1 });
        const B = v.stage({ x: [100, 1000], y: [0, 120], axes: 'box', gutter: true, height: 330, xlabel: 'T (K)', ylabel: 'apparent Eₐ (kJ/mol)', title: 'local activation energy', weight: 1, minWidth: 260 });
        let info = {};
        v.render(() => {
          const Ts = Array.from({ length: 91 }, (_, i) => 100 + 10 * i), y = Ts.map(lnk);
          A.setView([1, 10], [Math.min(...y) - 2, Math.max(...y) + 2]);
          const lo = Math.min(w1.value, w2.value - 20), hi = Math.max(w2.value, w1.value + 20);
          A.vband(1000 / hi, 1000 / lo, { color: 'gold', alpha: 0.12 });
          A.curve((x) => [x, lnk(1000 / x)], 1, 10, { n: 180, color: 'accent', width: 2.8 });
          const pts = Ts.filter((T) => T >= lo && T <= hi), f = v.M.linreg(pts.map((T) => 1000 / T), pts.map(lnk));
          A.line(1, f.slope + f.intercept, 10, 10 * f.slope + f.intercept, { color: 'orange', width: 2, dash: [7, 4] });
          const Eloc = (T) => { const h = 1e-3, x = 1000 / T; return -R * 1000 * (lnk(1000 / (x + h)) - lnk(1000 / (x - h))) / (2 * h); };
          B.curve((T) => [T, Eloc(T)], 100, 1000, { n: 120, color: 'accent', width: 2.6 });
          B.hline(V0.value, { color: 'faint', dash: [4, 4] }); B.text('barrier $V_0$', 990, V0.value + 5, { size: 11, color: 'muted', align: 'right' });
          B.vband(lo, hi, { color: 'gold', alpha: 0.12 }); B.hline(-f.slope * R * 1000, { color: 'orange', dash: [7, 4], width: 1.6 });
          info = { Efit: -f.slope * R * 1000, lo, hi, r2: f.r2, Tc: nu.value * 0.011962656 / (2 * Math.PI * R), k100: kap(100), k300: kap(300) };
        });
        v.legend([['accent', 'model'], ['orange', 'Arrhenius fit in the window', { dash: true }], ['gold', 'window', { area: true }]]);
        v.readout(() => `straight-line fit over ${info.lo}–${info.hi} K: $E_a=${v.fix(info.Efit, 1)}$ kJ/mol ($r^2=${v.fix(info.r2, 5)}$) vs the barrier $V_0=${v.fix(V0.value, 0)}$ kJ/mol\ncrossover temperature $T_c=h\\nu^\\ddagger/2\\pi k_B=${v.fix(info.Tc, 0)}$ K · tunnelling factor $\\kappa(300\\,\\mathrm K)=${v.fix(info.k300, 2)}$, $\\kappa(100\\,\\mathrm K)=${v.sci(info.k100, 2)}$`);
      },
    },
    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12', kind: 'Paper', name: 'Reaktionsgeschwindigkeit bei der Inversion von Rohrzucker',
      statement: String.raw`Arrhenius showed that the rate of the acid-catalysed inversion of cane sugar (sucrose hydrolysis to glucose and fructose) increases steeply with temperature, by about 10 % or more per degree near room temperature, far more than the temperature dependence of molecular speeds, of viscosity, or of the concentration of hydrogen ions can explain. He proposed that only a small fraction of the sugar molecules are "active", in an equilibrium with the ordinary (inactive) ones that shifts with temperature following van't Hoff's equation with a heat of activation $q$, so that $d\ln k/dT=q/(2T^2)$ ($q$ in cal/mol, the factor 2 standing for $R\approx2$ cal mol$^{-1}$K$^{-1}$). Integrating gives $k=Ae^{-q/2T}$, the Arrhenius equation, and he applied it to rate data on several reactions.`,
      idea: String.raw`Before 1889 the rate of a reaction was known to rise steeply with temperature, but the explanations on offer (more collisions, lower viscosity, more ions from the catalyst) all fell short by an order of magnitude: collision frequency rises as $\sqrt T$, about 0.2 % per degree. Arrhenius's step was to apply van't Hoff's equation for equilibria to the *reactive state* itself, an intermediate in rapid equilibrium whose abundance rises exponentially with temperature. The paper introduced the activation energy and the exponential law (2.1) and the idea that reaction requires a small energetic fraction of the molecules.`,
      caption: String.raw`**Not Arrhenius's table:** I could not retrieve the original data, so the points are synthetic, generated from the constant activation energy of each reaction with 3 % scatter (the value for sucrose inversion is the commonly quoted modern one, about 107 kJ/mol; the other two are round numbers for contrast). Pick a reaction, read $E_a$ from the slope of the straight line $\ln k$ against $1/T$, and compare the percent rise per degree (about 15 % per kelvin near 298 K for $E_a\approx107$ kJ/mol) with the 0.2 % per degree of a $\sqrt T$ collision frequency.`,
      deps: ['kin-1.5', 'pchem-7.9', 'thermo-6.1'],
      refs: [],
      tags: ['history', 'activation energy'],
      credit: 'Svante Arrhenius, 1889',
      verify: true,
      paper: { authors: 'Svante Arrhenius', year: 1889, title: 'Über die Reaktionsgeschwindigkeit bei der Inversion von Rohrzucker durch Säuren', venue: 'Zeitschrift für Physikalische Chemie 4: 226–248', doi: '10.1515/zpch-1889-0416' },
      introduces: ['kin-2.1'],
      viz(v) {
        const RXS = { s: { name: 'sucrose inversion by acid', Ea: 107, lnk0: -9.5 }, a: { name: 'illustrative: Eₐ = 50 kJ/mol', Ea: 50, lnk0: -6 }, b: { name: 'illustrative: Eₐ = 75 kJ/mol', Ea: 75, lnk0: -8 } };
        const sel = v.select('reaction', Object.keys(RXS).map((k) => ({ value: k, label: RXS[k].name })), 's');
        const Tc = v.slider('temperature $t$ (°C)', 0, 60, 25, { step: 1 });
        const rr = v.rng(1889);
        const tcs = [0, 10, 20, 30, 40, 50], noise = tcs.map(() => rr.normal());
        const A = v.stage({ x: [3.0, 3.7], y: [-12, 0], axes: 'box', gutter: true, height: 330, xlabel: '1000 / T  (1/K × 1000)', ylabel: 'ln k', title: 'ln k against 1/T', weight: 1.1 });
        const B = v.stage({ x: [0, 60], y: [0, 20], axes: 'box', gutter: true, height: 330, xlabel: 't (°C)', ylabel: 'rise of k per degree (%)', title: 'percent increase per degree', weight: 1, minWidth: 260 });
        let info = {};
        v.render(() => {
          const r = RXS[sel.value], lnk = (T) => r.lnk0 - r.Ea / R * (1 / T - 1 / 298.15);
          const pts = tcs.map((t, i) => ({ t, T: t + 273.15, y: lnk(t + 273.15) + 0.03 * noise[i] }));
          const f = v.M.linreg(pts.map((p) => 1000 / p.T), pts.map((p) => p.y));
          const ys = pts.map((p) => p.y); A.setView([3.0, 3.7], [Math.min(...ys) - 1.5, Math.max(...ys) + 1.5]);
          A.line(3.0, 3.0 * f.slope + f.intercept, 3.7, 3.7 * f.slope + f.intercept, { color: 'green', width: 2, dash: [7, 4] });
          pts.forEach((p) => A.dot(1000 / p.T, p.y, { r: 5, color: 'accent' }));
          const Tn = Tc.value + 273.15; A.vline(1000 / Tn, { color: 'gold', dash: [3, 4] }); A.dot(1000 / Tn, f.slope * 1000 / Tn + f.intercept, { r: 6, color: 'gold' });
          B.hband(10, 15, { color: 'green', alpha: 0.14 }); B.hband(0.15, 0.25, { color: 'red', alpha: 0.3 });
          B.text('Arrhenius: roughly 10 % or more per degree', 59, 16.3, { size: 11, color: 'green', align: 'right' }); B.text('√T collision frequency: ≈0.2 %', 59, 1.6, { size: 11, color: 'red', align: 'right' });
          const Efit = -f.slope * R * 1000, Tq = Tn, pdeg = (T) => 100 * (Math.exp(Efit / R * (1 / T - 1 / (T + 1))) - 1);
          B.curve((t) => [t, pdeg(t + 273.15)], 0, 60, { n: 80, color: 'accent', width: 2.6 }); B.dot(Tc.value, pdeg(Tq), { r: 6, color: 'gold' });
          info = { Efit, pc: pdeg(Tq), true: r.Ea, q: Efit * 1000 / 4.184, f10: Math.exp(Efit / R * (1 / Tq - 1 / (Tq + 10))), Tq };
        });
        v.legend([['accent', 'synthetic data / model', { dot: true }], ['green', 'straight-line fit', { dash: true }]]);
        v.readout(() => `slope of the fit: $E_a=${v.fix(info.Efit, 1)}$ kJ/mol (the value used to make the data: ${info.true}) · in Arrhenius's notation $q=${v.fix(info.q, 0)}$ cal/mol\nat $t=${Tc.value}$ °C the fitted rate rises by $${v.fix(info.pc, 1)}$ % per degree and by a factor $${v.fix(info.f10, 2)}$ over 10 K — whereas a $\\sqrt T$ collision frequency would give only $${v.fix(50 / info.Tq, 2)}$ %`);
      },
    },
  ],
};
