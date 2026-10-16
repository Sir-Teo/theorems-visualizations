// Electromagnetism — Chapter 3: Conductors and boundary-value problems (items 3.1–3.6)
import { TAU, KV, EPS0, pot, fld, sgnCol, heatPot, levels, quiver, solveLin, sor, resid, samp, drawLines, circ, potL, fldL } from './ch03.shared.js';

export default {
  collection: 'em',
  chapter: 3,
  title: 'Conductors and boundary-value problems',
  summary: String.raw`Mobile charges in a conductor rearrange until the interior field vanishes, leaving the surface an equipotential carrying $\sigma=\varepsilon_0E$. The uniqueness theorems say a solution of Laplace’s equation is pinned down by boundary data, which licenses every clever guess: image charges, separated series in Cartesian and spherical coordinates, complex potentials and conformal maps, and the humble relaxation method. Capacitance, Faraday cages, lightning rods and Green’s reciprocity all fall out of the same picture.`,
  items: [
    // ───────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Conductors in electrostatic equilibrium',
      statement: String.raw`A **conductor** is a material containing charges that are free to move through it. It is in **electrostatic equilibrium** when no charge is moving. Then:
(a) the electric field inside the conductor is zero, $\mathbf E=\mathbf 0$;
(b) the net charge density inside is zero, $\rho=0$: any net charge sits on the surface;
(c) the whole conductor (surface included) is at one potential, i.e. an equipotential;
(d) just outside the surface $\mathbf E$ is perpendicular to the surface.`,
      idea: String.raw`If $\mathbf E\neq\mathbf 0$ somewhere inside, free charges would feel a force and move, so it was not equilibrium: this is (a). Gauss’s law in differential form (em-1.15) gives $\rho=\varepsilon_0\nabla\cdot\mathbf E=0$, which is (b). Since $\mathbf E=-\nabla V$ (em-2.4) vanishes, $V$ is constant, which is (c); a tangential component of $\mathbf E$ just outside would, by continuity of $V$ along the surface, mean $V$ changes along the surface, so (d). Dynamically the charge arrives there fast: the free charge relaxes with a time constant $\varepsilon_0/\text{conductivity}$, about $10^{-19}$ s for copper.`,
      caption: String.raw`A cartoon conductor: 90 mobile electrons (blue) can slide through the ellipse, each tied to a fixed positive ion (grey) at its starting spot, and an external field $E_0$ is switched on. Watch the electrons drift to the left rim until the field they leave behind cancels $E_0$: the arrows inside shrink and the curve on the right falls to zero. Switch to **insulator** (electrons tied to their ions by springs) and the interior field only drops partway.`,
      scope: String.raw`A model: electrons interact through the two-dimensional (line-charge) $1/r$ force with a softened core, move by overdamped drift, and the numbers are in arbitrary units chosen so that a modest shift of the electron cloud cancels $E_0$. Real metals relax in about $10^{-19}$–$10^{-14}$ s and the surface layer is a fraction of a nanometre thick; the picture shows the structure of the argument, not those numbers.`,
      deps: ['em-1.15', 'em-2.4'],
      refs: ['Griffiths §2.5', 'Purcell ch. 3'],
      tags: ['conductor', 'equilibrium'],
      viz(v) {
        const A = 3.2, B = 2, NE = 90, G = 0.09, MU = 1.2, SOFT = 0.18;
        const s = v.stage({ x: [-5, 5], y: [-3.2, 3.2], equal: true, height: 330, axes: false, weight: 1.3, title: 'electrons in a conductor' });
        const sH = v.stage({ x: [0, 10], y: [0, 1.15], height: 330, axes: 'box', gutter: true, weight: 0.8, minWidth: 230, xlabel: 'time', ylabel: 'interior field / $E_0$', title: 'interior field' });
        const E0s = v.slider('applied field $E_0$', 0, 1, 1, { step: 0.05, onChange: () => sim.reset() });
        const mat = v.select('material', [{ value: 'c', label: 'conductor' }, { value: 'i', label: 'insulator (bound charges)' }], 'c', { onChange: () => sim.reset() });
        const r = v.rng(11), ion = [];
        while (ion.length < NE) { const x = (r() * 2 - 1) * A, y = (r() * 2 - 1) * B; if ((x / A) ** 2 + (y / B) ** 2 < 0.9) ion.push([x, y]); }
        const probes = []; for (let i = -2; i <= 2; i++) for (let j = -1; j <= 1; j++) probes.push([i * 1.15, j * 0.9]);
        const Eat = (e, px, py, E0) => {
          let u = E0, w = 0;
          for (let k = 0; k < NE; k++) {
            let dx = px - ion[k][0], dy = py - ion[k][1]; let d = dx * dx + dy * dy + SOFT * SOFT; u += (G * dx) / d; w += (G * dy) / d;
            dx = px - e[k][0]; dy = py - e[k][1]; d = dx * dx + dy * dy + SOFT * SOFT; u -= (G * dx) / d; w -= (G * dy) / d;
          }
          return [u, w];
        };
        const meanE = (e, E0) => { let u = 0, w = 0; for (const [px, py] of probes) { const f = Eat(e, px, py, E0); u += f[0]; w += f[1]; } return Math.hypot(u, w) / probes.length; };
        const sim = v.sim(() => ({ e: ion.map((p) => p.slice()), h: [[0, 1]], t: 0 }), (S, dt) => {
          const E0 = E0s.value, kap = mat.value === 'i' ? 5 : 0, d = [];
          for (let k = 0; k < NE; k++) {
            const f = Eat(S.e, S.e[k][0], S.e[k][1], E0);
            d.push([-MU * f[0] - kap * (S.e[k][0] - ion[k][0]), -MU * f[1] - kap * (S.e[k][1] - ion[k][1])]);
          }
          for (let k = 0; k < NE; k++) {
            let x = S.e[k][0] + dt * d[k][0], y = S.e[k][1] + dt * d[k][1]; const q = Math.sqrt((x / A) ** 2 + (y / B) ** 2);
            if (q > 0.985) { x *= 0.985 / q; y *= 0.985 / q; }
            S.e[k][0] = x; S.e[k][1] = y;
          }
          S.t += dt; S.h.push([S.t, E0 > 0 ? meanE(S.e, E0) / E0 : 0]);
        }, { dt: 0.1, maxSteps: 120 });
        let cur = 1;
        v.animate((t) => {
          sim.advance(t); const S = sim.state;
          s.path(Array.from({ length: 81 }, (_, k) => [A * Math.cos((TAU * k) / 80), B * Math.sin((TAU * k) / 80)]), { color: 'ink', width: 2, fill: 'orange', fillAlpha: 0.07, close: true });
          for (const p of ion) s.dot(p[0], p[1], { r: 2.5, color: 'faint' });
          for (const p of S.e) s.dot(p[0], p[1], { r: 3.2, color: 'blue' });
          const E0 = E0s.value;
          for (const [px, py] of probes) { const f = Eat(S.e, px, py, E0); const m = Math.hypot(f[0], f[1]); if (m > 0.01 * Math.max(E0, 0.2)) s.arrow(px - 0.0, py, px + (f[0] / Math.max(E0, 0.2)) * 0.9, py + (f[1] / Math.max(E0, 0.2)) * 0.9, { color: 'green', width: 1.6, head: 6 }); }
          for (let k = -2; k <= 2; k++) if (E0 > 0) { s.arrow(-4.9, k * 1.1, -4.9 + 0.55 * E0 / 1 + 0.05, k * 1.1, { color: 'accent', width: 1.6, head: 6 }); }
          s.text('$E_0$', -4.6, 2.9, { color: 'accent', size: 13 });
          cur = S.h[S.h.length - 1][1];
          sH.hline(1, { color: 'faint', dash: true }); sH.hline(0, { color: 'faint' });
          sH.path(S.h, { color: mat.value === 'c' ? 'green' : 'orange', width: 2.2 });
        }, { period: 10, still: 9 });
        v.readout(() => `Mean field at the 15 interior probe points: $${v.fix(cur, 2)}\\,E_0$.${mat.value === 'c' ? ' The mobile charges have cancelled the applied field inside; what is left is the surface layer on the left (excess electrons) and right (uncovered ions).' : ' Bound charges only polarize: the interior field is reduced but not removed.'}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'Field at a conductor’s surface is σ/ε₀',
      statement: String.raw`At a point of the surface of a conductor in electrostatic equilibrium, where the surface carries charge per unit area $\sigma$, the field just outside is normal to the surface and
$$\mathbf E=\frac{\sigma}{\varepsilon_0}\,\hat{\mathbf n},$$
with $\hat{\mathbf n}$ the unit normal pointing out of the conductor. The field inside is zero, so $\mathbf E$ jumps by $\sigma/\varepsilon_0$ across the surface.`,
      idea: String.raw`Take a thin Gaussian pillbox straddling the surface (em-1.15 in integral form, em-2.13 for the jump of the normal component). Its flat face inside the conductor sees $\mathbf E=\mathbf 0$ (em-3.1), its side faces shrink away, and the outer face has flux $E_\perp A$. Gauss gives $E_\perp A=\sigma A/\varepsilon_0$. The tangential component outside vanishes because the surface is an equipotential. Note $\sigma$ is *not* the whole story of the field: the field just outside comes from *all* the charge, and it is $\sigma$ that adjusts itself so that the formula holds.`,
      caption: String.raw`An infinitely long conducting cylinder of elliptical cross-section carries charge $\lambda$ per unit length (exact solution in confocal-ellipse coordinates). Slide the probe round the rim and bring it in to a small distance $\delta$: the field (green arrow) is normal to the surface and its size follows the charge density plotted on the right, high at the pointed ends. The last line of the readout integrates $\varepsilon_0E_n$ round the cross-section and recovers $\lambda$.`,
      scope: String.raw`Exact for the infinite elliptic cylinder (a two-dimensional cross-section); the theorem itself is local and holds at any smooth point of any conductor in equilibrium.`,
      deps: ['em-3.1', 'em-2.13'],
      refs: ['Griffiths §2.5'],
      tags: ['surface charge', 'gauss'],
      viz(v) {
        const a = 3.2;
        const s = v.stage({ x: [-6, 6], y: [-3.8, 3.8], equal: true, height: 340, axes: false, weight: 1.3, title: 'elliptic conducting cylinder (cross-section)' });
        const sP = v.stage({ x: [0, 360], y: [0, 1], height: 340, axes: 'box', gutter: true, weight: 0.75, minWidth: 230, xlabel: 'position round the rim $\\eta$ (degrees)', ylabel: '$\\sigma$ (nC/cm²)', title: 'surface charge density' });
        const rS = v.slider('shape $b/a$', 0.15, 0.95, 0.45, { step: 0.01 });
        const lamS = v.slider('charge per length $\\lambda$', 1, 10, 4, { step: 0.5, fmt: (x) => `${x} nC/cm` });
        const etS = v.slider('probe position $\\eta$', 0, 360, 40, { step: 1, fmt: (x) => `${x}°` });
        const dS = v.slider('probe distance $\\delta$', 0.01, 1.2, 0.05, { log: true, fmt: (x) => `${x.toPrecision(2)} cm` });
        let info = {};
        v.render(() => {
          const b = a * rS.value, c = Math.sqrt(a * a - b * b), xi0 = Math.atanh(b / a), lam = lamS.value;
          const xi = (x, y) => { const ch = (Math.hypot(x + c, y) + Math.hypot(x - c, y)) / (2 * c); return Math.acosh(Math.max(1, ch)); };
          const V = (x, y) => -2 * KV * lam * xi(x, y);
          const F = (x, y) => { const h = 1e-4; return [-(V(x + h, y) - V(x - h, y)) / (2 * h), -(V(x, y + h) - V(x, y - h)) / (2 * h)]; };
          const sig = (eta) => { const e = (eta * Math.PI) / 180, nx = Math.cos(e) / a, ny = Math.sin(e) / b, m = Math.hypot(nx, ny), P = [a * Math.cos(e), b * Math.sin(e)], f = F(P[0] + (nx / m) * 1e-3, P[1] + (ny / m) * 1e-3); return EPS0 * Math.hypot(f[0], f[1]); };
          const rim = Array.from({ length: 121 }, (_, k) => [a * Math.cos((TAU * k) / 120), b * Math.sin((TAU * k) / 120)]);
          const seeds = Array.from({ length: 24 }, (_, k) => { const e = (TAU * (k + 0.5)) / 24, nx = Math.cos(e) / a, ny = Math.sin(e) / b, m = Math.hypot(nx, ny); return [a * Math.cos(e) + (nx / m) * 0.02, b * Math.sin(e) + (ny / m) * 0.02]; });
          const lv = levels(2 * KV * lam * 0.35, 8).filter((x) => x);
          s.contour((x, y) => V(x, y), lv, { color: 'orange', alpha: 0.55, width: 1, res: 120 });
          drawLines(s, F, seeds, [-6, 6, -3.8, 3.8], { color: 'accent', h: 0.07, n: 500, alpha: 0.5 });
          s.path(rim, { color: 'ink', width: 2.2, close: true, fill: 'muted', fillAlpha: 0.2 });
          // charge density as bars outside the rim
          const smax = sig(0) > sig(90) ? sig(0) : sig(90);
          for (let k = 0; k < 60; k++) { const e = (TAU * k) / 60, nx = Math.cos(e) / a, ny = Math.sin(e) / b, m = Math.hypot(nx, ny), P = [a * Math.cos(e), b * Math.sin(e)], l = (0.9 * sig((k * 360) / 60)) / Math.max(sig(0), sig(90), sig(180)); s.segment([P[0], P[1]], [P[0] - (nx / m) * l * 0.9, P[1] - (ny / m) * l * 0.9], { color: 'red', width: 2.2, alpha: 0.7 }); }
          const e = (etS.value * Math.PI) / 180, nx = Math.cos(e) / a, ny = Math.sin(e) / b, m = Math.hypot(nx, ny), n = [nx / m, ny / m], Ps = [a * Math.cos(e), b * Math.sin(e)];
          const Pp = [Ps[0] + n[0] * dS.value, Ps[1] + n[1] * dS.value], f = F(Pp[0], Pp[1]), fm = Math.hypot(f[0], f[1]);
          s.dot(Ps[0], Ps[1], { r: 4, color: 'ink' }); s.dot(Pp[0], Pp[1], { r: 5, color: 'gold' });
          s.arrow(Pp[0], Pp[1], Pp[0] + (f[0] / fm) * 1.4, Pp[1] + (f[1] / fm) * 1.4, { color: 'green', width: 2.6, head: 9 });
          s.segment(Ps, [Ps[0] + n[0] * 1.4, Ps[1] + n[1] * 1.4], { color: 'ink', dash: true, alpha: 0.6 });
          s.tex(String.raw`\mathbf E`, Pp[0] + (f[0] / fm) * 1.6, Pp[1] + (f[1] / fm) * 1.6, { color: 'green', size: 15 });
          // profile
          const ys = Array.from({ length: 181 }, (_, k) => [k * 2, sig(k * 2)]), top = Math.max(...ys.map((p) => p[1])) * 1.15;
          sP.setView([0, 360], [0, top]);
          sP.path(ys, { color: 'red', width: 2.2 }); sP.vline(etS.value, { color: 'gold', dash: true });
          sP.dot(etS.value, sig(etS.value), { r: 5, color: 'gold' });
          // ∮ ε0 E_n dl
          let tot = 0; const K = 720;
          for (let k = 0; k < K; k++) { const t = (TAU * (k + 0.5)) / K, dl = Math.hypot(a * Math.sin(t), b * Math.cos(t)) * (TAU / K); tot += sig((t * 180) / Math.PI) * dl; }
          info = { En: f[0] * n[0] + f[1] * n[1], Et: f[0] * -n[1] + f[1] * n[0], sig: sig(etS.value), tot, lam, fm };
        });
        v.readout(() => `At the probe: $E_n=${v.fix(info.En, 1)}$ V/cm, tangential part $E_t/E_n=${v.fix(info.Et / info.En, 3)}$ (it vanishes as $\\delta\\to0$).\n$\\varepsilon_0E_n$ at the surface point = $${v.sci(info.sig, 3)}$ nC/cm², the charge density plotted on the right.\n$\\oint\\varepsilon_0E_n\\,d\\ell=${v.fix(info.tot, 3)}$ nC/cm against the actual $\\lambda=${info.lam}$ nC/cm.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Theorem',
      name: 'Electrostatic pressure on a conductor',
      statement: String.raw`A conductor's surface charge $\sigma$ feels an outward force per unit area
$$\frac{F}{A}=\frac{\sigma^2}{2\varepsilon_0}=\frac{\varepsilon_0}{2}E^2,$$
where $E=\sigma/\varepsilon_0$ is the field just outside. It is the force of the field on the surface charge, and the relevant field is the *average* of the outside value and the inside value (zero), i.e. $\tfrac12E$, not $E$ itself. The same pressure results from differentiating the field energy with respect to the volume.`,
      idea: String.raw`The field at the surface charge itself is not defined (it jumps by $\sigma/\varepsilon_0$ across the sheet), but the charge on a small patch feels the field of everything *except* that patch. The patch contributes $\mp\sigma/2\varepsilon_0$ on either side (by symmetry and em-3.2), so the rest of the conductor contributes $\sigma/2\varepsilon_0$ on both sides, which is the average of $E_{out}=\sigma/\varepsilon_0$ and $E_{in}=0$. Force per area is $\sigma\cdot\sigma/2\varepsilon_0$. Energy check (em-2.11): the field energy density is $\varepsilon_0E^2/2$, so letting the surface advance by $\delta$ changes the energy by that density times the volume swept.`,
      caption: String.raw`A conducting sphere of radius $R$ with charge $Q$ (left, to scale; arrows show the outward pressure). On the right the energy $U(R)=Q^2/8\pi\varepsilon_0R$ at fixed charge: inflating the sphere by $\delta R$ costs no work from outside, the energy drops by $-U'\,\delta R$, and this equals $(\sigma^2/2\varepsilon_0)\cdot4\pi R^2\,\delta R$ (bars). Push $Q$ up until the surface field reaches the breakdown field of air and the sphere flashes into corona.`,
      scope: String.raw`Applies to any conductor surface in equilibrium. The sphere picture takes isolated conducting sphere in air; the breakdown field $\approx3\times10^6$ V/m is a typical textbook value for dry air (depends on humidity, pressure and surface roughness). The comparison with the soap film's Laplace pressure $4\gamma/R$ uses a typical $\gamma\approx0.025$ N/m.`,
      deps: ['em-3.2', 'em-2.11'],
      refs: ['Griffiths §2.5', 'Purcell ch. 3'],
      tags: ['pressure', 'energy'],
      viz(v) {
        const EB = 3e4; // V/cm breakdown of air
        const s = v.stage({ x: [-8.5, 8.5], y: [-6.2, 6.2], equal: true, height: 330, axes: false, weight: 1, title: 'charged sphere, to scale' });
        const sU = v.stage({ x: [0.5, 8], y: [0, 1], height: 330, axes: 'box', gutter: true, weight: 1.1, xlabel: 'radius $R$ (cm)', ylabel: 'energy $U$ (µJ)', title: 'energy at fixed charge' });
        const Rs = v.slider('radius $R$', 1, 6, 3, { step: 0.1, fmt: (x) => `${x.toFixed(1)} cm` });
        const Qs = v.slider('charge $Q$', 0, 600, 150, { step: 5, fmt: (x) => `${x} nC` });
        const dRs = v.slider('virtual expansion $\\delta R$', 0.01, 1, 0.3, { log: true, fmt: (x) => `${x.toPrecision(2)} cm` });
        let info = {};
        v.render(() => {
          const R = Rs.value, Q = Qs.value, E = (KV * Q) / (R * R), sg = E * EPS0, P = 0.5 * 8.8541878128e-12 * (E * 100) ** 2; // Pa
          const U = (r) => 0.44937759 * Q * Q / r, dR = dRs.value;
          const over = E >= EB;
          const col = over ? 'gold' : 'red';
          if (over) for (let k = 0; k < 3; k++) s.circle(0, 0, R * (1.08 + 0.1 * k), { fill: 'gold', fillAlpha: 0.1 - 0.025 * k, stroke: false });
          s.circle(0, 0, R, { color: 'ink', width: 2.2, fill: 'muted', fillAlpha: 0.25 });
          const L = 1.9 * Math.min(1, P / 40 + 0.15);
          for (let k = 0; k < 16; k++) { const a = (TAU * k) / 16, c = Math.cos(a), sn = Math.sin(a); s.arrow(c * R, sn * R, c * (R + L), sn * (R + L), { color: col, width: 2.2, head: 7 }); }
          s.text(over ? 'corona!' : '$P=\\varepsilon_0E^2/2$', 0, 0, { align: 'center', size: 14, color: over ? 'gold' : 'ink' });
          const top = U(Math.max(0.5, R * 0.6)) * 1.05; sU.setView([0.5, 8], [0, Math.max(top, 1e-6)]);
          sU.fn((r) => U(r), { color: 'accent', width: 2.2, domain: [0.5, 8] });
          sU.segment([R, U(R)], [R + dR, U(R)], { color: 'faint', dash: true });
          sU.segment([R + dR, U(R)], [R + dR, U(R + dR)], { color: 'green', width: 3 });
          sU.dot(R, U(R), { r: 5, color: 'gold' }); sU.dot(R + dR, U(R + dR), { r: 4, hollow: true, color: 'green' });
          const dU = U(R) - U(R + dR);
          // work of the pressure while the surface advances: ∫ (σ²/2ε0)·4πr² dr with σ ∝ 1/r²
          const Wint = ((Q * 1e-9) ** 2 / (8 * Math.PI * 8.8541878128e-12)) * (1 / (R * 1e-2) - 1 / ((R + dR) * 1e-2)) * 1e6;
          info = { E, sg, P, dU, Wint, F: P * 4 * Math.PI * (R * 1e-2) ** 2, frac: E / EB, gam: (4 * 0.025) / (R * 1e-2), R, Q };
        });
        v.readout(() => `Surface field $E=${v.sci(info.E * 100, 3)}$ V/m, i.e. $${v.fix(info.frac * 100, 0)}\\%$ of the breakdown field; $\\sigma=${v.sci(info.sg * 1e4 * 1e-9, 3)}$ C/m².\nPressure $\\sigma^2/2\\varepsilon_0=${v.fix(info.P, 2)}$ Pa (compare a soap film’s $4\\gamma/R=${v.fix(info.gam, 1)}$ Pa); total outward force $${v.sci(info.F, 3)}$ N.\nEnergy released by expanding $\\delta R$: $-\\Delta U=${v.fix(info.dU, 4)}$ µJ; work done by the pressure along the way: $${v.fix(info.Wint, 4)}$ µJ.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Phenomenon',
      name: 'Charge crowds at sharp points',
      statement: String.raw`On a conductor the surface charge density, and therefore the field just outside, is largest where the surface is most sharply curved. For two conducting spheres of radii $R_1,R_2$ far apart and joined by a thin wire (a common potential $V$), the charges split as $Q_i\propto R_i$, so
$$\sigma_i=\frac{Q_i}{4\pi R_i^2}\propto\frac1{R_i},\qquad E_i=\frac{V}{R_i}.$$
The smaller sphere has the larger field, and it is the first to ionize the air around it.`,
      idea: String.raw`A sphere of radius $R$ at potential $V$ has $V=kQ/R$ (em-2.6), hence $Q=4\pi\varepsilon_0RV$ and $E=kQ/R^2=V/R$. Joined by a wire, the spheres share $V$ (em-3.1), which forces $Q_i\propto R_i$ and $E_i\propto1/R_i$. The same scaling holds locally for any sharp tip: it behaves like a small sphere at the potential of the whole conductor, which is why a lightning rod works and why a needle “sprays” charge into the air.`,
      caption: String.raw`Total charge $Q_{tot}$ is shared between a big sphere ($R_2=8$ cm) and a small one (radius $R_1$ — slide it) connected by a wire. The circle sizes are to scale; the dots on each rim have area growing with the surface charge density; the right panel plots the surface field of the small sphere against its radius with the breakdown field of air as a line. Shrink the small sphere and it eventually glows (corona).`,
      scope: String.raw`Spheres far apart so that each sees the other only as a distant charge (to leading order $R_i\ll$ separation). Breakdown field of dry air about $3\times10^6$ V/m (typical value; it depends on humidity and pressure). Real tips are not spheres; the $1/R$ trend is robust, the prefactor is not.`,
      credit: String.raw`Franklin’s pointed lightning rod, 1750s`,
      deps: ['em-3.1', 'em-2.6'],
      refs: ['Purcell ch. 3', 'Feynman II ch. 6'],
      tags: ['lightning rod', 'corona'],
      verify: true,
      viz(v) {
        const EB = 3e4, R2 = 8;
        const s = v.stage({ x: [-10, 11], y: [-6, 6], equal: true, height: 300, axes: false, weight: 1.2, title: 'two spheres joined by a wire' });
        const sE = v.stage({ x: [0.1, 8], y: [3e2, 1e6], xlog: true, ylog: true, height: 300, axes: 'box', gutter: true, weight: 0.9, minWidth: 240, xlabel: 'small sphere radius $R_1$ (cm)', ylabel: '$E_1$ (V/cm)', title: 'surface field of the small sphere' });
        const Rs = v.slider('small radius $R_1$', 0.1, 8, 3, { log: true, fmt: (x) => `${x.toPrecision(2)} cm` });
        const Qs = v.slider('total charge $Q_{tot}$', 5, 400, 120, { step: 5, fmt: (x) => `${x} nC` });
        let info = {};
        v.render(() => {
          const R1 = Rs.value, Q = Qs.value, Q1 = (Q * R1) / (R1 + R2), Q2 = Q - Q1, Vc = (KV * Q) / (R1 + R2);
          const E = (R) => Vc / R, E1 = E(R1), over = E1 >= EB;
          s.circle(-2, 0, R2 * 0.6, { color: 'ink', width: 2, fill: 'muted', fillAlpha: 0.2 });
          const cs = 6.2;
          s.circle(cs, 0, Math.max(R1 * 0.6, 0.06), { color: 'ink', width: 2, fill: 'muted', fillAlpha: 0.2 });
          s.path([[-2 + R2 * 0.6, 0], [cs - Math.max(R1 * 0.6, 0.06), 0]], { color: 'faint', width: 1.4, dash: true });
          if (over) for (let k = 0; k < 3; k++) s.circle(cs, 0, Math.max(R1 * 0.6, 0.06) * (1.3 + 0.35 * k) + 0.2 * k, { fill: 'gold', fillAlpha: 0.2 - 0.05 * k, stroke: false });
          // surface-density markers: radius of the dot ∝ σ (log-compressed)
          const dens = (q, R) => q / (4 * Math.PI * R * R);
          const dm = Math.max(dens(Q1, R1), dens(Q2, R2));
          const dr = (q, R) => 1.5 + 5 * Math.sqrt(dens(q, R) / dm);
          for (let k = 0; k < 14; k++) { const a = (TAU * k) / 14; s.dot(-2 + R2 * 0.6 * Math.cos(a), R2 * 0.6 * Math.sin(a), { r: dr(Q2, R2), color: 'red', alpha: 0.6 }); s.dot(cs + Math.max(R1 * 0.6, 0.06) * Math.cos(a), Math.max(R1 * 0.6, 0.06) * Math.sin(a), { r: dr(Q1, R1), color: 'red', alpha: 0.6 }); }
          s.text(`$R_2=8$ cm`, -2, -5.3, { align: 'center', size: 12, color: 'muted' }); s.text(`$R_1=${R1.toPrecision(2)}$ cm`, cs, -2.8 - R1 * 0.4, { align: 'center', size: 12, color: 'muted' });
          s.text('to scale ×0.6', 9.2, 5.2, { align: 'right', size: 10, color: 'faint' });
          sE.fn((R) => E(R), { color: 'accent', width: 2.2, domain: [0.1, 8] });
          sE.hline(EB, { color: 'red', dash: true }); sE.text('breakdown of air', 0.13, EB * 1.3, { size: 11, color: 'red' });
          sE.dot(R1, Math.max(E1, 3.1e2), { r: 6, color: over ? 'gold' : 'green' });
          info = { Q1, Q2, Vc, E1, E2: E(R2), s1: dens(Q1, R1), s2: dens(Q2, R2), over };
        });
        v.readout(() => `Common potential $V=${v.fix(info.Vc / 1000, 1)}$ kV. Charges $Q_1=${v.fix(info.Q1, 1)}$ nC, $Q_2=${v.fix(info.Q2, 1)}$ nC (ratio = ratio of radii).\nSurface fields: small sphere $E_1=${v.sci(info.E1 * 100, 3)}$ V/m, big sphere $E_2=${v.sci(info.E2 * 100, 3)}$ V/m, ratio $E_1/E_2=${v.fix(info.E1 / info.E2, 2)}=R_2/R_1$.${info.over ? ' **The small sphere is above the breakdown field: corona discharge.**' : ''}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Theorem',
      name: 'First uniqueness theorem',
      statement: String.raw`Let $\Omega$ be a bounded region and let $V_1,V_2$ both satisfy Poisson’s equation $\nabla^2V=-\rho/\varepsilon_0$ in $\Omega$ with the same $\rho$, and take the same values on the whole boundary $\partial\Omega$. Then $V_1=V_2$ throughout $\Omega$. (In a region where $\rho=0$, the solution of Laplace’s equation is determined by its boundary values alone.)`,
      idea: String.raw`The difference $D=V_1-V_2$ satisfies Laplace’s equation (em-2.8) and is $0$ on the boundary. By the maximum principle (em-2.15, the mean-value property) a harmonic function has no interior maximum or minimum, so $D\le\max_{\partial\Omega}D=0$ and $D\ge0$, hence $D\equiv0$. Another route is energy: with the divergence theorem, $\int_\Omega|\nabla D|^2\,d\tau=\oint D\,\nabla D\cdot d\mathbf a=0$, so $\nabla D=\mathbf 0$ and $D$ is constant, hence zero.`,
      caption: String.raw`Two relaxation runs (A and B) solve the same square-plate problem: potentials on the four sides and on a square electrode in the middle. They start from different guesses — pick the starting guess of each — and the slider sets how many Gauss–Seidel sweeps have been done. The difference $D=A-B$ (right) is harmonic with zero boundary values, and $\max|D|$ (bottom) decays towards $0$. Now tick **boundary data differ**: B is given a different potential on the right edge and the runs settle on different answers, because the hypothesis is gone.`,
      scope: String.raw`A square 31×31 grid and Gauss–Seidel relaxation stand in for the exact solutions; “converged” means the difference is below the plotting resolution. The theorem needs the *same* data on the *entire* boundary.`,
      deps: ['em-2.8', 'em-2.15', 'pma-10.51', 'pde-5.5', 'vcalc-8.9'],
      refs: ['Griffiths §3.1'],
      tags: ['uniqueness', 'laplace'],
      viz(v) {
        const N = 31, SW = 400;
        const mk = (t) => v.stage({ x: [-1, 1], y: [-1, 1], equal: true, height: 230, axes: false, weight: 1, minWidth: 190, title: t });
        const sA = mk('run A'), sB = mk('run B'), sD = mk('difference $D=A-B$');
        const sH = v.stage({ x: [0, SW], y: [1e-8, 10], ylog: true, height: 210, axes: 'box', gutter: true, full: true, xlabel: 'sweeps', ylabel: '$\\max|D|$', title: 'the difference decays' });
        const nS = v.slider('sweeps', 0, SW, 12, { int: true });
        const IN = [['zero', 'zero'], ['ramp', 'ramp'], ['rand', 'random'], ['hi', 'all 5 V']].map(([value, label]) => ({ value, label }));
        const iA = v.select('start of A', IN, 'zero'), iB = v.select('start of B', IN, 'rand');
        const bt = v.slider('top edge', -5, 5, 4, { step: 0.5, fmt: (x) => `${x} V` }), bl = v.slider('left edge', -5, 5, -2, { step: 0.5, fmt: (x) => `${x} V` });
        const be = v.slider('middle electrode', -5, 5, 5, { step: 0.5, fmt: (x) => `${x} V` });
        const diff = v.toggle('boundary data differ (right edge: A 0 V, B +3 V)', false);
        const fixed = new Uint8Array(N * N), base = (right) => { const V = new Float64Array(N * N); for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const k = j * N + i; if (j === N - 1) V[k] = bt.value; else if (j === 0) V[k] = 0; else if (i === 0) V[k] = bl.value; else if (i === N - 1) V[k] = right; else if (Math.abs(i - 15) <= 3 && Math.abs(j - 15) <= 3) V[k] = be.value; } return V; };
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (i === 0 || j === 0 || i === N - 1 || j === N - 1 || (Math.abs(i - 15) <= 3 && Math.abs(j - 15) <= 3)) fixed[j * N + i] = 1;
        const start = (kind, V, seed) => { const r = v.rng(seed); for (let k = 0; k < N * N; k++) if (!fixed[k]) V[k] = kind === 'zero' ? 0 : kind === 'hi' ? 5 : kind === 'ramp' ? -5 + (10 * (k % N)) / (N - 1) : (r() * 2 - 1) * 8; };
        let key = '', HA, HB, hist = [];
        const run = () => {
          const A = base(0), B = base(diff.value ? 3 : 0); start(iA.value, A, 1); start(iB.value, B, 2);
          HA = [Float64Array.from(A)]; HB = [Float64Array.from(B)]; hist = [];
          const md = () => { let m = 0; for (let k = 0; k < N * N; k++) m = Math.max(m, Math.abs(A[k] - B[k])); return m; };
          hist.push([0, md()]);
          for (let n = 1; n <= SW; n++) { sor(A, fixed, N, N, 1, 1); sor(B, fixed, N, N, 1, 1); hist.push([n, md()]); if (n <= 60 || n % 4 === 0) { HA[n] = Float64Array.from(A); HB[n] = Float64Array.from(B); } }
        };
        const get = (H, n) => { while (!H[n]) n--; return H[n]; };
        v.render(() => {
          const k = [bt.value, bl.value, be.value, iA.value, iB.value, diff.value].join();
          if (k !== key) { key = k; run(); }
          const n = nS.value, A = get(HA, n), B = get(HB, n);
          const hm = (s, G, id, sc) => { s.heat((x, y) => Math.tanh(samp(G, N, N, -1, 1, -1, 1, x, y) / sc), { range: [-1, 1], cmap: 'theme-diverging', neg: 'blue', pos: 'red', res: 3, key: id + n + k, alpha: 0.9, id }); s.rect(-0.2, -0.2, 0.2, 0.2, { color: 'ink', width: 1 }); };
          hm(sA, A, 'a', 5); hm(sB, B, 'b', 5);
          const D = new Float64Array(N * N); let mD = 0; for (let q = 0; q < N * N; q++) { D[q] = A[q] - B[q]; mD = Math.max(mD, Math.abs(D[q])); }
          hm(sD, D, 'd', Math.max(mD, 1e-9)); sD.corner(`colour range ±${mD.toPrecision(2)} V`, 'bl', { size: 11, plate: true });
          sH.path(hist.filter((p) => p[1] > 0).map((p) => [p[0], Math.max(p[1], 1e-8)]), { color: 'accent', width: 2 }); sH.vline(n, { color: 'gold', dash: true });
          sA.contour((x, y) => samp(A, N, N, -1, 1, -1, 1, x, y), levels(1, 5).filter((x) => x), { color: 'ink', alpha: 0.25, width: 1, res: 40 });
          sB.contour((x, y) => samp(B, N, N, -1, 1, -1, 1, x, y), levels(1, 5).filter((x) => x), { color: 'ink', alpha: 0.25, width: 1, res: 40 });
          window.__d = mD;
        });
        v.readout(() => { const n = nS.value; const d = hist[n] ? hist[n][1] : 0; return `After ${n} sweeps: $\\max|A-B|=${d >= 1e-3 ? v.fix(d, 4) : v.sci(d, 2)}$ V.${diff.value ? ' With different data on the right edge the difference converges to a nonzero harmonic function: uniqueness needs the same boundary values everywhere.' : ' Same data, so the difference is harmonic with zero boundary values and relaxes to zero.'}`; });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Theorem',
      name: 'Second uniqueness theorem',
      statement: String.raw`In a region bounded by conductors $1,\dots,n$ (and perhaps an outer boundary on which $V$ is given), with charge density $\rho$ specified between them, the electric field is determined uniquely once the **total charge $Q_i$** on each conductor is given. The potentials $V_i$ of the conductors, and the charge distribution on each, then follow.`,
      idea: String.raw`Suppose two fields $\mathbf E_1,\mathbf E_2$ have the same $\rho$ and the same $Q_i$. Their difference $\mathbf E_d$ has no source charge outside the conductors, and zero total flux through each conductor’s surface, and each conductor is an equipotential $V_i^{(d)}$ (em-3.1). Then $\int|\mathbf E_d|^2d\tau=\sum_iV_i^{(d)}\oint\mathbf E_d\cdot d\mathbf a=\sum_iV_i^{(d)}\cdot0=0$ by the divergence theorem (a variant of em-3.5), so $\mathbf E_d=\mathbf 0$. The surface charge on each conductor is therefore the one that makes the surface an equipotential.`,
      caption: String.raw`Three infinitely long conducting cylinders (cross-sections; drag the centres) carry the charges per unit length you choose. A charge-simulation solver puts fictitious line charges inside each cylinder and finds the surface-charge arrangement and the three potentials (red = positive density, blue = negative; bar length ∝ density). The **trial** option adds a perturbation with zero net charge to one cylinder: the totals $Q_i$ are unchanged, yet the surface is no longer equipotential, and the readout shows how much $V$ varies over it.`,
      scope: String.raw`Two-dimensional (line charges, logarithmic potential, zero set arbitrarily) so the three potentials are defined only up to a common constant; the solver uses 24 fictitious charges per cylinder, accurate to a small fraction of a percent when the cylinders are not nearly touching.`,
      deps: ['em-3.5', 'em-3.1'],
      refs: ['Griffiths §3.1'],
      tags: ['uniqueness', 'conductor'],
      viz(v) {
        const M = 24, rr = [1.1, 0.9, 0.75], col = ['accent', 'orange', 'green'];
        const s = v.stage({ x: [-5, 5], y: [-3.5, 3.5], equal: true, height: 360, axes: false, weight: 1.4, title: 'three conducting cylinders' });
        const hs = [[-2.6, 0.4], [1.8, 1.2], [0.4, -1.8]].map((p, k) => s.handle(p[0], p[1], { color: col[k], r: 7 }));
        const Qs = [v.slider('$Q_1$', -10, 10, 6, { step: 0.5, fmt: (x) => `${x} nC/cm` }), v.slider('$Q_2$', -10, 10, -3, { step: 0.5, fmt: (x) => `${x} nC/cm` }), v.slider('$Q_3$', -10, 10, 0, { step: 0.5, fmt: (x) => `${x} nC/cm` })];
        const trial = v.toggle('trial: rearrange charge on one cylinder', false);
        const which = v.select('cylinder', ['1', '2', '3'], '1'), mode = v.slider('harmonic $m$', 1, 3, 1, { int: true }), amp = v.slider('amount', 0, 3, 1.2, { step: 0.05 });
        let info = {}, sol = null;
        const solve = () => {
          const C = hs.map((h, k) => ({ x: h.x, y: h.y, r: rr[k] })), src = [], P = [];
          C.forEach((c, k) => { for (let j = 0; j < M; j++) { const a = (TAU * j) / M; src.push({ x: c.x + 0.8 * c.r * Math.cos(a), y: c.y + 0.8 * c.r * Math.sin(a), k, a, q: 0 }); P.push({ x: c.x + c.r * Math.cos(a), y: c.y + c.r * Math.sin(a), k }); } });
          const n = src.length, A = Array.from({ length: n + 3 }, () => new Array(n + 3).fill(0)), b = new Array(n + 3).fill(0);
          for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) A[i][j] = -2 * KV * Math.log(Math.hypot(P[i].x - src[j].x, P[i].y - src[j].y)); A[i][n + P[i].k] = -1; }
          for (let k = 0; k < 3; k++) { for (let j = 0; j < n; j++) if (src[j].k === k) A[n + k][j] = 1; b[n + k] = Qs[k].value; }
          const x = solveLin(A, b); src.forEach((s2, j) => { s2.q = x[j]; });
          sol = { C, src, V: [x[n], x[n + 1], x[n + 2]] };
        };
        const surfV = (src, c, k) => { let lo = 1e30, hi = -1e30; for (let j = 0; j < 4 * M; j++) { const a = (TAU * (j + 0.37)) / (4 * M), V = potL(src, c.x + c.r * Math.cos(a), c.y + c.r * Math.sin(a)); lo = Math.min(lo, V); hi = Math.max(hi, V); } return [lo, hi]; };
        let key = '';
        v.render(() => {
          const k0 = hs.map((h) => h.x.toFixed(3) + h.y.toFixed(3)).join() + Qs.map((q) => q.value).join(); if (k0 !== key) { key = k0; solve(); }
          const { C, src, V } = sol, w = which.value - 1;
          const use = src.map((q) => ({ ...q }));
          let pert = null;
          if (trial.value) { use.forEach((q) => { if (q.k === w) q.q += amp.value * Math.cos(mode.value * q.a); }); pert = use; }
          const Vm = Math.max(...V.map(Math.abs), 1);
          heatPot(s, (x, y) => { for (const c of C) if (Math.hypot(x - c.x, y - c.y) < c.r) return V[C.indexOf(c)]; return potL(use, x, y); }, 0.6 * Math.max(Math.abs(V[0]), Math.abs(V[1]), Math.abs(V[2]), 300), 'p' + k0 + (trial.value ? [w, mode.value, amp.value].join() : ''), { res: 3 });
          const lv = levels(Math.max(...V.map(Math.abs), 300) / 5, 9).filter((x) => x);
          s.contour((x, y) => { for (const c of C) if (Math.hypot(x - c.x, y - c.y) < c.r) return NaN; return potL(use, x, y); }, lv, { color: 'ink', alpha: 0.28, width: 1, res: 120 });
          C.forEach((c, k) => { s.circle(c.x, c.y, c.r, { color: col[k], width: 2.5, fill: col[k], fillAlpha: 0.12 }); });
          const qm = Math.max(...src.map((q) => Math.abs(q.q)), 1e-9);
          use.forEach((q, j) => { const c = C[q.k], len = (0.9 * q.q) / qm, a = q.a + Math.PI / M; const x0 = c.x + c.r * Math.cos(q.a), y0 = c.y + c.r * Math.sin(q.a); s.segment([x0, y0], [x0 + len * Math.cos(q.a) * 0.9 * 0.6, y0 + len * Math.sin(q.a) * 0.9 * 0.6], { color: q.q >= 0 ? 'red' : 'blue', width: 3, alpha: trial.value && q.k === w ? 1 : 0.65 }); });
          const sv = C.map((c, k) => surfV(trial.value ? pert : src, c, k));
          info = { V, spread: sv.map((r) => r[1] - r[0]), rel: Vm, Qt: C.map((c, k) => use.filter((q) => q.k === k).reduce((a, q) => a + q.q, 0)) };
          C.forEach((c, k) => s.text(`${k + 1}`, c.x, c.y, { align: 'center', size: 15, color: col[k], weight: 700 }));
        });
        v.readout(() => `Potentials of the cylinders (relative to the arbitrary zero): ${info.V.map((x, k) => `$V_${k + 1}=${v.fix(x / 1000, 2)}$ kV`).join(', ')}.\nTotal charges: ${info.Qt.map((x, k) => `$Q_${k + 1}=${v.fix(x, 2)}$`).join(', ')} nC/cm.\nVariation of $V$ over each surface: ${info.spread.map((x, k) => `$${k + 1}$: ${v.fix(x, 1)} V`).join(', ')}${trial.value ? ' — the rearranged cylinder is no longer an equipotential, so it is not a solution.' : ' — an equipotential up to the discretization.'}`);
      },
    },
  ],
};
