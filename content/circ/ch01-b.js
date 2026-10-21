// Circuits — Chapter 1: The circuit abstraction (part b: 1.6–1.10)
//
// Source values (batteries, thermal constants, lamp and diode parameters) are illustrative. Copper melts at 1084.6 °C and its
// resistance temperature coefficient is ≈ 0.0039 /K near 20 °C (standard handbook values); Joule's 1840–41 experiments gave the
// I²R law of heating.

import { TAU, clamp, sI, z0, makeLamp, circuitGraph, tidyLayout } from './ch01.shared.js';

export default {
  collection: 'circ',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Definition',
      name: 'Ideal voltage and current sources',
      statement: String.raw`An **ideal voltage source** is a two-terminal element that maintains a prescribed voltage $v = V_s$ between its terminals whatever current it must supply, so its $i$–$v$ characteristic is a vertical line. An **ideal current source** maintains a prescribed current $i = I_s$ through itself whatever voltage appears across it: a horizontal line. A voltage source with $V_s = 0$ is a short circuit; a current source with $I_s = 0$ is an open circuit. The current drawn from the voltage source (or the voltage built up across the current source) is decided by the load, at the intersection of the source's characteristic with the load's.`,
      idea: String.raw`A source fixes one of the two variables of its element law, $v$ or $i$, and leaves the other free; a resistor ties the two together by Ohm's law (1.4). Connected to one resistor they share one voltage and one current, so the circuit's operating point is the one point lying on both characteristics. The ideal sources are idealisations: they would deliver unlimited current into a short, or unlimited voltage into an open circuit; real sources (1.7) have limits.`,
      caption: String.raw`The same load $R$ on an ideal voltage source (left) and an ideal current source (middle). Slide $R$ from small to large: the voltage source keeps $v = 5$ V and the current swings ($5/R$); the current source keeps $i = 5$ mA and the voltage swings ($5\,\mathrm{mA}\times R$). On the $i$–$v$ plane each source is a vertical or a horizontal line and the load line through the origin, slope $1/R$, rotates; its crossings are the operating points computed by the solver.`,
      deps: ['circ-1.1'],
      refs: ['Agarwal–Lang §1.6'],
      tags: ['sources', 'i–v plane'],
      viz(v) {
        const sA = v.stage({ x: [-1.5, 4.3], y: [-0.9, 3.6], equal: true, axes: false, height: 235, weight: 1, title: 'ideal voltage source' });
        const sB = v.stage({ x: [-1.5, 4.3], y: [-0.9, 3.6], equal: true, axes: false, height: 235, weight: 1, title: 'ideal current source' });
        const sp = v.stage({ x: [0, 12], y: [0, 12], axes: 'box', gutter: true, height: 330, full: true, xlabel: 'voltage $v$ (V)', ylabel: 'current $i$ (mA)', title: 'the $i$–$v$ plane' });
        const mk = (srcType, srcId, srcVal) => [
          { type: srcType, id: srcId, name: srcType, value: srcVal, at: srcType === 'V' ? [0, 2.6, 0, 0] : [0, 0, 0, 2.6] },
          { type: 'W', at: [0, 2.6, 3, 2.6] }, { type: 'R', id: 'RL', name: 'R', value: 1000, at: [3, 2.6, 3, 0] },
          { type: 'W', at: [3, 0, 0, 0] }, { type: 'GND', at: [1.5, 0] },
        ];
        const VA = 5, IA = 5e-3;
        const CA = v.circuit(sA, mk('V', 'Vs', VA)), CB = v.circuit(sB, mk('I', 'Is', IA));
        const R = v.slider('load $R$', 20, 50e3, 1000, { log: true, sig: 2, fmt: (x) => sI(x, 'Ω', 2) });
        const solve = () => {
          CA.part('RL').value = R.value; CB.part('RL').value = R.value;
          const a = CA.dc(), b = CB.dc(), nA = CA.net.termNode.get('RL').a, nB = CB.net.termNode.get('RL').a;
          return { a, b, vA: a.V(nA), iA: a.I('RL'), vB: b.V(nB), iB: b.I('RL') };
        };
        v.render(() => {
          const S = solve();
          CA.draw({ result: S.a, vmax: 5 }); CB.draw({ result: S.b, vmax: 5 });
          const xm = Math.max(7, 1.2 * Math.max(VA, IA * R.value, S.vB)), ym = Math.max(7, 1.2 * Math.max(IA * 1e3, VA / R.value * 1e3));
          sp.setView([0, xm], [0, ym]);
          sp.fn((x) => x / R.value * 1e3, { color: 'ink', width: 2, n: 2 });
          sp.text('load line $i = v/R$', xm * 0.02, ym * 0.95, { size: 12, color: 'ink', align: 'left', plate: true });
          sp.vline(VA, { color: 'accent', width: 3 }); sp.hline(IA * 1e3, { color: 'orange', width: 3 });
          sp.text('ideal voltage source: $v = V_s$', VA, ym * 0.04, { size: 12, color: 'accent', align: VA > xm * 0.6 ? 'right' : 'left', dx: VA > xm * 0.6 ? -6 : 6, baseline: 'bottom' });
          sp.text('ideal current source: $i = I_s$', xm * 0.02, IA * 1e3, { size: 12, color: 'orange', align: 'left', baseline: 'bottom', dy: -5 });
          sp.dot(S.vA, S.iA * 1e3, { r: 7, color: 'accent' }); sp.dot(S.vB, S.iB * 1e3, { r: 9, color: 'orange', hollow: true });
        });
        v.legend([['accent', 'voltage-source operating point'], ['orange', 'current-source operating point'], ['ink', 'load line']]);
        v.readout(() => {
          const S = solve(), pA = CA.part('Vs'), pB = CB.part('Is'); void pA; void pB;
          const sumA = S.a.P('Vs') + S.a.P('RL'), sumB = S.b.P('Is') + S.b.P('RL');
          return `**Voltage source**: $v = ${v.fix(S.vA, 4)}$ V (fixed), $i = V_s/R = ${v.fix(S.iA * 1e3, 4)}$ mA, delivers $${v.fix(-S.a.P('Vs') * 1e3, 3)}$ mW, $\\sum P = ${v.sci(Math.abs(sumA) + 1e-18, 1)}$ W\n**Current source**: $i = ${v.fix(S.iB * 1e3, 4)}$ mA (fixed), $v = I_sR = ${v.fix(S.vB, 4)}$ V, delivers $${v.fix(-S.b.P('Is') * 1e3, 3)}$ mW, $\\sum P = ${v.sci(Math.abs(sumB) + 1e-18, 1)}$ W · as $R\\to0$ the voltage source must supply unbounded current; as $R\\to\\infty$ the current source must produce unbounded voltage.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7',
      kind: 'Model',
      name: 'Real sources and internal resistance',
      statement: String.raw`A real source (a battery, a bench supply, a signal generator) is modelled by an ideal voltage source $V_{oc}$ in series with an **internal resistance** $R_{\text{int}}$. Its terminal voltage under load current $i$ is $v = V_{oc} - R_{\text{int}}\,i$: a straight line on the $i$–$v$ plane with intercepts $V_{oc}$ (open circuit) and $I_{sc} = V_{oc}/R_{\text{int}}$ (short circuit). It tilts continuously between the ideal voltage source ($R_{\text{int}}\to0$, vertical line) and the ideal current source ($R_{\text{int}}\to\infty$ with $V_{oc}\to\infty$, horizontal line). A load $R_L$ receives $v = V_{oc}R_L/(R_L+R_{\text{int}})$, so the source behaves ideally only when $R_L\gg R_{\text{int}}$.`,
      idea: String.raw`Most of the chemistry or electronics inside a source is hidden behind its two terminals; the terminal behaviour is, to first order, linear, and a linear one-port is a line on the $i$–$v$ plane, which is exactly "an ideal source plus a resistor" (this is the content of the Thévenin theorem, 3.2). The sag $R_{\text{int}}i$ is Ohm's law (1.4) applied to the internal resistance, a voltage divider between $R_{\text{int}}$ and the load.`,
      caption: String.raw`Choose a battery (typical, illustrative values) or set $V_{oc}$ and $R_{\text{int}}$ yourself, then change the load. The coloured dots are the terminal voltage and current found by the circuit solver as $R_L$ sweeps from tiny to huge; they lie on the straight line $v = V_{oc} - R_{\text{int}}i$. The dashed lines are the two ideal extremes.`,
      scope: String.raw`Linear model valid for moderate currents; real batteries add state-of-charge, temperature and current-dependent resistance, and sources have current and voltage limits.`,
      deps: ['circ-1.6', 'circ-1.4'],
      refs: ['Agarwal–Lang §1.7', 'Horowitz–Hill §1.2'],
      tags: ['internal resistance', 'sources'],
      viz(v) {
        const s = v.stage({ x: [-1.7, 6.1], y: [-0.9, 4.9], equal: true, axes: false, height: 310, weight: 0.95 });
        const sp = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 300, weight: 1.2, xlabel: 'terminal voltage $v$ (V)', ylabel: 'load current $i$ (A)' });
        const C = v.circuit(s, [
          { type: 'V', id: 'Voc', name: 'Voc', value: 1.5, at: [0, 3, 0, 0] },
          { type: 'W', at: [0, 3, 0.9, 3] }, { type: 'R', id: 'Ri', name: 'Rint', value: 0.15, at: [0.9, 3, 3.1, 3] }, { type: 'W', at: [3.1, 3, 4.5, 3] },
          { type: 'label', at: [4.5, 3], text: '$v$', dx: 6, dy: -8 },
          { type: 'R', id: 'RL', name: 'RL', value: 3, at: [4.5, 3, 4.5, 0] }, { type: 'W', at: [4.5, 0, 0, 0] }, { type: 'GND', at: [2.2, 0] },
        ]);
        const PRE = { aa: [1.5, 0.15], car: [12.6, 0.02], pp3: [9, 1.7], ideal: [5, 0.01] };
        const Voc = v.slider('$V_{oc}$', 0.5, 24, 1.5, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} V` });
        const Ri = v.slider('$R_{\\text{int}}$', 0.01, 50, 0.15, { log: true, sig: 2, fmt: (x) => sI(x, 'Ω', 2) });
        const RL = v.slider('load $R_L$', 0.05, 1000, 3, { log: true, sig: 2, fmt: (x) => sI(x, 'Ω', 2) });
        const pre = v.select('source', [{ value: 'aa', label: 'AA cell' }, { value: 'pp3', label: '9 V PP3' }, { value: 'car', label: 'car battery' }, { value: 'ideal', label: 'bench supply' }, { value: 'free', label: 'free' }], 'aa', {
          onChange: (k) => { if (PRE[k]) { Voc.set(PRE[k][0]); Ri.set(PRE[k][1]); } },
        });
        const apply = () => { C.part('Voc').value = Voc.value; C.part('Ri').value = Ri.value; C.part('RL').value = RL.value; };
        const solve = () => { apply(); const r = C.dc(), n = C.net.termNode.get('RL').a; return { r, v: r.V(n), i: r.I('RL') }; };
        v.render(() => {
          const S = solve(), Vo = Voc.value, Rg = Ri.value, Isc = Vo / Rg;
          s.rect(-1.3, 0.55, 3.5, 4.45, { stroke: true, color: 'muted', dash: [5, 4], width: 1.3, fill: false });
          s.text('real source', 1.1, 0.3, { size: 12, color: 'muted', align: 'center' });
          C.draw({ result: S.r, vmax: Vo });
          sp.setView([0, Vo * 1.18], [0, Isc * 1.12]);
          sp.vline(Vo, { color: 'accent', width: 1.5, dash: [6, 4] }); sp.hline(Isc, { color: 'orange', width: 1.5, dash: [6, 4] });
          sp.segment([Vo, 0], [0, Isc], { color: 'ink', width: 2.6 });
          sp.fn((x) => x / RL.value, { color: 'green', width: 1.6, n: 2 });
          // measured sweep
          const keep = RL.value; let dev = 0;
          const pts = [];
          for (let k = 0; k < 36; k++) {
            const rl = 0.05 * Math.pow(1000 / 0.05, k / 35); C.part('RL').value = rl;
            const r = C.dc(), n = C.net.termNode.get('RL').a, vv = r.V(n), ii = r.I('RL'); pts.push([vv, ii]);
            dev = Math.max(dev, Math.abs(vv - (Vo - Rg * ii)));
          }
          C.part('RL').value = keep;
          for (const [vv, ii] of pts) sp.dot(vv, ii, { r: 3.2, color: 'blue' });
          sp.dot(S.v, S.i, { r: 7, color: 'gold' });
          sp.text('$V_{oc}$', Vo, Isc * 0.55, { size: 12, color: 'accent', align: 'left', dx: 5 });
          sp.text('$I_{sc}=V_{oc}/R_{\\text{int}}$', Vo * 0.02, Isc, { size: 12, color: 'orange', align: 'left', baseline: 'bottom', dy: -4 });
          s.__dev = dev;
        });
        v.legend([['ink', 'terminal line $v = V_{oc} - R_{\\text{int}}i$'], ['blue', 'solver, $R_L$ swept', { dot: true }], ['green', 'load line'], ['gold', 'operating point', { dot: true }], ['accent', 'ideal voltage source', { dash: true }], ['orange', 'ideal current source', { dash: true }]]);
        v.readout(() => {
          const S = solve(), Vo = Voc.value, Rg = Ri.value, sag = Rg * S.i;
          return `terminal voltage $v = ${v.fix(S.v, 4)}$ V, formula $V_{oc}R_L/(R_L+R_{\\text{int}}) = ${v.fix(Vo * RL.value / (RL.value + Rg), 4)}$ V · load current $${v.fix(S.i, 4)}$ A · sag $R_{\\text{int}}i = ${v.fix(sag, 4)}$ V (${v.fix(100 * sag / Vo, 1)} % of $V_{oc}$)\n$I_{sc} = V_{oc}/R_{\\text{int}}$ = ${sI(Vo / Rg, 'A', 3)} · efficiency (power in $R_L$ / power from the ideal source) $= R_L/(R_L+R_{\\text{int}}) = ${v.fix(100 * RL.value / (RL.value + Rg), 1)}$ % · largest deviation of the 36 solver points from the line: $${v.sci(Math.max(s.__dev || 0, 1e-16), 1)}$ V`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8',
      kind: 'Phenomenon',
      name: 'Joule heating: P = I²R',
      statement: String.raw`A current $I$ through a resistance $R$ turns electrical energy into heat at the rate $P = vi = I^2R = v^2/R$. If the resistor loses heat to its surroundings at a rate $h\,\Delta T$ proportional to its temperature rise $\Delta T$, and has heat capacity $C_{th}$, then $C_{th}\,d\Delta T/dt = I^2R - h\,\Delta T$. The temperature rise relaxes exponentially to $\Delta T_\infty = I^2R/h$ with time constant $\tau = C_{th}/h$, so doubling the current quadruples the steady rise. If $R$ itself grows with temperature, $R = R_0(1+\alpha\Delta T)$, and the current is held fixed, the rise is $I^2R_0/(h - \alpha I^2R_0)$ and the heating runs away when $\alpha I^2R_0 \ge h$.`,
      idea: String.raw`Power is $vi$ (1.2) and for a resistor $v = Ri$ (1.4), so the dissipation is $I^2R$; this is Joule's law (em-6.6), which he found experimentally in 1840–41. The temperature obeys a first-order linear ODE (a heat-balance version of the RC circuit of chapter 5): the heating is a constant, the cooling is proportional to the rise, hence the exponential. The positive feedback of a temperature-dependent resistance at constant current changes the effective cooling constant to $h - \alpha I^2R_0$, which can reach zero.`,
      caption: String.raw`Switch the current on at $t=0$ (time-lapse). The curve is the numerical integration (RK4) of the heat balance, compared with the exponential. Raise $I$ and watch the steady rise follow the parabola $I^2R/h$ on the right; the hollow marker shows that $2I$ gives four times the rise. Switch on the temperature-dependent resistance (copper) and push $I$ near 16 A at constant current: the rise runs away and the wire reaches copper's melting point, like a fuse.`,
      scope: String.raw`Newtonian cooling with constant $h$, uniform temperature and a constant (or linear in $T$) resistance; radiation, conduction gradients and phase changes are ignored.`,
      credit: 'James Prescott Joule, 1840–41',
      deps: ['circ-1.2', 'circ-1.4', 'em-6.6'],
      refs: ['Horowitz–Hill §1.2'],
      tags: ['heating', 'thermal'],
      viz(v) {
        const R0 = 0.2, Cth = 10, hh = 0.2, alpha = 0.00393, Tamb = 20, Tmelt = 1084.6, Icr = Math.sqrt(hh / (alpha * R0));
        const glow = v.stage({ x: [0, 10], y: [-1, 1], axes: false, height: 120, full: true, title: 'the resistor (colour = temperature)' });
        const tr = v.stage({ x: [0, 300], y: [0, 1100], axes: 'box', gutter: true, height: 300, weight: 1.3, xlabel: 'time $t$ (s)', ylabel: 'temperature (°C)' });
        const ss = v.stage({ x: [0, 20], y: [0, 1100], axes: 'box', gutter: true, height: 300, weight: 1, xlabel: 'current $I$ (A)', ylabel: 'steady rise $\\Delta T_\\infty$ (K)' });
        const I = v.slider('current $I$', 0, 20, 10, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} A` });
        const fb = v.toggle('resistance rises with temperature (copper, $\\alpha = 0.0039$/K)', false);
        const traj = () => {
          const a = fb.value ? alpha : 0, i2 = I.value ** 2, f = (t, y) => [(i2 * R0 * (1 + a * y[0]) - hh * y[0]) / Cth];
          const n = 600, T = 300;
          const tt = [], yy = []; let st = [0];
          const h = T / n; const step = (yv) => { const k1 = f(0, yv), k2 = f(0, [yv[0] + h / 2 * k1[0]]), k3 = f(0, [yv[0] + h / 2 * k2[0]]), k4 = f(0, [yv[0] + h * k3[0]]); return [yv[0] + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])]; };
          tt.push(0); yy.push(0);
          for (let k = 1; k <= n; k++) { st = step(st); tt.push(k * h); yy.push(Math.min(st[0], 1e5)); if (st[0] > 5000) { for (let q = k + 1; q <= n; q++) { tt.push(q * h); yy.push(5000); } break; } }
          return { tt, yy };
        };
        const closed = (t) => { const a = fb.value ? alpha : 0, g = hh - a * I.value ** 2 * R0, p = I.value ** 2 * R0; return Math.abs(g) < 1e-12 ? p * t / Cth : (p / g) * (1 - Math.exp(-g * t / Cth)); };
        v.animate((t) => {
          const { tt, yy } = traj(), simT = (t / 10) * 300, idx = Math.min(tt.length - 1, Math.round(simT / 0.5)), dT = yy[idx], a = fb.value ? alpha : 0;
          const Tnow = Tamb + dT, melted = Tnow >= Tmelt;
          // glowing resistor
          const k1 = clamp((Tnow - Tamb) / 400, 0, 1), k2 = clamp((Tnow - 450) / 600, 0, 1);
          const col = v.mix(v.mix('panel', 'orange', k1), 'red', k2);
          glow.line(0, 0, 1.6, 0, { color: 'ink', width: 3 }); glow.line(8.4, 0, 10, 0, { color: 'ink', width: 3 });
          glow.rect(1.6, -0.45, 8.4, 0.45, { fill: true, fillAlpha: 0, color: 'ink', width: 2, radius: 6 });
          const c = glow.ctx; c.save(); c.fillStyle = col; const x0 = glow.X(1.6), x1 = glow.X(8.4), y0 = glow.Y(0.45), y1 = glow.Y(-0.45); c.beginPath(); c.roundRect(x0, y0, x1 - x0, y1 - y0, 7); c.fill(); c.restore();
          const pin = I.value ** 2 * R0 * (1 + a * dT), pout = hh * dT;
          glow.text(`${melted ? 'MELTED' : ''}  ${v.fix(Tnow, 0)} °C`, 5, 0, { size: 15, color: 'ink', align: 'center', baseline: 'middle', weight: 700, plate: true });
          glow.arrow(5, 0.55, 5, 0.9, { color: 'red', width: 2.5, head: 7 }); glow.text(`in: ${v.fix(pin, 1)} W`, 5.3, 0.78, { size: 12, color: 'red', align: 'left', baseline: 'middle' });
          const lv = clamp(pout / 10, 0.05, 0.4); glow.arrow(2.6, -0.5, 2.6, -0.5 - lv, { color: 'blue', width: 2.5, head: 7 }); glow.text(`out: ${v.fix(pout, 1)} W`, 2.9, -0.8, { size: 12, color: 'blue', align: 'left', baseline: 'middle' });
          glow.arrow(7.4, -0.5, 7.4, -0.5 - lv, { color: 'blue', width: 2.5, head: 7 });
          // trajectory
          tr.hline(Tmelt, { color: 'red', width: 1.3, dash: [6, 4] }); tr.text('copper melts (1085 °C)', 298, Tmelt - 25, { size: 11.5, color: 'red', align: 'right', baseline: 'top' });
          tr.hline(Tamb, { color: 'muted', width: 1, dash: [2, 3] });
          const dTinf = (() => { const g = hh - a * I.value ** 2 * R0; return g > 1e-9 ? I.value ** 2 * R0 / g : Infinity; })();
          if (isFinite(dTinf) && Tamb + dTinf < 1100) { tr.hline(Tamb + dTinf, { color: 'green', width: 1.4, dash: [5, 4] }); tr.text('steady value', 298, Tamb + dTinf + 8, { size: 11.5, color: 'green', align: 'right', baseline: 'bottom' }); }
          const tau = Cth / Math.max(1e-9, hh - a * I.value ** 2 * R0);
          if (tau > 0 && tau < 300 && hh - a * I.value ** 2 * R0 > 0) { tr.vline(tau, { color: 'muted', dash: [4, 4], width: 1 }); tr.text('$\\tau$', tau, 1060, { size: 12, color: 'muted', align: 'left', dx: 3 }); }
          tr.path(tt.map((x, k) => [x, Tamb + closed(x)]).filter(([, y]) => y < 1200), { color: 'ink', width: 1.4, dash: [5, 4], alpha: 0.75 });
          tr.path(tt.slice(0, idx + 1).map((x, k) => [x, Tamb + yy[k]]), { color: 'accent', width: 2.8 });
          tr.vline(simT, { color: 'gold', width: 1.4 }); tr.dot(simT, Math.min(Tnow, 1095), { r: 5.5, color: 'gold' });
          // steady rise vs current
          ss.hline(Tmelt - Tamb, { color: 'red', width: 1.3, dash: [6, 4] });
          ss.fn((x) => x * x * R0 / hh, { color: 'ink', width: 1.6, dash: [5, 4], alpha: 0.8, n: 120 });
          if (fb.value) { ss.vline(Icr, { color: 'red', width: 1.2, dash: [3, 3] }); ss.text('$I_c$', Icr, 1040, { size: 12, color: 'red', align: 'right', dx: -4 }); ss.fn((x) => { const g = hh - alpha * x * x * R0; return g > 0 ? x * x * R0 / g : NaN; }, { color: 'orange', width: 2.6, n: 400, domain: [0, Icr - 0.002] }); }
          else ss.fn((x) => x * x * R0 / hh, { color: 'accent', width: 2.6, n: 120 });
          const dI = (i) => { const g = hh - a * i * i * R0; return g > 0 ? i * i * R0 / g : NaN; };
          ss.dot(I.value, dI(I.value), { r: 6, color: 'gold' });
          if (2 * I.value <= 20 && isFinite(dI(2 * I.value))) ss.dot(2 * I.value, dI(2 * I.value), { r: 6, hollow: true, color: 'gold', label: '2I', labelPos: 'nw' });
        }, { period: 10, still: 9.5 });
        v.legend([['accent', 'integrated $\\Delta T(t)$'], ['ink', 'closed form', { dash: true }], ['green', 'steady value', { dash: true }], ['red', 'melting point', { dash: true }]]);
        v.readout(() => {
          const a = fb.value ? alpha : 0, g = hh - a * I.value ** 2 * R0, p = I.value ** 2 * R0, { tt, yy } = traj();
          let dev = 0; for (let k = 0; k < tt.length; k += 10) { if (yy[k] > 4000) break; dev = Math.max(dev, Math.abs(yy[k] - closed(tt[k]))); }
          const d1 = g > 1e-9 ? p / g : Infinity, g2 = hh - a * 4 * I.value ** 2 * R0, d2 = g2 > 1e-9 ? 4 * p / g2 : Infinity;
          return `$I^2R_0 = ${v.fix(p, 2)}$ W · ${g > 1e-9 ? `steady rise $\\Delta T_\\infty = ${v.fix(d1, 1)}$ K (${v.fix(Tamb + d1, 0)} °C), $\\tau = C_{th}/h_{\\text{eff}} = ${v.fix(Cth / g, 1)}$ s` : '**no steady state: thermal runaway**'} · $\\Delta T_\\infty(2I)/\\Delta T_\\infty(I) = ${isFinite(d1) && isFinite(d2) ? v.fix(d2 / d1, 3) : '\\infty'}$ ${fb.value ? '' : '(exactly 4)'} · RK4 vs closed form: max deviation $${v.sci(Math.max(dev, 1e-12), 1)}$ K\nparameters (illustrative): $R_0=0.2\\ \\Omega$, $C_{th}=10$ J/K, $h=0.2$ W/K, ambient 20 °C; critical current at constant current $I_c = \\sqrt{h/(\\alpha R_0)} = ${v.fix(Icr, 1)}$ A`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.9
    {
      num: '1.9',
      kind: 'Definition',
      name: 'Element i–v characteristics: linear and nonlinear',
      statement: String.raw`The **$i$–$v$ characteristic** of a two-terminal element is the set of pairs $(v,i)$ that the element allows. A resistor is a line through the origin; an open circuit is the $v$-axis ($i=0$ at any $v$) and a short circuit the $i$-axis ($v=0$ at any $i$); ideal sources are vertical and horizontal lines; a diode and a lamp are curves. An element with $i = g(v)$ is **linear** when $g(\alpha v) = \alpha g(v)$ and $g(v_1+v_2)=g(v_1)+g(v_2)$ for all $\alpha, v, v_1, v_2$ — which means a straight line through the origin. Sources, diodes and lamps fail the test.`,
      idea: String.raw`The characteristic collects everything a circuit can ever ask of an element, since by the lumped discipline (1.3) only $v$ and $i$ matter. Scaling test: if $i(2v) = 2i(v)$ at every $v$, the curve is a line through the origin. Resistors (Ohm, 1.4) and the open circuit pass; an independent source is a constant, which cannot scale; the lamp curves because its resistance depends on its own heating, the diode (chapter 4) because of the exponential carrier statistics.`,
      caption: String.raw`Switch elements on and off to overlay their curves. Drag the gold handle along the $v$-axis: for each visible element the solid dot is $i(v)$, the hollow dot is $i(2v)$, and the faint dot is $2\,i(v)$. If the hollow dot sits on the faint dot at every $v$, the element passes the scaling test; the readout says which do.`,
      deps: ['circ-1.4', 'circ-1.6'],
      refs: ['Agarwal–Lang §1.6'],
      tags: ['i–v curve', 'linearity'],
      viz(v) {
        const lamp = makeLamp({ Vr: 6, Pr: 0.3 }), Is = 1e-14, nVt = 0.02585, Rr = 200;
        const EL = [
          { id: 'res', name: 'resistor 200 Ω', color: 'accent', f: (x) => x / Rr * 1e3, on: true },
          { id: 'lamp', name: 'lamp 6 V, 0.3 W', color: 'orange', f: (x) => lamp.state(x).I * 1e3, on: true },
          { id: 'diode', name: 'diode', color: 'purple', f: (x) => Is * (Math.exp(Math.min(x / nVt, 60)) - 1) * 1e3, on: true },
          { id: 'is', name: 'current source 20 mA', color: 'teal', f: () => 20, on: true },
          { id: 'vs', name: 'voltage source 3 V', color: 'red', vert: 3, on: false },
          { id: 'open', name: 'open circuit', color: 'gray', f: () => 0, on: false },
          { id: 'short', name: 'short circuit', color: 'pink', vert: 0, on: false },
        ];
        const s = v.stage({ x: [-8, 8], y: [-70, 70], axes: true, height: 380, full: true, xlabel: 'voltage $v$ (V)', ylabel: 'current $i$ (mA)' });
        const tg = Object.fromEntries(EL.map((e) => [e.id, v.toggle(e.name, e.on)]));
        const H = s.handle(2.2, 0, { color: 'gold', r: 8, constrain: { x: [-3.9, 3.9], y: [0, 0] }, label: 'v', labelPos: 'n' });
        const vis = () => EL.filter((e) => tg[e.id].value);
        v.render(() => {
          s.vline(H.x, { color: 'gold', width: 1.2, dash: [3, 3] }); s.vline(2 * H.x, { color: 'gold', width: 1, dash: [3, 3], alpha: 0.6 });
          for (const e of vis()) {
            if (e.vert != null) { s.vline(e.vert, { color: e.color, width: 2.8 }); continue; }
            s.fn(e.f, { color: e.color, width: 2.8, n: 400 });
            const a = e.f(H.x), b = e.f(2 * H.x);
            s.dot(H.x, a, { r: 5.5, color: e.color });
            if (Math.abs(2 * H.x) < 8) {
              s.dot(2 * H.x, 2 * a, { r: 4, color: e.color, hollow: false, alpha: 0.5 }); s.dot(2 * H.x, b, { r: 7, color: e.color, hollow: true });
              s.segment([2 * H.x, 2 * a], [2 * H.x, b], { color: Math.abs(b - 2 * a) < 1e-6 * (1 + Math.abs(a)) ? 'green' : 'red', width: 2.4 });
            }
          }
        });
        v.legend([['ink', 'solid dot: $i(v)$', { dot: true }], ['ink', 'faint dot: $2\\,i(v)$', { dot: true }], ['ink', 'hollow dot: $i(2v)$', { dot: true }], ['green', 'gap = 0: scales'], ['red', 'gap ≠ 0: does not']]);
        v.readout(() => {
          const x = H.x, rows = vis().map((e) => {
            if (e.vert != null) return `${e.name}: a vertical line, $v = ${e.vert}$ V for every current — a relation, not a function $i(v)$`;
            const a = e.f(x), b = e.f(2 * x), ok = Math.abs(b - 2 * a) < 1e-6 * (1 + Math.abs(a)), n = (q) => (Math.abs(q) < 1e4 ? `$${v.fix(q, 3)}$` : '$\\gg 10^{4}$ (off scale)');
            return `${e.name}: $i(v) =$ ${n(a)}, $i(2v) =$ ${n(b)}, $2i(v) =$ ${n(2 * a)} mA → ${ok ? '**passes** the scaling test' : '**fails** it'}`;
          });
          return `test voltage $v = ${v.fix(x, 2)}$ V, $2v = ${v.fix(2 * x, 2)}$ V\n${rows.join('\n') || 'switch some elements on'}\n(illustrative models: diode $i = I_s(e^{v/V_T}-1)$, $I_s = 10^{-14}$ A, $V_T = 25.85$ mV; lamp as in 1.4 with a 6 V, 0.3 W rating)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.10
    {
      num: '1.10',
      kind: 'Definition',
      name: 'A circuit as a graph: nodes, branches and loops',
      statement: String.raw`Because of the lumped discipline, a circuit is described by its connections alone. A **node** is a maximal set of terminals joined by ideal wires (a wire, however long or twisted, is one node: all its points have one voltage). A **branch** is an element between two nodes. The circuit is then a graph with $n$ nodes and $b$ branches, drawn as vertices and edges. A **loop** is a closed path of branches. Choose a spanning tree ($n-1$ branches connecting all nodes); each of the remaining $b-n+1$ branches closes exactly one **fundamental loop** with the tree, and these $\ell = b-n+1$ loops are independent (for a connected circuit).`,
      idea: String.raw`Replacing every wire by a point removes all geometry that does not matter (1.3). The tree reaches all nodes with the least number of branches; adding any other branch makes a cycle, and cycles built from different non-tree branches cannot be combined to cancel one another, so the count of independent loops is the number of branches outside the tree. The numbers $n-1$ and $\ell$ will be the numbers of independent KCL and KVL equations (2.7).`,
      caption: String.raw`Choose a circuit; each colour is one node (all wire pieces and terminals of the same colour are at the same voltage). Right: the extracted graph with the same colours, green = spanning tree, grey = the rest. Step through the fundamental loops with the slider; the loop's branches are highlighted. Switch on the extra wire across one element: its two ends merge into a single node, $n$ drops by one, and the shorted element becomes a self-loop edge.`,
      deps: ['circ-1.3'],
      refs: ['Agarwal–Lang §2.1'],
      tags: ['graph', 'topology'],
      viz(v) {
        const s = v.stage({ x: [-0.8, 6.2], y: [-0.7, 3.8], equal: true, axes: false, height: 330, weight: 1.15, title: 'the schematic: colour = node' });
        const gs = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: false, height: 330, weight: 1, title: 'the graph' });
        const PAL = ['ink', 'accent', 'orange', 'green', 'purple', 'teal', 'pink', 'gold'];
        const common = {
          bridge: [
            { type: 'V', id: 'V1', name: 'V1', value: 10, at: [0, 3, 0, 0] },
            { type: 'W', at: [0, 3, 2, 3] }, { type: 'W', at: [2, 3, 5, 3] }, { type: 'W', at: [0, 0, 5, 0] },
            { type: 'R', id: 'R1', name: 'R1', value: 1000, at: [2, 3, 2, 1.5] }, { type: 'R', id: 'R3', name: 'R3', value: 2000, at: [2, 1.5, 2, 0] },
            { type: 'R', id: 'R2', name: 'R2', value: 2000, at: [5, 3, 5, 1.5] }, { type: 'R', id: 'R4', name: 'R4', value: 1000, at: [5, 1.5, 5, 0] },
            { type: 'R', id: 'R5', name: 'R5', value: 500, at: [2, 1.5, 5, 1.5], labelSide: -1 }, { type: 'GND', at: [2.5, 0] },
          ],
          ladder: [
            { type: 'V', id: 'V1', name: 'V1', value: 10, at: [0, 3, 0, 0] },
            { type: 'W', at: [0, 3, 1, 3] }, { type: 'R', id: 'R1', name: 'R1', value: 1000, at: [1, 3, 3, 3] }, { type: 'R', id: 'R2', name: 'R2', value: 1000, at: [3, 3, 3, 0] },
            { type: 'R', id: 'R3', name: 'R3', value: 1000, at: [3, 3, 5.2, 3] }, { type: 'R', id: 'R4', name: 'R4', value: 1000, at: [5.2, 3, 5.2, 0] },
            { type: 'W', at: [0, 0, 5.2, 0] }, { type: 'GND', at: [2.5, 0] },
          ],
          wired: [
            { type: 'V', id: 'V1', name: 'V1', value: 10, at: [0, 3, 0, 0] },
            { type: 'W', at: [0, 3, 0, 3.6, 1.6, 3.6, 1.6, 3] }, { type: 'R', id: 'R1', name: 'R1', value: 1000, at: [1.6, 3, 3.2, 3] },
            { type: 'W', at: [3.2, 3, 3.2, 3.6, 5.4, 3.6, 5.4, 3] }, { type: 'R', id: 'R2', name: 'R2', value: 1000, at: [3.2, 3, 3.2, 0] },
            { type: 'R', id: 'R3', name: 'R3', value: 2000, at: [5.4, 3, 5.4, 0] }, { type: 'W', at: [0, 0, 5.4, 0] }, { type: 'GND', at: [2.5, 0] },
          ],
        };
        const extra = { bridge: ['R5', [2, 1.5, 5, 1.5]], ladder: ['R2', [3, 3, 3, 0]], wired: ['R3', [5.4, 3, 5.4, 0]] };
        const kits = {};
        for (const k of Object.keys(common)) for (const w of [false, true]) kits[`${k}|${w}`] = v.circuit(s, w ? [...common[k], { type: 'W', at: extra[k][1] }] : common[k]);
        const sel = v.select('circuit', [{ value: 'bridge', label: 'bridge' }, { value: 'ladder', label: 'ladder' }, { value: 'wired', label: 'long wires' }], 'bridge');
        const wt = v.toggle('add a wire across an element', false);
        const trT = v.toggle('show the spanning tree', true);
        const li = v.slider('fundamental loop', 1, 4, 1, { int: true });
        const G = v.graph(gs, { nodes: [{ id: 'x', x: 0, y: 0 }], edges: [], directed: false, draggable: false, layout: 'none' });
        let key = '', info = null;
        const analyse = (C) => {
          const g = circuitGraph(C), names = g.nodes, idx = new Map(names.map((n, i) => [n, i])), n = names.length, b = g.edges.length;
          // incidence matrix and rank
          const A = Array.from({ length: n }, () => new Array(b).fill(0));
          g.edges.forEach((e, k) => { if (e.a !== e.b) { A[idx.get(e.a)][k] += 1; A[idx.get(e.b)][k] -= 1; } });
          const rank = v.M.rank(A);
          // BFS spanning tree from ground
          const par = new Map([[names[0], null]]), q = [names[0]], tree = new Set();
          while (q.length) { const u = q.shift(); g.edges.forEach((e, k) => { if (e.a === e.b) return; const w = e.a === u ? e.b : e.b === u ? e.a : null; if (w != null && !par.has(w)) { par.set(w, [u, k]); tree.add(k); q.push(w); } }); }
          const depth = (x) => { let d = 0; while (par.get(x)) { x = par.get(x)[0]; d++; } return d; };
          const pathUp = (x) => { const r = []; while (par.get(x)) { const [p, k] = par.get(x); r.push(k); x = p; } return r; };
          const loops = []; g.edges.forEach((e, k) => { if (tree.has(k)) return; let a = e.a, c = e.b; const ea = [], ec = []; let da = depth(a), dc = depth(c);
            while (da > dc) { const [p, kk] = par.get(a); ea.push(kk); a = p; da--; } while (dc > da) { const [p, kk] = par.get(c); ec.push(kk); c = p; dc--; }
            while (a !== c) { let [p, kk] = par.get(a); ea.push(kk); a = p; [p, kk] = par.get(c); ec.push(kk); c = p; }
            loops.push({ chord: k, edges: [k, ...ea, ...ec] }); });
          void pathUp;
          return { g, names, n, b, rank, tree, loops, ell: b - n + 1 };
        };
        const cur = () => kits[`${sel.value}|${wt.value}`];
        v.render(() => {
          const C = cur(), k = `${sel.value}|${wt.value}`;
          if (key !== k) {
            key = k; info = analyse(C);
            const P = tidyLayout(info.names, info.g.edges, v.rng(11));
            const nodes = info.names.map((id, i) => ({ id, label: id === '0' ? '0' : `${i}`, x: P[id][0], y: P[id][1], color: PAL[i % PAL.length] }));
            G.set({ nodes, edges: info.g.edges.map((e) => ({ from: e.a, to: e.b, label: e.name, key: e.id })), directed: false, draggable: false }).layout('fit');
          }
          const L = Math.min(Math.max(1, info.loops.length), 4); li.el.hidden = info.loops.length < 2; const sel2 = clamp(li.value, 1, L) - 1, lp = info.loops[sel2];
          C.draw({ colors: false, dots: false, probes: false });
          const col = (n) => PAL[info.names.indexOf(n) % PAL.length];
          for (const sg of C.net.segs) s.line(sg.x0, sg.y0, sg.x1, sg.y1, { color: col(sg.node), width: 5, alpha: 0.9 });
          for (const p of C.parts) if (['R', 'C', 'L', 'V', 'I', 'SW', 'D'].includes(p.type)) { const T = C.net.terminals(p), m = C.net.termNode.get(p.id); s.dot(T[0].x, T[0].y, { r: 5.5, color: col(m.a) }); s.dot(T[1].x, T[1].y, { r: 5.5, color: col(m.b) }); }
          const inLoop = new Set(lp ? lp.edges : []);
          const eKey = new Map(info.g.edges.map((e, i) => [e.id, i]));
          G.draw({
            nodeFill: (id) => PAL[info.names.indexOf(id) % PAL.length],
            edgeColor: (e) => (lp && inLoop.has(eKey.get(e.key)) ? 'red' : trT.value && info.tree.has(eKey.get(e.key)) ? 'green' : null),
            edgeWidth: (e) => (lp && inLoop.has(eKey.get(e.key)) ? 4 : trT.value && info.tree.has(eKey.get(e.key)) ? 3.4 : 1.8),
          });
        });
        v.legend([['green', 'spanning tree'], ['red', 'selected fundamental loop'], ['muted', 'chords']]);
        v.readout(() => {
          const C = cur(); if (!info || key !== `${sel.value}|${wt.value}`) return '';
          const { n, b, rank, loops, ell, g } = info, lp = loops[clamp(li.value, 1, Math.max(1, loops.length)) - 1];
          const self = g.edges.filter((e) => e.a === e.b).map((e) => e.name);
          void C;
          return `$n = ${n}$ nodes, $b = ${b}$ branches → loops $\\ell = b-n+1 = ${ell}$ · independent check: rank of the node–branch incidence matrix $= ${rank} = n-1$, cycle space dimension $b - \\operatorname{rank} = ${b - rank}$, non-tree branches $= ${loops.length}$ ${ell === loops.length && b - rank === ell ? '(all agree)' : '(**mismatch**)'}\n${lp ? `fundamental loop ${clamp(li.value, 1, loops.length)} of ${loops.length}: closed by branch ${g.edges[lp.chord].name}, uses ${lp.edges.map((k) => g.edges[k].name).join(', ')}` : 'no loops'}${self.length ? ` · ${self.join(', ')} is a self-loop (both ends on one node)` : ''}`;
        });
      },
    },
  ],
};
