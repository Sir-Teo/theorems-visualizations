// History of Technology — Chapter 1 shared helpers (imported by ch01.js and ch01-b.js)

/** "2.6 Ma", "64 ka", "9,000 yr" from a number of years ago. */
export function fmtAgo(y) {
  if (y >= 1e6) return `${+(y / 1e6).toFixed(y >= 1e7 ? 0 : 2)} Ma`.replace(/\.?0+ Ma$/, ' Ma');
  if (y >= 1e4) return `${+(y / 1e3).toFixed(y >= 1e5 ? 0 : 1)} ka`.replace(/\.0 ka$/, ' ka');
  if (y >= 1e3) return `${Math.round(y / 100) / 10} ka`;
  return `${Math.round(y)} yr`;
}

/**
 * A strip of dated evidence on a logarithmic "years ago" axis (old on the left), drawn on a stage created with
 * evidenceStage(). finds: [{ ago: n | [lo, hi], label, contested?, color? }]. Contested finds are drawn hollow with a
 * dashed span and the word "contested". Labels are placed in lanes above the axis so they never overlap.
 */
export function evidenceStage(v, [oldest, youngest], o = {}) {
  const s = v.stage({ x: [-Math.log10(oldest), -Math.log10(youngest)], y: [0, 1], axes: false, height: o.height ?? 118, title: o.title ?? 'dated evidence (years ago, log scale)', full: o.full ?? false, weight: o.weight ?? 1, minWidth: o.minWidth ?? 260 });
  s._range = [oldest, youngest];
  return s;
}
export function drawEvidence(v, s, finds, o = {}) {
  const [oldest, youngest] = s._range, X = (a) => -Math.log10(a), yAxis = o.axisY ?? 0.2;
  const ctx = s.ctx;
  // axis with decade ticks
  s.line(X(oldest), yAxis, X(youngest), yAxis, { color: 'muted', width: 1.2 });
  const major = o.ticks || [];
  if (!o.ticks) for (let e = Math.ceil(Math.log10(youngest)); e <= Math.floor(Math.log10(oldest)); e++) major.push(10 ** e);
  for (const a of major) {
    const x = X(a);
    s.line(x, yAxis - 0.04, x, yAxis + 0.04, { color: 'muted', width: 1 });
    s.text(fmtAgo(a).replace(' yr', ' yr ago'), x, yAxis - 0.07, { size: 10.5, color: 'muted', baseline: 'top', align: 'center' });
  }
  if (!o.ticks) for (let e = Math.floor(Math.log10(youngest)); e <= Math.floor(Math.log10(oldest)); e++) for (let k = 2; k < 10; k++) {
    const am = k * 10 ** e; if (am < oldest && am > youngest) s.line(X(am), yAxis - 0.018, X(am), yAxis + 0.018, { color: 'faint', width: 1 });
  }
  // labels in lanes
  ctx.save(); ctx.font = '500 11px Inter, system-ui, sans-serif';
  const placed = []; const laneH = o.laneH ?? 0.2, lanes = o.lanes ?? 3;
  const items = finds.map((f) => {
    const lo = Array.isArray(f.ago) ? f.ago[0] : f.ago, hi = Array.isArray(f.ago) ? f.ago[1] : f.ago;
    const mid = Math.sqrt(lo * hi), txt = f.label + (f.contested ? ' (contested)' : '');
    return { f, lo, hi, mid, txt, w: ctx.measureText(txt).width + 8 };
  }).sort((a, b) => b.mid - a.mid);
  for (const it of items) {
    const px = s.X(X(it.mid)); let x0 = px - it.w / 2; const x1min = s.X(X(oldest)) + 2, x1max = s.X(X(youngest)) - 2;
    if (x0 < x1min) x0 = x1min; if (x0 + it.w > x1max) x0 = x1max - it.w;
    let lane = 0;
    while (lane < lanes && placed.some((p) => p.lane === lane && !(x0 + it.w < p.x0 || x0 > p.x1))) lane++;
    if (lane >= lanes) lane = lanes - 1;
    placed.push({ lane, x0, x1: x0 + it.w }); it.lane = lane; it.x0 = x0;
  }
  ctx.restore();
  for (const it of items) {
    const c = it.f.color || (it.f.contested ? 'red' : 'accent'), y = yAxis;
    if (it.hi !== it.lo) s.line(X(it.lo), y, X(it.hi), y, { color: c, width: 5, alpha: 0.55, dash: it.f.contested ? [4, 3] : null });
    const ly = yAxis + 0.2 + it.lane * laneH;
    s.line(X(it.mid), y, X(it.mid), ly - 0.05, { color: c, width: 1, alpha: 0.6 });
    s.dot(X(it.mid), y, { r: 4, color: c, hollow: !!it.f.contested });
    s.text(it.txt, s.inv(it.x0 + it.w / 2, 0)[0], ly, { size: 11, color: it.f.contested ? 'red' : 'ink', baseline: 'middle', align: 'center' });
  }
}

/** Point in polygon (even-odd). */
export function inPoly(x, y, P) {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [xi, yi] = P[i], [xj, yj] = P[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
