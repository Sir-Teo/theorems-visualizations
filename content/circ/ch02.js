// Circuits — Chapter 2: Kirchhoff’s laws and resistive networks (part a: 2.1–2.6)
//
// All component values are illustrative. Kirchhoff published the two laws in 1845 (Gustav Kirchhoff, then a student in Königsberg).
import { clamp, sI, z0, gauss, simpleCycles, circuitGraph, BR, bridgeParts, bridgeNodes } from './ch02.shared.js';

const NODE_TEX = { T: 'v_T', 1: 'v_1', 2: 'v_2', 0: '0\\ (\\text{ground})' };

export default {
  collection: 'circ',
  chapter: 2,
  title: 'Kirchhoff’s laws and resistive networks',
  summary: String.raw`Kirchhoff's two laws — the currents into a node sum to zero, the voltages around a loop sum to zero — are what the lumped matter discipline buys us. Combined with the element laws they turn any resistive network into a linear system of equations, solved systematically by node voltages or by mesh currents. Along the way come dividers, bridges and the delta–wye trick, and a bridge to combinatorics and probability: spanning trees count effective resistance, and node voltages are hitting probabilities of random walks.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Law',
      name: 'Kirchhoff’s current law',
      statement: String.raw`In a lumped circuit, at every node the algebraic sum of the currents of all branches attached to it is zero at every instant: $\sum_k i_k = 0$, where each $i_k$ is counted positive when it leaves the node (or each positive when it enters; the choice only has to be uniform). Equivalently, the current entering a node equals the current leaving it. The same holds for any closed surface that cuts a set of wires (a supernode): the currents entering the surface sum to zero.`,
      idea: String.raw`Each element is lumped (1.3): no charge accumulates inside it, so whatever charge flows into an element through one terminal leaves through the other, and all the charge that could accumulate is stored on the nodes. A node is a perfect conductor with negligible capacitance, so its charge cannot change by a finite amount while the currents are finite; conservation of charge (the continuity equation of electromagnetism, em-6.2) then forces the net current into it to vanish. If charge could escape along a path you have not counted, the sum would be nonzero, but then that path is itself a branch.`,
      caption: String.raw`The bridge circuit is solved live. Pick a node: the right panel shows every branch current at it as an arrow (green in, orange out, thickness $\propto|i|$) and the sum, which stays zero to rounding error whatever you do to $V_1$, $R_1$ or $R_5$. Switch on the stray path to open a branch the tally does not know about (a leakage path to ground, or a wire you forgot to draw): the metered currents no longer sum to zero, and the missing amount is exactly the stray current.`,
      scope: String.raw`Holds for lumped circuits (1.3). In a real device, charge can pile up on a node's stray capacitance, but that is a current in a capacitor branch (displacement current), so including it restores the law. At very high frequency the lumped model itself fails.`,
      credit: 'Gustav Kirchhoff, 1845',
      deps: ['circ-1.3', 'circ-1.10', 'em-6.2', 'em-6.8'],
      refs: ['Agarwal–Lang §2.2'],
      tags: ['kirchhoff', 'node'],
      viz(v) {
        const s = v.stage({ x: [-0.9, 7.2], y: [-0.7, 3.9], equal: true, axes: false, height: 330, weight: 1.2, title: 'the circuit' });
        const sn = v.stage({ x: [-5.6, 5.6], y: [-3.4, 3.4], equal: true, axes: false, height: 330, weight: 1, title: 'the node and its branch currents' });
        const variants = { none: v.circuit(s, bridgeParts()), T: v.circuit(s, bridgeParts(BR, 'T')), 1: v.circuit(s, bridgeParts(BR, '1')), 2: v.circuit(s, bridgeParts(BR, '2')) };
        const nodeSel = v.select('node', [{ value: 'T', label: '$v_T$' }, { value: '1', label: '$v_1$' }, { value: '2', label: '$v_2$' }, { value: '0', label: 'ground' }], '1');
        const V1 = v.slider('$V_1$', 1, 20, 10, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} V` });
        const R1 = v.slider('$R_1$', 100, 10e3, 1000, { log: true, sig: 2, fmt: (x) => sI(x, 'Ω', 2) });
        const R5 = v.slider('$R_5$', 100, 10e3, 1000, { log: true, sig: 2, fmt: (x) => sI(x, 'Ω', 2) });
        const leak = v.toggle('open a stray path from this node to ground', false);
        const RL = v.slider('stray $R$', 100, 5e3, 500, { log: true, sig: 2, fmt: (x) => sI(x, 'Ω', 2) });
        let info = null;
        const cur = () => (leak.value && nodeSel.value !== '0' ? variants[nodeSel.value] : variants.none);
        v.render(() => {
          const C = cur(), vals = { ...BR, V1: V1.value, R1: R1.value, R5: R5.value };
          for (const c of Object.values(variants)) { for (const k of Object.keys(vals)) c.part(k).value = vals[k]; if (c.part('RL')) c.part('RL').value = RL.value; }
          RL.el.hidden = !(leak.value && nodeSel.value !== '0');
          const res = C.dc(), nodes = bridgeNodes(C), N = nodes[nodeSel.value];
          C.draw({ result: res, vmax: V1.value });
          // branches at the node
          const into = (p) => { const t = C.net.termNode.get(p.id), i = res.I(p.id); return (t.b === N ? i : 0) - (t.a === N ? i : 0); };
          const inc = C.parts.filter((p) => (p.type === 'R' || p.type === 'V') && p.id !== 'RL').filter((p) => { const t = C.net.termNode.get(p.id); return t.a === N || t.b === N; });
          const rows = inc.map((p) => ({ name: p.name, i: z0(into(p), 1e-15) }));
          const stray = C.part('RL') && C.part('RL') !== undefined && leak.value && nodeSel.value !== '0' ? { name: 'stray', i: into(C.part('RL')) } : null;
          const imax = Math.max(1e-12, ...rows.map((r) => Math.abs(r.i)), stray ? Math.abs(stray.i) : 0);
          const R0 = 2.15, m = rows.length;
          rows.forEach((r, k) => {
            const th = (Math.PI / 2 + (2 * Math.PI * k) / Math.max(m, 1) + (m === 3 ? 0.3 : 0.5));
            const c = Math.cos(th), sn_ = Math.sin(th), ins = r.i > 0, col = ins ? 'green' : 'orange', w = 2 + 12 * Math.abs(r.i) / imax;
            if (ins) sn.arrow(R0 * c, R0 * sn_, 0.35 * c, 0.35 * sn_, { color: col, width: w, head: 10 + w * 0.5 });
            else sn.arrow(0.35 * c, 0.35 * sn_, R0 * c, R0 * sn_, { color: col, width: w, head: 10 + w * 0.5 });
            sn.text(`${r.name}: ${v.fix(Math.abs(r.i) * 1e3, 3)} mA ${ins ? 'in' : 'out'}`, 2.5 * c, 2.5 * sn_, { size: 12.5, color: 'ink', align: c > 0.3 ? 'left' : c < -0.3 ? 'right' : 'center', baseline: sn_ > 0.3 ? 'bottom' : sn_ < -0.3 ? 'top' : 'middle' });
          });
          if (stray) {
            const w = 2 + 12 * Math.abs(stray.i) / imax;
            sn.arrow(0, -0.35, 0, -2.0, { color: 'red', width: w, head: 10 + w * 0.5, dash: [6, 5] });
            sn.text(`stray: ${v.fix(stray.i * 1e3, 3)} mA (not metered)`, 0, -2.2, { size: 12.5, color: 'red', baseline: 'top' });
          }
          sn.dot(0, 0, { r: 8, color: 'ink' });
          const sum = rows.reduce((a, r) => a + r.i, 0);
          let all = 0;
          for (const nm of ['T', '1', '2', '0']) { const NN = nodes[nm]; let t = 0; for (const p of C.parts) if ((p.type === 'R' || p.type === 'V')) { const q = C.net.termNode.get(p.id); const i = res.I(p.id); t += (q.b === NN ? i : 0) - (q.a === NN ? i : 0); } all = Math.max(all, Math.abs(t)); }
          info = { sum, all, N, stray, res };
        });
        v.legend([['green', 'current into the node', { dot: true }], ['orange', 'current out of the node', { dot: true }], ['red', 'unmetered stray path', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { sum, all, stray } = info;
          const head = `Node $${NODE_TEX[nodeSel.value]}$: $\\sum i_{\\text{in}} = ${v.fix(z0(sum, 1e-9) * 1e3, 6)}$ mA over the ${stray ? 'metered' : ''} branches shown`;
          return stray ? `${head} — the tally is off by exactly the stray current ($${v.fix(stray.i * 1e3, 4)}$ mA): charge is not piling up, the sum just omits a branch.\nWith the stray path included the sum is $${v.fix(z0(sum + stray.i, 1e-9) * 1e3, 6)}$ mA.`
            : `${head}.\nAt all four nodes the largest $|\\sum i|$ is $${v.sci(all + 1e-20, 1)}$ A, rounding error of the solver.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Law',
      name: 'Kirchhoff’s voltage law',
      statement: String.raw`In a lumped circuit, the algebraic sum of the voltages across the branches around any closed loop is zero at every instant: walking around the loop and adding the voltage rise (or minus the drop) across each element gives $\sum_k v_k = 0$. Equivalently, the voltage between two nodes does not depend on the path taken through the circuit between them, so node voltages $v_n$ (measured from a ground node) exist and every branch voltage is $v_a - v_b$.`,
      idea: String.raw`The lumped matter discipline (1.3) says that no time-varying magnetic flux threads the loops formed by wiring elements together, so the circulation $\oint \mathbf E\cdot d\boldsymbol\ell$ around any loop vanishes by Faraday's law, and the electric field outside the elements is conservative (a potential exists, em-6.8). Each element's terminal voltage is the line integral of the field across it, so the branch voltages around the loop add up to the circulation, which is zero.`,
      caption: String.raw`Choose a loop of the live-solved bridge (the slider steps through all seven) and walk it in either direction. Each element's voltage is computed from its own law ($v = iR$ for resistors, the set value for the source), not from the node voltages, and the floating bars add them up as a staircase of potential: it always returns to its starting level. Then turn on a changing magnetic flux through the loop: the loop wires pick up an emf, the lumped assumption is violated and the staircase fails to close by exactly $\mathrm d\Phi/\mathrm dt$.`,
      scope: String.raw`Holds when no time-varying magnetic flux links the loop (lumped circuits, 1.3). Near transformers, motors or large loops at high frequency it fails by $-\mathrm d\Phi/\mathrm dt$ (Faraday).`,
      credit: 'Gustav Kirchhoff, 1845',
      deps: ['circ-1.3', 'circ-1.10', 'em-6.8'],
      refs: ['Agarwal–Lang §2.2'],
      tags: ['kirchhoff', 'loop'],
      viz(v) {
        const s = v.stage({ x: [-0.9, 5.9], y: [-0.7, 3.9], equal: true, axes: false, height: 330, weight: 1, title: 'the circuit and the loop' });
        const sp = v.stage({ x: [0, 5], y: [-12, 12], axes: 'box', gutter: true, height: 330, weight: 1.1, xlabel: 'walking around the loop', ylabel: 'potential relative to the start (V)', title: 'voltage rises and drops' });
        const C = v.circuit(s, bridgeParts());
        const g = circuitGraph(C, ['R', 'V']), idx = new Map(g.nodes.map((n, i) => [n, i]));
        const edges = g.edges.map((e) => ({ a: idx.get(e.a), b: idx.get(e.b), g: 1, id: e.id }));
        const cycles = simpleCycles(g.nodes.length, edges);
        const nm = bridgeNodes(C), lab = new Map(Object.entries(nm).map(([k, n]) => [n, k]));
        const L = v.slider('loop', 1, cycles.length, 1, { int: true });
        const dir = v.toggle('walk the other way', false);
        const R1 = v.slider('$R_1$', 100, 10e3, 1000, { log: true, sig: 2, fmt: (x) => sI(x, 'Ω', 2) });
        const R5 = v.slider('$R_5$', 100, 10e3, 1000, { log: true, sig: 2, fmt: (x) => sI(x, 'Ω', 2) });
        const flux = v.slider('$\\mathrm d\\Phi/\\mathrm dt$ through the loop', 0, 6, 0, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} V` });
        let info = null;
        v.render(() => {
          C.part('R1').value = R1.value; C.part('R5').value = R5.value;
          const res = C.dc(); C.draw({ result: res, vmax: 10 });
          const cy = cycles[L.value - 1], m = cy.edges.length;
          let nodesSeq = cy.nodes.map((i) => g.nodes[i]), eSeq = cy.edges.slice();
          if (dir.value) { nodesSeq = [nodesSeq[0], ...nodesSeq.slice(1).reverse()]; eSeq = eSeq.slice().reverse(); }
          const steps = []; let level = 0; const ticks = [];
          for (let k = 0; k < m; k++) {
            const e = edges[eSeq[k]], p = C.part(e.id), t = C.net.termNode.get(e.id), from = nodesSeq[k];
            const ve = p.type === 'V' ? p.value : p.value * res.I(p.id);              // v_a − v_b from the element's own law
            const rise = from === t.a ? -ve : ve;                                       // walking a→b changes potential by v_b − v_a
            steps.push({ id: e.id, name: p.name, from: level, to: level + rise, rise, p, fromA: from === t.a });
            level += rise;
          }
          const extra = flux.value ? -flux.value : 0;
          if (flux.value) { steps.push({ id: 'emf', name: 'wire emf', from: level, to: level + extra, rise: extra, emf: true }); level += extra; }
          for (const st of steps) if (!st.emf) {
            const q = st.p.at, [x0, y0, x1, y1] = st.fromA ? q : [q[2], q[3], q[0], q[1]], col = st.rise > 0 ? 'green' : 'orange';
            const f0 = 0.2, f1 = 0.8; s.arrow(x0 + (x1 - x0) * f0, y0 + (y1 - y0) * f0, x0 + (x1 - x0) * f1, y0 + (y1 - y0) * f1, { color: col, width: 5, alpha: 0.85, head: 12 });
          }
          const top = Math.max(2, ...steps.flatMap((q) => [Math.abs(q.from), Math.abs(q.to)])) * 1.25;
          sp.setView([0, steps.length + 0.3], [-top, top]);
          steps.forEach((q, k) => {
            ticks.push([k + 0.5, q.name]);
            const col = q.emf ? 'purple' : q.rise > 0 ? 'green' : 'orange';
            sp.rect(k + 0.12, Math.min(q.from, q.to), k + 0.88, Math.max(q.from, q.to), { fill: col, fillAlpha: 0.35, color: col, width: 1.5 });
            if (k) sp.line(k, q.from, k + 0.12, q.from, { color: 'muted', width: 1 });
            sp.text(`${q.rise > 0 ? '+' : '−'}${v.fix(Math.abs(q.rise), 2)}`, k + 0.5, Math.max(q.from, q.to), { size: 12, color: col, baseline: 'bottom', dy: -3, plate: true });
          });
          sp.setTicks(ticks, null);
          sp.hline(0, { color: 'muted', width: 1.2, dash: true });
          sp.dot(steps.length, level, { r: 6, color: Math.abs(level) < 1e-9 ? 'green' : 'red' });
          info = { steps, level, loopNodes: nodesSeq.map((n) => lab.get(n)) };
        });
        v.legend([['green', 'rise (source)'], ['orange', 'drop (resistor, $iR$)'], ['purple', 'induced emf in the wires']]);
        v.readout(() => {
          if (!info) return '';
          const parts = info.steps.map((q) => `${q.rise > 0 ? '+' : '−'}${v.fix(Math.abs(q.rise), 3)}`).join(' ');
          const ok = Math.abs(info.level) < 1e-9;
          return `Loop through ${info.loopNodes.map((n) => (n === '0' ? 'ground' : `$v_{${n === 'T' ? 'T' : n}}$`)).join(' → ')} → back.\n$\\sum v = ${parts.replace(/−/g, '-')} = ${v.fix(z0(info.level, 1e-9), 6)}$ V ${ok ? '— KVL holds.' : '— KVL fails: the loop is no longer lumped (Faraday term $-\\mathrm d\\Phi/\\mathrm dt$ present).'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Proposition',
      name: 'Series resistors and the voltage divider',
      statement: String.raw`Resistors carrying the same current are in series and are equivalent to a single resistor $R_{\text{eq}} = R_1 + R_2 + \cdots + R_n$. When a voltage $V$ is applied across a series chain, resistor $k$ takes the fraction $v_k = V\,R_k/R_{\text{eq}}$ (the **voltage divider**). A load $R_L$ connected across $R_2$ turns the divider output into $V_{\text{out}} = V\,\dfrac{R_2\parallel R_L}{R_1 + R_2\parallel R_L}$, which is the unloaded value $V R_2/(R_1+R_2)$ only when $R_L \gg R_2$.`,
      idea: String.raw`Because the resistors share one branch, KCL (2.1) gives them one current $i$. KVL (2.2) says the applied voltage is the sum of the drops $iR_k$ (Ohm's law, 1.4), so $V = i\,\sum R_k$. Dividing the drop of one resistor by the total gives the divider ratio. Connecting a load puts a branch in parallel with $R_2$, which lowers the bottom resistance and so the output, which is why dividers should be loaded lightly.`,
      caption: String.raw`A potentiometer of total resistance $R$ with its wiper at position $x$ feeds a load. Drag the dot on the graph (or the slider) to move the wiper: the unloaded output (dashed) is the straight line $V x$. Attach a load and the true output, read from the solver, sags below it along the curve; the sag grows as $R_L$ shrinks towards $R$ and below.`,
      scope: String.raw`Ideal linear resistors; the divider ratio is exact only for an unloaded (or ideally loaded, $R_L\to\infty$) output.`,
      deps: ['circ-2.2', 'circ-1.4'],
      refs: ['Agarwal–Lang §2.3', 'Horowitz–Hill §1.2'],
      tags: ['divider', 'series'],
      viz(v) {
        const V = 10, Rt = 10e3;
        const s = v.stage({ x: [-0.9, 4.9], y: [-0.7, 3.7], equal: true, axes: false, height: 310, weight: 1, title: 'a potentiometer driving a load' });
        const sp = v.stage({ x: [0, 1], y: [0, V], axes: 'box', gutter: true, height: 310, weight: 1.1, xlabel: 'wiper position $x$ (0 = ground, 1 = supply)', ylabel: '$v_{\\text{out}}$ (V)', xticks: [0, 0.25, 0.5, 0.75, 1] });
        const C = v.circuit(s, [
          { type: 'V', id: 'V1', name: 'V', value: V, at: [0, 3, 0, 0] }, { type: 'W', at: [0, 3, 2, 3] },
          { type: 'R', id: 'Rt', name: 'R(1−x)', value: 5000, at: [2, 3, 2, 1.5] }, { type: 'R', id: 'Rb', name: 'Rx', value: 5000, at: [2, 1.5, 2, 0], labelSide: -1 },
          { type: 'W', at: [2, 1.5, 4, 1.5] }, { type: 'R', id: 'RL', name: 'RL', value: 1e12, at: [4, 1.5, 4, 0] },
          { type: 'W', at: [0, 0, 4, 0] }, { type: 'GND', at: [1, 0] }, { type: 'label', at: [3, 1.5], text: '$v_{\\text{out}}$', dy: -10 },
        ]);
        const att = v.toggle('attach a load $R_L$', true);
        const RL = v.slider('$R_L$', 1e3, 1e6, 10e3, { log: true, sig: 2, fmt: (x) => sI(x, 'Ω', 2) });
        const loaded = (x, rl) => { const rb = Rt * x, rpar = rl >= 1e11 ? rb : rb * rl / (rb + rl); return V * rpar / (Rt * (1 - x) + rpar); };
        const h = sp.handle(0.5, loaded(0.5, 10e3), { color: 'accent', label: 'wiper', constrain: (x) => [clamp(x, 0.02, 0.98), loaded(clamp(x, 0.02, 0.98), att.value ? RL.value : 1e12)] });
        const xs = v.slider('wiper $x$', 0.02, 0.98, 0.5, { step: 0.01, onChange: (a) => h.set(a, loaded(a, att.value ? RL.value : 1e12)) });
        h.onDrag = () => xs.set(h.x);
        let info = null;
        v.render(() => {
          const rl = att.value ? RL.value : 1e12; RL.el.hidden = !att.value;
          const x = clamp(xs.value, 0.02, 0.98); h.set(x, loaded(x, rl));
          C.part('Rt').value = Rt * (1 - x); C.part('Rb').value = Rt * x; C.part('RL').value = rl;
          const res = C.dc(), nOut = C.net.termNode.get('Rb').a, vo = res.V(nOut);
          C.draw({ result: res, vmax: V });
          sp.line(0, 0, 1, V, { color: 'muted', width: 2, dash: true });
          sp.fn((t) => loaded(t, rl), { color: 'accent', width: 3, domain: [0, 1] });
          sp.line(x, 0, x, vo, { color: 'accent', width: 1, dash: true }); sp.line(0, vo, x, vo, { color: 'accent', width: 1, dash: true });
          sp.dot(x, V * x, { r: 5, color: 'muted', hollow: true });
          info = { vo, ideal: V * x, formula: loaded(x, rl), rl, i: res.I('Rt') };
        });
        v.legend([['muted', 'unloaded divider $Vx$', { dash: true }], ['accent', 'loaded output']]);
        v.readout(() => {
          if (!info) return '';
          const { vo, ideal, formula, rl, i } = info;
          return `Series chain: $R_1 + R_2 =$ ${sI(Rt, 'Ω', 3)} always; current in $R_1$: $${v.fix(i * 1e3, 4)}$ mA. Unloaded: $Vx = ${v.fix(ideal, 4)}$ V · measured: $v_{\\text{out}} = ${v.fix(vo, 4)}$ V · formula $V\\frac{R_2\\parallel R_L}{R_1+R_2\\parallel R_L} = ${v.fix(formula, 4)}$ V${rl < 1e11 ? ` · sag $= ${v.fix(ideal - vo, 4)}$ V (${v.fix(100 * (ideal - vo) / Math.max(ideal, 1e-9), 1)}%)` : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Proposition',
      name: 'Parallel resistors and the current divider',
      statement: String.raw`Resistors connected between the same two nodes share one voltage and are equivalent to one resistor whose **conductance** is the sum: $G_{\text{eq}} = G_1 + \cdots + G_n$ with $G_k = 1/R_k$, i.e. $\dfrac1{R_{\text{eq}}} = \sum_k \dfrac1{R_k}$. A total current $I$ entering the pair of nodes splits as $i_k = I\,G_k/G_{\text{eq}}$ (the **current divider**): the larger the conductance of a branch, the larger its share. For two resistors $R_{\text{eq}} = R_1R_2/(R_1+R_2)$, always smaller than the smaller of them.`,
      idea: String.raw`All the resistors sit between the same two nodes, so by KVL (2.2) they have the same voltage $v$. Ohm's law gives each branch current $i_k = G_k v$, and KCL (2.1) at the top node says the total is $I = \sum_k i_k = v\sum_k G_k$. So $v = I/G_{\text{eq}}$, and dividing $i_k$ by $I$ gives the share. Adding a branch can only add current capacity, so $R_{\text{eq}}$ falls.`,
      caption: String.raw`A current source $I_0 = 12$ mA feeds up to six parallel resistors; the width of each river is its current. Add resistors with the count slider and change their values: the shares follow the conductances (bottom panel: stacked conductances, widths $G_k$ add up to $G_{\text{eq}}$), and the equivalent resistance always lies below the smallest branch resistance.`,
      scope: String.raw`Linear resistors between exactly the same pair of nodes.`,
      deps: ['circ-2.1', 'circ-1.4'],
      refs: ['Agarwal–Lang §2.3'],
      tags: ['divider', 'parallel'],
      viz(v) {
        const I0 = 12e-3;
        const s = v.stage({ x: [-0.4, 10.4], y: [0, 7], axes: false, height: 330, full: true, title: 'the current splits in proportion to conductance' });
        const sg = v.stage({ x: [0, 14], y: [0, 3], axes: 'box', gutter: true, height: 190, weight: 1, xlabel: 'conductance $G_k$ (mS), stacked', full: true });
        const nn = v.slider('number of resistors', 1, 6, 3, { int: true });
        const defaults = [1000, 2200, 4700, 1500, 3300, 680];
        const Rs = defaults.map((d, k) => v.slider(`$R_${k + 1}$`, 100, 20e3, d, { log: true, sig: 2, fmt: (x) => sI(x, 'Ω', 2) }));
        const COL = ['accent', 'orange', 'green', 'purple', 'teal', 'pink'];
        let info = null;
        v.render(() => {
          const n = nn.value; Rs.forEach((r, k) => { r.el.hidden = k >= n; });
          const R = Rs.slice(0, n).map((r) => r.value), G = R.map((r) => 1 / r), Ge = G.reduce((a, b) => a + b, 0), Req = 1 / Ge, volt = I0 / Ge;
          const i = G.map((g) => g * volt);
          // independent check: the same network as a graph (two nodes, n parallel edges), solved by elimination
          const phi = (() => { const A = [[G.reduce((a, b) => a + b, 0)]]; const x = gauss(A, [I0]); return x[0]; })();
          const ys = Array.from({ length: n }, (_, k) => 6.2 - (k + 0.5) * (5.6 / n));
          const wmax = 22, ww = (k) => 2 + wmax * (i[k] / I0);
          s.line(1.6, 0.6, 1.6, 6.4, { color: 'ink', width: 5 }); s.line(8.4, 0.6, 8.4, 6.4, { color: 'ink', width: 5 });
          s.line(0.2, 3.5, 1.6, 3.5, { color: 'gold', width: 2 + wmax });
          s.line(8.4, 3.5, 9.8, 3.5, { color: 'gold', width: 2 + wmax });
          s.text('$I_0$', 0.9, 3.5, { size: 13, color: 'ink', dy: 28, baseline: 'top' });
          ys.forEach((y, k) => {
            s.line(1.6, y, 8.4, y, { color: COL[k], width: ww(k), alpha: 0.55 });
            s.rect(4.0, y - 0.17, 6.0, y + 0.17, { fill: 'panel', color: 'ink', width: 1.5, fillAlpha: 1 });
            s.text(`R${k + 1} = ${sI(R[k], 'Ω', 3)}`, 5, y, { size: 12, color: 'ink', baseline: 'middle', align: 'center' });
            s.text(`${v.fix(i[k] * 1e3, 3)} mA`, 7.2, y + 0.43 * (5.6 / n > 1.2 ? 0.6 : 0.25), { size: 12, color: COL[k], baseline: 'bottom', plate: true });
          });
          let acc = 0; G.forEach((g, k) => { const gm = g * 1e3; sg.rect(acc, 0.6, acc + gm, 1.6, { fill: COL[k], fillAlpha: 0.45, color: COL[k], width: 1.5 }); if (gm > Ge * 1e3 * 0.07) sg.text(`$G_${k + 1}$`, acc + gm / 2, 1.1, { size: 12, color: 'ink' }); acc += gm; });
          sg.setView([0, Math.max(2, Ge * 1e3 * 1.08)], [0, 3]);
          sg.rect(0, 1.9, Ge * 1e3, 2.5, { fill: 'ink', fillAlpha: 0.15, color: 'ink', width: 2 });
          sg.text(`$G_{\\text{eq}}$ = ${v.fix(Ge * 1e3, 3)} mS  ($R_{\\text{eq}}$ = ${sI(Req, 'Ω', 3)})`, Ge * 1e3 / 2, 2.2, { size: 12.5, color: 'ink' });
          info = { Req, volt, Rmin: Math.min(...R), sum: i.reduce((a, b) => a + b, 0), phi, n };
        });
        v.readout(() => {
          if (!info) return '';
          const { Req, volt, Rmin, sum, phi, n } = info;
          return `$n = ${n}$ branches share $v = ${v.fix(volt, 4)}$ V (solved independently: ${v.fix(phi, 4)} V); $\\sum i_k = ${v.fix(sum * 1e3, 5)}$ mA $= I_0$.\n$R_{\\text{eq}} =$ ${sI(Req, 'Ω', 4)} $<$ smallest branch ${sI(Rmin, 'Ω', 4)} — adding a branch can only lower the resistance.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5',
      kind: 'Method',
      name: 'Node-voltage analysis',
      statement: String.raw`Choose a ground node and give each remaining node $k$ an unknown voltage $v_k$. Writing KCL at each node with every resistor current expressed through Ohm's law, $i = (v_a - v_b)/R$, gives one linear equation per unknown node: $\mathbf G\mathbf v = \mathbf i$. Here $G_{kk}$ is the sum of the conductances touching node $k$, $G_{kj}$ ($j\ne k$) is minus the conductance between $k$ and $j$, and $i_k$ is the net source current injected into node $k$ (a grounded voltage source simply fixes a node voltage, and its known value moves to the right-hand side). The method works for any resistive network with independent sources and has a unique solution (2.9).`,
      idea: String.raw`KCL (2.1) supplies the equations and Ohm's law (1.4) removes the branch currents from them, leaving only node voltages. KVL (2.2) is already built in, because describing every branch voltage as a difference of node voltages makes any loop sum telescope to zero. The result is a linear system with a symmetric matrix, solved by elimination (pma-9.36 for the linear algebra).`,
      caption: String.raw`Pick a circuit and change its elements: the node equations $\mathbf G\mathbf v = \mathbf i$ are re-assembled below and solved by elimination (bars); the dots are the voltages found by the circuit simulator, and the wires of the schematic are coloured by the same node voltages. Read each row of the matrix off the schematic: diagonal entries add up the conductances at a node, off-diagonals are minus the conductance between two nodes.`,
      scope: String.raw`Linear resistive networks with independent sources; voltage sources not tied to ground need a supernode or modified nodal analysis.`,
      deps: ['circ-2.1', 'circ-1.4', 'pma-9.36'],
      refs: ['Agarwal–Lang §3.3'],
      tags: ['method', 'nodal'],
      viz(v) {
        const s = v.stage({ x: [-1.7, 7.7], y: [-0.7, 3.9], equal: true, axes: false, height: 330, weight: 1.15, title: 'the circuit (wires coloured by node voltage)' });
        const sb = v.stage({ x: [0.3, 3.7], y: [-1, 1], axes: 'box', gutter: true, height: 330, weight: 0.85, xlabel: 'node', ylabel: 'voltage (V)', title: 'the solution $\\mathbf v = \\mathbf G^{-1}\\mathbf i$' });
        const ladder = v.circuit(s, [
          { type: 'I', id: 'I1', name: 'I1', value: 4e-3, at: [0, 0, 0, 3] }, { type: 'W', at: [0, 3, 2, 3] },
          { type: 'R', id: 'Ra', name: 'Ra', value: 1000, at: [2, 3, 4.2, 3] }, { type: 'R', id: 'Rb', name: 'Rb', value: 2000, at: [4.2, 3, 6.4, 3] },
          { type: 'R', id: 'G1', name: 'R1', value: 2000, at: [2, 3, 2, 0] }, { type: 'R', id: 'G2', name: 'R2', value: 1000, at: [4.2, 3, 4.2, 0] },
          { type: 'I', id: 'I2', name: 'I2', value: 2e-3, at: [6.4, 3, 6.4, 0] }, { type: 'W', at: [0, 0, 6.4, 0] }, { type: 'GND', at: [3.2, 0] },
          { type: 'label', at: [2, 3], text: '$v_1$', dx: -8, dy: -9 }, { type: 'label', at: [4.2, 3], text: '$v_2$', dy: -11 }, { type: 'label', at: [6.4, 3], text: '$v_3$', dx: 8, dy: -9 },
        ]);
        const bridge = v.circuit(s, bridgeParts());
        const sel = v.select('circuit', [{ value: 'ladder', label: 'ladder with two current sources' }, { value: 'bridge', label: 'bridge with a voltage source' }], 'ladder');
        const sA = v.slider('$R_a$', 200, 10e3, 1000, { log: true, sig: 2, fmt: (x) => sI(x, 'Ω', 2) });
        const sB = v.slider('$R_b$', 200, 10e3, 2000, { log: true, sig: 2, fmt: (x) => sI(x, 'Ω', 2) });
        const sI1 = v.slider('$I_1$', -8, 8, 4, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} mA` });
        const sI2 = v.slider('$I_2$', -8, 8, 2, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} mA` });
        const sV = v.slider('$V_1$', 1, 20, 10, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} V` });
        const sR5 = v.slider('$R_5$', 100, 10e3, 1000, { log: true, sig: 2, fmt: (x) => sI(x, 'Ω', 2) });
        const SPEC = { ladder: { n1: ['Ra', 'a', 'v_1'], n2: ['Ra', 'b', 'v_2'], n3: ['Rb', 'b', 'v_3'] }, bridge: { T: ['R1', 'a', 'v_T'], n1: ['R1', 'b', 'v_1'], n2: ['R2', 'b', 'v_2'] } };
        // assemble G v = i for the unknown nodes of a v.circuit (resistors, current sources, voltage sources with one end on ground)
        const assemble = (C, spec) => {
          const g = circuitGraph(C, ['R', 'I', 'V']), gnd = C.net.ground, fixed = new Map([[gnd, 0]]);
          for (const e of g.edges) if (e.type === 'V') { const p = C.part(e.id); if (e.b === gnd) fixed.set(e.a, p.value); else if (e.a === gnd) fixed.set(e.b, -p.value); }
          const names = Object.values(spec).map(([id, pin, tex]) => ({ net: C.net.termNode.get(id)[pin], tex })).filter((q) => !fixed.has(q.net));
          const pos = new Map(names.map((q, k) => [q.net, k])), n = names.length;
          const G = Array.from({ length: n }, () => new Array(n).fill(0)), b = new Array(n).fill(0);
          for (const e of g.edges) {
            const p = C.part(e.id);
            if (e.type === 'R') { const c = 1 / p.value; for (const [x, y] of [[e.a, e.b], [e.b, e.a]]) if (pos.has(x)) { G[pos.get(x)][pos.get(x)] += c; if (pos.has(y)) G[pos.get(x)][pos.get(y)] -= c; else b[pos.get(x)] += c * fixed.get(y); } }
            else if (e.type === 'I') { if (pos.has(e.b)) b[pos.get(e.b)] += p.value; if (pos.has(e.a)) b[pos.get(e.a)] -= p.value; }
          }
          return { names, G, b, x: gauss(G, b), fixed };
        };
        let info = null;
        v.render(() => {
          const isL = sel.value === 'ladder', C = isL ? ladder : bridge, spec = SPEC[sel.value];
          [sA, sB, sI1, sI2].forEach((c) => { c.el.hidden = !isL; }); [sV, sR5].forEach((c) => { c.el.hidden = isL; });
          if (isL) { C.part('Ra').value = sA.value; C.part('Rb').value = sB.value; C.part('I1').value = sI1.value * 1e-3; C.part('I2').value = sI2.value * 1e-3; }
          else { C.part('V1').value = sV.value; C.part('R5').value = sR5.value; }
          const res = C.dc(), A = assemble(C, spec);
          const n = A.names.length, vv = A.x || new Array(n).fill(NaN);
          const vals = [...vv, ...[...A.fixed.entries()].filter(([k, x]) => k !== C.net.ground).map(([, x]) => x)];
          const vmax = Math.max(1, ...vv.map(Math.abs), ...[...A.fixed.values()].map(Math.abs)) * 1.15;
          C.draw({ result: res, vmax });
          const cols = Object.values(spec).map(([id, pin, tex]) => ({ net: C.net.termNode.get(id)[pin], tex })), K = cols.length;
          sb.setView([0.3, K + 0.7], [Math.min(0, ...vals) * 1.4 - 0.6, vmax * 1.1]);
          cols.forEach((c, k) => {
            const sol = A.fixed.has(c.net) ? A.fixed.get(c.net) : vv[A.names.findIndex((q) => q.net === c.net)], sim = res.V(c.net);
            sb.rect(k + 1 - 0.28, 0, k + 1 + 0.28, sol, { fill: A.fixed.has(c.net) ? 'gold' : 'accent', fillAlpha: 0.4, color: A.fixed.has(c.net) ? 'gold' : 'accent', width: 1.5 });
            sb.dot(k + 1, sim, { r: 5.5, color: 'ink', hollow: true });
            sb.text(`$${c.tex}$ = ${v.fix(sol, 2)}`, k + 1, sol, { size: 12, color: 'ink', baseline: sol >= 0 ? 'bottom' : 'top', dy: sol >= 0 ? -6 : 6, plate: true });
          });
          sb.setTicks(cols.map((c, k) => [k + 1, c.tex.replace('v_', 'v')]), null);
          let err = 0; cols.forEach((c) => { const sol = A.fixed.has(c.net) ? A.fixed.get(c.net) : vv[A.names.findIndex((q) => q.net === c.net)]; err = Math.max(err, Math.abs(sol - res.V(c.net))); });
          info = { A, err, isL };
        });
        v.legend([['accent', 'solved by $\\mathbf G\\mathbf v=\\mathbf i$'], ['ink', 'circuit simulator', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { A, err } = info;
          const f = (x) => v.fix(z0(x * 1e3, 1e-9), 2).replace(/^-/, '−');
          const rows = A.G.map((r) => r.map(f).join(' & ')).join(' \\\\ ');
          const vec = (a, fn) => `\\begin{bmatrix}${a.map(fn).join(' \\\\ ')}\\end{bmatrix}`;
          return `$$\\underbrace{\\begin{bmatrix}${rows}\\end{bmatrix}}_{\\mathbf G\\ (\\mathrm{mS})}${vec(A.names, (q) => q.tex)} = ${vec(A.b, (x) => f(x))}\\ \\mathrm{mA}$$ Largest difference from the simulator's node voltages: $${v.sci(err + 1e-18, 1)}$ V.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.6
    {
      num: '2.6',
      kind: 'Method',
      name: 'Mesh-current analysis',
      statement: String.raw`For a planar circuit, imagine a current $I_m$ circulating (say clockwise) around each mesh, i.e. each window of the drawing. The current in a branch is then the sum of the mesh currents through it, with a plus sign when they agree with the branch reference direction: an outer branch carries one mesh current, a shared branch the difference of its two neighbours. Writing KVL around each mesh with Ohm's law gives $\mathbf Z\mathbf I = \mathbf e$: $Z_{mm}$ is the total resistance around mesh $m$, $Z_{mk}$ ($k\ne m$) minus the resistance shared by meshes $m$ and $k$ (for uniformly oriented meshes), and $e_m$ the net source voltage rise around mesh $m$.`,
      idea: String.raw`KCL is satisfied automatically, because a circulating current enters and leaves every node it passes through: it is a loop of the cycle space, and the meshes of a planar graph form a basis for it (2.7). Only KVL remains to be imposed, one equation per mesh, with Ohm's law (1.4) turning branch voltages into resistance times mesh currents. This is the dual of node-voltage analysis (2.5) and needs $b-n+1$ unknowns instead of $n-1$.`,
      caption: String.raw`Three meshes of the bridge circuit, each with its circulating current drawn as a loop of arrows (it turns faster and thickens with $|I_m|$, and reverses when negative). The branch currents are the sums of the mesh currents (table in the readout) and agree with the node-voltage solution found independently by the circuit simulator. Change $V_1$, $R_5$ or $R_1$: the mesh $\mathbf Z$ matrix is rebuilt each time.`,
      scope: String.raw`Planar circuits (current sources between two meshes need a supermesh). For non-planar circuits use a chosen set of fundamental loops instead of windows.`,
      deps: ['circ-2.2', 'circ-1.4'],
      refs: ['Agarwal–Lang §3.4'],
      tags: ['method', 'mesh'],
      viz(v) {
        const s = v.stage({ x: [-0.9, 5.9], y: [-0.7, 3.9], equal: true, axes: false, height: 350, weight: 1.15, title: 'mesh currents (clockwise positive)' });
        const C = v.circuit(s, bridgeParts());
        // meshes, clockwise: element sign = +1 when the clockwise walk follows the element's a→b reference direction
        const MESH = [
          { name: 'A', c: [1, 1.5], els: [['V1', -1], ['R1', 1], ['R3', 1]] },
          { name: 'B', c: [3.5, 2.5], els: [['R1', -1], ['R2', 1], ['R5', -1]] },
          { name: 'C', c: [3.5, 0.75], els: [['R5', 1], ['R4', 1], ['R3', -1]] },
        ];
        const V1 = v.slider('$V_1$', -20, 20, 10, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} V` });
        const R1 = v.slider('$R_1$', 100, 10e3, 1000, { log: true, sig: 2, fmt: (x) => sI(x, 'Ω', 2) });
        const R5 = v.slider('$R_5$', 100, 10e3, 1000, { log: true, sig: 2, fmt: (x) => sI(x, 'Ω', 2) });
        let info = null;
        const arc = (cx, cy, I, imax, t) => {
          const col = I >= 0 ? 'accent' : 'orange', w = 2 + 5 * Math.abs(I) / imax, r = 0.4;
          const ph = -t * Math.sign(I) * Math.min(3, 0.6 + 4 * Math.abs(I) / imax) * (Math.abs(I) > 1e-9 ? 1 : 0), sweep = 1.65 * Math.PI;
          const th = (u) => Math.PI / 2 + ph - u * sweep * Math.sign(I || 1);
          s.curve((u) => [cx + r * Math.cos(th(u)), cy + r * Math.sin(th(u))], 0, 1, { color: col, width: w, n: 60 });
          const e = th(1), d = Math.sign(I || 1), tx = d * Math.sin(e), ty = -d * Math.cos(e);   // tangent direction of travel at the end
          const e0 = th(0.9); s.arrow(cx + r * Math.cos(e0), cy + r * Math.sin(e0), cx + r * Math.cos(e) + tx * 0.05, cy + r * Math.sin(e) + ty * 0.05, { color: col, width: w, head: 13 });
        };
        v.animate((t) => {
          C.part('V1').value = V1.value; C.part('R1').value = R1.value; C.part('R5').value = R5.value;
          const m = MESH.length, Z = Array.from({ length: m }, () => new Array(m).fill(0)), e = new Array(m).fill(0);
          MESH.forEach((M, a) => MESH.forEach((N, b) => { for (const [id, sa] of M.els) for (const [id2, sb] of N.els) if (id === id2 && C.part(id).type === 'R') Z[a][b] += sa * sb * C.part(id).value; }));
          MESH.forEach((M, a) => { for (const [id, sa] of M.els) if (C.part(id).type === 'V') e[a] -= sa * C.part(id).value; });
          const I = gauss(Z, e), res = C.dc();
          const branch = {}; for (const id of ['V1', 'R1', 'R2', 'R3', 'R4', 'R5']) { branch[id] = 0; MESH.forEach((M, a) => { for (const [id2, sa] of M.els) if (id2 === id) branch[id] += sa * I[a]; }); }
          const imax = Math.max(1e-9, ...I.map(Math.abs));
          C.draw({ result: res, vmax: Math.max(5, Math.abs(V1.value)), t });
          MESH.forEach((M, a) => { arc(M.c[0], M.c[1], I[a], imax, t); s.text(`$I_${M.name}$`, M.c[0], M.c[1], { size: 14, color: I[a] >= 0 ? 'accent' : 'orange' }); });
          let err = 0; for (const id of Object.keys(branch)) err = Math.max(err, Math.abs(branch[id] - res.I(id)));
          info = { Z, e, I, branch, err };
        }, { period: 8, still: 0.9 });
        v.readout(() => {
          if (!info) return '';
          const { Z, e, I, branch, err } = info, f = (x) => v.fix(z0(x / 1e3, 1e-9), 2).replace(/^-/, '−');
          const mat = Z.map((r) => r.map(f).join(' & ')).join(' \\\\ ');
          return `$$\\begin{bmatrix}${mat}\\end{bmatrix}_{\\mathrm{k}\\Omega}\\begin{bmatrix}I_A\\\\I_B\\\\I_C\\end{bmatrix} = \\begin{bmatrix}${e.map((x) => v.fix(x, 1)).join(' \\\\ ')}\\end{bmatrix}_{\\mathrm V}\\ \\Rightarrow\\ I = (${I.map((x) => v.fix(x * 1e3, 3)).join(',\\ ')})\\ \\mathrm{mA}$$Branch currents $=$ sums of mesh currents: $i_{R_1} = I_A - I_B = ${v.fix(branch.R1 * 1e3, 3)}$ mA, $i_{R_3} = I_A - I_C = ${v.fix(branch.R3 * 1e3, 3)}$ mA, $i_{R_5} = I_C - I_B = ${v.fix(branch.R5 * 1e3, 3)}$ mA; largest disagreement with the node-voltage solution: $${v.sci(err + 1e-18, 1)}$ A.`;
        });
      },
    },
  ],
};
