// Architecture & Structural Form — Chapter 1: Loads, equilibrium and graphic statics
//
// Sources checked (Oct 2026):
//   1.1 ASCE/SEI 7-16: live loads (Table 4.3-1: offices 50 psf = 2.40 kPa, residential 40 psf = 1.92 kPa, assembly
//       lobbies/movable seats 100 psf = 4.79 kPa, light storage 125 psf = 6.00 kPa, ordinary flat roofs 20 psf =
//       0.96 kPa); flat-roof snow p_f = 0.7 Ce Ct Is p_g (taken here with Ce = Ct = Is = 1); velocity pressure
//       q = 0.613 V² Pa (V in m/s; Kz, Kzt, Kd = 1 here); strength combinations §2.3.1 (1.4D; 1.2D + 1.6L + 0.5(Lr or S);
//       1.2D + 1.6(Lr or S) + (L or 0.5W); 1.2D + 1.0W + L + 0.5(Lr or S); 0.9D + 1.0W). Reinforced concrete
//       150 pcf = 23.6 kN/m³ (ASCE 7 Table C3.1-2). Wall pressure coefficients 0.8 windward, −0.5 leeward and a roof
//       suction coefficient −0.9 are typical simplified values (ASCE 7 Fig. 27.3-1), not a design calculation.
//   1.4 Stevin, De Beghinselen der Weeghconst (Leiden, 1586): the clootcrans (wreath of spheres).
//   1.5 Varignon, Nouvelle mécanique ou statique (Paris, 1725, posthumous): the funicular polygon.
//       Hooke's anagram (1676), solved in 1705: "Ut pendet continuum flexile, sic stabit contiguum rigidum inversum".
//   1.7 Material ranges (typical, rounded): structural steel S235–S460, E 210 GPa (EN 10025, EN 1993-1-1); bridge/cable
//       wire 1570–1960 MPa; aluminium 6061-T6 yield 276 MPa, E 69 GPa (ASM); concrete C20–C50: fck 20–50, fctm 2.2–4.1,
//       Ecm 30–37 GPa (EN 1992-1-1 Table 3.1); timber: graded C24 (EN 338: ft,0,k 14.5, fc,0,k 21 MPa, E 11 GPa,
//       ρ 420) up to clear Douglas fir (USDA Wood Handbook: compression ∥ 49.9 MPa, MOR 85.5 MPa, E 13.4 GPa);
//       glass: annealed 45 MPa characteristic bending strength (EN 572), toughened 120 MPa (EN 12150), E 70 GPa;
//       PTFE-coated glass fabric: AGC datasheet, 4,200 N/5 cm at 0.34 mm and 680 g/m² (≈ 250 MPa, ρ ≈ 2,000);
//       CFRP plates (e.g. Sika CarboDur S: E 165 GPa, tensile ≈ 2,800 MPa, ρ 1,600). Stone, brick, adobe and bamboo:
//       typical ranges as compiled in Ashby-style charts (granite σc 100–250 MPa, limestone 30–250, sandstone 20–170,
//       fired brick 10–100, earth 1–5; tensile strengths roughly a tenth of compressive). These are indicative ranges.

// ── shared helpers ──────────────────────────────────────────────────────────────────────────────────────────────────
const G = 9.81;
/** Text width in px. */
function textW(s, str, size = 12, weight = 500) { const c = s.ctx; c.save(); c.font = `${weight} ${size}px Inter, system-ui, sans-serif`; const w = c.measureText(str).width; c.restore(); return w; }
const kN = (x, d = 3) => `${(Math.abs(x) < 0.05 ? 0 : x).toLocaleString('en-US', { maximumSignificantDigits: d })} kN`;
const r1 = (x) => (Math.abs(x) < 0.05 ? '0' : x.toFixed(1)).replace('-', '−');

/**
 * Greedy label placement around points (data coords): tries right, left, diagonals, above, below, then further out
 * with a leader line; keeps inside the data area and clear of points and earlier labels.
 */
function placeLabels(v, s, items, o = {}) {
  const b = s.bounds, X0 = s.X(b.x[0]), X1 = s.X(b.x[1]), Y0 = s.Y(b.y[0]), Y1 = s.Y(b.y[1]);
  const xl = Math.min(X0, X1), xr = Math.max(X0, X1), yt = Math.min(Y0, Y1), yb = Math.max(Y0, Y1);
  const pts = items.map((it) => [s.X(it.x), s.Y(it.y), (it.r ?? 5) + 1.5]).concat(o.points || []);
  const boxes = [...(o.avoid || [])];
  const hit = (bx) => boxes.some((q) => bx[0] < q[2] && bx[2] > q[0] && bx[1] < q[3] && bx[3] > q[1])
    || pts.some(([cx, cy, r]) => { const nx = Math.max(bx[0], Math.min(cx, bx[2])), ny = Math.max(bx[1], Math.min(cy, bx[3])); return Math.hypot(nx - cx, ny - cy) < r; });
  const C = [[1, 0], [-1, 0], [1, -1], [-1, -1], [1, 1], [-1, 1], [0, -1], [0, 1], [1, -2], [-1, -2], [1, 2], [-1, 2], [0, -2], [0, 2], [2, -2], [-2, -2], [2, 2], [-2, 2]];
  items.forEach((it, i) => {
    const size = it.size ?? 11, wt = it.weight ?? 500, w = textW(s, it.text, size, wt), h = size + 4, [px, py] = pts[i];
    let pick = null, first = null;
    for (const [cx, cy] of it.prefer ? [it.prefer, ...C] : C) {
      const far = Math.abs(cx) > 1 || Math.abs(cy) > 1, gx = far ? 22 : (it.r ?? 5) + 4, gy = (Math.abs(cy) > 1 ? 1.5 * Math.abs(cy) - 1 : 0.85) * h;
      const x0 = cx > 0 ? px + gx : cx < 0 ? px - gx - w : px - w / 2, yc = py + Math.sign(cy) * gy;
      const bx = [x0 - 2, yc - h / 2, x0 + w + 2, yc + h / 2];
      if (bx[0] < xl + 2 || bx[2] > xr - 2 || bx[1] < yt + 1 || bx[3] > yb - 1) continue;
      first ||= { bx, x0, yc, far };
      if (!hit(bx)) { pick = { bx, x0, yc, far }; break; }
    }
    pick ||= first; if (!pick) return;
    boxes.push(pick.bx);
    if (pick.far) { const nx = Math.max(pick.bx[0], Math.min(px, pick.bx[2])), ny = Math.max(pick.bx[1], Math.min(py, pick.bx[3])); const c = s.ctx; c.save(); c.strokeStyle = v.color(it.color || 'muted', 0.55); c.lineWidth = 1; c.beginPath(); c.moveTo(px, py); c.lineTo(nx, ny); c.stroke(); c.restore(); }
    s.textPx(it.text, pick.x0, pick.yc, { size, weight: wt, color: it.color || 'ink', align: 'left' });
  });
}

/** Support symbol drawn in pixels under (x, y): 'pin', 'roller', 'fixed' (ground), 'wallL' / 'wallR' (fixed end of a beam). */
function drawSupport(v, s, x, y, type, color = 'muted') {
  const c = s.ctx, X = s.X(x), Y = s.Y(y), col = v.color(color), faint = v.color(color, 0.7);
  c.save(); c.strokeStyle = col; c.fillStyle = v.color('panel'); c.lineWidth = 1.6;
  const ground = (y0, w) => { c.beginPath(); c.moveTo(X - w, y0); c.lineTo(X + w, y0); c.stroke(); c.strokeStyle = faint; c.lineWidth = 1; for (let k = -w; k < w; k += 5) { c.beginPath(); c.moveTo(X + k, y0); c.lineTo(X + k - 5, y0 + 6); c.stroke(); } };
  if (type === 'pin' || type === 'roller') {
    c.beginPath(); c.moveTo(X, Y); c.lineTo(X - 9, Y + 14); c.lineTo(X + 9, Y + 14); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.arc(X, Y, 2.6, 0, 2 * Math.PI); c.fillStyle = col; c.fill();
    if (type === 'roller') { c.fillStyle = v.color('panel'); for (const dx of [-5, 5]) { c.beginPath(); c.arc(X + dx, Y + 17.5, 3, 0, 2 * Math.PI); c.fill(); c.stroke(); } ground(Y + 21, 13); }
    else ground(Y + 14, 13);
  } else if (type === 'fixed') { c.fillStyle = v.color(color, 0.18); c.fillRect(X - 13, Y, 26, 6); ground(Y, 14); }
  else if (type === 'wallL' || type === 'wallR') {
    const sg = type === 'wallL' ? -1 : 1; c.beginPath(); c.moveTo(X, Y - 16); c.lineTo(X, Y + 16); c.stroke();
    c.strokeStyle = faint; c.lineWidth = 1; for (let k = -16; k < 16; k += 5) { c.beginPath(); c.moveTo(X, Y + k); c.lineTo(X + sg * 6, Y + k + 5); c.stroke(); }
  }
  c.restore();
}
/** Curved moment arrow (pixels) around (x, y): positive m = counter-clockwise. */
function momentArrow(v, s, x, y, m, color = 'green', r = 16) {
  if (Math.abs(m) < 1e-9) return;
  const c = s.ctx, X = s.X(x), Y = s.Y(y), ccw = m > 0, a0 = ccw ? 0.35 * Math.PI : -0.35 * Math.PI, a1 = ccw ? 1.65 * Math.PI : -1.65 * Math.PI;
  c.save(); c.strokeStyle = v.color(color); c.fillStyle = v.color(color); c.lineWidth = 2;
  c.beginPath(); c.arc(X, Y, r, -a0, -a1, ccw); c.stroke();
  const ae = -a1, hx = X + r * Math.cos(ae), hy = Y + r * Math.sin(ae), tx = ccw ? Math.sin(ae) : -Math.sin(ae), ty = ccw ? -Math.cos(ae) : Math.cos(ae);
  c.beginPath(); c.moveTo(hx + tx * 7, hy + ty * 7); c.lineTo(hx - ty * 4.5, hy + tx * 4.5); c.lineTo(hx + ty * 4.5, hy - tx * 4.5); c.closePath(); c.fill();
  c.restore();
}

// ── a small 2D frame solver (Euler–Bernoulli beam elements with axial stiffness, optional end hinges) ────────────────
/** Local 6×6 stiffness of a frame element. */
function kLocal(EA, EI, L) {
  const a = EA / L, b = (12 * EI) / L ** 3, c = (6 * EI) / L ** 2, d = (4 * EI) / L, e = (2 * EI) / L;
  return [[a, 0, 0, -a, 0, 0], [0, b, c, 0, -b, c], [0, c, d, 0, -c, e], [-a, 0, 0, a, 0, 0], [0, -b, -c, 0, b, -c], [0, c, e, 0, -c, d]];
}
/**
 * nodes [{x, y}] (m); elems [{i, j, EA, EI, q (uniform load in local +y, kN/m), relI, relJ (hinged ends)}];
 * sup {node: [ux, uy, rz] restrained?}; loads {node: [Fx, Fy, M]} (kN, kN·m).
 * Returns {d, R (reactions per node [Rx, Ry, M]), el (per element: L, c, s, f local end forces on the element, ...), mech}.
 * A hinged end gets its own rotation DOF; a node whose element ends are all hinged has its rotation fixed (it carries
 * nothing). A zero pivot during elimination flags a mechanism; the mode is then found from a regularised solve.
 */
function frameSolve(nodes, elems, sup, loads = {}) {
  const nN = nodes.length; let nd = 3 * nN;
  const el = elems.map((e) => {
    const a = nodes[e.i], b = nodes[e.j], dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
    const dofs = [3 * e.i, 3 * e.i + 1, e.relI ? nd++ : 3 * e.i + 2, 3 * e.j, 3 * e.j + 1, e.relJ ? nd++ : 3 * e.j + 2];
    return { ...e, L, c: dx / L, s: dy / L, dofs, q: e.q || 0 };
  });
  const used = new Array(nN).fill(false); for (const e of el) { if (!e.relI) used[e.i] = true; if (!e.relJ) used[e.j] = true; }
  const fixed = new Array(nd).fill(false);
  for (const k in sup) sup[k].forEach((on, q) => { if (on) fixed[3 * k + q] = true; });
  for (let k = 0; k < nN; k++) if (!used[k]) fixed[3 * k + 2] = true;
  const K = Array.from({ length: nd }, () => new Float64Array(nd)), F = new Float64Array(nd);
  for (const k in loads) loads[k].forEach((val, q) => { F[3 * k + q] += val || 0; });
  for (const e of el) {
    const kl = kLocal(e.EA, e.EI, e.L), { c, s } = e, T = (vec) => [c * vec[0] + s * vec[1], -s * vec[0] + c * vec[1], vec[2], c * vec[3] + s * vec[4], -s * vec[3] + c * vec[4], vec[5]];
    const Tt = (vec) => [c * vec[0] - s * vec[1], s * vec[0] + c * vec[1], vec[2], c * vec[3] - s * vec[4], s * vec[3] + c * vec[4], vec[5]];
    e.kl = kl; e.T = T; e.Tt = Tt;
    const kg = []; for (let col = 0; col < 6; col++) { const u = [0, 0, 0, 0, 0, 0]; u[col] = 1; const kcol = kl.map((row) => row.reduce((acc, kv, m) => acc + kv * T(u)[m], 0)); kg.push(Tt(kcol)); }
    for (let r = 0; r < 6; r++) for (let col = 0; col < 6; col++) K[e.dofs[r]][e.dofs[col]] += kg[col][r];
    const L = e.L, q = e.q; e.feq = [0, (q * L) / 2, (q * L * L) / 12, 0, (q * L) / 2, (-q * L * L) / 12];
    const fg = Tt(e.feq); for (let r = 0; r < 6; r++) F[e.dofs[r]] += fg[r];
  }
  const free = []; for (let k = 0; k < nd; k++) if (!fixed[k]) free.push(k);
  const n = free.length, maxDiag = Math.max(1e-12, ...free.map((k) => Math.abs(K[k][k])));
  const solve = (eps) => {
    const A = free.map((r) => free.map((cc) => K[r][cc])), b = free.map((r) => F[r]); let sing = false;
    for (let i = 0; i < n; i++) A[i][i] += eps;
    for (let i = 0; i < n; i++) {
      let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
      if (Math.abs(A[p][i]) < 1e-9 * maxDiag) { sing = true; if (!eps) return { sing }; }
      [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]];
      for (let r = i + 1; r < n; r++) { const f = A[r][i] / A[i][i]; if (!f) continue; for (let cc = i; cc < n; cc++) A[r][cc] -= f * A[i][cc]; b[r] -= f * b[i]; }
    }
    const x = new Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let acc = b[i]; for (let cc = i + 1; cc < n; cc++) acc -= A[i][cc] * x[cc]; x[i] = acc / A[i][i]; }
    return { x, sing };
  };
  let res = solve(0), mech = false;
  if (res.sing) { mech = true; res = solve(1e-7 * maxDiag); }
  const d = new Float64Array(nd); free.forEach((k, i) => { d[k] = res.x[i]; });
  const R = nodes.map(() => [0, 0, 0]);
  for (let k = 0; k < 3 * nN; k++) if (fixed[k]) { let acc = -F[k]; for (let m = 0; m < nd; m++) acc += K[k][m] * d[m]; R[Math.floor(k / 3)][k % 3] = acc; }
  for (const e of el) { const de = e.T(e.dofs.map((k) => d[k])); e.dl = de; e.f = e.kl.map((row, r) => row.reduce((acc, kv, m) => acc + kv * de[m], 0) - e.feq[r]); }
  return { d, R, el, mech, nodes };
}
/** Internal forces in an element at distance x from end i: N (tension +), V, M (sagging + with local y to the left of i→j). */
function internal(e, x) { const f = e.f; return { N: -f[0], V: f[1] + e.q * x, M: -f[2] + f[1] * x + (e.q * x * x) / 2 }; }
/** Deflected point of an element at ξ ∈ [0, 1], with displacements scaled by k (Hermite cubic + uniform-load bubble). */
function deflected(sol, e, xi, k) {
  const a = sol.nodes[e.i], [u1, v1, t1, u2, v2, t2] = e.dl, L = e.L;
  const N1 = 1 - 3 * xi * xi + 2 * xi ** 3, N2 = xi - 2 * xi * xi + xi ** 3, N3 = 3 * xi * xi - 2 * xi ** 3, N4 = -xi * xi + xi ** 3;
  const x = xi * L, w = N1 * v1 + N2 * L * t1 + N3 * v2 + N4 * L * t2 + (e.q * x * x * (L - x) ** 2) / (24 * e.EI) * (e.relI || e.relJ ? 0 : 1);
  const u = u1 + (u2 - u1) * xi, px = x + k * u, py = k * w;
  return [a.x + e.c * px - e.s * py, a.y + e.s * px + e.c * py];
}

export default {
  collection: 'arch',
  chapter: 1,
  title: 'Loads, equilibrium and graphic statics',
  summary: String.raw`A building stands when every part of it is in equilibrium under its loads and no material is overstressed. Forces add as arrows, so equilibrium can be drawn: the force polygon closes, and the funicular polygon is the shape a string would take under the same loads, which turned upside down is an arch. Supports, free-body diagrams and a count of unknowns tell us when statics alone can find the forces. Tension, compression and bending, the strengths of materials and the paths that loads take to the ground give the vocabulary for everything that follows.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1',
      kind: 'Concept',
      name: 'Loads: dead, live, snow and wind',
      statement: String.raw`A structure must carry several kinds of load:
- **dead load** $D$, the permanent self-weight of structure, finishes and services (a 200 mm reinforced-concrete slab weighs $0.2 \times 23.6 \approx 4.7$ kPa);
- **live load** $L$, from people, furniture and stored goods, specified by occupancy (offices 2.4 kPa, homes 1.9 kPa, crowds 4.8 kPa, light storage 6.0 kPa, roofs 0.96 kPa);
- **snow** $S$ (a flat roof carries about $0.7$ of the ground snow load);
- **wind** $W$, a pressure $q = \tfrac12\rho V^2 \approx 0.613\,V^2$ Pa that pushes on the windward wall, sucks on the leeward wall and lifts the roof.

The loads are not expected to peak together, so codes combine them with **load factors**, for example (ASCE 7) $1.2D + 1.6L + 0.5S$, or $0.9D + 1.0W$ for the case where wind tries to lift a light building. The design must survive the worst combination for every member.`,
      idea: String.raw`Permanent loads are known accurately and get small factors; variable loads are uncertain and rarely at their maximum at the same moment, so one is taken at its full design value while the others are reduced. The factor below one on dead load in $0.9D + 1.0W$ matters because there self-weight is *helping*: it holds the building down against uplift and overturning. Each combination is then carried through the structure by equilibrium (1.2, 1.8). A light roof can be governed by wind uplift rather than by gravity at all.`,
      caption: String.raw`A two-storey frame, 8 m wide with 6 m of floor behind each frame. Choose the floor use and the roof type, and set the ground snow and the wind speed. Load bands on the beams are drawn to scale (grey dead, blue live, teal snow); wind pushes on the left, sucks on the right and lifts the roof. The frame is solved for each ASCE 7 combination: the chart shows the vertical reaction under each column, and red bars mean that column must be held down.`,
      deps: [],
      see: ['arch-1.8'],
      refs: ['Salvadori'],
      tags: ['loads', 'codes'],
      viz(v) {
        const occ = v.select('floor use', [{ value: 1.92, label: 'home' }, { value: 2.4, label: 'office' }, { value: 4.79, label: 'assembly' }, { value: 6.0, label: 'storage' }], 2.4);
        const roof = v.select('roof', [{ value: 'slab', label: 'concrete slab' }, { value: 'deck', label: 'light steel deck' }], 'slab');
        const pg = v.slider('ground snow (kPa)', 0, 4, 1.0, { step: 0.05 });
        const V = v.slider('wind speed (m/s)', 0, 60, 30, { step: 1 });
        const A = v.stage({ x: [-3.6, 12.2], y: [-1.5, 12.6], equal: true, axes: false, height: 400, weight: 1.05, title: 'the frame and its loads' });
        const B = v.stage({ x: [0.3, 6.7], y: [-200, 800], axes: 'box', gutter: { l: 48 }, height: 400, weight: 1, ylabel: 'vertical reaction at column base (kN)', xticks: [[1, '1'], [2, '2'], [3, '3a'], [4, '3b'], [5, '4'], [6, '5']], title: 'load combinations (ASCE 7)' });
        const BW = 6, H1 = 4, LSP = 8;
        const nodes = [{ x: 0, y: 0 }, { x: LSP, y: 0 }, { x: 0, y: H1 }, { x: LSP, y: H1 }, { x: 0, y: 2 * H1 }, { x: LSP, y: 2 * H1 }];
        const col = { EA: 2.7e6, EI: 4e4 }, bm = { EA: 4.5e6, EI: 1.2e5 };
        const sup = { 0: [1, 1, 1], 1: [1, 1, 1] };
        const loads = () => {
          const Df = 0.2 * 23.6 + 1.0, Dr = roof.value === 'slab' ? 0.2 * 23.6 + 1.0 : 0.5, q = (0.613 * V.value ** 2) / 1000;
          return { Df, Dr, L: occ.value, Lr: 0.96, S: 0.7 * pg.value, q };
        };
        // unit load cases → reactions at the two bases
        function caseSol(kind, P) {
          const fl = { D: -P.Df * BW, L: -P.L * BW, Lr: 0, S: 0, W: 0 }[kind] ?? 0;
          const rf = { D: -P.Dr * BW, L: 0, Lr: -P.Lr * BW, S: -P.S * BW, W: 0.9 * P.q * BW }[kind] ?? 0;
          const el = [{ i: 0, j: 2, ...col }, { i: 2, j: 4, ...col }, { i: 1, j: 3, ...col }, { i: 3, j: 5, ...col }, { i: 2, j: 3, ...bm, q: fl }, { i: 4, j: 5, ...bm, q: rf }];
          const ld = kind === 'W' ? { 2: [1.3 * P.q * BW * H1, 0, 0], 4: [1.3 * P.q * BW * (H1 / 2), 0, 0] } : {};
          return frameSolve(nodes, el, sup, ld);
        }
        const COMBOS = [['1.4D', { D: 1.4 }], ['1.2D + 1.6L + 0.5(Lr or S)', { D: 1.2, L: 1.6, RS: 0.5 }], ['1.2D + 1.6(Lr or S) + L', { D: 1.2, RS: 1.6, L: 1 }], ['1.2D + 1.6(Lr or S) + 0.5W', { D: 1.2, RS: 1.6, W: 0.5 }], ['1.2D + 1.0W + L + 0.5(Lr or S)', { D: 1.2, W: 1, L: 1, RS: 0.5 }], ['0.9D + 1.0W', { D: 0.9, W: 1 }]];
        function analyse() {
          const P = loads(), rs = P.S >= P.Lr ? 'S' : 'Lr', cases = {};
          for (const k of ['D', 'L', 'Lr', 'S', 'W']) cases[k] = caseSol(k, P);
          const combo = COMBOS.map(([name, f]) => {
            const fac = { D: f.D || 0, L: f.L || 0, W: f.W || 0, Lr: rs === 'Lr' ? f.RS || 0 : 0, S: rs === 'S' ? f.RS || 0 : 0 };
            const R = [0, 1].map((nI) => [0, 1, 2].map((q) => Object.keys(fac).reduce((acc, k) => acc + fac[k] * cases[k].R[nI][q], 0)));
            const N = [0, 1, 2, 3].map((ei) => Object.keys(fac).reduce((acc, k) => acc + fac[k] * internal(cases[k].el[ei], 0).N, 0));
            return { name, R, N, fac };
          });
          const gov = combo.reduce((bi, c, i) => (Math.max(c.R[0][1], c.R[1][1]) > Math.max(combo[bi].R[0][1], combo[bi].R[1][1]) ? i : bi), 0);
          const up = combo.reduce((bi, c, i) => (Math.min(c.R[0][1], c.R[1][1]) < Math.min(combo[bi].R[0][1], combo[bi].R[1][1]) ? i : bi), 0);
          return { P, rs, combo, gov, up };
        }
        v.render(() => {
          const { P, combo, gov, up } = analyse(), g = combo[gov];
          // frame (columns thickness ∝ axial force in the governing combination)
          const maxN = Math.max(1, ...g.N.map(Math.abs));
          [[0, 2], [2, 4], [1, 3], [3, 5]].forEach(([a, b], ei) => A.line(nodes[a].x, nodes[a].y, nodes[b].x, nodes[b].y, { color: g.N[ei] < 0 ? 'blue' : 'red', width: 2 + 9 * Math.abs(g.N[ei]) / maxN, alpha: 0.75 }));
          A.line(0, H1, LSP, H1, { color: 'ink', width: 5 }); A.line(0, 2 * H1, LSP, 2 * H1, { color: 'ink', width: 5 });
          drawSupport(v, A, 0, 0, 'fixed'); drawSupport(v, A, LSP, 0, 'fixed');
          // stacked load bands (0.17 m per kPa)
          const k = 0.17, band = (y0, comps) => { let y = y0 + 0.12; for (const [val, c, lab] of comps) { if (val <= 0) continue; const h = val * k; A.rect(0, y, LSP, y + h, { fill: c, fillAlpha: 0.32, color: c, width: 1 }); for (let x = 0.5; x < LSP; x += 1) A.arrow(x, y + h, x, y, { color: c, width: 1, head: 4, alpha: 0.8 }); if (h > 0.25) A.text(`${lab} ${val.toFixed(2)} kPa`, LSP + 0.15, y + h / 2, { size: 10.5, color: c }); y += h; } };
          band(H1, [[P.Df, 'gray', 'D'], [P.L, 'blue', 'L']]);
          band(2 * H1, [[P.Dr, 'gray', 'D'], [P.S >= P.Lr ? P.S : P.Lr, P.S >= P.Lr ? 'teal' : 'blue', P.S >= P.Lr ? 'S' : 'Lr']]);
          // wind
          if (P.q > 0) {
            const wl = 0.8 * P.q * 1.6, wr = 0.5 * P.q * 1.6;
            for (let y = 0.5; y < 2 * H1; y += 1) { A.arrow(-0.25 - wl, y, -0.25, y, { color: 'orange', width: 1.4, head: 5 }); A.arrow(LSP + 0.25, y, LSP + 0.25 + wr, y, { color: 'orange', width: 1.4, head: 5, alpha: 0.7 }); }
            const ur = 0.9 * P.q * 1.6; for (let x = 1; x < LSP; x += 2) A.arrow(x, 2 * H1 + 2.3, x, 2 * H1 + 2.3 + ur, { color: 'orange', width: 1.4, head: 5 });
            A.text(`wind q = ${(P.q * 1000).toFixed(0)} Pa`, -0.3, 2 * H1 + 0.8, { align: 'right', size: 10.5, color: 'orange' });
          }
          // reactions (governing combination)
          for (const [nI, x] of [[0, 0], [1, LSP]]) {
            const Ry = g.R[nI][1], len = Math.min(2.2, Math.abs(Ry) / 300);
            A.arrow(x, Ry > 0 ? -1.35 : -0.25, x, Ry > 0 ? -1.35 + len : -0.25 - len, { color: Ry > 0 ? 'green' : 'red', width: 2.2, head: 7 });
            A.text(kN(Ry), x + (nI ? 0.3 : -0.3), -1.0, { align: nI ? 'left' : 'right', size: 11, weight: 650, color: Ry > 0 ? 'green' : 'red' });
          }
          A.text(`reactions for combination ${['1', '2', '3a', '3b', '4', '5'][gov]}`, LSP / 2, -1.25, { align: 'center', size: 10.5, color: 'muted' });
          // chart
          const all = combo.flatMap((c) => [c.R[0][1], c.R[1][1]]), lo = Math.min(-50, ...all) * 1.15, hi = Math.max(100, ...all) * 1.15;
          B.setView([0.3, 6.7], [lo, hi]);
          B.hline(0, { color: 'muted', width: 1 });
          combo.forEach((c, i) => [0, 1].forEach((nI) => {
            const val = c.R[nI][1], x0 = i + 1 - 0.32 + nI * 0.33, colr = val < 0 ? 'red' : i === gov ? 'green' : 'accent';
            B.rect(x0, 0, x0 + 0.3, val, { fill: colr, fillAlpha: i === gov || val < 0 ? 0.7 : 0.35, color: colr, width: 1 });
          }));
          B.text('left | right column', 1, hi * 0.95, { size: 10, color: 'muted' });
          v.legend([['gray', 'dead', { area: true }], ['blue', 'live', { area: true }], ['teal', 'snow', { area: true }], ['orange', 'wind'], ['green', 'governing combination', { area: true }], ['red', 'uplift (needs anchoring)', { area: true }]]);
          void up;
        });
        v.readout(() => {
          const { combo, gov, up } = analyse(), g = combo[gov], u = combo[up], umin = Math.min(u.R[0][1], u.R[1][1]);
          return `Largest column load: **${kN(Math.max(g.R[0][1], g.R[1][1]))}** in combination ${['1', '2', '3a', '3b', '4', '5'][gov]} (${g.name}). · ${umin < 0 ? `**Uplift ${kN(-umin)}** under combination ${['1', '2', '3a', '3b', '4', '5'][up]} (${u.name}): the column must be anchored down.` : `Smallest column load ${kN(umin)} (${u.name}): no uplift.`} · Equilibrium check (governing): ΣRy = ${kN(g.R[0][1] + g.R[1][1])}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2',
      kind: 'Principle',
      name: 'Static equilibrium of forces and moments',
      statement: String.raw`A rigid body, or any part of a structure cut free from the rest, stays at rest only if the external forces on it sum to zero and their moments about **every** point sum to zero:
$$\textstyle\sum \mathbf F = \mathbf 0, \qquad \sum M_O = 0 .$$
In the plane these are three scalar equations ($\sum F_x = 0$, $\sum F_y = 0$, $\sum M = 0$). If the forces balance, their moments about one point vanish exactly when they vanish about every point, so the reference point can be chosen freely, usually where unknown forces act. For a beam on two supports with vertical loads $P_i$ at $x_i$ this gives $R_B = \sum P_i (x_i - x_A)/(x_B - x_A)$ and $R_A = \sum P_i - R_B$.`,
      idea: String.raw`For a particle, $\sum\mathbf F = 0$ is Newton's first and second laws. For an extended body the internal forces cancel in pairs by the third law (mech-1.7) and their torques cancel too (mech-2.8), so only external forces and moments remain. Moving the reference point from $O$ to $O'$ changes the total moment by $(\mathbf r_O - \mathbf r_{O'})\times\sum\mathbf F$, which is zero when the forces balance; that is why one moment equation about any point suffices. A support that can only push (a bearing resting on a wall) cannot supply a negative reaction: if equilibrium demands one, the beam lifts off and tips.`,
      caption: String.raw`Drag the three loads (left–right for position, up–down for size) and the two supports. The reactions update so that ΣF = 0 and ΣM = 0. Drag the point **O** anywhere: the arms from O to each force's line of action and the moment bars on the right show the moments cancelling about every point. Switch on "equal shares" to replace the true reactions with a naive half-and-half split: forces still balance, but the moments do not, and the beam would rotate.`,
      deps: ['mech-1.7', 'mech-2.8'],
      refs: ['Allen & Zalewski'],
      credit: 'Archimedes (the lever); Varignon, 1687 (moments)',
      tags: ['equilibrium', 'statics'],
      viz(v) {
        const s = v.stage({ x: [-0.8, 10.8], y: [-3.6, 5.4], equal: true, axes: false, height: 360, weight: 1.6, title: 'free-body diagram of the beam' });
        const mb = v.stage({ x: [0.3, 6.7], y: [-100, 100], axes: 'box', gutter: { l: 46 }, height: 360, weight: 0.9, minWidth: 230, ylabel: 'moment about O (kN·m)', xticks: [], title: 'moments about O' });
        const naive = v.toggle('equal shares (wrong reactions)', false);
        const SC = 10; // kN per unit of arrow length
        const LC = ['orange', 'purple', 'pink'];
        const P = [s.handle(2.0, 3.0, { color: 'orange' }), s.handle(5.5, 1.8, { color: 'purple' }), s.handle(8.4, 2.4, { color: 'pink' })];
        P.forEach((h) => { h.constrain = (x, y) => [Math.max(0, Math.min(10, x)), Math.max(0.4, Math.min(5, y))]; });
        const SA = s.handle(1.0, -0.45, { color: 'gray', constrain: (x) => [Math.max(0, Math.min(10, x)), -0.45] });
        const SB = s.handle(9.0, -0.45, { color: 'gray', constrain: (x) => [Math.max(0, Math.min(10, x)), -0.45] });
        const O = s.handle(4.0, -2.4, { color: 'accent', label: 'O' });
        const solve = () => {
          const loads = P.map((h) => ({ x: h.x, F: -h.y * SC }));
          const xa = Math.min(SA.x, SB.x), xb = Math.max(SA.x, SB.x), W = -loads.reduce((a, l) => a + l.F, 0);
          let Rb, Ra;
          if (naive.value) { Ra = Rb = W / 2; }
          else if (xb - xa < 1e-6) { Ra = Rb = NaN; }
          else { Rb = loads.reduce((a, l) => a + (-l.F) * (l.x - xa), 0) / (xb - xa); Ra = W - Rb; }
          const forces = [...loads.map((l, i) => ({ x: l.x, F: l.F, c: LC[i], name: `P${i + 1}` })), { x: xa, F: Ra, c: 'green', name: 'R_A' }, { x: xb, F: Rb, c: 'green', name: 'R_B' }];
          return { forces, xa, xb, Ra, Rb, W };
        };
        v.render(() => {
          const { forces, xa, xb, Ra, Rb } = solve();
          s.rect(0, -0.12, 10, 0.12, { fill: 'gray', fillAlpha: 0.35, color: 'ink', width: 1.5 });
          drawSupport(v, s, xa, -0.13, 'pin'); drawSupport(v, s, xb, -0.13, 'roller');
          // loads
          P.forEach((h, i) => { s.arrow(h.x, h.y, h.x, 0.16, { color: LC[i], width: 2.6, head: 9 }); s.text(`${(h.y * SC).toFixed(0)} kN`, h.x, h.y, { dy: -12, align: 'center', size: 11, weight: 650, color: LC[i] }); });
          // reactions
          for (const [x, R, nm] of [[xa, Ra, 'R_A'], [xb, Rb, 'R_B']]) {
            if (!isFinite(R)) continue; const len = Math.max(0.15, Math.abs(R) / SC), ok = R >= 0;
            if (ok) s.arrow(x, -0.9 - len, x, -0.9, { color: 'green', width: 2.6, head: 9 }); else s.arrow(x, -0.9, x, -0.9 - len, { color: 'red', width: 2.6, head: 9 });
            s.text(`${nm.replace('_', '')} = ${R.toFixed(1)} kN`, x, -0.9 - len, { dy: 12, align: 'center', size: 11, weight: 650, color: ok ? 'green' : 'red' });
          }
          // moment arms from O
          for (const f of forces) { if (!isFinite(f.F)) continue; s.line(O.x, O.y, f.x, O.y, { color: f.c, width: 1.2, dash: [3, 3], alpha: 0.8 }); s.line(f.x, O.y, f.x, Math.min(O.y, 0) + (O.y > 0 ? 0 : 0), { color: f.c, width: 0.8, alpha: 0.35, dash: [1, 3] }); }
          // moment bars
          const ms = forces.map((f) => (f.x - O.x) * f.F), tot = ms.reduce((a, m) => a + (isFinite(m) ? m : 0), 0);
          const mx = Math.max(20, ...ms.map((m) => Math.abs(m) || 0), Math.abs(tot)) * 1.2;
          mb.setView([0.3, 6.7], [-mx, mx]); mb.hline(0, { color: 'muted', width: 1 });
          let cum = 0;
          forces.forEach((f, i) => { const m = ms[i]; if (!isFinite(m)) return; mb.rect(i + 0.65, cum, i + 1.35, cum + m, { fill: f.c, fillAlpha: 0.55, color: f.c, width: 1 }); mb.text(f.name.replace('_', ''), i + 1, cum + m, { align: 'center', baseline: m >= 0 ? 'bottom' : 'top', dy: m >= 0 ? -2 : 2, size: 10, color: 'ink' }); cum += m; });
          const okM = Math.abs(tot) < 1e-6;
          mb.text(okM ? 'ΣM = 0 ✓' : `ΣM = ${tot.toFixed(1)}`, 3.5, mx * 0.88, { align: 'center', size: 12, weight: 700, color: okM ? 'green' : 'red' });
          if (!okM) { momentArrow(v, s, 5, 1.5, tot > 0 ? 1 : -1, 'red', 26); s.text('unbalanced: the beam rotates', 5, 3.9, { align: 'center', size: 11.5, weight: 650, color: 'red' }); }
          v.legend([['orange', 'loads', { dot: true }], ['green', 'reactions'], ['accent', 'moment arms from O', { dash: true }]]);
        });
        v.readout(() => {
          const { forces, Ra, Rb, W } = solve(), sF = forces.reduce((a, f) => a + (isFinite(f.F) ? f.F : 0), 0), sM = forces.reduce((a, f) => a + (isFinite(f.F) ? (f.x - O.x) * f.F : 0), 0);
          const lift = !naive.value && (Ra < 0 || Rb < 0) ? ` · **${Ra < 0 ? 'A' : 'B'} must pull down**: a beam merely resting on its bearings would tip over there.` : '';
          return `Total load ${W.toFixed(1)} kN · R_A = ${isFinite(Ra) ? Ra.toFixed(1) : '—'} kN, R_B = ${isFinite(Rb) ? Rb.toFixed(1) : '—'} kN · ΣF_y = **${r1(sF)}** kN · ΣM about O (${O.x.toFixed(1)}, ${O.y.toFixed(1)}) = **${r1(sM)}** kN·m${lift}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3',
      kind: 'Concept',
      name: 'Supports, free-body diagrams and determinacy',
      statement: String.raw`A **free-body diagram** isolates a structure and replaces each support by the reactions it can supply: a **roller** gives one force normal to its surface, a **pin** a force in any direction (two components), and a **fixed** support two force components and a moment. With $r$ unknown reaction components and the three equilibrium equations of a plane body, and with $A$ the $3\times r$ matrix that maps reactions to net force and moment:
- if $\operatorname{rank} A < 3$, some load cannot be balanced and the body is a **mechanism** (this happens when $r < 3$, and also when the reactions are all parallel or all pass through one point);
- if $\operatorname{rank} A = 3 = r$, the structure is **statically determinate**: equilibrium alone fixes every reaction;
- if $\operatorname{rank} A = 3 < r$, it is **indeterminate** to degree $r - 3$: infinitely many sets of reactions balance the load, and the actual one depends on the stiffness of the members (compatibility of deformations).`,
      idea: String.raw`Equilibrium (1.2) is the linear system $A\mathbf R = -\mathbf F$. A solution exists for every load exactly when $A$ has full row rank 3, and it is unique exactly when the columns are independent ($r = 3$). The null space of $A$ is the set of self-balancing reaction patterns, which can be added without disturbing equilibrium. In an indeterminate structure the stiffer path attracts more load: the elastic answer here comes from a beam model in which the beam bends, and it lies somewhere along the family that statics allows. Counting unknowns is not enough, because three rollers in a row give $r = 3$ but cannot resist a sideways push.`,
      caption: String.raw`Pick a support at each of the three stations and drag the load (its tail sets both size and direction). The free-body diagram shows each reaction with its value; the readout gives $r$, the rank of $A$ and the verdict. For a mechanism the dashed ghost shows how the beam can move. For an indeterminate beam, drag the **redundant** slider: every setting satisfies ΣF = 0 and ΣM = 0, but only the marked one also satisfies the beam's elasticity.`,
      deps: ['arch-1.2'],
      see: ['solid-1.10', 'solid-7.5'],
      refs: ['Allen & Zalewski'],
      tags: ['statics', 'determinacy'],
      viz(v) {
        const OPTS = [{ value: 'none', label: 'none' }, { value: 'roller', label: 'roller' }, { value: 'pin', label: 'pin' }, { value: 'fixed', label: 'fixed' }];
        const sel = [v.select('left', OPTS, 'pin'), v.select('middle', OPTS, 'none'), v.select('right', OPTS, 'roller')];
        const red = v.slider('redundant (statics alone cannot fix it)', -1, 1, 0, { step: 0.01 });
        const s = v.stage({ x: [-1.2, 11.2], y: [-3.3, 4.4], equal: true, axes: false, height: 340, full: true });
        const XS = [0, 5, 10];
        const P = s.handle(3.2, 3.2, { color: 'orange', constrain: (x, y) => [Math.max(0.3, Math.min(9.7, x)), Math.max(0.5, Math.min(4.2, y))] });
        const LOADX = () => Math.max(0.3, Math.min(9.7, P.x));
        let elastic = null;
        function analyse() {
          // load: from the handle (tail) to the beam at x = P.x; magnitude 12 kN per unit length
          const lx = LOADX(), Fx = (lx - P.x) * 12, Fy = -P.y * 12;
          // unknowns
          const cols = [], info = [];
          sel.forEach((sc, k) => {
            const x = XS[k], t = sc.value;
            if (t === 'roller') { cols.push([0, 1, x]); info.push({ k, comp: 'y' }); }
            if (t === 'pin' || t === 'fixed') { cols.push([1, 0, 0]); info.push({ k, comp: 'x' }); cols.push([0, 1, x]); info.push({ k, comp: 'y' }); }
            if (t === 'fixed') { cols.push([0, 0, 1]); info.push({ k, comp: 'm' }); }
          });
          const r = cols.length, A = [0, 1, 2].map((row) => cols.map((c) => c[row])), b = [-Fx, -Fy, -(lx * Fy)];
          const rank = r ? v.M.rank(A) : 0;
          let R = null, null1 = null, Rel = null, mode = null;
          if (rank === 3) {
            const Ap = v.M.pinv(A); R = Ap.map((row) => row.reduce((acc, a, j) => acc + a * b[j], 0));
            if (r > 3) {
              const ns = v.M.nullspace(A); null1 = ns[0];
              // elastic solution from a beam model
              const xsN = [...new Set([0, 5, 10, lx].map((x) => +x.toFixed(6)))].sort((p, q) => p - q);
              const nodes = xsN.map((x) => ({ x, y: 0 })), el = xsN.slice(1).map((x, i) => ({ i, j: i + 1, EA: 1e6, EI: 1e4 }));
              const sup = {}; sel.forEach((sc, k) => { const ni = xsN.indexOf(XS[k]); const t = sc.value; if (t === 'roller') sup[ni] = [0, 1, 0]; if (t === 'pin') sup[ni] = [1, 1, 0]; if (t === 'fixed') sup[ni] = [1, 1, 1]; });
              const li = xsN.indexOf(+lx.toFixed(6)); const sol = frameSolve(nodes, el, sup, { [li]: [Fx, Fy, 0] });
              Rel = info.map(({ k, comp }) => sol.R[xsN.indexOf(XS[k])][comp === 'x' ? 0 : comp === 'y' ? 1 : 2]);
              elastic = sol;
              // coefficient of the elastic solution along null1 (relative to the min-norm particular solution)
              const cEl = Rel.reduce((acc, val, j) => acc + (val - R[j]) * null1[j], 0);
              const span = Math.max(30, Math.abs(cEl) * 1.6);
              const cUse = cEl + red.value * span;
              R = R.map((val, j) => val + cUse * null1[j]);
              return { r, rank, R, Rel, info, Fx, Fy, lx, cols, cEl, cUse, span };
            }
          } else if (r >= 0) {
            // mechanism: rigid motions (u, v, θ) allowed by the supports (null space of Aᵀ)
            const C = cols.length ? cols.map((c) => c.slice()) : [[0, 0, 0]];
            const ns = v.M.nullspace(C); mode = ns[0] || [0, 1, 0];
          }
          elastic = rank === 3 && r === 3 ? null : elastic;
          return { r, rank, R, Rel, info, Fx, Fy, lx, cols, mode };
        }
        v.render(() => {
          const a = analyse();
          red.el.hidden = !(a.rank === 3 && a.r > 3);
          // ghost for mechanisms
          if (a.mode) {
            const [u, w, th] = a.mode, sc = 1.2 / Math.max(1e-9, Math.hypot(u, w + th * 5, th * 10));
            const pt = (x) => [x + sc * u, sc * (w + th * x)];
            s.poly([pt(0).map((q, i) => q + (i ? -0.1 : 0)), pt(10).map((q, i) => q + (i ? -0.1 : 0)), pt(10).map((q, i) => q + (i ? 0.1 : 0)), pt(0).map((q, i) => q + (i ? 0.1 : 0))], { fill: 'red', fillAlpha: 0.12, color: 'red', dash: [5, 4], width: 1.2 });
            s.text('free to move like this', 5 + sc * u, sc * (w + th * 5) + 0.45, { align: 'center', size: 11.5, weight: 650, color: 'red' });
          }
          s.rect(0, -0.12, 10, 0.12, { fill: 'gray', fillAlpha: 0.35, color: 'ink', width: 1.5 });
          sel.forEach((sc, k) => { const t = sc.value; if (t === 'pin' || t === 'roller') drawSupport(v, s, XS[k], -0.13, t); if (t === 'fixed') drawSupport(v, s, XS[k], 0, k === 0 ? 'wallL' : k === 2 ? 'wallR' : 'fixed'); });
          // load
          s.arrow(P.x, P.y, a.lx, 0.16, { color: 'orange', width: 2.6, head: 9 });
          s.text(`${Math.hypot(a.Fx, a.Fy).toFixed(0)} kN`, P.x, P.y, { dy: -12, align: 'center', size: 11, weight: 650, color: 'orange' });
          // reactions
          if (a.R) {
            const comps = {};
            a.info.forEach((inf, j) => { (comps[inf.k] ||= {})[inf.comp] = a.R[j]; });
            for (const k in comps) {
              const x = XS[k], c = comps[k], rx = c.x || 0, ry = c.y || 0, sc = 1 / 12, L = Math.hypot(rx, ry);
              if (L > 0.05) { const y0 = -0.95; s.arrow(x - rx * sc, y0 - ry * sc, x, y0 + (ry >= 0 ? 0 : 0), { color: 'green', width: 2.4, head: 8 }); s.text(`${L.toFixed(1)} kN`, x - rx * sc, y0 - ry * sc, { dy: ry >= 0 ? 12 : -12, align: 'center', size: 10.5, weight: 650, color: 'green' }); }
              if (c.m != null && Math.abs(c.m) > 0.05) { momentArrow(v, s, x, 0, c.m, 'green', 22); s.text(`${Math.abs(c.m).toFixed(1)} kN·m`, x, 0.95, { align: 'center', size: 10.5, weight: 650, color: 'green' }); }
            }
            if (elastic && a.r > 3) { // elastic deflected shape (exaggerated)
              const sol = elastic, maxd = Math.max(1e-9, ...sol.el.flatMap((e) => [0, 0.25, 0.5, 0.75, 1].map((xi) => Math.abs(deflected(sol, e, xi, 1)[1])))), k = 0.8 / maxd;
              for (const e of sol.el) s.path(v.M.linspace(0, 1, 16).map((xi) => deflected(sol, e, xi, k)), { color: 'accent', width: 1.4, dash: [4, 3] });
            }
          }
          const verdict = a.rank < 3 ? ['MECHANISM', 'red'] : a.r === 3 ? ['STATICALLY DETERMINATE', 'green'] : [`INDETERMINATE (degree ${a.r - 3})`, 'purple'];
          s.text(`r = ${a.r} unknowns, rank A = ${a.rank}: ${verdict[0]}`, 5, 4.05, { align: 'center', size: 12.5, weight: 700, color: verdict[1] });
          v.legend([['orange', 'load'], ['green', 'reactions (free-body diagram)'], ['accent', 'elastic deflection (exaggerated)', { dash: true }], ['red', 'mechanism', { dash: true }]]);
        });
        v.readout(() => {
          const a = analyse();
          if (a.rank < 3) return `r = ${a.r}, rank ${a.rank} < 3: **mechanism**${a.r >= 3 ? ' — enough unknowns, but they cannot resist every load (counting is not enough)' : ''}. The load can only be balanced if it happens to point along a direction the supports resist.`;
          const sF = [0, 1].map((row) => a.R.reduce((acc, val, j) => acc + val * a.cols[j][row], 0) + (row ? a.Fy : a.Fx)), sM = a.R.reduce((acc, val, j) => acc + val * a.cols[j][2], 0) + a.lx * a.Fy;
          const base = `r = ${a.r}, rank 3 · ΣF_x = ${r1(sF[0])}, ΣF_y = ${r1(sF[1])} kN, ΣM = ${r1(sM)} kN·m`;
          if (a.r === 3) return `${base} · **determinate**: these reactions are the only ones possible.`;
          const dev = Math.abs(a.cUse - a.cEl) < 1e-6;
          return `${base} · **indeterminate**: a whole family balances the load; ${dev ? 'this one is the **elastic** solution (the beam bends compatibly with every support).' : 'this one is in equilibrium but would force the beam to break away from a support — move the slider back to the marked middle.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4',
      kind: 'Method',
      name: 'Force polygon (Stevin’s parallelogram)',
      statement: String.raw`Forces acting at a point add as vectors: two forces are equivalent to the diagonal of the parallelogram they span. Drawing the forces **nose to tail** gives the **force polygon**. The point is in equilibrium exactly when the polygon **closes**; otherwise the closing side, drawn from the end back to the start, is the **equilibrant**, the one extra force that would balance the rest. For a weight $W$ hung from two cables this gives the tensions graphically, and algebraically (Lami's theorem) each tension is proportional to the sine of the angle between the other two forces. Stevin derived the law of the inclined plane from the impossibility of perpetual motion: a closed loop of beads draped over a triangular prism does not move, so the beads on the two slopes balance.`,
      idea: String.raw`Equilibrium of a particle is $\sum\mathbf F = 0$ (1.2), and a vector sum is zero exactly when the chain of arrows returns to its start. Stevin's argument: the hanging part of the wreath is symmetric and pulls equally on both sides, so it can be removed, leaving the beads on the slopes in balance. Their weights are proportional to the slope lengths $L_1$ and $L_2$, and since $L_1\sin\alpha_1 = L_2\sin\alpha_2 = h$ the forces along the slopes, $W_i \sin\alpha_i$, are equal. This is the triangle of forces for a weight on an incline. A cable can only pull, so if the closed polygon needs a pushing cable the hanging configuration cannot exist.`,
      caption: String.raw`**Hanging weight:** drag the two anchors and the knot; add a sideways push (wind) on the knot. On the right the force polygon is drawn to scale, weight, push and the two cable tensions nose to tail, and closes. Flatten the cables and the tensions soar; put the knot outside the anchors and one cable would have to push. **Stevin's wreath:** drag the apex of the prism: the bead counts on the two slopes change in proportion to their lengths, yet the pulls along the slopes stay equal.`,
      deps: ['arch-1.2', 'vcalc-1.1'],
      refs: ['Allen & Zalewski'],
      credit: 'Stevin, 1586',
      tags: ['graphic statics', 'vectors'],
      viz(v) {
        const mode = v.select('', [{ value: 'hang', label: 'hanging weight' }, { value: 'stevin', label: 'Stevin’s wreath' }], 'hang', { onChange: () => vis() });
        const Hs = v.slider('sideways push on the knot (kN)', -6, 6, 0, { step: 0.1 });
        const S = v.stage({ x: [-5, 5], y: [-4.6, 3.2], equal: true, axes: false, height: 360, weight: 1.15, title: 'space diagram' });
        const Fd = v.stage({ x: [-5, 5], y: [-5, 5], equal: true, axes: false, height: 360, weight: 1, title: 'force polygon (to scale)' });
        const W = 10; // kN
        const hA = S.handle(-3.6, 2.4, { color: 'gray', label: 'A' }), hB = S.handle(3.0, 2.4, { color: 'gray', label: 'B' }), K = S.handle(-0.6, 0.2, { color: 'accent' });
        const apex = S.handle(-0.8, 1.4, { color: 'accent', constrain: (x, y) => [Math.max(-2.6, Math.min(2.6, x)), Math.max(0.6, Math.min(2.8, y))] });
        function vis() { const h = mode.value === 'hang'; hA.visible = hB.visible = K.visible = h; apex.visible = !h; Hs.el.hidden = !h; }
        const tens = () => {
          const ua = [hA.x - K.x, hA.y - K.y], ub = [hB.x - K.x, hB.y - K.y], la = Math.hypot(...ua), lb = Math.hypot(...ub);
          const ea = [ua[0] / la, ua[1] / la], eb = [ub[0] / lb, ub[1] / lb], ext = [Hs.value, -W];
          const det = ea[0] * eb[1] - ea[1] * eb[0]; if (Math.abs(det) < 1e-9) return null;
          const Ta = (-ext[0] * eb[1] + ext[1] * eb[0]) / det, Tb = (-ea[0] * ext[1] + ea[1] * ext[0]) / det;
          return { Ta, Tb, ea, eb, ext };
        };
        v.render(() => {
          if (mode.value === 'hang') {
            const t = tens();
            S.line(-4.8, 2.4, 4.8, 2.4, { color: 'muted', width: 1 }); for (let x = -4.8; x < 4.8; x += 0.3) S.line(x, 2.4, x + 0.2, 2.6, { color: 'muted', width: 1, alpha: 0.6 });
            hA.y = hB.y = 2.4;
            const ok = t && t.Ta >= 0 && t.Tb >= 0;
            S.line(K.x, K.y, hA.x, hA.y, { color: t && t.Ta < 0 ? 'red' : 'blue', width: 2.4, dash: t && t.Ta < 0 ? [5, 4] : null });
            S.line(K.x, K.y, hB.x, hB.y, { color: t && t.Tb < 0 ? 'red' : 'teal', width: 2.4, dash: t && t.Tb < 0 ? [5, 4] : null });
            S.line(K.x, K.y, K.x, K.y - 1.1, { color: 'ink', width: 1.5 });
            S.rect(K.x - 0.45, K.y - 1.9, K.x + 0.45, K.y - 1.1, { fill: 'gray', fillAlpha: 0.5, color: 'ink', width: 1.2, radius: 3 });
            S.text(`${W} kN`, K.x, K.y - 1.5, { align: 'center', size: 11, weight: 650, color: 'ink', halo: false });
            if (Math.abs(Hs.value) > 0.05) S.arrow(K.x - Math.sign(Hs.value) * 1.4, K.y, K.x - Math.sign(Hs.value) * 0.15, K.y, { color: 'orange', width: 2.4, head: 8 });
            if (t) {
              S.text(`${t.Ta.toFixed(1)} kN`, (K.x + hA.x) / 2, (K.y + hA.y) / 2, { dx: -8, align: 'right', size: 11, weight: 650, color: t.Ta < 0 ? 'red' : 'blue' });
              S.text(`${t.Tb.toFixed(1)} kN`, (K.x + hB.x) / 2, (K.y + hB.y) / 2, { dx: 8, size: 11, weight: 650, color: t.Tb < 0 ? 'red' : 'teal' });
              // polygon: W down, H, Ta, Tb back to start
              const sc = 3.4 / Math.max(W, Math.abs(t.Ta), Math.abs(t.Tb), 1) * (Math.max(W, Math.abs(t.Ta), Math.abs(t.Tb)) > 30 ? 1 : 1);
              let p = [0, 3.2 * Math.min(1, 10 / Math.max(10, Math.abs(t.Ta), Math.abs(t.Tb)))], start = p.slice();
              const seg = (vec, c, lab) => { const q = [p[0] + vec[0] * sc, p[1] + vec[1] * sc]; Fd.arrow(p[0], p[1], q[0], q[1], { color: c, width: 2.6, head: 9 }); Fd.text(lab, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, { dx: 9, size: 11.5, weight: 650, color: c }); p = q; };
              seg([0, -W], 'ink', 'W');
              if (Math.abs(Hs.value) > 0.05) seg([Hs.value, 0], 'orange', 'H');
              seg([t.ea[0] * t.Ta, t.ea[1] * t.Ta], t.Ta < 0 ? 'red' : 'blue', 'T_A'.replace('_', ''));
              seg([t.eb[0] * t.Tb, t.eb[1] * t.Tb], t.Tb < 0 ? 'red' : 'teal', 'T_B'.replace('_', ''));
              Fd.dot(start[0], start[1], { r: 4, color: 'green' });
              Fd.text(ok ? 'closes: equilibrium' : 'closes only with a pushing cable', 0, -4.6, { align: 'center', size: 12, weight: 700, color: ok ? 'green' : 'red' });
            }
          } else {
            // Stevin's wreath: prism with base from (-3, -1.6) to (3, -1.6), apex handle
            const b0 = [-3, -1.6], b1 = [3, -1.6], ap = [apex.x, apex.y];
            const L1 = Math.hypot(ap[0] - b0[0], ap[1] - b0[1]), L2 = Math.hypot(b1[0] - ap[0], b1[1] - ap[1]), h = ap[1] - b0[1];
            S.poly([b0, ap, b1], { fill: 'gray', fillAlpha: 0.2, color: 'ink', width: 1.6 });
            S.line(-4.5, -1.6, 4.5, -1.6, { color: 'muted', width: 1 });
            const beadR = 0.17, spacing = 0.36, n1 = Math.floor(L1 / spacing), n2 = Math.floor(L2 / spacing);
            const nrm = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [-dy / l, dx / l]; };
            const N1 = nrm(b0, ap), N2 = nrm(ap, b1);
            for (let k = 0; k < n1; k++) { const t = (k + 0.5) / n1, x = b0[0] + (ap[0] - b0[0]) * t + N1[0] * beadR, y = b0[1] + (ap[1] - b0[1]) * t + N1[1] * beadR; S.dot(x, y, { r: 6, color: 'blue' }); }
            for (let k = 0; k < n2; k++) { const t = (k + 0.5) / n2, x = ap[0] + (b1[0] - ap[0]) * t + N2[0] * beadR, y = ap[1] + (b1[1] - ap[1]) * t + N2[1] * beadR; S.dot(x, y, { r: 6, color: 'teal' }); }
            // hanging loop below (symmetric festoon)
            const loop = []; for (let k = 0; k <= 14; k++) { const t = k / 14; loop.push([-3 + 6 * t, -1.6 - 2.6 * Math.sin(Math.PI * t)]); }
            loop.forEach(([x, y], k) => { if (k > 0 && k < 14) S.dot(x, y, { r: 6, color: 'gray', alpha: 0.7 }); });
            S.text('the hanging loop is symmetric and cancels', 0, -3.9, { align: 'center', size: 11, color: 'muted' });
            // forces along slopes, per unit bead weight w
            const w = 1, F1 = w * L1 * (h / L1), F2 = w * L2 * (h / L2);
            const sc = 1.2;
            Fd.arrow(-2.4, 0, -2.4, -L1 * sc, { color: 'blue', width: 2.4, head: 8 }); Fd.text(`weight ∝ ${L1.toFixed(2)}`, -2.4, -L1 * sc, { dy: 12, align: 'center', size: 11, color: 'blue' });
            Fd.arrow(2.4, 0, 2.4, -L2 * sc, { color: 'teal', width: 2.4, head: 8 }); Fd.text(`weight ∝ ${L2.toFixed(2)}`, 2.4, -L2 * sc, { dy: 12, align: 'center', size: 11, color: 'teal' });
            Fd.rect(-3.4, 2.2, -1.4, 2.2 + F1 * sc, { fill: 'blue', fillAlpha: 0.45, color: 'blue', width: 1 }); Fd.rect(1.4, 2.2, 3.4, 2.2 + F2 * sc, { fill: 'teal', fillAlpha: 0.45, color: 'teal', width: 1 });
            Fd.text('pull along the slope = weight × sin α', 0, 1.6, { align: 'center', size: 11, color: 'ink' });
            Fd.text(`${F1.toFixed(2)}`, -2.4, 2.2 + F1 * sc, { dy: -10, align: 'center', size: 11.5, weight: 700, color: 'blue' });
            Fd.text(`${F2.toFixed(2)}`, 2.4, 2.2 + F2 * sc, { dy: -10, align: 'center', size: 11.5, weight: 700, color: 'teal' });
          }
          v.legend(mode.value === 'hang' ? [['blue', 'cable A'], ['teal', 'cable B'], ['orange', 'sideways push'], ['red', 'impossible (cable in compression)', { dash: true }]] : [['blue', 'beads on the left slope', { dot: true }], ['teal', 'beads on the right slope', { dot: true }]]);
        });
        v.readout(() => {
          if (mode.value === 'stevin') {
            const L1 = Math.hypot(apex.x + 3, apex.y + 1.6), L2 = Math.hypot(3 - apex.x, apex.y + 1.6), h = apex.y + 1.6;
            return `Slopes ${L1.toFixed(2)} and ${L2.toFixed(2)} (ratio ${(L1 / L2).toFixed(3)}), height ${h.toFixed(2)} · pulls along the slopes: L₁ sin α₁ = **${(L1 * (h / L1)).toFixed(3)}**, L₂ sin α₂ = **${(L2 * (h / L2)).toFixed(3)}**: equal, so the wreath stays still.`;
          }
          const t = tens(); if (!t) return 'The two cables are in line: no finite tensions can hold the weight.';
          const res = [t.ea[0] * t.Ta + t.eb[0] * t.Tb + t.ext[0], t.ea[1] * t.Ta + t.eb[1] * t.Tb + t.ext[1]];
          const ang = (p, q) => Math.acos(Math.max(-1, Math.min(1, p[0] * q[0] + p[1] * q[1])));
          const ew = [t.ext[0], t.ext[1]], lw = Math.hypot(...ew), e3 = [ew[0] / lw, ew[1] / lw];
          const lam = [t.Ta / Math.sin(ang(t.eb, e3)), t.Tb / Math.sin(ang(t.ea, e3)), lw / Math.sin(ang(t.ea, t.eb))];
          return `T_A = **${t.Ta.toFixed(2)} kN**, T_B = **${t.Tb.toFixed(2)} kN** · polygon closure error ${Math.hypot(...res).toExponential(1)} kN · Lami: T/sin(opposite angle) = ${lam.map((x) => x.toFixed(2)).join(' = ')}${t.Ta < 0 || t.Tb < 0 ? ' · **a cable would have to push**: this configuration cannot hang.' : ''}`;
        });
        vis();
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Method',
      name: 'The funicular polygon (Varignon)',
      statement: String.raw`Given vertical loads $P_1,\dots,P_n$ at positions $x_1 < \dots < x_n$, draw them nose to tail as a vertical **load line** and choose any **pole** $O$. The rays from $O$ to the ends of the load segments give the directions of the successive segments of a **funicular (string) polygon**: a weightless string with those directions, starting from a support, carries the loads in pure tension, and the length of each ray is the force in that segment. Its horizontal distance from the load line is the constant horizontal thrust $H$.

Moving the pole sideways changes $H$ and with it the depth of the polygon; moving it up or down tilts the polygon. Every choice is a valid equilibrium shape. Placing the pole level with the point where the load line is divided in the ratio of the reactions makes the string end at the same height it started, and putting the pole on the other side turns the hanging polygon into an **arch** in pure compression.`,
      idea: String.raw`At each load point three forces meet: the two segment forces and the load. Their force triangle (1.4) is exactly the triangle formed by two neighbouring rays and the load segment between them, so building all the triangles on one shared pole gives every node's equilibrium at once. Horizontally, nothing but the string acts, so every segment carries the same horizontal force $H$. Vertically, each segment's slope is (shear)/$H$, so the polygon is the bending-moment diagram of a simply supported beam with the same loads, divided by $H$. Hooke saw that turning the string upside down gives an arch that stands in compression ("as hangs the flexible line, so but inverted will stand the rigid arch"; arch-3.13).`,
      caption: String.raw`Drag the four weights left and right along the string, change their sizes by dragging the division points on the load line (right), and drag the pole **O**. Pulling O away from the load line raises the thrust $H$ and flattens the string. With "close on the supports" off, O moves freely and the string ends above or below B; the dashed closing line then splits the load into the two reactions. Flip to the arch: the same polygon, inverted, carries the same loads in compression.`,
      deps: ['arch-1.4'],
      see: ['arch-3.13', 'mech-5.11', 'solid-9.8'],
      refs: ['Allen & Zalewski'],
      credit: 'Varignon, 1725; Hooke, 1676',
      tags: ['graphic statics', 'funicular'],
      viz(v) {
        const close = v.toggle('close on the supports', true);
        const arch = v.toggle('flip to an arch', false);
        const S = v.stage({ x: [-0.8, 12.8], y: [-6.3, 6.3], equal: true, axes: false, height: 380, weight: 1.45, title: 'space diagram (m)' });
        const Fd = v.stage({ x: [-2.2, 7.6], y: [-0.8, 9.6], equal: true, axes: false, height: 380, weight: 1, minWidth: 240, title: 'force diagram (1 square = 10 kN)' });
        const LX = 12, SC = 10; // span (m); kN per force-diagram unit
        const COLS = ['orange', 'purple', 'pink', 'gold'];
        const wx = [2.2, 4.6, 7.8, 10.0].map((x, i) => S.handle(x, 0, { color: COLS[i], constrain: (px) => [Math.max(0.4, Math.min(LX - 0.4, px)), 0] }));
        // load line divisions (top of load line at y = sum)
        const init = [3, 2, 4, 2.5];
        const div = [0, 1, 2].map((i) => Fd.handle(0, init.slice(i + 1).reduce((a, b) => a + b, 0), { color: COLS[i + 1], constrain: (x, y) => [0, y] }));
        const top = Fd.handle(0, init.reduce((a, b) => a + b, 0), { color: COLS[0], constrain: (x, y) => [0, Math.max(0.6, Math.min(9.4, y))] });
        const pole = Fd.handle(3.6, 5, { color: 'accent', label: 'O', constrain: (x, y) => [Math.max(0.5, Math.min(7.2, Math.abs(x))) * (arch.value ? -1 : 1), y] });
        pole.labelPos = 'e';
        const state = () => {
          const ord = wx.map((h, i) => ({ x: h.x, i })).sort((a, b) => a.x - b.x);
          // keep division points ordered and inside the load line
          let ys = [top.y, ...div.map((d) => d.y), 0];
          for (let k = 1; k < 4; k++) ys[k] = Math.max(0.05 * (4 - k), Math.min(ys[k - 1] - 0.05, ys[k]));
          div.forEach((d, k) => { d.y = ys[k + 1]; });
          const P = [0, 1, 2, 3].map((k) => (ys[k] - ys[k + 1]) * SC); // kN, load k belongs to weight k (by index)
          const loads = ord.map(({ x, i }) => ({ x, P: P[i], i }));
          const tot = P.reduce((a, b) => a + b, 0), Rb = loads.reduce((a, l) => a + l.P * l.x, 0) / LX, Ra = tot - Rb;
          const cY = (tot - Ra) / SC; // load-line point that splits the reactions (top is at tot/SC)
          if (close.value) pole.y = cY;
          pole.x = Math.max(0.5, Math.abs(pole.x)) * (arch.value ? -1 : 1);
          const H = pole.x * SC; // signed: + hanging (tension), − arch (compression)
          // load line points in the order the loads are met along the string
          const pts = [tot / SC]; for (const l of loads) pts.push(pts[pts.length - 1] - l.P / SC);
          // polygon: start at A (0,0); slope of segment k = −(pts[k] − pole.y) / pole.x
          const poly = [[0, 0]]; let x = 0, y = 0;
          for (let k = 0; k <= loads.length; k++) { const xn = k < loads.length ? loads[k].x : LX, sl = -(pts[k] - pole.y) / pole.x; y += sl * (xn - x); x = xn; poly.push([x, y]); }
          return { loads, P, tot, Ra, Rb, H, pts, poly, cY };
        };
        v.render(() => {
          const st = state(), { loads, poly, pts } = st, comp = arch.value;
          // supports and closing line
          drawSupport(v, S, 0, comp ? 0 : 0, 'pin'); drawSupport(v, S, LX, 0, 'pin');
          const end = poly[poly.length - 1];
          if (Math.abs(end[1]) > 1e-6) { S.line(0, 0, LX, end[1], { color: 'muted', dash: [6, 4], width: 1.2 }); S.dot(LX, end[1], { r: 4, hollow: true, color: 'red' }); S.text('string ends here', LX, end[1], { dx: -6, dy: end[1] > 0 ? -12 : 12, align: 'right', size: 10.5, color: 'red' }); }
          // segments
          for (let k = 0; k + 1 < poly.length; k++) {
            const T = Math.hypot(st.H, (pts[k] - pole.y) * SC);
            S.line(poly[k][0], poly[k][1], poly[k + 1][0], poly[k + 1][1], { color: comp ? 'blue' : 'red', width: 2 + 4 * T / Math.max(60, st.tot * 1.5) });
          }
          // loads hanging from (or pressing on) the nodes
          loads.forEach((l, k) => {
            const [x, y] = poly[k + 1], len = l.P / SC * 0.6;
            S.arrow(x, y + (comp ? len + 0.25 : 0), x, y + (comp ? 0.2 : -len), { color: COLS[l.i], width: 2.6, head: 8 });
            S.text(`${l.P.toFixed(0)} kN`, x, comp ? y + len + 0.5 : y - len - 0.35, { align: 'center', size: 10.5, weight: 650, color: COLS[l.i] });
            wx[l.i].y = 0; // handles stay on the axis (drag horizontally); the node is drawn at its true height
            S.line(x, 0, x, y, { color: COLS[l.i], width: 0.8, dash: [2, 3], alpha: 0.6 });
          });
          S.line(-0.5, 0, LX + 0.5, 0, { color: 'faint', width: 1 });
          if (comp) S.text('“as hangs the flexible line, so but inverted will stand the rigid arch” (Hooke)', LX / 2, -5.8, { align: 'center', size: 11, color: 'muted' });
          // force diagram: grid, load line, rays
          for (let gx = -2; gx <= 7; gx++) Fd.line(gx, -0.5, gx, 9.4, { color: 'grid', width: 1 });
          for (let gy = 0; gy <= 9; gy++) Fd.line(-2.1, gy, 7.5, gy, { color: 'grid', width: 1 });
          loads.forEach((l, k) => Fd.line(0, pts[k], 0, pts[k + 1], { color: COLS[l.i], width: 4 }));
          pts.forEach((p, k) => Fd.line(pole.x, pole.y, 0, p, { color: comp ? 'blue' : 'red', width: 1.6, alpha: 0.85 }));
          Fd.line(pole.x, pole.y, 0, st.cY, { color: 'muted', width: 1.2, dash: [5, 4] });
          Fd.dot(0, st.cY, { r: 3.5, color: 'muted' });
          Fd.text(`R_A = ${st.Ra.toFixed(1)} kN`.replace('_', ''), 0, (pts[0] + st.cY) / 2, { dx: -8, align: 'right', size: 10.5, color: 'green' });
          Fd.text(`R_B = ${st.Rb.toFixed(1)} kN`.replace('_', ''), 0, st.cY / 2, { dx: -8, align: 'right', size: 10.5, color: 'green' });
          Fd.text(`H = ${Math.abs(st.H).toFixed(1)} kN`, pole.x / 2, pole.y, { dy: -10, align: 'center', size: 11, weight: 650, color: 'accent' });
          v.legend([[comp ? 'blue' : 'red', comp ? 'arch in compression' : 'string in tension'], ['muted', 'closing line', { dash: true }], ['orange', 'loads (one colour each)']]);
        });
        v.readout(() => {
          const st = state(), { poly, loads, pts } = st;
          // independent check: equilibrium at every node with the segment forces read from the rays
          let worst = 0;
          loads.forEach((l, k) => {
            const seg = (j) => { const dx = poly[j + 1][0] - poly[j][0], dy = poly[j + 1][1] - poly[j][1], L = Math.hypot(dx, dy), T = Math.hypot(st.H, (pts[j] - pole.y) * SC) * Math.sign(st.H); return [T * dx / L, T * dy / L]; };
            const a = seg(k), b = seg(k + 1), f = [b[0] - a[0], b[1] - a[1] - l.P]; worst = Math.max(worst, Math.hypot(...f));
          });
          const sag = Math.max(...poly.map((p) => Math.abs(p[1])));
          const Tmax = Math.max(...pts.map((p) => Math.hypot(st.H, (p - pole.y) * SC)));
          return `${st.H > 0 ? 'Tension' : 'Compression'}: thrust H = **${Math.abs(st.H).toFixed(1)} kN**, largest segment force ${Tmax.toFixed(1)} kN, ${st.H > 0 ? 'sag' : 'rise'} ${sag.toFixed(2)} m (H × ${st.H > 0 ? 'sag' : 'rise'} = ${(Math.abs(st.H) * sag).toFixed(1)} kN·m = the largest beam moment of the same loads) · worst node imbalance ${worst.toExponential(1)} kN.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Concept',
      name: 'Tension, compression and bending',
      statement: String.raw`A member carries load in one of three basic ways. In **tension** (a rope, a hanger) or **compression** (a column, a strut, an arch) the internal force runs along the member and, away from its ends, spreads almost uniformly over the cross-section: $\sigma = N/A$. In **bending** (a beam, a plank) the load crosses the member; the internal bending moment $M$ is resisted by compression on one face and tension on the other, varying linearly through the depth: $\sigma = -My/I$, with the largest value $Mc/I$ at the outer fibres and none at the middle. A load applied off-centre on a column combines the two, $\sigma = -P/A \mp Pe\,y/I$; for a rectangle no tension appears while the eccentricity stays within the **middle third** ($e \le d/6$).

For the same load, span and cross-section, bending stresses are far larger than axial ones, which is why the most efficient structures shape themselves so that loads travel along their axis (cables, arches, trusses, shells).`,
      idea: String.raw`Cut the member and apply equilibrium (1.2) to one piece. A rope or strut can only transmit a force along itself, and the uniform stress $N/A$ follows from spreading it evenly. In a beam the cut face must supply a moment $M$ with no net axial force. If plane sections stay plane (solid-6.3) the strain, and so the stress, varies linearly from one face to the other, and the couple of the two stress wedges equals $M$. Compare a rope with sag $f$ and a beam of depth $d$ carrying the same point load at mid-span: the ratio of the largest stresses is about $6f/d$, so a rope sagging a tenth of its span carries the load with roughly a twentieth of the beam's peak stress.`,
      caption: String.raw`Choose a rope, an arch, a column or a plank, all with the same 100 × 200 mm section, and set the load. Colour shows stress, red for tension and blue for compression, on one scale for all four, so the plank glows hottest. For the plank, drag the load and the dashed **cut**: the right panel plots the stress across the depth there, linear through zero. For the column, move the load off-centre: once it leaves the middle third, tension appears on the far face.`,
      deps: ['arch-1.2', 'solid-1.1'],
      see: ['solid-6.1', 'solid-6.4'],
      refs: ['Salvadori'],
      tags: ['stress', 'members'],
      viz(v) {
        const mode = v.select('member', [{ value: 'rope', label: 'rope (tension)' }, { value: 'arch', label: 'arch (compression)' }, { value: 'col', label: 'column' }, { value: 'beam', label: 'plank (bending)' }], 'beam', { onChange: () => vis() });
        const P = v.slider('load P (kN)', 1, 40, 12, { step: 0.5 });
        const fS = v.slider('sag / rise f (m)', 0.1, 1.6, 0.4, { step: 0.01 });
        const eS = v.slider('eccentricity e (mm)', 0, 100, 20, { step: 1 });
        const A = v.stage({ x: [-0.7, 4.7], y: [-2.2, 2.4], equal: true, axes: false, height: 340, weight: 1.5 });
        const B = v.stage({ x: [-60, 60], y: [-100, 100], axes: 'box', gutter: { l: 46 }, height: 340, weight: 0.85, minWidth: 220, xlabel: 'stress (MPa)', ylabel: 'height in section (mm)', title: 'stress across the section' });
        const b = 0.1, d = 0.2, Ar = b * d, I = (b * d ** 3) / 12, Lb = 4, DS = 0.5 / d; // DS: depth drawn ×2.5
        const hLoad = A.handle(1.4, 0.95, { color: 'orange', constrain: (x) => [Math.max(0.2, Math.min(3.8, x)), 0.95] });
        const hCut = A.handle(1.4, -0.7, { color: 'accent', constrain: (x) => [Math.max(0.05, Math.min(3.95, x)), -0.7] });
        function vis() { const m = mode.value; fS.el.hidden = !(m === 'rope' || m === 'arch'); eS.el.hidden = m !== 'col'; hLoad.visible = hCut.visible = m === 'beam'; }
        const axial = () => { const th = Math.atan2(fS.value, Lb / 2); return (P.value / (2 * Math.sin(th))) / Ar / 1000; }; // MPa
        const Mx = (x) => { const a = hLoad.x, Ra = (P.value * (Lb - a)) / Lb; return x < a ? Ra * x : Ra * x - P.value * (x - a); };
        const sigBeam = (x, y) => (-Mx(x) * y) / I / 1000;                 // y in m (up), MPa
        const sigCol = (y) => (-P.value / Ar - (P.value * (eS.value / 1000) * y) / I) / 1000;
        const scaleMax = () => { const M = Math.max(...v.M.linspace(0, Lb, 81).map((x) => Math.abs(Mx(x)))); return Math.max(1, (M * (d / 2)) / I / 1000, axial(), Math.abs(sigCol(d / 2)), Math.abs(sigCol(-d / 2))); };
        v.render(() => {
          const m = mode.value, smax = Math.max(scaleMax(), 0.5 * (40 * Lb / 4) * (d / 2) / I / 1000 * 0 + 1), col = (sg) => v.diverge(Math.max(-1, Math.min(1, sg / smax)));
          let prof = null;
          if (m === 'rope' || m === 'arch') {
            const f = fS.value, s = m === 'rope' ? -1 : 1, base = m === 'rope' ? 1.6 : -1.2, apex = [2, base + s * f], sg = (m === 'rope' ? 1 : -1) * axial();
            for (const p of [[0, base], [4, base]]) { A.line(p[0], p[1], apex[0], apex[1], { color: col(sg), width: m === 'rope' ? 6 : 12 }); drawSupport(v, A, p[0], p[1], 'pin'); }
            A.arrow(2, apex[1] + (m === 'rope' ? -0.05 : 1.0), 2, apex[1] + (m === 'rope' ? -1.0 : 0.12), { color: 'orange', width: 2.6, head: 9 });
            A.text(`P = ${P.value} kN`, 2.15, apex[1] + (m === 'rope' ? -0.75 : 0.75), { size: 11, weight: 650, color: 'orange' });
            A.text(`${m === 'rope' ? 'tension' : 'compression'} ${(axial() * Ar * 1000).toFixed(1)} kN in each half`, 2, m === 'rope' ? 2.15 : -1.85, { align: 'center', size: 11.5, weight: 650, color: m === 'rope' ? 'red' : 'blue' });
            prof = (y) => sg;
          } else if (m === 'col') {
            const W = 0.3; // half-width drawn (×3)
            A.raster((x, y) => { if (x < 2 - W || x > 2 + W || y < -1.6 || y > 1.6) return null; const yy = ((x - 2) / W) * (d / 2); return col(sigCol(yy)); }, { res: 2, key: `col${P.value}|${eS.value}|${smax}` });
            A.rect(2 - W, -1.6, 2 + W, 1.6, { color: 'ink', width: 1.2 });
            const ex = 2 + (eS.value / 1000 / (d / 2)) * W;
            A.arrow(ex, 2.3, ex, 1.65, { color: 'orange', width: 2.6, head: 9 });
            A.line(2 - W / 3, 1.6, 2 - W / 3, -1.6, { color: 'green', dash: [3, 4], width: 1 }); A.line(2 + W / 3, 1.6, 2 + W / 3, -1.6, { color: 'green', dash: [3, 4], width: 1 });
            A.text('middle third', 2, -1.85, { align: 'center', size: 10.5, color: 'green' });
            drawSupport(v, A, 2, -1.6, 'fixed');
            A.text('section drawn 3× wider', 3.3, 1.9, { size: 10.5, color: 'muted' });
            prof = (y) => sigCol(y);
          } else {
            A.raster((x, y) => { if (x < 0 || x > Lb || Math.abs(y) > d / 2 * DS) return null; return col(sigBeam(x, y / DS)); }, { res: 2, key: `bm${P.value}|${hLoad.x}|${smax}` });
            A.rect(0, -d / 2 * DS, Lb, d / 2 * DS, { color: 'ink', width: 1.2 });
            drawSupport(v, A, 0, -d / 2 * DS, 'pin'); drawSupport(v, A, Lb, -d / 2 * DS, 'roller');
            A.arrow(hLoad.x, 0.95, hLoad.x, d / 2 * DS + 0.05, { color: 'orange', width: 2.6, head: 9 });
            A.text(`P = ${P.value} kN`, hLoad.x + 0.12, 1.1, { size: 11, weight: 650, color: 'orange' });
            // moment diagram below
            const Mm = Math.max(1e-6, ...v.M.linspace(0, Lb, 81).map((x) => Math.abs(Mx(x)))), ms = 0.7 / Mm, y0 = -1.15;
            A.path([[0, y0], ...v.M.linspace(0, Lb, 81).map((x) => [x, y0 - Mx(x) * ms]), [Lb, y0]], { fill: 'purple', fillAlpha: 0.18, color: 'purple', width: 1.5, close: true });
            A.text(`bending moment, max ${Mm.toFixed(1)} kN·m`, Lb + 0.05, y0 - 0.1, { align: 'right', dy: 0, size: 10.5, color: 'purple' });
            A.line(hCut.x, d / 2 * DS + 0.1, hCut.x, -0.7, { color: 'accent', dash: [4, 3], width: 1.4 });
            A.text('tension below, compression above', 2, 1.75, { align: 'center', size: 10.5, color: 'muted' });
            prof = (y) => sigBeam(hCut.x, y);
          }
          // section profile
          const lim = Math.max(2, smax) * 1.12; B.setView([-lim, lim], [-100, 100]);
          for (let k = 0; k < 20; k++) { const y0 = -100 + k * 10, ym = y0 + 5, sg = prof(ym / 1000); B.rect(0, y0 + 0.8, sg, y0 + 9.2, { fill: sg > 0 ? 'red' : 'blue', fillAlpha: 0.55, stroke: false }); }
          B.vline(0, { color: 'muted', width: 1 });
          const top = prof(0.1), bot = prof(-0.1);
          B.text(`${top.toFixed(1)}`, top, 96, { align: top > 0 ? 'left' : 'right', dx: top > 0 ? 4 : -4, size: 10.5, weight: 650, color: top > 0 ? 'red' : 'blue' });
          B.text(`${bot.toFixed(1)}`, bot, -96, { align: bot > 0 ? 'left' : 'right', dx: bot > 0 ? 4 : -4, size: 10.5, weight: 650, color: bot > 0 ? 'red' : 'blue' });
          v.legend([['red', 'tension', { area: true }], ['blue', 'compression', { area: true }], ['orange', 'load']]);
        });
        v.readout(() => {
          const m = mode.value, f0 = 0.4, th = Math.atan2(f0, Lb / 2), sRope = (P.value / (2 * Math.sin(th))) / Ar / 1000, sBeam = ((P.value * Lb) / 4) * (d / 2) / I / 1000;
          if (m === 'col') { const st = sigCol(-d / 2), sc = sigCol(d / 2), e = eS.value; return `Column: σ = −P/A ∓ Pe·y/I → faces **${sc.toFixed(2)}** and **${st.toFixed(2)} MPa**${st > 1e-9 ? ' — **tension** appears: the load is outside the middle third (e > d/6 = 33 mm)' : ` — all compression (e = ${e} mm ≤ 33 mm)`}.`; }
          if (m === 'beam') { const Mc = Mx(hCut.x); return `Plank: M = ${Mc.toFixed(2)} kN·m at the cut → σ = ∓My/I = **±${Math.abs(Mc * (d / 2) / I / 1000).toFixed(2)} MPa** at the faces, 0 on the middle line. With the load at mid-span the peak is ${sBeam.toFixed(1)} MPa, against ${sRope.toFixed(2)} MPa in a rope of the same section sagging 0.4 m: ${(sBeam / sRope).toFixed(0)} times more (6f/d = ${(6 * f0 / d).toFixed(0)}).`; }
          return `${m === 'rope' ? 'Rope' : 'Arch'}: ${m === 'rope' ? 'tension' : 'compression'} N = P/(2 sin θ) = ${(axial() * Ar * 1000).toFixed(1)} kN → uniform σ = **${axial().toFixed(2)} MPa**; a plank of the same section, loaded at mid-span, would peak at ${sBeam.toFixed(1)} MPa. Flatten it (small f) and the axial force grows without bound.`;
        });
        vis();
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7',
      kind: 'Concept',
      name: 'Building materials compared',
      statement: String.raw`Structural materials differ by orders of magnitude in strength, stiffness and density, and many are far stronger one way than the other. Typical values:
- **stone, brick, earth and plain concrete** are strong in compression (stone 30–250 MPa, concrete 20–50 MPa) but weak and brittle in tension, roughly a tenth as strong;
- **timber and bamboo** are light and good along the grain in tension, compression and bending;
- **steel** is strong and equally good in tension and compression ($\approx$ 235–460 MPa for structural grades, 1,600–2,000 MPa for cable wire) but heavy;
- **glass** is very strong in compression but fails in tension at flaws;
- **fabrics and cables** work only in tension.

Plotted on log–log axes of strength (or stiffness) against density, materials form families (Ashby charts). Lines of constant $\sigma/\rho$ compare them per unit weight: the **breaking length** $\sigma/(\rho g)$ is how tall a column, or how long a hanging cable, could be before failing under its own weight.`,
      idea: String.raw`What a material is good for follows from where it sits on these charts and from which stress it tolerates (1.6). Masonry's high compressive and negligible tensile strength is why historic structures were shaped so that every part stays in compression: arches, vaults and domes. Steel's tensile strength made cables and frames possible, and reinforced concrete puts steel exactly where concrete would crack in tension. Dividing by density matters because large structures mostly carry their own weight. A stone column could rise about 5 km before crushing itself, and steel cable wire could hang over 20 km. These are typical ranges (compare mat-1.7 and solid-1.3), not design values.`,
      caption: String.raw`Choose tensile strength, compressive strength or stiffness. Each bubble spans a material's typical range of density and property on log–log axes; materials that cannot carry that kind of load drop off the chart. **Click** a material for its numbers, its breaking length and its typical uses. Drag the green point to move the line of constant property per unit weight: materials above the line beat it weight for weight.`,
      deps: ['arch-1.6', 'solid-1.3'],
      see: ['mat-1.7'],
      refs: ['Salvadori'],
      tags: ['materials', 'Ashby charts'],
      viz(v) {
        // [name, family colour, ρ (kg/m³), tensile (MPa), compressive (MPa), E (GPa), uses]
        const MAT = [
          ['structural steel', 'blue', [7750, 7950], [235, 460], [235, 460], [200, 210], 'tension, compression and bending: frames, trusses'],
          ['steel cable', 'blue', [7750, 7950], [1570, 1960], null, [160, 200], 'tension only: suspension and cable-stayed bridges'],
          ['aluminium', 'teal', [2650, 2800], [150, 300], [150, 300], [68, 72], 'light frames and cladding'],
          ['concrete', 'gray', [2250, 2450], [2.2, 4.1], [20, 50], [30, 37], 'compression; reinforced with steel for bending'],
          ['granite', 'orange', [2600, 2800], [7, 25], [100, 250], [40, 70], 'compression: walls, piers, arches'],
          ['limestone', 'orange', [2200, 2700], [3, 15], [30, 250], [20, 70], 'compression: walls, vaults, domes'],
          ['sandstone', 'orange', [2000, 2600], [2, 10], [20, 170], [10, 40], 'compression: walls and arches'],
          ['fired brick', 'red', [1700, 2100], [1, 4], [10, 100], [5, 25], 'compression: walls, vaults'],
          ['earth (adobe)', 'red', [1500, 2000], [0.1, 0.5], [1, 5], [0.3, 1.5], 'compression: low walls'],
          ['timber (along grain)', 'green', [400, 600], [15, 100], [20, 50], [8, 14], 'bending and compression: beams, posts, roofs'],
          ['bamboo', 'green', [600, 800], [100, 250], [40, 80], [10, 20], 'tension and bending: scaffolds, light frames'],
          ['glass', 'teal', [2450, 2550], [30, 120], [500, 1000], [70, 74], 'compression; brittle in tension'],
          ['CFRP', 'purple', [1500, 1650], [1500, 2800], [800, 1200], [150, 200], 'tension: strengthening, stays'],
          ['PTFE–glass fabric', 'pink', [1800, 2050], [150, 250], null, null, 'tension only: membrane roofs'],
        ];
        const prop = v.select('property', [{ value: 3, label: 'tensile strength' }, { value: 4, label: 'compressive strength' }, { value: 5, label: 'stiffness E' }], 3);
        const s = v.stage({ x: [300, 12000], y: [0.05, 6000], xlog: true, ylog: true, axes: 'box', gutter: true, height: 440, full: true, xlabel: 'density (kg/m³)', ylabel: 'strength (MPa)' });
        const gH = s.handle(1000, 60, { color: 'green', label: 'σ/ρ' });
        let sel = 'fired brick';
        const gm = (r) => Math.sqrt(r[0] * r[1]);
        s.onClick((x, y) => {
          let best = null, bd = 0.35; const k = prop.value;
          for (const m of MAT) { if (!m[k]) continue; const dd = Math.hypot(Math.log10(x / gm(m[2])), Math.log10(y / gm(m[k]))); if (dd < bd) { bd = dd; best = m; } }
          if (best) sel = best[0];
        });
        let lastK = null;
        v.render(() => {
          const k = prop.value, E = k === 5;
          if (lastK !== k) { lastK = k; s.setView([300, 12000], E ? [0.1, 600] : [0.05, 6000]); s.setLabels(undefined, E ? 'Young’s modulus E (GPa)' : `${k === 3 ? 'tensile' : 'compressive'} strength (MPa)`); gH.set(1000, E ? 20 : 60); }
          // guide line (slope 1)
          const c = gH.y / gH.x; s.fn((x) => c * x, { color: 'green', width: 1.4, dash: [6, 4] });
          const lab = [];
          for (const m of MAT) {
            const r = m[k]; if (!r) continue;
            const cx = Math.log10(gm(m[2])), cy = Math.log10(gm(r)), ax = Math.max(0.035, Math.log10(m[2][1] / m[2][0]) / 2), ay = Math.max(0.05, Math.log10(r[1] / r[0]) / 2), on = m[0] === sel;
            s.curve((t) => [10 ** (cx + ax * Math.cos(t)), 10 ** (cy + ay * Math.sin(t))], 0, 2 * Math.PI, { n: 48, fill: m[1], fillAlpha: on ? 0.55 : 0.28, color: m[1], width: on ? 2.4 : 1.2 });
            lab.push({ x: 10 ** cx, y: 10 ** cy, text: m[0], r: Math.max(5, ay * s.sy * 0.9), size: on ? 12 : 10.5, weight: on ? 700 : 500, color: on ? m[1] : 'ink' });
          }
          lab.sort((p, q) => (q.text === sel) - (p.text === sel));
          placeLabels(v, s, lab);
          const off = MAT.filter((m) => !m[k]).map((m) => m[0]);
          if (off.length) s.corner(`not shown (cannot carry this): ${off.join(', ')}`, 'br', { size: 11, color: 'red' });
          v.legend([['blue', 'steel', { area: true }], ['orange', 'stone', { area: true }], ['red', 'brick, earth', { area: true }], ['gray', 'concrete', { area: true }], ['green', 'timber, bamboo', { area: true }], ['teal', 'aluminium, glass', { area: true }], ['purple', 'composites', { area: true }], ['pink', 'fabric', { area: true }]]);
        });
        v.readout(() => {
          const k = prop.value, m = MAT.find((q) => q[0] === sel), fmtR = (r, u) => (r ? `${r[0]}–${r[1]} ${u}` : 'none');
          const bl = (r) => (r ? `${((gm(r) * 1e6) / (gm(m[2]) * G) / 1000).toFixed(gm(r) * 1e6 / (gm(m[2]) * G) < 1000 ? 2 : 1)} km` : '—');
          const better = MAT.filter((q) => q[k] && gm(q[k]) / gm(q[2]) > gH.y / gH.x).map((q) => q[0]);
          return `**${m[0]}**: ρ ${m[2][0]}–${m[2][1]} kg/m³ · tension ${fmtR(m[3], 'MPa')} · compression ${fmtR(m[4], 'MPa')} · E ${fmtR(m[5], 'GPa')} · breaking length in tension ${bl(m[3])}, in compression ${bl(m[4])} · uses: ${m[6]}. · Above the green line (${k === 5 ? 'E' : 'σ'}/ρ > ${(gH.y / gH.x * (k === 5 ? 1e6 : 1e3)).toFixed(k === 5 ? 1 : 0)} ${k === 5 ? 'MJ/kg ×10⁻³' : 'kJ/kg'}): ${better.length ? better.join(', ') : 'none'}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8',
      kind: 'Concept',
      name: 'Load paths through a building',
      statement: String.raw`Every load must be carried continuously to the ground: floor slabs pass their load to beams, beams to columns or walls, columns down through the storeys to foundations, and foundations into the soil. This chain is the **load path**, and at every step each element must be in equilibrium (1.2) and strong enough. Lateral loads (wind, earthquake) need their own path, through frames, walls or bracing. A structure is **robust** if, when one element is lost, the load can find an alternative path. Rigidly connected (moment-resisting) frames can bridge over a missing column by bending; frames with simple pinned beam connections cannot, and a local failure can become a progressive collapse, as at Ronan Point in 1968.`,
      idea: String.raw`The frame is solved as a whole: each joint is in equilibrium and the members deform compatibly, as in an indeterminate structure (1.3), so loads follow the stiffest available route. Removing a column changes the topology. With rigid joints the beams above the gap act together as a Vierendeel frame, carrying the load sideways in bending to the neighbouring columns, at the price of much larger moments. With pinned joints a beam cannot carry load at an end that has lost its support, and the column line above the gap simply hangs with nothing to hold it: a mechanism. The base reactions always add up to the total load, whatever route it takes.`,
      caption: String.raw`A three-bay, three-storey concrete frame. **Click a column** to remove it (or restore it), and **click a floor beam** to select it, then switch to "selected floor only" to follow that floor's load alone down to the ground. Column thickness shows axial force; the purple shapes on the beams are bending moments, and members past their capacity glow red. Switch the joints to pinned and remove a column: the load has no other path.`,
      deps: ['arch-1.2', 'arch-1.1', 'arch-1.3'],
      refs: ['Salvadori'],
      tags: ['load path', 'robustness'],
      viz(v) {
        const joints = v.select('joints', [{ value: 'rigid', label: 'rigid (moment frame)' }, { value: 'pinned', label: 'pinned beam ends' }], 'rigid');
        const show = v.select('loads', [{ value: 'all', label: 'all floors' }, { value: 'sel', label: 'selected floor only' }], 'all');
        const removed = new Set(['c-1-0']);
        let selBeam = 'b-1-2';
        v.button('restore all columns', () => removed.clear());
        const s = v.stage({ x: [-3.2, 21.2], y: [-2.6, 12.4], equal: true, axes: false, height: 440, full: true });
        const BX = [0, 6, 12, 18], LY = [0, 3.5, 7, 10.5], WF = 40, WR = 25, MCAP = 300, NCAP = 2500;
        const nodes = []; for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) nodes.push({ x: BX[i], y: LY[j] });
        const id = (i, j) => j * 4 + i;
        s.onClick((x, y) => {
          let best = null, bd = 0.7;
          const segD = (ax, ay, bx, by) => { const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2))); return Math.hypot(x - ax - t * (bx - ax), y - ay - t * (by - ay)); };
          for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const dd = segD(BX[i], LY[j], BX[i], LY[j + 1]); if (dd < bd) { bd = dd; best = `c-${i}-${j}`; } }
          for (let j = 1; j < 4; j++) for (let i = 0; i < 3; i++) { const dd = segD(BX[i], LY[j], BX[i + 1], LY[j]); if (dd < bd) { bd = dd; best = `b-${i}-${j}`; } }
          if (!best) return;
          if (best[0] === 'c') { if (removed.has(best)) removed.delete(best); else removed.add(best); } else selBeam = best;
        });
        function analyse() {
          const pin = joints.value === 'pinned', el = [];
          for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const key = `c-${i}-${j}`; if (!removed.has(key)) el.push({ key, i: id(i, j), j: id(i, j + 1), EA: 2.7e6, EI: 2.0e4 }); }
          for (let j = 1; j < 4; j++) for (let i = 0; i < 3; i++) { const key = `b-${i}-${j}`, w = j === 3 ? WR : WF; el.push({ key, i: id(i, j), j: id(i + 1, j), EA: 4.5e6, EI: 9.4e4, q: show.value === 'sel' && key !== selBeam ? 0 : -w, relI: pin, relJ: pin }); }
          const sup = { 0: [1, 1, 1], 1: [1, 1, 1], 2: [1, 1, 1], 3: [1, 1, 1] };
          const sol = frameSolve(nodes, el, sup, {});
          const total = el.reduce((acc, e) => acc - e.q * 6, 0);
          for (const e of sol.el) {
            const xs = v.M.linspace(0, e.L, 25), F = xs.map((x) => internal(e, x));
            e.Mmax = Math.max(...F.map((f) => Math.abs(f.M))); e.N = internal(e, 0).N;
            e.util = e.key[0] === 'b' ? e.Mmax / MCAP : Math.abs(e.N) / NCAP + (e.Mmax / MCAP) * 0.5;
          }
          return { sol, total };
        }
        v.render(() => {
          const { sol } = analyse(), mech = sol.mech;
          // ground
          s.line(-2.5, 0, 20.5, 0, { color: 'muted', width: 1.2 }); for (let x = -2.5; x < 20.5; x += 0.5) s.line(x, 0, x - 0.35, -0.35, { color: 'muted', width: 1, alpha: 0.5 });
          // removed columns
          for (const key of removed) { const [, i, j] = key.split('-').map(Number); s.line(BX[i], LY[j], BX[i], LY[j + 1], { color: 'red', width: 1.2, dash: [4, 4], alpha: 0.6 }); const ym = (LY[j] + LY[j + 1]) / 2; s.text('✕', BX[i], ym, { align: 'center', size: 16, weight: 700, color: 'red' }); }
          // deflected shape
          if (!mech) {
            const maxd = Math.max(1e-9, ...Array.from(sol.d).map(Math.abs).slice(0, 48)), k = 0.45 / maxd;
            for (const e of sol.el) s.path(v.M.linspace(0, 1, 12).map((xi) => deflected(sol, e, xi, k)), { color: 'faint', width: 1, dash: [3, 3] });
          }
          const maxN = Math.max(1, ...sol.el.filter((e) => e.key[0] === 'c').map((e) => Math.abs(e.N)));
          for (const e of sol.el) {
            const a = nodes[e.i], b = nodes[e.j], over = e.util > 1 && !mech;
            if (over) s.line(a.x, a.y, b.x, b.y, { color: 'red', width: 16, alpha: 0.22 });
            if (e.key[0] === 'c') s.line(a.x, a.y, b.x, b.y, { color: e.N < 0 ? 'blue' : 'red', width: 2 + 10 * Math.abs(e.N) / maxN, alpha: 0.8 });
            else {
              s.line(a.x, a.y, b.x, b.y, { color: e.key === selBeam ? 'gold' : 'ink', width: e.key === selBeam ? 4 : 2.6 });
              if (!mech) { const ms = 1.1 / MCAP; s.path([[a.x, a.y], ...v.M.linspace(0, e.L, 25).map((x) => [a.x + x, a.y - internal(e, x).M * ms]), [b.x, b.y]], { fill: 'purple', fillAlpha: 0.2, color: 'purple', width: 1, close: true }); }
            }
          }
          for (let k = 0; k < 4; k++) drawSupport(v, s, BX[k], 0, 'fixed');
          if (!mech) for (let k = 0; k < 4; k++) { const Ry = sol.R[k][1]; if (Math.abs(Ry) < 0.5) continue; const len = Math.min(2, Math.abs(Ry) / 450); s.arrow(BX[k], -2.3, BX[k], -2.3 + len, { color: 'green', width: 2.2, head: 7 }); s.text(kN(Ry), BX[k] + 0.3, -1.9, { size: 10.5, weight: 650, color: 'green' }); }
          if (mech) s.text('MECHANISM: no load path — the frame cannot carry its load', 9, 11.7, { align: 'center', size: 13, weight: 700, color: 'red' });
          v.legend([['blue', 'column compression (width ∝ force)'], ['purple', 'beam bending moment', { area: true }], ['red', 'over capacity / removed', { area: true }], ['gold', 'selected floor beam'], ['green', 'foundation reactions']]);
        });
        v.readout(() => {
          const { sol, total } = analyse();
          if (sol.mech) return `**Mechanism.** With pinned beam ends, the beams cannot reach across a missing column, so the column line above it has no support. The load cannot find another path: progressive collapse. Restore the column or make the joints rigid.`;
          const sumR = sol.R.slice(0, 4).reduce((acc, r) => acc + r[1], 0), beams = sol.el.filter((e) => e.key[0] === 'b'), cols = sol.el.filter((e) => e.key[0] === 'c');
          const mb = beams.reduce((p, q) => (q.Mmax > p.Mmax ? q : p)), mc = cols.reduce((p, q) => (Math.abs(q.N) > Math.abs(p.N) ? q : p)), over = sol.el.filter((e) => e.util > 1).length;
          return `Load ${kN(total)} = Σ foundation reactions ${kN(sumR)} · largest beam moment **${mb.Mmax.toFixed(0)} kN·m** (capacity ${MCAP}) · largest column force **${kN(Math.abs(mc.N))}** (capacity ${NCAP} kN)${over ? ` · **${over} member${over > 1 ? 's' : ''} over capacity**: the alternative path exists but needs stronger members` : ' · every member within capacity'}${removed.size ? ` · ${removed.size} column${removed.size > 1 ? 's' : ''} removed` : ''}.`;
        });
      },
    },
  ],
};
