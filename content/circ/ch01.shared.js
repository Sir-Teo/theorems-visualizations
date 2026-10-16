// Circuits — Chapter 1: helpers shared by ch01.js and ch01-b.js

export const TAU = 2 * Math.PI;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/** SI formatting with prefixes, plain text: sI(0.0123, 'A') → '12.3 mA'. */
const PFX = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']];
export function sI(x, unit = '', digits = 3) {
  if (x == null || !isFinite(x)) return '—';
  if (Math.abs(x) < 1e-15) return `0 ${unit}`.trim();
  const a = Math.abs(x), [m, p] = PFX.find(([m0]) => a >= m0 * 0.9995) || PFX[PFX.length - 1];
  return `${(+(x / m).toPrecision(digits)).toString().replace('-', '−')} ${p}${unit}`.trim();
}
/** Signed zero guard for printing. */
export const z0 = (x, eps = 1e-12) => (Math.abs(x) < eps ? 0 : x);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// A tungsten filament lamp as a self-heating resistor: R(T) = R0 (1 + α (T − T0)) and, in steady state, the electrical
// power V²/R(T) equals the radiated power k (T⁴ − T0⁴). Illustrative parameters (α = 0.0045 /K is the 20 °C textbook value
// for tungsten; the real α falls with temperature, so hot resistances are a little overestimated).
export function makeLamp({ Vr = 12, Pr = 12, Th = 2500, T0 = 293, alpha = 0.0045 } = {}) {
  const Rr = Vr * Vr / Pr, R0 = Rr / (1 + alpha * (Th - T0)), k = Pr / (Th ** 4 - T0 ** 4);
  function state(V, held = false) {
    if (held || Math.abs(V) < 1e-12) return { T: T0, R: R0, I: V / R0 };
    let lo = T0, hi = 4200; // power balance is monotone in T: electrical falls, radiated rises
    for (let it = 0; it < 80; it++) {
      const T = (lo + hi) / 2, f = V * V / (R0 * (1 + alpha * (T - T0))) - k * (T ** 4 - T0 ** 4);
      if (f > 0) lo = T; else hi = T;
    }
    const T = (lo + hi) / 2, R = R0 * (1 + alpha * (T - T0));
    return { T, R, I: V / R };
  }
  return { Vr, Pr, Rr, R0, k, T0, alpha, Th, state };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Steady current flow in a flat conducting bar (Laplace's equation for the potential, as a resistor grid).
// Node grid i = 0..nx (along the bar), j = 0..ny (across). Left end held at 1, right end at 0, the long sides insulating.
// hx, hy are the cell sizes (so the grid may be anisotropic). hole = {cx, cy, r} in physical units or null.
// → {phi, alive, nx, ny, G}: G is the total conductance in units of the sheet conductance σt (current for ΔV = 1).
export function barSolve(nx, ny, hx, hy, hole = null) {
  const N = (nx + 1) * (ny + 1), id = (i, j) => i * (ny + 1) + j;
  const alive = new Uint8Array(N).fill(1);
  if (hole) for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) if (Math.hypot(i * hx - hole.cx, j * hy - hole.cy) < hole.r) alive[id(i, j)] = 0;
  for (let j = 0; j <= ny; j++) { alive[id(0, j)] = 1; alive[id(nx, j)] = 1; }
  const sx = hy / hx, sy = hx / hy;
  const gh = (i, j) => (alive[id(i, j)] && alive[id(i + 1, j)] ? sx * (j === 0 || j === ny ? 0.5 : 1) : 0);
  const gv = (i, j) => (alive[id(i, j)] && alive[id(i, j + 1)] ? sy * (i === 0 || i === nx ? 0.5 : 1) : 0);
  const free = new Uint8Array(N); for (let i = 1; i < nx; i++) for (let j = 0; j <= ny; j++) if (alive[id(i, j)]) free[id(i, j)] = 1;
  const phi = new Float64Array(N);
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) phi[id(i, j)] = alive[id(i, j)] ? 1 - i / nx : 0;
  const lap = (x, out) => { // out = L x, restricted to free rows
    for (let i = 1; i < nx; i++) for (let j = 0; j <= ny; j++) {
      const n = id(i, j); if (!free[n]) { out[n] = 0; continue; }
      let s = 0, g;
      if ((g = gh(i, j))) s += g * (x[n] - x[id(i + 1, j)]);
      if ((g = gh(i - 1, j))) s += g * (x[n] - x[id(i - 1, j)]);
      if (j < ny && (g = gv(i, j))) s += g * (x[n] - x[id(i, j + 1)]);
      if (j > 0 && (g = gv(i, j - 1))) s += g * (x[n] - x[id(i, j - 1)]);
      out[n] = s;
    }
  };
  // conjugate gradient on the correction d: L_ff d = −L phi
  const r = new Float64Array(N), Lp = new Float64Array(N), d = new Float64Array(N), p = new Float64Array(N), q = new Float64Array(N);
  lap(phi, Lp); for (let n = 0; n < N; n++) r[n] = free[n] ? -Lp[n] : 0;
  p.set(r); let rr = 0; for (let n = 0; n < N; n++) rr += r[n] * r[n];
  const rr0 = rr || 1;
  for (let it = 0; it < 4000 && rr > 1e-22 * rr0; it++) {
    lap(p, q); let pq = 0; for (let n = 0; n < N; n++) pq += p[n] * q[n];
    if (!pq) break; const a = rr / pq; let rn = 0;
    for (let n = 0; n < N; n++) { d[n] += a * p[n]; r[n] -= a * q[n]; rn += r[n] * r[n]; }
    const b = rn / rr; rr = rn; for (let n = 0; n < N; n++) p[n] = r[n] + b * p[n];
  }
  for (let n = 0; n < N; n++) phi[n] += d[n];
  let G = 0; for (let j = 0; j <= ny; j++) G += gh(0, j) * (phi[id(0, j)] - phi[id(1, j)]);
  return { phi, alive, nx, ny, hx, hy, G, id, gh, gv };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Circuit graph of a v.circuit schematic: two-terminal parts are the branches, nets are the nodes.
export function circuitGraph(C, kinds = ['R', 'C', 'L', 'V', 'I', 'SW', 'D']) {
  const net = C.net, nodes = ['0', ...net.nodes.filter((n) => n !== '0')];
  const nodeIds = [net.ground, ...net.nodes];
  const edges = [];
  for (const p of C.parts) if (kinds.includes(p.type)) { const m = net.termNode.get(p.id); edges.push({ id: p.id, name: p.name ?? p.id, type: p.type, a: m.a, b: m.b }); }
  void nodes;
  // keep only nodes touched by a branch, ground first
  const used = new Set(); for (const e of edges) { used.add(e.a); used.add(e.b); }
  const list = nodeIds.filter((n, i) => nodeIds.indexOf(n) === i && used.has(n));
  return { nodes: list, edges };
}
