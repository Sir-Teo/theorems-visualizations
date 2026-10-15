// Geology & Geophysics — Chapter 1: helpers shared by ch01.js and ch01-b.js
//
// (1) A cross-section engine: a geological history is a list of events (deposit, tilt, erode, dike, fault, uplift,
//     fold). The rock at a present-day point is found by running the history backwards (inverse mapping), which also
//     returns the point's coordinates at the moment its rock formed, so bedding patterns tilt and fault with the rock.
// (2) Lithology colours and map patterns (sandstone dots, shale dashes, limestone bricks, granite crosses, …).
// (3) Small fossil glyphs drawn in pixels (trilobite, ammonite, brachiopod, …).
// (4) Formatting of durations from years to gigayears.

export const TAU = 2 * Math.PI;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// ── lithologies ─────────────────────────────────────────────────────────────
/** Rock types: display name, palette colour, map pattern. */
export const LITH = {
  sand: { name: 'sandstone', color: 'gold', pat: 'dots' },
  shale: { name: 'shale', color: 'gray', pat: 'dash' },
  lime: { name: 'limestone', color: 'blue', pat: 'brick' },
  cong: { name: 'conglomerate', color: 'orange', pat: 'pebble' },
  red: { name: 'red sandstone', color: 'red', pat: 'dots' },
  grey: { name: 'greywacke', color: 'teal', pat: 'dash' },
  granite: { name: 'granite', color: 'pink', pat: 'cross' },
  gneiss: { name: 'gneiss', color: 'purple', pat: 'wavy' },
  basalt: { name: 'basalt', color: 'green', pat: 'vee' },
  schist: { name: 'schist', color: 'purple', pat: 'wavy' },
};

/** [r, g, b] of palette colour a mixed toward b by t (0 = a). Resolved per theme. */
export function rgbMix(v, a, b, t) {
  const p = v.rgb(a), q = v.rgb(b);
  return [0, 1, 2].map((i) => Math.round(p[i] + (q[i] - p[i]) * t));
}

/**
 * Pattern intensity (0…1) of a map symbol at pattern coordinates (u, w) given in pixels of the rock's own frame
 * (so the pattern follows the bedding through tilts and faults).
 */
export function patternAt(pat, u, w) {
  const fr = (x) => x - Math.floor(x);
  switch (pat) {
    case 'dots': { const g = 9, row = Math.floor(w / g), cu = fr(u / g + (row % 2) * 0.5) - 0.5, cw = fr(w / g) - 0.5; return cu * cu + cw * cw < 0.035 ? 1 : 0; }
    case 'dash': { const g = 8, row = Math.floor(w / g), cw = fr(w / g), cu = fr(u / 18 + (row % 2) * 0.5); return cw < 0.16 && cu < 0.55 ? 1 : 0; }
    case 'brick': { const h = 9, row = Math.floor(w / h), cw = fr(w / h), cu = fr(u / 20 + (row % 2) * 0.5); return cw < 0.12 || cu < 0.06 ? 1 : 0; }
    case 'pebble': { const g = 13, row = Math.floor(w / g), cu = fr(u / g + (row % 2) * 0.5) - 0.5, cw = fr(w / g) - 0.5, r = Math.sqrt(cu * cu * 0.8 + cw * cw); return r > 0.22 && r < 0.33 ? 1 : 0; }
    case 'cross': { const g = 12, row = Math.floor(w / g), cu = fr(u / g + (row % 2) * 0.5) - 0.5, cw = fr(w / g) - 0.5; return (Math.abs(cu) < 0.06 && Math.abs(cw) < 0.26) || (Math.abs(cw) < 0.06 && Math.abs(cu) < 0.26) ? 1 : 0; }
    case 'wavy': { const g = 7, y = w / g + 0.28 * Math.sin(u / 7); return fr(y) < 0.2 ? 1 : 0; }
    case 'vee': { const g = 12, row = Math.floor(w / g), cu = fr(u / g + (row % 2) * 0.5) - 0.5, cw = fr(w / g) - 0.5; return Math.abs(Math.abs(cu) * 1.4 - (cw + 0.22)) < 0.07 && cw > -0.25 && cw < 0.2 ? 1 : 0; }
    default: return 0;
  }
}

/**
 * Fill a polygon (data coordinates) with a lithology's colour and pattern, the pattern rotated by `angle` (radians,
 * the bedding dip) — used where the geometry is drawn as polygons rather than rasters.
 */
export function lithPoly(v, s, pts, lith, o = {}) {
  const L = LITH[lith] || LITH.sand, c = s.ctx;
  s.poly(pts, { fill: L.color, fillAlpha: o.fillAlpha ?? 0.42, stroke: false });
  c.save(); c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(s.X(p[0]), s.Y(p[1])) : c.moveTo(s.X(p[0]), s.Y(p[1])))); c.closePath(); c.clip();
  const xs = pts.map((p) => s.X(p[0])), ys = pts.map((p) => s.Y(p[1]));
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + 12, a = -(o.angle || 0);
  c.translate(cx, cy); c.rotate(a);
  c.fillStyle = v.color(o.ink || L.color, o.inkAlpha ?? 0.9); c.strokeStyle = c.fillStyle; c.lineWidth = 1.1;
  const ox = o.ox || 0, oy = o.oy || 0; // pattern phase
  if (L.pat === 'dots') for (let y = -R; y < R; y += 9) for (let x = -R + ((Math.round((y + oy) / 9) % 2) * 4.5); x < R; x += 9) { c.beginPath(); c.arc(x + (ox % 9), y + (oy % 9), 1.15, 0, TAU); c.fill(); }
  else if (L.pat === 'dash') { c.beginPath(); for (let y = -R; y < R; y += 8) for (let x = -R + ((Math.round(y / 8) % 2) * 9); x < R; x += 18) { c.moveTo(x, y + (oy % 8)); c.lineTo(x + 9, y + (oy % 8)); } c.stroke(); }
  else if (L.pat === 'brick') { c.beginPath(); for (let y = -R; y < R; y += 9) { c.moveTo(-R, y); c.lineTo(R, y); for (let x = -R + ((Math.round(y / 9) % 2) * 10); x < R; x += 20) { c.moveTo(x, y); c.lineTo(x, y + 9); } } c.stroke(); }
  else if (L.pat === 'pebble') for (let y = -R; y < R; y += 13) for (let x = -R + ((Math.round(y / 13) % 2) * 6.5); x < R; x += 13) { c.beginPath(); c.ellipse(x, y, 3.6, 2.6, 0.3, 0, TAU); c.stroke(); }
  else if (L.pat === 'cross') { c.beginPath(); for (let y = -R; y < R; y += 12) for (let x = -R + ((Math.round(y / 12) % 2) * 6); x < R; x += 12) { c.moveTo(x - 3, y); c.lineTo(x + 3, y); c.moveTo(x, y - 3); c.lineTo(x, y + 3); } c.stroke(); }
  else if (L.pat === 'wavy') { c.beginPath(); for (let y = -R; y < R; y += 7) { for (let x = -R; x <= R; x += 3) { const yy = y + 2 * Math.sin(x / 7); x === -R ? c.moveTo(x, yy) : c.lineTo(x, yy); } } c.stroke(); }
  else if (L.pat === 'vee') { c.beginPath(); for (let y = -R; y < R; y += 12) for (let x = -R + ((Math.round(y / 12) % 2) * 6); x < R; x += 12) { c.moveTo(x - 3, y - 2); c.lineTo(x, y + 2); c.lineTo(x + 3, y - 2); } c.stroke(); }
  c.restore();
  if (o.outline !== false) s.poly(pts, { color: o.outline || L.color, width: o.width ?? 1, alpha: 0.85 });
}

// ── cross-section engine ────────────────────────────────────────────────────
// Events (all lengths in data units of the section, z up):
//   {type: 'base', lith, top}                     basement below z = top (the start of the history)
//   {type: 'dep', lith, top, from}                sediment fills every empty point below z = top (rising from `from` while p < 1)
//   {type: 'erode', level, amp, wl, ph, from}     removes rock above z = level + amp·sin(2πx/wl + ph) (lowering from `from`)
//   {type: 'tilt', ang, cx, cz}                   rotates everything by ang (radians, counter-clockwise) about (cx, cz)
//   {type: 'dike', lith, x0, w, ang}              a slab of width w through (x0, 0), leaning by ang from vertical, intrudes rock
//   {type: 'fault', x0, dip, slip}                plane through (x0, 0) dipping toward +x; the hanging wall slides `slip` down-dip
//   {type: 'uplift', dz}                          moves everything up by dz
//   {type: 'fold', amp, wl, ph}                   vertical shear z → z + amp·sin(2πx/wl + ph)
//   {type: 'pluton', lith, cx, cz, rx, rz}        an elliptical intrusion that replaces rock
// Each event may carry `p` ∈ [0, 1], the fraction completed (for animations).

/** Erosion surface height at x. */
export const erodeZ = (e, x) => e.level + (e.amp || 0) * Math.sin((TAU * x) / (e.wl || 4) + (e.ph || 0));

/**
 * Rock at present point (x, z) after events[0..k] → {k, x, z, side} (k = the event whose rock it is, (x, z) = where
 * the point was when that rock formed, side = bitmask of the faults' hanging walls it lies on) or null (air / water).
 */
export function classify(E, x, z, k = E.length - 1, side = 0) {
  for (let i = k; i >= 0; i--) {
    const e = E[i], p = e.p ?? 1;
    switch (e.type) {
      case 'base': return z <= e.top ? { k: i, x, z, side } : null;
      case 'dep': {
        const o = classify(E, x, z, i - 1, side); if (o) return o;
        const top = p < 1 ? (e.from ?? e.top) + (e.top - (e.from ?? e.top)) * p : e.top; // during an animation the fill rises from `from`
        return z <= top ? { k: i, x, z, side } : null;
      }
      case 'erode': { const lv = p < 1 ? (e.from ?? e.level) + (e.level - (e.from ?? e.level)) * p : e.level; if (z > lv + (e.amp || 0) * p * Math.sin((TAU * x) / (e.wl || 4) + (e.ph || 0))) return null; break; }
      case 'tilt': { const a = -e.ang * p, c = Math.cos(a), s = Math.sin(a), dx = x - e.cx, dz = z - e.cz; x = e.cx + c * dx - s * dz; z = e.cz + s * dx + c * dz; break; }
      case 'uplift': z -= e.dz * p; break;
      case 'fold': z -= (e.amp * p) * Math.sin((TAU * x) / e.wl + (e.ph || 0)); break;
      case 'fault': {
        const t = 1 / Math.tan(e.dip); // horizontal run per unit depth
        // hanging wall: right of the plane x = x0 − z·cot(dip) (plane dips toward +x going down)
        if (x > e.x0 - z * t) { const sl = e.slip * p; x -= sl * Math.cos(e.dip); z += sl * Math.sin(e.dip); side |= 1 << (e.id ?? i % 30); }
        break;
      }
      case 'dike': {
        if (p < 1) { const zTop = e.zTop ?? 10; if (z > (e.zBot ?? 0) + (zTop - (e.zBot ?? 0)) * p) break; }
        const xc = e.x0 + z * Math.tan(e.ang || 0);
        if (Math.abs(x - xc) * Math.cos(e.ang || 0) < e.w / 2) { const o = classify(E, x, z, i - 1, side); return o ? { k: i, x, z, side } : null; }
        break;
      }
      case 'pluton': {
        const r = ((x - e.cx) / e.rx) ** 2 + ((z - e.cz) / e.rz) ** 2;
        if (r < p) { const o = classify(E, x, z, i - 1, side); return o ? { k: i, x, z, side } : null; }
        break;
      }
      default: break;
    }
  }
  return null;
}

/** Height of the highest rock in column x (scanning down from zTop), or -Infinity. */
export function surfaceAt(E, x, zTop, zBot = -2, step = 0.04) {
  for (let z = zTop; z >= zBot; z -= step) if (classify(E, x, z)) {
    let lo = z, hi = z + step; for (let j = 0; j < 12; j++) { const m = (lo + hi) / 2; if (classify(E, x, m)) lo = m; else hi = m; }
    return lo;
  }
  return -Infinity;
}

/**
 * Draw a section as a raster: each event's rock gets its lithology colour and pattern (in the rock's own frame);
 * empty points are left transparent (or `air(x, z)` → rgb). o.lith(k) → lith key per event; o.tint(k) → [r,g,b]
 * overrides; o.key caches the raster.
 */
export function drawSection(v, s, E, o = {}) {
  const ppu = Math.abs(s.X(1) - s.X(0)), ppuz = Math.abs(s.Y(1) - s.Y(0));
  const cache = new Map();
  const cols = (k) => {
    if (cache.has(k)) return cache.get(k);
    const lith = o.lith ? o.lith(k) : E[k].lith, L = LITH[lith] || LITH.sand;
    const fill = o.tint?.(k) || rgbMix(v, L.color, 'panel', o.pale ?? 0.5), ink = rgbMix(v, L.color, 'ink', 0.38);
    const r = { fill, ink, pat: L.pat };
    cache.set(k, r); return r;
  };
  s.raster((x, z) => {
    const c = classify(E, x, z);
    if (!c) return o.air ? o.air(x, z) : null;
    const C = cols(c.k), u = c.x * ppu, w = c.z * ppuz;
    if (o.hi != null && o.hi === c.k) return C.ink;
    return patternAt(C.pat, u, w) ? C.ink : C.fill;
  }, { res: o.res ?? 2, key: o.key, id: o.id });
}

// ── fossils ─────────────────────────────────────────────────────────────────
export const FOSSILS = ['trilobite', 'graptolite', 'brachiopod', 'coral', 'crinoid', 'ammonite', 'gastropod', 'fishtooth'];
/** A small fossil glyph centred at pixel (X, Y), about `r` pixels in radius. */
export function fossil(v, s, kind, X, Y, r, color) {
  const c = s.ctx; c.save(); c.translate(X, Y);
  c.strokeStyle = v.color(color); c.fillStyle = v.color(color, 0.22); c.lineWidth = 1.4; c.lineJoin = 'round'; c.lineCap = 'round';
  c.beginPath();
  switch (kind) {
    case 'trilobite':
      c.ellipse(0, 0, r * 0.62, r, 0, 0, TAU); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-r * 0.2, -r * 0.95); c.lineTo(-r * 0.2, r * 0.95); c.moveTo(r * 0.2, -r * 0.95); c.lineTo(r * 0.2, r * 0.95);
      for (let k = -2; k <= 2; k++) { c.moveTo(-r * 0.58, k * r * 0.3); c.lineTo(r * 0.58, k * r * 0.3); }
      c.stroke(); break;
    case 'graptolite':
      c.moveTo(-r, r * 0.6); c.lineTo(r, -r * 0.6);
      for (let k = 0; k < 5; k++) { const t = -1 + k * 0.45, x = t * r, y = -t * r * 0.6; c.moveTo(x, y); c.lineTo(x + r * 0.18, y - r * 0.38); c.lineTo(x + r * 0.36, y - r * 0.2); }
      c.stroke(); break;
    case 'brachiopod':
      c.moveTo(0, r * 0.8); c.arc(0, r * 0.8, r * 1.5, -Math.PI * 0.78, -Math.PI * 0.22); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); for (let k = -2; k <= 2; k++) { const a = -Math.PI / 2 + k * 0.28; c.moveTo(0, r * 0.8); c.lineTo(Math.cos(a) * r * 1.45, r * 0.8 + Math.sin(a) * r * 1.45); } c.stroke(); break;
    case 'coral':
      c.moveTo(-r * 0.7, -r); c.quadraticCurveTo(-r * 0.4, r * 0.4, r * 0.1, r); c.quadraticCurveTo(r * 0.5, r * 0.1, r * 0.7, -r); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); for (let k = 1; k <= 3; k++) { const y = -r + k * r * 0.45, h = r * 0.7 * (1 - k * 0.22); c.moveTo(-h, y); c.lineTo(h + r * 0.08, y); } c.stroke(); break;
    case 'crinoid':
      c.moveTo(0, r); c.lineTo(0, -r * 0.1); c.stroke();
      c.beginPath(); for (let k = 0; k < 4; k++) { const y = r - k * r * 0.3; c.moveTo(-r * 0.18, y); c.lineTo(r * 0.18, y); } c.stroke();
      c.beginPath(); c.moveTo(0, -r * 0.1); c.lineTo(-r * 0.75, -r); c.moveTo(0, -r * 0.1); c.lineTo(-r * 0.25, -r * 1.05); c.moveTo(0, -r * 0.1); c.lineTo(r * 0.25, -r * 1.05); c.moveTo(0, -r * 0.1); c.lineTo(r * 0.75, -r); c.stroke(); break;
    case 'ammonite': {
      for (let t = 0; t <= 3.2 * TAU; t += 0.15) { const rr = r * Math.exp(-0.16 * (3.2 * TAU - t) / 1.6) ; const x = rr * Math.cos(t), y = rr * Math.sin(t); t === 0 ? c.moveTo(x, y) : c.lineTo(x, y); }
      c.stroke(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); break;
    }
    case 'gastropod':
      c.moveTo(0, -r * 1.05); c.lineTo(r * 0.62, r * 0.75); c.quadraticCurveTo(0, r * 1.15, -r * 0.62, r * 0.75); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); for (let k = 1; k <= 3; k++) { const y = -r + k * r * 0.48, h = (r * 0.62 * (y + r)) / (1.8 * r); c.moveTo(-h, y - r * 0.12); c.lineTo(h, y + r * 0.08); } c.stroke(); break;
    case 'fishtooth':
      c.moveTo(-r * 0.6, r * 0.8); c.lineTo(0, -r); c.lineTo(r * 0.6, r * 0.8); c.quadraticCurveTo(0, r * 0.45, -r * 0.6, r * 0.8); c.fill(); c.stroke(); break;
    default: c.arc(0, 0, r * 0.6, 0, TAU); c.stroke();
  }
  c.restore();
}

// ── formatting ──────────────────────────────────────────────────────────────
/** Duration in years → '6 000 yr', '35 kyr', '65 Myr', '4.54 Gyr' (plain text, real minus). */
export function fmtYr(y, sig = 2) {
  if (!isFinite(y)) return '∞';
  const a = Math.abs(y), f = (x) => { const s = Number(x.toPrecision(sig)); return s >= 1000 ? s.toLocaleString('en-US').replace(/,/g, ' ') : String(s); };
  if (a < 1) return `${f(y * 365.25)} days`;
  if (a < 1e4) return `${f(y)} yr`;
  if (a < 1e6) return `${f(y / 1e3)} kyr`;
  if (a < 1e9) return `${f(y / 1e6)} Myr`;
  return `${f(y / 1e9)} Gyr`;
}
