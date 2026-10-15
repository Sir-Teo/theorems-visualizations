// Electromagnetism — Chapter 1: Charges, forces and Gauss's law (items 1.11–1.20; 1.1–1.10 in ch01.js)
//
// Units in the pictures: positions in cm, point charges in nC, line charges in nC/m, readouts in SI (v.M.si).

// ── shared helpers ────────────────────────────────────────────────────────────
const TAU = 2 * Math.PI;

/** Adaptive Simpson for a scalar f on [a, b] (non-finite samples count as 0). tol is absolute. */
function quad(f, a, b, tol = 1e-9, depth = 18, panels = 8) {
  const F = (x) => { const y = f(x); return isFinite(y) ? y : 0; };
  const S = (fa, fm, fb, h) => (h / 6) * (fa + 4 * fm + fb);
  const rec = (a, b, fa, fm, fb, whole, t, d) => {
    const m = (a + b) / 2, lm = (a + m) / 2, rm = (m + b) / 2, flm = F(lm), frm = F(rm);
    const L = S(fa, flm, fm, m - a), R = S(fm, frm, fb, b - m), diff = L + R - whole;
    if (d <= 0 || Math.abs(diff) <= 15 * t) return L + R + diff / 15;
    return rec(a, m, fa, flm, fm, L, t / 2, d - 1) + rec(m, b, fm, frm, fb, R, t / 2, d - 1);
  };
  let out = 0;
  for (let k = 0; k < panels; k++) {
    const x0 = a + ((b - a) * k) / panels, x1 = a + ((b - a) * (k + 1)) / panels, f0 = F(x0), f1 = F(x1), fm = F((x0 + x1) / 2);
    out += rec(x0, x1, f0, fm, f1, S(f0, fm, f1, x1 - x0), tol / panels, depth);
  }
  return out;
}
/** quad over [a, b] split at the given interior breakpoints (where the integrand peaks or kinks). */
function quadBreaks(f, a, b, breaks, tol, depth = 20) {
  const pts = [a, ...breaks.filter((x) => x > a + 1e-12 && x < b - 1e-12).sort((x, y) => x - y), b];
  let s = 0; for (let i = 0; i + 1 < pts.length; i++) s += quad(f, pts[i], pts[i + 1], tol / (pts.length - 1), depth, 4);
  return s;
}
/** Σ q (r − r_i)/|r − r_i|^{n+1} over sources {x, y, q} (cm, nC); times k·1e-9/(1e-2)^n gives N/C. */
function coul(src, x, y, n = 2) {
  let u = 0, w = 0;
  for (const s of src) {
    if (!s.q) continue;
    const dx = x - s.x, dy = y - s.y, r2 = dx * dx + dy * dy;
    if (r2 < 1e-16) return [NaN, NaN];
    const k = s.q / Math.pow(r2, (n + 1) / 2); u += k * dx; w += k * dy;
  }
  return [u, w];
}
/** Arrow of a given pixel length from data point (x, y) along (ux, uy) (equal-aspect stages). */
function arrowPx(s, x, y, ux, uy, len, st) {
  const L = Math.hypot(ux, uy); if (!(L > 0) || !(len > 0.5) || !isFinite(len)) return;
  s.arrow(x, y, x + ((ux / L) * len) / s.sx, y + ((uy / L) * len) / s.sy, st);
}
/** Same, centred on (x, y). */
function arrowMid(s, x, y, ux, uy, len, st) {
  const L = Math.hypot(ux, uy); if (!(L > 0)) return;
  arrowPx(s, x - ((ux / L) * len) / 2 / s.sx, y - ((uy / L) * len) / 2 / s.sy, ux, uy, len, st);
}
/** Filled arrowhead at data point q pointing from p to q. */
function headAt(s, v, p, q, color, alpha = 1, size = 7.5) {
  const X = s.X(q[0]), Y = s.Y(q[1]), dx = X - s.X(p[0]), dy = Y - s.Y(p[1]), L = Math.hypot(dx, dy); if (!L) return;
  const ux = dx / L, uy = dy / L, c = s.ctx; c.save(); c.fillStyle = v.color(color, alpha); c.beginPath();
  c.moveTo(X + ux * size * 0.55, Y + uy * size * 0.55); c.lineTo(X - ux * size * 0.45 - uy * size * 0.42, Y - uy * size * 0.45 + ux * size * 0.42);
  c.lineTo(X - ux * size * 0.45 + uy * size * 0.42, Y - uy * size * 0.45 - ux * size * 0.42); c.closePath(); c.fill(); c.restore();
}
const sgnCol = (q) => (q > 0 ? 'red' : q < 0 ? 'blue' : 'muted');
/** Rich-text number: plain decimals for moderate sizes, TeX scientific notation otherwise. */
const num = (v, x, d = 3) => (x !== 0 && (Math.abs(x) < 1e-3 || Math.abs(x) >= 1e5) ? `$${v.sci(x, d)}$` : v.fmt(x, d + 1));
/** Signed area of a polygon (positive = counter-clockwise). */
const polyArea = (P) => { let A = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; A += p[0] * q[1] - q[0] * p[1]; } return A / 2; };
function inPoly(x, y, P) {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
}
/** Closest point on segment pq to (x, y): {x, y, t, d}. */
function nearSeg(x, y, p, q) {
  const ex = q[0] - p[0], ey = q[1] - p[1], L2 = ex * ex + ey * ey || 1e-12, t = Math.max(0, Math.min(1, ((x - p[0]) * ex + (y - p[1]) * ey) / L2));
  const cx = p[0] + t * ex, cy = p[1] + t * ey; return { x: cx, y: cy, t, d: Math.hypot(x - cx, y - cy) };
}
/** Unit vector, 3D. */
const unit3 = (a) => { const L = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / L, a[1] / L, a[2] / L]; };
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export default {
  collection: 'em',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.11
    {
      num: '1.11',
      kind: 'Model',
      name: 'Electric dipole',
      statement: String.raw`Charges $+q$ and $-q$ a distance $d$ apart form an **electric dipole** with dipole moment $\mathbf p = q\mathbf d$, the vector $\mathbf d$ pointing from $-q$ to $+q$. At distances $r\gg d$ its field approaches that of an **ideal dipole**,
$$\mathbf E = \frac{1}{4\pi\varepsilon_0}\,\frac{3(\mathbf p\cdot\hat{\mathbf r})\hat{\mathbf r}-\mathbf p}{r^3},\qquad E_r = \frac{2p\cos\theta}{4\pi\varepsilon_0 r^3},\quad E_\theta = \frac{p\sin\theta}{4\pi\varepsilon_0 r^3},$$
with $\theta$ measured from $\mathbf p$: it falls off like $1/r^3$, one power faster than the field of a single charge. The ideal dipole is the limit $d\to0$, $q\to\infty$ with $p$ fixed; its field lines are the curves $r = C\sin^2\theta$.`,
      idea: String.raw`Superpose the two Coulomb fields (em-1.4). Far away the charges look almost coincident and their fields nearly cancel; expanding $1/|\mathbf r\mp\mathbf d/2|^2$ to first order in $d/r$ leaves a remainder proportional to $qd/r^3$ — only the product $p = qd$ survives, so all dipoles with the same $p$ look alike from afar. The next correction is smaller by a further factor $d/r$. Field lines satisfy $dr/(r\,d\theta) = E_r/E_\theta = 2\cot\theta$, which integrates to $r\propto\sin^2\theta$.`,
      caption: String.raw`The solid lines are the field lines of the $\pm q$ pair, the dashed green curves those of the ideal dipole with the same $p = 2$ nC·cm. Shrink $d$ (keeping $p$ fixed, so $q$ grows) and the pair’s pattern closes in on the ideal one. Drag the gold probe: the right panel plots $|\mathbf E|$ along the ray from the centre through it, on log–log axes. Inside the pair the field levels off; beyond a few $d$ it runs parallel to the ideal dipole (slope $-3$), steeper than the field of one charge alone (slope $-2$).`,
      scope: String.raw`The ideal-dipole formula is accurate to order $(d/r)^2$ for a symmetric pair; for a general neutral distribution it is the leading term of the multipole expansion when $\mathbf p\neq0$.`,
      deps: ['em-1.4'],
      refs: ['Griffiths §3.4', 'Feynman II ch. 6'],
      tags: ['dipole', 'field'],
      viz(v) {
        const M = v.M, C = M.CONST, kE = C.ke * 1e-5, P0 = 2; // p in nC·cm
        const s = v.stage({ x: [-6, 6], y: [-3.8, 3.8], equal: true, height: 360, axes: false, weight: 1.45 });
        const sp = v.stage({ x: [0.05, 30], y: [1, 1e9], xlog: true, ylog: true, height: 360, axes: 'box', weight: 1, xlabel: 'distance r (cm)', title: '$|\\mathbf E|$ (N/C) along the probe’s direction' });
        const dS = v.slider('separation $d$ (at fixed $p = qd$)', 0.1, 3, 1.6, { log: true, fmt: (x) => `${x.toPrecision(2)} cm` });
        const F = v.fields(s, { law: '3d', sources: [{ type: 'charge', x: 0.8, y: 0, q: 1.25, draggable: false }, { type: 'charge', x: -0.8, y: 0, q: -1.25, draggable: false }], lineDensity: 8, lineAlpha: 0.75 });
        const P = s.handle(2.6, 2.0, { color: 'gold', r: 7, label: '$P$' });
        const pair = (x, y, d) => { const q = P0 / d; return coul([{ x: d / 2, y: 0, q }, { x: -d / 2, y: 0, q: -q }], x, y).map((c) => c * kE); };
        const ideal = (x, y) => { const r2 = x * x + y * y, r = Math.sqrt(r2), pr = (P0 * x) / r; return [((3 * pr * x) / r - P0) / (r2 * r), ((3 * pr * y) / r) / (r2 * r)].map((c) => c * kE); };
        let st = null;
        v.render(() => {
          const d = dS.value, q = P0 / d;
          F.sources[0].x = d / 2; F.sources[1].x = -d / 2; F.sources[0].q = q; F.sources[1].q = -q; F.o.lineDensity = 14 / q;
          // ideal dipole lines r = C sin²θ
          for (const Cc of [0.9, 1.5, 2.5, 4, 6.5, 11, 18]) for (const sg of [1, -1]) s.curve((t) => { const r = Cc * Math.sin(t) ** 2; return [r * Math.cos(t), sg * r * Math.sin(t)]; }, 0.02, Math.PI - 0.02, { color: 'green', width: 1.4, dash: [5, 4], alpha: 0.8, n: 240 });
          F.draw();
          s.dot(d / 2, 0, { r: 7, color: 'red' }); s.dot(-d / 2, 0, { r: 7, color: 'blue' });
          s.text('+', d / 2, 0, { align: 'center', size: 11, weight: 700, color: 'panel', halo: false }); s.text('−', -d / 2, 0, { align: 'center', size: 11, weight: 700, color: 'panel', halo: false });
          const th = Math.atan2(P.y, P.x), ux = Math.cos(th), uy = Math.sin(th);
          s.line(0, 0, ux * 9, uy * 9, { color: 'gold', width: 1.2, dash: [4, 4] });
          const Ep = pair(P.x, P.y, d), Ei = ideal(P.x, P.y);
          arrowPx(s, P.x, P.y, Ep[0], Ep[1], 46, { color: 'gold', width: 3, head: 10 });
          // radial profile
          const prof = [], profI = [], prof1 = [];
          for (let k = 0; k <= 120; k++) { const r = 0.05 * Math.pow(600, k / 120); prof.push([r, Math.hypot(...pair(r * ux, r * uy, d))]); profI.push([r, Math.hypot(...ideal(r * ux, r * uy))]); prof1.push([r, (kE * q) / (r * r)]); }
          sp.path(prof1, { color: 'orange', dash: [3, 4], width: 1.5 });
          sp.path(profI, { color: 'green', dash: [6, 4], width: 1.8 });
          sp.clip(() => sp.path(prof, { color: 'accent', width: 2.6 }));
          sp.vline(d, { color: 'muted', dash: [2, 3], width: 1 });
          sp.text('r = d', d, 3, { size: 11, color: 'muted', dx: 4, align: 'left' });
          const r = Math.hypot(P.x, P.y); sp.dot(r, Math.hypot(...Ep), { r: 6, color: 'gold' });
          const sl = (rr) => { const a = Math.hypot(...pair(rr * 0.98 * ux, rr * 0.98 * uy, d)), b = Math.hypot(...pair(rr * 1.02 * ux, rr * 1.02 * uy, d)); return Math.log(b / a) / Math.log(1.02 / 0.98); };
          st = { Ep, Ei, r, q, slope: sl(r), slFar: sl(10 * d), slNear: sl(Math.max(0.06, 0.12 * d) + d / 2) };
        });
        v.legend([['ink', 'field lines of the $\\pm q$ pair'], ['green', 'ideal dipole $r = C\\sin^2\\theta$', { dash: true }], ['accent', '$|\\mathbf E|$ of the pair'], ['orange', 'one charge alone, $kq/r^2$', { dash: true }]]);
        v.readout(() => `$q = \\pm${v.fix(st.q, 2)}$ nC, $p = qd = 2$ nC·cm $= 2\\times10^{-11}$ C·m · at $P$: pair ${v.M.si(Math.hypot(...st.Ep), 'N/C')}, ideal dipole ${v.M.si(Math.hypot(...st.Ei), 'N/C')} (ratio ${v.fix(Math.hypot(...st.Ep) / Math.hypot(...st.Ei), 3)}) · local log–log slope at $P$: ${v.fix(st.slope, 2)}, at $r = 10d$: **${v.fix(st.slFar, 2)}**`);
      },
    },
    // ───────────────────────────────────────────────────────────── 1.12
    {
      num: '1.12',
      kind: 'Theorem',
      name: 'Torque and force on a dipole',
      statement: String.raw`A dipole $\mathbf p$ in a **uniform** field $\mathbf E$ feels no net force but a torque
$$\boldsymbol\tau = \mathbf p\times\mathbf E,$$
which turns $\mathbf p$ toward $\mathbf E$; its potential energy is $U = -\mathbf p\cdot\mathbf E$, lowest when aligned. In a **non-uniform** field the dipole also feels a net force
$$\mathbf F = (\mathbf p\cdot\nabla)\mathbf E \;=\; \nabla(\mathbf p\cdot\mathbf E)\quad(\text{for an electrostatic field}),$$
so an aligned dipole is pulled toward the region of stronger field. These are exact for an ideal dipole and the leading terms for a small one.`,
      idea: String.raw`Add the forces on the two charges (em-1.11). In a uniform field $q\mathbf E$ and $-q\mathbf E$ cancel, but they act at points $\pm\mathbf d/2$ from the centre, so their torques add to $\mathbf d\times q\mathbf E = \mathbf p\times\mathbf E$. If the field changes across the dipole, $q[\mathbf E(\mathbf r+\mathbf d/2)-\mathbf E(\mathbf r-\mathbf d/2)] \approx q(\mathbf d\cdot\nabla)\mathbf E$ to first order — the net force. Because the electrostatic field is curl-free (em-2.1), $(\mathbf p\cdot\nabla)\mathbf E = \nabla(\mathbf p\cdot\mathbf E)$ for constant $\mathbf p$, so the force is minus the gradient of $U$. This is why neutral bits of paper, which become dipoles aligned with the field, are drawn to a charged comb.`,
      caption: String.raw`Drag the dipole’s centre and the gold handle that sets its direction ($q = \pm2$ nC, $d = 1$ cm). Red and blue arrows are the forces on its two charges. The readout compares the torque and net force computed from those two forces with $\mathbf p\times\mathbf E$ and $(\mathbf p\cdot\nabla)\mathbf E$. The right panel plots the torque against the dipole’s direction: zero at alignment, where it is stable. Switch on *release* to see 1.2 s of the simulated motion (with light air damping): it swings into line — and in the field of a point charge, also drifts toward the stronger field.`,
      deps: ['em-1.11'],
      refs: ['Griffiths §4.1'],
      tags: ['dipole', 'torque'],
      viz(v) {
        const M = v.M, C = M.CONST, kE = C.ke * 1e-5, q = 2, d = 1, p = q * 1e-9 * d * 0.01, E0 = 5e4;
        const s = v.stage({ x: [-8, 8], y: [-4.5, 4.5], equal: true, height: 360, axes: false, weight: 1.5 });
        const sp = v.stage({ x: [-180, 180], y: [-1, 1], height: 360, axes: 'box', weight: 1, xlabel: 'direction of p (degrees)', xticks: [-180, -90, 0, 90, 180], title: 'torque on the dipole (µN·m)' });
        const kind = v.select('field', [{ value: 'uni', label: 'uniform, 50 kN/C' }, { value: 'pt', label: 'point charge +20 nC' }], 'pt');
        const rel = v.toggle('release (show 1.2 s of motion)', true);
        const Qh = s.handle(-5.5, -0.6, { color: 'red', r: 10, label: '$Q$', labelPos: 'n' });
        const c = s.handle(2.4, 1.3, { color: 'accent', r: 5 }), t = s.handle(2.4 + 1.6 * Math.cos(2.3), 1.3 + 1.6 * Math.sin(2.3), { color: 'gold', r: 6 });
        let last = [c.x, c.y]; c.onDrag = () => { t.x += c.x - last[0]; t.y += c.y - last[1]; last = [c.x, c.y]; };
        const field = (x, y) => (kind.value === 'uni' ? [E0, 0] : coul([{ x: Qh.x, y: Qh.y, q: 20 }], x, y).map((g) => g * kE));
        /** Forces on the two charges (N) of a dipole centred at (x, y) cm pointing at angle a. */
        const forces = (x, y, a) => {
          const hx = (d / 2) * Math.cos(a), hy = (d / 2) * Math.sin(a), Ep = field(x + hx, y + hy), Em = field(x - hx, y - hy);
          return { Fp: [Ep[0] * q * 1e-9, Ep[1] * q * 1e-9], Fm: [-Em[0] * q * 1e-9, -Em[1] * q * 1e-9], hx, hy };
        };
        const torque = (x, y, a) => { const f = forces(x, y, a); return (f.hx * f.Fp[1] - f.hy * f.Fp[0] - f.hx * f.Fm[1] + f.hy * f.Fm[0]) * 0.01; };
        /** Rigid dumbbell (two 0.1 g beads) released from rest; RK4 with light damping. */
        const simulate = (x0, y0, a0) => {
          const m = 2e-4, I = 2 * 1e-4 * (d * 0.005) ** 2, gT = 0.6, gR = 2.5, dt = 0.002, out = [];
          let S = [x0 * 0.01, y0 * 0.01, a0, 0, 0, 0];
          const der = (S) => {
            const f = forces(S[0] * 100, S[1] * 100, S[2]), Fx = f.Fp[0] + f.Fm[0], Fy = f.Fp[1] + f.Fm[1], tq = torque(S[0] * 100, S[1] * 100, S[2]);
            return [S[3], S[4], S[5], Fx / m - gT * S[3], Fy / m - gT * S[4], tq / I - gR * S[5]];
          };
          for (let k = 0; k <= 600; k++) {
            if (k % 75 === 0) out.push([S[0] * 100, S[1] * 100, S[2]]);
            const k1 = der(S), k2 = der(S.map((v0, i) => v0 + (dt / 2) * k1[i])), k3 = der(S.map((v0, i) => v0 + (dt / 2) * k2[i])), k4 = der(S.map((v0, i) => v0 + dt * k3[i]));
            S = S.map((v0, i) => v0 + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
            const X = S[0] * 100, Y = S[1] * 100;
            if (Math.abs(X) > 8.5 || Math.abs(Y) > 5 || (kind.value === 'pt' && Math.hypot(X - Qh.x, Y - Qh.y) < 0.9)) { out.push([X, Y, S[2]]); break; }
          }
          return out;
        };
        const dumbbell = (x, y, a, alpha, ghost) => {
          const hx = (d / 2) * Math.cos(a), hy = (d / 2) * Math.sin(a);
          s.line(x - hx, y - hy, x + hx, y + hy, { color: 'muted', width: ghost ? 2 : 3, alpha });
          s.dot(x + hx, y + hy, { r: ghost ? 5 : 7, color: 'red', alpha, ring: !ghost }); s.dot(x - hx, y - hy, { r: ghost ? 5 : 7, color: 'blue', alpha, ring: !ghost });
        };
        let st = null;
        v.render(() => {
          Qh.visible = kind.value === 'pt';
          const a = Math.atan2(t.y - c.y, t.x - c.x);
          // background field arrows
          for (let x = -7.5; x <= 7.6; x += 1) for (let y = -4; y <= 4.1; y += 1) { const E = field(x, y), m = Math.hypot(...E); if (!isFinite(m) || (kind.value === 'pt' && Math.hypot(x - Qh.x, y - Qh.y) < 0.8)) continue; arrowMid(s, x, y, E[0], E[1], Math.min(26, 6 + 14 * Math.sqrt(m / E0)), { color: 'accent', alpha: 0.35, width: 1.3, head: 6 }); }
          if (rel.value) {
            const tr = simulate(c.x, c.y, a);
            s.path(tr.map((g) => [g[0], g[1]]), { color: 'gold', width: 1.6, dash: [4, 3] });
            tr.slice(1).forEach((g, i) => dumbbell(g[0], g[1], g[2], 0.14 + (0.26 * i) / tr.length, true));
          }
          const f = forces(c.x, c.y, a);
          dumbbell(c.x, c.y, a, 1);
          const big = Math.max(Math.hypot(...f.Fp), Math.hypot(...f.Fm), 1e-12), sc = 55 / big;
          arrowPx(s, c.x + f.hx, c.y + f.hy, f.Fp[0], f.Fp[1], Math.hypot(...f.Fp) * sc, { color: 'red', width: 2.6, head: 9 });
          arrowPx(s, c.x - f.hx, c.y - f.hy, f.Fm[0], f.Fm[1], Math.hypot(...f.Fm) * sc, { color: 'blue', width: 2.6, head: 9 });
          s.line(c.x, c.y, t.x, t.y, { color: 'gold', width: 1.2, dash: [3, 3] });
          s.tex(String.raw`\mathbf p`, t.x, t.y, { color: 'gold', size: 14, dx: 12, dy: -10 });
          // torque against direction at this position
          const tq = []; for (let k = 0; k <= 180; k++) { const ang = -Math.PI + (TAU * k) / 180; tq.push([(ang * 180) / Math.PI, torque(c.x, c.y, ang) * 1e6]); }
          const Ec = field(c.x, c.y), pE = p * Math.hypot(...Ec) * 1e6, aE = Math.atan2(Ec[1], Ec[0]);
          const ym = Math.max(...tq.map((g) => Math.abs(g[1])), pE) * 1.25; sp.setView([-180, 180], [-ym, ym]);
          sp.hline(0, { color: 'faint', width: 1 });
          sp.fn((deg) => -pE * Math.sin((deg * Math.PI) / 180 - aE), { color: 'green', dash: [6, 4], width: 1.8 });
          sp.path(tq, { color: 'accent', width: 2.4 });
          const degE = (aE * 180) / Math.PI; sp.vline(degE, { color: 'green', width: 1, alpha: 0.6 }); sp.text('aligned', degE, ym * 0.9, { size: 11, color: 'green', dx: 5 });
          sp.dot((a * 180) / Math.PI, torque(c.x, c.y, a) * 1e6, { r: 6, color: 'gold' });
          // derivatives for (p·∇)E by central differences (h = 1 µm)
          const h = 1e-4, pxv = Math.cos(a), pyv = Math.sin(a), Ea = field(c.x + h * pxv, c.y + h * pyv), Eb = field(c.x - h * pxv, c.y - h * pyv);
          const pgE = [(p * (Ea[0] - Eb[0])) / (2 * h * 0.01), (p * (Ea[1] - Eb[1])) / (2 * h * 0.01)];
          st = { tau: torque(c.x, c.y, a), pxE: p * (pxv * Ec[1] - pyv * Ec[0]), F: [f.Fp[0] + f.Fm[0], f.Fp[1] + f.Fm[1]], pgE, U: -p * (pxv * Ec[0] + pyv * Ec[1]) };
        });
        v.legend([['accent', 'torque from the two forces'], ['green', '$(\\mathbf p\\times\\mathbf E)_z$ at the centre', { dash: true }], ['gold', 'released motion (path of the centre)', { dash: true }]]);
        v.readout(() => {
          const { tau, pxE, F, pgE, U } = st, Fm = Math.hypot(...F), G = Math.hypot(...pgE);
          return `torque from the forces ${v.M.si(tau, 'N·m')}, $(\\mathbf p\\times\\mathbf E)_z$ = ${v.M.si(pxE, 'N·m')} · net force ${v.M.si(Fm, 'N')}, $|(\\mathbf p\\cdot\\nabla)\\mathbf E|$ = ${v.M.si(G, 'N')}` + (G > 0 ? ` (angle between them ${v.fix((Math.acos(Math.max(-1, Math.min(1, (F[0] * pgE[0] + F[1] * pgE[1]) / (Fm * G || 1)))) * 180) / Math.PI, 1)}°)` : '') + ` · $U = -\\mathbf p\\cdot\\mathbf E$ = ${v.M.si(U, 'J')}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.13
    {
      num: '1.13',
      kind: 'Definition',
      name: 'Electric flux',
      statement: String.raw`The **flux** of $\mathbf E$ through an oriented surface $S$ with unit normal $\hat{\mathbf n}$ is
$$\Phi_E = \int_S \mathbf E\cdot\hat{\mathbf n}\,da \qquad(\text{unit N}\,\text{m}^2/\text{C} = \text{V}\,\text{m}).$$
For a flat patch of area $A$ in a uniform field it is $\Phi_E = EA\cos\theta$, $\theta$ being the angle between $\mathbf E$ and $\hat{\mathbf n}$: largest when the patch faces the field, zero when the field skims along it, and negative when $\hat{\mathbf n}$ points against the field. Reversing the orientation reverses the sign. With field lines drawn at a density proportional to $|\mathbf E|$, the flux is proportional to the net number of lines crossing $S$.`,
      idea: String.raw`Only the component of the field along the normal carries anything *through* the surface; the tangential part slides along it. So the flux through a small patch is $E_\perp\,da$, and the flux through a curved surface is the sum of those pieces — a surface integral (vcalc-6.9, pma-10.49). The name comes from fluids: for a velocity field the same integral is the volume crossing $S$ per second. Counting field lines (em-1.6) makes it tangible: tilt a window and fewer lines pass through it, in proportion to $\cos\theta$.`,
      caption: String.raw`Tilt, turn and stretch the patch, or flip its normal; rotate the 3D view by dragging it. Lines crossing the patch turn gold, and the readout compares their net number with the flux computed by integrating $\mathbf E\cdot\hat{\mathbf n}$ over the patch. The right panel plots the flux against the tilt: a cosine for the uniform field. In the field of a point charge the integral is done numerically and the curve is no longer a cosine.`,
      deps: ['em-1.5', 'pma-10.49', 'vcalc-6.9'],
      refs: ['Griffiths §2.2', 'Purcell ch. 1'],
      tags: ['flux', 'surface integral'],
      viz(v) {
        const M = v.M, C = M.CONST, E0 = 1000, H = 0.5, qn = 1, Q0 = [-3.2, 0, 0], NL = 320;
        const s3 = v.stage3d({ range: 4.2, height: 360, yaw: -0.95, pitch: 0.3, labels: ['x', 'y', 'z'], axes: false, weight: 1.25 });
        const sp = v.stage({ x: [0, 180], y: [-1, 1], height: 360, axes: 'box', weight: 1, xlabel: 'tilt θ (degrees)', xticks: [0, 45, 90, 135, 180], title: 'flux through the patch (N·m²/C)' });
        const kind = v.select('field', [{ value: 'uni', label: 'uniform, 1 kN/C along x' }, { value: 'pt', label: 'point charge 1 nC' }], 'uni');
        const th = v.slider('tilt θ of the normal from x', 0, 180, 35, { step: 1, fmt: (x) => `${x}°` });
        const ps = v.slider('turn about x', -180, 180, 30, { step: 1, fmt: (x) => `${x}°` });
        const wa = v.slider('width', 0.5, 5, 3, { step: 0.1, fmt: (x) => `${x.toFixed(1)} cm` }), hb = v.slider('height', 0.5, 5, 2.4, { step: 0.1, fmt: (x) => `${x.toFixed(1)} cm` });
        const flip = v.toggle('flip the normal', false);
        // Fibonacci directions for the point charge’s lines
        const dirs = []; for (let i = 0; i < NL; i++) { const z = 1 - (2 * (i + 0.5)) / NL, r = Math.sqrt(1 - z * z), a = i * Math.PI * (3 - Math.sqrt(5)); dirs.push([z, r * Math.cos(a), r * Math.sin(a)]); }
        const GL = [[-0.9739065285, 0.0666713443], [-0.8650633667, 0.1494513492], [-0.6794095683, 0.2190863625], [-0.4333953941, 0.2692667193], [-0.1488743390, 0.2955242247], [0.1488743390, 0.2955242247], [0.4333953941, 0.2692667193], [0.6794095683, 0.2190863625], [0.8650633667, 0.1494513492], [0.9739065285, 0.0666713443]];
        const frame = (tdeg, pdeg) => {
          const t = (tdeg * Math.PI) / 180, p = (pdeg * Math.PI) / 180, sg = flip.value ? -1 : 1;
          const n = [Math.cos(t), Math.sin(t) * Math.cos(p), Math.sin(t) * Math.sin(p)];
          const u = unit3(Math.abs(n[2]) < 0.95 ? cross3(n, [0, 0, 1]) : cross3(n, [0, 1, 0])), w = cross3(n, u);
          return { n: n.map((c) => c * sg), u, w };
        };
        const Efield = (P) => {
          if (kind.value === 'uni') return [E0, 0, 0];
          const d = [P[0] - Q0[0], P[1] - Q0[1], P[2] - Q0[2]], r = Math.hypot(...d) * 0.01, k = (C.ke * qn * 1e-9) / (r * r * r) * 0.01;
          return d.map((c) => c * k);
        };
        /** Flux through the patch: exact for the uniform field, 10×10 Gauss–Legendre per 2×2 sub-panels for the point charge. */
        const flux = (F, a, b) => {
          if (kind.value === 'uni') return E0 * F.n[0] * a * b * 1e-4;
          let s = 0;
          for (let I = 0; I < 2; I++) for (let J = 0; J < 2; J++) for (const [xi, wi] of GL) for (const [yj, wj] of GL) {
            const S = (a / 2) * ((I - 0.5) + xi / 2), T = (b / 2) * ((J - 0.5) + yj / 2), P = [F.u[0] * S + F.w[0] * T, F.u[1] * S + F.w[1] * T, F.u[2] * S + F.w[2] * T];
            s += wi * wj * dot3(Efield(P), F.n);
          }
          return s * (a / 4) * (b / 4) * 1e-4;
        };
        let st = null;
        v.render(() => {
          const F = frame(th.value, ps.value), a = wa.value, b = hb.value, uni = kind.value === 'uni';
          const inside = (P) => { const S = dot3(P, F.u), T = dot3(P, F.w); return Math.abs(S) <= a / 2 && Math.abs(T) <= b / 2; };
          let cnt = 0, lines = 0;
          if (uni) {
            for (let y = -3; y <= 3.001; y += H) for (let z = -3; z <= 3.001; z += H) {
              let hit = false, xh = 0;
              if (Math.abs(F.n[0]) > 1e-9) { const x = -(F.n[1] * y + F.n[2] * z) / F.n[0]; if (Math.abs(x) < 4.2 && inside([x, y, z])) { hit = true; xh = x; cnt += Math.sign(F.n[0]); } }
              if (hit) { s3.line([-4, y, z], [xh, y, z], { color: 'gold', width: 2 }); s3.arrow([xh, y, z], [4, y, z], { color: 'gold', width: 2, head: 6 }); }
              else if (Math.abs(y / H) % 2 < 0.01 && Math.abs(z / H) % 2 < 0.01) s3.arrow([-4, y, z], [4, y, z], { color: 'accent', alpha: 0.25, width: 1.1, head: 6 });
              lines++;
            }
          } else {
            s3.dot(Q0, { r: 8, color: 'red' });
            for (const dv of dirs) {
              const nd = dot3(F.n, dv); let hit = false, tt = 6;
              let th0 = 0;
              if (Math.abs(nd) > 1e-9) { const t0 = dot3(F.n, [-Q0[0], -Q0[1], -Q0[2]]) / nd; if (t0 > 0) { const P = [Q0[0] + t0 * dv[0], Q0[1] + t0 * dv[1], Q0[2] + t0 * dv[2]]; if (inside(P)) { hit = true; th0 = t0; cnt += Math.sign(nd); tt = Math.max(t0 + 1.4, 3); } } }
              const at = (u) => [Q0[0] + u * dv[0], Q0[1] + u * dv[1], Q0[2] + u * dv[2]];
              if (hit) { s3.line(Q0, at(th0), { color: 'gold', width: 1.8 }); s3.line(at(th0), at(tt), { color: 'gold', width: 1.8 }); }
              else if (dv[0] > 0.55) s3.line(Q0, at(tt), { color: 'accent', alpha: 0.22, width: 1 });
            }
          }
          const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => [0, 1, 2].map((k) => F.u[k] * i * a / 2 + F.w[k] * j * b / 2));
          const Phi = flux(F, a, b), col = Phi >= 0 ? 'green' : 'red';
          s3.poly(corners, { fill: col, fillAlpha: 0.28, color: col, width: 1.6 });
          s3.arrow([0, 0, 0], F.n.map((c) => c * 1.8), { color: col, width: 3, head: 10 });
          s3.tex(String.raw`\hat{\mathbf n}`, F.n.map((c) => c * 2.15), { color: col, size: 15 });
          const per = uni ? E0 * H * H * 1e-4 : (qn * 1e-9) / C.eps0 / NL;
          // flux against tilt
          const curve = []; for (let k = 0; k <= 90; k++) { const tdeg = 2 * k; curve.push([tdeg, flux(frame(tdeg, ps.value), a, b)]); }
          const ym = Math.max(...curve.map((g) => Math.abs(g[1])), 1e-9) * 1.25; sp.setView([0, 180], [-ym, ym]);
          sp.hline(0, { color: 'faint', width: 1 });
          sp.path(curve, { color: 'accent', width: 2.4 });
          if (uni) sp.fn((x) => E0 * a * b * 1e-4 * Math.cos((x * Math.PI) / 180) * (flip.value ? -1 : 1), { color: 'green', dash: [6, 4], width: 1.6 });
          sp.dot(th.value, Phi, { r: 6, color: 'gold' });
          sp.dot(th.value, cnt * per, { r: 4, color: 'ink', hollow: true });
          st = { Phi, cnt, per };
        });
        v.legend([['accent', 'computed flux'], ['green', '$EA\\cos\\theta$ (uniform field)', { dash: true }], ['gold', 'lines through the patch', { dot: true }], ['ink', 'line count × flux per line', { dot: true }]]);
        v.readout(() => `$\\Phi_E = \\int\\mathbf E\\cdot\\hat{\\mathbf n}\\,da$ = **${v.fix(st.Phi, 4)} N·m²/C** · ${st.cnt >= 0 ? '' : '−'}${Math.abs(st.cnt)} net lines cross the patch, each carrying ${v.fix(st.per, 3)} N·m²/C → ${v.fix(st.cnt * st.per, 3)} N·m²/C` + (flip.value ? ' · normal flipped: the sign reverses' : ''));
      },
    },
    // ───────────────────────────────────────────────────────────── 1.14
    {
      num: '1.14',
      kind: 'Law',
      name: 'Gauss’s law',
      statement: String.raw`The flux of the electric field out of any **closed** surface $S$ equals the total charge inside divided by $\varepsilon_0$:
$$\oint_S \mathbf E\cdot d\mathbf a = \frac{Q_{\text{enc}}}{\varepsilon_0},$$
whatever the shape and size of $S$ and wherever the charges outside it are — outside charges contribute zero net flux. A point charge lying exactly on a smooth surface contributes half its flux (the surface is then not a valid Gaussian surface for it). The law holds for time-dependent fields too, as the first of Maxwell’s equations.`,
      idea: String.raw`For one point charge and a sphere centred on it, $E = q/4\pi\varepsilon_0r^2$ times the area $4\pi r^2$ gives $q/\varepsilon_0$, independent of $r$ — the inverse square (em-1.3) exactly cancels the growth of area. Any closed surface can be built from patches seen from the charge within small cones; each patch, tilted and at its own distance, carries the same flux as the matching piece of a sphere, because tilt and distance only change its area in the way that the field compensates. A charge outside sees every cone cross the surface twice, once in and once out, with equal and opposite flux. Superposition (em-1.4) adds the charges, and the divergence theorem turns this into a local law (em-1.15, vcalc-8.4). With any exponent other than 2 the cancellation fails and the flux depends on the surface.`,
      caption: String.raw`The charges are long line charges seen end-on ($\lambda$ in nC/m) and the green curve is the cross-section of a closed cylinder, so the readout is the flux per metre — an exact slice of Gauss’s law in 3D; the last option uses true point charges and a sphere. Drag charges (click one to flip its sign, click empty space to add one) and the surface’s handles. The right panel slides the surface sideways: the flux is a staircase that jumps by $\lambda/\varepsilon_0$ exactly when a charge crosses the boundary. Open the surface and it stops being a staircase; move the exponent off 2 and the steps tilt, so the flux depends on where the surface is. Drop a charge onto the surface: it counts half.`,
      scope: String.raw`Exact for electrostatic fields obeying an inverse-square law, in vacuum or (with $\mathbf D$ and free charge) in matter; for moving charges it remains true as one of Maxwell’s equations.`,
      credit: 'Lagrange, 1773; Gauss, 1813 and 1839',
      deps: ['em-1.13', 'em-1.3', 'em-1.4', 'vcalc-8.4'],
      refs: ['Griffiths §2.2', 'Purcell ch. 1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gauss%27s_law' },
      tags: ['gauss', 'flux'],
      viz(v) {
        const M = v.M, C = M.CONST, KF = 1e-9 / C.eps0;
        const s = v.stage({ x: [-6.2, 6.2], y: [-3.7, 3.7], equal: true, height: 380, axes: false, weight: 1.6 });
        const sp = v.stage({ x: [-6, 6], y: [-1, 1], height: 380, axes: 'box', weight: 1, xlabel: 'sideways shift of the surface (cm)' });
        const shape = v.select('surface', [{ value: 'circle', label: 'cylinder' }, { value: 'poly', label: 'prism: drag its corners' }, { value: 'open', label: 'open: one side missing' }, { value: 'sphere', label: 'sphere, point charges' }], 'poly');
        const nexp = v.slider('force-law exponent $n$', 1.8, 2.2, 2, { step: 0.01 });
        const init = [[-1.6, 0.5, 3], [1.0, -0.9, -2], [3.9, 1.5, 2], [-4.6, -1.9, -1], [9, 9, 0], [9, 9, 0]];
        let Fk = null;
        const three = () => shape.value === 'sphere';
        /** Field in kit units: Σ q r̂ r^{1−n}/2π (line charges) or Σ q r̂ r^{−n}/4π (point charges); n = 2 gives flux = q. */
        const fieldAt = (src, n, th) => (x, y) => {
          let u = 0, w = 0;
          for (const q of src) { const dx = x - q.x, dy = y - q.y, r2 = dx * dx + dy * dy; if (r2 < 1e-20) return [NaN, NaN]; const k = th ? (q.q / (2 * TAU)) * Math.pow(r2, -(n + 1) / 2) : (q.q / TAU) * Math.pow(r2, -n / 2); u += k * dx; w += k * dy; }
          return [u, w];
        };
        Fk = v.fields(s, { sources: init.map(([x, y, q]) => ({ type: 'charge', x, y, q, label: '' })), F: (x, y) => fieldAt(Fk.live().filter((q) => q.q), nexp.value, three())(x, y), lineDensity: 4, lineAlpha: 0.45, lineWidth: 1.1 });
        const H = Fk.handles;
        const cc = s.handle(-0.6, -0.1, { color: 'green', r: 6 }), cr = s.handle(-0.6 + 2.6 * Math.cos(0.75), -0.1 + 2.6 * Math.sin(0.75), { color: 'green', r: 5 });
        let lastC = [cc.x, cc.y]; cc.onDrag = () => { cr.x += cc.x - lastC[0]; cr.y += cc.y - lastC[1]; lastC = [cc.x, cc.y]; };
        const ph = [[-3.3, -1.0], [-0.6, -2.5], [2.2, -1.6], [1.4, 1.9], [-1.4, 2.6], [-3.5, 1.4]].map(([x, y]) => s.handle(x, y, { color: 'green', r: 5 }));
        s.onClick((x, y) => {
          const X = s.X(x), Y = s.Y(y), near = (h) => h.visible !== false && Math.hypot(s.X(h.x) - X, s.Y(h.y) - Y) < 14;
          for (let i = 0; i < H.length; i++) if (Fk.sources[i].q && near(H[i])) { Fk.setStrength(i, -Fk.sources[i].q); return; }
          if ([cc, cr, ...ph].some(near)) return;
          const j = Fk.sources.findIndex((q) => q.q === 0); if (j >= 0) { H[j].set(x, y); Fk.setStrength(j, 1); }
        });
        const fluxPoly = (pts, closed, F, src) => {
          const sg = polyArea(pts) >= 0 ? 1 : -1, m = closed ? pts.length : pts.length - 1; let tot = 0;
          for (let i = 0; i < m; i++) {
            const p = pts[i], q = pts[(i + 1) % pts.length], ex = q[0] - p[0], ey = q[1] - p[1];
            tot += sg * quadBreaks((t) => { const f = F(p[0] + t * ex, p[1] + t * ey); return f[0] * ey - f[1] * ex; }, 0, 1, src.map((c) => nearSeg(c.x, c.y, p, q).t), 1e-9);
          }
          return tot;
        };
        const fluxCircle = (cx, cy, r, F, src) => quadBreaks((a) => { const ca = Math.cos(a), sa = Math.sin(a), f = F(cx + r * ca, cy + r * sa); return (f[0] * ca + f[1] * sa) * r; }, 0, TAU, src.map((c) => { const a = Math.atan2(c.y - cy, c.x - cx); return a < 0 ? a + TAU : a; }), 1e-9);
        /** Flux of point charges through a sphere (centre in the plane): an integral over the polar angle, u = 1 − w². */
        const fluxSphere = (cx, cy, R, src, n) => {
          let tot = 0;
          for (const c of src) {
            const D = Math.hypot(c.x - cx, c.y - cy), w0 = Math.abs(R - D) / Math.sqrt(Math.max(R * D, 1e-12));
            const g = (w) => { const u = 1 - w * w, d2 = (R - D) ** 2 + 2 * R * D * w * w; return d2 <= 1e-30 ? 0 : ((R - D * u) / Math.pow(d2, (n + 1) / 2)) * 2 * w; };
            tot += (c.q / 2) * R * R * quadBreaks(g, 0, Math.SQRT2, [w0 / 2, w0, 2 * w0], 1e-10, 24);
          }
          return tot;
        };
        let st = null, key = '', slide = null;
        v.render(() => {
          const mode = shape.value, circ = mode === 'circle' || mode === 'sphere', n = nexp.value;
          cc.visible = cr.visible = circ; ph.forEach((h) => (h.visible = !circ));
          H.forEach((h, i) => { h.visible = Fk.sources[i].q !== 0; h.label = Fk.sources[i].q ? `${Fk.sources[i].q > 0 ? '+' : '−'}${Math.abs(Fk.sources[i].q)}` : ''; });
          const R = Math.max(0.3, Math.hypot(cr.x - cc.x, cr.y - cc.y)), pts = ph.map((h) => [h.x, h.y]);
          // snap a charge that sits within 3 px of the surface exactly onto it
          const src0 = Fk.live().filter((q) => q.q);
          Fk.sources.forEach((q, i) => {
            if (!q.q) return; const h = H[i], tol = 3 / s.sx;
            if (circ) { const d = Math.hypot(h.x - cc.x, h.y - cc.y); if (Math.abs(d - R) < tol && d > 0) { h.x = cc.x + ((h.x - cc.x) * R) / d; h.y = cc.y + ((h.y - cc.y) * R) / d; } }
            else { const m = mode === 'open' ? pts.length - 1 : pts.length; let best = null; for (let k = 0; k < m; k++) { const c = nearSeg(h.x, h.y, pts[k], pts[(k + 1) % pts.length]); if (!best || c.d < best.d) best = c; } if (best && best.d < tol) { h.x = best.x; h.y = best.y; } }
          });
          void src0;
          const src = Fk.live().filter((q) => q.q), F = fieldAt(src, n, three());
          Fk.draw();
          // the surface, with arrows of E·n
          const curvePts = circ ? Array.from({ length: 160 }, (_, k) => [cc.x + R * Math.cos((TAU * k) / 160), cc.y + R * Math.sin((TAU * k) / 160)]) : pts;
          if (mode === 'open') { s.path(pts, { color: 'green', width: 2.6 }); s.line(pts[pts.length - 1][0], pts[pts.length - 1][1], pts[0][0], pts[0][1], { color: 'green', width: 1.2, dash: [3, 5], alpha: 0.6 }); }
          else s.poly(curvePts, { color: 'green', width: 2.4, fill: 'green', fillAlpha: 0.07 });
          const sg = polyArea(curvePts) >= 0 ? 1 : -1, samp = [];
          const segs = mode === 'open' ? pts.length - 1 : curvePts.length;
          let tot = 0; const lens = []; for (let k = 0; k < segs; k++) { const p = curvePts[k], q = curvePts[(k + 1) % curvePts.length]; lens.push(Math.hypot(q[0] - p[0], q[1] - p[1])); tot += lens[k]; }
          const nA = Math.max(10, Math.min(34, Math.round((tot * s.sx) / 30)));
          for (let j = 0; j < nA; j++) { let target = ((j + 0.5) * tot) / nA, k = 0; while (k < segs - 1 && target > lens[k]) { target -= lens[k]; k++; } const p = curvePts[k], q = curvePts[(k + 1) % curvePts.length], f = target / (lens[k] || 1); samp.push([p[0] + f * (q[0] - p[0]), p[1] + f * (q[1] - p[1]), (sg * (q[1] - p[1])) / (lens[k] || 1), (-sg * (q[0] - p[0])) / (lens[k] || 1)]); }
          const vals = samp.map(([x, y, nx, ny]) => { const f = F(x, y); return f[0] * nx + f[1] * ny; }), mx = Math.max(1e-12, ...vals.filter(isFinite).map(Math.abs));
          samp.forEach(([x, y, nx, ny], j) => { const val = vals[j]; if (!isFinite(val)) return; const L = 22 * Math.sqrt(Math.abs(val) / mx); if (L < 2) return; arrowPx(s, x, y, nx * Math.sign(val), ny * Math.sign(val), L, { color: val > 0 ? 'green' : 'red', width: 1.8, head: 6.5, alpha: 0.9 }); });
          // flux and enclosed charge
          const fl = (dx) => {
            if (mode === 'sphere') return fluxSphere(cc.x + dx, cc.y, R, src, n);
            if (mode === 'circle') return fluxCircle(cc.x + dx, cc.y, R, F, src);
            return fluxPoly(pts.map((p) => [p[0] + dx, p[1]]), mode !== 'open', F, src);
          };
          const enc = (dx) => {
            let qin = 0, on = 0;
            for (const c of src) {
              if (circ) { const d = Math.hypot(c.x - cc.x - dx, c.y - cc.y); if (Math.abs(d - R) < 1e-7) { qin += c.q / 2; on++; } else if (d < R) qin += c.q; }
              else { const P = pts.map((p) => [p[0] + dx, p[1]]); let dm = Infinity; for (let k = 0; k < P.length; k++) dm = Math.min(dm, nearSeg(c.x, c.y, P[k], P[(k + 1) % P.length]).d); if (dm < 1e-7) { qin += c.q / 2; on++; } else if (inPoly(c.x, c.y, P)) qin += c.q; }
            }
            return { qin, on };
          };
          const Phi = fl(0), E0 = enc(0);
          const k2 = [mode, n, R, cc.x, cc.y, ...pts.flat(), ...src.flatMap((c) => [c.x, c.y, c.q])].join('|');
          if (k2 !== key) { key = k2; slide = []; for (let i = 0; i <= 160; i++) { const dx = -6 + (12 * i) / 160; slide.push([dx, fl(dx) * KF, mode === 'open' ? NaN : enc(dx).qin * KF]); } }
          const unit = 'V·m';
          sp.setTitle(three() ? 'flux through the sphere (V·m) as it slides sideways' : 'flux per metre of length (V·m) as the surface slides sideways');
          const all = slide.flatMap((g) => [g[1], g[2]]).filter(isFinite), lo = Math.min(0, ...all), hi = Math.max(0, ...all), pad = (hi - lo) * 0.15 + 1;
          sp.setView([-6, 6], [lo - pad, hi + pad]);
          sp.hline(0, { color: 'faint', width: 1 }); sp.vline(0, { color: 'gold', width: 1.2, dash: [4, 3] });
          if (mode !== 'open') sp.path(slide.map((g) => [g[0], g[2]]), { color: 'green', width: 5, alpha: 0.3 });
          sp.path(slide.map((g) => [g[0], g[1]]), { color: 'accent', width: 2.2 });
          sp.dot(0, Phi * KF, { r: 6, color: 'gold' });
          st = { Phi: Phi * KF, qin: E0.qin, on: E0.on, unit };
        });
        v.legend([['green', 'out of the surface ($\\mathbf E\\cdot\\hat{\\mathbf n}>0$)'], ['red', 'into it'], ['accent', 'flux, slid sideways'], ['green', '$Q_{\\text{enc}}/\\varepsilon_0$', { area: true }]]);
        v.readout(() => {
          const { Phi, qin, on, unit } = st, three_ = three(), qs = three_ ? 'q' : '\\lambda';
          if (shape.value === 'open') return `flux through the open surface: ${M.si(Phi, unit, 6)} per metre of length — an open surface encloses nothing to compare with: its flux still jumps when a charge crosses one of its sides, but drifts smoothly while charges pass the gap`;
          const ok = Math.abs(Phi - qin * KF) <= 1e-6 * Math.max(1, Math.abs(Phi));
          return `flux out of the ${three_ ? 'sphere' : 'surface'}: **${M.si(Phi, unit, 6)}**${three_ ? '' : ' per metre of length'} · enclosed $${qs}_{\\text{enc}}/\\varepsilon_0$ = ${M.si(qin * KF, unit, 6)} ($${qs}_{\\text{enc}} = ${v.fix(qin, 2)}$ ${three_ ? 'nC' : 'nC/m'})` +
            (on ? ` · ${on} charge${on > 1 ? 's' : ''} exactly on the surface, counted as half` : '') +
            (Math.abs(nexp.value - 2) > 1e-9 ? ` · exponent ${v.fix(nexp.value, 2)}: the two differ by ${M.si(Phi - qin * KF, unit)} — **Gauss’s law fails**` : ok ? ' · equal' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.15
    {
      num: '1.15',
      kind: 'Theorem',
      name: 'Gauss’s law in differential form',
      statement: String.raw`For a charge density $\rho$ that is continuous (or merely integrable), the electric field satisfies at every point
$$\nabla\cdot\mathbf E = \frac{\rho}{\varepsilon_0}.$$
Equivalently, the flux of $\mathbf E$ out of a small region around a point, divided by its volume, tends to $\rho/\varepsilon_0$ there as the region shrinks. Together with the divergence theorem this local statement is equivalent to the integral form of Gauss’s law.`,
      idea: String.raw`Apply Gauss’s law (em-1.14) to a small box around the point: its flux is $Q_{\text{enc}}/\varepsilon_0 \approx \rho\,V/\varepsilon_0$, while by definition the flux per unit volume tends to the divergence (vcalc-3.6). Conversely, the divergence theorem (pma-10.51) turns $\int_V \nabla\cdot\mathbf E\,d\tau = \int_V \rho\,d\tau/\varepsilon_0$ for every region into the integral law. The error of the box estimate shrinks like the square of its size for a smooth density, since the first-order variation of $\rho$ across a symmetric box averages out.`,
      caption: String.raw`Paint charge on the left (drag anywhere; choose the brush sign), or move the gold box and change its size. The density is a sum of smooth blobs, uniform along the third direction. The right map is $\varepsilon_0\nabla\cdot\mathbf E$ computed from the field alone by finite differences — it reproduces your painting. The readout compares the flux through the box divided by its area with $\rho/\varepsilon_0$ at its centre; the bottom panel shows the error falling like $h^2$ as the box shrinks.`,
      deps: ['em-1.14', 'pma-10.51', 'vcalc-3.6'],
      refs: ['Griffiths §2.2'],
      tags: ['divergence', 'gauss'],
      viz(v) {
        const M = v.M, C = M.CONST, KD = 1e-5 / C.eps0, SIG = 0.42;
        const sR = v.stage({ x: [-4, 4], y: [-3, 3], equal: true, height: 290, axes: false, title: 'charge density $\\rho$ (paint here)' });
        const sD = v.stage({ x: [-4, 4], y: [-3, 3], equal: true, height: 290, axes: false, title: '$\\varepsilon_0\\,\\nabla\\cdot\\mathbf E$ from the field, with $\\mathbf E$' });
        const sc = v.stage({ x: [0.02, 4], y: [1e-7, 1], xlog: true, ylog: true, height: 170, axes: 'box', full: true, xlabel: 'box side h (cm)', title: 'relative error of flux/area against $\\rho/\\varepsilon_0$ at the box centre' });
        const brush = v.select('brush', [{ value: 'p', label: 'paint $+$' }, { value: 'm', label: 'paint $-$' }], 'p');
        const hS = v.slider('box side $h$', 0.05, 3, 1.1, { log: true, fmt: (x) => `${x.toPrecision(2)} cm` });
        const initBlobs = () => { const b = []; for (let k = 0; k < 9; k++) { const a = (TAU * k) / 9; b.push({ x: -1.2 + 1.5 * Math.cos(a), y: 0.1 + 1.5 * Math.sin(a), q: 1 }); } b.push({ x: 2.1, y: 0.6, q: -1.5 }, { x: 2.5, y: -0.1, q: -1.5 }, { x: 1.9, y: -0.8, q: -1.5 }); return b; };
        let blobs = initBlobs(), ver = 0, last = null, resid = 0;
        v.button('clear', () => { blobs = []; ver++; });
        v.button('reset', () => { blobs = initBlobs(); ver++; });
        const B = sR.handle(-1.2, 1.6, { color: 'gold', r: 6 });
        sR.onDrag((x, y, phs) => {
          if (phs === 'end') { last = null; return; }
          if (!last || Math.hypot(x - last[0], y - last[1]) > 0.32) { if (blobs.length < 160) { blobs.push({ x, y, q: brush.value === 'p' ? 1 : -1 }); ver++; } last = [x, y]; }
        });
        const g2 = 2 * SIG * SIG;
        const E = (x, y) => { let u = 0, w = 0; for (const b of blobs) { const dx = x - b.x, dy = y - b.y, r2 = dx * dx + dy * dy; const f = r2 < 1e-12 ? 1 / g2 : -Math.expm1(-r2 / g2) / r2; u += (b.q * f * dx) / TAU; w += (b.q * f * dy) / TAU; } return [u, w]; };
        const rho = (x, y) => { let s = 0; for (const b of blobs) s += b.q * Math.exp(-((x - b.x) ** 2 + (y - b.y) ** 2) / g2); return s / (TAU * SIG * SIG); };
        const div = (x, y, h = 0.004) => { const a = E(x + h, y), b = E(x - h, y), c = E(x, y + h), d = E(x, y - h); return (a[0] - b[0] + c[1] - d[1]) / (2 * h); };
        const boxFlux = (cx, cy, h) => {
          const hh = h / 2, edge = (x0, y0, x1, y1) => { const ex = x1 - x0, ey = y1 - y0; return quad((t) => { const f = E(x0 + t * ex, y0 + t * ey); return f[0] * ey - f[1] * ex; }, 0, 1, 1e-12, 16, 4); };
          return edge(cx - hh, cy - hh, cx + hh, cy - hh) + edge(cx + hh, cy - hh, cx + hh, cy + hh) + edge(cx + hh, cy + hh, cx - hh, cy + hh) + edge(cx - hh, cy + hh, cx - hh, cy - hh);
        };
        let st = null;
        v.render(() => {
          const Pc = v.rgb('panel'), Rr = v.rgb('red'), Bb = v.rgb('blue');
          let vmax = 1e-9; for (const b of blobs) vmax = Math.max(vmax, Math.abs(rho(b.x, b.y)));
          const ramp = (t) => { const c = t >= 0 ? Rr : Bb, k = 0.85 * Math.min(1, Math.abs(t)); return [Pc[0] + (c[0] - Pc[0]) * k, Pc[1] + (c[1] - Pc[1]) * k, Pc[2] + (c[2] - Pc[2]) * k]; };
          const keyT = `${ver}|${Pc.join(',')}`;
          sR.raster((x, y) => ramp(rho(x, y) / vmax), { res: 4, key: keyT });
          let rmax = 0;
          sD.raster((x, y) => { const d = div(x, y); rmax = Math.max(rmax, Math.abs(d - rho(x, y))); resid = rmax / vmax; return ramp(d / vmax); }, { res: 4, key: keyT });
          for (let x = -3.5; x <= 3.6; x += 0.7) for (let y = -2.5; y <= 2.6; y += 0.7) { const f = E(x, y), m = Math.hypot(...f); if (m > 1e-6) arrowMid(sD, x, y, f[0], f[1], Math.min(22, 7 + 60 * m), { color: 'ink', alpha: 0.45, width: 1.1, head: 5 }); }
          const h = hS.value;
          for (const S of [sR, sD]) S.rect(B.x - h / 2, B.y - h / 2, B.x + h / 2, B.y + h / 2, { color: 'gold', width: 2.2, fill: 'gold', fillAlpha: 0.08 });
          const fA = boxFlux(B.x, B.y, h) / (h * h), r0 = rho(B.x, B.y);
          // convergence
          const pts = []; for (let k = 0; k <= 40; k++) { const hh = 0.02 * Math.pow(200, k / 40); pts.push([hh, Math.max(1e-12, Math.abs(boxFlux(B.x, B.y, hh) / (hh * hh) - r0) / vmax)]); }
          const ref = pts.find((p) => p[0] > 0.3) || pts[0], ys = pts.map((p) => p[1]);
          sc.setView([0.02, 4], [Math.max(1e-10, Math.min(...ys)) / 3, Math.max(...ys) * 3]);
          sc.fn((x) => ref[1] * (x / ref[0]) ** 2, { color: 'muted', dash: [4, 4], width: 1 });
          sc.text('slope 2', 0.06, ref[1] * (0.06 / ref[0]) ** 2, { size: 11, color: 'muted', dy: -10 });
          sc.path(pts, { color: 'accent', width: 2.4 });
          sc.dot(h, Math.max(1e-12, Math.abs(fA - r0) / vmax), { r: 6, color: 'gold' });
          st = { fA, r0, vmax };
        });
        v.readout(() => {
          const { fA, r0 } = st;
          return `flux through the box ÷ its area: ${M.si(fA * KD, 'V/m²')} · $\\rho/\\varepsilon_0$ at its centre: ${M.si(r0 * KD, 'V/m²')} ($\\rho$ = ${M.si(r0 * 1e-5, 'C/m³')}) · the finite-difference divergence matches $\\rho/\\varepsilon_0$ over the whole map to ${v.sci(Math.max(resid, 1e-12), 1).includes('times') ? '$' + v.sci(Math.max(resid, 1e-12), 1) + '$' : v.fix(resid, 5)} of the peak`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.16
    {
      num: '1.16',
      kind: 'Method',
      name: 'Gauss’s law with symmetry',
      statement: String.raw`When symmetry forces $\mathbf E$ to be perpendicular to a surface and constant in size on it, Gauss’s law gives the field in one line: $E\cdot A = Q_{\text{enc}}/\varepsilon_0$. The three standard cases:
(a) a spherically symmetric charge (a ball of radius $a$, total $Q$): $E = Q_{\text{enc}}(r)/4\pi\varepsilon_0r^2$, i.e. $Qr/4\pi\varepsilon_0a^3$ inside a uniform ball and $Q/4\pi\varepsilon_0r^2$ outside;
(b) a long cylinder with charge $\lambda$ per length: $E = \lambda_{\text{enc}}(s)/2\pi\varepsilon_0 s$;
(c) an infinite slab of thickness $2a$ and density $\rho$: $E = \rho\,\min(|z|,a)/\varepsilon_0$, away from the mid-plane.
Without such symmetry Gauss’s law still holds but no longer determines $\mathbf E$.`,
      idea: String.raw`Symmetry does the real work: rotating a ball about its centre leaves the charge unchanged, so the field must be radial and depend only on $r$ (a field with a tangential part would pick a direction). Then on a concentric sphere $\mathbf E\cdot\hat{\mathbf n} = E(r)$ is constant and comes out of the integral (em-1.14). Cylinders and slabs work the same way with coaxial cylinders and pillboxes, whose side walls carry no flux. Add a charge off-centre and the symmetry is gone: the flux through the sphere is still $Q_{\text{enc}}/\varepsilon_0$, but $E$ now varies over it, so dividing by the area gives only its average normal component.`,
      caption: String.raw`Pick a ball, a long cylinder (seen in cross-section) or a slab (seen edge-on), and drag the green handle to resize the matching Gaussian surface. The arrows show the field on it, and the right panel plots $E(r)$ from Gauss’s law (green) against a **direct numerical integration of Coulomb’s law** over the charge (dots) — they agree. Now add an off-centre charge (purple, draggable): the flux still equals $Q_{\text{enc}}/\varepsilon_0$, but the orange bar shows how much $|\mathbf E|$ now varies over the surface — flux over area no longer tells you the field.`,
      deps: ['em-1.14'],
      refs: ['Griffiths §2.2', 'Feynman II ch. 5'],
      tags: ['gauss', 'symmetry'],
      viz(v) {
        const M = v.M, C = M.CONST, k = C.ke, e0 = C.eps0;
        const s = v.stage({ x: [-5, 5], y: [-3.7, 3.7], equal: true, height: 340, axes: false, weight: 1.15 });
        const sp = v.stage({ x: [0, 5], y: [0, 1], height: 340, axes: 'box', weight: 1, xlabel: 'size r of the Gaussian surface (cm)', title: '$E$ on the Gaussian surface (kN/C)' });
        const kind = v.select('', [{ value: 'ball', label: 'ball' }, { value: 'cyl', label: 'long cylinder' }, { value: 'slab', label: 'slab' }], 'ball');
        const extra = v.toggle('add an off-centre charge', false);
        const P = { ball: { a: 2.5, Q: 10e-9, qx: 8e-9 }, cyl: { a: 2, lam: 100e-9, lx: 60e-9 }, slab: { a: 1.4, rho: 2e-6, qx: 2e-10 } };
        const rh = s.handle(1.6, 0, { color: 'green', r: 7, constrain: (x, y) => (kind.value === 'slab' ? [0, Math.max(0.1, Math.min(3.3, y))] : [Math.max(0.15, Math.min(4.7, x)), 0]) });
        const xh = s.handle(3.3, 1.7, { color: 'purple', r: 7, label: "$q'$" });
        const RP = 1.6; // pillbox radius (cm)
        // ── symmetric fields: Gauss and direct integration (lengths in cm, results in N/C)
        const gauss = (r) => {
          if (kind.value === 'ball') { const { a, Q } = P.ball; return r < a ? (k * Q * r) / (a ** 3) * 1e4 : (k * Q) / (r * r) * 1e4; }
          if (kind.value === 'cyl') { const { a, lam } = P.cyl; return r < a ? ((lam / (TAU * e0)) * r) / (a * a) * 100 : (lam / (TAU * e0 * r)) * 100; }
          const { a, rho } = P.slab; return (rho * Math.min(r, a) * 0.01) / e0;
        };
        const direct = (r) => {
          if (kind.value === 'ball') {
            const { a, Q } = P.ball;
            const J = (rp) => { const w0 = Math.abs(r - rp) / Math.sqrt(2 * r * rp + 1e-30); return quadBreaks((w) => { const u = 1 - w * w, d2 = (r - rp) ** 2 + 2 * r * rp * w * w; return d2 < 1e-30 ? 0 : ((r - rp * u) / Math.pow(d2, 1.5)) * 2 * w; }, 0, Math.SQRT2, [w0 / 2, w0, 2 * w0], 1e-8, 16); };
            const I = TAU * quadBreaks((rp) => rp * rp * J(rp), 0, a, [r], 1e-7, 14);
            return ((k * Q * I) / ((4 / 3) * Math.PI * a ** 3)) * 1e4;
          }
          if (kind.value === 'cyl') {
            const { a, lam } = P.cyl, rhoS = lam / (Math.PI * (a * 0.01) ** 2);
            const J = (rp) => { const w0 = Math.abs(r - rp) / Math.max(r, 1e-9); return 2 * quadBreaks((ph) => (r - rp * Math.cos(ph)) / (r * r + rp * rp - 2 * r * rp * Math.cos(ph)), 0, Math.PI, [w0 / 2, w0, 2 * w0], 1e-8, 16); };
            return (rhoS / (TAU * e0)) * quadBreaks((rp) => rp * J(rp), 0, a, [r], 1e-7, 14) * 0.01;
          }
          const { a, rho } = P.slab; return (rho / (2 * e0)) * quadBreaks((zp) => Math.sign(r - zp), -a, a, [r], 1e-9) * 0.01;
        };
        // ── the extra charge’s field (N/C) at a 3D point (cm); for the cylinder a parallel line charge
        const extraE = (p) => {
          if (kind.value === 'cyl') { const dx = p[0] - xh.x, dy = p[1] - xh.y, r2 = (dx * dx + dy * dy) * 1e-4, c = (P.cyl.lx / (TAU * e0 * r2)) * 0.01; return [c * dx, c * dy, 0]; }
          const qx = kind.value === 'ball' ? P.ball.qx : P.slab.qx, dx = p[0] - xh.x, dy = p[1] - xh.y, dz = p[2], r = Math.hypot(dx, dy, dz) * 0.01, c = ((k * qx) / (r * r * r)) * 0.01;
          return [c * dx, c * dy, c * dz];
        };
        let cache = { key: '', pts: [] }, prevKind = kind.value, st = null;
        v.render(() => {
          const K = kind.value, slab = K === 'slab';
          if (K !== prevKind) { const r0 = slab ? rh.x : rh.y; if (slab) rh.set(0, Math.min(3.2, Math.max(0.3, r0 || 1.8))); else rh.set(Math.min(4.6, Math.max(0.3, r0 || 1.6)), 0); prevKind = K; }
          xh.visible = extra.value;
          const r = slab ? rh.y : rh.x, a = P[K].a;
          if (cache.key !== K) { cache = { key: K, pts: [] }; const rmax = slab ? 3.4 : 4.8; for (let i = 1; i <= 16; i++) { const rr = (rmax * i) / 16; cache.pts.push([rr, direct(rr) / 1e3]); } }
          // drawing the charge distribution and the Gaussian surface
          if (slab) {
            s.rect(-5.2, -a, 5.2, a, { fill: 'red', fillAlpha: 0.2, stroke: false });
            for (let x = -4.5; x <= 4.6; x += 0.9) for (const y of [-a / 2, 0, a / 2]) s.text('+', x, y, { align: 'center', size: 11, color: 'red', halo: false });
            s.rect(-RP, -r, RP, r, { color: 'green', width: 2.2, dash: [6, 4], fill: 'green', fillAlpha: 0.06 });
          } else {
            s.circle(0, 0, a, { fill: 'red', fillAlpha: 0.2, color: 'red', width: 1.4 });
            for (let rr = 0.6; rr < a; rr += 0.8) for (let j = 0; j < Math.round(rr * 4); j++) { const t = (TAU * j) / Math.round(rr * 4); s.text('+', rr * Math.cos(t), rr * Math.sin(t), { align: 'center', size: 11, color: 'red', halo: false }); }
            s.circle(0, 0, r, { color: 'green', width: 2.2, dash: [6, 4] });
            if (K === 'cyl') s.corner('cross-section of a long cylinder, λ = 100 nC/m', 'tl', { size: 11 }); else s.corner('ball: Q = 10 nC, radius 2.5 cm', 'tl', { size: 11 });
          }
          if (slab) s.corner('slab: ρ = 2 µC/m³, 2.8 cm thick (edge-on)', 'tl', { size: 11 });
          // field on the surface: symmetric part + extra charge
          const Es = gauss(r), surf = [];
          if (slab) { for (const zs of [r, -r]) for (let j = -2; j <= 2; j++) surf.push({ p: [j * 0.75, zs, 0], n: [0, Math.sign(zs), 0] }); for (const xs of [RP, -RP]) for (const zz of [-0.5, 0.5]) surf.push({ p: [xs, zz * r, 0], n: [Math.sign(xs), 0, 0], side: true }); }
          else for (let j = 0; j < 20; j++) { const t = (TAU * j) / 20; surf.push({ p: [r * Math.cos(t), r * Math.sin(t), 0], n: [Math.cos(t), Math.sin(t), 0] }); }
          const tot = (q) => { const sym = slab ? [0, Math.sign(q.p[1]) * (q.side ? 0 : 1) * Es, 0] : q.n.map((c) => c * Es); if (slab && q.side) { const zz = q.p[1]; sym[1] = Math.sign(zz) * gauss(Math.abs(zz)); } const ex = extra.value ? extraE(q.p) : [0, 0, 0]; return [sym[0] + ex[0], sym[1] + ex[1], sym[2] + ex[2]]; };
          const Eref = Math.max(...cache.pts.map((g) => g[1])) * 1e3;
          for (const q of surf) { const f = tot(q), m = Math.hypot(f[0], f[1]); if (m > Eref * 1e-3) arrowPx(s, q.p[0], q.p[1], f[0], f[1], Math.min(48, 40 * Math.sqrt(m / Eref)), { color: (f[0] * q.n[0] + f[1] * q.n[1]) >= 0 ? 'green' : 'red', width: 2, head: 7 }); }
          if (extra.value) s.text(kind.value === 'cyl' ? 'λ′ = 60 nC/m' : kind.value === 'ball' ? 'q′ = 8 nC' : 'q′ = 0.2 nC', xh.x, xh.y - 0.5, { align: 'center', size: 11, color: 'purple' });
          // |E| over the whole Gaussian surface (3D samples) and the flux
          let lo = Infinity, hi = 0, flux = 0, area = 0, qenc = 0;
          if (K === 'ball') {
            for (let i = 0; i < 24; i++) for (let j = 0; j < 48; j++) { const th = (Math.PI * (i + 0.5)) / 24, phi = (TAU * j) / 48, n3 = [Math.sin(th) * Math.cos(phi), Math.sin(th) * Math.sin(phi), Math.cos(th)], p = n3.map((c) => c * r), ex = extra.value ? extraE(p) : [0, 0, 0], m = Math.hypot(Es * n3[0] + ex[0], Es * n3[1] + ex[1], Es * n3[2] + ex[2]); lo = Math.min(lo, m); hi = Math.max(hi, m); }
            area = 4 * Math.PI * (r * 0.01) ** 2; flux = Es * area; qenc = P.ball.Q * Math.min(1, (r / a) ** 3);
            if (extra.value) { const D = Math.hypot(xh.x, xh.y), w0 = Math.abs(r - D) / Math.sqrt(Math.max(r * D, 1e-12)); flux += k * P.ball.qx * TAU * r * r * quadBreaks((w) => { const u = 1 - w * w, d2 = (r - D) ** 2 + 2 * r * D * w * w; return d2 < 1e-30 ? 0 : ((r - D * u) / Math.pow(d2, 1.5)) * 2 * w; }, 0, Math.SQRT2, [w0 / 2, w0, 2 * w0], 1e-10, 24); if (D < r) qenc += P.ball.qx; }
          } else if (K === 'cyl') {
            for (let j = 0; j < 180; j++) { const t = (TAU * j) / 180, n3 = [Math.cos(t), Math.sin(t), 0], ex = extra.value ? extraE(n3.map((c) => c * r)) : [0, 0, 0], m = Math.hypot(Es * n3[0] + ex[0], Es * n3[1] + ex[1]); lo = Math.min(lo, m); hi = Math.max(hi, m); }
            area = TAU * r * 0.01; flux = Es * area; qenc = P.cyl.lam * Math.min(1, (r / a) ** 2);
            if (extra.value) { flux += quad((t) => { const n3 = [Math.cos(t), Math.sin(t), 0], ex = extraE(n3.map((c) => c * r)); return (ex[0] * n3[0] + ex[1] * n3[1]) * r * 0.01; }, 0, TAU, 1e-6, 20, 32); if (Math.hypot(xh.x, xh.y) < r) qenc += P.cyl.lx; }
          } else {
            for (const zs of [r, -r]) for (let i = 0; i < 8; i++) for (let j = 0; j < 24; j++) { const rr = (RP * (i + 0.5)) / 8, t = (TAU * j) / 24, p = [rr * Math.cos(t), zs, rr * Math.sin(t)], ex = extra.value ? extraE([p[0], p[1], p[2]]) : [0, 0, 0], m = Math.hypot(ex[0], Math.sign(zs) * Es + ex[1], ex[2]); lo = Math.min(lo, m); hi = Math.max(hi, m); }
            area = 2 * Math.PI * (RP * 0.01) ** 2; flux = Es * area; qenc = P.slab.rho * Math.PI * (RP * 0.01) ** 2 * 2 * Math.min(r, a) * 0.01;
            if (extra.value) {
              // the point charge’s flux out of the pillbox: two faces and the side wall, by nested quadrature
              const face = (zs) => quad((rr) => quad((t) => { const p = [rr * Math.cos(t), zs, rr * Math.sin(t)], ex = extraE(p); return ex[1] * Math.sign(zs) * rr * 1e-4; }, 0, TAU, 1e-9, 12, 8), 0, RP, 1e-8, 12, 8);
              const side = quad((zz) => quad((t) => { const p = [RP * Math.cos(t), zz, RP * Math.sin(t)], ex = extraE(p); return (ex[0] * Math.cos(t) + ex[2] * Math.sin(t)) * RP * 1e-4; }, 0, TAU, 1e-9, 12, 8), -r, r, 1e-8, 12, 8);
              flux += face(r) + face(-r) + side; if (Math.abs(xh.x) < RP && Math.abs(xh.y) < r) qenc += P.slab.qx;
            }
          }
          // the plot
          const rmax = slab ? 3.4 : 4.8, ymax = Math.max(Eref, hi) / 1e3 * 1.25;
          sp.setView([0, rmax], [0, ymax]);
          sp.vline(a, { color: 'red', dash: [3, 4], width: 1, alpha: 0.6 }); sp.text('edge of the charge', a, ymax * 0.96, { size: 11, color: 'red', dx: 5, baseline: 'top' });
          sp.fn((x) => gauss(x) / 1e3, { color: 'green', width: 2.4, domain: [0.01, rmax] });
          sp.dots(cache.pts, { r: 4, color: 'accent' });
          if (extra.value) { sp.line(r, lo / 1e3, r, hi / 1e3, { color: 'orange', width: 7, alpha: 0.55 }); }
          sp.dot(r, flux / area / 1e3, { r: 6, color: 'gold' });
          st = { r, Es, flux, qenc, lo, hi, area };
        });
        v.legend([['green', 'Gauss: $E = Q_{\\text{enc}}/\\varepsilon_0A$'], ['accent', 'direct integration of Coulomb’s law', { dot: true }], ['gold', 'flux ÷ area', { dot: true }], ['orange', 'range of $|\\mathbf E|$ over the surface', { area: true }]]);
        v.readout(() => {
          const { r, Es, flux, qenc, lo, hi, area } = st, unit = kind.value === 'cyl' ? 'V' : 'V·m';
          const base = `$r = ${v.fix(r, 2)}$ cm: Gauss gives ${M.si(Es, 'N/C')}, direct integration ${M.si(direct(r), 'N/C')} · flux ${M.si(flux, unit)}${kind.value === 'cyl' ? ' per metre' : ''} $= Q_{\\text{enc}}/\\varepsilon_0$ = ${M.si(qenc / e0, unit)}`;
          return extra.value ? `${base} · but $|\\mathbf E|$ on the surface now ranges from ${M.si(lo, 'N/C')} to ${M.si(hi, 'N/C')}: flux ÷ area = ${M.si(flux / area, 'N/C')} is only an average — **the shortcut fails without symmetry**` : base;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.17
    {
      num: '1.17',
      kind: 'Theorem',
      name: 'No field inside a charged shell',
      statement: String.raw`A uniformly charged spherical shell of radius $R$ and total charge $Q$ produces **no electric field anywhere inside it**, and outside it produces the field of a point charge $Q$ at its centre:
$$\mathbf E(\mathbf r) = \mathbf 0\quad(r<R),\qquad \mathbf E(\mathbf r) = \frac{Q}{4\pi\varepsilon_0 r^2}\,\hat{\mathbf r}\quad(r>R).$$
The cancellation inside depends on the force law being exactly inverse-square.`,
      idea: String.raw`Gauss’s law gives it at once (em-1.16): a concentric sphere inside encloses no charge, and by symmetry the field on it is radial and constant, so it must vanish. Newton’s geometric argument shows *why*: a thin double cone with its apex at any interior point $P$ cuts the shell in two patches. Their areas are in the ratio $r_1^2 : r_2^2$ of their distances (both patches meet the cone at the same angle, by the symmetry of a chord), while their fields at $P$ go like area$/r^2$ — so the near small patch and the far large patch pull equally in opposite directions. With a force law $1/r^{2+\delta}$ the far patch loses, the cancellation fails, and a field appears inside (em-1.18). The same theorem for gravity is Newton’s shell theorem (mech-8.1).`,
      caption: String.raw`Drag $P$ anywhere inside the shell ($Q = 20$ nC, $R = 4$ cm) and turn and widen the double cone. The near (orange) and far (purple) patches are integrated numerically: their areas differ, their fields at $P$ are equal and opposite, and the field of the whole shell (summed over its surface) is zero to rounding. Move the exponent off 2 and both balances fail; the right panel shows a field appearing inside. An outside charge is *not* shielded by this insulating shell: its field passes straight through (a conductor would rearrange its charge, em-3.7).`,
      deps: ['em-1.16', 'mech-8.1'],
      refs: ['Purcell ch. 1', 'Feynman II ch. 5'],
      tags: ['shell', 'gauss'],
      viz(v) {
        const M = v.M, C = M.CONST, R = 4, Q = 20e-9, sig = Q / (4 * Math.PI * (R * 0.01) ** 2), kS = C.ke * sig;
        const s = v.stage({ x: [-5.6, 7.6], y: [-4.9, 4.9], equal: true, height: 360, axes: false, weight: 1.35 });
        const sp = v.stage({ x: [0, 8], y: [-1, 1], height: 360, axes: 'box', weight: 1, xlabel: 'distance from the centre along OP (cm)', title: 'radial field $E_r$ (kN/C)' });
        const psi = v.slider('cone direction', -180, 180, 25, { step: 1, fmt: (x) => `${x}°` });
        const alp = v.slider('cone half-angle', 3, 30, 14, { step: 0.5, fmt: (x) => `${x}°` });
        const nx = v.slider('force-law exponent $n$', 1.9, 2.1, 2, { step: 0.005, fmt: (x) => x.toFixed(3) });
        const outQ = v.toggle('a charge outside the shell', false);
        const P = s.handle(1.9, -1.1, { color: 'gold', r: 7, label: '$P$', labelPos: 'sw' });
        const O = s.handle(6.4, 2.6, { color: 'purple', r: 8, label: '+5 nC', labelPos: 'n' });
        const GLb = [[-0.9061798459, 0.2369268851], [-0.5384693101, 0.4786286705], [0, 0.5688888889], [0.5384693101, 0.4786286705], [0.9061798459, 0.2369268851]];
        /** Field (N/C, 3D vector in the slice’s frame) and area (cm²) of the patch cut by the cone about unit axis u from P (z = 0). */
        const patch = (px, py, ux, uy, al, n) => {
          const e1 = [-uy, ux, 0]; let E = [0, 0, 0], A = 0, tm = 0;
          for (const [xb, wb] of GLb) for (let jg = 0; jg < 24; jg++) {
            const b = (al / 2) * (xb + 1), g = (TAU * (jg + 0.5)) / 24, sb = Math.sin(b), cb = Math.cos(b);
            const w = [cb * ux + sb * (Math.cos(g) * e1[0]), cb * uy + sb * (Math.cos(g) * e1[1]), sb * Math.sin(g)];
            const pw = px * w[0] + py * w[1], t = -pw + Math.sqrt(pw * pw - (px * px + py * py) + R * R), cchi = (pw + t) / R;
            const dO = wb * (al / 2) * sb * (TAU / 24);
            const f = Math.pow(t, 2 - n) / cchi; // field factor (t in cm, normalised at 1 cm)
            E = E.map((c, i) => c - kS * f * w[i] * dO); A += (t * t / cchi) * dO; tm += t * dO;
          }
          return { E, A, t: tm / (TAU * (1 - Math.cos(al))) };
        };
        /** Radial field of the whole shell at distance r (cm) for exponent n: 1D integral over the polar angle (u = 1 − w²). */
        const shellE = (r, n) => {
          const w0 = Math.abs(r - R) / Math.sqrt(Math.max(r * R, 1e-12));
          return kS * TAU * R * R * quadBreaks((w) => { const u = 1 - w * w, d2 = (r - R) ** 2 + 2 * r * R * w * w; return d2 < 1e-30 ? 0 : ((r - R * u) / Math.pow(d2, (n + 1) / 2)) * 2 * w; }, 0, Math.SQRT2, [w0 / 2, w0, 2 * w0], 1e-11, 26);
        };
        let st = null;
        v.render(() => {
          O.visible = outQ.value;
          const n = nx.value, r = Math.hypot(P.x, P.y), inside = r < R - 1e-6;
          // the shell
          s.circle(0, 0, R, { color: 'red', width: 5, alpha: 0.55 });
          for (let j = 0; j < 36; j++) { const t = (TAU * j) / 36; s.text('+', R * Math.cos(t), R * Math.sin(t), { align: 'center', size: 10, weight: 700, color: 'panel', halo: false }); }
          let near = null, far = null;
          if (inside) {
            const ps = (psi.value * Math.PI) / 180, al = (alp.value * Math.PI) / 180, ux = Math.cos(ps), uy = Math.sin(ps);
            const A1 = patch(P.x, P.y, ux, uy, al, n), A2 = patch(P.x, P.y, -ux, -uy, al, n);
            [near, far] = A1.t < A2.t ? [{ ...A1, s: 1 }, { ...A2, s: -1 }] : [{ ...A2, s: -1 }, { ...A1, s: 1 }];
            // wedges in the slice and the arcs they cut
            const hit = (dx, dy) => { const pw = P.x * dx + P.y * dy, t = -pw + Math.sqrt(pw * pw - r * r + R * R); return [P.x + t * dx, P.y + t * dy]; };
            for (const [P0, col] of [[near, 'orange'], [far, 'purple']]) {
              const dir = P0.s, poly = [[P.x, P.y]], arc = [];
              for (let k = 0; k <= 24; k++) { const a = ps + (k / 12 - 1) * al, q = hit(dir * Math.cos(a), dir * Math.sin(a)); poly.push(q); arc.push(q); }
              s.poly(poly, { fill: col, fillAlpha: 0.16, color: col, width: 1, alpha: 0.6 });
              s.path(arc, { color: col, width: 7, alpha: 0.85 });
            }
            const big = Math.max(Math.hypot(...near.E), Math.hypot(...far.E));
            arrowPx(s, P.x, P.y, near.E[0], near.E[1], 70 * Math.hypot(...near.E) / big, { color: 'orange', width: 3, head: 10 });
            arrowPx(s, P.x, P.y, far.E[0], far.E[1], 70 * Math.hypot(...far.E) / big, { color: 'purple', width: 3, head: 10 });
          }
          // total field at P: the shell (and the outside charge)
          const Es = shellE(r, n), Er = r > 1e-9 ? [Es * P.x / r, Es * P.y / r] : [0, 0];
          const Eo = outQ.value ? coul([{ x: O.x, y: O.y, q: 5 }], P.x, P.y).map((c) => c * C.ke * 1e-5) : [0, 0];
          const Et = [Er[0] + Eo[0], Er[1] + Eo[1]], mt = Math.hypot(...Et);
          if (mt > 50) arrowPx(s, P.x, P.y, Et[0], Et[1], Math.min(90, 24 + 18 * Math.log10(mt / 50)), { color: 'green', width: 2.6, head: 9 });
          // radial profile
          const prof = (nn) => { const out = []; for (let i = 1; i <= 160; i++) { const rr = (8 * i) / 160; if (Math.abs(rr - R) < 0.02) { out.push(null); continue; } out.push([rr, shellE(rr, nn) / 1e3]); } return out; };
          const p2 = prof(2), pn = Math.abs(n - 2) > 1e-9 ? prof(n) : null;
          const ym = (C.ke * Q) / (R * 0.01) ** 2 / 1e3 * 1.25; sp.setView([0, 8], [-ym * 0.25, ym]);
          sp.hline(0, { color: 'faint', width: 1 }); sp.vband(0, R, { color: 'red', alpha: 0.06 }); sp.vline(R, { color: 'red', width: 1, dash: [3, 4], alpha: 0.7 });
          sp.text('inside the shell', R / 2, ym * 0.92, { align: 'center', size: 11, color: 'red' });
          sp.path(p2, { color: 'accent', width: 2.4 });
          if (pn) sp.path(pn, { color: 'orange', width: 2.2, dash: [6, 4] });
          sp.dot(r, Es / 1e3, { r: 6, color: 'gold' });
          st = { near, far, Es, Et, inside, r };
        });
        v.legend([['orange', 'near patch'], ['purple', 'far patch'], ['green', 'total field at $P$'], ['accent', 'shell, $n = 2$'], ['orange', 'shell, your $n$', { dash: true }]]);
        v.readout(() => {
          const { near, far, Es, Et, inside } = st;
          const tail = outQ.value ? ` · with the outside charge the total at $P$ is ${M.si(Math.hypot(...Et), 'N/C')}: the shell’s own contribution is still ${M.si(Math.abs(Es), 'N/C')}` : '';
          if (!inside) return `$P$ is outside the shell: $E$ = ${M.si(Math.abs(Es), 'N/C')}, the same as a point charge $Q$ at the centre (${M.si((C.ke * Q) / (st.r * 0.01) ** 2, 'N/C')})${tail}`;
          const nE = Math.hypot(...near.E), fE = Math.hypot(...far.E);
          return `near patch: area ${v.fix(near.A, 3)} cm² at ${v.fix(near.t, 2)} cm, field ${M.si(nE, 'N/C')} · far patch: area ${v.fix(far.A, 3)} cm² at ${v.fix(far.t, 2)} cm, field ${M.si(fE, 'N/C')} · ratio of fields ${v.fix(fE / nE, 6)} · whole shell at $P$: **${M.si(Math.abs(Es), 'N/C')}**${Math.abs(nx.value - 2) < 1e-9 ? ' (zero to rounding)' : ' — a field inside: the exponent is not 2'}${tail}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.18
    {
      num: '1.18',
      kind: 'Phenomenon',
      name: 'Testing the inverse-square law',
      statement: String.raw`Because the field inside a charged conducting shell vanishes only for an exact inverse-square law (em-1.17), null experiments test the exponent with extraordinary sensitivity. Writing the force as $1/r^{2+\delta}$: if $\delta\neq0$, an inner sphere connected to a charged outer shell picks up a charge proportional to $\delta$; none is found. Cavendish (1773) obtained $|\delta|<1/50$; Maxwell (1873) $|\delta|<5\times10^{-5}$; Plimpton and Lawton (1936) $|\delta|<2\times10^{-9}$; Williams, Faller and Hill (1971) $|\delta|<3\times10^{-16}$. Equivalently, the photon mass is below about $10^{-50}$ kg.`,
      idea: String.raw`For a $1/r^{2+\delta}$ law the potential inside a uniformly charged shell is not constant: it varies by an amount proportional to $\delta$ (em-1.17). Connect a concentric inner sphere to the outer one by a wire: the two must reach a common potential, and with $\delta\neq0$ that requires a charge on the inner sphere, $q_{\text{in}}\approx c\,\delta\,Q_{\text{out}}$ with $c$ of order 1 set by the radii. Disconnect, remove the outer shell, and test the inner sphere with an electrometer: the sensitivity of that measurement, compared with the charge on the outer shell, bounds $|\delta|$. Each generation of experimenters replaced pith balls by better electrometers and then by AC methods with lock-in detection, gaining fourteen orders of magnitude.`,
      caption: String.raw`Step through Cavendish’s procedure with globes of radius 15 cm and 17 cm, the outer charged to 3 kV. The charge the inner globe acquires is computed from the potentials of the two shells for a force $1/r^{2\pm\delta}$; it is exactly zero for $\delta = 0$. In the last step the pith-ball electrometer swings only if the charge exceeds what Cavendish could detect. The right panel compares the $|\delta|$ you chose with the limits set by experiments since 1773: each one marked green would have seen it.`,
      scope: String.raw`Tests the static Coulomb law at laboratory distances (cm to m); geomagnetic and astrophysical limits on the photon mass probe much larger scales.`,
      credit: 'Cavendish, 1773 (published by Maxwell, 1879); Williams, Faller & Hill, 1971',
      deps: ['em-1.17'],
      refs: ['Purcell ch. 1', 'Feynman II ch. 5'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Coulomb%27s_law#Tests' },
      tags: ['inverse square', 'experiment'],
      viz(v) {
        const M = v.M, C = M.CONST, a = 15, b = 17, V0 = 3000;
        const s = v.stage({ x: [-5.6, 5.6], y: [-4.4, 4.4], equal: true, height: 350, axes: false, weight: 1.15 });
        const sp = v.stage({ x: [1750, 2000], y: [1e-18, 1], ylog: true, height: 350, axes: 'box', weight: 1, xlabel: 'year', title: 'limits on $|\\delta|$ from null experiments' });
        const step = v.select('', [{ value: 1, label: '1 · charge the outer globe' }, { value: 2, label: '2 · withdraw the wire' }, { value: 3, label: '3 · remove the outer globe' }, { value: 4, label: '4 · test the inner globe' }], 4);
        const law = v.select('force law', [{ value: 'p', label: '$1/r^{2+\\delta}$' }, { value: 'm', label: '$1/r^{2-\\delta}$' }, { value: 'z', label: 'exactly $1/r^2$' }], 'p');
        const lg = v.slider('$\\log_{10}|\\delta|$', -17, -1, -1.5, { step: 0.1 });
        /** Potential at distance r (cm) from the centre of a unit-charge shell of radius R, for a 1/r^{1+δ} potential law (units k·s₀^δ). */
        const g = (r, R, d) => ((R + r) ** (1 - d) - Math.abs(R - r) ** (1 - d)) / (2 * R * r * (1 - d));
        const g1 = (r, R) => { const g0 = (R + r - Math.abs(R - r)) / (2 * R * r), L = (x) => (x > 0 ? x * Math.log(x) : 0); return g0 - (L(R + r) - L(Math.abs(R - r))) / (2 * R * r); };
        /** Charge ratio q_inner/Q_outer after connecting the globes (linear in δ for tiny δ to avoid round-off). */
        const ratio = (d) => {
          if (d === 0) return 0;
          if (Math.abs(d) < 1e-4) return (d * (g1(b, b) - g1(a, b))) / (1 / a - 1 / b);
          return (g(b, b, d) - g(a, b, d)) / (g(a, a, d) - g(b, a, d));
        };
        const DATA = [[1773, 2e-2, 'Cavendish'], [1873, 4.6e-5, 'Maxwell'], [1936, 2e-9, 'Plimpton & Lawton'], [1970, 1.3e-13, 'Bartlett et al.'], [1971, 3.1e-16, 'Williams, Faller & Hill']];
        let st = null;
        v.render(() => {
          lg.el.hidden = law.value === 'z';
          const d = law.value === 'z' ? 0 : (law.value === 'p' ? 1 : -1) * Math.pow(10, lg.value), k = step.value;
          const Qb = 4 * Math.PI * C.eps0 * b * 0.01 * V0, qa = ratio(d) * Qb, qDirect = 4 * Math.PI * C.eps0 * a * 0.01 * V0, thr = qDirect / 60;
          const ra = a / 5, rb = b / 5; // drawing scale: 1 unit = 5 cm
          // inner globe
          const qcol = Math.abs(qa) > thr ? sgnCol(qa) : 'muted';
          s.circle(0, 0, ra, { fill: 'muted', fillAlpha: 0.12, color: 'ink', width: 1.8 });
          if (Math.abs(qa) > 1e-30) { const nS = Math.max(0, Math.min(16, Math.round(16 * Math.log10(1 + Math.abs(qa) / thr) / 2))); for (let j = 0; j < nS; j++) { const t = (TAU * j) / Math.max(nS, 1); s.text(qa > 0 ? '+' : '−', (ra - 0.25) * Math.cos(t), (ra - 0.25) * Math.sin(t), { align: 'center', size: 12, weight: 700, color: qcol, halo: false }); } }
          s.text('inner globe', 0, 0.25, { align: 'center', size: 11.5, color: 'muted' });
          s.text(`q = ${M.si(qa, 'C')}`, 0, -0.3, { align: 'center', size: 12, color: qcol, weight: 600 });
          // outer globe: two hemispheres
          const sep = k >= 3 ? 1.1 : 0, discharged = k >= 3;
          if (k < 4) for (const sg of [-1, 1]) {
            const pts = []; for (let j = 0; j <= 60; j++) { const t = -Math.PI / 2 + (Math.PI * j) / 60; pts.push([sg * (rb * Math.cos(t) + sep), rb * Math.sin(t)]); }
            s.path(pts, { color: discharged ? 'faint' : 'red', width: 4, alpha: discharged ? 0.7 : 0.75 });
            if (!discharged) for (let j = 1; j < 10; j++) { const t = -Math.PI / 2 + (Math.PI * j) / 10; s.text('+', sg * (rb + 0.28) * Math.cos(t), (rb + 0.28) * Math.sin(t), { align: 'center', size: 12, weight: 700, color: 'red' }); }
          }
          if (k === 1) { s.line(0, ra, 0, rb + 0.6, { color: 'gold', width: 2.5 }); s.text('wire', 0.15, rb + 0.45, { size: 11, color: 'gold' }); }
          if (k === 2) { s.line(0.9, rb + 0.3, 0.9, rb + 1.2, { color: 'gold', width: 2.5, alpha: 0.6 }); s.text('wire withdrawn', 1.05, rb + 0.8, { size: 11, color: 'gold' }); }
          s.corner(['', `outer globe at ${V0 / 1000} kV holds ${M.si(Qb, 'C')}; the wire joins the two`, 'the inner globe keeps its charge', 'outer hemispheres taken away and discharged', 'pith balls touch the inner globe'][k], 'tl', { size: 11.5 });
          if (k === 4) {
            const ang = Math.abs(qa) > thr ? Math.min(0.75, 0.2 + 0.18 * Math.log10(Math.abs(qa) / thr)) : 0;
            const top = [-ra - 0.9, 1.4]; s.line(-ra, 0, top[0], 0, { color: 'ink', width: 2 }); s.line(top[0], 0, top[0], top[1], { color: 'ink', width: 2 });
            for (const sg of [-1, 1]) { const x = top[0] + sg * 1.4 * Math.sin(ang), y = top[1] - 1.4 * Math.cos(ang); s.line(top[0], top[1], x, y, { color: 'muted', width: 1.2 }); s.dot(x, y, { r: 6, color: ang ? qcol : 'muted' }); }
            s.text(ang ? 'balls diverge!' : 'no divergence', top[0], top[1] + 0.35, { align: 'center', size: 11.5, color: ang ? 'green' : 'muted', weight: 600 });
          }
          // limits panel
                    if (d) { sp.hline(Math.abs(d), { color: 'gold', width: 2, dash: [6, 4] }); sp.text('your |δ|', 1995, Math.abs(d), { align: 'right', size: 11, color: 'gold', dy: Math.abs(d) > 1e-3 ? 12 : -10 }); }
          for (const [yr, lim, who] of DATA) {
            const seen = Math.abs(d) > lim; sp.line(yr, lim, yr, 1e-18, { color: seen ? 'green' : 'faint', width: 1, alpha: 0.5 });
            sp.dot(yr, lim, { r: 6, color: seen ? 'green' : 'muted' });
            sp.text(who, yr, lim, { size: 11, color: seen ? 'green' : 'muted', align: yr > 1900 ? 'right' : 'left', dx: yr > 1900 ? -9 : 9, dy: yr === 1970 ? -9 : yr === 1971 ? 9 : -2 });
          }
          st = { d, qa, Qb, thr, r: ratio(d) };
        });
        v.readout(() => {
          const { d, qa, Qb, thr, r } = st, n = Math.abs(qa) / C.e;
          if (!d) return `exactly inverse-square: the potential inside the outer globe is constant, the wire carries no charge, $q_{\\text{inner}} = 0$ — every null experiment is consistent with this`;
          return `$\\delta = ${v.sci(d, 2)}$ · after connecting: $q_{\\text{inner}}/Q_{\\text{outer}} = ${v.sci(r, 3)}$ (≈ ${v.fix(r / d, 3)} δ) · $q_{\\text{inner}}$ = ${M.si(qa, 'C')} ≈ ${n < 1e6 ? v.fmt(Math.round(n), 6) : '$' + v.sci(n, 2) + '$'} electrons · Cavendish’s pith balls needed about ${M.si(thr, 'C')}: ${Math.abs(qa) > thr ? '**he would have seen it**' : 'below his threshold'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.19
    {
      num: '1.19',
      kind: 'Definition',
      name: 'Point charge as a delta distribution',
      statement: String.raw`The density of a point charge $q$ at the origin is the **delta distribution** $\rho = q\,\delta^3(\mathbf r)$: the linear functional that assigns to each smooth, compactly supported test function $\varphi$ the number $\langle\rho,\varphi\rangle = q\,\varphi(\mathbf 0)$. In this sense the Coulomb field satisfies Gauss’s law in differential form everywhere, including at the charge:
$$\nabla\cdot\frac{\hat{\mathbf r}}{r^2} = 4\pi\,\delta^3(\mathbf r),\qquad\text{i.e.}\qquad -\int \mathbf E\cdot\nabla\varphi\,d\tau = \frac{q}{\varepsilon_0}\varphi(\mathbf 0)\ \text{ for every test function }\varphi,$$
although $\nabla\cdot\mathbf E = 0$ pointwise at every $\mathbf r\neq\mathbf 0$. It is the limit of any family of smooth densities of total charge $q$ shrinking to the origin.`,
      idea: String.raw`Distributional derivatives move the derivative onto the test function: $\langle\nabla\cdot\mathbf E,\varphi\rangle := -\int\mathbf E\cdot\nabla\varphi$ (fa-6.11, fa-6.12). For the Coulomb field, cut out a small ball around the origin; outside it $\nabla\cdot\mathbf E = 0$, and the divergence theorem leaves only the flux through the little sphere weighted by $\varphi$, which tends to $\varphi(\mathbf 0)\,q/\varepsilon_0$ — Gauss’s law at the smallest scale (em-1.15). For a charged ball of radius $a$ the pairing equals $\int\rho_a\varphi/\varepsilon_0$, and as $a\to0$ with $q$ fixed the density spikes like $1/a^3$ while the pairing converges to $q\varphi(\mathbf 0)/\varepsilon_0$, with an error of order $a^2\nabla^2\varphi$.`,
      caption: String.raw`The test function $\varphi$ is a smooth bump (shaded, contours) of radius $\ell$ centred at the gold handle; the red disk is a ball of charge $q = 1$ nC and radius $a$. Shrink $a$: the readout shows the central density blowing up while $-\int\mathbf E\cdot\nabla\varphi\,d\tau$, computed by numerical integration, settles on $q\varphi(\mathbf 0)/\varepsilon_0$. The right panel shows the error for every $a$ at once — falling like $a^2$ for any shape of the shrinking charge (try the Gaussian and the thin shell). Move the bump off the origin and the limit follows $\varphi(\mathbf 0)$, down to zero.`,
      deps: ['em-1.15', 'fa-6.11', 'fa-6.12'],
      refs: ['Griffiths §1.5'],
      tags: ['delta', 'distributions'],
      viz(v) {
        const M = v.M, C = M.CONST, q = 1e-9, kq = C.ke * q;
        const s = v.stage({ x: [-3, 3], y: [-2.6, 2.6], equal: true, height: 330, axes: false, weight: 1.1, title: 'test function $\\varphi$ and the shrinking charge' });
        const sp = v.stage({ x: [0.005, 2], y: [1e-8, 1], xlog: true, ylog: true, height: 330, axes: 'box', weight: 1, xlabel: 'size a of the charge (cm)', title: 'relative error of the pairing vs $q\\varphi(0)/\\varepsilon_0$' });
        const shape = v.select('charge', [{ value: 'ball', label: 'uniform ball' }, { value: 'gauss', label: 'Gaussian' }, { value: 'shell', label: 'thin shell' }], 'ball');
        const aS = v.slider('size $a$', 0.005, 2, 0.6, { log: true, fmt: (x) => `${x.toPrecision(2)} cm` });
        const lS = v.slider('bump radius $\\ell$', 0.8, 2.4, 1.6, { step: 0.05, fmt: (x) => `${x.toFixed(2)} cm` });
        const B = s.handle(0.45, 0.25, { color: 'gold', r: 6 });
        const erf = M.erf;
        const Menc = (r, a) => (shape.value === 'ball' ? Math.min(1, (r / a) ** 3) : shape.value === 'gauss' ? erf(r / (Math.SQRT2 * a)) - Math.sqrt(2 / Math.PI) * (r / a) * Math.exp(-(r * r) / (2 * a * a)) : r >= a ? 1 : 0);
        const phi = (u) => (u < 1 ? Math.exp(1 - 1 / (1 - u)) : 0); // u = |x − c|²/ℓ², φ(c) = 1
        const dphi = (u) => (u < 1 ? -phi(u) / (1 - u) ** 2 : 0);
        /** −∫E·∇φ dτ for the radial field kq·M(r)/r² (V·m): 2D integral over r and w = cosθ (axis along the bump centre). */
        const pairing = (a, c, l, Mf) => {
          const r0 = Math.max(0, c - l), r1 = c + l, br = shape.value === 'shell' ? [a] : [a, Math.min(r1, 4 * a)];
          const inner = (r) => {
            if (r <= 0) return 0;
            const wlo = c < 1e-9 ? -1 : Math.max(-1, Math.min(1, (r * r + c * c - l * l) / (2 * r * c)));
            if (c < 1e-9 && r >= l) return 0;
            return quad((w) => { const u = (r * r + c * c - 2 * r * c * w) / (l * l); return dphi(u) * (2 * (r - c * w)) / (l * l); }, wlo, 1, 1e-9, 14, 4);
          };
          return -TAU * kq * quadBreaks((r) => Mf(r, a) * inner(r), r0, r1, br, 1e-9, 18);
        };
        let st = null;
        v.render(() => {
          const a = aS.value, l = lS.value, c = Math.hypot(B.x, B.y), Pc = v.rgb('panel'), G = v.rgb('green');
          s.raster((x, y) => { const f = phi(((x - B.x) ** 2 + (y - B.y) ** 2) / (l * l)), k = 0.5 * f; return [Pc[0] + (G[0] - Pc[0]) * k, Pc[1] + (G[1] - Pc[1]) * k, Pc[2] + (G[2] - Pc[2]) * k]; }, { res: 3, key: `${B.x}|${B.y}|${l}|${Pc.join(',')}` });
          s.contour((x, y) => phi(((x - B.x) ** 2 + (y - B.y) ** 2) / (l * l)), [0.1, 0.3, 0.5, 0.7, 0.9], { color: v.color('green', 0.7), width: 1 });
          s.circle(B.x, B.y, l, { color: 'green', width: 1.2, dash: [4, 4] });
          // the charge
          if (shape.value === 'shell') s.circle(0, 0, a, { color: 'red', width: 2.5 });
          else if (shape.value === 'gauss') { for (const f of [2, 1.4, 1, 0.6]) s.circle(0, 0, a * f, { fill: 'red', fillAlpha: 0.18, stroke: false }); }
          else s.circle(0, 0, a, { fill: 'red', fillAlpha: 0.55, color: 'red', width: 1.2 });
          s.dot(0, 0, { r: 2.5, color: 'red' });
          s.line(-0.15, 0, 0.15, 0, { color: 'ink', width: 1 }); s.line(0, -0.15, 0, 0.15, { color: 'ink', width: 1 });
          const target = 4 * Math.PI * kq * phi((c * c) / (l * l)), Ia = pairing(a, c, l, Menc), Ip = pairing(a, c, l, () => 1);
          // error for every a
          const pts = []; for (let i = 0; i <= 36; i++) { const aa = 0.005 * Math.pow(400, i / 36), e = Math.abs(pairing(aa, c, l, Menc) - target) / (4 * Math.PI * kq); pts.push([aa, Math.max(e, 1e-12)]); }
          const lo = Math.max(1e-11, Math.min(...pts.map((p) => p[1]))) / 3; sp.setView([0.005, 2], [lo, 3]);
          const ref = pts.find((p) => p[0] > 0.1) || pts[0];
          sp.fn((x) => ref[1] * (x / ref[0]) ** 2, { color: 'muted', dash: [4, 4], width: 1 });
          sp.text('slope 2', 0.02, ref[1] * (0.02 / ref[0]) ** 2, { size: 11, color: 'muted', dy: -10 });
          sp.path(pts, { color: 'accent', width: 2.4 });
          sp.dot(a, Math.max(Math.abs(Ia - target) / (4 * Math.PI * kq), lo * 1.01), { r: 6, color: 'gold' });
          const rho0 = shape.value === 'ball' ? q / ((4 / 3) * Math.PI * (a * 0.01) ** 3) : shape.value === 'gauss' ? q / ((TAU) ** 1.5 * (a * 0.01) ** 3) : Infinity;
          st = { Ia, Ip, target, rho0, phi0: phi((c * c) / (l * l)) };
        });
        v.legend([['green', 'test function $\\varphi$ (contours 0.1 … 0.9)'], ['red', 'the charge $q = 1$ nC'], ['accent', 'error of the pairing']]);
        v.readout(() => {
          const { Ia, Ip, target, rho0, phi0 } = st;
          return `central density $\\rho(0)$ = ${isFinite(rho0) ? M.si(rho0, 'C/m³') : 'a surface charge'} · $\\varphi(0) = ${v.fix(phi0, 4)}$ · $-\\int\\mathbf E\\cdot\\nabla\\varphi\\,d\\tau$ = ${M.si(Ia, 'V·m', 6)} → $q\\varphi(0)/\\varepsilon_0$ = ${M.si(target, 'V·m', 6)} · for the true point charge the same integral gives ${M.si(Ip, 'V·m', 6)}, although $\\nabla\\cdot\\mathbf E = 0$ at every point except the origin`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.20
    {
      num: '1.20',
      kind: 'Paper',
      name: 'The Elementary Electrical Charge and the Avogadro Constant',
      paper: { authors: 'R. A. Millikan', year: 1913, title: 'On the Elementary Electrical Charge and the Avogadro Constant', venue: 'Physical Review 2 (2): 109–143', doi: '10.1103/PhysRev.2.109' },
      introduces: [],
      statement: String.raw`Millikan timed single oil drops, each held for hours between charged plates, falling under gravity and rising in the field, and showed that every charge a drop carried — and every *change* of charge when it caught an ion — was an exact whole multiple of one unit. Measuring drops of many sizes at air pressures from atmospheric down to a few centimetres of mercury, he found that Stokes’s drag law needs a correction $1 + b/pa$ for drops comparable to the mean free path of the air ($p$ the pressure, $a$ the radius), and that the apparent unit $e_1$ obeys $e_1^{2/3} = e^{2/3}\,(1 + b/pa)$, a straight line in $1/pa$ whose intercept gives
$$e = 4.774\times10^{-10}\ \text{esu} = 1.592\times10^{-19}\ \text{C}\quad(\pm0.2\%),$$
and, with Faraday’s constant from electrolysis, Avogadro’s number $N = F/e = 6.062\times10^{23}$ per mole. The value is 0.6 % below today’s exact $e$, almost entirely because the viscosity of air he used was too small.`,
      idea: String.raw`Before Millikan, $e$ was inferred from the fall of whole charged clouds (Townsend, J. J. Thomson, H. A. Wilson), good to perhaps 25 %, and whether electricity was granular at all was still argued — Ehrenhaft claimed to see "subelectrons". Millikan’s 1909–1910 work switched from clouds to single drops of non-evaporating oil; the 1913 paper is the precision version. Each drop gives its charge from two speeds through Stokes’s law (fluid-7.2) and the uniform field between plates (em-1.10); catching ions from an X-ray burst changes the charge in whole steps (em-1.1). The correction to Stokes’s law, tested by varying the pressure, removed the last systematic dependence on drop size. The result fixed $e$, and with it Avogadro’s number, the electron mass and (with spectroscopy) Planck’s constant, to a few parts in a thousand; Kellström’s better viscosity of air (1937) raised it to today’s value.`,
      caption: String.raw`**Simulated** drops in Millikan’s chamber — plates 16 mm apart at 5 kV, clock oil, air at 23 °C, pressures 12–76 cm of mercury — generated from today’s $e$, today’s viscosity of air and a Stokes correction, then analysed the way the paper does (the paper’s own tables are not reproduced). Left: one drop timed again and again; press *X-ray burst* to change its charge — every charge is a whole number $n$ of units. Right: the paper’s central plot, $e_1^{2/3}$ against $1/pa$ for many drops; its straight-line intercept gives $e$. Switch to Millikan’s viscosity and you recover his low value; switch off the Stokes correction and the scatter of $e_1$ is left unexplained.`,
      deps: ['em-1.1', 'em-1.10', 'fluid-7.2'],
      refs: [],
      tags: ['charge', 'history of physics'],
      credit: 'R. A. Millikan, 1913',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Oil_drop_experiment' },
      viz(v) {
        const M = v.M, C = M.CONST, g = 9.80, RHO = 919.9 - 1.2, EF = 5000 / 0.016, DIST = 0.01, ETA_TRUE = 1.8325e-5, B_TRUE = 6.2e-4; // b in cm·cmHg
        const sT = v.stage({ x: [0, 1], y: [0, 1], height: 330, axes: false, weight: 1, title: 'one drop, timed again and again' });
        const sp = v.stage({ x: [0, 6], y: [1.3, 2], height: 330, axes: 'box', weight: 1.15, xlabel: '1/pa  (10³ per cm·cmHg)', title: '$e_1^{2/3}$ against $1/pa$ — the paper’s plot ($e_1$ in $10^{-19}$ C)' });
        const visc = v.select('viscosity of air (23 °C)', [{ value: 'm', label: 'Millikan 1913: $1.824\\times10^{-5}$' }, { value: 'k', label: 'Kellström 1937: $1.8325\\times10^{-5}$' }], 'm');
        const corr = v.toggle('correct Stokes’s law for small drops', true);
        /** One timing of a drop of true radius a (m) with n charges at pressure p (cmHg): [t_g, t_F]. */
        const timing = (a, n, p, r) => {
          const cun = 1 + B_TRUE / (p * a * 100), mg = (4 / 3) * Math.PI * a ** 3 * RHO * g;
          const vg = ((2 * a * a * RHO * g) / (9 * ETA_TRUE)) * cun, vF = ((n * C.e * EF - mg) / (6 * Math.PI * ETA_TRUE * a)) * cun;
          return [(DIST / vg) * (1 + 0.0015 * r.normal()), (DIST / vF) * (1 + 0.0015 * r.normal())];
        };
        /** Millikan’s analysis of one timing with viscosity eta: apparent radius a1 and apparent unit e1 = e_n/n. */
        const analyse = (tg, tF, n, eta) => {
          const vg = DIST / tg, vF = DIST / tF, a1 = Math.sqrt((9 * eta * vg) / (2 * RHO * g));
          return { a1, e1: ((6 * Math.PI * eta * a1) / EF) * (vg + vF) / n };
        };
        // the population of drops for the plot (seeded)
        const drops = [];
        for (let i = 0; i < 46; i++) {
          const r = v.rng(911 + 31 * i), a = Math.exp(r.uniform(Math.log(0.55e-6), Math.log(3.2e-6))), p = Math.exp(r.uniform(Math.log(12), Math.log(76)));
          const mg = (4 / 3) * Math.PI * a ** 3 * RHO * g; let n = r.int(3, 18); if (n * C.e * EF < 1.15 * mg) n = Math.ceil((1.15 * mg) / (C.e * EF)) + r.int(0, 4);
          const [tg, tF] = timing(a, n, p, r); drops.push({ a, p, n, tg, tF });
        }
        // the drop in the log
        const D0 = { a: 1.05e-6, p: 24 }; let log = [], rngL = v.rng(77), nNow = 9;
        const addRow = (n) => { const [tg, tF] = timing(D0.a, n, D0.p, rngL); log.push({ n, tg, tF }); if (log.length > 8) log.shift(); };
        [9, 9, 11, 10, 13, 12].forEach((n) => { nNow = n; addRow(n); });
        v.button('X-ray burst (the drop catches ions)', () => { let dn = 0; while (!dn) dn = rngL.int(-3, 3); nNow = Math.max(4, Math.min(22, nNow + dn)); addRow(nNow); });
        v.button('time it again', () => addRow(nNow));
        const T = v.table(sT, { rows: 8, cols: 5, square: false, cellAspect: 2.1, maxCell: 34, size: 13, labelSize: 13, colLabels: ['$t_g\\ (\\mathrm{s})$', '$t_F\\ (\\mathrm{s})$', '$n$', '$e_1$', '$e$'], colWeights: [1.15, 1.15, 0.6, 1.1, 1.1] });
        let st = null;
        v.render(() => {
          const eta = visc.value === 'm' ? 1.824e-5 : ETA_TRUE;
          // Millikan’s reduction: e1^(2/3) against 1/pa, with the radius corrected by the fitted b (a few passes)
          const an = drops.map((d) => analyse(d.tg, d.tF, d.n, eta));
          const radius = (a1, p, b) => { let a = a1; for (let k = 0; k < 30; k++) a = a1 / Math.sqrt(1 + b / (p * a * 100)); return a; };
          let bFit = 0, L = null, pts = [];
          for (let pass = 0; pass < 30; pass++) {
            pts = drops.map((d, i) => ({ x: 1 / (d.p * radius(an[i].a1, d.p, bFit) * 100) / 1e3, y: Math.pow(an[i].e1 / 1e-19, 2 / 3), e1: an[i].e1 }));
            L = M.linreg(pts.map((q) => q.x), pts.map((q) => q.y)); bFit = 0.5 * (bFit + L.slope / L.intercept / 1e3); // b in cm·cmHg (x is in 10³/(cm·cmHg)); damped fixed point
          }
          const c = L.intercept, eFit = Math.pow(c, 1.5) * 1e-19, se = 1.5 * Math.sqrt(c) * L.seIntercept * 1e-19;
          const mean1 = pts.reduce((s, q) => s + q.e1, 0) / pts.length, sd1 = Math.sqrt(pts.reduce((s, q) => s + (q.e1 - mean1) ** 2, 0) / (pts.length - 1));
          // the plot
          const xs = pts.map((q) => q.x), ys = pts.map((q) => q.y), xmax = Math.max(...xs) * 1.08, y0 = Math.min(...ys, c) - 0.12, y1 = Math.max(...ys) + 0.06;
          sp.setView([0, xmax], [y0, y1]);
          if (corr.value) { sp.fn((x) => c + L.slope * x, { color: 'green', width: 2.2, domain: [0, xmax] }); sp.line(0, c, xmax * 0.06, c + (y1 - y0) * 0.3, { color: 'green', width: 1, dash: [3, 3] }); sp.dot(0, c, { r: 6, color: 'green' }); sp.tex(String.raw`\text{intercept} = e^{2/3}`, xmax * 0.06, c + (y1 - y0) * 0.3, { color: 'green', size: 13, align: 'left', baseline: 'bottom', dy: -2 }); }
          else sp.hline(Math.pow(mean1 / 1e-19, 2 / 3), { color: 'red', width: 1.6, dash: [6, 4] });
          sp.dots(pts.map((q) => [q.x, q.y]), { r: 4, color: 'accent' });
          const A0 = analyse(log[log.length - 1].tg, log[log.length - 1].tF, log[log.length - 1].n, eta), x0 = 1 / (D0.p * radius(A0.a1, D0.p, bFit) * 100) / 1e3;
          sp.dot(x0, Math.pow(A0.e1 / 1e-19, 2 / 3), { r: 6, color: 'gold' });
          // the log table
          const rows = log.map((row) => { const A = analyse(row.tg, row.tF, row.n, eta), ec = A.e1 / Math.pow(1 + bFit / (D0.p * radius(A.a1, D0.p, bFit) * 100), 1.5); return [v.fix(row.tg, 2), v.fix(row.tF, 2), String(row.n), v.fix(A.e1 * 1e19, 4), corr.value ? v.fix(ec * 1e19, 4) : '—']; });
          T.draw({ rows: rows.length, value: (i, j) => rows[i][j], fill: (i) => (i > 0 && log[i].n !== log[i - 1].n ? ['gold', 0.18] : null), sub: (i, j) => (j === 2 && i > 0 && log[i].n !== log[i - 1].n ? `${log[i].n > log[i - 1].n ? '+' : '−'}${Math.abs(log[i].n - log[i - 1].n)}` : null), subColor: 'gold' });
          st = { eFit, se, bFit, mean1, sd1, eta };
        });
        v.legend([['accent', 'drops (simulated)', { dot: true }], ['gold', 'the drop in the table', { dot: true }], ['green', 'straight-line fit; intercept $= e^{2/3}$'], ['red', 'mean $e_1$ without the correction', { dash: true }]]);
        v.readout(() => {
          const { eFit, se, bFit, mean1, sd1 } = st, eMil = 1.5924e-19, NA = C.F / eFit;
          const head = corr.value
            ? `intercept: **e = (${v.fix(eFit * 1e19, 4)} ± ${v.fix(se * 1e19, 4)})×10⁻¹⁹ C**, correction constant $b = ${v.sci(bFit, 3)}$ cm·cmHg`
            : `without the correction the apparent units scatter: $e_1$ = (${v.fix(mean1 * 1e19, 3)} ± ${v.fix(sd1 * 1e19, 3)})×10⁻¹⁹ C, growing for small drops at low pressure`;
          return `${head} · paper: 1.5924×10⁻¹⁹ C (4.774×10⁻¹⁰ esu) · today: ${v.fix(C.e * 1e19, 9)}×10⁻¹⁹ C exact · $N_A = F/e$ = ${v.sci(corr.value ? NA : C.F / mean1, 4).includes('times') ? '$' + v.sci(corr.value ? NA : C.F / mean1, 4) + '$' : ''}/mol (paper: $6.062\\times10^{23}$, today $6.02214076\\times10^{23}$)` + (corr.value ? ` · your $e$ is ${v.fix((eFit / eMil - 1) * 100, 2)} % from Millikan’s and ${v.fix((eFit / C.e - 1) * 100, 2)} % from today’s` : '');
        });
      },
    },
  ],
};
