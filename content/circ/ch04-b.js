// Circuits — Chapter 4: Nonlinear elements and the digital abstraction (part b: 4.7–4.13)
//
// Transistor characteristics are the textbook square-law / current-gain models with illustrative parameters, not measured data of any device.
import { clamp, bisectDec, mos, mosRegion, eng } from './ch04.shared.js';
import { mosSmallSignal, mosSwitchPoint, bjtCurrent, bjtPoint } from './circ-source-audit-devices.shared.js';
import { cmosPoint, NAND_NETS, evalNand, latchF, latchEquilibria, latchTrace } from './circ-source-audit-logic.shared.js';

export default {
  collection: 'circ',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Model',
      name: 'MOSFET as a switch',
      statement: String.raw`A MOSFET has gate, drain, source and body terminals; here the body is tied to the source. In the ideal quasi-static n-channel enhancement model the gate draws no DC current, and $i_D=0$ for $v_{GS}\le V_T$. For $v_{GS}>V_T$ and $v_{DS}\ll v_{GS}-V_T$, the channel has $R_{\mathrm{on}}\approx1/[k(v_{GS}-V_T)]$. A pull-down beneath a resistor $R$ to $V_{DD}$ then gives $v_{out}=V_{DD}$ when off, or $v_{out}\approx V_{DD}R_{\mathrm{on}}/(R+R_{\mathrm{on}})$ in the resistive approximation. A low output requires $R_{\mathrm{on}}\ll R$ as well as adequate overdrive.`,
      idea: String.raw`The insulated gate controls the inversion-layer charge. Integrating its drift current along a long channel gives the square-law model (4.10); its slope at $v_{DS}=0$ is $k(v_{GS}-V_T)$. Replacing the curve by that tangent produces the resistor model. Its accuracy must be checked at the load-line intersection, because an input above threshold alone does not keep the operating point at small drain voltage. Real gate capacitance draws transient current and real oxides leak.`,
      caption: String.raw`Change the gate voltage and pull-up resistance. The left plot compares the resistive switch approximation with the square-law curve and their load-line intersections. The right plot shows the corresponding inverter outputs. The off states coincide in this ideal model; on-state agreement improves when the operating drain voltage is small compared with the gate overdrive. Near threshold, or with a strong pull-up, substantial disagreement can remain.`,
      scope: String.raw`Quasi-static, long-channel illustration: source and body grounded, constant threshold, no subthreshold or gate leakage, no capacitances. The dashed model uses the continuous empirical $1+\lambda v_{DS}$ extension specified in 4.10, with $\lambda=0.02$ V$^{-1}$.`,
      credit: 'Model derivation: C. G. Fonstad, MIT 6.012 Lecture 11, slides 2–12 (2008 notes in the 2009 course)',
      verify: false,
      deps: ['circ-4.6', 'circ-4.3'],
      see: ['cm-4.10'],
      refs: ['Fonstad, MIT 6.012 Lecture 11, slides 2–12'],
      tags: ['mosfet', 'switch'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/MOSFET' },
      viz(v) {
        const Vdd = 5, Vt = 1, k = 2e-3;
        const s = v.stage({ x: [0, 5.2], y: [0, 3], axes: 'box', gutter: true, height: 320, weight: 1.2, xlabel: '$v_{DS}$ (V)', ylabel: '$i_D$ (mA)', title: 'drain–source plane' });
        const so = v.stage({ x: [0, 5], y: [-0.2, 5.4], axes: 'box', gutter: true, height: 320, weight: 0.9, xlabel: '$v_{GS}$ (V)', ylabel: '$v_{out}$ (V)', title: 'the inverter' });
        const Vg = v.slider('gate $v_{GS}$', 0, 5, 3, { step: 0.02, fmt: (x) => `${v.fix(x, 2)} V` });
        const R = v.slider('pull-up $R$', 500, 20e3, 2000, { log: true, sig: 2, fmt: (x) => `${eng(x, 2)}Ω` });
        let info = null;
        const swOut = (vg, Rv) => mosSwitchPoint(vg, Rv, Vdd, Vt, k).sw;
        const trOut = (vg, Rv) => mosSwitchPoint(vg, Rv, Vdd, Vt, k).transistor;
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
      statement: String.raw`A CMOS inverter joins a p-channel pull-up to $V_{DD}$ and an n-channel pull-down to ground, with common input gates and a common output. Near either logic rail one transistor is off, so ideal DC supply current vanishes and real current is leakage. At intermediate input voltages both can conduct: this current persists if the input is held there. A matched symmetric pair has switching point $V_M=V_{DD}/2$. Noise margins depend on the transfer characteristic and input thresholds, not on rail-to-rail output alone. Charging and discharging output capacitance also dissipates switching energy; those transients are absent from this DC plot.`,
      idea: String.raw`The complementary pull-up provides a low-resistance path to the high rail when the pull-down is off, and conversely for the low rail. This removes the resistor-load inverter's continuous rail-state current. For intermediate bias, equating the two drain currents fixes the output, and their transconductances give a steep negative transfer slope. Device strengths, thresholds and finite gain determine the noise margins; matching the two strengths makes the transfer curve symmetric.`,
      caption: String.raw`Drag the input along the DC transfer curve. The right plot shows steady supply current at that input, with an assumed $1$ nA display floor added. The high-current intermediate-bias region is not a time trace: a held intermediate input continues drawing current. The dashed curve is a resistor-load inverter under the same input sweep. $V_M$ marks $v_{out}=v_{in}$ for the matched pair.`,
      scope: String.raw`Matched long-channel illustrative devices, body tied to source, $V_T=0.7$ V and the continuous empirical $\lambda=0.03$ V$^{-1}$ extension of 4.10. No measured leakage or capacitive transient model: the constant $1$ nA is added for logarithmic display. The original patent's bipolar supply is shifted to rails $0,V_{DD}$ here.`,
      verify: false, // Historical claims await a full primary-source comparison.
      credit: 'F. M. Wanlass, US 3,356,858, filed June 18, 1963, Fig. 5 and cols. 4–5; analysis: J. A. del Alamo, MIT 6.012 Lecture 14 (2005)',
      deps: ['circ-4.7'],
      see: ['circ-4.17'],
      refs: ['Wanlass, US 3,356,858, Fig. 5, cols. 4–5', 'del Alamo, MIT 6.012 Lecture 14, slides 3–13, 21–24'],
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
          const V = Vdd.value, f = (x) => cmosPoint(x, V, Vt, k).vo;
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
          const gain = cmosPoint(vin, V, Vt, k).gain;
          let pk = 0; for (let k2 = 0; k2 <= 200; k2++) pk = Math.max(pk, cur((V * k2) / 200));
          info = { vin, vo, i: cur(vin), VM, gain, pk, V };
        });
        v.legend([['accent', 'CMOS'], ['red', 'resistor-load n-channel inverter', { dash: true }], ['orange', 'switching threshold $V_M$'], ['gold', 'input']]);
        v.readout(() => info && `$v_{in} = ${v.fix(info.vin, 2)}$ V → $v_{out} = ${v.fix(info.vo, 3)}$ V; gain $dv_{out}/dv_{in} = ${v.fix(info.gain, 1)}$; supply current $${v.sci(info.i, 2)}$ A. Switching threshold $V_M = ${v.fix(info.VM, 3)}$ V ($V_{DD}/2 = ${v.fix(info.V / 2, 3)}$ V). Peak DC current over input sweep $${v.sci(info.pk, 2)}$ A against $\\approx$ $${v.sci(1e-9, 1)}$ A static.`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Theorem',
      name: 'Universality of NAND gates',
      statement: String.raw`Every Boolean function with a finite positive number of inputs can be computed by a finite acyclic circuit of two-input NAND gates and fan-out. With $N(a,b)=\lnot(a\wedge b)$: $\lnot a=N(a,a)$, $a\wedge b=N(N(a,b),N(a,b))$, $a\vee b=N(N(a,a),N(b,b))$, and $a\oplus b=N(N(a,m),N(b,m))$ where $m=N(a,b)$. Constants are obtainable from any input: $1=N(a,N(a,a))$ and $0=N(1,1)$. A circuit with zero inputs requires an available constant source. NOR alone is likewise universal.`,
      idea: String.raw`For each true row of a finite truth table, form the AND of literals that selects exactly that row, then OR those terms. Replacing each NOT, AND and OR with its NAND construction proves the claim for any finite number of inputs; constant functions are handled as stated. The five small networks below illustrate this proof but are not themselves a proof for arbitrary arity. CMOS implementations can realize NAND directly using complementary pull-up and pull-down networks.`,
      caption: String.raw`Choose a target function; the network of NAND gates that computes it is drawn, with live signal values (green wires carry 1, grey wires 0). Flip inputs $A$ and $B$ and watch the values flow. The table checks the output against the target for every input row. "Break a gate" sticks the first gate's output at 1: the table then shows which rows fail for this chosen fault. A fault can be masked for some inputs.`,
      credit: 'Constructive proof: C. Terman, MIT 6.004 (2017), Combinational Logic, Universal Building Blocks',
      verify: false,
      deps: ['circ-4.8'],
      refs: ['Terman, MIT 6.004 (2017), Combinational Logic, sections 2–7'],
      tags: ['nand', 'boolean', 'universality'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/NAND_logic' },
      viz(v) {
        const NETS = NAND_NETS;
        const sg = v.stage({ x: [-0.8, 5.6], y: [-0.2, 3.6], axes: false, height: 330, weight: 1.3, title: 'a network of NAND gates' });
        const stbl = v.stage({ x: [0, 4], y: [-0.2, 6], axes: false, height: 330, weight: 0.7, title: 'checking every input row' });
        const sel = v.select('compute', [{ value: 'not', label: 'NOT' }, { value: 'and', label: 'AND' }, { value: 'or', label: 'OR' }, { value: 'nor', label: 'NOR' }, { value: 'xor', label: 'XOR' }], 'xor');
        const A = v.toggle('input $A$', true);
        const B = v.toggle('input $B$', false);
        const brk = v.toggle('break a gate', false);
        let info = null;
        const evalNet = evalNand;
        v.render(() => {
          const net = NETS[sel.value], gs = net.gates, depth = [];
          gs.forEach((g, i) => { depth[i] = 1 + Math.max(...g.map((r) => (typeof r === 'number' ? depth[r] : 0))); });
          const maxd = Math.max(...depth), colCount = {}, pos = [];
          sg.setView([-0.8, 6.5], [-0.2, 3.6]);
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
      statement: String.raw`Let $u=v_{GS}-V_T$, with source and body grounded and $v_{DS}\ge0$. The long-channel square-law model has $i_D=0$ for $u\le0$; otherwise $i_D=k(uv_{DS}-v_{DS}^2/2)$ for $v_{DS}<u$, and $i_D=ku^2/2$ for $v_{DS}\ge u$. Here an illustrative empirical factor $1+\lambda v_{DS}$ multiplies BOTH nonzero branches, preserving continuity at the knee. Thus the boundary is $i_D=kv_{DS}^2(1+\lambda v_{DS})/2$, and in saturation $g_m=ku(1+\lambda v_{DS})$, $g_{ds}=\lambda ku^2/2$. Only when $\lambda=0$ is the saturation current independent of drain voltage.`,
      idea: String.raw`Under the gradual-channel approximation, integrating the inversion charge times mobility along the channel yields the triode quadratic. At $v_{DS}=u$ the inversion charge vanishes at the drain, giving the square-law saturation current. Channel-length modulation introduces a drain-voltage dependence. This display applies the same empirical multiplier on each side of the knee; it is a declared smooth extension of the $\lambda=0$ model, not an exact device fit or a reproduction of a particular compact-model paper.`,
      caption: String.raw`Left: the current family and selected gate bias, with the corrected boundary separating triode (above the boundary) and saturation (below it). Drag the gold point along the selected curve. The vertical scale includes the entire plotted family at every setting. Right: only the dimensionless quantity $\sqrt{i_D/(1\,\mathrm{mA})}$ is plotted. At fixed drain voltage it is linear in gate overdrive while the device remains in saturation; the dashed segment ends at that regime boundary. Raising $\lambda$ tilts the saturation curves.`,
      scope: String.raw`Constant-threshold, long-channel, strong-inversion approximation with body tied to source and the gradual-channel factor $\alpha$ set to 1. The finite-$\lambda$ multiplier on BOTH branches is an illustrative extension; Fonstad slide 20 instead writes a saturation-only correction anchored at the knee. Subthreshold conduction, velocity saturation, body effect and capacitances are omitted.`,
      credit: 'Square-law derivation: C. G. Fonstad, MIT 6.012 Lecture 11, slides 3–12; channel-length modulation: slides 19–20',
      verify: false,
      deps: ['circ-4.7'],
      see: ['cm-4.10'],
      refs: ['Fonstad, MIT 6.012 Lecture 11, slides 3–12, 19–20'],
      tags: ['mosfet', 'saturation', 'square law'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/MOSFET#Circuit_symbols' },
      viz(v) {
        const Vt = 1, k = 2e-3;
        const s = v.stage({ x: [0, 6], y: [0, 17], axes: 'box', gutter: true, height: 340, weight: 1.25, xlabel: '$v_{DS}$ (V)', ylabel: '$i_D$ (mA)', title: 'output characteristics' });
        const st = v.stage({ x: [0, 5], y: [0, 4.2], axes: 'box', gutter: true, height: 340, weight: 0.8, xlabel: '$v_{GS}$ (V)', ylabel: '$\\sqrt{i_D/(1\\,\\mathrm{mA})}$', title: 'transfer characteristic at the chosen $v_{DS}$' });
        const Vg = v.slider('gate $v_{GS}$', 1.2, 5, 3.5, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} V` });
        const lam = v.slider('$\\lambda$', 0, 0.1, 0.02, { step: 0.002, fmt: (x) => `${v.fix(x, 3)} /V` });
        const h = s.handle(2, 1, { color: 'gold', r: 8, constrain: (x) => [clamp(x, 0.02, 6), mos(Vg.value, clamp(x, 0.02, 6), Vt, k, lam.value) * 1e3] });
        let info = null;
        v.render(() => {
          const L = lam.value, vg = Vg.value;
          const ymax = 1.15 * mos(5, 6, Vt, k, L) * 1e3;
          s.setView([0, 6], [0, ymax]);
          st.setView([0, 5], [0, 1.15 * Math.sqrt(mos(5, 6, Vt, k, L) * 1e3)]);
          const boundary = (x) => (k / 2) * x * x * (1 + L * x) * 1e3;
          s.between(boundary, () => ymax, 0, 4, { fill: 'orange', fillAlpha: 0.1 });
          s.between(() => 0, boundary, 0, 4, { fill: 'green', fillAlpha: 0.07 });
          s.rect(4, 0, 6, ymax, { fill: 'green', fillAlpha: 0.07, stroke: false });
          s.fn(boundary, { domain: [0, 4], color: 'muted', width: 1.4, dash: true });
          for (let g = 1.5; g <= 5.001; g += 0.5) s.fn((x) => mos(g, x, Vt, k, L) * 1e3, { domain: [0, 6], color: 'accent', width: 1.2, alpha: 0.55, n: 200 });
          s.fn((x) => mos(vg, x, Vt, k, L) * 1e3, { domain: [0, 6], color: 'accent', width: 3, n: 300 });
          h.set(clamp(h.x, 0.02, 6), 0);
          const vds = clamp(h.x, 0.02, 6); h.set(vds, mos(vg, vds, Vt, k, L) * 1e3);
          s.tex('\\text{triode}', 0.9, ymax * .68, { color: 'orange', size: 14 });
          s.tex('\\text{saturation}', 5.0, ymax * .92, { color: 'green', size: 14 });
          s.tex(`v_{GS}=${v.fix(vg, 2)}`, 5.9, mos(vg, 5.9, Vt, k, L) * 1e3 + 0.7, { color: 'accent', size: 12, align: 'right' });
          st.fn((x) => Math.sqrt(mos(x, vds, Vt, k, L) * 1e3), { domain: [0, 5], color: 'purple', width: 2.4, n: 300 });
          const satEnd = Math.min(5, Vt + vds);
          st.line(Vt, 0, satEnd, Math.sqrt((k / 2) * (satEnd - Vt) ** 2 * (1 + L * vds) * 1e3), { color: 'purple', width: 1, dash: true, alpha: 0.6 });
          st.vline(vg, { color: 'gold', dash: true });
          st.dot(vg, Math.sqrt(mos(vg, vds, Vt, k, L) * 1e3), { color: 'gold', r: 6 });
          st.vline(Vt, { color: 'faint', dash: true });
          st.tex('V_T', Vt, 0.25, { dx: 10, color: 'muted' });
          const reg = mosRegion(vg, vds, Vt), id = mos(vg, vds, Vt, k, L), vov = vg - Vt;
          info = { reg, id, vds, vov, ...mosSmallSignal(vg, vds, Vt, k, L) };
        });
        v.legend([['accent', '$i_D(v_{DS})$ per $v_{GS}$'], ['muted', 'region boundary', { dash: true }], ['purple', '$\\sqrt{i_D/(1\\,\\mathrm{mA})}$']]);
        v.readout(() => info && `$v_{GS}-V_T = ${v.fix(info.vov, 2)}$ V, $v_{DS} = ${v.fix(info.vds, 2)}$ V → ${info.reg}; $i_D = ${v.fix(info.id * 1e3, 3)}$ mA, $g_m = ${v.fix(info.gm * 1e3, 2)}$ mS${isFinite(info.ro) ? `, $r_o = ${v.fix(info.ro / 1e3, 1)}$ kΩ` : ', $r_o = \\infty$' }.`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Model',
      name: 'Bipolar transistor: current gain β',
      statement: String.raw`For an npn BJT in forward active operation, the base–emitter junction is forward biased and the base–collector junction reverse biased. Neglecting leakage and high-injection effects, $i_C\approx I_s e^{v_{BE}/V_T}$ and $i_C\approx\beta_F i_B$, with emitter-current magnitude $|i_E|=i_C+i_B$. The gain is device-, current- and temperature-dependent; the slider explores an illustrative $30$–$300$ range. When both junctions become forward biased the device is saturated and the forward-active gain relation fails. The often-used $v_{CE}\approx0.2$ V is only a rough circuit approximation, not a universal junction-bias boundary. Base-width modulation gives the Early-effect dependence on collector voltage.`,
      idea: String.raw`Electrons injected from the emitter diffuse across the thin base and are collected by the reverse-biased collector junction. Base current includes holes injected from the base into the emitter as well as recombination contributions; it is not solely the electrons lost in the base. In the ideal forward-active derivation the collector and base currents have approximately the same exponential voltage dependence, yielding their ratio $\beta_F$. A load resistor limits the current when increasing base drive pushes the output into its low-voltage knee.`,
      caption: String.raw`The plots use the explicitly illustrative smooth-knee law $i_C=\beta i_B(1+v_{CE}/(80\,\mathrm V))[1-e^{-v_{CE}/(0.12\,\mathrm V)}]$. The gold operating point is its intersection with the load line. The right plot compares that loaded current with $\beta i_B$ and the load ceiling $V_{CC}/R_C$. The ratio may exceed $\beta$ from the Early factor or fall below it in the knee; at zero base current it is undefined. The shaded $v_{CE}<0.25$ V band marks a display convention, not a measured saturation boundary.`,
      scope: String.raw`The plotted smooth-knee law is not Ebers–Moll and does not track both junction biases. Its $80$ V Early voltage and $0.12$ V knee scale are chosen illustration parameters. No stored charge, temperature dependence, reverse operation, breakdown or measured device data are represented.`,
      verify: false, // Historical claims await a full primary-source comparison.
      credit: 'Device derivation: J. A. del Alamo, MIT 6.012 Lecture 17 (2005); Early effect: C. G. Fonstad, Lecture 11, slides 19–21',
      deps: ['circ-4.1'],
      see: ['circ-4.15'],
      refs: ['del Alamo, MIT 6.012 Lecture 17, slides 4–14', 'Fonstad, MIT 6.012 Lecture 11, slides 19–21'],
      tags: ['bjt', 'current gain', 'transistor'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bipolar_junction_transistor' },
      viz(v) {
        const Vcc = 10, ic = bjtCurrent;
        const s = v.stage({ x: [0, 10.4], y: [0, 12], axes: 'box', gutter: true, height: 340, weight: 1.2, xlabel: '$v_{CE}$ (V)', ylabel: '$i_C$ (mA)', title: 'collector characteristics' });
        const st = v.stage({ x: [0, 120], y: [0, 12], axes: 'box', gutter: true, height: 340, weight: 0.9, xlabel: '$i_B$ (µA)', ylabel: '$i_C$ (mA)', title: 'current gain at this load' });
        const Ib = v.slider('base current $i_B$', 0, 120, 40, { step: 1, fmt: (x) => `${v.fix(x, 0)} µA` });
        const beta = v.slider('$\\beta$', 30, 300, 100, { step: 1, fmt: (x) => v.fix(x, 0) });
        const Rc = v.slider('$R_C$', 500, 5000, 1000, { log: true, sig: 2, fmt: (x) => `${eng(x, 2)}Ω` });
        let info = null;
        const op = bjtPoint;
        v.render(() => {
          const b = beta.value, R = Rc.value, ib = Ib.value, imax = (Vcc / R) * 1e3;
          const ymax = 1.2 * Math.max(imax, ic(120e-6, 10.4, b) * 1e3);
          s.setView([0, 10.4], [0, ymax]);
          st.setView([0, 120], [0, 1.2 * Math.max(imax, 120e-6 * b * 1e3)]);
          s.line(0, imax, Vcc, 0, { color: 'ink', width: 2 });
          s.clip(() => {
            for (let k = 20; k <= 120; k += 20) s.fn((x) => ic(k * 1e-6, x, b) * 1e3, { domain: [0, 10.4], color: 'accent', width: 1.2, alpha: 0.5, n: 160 });
            s.fn((x) => ic(ib * 1e-6, x, b) * 1e3, { domain: [0, 10.4], color: 'accent', width: 3, n: 240 });
          });
          const q = op(ib, b, R);
          s.vband(0, 0.25, { color: 'red', alpha: 0.1 });
          s.tex('\\text{knee}', 0.12, ymax * .9, { color: 'red', size: 12.5, dx: 4 });
          s.dot(q.vce, q.i * 1e3, { color: 'gold', r: 7, label: 'Q', labelPos: q.vce > Vcc / 2 ? 'nw' : 'ne' });
          st.line(0, 0, 120, (120e-6 * b) * 1e3, { color: 'faint', width: 1.5, dash: true });
          st.fn((x) => op(x, b, R).i * 1e3, { domain: [0, 120], color: 'accent', width: 2.6, n: 120 });
          st.hline(imax, { color: 'red', dash: true, alpha: 0.6 });
          st.dot(ib, q.i * 1e3, { color: 'gold', r: 6 });
          info = { q, ib, b, ratio: ib > 0 ? (q.i / (ib * 1e-6)) : null, sat: q.vce < 0.25 };
        });
        v.legend([['accent', '$i_C(v_{CE})$ per $i_B$'], ['ink', 'load line'], ['faint', '$\\beta i_B$ (ideal)', { dash: true }], ['red', 'chosen low-voltage knee']]);
        v.readout(() => info && `$i_C = ${v.fix(info.q.i * 1e3, 3)}$ mA, $v_{CE} = ${v.fix(info.q.vce, 2)}$ V; ${info.ratio === null ? 'base current is zero, so the current ratio is undefined.' : `$i_C/i_B = ${v.fix(info.ratio, 1)}$ against $\\beta = ${v.fix(info.b, 0)}$.`} ${info.sat ? 'Operating point in the chosen soft knee; the forward-active gain approximation is inaccurate.' : 'Outside the chosen low-voltage band; the smooth-knee and Early factors still determine the displayed current.'}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.12
    {
      num: '4.12',
      kind: 'Model',
      name: 'Common-source amplifier and voltage gain',
      statement: String.raw`An n-channel MOSFET with its source grounded, drain resistor $R_D$ to the supply $V_{DD}$ and gate bias $V_{GS}$ forms the common-source amplifier. If the bias keeps the transistor in saturation, a small signal $\delta v_{in}$ at the gate produces at the drain $\delta v_{out}=-g_m\,(R_D\parallel r_o)\,\delta v_{in}$, with $g_m=k(V_{GS}-V_T)(1+\lambda V_{DS})$ and $r_o\approx 1/(\lambda I_D)$: an inverted copy, larger by the voltage gain $A_v=-g_m(R_D\parallel r_o)$. Large signals are clipped when the transistor enters cutoff ($v_{GS}<V_T$, output at $V_{DD}$) or the triode region ($v_{DS}<v_{GS}-V_T$, gain collapses).`,
      idea: String.raw`In saturation the device is a voltage-controlled current source $i_D=g_m v_{gs}$ (4.10), the load resistor turns the current into a voltage, and the sign comes from Kirchhoff's voltage law at the drain: more current means more drop across $R_D$, so less output voltage. The gain is the slope of the transfer curve $v_{out}(v_{GS})$ at the bias point, i.e. small-signal analysis (4.4) of the whole amplifier. The bias puts the operating point in the middle of the saturation region so the swing is symmetric.`,
      caption: String.raw`Left: the transfer curve $v_{out}$ against $v_{GS}$ (cutoff, saturation and triode regions marked) with the bias point $Q$, the tangent of slope $A_v$ and the input swing. Right: the input signal (grey) and the true output deviation (blue), computed point by point from the transistor model, against the small-signal prediction $A_v\,\delta v_{in}$ (green dashed). For small amplitude the two coincide: an inverted, amplified copy. Move the bias toward the threshold or the triode region, or raise the amplitude, and the output visibly clips.`,
      scope: String.raw`Square-law transistor ($V_T=1$ V, $k=2$ mA/V$^2$, $\lambda=0.02$ V$^{-1}$, $R_D = 2$ kΩ by default); no capacitances, so valid at low frequencies only.`,
      deps: ['circ-4.10', 'circ-4.4'],
      refs: ['Agarwal–Lang §7.5', 'Agarwal–Lang §8.2'],
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
      kind: 'Model',
      name: 'Static memory: the cross-coupled latch',
      statement: String.raw`Consider identical inverters with $f(x)=V_{DD}[1-\tanh(g(2x/V_{DD}-1))]/2$ and dynamics $\tau\dot v_1=f(v_2)-v_1$, $\tau\dot v_2=f(v_1)-v_2$. For $0<g\le1$ there is one asymptotically stable equilibrium, $(V_{DD}/2,V_{DD}/2)$; at $g=1$ its linearization has a zero eigenvalue. For $g>1$ there are exactly three: the midpoint is a saddle and two asymmetric equilibria are stable. The single-inverter midpoint slope magnitude is $g$ and the loop gain is $g^2$. More general decreasing transfer curves need additional shape hypotheses for an exact equilibrium count.`,
      idea: String.raw`Odd symmetry and monotonicity force equilibria onto $v_1+v_2=V_{DD}$. Writing $z=2v_1/V_{DD}-1$ reduces the problem to $z=\tanh(gz)$. For $g>1$, strict concavity of $\tanh(gz)$ for $z>0$ gives exactly one positive root and its negative counterpart. Linearization has eigenvalues $[-1\pm\sqrt{f'(v_1)f'(v_2)}]/\tau$: the outer pair has loop gain below one, the midpoint above one. At $g=1$, a strictly decreasing quadratic Lyapunov function establishes stability despite the zero eigenvalue. Positive feedback is the physical latch principle; this tanh model is an illustration, not a transistor-level reconstruction.`,
      caption: String.raw`Drag the initial state or use the two start buttons. The gold path and right-hand time traces show only $8\tau$ of motion, and the readout reports the finite endpoint and residual speed. For $g>1$, opposite sides of the diagonal lead toward opposite stable states; exactly on the diagonal the deterministic model approaches the saddle. Near the critical gain or the diagonal, the finite trace may still be far from a stored logic state. Lowering $g$ through one merges the outer equilibria; $g=1$ is nonhyperbolic, not an unstable saddle.`,
      scope: String.raw`Identical memoryless tanh inverters with one RC time constant, no noise, capacitive coupling, set/reset or clock input. Root counts follow the scalar equation, not a finite grid search; traces are fixed-step RK4 illustrations. The critical-point stability statement applies to this model. Physical metastability resolution is affected by mismatch and noise.`,
      credit: 'Static-latch principle: M. H. Perrott, MIT 6.976 Lecture 13 (2003), slides 50–51; tanh dynamics and bifurcation derived here',
      verify: false,
      deps: ['circ-4.8', 'circ-4.6'],
      refs: ['Perrott, MIT 6.976 Lecture 13 (2003), slides 50–51'],
      tags: ['memory', 'latch', 'bistability'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Flip-flop_(electronics)' },
      viz(v) {
        const Vdd = 5;
        const s = v.stage({ x: [0, Vdd], y: [0, Vdd], equal: true, axes: 'box', gutter: true, height: 360, weight: 1, xlabel: '$v_1$ (V)', ylabel: '$v_2$ (V)', title: 'phase plane' });
        const st = v.stage({ x: [0, 8], y: [0, Vdd], axes: 'box', gutter: true, height: 360, weight: 0.9, xlabel: 'time ($\\tau$)', ylabel: 'voltage (V)', title: 'the two node voltages' });
        const gain = v.slider('single-inverter midpoint gain $g$', 0.5, 6, 3, { log: true, sig: 2, fmt: (x) => v.fix(x, 2) });
        const h = s.handle(2.7, 2.2, { color: 'gold', r: 8, label: 'state', labelPos: 'ne', constrain: { x: [0.02, Vdd - 0.02], y: [0.02, Vdd - 0.02] } });
        v.button('Start near middle, above diagonal', () => h.set(2.45, 2.55));
        v.button('Start near middle, below diagonal', () => h.set(2.55, 2.45));
        v.button('Start on diagonal', () => h.set(2.8, 2.8));
        let info = null;
        v.render(() => {
          const g = gain.value, f = (x) => latchF(x, g, Vdd);
          s.field((x, y) => [f(y) - x, f(x) - y], { spacing: 34, color: 'faint', alpha: 0.7 });
          s.fn(f, { domain: [0, Vdd], color: 'accent', width: 2.2, n: 300 });
          s.curve((t) => [f(t), t], 0, Vdd, { color: 'orange', width: 2.2, n: 300 });
          s.line(0, 0, Vdd, Vdd, { color: 'faint', dash: true });
          const eqs = latchEquilibria(g, Vdd);
          eqs.forEach((e) => s.dot(e.x, e.y, { r: 7, color: e.critical ? 'purple' : e.stable ? 'green' : 'red', hollow: !e.stable }));
          const { tr, ser1, ser2, end, residual } = latchTrace(clamp(h.x, 0, Vdd), clamp(h.y, 0, Vdd), g, Vdd);
          s.path(tr, { color: 'gold', width: 2.4 });
          st.path(ser1, { color: 'accent', width: 2.4 });
          st.path(ser2, { color: 'orange', width: 2.4 });
          st.hline(Vdd / 2, { color: 'faint', dash: true });
          const nStable = eqs.filter((e) => e.stable).length;
          info = { n: eqs.length, nStable, end, residual, g };
        });
        v.legend([['accent', '$v_2 = f(v_1)$'], ['orange', '$v_1 = f(v_2)$'], ['green', 'stable'], ['red', 'saddle (hollow)'], ['purple', 'critical stable midpoint'], ['gold', 'trajectory']]);
        v.readout(() => info && `$g=${v.fix(info.g, 3)}$, loop gain $g^2=${v.fix(info.g ** 2, 3)}$: ${info.n} ${info.n === 1 ? 'equilibrium' : 'equilibria'} (${info.nStable} stable). At $t=8\\tau$, the finite trace reaches $(${v.fix(info.end[0], 3)}, ${v.fix(info.end[1], 3)})$ V, residual speed $${v.sci(info.residual, 2)}$ V/$\\tau$. ${info.g > 1 ? 'Bistable model; this finite endpoint need not yet be a settled logic state.' : info.g === 1 ? 'Critical, nonhyperbolic stable midpoint; no bistable memory.' : 'One stable midpoint; no bistable memory.'}`);
      },
    },
  ],
};
