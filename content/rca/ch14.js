// Rudin, Real and Complex Analysis — Chapter 14: Conformal Mapping

// ---------------------------------------------------------------- helpers shared by this file
const TAU = 2 * Math.PI;
// Phase-portrait colour of w = re + i im: hue = arg w, bands = log2|w| (as in Stage.domain).
function phaseRGB(M, re, im, fade = 0, bg = null) {
  if (!isFinite(re) || !isFinite(im)) return bg ? [bg[0], bg[1], bg[2]] : [250, 250, 250];
  const t = M.fract(Math.log2(Math.hypot(re, im) + 1e-300));
  const c = M.hsl2rgb(Math.atan2(im, re) / TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
  if (!fade || !bg) return c;
  return [c[0] + (bg[0] - c[0]) * fade, c[1] + (bg[1] - c[1]) * fade, c[2] + (bg[2] - c[2]) * fade];
}
// Polar checkerboard colour of a point w of the unit disc (hue = arg w, alternating light/dark cells).
function polarCheck(M, re, im, rings = 10, sectors = 16) {
  const m = Math.hypot(re, im), a = Math.atan2(im, re);
  const i = Math.floor(m * rings), j = Math.floor(((a / TAU) + 1) * sectors);
  const odd = (i + j) & 1;
  return M.hsl2rgb(a / TAU, 0.5, odd ? 0.5 : 0.7);
}
// A small "×" with a halo, for poles and critical points.
function xMark(S, x, y, color = 'ink', size = 5.5) {
  const d = size / S.scale;
  for (const [col, w] of [['panel', 5], [color, 2.2]]) {
    S.line(x - d, y - d, x + d, y + d, { color: col, width: w });
    S.line(x - d, y + d, x + d, y - d, { color: col, width: w });
  }
}
// Break a polyline where it runs off to infinity or jumps (images of lines under Möbius maps).
function tame(pts, lim = 80, jump = 6) {
  const out = []; let prev = null;
  for (const p of pts) {
    if (!p || !isFinite(p[0]) || !isFinite(p[1]) || Math.hypot(p[0], p[1]) > lim) { if (prev) out.push(null); prev = null; continue; }
    if (prev && Math.hypot(p[0] - prev[0], p[1] - prev[1]) > jump) out.push(null);
    out.push(p); prev = p;
  }
  return out;
}
const supStr = (n) => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]).join('');
const wrapPi = (a) => a - TAU * Math.round(a / TAU);
const deg = (a) => `${Math.round(a * 180 / Math.PI)}°`;
// Arc of pixel radius `rad` at (x, y) from angle a0, sweeping da (radians).
function angleArc(S, x, y, a0, da, rad, st) {
  const pts = [];
  for (let i = 0; i <= 40; i++) { const a = a0 + da * i / 40; pts.push([x + rad / S.scale * Math.cos(a), y + rad / S.scale * Math.sin(a)]); }
  S.path(pts, st);
}
// Fit an equal-aspect view around a cloud of points.
function fitView(S, pts, pad = 0.12, minHalf = 0.5) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of pts) { if (!p || !isFinite(p[0]) || !isFinite(p[1])) continue; x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  if (!isFinite(x0)) return;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hx = Math.max(minHalf, (x1 - x0) / 2 * (1 + pad)), hy = Math.max(minHalf, (y1 - y0) / 2 * (1 + pad));
  S.setView([cx - hx, cx + hx], [cy - hy, cy + hy]);
}
// Ray–polygon distance from c in direction th (first hit), for star-shaped polygons.
function rayHit(poly, c, th) {
  const dx = Math.cos(th), dy = Math.sin(th); let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length];
    const ex = bx - ax, ey = by - ay, den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-14) continue;
    const t = ((ax - c[0]) * ey - (ay - c[1]) * ex) / den, s = ((ax - c[0]) * dy - (ay - c[1]) * dx) / den;
    if (t > 1e-12 && s >= -1e-12 && s <= 1 + 1e-12) best = Math.min(best, t);
  }
  return best;
}

export default {
  collection: 'rca',
  chapter: 14,
  title: 'Conformal Mapping',
  summary: String.raw`Holomorphic maps with nonvanishing derivative preserve angles, and the linear fractional transformations are the most rigid examples. Montel's theorem (uniformly bounded families are normal) turns the search for a conformal map into an extremal problem, which Rudin solves to prove the Riemann mapping theorem: every simply connected proper subregion of the plane is conformally equivalent to the disc. The chapter then studies the normalized univalent functions of the class $\mathscr S$ (area theorem, $|a_2|\le2$, Koebe's one-quarter theorem), shows that the Riemann map extends to the boundary when the boundary is nice, and proves that annuli of different moduli are not conformally equivalent.`,
  items: [
    // ------------------------------------------------------------------ preservation of angles
    {
      num: '14.1',
      kind: 'Definition',
      name: 'Preservation of angles at a point',
      statement: String.raw`For $z\ne0$ put $A[z]=z/|z|$, the direction of $z$ seen from the origin. Let $f$ map a region $\Omega$ into the plane, let $z_0\in\Omega$, and suppose $f(z)\ne f(z_0)$ in some punctured disc $D'(z_0;r_0)\subset\Omega$. Then $f$ **preserves angles at $z_0$** if the limit
$$\lim_{r\to0^+}e^{-i\theta}A\big[f(z_0+re^{i\theta})-f(z_0)\big]$$
exists and does not depend on $\theta$.`,
      idea: String.raw`$e^{-i\theta}A[\cdot]$ measures how much the ray leaving $z_0$ in direction $\theta$ gets turned by $f$ (at scale $r$). If that turning has a limit that is the *same* for every direction, then any two rays leaving $z_0$ are carried to curves leaving $f(z_0)$ whose tangents make the same angle, with the same orientation. The definition only looks at directions, not at lengths, and only at the single point $z_0$.`,
      caption: String.raw`Drag $z_0$ and the two direction dials (blue, orange); shrink $r$. Right panel: the turning $e^{-i\theta}A[f(z_0+re^{i\theta})-f(z_0)]$ for every $\theta$. For $e^z$, and for $z^2$ away from $0$, it collapses to one point as $r\to0$ (green: $A[f'(z_0)]$). For $z^2$ at $z_0=0$ (it snaps there) it is the whole circle — angles double; for $z+\frac12\bar z$ it never collapses — angles are distorted.`,
      deps: ['rca-10.2'],
      see: ['pma-9.11'],
      tags: ['conformal', 'angles'],
      viz(v) {
        const { Cx } = v.M;
        const FN = {
          exp: { label: '$e^z$', f: (z) => z.exp(), d: (z) => z.exp() },
          sq: { label: '$z^2$', f: (z) => z.mul(z), d: (z) => z.scale(2) },
          lin: { label: '$z+\\tfrac12\\bar z$', f: (z) => z.add(z.conj().scale(0.5)), d: null },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'sq');
        const rS = v.slider('scale $r$', 0.002, 0.8, 0.45, { log: true, fmt: (x) => v.fmt(x, 2) });
        const L = v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, height: 290, title: 'rays leaving $z_0$' });
        const R = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 290, axes: false, title: 'their images leaving $f(z_0)$' });
        const D = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, height: 290, axes: false, title: 'turning $e^{-i\\theta}A[f(z_0+re^{i\\theta})-f(z_0)]$' });
        const RAY = 0.8;
        const z0 = L.handle(0.45, 0.3, { color: 'ink', label: 'z₀', labelPos: 'sw', constrain: (x, y) => { x = v.M.clamp(x, -0.6, 0.6); y = v.M.clamp(y, -0.6, 0.6); return Math.hypot(x, y) < 0.07 ? [0, 0] : [x, y]; } });
        const dial = (t, col) => L.handle(z0.x + RAY * Math.cos(t), z0.y + RAY * Math.sin(t), { color: col, r: 6, constrain: (x, y) => { const a = Math.atan2(y - z0.y, x - z0.x); return [z0.x + RAY * Math.cos(a), z0.y + RAY * Math.sin(a)]; } });
        const d1 = dial(0.3, 'blue'), d2 = dial(1.75, 'orange');
        let prev = [z0.x, z0.y];
        z0.onDrag = () => { for (const d of [d1, d2]) { d.x += z0.x - prev[0]; d.y += z0.y - prev[1]; } prev = [z0.x, z0.y]; };
        let st = null;
        v.render(() => {
          const F = FN[which.value], f = F.f, r = rS.value;
          const c = new Cx(z0.x, z0.y), fc = f(c);
          const th = [d1, d2].map((d) => Math.atan2(d.y - z0.y, d.x - z0.x));
          [d1, d2].forEach((d, k) => { d.x = c.re + RAY * Math.cos(th[k]); d.y = c.im + RAY * Math.sin(th[k]); });
          prev = [z0.x, z0.y];
          // ---- left: fan of rays
          for (let k = 0; k < 16; k++) { const t = TAU * k / 16; L.line(c.re, c.im, c.re + RAY * Math.cos(t), c.im + RAY * Math.sin(t), { color: 'muted', width: 1, alpha: 0.4 }); }
          L.circle(c.re, c.im, Math.min(r, RAY), { color: 'teal', width: 1.8, dash: [4, 3] });
          ['blue', 'orange'].forEach((col, k) => L.line(c.re, c.im, c.re + RAY * Math.cos(th[k]), c.im + RAY * Math.sin(th[k]), { color: col, width: 2.6 }));
          const dth = wrapPi(th[1] - th[0]);
          angleArc(L, c.re, c.im, th[0], dth, 24, { color: 'ink', width: 1.4 });
          // ---- right: images of the rays
          const img = (t, len = RAY, n = 120) => Array.from({ length: n + 1 }, (_, i) => { const w = f(c.add(Cx.polar(len * i / n, t))); return [w.re, w.im]; });
          const fan = Array.from({ length: 16 }, (_, k) => img(TAU * k / 16));
          fitView(R, fan.flat(), 0.18, 0.6);
          for (const p of fan) R.path(p, { color: 'muted', width: 1, alpha: 0.45 });
          const circ = Array.from({ length: 241 }, (_, i) => { const w = f(c.add(Cx.polar(Math.min(r, RAY), TAU * i / 240))); return [w.re, w.im]; });
          R.path(circ, { color: 'teal', width: 1.8, dash: [4, 3] });
          ['blue', 'orange'].forEach((col, k) => R.path(img(th[k]), { color: col, width: 2.6 }));
          // tangent directions at f(z0) (difference quotients at a tiny scale)
          const tan = th.map((t) => f(c.add(Cx.polar(1e-6, t))).sub(fc).arg());
          const span = (R.bounds.x[1] - R.bounds.x[0]) * 0.22;
          ['blue', 'orange'].forEach((col, k) => R.line(fc.re, fc.im, fc.re + span * Math.cos(tan[k]), fc.im + span * Math.sin(tan[k]), { color: col, width: 1.3, dash: [5, 4] }));
          const dimg = wrapPi(tan[1] - tan[0]);
          angleArc(R, fc.re, fc.im, tan[0], dimg, 24, { color: 'ink', width: 1.4 });
          R.dot(fc.re, fc.im, { color: 'ink', r: 4, label: 'f(z₀)', labelPos: 'sw' });
          // ---- third: the turning, for all directions at scale r
          D.circle(0, 0, 1, { color: 'grid', width: 1.5 });
          const turn = (t, rr) => { const w = f(c.add(Cx.polar(rr, t))).sub(fc); const a = w.arg() - t; return [Math.cos(a), Math.sin(a)]; };
          const ring = Array.from({ length: 361 }, (_, i) => turn(TAU * i / 360, r));
          D.path(ring, { color: 'purple', width: 3 });
          let diam = 0; for (let i = 0; i < 360; i += 3) for (let j = i + 3; j < 360; j += 3) diam = Math.max(diam, Math.hypot(ring[i][0] - ring[j][0], ring[i][1] - ring[j][1]));
          const dv = F.d ? F.d(c) : null, ok = dv && dv.abs() > 1e-9;
          if (ok) { const a = dv.arg(); D.dot(Math.cos(a), Math.sin(a), { color: 'green', r: 9, hollow: true, width: 2.4, label: "A[f′(z₀)]", labelPos: Math.cos(a) > 0 ? 'w' : 'e' }); }
          th.forEach((t, k) => { const p = turn(t, r); D.dot(p[0], p[1], { color: k ? 'orange' : 'blue', r: 5.5 }); });
          D.corner(`spread over θ: ${v.fmt(diam, 3)}`, 'bl', { color: diam < 0.02 ? 'green' : 'red', weight: 600 });
          const chord = th.map((t) => f(c.add(Cx.polar(r, t))).sub(fc).arg());
          st = { dth, dimg, dchord: wrapPi(chord[1] - chord[0]), diam, ok, key: which.value, at0: c.abs() < 1e-12 };
          v.legend([['blue', 'direction $\\theta_1$'], ['orange', 'direction $\\theta_2$'], ['teal', 'circle $|z-z_0|=r$ and its image', { dash: true }], ['green', "$A[f'(z_0)]$", { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const verdict = s.key === 'lin' ? 'not preserved: $\\bar z$ turns different directions differently, at every scale.' : s.at0 && s.key === 'sq' ? 'doubled: $f\'(0)=0$, and the turning $e^{i\\theta}$ depends on $\\theta$.' : 'preserved: the turning tends to the single direction of $f\'(z_0)$.';
          return `Rays meet at ${deg(s.dth)}; image chords at scale $r$ meet at ${deg(s.dchord)}; image tangents meet at ${deg(s.dimg)} — angle ${verdict}`;
        });
      },
    },
    {
      num: '14.2',
      kind: 'Theorem',
      name: "Angles are preserved exactly where f′ ≠ 0",
      statement: String.raw`Let $f$ map a region $\Omega$ into the plane and let $z_0\in\Omega$.
(a) If $f'(z_0)$ exists and $f'(z_0)\ne0$, then $f$ preserves angles at $z_0$.
(b) Conversely, if $f$ (viewed as a map of $\R^2$) is differentiable at $z_0$ with a nonzero differential, and $f$ preserves angles at $z_0$, then $f'(z_0)$ exists and is $\ne0$.`,
      idea: String.raw`Write the differential as $Lz=\alpha z+\beta\bar z$ with $\alpha=\partial f(z_0)$, $\beta=\bar\partial f(z_0)$. Then $f(z_0+re^{i\theta})-f(z_0)=r(\alpha e^{i\theta}+\beta e^{-i\theta})+o(r)$, so the turning $e^{-i\theta}A[\cdots]$ tends to $A[\alpha+\beta e^{-2i\theta}]$. (a) If $f'(z_0)$ exists, $\beta=0$ and the limit is $A[f'(z_0)]$ for every $\theta$. (b) If the limit is independent of $\theta$ and $L\ne0$, then $\alpha+\beta e^{-2i\theta}$ has constant direction as $\theta$ runs, which forces $\beta=0$ — the Cauchy–Riemann equations — so $f'(z_0)=\alpha\ne0$.`,
      caption: String.raw`Drag $z_0$ across the grid; it snaps to the red critical points. Middle: the image grid with the images of the blue (horizontal) and orange (vertical) lines through $z_0$ and the angle between them. Right: the differential $Df(z_0)$ applied to the unit circle (rescaled). Angles survive exactly when the image of $e_2$ (orange) equals $i$ times the image of $e_1$ (dashed): then the ellipse is a circle and $\bar\partial f=0$. At a critical point of $z^2$ or $\sin z$ the differential vanishes and the right angle becomes a straight one; $z+\frac13\bar z^2$ preserves angles only at $z_0=0$.`,
      deps: ['rca-14.1', 'rca-10.2'],
      see: ['pma-9.11'],
      tags: ['conformal', 'Cauchy–Riemann'],
      viz(v) {
        const { Cx } = v.M;
        const FN = {
          sq: { label: '$z^2$', f: (z) => z.mul(z), crit: [[0, 0]] },
          sin: { label: '$\\sin z$', f: (z) => z.sin(), crit: [[-Math.PI / 2, 0], [Math.PI / 2, 0]] },
          lin: { label: '$z+\\tfrac12\\bar z$', f: (z) => z.add(z.conj().scale(0.5)), crit: [] },
          qb: { label: '$z+\\tfrac13\\bar z^{2}$', f: (z) => { const w = z.conj(); return z.add(w.mul(w).scale(1 / 3)); }, crit: [], snap: [[0, 0]] },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'sq');
        const X = 1.8, Y = 1.2, STEP = 0.2;
        const L = v.stage({ x: [-1.95, 1.95], y: [-1.35, 1.35], equal: true, height: 270, axes: false, title: 'grid near $z_0$' });
        const R = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 270, axes: false, title: 'its image under $f$' });
        const D = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, height: 270, axes: false, title: '$Df(z_0)$ on the unit circle' });
        const z0 = L.handle(0.7, 0.45, {
          color: 'ink', label: 'z₀', labelPos: 'sw',
          constrain: (x, y) => { x = v.M.clamp(x, -X, X); y = v.M.clamp(y, -Y, Y); const F = FN[which.value]; for (const p of [...F.crit, ...(F.snap || [])]) if (Math.hypot(x - p[0], y - p[1]) < 0.09) return [p[0], p[1]]; return [x, y]; },
        });
        const cache = {};
        const gridImage = (key) => {
          if (cache[key]) return cache[key];
          const f = FN[key].f, lines = [];
          for (let x = -X; x <= X + 1e-9; x += STEP) lines.push({ v: true, pts: Array.from({ length: 161 }, (_, i) => { const w = f(new Cx(x, -Y + 2 * Y * i / 160)); return [w.re, w.im]; }) });
          for (let y = -Y; y <= Y + 1e-9; y += STEP) lines.push({ v: false, pts: Array.from({ length: 201 }, (_, i) => { const w = f(new Cx(-X + 2 * X * i / 200, y)); return [w.re, w.im]; }) });
          return (cache[key] = lines);
        };
        let st = null;
        v.render(() => {
          const key = which.value, F = FN[key], f = F.f;
          const c = new Cx(z0.x, z0.y), fc = f(c);
          // ---- left: the grid
          for (let x = -X; x <= X + 1e-9; x += STEP) L.line(x, -Y, x, Y, { color: 'orange', width: 1, alpha: 0.28 });
          for (let y = -Y; y <= Y + 1e-9; y += STEP) L.line(-X, y, X, y, { color: 'blue', width: 1, alpha: 0.28 });
          const H = 0.42;
          L.line(c.re - H, c.im, c.re + H, c.im, { color: 'blue', width: 3 });
          L.line(c.re, c.im - H, c.re, c.im + H, { color: 'orange', width: 3 });
          angleArc(L, c.re, c.im, 0, Math.PI / 2, 20, { color: 'ink', width: 1.4 });
          for (const p of F.crit) xMark(L, p[0], p[1], 'red', 6);
          // ---- middle: image grid
          const lines = gridImage(key);
          fitView(R, lines.flatMap((l) => l.pts), 0.06, 0.5);
          for (const l of lines) R.path(l.pts, { color: l.v ? 'orange' : 'blue', width: 1, alpha: 0.4 });
          const seg = (dir) => Array.from({ length: 81 }, (_, i) => { const w = f(c.add(dir.scale(-H + 2 * H * i / 80))); return [w.re, w.im]; });
          R.path(seg(new Cx(1, 0)), { color: 'blue', width: 3 });
          R.path(seg(new Cx(0, 1)), { color: 'orange', width: 3 });
          const h = 1e-6;
          const t1 = f(c.add(new Cx(h, 0))).sub(fc).arg(), t2 = f(c.add(new Cx(0, h))).sub(fc).arg();
          const dimg = wrapPi(t2 - t1);
          angleArc(R, fc.re, fc.im, t1, dimg, 20, { color: 'ink', width: 1.4 });
          for (const p of F.crit) { const w = f(new Cx(p[0], p[1])); xMark(R, w.re, w.im, 'red', 6); }
          R.dot(fc.re, fc.im, { color: 'ink', r: 4.5 });
          R.corner(`angle at f(z₀): ${deg(Math.abs(dimg))}`, 'tl', { color: Math.abs(Math.abs(dimg) - Math.PI / 2) < 0.01 ? 'green' : 'red', weight: 600 });
          // ---- right: the differential L = Df(z0) = α z + β z̄
          const hh = 1e-5;
          const fx = f(c.add(new Cx(hh, 0))).sub(f(c.sub(new Cx(hh, 0)))).scale(1 / (2 * hh));
          const fy = f(c.add(new Cx(0, hh))).sub(f(c.sub(new Cx(0, hh)))).scale(1 / (2 * hh));
          const alpha = fx.sub(fy.mul(new Cx(0, 1))).scale(0.5), beta = fx.add(fy.mul(new Cx(0, 1))).scale(0.5);
          const smax = alpha.abs() + beta.abs();
          D.circle(0, 0, 1, { color: 'muted', width: 1.2, dash: [4, 4] });
          D.arrow(0, 0, 1, 0, { color: 'blue', width: 1.2, alpha: 0.35 }); D.arrow(0, 0, 0, 1, { color: 'orange', width: 1.2, alpha: 0.35 });
          if (smax < 1e-6) {
            D.dot(0, 0, { color: 'red', r: 6 });
            D.corner('Df(z₀) = 0', 'tl', { color: 'red', weight: 600 });
          } else {
            const s = 1 / smax;
            const ell = Array.from({ length: 181 }, (_, i) => { const t = TAU * i / 180; const w = alpha.mul(Cx.polar(1, t)).add(beta.mul(Cx.polar(1, -t))).scale(s); return [w.re, w.im]; });
            D.path(ell, { color: 'teal', width: 2.6, fill: 'teal', fillAlpha: 0.1 });
            const e1 = fx.scale(s), e2 = fy.scale(s), ie1 = e1.mul(new Cx(0, 1));
            D.arrow(0, 0, e1.re, e1.im, { color: 'blue', width: 2.6 });
            D.arrow(0, 0, e2.re, e2.im, { color: 'orange', width: 3.2 });
            D.arrow(0, 0, ie1.re, ie1.im, { color: 'blue', width: 1.6, dash: [4, 4] });
            const ratio = beta.abs() / Math.max(alpha.abs(), 1e-12);
            D.corner(`|∂̄f| / |∂f| = ${ratio < 1e-7 ? '0' : v.fmt(ratio, 3)}`, 'tl', { color: ratio < 1e-7 ? 'green' : 'red', weight: 600 });
          }
          st = { alpha, beta, dimg, key, smax };
          v.legend([['blue', 'horizontal direction $e_1$'], ['orange', 'vertical direction $e_2$'], ['blue', '$i\\cdot Df(z_0)e_1$', { dash: true }], ['teal', 'image of the unit circle', { area: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const fmtc = (w) => w.toString(3).replace('i', '\\,i');
          if (s.smax < 1e-6) return `$Df(z_0)=0$: a critical point. The horizontal and vertical lines through $z_0$ are sent to curves meeting at ${deg(Math.abs(s.dimg))} — the angle is doubled, not preserved.`;
          if (s.beta.abs() < 1e-6) return `$\\bar\\partial f(z_0)=0$, so $f'(z_0)=\\partial f(z_0)=${fmtc(s.alpha)}\\ne0$ exists: every angle at $z_0$ is preserved (here ${deg(Math.abs(s.dimg))}).`;
          return `$\\partial f(z_0)=${fmtc(s.alpha)}$, $\\;\\bar\\partial f(z_0)=${fmtc(s.beta)}\\ne0$: no complex derivative, the differential is not a rotation–dilation, and the right angle becomes ${deg(Math.abs(s.dimg))}.`;
        });
      },
    },
    // ------------------------------------------------------------------ linear fractional transformations
    {
      num: '14.3',
      kind: 'Proposition',
      name: 'Linear fractional transformations',
      verify: true,
      statement: String.raw`If $a,b,c,d\in\C$ and $ad-bc\ne0$, the map $\varphi(z)=\dfrac{az+b}{cz+d}$ is a **linear fractional transformation**; regarded as a map of the Riemann sphere $S^2$ (with $\varphi(-d/c)=\infty$, $\varphi(\infty)=a/c$) it is a bijection whose inverse is again linear fractional, and compositions of such maps are linear fractional. Moreover:
(a) every $\varphi$ is a composition of translations, rotation–dilations $z\mapsto\lambda z$ and the inversion $z\mapsto1/z$;
(b) $\varphi$ maps every circle or straight line onto a circle or straight line;
(c) for distinct $z_1,z_2,z_3$ and distinct $w_1,w_2,w_3$ in $S^2$ there is exactly one $\varphi$ with $\varphi(z_j)=w_j$.`,
      idea: String.raw`Composition of maps corresponds to multiplication of the $2\times2$ matrices $\begin{pmatrix}a&b\\c&d\end{pmatrix}$, which gives the group structure. If $c\ne0$, $\varphi(z)=\frac ac-\frac{ad-bc}{c}\cdot\frac1{cz+d}$, which proves (a). Circles and lines are the sets $\alpha|z|^2+\Re(\bar\beta z)+\gamma=0$; translations and dilations preserve this form, and so does $z\mapsto1/z$ (divide by $|z|^2$), giving (b). For (c), $z\mapsto\frac{(z-z_1)(z_2-z_3)}{(z-z_3)(z_2-z_1)}$ sends $z_1,z_2,z_3$ to $0,1,\infty$; compose one such map with the inverse of another. A map fixing $0,1,\infty$ is the identity, whence uniqueness.`,
      caption: String.raw`Drag the three points $z_j$ (left) and the three targets $w_j$ (right): the unique $\varphi$ with $\varphi(z_j)=w_j$ is rebuilt from cross-ratios. The orthogonal families of horizontal and vertical lines go to two orthogonal families of circles, all passing through $\varphi(\infty)$; the gold circle through $z_1,z_2,z_3$ goes to the circle through $w_1,w_2,w_3$. The point marked $\times$ is sent to $\infty$: drag the points until it lies on the gold circle, and the image of that circle becomes a straight line.`,
      deps: ['rca-14.2'],
      see: ['rca-12.4'],
      tags: ['Möbius', 'linear fractional'],
      viz(v) {
        const { Cx } = v.M;
        const L = v.stage({ x: [-2.4, 2.4], y: [-1.8, 1.8], equal: true, height: 330, axes: false, title: '$z$-plane' });
        const R = v.stage({ x: [-2.4, 2.4], y: [-1.8, 1.8], equal: true, height: 330, axes: false, title: '$w=\\varphi(z)=\\frac{az+b}{cz+d}$' });
        const COL = ['blue', 'orange', 'green'];
        const zs = [[-1, -0.35], [0.1, 0.95], [1.1, -0.3]].map((p, k) => L.handle(p[0], p[1], { color: COL[k], label: `z${'₁₂₃'[k]}`, labelPos: 'ne' }));
        const ws = [[-1.3, 0.6], [0.35, -0.95], [1.25, 0.75]].map((p, k) => R.handle(p[0], p[1], { color: COL[k], label: `w${'₁₂₃'[k]}`, labelPos: 'ne' }));
        // 2×2 complex matrices as [a,b,c,d]
        const mmul = (P, Q) => [P[0].mul(Q[0]).add(P[1].mul(Q[2])), P[0].mul(Q[1]).add(P[1].mul(Q[3])), P[2].mul(Q[0]).add(P[3].mul(Q[2])), P[2].mul(Q[1]).add(P[3].mul(Q[3]))];
        const minv = (P) => [P[3], P[1].neg(), P[2].neg(), P[0]];
        const toStd = (p) => { const [z1, z2, z3] = p; const u = z2.sub(z3), w = z2.sub(z1); return [u, z1.mul(u).neg(), w, z3.mul(w).neg()]; };
        const apply = (P, z) => P[0].mul(z).add(P[1]).div(P[2].mul(z).add(P[3]));
        const circ3 = (p) => { // circumcircle of three points, or null if (nearly) collinear
          const [a, b, c] = p.map((q) => [q.re, q.im]);
          const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
          if (Math.abs(d) < 1e-9) return null;
          const s = (q) => q[0] * q[0] + q[1] * q[1];
          const ux = (s(a) * (b[1] - c[1]) + s(b) * (c[1] - a[1]) + s(c) * (a[1] - b[1])) / d, uy = (s(a) * (c[0] - b[0]) + s(b) * (a[0] - c[0]) + s(c) * (b[0] - a[0])) / d;
          return [ux, uy, Math.hypot(a[0] - ux, a[1] - uy)];
        };
        let st = null;
        v.render(() => {
          const Z = zs.map((h) => new Cx(h.x, h.y)), W = ws.map((h) => new Cx(h.x, h.y));
          const degen = (P) => Math.min(P[0].sub(P[1]).abs(), P[1].sub(P[2]).abs(), P[0].sub(P[2]).abs()) < 1e-3;
          if (degen(Z) || degen(W)) { L.corner('the three points must be distinct', 'tl', { color: 'red', weight: 600 }); st = null; return; }
          let P = mmul(minv(toStd(W)), toStd(Z));
          const det = P[0].mul(P[3]).sub(P[1].mul(P[2])); const sq = det.sqrt();
          P = P.map((q) => q.div(sq)); // normalise to ad − bc = 1
          const phi = (z) => apply(P, z);
          // families of lines, parametrised over the whole line (t = tan s) so that images are whole circles
          const linePts = (p0, dir) => Array.from({ length: 401 }, (_, i) => { const s = -Math.PI / 2 + Math.PI * (i + 0.5) / 401; return p0.add(dir.scale(Math.tan(s))); });
          const fam = [];
          for (let k = -6; k <= 6; k++) fam.push({ col: 'purple', pts: linePts(new Cx(k * 0.4, 0), new Cx(0, 1)) });
          for (let k = -4; k <= 4; k++) fam.push({ col: 'teal', pts: linePts(new Cx(0, k * 0.4), new Cx(1, 0)) });
          for (const l of fam) {
            L.path(l.pts.map((z) => [z.re, z.im]), { color: l.col, width: 1.1, alpha: 0.45 });
            R.path(tame(l.pts.map((z) => { const w = phi(z); return [w.re, w.im]; }), 60, 2.5), { color: l.col, width: 1.1, alpha: 0.45 });
          }
          // the circle through z1, z2, z3 and its image
          const cz = circ3(Z);
          if (cz) {
            const pts = Array.from({ length: 721 }, (_, i) => Cx.polar(cz[2], TAU * i / 720).add(new Cx(cz[0], cz[1])));
            L.path(pts.map((z) => [z.re, z.im]), { color: 'gold', width: 3 });
            R.path(tame(pts.map((z) => { const w = phi(z); return [w.re, w.im]; }), 60, 2.5), { color: 'gold', width: 3 });
          }
          // pole and the image of infinity
          const a = P[0], c = P[2], d = P[3];
          const pole = c.abs() > 1e-9 ? d.div(c).neg() : null, finf = c.abs() > 1e-9 ? a.div(c) : null;
          if (pole) { xMark(L, pole.re, pole.im, 'ink', 6.5); L.tex('\\mapsto\\infty', pole.re, pole.im, { color: 'ink', size: 13, align: 'left', dx: 9, dy: -11 }); }
          if (finf) { R.dot(finf.re, finf.im, { color: 'ink', r: 5, label: 'φ(∞)', labelPos: 'sw' }); }
          const err = Math.max(...Z.map((z, j) => phi(z).sub(W[j]).abs()));
          const onCircle = cz && pole ? Math.abs(Math.hypot(pole.re - cz[0], pole.im - cz[1]) - cz[2]) : Infinity;
          st = { P, err, onCircle, pole };
          v.legend([['purple', 'vertical lines and images'], ['teal', 'horizontal lines and images'], ['gold', 'circle through $z_1,z_2,z_3$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return 'Move the points apart.';
          const f = (w) => w.toString(2).replace('i', '\\,i');
          return `$a=${f(s.P[0])},\\ b=${f(s.P[1])},\\ c=${f(s.P[2])},\\ d=${f(s.P[3])}$ (normalised so $ad-bc=1$); $\\;\\max_j|\\varphi(z_j)-w_j| = ${v.sci(s.err, 2)}$.${s.onCircle < 0.04 ? ' The pole lies on the gold circle, so its image is a line.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ normal families
    {
      num: '14.5',
      kind: 'Definition',
      name: 'Normal family',
      statement: String.raw`Let $\Omega$ be a region and $\mathscr F\subset H(\Omega)$. The family $\mathscr F$ is **normal** if every sequence of members of $\mathscr F$ has a subsequence that converges uniformly on every compact subset of $\Omega$. The limit function is not required to belong to $\mathscr F$.`,
      idea: String.raw`Normality is sequential compactness of the closure of $\mathscr F$ in the topology of uniform convergence on compact sets. By 10.28 every such limit is again holomorphic. Uniform convergence on all of $\Omega$ is not asked for — $z^n\to0$ on compact subsets of the unit disc, but $\sup_U|z^n|=1$ for every $n$ — and only a subsequence has to converge.`,
      caption: String.raw`Choose a family, drag the radius of the compact disc $K$ and move along the sequence with $n$. Right: $\sup_K|f_n-f|$ on a log scale, for the candidate limit $f$. For $z^n$ on $U$ it tends to $0$ for every $K$ (but not on $U$ itself). For the rotations $e^{in}z$ the sequence itself never settles; the green subsequence, chosen where $e^{in}$ comes back near $1$, converges. On the larger disc $D(0;1.25)$ the values $z^n$ blow up as soon as $K$ reaches past $|z|=1$: no subsequence converges there.`,
      deps: ['rca-10.28'],
      see: ['fa-1.45', 'pma-7.22'],
      tags: ['normal families', 'compactness'],
      viz(v) {
        const { Cx } = v.M;
        const FAM = {
          pow: { label: '$z^n$ on $U$', R: 1, N: 60, f: (n, z) => z.pow(n), g: () => new Cx(0, 0), supK: (n, rho) => rho ** n, supO: () => 1 },
          rot: { label: '$e^{in}z$ on $U$', R: 1, N: 400, f: (n, z) => z.mul(Cx.polar(1, n)), g: (z) => z, supK: (n, rho) => rho * Math.abs(2 * Math.sin(n / 2)), supO: (n) => Math.abs(2 * Math.sin(n / 2)) },
          big: { label: '$z^n$ on $D(0;1.25)$', R: 1.25, N: 60, f: (n, z) => z.pow(n), g: () => new Cx(0, 0), supK: (n, rho) => rho ** n, supO: (n) => 1.25 ** n },
        };
        // record-setting returns of e^{in} to 1: a convergent subsequence of the rotations
        const recs = []; { let best = Infinity; for (let n = 1; n <= 400; n++) { const d = Math.abs(2 * Math.sin(n / 2)); if (d < best) { best = d; recs.push(n); } } }
        const which = v.select('', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'pow');
        const nS = v.slider('$n$', 1, 60, 12, { int: true });
        const Lt = v.stage({ x: [-1.4, 1.4], y: [-1.4, 1.4], equal: true, height: 310, axes: false, title: '$|f_n-f|$ on $\\Omega$, and the compact disc $K$' });
        const Rt = v.stage({ x: [0, 61], y: [-8, 1], height: 310, axes: 'box', xlabel: 'n', title: '$\\sup_K|f_n-f|$ (log scale)' });
        const kH = Lt.handle(0.75 * Math.cos(-0.6), 0.75 * Math.sin(-0.6), { color: 'accent', r: 6, label: 'K', labelPos: 'se', constrain: (x, y) => { const F = FAM[which.value]; const m = v.M.clamp(Math.hypot(x, y), 0.1, F.R * 0.98); const a = Math.atan2(y, x); return [m * Math.cos(a), m * Math.sin(a)]; } });
        let last = null, st = null;
        v.render(() => {
          const key = which.value, F = FAM[key];
          if (last !== key) {
            last = key; nS.input.max = F.N; if (nS.value > F.N) nS.set(F.N);
            if (key === 'rot' && nS.value < 44) nS.value = 44;
            if (key !== 'rot' && nS.value > 60) nS.value = 12;
            const m = Math.hypot(kH.x, kH.y); if (m > F.R * 0.98) { kH.x *= F.R * 0.95 / m; kH.y *= F.R * 0.95 / m; }
            Rt.setView([0, F.N + 1], null);
          }
          const n = nS.value, rho = Math.hypot(kH.x, kH.y);
          Lt.raster((x, y) => { if (x * x + y * y >= F.R * F.R) return null; const z = new Cx(x, y), d = F.f(n, z).sub(F.g(z)).abs(); return v.M.cmap(Math.pow(Math.min(1, d / 1.2), 0.6), 'viridis'); }, { key: `${key}|${n}`, res: 2 });
          Lt.corner('dark: |fₙ − f| ≈ 0', 'bl', { size: 11.5 });
          Lt.circle(0, 0, F.R, { color: 'ink', width: 1.6 });
          if (key === 'big') Lt.circle(0, 0, 1, { color: 'ink', width: 1.2, dash: [4, 4] });
          Lt.circle(0, 0, rho, { color: 'panel', width: 5 });
          Lt.circle(0, 0, rho, { color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.08 });
          // right: log10 sup_K |f_n − f|
          const lg = (x) => Math.log10(Math.max(x, 1e-12));
          const ys = Array.from({ length: F.N }, (_, i) => lg(F.supK(i + 1, rho)));
          const yo = Array.from({ length: F.N }, (_, i) => lg(F.supO(i + 1)));
          const y0 = Math.max(-8, Math.min(-2, Math.floor(Math.min(...ys)) - 0.5)), y1 = Math.max(1, Math.ceil(Math.max(...ys, ...yo)) + 0.5);
          Rt.setView(null, [y0, y1]);
          Rt.setTicks(null, Array.from({ length: 40 }, (_, i) => i - 20).filter((k) => k >= y0 && k <= y1 && (y1 - y0 < 10 || k % 2 === 0)).map((k) => [k, k === 0 ? '1' : `10${supStr(k)}`]));
          const sub = key === 'rot' ? recs : null;
          const isSub = (m) => !sub || sub.includes(m);
          Rt.path(yo.map((y, i) => [i + 1, y]), { color: 'red', width: 1.6, dash: [5, 4] });
          if (key === 'rot') Rt.dots(ys.map((y, i) => [i + 1, y]), { color: 'muted', r: 1.8 });
          else Rt.path(ys.map((y, i) => [i + 1, y]), { color: 'accent', width: 2.2 });
          if (sub) { const pts = sub.map((m) => [m, ys[m - 1]]); Rt.path(pts, { color: 'green', width: 2 }); Rt.dots(pts, { color: 'green', r: 4 }); }
          Rt.vline(n, { color: 'gold', width: 1.4, dash: [3, 3] });
          Rt.dot(n, ys[n - 1], { color: 'gold', r: 5.5 });
          const ok = key === 'big' ? rho <= 1 : true;
          st = { key, n, rho, val: F.supK(n, rho), ok, sub };
          v.legend(key === 'rot'
            ? [['muted', 'all $n$', { dot: true }], ['green', 'subsequence $e^{in_k}\\to1$', { dot: true }], ['red', '$\\sup_U|f_n-f|$', { dash: true }]]
            : [['accent', '$\\sup_K|f_n-0|$'], ['red', key === 'big' ? '$\\sup_{\\Omega}|f_n|$' : '$\\sup_U|f_n-0|=1$', { dash: true }], ['gold', 'current $n$', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.key === 'pow') return `$K=\\overline D(0;${v.fix(s.rho, 2)})$: $\\sup_K|z^n|=${v.fix(s.rho, 2)}^{${s.n}} = ${v.sci(s.val, 2)}\\to0$, uniformly on $K$ — yet $\\sup_U|z^n|=1$. Normal, and the limit $0$ is not in the family.`;
          if (s.key === 'rot') return `The rotations never converge ($|e^{in}-1|$ keeps returning near $2$), but along $n_k = ${s.sub.slice(0, 6).join(', ')},\\dots$ we get $\\sup_K|e^{in_k}z-z|\\to0$. Normal.`;
          return s.ok ? `$K$ lies inside $|z|\\le1$, where $z^n$ is bounded — but drag $K$ past the dashed unit circle.` : `$K$ reaches $|z|=${v.fix(s.rho, 2)}>1$: $\\sup_K|z^n| = ${v.sci(s.val, 3)}\\to\\infty$ along every subsequence, so no subsequence converges uniformly on $K$. Not normal.`;
        });
      },
    },
    {
      num: '14.6',
      kind: 'Theorem',
      name: "Montel's theorem",
      credit: 'Montel, 1907',
      statement: String.raw`Let $\mathscr F\subset H(\Omega)$, $\Omega$ a region, and suppose $\mathscr F$ is uniformly bounded on each compact subset of $\Omega$. Then $\mathscr F$ is a normal family.`,
      idea: String.raw`Exhaust $\Omega$ by compact sets $K_n$ (13.3). On a slightly larger compact set the members of $\mathscr F$ are bounded by a common $M$, so Cauchy's formula bounds their derivatives on $K_n$ by a common constant: $\mathscr F$ is equicontinuous on each $K_n$. Now the Arzelà–Ascoli argument applies: a diagonal process yields a subsequence converging at every point of a countable dense set, and equicontinuity upgrades this to uniform convergence on each $K_n$; one more diagonal process handles all $n$ at once. The picture runs the same diagonal process on Taylor coefficients, where the Cauchy estimates $|c_k|\le M$ supply the compactness and the geometric tail plays the role of equicontinuity.`,
      caption: String.raw`A sequence of 40 000 random functions $f_n(z)=e^{i\theta_n}\frac{z-a_n}{1-\bar a_nz}$, all with $|f_n|\le1$ on $U$. Stage $j$ re-tightens the first $j$ Taylor coefficients: each must lie in the most populated square of side $s_j\to0$ (Bolzano–Weierstrass in the compact discs $|c_k|\le1$), and the members that pass form the next subsequence. Watch the images of the circle $|z|=\rho$ bunch together and $\sup_{|z|\le\rho}|f_{n_k}-f_{n_1}|$ drop below the guaranteed bound $\sum_{k<j}|\Delta c_k|\rho^k+2\rho^j/(1-\rho)$.`,
      deps: ['rca-14.5', 'rca-13.3', 'rca-10.15', 'rca-10.28', 'pma-7.25'],
      see: ['fa-1.45', 'rca-10.26', 'pma-7.23'],
      tags: ['normal families', 'equicontinuity', 'compactness'],
      viz(v) {
        const N = 40000, NC = 6;
        const rnd = v.rng(11);
        const AR = new Float64Array(N), AI = new Float64Array(N), TC = new Float64Array(N), TS = new Float64Array(N);
        for (let n = 0; n < N; n++) { const m = 0.95 * Math.sqrt(rnd()), t = TAU * rnd(), th = TAU * rnd(); AR[n] = m * Math.cos(t); AI[n] = m * Math.sin(t); TC[n] = Math.cos(th); TS[n] = Math.sin(th); }
        // Taylor coefficients: c_0 = −e^{iθ}a, c_k = e^{iθ}(1−|a|²) ā^{k−1}
        const CR = new Float64Array(N * NC), CI = new Float64Array(N * NC);
        for (let n = 0; n < N; n++) {
          const c = TC[n], s = TS[n], ar = AR[n], ai = AI[n];
          CR[n * NC] = -(ar * c - ai * s); CI[n * NC] = -(ar * s + ai * c);
          let pr = 1 - ar * ar - ai * ai, pi = 0;
          for (let k = 1; k < NC; k++) { CR[n * NC + k] = pr * c - pi * s; CI[n * NC + k] = pr * s + pi * c; const t = pr * ar + pi * ai; pi = pi * ar - pr * ai; pr = t; }
        }
        const evalF = (n, x, y) => { // e^{iθ}(z − a)/(1 − ā z)
          const nr = x - AR[n], ni = y - AI[n], dr = 1 - (AR[n] * x + AI[n] * y), di = -(AR[n] * y - AI[n] * x), d = dr * dr + di * di;
          const ur = (nr * dr + ni * di) / d, ui = (ni * dr - nr * di) / d;
          return [ur * TC[n] - ui * TS[n], ur * TS[n] + ui * TC[n]];
        };
        // densest square of side s for coefficient k among the members idx (4×4 windows of bins of side s/4)
        const densest = (idx, k, s) => {
          const b = s / 4, B = Math.ceil(2.2 / b), H = new Int32Array((B + 1) * (B + 1));
          const bin = (u) => Math.min(B - 1, Math.max(0, Math.floor((u + 1.1) / b)));
          for (const i of idx) H[(bin(CR[i * NC + k]) + 1) * (B + 1) + bin(CI[i * NC + k]) + 1]++;
          for (let p = 1; p <= B; p++) for (let q = 1; q <= B; q++) H[p * (B + 1) + q] += H[(p - 1) * (B + 1) + q] + H[p * (B + 1) + q - 1] - H[(p - 1) * (B + 1) + q - 1];
          let best = -1, bp = 0, bq = 0;
          for (let p = 4; p <= B; p++) for (let q = 4; q <= B; q++) { const c = H[p * (B + 1) + q] - H[(p - 4) * (B + 1) + q] - H[p * (B + 1) + q - 4] + H[(p - 4) * (B + 1) + q - 4]; if (c > best) { best = c; bp = p; bq = q; } }
          const x0 = -1.1 + (bp - 4) * b, y0 = -1.1 + (bq - 4) * b;
          return { x0, y0, x1: x0 + s, y1: y0 + s };
        };
        const side = (j) => 0.5 * Math.pow(0.62, j - 1);
        const stages = [{ idx: Array.from({ length: N }, (_, i) => i), cells: [] }];
        for (let j = 1; j <= NC; j++) {
          let idx = stages[j - 1].idx; const s = side(j), cells = [];
          for (let k = 0; k < j; k++) {
            const C = densest(idx, k, s); cells.push(C);
            idx = idx.filter((i) => { const x = CR[i * NC + k], y = CI[i * NC + k]; return x >= C.x0 && x < C.x1 && y >= C.y0 && y < C.y1; });
          }
          stages.push({ idx, cells, s });
        }
        const jS = v.slider('stage $j$', 0, NC, 3, { int: true });
        const rS = v.slider('$\\rho$ (compact set $|z|\\le\\rho$)', 0.2, 0.8, 0.5, { step: 0.01 });
        const GAP = 2.35;
        const T = v.stage({ x: [-1.15, (NC - 1) * GAP + 1.15], y: [-1.18, 1.18], equal: true, height: 150, full: true, axes: false, title: 'Taylor coefficients $c_0,\\dots,c_5$; Cauchy: every $|c_k|\\le1$' });
        const A = v.stage({ x: [-1.15, 1.15], y: [-1.15, 1.15], equal: true, height: 300, axes: false, title: 'images $f_{n_k}(\\{|z|=\\rho\\})$ of the subsequence' });
        const Bs = v.stage({ x: [0, 41], y: [0, 2.2], height: 300, axes: 'box', xlabel: 'k', title: '$\\sup_{|z|\\le\\rho}|f_{n_k}-f_{n_1}|$' });
        let st = null;
        v.render(() => {
          const j = jS.value, rho = rS.value, S = stages[j], idx = S.idx, prev = j > 0 ? stages[j - 1].idx : null;
          // ---- coefficient discs
          for (let k = 0; k < NC; k++) {
            const ox = k * GAP;
            T.circle(ox, 0, 1, { color: 'ink', width: 1.2, fill: 'grid', fillAlpha: 0.25 });
            T.tex(`c_${k}`, ox - 0.95, 0.95, { color: 'muted', size: 13 });
            const pts = (list) => { const out = []; for (let q = 0; q < Math.min(list.length, 2500); q++) { const i = list[q]; out.push([ox + CR[i * NC + k], CI[i * NC + k]]); } return out; };
            if (prev) T.dots(pts(prev), { color: 'muted', r: 1.2, alpha: 0.45 });
            T.dots(pts(idx), { color: k < j ? 'green' : 'accent', r: j ? 1.8 : 1.1, alpha: j ? 1 : 0.5 });
            if (k < j) { const C = S.cells[k]; T.rect(ox + C.x0, C.y0, ox + C.x1, C.y1, { color: 'gold', width: 2 }); }
          }
          // ---- images of the circle |z| = rho
          A.circle(0, 0, 1, { color: 'ink', width: 1.2, dash: [4, 4] });
          const show = idx.slice(0, 60), NP = 120;
          const curves = show.map((i) => Array.from({ length: NP + 1 }, (_, q) => evalF(i, rho * Math.cos(TAU * q / NP), rho * Math.sin(TAU * q / NP))));
          for (let q = curves.length - 1; q >= 0; q--) A.path(curves[q], { color: q === 0 ? 'ink' : 'accent', width: q === 0 ? 2.4 : 1, alpha: q === 0 ? 1 : 0.55 });
          // ---- distances to the first member, measured and guaranteed
          const sup = curves.map((c) => { let m = 0; for (let q = 0; q < NP; q++) m = Math.max(m, Math.hypot(c[q][0] - curves[0][q][0], c[q][1] - curves[0][q][1])); return m; });
          let bound = 0;
          for (const i of show) { let b = 2 * Math.pow(rho, j) / (1 - rho); for (let k = 0; k < j; k++) b += Math.hypot(CR[i * NC + k] - CR[show[0] * NC + k], CI[i * NC + k] - CI[show[0] * NC + k]) * rho ** k; bound = Math.max(bound, b); }
          const top = Math.max(0.25, Math.min(4.4, Math.max(...sup, bound) * 1.15));
          Bs.setView([0, Math.max(12, show.length) + 1], [0, top]);
          Bs.bars(sup.slice(1), { x0: 2, color: 'accent', fillAlpha: 0.7 });
          Bs.hline(bound, { color: 'green', width: 2, dash: [6, 4] });
          Bs.text('guaranteed bound', Bs.bounds.x[1], Math.min(bound, top * 0.95), { color: 'green', size: 12, dx: -6, dy: -9, align: 'right', weight: 600 });
          st = { j, n: idx.length, maxSup: Math.max(...sup), bound, rho, s: S.s };
          v.legend(j ? [['muted', 'members of the previous subsequence', { dot: true }], ['green', 'members kept', { dot: true }], ['gold', `squares of side $s_${j}$`, { area: true }], ['ink', '$f_{n_1}$']]
            : [['accent', 'all 40 000 members', { dot: true }], ['ink', '$f_{n_1}$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (!s.j) return `Stage 0: the whole sequence. Its coefficients fill the discs $|c_k|\\le1$ and the curves are all over $U$: $\\max\\sup_{|z|\\le${v.fix(s.rho, 2)}}|f_n-f_{n_1}| = ${v.fix(s.maxSup, 3)}$.`;
          return `Stage ${s.j}: ${s.n} members left, with $c_0,\\dots,c_{${s.j - 1}}$ in squares of side $${v.fix(s.s, 3)}$. Measured $\\max_k\\sup_{|z|\\le${v.fix(s.rho, 2)}}|f_{n_k}-f_{n_1}| = ${v.fix(s.maxSup, 3)}$, guaranteed $\\le ${v.fix(s.bound, 3)}$ — for an infinite sequence the diagonal process drives both to $0$.`;
        });
      },
    },
    // ------------------------------------------------------------------ the Riemann mapping theorem
    {
      num: '14.7',
      kind: 'Definition',
      name: 'Conformally equivalent regions',
      statement: String.raw`Two regions $\Omega_1,\Omega_2$ in the plane are **conformally equivalent** if there is $\varphi\in H(\Omega_1)$ that is one-to-one in $\Omega_1$ with $\varphi(\Omega_1)=\Omega_2$ — a one-to-one conformal mapping of $\Omega_1$ onto $\Omega_2$. Its inverse is then holomorphic in $\Omega_2$ (10.33), so the relation is symmetric, and composition makes it transitive.`,
      idea: String.raw`A one-to-one holomorphic map has nonvanishing derivative, so it preserves angles everywhere (14.2), and its inverse is holomorphic. Conformal equivalence is much finer than being homeomorphic: $\C$ and the disc $U$ are homeomorphic, but every holomorphic map of $\C$ into $U$ is constant by Liouville's theorem. Simple connectivity is preserved by homeomorphisms, so only simply connected regions can be equivalent to $U$ — the Riemann mapping theorem (14.8) says that apart from $\C$ itself this necessary condition is also sufficient.`,
      caption: String.raw`Pick a region and drag the point $z$. Each holomorphic $\varphi$ shown is one-to-one onto $U$; its grid image consists of curves crossing at right angles, and the readout checks $|\varphi(z)|<1$. The plane $\C$ is only *homeomorphic* to $U$, e.g. by $z\mapsto z/(1+|z|)$ — whose image grid visibly breaks the right angles.`,
      deps: ['rca-14.2', 'rca-10.33'],
      see: ['rca-10.23'],
      tags: ['conformal equivalence', 'Riemann mapping'],
      viz(v) {
        const { Cx } = v.M;
        const one = new Cx(1, 0), I = new Cx(0, 1);
        const range = (a, b, d) => Array.from({ length: Math.round((b - a) / d) + 1 }, (_, i) => a + i * d);
        // a parametrisation of the interval (a, b) that reaches infinite ends (tangent substitution)
        const param = (a, b, u) => (isFinite(a) && isFinite(b) ? a + (b - a) * u : isFinite(a) ? a + Math.tan(Math.PI / 2 * u) : isFinite(b) ? b - Math.tan(Math.PI / 2 * (1 - u)) : Math.tan(Math.PI * (u - 0.5)));
        const REG = {
          half: { label: 'half-plane', view: [[-3, 3], [-0.4, 3.6]], tex: '\\varphi(z)=\\frac{z-i}{z+i}', inside: (z) => z.im > 0, phi: (z) => z.sub(I).div(z.add(I)), vx: range(-6, 6, 0.5), vy: [0, Infinity], hy: range(0.5, 8, 0.5), hx: [-Infinity, Infinity] },
          strip: { label: 'strip $|\\Im z|<\\frac\\pi2$', view: [[-3.2, 3.2], [-2.2, 2.2]], tex: '\\varphi(z)=\\tanh\\frac z2', inside: (z) => Math.abs(z.im) < Math.PI / 2, phi: (z) => { const e = z.exp(); return e.sub(one).div(e.add(one)); }, vx: range(-6, 6, 0.5), vy: [-Math.PI / 2, Math.PI / 2], hy: range(-3 * Math.PI / 8, 3 * Math.PI / 8, Math.PI / 8), hx: [-Infinity, Infinity] },
          quad: { label: 'quadrant', view: [[-0.4, 2.8], [-0.4, 2.8]], tex: '\\varphi(z)=\\frac{z^2-i}{z^2+i}', inside: (z) => z.re > 0 && z.im > 0, phi: (z) => { const q = z.mul(z); return q.sub(I).div(q.add(I)); }, vx: range(0.25, 5, 0.25), vy: [0, Infinity], hy: range(0.25, 5, 0.25), hx: [0, Infinity] },
          plane: { label: 'the plane $\\C$', view: [[-3, 3], [-2.4, 2.4]], tex: 'h(z)=\\frac{z}{1+|z|}\\ \\text{(not holomorphic)}', inside: () => true, phi: (z) => z.scale(1 / (1 + z.abs())), vx: range(-8, 8, 0.5), vy: [-Infinity, Infinity], hy: range(-8, 8, 0.5), hx: [-Infinity, Infinity] },
        };
        const which = v.select('$\\Omega_1=$', Object.entries(REG).map(([value, o]) => ({ value, label: o.label })), 'half');
        const L = v.stage({ x: [-3, 3], y: [-0.4, 3.6], equal: true, height: 320, title: '$\\Omega_1$ with a grid' });
        const R = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, height: 320, axes: false, title: 'the image in $U$' });
        const z = L.handle(0.6, 1.1, { color: 'accent', label: 'z', labelPos: 'ne' });
        let last = null, st = null;
        v.render(() => {
          const key = which.value, G = REG[key];
          if (last !== key) {
            last = key; L.setView(...G.view);
            const p = key === 'half' ? [0.6, 1.1] : key === 'strip' ? [0.8, 0.5] : key === 'quad' ? [1.1, 0.6] : [0.9, 0.6];
            z.x = p[0]; z.y = p[1];
          }
          if (!G.inside(new Cx(z.x, z.y))) { const p = key === 'half' ? [z.x, 0.05] : key === 'strip' ? [z.x, Math.sign(z.y) * 1.5] : [Math.max(z.x, 0.05), Math.max(z.y, 0.05)]; z.x = p[0]; z.y = p[1]; }
          // shade the region
          const [[x0, x1], [y0, y1]] = [L.bounds.x, L.bounds.y];
          if (key === 'half') L.rect(x0, 0, x1, y1, { fill: 'accent', fillAlpha: 0.08, stroke: false });
          if (key === 'strip') L.rect(x0, -Math.PI / 2, x1, Math.PI / 2, { fill: 'accent', fillAlpha: 0.08, stroke: false });
          if (key === 'quad') L.rect(0, 0, x1, y1, { fill: 'accent', fillAlpha: 0.08, stroke: false });
          if (key === 'plane') L.rect(x0, y0, x1, y1, { fill: 'accent', fillAlpha: 0.06, stroke: false });
          R.circle(0, 0, 1, { color: 'ink', width: 1.6, fill: 'accent', fillAlpha: 0.06 });
          // grid lines and their images
          const NS = 400, us = Array.from({ length: NS - 1 }, (_, i) => (i + 1) / NS);
          for (const x of G.vx) {
            const pts = us.map((u) => new Cx(x, param(G.vy[0], G.vy[1], u)));
            L.path(pts.map((p) => [p.re, p.im]), { color: 'purple', width: 1.1, alpha: 0.55 });
            R.path(pts.map((p) => { const w = G.phi(p); return [w.re, w.im]; }), { color: 'purple', width: 1.1, alpha: 0.6 });
          }
          for (const y of G.hy) {
            const pts = us.map((u) => new Cx(param(G.hx[0], G.hx[1], u), y));
            L.path(pts.map((p) => [p.re, p.im]), { color: 'teal', width: 1.1, alpha: 0.55 });
            R.path(pts.map((p) => { const w = G.phi(p); return [w.re, w.im]; }), { color: 'teal', width: 1.1, alpha: 0.6 });
          }
          if (key !== 'plane') L.path(key === 'half' ? [[x0, 0], [x1, 0]] : key === 'quad' ? [[x1, 0], [0, 0], [0, y1]] : [[x0, Math.PI / 2], [x1, Math.PI / 2]], { color: 'ink', width: 2 });
          if (key === 'strip') L.line(x0, -Math.PI / 2, x1, -Math.PI / 2, { color: 'ink', width: 2 });
          const zc = new Cx(z.x, z.y), w = G.phi(zc);
          R.dot(w.re, w.im, { color: 'accent', r: 6, label: key === 'plane' ? 'h(z)' : 'φ(z)', labelPos: 'ne' });
          R.tex(G.tex, R.bounds.x[0] + 0.05, R.bounds.y[1] - 0.05, { color: key === 'plane' ? 'red' : 'ink', size: 13, align: 'left', baseline: 'top' });
          // angle between the images of the two grid directions at z
          const f = G.phi, h = 1e-6;
          const a1 = f(zc.add(new Cx(h, 0))).sub(w).arg(), a2 = f(zc.add(new Cx(0, h))).sub(w).arg();
          st = { key, w, ang: Math.abs(wrapPi(a2 - a1)) };
          v.legend([['purple', 'vertical lines'], ['teal', 'horizontal lines'], ['accent', 'the point $z$ and its image', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const base = `$|${s.key === 'plane' ? 'h' : '\\varphi'}(z)| = ${v.fix(s.w.abs(), 4)} < 1$; the image grid lines cross at ${deg(s.ang)} there.`;
          return s.key === 'plane' ? `${base} $h$ is a homeomorphism of $\\C$ onto $U$, but no holomorphic one exists: a bounded entire function is constant (Liouville).` : `${base} $\\varphi$ is a one-to-one holomorphic map onto $U$, so $\\Omega_1$ is conformally equivalent to $U$.`;
        });
      },
    },
    {
      num: '14.8',
      kind: 'Theorem',
      name: 'Riemann mapping theorem',
      credit: 'Riemann, 1851',
      statement: String.raw`Every simply connected region $\Omega$ in the plane, other than the plane itself, is conformally equivalent to the open unit disc $U$.`,
      idea: String.raw`Fix $z_0\in\Omega$ and let $\Sigma$ be the set of one-to-one $\psi\in H(\Omega)$ with $\psi(\Omega)\subset U$. $\Sigma\ne\emptyset$: if $a\notin\Omega$, a holomorphic square root of $z-a$ exists (13.11) and omits a disc, which a Möbius map pushes into $U$. $\Sigma$ is uniformly bounded, hence normal (14.6), and a limit of one-to-one maps with nonzero derivative is again one-to-one, so some $\psi\in\Sigma$ maximizes $|\psi'(z_0)|$. If $\psi(\Omega)$ omitted a point $\alpha\in U$, then $\psi_1=\varphi_\beta\circ\sqrt{\ }\circ\varphi_\alpha\circ\psi$ with $\beta=\sqrt{-\alpha}$ lies in $\Sigma$ and $|\psi_1'(z_0)|=\frac{1+|\alpha|}{2\sqrt{|\alpha|}}|\psi'(z_0)|>|\psi'(z_0)|$ (the Schwarz lemma in disguise) — impossible. So the extremal $\psi$ is onto $U$.`,
      caption: String.raw`Rudin's improving step, iterated: at each step take the omitted point $\alpha$ of $\psi_k(\Omega)$ nearest to $0$ (red), apply $\varphi_\beta\circ\sqrt{\ }\circ\varphi_\alpha$ and rotate so that $\psi_k'(z_0)>0$. Right: $\psi_k(\Omega)$ with the polar checkerboard of $U$; it fills the disc as $k$ grows. Left: the same checkerboard pulled back to $\Omega$ — its cells become small conformal squares. The red dot on $\partial\Omega$ is the point that gets pushed out next.`,
      deps: ['rca-14.7', 'rca-14.6', 'rca-13.11', 'rca-12.4', 'rca-12.2', 'rca-10.28'],
      see: ['rca-10.43'],
      tags: ['Riemann mapping', 'conformal', 'extremal problem'],
      viz(v) {
        const SHAPES = {
          L: { label: 'L-shape', poly: [[-1, -1], [1, -1], [1, 0], [0, 0], [0, 1], [-1, 1]], z0: [-0.5, -0.5] },
          cross: { label: 'cross', poly: [[-0.35, -1.1], [0.35, -1.1], [0.35, -0.35], [1.1, -0.35], [1.1, 0.35], [0.35, 0.35], [0.35, 1.1], [-0.35, 1.1], [-0.35, 0.35], [-1.1, 0.35], [-1.1, -0.35], [-0.35, -0.35]], z0: [0, 0] },
          star: { label: 'star', poly: Array.from({ length: 10 }, (_, i) => { const r = i % 2 ? 0.48 : 1.15, a = Math.PI / 2 + Math.PI * i / 5; return [r * Math.cos(a), r * Math.sin(a) - 0.05]; }), z0: [0, -0.05] },
          tri: { label: 'triangle', poly: [[-1.15, -0.8], [1.15, -0.8], [0, 1.2]], z0: [0, -0.13] },
        };
        const NR = 480, J = 30, KMAX = 80, NP = NR * (J + 1);
        const tj = (j) => 1 - (1 - j / J) ** 2; // radial levels cluster near the boundary
        const cache = {};
        function build(key) {
          if (cache[key]) return cache[key];
          const S = SHAPES[key], c = S.z0;
          const Rr = Float64Array.from({ length: NR }, (_, i) => rayHit(S.poly, c, TAU * i / NR));
          const rho0 = 1.02 * Math.max(...Rr);
          let re = new Float64Array(NP), im = new Float64Array(NP);
          for (let i = 0; i < NR; i++) for (let j = 0; j <= J; j++) { const t = TAU * i / NR, r = Rr[i] * tj(j); re[i * (J + 1) + j] = r * Math.cos(t) / rho0; im[i * (J + 1) + j] = r * Math.sin(t) / rho0; }
          const steps = [{ re: Float32Array.from(re), im: Float32Array.from(im), d: 1 / rho0 }];
          return (cache[key] = { S, Rr, steps, re, im });
        }
        // one improving step ψ ↦ φ_β ∘ √ ∘ φ_α ∘ ψ, then rotate so that ψ'(z0) > 0
        function step(B) {
          const { re, im } = B;
          let bi = 0, bd = Infinity;
          for (let i = 0; i < NR; i++) { const p = i * (J + 1) + J, d = Math.hypot(re[p], im[p]); if (d < bd) { bd = d; bi = i; } }
          const p = bi * (J + 1) + J, ar = re[p], ai = im[p], a = bd;
          const sm = Math.sqrt(a), ang = Math.atan2(-ai, -ar) / 2, br = sm * Math.cos(ang), bim = sm * Math.sin(ang);
          const cr = Math.cos(ang), ci = Math.sin(ang); // multiply by e^{i arg β} to undo the rotation −arg β
          for (let i = 0; i < NR; i++) {
            let prevArg = Math.atan2(-ai, -ar);
            for (let j = 0; j <= J; j++) {
              const q = i * (J + 1) + j, x = re[q], y = im[q];
              const nr = x - ar, ni = y - ai, dr = 1 - (ar * x + ai * y), di = -(ar * y - ai * x), dd = dr * dr + di * di;
              const ur = (nr * dr + ni * di) / dd, ui = (ni * dr - nr * di) / dd;
              const mod = Math.hypot(ur, ui); let arg = Math.atan2(ui, ur);
              if (j === 0) arg = prevArg; else { let d = arg - prevArg; d -= TAU * Math.round(d / TAU); arg = prevArg + d; }
              prevArg = arg;
              const sq = Math.sqrt(mod), sr = sq * Math.cos(arg / 2), si = sq * Math.sin(arg / 2);
              const n2r = sr - br, n2i = si - bim, d2r = 1 - (br * sr + bim * si), d2i = -(br * si - bim * sr), d2 = d2r * d2r + d2i * d2i;
              const wr = (n2r * d2r + n2i * d2i) / d2, wi = (n2i * d2r - n2r * d2i) / d2;
              re[q] = wr * cr - wi * ci; im[q] = wr * ci + wi * cr;
            }
          }
          return { alpha: [ar, ai], ai: bi, fac: (1 + a) / (2 * Math.sqrt(a)) };
        }
        function upto(B, k) {
          while (B.steps.length <= k) {
            const info = step(B), last = B.steps[B.steps.length - 1];
            last.alpha = info.alpha; last.ai = info.ai; last.fac = info.fac;
            B.steps.push({ re: Float32Array.from(B.re), im: Float32Array.from(B.im), d: last.d * info.fac });
          }
          const s = B.steps[k];
          if (!s.alpha) { // the next α, without stepping
            let bi = 0, bd = Infinity;
            for (let i = 0; i < NR; i++) { const p = i * (J + 1) + J, d = Math.hypot(s.re[p], s.im[p]); if (d < bd) { bd = d; bi = i; } }
            s.alpha = [s.re[bi * (J + 1) + J], s.im[bi * (J + 1) + J]]; s.ai = bi; s.fac = (1 + bd) / (2 * Math.sqrt(bd));
          }
          return s;
        }
        const which = v.select('$\\Omega$', Object.entries(SHAPES).map(([value, o]) => ({ value, label: o.label })), 'L');
        const kS = v.slider('step $k$', 0, KMAX, 14, { int: true });
        const Lt = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, height: 330, axes: false, title: '$\\Omega$, coloured by the cell of $\\psi_k(z)$' });
        const Rt = v.stage({ x: [-1.12, 1.12], y: [-1.12, 1.12], equal: true, height: 330, axes: false, title: '$\\psi_k(\\Omega)\\subset U$ and the next omitted point $\\alpha$' });
        let st = null;
        v.render(() => {
          const key = which.value, B = build(key), k = kS.value, s = upto(B, k), S = B.S, c = S.z0;
          const bgc = v.rgb('panel');
          // ---- left: pull-back of the polar checkerboard (bilinear interpolation on the polar mesh)
          Lt.raster((x, y) => {
            const dx = x - c[0], dy = y - c[1], r = Math.hypot(dx, dy);
            let t = Math.atan2(dy, dx); if (t < 0) t += TAU;
            const fi = t / TAU * NR, i0 = Math.floor(fi) % NR, i1 = (i0 + 1) % NR, u = fi - Math.floor(fi);
            const Rb = B.Rr[i0] * (1 - u) + B.Rr[i1] * u;
            if (r >= Rb) return null;
            const fj = J * (1 - Math.sqrt(Math.max(0, 1 - r / Rb))), j0 = Math.min(J - 1, Math.floor(fj)), w = fj - j0;
            const P = (i, j) => i * (J + 1) + j;
            const wr = (s.re[P(i0, j0)] * (1 - u) + s.re[P(i1, j0)] * u) * (1 - w) + (s.re[P(i0, j0 + 1)] * (1 - u) + s.re[P(i1, j0 + 1)] * u) * w;
            const wi = (s.im[P(i0, j0)] * (1 - u) + s.im[P(i1, j0)] * u) * (1 - w) + (s.im[P(i0, j0 + 1)] * (1 - u) + s.im[P(i1, j0 + 1)] * u) * w;
            return polarCheck(v.M, wr, wi);
          }, { key: `${key}|${k}`, id: 'pull', res: 2 });
          Lt.poly(S.poly, { color: 'ink', width: 2 });
          Lt.dot(c[0], c[1], { color: 'ink', r: 4.5, label: 'z₀', labelPos: 'sw' });
          const ta = TAU * s.ai / NR, Ra = B.Rr[s.ai];
          Lt.dot(c[0] + Ra * Math.cos(ta), c[1] + Ra * Math.sin(ta), { color: 'red', r: 6 });
          // ---- right: ψ_k(Ω) with the polar checkerboard of U
          const bx = new Float64Array(NR), by = new Float64Array(NR);
          for (let i = 0; i < NR; i++) { bx[i] = s.re[i * (J + 1) + J]; by[i] = s.im[i * (J + 1) + J]; }
          Rt.raster((x, y) => {
            if (x * x + y * y >= 1) return null;
            let inside = false;
            for (let i = 0, q = NR - 1; i < NR; q = i++) if ((by[i] > y) !== (by[q] > y) && x < (bx[q] - bx[i]) * (y - by[i]) / (by[q] - by[i]) + bx[i]) inside = !inside;
            if (!inside) return [bgc[0], bgc[1], bgc[2]];
            return polarCheck(v.M, x, y);
          }, { key: `${key}|${k}`, id: 'img', res: 2 });
          Rt.circle(0, 0, 1, { color: 'ink', width: 1.4, dash: [5, 4] });
          const bpts = Array.from({ length: NR + 1 }, (_, i) => [bx[i % NR], by[i % NR]]);
          Rt.path(bpts, { color: 'ink', width: 2 });
          const rk = Math.hypot(s.alpha[0], s.alpha[1]);
          Rt.circle(0, 0, rk, { color: 'green', width: 2, dash: [6, 4] });
          Rt.dot(0, 0, { color: 'ink', r: 4, label: '0', labelPos: 'sw' });
          Rt.dot(s.alpha[0], s.alpha[1], { color: 'red', r: 6, label: 'α', labelPos: s.alpha[0] > 0 ? 'e' : 'w' });
          st = { k, rk, d: s.d, fac: s.fac };
          v.legend([['ink', '$\\partial\\Omega$ and $\\psi_k(\\partial\\Omega)$'], ['green', 'largest disc $|w|<r_k$ inside $\\psi_k(\\Omega)$', { dash: true }], ['red', 'omitted point $\\alpha$ nearest $0$, and its preimage', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$k=${s.k}$: $\\;r_k=\\operatorname{dist}(0,\\partial\\psi_k(\\Omega)) = ${v.fix(s.rk, 4)}$, $\\;\\psi_k'(z_0) = ${v.fix(s.d, 4)}$. The next step multiplies $\\psi'(z_0)$ by $\\frac{1+|\\alpha|}{2\\sqrt{|\\alpha|}} = ${v.fix(s.fac, 4)} > 1$; it stays bounded by the derivative of the Riemann map, so the omitted points are forced out to $|w|=1$.`;
        });
      },
    },
  ],
};
