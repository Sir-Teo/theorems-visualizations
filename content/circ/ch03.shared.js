// Circuits — Chapter 3: helpers shared by ch03.js and ch03-b.js
import { gauss } from './ch02.shared.js';
export * from './ch02.shared.js';

/** Modified nodal analysis of a linear circuit. Nodes are 0 (ground) … n. Elements (current always counted a → b through the element):
 *  {t:'R', a, b, r} · {t:'I', a, b, i} · {t:'V', a, b, v} (a is +) · {t:'G', a, b, cp, cn, g} (current g·(v_cp − v_cn))
 *  · {t:'E', a, b, cp, cn, mu} (v_a − v_b = mu·(v_cp − v_cn)) · {t:'F', a, b, ctl, beta} (current beta·i_ctl; ctl = index of a V/E/H element)
 *  · {t:'H', a, b, ctl, r} (v_a − v_b = r·i_ctl).
 *  → {x, v (node voltages, v[0] = 0), cur (per-element current), A, z, stamps, N, br (element index → row of its current)} or null if singular. */
export function mna(n, els) {
  const br = new Map();
  els.forEach((e, k) => { if (e.t === 'V' || e.t === 'E' || e.t === 'H') br.set(k, n + br.size); });
  const N = n + br.size, A = Array.from({ length: N }, () => new Array(N).fill(0)), z = new Array(N).fill(0), stamps = [];
  els.forEach((e, k) => {
    const st = { el: k, ent: [], rhs: [] };
    const add = (r, c, val) => { if (r < 0 || c < 0) return; A[r][c] += val; st.ent.push([r, c, val]); };
    const addz = (r, val) => { if (r < 0) return; z[r] += val; st.rhs.push([r, val]); };
    const a = e.a - 1, b = e.b - 1;
    if (e.t === 'R') { const g = 1 / e.r; add(a, a, g); add(b, b, g); add(a, b, -g); add(b, a, -g); }
    else if (e.t === 'I') { addz(a, -e.i); addz(b, e.i); }
    else if (e.t === 'G') { const cp = e.cp - 1, cn = e.cn - 1; add(a, cp, e.g); add(a, cn, -e.g); add(b, cp, -e.g); add(b, cn, e.g); }
    else if (e.t === 'F') { const qc = br.get(e.ctl); add(a, qc, e.beta); add(b, qc, -e.beta); }
    else {
      const q = br.get(k); add(a, q, 1); add(b, q, -1); add(q, a, 1); add(q, b, -1);
      if (e.t === 'V') addz(q, e.v);
      else if (e.t === 'E') { add(q, e.cp - 1, -e.mu); add(q, e.cn - 1, e.mu); }
      else if (e.t === 'H') add(q, br.get(e.ctl), -e.r);
    }
    stamps.push(st);
  });
  const x = gauss(A, z);
  if (!x) return { singular: true, A, z, stamps, N, br };
  const v = [0, ...x.slice(0, n)];
  const cur = els.map((e, k) => {
    if (e.t === 'R') return (v[e.a] - v[e.b]) / e.r;
    if (e.t === 'I') return e.i;
    if (e.t === 'G') return e.g * (v[e.cp] - v[e.cn]);
    if (e.t === 'F') return e.beta * x[br.get(e.ctl)];
    return x[br.get(k)];
  });
  return { x, v, cur, A, z, stamps, N, br, singular: false };
}

/** LaTeX bmatrix of a numeric matrix. */
export function bmat(v, A, d = 2) {
  return String.raw`\begin{bmatrix}` + A.map((r) => r.map((x) => (Math.abs(x) < 1e-12 ? '0' : v.fix(x, d))).join(' & ')).join(String.raw` \\ `) + String.raw`\end{bmatrix}`;
}

/** Node positions of a named network centred on the origin, largest dimension 1. */
export function geom(net) {
  const xs = net.pos.map((p) => p[0]), ys = net.pos.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), k = 1 / Math.max(x1 - x0, y1 - y0, 1e-9);
  return net.pos.map((p) => [(p[0] - (x0 + x1) / 2) * k, (p[1] - (y0 + y1) / 2) * k]);
}

/** A resistor zigzag from p to q (data units). */
export function zig(s, p, q, o = {}) {
  const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, a = o.amp ?? 0.035, f0 = 0.3, f1 = 0.7, K = 6;
  const pts = [p, [p[0] + dx * f0, p[1] + dy * f0]];
  for (let k = 0; k < K; k++) { const t = f0 + ((f1 - f0) * (k + 0.5)) / K, sg = k % 2 ? -1 : 1; pts.push([p[0] + dx * t + nx * a * sg, p[1] + dy * t + ny * a * sg]); }
  pts.push([p[0] + dx * f1, p[1] + dy * f1], q);
  s.path(pts, { color: o.color || 'ink', width: o.width || 2, alpha: o.alpha ?? 1 });
}

/** One element drawn between points p and q (stage must have equal: true). kind: 'R' | 'V' (+ at p) | 'I' (arrow p→q) | 'D' (diamond, dependent source) | 'W'. */
export function drawEl(s, p, q, kind, o = {}) {
  const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  const col = o.color || 'ink', w = o.width || 2, mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, r = o.size ?? 0.06;
  if (kind === 'R') { zig(s, p, q, { color: col, width: w, amp: o.amp ?? 0.03, alpha: o.alpha }); return; }
  if (kind === 'W') { s.line(p[0], p[1], q[0], q[1], { color: col, width: w, alpha: o.alpha }); return; }
  const rr = kind === 'D' ? r * 1.25 : r;
  s.line(p[0], p[1], mx - ux * rr, my - uy * rr, { color: col, width: w, alpha: o.alpha });
  s.line(mx + ux * rr, my + uy * rr, q[0], q[1], { color: col, width: w, alpha: o.alpha });
  if (kind === 'D') {
    s.poly([[mx + ux * rr, my + uy * rr], [mx - uy * rr, my + ux * rr], [mx - ux * rr, my - uy * rr], [mx + uy * rr, my - ux * rr]], { color: col, width: w, fill: col, fillAlpha: 0.1 });
    if (o.sym === 'arrow') s.arrow(mx - ux * rr * 0.55, my - uy * rr * 0.55, mx + ux * rr * 0.55, my + uy * rr * 0.55, { color: col, width: 1.6, head: 7 });
    else { s.text('+', mx - ux * rr * 0.42, my - uy * rr * 0.42, { size: 10, color: col }); s.text('−', mx + ux * rr * 0.42, my + uy * rr * 0.42, { size: 10, color: col }); }
    return;
  }
  s.circle(mx, my, rr, { color: col, width: w, fill: col, fillAlpha: 0.08 });
  if (kind === 'V') { s.text('+', mx - ux * rr * 0.5, my - uy * rr * 0.5, { size: 11, color: col }); s.text('−', mx + ux * rr * 0.5, my + uy * rr * 0.5, { size: 11, color: col }); }
  else if (kind === 'I') s.arrow(mx - ux * rr * 0.6, my - uy * rr * 0.6, mx + ux * rr * 0.6, my + uy * rr * 0.6, { color: col, width: 1.8, head: 7 });
}

/** A circuit drawn as a graph: pos[node] = [x, y]; els = [{a, b, kind, label, color, cur (signed, a → b, in [−1, 1] relative scale), dashed}].
 *  o.phi (node potentials) colours the node dots from blue (−) through grey to red (+) scaled by o.vmax; o.names labels the nodes. */
export function drawNet(s, v, pos, els, o = {}) {
  els.forEach((e) => {
    const p = pos[e.a], q = pos[e.b], col = e.color || 'ink';
    if (e.hl) s.line(p[0], p[1], q[0], q[1], { color: 'gold', width: 12, alpha: 0.35 });
    if (e.dashed) s.line(p[0], p[1], q[0], q[1], { color: col, width: 1.6, dash: true, alpha: 0.9 });
    else drawEl(s, p, q, e.kind || 'R', { color: col, width: e.width || 2.2, sym: e.sym, size: o.size });
    const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
    if (e.cur != null && Math.abs(e.cur) > 1e-9) {
      const c = Math.sign(e.cur), f0 = c > 0 ? 0.62 : 0.8, f1 = c > 0 ? 0.8 : 0.62, off = 0.045;
      s.arrow(p[0] + dx * f0 + nx * off, p[1] + dy * f0 + ny * off, p[0] + dx * f1 + nx * off, p[1] + dy * f1 + ny * off, { color: 'gold', width: 2 + 4 * Math.min(1, Math.abs(e.cur)), head: 9 });
    }
    if (e.label) { const d = o.labelOff ?? 0.1; s.text(e.label, mx - nx * d, my - ny * d, { size: o.labelSize ?? 11.5, color: col === 'ink' ? 'muted' : col, plate: true }); }
  });
  pos.forEach((p, i) => {
    if (o.skip && o.skip.includes(i)) return;
    const col = o.phi ? v.diverge(Math.max(-1, Math.min(1, o.phi[i] / (o.vmax || 1))), 'blue', 'red') : 'ink';
    s.dot(p[0], p[1], { r: o.nodeR ?? 5.5, color: col });
    if (o.names) s.text(o.names[i], p[0], p[1], { size: 11, color: 'ink', dx: o.nameDx ?? 0, dy: o.nameDy ?? -13 });
  });
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The boxed network of 3.2 / 3.3, solved in closed form so that sweeps are cheap:
//   source V in series with R1 feeds node P; R2 from P to ground; a current source Is pushes current into P;
//   R3 from P to the terminal a (terminal b is ground). Optionally R3 is replaced by a diode (anode at P): the box is then nonlinear.
export const BOX = { V: 12, R1: 1000, R2: 2000, Is: 0.002, R3: 500 };
const VT = 0.0259;
/** Shockley diode current. */
export const diodeI = (vd, Is = 1e-12, n = 1.5) => Is * (Math.exp(Math.min(vd / (n * VT), 700)) - 1);
/** Current the box delivers out of terminal a when the terminal voltage is vt (and the voltage of its internal node P). */
export function boxSolve(p, vt, diode = false) {
  const f = (vp) => (p.V - vp) / p.R1 + p.Is - vp / p.R2 - (diode ? diodeI(vp - vt) : (vp - vt) / p.R3);
  let lo = -200, hi = 200;
  for (let it = 0; it < 200; it++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
  const vp = (lo + hi) / 2;
  return { vp, i: diode ? diodeI(vp - vt) : (vp - vt) / p.R3 };
}
/** Open-circuit voltage, short-circuit current and (V_oc / I_sc) from the box's own terminal behaviour. */
export function boxTests(p, diode = false) {
  let lo = -200, hi = 200;
  for (let it = 0; it < 200; it++) { const m = (lo + hi) / 2; if (boxSolve(p, m, diode).i > 0) lo = m; else hi = m; }
  const Voc = (lo + hi) / 2, Isc = boxSolve(p, 0, diode).i;
  return { Voc, Isc, Rth: Voc / Isc };
}
/** Thévenin resistance of the linear box with every source switched off (V → short, I → open): R3 + R1‖R2. */
export const boxRoff = (p) => p.R3 + (p.R1 * p.R2) / (p.R1 + p.R2);
