// Circuits — Chapter 3: Network theorems (part a: 3.1–3.7)
//
// All component values are illustrative. Historical attributions were checked against secondary sources (D. H. Johnson, Proc. IEEE 2003;
// Wikipedia); where a date or name rests on a secondary source only, the item says so or carries verify: true.
import { clamp, sI, z0, NETS, geom, mna, drawNet, boxSolve, boxTests, boxRoff, BOX, diodeI, solveNet, gauss } from './ch03.shared.js';

export default {
  collection: 'circ',
  chapter: 3,
  title: 'Network theorems',
  summary: String.raw`Linearity pays off in a handful of theorems that let us reason about circuits without solving them in full. Superposition splits the effect of many sources into a sum, and Thévenin and Norton compress an entire linear network into one source and one resistor as seen from a pair of terminals. Maximum power transfer, reciprocity and Tellegen's remarkable theorem, which depends only on the graph and not on the elements, complete the toolkit, together with dependent sources, two-ports, duality and the matrix method that circuit simulators actually use.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Theorem',
      name: 'Superposition',
      statement: String.raw`In a linear circuit with several independent sources, every branch voltage and branch current is the sum of the responses to each source acting alone, the others being switched off: an ideal voltage source is replaced by a short circuit (its voltage set to $0$), an ideal current source by an open circuit (its current set to $0$). Dependent sources are not switched off; they stay in the circuit. The theorem applies to voltages and currents, never to power, which is quadratic in them.`,
      idea: String.raw`Node-voltage analysis (2.5) turns the circuit into a linear system $\mathbf G\mathbf v = \mathbf s$ whose right-hand side $\mathbf s$ is a sum of columns, one for each source, and $\mathbf G$ is invertible (2.9). Linearity of the inverse gives $\mathbf v = \sum_k \mathbf G^{-1}\mathbf s_k$, and each term is exactly the solution with only source $k$ present. The argument breaks at once if any element is nonlinear, because then there is no matrix $\mathbf G$ independent of the sources.`,
      caption: String.raw`Three independent sources (two voltage sources and one current source) drive a node $X$. The first three bars are the node voltage when each source acts alone (the other two switched off), the fourth stacks them, the fifth is the full circuit. With the resistor in the last branch, the stack and the full solution agree to rounding error. Switch the last branch to a diode and the two no longer match: the diode's response depends on all sources together. The readout also shows that the *power* in the last resistor does not add.`,
      scope: String.raw`Linear circuits only (resistors, capacitors, inductors and dependent sources that are linear in their control variable), with independent sources acting through a unique solution (2.9). Holds for voltages and currents, not for power.`,
      deps: ['circ-2.5', 'circ-2.9'],
      refs: ['Agarwal–Lang §3.5'],
      tags: ['superposition', 'linearity'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Superposition_principle#Applications' },
      viz(v) {
        const parts = (diode) => [
          { type: 'R', id: 'R1', name: 'R1', value: 1000, at: [0, 3, 0, 1.5] }, { type: 'V', id: 'V1', name: 'V1', value: 6, at: [0, 1.5, 0, 0] },
          { type: 'R', id: 'R2', name: 'R2', value: 2000, at: [3, 3, 3, 1.5] }, { type: 'V', id: 'V2', name: 'V2', value: 3, at: [3, 1.5, 3, 0] },
          { type: 'I', id: 'I1', name: 'I1', value: 0.001, at: [6, 0, 6, 3] },
          diode ? { type: 'D', id: 'D3', name: 'D', model: 'shockley', at: [9, 3, 9, 0] } : { type: 'R', id: 'R3', name: 'R3', value: 1000, at: [9, 3, 9, 0] },
          { type: 'W', at: [0, 3, 9, 3] }, { type: 'W', at: [0, 0, 9, 0] }, { type: 'GND', at: [4.5, 0] }, { type: 'label', at: [4.5, 3], text: '$v_X$', dy: -9 },
        ];
        const s = v.stage({ x: [-1.2, 10.4], y: [-0.7, 3.9], equal: true, axes: false, height: 300, weight: 1.15, title: 'three sources, one node' });
        const sb = v.stage({ x: [0.3, 5.7], y: [-1, 1], axes: 'box', gutter: true, height: 300, weight: 1, ylabel: '$v_X$ (V)', xticks: [[1, 'V₁ alone'], [2, 'V₂ alone'], [3, 'I₁ alone'], [4, 'sum of the 3'], [5, 'all on']], title: 'response at the node' });
        const variants = { R: v.circuit(s, parts(false)), D: v.circuit(s, parts(true)) };
        const last = v.select('last branch', [{ value: 'R', label: 'resistor' }, { value: 'D', label: 'diode' }], 'R');
        const V1 = v.slider('$V_1$', -10, 10, 6, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} V` });
        const V2 = v.slider('$V_2$', -10, 10, 3, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} V` });
        const I1 = v.slider('$I_1$', -5, 5, 1, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} mA` });
        let info = null;
        v.render(() => {
          const C = variants[last.value], full = { V1: V1.value, V2: V2.value, I1: I1.value * 1e-3 }, X = C.net.termNode.get('R1').a;
          const solve = (vals) => { for (const k of Object.keys(full)) C.part(k).value = vals[k]; return C.dc(); };
          const parts3 = ['V1', 'V2', 'I1'].map((k) => { const vals = { V1: 0, V2: 0, I1: 0 }; vals[k] = full[k]; const r = solve(vals); return { k, vx: r.V(X), p: last.value === 'R' ? r.P('R3') : 0 }; });
          const res = solve(full); C.draw({ result: res, vmax: 8 });
          const vFull = res.V(X), sum = parts3.reduce((a, q) => a + q.vx, 0), pFull = last.value === 'R' ? res.P('R3') : 0, pSum = parts3.reduce((a, q) => a + q.p, 0);
          const top = Math.max(1, vFull, sum, ...parts3.map((q) => Math.abs(q.vx))) * 1.25, bot = Math.min(0, vFull, sum, ...parts3.map((q) => q.vx)) * 1.25;
          sb.setView([0.3, 5.7], [Math.min(bot, -0.3 * top), top]);
          const cols = ['accent', 'orange', 'purple'];
          parts3.forEach((q, k) => sb.rect(k + 1 - 0.32, Math.min(0, q.vx), k + 1 + 0.32, Math.max(0, q.vx), { fill: cols[k], fillAlpha: 0.4, color: cols[k], width: 1.5 }));
          let cum = 0;
          parts3.forEach((q, k) => { sb.rect(3.68, Math.min(cum, cum + q.vx), 4.32, Math.max(cum, cum + q.vx), { fill: cols[k], fillAlpha: 0.4, color: cols[k], width: 1.5 }); cum += q.vx; });
          const ok = Math.abs(vFull - sum) < 1e-6 * Math.max(1, Math.abs(vFull));
          sb.rect(4.68, Math.min(0, vFull), 5.32, Math.max(0, vFull), { fill: ok ? 'green' : 'red', fillAlpha: 0.4, color: ok ? 'green' : 'red', width: 1.5 });
          sb.hline(0, { color: 'ink', width: 1.2 });
          sb.hline(sum, { color: 'muted', width: 1.2, dash: true });
          parts3.forEach((q, k) => sb.text(`${v.fix(q.vx, 2)}`, k + 1, q.vx >= 0 ? q.vx : 0, { size: 12, baseline: 'bottom', dy: -3, color: cols[k], plate: true }));
          sb.text(v.fix(sum, 3), 4, Math.max(sum, 0), { size: 12, baseline: 'bottom', dy: -3, plate: true });
          sb.text(v.fix(vFull, 3), 5, Math.max(vFull, 0), { size: 12, baseline: 'bottom', dy: -3, color: ok ? 'green' : 'red', plate: true });
          info = { vFull, sum, ok, pFull, pSum, diode: last.value === 'D' };
        });
        v.legend([['accent', '$V_1$ alone'], ['orange', '$V_2$ alone'], ['purple', '$I_1$ alone'], ['green', 'full = sum'], ['red', 'full $\\ne$ sum']]);
        v.readout(() => {
          if (!info) return '';
          const { vFull, sum, ok, pFull, pSum, diode } = info;
          const l1 = `Sum of the three partial responses $= ${v.fix(sum, 4)}$ V; all sources on: $v_X = ${v.fix(vFull, 4)}$ V; difference $${v.sci(Math.abs(vFull - sum) + 1e-20, 2)}$ V.`;
          if (diode) return `${l1}\n${ok ? 'The sources happen to agree here, but' : 'Superposition fails:'} the diode makes the response nonlinear, so the three experiments do not predict the fourth.`;
          return `${l1}\nPower in $R_3$ is *not* additive: the sum of the three partial powers is ${v.fix(pSum * 1e3, 3)} mW, the true power is ${v.fix(pFull * 1e3, 3)} mW (the cross terms $2 v_a v_b/R_3$ are missing).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'Thévenin’s theorem',
      statement: String.raw`Let $N$ be a linear network containing independent sources, resistances and dependent sources, with two accessible terminals $a, b$, and suppose that nothing outside $N$ is coupled to its interior except through these terminals. Then, as far as anything connected across $a$–$b$ is concerned, $N$ is equivalent to a single ideal voltage source $V_{\mathrm{Th}}$ in series with a single resistance $R_{\mathrm{Th}}$. Here $V_{\mathrm{Th}}$ is the open-circuit voltage $v_{ab}$ of $N$, and $R_{\mathrm{Th}}$ is the resistance seen from the terminals when all independent sources of $N$ are switched off (equivalently $V_{\mathrm{Th}}/I_{\mathrm{sc}}$, with $I_{\mathrm{sc}}$ the short-circuit current). The load may be nonlinear; $N$ must be linear.`,
      idea: String.raw`Connect a test current source $i$ to the terminals and apply superposition (3.1): the terminal voltage is the response to the sources inside $N$ alone (the open-circuit voltage $V_{\mathrm{oc}}$) plus the response to $i$ alone with those sources off, which by linearity is proportional to $i$, say $-R_{\mathrm{Th}}\, i$. So $v_{ab} = V_{\mathrm{oc}} - R_{\mathrm{Th}}\,i$, which is exactly the terminal law of a source in series with a resistor. Any circuit attached to $a$–$b$ imposes only one more relation between $v_{ab}$ and $i$, so the intersection is the same for $N$ and its equivalent.`,
      caption: String.raw`The boxed network (left) is probed by connecting different load resistors; each measured $(v_{ab}, i)$ is a gold point on the plane below, and they fall exactly on a straight line, whose intercepts are $V_{\mathrm{Th}}$ and $I_{\mathrm{sc}}$ and whose slope is $-1/R_{\mathrm{Th}}$. The small circuit (middle) is the two-element equivalent. Drag the load slider: the original circuit and its equivalent give the same $v_L$ and $i_L$ (orange load line meets the characteristic at the green point), although the power dissipated *inside* the two differs. Change the sources and the line moves; the slope stays at $-1/R_{\mathrm{Th}}$ obtained by switching the sources off.`,
      scope: String.raw`$N$ must be linear (the load need not be); with ideal dependent sources $R_{\mathrm{Th}}$ may be zero, infinite or negative. The equivalence concerns the terminals only, not the power dissipated inside the box.`,
      credit: 'H. von Helmholtz, 1853; L. C. Thévenin, 1883',
      deps: ['circ-3.1'],
      refs: ['Agarwal–Lang §3.6', 'Horowitz–Hill §1.2'],
      tags: ['thevenin', 'equivalent circuit'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Th%C3%A9venin%27s_theorem' },
      viz(v) {
        const s = v.stage({ x: [-1.7, 9.6], y: [-0.7, 4.5], equal: true, axes: false, height: 270, weight: 1.35, title: 'the boxed network and a load' });
        const se = v.stage({ x: [-1.7, 4.9], y: [-0.7, 4.5], equal: true, axes: false, height: 270, weight: 0.85, title: 'its Thévenin equivalent' });
        const sp = v.stage({ x: [-2, 14], y: [-1, 14], axes: 'box', gutter: true, height: 330, full: true, xlabel: 'terminal voltage $v_{ab}$ (V)', ylabel: 'current into the load (mA)', title: 'what the terminals see' });
        const C = v.circuit(s, [
          { type: 'V', id: 'V1', name: 'V', value: BOX.V, at: [0, 3, 0, 0] }, { type: 'W', at: [0, 3, 1, 3] }, { type: 'R', id: 'R1', name: 'R1', value: BOX.R1, at: [1, 3, 3.5, 3] },
          { type: 'R', id: 'R2', name: 'R2', value: BOX.R2, at: [3.5, 3, 3.5, 0], labelSide: -1 }, { type: 'W', at: [3.5, 3, 5, 3] }, { type: 'I', id: 'Is', name: 'Is', value: BOX.Is, at: [5, 0, 5, 3] },
          { type: 'R', id: 'R3', name: 'R3', value: BOX.R3, at: [5, 3, 7, 3] }, { type: 'W', at: [7, 3, 8.6, 3] }, { type: 'R', id: 'RL', name: 'RL', value: 1000, at: [8.6, 3, 8.6, 0] },
          { type: 'W', at: [0, 0, 8.6, 0] }, { type: 'GND', at: [4, 0] },
        ]);
        const E = v.circuit(se, [
          { type: 'V', id: 'VT', name: '$V_{Th}$', value: 5, at: [0, 3, 0, 0] }, { type: 'R', id: 'RT', name: '$R_{Th}$', value: 1000, at: [0, 3, 2.4, 3] }, { type: 'W', at: [2.4, 3, 3.9, 3] },
          { type: 'R', id: 'RL', name: 'RL', value: 1000, at: [3.9, 3, 3.9, 0] }, { type: 'W', at: [0, 0, 3.9, 0] }, { type: 'GND', at: [2, 0] },
        ]);
        const Vs = v.slider('source $V$', 0, 24, 12, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} V` });
        const Is = v.slider('source $I_s$', -4, 4, 2, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} mA` });
        const R2 = v.slider('$R_2$', 300, 10e3, 2000, { log: true, sig: 2, fmt: (x) => sI(x, 'Ω', 2) });
        const RL = v.slider('load $R_L$', 50, 20e3, 1000, { log: true, sig: 2, fmt: (x) => sI(x, 'Ω', 2) });
        let info = null;
        v.render(() => {
          const p = { ...BOX, V: Vs.value, Is: Is.value * 1e-3, R2: R2.value };
          C.part('V1').value = p.V; C.part('Is').value = p.Is; C.part('R2').value = p.R2; C.part('RL').value = RL.value;
          const { Voc, Isc, Rth } = boxTests(p, false), Roff = boxRoff(p);
          E.part('VT').value = Voc; E.part('RT').value = Rth; E.part('RL').value = RL.value;
          const r1 = C.dc(), r2 = E.dc(); C.draw({ result: r1, vmax: Math.max(Vs.value, 1) }); E.draw({ result: r2, vmax: Math.max(Vs.value, 1) });
          s.path([[-0.7, -0.5], [7.0, -0.5], [7.0, 4.3], [-0.7, 4.3]], { close: true, color: 'muted', width: 1.5, dash: [7, 5] });
          s.dot(7, 3, { r: 6, hollow: true, color: 'accent', label: 'a', labelPos: 'ne' }); s.dot(7, 0, { r: 6, hollow: true, color: 'accent', label: 'b', labelPos: 'se' });
          const xm = Math.max(Voc, 1) * 1.2, ym = Math.max(Isc * 1e3, 1) * 1.25;
          sp.setView([-0.12 * xm, xm], [-0.12 * ym, ym]);
          sp.line(0, Isc * 1e3, Voc, 0, { color: 'accent', width: 2.5 });
          const loads = [30, 60, 120, 250, 500, 1000, 2000, 4000, 8000, 16000, 40000];
          for (const R of loads) {
            // terminal voltage with load R: solve i = vt/R against the box
            let lo = -200, hi = 200;
            for (let it = 0; it < 100; it++) { const m = (lo + hi) / 2; if (boxSolve(p, m).i - m / R > 0) lo = m; else hi = m; }
            const vt = (lo + hi) / 2; sp.dot(vt, vt / R * 1e3, { r: 4.5, color: 'gold' });
          }
          sp.dot(0, Isc * 1e3, { r: 6, color: 'green', label: '$I_{sc}$', tex: true, labelPos: 'ne' }); sp.dot(Voc, 0, { r: 6, color: 'green', label: '$V_{Th}$', tex: true, labelPos: 'n' });
          sp.line(0, 0, xm, xm / RL.value * 1e3, { color: 'orange', width: 2, dash: true });
          const vL = r1.V(C.net.termNode.get('RL').a), iL = r1.I('RL');
          sp.dot(vL, iL * 1e3, { r: 7, color: 'green' });
          info = { Voc, Isc, Rth, Roff, vL, iL, vE: r2.V(E.net.termNode.get('RL').a), iE: r2.I('RL'), pin: r1.P('R1') + r1.P('R2') + r1.P('R3'), pinE: r2.P('RT') };
        });
        v.legend([['gold', 'measured with test loads', { dot: true }], ['accent', 'line through the points'], ['orange', 'load line $i = v/R_L$', { dash: true }], ['green', 'operating point', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { Voc, Isc, Rth, Roff, vL, iL, vE, iE, pin, pinE } = info;
          return `$V_{\\mathrm{Th}} = ${v.fix(Voc, 3)}$ V (open-circuit voltage), $I_{sc} = ${v.fix(Isc * 1e3, 3)}$ mA, $R_{\\mathrm{Th}} = V_{\\mathrm{Th}}/I_{sc} = ${v.fix(Rth, 2)}\\ \\Omega$; with the sources switched off, $R_3 + R_1\\parallel R_2 = ${v.fix(Roff, 2)}\\ \\Omega$.\nWith the load: original $v_L = ${v.fix(vL, 4)}$ V, $i_L = ${v.fix(iL * 1e3, 4)}$ mA; equivalent $v_L = ${v.fix(vE, 4)}$ V, $i_L = ${v.fix(iE * 1e3, 4)}$ mA. Power dissipated in the resistors inside: ${v.fix(pin * 1e3, 2)} mW in the box, ${v.fix(pinE * 1e3, 2)} mW in the equivalent: the terminals cannot tell.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Theorem',
      name: 'Norton’s theorem',
      statement: String.raw`A linear network $N$ with two accessible terminals $a, b$ is equivalent, as seen from those terminals, to an ideal current source $I_N$ in parallel with a resistance $R_N$. The current $I_N$ is the short-circuit current from $a$ to $b$, and $R_N = R_{\mathrm{Th}}$ is the same resistance seen with all independent sources of $N$ switched off. It is the same equivalent as Thévenin's, in other coordinates: $I_N = V_{\mathrm{Th}}/R_{\mathrm{Th}}$.`,
      idea: String.raw`By Thévenin's theorem (3.2) the terminal law of $N$ is $v = V_{\mathrm{Th}} - R_{\mathrm{Th}}\, i$, a straight line in the $v$–$i$ plane. Solve it for the current: $i = V_{\mathrm{Th}}/R_{\mathrm{Th}} - v/R_{\mathrm{Th}}$, which is the law of a current source $I_N = V_{\mathrm{Th}}/R_{\mathrm{Th}}$ in parallel with a conductance $1/R_{\mathrm{Th}}$ (the current-source form of the same line). Both circuits impose the same line on whatever is attached, so the operating points agree for any load. The line is fixed by its two intercepts, $V_{\mathrm{oc}}$ and $I_{\mathrm{sc}}$.`,
      caption: String.raw`The curve through the black dots is what the boxed network (with a series resistor, or with a series diode) really does at its terminals. The blue line is the Thévenin equivalent and the dashed orange line the Norton equivalent, built from nothing but one open-circuit and one short-circuit test; the load is a resistor or a diode. With a linear box all three coincide and the three operating points are one point. Switch the box to its diode version and the straight line through the two test points no longer follows the curve: the diode blocks reverse current and the theorem, which needs linearity, fails.`,
      scope: String.raw`Needs a linear box, like Thévenin's theorem. The Norton form does not exist when $R_{\mathrm{Th}} = 0$ (an ideal voltage source) and the Thévenin form does not exist when $R_{\mathrm{Th}} = \infty$ (an ideal current source).`,
      credit: 'E. L. Norton (Bell Labs internal report) and H. F. Mayer (Siemens & Halske, published), 1926, independently',
      deps: ['circ-3.2'],
      refs: ['Agarwal–Lang §3.6'],
      tags: ['norton', 'equivalent circuit'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Norton%27s_theorem' },
      viz(v) {
        const s = v.stage({ x: [-2, 14], y: [-2, 16], axes: 'box', gutter: true, height: 340, weight: 1.35, xlabel: 'terminal voltage $v$ (V)', ylabel: 'current out of terminal $a$ (mA)', title: 'terminal characteristics' });
        const sn = v.stage({ x: [-1.1, 5.5], y: [-0.7, 3.9], equal: true, axes: false, height: 340, weight: 0.8, title: 'Norton equivalent' });
        const En = v.circuit(sn, [
          { type: 'I', id: 'IN', name: '$I_N$', value: 0.001, at: [0, 0, 0, 3] }, { type: 'W', at: [0, 3, 3.8, 3] }, { type: 'R', id: 'RN', name: '$R_N$', value: 1000, at: [1.6, 3, 1.6, 0] },
          { type: 'R', id: 'RL', name: 'RL', value: 1000, at: [3.8, 3, 3.8, 0], labelSide: -1 }, { type: 'W', at: [0, 0, 3.8, 0] }, { type: 'GND', at: [1.8, 0] },
        ]);
        const inside = v.select('inside the box', [{ value: 'lin', label: 'resistor $R_3$ (linear)' }, { value: 'dio', label: 'diode (nonlinear)' }], 'lin');
        const load = v.select('load', [{ value: 'res', label: 'resistor' }, { value: 'dio', label: 'diode' }], 'res');
        const Vs = v.slider('source $V$', 2, 24, 12, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} V` });
        const RL = v.slider('load $R_L$', 50, 20e3, 1000, { log: true, sig: 2, fmt: (x) => sI(x, 'Ω', 2) });
        RL.el.hidden = false;
        const bis = (f) => { let lo = -300, hi = 300; for (let it = 0; it < 200; it++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; } return (lo + hi) / 2; };
        let info = null;
        v.render(() => {
          RL.el.hidden = load.value !== 'res';
          const dio = inside.value === 'dio', p = { ...BOX, V: Vs.value };
          const { Voc, Isc, Rth } = boxTests(p, dio), xm = Math.max(Voc, 1) * 1.55, ym = Math.max(Isc * 1e3, 1) * 1.3;
          s.setView([-0.15 * xm, xm], [-0.45 * ym, ym]);
          const curve = []; for (let k = 0; k <= 160; k++) { const vt = -0.15 * xm + (1.15 * xm * k) / 160; curve.push([vt, boxSolve(p, vt, dio).i * 1e3]); }
          s.line(0, Isc * 1e3, Voc, 0, { color: 'accent', width: 6, alpha: 0.35 });
          s.line(-0.15 * xm, (Voc + 0.15 * xm) / Rth * 1e3, xm, (Voc - xm) / Rth * 1e3, { color: 'accent', width: 3 });
          s.line(-0.15 * xm, (Voc + 0.15 * xm) / Rth * 1e3, xm, (Voc - xm) / Rth * 1e3, { color: 'orange', width: 2, dash: [8, 6] });
          s.path(curve, { color: 'ink', width: 2 });
          for (let k = 0; k <= 12; k++) { const vt = -0.1 * xm + (1.08 * xm * k) / 12; s.dot(vt, boxSolve(p, vt, dio).i * 1e3, { r: 3.5, color: 'ink' }); }
          const loadI = (vt) => (load.value === 'res' ? vt / RL.value : diodeI(vt));
          const lc = []; for (let k = 0; k <= 200; k++) { const vt = -0.15 * xm + (1.15 * xm * k) / 200; lc.push([vt, loadI(vt) * 1e3]); }
          s.path(lc, { color: 'red', width: 2, dash: [5, 4], alpha: 0.9 });
          const vo = bis((vt) => boxSolve(p, vt, dio).i - loadI(vt)), vn = bis((vt) => (Isc - vt / Rth) - loadI(vt)), vth = bis((vt) => ((Voc - vt) / Rth) - loadI(vt));
          s.dot(vo, loadI(vo) * 1e3, { r: 8, color: 'ink', hollow: true });
          s.dot(vth, loadI(vth) * 1e3, { r: 5.5, color: 'accent' });
          s.dot(vn, loadI(vn) * 1e3, { r: 3, color: 'orange' });
          s.dot(0, Isc * 1e3, { r: 5, color: 'green', label: '$I_{sc}$', tex: true, labelPos: 'ne' }); s.dot(Voc, 0, { r: 5, color: 'green', label: '$V_{oc}$', tex: true, labelPos: 'n' });
          En.part('IN').value = Isc; En.part('RN').value = Math.abs(Rth); En.part('RL').value = load.value === 'res' ? RL.value : Math.max(1, vn / Math.max(loadI(vn), 1e-12));
          En.draw({ result: En.dc(), vmax: 10 });
          info = { Voc, Isc, Rth, vo, vn, vth, io: loadI(vo), dio, Rtest: boxRoff(p) };
        });
        v.legend([['ink', 'the box itself'], ['accent', 'Thévenin $V_{oc}$, $R$'], ['orange', 'Norton $I_{sc}$, $R$', { dash: true }], ['red', 'the load', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { Voc, Isc, Rth, vo, vn, vth, io, dio, Rtest } = info;
          const head = `$I_N = I_{sc} = ${v.fix(Isc * 1e3, 3)}$ mA, $R_N = V_{oc}/I_{sc} = ${v.fix(Rth, 1)}\\ \\Omega$, $V_{\\mathrm{Th}} = I_N R_N = ${v.fix(Isc * Rth, 3)}$ V $= V_{oc}$ (${v.fix(Voc, 3)} V).`;
          const ops = `Load voltage: box $${v.fix(vo, 4)}$ V, Thévenin $${v.fix(vth, 4)}$ V, Norton $${v.fix(vn, 4)}$ V (load current ${v.fix(io * 1e3, 3)} mA).`;
          return dio ? `${head}\n${ops} The diode inside the box breaks the equivalence: the box and the two-test-point models give different answers.` : `${head} Sources off: $R_3 + R_1\\parallel R_2 = ${v.fix(Rtest, 1)}\\ \\Omega$.\n${ops} The three agree to $${v.sci(Math.max(Math.abs(vo - vth), Math.abs(vo - vn)) + 1e-20, 1)}$ V.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Proposition',
      name: 'Source transformation',
      statement: String.raw`An ideal voltage source $V_s$ in series with a resistance $R_s$ and an ideal current source $I_s = V_s/R_s$ in parallel with the same resistance $R_s$ have the same terminal behaviour: for every load, the voltage and current at the terminals are the same. The two are interchanged freely inside a larger circuit, provided the terminals at which the rest of the circuit attaches are kept (the polarity: the current source's arrow points toward the terminal that the voltage source's $+$ sign marks). The resistors inside the two forms do not dissipate the same power.`,
      idea: String.raw`Both forms are special cases of Thévenin's and Norton's theorems (3.2, 3.3) for a one-resistor network: the voltage form has $V_{\mathrm{oc}} = V_s$ and $I_{sc} = V_s/R_s$, the current form has $V_{\mathrm{oc}} = I_s R_s$ and $I_{sc} = I_s$. With $I_s = V_s/R_s$ the two intercepts coincide, so the terminal line $v = V_s - R_s i$ is the same. Inside, they differ: with the terminals open, the voltage form dissipates nothing, whereas the current form pushes all of $I_s$ through $R_s$.`,
      caption: String.raw`The same load $R_L$ is attached to a voltage source with series resistor (left) and its transformed current source with parallel resistor (right); the kit solves both, and the load voltage and current agree. The plot shows how the power in the load is the same in both forms while the power in $R_s$ is not: the voltage form dissipates $i^2R_s$ (nothing at open circuit), the current form $v^2/R_s$ (nothing at short circuit). Slide $R_L$ along the plot to see both.`,
      scope: String.raw`Requires $0 < R_s < \infty$ (an ideal voltage source with no series resistor has no current-source form, and vice versa). The equivalence is about the terminals only: do not use it to find the power in the transformed resistor.`,
      deps: ['circ-3.3', 'circ-3.2'],
      refs: ['Agarwal–Lang §3.6'],
      tags: ['source transformation', 'equivalence'],
      viz(v) {
        const sA = v.stage({ x: [-1.0, 6.2], y: [-0.7, 4.5], equal: true, axes: false, height: 250, weight: 1, title: 'voltage source + series $R_s$' });
        const sB = v.stage({ x: [-1.0, 6.2], y: [-0.7, 4.5], equal: true, axes: false, height: 250, weight: 1, title: 'current source ∥ $R_s$' });
        const sp = v.stage({ x: [10, 1e5], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 300, full: true, xlabel: 'load resistance $R_L$ ($\\Omega$)', ylabel: 'power (mW)', title: 'what is dissipated where' });
        const CA = v.circuit(sA, [
          { type: 'V', id: 'V', name: 'Vs', value: 10, at: [0, 3, 0, 0] }, { type: 'W', at: [0, 3, 0.8, 3] }, { type: 'R', id: 'Rs', name: 'Rs', value: 500, at: [0.8, 3, 3.3, 3] }, { type: 'W', at: [3.3, 3, 5, 3] },
          { type: 'R', id: 'RL', name: 'RL', value: 500, at: [5, 3, 5, 0], labelSide: -1 }, { type: 'W', at: [0, 0, 5, 0] }, { type: 'GND', at: [2.5, 0] },
        ]);
        const CB = v.circuit(sB, [
          { type: 'I', id: 'I', name: 'Is', value: 0.02, at: [0, 0, 0, 3] }, { type: 'W', at: [0, 3, 5, 3] }, { type: 'R', id: 'Rs', name: 'Rs', value: 500, at: [2.2, 3, 2.2, 0] },
          { type: 'R', id: 'RL', name: 'RL', value: 500, at: [5, 3, 5, 0], labelSide: -1 }, { type: 'W', at: [0, 0, 5, 0] }, { type: 'GND', at: [2.5, 0] },
        ]);
        const Vs = v.slider('$V_s$', 1, 20, 10, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} V` });
        const Rs = v.slider('$R_s$', 50, 5000, 500, { log: true, sig: 2, fmt: (x) => sI(x, 'Ω', 2) });
        const RL = v.slider('$R_L$', 10, 1e5, 500, { log: true, sig: 3, fmt: (x) => sI(x, 'Ω', 3) });
        let info = null;
        v.render(() => {
          const V = Vs.value, R = Rs.value, I = V / R;
          CA.part('V').value = V; CA.part('Rs').value = R; CA.part('RL').value = RL.value;
          CB.part('I').value = I; CB.part('Rs').value = R; CB.part('RL').value = RL.value;
          const rA = CA.dc(), rB = CB.dc(); CA.draw({ result: rA, vmax: V }); CB.draw({ result: rB, vmax: V });
          const pmax = V * V / R;
          sp.setView([10, 1e5], [0, pmax * 1e3 * 1.15]);
          const f = (g) => (x) => g(x) * 1e3;
          sp.fn(f((x) => V * V * x / ((R + x) ** 2)), { color: 'green', width: 2.5 });
          sp.fn(f((x) => (V / (R + x)) ** 2 * R), { color: 'accent', width: 2.2 });
          sp.fn(f((x) => (V * x / (R + x)) ** 2 / R), { color: 'orange', width: 2.2 });
          sp.vline(RL.value, { color: 'muted', dash: true, width: 1.5 });
          info = { vA: rA.V(CA.net.termNode.get('RL').a), iA: rA.I('RL'), vB: rB.V(CB.net.termNode.get('RL').a), iB: rB.I('RL'), pA: rA.P('Rs'), pB: rB.P('Rs'), pL: rA.P('RL'), pLB: rB.P('RL'), I };
        });
        v.legend([['green', '$P_L$ (same in both)'], ['accent', '$P_{R_s}$, voltage form'], ['orange', '$P_{R_s}$, current form']]);
        v.readout(() => {
          if (!info) return '';
          const { vA, iA, vB, iB, pA, pB, pL, pLB, I } = info;
          return `$I_s = V_s/R_s = ${v.fix(I * 1e3, 3)}$ mA. Load: voltage form $v_L = ${v.fix(vA, 4)}$ V, $i_L = ${v.fix(iA * 1e3, 4)}$ mA; current form $v_L = ${v.fix(vB, 4)}$ V, $i_L = ${v.fix(iB * 1e3, 4)}$ mA; $P_L = ${v.fix(pL * 1e3, 3)}$ mW vs ${v.fix(pLB * 1e3, 3)} mW.\nInside $R_s$: ${v.fix(pA * 1e3, 3)} mW (voltage form) versus ${v.fix(pB * 1e3, 3)} mW (current form): the terminals cannot tell the two apart, the dissipation can.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Theorem',
      name: 'Maximum power transfer',
      statement: String.raw`A linear source with Thévenin voltage $V_{\mathrm{Th}}$ and resistance $R_{\mathrm{Th}} > 0$ drives a load resistor $R_L$ that can be varied. The power delivered to the load, $P_L = V_{\mathrm{Th}}^2 R_L/(R_{\mathrm{Th}}+R_L)^2$, is largest when $R_L = R_{\mathrm{Th}}$, and then equals $P_{\max} = V_{\mathrm{Th}}^2/(4R_{\mathrm{Th}})$. At that point the efficiency $\eta = P_L/P_{\text{total}} = R_L/(R_{\mathrm{Th}}+R_L)$ is exactly $1/2$. The theorem is about adjusting the load; if instead the load is fixed and the source resistance can be changed, the power is greatest at $R_{\mathrm{Th}} = 0$.`,
      idea: String.raw`Write the current $i = V_{\mathrm{Th}}/(R_{\mathrm{Th}}+R_L)$ (series circuit, 2.3) and $P_L = i^2R_L$. In terms of $\rho = R_L/R_{\mathrm{Th}}$ the power is $P_L/P_{\max} = 4\rho/(1+\rho)^2$, and $(1+\rho)^2 - 4\rho = (1-\rho)^2 \ge 0$, so $P_L \le P_{\max}$ with equality only at $\rho = 1$. By Thévenin's theorem (3.2) any linear network seen from the load's terminals is such a source, so the result applies to all of them.`,
      caption: String.raw`Move the load: the green curve is the delivered power (as a fraction of its maximum) and the blue curve the efficiency, both against $R_L/R_{\mathrm{Th}}$ on a log axis. The power peaks at $R_L = R_{\mathrm{Th}}$ where the efficiency has only reached $50\%$; for a more efficient but weaker supply you move to the right. Then switch to *vary the source resistance* with the load fixed: the power now rises monotonically as the source resistance goes to zero, so "matching" is not always the goal. The small circuit is solved by the kit and its load power agrees with the formula.`,
      scope: String.raw`Resistive load and a fixed Thévenin source. For a source with reactance the maximum is at the complex conjugate $Z_L = Z_{\mathrm{Th}}^*$ (not treated here). Maximum power is not maximum efficiency (power-line and battery design avoid matching).`,
      credit: 'attributed to M. H. Jacobi, c. 1840 (secondary sources only)',
      verify: true,
      deps: ['circ-3.2', 'circ-2.3'],
      refs: ['Horowitz–Hill §1.2', 'Agarwal–Lang §3.6'],
      tags: ['power', 'matching'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Maximum_power_transfer_theorem' },
      viz(v) {
        const sp = v.stage({ x: [0.01, 100], y: [0, 1.08], xlog: true, axes: 'box', gutter: true, height: 340, weight: 1.35, xlabel: 'ratio $\\rho$', ylabel: 'fraction', title: 'power and efficiency' });
        const sc = v.stage({ x: [-1.0, 5.2], y: [-0.7, 3.9], equal: true, axes: false, height: 340, weight: 0.8, title: 'the circuit' });
        const C = v.circuit(sc, [
          { type: 'V', id: 'VT', name: '$V_{Th}$', value: 10, at: [0, 3, 0, 0] }, { type: 'R', id: 'RT', name: '$R_{Th}$', value: 100, at: [0, 3, 2.4, 3] }, { type: 'W', at: [2.4, 3, 4.1, 3] },
          { type: 'R', id: 'RL', name: 'RL', value: 100, at: [4.1, 3, 4.1, 0] }, { type: 'W', at: [0, 0, 4.1, 0] }, { type: 'GND', at: [2, 0] },
        ]);
        const mode = v.select('vary', [{ value: 'load', label: 'the load $R_L$' }, { value: 'src', label: 'the source resistance (load fixed)' }], 'load');
        const rho = v.slider('$\\rho$', 0.01, 100, 0.5, { log: true, sig: 3, fmt: (x) => v.fix(x, x < 0.1 ? 3 : 2) });
        const V = v.slider('$V_{\\mathrm{Th}}$', 1, 20, 10, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} V` });
        const R0 = v.slider('fixed resistance', 10, 1000, 100, { log: true, sig: 2, fmt: (x) => sI(x, 'Ω', 2) });
        let info = null;
        v.render(() => {
          const load = mode.value === 'load', r = rho.value, R = R0.value;
          const Rth = load ? R : r * R, RL = load ? r * R : R;
          C.part('VT').value = V.value; C.part('RT').value = Rth; C.part('RL').value = RL;
          const res = C.dc(); C.draw({ result: res, vmax: V.value });
          // power relative to its reference maximum: load → P_max at ρ = 1; source → P at R_Th = 0
          const P = load ? (x) => 4 * x / ((1 + x) ** 2) : (x) => 1 / ((1 + x) ** 2), eta = load ? (x) => x / (1 + x) : (x) => 1 / (1 + x);
          sp.setLabels(load ? '$\\rho = R_L/R_{\\mathrm{Th}}$' : '$\\rho = R_{\\mathrm{Th}}/R_L$', null);
          sp.fn(P, { color: 'green', width: 2.6 }); sp.fn(eta, { color: 'accent', width: 2.2 });
          if (load) sp.vline(1, { color: 'muted', dash: true, width: 1.2 });
          sp.hline(0.5, { color: 'faint', width: 1, dash: true });
          sp.dot(r, P(r), { r: 7, color: 'green' }); sp.dot(r, eta(r), { r: 6, color: 'accent' });
          if (load) sp.dot(1, 1, { r: 5, color: 'green', hollow: true });
          info = { Rth, RL, pL: res.P('RL'), formula: V.value ** 2 * RL / ((Rth + RL) ** 2), pmax: V.value ** 2 / (4 * Rth), eta: RL / (Rth + RL), load };
        });
        v.legend([['green', 'power in the load (relative)'], ['accent', 'efficiency $\\eta$']]);
        v.readout(() => {
          if (!info) return '';
          const { Rth, RL, pL, formula, pmax, eta, load } = info;
          return `$R_{\\mathrm{Th}} = ${v.fix(Rth, 2)}\\ \\Omega$, $R_L = ${v.fix(RL, 2)}\\ \\Omega$: $P_L = ${v.fix(pL * 1e3, 3)}$ mW (circuit solver) $= ${v.fix(formula * 1e3, 3)}$ mW (formula); $\\eta = ${v.fix(eta * 100, 1)}\\%$.\n${load ? `$P_{\\max} = V^2/4R_{\\mathrm{Th}} = ${v.fix(pmax * 1e3, 3)}$ mW, reached only at $\\rho = 1$, where $\\eta = 50\\%$.` : `The load is fixed: the lower the source resistance, the more power it gets; there is no interior maximum.`}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Theorem',
      name: 'Tellegen’s theorem',
      statement: String.raw`Let a lumped network have $b$ branches. Take any set of branch voltages $v_1,\dots,v_b$ that satisfies Kirchhoff's voltage law (2.2) on the graph (they are differences of node potentials), and any set of branch currents $i_1,\dots,i_b$ that satisfies Kirchhoff's current law (2.1) on the same graph, with the same reference directions. Then $\sum_{k=1}^{b} v_k i_k = 0$. The two sets need not come from the same circuit, the same elements or the same time; the theorem uses only the graph. With both sets taken from one circuit it is conservation of power: the power absorbed by all branches sums to zero.`,
      idea: String.raw`KVL says the voltage vector is $\mathbf v = \mathbf A^{\top}\boldsymbol\varphi$ for node potentials $\boldsymbol\varphi$ (the incidence matrix $\mathbf A$ has rows for nodes, columns for branches). KCL says $\mathbf A\mathbf i = \mathbf 0$. Hence $\mathbf v^{\top}\mathbf i = \boldsymbol\varphi^{\top}\mathbf A\mathbf i = 0$: the voltage vector lies in the row space of $\mathbf A$, the current vector in its null space, and these are orthogonal complements (2.7). No element law was used.`,
      caption: String.raw`The graph carries the node potentials of circuit A (colours) and the branch currents of a different circuit B: same graph, different resistors and batteries (use the two seed sliders). The bars are the products $v^A_k i^B_k$ drawn as a waterfall that always returns to zero; the readout shows all four cross sums, including the ordinary power balance $\sum v^A i^A$. Then open the unmetered path: current $\varepsilon$ is fed into one node and taken out of another through a wire that is not on the graph, so the metered currents violate KCL, and the sum equals $\varepsilon(\varphi_s-\varphi_t)$ instead of zero.`,
      scope: String.raw`Any lumped network (linear or not, active or passive, time-varying) as long as the voltage set obeys KVL and the current set obeys KCL on the same oriented graph. The theorem is purely topological.`,
      credit: 'B. D. H. Tellegen, 1952 (Philips Research Reports 7, 259–269)',
      deps: ['circ-2.1', 'circ-2.2', 'circ-2.7'],
      refs: ['Agarwal–Lang ch. 3'],
      tags: ['tellegen', 'power balance', 'graph'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Tellegen%27s_theorem' },
      viz(v) {
        const s = v.stage({ x: [-0.85, 0.85], y: [-0.7, 0.7], equal: true, axes: false, height: 360, weight: 1, title: 'one graph, two circuits (width = |product|)' });
        const sb = v.stage({ x: [0.3, 7.7], y: [-1, 1], axes: 'box', gutter: true, height: 360, weight: 1, xlabel: 'branch', ylabel: 'running sum of $v^A_k i^B_k$ (V·mA)', title: 'the products add to zero' });
        const sel = v.select('graph', ['k4', 'bridge', 'ladder', 'grid3'].map((k) => ({ value: k, label: NETS[k].label })), 'k4');
        const sA = v.slider('circuit A (voltages), seed', 1, 40, 3, { int: true });
        const sB = v.slider('circuit B (currents), seed', 1, 40, 11, { int: true });
        const eps = v.slider('unmetered current $\\varepsilon$', 0, 5, 0, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} mA` });
        // a circuit on the graph: branch k has v_k = r_k i_k + e_k (resistor in series with a battery); r in kΩ, e in V, i in mA
        const make = (net, seed, injection) => {
          const r = v.rng(seed), n = net.names.length, E = net.edges;
          const rk = E.map(() => +(0.3 + 2.7 * r()).toFixed(2)), ek = E.map(() => (r() < 0.55 ? +(-10 + 20 * r()).toFixed(1) : 0));
          if (!ek.some((x) => x)) ek[0] = 5;
          const edges = E.map(([a, b], k) => ({ a, b, g: 1 / rk[k] })), rhs = new Array(n).fill(0);
          E.forEach(([a, b], k) => { rhs[a] += ek[k] / rk[k]; rhs[b] -= ek[k] / rk[k]; });
          if (injection) { rhs[0] += injection; rhs[n - 1] -= injection; }
          const phi = solveNet(n, edges, rhs, 0);
          const vk = E.map(([a, b]) => phi[a] - phi[b]), ik = E.map(([a, b], k) => (phi[a] - phi[b] - ek[k]) / rk[k]);
          return { phi, vk, ik, rk, ek };
        };
        let info = null;
        v.render(() => {
          const net = NETS[sel.value], n = net.names.length, P = geom(net), E = net.edges;
          const A = make(net, sA.value, 0), B = make(net, sB.value, eps.value);
          const prod = E.map((_, k) => A.vk[k] * B.ik[k]);
          const sum = (x, y) => x.reduce((a, q, k) => a + q * y[k], 0);
          const cross = { AB: sum(A.vk, B.ik), BA: sum(B.vk, A.ik), AA: sum(A.vk, A.ik), BB: sum(B.vk, B.ik) };
          const vmax = Math.max(1e-9, ...A.phi.map(Math.abs)), pmax = Math.max(1e-9, ...prod.map(Math.abs));
          const els = E.map(([a, b], k) => ({ a, b, kind: 'W', color: prod[k] >= 0 ? 'orange' : 'green', width: 2 + 8 * Math.abs(prod[k]) / pmax, label: E.length <= 5 ? `${v.fix(A.vk[k], 1)} V · ${v.fix(B.ik[k], 2)} mA` : null }));
          drawNet(s, v, P, els, { phi: A.phi, vmax, names: net.names.map((nm, i) => `${nm} ${v.fix(A.phi[i], 1)}`), nodeR: 9, nameDy: -20, labelOff: 0.05, labelSize: 10.5 });
          if (eps.value > 0) { const p0 = P[0], p1 = P[n - 1]; s.arrow(p0[0] - 0.2, p0[1] + 0.12, p0[0] - 0.02, p0[1] + 0.02, { color: 'red', width: 3 }); s.arrow(p1[0] + 0.02, p1[1] - 0.02, p1[0] + 0.2, p1[1] - 0.12, { color: 'red', width: 3 }); }
          let run = 0; const lev = [0];
          prod.forEach((x, k) => { sb.rect(k + 1 - 0.34, Math.min(run, run + x), k + 1 + 0.34, Math.max(run, run + x), { fill: x >= 0 ? 'orange' : 'green', fillAlpha: 0.4, color: x >= 0 ? 'orange' : 'green', width: 1.4 }); run += x; lev.push(run); });
          const top = Math.max(1, ...lev.map(Math.abs)) * 1.3;
          sb.setView([0.3, E.length + 1.5], [-top, top]);
          prod.forEach((x, k) => sb.text(v.fix(x, 2), k + 1, Math.max(lev[k], lev[k + 1]), { size: 11, baseline: 'bottom', dy: -3, color: 'muted' }));
          sb.hline(0, { color: 'ink', width: 1.2 });
          sb.dot(E.length + 0.5, run, { r: 7, color: Math.abs(run) < 1e-9 ? 'green' : 'red' });
          sb.text('Σ', E.length + 0.5, run, { size: 12, dx: 12, color: Math.abs(run) < 1e-9 ? 'green' : 'red', plate: true });
          info = { cross, eps: eps.value, pred: eps.value * (A.phi[0] - A.phi[n - 1]), b: E.length };
        });
        v.legend([['orange', 'product $>0$ (absorbs)'], ['green', 'product $<0$ (supplies)']]);
        v.readout(() => {
          if (!info) return '';
          const { cross, eps: e, pred, b } = info, f = (x) => `${v.fix(z0(x, 1e-9), 6)}`;
          if (e === 0) return `$b = ${b}$ branches. $\\sum v^A i^B = ${f(cross.AB)}$, $\\sum v^B i^A = ${f(cross.BA)}$, $\\sum v^A i^A = ${f(cross.AA)}$, $\\sum v^B i^B = ${f(cross.BB)}$ (V·mA): zero in every combination, to rounding error.`;
          return `The metered currents of B no longer obey KCL, and $\\sum v^A i^B = ${f(cross.AB)}$ V·mA $= \\varepsilon(\\varphi_s - \\varphi_t) = ${f(pred)}$ V·mA; the sum of the products with circuit B's own voltages is also non-zero ($${f(cross.BB)}$ V·mA).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Theorem',
      name: 'Reciprocity theorem',
      statement: String.raw`Let $N$ be a linear network made only of resistors (more generally of reciprocal elements: resistors, capacitors, inductors, ideal transformers, but no dependent sources, gyrators or nonreciprocal devices), with two ports $A$ and $B$. If a current $I$ injected at port $A$ produces the voltage $v_B$ across port $B$, then the same current $I$ injected at port $B$ produces the same voltage $v_A = v_B$ across port $A$. In terms of the transfer resistance: $z_{BA} = z_{AB}$. For the dual experiment, a voltage source at one port and a short-circuit current at the other, the currents are equal.`,
      idea: String.raw`With node potentials as unknowns, the network equations are $\mathbf G\boldsymbol\varphi = \mathbf i$ with $\mathbf G$ the conductance matrix, which is symmetric for reciprocal elements ($\mathbf G = \mathbf G^{\top}$, 2.8). The transfer resistance from port $A$ (current vector $\mathbf a$) to port $B$ (vector $\mathbf b$) is $\mathbf b^{\top}\mathbf G^{-1}\mathbf a$, which equals $\mathbf a^{\top}\mathbf G^{-1}\mathbf b$ because the inverse of a symmetric matrix is symmetric. Equivalently, it follows from Tellegen's theorem (3.6) applied to the two experiments, whose branch voltages and currents are related by the same element laws.`,
      caption: String.raw`The same network is measured twice. Experiment 1 (left): inject 1 mA at port $A$ and read the voltage across port $B$. Experiment 2 (right): swap them. Colours are node potentials. For any resistors (re-seed them) the two readings are equal to rounding error. Now turn up the gain $g$ of a dependent source that injects the current $g\,v_A$ at port $B$: one direction of transmission is boosted and the symmetry is lost, since the network equations are no longer symmetric.`,
      scope: String.raw`Linear, time-invariant, reciprocal networks (no dependent sources, no gyrators, no magnetized ferrites). Dependent sources and nonreciprocal two-ports make $z_{AB} \ne z_{BA}$. Reciprocal relations of this kind are known in many fields (optics, acoustics, electromagnetism); the circuit form is the lumped special case.`,
      verify: true,
      deps: ['circ-3.6', 'circ-2.8'],
      refs: ['Agarwal–Lang ch. 3'],
      tags: ['reciprocity', 'symmetry'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Reciprocity_(electrical_networks)' },
      viz(v) {
        const sA = v.stage({ x: [-0.78, 0.78], y: [-0.68, 0.68], equal: true, axes: false, height: 300, weight: 1, title: 'experiment 1: drive $A$, measure $B$' });
        const sB = v.stage({ x: [-0.78, 0.78], y: [-0.68, 0.68], equal: true, axes: false, height: 300, weight: 1, title: 'experiment 2: drive $B$, measure $A$' });
        const sel = v.select('network', ['bridge', 'k4', 'ladder', 'grid3'].map((k) => ({ value: k, label: NETS[k].label })), 'bridge');
        const seed = v.slider('resistor seed', 1, 40, 5, { int: true });
        const gain = v.slider('dependent source gain $g$', -2, 2, 0, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} mS` });
        const PORTS = { bridge: [[0, 1], [2, 3]], k4: [[0, 2], [1, 3]], ladder: [[0, 2], [3, 5]], grid3: [[0, 8], [2, 6]] };
        let info = null;
        v.render(() => {
          const net = NETS[sel.value], n = net.names.length, P = geom(net), E = net.edges, rng = v.rng(seed.value * 31 + 7);
          const rk = E.map(() => +(0.3 + 2.7 * rng()).toFixed(2)), [A, B] = PORTS[sel.value];
          const run = (drive, meas) => {
            const els = E.map(([a, b], k) => ({ t: 'R', a, b, r: rk[k] }));
            els.push({ t: 'I', a: drive[1], b: drive[0], i: 1 });                       // 1 mA injected at drive[0], returned at drive[1]
            if (gain.value !== 0) els.push({ t: 'G', a: B[1], b: B[0], cp: A[0], cn: A[1], g: gain.value });
            const sol = mna(n - 1, els), v0 = sol.v;
            return { v: v0, z: v0[meas[0]] - v0[meas[1]] };
          };
          const r1 = run(A, B), r2 = run(B, A);
          [[sA, r1, A, B], [sB, r2, B, A]].forEach(([st, r, d, m]) => {
            const vm = Math.max(1e-9, ...r.v.map(Math.abs));
            drawNet(st, v, P, E.map(([a, b], k) => ({ a, b, kind: 'R', label: `${rk[k]}` })), { phi: r.v, vmax: vm, nodeR: 8, labelSize: 10 });
            st.arrow(P[d[0]][0] - 0.16, P[d[0]][1] + 0.1, P[d[0]][0] - 0.03, P[d[0]][1] + 0.02, { color: 'gold', width: 4 });
            st.arrow(P[d[1]][0] + 0.03, P[d[1]][1] - 0.02, P[d[1]][0] + 0.16, P[d[1]][1] - 0.1, { color: 'gold', width: 4 });
            st.text('1 mA in', P[d[0]][0] - 0.15, P[d[0]][1] + 0.16, { size: 11, color: 'gold' });
            st.text('meter +', P[m[0]][0], P[m[0]][1], { size: 10.5, color: 'green', dy: 20, plate: true });
            st.text('meter −', P[m[1]][0], P[m[1]][1], { size: 10.5, color: 'green', dy: 20, plate: true });
            st.corner(`reads ${v.fix(r.z, 4)} V`, 'br', { color: 'green', plate: true });
          });
          info = { z1: r1.z, z2: r2.z, g: gain.value };
        });
        v.readout(() => {
          if (!info) return '';
          const { z1, z2, g } = info, d = Math.abs(z1 - z2);
          return `$z_{BA} = ${v.fix(z1, 5)}\\ \\mathrm{k}\\Omega$ (drive $A$, read $B$), $z_{AB} = ${v.fix(z2, 5)}\\ \\mathrm{k}\\Omega$ (drive $B$, read $A$); difference $${v.sci(d + 1e-20, 2)}$ k$\\Omega$.\n${g === 0 ? 'All elements are resistors: the conductance matrix is symmetric, so the two readings are equal.' : `The dependent source ($g = ${v.fix(g, 2)}$ mS, controlled by $v_A$, feeding port $B$) adds an asymmetric term: the network is no longer reciprocal.`}`;
        });
      },
    },
  ],
};
