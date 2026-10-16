// Circuits — Chapter 1: The circuit abstraction
//
// Sources checked (Oct 2026): Ohm, Die galvanische Kette, mathematisch bearbeitet (Berlin, 1827); Joule, "On the production of
// heat by voltaic electricity" (communicated to the Royal Society Dec 1840, Proc. R. Soc. 1841). Material constants are the usual
// 20 °C textbook values (HyperPhysics resistivity table: Cu 1.68, Al 2.65, Fe 9.71 ×10⁻⁸ Ω·m, nichrome ≈ 100 ×10⁻⁸ Ω·m;
// tungsten 5.6 ×10⁻⁸ Ω·m with temperature coefficient 0.0045 /K; copper electron density 8.5 ×10²⁸ m⁻³, a standard
// free-electron-model value). Speed of light 299 792 458 m/s (SI definition); cable velocity factor ≈ 0.66 is typical of solid
// polyethylene coax. Kirchhoff's circuit laws date from 1845–47 (quoted from memory). Component values in the pictures
// (batteries, lamps, stray fields) are illustrative.

import { TAU, clamp, sI, z0, makeLamp, barSolve } from './ch01.shared.js';

export default {
  collection: 'circ',
  chapter: 1,
  title: 'The circuit abstraction',
  summary: String.raw`A circuit is a deliberately simplified picture of electromagnetism: if we promise that no magnetic flux leaks between elements and no charge piles up inside them, every element can be described by a single voltage across it and a single current through it. This chapter sets up that bargain — the lumped matter discipline — along with the bookkeeping of power, the resistor and Ohm's law, and the ideal and real sources that drive circuits. It ends by seeing a circuit as a graph, the shape that all later network theorems exploit.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Charge, current and voltage',
      statement: String.raw`**Current** through a cross-section of a conductor is the rate at which charge crosses it, $i = dq/dt$ (amperes = coulombs per second), counted positive in the direction positive charge would move. **Voltage** between two points $A$ and $B$ is the work per unit charge needed to carry a small test charge from $A$ to $B$ against the electric field, $v_{AB} = \varphi(A) - \varphi(B) = \int_A^B \mathbf E\cdot d\boldsymbol\ell$ (with the sign convention that a positive $v_{AB}$ means $A$ is at the higher potential). When the field is electrostatic ($\nabla\times\mathbf E = 0$) this number depends only on $A$ and $B$, not on the path; that is what lets a circuit talk about "the voltage between two nodes".`,
      idea: String.raw`Current is conservation of charge made quantitative (em-1.2): count what passes a surface. Voltage is the potential difference of em-2.3, a line integral of $\mathbf E$ that is path-independent exactly when the field is curl-free. Inside a wire the carriers drift only slowly, but the pattern of potential and of current is set up at almost the speed of light, so a circuit speaks of $i$ and $v$ rather than of individual carriers.`,
      caption: String.raw`Left: electrons (blue dots, each standing for one coulomb to keep the counting visible) drift left, so the conventional current $I$ points right; the tally counts the coulombs that have crossed the dashed cross-section. Right: potential of three point charges (red high, blue low). Drag $A$, $B$ and the bend $C$: the work per coulomb along $A\to C\to B$ and along the straight path agree with $\varphi(A)-\varphi(B)$. Then turn on the swirl (a changing magnetic flux through the middle) and the two paths disagree — the voltage between two points stops being well defined.`,
      deps: ['em-1.2', 'em-2.3', 'em-6.1'],
      refs: ['Agarwal–Lang §1.2', 'Horowitz–Hill §1.2'],
      tags: ['current', 'voltage'],
      viz(v) {
        const wire = v.stage({ x: [0, 12], y: [-2.3, 2.3], height: 300, axes: false, weight: 1, title: 'current: counting charge through a cross-section' });
        const pot = v.stage({ x: [-3.4, 3.4], y: [-2.3, 2.3], equal: true, axes: false, height: 300, weight: 1.15, title: 'voltage: work per unit charge' });
        const I = v.slider('current $I$ (A)', 0.2, 3, 1, { step: 0.05 });
        const area = v.select('copper wire', [{ value: 0.5, label: '0.5 mm²' }, { value: 1, label: '1 mm²' }, { value: 2.5, label: '2.5 mm²' }], 1);
        const gam = v.slider('swirl $\\Gamma$ (V)', 0, 6, 0, { step: 0.1 });
        // ---- carriers
        const r = v.rng(7), NC = 12, LW = 12, XC = 6;
        const car = Array.from({ length: NC }, (_, k) => ({ x0: k + 0.5 + (r() - 0.5) * 0.7, y: (r() - 0.5) * 1.5 }));
        // ---- potential of three point charges (nC, metres) and an optional non-conservative swirl
        const Qs = [[-1.6, 0.4, 1], [1.6, -0.4, -1], [0, 1.5, 0.5]], K = 8.988, e2 = 0.04, a2 = 0.25;
        const phi = (x, y) => Qs.reduce((s, [qx, qy, q]) => s + K * q / Math.sqrt((x - qx) ** 2 + (y - qy) ** 2 + e2), 0);
        const E = (x, y) => {
          let ex = 0, ey = 0;
          for (const [qx, qy, q] of Qs) { const dx = x - qx, dy = y - qy, r3 = Math.pow(dx * dx + dy * dy + e2, 1.5); ex += K * q * dx / r3; ey += K * q * dy / r3; }
          const G = gam.value / TAU, dx = x, dy = y + 0.2, d2 = dx * dx + dy * dy + a2;
          return [ex - G * dy / d2, ey + G * dx / d2];
        };
        const A = pot.handle(-2.5, -1.2, { color: 'accent', label: 'A', labelPos: 'sw' });
        const B = pot.handle(2.4, 1.3, { color: 'accent', label: 'B', labelPos: 'ne' });
        const Cc = pot.handle(0.1, -1.7, { color: 'orange', label: 'C', labelPos: 's' });
        const seg = (p, q) => v.M.integrate((u) => { const x = p[0] + u * (q[0] - p[0]), y = p[1] + u * (q[1] - p[1]), e = E(x, y); return e[0] * (q[0] - p[0]) + e[1] * (q[1] - p[1]); }, 0, 1, 160);
        v.animate((t) => {
          // wire
          const T = t, Iv = I.value;
          wire.rect(0, -1.1, LW, 1.1, { fill: 'orange', fillAlpha: 0.12, color: 'orange', radius: 8 });
          wire.vline(XC, { color: 'gold', width: 2, dash: [5, 4] });
          let cnt = 0;
          for (const c of car) {
            const a = (c.x0 - XC) / LW, b = (c.x0 - Iv * T - XC) / LW; cnt += Math.floor(a) - Math.floor(b);
            const px = (((c.x0 - Iv * T) % LW) + LW) % LW;
            wire.dot(px, c.y * 0.9, { r: 5.5, color: 'blue' });
          }
          wire.arrow(1.2, 1.75, 4.2, 1.75, { color: 'ink', width: 2.2, head: 9 });
          wire.text('conventional current $I$', 4.5, 1.75, { size: 12.5, color: 'ink', align: 'left', baseline: 'middle' });
          wire.text('cross-section', XC, -1.35, { size: 12, color: 'muted', align: 'center', baseline: 'top' });
          wire.text(`passed so far: ${cnt} C  in  ${v.fix(T, 1)} s`, 0.3, -1.95, { size: 12.5, color: 'ink', align: 'left', baseline: 'middle', plate: true });
          // potential map
          pot.heat(phi, { range: [-14, 14], cmap: 'diverging', key: 'phi1', res: 150 });
          pot.contour(phi, [-12, -9, -6, -3, 0, 3, 6, 9, 12], { color: 'ink', width: 0.8, alpha: 0.35 });
          for (const [qx, qy, q] of Qs) pot.dot(qx, qy, { r: 7, color: q > 0 ? 'orange' : 'blue', label: q > 0 ? `+${q} nC` : `${q} nC`, labelPos: 'n' });
          if (gam.value > 0) { pot.circle(0, -0.2, 0.5, { color: 'purple', width: 1.6, dash: true }); pot.text('changing flux', 0, -0.9, { size: 11.5, color: 'purple', align: 'center', plate: true }); }
          const P1 = [[A.x, A.y], [Cc.x, Cc.y], [B.x, B.y]];
          pot.path(P1, { color: 'orange', width: 2.4 });
          pot.segment([A.x, A.y], [B.x, B.y], { color: 'green', width: 2.2, dash: [6, 4] });
          // moving test charge along A→C→B with the work accumulated
          const L1 = Math.hypot(Cc.x - A.x, Cc.y - A.y), L2 = Math.hypot(B.x - Cc.x, B.y - Cc.y), u = ((t % 6) / 6) * (L1 + L2);
          const p = u < L1 ? [A.x + (Cc.x - A.x) * u / L1, A.y + (Cc.y - A.y) * u / L1] : [Cc.x + (B.x - Cc.x) * (u - L1) / L2, Cc.y + (B.y - Cc.y) * (u - L1) / L2];
          pot.dot(p[0], p[1], { r: 6, color: 'gold' });
        }, { period: 6, still: 2.5 });
        v.legend([['blue', 'electrons (drift left)'], ['orange', 'path $A\\to C\\to B$'], ['green', 'straight path', { dash: true }], ['gold', 'test charge']]);
        v.readout(() => {
          const w1 = seg([A.x, A.y], [Cc.x, Cc.y]) + seg([Cc.x, Cc.y], [B.x, B.y]), w2 = seg([A.x, A.y], [B.x, B.y]), dphi = phi(A.x, A.y) - phi(B.x, B.y);
          const vd = I.value * 1e-6 === 0 ? 0 : I.value / (8.5e28 * v.M.CONST.e * area.value * 1e-6);
          return `**Current:** $I = ${v.fix(I.value, 2)}$ A means ${v.fix(I.value, 2)} C per second; in a ${area.value} mm² copper wire the carriers drift at only $v_d = I/(neA) = ${v.fix(vd * 1e3, 3)}$ mm/s (free-electron density $n = 8.5\\times10^{28}\\,\\mathrm{m^{-3}}$).\n**Voltage:** $\\int_{A\\to C\\to B}\\mathbf E\\cdot d\\boldsymbol\\ell = ${v.fix(w1, 4)}$ V · straight path $${v.fix(w2, 4)}$ V · $\\varphi(A)-\\varphi(B) = ${v.fix(dphi, 4)}$ V · path dependence $${v.fix(w1 - w2, 4)}$ V ${gam.value > 0 ? '(the swirl field is not a gradient: the difference is the swirl voltage times the angle swept)' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'Power and the passive sign convention',
      statement: String.raw`When a current $i$ enters an element through the terminal marked $+$ of its voltage $v$ (the **passive sign convention**), the product $p = vi$ is the power the element **absorbs** from the rest of the circuit: $p>0$ absorbing, $p<0$ delivering. Reversing only one of the two reference arrows flips the sign of $p$ — so the convention must always be stated — while reversing both leaves it unchanged. In any lumped circuit the powers of all elements sum to zero at every instant, $\sum_k v_k i_k = 0$.`,
      idea: String.raw`Voltage is energy per charge and current is charge per time, so $vi$ is energy per time (1.1). Which way the energy flows depends on whether charge moves from high to low potential through the element (it gives energy up: absorbed) or from low to high (it is lifted: delivered). The reference arrows are only labels; the physical flow of energy is independent of them. The sum rule is energy conservation for the whole circuit and will return as Tellegen's theorem (3.6).`,
      caption: String.raw`Two batteries oppose each other through a resistor. Raise $V_2$ above $V_1$: the current reverses and $V_1$ goes from delivering to being charged — the bar flips colour while the circuit looks the same. Reverse the current reference arrow of any element with the switches: its bar flips sign (the number $vi$ changes sign) but the physical statement "absorbs/delivers" printed below does not.`,
      deps: ['circ-1.1'],
      refs: ['Agarwal–Lang §1.2'],
      tags: ['power', 'sign convention'],
      viz(v) {
        const s = v.stage({ x: [-1.7, 6.5], y: [-1, 4.2], equal: true, height: 290, axes: false, weight: 1.1 });
        const sp = v.stage({ x: [0.4, 3.6], y: [-1, 1], axes: 'box', gutter: true, height: 290, weight: 0.9, xticks: [[1, 'V₁'], [2, 'R'], [3, 'V₂']], ylabel: 'p = v·i (W)', title: 'power with the chosen arrows' });
        const C = v.circuit(s, [
          { type: 'V', id: 'V1', name: 'V1', value: 12, at: [0, 3, 0, 0] },
          { type: 'W', at: [0, 3, 1.2, 3] }, { type: 'R', id: 'R', value: 6, at: [1.2, 3, 3.8, 3] }, { type: 'W', at: [3.8, 3, 5, 3] },
          { type: 'V', id: 'V2', name: 'V2', value: 6, at: [5, 3, 5, 0] },
          { type: 'W', at: [5, 0, 0, 0] }, { type: 'GND', at: [2.5, 0] },
        ]);
        C.control('V1', '$V_1$', 0, 24, { log: false, step: 0.1 });
        C.control('V2', '$V_2$', 0, 24, { log: false, step: 0.1 });
        C.control('R', '$R$', 1, 50);
        const fl = { V1: v.toggle('reverse the current arrow of $V_1$', false), R: v.toggle('reverse the current arrow of $R$', false), V2: v.toggle('reverse the current arrow of $V_2$', false) };
        const IDS = ['V1', 'R', 'V2'];
        const info = (res) => IDS.map((id) => {
          const m = C.net.termNode.get(id), vab = res.V(m.a) - res.V(m.b), iab = res.I(id), f = fl[id].value;
          const iref = f ? -iab : iab, pref = vab * iref, phys = vab * iab;
          return { id, vab, iab, f, iref, pref, phys };
        });
        v.render(() => {
          const res = C.draw({ result: C.dc(), vmax: 24 }), inf = info(res);
          // reference arrows drawn on the inner side of each element: default = into the + terminal (top)
          const arrows = { V1: [0.62, 2.3, 0.62, 0.7], R: [1.8, 2.5, 3.2, 2.5], V2: [4.38, 2.3, 4.38, 0.7] };
          for (const e of inf) {
            const [x0, y0, x1, y1] = arrows[e.id], col = e.f ? 'orange' : 'accent';
            if (e.f) s.arrow(x1, y1, x0, y0, { color: col, width: 2, head: 8 }); else s.arrow(x0, y0, x1, y1, { color: col, width: 2, head: 8 });
            s.text(e.f ? 'i (reversed)' : 'i', (x0 + x1) / 2 + (e.id === 'R' ? 0 : e.id === 'V1' ? 0.1 : -0.1), (y0 + y1) / 2 + (e.id === 'R' ? -0.3 : 0), { size: 12, color: col, align: e.id === 'V1' ? 'left' : e.id === 'V2' ? 'right' : 'center', baseline: 'middle' });
          }
          s.text('+', -0.35, 2.75, { size: 14, color: 'muted', align: 'center' }); s.text('+', 1.0, 3.35, { size: 14, color: 'muted', align: 'center' }); s.text('+', 5.35, 2.75, { size: 14, color: 'muted', align: 'center' });
          const top = Math.max(1, ...inf.map((e) => Math.abs(e.pref))) * 1.25;
          sp.setView([0.4, 3.6], [-top, top]);
          sp.hline(0, { color: 'muted', width: 1 });
          inf.forEach((e, k) => {
            sp.rect(k + 1 - 0.3, 0, k + 1 + 0.3, e.pref, { fill: e.phys > 1e-9 ? 'orange' : e.phys < -1e-9 ? 'teal' : 'muted', fillAlpha: 0.55, color: e.phys > 1e-9 ? 'orange' : e.phys < -1e-9 ? 'teal' : 'muted' });
            sp.text(e.phys > 1e-9 ? 'absorbs' : e.phys < -1e-9 ? 'delivers' : 'idle', k + 1, e.pref >= 0 ? e.pref + top * 0.06 : e.pref - top * 0.06, { size: 11.5, color: 'ink', align: 'center', baseline: e.pref >= 0 ? 'bottom' : 'top' });
          });
        });
        v.legend([['orange', 'absorbs power'], ['teal', 'delivers power']]);
        v.readout(() => {
          const res = C.dc(), inf = info(res), sum = inf.reduce((a, e) => a + e.phys, 0), R = C.part('R').value;
          const V1 = C.part('V1').value, V2 = C.part('V2').value, i = res.I('R');
          const rows = inf.map((e) => `${e.id === 'R' ? 'R' : e.id.replace('V', 'V_')}`.replace(/^V_(\d)/, 'V_$1')).length; void rows;
          const nm = { V1: 'V_1', R: 'R', V2: 'V_2' };
          return inf.map((e) => `$${nm[e.id]}$: $v = ${v.fix(e.vab, 3)}$ V, $i = ${v.fix(z0(e.iref), 3)}$ A${e.f ? ' (arrow reversed)' : ''} → $p = vi = ${v.fix(z0(e.pref), 3)}$ W — **${e.phys > 1e-9 ? 'absorbs' : e.phys < -1e-9 ? 'delivers' : 'idle'}** ${v.fix(Math.abs(z0(e.phys)), 3)} W`).join('\n')
            + `\n$\\sum_k p_k = ${v.sci(Math.abs(sum) + 1e-17, 1)}$ W (energy conservation) · KVL: $V_1 - V_2 - Ri = ${v.sci(Math.abs(V1 - V2 - R * i) + 1e-17, 1)}$ V`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3',
      kind: 'Principle',
      name: 'Lumped matter discipline',
      statement: String.raw`The circuit abstraction rests on three promises about a collection of elements: (i) no net charge accumulates inside any element, so the current into one terminal equals the current out of the other; (ii) the magnetic flux linking any loop that leaves an element and returns through the outside wiring is negligible ($\partial\Phi/\partial t\approx0$), so voltages between nodes do not depend on the path; (iii) signals change slowly enough that effects travel across the whole circuit instantly, which holds when the circuit's size $\ell$ is much smaller than the wavelength $\lambda = c_{\text{line}}/f$ of its fastest signals (a common rule: $\ell\lesssim\lambda/10$). Under these promises the elements are *lumped* and Kirchhoff's laws are exact; when they fail one must go back to Maxwell's equations or to transmission lines (chapter 9).`,
      idea: String.raw`Charge conservation plus no storage inside elements gives a single current per element (1.1). Faraday's law (em-9.3) says the voltage around a loop equals $-d\Phi/dt$, so a line integral of $\mathbf E$ is path-independent only if the flux through the loop between two paths is negligible. And a disturbance needs time $\ell/v$ to cross the circuit, which matters once that delay is a sizeable fraction of a period. All three failures are measured below.`,
      caption: String.raw`Left: a source drives a wire of length $\ell$ at frequency $f$; the grey dashed line is what the lumped picture predicts (the whole wire at the source voltage), the blue curve is the actual wave. Middle: voltage at the two ends against time; the far end lags. Right: a voltmeter across a 1 V element with two lead paths; the area between the paths links stray flux $B_0$ and the readings differ by $\omega B_0 A$ (drag the lead corners). Raise $f$ or $\ell$ until $\ell/\lambda$ approaches 0.1 and beyond.`,
      scope: String.raw`The lumped discipline holds when $\ell\ll\lambda$ and stray flux through the wiring loops is negligible; it fails for long cables, fast digital edges, antennas and radio-frequency boards.`,
      deps: ['circ-1.1', 'em-9.3', 'em-1.2'],
      refs: ['Agarwal–Lang §1.3', 'Agarwal–Lang §1.4'],
      tags: ['lumped', 'wavelength'],
      viz(v) {
        const vp = 2.0e8; // typical coax: velocity factor about 0.66
        const prof = v.stage({ x: [0, 1], y: [-1.6, 1.6], axes: 'box', gutter: true, height: 290, weight: 1.15, xlabel: 'distance along the wire', ylabel: 'voltage / $V_0$', title: 'the wire, now' });
        const time = v.stage({ x: [0, 2], y: [-1.6, 1.6], axes: 'box', gutter: true, height: 290, weight: 1, xlabel: 't / T', ylabel: 'voltage / $V_0$', title: 'the two ends' });
        const loop = v.stage({ x: [-3.3, 3.3], y: [-0.9, 3.2], equal: true, axes: false, height: 290, weight: 0.95, title: 'a voltmeter and its leads' });
        const f = v.slider('frequency $f$', 1e3, 1e9, 2e7, { log: true, sig: 2, fmt: (x) => sI(x, 'Hz', 2) });
        const len = v.slider('wire length $\\ell$', 0.01, 1000, 3, { log: true, sig: 2, fmt: (x) => sI(x, 'm', 2) });
        const term = v.select('far end', [{ value: 'matched', label: 'matched load' }, { value: 'open', label: 'open' }], 'matched');
        const B0 = v.slider('stray flux density $B_0$', 0.1, 1000, 10, { log: true, sig: 2, fmt: (x) => `${x < 1 ? x.toFixed(2) : x.toFixed(0)} nT` });
        const PA = loop.handle(-2.4, 0.2, { color: 'orange', r: 7 }), P1 = loop.handle(-1.7, 2.3, { color: 'orange', label: 'P₁', labelPos: 'nw' }), P2 = loop.handle(1.7, 2.3, { color: 'orange', label: 'P₂', labelPos: 'ne' });
        PA.visible = false;
        const model = () => {
          const lam = vp / f.value, bl = TAU * len.value / lam, matched = term.value === 'matched';
          // complex amplitude of the far-end voltage and the profile V(x) = Re{ Ṽ(x) e^{jωt} }, source V0 at x = 0
          const Vx = (x) => { // returns [re, im]
            if (matched) return [Math.cos(TAU * x / lam), -Math.sin(TAU * x / lam)];
            const c = Math.cos(bl); const den = Math.abs(c) < 1e-3 ? 1e-3 * (c < 0 ? -1 : 1) : c; return [Math.cos(TAU * (len.value - x) / lam) / den, 0];
          };
          return { lam, bl, Vx, ratio: len.value / lam };
        };
        v.animate((t) => {
          const M = model(), ph = (t / 4) * TAU, L = len.value;
          const yv = (x) => { const z = M.Vx(x); return z[0] * Math.cos(ph) - z[1] * Math.sin(ph); };
          let pk = 1; for (let k = 0; k <= 200; k++) { const z = M.Vx(L * k / 200); pk = Math.max(pk, Math.hypot(z[0], z[1])); }
          const top = Math.min(30, pk) * 1.15;
          prof.setView([0, L], [-top, top]); prof.setLabels(`distance along the wire (${L < 1 ? (L * 100).toFixed(1) + ' cm' : L.toFixed(L < 10 ? 1 : 0) + ' m'} total)`, undefined);
          prof.hline(0, { color: 'muted', width: 1 });
          const env = (x) => { const z = M.Vx(x); return Math.hypot(z[0], z[1]); };
          prof.fn(env, { color: 'accent', width: 1, alpha: 0.3, fill: false }); prof.fn((x) => -env(x), { color: 'accent', width: 1, alpha: 0.3 });
          prof.hline(Math.cos(ph), { color: 'muted', width: 2, dash: [6, 4] });
          prof.fn(yv, { color: 'accent', width: 2.6, n: 400 });
          prof.dot(0, yv(0), { r: 5, color: 'gold' }); prof.dot(L, yv(L), { r: 5.5, color: 'red' });
          // time traces
          const zL = M.Vx(L), aL = Math.hypot(zL[0], zL[1]), phL = Math.atan2(zL[1], zL[0]), tp = Math.min(30, aL) * 1.15 < 1.6 ? 1.6 : Math.min(30, aL) * 1.15;
          time.setView([0, 2], [-tp, tp]); time.hline(0, { color: 'muted', width: 1 });
          time.fn((x) => Math.cos(TAU * x), { color: 'gold', width: 2.2, n: 300 });
          time.fn((x) => aL * Math.cos(TAU * x + phL), { color: 'red', width: 2.2, n: 300 });
          const tm = (ph / TAU) % 2; time.vline(tm, { color: 'muted', width: 1.2, dash: [3, 3] });
          // voltmeter loop
          const Aa = [-2.4, 0.2], Bb = [2.4, 0.2];
          loop.dot(Aa[0], Aa[1], { r: 6, color: 'ink', label: 'A', labelPos: 'sw' }); loop.dot(Bb[0], Bb[1], { r: 6, color: 'ink', label: 'B', labelPos: 'se' });
          loop.rect(-1.0, -0.15, 1.0, 0.55, { fill: 'panel', fillAlpha: 1, color: 'ink', width: 2, radius: 4 }); loop.text('1 V element', 0, 0.2, { size: 12, color: 'ink', align: 'center', baseline: 'middle' });
          loop.segment([-2.4, 0.2], [-1.0, 0.2], { color: 'ink', width: 2.4 }); loop.segment([1.0, 0.2], [2.4, 0.2], { color: 'ink', width: 2.4 });
          const poly = [Aa, [P1.x, P1.y], [P2.x, P2.y], Bb];
          loop.poly(poly, { fill: 'purple', fillAlpha: 0.14, stroke: false });
          loop.path([Aa, [P1.x, P1.y], [P2.x, P2.y], Bb], { color: 'orange', width: 2.4 });
          loop.text('meter', 0, (P1.y + P2.y) / 2 + 0.05, { size: 12, color: 'ink', align: 'center', baseline: 'middle', plate: true });
          loop.text('flux $\\Phi=B_0A$ through here', 0, 1.0, { size: 11.5, color: 'purple', align: 'center', baseline: 'middle' });
          void t;
        }, { period: 4, still: 0.35 });
        v.legend([['accent', 'actual wave (envelope faint)'], ['muted', 'lumped prediction', { dash: true }], ['gold', 'source end'], ['red', 'far end']]);
        v.readout(() => {
          const M = model(), L = len.value, area = Math.abs(v.M.polyArea([[-2.4, 0.2], [P1.x, P1.y], [P2.x, P2.y], [2.4, 0.2]])) * 0.01; // 1 unit = 10 cm
          const z = M.Vx(L), aL = Math.hypot(z[0], z[1]), lagDeg = -Math.atan2(z[1], z[0]) * 180 / Math.PI, emf = TAU * f.value * B0.value * 1e-9 * area;
          const ok = M.ratio < 0.1;
          return `$\\lambda = c_{\\text{line}}/f = ${sI(M.lam, 'm', 3)}$ · $\\ell/\\lambda = ${v.fix(M.ratio, 3)}$ — ${ok ? '**lumped picture fine** (under 1/10 of a wavelength)' : '**lumped picture broken**'} · delay $\\ell/v = ${sI(L / vp, 's', 3)}$ = ${v.fix(M.ratio * 360, 1)}° of phase\n far-end amplitude $${v.fix(aL, 3)}\\,V_0$ with a phase lag of $${v.fix(lagDeg, 1)}^\\circ$ (the lumped model says $1\\,V_0$ and $0^\\circ$)\nvoltmeter loop area $A = ${v.fix(area * 1e4, 1)}$ cm² → the two lead paths differ by $\\omega B_0 A = ${sI(emf, 'V', 3)}$, i.e. ${v.fix(emf * 100, 4)} % of the 1 V element`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4',
      kind: 'Law',
      name: 'Ohm’s law',
      statement: String.raw`For a resistor the voltage across it and the current through it are proportional, $v = Ri$ (or $i = Gv$ with conductance $G = 1/R$), with a constant $R$ that does not depend on $v$ or $i$. The constant is a property of the sample and of its temperature. Ohm published the law in 1827; devices for which the ratio $v/i$ changes with $v$ (lamps, thermistors, diodes) are called **non-ohmic**, and for them $v/i$ is only a *static* resistance at one operating point.`,
      idea: String.raw`Microscopically (em-6.3) the drift velocity of carriers is proportional to the field because collisions give a constant mobility, so current density is proportional to $\mathbf E$ and integrating over a sample gives $v = Ri$. The proportionality fails when the material changes during the measurement: a filament that heats up has a resistance that rises with temperature, so the $i$–$v$ curve bends even though the metal obeys Ohm's law at each fixed temperature.`,
      caption: String.raw`Sweep $V$ across the element (the kit solves the schematic at every setting; gold dots record the points you visit). A resistor gives a straight line through the origin of slope $1/R$. Choose the lamp: the filament heats, its resistance climbs, and the curve bends; hold its temperature fixed ("cooled") and the line returns. The dashed secant is the static resistance $V/I$, the tangent the differential resistance $dV/dI$.`,
      scope: String.raw`Holds for metals and many resistive materials at constant temperature and moderate fields; fails for semiconductor junctions, plasmas and self-heating elements.`,
      credit: 'Georg Simon Ohm, 1827',
      deps: ['circ-1.1', 'em-6.3'],
      refs: ['Horowitz–Hill §1.2', 'Agarwal–Lang §1.5'],
      tags: ['resistance', 'linearity'],
      viz(v) {
        const lamp = makeLamp({ Vr: 12, Pr: 12 });
        const s = v.stage({ x: [-1.5, 5.9], y: [-1, 4.4], equal: true, height: 300, axes: false, weight: 0.95 });
        const sp = v.stage({ x: [-13, 13], y: [-2.2, 2.2], axes: 'box', gutter: true, height: 300, weight: 1.2, xlabel: 'voltage $V$ (V)', ylabel: 'current $I$ (A)' });
        const C = v.circuit(s, [
          { type: 'V', id: 'V0', name: 'V', value: 6, at: [0, 3, 0, 0] },
          { type: 'W', at: [0, 3, 1.6, 3] }, { type: 'R', id: 'R', name: 'R', value: 12, at: [1.6, 3, 4.4, 3] },
          { type: 'W', at: [4.4, 3, 4.4, 0, 0, 0] }, { type: 'GND', at: [2.2, 0] },
        ]);
        const mode = v.select('element', [{ value: 'res', label: 'resistor' }, { value: 'lamp', label: 'lamp (tungsten)' }, { value: 'cold', label: 'lamp, kept at 20 °C' }], 'res');
        const Vs = v.slider('applied voltage $V$', -12, 12, 6, { step: 0.1, decimals: 1, fmt: (x) => `${v.fix(x, 1)} V` });
        const Rs = v.slider('$R$', 6, 50, 12, { log: true, sig: 2, fmt: (x) => sI(x, 'Ω', 2) });
        let rec = new Map(), lastMode = mode.value;
        const state = (V) => (mode.value === 'res' ? { R: Rs.value, T: null, I: V / Rs.value } : lamp.state(V, mode.value === 'cold'));
        v.render(() => {
          if (mode.value !== lastMode) { rec = new Map(); lastMode = mode.value; }
          Rs.el.hidden = mode.value !== 'res';
          const V = Vs.value, st = state(V);
          C.part('V0').value = V; C.part('R').value = st.R;
          const res = C.draw({ result: C.dc(), vmax: 12 }), I = res.I('R');
          rec.set(Math.round(V * 10), [V, I]);
          if (mode.value !== 'res') {
            const glow = clamp((st.T - 293) / 2200, 0, 1);
            s.circle(2.9, 3.95, 0.34, { fill: 'orange', fillAlpha: 0.1 + 0.8 * glow, color: 'orange', width: 1.4 });
            s.text(`filament ${v.fix(st.T, 0)} K`, 3.35, 3.95, { size: 12, color: 'ink', align: 'left', baseline: 'middle' });
          }
          // I–V plane
          sp.hline(0, { color: 'muted', width: 1 }); sp.vline(0, { color: 'muted', width: 1 });
          const f = (x) => state(x).I;
          sp.fn(f, { color: mode.value === 'res' ? 'accent' : 'orange', width: 2.8, n: 160 });
          if (mode.value === 'lamp') sp.fn((x) => x / lamp.R0, { color: 'muted', width: 1.2, dash: [4, 4], alpha: 0.7 });
          if (Math.abs(V) > 0.05) sp.segment([0, 0], [V, I], { color: 'green', width: 1.6, dash: [5, 4] });
          const d = 0.05, slope = (f(V + d) - f(V - d)) / (2 * d);
          sp.segment([V - 6, I - 6 * slope], [V + 6, I + 6 * slope], { color: 'purple', width: 1.6, alpha: 0.9 });
          for (const [pv, pi] of rec.values()) sp.dot(pv, pi, { r: 3, color: 'gold' });
          sp.dot(V, I, { r: 6.5, color: 'ink' });
        });
        v.legend([['accent', 'resistor'], ['orange', 'lamp'], ['green', 'secant: static $V/I$', { dash: true }], ['purple', 'tangent: $dV/dI$'], ['gold', 'your measurements', { dot: true }]]);
        v.readout(() => {
          const V = Vs.value, st = state(V), I = st.I, d = 0.05, dI = (state(V + d).I - state(V - d).I) / (2 * d);
          const ratio = Math.abs(V) > 0.05 ? state(2 * V).I / I : NaN;
          return `$V = ${v.fix(V, 2)}$ V, $I = ${v.fix(I, 4)}$ A (kit solve) · static $R = V/I = ${Math.abs(V) > 0.05 ? v.fix(V / I, 3) : v.fix(st.R, 3)}\\ \\Omega$ · differential $dV/dI = ${v.fix(1 / dI, 3)}\\ \\Omega$\nOhm test: $I(2V)/I(V) = ${isNaN(ratio) ? '—' : v.fix(ratio, 4)}$ (exactly 2 for a linear element) · power $P = VI = ${v.fix(V * I, 3)}$ W${mode.value === 'lamp' ? ` · cold resistance $R_0 = ${v.fix(lamp.R0, 2)}\\ \\Omega$ at 293 K (illustrative 12 V, 12 W lamp, $T_{\\text{hot}}\\approx 2500$ K)` : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Proposition',
      name: 'Resistance of a conductor: R = ρL/A',
      statement: String.raw`A uniform bar of ohmic material of resistivity $\rho$, length $L$ and constant cross-sectional area $A$, with equipotential end faces and insulated sides, has resistance $R = \rho L/A$. Resistance therefore doubles with length and halves when the area doubles; $\rho$ is a property of the material (and temperature) alone. For a bar of non-uniform section the current crowds and $R$ exceeds $\rho L/A_{\text{typical}}$ — the formula needs the hypothesis of uniformity.`,
      idea: String.raw`In the bar the field is uniform, $E = v/L$, and the current density is $J = E/\rho$ (em-6.5), so the current is $i = JA = vA/(\rho L)$ and $R = v/i = \rho L/A$. Equivalently: sections in series add their lengths, and strands in parallel add their areas (conductances). Below, the Laplace equation for the potential is solved on a grid (a resistor grid) and the resulting total current is compared with the formula; a drilled hole destroys uniformity and the formula underestimates the resistance.`,
      caption: String.raw`Drag the right end to change $L$ and the top edge to change the width $w$ (the thickness $t$ and material are controls; vertical scale exaggerated). Colour is the potential from a numerical solution of Laplace's equation, arrows are the current density — uniform in the bar. Press "remember" and then double $L$ or $w$ to see $R$ double or halve. Drill a hole: current crowds around it and the true resistance rises above $\rho L/A$.`,
      scope: String.raw`Valid for uniform cross-section, ohmic material and a constant temperature; end effects and non-uniform sections need the field solution.`,
      deps: ['circ-1.4', 'em-6.5'],
      refs: ['Agarwal–Lang §1.5'],
      tags: ['resistivity', 'geometry'],
      viz(v) {
        const s = v.stage({ x: [-1, 11.4], y: [-7.2, 7.2], axes: false, height: 320, weight: 1.6, title: 'a bar carrying a current (vertical scale exaggerated)' });
        const mat = v.select('material', [{ value: 1.68e-8, label: 'copper' }, { value: 2.65e-8, label: 'aluminium' }, { value: 9.71e-8, label: 'iron' }, { value: 1.0e-6, label: 'nichrome' }], 1.68e-8);
        const th = v.slider('thickness $t$', 0.5, 5, 1, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} mm` });
        const hole = v.toggle('drill a hole', false);
        let Rref = null;
        v.button('remember this $R$', () => { Rref = last.R; });
        const Lh = s.handle(6, 0, { color: 'orange', r: 8, constrain: { x: [1, 10], y: [0, 0] } });
        const Wh = s.handle(1.5, 2, { color: 'orange', r: 8, constrain: { x: [1.5, 1.5], y: [1, 5] } });
        const last = { R: 0 }, cache = { key: '', sol: null };
        const solve = () => {
          const L = Lh.x, w = 2 * Wh.y, ny = hole.value ? 10 : 8, nx = clamp(Math.round(ny * L * 10 / w), 4, 560), hx = L * 10 / nx, hy = w / ny;
          const key = [nx, ny, w.toFixed(3), L.toFixed(3), hole.value].join('|');
          if (key !== cache.key) { cache.key = key; cache.sol = barSolve(nx, ny, hx, hy, hole.value ? { cx: L * 5, cy: w / 2, r: 0.3 * w } : null); }
          return { sol: cache.sol, L, w, nx, ny, hx, hy };
        };
        v.render(() => {
          const S = solve(), { sol, L, w } = S;
          Wh.set(1.5, w / 2); Lh.set(L, 0);
          const rho = mat.value, t = th.value * 1e-3, Rsheet = rho / t, Rnum = Rsheet / sol.G, Rf = rho * (L * 1e-2) / (w * 1e-3 * t);
          last.R = Rnum;
          // potential colour map
          s.raster((x, y) => {
            const i = x * 10 / S.hx, j = (y + w / 2) / S.hy; if (i < 0 || i > S.nx || j < 0 || j > S.ny) return null;
            const i0 = Math.min(S.nx - 1, Math.floor(i)), j0 = Math.min(S.ny - 1, Math.floor(j)), fi = i - i0, fj = j - j0, g = (a, b) => sol.phi[sol.id(a, b)];
            if (!sol.alive[sol.id(Math.round(i), Math.round(j))]) return null;
            const p = (1 - fi) * ((1 - fj) * g(i0, j0) + fj * g(i0, j0 + 1)) + fi * ((1 - fj) * g(i0 + 1, j0) + fj * g(i0 + 1, j0 + 1));
            return [...v.diverge(2 * p - 1, 'blue', 'red'), 1];
          }, { rect: [0, -w / 2, L, w / 2], res: 300, key: `${cache.key}` });
          s.rect(0, -w / 2, L, w / 2, { stroke: true, color: 'ink', width: 2, fill: false });
          // current-density arrows
          const c = s.ctx, J0 = 1 / (L * 10), di = Math.max(1, Math.round(S.nx / 12)), dj = hole.value ? 1 : 2;
          c.save(); c.strokeStyle = v.color('ink', 0.85); c.fillStyle = v.color('ink', 0.85); c.lineWidth = 1.6;
          for (let i = Math.round(di / 2) + 1; i < S.nx - 1; i += di) for (let j = 1; j < S.ny; j += dj) {
            const a = sol.id(i, j); if (!sol.alive[a] || !sol.alive[sol.id(i + 1, j)] || !sol.alive[sol.id(i, j + 1)]) continue;
            const jx = (sol.phi[a] - sol.phi[sol.id(i + 1, j)]) / S.hx, jy = (sol.phi[a] - sol.phi[sol.id(i, j + 1)]) / S.hy;
            const mag = Math.hypot(jx, jy) / J0, len = Math.min(30, 11 * mag); if (len < 2) continue;
            const x0 = s.X((i * S.hx) / 10), y0 = s.Y(j * S.hy - w / 2), ux = jx / Math.hypot(jx, jy), uy = -jy / Math.hypot(jx, jy);
            const x1 = x0 + ux * len, y1 = y0 + uy * len;
            c.beginPath(); c.moveTo(x0 - ux * len / 2, y0 - uy * len / 2); c.lineTo(x1 - ux * len / 2, y1 - uy * len / 2); c.stroke();
            const hx = x1 - ux * len / 2, hy2 = y1 - uy * len / 2;
            c.beginPath(); c.moveTo(hx, hy2); c.lineTo(hx - ux * 6 + uy * 3.5, hy2 - uy * 6 - ux * 3.5); c.lineTo(hx - ux * 6 - uy * 3.5, hy2 - uy * 6 + ux * 3.5); c.closePath(); c.fill();
          }
          c.restore();
          s.measure(0, -w / 2 - 1.1, L, -w / 2 - 1.1, `L = ${v.fix(L, 1)} cm`);
          s.text(`w = ${v.fix(w, 1)} mm`, 1.75, w / 2 + 0.2, { size: 12.5, color: 'ink', align: 'left', baseline: 'bottom' });
          s.text('+', -0.5, 0, { size: 18, color: 'red', align: 'center', baseline: 'middle' }); s.text('−', L + 0.5, 0, { size: 18, color: 'blue', align: 'center', baseline: 'middle' });
          void Rf;
        });
        v.legend([['red', 'high potential'], ['blue', 'low potential'], ['ink', 'current density $\\mathbf J$']]);
        v.readout(() => {
          const S = solve(), L = Lh.x, w = 2 * Wh.y, rho = mat.value, t = th.value * 1e-3, A = w * 1e-3 * t;
          const Rnum = (rho / t) / S.sol.G, Rf = rho * (L * 1e-2) / A;
          return `$A = wt = ${v.fix(w * th.value, 2)}$ mm² · formula $\\rho L/A = ${sI(Rf, 'Ω', 4)}$ · numerical solution (resistor grid ${S.nx}×${S.ny}, CG) $R = ${sI(Rnum, 'Ω', 4)}$ · ratio $${v.fix(Rnum / Rf, 4)}$ ${hole.value ? '(the hole crowds the current: the formula for the full section is too low)' : '(uniform bar: grid and formula agree)'}\nat $I = 1$ A the drop is $V = IR = ${sI(Rnum, 'V', 3)}$ and the loss $I^2R = ${sI(Rnum, 'W', 3)}$ ${Rref ? `· compared with the remembered sample: $R/R_{\\text{ref}} = ${v.fix(Rnum / Rref, 3)}$` : ''}`;
        });
      },
    },
  ],
};
