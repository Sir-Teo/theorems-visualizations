// Geology & Geophysics — Chapter 1: Rocks, strata and geologic time (part a: 1.1–1.5)
//
// Sources checked (Oct 2026):
//   1.1  unit cells: diopside a = 9.746 Å, b = 8.899 Å, β = 105.79° (Wikipedia, Diopside); tremolite a = 9.84 Å,
//        b = 18.02 Å, β = 104.95° (Wikipedia, Tremolite); cleavage 87°/93° (pyroxene), 56°/124° (amphibole).
//   1.2  global denudation ≈ 54 mm/kyr from cosmogenic nuclides in large rivers (Wittmann et al. 2020, Earth-Sci. Rev.);
//        long-term exhumation 0.01–0.3 mm/yr (Southard, The Environment of the Earth's Surface, §11.4); half-mass age
//        of sedimentary rocks ≈ 600 Myr (Garrels & Mackenzie 1969); sedimentary rocks ≈ 5–8% of crustal volume but
//        ≈ 75% of the land surface.
//   1.3  Fo–SiO₂ at 1 atm (Bowen & Andersen 1914, Am. J. Sci. 37: 487): Fo melts at 1890 °C, enstatite melts
//        incongruently at 1557 °C (peritectic liquid 32 wt% SiO₂ on the Fo–SiO₂ join = 61.0 wt% total SiO₂), eutectic
//        En + cristobalite at 1543 °C (38% on the join = 64.5 wt%); plagioclase: An melts at 1553 °C, Ab at 1118 °C
//        (Bowen 1913); ΔH_fus An = 81 kJ/mol (Robie et al. 1978, as used by Newton et al. 1980), Ab = 64.5 kJ/mol
//        (Tenner, Lange & Downs 2007).
//   1.4  Steno, De solido intra solidum naturaliter contento dissertationis prodromus (Florence, 1669).
//   1.5  William Smith's map, A Delineation of the Strata of England and Wales (1815); Strata Identified by Organized
//        Fossils (1816–19); Cuvier & Brongniart on the Paris Basin (1808/1811).

import { TAU, clamp, LITH, rgbMix, lithPoly, classify, surfaceAt, drawSection, fossil, fmtYr } from './ch01.shared.js';

// ── 1.1 silicate structures ─────────────────────────────────────────────────
const H3 = Math.sqrt(2 / 3); // height of a regular tetrahedron with unit O–O edge
/** Tetrahedron on a base triangle b (three O at one height); apex above (up = 1) or below (−1) the centroid. */
function tetra(b, up) {
  const c = [0, 1, 2].map((i) => (b[0][i] + b[1][i] + b[2][i]) / 3);
  return { O: [b[0], b[1], b[2], [c[0], c[1], c[2] + up * H3]], si: [c[0], c[1], c[2] + (up * H3) / 4] };
}
/** Equilateral triangle of unit side centred at (cx, cy) at height z, rotated by rot. */
function tri(cx, cy, z, rot) { const R = 1 / Math.sqrt(3); return [0, 1, 2].map((k) => [cx + R * Math.cos(rot + (k * TAU) / 3), cy + R * Math.sin(rot + (k * TAU) / 3), z]); }
/** Merge coincident oxygens; n[i] = number of tetrahedra sharing oxygen i. Centred on the mean Si. */
function assemble(list) {
  const O = [], map = new Map(), tets = [];
  const id = (p) => { const key = p.map((c) => Math.round(c * 1000)).join(','); if (!map.has(key)) { map.set(key, O.length); O.push(p); } return map.get(key); };
  for (const t of list) tets.push({ o: t.O.map(id), si: t.si });
  const n = new Array(O.length).fill(0); for (const t of tets) for (const i of t.o) n[i]++;
  const c = [0, 1, 2].map((i) => tets.reduce((s, t) => s + t.si[i], 0) / tets.length), sh = (p) => p.map((x, i) => x - c[i]);
  const bridging = n.filter((k) => k > 1).length;
  return { O: O.map(sh), tets: tets.map((t) => ({ o: t.o, si: sh(t.si) })), n, nSi: tets.length, nO: O.length, bridging, ratio: O.length / tets.length, kbar: (2 * bridging) / tets.length };
}
const S3 = Math.sqrt(3) / 2;
const SIL = {
  iso: { label: 'isolated', long: 'isolated tetrahedra (nesosilicates)', k: 0, max: 4, def: 3, ex: 'olivine (Mg,Fe)₂SiO₄', anion: '\\mathrm{SiO_4^{4-}}', cleave: 'none', cl: 'no good cleavage: olivine breaks with a conchoidal fracture',
    build(n) { const L = []; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const up = (i + j) % 2 ? -1 : 1; L.push(tetra(tri(i * 1.9, j * 1.9, (-up * H3) / 2, up > 0 ? Math.PI / 2 : 0.4 - Math.PI / 2), up)); } return L; } },
  pair: { label: 'pairs', long: 'pairs sharing one corner (sorosilicates)', k: 1, max: 4, def: 3, ex: 'åkermanite Ca₂MgSi₂O₇', anion: '\\mathrm{Si_2O_7^{6-}}', cleave: 'none', cl: 'cleavage weak: the anions are held only by cations',
    build(n) { const L = []; for (let i = 0; i < n; i++) { const x = i * 2.1, y = (i % 2) * 0.9; L.push(tetra(tri(x, y, H3, Math.PI / 2), -1), tetra(tri(x, y, -H3, -Math.PI / 2), 1)); } return L; } },
  ring: { label: 'rings', long: 'six-membered rings (cyclosilicates)', k: 2, max: 3, def: 1, ex: 'beryl Be₃Al₂Si₆O₁₈', anion: '\\mathrm{Si_6O_{18}^{12-}}', cleave: 'none', cl: 'beryl has only an imperfect basal cleavage',
    build(n) {
      const L = [], s3 = Math.sqrt(3);
      for (let r = 0; r < n; r++) for (let k = 0; k < 6; k++) {
        const a0 = (k * TAU) / 6, a1 = ((k + 1) * TAU) / 6, am = a0 + TAU / 12, cx = r * 4.2;
        L.push(tetra([[cx + Math.cos(a0), Math.sin(a0), 0], [cx + Math.cos(a1), Math.sin(a1), 0], [cx + s3 * Math.cos(am), s3 * Math.sin(am), 0]], 1));
      }
      return L;
    } },
  chain: { label: 'single chain', long: 'single chains (inosilicates: pyroxenes)', k: 2, max: 12, def: 8, ex: 'pyroxene, e.g. diopside CaMgSi₂O₆', anion: '(\\mathrm{SiO_3})_n^{2n-}', cleave: 'px',
    build(n) { const L = []; for (let i = 0; i < n; i++) L.push(tetra([[i, 0, 0], [i + 1, 0, 0], [i + 0.5, (i % 2 ? -1 : 1) * S3, 0]], 1)); return L; } },
  dchain: { label: 'double chain', long: 'double chains (inosilicates: amphiboles)', k: 2.5, max: 10, def: 6, ex: 'amphibole, e.g. tremolite Ca₂Mg₅Si₈O₂₂(OH)₂', anion: '(\\mathrm{Si_4O_{11}})_n^{6n-}', cleave: 'am',
    build(n) {
      const L = [];
      for (let i = 0; i < n; i++) { const f = i % 2 ? -1 : 1; L.push(tetra([[i, 0, 0], [i + 1, 0, 0], [i + 0.5, f * S3, 0]], 1), tetra([[i, 2 * S3, 0], [i + 1, 2 * S3, 0], [i + 0.5, 2 * S3 - f * S3, 0]], 1)); }
      return L;
    } },
  sheet: { label: 'sheet', long: 'sheets (phyllosilicates: micas, clays)', k: 3, max: 4, def: 3, ex: 'mica, e.g. muscovite KAl₂(AlSi₃O₁₀)(OH)₂', anion: '(\\mathrm{Si_2O_5})_n^{2n-}', cleave: 'mica',
    build(n) {
      const L = [], s3 = Math.sqrt(3);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const P = (u, w) => [2 * i + j + u, s3 * j + w, 0];
        L.push(tetra([P(0, 0), P(1, 0), P(0.5, S3)], 1), tetra([P(1, 0), P(2, 0), P(1.5, -S3)], 1));
      }
      return L;
    } },
  frame: { label: 'framework', long: 'three-dimensional frameworks (tectosilicates)', k: 4, max: 4, def: 3, ex: 'quartz SiO₂, feldspars (drawn as ideal cristobalite)', anion: '\\mathrm{SiO_2}', cleave: 'none3',
    build(n) {
      const q = Math.sqrt(3 / 8) / Math.sqrt(3) * 2; // a/4 for Si–O = √(3/8): bond vector length (a/4)√3 = 2·√(3/8)
      const B = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map((b) => b.map((c) => c * q));
      const seen = new Map(), out = [];
      const key = (p) => p.map((c) => Math.round(c * 1000)).join(',');
      let front = [{ p: [0, 0, 0], s: 1 }]; seen.set(key([0, 0, 0]), 1);
      for (let d = 0; d < n; d++) {
        const next = [];
        for (const a of front) {
          out.push({ O: B.map((b) => a.p.map((c, i) => c + (a.s * b[i]) / 2)), si: a.p });
          if (d < n - 1) for (const b of B) { const p = a.p.map((c, i) => c + a.s * b[i]); const k = key(p); if (!seen.has(k)) { seen.set(k, 1); next.push({ p, s: -a.s }); } }
        }
        front = next;
      }
      return out;
    } },
};
const LADDER = [['olivine', 0], ['åkermanite', 1], ['beryl, pyroxene', 2], ['amphibole', 2.5], ['mica', 3], ['quartz, feldspar', 4]];
// end-on packing of chains (Å): x along b, y along a·sinβ
const BEAMS = { px: { A: 9.746 * Math.sin((105.79 * Math.PI) / 180), B: 8.899, name: 'diopside' }, am: { A: 9.84 * Math.sin((104.95 * Math.PI) / 180), B: 18.02, name: 'tremolite' } };

/** Inset: chains seen end-on as I-beams and the two cleavage traces running between them. */
function cleavageInset(v, s, kind, box) {
  const [x0, y0, x1, y1] = box, X0 = s.X(x0), X1 = s.X(x1), Y0 = s.Y(y1), Y1 = s.Y(y0), c = s.ctx;
  s.rect(x0, y0, x1, y1, { fill: 'panel', fillAlpha: 0.9, color: 'faint', width: 1, radius: 6 });
  const cxp = (X0 + X1) / 2, cyp = (Y0 + Y1) / 2 + 6, W = X1 - X0, Hh = Y1 - Y0;
  c.save(); c.beginPath(); c.rect(X0 + 2, Y0 + 18, W - 4, Hh - 20); c.clip();
  if (kind === 'px' || kind === 'am') {
    const { A, B } = BEAMS[kind], k = Math.min((W - 16) / (1.75 * B), (Hh - 26) / (1.85 * A));
    const bw = 0.3 * B * k, bh = 0.21 * A * k, ink = v.color('accent');
    for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) for (const [di, dj] of [[0, 0], [0.5, 0.5]]) {
      const X = cxp + (i + di) * B * k, Y = cyp + (j + dj) * A * k;
      c.fillStyle = v.color('accent', 0.28); c.strokeStyle = ink; c.lineWidth = 1;
      c.fillRect(X - bw, Y - bh, 2 * bw, bh * 0.45); c.fillRect(X - bw, Y + bh * 0.55, 2 * bw, bh * 0.45); c.fillRect(X - bw * 0.2, Y - bh, bw * 0.4, 2 * bh);
    }
    c.strokeStyle = v.color('red'); c.lineWidth = 1.6; c.setLineDash([5, 3]);
    for (const i of [-1, 0]) for (const sg of [1, -1]) { // traces through the gaps ((i+½)B, 0) along (B, ±A)
      const gx = cxp + (i + 0.5) * B * k, gy = cyp, dx = B * k * 3, dy = sg * A * k * 3;
      c.beginPath(); c.moveTo(gx - dx, gy - dy); c.lineTo(gx + dx, gy + dy); c.stroke();
    }
    c.setLineDash([]);
    const ang = (2 * Math.atan(A / B) * 180) / Math.PI, gx = cxp + 0.5 * B * k;
    s.textPx(`${Math.round(ang)}°`, gx + 15, cyp, { size: 11.5, weight: 700, color: 'red' });
    s.textPx(`${Math.round(180 - ang)}°`, gx, cyp - 15, { size: 11.5, weight: 700, color: 'red', align: 'center' });
  } else if (kind === 'mica') {
    for (let j = -2; j <= 2; j++) {
      const Y = cyp + j * 22;
      c.fillStyle = v.color('accent', 0.3); c.fillRect(X0 + 8, Y - 7, W - 16, 14);
      c.strokeStyle = v.color('accent'); c.lineWidth = 1; c.strokeRect(X0 + 8, Y - 7, W - 16, 14);
      c.fillStyle = v.color('gold'); for (let x = X0 + 14; x < X1 - 8; x += 13) { c.beginPath(); c.arc(x, Y + 11, 2, 0, TAU); c.fill(); }
    }
    c.strokeStyle = v.color('red'); c.lineWidth = 1.6; c.setLineDash([5, 3]); c.beginPath(); c.moveTo(X0 + 4, cyp + 11); c.lineTo(X1 - 4, cyp + 11); c.stroke(); c.setLineDash([]);
  } else if (kind === 'none3') {
    c.strokeStyle = v.color('accent', 0.7); c.lineWidth = 1;
    const g = 15; for (let j = -4; j <= 4; j++) for (let i = -6; i <= 6; i++) { const X = cxp + (i + (j % 2) * 0.5) * g, Y = cyp + j * g * 0.87; c.beginPath(); c.moveTo(X, Y); c.lineTo(X + g, Y); c.moveTo(X, Y); c.lineTo(X + g / 2, Y + g * 0.87); c.stroke(); }
  } else { // isolated anions (triangles: tetrahedra seen from above) held together by cations
    const g = 26;
    for (let j = -2; j <= 2; j++) for (let i = -4; i <= 4; i++) {
      const X = cxp + (i + (j % 2) * 0.5) * g, Y = cyp + j * g * 0.8, r = 7, up = (i + j) % 2 ? 1 : -1;
      c.beginPath(); for (let q = 0; q < 3; q++) { const a = (up * Math.PI) / 2 + (q * TAU) / 3; q ? c.lineTo(X + r * Math.cos(a), Y - r * Math.sin(a)) : c.moveTo(X + r * Math.cos(a), Y - r * Math.sin(a)); } c.closePath();
      c.fillStyle = v.color('accent', 0.3); c.fill(); c.strokeStyle = v.color('accent'); c.lineWidth = 1; c.stroke();
      c.fillStyle = v.color('gold'); c.beginPath(); c.arc(X + g / 2, Y, 2.6, 0, TAU); c.fill();
    }
  }
  c.restore();
  const title = { px: 'pyroxene chains, end-on', am: 'amphibole chains, end-on', mica: 'mica sheets, edge-on', none3: 'framework', none: 'anions + cations (gold)' }[kind];
  s.textPx(title, X0 + 8, Y0 + 10, { size: 11, weight: 600, color: 'muted' });
}

// ── 1.2 rock cycle ──────────────────────────────────────────────────────────
const RC_NODES = {
  magma: { label: 'magma', x: 5, y: 0.8, color: 'red' },
  ign: { label: 'igneous rock', x: 1.5, y: 3.0, color: 'pink' },
  sed: { label: 'sediment', x: 3.1, y: 6.2, color: 'gold' },
  sedr: { label: 'sedimentary rock', x: 6.9, y: 6.2, color: 'orange' },
  met: { label: 'metamorphic rock', x: 8.5, y: 3.0, color: 'purple' },
};
const KAPPA = 1e-6, YR = 3.156e7; // rock thermal diffusivity (m²/s), seconds per year
/** Conductive cooling/heating time L²/κ in years for a body of half-thickness L metres. */
const tCond = (L) => (L * L) / KAPPA / YR;
const RC_PROC = [
  { id: 'intr', from: 'magma', to: 'ign', label: 'cools slowly at depth', bend: -0.35, depth: 5, tex: 'coarse', rock: 'granite', t: () => [tCond(500), tCond(5000)], why: 'conduction time L²/κ for a pluton 0.5–5 km across' },
  { id: 'extr', from: 'magma', to: 'ign', label: 'erupts, cools fast', bend: 0.45, depth: 0, tex: 'fine', rock: 'basalt / rhyolite', t: () => [tCond(1), tCond(10)], why: 'L²/κ for a lava flow 1–10 m thick' },
  { id: 'erI', from: 'ign', to: 'sed', label: 'uplift, weathering, erosion', bend: -0.12, depth: 0, tex: 'loose', rock: 'sand', t: 'erode' },
  { id: 'lith', from: 'sed', to: 'sedr', label: 'burial, lithification', bend: 0.0, depth: 1.5, tex: 'cemented', rock: 'sandstone', t: () => [1500 / 0.1e-3, 1500 / 0.01e-3], why: 'burial to 1.5 km at 0.01–0.1 mm/yr' },
  { id: 'metS', from: 'sedr', to: 'met', label: 'heat and pressure', bend: 0.15, depth: 20, tex: 'foliated', rock: 'quartzite / gneiss', t: () => [20000 / 20e-3, 20000 / 2e-3], why: 'burial to 20 km at 2–20 mm/yr in a collision zone' },
  { id: 'melt', from: 'met', to: 'magma', label: 'melting', bend: -0.35, depth: 25, tex: 'melt', rock: 'magma', t: () => [tCond(1000), tCond(10000)], why: 'heating by conduction over 1–10 km' },
  { id: 'metI', from: 'ign', to: 'met', label: 'heat and pressure', bend: 0.18, depth: 20, tex: 'foliated', rock: 'gneiss', t: () => [20000 / 20e-3, 20000 / 2e-3], why: 'burial to 20 km at 2–20 mm/yr' },
  { id: 'erS', from: 'sedr', to: 'sed', label: 'uplift, erosion', bend: 0.5, depth: 0, tex: 'loose', rock: 'sand', t: 'erode' },
  { id: 'erM', from: 'met', to: 'sed', label: 'uplift, erosion', bend: 0.22, depth: 0, tex: 'loose', rock: 'sand', t: 'erode' },
  { id: 'meltS', from: 'sedr', to: 'magma', label: 'melting', bend: -0.2, depth: 25, tex: 'melt', rock: 'magma', t: () => [tCond(1000), tCond(10000)], why: 'heating by conduction over 1–10 km' },
  { id: 'meltI', from: 'ign', to: 'magma', label: 'remelting', bend: -0.25, depth: 25, tex: 'melt', rock: 'magma', t: () => [tCond(1000), tCond(10000)], why: 'heating by conduction over 1–10 km' },
];
/** Quadratic Bézier between two node boxes, trimmed to the boxes. */
function rcCurve(P, s) {
  const A = RC_NODES[P.from], B = RC_NODES[P.to], mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, dx = B.x - A.x, dy = B.y - A.y;
  const cx = mx - dy * P.bend, cy = my + dx * P.bend;
  const at = (t) => [(1 - t) ** 2 * A.x + 2 * (1 - t) * t * cx + t * t * B.x, (1 - t) ** 2 * A.y + 2 * (1 - t) * t * cy + t * t * B.y];
  const inBox = (p, N) => Math.abs(s.X(p[0]) - s.X(N.x)) < N.w / 2 + 4 && Math.abs(s.Y(p[1]) - s.Y(N.y)) < 15;
  let t0 = 0, t1 = 1; while (t0 < 0.5 && inBox(at(t0), A)) t0 += 0.01; while (t1 > 0.5 && inBox(at(t1), B)) t1 -= 0.01;
  const pts = []; for (let i = 0; i <= 40; i++) pts.push(at(t0 + ((t1 - t0) * i) / 40));
  return { pts, mid: at((t0 + t1) / 2) };
}
/** Seeded hash in [0, 1). */
const hash = (i, j, s = 0) => { const x = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453; return x - Math.floor(x); };
/** Jittered-grid Voronoi: nearest and second-nearest seed for (x, y) with cell sizes gx, gy. Seed (0, 0) sits at the origin. */
function voronoi(x, y, gx, gy, seed) {
  const i0 = Math.floor(x / gx), j0 = Math.floor(y / gy); let d1 = 1e9, d2 = 1e9, id = null;
  for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) {
    const sx = i === 0 && j === 0 ? 0.0001 : (i + 0.15 + 0.7 * hash(i, j, seed)) * gx, sy = i === 0 && j === 0 ? 0.0001 : (j + 0.15 + 0.7 * hash(j, i, seed + 1)) * gy;
    const d = ((x - sx) / gx) ** 2 + ((y - sy) / gy) ** 2;
    if (d < d1) { d2 = d1; d1 = d; id = [i, j]; } else if (d < d2) d2 = d;
  }
  return { id, edge: Math.sqrt(d2) - Math.sqrt(d1) };
}

// ── 1.3 Bowen: phase equilibria ─────────────────────────────────────────────
const FO = { wFo: 42.70, wEn: 59.85, wP: 61.0, wE: 64.5, TFo: 1890, TP: 1557, TE: 1543 };
/** Mole fraction of the Mg₂SiO₄ component in a Fo–SiO₂ liquid with w wt% total SiO₂. */
function xFo(w) { const x = (w - FO.wFo) / (100 - FO.wFo), nF = (1 - x) / 140.69, nS = x / 60.08; return nF / (nF + nS); }
const KFO = (1 / (FO.TP + 273.15) - 1 / (FO.TFo + 273.15)) / -Math.log(xFo(FO.wP)); // R/ΔH of an ideal liquidus through both measured points
const TliqFo = (w) => 1 / (1 / (FO.TFo + 273.15) - KFO * Math.log(xFo(w))) - 273.15;
function wliqFo(T) { let lo = FO.wFo, hi = FO.wP; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (TliqFo(m) > T) lo = m; else hi = m; } return (lo + hi) / 2; }
const TliqEn = (w) => FO.TP + ((FO.TE - FO.TP) * (w - FO.wP)) / (FO.wE - FO.wP);
const PL = { TAn: 1553 + 273.15, TAb: 1118 + 273.15, HAn: 81000, HAb: 64500, R: 8.314 };
/** Ideal (Schröder–van Laar) plagioclase loop at T °C → mole fractions of An in liquid and solid. */
function plag(Tc) { const T = Tc + 273.15, kA = Math.exp((PL.HAn / PL.R) * (1 / T - 1 / PL.TAn)), kB = Math.exp((PL.HAb / PL.R) * (1 / T - 1 / PL.TAb)), xl = (1 - kB) / (kA - kB); return { xl, xs: kA * xl }; }
function plagTliq(x) { let lo = 1118.01, hi = 1552.99; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (plag(m).xl > x) hi = m; else lo = m; } return (lo + hi) / 2; }
function plagTsol(x) { let lo = 1118.01, hi = 1552.99; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (plag(m).xs > x) hi = m; else lo = m; } return (lo + hi) / 2; }
/** wt% SiO₂ of a plagioclase-composition melt with An mole fraction x. */
const plagSiO2 = (x) => (100 * (x * 120.17 + (1 - x) * 180.25)) / (x * 278.21 + (1 - x) * 262.22);
/** Rayleigh fractionation along the loop from the liquidus of x0: rows {T, xl, xs, F}. */
function plagRayleigh(x0) {
  const T0 = plagTliq(x0), rows = [{ T: T0, xl: x0, xs: plag(T0).xs, F: 1 }]; let lnF = 0;
  for (let T = T0; T > 1118.3;) {
    const dT = T > 1130 ? 0.5 : 0.05, a = plag(T), b = plag(T - dT);
    lnF += (((b.xl - a.xl) / (a.xs - a.xl)) + ((b.xl - a.xl) / (b.xs - b.xl))) / 2; T -= dT;
    rows.push({ T, xl: b.xl, xs: b.xs, F: Math.exp(lnF) });
  }
  return rows;
}

// ── 1.4 Steno: building a cross-section ────────────────────────────────────
const ST_W = 12, ST_H = 5;
const ST_DEFAULT = () => [
  { type: 'base', lith: 'gneiss', top: 0.7 },
  { type: 'dep', lith: 'sand', top: 1.35 },
  { type: 'dep', lith: 'shale', top: 2.0 },
  { type: 'dep', lith: 'lime', top: 2.6 },
  { type: 'dep', lith: 'sand', top: 3.25 },
  { type: 'tilt', ang: (18 * Math.PI) / 180, cx: 6, cz: 0 },
  { type: 'dike', lith: 'basalt', x0: 4.3, w: 0.34, ang: 0.12 },
  { type: 'dike', lith: 'basalt', x0: 9.0, w: 0.3, ang: -0.1 },
  { type: 'erode', level: 2.75, amp: 0.07, wl: 3.1, ph: 0.6 },
  { type: 'dep', lith: 'cong', top: 3.2 },
  { type: 'dep', lith: 'shale', top: 3.85 },
  { type: 'dep', lith: 'lime', top: 4.45 },
];
const isUnit = (e) => e.type === 'base' || e.type === 'dep' || e.type === 'dike' || e.type === 'pluton';

// ── 1.5 faunal succession ──────────────────────────────────────────────────
// taxa (FOSSILS order) with ranges in time units (0 = oldest, 100 = youngest)
const TAXA = [
  { k: 'trilobite', r: [0, 46], c: 'purple' }, { k: 'graptolite', r: [8, 30], c: 'ink' }, { k: 'brachiopod', r: [0, 100], c: 'teal' },
  { k: 'coral', r: [22, 62], c: 'red' }, { k: 'crinoid', r: [36, 78], c: 'pink' }, { k: 'ammonite', r: [55, 100], c: 'orange' },
  { k: 'gastropod', r: [70, 100], c: 'green' }, { k: 'fishtooth', r: [84, 100], c: 'blue' },
];
// beds [t0, t1, lith, thickness per time unit]
const SITE_A = [[0, 10, 'sand', 0.9], [10, 22, 'shale', 0.75], [22, 34, 'shale', 0.8], [34, 48, 'lime', 0.9], [48, 60, 'sand', 0.7], [60, 74, 'shale', 0.85], [74, 88, 'lime', 0.75], [88, 100, 'sand', 0.8]];
const SITE_B = [[4, 18, 'lime', 0.6], [18, 30, 'sand', 0.9], [30, 40, 'shale', 1.0], [58, 68, 'lime', 1.2], [68, 80, 'sand', 0.9], [80, 92, 'shale', 0.8], [92, 100, 'lime', 1.0]];
function stackSite(beds) { let h = 0; return beds.map(([t0, t1, lith, rate]) => { const b = { t0, t1, lith, h0: h, h1: h + (t1 - t0) * rate }; h = b.h1; b.taxa = TAXA.map((T, i) => (T.r[0] < t1 && T.r[1] > t0 ? i : -1)).filter((i) => i >= 0); let lo = Math.max(...b.taxa.map((i) => TAXA[i].r[0])), hi = Math.min(...b.taxa.map((i) => TAXA[i].r[1]));
    TAXA.forEach((T, i) => { if (b.taxa.includes(i) || T.r[1] <= lo || T.r[0] >= hi) return; if (T.r[0] > lo) hi = Math.min(hi, T.r[0]); else lo = Math.max(lo, T.r[1]); }); // an absent species was not yet, or no longer, alive
    b.win = [lo, hi]; return b; }); }

export default {
  collection: 'geol',
  chapter: 1,
  title: 'Rocks, strata and geologic time',
  summary: String.raw`Geology reads history from rocks. Silicate minerals are built from one unit, the SiO₄ tetrahedron, linked in a handful of ways; magma crystallizes them in a predictable order, and the rock cycle melts, erodes, buries and bakes them into one another. Steno's principles, faunal succession, unconformities and Walther's law turn a pile of strata into a sequence of events and a relative time scale. Hutton's uniformitarianism demanded deep time, and Kelvin's careful cooling calculation of the Earth's age shows how a sound physical model with one wrong assumption can mislead.`,
  items: [
    // ───────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1',
      kind: 'Concept',
      name: 'Silicate minerals and their structures',
      statement: String.raw`Nearly all rock-forming minerals of the crust and mantle are **silicates**, built from the $\mathrm{SiO_4}$ tetrahedron: a small $\mathrm{Si^{4+}}$ ion in fourfold coordination by $\mathrm{O^{2-}}$ ions, the Si–O bond being strong and partly covalent. Tetrahedra link only by sharing **corners** (one oxygen between two silicons, never an edge or face), and the number $k$ of corners each tetrahedron shares sorts the silicates into classes:

- $k=0$, isolated tetrahedra (olivine), $k=1$, pairs (sorosilicates), $k=2$, rings (beryl) or single chains (pyroxenes), $k=2.5$ on average, double chains (amphiboles), $k=3$, sheets (micas, clays), $k=4$, frameworks (quartz, feldspars).

Each shared oxygen is counted half for each of its two tetrahedra, so the ratio is $\mathrm{O}:\mathrm{Si} = 4 - k/2$, from $4$ (olivine) to $2$ (quartz), and the anion's charge per silicon is $-(4-k)$, balanced by cations ($\mathrm{Mg^{2+}, Fe^{2+}, Ca^{2+}, Na^+, K^+, Al^{3+}}$) between the tetrahedral units. The linkage controls cleavage: minerals break between strongly bonded units, so chains give two prismatic cleavages, sheets one basal cleavage, and frameworks and isolated tetrahedra none of note.`,
      idea: String.raw`The radius ratio $r_\mathrm{Si}/r_\mathrm{O}\approx 0.29$ puts silicon in tetrahedral coordination, and Pauling's rules (xtal-1.10) say that highly charged cations in low coordination keep their polyhedra apart: sharing an edge would bring two $\mathrm{Si^{4+}}$ too close, so only corners are shared. Counting oxygens is then bookkeeping. The cleavage angles follow from how the units pack: pyroxene chains, seen end-on, sit like I-beams on a centred lattice of spacings $a\sin\beta$ and $b$, and the cleavage planes run diagonally between the beams at $2\arctan\big(a\sin\beta/b\big)$, which is about $93^\circ$ for pyroxene and $56^\circ$ for amphibole, whose beams are twice as wide.`,
      caption: String.raw`Choose a linkage and grow the fragment with **size**; drag the background to rotate. **Gold** oxygens are shared by two tetrahedra, **red** ones belong to one, and the black dots are silicon. The right panel counts: every fragment lies on the line $\mathrm{O}:\mathrm{Si}=4-\bar k/2$ at its average number $\bar k$ of shared corners, and slides toward the value of the infinite structure as it grows (finite anions such as $\mathrm{Si_2O_7}$ are exact at once). The inset shows how the units pack end-on and draws the cleavage traces, with the angle computed from measured unit cells of diopside and tremolite.`,
      deps: ['xtal-1.10'],
      see: ['xtal-1.9', 'geol-1.3'],
      refs: ['Press–Siever'],
      tags: ['minerals', 'crystal structure'],
      viz(v) {
        const kind = v.select('linkage', Object.entries(SIL).map(([value, S]) => ({ value, label: S.label })), 'chain', { onChange: () => size.set(SIL[kind.value].def) });
        const size = v.slider('size', 1, 12, 8, { int: true });
        const s = v.stage({ x: [-3.3, 3.3], y: [-3.3, 3.3], equal: true, axes: false, height: 400, weight: 1.15 });
        const sc = v.scene3(s, { yaw: -0.5, pitch: 0.75, axes: false });
        const L = v.stage({ x: [-0.95, 4.35], y: [1.55, 4.25], axes: 'box', height: 400, weight: 0.95, minWidth: 280, xlabel: 'corners shared per tetrahedron', ylabel: 'O : Si', xticks: [0, 1, 2, 3, 4], yticks: [2, 2.5, 3, 3.5, 4] });
        const cache = new Map();
        const get = (key, n) => { const kk = key + n; if (!cache.has(kk)) cache.set(kk, assemble(SIL[key].build(n))); return cache.get(kk); };
        let st = null;
        v.render(() => {
          const key = kind.value, S = SIL[key], n = clamp(size.value, 1, S.max), A = get(key, n);
          let R = 0; for (const p of A.O) R = Math.max(R, Math.hypot(...p));
          const sf = Math.min(1.25, 2.75 / Math.max(R, 0.8)), P = (p) => p.map((c) => c * sf), rr = clamp(sf * 4.6, 2.3, 5.5);
          sc.begin();
          for (const t of A.tets) {
            const q = t.o.map((i) => P(A.O[i]));
            for (const f of [[0, 1, 2], [0, 1, 3], [1, 2, 3], [0, 2, 3]]) sc.poly(f.map((i) => q[i]), { fill: 'accent', fillAlpha: 0.12, color: 'accent', width: 1, alpha: 0.5 });
          }
          A.O.forEach((p, i) => sc.dot(P(p), { r: rr, color: A.n[i] > 1 ? 'gold' : 'red', top: false }));
          for (const t of A.tets) sc.dot(P(t.si), { r: Math.max(1.6, rr * 0.45), color: 'ink', top: false });
          sc.flush();
          s.corner(S.long, 'tl', { size: 12, weight: 600, color: 'ink' });
          // the counting ladder
          L.line(0, 4, 4, 2, { color: 'faint', width: 1.4 });
          for (const [name, k] of LADDER) {
            const on = k === S.k;
            L.dot(k, 4 - k / 2, { r: on ? 6 : 4, color: on ? 'accent' : 'muted' });
            L.text(name, k, 4 - k / 2, { dx: -8, dy: 12, align: 'right', size: 11.5, color: on ? 'accent' : 'muted', weight: on ? 700 : 500 });
          }
          for (let m = 1; m <= S.max; m++) { const B = get(key, m); L.dot(B.kbar, B.ratio, { r: m === n ? 5.5 : 3, color: 'gold', hollow: m !== n }); }
          L.text(`fragment: ${A.nSi} Si, ${A.nO} O`, -0.85, 2.3, { size: 11.5, color: 'gold', weight: 700 });
          L.text(`O : Si = ${v.fix(A.ratio, 3)}`, -0.85, 2.3, { dy: 16, size: 11.5, color: 'gold', weight: 700 });
          cleavageInset(v, L, S.cleave, [2.25, 3.3, 4.3, 4.22]);
          st = { S, A, n };
        });
        v.legend([['red', 'oxygen in one tetrahedron', { dot: true }], ['gold', 'shared (bridging) oxygen', { dot: true }], ['ink', 'silicon', { dot: true }], ['red', 'cleavage trace', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { S, A } = st, inf = 4 - S.k / 2;
          let cl = { none: S.cl, none3: 'no cleavage: every plane cuts Si–O bonds, so quartz breaks with a conchoidal fracture', mica: 'one perfect basal cleavage between the sheets' }[S.cleave];
          if (S.cleave === 'px' || S.cleave === 'am') {
            const { A: a, B: b, name } = BEAMS[S.cleave], ang = (2 * Math.atan(a / b) * 180) / Math.PI;
            cl = `two prismatic cleavages; from the ${name} cell, $2\\arctan(a\\sin\\beta/b) = ${v.fix(ang, 1)}^\\circ$, so the traces meet at **${v.fix(Math.min(ang, 180 - ang), 0)}° and ${v.fix(Math.max(ang, 180 - ang), 0)}°**`;
          }
          const finite = S.k <= 2 && S.label !== 'single chain';
          return `fragment: ${A.nSi} Si, ${A.nO} O (${A.bridging} shared) → O : Si = **${v.fix(A.ratio, 3)}**, $\\bar k$ = ${v.fix(A.kbar, 2)} · ${finite ? 'a finite anion: exact for any size' : 'infinite structure'}: $k = ${S.k}$, O : Si $= 4 - k/2 =$ **${v.fix(inf, 2)}**, anion $${S.anion}$ · e.g. ${S.ex} · ${cl}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2',
      kind: 'Model',
      name: 'The rock cycle',
      statement: String.raw`Rocks are of three kinds by origin: **igneous** (crystallized from magma), **sedimentary** (deposited at the surface as grains or precipitates, then buried and cemented) and **metamorphic** (recrystallized in the solid state by heat and pressure). The rock cycle says that any kind can become any other: magma cools to igneous rock; uplift, weathering and erosion turn any exposed rock into sediment; burial and lithification turn sediment into sedimentary rock; heat and pressure at depth turn any rock into metamorphic rock; and melting returns any rock to magma. The material is conserved and recycled, driven by the Sun (weathering, erosion, transport) and by internal heat (plate tectonics, burial, melting).`,
      scope: String.raw`A qualitative conservation model for the crust. It ignores exchange with the mantle (new magma from mantle melting, subduction of crust back into it) and says nothing by itself about rates, which span from days (a lava flow freezing) to hundreds of millions of years (erosion of a deep-seated rock); sedimentary rocks are only about 5–8% of the crust's volume but cover about three quarters of the land.`,
      idea: String.raw`Each arrow is a physical process with its own time scale, and simple physics gives the order of magnitude. Cooling and heating are conductive, taking about $L^2/\kappa$ for a body of size $L$ ($\kappa\approx10^{-6}$ m²/s): a year for a 5 m lava flow, $10^5$–$10^6$ years for a pluton kilometres across, which is why intrusive rocks are coarse and volcanic rocks fine. Bringing a rock formed at depth $d$ back to the surface takes $d$ divided by the denudation rate, globally about 0.05 mm per year, so a granite formed at 5 km waits around 100 million years. Silicate minerals (geol-1.1) are the currency: a quartz grain can survive weathering, transport, burial and metamorphism unchanged and is destroyed only by melting.`,
      caption: String.raw`Click a process leaving the current box (the bright arrows) to send the sample along it; **random step** picks one, **reset** starts again from magma. The right panel shows the sample's texture, with the tracked quartz grain in gold: coarse interlocking crystals after slow cooling, fine ones after eruption, loose rounded grains, cemented sandstone, aligned grains and bands after metamorphism. The strip below puts each step's duration on a logarithmic time axis (bars span the range given by the physics in each label); move the **denudation rate** to see erosion dominate the clock.`,
      deps: ['geol-1.1'],
      see: ['geol-3.12', 'geol-1.3'],
      refs: ['Press–Siever'],
      tags: ['rocks', 'cycles'],
      viz(v) {
        const den = v.slider('denudation rate (mm/yr)', 0.005, 0.5, 0.054, { log: true, sig: 2 });
        const D = v.stage({ x: [0, 10], y: [0, 7], axes: false, height: 380, weight: 1.35 });
        const T = v.stage({ x: [-1.05, 1.05], y: [-1.05, 1.05], equal: true, axes: false, height: 380, weight: 0.75, minWidth: 240 });
        const H = v.stage({ x: [0.01, 3e9], y: [0, 7.2], xlog: true, axes: 'box', height: 180, full: true, xlabel: 'duration (years, log scale)', yticks: [] });
        let hist = ['intr', 'erI', 'lith', 'metS'], rngN = 0;
        const stateOf = () => { let node = 'magma', depth = 25, tex = 'melt', rock = 'magma'; for (const id of hist) { const P = RC_PROC.find((p) => p.id === id); node = P.to; tex = P.tex; rock = P.rock; depth = P.depth; } return { node, depth, tex, rock }; };
        const durOf = (P, depthBefore) => (P.t === 'erode' ? (() => { const d = Math.max(depthBefore, 0.05) * 1e6 / den.value; return [d, d]; })() : P.t());
        const take = (id) => { hist.push(id); if (hist.length > 14) hist.shift(); };
        v.button('random step', () => { const cur = stateOf().node, opts = RC_PROC.filter((p) => p.from === cur); take(opts[Math.floor(hash(rngN++, hist.length, 3) * opts.length)].id); });
        v.button('reset', () => { hist = []; });
        // node widths in px for trimming
        D.ctx.font = '600 13px Inter, system-ui, sans-serif';
        for (const N of Object.values(RC_NODES)) N.w = D.ctx.measureText(N.label).width + 22;
        let curves = [];
        D.onClick((x, y) => {
          const cur = stateOf().node; let best = null, bd = 1e9;
          for (const c of curves) {
            if (c.P.from !== cur) continue;
            const dl = Math.hypot(D.X(c.mid[0]) - D.X(x), D.Y(c.mid[1]) - D.Y(y)); if (dl < bd) { bd = dl; best = c; }
            for (const p of c.pts) { const d = Math.hypot(D.X(p[0]) - D.X(x), D.Y(p[1]) - D.Y(y)); if (d < bd) { bd = d; best = c; } }
          }
          if (best && bd < 42) take(best.P.id);
        });
        let st = null;
        v.render(() => {
          const S = stateOf(), cur = S.node;
          curves = RC_PROC.map((P) => ({ P, ...rcCurve(P, D) }));
          const taken = new Set(hist.slice(-1));
          for (const c of curves) {
            const out = c.P.from === cur, last = taken.has(c.P.id) && c.P.to === cur;
            const col = out ? 'accent' : last ? 'gold' : 'faint';
            const al = out || last ? 1 : 0.5;
            D.path(c.pts, { color: col, width: out ? 2.4 : last ? 2.6 : 1.2, alpha: al });
            const e = c.pts[c.pts.length - 1]; let m = c.pts.length - 2; while (m > 0 && Math.hypot(D.X(c.pts[m][0]) - D.X(e[0]), D.Y(c.pts[m][1]) - D.Y(e[1])) < 16) m--;
            const p = c.pts[m]; D.arrow(p[0], p[1], e[0], e[1], { color: col, width: out ? 2.4 : last ? 2.6 : 1.2, head: out || last ? 10 : 7, alpha: al });
          }
          for (const [k, N] of Object.entries(RC_NODES)) {
            const on = k === cur, X = D.X(N.x), Y = D.Y(N.y);
            D.ctx.save(); D.ctx.beginPath(); D.ctx.roundRect(X - N.w / 2, Y - 14, N.w, 28, 8);
            D.ctx.fillStyle = v.color(N.color, on ? 0.9 : 0.16); D.ctx.fill(); D.ctx.lineWidth = on ? 2.5 : 1.3; D.ctx.strokeStyle = v.color(N.color); D.ctx.stroke(); D.ctx.restore();
            D.textPx(N.label, X, Y, { align: 'center', size: 13, weight: 600, color: on ? 'panel' : 'ink', halo: false });
          }
          for (const c of curves) if (c.P.from === cur) {
            const X = D.X(c.mid[0]), Y = D.Y(c.mid[1]); D.ctx.font = '600 11.5px Inter, system-ui, sans-serif';
            const w = D.ctx.measureText(c.P.label).width + 14;
            D.ctx.save(); D.ctx.beginPath(); D.ctx.roundRect(X - w / 2, Y - 10, w, 20, 10); D.ctx.fillStyle = v.color('panel', 0.95); D.ctx.fill(); D.ctx.strokeStyle = v.color('accent'); D.ctx.lineWidth = 1.3; D.ctx.stroke(); D.ctx.restore();
            D.textPx(c.P.label, X, Y, { align: 'center', size: 11.5, weight: 600, color: 'accent', halo: false });
          }
          D.corner('click a bright arrow', 'br', { size: 11, color: 'faint' });
          // texture of the sample
          const R2 = 0.95 * 0.95, grain = v.color('gold');
          const cols = {
            q: rgbMix(v, 'gray', 'panel', 0.55), kf: rgbMix(v, 'pink', 'panel', 0.45), pl: rgbMix(v, 'ink', 'panel', 0.82), bi: rgbMix(v, 'ink', 'panel', 0.2),
            g: rgbMix(v, 'gold', 'panel', 0.15), edge: rgbMix(v, 'ink', 'panel', 0.35), dark: rgbMix(v, 'teal', 'ink', 0.45), light: rgbMix(v, 'gold', 'panel', 0.7), cem: rgbMix(v, 'orange', 'panel', 0.72),
          };
          const mineral = (id, set) => { const h = hash(id[0], id[1], 9); return set[Math.min(set.length - 1, Math.floor(h * set.length))]; };
          if (S.tex === 'coarse' || S.tex === 'fine' || S.tex === 'foliated') {
            const g = S.tex === 'coarse' ? [0.3, 0.3] : S.tex === 'fine' ? [0.075, 0.075] : [0.46, 0.13];
            T.raster((x, y) => {
              if (x * x + y * y > R2) return null;
              const V = voronoi(x, y, g[0], g[1], S.tex === 'fine' ? 5 : 2);
              if (V.edge < (S.tex === 'fine' ? 0.12 : 0.07)) return cols.edge;
              if (V.id[0] === 0 && V.id[1] === 0) return cols.g;
              if (S.tex === 'foliated') { const band = Math.floor((y + 0.06 * Math.sin(3 * x) + 2) / 0.3) % 2; return band ? mineral(V.id, [cols.bi, cols.dark, cols.bi, cols.q]) : mineral(V.id, [cols.q, cols.kf, cols.pl, cols.q]); }
              if (S.tex === 'fine') return mineral(V.id, [cols.bi, cols.dark, cols.pl, cols.bi]);
              return mineral(V.id, [cols.q, cols.q, cols.kf, cols.kf, cols.kf, cols.pl, cols.pl, cols.bi]);
            }, { res: 2, key: S.tex, id: 'tex' });
            if (S.tex === 'fine') { T.poly([[-0.17, -0.1], [0, -0.2], [0.17, -0.1], [0.17, 0.1], [0, 0.2], [-0.17, 0.1]], { fill: 'gold', fillAlpha: 0.85, color: 'gold', width: 1.5 }); }
          } else if (S.tex === 'loose' || S.tex === 'cemented') {
            if (S.tex === 'cemented') { T.circle(0, 0, 0.95, { fill: cols.cem, fillAlpha: 1, stroke: false }); for (let y = -0.8; y < 0.9; y += 0.32) T.line(-Math.sqrt(Math.max(0, R2 - y * y)), y, Math.sqrt(Math.max(0, R2 - y * y)), y, { color: 'orange', width: 1, alpha: 0.5 }); }
            const g = S.tex === 'cemented' ? 0.19 : 0.22;
            for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) {
              const x = (i + 0.5 * (j % 2)) * g + (hash(i, j, 4) - 0.5) * g * 0.3, y = j * g * 0.88 + (hash(j, i, 4) - 0.5) * g * 0.3;
              const r = g * (S.tex === 'cemented' ? 0.42 : 0.36) * (0.78 + 0.32 * hash(i, j, 6));
              if (x * x + y * y > (0.95 - r) ** 2) continue;
              const centre = Math.abs(x) < g * 0.5 && Math.abs(y) < g * 0.5;
              const c = centre ? 'gold' : ['gray', 'pink', 'gray', 'muted', 'gray'][Math.floor(hash(i, j, 8) * 5)];
              T.circle(x, y, r * (S.tex === 'cemented' ? 1 : 1), { fill: c, fillAlpha: centre ? 0.85 : 0.45, color: centre ? 'gold' : 'muted', width: centre ? 2 : 0.8 });
            }
          } else {
            T.raster((x, y) => { const r2 = x * x + y * y; if (r2 > R2) return null; const t = 0.5 + 0.5 * Math.sin(5 * x + 3 * Math.sin(4 * y)) * Math.cos(4 * y - 2 * x); return rgbMix(v, 'red', 'gold', 0.15 + 0.55 * t); }, { res: 3, key: 'melt', id: 'melt' });
            for (let k = 0; k < 6; k++) { const a = k * 1.1 + 0.3, r = 0.55 * hash(k, 2, 1) + 0.2, x = r * Math.cos(a), y = r * Math.sin(a); T.poly([[x - 0.07, y - 0.035], [x + 0.07, y - 0.035], [x + 0.09, y + 0.035], [x - 0.05, y + 0.035]], { fill: 'panel', fillAlpha: 0.6, color: 'ink', width: 1 }); }
            T.circle(0, 0, 0.13, { color: 'gold', width: 2, dash: [4, 3] });
            T.text('quartz grain melted', 0, -0.25, { align: 'center', size: 11.5, color: 'ink', weight: 600 });
          }
          T.circle(0, 0, 0.95, { color: 'muted', width: 1.5 });
          T.corner(S.rock, 'tl', { size: 12.5, weight: 700, color: RC_NODES[cur].color });
          T.corner(`at about ${S.depth === 0 ? 'the surface' : `${S.depth} km depth`}`, 'bl', { size: 11.5, color: 'muted' });
          void grain;
          // time strip
          let depth = 25, sumLo = 0, sumHi = 0; const rows = [];
          for (const id of hist) { const P = RC_PROC.find((p) => p.id === id); const [lo, hi] = durOf(P, depth); rows.push({ P, lo, hi, depth }); sumLo += lo; sumHi += hi; depth = P.depth; }
          const show = rows.slice(-6);
          show.forEach((r, i) => {
            const y = 6.6 - i * 1.0, col = RC_NODES[r.P.to].color;
            if (r.hi / r.lo > 1.01) H.rect(r.lo, y - 0.32, r.hi, y + 0.32, { fill: col, fillAlpha: 0.45, color: col, width: 1.2, radius: 3 }); else H.dot(r.lo, y, { r: 5, color: col });
            const why = r.P.t === 'erode' ? `erode ${v.fix(Math.max(r.depth, 0.05), r.depth < 1 ? 2 : 0)} km at ${v.fix(den.value, 3)} mm/yr` : r.P.why;
            const right = H.X(r.hi) < H.width * 0.58; H.text(`${r.P.label}: ${why}`, right ? r.hi : r.lo, y, { dx: right ? 8 : -8, align: right ? 'left' : 'right', size: 11, color: 'ink' });
          });
          if (rows.length) {
            const y = 6.6 - show.length * 1.0, right = H.X(sumHi) < H.width * 0.58;
            H.rect(sumLo, y - 0.32, sumHi * 1.0001, y + 0.32, { fill: 'ink', fillAlpha: 0.12, stroke: false, hatch: 'ink', hatchAlpha: 0.3 }); // hatch without a stroke (see report)
            H.rect(sumLo, y - 0.32, sumHi * 1.0001, y + 0.32, { color: 'ink', width: 1.5 });
            H.text(`total: ${fmtYr(sumLo)} – ${fmtYr(sumHi)}`, right ? sumHi : sumLo, y, { dx: right ? 8 : -8, align: right ? 'left' : 'right', size: 11.5, weight: 700 });
          }
          else H.text('no steps yet: click an arrow leaving “magma”', 1, 3.6, { size: 12, color: 'muted' });
          st = { S, rows, sumLo, sumHi };
        });
        v.readout(() => {
          if (!st) return '';
          const { S, rows, sumLo, sumHi } = st;
          const path = ['magma', ...rows.map((r) => r.P.rock)].join(' → ');
          const melted = rows.some((r) => r.P.tex === 'melt');
          return `now: **${RC_NODES[S.node].label}** (${S.rock}) · path: ${path} · elapsed ${rows.length ? `**${fmtYr(sumLo)} – ${fmtYr(sumHi)}**` : '0'} · the quartz grain ${melted ? (S.tex === 'melt' ? 'has just melted: its atoms are in the magma' : 'melted on the way; a new grain crystallized from the same atoms') : 'has survived every step'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3',
      kind: 'Phenomenon',
      name: 'Bowen’s reaction series and fractional crystallization',
      statement: String.raw`A basaltic magma cooling slowly crystallizes its minerals in a regular order, **Bowen's reaction series**. Along the *discontinuous* branch, olivine is followed by pyroxene, then amphibole, then biotite: each mineral, if left in contact with the melt, reacts with it to form the next. Along the *continuous* branch, plagioclase feldspar crystallizes throughout, its composition shifting smoothly from calcium-rich (anorthite) to sodium-rich (albite). Last come K-feldspar, muscovite and quartz. Minerals early in the series are rich in Mg, Fe and Ca and poor in silica, and are less polymerized (isolated tetrahedra, chains); late ones are silica-rich frameworks and sheets.

If the early crystals are removed from the melt (they settle, or the melt is squeezed away), the reactions cannot run and the remaining liquid becomes ever richer in SiO₂, Na and K: **fractional crystallization** lets one basaltic parent produce andesitic, dacitic and rhyolitic liquids and silica minerals that equilibrium crystallization of the same melt would never form.`,
      scope: String.raw`An idealized order for slowly cooled basaltic magmas at crustal pressures; amphibole and biotite need water, the temperatures depend on composition and pressure, and real magmas also change by assimilating wall rock and mixing. The binary systems shown are Bowen's own experimental systems at one atmosphere, dry.`,
      idea: String.raw`The series is phase equilibrium (pchem-6.8). In the system Mg₂SiO₄–SiO₂, enstatite melts **incongruently** (pchem-6.9): at 1557 °C a liquid slightly richer in silica than pyroxene coexists with olivine and pyroxene, so cooling olivine-bearing melt must make olivine react with the liquid to form pyroxene, the discontinuous reaction. Remove the olivine as it forms and the liquid sails past that peritectic, crystallizes pyroxene, and its last drop reaches the eutectic with silica at 64.5 wt% SiO₂. Plagioclase is a complete solid solution: crystal and liquid differ in composition at every temperature (the lever rule, pchem-6.3), and a crystal that is not kept in equilibrium grows zoned, its calcic core shielded from the melt while the liquid moves toward albite.`,
      caption: String.raw`Pick a system, set the starting melt, and drag **cooling**. The phase diagram marks the liquid (red) and the crystals (blue) with the tie line, and traces the path of the liquid; switch **fractional** on to remove crystals as they form. The middle panel shows the chamber: in equilibrium olivine grows pyroxene reaction rims and plagioclase stays homogeneous; with fractional crystallization the crystals pile up in layers on the floor and plagioclase is zoned. The bottom row is Bowen's series, lit as far as the experiment has gone, with each mineral's silicate structure (geol-1.1). Boundaries: Bowen & Andersen (1914) for Mg₂SiO₄–SiO₂, the forsterite liquidus an ideal-solution curve through their melting point and peritectic; plagioclase an ideal-solution loop with measured melting points and heats of fusion.`,
      deps: ['pchem-6.8', 'geol-1.1', 'pchem-6.3', 'pchem-6.9'],
      see: ['mat-6.1'],
      refs: ['Press–Siever'],
      tags: ['igneous petrology', 'phase diagrams'],
      credit: 'Norman L. Bowen, 1922 (series); 1913–1914 (experiments)',
      viz(v) {
        const applyMode = () => { if (sys.value === 'fo') { P.setView([40, 72], [1460, 1935]); P.setLabels('wt% SiO₂', 'T (°C)'); } else { P.setView([0, 100], [1080, 1600]); P.setLabels('mol % anorthite (An) in the plagioclase', 'T (°C)'); } };
        const sys = v.select('system', [{ value: 'fo', label: 'olivine–silica (discontinuous)' }, { value: 'pl', label: 'plagioclase (continuous)' }], 'fo', { onChange: () => applyMode() });
        const w0s = v.slider('melt: wt% SiO₂', 45, 59, 50, { step: 0.5 });
        const x0s = v.slider('melt: % anorthite', 20, 95, 60, { step: 1 });
        const cool = v.slider('cooling', 0, 1, 0.68, { step: 0.002 });
        const frac = v.toggle('fractional (remove crystals)', false);
        const P = v.stage({ x: [40, 72], y: [1460, 1935], axes: 'box', height: 380, weight: 1.25, xlabel: 'wt% SiO₂', ylabel: 'T (°C)' });
        const C = v.stage({ x: [-1, 1], y: [-1.05, 1.05], axes: false, height: 380, weight: 0.65, minWidth: 220 });
        const B = v.stage({ x: [0, 10], y: [0, 4.1], axes: false, height: 200, full: true });
        let ray = null, rayKey = '';
        /** State of the system after cooling progress c. */
        function stateFo(w0, c, fr) {
          const TL = TliqFo(w0), out = { phases: {}, path: [] };
          const seg = fr ? [0.08, 0.5, 0.18, 0.12, 0.12] : [0.08, 0.5, 0.22, 0.2, 0];
          let u = c, T, wL = w0, F = 1, Fo = 0, En = 0, Cr = 0, stage = 0, rx = 0;
          const FP = (w0 - FO.wFo) / (FO.wP - FO.wFo), FE = FP * (FO.wP - FO.wEn) / (FO.wE - FO.wEn);
          if (u < seg[0]) { T = TL + 40 * (1 - u / seg[0]); stage = 0; }
          else if ((u -= seg[0]) < seg[1]) { T = TL - (TL - FO.TP) * (u / seg[1]); wL = wliqFo(T); F = (w0 - FO.wFo) / (wL - FO.wFo); Fo = 1 - F; stage = 1; }
          else if ((u -= seg[1]) < seg[2]) {
            const r = u / seg[2];
            if (!fr) { const lam = (FO.wEn - FO.wFo) / (FO.wP - FO.wFo), Lc = FP * r; F = FP - Lc; En = Lc / lam; Fo = 1 - F - En; wL = FO.wP; T = FO.TP; rx = r; stage = 2; }
            else { wL = FO.wP + (FO.wE - FO.wP) * r; T = TliqEn(wL); F = FP * (FO.wP - FO.wEn) / (wL - FO.wEn); Fo = 1 - FP; En = FP - F; stage = 2; }
          } else if ((u -= seg[2]) < seg[3]) {
            const r = u / seg[3];
            if (!fr) { T = FO.TP - 57 * r; F = 0; En = (w0 - FO.wFo) / (FO.wEn - FO.wFo); Fo = 1 - En; wL = null; rx = 1; stage = 3; }
            else { T = FO.TE; wL = FO.wE; F = FE * (1 - r); const crys = FE - F, crf = (FO.wE - FO.wEn) / (100 - FO.wEn); Fo = 1 - FP; En = FP - FE + crys * (1 - crf); Cr = crys * crf; stage = 3; }
          } else { u -= seg[3]; const r = seg[4] ? u / seg[4] : 1; T = FO.TE - 43 * r; F = 0; wL = null; Fo = 1 - FP; const crf = (FO.wE - FO.wEn) / (100 - FO.wEn); En = FP - FE + FE * (1 - crf); Cr = FE * crf; stage = 4; }
          return { T, wL, F, Fo, En, Cr, stage, rx, TL, FP, FE };
        }
        function statePl(x0, c, fr) {
          const TL = plagTliq(x0), TS = plagTsol(x0);
          if (fr) {
            if (rayKey !== String(x0)) { ray = plagRayleigh(x0); rayKey = String(x0); }
            const T0 = TL + 25, T1 = 1120; const T = T0 - (T0 - T1) * c;
            if (T >= TL) return { T, xl: x0, xs: null, F: 1, TL, TS, zones: [] };
            let i = 0; while (i < ray.length - 1 && ray[i + 1].T > T) i++;
            const r = ray[i]; return { T, xl: r.xl, xs: r.xs, F: r.F, TL, TS, zones: ray.slice(0, i + 1) };
          }
          const T0 = TL + 25, T1 = TS - 25, T = T0 - (T0 - T1) * c;
          if (T >= TL) return { T, xl: x0, xs: null, F: 1, TL, TS };
          if (T <= TS) return { T, xl: null, xs: x0, F: 0, TL, TS };
          const { xl, xs } = plag(T); return { T, xl, xs, F: (xs - x0) / (xs - xl), TL, TS };
        }
        let st = null;
        v.render(() => {
          const isFo = sys.value === 'fo', fr = frac.value;
          w0s.el.hidden = !isFo; x0s.el.hidden = isFo;
          if (isFo) {
            const w0 = w0s.value, S = stateFo(w0, cool.value, fr);
            // fields
            const liq = []; for (let w = FO.wFo; w <= FO.wP + 1e-9; w += 0.25) liq.push([w, TliqFo(w)]);
            P.poly([[FO.wFo, 1935], ...liq, [FO.wE, FO.TE], [72, 1640], [72, 1935]], { fill: 'red', fillAlpha: 0.06, stroke: false });
            P.path(liq, { color: 'ink', width: 2 });
            P.line(FO.wP, FO.TP, FO.wE, FO.TE, { color: 'ink', width: 2 });
            P.line(FO.wE, FO.TE, 72, 1640, { color: 'ink', width: 1.6, dash: [6, 4] });
            P.line(FO.wFo, FO.TP, FO.wP, FO.TP, { color: 'ink', width: 1.4 });
            P.line(FO.wEn, FO.TE, 72, FO.TE, { color: 'ink', width: 1.4 });
            P.line(FO.wEn, 1500, FO.wEn, FO.TP, { color: 'ink', width: 1.4 });
            P.line(FO.wFo, 1460, FO.wFo, FO.TFo, { color: 'ink', width: 1.4 });
            P.text('liquid', 62, 1830, { size: 13, color: 'red', weight: 600 });
            P.text('olivine (Fo) + liquid', 47.5, 1660, { size: 12, color: 'muted' });
            P.text('Fo + En', 47, 1500, { size: 12, color: 'muted' });
            P.text('En + silica', 61, 1500, { size: 12, color: 'muted' });
            P.text('silica +', 71.6, 1598, { size: 11, color: 'muted', align: 'right' }); P.text('liquid', 71.6, 1582, { size: 11, color: 'muted', align: 'right' });
            P.text('En', FO.wEn, 1935, { dx: 4, dy: 9, size: 11.5, color: 'muted' });
            P.dot(FO.wP, FO.TP, { r: 3.5, color: 'ink' }); P.text('peritectic 1557 °C', FO.wP, FO.TP, { dx: -26, dy: 13, size: 11, color: 'ink', align: 'right' });
            P.dot(FO.wE, FO.TE, { r: 3.5, color: 'ink' }); P.text('eutectic 1543 °C', FO.wE, FO.TE, { dx: 4, dy: 12, size: 11, color: 'ink' });
            P.text('Fo melts at 1890 °C', FO.wFo, FO.TFo, { dx: 6, dy: 4, size: 11, color: 'ink' });
            // bulk and path
            P.line(w0, 1460, w0, 1935, { color: 'muted', width: 1, dash: [3, 4] });
            const pth = [[w0, S.TL + 40], [w0, S.TL]];
            for (let T = S.TL; T > Math.max(S.T, FO.TP); T -= 4) pth.push([wliqFo(T), T]);
            if (S.stage >= 2 && fr) { pth.push([FO.wP, FO.TP]); if (S.wL) pth.push([S.wL, TliqEn(S.wL)]); }
            if (S.stage >= 1) pth.push(S.wL ? [S.wL, S.stage === 1 ? S.T : TliqEn(S.wL)] : [fr ? FO.wE : FO.wP, fr ? FO.TE : FO.TP]);
            P.path(pth.filter((p) => p[1] <= S.TL + 40.1 && p[1] >= S.T - 0.01), { color: 'red', width: 3, alpha: 0.65 });
            const yT = S.T;
            if (S.wL != null) {
              const xs = S.stage === 1 ? FO.wFo : FO.wEn;
              if (S.stage >= 1) { P.line(xs, yT, S.wL, yT, { color: 'blue', width: 1.8 }); P.dot(xs, yT, { r: 6, color: 'blue' }); }
              P.dot(S.wL, yT, { r: 6.5, color: 'red' });
            } else { P.hline(yT, { color: 'blue', width: 1.2, dash: [4, 3] }); }
            P.corner(`${v.fix(S.T, 0)} °C`, 'tr', { size: 14, weight: 700, color: 'ink' });
            // chamber
            C.rect(-0.85, -0.95, 0.85, 0.9, { fill: 'panel', fillAlpha: 1, color: 'muted', width: 1.6, radius: 10 });
            if (fr) {
              const parts = [['green', S.Fo], ['orange', S.En], ['gray', S.Cr]]; let y = -0.95; const scale = 1.85;
              for (const [c, f] of parts) { if (f <= 1e-4) continue; const h = f * scale; C.rect(-0.85, y, 0.85, y + h, { fill: c, fillAlpha: 0.55, color: c, width: 1 }); y += h; }
              if (S.F > 0) C.rect(-0.85, y, 0.85, 0.9, { fill: 'red', fillAlpha: 0.18, stroke: false });
              if (S.Fo > 0.02) C.text('olivine cumulate', 0, -0.95 + (S.Fo * 1.85) / 2, { align: 'center', size: 11.5, weight: 600 });
              if (S.En > 0.04) C.text('pyroxene', 0, -0.95 + (S.Fo + S.En / 2) * 1.85, { align: 'center', size: 11.5, weight: 600 });
              if (S.Cr > 0.001) C.text(`+ silica (${v.fix(100 * S.Cr, 1)}%)`, 0, -0.95 + (S.Fo + S.En + S.Cr) * 1.85, { dy: -9, align: 'center', size: 11, weight: 700, color: 'ink' });
            } else {
              C.rect(-0.85, -0.95, 0.85, 0.9, { fill: 'red', fillAlpha: 0.18 * S.F + 0.02, stroke: false, radius: 10 });
              for (let i = 0; i < 20; i++) {
                const gx = i % 4, gy = Math.floor(i / 4), x = -0.6 + gx * 0.4 + (hash(i, 1, 3) - 0.5) * 0.12, y = -0.74 + gy * 0.37 + (hash(i, 2, 3) - 0.5) * 0.1;
                const solid = S.Fo + S.En, rr = 0.025 + 0.13 * Math.sqrt(solid);
                if (solid < 0.005) break;
                const enRim = S.En / Math.max(solid, 1e-9);
                if (S.rx > 0 || S.stage >= 3) { C.circle(x, y, rr, { fill: 'orange', fillAlpha: 0.8, color: 'orange', width: 1.2 }); C.circle(x, y, rr * Math.sqrt(Math.max(0, 1 - enRim)), { fill: 'green', fillAlpha: 0.85, color: 'green', width: 1 }); }
                else C.circle(x, y, rr, { fill: 'green', fillAlpha: 0.7, color: 'green', width: 1 });
              }
            }
            C.corner(fr ? 'crystals settle out' : 'crystals stay in the melt', 'tl', { size: 11.5, weight: 600, color: 'muted' });
            st = { isFo, S, w0, fr };
          } else {
            const x0 = x0s.value / 100, S = statePl(x0, cool.value, fr);
            const Ls = [], Ss = []; for (let T = 1118.2; T < 1553; T += 3) { const p = plag(T); Ls.push([100 * p.xl, T]); Ss.push([100 * p.xs, T]); }
            Ls.push([100, 1553]); Ss.push([100, 1553]); Ls.unshift([0, 1118]); Ss.unshift([0, 1118]);
            P.poly([[0, 1600], ...Ls, [100, 1600]], { fill: 'red', fillAlpha: 0.06, stroke: false });
            P.poly([...Ls, ...Ss.slice().reverse()], { fill: 'muted', fillAlpha: 0.1, stroke: false });
            P.path(Ls, { color: 'ink', width: 2 }); P.path(Ss, { color: 'ink', width: 2, dash: [7, 4] });
            P.text('liquid', 20, 1500, { size: 13, color: 'red', weight: 600 });
            P.text('crystals + liquid', 52, 1370, { size: 12, color: 'muted', align: 'center' });
            P.text('plagioclase crystals', 68, 1180, { size: 12, color: 'muted', align: 'center' });
            P.text('liquidus', 82, plagTliq(0.82), { dx: -6, dy: -10, size: 11, color: 'ink', align: 'right' }); P.text('solidus', 30, plagTsol(0.3), { dx: 6, dy: 12, size: 11, color: 'ink' });
            P.text('albite 1118 °C', 0, 1118, { dx: 8, dy: -10, size: 11 }); P.text('anorthite 1553 °C', 100, 1553, { dx: -10, dy: 6, size: 11, align: 'right' });
            P.line(100 * x0, 1080, 100 * x0, 1600, { color: 'muted', width: 1, dash: [3, 4] });
            if (fr && S.zones?.length) { P.path(S.zones.map((r) => [100 * r.xl, r.T]), { color: 'red', width: 3, alpha: 0.65 }); P.path(S.zones.map((r) => [100 * r.xs, r.T]), { color: 'blue', width: 3, alpha: 0.45 }); }
            if (S.xl != null && S.xs != null) { P.line(100 * S.xl, S.T, 100 * S.xs, S.T, { color: 'blue', width: 1.8 }); P.dot(100 * S.xs, S.T, { r: 6, color: 'blue' }); P.dot(100 * S.xl, S.T, { r: 6.5, color: 'red' }); }
            else if (S.xl != null) P.dot(100 * S.xl, S.T, { r: 6.5, color: 'red' }); else P.dot(100 * S.xs, S.T, { r: 6, color: 'blue' });
            P.corner(`${v.fix(S.T, 0)} °C`, 'tr', { size: 14, weight: 700, color: 'ink' });
            // chamber with plagioclase laths
            C.rect(-0.85, -0.95, 0.85, 0.9, { fill: 'red', fillAlpha: 0.04 + 0.16 * S.F, color: 'muted', width: 1.6, radius: 10 });
            const solid = 1 - S.F, anCol = (x) => v.mix('teal', 'blue', clamp(x, 0, 1));
            if (solid > 0.003) for (let i = 0; i < 16; i++) {
              const x = -0.57 + (i % 4) * 0.38 + (hash(i, 5, 2) - 0.5) * 0.1, y = -0.66 + Math.floor(i / 4) * 0.42 + (hash(i, 6, 2) - 0.5) * 0.1, a = hash(i, 7, 2) * Math.PI, ca = Math.cos(a), sa = Math.sin(a);
              const lath = (f) => { const hw = 0.17 * Math.sqrt(f) + 0.004, hh = 0.06 * Math.sqrt(f) + 0.002; return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([u, w]) => [x + u * ca - w * sa, y + u * sa + w * ca]); };
              if (fr && S.zones.length) {
                const Z = S.zones, n = 6;
                for (let j = n; j >= 1; j--) { const idx = Math.floor((Z.length - 1) * (j / n)), f = (1 - Z[idx].F); if (f <= 0) continue; C.poly(lath(f), { fill: anCol(Z[idx].xs), fillAlpha: 0.85, color: 'ink', width: 0.6 }); }
              } else C.poly(lath(solid), { fill: anCol(S.xs ?? x0), fillAlpha: 0.85, color: 'ink', width: 0.6 });
            }
            C.corner(fr ? 'zoned crystals' : 'crystals re-equilibrate', 'tl', { size: 11.5, weight: 600, color: 'muted' });
            st = { isFo, S, x0, fr };
          }
          // Bowen's series
          const reached = new Set(); let plagRange = null;
          if (st.isFo) { const S = st.S; if (S.stage >= 1) reached.add('ol'); if (S.En > 0.001) reached.add('px'); if (S.Cr > 0) reached.add('qz'); }
          else { const S = st.S; if (S.xs != null) { const zs = st.fr && S.zones?.length ? S.zones.map((z) => z.xs) : [S.xs]; plagRange = [Math.min(...zs), Math.max(...zs), S.xs]; } }
          B.text('hot, early', 0.3, 3.85, { size: 11.5, color: 'red', weight: 600 }); B.text('cool, late', 9.7, 3.85, { size: 11.5, color: 'blue', weight: 600, align: 'right' });
          B.arrow(1.4, 3.85, 8.6, 3.85, { color: 'faint', width: 1.4, head: 8 });
          const pill = (x, y, name, sub, on, dim) => {
            const X = B.X(x), Y = B.Y(y); B.ctx.font = '600 12.5px Inter, system-ui, sans-serif'; const w = Math.max(B.ctx.measureText(name).width, 70) + 18;
            B.ctx.save(); B.ctx.beginPath(); B.ctx.roundRect(X - w / 2, Y - 17, w, 34, 8); B.ctx.fillStyle = v.color(on ? 'green' : 'panel', on ? 0.85 : 1); B.ctx.fill(); B.ctx.strokeStyle = v.color(on ? 'green' : 'faint'); B.ctx.lineWidth = on ? 2 : 1; B.ctx.stroke(); B.ctx.restore();
            B.textPx(name, X, Y - 6, { align: 'center', size: 12.5, weight: 600, color: on ? 'panel' : dim ? 'faint' : 'ink', halo: false });
            B.textPx(sub, X, Y + 8, { align: 'center', size: 10.5, color: on ? 'panel' : 'faint', halo: false });
          };
          const fo = st.isFo, dimD = !fo, dimC = fo;
          pill(1.1, 2.75, 'olivine', 'isolated', reached.has('ol'), dimD); pill(2.95, 2.75, 'pyroxene', 'single chains', reached.has('px'), dimD);
          pill(4.8, 2.75, 'amphibole', 'double chains', false, true); pill(6.6, 2.75, 'biotite', 'sheets', false, true);
          for (const [a, b] of [[1.75, 2.25], [3.75, 4.1], [5.5, 5.95]]) B.arrow(a, 2.75, b, 2.75, { color: 'muted', width: 1.4, head: 7 });
          if (fo && st.S.rx > 0 && st.S.rx < 1) B.text('olivine + melt → pyroxene', 2.05, 3.3, { size: 11, weight: 700, color: 'green', align: 'center' });
          // continuous branch
          const bx0 = 0.5, bx1 = 7.2, by = 1.0;
          for (let i = 0; i < 60; i++) { const t = i / 60; B.rect(bx0 + (bx1 - bx0) * t, by - 0.24, bx0 + (bx1 - bx0) * (t + 1 / 60) + 0.01, by + 0.24, { fill: anCol2(v, 1 - t), fillAlpha: dimC ? 0.25 : 0.75, stroke: false }); }
          B.rect(bx0, by - 0.24, bx1, by + 0.24, { color: 'faint', width: 1, radius: 4 });
          B.text('Ca-rich plagioclase', bx0, by + 0.45, { size: 11.5, color: dimC ? 'faint' : 'ink' }); B.text('Na-rich plagioclase', bx1, by + 0.45, { size: 11.5, color: dimC ? 'faint' : 'ink', align: 'right' });
          B.text('plagioclase feldspar: framework, continuous solid solution', (bx0 + bx1) / 2, by - 0.48, { size: 10.5, color: 'faint', align: 'center' });
          if (plagRange) {
            const X = (x) => bx0 + (bx1 - bx0) * (1 - x);
            if (plagRange[1] - plagRange[0] > 0.005) B.rect(X(plagRange[1]), by - 0.3, X(plagRange[0]), by + 0.3, { color: 'ink', width: 2, radius: 3 });
            B.line(X(plagRange[2]), by - 0.36, X(plagRange[2]), by + 0.36, { color: 'ink', width: 3 });
          }
          pill(8.6, 2.75, 'K-feldspar', 'framework', false, true); pill(8.6, 1.85, 'muscovite', 'sheets', false, true); pill(8.6, 0.95, 'quartz', 'framework', reached.has('qz'), dimD && !reached.has('qz'));
          B.arrow(7.35, 2.75, 7.75, 2.75, { color: 'muted', width: 1.4, head: 7 }); B.arrow(7.3, 1.0, 7.75, 2.5, { color: 'muted', width: 1.4, head: 7 });
          if (fo) B.text('amphibole and micas need water and potassium: not in this dry binary', 4.4, 2.12, { size: 10.5, color: 'faint', align: 'center' });
        });
        function anCol2(v, x) { return v.mix('teal', 'blue', clamp(x, 0, 1)); }
        v.legend([['red', 'liquid', { dot: true }], ['blue', 'crystals in equilibrium', { dot: true }], ['green', 'olivine'], ['orange', 'pyroxene'], ['gray', 'silica (cristobalite)']]);
        v.readout(() => {
          if (!st) return '';
          if (st.isFo) {
            const S = st.S, pc = (x) => `${v.fix(100 * x, 1)}%`;
            const head = S.F > 0 ? `liquid ${pc(S.F)} at **${v.fix(S.wL, 1)} wt% SiO₂**` : 'all solid';
            const minerals = `olivine ${pc(S.Fo)}, pyroxene ${pc(S.En)}${S.Cr > 0 ? `, **silica ${pc(S.Cr)}**` : ''}`;
            const finalEq = (st.w0 - FO.wFo) / (FO.wEn - FO.wFo), crf = (FO.wE - FO.wEn) / (100 - FO.wEn);
            const tail = st.fr ? `fractional: the liquid passes the peritectic, its last ${pc(S.FE)} reaches the eutectic (64.5 wt% SiO₂) and crystallizes ${pc(S.FE * crf)} free silica, a mineral equilibrium cooling never makes`
              : `equilibrium: at 1557 °C olivine reacts with the melt to make pyroxene; final rock ${pc(1 - finalEq)} olivine + ${pc(finalEq)} pyroxene, no free silica`;
            return `${v.fix(S.T, 0)} °C · ${head} · ${minerals} · ${tail}`;
          }
          const S = st.S, si = S.xl != null ? plagSiO2(S.xl) : null;
          const zon = st.fr && S.zones?.length > 1 ? ` · zoned crystals: cores An${v.fix(100 * S.zones[0].xs, 0)}, rims An${v.fix(100 * S.xs, 0)}` : '';
          return `${v.fix(S.T, 0)} °C · ${S.xl != null ? `liquid ${v.fix(100 * S.F, 1)}%, An${v.fix(100 * S.xl, 0)} (**${v.fix(si, 1)} wt% SiO₂**)` : 'all solid'}${S.xs != null ? ` · crystals forming now: An${v.fix(100 * S.xs, 0)}` : ''}${zon} · ${st.fr ? 'fractional: the last liquid approaches pure albite (68.7 wt% SiO₂)' : `equilibrium: crystallization ends at ${v.fix(S.TS, 0)} °C with every crystal An${v.fix(100 * st.x0, 0)}, the starting composition`}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4',
      kind: 'Principle',
      name: 'Steno’s principles of stratigraphy',
      statement: String.raw`Four rules order the rocks of an outcrop in time without any clock:

(a) **Superposition**: in an undisturbed sequence of sedimentary layers, each layer is younger than the one beneath it and older than the one above.

(b) **Original horizontality**: sediments settle in layers that are horizontal or nearly so; strata now tilted or folded were deformed after they were deposited.

(c) **Lateral continuity**: a layer extends sideways until it thins out or meets the edge of its basin; the same layer on two sides of a valley was once continuous.

(d) **Cross-cutting relationships**: a rock body or structure (dike, fault, erosion surface) that cuts across others is younger than the rocks it cuts.

Rock bodies in contact can be ordered directly; the order of bodies that never touch follows only through chains of contacts, and may remain undetermined.`,
      scope: String.raw`Superposition needs the sequence to be right way up; strata overturned in tight folds, thrust sheets of older rock pushed over younger, and intrusions or cave fills that are younger than the rock above them must be recognized first (by way-up criteria such as graded beds, cross-bedding and mud cracks).`,
      idea: String.raw`Sediment falls out of water under gravity onto whatever lies beneath, so it lies on older material and spreads in flat sheets. Anything that cuts through a rock needs that rock to exist first. Each contact between two bodies therefore says which is older; following chains of contacts gives a **partial order** on the units, which is all an outcrop can tell (later principles, faunal succession geol-1.5 and radiometric dating, connect sections that never touch). Steno stated (a)–(c) in 1669, having realized that the "tongue stones" found in rocks were fossil shark teeth buried in once-soft sediment.`,
      caption: String.raw`Build a history with the buttons: **deposit** a layer (choose its rock), **tilt** by the angle on the slider, **intrude a dike**, **fault**, **erode**, **undo**. The section is computed by running the history backwards from each point, so the bedding pattern tilts and slips with the rock. The graph below is what the outcrop proves: arrows point from older to younger, blue for superposition (one body lies on another), red for cross-cutting; units not joined by a chain of arrows cannot be ordered. Turn on **quiz** to hide the history: click the units from oldest to youngest and the checker tells you which contact you overlooked.`,
      deps: [],
      see: ['geol-1.6', 'geol-1.5'],
      refs: ['Press–Siever'],
      tags: ['stratigraphy', 'relative dating'],
      credit: 'Nicolas Steno, 1669',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Law_of_superposition' },
      viz(v) {
        let hist = ST_DEFAULT(), placed = [], msg = '', msgCol = 'muted', nDike = 0, nFault = 0, nErode = 0;
        const lith = v.select('next layer', [{ value: 'sand', label: 'sandstone' }, { value: 'shale', label: 'shale' }, { value: 'lime', label: 'limestone' }, { value: 'cong', label: 'conglomerate' }], 'sand');
        const tiltS = v.slider('tilt angle (°)', -40, 40, 15, { step: 1 });
        const quiz = v.toggle('quiz: order the units yourself', false, { onChange: () => { placed = []; msg = ''; } });
        const S = v.stage({ x: [0, ST_W], y: [0, ST_H], axes: false, aspect: ST_H / ST_W, full: true, equal: true });
        const G2 = v.stage({ x: [0, 10], y: [0, 4], axes: false, height: 170, full: true, title: 'what the outcrop proves: older → younger' });
        const G = v.graph(G2, { nodes: [], edges: [], directed: true, layout: 'none', draggable: false, r: 12, fontSize: 12 });
        const surf = () => { let lo = Infinity, hi = -Infinity; for (let x = 0.2; x < ST_W; x += 0.4) { const z = surfaceAt(hist, x, ST_H + 0.02, -1, 0.05); lo = Math.min(lo, z); hi = Math.max(hi, z); } return [lo, hi]; };
        const add = (e, note) => { hist.push(e); placed = []; msg = note || ''; msgCol = 'muted'; };
        v.button('deposit', () => { const [, hi] = surf(); if (hi > ST_H - 0.45) { msg = 'the basin is full: erode first'; msgCol = 'red'; return; } add({ type: 'dep', lith: lith.value, top: Math.min(hi + 0.6, ST_H - 0.25) }); });
        v.button('tilt', () => { const tot = hist.reduce((s, e) => s + (e.type === 'tilt' ? e.ang : 0), 0), a = (tiltS.value * Math.PI) / 180; if (Math.abs(tot + a) > (75 * Math.PI) / 180) { msg = 'tilted too far: beds would overturn'; msgCol = 'red'; return; } add({ type: 'tilt', ang: a, cx: 6, cz: 0 }); });
        v.button('intrude dike', () => { const xs = [8.3, 2.6, 6.4, 9.9, 3.8, 7.2]; add({ type: 'dike', lith: 'basalt', x0: xs[nDike % xs.length], w: 0.32, ang: nDike % 2 ? -0.16 : 0.1 }); nDike++; });
        v.button('fault', () => { const xs = [8.6, 4.2, 10.2, 6.1]; add({ type: 'fault', x0: xs[nFault % xs.length], dip: (62 * Math.PI) / 180, slip: 0.75, id: nFault % 30 }); nFault++; });
        v.button('erode', () => { const [lo, hi] = surf(); const level = Math.max(0.5, Math.min(hi - 0.5, lo + 0.6 * (hi - lo))); add({ type: 'erode', level, amp: 0.07, wl: 2.7 + (nErode % 3) * 0.4, ph: nErode * 1.7 }); nErode++; });
        v.button('undo', () => { if (hist.length > 1) hist.pop(); placed = []; msg = ''; });
        v.button('reset', () => { hist = ST_DEFAULT(); placed = []; msg = ''; nDike = nFault = nErode = 0; });
        // analysis of the present outcrop (cached per history)
        let A = null, aKey = '';
        const analyse = () => {
          const key = JSON.stringify(hist); if (key === aKey) return A; aKey = key;
          const nx = 96, nz = 48, grid = [], side = [];
          for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const c = classify(hist, ((i + 0.5) * ST_W) / nx, ((j + 0.5) * ST_H) / nz); grid.push(c ? c.k : -1); side.push(c ? c.side : 0); }
          const units = [...new Set(grid.filter((k) => k >= 0))].sort((a, b) => a - b);
          const rel = new Map();
          const touch = (a, b, sa, sb) => { if (a < 0 || b < 0 || a === b || sa !== sb) return; const o = Math.min(a, b), y = Math.max(a, b); rel.set(`${o}>${y}`, [o, y, hist[y].type === 'dike' ? 'cut' : 'sup']); };
          for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; if (i + 1 < nx) touch(grid[k], grid[k + 1], side[k], side[k + 1]); if (j + 1 < nz) touch(grid[k], grid[k + nx], side[k], side[k + nx]); }
          const idx = new Map(units.map((u, i) => [u, i])), n = units.length, R = Array.from({ length: n }, () => new Array(n).fill(false));
          for (const [a, b] of rel.values()) R[idx.get(a)][idx.get(b)] = true;
          const Cl = R.map((r) => r.slice()); for (let m = 0; m < n; m++) for (let i = 0; i < n; i++) if (Cl[i][m]) for (let j = 0; j < n; j++) if (Cl[m][j]) Cl[i][j] = true;
          const hasse = []; for (const [a, b, t] of rel.values()) { const i = idx.get(a), j = idx.get(b); let red = false; for (let m = 0; m < n && !red; m++) if (m !== i && m !== j && Cl[i][m] && Cl[m][j]) red = true; if (!red) hasse.push([a, b, t]); }
          let und = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (!Cl[i][j] && !Cl[j][i]) und.push([units[i], units[j]]);
          // label positions: deepest cell of each unit (chamfer distance)
          const dist = grid.map((u, k) => { if (u < 0) return 0; const i = k % nx, j = Math.floor(k / nx); return i === 0 || j === 0 || i === nx - 1 || j === nz - 1 || grid[k - 1] !== u || grid[k + 1] !== u || grid[k - nx] !== u || grid[k + nx] !== u ? 1 : 1e9; });
          for (let k = 0; k < grid.length; k++) if (dist[k] > 1) dist[k] = Math.min(dist[k], dist[k - 1] + 1, dist[k - nx] + 1);
          for (let k = grid.length - 1; k >= 0; k--) if (dist[k] > 1) dist[k] = Math.min(dist[k], dist[k + 1] + 1, dist[k + nx] + 1);
          const pos = new Map();
          for (let k = 0; k < grid.length; k++) { const u = grid[k]; if (u < 0) continue; const i = k % nx, j = Math.floor(k / nx), d = dist[k] + 0.001 * (nz - Math.abs(j - nz / 2)); if (!pos.has(u) || d > pos.get(u).d) pos.set(u, { d, x: ((i + 0.5) * ST_W) / nx, y: ((j + 0.5) * ST_H) / nz }); }
          // quiz letters: a fixed shuffle
          const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ', perm = units.map((u, i) => i).sort((a, b) => hash(a, units.length, 11) - hash(b, units.length, 11));
          const letter = new Map(units.map((u, i) => [u, letters[perm[i]]]));
          const order = new Map(units.map((u, i) => [u, i + 1]));
          // dips
          const dip = new Map(units.map((u) => [u, hist.slice(u + 1).reduce((s, e) => s + (e.type === 'tilt' ? e.ang : 0), 0)]));
          A = { units, idx, Cl, rel: [...rel.values()], hasse, und, pos, letter, order, dip };
          // graph layout: rank = longest chain from below
          const rank = new Map(); for (const u of units) rank.set(u, 0);
          for (const u of units) for (const [a, b] of A.rel) if (b === u) rank.set(u, Math.max(rank.get(u), rank.get(a) + 1));
          for (let it = 0; it < units.length; it++) for (const [a, b] of A.rel) rank.set(b, Math.max(rank.get(b), rank.get(a) + 1));
          const maxR = Math.max(0, ...rank.values()), byR = new Map();
          for (const u of units) { const r = rank.get(u); if (!byR.has(r)) byR.set(r, []); byR.get(r).push(u); }
          const nodes = units.map((u) => { const row = byR.get(rank.get(u)), i = row.indexOf(u); return { id: String(u), y: 2 + ((row.length - 1) / 2 - i) * 1.15, x: 0.5 + (maxR ? (9 * rank.get(u)) / maxR : 4.5) }; });
          G.set({ nodes, edges: A.hasse.map(([a, b, t]) => ({ from: String(a), to: String(b), color: t === 'cut' ? 'red' : 'accent', width: 2 })), directed: true });
          return A;
        };
        S.onClick((x, y) => {
          if (!quiz.value) return; const a = analyse(), c = classify(hist, x, y); if (!c) return; const u = c.k;
          if (placed.includes(u)) return;
          const i = a.idx.get(u), missing = a.units.filter((w) => !placed.includes(w) && a.Cl[a.idx.get(w)][i]);
          if (!missing.length) { placed.push(u); msg = placed.length === a.units.length ? 'solved: an order consistent with every contact' : `${a.letter.get(u)} placed (${placed.length} of ${a.units.length})`; msgCol = 'green'; }
          else { const w = missing[missing.length - 1], direct = a.rel.find(([p, q]) => p === w && q === u); msg = `not yet: ${a.letter.get(w)} is older than ${a.letter.get(u)}${direct ? (direct[2] === 'cut' ? ` (${a.letter.get(u)} cuts it)` : ` (${a.letter.get(u)} lies on it)`) : ' (through a chain of contacts)'}`; msgCol = 'red'; }
        });
        let st = null;
        v.render(() => {
          const a = analyse(), q = quiz.value;
          S.rect(0, 0, ST_W, ST_H, { fill: 'blue', fillAlpha: 0.05, stroke: false });
          drawSection(v, S, hist, { key: JSON.stringify(hist), res: 2, pale: 0.48 });
          hist.forEach((e, k) => { if (e.type === 'erode') S.contour((x, z) => { const c = classify(hist, x, z); return c ? (c.k > k ? 1 : 0) : NaN; }, [0.5], { color: 'red', width: 2.6, res: 240 }); });
          // erosion surfaces as wavy unconformity lines are visible through contrast; mark fault traces
          for (const u of a.units) {
            const p = a.pos.get(u); if (!p) continue;
            const lab = q ? a.letter.get(u) : String(a.order.get(u)), ok = placed.includes(u);
            const X = S.X(p.x), Y = S.Y(p.y);
            S.ctx.save(); S.ctx.beginPath(); S.ctx.arc(X, Y, 10, 0, TAU); S.ctx.fillStyle = v.color(ok ? 'green' : 'panel', 0.92); S.ctx.fill(); S.ctx.lineWidth = 1.5; S.ctx.strokeStyle = v.color(ok ? 'green' : 'ink'); S.ctx.stroke(); S.ctx.restore();
            S.textPx(lab, X, Y + 0.5, { align: 'center', size: 12, weight: 700, color: ok ? 'panel' : 'ink', halo: false });
          }
          if (msg) S.corner(msg, 'tl', { size: 12, weight: 700, color: msgCol });
          else if (q) S.corner('click the oldest unit not yet placed', 'tl', { size: 12, weight: 600, color: 'muted' });
          // the graph of proven relations
          const show = (id) => !q || placed.includes(+id);
          for (const n of G.nodes) n.hidden = !show(n.id); // in the quiz, unplaced units stay hidden (their position would give the order away)
          G.draw({
            nodeFill: (id) => (show(id) ? (LITH[hist[+id].lith] || LITH.sand).color : null),
            nodeColor: (id) => (LITH[hist[+id].lith] || LITH.sand).color,
            nodeLabel: (id) => (q ? a.letter.get(+id) : String(a.order.get(+id))),
            edgeColor: (e) => e.color,
            dim: [],
          });
          if (q && !placed.length) {
            G2.text('Place the oldest unit in the outcrop.', 5, 2.3, { align: 'center', size: 14, color: 'muted' });
            G2.text('Placed units and their contacts appear here.', 5, 1.6, { align: 'center', size: 12, color: 'muted' });
          }
          st = { a, q };
        });
        v.legend([['accent', 'superposition: lies on'], ['red', 'cross-cutting: cuts']]);
        v.readout(() => {
          if (!st) return '';
          const { a, q } = st;
          if (q) return `quiz: ${placed.length} of ${a.units.length} units placed · ${a.und.length ? `${a.und.length} pair${a.und.length > 1 ? 's' : ''} of units never connected by contacts: either order is accepted` : 'every pair of units is ordered by the outcrop'}`;
          const name = (u) => `${a.order.get(u)} ${(LITH[hist[u].lith] || LITH.sand).name}${hist[u].type === 'dike' ? ' dike' : ''}`;
          const dips = new Map(); for (const u of a.units) if (hist[u].type === 'dep' && Math.abs(a.dip.get(u)) > 0.01) { const d = v.fix((Math.abs(a.dip.get(u)) * 180) / Math.PI, 0); if (!dips.has(d)) dips.set(d, []); dips.get(d).push(a.order.get(u)); }
          const dipTxt = [...dips].map(([d, us]) => `${us.length > 1 ? 'layers' : 'layer'} ${us.join(', ')} dip${us.length > 1 ? '' : 's'} ${d}°`).join('; ');
          const ev = hist.map((e, k) => (isUnit(e) ? (a.order.has(k) ? `**${a.order.get(k)}**` : '(hidden)') : e.type === 'tilt' ? `tilt ${v.fix((e.ang * 180) / Math.PI, 0)}°` : e.type)).join(' → ');
          const tot = (a.units.length * (a.units.length - 1)) / 2;
          return `history: ${ev} · units: ${a.units.map(name).join(', ')}${dipTxt ? ` · ${dipTxt}: tilted after deposition (original horizontality)` : ''} · red line: unconformity · the outcrop orders ${tot - a.und.length} of ${tot} pairs${a.und.length ? `; undetermined: ${a.und.map(([x, y]) => `${a.order.get(x)}–${a.order.get(y)}`).join(', ')}` : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Principle',
      name: 'Faunal succession and correlation',
      statement: String.raw`Fossil species succeed one another in the rock record in a definite and recognizable order: each appears at some level, persists through a range of strata and disappears, never to reappear. Rocks containing the same fossil **assemblage** were therefore deposited during the same interval of time, wherever they are found and whatever their rock type. Matching assemblages between separate sections (**biostratigraphic correlation**) extends Steno's local ordering to whole regions and continents; the time window of a bed is the interval in which all the species it contains coexisted.`,
      scope: String.raw`Correlation is as fine as the ranges are short: long-ranging species say little, short-lived, widespread, abundant species (index fossils) say most. First and last appearances are diachronous where species migrated, facies-bound species follow their environments rather than time, and reworked fossils can be found above their true range.`,
      idea: String.raw`Species originate and go extinct once (evolution is not reversible and extinction is final), so the sequence of appearances is the same everywhere. William Smith, surveying canals in England, found that each formation carried its own fossils in a constant order, and used them to trace strata across the country for his 1815 geological map; Cuvier and Brongniart found the same in the Paris Basin. Rock type is a poor guide: the same sandstone forms at different times in different places as environments shift (geol-1.7), and a gap in deposition (geol-1.6) removes zones from one section but not another.`,
      caption: String.raw`Drag from a bed in site A to a bed in site B to correlate them (click a tie to delete it); click a bed to see its fossils on the range chart and the window of time they allow (every species it contains alive, every one it lacks not yet or no longer alive). A tie turns **green** if the two beds really overlap in time and **red** if not; crossing ties are impossible by superposition. Switch the mode to let the computer correlate **by fossils** (overlapping windows) or **by rock type**, and turn on **true time lines** to see the isochrons, which converge on the gap in site B.`,
      deps: ['geol-1.4'],
      see: ['geol-1.7', 'geol-1.9'],
      refs: ['Press–Siever'],
      tags: ['stratigraphy', 'fossils', 'correlation'],
      credit: 'William Smith, 1796–1815; Cuvier & Brongniart, 1811',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Principle_of_faunal_succession' },
      viz(v) {
        const mode = v.select('ties', [{ value: 'you', label: 'your ties' }, { value: 'fos', label: 'by fossils' }, { value: 'rock', label: 'by rock type' }], 'you');
        const truth = v.toggle('true time lines', false);
        const A = stackSite(SITE_A), Bs = stackSite(SITE_B), HA = A[A.length - 1].h1, HB = Bs[Bs.length - 1].h1, Hm = Math.max(HA, HB);
        const S = v.stage({ x: [0, 10], y: [-7, Hm + 9], axes: false, height: 460, weight: 1.25 });
        const R = v.stage({ x: [-0.6, 8], y: [-22, 112], axes: 'box', height: 460, weight: 0.8, minWidth: 250, xticks: [], yticks: [[0, 'oldest'], [100, 'youngest']], title: 'range chart: the succession in time' });
        const ax0 = 0.7, ax1 = 2.9, bx0 = 7.1, bx1 = 9.3;
        let ties = [[1, 0], [4, 1]], sel = { site: 'A', i: 3 }, drag = null;
        const bedAt = (x, y) => { if (x >= ax0 && x <= ax1) { const i = A.findIndex((b) => y >= b.h0 && y <= b.h1); if (i >= 0) return { site: 'A', i }; } if (x >= bx0 && x <= bx1) { const i = Bs.findIndex((b) => y >= b.h0 && y <= b.h1); if (i >= 0) return { site: 'B', i }; } return null; };
        const midA = (i) => (A[i].h0 + A[i].h1) / 2, midB = (j) => (Bs[j].h0 + Bs[j].h1) / 2;
        S.onDrag((x, y, ph) => {
          if (mode.value !== 'you') return;
          if (ph === 'start') { const b = bedAt(x, y); drag = b ? { from: b, x, y } : null; return; }
          if (!drag) return; drag.x = x; drag.y = y;
          if (ph === 'end') { const b = bedAt(x, y); if (b && b.site !== drag.from.site) { const t = drag.from.site === 'A' ? [drag.from.i, b.i] : [b.i, drag.from.i]; ties = ties.filter((u) => u[0] !== t[0] || u[1] !== t[1]); ties.push(t); } drag = null; }
        });
        S.onClick((x, y) => {
          const b = bedAt(x, y); if (b) { sel = b; return; }
          if (mode.value !== 'you') return;
          // delete a tie near the click
          let best = -1, bd = 12;
          ties.forEach(([i, j], k) => { const P = [S.X(ax1), S.Y(midA(i))], Q = [S.X(bx0), S.Y(midB(j))], px = S.X(x), py = S.Y(y); const t = clamp(((px - P[0]) * (Q[0] - P[0]) + (py - P[1]) * (Q[1] - P[1])) / ((Q[0] - P[0]) ** 2 + (Q[1] - P[1]) ** 2), 0, 1); const d = Math.hypot(P[0] + t * (Q[0] - P[0]) - px, P[1] + t * (Q[1] - P[1]) - py); if (d < bd) { bd = d; best = k; } });
          if (best >= 0) ties.splice(best, 1);
        });
        const overlap = (a, b) => Math.min(a[1], b[1]) - Math.max(a[0], b[0]);
        const autoTies = (m) => {
          const out = []; let jmin = 0;
          A.forEach((a, i) => {
            let best = -1, bv = 0;
            for (let j = jmin; j < Bs.length; j++) { const val = m === 'fos' ? overlap(a.win, Bs[j].win) : (Bs[j].lith === a.lith ? 1 : 0); if (val > bv + 1e-9) { bv = val; best = j; } if (m === 'rock' && best >= 0) break; }
            if (best >= 0) { out.push([i, best]); jmin = best + (m === 'rock' ? 1 : 0); }
          });
          return out;
        };
        let st = null;
        v.render(() => {
          const T = mode.value === 'you' ? ties : autoTies(mode.value);
          // columns
          const col = (beds, x0, x1, name) => {
            beds.forEach((b, i) => {
              lithPoly(v, S, [[x0, b.h0], [x1, b.h0], [x1, b.h1], [x0, b.h1]], b.lith, { fillAlpha: 0.32, outline: 'muted', width: 0.8, inkAlpha: 0.55 });
              const n = b.taxa.length, w = S.X(x1) - S.X(x0), ym = S.Y((b.h0 + b.h1) / 2);
              b.taxa.forEach((ti, k) => fossil(v, S, TAXA[ti].k, S.X(x0) + ((k + 0.5) * w) / n, ym, Math.min(7, (S.Y(b.h0) - S.Y(b.h1)) * 0.3), TAXA[ti].c));
              if (sel && sel.site === name && sel.i === i) S.rect(x0, b.h0, x1, b.h1, { color: 'gold', width: 3 });
            });
            S.text(`site ${name}`, (x0 + x1) / 2, Hm + 5, { align: 'center', size: 14, weight: 700 });
          };
          col(A, ax0, ax1, 'A'); col(Bs, bx0, bx1, 'B');
          // the unconformity in B
          const gapH = Bs[2].h1; S.path(Array.from({ length: 30 }, (_, k) => [bx0 - 0.15 + ((bx1 - bx0 + 0.3) * k) / 29, gapH + 0.5 * Math.sin(k * 1.3)]), { color: 'red', width: 2.2 });
          S.text('gap', bx1 + 0.12, gapH, { size: 11, weight: 700, color: 'red', align: 'left' });
          // lithology legend tags
          for (const [k, c] of [['sand', 0], ['shale', 1], ['lime', 2]]) { const y = -4.3, x = 2.4 + c * 1.9; lithPoly(v, S, [[x, y - 1.3], [x + 0.45, y - 1.3], [x + 0.45, y + 1.3], [x, y + 1.3]], k, { fillAlpha: 0.32, outline: 'muted', width: 0.8, inkAlpha: 0.55 }); S.text(LITH[k].name, x + 0.52, y, { size: 10.5, color: 'muted' }); }
          // true time lines
          if (truth.value) {
            const hAt = (beds, t) => { for (const b of beds) if (t >= b.t0 && t <= b.t1) return b.h0 + ((t - b.t0) / (b.t1 - b.t0)) * (b.h1 - b.h0); if (t < beds[0].t0) return null; for (let i = 0; i + 1 < beds.length; i++) if (t > beds[i].t1 && t < beds[i + 1].t0) return beds[i].h1; return null; };
            for (let t = 10; t < 100; t += 10) { const ya = hAt(A, t), yb = hAt(Bs, t); if (ya == null || yb == null) continue; S.line(ax0, ya, ax1, ya, { color: 'gold', width: 1.2, dash: [4, 3] }); S.line(ax1, ya, bx0, yb, { color: 'gold', width: 1.2, dash: [4, 3] }); S.line(bx0, yb, bx1, yb, { color: 'gold', width: 1.2, dash: [4, 3] }); S.text(String(t), ax0, ya, { dx: -4, align: 'right', size: 10, color: 'gold' }); }
          }
          // ties
          let good = 0, bad = 0, cross = 0;
          T.forEach(([i, j], k) => {
            const ok = overlap([A[i].t0, A[i].t1], [Bs[j].t0, Bs[j].t1]) > 0;
            const crosses = T.some(([i2, j2], k2) => k2 !== k && (i2 - i) * (j2 - j) < 0);
            if (crosses) cross++; if (ok && !crosses) good++; else bad++;
            S.line(ax1, midA(i), bx0, midB(j), { color: ok && !crosses ? 'green' : 'red', width: 2.6 });
            S.dot(ax1, midA(i), { r: 3.5, color: ok && !crosses ? 'green' : 'red' }); S.dot(bx0, midB(j), { r: 3.5, color: ok && !crosses ? 'green' : 'red' });
          });
          if (drag) S.line(drag.from.site === 'A' ? ax1 : bx0, drag.from.site === 'A' ? midA(drag.from.i) : midB(drag.from.i), drag.x, drag.y, { color: 'accent', width: 2, dash: [5, 4] });
          if (mode.value === 'you' && !T.length) S.text('drag from a bed in A to a bed in B', 5, Hm / 2, { align: 'center', size: 12, color: 'muted' });
          // range chart
          const b = sel ? (sel.site === 'A' ? A : Bs)[sel.i] : null;
          if (b) { R.hband(b.win[0], b.win[1], { color: 'gold', alpha: 0.2, edges: true }); if (truth.value) R.rect(-0.5, b.t0, -0.15, b.t1, { fill: 'gold', fillAlpha: 0.9, stroke: false }); }
          TAXA.forEach((t, i) => { const c = R.ctx; c.save(); c.translate(R.X(i + 0.5), R.Y(-2)); c.rotate(-Math.PI / 2); c.font = '500 10.5px Inter, system-ui, sans-serif'; c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillStyle = v.color(t.c); c.fillText(t.k === 'fishtooth' ? 'fish tooth' : t.k, 0, 0); c.restore(); });
          TAXA.forEach((t, i) => {
            const x = i + 0.5, on = b && b.taxa.includes(i);
            R.rect(x - 0.17, t.r[0], x + 0.17, t.r[1], { fill: t.c, fillAlpha: on ? 0.8 : 0.25, color: t.c, width: on ? 2 : 1, radius: 3 });
            fossil(v, R, t.k, R.X(x), R.Y(t.r[1]) - 12, 6.5, t.c);
          });
          if (b) R.text(`bed ${sel.site}${sel.i + 1}: ${v.fix(b.win[0], 0)}–${v.fix(b.win[1], 0)}`, 7.9, (b.win[0] + b.win[1]) / 2, { align: 'right', size: 11, weight: 700, color: 'gold' });
          st = { T, good, bad, cross, b };
        });
        v.readout(() => {
          if (!st) return '';
          const { T, good, cross, b } = st;
          const m = { you: 'your correlation', fos: 'correlation by fossil assemblages', rock: 'correlation by rock type' }[mode.value];
          const sb = b ? ` · selected bed: ${b.taxa.map((i) => TAXA[i].k.replace('fishtooth', 'fish tooth')).join(', ')} → possible only in **${v.fix(b.win[0], 0)}–${v.fix(b.win[1], 0)}**${truth.value ? ` (true age ${b.t0}–${b.t1})` : ''}` : '';
          return `${m}: **${good} of ${T.length}** ties join beds of overlapping age${cross ? `, ${cross} cross another tie (impossible by superposition)` : ''}${sb}`;
        });
      },
    },
  ],
};
