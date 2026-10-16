// History of Technology — Chapter 3 shared helpers (imported by ch03.js and ch03-b.js)

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
 * "(contested)" in red; labels go in lanes above the axis so they never overlap. (Same house style as chapter 2.)
 */
export function yearStage(v, [from, to], o = {}) {
  const s = v.stage({ x: [from, to], y: [0, 1], axes: false, height: o.height ?? 150, title: o.title ?? 'dated evidence', full: o.full ?? false, weight: o.weight ?? 1, minWidth: o.minWidth ?? 300 });
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
  const lanes = o.lanes ?? 4, laneH = o.laneH ?? Math.min(0.2, 0.55 / Math.max(1, lanes - 1)), placed = [];
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
  if (o.cursor != null) s.line(o.cursor, 0.02, o.cursor, 0.98, { color: 'orange', width: 1.5, dash: [4, 3] });
}

// ---------------------------------------------------------------- smelting thermodynamics (Ellingham approximation)
// Standard Gibbs energies per mole of O2, ΔG° = ΔH° − TΔS° in kJ with T in kelvin, from 298 K enthalpies of formation
// and entropies (NIST-JANAF / CRC values; ΔH and ΔS treated as constant, which is good to a few kJ over 900–1600 K).
export const OXIDES = {
  Cu2O: { H: -337.2, S: -0.1516, label: 'Cu₂O → Cu', metal: 'copper' },   // 4Cu + O2 → 2Cu2O
  SnO2: { H: -577.6, S: -0.2073, label: 'SnO₂ → Sn', metal: 'tin' },      // Sn + O2 → SnO2
  FeO: { H: -544.0, S: -0.1382, label: 'FeO → Fe', metal: 'iron' },       // 2Fe + O2 → 2FeO (wüstite taken as FeO)
};
const CO2_FROM_CO = { H: -566.0, S: -0.1729 }; // 2CO + O2 → 2CO2
const RG = 8.314e-3; // kJ/(mol K)
/** CO/CO2 ratio above which the oxide is reduced by CO at temperature T (K):  MO + CO → M + CO2. */
export function reduceRatio(ox, T) {
  const o = OXIDES[ox], dG = ((CO2_FROM_CO.H - CO2_FROM_CO.S * T) - (o.H - o.S * T)) / 2; // kJ per mol CO
  return Math.exp(dG / (RG * T));
}
/** CO/CO2 ratio in equilibrium with solid carbon (Boudouard: C + CO2 ⇌ 2CO), total P = pCO + pCO2 (atm). */
export function boudouardRatio(T, P = 0.34) {
  const K = Math.exp(-(172.5 - 0.1758 * T) / (RG * T));
  const x = (-K + Math.sqrt(K * K + 4 * K * P)) / 2; // pCO
  return x / Math.max(1e-12, P - x);
}
/** Furnace gas: a charcoal-to-ore "reducing strength" f ∈ [0, 1] moves the gas from a lean, air-rich fire (CO/CO2 = 0.02) toward Boudouard equilibrium. */
export function furnaceRatio(T, f) {
  return Math.exp((1 - f) * Math.log(0.02) + f * Math.log(boudouardRatio(T)));
}

/** Seeded irregular lump (polygon) around (cx, cy) of mean radius r in data units. */
export function lump(cx, cy, r, seed, n = 9, rough = 0.28) {
  const pts = []; let s = seed * 9301 + 49297;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const ph = rnd() * 6.28;
  for (let k = 0; k < n; k++) { const a = ph + (2 * Math.PI * k) / n, rr = r * (1 - rough / 2 + rough * rnd()); pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
  return pts;
}
