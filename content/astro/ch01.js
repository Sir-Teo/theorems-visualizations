// Astrophysics & Celestial Mechanics — Chapter 1: Orbits, binaries and exoplanets (1.1–1.4; 1.5–1.8 in ch01-b.js)

// ── helpers ───────────────────────────────────────────────────────────────────
const TAU = 2 * Math.PI, DEG = Math.PI / 180;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const wrap360 = (d) => ((d % 360) + 360) % 360;
/** One-slot cache: recompute only when the key changes. */
function memo() { let key, val; return (k, f) => { if (k !== key) { key = k; val = f(); } return val; }; }
/** Eccentric anomaly from mean anomaly (Newton on Kepler's equation E − e sin E = M). */
function kepE(M, e) {
  M = ((M % TAU) + TAU) % TAU;
  let E = e < 0.8 ? M : Math.PI;
  for (let k = 0; k < 60; k++) { const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); E -= d; if (Math.abs(d) < 1e-14) break; }
  return E;
}
const nuOfE = (E, e) => 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
const EOfNu = (nu, e) => 2 * Math.atan2(Math.sqrt(1 - e) * Math.sin(nu / 2), Math.sqrt(1 + e) * Math.cos(nu / 2));
const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const vnorm = (a) => Math.hypot(a[0], a[1], a[2]);
const vlin = (p, a, q, b) => [p * a[0] + q * b[0], p * a[1] + q * b[1], p * a[2] + q * b[2]];
/** Perifocal frame: P toward periapsis, Q 90° ahead in the orbit plane, W the orbit normal (angles in radians). */
function pqw(Om, inc, w) {
  const cO = Math.cos(Om), sO = Math.sin(Om), ci = Math.cos(inc), si = Math.sin(inc), cw = Math.cos(w), sw = Math.sin(w);
  return {
    P: [cO * cw - sO * sw * ci, sO * cw + cO * sw * ci, sw * si],
    Q: [-cO * sw - sO * cw * ci, -sO * sw + cO * cw * ci, cw * si],
    W: [sO * si, -cO * si, ci],
  };
}
/** Elements → state (μ = GM). Angles in radians; returns {r, v}. */
function el2rv(mu, a, e, inc, Om, w, nu) {
  const p = a * (1 - e * e), r = p / (1 + e * Math.cos(nu)), F = pqw(Om, inc, w), k = Math.sqrt(mu / p);
  const X = r * Math.cos(nu), Y = r * Math.sin(nu), VX = -k * Math.sin(nu), VY = k * (e + Math.cos(nu));
  return { r: vlin(X, F.P, Y, F.Q), v: vlin(VX, F.P, VY, F.Q) };
}
/** State → classical elements (radians). */
function rv2el(mu, r, v) {
  const h = vcross(r, v), hn = vnorm(h), rn = vnorm(r), v2 = vdot(v, v);
  const n = [-h[1], h[0], 0], nn = Math.hypot(n[0], n[1]);
  const ev = vlin(v2 / mu - 1 / rn, r, -vdot(r, v) / mu, v), e = vnorm(ev);
  const a = 1 / (2 / rn - v2 / mu), inc = Math.acos(clamp(h[2] / hn, -1, 1));
  const Om = nn > 1e-12 ? Math.atan2(n[1], n[0]) : 0;
  let w = 0, nu = 0;
  if (nn > 1e-12 && e > 1e-10) { w = Math.acos(clamp(vdot(n, ev) / (nn * e), -1, 1)); if (ev[2] < 0) w = TAU - w; }
  if (e > 1e-10) { nu = Math.acos(clamp(vdot(ev, r) / (e * rn), -1, 1)); if (vdot(r, v) < 0) nu = TAU - nu; }
  return { a, e, inc, Om: (Om + TAU) % TAU, w, nu };
}
/** Planar orbit under −μ r̂/r², RK4 with steps adapted to the local time scale; returns {t, s:[[x,y,vx,vy]], stop}. */
function kepOrbit(mu, s0, T, o = {}) {
  const eta = o.eta ?? 0.01, rmax = o.rmax ?? Infinity, maxN = o.maxSteps ?? 40000;
  let [x, y, vx, vy] = s0, t = 0, stop = 'steps';
  const out = { t: [0], s: [[x, y, vx, vy]] };
  const acc = (px, py) => { const r2 = px * px + py * py, k = -mu / (r2 * Math.sqrt(r2)); return [k * px, k * py]; };
  for (let i = 0; i < maxN; i++) {
    const r = Math.hypot(x, y), v = Math.hypot(vx, vy);
    let h = eta * Math.min(r / (v || 1e-9), Math.sqrt((r * r * r) / mu));
    if (t + h > T) h = T - t;
    if (h <= 1e-14 * T) { stop = 'time'; break; }
    const a1 = acc(x, y), x2 = x + 0.5 * h * vx, y2 = y + 0.5 * h * vy, u2 = vx + 0.5 * h * a1[0], w2 = vy + 0.5 * h * a1[1];
    const a2 = acc(x2, y2), x3 = x + 0.5 * h * u2, y3 = y + 0.5 * h * w2, u3 = vx + 0.5 * h * a2[0], w3 = vy + 0.5 * h * a2[1];
    const a3 = acc(x3, y3), x4 = x + h * u3, y4 = y + h * w3, u4 = vx + h * a3[0], w4 = vy + h * a3[1], a4 = acc(x4, y4);
    x += (h / 6) * (vx + 2 * u2 + 2 * u3 + u4); y += (h / 6) * (vy + 2 * w2 + 2 * w3 + w4);
    vx += (h / 6) * (a1[0] + 2 * a2[0] + 2 * a3[0] + a4[0]); vy += (h / 6) * (a1[1] + 2 * a2[1] + 2 * a3[1] + a4[1]);
    t += h; out.t.push(t); out.s.push([x, y, vx, vy]);
    if (Math.hypot(x, y) > rmax) { stop = 'escape'; break; }
  }
  out.stop = stop; return out;
}
/** TeX scientific notation that also handles 0 (use inside $…$). */
const sci = (v, x, d = 2) => (Math.abs(x) < 1e-300 ? '0' : v.sci(x, d));

// constants in AU, yr: GM☉ = 4π² AU³/yr² (to the precision of the AU/yr definitions); 1 AU/yr = 4.74047 km/s
const MU_SUN = 4 * Math.PI * Math.PI * 1.000003, AUYR = 4.740470;

// ── 1.1 presets: J2000 heliocentric ecliptic elements (JPL; rounded) a (AU), e, i, Ω, ω (deg) ─────────────
const EL_PRESETS = {
  earth: { a: 1.000001, e: 0.01671, i: 0.00005, Om: 348.74, w: 114.21, nu: 30, label: 'Earth' },
  mars: { a: 1.523679, e: 0.0934, i: 1.850, Om: 49.56, w: 286.50, nu: 60, label: 'Mars' },
  ceres: { a: 2.7675, e: 0.0758, i: 10.59, Om: 80.30, w: 73.60, nu: 100, label: 'Ceres' },
  pluto: { a: 39.482, e: 0.2488, i: 17.14, Om: 110.30, w: 113.77, nu: 40, label: 'Pluto' },
  halley: { a: 17.834, e: 0.96714, i: 162.26, Om: 58.42, w: 111.33, nu: 150, label: 'Halley' },
};

export default {
  collection: 'astro',
  chapter: 1,
  title: 'Orbits, binaries and exoplanets',
  summary: String.raw`Kepler’s two-body solution, taken from mechanics, becomes a measuring instrument. Six orbital elements fix an orbit in space, the vis-viva relation gives the speed anywhere on it, and Kepler’s third law weighs planets, stars and black holes. Binary stars give stellar masses through radial-velocity curves and stellar radii through eclipses, and the same two techniques find planets around other stars and measure their densities. Real orbits precess when the central body is oblate — a fact engineers use to keep satellites in step with the Sun — and the old Titius–Bode rule is a reminder to test a numerical pattern against chance before believing it.`,
  items: [
    // ───────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Orbital elements',
      statement: String.raw`A bound two-body orbit is fixed in space by six numbers, the **(classical) orbital elements**, measured relative to a reference plane (for the solar system, the ecliptic) and a reference direction in it (the vernal equinox ♈):
- **size and shape** — the semi-major axis $a$ and the eccentricity $e$ of the Kepler ellipse;
- **orientation** — the inclination $i\in[0^\circ,180^\circ]$ of the orbit plane to the reference plane, the longitude of the ascending node $\Omega$ (the angle in the reference plane from ♈ to the point where the body climbs through it), and the argument of periapsis $\omega$ (the angle in the orbit plane from the ascending node to periapsis);
- **position in time** — one anomaly: the mean anomaly $M = n(t-\tau)$ with $n = \sqrt{GM_\odot/a^3}$, or equivalently the eccentric anomaly $E$ ($M = E - e\sin E$) or the true anomaly $\nu$.

The map from $(a, e, i, \Omega, \omega, M)$ to the state vector $(\mathbf r, \mathbf v)$ is a bijection away from the singular cases $e = 0$ (no periapsis) and $i = 0^\circ, 180^\circ$ (no node). Orbits with $i > 90^\circ$ are retrograde.`,
      idea: String.raw`Kepler’s first law (mech 8.7) says the orbit is a conic with the Sun at a focus, lying in the fixed plane perpendicular to the angular momentum; the Laplace–Runge–Lenz vector (mech 8.10) points to periapsis and has length $e$. The orientation of the plane takes two angles ($i$ and $\Omega$ locate the normal $\mathbf h/h$), the direction of the Runge–Lenz vector within the plane takes one more ($\omega$), the conic’s size and shape take two ($a$, $e$), and the time of periapsis passage is the sixth. Counting checks: a state vector also has six components, and the six conserved or linearly advancing quantities $\mathbf h$, $\mathbf A$ (with $\mathbf h\cdot\mathbf A = 0$ and $|\mathbf A|$ fixed by $E$ and $h$) and $M$ match them one for one.`,
      caption: String.raw`Left, drag the background to turn the scene. Three handles set the orientation: **Ω** slides round the ecliptic and swings the line of nodes, **i** tilts the orbit plane about that line (past 90° the orbit turns retrograde), **ω** turns the periapsis within the orbit plane. The part of the orbit below the ecliptic is dashed. Right, the same orbit seen face-on: drag the planet along it and read the true anomaly ν (from the focus), the eccentric anomaly E (from the centre, on the auxiliary circle) and the mean anomaly M (the gold “mean planet” moving uniformly). The readout turns the six elements into a position and velocity and back again. Presets load real J2000 elements (JPL); Halley’s comet is retrograde.`,
      deps: ['mech-8.7', 'mech-8.10'],
      see: ['mech-8.9'],
      refs: ['Murray–Dermott §2.8', 'Carroll–Ostlie §2.1'],
      tags: ['orbits', 'elements', 'geometry'],
      viz(v) {
        const preset = v.select('elements', [{ value: 'earth', label: 'Earth' }, { value: 'mars', label: 'Mars' }, { value: 'ceres', label: 'Ceres' }, { value: 'pluto', label: 'Pluto' }, { value: 'halley', label: 'Halley' }], 'ceres', { onChange: (k) => load(k) });
        const aS = v.slider('$a$ (AU)', 0.3, 45, 2.7675, { log: true, sig: 4 });
        const eS = v.slider('$e$', 0, 0.97, 0.0758, { step: 0.001 });
        const S = v.stage({ x: [-1.6, 1.6], y: [-1.45, 1.45], equal: true, axes: false, height: 380, weight: 1.35, title: 'orientation in space' });
        const P = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, axes: false, height: 380, weight: 1, title: 'in the orbit plane (face-on)' });
        const sc = v.scene3(S, { yaw: -0.85, pitch: 0.42, axes: false });
        const st = { Om: 80.30 * DEG, inc: 10.59 * DEG, w: 73.60 * DEG, nu: 100 * DEG };
        const R = 1.32, RI = 0.9; // radii of the handle circles (scene units); the i handle sits inside so it never hides the ω handle
        const ez = [0, 0, 1];
        const frame = () => {
          const n = [Math.cos(st.Om), Math.sin(st.Om), 0], u = [-Math.sin(st.Om), Math.cos(st.Om), 0];
          const m = vlin(Math.cos(st.inc), u, Math.sin(st.inc), ez); // in the orbit plane, 90° ahead of the node
          return { n, u, m };
        };
        const hO = sc.handle([R, 0, 0], { mode: 'plane', a: [1, 0, 0], b: [0, 1, 0], color: 'orange', label: '$\\Omega$', lim: 2,
          snap: (p) => { const r = Math.hypot(p[0], p[1]) || 1; return [(R * p[0]) / r, (R * p[1]) / r, 0]; },
          onDrag: (H) => { st.Om = (Math.atan2(H.p[1], H.p[0]) + TAU) % TAU; } });
        const hI = sc.handle([0, R, 0], { color: 'purple', label: '$i$', lim: 2,
          snap: (p) => { const F = frame(); let ang = Math.atan2(vdot(p, ez), vdot(p, F.u)); if (ang < 0) ang = ang < -Math.PI / 2 ? Math.PI : 0; return vlin(RI * Math.cos(ang), F.u, RI * Math.sin(ang), ez); },
          onDrag: (H) => { const F = frame(); let ang = Math.atan2(vdot(H.p, ez), vdot(H.p, F.u)); if (ang < 0) ang = ang < -Math.PI / 2 ? Math.PI : 0; st.inc = clamp(ang, 0, Math.PI); } });
        const hW = sc.handle([0, 0, R], { color: 'green', label: '$\\omega$', lim: 2,
          snap: (p) => { const F = frame(), ang = Math.atan2(vdot(p, F.m), vdot(p, F.n)); return vlin(R * Math.cos(ang), F.n, R * Math.sin(ang), F.m); },
          onDrag: (H) => { const F = frame(); st.w = (Math.atan2(vdot(H.p, F.m), vdot(H.p, F.n)) + TAU) % TAU; } });
        // planet handle on the face-on ellipse (scaled coordinates, focus at the origin)
        let scale = 1;
        const hP = P.handle(0.5, 0.5, { color: 'accent', r: 7,
          constrain: (x, y) => { const e = eS.value, a = aS.value * scale, nu = Math.atan2(y, x), r = (a * (1 - e * e)) / (1 + e * Math.cos(nu)); st.nu = (nu + TAU) % TAU; return [r * Math.cos(nu), r * Math.sin(nu)]; } });
        function load(k) {
          const E = EL_PRESETS[k]; if (!E) return;
          aS.set(E.a); eS.set(E.e); st.Om = E.Om * DEG; st.inc = E.i * DEG; st.w = E.w * DEG; st.nu = E.nu * DEG;
          // turn the view so that the major axis lies across the screen
          const Pd = pqw(st.Om, st.inc, st.w).P; sc.yaw = Math.atan2(-Pd[1], Pd[0]) - 0.45; v.invalidate();
        }
        load('ceres');
        let out = null;
        v.render(() => {
          const a = aS.value, e = eS.value, Q = a * (1 + e);
          scale = 1.18 / Math.max(Q, a); // scene units per AU (also used for the face-on panel)
          const F = frame(), B = pqw(st.Om, st.inc, st.w), p = a * (1 - e * e);
          // keep handles on their circles unless held
          if (!hO.dragging) hO.p = [R * F.n[0], R * F.n[1], 0];
          if (!hI.dragging) hI.p = vlin(RI * Math.cos(st.inc), F.u, RI * Math.sin(st.inc), ez);
          if (!hW.dragging) hW.p = vlin(R * Math.cos(st.w), F.n, R * Math.sin(st.w), F.m);
          sc.begin();
          // reference plane and ♈ direction
          sc.disc([1, 0, 0], [0, 1, 0], 1.45, { fill: 'blue', fillAlpha: 0.06, color: 'blue', grid: true, alpha: 0.35, width: 0.8 });
          sc.arrow([0, 0, 0], [1.55, 0, 0], { color: 'muted', width: 1.4, head: 7, top: false });
          sc.line([0, 0, -0.9], [0, 0, 0.9], { color: 'faint', width: 1, dash: [3, 3] });
          // orbit: solid above the plane, dashed below
          const pts = [];
          for (let k = 0; k <= 240; k++) { const nu = (TAU * k) / 240, r = (p / (1 + e * Math.cos(nu))) * scale; pts.push(vlin(r * Math.cos(nu), B.P, r * Math.sin(nu), B.Q)); }
          for (let k = 0; k < 240; k++) { const A = pts[k], C = pts[k + 1], up = A[2] + C[2] >= 0; sc.line(A, C, { color: 'accent', width: up ? 2.4 : 1.6, alpha: up ? 1 : 0.6, dash: up ? null : [4, 3] }, 1); }
          // orbit-plane fill (faint) for depth
          sc.poly(pts.filter((_, k) => k % 4 === 0), { fill: 'accent', fillAlpha: 0.07, edge: false });
          // line of nodes
          const rAsc = (p / (1 + e * Math.cos(-st.w))) * scale, rDes = (p / (1 + e * Math.cos(Math.PI - st.w))) * scale;
          sc.line(vlin(-1.45, F.n, 0, F.n), vlin(1.45, F.n, 0, F.n), { color: 'orange', width: 1.4, alpha: 0.8 }, 12);
          sc.dot(vlin(rAsc, F.n, 0, F.n), { r: 4.5, color: 'orange' });
          sc.dot(vlin(-rDes, F.n, 0, F.n), { r: 3.5, hollow: true, color: 'orange' });

          // angle arcs: Ω in the ecliptic, ω in the orbit plane, i between the planes
          const arc = (A, Bv, ang, r, col) => { const q = []; for (let k = 0; k <= 30; k++) { const t = (ang * k) / 30; q.push(vlin(r * Math.cos(t), A, r * Math.sin(t), Bv)); } sc.path(q, { color: col, width: 2.2 }); return q[15]; };
          arc([1, 0, 0], [0, 1, 0], st.Om, 0.42, 'orange');
          arc(F.n, F.m, st.w, 0.55, 'green');
          arc(F.u, ez, st.inc, 0.75, 'purple');
          sc.line([0, 0, 0], vlin(RI, F.u, 0, F.u), { color: 'purple', width: 1, alpha: 0.45, dash: [2, 3] });
          sc.line([0, 0, 0], hI.p, { color: 'purple', width: 1, alpha: 0.45, dash: [2, 3] });
          sc.line([0, 0, 0], hW.p, { color: 'green', width: 1, alpha: 0.45, dash: [2, 3] });
          // normal vector, periapsis, planet, Sun
          sc.arrow([0, 0, 0], vlin(0.7, B.W, 0, B.W), { color: 'muted', width: 1.6, head: 7 });
          sc.tex('\\hat{\\mathbf h}', vlin(0.82, B.W, 0, B.W), { color: 'muted', size: 13 });
          const rq = a * (1 - e) * scale; sc.dot(vlin(rq, B.P, 0, B.P), { r: 3.5, color: 'green' });
          const rn = (p / (1 + e * Math.cos(st.nu))) * scale, Pp = vlin(rn * Math.cos(st.nu), B.P, rn * Math.sin(st.nu), B.Q);
          sc.line(Pp, [Pp[0], Pp[1], 0], { color: 'accent', width: 1, alpha: 0.5, dash: [2, 2] });
          sc.dot(Pp, { r: 6, color: 'accent' });
          sc.dot([0, 0, 0], { r: 6, color: 'gold' });
          sc.flush();
          { const A = sc.P([1.6, 0, 0]); S.text('vernal equinox', A[0], A[1], { color: 'muted', size: 10.5, dy: 12, align: 'center' }); }
          { const A = sc.P(vlin(rAsc, F.n, 0.13, ez)); S.text('☊', A[0], A[1], { color: 'orange', size: 15, dx: -14, align: 'center' }); }
          S.corner(`i = ${v.fix(st.inc / DEG, 1)}°  ${st.inc > Math.PI / 2 ? '(retrograde)' : '(prograde)'}`, 'tl', { color: st.inc > Math.PI / 2 ? 'red' : 'muted', size: 12 });
          // face-on panel
          const A = a * scale, bA = A * Math.sqrt(1 - e * e), c = A * e;
          P.setView([-1.25, 1.25], [-1.25, 1.25]);
          P.circle(-c, 0, A, { color: 'faint', width: 1, dash: [4, 4] });
          P.curve((t) => [-c + A * Math.cos(t), bA * Math.sin(t)], 0, TAU, { color: 'accent', width: 2.2, n: 240 });
          P.line(-c - A, 0, -c + A, 0, { color: 'faint', width: 1 });
          P.dot(-2 * c, 0, { r: 3, hollow: true, color: 'muted' });
          const E = EOfNu(st.nu, e), Mm = E - e * Math.sin(E), rr = (A * (1 - e * e)) / (1 + e * Math.cos(st.nu));
          if (!hP.dragging) { hP.x = rr * Math.cos(st.nu); hP.y = rr * Math.sin(st.nu); }
          const qx = -c + A * Math.cos(E), qy = A * Math.sin(E);
          P.line(-c, 0, qx, qy, { color: 'teal', width: 1.3, alpha: 0.8 });
          P.line(qx, qy, qx, rr * Math.sin(st.nu), { color: 'teal', width: 1, dash: [2, 3], alpha: 0.7 });
          P.dot(qx, qy, { r: 3.5, color: 'teal' });
          P.line(0, 0, hP.x, hP.y, { color: 'accent', width: 1.3, alpha: 0.7 });
          const arcP = (cx, r, a0, a1, col, lab) => { const q = []; for (let k = 0; k <= 40; k++) { const t = a0 + ((a1 - a0) * k) / 40; q.push([cx + r * Math.cos(t), r * Math.sin(t)]); } P.path(q, { color: col, width: 2 }); const mid = q[20]; P.tex(lab, cx + (mid[0] - cx) * 1.28, mid[1] * 1.28, { color: col, size: 14 }); };
          const nuP = (st.nu + TAU) % TAU, EP = (E + TAU) % TAU, MP = (Mm + TAU) % TAU;
          arcP(0, 0.16, 0, nuP, 'accent', '\\nu');
          arcP(-c, 0.3, 0, EP, 'teal', 'E');
          P.dot(-c + A * Math.cos(MP), A * Math.sin(MP), { r: 5, hollow: true, color: 'gold', width: 2 });
          P.text('mean planet', -c + A * Math.cos(MP), A * Math.sin(MP), { color: 'gold', size: 10.5, dx: Math.cos(MP) >= 0 ? 10 : -10, dy: Math.sin(MP) >= 0 ? -10 : 10, align: Math.cos(MP) >= 0 ? 'left' : 'right' });
          P.dot(c > 0.02 ? A * (1 - e) : A, 0, { r: 3.5, color: 'green' });
          P.text('periapsis', A * (1 - e), 0, { color: 'green', size: 10.5, dy: 12, align: 'center' });
          P.dot(0, 0, { r: 6, color: 'gold' });
          P.corner(`face-on, ${v.fix(1 / scale, 2)} AU per unit`, 'bl', { color: 'faint', size: 10.5 });
          // state vector and the round trip
          const sv = el2rv(MU_SUN, a, e, st.inc, st.Om, st.w, st.nu), back = rv2el(MU_SUN, sv.r, sv.v);
          out = { a, e, sv, back, E, Mm: MP, T: Math.sqrt((a * a * a) / MU_SUN) * TAU };
        });
        v.legend([['accent', 'orbit (dashed below the ecliptic)'], ['orange', 'line of nodes, ☊ ascending node'], ['green', 'periapsis direction'], ['teal', 'auxiliary circle, eccentric anomaly']]);
        v.readout(() => {
          if (!out) return '';
          const { a, e, sv, back, Mm, T } = out, d = (x) => v.fix(x / DEG, 2), km = (x) => v.fix(x * AUYR, 2);
          const vv = vnorm(sv.v) * AUYR;
          return String.raw`elements $(a, e, i, \Omega, \omega, \nu) = (${v.fix(a, 4)}\text{ AU}, ${v.fix(e, 4)}, ${d(st.inc)}^\circ, ${d(st.Om)}^\circ, ${d(st.w)}^\circ, ${d(st.nu)}^\circ)$, mean anomaly $M = ${d(Mm)}^\circ$, period ${v.fix(T, 3)} yr, time since periapsis ${v.fix((Mm / TAU) * T, 3)} yr → state $\mathbf r = (${v.fix(sv.r[0], 3)}, ${v.fix(sv.r[1], 3)}, ${v.fix(sv.r[2], 3)})$ AU, $\mathbf v = (${km(sv.v[0])}, ${km(sv.v[1])}, ${km(sv.v[2])})$ km/s ($|\mathbf v| = ${v.fix(vv, 2)}$ km/s) → back to elements: $a = ${v.fix(back.a, 4)}$, $e = ${v.fix(back.e, 4)}$, $i = ${d(back.inc)}^\circ$, $\Omega = ${d(back.Om)}^\circ$, $\omega = ${d(back.w)}^\circ$, $\nu = ${d(back.nu)}^\circ$${e < 1e-3 || st.inc < 1e-3 || Math.abs(st.inc - Math.PI) < 1e-3 ? ' — near a singular case: with no periapsis (e = 0) or no node (i = 0°, 180°) the angles ω, Ω are undefined and the round trip loses them' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2',
      kind: 'Theorem',
      name: 'Vis-viva equation',
      statement: String.raw`On any Kepler orbit about a mass $M$ (test body, $m\ll M$), the speed at distance $r$ is
$$v^2 = GM\Big(\frac{2}{r} - \frac{1}{a}\Big),$$
where $a$ is the semi-major axis ($a<0$ for hyperbolas). Hence a single measurement of distance and speed — in any direction — fixes $a$, the orbital energy $-GMm/2a$ and, for a bound orbit, the period $2\pi\sqrt{a^3/GM}$. The orbit is an ellipse, parabola or hyperbola as $v^2$ is less than, equal to or greater than $2GM/r$; a bound body can never get farther than $r = 2a$ from the centre (where $v$ would vanish), and an unbound one keeps the speed $v_\infty = \sqrt{GM/|a|}$ at infinity.`,
      idea: String.raw`Energy conservation (mech 3.6) makes $\tfrac12 v^2 - GM/r$ constant along the orbit; evaluating it at the two apsides $r_\pm = a(1\pm e)$, where angular momentum conservation gives $v_+r_+ = v_-r_-$, shows the constant is $-GM/2a$ (mech 8.21). The direction of the velocity enters only through the eccentricity: it changes the shape and orientation of the conic (mech 8.7) but not its size. Setting $v = 0$ gives the bounding circle $r = 2a$ — the simplest instance of the zero-velocity curves of the three-body problem (2.2).`,
      caption: String.raw`Left, on log–log axes: the vis-viva curves of real bodies between perihelion and aphelion (JPL elements) — the planets hug the circular-speed line, Halley’s comet sweeps from 54.6 km/s at 0.59 AU to under 1 km/s at 35 AU, and the interstellar visitors 1I/ʻOumuamua and 2I/Borisov lie above the escape line. Drag the accent point to “measure” a speed at a distance: its own vis-viva curve and $a$ appear. Right, the orbit through that measurement for the flight-path angle you choose (integrated numerically): the speed along it never leaves the curve, changing the angle changes $e$ but not $a$, and a bound orbit always stays inside the dashed circle $r = 2a$.`,
      deps: ['mech-8.7', 'mech-3.6'],
      see: ['mech-8.21', 'mech-8.4'],
      refs: ['Murray–Dermott §2.3', 'Carroll–Ostlie §2.3'],
      tags: ['orbits', 'energy', 'Kepler'],
      viz(v) {
        const g = v.stage({ x: [0.15, 80], y: [0.4, 260], xlog: true, ylog: true, axes: 'box', height: 360, weight: 1.15, xlabel: 'distance from the Sun r (AU)', ylabel: 'speed v (km/s)', title: 'speed against distance' });
        const s = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: false, height: 360, weight: 1, title: 'the orbit through the measurement' });
        const gam = v.slider('flight-path angle $\\gamma$ (velocity above the local horizontal)', -85, 85, 25, { step: 1, fmt: (x) => `${x}°` });
        const H = g.handle(2.4, 22, { color: 'accent', r: 7, label: 'measurement', labelPos: 'ne' });
        const vc = (r) => Math.sqrt(MU_SUN / r) * AUYR;
        const BOD = [
          { n: 'Mercury', a: 0.387098, e: 0.20563, c: 'muted' }, { n: 'Earth', a: 1.000001, e: 0.016709, c: 'blue' }, { n: 'Mars', a: 1.523679, e: 0.0934, c: 'red' },
          { n: 'Jupiter', a: 5.2044, e: 0.0489, c: 'orange' }, { n: 'Neptune', a: 30.07, e: 0.0113, c: 'blue' }, { n: 'Pluto', a: 39.482, e: 0.2488, c: 'purple' },
          { n: 'Halley', a: 17.834, e: 0.96714, c: 'pink' }, { n: 'ʻOumuamua', a: -1.2723, e: 1.20113, c: 'teal' }, { n: 'Borisov', a: -0.8516, e: 3.3565, c: 'green' },
        ];
        const cache = memo(); let cur = null;
        const run = () => cache(`${H.x.toFixed(5)}|${H.y.toFixed(5)}|${gam.value}`, () => {
          const r0 = H.x, v0 = H.y / AUYR, g0 = gam.value * DEG, invA = 2 / r0 - (v0 * v0) / MU_SUN, a = 1 / invA, bound = invA > 1e-9;
          const s0 = [r0, 0, v0 * Math.sin(g0), v0 * Math.cos(g0)];
          const Tp = bound ? TAU * Math.sqrt(a ** 3 / MU_SUN) : Infinity;
          const T = bound ? Tp : (12 * r0) / Math.max(v0, 1e-3);
          const R = kepOrbit(MU_SUN, s0, T, { eta: 0.004, rmax: bound ? Infinity : 14 * r0, maxSteps: 60000 });
          let err = 0, rmax = 0, rmin = Infinity;
          for (const S2 of R.s) { const r = Math.hypot(S2[0], S2[1]), vv2 = S2[2] ** 2 + S2[3] ** 2; err = Math.max(err, Math.abs(vv2 / (MU_SUN * (2 / r - invA)) - 1)); rmax = Math.max(rmax, r); rmin = Math.min(rmin, r); }
          const h = r0 * v0 * Math.cos(g0), e = Math.sqrt(Math.max(0, 1 - (h * h * invA) / MU_SUN));
          return { r0, v0, a, invA, bound, Tp, R, err, rmax, rmin, e };
        });
        v.render(() => {
          // log–log panel
          g.fn((r) => vc(r), { color: 'green', width: 1.3, dash: [6, 4] });
          g.fn((r) => Math.SQRT2 * vc(r), { color: 'red', width: 1.3, dash: [6, 4] });
          g.text('circular', 78, vc(78), { color: 'green', size: 10.5, dy: 11, align: 'right' });
          g.text('escape', 78, Math.SQRT2 * vc(78), { color: 'red', size: 10.5, dy: -10, align: 'right' });
          for (const B of BOD) {
            const q = B.a * (1 - B.e), Q = B.a > 0 ? B.a * (1 + B.e) : 80;
            const f = (r) => Math.sqrt(MU_SUN * (2 / r - 1 / B.a)) * AUYR;
            g.fn(f, { domain: [q, Q], color: B.c, width: B.e > 0.5 ? 1.8 : 2.6, alpha: 0.85 });
            g.dot(q, f(q), { r: 2.8, color: B.c });
            const LAB = { Mercury: [q, 0], Earth: [q, -9], Mars: [q, 9], Jupiter: [q, 10], Neptune: [q, 10], Pluto: [q, -10], Halley: [4, -9], 'ʻOumuamua': [1.2, -9], Borisov: [9, -9] };
            const [lx, ldy] = LAB[B.n], rt = ['Borisov', 'ʻOumuamua', 'Halley'].includes(B.n);
            g.text(B.n, lx, f(lx), { color: B.c, size: 10.5, dx: rt ? 6 : -6, dy: ldy, align: rt ? 'left' : 'right' });
          }
          const D = run();
          if (D.bound) g.fn((r) => Math.sqrt(MU_SUN * (2 / r - D.invA)) * AUYR, { domain: [0.15, Math.min(80, 2 * D.a * 0.9999)], color: 'accent', width: 1.8, dash: [3, 3] });
          else g.fn((r) => Math.sqrt(MU_SUN * (2 / r - D.invA)) * AUYR, { color: 'accent', width: 1.8, dash: [3, 3] });
          if (D.bound && 2 * D.a < 80) g.vline(2 * D.a, { color: 'accent', width: 1, alpha: 0.5, dash: [2, 4] });
          // orbit panel
          const pts = D.R.s.map((S2) => [S2[0], S2[1]]);
          let lim = D.bound ? Math.max(2 * D.a, D.r0) * 1.08 : D.r0 * 4;
          lim = Math.max(lim, D.r0 * 1.3);
          s.setView([-lim, lim], [-lim, lim]);
          if (D.bound) s.circle(0, 0, 2 * D.a, { color: 'accent', width: 1.2, dash: [5, 4], alpha: 0.7 });
          s.circle(0, 0, D.r0, { color: 'faint', width: 0.8, dash: [2, 3] });
          // colour the orbit by speed: draw in short pieces with alpha from the speed
          const vmax = Math.sqrt(MU_SUN * (2 / Math.max(D.rmin, 1e-3) - D.invA));
          for (let k = 0; k + 1 < pts.length; k += 1) {
            const S2 = D.R.s[k], sp = Math.hypot(S2[2], S2[3]) / vmax;
            s.line(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], { color: D.bound ? 'accent' : 'red', width: 1.2 + 2.4 * sp, alpha: 0.35 + 0.65 * sp });
          }
          // equal-time markers
          const Ttot = D.R.t[D.R.t.length - 1];
          for (let j = 1; j < 24; j++) { const tt = (Ttot * j) / 24; let k = 0; while (k < D.R.t.length - 1 && D.R.t[k] < tt) k++; s.dot(D.R.s[k][0], D.R.s[k][1], { r: 2, color: 'ink', alpha: 0.6 }); }
          s.dot(0, 0, { r: 6, color: 'gold' });
          const g0 = gam.value * DEG, vl = lim * 0.18;
          s.arrow(D.r0, 0, D.r0 + vl * Math.sin(g0), vl * Math.cos(g0), { color: 'accent', width: 2.2 });
          s.dot(D.r0, 0, { r: 5, color: 'accent' });
          if (D.bound) s.text('r = 2a', 2 * D.a * Math.cos(2.3), 2 * D.a * Math.sin(2.3), { color: 'accent', size: 11, dx: -4, dy: -8, align: 'right' });
          s.corner(D.bound ? `ellipse, e = ${v.fix(D.e, 3)}` : Math.abs(D.invA) < 1e-9 ? 'parabola' : `hyperbola, e = ${v.fix(D.e, 3)}`, 'tl', { color: D.bound ? 'accent' : 'red', weight: 600 });
          s.corner('dots: equal time steps; thicker = faster', 'bl', { color: 'faint', size: 10.5 });
          cur = D;
        });
        v.legend([['green', 'circular speed $\\sqrt{GM_\\odot/r}$', { dash: true }], ['red', 'escape speed $\\sqrt{2GM_\\odot/r}$', { dash: true }], ['accent', 'vis-viva curve through the measurement', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const D = cur, vesc = Math.SQRT2 * vc(D.r0);
          let out = String.raw`$r = ${v.fix(D.r0, 3)}$ AU, $v = ${v.fix(D.v0 * AUYR, 2)}$ km/s (escape speed there ${v.fix(vesc, 2)} km/s) ⇒ $1/a = 2/r - v^2/GM_\odot = ${v.fix(D.invA, 4)}$ AU$^{-1}$`;
          if (D.bound) out += String.raw`, $a = ${v.fix(D.a, 3)}$ AU, period $${v.fix(D.Tp, 3)}$ yr for every flight-path angle; this angle gives $e = ${v.fix(D.e, 4)}$, apsides ${v.fix(D.rmin, 3)}–${v.fix(D.rmax, 3)} AU (never beyond $2a = ${v.fix(2 * D.a, 3)}$)`;
          else out += String.raw` ⇒ unbound, $v_\infty = \sqrt{GM_\odot/|a|} = ${v.fix(Math.sqrt(MU_SUN * Math.abs(D.invA)) * AUYR, 2)}$ km/s (ʻOumuamua 26.3, Borisov 32.3)`;
          out += String.raw` · integrated orbit: $v^2$ matches $GM(2/r - 1/a)$ to $${sci(v, D.err)}$ at every step`;
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3',
      kind: 'Method',
      name: 'Masses from Kepler’s third law',
      statement: String.raw`If a body (or several) orbits a centre with semi-major axis $a$ and period $T$, Newton’s form of Kepler’s third law gives the **total mass** of the pair,
$$M + m = \frac{4\pi^2 a^3}{G\,T^2}.$$
All satellites of one centre lie on a single line of slope $\tfrac32$ in $\log T$ against $\log a$, and the height of the line measures the mass; one well-measured orbit is enough. When the satellite is not negligible ($m/M$ comparable to the measurement error) the result is the sum $M + m$, and the masses are split only with extra information — the sizes of the two orbits about the barycentre, $a_1/a_2 = m_2/m_1$. For visual binaries $a$ comes from an angle and a distance, $a = \alpha\, d$, so the mass scales as $d^3$.`,
      idea: String.raw`For two bodies the relative orbit is a Kepler orbit with $GM$ replaced by $G(M+m)$ (reduced mass, mech 8.2), and the area law gives $T^2 = 4\pi^2a^3/G(M+m)$ (mech 8.8). Inverting the law turns a timing and a size into a mass: this is how the masses of the Sun, the planets (from their moons), binary stars and the black hole at the Galactic Centre are known. The method assumes only Newtonian point-mass gravity; perturbations by other bodies and non-spherical centres show up as small scatter about the line.`,
      caption: String.raw`Every satellite system on one log–log chart (SI units): the faint diagonals are lines of constant central mass, from Pluto to $10^6\,M_\odot$. Pick a system; its points are fitted with a line of slope $\tfrac32$ and the mass is read off. Click a point to drop it from the fit or restore it — one orbit alone already gives the mass. The right panel shows the mass implied by each orbit separately, divided by the accepted value. For Pluto the fitted mass is Pluto + Charon (Charon is 11% of the total); the four small moons circle the pair and read 1–4% high, because a binary pulls a little harder than a point of the same mass.`,
      deps: ['mech-8.8', 'mech-8.2'],
      refs: ['Carroll–Ostlie §2.3', 'Carroll–Ostlie §7.2'],
      tags: ['Kepler', 'mass', 'measurement'],
      credit: 'Newton, 1687',
      viz(v) {
        const G = v.M.CONST.G, MS = v.M.CONST.Msun, AU = v.M.CONST.au, DAY = 86400, YR = 365.25 * DAY, KM = 1000;
        // a (m), T (s); accepted central (total) mass in kg; data: JPL / NASA fact sheets; Brozović et al. 2015 (Pluto);
        // Bond et al. 2017 (Sirius); Gillessen et al. 2017 + GRAVITY 2021 (S2, R0 = 8.277 kpc)
        const SYS = {
          earth: { label: 'Earth', c: 'blue', M: 3.986004e14 / G, Mname: 'M_\\oplus', unit: 5.9722e24, pts: [['ISS', 6794 * KM, 92.68 * 60], ['LAGEOS-1', 12270 * KM, 225.7 * 60], ['GPS', 26560 * KM, 717.97 * 60], ['GEO', 42164 * KM, 1436.07 * 60]] },
          pluto: { label: 'Pluto + Charon', c: 'purple', M: 975.5e9 / G, Mname: 'M_\\text{P+C}', unit: 975.5e9 / G, pts: [['Charon', 19596 * KM, 6.387221 * DAY], ['Styx', 42656 * KM, 20.16155 * DAY], ['Nix', 48694 * KM, 24.85463 * DAY], ['Kerberos', 57783 * KM, 32.16756 * DAY], ['Hydra', 64738 * KM, 38.20177 * DAY]] },
          jupiter: { label: 'Jupiter', c: 'orange', M: 1.26687e17 / G, Mname: 'M_J', unit: 1.8982e27, pts: [['Amalthea', 181366 * KM, 0.498179 * DAY], ['Io', 421700 * KM, 1.769138 * DAY], ['Europa', 671034 * KM, 3.551181 * DAY], ['Ganymede', 1070412 * KM, 7.154553 * DAY], ['Callisto', 1882709 * KM, 16.689018 * DAY]] },
          sun: { label: 'Sun', c: 'gold', M: MS, Mname: 'M_\\odot', unit: MS, pts: [['Mercury', 0.387098 * AU, 0.240846 * YR], ['Venus', 0.723332 * AU, 0.615198 * YR], ['Earth', 1.000001 * AU, 1.000017 * YR], ['Mars', 1.523679 * AU, 1.88082 * YR], ['Jupiter', 5.2044 * AU, 11.862 * YR], ['Saturn', 9.5826 * AU, 29.457 * YR], ['Uranus', 19.2184 * AU, 84.0205 * YR], ['Neptune', 30.07 * AU, 164.8 * YR]] },
          sirius: { label: 'Sirius A + B', c: 'teal', M: 3.081 * MS, Mname: 'M_\\odot', unit: MS, pts: [['Sirius B', 19.767 * AU, 50.1284 * YR]] },
          sgra: { label: 'Sgr A*', c: 'red', M: 4.30e6 * MS, Mname: 'M_\\odot', unit: MS, pts: [['S2', 1038.8 * AU, 16.0518 * YR]] },
        };
        const keys = Object.keys(SYS);
        const which = v.select('weigh', keys.map((k) => ({ value: k, label: SYS[k].label })), 'jupiter');
        const s = v.stage({ x: [3e6, 4e14], y: [3e3, 3e10], xlog: true, ylog: true, axes: 'box', height: 380, weight: 1.6, xlabel: 'semi-major axis a (m)', ylabel: 'period T (s)', title: 'all satellite systems' });
        const r = v.stage({ x: [-0.5, 5.5], y: [0.94, 1.06], axes: 'box', height: 380, weight: 1, ylabel: 'M from this orbit ÷ accepted', title: 'one orbit is enough' });
        const off = new Set();
        const Tof = (a, M) => TAU * Math.sqrt((a * a * a) / (G * M));
        s.onClick((x, y) => {
          const S0 = SYS[which.value]; let best = null, bd = 18;
          S0.pts.forEach((p, k) => { const d = Math.hypot(s.X(p[1]) - s.X(x), s.Y(p[2]) - s.Y(y)); if (d < bd) { bd = d; best = k; } });
          if (best != null) { const id = `${which.value}:${best}`; if (off.has(id)) off.delete(id); else off.add(id); }
        });
        let cur = null;
        v.render(() => {
          // isomass lines
          const LINES = [[1.46e22, 'Pluto+Charon'], [5.97e24, 'Earth'], [1.9e27, 'Jupiter'], [MS, 'Sun'], [1e3 * MS, '10³ M☉'], [4.3e6 * MS, '4.3×10⁶ M☉']];
          LINES.forEach(([M, lab], k) => {
            s.fn((a) => Tof(a, M), { color: 'faint', width: 1, dash: [2, 4] });
            const Ttop = k % 2 ? 4e9 : 1.6e10, aTop = Math.cbrt((G * M * Ttop * Ttop) / (4 * Math.PI * Math.PI));
            if (aTop < 5e13) s.text(lab, aTop, Ttop, { color: 'muted', size: 10, dx: 6, align: 'left' });
            else s.text(lab, 3.6e14, Tof(3.6e14, M), { color: 'muted', size: 10, dx: -4, dy: -9, align: 'right' });
          });
          // every system's points
          let fit = null;
          for (const k of keys) {
            const S0 = SYS[k], sel = k === which.value;
            S0.pts.forEach((p, j) => {
              const dropped = off.has(`${k}:${j}`);
              s.dot(p[1], p[2], { r: sel ? 5.5 : 3.5, color: S0.c, alpha: sel ? (dropped ? 0.35 : 1) : 0.45, hollow: sel && dropped });
            });
            if (sel) {
              const use = S0.pts.filter((_, j) => !off.has(`${k}:${j}`));
              if (use.length) {
                // least squares for log M with slope fixed at 3/2: log(4π²a³/GT²) averaged
                const lm = use.map((p) => Math.log10((4 * Math.PI * Math.PI * p[1] ** 3) / (G * p[2] ** 2)));
                const mean = lm.reduce((u, w) => u + w, 0) / lm.length;
                const sd = lm.length > 1 ? Math.sqrt(lm.reduce((u, w) => u + (w - mean) ** 2, 0) / (lm.length - 1) / lm.length) : NaN;
                fit = { M: 10 ** mean, sd, n: use.length };
                s.fn((a) => Tof(a, fit.M), { color: S0.c, width: 2.2 });
              }
              S0.pts.forEach((p, j) => { const L = j % 2 === 0; s.text(p[0], p[1], p[2], { color: S0.c, size: 10.5, dx: L ? 9 : -9, dy: L ? 4 : -4, align: L ? 'left' : 'right' }); });
            }
          }
          // per-orbit masses
          const S0 = SYS[which.value], plu = which.value === 'pluto', lo = plu ? 0.87 : 0.94, hi = plu ? 1.05 : 1.06;
          r.setView([-0.6, Math.max(S0.pts.length - 0.4, 1.4)], [lo, hi]);
          r.setTicks(S0.pts.map((p, j) => [j, p[0]]), null);
          r.hline(1, { color: 'green', width: 1.4 });
          S0.pts.forEach((p, j) => {
            const Mi = (4 * Math.PI * Math.PI * p[1] ** 3) / (G * p[2] ** 2), q = Mi / S0.M, dropped = off.has(`${which.value}:${j}`);
            r.line(j, 1, j, clamp(q, lo, hi), { color: S0.c, width: 2, alpha: 0.6 });
            r.dot(j, clamp(q, lo, hi), { r: 6, color: S0.c, hollow: dropped });
            r.text(`${q >= 1 ? '+' : '−'}${v.fix(Math.abs(q - 1) * 100, 2)}%`, j, clamp(q, lo, hi), { color: 'ink', size: 10.5, dy: q >= 1 ? -13 : 13, align: 'center' });
          });
          if (plu) { r.hline(869.6 / 975.5, { color: 'red', width: 1.2, dash: [5, 4] }); r.text('Pluto’s own mass', -0.4, 869.6 / 975.5, { color: 'red', size: 10.5, dy: -9, align: 'left' }); }
          cur = { S0, fit };
        });
        v.readout(() => {
          if (!cur) return '';
          const { S0, fit } = cur;
          if (!fit) return 'no orbit left in the fit — click a hollow point to restore it';
          const inUnits = fit.M / S0.unit, acc = S0.M / S0.unit;
          const big = (x) => (x > 1e5 ? v.sci(x, 3) : v.fix(x, 4));
          let out = String.raw`${S0.label}: ${fit.n} orbit${fit.n > 1 ? 's' : ''} ⇒ $M + m = 4\pi^2a^3/GT^2 = ${v.sci(fit.M, 4)}$ kg $= ${big(inUnits)}\,${S0.Mname}$ (accepted $${big(acc)}$; off by ${v.fix(Math.abs(fit.M / S0.M - 1) * 100, 2)}%)`;
          if (fit.n > 1) out += String.raw`, scatter of the orbits ±${v.fix((10 ** fit.sd - 1) * 100, 2)}%`;
          if (which.value === 'pluto') out += String.raw` · this is Pluto **plus** Charon: Charon’s own orbit about Pluto has $a = a_P + a_C$, and the barycentric orbits ($a_P/a_C = m_C/m_P \approx 0.12$) split it into $m_P = 1.30\times10^{22}$ kg and $m_C = 1.59\times10^{21}$ kg`;
          if (which.value === 'pluto') out += ' · the small moons orbit a binary, whose quadrupole field speeds them up slightly, so they read high';
          if (which.value === 'sirius') out += String.raw` · $a = 7.50''$ at parallax $0.379''$ is 19.8 AU; the astrometric orbits of A and B about their barycentre split the total into $2.06 + 1.02\,M_\odot$ (Bond et al. 2017)`;
          if (which.value === 'sgra') out += String.raw` · S2: $a = 0.1255''$ at the Galactic Centre distance 8.28 kpc ⇒ 1039 AU, period 16.05 yr: four million Suns in a region smaller than the solar system`;
          if (which.value === 'jupiter') out += String.raw` · Amalthea, deep in Jupiter’s oblate gravity field, runs 0.2% fast and reads high`;
          if (which.value === 'earth') out += String.raw` · drag-free satellites at very different heights give one line; the Moon is omitted because the Sun perturbs its period by 0.3%`;
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4',
      kind: 'Model',
      name: 'Spectroscopic binaries and the mass function',
      statement: String.raw`Two stars of masses $m_1, m_2$ orbit their centre of mass with period $P$ and eccentricity $e$, the orbit plane inclined at $i$ to the sky. Each star’s line-of-sight velocity is
$$v_{r,k}(t) = \gamma \pm K_k\big[\cos(\nu(t)+\omega) + e\cos\omega\big],\qquad K_k = \frac{2\pi a_k\sin i}{P\sqrt{1-e^2}},$$
where $a_k$ is the star’s orbit about the barycentre and $\nu(t)$ follows from Kepler’s equation. If both spectra are seen (**double-lined, SB2**), $K_1/K_2 = m_2/m_1$ and
$$m_k\sin^3 i = \frac{P(1-e^2)^{3/2}}{2\pi G}\,(K_1+K_2)^2K_{3-k}.$$
If only star 1 is seen (**single-lined, SB1**), the data give only the **mass function**
$$f(m) = \frac{P K_1^3(1-e^2)^{3/2}}{2\pi G} = \frac{m_2^3\sin^3 i}{(m_1+m_2)^2},$$
a lower bound on $m_2$. In either case $\sin i$ is unknown from spectroscopy alone.`,
      idea: String.raw`Each star moves on a scaled copy of the relative Kepler orbit (orbital elements 1.1) with $a_1/a_2 = m_2/m_1$; projecting its velocity on the line of sight gives the formula above, with the Doppler shift (waves 1.14) as the measurement. Kepler’s third law (1.3) relates $a = a_1 + a_2$ to $m_1 + m_2$; eliminating $a$ leaves combinations of the masses multiplied by $\sin^3 i$, since only the line-of-sight projection of the orbit is ever measured. A single-lined orbit loses one more equation, so $m_1$ and $m_2$ enter only through $f(m)$.`,
      caption: String.raw`Left, the two orbits face-on (sizes inversely proportional to mass) with the line of sight projected into the orbit plane; press play to run time. Middle, the two radial-velocity curves computed from Kepler’s equation — eccentric orbits give skewed curves whose shape depends on ω. Right, what an SB1 observer can conclude: every pair $(i, m_2)$ on the curve has the same mass function as the true system (dot); at $i = 90^\circ$ the curve gives the smallest possible companion mass. Switch to SB2 to see both curves and the masses times $\sin^3 i$.`,
      deps: ['astro-1.1', 'astro-1.3', 'waves-1.14'],
      refs: ['Carroll–Ostlie §7.3'],
      tags: ['binary stars', 'Doppler', 'mass'],
      viz(v) {
        const m1S = v.slider('$m_1$ ($M_\\odot$)', 0.3, 15, 1.6, { log: true, sig: 3 });
        const m2S = v.slider('$m_2$ ($M_\\odot$)', 0.05, 15, 0.8, { log: true, sig: 3 });
        const PS = v.slider('period $P$ (days)', 0.5, 400, 12, { log: true, sig: 3 });
        const eS = v.slider('$e$', 0, 0.9, 0.45, { step: 0.01 });
        const wS = v.slider('$\\omega$', 0, 360, 60, { step: 1, fmt: (x) => `${x}°` });
        const iS = v.slider('$i$', 0, 90, 60, { step: 1, fmt: (x) => `${x}°` });
        const sb2 = v.toggle('both spectra visible (SB2)', false);
        const o = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, axes: false, height: 320, weight: 0.9, title: 'orbits about the centre of mass' });
        const c = v.stage({ x: [0, 2], y: [-100, 100], axes: 'box', height: 320, weight: 1.2, xlabel: 'time (orbital periods)', ylabel: 'radial velocity (km/s)', title: 'radial-velocity curves' });
        const d = v.stage({ x: [0, 90], y: [0, 3], axes: 'box', height: 320, weight: 0.9, xlabel: 'inclination i (°)', ylabel: '$m_2$ ($M_\\odot$)', title: 'what SB1 data allow' });
        const G = v.M.CONST.G, MS = v.M.CONST.Msun, DAY = 86400;
        let cur = null;
        v.animate((t) => {
          const m1 = m1S.value, m2 = m2S.value, P = PS.value * DAY, e = eS.value, w = wS.value * DEG, inc = iS.value * DEG, M = (m1 + m2) * MS;
          const a = Math.cbrt((G * M * P * P) / (4 * Math.PI * Math.PI)), a1 = (a * m2) / (m1 + m2), a2 = (a * m1) / (m1 + m2);
          const K1 = (TAU * a1 * Math.sin(inc)) / (P * Math.sqrt(1 - e * e)) / 1000, K2 = (TAU * a2 * Math.sin(inc)) / (P * Math.sqrt(1 - e * e)) / 1000;
          const vr = (ph) => { const E = kepE(TAU * ph, e), nu = nuOfE(E, e); return Math.cos(nu + w) + e * Math.cos(w); };
          const ph = (t / 6) % 1;
          // orbits (scaled so the larger orbit's apoapsis fits)
          const sc = 1.15 / (Math.max(a1, a2) * (1 + e));
          const orb = (ak, sign, col) => o.curve((u) => { const r = (ak * sc * (1 - e * e)) / (1 + e * Math.cos(u)); return [sign * r * Math.cos(u + w), sign * r * Math.sin(u + w)]; }, 0, TAU, { color: col, width: 1.8, n: 200 });
          // the line of sight lies along +y here (toward the viewer = up the page in projection); ω measured from the ascending node at +x
          orb(a1, 1, 'blue'); orb(a2, -1, 'red');
          const E = kepE(TAU * ph, e), nu = nuOfE(E, e), r1 = (a1 * sc * (1 - e * e)) / (1 + e * Math.cos(nu)), r2 = (a2 * sc * (1 - e * e)) / (1 + e * Math.cos(nu));
          const p1 = [r1 * Math.cos(nu + w), r1 * Math.sin(nu + w)], p2 = [-r2 * Math.cos(nu + w), -r2 * Math.sin(nu + w)];
          o.line(p1[0], p1[1], p2[0], p2[1], { color: 'faint', width: 1, dash: [3, 3] });
          o.dot(p1[0], p1[1], { r: 5 + 4 * Math.cbrt(m1 / 4), color: 'blue' });
          o.dot(p2[0], p2[1], { r: 5 + 4 * Math.cbrt(m2 / 4), color: 'red', alpha: sb2.value ? 1 : 0.55 });
          o.dot(0, 0, { r: 3, color: 'ink' });
          o.line(-1.25, 0, 1.25, 0, { color: 'faint', width: 1 });
          o.text('line of nodes', -1.22, 0, { color: 'faint', size: 10, dy: 10, align: 'left' });
          o.arrow(0, -0.92, 0, -1.25, { color: 'muted', width: 1.6, head: 7 });
          o.text('to observer', 0.07, -1.12, { color: 'muted', size: 10.5, align: 'left' });
          // RV curves
          const Kmax = Math.max(K1, sb2.value ? K2 : 0) * (1 + e);
          const span = Math.max(10, Kmax * 1.25);
          c.setView([0, 2], [-span, span]);
          c.hline(0, { color: 'faint', width: 1 });
          c.fn((x) => K1 * vr(x % 1), { color: 'blue', width: 2.2, n: 500 });
          if (sb2.value) c.fn((x) => -K2 * vr(x % 1), { color: 'red', width: 2.2, n: 500 });
          c.vline(ph, { color: 'gold', width: 1.2 }); c.vline(ph + 1, { color: 'gold', width: 1.2, alpha: 0.5 });
          c.dot(ph, K1 * vr(ph), { r: 4.5, color: 'blue' });
          if (sb2.value) c.dot(ph, -K2 * vr(ph), { r: 4.5, color: 'red' });
          // mass-function degeneracy
          const f = (P * (K1 * 1000) ** 3 * (1 - e * e) ** 1.5) / (TAU * G) / MS;
          const m2of = (ii) => { const s3 = Math.sin(ii * DEG) ** 3; if (s3 < 1e-9) return NaN; let lo = 0, hi = 1e4; for (let k = 0; k < 100; k++) { const mid = (lo + hi) / 2; if ((mid ** 3 * s3) / (m1 + mid) ** 2 > f) hi = mid; else lo = mid; } return (lo + hi) / 2; };
          const top = Math.max(3, m2 * 2.2);
          d.setView([0, 90], [0, top]);
          d.fn(m2of, { domain: [3, 90], color: 'blue', width: 2.2, n: 200 });
          d.hline(m2of(90), { color: 'green', width: 1, dash: [4, 4] });
          d.text(`minimum m₂ = ${v.fix(m2of(90), 3)}`, 88, m2of(90), { color: 'green', size: 10.5, dy: 10, align: 'right' });
          d.dot(iS.value, m2, { r: 6, color: 'red' });
          d.text('true system', iS.value, m2, { color: 'red', size: 10.5, dx: 9, dy: -8, align: 'left' });
          cur = { K1, K2, f, m1, m2, inc, e, P, msin1: (P * (1 - e * e) ** 1.5 * ((K1 + K2) * 1000) ** 2 * (K2 * 1000)) / (TAU * G) / MS, msin2: (P * (1 - e * e) ** 1.5 * ((K1 + K2) * 1000) ** 2 * (K1 * 1000)) / (TAU * G) / MS };
        }, { period: 60, still: 1.5 });
        v.legend([['blue', 'star 1 (always seen)'], ['red', 'star 2 (seen only in SB2)'], ['gold', 'now']]);
        v.readout(() => {
          if (!cur) return '';
          const { K1, K2, f, m1, m2, inc, msin1, msin2 } = cur, s3 = Math.sin(inc) ** 3;
          let out = String.raw`$K_1 = ${v.fix(K1, 2)}$ km/s · mass function $f(m) = PK_1^3(1-e^2)^{3/2}/2\pi G = ${v.fix(f, 4)}\,M_\odot$, equal to $m_2^3\sin^3 i/(m_1+m_2)^2 = ${v.fix((m2 ** 3 * s3) / (m1 + m2) ** 2, 4)}$`;
          if (sb2.value) out += String.raw` · SB2: $K_2 = ${v.fix(K2, 2)}$ km/s, $K_1/K_2 = ${v.fix(K1 / K2, 4)} = m_2/m_1$; $m_1\sin^3 i = ${v.fix(msin1, 4)}$, $m_2\sin^3 i = ${v.fix(msin2, 4)}\,M_\odot$ (true masses × $\sin^3 i = ${v.fix(s3, 4)}$: ${v.fix(m1 * s3, 4)}, ${v.fix(m2 * s3, 4)})`;
          else out += ' · SB1: any point on the right-hand curve fits the data equally well';
          if (inc < 5 * DEG) out += ' · nearly face-on: the velocities vanish and nothing can be measured';
          return out;
        });
      },
    },
  ],
};
