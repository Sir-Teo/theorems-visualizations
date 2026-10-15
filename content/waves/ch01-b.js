// Waves & Optics — Chapter 1: The wave equation (part b: junctions, sound, three dimensions, moving sources)
import { TAU, pulse, dpulse, makeChain, stackReflection, retarded, movingSourceSound, wall, rod, diverging } from './ch01.shared.js';

/** Draw a string from a chain, coloured per medium: colour(x) and width(x) pick the style of each gap. */
function drawChain(s, C, xa, xb, style, sy = 1) {
  let run = [], key = null;
  const flush = () => { if (run.length > 1) s.path(run, key ? style(key) : {}); };
  for (let i = 0; i < C.N; i++) {
    const x = C.x[i]; if (x < xa - 1e-9 || x > xb + 1e-9) continue;
    const k = style.key(x);
    if (k !== key && run.length) { run.push([x, C.y[i] * sy]); flush(); run = [[x, C.y[i] * sy]]; key = k; continue; }
    key = k; run.push([x, C.y[i] * sy]);
  }
  flush();
}

export default {
  collection: 'waves',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Theorem',
      name: 'Reflection and transmission at a junction',
      statement: String.raw`Two strings under the same tension $T$, with impedances $Z_1=\sqrt{T\mu_1}$ and $Z_2=\sqrt{T\mu_2}$, are joined at $x=0$. A wave $f(x-c_1t)$ arriving from the left produces a reflected wave and a transmitted wave,
$$y=\begin{cases}f(x-c_1t)+r\,f(-x-c_1t), & x<0,\\[2pt] \tau\,f\big(\tfrac{c_1}{c_2}x-c_1t\big), & x>0,\end{cases}\qquad r=\frac{Z_1-Z_2}{Z_1+Z_2},\quad \tau=\frac{2Z_1}{Z_1+Z_2}.$$
The shapes are not distorted; the transmitted one is stretched or squeezed by $c_2/c_1$. The reflected pulse is **inverted** when the second string is heavier ($Z_2>Z_1$) and upright when it is lighter; a fixed end ($Z_2\to\infty$) gives $r=-1$, a free end ($Z_2\to0$) gives $r=+1$. Energy is conserved: the fractions of the incident energy reflected and transmitted are
$$R=r^2,\qquad \mathcal T=\frac{Z_2}{Z_1}\,\tau^2,\qquad R+\mathcal T=1 .$$`,
      idea: String.raw`On each side the solution is a d'Alembert sum (1.3) with only outgoing waves added to the incident one. Two conditions hold at the joint: the string does not break, so $y$ is continuous (giving $1+r=\tau$), and the massless joint feels no net force, so $Ty_x$ is continuous. Using $F=Z\dot y$ for each travelling wave (1.8), the second condition becomes $Z_1(1-r)=Z_2\tau$. Solving the two linear equations gives $r$ and $\tau$. The energy fractions follow from the flux $P=Z\dot y^{2}$ (1.7): $Z_1r^2+Z_2\tau^2=Z_1$.`,
      caption: String.raw`A skewed pulse, with a steep front and a long tail, runs into a joint. Drag the gold handle along the bottom-left graph to change the impedance ratio $Z_2/Z_1$; the right-hand string is drawn thicker when it is heavier. The simulation is a beaded string with no junction rule built in. The dashed green curves are the predictions $r\,f$ and $\tau f$; bottom right, the energy ledger is measured from the beads. Watch the reflected pulse flip over as $Z_2$ passes $Z_1$, and note that the steep front still leads in both directions. Use the buttons for a fixed end (inverted) and a free end (upright, doubled at the moment of reflection).`,
      deps: ['waves-1.8', 'waves-1.3'],
      see: ['circ-9.4', 'pde-2.7', 'em-11.9', 'qm-3.13', 'imaging-5.2', 'music-11.3'],
      refs: ['Crawford ch. 5'],
      tags: ['reflection', 'impedance', 'energy'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Reflection_coefficient' },
      viz(v) {
        const M = v.M, A = 1, W = 0.55, X0 = -2, DEL = 0.008, TE = 5.6;
        const end = v.select('right-hand side', [{ value: 'join', label: 'second string' }, { value: 'fixed', label: 'fixed end' }, { value: 'free', label: 'free end' }], 'join');
        const s = v.stage({ x: [-3.2, 3.2], y: [-1.3, 2.15], height: 240, axes: false, full: true });
        const cs = v.stage({ x: [0.05, 20], y: [-1.15, 2.1], xlog: true, height: 230, axes: 'box', xlabel: 'impedance ratio Z₂/Z₁', yticks: [-1, 0, 1, 2], title: 'coefficients against impedance ratio', weight: 1.5 });
        const es = v.stage({ x: [0, 4], y: [0, 1.18], height: 230, axes: 'box', xticks: [], yticks: [0, 0.5, 1], title: 'energy ledger (measured)', weight: 1 });
        const hz = cs.handle(3, -0.95, { color: 'gold', constrain: (x, y) => [M.clamp(x, 0.06, 18), -0.95] });
        const f = (xi) => A * pulse('skew', (xi - X0) / W);
        let C = null, key = '', E0 = 1;
        const build = () => {
          const z = hz.x, mode = end.value, x1 = mode === 'join' ? 4.5 / z + 0.6 : 0;
          C = makeChain({ x0: -7.5, x1, mu: (x) => (x < 0 ? 1 : z * z), T: 1, delta: DEL, breaks: [0], left: 'fixed', right: mode === 'free' ? 'free' : 'fixed' });
          C.set(f, (x) => -A * dpulse('skew', (x - X0) / W) / W);
          E0 = C.energy().E;
        };
        const coef = () => { const z = end.value === 'join' ? hz.x : end.value === 'fixed' ? Infinity : 0; if (z === Infinity) return { r: -1, t: 0, z }; return { r: (1 - z) / (1 + z), t: 2 / (1 + z), z }; };
        let meas = null, tau = 0;
        v.animate((t) => {
          const k = hz.x.toFixed(4) + end.value;
          tau = Math.min(t, TE);
          if (k !== key || tau < C.t - 1e-9) { key = k; build(); }
          C.advance(tau, 0.5 * DEL);
          const { r, t: tr, z } = coef(), c2 = isFinite(z) && z > 0 ? 1 / z : 0, mode = end.value;
          // ---- strings
          s.hline(0, { color: 'faint', width: 1 });
          if (mode === 'join') s.rect(0, -1.3, 3.2, 2.15, { fill: 'purple', fillAlpha: 0.05, stroke: false });
          const style = (key2) => (key2 === 'L' ? { color: 'accent', width: 2.6 } : { color: 'purple', width: M.clamp(2.6 * Math.sqrt(z), 1.2, 9) });
          style.key = (x) => (x < 0 ? 'L' : 'R');
          drawChain(s, C, -3.2, 3.2, style);
          // predictions (d'Alembert with the junction coefficients)
          s.fn((x) => f(x - tau) + r * f(-x - tau), { domain: [-3.2, 0], color: 'green', width: 1.6, dash: [6, 5] });
          if (mode === 'join') s.fn((x) => tr * f(x / c2 - tau), { domain: [0, 3.2], color: 'green', width: 1.6, dash: [6, 5] });
          if (mode === 'fixed') wall(s, 0, -0.9, 0.9, 1, 0.08);
          if (mode === 'free') rod(s, 0, -1.25, 2.1, C.y[C.N - 1]);
          if (mode === 'join') { s.dot(0, C.at(0), { r: 4.5, color: 'ink' }); s.text(`Z₂ = ${v.fix(z, 2)} Z₁`, 3.1, 1.95, { color: 'purple', size: 12, align: 'right', weight: 600 }); }
          s.text('Z₁', -3.1, 1.95, { color: 'accent', size: 12, weight: 600 });
          s.corner(`t = ${v.fix(tau, 2)} (pulse reaches the joint at t ≈ 2)`, 'bl', { color: 'muted' });
          // ---- coefficient curves
          cs.hline(0, { color: 'faint', width: 1 }); cs.vline(1, { color: 'faint', width: 1, dash: [3, 4] });
          cs.fn((u) => (1 - u) / (1 + u), { color: 'orange', width: 2.4 });
          cs.fn((u) => 2 / (1 + u), { color: 'teal', width: 2.4 });
          cs.fn((u) => ((1 - u) / (1 + u)) ** 2, { color: 'orange', width: 1.4, dash: [5, 4] });
          cs.fn((u) => (4 * u) / (1 + u) ** 2, { color: 'teal', width: 1.4, dash: [5, 4] });
          cs.text('τ', 0.07, 1.9, { color: 'teal', size: 14, math: true });
          cs.text('r', 0.07, 0.83, { color: 'orange', size: 14, math: true });
          cs.text('R = r²', 12, 0.8, { color: 'orange', size: 11.5, align: 'right', baseline: 'bottom' });
          cs.text('T = (Z₂/Z₁)τ²', 0.065, 0.4, { color: 'teal', size: 11.5, baseline: 'bottom' });
          cs.text('heavier →', 1.12, -0.62, { color: 'muted', size: 11.5 });
          cs.text('← lighter', 0.9, -0.62, { color: 'muted', size: 11.5, align: 'right' });
          hz.visible = mode === 'join';
          if (mode === 'join') { cs.vline(hz.x, { color: 'gold', width: 1.2 }); }
          // ---- measurements
          const EL = C.energy(-Infinity, -1e-9).E, ER = C.energy(-1e-9, Infinity).E;
          const sep = tau > 3.3;
          let rm = NaN, tm = NaN;
          if (sep) { rm = C.peak(-7, -0.3).y / A; tm = mode === 'join' ? C.peak(0.01, 1e9).y / A : NaN; }
          meas = { EL, ER, rm, tm, sep };
          // ---- energy ledger
          const bars = [['incident', E0 / E0, 'accent'], ['reflected', sep ? EL / E0 : NaN, 'orange'], ['transmitted', sep ? ER / E0 : NaN, 'teal']];
          bars.forEach(([lab, val, col], i) => {
            const x = 0.35 + i * 1.2;
            if (isFinite(val)) es.rect(x, 0, x + 0.8, val, { fill: col, fillAlpha: 0.55, color: col, width: 1.2 });
            es.text(lab, x + 0.4, -0.06, { color: 'ink', size: 11.5, align: 'center', baseline: 'top' });
          });
          if (sep) {
            const x = 0.35 + 1.2 * 1; es.rect(x, EL / E0, x + 0.8, (EL + ER) / E0, { fill: 'teal', fillAlpha: 0.18, stroke: false });
            es.hline(1, { color: 'green', width: 1.4, dash: [5, 4] });
            es.text(`sum ${v.fix((EL + ER) / E0, 4)}`, 3.95, 1.1, { color: 'green', size: 11.5, align: 'right' });
          } else es.text('waiting for the pulses to separate…', 2.75, 0.6, { color: 'muted', size: 11.5, align: 'center' });
        }, { period: TE + 0.8, still: 4.3 });
        v.legend([['accent', 'first string'], ['purple', 'second string'], ['green', 'prediction $r\\,f$, $\\tau f$', { dash: true }], ['orange', '$r$, $R$'], ['teal', '$\\tau$, $\\mathcal T$']]);
        v.readout(() => {
          const { r, t: tr, z } = coef(), m = meas || {};
          const zs = end.value === 'join' ? `$Z_2/Z_1$ = ${v.fix(z, 3)} ($\\mu_2/\\mu_1$ = ${v.fix(z * z, 3)}, $c_2/c_1$ = ${v.fix(1 / z, 3)})` : end.value === 'fixed' ? 'fixed end ($Z_2\\to\\infty$)' : 'free end ($Z_2\\to0$)';
          const meas1 = m.sep ? `measured ${v.fix(m.rm, 3)}` : 'measured once the pulses have separated';
          const t1 = end.value === 'join' ? ` · $\\tau=2Z_1/(Z_1+Z_2)$ = ${v.fix(tr, 3)}${m.sep ? `, measured ${v.fix(m.tm, 3)}` : ''}` : '';
          const en = m.sep ? ` · energy: reflected ${v.fix(m.EL / E0, 4)} (theory $r^2$ = ${v.fix(r * r, 4)}), transmitted ${v.fix(m.ER / E0, 4)} (theory ${v.fix(end.value === 'join' ? z * tr * tr : 0, 4)}), total ${v.fix((m.EL + m.ER) / E0, 4)}` : '';
          return `${zs} · $r=(Z_1-Z_2)/(Z_1+Z_2)$ = ${v.fix(r, 3)}, ${meas1}${t1}${en}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Method',
      name: 'Impedance matching',
      statement: String.raw`A wave passing from impedance $Z_1$ to $Z_3$ through an abrupt joint loses the fraction $\big(\frac{Z_1-Z_3}{Z_1+Z_3}\big)^2$ of its energy to reflection. Two ways of inserting an intermediate section remove that loss:
(a) **Quarter-wave matching.** A layer of impedance $Z_2=\sqrt{Z_1Z_3}$ and thickness $d=\lambda_2/4$ (a quarter of the wavelength *inside* the layer) reflects nothing at that frequency. In general the layer's input impedance is $Z_{\rm in}=Z_2\,\frac{Z_3+iZ_2\tan k_2d}{Z_2+iZ_3\tan k_2d}$, and at $k_2d=\pi/2$ it equals $Z_2^2/Z_3=Z_1$. The match is perfect only near the design frequency.
(b) **Tapering.** If the impedance changes gradually, over a length $\ell$ much longer than the wavelength, reflection is small at all frequencies above about $c/\ell$. For an exponential taper the reflected energy falls off rapidly once $\ell\gtrsim\lambda/2$.`,
      idea: String.raw`At a quarter-wave layer the wave reflected from the second joint makes a round trip of half a wavelength, so it returns half a cycle out of step with the reflection from the first joint. If the two reflections have equal strength, which is what $Z_2=\sqrt{Z_1Z_3}$ arranges, they cancel, and by energy conservation (1.9) everything is transmitted. A taper splits one big reflection into many tiny ones spread over the length $\ell$. Their phases wind through many cycles and mostly cancel, so what is left comes only from the abrupt ends of the taper. The same ideas underlie lens coatings, horn loudspeakers, transformers and the middle ear.`,
      caption: String.raw`A tone burst on a light string runs into a string 9 times heavier in impedance (drawn thicker and darker). With an abrupt joint 64 % of the energy comes back. Choose **quarter-wave layer** and drag the gold handle on the bottom-left graph to set the layer thickness. The reflected burst shrinks to almost nothing at $d=\lambda_2/4$, and grows again at $\lambda_2/2$. The curve is the transfer-matrix prediction averaged over the burst's spectrum; the dot is measured from the beaded-string simulation once the echo has separated. Choose **tapered** and lengthen the taper: the echo fades for every taper longer than about half a wavelength. Bottom right: the impedance profile along the string.`,
      deps: ['waves-1.9'],
      see: ['circ-9.7', 'circ-7.14', 'music-5.1', 'music-11.4'],
      refs: ['Crawford ch. 5'],
      tags: ['impedance matching', 'reflection'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quarter-wave_impedance_transformer' },
      viz(v) {
        const M = v.M, LAM = 0.5, K0 = TAU / LAM, SIG = 0.9, X0 = -3.6, DEL = 0.009, TE = 9.5;
        const mode = v.select('between the strings', [{ value: 'abrupt', label: 'abrupt joint' }, { value: 'qw', label: 'quarter-wave layer' }, { value: 'taper', label: 'tapered' }], 'qw');
        const z3S = v.slider('impedance ratio $Z_3/Z_1$', 2, 16, 9, { step: 0.5 });
        const z2S = v.slider('layer impedance $Z_2/Z_1$', 1, 16, 3, { step: 0.05 });
        const gm = v.button('set $Z_2=\\sqrt{Z_1Z_3}$', () => z2S.set(Math.sqrt(z3S.value)));
        const s = v.stage({ x: [-5.6, 2.2], y: [-1.25, 1.25], height: 220, axes: false, full: true });
        const gp = v.stage({ x: [0, 1.25], y: [0, 0.72], height: 230, axes: 'box', xlabel: 'layer thickness d / λ₂', ylabel: 'reflected energy', title: 'reflected fraction of the energy', weight: 1.5 });
        const zp = v.stage({ x: [-1, 2.2], y: [0.7, 20], ylog: true, height: 230, axes: 'box', xlabel: 'x', ylabel: 'Z / Z₁', title: 'impedance along the string', weight: 1 });
        const gTop = () => Math.max(0.2, (((z3S.value - 1) / (z3S.value + 1)) ** 2) * 1.12);
        const hd = gp.handle(0.25, 0.6, { color: 'gold', constrain: (x) => [M.clamp(x, 0, 1.25), 0.94 * gTop()] });
        // impedance profile (T = 1, so Z = √μ and c = 1/Z); the section starts at x = 0 and has length len
        const Zat = (x, len) => {
          const z3 = z3S.value, m = mode.value;
          if (x < 0) return 1;
          if (m === 'abrupt' || len <= 0) return z3;
          if (m === 'qw') return x < len ? z2S.value : z3;
          return x < len ? Math.pow(z3, x / len) : z3;
        };
        const secLen = () => {
          const m = mode.value; if (m === 'abrupt') return 0;
          if (m === 'qw') return hd.x * LAM / z2S.value; // λ₂ = λ₁ Z₁/Z₂
          return hd.x * LAM; // taper length in units of λ₁
        };
        const layersFor = (len) => {
          const m = mode.value;
          if (m === 'abrupt' || len <= 0) return [];
          if (m === 'qw') return [[z2S.value, len]];
          const n = 160; return M.range(n).map((i) => [Math.pow(z3S.value, (i + 0.5) / n), len / n]);
        };
        // spectrum of the burst: Gaussian around K0 with rms width 1/SIG in k
        const ks = M.range(41).map((i) => K0 + ((i - 20) * 0.2) / SIG), wk = ks.map((k) => Math.exp(-(((k - K0) * SIG) ** 2) / 2));
        const Rpred = (len) => { const L = layersFor(len); let a = 0, b = 0; ks.forEach((k, i) => { const q = stackReflection(1, L, z3S.value, k); a += wk[i] * (q.re * q.re + q.im * q.im); b += wk[i]; }); return a / b; };
        let cKey = '', curve = [];
        const predCurve = () => {
          const k = mode.value + z3S.value + z2S.value; if (k === cKey) return curve; cKey = k;
          curve = M.range(126).map((i) => { const u = (1.25 * i) / 125, len = mode.value === 'qw' ? u * LAM / z2S.value : u * LAM; return [u, Rpred(len)]; });
          return curve;
        };
        const burst = (x) => Math.exp(-(((x - X0) / SIG) ** 2)) * Math.sin(K0 * (x - X0));
        const burstV = (x) => { const u = (x - X0) / SIG, g = Math.exp(-u * u); return -(g * K0 * Math.cos(K0 * (x - X0)) - (2 * u / SIG) * g * Math.sin(K0 * (x - X0))); };
        let C = null, key = '', E0 = 1, meas = NaN, tau = 0;
        const build = () => {
          const len = secLen(), z3 = z3S.value;
          C = makeChain({ x0: -11.5, x1: len + Math.max(2.4, TE / z3 + 0.3), mu: (x) => Zat(x, len) ** 2, T: 1, delta: DEL, breaks: [0, len], left: 'fixed', right: 'fixed' });
          C.set(burst, burstV); E0 = C.energy().E; meas = NaN;
        };
        v.animate((t) => {
          const len = secLen(), k = [mode.value, z3S.value, z2S.value, hd.x.toFixed(4)].join();
          tau = Math.min(t, TE);
          if (k !== key || tau < C.t - 1e-9) { key = k; build(); }
          C.advance(tau, 0.5 * DEL);
          // the echo has separated once the burst's tail has crossed the section and come back
          const zs = mode.value === 'qw' ? z2S.value : mode.value === 'taper' ? (z3S.value - 1) / Math.log(z3S.value) : 1;
          const tsep = Math.min(-X0 + 2 * SIG + 0.3 + 2 * len * zs, TE - 0.3);
          if (C.t >= tsep && !isFinite(meas)) meas = C.energy(-Infinity, -0.05).E / E0;
          if (C.t < tsep) meas = NaN;
          z2S.el.hidden = mode.value !== 'qw'; gm.hidden = mode.value !== 'qw';
          // ---- the strings, darker and thicker where Z is larger
          s.hline(0, { color: 'faint', width: 1 });
          const lz = (x) => Math.log(Zat(x, len)) / Math.log(16);
          const style = (kk) => { const u = +kk; return { color: v.mix('accent', 'purple', u), width: 1.8 + 5 * u }; };
          style.key = (x) => (Math.round(lz(x) * 12) / 12).toFixed(3);
          drawChain(s, C, -5.6, 2.2, style);
          if (len > 0) s.vband(0, len, { color: 'gold', alpha: 0.1 });
          s.vline(0, { color: 'muted', width: 1, dash: [3, 4] });
          s.text('Z₁', -5.5, 1.08, { color: 'accent', size: 12, weight: 600 });
          s.text(`Z₃ = ${v.fix(z3S.value, 1)} Z₁`, 2.1, 1.08, { color: 'purple', size: 12, weight: 600, align: 'right' });
          s.corner(`t = ${v.fix(tau, 2)}`, 'bl', { color: 'muted' });
          // ---- prediction curve and measurement
          const m = mode.value;
          gp.setLabels(m === 'taper' ? 'taper length ℓ / λ₁' : 'layer thickness d / λ₂', undefined);
          const cv = predCurve(), abr = ((z3S.value - 1) / (z3S.value + 1)) ** 2;
          gp.setView([0, 1.25], [0, gTop()]); hd.y = 0.94 * gTop();
          gp.hline(abr, { color: 'red', width: 1.2, dash: [4, 4] });
          gp.text('abrupt joint', 1.22, abr, { color: 'red', size: 11.5, align: 'right', baseline: 'bottom', dy: -3 });
          hd.visible = m !== 'abrupt';
          if (m !== 'abrupt') {
            gp.path(cv, { color: 'accent', width: 2.2 });
            if (m === 'qw') { gp.vline(0.25, { color: 'green', width: 1, dash: [3, 4] }); gp.vline(0.75, { color: 'green', width: 1, dash: [3, 4] }); gp.text('λ₂/4', 0.25, Math.max(0.2, abr * 1.12) * 0.5, { color: 'green', size: 11.5, align: 'left', dx: 4 }); }
            gp.vline(hd.x, { color: 'gold', width: 1.2 });
            gp.dot(hd.x, Rpred(len), { r: 4, color: 'accent', hollow: true });
          }
          if (isFinite(meas)) gp.dot(m === 'abrupt' ? 0.05 : hd.x, meas, { r: 6, color: 'gold' });
          // ---- impedance profile
          zp.path(M.range(321).map((i) => { const x = -1 + (3.2 * i) / 320; return [x, Zat(x, len)]; }), { color: 'purple', width: 2.4 });
          if (m === 'qw') zp.hline(Math.sqrt(z3S.value), { color: 'green', width: 1, dash: [3, 4] });
        }, { period: TE + 0.8, still: 6.9 });
        v.legend([['accent', 'transfer-matrix prediction (burst average)'], ['gold', 'measured from the simulation', { dot: true }], ['red', 'abrupt joint', { dash: true }]]);
        v.readout(() => {
          const m = mode.value, len = secLen(), z3 = z3S.value, abr = ((z3 - 1) / (z3 + 1)) ** 2, pr = Rpred(len);
          const geo = m === 'qw' ? `layer $Z_2$ = ${v.fix(z2S.value, 2)} $Z_1$ (geometric mean ${v.fix(Math.sqrt(z3), 2)}), thickness $d$ = ${v.fix(hd.x, 3)} $\\lambda_2$` : m === 'taper' ? `exponential taper of length $\\ell$ = ${v.fix(hd.x, 3)} $\\lambda_1$` : 'abrupt joint';
          return `${geo} · predicted reflected energy ${v.fix(100 * (m === 'abrupt' ? abr : pr), 2)} % · measured ${isFinite(meas) ? v.fix(100 * meas, 2) + ' %' : '… (after the echo separates)'} · abrupt joint: $\\big(\\frac{Z_3-Z_1}{Z_3+Z_1}\\big)^2$ = ${v.fix(100 * abr, 1)} %`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Model',
      name: 'Sound waves in fluids',
      statement: String.raw`In a fluid of equilibrium density $\rho_0$ and pressure $P_0$, a small displacement $\xi(x,t)$ of the fluid along $x$ compresses it by $-\partial_x\xi$ and changes the pressure by $p=-K\,\partial_x\xi$, where $K=\rho\,dP/d\rho$ is the **bulk modulus**. Newton's second law for a slab, $\rho_0\,\xi_{tt}=-\partial_xp$, then gives the wave equation
$$\xi_{tt}=c^2\,\xi_{xx},\qquad c=\sqrt{K/\rho_0}.$$
Sound is a **longitudinal** wave: the fluid moves back and forth along the direction of travel, and the pressure and density waves travel with it. In a sound wave the compressions are too fast for heat to flow, so they are **adiabatic**, $P\propto\rho^{\gamma}$, $K=\gamma P_0$, and for an ideal gas
$$c=\sqrt{\frac{\gamma P_0}{\rho_0}}=\sqrt{\frac{\gamma RT}{M_{\rm mol}}},$$
which is 343 m/s in air at 20 °C, independent of pressure and growing as $\sqrt T$. In a travelling wave the pressure and fluid velocity are in step, $p=\rho_0c\,u$; the product $\rho_0c$ is the acoustic impedance.`,
      idea: String.raw`The fluid column is the continuous limit of the bead chain (1.1): slabs of gas are the beads and their pressure difference is the spring. Stiffness over inertia gives $c^2=K/\rho_0$, as for the string. Newton (1687) assumed the compressions were isothermal, $K=P_0$, and predicted about 290 m/s, roughly 15 % too low. Laplace (1816) noticed that the compressed regions warm up, which makes the gas stiffer by the factor $\gamma$. Since $P_0/\rho_0=RT/M_{\rm mol}$, the speed depends only on the temperature and the gas: it is high in light helium and low in heavy CO₂.`,
      caption: String.raw`A tube of gas, simulated as 240 thin slabs obeying $P\propto\rho^{\gamma}$, is pushed by a piston on the left and closed on the right. Dots are gas molecules carried by the flow, with their displacements exaggerated 100 times; the shading is the pressure. The gold molecules swing back and forth about fixed places and never travel with the wave. Two microphones time the pulse (bottom right), and the readout compares the measured speed with $\sqrt{\gamma P/\rho}$. Change the gas and the temperature. Then switch on **Newton's assumption** (isothermal, $\gamma=1$): the simulated sound slows to Newton's 290 m/s, 15 % below the measured speed in real air.`,
      deps: ['waves-1.1', 'mech-1.6'],
      see: ['music-1.4', 'thermo-1.17', 'fluid-9.11', 'aero-1.6', 'music-1.1'],
      refs: ['Crawford ch. 4'],
      tags: ['sound', 'speed of sound', 'longitudinal'],
      credit: 'Newton, 1687 (isothermal); Laplace, 1816 (adiabatic correction)',
      scope: String.raw`Holds for small pressure changes ($p\ll P_0$) in a fluid at rest, at frequencies low enough that the wavelength is much longer than the molecular mean free path and high enough that heat cannot diffuse across a wavelength during a period, which covers all audible sound. Loud sounds steepen into shocks (1.15).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Speed_of_sound' },
      viz(v) {
        const M = v.M, RG = M.CONST.R, P0 = 101325, L = 1.2, N = 240, L0 = L / N, MIC = [0.35, 0.95], SLOW = 0.001, EX = 100;
        const GAS = { air: { g: 1.4, m: 0.028965, name: 'air' }, he: { g: 5 / 3, m: 0.0040026, name: 'helium' }, co2: { g: 1.29, m: 0.04401, name: 'CO₂' } };
        const gas = v.select('gas', [{ value: 'air', label: 'air' }, { value: 'he', label: 'helium' }, { value: 'co2', label: 'CO₂' }], 'air');
        const Tk = v.slider('temperature $T$ (K)', 200, 400, 293, { step: 1 });
        const pist = v.select('piston', [{ value: 'push', label: 'one push' }, { value: 'sine', label: 'oscillating, 1 kHz' }], 'push');
        const iso = v.toggle('Newton’s assumption: isothermal ($\\gamma=1$)', false);
        const s = v.stage({ x: [-0.06, L + 0.03], y: [-0.13, 1.25], height: 205, axes: false, full: true });
        const pp = v.stage({ x: [0, L], y: [-900, 900], height: 210, axes: 'box', xlabel: 'x (m)', ylabel: 'Pa', title: 'pressure change p and ρ₀c·u along the tube', weight: 1 });
        const mp = v.stage({ x: [0, 6], y: [-900, 1500], height: 210, axes: 'box', xlabel: 't (ms)', ylabel: 'Pa', title: 'what the microphones record', weight: 1 });
        const rng = v.rng(7), NT = 1100, tracers = M.range(NT).map(() => [rng() * L, 0.06 + 0.88 * rng()]), tagged = [0.15, 0.4, 0.65, 0.9, 1.1];
        const prop = () => { const G = GAS[gas.value], rho = (P0 * G.m) / (RG * Tk.value), g = iso.value ? 1 : G.g; return { G, rho, g, c: Math.sqrt((g * P0) / rho), cad: Math.sqrt((G.g * P0) / rho), cN: Math.sqrt(P0 / rho) }; };
        const T0 = 0.25e-3, TAUP = 80e-6, AP = 0.3e-3, AS = 0.1e-3, FS = 1000;
        const pistonX = (t) => (pist.value === 'push' ? 0.5 * AP * (1 + Math.tanh((t - T0) / TAUP)) : AS * Math.sin(TAU * FS * t) * M.smoothstep(t / 0.001));
        let S = null, key = '';
        const build = () => {
          const P = prop(), m = P.rho * L0, X = new Float64Array(N + 1), V = new Float64Array(N + 1), pr = new Float64Array(N);
          for (let i = 0; i <= N; i++) X[i] = i * L0;
          S = { P, m, X, V, pr, t: 0, dt: (0.35 * L0) / P.c, hist: [] };
          press();
        };
        const press = () => { const { X, pr, P } = S; for (let i = 0; i < N; i++) pr[i] = P0 * Math.pow(L0 / (X[i + 1] - X[i]), P.g); };
        const step = () => {
          const { X, V, pr, m, dt } = S;
          for (let j = 1; j < N; j++) V[j] += 0.5 * dt * (pr[j - 1] - pr[j]) / m;
          for (let j = 1; j < N; j++) X[j] += dt * V[j];
          S.t += dt; const x0 = pistonX(S.t); V[0] = (x0 - X[0]) / dt; X[0] = x0;
          press();
          for (let j = 1; j < N; j++) V[j] += 0.5 * dt * (pr[j - 1] - pr[j]) / m;
        };
        const pAt = (x) => { const { X, pr } = S; let lo = 0, hi = N; while (hi - lo > 1) { const md = (lo + hi) >> 1; if (X[md] <= x) lo = md; else hi = md; } return pr[lo] - P0; };
        const dispAt = (s0) => { const u = s0 / L0, i = Math.min(N - 1, Math.floor(u)), f = u - i; return S.X[i] * (1 - f) + S.X[i + 1] * f - s0; };
        // time at which a microphone's record first rises through a fixed threshold (linear interpolation)
        const firstCross = (k) => {
          const h = S.hist, P = S.P, thr = 0.25 * P.rho * P.c * (pist.value === 'push' ? AP / (2 * TAUP) : AS * TAU * FS * 0.6);
          for (let i = 1; i < h.length; i++) if (h[i - 1][k] < thr && h[i][k] >= thr) return h[i - 1][0] + ((thr - h[i - 1][k]) / (h[i][k] - h[i - 1][k])) * (h[i][0] - h[i - 1][0]);
          return NaN;
        };
        let tms = 0;
        v.animate((t) => {
          const k = [gas.value, Tk.value, pist.value, iso.value].join();
          const target = t * SLOW;
          if (k !== key || target < S.t - 1e-12) { key = k; build(); }
          while (S.t < target) { step(); S.hist.push([S.t, pAt(MIC[0]), pAt(MIC[1])]); if (S.hist.length > 4000) S.hist.splice(0, 2000); }
          tms = S.t * 1000;
          const P = S.P, pmax = P.rho * P.c * (pist.value === 'push' ? AP / (2 * TAUP) : AS * TAU * FS) * 1.25;
          // ---- the tube: pressure shading, molecules, piston, closed end
          const ex = (j) => j * L0 + EX * (S.X[j] - j * L0);
          const dv = diverging(v);
          for (let i = 0; i < N; i++) s.rect(ex(i), -0.02, ex(i + 1), 1.02, { fill: dv((S.pr[i] - P0) / pmax), fillAlpha: 1, stroke: false });
          const pts = tracers.map(([s0, y]) => [s0 + EX * dispAt(s0), y]);
          s.dots(pts, { r: 1.6, color: 'ink', alpha: 0.55 });
          for (const s0 of tagged) { const x = s0 + EX * dispAt(s0); s.line(s0, 1.0, s0, 1.06, { color: 'gold', width: 1.5 }); s.dot(x, 0.5, { r: 5.5, color: 'gold' }); }
          const xp = EX * S.X[0];
          s.rect(-0.06, -0.02, xp, 1.02, { fill: 'muted', fillAlpha: 0.35, hatch: 'muted', hatchGap: 5, stroke: false });
          s.rect(-0.06, -0.02, xp, 1.02, { color: 'muted', width: 1.2 });
          s.line(-0.06, 1.02, L, 1.02, { color: 'muted', width: 2 }); s.line(-0.06, -0.02, L, -0.02, { color: 'muted', width: 2 });
          wall(s, L, -0.02, 1.02, 1, 0.025);
          for (const xm of MIC) { s.dot(xm, -0.07, { r: 5, color: 'teal' }); s.line(xm, -0.02, xm, 1.02, { color: 'teal', width: 1, dash: [2, 4], alpha: 0.7 }); }
          s.corner(`slow motion · t = ${v.fix(tms, 3)} ms · displacements ×${EX}`, 'tl', { color: 'ink' });
          // ---- pressure and velocity along the tube
          pp.setView([0, L], [-pmax * 1.1, pmax * 1.1]);
          pp.hline(0, { color: 'faint', width: 1 });
          const px = M.range(N).map((i) => [0.5 * (S.X[i] + S.X[i + 1]), S.pr[i] - P0]);
          pp.path(px, { color: 'red', width: 2.2 });
          pp.path(M.range(N + 1).map((j) => [S.X[j], P.rho * P.c * S.V[j]]), { color: 'accent', width: 1.6, dash: [5, 4] });
          if (pist.value === 'push') { const xf = P.cad * (S.t - T0); if (xf > 0 && xf < L) pp.vline(xf, { color: 'gold', width: 1.4, dash: [5, 4] }); }
          // ---- microphones
          mp.setView([0, 6], [-pmax * 1.1, pmax * 2.2]);
          mp.hline(0, { color: 'faint', width: 1 });
          mp.path(S.hist.map((r) => [r[0] * 1000, r[1]]), { color: 'teal', width: 1.8 });
          mp.path(S.hist.map((r) => [r[0] * 1000, r[2] + pmax * 1.0]), { color: 'purple', width: 1.8 });
          mp.text(`mic at ${MIC[0]} m`, 5.9, pmax * 0.35, { color: 'teal', size: 11.5, align: 'right' });
          mp.text(`mic at ${MIC[1]} m (shifted up)`, 5.9, pmax * 1.35, { color: 'purple', size: 11.5, align: 'right' });
          const t1 = firstCross(1), t2 = firstCross(2);
          if (pist.value === 'push') for (const xm of MIC) mp.vline((T0 + xm / P.cad) * 1000, { color: 'gold', width: 1.2, dash: [5, 4] });
          const near = (tt) => S.hist.reduce((b, r) => (Math.abs(r[0] - tt) < Math.abs(b[0] - tt) ? r : b));
          if (isFinite(t1)) mp.dot(t1 * 1000, near(t1)[1], { r: 4.5, color: 'teal' });
          if (isFinite(t2)) mp.dot(t2 * 1000, pmax + near(t2)[2], { r: 4.5, color: 'purple' });
        }, { period: 6, still: 4.0 });
        v.legend([['red', 'pressure change $p$'], ['accent', '$\\rho_0c\\,u$ (fluid velocity)', { dash: true }], ['gold', 'arrival predicted by $\\sqrt{\\gamma P/\\rho}$', { dash: true }]]);
        v.readout(() => {
          const P = S.P, t1 = firstCross(1), t2 = firstCross(2), cm = isFinite(t1) && isFinite(t2) && t2 > t1 ? (MIC[1] - MIC[0]) / (t2 - t1) : NaN;
          return `${P.G.name} at ${v.fix(Tk.value, 0)} K and 1 atm: $\\rho_0$ = ${v.fix(P.rho, 3)} kg/m³, $\\gamma$ = ${v.fix(P.G.g, 3)} · Laplace $\\sqrt{\\gamma P_0/\\rho_0}$ = ${v.fix(P.cad, 1)} m/s, Newton $\\sqrt{P_0/\\rho_0}$ = ${v.fix(P.cN, 1)} m/s · speed measured between the microphones: ${isFinite(cm) ? v.fix(cm, 1) + ' m/s' : '… (waiting for the wave to reach both)'}${iso.value ? ' — the isothermal gas reproduces Newton’s value, not the real speed of sound' : ''} · acoustic impedance $\\rho_0c$ = ${v.fix(P.rho * P.c, 0)} kg/(m²·s)`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12',
      kind: 'Model',
      name: 'Plane and spherical waves in three dimensions',
      statement: String.raw`In three dimensions the wave equation $u_{tt}=c^2\nabla^2u$ has two basic families of travelling solutions.
(a) **Plane waves** $u=f(\mathbf n\cdot\mathbf x-ct)$ for a unit vector $\mathbf n$: every plane perpendicular to $\mathbf n$ is a wavefront, and the amplitude never changes.
(b) **Spherical waves** from a point source,
$$u(r,t)=\frac{f(r-ct)}{r}\qquad\text{(for example } \tfrac{A}{r}\cos(kr-\omega t)\text{)},$$
whose wavefronts are spheres. The amplitude falls as $1/r$ and the intensity as $1/r^2$, so the power through every sphere around the source, intensity times $4\pi r^2$, is the same. Over a patch of width $w$ at distance $r$, a spherical front departs from its tangent plane by the sagitta $w^2/8r$; once this is much smaller than a wavelength the wave is locally plane. No other power law of $r$ gives a spherically symmetric outgoing solution.`,
      idea: String.raw`For a spherically symmetric $u$ the Laplacian is $\nabla^2u=\frac1r\,\partial_r^2(ru)$ (pde-6.10), so $v=ru$ obeys the one-dimensional wave equation $v_{tt}=c^2v_{rr}$. By d'Alembert (1.3) the outgoing solution is $v=f(r-ct)$, hence $u=f(r-ct)/r$. Energy conservation (1.7) gives the same law: the flux through a sphere is intensity × $4\pi r^2$, and with nothing absorbed between two spheres the intensity must fall as $1/r^2$, so the amplitude falls as $1/r$. A line source spreads over cylinders instead, and its amplitude falls only as $1/\sqrt r$.`,
      caption: String.raw`The pressure of a point source of sound, in a plane through the source, with distances in wavelengths. Drag the gold handle to resize the detector sphere: its power readout stays the same at every radius. Drag the teal square far out: the zoomed patch (right) shows the curved fronts and their tangent planes (dashed), which become indistinguishable as the sagitta $w^2/8r$ shrinks below a wavelength. Then try the other amplitude laws: with $1/\sqrt r$ (the law for a line source) or a constant amplitude, the power through the spheres grows with $r$, and the readout shows that the 3D wave equation is no longer satisfied.`,
      deps: ['waves-1.3', 'pde-6.10'],
      see: ['music-1.7', 'em-11.2', 'waves-4.4'],
      refs: ['Hecht ch. 2', 'Crawford ch. 7'],
      tags: ['spherical wave', 'inverse square', 'plane wave'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Inverse-square_law' },
      viz(v) {
        const M = v.M, K = TAU, RM = 6, W = 1.2, WSLOW = Math.PI;
        const law = v.select('amplitude law', [{ value: 1, label: '$1/r$' }, { value: 0.5, label: '$1/\\sqrt r$' }, { value: 0, label: 'constant' }], 1);
        const s = v.stage({ x: [-RM, RM], y: [-4.4, 4.4], equal: true, height: 330, axes: false, weight: 1.35, title: 'pressure in a plane through the source' });
        const zp = v.stage({ x: [-W / 2, W / 2], y: [-W / 2, W / 2], equal: true, height: 330, axes: false, weight: 1, title: 'zoom on the teal patch' });
        const ap = v.stage({ x: [0, RM], y: [0, 2.6], height: 220, axes: 'box', xlabel: 'distance r (wavelengths)', full: true, title: 'amplitude and power through spheres, against distance' });
        const hr = s.handle(2, 0, { color: 'gold', constrain: (x) => [M.clamp(x, 0.4, RM - 0.2), 0], label: 'r' });
        const hp = s.handle(-3.6, 2.2, { color: 'teal', constrain: (x, y) => { const r = Math.hypot(x, y); return r < 0.8 ? [(0.8 * x) / (r || 1), (0.8 * y) / (r || 1)] : [x, y]; } });
        const amp = (r) => Math.pow(Math.max(r, 0.12), -law.value);
        const p = (r, t) => amp(r) * Math.cos(K * r - WSLOW * t);
        let tt = 0;
        v.animate((t) => {
          tt = t;
          const dv = diverging(v);
          s.raster((x, y) => dv(p(Math.hypot(x, y), t) / 0.9), { res: 3 });
          s.circle(0, 0, hr.x, { color: 'gold', width: 2, dash: [6, 4] });
          s.dot(0, 0, { r: 4, color: 'ink' });
          const rp = Math.hypot(hp.x, hp.y), ang = Math.atan2(hp.y, hp.x), ux = Math.cos(ang), uy = Math.sin(ang);
          const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [hp.x + (a * ux - b * uy) * W / 2, hp.y + (a * uy + b * ux) * W / 2]);
          s.poly(corners, { color: 'teal', width: 2, fill: false });
          // ---- zoom: local coordinates (u along the ray, w across it)
          zp.raster((u, w) => dv(p(Math.hypot(rp + u, w), t) / (0.9 * amp(rp))), { res: 3 });
          const ph = (WSLOW * t) / K; // crests where r = n + ph
          for (let n = Math.ceil(rp - W - ph); n <= rp + W - ph; n++) {
            const rc = n + ph; if (rc <= 0) continue;
            zp.line(rc - rp, -W / 2, rc - rp, W / 2, { color: 'ink', width: 1.2, dash: [4, 4] }); // tangent plane: straight line u = const
            zp.curve((w) => (rc * rc - w * w > 0 ? [Math.sqrt(rc * rc - w * w) - rp, w] : null), -W / 2, W / 2, { color: 'ink', width: 2.4 });
          }
          zp.corner(`r = ${v.fix(rp, 2)} λ`, 'tl', { color: 'ink', weight: 600 });
          zp.corner(`sagitta w²/8r = ${v.fix((W * W) / (8 * rp), 3)} λ`, 'bl', { color: 'ink' });
          // ---- amplitude and power
          const n = law.value, Pw = (r) => (r * r * amp(r) ** 2) / (1 * amp(1) ** 2);
          ap.fn((r) => Math.min(amp(r), 3), { domain: [0.15, RM], color: 'accent', width: 2.2 });
          const meas = M.range(23).map((i) => { const r = 0.5 + i * 0.25; let mx = 0; for (let k = 0; k < 24; k++) mx = Math.max(mx, Math.abs(p(r, (k / 24) * (TAU / WSLOW)))); return [r, mx]; });
          ap.dots(meas, { r: 3, color: 'accent' });
          ap.fn((r) => Math.min(Pw(r), 3), { domain: [0.15, RM], color: 'green', width: 2.2 });
          ap.vline(hr.x, { color: 'gold', width: 1.4, dash: [5, 4] });
          ap.dot(hr.x, Math.min(Pw(hr.x), 2.6), { r: 5, color: 'gold' });
          ap.text(n === 1 ? 'power through the sphere: the same for every r' : 'power through the sphere grows with r: energy from nowhere', RM - 0.1, n === 1 ? 1.12 : 2.45, { color: 'green', size: 11.5, align: 'right', baseline: 'bottom' });
          ap.text('amplitude (dots: measured from the field)', 0.6, 2.45, { color: 'accent', size: 11.5, baseline: 'bottom' });
        }, { still: 0.3 });
        v.legend([['accent', 'amplitude'], ['green', 'power through a sphere, $4\\pi r^2 I$ (relative to $r=1$)'], ['ink', 'wavefronts; dashed: tangent planes']]);
        v.readout(() => {
          const r = hr.x, h = 1e-3, t = tt;
          // residual of u_tt/c² − ∇²u in 3D at (r, 0, 0), by finite differences (c = ω/k)
          const c = WSLOW / K, U = (x, y, z, tm) => p(Math.hypot(x, y, z), tm);
          const utt = (U(r, 0, 0, t + h) - 2 * U(r, 0, 0, t) + U(r, 0, 0, t - h)) / (h * h) / (c * c);
          let lap = -6 * U(r, 0, 0, t); for (const [a, b, d] of [[h, 0, 0], [-h, 0, 0], [0, h, 0], [0, -h, 0], [0, 0, h], [0, 0, -h]]) lap += U(r + a, b, d, t);
          lap /= h * h;
          const scale = K * K * amp(r), res = Math.abs(utt - lap) / scale;
          return `detector sphere at $r$ = ${v.fix(r, 2)} λ: amplitude ${v.fix(amp(r), 3)}, intensity × area relative to $r=1$: ${v.fix((r * r * amp(r) ** 2) / (amp(1) ** 2), 3)} · residual of the 3D wave equation $|u_{tt}/c^2-\\nabla^2u|$ there: ${v.fix(100 * res, res < 1e-3 ? 3 : 1)} % of $k^2|u|$${law.value === 1 ? ' (zero up to finite-difference error)' : ' — not a solution'} · patch ${v.fix(W, 1)} λ wide at ${v.fix(Math.hypot(hp.x, hp.y), 2)} λ: fronts curve by ${v.fix((W * W) / (8 * Math.hypot(hp.x, hp.y)), 3)} λ`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.13
    {
      num: '1.13',
      kind: 'Theorem',
      name: 'Sharp signals only in odd dimensions',
      statement: String.raw`Let a point source emit a brief signal $s(t)$, i.e. solve $u_{tt}-c^2\nabla^2u=s(t)\,\delta(\mathbf x)$ in $n$ space dimensions, starting from rest. With $c=1$ and $r=|\mathbf x|$:
$$u_1=\tfrac12\!\int_{-\infty}^{t-r}\!s,\qquad u_2=\frac1{2\pi}\int_0^\infty s(t-r\cosh\eta)\,d\eta,\qquad u_3=\frac{s(t-r)}{4\pi r}.$$
In three dimensions the listener at distance $r$ hears exactly the emitted signal, delayed by $r/c$ and weakened by $1/r$, and silence before and after: the **strong Huygens principle** holds. In two dimensions the signal arrives on time but leaves a **tail**: $u_2$ never returns to zero, decaying only like $1/t$ (like $1/t^2$ if $\int s=0$). The same dichotomy continues: sharp propagation holds in every odd dimension $n\ge3$ and fails in every even dimension. In one dimension a brief push leaves the string displaced by half the total impulse, and only signals with $\int s=0$ pass cleanly.`,
      idea: String.raw`In 3D, $ru$ obeys the 1D wave equation (1.12), so a spherical pulse simply travels outward without spreading in time. A 2D solution is a 3D solution that does not depend on $z$ (the *method of descent*, pde-6.4): a point source in the plane is a uniform line source in space. Its sharp spherical shells reach a listener from ever more distant points of the line, which arrive ever later and keep the signal going. The radial wave operators in dimensions $n$ and $n+2$ are linked by $G_{n+2}=-\frac{1}{2\pi r}\partial_rG_n$. Starting from the sharp $G_3$ every odd dimension stays sharp, and starting from the tailed $G_2$ every even dimension keeps a tail (pde-6.5).`,
      caption: String.raw`The same brief flash from a point source, in one, two and three dimensions, at the same moment. Colours show the disturbance (red up, blue down), on a fixed scale for each panel, and the gold ring is a probe at distance 3. Below: what the probe records, each trace scaled to its peak, on a shared time axis. In 3D the flash passes and leaves silence; in 2D a tail lingers, which is why ripples on a pond keep going after the first ring has passed; in 1D a net push leaves the string displaced. Switch to a push-and-pull with no net impulse, and switch on 4 and 5 dimensions: 5D is sharp again, 4D is not.`,
      deps: ['waves-1.12', 'pde-6.5'],
      see: ['pde-6.3', 'pde-6.4', 'waves-4.4'],
      refs: ['Crawford ch. 7'],
      tags: ['Huygens principle', 'dimension', 'Green function'],
      credit: 'Kirchhoff, 1882; Hadamard, 1923',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Huygens%E2%80%93Fresnel_principle#Generalized_Huygens%27_principle' },
      viz(v) {
        const M = v.M, R = 6, R0 = 3, TM = 13, W = 0.3, T0 = 1.1, NR = 300;
        const kind = v.select('the flash', [{ value: 'bump', label: 'a push (net impulse)' }, { value: 'wiggle', label: 'push and pull (no net impulse)' }], 'bump');
        const more = v.toggle('also 4 and 5 dimensions (probe only)', false);
        const s1 = v.stage({ x: [-R, R], y: [-1.25, 1.25], height: 240, axes: false, title: '1D: a string', minWidth: 220 });
        const s2 = v.stage({ x: [-R, R], y: [-R, R], equal: true, height: 240, axes: false, title: '2D: a membrane', minWidth: 220 });
        const s3 = v.stage({ x: [-R, R], y: [-R, R], equal: true, height: 240, axes: false, title: '3D: a slice through the source', minWidth: 220 });
        const pr = v.stage({ x: [0, TM], y: [-0.75, 1.2], height: 230, axes: 'box', xlabel: 'time t (distances in units of c·t)', full: true, title: `what a probe at distance ${R0} records (each curve scaled to its peak)` });
        const g = (u) => Math.exp(-0.5 * u * u);
        const sig = (tt) => { const u = (tt - T0) / W; return kind.value === 'bump' ? g(u) : -u * g(u); };
        const dsig = (tt) => { const u = (tt - T0) / W; return kind.value === 'bump' ? (-u / W) * g(u) : (-(1 - u * u) / W) * g(u); };
        const Sint = (tt) => { const u = (tt - T0) / W; return kind.value === 'bump' ? W * Math.sqrt(Math.PI / 2) * (1 + M.erf(u / Math.SQRT2)) : W * g(u); };
        // integral over the support of s only: τ' = r cosh η runs over [t − T0 − 7W, t − T0 + 7W] ∩ [r, ∞)
        const etaInt = (r, tt, f, weight) => {
          r = Math.max(r, 0.02);
          const a = Math.max(1, (tt - T0 - 7 * W) / r), b = (tt - T0 + 7 * W) / r; if (b <= 1) return 0;
          const ea = Math.acosh(a), eb = Math.acosh(b);
          return M.integrate((e) => f(tt - r * Math.cosh(e)) * (weight ? Math.cosh(e) : 1), ea, eb, 120);
        };
        const u1 = (r, tt) => 0.5 * Sint(tt - r);
        const u2 = (r, tt) => etaInt(r, tt, sig, false) / TAU;
        const u3 = (r, tt) => sig(tt - Math.max(r, 0.02)) / (4 * Math.PI * Math.max(r, 0.02));
        const u4 = (r, tt) => etaInt(r, tt, dsig, true) / (4 * Math.PI * Math.PI * Math.max(r, 0.02));
        const u5 = (r, tt) => { r = Math.max(r, 0.02); return (r * dsig(tt - r) + sig(tt - r)) / (8 * Math.PI * Math.PI * r * r * r); };
        const dims = [[1, u1, 'orange'], [2, u2, 'purple'], [3, u3, 'accent'], [4, u4, 'pink'], [5, u5, 'teal']];
        let pKey = '', traces = null;
        const probeTraces = () => {
          if (pKey === kind.value) return traces; pKey = kind.value;
          traces = dims.map(([n, u]) => { const pts = M.range(521).map((i) => { const tt = (TM * i) / 520; return [tt, u(R0, tt)]; }); const pk = Math.max(1e-12, ...pts.map((p) => Math.abs(p[1]))); return { n, pts, pk }; });
          return traces;
        };
        const radial = (u, tt) => { const a = new Float64Array(NR + 1); for (let j = 0; j <= NR; j++) a[j] = u((R * Math.SQRT2 * j) / NR, tt); return a; };
        const look = (a, r) => { const q = (r / (R * Math.SQRT2)) * NR, j = Math.min(NR - 1, Math.floor(q)), f = q - j; return a[j] * (1 - f) + a[j + 1] * f; };
        let tt = 0, now = null;
        v.animate((t) => {
          tt = Math.min(t, TM);
          const tr = probeTraces();
          // ---- 1D
          const pk1 = tr[0].pk;
          s1.hline(0, { color: 'faint', width: 1 });
          s1.fn((x) => u1(Math.abs(x), tt) / pk1, { color: 'orange', width: 2.6, n: 500 });
          for (const x of [-R0, R0]) s1.dot(x, u1(R0, tt) / pk1, { r: 5, color: 'gold' });
          s1.dot(0, 0, { r: 3.5, color: 'ink' });
          // ---- 2D and 3D: radial profiles on a fixed scale per panel (the probe's peak)
          const dv = diverging(v);
          for (const [stg, k] of [[s2, 1], [s3, 2]]) {
            const a = radial(dims[k][1], tt), pk = tr[k].pk;
            stg.raster((x, y) => dv(look(a, Math.hypot(x, y)) / pk), { res: 2 });
            stg.circle(0, 0, R0, { color: 'gold', width: 1.6, dash: [5, 4] });
            if (tt - T0 > 0) stg.circle(0, 0, tt - T0, { color: 'ink', width: 0.8, alpha: 0.35 });
            stg.dot(0, 0, { r: 3, color: 'ink' });
          }
          s1.corner(`t = ${v.fix(tt, 2)}`, 'tl', { color: 'ink', weight: 600 });
          // ---- probe traces
          pr.hline(0, { color: 'faint', width: 1 });
          pr.vline(R0 + T0, { color: 'muted', width: 1, dash: [3, 4] });
          pr.text('front arrives', R0 + T0, 1.12, { color: 'muted', size: 11, align: 'left', dx: 4 });
          for (const T of tr) {
            if (T.n > 3 && !more.value) continue;
            pr.path(T.pts.map(([x, y]) => [x, y / T.pk]), { color: dims[T.n - 1][2], width: T.n === 3 ? 2.6 : 2 });
          }
          pr.vline(tt, { color: 'gold', width: 1.6 });
          now = tr.map((T) => ({ n: T.n, val: dims[T.n - 1][1](R0, tt) / T.pk }));
        }, { period: TM + 0.6, still: 7.6 });
        v.readout(() => {
          if (!now) return '';
          const passed = tt > R0 + T0 + 4 * W, f = (n) => now[n - 1].val;
          const list = (more.value ? [1, 2, 3, 4, 5] : [1, 2, 3]).map((n) => `${n}D ${v.fix(100 * Math.abs(f(n)), Math.abs(f(n)) < 1e-4 ? 0 : 1)} %`).join(', ');
          return passed ? `the front passed the probe at $t\\approx$ ${v.fix(R0 + T0, 1)}; what is still there now, as a fraction of the peak: ${list}${kind.value === 'bump' ? ' · 1D keeps half the impulse (the string stays displaced); the 2D tail decays like $1/t$' : ' · with no net impulse the 1D string returns to rest, but the 2D tail persists (now like $1/t^2$)'} · 3D and 5D: exactly zero` : `waiting for the front to pass the probe (it arrives at $t\\approx$ ${v.fix(R0 + T0, 1)})`;
        });
        v.legend([['orange', '1D'], ['purple', '2D'], ['accent', '3D'], ['pink', '4D', { dash: false }], ['teal', '5D'], ['gold', 'probe at distance 3']]);
      },
    },
    // ------------------------------------------------------------------ 1.14
    {
      num: '1.14',
      kind: 'Phenomenon',
      name: 'Doppler effect',
      statement: String.raw`A source emitting frequency $f$ moves with velocity $\mathbf v_s$, and an observer moves with velocity $\mathbf v_o$, through a medium in which waves travel at speed $c$ (both slower than $c$). The observer receives the frequency
$$f'=f\,\frac{c-\mathbf v_o\cdot\hat{\mathbf u}}{c-\mathbf v_s\cdot\hat{\mathbf u}},$$
where $\hat{\mathbf u}$ is the unit vector from the source, at the moment of emission, to the observer, at the moment of reception. For motion along the line joining them this is the familiar
$$f'=f\,\frac{c+v_o}{c-v_s}\qquad(\text{speeds counted positive towards each other}).$$
The two motions are not interchangeable: a moving source squeezes the wavelength itself, $\lambda'=(c-v_s)/f$ ahead of it, while a moving observer meets unchanged wavefronts at a different rate. When a source passes by, the heard pitch slides from $f\,c/(c-v_s)$ down to $f\,c/(c+v_s)$, fastest at closest approach.`,
      idea: String.raw`Two successive crests are emitted a time $1/f$ apart; meanwhile the source has moved $v_s/f$ along $\hat{\mathbf u}$, so the second crest starts that much closer to the observer and the crests are separated by $(c-\mathbf v_s\cdot\hat{\mathbf u})/f$ in space. The observer runs into them at relative speed $c-\mathbf v_o\cdot\hat{\mathbf u}$, and the ratio of the two gives $f'$. Each crest is a circle (a sphere) centred where it was emitted (1.12); only the centres move.`,
      caption: String.raw`The source (orange) emits a crest every period; each crest is a circle centred where it was emitted. Ahead of the source the crests bunch, behind it they spread. Drag the teal observer (its handle marks where it is halfway through the run) and set both speeds. Below: the frequency the observer hears over the run, measured from the actual arrival times of the crests (dots), and the formula $f(c-\mathbf v_o\cdot\hat{\mathbf u})/(c-\mathbf v_s\cdot\hat{\mathbf u})$ (line). The dashed lines are the head-on values. *Listen* plays a 520 Hz siren passing a listener at rest, synthesized from the exact retarded signal.`,
      deps: ['waves-1.4'],
      see: ['rel-2.9', 'imaging-5.9', 'qchem-10.10', 'waves-1.12'],
      refs: ['Hecht ch. 2', 'Crawford ch. 4'],
      tags: ['Doppler effect', 'moving source'],
      credit: 'Christian Doppler, 1842; Buys Ballot (test with trumpeters on a train), 1845',
      scope: String.raw`Holds for sound and other waves in a medium at rest, with source and observer slower than the wave. For light there is no medium, and the relativistic formula (rel-2.9) replaces this one; above the wave speed the source outruns its own waves (1.15).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Doppler_effect' },
      viz(v) {
        const M = v.M, C = 1, F = 1.1, XR = 7.5, HIST = 16, SPEED = 1.5;
        const vsS = v.slider('source speed $v_s/c$', -0.9, 0.9, 0.5, { step: 0.01 });
        const voS = v.slider('observer speed $v_o/c$ (along $x$)', -0.9, 0.9, 0, { step: 0.01 });
        const s = v.stage({ x: [-XR, XR], y: [-3.3, 3.3], equal: true, height: 320, axes: false, full: true });
        const fp = v.stage({ x: [0, 10], y: [0, 3], height: 220, axes: 'box', xlabel: 'time during the run', ylabel: 'f′ / f', full: true, title: 'frequency heard by the observer' });
        const ho = s.handle(1.5, -1.6, { color: 'teal', label: 'observer', labelPos: 's' });
        const run = () => { const vs = vsS.value; return Math.abs(vs) < 0.05 ? 14 : Math.min(40, (2 * XR + 2) / Math.abs(vs)); };
        const S0 = () => { const vs = vsS.value, T = run(); return Math.abs(vs) < 0.05 ? [0, 0] : [-vs * T / 2, 0]; }; // the source passes x = 0 halfway through the run
        const Sat = (t) => { const a = S0(); return [a[0] + vsS.value * t, 0]; };
        const Oat = (t) => [ho.x + voS.value * (t - run() / 2), ho.y];
        // arrival time of the crest emitted at te at the (moving) observer: the larger root of |O(t) − S(te)| = c (t − te)
        const arrival = (te) => {
          const Sn = Sat(te), Q = [ho.x - voS.value * run() / 2 - Sn[0], ho.y - Sn[1]], Vo = [voS.value, 0];
          const A = Vo[0] * Vo[0] - C * C, B = 2 * (Q[0] * Vo[0] + Q[1] * Vo[1] + C * C * te), Cc = Q[0] * Q[0] + Q[1] * Q[1] - C * C * te * te;
          const d = Math.sqrt(Math.max(0, B * B - 4 * A * Cc)); return Math.max((-B + d) / (2 * A), (-B - d) / (2 * A));
        };
        const formula = (t) => { const O = Oat(t), te = retarded(t, O, S0(), [vsS.value, 0], C)[0]; if (te === undefined) return NaN; const Se = Sat(te), dx = O[0] - Se[0], dy = O[1] - Se[1], r = Math.hypot(dx, dy); return (C - (voS.value * dx) / r) / (C - (vsS.value * dx) / r); };
        let tau = 0, fMeas = NaN;
        v.animate((t) => {
          const T = run(); tau = (t * SPEED) % T;
          const Sp = Sat(tau), Op = Oat(tau);
          // ---- crests
          const n0 = Math.ceil((tau - HIST) * F), n1 = Math.floor(tau * F);
          for (let n = n0; n <= n1; n++) {
            const te = n / F, c0 = Sat(te), R = C * (tau - te);
            const arr = arrival(te), hit = Math.abs(arr - tau) < 0.5 / F && arr <= tau;
            s.circle(c0[0], c0[1], R, { color: hit ? 'gold' : 'accent', width: hit ? 2.4 : 1.4, alpha: hit ? 1 : Math.max(0.15, 1 - R / 12) });
          }
          s.line(-XR, 0, XR, 0, { color: 'faint', width: 1, dash: [3, 5] });
          s.line(Op[0] - 30 * voS.value, Op[1], Op[0] + 30 * voS.value, Op[1], { color: 'teal', width: 1, dash: [2, 4], alpha: 0.6 });
          s.dot(Sp[0], Sp[1], { r: 7, color: 'orange' });
          if (Math.abs(vsS.value) > 0.01) s.arrow(Sp[0], Sp[1], Sp[0] + 1.2 * vsS.value, Sp[1], { color: 'orange', width: 2.4 });
          s.dot(Op[0], Op[1], { r: 6.5, color: 'teal' });
          if (Math.abs(voS.value) > 0.01) s.arrow(Op[0], Op[1], Op[0] + 1.2 * voS.value, Op[1], { color: 'teal', width: 2.4 });
          s.corner(`crests emitted every 1/f; wave speed c`, 'tl', { color: 'muted' });
          // ---- heard frequency over the run
          const fa = (C - voS.value) / (C - vsS.value), fb = (C + voS.value) / (C + vsS.value);
          fp.setView([0, T], [0, Math.min(6, Math.max(2.2, 1.15 * Math.max(fa, fb)))]);
          const arrs = []; for (let n = Math.ceil(-HIST * F); n <= Math.floor(T * F); n++) arrs.push(arrival(n / F));
          const pts = []; for (let i = 1; i < arrs.length; i++) { const a = arrs[i - 1], b = arrs[i]; if (b > 0 && a < T) pts.push([0.5 * (a + b), 1 / (F * (b - a))]); }
          fp.hline(1, { color: 'faint', width: 1 });
          fp.hline(fa, { color: 'muted', width: 1.2, dash: [4, 4] }); fp.hline(fb, { color: 'muted', width: 1.2, dash: [4, 4] });
          fp.fn((x) => formula(x), { domain: [0, T], color: 'accent', width: 2.2, n: 300 });
          fp.dots(pts.filter((p) => p[0] >= 0 && p[0] <= T), { r: 2.8, color: 'gold' });
          fp.vline(tau, { color: 'ink', width: 1.2, dash: [4, 4] });
          const past = pts.filter((p) => p[0] <= tau); fMeas = past.length ? past[past.length - 1][1] : NaN;
        }, { still: 10.6 });
        v.soundButton('Listen: a siren drives past', (snd) => {
          const c = 343, vs = vsS.value * c, d = Math.max(4, Math.abs(ho.y) * 12);
          const sgl = (te) => Math.sin(TAU * 520 * te) + 0.45 * Math.sin(TAU * 1040 * te) + 0.25 * Math.sin(TAU * 1560 * te);
          snd.samples(movingSourceSound(sgl, [0, -d], [0, 0], [vs, 0], c, 4), 44100, { gain: 0.5 });
        });
        v.legend([['accent', 'crests (gold: the one reaching the observer)'], ['gold', 'measured from crest arrival times', { dot: true }], ['muted', 'head-on approach and recession', { dash: true }]]);
        v.readout(() => {
          const vs = vsS.value, vo = voS.value, fF = formula(tau);
          return `heard now: ${isFinite(fMeas) ? v.fix(fMeas, 3) : '…'} $f$ (from successive crest arrivals), formula ${v.fix(fF, 3)} $f$ · long before and after the pass (velocities signed along $x$): $f\\,\\frac{c-v_o}{c-v_s}$ = ${v.fix((C - vo) / (C - vs), 3)} $f$ and $f\\,\\frac{c+v_o}{c+v_s}$ = ${v.fix((C + vo) / (C + vs), 3)} $f$ · wavelength ahead of the source ${v.fix(1 - Math.abs(vs), 2)} $\\lambda$, behind it ${v.fix(1 + Math.abs(vs), 2)} $\\lambda$`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.15
    {
      num: '1.15',
      kind: 'Phenomenon',
      name: 'Shock waves and Mach cones',
      statement: String.raw`A source moving at speed $v_s$ greater than the wave speed $c$ (Mach number $M=v_s/c>1$) outruns its own waves. The wavefronts it has emitted all lie inside a cone (a wedge in 2D) trailing behind it, with half-angle
$$\sin\theta=\frac{c}{v_s}=\frac1M ,$$
and they pile up on the cone's surface, where the disturbance concentrates into a **shock wave**. A listener hears nothing until the cone sweeps over, then a sudden **boom**: at that moment sound emitted over a whole stretch of the path arrives at once. After it, the listener hears two parts of the path simultaneously, one of them in reverse order. For $M<1$ the wavefronts never intersect and there is no cone.`,
      idea: String.raw`The wavefront emitted a time $\tau$ ago is a circle of radius $c\tau$ centred a distance $v_s\tau$ behind the source. Seen from the source, every such circle subtends the same angle $\arcsin(c\tau/v_s\tau)=\arcsin(1/M)$, so all of them are tangent to one cone. For a listener at a fixed point, the arrival time of the sound emitted at time $t_e$ is $t_a=t_e+r(t_e)/c$. Below Mach 1 this increases steadily with $t_e$. Above Mach 1 it has a minimum, where $dt_a/dt_e=1-M\cos\varphi=0$, i.e. where the listener sits on the cone. Near a minimum many emission times share nearly one arrival time, so their sound arrives together. This is the Doppler factor $1/(1-M\cos\varphi)$ of 1.14 blowing up.`,
      caption: String.raw`Push the Mach number past 1. The circles are wavefronts, each centred where it was emitted. Above Mach 1 they crowd onto a cone; the dashed lines are $\sin\theta=1/M$, and the readout compares that angle with the one measured from the envelope of the drawn circles. Drag the teal listener. Below: for each moment of emission, when the listener hears it. Above Mach 1 the curve has a minimum, which is the boom; the gold line is *now*, and where it crosses the curve twice the listener hears two parts of the path at once. *Listen* plays an engine passing 40 m overhead at this Mach number.`,
      deps: ['waves-1.14'],
      see: ['fluid-9.13', 'aero-1.6', 'pde-8.4', 'fluid-9.14'],
      refs: ['Hecht ch. 2'],
      tags: ['shock wave', 'Mach cone', 'sonic boom'],
      credit: 'Ernst Mach and Peter Salcher (photographs of supersonic bullets), 1887',
      scope: String.raw`The cone geometry holds for any wave with a fixed speed, such as sound, surface waves in shallow water, or light in a medium (Cherenkov radiation). Real sonic booms are nonlinear shocks whose strength and N-shaped profile depend on the aircraft's size and altitude; dispersive waves such as deep-water waves make a different wake, with the Kelvin angle (3.8).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mach_wave' },
      viz(v) {
        const M = v.M, C = 1, F = 1.4, XR = 8, HIST = 18, SPEED = 1.6;
        const mS = v.slider('Mach number $M=v_s/c$', 0.3, 3, 1.8, { step: 0.01 });
        const cone = v.toggle('cone predicted by $\\sin\\theta=1/M$', true);
        const s = v.stage({ x: [-XR, XR], y: [-3.6, 3.6], equal: true, height: 320, axes: false, full: true });
        const ta = v.stage({ x: [0, 10], y: [0, 10], height: 240, axes: 'box', xlabel: 'emission time', ylabel: 'arrival time', full: true, title: 'when the listener hears each moment of the flight' });
        const ho = s.handle(1, -2.4, { color: 'teal', label: 'listener', labelPos: 's', constrain: (x, y) => [x, Math.min(y, -0.6)] });
        const run = () => (2 * XR + 4) / (mS.value * C);
        const Sat = (t) => [-XR - 2 + mS.value * C * t, 0];
        const arr = (te) => { const S = Sat(te); return te + Math.hypot(ho.x - S[0], ho.y - S[1]) / C; };
        let tau = 0, info = null;
        v.animate((t) => {
          const Mm = mS.value, vs = Mm * C, T = run(); tau = (t * SPEED) % T;
          const Sp = Sat(tau), th = Mm > 1 ? Math.asin(1 / Mm) : NaN;
          // ---- wavefronts
          const n0 = Math.ceil((tau - HIST) * F), n1 = Math.floor(tau * F), circles = [];
          for (let n = n0; n <= n1; n++) {
            const te = n / F, c0 = Sat(te), R = C * (tau - te);
            circles.push([c0[0], R]);
            const dO = Math.hypot(ho.x - c0[0], ho.y), hit = Math.abs(dO - R) < (C / F) * 0.5;
            s.circle(c0[0], 0, R, { color: hit ? 'gold' : 'accent', width: hit ? 2.4 : 1.3, alpha: hit ? 1 : Math.max(0.18, 1 - R / 14) });
          }
          s.line(-XR, 0, XR, 0, { color: 'faint', width: 1, dash: [3, 5] });
          if (Mm > 1 && cone.value) for (const sg of [1, -1]) s.line(Sp[0], 0, Sp[0] - 30 * Math.cos(th), sg * 30 * Math.sin(th), { color: 'red', width: 2, dash: [7, 5] });
          // measured envelope: the highest point of all circles at several stations behind the source, fitted by a line
          let meas = NaN;
          if (Mm > 1.02) {
            const xs = [], ys = [];
            for (let d = 2; d <= 7; d += 0.25) {
              const x = Sp[0] - d; let ymax = 0;
              for (const [cx, R] of circles) { const q = R * R - (x - cx) * (x - cx); if (q > 0) ymax = Math.max(ymax, Math.sqrt(q)); }
              if (ymax > 0) { xs.push(-d); ys.push(ymax); }
            }
            if (xs.length > 5) { const L = M.linreg(xs, ys); meas = Math.atan(Math.abs(L.slope)); }
          }
          s.dot(Sp[0], 0, { r: 7, color: 'orange' });
          s.arrow(Sp[0], 0, Sp[0] + Math.min(1.6, 0.7 * Mm), 0, { color: 'orange', width: 2.4 });
          s.corner(Mm > 1 ? `Mach ${v.fix(Mm, 2)}: the source outruns its waves` : `Mach ${v.fix(Mm, 2)}: the waves run ahead of the source, no cone`, 'tl', { color: Mm > 1 ? 'red' : 'muted', weight: 600 });
          // ---- arrival time against emission time
          ta.setView([0, T], [0, T + 6]);
          const N = 400, pts = M.range(N + 1).map((i) => { const te = (T * i) / N; return [te, arr(te)]; });
          ta.path(pts, { color: 'accent', width: 2.4 });
          let imin = 0; for (let i = 1; i <= N; i++) if (pts[i][1] < pts[imin][1]) imin = i;
          const hasMin = imin > 0 && imin < N && Mm > 1;
          if (hasMin) { ta.dot(pts[imin][0], pts[imin][1], { r: 6, color: 'red', label: 'boom', labelPos: 'se' }); }
          ta.hline(tau, { color: 'gold', width: 1.8 });
          ta.line(0, 0, T, T, { color: 'faint', width: 1, dash: [3, 4] });
          const heard = []; for (let i = 0; i < N; i++) { const a = pts[i][1] - tau, b = pts[i + 1][1] - tau; if (a === 0 || a * b < 0) { const f = a / (a - b); heard.push(pts[i][0] + f * (pts[i + 1][0] - pts[i][0])); } }
          for (const te of heard) ta.dot(te, tau, { r: 5, color: 'gold' });
          info = { th, meas, heard, boom: hasMin ? pts[imin][1] : NaN, Mm };
        }, { still: 5.6 });
        v.soundButton('Listen: a fly-over', (snd) => {
          const c = 343, vs = mS.value * c, h = 40;
          const eng = (te) => { let x = 0; for (let k = 1; k <= 6; k++) x += Math.sin(TAU * 140 * k * te + k) / k; return x; };
          snd.samples(movingSourceSound(eng, [0, -h], [0, 0], [vs, 0], c, 5, 44100, -2.2), 44100, { gain: 0.55 });
        });
        v.legend([['accent', 'wavefronts (gold: the ones at the listener now)'], ['red', 'cone $\\sin\\theta=1/M$ and the boom', { dash: true }], ['gold', 'now']]);
        v.readout(() => {
          if (!info) return '';
          const { th, meas, heard, boom, Mm } = info, deg = (a) => v.fix((a * 180) / Math.PI, 1);
          const cone1 = Mm > 1 ? `half-angle $\\arcsin(1/M)$ = ${deg(th)}°, measured from the envelope of the circles ${isFinite(meas) ? deg(meas) + '°' : '…'}` : 'below Mach 1: no envelope, the fronts are nested circles';
          const ear = heard.length === 0 ? 'the listener hears nothing yet' : heard.length === 1 ? 'the listener hears one moment of the flight' : `the listener hears ${heard.length} moments of the flight at once, emitted at ${heard.map((x) => v.fix(x, 1)).join(' and ')}`;
          return `${cone1} · ${Mm > 1 && isFinite(boom) ? `boom at time ${v.fix(boom, 2)} (the minimum of the arrival curve) · ` : ''}now (${v.fix(tau, 2)}): ${ear}`;
        });
      },
    },
  ],
};
