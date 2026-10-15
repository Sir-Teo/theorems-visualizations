// Waves & Optics — Chapter 1: The wave equation (part b: junctions, sound, three dimensions, moving sources)
import { TAU, pulse, dpulse, makeChain, stackReflection, retarded, movingSourceSound, wall, rod } from './ch01.shared.js';

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
          } else es.text('waiting for the pulses to separate…', 2, 0.6, { color: 'muted', size: 11.5, align: 'center' });
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
  ],
};
