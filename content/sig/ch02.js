// Signals & Systems — Chapter 2: Systems and their properties
import {
  TAU, DT, NG, VIEW, I0, I1, tOf, iOf, sample, get, combo, shiftBy, maxDiff, maxAbs, pts, bump, ramp, rand, telegraph,
  SYS, MENU, menu, SHAPES, shapeMenu, picker, sysTex, drawable, bdBlock, num, errTex,
} from './ch02.shared.js';
import {recoveryPlot} from './recovery-plot.shared.js';

const SR = 22050;
/** Short linear fade in and out (in place) so sample buffers start and stop without clicks. */
function fade(buf, t = 0.01) { const n = Math.min(Math.floor(t * SR), buf.length >> 1); for (let i = 0; i < n; i++) { const g = i / n; buf[i] *= g; buf[buf.length - 1 - i] *= g; } return buf; }
/** A plucked string at 196 Hz: decaying harmonics with a fast attack, peak 0.45. */
function pluck() {
  const n = Math.round(1.5 * SR), b = new Float32Array(n); let m = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; let s = 0; for (let k = 1; k <= 9; k++) s += Math.sin(TAU * 196 * k * t + k) * Math.exp(-t * (1.1 + 0.9 * k)) / k; b[i] = s * Math.min(1, t / 0.004); m = Math.max(m, Math.abs(b[i])); }
  for (let i = 0; i < n; i++) b[i] *= 0.45 / m;
  return b;
}
/** An audio-rate version of a bench system (its own time constants: 0.25 s delay, 2 ms average, 1 ms RC, 300 Hz carrier). */
function audioSys(sys, x) {
  const D = Math.round(0.25 * SR), n = x.length + (sys.id === 'delay' ? D : 0), y = new Float32Array(n), X = (i) => (i >= 0 && i < x.length ? x[i] : 0);
  let s = 0;
  const a = Math.exp(-1 / (0.001 * SR)), W = Math.round(0.002 * SR);
  for (let i = 0; i < n; i++) {
    const v = X(i), t = i / SR;
    switch (sys.id) {
      case 'gain': y[i] = 2 * v; break;
      case 'square': y[i] = v * v; break;
      case 'delay': y[i] = X(i - D); break;
      case 'reverse': y[i] = X(x.length - 1 - i); break;
      case 'mavg': s += v - X(i - W); y[i] = s / W; break;
      case 'accum': s += v / SR; y[i] = s; break;
      case 'mod': y[i] = v * Math.cos(TAU * 300 * t); break;
      case 'clip': y[i] = Math.max(-0.12, Math.min(0.12, v)); break;
      case 'rc': s = a * s + (1 - a) * v; y[i] = s; break;
      default: { const w = sys.custom ? sys.fnRaw(v, t, X(i - D), X(i + D)) : v; y[i] = isFinite(w) ? w : 0; }
    }
  }
  let mean = 0; for (const v of y) mean += v / n; let m = 0; for (let i = 0; i < n; i++) { y[i] -= mean; m = Math.max(m, Math.abs(y[i])); }
  if (m > 0) for (let i = 0; i < n; i++) y[i] *= 0.45 / m;
  return fade(y);
}

/** Two-route "commutes?" mismatch: largest |a − b| on the window, with a relative zero. */
const mismatch = (a, b) => { const e = maxDiff(a, b), sc = Math.max(1, maxAbs(a), maxAbs(b)); return e <= 1e-9 * sc ? 0 : e; };

export default {
  collection: 'sig',
  chapter: 2,
  title: 'Systems and their properties',
  summary: String.raw`A system maps input signals to output signals, and the output at one instant may depend on the input at many instants. Six properties classify systems: linearity, time invariance, causality, memory, invertibility and stability. Each one is a statement about all inputs, so a single counterexample refutes it and a short argument proves it, and a lab bench of simple systems (amplifier, squarer, delay, time reversal, moving average, accumulator, modulator, clipper, RC filter) tests each property straight from its definition. The properties are independent of one another except that a memoryless system is always causal. The RC circuit and the difference equations of the moving average and the accumulator are the first worked examples; block diagrams give a language for wiring systems together, and incremental linearity explains why a charged capacitor seems to break linearity.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Systems as maps between signals',
      statement: String.raw`A **system** is a rule $S$ that assigns to every input signal $x$ in some class an output signal $y=S\{x\}$, often drawn as a box $x\to\boxed{S}\to y$. A continuous-time system maps functions of $t\in\R$ to functions of $t$; a discrete-time system maps sequences to sequences. The value of the output at one instant $t_0$ may depend on the whole input, not only on $x(t_0)$. For example
$$2x(t),\qquad x(t-1),\qquad \int_{t-1}^{t}x(s)\,ds,\qquad \int_{-\infty}^{t}x(s)\,ds,\qquad x(-t)$$
are an amplifier (it uses $x(t_0)$ only), a delay (one earlier value), a moving average (a window of the past), an accumulator (the whole past) and a time reversal (the value at $-t_0$, which lies in the future of $t_0$ when $t_0<0$). Systems compose like functions: the output of one may be the input of the next.`,
      idea: String.raw`Treating a system as a map on whole signals, rather than a formula on numbers, is what makes the properties of this chapter statable: linearity concerns $S\{ax_1+bx_2\}$, time invariance asks whether $S$ commutes with time shifts (sig-1.2), causality restricts which part of $x$ the value $y(t_0)$ may use. That dependence can be measured directly: nudge the input near one instant $s$ and see whether $y(t_0)$ moves. The instants that matter form the system's footprint at $t_0$: the single point $t_0$ for a memoryless system, one earlier point for a delay, a window for an average, all of $(-\infty,t_0]$ (with fading weights) for an integrator or an RC circuit, and the mirror point $-t_0$ for time reversal. A loudspeaker, a camera, an economy or a stock index can all be modelled this way: only the input–output map matters, not the mechanism inside the box.`,
      caption: String.raw`Choose a system and an input; drag in the top panel to redraw the input. The bottom panel is the output, computed from the whole input on a fine time grid. Drag the gold probe along the output: the gold shading in the top panel is the system's footprint at $t_0$, found by nudging the input near each instant $s$ and measuring how far $y(t_0)$ moves. Choose *yours* to type a system using $x$, $t$, $xd=x(t-1)$ and $xa=x(t+1)$. *Listen* plays a plucked string, then the same string through an audio-rate version of the system.`,
      deps: ['sig-1.1', 'sig-1.2'],
      refs: ['Oppenheim–Willsky §1.5', 'Lathi ch. 1'],
      tags: ['systems', 'signals'],
      viz(v) {
        const M = v.M;
        const sel = v.select('system', menu(['gain', 'square', 'delay', 'reverse', 'mavg', 'accum', 'mod', 'clip', 'rc', 'custom']), 'mavg');
        const shape = v.select('input', shapeMenu(), 'pulse', { onChange: (k) => sig.set(SHAPES[k].f) });
        const fx = v.input('your system $y(t)=$', 'x - 0.6 xd', { vars: ['x', 't', 'xd', 'xa'], width: 190, placeholder: 'x^2, t x, x - 0.6 xd, xa - x' });
        const current = picker(sel, fx);
        v.soundButton('Listen: a plucked string $x$', (snd) => snd.samples(fade(pluck()), SR, { gain: 0.6 }));
        v.soundButton('Listen: $S\\{x\\}$', (snd) => { const sys = current(); if (sys.custom) sys.fnRaw = fx.fn; snd.samples(audioSys(sys, pluck()), SR, { gain: 0.6 }); });
        const sIn = v.stage({ x: [-5.2, 5.2], y: [-1.7, 1.95], height: 190, axes: 'box', yticks: [-1, 0, 1], full: true, title: 'input $x(t)$ (drag to redraw); gold: where $y(t_0)$ looks' });
        const sBox = v.stage({ x: [0, 20], y: [0, 2], height: 66, axes: false, full: true });
        const sOut = v.stage({ x: [-5.2, 5.2], y: [-1.7, 1.95], height: 210, axes: 'box', yticks: [-1, 0, 1], xlabel: 't', full: true, title: 'output $y=S\\{x\\}$' });
        const sig = drawable(sIn, -4.8, 9.6, 576, SHAPES.pulse.f, [-1.6, 1.85], { edge: 5.2 });
        // footprint: perturb the input by a small tent near s_k and record how much y moves at every t
        const KS = 141, S0 = -5.25, SH = 0.075, HW = 7; // centres −5.25 … 5.25, tents of half-width 0.07
        let F = { key: '' };
        const compute = () => {
          const sys = current(), key = `${sys.id}|${sys.src ?? ''}|${sig.ver}`;
          if (key === F.key) return F;
          const x = sig.arr(), y = sys.run(x), eps = 0.25, D = [];
          for (let k = 0; k < KS; k++) {
            const ic = iOf(S0 + k * SH), xp = Float64Array.from(x);
            for (let j = -HW; j <= HW; j++) xp[ic + j] += eps * (1 - Math.abs(j) / HW);
            const yp = sys.run(xp), d = new Float32Array(I1 - I0 + 1);
            for (let i = I0; i <= I1; i++) d[i - I0] = Math.abs(yp[i] - y[i]) / eps;
            D.push(d);
          }
          return (F = { key, sys, x, y, D });
        };
        let yNow = null;
        const curY = (t) => (yNow ? yNow[iOf(t)] : 0);
        const probe = sOut.handle(1.2, 0, { color: 'gold', r: 6.5, constrain: (x) => { const t = M.clamp(Math.round(x / 0.05) * 0.05, -4.9, 4.9); const y = curY(t); return [t, isFinite(y) ? M.clamp(y, -30, 30) : 0]; } });
        let info = null;
        v.render(() => {
          fx.el.hidden = sel.value !== 'custom';
          const { sys, x, y, D } = compute(); yNow = y;
          const t0 = probe.x, i0 = iOf(t0), y0 = y[i0];
          probe.y = isFinite(y0) ? M.clamp(y0, -30, 30) : 0;
          // footprint weights and the intervals where they matter
          const w = D.map((d) => d[i0 - I0]), wm = Math.max(...w.filter(isFinite), 0);
          const ivs = [];
          if (wm > 1e-9) for (let k = 0; k < KS; k++) if (w[k] > 1e-6 * wm) { const L = ivs[ivs.length - 1]; if (L && L[1] === k - 1) L[1] = k; else ivs.push([k, k]); }
          // refine each edge to the grid: does nudging the single sample j move y(t0)?
          const moves = (j) => { const xp = Float64Array.from(x); xp[j] += 0.25; const d = Math.abs(sys.run(xp)[i0] - y0); return d > 1e-12 * Math.max(1, Math.abs(y0)); };
          const edges = ivs.map(([k0, k1]) => {
            let a = null, b = null;
            if (k0 > 0) for (let j = iOf(S0 + k0 * SH) - HW; j <= iOf(S0 + k0 * SH) + HW; j++) if (moves(j)) { a = tOf(j); break; }
            for (let j = iOf(S0 + k1 * SH) + HW; j >= iOf(S0 + k1 * SH) - HW; j--) if (moves(j)) { b = tOf(j); break; }
            return { a: k0 === 0 ? -Infinity : a ?? S0 + k0 * SH, b: b ?? S0 + k1 * SH };
          });
          // ---- input panel
          sIn.hline(0, { color: 'faint', width: 1 });
          if (wm > 1e-9) for (let k = 0; k < KS; k++) if (w[k] > 1e-6 * wm) { const c = S0 + k * SH; sIn.rect(c - SH / 2, -1.7, c + SH / 2, 1.95, { fill: 'gold', fillAlpha: 0.08 + 0.5 * Math.min(1, w[k] / wm), stroke: false }); }
          sIn.vline(t0, { color: 'gold', width: 1.2, dash: [4, 4] });
          sIn.path(pts(x, -5.2, 5.2), { color: 'accent', width: 2.4 });
          sIn.text('t₀', t0, 1.78, { color: 'gold', size: 12.5, weight: 700, align: 'center' });
          // ---- the box
          const YB = 0.82;
          sBox.arrow(0.4, YB, 6.1, YB, { color: 'accent', width: 2, head: 9 });
          sBox.text('x(t)', 1.6, YB + 0.42, { math: true, color: 'accent', size: 16, align: 'center' });
          bdBlock(sBox, 10, YB, 7.6, 1.2, sys.custom ? null : sys.tex, { color: 'purple', size: 15 });
          if (sys.custom) sBox.text(`y = ${sys.src}`, 10, YB, { size: 13, align: 'center', color: 'ink' });
          sBox.text(sys.custom ? 'your system' : sys.label, 10, YB + 0.68, { size: 11, color: 'muted', align: 'center', baseline: 'bottom' });
          sBox.arrow(13.9, YB, 19.6, YB, { color: 'purple', width: 2, head: 9 });
          sBox.text('y(t)', 18.4, YB + 0.42, { math: true, color: 'purple', size: 16, align: 'center' });
          // ---- output panel
          let lo = -1.7, hi = 1.95; for (let i = I0; i <= I1; i++) if (isFinite(y[i])) { lo = Math.min(lo, 1.12 * y[i]); hi = Math.max(hi, 1.15 * y[i]); }
          sOut.setView(null, [Math.max(-30, lo), Math.min(30, hi)]);
          sOut.hline(0, { color: 'faint', width: 1 });
          sOut.path(pts(x, -5.2, 5.2), { color: 'muted', width: 1.2, dash: [4, 4], alpha: 0.7 });
          sOut.clip(() => sOut.path(pts(y, -5.2, 5.2), { color: 'purple', width: 2.4 }));
          sOut.vline(t0, { color: 'gold', width: 1.2, dash: [4, 4] });
          const lab = isFinite(y0) ? `y(t₀) = ${v.fix(y0, 3)}` : 'y(t₀) undefined', yb = sOut.bounds.y;
          sOut.text(lab, t0, yb[1] - 0.05 * (yb[1] - yb[0]), { color: 'gold', size: 12.5, weight: 700, align: t0 > 3.2 ? 'right' : t0 < -3.2 ? 'left' : 'center' });
          info = { sys, t0, y0, edges, wm };
        });
        v.legend([['accent', 'input $x(t)$'], ['purple', 'output $y(t)$'], ['gold', 'footprint of $y(t_0)$: where nudging $x$ moves it', { area: true }], ['muted', 'input, for comparison', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { sys, t0, y0, edges, wm } = info, T = v.fix(t0, 2), r5 = (u) => v.fix(Math.round(u / 0.05) * 0.05, 2);
          const head = `${sysTex(sys)} · at $t_0$ = ${T}: $y(t_0)$ = ${isFinite(y0) ? v.fix(y0, 3) : 'undefined'}`;
          if (!(wm > 1e-9)) return `${head} · nudging the input anywhere leaves $y(t_0)$ unchanged${sys.id === 'clip' ? ': the clipper is saturated here, so small changes of $x$ near $t_0$ are cut off' : ''}`;
          const rel = (u) => { const d = Math.round((u - t0) / 0.05) * 0.05; return Math.abs(d) < 0.026 ? '$t_0$ itself' : d < 0 ? `${v.fix(-d, 2)} before $t_0$` : `**${v.fix(d, 2)} after $t_0$**`; };
          const parts = edges.map(({ a, b }) => {
            if (a === -Infinity) return `all of the past up to ${rel(b) === '$t_0$ itself' ? '$t_0$' : `${r5(b)} (${rel(b)})`}${sys.id === 'rc' ? ', with weights fading like $e^{-(t_0-s)}$' : ''}`;
            if (b - a < 0.011) return `the single instant $s$ = ${r5(a)} (${rel(a)})`;
            return `the window from ${r5(a)} to ${r5(b)} (${rel(a)} to ${rel(b)})`;
          });
          const only = edges.length === 1 && edges[0].b - edges[0].a < 0.011 && Math.abs(edges[0].a - t0) < 0.006;
          return `${head} · it depends on the input at ${parts.join(' and ')}${only ? ': a memoryless dependence' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Definition',
      name: 'Linearity',
      statement: String.raw`A system $S$ is **linear** if it respects superposition: for all inputs $x_1,x_2$ and all constants $a,b$,
$$S\{a\,x_1+b\,x_2\}=a\,S\{x_1\}+b\,S\{x_2\}.$$
Equivalently, $S$ is **additive**, $S\{x_1+x_2\}=S\{x_1\}+S\{x_2\}$, and **homogeneous**, $S\{ax\}=a\,S\{x\}$. Taking $a=b=0$ shows that a linear system maps the zero signal to the zero signal (*zero in, zero out*). By induction superposition extends to every finite combination $\sum_k a_kx_k$, and, for systems that are continuous in a suitable sense, to infinite sums and integrals of inputs, which is what the convolution integral and Fourier analysis exploit.`,
      idea: String.raw`Linearity is a claim about every pair of inputs and every pair of coefficients, so one failing instance refutes it while no number of successful trials proves it; proofs come from the formula, because sums and constant multiples pass through delays, integrals, derivatives and multiplication by a fixed function of $t$. The squarer fails through the cross term $2ab\,x_1x_2$; the clipper passes as long as $ax_1+bx_2$ stays inside $[-1,1]$ and fails as soon as it leaves; the affine map $2x+1$ fails because of its offset, although its graph is a straight line: $S\{0\}=1\neq0$ (such systems are incrementally linear, 2.11). Superposition in circuits (circ-3.1) is the same principle for networks of resistors and sources: the response to several sources together is the sum of the responses to each one alone.`,
      caption: String.raw`Draw $x_1$ in the top panel (blue), choose $x_2$ (purple) and the coefficients $a,b$; the gold curve is the combination $ax_1+bx_2$. Bottom left: the system's response to the combination (green) and the same combination of the separate responses (orange, dashed), with any mismatch shaded red. Bottom right: the two sides plotted against each other, one dot per instant; a linear system puts every dot on the diagonal. Try the clipper with small and then large coefficients, and the affine map $2x+1$ with $a=b=0$.`,
      deps: ['sig-2.1', 'circ-3.1'],
      refs: ['Oppenheim–Willsky §1.6', 'Lathi ch. 1'],
      tags: ['linearity', 'superposition'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Linear_system' },
      viz(v) {
        const M = v.M;
        const sel = v.select('system', menu(['gain', 'square', 'delay', 'reverse', 'mavg', 'accum', 'mod', 'clip', 'rc', 'affine', 'custom']), 'clip');
        const fx = v.input('your system $y(t)=$', 'x + 0.3 x^2', { vars: ['x', 't', 'xd', 'xa'], width: 190 });
        const aS = v.slider('$a$', -2, 2, 1.2, { step: 0.05 });
        const bS = v.slider('$b$', -2, 2, 0.9, { step: 0.05 });
        const X2 = {
          sine: { label: 'sinusoid', f: (t) => (t >= -4.5 ? 0.8 * Math.sin((TAU * (t + 4.5)) / 2.2) : 0) },
          step: { label: 'step', f: (t) => 0.7 * ramp((t - 0.5) / 0.3) },
          bump: { label: 'bump', f: (t) => 1.1 * bump(t, 1.4, 1.3) - 0.5 * bump(t, -2.6, 0.7) },
        };
        const x2S = v.select('$x_2$', Object.entries(X2).map(([value, o]) => ({ value, label: o.label })), 'sine');
        const current = picker(sel, fx);
        const sIn = v.stage({ x: [-5.2, 5.2], y: [-2.3, 2.5], height: 185, axes: 'box', yticks: [-1, 0, 1, 2], full: true, title: 'inputs $x_1$ (drag to redraw), $x_2$ and the combination $ax_1+bx_2$' });
        const sOut = v.stage({ x: [-5.2, 5.2], y: [-2.3, 2.5], height: 255, axes: 'box', xlabel: 't', weight: 1.75, title: '$S\\{ax_1+bx_2\\}$ against $aS\\{x_1\\}+bS\\{x_2\\}$' });
        const sSc = v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], equal: true, height: 255, axes: true, weight: 1, xlabel: 'aS{x₁}+bS{x₂}', title: 'one side against the other' });
        const sig = drawable(sIn, -4.8, 9.6, 576, SHAPES.pulse.f, [-2.2, 2.4], { edge: 5.2 });
        let info = null;
        v.render(() => {
          fx.el.hidden = sel.value !== 'custom';
          const sys = current(), a = aS.value, b = bS.value, x1 = sig.arr(), x2 = sample(X2[x2S.value].f), xc = combo(a, x1, b, x2);
          const y1 = sys.run(x1), y2 = sys.run(x2), lhs = sys.run(xc), rhs = combo(a, y1, b, y2);
          const sc = Math.max(1, maxAbs(lhs), maxAbs(rhs)), err = mismatch(lhs, rhs);
          // homogeneity and additivity separately, and the response to zero
          const eH = mismatch(sys.run(combo(a, x1, 0, x1)), combo(a, y1, 0, y1)), eA = mismatch(sys.run(combo(1, x1, 1, x2)), combo(1, y1, 1, y2));
          const z = maxAbs(sys.run(new Float64Array(NG + 1)));
          // ---- inputs
          sIn.hline(0, { color: 'faint', width: 1 });
          sIn.path(pts(x2, -5.2, 5.2), { color: 'purple', width: 1.8 });
          sIn.path(pts(x1, -5.2, 5.2), { color: 'accent', width: 2.2 });
          sIn.clip(() => sIn.path(pts(xc, -5.2, 5.2), { color: 'gold', width: 3, alpha: 0.85 }));
          if (sys.id === 'clip') sIn.hband(-1, 1, { color: 'green', alpha: 0.06, edges: true });
          // ---- outputs
          const R = Math.max(1.4, Math.min(12, 1.15 * Math.max(maxAbs(lhs), maxAbs(rhs)) || 1.4));
          sOut.setView(null, [-R, R * 1.08]);
          sOut.hline(0, { color: 'faint', width: 1 });
          const L = pts(lhs, -5.2, 5.2), Rr = pts(rhs, -5.2, 5.2);
          if (err > 0) sOut.clip(() => { for (let k = 0; k + 1 < L.length; k++) if (L[k] && Rr[k] && L[k + 1] && Rr[k + 1]) sOut.poly([L[k], L[k + 1], Rr[k + 1], Rr[k]], { fill: 'red', fillAlpha: 0.3, stroke: false }); });
          sOut.clip(() => { sOut.path(L, { color: 'green', width: 2.6 }); sOut.path(Rr, { color: 'orange', width: 2, dash: [6, 4] }); });
          // ---- scatter
          const Q = Math.max(1, 1.12 * Math.max(maxAbs(lhs), maxAbs(rhs)) || 1);
          sSc.setView([-Q, Q], [-Q, Q]);
          sSc.line(-Q, -Q, Q, Q, { color: 'muted', width: 1.2, dash: [5, 4] });
          const good = [], bad = [];
          for (let i = I0; i <= I1; i += 4) if (isFinite(lhs[i]) && isFinite(rhs[i])) (Math.abs(lhs[i] - rhs[i]) <= 1e-9 * sc ? good : bad).push([rhs[i], lhs[i]]);
          sSc.dots(good, { r: 2.6, color: 'green' }); sSc.dots(bad, { r: 2.6, color: 'red' });
          sSc.text('S{ax₁+bx₂}', -Q, Q, { dx: 6, dy: 10, size: 11.5, color: 'muted', align: 'left' });
          info = { sys, a, b, err, eH, eA, z, frac: bad.length / Math.max(1, good.length + bad.length), sat: sys.id === 'clip' ? maxAbs(xc) : null };
        });
        v.legend([['accent', '$x_1$'], ['purple', '$x_2$'], ['gold', '$ax_1+bx_2$'], ['green', '$S\\{ax_1+bx_2\\}$'], ['orange', '$aS\\{x_1\\}+bS\\{x_2\\}$', { dash: true }], ['red', 'mismatch', { area: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { sys, a, b, err, eH, eA, z, frac, sat } = info;
          const verdict = !isFinite(err) ? 'the output is undefined for some inputs' : err === 0 ? '**superposition holds** for this pair (to rounding)' : `**superposition fails**: the two sides differ by up to ${num(err)} (${Math.round(100 * frac)}% of the dots are off the diagonal)`;
          let why = '';
          if (z > 1e-9) why = ` · zero in gives ${num(z)} out, but a linear system must map $0$ to $0$`;
          else if (sys.id === 'square') why = ' · the mismatch is the cross term $2ab\\,x_1x_2$ (plus $(a^2-a)x_1^2+(b^2-b)x_2^2$)';
          else if (sat != null) why = sat > 1 ? ` · $ax_1+bx_2$ reaches ${v.fix(sat, 2)}, outside $[-1,1]$, where the clipper flattens it` : ' · the combination stays inside $[-1,1]$, where the clipper is the identity, so this pair cannot see the nonlinearity: raise $a$ or $b$';
          return `${sysTex(sys)}, $a$ = ${v.fix(a, 2)}, $b$ = ${v.fix(b, 2)}: $\\max_t|S\\{ax_1+bx_2\\}-aS\\{x_1\\}-bS\\{x_2\\}|$ = $${errTex(err)}$ → ${verdict} · homogeneity alone ($S\\{ax_1\\}$ vs $aS\\{x_1\\}$): $${errTex(eH)}$, additivity alone ($S\\{x_1+x_2\\}$ vs $S\\{x_1\\}+S\\{x_2\\}$): $${errTex(eA)}$${why}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Definition',
      name: 'Time invariance',
      statement: String.raw`A system is **time-invariant** if delaying the input delays the output by the same amount and changes nothing else: whenever $x\mapsto y$,
$$x(t-\tau)\ \longmapsto\ y(t-\tau)\qquad\text{for every real }\tau$$
(every integer shift $n_0$ in discrete time). Equivalently, $S$ commutes with every time shift: shifting and then applying the system gives the same signal as applying the system and then shifting. Systems whose rule refers to the clock itself (a gain $t\,x(t)$, a carrier $\cos\omega_0t$, a switch thrown at a fixed time) or that rescale time ($x(2t)$, $x(-t)$) are **time-varying**.`,
      idea: String.raw`Write $T_\tau$ for the shift $x\mapsto x(\cdot-\tau)$ (sig-1.2); time invariance says $S\circ T_\tau=T_\tau\circ S$. A rule built only from input values at times measured *relative to* $t$ (such as $x(t)$, $x(t-1)$, $\int_{t-1}^tx$, or the solution of a constant-coefficient differential equation started from rest) commutes with shifts by a change of variable. A rule that mentions $t$ itself does not: for $y=t\,x(t)$ the shifted input gives $t\,x(t-\tau)$ but the shifted output is $(t-\tau)\,x(t-\tau)$. For $y=x(2t)$ the shifted input gives $x(2t-\tau)$, the output shifted by only $\tau/2$; for $y=x(-t)$ it gives $x(-t-\tau)=y(t+\tau)$, the output shifted the wrong way. The modulator $x(t)\cos2\pi t$ fails in general but commutes with shifts by whole carrier periods. Together with linearity, time invariance is what lets a single impulse response describe a system (chapter 3).`,
      caption: String.raw`Draw an input (blue) and set the shift $\tau$ (purple dashed copy). Bottom left: route 1 shifts first and then applies the system (green); route 2 applies the system and then shifts the output (orange dashed); red shading marks any mismatch. Bottom right: the largest mismatch for every shift $\tau$ from $-3$ to $3$. A time-invariant system gives the zero line. Try $t\,x(t)$, $x(2t)$ and time reversal, then the modulator, whose curve touches zero at whole-period shifts.`,
      deps: ['sig-2.1', 'sig-1.2'],
      refs: ['Oppenheim–Willsky §1.6', 'Lathi ch. 1'],
      tags: ['time invariance', 'time shift'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Time-invariant_system' },
      viz(v) {
        const M = v.M;
        const sel = v.select('system', menu(['gain', 'square', 'delay', 'reverse', 'mavg', 'accum', 'mod', 'rc', 'tx', 'compress', 'custom']), 'tx');
        const fx = v.input('your system $y(t)=$', 'x cos(t)', { vars: ['x', 't', 'xd', 'xa'], width: 190 });
        const tauS = v.slider('shift $\\tau$', -3, 3, 1.5, { step: 0.05 });
        v.select('input', shapeMenu(['pulse', 'wiggle', 'step', 'sine']), 'wiggle', { onChange: (k) => sig.set(SHAPES[k].f) });
        const current = picker(sel, fx);
        const sIn = v.stage({ x: [-5.2, 5.2], y: [-1.5, 2.1], height: 175, axes: 'box', yticks: [-1, 0, 1], full: true, title: 'input $x(t)$ (drag to redraw) and the shifted input $x(t-\\tau)$' });
        const sOut = v.stage({ x: [-5.2, 5.2], y: [-1.5, 2], height: 245, axes: 'box', xlabel: 't', weight: 1.7, title: 'shift, then system  vs  system, then shift' });
        const sE = v.stage({ x: [-3.15, 3.15], y: [0, 1], height: 245, axes: 'box', xlabel: 'τ', weight: 1, title: 'largest mismatch, as a function of $\\tau$' });
        const sig = drawable(sIn, -4.8, 9.6, 576, SHAPES.wiggle.f, [-1.4, 1.9], { edge: 5.2 });
        let curve = { key: '' }, info = null;
        v.render(() => {
          fx.el.hidden = sel.value !== 'custom';
          const sys = current(), tau = tauS.value, k = Math.round(tau / DT), x = sig.arr();
          const y = sys.run(x), xs = shiftBy(x, k), lhs = sys.run(xs), rhs = shiftBy(y, k), err = mismatch(lhs, rhs);
          // e(τ) on a grid of shifts (cached per system and input)
          const key = `${sys.id}|${sys.src ?? ''}|${sig.ver}`;
          if (key !== curve.key) {
            const E = [];
            for (let j = -60; j <= 60; j++) { const kk = j * 5; E.push([kk * DT, mismatch(sys.run(shiftBy(x, kk)), shiftBy(y, kk))]); }
            curve = { key, E };
          }
          // ---- input
          sIn.hline(0, { color: 'faint', width: 1 });
          sIn.path(pts(x, -5.2, 5.2), { color: 'accent', width: 2.3 });
          sIn.path(pts(xs, -5.2, 5.2), { color: 'purple', width: 2, dash: [6, 4] });
          const im = (() => { let b = I0, m = 0; for (let i = I0; i <= I1; i++) if (Math.abs(x[i]) > m) { m = Math.abs(x[i]); b = i; } return tOf(b); })();
          if (Math.abs(tau) > 0.15) sIn.arrow(im, 1.75, im + tau, 1.75, { color: 'purple', width: 1.6, head: 7 });
          sIn.text(`τ = ${v.fix(tau, 2)}`, im + tau, 1.75, { dx: tau >= 0 ? 8 : -8, color: 'purple', size: 12, weight: 600, align: tau >= 0 ? 'left' : 'right' });
          // ---- the two routes
          const top = Math.max(maxAbs(lhs), maxAbs(rhs), maxAbs(y));
          const R = Math.max(1.3, Math.min(12, 1.15 * top || 1.3));
          sOut.setView(null, [-R, R * 1.15]);
          sOut.hline(0, { color: 'faint', width: 1 });
          sOut.clip(() => sOut.path(pts(y, -5.2, 5.2), { color: 'muted', width: 1.2, alpha: 0.55 }));
          const L = pts(lhs, -5.2, 5.2), Rr = pts(rhs, -5.2, 5.2);
          if (err > 0) sOut.clip(() => { for (let q = 0; q + 1 < L.length; q++) if (L[q] && Rr[q] && L[q + 1] && Rr[q + 1]) sOut.poly([L[q], L[q + 1], Rr[q + 1], Rr[q]], { fill: 'red', fillAlpha: 0.3, stroke: false }); });
          sOut.clip(() => { sOut.path(L, { color: 'green', width: 2.6 }); sOut.path(Rr, { color: 'orange', width: 2, dash: [6, 4] }); });
          // ---- e(τ)
          const E = curve.E, emax = Math.max(...E.map((p) => p[1]).filter(isFinite), 0);
          sE.setView(null, emax > 0 ? [-0.13 * emax, 1.15 * emax] : [-0.13, 1]);
          sE.hline(0, { color: 'faint', width: 1 });
          sE.path(E.map(([t, e]) => (isFinite(e) ? [t, e] : null)), { color: emax > 0 ? 'red' : 'green', width: 2.2 });
          sE.vline(tau, { color: 'gold', width: 1.4 });
          sE.dot(tau, isFinite(err) ? err : 0, { color: 'gold', r: 5 });
          if (emax === 0) sE.text('zero for every τ', 0, 0.5, { color: 'green', size: 13, weight: 600, align: 'center' });
          info = { sys, tau, err, emax, zeros: E.filter(([t, e]) => e === 0 && Math.abs(t) > 0.01).map(([t]) => t) };
        });
        v.legend([['accent', '$x(t)$'], ['purple', '$x(t-\\tau)$', { dash: true }], ['green', 'route 1: $S\\{x(t-\\tau)\\}$'], ['orange', 'route 2: $y(t-\\tau)$', { dash: true }], ['muted', '$y(t)$ unshifted'], ['red', 'mismatch', { area: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { sys, tau, err, emax, zeros } = info;
          const WHY = {
            tx: 'the factor $t$ is pinned to the clock: shifting the input does not shift it, since $t\\,x(t-\\tau)\\ne(t-\\tau)\\,x(t-\\tau)$',
            compress: 'the shifted input gives $x(2t-\\tau)$, which is the output moved by only $\\tau/2$',
            reverse: 'the shifted input gives $x(-t-\\tau)=y(t+\\tau)$: the output moves the opposite way',
            mod: `the carrier $\\cos2\\pi t$ stays put while the message moves; the routes agree only for shifts by whole carrier periods${zeros.length ? ` (zero mismatch found at $\\tau$ = ${zeros.map((t) => v.fix(t, 0)).join(', ')})` : ''}`,
          };
          const ver = !isFinite(err) ? 'the output is undefined for some inputs' : err === 0 ? 'the two routes agree' : `the routes differ by up to ${num(err)}`;
          const all = emax === 0 ? 'zero mismatch for all 121 shifts tried: consistent with time invariance' : `**time-varying**: ${WHY[sys.id] ?? `the mismatch reaches ${num(emax)} over the shifts tried`}`;
          return `${sysTex(sys)} · at $\\tau$ = ${v.fix(tau, 2)}: $\\max_t|S\\{x(t-\\tau)\\}-y(t-\\tau)|$ = $${errTex(err)}$, ${ver} · ${all}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Definition',
      name: 'Causality',
      statement: String.raw`A system is **causal** (non-anticipative) if the output at any time depends only on the input up to that time: whenever two inputs agree for $t\le t_0$, their outputs agree for $t\le t_0$, for every $t_0$. For a linear system an equivalent test is that every input that vanishes for $t\le t_0$ produces an output that vanishes for $t\le t_0$. A system that runs in real time must be causal; systems that process recorded data (an image, a centred average of last year's prices, a tape played backwards) need not be.`,
      idea: String.raw`Causality restricts the footprint of 2.1: the instants that $y(t_0)$ reads must lie in $(-\infty,t_0]$. The delay, the trailing moving average and any differential equation solved forward from rest pass, since their outputs are built from the past alone. The centred average $\int_{t-1/2}^{t+1/2}x$ reads half a time unit ahead and the advance $x(t+1)$ a full unit; time reversal reads $x(-t)$, which lies in the future of $t$ whenever $t<0$, and the compressor $x(2t)$ reads ahead whenever $t>0$. A single pair of inputs can only refute causality, never prove it: for time reversal, two inputs that diverge at a negative $t_0$ give outputs that still agree up to $t_0$. Memoryless systems (2.5) are automatically causal, and for linear time-invariant systems causality becomes the condition $h(t)=0$ for $t<0$ on the impulse response (3.5).`,
      caption: String.raw`The two inputs (blue and purple dashed) are identical up to the cursor $t_0$ and differ after it; drag the cursor, and choose how the future changes. Middle: the two outputs. Bottom: the difference of the inputs (purple) and of the outputs (red); for a causal system the red curve must vanish everywhere left of $t_0$. Pick the centred average or the advance: the outputs separate before the inputs do, and the readout measures how far ahead the system looked. Then try time reversal with $t_0<0$ and with $t_0>0$.`,
      deps: ['sig-2.1'],
      refs: ['Oppenheim–Willsky §1.6', 'Lathi ch. 1'],
      tags: ['causality'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Causal_system' },
      viz(v) {
        const M = v.M;
        const sel = v.select('system', menu(['square', 'delay', 'mavg', 'accum', 'rc', 'cavg', 'advance', 'reverse', 'compress', 'custom']), 'cavg');
        const fx = v.input('your system $y(t)=$', 'x - xa', { vars: ['x', 't', 'xd', 'xa'], width: 190 });
        const chg = v.select('after $t_0$, input 2', [{ value: 'bump', label: 'gets a bump' }, { value: 'step', label: 'jumps up' }, { value: 'off', label: 'switches off' }], 'bump');
        v.select('input', shapeMenu(['pulse', 'wiggle', 'sine', 'noise']), 'wiggle', { onChange: (k) => sig.set(SHAPES[k].f) });
        const current = picker(sel, fx);
        const sIn = v.stage({ x: [-5.2, 5.2], y: [-1.75, 2], height: 175, axes: 'box', yticks: [-1, 0, 1], full: true, title: 'two inputs that agree up to $t_0$ (drag the cursor; drag elsewhere to redraw)' });
        const sOut = v.stage({ x: [-5.2, 5.2], y: [-1.7, 2], height: 185, axes: 'box', yticks: [-1, 0, 1], full: true, title: 'their outputs' });
        const sD = v.stage({ x: [-5.2, 5.2], y: [-1.2, 1.2], height: 140, axes: 'box', xlabel: 't', full: true, title: 'differences: input 2 − input 1 and output 2 − output 1' });
        const YC = -1.5;
        const cur = sIn.handle(0.5, YC, { color: 'gold', r: 7, constrain: (x) => [M.clamp(Math.round(x / 0.05) * 0.05, -4.5, 4.5), YC] });
        const sig = drawable(sIn, -4.8, 9.6, 576, SHAPES.wiggle.f, [-1.3, 1.9], { edge: 5.2, enabled: () => !cur.dragging });
        let info = null;
        v.render(() => {
          fx.el.hidden = sel.value !== 'custom';
          const sys = current(), t0 = cur.x, i0 = iOf(t0), x1 = sig.arr();
          const x2 = Float64Array.from(x1);
          for (let i = i0 + 1; i <= NG; i++) { const s = tOf(i) - t0; x2[i] = chg.value === 'bump' ? x1[i] + 0.9 * bump(s, 0.6, 0.6) : chg.value === 'step' ? x1[i] + 0.8 * (1 - Math.exp(-s / 0.15)) : 0; }
          const y1 = sys.run(x1), y2 = sys.run(x2), sc = Math.max(1, maxAbs(y1), maxAbs(y2));
          const dX = combo(1, x2, -1, x1), dY = combo(1, y2, -1, y1);
          let first = null; for (let i = I0; i <= I1; i++) if (!(Math.abs(dY[i]) <= 1e-9 * sc)) { first = tOf(i); break; }
          let pastErr = 0; for (let i = I0; i <= i0; i++) pastErr = Math.max(pastErr, Math.abs(dY[i]));
          if (!isFinite(maxAbs(dY))) pastErr = NaN;
          // ---- inputs
          for (const S of [sIn, sOut, sD]) { S.rect(t0, -5, 5.3, 5, { fill: 'orange', fillAlpha: 0.06, stroke: false }); S.vline(t0, { color: 'gold', width: 1.4, dash: [5, 4] }); S.hline(0, { color: 'faint', width: 1 }); }
          sIn.text('past', t0, 1.82, { dx: -8, color: 'muted', size: 11.5, align: 'right' }); sIn.text('future', t0, 1.82, { dx: 8, color: 'orange', size: 11.5, align: 'left' });
          sIn.path(pts(x2, -5.2, 5.2), { color: 'purple', width: 2, dash: [6, 4] });
          sIn.path(pts(x1, -5.2, 5.2), { color: 'accent', width: 2.2 });
          sIn.text('t₀', t0, YC, { dy: -14, color: 'gold', size: 12.5, weight: 700, align: 'center' });
          // ---- outputs
          const R = Math.max(1.4, Math.min(12, 1.15 * Math.max(maxAbs(y1), maxAbs(y2)) || 1.4));
          sOut.setView(null, [-R, R * 1.1]);
          sOut.clip(() => { sOut.path(pts(y2, -5.2, 5.2), { color: 'orange', width: 2, dash: [6, 4] }); sOut.path(pts(y1, -5.2, 5.2), { color: 'green', width: 2.3 }); });
          // ---- differences
          const D = Math.max(0.6, 1.15 * Math.max(maxAbs(dX), maxAbs(dY)) || 0.6);
          sD.setView(null, [-D, D]);
          const PX = pts(dX, -5.2, 5.2); sD.poly([[-5.2, 0], ...PX, [5.2, 0]], { fill: 'purple', fillAlpha: 0.12, stroke: false }); sD.path(PX, { color: 'purple', width: 1.6 });
          sD.clip(() => sD.path(pts(dY, -5.2, 5.2), { color: 'red', width: 2.3 }));
          if (first != null && first <= t0) {
            for (const S of [sOut, sD]) S.rect(first, -50, t0, 50, { fill: 'red', fillAlpha: 0.1, stroke: false });
            sD.arrow(t0, 0.72 * D, first, 0.72 * D, { color: 'red', width: 1.6, head: 7 });
            sD.text(`reacts ${v.fix(t0 - first + DT, 2)} early`, first, 0.72 * D, { dx: -8, color: 'red', size: 12, weight: 600, align: 'right' });
          }
          info = { sys, t0, first, pastErr, sc };
        });
        v.legend([['accent', 'input 1'], ['purple', 'input 2 (same up to $t_0$)', { dash: true }], ['green', 'output 1'], ['orange', 'output 2', { dash: true }], ['red', 'output difference']]);
        v.readout(() => {
          if (!info) return '';
          const { sys, t0, first, pastErr, sc } = info;
          if (!isFinite(pastErr)) return `${sysTex(sys)}: the output is undefined for these inputs`;
          const head = `${sysTex(sys)} · the inputs agree for $t\\le t_0$ = ${v.fix(t0, 2)}`;
          if (pastErr <= 1e-9 * sc) {
            const when = first == null ? 'the outputs agree on the whole window' : `the outputs first differ at $t$ = ${v.fix(first, 2)}, after $t_0$`;
            const hint = sys.id === 'reverse' || sys.id === 'compress' ? ` · this pair does not expose ${sys.id === 'reverse' ? 'time reversal' : 'the compressor'}: move $t_0$ further right. One pair can refute causality, never prove it` : ' · consistent with causality';
            return `${head}; ${when}: $\\max_{t\\le t_0}|y_2-y_1|$ = 0${hint}`;
          }
          return `${head}, but the outputs already differ at $t$ = ${v.fix(first, 2)}, ${v.fix(t0 - first + DT, 2)} before the inputs do ($\\max_{t\\le t_0}|y_2-y_1|$ = ${num(pastErr)}) → **not causal**: the output reacted to a change that had not happened yet`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Definition',
      name: 'Memory and invertibility',
      statement: String.raw`A system is **memoryless** if the output at each time depends only on the input at that same time: $y(t)=f\big(x(t),t\big)$ for some function $f$. Otherwise it has **memory** (a delay, an average, an integrator, a capacitor). A system is **invertible** if distinct inputs always produce distinct outputs; then there is an **inverse system** $S^{-1}$ with $S^{-1}\{S\{x\}\}=x$ for every input. For example $y=2x$ is inverted by $x=y/2$, the accumulator $y(t)=\int_{-\infty}^tx$ by the differentiator $x=y'$, and the delay by the advance. The squarer is not invertible, because $x$ and $-x$ have the same output, and neither is the clipper, which cannot distinguish inputs that differ only beyond its limits.`,
      idea: String.raw`Both properties are about information. A memoryless time-invariant system applies one function $f$ pointwise, so every point $\big(x(t),y(t)\big)$ lies on the graph of $f$: one input value, one output value. With memory, the same input value can meet different outputs at different times, so the trace of $\big(x(t),y(t)\big)$ crosses some vertical line several times (for a time-varying memoryless system such as the modulator the trace fans out too, because $f$ itself changes with $t$). Invertibility asks the dual question, whether the output can be traced back; for a memoryless system it is the horizontal-line test on $f$, passed by $x^3$ and failed by $x^2$. Systems with memory can be invertible although they smooth heavily: the moving average and the RC filter are undone exactly by recursions that start from rest, and the accumulator by the first difference (sig-1.7, pma-6.20). For modulation $y(t)=x(t)\cos2\pi t$, division works away from carrier zeros; continuous inputs determine their values at the isolated zeros by limits. On unrestricted pointwise signals, changing only those values leaves the output unchanged. Invertible is not the same as robustly invertible, though: those inverses amplify noise enormously, which is why deconvolution is delicate (3.13).`,
      caption: String.raw`Pick a system and draw an input. Top: the input (blue), and either a different input with the same output (red dashed) or the input recovered by the inverse system (green dotted, every sample). Green arrows mark recovered samples beyond the vertical scale; orange ticks mark nonfinite samples, where the curve breaks. Bottom left: the output, and the red input's output on top of it. Bottom right: the trace of $\big(x(t),y(t)\big)$; drag the gold point. Its vertical line asks whether one input value meets several output values (memory), its horizontal line whether one output value comes from several input values (no inverse, for memoryless systems). Switch on the noise to see how hard an inverse has to work.`,
      deps: ['sig-2.1', 'sig-1.7', 'pma-6.20'],
      refs: ['Oppenheim–Willsky §1.6', 'Lathi ch. 1'],
      tags: ['memory', 'invertibility'],
      viz(v) {
        const M = v.M;
        const sel = v.select('system', menu(['gain', 'cube', 'square', 'clip', 'gate', 'delay', 'accum', 'mavg', 'rc', 'mod']), 'square');
        v.select('input', shapeMenu(['wiggle', 'pulse', 'sine', 'noise']), 'wiggle', { onChange: (k) => sig.set(SHAPES[k].f) });
        const noisy = v.toggle('add noise of size $10^{-3}$ to $y$ before inverting', false);
        const sIn = v.stage({ x: [-5.2, 5.2], y: [-1.9, 2.1], height: 180, axes: 'box', yticks: [-1, 0, 1], full: true, title: 'input $x$ (drag to redraw)' });
        const sOut = v.stage({ x: [-5.2, 5.2], y: [-1.9, 2.1], height: 255, axes: 'box', xlabel: 't', weight: 1.6, title: 'output $y=S\\{x\\}$' });
        const sTr = v.stage({ x: [-2, 2], y: [-2, 2], height: 255, axes: true, weight: 1, xlabel: 'x(t)', title: 'the trace of $(x(t),\\,y(t))$' });
        const sig = drawable(sIn, -4.8, 9.6, 576, SHAPES.wiggle.f, [-1.8, 2], { edge: 5.2 });
        const H = sTr.handle(0.6, 0.36, { color: 'gold', r: 6.5 });
        const rn = rand(11), NZ = Float64Array.from({ length: NG + 1 }, () => 1e-3 * (2 * rn() - 1));
        const F = { gain: (u) => 2 * u, cube: (u) => u ** 3, square: (u) => u * u, clip: (u) => Math.max(-1, Math.min(1, u)) };
        let info = null;
        v.render(() => {
          const sys = SYS[sel.value], x = sig.arr(), y = sys.run(x), r = rand(3);
          noisy.el.hidden = !sys.inverse;
          let x2 = null, y2 = null, xr = null;
          if (sys.pair) { x2 = sys.pair(x, r); y2 = sys.run(x2); }
          else if (sys.inverse) xr = sys.inverse(noisy.value ? combo(1, y, 1, NZ) : y);
          // ---- input
          sIn.hline(0, { color: 'faint', width: 1 });
          if (sys.id === 'gate') for (let k = -6; k <= 5; k++) sIn.rect(k + 0.5, -1.9, k + 1, 2.1, { fill: 'muted', fillAlpha: 0.08, stroke: false });
          if (sys.id === 'clip') sIn.hband(-1, 1, { color: 'green', alpha: 0.06, edges: true });
          sIn.path(pts(x, -5.2, 5.2), { color: 'accent', width: 2.4 });
          if (x2) sIn.clip(() => sIn.path(pts(x2, -5.2, 5.2), { color: 'red', width: 2, dash: [6, 4] }));
          let recovered=null;
          if (xr) {
            recovered=recoveryPlot(xr);
            sIn.clip(() => {
              sIn.path(recovered.points, { color: 'green', width: 2.6, dash: [2, 4] });
              for(const p of recovered.above)sIn.arrow(p.t,1.88,p.t,2.06,{color:'green',width:1.7,head:5});
              for(const p of recovered.below)sIn.arrow(p.t,-1.68,p.t,-1.86,{color:'green',width:1.7,head:5});
              for(const p of recovered.nonFinite){sIn.line(p.t,1.94,p.t,2.08,{color:'orange',width:2});sIn.line(p.t,-1.74,p.t,-1.88,{color:'orange',width:2});}
            });
            if(recovered.above.length+recovered.below.length+recovered.nonFinite.length)sIn.corner(`${recovered.above.length+recovered.below.length} recovered samples off scale; ${recovered.nonFinite.length} nonfinite`,'tl',{color:'green',size:11.5,plate:true});
          }
          // ---- output
          let ylo = 0, yhi = 0; for (let i = I0; i <= I1; i++) { ylo = Math.min(ylo, y[i]); yhi = Math.max(yhi, y[i]); }
          const yr = [Math.max(-14, Math.min(-0.3, 1.15 * ylo)), Math.min(14, Math.max(0.3, 1.15 * yhi))];
          if (y2) for (let i = I0; i <= I1; i++) { yr[0] = Math.max(-14, Math.min(yr[0], 1.15 * y2[i])); yr[1] = Math.min(14, Math.max(yr[1], 1.15 * y2[i])); }
          sOut.setView(null, [yr[0] - 0.12 * (yr[1] - yr[0]), yr[1]]);
          sOut.hline(0, { color: 'faint', width: 1 });
          sOut.clip(() => sOut.path(pts(y, -5.2, 5.2), { color: 'purple', width: 2.6 }));
          if (y2) sOut.clip(() => sOut.path(pts(y2, -5.2, 5.2), { color: 'red', width: 1.8, dash: [6, 4] }));
          // ---- trace
          const P0 = pts(x, -5.2, 5.2, 1).map((p) => (p ? [p[1], y[iOf(p[0])]] : null));
          const xm = Math.max(1, 1.15 * maxAbs(x)), ym = Math.max(Math.abs(yr[0]), yr[1]);
          sTr.setView([-xm, xm], [yr[0] - 0.12 * (yr[1] - yr[0]), yr[1]]);
          if (F[sys.id]) sTr.fn(F[sys.id], { color: 'muted', width: 1.2, dash: [4, 4] });
          // a jump of x(t) or y(t) between two samples is a discontinuity, not a stretch of values actually taken: break the trace there
          const jx = 0.04 * 2 * xm, jy = 0.04 * (yr[1] - yr[0]), P = [];
          for (let k = 0; k < P0.length; k++) { const p = P0[k], q = P0[k - 1]; if (p && q && (Math.abs(p[0] - q[0]) > jx || Math.abs(p[1] - q[1]) > jy)) P.push(null); P.push(p); }
          sTr.clip(() => sTr.path(P, { color: 'purple', width: 1.8 }));
          const cx = M.clamp(H.x, -xm, xm), cy = M.clamp(H.y, yr[0], yr[1]);
          if (cx !== H.x || cy !== H.y) H.set(cx, cy);
          sTr.vline(cx, { color: 'orange', width: 1.2, dash: [5, 4] }); sTr.hline(cy, { color: 'teal', width: 1.2, dash: [5, 4] });
          // crossings of the trace with the two lines
          const vx = [], hy = [];
          for (let k = 0; k + 1 < P.length; k++) {
            const p = P[k], q = P[k + 1]; if (!p || !q) continue;
            if ((p[0] - cx) * (q[0] - cx) < 0 || (p[0] === cx && q[0] !== cx)) { const f = (cx - p[0]) / (q[0] - p[0]); vx.push(p[1] + f * (q[1] - p[1])); }
            if ((p[1] - cy) * (q[1] - cy) < 0 || (p[1] === cy && q[1] !== cy)) { const f = (cy - p[1]) / (q[1] - p[1]); hy.push(p[0] + f * (q[0] - p[0])); }
          }
          const dist = (arr) => { const s = arr.slice().sort((a, b) => a - b), out = []; for (const u of s) if (!out.length || u - out[out.length - 1] > 0.02 * ym) out.push(u); return out; };
          const vy = dist(vx), hx = dist(hy);
          for (const u of vy) sTr.dot(cx, u, { color: 'orange', r: 4 });
          for (const u of hx) sTr.dot(u, cy, { color: 'teal', r: 4 });
          info = {
            sys, vy, hx, cx, cy, err: xr ? maxDiff(x, xr) : null, sc: maxAbs(x), recovered,
            dIn: x2 ? maxDiff(x, x2) : null, dOut: y2 ? maxDiff(y, y2, 0, NG) : null,
          };
        });
        v.legend([['accent', 'input $x$'], ['purple', 'output $y$ and the trace'], ['red', "another input $x'$ with the same output", { dash: true }], ['green', 'recovered $S^{-1}\\{y\\}$', { dash: true }], ['orange', 'outputs met at one input value', { dot: true }], ['teal', 'inputs giving one output value', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { sys, vy, hx, cx, cy, err, sc, dIn, dOut, recovered } = info;
          const tv = sys.id === 'mod' || sys.id === 'gate';
          const mem = vy.length <= 1
            ? `vertical line $x$ = ${v.fix(cx, 2)}: ${vy.length ? `one output value, ${v.fix(vy[0], 3)}` : 'not met'}`
            : vy.every((u) => Math.abs(u - vy[0]) < 0.02 * Math.max(1, Math.abs(vy[0]))) ? `vertical line $x$ = ${v.fix(cx, 2)}: always the output ${v.fix(vy[0], 3)}`
              : `vertical line $x$ = ${v.fix(cx, 2)} meets outputs ${vy.slice(0, 4).map((u) => v.fix(u, 2)).join(', ')}${vy.length > 4 ? ', …' : ''}: ${tv ? 'here because the rule changes with $t$ (the system is memoryless but time-varying)' : '**memory**: the same input value gave different outputs at different times'}`;
          let inv;
          if (dIn != null) inv = `**not invertible**: the red input differs from $x$ by up to ${v.fix(dIn, 2)}, yet the outputs differ by ${dOut === 0 ? '0' : num(dOut)} (${sys.pairTex ? `$${sys.pairTex}$` : ''})`;
          else {
            const label=sys.id==='mod'?'**invertible on continuous inputs**':'**invertible**';
            const note=sys.id==='mod'?'divide away from carrier zeros and use limits for a noiseless continuous input':sys.invNote;
            inv = noisy.value
              ? `${label}: $S^{-1}$: $${sys.invTex}$${note ? ` (${note})` : ''}; with noise of size $10^{-3}$ added to $y$, the recovered input is off by up to ${num(err)}, an amplification of about ${num(err / 1e-3)}×`
              : `${label}: $S^{-1}$: $${sys.invTex}$${note ? ` (${note})` : ''} recovers $x$ with max error $${errTex(err <= 1e-12 * Math.max(1, sc) ? 0 : err)}$`;
            if(recovered&&(recovered.above.length+recovered.below.length+recovered.nonFinite.length))inv+=` · all recovered samples are plotted: ${recovered.above.length+recovered.below.length} off scale (green arrows), ${recovered.nonFinite.length} nonfinite (orange ticks)`;
            if(sys.id==='mod'&&noisy.value)inv+=' · division at carrier zeros is undefined, and nearby division amplifies noise; the huge finite values here depend on floating-point roundoff, not a finite inverse-error bound';
          }
          const hor = !tv && ['gain', 'cube', 'square', 'clip'].includes(sys.id) ? ` · horizontal line $y$ = ${v.fix(cy, 2)}: ${hx.length === 0 ? 'not met' : `${hx.length} input value${hx.length > 1 ? 's' : ''} (${hx.slice(0, 4).map((u) => v.fix(u, 2)).join(', ')}${hx.length > 4 ? ', …' : ''})`}` : '';
          return `$${sys.tex}$ · ${mem}${hor} · ${inv}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Definition',
      name: 'BIBO stability',
      statement: String.raw`A system is **bounded-input bounded-output (BIBO) stable** if every bounded input produces a bounded output: whenever $|x(t)|\le B$ for all $t$, there is a constant $C$, depending on $B$, with $|y(t)|\le C$ for all $t$. On the bench: the amplifier $2x$ has $C=2B$, the squarer $C=B^2$, the clipper $C=\min(B,1)$, the moving average and the RC filter $y'+y=x$ have $C=B$. The accumulator $y(t)=\int_{-\infty}^tx$ is unstable, since the bounded step $u(t)$ produces the ramp $t\,u(t)$, and so is $y(t)=t\,x(t)$. The first-order system $y'=py+x$, started from rest, is stable exactly when $p<0$, with $C=B/|p|$.`,
      idea: String.raw`Stability is a guarantee about all bounded inputs at once, so one bounded input whose output escapes refutes it, and a bound proves it. For the first-order system $y(t)=\int_{-\infty}^te^{p(t-s)}x(s)\,ds$, hence $|y(t)|\le B\int_0^\infty e^{pu}\,du=B/|p|$ when $p<0$. At $p=0$ that integral diverges and the step is the witness; for $p>0$ the response to any input that does not happen to cancel grows like $e^{pt}$. Not every bounded input exposes an unstable system: a sinusoid fed into the accumulator gives a bounded output, and a random $\pm B$ input makes it wander like a random walk, so its largest excursion grows only like $\sqrt t$, unbounded but slowly. For linear time-invariant systems the question reduces to whether $\int|h|$ is finite (3.6).`,
      caption: String.raw`Choose a system and a bounded input with $|x|\le B$ (green band, top). Middle: the output over a long stretch of time, with the guaranteed band $|y|\le C$ for the stable systems. Right: the largest $|y|$ seen up to time $T$, on log–log axes, which levels off below $C$ for a stable system and keeps climbing for an unstable one (the dashed guides have slope 1, growth like $T$, and slope ½, like $\sqrt T$). Drag $p$ across zero for $y'=py+x$; feed the accumulator a sinusoid, then a step.`,
      deps: ['sig-2.1', 'ode-1.4'],
      refs: ['Oppenheim–Willsky §1.6', 'Lathi ch. 2'],
      tags: ['stability', 'BIBO'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/BIBO_stability' },
      viz(v) {
        const M = v.M, TE = 100, h = 0.02, N = Math.round(TE / h);
        const LIST = { accum: 'accumulator', rc: 'RC filter', fo: "$y'=py+x$", mavg: 'average', clip: 'clipper', square: '$x^2$', tx: '$t\\,x(t)$' };
        const sel = v.select('system', Object.entries(LIST).map(([value, label]) => ({ value, label })), 'accum');
        const pS = v.slider('$p$', -1.5, 0.3, -0.25, { step: 0.01 });
        const inp = v.select('bounded input', [{ value: 'rand', label: 'random $\\pm B$' }, { value: 'step', label: 'step' }, { value: 'sine', label: 'sinusoid' }], 'rand');
        const BS = v.slider('bound $B$', 0.2, 1.5, 1, { step: 0.05 });
        let seed = 1;
        v.button('New random input', () => { seed++; });
        const sX = v.stage({ x: [0, TE], y: [-1.8, 1.8], height: 125, axes: 'box', yticks: [-1, 0, 1], full: true, title: 'input $x(t)$ with $|x|\\le B$' });
        const sY = v.stage({ x: [0, TE], y: [-2, 2], height: 240, axes: 'box', xlabel: 't', weight: 1.65, title: 'output $y(t)$' });
        const sM = v.stage({ x: [0.5, TE], y: [1e-2, 1e3], xlog: true, ylog: true, height: 240, weight: 1, xlabel: 'T', title: '$\\max_{t\\le T}|y(t)|$' });
        let run = { key: '' };
        const simulate = () => {
          const id = sel.value, p = id === 'accum' ? 0 : id === 'rc' ? -1 : pS.value, B = BS.value, key = `${id}|${p}|${inp.value}|${B}|${seed}`;
          if (key === run.key) return run;
          const r = rand(seed * 13 + 1), x = new Float64Array(N + 1), y = new Float64Array(N + 1);
          let sgn = r.pm(), next = r.u(0.3, 2);
          for (let i = 0; i <= N; i++) { const t = i * h; if (inp.value === 'rand') { while (t >= next) { sgn = -sgn; next += r.u(0.3, 2); } x[i] = B * sgn; } else x[i] = inp.value === 'step' ? B : B * Math.sin(0.7 * t); }
          if (['accum', 'rc', 'fo'].includes(id)) { const a = Math.exp(p * h), c = Math.abs(p) < 1e-12 ? h : (a - 1) / p; let s = 0; for (let i = 0; i <= N; i++) { s = a * s + c * x[i]; y[i] = s; } }
          else if (id === 'mavg') { const m = Math.round(1 / h); let s = 0; for (let i = 0; i <= N; i++) { s += x[i] - (i >= m ? x[i - m] : 0); y[i] = s / m; } }
          else for (let i = 0; i <= N; i++) y[i] = id === 'clip' ? Math.max(-1, Math.min(1, x[i])) : id === 'square' ? x[i] * x[i] : i * h * x[i];
          const run1 = new Float64Array(N + 1); let m = 0; for (let i = 0; i <= N; i++) { m = Math.max(m, Math.abs(y[i])); run1[i] = m; }
          const C = id === 'clip' ? Math.min(B, 1) : id === 'square' ? B * B : id === 'mavg' ? B : ['accum', 'rc', 'fo'].includes(id) && p < -1e-9 ? B / -p : null;
          // growth exponent of the running max between T = 10 and T = 100
          const g = run1[N] > 0 && run1[Math.round(10 / h)] > 0 ? Math.log10(run1[N] / run1[Math.round(10 / h)]) : 0;
          return (run = { key, id, p, B, x, y, run1, C, g });
        };
        v.render(() => {
          const id = sel.value; pS.el.hidden = id !== 'fo';
          const { p, B, x, y, run1, C, g } = simulate(), step = 4;
          // ---- input
          sX.setView(null, [-1.95 * Math.max(B, 1), 1.6 * Math.max(B, 1)]);
          sX.hband(-B, B, { color: 'green', alpha: 0.1, edges: true });
          const XP = []; for (let i = 0; i <= N; i += 2) XP.push([i * h, x[i]]); sX.path(XP, { color: 'accent', width: 1.4 });
          // ---- output
          const top = run1[N]; let ylo = 0, yhi = 0; for (let i = 0; i <= N; i += 2) { ylo = Math.min(ylo, y[i]); yhi = Math.max(yhi, y[i]); }
          if (C != null) { ylo = Math.min(ylo, -C); yhi = Math.max(yhi, C); }
          const pad = 0.12 * Math.max(0.5, yhi - ylo);
          sY.setView(null, [ylo - pad, yhi + pad * (C != null ? 1.8 : 1)]);
          sY.hline(0, { color: 'faint', width: 1 });
          if (C != null) sY.hband(-C, C, { color: 'green', alpha: 0.1, edges: true });
          const YP = []; for (let i = 0; i <= N; i += step) YP.push([i * h, y[i]]); sY.path(YP, { color: 'purple', width: 1.8 });
          if (C != null) sY.text(`|y| ≤ C = ${v.fix(C, 2)}`, TE, C, { dx: -6, dy: -9, align: 'right', color: 'green', size: 12, weight: 600 });
          // ---- running max on log–log axes
          const MP = []; for (let i = Math.round(0.5 / h); i <= N; i += 2) MP.push([i * h, Math.max(run1[i], 1e-9)]);
          const lo = Math.max(1e-3, Math.min(B * 0.3, run1[Math.round(0.5 / h)] * 0.5)), hi = Math.max(10 * B, top * 3, (C ?? 0) * 3);
          sM.setView([0.5, TE], [lo, hi]);
          sM.clip(() => { sM.fn((T) => B * T, { color: 'muted', width: 1, dash: [4, 4] }); sM.fn((T) => B * Math.sqrt(T), { color: 'muted', width: 1, dash: [2, 4] }); });
          if (C != null) sM.hline(C, { color: 'green', width: 1.4, dash: [6, 4] });
          sM.clip(() => sM.path(MP, { color: 'purple', width: 2.4 }));
          const T1 = Math.min(0.6 * TE, (0.45 * hi) / B), T2 = Math.min(0.6 * TE, (0.45 * hi / B) ** 2);
          if (T1 > 0.8) sM.text('∝ T', T1, B * T1, { dx: -6, dy: -2, color: 'muted', size: 11, align: 'right' });
          if (T2 > 0.8) sM.text('∝ √T', T2, B * Math.sqrt(T2), { dx: 4, dy: -9, color: 'muted', size: 11, align: 'center' });
          void p; void g;
        });
        v.legend([['accent', 'input $x$'], ['purple', 'output $y$ and its running maximum'], ['green', 'the bound $C$ (stable systems)', { area: true }], ['muted', 'guides $BT$ and $B\\sqrt T$', { dash: true }]]);
        v.readout(() => {
          const { id, p, B, run1, C, g } = run; if (!run1) return '';
          const sup = run1[N];
          const name = id === 'fo' ? `$y'=py+x$ with $p$ = ${v.fix(p, 2)}` : id === 'accum' ? 'accumulator ($p=0$)' : id === 'rc' ? 'RC filter ($p=-1$)' : `$${SYS[id].tex}$`;
          const head = `${name} · $\\sup|x|$ = $B$ = ${v.fix(B, 2)}, $\\max_{t\\le100}|y|$ = ${num(sup)}`;
          if (C != null) return `${head} ≤ $C$ = ${v.fix(C, 3)}${id === 'fo' || id === 'rc' ? ` $=B/|p|$` : ''} · **stable**: no bounded input can push $|y|$ past $C$`;
          if (id === 'fo' && p > 1e-9) return `${head} · **unstable**: with $p>0$ the response grows like $e^{pt}$; the running maximum gained ${v.fix(g, 1)} decades between $T=10$ and $T=100$`;
          if (id === 'tx') return `${head} · **unstable**: $|y(t)|=t\\,|x(t)|$ grows with $t$ for any input that does not die out`;
          const kind = inp.value === 'step' ? `the step gives the ramp $y=Bt$, which passes any bound $M$ at $t=M/B$ (e.g. $M=10^6$ at $t$ = ${num(1e6 / B)})` : inp.value === 'rand' ? `the random input makes $y$ wander like a random walk: the running maximum grew by a factor $10^{${v.fix(g, 2)}}$ over the last decade of $T$ (on average a random walk's maximum grows like $\\sqrt T$, exponent ½): unbounded, but slowly` : 'this bounded input happens to give a bounded output, since $\\int\\sin$ is bounded, but a single bad input (try the step) is enough to make a system unstable';
          return `${head} · **unstable**: ${kind}`;
        });
      },
    },
  ],
};
