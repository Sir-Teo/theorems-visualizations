// Classical Mechanics — Chapter 8: Central forces and orbits

import { TAU, clamp, memo, rk4, centralOrbit, stateAt, kepEl, conicPts, roots, span, sci, num, sun, BODIES } from './ch08.shared.js';

// ── shell theorem helpers ─────────────────────────────────────────────────────
/** Thin spherical shell (mass 1, radius R) summed ring by ring (θ = πu², so rings crowd near the pole facing P):
 *  pull toward the centre on a point at distance r. `cum` collects [fraction of the shell passed, running sum]. */
function shellPull(r, R, n = 1500, cum = null) {
  let g = 0; const h = 1 / n; // Simpson's rule in u (n even)
  for (let i = 0; i <= n; i++) {
    const u = i * h, th = Math.PI * u * u, c = Math.cos(th), s2 = r * r + R * R - 2 * r * R * c;
    const f = s2 > 1e-24 ? (0.5 * Math.sin(th) * (r - R * c) * TAU * u) / (s2 * Math.sqrt(s2)) : 0;
    g += ((i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * f * h) / 3;
    if (cum && i % 6 === 0) cum.push([(1 - c) / 2, g]);
  }
  return g;
}
/** Uniform ball (mass 1, radius 1) as K nested shells, each summed ring by ring; `cum` gets [shell radius, running sum]. */
function ballPull(r, K = 200, n = 160, cum = null) {
  let g = 0;
  for (let k = 0; k < K; k++) {
    const R = (k + 0.5) / K, m = ((k + 1) ** 3 - k ** 3) / K ** 3;
    g += m * shellPull(r, R, n);
    if (cum) cum.push([(k + 1) / K, g]);
  }
  return g;
}
/** Cubic shell (half-side 1, mass 1, uniform surface density) by an n×n midpoint grid on each face; P = (px, py, 0).
 *  Returns [gx, gy]; if `bins` is given (array), adds each patch's pull toward O into bins along the axis u. */
function cubeField(px, py, n, ux = 1, uy = 0, bins = null) {
  const w = (1 / 24) * (2 / n) ** 2, tm = Math.abs(ux) + Math.abs(uy), nb = bins ? bins.length : 0;
  let gx = 0, gy = 0;
  for (let ax = 0; ax < 3; ax++) for (let sg = -1; sg <= 1; sg += 2) for (let i = 0; i < n; i++) {
    const a = -1 + (2 * (i + 0.5)) / n;
    for (let j = 0; j < n; j++) {
      const b = -1 + (2 * (j + 0.5)) / n;
      const qx = ax === 0 ? sg : a, qy = ax === 1 ? sg : ax === 0 ? a : b, qz = ax === 2 ? sg : b;
      const dx = qx - px, dy = qy - py, d2 = dx * dx + dy * dy + qz * qz, k = w / (d2 * Math.sqrt(d2));
      gx += k * dx; gy += k * dy;
      if (nb) { const t = qx * ux + qy * uy, bi = clamp(Math.floor(((tm - t) / (2 * tm)) * nb), 0, nb - 1); bins[bi] -= k * (dx * ux + dy * uy); }
    }
  }
  return [gx, gy];
}

export default {
  collection: 'mech',
  chapter: 8,
  title: 'Central forces and orbits',
  summary: String.raw`Two bodies attracting each other reduce to a single body of reduced mass moving in a fixed central field, and conservation of angular momentum then reduces that to one-dimensional motion in an effective potential with a centrifugal barrier. For the inverse-square law the orbits are conics with the force centre at a focus: Kepler’s three laws follow, the energy alone fixes the semi-major axis, the velocity vectors trace a circle, and the Laplace–Runge–Lenz vector explains why the ellipses do not precess. Bertrand’s theorem says that only two force laws close every bounded orbit, and small perturbations turn the closed ellipses into slowly precessing rosettes, as Mercury shows. The same machinery plans transfer orbits and gravity assists, proves the virial theorem, computes Rutherford’s scattering cross-section, and stops working at three bodies.`,
  items: [
    // ───────────────────────────────────────────────────────────── 8.1
    {
      num: '8.1',
      kind: 'Theorem',
      name: 'Newton’s shell theorem',
      statement: String.raw`Let mass $M$ be spread uniformly over a thin spherical shell of radius $R$ centred at $O$, and let every element attract by Newton’s inverse-square law. Then the gravitational field at a point $P$ at distance $r$ from $O$ is
$$\mathbf g(P) = -\frac{GM}{r^2}\,\hat{\mathbf r}\quad (r > R),\qquad \mathbf g(P) = \mathbf 0\quad (r < R):$$
outside, the shell pulls exactly like a point mass $M$ at its centre; inside, the pulls of its parts cancel everywhere, not only at the centre. Adding shells, any spherically symmetric body with density $\rho(r')$ acts outside as a point mass, and at radius $r$ inside it the field is $GM(r)/r^2$ toward the centre, where $M(r)$ is the mass within radius $r$ — for a uniform ball, $g = GMr/R^3$. Both spherical symmetry and the exact inverse-square law are needed.`,
      idea: String.raw`Cut the shell into rings coaxial with $OP$. The ring at polar angle $\theta$ has mass $\tfrac12 M\sin\theta\,d\theta$ and pulls $P$ along the axis with $G\,dm\,(r - R\cos\theta)/s^3$, where $s^2 = r^2 + R^2 - 2rR\cos\theta$ (law of gravitation, 1.17). Switching from $\theta$ to the distance $s$ makes the integral elementary, and it gives $GM/r^2$ when $P$ is outside and $0$ when $P$ is inside. Newton’s own argument for the inside is geometric: two opposite narrow cones from $P$ cut patches whose masses grow like the squared distances, which exactly cancels the $1/d^2$ weakening. The slickest proof is Gauss’s law — the divergence theorem (pma-10.51) applied to $\nabla\cdot\mathbf g = -4\pi G\rho$ on a concentric sphere, where symmetry makes $\mathbf g$ radial and of constant size.`,
      caption: String.raw`Drag the test mass $P$. Left: the shell is cut into rings perpendicular to $OP$, blue where they pull $P$ toward $O$, orange where they pull it away; the green arrow is the summed field. Top right: the running sum as rings are added from the pole nearest $P$ — inside, the near cap pulls outward and the rest of the shell cancels it exactly. Inside the shell, drag the purple point to aim Newton’s double cone. Bottom: the summed field along the ray through $P$ against the point-mass law. Switch to the uniform ball (shells added from the centre outward: the outer ones add nothing) or to a cubic shell, where neither claim survives.`,
      deps: ['mech-1.17', 'pma-10.51'],
      refs: ['Taylor §4.8'],
      tags: ['gravity', 'symmetry', 'Gauss law'],
      credit: 'Newton, 1687',
      scope: String.raw`Exact for an inverse-square force and exact spherical symmetry (thin shell or density depending only on the distance from the centre); for any other force law or shape the field outside is not that of a point mass and the field inside does not vanish.`,
      viz(v) {
        const shape = v.select('mass distribution', [{ value: 'shell', label: 'spherical shell' }, { value: 'ball', label: 'uniform ball' }, { value: 'cube', label: 'cubic shell' }], 'shell');
        const s = v.stage({ x: [-2.05, 2.05], y: [-1.5, 1.5], equal: true, axes: false, height: 320, weight: 1.15, title: 'cross-section through $O$ and $P$' });
        const cs = v.stage({ x: [0, 1], y: [-1, 1], axes: 'box', height: 320, title: 'running sum of the pull toward $O$' });
        const gp = v.stage({ x: [0, 2.6], y: [-0.16, 1.15], axes: 'box', height: 200, full: true, xlabel: 'r / R', title: 'field toward the centre along the ray $OP$ (units $GM/R^2$)' });
        const P = s.handle(0.48, 0.26, { color: 'gold', label: 'P', labelPos: 'n', constrain: { x: [-1.98, 1.98], y: [-1.45, 1.45] } });
        const Cn = s.handle(-0.7, 0.714, { color: 'purple', r: 5.5, constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; } });
        const prof = memo(); let cur = null;
        const profile = (mode, ux, uy) => prof(mode + '|' + (mode === 'cube' ? Math.round(Math.atan2(uy, ux) * 200) : ''), () => {
          const pts = [];
          for (let i = 1; i <= 64; i++) {
            const r = (2.6 * i) / 64;
            if (mode === 'shell') { if (Math.abs(r - 1) > 0.012) pts.push([r, shellPull(r, 1, 1200)]); }
            else if (mode === 'ball') pts.push([r, ballPull(r, 160, 120)]);
            else {
              const rs = 1 / Math.max(Math.abs(ux), Math.abs(uy));
              if (Math.abs(r - rs) < 0.06) continue;
              const g = cubeField(r * ux, r * uy, 28); pts.push([r, -(g[0] * ux + g[1] * uy)]);
            }
          }
          return pts;
        });
        v.render(() => {
          const mode = shape.value, r = Math.max(Math.hypot(P.x, P.y), 1e-6), ux = r > 1e-3 ? P.x / r : 1, uy = r > 1e-3 ? P.y / r : 0, nx = -uy, ny = ux;
          let g = [0, 0], cum = [], pred = 0, extra = {};
          if (mode === 'shell') {
            const gr = shellPull(r, 1, 1800, cum); g = [-gr * ux, -gr * uy]; pred = r > 1 ? 1 / (r * r) : 0;
            // rings: chords perpendicular to OP, drawn as thin ellipses
            const K = 18, dgs = [];
            for (let j = 0; j < K; j++) { const th = ((j + 0.5) * Math.PI) / K, c = Math.cos(th), s2 = r * r + 1 - 2 * r * c; dgs.push((0.5 * Math.sin(th) * (r - c) * (Math.PI / K)) / (s2 * Math.sqrt(s2))); }
            const big = Math.max(...dgs.map(Math.abs));
            s.circle(0, 0, 1, { fill: 'accent', fillAlpha: 0.06, color: 'faint', width: 1 });
            for (let j = 0; j < K; j++) {
              const th = ((j + 0.5) * Math.PI) / K, c = Math.cos(th), sn = Math.sin(th), cx = c * ux, cy = c * uy, A = sn, B = 0.12 * sn;
              const pts = []; for (let k = 0; k <= 48; k++) { const ph = (TAU * k) / 48; pts.push([cx + A * Math.cos(ph) * nx + B * Math.sin(ph) * ux, cy + A * Math.cos(ph) * ny + B * Math.sin(ph) * uy]); }
              const a = Math.abs(dgs[j]) / big;
              s.path(pts, { color: dgs[j] >= 0 ? 'blue' : 'orange', width: 1 + 2.2 * a, alpha: 0.25 + 0.75 * a });
            }
            s.line(-2.1 * ux, -2.1 * uy, 2.1 * ux, 2.1 * uy, { color: 'faint', dash: [3, 4], width: 1 });
            extra.near = cum.length ? Math.min(...cum.map((q) => q[1])) : 0;
            // Newton's double cone (inside only)
            Cn.visible = r < 0.96;
            if (r < 0.96) {
              let dx = Cn.x - P.x, dy = Cn.y - P.y; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
              const hit = (ex, ey, sgn) => { const b = P.x * ex + P.y * ey, c = r * r - 1, t = -b + sgn * Math.sqrt(b * b - c); return [P.x + t * ex, P.y + t * ey, Math.abs(t)]; };
              const al = 0.13, rot = (a) => [dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a)];
              const [e1, e2] = [rot(al), rot(-al)];
              const A1 = hit(e1[0], e1[1], 1), A2 = hit(e2[0], e2[1], 1), B1 = hit(e1[0], e1[1], -1), B2 = hit(e2[0], e2[1], -1);
              s.poly([[P.x, P.y], [A1[0], A1[1]], [A2[0], A2[1]]], { fill: 'purple', fillAlpha: 0.18, color: 'purple', width: 1 });
              s.poly([[P.x, P.y], [B1[0], B1[1]], [B2[0], B2[1]]], { fill: 'purple', fillAlpha: 0.18, color: 'purple', width: 1 });
              s.line(A1[0], A1[1], A2[0], A2[1], { color: 'purple', width: 4 });
              s.line(B1[0], B1[1], B2[0], B2[1], { color: 'purple', width: 4 });
              const d1 = hit(dx, dy, 1)[2], d2 = hit(dx, dy, -1)[2];
              extra.cone = { d1, d2 };
            }
          } else if (mode === 'ball') {
            Cn.visible = false;
            const K = 200, gr = ballPull(r, K, 160, cum); g = [-gr * ux, -gr * uy];
            let menc = 0; for (let k = 0; k < K; k++) if ((k + 0.5) / K < r) menc += ((k + 1) ** 3 - k ** 3) / K ** 3;
            pred = menc / (r * r); extra.cont = r > 1 ? 1 / (r * r) : r;
            for (let k = 10; k >= 1; k--) { const R = k / 10; s.circle(0, 0, R, { fill: R <= r ? 'green' : 'accent', fillAlpha: 0.05, color: R <= r ? 'green' : 'faint', width: R <= r ? 1.4 : 0.8 }); }
            s.circle(0, 0, Math.min(r, 1), { color: 'green', width: 2, dash: [5, 4] });
            extra.inside = menc;
          } else {
            Cn.visible = false;
            const bins = new Array(60).fill(0);
            g = cubeField(P.x, P.y, 70, ux, uy, bins);
            let acc = 0; bins.forEach((b, i) => { acc += b; cum.push([(i + 1) / 60, acc]); });
            pred = r > 1 / Math.max(Math.abs(ux), Math.abs(uy)) ? 1 / (r * r) : 0;
            s.rect(-1, -1, 1, 1, { fill: 'accent', fillAlpha: 0.06, color: 'faint', width: 1 });
            const tm = Math.abs(ux) + Math.abs(uy), big = Math.max(...bins.map(Math.abs)) || 1;
            for (let i = 0; i < 60; i += 3) {
              const t = tm - ((i + 1.5) / 60) * 2 * tm; // slice t = x·u + y·v crossing the square
              const ends = [];
              for (const [sx, sy] of [[1, 0], [0, 1]]) for (const q of [-1, 1]) {
                // intersections of the line {p·u = t} with the square edges x = q or y = q
                if (sx) { if (Math.abs(uy) > 1e-9) { const y = (t - q * ux) / uy; if (Math.abs(y) <= 1) ends.push([q, y]); } }
                else if (Math.abs(ux) > 1e-9) { const x = (t - q * uy) / ux; if (Math.abs(x) <= 1) ends.push([x, q]); }
              }
              if (ends.length >= 2) { const a = Math.abs(bins[i]) / big; s.line(ends[0][0], ends[0][1], ends[ends.length - 1][0], ends[ends.length - 1][1], { color: bins[i] >= 0 ? 'blue' : 'orange', width: 1 + 2 * a, alpha: 0.25 + 0.7 * a }); }
            }
            s.line(-2.1 * ux, -2.1 * uy, 2.1 * ux, 2.1 * uy, { color: 'faint', dash: [3, 4], width: 1 });
          }
          s.dot(0, 0, { r: 3, color: 'ink', label: 'O', labelPos: 'sw' });
          const gm = Math.hypot(g[0], g[1]), radial = -(g[0] * ux + g[1] * uy), perp = g[0] * nx + g[1] * ny;
          const ok = Math.abs(radial - pred) < 2e-3 * Math.max(1, pred) && Math.abs(perp) < 1e-3;
          if (gm > 0.05) { const L = 0.55 * Math.min(1.6, gm) / gm; s.arrow(P.x, P.y, P.x + L * g[0], P.y + L * g[1], { color: ok ? 'green' : 'red', width: 2.6 }); }
          else if (!ok && gm > 1e-6) { const L = 0.45 / gm; s.arrow(P.x, P.y, P.x + L * g[0], P.y + L * g[1], { color: 'red', width: 2, dash: [4, 3] }); s.text(`direction only (|g| = ${v.fix(gm, 4)})`, P.x, P.y, { color: 'red', size: 10.5, dy: 16, align: 'center' }); }
          if (pred > 0.004 && !ok) { const L = 0.55 * Math.min(1.6, pred) / pred; s.arrow(P.x, P.y, P.x - L * pred * ux, P.y - L * pred * uy, { color: 'green', width: 1.6, dash: [4, 3] }); }
          s.corner(ok ? (pred === 0 ? 'net pull = 0' : 'pull = point mass at O') : 'not a point mass, not zero', 'tl', { color: ok ? 'green' : 'red', weight: 600 });
          // running sum
          const yr = span([cum.map((q) => q[1]), [0, pred]], 0.12, 0.2);
          cs.setView([0, 1], yr);
          cs.setTitle(mode === 'ball' ? 'running sum against the radius of the last shell added' : mode === 'shell' ? 'running sum against the fraction of the shell added (from $P$’s side)' : 'running sum, slice by slice from $P$’s side');
          cs.hline(0, { color: 'muted', width: 1 });
          cs.hline(pred, { color: 'green', dash: [5, 4], width: 1.5 });
          cs.path(cum, { color: mode === 'cube' && !ok ? 'red' : 'accent', width: 2.4 });
          if (cum.length) cs.dot(cum[cum.length - 1][0], cum[cum.length - 1][1], { r: 4.5, color: ok ? 'green' : 'red' });
          if (mode === 'ball') cs.vline(Math.min(r, 1), { color: 'gold', dash: [3, 3] });
          // profile
          const pts = profile(mode, ux, uy), rs = mode === 'cube' ? 1 / Math.max(Math.abs(ux), Math.abs(uy)) : 1;
          gp.vband(0, rs, { color: 'accent', alpha: 0.06 });
          gp.fn((x) => (x > rs ? 1 / (x * x) : mode === 'ball' ? x : 0), { color: 'green', width: 2, dash: [6, 4] });
          gp.dots(pts, { r: 3, color: mode === 'cube' ? 'red' : 'accent' });
          if (mode === 'cube') { // magnify the small but non-zero field inside the cube
            const mag = pts.filter((q) => q[0] < rs).map((q) => [q[0], 20 * q[1]]), lo = Math.min(-0.16, 1.25 * Math.min(...mag.map((q) => q[1])));
            gp.setView([0, 2.6], [lo, Math.max(1.15, -lo * 0.4 + 1.15)]);
            gp.hline(0, { color: 'faint', width: 1 });
            gp.dots(mag, { r: 2.6, color: 'purple' });
            const lab = mag[mag.length - 1]; if (lab) gp.text('inside ×20', lab[0], lab[1], { color: 'purple', size: 11, dx: 8, dy: -10, align: 'left' });
          } else gp.setView([0, 2.6], [-0.16, 1.15]);
          gp.vline(r, { color: 'gold', width: 1.5 });
          gp.dot(Math.min(r, 2.58), radial, { r: 5, color: 'gold' });
          cur = { mode, r, radial, perp, pred, gm, ok, extra };
        });
        v.legend([['blue', 'pulls $P$ toward $O$'], ['orange', 'pulls $P$ away from $O$'], ['accent', 'numerical sum', { dot: true }], ['green', 'point mass outside, $0$ inside (ball: $GMr/R^3$)', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { mode, r, radial, perp, pred, extra } = cur, C = v.M.CONST;
          if (mode === 'shell') {
            if (r > 1) return String.raw`$r = ${v.fix(r, 3)}R$ (outside): sum over 1800 rings $g_r = ${v.fix(radial, 6)}$, point mass $GM/r^2 = ${v.fix(pred, 6)}$ — difference $${sci(v, radial - pred)}$`;
            let out = String.raw`$r = ${v.fix(r, 3)}R$ (inside): sum over 1800 rings $g_r = ${sci(v, radial)}$ — zero. The cap nearest $P$ alone pulls outward with $${v.fix(-extra.near, 4)}$, and the rest of the shell cancels it`;
            if (extra.cone) { const { d1, d2 } = extra.cone; out += String.raw` · double cone: patch masses $\propto d^2$, ratio $(d_1/d_2)^2 = ${v.fix((d1 / d2) ** 2, 4)}$, pulls $\propto m/d^2$: ratio $1$`; }
            return out;
          }
          if (mode === 'ball') {
            const gE = (C.G * C.Mearth) / C.Rearth ** 2;
            return String.raw`$r = ${v.fix(r, 3)}R$: sum over 200 shells $g_r = ${v.fix(radial, 5)}$ · ${r < 1 ? String.raw`mass of the shells inside $r$: $M(r) = ${v.fix(extra.inside, 5)}M$, and $GM(r)/r^2 = ${v.fix(pred, 5)}$ — the shells outside add nothing (continuous ball: $GMr/R^3 = ${v.fix(extra.cont, 4)}$)` : String.raw`point mass $GM/r^2 = ${v.fix(pred, 5)}$`} · Earth as a uniform ball: $GM_\oplus/R_\oplus^2 = ${v.fix(gE, 2)}$ m/s², so here ${v.fix(gE * radial, 2)} m/s²`;
          }
          return String.raw`cubic shell, same mass: radial pull $${v.fix(radial, 4)}$ vs the point-mass/zero claim $${v.fix(pred, 4)}$, sideways component $${v.fix(perp, 4)}$ (field off the radial line by $${v.fix((Math.atan2(Math.abs(perp), radial) * 180) / Math.PI, 1)}°$) — far away the cube does approach $GM/r^2$, but only approximately`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.2
    {
      num: '8.2',
      kind: 'Definition',
      name: 'Two-body problem: reduced mass',
      statement: String.raw`Two particles of masses $m_1, m_2$ interact through a force $\mathbf F(\mathbf r)$ that depends only on their separation $\mathbf r = \mathbf r_2 - \mathbf r_1$, with no external forces. With total mass $M = m_1 + m_2$ and centre of mass $\mathbf R = (m_1\mathbf r_1 + m_2\mathbf r_2)/M$,
$$\mathbf r_1 = \mathbf R - \frac{m_2}{M}\,\mathbf r,\qquad \mathbf r_2 = \mathbf R + \frac{m_1}{M}\,\mathbf r,\qquad M\ddot{\mathbf R} = \mathbf 0,\qquad \mu\,\ddot{\mathbf r} = \mathbf F(\mathbf r),$$
where the **reduced mass** is $\mu = \dfrac{m_1m_2}{m_1 + m_2}$. So the centre of mass coasts uniformly and the separation moves like a single particle of mass $\mu$ in the fixed field $\mathbf F$. The energy splits as $\tfrac12 M|\dot{\mathbf R}|^2 + \tfrac12\mu|\dot{\mathbf r}|^2 + U(\mathbf r)$ and the angular momentum about $\mathbf R$ is $\mu\,\mathbf r\times\dot{\mathbf r}$. For gravity, $\mathbf F = -Gm_1m_2\,\mathbf r/r^3$, the relative orbit depends on the masses only through $M$.`,
      idea: String.raw`Newton’s second law for each body, with equal and opposite forces (third law, 1.7), gives $m_1\ddot{\mathbf r}_1 = -\mathbf F$ and $m_2\ddot{\mathbf r}_2 = \mathbf F$. Adding them kills the internal force, so the centre of mass moves uniformly (2.4); dividing each by its mass and subtracting gives $\ddot{\mathbf r} = (1/m_1 + 1/m_2)\mathbf F = \mathbf F/\mu$. The two bodies trace copies of the relative orbit scaled by $m_2/M$ and $m_1/M$ about the centre of mass, on opposite sides of it. Treating the heavier body as fixed amounts to replacing $\mu$ by the lighter mass — good only when $m_2 \ll m_1$.`,
      caption: String.raw`A binary star with the total mass and orbit of Sirius A and B (AU, years). The mass-ratio slider redistributes the same total mass: on the left the two stars swap who moves more around the green centre of mass, while on the right the separation $\mathbf r_2 - \mathbf r_1$ traces one fixed ellipse, exactly matched by a single body in the field $-GM\mathbf r/r^3$ (dots). Switch the model to “heavier star fixed” and the dots drift away, worst for equal masses. Toggle the drift to see the wavy paths by which Bessel inferred the unseen Sirius B in 1844.`,
      deps: ['mech-2.4', 'mech-1.7'],
      refs: ['Taylor §8.2', 'Goldstein §3.1'],
      tags: ['two-body problem', 'reduced mass', 'centre of mass'],
      credit: 'Newton, 1687',
      viz(v) {
        const C = v.M.CONST, GM1 = (C.G * C.Msun * C.yr ** 2) / C.au ** 3; // G in AU³/(M☉·yr²)
        const Mtot = 2.063 + 1.018, a = 19.8, e = 0.592;
        const q = v.slider('mass ratio $m_2/m_1$', 0.02, 1, 1.018 / 2.063, { step: 0.005 });
        const model = v.select('one-body model', [{ value: 'mu', label: 'reduced mass $\\mu$' }, { value: 'fixed', label: 'heavier star fixed' }], 'mu');
        const drift = v.toggle('centre of mass drifts', false);
        const s = v.stage({ x: [-22, 22], y: [-17, 17], equal: true, axes: false, height: 330, title: 'both stars (lab frame)' });
        const sr = v.stage({ x: [-34, 10.5], y: [-18.5, 17.5], equal: true, axes: false, height: 330, title: 'separation $\\mathbf r = \\mathbf r_2 - \\mathbf r_1$, star 1 at the origin' });
        const cache = memo(); let cur = null;
        const P0 = TAU * Math.sqrt(a ** 3 / (GM1 * Mtot)), Tsim = 2 * P0, N = 6000, dt = Tsim / N;
        const run = () => cache([q.value, model.value, drift.value].join('|'), () => {
          const m1 = Mtot / (1 + q.value), m2 = Mtot - m1, mu = (m1 * m2) / Mtot;
          const r0 = [-a * (1 + e), 0], v0 = [0, -Math.sqrt((GM1 * Mtot * (1 - e)) / (a * (1 + e)))];
          const V = drift.value ? [0.36, 0.1] : [0, 0], R0 = [0, 0];
          const s0 = [R0[0] - (m2 / Mtot) * r0[0], R0[1] - (m2 / Mtot) * r0[1], R0[0] + (m1 / Mtot) * r0[0], R0[1] + (m1 / Mtot) * r0[1], V[0] - (m2 / Mtot) * v0[0], V[1] - (m2 / Mtot) * v0[1], V[0] + (m1 / Mtot) * v0[0], V[1] + (m1 / Mtot) * v0[1]];
          const f2 = (S) => { const dx = S[2] - S[0], dy = S[3] - S[1], d3 = Math.hypot(dx, dy) ** 3, k = GM1 / d3; return [S[4], S[5], S[6], S[7], k * m2 * dx, k * m2 * dy, -k * m1 * dx, -k * m1 * dy]; };
          const Mm = model.value === 'mu' ? Mtot : m1;
          const f1 = (S) => { const d3 = Math.hypot(S[0], S[1]) ** 3, k = -GM1 * Mm / d3; return [S[2], S[3], k * S[0], k * S[1]]; };
          let S2 = s0, S1 = [r0[0], r0[1], v0[0], v0[1]];
          const two = [S2], one = [S1]; let dev = 0, dV = 0, Tm = NaN, th0 = Math.atan2(r0[1], r0[0]), turn = 0, thp = th0;
          for (let k = 1; k <= N; k++) {
            S2 = rk4(f2, S2, dt); S1 = rk4(f1, S1, dt); two.push(S2); one.push(S1);
            dev = Math.max(dev, Math.hypot(S2[2] - S2[0] - S1[0], S2[3] - S2[1] - S1[1]));
            const Vx = (m1 * S2[4] + m2 * S2[6]) / Mtot, Vy = (m1 * S2[5] + m2 * S2[7]) / Mtot; dV = Math.max(dV, Math.hypot(Vx - V[0], Vy - V[1]));
            const th = Math.atan2(S2[3] - S2[1], S2[2] - S2[0]); let d = th - thp; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU;
            if (isNaN(Tm) && Math.abs(turn + d) >= TAU) Tm = (k - 1 + (TAU - Math.abs(turn)) / Math.abs(d)) * dt;
            turn += d; thp = th;
          }
          // view for the lab panel
          let xs = [], ys = []; for (const S of two) { xs.push(S[0], S[2]); ys.push(S[1], S[3]); }
          return { m1, m2, mu, two, one, dev, dV, Tm, xr: span([xs], 0.06, 10), yr: span([ys], 0.08, 10), Mm };
        });
        v.animate((t) => {
          const R = run(), k = Math.min(N, Math.round(((t * P0) / 7 / dt) % (N + 1)));
          const S = R.two[k], m1 = R.m1, m2 = R.m2;
          // lab panel
          s.setView(R.xr, R.yr);
          s.path(R.two.map((Q) => [Q[0], Q[1]]), { color: 'blue', width: 1.2, alpha: 0.45 });
          s.path(R.two.map((Q) => [Q[2], Q[3]]), { color: 'orange', width: 1.2, alpha: 0.45 });
          const cm = R.two.map((Q) => [(m1 * Q[0] + m2 * Q[2]) / Mtot, (m1 * Q[1] + m2 * Q[3]) / Mtot]);
          s.path(cm, { color: 'green', width: 1.6, dash: [5, 4] });
          const X = (m1 * S[0] + m2 * S[2]) / Mtot, Y = (m1 * S[1] + m2 * S[3]) / Mtot;
          s.line(S[0], S[1], S[2], S[3], { color: 'faint', width: 1 });
          s.dot(S[0], S[1], { r: 4 + 5 * Math.cbrt(m1 / Mtot), color: 'blue' });
          s.dot(S[2], S[3], { r: 4 + 5 * Math.cbrt(m2 / Mtot), color: 'orange' });
          s.dot(X, Y, { r: 4.5, color: 'green', label: 'CM', labelPos: 'se' });
          s.text(`m₁ = ${v.fix(m1, 2)} M☉`, S[0], S[1], { color: 'blue', size: 11, dy: -16, align: 'center' });
          s.text(`m₂ = ${v.fix(m2, 2)} M☉`, S[2], S[3], { color: 'orange', size: 11, dy: 16, align: 'center' });
          // relative panel
          sr.path(R.two.map((Q) => [Q[2] - Q[0], Q[3] - Q[1]]), { color: 'purple', width: 2.4 });
          const good = model.value === 'mu';
          const step = 100; for (let j = 0; j <= k; j += step) { const O = R.one[j]; sr.dot(O[0], O[1], { r: 3.2, color: good ? 'green' : 'red', ring: false }); }
          if (!good) sr.path(R.one.slice(0, k + 1).map((O) => [O[0], O[1]]), { color: 'red', width: 1.3, dash: [4, 3] });
          sr.dot(0, 0, { r: 4 + 5 * Math.cbrt(m1 / Mtot), color: 'blue' });
          sr.dot(S[2] - S[0], S[3] - S[1], { r: 6, color: 'orange' });
          const O = R.one[k]; sr.dot(O[0], O[1], { r: 4, color: good ? 'green' : 'red', hollow: true, width: 2 });
          sr.corner(good ? 'one body of mass μ in the field −GM r/r³' : 'star 1 held fixed: field −Gm₁ r/r³', 'bl', { color: good ? 'green' : 'red', weight: 600 });
          cur = { R, k };
        }, { period: 14, still: 2.2 });
        v.legend([['blue', 'star 1'], ['orange', 'star 2'], ['green', 'centre of mass', { dash: true }], ['purple', 'separation $\\mathbf r_2-\\mathbf r_1$'], ['green', 'one-body model', { dot: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { R, k } = cur, err = Math.hypot(R.two[k][2] - R.two[k][0] - R.one[k][0], R.two[k][3] - R.two[k][1] - R.one[k][1]);
          const head = String.raw`$\mu = m_1m_2/(m_1+m_2) = ${v.fix(R.mu, 3)}\,M_\odot$ · centre-of-mass velocity changed by $${sci(v, R.dV)}$ AU/yr`;
          if (model.value === 'mu') return head + String.raw` · relative orbit: period ${v.fix(R.Tm, 2)} yr measured, $2\pi\sqrt{a^3/GM} = ${v.fix(P0, 2)}$ yr for every mass ratio · $\max|\mathbf r_2 - \mathbf r_1 - \mathbf r_{\rm model}| = ${sci(v, R.dev)}$ AU`;
          return head + String.raw` · with star 1 fixed the model feels only $Gm_1 = ${v.fix(R.Mm / Mtot, 3)}\,GM$: separation error now ${v.fix(err, 2)} AU, up to ${v.fix(R.dev, 2)} AU in two orbits — use $\mu$, or $M = m_1 + m_2$ in the field`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.3
    {
      num: '8.3',
      kind: 'Theorem',
      name: 'Reduction to one-dimensional radial motion',
      statement: String.raw`For a particle of mass $\mu$ in a central potential $U(r)$, the motion stays in the plane through the centre perpendicular to the angular momentum, and in polar coordinates $\ell = \mu r^2\dot\phi$ is constant. The radial coordinate then obeys a one-dimensional equation of motion
$$\mu\ddot r = -\frac{d U_{\rm eff}}{dr},\qquad U_{\rm eff}(r) = U(r) + \frac{\ell^2}{2\mu r^2},\qquad E = \tfrac12\mu\dot r^2 + U_{\rm eff}(r),$$
so the radial motion is that of a particle on a line in the **effective potential** $U_{\rm eff}$: it moves only where $U_{\rm eff}(r)\le E$ and turns at the roots of $U_{\rm eff}(r) = E$ (the apsides $r_{\min}, r_{\max}$). Once $r(t)$ is known, the angle follows from $\dot\phi = \ell/\mu r^2$. The term $\ell^2/2\mu r^2$ is the centrifugal barrier: for $\ell \ne 0$ it keeps the particle off the centre unless $U$ falls faster than $-1/r^2$.`,
      idea: String.raw`Angular momentum is conserved for a central force (2.10), so $\phi$ is a cyclic coordinate of $L = \tfrac12\mu(\dot r^2 + r^2\dot\phi^2) - U(r)$ and can be eliminated (7.12): substituting $\dot\phi = \ell/\mu r^2$ into the radial Lagrange equation $\mu\ddot r = \mu r\dot\phi^2 - U'(r)$ gives $\mu\ddot r = \ell^2/\mu r^3 - U'(r) = -U_{\rm eff}'(r)$. The centrifugal term is not a new force: it is the part of the kinetic energy carried by the angular motion, rewritten as a function of $r$ at fixed $\ell$. Energy conservation of the one-dimensional problem then gives the turning points exactly as in an energy diagram (3.10).`,
      caption: String.raw`Drag the gold handle on the energy diagram: its height is the energy, its position the starting radius; the slider sets $\ell$. The particle moves in the plane (left) while its radius bounces between the turning points (dashed circles) like a ball rolling in $U_{\rm eff}$ (right). Bottom: $r(t)$ from the full planar simulation (blue) and from integrating only the one-dimensional equation $\mu\ddot r = -U_{\rm eff}'$ (orange dots) — they coincide. With the strong core, raise the energy over the centrifugal hump and the particle falls into the centre.`,
      deps: ['mech-8.2', 'mech-2.10', 'mech-7.12'],
      refs: ['Taylor §8.4', 'Goldstein §3.3'],
      tags: ['effective potential', 'central force', 'angular momentum'],
      viz(v) {
        const POT = {
          kepler: { label: '$U = -k/r$', U: (r) => -1 / r, dU: (r) => 1 / (r * r), rr: [0.15, 5], T: 40 },
          spring: { label: '$U = \\tfrac12 kr^2$', U: (r) => 0.5 * r * r, dU: (r) => r, rr: [0.1, 2.6], T: 16 },
          core: { label: 'strong core $-k/r - c/r^3$', U: (r) => -1 / r - 0.06 / r ** 3, dU: (r) => 1 / (r * r) + 0.18 / r ** 4, rr: [0.12, 4], T: 40 },
        };
        let H = null;
        const pot = v.select('potential', Object.entries(POT).map(([value, p]) => ({ value, label: p.label })), 'kepler', {
          onChange: (p) => { const ic = { kepler: [2.2, -0.32], spring: [1.6, 1.45], core: [2.2, -0.3] }[p]; H.set(ic[0], ic[1]); },
        });
        const ell = v.slider('angular momentum $\\ell$', 0.4, 1.5, 1, { step: 0.01 });
        const so = v.stage({ x: [-4.2, 4.2], y: [-4.2, 4.2], equal: true, axes: false, height: 320, title: 'the orbit' });
        const se = v.stage({ x: [0, 5], y: [-1, 1], axes: 'box', height: 320, xlabel: 'r', title: 'effective potential $U_{\\rm eff} = U + \\ell^2/2\\mu r^2$' });
        const st = v.stage({ x: [0, 40], y: [0, 5], axes: 'box', height: 170, full: true, xlabel: 't', title: '$r(t)$: planar simulation vs the one-dimensional equation' });
        H = se.handle(2.2, -0.32, { color: 'gold', label: 'E', labelPos: 'ne' });
        const Ueff = (P, l, r) => P.U(r) + (l * l) / (2 * r * r);
        const view = (P, l) => {
          const ys = []; for (let i = 0; i <= 300; i++) ys.push(Ueff(P, l, P.rr[0] + ((P.rr[1] - P.rr[0]) * i) / 300));
          if (pot.value === 'spring') { const m = Math.min(...ys); return [m - 0.25 * l - 0.2, m + 2.2]; }
          if (pot.value === 'kepler') { const m = Math.min(...ys); return [m - 0.25, Math.max(0.5, m + 1.1)]; }
          const ih = ys.indexOf(Math.max(...ys)), well = Math.min(...ys.slice(ih)), top = Math.min(ys[ih], 1.2); // the hump and the well beyond it
          return [well - 0.25, Math.max(top + 0.25, 0.5)];
        };
        const cache = memo(); let cur = null;
        const run = () => {
          const P = POT[pot.value], l = ell.value, yr = view(P, l);
          // keep the handle legal: inside the window and on or above U_eff
          let r0 = clamp(H.x, P.rr[0] + 0.05, P.rr[1] - 0.05), E = clamp(H.y, yr[0], yr[1]);
          const Umin = Ueff(P, l, r0); if (E < Umin + 1e-6) E = Umin + 1e-6;
          if (r0 !== H.x || E !== H.y) { H.x = r0; H.y = E; }
          return cache([pot.value, l, r0, E].join('|'), () => {
            const T = P.T, n = 8000, dt = T / n, rd0 = -Math.sqrt(Math.max(0, 2 * (E - Ueff(P, l, r0))));
            const f2 = (S) => { const r = Math.hypot(S[0], S[1]), a = -P.dU(r) / r; return [S[2], S[3], a * S[0], a * S[1]]; };
            const f1 = (S) => [S[1], -P.dU(S[0]) + (l * l) / S[0] ** 3];
            let S2 = [r0, 0, rd0, l / r0], S1 = [r0, rd0];
            const tt = [0], r2 = [r0], r1 = [r0], xy = [[r0, 0]]; let dev = 0, end = 'time', L0 = l, dL = 0;
            for (let k = 1; k <= n; k++) {
              S2 = rk4(f2, S2, dt); S1 = rk4(f1, S1, dt);
              const rr = Math.hypot(S2[0], S2[1]);
              tt.push(k * dt); r2.push(rr); r1.push(S1[0]); xy.push([S2[0], S2[1]]);
              dev = Math.max(dev, Math.abs(rr - S1[0])); dL = Math.max(dL, Math.abs(S2[0] * S2[3] - S2[1] * S2[2] - L0));
              if (rr < 0.07) { end = 'centre'; break; }
              if (rr > 30) { end = 'escape'; break; }
            }
            const tp = roots((r) => Ueff(P, l, r) - E, 0.03, 40, 2000);
            let rmin = tp.filter((r) => r <= r0 + 1e-9).pop(), rmax = tp.find((r) => r >= r0 - 1e-9);
            if (end === 'centre') rmin = 0;
            let lo = Infinity, hi = -Infinity; for (const r of r2) { lo = Math.min(lo, r); hi = Math.max(hi, r); }
            return { P, l, E, r0, tt, r2, r1, xy, dev, dL, end, rmin, rmax, lo, hi, yr, dt, T };
          });
        };
        v.animate((t) => {
          const R = run(), n = R.tt.length - 1, simT = (t * R.T) / 12, k = Math.min(n, Math.round(simT / R.dt));
          const P = R.P, l = R.l;
          // orbit
          const lim = clamp(1.12 * Math.min(R.hi, 6), 1.3, 6.2); so.setView([-lim, lim], [-lim, lim]);
          if (R.rmax && R.rmax < 6) so.circle(0, 0, R.rmax, { color: 'muted', dash: [4, 4], width: 1.2 });
          if (R.rmin > 0) so.circle(0, 0, R.rmin, { color: 'muted', dash: [4, 4], width: 1.2 });
          if (R.rmax && R.rmin > 0 && R.rmax < 6) so.rings([conicPts(R.rmax, 0, 0, 1e9, 120), conicPts(R.rmin, 0, 0, 1e9, 120)], { fill: 'green', fillAlpha: 0.07, stroke: false, evenodd: true });
          so.path(R.xy, { color: 'blue', width: 1, alpha: 0.35 });
          so.path(R.xy.slice(0, k + 1), { color: 'blue', width: 2 });
          sun(so, 0, 0, { r: 0.1, color: 'ink' });
          const p = R.xy[k];
          so.line(0, 0, p[0], p[1], { color: 'gold', width: 1.5 });
          so.dot(p[0], p[1], { r: 6, color: 'gold' });
          if (R.end === 'centre' && k === n) so.corner('fell into the centre', 'tl', { color: 'red', weight: 600 });
          // effective potential
          se.setView(P.rr, R.yr);
          if (R.rmin != null && R.rmax != null) se.between(() => R.E, (r) => Math.min(R.E, Ueff(P, l, r)), Math.max(R.rmin, P.rr[0]), Math.min(R.rmax, P.rr[1]), { fill: 'green', fillAlpha: 0.12 });
          se.fn(P.U, { color: 'muted', width: 1.5, dash: [6, 4] });
          se.fn((r) => (l * l) / (2 * r * r), { color: 'purple', width: 1.5, dash: [2, 3] });
          se.fn((r) => Ueff(P, l, r), { color: 'ink', width: 2.6 });
          se.hline(R.E, { color: 'gold', width: 1.6 });
          for (const r of [R.rmin, R.rmax]) if (r > 0 && r < P.rr[1]) se.dot(r, R.E, { r: 4, color: 'red' });
          const rk = R.r2[k];
          se.line(rk, Ueff(P, l, rk), rk, R.E, { color: 'green', width: 4, alpha: 0.7 });
          se.dot(rk, Ueff(P, l, rk), { r: 6.5, color: 'gold' });
          // r(t)
          st.setView([0, R.T], [0, Math.min(Math.max(R.hi * 1.15, 1), 8)]);
          if (R.rmax && R.rmax < 8) st.hline(R.rmax, { color: 'red', dash: [4, 4], width: 1 });
          if (R.rmin > 0) st.hline(R.rmin, { color: 'red', dash: [4, 4], width: 1 });
          st.path(R.tt.map((tt, i) => [tt, R.r2[i]]), { color: 'blue', width: 2.4 });
          const pts = []; for (let i = 0; i < R.tt.length; i += 120) pts.push([R.tt[i], R.r1[i]]);
          st.dots(pts, { r: 3, color: 'orange' });
          st.vline(R.tt[k], { color: 'gold', width: 1.2 });
          cur = { R, k };
        }, { period: 12, still: 4.3 });
        v.legend([['ink', '$U_{\\rm eff}$'], ['muted', '$U(r)$', { dash: true }], ['purple', 'centrifugal $\\ell^2/2\\mu r^2$', { dash: true }], ['gold', 'energy $E$'], ['blue', 'planar simulation'], ['orange', '1D equation', { dot: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { R } = cur;
          const tp = R.end === 'centre' ? 'no inner turning point: $E$ is above the centrifugal hump' : String.raw`turning points from $U_{\rm eff}(r) = E$: $r_{\min} = ${v.fix(R.rmin, 4)}$` + (R.rmax && R.end !== 'escape' ? String.raw`, $r_{\max} = ${v.fix(R.rmax, 4)}$; measured range of $r(t)$: $[${v.fix(R.lo, 4)},\ ${v.fix(R.hi, 4)}]$` : ', no outer one (unbound)');
          return String.raw`$E = ${v.fix(R.E, 3)}$, $\ell = ${v.fix(R.l, 2)}$ ($\mu = k = 1$) · ${tp} · $\max|r_{\rm 2D} - r_{\rm 1D}| = ${sci(v, R.dev)}$ · $\ell$ conserved to $${sci(v, R.dL)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.4
    {
      num: '8.4',
      kind: 'Definition',
      name: 'Bound and unbound orbits',
      statement: String.raw`An orbit in a central potential that vanishes at infinity is **bound** if $r(t)$ stays bounded for all time and **unbound** if the particle escapes to infinity. Because $E = \tfrac12\mu\dot r^2 + U_{\rm eff}(r)$ with $U_{\rm eff}\to 0$ at large $r$, an orbit with $E < 0$ is confined to the bounded region $U_{\rm eff}\le E$ and oscillates between two apsides, while one with $E > 0$ (or $E = 0$, reaching infinity with zero speed) is unbound. For the attractive inverse-square law $U = -k/r$ at fixed angular momentum $\ell$ the energy sorts the orbits into conics with eccentricity $e = \sqrt{1 + 2E\ell^2/\mu k^2}$:
- $E = -\mu k^2/2\ell^2$ (bottom of the well): a circle, $e = 0$;
- $E < 0$: an ellipse, $0 < e < 1$;
- $E = 0$: a parabola, $e = 1$;
- $E > 0$: a hyperbola, $e > 1$, leaving with speed $v_\infty = \sqrt{2E/\mu}$.`,
      idea: String.raw`The reduction to radial motion (8.3) turns the question into a one-dimensional energy diagram (3.10): for $E<0$ the horizontal line $E$ meets $U_{\rm eff} = -k/r + \ell^2/2\mu r^2$ twice, trapping $r$ between the turning points; for $E\ge 0$ it meets it only once, so $r$ can grow without bound. For the inverse-square law the turning points are $r = p/(1\pm e)$ with $p = \ell^2/\mu k$; as $E\to 0^-$ the outer one runs off to infinity and the ellipse opens into a parabola. All orbits with the same $\ell$ share the semi-latus rectum $p$: they cross the line through the force centre perpendicular to the apse line at the same two points.`,
      caption: String.raw`Drag the energy handle up the effective-potential well (bottom panel; $\mu = k = \ell = 1$). The orbit above is simulated, with the predicted conic dashed on top and dots every 0.5 time units. At the bottom of the well the orbit is a circle; below zero, ellipses; it snaps to a parabola at $E = 0$, and above zero hyperbolas fly off. The faint family shows other energies with the same $\ell$ — every one passes through the two latus-rectum points.`,
      deps: ['mech-8.3', 'mech-3.10'],
      refs: ['Goldstein §3.3', 'Taylor §8.4'],
      tags: ['effective potential', 'conic sections', 'energy'],
      viz(v) {
        const so = v.stage({ x: [-9.4, 3.2], y: [-2.4, 2.4], equal: true, axes: false, height: 320, full: true, title: 'orbits with angular momentum $\\ell = 1$ (force centre at the focus)' });
        const se = v.stage({ x: [0, 8], y: [-0.62, 0.62], axes: 'box', height: 210, full: true, xlabel: 'r', title: 'effective potential $U_{\\rm eff} = -1/r + 1/2r^2$ — drag the energy' });
        const snap = (E) => (Math.abs(E + 0.5) < 0.015 ? -0.5 : Math.abs(E) < 0.012 ? 0 : E);
        const H = se.handle(7.3, -0.22, { color: 'gold', label: 'E', labelPos: 'w', constrain: (x, y) => [7.3, snap(clamp(y, -0.5, 0.58))] });
        const kind = (E) => (E <= -0.5 + 1e-9 ? 'circle' : E < -1e-9 ? 'ellipse' : E <= 1e-9 ? 'parabola' : 'hyperbola');
        const COL = { circle: 'green', ellipse: 'blue', parabola: 'gold', hyperbola: 'red' };
        const Ueff = (r) => -1 / r + 1 / (2 * r * r);
        const fam = [-0.46, -0.38, -0.27, -0.14, 0, 0.18, 0.45];
        const cache = memo(); let cur = null;
        const run = () => cache(H.y, () => {
          const E = H.y, e = Math.sqrt(Math.max(0, 1 + 2 * E)), rp = 1 / (1 + e), vp = 1 / rp; // ℓ = 1: v_p = ℓ/r_p
          const acc = (r) => -1 / (r * r);
          const lim = { T: 60, eta: 0.004, rmax: 14 };
          const F = centralOrbit(acc, [rp, 0, 0, vp], { ...lim, revs: 1.02 }), B = E < 0 ? null : centralOrbit(acc, [rp, 0, 0, vp], { ...lim, T: -60 });
          const pts = (B ? B.s.slice().reverse() : []).concat(F.s).map((S) => [S[0], S[1]]);
          const ticks = []; for (const R of B ? [F, B] : [F]) { let next = 0; R.t.forEach((t, i) => { if (Math.abs(t) >= next) { ticks.push([R.s[i][0], R.s[i][1]]); next += 0.5; } }); }
          const last = F.s[F.s.length - 1], el = kepEl(1, ...last);
          let rlo = Infinity, rhi = 0; for (const p of pts) { const r = Math.hypot(p[0], p[1]); rlo = Math.min(rlo, r); rhi = Math.max(rhi, r); }
          return { E, e, rp, pts, ticks, el, rlo, rhi, k: kind(E), esc: F.stop === 'escape' };
        });
        v.render(() => {
          const R = run(), col = COL[R.k];
          // family of conics with p = 1
          for (const E of fam) { const e = Math.sqrt(Math.max(0, 1 + 2 * E)); so.path(conicPts(1, e, 0, 16), { color: COL[kind(E)], width: 1, alpha: 0.3 }); }
          so.line(0, -4, 0, 4, { color: 'faint', dash: [3, 4], width: 1 });
          so.line(-12, 0, 5, 0, { color: 'faint', width: 1 });
          so.dot(0, 1, { r: 3.5, color: 'ink' }); so.dot(0, -1, { r: 3.5, color: 'ink' });
          so.text('latus rectum: r = p = ℓ²/μk', 0.12, 1.12, { color: 'muted', size: 11 });
          so.path(R.pts, { color: col, width: 3 });
          so.path(conicPts(1, R.e, 0, 16), { color: 'ink', width: 1.2, dash: [5, 4] });
          so.dots(R.ticks, { r: 2.3, color: 'ink' });
          if (R.k === 'ellipse' || R.k === 'circle') { const a = -1 / (2 * R.E); so.dot(-2 * a * R.e, 0, { r: 3, color: col, hollow: true, label: R.k === 'ellipse' && a * R.e < 3 ? 'empty focus' : null, labelPos: 's' }); }
          if (R.k === 'hyperbola') { const th = Math.acos(-1 / R.e); so.line(0, 0, 8 * Math.cos(th), 8 * Math.sin(th), { color: 'red', width: 1, dash: [2, 4], alpha: 0.7 }); so.line(0, 0, 8 * Math.cos(th), -8 * Math.sin(th), { color: 'red', width: 1, dash: [2, 4], alpha: 0.7 }); }
          sun(so, 0, 0, { r: 0.09 });
          so.corner(`${R.k}: e = ${v.fix(R.e, 3)}`, 'tl', { color: col, weight: 700, size: 13 });
          // effective potential strip
          se.hline(0, { color: 'muted', width: 1 });
          const tp = roots((r) => Ueff(r) - R.E, 0.2, 60, 1500);
          const r1 = tp[0] ?? 1, r2 = R.E < 0 ? tp[1] ?? 1 : 8;
          if (R.E > -0.5 + 1e-9) se.between(() => R.E, (r) => Math.min(R.E, Ueff(r)), r1, Math.min(r2, 8), { fill: col, fillAlpha: 0.14 });
          se.fn(Ueff, { color: 'ink', width: 2.4, domain: [0.45, 8] });
          se.line(0, R.E, 8, R.E, { color: col, width: 2 });
          for (const r of tp) if (r < 8) se.dot(r, R.E, { r: 4.5, color: 'red' });
          if (R.E < 0 && r2 > 8) se.text(`r_max = ${v.fix(r2, 1)} →`, 7.0, R.E, { color: 'red', size: 11, dy: 11, align: 'right' });
          se.text('E = 0', 7.9, 0, { color: 'muted', size: 11, dy: -9, align: 'right' });
          se.dot(1, -0.5, { r: 3, color: 'green' });
          cur = R;
        });
        v.legend([['green', 'circle $e=0$'], ['blue', 'ellipse $0<e<1$'], ['gold', 'parabola $e=1$'], ['red', 'hyperbola $e>1$'], ['ink', 'predicted conic', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const R = cur, a = -1 / (2 * R.E);
          let out = String.raw`$E = ${v.fix(R.E, 3)}$: predicted $e = \sqrt{1 + 2E\ell^2/\mu k^2} = ${v.fix(R.e, 4)}$, measured from the simulated end state $${v.fix(R.el.e, 4)}$ · `;
          if (R.k === 'circle') out += String.raw`circle: $r = ${v.fix(R.rlo, 4)}$ throughout (predicted $\ell^2/\mu k = 1$)`;
          else if (R.k === 'ellipse') out += String.raw`bound: $r$ from $${v.fix(R.rlo, 3)}$ to $${v.fix(R.rhi, 3)}$ (predicted $p/(1\pm e)$ = $${v.fix(1 / (1 + R.e), 3)}$, $${v.fix(1 / (1 - R.e), 3)}$), $a = -k/2E = ${v.fix(a, 3)}$`;
          else if (R.k === 'parabola') out += 'marginal: reaches infinity with zero speed (escape speed at every radius)';
          else out += String.raw`unbound: leaves with $v_\infty = \sqrt{2E/\mu} = ${v.fix(Math.sqrt(2 * R.E), 3)}$, measured $${v.fix(Math.sqrt(2 * R.el.E), 3)}$; asymptotes at $\pm${v.fix((Math.acos(-1 / R.e) * 180) / Math.PI, 1)}°$ from perihelion`;
          return out + String.raw` · perihelion $r_p = p/(1+e) = ${v.fix(R.rp, 4)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.5
    {
      num: '8.5',
      kind: 'Theorem',
      name: 'Kepler’s second law',
      statement: String.raw`For a particle moving under any **central** force, the line from the force centre to the particle sweeps out equal areas in equal times:
$$\frac{dA}{dt} = \frac{\ell}{2\mu} = \text{const},$$
where $\ell$ is the angular momentum about the centre. In particular a planet moves fastest at perihelion and slowest at aphelion, and its period is $T = 2\pi ab\mu/\ell$ for an ellipse of semi-axes $a, b$. The law holds only for areas measured from the force centre, and fails as soon as the force has a component perpendicular to the radius (a drag, a thrust, a second attracting centre).`,
      idea: String.raw`In time $dt$ the radius vector sweeps the thin triangle with sides $\mathbf r$ and $\dot{\mathbf r}\,dt$, of area $\tfrac12|\mathbf r\times\dot{\mathbf r}|\,dt = (\ell/2\mu)\,dt$. A central force exerts no torque about its centre, so $\ell$ is constant (2.10) and so is the areal velocity. Newton’s geometric proof (Principia I, Prop. 1) does the same with impulses: a kick toward the centre changes the velocity but not the area of the next triangle, because triangles with the same base and the same height have equal areas. Measured from any other point the swept area picks up a term $\tfrac12(\mathbf r - \mathbf q)\times\dot{\mathbf r}$ whose rate is not constant.`,
      caption: String.raw`Press play: in each of $N$ equal time slices the radius sweeps a coloured sector, and the bars on the right show their areas (computed from the simulated path) against the expected $\pi ab/N$. Long thin sectors near aphelion and short fat ones near perihelion have the same area. Drag the purple point to measure areas from somewhere else (it snaps back onto the force centre): the bars become unequal. The linear spring also keeps them equal; adding drag (not central) makes them shrink slice by slice.`,
      deps: ['mech-2.10', 'mech-8.2'],
      refs: ['Taylor §8.3', 'Goldstein §3.2'],
      tags: ['Kepler', 'angular momentum', 'area'],
      credit: 'Kepler, 1609; proved by Newton, 1687',
      scope: String.raw`Any central force, measured from its centre; not for non-central forces or areas measured from another point.`,
      viz(v) {
        const force = v.select('force', [{ value: 'inv2', label: 'inverse-square' }, { value: 'spring', label: 'linear spring' }, { value: 'drag', label: 'inverse-square + drag' }], 'inv2');
        const ecc = v.slider('eccentricity $e$', 0, 0.85, 0.6, { step: 0.01 });
        const Ns = v.slider('time slices $N$', 6, 16, 10, { int: true });
        const s = v.stage({ x: [-2.25, 0.85], y: [-1.15, 1.15], equal: true, axes: false, height: 330, weight: 1.45 });
        const b = v.stage({ x: [-0.6, 10.6], y: [0, 1], axes: 'box', height: 330, xlabel: 'slice', title: 'swept area per slice' });
        const Q = s.handle(0, 0, { color: 'purple', r: 6, labelPos: 's', constrain: (x, y) => (Math.hypot(x, y) < 0.07 ? [0, 0] : [x, y]) });
        const COLS = ['blue', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red'];
        const cache = memo(); let cur = null;
        const run = () => cache([force.value, ecc.value, Ns.value].join('|'), () => {
          const e = ecc.value, N = Ns.value, sub = 360;
          let s0, f, T, view;
          if (force.value === 'spring') {
            const A = 1, B = Math.sqrt(1 - e * e); s0 = [A, 0, 0, B]; T = TAU; f = (S) => [S[2], S[3], -S[0], -S[1]];
            view = [[-1.75, 1.75], [-1.15, 1.15]];
          } else {
            const rp = 1 - e; s0 = [rp, 0, 0, Math.sqrt((1 + e) / (1 - e))]; T = TAU;
            const g = force.value === 'drag' ? 0.02 : 0;
            f = (S) => { const r = Math.hypot(S[0], S[1]), k = -1 / (r * r * r); return [S[2], S[3], k * S[0] - g * S[2], k * S[1] - g * S[3]]; };
            view = [[-2.05 + 0.25 * (0.6 - e), 0.55], [-1.05, 1.05]];
          }
          const dt = T / (N * sub), path = [s0];
          let S = s0; for (let k = 0; k < N * sub; k++) { S = rk4(f, S, dt); path.push(S); }
          const ab = force.value === 'spring' ? Math.PI * Math.sqrt(1 - e * e) : Math.PI * Math.sqrt(1 - e * e);
          return { e, N, sub, T, path, view, ab };
        });
        v.animate((t) => {
          const R = run(), N = R.N, frac = (t % 9) / 7.5, upto = Math.min(R.path.length - 1, Math.floor(frac * (R.path.length - 1)));
          s.setView(R.view[0], R.view[1]);
          const qx = Q.x, qy = Q.y, areas = [];
          for (let j = 0; j < N; j++) {
            const i0 = j * R.sub, i1 = (j + 1) * R.sub;
            let A = 0; for (let i = i0; i < i1; i++) { const p = R.path[i], q = R.path[i + 1]; A += 0.5 * ((p[0] - qx) * (q[1] - qy) - (q[0] - qx) * (p[1] - qy)); }
            areas.push(A);
            if (i0 <= upto) {
              const pts = [[qx, qy]]; for (let i = i0; i <= Math.min(i1, upto); i += 4) pts.push([R.path[i][0], R.path[i][1]]);
              pts.push([R.path[Math.min(i1, upto)][0], R.path[Math.min(i1, upto)][1]]);
              s.poly(pts, { fill: COLS[j % COLS.length], fillAlpha: 0.32, color: COLS[j % COLS.length], width: 1 });
            }
          }
          s.path(R.path.map((S) => [S[0], S[1]]), { color: 'ink', width: 1.6 });
          sun(s, 0, 0, { r: 0.045, label: 'force centre', dy: 17 });
          const P = R.path[upto];
          s.dot(P[0], P[1], { r: 6, color: 'gold' });
          s.line(qx, qy, P[0], P[1], { color: 'gold', width: 1.4 });
          const moved = Math.hypot(qx, qy) > 1e-9;
          Q.label = moved ? 'area origin' : null;
          s.corner(moved ? 'areas measured from another point' : force.value === 'drag' ? 'force not central' : 'central force, areas from its centre', 'tl', { color: moved || force.value === 'drag' ? 'red' : 'green', weight: 600 });
          // bars
          const mean = R.ab / N, done = Math.min(N, Math.floor(upto / R.sub));
          b.setView([-0.7, N + 0.6], [0, 1.6 * mean]);
          b.setTicks(Array.from({ length: N }, (_, i) => i + 1), null);
          b.hline(mean, { color: 'green', dash: [5, 4], width: 1.5 });
          b.bars(areas.slice(0, Math.max(done, 0)), { color: (val, i) => COLS[i % COLS.length] });
          b.text('πab/N', N + 0.5, mean, { color: 'green', size: 11, align: 'right', dy: -9 });
          cur = { R, areas, done, mean, moved };
        }, { period: 9, still: 8.5 });
        v.readout(() => {
          if (!cur) return '';
          const { R, areas, done, mean, moved } = cur;
          if (done < 2) return String.raw`sweeping: each slice lasts $\Delta t = T/${R.N}$; expected area per slice $\pi ab/N = ${v.fix(mean, 5)}$` + (done === 1 ? String.raw`, first slice measured $${v.fix(areas[0], 5)}$` : '');
          const A = areas.slice(0, done), lo = Math.min(...A), hi = Math.max(...A), avg = A.reduce((x, y) => x + y, 0) / A.length;
          const ok = (hi - lo) / avg < 1e-4;
          let out = String.raw`${done} slices of $\Delta t = T/${R.N}$: areas from $${v.fix(lo, 5)}$ to $${v.fix(hi, 5)}$ (spread $${sci(v, (hi - lo) / avg)}$ of the mean) — ${ok ? '**equal**' : '**not equal**'}`;
          if (!moved && force.value !== 'drag') out += String.raw` · expected $\ell\,\Delta t/2\mu = \pi ab/N = ${v.fix(mean, 5)}$`;
          if (force.value === 'drag' && !moved) out += String.raw` · drag exerts a torque, so $\ell$ and the areas decay by the factor $${v.fix(A[A.length - 1] / A[0], 3)}$ over the run`;
          if (moved) out += ' · from this point the force is not central, so the areal velocity is not constant';
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.6
    {
      num: '8.6',
      kind: 'Theorem',
      name: 'The orbit equation (Binet’s equation)',
      statement: String.raw`Let a particle of mass $\mu$ move under a central force with radial component $F(r)$ (negative when attractive) and angular momentum $\ell \ne 0$. Then $u = 1/r$, regarded as a function of the polar angle $\phi$, satisfies the linear-looking second-order equation
$$\frac{d^2u}{d\phi^2} + u = -\frac{\mu}{\ell^2 u^2}\,F\!\left(\frac1u\right),$$
with initial data $u = 1/r_0$, $du/d\phi = -\mu\dot r_0/\ell$. Its solution gives the shape of the orbit $r(\phi)$ without reference to time. Conversely, a known orbit $r(\phi)$ determines the force law: $F = -(\ell^2u^2/\mu)(u'' + u)$. For $F = -k/r^2$ the right-hand side is the constant $\mu k/\ell^2$, so $u$ is a shifted sinusoid of period $2\pi$; a circle through the centre forces $F\propto -1/r^5$.`,
      idea: String.raw`Angular momentum conservation, $\dot\phi = \ell/\mu r^2 = \ell u^2/\mu$ (2.10, 8.3), lets us trade time derivatives for angle derivatives: $\dot r = -\dot u/u^2 = -(\ell/\mu)\,du/d\phi$ and $\ddot r = -(\ell^2u^2/\mu^2)\,d^2u/d\phi^2$. Substituting into the radial equation $\mu(\ddot r - r\dot\phi^2) = F$ gives Binet’s equation. The substitution $u = 1/r$ is what makes the inverse-square case linear with constant forcing — the cleanest route to the conic orbits (8.7).`,
      caption: String.raw`Pick a force law and drag the velocity tip. The blue orbit integrates Newton’s equations in time; the orange dots integrate Binet’s equation in the angle, independently, every $0.1$ rad — they land on the blue curve. Right: $u = 1/r$ against the unwound angle from both integrations. For $1/r^2$ it is an exact shifted sinusoid of period $2\pi$; the spring gives period $\pi$; $1/r^{2.5}$ gives a sinusoid of some other period (a rosette); a strong $1/r^3$ makes $u$ run away (a Cotes spiral); and the $1/r^5$ law, launched just right, gives the circle through the centre that Binet’s formula predicts.`,
      deps: ['mech-8.3'],
      refs: ['Taylor §8.5', 'Goldstein §3.5'],
      tags: ['orbit equation', 'central force'],
      viz(v) {
        const LAWS = {
          inv2: { label: '$1/r^2$', F: (r) => -1 / (r * r), v0: [0.15, 1.2] },
          spring: { label: 'spring $r$', F: (r) => -r, v0: [0.2, 0.55] },
          inv25: { label: '$1/r^{2.5}$', F: (r) => -1 / r ** 2.5, v0: [0.1, 0.84] },
          inv3: { label: '$1/r^3$', F: (r) => -1 / r ** 3, v0: [-0.12, 0.82] },
          inv5: { label: '$1/r^5$', F: (r) => -1 / r ** 5, v0: [0, 1 / (Math.sqrt(8) * 0.5)] },
        };
        let tip = null;
        const law = v.select('force law $F(r) \\propto -$', Object.entries(LAWS).map(([value, L]) => ({ value, label: L.label })), 'inv2', { onChange: (k) => tip.set(1 + LAWS[k].v0[0], LAWS[k].v0[1]) });
        const s = v.stage({ x: [-2.6, 2.1], y: [-2.1, 2.1], equal: true, axes: false, height: 330, weight: 1.1 });
        const g = v.stage({ x: [0, 12], y: [0, 3], axes: 'box', height: 330, xlabel: 'angle φ (rad, unwound)', title: '$u = 1/r$ against the angle' });
        tip = s.handle(1.15, 1.2, { color: 'accent', label: 'v₀', labelPos: 'ne', constrain: { x: [0.2, 2], y: [-1.6, 1.8] } });
        const cache = memo(); let cur = null;
        const run = () => cache([law.value, tip.x, tip.y].join('|'), () => {
          const L = LAWS[law.value], r0 = 1, vx = tip.x - 1, vy = tip.y, h = r0 * vy; // start at (1, 0)
          // time integration
          const R = centralOrbit(L.F, [r0, 0, vx, vy], { T: 200, eta: 0.004, revs: 3, rmax: 8, rmin: 0.03, maxSteps: 60000 });
          let th = 0, prev = 0; const tu = []; // (unwound φ, u) from the time run
          R.s.forEach((S, i) => { const a = Math.atan2(S[1], S[0]); let d = a - prev; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; th += i ? d : 0; prev = a; tu.push([Math.abs(th), 1 / Math.hypot(S[0], S[1])]); });
          // Binet integration in φ: u'' = -u - F(1/u)/(h² u²)  (μ = 1)
          const sg = Math.sign(h) || 1, H2 = h * h;
          const fb = (Y) => [Y[1], -Y[0] - L.F(1 / Y[0]) / (H2 * Y[0] * Y[0])];
          let Y = [1 / r0, -vx / Math.abs(h)], phi = 0; const dphi = 0.002, bu = [[0, Y[0], Y[1]]], bx = [];
          const phMax = Math.min(tu[tu.length - 1][0], 3 * TAU);
          for (let k = 0; phi < phMax && k < 20000; k++) {
            Y = rk4(fb, Y, dphi); phi += dphi;
            if (!(Y[0] > 1 / 8) || Y[0] > 1 / 0.03) break;
            bu.push([phi, Y[0], Y[1]]);
            if (k % 50 === 49 && phi <= TAU + 1e-9) bx.push([Math.cos(sg * phi) / Y[0], Math.sin(sg * phi) / Y[0]]);
          }
          // compare r(φ): at every time step, Binet's u is Hermite-interpolated (it carries u and du/dφ) at the same angle
          let dev = 0, j = 0; const bl = bu[bu.length - 1][0];
          for (const [p, ut] of tu) {
            if (p > bl) break;
            while (j < bu.length - 2 && bu[j + 1][0] < p) j++;
            const A = bu[j], B = bu[j + 1], hh = B[0] - A[0], x = (p - A[0]) / hh;
            const ub = (2 * x ** 3 - 3 * x * x + 1) * A[1] + (x ** 3 - 2 * x * x + x) * hh * A[2] + (-2 * x ** 3 + 3 * x * x) * B[1] + (x ** 3 - x * x) * hh * B[2];
            dev = Math.max(dev, Math.abs(1 / ut - 1 / ub));
          }
          const umax = Math.max(...bu.map((q) => q[1]), ...tu.map((q) => q[1]));
          return { R, tu, bu, bx, dev, h, stop: R.stop, phMax: Math.max(phMax, 1), umax };
        });
        v.render(() => {
          const D = run();
          // fit the window to the orbit, the start point and the velocity tip
          let x0 = Math.min(0, tip.x) - 0.3, x1 = Math.max(1, tip.x) + 0.3, y0 = Math.min(0, tip.y) - 0.3, y1 = Math.max(0, tip.y) + 0.3;
          for (const S of D.R.s) { x0 = Math.min(x0, S[0]); x1 = Math.max(x1, S[0]); y0 = Math.min(y0, S[1]); y1 = Math.max(y1, S[1]); }
          const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hw = Math.max(1.2, Math.min(4.5, 0.56 * Math.max(x1 - x0, y1 - y0)));
          s.setView([cx - 1.1 * hw, cx + 1.1 * hw], [cy - hw, cy + hw]);
          s.path(D.R.s.map((S) => [S[0], S[1]]), { color: 'blue', width: 2.4 });
          s.dots(D.bx, { r: 3, color: 'orange' });
          sun(s, 0, 0, { r: 0.05, color: 'ink' });
          s.dot(1, 0, { r: 4, color: 'accent' });
          s.arrow(1, 0, tip.x, tip.y, { color: 'accent', width: 2.2 });
          if (law.value === 'inv5') s.circle(0.5, 0, 0.5, { color: 'green', width: 1, dash: [4, 4] });
          const msg = D.stop === 'centre' ? 'falls into the centre' : D.stop === 'escape' ? 'escapes' : '';
          if (msg) s.corner(msg, 'tl', { color: 'red', weight: 600 });
          g.setView([-0.25, D.phMax], [0, Math.min(D.umax * 1.12, 12)]);
          const tk = []; for (let k = 1; k * Math.PI < D.phMax; k++) { g.vline(k * Math.PI, { color: 'grid', width: 1 }); tk.push([k * Math.PI, k === 1 ? 'π' : k + 'π']); }
          g.setTicks(tk, null);
          g.path(D.tu, { color: 'blue', width: 2.6 });
          g.path(D.bu, { color: 'orange', width: 1.4, dash: [5, 4] });
          g.dots(D.bu.filter((_, i) => i % 50 === 0), { r: 2.6, color: 'orange' });
          cur = D;
        });
        v.legend([['blue', 'time integration of $\\mu\\ddot{\\mathbf r} = F\\hat{\\mathbf r}$'], ['orange', 'Binet: $u\'\' + u = -\\mu F/\\ell^2u^2$ (dots: first turn)', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const D = cur, L = law.value;
          let out = String.raw`$\ell = ${v.fix(D.h, 3)}$ · largest gap between the two orbits $r(\phi)$: $${sci(v, D.dev)}$`;
          if (L === 'inv2') { const u = D.bu.map((q) => q[1]); out += String.raw` · right-hand side $\mu k/\ell^2 = ${v.fix(1 / (D.h * D.h), 4)}$ = mean of $u$ over a turn $${v.fix((Math.max(...u) + Math.min(...u)) / 2, 4)}$: $u = (1 + e\cos(\phi - \phi_0))/p$, a conic`; }
          if (L === 'inv3') out += String.raw` · here $u'' + (1 - 1/\ell^2)u = 0$ is exactly linear: ${D.h * D.h < 1 ? String.raw`$\ell^2 < 1$, exponential growth — a spiral into the centre` : String.raw`$\ell^2 > 1$, a sinusoid of period $2\pi/\sqrt{1 - 1/\ell^2}$ that reaches $u = 0$: escape`}`;
          if (L === 'inv5') out += String.raw` · the circle $r = 2a\cos\phi$ through the centre solves Binet’s equation exactly when $F = -8a^2\ell^2/\mu r^5$; with $a = \tfrac12$ that needs $\ell = 1/\sqrt2 = 0.7071$: the particle then rides the circle into the centre, arriving in finite time at infinite speed, and any other launch spirals in or escapes`;
          if (L === 'spring') out += ' · $u(\\phi)$ has period $\\pi$: an ellipse centred on the force centre';
          if (L === 'inv25') out += ' · $u(\\phi)$ oscillates with a period that is not a divisor of $2\\pi$: the ellipse precesses';
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.7
    {
      num: '8.7',
      kind: 'Theorem',
      name: 'Kepler’s first law: conic orbits',
      statement: String.raw`Under an attractive inverse-square force $F = -k/r^2$ ($k = GMm$ for gravity; $\mu$ the reduced mass) every orbit with $\ell \ne 0$ is a conic section with the force centre at a focus:
$$r(\phi) = \frac{p}{1 + e\cos(\phi - \phi_0)},\qquad p = \frac{\ell^2}{\mu k},\qquad e = \sqrt{1 + \frac{2E\ell^2}{\mu k^2}}.$$
Bound orbits ($E<0$, $e<1$) are ellipses with semi-major axis $a = p/(1 - e^2) = k/2|E|$, so planets move on ellipses with the Sun at one focus (Kepler’s first law, with the Sun–planet reduced mass). $E = 0$ gives a parabola and $E > 0$ a hyperbola. For an ellipse the distances to the two foci always add up to $2a$. The orbit is closed only because the force is exactly inverse-square: for $F\propto -1/r^{2+\delta}$ the bound orbits precess.`,
      idea: String.raw`In Binet’s equation (8.6) the inverse-square law makes the right-hand side the constant $\mu k/\ell^2$, so $u'' + u = \mu k/\ell^2$ is a forced harmonic oscillator in the angle, with solution $u = (\mu k/\ell^2)(1 + e\cos(\phi - \phi_0))$ — the polar equation of a conic about a focus. The energy fixes $e$ through the turning points $u = (1\pm e)/p$ of the effective potential (8.4). The period of $u(\phi)$ is exactly $2\pi$, so after one turn the particle returns to the same perihelion: no precession. With $1/r^{2+\delta}$ the equation is no longer linear, the angular period of $u$ differs from $2\pi$, and the perihelion advances each turn.`,
      caption: String.raw`Drag the launch point and the tip of the velocity (it snaps to circular and to escape speed). The simulated orbit is coloured by energy sign; the dashed green curve is a conic fitted by least squares to the simulated points, with the force centre forced to be a focus. A planet runs along it with its two focal distances drawn — their sum stays $2a$. Right: $1/r$ against the angle, a perfect sinusoid of period $2\pi$. Move the exponent off 2 and the residual of the fit jumps, the dots slide off the sinusoid and the ellipse rotates.`,
      deps: ['mech-8.6', 'mech-1.17'],
      refs: ['Taylor §8.6', 'Goldstein §3.7'],
      tags: ['Kepler', 'conic sections', 'gravity'],
      credit: 'Kepler, 1609; Newton, 1687',
      scope: String.raw`Exactly inverse-square attraction between two point masses (or spherical bodies, 8.1) with no other forces; general relativity, oblateness and other bodies make real orbits precess slowly (8.13).`,
      viz(v) {
        const pw = v.slider('force exponent $n$ in $F = -k/r^n$', 1.8, 2.2, 2, { step: 0.005, onChange: (x) => { if (Math.abs(x - 2) < 0.008 && x !== 2) pw.set(2); } });
        const s = v.stage({ x: [-3.4, 1.9], y: [-2.1, 2.1], equal: true, axes: false, height: 340, weight: 1.25 });
        const g = v.stage({ x: [0, 4 * TAU], y: [0, 3], axes: 'box', height: 340, xlabel: 'angle φ (unwound)', title: '$1/r$ against the angle: simulated (dots) and fit' });
        const P0 = s.handle(1, 0, { color: 'ink', r: 6, label: 'launch', labelPos: 'se', constrain: (x, y) => { const r = Math.hypot(x, y); return r < 0.35 ? [(0.35 * x) / (r || 1), (0.35 * y) / (r || 1)] : [x, y]; } });
        const snapV = (x, y) => {
          const rx = P0.x, ry = P0.y, r = Math.hypot(rx, ry), vx = x - rx, vy = y - ry, sp = Math.hypot(vx, vy), ve = Math.sqrt(2 / r), vc = Math.sqrt(1 / r);
          const tangent = [-ry / r, rx / r], cosA = (vx * tangent[0] + vy * tangent[1]) / (sp || 1);
          if (Math.abs(sp - ve) < 0.03) return [rx + (vx * ve) / sp, ry + (vy * ve) / sp];
          if (Math.abs(sp - vc) < 0.035 && cosA > 0.995) return [rx + tangent[0] * vc, ry + tangent[1] * vc];
          return [x, y];
        };
        const V = s.handle(1.0, 1.18, { color: 'accent', label: 'v₀', labelPos: 'ne', constrain: snapV });
        let ox = P0.x, oy = P0.y;
        P0.onDrag = () => { V.set(V.x + P0.x - ox, V.y + P0.y - oy); ox = P0.x; oy = P0.y; };
        const cache = memo(); let cur = null;
        const run = () => cache([pw.value, P0.x, P0.y, V.x, V.y].join('|'), () => {
          ox = P0.x; oy = P0.y;
          const n = pw.value, acc = (r) => -1 / r ** n, s0 = [P0.x, P0.y, V.x - P0.x, V.y - P0.y];
          const el = kepEl(1, ...s0), bound = el.E < -1e-9;
          const F = centralOrbit(acc, s0, { T: bound ? 4.2 * Math.min(el.T, 60) : 40, eta: 0.004, rmax: 12, rmin: 0.02, revs: 4.2, maxSteps: 60000 });
          const B = bound ? null : centralOrbit(acc, s0, { T: -40, eta: 0.004, rmax: 12, rmin: 0.02, maxSteps: 30000 });
          const all = (B ? B.s.slice().reverse() : []).concat(F.s);
          // least-squares fit 1/r = A + B cos φ + C sin φ
          const rows = [], rhs = []; const stepK = Math.max(1, Math.floor(all.length / 700));
          for (let i = 0; i < all.length; i += stepK) { const S = all[i], r = Math.hypot(S[0], S[1]), ph = Math.atan2(S[1], S[0]); rows.push([1, Math.cos(ph), Math.sin(ph)]); rhs.push(1 / r); }
          const [A, Bc, Cc] = v.M.lstsq(rows, rhs);
          let res = 0; rows.forEach((row, i) => { res += (row[0] * A + row[1] * Bc + row[2] * Cc - rhs[i]) ** 2; });
          res = Math.sqrt(res / rows.length) / Math.abs(A);
          const efit = Math.hypot(Bc, Cc) / A, pfit = 1 / A, wfit = Math.atan2(Cc, Bc);
          // unwound angle and 1/r for the right panel (forward run only)
          let th = 0, prev = Math.atan2(s0[1], s0[0]); const th0 = prev, ur = [];
          let nextA = 0; const unw = [0];
          F.s.forEach((S, i) => { const a = Math.atan2(S[1], S[0]); let d = a - prev; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; if (i) { th += d; unw.push(th); } prev = a; if (Math.abs(th) >= nextA) { ur.push([Math.abs(th), 1 / Math.hypot(S[0], S[1])]); nextA += 0.11; } });
          const sgn = el.h >= 0 ? 1 : -1;
          // apsidal advance per turn: unwound angle between successive perihelia, located where r·v changes sign from − to +
          const peri = [];
          for (let i = 1; i < F.s.length; i++) { const A = F.s[i - 1], B = F.s[i], a0 = A[0] * A[2] + A[1] * A[3], a1 = B[0] * B[2] + B[1] * B[3]; if (a0 < 0 && a1 >= 0) { const u = -a0 / (a1 - a0); peri.push(unw[i - 1] + u * (unw[i] - unw[i - 1])); } }
          const adv = peri.length >= 2 ? sgn * (peri[1] - peri[0]) - TAU : NaN;
          return { n, s0, el, bound, F, all, A, Bc, Cc, efit, pfit, wfit, res, ur, th0, sgn, adv };
        });
        v.animate((t) => {
          const R = run(), el = R.el;
          let x0 = Math.min(P0.x, V.x, 0) - 0.3, x1 = Math.max(P0.x, V.x, 0) + 0.3, y0 = Math.min(P0.y, V.y, 0) - 0.3, y1 = Math.max(P0.y, V.y, 0) + 0.3;
          for (const S of R.all) { if (Math.abs(S[0]) > 4.5 || Math.abs(S[1]) > 3.5) continue; x0 = Math.min(x0, S[0]); x1 = Math.max(x1, S[0]); y0 = Math.min(y0, S[1]); y1 = Math.max(y1, S[1]); }
          const hy = Math.max(1.6, 0.55 * (y1 - y0), 0.42 * (x1 - x0)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
          s.setView([cx - 1.3 * hy, cx + 1.3 * hy], [cy - hy, cy + hy]);
          const col = !R.bound ? (Math.abs(el.E) < 1e-6 ? 'gold' : 'red') : el.e < 1e-3 ? 'green' : 'blue';
          s.path(R.all.map((S) => [S[0], S[1]]), { color: col, width: 2.6 });
          s.path(conicPts(R.pfit, Math.max(0, R.efit), R.wfit, 14), { color: 'green', width: 1.4, dash: [5, 4] });
          sun(s, 0, 0, { r: 0.07, label: 'focus', dy: 14 });
          s.arrow(P0.x, P0.y, V.x, V.y, { color: 'accent', width: 2.2 });
          // empty focus and a planet with its two focal radii
          if (R.bound && R.n === 2 && el.e > 0.02) {
            const a = el.a, fx = -2 * a * el.ex, fy = -2 * a * el.ey;
            s.dot(fx, fy, { r: 3.5, color: 'muted', hollow: true, label: 'empty focus', labelPos: 's' });
            const Tm = el.T, S = stateAt(R.F, ((t * Tm) / 6) % Tm);
            s.line(0, 0, S[0], S[1], { color: 'orange', width: 1.6 }); s.line(fx, fy, S[0], S[1], { color: 'purple', width: 1.6 });
            s.dot(S[0], S[1], { r: 5.5, color: 'gold' });
            cur = { R, rsum: Math.hypot(S[0], S[1]) + Math.hypot(S[0] - fx, S[1] - fy) };
          } else {
            const S = stateAt(R.F, (t * 1.2) % Math.abs(R.F.t[R.F.t.length - 1]));
            s.dot(S[0], S[1], { r: 5.5, color: 'gold' });
            cur = { R, rsum: NaN };
          }
          const lbl = !R.bound ? (Math.abs(el.E) < 1e-6 ? 'parabola (E = 0)' : 'hyperbola (E > 0)') : el.e < 1e-3 ? 'circle' : 'ellipse (E < 0)';
          s.corner(R.n === 2 ? `${lbl}: e = ${v.fix(R.efit, 4)}` : `n = ${v.fix(R.n, 3)}: not a conic`, 'tl', { color: R.n === 2 ? col : 'red', weight: 600 });
          // right panel
          const xmax = Math.max(TAU, Math.min(4 * TAU, R.ur.length ? R.ur[R.ur.length - 1][0] : TAU));
          const umax = Math.max(...R.ur.map((q) => q[1]));
          g.setView([-0.3, xmax], [0, Math.min(1.15 * umax, 6)]);
          const tk = []; for (let k = 1; k * TAU <= xmax + 1e-9; k++) { g.vline(k * TAU, { color: 'grid', width: 1 }); tk.push([k * TAU, 2 * k + 'π']); }
          g.setTicks(tk, null);
          g.fn((p) => R.A + R.Bc * Math.cos(R.th0 + R.sgn * p) + R.Cc * Math.sin(R.th0 + R.sgn * p), { color: 'green', width: 1.6, dash: [5, 4] });
          g.dots(R.ur, { r: 2.6, color: col });
        }, { period: 30, still: 2.5 });
        v.legend([['blue', 'simulated orbit'], ['green', 'least-squares conic, focus at the centre', { dash: true }], ['orange', 'distance to the focus'], ['purple', 'distance to the empty focus']]);
        v.readout(() => {
          if (!cur) return '';
          const { R, rsum } = cur, el = R.el;
          let out = String.raw`from the launch state: $e = ${v.fix(el.e, 4)}$, $E = ${v.fix(el.E, 4)}$ · least-squares conic through the simulated points: $e = ${v.fix(R.efit, 4)}$, $p = ${v.fix(R.pfit, 4)}$ (predicted $\ell^2/\mu k = ${v.fix(el.p, 4)}$), rms misfit $${sci(v, R.res)}$`;
          if (isFinite(rsum)) out += String.raw` · focal distances add to $${v.fix(rsum, 5)}$, $2a = ${v.fix(2 * el.a, 5)}$`;
          if (R.n !== 2 && isFinite(R.adv)) out += String.raw` · perihelion moves $${v.fix((R.adv * 180) / Math.PI, 2)}°$ per turn — not a conic`;
          else if (R.n === 2 && isFinite(R.adv)) out += String.raw` · perihelion shift per turn $${sci(v, (R.adv * 180) / Math.PI)}°$`;
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.8
    {
      num: '8.8',
      kind: 'Theorem',
      name: 'Kepler’s third law',
      statement: String.raw`For bound orbits under an inverse-square attraction $F = -k/r^2$, the period depends only on the semi-major axis $a$, not on the eccentricity:
$$T^2 = \frac{4\pi^2\mu}{k}\,a^3,\qquad\text{for planets}\qquad T^2 = \frac{4\pi^2}{G(M_\odot + m)}\,a^3 .$$
Since $m \ll M_\odot$, all planets share almost the same constant $T^2/a^3$, so on a log–log plot of period against semi-major axis they fall on one line of slope $3/2$. For a power-law force $F\propto -r^{-n}$ the circular orbits instead obey $T\propto a^{(n+1)/2}$, and eccentric orbits no longer share a single law.`,
      idea: String.raw`By the area law (8.5) the radius sweeps area at the constant rate $\ell/2\mu$, so one period sweeps the whole ellipse: $T = \pi ab\cdot 2\mu/\ell$. For the conic orbit (8.7) the semi-latus rectum $p = b^2/a = \ell^2/\mu k$ gives $\ell = b\sqrt{\mu k/a}$, and therefore $T = 2\pi\sqrt{\mu/k}\;a^{3/2}$: the semi-minor axis cancels, which is why eccentricity drops out. With the reduced mass of 8.2, $\mu/k = 1/G(M + m)$, so Jupiter’s period is about $0.05\%$ shorter than $a^{3/2}$ years.`,
      caption: String.raw`Left: eleven bodies on orbits integrated numerically from their real perihelion distances and speeds (AU, years, $GM_\odot$ from the built-in constants); pick the inner or outer system. Right, on log–log axes: the measured periods (filled) against the catalogue values (open circles) and the line $T = 2\pi\sqrt{a^3/GM_\odot}$. Halley’s comet ($e = 0.97$) and the circular Venus sit on the same line. Change the force exponent: each body is relaunched so that it keeps its real perihelion and aphelion, but the periods (time to go once around) leave the catalogue — the slope changes, the orbits become rosettes and the eccentric bodies scatter off the line.`,
      deps: ['mech-8.7', 'mech-8.5'],
      refs: ['Taylor §8.6', 'Goldstein §3.8'],
      tags: ['Kepler', 'solar system', 'scaling'],
      credit: 'Kepler, 1619',
      scope: String.raw`Two-body inverse-square motion; for planets the constant contains $M_\odot + m$, and mutual perturbations shift periods slightly.`,
      viz(v) {
        const C = v.M.CONST, MU = (C.G * C.Msun * C.yr ** 2) / C.au ** 3; // GM☉ in AU³/yr²
        const zoom = v.select('show', [{ value: 'inner', label: 'inner system' }, { value: 'outer', label: 'outer system' }], 'inner');
        const pw = v.slider('force exponent $n$ ($F \\propto -1/r^n$)', 1.5, 2.8, 2, { step: 0.01, onChange: (x) => { if (Math.abs(x - 2) < 0.015 && x !== 2) pw.set(2); } });
        const s = v.stage({ x: [-3.2, 3.2], y: [-3.2, 3.2], equal: true, axes: false, height: 340, weight: 1 });
        const g = v.stage({ x: [0.25, 60], y: [0.1, 1500], xlog: true, ylog: true, axes: 'box', height: 340, weight: 1.1, xlabel: 'semi-major axis a (AU)', ylabel: 'period T (yr)', title: 'Kepler’s third law (log–log)' });
        const cache = memo(); let cur = null;
        const run = () => cache(pw.value, () => {
          const n = pw.value, acc = (r) => -MU / r ** n, U = (r) => (-MU * r ** (1 - n)) / (n - 1);
          return BODIES.map((B) => {
            // launch at the real perihelion with the speed that makes the real aphelion the other turning point
            const rp = B.a * (1 - B.e), ra = B.a * (1 + B.e), w = (B.w * Math.PI) / 180;
            const vp = Math.sqrt((2 * (U(ra) - U(rp))) / (1 - (rp / ra) ** 2)) * (B.retro ? -1 : 1);
            const s0 = [rp * Math.cos(w), rp * Math.sin(w), -vp * Math.sin(w), vp * Math.cos(w)];
            const R = centralOrbit(acc, s0, { T: 1e5, eta: B.e > 0.5 ? 0.003 : 0.01, revs: 4.2, rmax: 400, rmin: 0.01, maxSteps: 90000 });
            // period: time for the angle to advance by 2π (interpolated), a from the radial extremes
            const turns = []; let th = 0;
            for (let i = 1; i < R.s.length; i++) {
              const A = R.s[i - 1], C2 = R.s[i]; let d = Math.atan2(C2[1], C2[0]) - Math.atan2(A[1], A[0]); if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU;
              const k = Math.floor((Math.abs(th) + Math.abs(d)) / TAU); if (k > turns.length) turns.push(R.t[i - 1] + ((turns.length + 1) * TAU - Math.abs(th)) / Math.abs(d) * (R.t[i] - R.t[i - 1]));
              th += d;
            }
            let lo = Infinity, hi = 0; for (const S of R.s) { const r = Math.hypot(S[0], S[1]); lo = Math.min(lo, r); hi = Math.max(hi, r); }
            return { B, R, Tm: turns.length ? turns[0] : NaN, wrap: turns.length ? turns[turns.length - 1] : NaN, am: (lo + hi) / 2 };
          });
        });
        v.animate((t) => {
          const D = run(), inner = zoom.value === 'inner', lim = inner ? 3.2 : 50, yrPerSec = inner ? 0.35 : 12;
          s.setView([-lim, lim], [-lim, lim]);
          s.circle(0, 0, inner ? 1 : 10, { color: 'faint', width: 0.8, dash: [2, 4] });
          s.text(inner ? '1 AU' : '10 AU', inner ? 0.72 : 7.2, inner ? -0.72 : -7.2, { color: 'muted', size: 10 });
          for (const d of D) {
            const show = inner ? d.B.a < 3.5 : d.B.a > 3.5;
            if (!show) continue;
            s.path(d.R.s.map((S) => [S[0], S[1]]), { color: d.B.c, width: 1.4, alpha: 0.8 });
            if (isFinite(d.Tm)) {
              const t0 = (d.B.M0 / 360) * d.Tm, S = stateAt(d.R, (t * yrPerSec + t0) % d.wrap);
              if (Math.abs(S[0]) < lim && Math.abs(S[1]) < lim) { s.dot(S[0], S[1], { r: 4.5, color: d.B.c }); s.text(d.B.n, S[0], S[1], { color: d.B.c, size: 10.5, dy: -10, align: 'center' }); }
            }
          }
          sun(s, 0, 0, { r: inner ? 0.07 : 0.9 });
          s.corner(`time runs ${inner ? '0.35' : '12'} yr per second`, 'bl', { color: 'muted', size: 11 });
          // log–log
          g.fn((a) => TAU * Math.sqrt(a ** 3 / MU), { color: 'green', width: 1.6, dash: [6, 4] });
          const xs = [], ys = [];
          for (const d of D) {
            g.dot(d.B.a, d.B.T, { r: 6, hollow: true, color: 'ink', width: 1.3 });
            if (isFinite(d.Tm)) { g.dot(d.am, d.Tm, { r: 3.6, color: d.B.c === 'faint' ? 'muted' : d.B.c }); xs.push(Math.log10(d.am)); ys.push(Math.log10(d.Tm)); }
          }
          for (const d of D) if (['Mercury', 'Earth', 'Jupiter', 'Neptune', 'Halley', 'Pluto', 'Ceres'].includes(d.B.n)) { const right = d.B.n === 'Halley' || d.B.n === 'Mercury'; g.text(d.B.n, d.B.a, d.B.T, { color: 'muted', size: 10, dx: right ? 9 : -9, align: right ? 'left' : 'right', dy: d.B.n === 'Pluto' ? -6 : d.B.n === 'Mercury' ? 4 : 0 }); }
          const fit = xs.length > 2 ? v.M.linreg(xs, ys) : null;
          if (fit) g.fn((a) => 10 ** fit.predict(Math.log10(a)), { color: 'accent', width: 1, alpha: 0.6 });
          cur = { D, fit };
        }, { period: 1e9, still: 3 });
        v.legend([['ink', 'catalogue (NASA fact sheets)', { dot: true }], ['accent', 'simulated orbits', { dot: true }], ['green', '$T = 2\\pi\\sqrt{a^3/GM_\\odot}$', { dash: true }]]);
        v.readout(() => {
          if (!cur || !cur.fit) return '';
          const { D, fit } = cur, n = pw.value, J = D.find((d) => d.B.n === 'Jupiter'), H = D.find((d) => d.B.n === 'Halley'), V = D.find((d) => d.B.n === 'Venus');
          let out = String.raw`slope of the simulated points $= ${v.fix(fit.slope, 4)}$ ($r^2 = ${v.fix(fit.r2, 6)}$)`;
          if (n === 2) out += String.raw` — Kepler’s $3/2$ · Halley ($e = 0.97$): $T = ${v.fix(H.Tm, 2)}$ yr, Venus ($e = 0.007$): $T/a^{3/2} = ${v.fix(V.Tm / V.am ** 1.5, 5)}$, Halley $T/a^{3/2} = ${v.fix(H.Tm / H.am ** 1.5, 5)}$ yr/AU$^{3/2}$ · Jupiter: catalogue ${v.fix(J.B.T, 3)} yr, Sun-only model ${v.fix(J.Tm, 3)} yr; counting Jupiter’s own mass, $M_\odot + m_J$ (8.2), gives ${v.fix(J.Tm * Math.sqrt(1 / (1 + 9.546e-4)), 3)} yr — the rest is perturbation by the other planets`;
          else out += String.raw` vs $(n+1)/2 = ${v.fix((n + 1) / 2, 3)}$ for circular orbits · eccentric bodies now miss the line: Halley’s $T/a^{(n+1)/2}$ differs from Venus’s by ${v.fix(100 * Math.abs(H.Tm / H.am ** ((n + 1) / 2) / (V.Tm / V.am ** ((n + 1) / 2)) - 1), 1)}%`;
          return out;
        });
      },
    },
  ],
};
