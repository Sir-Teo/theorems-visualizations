// Circuits — Chapter 4: Nonlinear elements and the digital abstraction (part a: 4.1–4.6)
//
// All component values are illustrative. Diode and transistor curves are the textbook models named in each item, not measured data.
// Historical attributions are checked where the item says so; those resting on memory or a secondary source carry verify: true.
import { clamp, vT, shock, shockV, loadDiode, bisectDec, eng } from './ch04.shared.js';
import { rectifierEnvelope } from './circ-source-audit-rectifier.shared.js';

export default {
  collection: 'circ',
  chapter: 4,
  title: 'Nonlinear elements and the digital abstraction',
  summary: String.raw`Diodes and transistors are nonlinear, but three ideas tame them: graphical load-line analysis, piecewise-linear models, and small-signal linearization around an operating point. The same devices used as switches give the digital abstraction, where noise margins let a chain of gates restore clean logic levels. The chapter closes with the transistor as an amplifier, the source of all gain in electronics, with the latch that remembers a bit, and with five landmark papers from the transistor to Moore's law.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Model',
      name: 'Diode: the Shockley equation',
      statement: String.raw`An ideal semiconductor junction diode carries the current $i = I_s\,(e^{v/(nV_T)} - 1)$ when the voltage $v$ is applied from anode to cathode, where $V_T = kT/q$ is the thermal voltage (about $25.9$ mV at $300$ K), $I_s$ is the saturation current (it depends strongly on temperature and on the device) and $n\in[1,2]$ is an ideality factor. For $v\gg V_T$ this is $i\approx I_s e^{v/nV_T}$, so each factor $10$ in current costs $nV_T\ln 10\approx 60n$ mV of voltage; for $v<0$ the current saturates at $-I_s$. The element is a nonlinear, voltage-controlled, memoryless $i$–$v$ characteristic.`,
      idea: String.raw`The equation comes from the physics of the junction (cm-4.8): minority carriers injected across the junction are proportional to a Boltzmann factor $e^{qv/kT}$, so the current is exponential in the voltage. The circuit consequence is what matters here: the exponential makes the voltage across a conducting diode almost independent of the current. A million-fold change in current moves the voltage by only about $0.36$ V, which is why a conducting diode is "about $0.6$–$0.7$ V". The exponential addition and inverse-log identities (pma 8.6) quantify the voltage scale. For $I_s>0$ and $nV_T>0$, the exact inversion is $v=nV_T\log(1+i/I_s)$ on $i>-I_s$. Thus two currents satisfy $\Delta v=nV_T\log[(I_s+i_2)/(I_s+i_1)]$. A tenfold change costs approximately $nV_T\log10$ only when both forward currents greatly exceed $I_s$. Positivity and monotonicity of the exponential also show that this ideal characteristic is strictly increasing while tending to $-I_s$, not to minus infinity, under large reverse bias.`,
      caption: String.raw`The same curve on linear axes (left) and with a logarithmic current axis (right). On the log plot it is a straight line of slope $1/(nV_T\ln 10)$ decades per volt; the gold dots sit one decade apart and are the same voltage step apart. Slide $I_s$ and the whole curve slides sideways (the knee at $1$ mA moves, the slope does not); raise $T$ or $n$ and the slope changes. The reverse current is $-I_s$, too small to show on a log axis.`,
      scope: String.raw`Ideal junction (low injection, no series resistance, no breakdown). At high currents the series resistance of the bulk bends the curve toward a straight line; near the reverse breakdown voltage the current rises sharply.`,
      credit: 'W. Shockley, 1949 (Bell System Technical Journal 28; see 4.15)',
      deps: ['circ-1.9', 'cm-4.7', 'pma-8.6'],
      see: ['cm-4.8', 'circ-4.15'],
      refs: ['Agarwal–Lang §16.2', 'Horowitz–Hill §1.6'],
      tags: ['diode', 'exponential'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Shockley_diode_equation' },
      viz(v) {
        const sl = v.stage({ x: [-0.25, 1.0], y: [-1.5, 12], axes: 'box', gutter: true, height: 310, xlabel: '$v$ (V)', ylabel: '$i$ (mA)', title: 'linear axes' });
        const sg = v.stage({ x: [0, 1.0], y: [1e-14, 1e-1], ylog: true, axes: 'box', gutter: true, height: 310, xlabel: '$v$ (V)', ylabel: '$i$ (A)', title: 'logarithmic current axis' });
        const Is = v.slider('$I_s$', 1e-16, 1e-9, 1e-14, { log: true, sig: 2, fmt: (x) => `${eng(x, 2)}A` });
        const nn = v.slider('$n$', 1, 2, 1, { step: 0.01 });
        const TT = v.slider('$T$', 250, 400, 300, { step: 1, fmt: (x) => `${Math.round(x)} K` });
        let info = null;
        v.render(() => {
          const I0 = Is.value, n = nn.value, T = TT.value, f = (x) => shock(x, I0, n, T);
          sl.fn((x) => f(x) * 1e3, { domain: [-0.25, 1], color: 'accent', width: 2.5 });
          sl.hline(0, { color: 'faint' });
          sl.vline(0, { color: 'faint' });
          const v1 = shockV(1e-3, I0, n, T);
          sl.vline(v1, { color: 'orange', dash: true });
          sl.dot(v1, 1, { color: 'orange', r: 5 });
          sl.tex(String.raw`v_{1\,\mathrm{mA}}`, v1, 6, { color: 'orange', dx: 8, size: 13, align: 'left' });
          sg.fn((x) => Math.max(f(x), 1e-30), { domain: [0, 1], color: 'accent', width: 2.5 });
          const dec = [];
          for (let e = -9; e <= -2; e++) { const i = Math.pow(10, e), x = shockV(i, I0, n, T); if (x > 0 && x < 1) { dec.push(x); sg.dot(x, i, { color: 'gold', r: 4.5 }); } }
          info = { v1, perDec: n * vT(T) * Math.LN10, meas: shockV(1e-3, I0, n, T) - shockV(1e-4, I0, n, T), n, T };
        });
        v.legend([['accent', '$i(v)$'], ['gold', 'one decade apart'], ['orange', '$v$ at $1$ mA']]);
        v.readout(() => info && `Thermal voltage $V_T = kT/q = ${v.fix(vT(info.T) * 1e3, 2)}$ mV. Voltage at $1$ mA: $${v.fix(info.v1, 3)}$ V. Measured from the curve, one decade of current (0.1 → 1 mA) costs $${v.fix(info.meas * 1e3, 1)}$ mV, matching $nV_T\\ln 10 = ${v.fix(info.perDec * 1e3, 1)}$ mV.`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Method',
      name: 'Load-line analysis',
      statement: String.raw`Let a nonlinear two-terminal element with characteristic $i = g(v)$ be connected to a linear network that, seen from the same terminals, has a Thévenin equivalent $(V_{\mathrm{Th}}, R_{\mathrm{Th}})$ with $R_{\mathrm{Th}}>0$ (circ-3.2). Then its voltage and current satisfy both $i = g(v)$ and the straight line $i = (V_{\mathrm{Th}} - v)/R_{\mathrm{Th}}$, the *load line*. The operating point (the $Q$ point) is an intersection of the two curves. If $g$ is continuous and nondecreasing on its voltage domain, the residual $F(v)=g(v)+(v-V_{\mathrm{Th}})/R_{\mathrm{Th}}$ is strictly increasing. An intersection is therefore unique when it exists, and exists if $F$ changes sign on a finite interval in that domain. The ideal Shockley diode is defined for all real $v$: its current tends to $-I_s$ as $v\to-\infty$ and to $+\infty$ as $v\to+\infty$, so the residual has opposite signs sufficiently far on either side.`,
      idea: String.raw`Replace everything except the nonlinear element by its Thévenin equivalent: this is legitimate because the rest is linear. Two relations now link the two unknowns $v, i$: the element law and the Kirchhoff law of the equivalent loop, $V_{\mathrm{Th}} = R_{\mathrm{Th}} i + v$. Solving simultaneously is a graphical intersection. Uniqueness: $g(v)-(V_{\mathrm{Th}}-v)/R_{\mathrm{Th}}$ is strictly increasing and changes sign, so it has exactly one zero. Numerically, Newton's method on this equation is what SPICE does: at each step it replaces the diode by its tangent line (a conductance and a current source) and solves the linear circuit. Take $R_{\rm Th}>0$ and a finite bracket $[a,b]$ on which $F(v)=g(v)+(v-V_{\rm Th})/R_{\rm Th}$ is continuous, with $F(a)<0<F(b)$. The intermediate value theorem (pma 4.23) supplies a zero. For a differentiable device with $g'\ge0$, $F'=g'+1/R_{\rm Th}>0$; the mean value theorem (pma 5.10) gives $F(y)>F(x)$ whenever $y>x$, so there is at most one zero. A continuous nondecreasing device has the same strict ordering directly. The ideal diode has the needed bracket because its bounded negative current is dominated by the load line's linear term as $v\to-\infty$, while its exponential dominates as $v\to+\infty$.`,
      caption: String.raw`The diode curve and the load line meet at the gold point $Q$. Drag the sources: $V_{\mathrm{Th}}$ slides the line parallel to itself, $R_{\mathrm{Th}}$ rotates it about its voltage intercept. The orange construction is Newton's method from the starting voltage $v_0$: each tangent to the diode curve is the linear "companion" circuit, and its intersection with the load line is the next guess. The schematic on the right is solved independently by the circuit simulator; its diode voltage agrees with the graphical $Q$.`,
      scope: String.raw`Memoryless nonlinear element in a network that is linear apart from it. With several nonlinear elements, the same idea becomes the intersection of surfaces and needs numerical solution.`,
      deps: ['circ-4.1', 'circ-3.2', 'pma-4.23', 'pma-5.10'],
      refs: ['Agarwal–Lang §4.3'],
      tags: ['load line', 'operating point', 'newton'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Load_line_(electronics)' },
      viz(v) {
        const s = v.stage({ x: [-0.2, 5.3], y: [-0.5, 10], axes: 'box', gutter: true, height: 320, weight: 1.35, xlabel: '$v_D$ (V)', ylabel: '$i_D$ (mA)', title: 'load line and device curve' });
        const sc = v.stage({ x: [-1.4, 5], y: [-0.7, 3.9], equal: true, axes: false, height: 320, weight: 0.75, title: 'the same circuit, solved by the simulator' });
        const IsV = 1e-14;
        const C = v.circuit(sc, [
          { type: 'V', id: 'V1', name: 'Vth', value: 3, at: [0, 3, 0, 0] }, { type: 'R', id: 'R1', name: 'Rth', value: 1000, at: [0, 3, 3, 3] },
          { type: 'D', id: 'D1', name: 'D', model: 'shockley', Is: IsV, n: 1, at: [3, 3, 3, 0] }, { type: 'W', at: [0, 0, 3, 0] }, { type: 'GND', at: [1.5, 0] }, { type: 'label', at: [3, 3], text: '$v_D$', dx: 18, dy: -4 },
        ]);
        const Vth = v.slider('$V_{\\mathrm{Th}}$', 0.5, 5, 3, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} V` });
        const Rth = v.slider('$R_{\\mathrm{Th}}$', 100, 10e3, 1000, { log: true, sig: 2, fmt: (x) => `${eng(x, 2)}Ω` });
        const nIt = v.slider('Newton steps', 0, 10, 6, { int: true, step: 1 });
        const v0 = v.slider('start $v_0$', 0.3, 1, 0.85, { step: 0.01, fmt: (x) => `${v.fix(x, 2)} V` });
        let info = null;
        v.render(() => {
          const V0 = Vth.value, R = Rth.value, q = loadDiode(V0, R, IsV, 1, 300);
          const xmax = Math.min(V0 + 0.1, 1.1), imax = (V0 / R) * 1e3;
          s.setView([-0.2, xmax], [-0.12 * imax, imax * 1.18]);
          s.clip(() => {
            s.fn((x) => shock(x, IsV, 1, 300) * 1e3, { domain: [-0.2, xmax], color: 'accent', width: 2.6 });
            s.line(0, imax, V0, 0, { color: 'ink', width: 2 });
            let x = v0.value;
            for (let k = 0; k < nIt.value; k++) {
              const ix = shock(x, IsV, 1, 300), g = (ix + IsV) / vT(300);
              const xn = (V0 / R - ix + g * x) / (1 / R + g);
              s.line(x, ix * 1e3, xn, (V0 - xn) / R * 1e3, { color: 'orange', width: 1.8 });
              s.line(x, 0, x, ix * 1e3, { color: 'orange', width: 1, dash: true, alpha: 0.7 });
              s.dot(x, ix * 1e3, { color: 'orange', r: 3.5 });
              x = clamp(xn, -0.2, 3);
            }
          });
          s.dot(q.v, q.i * 1e3, { color: 'gold', r: 7, label: 'Q', labelPos: 'nw' });
          C.part('V1').value = V0; C.part('R1').value = R;
          const res = C.dc(); C.draw({ result: res, vmax: 5 });
          info = { q, vSim: res.V(C.net.termNode.get('D1').a), iSim: res.I('D1') };
        });
        v.legend([['accent', 'device $i_D(v_D)$'], ['ink', 'load line'], ['orange', 'Newton tangents'], ['gold', '$Q$']]);
        v.readout(() => info && `Intersection: $v_D = ${v.fix(info.q.v, 4)}$ V, $i_D = ${v.fix(info.q.i * 1e3, 4)}$ mA. Simulator: $v_D = ${v.fix(info.vSim, 4)}$ V, $i_D = ${v.fix(info.iSim * 1e3, 4)}$ mA. The diode voltage hardly moves while $V_{\\mathrm{Th}}$ changes ten-fold.`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Method',
      name: 'Piecewise-linear device models',
      statement: String.raw`A nonlinear characteristic can be replaced by a few straight segments, each valid on a range of operating conditions, so that every segment gives an ordinary linear circuit. For a diode the usual choices are: the *ideal* diode ($v=0$ when conducting, $i=0$ when not), the *constant-drop* model (conducting when $v=V_{\mathrm{on}}$), and the *drop-plus-resistance* model ($v = V_{\mathrm{on}}+r_d i$). One assumes a segment, solves the linear circuit, and checks that the assumption holds ($i>0$ for "on", $v<V_{\mathrm{on}}$ for "off"); if not, tries the other segment. The error of each model is largest when the circuit's currents are small compared with the scale the model was fitted on.`,
      idea: String.raw`The exponential of 4.1 changes the voltage by only a few tens of millivolts for a change of current by a factor of two, so away from the knee it is well approximated by a vertical line at $V_{\mathrm{on}}$ with a slight tilt $r_d$. Choosing the segment is a combinatorial guess but each guess is a linear problem (circ-2.5), so the whole method trades one hard nonlinear equation for a few easy linear ones. Choosing $V_{\mathrm{on}}$ and $r_d$ as the tangent line at the actual operating point gives the local accuracy of small-signal analysis (4.4).`,
      caption: String.raw`The true diode curve (blue) with three models, all driven through a series resistor from a source of voltage $V_s$. The coloured dots are where each model's load-line intersection falls; the bar chart compares the four currents. Lower the source toward $V_{\mathrm{on}}$ and the ideal and constant-drop models become badly wrong while the tangent-fitted model stays close; with the source below zero all models agree that the current is zero. "Fit at Q" sets $V_{\mathrm{on}}$ and $r_d$ to the tangent line at the exact operating point.`,
      scope: String.raw`Each model is valid for the range of currents it was fitted on; the reverse-breakdown region and high-injection effects are ignored here.`,
      deps: ['circ-4.1', 'circ-4.2'],
      refs: ['Agarwal–Lang §4.4'],
      tags: ['piecewise-linear', 'diode model'],
      viz(v) {
        const IsV = 1e-14;
        const s = v.stage({ x: [-0.3, 1.3], y: [-0.5, 6], axes: 'box', gutter: true, height: 320, weight: 1.3, xlabel: '$v_D$ (V)', ylabel: '$i_D$ (mA)', title: 'device models and load line' });
        const sb = v.stage({ x: [0.4, 4.6], y: [0, 6], axes: 'box', gutter: true, height: 320, weight: 0.8, xticks: [[1, 'exact'], [2, 'ideal'], [3, 'const. drop'], [4, 'drop + r']], ylabel: '$i$ (mA)', title: 'circuit current under each model' });
        const Vs = v.slider('source $V_s$', -1, 10, 5, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} V` });
        const R = v.slider('$R$', 100, 10e3, 1000, { log: true, sig: 2, fmt: (x) => `${eng(x, 2)}Ω` });
        const Von = v.slider('$V_{\\mathrm{on}}$', 0.3, 0.9, 0.7, { step: 0.005, fmt: (x) => `${v.fix(x, 3)} V` });
        const rd = v.slider('$r_d$', 0, 100, 8, { step: 0.5, fmt: (x) => `${v.fix(x, 1)} Ω` });
        v.button('Fit at $Q$', () => {
          const q = loadDiode(Vs.value, R.value, IsV, 1, 300);
          if (q.i > 1e-9) { const r = vT(300) / q.i; rd.set(clamp(r, 0, 100)); Von.set(clamp(q.v - clamp(r, 0, 100) * q.i, 0.3, 0.9)); }
        });
        let info = null;
        v.render(() => {
          const V0 = Vs.value, Rv = R.value, imax = Math.max(0.5, (Math.max(V0, 0.5) / Rv) * 1e3 * 1.2);
          s.setView([-0.3, 1.3], [-0.1 * imax, imax]);
          const ex = loadDiode(V0, Rv, IsV, 1, 300);
          const iIdeal = V0 > 0 ? V0 / Rv : 0, iCvd = V0 > Von.value ? (V0 - Von.value) / Rv : 0, iPwl = V0 > Von.value ? (V0 - Von.value) / (Rv + rd.value) : 0;
          s.clip(() => {
            s.fn((x) => shock(x, IsV, 1, 300) * 1e3, { domain: [-0.3, 1.3], color: 'accent', width: 2.8 });
            s.path([[-0.3, 0], [0, 0], [0, imax * 2]], { color: 'green', width: 1.8, alpha: 0.85 });
            s.path([[-0.3, 0], [Von.value, 0], [Von.value, imax * 2]], { color: 'orange', width: 1.8, alpha: 0.85 });
            const sl = rd.value > 0 ? 1e3 / rd.value : 1e6;
            s.path([[-0.3, 0], [Von.value, 0], [Von.value + (imax * 2) / sl, imax * 2]], { color: 'purple', width: 1.8, alpha: 0.85 });
            if (V0 > 0) s.line(0, (V0 / Rv) * 1e3, V0, 0, { color: 'ink', width: 1.8, alpha: 0.8 });
          });
          s.dot(ex.v, ex.i * 1e3, { color: 'accent', r: 6 });
          if (iIdeal > 0) s.dot(0, iIdeal * 1e3, { color: 'green', r: 5 });
          if (iCvd > 0) s.dot(Von.value, iCvd * 1e3, { color: 'orange', r: 5 });
          if (iPwl > 0) s.dot(Von.value + rd.value * iPwl, iPwl * 1e3, { color: 'purple', r: 5 });
          const vals = [ex.i, iIdeal, iCvd, iPwl].map((x) => x * 1e3), cols = ['accent', 'green', 'orange', 'purple'];
          sb.setView([0.4, 4.6], [0, Math.max(0.5, ...vals) * 1.25]);
          vals.forEach((y, k) => { sb.rect(k + 0.65, 0, k + 1.35, y, { fill: cols[k], fillAlpha: 0.35, color: cols[k], width: 1.5 }); sb.text(v.fix(y, 2), k + 1, y, { size: 11.5, baseline: 'bottom', dy: -3, plate: true }); });
          info = { ex: ex.i, errs: [iIdeal, iCvd, iPwl].map((x) => (ex.i > 1e-12 ? (x - ex.i) / ex.i : 0)) };
        });
        v.legend([['accent', 'true diode'], ['green', 'ideal'], ['orange', 'constant drop'], ['purple', 'drop + $r_d$'], ['ink', 'load line']]);
        v.readout(() => info && `Errors in the current relative to the exact solution ($${v.fix(info.ex * 1e3, 3)}$ mA): ideal $${v.fix(info.errs[0] * 100, 1)}$ %, constant drop $${v.fix(info.errs[1] * 100, 1)}$ %, drop + $r_d$ $${v.fix(info.errs[2] * 100, 1)}$ %.`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Method',
      name: 'Small-signal (incremental) analysis',
      statement: String.raw`Let a nonlinear element $i = g(v)$ be biased at an operating point $(V_Q, I_Q)$ and superposed with a small signal, $v = V_Q + \delta v$. If $g$ is differentiable at $V_Q$ then $\delta i = g'(V_Q)\,\delta v + o(\delta v)$: for signals small enough the element behaves like a linear conductance $g_d = g'(V_Q)$, and the circuit's response to the signal may be found from the *incremental circuit* in which the DC sources are set to zero and each nonlinear element is replaced by its small-signal model. For a diode $g_d = (I_Q + I_s)/(nV_T)\approx I_Q/(nV_T)$. The error is of second order: for a sinusoid of amplitude $a$ on a diode, the second harmonic is about $a/(4nV_T)$ of the fundamental.`,
      idea: String.raw`This is Taylor's theorem (pma-5.15) applied to the element law: $g(V_Q+\delta v) = I_Q + g'(V_Q)\delta v + \tfrac12 g''(V_Q)\delta v^2+\dots$. The constant term is the DC solution (4.2), the linear term is the signal, and the neglected quadratic term produces the distortion. Because the DC and the incremental problems are separate, a network with fixed bias sources is solved twice, once nonlinearly for $Q$ and once linearly for the signal; circuit simulators do the same for their AC analysis.`,
      caption: String.raw`Left: the diode curve with its tangent at the bias point $Q$ (set by the bias voltage). The band around $V_Q$ is the input swing, the corresponding band on the vertical axis is the true current swing. Right: over two periods, the true current deviation (blue) against the tangent-line prediction $g_d\,\delta v$ (green dashed). For millivolt signals they are indistinguishable; raise the amplitude and the blue wave becomes lopsided (large positive peaks, compressed negative ones) and the readout shows the second harmonic appearing.`,
      scope: String.raw`Valid while the signal is small enough that second-order terms are negligible. For the exponential diode the relevant scale is $nV_T\approx 26$ mV, so "small" means well below about $10$ mV.`,
      deps: ['circ-4.2', 'pma-5.15'],
      refs: ['Agarwal–Lang §4.5', 'Agarwal–Lang §8.2'],
      tags: ['small signal', 'linearization', 'taylor'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Small-signal_model' },
      viz(v) {
        const IsV = 1e-14;
        const s = v.stage({ x: [0.55, 0.75], y: [0, 10], axes: 'box', gutter: true, height: 320, xlabel: '$v$ (V)', ylabel: '$i$ (mA)', title: 'bias point, tangent and swing' });
        const st = v.stage({ x: [0, 2], y: [-1, 1], axes: 'box', gutter: true, height: 320, xlabel: 'time (periods)', ylabel: '$\\delta i$ (mA)', title: 'current deviation: true vs linearized' });
        const VQ = v.slider('bias $V_Q$', 0.5, 0.72, 0.62, { step: 0.001, fmt: (x) => `${v.fix(x * 1000, 0)} mV` });
        const amp = v.slider('amplitude $a$', 0.5, 60, 4, { log: true, sig: 2, fmt: (x) => `${v.fix(x, x < 10 ? 1 : 0)} mV` });
        let info = null;
        v.render(() => {
          const V0 = VQ.value, a = amp.value * 1e-3, IQ = shock(V0, IsV, 1, 300), gd = (IQ + IsV) / vT(300), f = (x) => shock(x, IsV, 1, 300) * 1e3;
          const hi = Math.max(f(V0 + 0.06), 1);
          s.setView([V0 - 0.1, V0 + 0.1], [-0.05 * hi, hi]);
          s.vband(V0 - a, V0 + a, { color: 'orange', alpha: 0.18 });
          s.hband(f(V0 - a), f(V0 + a), { color: 'accent', alpha: 0.12 });
          s.fn(f, { domain: [V0 - 0.1, V0 + 0.1], color: 'accent', width: 2.6 });
          s.line(V0 - 0.1, IQ * 1e3 - gd * 1e3 * 0.1, V0 + 0.1, IQ * 1e3 + gd * 1e3 * 0.1, { color: 'green', width: 1.8, dash: true });
          s.dot(V0, IQ * 1e3, { color: 'gold', r: 6.5, label: 'Q', labelPos: 'nw' });
          const N = 64, tr = [], lin = [], c1 = [0, 0], c2 = [0, 0];
          const dev = (th) => f(V0 + a * Math.sin(th)) - IQ * 1e3;
          for (let k = 0; k < N; k++) { const th = (2 * Math.PI * k) / N, d = dev(th); c1[0] += d * Math.sin(th); c1[1] += d * Math.cos(th); c2[0] += d * Math.sin(2 * th); c2[1] += d * Math.cos(2 * th); }
          const A1 = Math.hypot(c1[0], c1[1]) * 2 / N, A2 = Math.hypot(c2[0], c2[1]) * 2 / N, peak = gd * 1e3 * a;
          const yr = Math.max(peak * 1.5, 1e-3, Math.abs(dev(Math.PI / 2)) * 1.1);
          st.setView([0, 2], [-yr, yr]);
          st.fn((t) => dev(2 * Math.PI * t), { domain: [0, 2], color: 'accent', width: 2.4, n: 400 });
          st.fn((t) => peak * Math.sin(2 * Math.PI * t), { domain: [0, 2], color: 'green', width: 2, dash: true, n: 400 });
          st.hline(0, { color: 'faint' });
          info = { gd, rd: 1 / gd, IQ, A1, A2, ratio: A1 / peak, a };
        });
        v.legend([['accent', 'true response'], ['green', 'tangent prediction $g_d\\,\\delta v$'], ['orange', 'input swing'], ['gold', '$Q$']]);
        v.readout(() => info && `$I_Q = ${v.fix(info.IQ * 1e3, 3)}$ mA, $g_d = I_Q/V_T = ${v.fix(info.gd * 1e3, 2)}$ mS, $r_d = ${v.fix(info.rd, 1)}$ Ω. Fundamental of the true response / linear prediction $= ${v.fix(info.ratio, 3)}$; second harmonic $= ${v.fix((info.A2 / info.A1) * 100, 2)}$ % of the fundamental (small-signal estimate $a/4V_T = ${v.fix((info.a / (4 * vT(300))) * 100, 2)}$ %).`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Invention',
      name: 'Rectifiers: half-wave, full-wave and bridge',
      statement: String.raw`A rectifier turns an alternating voltage into one of a single sign. A *half-wave* rectifier is one diode in series with the load; a *full-wave bridge* uses four diodes so that both half-cycles reach the load with the same polarity, with two diode drops in the path. With a smoothing capacitor $C$ across a load $R_L$, the output follows the peaks of the rectified input and decays as $e^{-t/R_LC}$ between them. When $R_LC\gg 1/f$ the peak-to-peak ripple is approximately $\Delta V\approx I_{\mathrm{load}}/(f_rC)$, where the ripple frequency is $f_r=f$ for the half-wave and $f_r = 2f$ for the full-wave rectifier.`,
      idea: String.raw`A diode conducts while the source can support the capacitor voltage and load current; during the off interval the resistor discharges the capacitor exponentially. For small ripple, $i=C\,dv/dt$ gives $\Delta V\approx I_{\mathrm{load}}\Delta t/C$, with nearly a full interval $\Delta t\approx1/f_r$ between charging peaks. The bridge doubles the peak frequency, so its ripple is roughly half in that limit; its extra diode drop also lowers the output level. The factor of two and the inverse-capacitance rule are approximations, not identities at arbitrary load. During each diode-off interval the isolated parallel load obeys $C\dot v+v/R_L=0$, with fixed $R_L,C>0$. The integrating-factor formula (ode 1.4) gives $v(t_0+s)=v(t_0)e^{-s/(R_LC)}$ until conduction resumes. The drop over that interval is exactly $v(t_0)[1-e^{-s/(R_LC)}]$; replacing it by $v(t_0)s/(R_LC)$ and taking $s\approx1/f_r$ produces the small-ripple estimate. The exponential solution is exact for the off interval of this model; the timing replacement and nearly constant load-current approximation are not exact at arbitrary load.`,
      caption: String.raw`Three cycles of the periodic steady solution are shown. The blue output follows the rectified sine during conduction and the exact RC exponential during discharge; no arbitrary warm-up interval is used. The orange band marks the analytic minimum and maximum. On the right, both exact-model ripple curves remain visible throughout the controls. Dashed estimates use peak output current $I_{pk}/(f_rC)$ and are drawn only where $R_LCf\ge3$; even there they are approximations. At small $RCf$ neither exact halving nor $1/C$ scaling should be expected.`,
      scope: String.raw`Ideal floating sinusoidal source, fixed $0.7$ V diode drops and a parallel resistor–capacitor load. The bridge output is measured across its load. Source resistance/inductance, diode leakage and switching dynamics are omitted. The periodic envelope and turn-on/off angles are derived for this model; no measured supply is fitted.`,
      credit: 'Circuit treatment: D. A. Steck, Analog and Digital Electronics, revision 1.0.10 (2026), §3.6; periodic-envelope calculation derived here',
      verify: false,
      deps: ['circ-4.3', 'ode-1.4'],
      refs: ['Steck, Analog and Digital Electronics, rev. 1.0.10 (2026), §3.6, pp. 83–85'],
      tags: ['rectifier', 'ripple', 'power supply'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rectifier' },
      viz(v) {
        const VD = 0.7;
        const sim = rectifierEnvelope;
        const s = v.stage({ x: [0, 3], y: [-1, 1], axes: 'box', gutter: true, height: 320, weight: 1.3, xlabel: 'time (cycles)', ylabel: 'voltage (V)', title: 'steady-state output' });
        const sr = v.stage({ x: [1e-5, 1e-2], y: [0.01, 30], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, weight: 0.85, xlabel: '$C$ (F)', ylabel: 'ripple (V)', title: 'ripple against capacitance' });
        const kind = v.select('rectifier', [{ value: 'half', label: 'half-wave' }, { value: 'full', label: 'full-wave bridge' }], 'half');
        const fsel = v.select('mains', [{ value: 50, label: '50 Hz' }, { value: 60, label: '60 Hz' }], 50);
        const Vp = v.slider('peak $V_p$', 5, 24, 12, { step: 0.5, fmt: (x) => `${v.fix(x, 1)} V` });
        const Cs = v.slider('$C$', 1e-5, 1e-2, 4.7e-4, { log: true, sig: 2, fmt: (x) => `${eng(x, 2)}F` });
        const RL = v.slider('load $R_L$', 50, 5000, 500, { log: true, sig: 2, fmt: (x) => `${eng(x, 2)}Ω` });
        let info = null;
        v.render(() => {
          const f = fsel.value, T = 1 / f, r = sim(kind.value, Vp.value, RL.value, Cs.value, f), n = r.out.length;
          s.setView([0, 3], [-Vp.value * 1.1, Vp.value * 1.1]);
          const ts = r.out.map((_, k) => (k * r.dt) / T);
          s.path(ts.map((t, k) => [t, r.vin[k]]), { color: 'faint', width: 1.6 });
          const { vmax, vmin } = r;
          s.hband(vmin, vmax, { color: 'orange', alpha: 0.18 });
          s.path(ts.map((t, k) => [t, r.out[k]]), { color: 'accent', width: 2.6 });
          s.hline(0, { color: 'faint' });
          const minRipple = Math.min(...['half', 'full'].map(kd => sim(kd, Vp.value, RL.value, 1e-2, f).ripple));
          sr.setView([1e-5, 1e-2], [Math.max(1e-6, minRipple * .7), Vp.value * 1.3]);
          for (const kd of ['half', 'full']) {
            const Cl = [], Rl = [];
            for (let e = -5; e <= -2 + 1e-9; e += 0.1) { const C = Math.pow(10, e); Cl.push([C, Math.max(sim(kd, Vp.value, RL.value, C, f).ripple, 1e-4)]); }
            sr.path(Cl, { color: kd === 'half' ? 'purple' : 'teal', width: 2.2 });
            const Ip = (Vp.value - (kd === 'half' ? VD : 2 * VD)) / RL.value, fr = kd === 'half' ? f : 2 * f;
            const estimateMin = Math.max(1e-5, 3 / (RL.value * f));
            if (estimateMin <= 1e-2) sr.fn((C) => Ip / (fr * C), { domain: [estimateMin, 1e-2], color: kd === 'half' ? 'purple' : 'teal', width: 1.2, dash: true, alpha: 0.8 });
          }
          const rp = r.ripple;
          sr.dot(Cs.value, Math.max(rp, 1e-4), { color: 'gold', r: 6.5 });
          const Vavg = r.out.reduce((a, b) => a + b, 0) / n, fr = kind.value === 'half' ? f : 2 * f, Ipk = (Vp.value - (kind.value === 'half' ? VD : 2 * VD)) / RL.value;
          info = { rp, est: Ipk / (fr * Cs.value), Vavg, vmax, vmin, fr, tau: RL.value * Cs.value * f };
        });
        v.legend([['faint', 'AC source'], ['accent', 'rectified, smoothed'], ['orange', 'ripple'], ['purple', 'half-wave'], ['teal', 'bridge']]);
        v.readout(() => info && `Ripple frequency ${info.fr} Hz. Exact-model ripple $${v.fix(info.rp, 3)}$ V (output between $${v.fix(info.vmin, 2)}$ and $${v.fix(info.vmax, 2)}$ V); peak-current estimate $I_{pk}/(f_rC) = ${v.fix(info.est, 3)}$ V. $R_LCf = ${v.fix(info.tau, 1)}$${info.tau < 3 ? ' (too small for the estimate to be accurate)' : ''}.`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Concept',
      name: 'Digital abstraction: noise margins and the static discipline',
      statement: String.raw`In the digital abstraction each signal is a voltage that is interpreted as logic $0$ if it lies below $V_{IL}$ and as logic $1$ if it lies above $V_{IH}$ ($V_{IL}<V_{IH}$); between them the value is undefined and must not occur at inputs. A gate obeys the *static discipline* if every valid input produces an output that is more strictly valid: below $V_{OL}$ or above $V_{OH}$, with $V_{OL}<V_{IL}$ and $V_{OH}>V_{IH}$. The *noise margins* are $NM_L = V_{IL}-V_{OL}$ and $NM_H = V_{OH}-V_{IH}$. If each stage satisfies the discipline, any noise smaller than the margins added at a gate input is removed by the gate, and arbitrarily long chains compute without error.`,
      idea: String.raw`A gate with a steep transfer curve $v_{out}=f(v_{in})$ is a regenerator. If the gain magnitude $|f'|>1$ in the middle and $<1$ near the rails, the iteration $x\mapsto f(x)$ has two attracting levels near the supply and one repelling midpoint, so deviations from the nominal logic levels shrink at each stage. The standard choice puts $V_{IL}$ and $V_{IH}$ at the two points where the slope is $-1$; outside them the gain is below 1 and the output is within the output band. With gain $\le 1$ everywhere no such points exist and the chain forgets its input.`,
      caption: String.raw`Left: the transfer curve $v_{out}=f(v_{in})$ of an inverter with adjustable gain, the identity line, and the valid bands (green outputs, orange inputs). Right: twelve signals pass through a chain of eight inverters with a random disturbance of up to $\pm$ the noise amplitude added at every input; the start voltage is deliberately degraded. With enough gain every run is restored to a clean level and alternates between the rails; lower the gain toward 1 or raise the noise above the margin and the runs drift to the midpoint or flip. The gold line marks the start voltage on the transfer curve; run 1 is drawn in blue.`,
      scope: String.raw`Static (DC) behaviour of memoryless gates with the tanh-shaped transfer curve used here (an illustrative model); real gates also need timing margins.`,
      deps: ['circ-1.9'],
      refs: ['Agarwal–Lang §5.1'],
      tags: ['digital', 'noise margin', 'regeneration'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Noise_margin' },
      viz(v) {
        const Vdd = 5, K = 8;
        const s = v.stage({ x: [0, Vdd], y: [0, Vdd], equal: true, axes: 'box', gutter: true, height: 340, weight: 0.95, xlabel: '$v_{in}$ (V)', ylabel: '$v_{out}$ (V)', title: 'transfer curve and valid bands' });
        const sc = v.stage({ x: [0, K], y: [0, Vdd], axes: 'box', gutter: true, height: 340, weight: 1.1, xlabel: 'gate number', ylabel: 'voltage (V)', title: 'a chain of eight gates, noise at every input' });
        const gain = v.slider('mid-point gain $|f\'|$', 0.6, 8, 2.5, { log: true, sig: 2, fmt: (x) => v.fix(x, 2) });
        const noise = v.slider('noise $\\pm$', 0, 2.5, 0.6, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} V` });
        const start = v.slider('start voltage', 0, Vdd, 3, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} V` });
        let seed = 7;
        v.button('Resample noise', () => { seed += 1; });
        let info = null;
        v.render(() => {
          const g = gain.value, f = (x) => (Vdd / 2) * (1 - Math.tanh(g * ((2 * x) / Vdd - 1)));
          let VIL = NaN, VIH = NaN, VOL = NaN, VOH = NaN;
          if (g > 1) { const u0 = Math.acosh(Math.sqrt(g)); VIL = (Vdd / 2) * (1 - u0 / g); VIH = (Vdd / 2) * (1 + u0 / g); VOH = f(VIL); VOL = f(VIH); }
          const ok = g > 1 && VOH > VIH && VOL < VIL;
          if (ok) { s.vband(0, VIL, { color: 'orange', alpha: 0.13 }); s.vband(VIH, Vdd, { color: 'orange', alpha: 0.13 }); s.hband(0, VOL, { color: 'green', alpha: 0.13 }); s.hband(VOH, Vdd, { color: 'green', alpha: 0.13 }); }
          s.line(0, 0, Vdd, Vdd, { color: 'faint', width: 1.2, dash: true });
          s.fn(f, { domain: [0, Vdd], color: 'accent', width: 2.8 });
          if (ok) { s.dot(VIL, VOH, { color: 'orange', r: 4.5 }); s.dot(VIH, VOL, { color: 'orange', r: 4.5 }); }
          const rng = v.rng(seed), runs = [];
          const nr = 12, goodHigh = [];
          for (let r = 0; r < nr; r++) {
            let x = start.value; const tr = [x];
            for (let k = 0; k < K; k++) { x = clamp(f(clamp(x + (rng() * 2 - 1) * noise.value, 0, Vdd)), 0, Vdd); tr.push(x); }
            runs.push(tr);
          }
          runs.forEach((tr, r) => sc.path(tr.map((y, k) => [k, y]), { color: r === 0 ? 'accent' : 'muted', width: r === 0 ? 2.6 : 1.2, alpha: r === 0 ? 1 : 0.55 }));
          if (ok) { sc.hband(0, VOL, { color: 'green', alpha: 0.12 }); sc.hband(VOH, Vdd, { color: 'green', alpha: 0.12 }); }
          sc.hline(Vdd / 2, { color: 'faint', dash: true });
          s.vline(start.value, { color: 'gold', width: 1.4, dash: true });
          s.dot(start.value, f(start.value), { color: 'gold', r: 5 });
          // final correctness: stage 8 logic value vs ideal noiseless propagation
          let nl = start.value; for (let k = 0; k < K; k++) nl = f(nl);
          const wantHigh = nl > Vdd / 2;
          const clean = runs.filter((tr) => (wantHigh ? tr[K] > (ok ? VOH : 0.8 * Vdd) : tr[K] < (ok ? VOL : 0.2 * Vdd))).length;
          info = { ok, VIL, VIH, VOL, VOH, clean, nr, g };
        });
        v.legend([['accent', 'transfer curve / run 1'], ['gold', 'start level'], ['orange', 'valid inputs'], ['green', 'valid outputs']]);
        v.readout(() => info && (info.ok
          ? `$V_{IL}=${v.fix(info.VIL, 2)}$, $V_{IH}=${v.fix(info.VIH, 2)}$, $V_{OL}=${v.fix(info.VOL, 3)}$, $V_{OH}=${v.fix(info.VOH, 3)}$ V; noise margins $NM_L=${v.fix(info.VIL - info.VOL, 2)}$ V, $NM_H=${v.fix(info.VOH - info.VIH, 2)}$ V. After 8 gates ${info.clean} of ${info.nr} runs are in the clean output band.`
          : `Gain $${v.fix(info.g, 2)}\\le 1$: the slope never reaches $-1$, so no valid bands exist and the chain does not restore levels (${info.clean} of ${info.nr} runs end in a clean band).`));
      },
    },
  ],
};
