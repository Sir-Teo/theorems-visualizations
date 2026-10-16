// Architecture & Structural Form — Chapter 1: helpers shared by ch01.js and ch02.js (plain named exports).
//
// Label placement, support and moment symbols, and a small 2D frame solver (Euler–Bernoulli beam elements with
// axial stiffness, optional end hinges, mechanism detection).

// ── shared helpers ──────────────────────────────────────────────────────────────────────────────────────────────────
export const G = 9.81;
/** Text width in px. */
export function textW(s, str, size = 12, weight = 500) { const c = s.ctx; c.save(); c.font = `${weight} ${size}px Inter, system-ui, sans-serif`; const w = c.measureText(str).width; c.restore(); return w; }
export const kN = (x, d = 3) => `${(Math.abs(x) < 0.05 ? 0 : x).toLocaleString('en-US', { maximumSignificantDigits: d })} kN`;
export const r1 = (x) => (Math.abs(x) < 0.05 ? '0' : x.toFixed(1)).replace('-', '−');

/**
 * Greedy label placement around points (data coords): tries right, left, diagonals, above, below, then further out
 * with a leader line; keeps inside the data area and clear of points and earlier labels.
 */
export function placeLabels(v, s, items, o = {}) {
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
export function drawSupport(v, s, x, y, type, color = 'muted') {
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
export function momentArrow(v, s, x, y, m, color = 'green', r = 16) {
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
export function kLocal(EA, EI, L) {
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
export function frameSolve(nodes, elems, sup, loads = {}) {
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
export function internal(e, x) { const f = e.f; return { N: -f[0], V: f[1] + e.q * x, M: -f[2] + f[1] * x + (e.q * x * x) / 2 }; }
/** Deflected point of an element at ξ ∈ [0, 1], with displacements scaled by k (Hermite cubic + uniform-load bubble). */
export function deflected(sol, e, xi, k) {
  const a = sol.nodes[e.i], [u1, v1, t1, u2, v2, t2] = e.dl, L = e.L;
  const N1 = 1 - 3 * xi * xi + 2 * xi ** 3, N2 = xi - 2 * xi * xi + xi ** 3, N3 = 3 * xi * xi - 2 * xi ** 3, N4 = -xi * xi + xi ** 3;
  const x = xi * L, w = N1 * v1 + N2 * L * t1 + N3 * v2 + N4 * L * t2 + (e.q * x * x * (L - x) ** 2) / (24 * e.EI) * (e.relI || e.relJ ? 0 : 1);
  const u = u1 + (u2 - u1) * xi, px = x + k * u, py = k * w;
  return [a.x + e.c * px - e.s * py, a.y + e.s * px + e.c * py];
}
