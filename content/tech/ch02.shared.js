// History of Technology — Chapter 2 shared helpers (imported by ch02.js and ch02-b.js)

/** "3000 BCE", "1 CE", "1586" from a signed year (negative = BCE; there is no year 0, but the axis treats it as continuous). */
export function fmtYear(y, { ce = false } = {}) {
  const r = Math.round(y);
  if (r < 0) return `${Math.abs(r).toLocaleString('en-US')} BCE`;
  if (r === 0) return '1 CE';
  return ce || r < 1000 ? `${r} CE` : `${r}`;
}

/**
 * A strip of dated evidence on a linear year axis (negative = BCE), drawn on a stage made by yearStage().
 * finds: [{ t: year | [from, to], label, contested?, color? }]. Contested finds are hollow, with a dashed span and
 * "(contested)" in red; labels go in lanes above the axis so they never overlap.
 */
export function yearStage(v, [from, to], o = {}) {
  const s = v.stage({ x: [from, to], y: [0, 1], axes: false, height: o.height ?? 130, title: o.title ?? 'dated evidence', full: o.full ?? false, weight: o.weight ?? 1, minWidth: o.minWidth ?? 300 });
  s._yr = [from, to];
  return s;
}
export function drawYears(v, s, finds, o = {}) {
  const [from, to] = s._yr, yAxis = o.axisY ?? 0.2, ctx = s.ctx;
  s.line(from, yAxis, to, yAxis, { color: 'muted', width: 1.2 });
  let ticks = o.ticks;
  if (!ticks) {
    const span = to - from, steps = [50, 100, 250, 500, 1000, 2000];
    const pxw = s.X(to) - s.X(from), want = Math.max(3, Math.floor(pxw / 90));
    const st = steps.find((k) => span / k <= want) || 2000;
    ticks = []; for (let t = Math.ceil(from / st) * st; t <= to; t += st) ticks.push(t);
  }
  for (const t of ticks) {
    s.line(t, yAxis - 0.04, t, yAxis + 0.04, { color: 'muted', width: 1 });
    s.text(fmtYear(t), t, yAxis - 0.07, { size: 10.5, color: 'muted', baseline: 'top', align: 'center' });
  }
  ctx.save(); ctx.font = '500 11px Inter, system-ui, sans-serif';
  const lanes = o.lanes ?? 4, laneH = o.laneH ?? 0.74 / lanes, placed = [];
  const x1min = s.X(from) + 2, x1max = s.X(to) - 2;
  const items = finds.map((f) => {
    const lo = Array.isArray(f.t) ? f.t[0] : f.t, hi = Array.isArray(f.t) ? f.t[1] : f.t;
    const txt = f.label + (f.contested ? ' (contested)' : '');
    return { f, lo, hi, mid: (lo + hi) / 2, txt, w: ctx.measureText(txt).width + 8 };
  }).sort((a, b) => a.mid - b.mid);
  for (const it of items) {
    let x0 = s.X(it.mid) - it.w / 2;
    if (x0 < x1min) x0 = x1min; if (x0 + it.w > x1max) x0 = x1max - it.w;
    let lane = 0;
    while (lane < lanes && placed.some((p) => p.lane === lane && !(x0 + it.w < p.x0 || x0 > p.x1))) lane++;
    if (lane >= lanes) {
      let best = Infinity;
      for (let L = 0; L < lanes; L++) { const x = Math.max(x0, ...placed.filter((p) => p.lane === L && p.x1 > x0 - it.w).map((p) => p.x1 + 6)); if (x - x0 < best) { best = x - x0; lane = L; } }
      x0 = Math.min(x0 + best, x1max - it.w);
    }
    placed.push({ lane, x0, x1: x0 + it.w }); it.lane = lane; it.x0 = x0;
  }
  ctx.restore();
  const col = (it) => it.f.color || (it.f.contested ? 'red' : 'accent');
  for (const it of items) {
    if (it.hi !== it.lo) s.line(it.lo, yAxis, it.hi, yAxis, { color: col(it), width: 5, alpha: 0.55, dash: it.f.contested ? [4, 3] : null });
    s.line(it.mid, yAxis, it.mid, yAxis + 0.15 + it.lane * laneH, { color: col(it), width: 1, alpha: 0.6 });
  }
  for (const it of items) s.dot(it.mid, yAxis, { r: 4, color: col(it), hollow: !!it.f.contested });
  for (const it of items) s.text(it.txt, s.inv(it.x0 + it.w / 2, 0)[0], yAxis + 0.2 + it.lane * laneH, { size: 11, color: it.f.contested ? 'red' : 'ink', baseline: 'middle', align: 'center' });
  if (o.cursor != null) { s.line(o.cursor, 0.02, o.cursor, 0.98, { color: 'orange', width: 1.5, dash: [4, 3] }); }
}

/**
 * A spur gear drawn in data units: centre (cx, cy), N teeth, module m (pitch radius = mN/2), rotation angle a (rad).
 * Teeth are trapezoids (addendum m, dedendum 1.25m). st: {color, fill, fillAlpha, width, label, spokes}.
 */
export function gear(s, cx, cy, N, m, a, st = {}) {
  const rp = (m * N) / 2, ra = rp + m, rd = rp - 1.25 * m, pts = [];
  for (let k = 0; k < N; k++) {
    const t0 = a + (2 * Math.PI * k) / N, dt = (2 * Math.PI) / N;
    const seq = [[rd, -0.27], [ra, -0.15], [ra, 0.15], [rd, 0.27]];
    for (const [r, f] of seq) pts.push([cx + r * Math.cos(t0 + f * dt), cy + r * Math.sin(t0 + f * dt)]);
  }
  s.poly(pts, { fill: st.fill ?? st.color ?? 'gold', fillAlpha: st.fillAlpha ?? 0.28, color: st.color ?? 'gold', width: st.width ?? 1.2 });
  const spokes = st.spokes ?? (N > 30 ? 4 : 0);
  for (let k = 0; k < spokes; k++) { const t = a + (2 * Math.PI * k) / spokes + Math.PI / 4; s.line(cx, cy, cx + 0.8 * rd * Math.cos(t), cy + 0.8 * rd * Math.sin(t), { color: st.color ?? 'gold', width: 1, alpha: 0.6 }); }
  if (spokes) s.circle(cx, cy, 0.8 * rd, { color: st.color ?? 'gold', width: 1, alpha: 0.5 });
  s.circle(cx, cy, Math.max(m * 0.9, rp * 0.08), { fill: 'panel', fillAlpha: 1, color: st.color ?? 'gold', width: 1.2 });
  // a reference mark so the rotation is visible
  s.line(cx + 0.25 * rd * Math.cos(a), cy + 0.25 * rd * Math.sin(a), cx + 0.92 * rd * Math.cos(a), cy + 0.92 * rd * Math.sin(a), { color: st.mark ?? 'ink', width: 2 });
}

/** Rotation of a gear (N2 teeth, centre c2) meshing with gear 1 (N1 teeth, centre c1, angle a1), so that teeth interlock. */
export function meshAngle(c1, N1, a1, c2, N2) {
  const psi = Math.atan2(c2[1] - c1[1], c2[0] - c1[0]);
  return psi + Math.PI - Math.PI / N2 + ((psi - a1) * N1) / N2;
}

/** Weight block with a label (data units, bottom-centre at (x, y)). */
export function block(s, x, y, w, h, label, st = {}) {
  s.rect(x - w / 2, y, x + w / 2, y + h, { fill: st.color ?? 'muted', fillAlpha: st.fillAlpha ?? 0.45, color: st.color ?? 'muted', width: 1.4, radius: st.radius ?? 2 });
  if (label) s.text(label, x, y + h / 2, { size: st.size ?? 11.5, color: st.textColor ?? 'ink', align: 'center', baseline: 'middle', weight: 600 });
}

/** Ground hatching along y = y0 from x0 to x1. */
export function ground(s, x0, x1, y0, st = {}) {
  s.line(x0, y0, x1, y0, { color: st.color ?? 'muted', width: 1.6 });
  const n = Math.max(4, Math.round((s.X(x1) - s.X(x0)) / 12)), dy = s.inv(0, 0)[1] - s.inv(0, 7)[1];
  for (let i = 0; i < n; i++) { const x = x0 + ((i + 0.5) * (x1 - x0)) / n; s.line(x, y0, x - (x1 - x0) / n * 0.6, y0 - Math.abs(dy), { color: st.color ?? 'muted', width: 1, alpha: 0.6 }); }
}
