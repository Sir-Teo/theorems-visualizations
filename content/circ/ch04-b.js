// Circuits — Chapter 4: Nonlinear elements and the digital abstraction (part b: 4.7–4.13)
//
// Transistor characteristics are the textbook square-law / current-gain models with illustrative parameters, not measured data of any device.
import { clamp, vT, bisectDec, mos, mosRegion, cmosOut, eng } from './ch04.shared.js';

export default {
  collection: 'circ',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Model',
      name: 'MOSFET as a switch',
      statement: String.raw`An n-channel enhancement MOSFET is used here with its body tied to its source, leaving three external terminals: gate, drain and source. The ideal insulated gate draws no DC current. In the *switch model*, if the gate–source voltage is below the threshold, $v_{GS}<V_T$, the drain–source path is an open circuit ($i_D=0$). If $v_{GS}>V_T$ the path is a resistor $R_{\mathrm{on}}\approx 1/\bigl(k(v_{GS}-V_T)\bigr)$ (for small $v_{DS}$), where $k$ is a device constant. Used as a pull-down to ground below a resistor $R$ from the supply $V_{DD}$, the output is $V_{DD}$ when the switch is open and $V_{DD}R_{\mathrm{on}}/(R_{\mathrm{on}}+R)\approx 0$ when it is closed: an inverter whose input is the gate voltage.`,
      idea: String.raw`The gate is insulated from the channel by an oxide, so it controls the channel with an electric field and draws no current: the input is a pure voltage. The field attracts electrons to the surface only once $v_{GS}$ exceeds $V_T$, and the more it exceeds it the lower the channel resistance. The switch model is the piecewise-linear idea of 4.3 applied to this device, and it is what the digital abstraction (4.6) needs: two clean states controlled by a voltage. The more accurate square-law model (4.10) shows where the switch model errs, namely when $v_{DS}$ is not small.`,
      caption: String.raw`A MOSFET pull-down below a resistor. Drag the gate voltage across the threshold ($V_T = 1$ V): on the left, the $v_{DS}$–$i_D$ plane with the load line; the switch model is a line through the origin of slope $1/R_{\mathrm{on}}$ (or the axis, when open), the dashed curve is the square-law transistor of 4.10 at the same $v_{GS}$. On the right the output voltage against the gate voltage for both models; the two agree in the "off" and in the "on" state and differ near the threshold, where the transistor is not a good switch.`,
      scope: String.raw`Quasi-static; $R_{\mathrm{on}}$ from the small-$v_{DS}$ slope of the square-law model (4.10). Real devices also have gate capacitance, body effect and subthreshold leakage.`,
      credit: 'D. Kahng, US3102230A (filed 31 May 1960, citing M. M. Atalla’s 8 March 1960 application); J. E. Lilienfeld, US1745175A (Canadian filing 22 October 1925, granted 28 January 1930)',
      deps: ['circ-4.6', 'circ-4.3', 'cm-4.10'],
      see: ['cm-4.10'],
      refs: ['Agarwal–Lang (2005), §§6.3, 6.6–6.8, pp. 288–290, 300–307; Kahng US3102230A, description of Figs. 1A–2; Lilienfeld US1745175A, specification and claims 1–4'],
      tags: ['mosfet', 'switch'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/MOSFET' },
      viz(v) {
        const Vdd = 5, Vt = 1, k = 2e-3;
        const s = v.stage({ x: [0, 5.2], y: [0, 3], axes: 'box', gutter: true, height: 320, weight: 1.2, xlabel: '$v_{DS}$ (V)', ylabel: '$i_D$ (mA)', title: 'drain–source plane' });
        const so = v.stage({ x: [0, 5], y: [-0.2, 5.4], axes: 'box', gutter: true, height: 320, weight: 0.9, xlabel: '$v_{GS}$ (V)', ylabel: '$v_{out}$ (V)', title: 'the inverter' });
        const Vg = v.slider('gate $v_{GS}$', 0, 5, 3, { step: 0.02, fmt: (x) => `${v.fix(x, 2)} V` });
        const R = v.slider('pull-up $R$', 500, 20e3, 2000, { log: true, sig: 2, fmt: (x) => `${eng(x, 2)}Ω` });
        let info = null;
        const swOut = (vg, Rv) => { if (vg <= Vt) return { vo: Vdd, i: 0, Ron: Infinity }; const Ron = 1 / (k * (vg - Vt)); return { vo: (Vdd * Ron) / (Ron + Rv), i: Vdd / (Ron + Rv), Ron }; };
        const trOut = (vg, Rv) => { const vo = bisectDec((x) => (Vdd - x) / Rv - mos(vg, x, Vt, k, 0.02), 0, Vdd); return { vo, i: (Vdd - vo) / Rv }; };
        v.render(() => {
          const vg = Vg.value, Rv = R.value, sw = swOut(vg, Rv), tr = trOut(vg, Rv), imax = (Vdd / Rv) * 1e3;
          s.setView([0, 5.2], [-0.04 * imax * 1.3, imax * 1.3]);
          s.clip(() => {
            s.line(0, imax, Vdd, 0, { color: 'ink', width: 2 });
            s.fn((x) => mos(vg, x, Vt, k, 0.02) * 1e3, { domain: [0, 5.2], color: 'purple', width: 1.8, dash: true });
            if (vg > Vt) s.line(0, 0, 5.2, (5.2 / sw.Ron) * 1e3, { color: 'green', width: 2.6 });
            else s.line(0, 0, 5.2, 0, { color: 'red', width: 2.6 });
          });
          s.dot(sw.vo, sw.i * 1e3, { color: 'green', r: 6 });
          s.dot(tr.vo, tr.i * 1e3, { color: 'purple', r: 5, hollow: true });
          s.corner(vg > Vt ? `switch CLOSED   $R_{\\mathrm{on}} = ${eng(sw.Ron, 3)}\\Omega$` : 'switch OPEN', 'tr', { plate: true, color: vg > Vt ? 'green' : 'red' });
          so.fn((x) => swOut(x, Rv).vo, { domain: [0, 5], color: 'green', width: 2.4, n: 500 });
          so.fn((x) => trOut(x, Rv).vo, { domain: [0, 5], color: 'purple', width: 2, dash: true, n: 200 });
          so.vline(Vt, { color: 'faint', dash: true });
          so.dot(vg, sw.vo, { color: 'green', r: 6 });
          so.dot(vg, tr.vo, { color: 'purple', r: 5, hollow: true });
          info = { sw, tr, vg };
        });
        v.legend([['ink', 'load line'], ['green', 'switch model'], ['purple', 'square-law transistor', { dash: true }]]);
        v.readout(() => info && `Switch model: $v_{out} = ${v.fix(info.sw.vo, 3)}$ V; square-law transistor: $v_{out} = ${v.fix(info.tr.vo, 3)}$ V. ${info.vg <= 1 ? 'Below threshold the path is open and the output is pulled to the supply.' : 'Above threshold the path is a resistor; the larger the overdrive the closer the output is to ground.'}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Invention',
      name: 'CMOS inverter',
      statement: String.raw`The CMOS inverter connects a p-channel MOSFET from the supply $V_{DD}$ to the output and an n-channel MOSFET from the output to ground, with both gates tied to the input. For $v_{in}$ near $0$ the p-channel transistor conducts and the n-channel is off, so $v_{out}\approx V_{DD}$; for $v_{in}$ near $V_{DD}$ the opposite holds and $v_{out}\approx 0$. In either static state one of the two transistors is off, so the supply current is only leakage; a large current flows only while both conduct during a transition, near $v_{in}\approx V_{DD}/2$ where the transfer curve is steepest. The output levels are the rails themselves, so the noise margins (4.6) are close to $V_{DD}/2$.`,
      idea: String.raw`Each transistor is a switch (4.7) that is complementary to the other: where the n-channel is closed the p-channel is open. The static current is then zero, not merely small, because there is never a conducting path from supply to ground. Between the two states the circuit passes through a region where both are in saturation (4.10): their currents must match, which fixes the output as a very sensitive function of the input, giving gain much larger than 1 and thus the regeneration the digital abstraction needs.`,
      caption: String.raw`Drag the gate voltage along the transfer curve (left). Where the curve is steep, both transistors conduct and the supply current (right, logarithmic axis) spikes by many orders of magnitude over its static value; outside the transition it falls to the assumed $1$ nA leakage. The dashed curve is the supply current of an n-channel inverter with a resistor load, which wastes current whenever its output is low. The marker $V_M$ is the switching threshold $v_{out}=v_{in}$.`,
      scope: String.raw`Long-channel square-law transistors with matched n and p devices ($V_T=0.7$ V, $\lambda = 0.03$ V$^{-1}$); the leakage current is an assumption added for display on a logarithmic axis.`,
      credit: 'F. Wanlass (patent filed 1963, US 3,356,858) and C.-T. Sah, 1963 (see 4.17)',
      deps: ['circ-4.7'],
      see: ['circ-4.17'],
      refs: ['Wanlass, US3356858A, Fig. 5 and description of inverter circuit 50; Agarwal–Lang (2005), §11.5, pp. 611–615'],
      tags: ['cmos', 'inverter', 'power'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/CMOS' },
      viz(v) {
        const Vt = 0.7, k = 2e-3, Rl = 10e3, Ilk = 1e-9;
        const s = v.stage({ x: [0, 5], y: [0, 5], equal: true, axes: 'box', gutter: true, height: 340, weight: 0.9, xlabel: '$v_{in}$ (V)', ylabel: '$v_{out}$ (V)', title: 'voltage transfer curve' });
        const si = v.stage({ x: [0, 5], y: [1e-10, 1e-2], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1.1, xlabel: '$v_{in}$ (V)', ylabel: 'supply current (A)', title: 'supply current' });
        const Vdd = v.slider('supply $V_{DD}$', 1.5, 5, 3.3, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} V` });
        const h = s.handle(0.5, 3.3, { color: 'gold', r: 8, label: '$v_{in}$', labelPos: 'ne', constrain: 'x' });
        let info = null;
        v.render(() => {
          const V = Vdd.value, f = (x) => cmosOut(x, V, Vt, k, k);
          s.setView([0, V], [0, V]);
          si.setView([0, V], [1e-10, 1e-2]);
          h.set(clamp(h.x, 0, V), 0);
          const vin = clamp(h.x, 0, V), vo = f(vin);
          s.line(0, 0, V, V, { color: 'faint', dash: true });
          s.fn(f, { domain: [0, V], color: 'accent', width: 2.6, n: 300 });
          s.hline(vo, { color: 'gold', width: 1, dash: true, alpha: 0.7 });
          h.set(vin, vo);
          const cur = (x) => mos(x, f(x), Vt, k, 0.03) + Ilk;
          const resOut = (x) => bisectDec((y) => (V - y) / Rl - mos(x, y, Vt, k, 0.03), 0, V);
          si.fn((x) => Math.max(cur(x), 1e-12), { domain: [0, V], color: 'accent', width: 2.4, n: 300 });
          si.fn((x) => Math.max((V - resOut(x)) / Rl + Ilk, 1e-12), { domain: [0, V], color: 'red', width: 1.8, dash: true, n: 200 });
          si.dot(vin, Math.max(cur(vin), 1e-12), { color: 'gold', r: 6 });
          const VM = bisectDec((x) => x - f(x) < 0 ? 1 : -1, 0, V, 50);
          s.dot(VM, VM, { color: 'orange', r: 5, label: '$V_M$', labelPos: 'se' });
          const dx = 1e-3, gain = (f(vin + dx) - f(vin - dx)) / (2 * dx);
          let pk = 0; for (let k2 = 0; k2 <= 200; k2++) pk = Math.max(pk, cur((V * k2) / 200));
          info = { vin, vo, i: cur(vin), VM, gain, pk, V };
        });
        v.legend([['accent', 'CMOS'], ['red', 'resistor-load n-channel inverter', { dash: true }], ['orange', 'switching threshold $V_M$'], ['gold', 'input']]);
        v.readout(() => info && `$v_{in} = ${v.fix(info.vin, 2)}$ V → $v_{out} = ${v.fix(info.vo, 3)}$ V; gain $dv_{out}/dv_{in} = ${v.fix(info.gain, 1)}$; supply current $${v.sci(info.i, 2)}$ A. Switching threshold $V_M = ${v.fix(info.VM, 3)}$ V ($V_{DD}/2 = ${v.fix(info.V / 2, 3)}$ V). Peak current $${v.sci(info.pk, 2)}$ A against $\\approx$ $${v.sci(1e-9, 1)}$ A static.`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Theorem',
      name: 'Universality of NAND gates',
      statement: String.raw`Every Boolean function of a positive finite number of variables can be computed by a combinational circuit built only from two-input NAND gates, $\mathrm{NAND}(a,b)=\lnot(a\wedge b)$ (and signal fan-out). In particular, $\lnot a = \mathrm{NAND}(a,a)$, $a\wedge b = \lnot\,\mathrm{NAND}(a,b)$, $a\vee b=\mathrm{NAND}(\lnot a,\lnot b)$, and $a\oplus b=\mathrm{NAND}\bigl(\mathrm{NAND}(a,m),\mathrm{NAND}(b,m)\bigr)$ with $m=\mathrm{NAND}(a,b)$. The same holds for NOR.`,
      idea: String.raw`NOT, AND and OR together generate every Boolean function (write the truth table as an OR of ANDs of literals, the disjunctive normal form). Each of the three is built from NANDs as shown, so the family $\{\mathrm{NAND}\}$ suffices. This is what makes the CMOS NAND gate (4.8) the standard cell of digital design: one gate type, repeated, is enough, and the physical layer of the digital abstraction only has to provide one regenerating gate.`,
      caption: String.raw`Choose a target function; the network of NAND gates that computes it is drawn, with live signal values (green wires carry 1, grey wires 0). Flip inputs $A$ and $B$ and watch the values flow. The table checks the output against the target for every input row. "Break a gate" sticks the first gate's output at 1: the table then shows which rows fail, since a construction is only correct if every gate is.`,
      credit: 'H. M. Sheffer, 1913 (NOR and its NAND dual); earlier NOR construction by C. S. Peirce in an unpublished manuscript dated c. 1880 by the Collected Papers editors',
      deps: ['circ-4.8', 'logic-2.5'],
      refs: ['Agarwal–Lang §5.3', 'Sheffer (1913), Transactions AMS 14, pp. 481–488, §2 Theorem 1 and final duality footnote', 'Peirce, Collected Papers 4.12–20, A Boolian Algebra with One Constant (editorially dated c. 1880)'],
      tags: ['nand', 'boolean', 'universality'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/NAND_logic', source: 'https://archive.org/download/jstor-1988701/1988701.pdf', peirce: 'https://isidore.co/misc/Res%20pro%20Deo/Peirce/Done/4_local.html#cp4.fn25t.tm' },
      viz(v) {
        const NETS = {
          not: { name: 'NOT', gates: [['A', 'A']], f: (a) => !a },
          and: { name: 'AND', gates: [['A', 'B'], [0, 0]], f: (a, b) => a && b },
          or: { name: 'OR', gates: [['A', 'A'], ['B', 'B'], [0, 1]], f: (a, b) => a || b },
          nor: { name: 'NOR', gates: [['A', 'A'], ['B', 'B'], [0, 1], [2, 2]], f: (a, b) => !(a || b) },
          xor: { name: 'XOR', gates: [['A', 'B'], ['A', 0], ['B', 0], [1, 2]], f: (a, b) => a !== b },
        };
        const sg = v.stage({ x: [-0.8, 5.6], y: [-0.2, 3.6], axes: false, height: 330, weight: 1.3, title: 'a network of NAND gates' });
        const stbl = v.stage({ x: [0, 4], y: [-0.2, 6], axes: false, height: 330, weight: 0.7, title: 'checking every input row' });
        const sel = v.select('compute', [{ value: 'not', label: 'NOT' }, { value: 'and', label: 'AND' }, { value: 'or', label: 'OR' }, { value: 'nor', label: 'NOR' }, { value: 'xor', label: 'XOR' }], 'xor');
        const A = v.toggle('input $A$', true);
        const B = v.toggle('input $B$', false);
        const brk = v.toggle('break a gate', false);
        let info = null;
        const evalNet = (net, a, b, broken) => {
          const out = [];
          const val = (r) => (r === 'A' ? a : r === 'B' ? b : out[r]);
          net.gates.forEach((g, i) => { out[i] = broken && i === 0 ? true : !(val(g[0]) && val(g[1])); });
          return out;
        };
        v.render(() => {
          const net = NETS[sel.value], gs = net.gates, depth = [];
          gs.forEach((g, i) => { depth[i] = 1 + Math.max(...g.map((r) => (typeof r === 'number' ? depth[r] : 0))); });
          const maxd = Math.max(...depth), colCount = {}, pos = [];
          gs.forEach((g, i) => { colCount[depth[i]] = (colCount[depth[i]] || 0) + 1; });
          const seen = {};
          gs.forEach((g, i) => { const n = colCount[depth[i]], j = (seen[depth[i]] = (seen[depth[i]] || 0) + 1) - 1; pos[i] = [depth[i] * (5.0 / (maxd + 0.4)) + 0.2, 1.8 + (j - (n - 1) / 2) * 1.35]; });
          const a = A.value, b = B.value, out = evalNet(net, a, b, brk.value);
          const col = (x) => (x ? 'green' : 'muted');
          const srcPos = { A: [-0.3, 2.5], B: [-0.3, 1.1] };
          const anchor = (r) => (r === 'A' || r === 'B' ? srcPos[r] : [pos[r][0] + 0.6, pos[r][1]]);
          const value = (r) => (r === 'A' ? a : r === 'B' ? b : out[r]);
          gs.forEach((g, i) => g.forEach((r, p) => {
            const q = anchor(r), t = [pos[i][0] - 0.5, pos[i][1] + (p === 0 ? 0.17 : -0.17)], mx = (q[0] + t[0]) / 2;
            sg.path([q, [mx, q[1]], [mx, t[1]], t], { color: col(value(r)), width: value(r) ? 2.6 : 1.6 });
          }));
          gs.forEach((g, i) => {
            const [x, y] = pos[i];
            sg.rect(x - 0.5, y - 0.42, x + 0.5, y + 0.42, { color: brk.value && i === 0 ? 'red' : 'ink', width: 2, fill: brk.value && i === 0 ? 'red' : 'accent', fillAlpha: 0.1, radius: 8 });
            sg.text('NAND', x - 0.04, y, { size: 11.5, color: 'ink' });
            sg.dot(x + 0.55, y, { r: 4.5, hollow: true, color: col(out[i]) });
          });
          const last = gs.length - 1, o = anchor(last);
          sg.line(o[0] + 0.05, o[1], o[0] + 0.6, o[1], { color: col(out[last]), width: 2.8 });
          sg.dot(o[0] + 0.6, o[1], { r: 7, color: col(out[last]) });
          sg.text(out[last] ? '1' : '0', o[0] + 0.85, o[1], { size: 17, color: col(out[last]) });
          for (const r of ['A', 'B']) { sg.dot(srcPos[r][0], srcPos[r][1], { r: 7, color: col(value(r)) }); sg.text(`${r} = ${value(r) ? 1 : 0}`, srcPos[r][0], srcPos[r][1] + 0.4, { size: 12, color: col(value(r)) }); }
          sg.corner(`${gs.length} NAND gate${gs.length > 1 ? 's' : ''}`, 'tl', { plate: true });
          // table
          const rows = [[0, 0], [0, 1], [1, 0], [1, 1]];
          let bad = 0;
          const hdr = ['A', 'B', 'target', 'circuit'];
          hdr.forEach((t, c) => stbl.text(t, 0.5 + c, 5.3, { size: 13, color: 'muted' }));
          rows.forEach(([ra, rb], r) => {
            const y = 4.2 - r * 1.05, target = net.f(!!ra, !!rb) ? 1 : 0, got = evalNet(net, !!ra, !!rb, brk.value)[last] ? 1 : 0, ok = target === got;
            if (!ok) bad++;
            if (ra === +a && rb === +b) stbl.rect(0.05, y - 0.4, 3.95, y + 0.4, { color: 'gold', width: 1.5, fill: 'gold', fillAlpha: 0.12, radius: 6 });
            [ra, rb, target, got].forEach((t, c) => stbl.text(String(t), 0.5 + c, y, { size: 15, color: c === 3 ? (ok ? 'green' : 'red') : 'ink' }));
            stbl.text(ok ? '✓' : '✗', 3.85, y, { size: 13, color: ok ? 'green' : 'red', align: 'right' });
          });
          info = { bad, name: net.name, n: gs.length, out: out[last] };
        });
        v.readout(() => info && `${info.name} from ${info.n} NAND gate${info.n > 1 ? 's' : ''}: ${info.bad === 0 ? 'all 4 input rows agree with the target function.' : `${info.bad} of 4 rows are wrong, so this network does not compute ${info.name}.`}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Model',
      name: 'MOSFET saturation model',
      statement: String.raw`In the square-law model of an n-channel MOSFET with threshold $V_T$ and constant $k$, the drain current is $i_D=0$ for $v_{GS}\le V_T$; in the *triode* region $0<v_{DS}<v_{GS}-V_T$ it is $i_D=k\bigl[(v_{GS}-V_T)v_{DS}-\tfrac12 v_{DS}^2\bigr](1+\lambda v_{DS})$; and in *saturation*, $v_{DS}\ge v_{GS}-V_T$, it is $i_D=\tfrac12 k\,(v_{GS}-V_T)^2\,(1+\lambda v_{DS})$, independent of $v_{DS}$ when $\lambda=0$. The boundary between the two regions is $i_D=\tfrac12 k v_{DS}^2(1+\lambda v_{DS})$, a parabola when $\lambda=0$. For small $v_{DS}$ the device behaves as a voltage-controlled resistor, in saturation as a voltage-controlled current source with transconductance $g_m=k(v_{GS}-V_T)(1+\lambda v_{DS})$.`,
      idea: String.raw`The charge in the channel is proportional to $v_{GS}-V_T$ minus the local channel voltage $v(x)$; the current is that charge times the drift velocity, constant along the channel, so integrating over the length gives the quadratic of the triode region. When $v_{DS}$ reaches the overdrive the channel is pinched off at the drain end and further increase of $v_{DS}$ drops across the depleted region instead, so the current stops growing: the saturation current. The factor $1+\lambda v_{DS}$ is an empirical correction for the shortening of the channel.`,
      caption: String.raw`The output characteristics: one curve per gate voltage (the selected one is thick), the triode region (above the parabola) shaded orange and the saturation region (below it and to its right) green, separated by $i_D=\tfrac12 kv_{DS}^2(1+\lambda v_{DS})$. Drag the gold point along the selected curve past the knee: the curve turns from a rising arc into a nearly flat line. On the right is the transfer characteristic at the point's $v_{DS}$; in saturation $\sqrt{i_D}$ is a straight line in $v_{GS}$ that meets the axis at $V_T$. Raise $\lambda$ to tilt the saturation curves.`,
      scope: String.raw`Long-channel, strong inversion; the empirical factor $1+\lambda v_{DS}$ is applied to both branches here to maintain continuity at the knee. Below threshold the real current is not zero (subthreshold conduction is exponential) and short-channel devices saturate by velocity limitation, giving a nearly linear rather than quadratic law.`,
      credit: 'C.-T. Sah (MOSFET characteristic theory); H. Shichman and D. A. Hodges, 1968 (switching-circuit model)',
      verify: true,
      deps: ['circ-4.7'],
      see: ['cm-4.10'],
      refs: ['Agarwal–Lang §7.4'],
      tags: ['mosfet', 'saturation', 'square law'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/MOSFET#Circuit_symbols' },
      viz(v) {
        const Vt = 1, k = 2e-3;
        const s = v.stage({ x: [0, 6], y: [0, 17], axes: 'box', gutter: true, height: 340, weight: 1.25, xlabel: '$v_{DS}$ (V)', ylabel: '$i_D$ (mA)', title: 'output characteristics' });
        const st = v.stage({ x: [0, 5], y: [0, 4.2], axes: 'box', gutter: true, height: 340, weight: 0.8, xlabel: '$v_{GS}$ (V)', ylabel: '$i_D$ (mA)   and   $\\sqrt{i_D}$ ($\\sqrt{\\mathrm{mA}}$)', title: 'transfer characteristic at the chosen $v_{DS}$' });
        const Vg = v.slider('gate $v_{GS}$', 1.2, 5, 3.5, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} V` });
        const lam = v.slider('$\\lambda$', 0, 0.1, 0.02, { step: 0.002, fmt: (x) => `${v.fix(x, 3)} /V` });
        const h = s.handle(2, 1, { color: 'gold', r: 8, label: 'Q', labelPos: 'se', constrain: (x) => [clamp(x, 0.02, 6), mos(Vg.value, clamp(x, 0.02, 6), Vt, k, lam.value) * 1e3] });
        let info = null;
        v.render(() => {
          const L = lam.value, vg = Vg.value;
          const boundary = (x) => (k / 2) * x * x * (1 + L * x) * 1e3;
          const edgeDS = bisectDec(x => 17 - boundary(x), 0, 6);
          s.between((x) => boundary(x), () => 17, 0, edgeDS, { fill: 'orange', fillAlpha: 0.1 });
          s.between((x) => 0, (x) => boundary(x), 0, edgeDS, { fill: 'green', fillAlpha: 0.07 });
          s.rect(edgeDS, 0, 6, 17, { fill: 'green', fillAlpha: 0.07, stroke: false });
          s.fn((x) => boundary(x), { domain: [0, edgeDS], color: 'muted', width: 1.4, dash: true });
          for (let g = 1.5; g <= 5.001; g += 0.5) s.fn((x) => mos(g, x, Vt, k, L) * 1e3, { domain: [0, 6], color: 'accent', width: 1.2, alpha: 0.55, n: 200 });
          s.fn((x) => mos(vg, x, Vt, k, L) * 1e3, { domain: [0, 6], color: 'accent', width: 3, n: 300 });
          h.set(clamp(h.x, 0.02, 6), 0);
          const vds = clamp(h.x, 0.02, 6); h.set(vds, mos(vg, vds, Vt, k, L) * 1e3);
          const maxI = mos(5, vds, Vt, k, L) * 1e3;
          st.setView([0, 5], [0, Math.max(maxI, Math.sqrt(maxI), 1) * 1.12]);
          s.tex('\\text{triode}', 0.9, 11.5, { color: 'orange', size: 14 });
          s.tex('\\text{saturation}', 5.0, 16, { color: 'green', size: 14 });
          s.tex(`v_{GS}=${v.fix(vg, 2)}`, 5.9, mos(vg, 5.9, Vt, k, L) * 1e3 + 0.7, { color: 'accent', size: 12, align: 'right' });
          st.fn((x) => mos(x, vds, Vt, k, L) * 1e3, { domain: [0, 5], color: 'accent', width: 2.4, n: 300 });
          st.fn((x) => Math.sqrt(mos(x, vds, Vt, k, L) * 1e3), { domain: [0, 5], color: 'purple', width: 2.4, n: 300 });
          st.line(Vt, 0, 4, Math.sqrt((k / 2) * 9 * (1 + L * vds) * 1e3), { color: 'purple', width: 1, dash: true, alpha: 0.6 });
          st.vline(vg, { color: 'gold', dash: true });
          st.dot(vg, mos(vg, vds, Vt, k, L) * 1e3, { color: 'gold', r: 6 });
          st.vline(Vt, { color: 'faint', dash: true });
          st.tex('V_T', Vt, 0.25, { dx: 10, color: 'muted' });
          const reg = mosRegion(vg, vds, Vt), id = mos(vg, vds, Vt, k, L), vov = vg - Vt;
          info = { reg, id, vds, gm: reg === 'saturation' ? k * vov * (1 + L * vds) : k * vds * (1 + L * vds), vov, ro: L > 0 && reg === 'saturation' ? 1 / (L * 0.5 * k * vov * vov) : Infinity };
        });
        v.legend([['accent', '$i_D(v_{DS})$ per $v_{GS}$'], ['muted', '$i_D = \\tfrac12 k v_{DS}^2(1+\\lambda v_{DS})$', { dash: true }], ['purple', '$\\sqrt{i_D}$']]);
        v.readout(() => info && `$v_{GS}-V_T = ${v.fix(info.vov, 2)}$ V, $v_{DS} = ${v.fix(info.vds, 2)}$ V → ${info.reg}; $i_D = ${v.fix(info.id * 1e3, 3)}$ mA, $g_m = ${v.fix(info.gm * 1e3, 2)}$ mS${isFinite(info.ro) ? `, $r_o = ${v.fix(info.ro / 1e3, 1)}$ kΩ` : ''}.`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Model',
      name: 'Bipolar transistor: current gain β',
      statement: String.raw`In the active region of an npn bipolar transistor the collector current is proportional to the base current, $i_C=\beta\,i_B$, in the constant-$\beta$ approximation, where $\beta$ is a device- and bias-dependent current gain; the emitter current is $i_E=(\beta+1)i_B$. The collector current depends on the base–emitter voltage exponentially, $i_C = I_s e^{v_{BE}/V_T}$, as in the diode (4.1). The relation $i_C=\beta i_B$ fails in *saturation*, when $v_{CE}$ is below about $0.2$ V because the collector junction is also forward biased: there $i_C$ is limited by the external circuit, $i_C<\beta i_B$. In the active region $i_C$ increases slightly with $v_{CE}$ (the Early effect, $1+v_{CE}/V_A$).`,
      idea: String.raw`The emitter, a heavily doped n region, injects many electrons into the thin p base across a forward-biased junction; the base is so thin that almost all of them diffuse across to the collector and are swept in by the reverse-biased collector junction, and only a small fraction recombine in the base. Base current supplies these recombination losses and the holes injected from base to emitter. With high emitter injection efficiency and little recombination, the collector-to-base current ratio $\beta$ is large (see 4.15 for Shockley's analysis). The emitter junction is a diode, which is why the collector current is exponential in $v_{BE}$.`,
      caption: String.raw`Left: the collector characteristics (one curve per base current), the load line of the supply $V_{CC}$ and collector resistor $R_C$, and the operating point where the thick curve for the chosen $i_B$ meets the load line. Right: collector current against base current at the same supply and load: it follows the line $i_C=\beta i_B$ and flattens at $V_{CC}/R_C$ once the transistor saturates. Raise the base current past that point and the readout warns: the collector current no longer tracks $\beta i_B$.`,
      scope: String.raw`Simple large-signal model with constant $\beta$, a saturation knee near $0.12$ V and Early voltage $80$ V, all illustrative; real $\beta$ depends on current and temperature.`,
      credit: 'W. Shockley, 1949 (junction-transistor theory; see 4.15)',
      deps: ['circ-4.1', 'cm-4.6'],
      see: ['circ-4.15'],
      refs: ['Shockley (1949), §§4.3 and 6, Eqs. (4.13), (6.1)–(6.4), pp. 460–461, 472–474; saturation knee and Early correction are illustrative extensions'],
      tags: ['bjt', 'current gain', 'transistor'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bipolar_junction_transistor' },
      viz(v) {
        const VA = 80, Vs = 0.12, Vcc = 10;
        const ic = (ib, vce, beta) => beta * ib * (1 + vce / VA) * (1 - Math.exp(-vce / Vs));
        const s = v.stage({ x: [0, 10.4], y: [0, 12], axes: 'box', gutter: true, height: 340, weight: 1.2, xlabel: '$v_{CE}$ (V)', ylabel: '$i_C$ (mA)', title: 'collector characteristics' });
        const st = v.stage({ x: [0, 120], y: [0, 12], axes: 'box', gutter: true, height: 340, weight: 0.9, xlabel: '$i_B$ (µA)', ylabel: '$i_C$ (mA)', title: 'current gain at this load' });
        const Ib = v.slider('base current $i_B$', 0, 120, 40, { step: 1, fmt: (x) => `${v.fix(x, 0)} µA` });
        const beta = v.slider('$\\beta$', 30, 300, 100, { step: 1, fmt: (x) => v.fix(x, 0) });
        const Rc = v.slider('$R_C$', 500, 5000, 1000, { log: true, sig: 2, fmt: (x) => `${eng(x, 2)}Ω` });
        let info = null;
        const op = (ibm, b, R) => { const vce = bisectDec((x) => (Vcc - x) / R - ic(ibm * 1e-6, x, b), 0, Vcc); return { vce, i: (Vcc - vce) / R }; };
        v.render(() => {
          const b = beta.value, R = Rc.value, ib = Ib.value, imax = (Vcc / R) * 1e3;
          s.setView([0, 10.4], [0, Math.max(12, imax * 1.15)]);
          st.setView([0, 120], [0, Math.max(12, imax * 1.15)]);
          s.line(0, imax, Vcc, 0, { color: 'ink', width: 2 });
          s.clip(() => {
            for (let k = 20; k <= 120; k += 20) s.fn((x) => ic(k * 1e-6, x, b) * 1e3, { domain: [0, 10.4], color: 'accent', width: 1.2, alpha: 0.5, n: 160 });
            s.fn((x) => ic(ib * 1e-6, x, b) * 1e3, { domain: [0, 10.4], color: 'accent', width: 3, n: 240 });
          });
          const q = op(ib, b, R);
          s.vband(0, 0.25, { color: 'red', alpha: 0.1 });
          s.tex('\\text{sat.}', 0.12, 11, { color: 'red', size: 12.5, dx: 4 });
          s.dot(q.vce, q.i * 1e3, { color: 'gold', r: 7, label: 'Q', labelPos: 'ne' });
          st.line(0, 0, 120, (120e-6 * b) * 1e3, { color: 'faint', width: 1.5, dash: true });
          st.fn((x) => op(x, b, R).i * 1e3, { domain: [0, 120], color: 'accent', width: 2.6, n: 120 });
          st.hline(imax, { color: 'red', dash: true, alpha: 0.6 });
          st.dot(ib, q.i * 1e3, { color: 'gold', r: 6 });
          info = { q, ib, b, ratio: ib > 0 ? (q.i / (ib * 1e-6)) : b, sat: q.vce < 0.25 };
        });
        v.legend([['accent', '$i_C(v_{CE})$ per $i_B$'], ['ink', 'load line'], ['faint', '$\\beta i_B$ (ideal)', { dash: true }], ['red', 'saturation']]);
        v.readout(() => info && `$i_C = ${v.fix(info.q.i * 1e3, 3)}$ mA, $v_{CE} = ${v.fix(info.q.vce, 2)}$ V; $i_C/i_B = ${v.fix(info.ratio, 1)}$ against $\\beta = ${v.fix(info.b, 0)}$ (the small excess is the Early effect). ${info.sat ? 'The transistor is saturated: the load, not the base current, sets $i_C$.' : 'Active region: the collector current is $\\beta$ times the base current.'}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.12
    {
      num: '4.12',
      kind: 'Model',
      name: 'Common-source amplifier and voltage gain',
      statement: String.raw`An n-channel MOSFET with its source grounded, drain resistor $R_D$ to the supply $V_{DD}$ and gate bias $V_{GS}$ forms the common-source amplifier. If the bias keeps the transistor in saturation, a small signal $\delta v_{in}$ at the gate produces at the drain $\delta v_{out}=-g_m\,(R_D\parallel r_o)\,\delta v_{in}$, with $g_m=k(V_{GS}-V_T)(1+\lambda V_{DS})$ and $r_o\approx 1/(\lambda I_D)$: an inverted copy, larger by the voltage gain $A_v=-g_m(R_D\parallel r_o)$. Large signals are clipped when the transistor enters cutoff ($v_{GS}<V_T$, output at $V_{DD}$) or the triode region ($v_{DS}<v_{GS}-V_T$, gain collapses).`,
      idea: String.raw`In saturation the device is a voltage-controlled current source $i_D=g_m v_{gs}$ (4.10), the load resistor turns the current into a voltage, and the sign comes from Kirchhoff's voltage law at the drain: more current means more drop across $R_D$, so less output voltage. The gain is the slope of the transfer curve $v_{out}(v_{GS})$ at the bias point, i.e. small-signal analysis (4.4) of the whole amplifier. The bias can be chosen to leave room on both sides before cutoff or triode operation; finite signals can still distort within saturation because the transfer curve is nonlinear.`,
      caption: String.raw`Left: the transfer curve $v_{out}$ against $v_{GS}$ (cutoff, saturation and triode regions marked) with the bias point $Q$, the tangent of slope $A_v$ and the input swing. Right: the input signal (grey) and the true output deviation (blue), computed point by point from the transistor model, against the small-signal prediction $A_v\,\delta v_{in}$ (green dashed). For small amplitude the two coincide: an inverted, amplified copy. Move the bias toward the threshold or the triode region, or raise the amplitude, and the output visibly clips.`,
      scope: String.raw`Square-law transistor ($V_T=1$ V, $k=2$ mA/V$^2$, $\lambda=0.02$ V$^{-1}$, $R_D = 2$ kΩ by default); no capacitances, so valid at low frequencies only.`,
      deps: ['circ-4.10', 'circ-4.4'],
      refs: ['Agarwal–Lang (2005), §§7.5–7.6, §8.2.2, pp. 418–425; finite output resistance is an empirical model extension'],
      tags: ['amplifier', 'gain', 'common source'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Common_source' },
      viz(v) {
        const Vdd = 5, Vt = 1, k = 2e-3, L = 0.02;
        const vout = (vg, Rd) => bisectDec((x) => (Vdd - x) / Rd - mos(vg, x, Vt, k, L), 0, Vdd);
        const s = v.stage({ x: [0, 4], y: [0, 5.4], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: '$v_{GS}$ (V)', ylabel: '$v_{out}$ (V)', title: 'transfer curve and bias point' });
        const st = v.stage({ x: [0, 2], y: [-2, 2], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'time (periods)', ylabel: 'deviation from the bias (V)', title: 'input and output signals' });
        const Vb = v.slider('bias $V_{GS}$', 0.8, 3.6, 2, { step: 0.01, fmt: (x) => `${v.fix(x, 2)} V` });
        const amp = v.slider('input amplitude', 0.01, 1, 0.1, { log: true, sig: 2, fmt: (x) => `${v.fix(x * 1000, 0)} mV` });
        const Rd = v.slider('$R_D$', 500, 10e3, 2000, { log: true, sig: 2, fmt: (x) => `${eng(x, 2)}Ω` });
        let info = null;
        v.render(() => {
          const vb = Vb.value, a = amp.value, R = Rd.value, v0 = vout(vb, R), id0 = mos(vb, v0, Vt, k, L);
          const dv = 1e-4, gm = (mos(vb + dv, v0, Vt, k, L) - mos(vb - dv, v0, Vt, k, L)) / (2 * dv), gds = (mos(vb, v0 + dv, Vt, k, L) - mos(vb, v0 - dv, Vt, k, L)) / (2 * dv);
          const Av = -gm / (1 / R + gds);
          const edge = Vt + v0 > 0 ? vb - Vt : 0;
          // regions on the transfer curve: cutoff for vg<=Vt; triode when vds < vg - Vt
          s.fn((x) => vout(x, R), { domain: [0, 4], color: 'accent', width: 2.6, n: 300 });
          s.vband(0, Vt, { color: 'red', alpha: 0.08 });
          const vtri = bisectDec((x) => (vout(x, R) < x - Vt ? -1 : 1), Vt, 4, 50);
          s.vband(vtri, 4, { color: 'orange', alpha: 0.1 });
          s.vband(Vt, vtri, { color: 'green', alpha: 0.08 });
          s.tex('\\text{cutoff}', 0.5, 2.5, { color: 'red', size: 12.5 });
          s.tex('\\text{saturation}', (Vt + vtri) / 2, 0.6, { color: 'green', size: 12.5 });
          s.tex('\\text{triode}', (vtri + 4) / 2, 2.5, { color: 'orange', size: 12.5 });
          s.vband(vb - a, vb + a, { color: 'gold', alpha: 0.2 });
          s.line(vb - 0.6, v0 - Av * 0.6, vb + 0.6, v0 + Av * 0.6, { color: 'green', width: 1.8, dash: true });
          s.dot(vb, v0, { color: 'gold', r: 7, label: 'Q', labelPos: 'ne' });
          const N = 240, out = [], pred = [], inp = [];
          let sat = true, lo = Infinity, hi = -Infinity;
          for (let n = 0; n <= N; n++) {
            const t = (2 * n) / N, x = a * Math.sin(2 * Math.PI * t), y = vout(vb + x, R);
            if (vb + x <= Vt || y < vb + x - Vt) sat = false;
            out.push([t, y - v0]); pred.push([t, Av * x]); inp.push([t, x]); lo = Math.min(lo, y - v0); hi = Math.max(hi, y - v0);
          }
          const yr = Math.max(0.4, a * 1.2, Math.abs(Av) * a * 1.1, hi * 1.1, -lo * 1.1);
          st.setView([0, 2], [-Math.min(yr, 5), Math.min(yr, 5)]);
          st.path(inp, { color: 'muted', width: 1.6 });
          st.path(pred, { color: 'green', width: 2, dash: true });
          st.path(out, { color: 'accent', width: 2.6 });
          st.hline(0, { color: 'faint' });
          info = { gm, Av, sat, gain: (hi - lo) / (2 * a), vb, v0, id0, ro: 1 / gds };
        });
        v.legend([['muted', 'input $\\delta v_{in}$'], ['accent', 'true output'], ['green', '$A_v\\,\\delta v_{in}$', { dash: true }]]);
        v.readout(() => info && `Bias: $i_D = ${v.fix(info.id0 * 1e3, 3)}$ mA, $v_{out} = ${v.fix(info.v0, 2)}$ V. $g_m = ${v.fix(info.gm * 1e3, 2)}$ mS, $r_o = ${v.fix(info.ro / 1e3, 0)}$ kΩ, $A_v = -g_m(R_D\\parallel r_o) = ${v.fix(info.Av, 2)}$. Measured peak-to-peak output / input $= ${v.fix(info.gain, 2)}$. ${info.sat ? 'The transistor stays in saturation over the whole swing.' : '**Clipping:** during part of the cycle the transistor leaves saturation.'}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.13
    {
      num: '4.13',
      kind: 'Invention',
      name: 'Static memory: the cross-coupled latch',
      statement: String.raw`For the symmetric model $f(v)=\tfrac{V_{DD}}2[1-\tanh(g(2v/V_{DD}-1))]$, two cross-coupled inverters ($v_2=f(v_1)$, $v_1=f(v_2)$) have exactly three equilibria when $g>1$: two stable ones near $(V_{OH},V_{OL})$ and $(V_{OL},V_{OH})$ and a third, unstable one at the metastable point $v_1=v_2$. Equilibria satisfy $v_1=f(f(v_1))$; one is stable when $|f'(v_1)f'(v_2)|<1$. The circuit therefore stores one bit: it stays in whichever stable state it is put in, and a pulse that pushes the state across the middle flips it. For $g\le1$ there is only the symmetric equilibrium and no bistable memory; at $g=1$ the equilibrium attracts nonlinearly although linearization is inconclusive.`,
      idea: String.raw`Each inverter restores logic levels (4.6), so a signal travelling around the ring through two inverters returns as a regenerated copy of itself: this positive feedback is what lets the state hold itself indefinitely, drawing only leakage current in CMOS (4.8). Graphically, the curve $v_2=f(v_1)$ and its mirror image $v_1=f(v_2)$ cross three times when the slope at the centre exceeds $1$ in magnitude, and the two outer crossings sit on the flat parts of both curves, where the loop gain is below 1 and the state is stable. The middle crossing is a saddle: the system is balanced there like a pencil on its tip, the metastable state.`,
      caption: String.raw`Phase plane of the latch: the two curves are the transfer curve of inverter 1 (blue) and of inverter 2 (orange), the flow arrows show where the state is pushed (each node charges toward its inverter's output with time constant $\tau$). Drag the gold state anywhere: the trajectory runs to one of the two green stable points, depending on which side of the diagonal it started; start exactly on the diagonal and it creeps toward the saddle. Lower the gain below $1$ and the two stable points merge into one: the memory disappears. The right plot shows the two node voltages over time.`,
      scope: String.raw`Ring of two identical memoryless inverters with first-order (RC) dynamics, $\tau\,\dot v_1 = f(v_2)-v_1$, $\tau\,\dot v_2 = f(v_1)-v_2$; real latches add set/reset inputs, and metastability lasts longer when the start is closer to the diagonal.`,
      credit: 'W. H. Eccles and F. W. Jordan (vacuum-tube trigger relay), 1918–19',
      verify: true,
      deps: ['circ-4.8', 'circ-4.6', 'ode-3.9'],
      refs: ['Agarwal–Lang §10.7'],
      tags: ['memory', 'latch', 'bistability'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Flip-flop_(electronics)' },
      viz(v) {
        const Vdd = 5;
        const s = v.stage({ x: [0, Vdd], y: [0, Vdd], equal: true, axes: 'box', gutter: true, height: 360, weight: 1, xlabel: '$v_1$ (V)', ylabel: '$v_2$ (V)', title: 'phase plane' });
        const st = v.stage({ x: [0, 8], y: [0, Vdd], axes: 'box', gutter: true, height: 360, weight: 0.9, xlabel: 'time ($\\tau$)', ylabel: 'voltage (V)', title: 'the two node voltages' });
        const gain = v.slider('each inverter gain $|f\'|$ at midpoint', 0.5, 6, 3, { log: true, sig: 2, fmt: (x) => v.fix(x, 2) });
        const h = s.handle(2.7, 2.2, { color: 'gold', r: 8, label: 'state', labelPos: 'ne', constrain: { x: [0.02, Vdd - 0.02], y: [0.02, Vdd - 0.02] } });
        v.button('Start near middle, above diagonal', () => h.set(2.45, 2.55));
        v.button('Start near middle, below diagonal', () => h.set(2.55, 2.45));
        let info = null;
        v.render(() => {
          const g = gain.value, f = (x) => (Vdd / 2) * (1 - Math.tanh(g * ((2 * x) / Vdd - 1))), df = (x) => -g / Math.cosh(g * ((2 * x) / Vdd - 1)) ** 2;
          s.field((x, y) => [f(y) - x, f(x) - y], { spacing: 34, color: 'faint', alpha: 0.7 });
          s.fn(f, { domain: [0, Vdd], color: 'accent', width: 2.2, n: 300 });
          s.curve((t) => [f(t), t], 0, Vdd, { color: 'orange', width: 2.2, n: 300 });
          s.line(0, 0, Vdd, Vdd, { color: 'faint', dash: true });
          // equilibria: roots of f(f(x)) - x on a fine grid (every grid point tested)
          const h2 = (x) => f(f(x)) - x, eq = [];
          const M = 2000;
          let prev = h2(0);
          for (let i = 1; i <= M; i++) {
            const x1 = (Vdd * i) / M, cur = h2(x1);
            if (prev === 0) eq.push((Vdd * (i - 1)) / M);
            else if (prev * cur < 0) { const x0 = (Vdd * (i - 1)) / M, r = bisectDec((x) => (prev > 0 ? h2(x) : -h2(x)), x0, x1, 50); eq.push(r); }
            prev = cur;
          }
          const eqs = eq.map((x) => ({ x, y: f(x), stable: g <= 1 || Math.abs(df(x) * df(f(x))) < 1 }));
          eqs.forEach((e) => s.dot(e.x, e.y, { r: 7, color: e.stable ? 'green' : 'red', hollow: !e.stable }));
          // trajectory by RK4, tau = 1
          const F = (x, y) => [f(y) - x, f(x) - y], dt = 0.02, T = 8;
          let x = clamp(h.x, 0, Vdd), y = clamp(h.y, 0, Vdd);
          const tr = [[x, y]], ser1 = [[0, x]], ser2 = [[0, y]];
          for (let n = 1; n <= T / dt; n++) {
            const k1 = F(x, y), k2 = F(x + dt * k1[0] / 2, y + dt * k1[1] / 2), k3 = F(x + dt * k2[0] / 2, y + dt * k2[1] / 2), k4 = F(x + dt * k3[0], y + dt * k3[1]);
            x += (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); y += (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
            if (n % 3 === 0) { tr.push([x, y]); ser1.push([n * dt, x]); ser2.push([n * dt, y]); }
          }
          s.path(tr, { color: 'gold', width: 2.4 });
          st.path(ser1, { color: 'accent', width: 2.4 });
          st.path(ser2, { color: 'orange', width: 2.4 });
          st.hline(Vdd / 2, { color: 'faint', dash: true });
          const nStable = eqs.filter((e) => e.stable).length;
          info = { n: eqs.length, nStable, end: [x, y], bit: nStable >= 2 ? (x > y ? 1 : 0) : null, g };
        });
        v.legend([['accent', '$v_2 = f(v_1)$'], ['orange', '$v_1 = f(v_2)$'], ['green', 'stable'], ['red', 'unstable (hollow)'], ['gold', 'trajectory']]);
        v.readout(() => info && (info.nStable >= 2
          ? `${info.n} equilibria (${info.nStable} stable). The trajectory ends at $(${v.fix(info.end[0], 2)}, ${v.fix(info.end[1], 2)})$ V: the latch stores a ${info.bit}. Drag the state across the diagonal to flip it.`
          : `Midpoint gain $${v.fix(info.g, 2)}\\le 1$: ${info.n} equilibrium, no memory; every start ends at $(${v.fix(info.end[0], 2)}, ${v.fix(info.end[1], 2)})$ V.`));
      },
    },
  ],
};
