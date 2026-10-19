// Circuits — Chapter 3: Network theorems (part b: 3.8–3.13)
import { clamp, sI, z0, NETS, geom, mna, bmat, drawEl, drawNet, solveNet, gauss } from './ch03.shared.js';

// ─── 3.8: the four kinds of dependent source in one test circuit (units: V, mA, kΩ, mS) ───
// input loop: Vs – Rs – ammeter – Rin; node 1 = source, 2 = after Rs, 3 = after the ammeter (control voltage v_x across Rin)
const DEP = {
  E: { tex: String.raw`\mu`, name: 'voltage-controlled voltage source (VCVS)', ctl: 'v', out: 'v', unit: 'V/V', scale: 2, fmtK: (k) => `${2 * k}` },
  G: { tex: 'g_m', name: 'voltage-controlled current source (VCCS)', ctl: 'v', out: 'i', unit: 'mS', scale: 1 },
  H: { tex: 'r_m', name: 'current-controlled voltage source (CCVS)', ctl: 'i', out: 'v', unit: 'kΩ', scale: 1 },
  F: { tex: String.raw`\beta`, name: 'current-controlled current source (CCCS)', ctl: 'i', out: 'i', unit: 'mA/mA', scale: 2 },
};
const RO = 0.1; // kΩ, output resistance of the voltage-type sources
function depEls(type, k, Vs) {
  const gain = DEP[type].scale * k;
  const els = [{ t: 'V', a: 1, b: 0, v: Vs }, { t: 'R', a: 1, b: 2, r: 1 }, { t: 'V', a: 2, b: 3, v: 0 }, { t: 'R', a: 3, b: 0, r: 1 }];
  if (type === 'E') els.push({ t: 'E', a: 5, b: 0, cp: 3, cn: 0, mu: gain }, { t: 'R', a: 5, b: 4, r: RO });
  if (type === 'H') els.push({ t: 'H', a: 5, b: 0, ctl: 2, r: gain }, { t: 'R', a: 5, b: 4, r: RO });
  if (type === 'G') els.push({ t: 'G', a: 0, b: 4, cp: 3, cn: 0, g: gain });
  if (type === 'F') els.push({ t: 'F', a: 0, b: 4, ctl: 2, beta: gain });
  els.push({ t: 'R', a: 4, b: 0, r: 1 });
  return { els, n: type === 'E' || type === 'H' ? 5 : 4, gain, dep: 4 };
}
function depSolve(type, k, Vs) { const d = depEls(type, k, Vs), s = mna(d.n, d.els); return { ...d, s, vx: s.v[3], ix: s.cur[2], vL: s.v[4], iL: s.v[4] / 1 }; }

// ─── 3.9: two-port parameters by test sources ───
/** T network (Ra from port 1 to the middle node m, Rc from m to port 2, Rb from m to ground) plus an optional VCCS pushing g·v1 into port 2. */
function tNet(Ra, Rb, Rc, g, n1, n2, m) {
  const els = [{ t: 'R', a: n1, b: m, r: Ra }, { t: 'R', a: m, b: 0, r: Rb }, { t: 'R', a: m, b: n2, r: Rc }];
  if (g) els.push({ t: 'G', a: 0, b: n2, cp: n1, cn: 0, g });
  return els;
}
/** Short-circuit admittance matrix (mS) of a two-port between nodes p1 and p2 (ground = common). */
function yParams(n, els, p1, p2) {
  const run = (v1, v2) => { const s = mna(n, [...els, { t: 'V', a: p1, b: 0, v: v1 }, { t: 'V', a: p2, b: 0, v: v2 }]); const m = els.length; return s.singular ? null : [-s.cur[m], -s.cur[m + 1]]; };
  const c1 = run(1, 0), c2 = run(0, 1);
  return c1 && c2 ? [[c1[0], c2[0]], [c1[1], c2[1]]] : null;
}
const inv2 = (M) => { const d = M[0][0] * M[1][1] - M[0][1] * M[1][0]; return Math.abs(d) < 1e-12 ? null : [[M[1][1] / d, -M[0][1] / d], [-M[1][0] / d, M[0][0] / d]]; };
function fromY(y) {
  const d = y[0][0] * y[1][1] - y[0][1] * y[1][0], z = inv2(y);
  return {
    y, z, det: d,
    h: Math.abs(y[0][0]) > 1e-12 ? [[1 / y[0][0], -y[0][1] / y[0][0]], [y[1][0] / y[0][0], d / y[0][0]]] : null,
    t: Math.abs(y[1][0]) > 1e-12 ? [[-y[1][1] / y[1][0], -1 / y[1][0]], [-d / y[1][0], -y[0][0] / y[1][0]]] : null,
  };
}
const mm = (A, B) => [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]], [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]];

// ─── 3.10: bridge network flows ───
const BRI = NETS.bridge, C1 = [1, -1, 0, 0, 1], C2 = [0, 0, 1, -1, -1];

// ─── 3.11: the bridge with its source, and its dual ───
// primal nodes: A (+ of the source), B, C, D (ground). Faces: F1 = ABC, F2 = BDC, F3 = A-C-D + source; O = outside.
const PRI = { A: [0, 1.5], B: [3, 3], C: [3, 0], D: [6, 1.5] }, FAC = { F1: [2, 1.5], F2: [4, 1.5], F3: [3, -0.8] };

export default {
  collection: 'circ',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Definition',
      name: 'Dependent (controlled) sources',
      statement: String.raw`A dependent (controlled) source is a two-terminal source whose value is a linear function of a voltage or current elsewhere in the circuit. There are four kinds: the voltage-controlled voltage source (VCVS, $v = \mu\, v_x$), the voltage-controlled current source (VCCS, $i = g_m\, v_x$), the current-controlled voltage source (CCVS, $v = r_m\, i_x$) and the current-controlled current source (CCCS, $i = \beta\, i_x$). Here $v_x$ or $i_x$ is a voltage or current of another branch, and the gain $\mu$, $g_m$, $r_m$, $\beta$ is a constant. Unlike an independent source, it is switched off (value $0$) only when its control quantity is $0$, and it is **not** switched off in superposition.`,
      idea: String.raw`Independent sources fix a value; a dependent source fixes the *relation* between two parts of the circuit. In the network equations it contributes a term proportional to an unknown to the left-hand side, so the matrix is no longer symmetric (this is why reciprocity, 3.7, can fail) and the dependent source can deliver more power than its control port absorbs: it is an *active* element. Real devices (transistors, op-amps) are modelled near an operating point by such sources; later chapters build amplifiers out of them. The control branch itself only needs to be measured, never loaded: an ideal control port draws no power for a voltage control (open) and has no voltage for a current control (short, an ammeter).`,
      caption: String.raw`The input loop (left) drives a control quantity: $v_x$ across $R_{in}$ or $i_x$ through the ammeter. Pick one of the four types and turn the gain: the output loop (right) follows the control quantity, plotted below as a straight line through the origin whose slope is set by the gain and the load. The readout compares the solver's output with the closed-form gain and shows the power balance: the dependent source delivers power greater than the input port absorbs, which a passive network can never do.`,
      scope: String.raw`Linear dependent sources only (a gain times a control variable). Real transistors are described this way only for small signals around an operating point (chapter 4); the gain unit differs for each of the four types.`,
      deps: ['circ-1.6'],
      refs: ['Agarwal–Lang §2.6'],
      tags: ['dependent source', 'amplification'],
      viz(v) {
        const s = v.stage({ x: [-3.2, 12.3], y: [-0.9, 4.7], equal: true, axes: false, height: 290, weight: 1.3, title: 'input loop, controlled source, output loop' });
        const sp = v.stage({ x: [-3, 3], y: [-8, 8], axes: 'box', gutter: true, height: 290, weight: 0.9, xlabel: 'control quantity', ylabel: 'output quantity', title: 'transfer characteristic' });
        const typ = v.select('type', [{ value: 'E', label: 'VCVS' }, { value: 'G', label: 'VCCS' }, { value: 'H', label: 'CCVS' }, { value: 'F', label: 'CCCS' }], 'G');
        const Ks = {}; for (const t of ['E', 'G', 'H', 'F']) { Ks[t] = v.slider(`gain $${DEP[t].tex}$`, -5, 5, 2, { step: 0.1, fmt: (x) => `${v.fix(DEP[t].scale * x, 2)} ${DEP[t].unit}` }); }
        const Vs = v.slider('$V_s$', -5, 5, 2, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} V` });
        let info = null;
        v.render(() => {
          const T = typ.value, D = DEP[T], K = Ks[T]; for (const t of Object.keys(Ks)) Ks[t].el.hidden = t !== T;
          const r = depSolve(T, K.value, Vs.value), vc = T === 'E' || T === 'H';
          const gc = 'accent', gd = 'orange';
          // input loop
          drawEl(s, [0, 3], [0, 0], 'V', { color: gc }); s.line(0, 3, 0.8, 3, { color: 'ink', width: 2 }); drawEl(s, [0.8, 3], [2.8, 3], 'R', { color: 'ink' });
          s.line(2.8, 3, 3.3, 3, { color: 'ink', width: 2 }); s.circle(3.6, 3, 0.3, { color: 'ink', width: 2, fill: 'ink', fillAlpha: 0.06 }); s.text('A', 3.6, 3, { size: 12, color: 'ink' });
          s.line(3.9, 3, 4.6, 3, { color: 'ink', width: 2 }); drawEl(s, [4.6, 3], [4.6, 0], 'R', { color: 'ink' });
          s.line(0, 0, 10, 0, { color: 'ink', width: 2 });
          s.text(`$V_s = ${v.fix(Vs.value, 1)}\\ \\mathrm{V}$`, -0.5, 1.5, { size: 12, color: gc, align: 'right' }); s.text('$R_s$', 1.8, 3.55, { size: 12, color: 'muted' }); s.text('$R_{in}$', 3.7, 1.5, { size: 12, color: 'muted' });
          // output loop
          if (vc) drawEl(s, [6.4, 3], [6.4, 0], 'D', { color: gd, sym: 'pm', size: 0.35 }); else drawEl(s, [6.4, 0], [6.4, 3], 'D', { color: gd, sym: 'arrow', size: 0.35 });
          s.line(6.4, 3, 7.2, 3, { color: 'ink', width: 2 });
          if (vc) { drawEl(s, [7.2, 3], [8.6, 3], 'R', { color: 'ink' }); s.line(8.6, 3, 9.4, 3, { color: 'ink', width: 2 }); s.text('$R_o$', 7.9, 3.55, { size: 12, color: 'muted' }); } else s.line(7.2, 3, 9.4, 3, { color: 'ink', width: 2 });
          drawEl(s, [9.4, 3], [9.4, 0], 'R', { color: 'ink' }); s.text('$R_L$', 10.05, 1.5, { size: 12, color: 'muted' });
          // control link
          const sx = D.ctl === 'v' ? 4.6 : 3.6, sy = D.ctl === 'v' ? 1.5 : 3.35;
          s.path([[sx + 0.15, sy], [5.4, D.ctl === 'v' ? 1.5 : 2.4], [6.0, 1.5]], { color: 'gold', width: 2, dash: [6, 5] });
          s.text(D.ctl === 'v' ? `$v_x = ${v.fix(r.vx, 3)}\\ \\mathrm{V}$` : `$i_x = ${v.fix(r.ix, 3)}\\ \\mathrm{mA}$`, 3.9, 4.15, { size: 12.5, color: 'gold', plate: true });
          s.text(`$${D.tex} ${D.ctl === 'v' ? 'v_x' : 'i_x'}$`, 6.4, -0.45, { size: 12.5, color: gd });
          s.text(`$v_L = ${v.fix(r.vL, 3)}\\ \\mathrm{V}$`, 7.3, 4.15, { size: 12.5, color: 'green', plate: true });
          s.text(`$i_L = ${v.fix(r.iL, 3)}\\ \\mathrm{mA}$`, 7.6, -0.55, { size: 12.5, color: 'green' });
          // transfer line
          const xs = [], ys = [];
          for (let q = -5; q <= 5.001; q += 0.5) { const t = depSolve(T, K.value, q); xs.push(D.ctl === 'v' ? t.vx : t.ix); ys.push(D.out === 'v' ? t.vL : t.iL); }
          const xm = Math.max(1, ...xs.map(Math.abs)) * 1.15, ym = Math.max(1, ...ys.map(Math.abs)) * 1.15;
          sp.setView([-xm, xm], [-ym, ym]); sp.setLabels(D.ctl === 'v' ? '$v_x$ (V)' : '$i_x$ (mA)', D.out === 'v' ? '$v_L$ (V)' : '$i_L$ (mA)');
          sp.path(xs.map((x, q) => [x, ys[q]]), { color: gd, width: 2.5 });
          sp.hline(0, { color: 'faint', width: 1 }); sp.vline(0, { color: 'faint', width: 1 });
          const cx = D.ctl === 'v' ? r.vx : r.ix, cy = D.out === 'v' ? r.vL : r.iL;
          sp.dot(cx, cy, { r: 7, color: 'green' });
          // expected closed form
          const g = r.gain; let want;
          if (T === 'E') want = g * 1 / (1 + RO) * r.vx; else if (T === 'G') want = g * r.vx * 1; else if (T === 'H') want = g * r.ix / (1 + RO); else want = g * r.ix;
          const got = D.out === 'v' ? r.vL : r.iL;
          const s2 = r.s, dv = s2.v[r.els[4].a] - s2.v[r.els[4].b], pdep = -dv * s2.cur[4], pin = r.vx * r.ix, pL = r.vL * r.iL;
          info = { got, want, pdep, pin, pL, T, gain: g };
        });
        v.readout(() => {
          if (!info) return '';
          const { got, want, pdep, pin, pL, T, gain } = info, D = DEP[T], u = D.out === 'v' ? 'V' : 'mA';
          return `${D.name}, gain ${v.fix(gain, 2)} ${D.unit}. Output: solver $${D.out === 'v' ? 'v_L' : 'i_L'} = ${v.fix(got, 4)}$ ${u}, closed form $${v.fix(want, 4)}$ ${u}.\nPower into the input port $v_x i_x = ${v.fix(pin, 3)}$ mW; delivered to the load ${v.fix(pL, 3)} mW; supplied by the dependent source ${v.fix(pdep, 3)} mW. ${pdep > pin + 1e-9 ? 'The source gives out more than the control port takes in: an active element.' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Definition',
      name: 'Two-port networks and their parameter matrices',
      statement: String.raw`A two-port is a linear network accessed through two pairs of terminals (ports), each carrying equal and opposite currents ($I_1$, $I_2$ into the ports, $V_1$, $V_2$ the port voltages). Because the network is linear, any two of the four quantities determine the other two, and the relation is a $2\times2$ matrix: the impedance matrix $\mathbf z$ ($\mathbf V = \mathbf z\mathbf I$), the admittance matrix $\mathbf y$ ($\mathbf I = \mathbf y\mathbf V$), the hybrid matrix $\mathbf h$, and the transmission (ABCD) matrix, $\begin{pmatrix} V_1\\ I_1\end{pmatrix} = \begin{pmatrix} A&B\\ C&D\end{pmatrix}\begin{pmatrix} V_2\\ -I_2\end{pmatrix}$. Each entry is measured with the other port short- or open-circuited. If two two-ports are cascaded (port 2 of the first = port 1 of the second), their ABCD matrices multiply. The two-port is reciprocal when $z_{12} = z_{21}$, equivalently $AD - BC = 1$.`,
      idea: String.raw`Port currents and voltages are the only variables the outside world sees, and the network equations are linear, so after eliminating all internal nodes (Thévenin's theorem, 3.2, applied twice, or by Gaussian elimination) four variables are tied by two linear equations. Choosing which two are the "inputs" gives the four matrix forms; they are related by the algebra of $2\times2$ matrices (for example $\mathbf z = \mathbf y^{-1}$). The ABCD form is built for cascades, because the output variables of one stage are exactly the input variables of the next. A dependent source (3.8) can make $y_{12} \ne y_{21}$, so reciprocity (3.7) is lost.`,
      caption: String.raw`The first box is a T network (three resistors) with an optional dependent source that injects $g\,V_1$ into port 2; the second box is fixed. The readout measures box 1 by applying test voltages $V_1 = 1, V_2 = 0$ and $V_1 = 0, V_2 = 1$ (solving the circuit each time) and converts the result into the matrix form you pick. Below it, the product of the two ABCD matrices is compared with the ABCD matrix measured directly on the glued circuit: they agree. The plot shows the output-port characteristics $I_2(V_2)$ for several $V_1$ with the load line; set $g \neq 0$ and watch $AD - BC$ leave $1$.`,
      scope: String.raw`Linear two-ports in which each port carries equal and opposite currents. Some matrices do not exist for particular networks (for example $\mathbf z$ for an ideal transformer, $\mathbf y$ for a series resistor of zero value), which the readout then flags.`,
      deps: ['circ-3.2', 'circ-3.8', 'ladr-3.43'],
      refs: ['Agarwal–Lang §15.9'],
      tags: ['two-port', 'cascade', 'matrix'],
      viz(v) {
        const sd = v.stage({ x: [-2.0, 15.6], y: [-0.3, 4.2], equal: true, axes: false, height: 230, weight: 1.15, title: 'box 1 cascaded with box 2' });
        const sp = v.stage({ x: [-6, 6], y: [-8, 8], axes: 'box', gutter: true, height: 300, weight: 1, xlabel: '$V_2$ (V)', ylabel: '$I_2$ (mA)', title: 'output characteristics of box 1' });
        const lg = { log: true, sig: 2, fmt: (x) => sI(x * 1e3, 'Ω', 2) };
        const Ra = v.slider('$R_a$', 0.1, 5, 1, lg), Rb = v.slider('$R_b$', 0.1, 5, 2, lg), Rc = v.slider('$R_c$', 0.1, 5, 1, lg);
        const g = v.slider('dependent source $g$', -3, 3, 0, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} mS` });
        const V1 = v.slider('$V_1$', -5, 5, 2, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} V` });
        const RL = v.slider('load $R_L$', 0.2, 10, 2, lg);
        const set = v.select('parameters of box 1', [{ value: 'z', label: '$\\mathbf z$' }, { value: 'y', label: '$\\mathbf y$' }, { value: 'h', label: '$\\mathbf h$' }, { value: 't', label: 'ABCD' }], 't');
        let info = null;
        v.render(() => {
          const e1 = tNet(Ra.value, Rb.value, Rc.value, g.value, 1, 2, 3), y1 = yParams(3, e1, 1, 2);
          const e2 = tNet(1, 2, 1, 0, 1, 2, 3), y2 = yParams(3, e2, 1, 2);
          const glue = [...tNet(Ra.value, Rb.value, Rc.value, g.value, 1, 2, 3), ...tNet(1, 2, 1, 0, 2, 4, 5)], yc = yParams(5, glue, 1, 4);
          const P1 = y1 && fromY(y1), P2 = y2 && fromY(y2), Pc = yc && fromY(yc);
          // operating point of box 1 with the load: V2 = −R_L I2, I2 = y21 V1 + y22 V2
          let V2 = null, I2 = null;
          if (y1) { V2 = -RL.value * y1[1][0] * V1.value / (1 + RL.value * y1[1][1]); I2 = -V2 / RL.value; }
          sp.setView([-6, 6], [-8, 8]);
          if (y1) {
            for (const q of [-4, -2, 0, 2, 4]) sp.line(-6, y1[1][0] * q - y1[1][1] * 6, 6, y1[1][0] * q + y1[1][1] * 6, { color: 'accent', width: 1.2, alpha: 0.4 });
            sp.line(-6, y1[1][0] * V1.value - 6 * y1[1][1], 6, y1[1][0] * V1.value + 6 * y1[1][1], { color: 'accent', width: 2.8 });
            sp.line(-6, 6 / RL.value, 6, -6 / RL.value, { color: 'orange', width: 2, dash: [6, 5] });
            if (isFinite(V2)) sp.dot(V2, I2, { r: 7, color: 'green' });
          }
          sp.hline(0, { color: 'faint', width: 1 }); sp.vline(0, { color: 'faint', width: 1 });
          // block diagram
          const box = (x0, lab) => { sd.rect(x0, 0.6, x0 + 3.6, 3.4, { color: 'ink', width: 2, fill: 'accent', fillAlpha: 0.07, radius: 6 }); sd.text(lab, x0 + 1.8, 2, { size: 13, color: 'ink', align: 'center' }); };
          box(2.6, 'box 1'); box(8.2, 'box 2');
          for (const [x0, x1] of [[0.6, 2.6], [6.2, 8.2], [11.8, 13.2]]) { sd.line(x0, 3, x1, 3, { color: 'ink', width: 2 }); sd.line(x0, 1, x1, 1, { color: 'ink', width: 2 }); }
          [[0.6, 3], [0.6, 1], [6.2, 3], [6.2, 1], [13.2, 3], [13.2, 1]].forEach(([x, y]) => sd.dot(x, y, { r: 4.5, color: 'ink' }));
          sd.text('$V_1, I_1$', 0.1, 2, { size: 12.5, color: 'accent', align: 'right' }); sd.text('$V_2, I_2$', 6.2, 2, { size: 12.5, color: 'accent', align: 'center' }); sd.text('$V_3, I_3$', 13.7, 2, { size: 12.5, color: 'accent', align: 'left' });
          sd.arrow(1.1, 3.35, 1.9, 3.35, { color: 'gold', width: 2.5, head: 8 }); sd.arrow(6.7, 3.35, 7.5, 3.35, { color: 'gold', width: 2.5, head: 8 });
          // parameter readout
          const sel = P1 && P1[set.value];
          const name = { z: String.raw`\mathbf z\ (\mathrm{k}\Omega)`, y: String.raw`\mathbf y\ (\mathrm{mS})`, h: String.raw`\mathbf h`, t: String.raw`\begin{bmatrix}A&B\\C&D\end{bmatrix}\ (B\ \mathrm{k}\Omega,\ C\ \mathrm{mS})` }[set.value];
          let cas = null;
          if (P1 && P2 && Pc && P1.t && P2.t && Pc.t) { const prod = mm(P1.t, P2.t); cas = { prod, direct: Pc.t, diff: Math.max(...prod.flat().map((x, i) => Math.abs(x - Pc.t.flat()[i]))) }; }
          info = { sel, name, det: P1 && P1.t ? P1.t[0][0] * P1.t[1][1] - P1.t[0][1] * P1.t[1][0] : null, cas, V2, I2 };
        });
        v.readout(() => {
          if (!info) return '';
          const { sel, name, det, cas, V2, I2 } = info;
          const l1 = sel ? `Box 1: $${name} = ${bmat(v, sel, 3)}$${det != null ? `, $AD - BC = ${v.fix(det, 4)}$ ${Math.abs(det - 1) < 1e-9 ? '(reciprocal)' : '(not reciprocal)'}` : ''}.` : `This parameter matrix does not exist for the present box (a divide by zero in the conversion).`;
          const l2 = cas ? `Cascade: ABCD$_1\\cdot$ABCD$_2 = ${bmat(v, cas.prod, 3)}$, measured directly on the glued network $${bmat(v, cas.direct, 3)}$; largest difference $${v.sci(cas.diff + 1e-20, 1)}$.` : 'Cascade comparison unavailable (a parameter matrix is undefined).';
          return `${l1}\n${l2}${V2 != null && isFinite(V2) ? `\nWith the load: $V_2 = ${v.fix(V2, 3)}$ V, $I_2 = ${v.fix(I2, 3)}$ mA.` : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Theorem',
      name: 'Thomson’s principle: currents minimize dissipated power',
      statement: String.raw`Let a connected resistor network with strictly positive resistances carry a prescribed net current from one node to another. Among all current distributions that obey Kirchhoff's current law (2.1) and deliver that net current, the one that satisfies Kirchhoff's voltage law (that is, the actual physical solution, 2.9) is the one that dissipates the least power $P = \sum_k R_k i_k^2$. Any other KCL-satisfying distribution dissipates strictly more, by exactly $\sum_k R_k\,\delta_k^2$, where $\delta$ is its difference from the true currents.`,
      idea: String.raw`KCL-satisfying flows with the same net current differ from the true flow $\mathbf i^\ast$ by a circulation $\boldsymbol\delta$ (a combination of loop currents). Expand $P(\mathbf i^\ast+\boldsymbol\delta) = P(\mathbf i^\ast) + 2\sum_k R_k i^\ast_k\delta_k + \sum_k R_k\delta_k^2$. The middle term is the work of the true voltages $v^\ast_k = R_k i^\ast_k$ on a circulation; because the voltages derive from node potentials (KVL), it is $\sum_k v^\ast_k\delta_k = 0$ (Tellegen, 3.6). What remains is a positive-definite quadratic in $\boldsymbol\delta$: a bowl with its bottom at $\boldsymbol\delta = 0$. Setting the gradient of $P$ to zero loop by loop is the same as writing KVL around each loop.`,
      caption: String.raw`The bridge network carries a fixed current from $A$ to $D$. The plane on the left is the space of all KCL-satisfying flows, written as the true flow plus $\delta_1$ times the circulation in the left mesh plus $\delta_2$ times the circulation in the right mesh. Colour and contours show the excess dissipated power, a bowl with its minimum at the origin (the true Kirchhoff solution, green). Drag the handle: the network on the right shows the trial flows, the power exceeds the minimum by exactly $\sum R_k\delta_k^2$, and the loop voltage sums, which are half the slopes of the bowl, vanish only at the bottom.`,
      scope: String.raw`Linear resistive networks with positive resistances and fixed injected currents. There is a dual statement (Maxwell/Kelvin) for voltages: the true node potentials minimize a co-content, and a version for fields in conductors (em-6.9). It does not hold with batteries inside branches unless the power function is modified.`,
      credit: 'Doyle–Snell, §1.3.5 (resistor-network formulation and proof of Thomson’s principle; original book 1984, author revision 2006)',
      deps: ['circ-2.9', 'circ-3.6', 'em-6.9'],
      refs: ['Doyle–Snell, Random Walks and Electric Networks, §1.3.5, pp. 49–51, Thomson’s Principle and complete proof; their bibliography cites Thomson–Tait (1879)'],
      tags: ['variational', 'dissipation'],
      viz(v) {
        const s = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: true, height: 360, weight: 1, title: 'space of KCL-satisfying flows: deviation from the true solution' });
        const sn = v.stage({ x: [-0.78, 0.78], y: [-0.68, 0.68], equal: true, axes: false, height: 360, weight: 1, title: 'trial flows (arrow width ∝ current)' });
        const I0 = v.slider('current $A \\to D$', 1, 10, 4, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} mA` });
        const seed = v.slider('resistor seed', 1, 40, 4, { int: true });
        const P = geom(BRI), h = s.handle(1.2, -0.9, { color: 'accent', label: 'trial', labelPos: 'ne' });
        let info = null;
        v.render(() => {
          const r = v.rng(seed.value * 13 + 5), R = BRI.edges.map(() => +(0.4 + 2.2 * r()).toFixed(2)), I = I0.value;
          const edges = BRI.edges.map(([a, b], k) => ({ a, b, g: 1 / R[k] })), phi = solveNet(4, edges, [I, 0, 0, -I], 0);
          const ist = BRI.edges.map(([a, b], k) => (phi[a] - phi[b]) / R[k]);
          const quad = (d1, d2) => R.reduce((a, rk, k) => a + rk * (d1 * C1[k] + d2 * C2[k]) ** 2, 0), Pst = R.reduce((a, rk, k) => a + rk * ist[k] ** 2, 0);
          const w = 0.75 * I + 1, f = (x, y) => quad(x, y);
          s.setView([-w, w], [-w, w]);
          const fmax = f(w, w) + 1e-9;
          s.raster((x, y) => [...v.ramp(Math.pow(clamp(f(x, y) / fmax, 0, 1), 0.5), 'accent'), 1], { res: 3, key: `${seed.value}|${I}` });
          s.contour(f, [0.05, 0.15, 0.3, 0.5, 0.75, 1, 1.5, 2.2].map((q) => q * fmax * 0.4), { color: 'ink', width: 1, alpha: 0.35 });
          s.axes();
          s.dot(0, 0, { r: 7, color: 'green', label: 'Kirchhoff', labelPos: 'sw' });
          const d1 = h.x, d2 = h.y, itr = ist.map((x, k) => x + d1 * C1[k] + d2 * C2[k]);
          const Ptr = R.reduce((a, rk, k) => a + rk * itr[k] ** 2, 0), L1 = itr.reduce((a, x, k) => a + R[k] * C1[k] * x, 0), L2 = itr.reduce((a, x, k) => a + R[k] * C2[k] * x, 0);
          const imax = Math.max(1e-9, ...itr.map(Math.abs), ...ist.map(Math.abs));
          drawNet(sn, v, P, BRI.edges.map(([a, b], k) => ({ a, b, kind: 'R', label: `${R[k]}k: ${v.fix(itr[k], 2)}`, cur: itr[k] / imax, color: Math.abs(itr[k] - ist[k]) > 0.01 ? 'orange' : 'ink' })), { nodeR: 7, names: BRI.names, nameDy: -16, labelSize: 10.5 });
          sn.text(`$I = ${v.fix(I, 1)}$ mA in at A, out at D`, 0, -0.6, { size: 12, color: 'muted' });
          info = { Pst, Ptr, L1, L2, gap: Ptr - Pst, pred: quad(d1, d2), d1, d2, gradA: 0, kcl: Math.max(...[0, 1, 2, 3].map((n) => Math.abs(BRI.edges.reduce((a, [p, q], k) => a + (p === n ? itr[k] : 0) - (q === n ? itr[k] : 0), 0) - (n === 0 ? I : n === 3 ? -I : 0)))) };
        });
        v.readout(() => {
          if (!info) return '';
          const { Pst, Ptr, L1, L2, gap, pred, kcl } = info;
          return `KCL holds for every trial (largest node imbalance $${v.sci(kcl + 1e-20, 1)}$ mA). Power: true solution $P^\\ast = ${v.fix(Pst, 4)}$ mW, trial $P = ${v.fix(Ptr, 4)}$ mW, excess $${v.fix(gap, 5)}$ mW $= \\sum R_k\\delta_k^2 = ${v.fix(pred, 5)}$ mW $\\ge 0$.\nLoop voltage sums (KVL residuals) $\\sum_{\\text{left mesh}} R i = ${v.fix(L1, 4)}$ V and $\\sum_{\\text{right mesh}} R i = ${v.fix(L2, 4)}$ V: zero only at the minimum, and equal to half the gradient of $P$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.11
    {
      num: '3.11',
      kind: 'Concept',
      name: 'Duality of planar networks',
      statement: String.raw`Every planar network has a dual network, obtained by placing a node in each mesh (face) of the drawing, plus one in the outer region, and drawing a branch across each original branch. Under this correspondence meshes become nodes, series becomes parallel, a voltage source becomes a current source (and vice versa), a resistance $R$ becomes a conductance of the same numerical value $G = R$ (in suitable units), and Kirchhoff's current law at a node becomes Kirchhoff's voltage law around a mesh. Consequently the node voltages of the dual circuit have the same numerical values as the mesh currents of the original circuit, and branch voltages of the original equal branch currents of the dual.`,
      idea: String.raw`Mesh analysis (2.6) of the original gives $\mathbf R\mathbf m = \mathbf e$ with $\mathbf R$ the mesh resistance matrix (sums of branch resistances on the diagonal, minus shared ones off it), while node analysis (2.5) of the dual gives $\mathbf G'\boldsymbol\psi = \mathbf i'$ with $\mathbf G'$ the sums of dual conductances, minus shared ones. In a planar embedding the mesh $f$ is bordered by the very branches that meet at the dual node $f$, so with $G' = R$ the two matrices are *identical*, and so are the right-hand sides if $I' = V$. Planarity is needed so that the meshes are the faces of the drawing.`,
      caption: String.raw`The original (blue) is the bridge with its source, with five resistors you can set. Switch the view to see its dual (orange): a node in each face, a branch across each branch, with ground outside. Both circuits are solved separately, the original by mesh currents and the dual by node voltages (and the original by node voltages as a check). The bars at the right pair each original mesh current with the dual node voltage, and each original branch voltage with the dual branch current: the pairs are equal.`,
      scope: String.raw`Planar networks (a drawing without crossing branches exists); non-planar networks (such as $K_5$ or $K_{3,3}$ graphs) have no dual in this sense. The numerical equality of $R$ and $G$ depends on the choice of units; the structure is what is dual.`,
      deps: ['circ-2.6', 'circ-2.5', 'graph-4.6.1a'],
      refs: ['Agarwal–Lang ch. 3'],
      tags: ['duality', 'planar', 'mesh'],
      viz(v) {
        const s = v.stage({ x: [-1.6, 7.6], y: [-3.9, 4.0], equal: true, axes: false, height: 420, weight: 1.15, title: 'bridge (blue) and its dual (orange)' });
        const sb = v.stage({ x: [0.3, 12.7], y: [-1, 1], axes: 'box', gutter: true, height: 400, weight: 1, ylabel: 'value', xticks: [[1, 'm₁'], [2, 'm₂'], [3, 'm₃'], [4.5, 'v_AB'], [5.5, 'v_BC'], [6.5, 'v_CA'], [7.5, 'v_BD'], [8.5, 'v_DC'], [9.5, 'V'], ], title: 'original quantity (blue) against its dual (orange)' });
        const view = v.select('show', [{ value: 'p', label: 'original' }, { value: 'd', label: 'dual' }, { value: 'b', label: 'both' }], 'b');
        const lg = { log: true, sig: 2, fmt: (x) => `${v.fix(x, 2)}` };
        const rs = { AB: v.slider('$r_{AB}$ (kΩ ↔ mS)', 0.2, 5, 1, lg), BC: v.slider('$r_{BC}$', 0.2, 5, 2, lg), CA: v.slider('$r_{CA}$', 0.2, 5, 2.5, lg), BD: v.slider('$r_{BD}$', 0.2, 5, 0.8, lg), DC: v.slider('$r_{DC}$', 0.2, 5, 1.2, lg) };
        const Vs = v.slider('source $V$ (volts ↔ mA)', 1, 20, 10, { step: 0.5, fmt: (x) => v.fix(x, 1) });
        let info = null;
        v.render(() => {
          const r = Object.fromEntries(Object.entries(rs).map(([k, sl]) => [k, sl.value])), V = Vs.value;
          // original by nodes: A = 1, B = 2, C = 3, D = 0 (ground); reference directions AB, BC, CA, BD, DC, source D→A
          const nodal = mna(3, [{ t: 'R', a: 1, b: 2, r: r.AB }, { t: 'R', a: 2, b: 3, r: r.BC }, { t: 'R', a: 3, b: 1, r: r.CA }, { t: 'R', a: 2, b: 0, r: r.BD }, { t: 'R', a: 0, b: 3, r: r.DC }, { t: 'V', a: 1, b: 0, v: V }]);
          const ib = nodal.cur.slice(0, 5), isrc = -nodal.cur[5];                        // current traversing the source D → A
          // original by meshes (clockwise F1, F2, F3)
          const Rm = [[r.AB + r.BC + r.CA, -r.BC, -r.CA], [-r.BC, r.BD + r.DC + r.BC, -r.DC], [-r.CA, -r.DC, r.CA + r.DC]], m = gauss(Rm, [0, 0, V]);
          // dual by nodes: F1 = 1, F2 = 2, F3 = 3, O = ground; conductances G = r, current source V into F3
          const dual = mna(3, [{ t: 'R', a: 1, b: 0, r: 1 / r.AB }, { t: 'R', a: 2, b: 0, r: 1 / r.BD }, { t: 'R', a: 1, b: 2, r: 1 / r.BC }, { t: 'R', a: 1, b: 3, r: 1 / r.CA }, { t: 'R', a: 2, b: 3, r: 1 / r.DC }, { t: 'I', a: 0, b: 3, i: V }]);
          const psi = dual.v.slice(1);
          // pairs: mesh current m_f ↔ dual node voltage; branch voltage ↔ dual branch current (positive = same reference direction)
          const vb = [r.AB * ib[0], r.BC * ib[1], r.CA * ib[2], r.BD * ib[3], r.DC * ib[4]], id = [dual.cur[0], dual.cur[2], dual.cur[3], dual.cur[1], dual.cur[4]];
          const dualBranch = [psi[0] * r.AB, (psi[0] - psi[1]) * r.BC, (psi[0] - psi[2]) * r.CA, psi[1] * r.BD, (psi[1] - psi[2]) * r.DC];
          void id;
          const pairs = [[m[0], psi[0]], [m[1], psi[1]], [m[2], psi[2]], [vb[0], dualBranch[0]], [vb[1], dualBranch[1]], [vb[2], dualBranch[2]], [vb[3], dualBranch[3]], [vb[4], dualBranch[4]], [V, V]];
          const xs = [1, 2, 3, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5];
          const top = Math.max(1, ...pairs.flat().map(Math.abs)) * 1.2;
          sb.setView([0.3, 10.3], [-top, top]);
          pairs.forEach(([a, b], k) => { sb.rect(xs[k] - 0.4, Math.min(0, a), xs[k] - 0.02, Math.max(0, a), { fill: 'accent', fillAlpha: 0.4, color: 'accent', width: 1.3 }); sb.rect(xs[k] + 0.02, Math.min(0, b), xs[k] + 0.4, Math.max(0, b), { fill: 'orange', fillAlpha: 0.4, color: 'orange', width: 1.3 }); });
          sb.hline(0, { color: 'ink', width: 1.2 });
          // pictures
          const showP = view.value !== 'd', showD = view.value !== 'p', pc = showD ? 'accent' : 'ink';
          const P = PRI, W = (a, b, col) => s.line(a[0], a[1], b[0], b[1], { color: col, width: 2 });
          if (showP) {
            const lab = (k, e) => `${k} ${v.fix(r[k], 2)}`;
            const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
            [['AB', 'A', 'B'], ['BC', 'B', 'C'], ['CA', 'C', 'A'], ['BD', 'B', 'D'], ['DC', 'D', 'C']].forEach(([k, a, b]) => {
              drawEl(s, P[a], P[b], 'R', { color: pc, amp: 0.05 });
              const m0 = mid(P[a], P[b]); if (view.value !== 'd') s.text(lab(k), m0[0] + { AB: -0.55, BC: 0.45, CA: -0.5, BD: 0.55, DC: 0.5 }[k], m0[1] + { AB: 0.45, BC: -0.5, CA: -0.45, BD: 0.45, DC: -0.45 }[k], { size: 11, color: pc, plate: true });
            });
            W(P.D, [6, -1.6], pc); W([6, -1.6], [2.4, -1.6], pc); drawEl(s, [1.2, -1.6], [2.4, -1.6], 'V', { color: pc, size: 0.2 }); W([1.2, -1.6], [0, -1.6], pc); W([0, -1.6], P.A, pc);
            s.text(`$V = ${v.fix(V, 1)}$`, 0.9, -2.15, { size: 11.5, color: pc });
            for (const k of ['A', 'B', 'C', 'D']) s.dot(P[k][0], P[k][1], { r: 5.5, color: pc, label: k, labelPos: k === 'A' ? 'w' : k === 'D' ? 'e' : k === 'B' ? 'n' : 's' });
          }
          if (showD) {
            const oc = showP ? 'orange' : 'ink', F = FAC, gnd = (x, y) => { s.line(x - 0.18, y, x + 0.18, y, { color: oc, width: 2 }); s.line(x - 0.11, y - 0.07, x + 0.11, y - 0.07, { color: oc, width: 2 }); s.line(x - 0.04, y - 0.14, x + 0.04, y - 0.14, { color: oc, width: 2 }); };
            const edge = (p, q, k, kind = 'R') => { drawEl(s, p, q, kind, { color: oc, amp: 0.05, size: 0.1 }); const m0 = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; if (k) s.text(k, m0[0] + 0.35, m0[1] + 0.12, { size: 11, color: oc, plate: true }); };
            const gl = (x) => (view.value === 'd' ? x : null);
            edge(F.F1, [1.2, 3.5], gl(`G ${v.fix(r.AB, 2)}`)); gnd(1.2, 3.5);
            edge(F.F2, [4.8, 3.5], gl(`G ${v.fix(r.BD, 2)}`)); gnd(4.8, 3.5);
            edge(F.F1, F.F2, gl(`G ${v.fix(r.BC, 2)}`)); edge(F.F1, F.F3, gl(`G ${v.fix(r.CA, 2)}`)); edge(F.F2, F.F3, gl(`G ${v.fix(r.DC, 2)}`));
            edge([3, -3.3], F.F3, gl(`I = ${v.fix(V, 1)}`), 'I'); gnd(3, -3.3);
            ['F1', 'F2', 'F3'].forEach((k, i) => { s.dot(F[k][0], F[k][1], { r: 6, color: oc }); s.text(`ψ${i + 1} = ${v.fix(psi[i], 2)}`, F[k][0], F[k][1], { size: 11, color: oc, dy: i === 2 ? 17 : -15, plate: true }); });
          }
          info = { meshErr: Math.max(...[0, 1, 2].map((i) => Math.abs(m[i] - psi[i]))), brErr: Math.max(...[3, 4, 5, 6, 7].map((k) => Math.abs(pairs[k][0] - pairs[k][1]))), m, psi, mesh2: ib[0] - m[0] };
        });
        v.legend([['accent', 'original: mesh currents $m_k$ (mA), branch voltages (V)'], ['orange', 'dual: node voltages $\\psi_k$ (V), branch currents (mA)']]);
        v.readout(() => {
          if (!info) return '';
          const { meshErr, brErr, m, psi, mesh2 } = info;
          return `Mesh currents of the original (solved by meshes): $(${m.map((x) => v.fix(x, 4)).join(', ')})$ mA. Node voltages of the dual (solved by nodes): $(${psi.map((x) => v.fix(x, 4)).join(', ')})$ V. Largest difference $${v.sci(meshErr + 1e-20, 1)}$.\nBranch voltages of the original against branch currents of the dual: largest difference $${v.sci(brErr + 1e-20, 1)}$. (The original was also solved by nodes: $i_{AB} - m_1 = ${v.sci(Math.abs(mesh2) + 1e-20, 1)}$.)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.12
    {
      num: '3.12',
      kind: 'Theorem',
      name: 'Millman’s theorem',
      statement: String.raw`Let $n$ branches, each a voltage source $V_k$ in series with a resistance $R_k$ (conductance $G_k = 1/R_k$), be joined between a common node $X$ and a common reference node. Then the voltage of $X$ relative to the reference is $$V_X = \frac{\sum_k G_k V_k}{\sum_k G_k},$$ a conductance-weighted average of the source voltages. A branch with a current source $I_k$ toward $X$ adds $I_k$ to the numerator and nothing to the denominator; a branch with no source is $V_k = 0$ and only adds its conductance to the denominator. The theorem is also called the parallel-generator theorem.`,
      idea: String.raw`Kirchhoff's current law at $X$ says that the currents leaving $X$ through the branches sum to zero: $\sum_k G_k (V_X - V_k) = 0$ (each branch current is $G_k$ times the voltage across its resistor). This is linear in $V_X$, and solving it gives the weighted mean. In the language of 3.4, each branch is a Norton source $I_k = G_kV_k$ with shunt conductance $G_k$, and parallel current sources add while parallel conductances add; the theorem is a one-line node analysis (2.5) with a single unknown. The weights act like masses: $V_X$ is the centre of mass of the values $V_k$ with masses $G_k$.`,
      caption: String.raw`Left: four voltage-source branches feeding a common node, solved live by the circuit kit. Right: the same numbers as a balance. Drag a source value $V_k$ up or down (the disc area is its conductance $G_k$, so a small resistance is heavy); the node voltage (green line) is the centre of mass, and the signed tugs $G_k(V_k - V_X)$ always cancel. Change a resistance to move the weights.`,
      scope: String.raw`Linear resistive branches all joined at one node (a one-node network after source transformation). No assumption on signs of $V_k$; the weights $G_k$ must be positive or at least have a nonzero sum.`,
      deps: ['circ-3.4', 'circ-2.5'],
      refs: ['Agarwal–Lang ch. 3'],
      tags: ['millman', 'weighted average'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Millman%27s_theorem' },
      viz(v) {
        const s = v.stage({ x: [-1.2, 10.4], y: [-0.7, 3.9], equal: true, axes: false, height: 300, weight: 1.15, title: 'four branches, one node' });
        const sp = v.stage({ x: [0.3, 4.9], y: [-10, 10], axes: 'box', gutter: true, height: 300, weight: 0.95, ylabel: 'voltage (V)', xticks: [[1, 'V₁'], [2, 'V₂'], [3, 'V₃'], [4, 'V₄']], title: 'a weighted average' });
        const Vk0 = [8, -2, 5, 1], Rk0 = [1000, 1000, 2000, 500], col = ['accent', 'orange', 'purple', 'teal'];
        const parts = [];
        for (let k = 0; k < 4; k++) { const x = 3 * k; parts.push({ type: 'R', id: `R${k + 1}`, name: `R${k + 1}`, value: Rk0[k], at: [x, 3, x, 1.5] }, { type: 'V', id: `V${k + 1}`, name: `V${k + 1}`, value: Vk0[k], at: [x, 1.5, x, 0] }); }
        parts.push({ type: 'W', at: [0, 3, 9, 3] }, { type: 'W', at: [0, 0, 9, 0] }, { type: 'GND', at: [4.5, 0] }, { type: 'label', at: [4.5, 3], text: '$V_X$', dy: -9 });
        const C = v.circuit(s, parts);
        const hs = Vk0.map((y, k) => sp.handle(k + 1, y, { color: col[k], constrain: { x: [k + 1, k + 1], y: [-9, 9] }, r: 7 }));
        const Rs = Rk0.map((r, k) => v.slider(`$R_${k + 1}$`, 100, 10e3, r, { log: true, sig: 2, fmt: (x) => sI(x, 'Ω', 2) }));
        let info = null;
        v.render(() => {
          const G = Rs.map((r) => 1 / r.value), Vk = hs.map((h) => h.y);
          Vk.forEach((y, k) => { C.part(`V${k + 1}`).value = y; C.part(`R${k + 1}`).value = Rs[k].value; });
          const res = C.dc(); C.draw({ result: res, vmax: 9 });
          const VX = Vk.reduce((a, y, k) => a + G[k] * y, 0) / G.reduce((a, g) => a + g, 0), Vkit = res.V(C.net.termNode.get('R1').a), Gmax = Math.max(...G);
          const tug = Vk.map((y, k) => G[k] * (y - VX));
          sp.hline(VX, { color: 'green', width: 3 });
          Vk.forEach((y, k) => {
            sp.line(k + 1, VX, k + 1, y, { color: col[k], width: 2 + 8 * G[k] / Gmax, alpha: 0.55 });
            sp.dot(k + 1, y, { r: 7 + 14 * Math.sqrt(G[k] / Gmax), color: col[k], hollow: true });
          });
          sp.text(`$V_X = ${v.fix(VX, 3)}$`, 4.9, VX, { size: 12.5, color: 'green', align: 'right', baseline: 'bottom', dy: -5, plate: true });
          info = { VX, Vkit, tug, sum: tug.reduce((a, x) => a + x, 0), G };
        });
        v.readout(() => {
          if (!info) return '';
          const { VX, Vkit, tug, sum, G } = info;
          return `Millman: $V_X = \\sum G_kV_k/\\sum G_k = ${v.fix(VX, 5)}$ V; circuit solver $${v.fix(Vkit, 5)}$ V.\nBranch currents leaving $X$: $${tug.map((x) => v.fix(x * 1e3, 3)).join(',\\ ')}$ mA, sum $= ${v.fix(z0(sum * 1e3, 1e-9), 6)}$ mA (conductances ${G.map((g) => v.fix(g * 1e3, 2)).join(', ')} mS).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.13
    {
      num: '3.13',
      kind: 'Method',
      name: 'Modified nodal analysis: how SPICE solves a circuit',
      statement: String.raw`Modified nodal analysis (MNA) writes a circuit as one linear system $\mathbf A\mathbf x = \mathbf z$ whose unknowns are the node voltages (all nodes but the ground) together with the currents of every element that cannot be written as a current in terms of voltages: independent voltage sources, and also inductors in the usual extension, or controlled sources with a voltage output. The matrix is assembled element by element by *stamping*: a resistor $G = 1/R$ between nodes $a, b$ adds $+G$ at $(a,a)$ and $(b,b)$ and $-G$ at $(a,b)$ and $(b,a)$; a current source adds $\mp I$ to the right-hand side; a voltage source adds a row and a column with $\pm 1$ entries and puts $V$ on the right; a voltage-controlled current source adds $\pm g_m$ at the rows of its output nodes and the columns of its control nodes. Solving the system yields every node voltage and every source current at once.`,
      idea: String.raw`Plain node analysis (2.5) needs every element to be a conductance (or a current source). A voltage source breaks this, since its current is not a function of its voltage. MNA keeps the node equations (KCL at each node) and appends the source's own constraint $v_a - v_b = V$ as one more equation, with the source current as one more unknown. Every element then contributes a fixed local pattern, independent of the rest of the circuit, so a program can build the matrix by looping through the netlist, with no search for loops or trees. A dependent source simply puts its gain in the column of its control variable, which is why $\mathbf A$ is no longer symmetric (3.8). Circuit simulators solve it by sparse LU; the nonlinear and dynamic cases linearize and repeat the same stamps.`,
      caption: String.raw`Step through the elements of a small circuit (slider). Each element stamps its pattern into the matrix; the entries it just wrote are gold, older entries blue. The first rows of the system are the KCL equations at nodes 1, 2, 3 and the last row is the voltage source's constraint. While some node has no connection to the rest, the matrix is singular and the solver says so; once the circuit is complete, the solution is painted back onto the schematic. The check below recomputes every node's current balance directly from the element laws, independent of the matrix.`,
      scope: String.raw`Linear circuits (nonlinear and dynamic elements are linearized into companion models and stamped the same way at each Newton step or time step). The formulation with source currents as unknowns is the one introduced as the "modified nodal approach"; the exact variant in a given simulator differs in details.`,
      credit: 'C.-W. Ho, A. E. Ruehli, P. A. Brennan, 1975 (IEEE Trans. Circuits Syst. CAS-22, 504–509)',
      deps: ['circ-2.5', 'circ-3.8'],
      refs: ['Agarwal–Lang §2.7'],
      tags: ['MNA', 'SPICE', 'matrix'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Modified_nodal_analysis' },
      viz(v) {
        // circuit (V, mA, kΩ, mS): nodes 1, 2, 3 and ground
        const ALL = [
          { t: 'V', a: 1, b: 0, v: 6, name: 'V1', tex: 'V_1', how: 'a voltage source adds a row and a column of ±1 and puts V on the right' },
          { t: 'R', a: 1, b: 2, r: 2, name: 'R1', tex: 'R_1', how: 'a resistor adds +G on the diagonal at both ends and −G at the two off-diagonal places' },
          { t: 'R', a: 2, b: 0, r: 3, name: 'R2', tex: 'R_2', how: 'a resistor to ground only touches its own diagonal entry' },
          { t: 'R', a: 2, b: 3, r: 1, name: 'R3', tex: 'R_3', how: 'a resistor adds +G on the diagonal at both ends and −G at the two off-diagonal places' },
          { t: 'R', a: 3, b: 0, r: 2, name: 'R4', tex: 'R_4', how: 'a resistor to ground only touches its own diagonal entry' },
          { t: 'I', a: 0, b: 3, i: 1, name: 'I1', tex: 'I_1', how: 'a current source touches only the right-hand side' },
          { t: 'G', a: 3, b: 0, cp: 2, cn: 0, g: 0.5, name: 'G1', tex: 'G_1', how: 'a controlled current source puts its gain in the column of the control node, on the row of its output node' },
        ];
        const pos = [[0.4, 2.2], [2.6, 2.2], [4.8, 2.2], [0.4, 0], [2.6, 0], [4.8, 0], [6.1, 0], [6.1, 2.2], [7.8, 2.2], [7.8, 0]];
        const s = v.stage({ x: [-1.2, 8.8], y: [-0.7, 3.3], equal: true, axes: false, height: 300, weight: 1.05, title: 'the circuit (kΩ, mA, V)' });
        const sm = v.stage({ x: [-0.8, 12], y: [0, 6], axes: false, height: 300, weight: 1.2, title: 'A x = z' });
        const K = v.slider('elements stamped', 0, ALL.length, ALL.length, { int: true });
        const names = ['v₁', 'v₂', 'v₃', 'i(V1)'];
        let info = null;
        v.render(() => {
          const k = K.value, els = ALL.slice(0, k), sol = mna(3, els.length ? els : [{ t: 'R', a: 1, b: 0, r: 1e12 }]);
          // matrix of the full size (3 nodes + 1 source current), rows empty before an element exists
          const N = 4, A = Array.from({ length: N }, () => new Array(N).fill(0)), z = new Array(N).fill(0), last = new Set();
          const rowOf = (r) => r; // node rows 0..2, source row 3
          els.forEach((e, q) => {
            const add = (r, c, val, hot) => { if (r < 0 || c < 0) return; A[rowOf(r)][c] += val; if (hot) last.add(`${r},${c}`); };
            const hot = q === k - 1, a = e.a - 1, b = e.b - 1;
            if (e.t === 'R') { const g = 1 / e.r; add(a, a, g, hot); add(b, b, g, hot); add(a, b, -g, hot); add(b, a, -g, hot); }
            else if (e.t === 'I') { if (a >= 0) { z[a] -= e.i; if (hot) last.add(`${a},z`); } if (b >= 0) { z[b] += e.i; if (hot) last.add(`${b},z`); } }
            else if (e.t === 'G') { add(a, e.cp - 1, e.g, hot); add(a, e.cn - 1, -e.g, hot); add(b, e.cp - 1, -e.g, hot); add(b, e.cn - 1, e.g, hot); }
            else if (e.t === 'V') { add(a, 3, 1, hot); add(b, 3, -1, hot); add(3, a, 1, hot); add(3, b, -1, hot); z[3] += e.v; if (hot) last.add('3,z'); }
          });
          const x = gauss(A, z), ok = !!x;
          // matrix picture
          sm.text('$\\mathbf A$', 3.6, 5.75, { size: 14, color: 'ink' }); sm.text('$\\mathbf x$', 8.2, 5.75, { size: 14, color: 'ink' }); sm.text('$\\mathbf z$', 10.9, 5.75, { size: 14, color: 'ink' });
          const cw = 1.55, ch = 1.1, x0 = 0.9, y0 = 4.6;
          for (let i = 0; i < N; i++) {
            sm.text(['KCL 1', 'KCL 2', 'KCL 3', 'V1 eqn'][i], x0 - 0.1, y0 - i * ch - ch / 2, { size: 10.5, color: 'muted', align: 'right' });
            for (let j = 0; j < N; j++) {
              const val = A[i][j], hotc = last.has(`${i},${j}`), cx = x0 + j * cw;
              sm.rect(cx + 0.03, y0 - (i + 1) * ch + 0.04, cx + cw - 0.03, y0 - i * ch - 0.04, { fill: hotc ? 'gold' : Math.abs(val) > 1e-12 ? 'accent' : 'grid', fillAlpha: hotc ? 0.5 : Math.abs(val) > 1e-12 ? 0.16 : 0.1, color: hotc ? 'gold' : 'grid', width: hotc ? 2 : 1 });
              sm.text(Math.abs(val) < 1e-12 ? '0' : v.fix(val, 2), cx + cw / 2, y0 - i * ch - ch / 2, { size: 12, color: Math.abs(val) < 1e-12 ? 'faint' : 'ink' });
            }
            sm.rect(8.0 + 0.1, y0 - (i + 1) * ch + 0.04, 9.2 + 0.1, y0 - i * ch - 0.04, { fill: 'green', fillAlpha: ok ? 0.14 : 0.04, color: 'grid', width: 1 });
            sm.text(ok ? v.fix(x[i], 3) : names[i], 8.7, y0 - i * ch - ch / 2, { size: 12, color: ok ? 'ink' : 'muted' });
            const hz = last.has(`${i},z`);
            sm.rect(10.4, y0 - (i + 1) * ch + 0.04, 11.6, y0 - i * ch - 0.04, { fill: hz ? 'gold' : 'accent', fillAlpha: hz ? 0.5 : Math.abs(z[i]) > 1e-12 ? 0.16 : 0.1, color: hz ? 'gold' : 'grid', width: hz ? 2 : 1 });
            sm.text(Math.abs(z[i]) < 1e-12 ? '0' : v.fix(z[i], 2), 11.0, y0 - i * ch - ch / 2, { size: 12, color: Math.abs(z[i]) < 1e-12 ? 'faint' : 'ink' });
          }
          sm.text('=', 9.75, y0 - 2 * ch, { size: 16, color: 'ink' });
          // schematic
          const vcol = ok ? [0, x[0], x[1], x[2]] : null, phi = ok ? [x[0], x[1], x[2], 0, 0, 0, 0, 0, 0, 0] : null;
          const mp = (e) => ({ 1: 0, 2: 1, 3: 2 }[e]);
          const place = [ // [element index, p, q] in pos indices; ground = rail positions
            [0, 0, 3], [1, 0, 1], [2, 1, 4], [3, 1, 2], [4, 2, 5], [5, 6, 7], [6, 8, 9],
          ];
          const parts = [];
          ALL.forEach((e, q) => {
            const on = q < k; if (!on) return;
            const [, p0, q0] = place[q]; const kind = e.t === 'V' ? 'V' : e.t === 'R' ? 'R' : e.t === 'I' ? 'I' : 'D';
            const cur = sol && !sol.singular && ok ? sol.cur[q] : null;
            parts.push({ a: p0, b: q0, kind, sym: 'arrow', label: `$${e.tex}$`, color: q === k - 1 ? 'gold' : 'ink', cur: cur != null ? clamp(cur / 4, -1, 1) : null, hl: q === k - 1 });
          });
          // wires to the right-hand side and the ground rail
          if (k >= 6) s.line(pos[2][0], pos[2][1], pos[7][0], pos[7][1], { color: 'ink', width: 2.2 });
          if (k >= 7) s.line(pos[7][0], pos[7][1], pos[8][0], pos[8][1], { color: 'ink', width: 2.2 });
          s.line(pos[3][0], pos[3][1], pos[9][0], pos[9][1], { color: 'ink', width: 2 });
          drawNet(s, v, pos, parts, { phi, vmax: 6, nodeR: 7, skip: [3, 4, 5, 6, 7, 8, 9], labelSize: 12, size: 0.12, labelOff: 0.45 });
          ['1', '2', '3'].forEach((nm, i) => s.text(`${nm}`, pos[i][0], pos[i][1], { size: 12, color: 'ink', dy: -22 }));
          void vcol; void mp;
          // independent check: KCL residual at each node from the element laws
          let resid = 0;
          if (ok) { const v0 = [0, x[0], x[1], x[2]]; for (let n = 1; n <= 3; n++) { let sNode = 0; els.forEach((e) => { let c; if (e.t === 'R') c = (v0[e.a] - v0[e.b]) / e.r; else if (e.t === 'I') c = e.i; else if (e.t === 'G') c = e.g * (v0[e.cp] - v0[e.cn]); else c = x[3]; if (e.a === n) sNode += c; if (e.b === n) sNode -= c; }); resid = Math.max(resid, Math.abs(sNode)); } }
          info = { k, ok, how: k ? ALL[k - 1].how : 'nothing stamped yet: the matrix is empty', name: k ? ALL[k - 1].tex : '', resid, x };
        });
        v.readout(() => {
          if (!info) return '';
          const { k, ok, how, name, resid } = info;
          return `${k ? `Last stamped: $${name}$ — ${how}.` : how}\n${ok ? `Solved ($\\mathbf A\\mathbf x=\\mathbf z$ is nonsingular): KCL residual recomputed from the element laws, $${v.sci(resid + 1e-20, 1)}$ mA.` : 'The matrix is singular so far: some node (or the source loop) is not yet tied to ground, so its equation is empty or undetermined. Add the next elements.'}`;
        });
      },
    },
  ],
};
