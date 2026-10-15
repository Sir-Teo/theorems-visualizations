// Electromagnetism — Chapter 1: Charges, forces and Gauss's law (items 1.11–1.19; 1.1–1.10 in ch01.js)
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
            if (k % 60 === 0) out.push([S[0] * 100, S[1] * 100, S[2]]);
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
          s.dot(x + hx, y + hy, { r: ghost ? 4 : 7, color: 'red', alpha, ring: !ghost }); s.dot(x - hx, y - hy, { r: ghost ? 4 : 7, color: 'blue', alpha, ring: !ghost });
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
  ],
};
